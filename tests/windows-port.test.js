import assert from 'node:assert/strict';
import test from 'node:test';
import {parse} from 'jsonc-parser';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {repoRoot,readJson} from '../scripts/lib/fs.mjs';
import {assertPortArtifacts} from '../scripts/lib/port-artifacts.mjs';
import {CURSOR_NAMES,windowsStyleValue} from '../scripts/lib/windows-port.mjs';

const source=path.join(repoRoot,'ports/windows');
const runtime=path.join(source,'dist/runtime.cjs');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const readConfig=p=>{const errors=[];const value=parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''),errors,{allowTrailingComma:true});assert.deepEqual(errors,[],`Invalid settings: ${p}`);return value;};
const write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof x==='string'?x:JSON.stringify(x,null,2)+'\n');};
function fixture(t) {
 const state=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-windows-test-'));
 t.after(()=>fs.rmSync(state,{recursive:true,force:true}));
 const terminal=path.join(state,'fixture/terminal/settings.json');
 const before='\uFEFF{\n // keep this comment\n "profiles": {"list": [{"guid":"one","commandline":"keep-one","font":{"size":17},"colorScheme":"j3w1zsh"},{"guid":"two","commandline":"keep-two"}]},\n "keybindings": [{"command":"paste","keys":"ctrl+v"}],\n}\n';
 write(terminal,before);
 const run=(action,extra={})=>spawnSync(process.execPath,[runtime],{input:JSON.stringify({action,source,state,fixture:true,mode:'Native',revision:'1'.repeat(40),...extra}),encoding:'utf8',timeout:30000});
 const ok=(action,extra={})=>{const r=run(action,extra);assert.equal(r.status,0,`${action}: ${r.stderr}`);return r;};
 return {state,terminal,before,run,ok,journal:()=>read(path.join(state,'journal.json'))};
}

test('Windows manifest covers every binary and executable artifact byte exactly',async()=>{
 const port=await readJson('ports/windows/port.json');
 const manifest=await readJson('ports/windows/dist/install-manifest.json');
 assert.deepEqual(new Set(manifest.files.filter(f=>f.path.startsWith('dist/')).map(f=>f.path)),new Set(port.files.map(f=>f.path).filter(p=>!p.endsWith('/install-manifest.json'))));
 assert.equal(new Set(manifest.files.map(f=>f.path.toLowerCase())).size,manifest.files.length);
 for(const file of manifest.files){assert.match(file.path,/^(?:dist\/[a-z0-9.-]+|install\.ps1|setup\.ps1|adapter\.ps1|lockscreen\.ps1|dependencies\.json|host\.json)$/);assert.equal(sha(fs.readFileSync(path.join(source,file.path))),file.sha256,file.path);}
 const emitted=port.files.map(f=>({path:f.path,bytes:fs.readFileSync(path.join(source,f.path))}));
 assert.doesNotThrow(()=>assertPortArtifacts(port,emitted));
 assert.throws(()=>assertPortArtifacts(port,[...emitted,{...emitted[0]}]),/duplicate/);
 assert.throws(()=>assertPortArtifacts(port,emitted.slice(1)),/missing/);
 assert.throws(()=>assertPortArtifacts(port,[...emitted.slice(1),{path:'dist/../unsafe',bytes:Buffer.alloc(1)}]),/invalid|unsafe/);
});

test('Windows native values, Terminal ANSI and styler selectors resolve from canonical roles',async()=>{
 const host=await readJson('ports/windows/host.json');
 const resolved=await readJson('exports/tokens.resolved.json');
 const tokens=resolved.profiles.default.tokens;
 const settings=await readJson('ports/windows/dist/windows-settings.json');
 for(const [key,role]of Object.entries(host.roles))assert.equal(settings.values[key],tokens[role].css,key);
 const terminal=await readJson('ports/windows/dist/terminal-fragment.json');
 assert.equal(terminal.schemes[0].foreground,'#e99499');
 const ansi=['black','red','green','yellow','blue','purple','cyan','white','brightBlack','brightRed','brightGreen','brightYellow','brightBlue','brightPurple','brightCyan','brightWhite'];
 ansi.forEach((key,i)=>assert.equal(terminal.schemes[0][key],tokens[`color.terminal.ansi.${i}`].css));
 for(const styler of host.stylers){const x=await readJson(`ports/windows/dist/${styler.id}.json`);assert.deepEqual(x.controlStyles,styler.targets.map(t=>({target:t.target,styles:Object.entries(t.styles).map(([k,r])=>`${k}=${windowsStyleValue(k,{type:tokens[r].type,resolved:tokens[r].value})}`)})));}
 assert.equal(settings.version,(await readJson('theme.json')).version);
});

