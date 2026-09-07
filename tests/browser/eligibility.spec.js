import { test, expect } from "./evidence-fixture.mjs";
import { openSpec } from "./helpers.mjs";

test("profile columns and pending decision links agree with consumption policy", { annotation: { type: "verification", description: JSON.stringify({ component: "page", category: "structure", states: [], variants: [], note: "Consumption policy and per-profile role eligibility, including no-JS access." }) } }, async ({ page }) => {
  await openSpec(page);
  await expect(page.locator("#consumption-policy")).toContainText("use-and-report");
  await expect(page.locator("#consumption-policy")).not.toContainText("Pre-release");
  const cells = page.locator("#t-color-border-control td");
  await expect(cells.nth(1)).toContainText("use-and-report");
  await expect(cells.nth(2)).toContainText("historical-only");
  await expect(cells.nth(3)).toContainText("blocked");
  const link = cells.nth(1).getByRole("link", { name: "D-007" });
  await expect(link).toHaveAttribute("href", "#d-decisions--d-007");
  await expect(page.locator("#d-decisions--d-007")).toHaveCount(1);
});
