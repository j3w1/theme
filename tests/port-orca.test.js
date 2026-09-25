/* The Orca port's YAML carries exactly its mapped roles, in the shape Orca's
   Import from YAML accepts (Orca 1.4.209: hex colours; background, foreground
   and at least one ANSI slot; dark when background luminance < 0.55). A parse
   is a structural pass, never import evidence. */

import assert from "node:assert/strict";
import test from "node:test";
import { parse } from "yaml";
import { readJson, readText } from "../scripts/lib/fs.mjs";
import { WARP_YAML_KEYS } from "../scripts/lib/port-artifacts.mjs";
import { downloadsTable } from "../scripts/lib/exports.mjs";

const manifest = await readJson("theme.json");
const port = await readJson("ports/orca/port.json");
const mapping = await readJson("ports/orca/mapping.json");
const tokens = (await readJson("exports/tokens.resolved.json")).profiles[port.profile].tokens;
const text = await readText("ports/orca/dist/j3w1-theme.yaml");
const theme = parse(text);
const at = (key) => key.split(".").reduce((node, part) => node?.[part], theme);
const luminance = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);

test("every mapped role is written at its native key with the resolved value, and nothing else is", () => {
  const written = new Map();
  for (const [role, keys] of Object.entries(mapping.mappings)) for (const key of keys) written.set(key, tokens[role].css);
  for (const key of WARP_YAML_KEYS) assert.equal(at(key), written.get(key), key);
  const leaves = (node, prefix = "") => Object.entries(node).flatMap(([k, v]) => typeof v === "object" ? leaves(v, `${prefix}${k}.`) : [`${prefix}${k}`]);
  assert.deepEqual(leaves(theme).filter((key) => key !== "name").sort(), [...written.keys()].sort());
  assert.equal(theme.name, "j3w1 theme");
});

test("the file meets Orca's import rule and is classified as a dark theme", () => {
  const colours = WARP_YAML_KEYS.map(at).filter(Boolean);
  for (const value of colours) assert.match(value, /^#[0-9a-f]{6}$/);
  assert.ok(theme.background && theme.foreground);
  assert.equal(WARP_YAML_KEYS.filter((key) => key.startsWith("terminal_colors.")).map(at).filter(Boolean).length, 16);
  assert.ok(luminance(theme.background) < 0.55);
  assert.equal(theme.background, tokens["color.terminal.ansi.0"].css, "background equals ANSI 0");
});

test("roles Orca's YAML cannot carry stay unmapped with a reason", () => {
  for (const role of ["color.terminal.selection-bg", "color.terminal.selection-text", "color.border.divider", "color.surface.terminal"]) assert.ok(mapping.unmapped[role], role);
  assert.doesNotMatch(text, /selection/);
});

test("the file names its version and source and carries no timestamp", () => {
  assert.ok(text.startsWith(`# j3w1 theme ${manifest.version}, ${port.profile} profile`));
  assert.match(text, /Generated from ports\/orca\/mapping\.json/);
  assert.doesNotMatch(text, /\d{4}-\d{2}-\d{2}/);
});

test("download links pin the release tag and never a branch", () => {
  const rows = downloadsTable(manifest, [{ ...port, verification: { status: "not verified" } }]).join("\n");
  assert.ok(rows.includes(`https://raw.githubusercontent.com/j3w1/theme/v${manifest.version}/ports/orca/dist/j3w1-theme.yaml`));
  assert.ok(rows.includes(`${manifest.site.url}ports/orca/j3w1-theme.yaml`));
  assert.doesNotMatch(rows, /\/main\//);
});
