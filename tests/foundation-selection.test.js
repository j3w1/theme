import test from "node:test";
import assert from "node:assert/strict";
import { readJson } from "../scripts/lib/fs.mjs";
import { loadProfile, resolveTokens } from "../scripts/lib/tokens.mjs";

/* The two roles D-027 recedes are recorded here at their D-027 values; every
   other surface is still the D-023 selection, unchanged. */
test("D-023 reproduces the selected surfaces and preserves historical surface assignments", async () => {
  const manifest = await readJson("theme.json");
  const profile = async id => resolveTokens(await loadProfile(manifest.profiles.find(p => p.id === id).tokens));
  const current = await profile("default"), heritage = await profile("heritage-ansi");
  const surfaces = { canvas: ["#000000", "#0c0909"], sunken: ["#000000", "#0a0707"], input: ["#000000", "#0c0909"], code: ["#000000", "#0c0909"], terminal: ["#000000", "#0c0909"], chrome: ["#090707", "#100909"], default: ["#100c0c", "#160b0b"] };
  for (const [role, [selected, historical]] of Object.entries(surfaces)) {
    assert.equal(current.get(`color.surface.${role}`).resolved.hex, selected, role);
    assert.equal(heritage.get(`color.surface.${role}`).resolved.hex, historical, role);
  }
  for (const [role, expected] of Object.entries({ "text.default": "#e99499", "text.bright": "#ffa2a7", "text.prose": "#f4eeee", "interaction.selection.bg": "#531310", "interaction.focus.ring": "#e53935", "surface.raised": "#160b0b" })) {
    assert.equal(current.get(`color.${role}`).resolved.hex, expected, role);
  }
});
