#!/usr/bin/env node
// The merged evidence must record every configured test in every configured
// project (D-031). merge-reports only sees the tests in the blobs it was given,
// so a missing shard would silently shrink the matrix; this check refuses it.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { projectNames } from "./select.mjs";

const evidence = JSON.parse(readFileSync("test-results/evidence.json", "utf8"));
const listed = execFileSync("npx", ["playwright", "test", "--list"], { encoding: "utf8", env: { ...process.env, CI: "1" } });
const total = Number(listed.match(/Total: (\d+) tests? in/)?.[1]);
const projects = projectNames(readFileSync("playwright.config.mjs", "utf8")).sort();
const recorded = [...new Set(evidence.records.map((r) => r.environment?.project))].sort();
const problems = [];
if (!Number.isInteger(total)) problems.push("could not read the configured test count from `playwright test --list`");
else if (evidence.records.length !== total) problems.push(`${evidence.records.length} records for ${total} configured tests`);
if (JSON.stringify(recorded) !== JSON.stringify(projects)) problems.push(`projects recorded ${recorded.join(", ")}; configured ${projects.join(", ")}`);
if (problems.length) {
  console.error(`The evidence is incomplete:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`evidence complete: ${total} records across ${projects.join(", ")}`);
