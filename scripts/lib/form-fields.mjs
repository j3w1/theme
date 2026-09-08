import { parseFragment, serialize } from "parse5";
import { attribute, hasClass, namespaceMarkup, removeAttribute, setAttribute, walkMarkup } from "./markup.mjs";
import { anchorFor } from "./anchors.mjs";
import { FORM_LIMITS } from "../../schemas/form-schema.mjs";
export const FIELD_COMPONENTS = { text: "text-field", textarea: "textarea", select: "select", checkbox: "checkbox", radio: "radio-group" };
const textNode = value => ({ nodeName: "#text", value: String(value) });
const setText = (node, value) => { node.childNodes = [textNode(value)]; node.childNodes[0].parentNode = node; };
const clone = node => {
  const result = { ...node, attrs: node.attrs?.map(attr => ({ ...attr })) };
  delete result.parentNode;
  result.childNodes = node.childNodes?.map(child => { const copy = clone(child); copy.parentNode = result; return copy; });
  return result;
};
const element = html => parseFragment(html).childNodes[0];
export const fieldControlId = (prefix, field) => anchorFor.formField(prefix, field.id, "control");
export const renderField = (field, value, { prefix, templates, error = "", disabled = false }) => {
  const component = FIELD_COMPONENTS[field.type];
  if (!component || !templates[field.type] || !/^[a-z][a-z0-9-]*$/.test(prefix) || !/^[a-z][a-z0-9-]{0,47}$/.test(field.id)) throw new Error("Unsupported field or instance identity");
  const tree = parseFragment(templates[field.type]);
  namespaceMarkup(tree, id => anchorFor.formField(prefix, field.id, id), { strict: false, renameNames: true });
  const nodes = []; walkMarkup(tree, node => { if (node.tagName) nodes.push(node); });
  const byClass = name => nodes.find(node => hasClass(node, name));
  const root = byClass(component), controlId = fieldControlId(prefix, field);
  const helpId = anchorFor.formField(prefix, field.id, "help"), messageId = anchorFor.formField(prefix, field.id, "message");
  setAttribute(root, "data-form-field", field.id);
  const label = byClass(component + (field.type === "radio" ? "-legend" : field.type === "checkbox" ? "-text" : "-label"));
  // Retain the canonical required markers while replacing only source text.
  label.childNodes = [textNode(field.label + " "), ...(label.childNodes ?? []).filter(node => node.tagName)];
  for (const node of label.childNodes) node.parentNode = label;
  let help = byClass(component + "-help");
  if (!help) { help = element('<p class="form-field-help"></p>'); root.childNodes.push(help); help.parentNode = root; }
  setAttribute(help, "id", helpId); setText(help, field.help);
  const message = byClass(component + "-message");
  setAttribute(message, "id", messageId); setText(message, error ? "✕ " + error : "");
  const configure = (input, id) => {
    setAttribute(input, "id", id); setAttribute(input, "name", controlId);
    setAttribute(input, "aria-describedby", [field.help ? helpId : "", error ? messageId : ""].filter(Boolean).join(" "));
    if (!field.help && !error) removeAttribute(input, "aria-describedby");
    for (const [name, enabled] of [["required", field.required], ["disabled", disabled], ["aria-invalid", Boolean(error)]]) {
      if (enabled) setAttribute(input, name, name === "aria-invalid" ? "true" : ""); else removeAttribute(input, name);
    }
    removeAttribute(input, "placeholder"); removeAttribute(input, "readonly"); removeAttribute(input, "checked");
  };
  if (field.type === "radio") {
    const options = byClass("radio-group-options"), prototype = byClass("radio-group-option");
    options.childNodes = field.options.map((option, index) => {
      const copy = clone(prototype); let input, caption;
      walkMarkup(copy, node => { if (node.tagName === "input") input = node; if (hasClass(node, "radio-group-text")) caption = node; });
      configure(input, index === 0 ? controlId : anchorFor.formField(prefix, field.id, "option-" + option.id));
      setAttribute(input, "value", option.id); if (value === option.id) setAttribute(input, "checked");
      setText(caption, option.label); copy.parentNode = options; return copy;
    });
    setAttribute(root, "aria-describedby", [field.help ? helpId : "", error ? messageId : ""].filter(Boolean).join(" "));
    if (!field.help && !error) removeAttribute(root, "aria-describedby");
  } else {
    const input = nodes.find(node => ["input", "select", "textarea"].includes(node.tagName));
    configure(input, controlId);
    if (field.type !== "checkbox") setAttribute(label, "for", controlId);
    if (field.type === "checkbox") { if (value === true) setAttribute(input, "checked"); }
    else if (field.type === "select") {
      input.childNodes = [{ id: "", label: "Choose an option" }, ...field.options].map(option => {
        const node = element("<option></option>"); setAttribute(node, "value", option.id); setText(node, option.label);
        if (value === option.id) setAttribute(node, "selected"); node.parentNode = input; return node;
      });
    } else {
      setAttribute(input, "maxlength", String(FORM_LIMITS.value));
      if (field.type === "textarea") setText(input, value ?? ""); else setAttribute(input, "value", String(value ?? ""));
    }
  }
  return serialize(tree);
};
export const renderFields = (fields, values, options) => fields.map(field => renderField(field, Object.hasOwn(values, field.id) ? values[field.id] : field.type === "checkbox" ? false : "", { ...options, error: options.errors?.[field.id] ?? "" })).join("\n");
export const readFieldValues = (root, fields, prefix) => Object.fromEntries(fields.map(field => {
  const input = root.querySelector(`[id="${fieldControlId(prefix, field)}"]`);
  const value = field.type === "checkbox" ? input.checked : field.type === "radio" ? root.querySelector(`[name="${fieldControlId(prefix, field)}"]:checked`)?.value ?? "" : input.value;
  return [field.id, value];
}));
