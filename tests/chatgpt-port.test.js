import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildChatgptPresets } from "../scripts/lib/chatgpt-port.mjs";
import { parseCodexTheme, chatgptPresetsSchema, CODEX_THEME_PREFIX } from "../schemas/chatgpt.mjs";

const source = JSON.parse(readFileSync("ports/chatgpt/src/presets.json", "utf8"));
const built = JSON.parse(readFileSync("ports/chatgpt/dist/presets.json", "utf8"));
const manifest = JSON.parse(readFileSync("theme.json", "utf8"));
const tokens = JSON.parse(readFileSync("exports/tokens.resolved.json", "utf8")).profiles.default.tokens;
const byId = Object.fromEntries(built.presets.map((p) => [p.id, p]));
const setting = (id, name) => byId[id].settings.find((r) => r.setting === name);

test("Signature: rose text.bright on true black, accent focus ring, contrast 46", () => {
  assert.equal(setting("signature", "Foreground").source, "color.text.bright");
  assert.equal(setting("signature", "Foreground").value, tokens["color.text.bright"].value.hex);
  assert.equal(setting("signature", "Background").value, tokens["color.surface.canvas"].value.hex);
  assert.equal(setting("signature", "Accent").value, tokens["color.interaction.focus.ring"].value.hex);
  assert.equal(setting("signature", "Contrast").value, "46");
  assert.equal(byId.signature.recommended, true);
});

test("Reading: the same with text.default and contrast 52", () => {
  assert.equal(setting("reading", "Foreground").source, "color.text.default");
  assert.equal(setting("reading", "Foreground").value, tokens["color.text.default"].value.hex);
  assert.equal(setting("reading", "Contrast").value, "52");
  for (const name of ["Mode", "Theme", "Accent", "Background", "UI font size", "Code font size", "Reduce motion", "Separate light and dark", "Diff markers"]) {
    assert.deepEqual(setting("reading", name), setting("signature", name), name);
  }
});

test("host calibration is exact and marked as calibration, not a theme role", () => {
  for (const id of ["signature", "reading"]) {
    for (const [name, value] of [["Mode", "Dark"], ["Theme", "ChatGPT"], ["Reduce motion", "System"], ["Separate light and dark", "Off"], ["Diff markers", "+/-"]]) {
      assert.deepEqual(setting(id, name), { setting: name, value, source: "calibration" });
    }
    assert.equal(setting(id, "UI font size").value, "15 px");
    assert.equal(setting(id, "Code font size").value, "13 px");
  }
});

test("the presets are generated from the source, deterministically", () => {
  const exported = Object.fromEntries(Object.entries(tokens));
  const again = buildChatgptPresets(source, exported, manifest);
  assert.deepEqual(again, built);
  assert.deepEqual(buildChatgptPresets(source, exported, manifest), again);
});

test("the import string format fails closed on a changed, missing or extra field", () => {
  const good = byId.signature.importString;
  assert.ok(good.startsWith(CODEX_THEME_PREFIX));
  const payload = parseCodexTheme(good);
  const bad = (mutate) => { const p = structuredClone(payload); mutate(p); return `${CODEX_THEME_PREFIX}${JSON.stringify(p)}`; };
  assert.throws(() => parseCodexTheme(bad((p) => { p.theme.newField = 1; })));
  assert.throws(() => parseCodexTheme(bad((p) => { delete p.theme.ink; })));
  assert.throws(() => parseCodexTheme(bad((p) => { p.theme.accent = "red"; })));
  assert.throws(() => parseCodexTheme(bad((p) => { p.variant = "sepia"; })));
  assert.throws(() => parseCodexTheme(good.replace(CODEX_THEME_PREFIX, "codex-theme-v2:")));
  assert.throws(() => chatgptPresetsSchema.parse({ ...source, extra: true }));
});

test("the README shows exactly the generated tables and strings", () => {
  const readme = readFileSync("ports/chatgpt/README.md", "utf8");
  for (const p of built.presets) {
    assert.ok(readme.includes(p.importString), `${p.id} import string`);
    for (const row of p.settings) assert.ok(readme.includes(`| ${row.setting} |`), `${p.id} ${row.setting}`);
  }
  assert.match(readme, /experimental/i);
  assert.match(readme, /rollout/);
});
