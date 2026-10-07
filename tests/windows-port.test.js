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
import {CURSOR_NAMES,windowsStyleValue,windowsWebContentStyles} from '../scripts/lib/windows-port.mjs';
import {folderIconFile} from '../scripts/lib/windows-folder-icon.mjs';
import {flattenStylerSettings,stylerSettings} from '../ports/windows/src/compatibility.mjs';

const source=path.join(repoRoot,'ports/windows');
const runtime=path.join(source,'dist/runtime.cjs');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const readConfig=p=>{const errors=[];const value=parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''),errors,{allowTrailingComma:true});assert.deepEqual(errors,[],`Invalid settings: ${p}`);return value;};
const write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof x==='string'?x:JSON.stringify(x,null,2)+'\n');};

test('folder ICO retains transparent multiscale silhouettes and only the requested palette',()=>{
 const colors=['#bc1111','#e53131'];
 for(const open of [false,true]){
  const bytes=folderIconFile(...colors,open);
  assert.equal(bytes.readUInt16LE(2),1);
  assert.equal(bytes.readUInt16LE(4),10);
  for(let i=0;i<10;i++){
   const entry=6+16*i,size=bytes[entry]||256,offset=bytes.readUInt32LE(entry+12);
   assert.equal(bytes.readInt32LE(offset+4),size);
   assert.equal(bytes.readInt32LE(offset+8),size*2);
   let transparent=0,opaque=0,partial=0;
   for(let p=offset+40;p<offset+40+size*size*4;p+=4){
    const alpha=bytes[p+3];if(!alpha){transparent++;continue;}
    if(alpha===255)opaque++;else partial++;
    // A red folder has no surviving yellow/cyan/neutral source pixels.
    assert.ok(bytes[p+2]>bytes[p+1] && bytes[p+1]===bytes[p]);
   }
   assert.ok(transparent>0 && opaque>0 && partial>0);
  }
 }
 assert.notDeepEqual(folderIconFile(...colors),folderIconFile(...colors,true));
});

test('Search web-style replacement terminates old selectors and leaves input behavior intact',()=>{
 const result=flattenStylerSettings({controlStyles:[],webContentStyles:[{target:'.suggestion',styles:['background-color: black !important']}]});
 assert.equal(result['webContentStyles[1].target'],'');
 assert.equal(result['webContentStyles[0].styles[1]'],'');
 // Taskbar/Explorer/Settings do not declare Start's Search interface. Their
 // native CLI rejects this key rather than silently accepting an unused value.
 assert.equal(flattenStylerSettings({controlStyles:[]})['webContentStyles[0].target'],undefined);
 assert.equal(flattenStylerSettings(stylerSettings({controlStyles:[]},{redesigned:[]},'redesigned'))['webContentStyles[0].target'],'');
});

