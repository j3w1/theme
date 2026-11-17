import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { repoRoot } from "../scripts/lib/fs.mjs";
import Reporter from "./evidence-reporter.mjs";

test("selected verification rejects invalid catalogue scopes without writing execution evidence", async (t) => {
  const errors = [];
  t.mock.method(console, "error", (...args) => errors.push(args.join(" ")));
  t.mock.method(console, "log", () => {});
  const files = ["test-results/evidence.json", "test-results/evidence-error.json"];
  const snapshot = () => files.map(file => existsSync(`${repoRoot}/${file}`) ? readFileSync(`${repoRoot}/${file}`, "utf8") : null);
  const before = snapshot();
  const scope = { component: "select", category: "enhancements", states: ["default"], variants: ["default", "multiple"], note: "Unit-test fixture only" };
  for (const [patch, message] of [
    [{ component: "unknown-component" }, /Unknown evidence component/],
    [{ states: ["default", "selected", "expanded", "collapsed"] }, /Unknown state for select/],
    [{ variants: ["unknown-variant"] }, /Unknown variant for select/],
    [{ category: "unknown-category" }, /Invalid option/],
  ]) {
    const reporter = new Reporter();
    reporter.subset = true;
    reporter.collectionErrors = [];
    reporter.records = [{ scope: { ...scope, ...patch } }];
    assert.deepEqual(await reporter.onEnd({ status: "passed" }), { status: "failed" });
    assert.match(errors.at(-1), message);
  }
  for (const valid of [scope, { ...scope, component: "page", states: [], variants: [] }]) {
    const reporter = new Reporter();
    reporter.subset = true;
    reporter.collectionErrors = [];
    reporter.records = [{ scope: valid }];
    assert.equal(await reporter.onEnd({ status: "passed" }), undefined);
  }
  assert.deepEqual(snapshot(), before);
});
