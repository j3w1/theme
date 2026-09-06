/* Filesystem helpers shared by validators, generators and tests. Generated
   output goes through writeOrCheck so `--check` can compare bytes without
   touching the tree. */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const readText = async (relative) => (await fs.readFile(path.join(repoRoot, relative), "utf8")).replaceAll("\r\n", "\n");

export const readJson = async (relative) => JSON.parse(await readText(relative));

export const exists = async (relative) => {
  try {
    await fs.access(path.join(repoRoot, relative));
    return true;
  } catch {
    return false;
  }
};

/* Recursive listing, repo-relative POSIX paths, sorted. */
export const listFiles = async (relativeDir, { filter = () => true } = {}) => {
  const root = path.join(repoRoot, relativeDir);
  const out = [];
  const walk = async (dir) => {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else {
        const rel = path.relative(repoRoot, full).split(path.sep).join("/");
        if (filter(rel)) out.push(rel);
      }
    }
  };
  await walk(root);
  return out.sort();
};

/* Files git knows about (tracked + untracked-not-ignored), repo-relative. */
export const gitFiles = () =>
  execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: repoRoot, encoding: "utf8" })
    .split("\0")
    .filter(Boolean)
    .sort();

/* Deterministic JSON: two-space indent, trailing newline, keys in the order
   the caller built them (order is semantic for token files and tables). */
export const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

export const sha256 = (content) => `sha256-${createHash("sha256").update(content).digest("base64")}`;

/* Writes `content` to `relative`, or in check mode reports whether the
   committed copy differs. Returns true when the file was (or would be)
   changed. */
export const writeOrCheck = async (relative, content, { check = false } = {}) => {
  const file = path.join(repoRoot, relative);
  let current = null;
  try {
    current = (await fs.readFile(file, "utf8")).replaceAll("\r\n", "\n");
  } catch {
    current = null;
  }
  if (current === content) return false;
  if (!check) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content);
  }
  return true;
};

/* Removes (or in check mode reports) files under `relativeDir` that the
   generator did not produce this run. */
export const pruneOrphans = async (relativeDir, produced, { check = false, filter = () => true } = {}) => {
  const keep = new Set(produced);
  const orphans = (await listFiles(relativeDir, { filter })).filter((f) => !keep.has(f));
  if (!check) for (const orphan of orphans) await fs.unlink(path.join(repoRoot, orphan));
  return orphans;
};

/* Replaces the block between `<!-- name:start -->` and `<!-- name:end -->`
   in a Markdown file. */
export const replaceMarkerBlock = (source, name, body) => {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const a = source.indexOf(start);
  const b = source.indexOf(end);
  if (a < 0 || b < 0 || b < a) throw new Error(`missing ${start} … ${end} markers`);
  return `${source.slice(0, a + start.length)}\n${body.trim()}\n${source.slice(b)}`;
};
