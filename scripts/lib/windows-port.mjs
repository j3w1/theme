/* Windows native artifacts. Host definitions own selectors; tokens own colors.
   Raster assets are deterministic original geometry, not downloaded artwork. */
import { toCss } from './tokens.mjs';
import { stableJson, repoRoot } from './fs.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildSync } from 'esbuild';
import path from 'node:path';

export const CURSOR_NAMES = ['Arrow','Help','AppStarting','Wait','Crosshair','IBeam','NWPen','No','SizeNS','SizeWE','SizeNWSE','SizeNESW','SizeAll','UpArrow','Hand','Pin','Person'];
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
export function windowsArtifacts({manifest,host,resolved}){
 const val=role=>{const t=resolved.get(role);if(!t||role.startsWith('color.primitive.'))throw Error(`Invalid Windows semantic role ${role}`);return toCss(t.type,t.resolved);};
 const artifacts=[],json=(name,x)=>artifacts.push({path:`dist/${name}`,text:stableJson(x)});
 const settings=Object.fromEntries(Object.entries(host.roles).map(([key,role])=>[key,val(role)]));
 const targets=items=>items.map(t=>({target:t.target,styles:Object.entries(t.styles).map(([key,role])=>{
  val(role); // Retain semantic-role validation for every native property.
  return `${key}=${windowsStyleValue(key,resolved.get(role))}`;
 })}));
 const stylerVariants=Object.fromEntries(host.stylers.filter(s=>s.variants).map(s=>[s.id,Object.fromEntries(Object.entries(s.variants).map(([layout,items])=>[layout,targets(items)]))]));
 const native=host.nativeExplorer,id='j3w1-explorer-native';
 const fixed=[...new Set(host.compatibility.map(c=>c.explorerFixedVersion))];
 if(fixed.length!==1 || !/^\d+\.\d+\.\d+\.\d+$/.test(fixed[0]))throw Error('Native Explorer requires one exact fixed executable version');
 const parts=fixed[0].split('.');
 if(parts.some(p=>Number(p)>65535))throw Error('Invalid native Explorer fixed version');
 const nativeSettings=Object.fromEntries(Object.entries(native).filter(([key])=>key!=='version').map(([key,role])=>[key,val(role)]));
 const substitutions={...Object.fromEntries(Object.entries(nativeSettings).map(([key,value])=>[key.toUpperCase(),value])),VERSION:native.version,
  VERSION_MAJOR:parts[0],VERSION_MINOR:parts[1],VERSION_BUILD:parts[2],VERSION_REVISION:parts[3]};
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
  RULES_JSON:JSON.stringify(Object.entries(preview.syntax).map(([token,role])=>({token,foreground:val(role).slice(1)}))),
  MEDIA_CSS:`@media (forced-colors: none) { html, body, #container { background: ${val('color.surface.canvas')}; color: ${val('color.text.default')}; } }`};
 const previewSource=readFileSync(path.join(repoRoot,'ports/windows/src/j3w1-powertoys-preview.wh.cpp.in'),'utf8').replace(/@([A-Z0-9_]+)@/g,(_,key)=>{if(!(key in previewSubs))throw Error(`Unknown preview source placeholder ${key}`);return previewSubs[key];});
 artifacts.push({path:`dist/${previewId}.wh.cpp`,text:previewSource});
 // Windhawk stores checkbox settings as integer strings (1/0).
 json(`${previewId}.json`,{enabled:1});
 bundledMods.push({id:previewId,version:preview.version,path:`dist/${previewId}.wh.cpp`,sha256:createHash('sha256').update(previewSource).digest('hex')});
 json('windows-settings.json',{schemaVersion:1,version:manifest.version,values:settings,stylerVariants,bundledMods,compatibility:host.compatibility,limitations:host.limitations});
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
  const payload={theme:'',controlStyles,themeResourceVariables:Object.entries(host.resources).map(([key,role])=>`${key}=${val(role)}`)};
  json(`${mod.id}.json`,payload);
 }
 artifacts.push({path:'dist/j3w1-wallpaper.bmp',bytes:wallpaperBmp(val('color.surface.desktop'))});
 for(const name of CURSOR_NAMES)artifacts.push({path:`dist/j3w1-${name.toLowerCase()}.cur`,bytes:cursorFile(name,val(host.roles['cursor.foreground']),val(host.roles['cursor.outline']))});
 artifacts.push({path:'dist/j3w1.theme',text:`; Generated j3w1 ${manifest.version}\n[Theme]\nDisplayName=j3w1\n[Control Panel\\Colors]\nBackground=${rgb(val('color.surface.desktop')).join(' ')}\n[VisualStyles]\nPath=%ResourceDir%\\Themes\\Aero\\Aero.msstyles\nColorStyle=NormalColor\nSize=NormalSize\nColorizationColor=0XFF${val('color.border.active').slice(1).toUpperCase()}\nSystemMode=Dark\nAppMode=Dark\n`});
 const runtime=buildSync({entryPoints:[path.join(repoRoot,'ports/windows/src/runtime.mjs')],bundle:true,mainFields:['module','main'],platform:'node',target:'node24',format:'cjs',write:false,legalComments:'eof'}).outputFiles[0].text;
 artifacts.push({path:'dist/runtime.cjs',text:runtime});
 const files=artifacts.map(a=>({path:a.path,sha256:createHash('sha256').update(a.bytes??a.text).digest('hex')}));
 for(const name of ['install.ps1','setup.ps1','adapter.ps1','lockscreen.ps1','dependencies.json','host.json'])files.push({path:name,sha256:createHash('sha256').update(readFileSync(path.join(repoRoot,'ports/windows',name))).digest('hex')});
 json('install-manifest.json',{schemaVersion:1,version:manifest.version,files});
 return artifacts;
}
