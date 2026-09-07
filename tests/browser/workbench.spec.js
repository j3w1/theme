import { test, expect } from "./evidence-fixture.mjs";
import AxeBuilder from "@axe-core/playwright";
const annotation = { type: "verification", description: JSON.stringify({ component: "page", category: "enhancements", states: [], variants: [], note: "Phase 3 workbench: isolated native controls, real viewport comparison, measurements, private-text exclusion, reviewed reporting and reduced motion. Diagnostic tooling does not establish component acceptance." }) };
const open = async (page, id) => {
  await page.goto(`workbench/${id}/`);
  await expect(page.locator("[data-viewport-report]")).toContainText("Actual viewport:");
  return page.frameLocator("[data-workbench-frame]");
};
const choice = (page, name, value) => page.locator(`[data-workbench-controls] [name="${name}"]`).selectOption(value);
const localBox = (locator) => locator.evaluate(el => { const box = el.getBoundingClientRect(); return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height }; });

test("workbench preserves canonical content and direct reporting without JavaScript", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name !== "nojs", "Dedicated no-JS route check.");
  await page.goto("workbench/button/");
  await expect(page.getByRole("heading", { name: "Canonical specimen" })).toBeVisible();
  await expect(page.locator(".workbench-fallback .button")).toBeVisible();
  await expect(page.locator("[data-workbench-controls]")).toBeHidden();
  await expect(page.locator("[data-issue-form]")).toBeHidden();
  await expect(page.getByRole("link", { name: "Report an issue without JavaScript" })).toBeVisible();
  await page.goto("preview/button/");
  await expect(page.locator("[data-preview-root] .button")).toBeVisible();
  await expect(page.getByRole("link", { name: "Machine contract" })).toBeVisible();
});

test("workbench uses real viewport widths and reports measured mismatches without altering layout", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name === "nojs", "Interactive enhancement.");
  const frame = await open(page, "button");
  await expect(frame.locator("[data-open-dialog]")).toBeHidden();
  const withoutOverlay = await localBox(frame.locator(".button"));
  await choice(page, "part", "root");
  await expect(page.locator("[data-measurements]")).toContainText("matches");
  expect(await localBox(frame.locator(".button"))).toEqual(withoutOverlay);
  await page.locator("[data-width-preset]").selectOption("320");
  await expect(page.locator("[data-viewport-report]")).toContainText("320 × 560");
  const before = await localBox(frame.locator(".button"));
  await expect(frame.locator("[data-part-overlay]")).toHaveCSS("pointer-events", "none");
  await frame.locator(".button").click();
  await expect(frame.locator("[data-preview-status]")).toContainText("Button activated");
  expect(await localBox(frame.locator(".button"))).toEqual(before);
  await frame.locator(".button").evaluate(el => el.style.paddingInlineStart = "37px");
  await expect(page.locator("[data-measurements]")).toContainText("37px — MISMATCH");
  await frame.locator("[data-preview-root]").evaluate(el => { const probe = document.createElement("div"); probe.style.width = "1700px"; probe.textContent = "Controlled overflow probe"; el.append(probe); window.dispatchEvent(new Event("resize")); });
  await expect(page.locator("[data-viewport-report]")).not.toContainText("Outer horizontal overflow: 0 px");
  await page.locator("[data-compare-enabled]").check();
  await page.locator("[data-compare-width]").selectOption("360");
  await page.locator("[data-compare-direction]").selectOption("rtl");
  await expect(page.locator("[data-comparison-report]")).toContainText("360 × 560");
  await expect(page.frameLocator("[data-comparison-frame]").locator("[data-preview-root]")).toHaveAttribute("dir", "rtl");
  await expect(frame.locator("[data-preview-root]")).toHaveAttribute("dir", "ltr");
  await page.locator("[data-workbench-reset]").click();
  await expect(page.locator("[data-comparison]")).toBeHidden();
  await expect(page.locator("[data-viewport-report]")).toContainText("Outer horizontal overflow: 0 px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("native controls support checkbox Space, field actions, roving tabs and modal focus return", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name === "nojs", "Interactive enhancement.");
  let frame = await open(page, "checkbox");
  await choice(page, "state", "mixed");
  const checkbox = frame.locator('input[type="checkbox"]').first();
  await expect.poll(() => checkbox.evaluate(el => el.indeterminate)).toBe(true);
  await checkbox.focus(); await checkbox.press("Space");
  await expect(checkbox).toBeChecked();
  await expect.poll(() => checkbox.evaluate(el => el.indeterminate)).toBe(false);
  frame = await open(page, "text-field");
  await choice(page, "variant", "password");
  await choice(page, "part", "clear / reveal / stepper");
  await expect(frame.locator("[data-part-overlay]")).toBeVisible();
  await expect(page.locator("[data-part-description]")).not.toContainText("absent or hidden");
  await frame.locator(".text-field-action").click();
  await expect(frame.locator("input")).toHaveAttribute("type", "text");
  await choice(page, "variant", "search");
  await frame.locator("input").fill("temporary search");
  await frame.locator("input").press("Escape");
  await expect(frame.locator("input")).toHaveValue("");
  frame = await open(page, "tabs");
  await choice(page, "variant", "overflow");
  await frame.getByRole("tab").first().focus();
  await frame.getByRole("tab").first().press("End");
  await expect(frame.getByRole("tab").last()).toBeFocused();
  await expect(frame.getByRole("tabpanel")).toHaveCount(1);
  frame = await open(page, "dialog");
  await choice(page, "part", "root");
  const opener = frame.getByRole("button", { name: "Open modal dialog" });
  await opener.click();
  await expect(frame.getByRole("alertdialog")).toBeVisible();
  await expect(frame.locator("dialog [data-part-overlay]")).toBeVisible();
  await frame.locator("dialog button").first().press("Escape");
  await expect(opener).toBeFocused();
  await expect(frame.locator("dialog")).toBeHidden();
});

