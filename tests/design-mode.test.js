/* The units of design mode that need no server: ports, routes, the frame
   agent, the ledger, the package-manager choice and the prerequisite check. */

import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { withScratch } from "./helpers/scratch.mjs";
import { resolveWithin } from "../scripts/lib/fs.mjs";
import { hexIndexForRoute } from "../scripts/lib/hex-routes.mjs";
import { CHANGE_CLASSES, checkPrerequisites, createLedger, derivePorts, discoverRoutes, formatReport, injectAgent, readBaselineMeta, resolvePackageManager, routeOf, writeBaselineMeta } from "../scripts/tooling/design-mode.mjs";

test("the four ports derive from DESIGN_PORT and only the dev port can move on its own", () => {
  assert.deepEqual(derivePorts({}), { compare: 4400, before: 4401, after: 4402, dev: 4403 });
  assert.deepEqual(derivePorts({ DESIGN_PORT: "5000", DESIGN_DEV_PORT: "6000" }), { compare: 5000, before: 5001, after: 5002, dev: 6000 });
  for (const bad of ["80", "70000", "abc", "4400.5"]) assert.throws(() => derivePorts({ DESIGN_PORT: bad }), /DESIGN_PORT/);
  assert.throws(() => derivePorts({ DESIGN_DEV_PORT: "1" }), /DESIGN_DEV_PORT/);
});

test("routes under the base resolve to built files", () => {
  assert.equal(routeOf("/theme/", "/theme/"), "index.html");
  assert.equal(routeOf("/theme/components/", "/theme/"), "components/index.html");
  assert.equal(routeOf("/theme/exports/tokens.css", "/theme/"), "exports/tokens.css");
});

test("the frame agent is injected before </body> or appended, and names its side", () => {
  const injected = injectAgent("<html><body><p>x</p></body></html>", "after");
  assert.match(injected, /<p>x<\/p><script>[\s\S]*"after"[\s\S]*<\/script><\/body>/);
  assert.equal((injected.match(/<script>/g) ?? []).length, 1);
  const appended = injectAgent("<p>no body</p>", "before");
  assert.ok(appended.startsWith("<p>no body</p><script>"));
  assert.match(appended, /"before"/);
});

test("the live side decorates exactly the routes the build decorates", () => {
  const index = { "#e53935": ["color.accent"] };
  assert.equal(hexIndexForRoute("index.html", index), index);
  assert.equal(hexIndexForRoute("reference/index.html", index), index);
  assert.equal(hexIndexForRoute("tokens/color-text-default/index.html", index), index);
  assert.equal(hexIndexForRoute("components/button/index.html", index), index);
  assert.deepEqual(hexIndexForRoute("releases/v0-1-0/workbench/default/index.html", index), {});
  assert.equal(hexIndexForRoute("releases/v0-1-0/specimens/button/index.html", index), null);
  assert.equal(hexIndexForRoute("preview/button/specimens/x.html", index), null);
  assert.equal(hexIndexForRoute("demo/index.html", index), null);
  assert.equal(hexIndexForRoute("ui/styles/button.css", index), null);
});

test("path containment is anchored on the separator", async () => {
  await withScratch("j3w1-design-within-", async (root) => {
    const real = await fs.realpath(root);
    assert.equal(resolveWithin(real, "a/b.css"), path.join(real, "a/b.css"));
    assert.equal(resolveWithin(real, ""), real);
    assert.equal(resolveWithin(real, "../escape"), null);
    assert.equal(resolveWithin(real, "/etc/passwd"), null);
    assert.equal(resolveWithin(real, `../${path.basename(real)}-sibling/x`), null);
  });
});

test("the ledger starts empty, appends classified changes and refuses unclassifiable ones", async () => {
  await withScratch("j3w1-design-ledger-", async (root) => {
    let tick = 0;
    const git = { head: () => "a".repeat(40), branch: () => "agent/x" };
    const ledger = createLedger({ file: path.join(root, "session.json"), git, now: () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++)) });
    assert.equal(await ledger.read(), null);
    assert.deepEqual(formatReport(await ledger.read()), ["No design-mode session recorded."]);
    await ledger.init();
    const started = await ledger.read();
    assert.deepEqual(started, { schemaVersion: 1, startedAt: "2026-01-01T00:00:00.000Z", startCommit: "a".repeat(40), branch: "agent/x", entries: [] });
    await assert.rejects(ledger.append({ note: "" }), /own words/);
    await assert.rejects(ledger.append({ note: "x", changeClass: "whim" }), new RegExp(CHANGE_CLASSES.join(", ").replaceAll("/", "\\/")));
    await ledger.append({ note: "warm the panel surface", changeClass: "token", files: ["tokens/primitives.tokens.json"] });
    await ledger.append({ note: "tighten the header gap" });
    await ledger.append({ note: "align the footer", changeClass: "page-local" });
    const session = await ledger.read();
    assert.equal(session.entries.length, 3);
    assert.deepEqual(session.entries.map((e) => e.changeClass), ["token", "unclassified", "page-local"]);
    const report = formatReport(session);
    assert.equal(report[0], `Design-mode session on agent/x, started 2026-01-01T00:00:00.000Z from ${"a".repeat(12)}.`);
    assert.equal(report[1], "3 changes recorded.");
    assert.ok(report.includes("## page-local (1)") && report.includes("## token (1)") && report.includes("## unclassified (1)"));
    assert.ok(report.some((line) => line.includes("tokens/primitives.tokens.json")));
    assert.equal(report.at(-1), "2 changes belong in tokens/ or spec/, not in the site. Reconcile before the gate.");
  });
});

