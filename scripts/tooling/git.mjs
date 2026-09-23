/* Git queries the tooling and the test reporters make about the checkout.
   Every call runs at the repository root and returns trimmed text. */

import { execFileSync } from "node:child_process";
import { repoRoot } from "../lib/fs.mjs";

/* A full 40-hex commit, the only form the exports and kits accept as a pin. */
export const REVISION = /^[a-f0-9]{40}$/;

export const git = (args, options = {}) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", ...options }).trim();

/* null instead of a throw, for callers that work outside a checkout. */
export const tryGit = (args, options) => {
  try {
    return git(args, options);
  } catch {
    return null;
  }
};

export const head = () => tryGit(["rev-parse", "HEAD"]);

export const branch = () => tryGit(["rev-parse", "--abbrev-ref", "HEAD"]);

export const isDirty = () => (tryGit(["status", "--porcelain", "--untracked-files=normal"]) ?? "").length > 0;
