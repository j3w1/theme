import { chooseOptions } from "./choice-helper.mjs";
import { test, expect } from "../browser/evidence-fixture.mjs";
import AxeBuilder from "@axe-core/playwright";
const scope = (component, states, variants = ["default"], note = "") => ({ annotation: { type: "verification", description: JSON.stringify({ component, category: "keyboard", states, variants, note: `Isolated packed gallery; scripted interaction and lifecycle scope only. ${note}` }) } });
const card = (page, id, variant = "default") => page.locator(`.gallery-card[data-component="${id}"][data-variant="${variant}"]`);
test.beforeEach(async ({ page }) => { await page.goto("/gallery/"); await expect(page.locator(".gallery-card").first()).toBeVisible(); });

test("command palette selects actions and closes a populated search with Escape", scope("command-palette", ["default", "open", "closed", "no-results", "focus-visible"]), async ({ page }) => {
  const example = card(page, "command-palette"), root = example.locator("j3w1-command-palette"), opener = example.locator("[data-open]");
  await root.evaluate(element => { element.dataset.lastCommand = ""; element.addEventListener("j3w1-command", event => { element.dataset.lastCommand = event.detail.action; }); });
  await opener.click();
  const query = example.getByRole("combobox");
  const layout = await query.evaluate(input => { const field=input.getBoundingClientRect(), label=input.previousElementSibling.getBoundingClientRect(), dialog=input.closest('dialog').getBoundingClientRect(); return {below:field.top>=label.bottom,wide:field.width>dialog.width*.8}; });
  expect(layout).toEqual({below:true,wide:true});
  await query.fill("components");
  await expect(example.getByRole("option")).toHaveCount(1);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Enter");
  await expect(root).toHaveAttribute("data-last-command", "components");
  await expect(opener).toBeFocused();
  await opener.click(); await query.fill("no-such-command-12345");
  await expect(example.getByRole("option")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(example.locator("dialog")).not.toBeVisible();
  await expect(opener).toBeFocused();
});

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

test('themed single choices preserve native values, constraints, defaults and disabled fieldsets', scope('select',['default','focus-visible','required','invalid','disabled'],['default'],'The theme owns the open list; actual option clicks and keyboard commands exercise the native form bridge.'), async ({page}) => {
  const example=card(page,'select'), root=example.locator('j3w1-select');
  await root.evaluate(element=>{const form=document.createElement('form'), fieldset=document.createElement('fieldset');form.dataset.choiceTest='';element.before(form);form.append(fieldset);fieldset.append(element);element.querySelector('select').name='workspace';element.dataset.changes='0';element.addEventListener('j3w1-change',()=>{element.dataset.changes=String(Number(element.dataset.changes)+1);});});
  const control=example.getByRole('combobox');await expect(control).toContainText('1: terminal');
  await control.press('ArrowDown');await expect(control).toHaveAttribute('aria-expanded','true');
  await control.press('3');expect(await root.evaluate(element=>element.value)).toBe('1');
  await control.press('Escape');expect(await root.evaluate(element=>element.value)).toBe('1');
  await chooseOptions(control,'2');await expect(root).toHaveAttribute('data-changes','1');
  expect(await example.locator('form').evaluate(form=>Object.fromEntries(new FormData(form)))).toEqual({workspace:'2'});
  await root.evaluate(element=>{element.value='3';});await expect(control).toContainText('3: browser');
  await example.locator('form').evaluate(form=>form.reset());await expect(control).toContainText('1: terminal');
  await example.locator('fieldset').evaluate(fieldset=>{fieldset.disabled=true;});await expect(control).toBeDisabled();
  expect(await example.locator('form').evaluate(form=>[...new FormData(form)])).toEqual([]);
  await example.locator('fieldset').evaluate(fieldset=>{fieldset.disabled=false;});await expect(control).toBeEnabled();
  await root.evaluate(element=>{element.required=true;element.value='';});
  expect(await root.evaluate(element=>element.reportValidity())).toBe(false);await expect(control).toBeFocused();await expect(control).toHaveAttribute('aria-invalid','true');
  await chooseOptions(control,'1');await expect(control).toHaveAttribute('aria-invalid','false');
  await control.click();expect((await new AxeBuilder({page}).include('.gallery-card[data-component="select"][data-variant="default"]').analyze()).violations).toEqual([]);await control.press('Escape');
  await root.evaluate(element=>{const form=document.createElement('form');form.id='external-choice-form';element.ownerDocument.body.append(form);element.querySelector('select').setAttribute('form',form.id);element.value='3';form.reset();});await expect(control).toContainText('1: terminal');
  await root.evaluate(element=>{element.required=false;});await expect(control).toHaveAccessibleName('Workspace');
  await root.evaluate(element=>{element.required=true;});await expect(control).toHaveAccessibleName('Workspace required');
});

test('themed multiple choices support independent toggles, select all, dynamic options and reconnect', scope('select',['default','focus-visible','disabled'],['multiple','with-groups'],'Multiple list uses theme-rendered selected fills and check marks; dynamic option and lifecycle behavior are exercised.'), async ({page}) => {
  const example=card(page,'select','multiple'), root=example.locator('j3w1-select'), list=example.getByRole('listbox');
  await expect(list).toHaveAttribute('aria-multiselectable','true');
  await chooseOptions(list,['hdmi','edp']);expect(await root.evaluate(element=>element.values)).toEqual(['hdmi','edp']);
  await list.press('ControlOrMeta+a');expect(await root.evaluate(element=>element.values)).toHaveLength(4);
  await list.press('ControlOrMeta+a');expect(await root.evaluate(element=>element.values)).toEqual([]);
  await list.press('Home');await list.press(' ');expect(await root.evaluate(element=>element.values)).toEqual(['dp1']);
  await list.press('Shift+ArrowDown');expect(await root.evaluate(element=>element.values)).toEqual(['dp1','dp2']);
  await root.evaluate(element=>{const option=new Option('Additional output','extra');element.querySelector('select').append(option);});await expect(list.getByRole('option')).toHaveCount(5);
  await root.evaluate(element=>{element.values=['extra'];});await expect(list.locator('[data-choice-value="extra"]')).toHaveAttribute('aria-selected','true');
  await root.evaluate(element=>{const parent=element.parentElement;element.remove();parent.append(element);});await expect(example.getByRole('listbox')).toHaveCount(1);expect(await root.evaluate(element=>element.values)).toEqual(['extra']);
  const grouped=card(page,'select','with-groups'), groupedRoot=grouped.locator('j3w1-select');
  await groupedRoot.evaluate(element=>{element.querySelector('optgroup').disabled=true;});await grouped.getByRole('combobox').click();
  await expect(grouped.locator('[role="group"]').first().getByRole('option').first()).toHaveAttribute('aria-disabled','true');
  await grouped.getByRole('combobox').press('Escape');
});

test('themed date calendar supports typed constraints, keyboard picking and read-only state', scope('date-picker',['default','focus-visible','invalid','read-only'],['default','range'],'Theme-owned date editor and calendar; native limits and date-range ordering remain authoritative.'), async ({page}) => {
  const example=card(page,'date-picker'), root=example.locator('j3w1-date-picker'), input=example.getByRole('textbox',{name:'Release date',exact:true});
  await expect(input).toHaveValue('2026-09-06');await expect(example.locator('input[type="date"]')).toBeHidden();
  await input.press('Alt+ArrowDown');const calendar=example.getByRole('dialog',{name:'Choose date',exact:true});await expect(calendar).toBeVisible();
  await expect(calendar.locator('[data-date="2026-09-06"]')).toBeFocused();await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await expect(input).toHaveValue('2026-09-07');await expect(input).toBeFocused();
  expect(await root.evaluate(element=>element.value)).toBe('2026-09-07');
  await input.fill('2027-01-01');await input.press('Tab');expect(await root.evaluate(element=>element.reportValidity())).toBe(false);await expect(input).toHaveAttribute('aria-invalid','true');
  await input.fill('2026-09-08');await input.press('Tab');expect(await root.evaluate(element=>element.reportValidity())).toBe(true);
  await input.press('Alt+ArrowDown');expect((await new AxeBuilder({page}).include('.gallery-card[data-component="date-picker"][data-variant="default"]').analyze()).violations).toEqual([]);await page.keyboard.press('Escape');await expect(input).toBeFocused();
  await root.evaluate(element=>{const form=document.createElement('form');form.id='external-date-form';element.ownerDocument.body.append(form);const native=element.querySelector('input[type="date"]');native.name='release';native.setAttribute('form',form.id);});
  await expect(input).toHaveAttribute('form','external-date-form');await input.fill('not-a-date');await input.press('Tab');expect(await page.locator('#external-date-form').evaluate(form=>form.checkValidity())).toBe(false);
  await page.locator('#external-date-form').evaluate(form=>form.reset());await expect(input).toHaveValue('2026-09-06');expect(await page.locator('#external-date-form').evaluate(form=>Object.fromEntries(new FormData(form)))).toEqual({release:'2026-09-06'});
  await root.evaluate(element=>{const label=document.createElement('span');label.id='alternate-date-label';label.textContent='Alternate date';element.append(label);element.querySelector('input[type="date"]').setAttribute('aria-labelledby',label.id);});
  await expect(example.locator('.j3w1-temporal-input')).toHaveAccessibleName('Alternate date');
  await root.evaluate(element=>element.querySelector('input[type="date"]').removeAttribute('aria-labelledby'));await expect(input).toHaveAccessibleName('Release date');
  await root.evaluate(element=>{element.readOnly=true;});await expect(input).toHaveAttribute('readonly','');await expect(example.getByRole('button',{name:'Open calendar',exact:true})).toBeHidden();
  const range=card(page,'date-picker','range');await range.getByRole('textbox',{name:'To',exact:true}).fill('2026-08-31');await range.getByRole('textbox',{name:'To',exact:true}).press('Tab');expect(await range.locator('j3w1-date-picker').evaluate(element=>element.reportValidity())).toBe(false);
});

test('themed time entry applies native step and rejects invalid or out-of-range text', scope('time-picker',['default','invalid','disabled'],['default'],'No native clock popup; typed values and themed step buttons retain native constraints.'), async ({page}) => {
  const example=card(page,'time-picker'), root=example.locator('j3w1-time-picker'), input=example.getByRole('textbox',{name:'Start time',exact:true});
  await expect(input).toHaveValue('09:30');await expect(example.locator('input[type="time"]')).toBeHidden();
  await example.getByRole('button',{name:'Increase time',exact:true}).click();await expect(input).toHaveValue('09:35');
  await example.getByRole('button',{name:'Decrease time',exact:true}).click();await expect(input).toHaveValue('09:30');
  await input.fill('25:99');await input.press('Tab');expect(await root.evaluate(element=>element.reportValidity())).toBe(false);await expect(input).toHaveAttribute('aria-invalid','true');
  await input.fill('09:32');await input.press('Tab');expect(await root.evaluate(element=>element.reportValidity())).toBe(false);
  await input.fill('10:00');await input.press('Tab');expect(await root.evaluate(element=>element.reportValidity())).toBe(true);expect(await root.evaluate(element=>element.value)).toBe('10:00');
  await root.evaluate(element=>{element.disabled=true;});await expect(input).toBeDisabled();await expect(example.getByRole('button',{name:'Increase time',exact:true})).toBeDisabled();
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
  for (const kind of ["text", "textarea", "select", "checkbox", "radio"]) { await chooseOptions(example.getByRole("combobox", { name: "Field type", exact: true }), kind); await example.getByRole("button", { name: "Add field", exact: true }).click(); await example.getByRole("button", { name: "Save field definition", exact: true }).click(); }
  const before = await root.evaluate(element => element.exportDefinition());
  expect(JSON.parse(before).fields.map(field => field.type)).toEqual(["text", "textarea", "select", "checkbox", "radio"]);
  expect(await root.evaluate(element => element.importDefinition('{"unsupported":true}'))).toBe(false);
  expect(await root.evaluate(element => element.exportDefinition())).toBe(before);
  await root.evaluate(element => { const parent = element.parentElement; element.remove(); parent.append(element); });
  expect(await root.evaluate(element => element.exportDefinition())).toBe(before);
});
