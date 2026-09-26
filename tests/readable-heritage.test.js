import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { HERITAGE_ANSI } from "../schemas/roles.mjs";

/* D-029: the default profile carries the readable heritage sixteen and two
   lifted syntax reds; heritage-ansi keeps the historical values exactly. */

const resolved = JSON.parse(await readFile(new URL("../exports/tokens.resolved.json", import.meta.url), "utf8"));
const hexOf = (profile, path) => {
  const token = resolved.profiles[profile].tokens[path];
  assert.ok(token, `${profile}: ${path} exists`);
  return token.value.hex;
};
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const HERITAGE_SYNTAX = { keyword: "#f73f35", tag: "#f73f35", property: "#e53935", heading: "#e53935", invalid: "#e53935" };

test("heritage-ansi keeps every terminal slot and the lifted syntax reds at their historical values", () => {
  for (let i = 0; i < 16; i += 1) assert.equal(hexOf("heritage-ansi", `color.terminal.ansi.${i}`), HERITAGE_ANSI[i], `slot ${i}`);
  for (const [role, hex] of Object.entries(HERITAGE_SYNTAX)) assert.equal(hexOf("heritage-ansi", `color.code.syntax.${role}`), hex, role);
});

test("the default profile's terminal slots reach the text floor, except the background and the dim tier", () => {
  const bg = hexOf("default", "color.terminal.bg");
  for (let i = 1; i < 16; i += 1) {
    const ratio = contrast(hexOf("default", `color.terminal.ansi.${i}`), bg);
    if (i === 8) assert.ok(ratio >= 3 && ratio < 4.5, `slot 8 is the dim tier (${ratio.toFixed(2)}:1)`);
    else assert.ok(ratio >= 4.5, `slot ${i} measures ${ratio.toFixed(2)}:1`);
  }
});

test("the lift keeps the heritage light-to-dark order of the changed slots", () => {
  const changed = [1, 4, 6, 8, 9, 10, 12, 13, 14, 15];
  const bg = hexOf("default", "color.terminal.bg");
  const order = (profile) => [...changed].sort((a, b) => contrast(hexOf(profile, `color.terminal.ansi.${a}`), bg) - contrast(hexOf(profile, `color.terminal.ansi.${b}`), bg));
  const heritage = order("heritage-ansi");
  const lifted = order("default");
  assert.equal(lifted[0], 8, "slot 8 stays the darkest");
  assert.deepEqual(lifted.slice(-3).sort(), heritage.slice(-3).sort(), "the brightest heritage slots stay the brightest");
});

test("the lifted syntax reds stay readable inside an editor selection", () => {
  const selection = hexOf("default", "color.code.selection-bg");
  const code = hexOf("default", "color.code.bg");
  for (const role of Object.keys(HERITAGE_SYNTAX)) {
    const hex = hexOf("default", `color.code.syntax.${role}`);
    assert.ok(contrast(hex, selection) >= 4.5, `${role} in the selection: ${contrast(hex, selection).toFixed(2)}:1`);
    assert.ok(contrast(hex, code) >= 5.5, `${role} on the editor: ${contrast(hex, code).toFixed(2)}:1`);
  }
});

test("the terminal prompt's path segment text reads on the brighter slot 4", () => {
  assert.ok(contrast(hexOf("default", "color.terminal.bg"), hexOf("default", "color.terminal.ansi.4")) >= 4.5);
});

test("interface reds are unchanged by D-029", () => {
  for (const [path, hex] of Object.entries({ "color.text.accent": "#e53935", "color.text.accent-strong": "#f73f35", "color.text.link": "#f73f35", "color.interaction.focus.ring": "#e53935", "color.border.active": "#e53935" })) {
    assert.equal(hexOf("default", path), hex, path);
  }
});
