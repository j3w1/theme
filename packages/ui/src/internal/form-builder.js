import { createBuilder, changeBuilder, exportDefinition } from "../../../../scripts/lib/form-builder.mjs";
import { mountWorkflow } from "./form-workflow.js";
import { FORM_LIMITS } from "../../../../schemas/form-schema.mjs";
import theme from "../../../../exports/forms/identity.json";
import templateExport from "../../../../exports/forms/templates.json";
const templates = templateExport.templates;
let nextBuilder = 0;
export const mountBuilder = (root, { signal } = {}) => {
  const controller = new AbortController();
  signal?.addEventListener("abort", () => controller.abort(), { once: true });
  const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: controller.signal });
  let previewApi;
  const prefix = root.dataset.builderPrefix ??= `builder-instance-${++nextBuilder}`;
  let state = createBuilder(theme), selected = null;
  const find = selector => root.querySelector(selector), list = find("[data-field-list]"), editor = find("[data-editor]"), status = find("[data-builder-status]"), preview = find("[data-preview]");
  const prototype = preview.firstElementChild.cloneNode(true);
  const announce = message => { status.textContent = message; };
  const fieldControl = name => editor.elements.namedItem(name);
  const focusField = id => {
    const button = [...list.querySelectorAll("[data-edit-id]")].find(button => button.dataset.editId === id);
    (button ?? find("[data-add]")).focus();
  };
  const draw = () => {
    list.replaceChildren();
    find("[data-empty]").hidden = state.definition.fields.length > 0;
    find("[data-add]").disabled = state.definition.fields.length >= FORM_LIMITS.fields;
    find("[data-density-choice]").value = state.definition.density;
    for (const [index, field] of state.definition.fields.entries()) {
      const item = document.createElement("li"), label = document.createElement("strong");
      item.dataset.fieldId = field.id; label.textContent = `${field.label} (${field.type}, ${field.id})`; item.append(label);
      const actions = document.createElement("div"); actions.className = "form-tool-actions";
      const button = (text, handler, disabled = false) => {
        const node = document.createElement("button"); node.type = "button"; node.className = "button button-secondary"; node.textContent = text; node.disabled = disabled;
        listen(node, "click", handler); actions.append(node); return node;
      };
      const edit = button("Edit field", () => openEditor(field)); edit.dataset.editId = field.id;
      button("Move up", () => apply({ type: "move", id: field.id, direction: -1 }, "Field moved up.", field.id), index === 0);
      button("Move down", () => apply({ type: "move", id: field.id, direction: 1 }, "Field moved down.", field.id), index === state.definition.fields.length - 1);
      button("Remove field", () => apply({ type: "remove", id: field.id }, "Field removed.", state.definition.fields[index + 1]?.id ?? state.definition.fields[index - 1]?.id));
      item.append(actions); list.append(item);
    }
    previewApi?.destroy();
    const workflow = prototype.cloneNode(true); preview.replaceChildren(workflow); preview.dataset.density = state.definition.density;
    previewApi = mountWorkflow(workflow, { fields: state.definition.fields, templates, prefix: prefix + "-preview", signal: controller.signal });
  };
  const apply = (event, message, focusId) => {
    try {
      state = changeBuilder(state, event); selected = null; editor.hidden = true; draw(); announce(message);
      if (focusId) focusField(focusId); else find("[data-add]").focus();
      return true;
    } catch (error) { announce(`Definition unchanged. ${error.message}`); return false; }
  };
  const openEditor = field => {
    selected = field.id; editor.hidden = false;
    fieldControl("label").value = field.label; fieldControl("help").value = field.help; fieldControl("required").checked = field.required;
    fieldControl("options").value = JSON.stringify(field.options, null, 2);
    find("[data-options-label]").hidden = !["select", "radio"].includes(field.type); fieldControl("label").focus();
  };
  listen(find("[data-add]"), "click", () => {
    if (apply({ type: "add", kind: find("[data-kind]").value }, "Field added. Edit its definition.")) openEditor(state.definition.fields.at(-1));
  });
  listen(editor, "submit", event => {
    event.preventDefault(); const field = state.definition.fields.find(field => field.id === selected);
    let options = [];
    if (["select", "radio"].includes(field.type)) {
      try { options = JSON.parse(fieldControl("options").value); }
      catch { announce("Definition unchanged. Options must be a JSON array of id and label objects."); return; }
    }
    apply({ type: "edit", id: selected, label: fieldControl("label").value, help: fieldControl("help").value, required: fieldControl("required").checked, options }, "Field definition saved. Preview values cleared.", selected);
  });
  listen(find("[data-cancel]"), "click", () => { editor.hidden = true; focusField(selected); selected = null; });
  listen(find("[data-density-choice]"), "change", event => apply({ type: "density", density: event.target.value }, "Preview density changed. Preview values cleared."));
  listen(find("[data-export]"), "click", () => { find("[data-json]").value = exportDefinition(state); announce("Definition JSON ready. Entered preview values are excluded."); });
  listen(find("[data-download]"), "click", () => {
    const url = URL.createObjectURL(new Blob([exportDefinition(state)], { type: "application/json" })), link = document.createElement("a");
    link.href = url; link.download = "theme-form.json"; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0); announce("Definition download requested. Entered preview values are excluded.");
  });
  listen(find("[data-import]"), "click", () => apply({ type: "import", text: find("[data-json]").value }, "Definition imported. Preview values cleared."));
  listen(find("[data-reset]"), "click", () => { apply({ type: "reset" }, "Builder reset. Definition and preview cleared."); find("[data-json]").value = ""; });
  draw(); root.hidden = false;
  return { exportDefinition: () => exportDefinition(state), importDefinition: text => apply({ type: "import", text }, "Definition imported. Preview values cleared."), destroy() { controller.abort(); previewApi?.destroy(); } };
};
