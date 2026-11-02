import test from "node:test";
import assert from "node:assert/strict";
import { loadTokenExports } from "./helpers/tokens.mjs";
import { hexOf as tokenHex } from "../scripts/lib/color.mjs";
import { contrastHex as contrast } from "../scripts/lib/contrast.mjs";
import { HERITAGE_ANSI } from "../schemas/roles.mjs";

/* D-041: the default profile carries semantic ANSI colours and hued syntax;
   heritage-ansi keeps the historical values exactly. */

const resolved = await loadTokenExports();
const hexOf = (profile, path) => {
  const token = resolved.profiles[profile].tokens[path];
  assert.ok(token, `${profile}: ${path} exists`);
  return tokenHex(token);
};
const HERITAGE_SYNTAX = { keyword: "#f73f35", tag: "#f73f35", property: "#e53935", heading: "#e53935", invalid: "#e53935" };

test("heritage-ansi keeps every terminal slot and the lifted syntax reds at their historical values", () => {
  for (let i = 0; i < 16; i += 1) assert.equal(hexOf("heritage-ansi", `color.terminal.ansi.${i}`), HERITAGE_ANSI[i], `slot ${i}`);
  for (const [role, hex] of Object.entries(HERITAGE_SYNTAX)) assert.equal(hexOf("heritage-ansi", `color.code.syntax.${role}`), hex, role);
});

test("D-041 terminal slots are exact semantic colours, all readable except background", () => {
  const expected = ["#000000", "#f07178", "#82d9a0", "#e5c07b", "#82b4ff", "#c7a0e8", "#78d4d4", "#e99499", "#bd787d", "#ff9095", "#a2edb8", "#f2d49b", "#a4caff", "#dec0f4", "#a0e7e7", "#ffa2a7"];
  const bg = hexOf("default", "color.terminal.bg");
  assert.equal(bg, "#000000");
  for (const [i, hex] of expected.entries()) {
    assert.equal(hexOf("default", `color.terminal.ansi.${i}`), hex, `slot ${i}`);
    if (i > 0) assert.ok(contrast(hex, bg) >= 4.5, `slot ${i} reaches the text floor`);
  }
  for (const normal of [1, 2, 3, 4, 5, 6, 7]) {
    assert.ok(contrast(expected[normal + 8], bg) > contrast(expected[normal], bg), `bright slot ${normal + 8} is brighter than ${normal}`);
  }
});

test("semantic syntax stays readable inside an editor selection", () => {
  const selection = hexOf("default", "color.code.selection-bg");
  const code = hexOf("default", "color.code.bg");
  for (const role of Object.keys(HERITAGE_SYNTAX)) {
    const hex = hexOf("default", `color.code.syntax.${role}`);
    assert.ok(contrast(hex, selection) >= 4.5, `${role} in the selection: ${contrast(hex, selection).toFixed(2)}:1`);
    assert.ok(contrast(hex, code) >= 5.5, `${role} on the editor: ${contrast(hex, code).toFixed(2)}:1`);
  }
});

test("D-041 prompt uses true black and rose text, while heritage keeps its original pair", () => {
  assert.equal(hexOf("default", "color.terminal.prompt-bg"), "#000000");
  assert.equal(hexOf("default", "color.terminal.prompt-text"), "#e99499");
  assert.equal(hexOf("heritage-ansi", "color.terminal.prompt-bg"), "#8c1212");
  assert.equal(hexOf("heritage-ansi", "color.terminal.prompt-text"), "#f4eeee");
  for (const profile of ["default", "heritage-ansi"]) {
    const ratio = contrast(hexOf(profile, "color.terminal.prompt-text"), hexOf(profile, "color.terminal.prompt-bg"));
    assert.ok(ratio >= 4.5, `${profile}: ${ratio.toFixed(2)}:1`);
  }
});

test("interaction reds retain their identity under D-041", () => {
  for (const [path, hex] of Object.entries({ "color.text.accent": "#e53935", "color.text.accent-strong": "#f73f35", "color.text.link": "#f73f35", "color.interaction.focus.ring": "#e53935", "color.border.active": "#e53935" })) {
    assert.equal(hexOf("default", path), hex, path);
  }
});

test("D-041 canonical and hued syntax roles agree and remain readable inside a selection", () => {
  const expected = { string: "#82d9a0", number: "#e5c07b", constant: "#e5c07b", function: "#82b4ff", attribute: "#e5c07b", escape: "#e5c07b", type: "#78d4d4", property: "#78d4d4", operator: "#e99499" };
  const selection = hexOf("default", "color.code.selection-bg");
  for (const [role, hex] of Object.entries(expected)) {
    const token = resolved.profiles.default.tokens[`color.code.hued.${role}`];
    assert.equal(token.value.hex, hex, role);
    assert.equal(hexOf("default", `color.code.syntax.${role}`), hex, `${role} uses the same canonical syntax colour`);
    assert.equal(token.eligibility.action, "use", `${role} is deliverable`);
    assert.ok(contrast(hex, selection) >= 4.5, `${role} in the selection: ${contrast(hex, selection).toFixed(2)}:1`);
  }
});
