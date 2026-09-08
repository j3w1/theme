import {make,nativeInput,place,controlLabelText} from './dom.js';
const instances=new WeakMap();let sequence=0;
export function mountTemporal(input) {
  if(instances.has(input))return instances.get(input);
  const abort=new AbortController(),restore=[],date=input.getAttribute('type')==='date',nativeTemporal=input.type===input.getAttribute('type');
  const numeric=value=>{
    if(date){if(!/^\d{4,}-\d{2}-\d{2}$/.test(value))return NaN;const stamp=Date.parse(`${value}T00:00:00Z`);return Number.isFinite(stamp)&&new Date(stamp).toISOString().slice(0,10)===value?stamp/86400000:NaN;}
    const match=/^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);if(!match||Number(match[1])>23||Number(match[2])>59||Number(match[3]??0)>59)return NaN;
    return Number(match[1])*3600+Number(match[2])*60+Number(match[3]??0)+Number(`0.${match[4]??0}`);
  };
  const stepSize=()=>Number(input.step)>0?Number(input.step):date?1:60;
  const constraint=value=>{
    const number=numeric(value),min=numeric(input.min),max=numeric(input.max);if(!Number.isFinite(number))return value?'Enter a valid value.':input.required?'Choose a value.':'';
    if(!date&&min>max){if(number<min&&number>max)return 'Choose a time within the allowed range.';}
    else if(number<min||number>max)return 'Choose a value within the allowed range.';
    const base=Number.isFinite(min)?min:Number.isFinite(numeric(input.defaultValue))?numeric(input.defaultValue):0;
    if(input.step!=='any'&&Math.abs((number-base)/stepSize()-Math.round((number-base)/stepSize()))>1e-7)return 'Choose a value matching the allowed step.';
    return '';
  };
  const on=(node,type,fn,options={})=>node?.addEventListener(type,fn,{...options,signal:abort.signal});
  let id;do{id=`j3w1-temporal-${++sequence}`;}while(input.ownerDocument.getElementById(`${id}-input`));
  const shell=make(input,'span',{class:'j3w1-temporal'}),row=make(input,'span',{class:'j3w1-temporal-row'});
  const editor=make(input,'input',{id:`${id}-input`,type:'text',class:'j3w1-temporal-input',autocomplete:'off',placeholder:date?'YYYY-MM-DD':'HH:MM',inputmode:'text'});
  const message=make(input,'span',{id:`${id}-error`,class:'j3w1-choice-error',role:'status',hidden:''});
  const popup=make(input,'span',{class:'j3w1-calendar',role:'dialog','aria-modal':'false','aria-label':'Choose date',popover:'manual',hidden:''});
  const opener=make(input,'button',{type:'button',class:'j3w1-temporal-action','aria-label':date?'Open calendar':'Increase time'},date?'▦':'+');
  row.append(editor,opener);
  const decrease=date?null:make(input,'button',{type:'button',class:'j3w1-temporal-action','aria-label':'Decrease time'},'−');
  if(decrease)row.append(decrease);shell.append(row,message);if(date)shell.append(popup);input.after(shell);
  const labels=[...input.labels??[]];
  for(const label of labels){const previous=label.getAttribute('for');label.htmlFor=editor.id;restore.push(()=>previous===null?label.removeAttribute('for'):label.setAttribute('for',previous));}
  const attributes=new Map(['hidden','aria-hidden','tabindex'].map(name=>[name,input.getAttribute(name)]));
  input.hidden=true;input.setAttribute('aria-hidden','true');input.tabIndex=-1;
  let touched=false,writing=false,open=false,view=new Date(),activeDay=null,fallbackError='';
  const format=value=>`${String(value.getFullYear()).padStart(4,'0')}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
  const parse=value=>new Date(`${value}T12:00:00`);
  const labelText=()=>controlLabelText(labels);
  const close=(focus=false)=>{if(popup.matches(':popover-open'))popup.hidePopover();popup.hidden=true;open=false;opener.setAttribute('aria-expanded','false');if(focus)editor.focus();};
  const sync=()=>{
    if(abort.signal.aborted)return;
    if(!writing)editor.value=input.value;
    editor.disabled=input.matches(':disabled');editor.readOnly=input.readOnly;editor.required=input.required;
    if(input.hasAttribute('form'))editor.setAttribute('form',input.getAttribute('form'));else editor.removeAttribute('form');
    opener.disabled=editor.disabled||editor.readOnly||!date&&input.step==='any';if(decrease)decrease.disabled=opener.disabled;
    if(opener.disabled)close();
    const labelled=input.getAttribute('aria-labelledby');if(labelled){editor.setAttribute('aria-labelledby',labelled);editor.removeAttribute('aria-label');}else{editor.removeAttribute('aria-labelledby');editor.setAttribute('aria-label',input.getAttribute('aria-label')||labelText()||(date?'Date':'Time'));}
    if(!nativeTemporal){if(input.validationMessage===fallbackError)input.setCustomValidity('');fallbackError=constraint(editor.value);if(!input.validationMessage)input.setCustomValidity(fallbackError);}
    const malformed=Boolean(editor.value&&!Number.isFinite(numeric(editor.value)));
    editor.setCustomValidity(malformed?`Enter a valid ${date?'date in YYYY-MM-DD format':'time in HH:MM or HH:MM:SS format'}.`:input.validationMessage);
    const invalid=touched&&!editor.validity.valid||input.getAttribute('aria-invalid')==='true';
    editor.setAttribute('aria-invalid',String(invalid));message.hidden=!invalid;message.textContent=invalid?editor.validationMessage||'Enter a valid value.':'';
    const described=[input.getAttribute('aria-describedby'),date?'Use YYYY-MM-DD format.':'Use HH:MM or HH:MM:SS format.'];
    if(!shell.querySelector('.j3w1-temporal-hint'))shell.append(make(input,'span',{class:'j3w1-temporal-hint',id:`${id}-hint`},described[1]));
    editor.setAttribute('aria-describedby',[described[0],`${id}-hint`,invalid?message.id:''].filter(Boolean).join(' '));
  };
  const write=(value,change=false)=>{
    writing=true;editor.value=value;input.value=Number.isFinite(numeric(value))?value:'';nativeInput(input);if(change){touched=true;nativeInput(input,'change');}sync();writing=false;
  };
  const enabledDay=value=>!constraint(value);
  const draw=()=>{
    popup.replaceChildren();
    const heading=make(input,'span',{class:'j3w1-calendar-heading'}),previous=make(input,'button',{type:'button','data-month':'-1','aria-label':'Previous month'},'←'),next=make(input,'button',{type:'button','data-month':'1','aria-label':'Next month'},'→');
    const title=make(input,'strong',{id:`${id}-month`},view.toLocaleDateString(undefined,{month:'long',year:'numeric'}));heading.append(previous,title,next);popup.append(heading);
    const grid=make(input,'span',{role:'grid','aria-labelledby':title.id,class:'j3w1-calendar-grid'});
    const header=make(input,'span',{role:'row',class:'j3w1-calendar-week'});for(const day of ['Su','Mo','Tu','We','Th','Fr','Sa'])header.append(make(input,'span',{role:'columnheader'},day));grid.append(header);
    const first=new Date(view);first.setDate(1);const last=new Date(first);last.setMonth(last.getMonth()+1);last.setDate(0);
    let week;for(let index=0;index<first.getDay()+last.getDate();index++){
      if(index%7===0){week=make(input,'span',{role:'row',class:'j3w1-calendar-week'});grid.append(week);}
      const cell=make(input,'span',{role:'gridcell'});week.append(cell);const day=index-first.getDay()+1;if(day<1)continue;
      const current=new Date(first);current.setDate(day);const value=format(current),button=make(input,'button',{type:'button','data-date':value,tabindex:value===activeDay?'0':'-1','aria-label':current.toLocaleDateString(undefined,{dateStyle:'full'}),'aria-pressed':String(value===input.value)},day);
      button.disabled=!enabledDay(value);cell.append(button);
    }
    popup.append(grid);if(!popup.querySelector('button[data-date][tabindex="0"]:not(:disabled)')){const first=popup.querySelector('button[data-date]:not(:disabled)');if(first){first.tabIndex=0;activeDay=first.dataset.date;}}
    if(open)place(opener,popup);
  };
  const show=()=>{if(opener.disabled)return;const selected=parse(input.value);view=Number.isNaN(selected.valueOf())?new Date():selected;activeDay=format(view);open=true;popup.hidden=false;opener.setAttribute('aria-expanded','true');draw();if(typeof popup.showPopover==='function')popup.showPopover();place(opener,popup);popup.querySelector('[data-date][tabindex="0"]')?.focus();};
  if(date){opener.setAttribute('aria-haspopup','dialog');opener.setAttribute('aria-expanded','false');on(opener,'click',()=>open?close(true):show());}
  else {const step=amount=>{
    if(nativeTemporal){amount>0?input.stepUp():input.stepDown();write(input.value,true);}
    else {const min=numeric(input.min),current=numeric(input.value),base=Number.isFinite(min)?min:Number.isFinite(numeric(input.defaultValue))?numeric(input.defaultValue):0,size=stepSize(),position=((Number.isFinite(current)?current:base)-base)/size;
      const value=base+(amount>0?Math.floor(position)+1:Math.ceil(position)-1)*size;
      if(value>=0&&value<86400){const hours=String(Math.floor(value/3600)).padStart(2,'0'),minutes=String(Math.floor(value%3600/60)).padStart(2,'0'),seconds=String(Math.floor(value%60)).padStart(2,'0'),fraction=Math.round(value%1*1000);const text=`${hours}:${minutes}${value%60?`:${seconds}${fraction?`.${String(fraction).padStart(3,'0')}`:''}`:''}`;if(!constraint(text))write(text,true);}
    }
    editor.focus();};on(opener,'click',()=>step(1));on(decrease,'click',()=>step(-1));}
  on(editor,'input',event=>{event.stopPropagation();write(editor.value);});on(editor,'change',event=>{event.stopPropagation();write(editor.value,true);});
  for(const control of [editor,input])on(control,'invalid',event=>{event.preventDefault();touched=true;writing=true;sync();writing=false;editor.focus();});
  on(input,'input',()=>{if(!writing)sync();});on(input,'change',()=>{if(!writing)sync();});
  on(popup,'click',event=>{const day=event.target.closest('[data-date]');if(day&&!day.disabled){write(day.dataset.date,true);close(true);}const month=event.target.closest('[data-month]');if(month){view.setDate(1);view.setMonth(view.getMonth()+Number(month.dataset.month));draw();popup.querySelector(`[data-month="${month.dataset.month}"]`)?.focus();}});
  on(popup,'keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}
    const button=event.target.closest('[data-date]');if(!button)return;const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];
    if(delta!==undefined||['Home','End','PageUp','PageDown'].includes(event.key)){
      event.preventDefault();const next=parse(button.dataset.date);if(delta!==undefined)next.setDate(next.getDate()+delta);else if(event.key==='Home')next.setDate(next.getDate()-next.getDay());else if(event.key==='End')next.setDate(next.getDate()+6-next.getDay());else {const day=next.getDate();next.setDate(1);next.setMonth(next.getMonth()+(event.key==='PageDown'?1:-1));const end=new Date(next);end.setMonth(end.getMonth()+1);end.setDate(0);next.setDate(Math.min(day,end.getDate()));}
      if(enabledDay(format(next))){view=next;activeDay=format(next);draw();popup.querySelector(`[data-date="${activeDay}"]`)?.focus();}
    }
  });
  on(editor,'keydown',event=>{if(date&&event.altKey&&event.key==='ArrowDown'){event.preventDefault();show();}});
  on(input.ownerDocument,'pointerdown',event=>{if(!shell.contains(event.target))close();});on(shell,'focusout',()=>queueMicrotask(()=>{if(!shell.contains(input.ownerDocument.activeElement))close();}));
  on(input.ownerDocument,'reset',event=>{if(event.target===input.form)queueMicrotask(()=>{if(!event.defaultPrevented){touched=false;close();sync();}});},{capture:true});
  on(input.ownerDocument.defaultView,'resize',()=>{if(open)place(opener,popup);});
  const observer=new MutationObserver(sync);observer.observe(input,{attributes:true,attributeFilter:['value','min','max','step','disabled','readonly','required','form','aria-invalid','aria-describedby','aria-label','aria-labelledby']});
  const fieldsets=new MutationObserver(sync);for(let node=input.parentElement;node;node=node.parentElement)if(node.tagName==='FIELDSET')fieldsets.observe(node,{attributes:true,attributeFilter:['disabled']});
  const descriptor=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input),'value');if(!Object.hasOwn(input,'value')){Object.defineProperty(input,'value',{configurable:true,get(){return descriptor.get.call(this);},set(value){descriptor.set.call(this,value);if(!writing)sync();}});restore.push(()=>delete input.value);}
  if(!Object.hasOwn(input,'focus')){Object.defineProperty(input,'focus',{configurable:true,value:options=>editor.focus(options)});restore.push(()=>delete input.focus);}
  sync();
  const api={sync,destroy(){if(abort.signal.aborted)return;close();abort.abort();observer.disconnect();fieldsets.disconnect();restore.forEach(fn=>fn());shell.remove();for(const[name,value]of attributes)value===null?input.removeAttribute(name):input.setAttribute(name,value);instances.delete(input);}};instances.set(input,api);return api;
}
