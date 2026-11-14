import { readJsonWithBom as read } from "./helpers/json.mjs";
import { defaultTokens } from "./helpers/tokens.mjs";
import { scratchDirSync } from "./helpers/scratch.mjs";
import { sha256Hex } from "../scripts/lib/host-install/files.mjs";
import assert from 'node:assert/strict';
import test from 'node:test';
import {parse} from 'jsonc-parser';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PNG} from 'pngjs';
import {repoRoot,readJson} from '../scripts/lib/fs.mjs';
import {assertPortArtifacts} from '../scripts/lib/port-artifacts.mjs';
import {CURSOR_NAMES,windowsStyleValue,windowsWebContentStyles,validateWindowsStylerTarget} from '../scripts/lib/windows-port.mjs';
import {folderIconFile} from '../scripts/lib/windows-folder-icon.mjs';
import {flattenStylerSettings,stylerSettings} from '../ports/windows/src/compatibility.mjs';

const source=path.join(repoRoot,'ports/windows');
const runtime=path.join(source,'dist/runtime.cjs');
const sha=b=>sha256Hex(b);

const readConfig=p=>{const errors=[];const value=parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''),errors,{allowTrailingComma:true});assert.deepEqual(errors,[],`Invalid settings: ${p}`);return value;};
const write=(p,x)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof x==='string'?x:JSON.stringify(x,null,2)+'\n');};

test('Windows wallpaper centers the supplied logo on black within the asset budget',()=>{
 const b=fs.readFileSync(path.join(source,'dist/j3w1-wallpaper.bmp'));
 const logo=PNG.sync.read(fs.readFileSync(path.join(source,'src/j3w1-logo.png')));
 assert.equal(b.toString('ascii',0,2),'BM');assert.equal(b.readUInt32LE(2),b.length);
 const width=b.readInt32LE(18),height=b.readInt32LE(22),stride=Math.ceil(width*3/4)*4;
 assert.equal(width,1024);assert.equal(height,640);assert.equal(b.readUInt16LE(28),24);assert.ok(b.length<=2097152);
 const pixel=(x,y)=>[...b.subarray(54+(height-1-y)*stride+x*3,57+(height-1-y)*stride+x*3)].reverse();
 const markWidth=Math.ceil(logo.width/2),markHeight=Math.ceil(logo.height/2);
 const left=Math.floor((width-markWidth)/2),top=Math.floor((height-markHeight)/2);
 assert.ok(Math.abs(left-(width-left-markWidth))<=1&&Math.abs(top-(height-top-markHeight))<=1);
 for(const [x,y]of [[0,0],[width-1,0],[0,height-1],[width-1,height-1],[left-1,height/2],[left+markWidth,height/2]])assert.deepEqual(pixel(x,y),[0,0,0]);
 let visible=0;
 for(let y=0;y<logo.height-1;y+=2)for(let x=0;x<logo.width-1;x+=2){
  const offsets=[(y*logo.width+x)*4,(y*logo.width+x+1)*4,((y+1)*logo.width+x)*4,((y+1)*logo.width+x+1)*4];
  const first=offsets[0],rgb=[...logo.data.subarray(first,first+3)];
  if(offsets.every(i=>logo.data[i+3]===255&&rgb.every((value,c)=>logo.data[i+c]===value))){assert.deepEqual(pixel(left+x/2,top+y/2),rgb);visible++;}
 }
 assert.ok(visible>2000,'The centered logo must be visible, not a blank wallpaper');
});

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
 const state=scratchDirSync(t, 'j3w1-windows-test-');
 const terminal=path.join(state,'fixture/terminal/settings.json');
 const before='\uFEFF{\n // keep this comment\n "profiles": {"list": [{"guid":"one","commandline":"keep-one","font":{"size":17},"colorScheme":"j3w1zsh"},{"guid":"two","commandline":"keep-two"}]},\n "keybindings": [{"command":"paste","keys":"ctrl+v"}],\n}\n';
 write(terminal,before);
 const run=(action,extra={})=>{
  const result=spawnSync(process.execPath,[runtime],{input:JSON.stringify({action,source,state,fixture:true,mode:'Native',revision:'1'.repeat(40),...extra}),encoding:'utf8',timeout:30000});
  // A killed child cannot establish an expected lifecycle rejection or rollback.
  assert.ifError(result.error);
  assert.equal(result.signal,null,`${action}: lifecycle child terminated by ${result.signal}`);
  return result;
 };
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
 const tokens=await defaultTokens();
 const settings=await readJson('ports/windows/dist/windows-settings.json');
 for(const [key,role]of Object.entries(host.roles))assert.equal(settings.values[key],tokens[role].css,key);
 const terminal=await readJson('ports/windows/dist/terminal-fragment.json');
 assert.equal(terminal.schemes[0].foreground,tokens['color.terminal.fg'].css);
 const ansi=['black','red','green','yellow','blue','purple','cyan','white','brightBlack','brightRed','brightGreen','brightYellow','brightBlue','brightPurple','brightCyan','brightWhite'];
 ansi.forEach((key,i)=>assert.equal(terminal.schemes[0][key],tokens[`color.terminal.ansi.${i}`].css));
 for(const styler of host.stylers){const x=await readJson(`ports/windows/dist/${styler.id}.json`);assert.deepEqual(x.controlStyles,[...host.menuTargets,...styler.targets].map(t=>({target:t.target,styles:Object.entries(t.styles).map(([k,r])=>`${k}=${windowsStyleValue(k,{type:tokens[r].type,resolved:tokens[r].value})}`)})));}
 assert.equal(settings.version,(await readJson('theme.json')).version);
});

test('Settings resource overrides retain shared brushes and stay isolated from other stylers',async()=>{
 const host=await readJson('ports/windows/host.json');
 const tokens=await defaultTokens();
 const settings=host.stylers.find(m=>m.id==='windows-11-settings-styler');
 const expected={SystemControlFocusVisualPrimaryBrush:'color.interaction.focus.ring',SystemControlFocusVisualSecondaryBrush:'color.surface.canvas',FocusStrokeColorOuterBrush:'color.interaction.focus.ring',FocusStrokeColorInnerBrush:'color.surface.canvas',ToolTipBackground:'color.surface.canvas',ToolTipForeground:'color.text.default',ToolTipBorderBrush:'color.border.overlay',ToolTipBackgroundBrush:'color.surface.canvas',ToolTipForegroundBrush:'color.text.default'};
 Object.assign(expected,{ProgressBarBackground:'color.interaction.pressed.bg',ProgressBarForeground:'color.action.primary.bg',ProgressBarBorderBrush:'color.border.control',ToggleSwitchContentForeground:'color.text.default',ToggleSwitchContentForegroundDisabled:'color.text.disabled',ToggleSwitchHeaderForeground:'color.text.default',ToggleSwitchHeaderForegroundDisabled:'color.text.disabled',ToggleSwitchKnobStrokeOn:'color.border.control'});
 for(const [suffix,off,on] of [['','color.surface.input','color.action.primary.bg'],['PointerOver','color.interaction.hover.bg','color.action.primary.hover-bg'],['Pressed','color.interaction.pressed.bg','color.action.primary.pressed-bg'],['Disabled','color.interaction.disabled.bg','color.interaction.disabled.bg']]){
  expected['ToggleSwitchFillOff'+suffix]=off;expected['ToggleSwitchFillOn'+suffix]=on;
  for(const state of ['Off','On']){
   expected['ToggleSwitchStroke'+state+suffix]=suffix==='Disabled'?'color.border.disabled':'color.border.control';
   expected['ToggleSwitchKnobFill'+state+suffix]=suffix==='Disabled'?'color.text.disabled':state==='On'?'color.action.primary.text':'color.text.default';
  }
 }
 for(const [suffix,bg,fg]of [
  ['','color.surface.raised','color.text.default'],
  ['PointerOver','color.interaction.hover.bg-strong','color.text.default'],
  ['Pressed','color.interaction.pressed.bg','color.text.default'],
  ['Selected','color.interaction.selection.bg','color.interaction.selection.text'],
  ['SelectedPointerOver','color.interaction.selection.bg','color.interaction.selection.text'],
  ['SelectedPressed','color.interaction.selection.bg','color.interaction.selection.text'],
  ['Disabled','color.surface.raised','color.text.disabled'],
  ['SelectedDisabled','color.interaction.disabled.bg','color.text.disabled'],
 ]){
  expected['ListViewItemBackground'+suffix]=bg;
  expected['ListViewItemForeground'+suffix]=fg;
 }
 Object.assign(expected,{NavigationViewDefaultPaneBackground:'color.surface.canvas',NavigationViewExpandedPaneBackground:'color.surface.canvas',NavigationViewTopPaneBackground:'color.surface.canvas',NavigationViewSelectionIndicatorForeground:'color.border.selected-indicator',NavigationViewItemSeparatorForeground:'color.border.divider',NavigationViewItemHeaderForeground:'color.text.muted'});
 for(const [suffix,bg,fg]of [
  ['','color.surface.canvas','color.text.default'],
  ['PointerOver','color.interaction.hover.bg','color.text.default'],
  ['Pressed','color.interaction.pressed.bg','color.text.muted'],
  ['Disabled','color.interaction.disabled.bg','color.text.disabled'],
  ...['Checked','Selected'].flatMap(selected=>[
   [selected,'color.interaction.selection.bg','color.interaction.selection.text'],
   [selected+'PointerOver','color.interaction.selection.bg','color.interaction.selection.text'],
   [selected+'Pressed','color.interaction.selection.bg','color.interaction.selection.text'],
   [selected+'Disabled','color.interaction.disabled.bg','color.text.disabled'],
  ]),
 ]){
  expected['NavigationViewItemBackground'+suffix]=bg;
  expected['NavigationViewItemForeground'+suffix]=fg;
 }
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
   if(!['windows-11-notification-center-styler','windows-11-taskbar-styler'].includes(mod.id))assert.equal(mod.resources,undefined);
   for(const key of Object.keys(expected))
    assert.equal(actual[key],Object.hasOwn(host.resources,key)?windowsStyleValue(key,{type:tokens[host.resources[key]].type,resolved:tokens[host.resources[key]].value}):undefined,'Settings resource leaked into '+mod.id);
  }
 }
 for(const target of settings.targets)for(const key of Object.keys(target.styles))
  assert.doesNotMatch(key,/^(?:UseSystemFocusVisuals|FocusVisualPrimaryThickness|FocusVisualSecondaryThickness|FocusVisualMargin|IsTabStop|TabIndex|Width|Height|Padding|Margin|Command|Content|Text)$/);
});

