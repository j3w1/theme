import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { plan, globToRegExp, FULL_SHARDS, projectNames, browserImporters } from "../scripts/ci/select.mjs";

const registry = JSON.parse(readFileSync("scripts/ci/proofs.json", "utf8"));
const specs = new Set(["components/button", "page", "hex-swatches", "spec-tables", "ports", "usage"]);
const importers = browserImporters();
const run = (event, paths, extra = {}) => plan({ registry, event, paths, specExists: (s) => specs.has(s), importers, ...extra });

test("globs: ** crosses folders, * does not, {name} captures one segment", () => {
  assert.ok(globToRegExp("tools/**").re.test("tools/terminal-kit/windows/a.ps1"));
  assert.ok(!globToRegExp("tests/*.test.js").re.test("tests/dist/a.test.js"));
  assert.ok(globToRegExp("a/**/b").re.test("a/b") && globToRegExp("a/**/b").re.test("a/x/y/b"));
  assert.ok(!globToRegExp("a/**/b").re.test("a/xb"));
  const { re, names } = globToRegExp("spec/components/{id}.md");
  assert.deepEqual(names, ["id"]);
  assert.equal("spec/components/button.md".match(re)[1], "button");
});

test("an installer-only change runs its own suites, builds nothing and deploys nothing", () => {
  const p = run("push", ["ports/orca/install/J3w1Orca.psm1", "tests/orca-install.test.js"]);
  assert.deepEqual(p.proofs, ["sources", "unit", "unit-install", "unit-install-windows"]);
  assert.equal(p.site, false);
  assert.equal(p.matrix, false);
  assert.equal(p.deploy, false);
  assert.deepEqual(p.shards, []);
  const devbox = run("push", ["ports/claude-code/install.mjs"]);
  assert.deepEqual(devbox.proofs, ["sources", "unit", "unit-install"]);
  assert.equal(devbox.site, false);
  assert.equal(devbox.matrix, false);
  assert.equal(devbox.deploy, false);
  assert.deepEqual(devbox.shards, []);
});

test("the Orca host map and specimen also run the devbox suite, which reads them", () => {
  for (const file of ["ports/orca/host.json", "ports/orca/src/specimen.json", "ports/orca/install/specimen.json"]) {
    assert.ok(run("pull_request", [file]).proofs.includes("unit-install"), file);
  }
});

test("a port's published files still count as a site change", () => {
  for (const file of ["ports/orca/dist/config.ghostty", "ports/codex/mapping.json", "ports/README.md"]) {
    const p = run("push", [file]);
    assert.equal(p.site, true, file);
    assert.equal(p.deploy, true, file);
  }
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
    for (const proof of ["sources", "unit", "unit-install", "unit-install-windows", "build", "smoke", "consumers"]) assert.ok(p.proofs.includes(proof), `${file}: ${proof}`);
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
  const planJson = execFileSync("node", ["scripts/ci/select.mjs", "--event", "workflow_dispatch", "--head", head], { encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: "", GITHUB_STEP_SUMMARY: "" } });
  const good = { select: { result: "success" }, checks: { result: "success" }, build: { result: "success" }, browser: { result: "success" }, consumers: { result: "success" }, evidence: { result: "success" } };
  const gate = (needs, planText = planJson) => {
    try {
      execFileSync("node", ["scripts/ci/gate.mjs"], { encoding: "utf8", stdio: "pipe", env: { ...process.env, NEEDS: JSON.stringify(needs), PLAN: planText } });
      return true;
    } catch { return false; }
  };
  assert.equal(gate(good), true);
  assert.equal(gate({ ...good, browser: { result: "skipped" } }), false);
  const tampered = JSON.stringify({ ...JSON.parse(planJson), proofs: ["sources"] });
  assert.equal(gate(good, tampered), false);
});

