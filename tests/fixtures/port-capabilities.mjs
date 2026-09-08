import { MAPPING_STATES } from "../../schemas/port-capabilities.mjs";
export const fixture = () => {
  const tokens = Object.fromEntries(MAPPING_STATES.map((state, i) => ["role." + i, { css: String(i), eligibility: { action: "use" } }]));
  const capabilities = { schemaVersion: 1, integrationKind: "other", themeRevision: "a".repeat(40),
    surfaces: { chrome: { state: "supported", reason: "Synthetic mapping exercise only." } },
    roles: Object.fromEntries(MAPPING_STATES.map((state, i) => ["role." + i, { state, surface: "chrome", reason: "Synthetic " + state }])),
    rollback: "Restore the synthetic original.", verificationPath: "evidence/import.json" };
  const mapping = { schemaVersion: 1, mappings: { "role.0": ["native.fg"] }, unmapped: Object.fromEntries(MAPPING_STATES.slice(1).map((state, i) => ["role." + (i + 1), state])) };
  const port = { schemaVersion: 1, id: "test-only", displayName: "Synthetic test only", status: "verified", format: "fixture", profile: "default",
    themeVersion: "0.1.0", tokenDigest: "sha256-tokens", targetVersions: ["1"], testedVersions: ["1"], os: ["linux"],
    files: [{ path: "dist/test.json", install: "Fixture only." }], evidence: [], surfaces: { supported: ["chrome"], inherited: [], unsupported: [] } };
  return { port, mapping, capabilities, tokens, tokenDigest: "sha256-tokens", artifactDigests: { "dist/test.json": "sha256-artifact" } };
};
