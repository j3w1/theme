/* Rules on the site source that do not need a build: storage namespace,
   no service worker, anchors come from one module, no root-absolute links
   in templates, base joined only through withBase. */

import assert from "node:assert/strict";
import test from "node:test";
import { listFiles, readText } from "../scripts/lib/fs.mjs";

const sources = await listFiles("site/src", { filter: (f) => /\.(ts|astro|css|mjs)$/.test(f) });

test("localStorage is touched only by storage.ts and every key carries the j3w1-theme: prefix", async () => {
  for (const file of sources) {
    const text = await readText(file);
    if (file.endsWith("scripts/storage.ts")) {
      assert.match(text, /PREFIX = "j3w1-theme:"/);
      continue;
    }
    if (file.endsWith("layouts/SpecLayout.astro")) {
      /* the inline restore script may read, never write, and only prefixed keys */
      assert.doesNotMatch(text, /localStorage\.setItem/);
      for (const m of text.matchAll(/localStorage\.getItem\("([^"]+)"\)/g)) assert.ok(m[1].startsWith("j3w1-theme:"), m[1]);
      continue;
    }
    assert.doesNotMatch(text, /localStorage|sessionStorage|indexedDB/, `${file} touches storage directly`);
  }
});

test("no service worker, no inline event handlers, no external scripts or stylesheets", async () => {
  for (const file of sources) {
    const text = await readText(file);
    assert.doesNotMatch(text, /serviceWorker|navigator\.storage/, file);
    assert.doesNotMatch(text, /\son[a-z]+="/i, `${file} inline handler`);
    assert.doesNotMatch(text, /<script[^>]+src="https?:/, `${file} external script`);
    assert.doesNotMatch(text, /<link[^>]+href="https?:/, `${file} external stylesheet`);
  }
});

test("templates never hard-code the base path or root-absolute links", async () => {
  for (const file of sources.filter((f) => /\.(astro|ts)$/.test(f))) {
    const text = await readText(file);
    if (file.endsWith("lib/base.ts")) continue;
    assert.doesNotMatch(text, /href="\/(?!\/)|src="\/(?!\/)/, `${file} root-absolute attribute`);
    if (file.endsWith("scripts/search.ts")) continue;
    assert.doesNotMatch(text, /["'`]\/theme\//, `${file} hard-codes /theme/ (use withBase)`);
  }
});

test("anchors are only produced by scripts/lib/anchors.mjs", async () => {
  for (const file of sources.filter((f) => f.endsWith(".astro"))) {
    const text = await readText(file);
    for (const m of text.matchAll(/id=\{?["'`](c|f|d|t|s)-\$\{/g)) assert.fail(`${file}: hand-built anchor ${m[0]}`);
  }
});
