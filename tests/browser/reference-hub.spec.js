import { test, expect } from "./evidence-fixture.mjs";
import { verification } from "./verification.mjs";
const scope = verification({ component: "page", category: "enhancements", states: [], variants: [], note: "Static hub/detail navigation, legacy anchors, search/family intersection, request retry and native keyboard token information. Automated Chromium only; no manual accessibility claim." });

test("legacy component heading links are static and jump to their detail with scripts", scope, async ({ page }, info) => {
  const hash = "c-button--keyboard";
  await page.goto(`reference/#${hash}`, { waitUntil: "networkidle" });
  if (info.project.name === "nojs") {
    await expect(page.locator(`#${hash}`)).toHaveAttribute("href", `/theme/components/button/#${hash}`);
    await page.locator(`#${hash}`).click();
  }
  await expect(page).toHaveURL(new RegExp(`/components/button/#${hash}$`));
  await expect(page.locator(`#${hash}`)).toBeVisible();
  await expect(page.locator(".matrix")).toHaveCount(1);
});

test("family and text filters compose on both stubs and contents (R-e)", scope, async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "One enhancement check.");
  await page.goto("reference/");
  await page.locator("#search").fill("textbox");
  await expect(page.locator("#search-count")).toContainText("1 component");
  const button = page.locator('[data-toc-component="button"]').locator("..");
  await expect(button).toBeHidden();
  await page.locator('#family-filter input[value="actions"]').uncheck();
  await expect(button).toBeHidden();
  await expect(page.locator('[data-toc-component="text-field"]').locator("..")).toBeVisible();
  await page.locator('#family-filter input[value="forms-basic"]').uncheck();
  await expect(page.locator("#search-count")).toContainText("0 components");
  await page.locator("#search").fill("");
  await expect(page.locator('[data-toc-component="text-field"]').locator("..")).toBeHidden();
  await page.locator('#family-filter input[value="forms-basic"]').check();
  await expect(page.locator('[data-toc-component="text-field"]').locator("..")).toBeVisible();
});

test("search retries an HTTP failure and shares its successful request with commands (R-f)", scope, async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "One network lifecycle check.");
  let attempts = 0;
  await page.route("**/theme/search.json", async (route) => {
    attempts++;
    if (attempts === 1) await route.fulfill({ status: 503, body: "Unavailable" });
    else await route.continue();
  });
  await page.goto("reference/");
  await page.locator("#search").focus();
  await expect(page.locator("#search-count")).toContainText("unavailable");
  await page.locator("#search").fill("textbox");
  await expect(page.locator("#search-count")).toContainText("1 component");
  await page.getByRole("button", { name: "Search the design system", exact: true }).click();
  await page.locator('.site-command [role="combobox"]').fill("text field");
  await expect(page.locator('.site-command').getByRole('option')).toHaveCount(1);
  expect(attempts).toBe(2);
});

test("inspector data is lazy and token information is keyboard reachable without prose stops (R-i)", scope, async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "One keyboard/data lifecycle check.");
  let requests = 0;
  page.on("request", (request) => { if (request.url().endsWith("tokens/inspector.json")) requests++; });
  await page.goto("reference/", { waitUntil: "networkidle" });
  expect(requests).toBe(0);
  await expect(page.locator("#j3w1-tokens")).toHaveCount(0);
  await expect(page.locator(".spec-body code[data-token][tabindex], .doc code[data-token][tabindex]")).toHaveCount(0);
  const link = page.locator('a[data-token="color.interaction.focus.ring"]').first();
  await link.focus();
  await expect(link).toBeFocused();
  await expect(page.locator("#inspector")).toBeVisible();
  await expect(page.locator("#inspector")).toContainText("--color-interaction-focus-ring");
  expect(requests).toBe(1);
  await page.keyboard.press("Escape");
  await expect(page.locator("#inspector")).toBeHidden();
});

test("matrix forcing stays scoped and chrome stays compact when specimens change", scope, async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "One style isolation check.");
  await page.goto("components/button/");
  const hover = page.locator('#button-states [data-state="hover"] .button').first();
  const live = page.locator("j3w1-button .button").first();
  await expect(hover).not.toHaveCSS("background-color", await live.evaluate((el) => getComputedStyle(el).backgroundColor));
  await page.locator('#controls .j3w1-choice-trigger').first().click();
  await page.locator('#controls [data-choice-value="comfortable"]').first().click();
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
  await expect(page.locator("#button-states")).toHaveAttribute("data-density", "comfortable");
});

test("code-editor package and matrix render the same decorative whitespace glyphs", scope, async ({ page }) => {
  await page.goto("components/code-editor/");
  const shape = (locator) => locator.evaluate((el) => {
    const style = getComputedStyle(el, "::before"), rect = el.getBoundingClientRect();
    return { glyphs: style.content, color: style.color, width: rect.width, height: rect.height, text: el.textContent };
  });
  const live = page.locator("j3w1-code-editor .code-editor-ws").first();
  const matrix = page.locator('#code-editor-states [data-state="default"] .code-editor-ws').first();
  const specimen = await shape(live);
  expect(specimen.text).toBe("");
  expect(specimen.glyphs).toBe('"··"');
  expect(specimen.width).toBeGreaterThan(0);
  expect(await shape(matrix)).toEqual(specimen);
});

test("composed matrices keep their raw demo's nested wizard styles", scope, async ({ page }) => {
  await page.goto("components/admin-form/");
  const step = page.locator('#admin-form-states [data-state="default"] .wizard-step-button').first();
  await expect(step).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(step).toHaveCSS("border-bottom-width", "2px");
});
