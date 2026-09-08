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
  const tabTo = async (target, backwards = false) => {
    for (let stop = 0; stop < 80; stop++) {
      if (await target.evaluate(node => node === document.activeElement)) return;
      await page.keyboard.press(backwards ? "Shift+Tab" : "Tab");
    }
    throw new Error("Target was not reachable through the native tab order.");
  };
  const type = async value => { await page.keyboard.press("ControlOrMeta+A"); await page.keyboard.type(value); };
  const palette = root.getByRole("combobox", { name: "Field type", exact: true });
  // Establish the entry point once; composition through download then uses only keyboard events.
  await palette.focus();
  for (const kind of ["text", "textarea", "select", "checkbox", "radio"]) {
    await tabTo(palette, true); await page.keyboard.press(kind === "text" ? "Home" : "ArrowDown"); await expect(palette).toHaveValue(kind);
    await page.keyboard.press("Tab"); await expect(root.getByRole("button", { name: "Add field", exact: true })).toBeFocused(); await page.keyboard.press("Enter");
    await expect(root.getByLabel("Field label", { exact: true })).toBeFocused();
    await type(`Example ${kind}`); await page.keyboard.press("Tab"); await expect(root.getByLabel("Field help", { exact: true })).toBeFocused(); await type("Local example help");
    await page.keyboard.press("Tab"); await expect(root.getByLabel("Required field", { exact: true })).toBeFocused(); await page.keyboard.press("Space");
    if (["select", "radio"].includes(kind)) { await page.keyboard.press("Tab"); await expect(root.getByRole("textbox", { name: "Options JSON", exact: true })).toBeFocused(); await type(JSON.stringify([{ id: "first", label: "First option" }, { id: "second", label: "Second option" }])); }
    await page.keyboard.press("Tab"); await expect(root.getByRole("button", { name: "Save field definition", exact: true })).toBeFocused(); await page.keyboard.press("Enter");
  }
  const last = root.locator('[data-field-id="field-5"]');
  await page.keyboard.press("Tab"); await expect(last.getByRole("button", { name: "Move up", exact: true })).toBeFocused(); await page.keyboard.press("Enter");
  await expect(last.getByRole("button", { name: "Edit field", exact: true })).toBeFocused();
  expect(await root.locator("[data-field-id]").evaluateAll(nodes => nodes.map(node => node.dataset.fieldId))).toEqual(["field-1", "field-2", "field-3", "field-5", "field-4"]);
  const preview = root.locator("[data-workflow]");
  await tabTo(preview.getByRole("button", { name: "Review values", exact: true })); await page.keyboard.press("Enter");
  await expect(preview.locator("[data-errors] a")).toHaveCount(5);
  await expect(preview.locator("[data-errors]")).toBeFocused(); await page.keyboard.press("Tab"); await page.keyboard.press("Enter");
  await expect(preview.getByRole("textbox", { name: "Example text required", exact: true })).toBeFocused(); await type("Never export this value");
  await page.keyboard.press("Tab"); await expect(preview.getByRole("textbox", { name: "Example textarea required", exact: true })).toBeFocused(); await type("Notes");
  await page.keyboard.press("Tab"); await expect(preview.getByRole("combobox", { name: "Example select required", exact: true })).toBeFocused(); await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab"); await expect(preview.getByRole("radio", { name: "First option", exact: true })).toBeFocused(); await page.keyboard.press("Space");
  await page.keyboard.press("Tab"); await expect(preview.getByRole("checkbox")).toBeFocused(); await page.keyboard.press("Space");
  await page.keyboard.press("Tab"); await expect(preview.getByRole("button", { name: "Review values", exact: true })).toBeFocused(); await page.keyboard.press("Enter");
  await expect(preview).toHaveAttribute("data-stage", "review");
  await tabTo(root.getByRole("button", { name: "Show definition JSON", exact: true })); await page.keyboard.press("Enter");
  const text = await root.getByLabel("Definition JSON", { exact: true }).inputValue();
  expect(text).not.toContain("Never export this value"); const definition = JSON.parse(text);
  const download = page.waitForEvent("download"); await page.keyboard.press("Tab"); await expect(root.getByRole("button", { name: "Download definition", exact: true })).toBeFocused(); await page.keyboard.press("Enter");
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
