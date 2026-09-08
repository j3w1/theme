import { test, expect } from "./evidence-fixture.mjs";
import AxeBuilder from "@axe-core/playwright";
import { renderPortCatalogue } from "../../scripts/lib/port-presentation.mjs";
import { describePort } from "../../scripts/lib/port-capabilities.mjs";
import { fixture } from "../fixtures/port-capabilities.mjs";
const annotation = { type: "verification", description: JSON.stringify({ component: "page", category: "enhancements", states: [], variants: [], note: "Real empty port catalogue, static JSON, navigation, narrow/no-JS access. Synthetic state/evidence coverage is in source tests, not a real import claim." }) };
test("port explorer truthfully exposes the empty catalogue and contribution route", { annotation }, async ({ page }) => {
  await page.goto("ports/");
  await expect(page.locator("[data-port-empty]")).toContainText("No native ports");
  await expect(page.locator("[data-port-entry]")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Download mapping JSON" })).toHaveAttribute("href", /\/theme\/exports\/port-capabilities.json$/);
  await expect(page.getByRole("link", { name: "Contribute a port", exact: true })).toHaveAttribute("href", /\/blob\/[a-f0-9]{40}\/ports\/README.md$/);
  const response = await page.request.get("exports/port-capabilities.json");
  expect((await response.json()).ports).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("port explorer navigation is keyboard accessible with no axe violations", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Single empty-state keyboard and axe audit.");
  await page.goto("ports/");
  const link = page.getByRole("link", { name: "Download mapping JSON" });
  await link.focus(); await expect(link).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("synthetic mapping states use the real renderer and keyboard search without publishing a port", { annotation: { type: "verification", description: JSON.stringify({ component: "page", category: "enhancements", states: [], variants: [], note: "Request-intercepted, explicitly synthetic port data exercises the real static renderer, mapping classifications, search/reset and no-JS. Never a real port or import result." }) } }, async ({ page }, info) => {
  const port = describePort(fixture());
  const rendered = renderPortCatalogue({ ports: [port] }, { revision: "a".repeat(40) });
  await page.route("**/theme/ports/", async route => {
    const response = await route.fetch();
    const html = await response.text();
    await route.fulfill({ response, body: html.replace(/<p data-port-empty[^>]*>[\s\S]*?<\/p>/, rendered) });
  });
  await page.goto("ports/");
  await expect(page.getByRole("heading", { name: "Synthetic test only" })).toBeVisible();
  await expect(page.locator("[data-port-row]")).toHaveCount(5);
  for (const state of ["mapped", "inherited", "unsupported", "out-of-scope", "not-implemented"]) await expect(page.locator("[data-port-row]").filter({ has: page.getByRole("cell", { name: state, exact: true }) })).toHaveCount(1);
  if (info.project.name === "nojs") {
    await expect(page.locator("[data-port-filter]")).toBeHidden();
    await expect(page.locator("[data-port-row]:visible")).toHaveCount(5);
  } else {
    const input = page.getByRole("searchbox", { name: "Search ports, roles and native keys" });
    await input.focus(); await input.pressSequentially("native.fg");
    await expect(page.locator("[data-port-row]:visible")).toHaveCount(1);
    await input.press("Tab"); await page.keyboard.press("Enter");
    await expect(page.locator("[data-port-row]:visible")).toHaveCount(5);
    await input.fill("unsupported");
    await expect(page.locator("[data-port-row]:visible")).toHaveCount(1);
    if (info.project.name === "desktop") expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
