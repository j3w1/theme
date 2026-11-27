import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "yaml";
import { scratchDirSync } from "./helpers/scratch.mjs";

const installers = ["tests/host-install.test.js", "tests/orca-install.test.js"];
const units = () => readdirSync("tests").filter((f) => f.endsWith(".test.js") && !installers.includes(`tests/${f}`)).sort().map((f) => `tests/${f}`);
const proofs = ["sources", "unit", "unit-install", "unit-install-windows"];

// Exercise the real runner's branching and error propagation without running
// the full installer suites for each selection. The preload records each
// execFileSync call and can fail any one of them before returning to run.mjs.
function runner(t) {
  const dir = scratchDirSync(t, "j3w1-ci-run-");
  const preload = path.join(dir, "record.mjs");
  const output = path.join(dir, "commands.jsonl");
  writeFileSync(preload, `
    import childProcess from "node:child_process";
    import { syncBuiltinESMExports } from "node:module";
    import { appendFileSync } from "node:fs";
    let count = 0;
    childProcess.execFileSync = (command, args) => {
      appendFileSync(process.env.CI_COMMANDS, JSON.stringify([command, ...args]) + "\\n");
      if (++count === Number(process.env.CI_FAIL_COMMAND)) throw new Error("selected command failed");
    };
    syncBuiltinESMExports();
  `);
  const { NODE_TEST_CONTEXT: _, ...env } = process.env;
  return (stage, selected = proofs, fail = 0) => {
    writeFileSync(output, "");
    const result = spawnSync(process.execPath, ["--import", pathToFileURL(preload).href, "scripts/ci/run.mjs", stage], {
      encoding: "utf8",
      env: { ...env, PLAN: JSON.stringify({ proofs: selected }), CI_COMMANDS: output, CI_FAIL_COMMAND: String(fail) },
    });
    assert.ifError(result.error);
    const commands = readFileSync(output, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
    return { ...result, commands };
  };
}

test("checks stages partition every source, unit and installer command without dropping test files", (t) => {
  const run = runner(t);
  const cheap = run("cheap"), install = run("install");
  assert.equal(cheap.status, 0, cheap.stderr);
  assert.equal(install.status, 0, install.stderr);
  assert.deepEqual(cheap.commands, [["npm", "run", "validate"], ["npm", "run", "check"], ["node", "--test", ...units()]]);
  assert.deepEqual(install.commands, installers.map((file) => ["node", "--test", file]));
  const files = [...cheap.commands, ...install.commands].filter(([cmd]) => cmd === "node").flatMap(([, , ...args]) => args);
  const all = readdirSync("tests").filter((f) => f.endsWith(".test.js")).map((f) => `tests/${f}`).sort();
  assert.deepEqual(files.sort(), all, "every current test file appears exactly once, without filters");
});

test("each checks stage preserves every proof selection, including the empty selection", (t) => {
  const run = runner(t);
  for (const selected of [[], ...proofs.map((proof) => [proof])]) {
    const cheap = run("cheap", selected), install = run("install", selected);
    assert.equal(cheap.status, 0, cheap.stderr);
    assert.equal(install.status, 0, install.stderr);
    assert.deepEqual(cheap.commands, selected.includes("sources") ? [["npm", "run", "validate"], ["npm", "run", "check"]] : selected.includes("unit") ? [["node", "--test", ...units()]] : []);
    assert.deepEqual(install.commands, selected.includes("unit-install") ? [["node", "--test", installers[0]]] : selected.includes("unit-install-windows") ? [["node", "--test", installers[1]]] : []);
  }
});

test("a nonzero source, unit or installer command fails its checks stage immediately", (t) => {
  const run = runner(t);
  for (const [stage, count] of [["cheap", 3], ["install", 2]]) {
    for (let fail = 1; fail <= count; fail += 1) {
      const result = run(stage, proofs, fail);
      assert.notEqual(result.status, 0, `${stage} command ${fail}`);
      assert.match(result.stderr, /selected command failed/);
      assert.equal(result.commands.length, fail, "no later command runs after failure");
    }
  }
});

test("both checks stages keep the 15-minute gate and run independently through evidence and release-gate", () => {
  const { jobs } = parse(readFileSync(".github/workflows/ci.yml", "utf8"));
  const checks = jobs.checks;
  assert.deepEqual(checks.strategy.matrix, { stage: ["cheap", "install"] });
  assert.equal(checks.strategy["fail-fast"], false, "one stage must not cancel the other's coverage");
  assert.equal(checks["timeout-minutes"], 15);
  assert.equal(checks.needs, "select");
  assert.equal(checks.if, "needs.select.outputs.checks == 'true'");
  assert.equal(checks["continue-on-error"], undefined);
  assert.ok(checks.steps.every((step) => step["continue-on-error"] === undefined));
  const step = checks.steps.find((step) => step.run === "node scripts/ci/run.mjs ${{ matrix.stage }}");
  assert.ok(step, "each matrix entry invokes its own stage");
  assert.equal(step.env.PLAN, "${{ needs.select.outputs.plan }}");
  for (const job of ["evidence", "release-gate"]) assert.ok(jobs[job].needs.includes("checks"), job);
  assert.match(jobs.evidence.if, /needs\.checks\.result == 'success'/);
});

test("release-gate refuses any unsuccessful or missing aggregate checks result", () => {
  const invoke = (file, env) => spawnSync(process.execPath, [file], { encoding: "utf8", env: { ...process.env, ...env } });
  const selected = spawnSync(process.execPath, ["scripts/ci/select.mjs", "--event", "workflow_dispatch", "--head", "HEAD"], {
    encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: "", GITHUB_STEP_SUMMARY: "" },
  });
  assert.equal(selected.status, 0, selected.stderr);
  const { jobs } = parse(readFileSync(".github/workflows/ci.yml", "utf8"));
  const needs = Object.fromEntries(jobs["release-gate"].needs.map((job) => [job, { result: "success" }]));
  assert.equal(invoke("scripts/ci/gate.mjs", { PLAN: selected.stdout, NEEDS: JSON.stringify(needs) }).status, 0);
  for (const result of ["failure", "cancelled", "skipped", null]) {
    const changed = { ...needs, checks: result === null ? undefined : { result } };
    const gate = invoke("scripts/ci/gate.mjs", { PLAN: selected.stdout, NEEDS: JSON.stringify(changed) });
    assert.notEqual(gate.status, 0, String(result));
    assert.match(gate.stderr, /checks: selected but (failure|cancelled|skipped|missing)/);
  }
});
