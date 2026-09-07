import assert from "node:assert/strict";
import test from "node:test";
import { parseFragment } from "parse5";
import { loadComponent, loadComponents, splitVariants } from "../scripts/lib/spec.mjs";
import { attribute, walkMarkup } from "../scripts/lib/markup.mjs";
import { renderSpecimenMarkup, stateAttributes } from "../scripts/lib/specimen-markup.mjs";

const elements = (source) => {
  const result = [];
  walkMarkup(parseFragment(source), (node) => { if (node.tagName) result.push(node); });
  return result;
};

test("every maintained matrix fragment renders with isolated IDs and inert non-default controls", async () => {
  const allIds = new Set();
  for (const component of await loadComponents()) {
    if (!component.demo) continue;
    for (const [variant, source] of splitVariants(component.demo)) for (const state of component.states) {
      const suffix = `${component.id}-${variant}-${state.replaceAll("+", "-")}`;
      const nodes = elements(renderSpecimenMarkup(source, suffix, { state, inert: state !== "default" }));
      for (const node of nodes) {
        const id = attribute(node, "id");
        if (id !== undefined) { assert.ok(!allIds.has(id), id); allIds.add(id); }
        if (state !== "default" && ["a", "button", "input", "select", "textarea", "summary"].includes(node.tagName)) assert.equal(attribute(node, "tabindex"), "-1", suffix);
      }
    }
  }
  assert.ok(allIds.size > 100);
});

test("parsed relationships preserve ID lists, fragments and independent native groups", () => {
  const source = '<label for="field">Name</label><input id="field" name="group" aria-describedby="help error"><p id="help">Help</p><p id="error">Error</p><a href="#help">Help</a>';
  const result = renderSpecimenMarkup(source, "one");
  assert.match(result, /for="field-one"/);
  assert.match(result, /name="group-one"/);
  assert.match(result, /aria-describedby="help-one error-one"/);
  assert.match(result, /href="#help-one"/);
  assert.throws(() => renderSpecimenMarkup('<p id="same"></p><p id="same"></p>', "one"), /duplicate/);
  assert.throws(() => renderSpecimenMarkup(source, 'x"'), /suffix/);
  assert.throws(() => renderSpecimenMarkup(source, "one", { state: 'x"' }), /state/);
  assert.throws(() => stateAttributes('x"'), /state/);
});

test("native states avoid duplicate attributes and remove placeholder content", () => {
  const source = '<input type="checkbox" checked><input required value="sample"><textarea>sample</textarea><button disabled>Run</button><div tabindex="0">Focus</div>';
  const nodes = elements(renderSpecimenMarkup(source, "native", { state: "checked+disabled+required+placeholder-shown", inert: true }));
  for (const node of nodes) assert.equal(new Set(node.attrs.map((a) => a.name)).size, node.attrs.length);
  assert.equal(attribute(nodes[0], "checked"), "");
  assert.equal(attribute(nodes[1], "value"), undefined);
  assert.equal(nodes[2].childNodes.length, 0);
  assert.equal(attribute(nodes[4], "tabindex"), "-1");
});

test("both settings specimens retain a named region after namespace rewriting", async () => {
  const component = await loadComponent("spec/components/settings-panel.md");
  for (const [variant, source] of splitVariants(component.demo)) {
    const nodes = elements(renderSpecimenMarkup(source, `settings-${variant}`));
    const root = nodes[0];
    assert.equal(attribute(root, "role"), "region", variant);
    const labelledBy = attribute(root, "aria-labelledby");
    assert.ok(labelledBy, variant);
    const heading = nodes.find((node) => attribute(node, "id") === labelledBy);
    assert.equal(heading?.tagName, "h2", variant);
  }
});
