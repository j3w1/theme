// Exact host inputs; a Windows marketing version never grants compatibility.
export const FINGERPRINT_KEYS = ['build','ubr','architecture','explorerVersion',
 'startDockedVersion','settingsVersion','shellExperienceVersion','searchVersion',
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
