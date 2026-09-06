import assert from "node:assert/strict";
import test from "node:test";
import { readJson, readText } from "../scripts/lib/fs.mjs";
import { validateDecisions, validateDocs, validateManifest } from "../scripts/lib/validators.mjs";

test("theme.json validates, points at existing files and agrees with package.json and the changelog", async () => {
  const manifest = await validateManifest();
  assert.equal(manifest.name, "j3w1-theme");
  assert.equal(manifest.site.url, "https://j3w1.github.io/theme/");
  assert.equal(manifest.site.base, "/theme");
  assert.equal(manifest.font.bundled, false);
  const defaults = manifest.profiles.filter((p) => p.default);
  assert.equal(defaults.length, 1);
  assert.equal(defaults[0].status, "approved");
});

test("decisions D-001 to D-004 are accepted and every approved token cites one of them", async () => {
  const decisions = await validateDecisions();
  for (const id of ["D-001", "D-002", "D-003", "D-004"]) assert.equal(decisions.get(id)?.status, "accepted", id);
  const primitives = await readJson("tokens/primitives.tokens.json");
  const walk = (node, path = []) => {
    if (node && typeof node === "object") {
      if ("$value" in node) {
        const ext = node.$extensions?.["io.github.j3w1.theme"];
        if (ext?.status === "approved") assert.equal(decisions.get(ext.approval?.decision)?.status, "accepted", `${path.join(".")} cites ${ext.approval?.decision}`);
        return;
      }
      for (const [k, v] of Object.entries(node)) if (!k.startsWith("$")) walk(v, [...path, k]);
    }
  };
  walk(primitives);
});

test("normative docs validate and contain no root-absolute links", async () => {
  const docs = await validateDocs();
  const ids = docs.map((d) => d.id).sort();
  for (const id of ["identity", "foundations", "accessibility", "portability", "decisions"]) assert.ok(ids.includes(id), id);
  const identity = await readText("spec/identity.md");
  assert.match(identity, /<!-- @compact:start -->/);
  const foundations = await readText("spec/foundations.md");
  assert.match(foundations, /<!-- @compact:start -->[\s\S]*Selection is a fill; focus is a ring[\s\S]*<!-- @compact:end -->/);
});

test("the contributor bridge imports AGENTS.md and the consumer contract never points at main", async () => {
  assert.equal((await readText("CLAUDE.md")).trim(), "@AGENTS.md");
  const consume = await readText("agents/consume.md");
  assert.doesNotMatch(consume, /raw\.githubusercontent\.com\/j3w1\/theme\/main\//);
  assert.match(consume, /theme\.lock\.json/);
  assert.match(consume, /deviation report/i);
});
