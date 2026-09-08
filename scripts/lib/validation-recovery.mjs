import { validateFields } from "./form-model.mjs";
export const validateWorkstation = (fields, values) => {
  const errors = validateFields(fields, values);
  for (const id of ["name", "hostname"]) if (!errors[id] && values[id]?.trim() === "ws-07") errors[id] = `The local example already contains ws-07. Choose another ${id}.`;
  if (!errors.hostname && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.hostname)) errors.hostname = "Use lowercase letters, digits and single hyphens between them.";
  return errors;
};
