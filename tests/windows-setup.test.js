import { powershell, powershellAvailable, powershellEnvironment } from "./helpers/powershell.mjs";
import { scratchDirSync } from "./helpers/scratch.mjs";
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {repoRoot} from '../scripts/lib/fs.mjs';
const engines=[powershell,...(process.platform==='win32'?['powershell.exe']:[])];
for(const engine of engines){
 // A Node child of pwsh inherits its module paths. Let each engine construct
 // its own defaults so Windows PowerShell 5.1 loads its inbox Utility module.
 const engineEnv=powershellEnvironment();
 const available=powershellAvailable(engine,engineEnv);
 if(!available&&process.env.CI)test(`Windows setup requires ${engine}`,()=>assert.fail('The selected setup test engine must be available in CI'));
 for(const scenario of ['identity','process-context','runtime-selection','modes','download','recovery','legacy-recovery','orchestration','cached-setup','child-failure'])test(`Windows setup ${scenario} (${path.basename(engine)})`,{skip:available?false:'PowerShell unavailable'},t=>{
  const root=scratchDirSync(t, 'j3w1-install-test-');
  const r=spawnSync(engine,['-NoProfile','-NonInteractive','-File',path.join(repoRoot,'tests/helpers/windows-setup-fixture.ps1'),'-Setup',path.join(repoRoot,'ports/windows/install.ps1'),'-Root',root,'-Case',scenario],{encoding:'utf8',timeout:60000,env:{...engineEnv,LOCALAPPDATA:root}});
  assert.equal(r.status,0,r.stdout+'\n'+r.stderr);
  assert.ok(r.stdout.includes(`PASS ${scenario}`));
  if(scenario==='child-failure')assert.ok(r.stdout.includes('FAILED_DIAGNOSTIC'),'Child failure output must reach the caller');
 });
}
