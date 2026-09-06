import assert from "node:assert/strict";
import test from "node:test";
import { composite, evaluatePair, ratio, round2 } from "../scripts/lib/contrast.mjs";
import { hexToColor } from "../scripts/lib/tokens.mjs";
import { loadDeclaredPairs, validateContrast, validateTokens } from "../scripts/lib/validators.mjs";

const c = (hex, alpha) => hexToColor(hex, alpha);

test("the engine reproduces known ratios and decides on the unrounded value", () => {
  assert.equal(round2(ratio(c("#000000"), c("#ffffff"))), 21);
  assert.equal(evaluatePair({ fg: c("#777777"), bg: c("#ffffff") }).pass, false, "#777777 on white is 4.48:1 and fails");
  assert.equal(evaluatePair({ fg: c("#767676"), bg: c("#ffffff") }).pass, true, "#767676 on white is 4.54:1 and passes");
  const site = [
    ["#bd787d", "#0c0909", 5.81],
    ["#a3676b", "#0c0909", 4.45],
    ["#7d1310", "#0c0909", 1.86],
    ["#e99499", "#0c0909", 8.65],
    ["#f4eeee", "#911410", 7.92],
    ["#f9faf9", "#dc282e", 4.58],
    ["#ad7175", "#0c0909", 5.1],
    ["#8a5559", "#0c0909", 3.33],
    ["#c9973f", "#0c0909", 7.54],
    ["#86a46f", "#0c0909", 7.13],
    ["#7e9ebb", "#0c0909", 7.08],
    ["#e53935", "#911410", 2.15],
  ];
  for (const [fg, bg, expected] of site) assert.equal(round2(ratio(c(fg), c(bg))), expected, `${fg} on ${bg}`);
});

test("translucent colours are composited over the surface before measuring", () => {
  const over = composite(c("#000000", 0.65), c("#ffffff"));
  assert.equal(over.hex, "#595959");
  const pair = evaluatePair({ fg: c("#ffffff"), bg: c("#000000", 0.65), surface: c("#ffffff") });
  assert.equal(pair.bg, "#595959");
});

test("every declared pair passes or carries a waiver, and waivers are decorative only", async () => {
  const tokens = await validateTokens();
  const pairs = await validateContrast({ ...tokens, components: [] });
  assert.ok(pairs.length >= 50);
  for (const pair of pairs) {
    if (!pair.pass) {
      assert.ok(pair.waiver, `${pair.label} fails without a waiver`);
      assert.equal(pair.kind, "ui", "only decorative graphics may be waived");
    }
  }
  const declared = await loadDeclaredPairs({ ...tokens, components: [] });
  assert.equal(declared.length, pairs.length);
});
