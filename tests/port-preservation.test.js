/* Same-input renderer regression. The source prepares 3.1.0 separately;
   these calls retain the 3.0.0 input version to isolate the envelope refactor. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readJson, exists } from "../scripts/lib/fs.mjs";
import { loadResolvedProfile, toResolvedExport } from "../scripts/lib/tokens.mjs";
import { PORT_EMITTERS, assertPortArtifacts } from "../scripts/lib/port-artifacts.mjs";
import { CHATGPT_SOURCE } from "../scripts/lib/chatgpt-port.mjs";
const baseline = await readJson("tests/fixtures/port-preservation.json");
const manifest = { ...await readJson("theme.json"), version: baseline.version };
for (const fixture of baseline.files) test(`${fixture.path}: identical 3.0.0 inputs preserve the baseline bytes`, async () => {
  const id = fixture.path.split("/")[1];
  const port = { ...await readJson(`ports/${id}/port.json`), themeVersion: baseline.version };
  const profile = manifest.profiles.find(p => p.id === port.profile);
  const resolved = await loadResolvedProfile(profile.tokens);
  const exported = toResolvedExport(resolved, profile);
  const args = { manifest, port, resolved, exported, mapping: await readJson(`ports/${id}/mapping.json`),
    host: await exists(`ports/${id}/host.json`) ? await readJson(`ports/${id}/host.json`) : null,
    source: port.format === "chatgpt-appearance" ? await readJson(CHATGPT_SOURCE) : null };
  const artifacts = PORT_EMITTERS[port.format](args);
  assertPortArtifacts(port, artifacts);
  assert.equal(artifacts.length, 1);
  const bytes = Buffer.from(artifacts[0].text);
  assert.equal(bytes.length, fixture.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), fixture.sha256);
});
