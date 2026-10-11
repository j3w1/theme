import { test, expect } from "./evidence-fixture.mjs";
import { verification } from "./verification.mjs";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { renderPortCatalogue } from "../../scripts/lib/port-presentation.mjs";
import { describePort } from "../../scripts/lib/port-capabilities.mjs";
import { fixture } from "../fixtures/port-capabilities.mjs";
const { annotation } = verification({ component: "page", category: "enhancements", states: [], variants: [], note: "Real port catalogue, static JSON, served port files and their download links, navigation, narrow/no-JS access. A served file is not an import; synthetic state/evidence coverage is in source tests, not a real import claim." });
const sha256 = (bytes) => "sha256-" + createHash("sha256").update(bytes).digest("base64");
test("port explorer lists every published port with a working download and the contribution route", { annotation }, async ({ page }) => {
  await page.goto("ports/");
  const { ports } = await (await page.request.get("exports/port-capabilities.json")).json();
  expect(ports.length).toBeGreaterThan(0);
  await expect(page.locator("[data-port-empty]")).toHaveCount(0);
  await expect(page.locator("[data-port-entry]")).toHaveCount(ports.length);
  // Read static link attributes once. Repeated whole-catalogue accessibility
  // queries scale with every role table and used the test budget before the
  // added binary downloads could all be verified.
  const downloads=await page.getByRole("link",{name:/^Download /}).evaluateAll(links=>links.map(link=>({
    name:link.textContent.trim(),href:link.getAttribute("href"),download:link.getAttribute("download")
  })));
  for (const port of ports) {
    await expect(page.getByRole("heading", { name: port.displayName, exact: true })).toBeVisible();
    for (const file of port.files) {
      const name = file.path.split("/").at(-1);
      const matches=downloads.filter(link=>link.name===`Download ${name}`);
      expect(matches).toHaveLength(1);
      const [link]=matches;
      expect(link.href).toBe(`/theme/ports/${port.id}/${name}`);
      expect(link.download).toBe("");
      const response = await page.request.get(link.href);
      expect(response.ok()).toBe(true);
      expect(sha256(await response.body())).toBe(file.digest);
    }
  }
  await expect(page.getByRole("link", { name: "Download mapping JSON" })).toHaveAttribute("href", /\/theme\/exports\/port-capabilities.json$/);
  await expect(page.getByRole("link", { name: "Contribute a port", exact: true })).toHaveAttribute("href", /\/blob\/[a-f0-9]{40}\/ports\/README.md$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("port explorer navigation is keyboard accessible with no axe violations", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Single keyboard and axe audit.");
  // The scan covers every port's full role table (five ports, one row per
  // role each), as the other full-page scans do with their own budgets.
  test.setTimeout(120_000);
  await page.goto("ports/");
  for (const name of ["Download mapping JSON", /^Download .+\.[a-z]+$/]) {
    const link = page.getByRole("link", { name }).first();
    await link.focus(); await expect(link).toBeFocused();
  }
  // Keep every rule and every violation/incomplete node. Limiting redundant
  // passing-node detail avoids expensive selectors and result transfers on
  // this full role catalogue, without changing scan scope or its budget.
  expect((await new AxeBuilder({ page }).options({ resultTypes: ["violations", "incomplete", "inapplicable"] }).analyze()).violations).toEqual([]);
});

test("synthetic mapping states use the real renderer and keyboard search without publishing a port", verification({ component: "page", category: "enhancements", states: [], variants: [], note: "Request-intercepted, explicitly synthetic port data exercises the real static renderer, mapping classifications, search/reset and no-JS. Never a real port or import result." }), async ({ page }, info) => {
  const port = describePort(fixture());
  const rendered = renderPortCatalogue({ ports: [port] }, { revision: "a".repeat(40) });
  await page.route("**/theme/ports/", async route => {
    const response = await route.fetch();
    const html = await response.text();
    await route.fulfill({ response, body: html.replace(/<div data-port-content[^>]*>[\s\S]*<\/section><\/div>/, `<div data-port-content>${rendered}</div>`) });
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
