import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {repoRoot} from '../scripts/lib/fs.mjs';
const pwsh=process.env.J3W1_PWSH??(process.platform==='win32'?'pwsh.exe':'pwsh');
const available=spawnSync(pwsh,['--version']).status===0;
if(!available&&process.env.CI)test('font dependency tests require PowerShell',()=>assert.fail('PowerShell 7.4+ is required'));
test('font dependency resumes an interrupted owned install and rejects failed or corrupt downloads',{skip:available?false:'PowerShell unavailable'},t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-font-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const result=spawnSync(pwsh,['-NoProfile','-NonInteractive','-File',path.join(repoRoot,'tests/helpers/windows-font-fixture.ps1'),'-Installer',path.join(repoRoot,'ports/windows/install.ps1'),'-Root',root],{encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
});