test("share links exclude sample text by default, preserve history and expose unavailable revisions", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name === "nojs", "Interactive enhancement.");
  const frame = await open(page, "button");
  await page.locator('[name="label"]').fill("PRIVATE sample #abcdef");
  await expect(frame.locator(".button-label")).toContainText("PRIVATE sample");
  expect(decodeURIComponent(page.url())).not.toContain("PRIVATE");
  await expect(page.locator("[data-share-payload]")).not.toHaveValue(/PRIVATE/);
  await page.locator("[data-include-text]").check();
  await expect(page.locator("[data-share-payload]")).toHaveValue(/PRIVATE/);
  await choice(page, "density", "comfortable");
  await choice(page, "direction", "rtl");
  await page.goBack();
  await expect(page.locator('[name="direction"]')).toHaveValue("ltr");
  const payload = JSON.parse(await page.locator("[data-share-payload]").inputValue());
  payload.revision = "a".repeat(40);
  await page.goto(`preview/button/#${encodeURIComponent(JSON.stringify(payload))}`);
  await expect(page.locator("[data-preview-status]")).toContainText("unavailable");
  await expect(page.getByRole("link", { name: "View requested pinned source" })).toHaveAttribute("href", /\/tree\/a{40}$/);
});

test("report drafts carry distinct target context, redact specimen text, and require review", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name === "nojs", "Interactive enhancement.");
  for (const id of ["button", "checkbox"]) {
    await open(page, id);
    await page.locator('[name="label"]').fill("PRIVATE specimen text");
    await page.locator('[name="expected"]').fill("Expected working behavior");
    await page.getByRole("button", { name: "Prepare draft for review" }).click();
    const draft = await page.locator("[data-issue-body]").inputValue();
    expect(draft).toContain(`"id": "${id}"`);
    expect(draft).toContain(`https://j3w1.github.io/theme/#c-${id}`);
    expect(draft).toContain('"themeVersion": "0.1.0"');
    expect(draft).not.toContain("PRIVATE");
    await expect(page.locator("[data-open-issue]")).not.toHaveAttribute("href");
    await page.locator("[data-review-issue]").check();
    await expect(page.locator("[data-open-issue]")).toHaveAttribute("href", /^https:\/\/github.com\/j3w1\/theme\/issues\/new\?/);
    await page.locator("[data-cancel-issue]").click();
    await expect(page.locator("[data-issue-body]")).toHaveValue("");
  }
  await page.goto("report/?token=color.text.default&profile=extended");
  await page.getByRole("button", { name: "Prepare draft for review" }).click();
  await expect(page.locator("[data-issue-body]")).toHaveValue(/"kind": "token"/);
  await expect(page.locator("[data-issue-body]")).toHaveValue(/"profile": "extended"/);
  await expect(page.locator("[data-issue-body]")).toHaveValue(/#t-color-text-default/);
  await page.locator('[name="evidence"]').fill("長".repeat(1600));
  await page.getByRole("button", { name: "Prepare draft for review" }).click();
  await page.locator("[data-review-issue]").check();
  await expect(page.locator("[data-issue-status]")).toContainText("portable link budget");
  expect(new URL(await page.locator("[data-open-issue]").getAttribute("href")).searchParams.has("body")).toBe(false);
});

