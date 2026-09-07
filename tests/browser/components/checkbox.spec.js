import { test, expect } from "../evidence-fixture.mjs";
import { promises as fs } from "node:fs";
import { openSpec, only, rgbToHex } from "../helpers.mjs";

const resolved = JSON.parse(await fs.readFile(new URL("../../../exports/tokens.resolved.json", import.meta.url), "utf8"));
const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;

const STATES = ["default", "hover", "focus-visible", "checked", "mixed", "checked+focus-visible", "checked+disabled", "disabled", "invalid", "required"];
const VARIANTS = ["default", "group"];

const box = (locator) =>
  locator.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      appearance: s.appearance,
      bg: s.backgroundColor,
      border: s.borderTopColor,
      borderWidth: s.borderTopWidth,
      radius: s.borderRadius,
      width: s.width,
      height: s.height,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor,
      opacity: s.opacity,
    };
  });

test.describe("checkbox", () => {
  test("the state matrix renders every declared state for both variants", { annotation: { type: "verification", description: JSON.stringify({"component": "checkbox", "category": "rendering", "states": ["default", "hover", "focus-visible", "checked", "mixed", "checked+focus-visible", "checked+disabled", "disabled", "invalid", "required"], "variants": ["default", "group"], "note": "Presence and selected structural assertions only; not behavioral verification of every state."}) } }, async ({ page }) => {
    await openSpec(page, "#c-checkbox");
    for (const state of STATES) {
      await expect(page.locator(`#checkbox-states [data-state="${state}"]`)).toHaveCount(VARIANTS.length);
    }
    await expect(page.locator('#checkbox-states [data-state="checked"] input').first()).toBeChecked();
    await expect(page.locator('#checkbox-states [data-state="checked"] .checkbox-check').first()).toBeVisible();
    await expect(page.locator('#checkbox-states [data-state="mixed"] .checkbox-dash').first()).toBeVisible();
    await expect(page.locator('#checkbox-states [data-state="disabled"] input').first()).toBeDisabled();
    await expect(page.locator('#checkbox-states [data-state="invalid"] .checkbox-message').first()).toBeVisible();
    await expect(page.locator('#checkbox-states [data-state="default"] fieldset.checkbox-group')).toHaveCount(1);
  });

  test("the live box: square, checked fill and glyph, rings", { annotation: { type: "verification", description: JSON.stringify({"component": "checkbox", "category": "appearance", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "computed styles are the same without scripts; keep one run");
    await openSpec(page, "#c-checkbox");
    const live = page.locator('#checkbox-states [data-state="default"]').first();
    const input = live.locator("input.checkbox-input");

    const rest = await box(input);
    expect(rest.appearance).toBe("none");
    expect(rest.radius).toBe("0px");
    expect(rest.width).toBe(rest.height);
    expect(rgbToHex(rest.bg)).toBe(token("color.surface.input"));
    expect(rgbToHex(rest.border)).toBe(token("color.border.control"));
    expect(rest.borderWidth).toBe("1px");
    await expect(live.locator(".checkbox-check")).toBeHidden();

    await input.focus();
    const focused = await box(input);
    expect(focused.outlineStyle).toBe("dashed");
    expect(focused.outlineWidth).toBe("1px");
    expect(rgbToHex(focused.outlineColor)).toBe(token("color.interaction.focus.ring"));

    await input.evaluate((el) => {
      el.checked = true;
    });
    const checked = await box(input);
    expect(rgbToHex(checked.bg)).toBe(token("color.action.primary.bg"));
    expect(rgbToHex(checked.outlineColor)).toBe(token("color.interaction.focus.ring-container"));
    await expect(live.locator(".checkbox-check")).toBeVisible();
    expect(rgbToHex(await live.locator(".checkbox-check").evaluate((el) => getComputedStyle(el).color))).toBe(token("color.action.primary.text"));

    await input.evaluate((el) => {
      el.checked = false;
      el.indeterminate = true;
    });
    await expect(live.locator(".checkbox-dash")).toBeVisible();
    await expect(live.locator(".checkbox-check")).toBeHidden();

    await input.evaluate((el) => {
      el.indeterminate = false;
      el.blur();
      el.disabled = true;
    });
    const disabled = await box(input);
    expect(rgbToHex(disabled.bg)).toBe(token("color.interaction.disabled.bg"));
    expect(rgbToHex(disabled.border)).toBe(token("color.border.disabled"));
    expect(disabled.opacity).toBe("1");
    await input.evaluate((el) => {
      el.disabled = false;
    });
  });

  test("keyboard: Space toggles the live checkbox", { annotation: { type: "verification", description: JSON.stringify({"component": "checkbox", "category": "keyboard", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs", "narrow", "zoom200"), "one keyboard walk");
    await openSpec(page, "#c-checkbox");
    const input = page.locator('#checkbox-states [data-state="default"][data-state-default] input.checkbox-input').first();
    await input.focus();
    await expect(input).toBeFocused();
    await page.keyboard.press("Space");
    await expect(input).toBeChecked();
    await page.keyboard.press("Space");
    await expect(input).not.toBeChecked();
  });
});
