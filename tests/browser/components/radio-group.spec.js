import { test, expect } from "../evidence-fixture.mjs";
import { promises as fs } from "node:fs";
import { openSpec, only, rgbToHex } from "../helpers.mjs";

const resolved = JSON.parse(await fs.readFile(new URL("../../../exports/tokens.resolved.json", import.meta.url), "utf8"));
const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;

const STATES = ["default", "hover", "focus-visible", "checked", "checked+focus-visible", "disabled", "invalid", "required"];
const VARIANTS = ["default", "horizontal"];

const box = (locator) =>
  locator.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      appearance: s.appearance,
      bg: s.backgroundColor,
      border: s.borderTopColor,
      radius: s.borderRadius,
      width: s.width,
      height: s.height,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor,
      opacity: s.opacity,
    };
  });

test.describe("radio-group", () => {
  test("the state matrix renders every declared state for both variants", { annotation: { type: "verification", description: JSON.stringify({"component": "radio-group", "category": "rendering", "states": ["default", "hover", "focus-visible", "checked", "checked+focus-visible", "disabled", "invalid", "required"], "variants": ["default", "horizontal"], "note": "Presence and selected structural assertions only; not behavioral verification of every state."}) } }, async ({ page }) => {
    await openSpec(page, "#c-radio-group");
    for (const state of STATES) {
      await expect(page.locator(`#radio-group-states [data-state="${state}"]`)).toHaveCount(VARIANTS.length);
    }
    /* every cell's radios share a name, so the document keeps one native :checked per group; the forced state paints the rest */
    await expect(page.locator('#radio-group-states [data-state="checked"] .radio-group-dot').first()).toBeVisible();
    await expect(page.locator('#radio-group-states [data-state="checked"] .radio-group-dot').last()).toBeVisible();
    await expect(page.locator('#radio-group-states [data-state="disabled"] input').first()).toBeDisabled();
    await expect(page.locator('#radio-group-states [data-state="invalid"] .radio-group-message').first()).toBeVisible();
  });

  test("the live radios: square boxes, checked fill with the inner square, rings", { annotation: { type: "verification", description: JSON.stringify({"component": "radio-group", "category": "appearance", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "computed styles are the same without scripts; keep one run");
    await openSpec(page, "#c-radio-group");
    const live = page.locator('#radio-group-states [data-state="default"]').first();
    const first = live.locator("input.radio-group-input").first();
    const dot = live.locator(".radio-group-dot").first();

    const rest = await box(first);
    expect(rest.appearance).toBe("none");
    expect(rest.radius).toBe("0px");
    expect(rest.width).toBe(rest.height);
    expect(rgbToHex(rest.bg)).toBe(token("color.surface.input"));
    expect(rgbToHex(rest.border)).toBe(token("color.border.control"));
    await expect(dot).toBeHidden();

    await first.focus();
    const focused = await box(first);
    expect(focused.outlineStyle).toBe("dashed");
    expect(focused.outlineWidth).toBe("1px");
    expect(rgbToHex(focused.outlineColor)).toBe(token("color.interaction.focus.ring"));

    await first.evaluate((el) => {
      el.checked = true;
    });
    await page.mouse.move(0, 0); /* check() would leave the pointer hovering the box */
    const checked = await box(first);
    expect(rgbToHex(checked.bg)).toBe(token("color.action.primary.bg"));
    expect(rgbToHex(checked.outlineColor)).toBe(token("color.interaction.focus.ring-container"));
    await expect(dot).toBeVisible();
    expect(rgbToHex(await dot.evaluate((el) => getComputedStyle(el).backgroundColor))).toBe(token("color.action.primary.text"));
    expect(await dot.evaluate((el) => getComputedStyle(el).borderRadius)).toBe("0px");

    await first.evaluate((el) => {
      el.blur();
      el.disabled = true;
    });
    const disabled = await box(first);
    expect(rgbToHex(disabled.bg)).toBe(token("color.interaction.disabled.bg"));
    expect(rgbToHex(disabled.border)).toBe(token("color.border.disabled"));
    expect(disabled.opacity).toBe("1");
    await first.evaluate((el) => {
      el.disabled = false;
      el.checked = false;
    });
  });

  test("keyboard: the arrow keys move the check through the live group", { annotation: { type: "verification", description: JSON.stringify({"component": "radio-group", "category": "keyboard", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs", "narrow", "zoom200"), "one keyboard walk");
    await openSpec(page, "#c-radio-group");
    const inputs = page.locator('#radio-group-states [data-state="default"][data-state-default]').first().locator("input.radio-group-input");
    await inputs.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(inputs.nth(1)).toBeFocused();
    await expect(inputs.nth(1)).toBeChecked();
    const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    expect(ring).toBe("dashed");
  });
});
