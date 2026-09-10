export const all = (root, selector) => [...root.querySelectorAll(selector)];
export const enabled = node => !node.matches(":disabled") && node.getAttribute("aria-disabled") !== "true";
export const visible = node => !node.closest("[hidden]");
export function controlLabelText(labels) {
  const text=node=>{
    if(node.nodeType===3)return node.textContent;
    if(node.nodeType!==1)return '';
    if(node.matches('input,select,textarea,.j3w1-choice,.j3w1-temporal,[aria-hidden="true"],[hidden]'))return '';
    const style=node.ownerDocument.defaultView.getComputedStyle(node);
    if(style.display==='none'||style.visibility==='hidden')return '';
    return [...node.childNodes].map(text).join('');
  };
  return labels.map(label=>[...label.childNodes].map(text).join('').trim()).join(' ');
}
export function announce(root, message) {
  let status = root.querySelector("[data-j3w1-status]");
  if (!status) { status = root.ownerDocument.createElement("p"); status.dataset.j3w1Status = ""; status.className = "j3w1-visually-hidden"; status.setAttribute("role", "status"); root.append(status); }
  status.textContent = message;
}
export function identify(root, node, suffix) { if (node && !node.id) node.id = `${root.id}-${suffix}`; return node?.id; }
export function nativeInput(input, type = "input") { input.dispatchEvent(new Event(type, { bubbles: true })); }
export function rove(items, index, focus = true) {
  if (!items.length) return null;
  const next = items[(index + items.length) % items.length];
  items.forEach(item => { item.tabIndex = item === next ? 0 : -1; });
  if (focus) next.focus();
  return next;
}
export function make(root, tag, attrs = {}, text) {
  const node = root.ownerDocument.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = String(text);
  return node;
}

// A line icon on the same 16px grid the canonical components draw on. A text
// glyph cannot be centred reliably: it sits wherever the font puts it inside
// its em box, which is why the themed chevron read as low against its label.
export function makeIcon(root, d, attrs = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = root.ownerDocument.createElementNS(ns, 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 16 16', width: '16', height: '16', 'aria-hidden': 'true', focusable: 'false', ...attrs })) svg.setAttribute(key, String(value));
  const path = root.ownerDocument.createElementNS(ns, 'path');
  for (const [key, value] of Object.entries({ d, fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5' })) path.setAttribute(key, value);
  svg.append(path);
  return svg;
}
export function place(trigger, popup) {
  const r = trigger.getBoundingClientRect(), p = popup.getBoundingClientRect();
  const doc = trigger.ownerDocument.documentElement;
  const left = Math.max(8, Math.min(r.left, doc.clientWidth - p.width - 8));
  const top = r.bottom + p.height + 8 > doc.clientHeight ? Math.max(8, r.top - p.height) : r.bottom;
  Object.assign(popup.style, { position: "fixed", insetInlineStart: "auto", insetInlineEnd: "auto", left: `${left}px`, top: `${top}px`, maxHeight: `${Math.max(120, doc.clientHeight - top - 8)}px`, overflowY: "auto" });
}