test("the whole matrix covers every configured Playwright project", async () => {
  const configured = projectNames(readFileSync("playwright.config.mjs", "utf8"));
  const real = (await import("../playwright.config.mjs")).default.projects.map((p) => p.name);
  assert.deepEqual(configured, real, "the selector reads the same projects Playwright runs");
  assert.ok(configured.length >= 4);
  assert.deepEqual([...new Set(FULL_SHARDS.map((s) => s.split(":")[0]))].sort(), [...configured].sort());
});

test("a file that browser specs import runs those specs and counts as a site change", () => {
  const p = run("pull_request", ["tests/fixtures/port-capabilities.mjs"]);
  assert.ok(p.browser === "all" || p.browser.includes("ports"));
  const push = run("push", ["tests/helpers/scratch.mjs"]);
  assert.equal(push.site, true);
  assert.equal(push.deploy, true);
  const helper = run("pull_request", ["tests/ui/choice-helper.mjs"]);
  for (const spec of ["portal", "usage", "workbench"]) assert.ok(helper.browser.includes(spec), spec);
});

test("the import graph only adds: an unclaimed imported file still runs everything", () => {
  assert.ok(importers["scripts/lib/port-presentation.mjs"]);
  assert.equal(run("pull_request", ["scripts/lib/port-presentation.mjs"]).floor, true);
});

test("no file a browser spec imports sits under a site: false rule without the graph catching it", () => {
  for (const file of Object.keys(importers)) {
    const p = run("push", [file]);
    assert.equal(p.site, true, `${file} is imported by ${importers[file].join(", ")} but plans as no site change`);
  }
});

test("control files are fixed in the selector, not read from the registry a change could edit", () => {
  assert.equal(registry.controls, undefined);
  assert.equal(run("pull_request", ["scripts/ci/proofs.json"]).floor, true);
});

test("each project's metadata matches the environment it runs in", async () => {
  for (const p of (await import("../playwright.config.mjs")).default.projects) {
    assert.deepEqual(p.metadata.viewport, p.use.viewport, p.name);
    assert.equal(p.metadata.javaScript, p.use.javaScriptEnabled !== false, p.name);
  }
});

test("the base commit's control list still applies to a pull request", async () => {
  const { baseControls } = await import("../scripts/ci/select.mjs");
  const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  assert.ok(baseControls(head).includes("scripts/ci/**"));
  assert.deepEqual(baseControls("not-a-sha"), []);
});

test("the completeness check leaves the evidence untouched and refuses a short one", () => {
  const listed = JSON.parse(execFileSync("npx", ["playwright", "test", "--list", "--reporter=json"], { encoding: "utf8", env: { ...process.env, CI: "1" }, maxBuffer: 64 * 1024 * 1024 }));
  const records = [];
  const walk = (suite) => { for (const spec of suite.specs ?? []) for (const t of spec.tests ?? []) records.push({ result: "passed", environment: { project: t.projectName } }); for (const s of suite.suites ?? []) walk(s); };
  listed.suites.forEach(walk);
  const dir = mkdtempSync(path.join(os.tmpdir(), "evidence-"));
  const file = path.join(dir, "evidence.json");
  const check = () => { try { execFileSync("node", ["scripts/ci/evidence-complete.mjs"], { stdio: "pipe", env: { ...process.env, EVIDENCE_FILE: file } }); return true; } catch { return false; } };
  writeFileSync(file, JSON.stringify({ records }));
  const before = readFileSync(file, "utf8");
  assert.equal(check(), true);
  assert.equal(readFileSync(file, "utf8"), before, "the file is byte for byte unchanged");
  writeFileSync(file, JSON.stringify({ records: records.slice(1) }));
  assert.equal(check(), false, "one record short is refused");
  assert.ok(existsSync(path.join(dir, "evidence-error.json")));
});

test("a push that changes the site always runs the checks job the evidence job needs", () => {
  for (const rule of registry.rules.filter((r) => r.site)) {
    const file = rule.paths[0].replace("{id}", "button").replace("{name}", "page").replace("**", "x").replace("*", "x");
    const p = run("push", [file]);
    if (p.matrix) assert.ok(["sources", "unit", "unit-install", "unit-install-windows"].some((x) => p.proofs.includes(x)), file);
  }
});
