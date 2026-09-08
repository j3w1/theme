import test from "node:test";
import assert from "node:assert/strict";
import { parseFragment } from "parse5";
import { z } from "zod";
import { readJson } from "../scripts/lib/fs.mjs";
import { loadFieldTemplates, validatePatterns } from "../scripts/lib/patterns.mjs";
import { renderFields } from "../scripts/lib/form-fields.mjs";
import { attribute, walkMarkup } from "../scripts/lib/markup.mjs";
import { initialWorkflow, workflowTransition, parseFormSchema, validateFields } from "../scripts/lib/form-model.mjs";
import { validateWorkstation } from "../scripts/lib/validation-recovery.mjs";
import { formSchema } from "../schemas/form-schema.mjs";
const pattern = await validatePatterns();
test("recovery preserves values, validates on submit, and requires busy before completion", () => {
  const go = (state, event) => workflowTransition(state, event, pattern.fields, validateWorkstation);
  let state = initialWorkflow(pattern.fields);
  assert.throws(() => go(state, { type: "complete" }), /Unsupported/);
  state = go(state, { type: "submit", values: pattern.fixtures.invalid });
  assert.equal(state.stage, "invalid"); assert.deepEqual(Object.keys(state.errors), ["name", "hostname"]);
  const previous = state;
  state = go(state, { type: "input", values: pattern.fixtures.valid });
  assert.deepEqual(state.errors, previous.errors); assert.equal(state.announcement, previous.announcement);
  state = go(state, { type: "submit", values: pattern.fixtures.valid }); assert.equal(state.stage, "review");
  state = go(state, { type: "edit" }); assert.deepEqual(state.values, pattern.fixtures.valid);
  state = go(state, { type: "submit", values: state.values });
  state = go(state, { type: "confirm" }); assert.equal(state.stage, "busy");
  assert.throws(() => go(state, { type: "submit", values: {} }), /Unsupported/);
  state = go(state, { type: "complete" }); assert.equal(state.stage, "success");
  assert.deepEqual(state.values, pattern.fixtures.valid);
  state = go(state, { type: "reset" }); assert.equal(state.stage, "editing"); assert.equal(state.values.notes, "");
});
const fields = ["text", "textarea", "select", "checkbox", "radio"].map(type => ({ id: type, type, label: `<img src=x onerror=alert(1)> ${type}`, help: "Plain <b>help</b>", required: true, options: ["select", "radio"].includes(type) ? [{ id: "one", label: "One <script>" }, { id: "two", label: "Two" }] : [] }));
test("shared renderer retains canonical anatomy, escapes user text and resolves all accessible IDs after reordering", async () => {
  const templates = await loadFieldTemplates();
  const html = renderFields([...fields].reverse(), { text: '<script>alert(1)</script>', textarea: '</textarea><script>x</script>', radio: "two", checkbox: true, select: "one" }, { templates, prefix: "roundtrip", errors: { text: "Correct <b>this</b>" } });
  const tree = parseFragment(html), ids = new Set(), refs = [], checkedRadios = [];
  walkMarkup(tree, node => {
    assert.notEqual(node.tagName, "script"); assert.notEqual(node.tagName, "img");
    const id = attribute(node, "id"); if (id) { assert.ok(!ids.has(id), id); ids.add(id); }
    if (attribute(node, "type") === "radio" && attribute(node, "checked") !== undefined) checkedRadios.push(attribute(node, "value"));
    for (const name of ["for", "aria-describedby", "aria-labelledby"]) if (attribute(node, name)) refs.push(...attribute(node, name).split(/\s+/));
  });
  for (const ref of refs) assert.ok(ids.has(ref), ref);
  assert.match(html, /&lt;script&gt;/); assert.match(html, /class="radio-group-option"/);
  assert.deepEqual(checkedRadios, ["two"]);
});
test("closed bounded definitions reject unsupported fields, duplicate identities, oversized data and wrong revision", async () => {
  const theme = { name: "j3w1-theme", version: "0.1.0", profile: "default", sourceDigest: "sha256-YQ==" };
  const data = { schemaVersion: 1, theme, density: "compact", fields };
  assert.deepEqual(parseFormSchema(JSON.stringify(data), theme), data);
  for (const mutate of [d => d.fields[0].type = "html", d => d.fields[0].script = "anything", d => d.fields[1].id = d.fields[0].id, d => d.fields[2].options[1].id = "one", d => d.theme.version = "9.0.0", d => d.fields[0].label = "x".repeat(121), d => d.fields[0].options = [{ id: "x", label: "X" }]]) {
    const invalid = structuredClone(data); mutate(invalid); assert.throws(() => parseFormSchema(JSON.stringify(invalid), theme));
  }
  assert.throws(() => parseFormSchema(" ".repeat(65537), theme), /64 KiB/);
  assert.ok(formSchema(z).safeParse(data).success);
  const errors = validateFields(fields, { text: "", textarea: "x".repeat(2001), checkbox: false, select: "unknown", radio: "unknown" });
  assert.equal(Object.keys(errors).length, 5);
});
