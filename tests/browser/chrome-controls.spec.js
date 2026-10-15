/* One control language in the site chrome (button.md; docs/ui-architecture.md,
   "Site chrome"). On one page of every SiteLayout template, every visible
   button outside specimens and live examples is a canonical .button with the
   canonical box at the default compact density (D-038), no <a> carries a
   button class, and the tools whose primary action used to lose its fill
   (R-b) show the filled primary. The source half is tests/chrome-controls.test.js. */

import { verification } from "./verification.mjs";
import { test, expect } from "./evidence-fixture.mjs";
import { openSpec, rgbToHex } from "./helpers.mjs";
import { readJson } from "../../scripts/lib/fs.mjs";

const { annotation } = verification({
  component: "page",
  category: "appearance",
  states: [],
  variants: [],
  note: "Site chrome on one page per SiteLayout template, desktop and narrow: visible buttons outside specimens, live examples, density-scoped previews and the choice renderer's own parts share the canonical compact .button box; no anchor carries a button class; /builder/ and /patterns/validation-recovery/ show the filled primary. Computed styles only; not a visual or manual review.",
});

const tokens = await readJson("exports/tokens.resolved.json");
const token = (path) => tokens.profiles[tokens.defaultProfile].tokens[path].css;
const releases = await readJson("site/releases.json");
const firstRelease = releases.revisions.map((pin) => pin.id).sort()[0];
const comparison = `${firstRelease}/${firstRelease}/${[...releases.profiles].sort()[0]}/`;

const routes = [
  "", "reference/", "reference/contrast/", "reference/decisions/", "reference/fixtures/", "ports/ghostty/", "foundations/", "components/", "components/button/", "components/dialog/", "components/form-builder/",
  "patterns/", "patterns/validation-recovery/", "tokens/", "tokens/color.action.primary.bg/", "tools/",
  "implement/", "agents/", "ports/", "releases/", `releases/${comparison}`, "recipes/",
  "recipes/button/", "kit/", "builder/", "workbench/", "workbench/button/", "report/", "figma/", "no-such-page/",
];

/* Specimens, live examples, previews with their own density, and the parts
   the choice and date renderers draw for a select or date input. */
const OUTSIDE_CHROME = "[data-specimen], .site-example, template, [inert], [data-density]:not(html), .j3w1-choice, .j3w1-temporal, .j3w1-calendar";

const survey = (page, outside) => page.evaluate((outside) => {
  const box = (el) => {
    const cs = getComputedStyle(el);
    return { height: Math.round(el.getBoundingClientRect().height), paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight, border: cs.borderTopWidth, fontSize: cs.fontSize };
  };
  const probe = document.createElement("button");
  probe.className = "button";
  probe.type = "button";
  probe.textContent = "Probe";
  document.querySelector("main").append(probe);
  const canonical = box(probe);
  probe.remove();
  const buttons = [...document.querySelectorAll("button")]
    .filter((el) => el.checkVisibility({ visibilityProperty: true }) && !el.closest(outside))
    .map((el) => ({ name: (el.textContent.trim() || el.getAttribute("aria-label") || "").slice(0, 40), classes: el.className, box: box(el) }));
  const anchors = [...document.querySelectorAll("a")]
    .filter((el) => [...el.classList].some((name) => /^(btn|button)(-|$)|-button$/.test(name)))
    .map((el) => `${el.className}: ${el.textContent.trim().slice(0, 40)}`);
  return { canonical, buttons, anchors };
}, outside);

for (const route of routes) {
  test(`chrome controls follow the button spec on /${route}`, { annotation }, async ({ page }, info) => {
    test.skip(!["desktop", "narrow"].includes(info.project.name), "The chrome is measured at the desktop and narrow widths.");
    /* The 404 page answers with its status, and a release comparison's frames
       block their historical scripts by design (sandbox); every other page
       must load clean. */
    const audit = route === "no-such-page/" ? (await page.goto(route), null) : await openSpec(page, route || "./");
    const clean = route.startsWith("releases/") && route !== "releases/" ? null : audit;
    const { canonical, buttons, anchors } = await survey(page, OUTSIDE_CHROME);
    expect(canonical).toEqual({ height: Number.parseInt(token("density.compact.control-height")), paddingLeft: token("density.compact.control-padding-x"), paddingRight: token("density.compact.control-padding-x"), border: token("border.width.default"), fontSize: token("font.size.ui-md") });
    expect(buttons.filter((button) => !/(^|\s)button(\s|$)/.test(button.classes)), "chrome buttons carry the canonical class").toEqual([]);
    expect(buttons.filter((button) => JSON.stringify(button.box) !== JSON.stringify(canonical)), "every tone shares the canonical box").toEqual([]);
    expect(anchors, "navigation is a link, never a button-styled <a>").toEqual([]);
    clean?.assertClean();
  });
}

for (const route of ["builder/", "patterns/validation-recovery/"]) {
  test(`/${route} shows the filled primary action (R-b)`, { annotation }, async ({ page }, info) => {
    test.skip(!["desktop", "narrow"].includes(info.project.name), "The tools are measured at the desktop and narrow widths.");
    await openSpec(page, route);
    const primary = page.locator("main button.button:not(.button-secondary, .button-tertiary, .button-destructive, .button-destructive-filled)").filter({ visible: true });
    await expect(primary).toHaveCount(1);
    expect(rgbToHex(await primary.evaluate((el) => getComputedStyle(el).backgroundColor))).toBe(token("color.action.primary.bg"));
  });
}


test("the section is current and the rail collapses to accessible icons from 900 to 1280px", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Responsive rail at explicit widths.");
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("components/button/");
  const rail = page.getByRole("navigation", { name: "Site", exact: true });
  const link = rail.getByRole("link", { name: "Components", exact: true });
  await expect(link).toHaveAttribute("aria-current", "true");
  await expect(link).toHaveAttribute("title", "Components");
  expect(await rail.evaluate((el) => el.getBoundingClientRect().width)).toBe(48);
  expect(await link.locator(".sidebar-nav-label").evaluate((el) => el.getBoundingClientRect().width)).toBe(1);
  await link.focus(); await expect(link).toBeFocused();
  await expect(link).toHaveCSS("border-inline-start-width", "2px");
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await rail.evaluate((el) => el.getBoundingClientRect().width)).toBe(240);
  expect(await link.locator(".sidebar-nav-label").evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(1);
});
