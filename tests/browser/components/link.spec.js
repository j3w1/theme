import { test, expect } from "@playwright/test";
import { promises as fs } from "node:fs";
import { openSpec, only, rgbToHex } from "../helpers.mjs";

const resolved = JSON.parse(await fs.readFile(new URL("../../../exports/tokens.resolved.json", import.meta.url), "utf8"));
const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;

const STATES = ["default", "hover", "focus-visible", "visited", "current"];
const VARIANTS = ["default", "standalone", "current"];

const paint = (locator) =>
  locator.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      color: s.color,
      bg: s.backgroundColor,
      decoration: s.textDecorationLine,
      underlineColor: s.textDecorationColor,
      thickness: s.textDecorationThickness,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor,
      bottomWidth: s.borderBottomWidth,
      bottomColor: s.borderBottomColor,
      radius: s.borderRadius,
    };
  });

test.describe("link", () => {
  test("the state matrix renders every declared state for every variant", async ({ page }) => {
    await openSpec(page, "#c-link");
    for (const state of STATES) {
      await expect(page.locator(`#link-states [data-state="${state}"]`)).toHaveCount(VARIANTS.length);
    }
    await expect(page.locator('#link-states [data-state="default"] a.link[aria-current="page"]')).toHaveCount(1);
  });

  test("the live inline link: text, underline, hover, ring", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "computed styles are the same without scripts; keep one run");
    await openSpec(page, "#c-link");
    const live = page.locator('#link-states [data-state="default"]').first();
    const link = live.locator("a.link");

    const rest = await paint(link);
    expect(rgbToHex(rest.color)).toBe(token("color.text.link"));
    expect(rest.decoration).toContain("underline");
    expect(rgbToHex(rest.underlineColor)).toBe(token("color.text.link-underline"));
    expect(rest.radius).toBe("0px");
    expect(rest.outlineStyle).toBe("none");

    const hovered = await paint(page.locator('#link-states [data-state="hover"] a.link').first());
    expect(rgbToHex(hovered.color)).toBe(token("color.text.link-hover"));
    expect(rgbToHex(hovered.bg)).toBe(token("color.interaction.hover.bg-strong"));
    expect(hovered.thickness).toBe("2px");

    await link.focus();
    const focused = await paint(link);
    expect(focused.outlineStyle).toBe("dashed");
    expect(focused.outlineWidth).toBe("1px");
    expect(rgbToHex(focused.outlineColor)).toBe(token("color.interaction.focus.ring"));
  });

  test("the current link swaps the underline for the 2px indicator bar", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "one run");
    await openSpec(page, "#c-link");
    const current = await paint(page.locator('#link-states [data-state="default"] a.link[aria-current="page"]'));
    expect(rgbToHex(current.color)).toBe(token("color.text.bright"));
    expect(current.decoration).toBe("none");
    expect(current.bottomWidth).toBe("2px");
    expect(rgbToHex(current.bottomColor)).toBe(token("color.border.selected-indicator"));
  });

  test("keyboard: Tab reaches the live link and shows the ring", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs", "narrow", "zoom200"), "one keyboard walk");
    await openSpec(page, "#c-link");
    const link = page.locator('#link-states [data-state="default"][data-state-default] a.link').first();
    await link.focus();
    await expect(link).toBeFocused();
    const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    expect(ring).toBe("dashed");
  });
});
