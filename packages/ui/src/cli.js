#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = name => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1]; };
const digest = bytes => `sha256-${createHash("sha256").update(bytes).digest("base64")}`;
const safe = name => typeof name === "string" && /^[a-zA-Z0-9_.\/-]+$/.test(name) && !name.startsWith("/") && !name.split("/").some(part => !part || part === ".." || part === ".");
async function copy() {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "manifest.json"), "utf8"));
  if (args[0] === "list") { console.log(JSON.stringify(manifest.components.map(({ id, name, imports }) => ({ id, name, imports })), null, 2)); return; }
  if (!["copy", "kit"].includes(args[0]) || !option("--out")) throw new Error("Usage: j3w1-ui list | copy COMPONENT --out DIRECTORY | kit --components button,dialog --out DIRECTORY");
  const ids = [...new Set((args[0] === "copy" ? args[1] : option("--components") ?? "").split(","))];
  const entries = ids.map(id => { const entry = manifest.components.find(item => item.id === id); if (!entry) throw new Error(`Unknown component: ${id}`); return entry; });
  const output = path.resolve(option("--out"));
  // Inspect every existing parent; copying through a symlink can escape the reviewed destination.
  for (let parent = output; ; parent = path.dirname(parent)) {
    try { if ((await fs.lstat(parent)).isSymbolicLink()) throw new Error(`Refusing a symlink destination: ${parent}`); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    if (parent === path.dirname(parent)) break;
  }
  try { await fs.lstat(output); throw new Error("Destination already exists; choose a new directory. Existing application files are never overwritten."); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const files = new Map();
  for (const entry of entries) {
    for (const [name, expected] of Object.entries(entry.copy.files)) {
      if (!safe(name)) throw new Error(`Unsafe distribution path: ${name}`);
      const content = await fs.readFile(path.join(root, "copy", entry.id, name));
      if (digest(content) !== expected) throw new Error(`Distribution integrity failure: ${entry.id}/${name}`);
      const target = ids.length === 1 ? name : `${entry.id}/${name}`;
      files.set(target, content);
    }
  }
  // Verify the entire closure before creating any destination files.
  await fs.mkdir(output, { recursive: true });
  for (const [name, content] of files) {
    const destination = path.resolve(output, name);
    if (!destination.startsWith(output + path.sep)) throw new Error("Distribution path escaped destination");
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, content, { flag: "wx" });
  }
  console.log(JSON.stringify({ themeVersion: manifest.version, components: ids, files: files.size, output }, null, 2));
}
copy().catch(error => { console.error(error.message); process.exitCode = 1; });
