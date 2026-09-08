import { z } from "zod";
import { formSchema, FORM_LIMITS } from "../../schemas/form-schema.mjs";
export const parseFormSchema = (text, theme) => {
  if (new TextEncoder().encode(text).length > FORM_LIMITS.bytes) throw new Error("Form schema exceeds the 64 KiB limit");
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("Form schema must be valid JSON"); }
  const result = formSchema(z).safeParse(data);
  if (!result.success) throw new Error(result.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; "));
  for (const key of Object.keys(theme)) if (result.data.theme[key] !== theme[key]) throw new Error("Form schema belongs to a different theme content revision; no automatic migration is performed");
  return result.data;
};
export const emptyValues = fields => Object.fromEntries(fields.map(field => [field.id, field.type === "checkbox" ? false : ""]));
export const validateFields = (fields, values) => {
  const errors = Object.create(null);
  for (const field of fields) {
    const value = Object.hasOwn(values, field.id) ? values[field.id] : (field.type === "checkbox" ? false : "");
    if (field.type === "checkbox") {
      if (typeof value !== "boolean") errors[field.id] = "Choose checked or unchecked.";
      else if (field.required && !value) errors[field.id] = `Confirm ${field.label}.`;
    } else if (typeof value !== "string" || value.length > FORM_LIMITS.value) errors[field.id] = `Use at most ${FORM_LIMITS.value} characters.`;
    else if (field.required && !value.trim()) errors[field.id] = `Enter ${field.label}.`;
    else if (["select", "radio"].includes(field.type) && value && !field.options.some(option => option.id === value)) errors[field.id] = `Choose an available ${field.label} option.`;
  }
  return errors;
};
export const initialWorkflow = fields => ({ stage: "editing", values: emptyValues(fields), errors: {}, announcement: "" });
export const workflowTransition = (state, event, fields, validate = validateFields) => {
  if (event.type === "reset") return initialWorkflow(fields);
  if (event.type === "input" && ["editing", "invalid"].includes(state.stage)) return { ...state, values: { ...event.values } };
  if (event.type === "submit" && ["editing", "invalid"].includes(state.stage)) {
    const values = { ...event.values }, errors = validate(fields, values), count = Object.keys(errors).length;
    return { stage: count ? "invalid" : "review", values, errors, announcement: count ? `${count} ${count === 1 ? "field needs" : "fields need"} attention.` : "Review your values before the simulated save." };
  }
  if (event.type === "edit" && ["review", "success"].includes(state.stage)) return { ...state, stage: "editing", errors: {}, announcement: "Editing. Your values are preserved." };
  if (event.type === "confirm" && state.stage === "review") return { ...state, stage: "busy", announcement: "Simulated save is pending. Nothing has been sent." };
  if (event.type === "complete" && state.stage === "busy") return { ...state, stage: "success", announcement: "Simulated save completed. Nothing was sent or stored." };
  throw new Error(`Unsupported workflow transition: ${state.stage} / ${event.type}`);
};
