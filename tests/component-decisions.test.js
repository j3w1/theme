import assert from "node:assert/strict";
import test from "node:test";
import { loadComponents } from "../scripts/lib/spec.mjs";
import { loadDeclaredPairs, validateTokens } from "../scripts/lib/validators.mjs";
import { cssSourceClosure } from "../scripts/lib/ui-distribution.mjs";

const components = await loadComponents();
const byId = new Map(components.map(component => [component.id, component]));
const pairs = await loadDeclaredPairs({ ...await validateTokens(), components });
const selectionComponents = ["combobox", "menu", "chip", "pagination", "data-table", "table", "list", "diff-view", "diagnostics", "sidebar-nav", "icon-button", "i3-window-frame", "card"];

test("D-027 declares an ordinary, unwaived ring on every corrected selection fill", () => {
  for (const id of selectionComponents) {
    const selectionPairs = pairs.filter(pair => pair.source === id && pair.bgPath === "color.interaction.selection.bg" && pair.kind === "ui");
    assert.ok(selectionPairs.some(pair => pair.fgPath === "color.interaction.focus.ring"), `${id}: selected ring pair is declared`);
    for (const pair of selectionPairs) {
      assert.equal(pair.fgPath, "color.interaction.focus.ring", `${id}: selection keeps the ordinary ring`);
      assert.equal(pair.min, 3);
      assert.equal(pair.pass, true);
      assert.equal(pair.waiver, null);
    }
  }
  assert.equal(byId.get("card").tokens["root.ring"], "color.interaction.focus.ring-container", "the unselected card keeps its container ring");
  assert.equal(byId.get("button").tokens["root.ring"], "color.interaction.focus.ring-container", "primary fill keeps its recoloured ring");
  assert.equal(byId.get("toast").tokens["danger.text"], "color.status.danger.on-fill", "danger fill keeps its on-fill mapping");
});

test("code selection syntax limits are measured as waived decoration at the text floor", () => {
  for (const role of ["comment", "type"]) {
    const pair = pairs.find(pair => pair.source === "code-editor" && pair.fgPath === `color.code.syntax.${role}` && pair.bgPath === "color.code.selection-bg");
    assert.ok(pair, `${role}: missing recorded limitation`);
    assert.equal(pair.min, 4.5);
    assert.equal(pair.kind, "ui");
    assert.equal(pair.pass, false, "a waiver never turns the measured failure into a pass");
    assert.match(pair.waiver, /syntax colour is decoration/);
    assert.match(pair.waiver, /short-lived selection/);
    assert.match(pair.waiver, /recorded selection value/);
  }
});

test("focus-offset dependency entries follow the stylesheet and its imported dependencies", async () => {
  const ids = ["avatar", "button-group", "chart", "command-palette", "compact-dashboard", "description-list", "disclosure", "editor-search", "error-state", "file-browser", "kbd", "multiselect", "popover", "range", "repeater", "segmented-control", "skeleton", "timeline", "tree"];
  for (const id of ids) {
    const styles = [...await cssSourceClosure(".", [`site/src/styles/components/${id}.css`])].map(([, text]) => text).join("\n");
    const declared = Object.values(byId.get(id).tokens);
    assert.ok(styles.includes("var(--focus-offset)"), id);
    assert.ok(declared.includes("focus.offset"), `${id}: missing focus offset`);
    assert.equal(declared.includes("space.2"), styles.includes("var(--space-2)"), `${id}: retain space.2 only when a stylesheet dependency uses it`);
  }
});

test("waiver reasons carry no computed ratios that can become stale", () => {
  for (const id of ["button", "wizard", "search-field", "file-input", "toast", "progress"]) {
    for (const pair of byId.get(id).contrast) {
      assert.doesNotMatch(pair.waiver ?? "", /\d+\.\d+:1/, `${id}: computed measurements belong in the report`);
    }
  }
});

