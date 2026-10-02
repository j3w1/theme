// Protocol fixture for the pinned Windhawk CLI. Never touches the real tool.
const fs=require('node:fs'),path=require('node:path');
const [state,...raw]=process.argv.slice(2),args=raw.filter(a=>!['--json','--yes'].includes(a));
const file=path.join(state,'fixture-windhawk.json');
const db=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
const done=data=>{fs.writeFileSync(file,JSON.stringify(db));console.log(JSON.stringify({schemaVersion:1,success:true,data}));};
const activityFile=path.join(state,'fixture-windhawk-activity.json');
const activity=fs.existsSync(activityFile)?JSON.parse(fs.readFileSync(activityFile,'utf8')):{compiles:0,imports:0};
function record(kind){activity[kind]++;fs.writeFileSync(activityFile,JSON.stringify(activity));}

const missing=()=>{console.log(JSON.stringify({schemaVersion:1,success:false,error:{code:'MOD_NOT_INSTALLED',message:'Missing'}}));process.exit(1);};
if(args[0]==='app'){if(args[2]==='set')db.appSettings={disableUpdateCheck:args[4]==='true'};done({settings:db.appSettings??{disableUpdateCheck:false}});}
else if(args[0]==='data'){
 if(args[1]==='export'){const id=args[args.indexOf('--mods')+1];fs.writeFileSync(args[args.indexOf('--out')+1],JSON.stringify({[id]:db[id]}));done({});}
 else {if(!raw.includes('--yes'))throw Error('data import requires --yes');record('imports');Object.assign(db,JSON.parse(fs.readFileSync(args[2],'utf8')));done({});}
}else if(args[0]==='mod'){
 const action=args[1],id=action==='settings'?args[3]:args[2];
 if(action==='install'){
  const installedId='local@'+id,source=fs.readFileSync(args[args.indexOf('--file')+1],'utf8');
  const version=source.match(/^\/\/\s*@version\s+(\S+)/m)?.[1]??'1.0';
  record('compiles');
  const libraryFileName=installedId+'_'+version+'_'+activity.compiles+'.dll';
  const library=path.join(state,'tools/windhawk/2.0.0-alpha.6/AppData/Engine/Mods/64',libraryFileName);
  fs.mkdirSync(path.dirname(library),{recursive:true});fs.writeFileSync(library,'fixture compilation\n'+source);
  db[installedId]={id:installedId,metadata:{version},config:{disabled:true,libraryFileName},settings:{theme:'',extraDefault:'keep'}};
  done({id:installedId,version,compiledLocally:true});
 }
 else if(!db[id])missing();
 else if(action==='show'){const {settings,...shown}=db[id];done(shown);}
 else if(action==='settings'){
  if(args[2]==='set')for(const pair of args.slice(4)){const i=pair.indexOf('=');const value=pair.slice(i+1);db[id].settings[pair.slice(0,i)]=value==='true'?'1':value==='false'?'0':value;}
  done({id,settings:db[id].settings});
 }else if(action==='enable'||action==='disable'){db[id].config.disabled=action==='disable';done({id});}
 else if(action==='remove'){delete db[id];done({id});}
 else throw Error('Unsupported fixture action');
}else throw Error('Unsupported fixture command');
