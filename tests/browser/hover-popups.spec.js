import { test, expect } from "./evidence-fixture.mjs";
import { verification } from "./verification.mjs";
import { only } from "./helpers.mjs";

/* Hover popups with something to read or operate stay open while the pointer
   moves onto them (foundations, hover popups; WCAG 1.4.13), so a reader can
   reach a long one and scroll it. Each test approaches the popup the way a
   person does, diagonally and in small steps. The passive hex preview is
   covered by hex-swatches.spec.js. */

const centre = (box) => ({ x: box.x + box.width / 2, y: box.y + Math.min(box.height / 2, 24) });

test("the token inspector stays open while the pointer moves onto it and scrolls it", verification({ component: "page", category: "enhancements", states: [], variants: [], note: "Token inspector opened by pointer on a component page, reached diagonally and scrolled with the wheel. Pointer only; keyboard opening is covered elsewhere." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer hover on desktop");
  await page.setViewportSize({ width: 1200, height: 420 });
  await page.goto("components/button/", { waitUntil: "networkidle" });
  const token = page.locator("main [data-token]:not(.hex-swatch)").first();
  await token.scrollIntoViewIfNeeded();
  /* Near the top of the viewport the panel opens below the pointer, so the
     path to it crosses page content that is not the token. */
  await token.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 60));
  const start = await token.boundingBox();
  await page.mouse.move(start.x + 2, start.y + start.height / 2);
  await page.mouse.move(start.x + 4, start.y + start.height / 2);
  const inspector = page.locator("#inspector");
  await expect(inspector).toBeVisible();
  expect(await inspector.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  const target = centre(await inspector.boundingBox());
  await page.mouse.move(target.x, target.y, { steps: 15 });
  await expect(inspector).toBeVisible();
  await page.mouse.wheel(0, 120);
  await expect.poll(() => inspector.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await expect(inspector).toBeVisible();
  /* Leaving the popup closes it after the grace period. */
  await page.mouse.move(2, 2, { steps: 4 });
  await expect(inspector).toBeHidden();
});

test("a tooltip stays open while the pointer crosses to its popup", verification({ component: "tooltip", category: "enhancements", states: ["hover"], variants: ["default"], note: "First live tooltip on its component page: hover opens it, a diagonal move onto the wider popup keeps it, leaving both closes it. Pointer only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer hover on desktop");
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  const root = page.locator("j3w1-tooltip").first();
  const trigger = root.locator(".tooltip-trigger"), popup = root.locator('[role="tooltip"]');
  await trigger.scrollIntoViewIfNeeded();
  const start = await trigger.boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await expect(popup).toBeVisible();
  const box = await popup.boundingBox();
  /* The popup is wider than its trigger: aim at its far side, so the path
     leaves the trigger sideways before it reaches the popup. */
  await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2, { steps: 12 });
  await expect(popup).toBeVisible();
  await page.mouse.move(2, 2, { steps: 4 });
  await expect(popup).toBeHidden();
});
