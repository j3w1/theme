import assert from "node:assert/strict";
import test from "node:test";
import { eligibilityOf, POLICY_TEXT, releaseOf } from "../scripts/lib/eligibility.mjs";
import { loadResolvedProfile, toResolvedExport } from "../scripts/lib/tokens.mjs";
import { readJson, readText } from "../scripts/lib/fs.mjs";
const profile = { status: "approved", default: true };
const token = (status = "observed", more = {}) => ({ path: "color.text.example", chain: [], extensions: { "io.github.j3w1.theme": { status, approval: { decision: "D-007" } } }, ...more });

test("eligibility separates profile, role, deprecation and pending dependency policies", () => {
  const evaluate = (p, t) => eligibilityOf(p, t, new Map());
  assert.equal(evaluate(profile, token()).action, "use");
  assert.equal(evaluate(profile, token("approved")).action, "use");
  assert.deepEqual(evaluate(profile, token("proposed")).decisionIds, ["D-007"]);
  assert.equal(evaluate(profile, token("proposed")).action, "use-and-report");
  assert.equal(evaluate({ status: "proposed" }, token("approved")).action, "blocked");
  assert.equal(evaluate({ status: "heritage" }, token("heritage", { deprecated: true })).action, "historical-only");
  assert.equal(evaluate(profile, token("proposed", { deprecated: true })).action, "blocked");
  assert.equal(evaluate(profile, token("heritage")).action, "blocked");
  assert.equal(evaluate(profile, token("proposed", { extensions: { "io.github.j3w1.theme": { status: "proposed" } } })).action, "blocked");
  const dependency = token("proposed", { path: "color.border.control" });
  const alias = token("approved", { chain: [dependency.path] });
  assert.equal(eligibilityOf(profile, alias, new Map([[dependency.path, dependency]])).action, "use-and-report");
});

test("release numbering does not alter consumption policy", () => {
  assert.equal(releaseOf("0.1.0").stability, "release");
  assert.equal(releaseOf("0.1.0-beta.1").stability, "prerelease");
  assert.equal(releaseOf("0.1.0+build-id").stability, "release");
  assert.equal(releaseOf("0.1.0").policy, releaseOf("0.1.0-beta.1").policy);
});

test("every exported token and component value agrees with the policy; decision references exist", async () => {
  const manifest = await readJson("theme.json");
  const exported = await readJson("exports/tokens.resolved.json");
  const decisions = await readText("spec/decisions.md");
  for (const p of manifest.profiles) {
    const resolved = await loadResolvedProfile(p.tokens);
    assert.deepEqual(exported.profiles[p.id].tokens, toResolvedExport(resolved, p));
    for (const entry of Object.values(exported.profiles[p.id].tokens)) {
      for (const id of entry.eligibility.decisionIds) assert.ok(decisions.includes(`| ${id} |`), id);
    }
  }
  const component = await readJson("exports/components/button.json");
  for (const entry of [...Object.values(component.tokens), ...component.stateRules.flatMap((state) => Object.values(state.tokens))]) {
    assert.deepEqual(entry.eligibility, exported.profiles.default.tokens[entry.alias].eligibility);
  }
  for (const file of ["README.md", "agents/consume.md", "exports/theme.compact.md", "exports/theme.full.md", "exports/components/button.brief.txt"]) assert.ok((await readText(file)).includes(POLICY_TEXT), file);
});
