import { initialWorkflow, workflowTransition } from "../../../scripts/lib/form-model.mjs";
import { renderFields, readFieldValues, fieldControlId } from "../../../scripts/lib/form-fields.mjs";
export const mountWorkflow = (root, { fields, templates, prefix, validate }) => {
  let state = initialWorkflow(fields);
  const find = selector => root.querySelector(selector);
  const form = find("form"), fieldset = find("[data-fields]"), summary = find("[data-errors]"), review = find("[data-review]");
  const status = find("[data-status]"), submit = find('[data-event="submit"]');
  const draw = (focus = true) => {
    root.dataset.stage = state.stage;
    form.setAttribute("aria-busy", String(state.stage === "busy"));
    fieldset.innerHTML = renderFields(fields, state.values, { templates, prefix, errors: state.errors });
    fieldset.disabled = !["editing", "invalid"].includes(state.stage);
    submit.hidden = !["editing", "invalid"].includes(state.stage);
    summary.replaceChildren(); summary.hidden = state.stage !== "invalid";
    if (!summary.hidden) {
      const glyph = document.createElement("span"); glyph.className = "alert-glyph"; glyph.setAttribute("aria-hidden", "true"); glyph.textContent = "✕";
      const body = document.createElement("div"); body.className = "alert-body";
      const heading = document.createElement("h3"); heading.className = "alert-title"; heading.textContent = "There is a problem";
      const list = document.createElement("ul");
      for (const field of fields.filter(field => state.errors[field.id])) {
        const item = document.createElement("li"), link = document.createElement("a");
        link.href = "#" + fieldControlId(prefix, field); link.textContent = `${field.label}: ${state.errors[field.id]}`;
        link.addEventListener("click", event => { event.preventDefault(); document.getElementById(fieldControlId(prefix, field)).focus(); });
        item.append(link); list.append(item);
      }
      body.append(heading, list); summary.append(glyph, body);
    }
    review.replaceChildren(); review.hidden = !["review", "busy", "success"].includes(state.stage);
    if (!review.hidden) {
      const caption = document.createElement("caption"); caption.className = "table-caption"; caption.textContent = "Review entered values"; review.append(caption);
      const body = document.createElement("tbody");
      for (const field of fields) {
        const row = document.createElement("tr"), label = document.createElement("th"), value = document.createElement("td");
        row.className = "table-row"; label.className = "table-cell"; value.className = "table-cell";
        label.scope = "row"; label.textContent = field.label;
        value.textContent = field.type === "checkbox" ? state.values[field.id] ? "Yes" : "No" : field.options.find(option => option.id === state.values[field.id])?.label ?? state.values[field.id];
        row.append(label, value); body.append(row);
      }
      review.append(body);
    }
    for (const button of root.querySelectorAll("button[data-event]")) {
      const event = button.dataset.event;
      if (event === "edit") button.hidden = !["review", "success"].includes(state.stage);
      if (event === "confirm") button.hidden = state.stage !== "review";
      if (event === "complete") button.hidden = state.stage !== "busy";
    }
    status.textContent = state.announcement;
    if (focus) {
      if (state.stage === "invalid") summary.focus();
      else if (state.stage === "editing") fieldset.querySelector("input,textarea,select")?.focus();
      else if (state.stage === "review") find('[data-event="confirm"]').focus();
      else if (state.stage === "busy") find('[data-event="complete"]').focus();
      else status.focus();
    }
  };
  form.addEventListener("submit", event => { event.preventDefault(); state = workflowTransition(state, { type: "submit", values: readFieldValues(fieldset, fields, prefix) }, fields, validate); draw(); });
  fieldset.addEventListener("input", () => { state = workflowTransition(state, { type: "input", values: readFieldValues(fieldset, fields, prefix) }, fields, validate); });
  root.addEventListener("click", event => {
    const button = event.target.closest("button[data-event]"); if (!button || button.dataset.event === "submit") return;
    state = workflowTransition(state, { type: button.dataset.event }, fields, validate); draw();
  });
  draw(false); root.hidden = false;
  return { getState: () => structuredClone(state) };
};