test('XAML color values preserve RGB and encode transparency in native ARGB order',async()=>{
 const value=alpha=>({type:'color',resolved:{colorSpace:'srgb',hex:'#112233',alpha}});
 for(const [alpha,expected]of [[0,'#00112233'],[.12,'#1f112233'],[.5,'#80112233'],[1,'#112233']])
  assert.equal(windowsStyleValue('Background@Normal',value(alpha)),expected);
 for(const alpha of [-1,1.1,NaN,Infinity])assert.throws(()=>windowsStyleValue('Background',value(alpha)),/valid sRGB/);
 const host=await readJson('ports/windows/host.json');
 for(const styler of host.stylers){
  const payload=await readJson(`ports/windows/dist/${styler.id}.json`);
  for(const target of payload.controlStyles)for(const style of target.styles){
   const [key,color]=style.split('=');
   if(/^(Background|Foreground|BorderBrush|Fill)(@|$)/.test(key))assert.match(color,/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i,style);
  }
  for(const resource of payload.themeResourceVariables)assert.match(resource.split('=')[1],/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i,resource);
 }
 const payload=await readJson('ports/windows/dist/windows-11-notification-center-styler.json');
 assert.ok(payload.controlStyles.find(x=>x.target==='Button#VerbButton').styles.includes('Background=#00000000'));
});

test('Explorer marquee settings encode canonical alpha and module compatibility',async()=>{
 const settings=await readJson('ports/windows/dist/j3w1-explorer-native.json');
 const tokens=(await readJson('exports/tokens.resolved.json')).profiles.default.tokens;
 for(const [key,role] of Object.entries((await readJson('ports/windows/host.json')).nativeExplorer)){
  if(key==='version')continue;
  assert.equal(settings[key],windowsStyleValue(key,{type:tokens[role].type,resolved:tokens[role].value}));
 }
 assert.equal(settings.marquee,'#1f911410');
 assert.equal(settings.marqueeBorder,'#e53935');
 const source=fs.readFileSync(path.join(repoRoot,'ports/windows/dist/j3w1-explorer-native.wh.cpp'),'utf8');
 assert.match(source,/FixedModuleVersion\(frame,MAKELONG\(0,10\),MAKELONG\(9549,26100\)\)/);
 assert.match(source,/FixedModuleVersion\(dui,MAKELONG\(0,10\),MAKELONG\(9549,26100\)\)/);
 assert.doesNotMatch(source,/@[A-Z0-9_]+@/);
});

test('Explorer submenu stays on the hover palette while its child flyout is open',async()=>{
 const config=await readJson('ports/windows/dist/windows-11-file-explorer-styler.json');
 const submenu=config.controlStyles.find(x=>x.target==='MenuFlyoutSubItem > Grid#LayoutRoot@CommonStates');
 const value=name=>submenu.styles.find(s=>s.startsWith(`${name}=`))?.split('=').slice(1).join('=');
 assert.equal(value('Background@SubMenuOpened'),value('Background@PointerOver'));
 assert.ok(value('Background@SubMenuOpened'));
 assert.notEqual(value('Background@SubMenuOpened'),value('Background@Normal'));
 assert.notEqual(value('Background@SubMenuOpened'),value('Background@Disabled'));
});

