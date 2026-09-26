#!/usr/bin/env node
// Runs the checks a plan selected (D-031). Called by the ci workflow:
//   PLAN='<plan json>' node scripts/ci/run.mjs cheap
//   PLAN='<plan json>' node scripts/ci/run.mjs browser <project>:<shard>/<total>
// The plan comes through the environment, never the command line, so a
// changed path's name cannot reach a shell.
// A browser subset reports with the plain list reporter; only the deployment
// path writes blob reports, which merge into one evidence report.

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";

const [stage, part = "all:1/1"] = process.argv.slice(2);
const plan = JSON.parse(process.env.PLAN ?? "");
const has = (p) => plan.proofs.includes(p);
const run = (cmd, args) => {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { stdio: "inherit" });
};

const INSTALL = ["host-install.test.js", "orca-install.test.js"];

if (stage === "cheap") {
  if (has("sources")) { run("npm", ["run", "validate"]); run("npm", ["run", "check"]); }
  if (has("unit")) run("node", ["--test", ...readdirSync("tests").filter((f) => f.endsWith(".test.js") && !INSTALL.includes(f)).sort().map((f) => `tests/${f}`)]);
  if (has("unit-install")) run("node", ["--test", "tests/host-install.test.js"]);
  if (has("unit-install-windows")) run("node", ["--test", "tests/orca-install.test.js"]);
} else if (stage === "browser") {
  const files = plan.browser === "all" ? [] : plan.browser.map((s) => `tests/browser/${s}.spec.js`);
  // A subset also loads the evidence reporter: as a shard it never writes,
  // but it still fails a test that lacks its verification annotation.
  const reporter = plan.matrix ? "blob" : "list,./tests/evidence-reporter.mjs";
  const [, project, shard] = part.match(/^([a-z0-9-]+):(\d+\/\d+)$/) ?? [];
  if (!project) throw new Error(`bad browser part ${part}`);
  run("npx", ["playwright", "test", ...files, ...(project === "all" ? [] : [`--project=${project}`]), `--reporter=${reporter}`, `--shard=${shard}`]);
} else {
  throw new Error(`unknown stage ${stage}`);
}
