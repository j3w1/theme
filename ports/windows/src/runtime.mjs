import {shellCompatibility,stylerSettings,flattenStylerSettings} from './compatibility.mjs';
import {settingsStylerSource} from './settings-styler-source.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
import {parse,modify,applyEdits} from 'jsonc-parser';
import {sha256Hex as hash,writeDurableTemp,replaceDurableTemp} from '../../../scripts/lib/host-install/files.mjs';
const args=JSON.parse(fs.readFileSync(0,'utf8'));
const source=path.resolve(args.source), state=path.resolve(args.state), action=args.action;
const fixture=args.fixture===true;
if(process.platform!=='win32'&&!fixture)throw Error('Run on native Windows.');
const read=p=>fs.readFileSync(safe(p),'utf8'),json=p=>JSON.parse(read(p).replace(/^\uFEFF/,''));

const eq=isDeepStrictEqual;
const root=fixture?path.join(state,'fixture'):process.env.LOCALAPPDATA;
const settings=json(path.join(source,'dist/windows-settings.json')),v=settings.values;
const journal=path.join(state,'journal.json');
safe(source); safe(state);
const mutating = !['Plan','Test'].includes(action);
const lock = path.join(state, 'lifecycle.lock');
let lockFd;
if (mutating) {
 fs.mkdirSync(state, {recursive:true});
 try { lockFd=fs.openSync(safe(lock),'wx',0o600); }
 catch(error) { throw Error('Another lifecycle owns lifecycle.lock. If interrupted, verify its recorded process has ended before removing this lock and running Restore.'); }
 fs.writeFileSync(lockFd, JSON.stringify({pid:process.pid,action}));
 process.on('exit',()=>{fs.closeSync(lockFd);fs.unlinkSync(lock);});
}
let history=fs.existsSync(journal)?json(journal):{schemaVersion:1,transactions:[]};
if(history.schemaVersion!==1||!Array.isArray(history.transactions))throw Error('Unsupported recovery journal');

