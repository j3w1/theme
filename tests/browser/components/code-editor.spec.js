import { test, expect } from "../evidence-fixture.mjs";
import { verification } from "../verification.mjs";

test("code-editor package and matrix render the same decorative whitespace glyphs", verification({ component: "code-editor", category: "rendering", states: ["default"], variants: ["default"], note: "Exact CSS-generated glyphs, colour and geometry in the default package example and default matrix cell; no editor behavior or other state claim." }), async ({ page }) => {
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
