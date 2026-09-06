#!/usr/bin/env node
/* Builds a sealed consumption kit for one component: the only files a fresh
   agent may read to reconstruct it. Usage:
     node scripts/consumption-kit.mjs <component-id> [--strict] [--out <dir>]
   --strict omits tokens.resolved.json so the agent must work from the
   compact export and the component JSON alone. */

import { promises as fs } from "node:fs";
import path from "node:path";
import { readJson, readText, repoRoot } from "./lib/fs.mjs";

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--"));
const strict = args.includes("--strict");
const outIndex = args.indexOf("--out");
if (!id) {
  console.error("usage: node scripts/consumption-kit.mjs <component-id> [--strict] [--out <dir>]");
  process.exit(2);
}
const outDir = outIndex >= 0 ? path.resolve(args[outIndex + 1]) : path.join(repoRoot, ".cache", "consumption", id);

const manifest = await readJson("theme.json");
const componentFile = `exports/components/${id}.json`;
try {
  await fs.access(path.join(repoRoot, componentFile));
} catch {
  console.error(`${componentFile} does not exist — run npm run generate, and check the id`);
  process.exit(1);
}

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(path.join(outDir, "components"), { recursive: true });
const copy = async (relative, target = relative) => fs.writeFile(path.join(outDir, target), await readText(relative));
await copy("exports/theme.compact.md", "theme.compact.md");
await copy("agents/consume.md", "consume.md");
await copy("schemas/json/theme.lock.schema.json", "theme.lock.schema.json");
await copy(componentFile, `components/${id}.json`);
await copy(`exports/components/${id}.brief.txt`, `components/${id}.brief.txt`);
if (!strict) await copy("exports/tokens.resolved.json", "tokens.resolved.json");
const task = (await readText("templates/consumption/TASK.md")).replaceAll("<id>", id);
await fs.writeFile(path.join(outDir, "TASK.md"), task);
await fs.writeFile(
  path.join(outDir, "KIT.json"),
  `${JSON.stringify({ theme: manifest.name, version: manifest.version, component: id, mode: strict ? "strict" : "standard", files: (await fs.readdir(outDir, { recursive: true })).filter((f) => f !== "KIT.json").sort() }, null, 2)}\n`,
);
console.log(`kit for ${id} (${strict ? "strict" : "standard"}) written to ${outDir}`);
