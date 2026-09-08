import { test, expect } from "../browser/evidence-fixture.mjs";
import AxeBuilder from "@axe-core/playwright";
const annotation = { type: "verification", description: JSON.stringify({ component: "page", category: "enhancements", states: ["default"], variants: [], note: "Instantiates every maintained package variant in an isolated packed consumer. Checks registration and uncaught runtime errors; does not assert every interaction, state or accessibility requirement." }) };
test("every packed component variant connects without runtime errors", { annotation }, async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/gallery/");
  await expect(page.locator(".gallery-card").first()).toBeVisible();
  const result = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".gallery-card")];
    return { ids: [...new Set(cards.map(card => card.dataset.component))], failures: cards.filter(card => card.querySelector(`j3w1-${card.dataset.component}`)?.dataset.j3w1Component !== card.dataset.component).map(card => `${card.dataset.component}/${card.dataset.variant}`) };
  });
  expect(result.ids).toHaveLength(67);
  expect(result.failures).toEqual([]);
  expect(errors).toEqual([]);
});

test("copied basic controls and overlapping composition dependencies work without workspace imports", { annotation }, async ({ page }) => {
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/basic/");await expect(page.locator("j3w1-button")).toHaveAttribute("data-j3w1-component","button");
  await page.goto("/kit/");await expect(page.locator("j3w1-admin-form")).toHaveAttribute("data-j3w1-component","admin-form");
  await expect(page.locator("j3w1-text-field").first()).toHaveAttribute("data-j3w1-component","text-field");
  const field=page.locator(`#${await page.locator("j3w1-text-field").first().getAttribute("id")}`);
  await field.evaluate(host=>{host.setAttribute("value","Default");host.value="User edit";const parent=host.parentNode;host.remove();parent.append(host);});
  await expect(field.locator("input")).toHaveValue("User edit");
  await field.evaluate(host=>{host.refresh();});await expect(field.locator("input")).toHaveValue("User edit");
  expect(errors).toEqual([]);
});

test("packed variants meet the automated accessibility scan and reflow at narrow width", { annotation: { type: "verification", description: JSON.stringify({ component: "page", category: "enhancements", states: ["default"], variants: [], note: "All maintained packed variants: axe WCAG A/AA, 320px reflow, forced-colors and reduced-motion rendering. The existing code-editor decorative whitespace waiver excludes only aria-hidden whitespace glyphs from text contrast; real code text remains scanned. No manual screen-reader claim." }) } }, async ({ page }) => {
  await page.goto("/gallery/");await expect(page.locator(".gallery-card").last()).toBeVisible();
  // Canonical code-editor contrast[] explicitly waives these duplicated,
  // aria-hidden whitespace glyphs as decorative. No content is excluded.
  expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).exclude('.code-editor-ws[aria-hidden="true"]').analyze()).violations).toEqual([]);
  await page.setViewportSize({width:320,height:740});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.emulateMedia({forcedColors:"active",reducedMotion:"reduce"});
  await expect(page.locator(".gallery-card").first()).toBeVisible();
});

test("a copied dialog retains native modal focus and keyboard return", { annotation: { type: "verification", description: JSON.stringify({ component: "dialog", category: "keyboard", states: ["default", "open", "closed", "focus-trapped"], variants: ["default"], note: "Installed CLI copy with no workspace runtime access; real opener, keyboard Escape and focus return. Native form validation is covered separately by packed form fixtures." }) } }, async ({ page }) => {
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/copy/");
  const opener = page.getByRole("button", { name: "Open dialog", exact: true });
  await opener.click();
  await expect(page.locator("dialog")).toBeVisible();
  expect(await page.locator("dialog").evaluate(dialog => dialog.matches(":modal"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(opener).toBeFocused();
  expect(errors).toEqual([]);
});
