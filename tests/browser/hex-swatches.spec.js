import { test, expect } from "./evidence-fixture.mjs";
import { openSpec, only } from "./helpers.mjs";

test("hex previews preserve exact colors, copy text and the no-JS baseline", { annotation: { type: "verification", description: JSON.stringify({"component": "page", "category": "appearance", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }) => {
  await openSpec(page);
  const swatch = page.locator('.hex-swatch[data-hex="#ff0000"]').first();
  await expect(swatch).toHaveCount(1);
  const values = await swatch.evaluate((el) => {
    const style = getComputedStyle(el);
    return { width: style.width, height: style.height, radius: style.borderRadius, fill: getComputedStyle(el, "::after").backgroundColor, tab: el.getAttribute("tabindex"), hidden: el.getAttribute("aria-hidden") };
  });
  expect(values).toEqual({ width: "16px", height: "16px", radius: "50%", fill: "rgb(255, 0, 0)", tab: null, hidden: "true" });
  const literal = swatch.locator("..");
  expect(await literal.textContent()).toBe("#ff0000");
  expect(await literal.evaluate((el) => { const range = document.createRange(); range.selectNodeContents(el); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); return selection.toString(); })).toBe("#ff0000");
  const alpha = page.locator('.hex-swatch[data-hex="#ff000080"]').first();
  expect(await alpha.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("conic-gradient");
  const expectedAlpha = await page.evaluate(() => { const reference = document.createElement("span"); reference.style.backgroundColor = "#ff000080"; document.body.append(reference); const color = getComputedStyle(reference).backgroundColor; reference.remove(); return color; });
  expect(await alpha.evaluate((el) => getComputedStyle(el, "::after").backgroundColor)).toBe(expectedAlpha);
  for (const hex of ["#000000", "#ffffff"]) {
    const edge = page.locator(`.hex-swatch[data-hex="${hex}"]`).first();
    expect(await edge.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("1px");
  }
  expect(await page.locator(".hex-swatch[tabindex]").count()).toBe(0);
});

test("hover grows visually by 1.4px without reflow; reduced motion changes instantly", { annotation: { type: "verification", description: JSON.stringify({"component": "page", "category": "motion", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "one hover-capable layout");
  await openSpec(page);
  const swatch = page.locator('.hex-swatch[data-hex="#ff0000"]').first();
  await swatch.scrollIntoViewIfNeeded();
  const geometry = () => swatch.locator("..").evaluate((el) => { const { x, y, width, height } = el.getBoundingClientRect(); return { x, y, width, height }; });
  const before = await geometry();
  expect(await swatch.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0.08s, 0.08s");
  await swatch.hover();
  await expect(swatch).toHaveCSS("border-radius", "0px");
  await expect(swatch).toHaveCSS("transform", "matrix(1.0875, 0, 0, 1.0875, 0, 0)");
  expect(await swatch.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a * el.offsetWidth)).toBe(17.4);
  expect(await geometry()).toEqual(before);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await swatch.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
  await page.emulateMedia({ forcedColors: "active" });
  expect(await swatch.evaluate((el) => getComputedStyle(el).forcedColorAdjust)).toBe("none");
  await page.emulateMedia({ media: "print", forcedColors: "none" });
  expect(await swatch.evaluate((el) => getComputedStyle(el).printColorAdjust)).toBe("exact");
});

test("inspector uses generated previews and retains all token matches without new tab stops", { annotation: { type: "verification", description: JSON.stringify({"component": "page", "category": "enhancements", "states": [], "variants": [], "note": "Only the assertions in this named test; no comprehensive state or variant coverage claim. Profile and density record the initial configuration; any switches are described by the test."}) } }, async ({ page }, testInfo) => {
  test.skip(!only(testInfo, "desktop"), "one enhanced inspector");
  await openSpec(page);
  await page.locator('[data-token="color.interaction.focus.ring"]').first().focus();
  await expect(page.locator("#inspector .hex-swatch")).not.toHaveCount(0);
  expect(await page.locator("#inspector .hex-swatch[tabindex]").count()).toBe(0);
  await page.keyboard.press("Escape");
  const swatch = page.locator('.hex-swatch[data-hex="#e53935"][data-token-matches]').first();
  const matches = await swatch.evaluate((el) => JSON.parse(document.getElementById("j3w1-tokens").textContent).colorIndex[el.getAttribute("data-token-matches")]);
  expect(matches.length).toBeGreaterThan(1);
  await swatch.hover();
  await expect(page.locator("#inspector")).toContainText("equality does not assign a role");
  const items = page.locator("#inspector li");
  await expect(items).toHaveCount(matches.length);
  expect(await items.allTextContents()).toEqual(matches.map((match) => `${match.profile}: ${match.path}`));
});
