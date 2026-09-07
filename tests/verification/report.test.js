import assert from "node:assert/strict";
import test from "node:test";
import { artifactFiles, artifactFingerprint, sourceFingerprint, validateEvidence, freshnessOf } from "../../scripts/lib/evidence.mjs";
import { readJson, readText, exists } from "../../scripts/lib/fs.mjs";
import { scanFiles } from "../../scripts/lib/private-material.mjs";

test("report packaging preserves all tested specimen bytes and source identity", async () => {
  const subject = await readJson("dist/verification/subject.json");
  const files = await artifactFiles();
  assert.deepEqual(files, subject.files);
  assert.equal(artifactFingerprint(files), subject.artifactDigest);
  assert.equal(await sourceFingerprint(), subject.sourceDigest);
  assert.ok(await exists("dist/verification/evidence.json"), "Run the browser suite and verification:report first");
  const evidence = await validateEvidence(await readJson("dist/verification/evidence.json"));
  const freshness = freshnessOf(evidence, subject);
  const html = await readText("dist/verification/index.html");
  for (const record of evidence.records) {
    assert.ok(html.includes(`id="${record.id}"`));
    assert.ok(html.includes(`evidence.json#${record.id}`));
    if (freshness === "stale") assert.ok(html.includes(`stale (${record.result})`));
  }
  assert.ok(!html.includes("<details"));
  assert.ok(!html.includes("No execution evidence is attached"));
});

test("published report and evidence contain no private material", async () => {
  assert.deepEqual(await scanFiles(["dist/verification/index.html", "dist/verification/evidence.json", "dist/verification/subject.json", "dist/verification/report.css", "dist/verification/filter.js"]), []);
});
