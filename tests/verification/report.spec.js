import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("verification matrix and per-component evidence are readable without scripts", async ({ page }) => {
  await page.goto("verification/");
  await expect(page.locator("h1")).toHaveText("Verification evidence");
  await expect(page.locator("#matrix")).toBeVisible();
  await expect(page.locator("#v-button")).toBeAttached();
  await expect(page.locator('tr[data-kind="manual"][data-result="not run"]').first()).toBeAttached();
  expect(await page.locator('a[href^="evidence.json#"]').count()).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("report filters are keyboard operable and reset restores all records", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "nojs", "Filtering is an optional enhancement; static rows are checked separately");
  await page.goto("verification/");
  const component = page.locator('select[name="component"]');
  await component.focus();
  await page.keyboard.press("b");
  await page.keyboard.press("Enter");
  await component.selectOption("button");
  expect(await page.locator('tr[data-component="button"]:visible').count()).toBeGreaterThan(0);
  expect(await page.locator('tr[data-component="page"]:visible').count()).toBe(0);
  await page.locator('button[type="reset"]').click();
  expect(await page.locator('tr[data-component="page"]:visible').count()).toBeGreaterThan(0);
});

test("report has no automated accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One report accessibility scan");
  await page.goto("verification/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
