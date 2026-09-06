import { test, expect } from "@playwright/test";
import { promises as fs } from "node:fs";
import { openSpec, only, rgbToHex } from "../helpers.mjs";

const resolved = JSON.parse(await fs.readFile(new URL("../../../exports/tokens.resolved.json", import.meta.url), "utf8"));
const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;

const STATES = ["default", "hover", "focus-visible", "active", "disabled", "loading"];
const VARIANTS = ["default", "secondary", "tertiary", "destructive"];

const paint = (locator) =>
  locator.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      bg: s.backgroundColor,
      color: s.color,
      border: s.borderTopColor,
      borderWidth: s.borderTopWidth,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor,
      radius: s.borderRadius,
      opacity: s.opacity,
    };
  });

test.describe("button", () => {
  test("the state matrix renders every declared state for every tone", async ({ page }) => {
    await openSpec(page, "#c-button");
    for (const state of STATES) {
      await expect(page.locator(`#button-states [data-state="${state}"]`)).toHaveCount(VARIANTS.length);
    }
    await expect(page.locator('#button-states [data-state="disabled"] button').first()).toBeDisabled();
    await expect(page.locator('#button-states [data-state="loading"] .button-loading').first()).toBeVisible();
    await expect(page.locator('#button-states [data-state="loading"] button').first()).toHaveAttribute("aria-busy", "true");
  });

  test("the primary tone: fill, hover fill, container ring, radius 0", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "computed styles are the same without scripts; keep one run");
    await openSpec(page, "#c-button");
    const live = page.locator('#button-states [data-state="default"]').first();
    const button = live.locator("button.button");

    const rest = await paint(button);
    expect(rgbToHex(rest.bg)).toBe(token("color.action.primary.bg"));
    expect(rgbToHex(rest.color)).toBe(token("color.action.primary.text"));
    expect(rest.borderWidth).toBe("1px");
    expect(rest.radius).toBe("0px");
    expect(rest.outlineStyle).toBe("none");

    const hovered = await page.locator('#button-states [data-state="hover"] button.button').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(rgbToHex(hovered)).toBe(token("color.action.primary.hover-bg"));

    await button.focus();
    const focused = await paint(button);
    expect(focused.outlineStyle).toBe("dashed");
    expect(focused.outlineWidth).toBe("1px");
    expect(rgbToHex(focused.outlineColor)).toBe(token("color.interaction.focus.ring-container"));
    expect(rgbToHex(focused.bg)).toBe(token("color.action.primary.bg"));
  });

  test("the destructive tone fills on hover with its on-fill text", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "one run");
    await openSpec(page, "#c-button");
    const rest = await paint(page.locator('#button-states [data-state="default"] button.button-destructive').first());
    expect(rgbToHex(rest.color)).toBe(token("color.action.destructive.text"));
    expect(rgbToHex(rest.border)).toBe(token("color.action.destructive.border"));

    const hovered = await paint(page.locator('#button-states [data-state="hover"] button.button-destructive').first());
    expect(rgbToHex(hovered.bg)).toBe(token("color.action.destructive.hover-bg"));
    expect(rgbToHex(hovered.color)).toBe(token("color.action.destructive.hover-text"));

    const outline = await paint(page.locator('#button-states [data-state="focus-visible"] button.button-secondary').first());
    expect(outline.outlineStyle).toBe("dashed");
    expect(rgbToHex(outline.outlineColor)).toBe(token("color.interaction.focus.ring"));
  });

  test("disabled uses the disabled roles at full opacity", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "one run");
    await openSpec(page, "#c-button");
    const button = page.locator('#button-states [data-state="default"] button.button').first();
    await button.evaluate((el) => {
      el.disabled = true;
    });
    const disabled = await paint(button);
    expect(rgbToHex(disabled.bg)).toBe(token("color.interaction.disabled.bg"));
    expect(rgbToHex(disabled.color)).toBe(token("color.text.disabled"));
    expect(rgbToHex(disabled.border)).toBe(token("color.border.disabled"));
    expect(disabled.opacity).toBe("1");
    expect(disabled.radius).toBe("0px");
    await button.evaluate((el) => {
      el.disabled = false;
    });
  });

  test("keyboard: Tab reaches the live button and shows the ring", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs", "narrow", "zoom200"), "one keyboard walk");
    await openSpec(page, "#c-button");
    const cell = page.locator('#button-states [data-state="default"][data-state-default]').nth(1);
    const button = cell.locator("button.button");
    await button.focus();
    await expect(button).toBeFocused();
    const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    expect(ring).toBe("dashed");
  });
});
