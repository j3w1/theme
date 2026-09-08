import { parseFormSchema, emptyValues } from "./form-model.mjs";
import { FIELD_TYPES, FORM_LIMITS } from "../../schemas/form-schema.mjs";
export const createBuilder = theme => ({ definition: { schemaVersion: 1, theme: { ...theme }, density: "compact", fields: [] }, nextId: 1, values: {}, errors: {} });
export const changeBuilder = (state, event) => {
  const next = structuredClone(state), fields = next.definition.fields;
  const index = fields.findIndex(field => field.id === event.id);
  if (event.type === "reset") return createBuilder(state.definition.theme);
  if (event.type === "import") {
    next.definition = parseFormSchema(event.text, state.definition.theme);
    next.values = emptyValues(next.definition.fields); next.errors = {};
    next.nextId = 1;
    while (next.definition.fields.some(field => field.id === `field-${next.nextId}`)) next.nextId++;
    return next;
  }
  if (event.type === "add") {
    if (!FIELD_TYPES.includes(event.kind) || fields.length >= FORM_LIMITS.fields) throw new Error("Choose a supported field type within the 20-field limit.");
    while (fields.some(field => field.id === `field-${next.nextId}`)) next.nextId++;
    const id = `field-${next.nextId++}`;
    fields.push({ id, type: event.kind, label: `New ${event.kind} field`, help: "", required: false, options: ["select", "radio"].includes(event.kind) ? [{ id: "option-1", label: "First option" }, { id: "option-2", label: "Second option" }] : [] });
  } else if (event.type === "density") next.definition.density = event.density;
  else {
    if (index < 0) throw new Error("Unknown field identity.");
    if (event.type === "remove") fields.splice(index, 1);
    else if (event.type === "move") {
      if (![1, -1].includes(event.direction) || index + event.direction < 0 || index + event.direction >= fields.length) throw new Error("Field cannot move further in that direction.");
      [fields[index], fields[index + event.direction]] = [fields[index + event.direction], fields[index]];
    } else if (event.type === "edit") {
      const { label, help, required, options } = event;
      fields[index] = { ...fields[index], label, help, required, options };
    } else throw new Error("Unsupported builder operation.");
  }
  // Validate the complete proposed definition before any caller can install it.
  next.definition = parseFormSchema(JSON.stringify(next.definition), state.definition.theme);
  // Definition changes start a fresh preview; entered values never become schema defaults.
  next.values = emptyValues(fields); next.errors = {};
  return next;
};
export const exportDefinition = state => JSON.stringify(state.definition, null, 2) + "\n";
