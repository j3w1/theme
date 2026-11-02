import { sha256Hex } from "../scripts/lib/host-install/files.mjs";
/* Same-input renderer regression. Historical token values and native mappings
   are frozen at the recorded candidate, independently of the current palette.
   The hashes in port-preservation.json remain the original byte contract. */
import assert from "node:assert/strict";
import test from "node:test";
import { readJson } from "../scripts/lib/fs.mjs";
import { PORT_EMITTERS, assertPortArtifacts } from "../scripts/lib/port-artifacts.mjs";
const baseline = await readJson("tests/fixtures/port-preservation.json");
const inputs = await readJson("tests/fixtures/port-preservation-inputs.json");
assert.equal(inputs.revision, baseline.candidate);
assert.equal(inputs.manifest.version, baseline.version);
for (const fixture of baseline.files) test(`${fixture.path}: identical 3.0.0 inputs preserve the baseline bytes`, () => {
  const id = fixture.path.split("/")[1];
  const { port, mapping, host, source } = inputs.ports[id];
  const resolved = new Map(Object.entries(inputs.tokens).map(([role, token]) => [role, { ...token, resolved: token.value }]));
  const artifacts = PORT_EMITTERS[port.format]({ manifest: inputs.manifest, port, resolved, exported: inputs.tokens, mapping, host, source });
  assertPortArtifacts(port, artifacts);
  assert.equal(artifacts.length, 1);
  const bytes = Buffer.from(artifacts[0].text);
  assert.equal(bytes.length, fixture.bytes);
  assert.equal(sha256Hex(bytes), fixture.sha256);
});
