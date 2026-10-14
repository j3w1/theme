import { test, expect } from "../evidence-fixture.mjs";
import { verification } from "../verification.mjs";
import { openSpec, rgbToHex } from "../helpers.mjs";
import { token } from "../tokens.mjs";
import { readJson } from "../../../scripts/lib/fs.mjs";

const metadataComponents = ["avatar", "button-group", "chart", "command-palette", "compact-dashboard", "description-list", "disclosure", "editor-search", "error-state", "file-browser", "kbd", "popover", "range", "repeater", "segmented-control", "skeleton", "timeline", "tree", "button", "wizard", "search-field", "file-input", "progress", "code-editor"];
for (const id of metadataComponents) {
  const component = await readJson(`exports/components/${id}.json`);
  test(`${id}: its declared state matrix remains available`, verification({
    component: id, category: "rendering", states: component.states, variants: component.variants.map(variant => variant.id),
    note: "Static matrix presence after dependency or contrast metadata correction; no interaction or comprehensive appearance claim.",
  }), async ({ page }) => {
    await openSpec(page, `components/${id}/`);
    for (const state of component.states) {
      await expect(page.locator(`#${id}-states [data-state='${state}']`)).toHaveCount(component.variants.length);
    }
  });
}

const selections = [
  ["combobox", "selected", ".combobox-option[aria-selected='true']", ["default", "with-groups"]],
  ["menu", "selected", ".menu-item-demo-target", ["default", "with-submenu", "with-checks"]],
  ["chip", "selected+focus-visible", ".chip-filter, .chip-remove", ["filter", "removable"]],
  ["pagination", "current", ".pagination-current", ["default"]],
  ["data-table", "selected+focus-visible", ".data-table-row-demo-target", ["default", "selectable", "resizable"]],
  ["table", "selected+focus-visible", ".table-row-demo-target", ["default", "sticky-header", "numeric", "with-caption"]],
  ["list", "selected+focus-visible", ".list-option-demo-target", ["single", "multi", "with-meta"]],
  ["diff-view", "selected", ".diff-view-row-active", ["unified", "split", "word-level", "conflict"]],
  ["diagnostics", "selected+focus-visible", ".diagnostics-row-active", ["panel"]],
  ["sidebar-nav", "selected", ".sidebar-nav-link-demo-target", ["default", "collapsed", "nested"]],
  ["icon-button", "toggled+focus-visible", ".icon-button", ["default", "toggle"]],
  ["i3-window-frame", "selected", ".i3-window-frame-workspace-demo-target", ["default", "tabbed", "floating"]],
  ["card", "selected+focus-visible", ".card-selectable.card-demo-target", ["selectable"]],
];

for (const [component, state, selector, variants] of selections) {
  test(`${component}: selection keeps the ordinary ring (D-027)`, verification({
    component, category: "appearance", states: [state], variants,
    note: "Computed selection fill and 1px dashed ring at -2px for each matching matrix target. Diff rows are promoted to focusable rows as a grid host would; no host navigation claim.",
  }), async ({ page }) => {
    await openSpec(page, `components/${component}/`);
    const targets = page.locator(`#${component}-states [data-state='${state}']`).locator(selector);
    expect(await targets.count()).toBeGreaterThanOrEqual(variants.length);
    for (const target of await targets.all()) {
      // The forced selection hooks hold the fill; real keyboard focus draws the ring.
      // Some reference rows delegate DOM focus to their listbox or a grid host.
      await target.evaluate(el => {
        const cell = el.closest("[data-state]");
        cell.setAttribute("data-state-focus-visible", "");
        if (el.matches(".diff-view-row")) {
          el.tabIndex = 0;
          el.setAttribute("aria-current", "true");
        }
      });
      if (component !== "combobox") await target.focus();
      const style = await target.evaluate(el => {
        const s = getComputedStyle(el);
        return { bg: s.backgroundColor, color: s.outlineColor, width: s.outlineWidth, style: s.outlineStyle, offset: s.outlineOffset };
      });
      // Table cells paint the diff fill; a chip remove button sits over its parent fill.
      const fills = component === "diff-view"
        ? await target.locator(":scope > td").evaluateAll(cells => cells.map(el => getComputedStyle(el).backgroundColor))
        : [component === "chip" && await target.evaluate(el => el.matches(".chip-remove"))
          ? await target.locator("..").evaluate(el => getComputedStyle(el).backgroundColor) : style.bg];
      expect(fills.length).toBeGreaterThan(0);
      for (const fill of fills) expect(rgbToHex(fill)).toBe(token("color.interaction.selection.bg"));
      expect(rgbToHex(style.color)).toBe(token("color.interaction.focus.ring"));
      expect(style.width).toBe("1px");
      expect(style.style).toBe("dashed");
      expect(style.offset).toBe("-2px");
    }
    if (component === "card") {
      const normal = page.locator("#card-states [data-state='focus-visible'] .card-link");
      await expect(normal).toHaveCSS("outline-width", "2px");
      await expect(normal).toHaveCSS("outline-style", "solid");
      await expect(normal).toHaveCSS("outline-offset", "-3px");
      expect(rgbToHex(await normal.evaluate(el => getComputedStyle(el).outlineColor))).toBe(token("color.interaction.focus.ring-container"));
    }
  });
}

