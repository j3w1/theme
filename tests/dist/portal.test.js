import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { parse } from "parse5";
import { readJson, readText, listFiles, sha256 } from "../../scripts/lib/fs.mjs";
const inventory = await readJson("spec/inventory.json");
test("every inventory entry has a static portal contract and byte-identical complete copy distribution", async () => {
  const index = await readJson("dist/ui/index.json");
  assert.deepEqual(index.components.map(c=>c.id).sort(),inventory.components.map(c=>c.id).sort());
  for(const {id} of inventory.components) {
    const html=await readText(`dist/components/${id}/index.html`);
    assert.ok(html.includes("Canonical specification")&&html.includes("Public API")&&html.includes(`<j3w1-${id}`),id);
    const ids=[],tree=parse(html);const visit=node=>{const value=node.attrs?.find(a=>a.name==='id')?.value;if(value)ids.push(value);for(const child of node.childNodes??[])visit(child);};visit(tree);
    assert.equal(new Set(ids).size,ids.length,`${id}: duplicate IDs`);
    const manifest=await readJson(`dist/ui/copy/${id}/manifest.json`);
    for(const [file,digest] of Object.entries(manifest.files))assert.equal(sha256(await fs.readFile(`dist/ui/copy/${id}/${file}`)),digest,`${id}/${file}`);
  }
});
test("the portal retains the complete reference, canonical palette and installable download", async () => {
  const home=await readText("dist/index.html"),reference=await readText("dist/reference/index.html");
  assert.ok(home.includes("The j3w1 UI theme"));
  assert.ok(reference.includes('id="c-dialog"')&&reference.includes('id="d-accessibility"'));
  const release=await readJson("dist/downloads/release.json");
  assert.equal(sha256(await fs.readFile(`dist/downloads/${release.file}`)),release.sha256);
  for(const file of await listFiles("packages/ui/dist"))assert.deepEqual(await fs.readFile(`dist/ui/${file.slice('packages/ui/dist/'.length)}`),await fs.readFile(file),file);
});
