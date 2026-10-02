import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {repoRoot} from '../scripts/lib/fs.mjs';

// Build complete DLLs with the pinned compiler and engine import library.
// Object compilation cannot detect missing Windows import libraries.
const root=process.env.J3W1_WINDHAWK_ROOT;
const options={skip:process.platform!=='win32'?'Native Windows required':!root?'Set J3W1_WINDHAWK_ROOT to the pinned portable toolchain':false};
const source=path.join(repoRoot,'ports/windows');
const settings=JSON.parse(fs.readFileSync(path.join(source,'dist/windows-settings.json'),'utf8'));
function toolchain(){
 const cli=spawnSync(path.join(root,'windhawk-cli.exe'),['--version'],{encoding:'utf8',windowsHide:true,timeout:10000});
 assert.equal(cli.status,0,cli.stderr);
 assert.equal(cli.stdout.trim(),'windhawk-cli 2.0.0-alpha.6');
 return {compiler:path.join(root,'Compiler/bin/clang++.exe'),library:path.join(root,'Engine/2.0.0/64/windhawk.lib')};
}
function libraries(file){
 const metadata=fs.readFileSync(file,'utf8').match(/^\/\/ @compilerOptions (.+)$/m)?.[1];
 assert.ok(metadata,`Missing compiler options: ${path.basename(file)}`);
 const flags=metadata.trim().split(/\s+/);
 for(const flag of flags)assert.match(flag,/^-l[a-z0-9]+$/i,'Only explicit import-library flags are supported by this gate');
 return flags;
}
function compile(compiler,args){
 const result=spawnSync(compiler,['--target=x86_64-w64-mingw32','-std=c++23','-O2','-DUNICODE','-D_UNICODE','-DWINVER=0x0A00','-D_WIN32_WINNT=0x0A00',...args],{encoding:'utf8',windowsHide:true,timeout:120000});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
}
for(const mod of settings.bundledMods)test(`complete native DLL link: ${mod.id}`,options,t=>{
 const tools=toolchain(),folder=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-native-link-'));
 t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const file=path.join(source,mod.path),output=path.join(folder,mod.id+'.dll');
 compile(tools.compiler,['-shared','-DWH_MOD',tools.library,file,'-include','windhawk_api.h',...libraries(file),'-o',output]);
 assert.ok(fs.statSync(output).size>0);
 // Deliberately do not load or inject the produced DLL into an application.
});
for(const [name,mod] of [
 ['caption','j3w1-explorer-native'],['scroll-paint','j3w1-explorer-native'],
 ['explorer-interaction','j3w1-explorer-native'],['marquee-paint','j3w1-explorer-native'],
 ['preview-paint','j3w1-powertoys-preview'],['markdown','j3w1-powertoys-markdown'],
])test(`native offscreen regression: ${name}`,options,t=>{
 const tools=toolchain(),folder=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-native-regression-'));
 t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const file=path.join(repoRoot,`tests/windows-${name}-native.cpp`),output=path.join(folder,name+'.exe');
 // Synthetic test executables run outside Windhawk's ModsRuntime. Link their
 // C++ runtime statically so they do not depend on Windhawk's DLL search path.
 compile(tools.compiler,['-static',file,...libraries(path.join(source,`dist/${mod}.wh.cpp`)),'-o',output]);
 const result=spawnSync(output,[],{encoding:'utf8',windowsHide:true,timeout:30000});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
});

for(const [id,define] of [['j3w1-calculator','1'],['j3w1-notepad-native','0']])test('native app worker shutdown: '+id,options,t=>{
 const tools=toolchain(),folder=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-native-lifetime-'));
 t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const file=path.join(repoRoot,'tests/windows-app-lifetime-native.cpp'),output=path.join(folder,id+'.exe');
 compile(tools.compiler,['-static','-DJ3W1_TEST_CALCULATOR='+define,file,...libraries(path.join(source,'dist/'+id+'.wh.cpp')),'-o',output]);
 for(const state of ['exit-active','exit-completed','unload','reconfigure']){
  const result=spawnSync(output,[state],{encoding:'utf8',windowsHide:true,timeout:15000});
  assert.equal(result.status,0,state+': '+result.stdout+'\n'+result.stderr);
 }
});

test('native Notepad editor preservation',options,t=>{
 const tools=toolchain(),folder=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-native-editor-'));
 t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const output=path.join(folder,'notepad-editor.exe');
 compile(tools.compiler,['-static',path.join(repoRoot,'tests/windows-notepad-editor-native.cpp'),...libraries(path.join(source,'dist/j3w1-notepad-native.wh.cpp')),'-ldwrite','-o',output]);
 const result=spawnSync(output,[],{encoding:'utf8',windowsHide:true,timeout:30000});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
});

test('native Calculator clock and ownership restoration',options,t=>{
 const tools=toolchain(),folder=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-native-calculator-'));
 t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const output=path.join(folder,'calculator-ownership.exe');
 compile(tools.compiler,['-static',path.join(repoRoot,'tests/windows-calculator-ownership-native.cpp'),...libraries(path.join(source,'dist/j3w1-calculator.wh.cpp')),'-o',output]);
 for(const state of ['clock-lifecycle','animation-frame','resource-ownership']){
  const result=spawnSync(output,[state],{encoding:'utf8',windowsHide:true,timeout:15000});
  assert.equal(result.status,0,state+': '+result.stdout+'\n'+result.stderr);
 }
});


test('native Notepad chrome ownership and worker shutdown',options,t=>{
 const tools=toolchain(),folder=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-native-notepad-chrome-'));
 t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const output=path.join(folder,'notepad-chrome.exe');
 compile(tools.compiler,['-static',path.join(repoRoot,'tests/windows-notepad-chrome-native.cpp'),...libraries(path.join(source,'dist/j3w1-notepad-chrome.wh.cpp')),'-o',output]);
 for(const state of ['partial-init','state-ownership','resource-ownership','cleanup-retry','notepad-chrome-admission','exit-active','exit-completed','unload','reconfigure']){
  const result=spawnSync(output,[state],{encoding:'utf8',windowsHide:true,timeout:15000});
  assert.equal(result.status,0,state+': '+result.stdout+'\n'+result.stderr);
 }
});
