import { powershell as pwsh, powershellAvailable } from "./helpers/powershell.mjs";
import { readJsonWithBom as read } from "./helpers/json.mjs";
import { scratchDirSync } from "./helpers/scratch.mjs";
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {repoRoot} from '../scripts/lib/fs.mjs';


const unavailable=!powershellAvailable();
if(unavailable&&process.env.CI)test('Windows lifecycle tests require PowerShell',()=>assert.fail('PowerShell 7.4+ is required; set J3W1_PWSH'));
const installer=path.join(repoRoot,'ports/windows/install.ps1');

const write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof x==='string'?x:JSON.stringify(x));};
function fixture(t,mode='Native'){
 const root=scratchDirSync(t, 'j3w1-windows-wrapper-');
 const source=path.join(root,'source'),state=path.join(root,'state');
 fs.mkdirSync(source);fs.cpSync(path.join(repoRoot,'ports/windows'),path.join(source,'ports/windows'),{recursive:true});
 const env={...process.env,LOCALAPPDATA:path.join(root,'local'),APPDATA:path.join(root,'roaming'),HOME:path.join(root,'home'),USERPROFILE:path.join(root,'home'),XDG_CONFIG_HOME:path.join(root,'config'),XDG_CACHE_HOME:path.join(root,'cache'),POWERSHELL_TELEMETRY_OPTOUT:'1',NO_COLOR:'1'};
 for(const p of [env.LOCALAPPDATA,env.APPDATA,env.HOME,env.XDG_CONFIG_HOME,env.XDG_CACHE_HOME])fs.mkdirSync(p,{recursive:true});
 const git=(...args)=>{const r=spawnSync('git',['-C',source,...args],{env,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
 git('init');git('config','user.email','fixture@example.invalid');git('config','user.name','Fixture');git('config','core.autocrlf','false');
 const commit=()=>{git('add','.');git('commit','--allow-empty','-m','fixture');return git('rev-parse','HEAD');};
 const first=commit();git('tag','v4.0.0');
 const run=(action,args=[])=>spawnSync(pwsh,['-NoLogo','-NoProfile','-NonInteractive','-File',installer,'-Fixture','-Mode',mode,'-StateRoot',state,'-SourceRoot',source,'-Action',action,...args],{env,encoding:'utf8',timeout:90000});
 const ok=(action,args=[])=>{const r=run(action,args);assert.equal(r.status,0,`${action}: ${r.stdout}\n${r.stderr}`);return r;};
 const terminal=path.join(state,'fixture/terminal/settings.json');write(terminal,'{\n// original\n"profiles":{"list":[]}}');
 return {root,source,state,first,terminal,git,commit,run,ok,env};
}
const options={skip:unavailable?'PowerShell 7.4+ unavailable':false};
const lockImageDigest=value=>createHash('sha256').update(JSON.stringify({exists:value.exists,extension:value.extension,value:value.value})).digest('hex');
const fileDigest=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');

test('lock-screen acceptance follows the capable cache when appearance rolls back to older history',options,t=>{
 const f=fixture(t),file=path.join(f.state,'fixture/lockscreen.json');
 write(file,{exists:true,extension:'.jpg',value:Buffer.from('synthetic original picture').toString('base64')});f.ok('Apply',['-Revision',f.first]);
 const original=read(path.join(f.state,'journal.json')).transactions[0],chosen={exists:true,extension:'.jpg',value:Buffer.from('synthetic chosen picture').toString('base64')};write(file,chosen);
 const discover=JSON.parse(f.ok('Plan').stdout);assert.equal(discover.lockScreenPreservation.valueSha256,lockImageDigest(chosen));assert.equal(discover.lockScreenPreservation.requested,false);
 const second=f.commit(),args=['-Revision',second,'-KeepLockScreenValueSha256',lockImageDigest(chosen),'-ExpectedJournalSha256',fileDigest(path.join(f.state,'journal.json'))];
 f.ok('Plan',args);assert.ok(!fs.existsSync(path.join(f.state,'releases',second)));f.ok('Update',args);f.ok('Test');
 const history=read(path.join(f.state,'journal.json'));assert.equal(history.schemaVersion,2);assert.equal(history.lifecycleRevision,second);assert.deepEqual(history.transactions[0],original);assert.deepEqual(read(file),chosen);
 f.ok('Restore',['-Latest']);assert.equal(read(path.join(f.state,'current.json')).revision,f.first);assert.equal(read(path.join(f.state,'journal.json')).lifecycleRevision,second);f.ok('Test');
 const recovery=fs.readFileSync(path.join(f.state,'recovery-commands.txt'),'utf8');assert.ok(recovery.includes(second));assert.ok(!recovery.includes(f.first));
 // This synthetic reader proves its schema1 contract, not an old full installer.
 const legacy=path.join(f.root,'schema1-reader.cjs'),sentinel=path.join(f.root,'appearance-written');fs.writeFileSync(legacy,"const fs=require('node:fs');if(JSON.parse(fs.readFileSync(process.argv[2])).schemaVersion!==1)throw Error('Unsupported recovery journal');fs.writeFileSync(process.argv[3],'written');");
 const refused=spawnSync(process.execPath,[legacy,path.join(f.state,'journal.json'),sentinel],{encoding:'utf8'});assert.equal(refused.status,1);assert.match(refused.stderr,/Unsupported recovery journal/);assert.ok(!fs.existsSync(sentinel));
 const capable=path.join(f.state,'releases',second,'dist/runtime.cjs'),bytes=fs.readFileSync(capable);fs.appendFileSync(capable,'\n// tampered');
 assert.notEqual(f.run('Test').status,0);assert.deepEqual(read(file),chosen);fs.writeFileSync(capable,bytes);f.ok('Uninstall');assert.deepEqual(read(file),chosen);assert.ok(read(path.join(f.state,'journal.json')).transactions.every(x=>x.status==='restored'));
});

test('lock-screen acceptance refuses before journal migration if recovery commands cannot be saved',options,t=>{
 const f=fixture(t),file=path.join(f.state,'fixture/lockscreen.json');write(file,{exists:true,extension:'.jpg',value:Buffer.from('synthetic original').toString('base64')});f.ok('Apply',['-Revision',f.first]);
 const chosen={exists:true,extension:'.jpg',value:Buffer.from('synthetic keep choice').toString('base64')};write(file,chosen);const journal=path.join(f.state,'journal.json'),before=fs.readFileSync(journal),second=f.commit();
 const script=`. $env:J3W1_FIX_INSTALLER
function Save-J3w1SetupRecovery {throw 'Synthetic recovery-save failure'}
Invoke-J3w1WindowsLifecycle -Action Update -Mode Native -SourceRoot $env:J3W1_FIX_SOURCE -Revision $env:J3W1_FIX_REVISION -StateRoot $env:J3W1_FIX_STATE -KeepLockScreenValueSha256 $env:J3W1_FIX_VALUE -ExpectedJournalSha256 $env:J3W1_FIX_JOURNAL -Fixture`;
 const r=spawnSync(pwsh,['-NoLogo','-NoProfile','-NonInteractive','-Command',script],{env:{...f.env,J3W1_FIX_INSTALLER:installer,J3W1_FIX_SOURCE:f.source,J3W1_FIX_REVISION:second,J3W1_FIX_STATE:f.state,J3W1_FIX_VALUE:lockImageDigest(chosen),J3W1_FIX_JOURNAL:fileDigest(journal)},encoding:'utf8',timeout:90000});
 assert.notEqual(r.status,0);assert.match(r.stderr,/Synthetic recovery-save failure/);assert.deepEqual(fs.readFileSync(journal),before);assert.deepEqual(read(file),chosen);assert.equal(read(journal).schemaVersion,1);
});
test('explicit recovery revisions must match the schema2 capable cache',options,t=>{
 const f=fixture(t),file=path.join(f.state,'fixture/lockscreen.json'),journal=path.join(f.state,'journal.json');write(file,{exists:true,extension:'.jpg',value:Buffer.from('synthetic original').toString('base64')});f.ok('Apply',['-Revision',f.first]);
 const chosen={exists:true,extension:'.jpg',value:Buffer.from('synthetic accepted choice').toString('base64')};write(file,chosen);const second=f.commit();f.git('tag','v4.0.1',second);
 f.ok('Update',['-Revision',second,'-KeepLockScreenValueSha256',lockImageDigest(chosen),'-ExpectedJournalSha256',fileDigest(journal)]);f.ok('Test');f.ok('Test',['-Revision',second]);f.ok('Test',['-Version','v4.0.1']);
 const before=fs.readFileSync(journal);for(const action of ['Test','Restore','Uninstall','Guard']){const r=f.run(action,['-Revision',f.first]);assert.notEqual(r.status,0);assert.match(r.stderr,/Explicit recovery revision conflicts/);assert.deepEqual(fs.readFileSync(journal),before);assert.deepEqual(read(file),chosen);}
 const tag=f.run('Test',['-Version','v4.0.0']);assert.notEqual(tag.status,0);assert.match(tag.stderr,/Explicit recovery revision conflicts/);assert.deepEqual(fs.readFileSync(journal),before);f.ok('Uninstall',['-Revision',second]);assert.deepEqual(read(file),chosen);
});

test('pinned PowerShell lifecycle plans without state, applies offline tags, updates, restores and uninstalls',options,t=>{
 const f=fixture(t),before=fs.readFileSync(f.terminal,'utf8');
 f.ok('Plan',['-Version','v4.0.0']);assert.ok(!fs.existsSync(path.join(f.state,'releases')));assert.ok(!fs.existsSync(path.join(f.state,'journal.json')));
 // Uncommitted source edits must never enter the pinned cache.
 fs.appendFileSync(path.join(f.source,'ports/windows/adapter.ps1'),'\nthrow "uncommitted"\n');
 f.ok('Apply',['-Revision',f.first]);f.ok('Test');
 assert.equal(read(path.join(f.state,'current.json')).revision,f.first);
 const recovery=()=>fs.readFileSync(path.join(f.state,'recovery-commands.txt'),'utf8');
 const assertRecovery=revision=>{
  // PowerShell can expand an 8.3 TEMP alias or normalize path casing. Verify
  // the actual retained file and state directory, not their input spelling.
  const identity=p=>{const real=fs.realpathSync.native(p);return process.platform==='win32'?real.toLowerCase():real;};
  const commands=recovery().trim().split(/\r?\n/);
  assert.equal(commands.length,4);
  for(const line of commands){
   const match=line.match(/ -File '((?:[^']|'')+)' -StateRoot '((?:[^']|'')+)' -Action /);
   assert.ok(match,`Missing quoted installer or state argument: ${line}`);
   assert.equal(identity(match[1].replaceAll("''","'")),identity(path.join(f.state,'releases',revision,'install.ps1')));
   assert.equal(identity(match[2].replaceAll("''","'")),identity(f.state));
  }
  assert.deepEqual(commands.map(line=>line.slice(line.lastIndexOf(' -Action '))),[' -Action Test',' -Action Restore -Latest',' -Action Restore',' -Action Uninstall']);
 };
 const firstRecovery=recovery();
 assertRecovery(f.first);
 f.ok('Apply',['-Revision',f.first]);assert.equal(read(path.join(f.state,'journal.json')).transactions.length,1);
 f.git('restore','ports/windows/adapter.ps1');const second=f.commit();
 const denied=f.run('Update');assert.notEqual(denied.status,0);assert.match(denied.stderr,/Update requires an explicit/);
 f.ok('Update',['-Revision',second]);assert.equal(read(path.join(f.state,'current.json')).revision,second);
 assertRecovery(second);
 assert.ok(!recovery().includes(f.first));
 f.ok('Restore',['-Latest']);assert.equal(read(path.join(f.state,'current.json')).revision,f.first);f.ok('Test');
 assertRecovery(f.first);
 assert.equal(recovery(),firstRecovery);
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

test('Full Prepare retains release but leaves theme, font, engine and ownership state untouched',options,t=>{
 const f=fixture(t,'Full'),before=fs.readFileSync(f.terminal);
 const result=JSON.parse(f.ok('Prepare',['-Revision',f.first]).stdout);
 assert.equal(result.action,'Plan');assert.equal(result.mode,'Full');assert.equal(result.compatible,true);
 assert.equal(result.excludedAdapters.length,4);
 assert.deepEqual(fs.readFileSync(f.terminal),before);
 for(const name of ['journal.json','current.json','font-dependency.json','recovery-commands.txt','fixture-windhawk.json','fixture/font-registered.json'])
  assert.ok(!fs.existsSync(path.join(f.state,name)),name);
 assert.ok(fs.existsSync(path.join(f.state,'releases',f.first,'verified.json')));
});
test('tools-only bootstrap reuses canonical paths and refuses changed archives, publishers, versions and failed installation',options,t=>{
 const root=scratchDirSync(t,'j3w1-prepare-tools-');
 const script=String.raw`
 $ErrorActionPreference='Stop';$StateRoot=[IO.Path]::GetFullPath($env:J3W1_PREP_TEST_ROOT)
 $ast=[Management.Automation.Language.Parser]::ParseFile($env:J3W1_PREP_TEST_INSTALLER,[ref]$null,[ref]$null)
 foreach($name in @('Get-VerifiedDownload','Initialize-ThemeFullDependencies')){
  $node=$ast.Find({param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true)
  if(-not $node){throw "Missing actual bootstrap function: $name"};. ([scriptblock]::Create($node.Extent.Text))
 }
 function Assert-SafePath([string]$Path){if(-not [IO.Path]::GetFullPath($Path).StartsWith($StateRoot+[IO.Path]::DirectorySeparatorChar)){throw 'Fixture path escaped'}}
 $script:starts=0;$script:status='Valid';$script:publisher='CN=Fixture Publisher';$script:version='windhawk-cli 2.0.0-alpha.6';$script:exitCode=0
 function Get-AuthenticodeSignature {param($LiteralPath) @{Status=$script:status;SignerCertificate=@{Subject=$script:publisher}}}
 function Get-ThemeWindhawkVersion {param($Cli) $script:version}
 function Start-Process {param($FilePath,$ArgumentList,$WindowStyle,[switch]$Wait,[switch]$PassThru)
  if([IO.Path]::GetFileName($FilePath) -ne 'windhawk_setup_offline.exe' -or ($ArgumentList[0..2] -join ',') -ne '/S,/PORTABLE,/DEVTOOLS' -or $WindowStyle -ne 'Hidden'){throw 'Unexpected process launch'}
  $script:starts++;[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($script:cli))|Out-Null
  foreach($relative in @('Compiler/bin/clang++.exe','Engine/2.0.0/64/windhawk.lib')){
   $path=Join-Path ([IO.Path]::GetDirectoryName($script:cli)) $relative;[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($path))|Out-Null;[IO.File]::WriteAllText($path,'fixture only')
  }
  [IO.File]::WriteAllText($script:cli,'not executable: fixture only');@{ExitCode=$script:exitCode}
 }
 function Expect-Refusal([scriptblock]$Body,[string]$Pattern){try{& $Body}catch{if($_.Exception.Message -match $Pattern){return};throw};throw "Expected refusal: $Pattern"}
 Expect-Refusal {Assert-SafePath (Join-Path ([IO.Path]::GetDirectoryName($StateRoot)) 'fixture-outside')} 'Fixture path escaped'
 $downloads=Join-Path $StateRoot 'downloads';[IO.Directory]::CreateDirectory($downloads)|Out-Null
 $archive=Join-Path $downloads 'windhawk_setup_offline.exe';[IO.File]::WriteAllText($archive,'fixture archive')
 $hash=(Get-FileHash -LiteralPath $archive).Hash.ToLowerInvariant()
 $deps=@{windhawk=@{sha256=$hash;publisher='Fixture Publisher'};mods=@()}
 $script:cli=Join-Path $StateRoot 'tools/windhawk/2.0.0-alpha.6/windhawk-cli.exe'
 $owner=Join-Path $StateRoot 'owner-state.txt';[IO.File]::WriteAllText($owner,'running engine and owner settings remain unchanged')
 Initialize-ThemeFullDependencies $deps $downloads
 Initialize-ThemeFullDependencies $deps $downloads
 if($script:starts -ne 1){throw 'Cached compiler was reinstalled'}
 $deps.windhawk.sha256='0'*64;Expect-Refusal {Initialize-ThemeFullDependencies $deps $downloads} 'Dependency digest mismatch';$deps.windhawk.sha256=$hash
 $script:status='Invalid';Expect-Refusal {Initialize-ThemeFullDependencies $deps $downloads} 'publisher signature';$script:status='Valid'
 $script:publisher='CN=Wrong Publisher';Expect-Refusal {Initialize-ThemeFullDependencies $deps $downloads} 'publisher signature';$script:publisher='CN=Fixture Publisher'
 $script:version='wrong version';Expect-Refusal {Initialize-ThemeFullDependencies $deps $downloads} 'version differs';$script:version='windhawk-cli 2.0.0-alpha.6'
 $compiler=Join-Path ([IO.Path]::GetDirectoryName($script:cli)) 'Compiler/bin/clang++.exe'
 Remove-Item -LiteralPath $compiler;Expect-Refusal {Initialize-ThemeFullDependencies $deps $downloads} 'compiler is incomplete';[IO.File]::WriteAllText($compiler,'fixture only')
 if($script:starts -ne 1){throw 'A rejected dependency launched'}
 Remove-Item -LiteralPath $script:cli;Expect-Refusal {Initialize-ThemeFullDependencies $deps $downloads} 'directory is incomplete'
 [IO.File]::WriteAllText($script:cli,'fixture only')
 $script:exitCode=7
 # Exercise the failed fresh-install result in a separate empty canonical root.
 $StateRoot=Join-Path $StateRoot 'fresh';$script:cli=Join-Path $StateRoot 'tools/windhawk/2.0.0-alpha.6/windhawk-cli.exe'
 $freshDownloads=Join-Path $StateRoot 'downloads';[IO.Directory]::CreateDirectory($freshDownloads)|Out-Null
 [IO.File]::WriteAllText((Join-Path $freshDownloads 'windhawk_setup_offline.exe'),'fixture archive')
 Expect-Refusal {Initialize-ThemeFullDependencies $deps $freshDownloads} 'installation failed: 7'
 if([IO.File]::ReadAllText($owner) -cne 'running engine and owner settings remain unchanged'){throw 'Owner state changed'}
 if((Get-FileHash -LiteralPath $archive).Hash.ToLowerInvariant() -cne $hash){throw 'Archive changed'}
 foreach($name in @('journal.json','current.json','font-dependency.json','recovery-commands.txt')){if(Test-Path -LiteralPath (Join-Path $StateRoot $name)){throw 'Theme state created'}}
 @{cachedReused=$true;refusals=7;themeStateCreated=$false;starts=$script:starts}|ConvertTo-Json -Compress`;
 // Exercise a dot-segment root alias on every runner, preserving strict confinement.
 const r=spawnSync(pwsh,['-NoLogo','-NoProfile','-NonInteractive','-Command',script],{env:{...process.env,J3W1_PREP_TEST_ROOT:root+path.sep+'.',J3W1_PREP_TEST_INSTALLER:installer},encoding:'utf8',timeout:30000});
 assert.equal(r.status,0,r.stdout+'\n'+r.stderr);
 assert.deepEqual(JSON.parse(r.stdout),{cachedReused:true,refusals:7,themeStateCreated:false,starts:2});
});
test('Prepare retains verified release and returns a plan without mutating theme settings',options,t=>{
 const f=fixture(t),before=fs.readFileSync(f.terminal,'utf8');
 const result=f.ok('Prepare',['-Revision',f.first]);
 const plan=JSON.parse(result.stdout);
 assert.equal(plan.action,'Plan');assert.equal(plan.compatible,true);
 assert.equal(fs.readFileSync(f.terminal,'utf8'),before);
 assert.ok(!fs.existsSync(path.join(f.state,'journal.json')));
 assert.ok(!fs.existsSync(path.join(f.state,'current.json')));
 assert.ok(fs.existsSync(path.join(f.state,'releases',f.first,'verified.json')));
 f.ok('Apply',['-Revision',f.first]);f.ok('Test');
});

test('native Startup link preserves long explicit guard arguments without writing Startup',{skip:process.platform!=='win32'?'Native Windows shell-link API required':false},t=>{
 const folder=scratchDirSync(t, 'j3w1 startup link test ');
 const probe=spawnSync(pwsh,['-NoProfile','-Command','[Diagnostics.Process]::GetCurrentProcess().MainModule.FileName'],{encoding:'utf8',windowsHide:true,timeout:15000});
 assert.equal(probe.status,0,probe.stderr);
 const target=probe.stdout.trim(),working=path.join(folder,'guard source');fs.mkdirSync(working);
 fs.writeFileSync(path.join(working,'install.ps1'),'throw "The serializer must never execute this script"\n');
 const state=path.join(folder,'long state path '.repeat(15));
 const args=`-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -File "${path.join(working,'install.ps1')}" -Action Guard -StateRoot "${state}"`;
 assert.ok((target+' '+args).length>260);
 const invoke=request=>spawnSync(pwsh,['-NoProfile','-File',path.join(repoRoot,'ports/windows/adapter.ps1')],{input:JSON.stringify(request),encoding:'utf8',windowsHide:true,timeout:30000});
 const request={operation:'startupShortcut',target,arguments:args,workingDirectory:working};
 const startup=spawnSync(pwsh,['-NoProfile','-Command',"[Environment]::GetFolderPath([Environment+SpecialFolder]::Startup)"],{encoding:'utf8',windowsHide:true,timeout:15000});
 assert.equal(startup.status,0,startup.stderr);
 const destination=path.join(startup.stdout.trim(),'j3w1-theme-guard.lnk');
 const before=fs.existsSync(destination)?fs.readFileSync(destination):null;
 const result=invoke(request);assert.equal(result.status,0,result.stderr);
 const data=JSON.parse(result.stdout),link=path.join(folder,'serialized.lnk');
 assert.equal(path.basename(data.path),'j3w1-theme-guard.lnk');
 const serialized=Buffer.from(data.value,'base64');
 assert.ok(serialized.length>=76&&serialized.length<131072);
 assert.equal(serialized.readUInt32LE(20)&0x2000,0,'RunAsUser must remain disabled');
 fs.writeFileSync(link,Buffer.from(data.value,'base64'));
 const inspection=path.join(folder,'inspect.ps1');
 fs.writeFileSync(inspection,`$r=[Console]::In.ReadToEnd()|ConvertFrom-Json; $s=New-Object -ComObject WScript.Shell; $l=$s.CreateShortcut($r.link); @{target=$l.TargetPath;arguments=$l.Arguments;working=$l.WorkingDirectory;windowStyle=$l.WindowStyle;description=$l.Description}|ConvertTo-Json -Compress`);
 const shown=spawnSync(pwsh,['-NoProfile','-File',inspection],{input:JSON.stringify({link}),encoding:'utf8',windowsHide:true,timeout:15000});
 assert.equal(shown.status,0,shown.stderr);
 // Shell links expand Windows 8.3 path aliases, including CI's TEMP root.
 // Compare existing filesystem identities; guard arguments remain byte-exact.
 const identity=p=>fs.realpathSync.native(p).toLowerCase();
 const metadata=JSON.parse(shown.stdout);assert.equal(identity(metadata.target),identity(target));
 assert.equal(metadata.arguments,args);assert.equal(identity(metadata.working),identity(working));assert.equal(metadata.windowStyle,7);
 for(const bad of [{...request,arguments:args+'\n'}, {...request,target:path.join(folder,'unapproved.exe')}])assert.notEqual(invoke(bad).status,0);
 const junction=path.join(folder,'runtime-junction');fs.symlinkSync(path.dirname(target),junction,'junction');
 assert.notEqual(invoke({...request,target:path.join(junction,path.basename(target))}).status,0);
 // On an installed host, exercise reuse without writing its managed link.
 // CI without an existing link still exercises fresh native serialization.
 if(before!==null){
  const existing=spawnSync(pwsh,['-NoProfile','-File',inspection],{input:JSON.stringify({link:destination}),encoding:'utf8',windowsHide:true,timeout:15000});
  assert.equal(existing.status,0,existing.stderr);
  const owner=JSON.parse(existing.stdout);
  if(owner.description==='j3w1 theme compatibility guard'&&owner.windowStyle===7){
   const reused=invoke({operation:'startupShortcut',target:owner.target,arguments:owner.arguments,workingDirectory:owner.working,expectedShortcut:{path:destination,value:before.toString('base64')}});
   assert.equal(reused.status,0,reused.stderr);
   assert.equal(JSON.parse(reused.stdout).value,before.toString('base64'),'Exact journal bytes must be reused');
  }
 }
 assert.deepEqual(fs.existsSync(destination)?fs.readFileSync(destination):null,before,'Serialization must never write Startup');
});