function safe(p) {
 p=path.resolve(p);
 for(let q=p;;q=path.dirname(q)) {
  try { if(fs.lstatSync(q).isSymbolicLink())throw Error(`Reparse/symlink refused: ${q}`); }
  catch(error) { if(error.code!=='ENOENT')throw error; }
  if(path.dirname(q)===q)break;
 }
 return p;
}
function atomic(p,b){safe(p);fs.mkdirSync(path.dirname(p),{recursive:true});const temp=writeDurableTemp(p,b);try{replaceDurableTemp(temp,p,{beforeAttempt:()=>safe(p)});}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}}
function persist(){atomic(journal,JSON.stringify(history,null,2)+'\n');}
function ps(request){
 if(fixture){const p=path.join(root,'registry.json'),reg=fs.existsSync(p)?json(p):{};if(request.operation==='get'){const key=request.key+'|'+request.name;return reg[key]??{exists:false};}if(request.operation==='set'){const key=request.key+'|'+request.name;if(request.value.exists)reg[key]=request.value;else delete reg[key];atomic(p,JSON.stringify(reg));return {ok:true};}return {ok:true};}
 const r=spawnSync(args.pwsh,['-NoLogo','-NoProfile','-NonInteractive','-File',path.join(source,'adapter.ps1')],{input:JSON.stringify(request),encoding:'utf8',windowsHide:true});if(r.status!==0)throw Error(`Windows adapter failed: ${r.stderr.trim()}`);return JSON.parse(r.stdout.trim());
}
function lockscreen(request){
 if(fixture){
  const file=path.join(root,'lockscreen.json');
  if(request.operation==='get')return fs.existsSync(file)?json(file):{exists:false};
  atomic(file,JSON.stringify(request.value));return {ok:true};
 }
 const executable=path.join(process.env.windir,'System32/WindowsPowerShell/v1.0/powershell.exe');
 const result=spawnSync(executable,['-NoLogo','-NoProfile','-NonInteractive','-File',path.join(source,'lockscreen.ps1')],{input:JSON.stringify(request),encoding:'utf8',windowsHide:true,maxBuffer:32*1024*1024});
 if(result.status!==0)throw Error(`Lock-screen API failed: ${result.stderr.trim()}`);
 return JSON.parse(result.stdout.trim());
}
function parseConfig(text){const errors=[];const value=parse(text.replace(/^\uFEFF/,''),errors,{allowTrailingComma:true,disallowComments:false});if(errors.length||value===null||typeof value!=='object'||Array.isArray(value))throw Error('Malformed JSON/JSONC settings; no edits made');return value;}
function getAt(obj,parts){let cur=obj;for(const key of parts){if(cur===null||typeof cur!=='object'||!Object.hasOwn(cur,key))return {exists:false};cur=cur[key];}return {exists:true,value:cur};}
function keysFor(op,config,writing=false) {
 if(op.member){
  const slot=getAt(config,op.member.collection),items=slot.exists?slot.value:[];
  if(!Array.isArray(items))throw Error('Managed collection is not an array');
  const matches=items.map((item,i)=>({item,i})).filter(({item})=>item?.[op.member.key]===op.member.value);
  if(matches.length>1)throw Error('Duplicate managed collection identity');
  return [...op.member.collection,matches[0]?.i??items.length,...op.keys];
 }
 if(!op.profile)return op.keys;
 const profiles=config.profiles?.list;
 if(!Array.isArray(profiles))throw Error('Terminal profile list was removed; restore conflict');
 const matches=profiles.map((p,i)=>({p,i})).filter(({p})=>p[op.profile.key]===op.profile.value);
 if(matches.length!==1)throw Error('Terminal profile identity changed; restore conflict');
 return ['profiles','list',matches[0].i,...op.keys];
}
function get(op){
 if(op.path)safe(op.path);
 if(op.kind==='lockscreen')return lockscreen({operation:'get'});
 if(op.kind==='windhawk-setting'){if(!fs.existsSync(windhawk)&&!fixture)return {exists:false};return {exists:true,value:wh(['app','settings','get']).settings[op.name]};}
 if(op.kind==='registry')return ps({operation:'get',key:op.key,name:op.name});
 if(op.kind==='json'){const text=fs.existsSync(op.path)?read(op.path):'{}';const config=parseConfig(text);return getAt(config,keysFor(op,config));}
 if(op.kind==='file'){return fs.existsSync(op.path)?{exists:true,value:fs.readFileSync(op.path).toString('base64')}:{exists:false};}
 throw Error('Unknown operation');
}
function put(op,value){
 if(op.kind==='lockscreen'){
  if(!value.exists||!['.jpg','.jpeg','.png','.bmp'].includes(value.extension))throw Error('Invalid lock-screen recovery image');
  const bytes=Buffer.from(value.value,'base64'),file=path.join(state,'recovery','lockscreen-'+hash(bytes)+value.extension);
  atomic(file,bytes);lockscreen({operation:'set',path:file,value});return;
 }
 if(op.kind==='windhawk-setting'){if(value.exists)wh(['app','settings','set',op.name,String(value.value)]);return;}
 if(op.kind==='registry')return ps({operation:'set',key:op.key,name:op.name,value});
 if(op.kind==='file'){if(value.exists)atomic(op.path,Buffer.from(value.value,'base64'));else if(fs.existsSync(op.path)){safe(op.path);fs.unlinkSync(op.path);}return;}
 const old=fs.existsSync(op.path)?read(op.path):'{}\n';parseConfig(old);
 const keys=keysFor(op,parseConfig(old));
 const bom=old.startsWith('\uFEFF')?'\uFEFF':'';
 const body=old.slice(bom.length);
 const next=bom+applyEdits(body,modify(body,keys,value.exists?value.value:undefined,{formattingOptions:{insertSpaces:true,tabSize:4,eol:old.includes('\r\n')?'\r\n':'\n'}}));
 const parsed=parseConfig(next);const expected=getAt(parsed,keysFor(op,parsed));if(!eq(expected,value))throw Error('JSON edit verification failed');
 if(fs.existsSync(op.path)&&read(op.path)!==old)throw Error('Concurrent settings edit; retry when application is closed');atomic(op.path,next);
}
const ops=[];
if(['Plan','Apply','Update'].includes(action)) {
const reg=(key,name,value,type='DWord')=>ops.push({kind:'registry',key,name,after:{exists:true,value,type}});
const file=(dest,from)=>ops.push({kind:'file',path:safe(dest),after:{exists:true,value:fs.readFileSync(path.join(source,'dist',from)).toString('base64')}});
const set=(p,keys,value)=>ops.push({kind:'json',path:safe(p),keys,after:{exists:true,value}});
const member=(p,collection,key,value,item)=>ops.push({kind:'json',path:safe(p),keys:[],member:{collection,key,value},after:{exists:true,value:item}});
if(args.mode==='Full'&&(!fixture||args.fixtureWindhawk)){
 const command=`"${args.guardPwsh??args.pwsh}" -NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -File "${path.join(source,'install.ps1')}" -Action Guard -StateRoot "${state}"`;
 reg('Software\\Microsoft\\Windows\\CurrentVersion\\Run','j3w1ThemeGuard',command,'String');
 ops.push({kind:'windhawk-setting',name:'disableUpdateCheck',after:{exists:true,value:true}});
}
const personalization='Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize';
reg(personalization,'AppsUseLightTheme',0);reg(personalization,'SystemUsesLightTheme',0);reg(personalization,'EnableTransparency',0);reg(personalization,'ColorPrevalence',0);
const accent=v['native.accent'].slice(1),rgb=accent.match(/../g),abgr=parseInt('ff'+rgb.toReversed().join(''),16),argb=parseInt('ff'+accent,16);
reg('Software\\Microsoft\\Windows\\DWM','AccentColor',abgr);reg('Software\\Microsoft\\Windows\\DWM','ColorizationColor',argb);reg('Software\\Microsoft\\Windows\\DWM','ColorPrevalence',1);
reg('Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Accent','AccentColorMenu',abgr);
const assets=path.join(state,'assets');file(path.join(assets,'j3w1-wallpaper.bmp'),'j3w1-wallpaper.bmp');
// Only generic folder defaults change. Per-folder desktop.ini and shortcuts
// retain their own icon registrations; defaults and assets share the journal.
for(const open of [false,true]){
 const name='j3w1-folder'+(open?'-open':'')+'.ico';file(path.join(assets,name),name);
 reg('Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Icons',open?'4':'3',path.join(assets,name),'String');
}
for(const category of ['Folder','Directory'])reg('Software\\Classes\\'+category+'\\DefaultIcon','',path.join(assets,'j3w1-folder.ico'),'String');
const lockBaseline=lockscreen({operation:'get'});
if(lockBaseline.exists)ops.push({kind:'lockscreen',after:{exists:true,value:fs.readFileSync(path.join(source,'dist/j3w1-wallpaper.bmp')).toString('base64'),extension:'.bmp'}});
reg('Control Panel\\Desktop','Wallpaper',path.join(assets,'j3w1-wallpaper.bmp'),'String');reg('Control Panel\\Desktop','WallpaperStyle','10','String');reg('Control Panel\\Desktop','TileWallpaper','0','String');
const cursorNames=['Arrow','Help','AppStarting','Wait','Crosshair','IBeam','NWPen','No','SizeNS','SizeWE','SizeNWSE','SizeNESW','SizeAll','UpArrow','Hand','Pin','Person'];
for(const name of cursorNames){const f='j3w1-'+name.toLowerCase()+'.cur';file(path.join(assets,f),f);reg('Control Panel\\Cursors',name,path.join(assets,f),'ExpandString');}
// Keep the owner-created j3w1.theme separate from this installed asset.
// Resolve the generated asset root for a custom StateRoot without INI injection.
if(/[\r\n]/.test(assets))throw Error('Theme asset path contains a line break');
const themeText=read(path.join(source,'dist/j3w1.theme')).replaceAll('%LOCALAPPDATA%\\j3w1-theme\\windows\\assets',assets.replaceAll('/','\\'));
ops.push({kind:'file',path:safe(path.join(root,'Microsoft/Windows/Themes/j3w1-managed.theme')),after:{exists:true,value:Buffer.from(themeText).toString('base64')}});

const terminal=fixture?path.join(root,'terminal/settings.json'):path.join(root,'Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json');
if(fs.existsSync(terminal)){
 file(path.join(root,'Microsoft/Windows Terminal/Fragments/j3w1/j3w1.json'),'terminal-fragment.json');
 const config=parseConfig(read(terminal));
 member(terminal,['themes'],'name','j3w1',json(path.join(source,'dist/terminal-theme.json')));set(terminal,['theme'],'j3w1');set(terminal,['profiles','defaults','colorScheme'],'j3w1');set(terminal,['profiles','defaults','font','face'],'SauceCodePro NFM');set(terminal,['profiles','defaults','opacity'],100);set(terminal,['profiles','defaults','useAcrylic'],false);
 for(const profile of config.profiles?.list??[]){
  const key=profile.guid?'guid':'name',identity={key,value:profile[key]};
  if(!identity.value||(config.profiles.list.filter(p=>p[key]===identity.value).length!==1))throw Error('Terminal profiles need unique GUIDs or names before theming');
  for(const [keys,value] of [[['colorScheme'],'j3w1'],[['font','face'],'SauceCodePro NFM'],[['opacity'],100],[['useAcrylic'],false]]) {
   ops.push({kind:'json',path:safe(terminal),keys,profile:identity,after:{exists:true,value}});
  }
 }
}
const pt=path.join(root,'Microsoft/PowerToys');
for(const [module,props] of Object.entries({FancyZones:{fancyzones_zoneHighlightColor:v['powertoys.highlight'],fancyzones_zoneColor:v['powertoys.inactive'],fancyzones_zoneBorderColor:v['powertoys.border'],fancyzones_zoneNumberColor:v['powertoys.number'],fancyzones_systemTheme:false},AlwaysOnTop:{'frame-color':v['native.accent'],'frame-accent-color':false,'frame-opacity':100,'frame-thickness':2,'round-corners-enabled':false}})){
 const f=path.join(pt,module,'settings.json');if(fs.existsSync(f)){const x=parseConfig(read(f));for(const [k,val] of Object.entries(props)){if(!Object.hasOwn(x.properties??{},k))throw Error(`Unsupported PowerToys setting ${module}/${k}`);set(f,['properties',k,'value'],val);}}
}
const layouts=path.join(pt,'FancyZones/custom-layouts.json');if(fs.existsSync(layouts)){const added=json(path.join(source,'dist/fancyzones-layouts.json'))['custom-layouts'];for(const item of added)member(layouts,['custom-layouts'],'uuid',item.uuid,item);}
const cmdpal=path.join(root,'Packages/Microsoft.CommandPalette_8wekyb3d8bbwe/LocalState/settings.json');
if(fs.existsSync(cmdpal)){
 const x=parseConfig(read(cmdpal));
 if(!x.CustomThemeColor||!['A','R','G','B'].every(k=>Number.isInteger(x.CustomThemeColor[k])))throw Error('Unsupported Command Palette color schema');
 const [R,G,B]=rgb.map(c=>parseInt(c,16));
 for(const [key,value]of Object.entries({Theme:'Dark',ColorizationMode:'CustomColor',CustomThemeColor:{A:255,R,G,B},CustomThemeColorIntensity:15,BackdropStyle:'Clear',BackdropOpacity:100})){
  if(!Object.hasOwn(x,key))throw Error(`Unsupported Command Palette setting ${key}`);
  set(cmdpal,[key],value);
 }
}
}
function compatibility(){
 if(fixture&&!args.environment)return {compatible:args.compatible!==false,startLayout:'redesigned'};
 return shellCompatibility(fixture?args.environment:ps({operation:'environment'}),settings.compatibility);
}
function compat(){return compatibility().compatible;}
const windhawk=path.join(state,'tools/windhawk/2.0.0-alpha.6/windhawk-cli.exe');
function wh(argv,allowMissing=false){const command=fixture&&args.fixtureWindhawk?process.execPath:windhawk;const prefix=fixture&&args.fixtureWindhawk?[args.fixtureWindhawk,state]:[];const r=spawnSync(command,[...prefix,'--json',...argv],{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});if(r.error)throw r.error;const result=r.stdout.trim()?JSON.parse(r.stdout):null;if(allowMissing&&result?.error?.code==='MOD_NOT_INSTALLED')return null;if(r.status!==0||result?.success===false)throw Error(`Windhawk ${argv.slice(0,3).join(' ')} failed: ${result?.error?.message??r.stderr.trim()}`);return result?.data;}
let fixtureEngineRunning=args.fixtureEngineStopped!==true;
function engineRunning(waitMs=0){
 if(fixture)return fixtureEngineRunning;
 return ps({operation:'engine',path:safe(path.join(path.dirname(windhawk),'windhawk.exe')),waitMs}).running===true;
}
function startWindhawk(){
 if(engineRunning())return;
 if(fixture){if(args.fixtureEngineStartupFails)throw Error('Theme engine failed to start');fixtureEngineRunning=true;return;}
 const executable=safe(path.join(path.dirname(windhawk),'windhawk.exe'));
 if(!fs.existsSync(executable))throw Error('Retained theme engine is missing');
 const child=spawn(executable,['-tray-only'],{detached:true,stdio:'ignore',windowsHide:true});
 child.on('error',()=>{});child.unref();
 if(!engineRunning(15000))throw Error('Theme engine failed to start; enabled settings do not establish active rendering');
}
// Reuse only a binary produced by an earlier managed compile. Source/version
// equality alone cannot establish which code is in the installed DLL.
function modArtifact(shown) {
 const name=shown?.config?.libraryFileName;
 if(typeof name!=='string'||!name.startsWith(shown.id+'_')||! /^[A-Za-z0-9@._-]+\.dll$/.test(name))return null;
 const file=safe(path.join(path.dirname(windhawk),'AppData/Engine/Mods/64',name));
 if(!fs.existsSync(file)||!fs.statSync(file).isFile())return null;
 return {id:shown.id,version:shown.metadata?.version,config:shown.config,sha256:hash(fs.readFileSync(file))};
}
function compiledReceipt(mod) {
 return mod.restorationReceipts?.at(-1)?.artifact??mod.artifact;
}
function previousManagedMod(tx,id) {
 return history.transactions.slice(0,history.transactions.indexOf(tx)).filter(t=>t.status==='applied').at(-1)?.mods?.find(m=>m.id===id);
}
function exportedSourceDigest(file,id) {
 const data=json(file);
 if(data.format!=='windhawk-user-data-v1'||!Array.isArray(data.mods))return null;
 const mods=data.mods.filter(m=>m.modId===id);
 if(mods.length!==1||typeof mods[0].source!=='string')return null;
 // Windhawk exports source using CRLF. Only normalize that representation;
 // preserve all other bytes, including the exact trailing newline.
 return hash(Buffer.from(mods[0].source.replace(/\r\n/g,'\n')));
}
function sameRestoredConfig(actual,expected) {
 const {libraryFileName:a,...left}=actual??{}, {libraryFileName:b,...right}=expected??{};
 return typeof a==='string'&&typeof b==='string'&&eq(left,right);
}
function sameModArtifact(shown,recorded) {
 if(!recorded)return false;
 const actual=modArtifact(shown);
 return actual!==null&&actual.id===recorded.id&&actual.version===recorded.version
  &&actual.sha256===recorded.sha256&&eq(actual.config,{...recorded.config,disabled:actual.config.disabled});
}
function sameSettingKeys(a,b) {
 const left=a?.settings,right=b?.settings;
 return left&&right&&eq(Object.keys(left).sort(),Object.keys(right).sort())
  &&Object.values(right).every(x=>['string','number','boolean'].includes(typeof x));
}
function stageMods(tx){
 if(args.mode!=='Full')return;
 if(fixture&&!args.fixtureWindhawk) { tx.mods=[];return; }
 if(!compat())throw Error('Unsupported Windows/shell fingerprint. Full mode refused; Native remains available.');
 if(!fixture&&!fs.existsSync(windhawk))throw Error('Pinned Windhawk CLI missing. Run the dependency bootstrap first.');
 const deps=json(path.join(source,'dependencies.json'));
 const bundled=settings.bundledMods??[];
 for(const mod of bundled)if(!/^[a-z0-9-]+$/.test(mod.id) || mod.path!==`dist/${mod.id}.wh.cpp` || !/^[a-f0-9]{64}$/.test(mod.sha256))throw Error('Invalid bundled Windhawk source');
 const upstream=deps.mods.map(mod=>{
  const sourcePath=safe(path.join(state,'downloads',mod.id+'.wh.cpp'));
  if(mod.id!=='windows-11-settings-styler')return {...mod,sourcePath};
  if(settings.settingsStartup?.sourceSha256!==mod.sha256)throw Error('Settings startup dependency pin differs');
  const adapted=settingsStylerSource(fs.readFileSync(sourcePath),settings.settingsStartup),sha256=hash(adapted);
  const derived=safe(path.join(state,'downloads','derived',mod.id+'-'+sha256+'.wh.cpp'));
  if(fs.existsSync(derived)){if(hash(fs.readFileSync(derived))!==sha256)throw Error('Settings derived source cache differs');}
  else atomic(derived,adapted);
  return {...mod,sourcePath:derived,upstreamSourceSha256:mod.sha256,sha256};
 });
 const mods=[...upstream,...bundled.map(m=>({...m,sourcePath:path.join(source,m.path)}))];
 if(new Set(mods.map(m=>m.id)).size!==mods.length)throw Error('Duplicate Windhawk adapter identity');
 for(const [index,mod] of mods.entries()){
  console.error(`Preparing theme adapter ${index+1} of ${mods.length}: ${mod.id}. Compilation can take a minute.`);
  const src=safe(mod.sourcePath);if(!fs.existsSync(src)||hash(fs.readFileSync(src))!==mod.sha256)throw Error(`Missing verified mod source: ${mod.id}`);
  if(wh(['mod','show',mod.id],true))throw Error(`An upstream-ID copy of ${mod.id} is already installed. Resolve that duplicate explicitly before staging the pinned local adapter.`);
  const installedId='local@'+mod.id;
  const before=wh(['mod','show',installedId],true),backup=path.join(state,'backups',tx.id+'-'+mod.id+'.json');
  if(before){fs.mkdirSync(path.dirname(backup),{recursive:true});wh(['data','export','--out',backup,'--mods',installedId,'--no-app-settings','--offline']);}
  const beforeSettings=before?wh(['mod','settings','get',installedId]):null;
  const prior=history.transactions.filter(t=>t.status==='applied').at(-1)?.mods?.find(m=>m.id===installedId);
  const reuse=before?.metadata?.version===mod.version&&prior?.sourceSha256===mod.sha256
   &&eq(beforeSettings,prior.settings)&&sameModArtifact(before,compiledReceipt(prior));
  const values=flattenStylerSettings(stylerSettings(json(path.join(source,'dist',mod.id+'.json')),settings.stylerVariants?.[mod.id],compatibility().startLayout));
  // An unchanged, enabled adapter owns no new mutation in this transaction.
  // Keep its verified live instance attached instead of cycling its hooks.
  const unchanged=reuse&&before.config.disabled===false
   &&Object.entries(values).every(([key,value])=>String((beforeSettings.settings??beforeSettings)[key])===String(value));
  tx.mods.push({id:installedId,sourceId:mod.id,version:mod.version,sourceSha256:mod.sha256,
   ...(mod.upstreamSourceSha256?{upstreamSourceSha256:mod.upstreamSourceSha256}:{}),
   before:before?{id:before.id,version:before.metadata?.version,config:before.config}:null,beforeSettings,backup:before?backup:null,
   backupSha256:before?hash(fs.readFileSync(safe(backup))):null,
   beforeSourceSha256:before&&prior?.sourceSha256===exportedSourceDigest(backup,installedId)?prior.sourceSha256:null,reused:reuse,unchanged,
   ...(unchanged?{settings:beforeSettings,artifact:modArtifact(before)}:{})});persist();
  if(unchanged){console.error('Keeping the verified active adapter unchanged: '+mod.id+'.');continue;}
  if(reuse){
   console.error('Reusing the verified compiled adapter: '+mod.id+'.');
   wh(['mod','disable',installedId]);
  }else{
   const installed=wh(['mod','install',mod.id,'--file',src,'--disabled']);
   if(installed?.id!==installedId)throw Error('Windhawk returned an unexpected installed identity');
  }
  const staged=wh(['mod','show',installedId]);
  if(staged?.config?.disabled!==true||staged?.metadata?.version!==mod.version)throw Error('Windhawk disabled staging or version readback failed');
  wh(['mod','settings','set',installedId,...Object.entries(values).map(([k,v])=>`${k}=${v}`)]);
  const got=wh(['mod','settings','get',installedId]);
  const actual=got.settings??got;
  if(!Object.entries(values).every(([key,value])=>String(actual[key])===String(value)))throw Error(`Windhawk settings readback differs: ${mod.id}`);
  tx.mods.at(-1).settings=got;tx.mods.at(-1).artifact=modArtifact(staged);persist();
  console.error(`Theme adapter ${index+1} of ${mods.length} verified.`);
 }
}

