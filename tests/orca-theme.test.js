import assert from "node:assert/strict";
import test from "node:test";
import { readJson, readText } from "../scripts/lib/fs.mjs";

const mapping = await readJson("ports/orca/mapping.json");
const source = await readJson("ports/orca/src/theme.json");
const tokens = (await readJson("exports/tokens.resolved.json")).profiles.default.tokens;
const app = await readJson("ports/orca/dist/app-theme.json");
const terminal = await readJson("ports/orca/dist/terminal-theme.json");

test("Orca app, syntax, terminal and legacy palette carry every mapped role exactly once", async () => {
  const actual = new Map();
  for (const [key, value] of Object.entries(app.tokens)) actual.set(`app.tokens.${key}`, value);
  for (const rule of app.tokenColors) actual.set(`app.tokenColors.${rule.name}.foreground`, rule.settings.foreground);
  for (const [key, value] of Object.entries(terminal.terminal)) actual.set(`terminal.${key}`, value);
  for (const line of (await readText("ports/orca/dist/config.ghostty")).split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const [, key, value] = /^([^=]+?)\s*=\s*(.+)$/.exec(line);
    const palette = key.trim() === "palette" ? /^(\d+)=(.+)$/.exec(value) : null;
    actual.set(palette ? `palette[${palette[1]}]` : key.trim(), palette ? palette[2] : value);
  }
  const expected = new Map();
  for (const [role, keys] of Object.entries(mapping.mappings)) for (const key of keys) {
    assert.ok(!expected.has(key), `${key} is mapped once`);
    const css = tokens[role].css;
    expected.set(key, key === "font-family" ? css.split(",")[0].trim().replace(/^"|"$/g, "") : key === "font-size" ? css.replace(/px$/, "") : css);
  }
  assert.deepEqual([...actual].sort(), [...expected].sort());
});

test("Orca plugin uses only content contributions and preserves scope selectors and styles", async () => {
  const plugin = await readJson("ports/orca/dist/orca-plugin.json");
  assert.equal(plugin.execution, "data");
  assert.equal(plugin.engines.orca, ">=1.4.246");
  assert.equal(plugin.main, undefined);
  assert.equal(plugin.capabilities, undefined);
  assert.deepEqual(Object.keys(plugin.contributes).sort(), ["terminalThemes", "themes"]);
  assert.equal(app.base, "dark");
  assert.equal(terminal.mode, "dark");
  assert.deepEqual(Object.keys(app.tokens), source.appTokens);
  assert.deepEqual(Object.keys(terminal.terminal), source.terminalKeys);
  for (const expected of source.scopes) {
    const rule = app.tokenColors.find(rule => rule.name === expected.name);
    assert.deepEqual(rule.scope, expected.scope);
    assert.equal(rule.settings.fontStyle, expected.fontStyle);
  }
});