test('toast actions use the secondary palette across native states without changing content or geometry',async()=>{
 const payload=await readJson('ports/windows/dist/windows-11-notification-center-styler.json');
 const tokens=(await readJson('exports/tokens.resolved.json')).profiles.default.tokens;
 const button=payload.controlStyles.find(t=>t.target==='Button#VerbButton');
 const presenter=payload.controlStyles.find(t=>t.target==='Button#VerbButton > ContentPresenter@CommonStates');
 const expected=(key,role)=>`${key}=${windowsStyleValue(key,{type:tokens[role].type,resolved:tokens[role].value})}`;
 for(const [state,bg,fg,border] of [
  ['Normal','color.action.secondary.bg','color.action.secondary.text','color.action.secondary.border'],
  ['PointerOver','color.action.secondary.hover-bg','color.action.secondary.text','color.action.secondary.border'],
  ['Pressed','color.action.secondary.pressed-bg','color.action.secondary.text','color.border.active'],
  ['Disabled','color.interaction.disabled.bg','color.text.disabled','color.border.disabled'],
 ]){
  for(const [key,role] of [['Background',bg],['Foreground',fg],['BorderBrush',border]])
   assert.ok(presenter.styles.includes(expected(`${key}@${state}`,role)),`${key}@${state}`);
 }
 assert.ok(button.styles.includes(expected('Foreground','color.action.secondary.text')));
 for(const entry of [button,presenter])for(const style of entry.styles)
  assert.doesNotMatch(style,/^(?:Content|Text|Command|IsEnabled|Width|Height|MinWidth|MinHeight|Padding|Margin|BorderThickness|UseSystemFocusVisuals)=/);
});

test('Windows theme has required registration sections and retains the installed assets',t=>{
 const theme=fs.readFileSync(path.join(source,'dist/j3w1.theme'),'utf8');
 assert.match(theme,/\[Control Panel\\Desktop\]\nWallpaper=%LOCALAPPDATA%\\j3w1-theme\\windows\\assets\\j3w1-wallpaper\.bmp/);
 assert.match(theme,/\[MasterThemeSelector\]\nMTSM=DABJDKT/);
 assert.doesNotMatch(theme,/HighContrast=/);
 for(const name of CURSOR_NAMES)assert.ok(theme.includes(`${name}=%LOCALAPPDATA%\\j3w1-theme\\windows\\assets\\j3w1-${name.toLowerCase()}.cur`));
 const f=fixture(t),file=path.join(f.state,'fixture/Microsoft/Windows/Themes/j3w1-managed.theme');
 const ownerFile=path.join(f.state,'fixture/Microsoft/Windows/Themes/j3w1.theme');
 write(ownerFile,'owner-created theme');f.ok('Apply');
 const installed=fs.readFileSync(file,'utf8');
 assert.ok(installed.includes(path.join(f.state,'assets').replaceAll('/','\\')));
 assert.ok(!installed.includes('%LOCALAPPDATA%\\j3w1-theme\\windows\\assets'));
 f.ok('Test');f.ok('Restore');assert.ok(!fs.existsSync(file));
 assert.equal(fs.readFileSync(ownerFile,'utf8'),'owner-created theme');
});

test('all standard cursors have bounded hotspots, four scaled images and complete bitmap planes',()=>{
 for(const name of CURSOR_NAMES){const b=fs.readFileSync(path.join(source,`dist/j3w1-${name.toLowerCase()}.cur`));assert.equal(b.readUInt16LE(0),0);assert.equal(b.readUInt16LE(2),2);assert.equal(b.readUInt16LE(4),4);let end=70;
  [32,48,64,96].forEach((size,i)=>{const n=6+16*i,start=b.readUInt32LE(n+12),length=b.readUInt32LE(n+8);assert.equal(b[n],size);assert.equal(b[n+1],size);assert.ok(b.readUInt16LE(n+4)<size);assert.ok(b.readUInt16LE(n+6)<size);assert.equal(start,end);assert.equal(length,40+size*size*4+Math.ceil(size/32)*4*size);assert.equal(b.readUInt32LE(start),40);assert.equal(b.readInt32LE(start+8),size*2);assert.equal(b.readUInt16LE(start+14),32);end=start+length;});assert.equal(end,b.length);
 }
});