for (const [component, selector] of [["breadcrumbs", ".breadcrumbs-link-demo-target"], ["toast", ".toast:not(.toast-danger) .toast-action"]]) {
  test(`${component}: link hover uses the ordinary hover fill (D-027)`, verification({
    component, category: "appearance", states: ["hover"], variants: [component === "toast" ? "with-action" : "default", ...(component === "breadcrumbs" ? ["truncated"] : [])],
    note: "Computed forced hover fill, foreground and underline only; danger toast actions retain their on-fill mapping.",
  }), async ({ page }) => {
    await openSpec(page, `components/${component}/`);
    const targets = page.locator(`#${component}-states [data-state='hover']`).locator(selector);
    expect(await targets.count()).toBeGreaterThan(0);
    for (const target of await targets.all()) {
      await expect.poll(async () => rgbToHex(await target.evaluate(el => getComputedStyle(el).backgroundColor))).toBe(token("color.interaction.hover.bg"));
      expect(rgbToHex(await target.evaluate(el => getComputedStyle(el).color))).toBe(token("color.text.link-hover"));
      await expect(target).toHaveCSS("text-decoration-thickness", "2px");
    }
  });
}

test("time-picker: invalid focus retains both boundaries", verification({
  component: "time-picker", category: "appearance", states: ["invalid+focus-visible"], variants: ["default"],
  note: "Declared matrix cell with 2px danger border and recoloured 1px dashed ring at -4px, matching date-picker; no time editing behavior claim.",
}), async ({ page }) => {
  await openSpec(page, "components/time-picker/");
  const root = page.locator("#time-picker-states [data-state='invalid+focus-visible'] .time-picker-root");
  await expect(root).toHaveCount(1);
  const s = await root.evaluate(el => {
    const s = getComputedStyle(el);
    return { border: s.borderTopColor, width: s.borderTopWidth, outline: s.outlineColor, style: s.outlineStyle, offset: s.outlineOffset };
  });
  expect(rgbToHex(s.border)).toBe(token("color.status.danger.border"));
  expect(s.width).toBe("2px");
  expect(rgbToHex(s.outline)).toBe(token("color.interaction.focus.ring-container"));
  expect(s.style).toBe("dashed");
  expect(s.offset).toBe("-4px");
});

test("settings-panel: a native checkbox toggles on Space", verification({
  component: "settings-panel", category: "keyboard", states: ["default"], variants: ["default"],
  note: "One native checkbox: Enter preserves its checked state, Space toggles it; no manual keyboard acceptance or other control claim.",
}), async ({ page }) => {
  await openSpec(page, "components/settings-panel/");
  const checkbox = page.locator("#settings-panel-states [data-state='default'] .checkbox-input").first();
  await expect(checkbox).toBeChecked();
  await checkbox.focus();
  await page.keyboard.press("Enter");
  await expect(checkbox).toBeChecked();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
});
