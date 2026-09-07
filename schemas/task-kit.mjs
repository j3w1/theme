import { INTEGRATION_KINDS } from "./lock.mjs";
export const KIT_MODES = ["standard", "minimal"];
export const kitRequestSchema = (z) => z.object({
  revision: z.string().regex(/^[a-f0-9]{40}$/),
  resolvedAt: z.string().datetime(),
  profile: z.string().min(1),
  components: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)).min(1),
  integration: z.object({ id: z.string().trim().min(1).max(120), version: z.string().trim().min(1).max(120), kind: z.enum(INTEGRATION_KINDS) }).strict(),
  task: z.string().trim().min(1).max(12000),
  mode: z.enum(KIT_MODES),
}).strict();
export const safeKitPath = (name) => typeof name === "string" && name.split("/").every((part) => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(part) && !part.endsWith(".") && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part));
export const taskInputsSchema = (z) => z.object({
  schemaVersion: z.literal(1), theme: z.literal("j3w1-theme"), version: z.string(), profile: z.string(),
  sharedFiles: z.array(z.string()), sharedTokens: z.array(z.string()), usageDigest: z.string(),
  tokenDependencies: z.record(z.string(), z.array(z.string())),
  files: z.record(z.string().refine(safeKitPath), z.string().regex(/^sha256-[A-Za-z0-9+/=]+$/)),
  components: z.record(z.string(), z.object({ title: z.string(), files: z.array(z.string()), tokens: z.array(z.string()), recipeFiles: z.array(z.string()), recipeTokens: z.array(z.string()) }).strict()),
}).strict();
