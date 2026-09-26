#!/usr/bin/env node
// Runs the checks a plan selected (D-031). Called by the ci workflow:
//   node scripts/ci/run.mjs '<plan json>' cheap
//   node scripts/ci/run.mjs '<plan json>' browser <project>:<shard>/<total>
// A browser subset reports with the plain list reporter; only the deployment
// path writes blob reports, which merge into one evidence report.

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";

const [planJson, stage, part = "all:1/1"] = process.argv.slice(2);
const plan = JSON.parse(planJson);
const has = (p) => plan.proofs.includes(p);
const run = (cmd, args) => {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { stdio: "inherit" });
};

const KIT = ["terminal-kit.test.js", "terminal-kit-windows.test.js"];

if (stage === "cheap") {
  if (has("sources")) { run("npm", ["run", "validate"]); run("npm", ["run", "check"]); }
  if (has("unit")) run("node", ["--test", ...readdirSync("tests").filter((f) => f.endsWith(".test.js") && !KIT.includes(f)).sort().map((f) => `tests/${f}`)]);
  if (has("unit-kit")) run("node", ["--test", "tests/terminal-kit.test.js"]);
  if (has("unit-kit-windows")) run("node", ["--test", "tests/terminal-kit-windows.test.js"]);
} else if (stage === "browser") {
  const files = plan.browser === "all" ? [] : plan.browser.map((s) => `tests/browser/${s}.spec.js`);
  const reporter = plan.matrix ? "blob" : "list";
  const [, project, shard] = part.match(/^([a-z0-9]+):(\d+\/\d+)$/) ?? [];
  if (!project) throw new Error(`bad browser part ${part}`);
  run("npx", ["playwright", "test", ...files, ...(project === "all" ? [] : [`--project=${project}`]), `--reporter=${reporter}`, `--shard=${shard}`]);
} else {
  throw new Error(`unknown stage ${stage}`);
}
