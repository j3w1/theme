import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { readJson, readText, sha256 } from "../../scripts/lib/fs.mjs";
import { releaseComparisonSchema } from "../../schemas/release-comparison.mjs";

test("published comparisons keep their pins and historical specimen hashes with no current-value fallback", async () => {
  const catalogue = await readJson("site/releases.json");
  for (const from of catalogue.revisions) for (const to of catalogue.revisions) for (const profile of catalogue.profiles) {
    const prefix = `dist/releases/${from.id}/${to.id}/${profile}`;
    const report = releaseComparisonSchema(z).parse(await readJson(`${prefix}/comparison.json`));
    assert.equal(report.from.revision, from.revision); assert.equal(report.to.revision, to.revision);
    assert.equal(report.from.profile, profile); assert.equal(report.to.profile, profile);
    if (from.revision === to.revision) assert.deepEqual(report.changes, []);
    const html = await readText(`${prefix}/index.html`);
    assert.match(html, /Known downstream impact/); assert.match(html, /Matched visual references/);
    assert.match(html, /Expected migration verification/);
    assert.ok(html.includes(from.revision) && html.includes(to.revision));
    if (html.includes("#e99499")) assert.match(html, /hex-swatch/);
  }
  for (const pin of catalogue.revisions) for (const profile of catalogue.profiles) {
    const prefix = `dist/releases/specimens/${pin.id}/${profile}`;
    const index = await readJson(`${prefix}/index.json`);
    assert.equal(index.revision, pin.revision);
    assert.equal(new Set(index.cases.map((c) => c.component)).size, 7);
    for (const row of index.cases) {
      const html = await readText(`${prefix}/${row.path}`);
      assert.equal(sha256(html), row.artifactDigest, row.path);
      assert.equal(sha256(await readText(`${prefix}/style.css`)), row.styleDigest);
      assert.doesNotMatch(html, /<script|\son[a-z]+=/i);
      assert.match(html, /Content-Security-Policy/);
      assert.match(html, /data-release-specimen/);
    }
  }
});
