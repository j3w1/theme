import { test, expect } from "../browser/evidence-fixture.mjs";
import { promises as fs } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
const ids = ["current", "conservative", "balanced", "maximum-legibility"];
const annotation = (category, states, note) => ({ annotation: { type: "verification", description: JSON.stringify({ component: "visual-review", category, states, variants: ids, note }) } });

test("local Vue frames synchronize actual filters and maintain equal specimen identities", annotation("enhancements", ["default", "filled"], "Local candidate preview, not package conformance."), async ({ page }) => {
  await page.goto("/review/compare/");
  await expect(page.locator("iframe")).toHaveCount(4);
  const frames = ids.map(id => page.frameLocator(`iframe[src*="/${id}/"]`));
  await frames[0].getByLabel("Search records").fill("Atlas");
  for (const frame of frames) { await expect(frame.getByLabel("Search records")).toHaveValue("Atlas"); await expect(frame.locator("tbody tr")).toHaveCount(1); }
  const digests = await Promise.all(page.frames().slice(1).map(f => f.locator("#review-data").textContent().then(s => JSON.parse(s).specimenDigest)));
  expect(new Set(digests).size).toBe(1);
  await page.getByRole("button", { name: "Reset all views" }).click();
  for (const frame of frames) await expect(frame.locator("tbody tr")).toHaveCount(5);
});

test("launcher keyboard filtering, token swatch, empty results and focus return", annotation("keyboard", ["open", "no-results", "closed"], "Native dialog and preview combobox; no manual screen-reader claim."), async ({ page }) => {
  await page.goto("/review/balanced/");
  const trigger = page.getByRole("button", { name: /Search commands/ });
  await trigger.click();
  const query = page.getByRole("combobox", { name: "j3w1:" });
  await expect(query).toBeFocused();
  await query.fill("tokens");
  await expect(page.locator("#command-results .hex-swatch")).toHaveCount(1);
  await query.fill("no-such-command");
  await expect(page.getByText("No matching commands.")).toBeVisible();
  await query.fill("agents");
  await query.press("Enter");
  await expect(page.getByRole("heading", { name: "From contract to application." })).toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await query.press("Escape");
  await expect(trigger).toBeFocused();
});

test("invalid form preserves input and recovers through local save", annotation("enhancements", ["invalid", "filled"], "Synthetic in-memory validation, no service or package claim."), async ({ page }) => {
  await page.goto("/review/balanced/?scene=settings");
  await page.getByLabel("Workspace name").fill("");
  await page.getByRole("button", { name: "Save preview" }).click();
  await expect(page.getByLabel("Workspace name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Contact email")).toHaveValue("operator@example.test");
  await page.getByLabel("Workspace name").fill("Recovered workspace");
  await page.getByRole("button", { name: "Save preview" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Preview saved in memory" })).toBeVisible();
});

test("matched desktop/mobile/RTL captures and accessibility checks for every candidate", annotation("appearance", ["default"], "Fixed Chromium, synthetic content and local font fallback. Reflow is measured at CSS widths; no physical-device or manual zoom claim."), async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  for (const id of ids) {
    for (const [width, direction] of [[1280, "ltr"], [640, "ltr"], [360, "rtl"]]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/review/${id}/?embedded=1&dir=${direction}`);
      await expect(page.locator(".stats-grid")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", direction);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator("tbody td").first().evaluate(el => el.clientWidth)).toBeGreaterThan(150);
      await page.screenshot({ path: `.cache/phase6a/evidence/${id}-${width}-${direction}.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`/review/${id}/?embedded=1`);
    const result = await new AxeBuilder({ page }).include(".workspace").analyze();
    await testInfo.attach(`${id}-axe`, { body: JSON.stringify(result), contentType: "application/json" });
    expect(result.violations.map(v => [v.id, v.nodes.map(n => n.target)])).toEqual([]);
    for (const scene of ["settings", "components", "developer", "consume"]) {
      await page.goto(`/review/${id}/?embedded=1&scene=${scene}`);
      await expect(page.locator(".workspace")).toBeVisible();
      await page.screenshot({ path: `.cache/phase6a/evidence/${id}-${scene}.png`, fullPage: true });
    }
    await page.getByRole("button", { name: /Search commands/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.screenshot({ path: `.cache/phase6a/evidence/${id}-launcher.png` });
    const session = await page.context().newCDPSession(page);
    await session.send("DOM.enable"); await session.send("CSS.enable");
    const { root } = await session.send("DOM.getDocument");
    const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector: ".page-heading h1" });
    const fonts = await session.send("CSS.getPlatformFontsForNode", { nodeId });
    await testInfo.attach(`${id}-actual-heading-fonts`, { body: JSON.stringify(fonts), contentType: "application/json" });
    await session.detach();
  }
  expect(errors).toEqual([]);
});

test("static board, local report, forced colors and reduced motion stay separate", annotation("rendering", ["default", "reduced-motion"], "Static presence and media-mode resilience only; board states are forced, not behavior passes."), async ({ page, browser }) => {
  const report = await (await page.request.get("/review/report/report.json")).json();
  expect(report.candidates.map(c => c.failures.length)).toEqual([0,0,0,0]);
  expect(report.ownerSelection).toBeNull();
  await fs.writeFile(".cache/phase6a/evidence/subject.json", JSON.stringify({ baselineDigest: report.baselineDigest, specimenDigest: report.specimenDigest, overlays: report.candidates.map(c => c.overlayDigest) }, null, 2));
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto("http://127.0.0.1:" + (process.env.REVIEW_PORT ?? 4322) + "/review/balanced/components/");
  await expect(staticPage.locator(".review-component")).toHaveCount(48);
  await expect(staticPage.locator("#c-form-builder")).toBeVisible();
  await context.close();
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto("/review/balanced/");
  await page.getByRole("button", { name: /Search commands/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: ".cache/phase6a/evidence/forced-colors.png" });
  await page.getByRole("combobox", { name: "j3w1:" }).press("Escape");
});
