import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {repoRoot} from '../scripts/lib/fs.mjs';
const engines=[process.env.J3W1_PWSH||'pwsh',...(process.platform==='win32'?['powershell.exe']:[])];
for(const engine of engines){
 const available=spawnSync(engine,['-NoProfile','-NonInteractive','-Command','$PSVersionTable.PSVersion.ToString()'],{encoding:'utf8'}).status===0;
 for(const scenario of ['identity','modes','download','recovery','orchestration','child-failure'])test(`Windows setup ${scenario} (${path.basename(engine)})`,{skip:available?false:'PowerShell unavailable'},t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-setup-test-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const r=spawnSync(engine,['-NoProfile','-NonInteractive','-File',path.join(repoRoot,'tests/helpers/windows-setup-fixture.ps1'),'-Setup',path.join(repoRoot,'ports/windows/setup.ps1'),'-Root',root,'-Case',scenario],{encoding:'utf8',timeout:60000,env:{...process.env,LOCALAPPDATA:root}});
  assert.equal(r.status,0,r.stdout+'\n'+r.stderr);
  assert.ok(r.stdout.includes(`PASS ${scenario}`));
 });
}
