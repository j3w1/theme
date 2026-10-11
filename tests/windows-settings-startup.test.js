import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {repoRoot} from '../scripts/lib/fs.mjs';
import {settingsStylerSource} from '../ports/windows/src/settings-styler-source.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=Buffer.from('// retained license\n// @compilerOptions -lcomctl32 -lole32\nHWND GetCoreWnd() { return nullptr; }\nPTP_TIMER g_statsTimer;\nBOOL Wh_ModInit() {\n    retainedInit();\n}\nvoid Wh_ModUninit() { retainedRestore(GetCoreWnd()); }\n');
const replacement='namespace j3w1Settings { bool Admit(); }\nHWND GetCoreWnd() { return ownedWindow(); }';
test('Settings source adaptation preserves license, initialization and shared restore lookup',()=>{
 const patch={sourceSha256:hash(fixture),replacement};
 const actual=settingsStylerSource(fixture,patch).toString();
 assert.ok(actual.startsWith('// retained license\n'));
 assert.ok(actual.includes('-lbcrypt -lcomctl32 -lole32'));
 assert.ok(actual.includes('if (!j3w1Settings::Admit()) return FALSE;\n    retainedInit();'));
 assert.ok(actual.includes(replacement));
 assert.ok(actual.endsWith('void Wh_ModUninit() { retainedRestore(GetCoreWnd()); }\n'));
 assert.equal(settingsStylerSource(fixture,patch).toString(),actual);
 assert.throws(()=>settingsStylerSource(Buffer.concat([fixture,Buffer.from(' ')]),patch),/digest differs/);
});
test('Settings source adaptation rejects missing and ambiguous anchors before compilation',()=>{
 for(const bytes of [Buffer.from(fixture.toString().replace('HWND GetCoreWnd() {','HWND Other() {')),
  Buffer.concat([fixture,Buffer.from('HWND GetCoreWnd() {')]),
  Buffer.concat([fixture,Buffer.from('PTP_TIMER g_statsTimer;')]),
  Buffer.concat([fixture,Buffer.from('BOOL Wh_ModInit() {\n')]),
  Buffer.from(fixture.toString().replace('// @compilerOptions -lcomctl32','// altered options'))])
  assert.throws(()=>settingsStylerSource(bytes,{sourceSha256:hash(bytes),replacement}),/structure differs/);
 assert.throws(()=>settingsStylerSource(fixture,{sourceSha256:hash(fixture),replacement:replacement+'@UNRESOLVED@'}),/Invalid Settings/);
});
test('Generated Settings startup admission pins both executable and XAML binary',()=>{
 const source=path.join(repoRoot,'ports/windows');
 const settings=JSON.parse(fs.readFileSync(path.join(source,'dist/windows-settings.json')));
 const host=JSON.parse(fs.readFileSync(path.join(source,'host.json')));
 const deps=JSON.parse(fs.readFileSync(path.join(source,'dependencies.json')));
 const patch=settings.settingsStartup;
 assert.equal(patch.sourceSha256,deps.mods.find(m=>m.id==='windows-11-settings-styler').sha256);
 for(const field of ['executableSha256','xamlSha256'])assert.ok(patch.replacement.includes(host.settingsStartup[field]));
 const own=fs.readFileSync(path.join(source,'src/settings-core-window.cpp.in'),'utf8');
 assert.equal(patch.replacement,own.replace('@EXECUTABLE_SHA256@',host.settingsStartup.executableSha256).replace('@XAML_SHA256@',host.settingsStartup.xamlSha256));
});

test('Settings derived source journals both pins, restores the prior adapter, and refuses altered cache',t=>{
 const state=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-settings-source-'));
 t.after(()=>fs.rmSync(state,{recursive:true,force:true}));
 const source=path.join(state,'source');fs.cpSync(path.join(repoRoot,'ports/windows'),source,{recursive:true});
 const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));};
 const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
 const upstream='// @version 1.1\n'+fixture.toString(),upstreamDigest=hash(Buffer.from(upstream));
 write(path.join(state,'downloads/windows-11-settings-styler.wh.cpp'),upstream);
 write(path.join(source,'dependencies.json'),{mods:[{id:'windows-11-settings-styler',version:'1.1',sha256:upstreamDigest}]});
 const settingsFile=path.join(source,'dist/windows-settings.json'),settings=read(settingsFile);
 settings.bundledMods=[];settings.settingsStartup={sourceSha256:upstreamDigest,replacement};write(settingsFile,settings);
 const run=action=>spawnSync(process.execPath,[path.join(source,'dist/runtime.cjs')],{
  input:JSON.stringify({source,state,action,mode:'Full',revision:(action==='Apply'?'1':'2').repeat(40),fixture:true,
   fixtureWindhawk:path.join(repoRoot,'tests/fixtures/windows-windhawk.cjs')}),encoding:'utf8',timeout:30000});
 const ok=action=>{const result=run(action);assert.equal(result.status,0,result.stdout+'\n'+result.stderr);return result;};
 ok('Apply');ok('Test');
 const original=read(path.join(state,'fixture-windhawk-sources.json'))['local@windows-11-settings-styler'];
 const first=read(path.join(state,'journal.json')).transactions.at(-1).mods[0];
 assert.equal(first.upstreamSourceSha256,upstreamDigest);assert.equal(first.sourceSha256,hash(Buffer.from(original)));
 assert.notEqual(first.sourceSha256,upstreamDigest);
 settings.settingsStartup.replacement=replacement.replace('ownedWindow()','secondOwnedWindow()');write(settingsFile,settings);
 ok('Update');ok('Test');
 assert.notEqual(read(path.join(state,'fixture-windhawk-sources.json'))['local@windows-11-settings-styler'],original);
 const restore=spawnSync(process.execPath,[path.join(source,'dist/runtime.cjs')],{input:JSON.stringify({source,state,action:'Restore',latest:true,fixture:true,fixtureWindhawk:path.join(repoRoot,'tests/fixtures/windows-windhawk.cjs')}),encoding:'utf8',timeout:30000});
 assert.equal(restore.status,0,restore.stdout+'\n'+restore.stderr);ok('Test');
 assert.equal(read(path.join(state,'fixture-windhawk-sources.json'))['local@windows-11-settings-styler'],original);
 assert.equal(fs.readFileSync(path.join(state,'downloads/windows-11-settings-styler.wh.cpp'),'utf8'),upstream);
 const adapted=settingsStylerSource(Buffer.from(upstream),settings.settingsStartup);
 const derived=path.join(state,'downloads/derived/windows-11-settings-styler-'+hash(adapted)+'.wh.cpp');
 const before=read(path.join(state,'fixture-windhawk.json'));
 const compiles=read(path.join(state,'fixture-windhawk-activity.json')).compiles;
 fs.appendFileSync(derived,'// changed cache');
 const failed=run('Update');assert.notEqual(failed.status,0);assert.match(failed.stderr,/derived source cache differs/);
 assert.deepEqual(read(path.join(state,'fixture-windhawk.json')),before);
 assert.equal(read(path.join(state,'fixture-windhawk-activity.json')).compiles,compiles);
 fs.appendFileSync(path.join(state,'downloads/windows-11-settings-styler.wh.cpp'),'// changed upstream');
 const altered=run('Update');assert.notEqual(altered.status,0);assert.match(altered.stderr,/upstream source digest differs/);
 assert.deepEqual(read(path.join(state,'fixture-windhawk.json')),before);ok('Test');
});
