import { INTEGRATION_KINDS } from "./lock.mjs";
import { safeKitPath } from "./task-kit.mjs";
import { eligibilitySchema } from "./eligibility.mjs";
export const MAPPING_STATES = ["mapped", "inherited", "unsupported", "out-of-scope", "not-implemented"];
export const SURFACE_STATES = ["supported", "inherited", "unsupported", "out-of-scope", "not-implemented"];
const reason = z => z.string().min(1);
export const portCapabilitiesSchema = z => z.object({
  schemaVersion: z.literal(1),
  integrationKind: z.enum(INTEGRATION_KINDS),
  themeRevision: z.string().regex(/^[a-f0-9]{40}$/),
  surfaces: z.record(z.string().regex(/^[a-z][a-z0-9-]*$/), z.object({ state: z.enum(SURFACE_STATES), reason: reason(z) }).strict()),
  roles: z.record(z.string(), z.object({ state: z.enum(MAPPING_STATES), surface: z.string(), reason: reason(z) }).strict()),
  rollback: z.string().min(1),
  verificationPath: z.string().refine(p => safeKitPath(p) && p.startsWith("evidence/") && p.endsWith(".json")).optional(),
}).strict();
export const portImportEvidenceSchema = z => z.object({
  schemaVersion: z.literal(1), method: z.literal("real-import"),
  result: z.enum(["passed", "failed", "not run"]), subjectDigest: z.string().regex(/^sha256-/),
  applicationVersion: z.string().min(1), platform: z.enum(["windows", "linux", "macos"]), os: z.string().min(1), protocol: z.string().min(1),
  checks: z.array(z.object({ name: z.string().min(1), result: z.enum(["passed", "failed", "not run"]), note: z.string().min(1) }).strict()).min(1),
  limits: z.string().min(1),
}).strict();
export const assertCapabilities = (port, capabilities) => {
  if (!capabilities) return;
  const roles = [...Object.keys(port.mapping.mappings), ...Object.keys(port.mapping.unmapped)].sort();
  if (JSON.stringify(roles) !== JSON.stringify(Object.keys(capabilities.roles).sort())) throw new Error("Capabilities must classify every mapped and unmapped role exactly once");
  for (const [role, detail] of Object.entries(capabilities.roles)) {
    if (!capabilities.surfaces[detail.surface]) throw new Error("Capability role needs a declared surface");
    if ((detail.state === "mapped") !== Object.hasOwn(port.mapping.mappings, role)) throw new Error("Capability classification contradicts mapping.json");
    if (detail.state === "mapped" && capabilities.surfaces[detail.surface].state !== "supported") throw new Error("Mapped roles require a supported surface");
  }
};

export const portCatalogueSchema = z => z.object({
  schemaVersion: z.literal(1), theme: z.literal("j3w1-theme"), version: z.string(), sourcePolicy: z.string(),
  ports: z.array(z.object({
    id: z.string(), displayName: z.string(), declaredStatus: z.enum(["experimental", "verified", "deprecated"]),
    format: z.string(), integrationKind: z.enum(INTEGRATION_KINDS).nullable(),
    themeVersion: z.string(), themeRevision: z.string().regex(/^[a-f0-9]{40}$/).nullable(), profile: z.string(),
    targetVersions: z.array(z.string()), testedVersions: z.array(z.string()), os: z.array(z.string()),
    verification: z.object({ status: z.enum(["not verified", "stale", "verified"]), reason: z.string() }).strict(),
    subjectDigest: z.string().regex(/^sha256-/), evidencePath: z.string().nullable(),
    surfaces: z.record(z.string(), z.object({ state: z.enum(SURFACE_STATES), reason: z.string().min(1) }).strict()),
    files: z.array(z.object({ path: z.string(), install: z.string(), source: z.string(), digest: z.string().regex(/^sha256-/) }).strict()),
    rollback: z.string().nullable(), readme: z.string(),
    mappings: z.array(z.object({
      role: z.string(), nativeKeys: z.array(z.string()), value: z.string().nullable(), eligibility: eligibilitySchema(z),
      state: z.enum([...MAPPING_STATES, "unmapped"]), surface: z.string().nullable(), reason: z.string(), source: z.string(), spec: z.string(),
    }).strict()),
  }).strict()),
}).strict();