test('Plan changes no settings, creates no journal and Full rejects unknown compatibility',t=>{
 const f=fixture(t);f.ok('Plan');assert.equal(fs.readFileSync(f.terminal,'utf8'),f.before);assert.ok(!fs.existsSync(path.join(f.state,'journal.json')));
 const r=f.run('Apply',{mode:'Full',compatible:false});assert.notEqual(r.status,0);assert.match(r.stderr,/unsupported/);assert.ok(!fs.existsSync(path.join(f.state,'journal.json')));
});
test('apply is idempotent and original restore preserves exact JSONC bytes and file absence',t=>{
 const f=fixture(t);f.ok('Apply');f.ok('Test');const count=f.journal().transactions.length;f.ok('Apply');assert.equal(f.journal().transactions.length,count);
 f.ok('Restore');assert.equal(fs.readFileSync(f.terminal,'utf8'),f.before);assert.deepEqual(read(path.join(f.state,'fixture/registry.json')),{});assert.ok(!fs.existsSync(path.join(f.state,'assets/j3w1-arrow.cur')));assert.ok(!fs.existsSync(path.join(f.state,'current.json')));
});
test('update with unchanged visual values still pins new revision; Latest returns to previous release',t=>{
 const f=fixture(t);f.ok('Apply');f.ok('Update',{revision:'2'.repeat(40)});assert.equal(read(path.join(f.state,'current.json')).revision,'2'.repeat(40));
 f.ok('Restore',{latest:true});assert.equal(read(path.join(f.state,'current.json')).revision,'1'.repeat(40));f.ok('Test');f.ok('Uninstall');assert.equal(fs.readFileSync(f.terminal,'utf8'),f.before);
});
test('Test verifies effective settings from earlier transactions after an update',t=>{
 const f=fixture(t);f.ok('Apply');f.ok('Update',{revision:'2'.repeat(40)});const x=readConfig(f.terminal);x.profiles.defaults.opacity=45;write(f.terminal,x);assert.notEqual(f.run('Test').status,0);assert.notEqual(f.run('Apply').status,0);
});
test('later unrelated edits survive restore, and profile reordering follows GUID rather than index',t=>{
 const f=fixture(t);f.ok('Apply');const x=readConfig(f.terminal);x.profiles.list.reverse();x.newUserPreference=true;write(f.terminal,x);f.ok('Test');f.ok('Restore');const got=readConfig(f.terminal);assert.equal(got.newUserPreference,true);assert.equal(got.profiles.list[0].guid,'two');assert.equal(got.profiles.list[0].commandline,'keep-two');assert.equal(got.profiles.list[1].colorScheme,'j3w1zsh');assert.equal(got.profiles.list[1].font.size,17);
});
test('managed-value conflict keeps user edit and recovery journal, then allows explicit retry',t=>{
 const f=fixture(t);f.ok('Apply');const x=readConfig(f.terminal);x.theme='user-choice';write(f.terminal,x);assert.equal(f.run('Restore').status,2);assert.equal(readConfig(f.terminal).theme,'user-choice');assert.equal(f.journal().transactions[0].status,'restore-conflict');
 x.theme='j3w1';write(f.terminal,x);f.ok('Restore');assert.equal(f.journal().transactions[0].status,'restored');
});
test('partial failure reverses completed operations and preserves recoverable original bytes',t=>{
 const f=fixture(t);const r=f.run('Apply',{failAfter:50});assert.notEqual(r.status,0);assert.match(r.stderr,/Injected partial failure/);assert.equal(fs.readFileSync(f.terminal,'utf8'),f.before);assert.deepEqual(read(path.join(f.state,'fixture/registry.json')),{});assert.equal(f.journal().transactions[0].status,'restored');
});
test('malformed settings fail preflight before any theme write',t=>{
 const f=fixture(t);write(f.terminal,'{broken');assert.match(f.run('Apply').stderr,/Malformed JSON\/JSONC/);assert.ok(!fs.existsSync(path.join(f.state,'journal.json')));assert.ok(!fs.existsSync(path.join(f.state,'fixture/registry.json')));
});
test('concurrent lifecycle and directory junction targets are refused',t=>{
 const f=fixture(t);write(path.join(f.state,'lifecycle.lock'),{pid:process.pid});assert.match(f.run('Apply').stderr,/Another lifecycle/);fs.unlinkSync(path.join(f.state,'lifecycle.lock'));
 const outside=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-outside-'));t.after(()=>fs.rmSync(outside,{recursive:true,force:true}));fs.symlinkSync(outside,path.join(f.state,'assets'),process.platform==='win32'?'junction':'dir');assert.match(f.run('Apply').stderr,/Reparse\/symlink/);assert.deepEqual(fs.readdirSync(outside),[]);
});

