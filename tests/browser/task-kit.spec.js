import { chooseOptions } from "../ui/choice-helper.mjs";
import { test, expect } from "./evidence-fixture.mjs";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { unzipSync, strFromU8 } from "fflate";
import AxeBuilder from "@axe-core/playwright";
import { anchorFor } from "../../scripts/lib/anchors.mjs";
const annotation = { type: "verification", description: JSON.stringify({ component: "page", category: "enhancements", states: [], variants: [], note: "Task kit selection, digest validation, no-JS guidance, reflow and deterministic browser/CLI packaging; downstream implementation acceptance is separate." }) };
const configure = async (page) => {
  await page.getByRole("button", { name: "Use settings-form selection" }).click();
  await page.getByLabel("Implementation task", { exact: true }).fill("Implement a settings form.");
  await page.getByLabel("Integration ID", { exact: true }).fill("acceptance-form");
  await page.getByLabel("Integration version", { exact: true }).fill("1");
};

test("task kit controls reflow and preserve a no-JS consumption route", { annotation }, async ({ page }, testInfo) => {
  await page.goto("kit/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "CLI", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Consumer authority and reporting contract" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  if (testInfo.project.name === "nojs") { await expect(page.locator("[data-kit-form]")).toBeHidden(); return; }
  await configure(page);
  const source = await page.locator(`#${anchorFor.kitControl("data")}`).textContent();
  if (!JSON.parse(source).source) { await expect(page.getByRole("button", { name: "Build kit", exact: true })).toBeDisabled(); return; }
  await chooseOptions(page.getByLabel("Mode", { exact: true }), "minimal");
  await page.getByRole("button", { name: "Build kit", exact: true }).click();
  await expect(page.locator("[data-kit-status]")).toContainText("Kit ready");
  await expect(page.locator("[data-kit-summary]")).toContainText("4 components");
  await page.getByRole("button", { name: "Clear selection", exact: true }).click();
  await expect(page.locator("[data-kit-result]")).toBeHidden();
  if (testInfo.project.name === "desktop") {
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations.map((v) => v.id)).toEqual([]);
  }
});

test("browser ZIP and CLI directory agree byte-for-byte at the same pin", { annotation }, async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One exact browser/CLI comparison; other projects exercise controls and no-JS.");
  test.setTimeout(90_000); // Includes native Windows path-attribute checks for every written directory.
  await page.goto("kit/", { waitUntil: "networkidle" });
  const { source } = JSON.parse(await page.locator(`#${anchorFor.kitControl("data")}`).textContent());
  test.skip(!source, "An unpinned local build intentionally disables package generation.");
  await configure(page);
  await page.getByRole("button", { name: "Build kit", exact: true }).click();
  await expect(page.locator("[data-kit-status]")).toContainText("Kit ready");
  const waiting = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download ZIP", exact: true }).click();
  const download = await waiting;
  const files = Object.fromEntries(Object.entries(unzipSync(await fs.readFile(await download.path()))).map(([name, bytes]) => [name, strFromU8(bytes)]));
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "j3w1-browser-cli-"));
  try {
    const out = path.join(root, "kit");
    await promisify(execFile)(process.execPath, ["scripts/task-kit.mjs", "--ref", source.revision, "--components", "text-field,checkbox,button,dialog", "--task", "Implement a settings form.", "--integration-id", "acceptance-form", "--integration-version", "1", "--out", out]);
    const actual = {};
    for (const name of await fs.readdir(out, { recursive: true })) if ((await fs.stat(path.join(out, name))).isFile()) actual[name.split(path.sep).join("/")] = await fs.readFile(path.join(out, name), "utf8");
    expect(actual).toEqual(files);
    const kit = JSON.parse(files["KIT.json"]);
    expect(kit.source.revision).toBe(source.revision);
    expect(kit.request.components).toEqual(["button", "checkbox", "dialog", "text-field"]);
  } finally { expect(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)).toBe(true); await fs.rm(root, { recursive: true, force: true }); }
});

test("mixed deployment inputs fail closed and task text remains local data", { annotation }, async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One digest-failure boundary test.");
  await page.goto("kit/", { waitUntil: "networkidle" });
  const { source } = JSON.parse(await page.locator(`#${anchorFor.kitControl("data")}`).textContent());
  test.skip(!source, "Requires a pinned candidate build.");
  await configure(page);
  await page.getByLabel("Implementation task", { exact: true }).fill('</textarea><script>window.taskTextExecuted=true</script>');
  expect(await page.evaluate(() => window.taskTextExecuted)).toBeUndefined();
  await page.route("**/exports/components/checkbox.json", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()) + " " });
  });
  await page.getByRole("button", { name: "Build kit", exact: true }).click();
  await expect(page.locator("[data-kit-status]")).toContainText("Source digest mismatch");
  await expect(page.locator("[data-kit-result]")).toBeHidden();
});
