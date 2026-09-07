import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { evidenceSchema } from "../schemas/evidence.mjs";
import { freshnessOf, validateEvidence } from "../scripts/lib/evidence.mjs";
import { renderReport } from "../scripts/lib/verification-report.mjs";
import { readJson } from "../scripts/lib/fs.mjs";
import Reporter from "./evidence-reporter.mjs";

const fixture = (result = "passed", kind = "automated") => ({
  schemaVersion: 1, sourceDigest: "sha256-source", artifactDigest: "sha256-artifact", revision: null,
  run: { startedAt: "2026-01-01T00:00:00Z", completedAt: "2026-01-01T00:01:00Z", result: "passed", reference: "Unit-test fixture only" },
  records: [{ id: "e-fixture", kind, scope: { component: "button", category: "rendering", states: ["default"], variants: ["default"], note: "Unit-test fixture only" }, result, reason: result === "passed" ? null : "Fixture reason", reference: kind === "manual" ? "protocol:fixture with recorded observations" : "Unit-test fixture only", test: null,
    environment: { browser: "chromium", browserVersion: "fixture", os: "fixture", viewport: { width: 1440, height: 1000 }, project: "fixture", profile: "default", density: "comfortable", javaScript: true } }],
});

test("evidence requires real scope, environment and reasons without promoting file existence", async () => {
  const evidence = fixture();
  await validateEvidence(evidence);
  const invalid = structuredClone(evidence);
  invalid.records[0].scope.states = ["made-up-state"];
  await assert.rejects(validateEvidence(invalid), /Unknown state/);
  invalid.records[0].scope.states = ["default"];
  invalid.records[0].environment.browserVersion = null;
  assert.equal(evidenceSchema(z).safeParse(invalid).success, false);
  for (const status of ["failed", "skipped", "not run", "not applicable"]) {
    const nonpass = fixture(status);
    assert.equal(evidenceSchema(z).safeParse(nonpass).success, true);
    nonpass.records[0].reason = null;
    assert.equal(evidenceSchema(z).safeParse(nonpass).success, false);
  }
  const manual = fixture("passed", "manual");
  assert.equal(evidenceSchema(z).safeParse(manual).success, true);
  manual.records[0].reference = "axe scan";
  assert.equal(evidenceSchema(z).safeParse(manual).success, false);
});

test("source or artifact changes make records stale while preserving their outcomes", () => {
  const evidence = fixture();
  assert.equal(freshnessOf(evidence, evidence), "current");
  assert.equal(freshnessOf(evidence, { ...evidence, sourceDigest: "sha256-changed-dependency" }), "stale");
  assert.equal(freshnessOf(evidence, { ...evidence, artifactDigest: "sha256-changed-css" }), "stale");
  assert.equal(evidence.records[0].result, "passed");
});

test("static report distinguishes every result, manual gaps, engine gaps and stale passes", async () => {
  const coverage = await readJson("exports/coverage.json");
  const subject = fixture();
  const baseline = renderReport({ coverage, subject });
  assert.ok(baseline.includes("No execution evidence"));
  assert.ok(!baseline.includes("evidence.json#"));
  assert.ok(baseline.includes("not run"));
  for (const result of ["passed", "failed", "skipped", "not run", "not applicable"]) {
    const html = renderReport({ coverage, subject, evidence: fixture(result) });
    assert.ok(html.includes(`>${result}</a>`), result);
    assert.ok(html.includes("firefox") && html.includes("webkit") && html.includes("screen-reader"));
    assert.ok(html.includes("No recorded manual protocol"));
  }
  assert.ok(renderReport({ coverage, subject: { ...subject, sourceDigest: "sha256-changed" }, evidence: fixture() }).includes("stale (passed)"));
  assert.equal(coverage.components.button.testImplemented, coverage.components.button.tested);
});

test("reporter rejects unannotated tests and uses actual results, never expected outcomes", () => {
  const reporter = new Reporter();
  reporter.records = [];
  reporter.reference = "Unit-test fixture only";
  const caseData = { title: "fixture", annotations: [], parent: { project: () => ({ name: "desktop", use: {} }) }, location: { file: new URL("./browser/page.spec.js", import.meta.url).pathname, line: 1 } };
  assert.throws(() => reporter.record(caseData, { status: "passed" }), /Missing explicit verification scope/);
  caseData.annotations = [{ type: "verification", description: JSON.stringify(fixture().records[0].scope) }];
  reporter.record(caseData, { status: "failed", annotations: [] });
  assert.equal(reporter.records[0].result, "failed");
  assert.equal(reporter.records[0].environment.browserVersion, null);
  reporter.seen = new Set(); reporter.collectionErrors = [];
  reporter.onTestEnd({ ...caseData, id: "missing", annotations: [] }, { status: "passed" });
  assert.equal(reporter.collectionErrors.length, 1);
});
