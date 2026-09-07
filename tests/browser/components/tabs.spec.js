import { test, expect } from "../evidence-fixture.mjs";
import { promises as fs } from "node:fs";
import { openSpec, only, rgbToHex } from "../helpers.mjs";

const resolved = JSON.parse(await fs.readFile(new URL("../../../exports/tokens.resolved.json", import.meta.url), "utf8"));
const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;

const STATES = ["default", "hover", "focus-visible", "selected", "selected+focus-visible", "selected+container-inactive", "disabled"];
const VARIANTS = 2;

test.describe("tabs", () => {
  test("the state matrix renders every declared state for every variant", { annotation: { type: "verification", description: JSON.stringify({"component": "tabs", "category": "rendering", "states": ["default", "hover", "focus-visible", "selected", "selected+focus-visible", "selected+container-inactive", "disabled"], "variants": ["default", "overflow"], "note": "Presence and selected structural assertions only; not behavioral verification of every state."}) } }, async ({ page }) => {
    await openSpec(page, "#c-tabs");
    for (const state of STATES) {
      const cells = page.locator(`#tabs-states [data-state="${state}"]`);
      await expect(cells).toHaveCount(VARIANTS);
    }
    await expect(page.locator('#tabs-states [data-state="disabled"] [role="tab"]').first()).toBeDisabled();
    const inactiveBar = await page.locator('#tabs-states [data-state="selected+container-inactive"] [role="tab"][aria-selected="true"]').first().evaluate((el) => getComputedStyle(el).borderBottomColor);
    expect(rgbToHex(inactiveBar)).toBe(token("color.border.selected-indicator-inactive"));
  });

  test("the selected tab is a 2px indicator bar with bright text, and the ring sits on it", { annotation: { type: "verification", description: JSON.stringify({"component": "tabs", "category": "appearance", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "computed styles are the same without scripts; keep one run");
    await openSpec(page, "#c-tabs");
    const live = page.locator('#tabs-states [data-state="default"]').first();
    const selected = live.locator('[role="tab"][aria-selected="true"]');
    const rest = live.locator('[role="tab"][aria-selected="false"]').first();

    const bar = await selected.evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.borderBottomWidth, color: s.borderBottomColor, text: s.color, bg: s.backgroundColor, radius: s.borderRadius };
    });
    expect(bar.width).toBe("2px");
    expect(rgbToHex(bar.color)).toBe(token("color.border.selected-indicator"));
    expect(rgbToHex(bar.text)).toBe(token("color.text.bright"));
    expect(bar.bg).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(bar.radius).toBe("0px");

    const restBar = await rest.evaluate((el) => getComputedStyle(el).borderBottomColor);
    expect(restBar).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);

    await selected.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(selected).toBeFocused();
    const ring = await selected.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor, bar: s.borderBottomColor };
    });
    expect(ring.style).toBe("dashed");
    expect(ring.width).toBe("1px");
    expect(rgbToHex(ring.color)).toBe(token("color.interaction.focus.ring"));
    expect(rgbToHex(ring.bar)).toBe(token("color.border.selected-indicator"));
  });

  test("roving tabindex: exactly one tab is in the tab order and it is the selected one", { annotation: { type: "verification", description: JSON.stringify({"component": "tabs", "category": "structure", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "narrow", "zoom200"), "one walk is enough");
    await openSpec(page, "#c-tabs");
    const live = page.locator('#tabs-states [data-state="default"]').first();
    await expect(live.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
    await expect(live.locator('[role="tab"][tabindex="0"]')).toHaveAttribute("aria-selected", "true");
    const others = await live.locator('[role="tab"][tabindex="-1"]').count();
    expect(others).toBe((await live.locator('[role="tab"]').count()) - 1);
    await expect(live.locator('[role="tablist"]')).toHaveAttribute("aria-label", /.+/);
  });
});