test('shell tooltips override the standard template frame without changing content or input',async()=>{
 const host=await readJson('ports/windows/host.json'),tokens=await defaultTokens();
 for(const resources of [host.calculator.resources,host.winuiChromeResources]){
  for(const key of ['ToolTipBackground','ToolTipBackgroundBrush'])assert.equal(resources[key],'color.surface.canvas');
  for(const key of ['ToolTipForeground','ToolTipForegroundBrush'])assert.equal(resources[key],'color.text.default');
  assert.equal(resources.ToolTipBorderBrush,'color.border.overlay');
 }
 for(const mod of host.stylers){
  const payload=await readJson('ports/windows/dist/'+mod.id+'.json');
  for(const target of ['ToolTip','ToolTip > ContentPresenter#LayoutRoot']){
   const frame=payload.controlStyles.find(rule=>rule.target===target);
   assert.ok(frame,target+' in '+mod.id);
   assert.ok(frame.styles.includes('Background='+tokens['color.surface.canvas'].css));
   assert.ok(frame.styles.includes('Foreground='+tokens['color.text.default'].css));
   assert.ok(frame.styles.includes('BorderBrush='+tokens['color.border.overlay'].css));
   assert.ok(frame.styles.includes('BorderThickness=1'));
   assert.ok(frame.styles.includes('CornerRadius=0'));
   for(const value of frame.styles)assert.doesNotMatch(value,/^(?:Content|ContentTemplate|ContentTransitions|IsOpen|Placement|OpenDelay|CloseDelay|Visibility|Width|Height|Padding|Margin|IsHitTestVisible|IsTabStop|UseSystemFocusVisuals)=/);
  }
 }
 for(const prefix of ['ControlFillColor','SubtleFillColor']){
  assert.equal(host.resources[prefix+'SecondaryBrush'],'color.interaction.hover.bg');
  assert.equal(host.resources[prefix+'TertiaryBrush'],'color.interaction.pressed.bg');
  assert.equal(host.resources[prefix+'DisabledBrush'],'color.interaction.disabled.bg');
 }
});

test('Settings custom navigation frame overrides its native pointer states while preserving layout and icons',async()=>{
 const host=await readJson('ports/windows/host.json'),mapping=await readJson('ports/windows/mapping.json');
 const tokens=await defaultTokens(),id='windows-11-settings-styler';
 const target='SystemSettings.View.SettingsNavigationViewItem > Grid#NVIRootGrid > Microsoft.UI.Xaml.Controls.Primitives.NavigationViewItemPresenter#NavigationViewItemPresenter > Grid#LayoutRoot@PointerStates';
 const payload=await readJson('ports/windows/dist/'+id+'.json');
 const frame=payload.controlStyles.find(rule=>rule.target===target);
 assert.ok(frame,'Settings owns a custom navigation template, independent of global resource aliases');
 for(const [state,role]of [
  ['Normal','color.surface.canvas'],['PointerOver','color.interaction.hover.bg'],['Pressed','color.interaction.pressed.bg'],
  ['Selected','color.interaction.selection.bg'],['PointerOverSelected','color.interaction.selection.bg'],['PressedSelected','color.interaction.selection.bg'],
 ]){
  assert.ok(frame.styles.includes('Background@'+state+'='+tokens[role].css),state);
  assert.ok(mapping.mappings[role].includes(id+' | '+target+' | Background@'+state));
 }
 assert.ok(frame.styles.includes('CornerRadius=0'));
 for(const value of frame.styles)assert.match(value,/^(?:Background@(?:Normal|PointerOver|Pressed|Selected|PointerOverSelected|PressedSelected)|CornerRadius)=/);
 for(const mod of host.stylers.filter(mod=>mod.id!==id))assert.ok(!mod.targets.some(rule=>rule.target===target));
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
 const tokens=await defaultTokens();
 for(const [key,role] of Object.entries((await readJson('ports/windows/host.json')).nativeExplorer)){
  if(key==='version')continue;
  assert.equal(settings[key],windowsStyleValue(key,{type:tokens[role].type,resolved:tokens[role].value}));
 }
 assert.equal(settings.marquee,'#1f911410');
 assert.equal(settings.marqueeBorder,'#e53935');
 const source=fs.readFileSync(path.join(repoRoot,'ports/windows/dist/j3w1-explorer-native.wh.cpp'),'utf8');
 assert.match(source,/FixedModuleVersion\(frame,MAKELONG\(0,10\),MAKELONG\(9974,26100\)\)/);
 assert.match(source,/FixedModuleVersion\(dui,MAKELONG\(0,10\),MAKELONG\(9818,26100\)\)/);
 assert.doesNotMatch(source,/@[A-Z0-9_]+@/);
});

