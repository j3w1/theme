/* The deployed tree is scanned with the same rules as the sources. */

import assert from "node:assert/strict";
import test from "node:test";
import { listFiles } from "../../scripts/lib/fs.mjs";
import { scanFiles } from "../../scripts/lib/private-material.mjs";

test("dist/ contains no vendor material, fonts, credentials or user-site links", async () => {
  const files = await listFiles("dist");
  assert.ok(files.length > 0, "dist/ is empty — run npm run build first");
  const findings = await scanFiles(files, { textOnly: true });
  assert.deepEqual(findings, []);
});
