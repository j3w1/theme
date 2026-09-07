import assert from "node:assert/strict";
import test from "node:test";
import { parseFragment, serialize } from "parse5";
import { decorateHexHtml } from "../scripts/lib/hex-html.mjs";
import { parseHex, hexMatches, renderHexText, tokenColorIndex } from "../scripts/lib/hex-literals.mjs";
const textOf = (node) => node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(textOf).join("");

test("CSS hex syntax, alpha, case and multiple exact token matches", () => {
  assert.equal(parseHex("#AbC").rgba, "#aabbccff");
  assert.equal(parseHex("#abcd").rgba, "#aabbccdd");
  assert.equal(parseHex("#ABCDEF80").alpha, 128 / 255);
  assert.equal(parseHex("#abcde"), null);
  assert.deepEqual(hexMatches("#f00 #F008 #FF0000 #FF000080 #abcde #123456789 #abcdefg #abc-title url/#abc https://x/#abc").map((m) => m[0]), ["#f00", "#F008", "#FF0000", "#FF000080"]);
  const value = { type: "color", value: { hex: "#aabbcc", alpha: 1 } };
  const index = tokenColorIndex({ default: { tokens: { first: value, second: value } } });
  assert.deepEqual(index["#aabbccff"].map((m) => m.path), ["first", "second"]);
  assert.match(renderHexText("#ABC <&", index), /data-token-matches=/);
  assert.match(renderHexText("#ABC <&", index), /&lt;&amp;/);
});

test("parsed HTML decorates prose and split code while preserving attributes, raw data and all text", () => {
  const source = '<p title="#fff">#f00 and #abcd</p><pre><code><span>#FF</span><span>000080</span></code></pre><a href="#abc">#abc</a><p>https://example.com/#fff</p><script>{"x":"#abc"}</script><style>a{color:#abc}</style><textarea>#abc</textarea><span hidden>#fff</span>';
  const output = decorateHexHtml(source, {}, { fragment: true });
  assert.equal((output.match(/class="hex-swatch/g) ?? []).length, 3);
  assert.equal(textOf(parseFragment(source)), textOf(parseFragment(output)));
  assert.ok(output.includes('title="#fff"'));
  assert.ok(output.includes('<a href="#abc">#abc</a>'));
  assert.ok(output.includes('<script>{"x":"#abc"}</script>'));
  assert.equal(decorateHexHtml(output, {}, { fragment: true }), output);
  assert.equal(serialize(parseFragment(output)), output);
});

test("multiple literals in a single text node each retain exactly one preview", () => {
  const source = "#000 #fff #1234 #AABBCCDD";
  const output = decorateHexHtml(source, {}, { fragment: true });
  assert.equal(textOf(parseFragment(output)), source);
  assert.deepEqual([...output.matchAll(/data-hex="([^"]+)"/g)].map((m) => m[1]), source.split(" "));
});
