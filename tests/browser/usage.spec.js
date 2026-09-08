import { chooseOptions } from "../ui/choice-helper.mjs";
import { test, expect } from "./evidence-fixture.mjs";
import AxeBuilder from "@axe-core/playwright";
import usage from "../../exports/token-usage.json" with { type: "json" };
const annotation = { type: "verification", description: JSON.stringify({ component: "page", category: "enhancements", states: [], variants: [], note: "Semantic usage filters, persistent static details, clipboard and reflow on the token tool pages." }) };

test("usage filters require a documented match and preserve profile restrictions", { annotation }, async ({ page }, testInfo) => {
  await page.goto("tokens/", { waitUntil: "networkidle" });
  if (testInfo.project.name === "nojs") {
    await expect(page.locator("#usage-filters")).toBeHidden();
    await expect(page.locator("[data-usage-profile]:visible")).toHaveCount(3);
    await expect(page.locator('[data-usage-profile="extended"]')).toContainText("blocked");
  } else {
    await chooseOptions(page.getByLabel("component", { exact: true }), "text-field");
    await chooseOptions(page.getByLabel("state", { exact: true }), "default");
    await chooseOptions(page.getByLabel("part", { exact: true }), "border");
    const rows = page.locator("[data-usage-path]:visible");
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText("color.border.control");
    await expect(rows).toContainText("use-and-report");
    if (["desktop", "narrow"].includes(testInfo.project.name)) await page.screenshot({ path: `.cache/usage-filtered-${testInfo.project.name}.png`, fullPage: true });
    await chooseOptions(page.getByLabel("Profile", { exact: true }), "extended");
    await page.getByLabel("Permitted roles only").check();
    await expect(page.locator("#usage-empty")).toBeVisible();
    await expect(rows).toHaveCount(0);
    await page.getByRole("button", { name: "Reset filters" }).click();
    await expect(rows).toHaveCount(Object.keys(usage.profiles.default.tokens).length);
    await chooseOptions(page.getByLabel("Profile", { exact: true }), "heritage-ansi");
    await chooseOptions(page.getByLabel("status", { exact: true }), "heritage");
    await expect(rows.first()).toContainText("heritage");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("usage index controls and default results have no automated accessibility violations", { annotation: { type: "verification", description: JSON.stringify({ component: "page", category: "axe", states: [], variants: [], note: "Token usage index controls and default-profile result table; a scan is not a conformance claim." }) } }, async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one index scan is enough");
  test.setTimeout(600_000);
  await page.goto("tokens/", { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

test("token details are persistent, source-linked and readable without scripts", { annotation }, async ({ page }, testInfo) => {
  await page.goto("tokens/color.border.control/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("color.border.control");
  await expect(page.locator(".usage-section")).toHaveCount(3);
  await expect(page.locator("#tp-default-color-border-control")).toContainText("D-007");
  await expect(page.locator("#tp-default-color-border-control")).toContainText("root.border");
  await expect(page.locator("#tp-extended-color-border-control")).toContainText("blocked");
  await expect(page.locator(".hex-swatch").first()).toBeVisible();
  const source = page.locator('.usage-source a[href*="spec/components/text-field.md"]').first();
  if (await source.count()) await expect(source).toHaveAttribute("href", /\/blob\/[a-f0-9]{40}\/spec\/components\/text-field\.md#L\d+$/);
  else await expect(page.locator("header .stamp")).toContainText("Local build");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  if (testInfo.project.name === "desktop") {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: "Copy CSS variable color.border.control" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("--color-border-control");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(axe.violations.map((v) => v.id)).toEqual([]);
  }
  await page.goto("tokens/color.interaction.selection.inactive-text/", { waitUntil: "networkidle" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
