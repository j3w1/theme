import assert from "node:assert/strict";
import test from "node:test";
import { parse } from "parse5";
import { readText, readJson, listFiles } from "../../scripts/lib/fs.mjs";
import { walkMarkup, attribute } from "../../scripts/lib/markup.mjs";
import { scopeRecipeCss } from "../../scripts/lib/recipe-css.mjs";
import { anchorFor } from "../../scripts/lib/anchors.mjs";

const hub = await readText("dist/reference/index.html");
test("the public pre-modernization anchors all remain in the static hub", async () => {
  const ids = new Set([...hub.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  const fixture = (await readText("tests/fixtures/reference-anchors.txt")).trim().split("\n");
  assert.ok(fixture.length > 1000, "fixture retains public component, doc, role and specimen anchors");
  assert.deepEqual(fixture.filter((id) => !ids.has(id)), []);
  assert.doesNotMatch(hub, /class="matrix"|class="contrast-table"/, "hub contains links to full detail");
});
test("matrix scoping retains forced states without leaking into live variants", () => {
  const source = ".button:hover, [data-state-hover] .button { color: var(--color-text-default); }";
  const live = scopeRecipeCss(source);
  assert.doesNotMatch(live, /data-state-hover/);
  const matrix = scopeRecipeCss(source, { scope: ".reference-matrix-button", keepStates: true });
  assert.match(matrix, /\.reference-matrix-button \[data-state-hover\] \.button/);
  assert.doesNotMatch(matrix, /^\[data-state-hover\]/m);
});
test("component pages render every computed contrast declaration and carry only scoped matrix styles", async () => {
  const { pairs } = await readJson("exports/contrast.json");
  const { components } = await readJson("exports/coverage.json");
  for (const id of Object.keys(components)) {
    const html = await readText(`dist/components/${id}/index.html`);
    const tree = parse(html); let rows = 0;
    walkMarkup(tree, (node) => {
      if (node.tagName === "table" && (attribute(node, "class") ?? "").includes("contrast-table")) walkMarkup(node, (child) => { if (child.tagName === "tbody") rows += child.childNodes.filter((row) => row.tagName === "tr").length; });
    });
    assert.equal(rows, pairs.filter((pair) => pair.source === id).length, id);
    assert.ok(html.includes(`.reference-matrix-${id}`), `${id}: own matrix scope`);
    assert.ok(html.includes(`id="${anchorFor.states(id)}"`));
  }
});
test("reference HTML and every page stay within their size budgets", async () => {
  let elements = 0;
  walkMarkup(parse(hub), (node) => { if (node.tagName) elements++; });
  assert.ok(Buffer.byteLength(hub) <= 800_000, `hub: ${Buffer.byteLength(hub)} bytes`);
  assert.ok(elements <= 20_000, `hub: ${elements} elements`);
  for (const file of await listFiles("dist", { filter: (file) => file.endsWith(".html") })) {
    if (file === "dist/tokens/index.html") continue;
    const bytes = Buffer.byteLength(await readText(file));
    const limit = file === "dist/404.html" ? 40_000 : /^dist\/components\/[^/]+\/index.html$/.test(file) ? 400_000 : 1_000_000;
    assert.ok(bytes <= limit, `${file}: ${bytes} bytes exceeds ${limit}`);
  }
});
test("search endpoints share one index and token data stays outside HTML (R-f, R-i)", async () => {
  assert.equal(await readText("dist/search-index.json"), await readText("dist/search.json"));
  assert.doesNotMatch(hub, /id="j3w1-tokens"/);
  assert.match(hub, /data-inspector-source="\/theme\/tokens\/inspector.json"/);
  assert.ok((await readJson("dist/tokens/inspector.json")).profiles.default);
  const tokens = await readText("dist/tokens/index.html");
  assert.match(tokens, /data-source="\/theme\/tokens\/query.json"/);
  assert.doesNotMatch(tokens, /type="application\/json" id="usage-data"/);
});
test("surface and text grid values remain separate literals with generated swatches (R-h)", () => {
  let rows = 0;
  walkMarkup(parse(hub), (node) => {
    if (!(attribute(node, "class") ?? "").split(" ").includes("swatch-row")) return;
    rows++;
    let swatches = 0;
    walkMarkup(node, (child) => { if (attribute(child, "data-hex")) swatches++; });
    assert.ok(swatches > 0, attribute(node, "id"));
  });
  assert.equal(rows, 32, "all declared surface and text roles are audited");
});
