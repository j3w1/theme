import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { rgb, rgbToHex, rgbCssToHex, colorValue } from "../scripts/lib/color.mjs";
import { hexToColor, TokenError } from "../scripts/lib/tokens.mjs";
import { escapeHtml } from "../scripts/lib/markup.mjs";
import { keyIndex } from "../packages/ui/src/internal/dom.js";
import { scratchDirSync, withScratch } from "./helpers/scratch.mjs";
import { readJsonWithBom } from "./helpers/json.mjs";

test("byte colour conversion and analytical precision remain distinct from token authoring", () => {
  assert.deepEqual(rgb("#a3676b"), [163, 103, 107]);
  assert.equal(rgbToHex(rgb("#a3676b")), "#a3676b");
  assert.equal(rgbCssToHex("rgba(163, 103, 107, 0.5)"), "#a3676b");
  assert.equal(colorValue("#a3676b").components[0], 163 / 255);
  assert.equal(hexToColor("#A3676B").components[0], 0.6392);
  assert.throws(() => hexToColor("bad"), TokenError);
  assert.equal(escapeHtml(`<a x="'">&`), "&lt;a x=&quot;&#39;&quot;&gt;&amp;");
});

test("keyboard movement wraps menus and toolbars but clamps trees and tables", () => {
  const move = (key, index, wrap) => keyIndex({ key, index, length: 3, wrap });
  assert.equal(move("ArrowUp", 0, true), 2);
  assert.equal(move("ArrowDown", 2, true), 0);
  assert.equal(move("ArrowUp", 0, false), 0);
  assert.equal(move("ArrowDown", 2, false), 2);
  for (const wrap of [false, true]) {
    assert.equal(move("Home", 2, wrap), 0);
    assert.equal(move("End", 0, wrap), 2);
    assert.equal(move("ArrowDown", 1, wrap), 2);
  }
  assert.equal(keyIndex({ key: "ArrowLeft", index: 2, length: 3, next: "ArrowLeft", previous: "ArrowRight" }), 0);
});

test("scratch cleanup covers rejection and synchronous fixture teardown", async () => {
  let root;
  await assert.rejects(withScratch("node-helper-", async dir => { root = dir; throw new Error("fixture failed"); }), /fixture failed/);
  assert.equal(existsSync(root), false);
  let teardown;
  const sync = scratchDirSync({ after: callback => { teardown = callback; } }, "node-helper-");
  const file = path.join(sync, "bom.json");
  writeFileSync(file, '\uFEFF{"value":1}');
  assert.deepEqual(readJsonWithBom(file), { value: 1 });
  teardown();
  assert.equal(existsSync(sync), false);
});
