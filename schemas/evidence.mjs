export const CATEGORIES = ["rendering", "appearance", "keyboard", "structure", "axe", "reflow", "motion", "enhancements", "print", "screen-reader"];
export const RESULTS = ["passed", "failed", "skipped", "not run", "not applicable"];
export const scopeSchema = (z) => z.object({
  component: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum(CATEGORIES),
  states: z.array(z.string()),
  variants: z.array(z.string()),
  note: z.string().min(1),
}).strict();
export const recordSchema = (z) => z.object({
  id: z.string().regex(/^e-[a-z0-9]+$/),
  kind: z.enum(["automated", "manual"]),
  scope: scopeSchema(z),
  result: z.enum(RESULTS),
  reason: z.string().nullable(),
  reference: z.string().min(1),
  test: z.object({ file: z.string().regex(/^tests\/[a-zA-Z0-9/._-]+$/), title: z.string(), line: z.number().int().positive() }).strict().nullable(),
  environment: z.object({
    browser: z.string(), browserVersion: z.string().nullable(), os: z.string(),
    viewport: z.object({ width: z.number().positive(), height: z.number().positive() }).strict().nullable(),
    project: z.string(), profile: z.string(), density: z.string(), javaScript: z.boolean(),
  }).strict(),
}).strict().superRefine((record, ctx) => {
  if (record.result !== "passed" && !record.reason) ctx.addIssue({ code: "custom", message: "Non-passing outcomes require a reason" });
  if (record.result === "passed" && !record.environment.browserVersion) ctx.addIssue({ code: "custom", message: "A pass requires an actual browser version" });
  if (record.kind === "manual" && !record.reference.startsWith("protocol:")) ctx.addIssue({ code: "custom", message: "Manual evidence requires a protocol reference" });
});
export const evidenceSchema = (z) => z.object({
  schemaVersion: z.literal(1),
  sourceDigest: z.string().regex(/^sha256-/),
  artifactDigest: z.string().regex(/^sha256-/),
  revision: z.string().regex(/^[a-f0-9]{40}$/).nullable(),
  run: z.object({ startedAt: z.string().datetime(), completedAt: z.string().datetime(), result: z.enum(["passed", "failed", "timedout", "interrupted"]), reference: z.string().min(1) }).strict(),
  records: z.array(recordSchema(z)),
}).strict();
