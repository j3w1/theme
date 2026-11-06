import { test, expect } from "./evidence-fixture.mjs";
import { verification } from "./verification.mjs";
import { only } from "./helpers.mjs";

/* Hover helpers follow the pointer and close as soon as it leaves the
   trigger; a long one scrolls with the wheel over its trigger and pins on a
   click (D-042; foundations, Elevation and layering). The passive hex preview
   is covered by hex-swatches.spec.js. */

// Wrapped inline links have a union box that includes gaps between lines.
// Approach an actual painted fragment, as a pointer user does.
const tokenRect = (token) => token.evaluate(el => el.getClientRects()[0].toJSON());

/* A point on the page that is no link, control, token or helper, for an outside press. */
const freePoint = (page) => page.evaluate(() => {
  for (let y = innerHeight - 20; y > 20; y -= 17) for (let x = innerWidth - 40; x > 20; x -= 23) {
    const hit = document.elementFromPoint(x, y);
    if (hit && !hit.closest("a, button, input, select, textarea, summary, label, [data-token], [tabindex], #inspector, #hex-popup, .hex-swatch")) return { x, y };
  }
  throw new Error("no free point");
});

const box = (locator) => locator.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });

test("the token inspector follows the pointer, scrolls with the wheel over its token and pins on click", verification({ component: "page", category: "enhancements", states: [], variants: [], note: "Token inspector on a component page: pointer following at 12px, wheel over the token scrolling the panel and not the page, click pinning without navigation, pinned panel staying, scrolling and closing by Escape, outside press and its close button with focus returned. Pointer and keyboard in automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer hover on desktop");
  await page.setViewportSize({ width: 1200, height: 420 });
  await page.goto("components/button/", { waitUntil: "networkidle" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  await token.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 60));
  const start = await tokenRect(token);
  const at = { x: start.x + 4, y: start.y + start.height / 2 };
  await page.mouse.move(at.x - 2, at.y);
  await page.mouse.move(at.x, at.y);
  const inspector = page.locator("#inspector");
  await expect(inspector).toBeVisible();
  /* 12px right of and below the pointer, following it; it takes no pointer events. */
  await expect.poll(async () => { const b = await box(inspector); return [Math.round(b.x - at.x), Math.round(b.y - at.y)]; }).toEqual([12, 12]);
  await page.mouse.move(at.x + 2, at.y + 1);
  await expect.poll(async () => { const b = await box(inspector); return [Math.round(b.x - at.x), Math.round(b.y - at.y)]; }).toEqual([14, 13]);
  await expect(inspector).toHaveCSS("pointer-events", "none");
  /* Capped at 40vh: it overflows, and the wheel over the token scrolls it, not the page. */
  expect(await inspector.evaluate((el) => el.scrollHeight > el.clientHeight && el.getBoundingClientRect().height <= innerHeight * 0.4 + 1)).toBe(true);
  const pageY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 60);
  await expect.poll(() => inspector.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(pageY);
  /* A click pins it instead of navigating. */
  const url = page.url();
  await page.mouse.click(at.x + 2, at.y + 1);
  await expect(inspector).toHaveAttribute("data-pinned", "");
  await expect(inspector).toHaveAttribute("role", "dialog");
  await expect(token).toHaveAttribute("aria-expanded", "true");
  await expect(token).toHaveAttribute("aria-describedby", "inspector");
  expect(page.url()).toBe(url);
  await expect(inspector).toBeFocused();
  const close = inspector.getByRole("button", { name: "Close" });
  await expect(close).toBeVisible();
  /* Pinned, it stays while the pointer moves onto it, and scrolls under the pointer. */
  const pinned = await box(inspector);
  await page.mouse.move(pinned.x + pinned.width / 2, pinned.y + pinned.height / 2, { steps: 10 });
  await expect(inspector).toBeVisible();
  expect(await box(inspector)).toEqual(pinned);
  const before = await inspector.evaluate((el) => el.scrollTop);
  await page.mouse.wheel(0, 60);
  await expect.poll(() => inspector.evaluate((el) => el.scrollTop)).toBeGreaterThan(before);
  await page.mouse.move(2, 2, { steps: 4 });
  await page.waitForTimeout(400);
  await expect(inspector).toBeVisible();
  /* Escape closes it and returns focus to the token. */
  await page.keyboard.press("Escape");
  await expect(inspector).toBeHidden();
  await expect(token).toBeFocused();
  await expect(token).not.toHaveAttribute("aria-expanded");
  /* An outside press closes a pinned panel. */
  await page.mouse.move(at.x, at.y);
  await page.mouse.click(at.x, at.y);
  await expect(inspector).toHaveAttribute("data-pinned", "");
  const free = await freePoint(page);
  await page.mouse.click(free.x, free.y);
  await expect(inspector).toBeHidden();
  expect(page.url()).toBe(url);
  /* Its close button closes it and returns focus to the token. */
  await page.mouse.move(at.x, at.y);
  await page.mouse.click(at.x, at.y);
  await expect(inspector).toHaveAttribute("data-pinned", "");
  await close.click();
  await expect(inspector).toBeHidden();
  await expect(token).toBeFocused();
});

