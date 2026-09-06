/* The page, the exports and the sources must describe the same things:
   same components, same anchors, same token paths, same export bytes. */

import assert from "node:assert/strict";
import test from "node:test";
import { listFiles, readJson, readText } from "../../scripts/lib/fs.mjs";
import { listComponentFiles, componentIdOf } from "../../scripts/lib/spec.mjs";
import { anchorFor } from "../../scripts/lib/anchors.mjs";

const html = await readText("dist/index.html");
const resolved = await readJson("exports/tokens.resolved.json");
const tokenPaths = new Set(Object.keys(resolved.profiles[resolved.defaultProfile].tokens));

test("component sections, exports, contents entries and the search index agree", async () => {
  const specIds = (await listComponentFiles()).map(componentIdOf).sort();
  const sectionIds = [...html.matchAll(/<section class="component" id="c-([a-z0-9-]+)"/g)].map((m) => m[1]).sort();
  const exportIds = (await listFiles("exports/components", { filter: (f) => f.endsWith(".json") })).map((f) => f.replace(/^exports\/components\//, "").replace(/\.json$/, "")).sort();
  const tocIds = [...html.matchAll(/data-toc-component="([a-z0-9-]+)"/g)].map((m) => m[1]).sort();
  const index = await readJson("dist/search-index.json");
  const indexIds = index.entries.filter((e) => e.kind === "component").map((e) => e.id).sort();
  assert.deepEqual(sectionIds, specIds);
  assert.deepEqual(exportIds, specIds);
  assert.deepEqual(tocIds, specIds);
  assert.deepEqual(indexIds, specIds);
  const coverage = await readJson("exports/coverage.json");
  assert.deepEqual(Object.keys(coverage.components).sort(), specIds);
  for (const id of specIds) {
    const section = html.match(new RegExp(`<section class="component" id="c-${id}"[^>]*>`))[0];
    const cov = coverage.components[id];
    assert.ok(section.includes(`data-family="${cov.family}"`), `${id} family`);
    if (cov.demonstrated) assert.ok(html.includes(`id="${id}-states"`), `${id} state matrix rendered`);
  }
});

test("every token reference on the page resolves, and every export is served byte-identical", async () => {
  for (const m of html.matchAll(/data-token="([^"]+)"/g)) assert.ok(tokenPaths.has(m[1]), `data-token ${m[1]}`);
  for (const m of html.matchAll(/id="t-([a-z0-9-]+)"/g)) {
    const dashed = m[1];
    assert.ok([...tokenPaths].some((p) => p.replaceAll(".", "-") === dashed) || [...tokenPaths].some((p) => p.replaceAll(".", "-").startsWith(dashed)), `anchor t-${dashed}`);
  }
  for (const file of await listFiles("exports")) {
    assert.equal(await readText(`dist/${file}`), await readText(file), file);
  }
  assert.equal(await readText("dist/agents/consume.md"), await readText("agents/consume.md"));
  assert.equal(await readText("dist/theme.json"), await readText("theme.json"));
  assert.equal(await readText("dist/llms.txt"), await readText("exports/llms.txt"));
});

test("ids are unique, every contents link has a target, and nothing normative hides inside details", () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual([...new Set(dup)], []);
  const idSet = new Set(ids);
  const toc = html.match(/<nav class="toc"[\s\S]*?<\/nav>/)[0];
  for (const m of toc.matchAll(/href="#([^"]+)"/g)) assert.ok(idSet.has(m[1]), `contents link #${m[1]}`);
  for (const block of html.matchAll(/<details[\s\S]*?<\/details>/g)) {
    const inner = block[0];
    if (inner.includes('class="toc"') || inner.includes("<summary>Contents")) continue;
    assert.doesNotMatch(inner, /<h3|class="token-table"|class="matrix"|class="component"/, "normative content inside <details>");
  }
  for (const id of ["identity", "foundations", "accessibility", "portability", "decisions"]) assert.ok(idSet.has(anchorFor.doc(id)), id);
  assert.ok(idSet.has("for-agents") && idSet.has("references") && idSet.has("contrast-report") && idSet.has("coverage-ledger"));
});

test("site source styles use token variables only", async () => {
  const files = (await listFiles("site/src", { filter: (f) => /\.(css|astro|ts)$/.test(f) && !f.endsWith("tokens.generated.css") }));
  for (const file of files) {
    const text = await readText(file);
    const css = file.endsWith(".astro") ? [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n") : text;
    for (const m of css.matchAll(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/gi)) assert.fail(`${file}: raw colour ${m[0]}`);
    for (const m of css.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
      const v = m[1];
      if (v.startsWith("--_") || v.startsWith("--density-")) continue;
      assert.ok([...tokenPaths].some((p) => `--${p.replaceAll(".", "-")}` === v), `${file}: ${v} is not a token variable`);
    }
  }
});
