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
  if (!["copy", "kit"].includes(args[0]) || !option("--out")) throw new Error("Usage: j3w1-ui list | copy COMPONENT --out DIRECTORY | kit --components button,dialog --mode copy|package|mapping --framework html|vue|react|astro|native --out DIRECTORY");
  for (let index = args[0] === "copy" ? 2 : 1; index < args.length; index += 2) if (!["--components", "--out", "--mode", "--framework"].includes(args[index]) || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Invalid option: ${args[index]}`);
  const ids = [...new Set((args[0] === "copy" ? args[1] : option("--components") ?? "").split(","))];
  const entries = ids.map(id => { const entry = manifest.components.find(item => item.id === id); if (!entry) throw new Error(`Unknown component: ${id}`); return entry; });
  const mode = option("--mode") ?? "copy", framework = option("--framework") ?? "html";
  if (!["copy", "package", "mapping"].includes(mode)) throw new Error("mode must be copy, package or mapping");
  if (args[0] === "copy" && mode !== "copy") throw new Error("Use kit for package or mapping mode");
  if (!["html", "vue", "react", "astro", "native"].includes(framework)) throw new Error("framework must be html, vue, react, astro or native");
  if (framework === "native" && mode !== "mapping") throw new Error("Native hosts use mapping mode; browser implementations are not native ports");
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
  for (const entry of mode === "copy" ? entries : []) {
    for (const [name, expected] of Object.entries(entry.copy.files)) {
      if (!safe(name)) throw new Error(`Unsafe distribution path: ${name}`);
      const content = await fs.readFile(path.join(root, "copy", entry.id, name));
      if (digest(content) !== expected) throw new Error(`Distribution integrity failure: ${entry.id}/${name}`);
      const target = ids.length === 1 ? name : `${entry.id}/${name}`;
      files.set(target, content);
    }
  }
  if (args[0] === "kit") {
    const closure = new Map();
    const add = id => { if (closure.has(id)) return; const entry = manifest.components.find(item => item.id === id); if (!entry) throw new Error(`Unknown dependency: ${id}`); closure.set(id, entry); for (const dependency of [...entry.dependencies, ...(entry.styleDependencies ?? [])]) add(dependency); };
    ids.forEach(add);
    const kit = { schemaVersion: 1, version: manifest.version, mode, framework, requested: ids, implementations: [...closure.values()].map(({ id, contract, imports, api, dependencies, tokenDependencies, maturity }) => ({ id, contract, imports, api, dependencies, tokenDependencies, maturity })), limits: "Implementation availability is separate from execution evidence. Keep canonical eligibility disclosures. Verify the integrated application." };
    files.set("kit.json", Buffer.from(JSON.stringify(kit, null, 2) + "\n"));
    for (const entry of closure.values()) files.set(`canonical/${entry.id}.json`, await fs.readFile(path.join(root, "canonical", `${entry.id}.json`)));
    for (const name of ["consume.md", "accessibility.md", "identity.md"]) files.set(`rules/${name}`, await fs.readFile(path.join(root, "rules", name)));
    files.set("integration.md", await fs.readFile(path.join(root, "consumption.md")));
    if (mode !== "copy") {
      for (const entry of entries) files.set(`examples/${entry.id}.json`, await fs.readFile(path.join(root, "examples", `${entry.id}.json`)));
      files.set("LICENSE.md", await fs.readFile(path.join(root, "LICENSE.md")));
      files.set("README.md", Buffer.from(`# j3w1 ${framework} ${mode} kit\n\nPin @j3w1/ui ${manifest.version}. Read kit.json and the selected canonical contracts.\n${mode === "package" ? "Install the exact package. Load token CSS, the selected component styles and registration imports. Insert maintained native markup from examples. Keep application behavior in the host. Vue configures j3w1-* as Custom Elements; Astro registers in a browser script; React binds complex properties through refs." : "Map the canonical roles and behavior to the target host. Record deviations in the existing integration/lock workflow. No native verification is implied."}\n\nValidate native forms, keyboard, focus and lifecycle in the consuming app. Preserve MIT code and CC BY 4.0 specimen attribution.\n`));
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
