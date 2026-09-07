import { parseFragment, serialize } from "parse5";

const IDREFS = new Set(["for", "form", "list", "aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "aria-activedescendant", "aria-details", "aria-errormessage", "headers"]);
const walk = (node, visit) => {
  visit(node);
  for (const child of node.childNodes ?? []) walk(child, visit);
};

/* Parse maintained source, never rendered documentation. Each copy operation
   supplies an explicit instance prefix; IDREFs stay within that instance. */
export const instantiateRecipe = (source, prefix, { removeClasses = [] } = {}) => {
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(prefix)) throw new Error("Use an instance prefix of 1–64 lowercase letters, digits and hyphens, starting with a letter.");
  const tree = parseFragment(source);
  walk(tree, (node) => {
    if (node.childNodes) node.childNodes = node.childNodes.filter((child) => child.nodeName !== "#comment" && !child.attrs?.some((a) => a.name === "class" && a.value.split(/\s+/).some((c) => removeClasses.includes(c))));
    if (node.attrs) node.attrs = node.attrs.filter((a) => !a.name.startsWith("data-state-") && !["data-token", "data-hex-literal"].includes(a.name));
    if (["script", "style", "iframe"].includes(node.tagName) || node.attrs?.some((a) => a.name.startsWith("on"))) throw new Error("Recipe markup cannot contain behavior or embedded styles; declare dependencies explicitly.");
  });
  const ids = new Map();
  walk(tree, (node) => {
    const id = node.attrs?.find((a) => a.name === "id");
    if (!id) return;
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id.value) || ids.has(id.value)) throw new Error(`Invalid or duplicate recipe ID: ${id.value}`);
    ids.set(id.value, `${prefix}-${id.value}`);
  });
  const reference = (id) => {
    if (!ids.has(id)) throw new Error(`Unresolved recipe ID reference: ${id}`);
    return ids.get(id);
  };
  walk(tree, (node) => {
    for (const attr of node.attrs ?? []) {
      if (attr.name === "id") attr.value = reference(attr.value);
      else if (IDREFS.has(attr.name)) attr.value = attr.value.trim().split(/\s+/).map(reference).join(" ");
      else if (attr.name === "href" && attr.value.startsWith("#")) attr.value = `#${reference(attr.value.slice(1))}`;
    }
  });
  return `${serialize(tree).trim()}\n`;
};
