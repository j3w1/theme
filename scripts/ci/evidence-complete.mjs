#!/usr/bin/env node
// The merged evidence must record every configured test in every configured
// project (D-031). merge-reports only sees the tests in the blobs it was given,
// so a missing shard would silently shrink the matrix; this check refuses it.
// It lists the tests with the JSON reporter only, so no configured reporter
// runs, and it proves it left the evidence file byte for byte unchanged.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { projectNames } from "./select.mjs";

const FILE = process.env.EVIDENCE_FILE ?? "test-results/evidence.json";
const bytes = readFileSync(FILE);
const digest = (b) => createHash("sha256").update(b).digest("hex");
const before = digest(bytes);
const evidence = JSON.parse(bytes.toString("utf8"));

const listed = JSON.parse(execFileSync("npx", ["playwright", "test", "--list", "--reporter=json"], { encoding: "utf8", env: { ...process.env, CI: "1" }, maxBuffer: 64 * 1024 * 1024 }));
const count = (suite) => (suite.specs ?? []).reduce((n, spec) => n + (spec.tests ?? []).length, 0) + (suite.suites ?? []).reduce((n, s) => n + count(s), 0);
const total = listed.suites.reduce((n, s) => n + count(s), 0);
const projects = projectNames(readFileSync("playwright.config.mjs", "utf8")).sort();
const recorded = [...new Set(evidence.records.map((r) => r.environment?.project))].sort();

const problems = [];
if (digest(readFileSync(FILE)) !== before) problems.push("listing the tests changed the evidence file");
if (!(total > 0)) problems.push("could not count the configured tests");
else if (evidence.records.length !== total) problems.push(`${evidence.records.length} records for ${total} configured tests`);
if (JSON.stringify(recorded) !== JSON.stringify(projects)) problems.push(`projects recorded ${recorded.join(", ")}; configured ${projects.join(", ")}`);
if (problems.length) {
  writeFileSync(FILE.replace(/evidence\.json$/, "evidence-error.json"), `${JSON.stringify({ result: "refused", reasons: problems }, null, 2)}\n`);
  console.error(`The evidence is incomplete:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`evidence complete: ${total} records across ${projects.join(", ")}; file unchanged (${before.slice(0, 12)})`);
