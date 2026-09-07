import { test, expect } from "../evidence-fixture.mjs";
import { promises as fs } from "node:fs";
import { openSpec, only, rgbToHex } from "../helpers.mjs";

const resolved = JSON.parse(await fs.readFile(new URL("../../../exports/tokens.resolved.json", import.meta.url), "utf8"));
const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;

const STATES = ["default", "hover", "focus-visible", "open", "closed", "disabled", "checked", "selected"];
const VARIANTS = 3;

test.describe("menu", () => {
  test("the state matrix renders every declared state for every variant", { annotation: { type: "verification", description: JSON.stringify({"component": "menu", "category": "rendering", "states": ["default", "hover", "focus-visible", "open", "closed", "disabled", "checked", "selected"], "variants": ["default", "with-submenu", "with-checks"], "note": "Presence and selected structural assertions only; not behavioral verification of every state."}) } }, async ({ page }) => {
    await openSpec(page, "#c-menu");
    for (const state of STATES) {
      const cells = page.locator(`#menu-states [data-state="${state}"]`);
      await expect(cells).toHaveCount(VARIANTS);
    }
    await expect(page.locator('#menu-states [data-state="closed"] [role="menu"]').first()).toBeHidden();
    await expect(page.locator('#menu-states [data-state="open"] [role="menu"]').first()).toBeVisible();
    await expect(page.locator('#menu-states [data-state="disabled"] [role="menuitem"]').first()).toBeDisabled();
    const check = await page.locator('#menu-states [data-state="checked"] .menu-item-demo-target .menu-check').first().evaluate((el) => getComputedStyle(el).visibility);
    expect(check).toBe("visible");
  });

  test("the menu surface, the active item fill and the ring on the button", { annotation: { type: "verification", description: JSON.stringify({"component": "menu", "category": "appearance", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "computed styles are the same without scripts; keep one run");
    await openSpec(page, "#c-menu");
    const live = page.locator('#menu-states [data-state="default"]').first();
    const list = live.locator('[role="menu"]');
    const button = live.locator(".menu-button");
    const item = live.locator(".menu-item-demo-target");

    const surface = await list.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, border: s.borderTopColor, width: s.borderTopWidth, style: s.borderTopStyle, radius: s.borderRadius, shadow: s.boxShadow };
    });
    expect(rgbToHex(surface.bg)).toBe(token("color.surface.raised"));
    expect(rgbToHex(surface.border)).toBe(token("color.border.overlay"));
    expect(surface.width).toBe("1px");
    expect(surface.style).toBe("solid");
    expect(surface.radius).toBe("0px");
    expect(surface.shadow).toBe("none");

    await item.focus();
    await expect(item).toBeFocused();
    const active = await item.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color };
    });
    expect(rgbToHex(active.bg)).toBe(token("color.interaction.selection.bg"));
    expect(rgbToHex(active.color)).toBe(token("color.interaction.selection.text"));

    await button.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    const ring = await button.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor, border: s.borderTopColor, bg: s.backgroundColor };
    });
    expect(ring.style).toBe("dashed");
    expect(ring.width).toBe("1px");
    expect(rgbToHex(ring.color)).toBe(token("color.interaction.focus.ring"));
    expect(rgbToHex(ring.border)).toBe(token("color.border.active"));
    expect(rgbToHex(ring.bg)).toBe(token("color.interaction.pressed.bg"));
  });

  test("structure: the button owns the menu and one item is in the tab order", { annotation: { type: "verification", description: JSON.stringify({"component": "menu", "category": "structure", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "narrow", "zoom200"), "one structural check");
    await openSpec(page, "#c-menu");
    const live = page.locator('#menu-states [data-state="default"]').first();
    await expect(live.locator(".menu-button")).toHaveAttribute("aria-haspopup", "menu");
    await expect(live.locator(".menu-button")).toHaveAttribute("aria-expanded", "true");
    const controls = await live.locator(".menu-button").getAttribute("aria-controls");
    await expect(live.locator(`[role="menu"]#${controls}`)).toHaveCount(1);
    await expect(live.locator('[role="menuitem"][tabindex="0"]')).toHaveCount(1);
    await expect(live.locator('[role="separator"]')).toHaveCount(1);
  });
});
