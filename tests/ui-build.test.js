import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { spawnSync } from "node:child_process";
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
