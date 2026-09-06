import { test, expect } from "@playwright/test";
import { promises as fs } from "node:fs";
import { openSpec, only, rgbToHex } from "../helpers.mjs";

const resolved = JSON.parse(await fs.readFile(new URL("../../../exports/tokens.resolved.json", import.meta.url), "utf8"));
const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;

const STATES = ["default", "hover", "selected", "selected+focus-visible", "selected+container-inactive", "sorted", "empty", "loading"];
const VARIANTS = 4;

test.describe("table", () => {
  test("the state matrix renders every declared state for every variant", async ({ page }) => {
    await openSpec(page, "#c-table");
    for (const state of STATES) {
      const cells = page.locator(`#table-states [data-state="${state}"]`);
      await expect(cells).toHaveCount(VARIANTS);
    }
    await expect(page.locator('#table-states [data-state="empty"] .table-empty').first()).toBeVisible();
    await expect(page.locator('#table-states [data-state="empty"] .table-row-demo-target').first()).toBeHidden();
    await expect(page.locator('#table-states [data-state="loading"] .table-loading').first()).toBeVisible();
    await expect(page.locator('#table-states [data-state="loading"] .table').first()).toHaveAttribute("aria-busy", "true");
    await expect(page.locator('#table-states [data-state="sorted"] .table-header-demo-target .table-sort-glyph').first()).toBeVisible();
  });

  test("header rule, selected fill, hover fill and square corners", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "computed styles are the same without scripts; keep one run");
    await openSpec(page, "#c-table");
    const cells = page.locator('#table-states [data-state="default"]');
    const plain = cells.nth(0);
    const sticky = cells.nth(1);

    const rule = await plain.locator(".table-header").first().evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.borderBottomWidth, color: s.borderBottomColor, style: s.borderBottomStyle };
    });
    expect(rule.width).toBe("1px");
    expect(rule.style).toBe("solid");
    expect(rgbToHex(rule.color)).toBe(token("color.border.strong"));

    const stickyRule = await sticky.locator(".table-header").first().evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.borderBottomWidth, color: s.borderBottomColor, position: s.position, bg: s.backgroundColor };
    });
    expect(stickyRule.width).toBe("2px");
    expect(rgbToHex(stickyRule.color)).toBe(token("color.border.strong"));
    expect(stickyRule.position).toBe("sticky");
    expect(rgbToHex(stickyRule.bg)).toBe(token("color.surface.raised"));

    const table = plain.locator(".table");
    const frame = await table.evaluate((el) => {
      const s = getComputedStyle(el);
      return { radius: s.borderRadius, collapse: s.borderCollapse, bg: s.backgroundColor };
    });
    expect(frame.radius).toBe("0px");
    expect(frame.collapse).toBe("collapse");
    expect(rgbToHex(frame.bg)).toBe(token("color.surface.default"));

    const row = plain.locator(".table-row-demo-target");
    await row.hover();
    const hovered = await row.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(rgbToHex(hovered)).toBe(token("color.interaction.hover.bg"));

    await row.evaluate((el) => el.setAttribute("aria-selected", "true"));
    const selected = await row.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color, radius: s.borderRadius };
    });
    expect(rgbToHex(selected.bg)).toBe(token("color.interaction.selection.bg"));
    expect(rgbToHex(selected.color)).toBe(token("color.interaction.selection.text"));
    expect(selected.radius).toBe("0px");
  });

  test("keyboard: the sort buttons are the only tab stops and take the dashed ring", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs", "narrow", "zoom200"), "one keyboard walk");
    await openSpec(page, "#c-table");
    const live = page.locator('#table-states [data-state="default"]').first();
    const first = live.locator(".table-sort").first();
    await first.focus();
    await page.keyboard.press("Tab");
    await expect(live.locator(".table-sort").nth(1)).toBeFocused();
    const ring = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement);
      return { style: s.outlineStyle, color: s.outlineColor };
    });
    expect(ring.style).toBe("dashed");
    expect(rgbToHex(ring.color)).toBe(token("color.interaction.focus.ring"));
    await expect(live.locator("th").first()).toHaveAttribute("scope", "col");
  });
});
