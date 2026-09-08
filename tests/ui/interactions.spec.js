import { test, expect } from "../browser/evidence-fixture.mjs";
const scope = (component, states, variants = ["default"], note = "") => ({ annotation: { type: "verification", description: JSON.stringify({ component, category: "keyboard", states, variants, note: `Isolated packed gallery; scripted interaction and lifecycle scope only. ${note}` }) } });
const card = (page, id, variant = "default") => page.locator(`.gallery-card[data-component="${id}"][data-variant="${variant}"]`);
test.beforeEach(async ({ page }) => { await page.goto("/gallery/"); await expect(page.locator(".gallery-card").first()).toBeVisible(); });

test("tabs support manual RTL navigation and reconnect without duplicate events", scope("tabs", ["default", "selected", "focus-visible"]), async ({ page }) => {
  const example = card(page, "tabs"), root = example.locator("j3w1-tabs"), tabs = example.getByRole("tab");
  await root.evaluate(element => { element.setAttribute("activation", "manual"); element.dir = "rtl"; element.dataset.selectCount = "0"; element.addEventListener("j3w1-select", () => { element.dataset.selectCount = String(Number(element.dataset.selectCount) + 1); }); });
  await tabs.nth(0).focus(); await page.keyboard.press("ArrowLeft");
  await expect(tabs.nth(1)).toBeFocused(); await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter"); await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await root.evaluate(element => { const parent = element.parentElement; element.remove(); parent.append(element); });
  await tabs.nth(2).click(); await expect(root).toHaveAttribute("data-select-count", "2");
  await expect(example.getByRole("tabpanel")).toContainText("Bindings");
});

