import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { repoRoot } from "./fs.mjs";
import { safeKitPath } from "../../schemas/task-kit.mjs";
const exec = promisify(execFile);
const git = async (args) => (await exec("git", args, { cwd: repoRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, windowsHide: true })).stdout;
export const pinnedKitSource = async (ref = null) => {
  if (ref !== null && !/^(?:[a-f0-9]{40}|v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.test(ref)) throw new Error("Use a full commit or release tag; branch names are not kit pins.");
  const target = ref?.startsWith("v") ? `refs/tags/${ref}` : ref ?? "HEAD";
  const revision = (await git(["rev-parse", "--verify", `${target}^{commit}`])).trim();
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("Could not resolve a full source revision");
  const resolvedAt = new Date(Number((await git(["show", "-s", "--format=%ct", revision])).trim()) * 1000).toISOString();
  const read = async (file) => {
    if (!safeKitPath(file)) throw new Error(`Unsafe source path: ${file}`);
    return git(["show", `${revision}:${file}`]);
  };
  const list = async () => (await git(["ls-tree", "-r", "--full-tree", "--name-only", revision])).trim().split("\n").filter(Boolean).sort();
  return { revision, resolvedAt, read, list };
};
