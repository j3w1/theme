/* PowerToys owns Markdown parsing, document bytes and WebView restrictions.
   This renderer supplies token-derived CSS and reversible backing at pinned public boundaries. */
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {repoRoot} from './fs.mjs';
import {toCss} from './tokens.mjs';

export function windowsMarkdownArtifacts(host,resolved){
 const md=host.markdownPreview,id='j3w1-powertoys-markdown';
 if(!md||!/^\d+\.\d+\.\d+$/.test(md.version))throw Error('Markdown requires a version');
 if(!/^\d+\.\d+\.\d+\.\d+$/.test(md.hostVersion))throw Error('Invalid Markdown hostVersion');
 for(const key of ['hostSha256','controlSha256','helperSha256'])if(!/^[a-f0-9]{64}$/.test(md[key]))throw Error('Invalid Markdown '+key);
 const native=md.nativeHost;
 if(!native||!/^\d+\.\d+\.\d+\.\d+$/.test(native.version)||native.version.split('.').some(p=>Number(p)>65535)
  ||! /^[a-f0-9]{64}$/.test(native.sha256)||! /^[a-f0-9]{64}$/.test(native.explorerSha256))throw Error('Invalid native preview host identity');
 if(!Array.isArray(md.webviewBoundaries)||!md.webviewBoundaries.length||md.webviewBoundaries.length>8)throw Error('Markdown requires bounded reviewed WebView identities');
 const versions=new Set(),digests=new Set();
 for(const pin of md.webviewBoundaries) {
  if(!/^\d+\.\d+\.\d+\.\d+$/.test(pin.version)||versions.has(pin.version)||!/^[a-f0-9]{64}$/.test(pin.sha256)||digests.has(pin.sha256))throw Error('Invalid or duplicate Markdown WebView identity');
  versions.add(pin.version);digests.add(pin.sha256);
  const backgroundKeys=['backgroundGetterRva','backgroundSetterRva','controllerCloseRva'];
  if(backgroundKeys.some(key=>key in pin)&&!backgroundKeys.every(key=>Number.isSafeInteger(pin[key])&&pin[key]>0&&pin[key]<=0x7fffffff))throw Error('Incomplete Markdown controller boundary');
  const offsets=['navigateToStringRva','navigateRva',...backgroundKeys].map(key=>pin[key]).filter(value=>value!==undefined);
  if(new Set(offsets).size!==offsets.length)throw Error('Overlapping Markdown controller boundary');
  for(const key of ['navigateToStringRva','navigateRva'])if(!Number.isSafeInteger(pin[key])||pin[key]<=0||pin[key]>0x7fffffff)throw Error('Invalid Markdown WebView '+key);
 }
 if(!Array.isArray(md.headers)||md.headers.length!==4)throw Error('Markdown requires the four reviewed headers');
 const variants=new Set();
 for(const pin of md.headers){
  if(!['dark','light'].includes(pin.theme)||typeof pin.localImages!=='boolean'||variants.has(`${pin.theme}:${pin.localImages}`))throw Error('Invalid Markdown header variant');
  variants.add(`${pin.theme}:${pin.localImages}`);
  for(const key of ['length','styleOffset','styleLength'])if(!Number.isSafeInteger(pin[key])||pin[key]<=0||pin[key]>32768)throw Error('Invalid Markdown header extent');
  if(pin.styleOffset+pin.styleLength>pin.length||!/^[a-f0-9]{64}$/.test(pin.sha256))throw Error('Invalid Markdown header identity');
 }
 const render=(template,substitutions)=>{
  const text=template.replace(/@([A-Z0-9_]+)@/g,(_,key)=>{if(!(key in substitutions))throw Error(`Unknown Markdown placeholder ${key}`);return substitutions[key];});
  if(/@[A-Z0-9_]+@/.test(text))throw Error('Unresolved Markdown placeholder');
  return text;
 };
 const roles=Object.fromEntries(Object.entries(md.roles).map(([key,role])=>{
  const token=resolved.get(role);if(!token||role.startsWith('color.primitive.'))throw Error(`Invalid Markdown semantic role ${role}`);
  return [key,toCss(token.type,token.resolved)];
 }));
 const css=render(readFileSync(path.join(repoRoot,'ports/windows/src/markdown-theme.css.in'),'utf8'),roles).replace(/\r?\n/g,'');
 if(/[^\x20-\x7e]/.test(css))throw Error('Markdown CSS must be ASCII for the same-length boundary');
 if(md.headers.some(pin=>css.length>pin.styleLength))throw Error('Markdown CSS exceeds admitted extent');
 const rgb=role=>{const color=roles[role];if(!/^#[a-f0-9]{6}$/i.test(color))throw Error('Loading surface requires an opaque semantic color');return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(',');};
 const subs={LOADING_BACKGROUND:rgb('CANVAS'),LOADING_FOREGROUND:rgb('PROSE'),VERSION:md.version,HEADER_PINS:md.headers.map(p=>` {${p.length},${p.styleOffset},${p.styleLength},"${p.sha256}"},`).join('\n'),
  PALETTE_CSS:css,HOST_SHA256:md.hostSha256,CONTROL_SHA256:md.controlSha256,HELPER_SHA256:md.helperSha256,
  PREVIEW_HOST_SHA256:native.sha256,PREVIEW_EXPLORER_SHA256:native.explorerSha256,
  BROWSER_ENV:'FF'+roles.CANVAS.slice(1).toUpperCase(),
  BROWSER_PINS:md.webviewBoundaries.map(p=>' {"'+p.sha256+'",'+['navigateToStringRva','navigateRva','backgroundGetterRva','backgroundSetterRva','controllerCloseRva'].map(key=>'0x'+(p[key]??0).toString(16)).join(',')+'}, // '+p.version).join('\n'),
  BROWSER_DISPATCH:md.webviewBoundaries.map((_,i)=>'  case '+i+':return HookBoundary<'+i+'>(module);').join('\n')};
 if(css.includes(')MD"'))throw Error('Invalid Markdown CSS literal delimiter');
 const source=render(readFileSync(path.join(repoRoot,`ports/windows/src/${id}.wh.cpp.in`),'utf8').replace('@PREVIEW_LOADING@',readFileSync(path.join(repoRoot,'ports/windows/src/preview-loading.cpp.in'),'utf8')).replace('@PREVIEW_HOST_BACKGROUND@',readFileSync(path.join(repoRoot,'ports/windows/src/preview-host-background.cpp.in'),'utf8')).replace('@MARKDOWN_BACKGROUND@',readFileSync(path.join(repoRoot,'ports/windows/src/markdown-background.cpp.in'),'utf8')),subs);
 return {id,version:md.version,source,css};
}
