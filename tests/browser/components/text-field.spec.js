import { test, expect } from "../evidence-fixture.mjs";
import { promises as fs } from "node:fs";
import { openSpec, only, rgbToHex } from "../helpers.mjs";

const resolved = JSON.parse(await fs.readFile(new URL("../../../exports/tokens.resolved.json", import.meta.url), "utf8"));
const spec = JSON.parse(await fs.readFile(new URL("../../../exports/components/text-field.json", import.meta.url), "utf8"));
const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;

test.describe("text-field", () => {
  test("the state matrix renders every declared state for every variant", { annotation: { type: "verification", description: JSON.stringify({"component": "text-field", "category": "rendering", "states": ["default", "hover", "focus-visible", "placeholder-shown", "filled", "required", "invalid", "invalid+focus-visible", "invalid+hover", "disabled", "disabled+filled", "read-only", "read-only+focus-visible", "loading"], "variants": ["default", "password", "search", "number", "affix"], "note": "Presence and selected structural assertions only; not behavioral verification of every state."}) } }, async ({ page }) => {
    await openSpec(page, "#c-text-field");
    for (const state of spec.states) {
      const cells = page.locator(`#text-field-states [data-state="${state}"]`);
      await expect(cells).toHaveCount(spec.variants.length);
    }
    await expect(page.locator('#text-field-states [data-state="invalid"] .text-field-message').first()).toBeVisible();
    await expect(page.locator('#text-field-states [data-state="placeholder-shown"] input').first()).toHaveValue("");
    await expect(page.locator('#text-field-states [data-state="disabled"] input').first()).toBeDisabled();
    await expect(page.locator('#text-field-states [data-state="read-only"] input').first()).toHaveAttribute("readonly", "");
  });

  test("the live control honours the focus, invalid, disabled and read-only rules", { annotation: { type: "verification", description: JSON.stringify({"component": "text-field", "category": "appearance", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "computed styles are the same without scripts; keep one run");
    await openSpec(page, "#c-text-field");
    const live = page.locator('#text-field-states [data-state="default"]').first();
    const input = live.locator("input");
    const root = live.locator(".text-field-root");
    await input.focus();
    const focused = await root.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineColor: s.outlineColor, outlineWidth: s.outlineWidth, borderColor: s.borderTopColor, radius: s.borderRadius };
    });
    expect(focused.outlineStyle).toBe("dashed");
    expect(focused.outlineWidth).toBe("1px");
    expect(rgbToHex(focused.outlineColor)).toBe(token("color.interaction.focus.ring"));
    expect(rgbToHex(focused.borderColor)).toBe(token("color.border.active"));
    expect(focused.radius).toBe("0px");

    await input.evaluate((el) => el.setAttribute("aria-invalid", "true"));
    const invalid = await root.evaluate((el) => {
      const s = getComputedStyle(el);
      return { borderColor: s.borderTopColor, borderWidth: s.borderTopWidth, outlineColor: s.outlineColor };
    });
    expect(rgbToHex(invalid.borderColor)).toBe(token("color.status.danger.border"));
    expect(invalid.borderWidth).toBe("2px");
    expect(rgbToHex(invalid.outlineColor)).toBe(token("color.interaction.focus.ring-container"));
    await expect(live.locator(".text-field-message")).toBeVisible();

    await input.evaluate((el) => {
      el.removeAttribute("aria-invalid");
      el.blur();
      el.disabled = true;
    });
    const disabled = await input.evaluate((el) => ({ color: getComputedStyle(el).color, bg: getComputedStyle(el.parentElement).backgroundColor, opacity: getComputedStyle(el).opacity }));
    expect(rgbToHex(disabled.color)).toBe(token("color.text.disabled"));
    expect(rgbToHex(disabled.bg)).toBe(token("color.interaction.disabled.bg"));
    expect(disabled.opacity).toBe("1");

    await input.evaluate((el) => {
      el.disabled = false;
      el.readOnly = true;
    });
    const readOnly = await root.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, bottom: getComputedStyle(el).borderBottomStyle }));
    expect(rgbToHex(readOnly.bg)).toBe(token("color.surface.canvas"));
    expect(readOnly.bottom).toBe("dotted");
  });

  test("keyboard: Tab reaches the input, then the trailing action", { annotation: { type: "verification", description: JSON.stringify({"component": "text-field", "category": "keyboard", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs", "narrow", "zoom200"), "one keyboard walk");
    await openSpec(page, "#c-text-field");
    const cell = page.locator('#text-field-states [data-state="default"][data-state-default]').nth(1);
    const input = cell.locator("input");
    await input.focus();
    await page.keyboard.press("Tab");
    await expect(cell.locator("button.text-field-action")).toBeFocused();
    const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    expect(ring).toBe("dashed");
  });
});
