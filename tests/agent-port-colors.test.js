import assert from "node:assert/strict";
import test from "node:test";
import { readJson } from "../scripts/lib/fs.mjs";
import { loadProfiles } from "../scripts/lib/tokens.mjs";
import { colorValue, rgb } from "../scripts/lib/color.mjs";
import { ratio } from "../scripts/lib/contrast.mjs";
import { claudeTheme, codexThemeObject } from "../scripts/lib/host-install/generators.mjs";

const manifest = await readJson("theme.json");
const tokens = (await loadProfiles(manifest)).get("default");
const color = id => tokens.get(id).resolved.hex;
const ctx = {
  roles: {
    "claude-code": await readJson("ports/claude-code/host.json"),
    codex: await readJson("ports/codex/host.json"),
  },
  resolver: { color },
  theme: { version: manifest.version, profile: "default" },
};
const contrast = (fg, bg) => ratio(colorValue(fg), colorValue(bg));

test("Claude shared diff keys balance summary and word-fill contrast without dark summary counts", () => {
  // Claude 2.1.303 shares these as summary foreground and word background.
  // D-041 records the ~3:1 host compromise; normal line text still needs 4.5.
  const theme = claudeTheme(ctx).overrides;
  const bg = color("color.terminal.bg");
  assert.ok(contrast(theme.diffAddedWord, bg) >= 3, "+N foreground on terminal");
  assert.ok(contrast(theme.diffRemovedWord, bg) >= 3, "-N foreground on terminal");
  assert.ok(contrast(theme.text, theme.diffAddedWord) >= 3, "rose on shared added-word fill");
  assert.ok(contrast(theme.text, theme.diffRemovedWord) >= 3, "rose on shared removed-word fill");
  assert.equal(theme.diffAddedDimmed, theme.diffAdded, "dimmed additions retain their semantic tint");
  assert.equal(theme.diffRemovedDimmed, theme.diffRemoved, "dimmed removals retain their semantic tint");
  const [r, g, b] = rgb(theme.diffAddedWord);
  assert.ok(g > r && g > b, "additions are green");
  const [rr, rg, rb] = rgb(theme.diffRemovedWord);
  assert.ok(rr > rg && rr > rb, "removals are red");
  assert.notEqual(theme.diffAddedWord, theme.diffAdded);
  assert.notEqual(theme.diffRemovedWord, theme.diffRemoved);
  assert.ok(contrast(theme.text, theme.diffAdded) >= 4.5, "ordinary added-line text");
  assert.ok(contrast(theme.text, theme.diffRemoved) >= 4.5, "ordinary removed-line text");
});

test("Codex accent remains readable on both actual diff line tints", () => {
  const theme = codexThemeObject(ctx);
  const scope = name => theme.settings.find(rule => rule.name === name).settings;
  const fg = scope("Codex accent").foreground;
  for (const name of ["Inserted", "Deleted"]) {
    assert.ok(contrast(fg, scope(name).background) >= 4.5, name);
  }
});
