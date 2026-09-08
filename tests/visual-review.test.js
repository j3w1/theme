import test from "node:test";
import assert from "node:assert/strict";
import { reviewBaseline, applyOverlay, evaluateCandidate, colorValue, perceptual } from "../scripts/lib/visual-review.mjs";
import { readText } from "../scripts/lib/fs.mjs";

const baseline = await reviewBaseline();
const input = changes => ({ schemaVersion: 1, id: "balanced", baselineDigest: baseline.baselineDigest,
  summary: "Temporary test overlay with explicit dependencies.", changes });
const entry = value => ({ value, reason: "Explicit analytical test value.", tradeoff: "Test-only input, never a design approval." });

test("candidate alias resolution is isolated from baseline and preserves ANSI", () => {
  const before = structuredClone([...baseline.resolved]);
  const { resolved } = applyOverlay(baseline.flat, input({ "color.primitive.rose.700": entry("#eebac2"), "color.primitive.red.650": entry("#ff7788") }), baseline.baselineDigest);
  assert.equal(resolved.get("color.text.default").resolved.hex, "#eebac2");
  assert.deepEqual([...baseline.resolved], before);
  for (let i = 0; i < 16; i++) assert.deepEqual(resolved.get(`color.primitive.ansi.${i}`).resolved, baseline.resolved.get(`color.primitive.ansi.${i}`).resolved);
});

test("unknown roles, history mutation, stale inputs and malformed color fail closed", () => {
  for (const role of ["color.new-role", "font.size.ui-md", "color.primitive.ansi.0", "color.primitive.alpha.red-6"]) {
    assert.throws(() => applyOverlay(baseline.flat, input({ [role]: entry("#eebac2") }), baseline.baselineDigest));
  }
  assert.throws(() => applyOverlay(baseline.flat, { ...input({}), baselineDigest: "sha256-stale" }, baseline.baselineDigest));
  assert.throws(() => applyOverlay(baseline.flat, input({ "color.text.default": entry("url(remote)") }), baseline.baselineDigest));
});

test("contrast failure is reported with source relationships, never silently fixed", async () => {
  const result = await evaluateCandidate(baseline, input({ "color.text.default": entry("#100909") }));
  assert.ok(result.report.failures.some(p => p.fgPath === "color.text.default"));
  assert.equal(result.resolved.get("color.text.default").resolved.hex, "#100909");
  assert.equal(result.report.waiverChanges, 0);
  assert.ok(result.report.changes[0].components.length > 0);
});

test("perceptual coordinates use standard sRGB endpoints and neutral hue is undefined", () => {
  const black = perceptual(colorValue("#000000")), white = perceptual(colorValue("#ffffff"));
  assert.equal(black.L, 0);
  assert.ok(Math.abs(white.L - 1) < 0.000001);
  assert.equal(black.h, null);
  assert.equal(white.h, null);
});

test("review entry point and local overlays are absent from public build integration", async () => {
  const astro = await readText("astro.config.mjs");
  const packageJson = JSON.parse(await readText("package.json"));
  assert.doesNotMatch(astro, /visual-review|phase6a/);
  assert.equal(packageJson.scripts.build, "astro build --force");
  assert.match(await readText(".gitignore"), /\/\.cache\//);
});
