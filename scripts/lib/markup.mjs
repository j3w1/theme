/* Parsed maintained markup shared by recipes, matrices and playgrounds.
   Callers supply trusted source; user content is assigned to text nodes. */
export const IDREFS = new Set(["for", "form", "list", "aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "aria-activedescendant", "aria-details", "aria-errormessage", "headers"]);
export const walkMarkup = (node, visit) => {
  visit(node);
  for (const child of node.childNodes ?? []) walkMarkup(child, visit);
};
export const attribute = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
export const setAttribute = (node, name, value = "") => {
  if (!node?.attrs) return;
  const current = node.attrs.find((a) => a.name === name);
  if (current) current.value = value;
  else node.attrs.push({ name, value });
};
export const removeAttribute = (node, name) => { if (node.attrs) node.attrs = node.attrs.filter((a) => a.name !== name); };
export const hasClass = (node, name) => attribute(node, "class")?.split(/\s+/).includes(name) ?? false;

export const namespaceMarkup = (tree, decorate, { strict = true, renameNames = false } = {}) => {
  const ids = new Map();
  walkMarkup(tree, (node) => {
    const id = attribute(node, "id");
    if (id === undefined) return;
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id) || ids.has(id)) throw new Error(`Invalid or duplicate markup ID: ${id}`);
    ids.set(id, decorate(id));
  });
  const reference = (id) => {
    if (!ids.has(id) && strict) throw new Error(`Unresolved markup ID reference: ${id}`);
    return ids.get(id) ?? decorate(id);
  };
  walkMarkup(tree, (node) => {
    for (const attr of node.attrs ?? []) {
      if (attr.name === "id") attr.value = reference(attr.value);
      else if (IDREFS.has(attr.name)) attr.value = attr.value.trim().split(/\s+/).map(reference).join(" ");
      else if (attr.name === "href" && attr.value.startsWith("#")) attr.value = `#${reference(attr.value.slice(1))}`;
      else if (renameNames && attr.name === "name") attr.value = decorate(attr.value);
    }
  });
};
