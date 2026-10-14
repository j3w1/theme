import { powershell as pwsh, powershellAvailable } from "./helpers/powershell.mjs";
import { scratchDirSync } from "./helpers/scratch.mjs";
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {repoRoot} from '../scripts/lib/fs.mjs';

const available=powershellAvailable();
if(!available&&process.env.CI)test('font dependency tests require PowerShell',()=>assert.fail('PowerShell 7.4+ is required'));
test('font dependency resumes an interrupted owned install and rejects failed or corrupt downloads',{skip:available?false:'PowerShell unavailable'},t=>{
 const root=scratchDirSync(t, 'j3w1-font-test-');
 const result=spawnSync(pwsh,['-NoProfile','-NonInteractive','-File',path.join(repoRoot,'tests/helpers/windows-font-fixture.ps1'),'-Installer',path.join(repoRoot,'ports/windows/install.ps1'),'-Root',root],{encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
});
