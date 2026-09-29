/* Shared byte-exact installer primitives. Callers retain their own link,
   concurrency, ownership and destination policies. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

export const sha256Hex=bytes=>createHash('sha256').update(bytes).digest('hex');

export function writeDurableTemp(target,bytes,{mode=0o600}={}){
 const temp=path.join(path.dirname(target),`.${path.basename(target)}.j3w1-${randomUUID()}.tmp`);
 let fd;
 try{
  fd=fs.openSync(temp,'wx',mode);
  fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;
  return temp;
 }catch(error){
  if(fd!==undefined)fs.closeSync(fd);
  if(fs.existsSync(temp))fs.unlinkSync(temp);
  throw error;
 }
}
