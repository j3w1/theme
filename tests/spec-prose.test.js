import assert from "node:assert/strict";
import test from "node:test";
import { listFiles, readText } from "../scripts/lib/fs.mjs";
import { splitFrontmatter } from "../scripts/lib/spec.mjs";

/* Contrast ratios are computed from the tokens (frontmatter contrast pairs,
   exports/contrast.md). Spec prose names only the floors; a hand-written ratio
   goes stale the moment a value changes. */
const FLOORS = new Set(["3:1", "4.5:1", "7:1"]);
const RATIO = /(?<![\d.])\d+(?:\.\d+)?:1(?![\d.])/g;

const strays = (text) => [...text.matchAll(RATIO)].map((m) => m[0]).filter((r) => !FLOORS.has(r));

test("spec prose names no contrast ratio other than the floors", async () => {
  const problems = [];
  const docs = await listFiles("spec", { filter: (f) => /^spec\/[a-z-]+\.md$/.test(f) && f !== "spec/decisions.md" });
  for (const file of docs) for (const r of strays(await readText(file))) problems.push(`${file}: ${r}`);
  for (const file of await listFiles("spec/components", { filter: (f) => f.endsWith(".md") })) {
    const { body } = splitFrontmatter(await readText(file), file);
    for (const r of strays(body)) problems.push(`${file}: ${r}`);
  }
  assert.deepEqual(problems, []);
});

test("the ratio pattern catches stray ratios and spares the floors", () => {
  assert.deepEqual(strays("4.5:1 text, 3:1 rings, 7:1 AAA; was 9.28:1 and 10:1"), ["9.28:1", "10:1"]);
});
