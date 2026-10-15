import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {FINGERPRINT_KEYS,shellCompatibility,stylerSettings} from '../ports/windows/src/compatibility.mjs';

const host=JSON.parse(readFileSync(new URL('../ports/windows/host.json',import.meta.url)));
const known=host.compatibility[0];
test('26300.9711 replaces the retired 9550 hosts without admitting adjacent updates',()=>{
 const actual={build:26300,ubr:9711,architecture:'X64',explorerVersion:'10.0.26100.8117',
  explorerFixedVersion:'10.0.26100.9711',startDockedVersion:'10.0.26100.9711',
  settingsVersion:'10.0.26100.9549',shellExperienceVersion:'10.0.26100.9549',
  searchVersion:'2608.25008.200.0',startPackageVersion:'10.0.26100.4768',
  shellPackageVersion:'10.0.26100.8115',clientPackageVersion:'1000.26100.372.0',startLayout:'redesigned'};
 assert.equal(shellCompatibility(actual,host.compatibility).compatible,true);
 for(const build of [26200,26300]){
  const retired={...actual,build,ubr:9550,explorerFixedVersion:'10.0.26100.9549',startDockedVersion:'10.0.26100.9549'};
  assert.equal(shellCompatibility(retired,host.compatibility).compatible,false);
 }
 for(const ubr of [9710,9712])assert.equal(shellCompatibility({...actual,ubr},host.compatibility).compatible,false);
 // Explorer's display version did not change; its fixed version must still match.
 assert.equal(shellCompatibility({...actual,explorerFixedVersion:'10.0.26100.9549'},host.compatibility).compatible,false);
});
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
