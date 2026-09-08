import { fieldSchema } from "./form-schema.mjs";
export const WORKFLOW_STAGES = ["editing", "invalid", "review", "busy", "success"];
export const patternSchema = z => z.object({
  schemaVersion: z.literal(1), id: z.literal("validation-recovery"), decisionId: z.literal("D-020"),
  components: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)).min(1),
  stages: z.array(z.enum(WORKFLOW_STAGES)),
  transitions: z.array(z.object({ from: z.enum(WORKFLOW_STAGES), event: z.enum(["submit", "edit", "confirm", "complete"]), to: z.array(z.enum(WORKFLOW_STAGES)).min(1) }).strict()),
  fields: z.array(fieldSchema(z)).min(1),
  fixtures: z.object({ invalid: z.record(z.string(), z.union([z.string(), z.boolean()])), valid: z.record(z.string(), z.union([z.string(), z.boolean()])) }).strict(),
  validation: z.string().min(1), announcements: z.string().min(1), tests: z.array(z.string()), limits: z.array(z.string()).min(1),
}).strict();
export const patternExportSchema = z => patternSchema(z).extend({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  theme: z.object({ name: z.literal("j3w1-theme"), version: z.string().regex(/^\d+\.\d+\.\d+$/), profile: z.literal("default"), sourceDigest: z.string().regex(/^sha256-[A-Za-z0-9+/]+=*$/) }).strict(),
  componentDigests: z.record(z.string(), z.string().regex(/^sha256-[A-Za-z0-9+/]+=*$/)),
});
