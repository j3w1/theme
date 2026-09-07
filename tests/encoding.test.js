import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { gitFiles, repoRoot } from "../scripts/lib/fs.mjs";

test("specification and site sources are valid UTF-8 on every host", async () => {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (const file of new Set(gitFiles().filter((f) => /^(spec|site|agents)\//.test(f) && /\.(md|astro|ts|js|mjs|css|json)$/.test(f)))) {
    const bytes = await readFile(path.join(repoRoot, file));
    assert.doesNotThrow(() => decoder.decode(bytes), `${file} must preserve UTF-8 source text`);
  }
});
