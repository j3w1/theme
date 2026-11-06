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

/* Review round 1 (F1–F12): each test shows one defect of the first version. */

const longTooltip = async (page, height = 500) => {
  await page.setViewportSize({ width: 1200, height });
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  const root = page.locator("j3w1-tooltip#example-tooltip-long");
  const trigger = root.locator(".tooltip-trigger"), popup = root.locator(".tooltip-popup");
  await trigger.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 120));
  const t = await trigger.boundingBox();
  return { root, trigger, popup, at: { x: t.x + 6, y: t.y + t.height / 2 } };
};

test("F1: pinning consumes the first activation before the trigger's own handlers; the second reaches them", verification({ component: "tooltip", category: "enhancements", states: ["open"], variants: ["long"], note: "A click handler on the long tooltip's trigger counts activations: the pinning click must not reach it, the next click on the pinned trigger must. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer on desktop");
  const { trigger, popup, at } = await longTooltip(page);
  await trigger.evaluate((el) => { window.__actions = 0; el.addEventListener("click", () => { window.__actions++; }); });
  await page.mouse.move(at.x, at.y);
  await expect(popup).toBeVisible();
  await page.mouse.click(at.x, at.y);
  await expect(popup).toHaveAttribute("data-pinned", "");
  expect(await page.evaluate(() => window.__actions)).toBe(0);
  await page.mouse.click(at.x, at.y);
  expect(await page.evaluate(() => window.__actions)).toBe(1);
});