test("baseline metadata round-trips and route discovery skips non-page trees", async () => {
  await withScratch("j3w1-design-baseline-", async (root) => {
    assert.equal(await readBaselineMeta(root), null);
    await writeBaselineMeta(root, { commit: "b".repeat(40), dirty: false, anchoredAt: "2026-01-01T00:00:00.000Z" });
    assert.equal((await readBaselineMeta(root)).commit, "b".repeat(40));
    const baseline = path.join(root, "baseline");
    for (const dir of ["components", "tokens", "ui", "demo", "_astro", "empty"]) await fs.mkdir(path.join(baseline, dir), { recursive: true });
    for (const dir of ["components", "tokens", "ui", "demo"]) await fs.writeFile(path.join(baseline, dir, "index.html"), "<p>x</p>");
    assert.deepEqual(await discoverRoutes(baseline), ["", "components/", "tokens/"]);
    assert.deepEqual(await discoverRoutes(path.join(root, "missing")), [""]);
  });
});

test("the baseline build runs the npm that started design mode, or npm from PATH with a note", () => {
  const viaNpm = resolvePackageManager({ npm_config_user_agent: "npm/12.1.0 node/v24.21.0 linux x64", npm_execpath: "/usr/lib/node_modules/npm/bin/npm-cli.js" }, { execPath: "/usr/bin/node", platform: "linux" });
  assert.deepEqual(viaNpm, { name: "npm", command: "/usr/bin/node", args: ["/usr/lib/node_modules/npm/bin/npm-cli.js"], shell: false, warning: null });
  const viaPnpm = resolvePackageManager({ npm_config_user_agent: "pnpm/12.5.1 npm/? node/v24.21.0 linux x64", npm_execpath: "/x/pnpm.cjs" }, { execPath: "/usr/bin/node", platform: "linux" });
  assert.equal(viaPnpm.command, "npm");
  assert.match(viaPnpm.warning, /started through pnpm/);
  const direct = resolvePackageManager({}, { execPath: "/usr/bin/node", platform: "win32" });
  assert.deepEqual({ command: direct.command, shell: direct.shell }, { command: "npm", shell: true });
  assert.match(direct.warning, /outside npm/);
  const relative = resolvePackageManager({ npm_config_user_agent: "npm/12.1.0", npm_execpath: "npm-cli.js" }, { execPath: "/usr/bin/node", platform: "linux" });
  assert.equal(relative.command, "npm");
});

test("the prerequisite check names every missing piece with its fix", async () => {
  const probes = (overrides = {}) => ({
    nodeVersion: () => "v24.21.0", resolvable: async () => true, exists: async () => true, gitHead: () => "c".repeat(40),
    portFree: async () => true, runner: async () => "12.1.0", writable: async () => true, ...overrides,
  });
  const ports = { compare: 4400, before: 4401, after: 4402, dev: 4403 };
  assert.deepEqual(await checkPrerequisites({ ports, probes: probes() }), { ok: true, problems: [] });
  const broken = await checkPrerequisites({ ports, probes: probes({
    nodeVersion: () => "v22.0.0", resolvable: async (name) => name !== "astro", exists: async (file) => !file.startsWith("packages/ui/dist"),
    gitHead: () => null, portFree: async (port) => port !== 4402, runner: async () => null, writable: async () => false,
  }) });
  assert.equal(broken.ok, false);
  const checks = broken.problems.map((p) => p.check);
  assert.ok(checks.includes("Node v22.0.0") && checks.includes("astro is installed") && checks.includes("git answers rev-parse HEAD") && checks.includes("port 4402 (after) is free") && checks.includes("npm answers --version") && checks.includes(".cache is writable"));
  assert.equal(checks.filter((c) => c.startsWith("packages/ui/dist")).length, 3);
  assert.ok(broken.problems.every((p) => p.fix.length > 10));
  assert.match(broken.problems.find((p) => p.check.startsWith("packages/ui/dist")).fix, /npm run generate/);
});
