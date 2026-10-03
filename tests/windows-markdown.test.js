import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {repoRoot} from '../scripts/lib/fs.mjs';
import {windowsMarkdownArtifacts} from '../scripts/lib/windows-markdown.mjs';

const port=path.join(repoRoot,'ports/windows');
const host=JSON.parse(fs.readFileSync(path.join(port,'host.json'),'utf8'));
const tokens=JSON.parse(fs.readFileSync(path.join(repoRoot,'exports/tokens.resolved.json'),'utf8')).profiles.default.tokens;
const resolved=new Map(Object.entries(tokens).map(([role,t])=>[role,{type:t.type,resolved:t.value}]));

test('Markdown renders digits in token and digest placeholders and stays in every admitted CSS extent',()=>{
 const css=fs.readFileSync(path.join(port,'dist/markdown-theme.css'),'utf8');
 const source=fs.readFileSync(path.join(port,'dist/j3w1-powertoys-markdown.wh.cpp'),'utf8');
 assert.doesNotMatch(css+source,/@[A-Z0-9_]+@/);
 for(const pin of host.markdownPreview.headers)assert.ok(css.length<=pin.styleLength);
 assert.match(css,/font:15px\/24px/);assert.match(css,/h1\{font-size:20px;line-height:28px\}/);
 assert.match(css,/padding:16px/);assert.match(css,/padding:12px/);assert.match(css,/max-width:min\(72ch,680px\)/);
 assert.match(css,/h3,h4,h5,h6\{font-size:13px;line-height:18px\}/);
 for(const key of ['hostSha256','controlSha256','helperSha256'])assert.ok(source.includes(host.markdownPreview[key]));
 for(const pin of host.markdownPreview.webviewBoundaries)assert.ok(source.includes(pin.sha256));
 assert.match(css,/@media\(forced-colors:none\)/);assert.doesNotMatch(css,/forced-color-adjust:none|url\(/);
});

test('Markdown source and palette are manifest-pinned and participate in managed setup and restore',()=>{
 const settings=JSON.parse(fs.readFileSync(path.join(port,'dist/windows-settings.json'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(port,'dist/install-manifest.json'),'utf8'));
 const mod=settings.bundledMods.find(m=>m.id==='j3w1-powertoys-markdown');assert.ok(mod);
 for(const file of [mod.path,'dist/j3w1-powertoys-markdown.json','dist/markdown-theme.css']){
  const digest=createHash('sha256').update(fs.readFileSync(path.join(port,file))).digest('hex');
  assert.equal(manifest.files.find(f=>f.path===file)?.sha256,digest);
  if(file===mod.path)assert.equal(mod.sha256,digest);
 }
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(port,'dist/j3w1-powertoys-markdown.json'),'utf8')),{enabled:1});
});

test('Markdown generation refuses missing digest, duplicate header, out-of-bounds extent and unknown semantic role',()=>{
 for(const change of [h=>h.markdownPreview.hostSha256='unknown',h=>h.markdownPreview.headers[1]=h.markdownPreview.headers[0],
  h=>h.markdownPreview.headers[0].styleOffset=32768,h=>h.markdownPreview.roles.H1_SIZE='color.primitive.ink.0',
  h=>h.markdownPreview.webviewBoundaries=[],h=>h.markdownPreview.webviewBoundaries[1]=h.markdownPreview.webviewBoundaries[0],
  h=>h.markdownPreview.webviewBoundaries[0].sha256='unknown',h=>h.markdownPreview.webviewBoundaries[0].navigateRva=0]){
  const candidate=structuredClone(host);change(candidate);assert.throws(()=>windowsMarkdownArtifacts(candidate,resolved));
 }
});
