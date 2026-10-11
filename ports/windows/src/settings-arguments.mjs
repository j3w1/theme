// CreateProcessW permits 32,767 UTF-16 code units including its trailing NUL.
// Reserve headroom and overestimate quoting: every input character could need
// one escape, plus quotes and a separator. JS length counts UTF-16 units too.
// Values stay whole; no shell or text transformation is involved.
export const WINDOWS_COMMAND_LINE_BUDGET=30000;
const argumentCost=value=>2*String(value).length+3;
export function windowsCommandLineUpperBound(command,argv){
 return argumentCost(command)+argv.reduce((sum,value)=>sum+argumentCost(value),0)+1;
}
export function settingsArgumentBatches(command,prefix,values){
 const fixed=windowsCommandLineUpperBound(command,prefix);
 if(fixed>=WINDOWS_COMMAND_LINE_BUDGET)throw Error('Windhawk command prefix exceeds the Windows launch budget');
 const batches=[];let batch=[],length=fixed;
 for(const [key,value]of Object.entries(values)){
  const pair=key+'='+value,cost=argumentCost(pair);
  if(fixed+cost>WINDOWS_COMMAND_LINE_BUDGET)throw Error('A Windhawk setting exceeds the Windows launch budget');
  if(length+cost>WINDOWS_COMMAND_LINE_BUDGET){batches.push(batch);batch=[];length=fixed;}
  batch.push(pair);length+=cost;
 }
 if(batch.length)batches.push(batch);
 return batches;
}
