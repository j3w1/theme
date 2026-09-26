/* Every generated port file carries exactly its mapped roles, in the shape
   its importer accepts. The Warp rules are Orca 1.4.209's Import from YAML
   (hex colours; background, foreground and an ANSI slot; dark below 0.55
   luminance). The Ghostty rules are its Import from Ghostty (`key = value`
   lines, `palette = N=#hex` for N 0–15, a bare-number font size). The Claude
   Code file is a custom theme (name, base, overrides of hex colours); the
   Codex file is a TextMate property list. A parse is a structural pass,
   never import evidence. */

import { parseCodexTheme } from "../schemas/chatgpt.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { parse } from "yaml";
import { readJson, readText } from "../scripts/lib/fs.mjs";
import { validatePorts } from "../scripts/lib/validators.mjs";
import { assertHostMapping, GHOSTTY_KEYS, hostEntries, PORT_EMITTERS, WARP_YAML_KEYS, luminance } from "../scripts/lib/port-artifacts.mjs";
import { parsePlist } from "../scripts/lib/host-install/plist.mjs";
import { downloadsTable } from "../scripts/lib/exports.mjs";
import { PORT_FORMATS } from "../schemas/port.mjs";

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

/* A TextMate theme as native key -> value: `globals.<key>` and `<scope
   name>.<setting>`, colours only. */
const tmValues = (text) => {
  const theme = parsePlist(text);
  const [globals, ...rules] = theme.settings;
  const out = new Map(Object.entries(globals.settings).map(([k, v]) => [`globals.${k}`, v]));
  for (const rule of rules) for (const [k, v] of Object.entries(rule.settings)) if (k !== "fontStyle") out.set(`${rule.name}.${k}`, v);
  return { theme, values: out };
};

test("the generated ports are the ChatGPT, Claude Code, Codex, Ghostty, Orca and Warp files", () => {
  assert.deepEqual(ports.map(({ port }) => `${port.id}:${port.format}`), ["chatgpt:chatgpt-appearance", "claude-code:claude-theme-json", "codex:codex-tmtheme", "ghostty:ghostty-config", "orca:ghostty-config", "warp:warp-yaml"]);
  for (const format of Object.keys(PORT_EMITTERS)) assert.ok(PORT_FORMATS.includes(format), `${format} is in the closed list of port formats`);
});