test('named theme and layout edits preserve later additions and detect duplicate identities',t=>{
 const f=fixture(t),layouts=path.join(f.state,'fixture/Microsoft/PowerToys/FancyZones/custom-layouts.json');
 write(layouts,{'custom-layouts':[{uuid:'original',name:'keep'}]});
 f.ok('Apply');const terminal=readConfig(f.terminal);terminal.themes.push({name:'later'});write(f.terminal,terminal);
 const custom=read(layouts);custom['custom-layouts'].push({uuid:'later',name:'added after apply'});write(layouts,custom);
 f.ok('Test');f.ok('Restore');assert.deepEqual(readConfig(f.terminal).themes,[{name:'later'}]);
 assert.deepEqual(read(layouts)['custom-layouts'],[{uuid:'original',name:'keep'},{uuid:'later',name:'added after apply'}]);
 const duplicate=readConfig(f.terminal);duplicate.themes=[{name:'j3w1'},{name:'j3w1'}];write(f.terminal,duplicate);
 assert.match(f.run('Apply').stderr,/Duplicate managed collection/);
});
test('Command Palette uses the installed structured color contract and preserves behavior',t=>{
 const f=fixture(t),file=path.join(f.state,'fixture/Packages/Microsoft.CommandPalette_8wekyb3d8bbwe/LocalState/settings.json');
 const original={Theme:'Default',ColorizationMode:'None',CustomThemeColor:{A:0,R:255,G:255,B:255},CustomThemeColorIntensity:100,BackdropStyle:'Acrylic',BackdropOpacity:100,SingleClickActivates:false};
 write(file,original);f.ok('Apply');const got=read(file);assert.equal(got.Theme,'Dark');assert.equal(got.ColorizationMode,'CustomColor');assert.equal(got.CustomThemeColor.A,255);assert.equal(typeof got.CustomThemeColor.R,'number');assert.equal(got.SingleClickActivates,false);f.ok('Restore');assert.deepEqual(read(file),original);
});

function windhawkFixture(t){
 const f=fixture(t),copy=path.join(f.state,'source');fs.cpSync(source,copy,{recursive:true});
 const id='fixture-styler',bytes=Buffer.from('// pinned mod source');write(path.join(f.state,'downloads',id+'.wh.cpp'),bytes.toString());
 write(path.join(copy,'dependencies.json'),{mods:[{id,version:'1.0',sha256:sha(bytes)}]});
 write(path.join(copy,'dist',id+'.json'),{theme:'',controlStyles:[{target:'TextBlock',styles:['Foreground=#e99499']}]});
 const args={source:copy,mode:'Full',fixtureWindhawk:path.join(repoRoot,'tests/fixtures/windows-windhawk.cjs')};
 return {...f,args,db:()=>read(path.join(f.state,'fixture-windhawk.json'))};
}
test('Windhawk uses local installed IDs, verifies staged version and nested enabled state, and removes owned mods',t=>{
 const f=windhawkFixture(t);f.ok('Apply',f.args);f.ok('Test',f.args);
 assert.equal(f.journal().transactions[0].mods[0].id,'local@fixture-styler');
 assert.equal(f.journal().transactions[0].mods[1].id,'local@j3w1-explorer-native');
 assert.equal(f.db()['local@j3w1-explorer-native'].settings.background,'#000000');
 assert.equal(f.db()['local@j3w1-explorer-native'].settings.foreground,'#e99499');
 assert.equal(f.db()['local@fixture-styler'].config.disabled,false);
 const db=f.db();db['local@fixture-styler'].config.disabled=true;write(path.join(f.state,'fixture-windhawk.json'),db);
 const failed=f.run('Test',f.args);assert.equal(failed.status,1);assert.match(failed.stdout,/disabled or unknown state/);
 f.ok('Guard',f.args);f.ok('Test',f.args);f.ok('Uninstall',f.args);assert.deepEqual(f.db(),{appSettings:{disableUpdateCheck:false}});
});
test('Full Test reports a stopped engine and idempotent Apply restarts without recompilation',t=>{
 const f=windhawkFixture(t);f.ok('Apply',f.args);
 const stopped=f.run('Test',{...f.args,fixtureEngineStopped:true});assert.equal(stopped.status,1);assert.match(stopped.stdout,/theme engine is not running/);
 const before=JSON.stringify(f.db()),count=f.journal().transactions.length;
 assert.equal(JSON.parse(f.ok('Apply',{...f.args,fixtureEngineStopped:true}).stdout).result,'unchanged');
 assert.equal(JSON.stringify(f.db()),before);assert.equal(f.journal().transactions.length,count);
 assert.match(f.run('Apply',{...f.args,fixtureEngineStopped:true,fixtureEngineStartupFails:true}).stderr,/Theme engine failed to start/);
});

