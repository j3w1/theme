#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { repoRoot, stableJson, sha256 } from "./lib/fs.mjs";
import { consumerExamples } from './lib/ui-consumer-examples.mjs';
import { snapshotDirectory } from "./lib/ui-evidence.mjs";

const npm = process.env.npm_execpath;
if (!npm || !path.isAbsolute(npm)) throw new Error("Run this check with npm run ui:consumers.");
const run = (args, cwd) => execFileSync(process.execPath, [npm, ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const packages = path.join(repoRoot, ".cache/packages");
await fs.mkdir(packages, { recursive: true });
const packed = JSON.parse(run(["pack", "--workspace", "@j3w1/ui", "--json", "--pack-destination", packages], repoRoot))[0];
const root = await fs.mkdtemp(path.join(os.tmpdir(), "j3w1-consumers-"));
const put = async (name, content) => { const target = path.join(root, name); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, content); };
await put("package.json", stableJson({ private: true, type: "module", dependencies: { "@j3w1/ui": `file:${path.join(packages, packed.filename).split(path.sep).join("/")}`, vue: "3.5.42", react: "19.2.8", "react-dom": "19.2.8", astro: "7.3.1", vite: "8.2.2", "@vitejs/plugin-vue": "6.0.8", typescript: "7.0.2" } }));
for (const [name, content] of await consumerExamples()) await put(name, content);
console.log("Installing packed artifact into independent temporary applications.");
run(["install", "--prefer-offline", "--ignore-scripts", "--no-audit", "--no-fund"], root);
const binary = (name, args) => execFileSync(process.execPath, [path.join(root, "node_modules", name), ...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
binary("typescript/bin/tsc", ["-p", "tsconfig.json"]);
// Exercise real ESM exports in Node; declaration checking alone cannot detect
// an application bundler accidentally dropping public library exports.
execFileSync(process.execPath, ["--input-type=module", "-e", "import * as ui from '@j3w1/ui'; import { mountBuilder } from '@j3w1/ui/enhance/form-builder'; import { mountWorkflow } from '@j3w1/ui/enhance/form-workflow'; if(Object.keys(ui).length!==67 || typeof mountBuilder!=='function' || typeof mountWorkflow!=='function') throw new Error('Missing packed public exports');"], { cwd: root, stdio: "pipe" });
binary("vite/bin/vite.js", ["build"]);
binary("astro/bin/astro.mjs", ["build"]);
// Copy consumption runs the installed CLI and uses only its packed dependency closure.
binary("@j3w1/ui/dist/cli.js", ["copy", "dialog", "--out", path.join(root, "built/copy")]);
binary("@j3w1/ui/dist/cli.js", ["copy", "button", "--out", path.join(root, "built/basic")]);
binary("@j3w1/ui/dist/cli.js", ["kit", "--components", "text-field,admin-form", "--mode", "copy", "--framework", "html", "--out", path.join(root, "built/kit")]);
const copyKit = path.join(root, "built/kit");
const copiedMarkup = await Promise.all(["text-field", "admin-form"].map(id => fs.readFile(path.join(copyKit, id, "element.html"), "utf8")));
await fs.writeFile(path.join(copyKit, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Copied composition</title><link rel="stylesheet" href="./text-field/tokens.css"><link rel="stylesheet" href="./text-field/component.css"><link rel="stylesheet" href="./admin-form/component.css"></head><body><main><h1>Copied composition</h1>${copiedMarkup.join("\n")}</main><script type="module">import './text-field/runtime/register/text-field.js';import './admin-form/runtime/register/admin-form.js';</script></body></html>`);
for (const [framework, mode] of [["vue", "package"], ["native", "mapping"]]) {
  const destination = path.join(root, `${framework}-kit`);
  binary("@j3w1/ui/dist/cli.js", ["kit", "--components", "text-field,dialog", "--mode", mode, "--framework", framework, "--out", destination]);
  const kit = JSON.parse(await fs.readFile(path.join(destination, "kit.json"), "utf8"));
  if (kit.framework !== framework || kit.mode !== mode || kit.implementations.some(item => item.id === "form-builder")) throw new Error("Task kit was not bounded to the selected dependencies");
  for (const item of kit.implementations) await fs.access(path.join(destination, "canonical", `${item.id}.json`));
}
const tarball = path.join(packages, packed.filename);
await fs.writeFile(path.join(repoRoot, ".cache/ui-consumers.json"), stableJson({ root, tarball, integrity: packed.integrity, tarballDigest: sha256(await fs.readFile(tarball)), fixtures: await snapshotDirectory(path.join(root, "built")), frameworks: ["html", "vue", "react", "astro"], typeCheck: "passed", build: "passed" }));
console.log("Packed HTML, Vue, React and Astro consumers and copied dialog built; browser gate is next.");