const label=op=>op.kind==='lockscreen'?'Windows lock-screen image':op.kind==='windhawk-setting'?`Windhawk/${op.name}`:op.kind==='registry'?`${op.key}/${op.name}`:op.path;
const opId=op=>JSON.stringify([op.kind,op.key,op.name,op.path,op.profile,op.member,op.keys]);
const currentPath=path.join(state,'current.json');
function updatePointer() {
 const active=history.transactions.filter(t=>t.status==='applied').at(-1);
 if(active)atomic(currentPath,JSON.stringify({revision:active.revision,mode:active.mode})+'\n');
 else if(fs.existsSync(currentPath))fs.unlinkSync(safe(currentPath));
}
function restore(tx) {
 const conflicts=[];
 for(const mod of [...(tx.mods??[])].reverse()) {
  if(mod.restored)continue;
  // No write was acquired: preserve the live instance and any later user edit.
  if(mod.unchanged){mod.restored=true;persist();continue;}
  console.error(`Restoring theme adapter ${mod.sourceId??mod.id}. Saved source may need compilation.`);
  try {
   if(!wh(['mod','show',mod.id],true)&&!mod.before){mod.restored=true;persist();continue;}
   const shown=wh(['mod','show',mod.id]),currentSettings=wh(['mod','settings','get',mod.id]);
   const reuseRestore=mod.reused&&mod.before&&sameSettingKeys(currentSettings,mod.beforeSettings)
    &&sameModArtifact(shown,compiledReceipt(mod));
   // An interrupted settings-only restore may already have written the exact
   // saved values. Require the same binary/config proof before resuming it.
   if(mod.settings&&!eq(currentSettings,mod.settings)
      &&!(reuseRestore&&eq(currentSettings,mod.beforeSettings))){conflicts.push(mod.id);continue;}
   if(!reuseRestore&&mod.backup&&mod.backupSha256&&hash(fs.readFileSync(safe(mod.backup)))!==mod.backupSha256)throw Error('Saved adapter export digest mismatch');
   wh(['mod','disable',mod.id]);
   if(reuseRestore){
    console.error('Restoring saved settings using the verified compiled adapter: '+mod.sourceId+'.');
    wh(['mod','settings','set',mod.id,...Object.entries(mod.beforeSettings.settings).map(([k,v])=>k+'='+v)]);
    if(!eq(wh(['mod','settings','get',mod.id]),mod.beforeSettings))throw Error('Saved settings readback differs');
    if(mod.before.config.disabled===false)wh(['mod','enable',mod.id]);
    if(!eq(wh(['mod','show',mod.id]).config,mod.before.config))throw Error('Saved configuration readback differs');
   }else if(mod.backup){
    wh(['--yes','data','import',mod.backup,'--mods',mod.id,'--no-app-settings','--offline']);
    if(mod.beforeSourceSha256){
     const prior=previousManagedMod(tx,mod.id),restored=wh(['mod','show',mod.id]);
     if(!prior||prior.sourceSha256!==mod.beforeSourceSha256||exportedSourceDigest(mod.backup,mod.id)!==prior.sourceSha256
       ||restored.metadata?.version!==prior.version||!eq(wh(['mod','settings','get',mod.id]),mod.beforeSettings)
       ||!sameRestoredConfig(restored.config,mod.before.config))throw Error('Restored adapter identity or settings mismatch');
     const artifact=modArtifact(restored);if(!artifact)throw Error('Restored adapter has no compiled artifact');
     // A managed offline import recompiles the exact saved source. Retain the
     // original compilation receipt as history and append the new identity.
     prior.compilationHistory??=[];
     prior.compilationHistory.push({sourceSha256:prior.sourceSha256,artifact:prior.artifact});
     prior.restorationReceipts??=[];
     prior.restorationReceipts.push({restoredBy:tx.id,sourceSha256:prior.sourceSha256,artifact});
     // The effective field remains readable by retained older Test/Guard runtimes.
     prior.artifact=artifact;
    }
   }
   else wh(['--yes','mod','remove',mod.id]);
   mod.restored=true;persist();
  }catch(error){conflicts.push(`${mod.id}: ${error.message}`);}
 }
 console.error('Restoring saved personalization and application settings.');
 // If nobody edited a JSON document since this transaction, restore its exact
 // bytes (including comments, absent parents and original file absence).
 const exact=new Set();
 for(const snapshot of tx.documents??[]) {
  if(!snapshot.after)continue;
  try {
   const op={kind:'file',path:snapshot.path};
   if(eq(get(op),snapshot.after)){
    put(op,snapshot.before);exact.add(snapshot.path);
    for(const item of tx.operations)if(item.kind==='json'&&item.path===snapshot.path)item.applied=false;
    persist();
   }
  }catch(error){conflicts.push(`${snapshot.path}: ${error.message}`);}
 }
 for(const op of tx.operations.toReversed()) {
  if(!op.applied||exact.has(op.path))continue;
  try {
   const now=get(op);
   if(eq(now,op.before)){op.applied=false;persist();continue;}
   if(!eq(now,op.after)){conflicts.push(label(op));continue;}
   put(op,op.before);op.applied=false;persist();
  }catch(error){conflicts.push(`${label(op)}: ${error.message}`);}
 }
 tx.status=conflicts.length?'restore-conflict':'restored';persist();
 return [...new Set(conflicts)];
}
function verify({checkEngine=true}={}) {
 const active=history.transactions.filter(t=>t.status==='applied');
 const tx=active.at(-1);
 if(!tx)throw Error('No installed transaction');
 const effective=new Map();
 for(const t of active)for(const op of t.operations)if(op.applied)effective.set(opId(op),op);
 const failed=[];
 for(const op of effective.values())try{if(!eq(get(op),op.after))failed.push(label(op));}catch(error){failed.push(label(op));}
 if(tx.mode==='Full') {
  if(checkEngine&&!engineRunning())failed.push('theme engine is not running');
  if(!compat())failed.push('shell compatibility');
  for(const mod of tx.mods??[])try{
   if(!eq(wh(['mod','settings','get',mod.id]),mod.settings))failed.push(`${mod.id}: settings drift`);
   const shown=wh(['mod','show',mod.id]);
   if(shown?.config?.disabled!==false)failed.push(`${mod.id}: disabled or unknown state`);
   if(shown?.metadata?.version!==mod.version)failed.push(`${mod.id}: version drift`);
   if(compiledReceipt(mod)&&!sameModArtifact(shown,compiledReceipt(mod)))failed.push(`${mod.id}: compiled artifact drift`);
  }catch(error){failed.push(`${mod.id}: ${error.message}`);}
 }
 return {result:failed.length?'failed':'passed',revision:tx.revision,failed,limitations:settings.limitations};
}
if(action==='Plan') {
 console.log(JSON.stringify({action,mode:args.mode,compatible:compat(),compatibility:compatibility(),operations:ops.map(op=>({kind:op.kind,target:label(op),keys:op.keys??op.name,changes:!eq(get(op),op.after)})),limitations:settings.limitations},null,2));
}else if(action==='Test') {
 const result=verify();console.log(JSON.stringify(result,null,2));if(result.failed.length)process.exitCode=1;
}else if(['Restore','Uninstall'].includes(action)) {
 const candidates=history.transactions.filter(t=>t.status!=='restored');
 const selected=args.latest?candidates.slice(-1):candidates;
 const conflicts=[];
 for(const [index,tx] of selected.toReversed().entries()) {
  console.error(`Restoring saved update ${index+1} of ${selected.length}.`);
  conflicts.push(...restore(tx));
  // Never traverse older baselines through a newer unresolved transaction.
  if(conflicts.length)break;
 }
 ps({operation:'refresh'});
 if(!conflicts.length)updatePointer();
 console.log(JSON.stringify({result:conflicts.length?'conflicts':'restored',conflicts,recovery:conflicts.length?'Resolve the listed values using journal.json, then rerun Restore. Backups are retained.':null}));
 if(conflicts.length)process.exitCode=2;
}else if(action==='Guard') {
 const tx=history.transactions.filter(x=>x.status==='applied'&&x.mode==='Full').at(-1);
 if(tx){
  const failures=[];
  // Disable every managed mod before deciding whether this sign-in may activate it.
  for(const mod of tx.mods??[])try{wh(['mod','disable',mod.id]);}catch(error){failures.push(`${mod.id}: ${error.message}`);}
  if(!compat())failures.push('unknown shell compatibility');
  for(const mod of tx.mods??[])try{
   const shown=wh(['mod','show',mod.id]);
   if(shown.metadata?.version!==mod.version||!eq(wh(['mod','settings','get',mod.id]),mod.settings))failures.push(`${mod.id}: version or settings drift`);
   if(compiledReceipt(mod)&&!sameModArtifact(shown,compiledReceipt(mod)))failures.push(`${mod.id}: compiled artifact drift`);
  }catch(error){failures.push(`${mod.id}: ${error.message}`);}
  if(wh(['app','settings','get']).settings.disableUpdateCheck!==true)failures.push('dependency update policy changed');
  if(!failures.length)try{for(const mod of tx.mods??[])wh(['mod','enable',mod.id]);startWindhawk();}catch(error){failures.push(error.message);for(const mod of tx.mods??[])try{wh(['mod','disable',mod.id]);}catch{}}
  console.log(JSON.stringify({shell:failures.length?'disabled-incompatible':'enabled',failures}));
  if(failures.length)process.exitCode=2;
 }
}else if(['Apply','Update'].includes(action)) {
 if(args.mode==='Full'&&!compat())throw Error('Full preflight failed: unsupported Windows/shell fingerprint');
 const currentMode=history.transactions.filter(t=>t.status==='applied').at(-1)?.mode;
 if(currentMode&&currentMode!==args.mode)throw Error('Restore the installed mode before changing Full/Native mode');
 const pending=history.transactions.find(x=>['applying','restore-conflict'].includes(x.status));
 if(pending)throw Error('Incomplete transaction: run Restore before another Apply');
 // User edits of an existing managed value require conflict resolution first.
 const effective=new Map();
 for(const tx of history.transactions.filter(t=>t.status==='applied'))for(const op of tx.operations)if(op.applied)effective.set(opId(op),op);
 for(const op of ops){const managed=effective.get(opId(op));if(managed&&!eq(get(op),managed.after))throw Error(`Managed setting conflict: ${label(op)}. Restore and resolve it before applying.`);}
 const planned=ops.map(op=>({...op,before:get(op)})).filter(op=>!eq(op.before,op.after));
 const previous=history.transactions.filter(t=>t.status==='applied').at(-1);
 if(!planned.length&&previous?.revision===args.revision&&previous?.mode===args.mode) {
  const checked=verify({checkEngine:false});if(checked.failed.length)throw Error('Installed state drift; run Test for details');
  if(args.mode==='Full')startWindhawk();
  console.log(JSON.stringify({result:'unchanged',revision:args.revision}));
 }else {
  const documents=[...new Set(planned.filter(op=>op.kind==='json').map(op=>op.path))].map(p=>({path:p,before:get({kind:'file',path:p})}));
  const tx={id:crypto.randomUUID(),revision:args.revision,mode:args.mode,status:'applying',operations:planned,documents,mods:[]};
  history.transactions.push(tx);persist();
  try {
   stageMods(tx);
   console.error('Applying personalization and application settings.');
   let completed=0;
   for(const op of planned) {
    if(!eq(get(op),op.before))throw Error('Concurrent edit before write');
    op.applied=true;persist();put(op,op.after);
    if(!eq(get(op),op.after))throw Error('Readback failed');
    const document=documents.find(d=>d.path===op.path);
    if(document){document.after=get({kind:'file',path:op.path});persist();}
    if(fixture&&args.failAfter===++completed)throw Error('Injected partial failure');
   }
   console.error('Refreshing the theme and verifying activation.');
   ps({operation:'refresh'});
   if(args.mode==='Full'&&!compat())throw Error('Compatibility changed during apply');
   for(const mod of tx.mods)if(!mod.unchanged)wh(['mod','enable',mod.id]);
   if(args.mode==='Full')startWindhawk();
   tx.status='applied';persist();updatePointer();
   console.log(JSON.stringify({result:'applied',revision:args.revision,changes:planned.length,limitations:settings.limitations}));
  }catch(error) {
   console.error('Installation failed; reversing this transaction before returning the error.');
   for(const mod of tx.mods)if(!mod.unchanged)try{wh(['mod','disable',mod.id]);}catch{}
   const conflicts=restore(tx);
   try{ps({operation:'refresh'});}catch(refreshError){conflicts.push(`Personalization refresh: ${refreshError.message}`);tx.status='restore-conflict';persist();}
   if(!conflicts.length)updatePointer();
   throw Error(`${error.message}; rollback ${conflicts.length?'needs conflict recovery; run Restore':'completed'}`);
  }
 }
}else throw Error('Unknown lifecycle action');
