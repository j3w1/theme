import { test, expect } from "./evidence-fixture.mjs";
import { verification } from "./verification.mjs";
import { openSpec } from "./helpers.mjs";

test("profile columns and pending decision links agree with consumption policy", verification({ component: "page", category: "structure", states: [], variants: [], note: "Consumption policy and per-profile role eligibility, including no-JS access." }), async ({ page }) => {
  await openSpec(page);
  await expect(page.locator("#consumption-policy")).toContainText("use-and-report");
  await expect(page.locator("#consumption-policy")).not.toContainText("Pre-release");
  const control = page.locator("#t-color-border-control");
  await expect(control).toContainText("approved");
  await expect(control).not.toContainText("use-and-report");
  const row = page.locator("#t-color-surface-backdrop");
  await expect(row).toContainText("use-and-report");
  const link = row.getByRole("link", { name: "D-008" });
  await expect(link).toHaveAttribute("href", "/theme/reference/decisions/#d-decisions--d-008");
  await expect(page.locator("#d-decisions--d-008")).toHaveCount(1);
  await page.goto("tokens/");
  for (const [profile, eligibility] of [["default", "approved \u00b7 use"], ["heritage-ansi", "historical-only"], ["extended", "blocked"]]) {
    await expect(page.locator(`[data-usage-profile="${profile}"] [data-usage-path="color.border.control"]`)).toContainText(eligibility);
  }
});
