import { parseFragment, serialize } from "parse5";
import { namespaceMarkup, walkMarkup as walk } from "./markup.mjs";

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
  namespaceMarkup(tree, (id) => `${prefix}-${id}`);
  return `${serialize(tree).trim()}\n`;
};
