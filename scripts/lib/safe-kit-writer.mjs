import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { safeKitPath } from "../../schemas/task-kit.mjs";
import { privateAssetPath } from "../../schemas/private-path.mjs";

const ancestors = (directory) => {
  const result = [];
  for (let current = directory; ; current = path.dirname(current)) {
    result.push(current);
    if (path.dirname(current) === current) return result.reverse();
  }
};
const samePath = (a, b) => process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
const checkWindowsAttributes = (paths) => new Promise((resolve, reject) => {
  // Fixed code, with path data on stdin rather than interpolated into a shell.
  const script = '$ErrorActionPreference="Stop"; $paths = [Console]::In.ReadToEnd() | ConvertFrom-Json; foreach ($p in $paths) { if (([System.IO.File]::GetAttributes($p) -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Reparse-point output boundary" } }';
  const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")], { windowsHide: true, stdio: ["pipe", "ignore", "ignore"] });
  child.on("error", reject);
  child.on("close", (code) => code === 0 ? resolve() : reject(new Error("Cannot verify output ancestors: a Windows reparse point or attribute-check failure was found.")));
  child.stdin.on("error", reject);
  child.stdin.end(JSON.stringify(paths));
});
const checkDirectory = async (directory) => {
  const paths = ancestors(directory);
  for (const item of paths) {
    const stat = await fs.lstat(item);
    if (!stat.isDirectory() || stat.isSymbolicLink() || !samePath(await fs.realpath(item), item)) throw new Error("Output ancestors must be real directories without symbolic links or redirection.");
  }
  if (process.platform === "win32") await checkWindowsAttributes(paths);
};

export const assertRealDirectory = checkDirectory;
export const assertRealFile = async file => {
  await checkDirectory(path.dirname(file));
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || !samePath(await fs.realpath(file), file)) throw new Error("Source must be a regular non-redirected file");
  if (process.platform === "win32") await checkWindowsAttributes([file]);
};

export const prepareKitParent = async (directory) => {
  for (const item of ancestors(path.resolve(directory))) {
    try { await fs.lstat(item); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      await checkDirectory(path.dirname(item));
      await fs.mkdir(item);
    }
    await checkDirectory(item);
  }
};

/* New directories only. Never recursively erase a destination. The parent is
   user-owned and must not be concurrently replaced by another process. */
const writeNew = async (destination, files, validPath) => {
  for (const [name, text] of Object.entries(files)) if (!validPath(name) || typeof text !== "string") throw new Error(`Unsafe kit output: ${name}`);
  if (new Set(Object.keys(files).map((f) => f.toLowerCase())).size !== Object.keys(files).length) throw new Error("Kit filenames must not collide on case-insensitive filesystems.");
  const target = path.resolve(destination);
  if (target === path.parse(target).root || (process.platform === "win32" && target.startsWith("\\\\"))) throw new Error("Choose a new local kit directory, not a root or device/network path.");
  const parent = path.dirname(target);
  await checkDirectory(parent);
  try { await fs.lstat(target); throw new Error("Kit destination already exists; choose a new directory. Existing contents were left untouched."); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  await fs.mkdir(target); // exclusive: EEXIST is a failure, including a race
  const created = await fs.lstat(target);
  const assertTarget = async () => {
    const now = await fs.lstat(target);
    if (now.isSymbolicLink() || now.dev !== created.dev || now.ino !== created.ino || !samePath(await fs.realpath(target), target)) throw new Error("Kit directory identity changed during writing; partial output was preserved.");
  };
  const directories = new Set([target]);
  for (const [name, text] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b, "en"))) {
    await assertTarget();
    const file = path.resolve(target, ...name.split("/"));
    if (!file.startsWith(target + path.sep)) throw new Error("Output escaped the dedicated kit directory");
    for (const segment of ancestors(path.dirname(file)).filter((dir) => dir.startsWith(target + path.sep))) {
      if (!directories.has(segment)) { await fs.mkdir(segment); directories.add(segment); }
    }
    await checkDirectory(path.dirname(file));
    await fs.writeFile(file, text, { encoding: "utf8", flag: "wx" });
  }
  return target;
};

export const writeNewKit = (destination, files) => writeNew(destination, files, safeKitPath);
export const writeNewPrivateFiles = (destination, files) => writeNew(destination, files, privateAssetPath);
