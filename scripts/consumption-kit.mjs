#!/usr/bin/env node
/* Legacy sealed single-component reconstruction kit. --strict still omits
   tokens.resolved.json. Existing output directories are never replaced. */
import path from "node:path";
import { parseArgs } from "node:util";
import { readJson, readText, repoRoot } from "./lib/fs.mjs";
import { prepareKitParent, writeNewKit } from "./lib/safe-kit-writer.mjs";

try {
  const { values, positionals } = parseArgs({ options: { strict: { type: "boolean", default: false }, out: { type: "string" } }, allowPositionals: true });
  const [id] = positionals;
  if (positionals.length !== 1 || !/^[a-z][a-z0-9-]*$/.test(id ?? "")) throw new Error("usage: node scripts/consumption-kit.mjs COMPONENT [--strict] [--out NEW_DIRECTORY]");
  const manifest = await readJson("theme.json");
  const files = {};
  const copy = async (source, target) => { files[target] = await readText(source); };
  await copy("exports/theme.compact.md", "theme.compact.md");
  await copy("agents/consume.md", "consume.md");
  await copy("schemas/json/theme.lock.schema.json", "theme.lock.schema.json");
  await copy(`exports/components/${id}.json`, `components/${id}.json`);
  await copy(`exports/components/${id}.brief.txt`, `components/${id}.brief.txt`);
  if (!values.strict) await copy("exports/tokens.resolved.json", "tokens.resolved.json");
  files["TASK.md"] = (await readText("templates/consumption/TASK.md")).replaceAll("<id>", id);
  files["KIT.json"] = `${JSON.stringify({ theme: manifest.name, version: manifest.version, component: id, mode: values.strict ? "strict" : "standard", files: ["components", ...Object.keys(files)].sort() }, null, 2)}\n`;
  const out = values.out ?? path.join(repoRoot, ".cache", "consumption", id);
  if (!values.out) await prepareKitParent(path.dirname(out));
  console.log(`kit for ${id} (${values.strict ? "strict" : "standard"}) written to ${await writeNewKit(out, files)}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
