import test from "node:test";
import assert from "node:assert/strict";
import { readText } from "../scripts/lib/fs.mjs";
import { buildFigmaPayload } from "../scripts/lib/figma-payload.mjs";
import { importFigmaVariables } from "../scripts/lib/figma-importer.mjs";
const source = { revision: "a".repeat(40), read: readText };
const makeApi = () => {
  let sequence = 0; const collections = [], variables = [], mutations = [];
  return { collections, variables, mutations, variablesApi: {
    getLocalVariableCollectionsAsync: async () => collections,
    getLocalVariablesAsync: async () => variables,
    createVariableCollection(name) {
      const collection = { id: `c${++sequence}`, name, defaultModeId: "mode", modes: [{ modeId: "mode", name: "Mode 1" }], renameMode(id, value) { this.modes[0].name = value; }, remove() { mutations.push(["remove-collection", this.id]); collections.splice(collections.indexOf(this), 1); } };
      collections.push(collection); mutations.push(["create-collection", collection.id]); return collection;
    },
    createVariable(name, collection, type) {
      const variable = { id: `v${++sequence}`, name, variableCollectionId: collection.id, resolvedType: type, description: "", scopes: ["ALL_SCOPES"], valuesByMode: {}, setValueForMode(mode, value) { mutations.push(["value", this.id]); this.valuesByMode[mode] = type === "COLOR" && !value.type ? Object.fromEntries(Object.entries(value).map(([key, number]) => [key, Math.fround(number)])) : structuredClone(value); }, remove() { mutations.push(["remove", this.id]); variables.splice(variables.indexOf(this), 1); } };
      variables.push(variable); mutations.push(["create", variable.id]); return variable;
    },
  } };
};
test("pinned payload is deterministic, preserves alias dependencies and reports unsupported types and profiles", async () => {
  const a = await buildFigmaPayload(source), b = await buildFigmaPayload(source);
  assert.deepEqual(a, b); assert.equal(a.variables.length, 6);
  assert.equal(a.variables.find(item => item.id === "color.surface.default").value.alias, "color.primitive.ink.30");
  assert.deepEqual(a.variables.find(item => item.dependencyOnly).scopes, []);
  const unsupported = await buildFigmaPayload(source, ["font.family.mono", "shadow.floating"]);
  assert.equal(unsupported.variables.length, 0); assert.equal(unsupported.unsupported.length, 2);
  assert.deepEqual(a.excludedProfiles.map(item => item.status), ["heritage", "proposed"]);
  await assert.rejects(buildFigmaPayload({ ...source, revision: "main" }), /immutable/);
});
test("dry-run makes no mutations, apply is idempotent, reviewed update and rollback preserve stable aliases", async () => {
  const api = makeApi(), figma = { variables: api.variablesApi }, payload = await buildFigmaPayload(source), documentKey = "test-document";
  const call = options => importFigmaVariables(figma, { payload, documentKey, ...options });
  const dry = await call({}); assert.equal(dry.diff.length, 6); assert.equal(api.mutations.length, 0);
  const applied = await call({ action: "apply" }); assert.equal(api.variables.length, 6);
  const mutations = api.mutations.length;
  const repeat = await call({ action: "apply", receipt: applied.receipt }); assert.deepEqual(repeat.diff, []); assert.equal(api.mutations.length, mutations);
  const update = structuredClone(payload); update.variables.find(item => item.id === "space.4").value = 8;
  const preview = await call({ payload: update, receipt: applied.receipt }); assert.equal(preview.diff.length, 1); assert.equal(preview.diff[0].operation, "update"); assert.equal(api.mutations.length, mutations);
  const changed = await call({ payload: update, action: "apply", receipt: applied.receipt });
  assert.equal(api.variables.find(item => item.name === "space/4").valuesByMode.mode, 8);
  await call({ payload: update, action: "rollback", receipt: changed.receipt });
  assert.equal(api.variables.find(item => item.name === "space/4").valuesByMode.mode, 4);
  const back = await call({ action: "rollback", receipt: applied.receipt }); assert.equal(back.receipt, null); assert.equal(api.variables.length, 0); assert.equal(api.collections.length, 0);
});
test("manual edits, detached IDs, name collisions, wrong documents and extra modes fail before mutation", async () => {
  for (const damage of ["manual", "detached", "mode", "document", "unowned"]) {
    const api = makeApi(), figma = { variables: api.variablesApi }, payload = await buildFigmaPayload(source);
    const options = { payload, documentKey: "test-document", action: "apply" };
    const { receipt } = await importFigmaVariables(figma, options);
    if (damage === "manual") api.variables[0].valuesByMode.mode = { r: 1, g: 1, b: 1, a: 1 };
    if (damage === "detached") api.variables.splice(0, 1);
    if (damage === "mode") api.collections[0].modes.push({ modeId: "other", name: "Other" });
    if (damage === "document") options.documentKey = "wrong";
    if (damage === "unowned") receipt.entries.pop();
    const before = api.mutations.length;
    await assert.rejects(importFigmaVariables(figma, { ...options, receipt })); assert.equal(api.mutations.length, before);
  }
});
test("missing receipts and unrelated variables are never silently adopted or deleted", async () => {
  const api = makeApi(), figma = { variables: api.variablesApi }, payload = await buildFigmaPayload(source), documentKey = "test-document";
  const { receipt } = await importFigmaVariables(figma, { payload, documentKey, action: "apply" });
  await assert.rejects(importFigmaVariables(figma, { payload, documentKey, action: "apply" }), /without its ownership receipt/);
  const unrelated = api.variablesApi.createVariable("Personal spacing", api.collections[0], "FLOAT"); unrelated.setValueForMode("mode", 17);
  const before = api.mutations.length;
  await assert.rejects(importFigmaVariables(figma, { payload, documentKey, receipt, action: "rollback" }), /unrelated/);
  assert.equal(api.mutations.length, before); assert.equal(unrelated.valuesByMode.mode, 17);
  const bad = structuredClone(payload); bad.variables.at(-1).value = -2;
  await assert.rejects(importFigmaVariables(figma, { payload: bad, documentKey, receipt, action: "apply" }), /Invalid scalar/);
  assert.equal(api.mutations.length, before);
});
test("rollback preserves an unrelated alias in another collection", async () => {
  const api = makeApi(), figma = { variables: api.variablesApi }, payload = await buildFigmaPayload(source), documentKey = "test-document";
  const { receipt } = await importFigmaVariables(figma, { payload, documentKey, action: "apply" });
  const personal = api.variablesApi.createVariableCollection("Personal"), alias = api.variablesApi.createVariable("My gap", personal, "FLOAT");
  alias.setValueForMode("mode", { type: "VARIABLE_ALIAS", id: receipt.entries.find(entry => entry.tokenId === "space.4").after.id });
  const before = api.mutations.length;
  await assert.rejects(importFigmaVariables(figma, { payload, documentKey, receipt, action: "rollback" }), /unrelated variable aliases/);
  assert.equal(api.mutations.length, before); assert.equal(api.variables.length, 7);
});
