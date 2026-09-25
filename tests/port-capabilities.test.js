import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { readJson } from "../scripts/lib/fs.mjs";
import { describePort, portSubject } from "../scripts/lib/port-capabilities.mjs";
import { portCapabilitiesSchema, portCatalogueSchema, assertCapabilities, MAPPING_STATES } from "../schemas/port-capabilities.mjs";
import { fixture } from "./fixtures/port-capabilities.mjs";
import { renderPortCatalogue } from "../scripts/lib/port-presentation.mjs";
import { validatePorts } from "../scripts/lib/validators.mjs";
test("the real catalogue lists exactly the ports on disk, none verified without evidence, and synthetic mapping states never become published support", async () => {
  const { ports } = await readJson("exports/port-capabilities.json");
  assert.deepEqual(ports.map(port => port.id), (await validatePorts()).map(port => port.id));
  for (const port of ports) {
    if (!port.evidencePath) assert.equal(port.verification.status, "not verified", port.id);
    assert.ok(port.mappings.filter(row => row.state === "mapped").every(row => row.value !== null), `${port.id} token digest is current`);
  }
  const input = fixture();
  portCapabilitiesSchema(z).parse(input.capabilities);
  const described = describePort(input);
  portCatalogueSchema(z).parse({ schemaVersion: 1, theme: "j3w1-theme", version: "0.1.0", sourcePolicy: "Synthetic only", ports: [described] });
  assert.deepEqual(described.mappings.map(row => row.state), MAPPING_STATES);
  assert.equal(described.verification.status, "not verified");
  assert.equal(described.mappings[0].nativeKeys[0], "native.fg");
  assert.equal(described.mappings[0].value, input.tokens["role.0"].css);
  assert.equal(described.mappings[2].reason, "Synthetic unsupported");
  assert.throws(() => assertCapabilities({ ...input.port, mapping: input.mapping }, { ...input.capabilities, roles: {} }), /every/);
});
test("verified imports require an exact subject and stale claims do not survive relevant changes", () => {
  const input = fixture();
  const evidence = { schemaVersion: 1, method: "real-import", result: "passed", subjectDigest: portSubject(input),
    applicationVersion: "1", platform: "linux", os: "Synthetic Linux fixture", protocol: "Synthetic fixture, never real target evidence.", limits: "Test fixture only.",
    checks: [{ name: "Synthetic import", result: "passed", note: "Test only." }] };
  assert.equal(describePort({ ...input, evidence }).verification.status, "verified");
  for (const change of [
    { artifactDigests: { "dist/test.json": "changed" } }, { tokenDigest: "changed" },
    { mapping: { ...input.mapping, mappings: { "role.0": ["changed.native"] } } },
    { capabilities: { ...input.capabilities, rollback: "Changed instructions" } },
    { tokens: { ...input.tokens, "role.0": { ...input.tokens["role.0"], css: "changed" } } },
    { port: { ...input.port, targetVersions: ["2"] } },
  ]) assert.equal(describePort({ ...input, ...change, evidence }).verification.status, "stale");
  assert.equal(describePort({ ...input, evidence: { ...evidence, result: "failed" } }).verification.status, "not verified");
  assert.equal(describePort({ ...input, evidence: { ...evidence, platform: "windows" } }).verification.status, "not verified");
  assert.equal(describePort({ ...input, tokenDigest: "changed", evidence }).mappings[0].value, null);
  assert.equal(describePort({ ...input, port: { ...input.port, status: "experimental" }, evidence }).verification.status, "not verified");
});

test("port presentation escapes source data and preserves explicit mapping distinctions", () => {
  const port = describePort(fixture());
  port.displayName = "<script>not executed</script>";
  const html = renderPortCatalogue({ ports: [port] }, { revision: "a".repeat(40) });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  for (const state of MAPPING_STATES) assert.ok(html.includes(state));
  assert.match(html, /raw.githubusercontent.com/);
  assert.throws(() => renderPortCatalogue({ ports: [port] }, { revision: "main" }), /immutable/);
  assert.match(renderPortCatalogue({ ports: [] }), /data-port-empty/);
  assert.match(html, /<a href="\/theme\/ports\/test-only\/test\.json" download>Download test\.json<\/a>/);
});
test("legacy mappings stay unclassified and malformed capabilities cannot invent support", () => {
  const input = fixture();
  assert.equal(describePort({ ...input, capabilities: null }).mappings[1].state, "unmapped");
  const invalid = structuredClone(input.capabilities);
  invalid.roles["role.1"].state = "mapped";
  assert.throws(() => describePort({ ...input, capabilities: invalid }), /contradicts/);
  invalid.roles["role.1"].state = "inherited";
  invalid.surfaces.chrome.state = "unsupported";
  assert.throws(() => describePort({ ...input, capabilities: invalid }), /supported surface/);
  assert.equal(portCapabilitiesSchema(z).safeParse({ ...input.capabilities, verificationPath: "evidence/../../private.json" }).success, false);
});
