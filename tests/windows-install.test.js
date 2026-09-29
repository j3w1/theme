import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {repoRoot} from '../scripts/lib/fs.mjs';

const pwsh=process.env.J3W1_PWSH??(process.platform==='win32'?'pwsh.exe':'pwsh');
const probe=spawnSync(pwsh,['--version'],{encoding:'utf8'});
const unavailable=probe.status!==0;
if(unavailable&&process.env.CI)test('Windows lifecycle tests require PowerShell',()=>assert.fail('PowerShell 7.4+ is required; set J3W1_PWSH'));
const installer=path.join(repoRoot,'ports/windows/install.ps1');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof x==='string'?x:JSON.stringify(x));};
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-windows-wrapper-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const source=path.join(root,'source'),state=path.join(root,'state');
 fs.mkdirSync(source);fs.cpSync(path.join(repoRoot,'ports/windows'),path.join(source,'ports/windows'),{recursive:true});
 const env={...process.env,LOCALAPPDATA:path.join(root,'local'),APPDATA:path.join(root,'roaming'),HOME:path.join(root,'home'),USERPROFILE:path.join(root,'home'),XDG_CONFIG_HOME:path.join(root,'config'),XDG_CACHE_HOME:path.join(root,'cache'),POWERSHELL_TELEMETRY_OPTOUT:'1',NO_COLOR:'1'};
 for(const p of [env.LOCALAPPDATA,env.APPDATA,env.HOME,env.XDG_CONFIG_HOME,env.XDG_CACHE_HOME])fs.mkdirSync(p,{recursive:true});
 const git=(...args)=>{const r=spawnSync('git',['-C',source,...args],{env,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
 git('init');git('config','user.email','fixture@example.invalid');git('config','user.name','Fixture');git('config','core.autocrlf','false');
 const commit=()=>{git('add','.');git('commit','--allow-empty','-m','fixture');return git('rev-parse','HEAD');};
 const first=commit();git('tag','v4.0.0');
 const run=(action,args=[])=>spawnSync(pwsh,['-NoLogo','-NoProfile','-NonInteractive','-File',installer,'-Fixture','-Mode','Native','-StateRoot',state,'-SourceRoot',source,'-Action',action,...args],{env,encoding:'utf8',timeout:90000});
 const ok=(action,args=[])=>{const r=run(action,args);assert.equal(r.status,0,`${action}: ${r.stdout}\n${r.stderr}`);return r;};
 const terminal=path.join(state,'fixture/terminal/settings.json');write(terminal,'{\n// original\n"profiles":{"list":[]}}');
 return {root,source,state,first,terminal,git,commit,run,ok};
}
const options={skip:unavailable?'PowerShell 7.4+ unavailable':false};
test('pinned PowerShell lifecycle plans without state, applies offline tags, updates, restores and uninstalls',options,t=>{
 const f=fixture(t),before=fs.readFileSync(f.terminal,'utf8');
 f.ok('Plan',['-Version','v4.0.0']);assert.ok(!fs.existsSync(path.join(f.state,'releases')));assert.ok(!fs.existsSync(path.join(f.state,'journal.json')));
 // Uncommitted source edits must never enter the pinned cache.
 fs.appendFileSync(path.join(f.source,'ports/windows/adapter.ps1'),'\nthrow "uncommitted"\n');
 f.ok('Apply',['-Revision',f.first]);f.ok('Test');
 assert.equal(read(path.join(f.state,'current.json')).revision,f.first);
 f.ok('Apply',['-Revision',f.first]);assert.equal(read(path.join(f.state,'journal.json')).transactions.length,1);
 f.git('restore','ports/windows/adapter.ps1');const second=f.commit();
 const denied=f.run('Update');assert.notEqual(denied.status,0);assert.match(denied.stderr,/Update requires an explicit/);
 f.ok('Update',['-Revision',second]);assert.equal(read(path.join(f.state,'current.json')).revision,second);
 f.ok('Restore',['-Latest']);assert.equal(read(path.join(f.state,'current.json')).revision,f.first);f.ok('Test');
 f.ok('Uninstall');assert.equal(fs.readFileSync(f.terminal,'utf8'),before);assert.ok(!fs.existsSync(path.join(f.state,'current.json')));
});
test('cached executable or manifest changes are rejected before invocation',options,t=>{
 const f=fixture(t);f.ok('Apply',['-Revision',f.first]);
 const release=path.join(f.state,'releases',f.first),runtime=path.join(release,'dist/runtime.cjs');
 const original=fs.readFileSync(runtime);fs.appendFileSync(runtime,'\nthrow Error("tampered");');
 const r=f.run('Test');assert.notEqual(r.status,0);assert.match(r.stderr,/Cached release changed/);
 fs.writeFileSync(runtime,original);fs.appendFileSync(path.join(release,'install-manifest.json'),' ');
 const changed=f.run('Restore');assert.notEqual(changed.status,0);assert.match(changed.stderr,/Cached release manifest changed/);
});
test('missing recovery cache does not download or create a replacement',options,t=>{
 const f=fixture(t);write(path.join(f.state,'current.json'),{revision:f.first,mode:'Native'});
 const r=f.run('Restore');assert.notEqual(r.status,0);assert.match(r.stderr,/cache is unavailable/);assert.ok(!fs.existsSync(path.join(f.state,'releases')));
});
test('explicit fixed offline revision restores old journal without replacing old cache provenance',options,t=>{
 const f=fixture(t),before=fs.readFileSync(f.terminal,'utf8');
 f.ok('Apply',['-Revision',f.first]);
 const oldMarker=path.join(f.state,'releases',f.first,'verified.json'),oldBytes=fs.readFileSync(oldMarker);
 const second=f.commit();assert.notEqual(second,f.first);
 assert.ok(!fs.existsSync(path.join(f.state,'releases',second)));
 f.ok('Restore',['-Revision',second]);
 assert.equal(fs.readFileSync(f.terminal,'utf8'),before);
 assert.deepEqual(fs.readFileSync(oldMarker),oldBytes);
 assert.equal(read(path.join(f.state,'releases',second,'verified.json')).revision,second);
 const transactions=read(path.join(f.state,'journal.json')).transactions;
 assert.equal(transactions.length,1);assert.equal(transactions[0].revision,f.first);
 assert.equal(transactions[0].status,'restored');
 assert.ok(!fs.existsSync(path.join(f.state,'current.json')));
});

for(const kind of ['unsafe','duplicate','digest'])test(`release preflight rejects ${kind} manifests without settings writes`,options,t=>{
 const f=fixture(t),p=path.join(f.source,'ports/windows/dist/install-manifest.json'),manifest=read(p);
 if(kind==='unsafe')manifest.files[0].path='dist/../../escape';
 if(kind==='duplicate')manifest.files.push({...manifest.files[0]});
 if(kind==='digest')manifest.files[0].sha256='0'.repeat(64);
 write(p,manifest);const revision=f.commit(),r=f.run('Apply',['-Revision',revision]);
 assert.notEqual(r.status,0);assert.match(r.stderr,kind==='digest'?/digest mismatch/:/Unsafe, duplicate/);
 assert.ok(!fs.existsSync(path.join(f.state,'journal.json')));assert.ok(!fs.existsSync(path.join(f.state,'fixture/registry.json')));
});

test('interrupted first install recovers from the journal without an installed pointer',options,t=>{
 const f=fixture(t);f.ok('Apply',['-Revision',f.first]);
 const pointer=path.join(f.state,'current.json'),journal=path.join(f.state,'journal.json');
 fs.unlinkSync(pointer);const history=read(journal);history.transactions[0].status='applying';write(journal,history);
 f.ok('Restore');assert.equal(read(journal).transactions[0].status,'restored');
});
test('partial failure rolls back through the wrapper and a bootstrap lock refuses concurrent cache writes',options,t=>{
 const f=fixture(t),before=fs.readFileSync(f.terminal,'utf8');
 const failed=f.run('Apply',['-Revision',f.first,'-FixtureFailAfter','50']);
 assert.notEqual(failed.status,0);assert.match(failed.stderr,/Injected partial failure/);
 assert.equal(fs.readFileSync(f.terminal,'utf8'),before);assert.equal(read(path.join(f.state,'journal.json')).transactions[0].status,'restored');
 write(path.join(f.state,'bootstrap.lock'),{pid:process.pid});
 const locked=f.run('Apply',['-Revision',f.first]);assert.notEqual(locked.status,0);assert.match(locked.stderr,/Another lifecycle owns bootstrap.lock/);
});
test('unavailable offline revision fails before registry writes and retains no verified cache',options,t=>{
 const f=fixture(t),revision='f'.repeat(40),failed=f.run('Apply',['-Revision',revision]);
 assert.notEqual(failed.status,0);assert.match(failed.stderr,/Pinned Git read failed/);
 assert.ok(!fs.existsSync(path.join(f.state,'journal.json')));assert.ok(!fs.existsSync(path.join(f.state,'releases',revision,'verified.json')));
});

test('native registry adapter preserves the unsigned high bit of ARGB DWORD colors', {skip:unavailable}, () => {
 const script=`$ast=[Management.Automation.Language.Parser]::ParseFile($env:J3W1_ADAPTER_TEST_PATH,[ref]$null,[ref]$null)
 $function=$ast.Find({param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'ConvertFrom-RegistryDword'},$true)
 if(-not $function){throw 'Missing adapter conversion'}
 . ([scriptblock]::Create($function.Extent.Text))
 @(0,2147483647,-2147483648,-1,-15990576)|ForEach-Object {ConvertFrom-RegistryDword $_}|ConvertTo-Json -Compress`;
 const result=spawnSync(pwsh,['-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8',env:{...process.env,J3W1_ADAPTER_TEST_PATH:path.join(repoRoot,'ports/windows/adapter.ps1')}});
 assert.equal(result.status,0,result.stderr);
 assert.deepEqual(JSON.parse(result.stdout),[0,2147483647,2147483648,4294967295,4278976720]);
});
