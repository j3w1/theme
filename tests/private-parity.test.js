import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { parityPrerequisites, compareProperties, assertPrivateDestination } from "../scripts/lib/private-parity.mjs";
import { privateAssetPath } from "../schemas/private-path.mjs";
import { safeKitPath } from "../schemas/task-kit.mjs";
import { repoRoot } from "../scripts/lib/fs.mjs";
import { preparePrivateParity } from "../scripts/lib/private-parity.mjs";
import { promises as fs } from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
test("missing licensed inputs produce a prerequisite record without an execution pass", () => {
  const result = parityPrerequisites(null);
  assert.equal(result.result, "not run"); assert.deepEqual(result.checks, []); assert.equal(result.missing.length, 3);
  assert.equal(parityPrerequisites({}).result, "not run");
});

test("the independently authored framework fixture parses without a licensed dependency", () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, ["--check", "templates/private-parity/App.mjs"], { cwd: repoRoot, stdio: "pipe" }));
});

test("private preparation pins native specimens, verifies installed/locked versions and leaves its source unchanged", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "theme-parity-test-"));
  const target = path.join(root, "synthetic-source");
  await fs.mkdir(target);
  const pkg = JSON.stringify({ version: "1.0.0", dependencies: { vue: "1.0.0", vuetify: "1.0.0", vite: "1.0.0", "vite-plugin-vuetify": "1.0.0", sass: "1.0.0" } });
  await fs.writeFile(path.join(target, "package.json"), pkg);
  const lock = "lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      vue: { version: '1.0.0' }\n      vuetify: { version: '1.0.0' }\n      vite: { version: '1.0.0' }\n      vite-plugin-vuetify: { version: '1.0.0' }\n      sass: { version: '1.0.0' }\n";
  await fs.writeFile(path.join(target, "pnpm-lock.yaml"), lock);
  for (const name of ["vue", "vuetify", "vite", "vite-plugin-vuetify", "sass"]) {
    await fs.mkdir(path.join(target, "node_modules", name), { recursive: true });
    await fs.writeFile(path.join(target, "node_modules", name, "package.json"), JSON.stringify({ version: "1.0.0" }));
  }
  await fs.writeFile(path.join(target, "defaults.js"), "export default {};\n");
  await fs.writeFile(path.join(target, "_style.scss"), "/* synthetic styles only */\n");
  const config = { schemaVersion: 1, target, out: path.join(root, "prepared"), themeRef: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim(), templateVersion: "1.0.0",
    license: { type: "regular", reference: "Synthetic unit fixture; no licensed content or real import.", reviewed: true },
    lock: "pnpm-lock.yaml", sources: [{ from: "defaults.js", to: "defaults.js" }, { from: "_style.scss", to: "_style.scss" }],
    defaults: "defaults.js", styles: "_style.scss", frameworkStyles: "_style.scss", aliases: {} };
  try {
    const result = await preparePrivateParity(config);
    assert.equal(result.result, "prepared");
    assert.equal(new Set(result.metadata.cases.map(entry => entry.id)).size, 7);
    assert.match(result.metadata.harnessSourceDigest, /^sha256-/);
    assert.equal(await fs.readFile(path.join(target, "package.json"), "utf8"), pkg);
    assert.equal(await fs.readFile(path.join(target, "pnpm-lock.yaml"), "utf8"), lock);
    assert.equal(await fs.readFile(path.join(result.out, "host", "_style.scss"), "utf8"), "/* synthetic styles only */\n");
    assert.equal(result.metadata.frameworkStyleMode, "configured Sass");
    assert.equal(result.metadata.frameworks["vite-plugin-vuetify"], "1.0.0");
    assert.equal(result.metadata.frameworks.sass, "1.0.0");
    assert.equal(result.metadata.adapter.frameworkStyles, "_style.scss");
    assert.ok(result.metadata.cases.every(entry => entry.fixtureDigest && entry.contractDigest));
    await assert.rejects(preparePrivateParity({ ...config, templateVersion: "wrong" }), /Template version/);
    await fs.writeFile(path.join(target, "node_modules", "vite-plugin-vuetify", "package.json"), JSON.stringify({ version: "2.0.0" }));
    await assert.rejects(preparePrivateParity(config), /must agree exactly/);
  } finally {
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
    await fs.rm(root, { recursive: true, force: true });
  }
});
test("intentional property mismatches are detected exactly and explained", () => {
  const result = compareProperties({ padding: "16px", color: "rgb(1, 2, 3)" }, { padding: "17px", color: "rgb(1, 2, 3)" });
  assert.deepEqual(result[0], { property: "padding", expected: "16px", actual: "17px", result: "different" });
  assert.equal(result[1].result, "matched");
  assert.equal(compareProperties({ padding: "16px" }, {})[0].actual, null);
});
test("private copying retains real Sass names without weakening public kit paths", () => {
  assert.equal(privateAssetPath("host/styles/_variables.scss"), true);
  assert.equal(safeKitPath("host/styles/_variables.scss"), false);
  for (const name of ["../outside", "/root", "x/../y", "x/NUL", "x/c:stream", "x/file.", "x\\y"]) assert.equal(privateAssetPath(name), false, name);
  assert.throws(() => assertPrivateDestination(path.resolve("other-target"), path.join(repoRoot, ".cache", "private")), /separate/);
  assert.throws(() => assertPrivateDestination(repoRoot, path.dirname(repoRoot)), /separate/);
});
