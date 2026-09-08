//#region scripts/lib/markup.mjs
var IDREFS = /* @__PURE__ */ new Set([
	"for",
	"form",
	"list",
	"aria-labelledby",
	"aria-describedby",
	"aria-controls",
	"aria-owns",
	"aria-activedescendant",
	"aria-details",
	"aria-errormessage",
	"headers"
]);
var walkMarkup = (node, visit) => {
	visit(node);
	for (const child of node.childNodes ?? []) walkMarkup(child, visit);
	if (node.tagName === "template" && node.content) walkMarkup(node.content, visit);
};
var attribute = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
var setAttribute = (node, name, value = "") => {
	if (!node?.attrs) return;
	const current = node.attrs.find((a) => a.name === name);
	if (current) current.value = value;
	else node.attrs.push({
		name,
		value
	});
};
var removeAttribute = (node, name) => {
	if (node.attrs) node.attrs = node.attrs.filter((a) => a.name !== name);
};
var hasClass = (node, name) => attribute(node, "class")?.split(/\s+/).includes(name) ?? false;
var namespaceMarkup = (tree, decorate, { strict = true, renameNames = false } = {}) => {
	const ids = /* @__PURE__ */ new Map();
	walkMarkup(tree, (node) => {
		const id = attribute(node, "id");
		if (id === void 0) return;
		if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id) || ids.has(id)) throw new Error(`Invalid or duplicate markup ID: ${id}`);
		ids.set(id, decorate(id));
	});
	const reference = (id) => {
		if (!ids.has(id) && strict) throw new Error(`Unresolved markup ID reference: ${id}`);
		return ids.get(id) ?? decorate(id);
	};
	walkMarkup(tree, (node) => {
		for (const attr of node.attrs ?? []) if (attr.name === "id") attr.value = reference(attr.value);
		else if (IDREFS.has(attr.name)) attr.value = attr.value.trim().split(/\s+/).map(reference).join(" ");
		else if (attr.name === "href" && attr.value.startsWith("#")) attr.value = `#${reference(attr.value.slice(1))}`;
		else if (renameNames && attr.name === "name") attr.value = decorate(attr.value);
	});
};
//#endregion
export { setAttribute as a, removeAttribute as i, hasClass as n, walkMarkup as o, namespaceMarkup as r, IDREFS as t };
