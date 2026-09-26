#!/usr/bin/env node
// release-gate (D-031): the only required check. It recomputes the plan from
// Git and refuses a plan that does not match, then checks that every job ran
// exactly when the plan said it should, and passed.

import { execFileSync } from "node:child_process";

const needs = JSON.parse(process.env.NEEDS ?? "{}");
const problems = [];
if (needs.select?.result !== "success" || !process.env.PLAN) {
  console.error("select did not produce a plan");
  process.exit(1);
}
const plan = JSON.parse(process.env.PLAN);
const args = ["scripts/ci/select.mjs", "--event", plan.event, "--head", plan.head];
if (plan.base) args.push("--base", plan.base);
const again = JSON.parse(execFileSync("node", args, { encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: "", GITHUB_STEP_SUMMARY: "" } }));
if (JSON.stringify(again) !== JSON.stringify(plan)) problems.push(`the plan does not recompute: ${String(plan.planHash).slice(0, 12)} vs ${again.planHash.slice(0, 12)}`);

const has = (p) => plan.proofs.includes(p);
const expected = {
  checks: ["sources", "unit", "unit-kit", "unit-kit-windows", "build"].some(has),
  browser: plan.shards.length > 0,
  consumers: has("consumers"),
  evidence: plan.matrix,
};
for (const [job, want] of Object.entries(expected)) {
  const got = needs[job]?.result ?? "missing";
  if (want && got !== "success") problems.push(`${job}: selected but ${got}`);
  if (!want && got !== "skipped") problems.push(`${job}: not selected but ${got}`);
}
console.log(`plan ${plan.planHash.slice(0, 12)}: ${plan.proofs.join(", ") || "no checks"}; browser ${plan.browser === "all" ? "all" : plan.browser.length}; deploy ${plan.deploy}`);
for (const [job, want] of Object.entries(expected)) console.log(`  ${job}: ${want ? "selected" : "not selected"} → ${needs[job]?.result ?? "missing"}`);
if (problems.length) {
  console.error(`\nrelease-gate refuses:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("\nrelease-gate: every selected check passed.");
