import { test, expect } from "../evidence-fixture.mjs";
import { verification } from "../verification.mjs";

test("composed matrices keep their raw demo's nested wizard styles", verification({ component: "admin-form", category: "rendering", states: ["default"], variants: ["default"], note: "Default matrix variant, first wizard step: exact transparent fill and 2px edge. Rendering only; no wizard behavior or complete state coverage claim." }), async ({ page }) => {
  await page.goto("components/admin-form/");
  const step = page.locator('#admin-form-states [data-state="default"] .wizard-step-button').first();
  await expect(step).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(step).toHaveCSS("border-bottom-width", "2px");
});
