import assert from "node:assert/strict";
import test from "node:test";
import { recordJson } from "../scripts/lib/json-records.mjs";
import { renderWindowsTemplate } from "../scripts/lib/windows-template.mjs";

test("record formatting preserves nested JSON semantics, order and escaping", () => {
  const value = { title: 'quotes " braces {} newline\n and 雪', missing: undefined,
    date: new Date("2026-01-01T00:00:00Z"), rows: [null, { a: 1, nested: { rows: [2, 3] } }, undefined],
    empty: [], nan: NaN, flags: { rows: [{ escaped: "\\", absent: undefined }] } };
  const text = recordJson(value, ["rows"]);
  assert.deepEqual(JSON.parse(text), JSON.parse(JSON.stringify(value)));
  assert.equal(recordJson(JSON.parse(text), ["rows"]), text);
  assert.deepEqual(Object.keys(JSON.parse(text)), Object.keys(JSON.parse(JSON.stringify(value))));
  assert(text.endsWith("\n") && !text.includes("\r"));
  assert(text.includes('    {"a":1,"nested":{"rows":[2,3]}},'));
  assert.throws(() => recordJson({ bigint: 1n }, ["rows"]), TypeError);
  const cyclic = {}; cyclic.self = cyclic;
  assert.throws(() => recordJson(cyclic, ["rows"]), TypeError);
});

test("native templates reject missing, inherited and unresolved placeholders", () => {
  assert.equal(renderWindowsTemplate("@ONE@ @TWO@ @ONE@", { ONE: "a", TWO: "b" }, "test"), "a b a");
  assert.throws(() => renderWindowsTemplate("@MISSING@", {}, "test"), /Unknown test placeholder MISSING/);
  assert.throws(() => renderWindowsTemplate("@ONE@", Object.create({ ONE: "inherited" }), "test"), /Unknown test placeholder ONE/);
  assert.throws(() => renderWindowsTemplate("@ONE@", { ONE: "@NEXT@" }, "test"), /Unresolved test placeholder/);
  assert.equal(renderWindowsTemplate("// @id untouched", {}, "test"), "// @id untouched");
});
