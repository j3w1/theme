import test from "node:test";
import assert from "node:assert/strict";
import { readJson } from "../scripts/lib/fs.mjs";
import { loadProfile, resolveTokens } from "../scripts/lib/tokens.mjs";

/* D-041 changes everyday surfaces and text; the explicit heritage surface
   assignments remain historical evidence rather than modern defaults. */
test("D-041 neutral surfaces and prose preserve the explicitly historical surface assignments", async () => {
  const manifest = await readJson("theme.json");
  const profile = async id => resolveTokens(await loadProfile(manifest.profiles.find(p => p.id === id).tokens));
  const current = await profile("default"), heritage = await profile("heritage-ansi");
  const surfaces = { canvas: ["#000000", "#0c0909"], sunken: ["#000000", "#0a0707"], input: ["#000000", "#0c0909"], code: ["#000000", "#0c0909"], terminal: ["#000000", "#0c0909"], chrome: ["#000000", "#100909"], default: ["#0e1014", "#160b0b"] };
  for (const [role, [selected, historical]] of Object.entries(surfaces)) {
    assert.equal(current.get(`color.surface.${role}`).resolved.hex, selected, role);
    assert.equal(heritage.get(`color.surface.${role}`).resolved.hex, historical, role);
  }
  for (const [role, expected] of Object.entries({ "text.default": "#d8dee9", "text.bright": "#f1f5f9", "text.prose": "#d8dee9", "interaction.selection.bg": "#531310", "interaction.focus.ring": "#e53935", "surface.raised": "#15181e" })) {
    assert.equal(current.get(`color.${role}`).resolved.hex, expected, role);
  }
});
