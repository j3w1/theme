import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {readJson} from '../scripts/lib/fs.mjs';
import {flattenStylerSettings} from '../ports/windows/src/compatibility.mjs';
import {settingsArgumentBatches,windowsCommandLineUpperBound,WINDOWS_COMMAND_LINE_BUDGET} from '../ports/windows/src/settings-arguments.mjs';

test('every real shell palette travels through bounded native argv without losing any setting',async()=>{
 const host=await readJson('ports/windows/host.json');
 for(const styler of host.stylers){
  const values=flattenStylerSettings(await readJson('ports/windows/dist/'+styler.id+'.json'));
  const script='process.stdout.write(JSON.stringify(process.argv.slice(1)))';
  const prefix=['-e',script,'--','--json','mod','settings','set','local@'+styler.id];
  const batches=settingsArgumentBatches(process.execPath,prefix,values);
  assert.ok(batches.length>1,styler.id+' exercises a production-sized payload');
  const received=[];
  for(const batch of batches){
   assert.ok(windowsCommandLineUpperBound(process.execPath,[...prefix,...batch])<=WINDOWS_COMMAND_LINE_BUDGET);
   const result=spawnSync(process.execPath,[...prefix,...batch],{encoding:'utf8',windowsHide:true});
   assert.ifError(result.error);assert.equal(result.status,0,result.stderr);
   assert.deepEqual(JSON.parse(result.stdout).slice(0,5),prefix.slice(3));
   received.push(...JSON.parse(result.stdout).slice(5));
  }
  assert.deepEqual(received,Object.entries(values).map(([key,value])=>key+'='+value),styler.id);
 }
});

test('quoting, Unicode, equals signs and typed values stay intact across batch boundaries',()=>{
 const values={theme:'rose "quoted" \\ path = value 🥀',enabled:true,count:3,empty:''};
 for(let i=0;i<120;i++)values['controlStyles['+i+'].target']='Grid#Name > Border '+('\\"'.repeat(100));
 const prefix=['-e','process.stdout.write(JSON.stringify(process.argv.slice(1)))','--'];
 const batches=settingsArgumentBatches(process.execPath,prefix,values),received=[];
 assert.ok(batches.length>1);
 for(const batch of batches){
  const result=spawnSync(process.execPath,[...prefix,...batch],{encoding:'utf8',windowsHide:true});
  assert.ifError(result.error);assert.equal(result.status,0,result.stderr);
  received.push(...JSON.parse(result.stdout));
 }
 assert.deepEqual(received,Object.entries(values).map(([key,value])=>key+'='+value));
});

test('an oversized individual setting rejects the complete plan before any batch is returned',()=>{
 assert.throws(()=>settingsArgumentBatches('windhawk-cli.exe',['--json','mod','settings','set','local@sample'],{first:'small',second:'x'.repeat(16000)}),/setting exceeds/);
 assert.throws(()=>settingsArgumentBatches('x'.repeat(16000),[],{first:'small'}),/prefix exceeds/);
 assert.deepEqual(settingsArgumentBatches('windhawk-cli.exe',[],{}),[]);
});
