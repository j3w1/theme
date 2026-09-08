import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { moduleClosure, cssSourceClosure } from "../scripts/lib/ui-distribution.mjs";
import { scopeRecipeCss } from "../scripts/lib/recipe-css.mjs";
import { sha256, repoRoot } from "../scripts/lib/fs.mjs";
import { registerElement } from "../packages/ui/src/internal/element.js";

test("copy dependency traversal includes reexports and side effects and rejects escapes and unresolved packages", async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "j3w1-closure-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "parts"));
  await fs.writeFile(path.join(root, "index.js"), 'import "./parts/behavior.js"; export { value } from "./parts/value.js";');
  await fs.writeFile(path.join(root, "parts/behavior.js"), 'import "./value.js";');
  await fs.writeFile(path.join(root, "parts/value.js"), `export const value = "import 'text-is-not-code'"; const url = import.meta.url;`);
  assert.deepEqual([...(await moduleClosure(root, ["index.js"])).keys()].sort(), ["index.js", "parts/behavior.js", "parts/value.js"]);
  await fs.writeFile(path.join(root, "index.js"), 'import "../../outside.js";');
  await assert.rejects(moduleClosure(root, ["index.js"]), /Unsafe module dependency/);
  await fs.writeFile(path.join(root, "index.js"), 'import "unbundled-package";');
  await assert.rejects(moduleClosure(root, ["index.js"]), /Unbundled runtime dependency/);
  await fs.writeFile(path.join(root, "index.js"), 'const name="./parts/value.js"; import(name);');
  await assert.rejects(moduleClosure(root, ["index.js"]), /Non-literal runtime dependency/);
  await fs.writeFile(path.join(root, "index.js"), 'import /* supported comment */ ("./parts/value.js");');
  assert.equal((await moduleClosure(root, ["index.js"])).size, 2);
});

test("copy CLI verifies the entire distribution before writing and preserves existing destinations", async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "j3w1-copy-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, "package.json"), '{"type":"module"}');
  await fs.copyFile(path.join(repoRoot, "packages/ui/src/cli.js"), path.join(root, "cli.js"));
  const content = '<button type="button">Example</button>\n';
  await fs.mkdir(path.join(root, "copy/button"), { recursive: true });
  await fs.writeFile(path.join(root, "copy/button/element.html"), content);
  const manifest = { version: "1.0.0", components: [{ id: "button", copy: { files: { "element.html": sha256(content) } } }] };
  await fs.writeFile(path.join(root, "manifest.json"), JSON.stringify(manifest));
  const run = output => execFileSync(process.execPath, [path.join(root, "cli.js"), "copy", "button", "--out", output], { encoding: "utf8", stdio: "pipe" });
  const output = path.join(root, "result");
  run(output);
  assert.equal(await fs.readFile(path.join(output, "element.html"), "utf8"), content);
  assert.throws(() => run(output), /Destination already exists/);
  await fs.writeFile(path.join(root, "copy/button/element.html"), "tampered");
  assert.throws(() => run(path.join(root, "second")), /Distribution integrity failure/);
  await assert.rejects(fs.stat(path.join(root, "second")), { code: "ENOENT" });
  assert.equal(await fs.readFile(path.join(output, "element.html"), "utf8"), content);
});

test("registration is explicit and repeated registration cannot adopt a foreign definition", () => {
  const entries = new Map();
  const registry = { get: name => entries.get(name), define: (name, value) => entries.set(name, value) };
  class Component {}
  assert.equal(registerElement("j3w1-fixture", Component, registry), Component);
  assert.equal(registerElement("j3w1-fixture", Component, registry), Component);
  assert.equal(entries.size, 1);
  assert.throws(() => registerElement("j3w1-fixture", class Foreign {}, registry), /different implementation/);
  class Original { static componentId="copy"; static version="1.0.0"; static implementationId="same-content-digest"; }
  class Duplicate { static componentId="copy"; static version="1.0.0"; static implementationId="same-content-digest"; }
  registerElement("j3w1-copy",Original,registry);
  assert.equal(registerElement("j3w1-copy",Duplicate,registry),Original);
  class Upgrade extends Duplicate { static version="1.0.1"; }
  assert.throws(()=>registerElement("j3w1-copy",Upgrade,registry),/different implementation/);
});

test("CSS dependency closure preserves container rules and rejects external or cyclic imports", async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "j3w1-css-closure-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root,"base.css"), '.control {color:var(--color-text-default)}');
  await fs.writeFile(path.join(root,"entry.css"), '@import "./base.css"; @container (width < 400px) { .control {display:block} }');
  const closure=await cssSourceClosure(root,["entry.css"]);
  assert.deepEqual([...closure.keys()],["base.css","entry.css"]);
  const scoped=[...closure.values()].map(source=>scopeRecipeCss(source)).join("\n");
  assert.match(scoped,/@container/);assert.match(scoped,/\.j3w1-recipe \.control/);assert.doesNotMatch(scoped,/@import/);
  await fs.writeFile(path.join(root,"entry.css"), '@import "https://example.test/external.css";');
  await assert.rejects(cssSourceClosure(root,["entry.css"]));
  await fs.writeFile(path.join(root,"entry.css"), '@import "./base.css";');await fs.writeFile(path.join(root,"base.css"),'@import "./entry.css";');
  await assert.rejects(cssSourceClosure(root,["entry.css"]),/Circular CSS dependency/);
});
