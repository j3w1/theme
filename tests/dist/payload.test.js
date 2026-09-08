import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { init, parse } from "es-module-lexer";
import { repoRoot, readJson, listFiles } from "../../scripts/lib/fs.mjs";

async function initialScriptBytes(relative) {
  await init;
  const root=path.join(repoRoot,"dist"), seen=new Set();
  let gzipBytes=0;
  const visit=async file=>{
    if(seen.has(file))return;seen.add(file);
    assert.ok(file.startsWith(root+path.sep),"script dependency stays in dist");
    const bytes=await fs.readFile(file);gzipBytes+=gzipSync(bytes).length;
    for(const item of parse(bytes.toString())[0]) if(item.d===-1) {
      assert.ok(item.n?.startsWith("."),"initial ESM imports remain local");
      await visit(path.resolve(path.dirname(file),item.n));
    }
  };
  const html=await fs.readFile(path.join(root,relative),"utf8");
  for(const [,source] of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) {
    assert.ok(source.startsWith("/theme/"));
    await visit(path.join(root,source.slice("/theme/".length)));
  }
  return {gzipBytes,files:seen.size};
}

test("initial JavaScript, lazy chunks and the complete package stay within measured budgets",async()=>{
  const demo=await initialScriptBytes("demo/index.html"),portal=await initialScriptBytes("index.html");
  assert.ok(demo.gzipBytes<=64*1024,`Vue initial JS: ${demo.gzipBytes} gzip bytes exceeds 64 KiB`);
  assert.ok(portal.gzipBytes<=32*1024,`Portal initial JS: ${portal.gzipBytes} gzip bytes exceeds 32 KiB`);
  for(const file of await listFiles("dist/demo/assets")) if(file.endsWith(".js")) assert.ok(gzipSync(await fs.readFile(path.join(repoRoot,file))).length<=192*1024,`${file} exceeds the 192 KiB gzip lazy-chunk budget`);
  const release=await readJson("dist/downloads/release.json");
  assert.ok(release.bytes<=2*1024*1024,`Complete package: ${release.bytes} exceeds 2 MiB`);
  console.log(`Payload: Vue initial ${demo.gzipBytes} gzip bytes (${demo.files} modules); portal initial ${portal.gzipBytes} gzip bytes (${portal.files} modules); tarball ${release.bytes} bytes.`);
});
