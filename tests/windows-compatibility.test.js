import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {FINGERPRINT_KEYS,shellCompatibility,stylerSettings} from '../ports/windows/src/compatibility.mjs';

const host=JSON.parse(readFileSync(new URL('../ports/windows/host.json',import.meta.url)));
const known=host.compatibility[0];
test('every shell and package input must match; missing or changed fields fail closed',()=>{
 for(const known of host.compatibility){
 assert.equal(shellCompatibility(known,host.compatibility).compatible,true);
 for(const field of FINGERPRINT_KEYS){
  const absent={...known};delete absent[field];
  assert.equal(shellCompatibility(absent,host.compatibility).compatible,false,`${field}: absent`);
  assert.equal(shellCompatibility({...known,[field]:'unknown'},host.compatibility).compatible,false,`${field}: unknown`);
  assert.equal(shellCompatibility({...known,[field]:'different'},host.compatibility).compatible,false,`${field}: changed`);
 }
 assert.equal(shellCompatibility({...known,startLayout:'classic'},host.compatibility).compatible,false);
 }
 assert.equal(shellCompatibility({...known,build:known.build+1},host.compatibility).compatible,false);
});
test('Start styles select one known layout without changing Windows layout behavior',()=>{
 const base={theme:'',controlStyles:[{target:'TextBlock',styles:['Foreground=rose']}]};
 const variants={classic:[{target:'Classic'}],redesigned:[{target:'Redesigned'}]};
 for(const layout of Object.keys(variants)){
  const result=stylerSettings(base,variants,layout);
  assert.equal(result.disableNewStartMenuLayout,'default');
  assert.deepEqual(result.controlStyles,[...base.controlStyles,...variants[layout]]);
 }
 assert.throws(()=>stylerSettings(base,variants,'unknown'),/Unknown Start layout/);
 assert.deepEqual(stylerSettings(base,undefined,'unknown'),base);
 assert.equal(base.controlStyles.length,1);
});
