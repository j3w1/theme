import { test, expect } from "./evidence-fixture.mjs";
import { verification } from "./verification.mjs";
import { openSpec } from "./helpers.mjs";

test("documentation tables keep readable columns and compact copy controls", verification({ component: "page", category: "reflow", states: [], variants: [], note: "Documentation table sizing, contained horizontal overflow and single-line controls; component specimen geometry is checked by its own tests." }), async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop") await page.setViewportSize({ width: 980, height: 1000 });
  await openSpec(page);
  const border = page.locator("#t-color-border .compact-token-table");
  const first = border.locator("tbody tr").first();
  const geometry = await first.evaluate((row) => {
    const cells = [...row.cells];
    return { descriptionWidth: cells[1].getBoundingClientRect().width, height: row.getBoundingClientRect().height,
      descriptionWrap: getComputedStyle(cells[1]).overflowWrap, fontSize: getComputedStyle(row.closest("table")).fontSize };
  });
  expect(geometry.descriptionWidth).toBeGreaterThanOrEqual(180);
  expect(geometry.height).toBeLessThanOrEqual(112);
  expect(geometry.descriptionWrap).toBe("normal");
  expect(geometry.fontSize).toBe("12px");
  const broken = await page.locator(".spec-table th, .swatch-row .button").evaluateAll((nodes) => nodes.filter((el) => {
    if (!el.getClientRects().length || !/^\w+$/.test(el.textContent.trim())) return false;
    const range = document.createRange(); range.selectNodeContents(el);
    return range.getBoundingClientRect().height > parseFloat(getComputedStyle(el).lineHeight);
  }).map((el) => el.textContent));
  expect(broken).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  const region = border.locator("..");
  await region.focus();
  await expect(region).toBeFocused();
  if (testInfo.project.name === "desktop") {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await first.locator("td").last().scrollIntoViewIfNeeded();
    expect(await region.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.locator("#t-color-border").screenshot({ path: "test-results/compact-border-table.png" });
  }
  // Descriptions and the other profile values moved to the token explorer.
  // Keep the original readable-description constraints at their new home.
  await page.goto("tokens/", { waitUntil: "networkidle" });
  const description = page.locator('[data-usage-profile="default"] [data-usage-path="color.border.active"]');
  const usage = await description.evaluate((row) => ({ width: row.cells[3].getBoundingClientRect().width, height: row.getBoundingClientRect().height, wrap: getComputedStyle(row.cells[3]).overflowWrap }));
  expect(usage.width).toBeGreaterThanOrEqual(180);
  expect(usage.height).toBeLessThanOrEqual(112);
  expect(usage.wrap).toBe("normal");

});
