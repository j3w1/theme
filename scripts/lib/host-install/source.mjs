/* Where the devbox installers take their values from. Every value comes from
   one commit of this repository: exports/tokens.resolved.json, the host maps
   (ports/<app>/host.json) and the specimen, all read at that commit and
   never from the working tree. The commit is this checkout's HEAD, an exact
   commit (apply --revision) or a release tag (update --version). Files are
   read from git objects when the checkout holds the commit, otherwise from
   raw.githubusercontent.com at the commit SHA. The export is checked against
   exports/digests.json at the same commit, and against the digest an
   installed pin recorded, before a single value is used. */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FIRST_INSTALLER_TAG } from "../../../schemas/theme.mjs";

export const DEFAULT_SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const INSTALLER_ID = "j3w1-theme-installer";
export const THEME = "j3w1-theme";
export const REPOSITORY = "j3w1/theme";
export const PROFILE = "default";
export { FIRST_INSTALLER_TAG };
export const TOKENS = "exports/tokens.resolved.json";
export const DIGESTS = "exports/digests.json";
export const HOST_FILES = { "claude-code": "ports/claude-code/host.json", codex: "ports/codex/host.json", terminal: "ports/orca/host.json" };
export const SPECIMEN = "ports/orca/install/specimen.json";
/* Consume roles within their documented scope, never primitives
   (agents/consume.md). use-and-report roles are disclosed with their
   decision ids. */
export const ELIGIBILITY = { allowedActions: ["use", "use-and-report"], forbiddenPrefixes: ["color.primitive."] };
const TAG_REF_URL = `https://api.github.com/repos/${REPOSITORY}/git/ref/tags/{ref}`;
const RAW_URL = `https://raw.githubusercontent.com/${REPOSITORY}/{revision}/{path}`;

const TAG = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const REVISION = /^[0-9a-f]{40}$/;
const HEX6 = /^#[0-9a-f]{6}$/;

export class KitError extends Error {}

export const sha256Base64 = (bytes) => `sha256-${createHash("sha256").update(Buffer.from(bytes).toString("utf8").replaceAll("\r\n", "\n")).digest("base64")}`;
export const sha256Hex = (bytes) => createHash("sha256").update(bytes).digest("hex");

const git = (root, args) => execFileSync("git", ["-C", root, ...args], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
const gitText = (root, args) => {
  try {
    return git(root, args).toString().trim() || null;
  } catch {
    return null;
  }
};

const hasCommit = (root, revision) => gitText(root, ["cat-file", "-t", `${revision}^{commit}`]) === "commit";

export const localTag = (root, ref) => gitText(root, ["rev-parse", "--verify", "--quiet", `refs/tags/${ref}^{commit}`]);

const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key]);

