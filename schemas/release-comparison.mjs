export const RELEASE_RENDERER_VERSION = 1;
export const CHANGE_KINDS = ["token-added", "token-removed", "token-value", "token-alias", "token-status", "token-metadata", "role-renamed", "component-added", "component-removed", "component-states", "component-variants", "component-contract", "appearance-source", "decision", "portability", "profile", "port-mapping"];
export const revisionSchema = (z) => z.string().regex(/^[a-f0-9]{40}$/);
export const releasePinSchema = (z) => z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/), label: z.string().min(1),
  ref: z.string().regex(/^(?:[a-f0-9]{40}|v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/),
  revision: revisionSchema(z),
}).strict();
export const releaseCatalogueSchema = (z) => z.object({
  schemaVersion: z.literal(1), revisions: z.array(releasePinSchema(z)).min(1).max(8),
  profiles: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)).min(1),
}).strict().refine((c) => new Set(c.revisions.map((r) => r.id)).size === c.revisions.length && new Set(c.profiles).size === c.profiles.length, "Duplicate revision/profile identifiers");
export const releaseMigrationSchema = (z) => z.object({
  schemaVersion: z.literal(1), from: revisionSchema(z), to: revisionSchema(z),
  roles: z.array(z.object({ from: z.string().min(1), to: z.string().min(1), reason: z.string().min(1) }).strict()),
}).strict();
export const releaseComparisonSchema = (z) => {
  const source = z.object({ revision: revisionSchema(z), file: z.string(), pointer: z.string(), url: z.string().url() }).strict();
  const side = z.object({ ref: z.string(), revision: revisionSchema(z), version: z.string().nullable(), profile: z.string(), profileStatus: z.string().nullable(), contractSchemaVersion: z.number().int().nullable(), evidenceSchemaVersion: z.number().int().nullable(), sourceDigest: z.string(), inputs: z.record(z.string(), z.string()), availability: z.array(z.string()) }).strict();
  return z.object({
    schemaVersion: z.literal(1), rendererVersion: z.literal(RELEASE_RENDERER_VERSION), from: side, to: side,
    semanticStatus: z.enum(["compared", "unsupported"]),
    changes: z.array(z.object({ kind: z.enum(CHANGE_KINDS), key: z.string(), before: z.unknown(), after: z.unknown(), sources: z.array(source) }).strict()),
    impact: z.object({
      components: z.array(z.object({ id: z.string(), classification: z.enum(["known affected", "potentially affected"]), roles: z.array(z.string()), sources: z.array(source) }).strict()),
      ports: z.array(z.object({ id: z.string(), classification: z.literal("potentially affected"), roles: z.array(z.string()), sources: z.array(source) }).strict()),
      catalogue: z.enum(["no registered ports", "registered mappings", "unknown"]), unknownConsumers: z.literal("Unknown: consumers without registered mappings cannot be enumerated."),
    }).strict(),
    visual: z.object({ status: z.literal("not run"), description: z.string(), settings: z.object({ width: z.number().int(), height: z.number().int(), density: z.literal("comfortable"), direction: z.literal("ltr"), motion: z.literal("reduce"), javaScript: z.literal(false) }).strict() }).strict(),
    verification: z.array(z.string()), limitations: z.array(z.string()),
  }).strict();
};
