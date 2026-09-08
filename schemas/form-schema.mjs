export const FIELD_TYPES = ["text", "textarea", "select", "checkbox", "radio"];
export const FORM_LIMITS = { bytes: 65536, fields: 20, options: 20, label: 120, help: 400, value: 2000 };
export const fieldSchema = z => z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{0,47}$/),
  type: z.enum(FIELD_TYPES), label: z.string().trim().min(1).max(FORM_LIMITS.label),
  help: z.string().max(FORM_LIMITS.help), required: z.boolean(),
  options: z.array(z.object({ id: z.string().regex(/^[a-z][a-z0-9-]{0,47}$/), label: z.string().trim().min(1).max(FORM_LIMITS.label) }).strict()).max(FORM_LIMITS.options),
}).strict().superRefine((field, ctx) => {
  const choices = ["select", "radio"].includes(field.type);
  if (choices !== (field.options.length > 0)) ctx.addIssue({ code: "custom", message: choices ? "Choice fields need at least one option" : "This field type cannot have options", path: ["options"] });
  if (new Set(field.options.map(option => option.id)).size !== field.options.length) ctx.addIssue({ code: "custom", message: "Option IDs must be unique", path: ["options"] });
});
export const formSchema = z => z.object({
  schemaVersion: z.literal(1),
  theme: z.object({ name: z.literal("j3w1-theme"), version: z.string().regex(/^\d+\.\d+\.\d+$/), profile: z.literal("default"), sourceDigest: z.string().regex(/^sha256-[A-Za-z0-9+/]+=*$/) }).strict(),
  density: z.enum(["compact", "comfortable"]),
  fields: z.array(fieldSchema(z)).max(FORM_LIMITS.fields),
}).strict().superRefine((form, ctx) => {
  if (new Set(form.fields.map(field => field.id)).size !== form.fields.length) ctx.addIssue({ code: "custom", message: "Field IDs must be unique", path: ["fields"] });
});