test("motion respects reduced preference and contrast results retain build context", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name === "nojs", "Interactive enhancement.");
  const frame = await open(page, "button");
  await expect(page.locator("[data-contrast-copy]")).toHaveValue(/"sourceDigest"/);
  await expect(page.locator("[data-contrast-result]")).toContainText("unrounded ratio");
  await page.locator('[data-replay="slow"]').click();
  await expect(frame.locator("[data-preview-status]")).toContainText("one-quarter");
  await page.locator('[data-replay="stop"]').click();
  await expect(frame.locator(".button")).not.toHaveAttribute("style", /transition-duration/);
  await page.locator('[data-replay="slow"]').click();
  await page.locator("[data-workbench]").evaluate(el => el.hidden = true);
  await expect(frame.locator(".button")).not.toHaveAttribute("style", /transition-duration/);
  await page.locator("[data-workbench]").evaluate(el => el.hidden = false);
  await page.locator("[data-compare-reduced]").click();
  await expect(page.locator("[data-comparison-report]")).toContainText("Reduced motion is active");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator('[data-replay="normal"]').click();
  await expect(frame.locator("[data-preview-status]")).toContainText("no playback");
  await expect(frame.locator(".button")).toHaveCSS("transition-duration", "0s");
});

test("viewport fixtures exercise all laboratory components and preserve the approved pressed border", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name === "nojs", "Interactive enhancement.");
  for (const id of ["text-field", "tabs", "table", "dialog", "sidebar-nav"]) {
    const frame = await open(page, id);
    for (const width of ["320", "360", "640", "1280"]) {
      await page.locator("[data-width-preset]").selectOption(width);
      await expect(page.locator("[data-viewport-report]")).toContainText(`${width} × 560`);
      expect(await frame.locator("html").evaluate(() => innerWidth)).toBe(Number(width));
      if (id === "table" && width === "320") await expect(page.locator("[data-viewport-report]")).not.toContainText("Inner scrolling regions: none");
    }
    await choice(page, "fixture", "ar");
    await expect(frame.locator("[data-preview-root]")).toHaveAttribute("dir", "rtl");
    await expect(frame.locator("[data-preview-root]")).toHaveAttribute("lang", "ar");
    await choice(page, "density", "comfortable");
    await expect(frame.locator("html")).toHaveAttribute("data-density", "comfortable");
    await choice(page, "fixture", "long");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  const frame = await open(page, "button");
  await choice(page, "state", "active");
  const expected = await page.locator("[data-workbench]").evaluate(el => { const d = JSON.parse(el.dataset.workbenchData); return d.tokens.default[d.contract.tokens["root.border-active"]].value.components.map(v => Math.round(v * 255)); });
  await expect(frame.locator(".button")).toHaveCSS("border-top-color", `rgb(${expected.join(", ")})`);
});

test("workbench controls and report page have accessible labels and no axe violations", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "One complete chrome audit; reflow is covered separately.");
  for (const id of ["button", "text-field", "checkbox", "tabs", "dialog", "table", "sidebar-nav"]) {
    const frame = await open(page, id);
    if (id === "dialog") await frame.getByRole("button", { name: "Open modal dialog" }).click();
    expect((await new AxeBuilder({ page }).include("[data-workbench]").analyze()).violations, id).toEqual([]);
  }
  await page.goto("report/?component=button");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
