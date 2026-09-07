import { parseFragment, serialize } from "parse5";
import { attribute, namespaceMarkup, removeAttribute, setAttribute, walkMarkup } from "./markup.mjs";

export const applyNativeState = (tree, state) => {
  const parts = new Set(state.split("+"));
  const elements = [];
  walkMarkup(tree, (node) => { if (node.tagName) elements.push(node); });
  for (const node of elements) {
    const input = ["input", "textarea"].includes(node.tagName);
    const field = input || node.tagName === "select";
    if (parts.has("placeholder-shown") && input) {
      removeAttribute(node, "value");
      if (node.tagName === "textarea") node.childNodes = [];
    }
    if (parts.has("disabled") && (field || ["button", "fieldset"].includes(node.tagName))) setAttribute(node, "disabled");
    if (parts.has("read-only") && input) setAttribute(node, "readonly");
    if (parts.has("required") && field) setAttribute(node, "required");
    if (parts.has("invalid") && field) setAttribute(node, "aria-invalid", "true");
    if (parts.has("checked") && node.tagName === "input" && ["checkbox", "radio"].includes(attribute(node, "type"))) setAttribute(node, "checked");
    if (parts.has("open") && ["dialog", "details"].includes(node.tagName)) setAttribute(node, "open");
  }
  if (parts.has("busy") || parts.has("loading")) setAttribute(elements[0], "aria-busy", "true");
  for (const [part, name] of [["selected", "aria-selected"], ["current", "aria-current"], ["expanded", "aria-expanded"], ["toggled", "aria-pressed"]]) {
    if (parts.has(part)) setAttribute(elements.find((node) => attribute(node, name) === "false") ?? elements[0], name, "true");
  }
  if (parts.has("checked") && elements.some((node) => attribute(node, "role") === "switch")) setAttribute(elements.find((node) => attribute(node, "aria-checked") === "false") ?? elements[0], "aria-checked", "true");
};

export const renderSpecimenMarkup = (source, suffix, { state = "default", inert = false } = {}) => {
  if (!/^[a-z][a-z0-9-]*$/.test(suffix)) throw new Error("Invalid specimen instance suffix");
  stateAttributes(state);
  const tree = parseFragment(source);
  // Existing matrix references use a per-cell suffix, including native groups.
  namespaceMarkup(tree, (id) => `${id}-${suffix}`, { strict: false, renameNames: true });
  applyNativeState(tree, state);
  if (inert) walkMarkup(tree, (node) => {
    if (!node.tagName) return;
    const focusable = ["a", "button", "input", "select", "textarea", "summary"].includes(node.tagName) || attribute(node, "tabindex") !== undefined || attribute(node, "contenteditable") !== undefined;
    removeAttribute(node, "tabindex");
    if (focusable) setAttribute(node, "tabindex", "-1");
  });
  return serialize(tree);
};

export const stateAttributes = (state) => {
  if (!/^[a-z][a-z0-9-]*(?:\+[a-z][a-z0-9-]*)*$/.test(state)) throw new Error("Invalid specimen state");
  return `data-state="${state}" ${state.split("+").map((part) => `data-state-${part}=""`).join(" ")}`;
};
