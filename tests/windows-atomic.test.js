import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {replaceDurableTemp,writeDurableTemp} from '../scripts/lib/host-install/files.mjs';
test('Windows transient sharing refusal retries atomic replacement with fresh path validation',t=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-atomic-'));t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const target=path.join(folder,'journal.json');fs.writeFileSync(target,'before');const temp=writeDurableTemp(target,'after');
 let calls=0,validations=0,sleeps=0;
 replaceDurableTemp(temp,target,{platform:'win32',beforeAttempt:()=>validations++,sleep:()=>sleeps++,rename:(a,b)=>{
  if(++calls<3){assert.equal(fs.readFileSync(target,'utf8'),'before');throw Object.assign(Error('shared reader'),{code:'EPERM'});}
  fs.renameSync(a,b);
 }});
 assert.equal(fs.readFileSync(target,'utf8'),'after');assert.equal(validations,3);assert.equal(sleeps,2);assert.ok(!fs.existsSync(temp));
});
test('permanent replacement and path-policy failures retain the old file and never delete it',t=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'j3w1-atomic-'));t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const target=path.join(folder,'journal.json');fs.writeFileSync(target,'before');const temp=writeDurableTemp(target,'after');
 let calls=0;
 assert.throws(()=>replaceDurableTemp(temp,target,{platform:'win32',attempts:3,sleep:()=>{},rename:()=>{calls++;throw Object.assign(Error('denied'),{code:'EACCES'});}}),/denied/);
 assert.equal(calls,3);assert.equal(fs.readFileSync(target,'utf8'),'before');assert.ok(fs.existsSync(temp));
 calls=0;assert.throws(()=>replaceDurableTemp(temp,target,{platform:'win32',beforeAttempt:()=>{throw Error('reparse refused');},rename:()=>calls++}),/reparse refused/);assert.equal(calls,0);
 assert.throws(()=>replaceDurableTemp(temp,target,{platform:'linux',rename:()=>{calls++;throw Object.assign(Error('denied'),{code:'EPERM'});}}),/denied/);assert.equal(calls,1);
});
