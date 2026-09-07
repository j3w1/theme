import { eligibilitySchema } from "./eligibility.mjs";
import { provenanceExtensionSchema } from "./tokens.mjs";

export const sourceLocationSchema = (z) => z.object({ file: z.string(), pointer: z.string(), line: z.number().int().positive().nullable() }).strict();
export const portMappingSchema = (z) => z.object({
  schemaVersion: z.literal(1),
  mappings: z.record(z.string(), z.array(z.string().min(1)).min(1)),
  unmapped: z.record(z.string(), z.string().min(1)),
}).strict();
export const assertPortMapping = (port, roles) => {
  const declared = [...Object.keys(port.mapping.mappings), ...Object.keys(port.mapping.unmapped)];
  const required = new Set(roles);
  if (new Set(declared).size !== declared.length || declared.length !== required.size || declared.some((path) => !required.has(path))) {
    throw new Error(`Port ${port.id} must list each role exactly once as mapped or unmapped`);
  }
};
export const usageSchema = (z) => z.object({
  schemaVersion: z.literal(1), theme: z.literal("j3w1-theme"), version: z.string(),
  sourcePolicy: z.string(),
  profiles: z.record(z.string(), z.object({
    status: z.enum(["approved", "proposed", "heritage"]),
    tokens: z.record(z.string(), z.object({
      path: z.string(), group: z.string(), css: z.string(), variable: z.string(),
      description: z.string().nullable(), status: z.enum(["observed", "approved", "proposed", "heritage", "site-specific"]), deprecated: z.union([z.boolean(), z.string()]),
      eligibility: eligibilitySchema(z), source: sourceLocationSchema(z),
      provenance: provenanceExtensionSchema(z).nullable(), aliases: z.array(z.string()), usedByAliases: z.array(z.string()),
      unmappedPorts: z.array(z.object({ port: z.string(), reason: z.string(), source: sourceLocationSchema(z) }).strict()),
      uses: z.array(z.object({
        kind: z.enum(["part", "state", "prose", "contrast", "port"]),
        component: z.string().nullable(), part: z.string().nullable(), state: z.string().nullable(), variant: z.string().nullable(),
        surface: z.string().nullable(), nativeKey: z.string().nullable(), port: z.string().nullable(),
        source: sourceLocationSchema(z),
      }).strict()),
      contrast: z.array(z.object({ fg: z.string(), bg: z.string(), label: z.string().nullable(), state: z.string().nullable(), source: sourceLocationSchema(z) }).strict()),
    }).strict()),
  }).strict()),
}).strict();
