import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { tokenFileSchema } from "../schemas/tokens.mjs";
import { HERITAGE_ANSI, REQUIRED_ROLES, EXTENSION_HUES, EXTENSION_ALLOWED_GROUPS } from "../schemas/roles.mjs";
import { cssVar, flattenTree, hexToColor, loadResolvedProfile, resolveTokens, toCss, TokenError } from "../scripts/lib/tokens.mjs";
import { loadManifest, validateTokens } from "../scripts/lib/validators.mjs";

const color = (hex) => ({ $type: "color", $value: hexToColor(hex) });

test("every profile resolves every required role and keeps the heritage ANSI slots exact", async () => {
  const manifest = await loadManifest();
  for (const profile of manifest.profiles) {
    const resolved = await loadResolvedProfile(profile.tokens);
    for (const role of REQUIRED_ROLES) assert.ok(resolved.has(role), `${profile.id} lacks ${role}`);
    for (let i = 0; i < 16; i += 1) assert.equal(resolved.get(`color.primitive.ansi.${i}`).resolved.hex, HERITAGE_ANSI[i], `${profile.id} ansi ${i}`);
  }
});

test("the token validator accepts the committed sources", async () => {
  const { profiles, defaultId } = await validateTokens();
  assert.equal(defaultId, "default");
  assert.ok(profiles.get("default").size >= 300);
});

test("approved corrections and extension hues carry the expected values", async () => {
  const { profiles } = await validateTokens();
  const d = profiles.get("default");
  assert.equal(d.get("color.text.subtle").resolved.hex, "#ad7175");
  assert.equal(d.get("color.text.disabled").resolved.hex, "#8a5559");
  assert.equal(d.get("color.code.line-number").resolved.hex, "#ad7175");
  assert.equal(d.get("color.status.warning.text").resolved.hex, "#c9973f");
  assert.equal(d.get("color.status.success.text").resolved.hex, "#86a46f");
  assert.equal(d.get("color.status.info.text").resolved.hex, "#7e9ebb");
  assert.equal(d.get("color.interaction.focus.ring").resolved.hex, "#e53935");
  assert.equal(d.get("color.interaction.selection.bg").resolved.hex, "#911410");
  assert.equal(d.get("radius.none").resolved.value, 0);
  assert.equal(toCss("border", d.get("focus.ring").resolved), "1px dashed #e53935");
  const h = profiles.get("heritage-ansi");
  assert.equal(h.get("color.text.subtle").resolved.hex, "#a3676b");
  assert.ok(h.get("color.text.subtle").deprecated, "heritage text.subtle is flagged deprecated");
});

test("extension hues never leak outside status, diagnostic, diff, code, terminal and chart", async () => {
  const { profiles } = await validateTokens();
  for (const [id, resolved] of profiles) {
    for (const [path, token] of resolved) {
      if (token.type !== "color" || !path.startsWith("color.") || path.startsWith("color.primitive.")) continue;
      if (EXTENSION_HUES.includes(token.resolved.hex)) assert.ok(EXTENSION_ALLOWED_GROUPS.includes(path.split(".")[1]), `${id}: ${path}`);
    }
  }
});

test("css variable names are unique per profile and derived from paths", async () => {
  const { profiles } = await validateTokens();
  for (const resolved of profiles.values()) {
    const seen = new Set();
    for (const path of resolved.keys()) {
      const v = cssVar(path);
      assert.ok(!seen.has(v), v);
      seen.add(v);
    }
  }
  assert.equal(cssVar("color.interaction.focus.ring"), "--color-interaction-focus-ring");
});

test("the resolver detects cycles, dangling references and type mismatches", () => {
  const cycle = flattenTree({ a: { $type: "color", $value: "{b}" }, b: { $type: "color", $value: "{a}" } }, "fixture");
  assert.throws(() => resolveTokens(cycle), (e) => e instanceof TokenError && /cycle/.test(e.message));
  const dangling = flattenTree({ a: { $type: "color", $value: "{missing}" } }, "fixture");
  assert.throws(() => resolveTokens(dangling), /unknown token/);
  const mismatch = flattenTree({ a: color("#ffffff"), b: { $type: "dimension", $value: "{a}" } }, "fixture");
  assert.throws(() => resolveTokens(mismatch), /of type color/);
  const untyped = flattenTree({ a: { $value: { value: 1, unit: "px" } } }, "fixture");
  assert.throws(() => resolveTokens(untyped), /no \$type/);
});

test("group $type inheritance and composite part aliases resolve", () => {
  const flat = flattenTree(
    {
      color: { $type: "color", red: { $value: hexToColor("#e53935") } },
      width: { $type: "dimension", one: { $value: { value: 1, unit: "px" } } },
      ring: { $type: "border", $value: { color: "{color.red}", width: "{width.one}", style: "dashed" } },
    },
    "fixture",
  );
  const resolved = resolveTokens(flat);
  assert.equal(resolved.get("color.red").type, "color");
  assert.equal(toCss("border", resolved.get("ring").resolved), "1px dashed #e53935");
});

test("the structural schema rejects a hex that disagrees with its components and reserved-key typos", () => {
  const schema = tokenFileSchema(z);
  const bad = { a: { $type: "color", $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 1, hex: "#ffffff" } } };
  assert.equal(schema.safeParse(bad).success, false);
  assert.equal(schema.safeParse({ a: { $type: "color", $values: 1 } }).success, false);
  assert.equal(schema.safeParse({ "Bad Name": { $type: "number", $value: 1 } }).success, false);
  assert.equal(schema.safeParse({ ok: { $type: "number", $value: 1, $description: "d" } }).success, true);
});

test("hexToColor round-trips every heritage slot", () => {
  for (const hex of HERITAGE_ANSI) {
    const value = hexToColor(hex);
    assert.equal(value.hex, hex);
    assert.deepEqual(value.components.map((c) => Math.round(c * 255)), [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  }
});
