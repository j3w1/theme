import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { repoRoot } from "../scripts/lib/fs.mjs";
import { scratchDir } from "./helpers/scratch.mjs";

test("UI distribution bytes and implementation identities do not depend on the caller's directory", async t => {
  const cwd = await scratchDir(t, "j3w1-ui-build-cwd-");
  const result = spawnSync(process.execPath, [path.join(repoRoot, "scripts/build-ui.mjs"), "--check"], {
    cwd, encoding: "utf8", windowsHide: true, timeout: 120000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + "\n" + result.stderr);
  assert.match(result.stdout, /complete component distributions/);
});

test("concurrent UI checks preserve the shared stage and the committed distribution bytes", async t => {
  const cwd = await scratchDir(t, "j3w1-ui-build-concurrent-");
  const run = directory => new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(repoRoot, "scripts/build-ui.mjs"), "--check"], {
      cwd: directory, windowsHide: true, timeout: 120000,
    });
    let stdout = "", stderr = "", error;
    child.stdout.on("data", bytes => { stdout += bytes; });
    child.stderr.on("data", bytes => { stderr += bytes; });
    child.on("error", failure => { error = failure; });
    child.on("close", (status, signal) => resolve({ stdout, stderr, error, status, signal }));
  });
  const results = await Promise.all([run(repoRoot), run(cwd)]);
  for (const result of results) {
    assert.ifError(result.error);
    assert.equal(result.signal, null, result.stderr);
    assert.equal(result.status, 0, result.stdout + "\n" + result.stderr);
    assert.match(result.stdout, /complete component distributions/);
  }
});
