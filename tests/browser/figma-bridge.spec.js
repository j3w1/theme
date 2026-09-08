import { test, expect, readPageMode } from "./evidence-fixture.mjs";
const annotation = { type: "verification", description: JSON.stringify({ component: "page", category: "enhancements", states: [], variants: [], note: "Static bridge instructions, downloadable real adapter, explicit API/account limits and observed sample status. This browser protocol does not itself import to Figma; real import receipts are separate." }) };
test("Figma bridge exposes its actual route and limits without JavaScript", { annotation }, async ({ page }) => {
  await page.goto("figma/");
  expect(await readPageMode(page)).toEqual({ profile: "not-declared", density: "compact" });
  await expect(page.getByRole("link", { name: "Download the actual Variables adapter", exact: true })).toHaveAttribute("href", /\/theme\/exports\/figma\/importer.mjs$/);
  await expect(page.getByRole("heading", { name: "Actual verification status" })).toBeVisible();
  await expect(page.locator("main")).toContainText("eight variables");
  await expect(page.locator("main")).toContainText("Starter/Full");
  const adapter = await page.request.get("exports/figma/importer.mjs"); expect(adapter.ok()).toBe(true); expect(await adapter.text()).toContain("export async function importFigmaVariables");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