test("Enter on a focused token pins its inspector and moves focus into it", verification({ component: "page", category: "keyboard", states: ["focus-visible"], variants: [], note: "Token focused (anchored inspector), Enter pins it without navigating, Tab reaches the close button, Escape closes and returns focus. Automated Chromium only; no manual keyboard pass." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "keyboard on desktop");
  await page.goto("components/button/", { waitUntil: "networkidle" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  await token.focus();
  const inspector = page.locator("#inspector");
  await expect(inspector).toBeVisible();
  const t = await tokenRect(token), p = await box(inspector);
  expect(p.y).toBeGreaterThanOrEqual(t.y + t.height);
  const url = page.url();
  await page.keyboard.press("Enter");
  await expect(inspector).toHaveAttribute("data-pinned", "");
  expect(page.url()).toBe(url);
  await expect(inspector).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(inspector.getByRole("button", { name: "Close" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(inspector).toBeHidden();
  await expect(token).toBeFocused();
});

test("a slow inspector load does not open the panel after the pointer has left", verification({ component: "page", category: "enhancements", states: [], variants: [], note: "The first inspector data request is held while the pointer leaves; releasing it must not open a stale panel. Pointer only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer hover on desktop");
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  await page.route("**/tokens/inspector.json", async (route) => { await held; await route.continue(); });
  await page.goto("components/button/", { waitUntil: "domcontentloaded" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  const start = await tokenRect(token);
  await page.mouse.move(start.x + 2, start.y + start.height / 2);
  await page.mouse.move(start.x + 4, start.y + start.height / 2);
  await page.mouse.move(2, 2, { steps: 4 });
  release();
  await page.waitForTimeout(600);
  await expect(page.locator("#inspector")).toBeHidden();
});

test("returning from a hex swatch to the same token reopens the inspector", verification({ component: "page", category: "enhancements", states: [], variants: [], note: "Token, then the swatch in the same table row (its passive preview takes over), then back to the token. Pointer only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer hover on desktop");
  await page.goto("components/button/", { waitUntil: "networkidle" });
  const token = page.locator("main a[data-token]").first();
  const swatch = token.locator("xpath=ancestor::tr").locator(".hex-swatch").first();
  await token.scrollIntoViewIfNeeded();
  await token.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 60));
  const t = await tokenRect(token), s = await swatch.boundingBox();
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
  const start = await tokenRect(token);
  await page.mouse.move(start.x + 2, start.y + start.height / 2);
  await page.mouse.move(start.x + 4, start.y + start.height / 2);
  await token.focus();
  await page.mouse.move(2, 2, { steps: 4 });
  release();
  await expect(page.locator("#inspector")).toBeVisible();
  await expect(token).toBeFocused();
});

test("a tooltip follows the pointer after its delay and closes as soon as the pointer leaves", verification({ component: "tooltip", category: "enhancements", states: ["hover", "focus-visible"], variants: ["default"], note: "First live tooltip on its component page: hover opens it at 12px from the pointer and it follows; leaving the trigger closes it with no delay; keyboard focus anchors it below the trigger; a click on a short tooltip does not pin. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer hover on desktop");
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  const root = page.locator("j3w1-tooltip").first();
  const trigger = root.locator(".tooltip-trigger"), popup = root.locator('[role="tooltip"]');
  await trigger.scrollIntoViewIfNeeded();
  const start = await trigger.boundingBox();
  const at = { x: start.x + start.width / 2, y: start.y + start.height / 2 };
  await page.mouse.move(at.x, at.y);
  await expect(popup).toBeVisible();
  await expect.poll(async () => { const b = await box(popup); return [Math.round(b.x - at.x), Math.round(b.y - at.y)]; }).toEqual([12, 12]);
  await page.mouse.move(at.x + 3, at.y + 2);
  await expect.poll(async () => { const b = await box(popup); return [Math.round(b.x - at.x), Math.round(b.y - at.y)]; }).toEqual([15, 14]);
  await expect(popup).toHaveCSS("pointer-events", "none");
  await page.mouse.move(start.x + start.width + 40, at.y);
  await expect(popup).toBeHidden({ timeout: 250 });
  /* A short tooltip never pins: a click hides it. */
  await page.mouse.move(at.x, at.y);
  await expect(popup).toBeVisible();
  await trigger.click();
  await expect(popup).toBeHidden();
  await expect(popup).not.toHaveAttribute("data-pinned");
  await page.mouse.move(2, 2);
  /* Keyboard focus anchors it below the trigger. */
  await trigger.blur();
  await trigger.focus();
  await expect(popup).toBeVisible();
  const t = await trigger.boundingBox(), p = await box(popup);
  expect(p.y).toBeGreaterThanOrEqual(t.y + t.height);
  expect(Math.round(p.x)).toBe(Math.round(t.x));
});

test("a long tooltip scrolls with the wheel over its trigger and pins as a popover", verification({ component: "tooltip", category: "enhancements", states: ["hover", "open"], variants: ["long"], note: "The long live tooltip in a 500px-high viewport: it overflows its 40vh cap, the wheel over the trigger scrolls it and not the page until it reaches its end, and a click pins it with a close button and focus inside. Escape returns focus. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer hover on desktop");
  await page.setViewportSize({ width: 1200, height: 500 });
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  const root = page.locator("j3w1-tooltip#example-tooltip-long");
  const trigger = root.locator(".tooltip-trigger"), popup = root.locator(".tooltip-popup");
  await trigger.scrollIntoViewIfNeeded();
  await trigger.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 120));
  const start = await trigger.boundingBox();
  const at = { x: start.x + 6, y: start.y + start.height / 2 };
  await page.mouse.move(at.x, at.y);
  await expect(popup).toBeVisible();
  const b = await box(popup);
  expect(b.height).toBeLessThanOrEqual(500 * 0.4 + 1);
  expect(await popup.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  /* The wheel over the trigger scrolls the popup, never the page, until the popup's end. */
  const pageY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 80);
  await expect.poll(() => popup.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(pageY);
  await popup.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await page.mouse.wheel(0, 80);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(pageY);
  await trigger.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 120));
  const again = await trigger.boundingBox();
  await page.mouse.move(again.x + 6, again.y + again.height / 2);
  await expect(popup).toBeVisible();
  /* A click pins it as a popover. */
  await page.mouse.click(again.x + 6, again.y + again.height / 2);
  await expect(popup).toHaveAttribute("data-pinned", "");
  await expect(popup).toHaveAttribute("role", "dialog");
  await expect(popup).toHaveAccessibleName("Layout");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toHaveAttribute("aria-describedby", await popup.getAttribute("id"));
  await expect(popup).toBeFocused();
  await expect(popup).toHaveCSS("pointer-events", "auto");
  await expect(popup.getByRole("button", { name: "Close" })).toBeVisible();
  await page.mouse.move(2, 2, { steps: 4 });
  await expect(popup).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();
  await expect(popup).toHaveAttribute("role", "tooltip");
  await expect(trigger).toBeFocused();
});

test("a following helper flips to the pointer's left and top near the viewport edges", verification({ component: "tooltip", category: "reflow", states: ["hover"], variants: ["long"], note: "The long live tooltip's trigger moved to the bottom-right corner of the viewport: the popup opens left of and above the pointer, inside the 8px gutter. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer hover on desktop");
  await page.setViewportSize({ width: 1200, height: 600 });
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  const root = page.locator("j3w1-tooltip#example-tooltip-long");
  const trigger = root.locator(".tooltip-trigger"), popup = root.locator(".tooltip-popup");
  /* Fixed in the corner, so the test does not depend on the page layout. */
  await trigger.evaluate((el) => Object.assign(el.style, { position: "fixed", right: "4px", bottom: "4px" }));
  const t = await trigger.boundingBox();
  const at = { x: t.x + t.width - 4, y: t.y + t.height - 4 };
  await page.mouse.move(at.x, at.y);
  await expect(popup).toBeVisible();
  await expect.poll(async () => { const b = await box(popup); return [Math.round(at.x - (b.x + b.width)), Math.round(at.y - (b.y + b.height))]; }).toEqual([12, 12]);
  const b = await box(popup);
  expect(b.x).toBeGreaterThanOrEqual(8);
  expect(b.y).toBeGreaterThanOrEqual(8);
});

test("hovering another token does not take over a panel that keyboard focus holds", verification({ component: "page", category: "keyboard", states: ["focus-visible"], variants: [], note: "Inspector opened by focus on token A with focus moved to its details link, and separately A focused while its data loads; the pointer hovers token B. A's panel and focus must stay. A click on the page background then closes it. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer and focus on desktop");
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  await page.route("**/tokens/inspector.json", async (route) => { await held; await route.continue(); });
  await page.goto("components/button/", { waitUntil: "domcontentloaded" });
  const tokens = page.locator("main a[data-token]");
  const a = tokens.nth(0), b = tokens.nth(2);
  const pathA = await a.getAttribute("data-token");
  await a.scrollIntoViewIfNeeded();
  /* A is focused while its data loads; the pointer passes over B and away. */
  await a.focus();
  const bb = await tokenRect(b);
  await page.mouse.move(bb.x + 4, bb.y + bb.height / 2);
  await page.mouse.move(bb.x + 6, bb.y + bb.height / 2);
  await page.mouse.move(2, 2, { steps: 4 });
  release();
  const inspector = page.locator("#inspector");
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText(pathA);
  /* Focus inside A's panel; hovering a token the panel does not cover neither
     replaces the panel nor drops focus. */
  const link = inspector.getByRole("link", { name: "Full usage and source details" });
  await link.focus();
  const panel = await inspector.boundingBox();
  const free = await tokens.evaluateAll((els, { panel, pathA }) => {
    for (const el of els) {
      if (el.dataset.token === pathA) continue;
      for (const r of el.getClientRects()) {
      const x = r.left + Math.min(6, r.width / 2), y = r.top + r.height / 2;
      const inside = x >= panel.x && x <= panel.x + panel.width && y >= panel.y && y <= panel.y + panel.height;
      if (!inside && y > 0 && y < innerHeight && x > 0 && x < innerWidth && document.elementFromPoint(x, y)?.closest("[data-token]") === el) return { x, y };
      }
    }
    return null;
  }, { panel, pathA });
  expect(free).not.toBeNull();
  await page.mouse.move(free.x - 1, free.y);
  await page.mouse.move(free.x, free.y);
  await page.waitForTimeout(400);
  await expect(inspector).toContainText(pathA);
  await expect(link).toBeFocused();
  /* A click on the page background sends focus nowhere and closes the panel. */
  await page.mouse.move(2, 2);
  await page.locator("main h1").first().click();
  await expect(inspector).toBeHidden();
});

test("focus leaving for the page background cancels a keyboard open still loading", verification({ component: "page", category: "keyboard", states: ["focus-visible"], variants: [], note: "Token focused while the first data request is held; a click on the page background sends focus nowhere before the response. No inspector may open afterwards. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer and focus on desktop");
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  await page.route("**/tokens/inspector.json", async (route) => { await held; await route.continue(); });
  await page.goto("components/button/", { waitUntil: "domcontentloaded" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  await token.focus();
  await page.locator("main h1").first().click();
  release();
  await page.waitForTimeout(600);
  await expect(page.locator("#inspector")).toBeHidden();
});

test("a keyboard-opened inspector follows its token on scroll and stays inside a narrow viewport", verification({ component: "page", category: "reflow", states: ["focus-visible"], variants: [], note: "Inspector opened by focus, then the page scrolls and the viewport narrows to 360px. The panel must not cover its token and must keep the 8px gutter. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "focus and resize on desktop");
  await page.goto("components/button/", { waitUntil: "networkidle" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  await token.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 200));
  await token.focus();
  const inspector = page.locator("#inspector");
  await expect(inspector).toBeVisible();
  const overlaps = async () => {
    const [p, t] = [await inspector.boundingBox(), await tokenRect(token)];
    return p.x < t.x + t.width && t.x < p.x + p.width && p.y < t.y + t.height && t.y < p.y + p.height;
  };
  await page.mouse.wheel(0, 120);
  await expect.poll(overlaps).toBe(false);
  const inGutter = async (width, height) => {
    const p = await inspector.boundingBox();
    return p.x >= 8 && p.x + p.width <= width - 8 && p.y >= 8 && p.y + p.height <= height - 8;
  };
  /* The token scrolls out of view above: the panel stays inside the gutter. */
  await token.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().bottom + 300));
  const desk = page.viewportSize();
  await expect.poll(() => inGutter(desk.width, desk.height)).toBe(true);
  await token.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 200));
  /* At 360px the page reflows and the token moves away: the panel stays inside
     the gutter; brought back into view, the token is not covered. */
  await page.setViewportSize({ width: 360, height: 700 });
  await expect.poll(() => inGutter(360, 700)).toBe(true);
  await token.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await inGutter(360, 700)) && !(await overlaps())).toBe(true);
  await expect(token).toBeFocused();
});

test("a pinned inspector stays inside a viewport that narrows", verification({ component: "page", category: "reflow", states: [], variants: [], note: "Inspector pinned by a click, pointer resting on the panel, viewport narrowed to 360px: the pinned panel stays open inside the 8px gutter. Pointer only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer hover on desktop");
  await page.goto("components/button/", { waitUntil: "networkidle" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  await token.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 60));
  const start = await tokenRect(token);
  await page.mouse.move(start.x + 2, start.y + start.height / 2);
  await page.mouse.move(start.x + 4, start.y + start.height / 2);
  const inspector = page.locator("#inspector");
  await expect(inspector).toBeVisible();
  await page.mouse.click(start.x + 4, start.y + start.height / 2);
  await expect(inspector).toHaveAttribute("data-pinned", "");
  const b = await inspector.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + Math.min(b.height / 2, 24), { steps: 10 });
  await page.setViewportSize({ width: 360, height: 700 });
  const inGutter = () => inspector.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return !el.hidden && r.left >= 8 && r.right <= document.documentElement.clientWidth - 8 && r.top >= 8 && r.bottom <= innerHeight - 8;
  });
  await expect.poll(inGutter).toBe(true);
  await page.waitForTimeout(400);
  expect(await inGutter()).toBe(true);
});
