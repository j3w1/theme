import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { assertPortArtifacts } from "../scripts/lib/port-artifacts.mjs";
import { portSchema } from "../schemas/port.mjs";
import { readJson } from "../scripts/lib/fs.mjs";

const port = { id: "two", files: [{ path: "dist/manifest.json" }, { path: "dist/theme.css" }] };
const complete = [{ path: "dist/theme.css", text: "CSS" }, { path: "dist/manifest.json", text: "JSON" }];
test("artifact sets accept every declared text file once, independently of order", () => {
  assert.doesNotThrow(() => assertPortArtifacts(port, complete));
  assert.doesNotThrow(() => assertPortArtifacts({ id: "one", files: [{ path: "dist/theme.css" }] }, complete.slice(0, 1)));
});
test("artifact sets reject missing, extra and duplicate declarations/emissions before writing", () => {
  assert.throws(() => assertPortArtifacts(port, complete.slice(0, 1)), /missing: dist\/manifest.json/);
  assert.throws(() => assertPortArtifacts(port, []), /missing:/);
  assert.throws(() => assertPortArtifacts(port, [...complete, { path: "dist/extra.css", text: "extra" }]), /extra: dist\/extra.css/);
  assert.throws(() => assertPortArtifacts(port, [...complete, complete[0]]), /duplicate emitted/);
  assert.throws(() => assertPortArtifacts({ ...port, files: [...port.files, port.files[0]] }, complete), /duplicate declared/);
  assert.throws(() => assertPortArtifacts(port, [{ path: "dist/manifest.json", text: "JSON" }, { path: "dist/unexpected.css", text: "CSS" }]), /missing: dist\/theme.css; extra: dist\/unexpected.css/);
});
test("unsafe paths and malformed text envelopes cannot reach the artifact writer", () => {
  for (const path of ["../theme.css", "/dist/theme.css", "dist/../theme.css", "dist//theme.css", "dist/./theme.css", "dist\\theme.css", "dist/CON.css", "dist/theme.css.", "src/theme.css", "dist/"]) {
    assert.throws(() => assertPortArtifacts({ id: "unsafe", files: [{ path }] }, [{ path, text: "x" }]), /unsafe declared/);
    assert.throws(() => assertPortArtifacts(port, [...complete, { path, text: "x" }]), /invalid emitted/);
  }
  for (const emitted of [null, "text", [{ path: "dist/theme.css", text: null }], [{ path: "dist/theme.css", text: "x", extra: true }]]) assert.throws(() => assertPortArtifacts(port, emitted), /invalid emitted/);
});
test("the manifest schema rejects duplicate and unsafe declared artifact paths", async () => {
  const real = await readJson("ports/obsidian/port.json");
  assert.equal(portSchema(z).safeParse(real).success, true);
  assert.equal(portSchema(z).safeParse({ ...real, files: [...real.files, real.files[0]] }).success, false);
  for (const path of ["dist/../escape.css", "dist\\escape.css", "dist/CON.css"]) assert.equal(portSchema(z).safeParse({ ...real, files: [{ path, install: "fixture" }] }).success, false);
});

test("generation rebuilds deleted Obsidian files, validation stays strict, and failed sets write nothing", async t => {
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const { repoRoot } = await import("../scripts/lib/fs.mjs");
  const { scratchDir } = await import("./helpers/scratch.mjs");
  const root = await scratchDir(t, "j3w1-port-artifacts-");
  // A source-only fixture, no checkout, browser or upstream app.
  for (const directory of ["scripts/lib", "schemas", "tokens", "ports"]) await fs.cp(path.join(repoRoot, directory), path.join(root, directory), { recursive: true });
  await fs.copyFile(path.join(repoRoot, "theme.json"), path.join(root, "theme.json"));
  await fs.symlink(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir");
  const original = await Promise.all(["manifest.json", "theme.css"].map(name => fs.readFile(path.join(root, "ports/obsidian/dist", name), "utf8")));
  for (const name of ["manifest.json", "theme.css"]) await fs.unlink(path.join(root, "ports/obsidian/dist", name));
  execFileSync(process.execPath, ["--input-type=module", "-e", `
    import assert from 'node:assert/strict';
    import {readJson,readText} from './scripts/lib/fs.mjs';
    import {loadResolvedProfile} from './scripts/lib/tokens.mjs';
    import {validatePorts} from './scripts/lib/validators.mjs';
    import {PORT_EMITTERS,portArtifactsGenerator} from './scripts/lib/port-artifacts.mjs';
    await assert.rejects(validatePorts(), /unsafe or absent/);
    await assert.rejects(validatePorts({requireArtifacts:false}), /unsafe or absent/);
    const manifest=await readJson('theme.json'), profiles=new Map();
    for(const p of manifest.profiles) profiles.set(p.id,await loadResolvedProfile(p.tokens));
    const before=await readText('ports/chatgpt/dist/presets.json');
    const chatgpt=PORT_EMITTERS['chatgpt-appearance'],obsidian=PORT_EMITTERS['obsidian-theme'];
    PORT_EMITTERS['chatgpt-appearance']=args=>[{path:args.port.files[0].path,text:'must not be written'}];
    PORT_EMITTERS['obsidian-theme']=args=>obsidian(args).slice(0,1);
    await assert.rejects(portArtifactsGenerator.run({manifest,profiles,check:false}), /missing: dist\\/theme.css/);
    assert.equal(await readText('ports/chatgpt/dist/presets.json'),before);
    PORT_EMITTERS['chatgpt-appearance']=chatgpt; PORT_EMITTERS['obsidian-theme']=obsidian;
    await portArtifactsGenerator.run({manifest,profiles,check:false});
    await validatePorts();
    assert.deepEqual((await portArtifactsGenerator.run({manifest,profiles,check:true})).changed,[]);
  `], { cwd: root, stdio: "pipe" });
  for (const [i, name] of ["manifest.json", "theme.css"].entries()) assert.equal(await fs.readFile(path.join(root, "ports/obsidian/dist", name), "utf8"), original[i]);
});
