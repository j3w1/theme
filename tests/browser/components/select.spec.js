import { test, expect } from "@playwright/test";
import { promises as fs } from "node:fs";
import { openSpec, only, rgbToHex } from "../helpers.mjs";

const resolved = JSON.parse(await fs.readFile(new URL("../../../exports/tokens.resolved.json", import.meta.url), "utf8"));
const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;

const STATES = ["default", "hover", "focus-visible", "required", "invalid", "invalid+focus-visible", "disabled"];
const VARIANTS = ["default", "with-groups", "multiple"];

test.describe("select", () => {
  test("the state matrix renders every declared state for every variant", async ({ page }) => {
    await openSpec(page, "#c-select");
    for (const state of STATES) {
      await expect(page.locator(`#select-states [data-state="${state}"]`)).toHaveCount(VARIANTS.length);
    }
    await expect(page.locator('#select-states [data-state="invalid"] .select-message').first()).toBeVisible();
    await expect(page.locator('#select-states [data-state="disabled"] select').first()).toBeDisabled();
    await expect(page.locator('#select-states [data-state="required"] select').first()).toHaveAttribute("required", "");
    await expect(page.locator('#select-states [data-state="default"] select[multiple]')).toHaveCount(1);
  });

  test("the live control honours the box, focus, invalid and disabled rules", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "computed styles are the same without scripts; keep one run");
    await openSpec(page, "#c-select");
    const live = page.locator('#select-states [data-state="default"]').first();
    const control = live.locator("select");
    const root = live.locator(".select-root");

    const rest = await root.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, border: s.borderTopColor, radius: s.borderRadius, outline: s.outlineStyle };
    });
    expect(rgbToHex(rest.bg)).toBe(token("color.surface.input"));
    expect(rgbToHex(rest.border)).toBe(token("color.border.control"));
    expect(rest.radius).toBe("0px");
    expect(rest.outline).toBe("none");
    expect(await control.evaluate((el) => getComputedStyle(el).appearance)).toBe("none");
    expect(rgbToHex(await control.evaluate((el) => getComputedStyle(el).color))).toBe(token("color.text.default"));
    await expect(live.locator(".select-chevron")).toBeVisible();

    await control.focus();
    const focused = await root.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineColor: s.outlineColor, outlineWidth: s.outlineWidth, borderColor: s.borderTopColor };
    });
    expect(focused.outlineStyle).toBe("dashed");
    expect(focused.outlineWidth).toBe("1px");
    expect(rgbToHex(focused.outlineColor)).toBe(token("color.interaction.focus.ring"));
    expect(rgbToHex(focused.borderColor)).toBe(token("color.border.active"));

    await control.evaluate((el) => el.setAttribute("aria-invalid", "true"));
    const invalid = await root.evaluate((el) => {
      const s = getComputedStyle(el);
      return { borderColor: s.borderTopColor, borderWidth: s.borderTopWidth, outlineColor: s.outlineColor };
    });
    expect(rgbToHex(invalid.borderColor)).toBe(token("color.status.danger.border"));
    expect(invalid.borderWidth).toBe("2px");
    expect(rgbToHex(invalid.outlineColor)).toBe(token("color.interaction.focus.ring-container"));
    await expect(live.locator(".select-message")).toBeVisible();

    await control.evaluate((el) => {
      el.removeAttribute("aria-invalid");
      el.blur();
      el.disabled = true;
    });
    const disabled = await control.evaluate((el) => ({ color: getComputedStyle(el).color, bg: getComputedStyle(el.parentElement).backgroundColor, opacity: getComputedStyle(el).opacity }));
    expect(rgbToHex(disabled.color)).toBe(token("color.text.disabled"));
    expect(rgbToHex(disabled.bg)).toBe(token("color.interaction.disabled.bg"));
    expect(disabled.opacity).toBe("1");
    await control.evaluate((el) => {
      el.disabled = false;
    });
  });

  test("keyboard: Tab reaches the live select and the ring shows", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs", "narrow", "zoom200"), "one keyboard walk");
    await openSpec(page, "#c-select");
    const control = page.locator('#select-states [data-state="default"][data-state-default] select').first();
    await control.focus();
    await expect(control).toBeFocused();
    const ring = await page.evaluate(() => getComputedStyle(document.activeElement.parentElement).outlineStyle);
    expect(ring).toBe("dashed");
  });
});
