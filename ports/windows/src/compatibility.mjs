// Exact host inputs; a Windows marketing version never grants compatibility.
export const FINGERPRINT_KEYS = ['build','ubr','architecture','explorerVersion',
 'explorerFixedVersion','startDockedVersion','settingsVersion','shellExperienceVersion','searchVersion',
 'startPackageVersion','shellPackageVersion','clientPackageVersion','startLayout'];
export function shellCompatibility(actual, entries) {
 const missing=FINGERPRINT_KEYS.filter(key=>actual?.[key]===undefined||actual[key]===''||actual[key]==='unknown');
 if(missing.length)return {compatible:false,reason:'Missing or unknown shell inputs',fields:missing};
 const match=entries.find(entry=>FINGERPRINT_KEYS.every(key=>entry[key]===actual[key]));
 if(!match)return {compatible:false,reason:'Unreviewed shell fingerprint',actual};
 return {compatible:true,startLayout:actual.startLayout,status:match.status};
}
export function stylerSettings(base, variants, layout) {
 if(!variants)return base;
 if(!Object.hasOwn(variants,layout))throw Error('Unknown Start layout; styler remains disabled');
 return {...base,disableNewStartMenuLayout:'default',controlStyles:[...base.controlStyles,...variants[layout]]};
}

// Windhawk retains old indexed entries on update. Its pinned stylers stop at
// an empty target/style/resource, so terminate replacement arrays explicitly.
export function flattenStylerSettings(value,prefix='',out={}) {
 if(prefix==='' && value && Array.isArray(value.controlStyles)) {
  // Omitted optional lists also replace any values retained from an older theme.
  if(!Object.hasOwn(value,'webContentStyles'))out['webContentStyles[0].target']='';
  for(const key of ['themeResourceVariables','styleConstants'])
   if(!Object.hasOwn(value,key))out[`${key}[0]`]='';
 }
 if(Array.isArray(value)) {
  value.forEach((item,index)=>flattenStylerSettings(item,`${prefix}[${index}]`,out));
  if(prefix==='controlStyles' || prefix==='webContentStyles')out[`${prefix}[${value.length}].target`]='';
  else if(prefix==='themeResourceVariables' || prefix==='styleConstants' || /^(?:controlStyles|webContentStyles)\[\d+\]\.styles$/.test(prefix))
   out[`${prefix}[${value.length}]`]='';
 } else if(value!==null && typeof value==='object') {
  for(const [key,item] of Object.entries(value))flattenStylerSettings(item,prefix?`${prefix}.${key}`:key,out);
 } else out[prefix]=value;
 return out;
}
