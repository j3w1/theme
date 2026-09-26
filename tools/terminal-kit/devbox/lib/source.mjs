/* Pinned source resolution for the devbox kit. Everything the kit writes is
   derived from exports/tokens.resolved.json at the pinned revision, read from
   a checkout that contains the commit (git show) or from raw.githubusercontent
   after the tag has been checked against the GitHub API. The export's bytes
   are checked against exports/digests.json, and against the digest kit.json
   (or the installed pin) records for that revision, before a single value is
   used. */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const KIT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const KIT_PREFIX = "tools/terminal-kit";
export const DEFAULT_SOURCE_ROOT = path.resolve(KIT_DIR, "..", "..");

const KIT_FILES = ["kit.json", "roles/claude-code.json", "roles/codex.json", "roles/terminal.json", "specimen.json"];
const TAG = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const REVISION = /^[0-9a-f]{40}$/;
const HEX6 = /^#[0-9a-f]{6}$/;

export class KitError extends Error {}

export const sha256Base64 = (bytes) => `sha256-${createHash("sha256").update(Buffer.from(bytes).toString("utf8").replaceAll("\r\n", "\n")).digest("base64")}`;
export const sha256Hex = (bytes) => createHash("sha256").update(bytes).digest("hex");

const git = (root, args) => execFileSync("git", ["-C", root, ...args], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });

const hasCommit = (root, revision) => {
  try {
    git(root, ["cat-file", "-e", `${revision}^{commit}`]);
    return true;
  } catch {
    return false;
  }
};

const localTag = (root, ref) => {
  try {
    return git(root, ["rev-parse", "--verify", "--quiet", `refs/tags/${ref}^{commit}`]).toString().trim() || null;
  } catch {
    return null;
  }
};

const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key]);

export const FETCH_TIMEOUT_MS = 20000;

/* One GET with a deadline for the whole exchange, body included. A 404 is
   `null`; every other failure is a KitError that names the URL. */
