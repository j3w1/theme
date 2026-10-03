#!/usr/bin/env node
// Proposes generated changes for an npm Dependabot PR. Never stages in the
// checkout's index or changes the PR; the patch is not a compatibility check.

import { execFileSync } from "node:child_process";
import { appendFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SHA = /^[0-9a-f]{40}$/;
const generatedFiles = new Set([
  "README.md", "agents/consume.md", "packages/ui/README.md",
  "ports/README.md", "ports/chatgpt/README.md", "ports/claude-code/README.md",
  "ports/codex/README.md", "ports/orca/README.md", "ports/orca/install/specimen.json",
  "ports/telegram/README.md", "ports/telegram/IMPLEMENTATION.md",
  "site/src/styles/tokens.generated.css",
]);

export const isGenerated = (file) => generatedFiles.has(file) ||
  /^(?:exports|schemas\/json|packages\/ui\/dist)\/.+/.test(file) ||
  /^ports\/[^/]+\/dist\/.+/.test(file);

export const isNpmBump = (paths, workspaces) => paths.some((file) =>
  file === "package.json" || file === "package-lock.json" || workspaces.some((workspace) => file === `${workspace}/package.json`));

const git = (dir, args, options = {}) => execFileSync("git", args, { cwd: dir, maxBuffer: 64 * 1024 * 1024, ...options });
const lines = (bytes) => bytes.toString("utf8").split("\0").filter(Boolean);
const sha = (dir, ref) => git(dir, ["rev-parse", "--verify", `${ref}^{commit}`]).toString("utf8").trim();

export function prPaths(dir, base, head) {
  if (!SHA.test(base) || !SHA.test(head) || sha(dir, "HEAD") !== head) throw new Error("Expected the exact PR head and a 40-character base SHA");
  const fork = git(dir, ["merge-base", base, head]).toString("utf8").trim();
  return lines(git(dir, ["diff", "--name-only", "--no-renames", "-z", fork, head]));
}

export const workspacesOf = (dir) => JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8")).workspaces ?? [];

export function refresh(dir, { run = (args) => execFileSync("npm", args, { cwd: dir, stdio: "inherit" }), patchFile }) {
  if (git(dir, ["status", "--porcelain", "-z", "--untracked-files=all"]).length) throw new Error("Checkout is not clean before regeneration");
  run(["run", "generate"]);
  run(["run", "check"]);
  const changed = [...new Set([
    ...lines(git(dir, ["diff", "--name-only", "--no-renames", "-z", "HEAD"])),
    ...lines(git(dir, ["ls-files", "--others", "--exclude-standard", "-z"])),
  ])].sort();
  const unexpected = changed.filter((file) => !isGenerated(file));
  if (unexpected.length) throw new Error(`Regeneration changed unexpected paths: ${unexpected.join(", ")}`);
  if (!changed.length) return { changed, patch: false };

  // A private, temporary index captures additions and deletions as well as
  // tracked edits. --binary makes the resulting patch usable for any output.
  mkdirSync(path.join(dir, ".cache"), { recursive: true });
  const indexDir = mkdtempSync(path.join(dir, ".cache", "dependabot-index-"));
  try {
    const env = { ...process.env, GIT_INDEX_FILE: path.join(indexDir, "index") };
    git(dir, ["read-tree", "HEAD"], { env });
    git(dir, ["add", "-A", "--", ...changed], { env });
    const patch = git(dir, ["diff", "--cached", "--binary", "--no-ext-diff", "--no-renames", "HEAD", "--", ...changed], { env });
    if (!patch.length) throw new Error("Changed generated files produced an empty patch");
    mkdirSync(path.dirname(patchFile), { recursive: true });
    writeFileSync(patchFile, patch);
    return { changed, patch: true };
  } finally {
    rmSync(indexDir, { recursive: true, force: true });
  }
}

function main(argv) {
  const arg = (name) => { const i = argv.indexOf(`--${name}`); return i < 0 ? undefined : argv[i + 1]; };
  const base = arg("base"), head = arg("head");
  const paths = prPaths(root, base, head);
  const eligible = isNpmBump(paths, workspacesOf(root));
  if (argv.includes("--classify")) {
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `eligible=${eligible}\n`);
    if (!eligible && process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Dependabot npm refresh\n\nNo npm manifest or lockfile changed at \`${head}\`; no patch is needed.\n`);
    return;
  }
  if (!eligible) throw new Error("Not an npm manifest/lockfile bump");
  const patchFile = path.resolve(root, ".cache/dependabot-refresh.patch");
  try {
    const result = refresh(root, { patchFile });
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `patch=${result.patch}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, result.patch
      ? `### Dependabot npm refresh\n\n${result.changed.length} generated paths changed at PR head \`${head}\`. Download artifact \`dependabot-generated-patch\`, check out that exact head, then run \`git apply --check dependabot-refresh.patch && git apply dependabot-refresh.patch\`. Review and run selected CI checks; this patch is not evidence of compatibility.\n`
      : `### Dependabot npm refresh\n\nNo generated drift at PR head \`${head}\`; no patch is needed. Selected checks still determine compatibility.\n`);
  } catch (error) {
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Dependabot npm refresh failed\n\nRegeneration or generated-file checking failed at PR head \`${head}\`: ${error.message}. No patch was published; investigate the failing job and selected checks.\n`);
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error); process.exitCode = 1; }
}