test('first-install engine startup failure rolls back managed settings and mods',t=>{
 const f=windhawkFixture(t),failed=f.run('Apply',{...f.args,fixtureEngineStopped:true,fixtureEngineStartupFails:true});
 assert.notEqual(failed.status,0);assert.match(failed.stderr,/Theme engine failed to start; rollback completed/);
 assert.equal(f.journal().transactions[0].status,'restored');assert.equal(fs.readFileSync(f.terminal,'utf8'),f.before);
 assert.deepEqual(f.db(),{appSettings:{disableUpdateCheck:false}});
});

test('Windhawk backup restores original disabled mod settings; incompatible guard disables managed mods',t=>{
 const f=windhawkFixture(t),before={'local@fixture-styler':{id:'local@fixture-styler',metadata:{version:'0.9'},config:{disabled:true},settings:{theme:'original'}}};
 write(path.join(f.state,'fixture-windhawk.json'),before);f.ok('Apply',f.args);
 assert.equal(f.run('Guard',{...f.args,compatible:false}).status,2);assert.equal(f.db()['local@fixture-styler'].config.disabled,true);
 f.ok('Restore',f.args);assert.deepEqual(f.db(),{...before,appSettings:{disableUpdateCheck:false}});
});

test('recoverable lock-screen image is journaled and restored; later image edits are conflicts',t=>{
 const f=fixture(t),file=path.join(f.state,'fixture/lockscreen.json'),before={exists:true,value:Buffer.from('original image').toString('base64'),extension:'.jpg'};
 write(file,before);f.ok('Apply');assert.equal(read(file).extension,'.bmp');f.ok('Test');f.ok('Restore');assert.deepEqual(read(file),before);
 f.ok('Apply');const managed=read(file);write(file,{...before,value:Buffer.from('later image').toString('base64')});assert.equal(f.run('Restore').status,2);write(file,managed);f.ok('Restore');assert.deepEqual(read(file),before);
});

test('compact cursors use a black body and canonical red edge with visible bounded hotspots',async()=>{
 const tokens=(await readJson('exports/tokens.resolved.json')).profiles.default.tokens;
 const black=tokens['color.surface.canvas'].css,red=tokens['color.border.active'].css;
 const colors=new Set([black,red]);
 for(const name of CURSOR_NAMES){
  const b=fs.readFileSync(path.join(source,`dist/j3w1-${name.toLowerCase()}.cur`));
  for(let i=0;i<4;i++){
   const n=6+16*i,size=b[n],start=b.readUInt32LE(n+12)+40,points=[],seen=new Set();
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const o=start+((size-1-y)*size+x)*4;if(!b[o+3])continue;
    const color='#'+[b[o+2],b[o+1],b[o]].map(v=>v.toString(16).padStart(2,'0')).join('');
    assert.ok(colors.has(color),`${name}: unexpected cursor color ${color}`);seen.add(color);points.push([x,y]);
   }
   assert.deepEqual(seen,colors,`${name} has both fill and outline`);
   const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
   assert.ok(Math.max(...xs)-Math.min(...xs)+1<=Math.ceil(size*.75),`${name}: width`);
   assert.ok(Math.max(...ys)-Math.min(...ys)+1<=Math.ceil(size*.75),`${name}: height`);
   const hx=b.readUInt16LE(n+4),hy=b.readUInt16LE(n+6);
   // Crosshair/resize hotspots may be centered in a transparent crossing gap.
   assert.ok(points.some(([x,y])=>Math.hypot(x-hx,y-hy)<=Math.ceil(size/16)),`${name}: hotspot near artwork`);
  }
 }
});

