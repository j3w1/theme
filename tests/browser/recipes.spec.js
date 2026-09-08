import { test, expect } from "./evidence-fixture.mjs";
import AxeBuilder from "@axe-core/playwright";
const annotation = { type: "verification", description: JSON.stringify({ component: "page", category: "enhancements", states: [], variants: [], note: "Standalone recipes: source copying, native controls, two instances, scoped styles and canonical default appearance. Dialog modal behavior is not supplied or claimed." }) };
const selectors = { button: [".button", ".button-icon"], "text-field": [".text-field", ".text-field-label", ".text-field-root", ".text-field-input", ".text-field-help"], dialog: [".dialog", ".dialog-title", ".dialog-text", ".dialog-close", ".dialog-button"] };
const appearance = (locator) => locator.evaluate((el) => {
  const s = getComputedStyle(el);
  return Object.fromEntries(["backgroundColor", "color", "borderTopColor", "borderTopWidth", "borderRadius", "fontFamily", "fontSize", "fontWeight", "lineHeight", "minHeight", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "gap", "boxSizing"].map((key) => [key, s[key]]));
});

test("standalone recipes match canonical defaults and stay inside their style scope", { annotation }, async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Canonical computed-style comparison uses one identical browser configuration.");
  await page.goto("reference/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.documentElement.dataset.density = "comfortable");
  const canonical = {};
  for (const [id, parts] of Object.entries(selectors)) {
    canonical[id] = {};
    for (const part of parts) canonical[id][part] = await appearance(page.locator(`#${id}-states [data-state="default"]`).first().locator(part).first());
  }
  for (const [id, parts] of Object.entries(selectors)) {
    await page.goto(`exports/recipes/${id}/two-instances.html`);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("16px");
    for (const part of parts) expect(await appearance(page.locator(".j3w1-recipe").first().locator(part).first()), `${id} ${part}`).toEqual(canonical[id][part]);
    expect(await page.evaluate(() => {
      const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
      return ids.length === new Set(ids).size && [...document.querySelectorAll("[aria-labelledby], [aria-describedby], label[for]")].every((e) => ["aria-labelledby", "aria-describedby", "for"].every((attr) => !e.hasAttribute(attr) || e.getAttribute(attr).split(/\s+/).every((id) => e.closest(".j3w1-recipe").contains(document.getElementById(id)))));
    })).toBe(true);
    expect(await page.evaluate(() => {
      const host = document.createElement("button"); host.className = "button"; host.textContent = "Host button"; document.body.append(host);
      const properties = ["backgroundColor", "color", "fontSize", "borderRadius", "padding", "minHeight"];
      const withRecipe = properties.map((p) => getComputedStyle(host)[p]);
      document.querySelector("style").remove();
      return JSON.stringify(withRecipe) === JSON.stringify(properties.map((p) => getComputedStyle(host)[p]));
    })).toBe(true);
  }
});

test("recipes work outside Astro with independent native fields and visible no-JS downloads", { annotation }, async ({ page }, testInfo) => {
  for (const id of Object.keys(selectors)) {
    await page.goto(`recipes/${id}/`, { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: "Download standalone HTML", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "component.css", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    if (testInfo.project.name === "nojs") await expect(page.locator("[data-recipe-copy]")).toBeHidden();
    if (id === "dialog") await expect(page.locator("main")).toContainText("Visual-only");
    await page.goto(`exports/recipes/${id}/two-instances.html`);
    await expect(page.locator(".j3w1-recipe")).toHaveCount(2);
    await expect(page.locator(".hex-swatch, [data-state]")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    if (id === "text-field") {
      const first = page.getByLabel("Display name", { exact: false }).first();
      await first.fill("Independent first instance");
      await expect(page.locator("input").nth(1)).toHaveValue("j3w1");
      await page.locator("label").nth(1).click();
      await expect(page.locator("input").nth(1)).toBeFocused();
    }
  }
});

test("recipe clipboard preserves clean source, unique prefixes and attribution", { annotation }, async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Clipboard and source-view axe scan use one enabled desktop context.");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    const write = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = (text) => { window.__recipeClipboardText = text; return write(text); };
  });
  await page.goto("recipes/text-field/", { waitUntil: "networkidle" });
  await page.getByLabel("Unique instance prefix").fill("settings-first");
  await page.getByRole("button", { name: "Copy instance markup" }).click();
  await expect(page.locator("[data-recipe-status]")).toContainText("Copied instance settings-first");
  const first = await page.evaluate(() => navigator.clipboard.readText());
  expect(first).toContain('for="settings-first-recipe-tf-name"');
  expect(first).toContain("CC BY 4.0");
  expect(first).not.toMatch(/hex-swatch|data-state|data-token/);
  await page.getByLabel("Unique instance prefix").fill("settings-second");
  await page.getByRole("button", { name: "Copy instance markup" }).click();
  await expect(page.locator("[data-recipe-status]")).toContainText("Copied instance settings-second");
  expect(await page.evaluate(() => navigator.clipboard.readText())).not.toContain("settings-first");
  const raw = await (await page.request.get("exports/recipes/text-field/tokens.css")).text();
  await page.getByRole("button", { name: "Copy tokens.css", exact: true }).click();
  await expect(page.getByRole("button", { name: "copied", exact: true })).toBeVisible();
  // The API receives exact LF export bytes. Windows converts clipboard text
  // to CRLF on readback; verify that native transport separately.
  expect(await page.evaluate(() => window.__recipeClipboardText)).toBe(raw);
  const nativeText = process.platform === "win32" ? raw.replaceAll("\n", "\r\n") : raw;
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(nativeText);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});
