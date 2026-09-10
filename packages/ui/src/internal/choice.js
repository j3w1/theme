import { make, makeIcon, nativeInput, place, controlLabelText } from './dom.js';
import { mountTemporal } from './temporal.js';

const mounted = new WeakMap();
let sequence = 0;

// Keep one successful native control. Its themed presentation never owns a
// second form value and can be removed without losing application state.
export function mountChoice(select) {
  if (mounted.has(select)) return mounted.get(select);
  const abort = new AbortController(), restorers = [];
  const on = (node, type, fn, options = {}) => node?.addEventListener(type, fn, { ...options, signal: abort.signal });
  const multiple = select.multiple;
  let id; do { id = `j3w1-choice-${++sequence}`; } while (select.ownerDocument.getElementById(`${id}-control`));
  const shell = make(select, 'span', { class: 'j3w1-choice', 'data-choice-for': select.id });
  const list = make(select, 'span', { class: 'j3w1-choice-list', id: `${id}-list`, role: 'listbox' });
  const control = multiple ? list : make(select, 'button', { class: 'j3w1-choice-trigger', type: 'button', role: 'combobox', 'aria-haspopup': 'listbox', 'aria-controls': list.id, 'aria-expanded': 'false' });
  const value = make(select, 'span', { class: 'j3w1-choice-value' });
  const message = make(select, 'span', { class: 'j3w1-choice-error', id: `${id}-error`, role: 'status', hidden: '' });
  if (multiple) { list.setAttribute('aria-multiselectable', 'true'); list.tabIndex = 0; }
  else { control.append(value, makeIcon(select, 'M3.5 6 8 10.5 12.5 6', { class: 'j3w1-choice-chevron' })); list.hidden = true; list.setAttribute('popover', 'manual'); shell.append(control); }
  shell.append(list, message);
  select.after(shell);
  const saved = new Map(['hidden','aria-hidden','tabindex'].map(name => [name, select.getAttribute(name)]));
  select.hidden = true; select.setAttribute('aria-hidden', 'true'); select.tabIndex = -1;
  let items = [], active = -1, anchor = -1, open = false, updating = false, invalid = false, buffer = '', typedAt = 0;
  const disabled = option => option.disabled || option.parentElement?.matches('optgroup:disabled, optgroup[hidden]') || option.hidden;
  const usable = () => items.map((item,index) => disabled(item.option) ? -1 : index).filter(index => index >= 0);
  const labels = [...select.labels ?? []];
  control.id = `${id}-control`;
  for (const label of labels) { const previous = label.getAttribute('for'); label.htmlFor = control.id; restorers.push(() => previous === null ? label.removeAttribute('for') : label.setAttribute('for',previous)); }
  const labelText = () => controlLabelText(labels);
  const close = () => { if (multiple) return; if (list.matches(':popover-open')) list.hidePopover(); list.hidden = true; open = false; control.setAttribute('aria-expanded', 'false'); control.removeAttribute('aria-activedescendant'); };
  const focus = options => { if (!select.matches(':disabled')) control.focus(options); };
  const mark = index => {
    active = index;
    items.forEach((item,i) => item.node.toggleAttribute('data-active', i === active));
    if (items[active] && (multiple || open)) { control.setAttribute('aria-activedescendant', items[active].node.id); if(open || select.ownerDocument.activeElement===control) items[active].node.scrollIntoView({ block: 'nearest' }); }
    else control.removeAttribute('aria-activedescendant');
  };
  const sync = () => {
    if (updating || abort.signal.aborted) return;
    const off = select.matches(':disabled');
    control.setAttribute('aria-disabled', String(off)); control.tabIndex = off ? -1 : 0;
    if (!multiple) control.disabled = off;
    if (off) close();
    const labelled = select.getAttribute('aria-labelledby');
    if (labelled) { control.setAttribute('aria-labelledby', labelled); control.removeAttribute('aria-label'); }
    else { control.removeAttribute('aria-labelledby'); control.setAttribute('aria-label', select.getAttribute('aria-label') || labelText() || select.name || 'Choose an option'); }
    if (!multiple) list.setAttribute('aria-label', control.getAttribute('aria-label') || labelText() || 'Options');
    control.setAttribute('aria-required', String(select.required));
    const bad = invalid && !select.validity.valid || select.getAttribute('aria-invalid') === 'true';
    control.setAttribute('aria-invalid', String(bad));
    message.hidden = !bad; message.textContent = bad ? select.validationMessage || 'Choose a valid option.' : '';
    const described = [select.getAttribute('aria-describedby'), bad ? message.id : ''].filter(Boolean).join(' ');
    if (described) control.setAttribute('aria-describedby', described); else control.removeAttribute('aria-describedby');
    items.forEach(({option,node}) => { node.setAttribute('aria-selected', String(option.selected)); node.setAttribute('aria-disabled', String(disabled(option))); node.hidden = option.hidden || Boolean(option.parentElement?.matches('optgroup[hidden]')); });
    value.textContent = [...select.selectedOptions].map(option => option.label).join(', ') || 'Choose an option';
    if (!items[active] || disabled(items[active].option)) mark(usable()[0] ?? -1);
  };
  const hook = (object, name, changed) => {
    const own = Object.getOwnPropertyDescriptor(object,name);
    if (own) return; // Do not overwrite an application's own accessor.
    let proto = Object.getPrototypeOf(object), descriptor;
    while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto,name))) proto = Object.getPrototypeOf(proto);
    if (!descriptor?.set || !descriptor.get) return;
    Object.defineProperty(object,name,{ configurable:true, get() { return descriptor.get.call(this); }, set(next) { descriptor.set.call(this,next); changed(); } });
    restorers.push(() => delete object[name]);
  };
  const watched = new WeakSet();
  const rebuild = () => {
    const current = items[active]?.option;
    list.replaceChildren(); items = [];
    for (const child of select.children) {
      let parent = list;
      if (child.tagName === 'OPTGROUP') {
        parent = make(select,'span',{ role:'group', 'aria-label':child.label, class:'j3w1-choice-group' });
        parent.append(make(select,'span',{ class:'j3w1-choice-group-label', 'aria-hidden':'true' },child.label)); list.append(parent);
      }
      for (const option of child.tagName === 'OPTION' ? [child] : child.querySelectorAll('option')) {
        const node = make(select,'span',{ class:'j3w1-choice-option', role:'option', id:`${id}-option-${items.length}`, 'data-choice-value':option.value });
        node.append(make(select,'span',{class:'j3w1-choice-check','aria-hidden':'true'},'✓'),make(select,'span',{},option.label));
        parent.append(node); items.push({option,node});
        if (!watched.has(option)) { hook(option,'selected',sync); watched.add(option); }
      }
    }
    active = items.findIndex(item => item.option === current); sync();
  };
  const show = () => {
    if (multiple || select.matches(':disabled')) return;
    sync(); list.hidden = false; open = true; control.setAttribute('aria-expanded','true');
    list.style.width = `${control.getBoundingClientRect().width}px`;
    if (typeof list.showPopover === 'function' && !list.matches(':popover-open')) list.showPopover();
    place(control,list);
    mark(items.findIndex(item => item.option.selected && !disabled(item.option)) >= 0 ? items.findIndex(item => item.option.selected && !disabled(item.option)) : usable()[0] ?? -1);
  };
  const commit = (index, range = false) => {
    const item = items[index]; if (!item || disabled(item.option) || select.matches(':disabled')) return;
    updating = true;
    if (multiple) {
      if (range && anchor >= 0) items.forEach((entry,i) => { if (!disabled(entry.option)) entry.option.selected = i >= Math.min(anchor,index) && i <= Math.max(anchor,index); });
      else { item.option.selected = !item.option.selected; anchor = index; }
    } else select.selectedIndex = [...select.options].indexOf(item.option);
    updating = false; invalid = true; sync(); if (!multiple) close();
    nativeInput(select); nativeInput(select,'change');
    // A Vue action may move/unmount the owner synchronously on change.
    if (control.isConnected) focus();
  };
  on(control,'keydown',event => {
    if (select.matches(':disabled')) return;
    const indices = usable();
    if (event.key === 'Escape') { if (open) { event.preventDefault(); event.stopPropagation(); close(); } return; }
    if (event.key === 'Tab') { close(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && multiple) { event.preventDefault(); updating = true; const all = indices.every(i => items[i].option.selected); indices.forEach(i => { items[i].option.selected = !all; }); updating = false; sync(); nativeInput(select); nativeInput(select,'change'); return; }
    if (['Enter',' '].includes(event.key)) { event.preventDefault(); if (!multiple && !open) show(); else commit(active,event.shiftKey); return; }
    if (event.altKey && event.key === 'ArrowUp') { event.preventDefault(); close(); return; }
    if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault(); const wasOpen = open; if (!multiple && !open) show();
      if (!indices.length || event.altKey || !multiple && !wasOpen && !['Home','End'].includes(event.key)) return;
      const position = indices.indexOf(active);
      const next = event.key === 'Home' ? indices[0] : event.key === 'End' ? indices.at(-1) : indices[Math.max(0,Math.min(indices.length-1,position+(event.key === 'ArrowDown' ? 1 : -1)))];
      mark(next); if (multiple && event.shiftKey) commit(next,true); return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault(); if (!multiple && !open) show();
      const now = Date.now(); buffer = now-typedAt > 700 ? event.key : buffer+event.key; typedAt = now;
      const query = [...buffer].every(char => char === buffer[0]) ? buffer[0] : buffer;
      const start = query.length === 1 ? indices.indexOf(active)+1 : 0;
      const ordered = [...indices.slice(start),...indices.slice(0,start)];
      const next = ordered.find(i => items[i].option.label.toLocaleLowerCase().startsWith(query.toLocaleLowerCase()));
      if (next !== undefined) mark(next);
    }
  });
  if (!multiple) on(control,'click',event => { event.preventDefault(); focus(); open ? close() : show(); });
  on(list,'pointerdown',event => event.preventDefault());
  on(list,'click',event => { const index = items.findIndex(item => item.node === event.target.closest('[role="option"]')); if (index < 0) return; event.preventDefault(); mark(index); commit(index,event.shiftKey); });
  on(select,'input',sync); on(select,'change',sync);
  on(select,'invalid',event => { event.preventDefault(); invalid = true; sync(); focus(); });
  on(select.ownerDocument,'reset',event => { if(event.target===select.form)queueMicrotask(() => { if (!event.defaultPrevented) { invalid = false; close(); sync(); } }); },{capture:true});
  on(select.ownerDocument,'pointerdown',event => { if (!shell.contains(event.target)) close(); });
  on(shell,'focusout',() => queueMicrotask(() => { if (!shell.contains(select.ownerDocument.activeElement)) close(); }));
  on(select.ownerDocument.defaultView,'resize',() => { if (open) place(control,list); });
  on(select.ownerDocument,'scroll',event => { if (open && !list.contains(event.target)) place(control,list); },{capture:true});
  for (const label of labels) on(label,'click',event => { if (!shell.contains(event.target)) { event.preventDefault(); focus(); } });
  const observer = new MutationObserver(rebuild); observer.observe(select,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled','required','label','value','selected','hidden','aria-label','aria-labelledby','aria-describedby','aria-invalid']});
  const fieldsets = new MutationObserver(sync); for (let parent=select.parentElement;parent;parent=parent.parentElement) if(parent.tagName==='FIELDSET') fieldsets.observe(parent,{attributes:true,attributeFilter:['disabled']});
  hook(select,'value',sync); hook(select,'selectedIndex',sync);
  const originalFocus = Object.getOwnPropertyDescriptor(select,'focus');
  if (!originalFocus) { Object.defineProperty(select,'focus',{configurable:true,value:focus}); restorers.push(() => delete select.focus); }
  rebuild();
  const api = { sync, focus, show, hide:close, get open(){return open;}, destroy() { if(abort.signal.aborted)return;close(); abort.abort(); observer.disconnect(); fieldsets.disconnect(); restorers.forEach(restore=>restore()); shell.remove(); for(const [name,value] of saved) value===null?select.removeAttribute(name):select.setAttribute(name,value); mounted.delete(select); } };
  mounted.set(select,api); return api;
}

export function enhanceControls(root) {
  const choices = new Map();
  root.setAttribute('data-j3w1-controls','');
  const refresh = () => {
    for(const [select,api] of choices) if(!root.contains(select)){api.destroy();choices.delete(select);}
    for(const select of root.querySelectorAll('select,input[type="date"],input[type="time"]')) {
      let owner=select.parentElement; while(owner && !owner.localName.startsWith('j3w1-')) owner=owner.parentElement;
      const ownedField = select.closest('j3w1-select,j3w1-date-picker,j3w1-time-picker');
      if(!ownedField && (!owner || owner===root) && !choices.has(select)) choices.set(select,select.tagName==='SELECT'?mountChoice(select):mountTemporal(select));
    }
  };
  const observer = new MutationObserver(refresh); observer.observe(root,{childList:true,subtree:true}); refresh();
  return { refresh, destroy(){observer.disconnect();choices.forEach(api=>api.destroy());choices.clear();root.removeAttribute('data-j3w1-controls');} };
}
