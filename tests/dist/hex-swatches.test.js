import assert from "node:assert/strict";
import test from "node:test";
import { parse } from "parse5";
import { readText } from "../../scripts/lib/fs.mjs";

test("every eligible built-page literal has one adjacent swatch and matching fill", async () => {
  const tree = parse(await readText("dist/reference/index.html"));
  let text = "";
  const previews = [];
  const attr = (n, key) => n.attrs?.find((a) => a.name === key)?.value;
  const plain = (n) => n.nodeName === "#text" ? n.value : (n.childNodes ?? []).map(plain).join("");
  const visit = (n) => {
    if (["head", "script", "style", "textarea", "template", "svg", "math", "select", "option"].includes(n.tagName) || attr(n, "hidden") !== undefined) return;
    if (n.tagName === "a" && plain(n).trim() === attr(n, "href")) { text += " "; return; }
    if (attr(n, "data-hex")) {
      const hex = attr(n, "data-hex");
      assert.equal(attr(n, "aria-hidden"), "true");
      assert.equal(attr(n, "tabindex"), undefined);
      assert.equal(plain(n), "");
      assert.equal(attr(n, "style"), `--_hex-color:${hex}`);
      assert.ok(text.endsWith(hex), `preview ${hex} must follow its exact literal`);
      previews.push({ end: text.length, hex });
      return;
    }
    const block = ["p", "div", "td", "th", "pre", "li", "h1", "h2", "h3", "h4", "section", "br", "button"].includes(n.tagName);
    if (block) text += "\n";
    if (n.nodeName === "#text") text += n.value;
    for (const c of n.childNodes ?? []) visit(c);
    if (block) text += "\n";
  };
  visit(tree);
  const literals = [...text.matchAll(/(?<![\w#/@.-])#(?:[a-f\d]{8}|[a-f\d]{6}|[a-f\d]{4}|[a-f\d]{3})(?![\w/-])/gi)].filter((m) => !/(?:[a-z][\w+.-]*:\/\/|mailto:)[^\s<>"']*$/i.test(text.slice(Math.max(0, text.lastIndexOf("\n", m.index)), m.index)));
  assert.ok(literals.length > 1000, "audit covers prose, component tables and contrast report");
  const expected = literals.map((m) => ({ end: m.index + m[0].length, hex: m[0] }));
  assert.equal(previews.length, expected.length, `preview count ${previews.length}, literal count ${expected.length}`);
  for (let i = 0; i < expected.length; i++) assert.deepEqual(previews[i], expected[i], `literal ${i}: ${text.slice(expected[i].end - 50, expected[i].end + 50)}`);
});
