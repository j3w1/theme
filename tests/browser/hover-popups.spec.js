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

test("a slow inspector load does not open the panel after the pointer has left", verification({ component: "page", category: "enhancements", states: [], variants: [], note: "The first inspector data request is held while the pointer leaves; releasing it must not open a stale panel. Pointer only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer hover on desktop");
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  await page.route("**/tokens/inspector.json", async (route) => { await held; await route.continue(); });
  await page.goto("components/button/", { waitUntil: "domcontentloaded" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  const start = await token.boundingBox();
  await page.mouse.move(start.x + 2, start.y + start.height / 2);
  await page.mouse.move(start.x + 4, start.y + start.height / 2);
  await page.mouse.move(2, 2, { steps: 4 });
  release();
  await page.waitForTimeout(600);
  await expect(page.locator("#inspector")).toBeHidden();
});

test("returning from a hex swatch to the same token reopens the inspector", verification({ component: "page", category: "enhancements", states: [], variants: [], note: "Token, then the swatch in the same table row (its passive preview takes over), then back to the token within the grace period. Pointer only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer hover on desktop");
  await page.goto("components/button/", { waitUntil: "networkidle" });
  const token = page.locator("main a[data-token]").first();
  const swatch = token.locator("xpath=ancestor::tr").locator(".hex-swatch").first();
  await token.scrollIntoViewIfNeeded();
  await token.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 60));
  const t = await token.boundingBox(), s = await swatch.boundingBox();
  await page.mouse.move(t.x + 2, t.y + t.height / 2);
  await page.mouse.move(t.x + 4, t.y + t.height / 2);
  await expect(page.locator("#inspector")).toBeVisible();
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await expect(page.locator("#hex-popup")).toBeVisible();
  await page.waitForTimeout(30);
  await page.mouse.move(t.x + 4, t.y + t.height / 2);
  await expect(page.locator("#inspector")).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator("#inspector")).toBeVisible();
});

test("the inspector stays while keyboard focus is inside it, whatever the pointer does", verification({ component: "page", category: "keyboard", states: ["focus-visible"], variants: [], note: "Inspector opened by focusing a token; focus moves to its details link; the pointer enters and leaves the panel. Focus must stay on the link. Automated Chromium only; no manual keyboard pass." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer and focus on desktop");
  await page.goto("components/button/", { waitUntil: "networkidle" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  await token.focus();
  const inspector = page.locator("#inspector");
  await expect(inspector).toBeVisible();
  const link = inspector.getByRole("link", { name: "Full usage and source details" });
  await link.focus();
  const box = await inspector.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 24));
  await page.mouse.move(2, 2);
  await page.waitForTimeout(500);
  await expect(inspector).toBeVisible();
  await expect(link).toBeFocused();
  /* The passive hex preview of a swatch in the token's row does not take it away either. */
  const swatch = token.locator("xpath=ancestor::tr").locator(".hex-swatch").first();
  const s = await swatch.boundingBox();
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await expect(page.locator("#hex-popup")).toBeVisible();
  await expect(inspector).toBeVisible();
  await expect(link).toBeFocused();
});

test("a keyboard open survives the pointer leaving while the inspector data loads", verification({ component: "page", category: "keyboard", states: ["focus-visible"], variants: [], note: "Token hovered, then focused, while the first data request is held; the pointer leaves before the response. The focused token must still get its inspector. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer and focus on desktop");
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  await page.route("**/tokens/inspector.json", async (route) => { await held; await route.continue(); });
  await page.goto("components/button/", { waitUntil: "domcontentloaded" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  const start = await token.boundingBox();
  await page.mouse.move(start.x + 2, start.y + start.height / 2);
  await page.mouse.move(start.x + 4, start.y + start.height / 2);
  await token.focus();
  await page.mouse.move(2, 2, { steps: 4 });
  release();
  await expect(page.locator("#inspector")).toBeVisible();
  await expect(token).toBeFocused();
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