test("F2: keyboard focus anchors an already visible tooltip and keeps it anchored while the pointer moves", verification({ component: "tooltip", category: "keyboard", states: ["hover", "focus-visible"], variants: ["long"], note: "Hover opens the tooltip at the pointer; keyboard focus on the same trigger anchors it below the trigger; further pointer movement over the trigger leaves it anchored. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer and focus on desktop");
  const { trigger, popup, at } = await longTooltip(page, 800);
  await page.mouse.move(at.x, at.y);
  await expect(popup).toBeVisible();
  await trigger.focus();
  expect(await trigger.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
  const t = await trigger.boundingBox();
  const anchored = async () => { const b = await box(popup); return Math.round(b.x) === Math.round(t.x) && b.y >= t.y + t.height; };
  await expect.poll(anchored).toBe(true);
  await page.mouse.move(at.x + 4, at.y + 1);
  await page.mouse.move(at.x + 8, at.y + 2);
  await page.waitForTimeout(100);
  expect(await anchored()).toBe(true);
});

test("F3: a click on a token while its data loads pins the inspector, even after the pointer leaves", verification({ component: "page", category: "enhancements", states: [], variants: [], note: "Inspector data held; a click on a token is consumed, the pointer leaves, the data arrives: the inspector must be pinned and the page must not navigate. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer on desktop");
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  await page.route("**/tokens/inspector.json", async (route) => { await held; await route.continue(); });
  await page.goto("components/button/", { waitUntil: "domcontentloaded" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  const t = await tokenRect(token);
  const url = page.url();
  await page.mouse.move(t.x + 4, t.y + t.height / 2);
  await page.mouse.click(t.x + 4, t.y + t.height / 2);
  await page.mouse.move(2, 2, { steps: 4 });
  release();
  const inspector = page.locator("#inspector");
  await expect(inspector).toHaveAttribute("data-pinned", "");
  await expect(inspector).toBeVisible();
  expect(page.url()).toBe(url);
});

test.describe("an asynchronous helper on a touch screen", () => {
  test.use({ hasTouch: true });
  test("F4: a cold tap waits for delayed content, pins an overflowing helper and replays the activation of a short one", verification({ component: "tooltip", category: "enhancements", states: ["open"], variants: [], note: "Fixture built from @j3w1/ui/enhance/hover-helper with a 150 ms asynchronous renderer: a tap on a long-content trigger pins it without running the trigger's handler; a tap on a short-content trigger shows no pin and runs the handler once. Chromium touch emulation only." }), async ({ page }, testInfo) => {
    test.skip(!only(testInfo, "desktop"), "touch emulation on desktop");
    await page.goto("components/tooltip/", { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      const { hoverHelper } = await import(new URL("../../ui/enhance/hover-helper.js", location.href).href);
      document.body.insertAdjacentHTML("afterbegin", '<div id="fx" style="position:fixed;left:40px;top:40px;z-index:9999"><button type="button" id="fx-long">Long</button> <button type="button" id="fx-short">Short</button><div id="fx-help" class="tooltip-popup"></div></div>');
      window.__fx = { long: 0, short: 0 };
      document.querySelector("#fx-long").addEventListener("click", () => window.__fx.long++);
      document.querySelector("#fx-short").addEventListener("click", () => window.__fx.short++);
      hoverHelper(document.querySelector("#fx-help"), {
        trigger: (node) => node.closest("#fx-long, #fx-short"),
        render: (trigger, box) => new Promise((resolve) => setTimeout(() => {
          box.textContent = trigger.id === "fx-long" ? "A long description. ".repeat(400) : "Short.";
          resolve();
        }, 150)),
      });
    });
    const helper = page.locator("#fx-help");
    await page.locator("#fx-long").tap();
    await expect(helper).toHaveAttribute("data-pinned", "");
    expect(await page.evaluate(() => window.__fx.long)).toBe(0);
    await page.keyboard.press("Escape");
    await expect(helper).toBeHidden();
    await page.locator("#fx-short").tap();
    await expect.poll(() => page.evaluate(() => window.__fx.short)).toBe(1);
    await expect(helper).not.toHaveAttribute("data-pinned");
  });
});

test("F5: Escape closes the focused pinned inspector before a hover preview", verification({ component: "page", category: "keyboard", states: [], variants: [], note: "Inspector pinned by click with focus inside; the pointer then hovers a colour swatch so its preview opens; Escape must close the inspector and return focus to its token. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer and keyboard on desktop");
  await page.goto("components/button/", { waitUntil: "networkidle" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  await token.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 60));
  const t = await tokenRect(token);
  await page.mouse.move(t.x + 4, t.y + t.height / 2);
  await page.mouse.click(t.x + 4, t.y + t.height / 2);
  const inspector = page.locator("#inspector");
  await expect(inspector).toHaveAttribute("data-pinned", "");
  await expect(inspector).toBeFocused();
  const panel = await inspector.boundingBox();
  const s = await page.locator("main .hex-swatch[data-token-matches]").evaluateAll((els, panel) => {
    for (const el of els) {
      const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      const inside = x >= panel.x && x <= panel.x + panel.width && y >= panel.y && y <= panel.y + panel.height;
      if (!inside && y > 0 && y < innerHeight && document.elementFromPoint(x, y) === el) return { x, y };
    }
    return null;
  }, panel);
  expect(s).not.toBeNull();
  await page.mouse.move(s.x, s.y);
  await expect(page.locator("#hex-popup")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(inspector).toBeHidden();
  await expect(token).toBeFocused();
});

test("F6: hiding a pinned tooltip programmatically returns focus to its trigger", verification({ component: "tooltip", category: "keyboard", states: ["open"], variants: ["long"], note: "Long tooltip pinned with focus inside; the element's hide() method closes it; focus must return to the trigger. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer on desktop");
  const { root, trigger, popup, at } = await longTooltip(page);
  await page.mouse.move(at.x, at.y);
  await page.mouse.click(at.x, at.y);
  await expect(popup).toBeFocused();
  await root.evaluate((el) => el.hide());
  await expect(popup).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("F9: Ctrl+wheel over a trigger stays a zoom gesture and does not scroll the helper", verification({ component: "tooltip", category: "enhancements", states: ["open"], variants: ["long"], note: "A cancelable Ctrl+wheel event dispatched on the long tooltip's trigger while its overflowing popup is visible: its default must stay available and the popup must not scroll. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer on desktop");
  const { trigger, popup, at } = await longTooltip(page);
  await page.mouse.move(at.x, at.y);
  await expect(popup).toBeVisible();
  const allowed = await trigger.evaluate((el) => el.dispatchEvent(new WheelEvent("wheel", { deltaY: 80, ctrlKey: true, bubbles: true, cancelable: true })));
  expect(allowed).toBe(true);
  expect(await popup.evaluate((el) => el.scrollTop)).toBe(0);
});

test("F10: the helper's size cap uses the same viewport as its placement", verification({ component: "tooltip", category: "reflow", states: ["open"], variants: ["long"], note: "The long tooltip's inline cap must be computed from documentElement.clientWidth minus both 8px gutters, not 100vw, so a classic scrollbar cannot push it past the gutter. Headless Chromium hides scrollbars, so the test reads the applied cap. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer on desktop");
  const { popup, at } = await longTooltip(page);
  await page.mouse.move(at.x, at.y);
  await expect(popup).toBeVisible();
  const cap = await popup.evaluate((el) => ({ inline: el.style.maxInlineSize, block: el.style.maxBlockSize, width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }));
  expect(cap.inline).toContain(`${cap.width - 16}px`);
  expect(cap.block).toContain(`${cap.height - 16}px`);
  expect(cap.inline).not.toContain("vw");
});

test("F11: a pinned helper with keyboard focus draws the container focus ring", verification({ component: "page", category: "keyboard", states: ["focus-visible"], variants: [], note: "Inspector pinned with Enter from a focused token: the focused panel must draw the 2px solid focus.ring-container ring at the container offset. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "keyboard on desktop");
  await page.goto("components/button/", { waitUntil: "networkidle" });
  const token = page.locator("main a[data-token]").first();
  await token.scrollIntoViewIfNeeded();
  await token.focus();
  const inspector = page.locator("#inspector");
  await expect(inspector).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(inspector).toBeFocused();
  const ring = await inspector.evaluate((el) => {
    const s = getComputedStyle(el), probe = document.createElement("i");
    probe.style.color = "var(--color-interaction-focus-ring-container)";
    document.body.append(probe);
    const color = getComputedStyle(probe).color; probe.remove();
    return { style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset, color: s.outlineColor, expected: color };
  });
  expect(ring).toEqual({ style: "solid", width: "2px", offset: "-3px", color: ring.expected, expected: ring.expected });
});

test("F12: a pointer-opened tooltip stays hidden until its 300 ms delay has passed", verification({ component: "tooltip", category: "enhancements", states: ["hover"], variants: ["default"], note: "The pointer rests on the first live tooltip's trigger; the popup must still be hidden 150 ms later and visible after 300 ms. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer on desktop");
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  const root = page.locator("j3w1-tooltip").first();
  const trigger = root.locator(".tooltip-trigger"), popup = root.locator('[role="tooltip"]');
  await trigger.scrollIntoViewIfNeeded();
  const t = await trigger.boundingBox();
  const opened = await page.evaluate(({ x, y }) => new Promise((resolve) => {
    const popup = document.querySelector("j3w1-tooltip [role=tooltip]");
    const start = performance.now();
    new MutationObserver((_, observer) => { if (!popup.hidden) { observer.disconnect(); resolve(performance.now() - start); } }).observe(popup, { attributes: true, attributeFilter: ["hidden"] });
    document.elementFromPoint(x, y).dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: x, clientY: y, pointerType: "mouse" }));
  }), { x: t.x + t.width / 2, y: t.y + t.height / 2 });
  expect(opened).toBeGreaterThanOrEqual(290);
  await expect(popup).toBeVisible();
});

/* Review round 2 (N1–N8): each test shows one defect left after round 1. The
   fixtures are built from the distributed @j3w1/ui/enhance/hover-helper. */

const fixtureHelper = (page, setup) => page.evaluate(async (source) => {
  const { hoverHelper } = await import(new URL("../../ui/enhance/hover-helper.js", location.href).href);
  new Function("hoverHelper", source)(hoverHelper);
}, setup);

test("N1: Escape priority holds across separately loaded copies of the hover helper", verification({ component: "tooltip", category: "keyboard", states: ["open"], variants: ["default", "long"], note: "The portal's deployment: the token inspector runs the Astro-bundled copy and the tooltips the separately loaded /ui/ copy. A pinned helper of either copy with focus inside must take Escape before a visible helper of the other copy; destroying a controller removes it from the shared registry. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer and keyboard on desktop");
  await page.setViewportSize({ width: 1200, height: 500 });
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  const token = page.locator("main a[data-token]").first();
  await token.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 200));
  const inspector = page.locator("#inspector");
  const short = page.locator("j3w1-tooltip#example-tooltip-default"), long = page.locator("j3w1-tooltip#example-tooltip-long");
  /* Both tooltip triggers are fixed in view beside the token, away from where its panel opens. */
  await short.locator(".tooltip-trigger").evaluate((el) => Object.assign(el.style, { position: "fixed", left: "40px", bottom: "40px" }));
  await long.locator(".tooltip-trigger").evaluate((el) => Object.assign(el.style, { position: "fixed", right: "40px", top: "40px" }));
  const t = await tokenRect(token);
  const onToken = { x: t.x + 4, y: t.y + t.height / 2 };
  const centre = async (locator) => { const b = await locator.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

  /* A pinned inspector (bundled copy) holds focus; a tooltip (/ui/ copy) is visible by hover. */
  await page.mouse.move(onToken.x, onToken.y);
  await page.mouse.click(onToken.x, onToken.y);
  await expect(inspector).toHaveAttribute("data-pinned", "");
  await expect(inspector).toBeFocused();
  const s = await centre(short.locator(".tooltip-trigger"));
  await page.mouse.move(s.x, s.y);
  await expect(short.locator('[role="tooltip"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(inspector).toBeHidden();
  await expect(token).toBeFocused();

  /* A pinned tooltip (/ui/ copy) holds focus; the inspector (bundled copy) is visible by hover. */
  await page.mouse.move(2, 2);
  await expect(short.locator('[role="tooltip"]')).toBeHidden();
  const l = await centre(long.locator(".tooltip-trigger"));
  await page.mouse.move(l.x, l.y);
  await page.mouse.click(l.x, l.y);
  const popup = long.locator(".tooltip-popup");
  await expect(popup).toHaveAttribute("data-pinned", "");
  await expect(popup).toBeFocused();
  await page.mouse.move(onToken.x - 1, onToken.y);
  await page.mouse.move(onToken.x, onToken.y);
  await expect(inspector).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();
  await expect(long.locator(".tooltip-trigger")).toBeFocused();

  /* Destroying a controller removes it from the document-wide registry. */
  const sizes = await page.evaluate(() => {
    const registry = document[Symbol.for("j3w1.hover-helper.controllers")];
    if (!registry) return null;
    const before = registry.size;
    document.querySelector("j3w1-tooltip#example-tooltip-with-shortcut").remove();
    return [before, registry.size];
  });
  expect(sizes).not.toBeNull();
  expect(sizes[1]).toBe(sizes[0] - 1);
});

test("N2: focus moving away cancels a pending pin, to an unrelated control and to another trigger", verification({ component: "tooltip", category: "keyboard", states: ["focus-visible"], variants: [], note: "Fixture with a held asynchronous renderer: a click on trigger A waits for content; Tab to an unrelated button, or Shift+Tab to trigger B, must cancel A's pending pin. The content arriving later must not pin or take focus back, and B's helper must close once focus leaves B. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer and keyboard on desktop");
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  await fixtureHelper(page, `
    document.body.insertAdjacentHTML("afterbegin", '<div id="fx" style="position:fixed;left:40px;top:40px;z-index:9999"><button type="button" id="fx-b">B</button> <button type="button" id="fx-a">A</button> <button type="button" id="fx-c">Unrelated</button><div id="fx-help" class="tooltip-popup"></div></div>');
    window.__fx = { release: [] };
    hoverHelper(document.querySelector("#fx-help"), {
      trigger: (node) => node.closest("#fx-a, #fx-b"),
      render: (trigger, box) => {
        if (trigger.id === "fx-b") { box.textContent = "Short."; return; }
        return new Promise((resolve) => window.__fx.release.push(() => { box.textContent = "A long description. ".repeat(400); resolve(); }));
      },
    });`);
  const helper = page.locator("#fx-help"), a = page.locator("#fx-a"), b = page.locator("#fx-b"), c = page.locator("#fx-c");
  const releaseAll = async () => { await page.evaluate(() => { for (const release of window.__fx.release.splice(0)) release(); }); await page.waitForTimeout(100); };
  /* To an unrelated control: the content arriving later neither pins nor takes focus back. */
  await a.click();
  await page.keyboard.press("Tab");
  await expect(c).toBeFocused();
  await releaseAll();
  await expect(helper).not.toHaveAttribute("data-pinned");
  await expect(helper).toBeHidden();
  await expect(c).toBeFocused();
  /* To another trigger: B's helper is a plain anchored one, and it closes when focus leaves B. */
  await a.click();
  await page.keyboard.press("Shift+Tab");
  await expect(b).toBeFocused();
  await releaseAll();
  await expect(helper).toBeVisible();
  await expect(helper).toHaveText("Short.");
  await expect(helper).not.toHaveAttribute("data-pinned");
  await b.evaluate((el) => el.blur());
  await expect(helper).toBeHidden();
});

const n3Fixture = async (page) => {
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  await fixtureHelper(page, `
    document.body.insertAdjacentHTML("afterbegin", '<div id="fx" style="position:fixed;left:40px;top:40px;z-index:9999"><button type="button" id="fx-a">A</button><button type="button" id="fx-b">B</button><div id="fx-help" class="tooltip-popup"></div></div>');
    window.__fx = { calls: [], count: { "fx-a": 0, "fx-b": 0 } };
    hoverHelper(document.querySelector("#fx-help"), {
      trigger: (node) => node.closest("#fx-a, #fx-b"),
      openDelay: 0,
      render: (trigger, box) => {
        window.__fx.count[trigger.id]++;
        return new Promise((resolve) => window.__fx.calls.push(() => { box.textContent = (trigger.id + " content. ").repeat(400); resolve(); }));
      },
    });`);
  /* Release the newest render first, as a fast later render would finish, until none is left. */
  return async () => {
    for (let i = 0; i < 6; i++) { await page.evaluate(() => window.__fx.calls.pop()?.()); await page.waitForTimeout(60); }
  };
};

test("N3: a trigger's render in flight is reused, and an older render never overwrites a pinned helper", verification({ component: "tooltip", category: "enhancements", states: ["open"], variants: [], note: "Fixture with automatic pinning and held asynchronous renders released newest first: hover then click on one trigger must render it once and stay pinned with its close button; hover on A, then hover and click on B, must leave B pinned with B's content and its close button. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer on desktop");
  const helper = page.locator("#fx-help");
  /* The same trigger: hover starts a render, the click reuses it. */
  let releaseNewestFirst = await n3Fixture(page);
  let a = await box(page.locator("#fx-a"));
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.click(a.x + a.width / 2, a.y + a.height / 2);
  await releaseNewestFirst();
  await expect(helper).toHaveAttribute("data-pinned", "");
  await expect(helper.locator(".tooltip-close")).toHaveCount(1);
  expect(await page.evaluate(() => window.__fx.count["fx-a"])).toBe(1);
  /* Another trigger: A's render, still in flight, must not write over B pinned. */
  releaseNewestFirst = await n3Fixture(page);
  a = await box(page.locator("#fx-a"));
  const b = await box(page.locator("#fx-b"));
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await releaseNewestFirst();
  await expect(helper).toHaveAttribute("data-pinned", "");
  await expect(helper).toContainText("fx-b content.");
  await expect(helper).not.toContainText("fx-a content.");
  await expect(helper.locator(".tooltip-close")).toHaveCount(1);
});

test("N4: Enter while the content loads replays the trigger's action when the render cancels or fails", verification({ component: "tooltip", category: "keyboard", states: ["focus-visible"], variants: [], note: "Fixture with pin: true and a held renderer: Enter on a focused button, and on a focusable non-button trigger with its own Enter handler, while the content loads; the render then returns false or rejects. Each trigger's own action must run once. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "keyboard on desktop");
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  await fixtureHelper(page, `
    document.body.insertAdjacentHTML("afterbegin", '<div id="fx" style="position:fixed;left:40px;top:40px;z-index:9999"><button type="button" id="fx-button">Button</button> <span id="fx-custom" tabindex="0">Custom</span><div id="fx-help" class="tooltip-popup"></div></div>');
    window.__fx = { pending: [], button: 0, custom: 0 };
    document.querySelector("#fx-button").addEventListener("click", () => window.__fx.button++);
    document.querySelector("#fx-custom").addEventListener("keydown", (event) => { if (event.key === "Enter") window.__fx.custom++; });
    hoverHelper(document.querySelector("#fx-help"), {
      trigger: (node) => node.closest("#fx-button, #fx-custom"),
      pin: true,
      render: () => new Promise((resolve, reject) => window.__fx.pending.push({ resolve, reject })),
    });`);
  const helper = page.locator("#fx-help");
  const settle = (how) => page.evaluate((how) => { const p = window.__fx.pending.pop(); how === "reject" ? p.reject(new Error("no content")) : p.resolve(false); }, how);
  const count = (name) => page.evaluate((name) => window.__fx[name], name);
  for (const [id, name] of [["#fx-button", "button"], ["#fx-custom", "custom"]]) {
    for (const how of ["false", "reject"]) {
      const before = await count(name);
      await page.locator(id).focus();
      await expect.poll(() => page.evaluate(() => window.__fx.pending.length)).toBe(1);
      await page.keyboard.press("Enter");
      await settle(how);
      await expect.poll(() => count(name), { message: `${id}, render ${how}` }).toBe(before + 1);
      await expect(helper).toBeHidden();
      await page.locator(id).evaluate((el) => el.blur());
    }
  }
});

test.describe("a replayed activation on a touch screen", () => {
  test.use({ hasTouch: true });
  test("N5: a replayed activation reaches the original target and its own handler; a text field keeps its activation", verification({ component: "tooltip", category: "enhancements", states: ["open"], variants: [], note: "The F4 fixture extended: a tap on a descendant with its own click handler inside a short-content trigger must, once the 150 ms content shows no pin is needed, reach that descendant (as its event target, at the tapped point) and then the trigger. A tap on a text field trigger with long content is not held: its own click runs at once and it never pins. A replayed event is untrusted. Chromium touch emulation only." }), async ({ page }, testInfo) => {
    test.skip(!only(testInfo, "desktop"), "touch emulation on desktop");
    await page.goto("components/tooltip/", { waitUntil: "networkidle" });
    await fixtureHelper(page, `
      document.body.insertAdjacentHTML("afterbegin", '<div id="fx" style="position:fixed;left:40px;top:40px;z-index:9999"><button type="button" id="fx-short"><span id="fx-inner" style="display:inline-block;padding:8px 16px">Short</span></button> <input id="fx-field" aria-label="Field"><div id="fx-help" class="tooltip-popup"></div></div>');
      window.__fx = { inner: [], outer: 0, field: 0 };
      document.querySelector("#fx-inner").addEventListener("click", (event) => window.__fx.inner.push({ target: event.target.id, x: event.clientX, y: event.clientY, trusted: event.isTrusted }));
      document.querySelector("#fx-short").addEventListener("click", () => window.__fx.outer++);
      document.querySelector("#fx-field").addEventListener("click", () => window.__fx.field++);
      hoverHelper(document.querySelector("#fx-help"), {
        trigger: (node) => node.closest("#fx-short, #fx-field"),
        render: (trigger, box) => new Promise((resolve) => setTimeout(() => {
          box.textContent = trigger.id === "fx-field" ? "A long description. ".repeat(400) : "Short.";
          resolve();
        }, 150)),
      });`);
    const helper = page.locator("#fx-help");
    const inner = await box(page.locator("#fx-inner"));
    const at = { x: Math.round(inner.x + inner.width / 2), y: Math.round(inner.y + inner.height / 2) };
    await page.touchscreen.tap(at.x, at.y);
    await expect.poll(() => page.evaluate(() => window.__fx.inner.length)).toBe(1);
    const replayed = await page.evaluate(() => window.__fx.inner[0]);
    expect(replayed.target).toBe("fx-inner");
    expect([Math.round(replayed.x), Math.round(replayed.y)]).toEqual([at.x, at.y]);
    expect(replayed.trusted).toBe(false);
    expect(await page.evaluate(() => window.__fx.outer)).toBe(1);
    await expect(helper).not.toHaveAttribute("data-pinned");
    /* A text field's own activation cannot be replayed, so it is never held. */
    await page.locator("#fx-field").tap();
    await expect.poll(() => page.evaluate(() => window.__fx.field)).toBe(1);
    await page.waitForTimeout(300);
    await expect(helper).not.toHaveAttribute("data-pinned");
    await expect(page.locator("#fx-field")).toBeFocused();
  });
});

/* Review round 3 (R1–R5): each test shows one defect left after round 2. */

const LONG = '"A long description. ".repeat(400)';

test("R1: a trigger inside an editable region keeps the editor's own activation", verification({ component: "tooltip", category: "enhancements", states: [], variants: [], note: "Fixture: a trigger span inside a contenteditable div, with an asynchronous long-content renderer. A click on the span must reach the editor at once, never pin and leave focus in the editor. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer on desktop");
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  await fixtureHelper(page, `
    document.body.insertAdjacentHTML("afterbegin", '<div id="fx" style="position:fixed;left:40px;top:40px;z-index:9999"><div id="fx-editor" contenteditable="true">Some text with a <span id="fx-term" data-help>term</span> in it.</div><div id="fx-help" class="tooltip-popup"></div></div>');
    window.__fx = { clicks: 0 };
    document.querySelector("#fx-editor").addEventListener("click", () => window.__fx.clicks++);
    hoverHelper(document.querySelector("#fx-help"), {
      trigger: (node) => node.closest("[data-help]"),
      render: (trigger, box) => new Promise((resolve) => setTimeout(() => { box.textContent = ${LONG}; resolve(); }, 150)),
    });`);
  await page.locator("#fx-term").click();
  await expect.poll(() => page.evaluate(() => window.__fx.clicks)).toBe(1);
  await page.waitForTimeout(300);
  await expect(page.locator("#fx-help")).not.toHaveAttribute("data-pinned");
  await expect(page.locator("#fx-editor")).toBeFocused();
});

test("R2: a replayed click on a pinned helper's close button closes it", verification({ component: "tooltip", category: "enhancements", states: ["open"], variants: [], note: "Fixture: a pinned helper P, and an earlier-registered helper Q whose triggers are close buttons and whose asynchronous content is short. Q holds the click on P's close button, then replays it: P must close and return focus to its trigger. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer on desktop");
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  await fixtureHelper(page, `
    document.body.insertAdjacentHTML("afterbegin", '<div id="fx" style="position:fixed;left:40px;top:40px;z-index:9999"><button type="button" id="fx-p">P</button><div id="fx-p-help" class="tooltip-popup"></div><div id="fx-q-help" class="tooltip-popup"></div></div>');
    hoverHelper(document.querySelector("#fx-q-help"), {
      trigger: (node) => node.closest(".tooltip-close"),
      render: (trigger, box) => new Promise((resolve) => setTimeout(() => { box.textContent = "Close this panel."; resolve(); }, 100)),
    });
    hoverHelper(document.querySelector("#fx-p-help"), {
      trigger: (node) => node.closest("#fx-p"),
      render: (trigger, box) => { box.textContent = ${LONG}; },
    });`);
  const p = page.locator("#fx-p-help");
  await page.locator("#fx-p").click();
  await expect(p).toHaveAttribute("data-pinned", "");
  await p.getByRole("button", { name: "Close" }).click();
  await expect(p).toBeHidden();
  await expect(page.locator("#fx-p")).toBeFocused();
});

test("R3: focus leaving for the page abandons a pending activation; a trigger with no tab stop still pins", verification({ component: "tooltip", category: "keyboard", states: [], variants: [], note: "Fixture with a held long-content renderer: a click on a button trigger, then blur() to the page before the content arrives, must not pin or take focus. A click on a trigger with no tab stop (focus on the page throughout) must still pin once the content arrives. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer on desktop");
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  await fixtureHelper(page, `
    document.body.insertAdjacentHTML("afterbegin", '<div id="fx" style="position:fixed;left:40px;top:40px;z-index:9999"><button type="button" id="fx-a">A</button> <span id="fx-plain">Plain</span><div id="fx-help" class="tooltip-popup"></div></div>');
    window.__fx = { release: [] };
    hoverHelper(document.querySelector("#fx-help"), {
      trigger: (node) => node.closest("#fx-a, #fx-plain"),
      render: (trigger, box) => new Promise((resolve) => window.__fx.release.push(() => { box.textContent = ${LONG}; resolve(); })),
    });`);
  const helper = page.locator("#fx-help");
  const releaseAll = async () => { await page.evaluate(() => { for (const release of window.__fx.release.splice(0)) release(); }); await page.waitForTimeout(100); };
  await page.locator("#fx-a").click();
  await page.locator("#fx-a").evaluate((el) => el.blur());
  await releaseAll();
  await expect(helper).not.toHaveAttribute("data-pinned");
  await expect(helper).toBeHidden();
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  await page.locator("#fx-plain").click();
  await releaseAll();
  await expect(helper).toHaveAttribute("data-pinned", "");
  await expect(helper).toBeFocused();
});

test("R4: returning to a trigger whose render is queued renders it once", verification({ component: "tooltip", category: "enhancements", states: [], variants: [], note: "Fixture with held renders and openDelay 0: the pointer passes over A, B, C and back to B while A still renders. Once released, B's renderer must have run once and C's never, and B's helper shows. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "pointer on desktop");
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  await fixtureHelper(page, `
    document.body.insertAdjacentHTML("afterbegin", '<div id="fx" style="position:fixed;left:40px;top:40px;z-index:9999"><button type="button" id="fx-a">A</button><button type="button" id="fx-b">B</button><button type="button" id="fx-c">C</button><div id="fx-help" class="tooltip-popup"></div></div>');
    window.__fx = { calls: [], count: { "fx-a": 0, "fx-b": 0, "fx-c": 0 } };
    hoverHelper(document.querySelector("#fx-help"), {
      trigger: (node) => node.closest("#fx-a, #fx-b, #fx-c"),
      openDelay: 0,
      render: (trigger, box) => {
        window.__fx.count[trigger.id]++;
        return new Promise((resolve) => window.__fx.calls.push(() => { box.textContent = trigger.id + " content."; resolve(); }));
      },
    });`);
  for (const id of ["#fx-a", "#fx-b", "#fx-c", "#fx-b"]) {
    const b = await box(page.locator(id));
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  }
  for (let i = 0; i < 6; i++) { await page.evaluate(() => window.__fx.calls.pop()?.()); await page.waitForTimeout(60); }
  await expect(page.locator("#fx-help")).toHaveText("fx-b content.");
  expect(await page.evaluate(() => window.__fx.count)).toEqual({ "fx-a": 1, "fx-b": 1, "fx-c": 0 });
});

test("R5: with default options, Enter on a custom trigger while content loads pins an overflowing helper or replays for a short one", verification({ component: "tooltip", category: "keyboard", states: ["focus-visible"], variants: [], note: "Fixture with default options (pin auto) and a held renderer: Enter on a focusable span with its own Enter handler while the content loads. Long content must pin it without running the handler; short content must run the handler once and not pin. Automated Chromium only." }), async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "keyboard on desktop");
  await page.goto("components/tooltip/", { waitUntil: "networkidle" });
  await fixtureHelper(page, `
    document.body.insertAdjacentHTML("afterbegin", '<div id="fx" style="position:fixed;left:40px;top:40px;z-index:9999"><span id="fx-custom" tabindex="0">Custom</span><div id="fx-help" class="tooltip-popup"></div></div>');
    window.__fx = { pending: [], enter: 0 };
    document.querySelector("#fx-custom").addEventListener("keydown", (event) => { if (event.key === "Enter") window.__fx.enter++; });
    hoverHelper(document.querySelector("#fx-help"), {
      trigger: (node) => node.closest("#fx-custom"),
      render: (trigger, box) => new Promise((resolve) => window.__fx.pending.push((long) => { box.textContent = long ? ${LONG} : "Short."; resolve(); })),
    });`);
  const helper = page.locator("#fx-help"), custom = page.locator("#fx-custom");
  const enter = () => page.evaluate(() => window.__fx.enter);
  /* Overflowing: Enter pins it and the trigger's own handler does not run. */
  await custom.focus();
  await expect.poll(() => page.evaluate(() => window.__fx.pending.length)).toBe(1);
  await page.keyboard.press("Enter");
  expect(await enter()).toBe(0);
  await page.evaluate(() => window.__fx.pending.pop()(true));
  await expect(helper).toHaveAttribute("data-pinned", "");
  await expect(helper).toBeFocused();
  expect(await enter()).toBe(0);
  await page.keyboard.press("Escape");
  await expect(helper).toBeHidden();
  await expect(custom).toBeFocused();
  /* Short: Enter is replayed to the trigger once, and nothing pins. */
  await custom.evaluate((el) => el.blur());
  await custom.focus();
  await expect.poll(() => page.evaluate(() => window.__fx.pending.length)).toBe(1);
  await page.keyboard.press("Enter");
  await page.evaluate(() => window.__fx.pending.pop()(false));
  await expect.poll(enter).toBe(1);
  await expect(helper).not.toHaveAttribute("data-pinned");
});
