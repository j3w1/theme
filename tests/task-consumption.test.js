import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { z } from "zod";
import { lockSchema } from "../schemas/lock.mjs";

const directory = "tests/consumption/task-fixtures/bbf0cc9-2026-09-07-2/";
const json = async (name) => JSON.parse(await readFile(directory + name, "utf8"));
test("composed acceptance retains the reviewed candidate and upstream lock identity", async () => {
  const manifest = await json("kit-manifest.json");
  const provenance = await json("provenance.json");
  const review = await json("review.json");
  assert.equal(review.conclusion, "passed");
  for (const [file, digest] of Object.entries(review.candidateHashes)) assert.equal(digest, provenance.candidateDigests[file], file);
  const lock = lockSchema(z).parse(await json("theme.lock.json"));
  assert.equal(lock.revision, manifest.source.revision);
  assert.equal(provenance.revision, lock.revision);
  assert.deepEqual(lock.components, manifest.request.components);
  assert.deepEqual(lock.integration, manifest.request.integration);
  for (const [file, digest] of Object.entries(lock.exports)) assert.equal(digest, manifest.source.inputs[file], file);
  for (const [file, digest] of Object.entries(provenance.candidateDigests)) {
    assert.equal("sha256-" + createHash("sha256").update(await readFile(directory + file)).digest("base64"), digest, file);
  }
  assert.ok(lock.deviations.length > 0, "Actual downstream omissions and ambiguities remain recorded");
});