test('Search presentation cannot hide controls, accept scripts or substitute literal colors',()=>{
 const value=role=>{assert.equal(role,'color.surface.canvas');return '#000000';};
 const rule={target:'button',styles:{'background-color':'color.surface.canvas'},presentation:{'border-style':'none'}};
 assert.deepEqual(windowsWebContentStyles([rule],value),[{target:'button',styles:['background-color: #000000 !important','border-style: none !important']}]);
 for(const presentation of [{display:'none'},{position:'fixed'},{'background-image':'url(https://example.invalid)'},{'border-style':'none; color: white'},{'outline-style':'none'}])
  assert.throws(()=>windowsWebContentStyles([{...rule,presentation}],value),/Unsupported Search presentation/);
 assert.throws(()=>windowsWebContentStyles([{...rule,target:'button {} body'}],value),/Invalid Search selector/);
 assert.throws(()=>windowsWebContentStyles([{...rule,styles:{'color; display':'color.surface.canvas'}}],value),/Invalid Search style property/);
 assert.deepEqual(windowsWebContentStyles([{target:'.suggestion .details',styles:{},presentation:{'background-color':'inherit'}}],value),[{target:'.suggestion .details',styles:['background-color: inherit !important']}]);
 assert.deepEqual(windowsWebContentStyles([{target:'.leftPill::before',styles:{},presentation:{content:'none'}}],value),[{target:'.leftPill::before',styles:['content: none !important']}]);
 for(const target of ['button','button::before','.title','.suggestion::before'])
  assert.throws(()=>windowsWebContentStyles([{target,styles:{},presentation:{content:'none'}}],value),/Unsupported Search decoration target/);
 assert.deepEqual(windowsWebContentStyles([{target:'.suggestion, .suggContainer',styles:{},presentation:{'box-sizing':'border-box'}}],value),[{target:'.suggestion, .suggContainer',styles:['box-sizing: border-box !important']}]);
 for(const target of ['*','body','button','.title','.suggestion *'])assert.throws(()=>windowsWebContentStyles([{target,styles:{},presentation:{'box-sizing':'border-box'}}],value),/Unsupported Search box-sizing target/);
 assert.throws(()=>windowsWebContentStyles([{target:'.suggestion, .suggContainer',styles:{},presentation:{'box-sizing':'content-box'}}],value),/Unsupported Search presentation/);
 for(const fill of ['white','transparent','var(--unreviewed-color)'])
  assert.throws(()=>windowsWebContentStyles([{target:'.suggestion .details',styles:{},presentation:{'background-color':fill}}],value),/Unsupported Search presentation/);
});
function fixture(t) {
 const state=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-windows-test-'));
 t.after(()=>fs.rmSync(state,{recursive:true,force:true}));
 const terminal=path.join(state,'fixture/terminal/settings.json');
 const before='\uFEFF{\n // keep this comment\n "profiles": {"list": [{"guid":"one","commandline":"keep-one","font":{"size":17},"colorScheme":"j3w1zsh"},{"guid":"two","commandline":"keep-two"}]},\n "keybindings": [{"command":"paste","keys":"ctrl+v"}],\n}\n';
 write(terminal,before);
 const run=(action,extra={})=>spawnSync(process.execPath,[runtime],{input:JSON.stringify({action,source,state,fixture:true,mode:'Native',revision:'1'.repeat(40),...extra}),encoding:'utf8',timeout:30000});
 const ok=(action,extra={})=>{const r=run(action,extra);assert.equal(r.status,0,`${action}: ${r.stdout}\n${r.stderr}`);return r;};
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

test('Settings resource overrides retain shared brushes and stay isolated from other stylers',async()=>{
 const host=await readJson('ports/windows/host.json');
 const tokens=(await readJson('exports/tokens.resolved.json')).profiles.default.tokens;
 const settings=host.stylers.find(m=>m.id==='windows-11-settings-styler');
 const expected={SystemControlFocusVisualPrimaryBrush:'color.interaction.focus.ring',SystemControlFocusVisualSecondaryBrush:'color.surface.canvas',FocusStrokeColorOuterBrush:'color.interaction.focus.ring',FocusStrokeColorInnerBrush:'color.surface.canvas',ToolTipBackground:'color.surface.raised',ToolTipForeground:'color.text.default',ToolTipBorderBrush:'color.border.overlay'};
 assert.deepEqual(settings.resources,expected);
 const mapping=await readJson('ports/windows/mapping.json');
 for(const [key,role]of Object.entries(expected))assert.ok(mapping.mappings[role].includes(settings.id+'.resource.'+key));
 for(const mod of host.stylers){
  const payload=await readJson('ports/windows/dist/'+mod.id+'.json');
  const actual=Object.fromEntries(payload.themeResourceVariables.map(v=>v.split('=')));
  assert.equal(Object.keys(actual).length,payload.themeResourceVariables.length,'Duplicate resource aliases');
  for(const [key,role]of Object.entries({...host.resources,...(mod.id===settings.id?expected:{})}))
   assert.equal(actual[key],windowsStyleValue(key,{type:tokens[role].type,resolved:tokens[role].value}));
  if(mod.id!==settings.id){
   assert.equal(mod.resources,undefined);
   for(const key of Object.keys(expected))assert.equal(actual[key],undefined,'Settings resource leaked into '+mod.id);
  }
 }
 for(const target of settings.targets)for(const key of Object.keys(target.styles))
  assert.doesNotMatch(key,/^(?:UseSystemFocusVisuals|FocusVisualPrimaryThickness|FocusVisualSecondaryThickness|FocusVisualMargin|IsTabStop|TabIndex|Width|Height|Padding|Margin|Command|Content|Text)$/);
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

test('Calculator uses an exact package and separate primary, disabled and interaction brushes',async()=>{
 const host=await readJson('ports/windows/host.json');
 assert.equal(host.calculator.packageFullName,'Microsoft.WindowsCalculator_11.2607.0.0_x64__8wekyb3d8bbwe');
 assert.equal(host.calculator.buttonStyleTarget,'CalculatorApp.Controls.CalculatorButton, CalculatorApp, Version=11.2607.0.0, Culture=neutral, PublicKeyToken=null');
 const roles=host.calculator.resources;
 assert.equal(roles.CalcButtonTextFillColorDefaultBrush,'color.text.default');
 assert.equal(roles.CalcButtonTextFillColorDisabledBrush,'color.text.disabled');
 assert.equal(roles.CalcButtonFillColorHoverBrush,'color.interaction.hover.bg');
 assert.equal(roles.CalcButtonFillColorPressedBrush,'color.interaction.pressed.bg');
 assert.equal(roles.AccentFillColorDefaultBrush,'color.action.primary.bg');
 assert.equal(roles.TextOnAccentFillColorPrimaryBrush,'color.text.bright');
 assert.equal(roles.NavigationViewItemBackgroundSelected,'color.interaction.selection.bg');
 assert.equal(roles.NavigationViewItemForegroundSelected,'color.interaction.selection.text');
 assert.equal(roles.NavigationViewItemBackgroundPointerOver,'color.interaction.hover.bg');
 assert.equal(roles.NavigationViewItemBackgroundPressed,'color.interaction.pressed.bg');
 assert.equal(roles.NavigationViewItemBackgroundDisabled,'color.interaction.disabled.bg');
 assert.equal(roles.NavigationViewItemForegroundDisabled,'color.text.disabled');
 assert.equal(roles.NavigationViewItemSeparatorForeground,'color.border.divider');
 // Scientific CaptionToggleButtonStyle inherits the framework state resources.
 // Keep its full native ladder aligned with the shared app-chrome contract.
 const toggleRoles=Object.entries(host.winuiChromeResources).filter(([key])=>key.startsWith('ToggleButton'));
 assert.ok(toggleRoles.length>=30);
 for(const [key,role]of toggleRoles)assert.equal(roles[key],role,key);
 for(const state of ['PointerOver','Pressed','Disabled','Checked','CheckedPointerOver','CheckedPressed','Indeterminate'])
  assert.ok(Object.hasOwn(roles,'ToggleButtonBackground'+state),state);
 assert.ok(!Object.keys(roles).some(key=>key.startsWith('Equation')));
 const settings=await readJson('ports/windows/dist/windows-settings.json');
 const mod=settings.bundledMods.find(x=>x.id==='j3w1-calculator');
 const bytes=fs.readFileSync(path.join(source,mod.path));
 assert.equal(sha(bytes),mod.sha256);
 assert.match(bytes.toString(),/GetCurrentPackageFullName/);
 assert.match(bytes.toString(),/Microsoft\.WindowsCalculator_11\.2607\.0\.0_x64__8wekyb3d8bbwe/);
 assert.doesNotMatch(bytes.toString(),/@[A-Z0-9_]+@/);
 assert.deepEqual(await readJson('ports/windows/dist/j3w1-calculator.json'),{enabled:1});
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
 const tokens=(await readJson('exports/tokens.resolved.json')).profiles.default.tokens;
 for(const [target,opened,hover,normal,disabled] of [
  ['MenuFlyoutSubItem > Grid#LayoutRoot@CommonStates','SubMenuOpened','PointerOver','Normal','Disabled'],
  ['AppBarButton > Grid#Root@CommonStates > Border#AppBarButtonInnerBorder','OverflowSubMenuOpened','OverflowPointerOver','OverflowNormal','OverflowDisabled'],
 ]){
  const submenu=config.controlStyles.find(x=>x.target===target);
  assert.ok(submenu,target);
  const value=name=>submenu.styles.find(s=>s.startsWith(`${name}=`))?.split('=').slice(1).join('=');
  const role=tokens['color.interaction.hover.bg'];
  assert.equal(value(`Background@${opened}`),windowsStyleValue(`Background@${opened}`,{type:role.type,resolved:role.value}),target);
  assert.equal(value(`Background@${opened}`),value(`Background@${hover}`),target);
  assert.notEqual(value(`Background@${opened}`),value(`Background@${normal}`),target);
  assert.notEqual(value(`Background@${opened}`),value(`Background@${disabled}`),target);
 }
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

function windhawkFixture(t,scope='all'){
 const f=fixture(t),copy=path.join(f.state,'source');fs.cpSync(source,copy,{recursive:true});
 const id='fixture-styler',bytes=Buffer.from('// pinned mod source');write(path.join(f.state,'downloads',id+'.wh.cpp'),bytes.toString());
 write(path.join(copy,'dependencies.json'),{mods:[{id,version:'1.0',sha256:sha(bytes)}]});
 write(path.join(copy,'dist',id+'.json'),{theme:'',controlStyles:[{target:'TextBlock',styles:['Foreground=#e99499']}]});
 // Journal protocol cases need two independently owned adapters, not every
 // product adapter. Keep the complete stack for admission/integration cases.
 // Windows process startup across eight adapters can exhaust the unchanged
 // 30-second child deadline before a journal-only assertion is reached.
 assert.ok(['all','protocol'].includes(scope));
 if(scope==='protocol'){
  const settingsFile=path.join(copy,'dist/windows-settings.json'),settings=read(settingsFile);
  settings.bundledMods=settings.bundledMods.filter(mod=>mod.id==='j3w1-explorer-native');
  assert.equal(settings.bundledMods.length,1);
  write(settingsFile,settings);
 }
 const args={source:copy,mode:'Full',fixtureWindhawk:path.join(repoRoot,'tests/fixtures/windows-windhawk.cjs')};
 return {...f,args,db:()=>read(path.join(f.state,'fixture-windhawk.json'))};
}
test('Windhawk uses local installed IDs, verifies staged version and nested enabled state, and removes owned mods',t=>{
 const f=windhawkFixture(t);f.ok('Apply',f.args);f.ok('Test',f.args);
 assert.equal(f.journal().transactions[0].mods[0].id,'local@fixture-styler');
 assert.deepEqual(f.journal().transactions[0].mods.slice(1).map(mod=>mod.id),read(path.join(source,'dist/windows-settings.json')).bundledMods.map(mod=>'local@'+mod.id));
 assert.equal(f.journal().transactions[0].mods[1].id,'local@j3w1-explorer-native');
 assert.equal(f.db()['local@j3w1-explorer-native'].settings.background,'#000000');
 assert.equal(f.db()['local@j3w1-explorer-native'].settings.foreground,'#e99499');
 assert.equal(f.db()['local@fixture-styler'].config.disabled,false);
 const db=f.db();db['local@fixture-styler'].config.disabled=true;write(path.join(f.state,'fixture-windhawk.json'),db);
 const failed=f.run('Test',f.args);assert.equal(failed.status,1);assert.match(failed.stdout,/disabled or unknown state/);
 f.ok('Guard',f.args);f.ok('Test',f.args);f.ok('Uninstall',f.args);assert.deepEqual(f.db(),{appSettings:{disableUpdateCheck:false}});
});
test('lifecycle progress preserves JSON results and reports every restored update',t=>{
 const f=windhawkFixture(t,'protocol');
 const first=f.ok('Apply',f.args);
 assert.equal(JSON.parse(first.stdout).result,'applied');
 assert.match(first.stderr,/Preparing theme adapter 1 of \d+/);
 assert.match(first.stderr,/verified\./);
 const second=f.ok('Apply',{...f.args,revision:'2'.repeat(40)});
 assert.equal(JSON.parse(second.stdout).result,'applied');
 const restored=f.ok('Restore',f.args);
 assert.equal(JSON.parse(restored.stdout).result,'restored');
 assert.match(restored.stderr,/Restoring saved update 1 of 2\./);
 assert.match(restored.stderr,/Restoring saved update 2 of 2\./);
 assert.match(restored.stderr,/Restoring saved personalization and application settings/);
 assert.deepEqual(f.db(),{appSettings:{disableUpdateCheck:false}});
 assert.ok(f.journal().transactions.every(tx=>tx.status==='restored'));
});

test('Full Test reports a stopped engine and idempotent Apply restarts without recompilation',t=>{
 const f=windhawkFixture(t,'protocol');f.ok('Apply',f.args);
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

test('shorter styler arrays terminate retained targets, nested styles and resources on update',()=>{
 const old={theme:'',controlStyles:[{target:'OldRoot',styles:['Background=old','Foreground=old']},{target:'ObsoleteRoot',styles:['Background=old']}],themeResourceVariables:['One=old','Two=old']};
 const next={theme:'',controlStyles:[{target:'NewRoot',styles:['Background=black']}],themeResourceVariables:['One=rose']};
 const live={...flattenStylerSettings(old),...flattenStylerSettings(next)};
 const styles=[];for(let i=0;live[`controlStyles[0].styles[${i}]`];i++)styles.push(live[`controlStyles[0].styles[${i}]`]);
 const targets=[];for(let i=0;live[`controlStyles[${i}].target`];i++)targets.push(live[`controlStyles[${i}].target`]);
 const resources=[];for(let i=0;live[`themeResourceVariables[${i}]`];i++)resources.push(live[`themeResourceVariables[${i}]`]);
 assert.deepEqual(targets,['NewRoot']);assert.deepEqual(styles,['Background=black']);assert.deepEqual(resources,['One=rose']);
 assert.equal(live['controlStyles[1].target'],'');
 assert.equal(live['controlStyles[0].styles[1]'],'');
 assert.equal(live['themeResourceVariables[1]'],'');
 assert.equal(live['styleConstants[0]'],'');
 const empty=flattenStylerSettings({controlStyles:[],themeResourceVariables:[],styleConstants:[]});
 assert.deepEqual(empty,{'controlStyles[0].target':'','themeResourceVariables[0]':'','styleConstants[0]':''});
 const startEmpty=flattenStylerSettings(stylerSettings({controlStyles:[],themeResourceVariables:[],styleConstants:[]},{redesigned:[]},'redesigned'));
 assert.equal(startEmpty['webContentStyles[0].target'],'');
 const omitted=flattenStylerSettings({controlStyles:[{target:'NewRoot',styles:[]}]});
 assert.equal(omitted['themeResourceVariables[0]'],'');assert.equal(omitted['styleConstants[0]'],'');
 assert.equal(omitted['controlStyles[0].styles[0]'],'');
 assert.deepEqual(flattenStylerSettings({background:'#000000',version:'1.2'}),{background:'#000000',version:'1.2'});
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
 assert.match(text,/@include explorer.exe/);assert.doesNotMatch(text,/@[A-Z_]+@|native-probe|SetSysColors|GENERIC_WRITE|FILE_APPEND_DATA|CREATE_ALWAYS|CREATE_NEW|WriteFile|DeleteFile/);
 assert.equal((text.match(/CreateFileW\(/g)||[]).length,1,'Only the module digest reader opens files');
 assert.match(text,/CreateFileW\(path,GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr\)/);
 assert.match(text,/GetModuleFileNameW\(module,path/);
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

test('Markdown adapter settings and source follow setup update, Test and rollback',t=>{
 const f=windhawkFixture(t);f.ok('Apply',f.args);
 assert.equal(f.db()['local@j3w1-powertoys-markdown'].config.disabled,false);
 assert.equal(f.db()['local@j3w1-powertoys-markdown'].settings.enabled,'1');
 f.ok('Test',f.args);f.ok('Restore',f.args);
 assert.equal(f.db()['local@j3w1-powertoys-markdown'],undefined);
});

test('verified adapters survive a revision-only update and Latest rollback without live mutations',t=>{
 const f=windhawkFixture(t,'protocol'),activity=()=>read(path.join(f.state,'fixture-windhawk-activity.json'));
 f.ok('Apply',f.args);const baseline=f.db(),compiled=activity().compiles,mutations=activity().mutations;
 assert.ok(f.journal().transactions[0].mods.every(m=>m.artifact&&m.sourceSha256));
 f.ok('Update',{...f.args,revision:'2'.repeat(40)});
 assert.equal(activity().compiles,compiled);
 assert.ok(f.journal().transactions[1].mods.every(m=>m.reused&&m.unchanged));
 assert.deepEqual(activity().mutations,mutations);
 f.ok('Restore',{...f.args,latest:true});
 assert.deepEqual(activity().mutations,mutations);
 assert.equal(activity().compiles,compiled);assert.equal(activity().imports,0);
 assert.deepEqual(f.db(),baseline);f.ok('Test',f.args);
 f.ok('Restore',f.args);assert.deepEqual(f.db(),{appSettings:{disableUpdateCheck:false}});
});

test('a settings update and Latest rollback leave unrelated verified adapters active',t=>{
 const f=windhawkFixture(t,'protocol'),activity=()=>read(path.join(f.state,'fixture-windhawk-activity.json'));
 f.ok('Apply',f.args);const baseline=f.db(),count=activity().mutations.length;
 const config=path.join(f.args.source,'dist/fixture-styler.json'),next=read(config);
 next.controlStyles[0].styles[0]='Foreground=#ffa2a7';write(config,next);
 f.ok('Update',{...f.args,revision:'2'.repeat(40)});f.ok('Test',f.args);
 assert.equal(f.journal().transactions[1].mods[0].unchanged,false);
 assert.equal(f.journal().transactions[1].mods[1].unchanged,true);
 f.ok('Restore',{...f.args,latest:true});
 assert.ok(activity().mutations.slice(count).every(a=>!a.includes('local@j3w1-explorer-native')));
 assert.deepEqual(f.db(),baseline);f.ok('Test',f.args);
});

test('failure rollback does not cycle adapters whose code and settings were unchanged',t=>{
 const f=windhawkFixture(t,'protocol'),activity=()=>read(path.join(f.state,'fixture-windhawk-activity.json'));
 f.ok('Apply',f.args);const baseline=f.db(),mutations=activity().mutations;
 const config=path.join(f.args.source,'dist/windows-settings.json'),next=read(config);
 next.values['native.accent']='#f73f35';write(config,next);
 const failed=f.run('Update',{...f.args,revision:'2'.repeat(40),failAfter:1});
 assert.notEqual(failed.status,0);assert.match(failed.stderr,/Injected partial failure; rollback completed/);
 assert.equal(f.journal().transactions[1].status,'restored');
 assert.deepEqual(activity().mutations,mutations);assert.deepEqual(f.db(),baseline);
});

test('Latest rollback preserves later user edits to an adapter it did not mutate',t=>{
 const f=windhawkFixture(t,'protocol'),activity=()=>read(path.join(f.state,'fixture-windhawk-activity.json'));
 f.ok('Apply',f.args);f.ok('Update',{...f.args,revision:'2'.repeat(40)});
 const changed=f.db();changed['local@fixture-styler'].settings.theme='owner edit';
 write(path.join(f.state,'fixture-windhawk.json'),changed);const mutations=activity().mutations;
 f.ok('Restore',{...f.args,latest:true});
 assert.deepEqual(f.db(),changed);assert.deepEqual(activity().mutations,mutations);
 assert.match(f.run('Test',f.args).stdout,/settings drift/);
 const original=f.run('Restore',f.args);assert.equal(original.status,2);
 assert.equal(f.db()['local@fixture-styler'].settings.theme,'owner edit');
});

test('binary drift refuses Test and Guard and triggers a fresh pinned compile on Update',t=>{
 const f=windhawkFixture(t,'protocol'),activity=()=>read(path.join(f.state,'fixture-windhawk-activity.json'));
 f.ok('Apply',f.args);const mod=f.journal().transactions[0].mods[0],compiled=activity().compiles;
 const library=path.join(f.state,'tools/windhawk/2.0.0-alpha.6/AppData/Engine/Mods/64',mod.artifact.config.libraryFileName);
 fs.appendFileSync(library,' altered binary');
 assert.match(f.run('Test',f.args).stdout,/compiled artifact drift/);
 const guard=f.run('Guard',f.args);assert.equal(guard.status,2);assert.match(guard.stdout,/compiled artifact drift/);
 f.ok('Update',{...f.args,revision:'2'.repeat(40)});
 assert.equal(activity().compiles,compiled+1);assert.equal(f.journal().transactions[1].mods[0].reused,false);
 f.ok('Test',f.args);
});

test('changed settings-key sets use exact offline import on Latest restore',t=>{
 const f=windhawkFixture(t,'protocol'),activity=()=>read(path.join(f.state,'fixture-windhawk-activity.json'));
 f.ok('Apply',f.args);const baseline=f.db();
 const config=path.join(f.args.source,'dist/fixture-styler.json');
 const next=read(config);next.controlStyles.push({target:'Border',styles:['Background=#000000']});write(config,next);
 f.ok('Update',{...f.args,revision:'2'.repeat(40)});
 assert.equal(f.journal().transactions[1].mods[0].reused,true);
 f.ok('Restore',{...f.args,latest:true});assert.equal(activity().imports,1);
 assert.deepEqual(f.db(),baseline);f.ok('Test',f.args);
});


test('interrupted settings-only restore resumes only with the same artifact proof',t=>{
 const f=windhawkFixture(t,'protocol'),activity=()=>read(path.join(f.state,'fixture-windhawk-activity.json'));
 f.ok('Apply',f.args);const baseline=f.db();
 const config=path.join(f.args.source,'dist/fixture-styler.json'),next=read(config);
 next.controlStyles[0].styles[0]='Foreground=#ffa2a7';write(config,next);
 f.ok('Update',{...f.args,revision:'2'.repeat(40)});
 const mod=f.journal().transactions[1].mods[0];assert.equal(mod.reused,true);
 assert.notDeepEqual(mod.beforeSettings,mod.settings);
 const interrupted=f.db();interrupted[mod.id].settings=mod.beforeSettings.settings;
 interrupted[mod.id].config.disabled=true;write(path.join(f.state,'fixture-windhawk.json'),interrupted);
 f.ok('Restore',{...f.args,latest:true});assert.equal(activity().imports,0);
 assert.deepEqual(f.db(),baseline);f.ok('Test',f.args);
});

test('legacy receipts and changed adapter configurations require a managed recompile',t=>{
 const f=windhawkFixture(t,'protocol'),activity=()=>read(path.join(f.state,'fixture-windhawk-activity.json'));
 f.ok('Apply',f.args);const compiled=activity().compiles;
 const journal=f.journal();delete journal.transactions[0].mods[0].artifact;
 write(path.join(f.state,'journal.json'),journal);
 const changed=f.db(),second=journal.transactions[0].mods[1];
 changed[second.id].config.includeCustom=['unrelated.exe'];write(path.join(f.state,'fixture-windhawk.json'),changed);
 f.ok('Update',{...f.args,revision:'2'.repeat(40)});
 assert.equal(activity().compiles,compiled+2);
 assert.equal(f.journal().transactions[1].mods[0].reused,false);
 assert.equal(f.journal().transactions[1].mods[1].reused,false);
 f.ok('Test',f.args);
});


test('offline rollback credits a verified recompile without rewriting its original receipt',t=>{
 const f=windhawkFixture(t,'protocol');f.ok('Apply',f.args);
 const initial=f.journal().transactions[0].mods[0].artifact;
 write(path.join(f.state,'fixture-recompile-import'),'enabled');
 const modPath=path.join(f.state,'downloads/fixture-styler.wh.cpp'),depsPath=path.join(f.args.source,'dependencies.json');
 const oldBytes=fs.readFileSync(modPath),oldDeps=fs.readFileSync(depsPath);
 const changed=Buffer.from('// @version 1.1\n// changed pinned source\n');write(modPath,changed.toString());
 const deps=read(depsPath);deps.mods[0].version='1.1';deps.mods[0].sha256=sha(changed);write(depsPath,deps);
 f.ok('Update',{...f.args,revision:'2'.repeat(40)});f.ok('Restore',{...f.args,latest:true});
 const prior=f.journal().transactions[0].mods[0],receipt=prior.restorationReceipts.at(-1);
 assert.deepEqual(prior.compilationHistory[0].artifact,initial);
 assert.deepEqual(prior.artifact,receipt.artifact);assert.notEqual(receipt.artifact.sha256,initial.sha256);
 assert.equal(receipt.sourceSha256,prior.sourceSha256);f.ok('Test',f.args);f.ok('Guard',f.args);
 fs.writeFileSync(modPath,oldBytes);fs.writeFileSync(depsPath,oldDeps);
 const count=read(path.join(f.state,'fixture-windhawk-activity.json')).compiles;
 f.ok('Update',{...f.args,revision:'3'.repeat(40)});
 assert.equal(read(path.join(f.state,'fixture-windhawk-activity.json')).compiles,count);
 assert.ok(f.journal().transactions.at(-1).mods[0].reused);
 const library=path.join(f.state,'tools/windhawk/2.0.0-alpha.6/AppData/Engine/Mods/64',receipt.artifact.config.libraryFileName);
 fs.appendFileSync(library,' altered after restoration');assert.match(f.run('Test',f.args).stdout,/compiled artifact drift/);
});

test('tampered saved adapter export refuses offline import and keeps recoverable history',t=>{
 const f=windhawkFixture(t,'protocol');f.ok('Apply',f.args);
 const config=path.join(f.args.source,'dist/fixture-styler.json'),next=read(config);
 next.controlStyles.push({target:'Border',styles:['Background=#000000']});write(config,next);
 f.ok('Update',{...f.args,revision:'2'.repeat(40)});
 const mod=f.journal().transactions.at(-1).mods[0],backup=fs.readFileSync(mod.backup);
 fs.appendFileSync(mod.backup,' ');
 const result=f.run('Restore',{...f.args,latest:true});assert.equal(result.status,2);
 assert.match(result.stdout,/Saved adapter export digest mismatch/);
 assert.equal(read(path.join(f.state,'fixture-windhawk-activity.json')).imports,0);
 assert.equal(f.journal().transactions.at(-1).status,'restore-conflict');
 fs.writeFileSync(mod.backup,backup);f.ok('Restore',{...f.args,latest:true});f.ok('Test',f.args);
});

test('app caption contracts preserve Notepad tabs and Paint native-title ownership',async()=>{
 const host=await readJson('ports/windows/host.json'),mapping=await readJson('ports/windows/mapping.json');
 for(const [name,key]of [['paint','paintChrome'],['notepad','notepadChrome']]){
  const emitted=fs.readFileSync(path.join(source,'dist/j3w1-'+name+'-chrome.wh.cpp'),'utf8');
  const custom=name==='notepad';
  assert.equal(Object.keys(host[key].captionColors).length,custom?0:12);
  if(custom){
   for(const refs of Object.values(mapping.mappings))assert.ok(refs.every(value=>!value.startsWith('notepad-chrome.caption.')));
   assert.ok(emitted.includes('publicCaptionSlots={}'));
   assert.ok(emitted.includes('if constexpr(publicCaptionSlots.empty())return;'));
  }
  assert.ok(emitted.includes('if(!CaptionSlotAdmitted(slot))throw hresult_invalid_argument();'));
  assert.ok(emitted.includes('for(unsigned slot:publicCaptionSlots)'));
  assert.ok(emitted.includes('CaptionCompositionAdmitted(bar.ExtendsContentIntoTitleBar())'));
  for(const [property,role]of Object.entries(host[key].captionColors)){
   assert.ok(mapping.mappings[role].includes(name+'-chrome.caption.'+property));
   assert.ok(emitted.includes('// '+property+' : '+role));
  }
  assert.ok(emitted.includes('PublicTitleBar::IsCustomizationSupported()'));
  assert.ok(emitted.includes('bar.ExtendsContentIntoTitleBar()'));
  assert.ok(emitted.includes('WriteOwnedCaption'));
  assert.ok(emitted.includes('Microsoft.UI.Windowing.h'));
  assert.ok(!emitted.includes('ResetToDefault('));assert.ok(!emitted.includes('SetDragRectangles('));
 }
});


test('composite button resource ladders cover hover exit, split halves and checked/disabled states',async()=>{
 const host=await readJson('ports/windows/host.json');
 const mapping=await readJson('ports/windows/mapping.json');
 const shared=host.winuiChromeResources,calculator=host.calculator.resources;
 const ladders={
  '':['color.surface.canvas','color.text.default','color.border.control'],
  PointerOver:['color.interaction.hover.bg','color.text.default','color.border.active'],
  Pressed:['color.interaction.pressed.bg','color.text.default','color.border.active'],
  Disabled:['color.interaction.disabled.bg','color.text.disabled','color.border.disabled'],
  Checked:['color.interaction.selection.bg','color.interaction.selection.text','color.border.active'],
  CheckedPointerOver:['color.interaction.selection.bg','color.interaction.selection.text','color.border.active'],
  CheckedPressed:['color.interaction.pressed.bg','color.text.default','color.border.active'],
  CheckedDisabled:['color.interaction.disabled.bg','color.text.disabled','color.border.disabled'],
 };
 for(const family of ['SubtleButton','SplitButton'])for(const [state,roles]of Object.entries(ladders)){
  if(family==='SubtleButton'&&state.startsWith('Checked'))continue;
  for(const [index,property]of ['Background','Foreground','BorderBrush'].entries()){
   const key=family+property+state;
   assert.equal(shared[key],roles[index],key);assert.equal(calculator[key],roles[index],key);
   for(const prefix of ['notepad-chrome','paint-chrome','calculator'])assert.ok(mapping.mappings[roles[index]].includes(prefix+'.resource.'+key));
  }
 }
 for(const palette of [shared,calculator]){
  assert.equal(palette.SplitButtonInAppBarUnfocusedPointerOver,'color.interaction.pressed.bg');
  assert.equal(palette.SplitButtonBorderBrushDivider,'color.border.divider');
  assert.equal(palette.SplitButtonBorderBrushCheckedDivider,'color.border.divider');
  assert.equal(palette.ButtonBackgroundDisabled,'color.interaction.disabled.bg');
  for(const state of ['','PointerOver','Pressed'])assert.equal(palette['DropDownButtonForegroundSecondary'+state],'color.text.muted');
  assert.ok(!Object.keys(palette).some(key=>key.startsWith('DropDownButtonBackground')),'dropdown background belongs to the inherited button template');
 }
});


test('native slider templates retain accent semantics and brush-only resource types',async()=>{
 const host=await readJson('ports/windows/host.json'),mapping=await readJson('ports/windows/mapping.json');
 const shared=host.winuiChromeResources;
 // Thumb and filled track are native range accents, including their state exits.
 const states={'':'color.action.primary.bg',PointerOver:'color.action.primary.hover-bg',Pressed:'color.action.primary.pressed-bg',Disabled:'color.interaction.disabled.bg'};
 for(const [state,role]of Object.entries(states))for(const part of ['SliderThumbBackground','SliderTrackValueFill']){
  const key=part+state;assert.equal(shared[key],role,key);
  for(const prefix of ['notepad-chrome','paint-chrome'])assert.ok(mapping.mappings[role].includes(prefix+'.resource.'+key));
 }
 for(const state of ['','PointerOver','Pressed'])assert.equal(shared['SliderTrackFill'+state],'color.border.control');
 assert.equal(shared.SliderTrackFillDisabled,'color.border.disabled');
 assert.equal(shared.SliderOuterThumbBackground,'color.surface.input');
 assert.equal(shared.SliderHeaderForeground,'color.text.default');
 // WinUI uses Color-valued animation keys here. A SolidColorBrush substitute
 // would break those animations; this palette admits brush resources only.
 for(const key of ['SliderContainerBackgroundPointerOver','SliderContainerBackgroundPressed','SliderContainerBackgroundDisabled','SliderHeaderForegroundDisabled','SliderTickBarFillDisabled'])assert.ok(!(key in shared),key);
 for(const name of ['notepad','paint']){
  const sourceText=fs.readFileSync(path.join(source,'dist/j3w1-'+name+'-chrome.wh.cpp'),'utf8');
  assert.ok(!/\bSlider::(?:Minimum|Maximum|Value|StepFrequency|Orientation)Property\s*\(/.test(sourceText),'slider geometry and value properties belong to the host');
 }
});

test('Windows target versions describe every exact compatibility candidate without claiming import acceptance',async()=>{
 const host=await readJson('ports/windows/host.json'),port=await readJson('ports/windows/port.json');
 assert.deepEqual(port.targetVersions,host.compatibility.map(entry=>entry.build+'.'+entry.ubr));
 assert.equal(port.status,'experimental');assert.deepEqual(port.testedVersions,[]);
});

test('standard flyout frames wire canonical resources into generated chrome adapters',async()=>{
 const host=await readJson('ports/windows/host.json'),mapping=await readJson('ports/windows/mapping.json');
 const roles={FlyoutPresenterBackground:'color.surface.raised',FlyoutBorderThemeBrush:'color.border.overlay'};
 for(const [key,role] of Object.entries(roles)){
  assert.equal(host.winuiChromeResources[key],role);
  for(const app of ['notepad','paint','terminal']){
   assert.ok(mapping.mappings[role].includes(app+'-chrome.resource.'+key));
   const text=fs.readFileSync(path.join(source,'dist/j3w1-'+app+'-chrome.wh.cpp'),'utf8');
   assert.match(text,new RegExp('L"'+key+'"'));
   assert.match(text,/object.try_as<FlyoutPresenter>\(\)/);
  }
 }
});

test('standard tooltip palettes use shared resources and loaded same-root popup admission',async()=>{
 const host=await readJson('ports/windows/host.json'),mapping=await readJson('ports/windows/mapping.json');
 const roles={ToolTipBackgroundBrush:'color.surface.overlay',ToolTipForegroundBrush:'color.text.default',ToolTipBorderBrush:'color.border.overlay'};
 for(const [key,role] of Object.entries(roles)){
  assert.equal(host.winuiChromeResources[key],role);
  for(const app of ['notepad','paint','terminal']){
   assert.ok(mapping.mappings[role].includes(app+'-chrome.resource.'+key));
   const text=fs.readFileSync(path.join(source,'dist/j3w1-'+app+'-chrome.wh.cpp'),'utf8');
   assert.match(text,new RegExp('L"'+key+'"'));
   assert.match(text,/object.try_as<ToolTip>\(\)/);
   assert.match(text,/PopupDiscoveryAdmission[\s\S]*active&&uiThread&&loaded&&sameRoot&&PopupChromeClass/);
  }
 }
});

test('chrome factory workers initialize COM only after exact runtime admission',()=>{
 for(const app of ['notepad','paint','terminal']){
  const text=fs.readFileSync(path.join(source,'dist/j3w1-'+app+'-chrome.wh.cpp'),'utf8');
  assert.match(text,/void Wh_ModAfterInit[\s\S]*bool apartment=false;[\s\S]*if\(!ReviewedRuntime\(\)\)continue;[\s\S]*if\(!apartment\)\{init_apartment/);
  assert.match(text,/if\(apartment\)uninit_apartment\(\);return 0;/);
 }
});

test('native chrome scrollbars map state brushes without color-valued animation keys',async()=>{
 const host=await readJson('ports/windows/host.json'),mapping=await readJson('ports/windows/mapping.json');
 const stateKeys=['ScrollBarThumbFill','ScrollBarThumbFillPointerOver','ScrollBarThumbFillPressed','ScrollBarThumbFillDisabled'];
 assert.deepEqual(stateKeys.map(key=>host.winuiChromeResources[key]),['color.interaction.scrollbar.thumb','color.interaction.scrollbar.thumb-hover','color.interaction.scrollbar.thumb-hover','color.interaction.disabled.bg']);
 const keys=Object.keys(host.winuiChromeResources).filter(key=>key.startsWith('ScrollBar'));
 assert.ok(keys.length>=30);
 for(const key of keys){
  assert.ok(!key.endsWith('Color'),'Color-valued animations must remain native');
  const role=host.winuiChromeResources[key];
  for(const app of ['notepad','paint','terminal']){
   assert.ok(mapping.mappings[role].includes(app+'-chrome.resource.'+key));
   const emitted=fs.readFileSync(path.join(source,'dist/j3w1-'+app+'-chrome.wh.cpp'),'utf8');
   assert.match(emitted,new RegExp('L"'+key+'"'));
   assert.match(emitted,/NativeScrollbarChrome\(std::wstring_view\{get_class_name\(object\)\}\)/);
   assert.match(emitted,/if\(DataSubtree\(object\)\)continue;/);
  }
 }
});


test('popup discovery applies the bounded same-root template bridge immediately and retains failure recovery',()=>{
 for(const app of ['notepad','paint','terminal']){
  const text=fs.readFileSync(path.join(source,'dist/j3w1-'+app+'-chrome.wh.cpp'),'utf8');
  const bridge=text.slice(text.indexOf('static void Bridge(Root& root,'),text.indexOf('static bool RootCandidateClass',text.indexOf('static void Bridge(Root& root,')));
  assert.match(bridge,/if\(popup\) \{[\s\S]*PopupDiscoveryAdmission[\s\S]*ChromeUiThread\(popup\)[\s\S]*enabled.load\(\)&&!HighContrast\(\)[\s\S]*popup.IsLoaded\(\)[\s\S]*Identity\(owner.XamlRoot\(\),popup.XamlRoot\(\)\)\)\)return;/);
  assert.match(bridge,/if\(popup\)stack.push_back\(popup\);\s*else if\(auto element=root.element.get\(\)\)/);
  assert.match(bridge,/count\+\+<4096[\s\S]*DataSubtree\(object\)[\s\S]*RefreshChromeControl\(root,object\)[\s\S]*ApplyChromeAnimationPalette/);
  const observe=text.slice(text.indexOf('static void ObservePopupChrome(FrameworkElement const& element) {'),text.indexOf('// Original adapter discovery'));
  assert.match(observe,/Guard guard\(\*uiState\);Bridge\(root,element\)/);
  for(const name of ['RestoreChromeAnimations','RestoreChromeSetters','RestoreChromeBases','RestoreChromeTransitions'])assert.ok(observe.includes(name+'(uiState->'));
  assert.match(observe,/catch\(\.\.\.\) \{[\s\S]*Guard guard\(\*uiState\);[\s\S]*Restore\(root\);\s*\}\s*Schedule\(\);return;/);
 }
});