const semver = (v) => String(v ?? "").replace(/^v/, "").split(/[.-]/).slice(0, 3).map(Number);
/* a > b as release versions (major, minor, patch). */
export const newer = (a, b) => {
  const [x, y] = [semver(a), semver(b)];
  for (let i = 0; i < 3; i += 1) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

/* A commit and the newest release tag in this checkout that names it; the
   commit itself stands for the ref when no tag does. */
export const describeRevision = (root, revision) => {
  const tags = (gitText(root, ["tag", "--points-at", revision]) ?? "").split("\n").filter((t) => TAG.test(t));
  tags.sort((a, b) => (newer(a, b) ? -1 : newer(b, a) ? 1 : 0));
  return { revision, ref: tags[0] ?? revision };
};

/* This checkout's HEAD. */
export const headRevision = (root = DEFAULT_SOURCE_ROOT) => {
  const revision = gitText(root, ["rev-parse", "--verify", "--quiet", "HEAD^{commit}"]);
  if (!revision) throw new KitError(`${root} is not a git checkout of ${REPOSITORY}; the installer reads its values from git objects, so run it from a clone`);
  return describeRevision(root, revision);
};

export const FETCH_TIMEOUT_MS = 20000;

/* One GET with a deadline for the whole exchange, body included. A 404 is
   `null`; every other failure is a KitError that names the URL. */
export const fetchText = async (url, accept, { timeoutMs = FETCH_TIMEOUT_MS } = {}) => {
  try {
    const response = await fetch(url, { headers: { "user-agent": INSTALLER_ID, ...(accept ? { accept } : {}) }, signal: AbortSignal.timeout(timeoutMs) });
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
export const resolveTagRemote = async (ref) => {
  const body = await fetchJson(fill(TAG_REF_URL, { ref }));
  if (body.object?.type === "tag") {
    const tag = await fetchJson(body.object.url);
    return tag.object.sha;
  }
  return body.object?.sha;
};

export const assertTag = (ref) => {
  if (!TAG.test(ref ?? "")) throw new KitError(`refusing ref "${ref}": pass an explicit release tag such as ${FIRST_INSTALLER_TAG} (never a branch, "main" or "latest")`);
  if (newer(FIRST_INSTALLER_TAG, ref)) throw new KitError(`${ref} predates this installer, which reads ports/<app>/host.json (${FIRST_INSTALLER_TAG} and later). To take the theme out, run restore; to install ${ref}, use tools/terminal-kit from that release's own checkout`);
};

export const assertRevision = (revision) => {
  if (!REVISION.test(revision ?? "")) throw new KitError(`revision must be a full 40-character lowercase commit SHA, got "${revision}" (branches, tags and "latest" can move)`);
};

/* A reader bound to one revision: git objects from a checkout that holds
   the commit, else the raw URL at the commit SHA. A release tag named with
   it must resolve to that commit where it is checked. */
export const openRevision = async ({ ref, revision, sourceRoot = DEFAULT_SOURCE_ROOT, offline = false }) => {
  assertRevision(revision);
  const isTag = TAG.test(ref ?? "");
  if (existsSync(sourceRoot) && hasCommit(sourceRoot, revision)) {
    const tagged = isTag ? localTag(sourceRoot, ref) : null;
    if (tagged && tagged !== revision) throw new KitError(`tag ${ref} is ${tagged} in ${sourceRoot}, not ${revision}`);
    return {
      via: "git",
      where: sourceRoot,
      tagCheck: !isTag ? "exact commit" : tagged ? "local tag matches" : "commit present; tag not in this checkout",
      read: async (file) => {
        try {
          return git(sourceRoot, ["show", `${revision}:${file}`]);
        } catch {
          return null;
        }
      },
    };
  }
  if (offline) throw new KitError(`${sourceRoot} does not contain ${revision} and --source-root forbids the network; fetch it (git -C ${sourceRoot} fetch --tags origin) and try again`);
  if (isTag) {
    const sha = await resolveTagRemote(ref);
    if (sha !== revision) throw new KitError(`tag ${ref} resolves to ${sha} on GitHub, not ${revision}`);
  }
  return {
    via: "network",
    where: `raw.githubusercontent.com/${REPOSITORY}/${revision}`,
    tagCheck: isTag ? "GitHub API tag matches" : "exact commit",
    read: (file) => fetchText(fill(RAW_URL, { revision, path: file })),
  };
};

/* Resolves one token id under the eligibility rules; use-and-report
   disclosures are collected per integration by the generators. */
export const makeResolver = (tokens, { profile = PROFILE, eligibility = ELIGIBILITY } = {}) => {
  const { allowedActions, forbiddenPrefixes } = eligibility;
  const token = (id) => {
    if (forbiddenPrefixes.some((p) => id.startsWith(p))) throw new KitError(`${id}: primitives are never consumed`);
    const t = tokens[id];
    if (!t) throw new KitError(`${id} is not in the ${profile} profile of this revision`);
    const action = t.eligibility?.action;
    if (!allowedActions.includes(action)) throw new KitError(`${id} is ${action} in the ${profile} profile: ${t.eligibility?.reason ?? ""}`);
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

const parseJson = (bytes, file, revision) => {
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch (error) {
    throw new KitError(`${file} at ${revision} is not valid JSON (${error.message})`);
  }
};

/* The full context every generator and command works from: the host maps,
   the specimen and the verified export, all at one revision. `pinnedDigest`
   is the export digest an installed pin recorded; it must match too. */
export const loadContext = async ({ revision, ref = revision, sourceRoot = DEFAULT_SOURCE_ROOT, offline = false, pinnedDigest = null } = {}) => {
  const reader = await openRevision({ ref, revision, sourceRoot, offline });
  const roles = {};
  for (const [integration, file] of Object.entries(HOST_FILES)) {
    const bytes = await reader.read(file);
    if (!bytes) throw new KitError(`${revision} has no ${file}: it predates this installer (${FIRST_INSTALLER_TAG} and later)`);
    roles[integration] = parseJson(bytes, file, revision);
  }
  const specimenBytes = await reader.read(SPECIMEN);
  if (!specimenBytes) throw new KitError(`${revision} has no ${SPECIMEN}: it predates this installer (${FIRST_INSTALLER_TAG} and later)`);
  const tokenBytes = await reader.read(TOKENS);
  const digestBytes = await reader.read(DIGESTS);
  if (!tokenBytes || !digestBytes) throw new KitError(`${TOKENS} or ${DIGESTS} is missing at ${revision}`);
  const digests = parseJson(digestBytes, DIGESTS, revision);
  const digest = sha256Base64(tokenBytes);
  if (digests.files?.[TOKENS] !== digest) throw new KitError(`${TOKENS} at ${revision} does not match ${DIGESTS} (${digest}); refusing`);
  if (pinnedDigest && digest !== pinnedDigest) throw new KitError(`${TOKENS} at ${revision} is ${digest}, not the ${pinnedDigest} the installed pin records; refusing`);
  const resolved = parseJson(tokenBytes, TOKENS, revision);
  const profile = resolved.profiles?.[PROFILE];
  if (!profile) throw new KitError(`profile ${PROFILE} is not in the export at ${revision}`);
  if (TAG.test(ref) && resolved.version !== ref.slice(1)) throw new KitError(`the export at ${ref} is version ${resolved.version}, not ${ref.slice(1)}; refusing`);
  return {
    roles,
    specimen: parseJson(specimenBytes, SPECIMEN, revision),
    theme: { name: THEME, repository: REPOSITORY, version: resolved.version, ref, revision, profile: PROFILE },
    source: {
      via: reader.via,
      where: reader.where,
      tagCheck: reader.tagCheck,
      digestCheck: pinnedDigest ? `${DIGESTS} and the installed pin's digest` : `${DIGESTS} at the same commit`,
    },
    exports: { [TOKENS]: digest },
    tokensDigest: digest,
    tokens: profile.tokens,
    resolver: makeResolver(profile.tokens),
  };
};
