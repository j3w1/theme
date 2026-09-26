import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { plan, globToRegExp, FULL_SHARDS } from "../scripts/ci/select.mjs";

const registry = JSON.parse(readFileSync("scripts/ci/proofs.json", "utf8"));
const specs = new Set(["components/button", "page", "hex-swatches", "spec-tables", "ports", "usage"]);
const run = (event, paths, extra = {}) => plan({ registry, event, paths, specExists: (s) => specs.has(s), ...extra });

test("globs: ** crosses folders, * does not, {name} captures one segment", () => {
  assert.ok(globToRegExp("tools/**").re.test("tools/terminal-kit/windows/a.ps1"));
  assert.ok(!globToRegExp("tests/*.test.js").re.test("tests/dist/a.test.js"));
  const { re, names } = globToRegExp("spec/components/{id}.md");
  assert.deepEqual(names, ["id"]);
  assert.equal("spec/components/button.md".match(re)[1], "button");
});

test("a kit-only change runs the kit suites, builds nothing and deploys nothing", () => {
  const p = run("push", ["tools/terminal-kit/devbox/lib/source.mjs", "tests/terminal-kit.test.js"]);
  assert.deepEqual(p.proofs, ["sources", "unit", "unit-kit"]);
  assert.equal(p.site, false);
  assert.equal(p.matrix, false);
  assert.equal(p.deploy, false);
  assert.deepEqual(p.shards, []);
});

test("a component change on a pull request runs its spec and the page-wide checks, not the whole matrix", () => {
  const p = run("pull_request", ["spec/components/button.md", "site/src/styles/components/button.css"]);
  assert.deepEqual(p.browser, ["components/button", "hex-swatches", "page", "spec-tables"]);
  assert.ok(p.proofs.includes("build") && p.proofs.includes("smoke"));
  assert.ok(!p.proofs.includes("consumers"));
  assert.deepEqual(p.shards, ["all:1/1"]);
  assert.equal(p.matrix, false);
});

test("a component without a browser spec drops only its own spec", () => {
  const p = run("pull_request", ["spec/components/avatar.md"]);
  assert.deepEqual(p.browser, ["hex-swatches", "page", "spec-tables"]);
});

test("the same component change on main runs the whole matrix and deploys", () => {
  const p = run("push", ["spec/components/button.md"]);
  assert.equal(p.matrix, true);
  assert.equal(p.deploy, true);
  assert.equal(p.browser, "all");
  assert.deepEqual(p.shards, FULL_SHARDS);
  assert.ok(p.proofs.includes("consumers"));
});

test("a broad rule is a floor: an unclaimed path or a control file runs everything", () => {
  for (const file of ["tokens/semantic.tokens.json", "scripts/lib/exports.mjs", "package-lock.json", ".github/workflows/ci.yml", "scripts/ci/proofs.json"]) {
    const p = run("pull_request", [file]);
    assert.equal(p.floor, true, file);
    assert.equal(p.browser, "all", file);
    for (const proof of ["sources", "unit", "unit-kit", "unit-kit-windows", "build", "smoke", "consumers"]) assert.ok(p.proofs.includes(proof), `${file}: ${proof}`);
  }
});

test("unknown changed paths or a full dispatch run everything", () => {
  assert.equal(run("push", null).floor, true);
  const d = run("workflow_dispatch", [], { full: true });
  assert.equal(d.floor, true);
  assert.equal(d.matrix, true);
  assert.equal(d.deploy, false);
});

test("an agent note changes nothing on the site", () => {
  const p = run("push", ["AGENTS.md"]);
  assert.deepEqual(p.proofs, ["sources", "unit"]);
  assert.equal(p.deploy, false);
});

test("the plan hash is stable and covers the decision", () => {
  const a = run("pull_request", ["docs/design-mode.md"]);
  const b = run("pull_request", ["docs/design-mode.md"]);
  const c = run("push", ["docs/design-mode.md"]);
  assert.equal(a.planHash, b.planHash);
  assert.notEqual(a.planHash, c.planHash);
});

test("release-gate refuses a skipped selected job and a plan that does not recompute", () => {
  const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const planJson = execFileSync("node", ["scripts/ci/select.mjs", "--event", "workflow_dispatch", "--head", head, "--full"], { encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: "", GITHUB_STEP_SUMMARY: "" } });
  const good = { select: { result: "success" }, checks: { result: "success" }, browser: { result: "success" }, consumers: { result: "success" }, evidence: { result: "success" } };
  const gate = (needs, planText = planJson) => {
    try {
      execFileSync("node", ["scripts/ci/gate.mjs"], { encoding: "utf8", stdio: "pipe", env: { ...process.env, NEEDS: JSON.stringify(needs), PLAN: planText, FULL: "true" } });
      return true;
    } catch { return false; }
  };
  assert.equal(gate(good), true);
  assert.equal(gate({ ...good, browser: { result: "skipped" } }), false);
  const tampered = JSON.stringify({ ...JSON.parse(planJson), proofs: ["sources"] });
  assert.equal(gate(good, tampered), false);
});