export const fetchText = async (url, accept, { timeoutMs = FETCH_TIMEOUT_MS } = {}) => {
  try {
    const response = await fetch(url, { headers: { "user-agent": "j3w1-terminal-kit", ...(accept ? { accept } : {}) }, signal: AbortSignal.timeout(timeoutMs) });
    if (response.status === 404) return null;
    if (!response.ok) throw new KitError(`GET ${url} failed: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (error instanceof KitError) throw error;
    if (error?.name === "TimeoutError") throw new KitError(`GET ${url} timed out after ${timeoutMs / 1000} s; check the network, or pass --source-root <checkout> to read a local clone`);
    throw new KitError(`GET ${url} failed: ${error?.cause?.message ?? error?.message ?? error}`);
  }
};

const fetchJson = async (url) => {
  const bytes = await fetchText(url, "application/vnd.github+json");
  if (!bytes) throw new KitError(`GET ${url} failed: 404`);
  return JSON.parse(bytes.toString("utf8"));
};

/* A tag resolves to one commit; annotated tags are dereferenced once. */
export const resolveTagRemote = async (kit, ref) => {
  const url = fill(kit.urls.tagRef, { repository: kit.theme.repository, ref });
  const body = await fetchJson(url);
  if (body.object?.type === "tag") {
    const tag = await fetchJson(body.object.url);
    return tag.object.sha;
  }
  return body.object?.sha;
};

export const assertTag = (ref) => {
  if (!TAG.test(ref ?? "")) throw new KitError(`refusing ref "${ref}": pass an explicit release tag such as v1.2.0 (never a branch, "main" or "latest")`);
};

/* A reader bound to one revision: git show from a checkout that holds the
   commit, else the raw URL after the tag has been checked remotely. */
export const openRevision = async ({ kit, ref, revision, sourceRoot = DEFAULT_SOURCE_ROOT, offline = false }) => {
  if (!REVISION.test(revision ?? "")) throw new KitError(`revision must be a full 40-character commit, got "${revision}"`);
  if (existsSync(sourceRoot) && hasCommit(sourceRoot, revision)) {
    const tagged = ref && ref !== "commit" ? localTag(sourceRoot, ref) : null;
    if (tagged && tagged !== revision) throw new KitError(`tag ${ref} is ${tagged} in ${sourceRoot}, not the pinned ${revision}`);
    return {
      via: "git",
      where: sourceRoot,
      tagCheck: tagged ? "local tag matches" : "commit present; tag not in this checkout",
      read: async (file) => {
        try {
          return git(sourceRoot, ["show", `${revision}:${file}`]);
        } catch {
          return null;
        }
      },
    };
  }
  if (offline) throw new KitError(`${sourceRoot} does not contain ${revision} and --source-root forbids the network`);
  if (ref && ref !== "commit") {
    const sha = await resolveTagRemote(kit, ref);
    if (sha !== revision) throw new KitError(`tag ${ref} resolves to ${sha} on GitHub, not the pinned ${revision}`);
  }
  return {
    via: "network",
    where: `raw.githubusercontent.com/${kit.theme.repository}/${revision}`,
    tagCheck: "GitHub API tag matches",
    read: (file) => fetchText(fill(kit.urls.raw, { repository: kit.theme.repository, revision, path: file })),
  };
};

const readLocalKit = () => Object.fromEntries(KIT_FILES.map((f) => [f, readFileSync(path.join(KIT_DIR, f))]));

const parseKitFiles = (files) => {
  const json = (f) => JSON.parse(Buffer.from(files[f]).toString("utf8"));
  return {
    kit: json("kit.json"),
    roles: { "claude-code": json("roles/claude-code.json"), codex: json("roles/codex.json"), terminal: json("roles/terminal.json") },
    specimen: json("specimen.json"),
  };
};

/* The kit files at a revision, if that revision carries them; otherwise the
   files this checkout runs. */
export const kitFilesAt = async (reader) => {
  const files = {};
  for (const f of KIT_FILES) {
    const bytes = await reader.read(`${KIT_PREFIX}/${f}`);
    if (!bytes) return null;
    files[f] = bytes;
  }
  return files;
};

export const localKit = () => parseKitFiles(readLocalKit());

/* Resolves one token id under the kit's eligibility rules; use-and-report
   disclosures are collected per integration by the generators. */
export const makeResolver = (kit, tokens) => {
  const { allowedActions, forbiddenPrefixes } = kit.eligibility;
  const token = (id) => {
    if (forbiddenPrefixes.some((p) => id.startsWith(p))) throw new KitError(`${id}: primitives are never consumed`);
    const t = tokens[id];
    if (!t) throw new KitError(`${id} is not in the pinned ${kit.theme.profile} profile`);
    const action = t.eligibility?.action;
    if (!allowedActions.includes(action)) throw new KitError(`${id} is ${action} in the pinned profile: ${t.eligibility?.reason ?? ""}`);
    return t;
  };
  const color = (id) => {
    const t = token(id);
    const css = String(t.css ?? "").toLowerCase();
    if (t.type !== "color" || !HEX6.test(css)) throw new KitError(`${id} is not an opaque #rrggbb colour (${t.type} ${t.css})`);
    return css;
  };
  return { token, color };
};

/* The full context every generator and command works from. `pin` may carry
   the tokensDigest recorded when it was installed. */
export const loadContext = async ({ pin, kitSource = "local", sourceRoot = DEFAULT_SOURCE_ROOT, offline = false } = {}) => {
  let parsed = localKit();
  const local = parsed.kit;
  const { tokensDigest: pinnedDigest, ...pinTheme } = pin ?? {};
  const theme = { ...parsed.kit.theme, ...pinTheme };
  const reader = await openRevision({ kit: parsed.kit, ref: theme.ref, revision: theme.revision, sourceRoot, offline });
  let kitFrom = "local";
  if (kitSource === "revision") {
    const files = await kitFilesAt(reader);
    if (files) {
      parsed = parseKitFiles(files);
      kitFrom = theme.revision;
    }
  }
  const { kit, roles, specimen } = parsed;
  const tokensPath = kit.exports.tokens;
  const digestsPath = kit.exports.digests;
  const tokenBytes = await reader.read(tokensPath);
  const digestBytes = await reader.read(digestsPath);
  if (!tokenBytes || !digestBytes) throw new KitError(`${tokensPath} or ${digestsPath} is missing at ${theme.revision}`);
  const digests = JSON.parse(digestBytes.toString("utf8"));
  const digest = sha256Base64(tokenBytes);
  if (digests.files?.[tokensPath] !== digest) throw new KitError(`${tokensPath} at ${theme.revision} does not match digests.json (${digest})`);
  /* The digest a kit.json records applies to the revision that kit.json
     pins; an installed pin carries the digest it was installed with. */
  const expected = [
    ...[local, kit].filter((k) => k.theme.revision === theme.revision && k.exports.tokensDigest).map((k) => ["kit.json", k.exports.tokensDigest]),
    ...(pinnedDigest ? [["the installed pin", pinnedDigest]] : []),
  ];
  for (const [from, want] of expected) if (digest !== want) throw new KitError(`${tokensPath} at ${theme.revision} is ${digest}, not the ${want} ${from} records; refusing`);
  const resolved = JSON.parse(tokenBytes.toString("utf8"));
  const profile = resolved.profiles?.[theme.profile];
  if (!profile) throw new KitError(`profile ${theme.profile} is not in the export at ${theme.revision}`);
  if (theme.version && resolved.version !== theme.version) throw new KitError(`export version ${resolved.version} is not the pinned ${theme.version}`);
  return {
    kit,
    roles,
    specimen,
    theme: { ...theme, version: resolved.version },
    source: { via: reader.via, where: reader.where, tagCheck: reader.tagCheck, kitFrom, digestCheck: expected.length ? `digest pinned by ${[...new Set(expected.map(([from]) => from))].join(" and ")}` : "digests.json only: nothing pins a digest for this revision" },
    exports: { [tokensPath]: digest },
    tokensDigest: digest,
    tokens: profile.tokens,
    resolver: makeResolver(kit, profile.tokens),
  };
};
