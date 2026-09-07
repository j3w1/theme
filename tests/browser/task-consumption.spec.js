import { test, expect } from "./evidence-fixture.mjs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";

const candidate = pathToFileURL(path.resolve("tests/consumption/task-fixtures/bbf0cc9-2026-09-07-2/result.html")).href;
const annotation = { type: "verification", description: JSON.stringify({ component: "page", category: "enhancements", states: [], variants: [], note: "Separate sealed task-kit reconstruction: native editing, modal lifecycle, focus return, narrow reflow and axe. Does not claim all component states or manual accessibility acceptance." }) };

test("sealed composed reconstruction retains native controls and modal lifecycle", { annotation }, async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  if (testInfo.project.name === "narrow") await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(candidate);
  const name = page.getByLabel("Display name", { exact: true });
  const notifications = page.getByRole("checkbox", { name: "Enable notifications" });
  const save = page.getByRole("button", { name: "Save", exact: true });
  const modal = page.getByRole("alertdialog");
  await expect(name).toBeEditable();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (testInfo.project.name === "nojs") {
    await expect(save).toBeHidden();
    await expect(page.locator("noscript p")).toBeVisible();
    await expect(page.locator("noscript p")).toContainText("JavaScript is required to open the confirmation.");
    return;
  }
  await name.fill("<b>Local draft</b> " + "Long".repeat(150));
  await notifications.focus();
  await page.keyboard.press("Space");
  await expect(notifications).toBeChecked();
  for (const action of ["Escape", "Cancel", "Close", "Confirm"]) {
    await save.focus();
    await page.keyboard.press("Enter");
    await expect(modal).toBeVisible();
    expect(await modal.evaluate((node) => node.matches(":modal"))).toBe(true);
    await expect(page.getByRole("button", { name: "Close", exact: true })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("button", { name: "Confirm", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Close", exact: true })).toBeFocused();
    expect(await modal.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    if (action === "Escape") {
      await modal.evaluate(async (node) => { await Promise.all(node.getAnimations().map((animation) => animation.finished)); });
      await page.keyboard.press("Tab");
      const summary = modal.locator(".dialog-body");
      await expect(summary).toBeFocused();
      expect(await summary.evaluate((node) => {
        const css = getComputedStyle(node);
        return { width: css.outlineWidth, style: css.outlineStyle, offset: css.outlineOffset };
      })).toEqual({ width: "2px", style: "solid", offset: "-3px" });
      if (testInfo.project.name === "narrow") {
        await page.keyboard.press("PageDown");
        await expect.poll(() => summary.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
      }
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(result.violations.map((v) => v.id)).toEqual([]);
    }
    if (action === "Escape") await page.keyboard.press("Escape");
    else await page.getByRole("button", { name: action, exact: true }).click();
    await expect(modal).toBeHidden();
    await expect(save).toBeFocused();
    if (action !== "Confirm") await expect(page.getByRole("status")).toHaveText("No settings confirmed.");
  }
  await expect(page.getByRole("status")).toContainText("<b>Local draft</b>");
  await expect(page.getByRole("status").locator("b")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
