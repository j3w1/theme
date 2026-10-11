import {createHash} from 'node:crypto';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function replaceOnce(source,anchor,replacement) {
 const index=source.indexOf(anchor);
 if(index<0||source.indexOf(anchor,index+anchor.length)>=0)throw Error('Settings adapter source structure differs');
 return source.slice(0,index)+replacement+source.slice(index+anchor.length);
}
// The upstream file remains a separately verified dependency. Only our owned
// discovery boundary is substituted, before compilation; no vendor source or
// binaries are shipped in the repository or changed in place.
export function settingsStylerSource(bytes,patch) {
 if(!patch||! /^[a-f0-9]{64}$/.test(patch.sourceSha256)||digest(bytes)!==patch.sourceSha256)
  throw Error('Settings upstream source digest differs');
 if(typeof patch.replacement!=='string'||!patch.replacement.includes('HWND GetCoreWnd() {')
  ||!patch.replacement.includes('namespace j3w1Settings')||/@[A-Z0-9_]+@/.test(patch.replacement))
  throw Error('Invalid Settings discovery fragment');
 let source=bytes.toString('utf8').replace(/\r\n/g,'\n');
 const begin='HWND GetCoreWnd() {',end='PTP_TIMER g_statsTimer;';
 const start=source.indexOf(begin),finish=source.indexOf(end);
 if(start<0||finish<start||source.indexOf(begin,start+begin.length)>=0||source.indexOf(end,finish+end.length)>=0)
  throw Error('Settings adapter discovery structure differs');
 source=source.slice(0,start)+patch.replacement+'\n\n'+source.slice(finish);
 source=replaceOnce(source,'// @compilerOptions -lcomctl32','// @compilerOptions -lbcrypt -lcomctl32');
 source=replaceOnce(source,'BOOL Wh_ModInit() {\n','BOOL Wh_ModInit() {\n    if (!j3w1Settings::Admit()) return FALSE;\n');
 return Buffer.from(source);
}
