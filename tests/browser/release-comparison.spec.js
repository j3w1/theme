import { chooseOptions } from "../ui/choice-helper.mjs";
import { test, expect } from "./evidence-fixture.mjs";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";

const annotation = (category, note) => ({ type: "verification", description: JSON.stringify({ component: "page", category, states: [], variants: [], note }) });
const pair = "releases/v0-1-0/workbench/default/";

test("release reports and historical links remain readable without JavaScript and without page overflow", { annotation: annotation("reflow", "Release picker/report static content and bounded frame scroll regions in each configured viewport; frames are reconstructed visual references, not historical JavaScript or manual accessibility evidence.") }, async ({ page }) => {
  await page.goto(pair);
  await expect(page.getByRole("heading", { name: "Semantic changes", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Expected migration verification" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Download JSON report" })).toHaveAttribute("href", "comparison.json");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByText("no registered ports", { exact: true })).toBeVisible();
  const component = page.locator('[data-release-component="button"]');
  await expect(component.locator(".release-case-links a")).not.toHaveCount(0);
});

test("release picker and matched-state controls work with keyboard and preserve a 640 by 480 viewport", { annotation: annotation("keyboard", "Automated desktop keyboard selection, matched historical state controls, actual iframe viewport and axe checks of report/picker chrome; sandboxed historical fixtures have separate limitations and are not certified.") }, async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "One desktop enhanced-control protocol");
  await page.goto("releases/");
  await page.getByLabel("Before revision").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("After revision")).toBeFocused();
  await chooseOptions(page.getByLabel("After revision"), "workbench");
  await page.getByRole("button", { name: "Open comparison" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${pair}$`));
  const component = page.locator('[data-release-component="button"]');
  await component.scrollIntoViewIfNeeded();
  await component.getByLabel("Variant and visual state").focus();
  await chooseOptions(component.getByLabel("Variant and visual state"), "default/hover");
  for (const side of ["before", "after"]) {
    const frame = component.locator(`[data-release-side="${side}"]`);
    await expect(frame).toHaveAttribute("src", /button\/default\/hover\.html$/);
    await expect(frame.contentFrame().locator("[data-release-specimen]")).toHaveAttribute("data-state", "hover");
    expect(await frame.contentFrame().locator("html").evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual({ width: 640, height: 480 });
  }
  const scan = await new AxeBuilder({ page }).exclude("iframe").analyze();
  expect(scan.violations).toEqual([]);
});

test.describe("matched capture environment", () => {
test.use({ viewport: { width: 640, height: 480 }, javaScriptEnabled: false, reducedMotion: "reduce", locale: "en-US", deviceScaleFactor: 1 });
test("same-revision visual captures are identical under recorded matched conditions", { annotation: annotation("appearance", "Chromium desktop captures of seven default reconstructed specimens in two fresh pages at 640x480, comfortable, LTR, reduced motion, JavaScript disabled. Exact PNG-byte equality. Not other states/engines, physical fonts, historical scripts, or manual accessibility.") }, async ({ browser, context, page }, info) => {
  test.skip(info.project.name !== "desktop", "One explicitly matched capture environment");
  const response = await page.request.get("releases/specimens/workbench/default/index.json");
  const index = await response.json();
  const cases = index.cases.filter((row) => row.variant === "default" && row.state === "default");
  expect(cases).toHaveLength(7);
  const before = await context.newPage(), after = await context.newPage();
  const observations = [];
  try {
    for (const row of cases) {
      const url = new URL(`../specimens/workbench/default/${row.path}`, new URL("releases/workbench/", info.project.use.baseURL)).href;
      await before.goto(url); await after.goto(url);
      await before.evaluate(() => document.fonts.ready); await after.evaluate(() => document.fonts.ready);
      const a = await before.screenshot({ animations: "disabled" }), b = await after.screenshot({ animations: "disabled" });
      expect(a.equals(b), row.component).toBe(true);
      const environment = await before.locator("[data-release-specimen]").evaluate((el) => ({ fontFamily: getComputedStyle(el).fontFamily, viewport: { width: innerWidth, height: innerHeight }, density: document.documentElement.dataset.density, direction: document.documentElement.dir }));
      observations.push({ component: row.component, sourceRevision: index.revision, artifactDigest: row.artifactDigest, styleDigest: row.styleDigest, beforePngSha256: createHash("sha256").update(a).digest("hex"), afterPngSha256: createHash("sha256").update(b).digest("hex"), result: "identical", ...environment });
      await info.attach(`${row.component}-matched-capture`, { body: a, contentType: "image/png" });
    }
    await info.attach("release-capture-observations", { body: JSON.stringify({ browser: browser.version(), rendererVersion: 1, observations }, null, 2), contentType: "application/json" });
  } finally { await before.close(); await after.close(); }
});
});
