/* The implementation identity follows each component's emitted runtime
   closure: an edit reaches only the components whose closure it is in, and
   nothing outside a closure moves any id. */

import assert from "node:assert/strict";
import test from "node:test";
import { listFiles, readText } from "../scripts/lib/fs.mjs";
import { implementationIds, implementationPlaceholder, substituteImplementationIds } from "../scripts/lib/ui-distribution.mjs";

const definitions = { alpha: { module: "alpha" }, beta: { module: "beta" } };
const modules = () => new Map([
  ["components/alpha.js", `import "../chunks/shared.js";\nimport "../chunks/alpha-only.js";\nclass A { static implementationId = "${implementationPlaceholder("alpha")}"; }`],
  ["components/beta.js", `import "../chunks/shared.js";\nclass B { static implementationId = "${implementationPlaceholder("beta")}"; }`],
  ["chunks/shared.js", "export const shared = 1;"],
  ["chunks/alpha-only.js", "export const onlyAlpha = 1;"],
  ["chunks/unrelated.js", "export const unrelated = 1;"],
]);
const closureOf = { alpha: ["components/alpha.js", "chunks/shared.js", "chunks/alpha-only.js"], beta: ["components/beta.js", "chunks/shared.js"] };
const idsOf = (source) => implementationIds(new Map(Object.entries(closureOf).map(([id, names]) => [id, new Map(names.map((name) => [name, source.get(name)]))])), definitions);

test("an edit changes the id of exactly the components whose closure contains it", () => {
  const before = idsOf(modules());
  const edited = modules();
  edited.set("chunks/alpha-only.js", "export const onlyAlpha = 2;");
  const after = idsOf(edited);
  assert.notEqual(after.get("alpha"), before.get("alpha"));
  assert.equal(after.get("beta"), before.get("beta"));
  const shared = modules();
  shared.set("chunks/shared.js", "export const shared = 2;");
  assert.ok(["alpha", "beta"].every((id) => idsOf(shared).get(id) !== before.get(id)));
});

test("modules outside every closure never move an id, and definitions do", () => {
  const before = idsOf(modules());
  const unrelated = modules();
  unrelated.set("chunks/unrelated.js", "export const unrelated = 2;");
  assert.deepEqual(idsOf(unrelated), before);
  const changed = implementationIds(new Map([["beta", new Map(closureOf.beta.map((name) => [name, modules().get(name)]))]]), { ...definitions, beta: { module: "beta", api: {} } });
  assert.notEqual(changed.get("beta"), before.get("beta"));
});

test("placeholders are fully substituted and unknown placeholders fail", () => {
  const ids = idsOf(modules());
  const out = substituteImplementationIds(modules(), ids);
  for (const text of out.values()) assert.doesNotMatch(text, /__J3W1_IMPLEMENTATION_ID_/);
  assert.ok(out.get("components/alpha.js").includes(ids.get("alpha")));
  const stray = modules();
  stray.set("chunks/unrelated.js", `"${implementationPlaceholder("gamma")}"`);
  assert.throws(() => substituteImplementationIds(stray, ids), /Unknown implementation placeholder/);
  const missing = modules();
  missing.delete("components/beta.js");
  assert.throws(() => substituteImplementationIds(missing, ids), /No emitted module/);
});

test("the published package carries one distinct substituted id per component", async () => {
  const files = await listFiles("packages/ui/dist", { filter: (f) => f.endsWith(".js") });
  const ids = new Map();
  for (const file of files) {
    const text = await readText(file);
    assert.doesNotMatch(text, /__J3W1_IMPLEMENTATION_ID_/, file);
    if (file.includes("/copy/")) continue;
    for (const [, id, value] of text.matchAll(/static componentId = "([a-z0-9-]+)";[\s\S]*?static implementationId = "([^"]+)";/g)) {
      assert.match(value, /^sha256-/);
      assert.ok(!ids.has(id) || ids.get(id) === value, id);
      ids.set(id, value);
    }
  }
  assert.equal(ids.size, 67);
  assert.equal(new Set(ids.values()).size, ids.size);
});
