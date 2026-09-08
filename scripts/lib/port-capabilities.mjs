import { z } from "zod";
import { readJson, readText, sha256, stableJson, writeOrCheck } from "./fs.mjs";
import { portCapabilitiesSchema, portImportEvidenceSchema, portCatalogueSchema, assertCapabilities } from "../../schemas/port-capabilities.mjs";

// This fingerprint binds evidence to the declared target, roles, capabilities,
// exact import artifacts and current canonical token values. No run data or
// claimed status can make its own evidence current.
export const portSubject = ({ port, mapping, capabilities, artifactDigests, tokens, tokenDigest }) => {
  const { evidence, status, ...manifest } = port;
  const { verificationPath, ...scope } = capabilities ?? {};
  return sha256(stableJson({ manifest, mapping, capabilities: scope, artifactDigests, tokens, tokenDigest }));
};
export const describePort = ({ port, mapping, capabilities = null, evidence = null, artifactDigests, tokens, tokenDigest }) => {
  assertCapabilities({ ...port, mapping }, capabilities);
  const subjectDigest = portSubject({ port, mapping, capabilities, artifactDigests, tokens, tokenDigest });
  let verification = { status: "not verified", reason: "No recorded real-import protocol bound to this subject." };
  if (evidence) {
    portImportEvidenceSchema(z).parse(evidence);
    if (evidence.subjectDigest !== subjectDigest || port.tokenDigest !== tokenDigest) verification = { status: "stale", reason: "Target, mapping, capabilities, tokens or artifact bytes changed since the recorded import." };
    else if (evidence.result !== "passed" || evidence.checks.some(check => check.result !== "passed")) verification = { status: "not verified", reason: "The import protocol includes failed or not-run checks." };
    else if (!port.testedVersions.includes(evidence.applicationVersion) || !port.targetVersions.includes(evidence.applicationVersion)) verification = { status: "not verified", reason: "The recorded application version is not declared as both targeted and tested." };
    else if (port.status !== "verified") verification = { status: "not verified", reason: "Matching import evidence exists; the manifest does not declare verified status." };
    else verification = { status: "verified", reason: evidence.limits };
  }
  const source = `ports/${port.id}/`;
  return { id: port.id, displayName: port.displayName, declaredStatus: port.status,
    format: port.format, integrationKind: capabilities?.integrationKind ?? null,
    themeVersion: port.themeVersion, themeRevision: capabilities?.themeRevision ?? null, profile: port.profile,
    targetVersions: port.targetVersions, testedVersions: port.testedVersions, os: port.os,
    verification, subjectDigest, evidencePath: capabilities?.verificationPath ? source + capabilities.verificationPath : null,
    surfaces: capabilities?.surfaces ?? Object.fromEntries(Object.entries(port.surfaces).flatMap(([state, names]) => names.map(name => [name, { state, reason: "Legacy manifest declaration; consult its maintained README for scope and limitations." }]))),
    files: port.files.map(file => ({ ...file, source: source + file.path, digest: artifactDigests[file.path] })),
    rollback: capabilities?.rollback ?? null, readme: source + "README.md",
    mappings: Object.keys(tokens).sort().map(role => ({ role, nativeKeys: mapping.mappings[role] ?? [],
      value: port.tokenDigest === tokenDigest ? tokens[role].css : null, eligibility: tokens[role].eligibility,
      state: capabilities?.roles[role]?.state ?? (mapping.mappings[role] ? "mapped" : "unmapped"),
      surface: capabilities?.roles[role]?.surface ?? null,
      reason: capabilities?.roles[role]?.reason ?? mapping.unmapped[role] ?? "Declared native-key mapping; verification is separate.",
      source: source + "mapping.json", spec: "spec/portability.md" })),
  };
};
export const readPortDescription = async (port, resolved) => {
  const base = `ports/${port.id}/`;
  const mapping = await readJson(base + port.mappingPath);
  const capabilities = port.capabilitiesPath ? portCapabilitiesSchema(z).parse(await readJson(base + port.capabilitiesPath)) : null;
  const evidence = capabilities?.verificationPath ? await readJson(base + capabilities.verificationPath) : null;
  const artifactDigests = {};
  // Importable files can be binary; normalized text hashes are inappropriate.
  const { readFile } = await import("node:fs/promises");
  const { repoRoot } = await import("./fs.mjs");
  const { default: path } = await import("node:path");
  for (const file of port.files) artifactDigests[file.path] = sha256(await readFile(path.join(repoRoot, base, file.path)));
  return describePort({ port, mapping, capabilities, evidence, artifactDigests,
    tokens: resolved.profiles[port.profile].tokens, tokenDigest: sha256(await readText("exports/tokens.resolved.json")) });
};
export const portCatalogueGenerator = {
  name: "port capability catalogue",
  async run(context) {
    const { check } = context;
    const { validatePorts } = await import("./validators.mjs");
    const resolved = await readJson("exports/tokens.resolved.json");
    const ports = [];
    for (const port of await validatePorts()) ports.push(await readPortDescription(port, resolved));
    context.portDescriptions = ports;
    const catalogue = portCatalogueSchema(z).parse({ schemaVersion: 1, theme: resolved.theme, version: resolved.version,
      sourcePolicy: "Relative paths refer to the same pinned revision as this digest-covered export. Historical references and private runs are not published ports.",
      ports });
    const file = "exports/port-capabilities.json";
    return { files: [file], changed: await writeOrCheck(file, stableJson(catalogue), { check }) ? [file] : [], note: `${ports.length} real ports` };
  },
};