for (const entry of ports) {
  const { port, text } = entry;
  test(`${port.id}: every mapped role is written at its native key with the resolved value, and nothing else is`, () => {
    if (port.format === "chatgpt-appearance") {
      const built = JSON.parse(text);
      const tokens = resolved.profiles[port.profile].tokens;
      const value = (role) => tokens[role].value.hex?.toLowerCase() ?? `${tokens[role].value.value} px`;
      const roleOf = (setting) => Object.entries(entry.mapping.mappings).filter(([, keys]) => keys.some((k) => k === setting || k.startsWith(`${setting} (`))).map(([role]) => role);
      for (const preset of built.presets) {
        for (const row of preset.settings.filter((r) => r.source !== "calibration")) {
          assert.ok(roleOf(row.setting).includes(row.source), `${preset.id}: ${row.setting} comes from a mapped role`);
          assert.equal(row.value, value(row.source), `${preset.id}: ${row.setting}`);
        }
        const payload = parseCodexTheme(preset.importString);
        assert.equal(payload.theme.ink, preset.settings.find((r) => r.setting === "Foreground").value);
        assert.equal(payload.theme.surface, preset.settings.find((r) => r.setting === "Background").value);
      }
      return;
    }
    const want = expected(entry);
    if (port.format === "claude-theme-json") {
      const theme = JSON.parse(text);
      assert.deepEqual(Object.keys(theme), ["name", "base", "overrides"]);
      assert.equal(theme.name, "j3w1");
      assert.equal(theme.base, "dark-ansi");
      assert.deepEqual(Object.keys(theme.overrides).sort(), [...want.keys()].sort());
      for (const [key, value] of want) assert.equal(theme.overrides[key], value, key);
      for (const value of Object.values(theme.overrides)) assert.match(value, /^#[0-9a-f]{6}$/);
    } else if (port.format === "codex-tmtheme") {
      const { theme, values } = tmValues(text);
      assert.equal(theme.name, "j3w1");
      for (const [key, value] of want) assert.equal(values.get(key), value, key);
      // Anything else the file carries belongs to an unmapped role whose reason names the key.
      const tokens = resolved.profiles[port.profile].tokens;
      for (const [key, value] of values) {
        if (want.has(key)) continue;
        const role = Object.entries(entry.mapping.unmapped).find(([, reason]) => reason.includes(key))?.[0];
        assert.ok(role, `${key} is written but neither mapped nor named by an unmapped reason`);
        assert.equal(value, tokens[role].css, key);
      }
      for (const value of values.values()) assert.match(value, /^#[0-9a-f]{6}$/);
    } else if (port.format === "warp-yaml") {
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
    if (port.format === "chatgpt-appearance") {
      assert.equal(JSON.parse(text).version, manifest.version);
    } else if (port.format === "claude-theme-json") {
      // JSON has no comments and Claude Code's theme takes name, base and
      // overrides only, so this file cannot name its version; the
      // shape test above pins its keys instead.
      assert.deepEqual(Object.keys(JSON.parse(text)), ["name", "base", "overrides"]);
    } else if (port.format === "codex-tmtheme") {
      assert.ok(tmValues(text).theme.comment.startsWith(`j3w1 theme ${manifest.version}, ${port.profile} profile, for Codex CLI. Generated from ports/${port.id}/host.json`));
    } else {
      assert.ok(text.startsWith(`# j3w1 theme ${manifest.version}, ${port.profile} profile`));
      assert.ok(text.includes(`Generated from ports/${port.id}/mapping.json`));
    }
    assert.doesNotMatch(text, /\d{4}-\d{2}-\d{2}/);
    assert.doesNotMatch(text, /\b[0-9a-f]{40}\b/, "no commit");
  });
}

test("roles a format cannot carry stay unmapped with a reason", () => {
  const byId = Object.fromEntries(ports.map((entry) => [entry.port.id, entry.mapping]));
  for (const role of ["color.terminal.selection-bg", "color.terminal.selection-text", "color.border.divider"]) assert.ok(byId.warp.unmapped[role], role);
  for (const role of ["font.line-height.terminal", "font.letter-spacing.terminal", "color.surface.terminal"]) assert.ok(byId.orca.unmapped[role], role);
  assert.ok(byId.ghostty.unmapped["font.family.mono"]);
  for (const role of ["color.code.syntax.keyword", "color.text.link", "color.terminal.ansi.1"]) assert.ok(byId["claude-code"].unmapped[role], role);
  for (const role of ["color.terminal.ansi.1", "color.diff.added.gutter"]) assert.ok(byId.codex.unmapped[role], role);
  assert.match(byId.codex.unmapped["color.code.bg"], /globals\.background/, "a carried global names its key");
});

test("mapping.json and host.json agree key for key, and a disagreement fails generation", async () => {
  for (const { port, mapping } of ports.filter(({ port }) => ["claude-theme-json", "codex-tmtheme"].includes(port.format))) {
    const host = await readJson(`ports/${port.id}/host.json`);
    const entries = hostEntries(port.format, host);
    assert.doesNotThrow(() => assertHostMapping(port, mapping, entries));
    const [role, keys] = Object.entries(mapping.mappings)[0];
    const moved = structuredClone(mapping);
    moved.mappings[role] = [...keys, "notAKey"];
    assert.throws(() => assertHostMapping(port, moved, entries), /host\.json writes nothing there/);
    const dropped = structuredClone(mapping);
    delete dropped.mappings[role];
    dropped.unmapped[role] = "Dropped without naming the key.";
    assert.throws(() => assertHostMapping(port, dropped, entries), /neither maps nor names in the role's unmapped reason/);
  }
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

test("an unmapped reason names a carried key only as a whole key (review r3b)", async () => {
  const { namesKey } = await import("../scripts/lib/port-artifacts.mjs");
  assert.ok(namesKey("carries `globals.gutter` for editors", "globals.gutter"));
  assert.ok(namesKey("The file carries globals.gutter.", "globals.gutter"));
  for (const [reason, key] of [["names globals.gutterForeground", "globals.gutter"], ["names rainbow_blue_shimmer", "rainbow_blue"], ["names clawd_body_x", "clawd_body"], ["names globals.gutter.foreground", "globals.gutter"], ["names globals.gutter-x", "globals.gutter"]]) {
    assert.equal(namesKey(reason, key), false, `${key} in "${reason}"`);
  }
});
