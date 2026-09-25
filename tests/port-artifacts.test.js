/* Every generated port file carries exactly its mapped roles, in the shape
   its importer accepts. The Warp rules are Orca 1.4.209's Import from YAML
   (hex colours; background, foreground and an ANSI slot; dark below 0.55
   luminance). The Ghostty rules are its Import from Ghostty (`key = value`
   lines, `palette = N=#hex` for N 0–15, a bare-number font size). A parse is a
   structural pass, never import evidence. */

import assert from "node:assert/strict";
import test from "node:test";
import { parse } from "yaml";
import { readJson, readText } from "../scripts/lib/fs.mjs";
import { validatePorts } from "../scripts/lib/validators.mjs";
import { GHOSTTY_KEYS, PORT_EMITTERS, WARP_YAML_KEYS, luminance } from "../scripts/lib/port-artifacts.mjs";
import { downloadsTable } from "../scripts/lib/exports.mjs";

const manifest = await readJson("theme.json");
const resolved = await readJson("exports/tokens.resolved.json");
const ports = [];
for (const port of await validatePorts()) {
  if (!PORT_EMITTERS[port.format]) continue;
  ports.push({ port, mapping: await readJson(`ports/${port.id}/mapping.json`), text: await readText(`ports/${port.id}/${port.files[0].path}`) });
}
const expected = ({ port, mapping }) => {
  const tokens = resolved.profiles[port.profile].tokens;
  const values = new Map();
  for (const [role, keys] of Object.entries(mapping.mappings)) for (const key of keys) {
    const css = tokens[role].css;
    values.set(key, key === "font-family" ? css.split(",")[0].trim().replace(/^"|"$/g, "") : key === "font-size" ? css.replace(/px$/, "") : css);
  }
  return values;
};
// Orca's Ghostty reader: skip blanks and # lines, split on the first =, repeat keys accumulate.
const ghostty = (text) => {
  const out = new Map();
  for (const line of text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))) {
    const at = line.indexOf("=");
    assert.ok(at > 0, `not a key = value line: ${line}`);
    const key = line.slice(0, at).trim(), value = line.slice(at + 1).trim();
    const palette = key === "palette" ? /^(\d+)=(#[0-9a-f]{6})$/.exec(value) : null;
    if (key === "palette") assert.ok(palette && Number(palette[1]) <= 15, `palette entry ${value}`);
    const native = palette ? `palette[${palette[1]}]` : key;
    assert.ok(!out.has(native), `${native} written twice`);
    out.set(native, palette ? palette[2] : value);
  }
  return out;
};

test("the generated ports are the Warp, Ghostty and Orca files", () => {
  assert.deepEqual(ports.map(({ port }) => `${port.id}:${port.format}`), ["ghostty:ghostty-config", "orca:ghostty-config", "warp:warp-yaml"]);
});

for (const entry of ports) {
  const { port, text } = entry;
  test(`${port.id}: every mapped role is written at its native key with the resolved value, and nothing else is`, () => {
    const want = expected(entry);
    if (port.format === "warp-yaml") {
      const theme = parse(text);
      const at = (key) => key.split(".").reduce((node, part) => node?.[part], theme);
      for (const key of WARP_YAML_KEYS) assert.equal(at(key), want.get(key), key);
      const leaves = (node, prefix = "") => Object.entries(node).flatMap(([k, v]) => typeof v === "object" ? leaves(v, `${prefix}${k}.`) : [`${prefix}${k}`]);
      assert.deepEqual(leaves(theme).filter((key) => !["name", "details"].includes(key)).sort(), [...want.keys()].sort());
      assert.equal(theme.name, "j3w1 theme");
      assert.equal(theme.details, "darker");
      // Orca's Import from YAML: hex colours, background + foreground + an ANSI slot, dark below 0.55.
      for (const key of WARP_YAML_KEYS) if (at(key)) assert.match(at(key), /^#[0-9a-f]{6}$/);
      assert.equal(WARP_YAML_KEYS.filter((key) => key.startsWith("terminal_colors.")).map(at).filter(Boolean).length, 16);
      assert.ok(luminance(theme.background) < 0.55);
    } else {
      const got = ghostty(text);
      assert.deepEqual([...got.keys()].sort(), [...want.keys()].sort());
      for (const [key, value] of want) assert.equal(got.get(key), value, key);
      for (const key of GHOSTTY_KEYS.filter((k) => got.has(k) && !k.startsWith("font-"))) assert.match(got.get(key), /^#[0-9a-f]{6}$/, key);
      for (let i = 0; i < 16; i++) assert.ok(got.has(`palette[${i}]`), `palette ${i}`);
      if (got.has("font-size")) assert.match(got.get("font-size"), /^\d+(\.\d+)?$/);
    }
  });
  test(`${port.id}: the file names its version and source and carries no timestamp`, () => {
    assert.ok(text.startsWith(`# j3w1 theme ${manifest.version}, ${port.profile} profile`));
    assert.ok(text.includes(`Generated from ports/${port.id}/mapping.json`));
    assert.doesNotMatch(text, /\d{4}-\d{2}-\d{2}/);
  });
}

test("roles a format cannot carry stay unmapped with a reason", () => {
  const byId = Object.fromEntries(ports.map((entry) => [entry.port.id, entry.mapping]));
  for (const role of ["color.terminal.selection-bg", "color.terminal.selection-text", "color.border.divider"]) assert.ok(byId.warp.unmapped[role], role);
  for (const role of ["font.line-height.terminal", "font.letter-spacing.terminal", "color.surface.terminal"]) assert.ok(byId.orca.unmapped[role], role);
  assert.ok(byId.ghostty.unmapped["font.family.mono"]);
});

test("download links pin the release tag and never a branch", () => {
  const rows = downloadsTable(manifest, ports.map(({ port }) => ({ ...port, verification: { status: "not verified" } }))).join("\n");
  for (const { port } of ports) {
    const name = port.files[0].path.split("/").at(-1);
    assert.ok(rows.includes(`https://raw.githubusercontent.com/j3w1/theme/v${manifest.version}/ports/${port.id}/${port.files[0].path}`), port.id);
    assert.ok(rows.includes(`${manifest.site.url}ports/${port.id}/${name}`), port.id);
  }
  assert.doesNotMatch(rows, /\/main\//);
});