function explorerFailureRecordContract(source){
 const begin='namespace InitFailure {\n',end='\n}\n// Refuse unknown fixed executable versions even if descriptive metadata matches.\n';
 assert.equal((source.match(/\bnamespace\s+InitFailure\s*\{/g)||[]).length,1,'Exactly one actual writer namespace');
 assert.equal(source.split(begin).length,2);assert.equal(source.split(end).length,2);
 const first=source.indexOf(begin),last=source.indexOf(end);assert.ok(last>first);
 const helper=source.slice(first,last+2),outside=source.slice(0,first)+source.slice(last+2);
 assert.doesNotMatch(source,/@[A-Z0-9_]+@|native-probe|SetSysColors|FILE_APPEND_DATA|CREATE_ALWAYS|DeleteFile/);
 assert.doesNotMatch(outside,/GENERIC_WRITE|CREATE_NEW|WriteFile/,'All non-writer code retains the original no-write rule');
 assert.equal((outside.match(/CreateFileW\(/g)||[]).length,1,'Only the module digest reader opens files outside the writer');
 assert.match(outside,/CreateFileW\(path,GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr\)/);
 assert.equal((helper.match(/CreateFileW\(/g)||[]).length,2);
 assert.match(helper,/CreateFileW\(parent\.c_str\(\),FILE_LIST_DIRECTORY\|FILE_READ_ATTRIBUTES,FILE_SHARE_READ,nullptr,\s*OPEN_EXISTING,FILE_FLAG_BACKUP_SEMANTICS\|FILE_FLAG_OPEN_REPARSE_POINT,nullptr\)/);
 assert.match(helper,/CreateFileW\(path\.c_str\(\),GENERIC_WRITE\|FILE_READ_ATTRIBUTES,0,nullptr,CREATE_NEW,\s*FILE_ATTRIBUTE_NORMAL\|FILE_FLAG_OPEN_REPARSE_POINT,nullptr\)/);
 assert.ok(helper.includes(String.raw`path+=L"\\j3w1-theme\\windows\\diagnostics";`));
 assert.ok(helper.includes(String.raw`path+=L"\\j3w1-explorer-native-1.8.10-init-failure.json";`));
 assert.equal((helper.match(/WriteFile\(/g)||[]).length,1);assert.equal((helper.match(/FlushFileBuffers\(/g)||[]).length,1);
 assert.match(helper,/WriteFile\(file\.value,record,static_cast<DWORD>\(size\),&written,nullptr\)/);
 assert.match(helper,/size<=0\|\|size>=static_cast<int>\(sizeof\(record\)\)/);
 assert.match(helper,/FOLDERID_LocalAppData,0,nullptr/);
 assert.match(helper,/FILE_LIST_DIRECTORY\|FILE_READ_ATTRIBUTES,FILE_SHARE_READ,nullptr/);
 assert.match(helper,/CREATE_NEW/);assert.match(helper,/FILE_FLAG_OPEN_REPARSE_POINT/);
 assert.match(helper,/GetFinalPathNameByHandleW/);assert.match(helper,/GetFileInformationByHandle/);
 assert.match(helper,/GetProcessTimes/);assert.match(helper,/record\[1024\]/);
 assert.match(helper,/FlushFileBuffers/);assert.match(helper,/~LastError\(\)\{SetLastError\(value\);\}/);
 assert.doesNotMatch(helper,/GetEnvironmentVariable|CreateDirectory|CREATE_ALWAYS|OPEN_ALWAYS|DeleteFile|MoveFile|journal\.json|current\.json|Wh_Log/);
 assert.match(source,/if\(FAILED\(apartment\)\)return false;/,'glyph COM still refuses RPC_E_CHANGED_MODE');
 assert.match(source,/if\(FAILED\(apartment\)&&apartment!=RPC_E_CHANGED_MODE\)return false;/,'bitmap existing COM policy preserved');
 const chain=source.slice(source.indexOf('BOOL Wh_ModInit()'),source.indexOf('void Wh_ModAfterInit()'));
 for(const name of ['Contrast','Colors','Executable','VersionSize','VersionInfo','VersionValue','VersionMatch','ThemeClass','Pin','Marquee','Renderers','MarqueeHooks','NavigationHooks','FolderColors','Brush','Hooks'])
  assert.match(chain,new RegExp(`failure\\.Check\\(${name},`),name);
 assert.match(chain,/FAILED\(failure\.glyph\)\?GlyphCom:GlyphBuild/);
 assert.match(chain,/com\?BitmapCom:BitmapBuild/);
 const keys=[...helper.matchAll(/\\"([A-Za-z]+)\\":/g)].map(m=>m[1]);
 assert.deepEqual(keys,['protocol','adapterVersion','pid','creationFiletime','stage','nativeKind','nativeAvailable','nativeValue','glyphCom','bitmapCom']);
 // The exception admits only the exact reviewed writer, not arbitrary code in a named namespace.
 assert.equal(sha(Buffer.from(helper)),'26ed1580566e249a868b524707575c6511965012a986cfe7f62c9940252629e5');
 return outside;
}

test('Explorer failure record retains closed data, admission and exclusive path ownership',()=>{
 const source=fs.readFileSync(path.join(repoRoot,'ports/windows/dist/j3w1-explorer-native.wh.cpp'),'utf8');
 explorerFailureRecordContract(source);
 const mutations=[
  source+'\nvoid ForeignWrite(){WriteFile(nullptr,nullptr,0,nullptr,nullptr);}\n',
  source+'\nvoid ForeignOpen(){CreateFileW(L"unreviewed",GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr);}\n',
  source.replace('namespace InitFailure {','namespace InitFailure {\nvoid ForeignWrite(){WriteFile(nullptr,nullptr,0,nullptr,nullptr);}'),
  source.replace('j3w1-explorer-native-1.8.10-init-failure.json','other-init-failure.json'),
  source.replace('CREATE_NEW','OPEN_ALWAYS'),
  source.replace('GENERIC_WRITE|FILE_READ_ATTRIBUTES,0,nullptr,CREATE_NEW','GENERIC_WRITE|FILE_READ_ATTRIBUTES,FILE_SHARE_WRITE,nullptr,CREATE_NEW'),
  source+'\nnamespace InitFailure {}\n',
 ];
 for(const changed of mutations){assert.notEqual(changed,source);assert.throws(()=>explorerFailureRecordContract(changed));}
});

test('Explorer submenu stays on the hover palette while its child flyout is open',async()=>{
 const config=await readJson('ports/windows/dist/windows-11-file-explorer-styler.json');
 const tokens=await defaultTokens();
 for(const [target,opened,hover,normal,disabled] of [
  ['MenuFlyoutSubItem > Grid#LayoutRoot@CommonStates','SubMenuOpened','PointerOver','Normal','Disabled'],
  ['AppBarButton > Grid#Root@CommonStates > Border#AppBarButtonInnerBorder','OverflowSubMenuOpened','OverflowPointerOver','OverflowNormal','OverflowDisabled'],
 ]){
  const submenu=config.controlStyles.find(x=>x.target===target);
  assert.ok(submenu,target);
  const value=name=>submenu.styles.find(s=>s.startsWith(`${name}=`))?.split('=').slice(1).join('=');
  const role=tokens[target.startsWith('MenuFlyout')?'color.interaction.hover.bg-strong':'color.interaction.hover.bg'];
  assert.equal(value(`Background@${opened}`),windowsStyleValue(`Background@${opened}`,{type:role.type,resolved:role.value}),target);
  assert.equal(value(`Background@${opened}`),value(`Background@${hover}`),target);
  assert.notEqual(value(`Background@${opened}`),value(`Background@${normal}`),target);
  assert.notEqual(value(`Background@${opened}`),value(`Background@${disabled}`),target);
 }
});

test('toast actions use the secondary palette across native states without changing content or geometry',async()=>{
 const payload=await readJson('ports/windows/dist/windows-11-notification-center-styler.json');
 const tokens=await defaultTokens();
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

const colorizationKey='Software\\Microsoft\\Windows\\DWM|ColorizationColor';
const dword=value=>({exists:true,value,type:'DWord'});
test('native colorization preserves existing Windows intensity and verifies the entire DWORD',t=>{
 const f=fixture(t),registry=path.join(f.state,'fixture/registry.json');
 const original=dword(0xc4d0000c);write(registry,{[colorizationKey]:original});
 f.ok('Apply',{fixtureRefreshValues:{[colorizationKey]:dword(0xc4e53935)}});
 const op=f.journal().transactions[0].operations.find(x=>x.name==='ColorizationColor');
 assert.deepEqual(op.before,original);assert.deepEqual(op.after,dword(0xc4e53935));
 f.ok('Test');assert.equal(JSON.parse(f.ok('Apply').stdout).result,'unchanged');
 f.ok('Restore');assert.deepEqual(read(registry),{[colorizationKey]:original});
 f.ok('Apply');const values=read(registry);values[colorizationKey]=dword(0xc5e53935);write(registry,values);
 assert.equal(f.run('Test').status,1);assert.match(f.run('Update',{revision:'2'.repeat(40)}).stderr,/Managed setting conflict/);
});

test('activation rejects refresh drift before committing success, including previous transactions',t=>{
 for(const previous of [false,true]){
  const f=fixture(t);if(previous)f.ok('Apply');
  const r=f.run(previous?'Update':'Apply',{revision:'2'.repeat(40),fixtureRefreshValues:{[colorizationKey]:dword(0xc4e53935)}});
  assert.notEqual(r.status,0);assert.match(r.stderr,/Post-refresh verification failed: .*ColorizationColor/);
  assert.doesNotMatch(r.stdout,/"result":"applied"/);
  assert.notEqual(f.journal().transactions.at(-1).status,'applied');
  if(previous)assert.equal(read(path.join(f.state,'current.json')).revision,'1'.repeat(40));
  else assert.ok(!fs.existsSync(path.join(f.state,'current.json')));
 }
});

function legacyColorizationFixture(t){
 const f=fixture(t),registry=path.join(f.state,'fixture/registry.json');
 const original=dword(0xc4d0000c);write(registry,{[colorizationKey]:original});f.ok('Apply');
 // Reproduce the retained legacy installer receipt: it wrote opaque intensity,
 // reported success, and Windows then restored its original intensity.
 const history=f.journal(),op=history.transactions[0].operations.find(x=>x.name==='ColorizationColor');
 op.after=dword(0xffe53935);write(path.join(f.state,'journal.json'),history);
 return {...f,registry,original};
}
test('legacy intensity recovery is explicit, exact and restores the original receipt without changing Test',t=>{
 const f=legacyColorizationFixture(t);
 assert.equal(f.run('Test').status,1);assert.equal(f.run('Restore').status,2);
 f.ok('Restore',{restoreColorizationIntensity:true});
 const op=f.journal().transactions[0].operations.find(x=>x.name==='ColorizationColor');
 assert.deepEqual(op.before,f.original);assert.deepEqual(op.after,dword(0xffe53935));
 assert.deepEqual(op.intensityRecovery,{observed:dword(0xc4e53935),recordedAfter:dword(0xffe53935)});
 assert.deepEqual(read(f.registry),{[colorizationKey]:f.original});
 f.ok('Apply',{revision:'2'.repeat(40)});f.ok('Test');f.ok('Restore');
 assert.deepEqual(read(f.registry),{[colorizationKey]:f.original});
});
test('explicit legacy recovery preserves different RGB, intensity, type and missing-value conflicts',t=>{
 for(const value of [dword(0xc4e53936),dword(0xc5e53935),{exists:true,value:0xc4e53935,type:'QWord'},null]){
  const f=legacyColorizationFixture(t),values=read(f.registry);
  if(value)values[colorizationKey]=value;else delete values[colorizationKey];write(f.registry,values);
  const r=f.run('Restore',{restoreColorizationIntensity:true});assert.equal(r.status,2);
  assert.deepEqual(read(f.registry)[colorizationKey],value??undefined);
  assert.equal(f.journal().transactions[0].operations.find(x=>x.name==='ColorizationColor').intensityRecovery,undefined);
 }
 const f=fixture(t);assert.match(f.run('Apply',{restoreColorizationIntensity:true}).stderr,/only available with Restore/);
});

function nativeColorizationFixture(t){
 const f=fixture(t),registry=path.join(f.state,'fixture/registry.json'),original=dword(0xc4d0000c);
 write(registry,{[colorizationKey]:original});return {...f,registry,original};
}
test('dependent colorization planning refuses an intensity edit between its two reads without writes',t=>{
 const f=nativeColorizationFixture(t),newer=dword(0xc5d0000c);
 const r=f.run('Apply',{fixtureBeforePlanningValues:{[colorizationKey]:newer}});
 assert.notEqual(r.status,0);assert.match(r.stderr,/Concurrent edit during dependent colorization planning/);
 assert.deepEqual(read(f.registry),{[colorizationKey]:newer});assert.equal(fs.readFileSync(f.terminal,'utf8'),f.before);
 assert.ok(!fs.existsSync(path.join(f.state,'journal.json')));
});
test('normal, Latest and explicit legacy restoration retain exact ownership after refresh drift',t=>{
 for(const route of ['normal','latest','legacy']){
  const f=route==='legacy'?legacyColorizationFixture(t):nativeColorizationFixture(t);
  if(route!=='legacy')f.ok('Apply');
  const flags={latest:route==='latest',restoreColorizationIntensity:route==='legacy'};
  const r=f.run('Restore',{...flags,fixtureRefreshSteps:[{values:{[colorizationKey]:dword(0xc4d0000d)}}]});
  assert.equal(r.status,2);assert.equal(JSON.parse(r.stdout).result,'conflicts');
  const tx=f.journal().transactions[0],op=tx.operations.find(x=>x.name==='ColorizationColor');
  assert.equal(tx.status,'restore-conflict');assert.equal(op.applied,true);assert.equal(op.restorePending,true);
  assert.deepEqual(op.before,f.original);assert.deepEqual(op.after,dword(route==='legacy'?0xffe53935:0xc4e53935));
  assert.ok(fs.existsSync(path.join(f.state,'current.json')));
  assert.equal(f.run('Restore',flags).status,2);assert.deepEqual(read(f.registry)[colorizationKey],dword(0xc4d0000d));
  const values=read(f.registry);values[colorizationKey]=f.original;write(f.registry,values);f.ok('Restore',flags);
  assert.equal(f.journal().transactions[0].status,'restored');assert.ok(!fs.existsSync(path.join(f.state,'current.json')));
 }
});
test('refresh drift in a newer restored document stops recovery before the older baseline',t=>{
 const f=nativeColorizationFixture(t);f.ok('Apply');
 const updated=readConfig(f.terminal);updated.profiles.list.push({guid:'third',commandline:'keep-third'});write(f.terminal,updated);
 f.ok('Update',{revision:'2'.repeat(40)});
 const drift=structuredClone(updated);drift.profiles.list[2].colorScheme='later-owner-choice';
 const r=f.run('Restore',{fixtureRefreshSteps:[{files:[{path:'terminal/settings.json',value:JSON.stringify(drift)}]}]});
 assert.equal(r.status,2);
 const history=f.journal();assert.equal(history.transactions[0].status,'applied');assert.equal(history.transactions[1].status,'restore-conflict');
 assert.equal(read(path.join(f.state,'current.json')).revision,'2'.repeat(40));
 assert.ok(history.transactions[1].operations.filter(x=>x.kind==='json').every(x=>x.applied&&x.restorePending));
 assert.equal(history.transactions[1].documents[0].restorePending,true);
 assert.equal(f.run('Restore',{latest:true}).status,2);assert.equal(readConfig(f.terminal).profiles.list[2].colorScheme,'later-owner-choice');
 const repaired=readConfig(f.terminal);delete repaired.profiles.list[2].colorScheme;write(f.terminal,repaired);
 f.ok('Restore',{latest:true});assert.equal(read(path.join(f.state,'current.json')).revision,'1'.repeat(40));f.ok('Test');
 f.ok('Restore');assert.equal(readConfig(f.terminal).profiles.list[2].commandline,'keep-third');
});
test('a checked revision-only restore advances to the older pending recovery without losing its pointer',t=>{
 const f=nativeColorizationFixture(t);f.ok('Apply');f.ok('Update',{revision:'2'.repeat(40)});
 const r=f.run('Restore',{fixtureRefreshSteps:[{values:{[colorizationKey]:dword(0xc4d0000d)}}]});assert.equal(r.status,2);
 const tx=f.journal().transactions;assert.equal(tx[1].status,'restored');assert.equal(tx[0].status,'restore-conflict');
 assert.equal(read(path.join(f.state,'current.json')).revision,'1'.repeat(40));
 const values=read(f.registry);values[colorizationKey]=f.original;write(f.registry,values);f.ok('Restore');
 assert.ok(f.journal().transactions.every(x=>x.status==='restored'));
 // Model interruption between the final durable receipt and pointer update.
 write(path.join(f.state,'current.json'),{revision:'1'.repeat(40),mode:'Native'});
 f.ok('Restore');assert.ok(!fs.existsSync(path.join(f.state,'current.json')));
});
test('restoration refresh errors retain durable expectations and resume exact JSON bytes',t=>{
 const f=nativeColorizationFixture(t);f.ok('Apply');
 const r=f.run('Restore',{fixtureRefreshSteps:[{error:true}]});assert.equal(r.status,2);assert.match(r.stdout,/Injected personalization refresh failure/);
 const tx=f.journal().transactions[0];assert.equal(tx.status,'restore-conflict');assert.ok(tx.operations.every(x=>x.applied&&x.restorePending));
 assert.ok(fs.existsSync(path.join(f.state,'current.json')));f.ok('Restore');
 assert.equal(fs.readFileSync(f.terminal,'utf8'),f.before);assert.deepEqual(read(f.registry),{[colorizationKey]:f.original});
});
test('exception rollback shares the post-refresh verification and retained recovery expectations',t=>{
 for(const step of [{values:{[colorizationKey]:dword(0xc4d0000d)}},{error:true}]){
  const f=nativeColorizationFixture(t);
  const r=f.run('Apply',{failAfter:50,fixtureRefreshSteps:[step]});assert.notEqual(r.status,0);assert.match(r.stderr,/rollback needs conflict recovery/);
  const tx=f.journal().transactions[0],op=tx.operations.find(x=>x.name==='ColorizationColor');
  assert.equal(tx.status,'restore-conflict');assert.equal(op.applied,true);assert.equal(op.restorePending,true);assert.deepEqual(op.before,f.original);
  assert.ok(!fs.existsSync(path.join(f.state,'current.json')));
  if(step.values){assert.equal(f.run('Restore').status,2);const values=read(f.registry);values[colorizationKey]=f.original;write(f.registry,values);}
  f.ok('Restore');assert.equal(f.journal().transactions[0].status,'restored');assert.equal(fs.readFileSync(f.terminal,'utf8'),f.before);
 }
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
 const outside=scratchDirSync(t, 'j3w1-outside-');fs.symlinkSync(outside,path.join(f.state,'assets'),process.platform==='win32'?'junction':'dir');assert.match(f.run('Apply').stderr,/Reparse\/symlink/);assert.deepEqual(fs.readdirSync(outside),[]);
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
 assert.ok(['all','protocol','candidate'].includes(scope));
 // Retain every earlier component/recovery test state. The current candidate's
 // narrower activation policy is exercised separately with scope=candidate.
 if(scope!=='candidate'){
  const settingsFile=path.join(copy,'dist/windows-settings.json'),settings=read(settingsFile);
  settings.adapterExclusions=[];write(settingsFile,settings);
 }
 if(scope==='protocol'){
  const settingsFile=path.join(copy,'dist/windows-settings.json'),settings=read(settingsFile);
  settings.bundledMods=settings.bundledMods.filter(mod=>mod.id==='j3w1-explorer-native');
  assert.equal(settings.bundledMods.length,1);
  write(settingsFile,settings);
 }
 const args={source:copy,mode:'Full',fixtureWindhawk:path.join(repoRoot,'tests/fixtures/windows-windhawk.cjs')};
 return {...f,args,db:()=>read(path.join(f.state,'fixture-windhawk.json'))};
}
test('9974 candidate excludes unreviewed optional adapters without losing their artifacts',t=>{
 const f=windhawkFixture(t,'candidate'),settings=read(path.join(f.args.source,'dist/windows-settings.json'));
 const environment=read(path.join(source,'host.json')).compatibility[0];
 const args={...f.args,environment};
 assert.deepEqual(settings.adapterExclusions,['j3w1-notepad-native','j3w1-notepad-chrome','j3w1-powertoys-preview','j3w1-powertoys-markdown']);
 const plan=JSON.parse(f.ok('Plan',args).stdout);assert.equal(plan.compatible,true);
 assert.deepEqual(plan.excludedAdapters,settings.adapterExclusions);
 for(const changed of [{...environment,ubr:9818},{...environment,ubr:9975},{...environment,startLayout:'unknown'},{...environment,explorerFixedVersion:'10.0.26100.9818'}]){
  assert.notEqual(f.run('Apply',{...args,environment:changed}).status,0);
  assert.ok(!fs.existsSync(path.join(f.state,'journal.json')));
 }
 f.ok('Apply',args);f.ok('Test',args);
 const installed=f.journal().transactions[0].mods.map(mod=>mod.sourceId);
 assert.deepEqual(installed,['fixture-styler',...settings.bundledMods.filter(mod=>!settings.adapterExclusions.includes(mod.id)).map(mod=>mod.id)]);
 for(const id of settings.adapterExclusions){
  assert.ok(settings.bundledMods.some(mod=>mod.id===id));assert.ok(fs.existsSync(path.join(f.args.source,'dist',id+'.wh.cpp')));
  assert.equal(f.db()['local@'+id],undefined);
 }
 f.ok('Restore',args);
});
test('excluded managed adapters require recovery without changing live owned state',t=>{
 const f=windhawkFixture(t);f.ok('Apply',f.args);
 const settingsFile=path.join(f.args.source,'dist/windows-settings.json'),settings=read(settingsFile);
 settings.adapterExclusions=['j3w1-notepad-native'];write(settingsFile,settings);
 const before=fs.readFileSync(path.join(f.state,'fixture-windhawk.json'));
 const refused=f.run('Update',{...f.args,revision:'2'.repeat(40)});
 assert.notEqual(refused.status,0);assert.match(refused.stderr,/Excluded managed adapter remains owned/);
 assert.deepEqual(fs.readFileSync(path.join(f.state,'fixture-windhawk.json')),before);
 assert.equal(f.journal().transactions.length,1);
 f.ok('Restore',f.args);
});
test('excluded unowned adapters and invalid exclusion identities refuse before staging',t=>{
 const f=windhawkFixture(t,'candidate');
 const file=path.join(f.state,'fixture-windhawk.json');
 // The protocol fixture serializes its database on reads; seed that same
 // representation so this still checks byte-exact preservation on refusal.
 write(file,JSON.stringify({'local@j3w1-notepad-native':{id:'local@j3w1-notepad-native',metadata:{version:'owner'},config:{disabled:false},settings:{owner:'keep'}}}));
 const before=fs.readFileSync(file),failed=f.run('Apply',f.args);
 assert.notEqual(failed.status,0);assert.match(failed.stderr,/Excluded adapter is already installed/);
 assert.deepEqual(fs.readFileSync(file),before);assert.ok(!fs.existsSync(path.join(f.state,'journal.json')));
 const settingsFile=path.join(f.args.source,'dist/windows-settings.json'),settings=read(settingsFile);
 settings.adapterExclusions=['not-a-reviewed-adapter'];write(settingsFile,settings);
 assert.match(f.run('Apply',f.args).stderr,/Invalid source-owned adapter exclusions/);
});
test('Windhawk uses local installed IDs, verifies staged version and nested enabled state, and removes owned mods',t=>{
 const f=windhawkFixture(t);f.ok('Apply',f.args);f.ok('Test',f.args);
 assert.equal(f.journal().transactions[0].mods[0].id,'local@fixture-styler');
 assert.deepEqual(f.journal().transactions[0].mods.slice(1).map(mod=>mod.id),read(path.join(source,'dist/windows-settings.json')).bundledMods.map(mod=>'local@'+mod.id));
 assert.equal(f.journal().transactions[0].mods[1].id,'local@j3w1-explorer-native');
 assert.equal(f.db()['local@j3w1-explorer-native'].settings.background,'#000000');
 assert.equal(f.db()['local@j3w1-explorer-native'].settings.foreground,read(path.join(source,'dist/j3w1-explorer-native.json')).foreground);
 assert.equal(f.db()['local@fixture-styler'].config.disabled,false);
 const db=f.db();db['local@fixture-styler'].config.disabled=true;write(path.join(f.state,'fixture-windhawk.json'),db);
 const failed=f.run('Test',f.args);assert.equal(failed.status,1);assert.match(failed.stdout,/disabled or unknown state/);
 f.ok('Guard',f.args);f.ok('Test',f.args);f.ok('Uninstall',f.args);assert.deepEqual(f.db(),{appSettings:{disableUpdateCheck:false}});
});

test('Full startup uses one journaled shell link and restores the former Run value exactly',t=>{
 const f=windhawkFixture(t,'protocol'),runKey='Software\\Microsoft\\Windows\\CurrentVersion\\Run|j3w1ThemeGuard';
 const registry=path.join(f.state,'fixture/registry.json'),link=path.join(f.state,'fixture/startup/j3w1-theme-guard.lnk');
 const original={exists:true,type:'ExpandString',value:'owner original startup value'};
 write(registry,{[runKey]:original,unrelated:{exists:true,type:'String',value:'keep'}});
 f.ok('Plan',f.args);assert.ok(!fs.existsSync(link));assert.deepEqual(read(registry)[runKey],original);
 const longPwsh=path.join(f.state,'long startup path '.repeat(10),'nested startup path '.repeat(10),'pwsh.exe');
 const args={...f.args,guardPwsh:longPwsh};
 f.ok('Apply',args);
 const specification=JSON.parse(fs.readFileSync(link,'utf8'));
 assert.equal(specification.target,longPwsh);
 assert.ok((longPwsh+' '+specification.arguments).length>260);
 assert.ok(specification.arguments.includes(' -Action Guard -StateRoot "'+f.state+'"'));
 assert.ok(specification.arguments.includes(' -File "'+path.join(args.source,'install.ps1')+'"'));
 assert.equal(read(registry)[runKey],undefined);assert.equal(read(registry).unrelated.value,'keep');
 assert.equal(f.journal().transactions[0].operations.filter(op=>op.kind==='file'&&op.path===link).length,1);
 assert.equal(JSON.parse(f.ok('Apply',args).stdout).result,'unchanged');
 f.ok('Test',args);f.ok('Restore',args);
 assert.ok(!fs.existsSync(link));assert.deepEqual(read(registry)[runKey],original);
 assert.equal(read(registry).unrelated.value,'keep');
});

test('startup migration failure and later user shortcut edits retain exact recovery',t=>{
 const f=windhawkFixture(t,'protocol'),runKey='Software\\Microsoft\\Windows\\CurrentVersion\\Run|j3w1ThemeGuard';
 const registry=path.join(f.state,'fixture/registry.json'),link=path.join(f.state,'fixture/startup/j3w1-theme-guard.lnk');
 const original={exists:true,type:'String',value:'legacy guard'};
 write(registry,{[runKey]:original});
 const failure=f.run('Apply',{...f.args,failAfter:2});assert.notEqual(failure.status,0);
 assert.ok(!fs.existsSync(link));assert.deepEqual(read(registry)[runKey],original);
 f.ok('Apply',f.args);write(link,'later user link bytes');
 assert.equal(f.run('Test',f.args).status,1);
 const recovery=f.run('Restore',f.args);assert.equal(recovery.status,2);
 assert.equal(fs.readFileSync(link,'utf8'),'later user link bytes');
 assert.ok(JSON.parse(recovery.stdout).conflicts.some(value=>value.includes('j3w1-theme-guard.lnk')));
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
 f.ok('Apply');const managed=read(file),later={...before,value:Buffer.from('later image').toString('base64')};write(file,later);
 assert.equal(f.run('Test').status,1);
 const refused=f.run('Apply');assert.notEqual(refused.status,0);assert.match(refused.stderr,/Managed setting conflict: Windows lock-screen image/);
 assert.deepEqual(read(file),later);
 assert.equal(f.run('Restore').status,2);write(file,managed);f.ok('Restore');assert.deepEqual(read(file),before);
});

// All image values and cache identities in these cases are synthetic fixtures.
const lockValueSha=value=>sha(Buffer.from(JSON.stringify({exists:value.exists,extension:value.extension,value:value.value})));
function lockChoiceFixture(t,full=false){
 const f=full?windhawkFixture(t,'protocol'):fixture(t),file=path.join(f.state,'fixture/lockscreen.json'),journalPath=path.join(f.state,'journal.json');
 const original={exists:true,value:Buffer.from('synthetic original').toString('base64'),extension:'.jpg'},chosen={...original,value:Buffer.from('synthetic owner choice').toString('base64')};
 write(file,original);f.ok('Apply',full?f.args:{});const originalHistory=f.journal();write(file,chosen);
 const prepare=(revision='2'.repeat(40))=>{
  const release=path.join(f.state,'releases',revision);fs.mkdirSync(path.join(release,'dist'),{recursive:true});
  const template=full?f.args.source:source;if(full)fs.cpSync(template,release,{recursive:true});
  for(const name of ['install.ps1','dependencies.json','dist/runtime.cjs'])fs.copyFileSync(path.join(template,name),path.join(release,name));
  fs.copyFileSync(path.join(template,'dist/install-manifest.json'),path.join(release,'install-manifest.json'));
  if(full){const manifest=read(path.join(release,'install-manifest.json'));for(const entry of manifest.files)entry.sha256=sha(fs.readFileSync(path.join(release,entry.path)));write(path.join(release,'install-manifest.json'),manifest);}
  const manifestSha256=sha(fs.readFileSync(path.join(release,'install-manifest.json')));write(path.join(release,'verified.json'),{revision,manifestSha256});
  const quote=p=>p.replaceAll("'","''"),prefix=`& '${quote(process.execPath)}' -NoProfile -File '${quote(path.join(release,'install.ps1'))}' -StateRoot '${quote(f.state)}' -Action `;
  fs.writeFileSync(path.join(f.state,'recovery-commands.txt'),['Test','Restore -Latest','Restore','Uninstall'].map(a=>prefix+a).join('\n')+'\n');
  return {...(full?{...f.args,source:release}:{}),revision,explicitSource:true,pwsh:process.execPath,guardPwsh:process.execPath,cacheManifestSha256:manifestSha256};
 };
 const consent=()=>({keepLockScreenValueSha256:lockValueSha(chosen),expectedJournalSha256:sha(fs.readFileSync(journalPath))});
 return {...f,file,journalPath,original,chosen,originalHistory,prepare,consent};
}
test('lock-screen acceptance binds exact current value and journal without writing the chosen picture',t=>{
 const f=lockChoiceFixture(t),args={...f.prepare(),...f.consent()},beforeImage=fs.readFileSync(f.file),beforeJournal=fs.readFileSync(f.journalPath);
 const discovered=JSON.parse(f.ok('Plan').stdout);assert.equal(discovered.lockScreenPreservation.valueSha256,args.keepLockScreenValueSha256);assert.equal(discovered.lockScreenPreservation.requested,false);
 const plan=JSON.parse(f.ok('Plan',args).stdout);assert.equal(plan.lockScreenPreservation.newAcceptance,true);assert.deepEqual(fs.readFileSync(f.journalPath),beforeJournal);
 const accepted=f.ok('Update',args);assert.ok(!accepted.stdout.includes(f.chosen.value));assert.deepEqual(fs.readFileSync(f.file),beforeImage);
 const history=f.journal();assert.equal(history.schemaVersion,2);assert.deepEqual(history.transactions[0],f.originalHistory.transactions[0]);assert.equal(history.lockscreenAcceptances[0].status,'committed');f.ok('Test');
 f.ok('Apply',{...args,...f.consent()});assert.equal(f.journal().transactions.length,2);assert.equal(f.journal().lockscreenAcceptances.length,1);
});
for(const bad of ['value','journal','scope','unrelated'])test(`lock-screen acceptance refuses ${bad} consent or drift before changing ownership`,t=>{
 const f=lockChoiceFixture(t),args={...f.prepare(),...f.consent()};
 if(bad==='value')args.keepLockScreenValueSha256='0'.repeat(64);
 if(bad==='journal')fs.appendFileSync(f.journalPath,' ');
 if(bad==='scope')args.explicitSource=false;
 if(bad==='unrelated'){const config=readConfig(f.terminal);config.profiles.defaults.opacity=45;write(f.terminal,config);}
 const journal=fs.readFileSync(f.journalPath),image=fs.readFileSync(f.file),r=f.run('Update',args);assert.notEqual(r.status,0);assert.deepEqual(fs.readFileSync(f.journalPath),journal);assert.deepEqual(fs.readFileSync(f.file),image);assert.equal(f.journal().schemaVersion,1);
});
test('lock-screen acceptance requires verified capable cache and already-saved recovery commands',t=>{
 for(const fault of ['cache','commands']){
  const f=lockChoiceFixture(t),args={...f.prepare(),...f.consent()},journal=fs.readFileSync(f.journalPath),image=fs.readFileSync(f.file);
  if(fault==='cache')fs.appendFileSync(path.join(f.state,'releases',args.revision,'dist/runtime.cjs'),'\n// changed');else fs.writeFileSync(path.join(f.state,'recovery-commands.txt'),'wrong entry');
  assert.notEqual(f.run('Update',args).status,0);assert.deepEqual(fs.readFileSync(f.journalPath),journal);assert.deepEqual(fs.readFileSync(f.file),image);
 }
});
test('committed lock-screen choice survives revision restore and uninstall but later unapproved pictures conflict',t=>{
 const f=lockChoiceFixture(t),args={...f.prepare(),...f.consent()};f.ok('Update',args);
 const next=f.prepare('3'.repeat(40));f.ok('Update',next);f.ok('Restore',{latest:true});assert.equal(f.journal().lifecycleRevision,next.revision);f.ok('Test');assert.deepEqual(read(f.file),f.chosen);
 const unexpected={...f.chosen,value:Buffer.from('unapproved synthetic later picture').toString('base64')};write(f.file,unexpected);assert.equal(f.run('Test').status,1);assert.notEqual(f.run('Apply').status,0);assert.notEqual(f.run('Update',next).status,0);assert.equal(f.run('Restore').status,2);assert.deepEqual(read(f.file),unexpected);
 write(f.file,f.chosen);f.ok('Uninstall');assert.deepEqual(read(f.file),f.chosen);assert.ok(f.journal().transactions.every(x=>x.status==='restored'));assert.deepEqual(f.journal().transactions[0].operations.map(x=>[x.before,x.after]),f.originalHistory.transactions[0].operations.map(x=>[x.before,x.after]));
});
test('pending lock-screen acceptance rolls back without becoming ordinary Test authority',t=>{
 const f=lockChoiceFixture(t),config=readConfig(f.terminal);config.profiles.list.push({guid:'third',commandline:'keep-third'});write(f.terminal,config);
 const args={...f.prepare(),...f.consent()},r=f.run('Update',{...args,failAfter:1});assert.notEqual(r.status,0);assert.deepEqual(read(f.file),f.chosen);
 const history=f.journal();assert.equal(history.schemaVersion,2);assert.equal(history.lockscreenAcceptances[0].status,'rolledback');assert.equal(history.transactions.at(-1).status,'restored');assert.equal(f.run('Test').status,1);
 assert.deepEqual(history.transactions[0],f.originalHistory.transactions[0]);assert.equal(readConfig(f.terminal).profiles.list[2].colorScheme,undefined);
});
test('lock-screen acceptance cannot survive a failed final installation pointer write',t=>{
 const f=lockChoiceFixture(t),args={...f.prepare(),...f.consent()},pointer=path.join(f.state,'current.json');fs.unlinkSync(pointer);fs.mkdirSync(pointer);
 const r=f.run('Update',args);assert.notEqual(r.status,0);assert.deepEqual(read(f.file),f.chosen);assert.equal(f.journal().lockscreenAcceptances[0].status,'rolledback');assert.equal(f.journal().transactions.at(-1).status,'restored');assert.equal(f.run('Test').status,1);
});
test('lock-screen acceptance refuses ambiguous active ownership without changing history',t=>{
 const f=lockChoiceFixture(t),args=f.prepare(),history=f.journal(),first=history.transactions[0];history.transactions.push({...first,id:'synthetic-duplicate-owner',operations:first.operations.filter(op=>op.kind==='lockscreen')});write(f.journalPath,history);
 const before=fs.readFileSync(f.journalPath),r=f.run('Update',{...args,...f.consent()});assert.notEqual(r.status,0);assert.match(r.stderr,/Ambiguous managed lock screen/);assert.deepEqual(fs.readFileSync(f.journalPath),before);assert.deepEqual(read(f.file),f.chosen);
});
test('image change during activation rejects pending lock-screen acceptance without overwriting it',t=>{
 const f=lockChoiceFixture(t),args={...f.prepare(),...f.consent()},later={...f.chosen,value:Buffer.from('synthetic concurrent picture').toString('base64')};
 const r=f.run('Update',{...args,fixtureRefreshSteps:[{files:[{path:'lockscreen.json',value:JSON.stringify(later)}]}]});assert.notEqual(r.status,0);assert.deepEqual(read(f.file),later);assert.equal(f.journal().lockscreenAcceptances[0].status,'rolledback');assert.equal(f.run('Test').status,1);
});
test('pending lock-screen acceptance is not authority for standalone Test or interrupted recovery',t=>{
 const f=lockChoiceFixture(t),args={...f.prepare(),...f.consent()};f.ok('Update',args);
 const history=f.journal();history.transactions.at(-1).status='applying';history.lockscreenAcceptances[0].status='pending';write(f.journalPath,history);
 assert.equal(f.run('Test').status,1);assert.deepEqual(read(f.file),f.chosen);f.ok('Restore',{latest:true});assert.equal(f.journal().lockscreenAcceptances[0].status,'rolledback');assert.deepEqual(read(f.file),f.chosen);assert.equal(f.run('Test').status,1);
});
test('lock-screen acceptance refuses an image without existing theme ownership',t=>{
 const f=fixture(t);f.ok('Apply');const file=path.join(f.state,'fixture/lockscreen.json'),image={exists:true,extension:'.jpg',value:Buffer.from('synthetic unowned').toString('base64')};write(file,image);
 const journal=path.join(f.state,'journal.json'),before=fs.readFileSync(journal),r=f.run('Update',{revision:'2'.repeat(40),explicitSource:true,keepLockScreenValueSha256:lockValueSha(image),expectedJournalSha256:sha(before)});
 assert.notEqual(r.status,0);assert.match(r.stderr,/Lock-screen consent binding differs/);assert.deepEqual(fs.readFileSync(journal),before);assert.deepEqual(read(file),image);
});
for(const invalid of ['unrecoverable','oversized','base64','extension'])test(`lock-screen acceptance refuses ${invalid} current image data`,t=>{
 const f=lockChoiceFixture(t),args={...f.prepare(),...f.consent()};let image={...f.chosen};
 if(invalid==='unrecoverable')image={exists:false};
 if(invalid==='oversized')image.value=Buffer.alloc(20*1024*1024+1,65).toString('base64');
 if(invalid==='base64')image.value='YWJj=';
 if(invalid==='extension')image.extension='.gif';
 write(f.file,image);args.keepLockScreenValueSha256=lockValueSha(image);const before=fs.readFileSync(f.journalPath),r=f.run('Update',args);
 assert.notEqual(r.status,0);assert.match(r.stderr,/Lock-screen consent binding differs/);assert.deepEqual(fs.readFileSync(f.journalPath),before);assert.deepEqual(read(f.file),image);
});

test('ordinary stacked lock-screen ownership follows the latest value and still rejects drift',t=>{
 const f=lockChoiceFixture(t),history=f.journal(),first=history.transactions[0],prior=first.operations.find(op=>op.kind==='lockscreen'),current=prior.after;prior.after={exists:true,extension:'.bmp',value:Buffer.from('synthetic earlier theme wallpaper').toString('base64')};const latest={...prior,after:current,before:prior.after};
 history.transactions.push({id:'synthetic-later-owner',revision:'1'.repeat(40),mode:'Native',status:'applied',operations:[latest],documents:[],mods:[]});write(f.journalPath,history);write(f.file,current);
 f.ok('Plan');assert.equal(JSON.parse(f.ok('Apply').stdout).result,'unchanged');f.ok('Update',{revision:'2'.repeat(40)});
 write(f.file,{...f.chosen,value:Buffer.from('synthetic subsequent drift').toString('base64')});const before=fs.readFileSync(f.journalPath),image=fs.readFileSync(f.file);
 assert.equal(f.run('Test').status,1);assert.match(f.run('Apply').stderr,/Managed setting conflict: Windows lock-screen image/);assert.match(f.run('Update',{revision:'3'.repeat(40)}).stderr,/Managed setting conflict: Windows lock-screen image/);assert.deepEqual(fs.readFileSync(f.journalPath),before);assert.deepEqual(fs.readFileSync(f.file),image);
});

test('lock-screen schema refuses unknown versions and schema1 capable fields before ownership changes',t=>{
 const f=lockChoiceFixture(t),base=fs.readFileSync(f.journalPath),image=fs.readFileSync(f.file);
 const variants=[...[0,3].map(schemaVersion=>({...JSON.parse(base),schemaVersion})),...['lockscreenAcceptances','lifecycleRevision','lifecycleRuntimeSha256','lifecycleManifestSha256'].flatMap(key=>[null,[]].map(value=>({...JSON.parse(base),[key]:value})))];
 for(const history of variants){write(f.journalPath,history);const before=fs.readFileSync(f.journalPath);for(const action of ['Test','Apply']){const r=f.run(action);assert.notEqual(r.status,0);assert.match(r.stderr,/Unsupported recovery journal|Schema1 journal carries/);assert.deepEqual(fs.readFileSync(f.journalPath),before);assert.deepEqual(fs.readFileSync(f.file),image);}}
});

test('lock-screen schema2 refuses missing or malformed receipts and capable digests',t=>{
 const f=lockChoiceFixture(t),args=f.prepare();f.ok('Update',{...args,...f.consent()});const base=fs.readFileSync(f.journalPath),image=fs.readFileSync(f.file);
 for(const fault of ['missing-receipts','object-receipts','missing-runtime','bad-manifest','bad-receipt']){
  const history=JSON.parse(base);if(fault==='missing-receipts')delete history.lockscreenAcceptances;if(fault==='object-receipts')history.lockscreenAcceptances={};if(fault==='missing-runtime')delete history.lifecycleRuntimeSha256;if(fault==='bad-manifest')history.lifecycleManifestSha256='invalid';if(fault==='bad-receipt')history.lockscreenAcceptances[0].valueSha256='0'.repeat(64);
  write(f.journalPath,history);const before=fs.readFileSync(f.journalPath),r=f.run('Test',args);assert.notEqual(r.status,0);assert.match(r.stderr,/Invalid capable recovery binding|Invalid lock-screen acceptance/);assert.deepEqual(fs.readFileSync(f.journalPath),before);assert.deepEqual(fs.readFileSync(f.file),image);
 }
});

test('lock-screen consent Plan and Update never print synthetic image bytes on either stream',t=>{
 const f=lockChoiceFixture(t),args={...f.prepare(),...f.consent()};
 for(const action of ['Plan','Update']){const r=f.ok(action,args);assert.ok(!r.stdout.includes(f.chosen.value));assert.ok(!r.stderr.includes(f.chosen.value));}
});

test('Full lock-screen recovery refuses an older guard boundary before any mutation',t=>{
 const f=lockChoiceFixture(t,true),args=f.prepare();f.ok('Update',{...args,...f.consent()});f.ok('Test',args);
 // A same-revision profile update can be undone without crossing the guard boundary.
 const config=readConfig(f.terminal);config.profiles.list.push({guid:'same-revision',commandline:'keep-profile'});write(f.terminal,config);f.ok('Update',args);f.ok('Restore',{...args,latest:true});f.ok('Test',args);
 const shortcut=path.join(f.state,'fixture/startup/j3w1-theme-guard.lnk'),db=path.join(f.state,'fixture-windhawk.json'),activity=path.join(f.state,'fixture-windhawk-activity.json');
 const files=[f.journalPath,shortcut,f.file,db,activity],before=files.map(p=>fs.readFileSync(p)),r=f.run('Restore',{...args,latest:true});assert.notEqual(r.status,0);assert.match(r.stderr,/Restore-Latest would leave an older Full guard/);files.forEach((p,i)=>assert.deepEqual(fs.readFileSync(p),before[i]));
 f.ok('Uninstall',args);assert.deepEqual(read(f.file),f.chosen);assert.ok(f.journal().transactions.every(tx=>tx.status==='restored'));assert.ok(!fs.existsSync(shortcut));assert.deepEqual(f.journal().transactions[0].operations.map(op=>[op.before,op.after]),f.originalHistory.transactions[0].operations.map(op=>[op.before,op.after]));
});

test('failed Full lock-screen acceptance remains unaccepted and mismatch Guard only disables',t=>{
 const f=lockChoiceFixture(t,true),args=f.prepare(),r=f.run('Update',{...args,...f.consent(),failAfter:1});assert.notEqual(r.status,0);assert.equal(f.journal().lockscreenAcceptances[0].status,'rolledback');assert.equal(f.journal().transactions.at(-1).status,'restored');assert.deepEqual(read(f.file),f.chosen);
 const shortcut=path.join(f.state,'fixture/startup/j3w1-theme-guard.lnk'),legacyLink=JSON.parse(Buffer.from(read(f.journalPath).transactions[0].operations.find(op=>op.path===shortcut).after.value,'base64').toString());assert.ok(legacyLink.arguments.includes(f.args.source));
 const checked=f.run('Test',args);assert.equal(checked.status,1);assert.match(checked.stdout,/Full appearance differs from capable lifecycle/);
 const activity=path.join(f.state,'fixture-windhawk-activity.json'),prior=read(activity).mutations.length,journal=fs.readFileSync(f.journalPath),link=fs.readFileSync(shortcut);
 const guard=f.run('Guard',{...args,fixtureEngineStopped:true,fixtureEngineStartupFails:true});assert.equal(guard.status,2);assert.equal(JSON.parse(guard.stdout).shell,'disabled-incompatible');assert.match(guard.stdout,/Full appearance differs from capable lifecycle/);assert.doesNotMatch(guard.stderr,/Theme engine failed to start/);assert.ok(read(activity).mutations.slice(prior).length>0);assert.ok(read(activity).mutations.slice(prior).every(call=>call[0]==='mod'&&call[1]==='disable'));assert.ok(Object.entries(f.db()).filter(([id])=>id.startsWith('local@')).every(([,mod])=>mod.config.disabled));assert.deepEqual(fs.readFileSync(f.journalPath),journal);assert.deepEqual(fs.readFileSync(shortcut),link);assert.deepEqual(read(f.file),f.chosen);
 f.ok('Update',{...args,...f.consent()});f.ok('Test',args);f.ok('Uninstall',args);assert.deepEqual(read(f.file),f.chosen);
});

test('compact cursors use a black body and canonical red edge with visible bounded hotspots',async()=>{
 const tokens=await defaultTokens();
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
 const tokens=await defaultTokens();
 const variants=(await readJson('ports/windows/dist/windows-settings.json')).stylerVariants['windows-11-start-menu-styler'];
 const all=[...payload.controlStyles,...Object.values(variants).flat()];
 const acrylic=payload.controlStyles.find(t=>t.target==='Border#AcrylicBorder');
 assert.ok(acrylic.styles.includes('CornerRadius=0'));
 assert.ok(acrylic.styles.includes('BorderThickness=1'));
 assert.ok(acrylic.styles.includes('BorderBrush='+tokens['color.border.overlay'].css));
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
 const tokens=await defaultTokens();
 const styles=target=>payload.controlStyles.find(t=>t.target===target)?.styles??[];
 for(const target of ['Grid#NotificationCenterGrid','Grid#CalendarCenterGrid','Grid#ControlCenterRegion']){
  assert.ok(styles(target).includes('Background=#000000'));
  assert.ok(styles(target).includes('CornerRadius=0'));
  assert.ok(styles(target).includes('BorderThickness=1'));
 }
 for(const target of ['Border#ItemOpaquePlating'])
  assert.ok(!styles(target).some(s=>s.startsWith('Border')), 'cards must not acquire nested frames');
 const calendar=styles('CalendarView');
 assert.ok(calendar.includes('CalendarItemForeground='+tokens['color.text.default'].css));
 assert.ok(calendar.includes('TodayForeground='+tokens['color.text.bright'].css));
 for(const {target,styles:values} of payload.controlStyles)for(const value of values){
  if(/^FocusVisual(?:Primary|Secondary)Brush=/.test(value)){
   // Jump-list focus keeps the native focus geometry and behavior; only its
   // brushes change, at the two shared shell item controls requested here.
   assert.ok(['JumpViewUI.SystemItemListViewItem','JumpViewUI.JumpListListViewItem'].includes(target));
   assert.ok(['FocusVisualPrimaryBrush=#e53935','FocusVisualSecondaryBrush=#ffa2a7'].includes(value));
  }else assert.doesNotMatch(value,/^(?:Visibility|Width|Height|MinWidth|MaxWidth|Margin|Padding|FontSize|Text|Glyph|Source|RenderTransform|FocusVisualPrimaryBrush|FocusVisualSecondaryBrush|SelectedDates|IsEnabled)=/);
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
 const tokens=await defaultTokens();
 for(const target of ['Border#ToastBackgroundBorder','Border#ToastBackgroundBorder2']){
  const styles=payload.controlStyles.find(t=>t.target===target).styles;
  for(const value of ['Background=#000000','BorderThickness=1','BorderBrush='+tokens['color.border.overlay'].css,'CornerRadius=0'])assert.ok(styles.includes(value));
 }
});

test('bundled native source is generated, pinned and rejected on tampering',t=>{
 const f=windhawkFixture(t),file=path.join(f.args.source,'dist/j3w1-explorer-native.wh.cpp');
 const text=fs.readFileSync(file,'utf8');
 assert.match(text,/@include explorer.exe/);const outside=explorerFailureRecordContract(text);
 assert.equal((outside.match(/CreateFileW\(/g)||[]).length,1,'Only the module digest reader opens files outside the reviewed writer');
 assert.match(outside,/CreateFileW\(path,GENERIC_READ,FILE_SHARE_READ,nullptr,OPEN_EXISTING,FILE_ATTRIBUTE_NORMAL,nullptr\)/);
 assert.match(text,/GetModuleFileNameW\(module,path/);
 assert.match(text,/MAKELONG\(9818,26100\)/);
 fs.appendFileSync(file,'\n// changed');
 const result=f.run('Apply',f.args);assert.notEqual(result.status,0);assert.match(result.stderr,/Missing verified mod source/);
 assert.deepEqual(f.db(),{});
});

test('preview adapter is pinned and journaled; taskbar edge uses the canonical divider',async t=>{
 const tokens=await defaultTokens();
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
 assert.deepEqual(taskbar.controlStyles.find(t=>t.target==='Rectangle#BackgroundStroke').styles,['Fill='+tokens['color.border.divider'].css]);
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

test('existing caption default-reset policy is confined to the exact Notepad native adapter',async()=>{
 const host=await readJson('ports/windows/host.json');
 assert.equal(host.notepadChrome.existingCaptionRollback,'windows-default');
 for(const [name,key]of [['notepad','notepadChrome'],['paint','paintChrome'],['terminal','terminalChrome']]){
  const emitted=fs.readFileSync(path.join(source,'dist/j3w1-'+name+'-chrome.wh.cpp'),'utf8');
  if(name==='notepad'){
   assert.ok(emitted.includes('bool resetToDefault=false;'));
   assert.ok(emitted.includes('CaptureCaption(window,DWMWA_COLOR_DEFAULT)'));
   assert.ok(emitted.includes('state->resetToDefault=true;'));
   assert.ok(emitted.includes('state->before=requested;state->resetToDefault=false;'));
   assert.ok(emitted.includes('if(!package||!runtime||!enabled.load()||HighContrast())return;'));
   assert.ok(emitted.includes('EnumWindows(ExistingCaptionVisitor,0)'));
   assert.ok(emitted.includes('void Wh_ModAfterInit(){DiscoverExistingCaptions();'));
  }else{
   assert.equal(host[key].existingCaptionRollback,undefined);
   assert.ok(!emitted.includes('DiscoverExistingCaptions'));
   assert.ok(!emitted.includes('resetToDefault'));
  }
 }
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

test('native tab headers keep rose text and distinct hover, selected and disabled states',async()=>{
 const host=await readJson('ports/windows/host.json'),mapping=await readJson('ports/windows/mapping.json');
 const roles={TabViewItemHeaderForeground:'color.text.default',TabViewItemHeaderForegroundPointerOver:'color.text.default',TabViewItemHeaderForegroundPressed:'color.text.default',TabViewItemHeaderForegroundSelected:'color.interaction.selection.text',TabViewItemHeaderForegroundDisabled:'color.text.disabled',TabViewItemHeaderBackgroundPointerOver:'color.interaction.hover.bg',TabViewItemHeaderBackgroundPressed:'color.interaction.pressed.bg',TabViewItemHeaderBackgroundDisabled:'color.interaction.disabled.bg'};
 for(const [key,role]of Object.entries(roles)){
  assert.equal(host.winuiChromeResources[key],role);
  for(const app of ['notepad','paint','terminal'])assert.ok(mapping.mappings[role].includes(app+'-chrome.resource.'+key));
 }
});

test('standard tooltip palettes use shared resources and loaded same-root popup admission',async()=>{
 const host=await readJson('ports/windows/host.json'),mapping=await readJson('ports/windows/mapping.json');
 const roles={ToolTipBackgroundBrush:'color.surface.canvas',ToolTipForegroundBrush:'color.text.default',ToolTipBorderBrush:'color.border.overlay',ToolTipBackground:'color.surface.canvas',ToolTipForeground:'color.text.default'};
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

test('native confirmation dialogs use their own same-root popup and resource contract',async()=>{
 const host=await readJson('ports/windows/host.json'),mapping=await readJson('ports/windows/mapping.json');
 const roles={ContentDialogBackground:'color.surface.canvas',ContentDialogTopOverlay:'color.surface.canvas',ContentDialogForeground:'color.text.default',ContentDialogBorderBrush:'color.border.overlay',ContentDialogSeparatorBorderBrush:'color.border.divider'};
 for(const [key,role]of Object.entries(roles)){
  assert.equal(host.winuiChromeResources[key],role);
  for(const app of ['notepad','paint','terminal'])assert.ok(mapping.mappings[role].includes(app+'-chrome.resource.'+key));
 }
 // The dimming scrim and all behavioral/template resources remain native.
 for(const key of Object.keys(host.winuiChromeResources))if(key.startsWith('ContentDialog'))assert.ok(Object.hasOwn(roles,key),key);
 for(const app of ['notepad','paint','terminal']){
  const emitted=fs.readFileSync(path.join(source,'dist/j3w1-'+app+'-chrome.wh.cpp'),'utf8');
  const prefix=app==='terminal'?'Windows':'Microsoft';
  const admission=emitted.slice(emitted.indexOf('static bool PopupChromeClass(std::wstring_view type) noexcept {'),emitted.indexOf('static bool RemovePopupLoadedEvent'));
  assert.ok(admission.includes('L"'+prefix+'.UI.Xaml.Controls.ContentDialog"'));
  assert.match(emitted,/object.try_as<ContentDialog>\(\)/);
  assert.match(emitted,/ContentDialogTemplateBindingKey\(type,kind\)/);
  assert.match(emitted,/if\(!element.IsLoaded\(\)\)\{WatchPopupLoad\(element\);return;\}/);
  assert.match(emitted,/PopupDiscoveryAdmission[\s\S]*active&&uiThread&&loaded&&sameRoot&&PopupChromeClass/);
 }
});

test('shared popup properties have one baseline across every admitted chrome root',()=>{
 for(const app of ['notepad','paint','terminal']){
  const emitted=fs.readFileSync(path.join(source,'dist/j3w1-'+app+'-chrome.wh.cpp'),'utf8');
  const bridge=emitted.slice(emitted.indexOf('static void Bridge(Root& root,'),emitted.indexOf('static bool RootCandidateClass',emitted.indexOf('static void Bridge(Root& root,')));
  assert.match(bridge,/HasChromeVisualOwner\(uiState->roots[\s\S]*Identity\(prior.object.get\(\),object\)&&Identity\(prior.property,property\)[\s\S]*ReadLocalValue\(property\)/);
  assert.match(bridge,/root.changes.push_back[\s\S]*object.SetValue\(property,match->applied\)/);
  assert.doesNotMatch(bridge,/for\(auto& prior:root.changes\)/);
  assert.match(emitted,/RestoreChromeVisualValue\(\*it,[\s\S]*object.GetValue\(it->property\)/);
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

test('native item presenters require the correct primitive namespace before generation',async()=>{
 for(const invalid of ['ListViewItemPresenter','GridViewItemPresenter@CommonStates','Grid > ListViewItemPresenter#Item',
  'Grid#Root, ListViewItemPresenter','Windows.UI.Xaml.Controls.ListViewItemPresenter','Microsoft.UI.Xaml.Controls.GridViewItemPresenter','muxc:ListViewItemPresenter'])
  assert.throws(()=>validateWindowsStylerTarget(invalid),/Controls\.Primitives/);
 for(const framework of ['Windows','Microsoft'])for(const type of ['ListViewItemPresenter','GridViewItemPresenter']){
  const target=`${framework}.UI.Xaml.Controls.Primitives.${type}`;
  assert.equal(validateWindowsStylerTarget(target),target);
  assert.equal(validateWindowsStylerTarget(`Grid > ${target}#Item@CommonStates`),`Grid > ${target}#Item@CommonStates`);
 }
 for(const [id,framework,types] of [
  ['windows-11-taskbar-styler','Windows',['ListViewItemPresenter']],
  ['windows-11-file-explorer-styler','Microsoft',['ListViewItemPresenter','GridViewItemPresenter']]
 ]){
  const payload=await readJson(`ports/windows/dist/${id}.json`);
  for(const type of types){
   const rule=payload.controlStyles.find(t=>t.target===`${framework}.UI.Xaml.Controls.Primitives.${type}`);
   assert.ok(rule,`${id} must target the native ${type} instead of an unused alias`);
   for(const state of ['PointerOverBackground','PressedBackground','SelectedBackground','SelectedPointerOverBackground','SelectedPressedBackground'])
    assert.ok(rule.styles.some(value=>value.startsWith(state+'=')),`${type} retains ${state}`);
  }
 }
});

test('Paint menu acrylic backing has a bounded public-property owner and all cleanup paths',async()=>{
 const paint=fs.readFileSync(path.join(source,'dist/j3w1-paint-chrome.wh.cpp'),'utf8');
 for(const id of ['notepad','terminal'])assert.ok(!fs.readFileSync(path.join(source,'dist/j3w1-'+id+'-chrome.wh.cpp'),'utf8').includes('struct PopupBacking'));
 assert.match(paint,/PopupBackingAdmission[\s\S]*MenuFlyoutPresenter[\s\S]*active&&uiThread&&loaded&&sameRoot/);
 const apply=paint.slice(paint.indexOf('static void ApplyPopupBacking(Root& root,FrameworkElement const& element) {'),paint.indexOf('static void Refresh(ThreadState& state) noexcept'));
 assert.match(apply,/Identity\(owner.XamlRoot\(\),element.XamlRoot\(\)\)/);
 assert.match(apply,/get_class_name\(native\)!=L"Microsoft.UI.Xaml.Media.DesktopAcrylicBackdrop"/);
 assert.match(apply,/UpdateCompositionBrush[\s\S]*SystemBackdrop\(/);
 assert.match(paint,/if\(!active&&!RestorePaintPopups\(state\)\)/);
 assert.match(paint,/restored=RestorePaintPopups\(state\)&&restored/);
 assert.match(paint,/RestorePaintPopups\(\*uiState\)/);
 assert.equal((paint.match(/if\(!RestorePaintPopups\(state\)\)Log\(239\);Restore\(state.roots\[at\]\);/g)??[]).length,2);
});


test('Paint preopening menu styles retain native structure and join the existing cleanup path',()=>{
 const paint=fs.readFileSync(path.join(source,'dist/j3w1-paint-chrome.wh.cpp'),'utf8');
 for(const id of ['notepad','terminal'])assert.ok(!fs.readFileSync(path.join(source,'dist/j3w1-'+id+'-chrome.wh.cpp'),'utf8').includes('struct PreopenMenuStyle'));
 const prepare=paint.slice(paint.indexOf('static void PreparePaintMenuStyle(Root& root,FrameworkElement const& element) {'),paint.indexOf('static void Refresh(ThreadState& state) noexcept'));
 for(const key of ['MenuFlyoutPresenterBackground','MenuFlyoutItemForeground','MenuFlyoutPresenterBorderBrush'])assert.ok(prepare.includes('brush(L"'+key+'")'));
 assert.match(prepare,/flyout.IsOpen\(\)\|\|flyout.MenuFlyoutPresenterStyle\(\)/);
 assert.match(prepare,/ReadLocalValue\(property\),DependencyProperty::UnsetValue\(\)/);
 assert.match(prepare,/entries.push_back[\s\S]*UpdatePreopenMenuStyle\(entries.back\(\),true\)/);
 assert.match(prepare,/Setter backdrop;backdrop.Property\(MenuFlyoutPresenter::SystemBackdropProperty\(\)\)/);
 assert.match(prepare,/backdrop.Value\(nullptr\);style.Setters\(\).Append\(backdrop\)/);
 assert.ok(!prepare.includes("Setter{MenuFlyoutPresenter::SystemBackdropProperty(),nullptr}"));
 for(const forbidden of ['TemplateProperty','WidthProperty','HeightProperty','PaddingProperty','RequestedThemeProperty','Items().Clear','Items().Append'])assert.ok(!prepare.includes(forbidden));
 assert.match(paint,/const bool styles=RestorePreopenMenuStyles\(state.preopenMenus\);[\s\S]*return RestorePopupBackings\(state.popupBackings\)&&styles/);
 assert.match(paint,/if\(active&&!RestorePreopenMenuStyles\(state.preopenMenus,true\)\)/);
});

test('Quick Settings maps its own media, toggle and slider states without changing actions or content',async()=>{
 const host=await readJson('ports/windows/host.json');
 const mapping=await readJson('ports/windows/mapping.json');
 const tokens=await defaultTokens();
 const id='windows-11-notification-center-styler';
 const config=host.stylers.find(m=>m.id===id);
 const payload=await readJson('ports/windows/dist/'+id+'.json');
 const rules=target=>payload.controlStyles.find(t=>t.target===target)?.styles??[];
 for(const target of ['Grid#MediaTransportControlsRegion','Grid#MediaTransportControlsRoot','Grid#L1Grid','Grid#L1Grid > Border']){
  assert.ok(rules(target).includes('Background=#000000'));
  assert.ok(rules(target).includes('CornerRadius=0'));
 }
 const tile=rules('ControlCenter.PaginatedToggleButton > ContentPresenter#ContentPresenter@CommonStates');
 for(const [state,bg,fg]of [['Normal','color.surface.input','color.text.default'],['PointerOver','color.interaction.hover.bg','color.text.default'],['Pressed','color.interaction.pressed.bg','color.text.default'],['Checked','color.action.primary.bg','color.action.primary.text'],['CheckedPointerOver','color.action.primary.hover-bg','color.action.primary.text'],['CheckedPressed','color.action.primary.pressed-bg','color.action.primary.text'],['Disabled','color.interaction.disabled.bg','color.text.disabled'],['CheckedDisabled','color.interaction.disabled.bg','color.text.disabled']]){
  assert.ok(tile.includes('Background@'+state+'='+tokens[bg].css));
  assert.ok(tile.includes('Foreground@'+state+'='+tokens[fg].css));
 }
 for(const button of ['Windows.UI.Xaml.Controls.Primitives.RepeatButton#PreviousButton','Button#PlayPauseButton','Windows.UI.Xaml.Controls.Primitives.RepeatButton#NextButton','Button#FooterButton','Button#VolumeL2Button']){
  const values=rules(button+' > ContentPresenter#ContentPresenter@CommonStates');
  for(const state of ['Normal','PointerOver','Pressed','Disabled']){
   assert.ok(values.some(value=>value.startsWith('Background@'+state+'=')));
   assert.ok(values.some(value=>value.startsWith('Foreground@'+state+'=')));
  }
 }
 assert.ok(Object.keys(config.resources).length>0);
 assert.ok(Object.keys(config.resources).every(key=>key.startsWith('Slider')));
 for(const [key,role]of Object.entries(config.resources)){
  if(Object.hasOwn(host.winuiChromeResources,key))assert.equal(role,host.winuiChromeResources[key]);
  assert.ok(mapping.mappings[role].includes(id+'.resource.'+key));
  assert.ok(payload.themeResourceVariables.includes(key+'='+windowsStyleValue(key,{type:tokens[role].type,resolved:tokens[role].value})));
  for(const other of host.stylers.filter(mod=>mod.id!==id))assert.ok(!Object.hasOwn(other.resources??{},key));
 }
 for(const slider of ['ControlCenter.AsyncSlider','Slider'])for(const shape of ['Windows.UI.Xaml.Shapes.Rectangle#HorizontalTrackRect','Windows.UI.Xaml.Shapes.Rectangle#HorizontalDecreaseRect','Windows.UI.Xaml.Controls.Primitives.Thumb#HorizontalThumb > Border > Windows.UI.Xaml.Shapes.Ellipse#SliderInnerThumb']){
  const values=rules(slider+' > Grid@CommonStates > * > '+shape);
  for(const state of ['Normal','PointerOver','Pressed','Disabled'])assert.ok(values.some(v=>v.startsWith('Fill@'+state+'=')));
 }
 for(const {target,styles}of payload.controlStyles)for(const value of styles){
  assert.doesNotMatch(value,/^(?:Source|Value|Minimum|Maximum|SmallChange|LargeChange|IsChecked|IsEnabled|Visibility|Width|Height|Margin|Padding|Command|Content|Text|FontSize|RenderTransform)=/);
  assert.doesNotMatch(target,/ThumbnailImage|AlbumTextAndArtContainer/);
 }
});


test('taskbar popup styling preserves icon artwork, commands and native focus',async()=>{
 const host=await readJson('ports/windows/host.json'),mapping=await readJson('ports/windows/mapping.json');
 const tokens=await defaultTokens();
 const id='windows-11-taskbar-styler',config=host.stylers.find(m=>m.id===id);
 const payload=await readJson('ports/windows/dist/'+id+'.json');
 const rules=target=>payload.controlStyles.find(t=>t.target===target)?.styles??[];
 for(const target of ['MenuFlyoutPresenter > Border','Grid#OverflowRootGrid > Border#OverflowFlyoutBackgroundBorder']){
  assert.ok(rules(target).includes('Background='+tokens['color.surface.raised'].css));
  assert.ok(rules(target).includes('BorderBrush='+tokens['color.border.overlay'].css));
  assert.ok(rules(target).includes('CornerRadius=0'));
  assert.ok(rules(target).includes('BorderThickness=1'));
 }
 for(const type of ['MenuFlyoutItem','MenuFlyoutSubItem','ToggleMenuFlyoutItem']){
  const states=rules(type+' > Grid#LayoutRoot@CommonStates');
  for(const state of ['Normal','PointerOver','Pressed','Disabled']){
   assert.ok(states.some(v=>v.startsWith('Background@'+state+'=')));
   assert.ok(!states.some(v=>v.startsWith('Foreground')),'Grid colors text through named menu resources');
  }
 }
 assert.ok(rules('MenuFlyoutSeparator > Windows.UI.Xaml.Shapes.Rectangle').includes('Fill='+tokens['color.border.divider'].css));
 const menuResources=Object.entries(host.resources).filter(([key])=>key.startsWith('MenuFlyout'));
 assert.equal(menuResources.length,27);
 assert.equal(config.resources,undefined,'taskbar consumes the shared menu palette');
 for(const [key,role]of menuResources){
  assert.equal(role,host.winuiChromeResources[key]);
  assert.ok(mapping.mappings[role].includes('windhawk.resource.'+key));
  for(const other of host.stylers)assert.ok(!Object.hasOwn(other.resources??{},key));
 }
 for(const rule of payload.controlStyles)for(const value of rule.styles)
  assert.doesNotMatch(value,/^(?:Source|Glyph|Text|Content|Command|IsEnabled|Visibility|Width|Height|Margin|Padding|RenderTransform|FocusVisualPrimaryBrush|FocusVisualSecondaryBrush|IsTabStop|TabIndex)=/);
});


test('deferred chrome islands retry their original admitted root instead of a document page',()=>{
 for(const app of ['notepad','paint','terminal']){
  const source=fs.readFileSync(path.join('ports/windows/dist','j3w1-'+app+'-chrome.wh.cpp'),'utf8');
  const retry=source.slice(source.indexOf('for(auto it=state.pending.begin()'),source.indexOf('const size_t rootCount'));
  assert.match(retry,/xaml&&xaml.Content\(\)\) \{ObserveRoot\(element\);finished=true;/);
  assert.doesNotMatch(retry,/Track\(xaml.Content/);
  assert.match(source,/auto admitted=SelectChromeRoot\(element,content,FrameworkElement\{nullptr\},/);
 }
});


test('shell popup state rules use brush properties supported by their template parts',async()=>{
 const payload=await readJson('ports/windows/dist/windows-11-taskbar-styler.json');
 for(const rule of payload.controlStyles.filter(t=>/MenuFlyout.* > Grid#LayoutRoot/.test(t.target)))
  for(const style of rule.styles)assert.match(style,/^(?:Background@|CornerRadius=)/);
 const frame=payload.controlStyles.find(t=>t.target==='MenuFlyoutPresenter');
 assert.ok(!frame.styles.some(s=>s.startsWith('Border')),'the template border owns the one popup frame');
 for(const state of ['','PointerOver','Pressed','Disabled'])
  assert.ok(payload.themeResourceVariables.some(s=>s.startsWith('MenuFlyoutItemForeground'+state+'=')));
});


test('production-sized settings apply and recover with every palette value intact',t=>{
 const f=windhawkFixture(t,'protocol'),config=path.join(f.args.source,'dist/fixture-styler.json');
 const payload=read(path.join(source,'dist/windows-11-notification-center-styler.json'));
 write(config,payload);f.ok('Apply',f.args);f.ok('Test',f.args);const baseline=f.db();
 payload.controlStyles[0].styles[0]='Background=#000000';write(config,payload);
 const settingsFile=path.join(f.args.source,'dist/windows-settings.json'),settings=read(settingsFile);
 settings.values['native.accent']='#f73f35';write(settingsFile,settings);
 const failed=f.run('Update',{...f.args,revision:'2'.repeat(40),failAfter:1});
 assert.notEqual(failed.status,0);assert.match(failed.stderr,/Injected partial failure; rollback completed/);
 assert.equal(f.journal().transactions.at(-1).status,'restored');
 assert.deepEqual(f.db(),baseline);f.ok('Test',f.args);
});