test("menu submenu checks retain focus and Escape unwinds one level at a time", scope("menu", ["default", "open", "closed", "checked"], ["with-submenu"]), async ({ page }) => {
  const example = card(page, "menu", "with-submenu");
  const trigger = example.getByRole("button", { name: "View", exact: true });
  await trigger.focus(); await page.keyboard.press("ArrowDown"); await page.keyboard.press("ArrowDown");
  await expect(example.getByRole("menuitem", { name: "Density", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
  await expect(example.getByRole("menuitemradio", { name: "Second option" })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape"); await expect(example.getByRole("menuitem", { name: "Density", exact: true })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(trigger).toBeFocused(); await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("combobox filters, accepts with input focus and clears only after closing", scope("combobox", ["default", "open", "closed", "no-results"]), async ({ page }) => {
  const example = card(page, "combobox"), input = example.getByRole("combobox");
  await input.fill("Casc"); await page.keyboard.press("ArrowDown");
  await expect(input).toBeFocused(); await expect(input).toHaveAttribute("aria-activedescendant", /.+/);
  await page.keyboard.press("Enter"); await expect(input).toHaveValue("Cascadia Mono"); await expect(input).toHaveAttribute("aria-expanded", "false");
  await input.fill("no such option"); await expect(example.getByRole("status")).toHaveText("0 options available.");
  await page.keyboard.press("Escape"); await expect(input).toHaveValue("no such option");
  await page.keyboard.press("Escape"); await expect(input).toHaveValue("");
});

test("tree expands, selects and collapses with a single visible tab stop", scope("tree", ["default", "expanded", "collapsed", "selected", "focus-visible"]), async ({ page }) => {
  const example = card(page, "tree"), items = example.getByRole("treeitem");
  await items.first().focus(); await page.keyboard.press("ArrowRight");
  await expect(example.getByRole("treeitem", { name: "App.vue", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(example.getByRole("treeitem", { name: "App.vue", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft");
  await expect(items.first()).toHaveAttribute("aria-expanded", "false");
  await expect(example.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
  await expect(example.getByRole("treeitem", { name: "App.vue", exact: true })).not.toBeVisible();
});

test("wizard blocks invalid and unreachable steps and retains progress on reconnect", scope("wizard", ["default", "invalid", "disabled", "current"], ["numbered"]), async ({ page }) => {
  const example = card(page, "wizard", "numbered"), root = example.locator("j3w1-wizard"), panels = example.locator(".wizard-panel");
  await expect(example.locator(".wizard-step-button").last()).toBeDisabled();
  await example.locator(".wizard-next").click(); await expect(panels.nth(0)).toBeVisible();
  expect(await root.evaluate(element => { try { element.step = 2; return false; } catch (error) { return error instanceof RangeError; } })).toBe(true);
  await panels.nth(0).locator("input").fill("Atlas"); await example.locator(".wizard-next").click();
  await expect(panels.nth(1)).toBeVisible();
  await root.evaluate(element => { const parent = element.parentElement; element.remove(); parent.append(element); });
  await expect(panels.nth(1)).toBeVisible();
  await example.locator(".wizard-back").click(); await expect(panels.nth(0).locator("input")).toHaveValue("Atlas");
});

test("repeater preserves identity, form keys and values while reordering", scope("repeater", ["default", "empty", "disabled", "focus-visible"]), async ({ page }) => {
  const example = card(page, "repeater"), root = example.locator("j3w1-repeater");
  await root.evaluate(element => { element.setAttribute("max", "2"); const form = document.createElement("form"); element.parentElement.append(form); form.append(element); });
  await example.getByRole("button", { name: "Add contact" }).click(); await example.getByRole("button", { name: "Add contact" }).click();
  const rows = example.locator("[data-rows] > li");
  await rows.nth(0).locator("input").fill("First"); await rows.nth(1).locator("input").fill("Second");
  const ids = await root.evaluate(element => element.rowIds);
  await rows.nth(1).getByRole("button", { name: "Move up" }).click();
  expect(await root.evaluate(element => element.rowIds)).toEqual([...ids].reverse());
  expect(await root.evaluate(element => [...new FormData(element.closest("form"))].map(([, value]) => value))).toEqual(["Second", "First"]);
  await expect(example.getByRole("button", { name: "Add contact" })).toBeDisabled();
  await rows.nth(0).getByRole("button", { name: "Remove", exact: true }).click();
  await expect(rows).toHaveCount(1); await expect(rows.first().locator("input")).toHaveValue("First");
});

test("data-table selection, sort and keyboard width menus operate on real rows", scope("data-table", ["default", "selected", "mixed", "sorted"], ["resizable"]), async ({ page }) => {
  const example = card(page, "data-table", "resizable"), rows = example.locator("tbody tr[id]");
  await rows.first().focus(); await page.keyboard.press("Space");
  await expect(example.getByRole("checkbox", { name: "Select all rows" })).toHaveAttribute("aria-checked", "mixed");
  await page.keyboard.press("ControlOrMeta+a");
  await expect(example.getByRole("checkbox", { name: "Select all rows" })).toHaveAttribute("aria-checked", "true");
  await example.getByRole("button", { name: "Scope", exact: true }).click();
  await expect(rows.first()).toContainText("Signal monitor");
  const header = example.locator("th").filter({ has: page.getByRole("button", { name: "Width: Project", exact: true }) });
  await example.getByRole("button", { name: "Width: Project", exact: true }).click();
  await example.getByRole("menuitem", { name: "Wider", exact: true }).click();
  expect(await header.evaluate(element => element.style.width)).toMatch(/px$/);
  expect(await example.locator(".data-table-resize").first().getAttribute("tabindex")).toBeNull();
});

test("the bounded builder exports definitions and rejects invalid imports without mutation", scope("form-builder", ["default", "empty", "invalid"], ["default"], "Uses the maintained canonical five-kind builder; no backend or general schema engine."), async ({ page }) => {
  const example = card(page, "form-builder"), root = example.locator("j3w1-form-builder");
  for (const kind of ["text", "textarea", "select", "checkbox", "radio"]) { await example.getByRole("combobox", { name: "Field type", exact: true }).selectOption(kind); await example.getByRole("button", { name: "Add field", exact: true }).click(); await example.getByRole("button", { name: "Save field definition", exact: true }).click(); }
  const before = await root.evaluate(element => element.exportDefinition());
  expect(JSON.parse(before).fields.map(field => field.type)).toEqual(["text", "textarea", "select", "checkbox", "radio"]);
  expect(await root.evaluate(element => element.importDefinition('{"unsupported":true}'))).toBe(false);
  expect(await root.evaluate(element => element.exportDefinition())).toBe(before);
  await root.evaluate(element => { const parent = element.parentElement; element.remove(); parent.append(element); });
  expect(await root.evaluate(element => element.exportDefinition())).toBe(before);
});
