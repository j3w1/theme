import { test, expect } from "../evidence-fixture.mjs";
import AxeBuilder from "@axe-core/playwright";
const annotation = { type: "verification", description: JSON.stringify({ component: "form-builder", category: "enhancements", states: ["default", "empty", "invalid", "disabled"], variants: ["default"], note: "Five field kinds, keyboard add/edit/order, required validation, both densities, bounded atomic import, explicit definition-only download, reset and no-JS. Automated DOM/axe; no native port or manual screen-reader claim." }) };
test("builder contract and static reference remain available without JavaScript", { annotation }, async ({ page }, info) => {
  await page.goto("builder/");
  await expect(page.getByRole("heading", { name: "Without JavaScript" })).toBeVisible();
  if (info.project.name === "nojs") await expect(page.locator("[data-builder]")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("compose all five fields, reorder, validate, transfer and reject invalid imports without data loss", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name === "nojs", "Static builder contract is tested separately.");
  await page.goto("builder/");
  const root = page.locator("[data-builder]"); await expect(root).toBeVisible();
  const requests = []; page.on("request", request => { if (["fetch", "xhr"].includes(request.resourceType()) || request.method() !== "GET") requests.push(request.url()); });
  for (const kind of ["text", "textarea", "select", "checkbox", "radio"]) {
    await root.getByRole("combobox", { name: "Field type", exact: true }).selectOption(kind);
    await root.getByRole("button", { name: "Add field", exact: true }).focus(); await page.keyboard.press("Enter");
    await expect(root.getByLabel("Field label", { exact: true })).toBeFocused();
    await root.getByLabel("Field label", { exact: true }).fill(`Example ${kind}`);
    await root.getByLabel("Field help", { exact: true }).fill("Local example help");
    await root.getByLabel("Required field", { exact: true }).check();
    if (["select", "radio"].includes(kind)) await root.getByRole("textbox", { name: "Options JSON", exact: true }).fill(JSON.stringify([{ id: "first", label: "First option" }, { id: "second", label: "Second option" }]));
    await root.getByRole("button", { name: "Save field definition", exact: true }).focus(); await page.keyboard.press("Enter");
  }
  const last = root.locator('[data-field-id="field-5"]');
  await last.getByRole("button", { name: "Move up", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(last.getByRole("button", { name: "Edit field", exact: true })).toBeFocused();
  expect(await root.locator("[data-field-id]").evaluateAll(nodes => nodes.map(node => node.dataset.fieldId))).toEqual(["field-1", "field-2", "field-3", "field-5", "field-4"]);
  const preview = root.locator("[data-workflow]");
  await preview.getByRole("button", { name: "Review values", exact: true }).click();
  await expect(preview.locator("[data-errors] a")).toHaveCount(5);
  await preview.getByRole("textbox", { name: "Example text required", exact: true }).fill("Never export this value");
  await preview.getByRole("textbox", { name: "Example textarea required", exact: true }).fill("Notes");
  await preview.getByRole("combobox", { name: "Example select required", exact: true }).selectOption("first");
  await preview.getByRole("radio", { name: "First option", exact: true }).check();
  await preview.getByRole("checkbox").check();
  await preview.getByRole("button", { name: "Review values", exact: true }).click();
  await expect(preview).toHaveAttribute("data-stage", "review");
  await root.getByRole("button", { name: "Show definition JSON", exact: true }).click();
  const text = await root.getByLabel("Definition JSON", { exact: true }).inputValue();
  expect(text).not.toContain("Never export this value"); const definition = JSON.parse(text);
  const download = page.waitForEvent("download"); await root.getByRole("button", { name: "Download definition", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("theme-form.json");
  await root.getByLabel("Definition JSON", { exact: true }).fill('{"schemaVersion":999}');
  await root.getByRole("button", { name: "Import definition JSON", exact: true }).click();
  await expect(root.locator("[data-builder-status]")).toContainText("Definition unchanged"); await expect(root.locator("[data-field-id]")).toHaveCount(5);
  definition.fields[0].label = '<img src=x onerror="alert(1)">';
  await root.getByLabel("Definition JSON", { exact: true }).fill(JSON.stringify(definition));
  await root.getByRole("button", { name: "Import definition JSON", exact: true }).click();
  await expect(preview.locator("img")).toHaveCount(0); await expect(preview.locator("input[type=text]")).toHaveValue("");
  for (const density of ["comfortable", "compact"]) { await root.getByRole("combobox", { name: "Preview density", exact: true }).selectOption(density); await expect(root.locator("[data-preview]")).toHaveAttribute("data-density", density); }
  if (info.project.name === "desktop") expect((await new AxeBuilder({ page }).include("[data-builder]").analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(requests).toEqual([]);
  await root.locator('[data-field-id="field-1"]').getByRole("button", { name: "Remove field", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(root.locator("[data-field-id]")).toHaveCount(4);
  await expect(root.locator('[data-field-id="field-2"]').getByRole("button", { name: "Edit field", exact: true })).toBeFocused();
  await root.getByRole("button", { name: "Reset builder", exact: true }).click(); await expect(root.locator("[data-field-id]")).toHaveCount(0);
});
