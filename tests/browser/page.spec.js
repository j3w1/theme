import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { promises as fs } from "node:fs";
import { openSpec, only, rgbToHex } from "./helpers.mjs";

const resolved = JSON.parse(await fs.readFile(new URL("../../exports/tokens.resolved.json", import.meta.url), "utf8"));
const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;

test.describe("the specification page", () => {
  test("loads under /theme/ with no errors, no requests outside the base, and the theme applied", async ({ page }, testInfo) => {
    const spec = await openSpec(page);
    await expect(page).toHaveTitle(/j3w1 UI Theme Spec/);
    const bg = rgbToHex(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
    expect(bg).toBe(token("color.surface.canvas"));
    const fg = rgbToHex(await page.evaluate(() => getComputedStyle(document.body).color));
    expect(fg).toBe(token("color.text.default"));
    const radius = await page.evaluate(() => getComputedStyle(document.querySelector(".banner")).borderRadius);
    expect(radius).toBe("0px");
    spec.assertClean();
    if (only(testInfo, "nojs")) {
      await expect(page.locator("#controls")).toBeHidden();
      await expect(page.locator("#d-identity")).toBeVisible();
      await expect(page.locator("#d-foundations")).toBeVisible();
      await expect(page.locator("#contrast-report")).toBeVisible();
      await expect(page.locator("#for-agents")).toBeVisible();
    }
  });

  test("keyboard: the skip link, contents and controls are reachable and focus is visibly dashed", async ({ page }, testInfo) => {
    test.skip(only(testInfo, "nojs"), "controls need scripts");
    await openSpec(page);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    const ring = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement);
      return { style: s.outlineStyle, color: s.outlineColor, width: s.outlineWidth };
    });
    expect(ring.style).toBe("dashed");
    expect(rgbToHex(ring.color)).toBe(token("color.interaction.focus.ring"));
    expect(ring.width).toBe("1px");
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeInViewport();
    await page.locator("#search").focus();
    await expect(page.locator("#search")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator('#family-filter input[name="family"]').first()).toBeFocused();
  });

  test("axe finds no WCAG 2.x A/AA violations (a scan, not a conformance claim)", async ({ page }, testInfo) => {
    test.skip(!only(testInfo, "desktop"), "one scan is enough");
    test.setTimeout(600_000);
    await openSpec(page);
    /* Non-default matrix cells are aria-hidden inert clones of the default
       cell; scanning every one of them multiplies the run time by the number
       of states without adding findings. The live cells are scanned. */
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).exclude('.matrix [aria-hidden="true"]').analyze();
    await fs.mkdir("test-results", { recursive: true });
    await fs.writeFile("test-results/axe.json", JSON.stringify(results, null, 2));
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
  });

  test("reflow: no horizontal page scroll at 360px and at 200% text zoom", async ({ page }, testInfo) => {
    test.skip(!only(testInfo, "narrow", "zoom200"), "reflow projects only");
    await openSpec(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await page.waitForTimeout(50);
    const zoomed = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(zoomed).toBeLessThanOrEqual(0);
  });

  test("reduced motion: every transition and animation is effectively instant", async ({ page }, testInfo) => {
    test.skip(!only(testInfo, "desktop"), "one check is enough");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openSpec(page);
    const slow = await page.evaluate(() =>
      [...document.querySelectorAll("main *")]
        .map((el) => getComputedStyle(el))
        .filter((s) => s.transitionDuration.split(",").some((d) => parseFloat(d) > 0.01) || s.animationDuration.split(",").some((d) => parseFloat(d) > 0.01))
        .length,
    );
    expect(slow).toBe(0);
  });

  test("enhancements: search narrows the contents, family filter hides sections, density and profile persist, reset clears", async ({ page }, testInfo) => {
    test.skip(!only(testInfo, "desktop"), "scripts on desktop");
    const context = page.context();
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openSpec(page);
    await page.locator("#density").selectOption("compact");
    await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
    await page.locator("#profile").selectOption("heritage-ansi");
    await expect(page.locator(".ladder").first()).toHaveAttribute("data-profile", "heritage-ansi");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys.every((k) => k.startsWith("j3w1-theme:"))).toBe(true);
    await page.locator("#search").fill("focus ring");
    await expect(page.locator("#search-count")).not.toHaveText("");
    expect(new URL(page.url()).searchParams.get("q")).toBe("focus ring");
    const firstFamily = page.locator('#family-filter input[name="family"]').first();
    await firstFamily.uncheck();
    expect(new URL(page.url()).searchParams.get("family")).not.toBeNull();
    await page.locator("#reset").click();
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("j3w1-theme:")))).toEqual([]);
    expect(new URL(page.url()).search).toBe("");
    await expect(page.locator("html")).toHaveAttribute("data-density", "comfortable");
    await expect(firstFamily).toBeChecked();
    const copy = page.locator("button[data-copy]").first();
    await copy.click();
    await expect(copy).toHaveAttribute("data-copied", "true");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^#[0-9a-f]{6}$|^\d|^"/);
  });

  test("inspector: hovering a token reference shows its resolved value and profile values", async ({ page }, testInfo) => {
    test.skip(!only(testInfo, "desktop"), "scripts on desktop");
    await openSpec(page);
    const ref = page.locator('[data-token="color.interaction.focus.ring"]').first();
    await ref.scrollIntoViewIfNeeded();
    await ref.hover();
    const box = page.locator("#inspector");
    await expect(box).toBeVisible();
    await expect(box).toContainText(token("color.interaction.focus.ring"));
    await expect(box).toContainText("--color-interaction-focus-ring");
    await page.keyboard.press("Escape");
    await expect(box).toBeHidden();
  });

  test("print: controls and the sticky contents are hidden, link URLs are printed", async ({ page }, testInfo) => {
    test.skip(!only(testInfo, "desktop"), "one check is enough");
    await openSpec(page);
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("#controls")).toBeHidden();
    const position = await page.evaluate(() => getComputedStyle(document.getElementById("toc")).position);
    expect(position).toBe("static");
    const after = await page.evaluate(() => getComputedStyle(document.querySelector('.site-footer a[href^="http"]'), "::after").content);
    expect(after).toContain("https://github.com/j3w1/theme");
  });
});
