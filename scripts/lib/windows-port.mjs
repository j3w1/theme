import {folderIconFile,folderGeometry} from './windows-folder-icon.mjs';
/* Windows native artifacts. Host definitions own selectors; tokens own colors.
   Raster assets are deterministic original geometry, not downloaded artwork. */
import { toCss } from './tokens.mjs';
import {windowsMarkdownArtifacts} from './windows-markdown.mjs';
import { stableJson, repoRoot } from './fs.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildSync } from 'esbuild';
import path from 'node:path';

export const CURSOR_NAMES = ['Arrow','Help','AppStarting','Wait','Crosshair','IBeam','NWPen','No','SizeNS','SizeWE','SizeNWSE','SizeNESW','SizeAll','UpArrow','Hand','Pin','Person'];
// Search permits only these non-token presentation choices. Colors and
// geometry still resolve from approved roles; arbitrary CSS/JS is not accepted.
const webPresentation = new Map([
 ['border-style',new Set(['none','solid'])],
 ['box-sizing',new Set(['border-box'])],
 ['box-shadow',new Set(['none'])],
 ['background-image',new Set(['none'])],
 ['background-color',new Set(['inherit'])],
 ['outline-style',new Set(['dashed','solid'])],
 ['border-bottom-style',new Set(['solid'])],
 ['content',new Set(['none'])],
]);
export function windowsWebContentStyles(items,val) {
 return items.map(t=>{
  if(typeof t.target!=='string'||/[{};]/.test(t.target))throw Error('Invalid Search selector');
  const styles=Object.entries(t.styles).map(([key,role])=>{
   if(!/^[a-z]+(?:-[a-z]+)*$/.test(key))throw Error('Invalid Search style property');
   const value=val(role);
   return `${key}: ${key==='scrollbar-color'?`${value} ${val('color.surface.canvas')}`:value} !important`;
  });
  for(const [key,value] of Object.entries(t.presentation??{})){
   if(!webPresentation.get(key)?.has(value))throw Error(`Unsupported Search presentation: ${key}`);
   // Replace only the host's decorative selection pill with the result frame.
   // Never admit content removal on controls, labels or arbitrary pseudo-elements.
   if(key==='content'&&t.target!=='.leftPill::before')throw Error('Unsupported Search decoration target');
   // Fit the reserved result frame inside the host width without assigning a
   // width, padding, position, overflow mode or sizing for unrelated controls.
   if(key==='box-sizing'&&t.target!=='.suggestion, .suggContainer')throw Error('Unsupported Search box-sizing target');
   styles.push(`${key}: ${value} !important`);
  }
  return {target:t.target,styles};
 });
}
const rgb = hex => [1,3,5].map(i => Number.parseInt(hex.slice(i,i+2),16));
export const wallpaperBmp = hex => {
  const b=Buffer.alloc(58); b.write('BM'); b.writeUInt32LE(58,2); b.writeUInt32LE(54,10);
  b.writeUInt32LE(40,14); b.writeInt32LE(1,18); b.writeInt32LE(1,22); b.writeUInt16LE(1,26); b.writeUInt16LE(24,28); b.writeUInt32LE(4,34);
  const [r,g,blue]=rgb(hex); b[54]=blue;b[55]=g;b[56]=r;return b;
};
function cursorImage(name,size,foreground,outline) {
  const scale=size/32, rgba=Buffer.alloc(size*size*4), mask=Buffer.alloc(Math.ceil(size/32)*4*size);
  const pixels=new Set(), add=(x,y)=>{if(x>=0&&x<32&&y>=0&&y<32)pixels.add(`${x},${y}`);};
  const line=(x0,y0,x1,y1,width=1)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++)for(let a=0;a<width;a++)for(let z=0;z<width;z++)add(Math.round(x0+(x1-x0)*i/(n||1))+a,Math.round(y0+(y1-y0)*i/(n||1))+z);};
  const fillPolygon=polygon=>{
    for(let y=0;y<32;y++)for(let x=0;x<32;x++){
      let inside=false;
      for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
        const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
        if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
      }
      if(inside)add(x,y);
    }
  };
  // Small arrowhead with a shallow notch and no projecting tail.
  const arrow=()=>fillPolygon([[2,2],[2,22],[8,16],[19,16]]);
  let hot=[2,2];
  if(['Arrow','Help','AppStarting'].includes(name)){arrow();if(name==='Help'){line(19,7,24,7,2);line(24,7,24,12,2);line(24,12,20,16,2);line(20,20,20,20,2);}if(name==='AppStarting'){for(let y=19;y<28;y++)for(let x=21;x<29;x++)if(x===21||x===28||y===19||y===27)add(x,y);}}
  else if(name==='IBeam'){hot=[15,15];line(15,4,15,27,2);line(10,4,21,4,2);line(10,27,21,27,2);}
  else if(name==='Crosshair'){hot=[15,15];line(15,2,15,29);line(2,15,29,15);}
  else if(name.startsWith('Size')){hot=[15,15];const dirs=name==='SizeNS'?[[0,1]]:name==='SizeWE'?[[1,0]]:name==='SizeNWSE'?[[1,1]]:name==='SizeNESW'?[[1,-1]]:[[1,0],[0,1]];for(const [dx,dy] of dirs){line(15-dx*11,15-dy*11,15+dx*11,15+dy*11,2);for(const s of [-1,1]){const x=15+s*dx*11,y=15+s*dy*11;line(x,y,x-s*dx*5-dy*4,y-s*dy*5+dx*4,2);line(x,y,x-s*dx*5+dy*4,y-s*dy*5-dx*4,2);}}}
  else if(name==='Wait'||name==='No'){hot=[15,15];for(let y=3;y<29;y++)for(let x=3;x<29;x++){const d=Math.hypot(x-15,y-15);if(d>9&&d<12)add(x,y);}if(name==='No')line(7,7,23,23,2);else{line(15,7,15,15,2);line(15,15,21,18,2);}}
  else if(name==='Hand'){
    hot=[11,3];
    // Extended index finger, stepped curled fingers, bent thumb and rounded palm.
    fillPolygon([[10,14],[10,5],[11,3],[13,3],[14,5],[14,12],
      [15,10],[17,10],[18,12],[20,11],[22,12],[22,14],[24,13],
      [26,15],[26,22],[25,25],[23,28],[14,28],[11,26],[8,22],
      [5,19],[5,17],[7,15],[9,16],[11,19]]);
  }
  else if(name==='NWPen'){hot=[4,27];line(5,26,23,5,4);line(4,27,8,25,2);}
  else if(name==='UpArrow'){hot=[15,3];line(15,4,15,28,3);line(15,4,7,13,2);line(15,4,23,13,2);}
  else if(name==='Pin'){hot=[15,27];line(15,12,15,27,2);for(let y=4;y<15;y++)for(let x=9;x<22;x++)if(Math.hypot(x-15,y-9)<6)add(x,y);}
  else {hot=[15,4];for(let y=3;y<11;y++)for(let x=11;x<20;x++)if(Math.hypot(x-15,y-7)<4)add(x,y);line(15,12,15,21,3);line(7,14,23,14,2);line(15,21,8,28,2);line(15,21,22,28,2);}
  const fg=rgb(foreground),edge=rgb(outline);
  // Keep DPI image sizes and Windows accessibility preferences; shrink the artwork.
  const artworkScale=.65, inset=2;
  // Map occupied source pixels forward so thin crosshair strokes cannot vanish.
  const compactPixels=new Set([...pixels].map(p=>p.split(',').map(v=>Math.round(inset+Number(v)*artworkScale)).join(',')));
  // Thin red creases separate the curled fingers from the black palm.
  const detailPixels=new Set(name==='Hand'?[...Array(6)].flatMap((_,i)=>[[17,14+i],[21,15+i]])
    .map(p=>p.map(v=>Math.round(inset+v*artworkScale)).join(',')):[]);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const a=Math.floor(x/scale),b=Math.floor(y/scale),inside=compactPixels.has(`${a},${b}`);
    const border=!inside&&[-1,0,1].some(dx=>[-1,0,1].some(dy=>compactPixels.has(`${a+dx},${b+dy}`)));
    const o=((size-1-y)*size+x)*4;
    if(inside||border){const c=inside&&!detailPixels.has(`${a},${b}`)?fg:edge;rgba[o]=c[2];rgba[o+1]=c[1];rgba[o+2]=c[0];rgba[o+3]=255;}
    else mask[(size-1-y)*Math.ceil(size/32)*4+(x>>3)]|=128>>(x%8);
  }
  const dib=Buffer.alloc(40);dib.writeUInt32LE(40);dib.writeInt32LE(size,4);dib.writeInt32LE(size*2,8);dib.writeUInt16LE(1,12);dib.writeUInt16LE(32,14);dib.writeUInt32LE(rgba.length+mask.length,20);
  return {data:Buffer.concat([dib,rgba,mask]),hot:hot.map(v=>Math.round((inset+v*artworkScale)*scale))};
}
export function cursorFile(name,foreground,outline){
 const sizes=[32,48,64,96],head=Buffer.alloc(6+16*sizes.length);head.writeUInt16LE(2,2);head.writeUInt16LE(sizes.length,4);let offset=head.length;const data=[];
 sizes.forEach((size,i)=>{const img=cursorImage(name,size,foreground,outline),n=6+16*i;head[n]=size;head[n+1]=size;head.writeUInt16LE(img.hot[0],n+4);head.writeUInt16LE(img.hot[1],n+6);head.writeUInt32LE(img.data.length,n+8);head.writeUInt32LE(offset,n+12);offset+=img.data.length;data.push(img.data);});return Buffer.concat([head,...data]);
}
// XAML uses unitless device-independent pixels and a native family name, not CSS.
export function windowsStyleValue(property, token) {
 const key=property.split('@')[0];
 if(token.type==='color'){
  const {colorSpace,hex,alpha=1}=token.resolved;
  if(colorSpace!=='srgb'||!/^#[0-9a-f]{6}$/i.test(hex)||!Number.isFinite(alpha)||alpha<0||alpha>1)
   throw Error('Windows color requires a valid sRGB color and alpha');
  // Native XAML accepts ARGB hex, not CSS rgb(). Alpha is an 8-bit channel.
  return alpha===1?hex:`#${Math.round(alpha*255).toString(16).padStart(2,'0')}${hex.slice(1)}`;
 }
 if(key==='CornerRadius'||key==='BorderThickness'){
  if(token.type!=='dimension'||token.resolved.unit!=='px')throw Error(`Windows ${key} requires a pixel dimension`);
  return String(token.resolved.value);
 }
 if(key==='FontFamily'){
  if(token.type!=='fontFamily')throw Error('Windows FontFamily requires a font-family token');
  return Array.isArray(token.resolved)?token.resolved[0]:token.resolved;
 }
 return toCss(token.type,token.resolved);
}
// The pinned stylers expand bare classes into Controls, never Controls.Primitives.
// These native presenters must use their actual framework-qualified class names.
export function validateWindowsStylerTarget(target) {
 if(/(?:^|[>,]\s*)(?:(?:Windows|Microsoft)\.UI\.Xaml\.Controls\.|muxc:)?(?:ListViewItemPresenter|GridViewItemPresenter)(?=[#@\[\s,>]|$)/.test(target))
  throw Error('Windows item presenter requires its framework-qualified Controls.Primitives class');
 return target;
}
export function windowsArtifacts({manifest,host,resolved}){
 const val=role=>{const t=resolved.get(role);if(!t||role.startsWith('color.primitive.'))throw Error(`Invalid Windows semantic role ${role}`);return toCss(t.type,t.resolved);};
 const artifacts=[],json=(name,x)=>artifacts.push({path:`dist/${name}`,text:stableJson(x)});
 const settings=Object.fromEntries(Object.entries(host.roles).map(([key,role])=>[key,val(role)]));
 const targets=items=>items.map(t=>({target:validateWindowsStylerTarget(t.target),styles:Object.entries(t.styles).map(([key,role])=>{
  val(role); // Retain semantic-role validation for every native property.
  return `${key}=${windowsStyleValue(key,resolved.get(role))}`;
 })}));
 const stylerVariants=Object.fromEntries(host.stylers.filter(s=>s.variants).map(s=>[s.id,Object.fromEntries(Object.entries(s.variants).map(([layout,items])=>[layout,targets(items)]))]));
 const native=host.nativeExplorer,id='j3w1-explorer-native';
 const fixed=[...new Set(host.compatibility.map(c=>c.explorerFixedVersion))];
 if(fixed.length!==1 || !/^\d+\.\d+\.\d+\.\d+$/.test(fixed[0]))throw Error('Native Explorer requires one exact fixed executable version');
 const parts=fixed[0].split('.');
 if(parts.some(p=>Number(p)>65535))throw Error('Invalid native Explorer fixed version');
 const nativeSettings=Object.fromEntries(Object.entries(native).filter(([key])=>key!=='version').map(([key,role])=>{
  val(role);
  return [key,windowsStyleValue(key,resolved.get(role))];
 }));
 const moduleParts=Object.fromEntries(Object.entries(host.nativeExplorerModules).map(([key,version])=>{
  if(!/^\d+\.\d+\.\d+\.\d+$/.test(version)||version.split('.').some(p=>Number(p)>65535))throw Error('Invalid native Explorer module version');
  return [key,version.split('.')];
 }));
 const moduleSubs=Object.fromEntries(['FRAME','DUI','COMCTL','WIC','SHELLCOMMON'].flatMap(key=>{
  if(!moduleParts[key])throw Error(`Missing native Explorer module ${key}`);
  return ['MAJOR','MINOR','BUILD','REVISION'].map((field,i)=>[`${key}_${field}`,moduleParts[key][i]]);
 }));
 const folderSubs=Object.fromEntries(Object.entries(folderGeometry).map(([name,points])=>['FOLDER_'+name.toUpperCase(),points.map(([x,y])=>'{'+x+','+y+'}').join(',')]));
 const folderSource=readFileSync(path.join(repoRoot,'ports/windows/src/folder-glyph.cpp.in'),'utf8').replace(/@([A-Z0-9_]+)@/g,(_,key)=>{if(!(key in folderSubs))throw Error('Unknown folder source placeholder '+key);return folderSubs[key];});
 const moduleDigests=Object.fromEntries(['WIC','SHELLCOMMON'].map(key=>{
  const digest=host.nativeExplorerModuleDigests?.[key];
  if(typeof digest!=='string'||! /^[a-f0-9]{64}$/.test(digest))throw Error('Missing native Explorer module digest '+key);
  return [key+'_SHA256',digest];
 }));
 const bitmapSource=readFileSync(path.join(repoRoot,'ports/windows/src/folder-bitmap.cpp.in'),'utf8').replace(/@([A-Z0-9_]+)@/g,(_,key)=>{
  const values={...moduleSubs,...moduleDigests};if(!(key in values))throw Error('Unknown folder bitmap placeholder '+key);return values[key];
 });
 const substitutions={FOLDER_BITMAP:bitmapSource,FOLDER_RENDERER:folderSource,...Object.fromEntries(Object.entries(nativeSettings).map(([key,value])=>[key.toUpperCase(),value])),VERSION:native.version,
  VERSION_MAJOR:parts[0],VERSION_MINOR:parts[1],VERSION_BUILD:parts[2],VERSION_REVISION:parts[3],...moduleSubs};
 const nativeSource=readFileSync(path.join(repoRoot,'ports/windows/src/j3w1-explorer-native.wh.cpp.in'),'utf8').replace(/@([A-Z0-9_]+)@/g,(_,key)=>{if(!(key in substitutions))throw Error(`Unknown native source placeholder ${key}`);return substitutions[key];});
 artifacts.push({path:`dist/${id}.wh.cpp`,text:nativeSource});
 json(`${id}.json`,nativeSettings);
 const bundledMods=[{id,version:native.version,path:`dist/${id}.wh.cpp`,sha256:createHash('sha256').update(nativeSource).digest('hex')}];
 const preview=host.monacoPreview,previewId='j3w1-powertoys-preview';
 if(!/^\d+\.\d+\.\d+\.\d+$/.test(preview.hostVersion)||! /^[a-f0-9]{64}$/.test(preview.templateSha256))throw Error('Preview requires exact host and template identities');
 const previewParts=preview.hostVersion.split('.');
 if(previewParts.some(p=>Number(p)>65535))throw Error('Invalid preview fixed version');
 const previewColors=Object.fromEntries(Object.entries(preview.colors).map(([key,role])=>[key,val(role)]));
 const previewSubs={VERSION:preview.version,VERSION_MAJOR:previewParts[0],VERSION_MINOR:previewParts[1],VERSION_BUILD:previewParts[2],VERSION_REVISION:previewParts[3],
  TEMPLATE_SHA256:preview.templateSha256,COLORS_JSON:JSON.stringify(previewColors),
  LOADING_BACKGROUND:rgb(val(preview.loading.background)).join(','),
  LOADING_FOREGROUND:rgb(val(preview.loading.foreground)).join(','),
  PROGRESS_TRACK:rgb(val(preview.loading.track)).join(','),PROGRESS_FILL:rgb(val(preview.loading.fill)).join(','),
  PROGRESS_BORDER:rgb(val(preview.loading.border)).join(','),
  RULES_JSON:JSON.stringify(Object.entries(preview.syntax).map(([token,role])=>({token,foreground:val(role).slice(1)}))),
  MEDIA_CSS:`@media (forced-colors: none) { html, body, #container { background: ${val('color.surface.canvas')}; color: ${val('color.text.default')}; } }`};
 const previewSource=readFileSync(path.join(repoRoot,'ports/windows/src/j3w1-powertoys-preview.wh.cpp.in'),'utf8').replace('@PREVIEW_LOADING@',readFileSync(path.join(repoRoot,'ports/windows/src/preview-loading.cpp.in'),'utf8')).replace(/@([A-Z0-9_]+)@/g,(_,key)=>{if(!(key in previewSubs))throw Error(`Unknown preview source placeholder ${key}`);return previewSubs[key];});
 artifacts.push({path:`dist/${previewId}.wh.cpp`,text:previewSource});
 // Windhawk stores checkbox settings as integer strings (1/0).
 json(`${previewId}.json`,{enabled:1});
 bundledMods.push({id:previewId,version:preview.version,path:`dist/${previewId}.wh.cpp`,sha256:createHash('sha256').update(previewSource).digest('hex')});
 const calculator=host.calculator,calculatorId='j3w1-calculator';
 const calculatorPackageVersion=calculator.packageFullName.split('_')[1];
 if(calculator.buttonStyleTarget!==
  'CalculatorApp.Controls.CalculatorButton, CalculatorApp, Version='+calculatorPackageVersion+', Culture=neutral, PublicKeyToken=null')
  throw Error('Calculator requires the exact assembly-qualified native button style');
 if(!/^Microsoft\.WindowsCalculator_\d+\.\d+\.\d+\.\d+_x64__8wekyb3d8bbwe$/.test(calculator.packageFullName))throw Error('Calculator requires an exact package identity');
 const calculatorRules=Object.entries(calculator.resources).map(([key,role])=>{
  const navigation=/^NavigationViewItem(?:Background|Foreground)(?:PointerOver|Pressed|Disabled|Checked(?:PointerOver|Pressed|Disabled)?|Selected(?:PointerOver|Pressed|Disabled)?)?$/.test(key)
   ||key==='NavigationViewItemSeparatorForeground';
  const toggle=/^ToggleButton(?:Background|Foreground|BorderBrush)(?:PointerOver|Pressed|Disabled|(?:Checked|Indeterminate)(?:PointerOver|Pressed|Disabled)?)?$/.test(key);
  const button=/^(?:Button|SubtleButton)(?:Background|Foreground|BorderBrush)(?:PointerOver|Pressed|Disabled)?$/.test(key)
   ||/^SplitButton(?:Background|Foreground|BorderBrush)(?:PointerOver|Pressed|Disabled|Checked(?:PointerOver|Pressed|Disabled)?)?$/.test(key)
   ||['SplitButtonForegroundSecondary','SplitButtonForegroundSecondaryPressed','SplitButtonBorderBrushDivider','SplitButtonBorderBrushCheckedDivider','SplitButtonInAppBarUnfocusedPointerOver','DropDownButtonForegroundSecondary','DropDownButtonForegroundSecondaryPointerOver','DropDownButtonForegroundSecondaryPressed'].includes(key);
  if((!navigation&&!toggle&&!button&&!/^[A-Za-z][A-Za-z0-9]+(?:Brush(?:PointerOver|Pressed|Disabled)?|Background|Foreground)$/.test(key))||key.startsWith('Equation'))throw Error('Invalid Calculator UI brush');
  const [r,g,b]=rgb(val(role));
  return `    {L"${key}",{255,${r},${g},${b}},L"${role}"},`;
 }).join('\n');
 const calculatorSubs={CHROME_COLOR_STATE:readFileSync(path.join(repoRoot,'ports/windows/src/chrome-color-state.cpp.in'),'utf8').replaceAll('Microsoft::UI::Xaml','Windows::UI::Xaml'),VERSION:calculator.version,PACKAGE_FULL_NAME:calculator.packageFullName,BUTTON_STYLE_TARGET:calculator.buttonStyleTarget,RESOURCE_RULES:calculatorRules};
 const calculatorSource=readFileSync(path.join(repoRoot,'ports/windows/src/j3w1-calculator.wh.cpp.in'),'utf8').replace(/@([A-Z0-9_]+)@/g,(_,key)=>{if(!(key in calculatorSubs))throw Error(`Unknown Calculator source placeholder ${key}`);return calculatorSubs[key];});
 artifacts.push({path:`dist/${calculatorId}.wh.cpp`,text:calculatorSource});
 json(`${calculatorId}.json`,{enabled:1});
 bundledMods.push({id:calculatorId,version:calculator.version,path:`dist/${calculatorId}.wh.cpp`,sha256:createHash('sha256').update(calculatorSource).digest('hex')});
 const notepad=host.notepadNative,notepadId='j3w1-notepad-native';
 if(!/^Microsoft\.WindowsNotepad_\d+\.\d+\.\d+\.\d+_x64__8wekyb3d8bbwe$/.test(notepad.packageFullName)||! /^[a-f0-9]{64}$/.test(notepad.editorSha256))throw Error('Notepad editor requires exact package and binary identities');
 const notepadSubs={VERSION:notepad.version,PACKAGE_FULL_NAME:notepad.packageFullName,EDITOR_SHA256:notepad.editorSha256};
 for(const [key,role] of Object.entries(notepad.roles))notepadSubs[key]='RGB('+rgb(val(role)).join(',')+')';
 const notepadSource=readFileSync(path.join(repoRoot,'ports/windows/src/j3w1-notepad-native.wh.cpp.in'),'utf8').replace(/@([A-Z0-9_]+)@/g,(_,key)=>{if(!(key in notepadSubs))throw Error('Unknown Notepad source placeholder '+key);return notepadSubs[key];});
 artifacts.push({path:'dist/'+notepadId+'.wh.cpp',text:notepadSource});json(notepadId+'.json',{enabled:1});
 bundledMods.push({id:notepadId,version:notepad.version,path:'dist/'+notepadId+'.wh.cpp',sha256:createHash('sha256').update(notepadSource).digest('hex')});

 for(const [chrome,chromeId,label,exe,packagePattern,nativeClass,rootClasses,clsid] of [
  [host.notepadChrome,'j3w1-notepad-chrome','Notepad','Notepad.exe',/^Microsoft\.WindowsNotepad_\d+\.\d+\.\d+\.\d+_x64__8wekyb3d8bbwe$/,'Notepad',['NotepadXamlUI.MainMenuBar','NotepadXamlUI.StatusBar','NotepadXamlUI.TabsBar','NotepadXamlUI.NotepadSettingsPage'],'0x9f12b9c4,0x7b9d,0x489f,{0x8e,0x31,0x4a,0x81,0x10,0x32,0x6b,0xc4}'],
  [host.paintChrome,'j3w1-paint-chrome','Paint','mspaint.exe',/^Microsoft\.Paint_\d+\.\d+\.\d+\.\d+_x64__8wekyb3d8bbwe$/,'MSPaintApp',['PaintUI.AppChrome','PaintUI.Ribbon','PaintUI.RibbonControl','PaintUI.LayersPanel'],'0x7cbd47c2,0x78b3,0x439d,{0x82,0xe8,0x7c,0x19,0xac,0x25,0x13,0xd4}'],
  [host.terminalChrome,'j3w1-terminal-chrome','Terminal','WindowsTerminal.exe',/^Microsoft\.WindowsTerminal_\d+\.\d+\.\d+\.\d+_x64__8wekyb3d8bbwe$/,'CASCADIA_HOSTING_WINDOW_CLASS',['TerminalApp.TabRowControl'],'0xa9309bc1,0x0b98,0x4a64,{0x9a,0x7d,0x1c,0x91,0xf3,0x8d,0x26,0x0e}'],
 ]) {
  const legacy=chromeId==='j3w1-terminal-chrome';
  if(legacy&&(!/^Microsoft\.UI\.Xaml\.2\.8_\d+\.\d+\.\d+\.\d+_x64__8wekyb3d8bbwe$/.test(chrome.controlsPackage)||! /^[a-f0-9]{64}$/.test(chrome.controlsSha256)))throw Error('Terminal chrome requires its exact WinUI controls identity');
  if(!packagePattern.test(chrome.packageFullName)||(!legacy&&!/^Microsoft\.WindowsAppRuntime\.2_\d+\.\d+\.\d+\.\d+_x64__8wekyb3d8bbwe$/.test(chrome.runtimePackage))||! /^[a-f0-9]{64}$/.test(chrome.runtimeSha256))throw Error(label+' chrome requires exact package/runtime identities');
  if(chromeId==='j3w1-notepad-chrome'&&chrome.packageFullName!==notepad.packageFullName)throw Error('Notepad chrome/editor package mismatch');
  const chromeRules=Object.entries(host.winuiChromeResources).map(([key,role])=>{
   if(!/^[A-Za-z][A-Za-z0-9]*$/.test(key))throw Error('Unsafe WinUI chrome resource key');
   const token=resolved.get(role);val(role);
   return ' {L"'+key+'",{'+Math.round((token.resolved.alpha??1)*255)+','+rgb(val(role)).join(',')+'},L"'+role+'"},';
  }).join('\n');
  if(!/^[a-f0-9]{64}$/.test(chrome.diagnosticsBridgeSha256))throw Error(label+' root discovery requires an exact diagnostics bridge identity');
  const discoverySubs={XAML_MODULE:legacy?'Windows.UI.Xaml.dll':'Microsoft.UI.Xaml.dll',DIAGNOSTICS_BRIDGE_SHA256:chrome.diagnosticsBridgeSha256,DIAGNOSTICS_CLSID:clsid};
  const rootDiscovery=readFileSync(path.join(repoRoot,'ports/windows/src/winui-root-discovery.cpp.in'),'utf8').replace(/@([A-Z0-9_]+)@/g,(_,key)=>{if(!(key in discoverySubs))throw Error('Unknown WinUI discovery placeholder '+key);return discoverySubs[key];});
  const publicCaptionNames=['BackgroundColor','ForegroundColor','ButtonBackgroundColor','ButtonForegroundColor','ButtonHoverBackgroundColor','ButtonHoverForegroundColor','ButtonPressedBackgroundColor','ButtonPressedForegroundColor','InactiveBackgroundColor','InactiveForegroundColor','ButtonInactiveBackgroundColor','ButtonInactiveForegroundColor'];
  // Calling the public caption path, even with only button colors, revives
  // a native title over Notepad's custom tabs on the recorded package.
  // Notepad therefore declines this entire path; Paint retains its contract.
  const customCaption=chromeId==='j3w1-notepad-chrome';
  const admittedCaptionNames=customCaption||legacy?[]:publicCaptionNames;
  if(JSON.stringify(Object.keys(chrome.captionColors??{}))!==JSON.stringify(admittedCaptionNames))throw Error(label+' requires its exact ordered public caption-color contract');
  const captionSlots=admittedCaptionNames.map(key=>publicCaptionNames.indexOf(key));
  const captionRules=publicCaptionNames.map(key=>{const role=chrome.captionColors[key];if(!role)return '  {}, // '+key+' : host-owned';const token=resolved.get(role);val(role);return '  {'+Math.round((token.resolved.alpha??1)*255)+','+rgb(val(role)).join(',')+'}, // '+key+' : '+role;}).join('\n');
  const publicSource=readFileSync(path.join(repoRoot,'ports/windows/src/winui-caption.cpp.in'),'utf8').replaceAll('@ADAPTER_ID@',chromeId).replaceAll('@NATIVE_CLASS@',nativeClass).replace('@CAPTION_RULES@',captionRules).replaceAll('@CAPTION_SLOT_COUNT@',String(captionSlots.length)).replace('@CAPTION_SLOTS@',captionSlots.join(',')).replace('@CAPTION_CUSTOM_CONTENT@',String(customCaption));
  const [publicDeclarations,publicImplementation]=publicSource.split('// IMPLEMENTATION');
  let backingSource=readFileSync(path.join(repoRoot,'ports/windows/src/window-backdrop.cpp.in'),'utf8').replaceAll('@ADAPTER_ID@',chromeId).replaceAll('@NATIVE_CLASS@',nativeClass).replaceAll('@NATIVE_CAPTION_BACKDROP@',String(customCaption));
  let tabDeclarations='',tabImplementation='';
  if(customCaption){
   const tabSource=readFileSync(path.join(repoRoot,'ports/windows/src/tab-island-backdrop.cpp.in'),'utf8');
   [tabDeclarations,tabImplementation]=tabSource.split('// IMPLEMENTATION');
   if(!tabDeclarations||!tabImplementation||/@[A-Z0-9_]+@/.test(tabSource))throw Error('Invalid Notepad tab-island backing template');
  }
  const tabSubs={TAB_ISLAND_SLOT:customCaption?' weak_ref<Microsoft::UI::Content::ContentIsland> island;bool islandTarget=false;':'',TAB_ISLAND_DECLARATIONS:tabDeclarations,TAB_ISLAND_IMPLEMENTATION:tabImplementation,TAB_ISLAND_RESTORE_GUARD:customCaption?'TabIslandState(entry)!=0&&(TabIslandState(entry)!=1||':'',TAB_ISLAND_RESTORE_CLOSE:customCaption?')':'',TAB_ISLAND_REFRESH_GUARD:customCaption?'  if(entry.islandTarget){auto targetState=TabIslandState(entry);if(targetState==0){RemovePropW(entry.window,windowBackingProperty);it=state.windowBackings.erase(it);continue;}if(targetState!=1){complete=false;++it;continue;}}\n':'',TAB_ISLAND_OBSERVE:customCaption?'\n ObserveTabIslandBacking(element);':''};
  backingSource=backingSource.replace(/@([A-Z0-9_]+)@/g,(_,key)=>{if(!(key in tabSubs))throw Error('Unknown tab-island placeholder '+key);return tabSubs[key];});
  const [backingDeclarations,backingImplementation]=backingSource.split('// IMPLEMENTATION');
  if(!backingDeclarations||!backingImplementation||/@[A-Z0-9_]+@/.test(backingSource))throw Error('Invalid '+label+' window backing template');
  if(!publicDeclarations||!publicImplementation||/@[A-Z0-9_]+@/.test(publicSource))throw Error('Invalid '+label+' public caption template');
  const publicSubs={PUBLIC_CAPTION_INCLUDE:'\n#include <winrt/Microsoft.UI.Windowing.h>',PUBLIC_CAPTION_DECLARATIONS:publicDeclarations,PUBLIC_CAPTION_IMPLEMENTATION:publicImplementation,PUBLIC_CAPTION_STATE:'std::vector<std::unique_ptr<PublicCaption>> publicCaptions; ',PUBLIC_CAPTION_REFRESH:' ApplyPublicCaptions(state);\n',PUBLIC_CAPTION_RESTORE:' bool publicRestored=RestorePublicCaptions(state);\n',PUBLIC_CAPTION_RESTORE_RESULT:'&&publicRestored',PUBLIC_CAPTION_NATIVE_EXCLUSION:customCaption?'':'&&false',PUBLIC_CAPTION_DWM_BYPASS:'publicCaptionWrite||',NATIVE_CAPTION_BACKDROP:String(customCaption)};
  if(legacy)Object.assign(publicSubs,{PUBLIC_CAPTION_INCLUDE:'',PUBLIC_CAPTION_DECLARATIONS:'static thread_local bool publicCaptionWrite=false;\n',PUBLIC_CAPTION_IMPLEMENTATION:'',PUBLIC_CAPTION_STATE:'',PUBLIC_CAPTION_REFRESH:'',PUBLIC_CAPTION_RESTORE:'',PUBLIC_CAPTION_RESTORE_RESULT:'',PUBLIC_CAPTION_NATIVE_EXCLUSION:'&&false',NATIVE_CAPTION_BACKDROP:'false'});
  if(customCaption)publicSubs.PUBLIC_CAPTION_INCLUDE+='\n#include <winrt/Microsoft.UI.Content.h>';
  publicSubs.PUBLIC_CAPTION_STATE=publicSubs.PUBLIC_CAPTION_STATE.trimEnd();
  const chromeSubs={...tabSubs,LEGACY_XAML:legacy?'1':'0',XAML_MODULE:legacy?'Windows.UI.Xaml.dll':'Microsoft.UI.Xaml.dll',CHROME_COLOR_STATE:readFileSync(path.join(repoRoot,'ports/windows/src/chrome-color-state.cpp.in'),'utf8'),...publicSubs,ADAPTER_ID:chromeId,APP_LABEL:label,APP_EXE:exe,NATIVE_CLASS:nativeClass,ROOT_CLASSES:rootClasses.map(c=>'L"'+c+'"').join(','),ROOT_DISCOVERY:rootDiscovery,VERSION:chrome.version,PACKAGE_FULL_NAME:chrome.packageFullName,RUNTIME_PACKAGE:chrome.runtimePackage??'',RUNTIME_SHA256:chrome.runtimeSha256,RESOURCE_RULES:chromeRules};
  Object.assign(chromeSubs,{CONTROLS_PACKAGE:chrome.controlsPackage??'',CONTROLS_SHA256:chrome.controlsSha256??'',WINDOW_BACKING_DECLARATIONS:backingDeclarations,WINDOW_BACKING_IMPLEMENTATION:backingImplementation});
  let popupDeclarations='',popupImplementation='';
  const popupBacking=chromeId==='j3w1-paint-chrome';
  if(popupBacking){
   const popupSource=readFileSync(path.join(repoRoot,'ports/windows/src/popup-backdrop.cpp.in'),'utf8');
   [popupDeclarations,popupImplementation]=popupSource.split('// IMPLEMENTATION');
   if(!popupDeclarations||!popupImplementation||/@[A-Z0-9_]+@/.test(popupSource))throw Error('Invalid Paint popup backing template');
  }
  Object.assign(chromeSubs,{POPUP_BACKING_DECLARATIONS:popupDeclarations,POPUP_BACKING_IMPLEMENTATION:popupImplementation,POPUP_BACKING_STATE:popupBacking?' std::vector<PopupBacking> popupBackings;\n':'',POPUP_BACKING_APPLY:popupBacking?'  if(auto element=object.try_as<FrameworkElement>())ApplyPopupBacking(root,element);\n':'',POPUP_BACKING_INACTIVE:popupBacking?' if(!active&&!RestorePopupBackings(state.popupBackings))Log(239);\n':'',POPUP_BACKING_RESTORE:popupBacking?' restored=RestorePopupBackings(state.popupBackings)&&restored;\n':'',POPUP_BACKING_FAILURE:popupBacking?'if(!RestorePopupBackings(state.popupBackings))Log(239);':'',POPUP_BACKING_DISCOVERY_FAILURE:popupBacking?'    if(!RestorePopupBackings(uiState->popupBackings))Log(239);\n':''});
  let chromeSource=readFileSync(path.join(repoRoot,'ports/windows/src/winui-chrome.cpp.in'),'utf8').replace(/@([A-Z0-9_]+)@/g,(_,key)=>{if(!(key in chromeSubs))throw Error('Unknown WinUI chrome source placeholder '+key);return chromeSubs[key];});
  if(legacy)chromeSource=chromeSource.replaceAll('Microsoft::UI::Xaml','Windows::UI::Xaml').replaceAll('L"Microsoft.UI.Xaml.','L"Windows.UI.Xaml.');
  if(legacy)chromeSource=chromeSource.replace('type==L"Windows.UI.Xaml.Controls.SplitButton"||type==L"Windows.UI.Xaml.Controls.SplitButton"','type==L"Microsoft.UI.Xaml.Controls.SplitButton"||type==L"Windows.UI.Xaml.Controls.SplitButton"');
  artifacts.push({path:'dist/'+chromeId+'.wh.cpp',text:chromeSource});json(chromeId+'.json',{enabled:1});
  bundledMods.push({id:chromeId,version:chrome.version,path:'dist/'+chromeId+'.wh.cpp',sha256:createHash('sha256').update(chromeSource).digest('hex')});
 }
 const markdown=windowsMarkdownArtifacts(host,resolved);
 artifacts.push({path:`dist/${markdown.id}.wh.cpp`,text:markdown.source},{path:'dist/markdown-theme.css',text:markdown.css});
 json(`${markdown.id}.json`,{enabled:1});
 bundledMods.push({id:markdown.id,version:markdown.version,path:`dist/${markdown.id}.wh.cpp`,sha256:createHash('sha256').update(markdown.source).digest('hex')});
 const startup=host.settingsStartup;
 const dependencies=JSON.parse(readFileSync(path.join(repoRoot,'ports/windows/dependencies.json'),'utf8'));
 if(startup.sourceSha256!==dependencies.mods.find(m=>m.id==='windows-11-settings-styler')?.sha256
  ||!['executableSha256','xamlSha256'].every(key=>/^[a-f0-9]{64}$/.test(startup[key])))throw Error('Settings startup requires exact source and binary identities');
 const replacement=readFileSync(path.join(repoRoot,'ports/windows/src/settings-core-window.cpp.in'),'utf8')
  .replace('@EXECUTABLE_SHA256@',startup.executableSha256).replace('@XAML_SHA256@',startup.xamlSha256);
 const settingsStartup={sourceSha256:startup.sourceSha256,replacement};
 json('windows-settings.json',{schemaVersion:1,version:manifest.version,values:settings,stylerVariants,bundledMods,settingsStartup,compatibility:host.compatibility,limitations:host.limitations});
 const ansi=['black','red','green','yellow','blue','purple','cyan','white','brightBlack','brightRed','brightGreen','brightYellow','brightBlue','brightPurple','brightCyan','brightWhite'];
 const scheme={name:'j3w1',foreground:val('color.terminal.fg'),background:val('color.surface.canvas'),cursorColor:val('color.terminal.cursor'),selectionBackground:val('color.code.selection-bg')};ansi.forEach((k,i)=>scheme[k]=val(`color.terminal.ansi.${i}`));
 json('terminal-fragment.json',{schemes:[scheme]});
 json('terminal-theme.json',{name:'j3w1',tab:{background:val('color.surface.chrome'),unfocusedBackground:val('color.surface.chrome'),showCloseButton:'always'},tabRow:{background:val('color.surface.chrome'),unfocusedBackground:val('color.surface.chrome')},window:{applicationTheme:'dark',useMica:false}});
 json('fancyzones-layouts.json',{'custom-layouts':[
 {uuid:'{15E5C3A1-92E4-40FC-A9B0-B24F580CF501}',name:'j3w1 50-50',type:'grid',info:{rows:1,columns:2,'rows-percentage':[10000],'columns-percentage':[5000,5000],'cell-child-map':[[0,1]],'show-spacing':true,spacing:8,'sensitivity-radius':20}},
 {uuid:'{15E5C3A1-92E4-40FC-A9B0-B24F580CF502}',name:'j3w1 65-35',type:'grid',info:{rows:1,columns:2,'rows-percentage':[10000],'columns-percentage':[6500,3500],'cell-child-map':[[0,1]],'show-spacing':true,spacing:8,'sensitivity-radius':20}},
 {uuid:'{15E5C3A1-92E4-40FC-A9B0-B24F580CF503}',name:'j3w1 thirds',type:'grid',info:{rows:1,columns:3,'rows-percentage':[10000],'columns-percentage':[3333,3334,3333],'cell-child-map':[[0,1,2]],'show-spacing':true,spacing:8,'sensitivity-radius':20}},
 {uuid:'{15E5C3A1-92E4-40FC-A9B0-B24F580CF504}',name:'j3w1 main and stack',type:'grid',info:{rows:2,columns:2,'rows-percentage':[5000,5000],'columns-percentage':[6500,3500],'cell-child-map':[[0,1],[0,2]],'show-spacing':true,spacing:8,'sensitivity-radius':20}}
 ]});
 for(const mod of host.stylers){
  const controlStyles=targets(mod.targets);
  const payload={theme:'',controlStyles,themeResourceVariables:Object.entries({...host.resources,...mod.resources}).map(([key,role])=>{val(role);return `${key}=${windowsStyleValue(key,resolved.get(role))}`;})};
  if(mod.webContentStyles)payload.webContentStyles=windowsWebContentStyles(mod.webContentStyles,val);
  if(mod.webContentStyles)payload.webContentCustomJs='';
  json(`${mod.id}.json`,payload);
 }
 artifacts.push({path:'dist/j3w1-wallpaper.bmp',bytes:wallpaperBmp(val('color.surface.desktop'))});
 for(const name of CURSOR_NAMES)artifacts.push({path:`dist/j3w1-${name.toLowerCase()}.cur`,bytes:cursorFile(name,val(host.roles['cursor.foreground']),val(host.roles['cursor.outline']))});
 for(const open of [false,true])artifacts.push({path:`dist/j3w1-folder${open?'-open':''}.ico`,bytes:folderIconFile(val('color.action.primary.bg'),val('color.border.active'),open)});
 const themeAssets='%LOCALAPPDATA%\\j3w1-theme\\windows\\assets';
 const themeCursors=CURSOR_NAMES.map(name=>`${name}=${themeAssets}\\j3w1-${name.toLowerCase()}.cur`).join('\n');
 artifacts.push({path:'dist/j3w1.theme',text:`; Generated j3w1 ${manifest.version}\n[Theme]\nDisplayName=j3w1\n[Control Panel\\Colors]\nBackground=${rgb(val('color.surface.desktop')).join(' ')}\n[Control Panel\\Desktop]\nWallpaper=${themeAssets}\\j3w1-wallpaper.bmp\nTileWallpaper=0\nWallpaperStyle=10\n[Control Panel\\Cursors]\n${themeCursors}\nDefaultValue=j3w1\n[VisualStyles]\nPath=%ResourceDir%\\Themes\\Aero\\Aero.msstyles\nColorStyle=NormalColor\nSize=NormalSize\nColorizationColor=0XFF${val('color.border.active').slice(1).toUpperCase()}\nAutoColorization=0\nSystemMode=Dark\nAppMode=Dark\n[MasterThemeSelector]\nMTSM=DABJDKT\n`});
 const runtime=buildSync({entryPoints:[path.join(repoRoot,'ports/windows/src/runtime.mjs')],bundle:true,mainFields:['module','main'],platform:'node',target:'node24',format:'cjs',write:false,legalComments:'eof'}).outputFiles[0].text;
 artifacts.push({path:'dist/runtime.cjs',text:runtime});
 const files=artifacts.map(a=>({path:a.path,sha256:createHash('sha256').update(a.bytes??a.text).digest('hex')}));
 for(const name of ['install.ps1','adapter.ps1','lockscreen.ps1','dependencies.json','host.json'])files.push({path:name,sha256:createHash('sha256').update(readFileSync(path.join(repoRoot,'ports/windows',name))).digest('hex')});
 json('install-manifest.json',{schemaVersion:1,version:manifest.version,files});
 return artifacts;
}
