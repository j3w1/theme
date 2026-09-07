import { test, expect } from "../evidence-fixture.mjs";
import { promises as fs } from "node:fs";
import { openSpec, only, rgbToHex } from "../helpers.mjs";

const resolved = JSON.parse(await fs.readFile(new URL("../../../exports/tokens.resolved.json", import.meta.url), "utf8"));
const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;

/* "rgb(0 0 0 / 65%)" and "rgba(0, 0, 0, 0.65)" both become [0, 0, 0, 0.65]. */
const channels = (css) => {
  const m = css.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)/);
  if (!m) return null;
  const alpha = m[4] === undefined ? 1 : m[4].endsWith("%") ? Number(m[4].slice(0, -1)) / 100 : Number(m[4]);
  return [Number(m[1]), Number(m[2]), Number(m[3]), Math.round(alpha * 100) / 100];
};

test.describe("dialog", () => {
  test("the state matrix renders every declared state for every variant, closed cells hide the dialog", { annotation: { type: "verification", description: JSON.stringify({"component": "dialog", "category": "rendering", "states": ["default", "open", "closed", "focus-trapped", "hover", "focus-visible", "reduced-motion"], "variants": ["default", "alert-dialog", "form"], "note": "Presence and selected structural assertions only; not behavioral verification of every state."}) } }, async ({ page }) => {
    await openSpec(page, "#c-dialog");
    const matrix = page.locator("#dialog-states");
    const variants = (await matrix.locator("thead th").count()) - 1;
    expect(variants).toBeGreaterThanOrEqual(3);
    const states = await matrix.locator("tbody th[scope='row'] code").allTextContents();
    expect(states).toContain("default");
    expect(states).toContain("closed");
    expect(states).toContain("focus-trapped");
    for (const state of states) {
      await expect(matrix.locator(`[data-state="${state}"]`)).toHaveCount(variants);
    }
    await expect(matrix.locator('[data-state="open"] dialog').first()).toBeVisible();
    await expect(matrix.locator('[data-state="closed"] dialog').first()).toBeHidden();
    await expect(matrix.locator('[data-state="focus-trapped"] .dialog-trap-note').first()).toBeVisible();
    await expect(matrix.locator('[data-state="default"] dialog[role="alertdialog"] .dialog-button-destructive')).toHaveCount(1);
  });

  test("the live dialog draws the overlay border on the overlay surface, the backdrop, no radius, and the ring on its first button", { annotation: { type: "verification", description: JSON.stringify({"component": "dialog", "category": "appearance", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "computed styles are the same without scripts; keep one run");
    await openSpec(page, "#c-dialog");
    const live = page.locator('#dialog-states [data-state="default"]').first();
    const backdrop = live.locator(".dialog-backdrop");
    const dialog = live.locator("dialog.dialog");
    await expect(dialog).toBeVisible();

    const box = await dialog.evaluate((el) => {
      const s = getComputedStyle(el);
      return { borderColor: s.borderTopColor, borderWidth: s.borderTopWidth, borderStyle: s.borderTopStyle, bg: s.backgroundColor, radius: s.borderRadius, opacity: s.opacity };
    });
    expect(rgbToHex(box.borderColor)).toBe(token("color.border.overlay"));
    expect(box.borderWidth).toBe("1px");
    expect(box.borderStyle).toBe("solid");
    expect(rgbToHex(box.bg)).toBe(token("color.surface.overlay"));
    expect(box.radius).toBe("0px");
    expect(box.opacity).toBe("1");

    const backdropColor = await backdrop.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(channels(backdropColor)).toEqual(channels(token("color.surface.backdrop")));

    const first = dialog.locator("button").first();
    await first.focus();
    await expect(first).toBeFocused();
    const ring = await first.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor, radius: s.borderRadius };
    });
    expect(ring.style).toBe("dashed");
    expect(ring.width).toBe("1px");
    expect(rgbToHex(ring.color)).toBe(token("color.interaction.focus.ring"));
    expect(ring.radius).toBe("0px");
  });

  test("keyboard: Tab walks Close, then the actions, and the ring recolours on the primary fill", { annotation: { type: "verification", description: JSON.stringify({"component": "dialog", "category": "keyboard", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs", "narrow", "zoom200"), "one keyboard walk");
    await openSpec(page, "#c-dialog");
    const live = page.locator('#dialog-states [data-state="default"]').first();
    const close = live.locator(".dialog-close");
    await close.focus();
    await page.keyboard.press("Tab");
    await expect(live.locator(".dialog-button").first()).toBeFocused();
    await page.keyboard.press("Tab");
    const primary = live.locator(".dialog-button-primary");
    await expect(primary).toBeFocused();
    const ring = await primary.evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, color: getComputedStyle(el).outlineColor }));
    expect(ring.style).toBe("dashed");
    expect(rgbToHex(ring.color)).toBe(token("color.interaction.focus.ring-container"));
  });
});
