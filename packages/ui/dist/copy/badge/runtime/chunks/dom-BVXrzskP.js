//#region packages/ui/src/internal/dom.js
var all = (root, selector) => [...root.querySelectorAll(selector)];
var enabled = (node) => !node.matches(":disabled") && node.getAttribute("aria-disabled") !== "true";
var visible = (node) => !node.closest("[hidden]");
function announce(root, message) {
	let status = root.querySelector("[data-j3w1-status]");
	if (!status) {
		status = root.ownerDocument.createElement("p");
		status.dataset.j3w1Status = "";
		status.className = "j3w1-visually-hidden";
		status.setAttribute("role", "status");
		root.append(status);
	}
	status.textContent = message;
}
function identify(root, node, suffix) {
	if (node && !node.id) node.id = `${root.id}-${suffix}`;
	return node?.id;
}
function nativeInput(input, type = "input") {
	input.dispatchEvent(new Event(type, { bubbles: true }));
}
function rove(items, index, focus = true) {
	if (!items.length) return null;
	const next = items[(index + items.length) % items.length];
	items.forEach((item) => {
		item.tabIndex = item === next ? 0 : -1;
	});
	if (focus) next.focus();
	return next;
}
function make(root, tag, attrs = {}, text) {
	const node = root.ownerDocument.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
	if (text !== void 0) node.textContent = String(text);
	return node;
}
function place(trigger, popup) {
	const r = trigger.getBoundingClientRect(), p = popup.getBoundingClientRect();
	const doc = trigger.ownerDocument.documentElement;
	const left = Math.max(8, Math.min(r.left, doc.clientWidth - p.width - 8));
	const top = r.bottom + p.height + 8 > doc.clientHeight ? Math.max(8, r.top - p.height) : r.bottom;
	Object.assign(popup.style, {
		position: "fixed",
		insetInlineStart: "auto",
		insetInlineEnd: "auto",
		left: `${left}px`,
		top: `${top}px`,
		maxHeight: `${Math.max(120, doc.clientHeight - top - 8)}px`,
		overflowY: "auto"
	});
}
//#endregion
export { make as a, rove as c, identify as i, visible as l, announce as n, nativeInput as o, enabled as r, place as s, all as t };
