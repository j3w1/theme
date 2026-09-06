import assert from "node:assert/strict";
import test from "node:test";
import { readJson } from "../scripts/lib/fs.mjs";
import { loadResolvedProfile } from "../scripts/lib/tokens.mjs";
import { loadManifest, validateReferences } from "../scripts/lib/validators.mjs";

test("sources and catalogue validate and pin the two source revisions", async () => {
  const { sources, catalogue } = await validateReferences();
  assert.equal(sources.repositories["j3w1-web"].revision, "ffa81225149e6b6e26d0b4a850223a1781c3b973");
  assert.equal(sources.repositories["legacy-i3"].revision, "98413159d17e7e77e301b21fb688262e8b16d676");
  for (const entry of catalogue.entries) assert.equal(entry.verificationStatus, "reference-only");
});

test("every legacy site variable maps to a token that reproduces the snapshot unless a divergence is recorded", async () => {
  const snapshot = await readJson("references/j3w1-web/custom-properties.json");
  const mapping = await readJson("references/j3w1-web/mapping.json");
  const manifest = await loadManifest();
  const resolved = await loadResolvedProfile(manifest.profiles.find((p) => p.default).tokens);
  const observed = { ...snapshot.roles, ...snapshot.ansi };
  for (const [variable, hex] of Object.entries(observed)) {
    if (variable === "--xbg" || variable === "--xfg") continue;
    const entry = mapping.map[variable];
    assert.ok(entry, `${variable} is not mapped`);
    const token = resolved.get(entry.token);
    assert.ok(token, `${variable} maps to unknown token ${entry.token}`);
    if (entry.divergence) assert.notEqual(token.resolved.hex, hex, `${variable}: divergence recorded but values agree`);
    else assert.equal(token.resolved.hex, hex, `${variable} → ${entry.token}`);
  }
  for (const variable of Object.keys(snapshot.geometry)) assert.ok(mapping.siteSpecific[variable], `${variable} needs a site-specific note`);
});