test('Start geometry and font values use XAML syntax without changing layout or icon fonts',async()=>{
 const payload=await readJson('ports/windows/dist/windows-11-start-menu-styler.json');
 const variants=(await readJson('ports/windows/dist/windows-settings.json')).stylerVariants['windows-11-start-menu-styler'];
 const all=[...payload.controlStyles,...Object.values(variants).flat()];
 const acrylic=payload.controlStyles.find(t=>t.target==='Border#AcrylicBorder');
 assert.ok(acrylic.styles.includes('CornerRadius=0'));
 assert.ok(acrylic.styles.includes('BorderThickness=1'));
 assert.ok(acrylic.styles.includes('BorderBrush=#e53935'));
 const fonts=all.filter(t=>t.styles.some(s=>s.startsWith('FontFamily=')));
 assert.ok(fonts.length>0);
 for(const t of fonts){assert.match(t.target,/^TextBlock#[A-Za-z]+$/);assert.ok(t.styles.includes('FontFamily=SauceCodePro NFM'));}
 for(const t of all)for(const style of t.styles){
  assert.doesNotMatch(style,/^(?:Visibility|Width|Height|MinWidth|MaxWidth|Margin|Padding|FontSize|Text|Glyph|Source|RenderTransform|FocusVisualPrimaryBrush|FocusVisualSecondaryBrush)=/);
  if(/^(?:CornerRadius|BorderThickness)=/.test(style))assert.match(style,/=\d+$/);
 }
 assert.ok(variants.redesigned.some(t=>t.target==='StartMenu.CategoryControl > Grid > Border'));
 assert.ok(!all.some(t=>t.target==='Button > Grid@CommonStates > Border'),'no broad rule should frame each category icon/caption');
 for(const name of ['LogoContainer','FolderPlate','Header']){
  const tile=variants.redesigned.find(t=>t.target===`Button#${name} > Grid@CommonStates > Border`);
  assert.deepEqual(tile.styles,['CornerRadius=0'],'category internals must not acquire nested borders or fills');
 }

 assert.ok(payload.controlStyles.some(t=>t.target==='Grid#CompanionRoot > Border#AcrylicBorder'));
 assert.throws(()=>windowsStyleValue('CornerRadius',{type:'dimension',resolved:{value:1,unit:'rem'}}),/pixel dimension/);
 assert.throws(()=>windowsStyleValue('FontFamily',{type:'number',resolved:1}),/font-family/);
});

test('notification styling preserves content, layout and native focus without nested frames',async()=>{
 const payload=await readJson('ports/windows/dist/windows-11-notification-center-styler.json');
 const styles=target=>payload.controlStyles.find(t=>t.target===target)?.styles??[];
 for(const target of ['Grid#NotificationCenterGrid','Grid#CalendarCenterGrid','Grid#ControlCenterRegion']){
  assert.ok(styles(target).includes('Background=#000000'));
  assert.ok(styles(target).includes('CornerRadius=0'));
  assert.ok(styles(target).includes('BorderThickness=1'));
 }
 for(const target of ['Border#ItemOpaquePlating'])
  assert.ok(!styles(target).some(s=>s.startsWith('Border')), 'cards must not acquire nested frames');
 const calendar=styles('CalendarView');
 assert.ok(calendar.includes('CalendarItemForeground=#e99499'));
 assert.ok(calendar.includes('TodayForeground=#ffa2a7'));
 for(const {target,styles:values} of payload.controlStyles)for(const value of values){
  assert.doesNotMatch(value,/^(?:Visibility|Width|Height|MinWidth|MaxWidth|Margin|Padding|FontSize|Text|Glyph|Source|RenderTransform|FocusVisualPrimaryBrush|FocusVisualSecondaryBrush|SelectedDates|IsEnabled)=/);
  if(value.startsWith('FontFamily='))assert.match(target,/TextBlock#/);
 }
});

test('Explorer retains the native backdrop after the whole-window red-accent regression',async()=>{
 const payload=await readJson('ports/windows/dist/windows-11-file-explorer-styler.json');
 assert.equal(payload.theme,'');
 assert.ok(!Object.hasOwn(payload,'backgroundTranslucentEffect'));
 assert.ok(!Object.hasOwn(payload,'backgroundTranslucentEffectRegion'));
});

test('Explorer preserves the native caption composition layer and scopes address backgrounds',async()=>{
 const payload=await readJson('ports/windows/dist/windows-11-file-explorer-styler.json');
 for(const target of ['Grid#RootGrid','Grid#TabContainerGrid','Grid#PART_LayoutRoot'])
  assert.ok(!payload.controlStyles.some(t=>t.target===target && t.styles.some(s=>s.startsWith('Background='))),target);
 const address=payload.controlStyles.find(t=>t.target==='FileExplorerExtensions.AddressBarControl > Grid#PART_LayoutRoot');
 assert.ok(address.styles.includes('Background=#000000'));
 const tab=payload.controlStyles.find(t=>t.target==='TabViewItem > Grid#LayoutRoot@CommonStates');
 assert.ok(tab.styles.includes('Background@Normal=#000000'));
 const native=fs.readFileSync(path.join(source,'dist/j3w1-explorer-native.wh.cpp'),'utf8');
 assert.match(native,/DWMWA_CAPTION_COLOR/);assert.match(native,/DWMWA_TEXT_COLOR/);
 assert.match(native,/process==GetCurrentProcessId\(\)/);
 assert.doesNotMatch(native,/WS_(?:MINIMIZEBOX|MAXIMIZEBOX)|SC_(?:CLOSE|MINIMIZE|MAXIMIZE)/);
});

test('standalone toast variants use black surfaces with one outer frame',async()=>{
 const payload=await readJson('ports/windows/dist/windows-11-notification-center-styler.json');
 for(const target of ['Border#ToastBackgroundBorder','Border#ToastBackgroundBorder2']){
  const styles=payload.controlStyles.find(t=>t.target===target).styles;
  for(const value of ['Background=#000000','BorderThickness=1','BorderBrush=#e53935','CornerRadius=0'])assert.ok(styles.includes(value));
 }
});

test('bundled native source is generated, pinned and rejected on tampering',t=>{
 const f=windhawkFixture(t),file=path.join(f.args.source,'dist/j3w1-explorer-native.wh.cpp');
 const text=fs.readFileSync(file,'utf8');
 assert.match(text,/@include explorer.exe/);assert.doesNotMatch(text,/@[A-Z_]+@|native-probe|CreateFileW|SetSysColors/);
 assert.match(text,/MAKELONG\(9549,26100\)/);
 fs.appendFileSync(file,'\n// changed');
 const result=f.run('Apply',f.args);assert.notEqual(result.status,0);assert.match(result.stderr,/Missing verified mod source/);
 assert.deepEqual(f.db(),{});
});

test('preview adapter is pinned and journaled; taskbar edge uses the canonical divider',t=>{
 const f=windhawkFixture(t);
 const settings=read(path.join(source,'dist/windows-settings.json'));
 const mod=settings.bundledMods.find(m=>m.id==='j3w1-powertoys-preview');
 const file=path.join(f.args.source,mod.path),bytes=fs.readFileSync(file);
 assert.equal(sha(bytes),mod.sha256);
 assert.doesNotMatch(bytes.toString(),/@[A-Z0-9_]+@/);
 assert.match(bytes.toString(),/7e8f2bfb81aa6498bd2d236c3eae54c8e42633cf288f9299df62d2537b553bac/);
 f.ok('Apply',f.args);f.ok('Test',f.args);
 assert.equal(f.db()['local@j3w1-powertoys-preview'].config.disabled,false);
 assert.equal(f.db()['local@j3w1-powertoys-preview'].settings.enabled,'1');
 f.ok('Restore',f.args);assert.equal(f.db()['local@j3w1-powertoys-preview'],undefined);
 fs.appendFileSync(file,'// corrupt source');
 assert.match(f.run('Apply',f.args).stderr,/Missing verified mod source/);
 const taskbar=read(path.join(source,'dist/windows-11-taskbar-styler.json'));
 assert.deepEqual(taskbar.controlStyles.find(t=>t.target==='Rectangle#BackgroundStroke').styles,['Fill=#2b0e0d']);
});
