import { chooseOptions } from "../ui/choice-helper.mjs";
import { test, expect } from "./evidence-fixture.mjs";
import AxeBuilder from "@axe-core/playwright";
import { openSpec } from "./helpers.mjs";
import { hashDestinations } from "../../apps/demo/src/navigation.js";
import { readJson } from "../../scripts/lib/fs.mjs";
const annotation = { type: "verification", description: JSON.stringify({ component: "page", category: "enhancements", states: [], variants: [], note: "Portal navigation, canonical reference migration, per-component runtime loading, static normative content, and local Vue workflows. Automated desktop/narrow/no-JS scopes only; no manual accessibility claim." }) };
test("portal retains specification content and opens its compact command utility", { annotation }, async ({ page }, info) => {
  const audit = await openSpec(page, "./");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The j3w1 UI theme");
  await expect(page.getByRole("link", { name: "Explore components →", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  if (info.project.name !== "nojs") {
    await page.getByRole("button", { name: "Search the design system", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("combobox").fill("components");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/components\/$/);
  } else {
    await page.getByRole("link", { name: "Explore components →", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Components");
  }
  audit.assertClean();
});
test("legacy homepage hashes migrate to the complete reference", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name === "nojs", "No-JS readers use the static full-reference link; automatic hash migration requires JavaScript.");
  await page.goto("./#c-dialog");
  await expect(page).toHaveURL(/\/reference\/#c-dialog$/);
  await expect(page.locator("#c-dialog")).toBeVisible();
});

test("global command search loads once and finds components, token swatches and decisions", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name === "nojs", "The enhanced search requires scripts; static navigation remains available.");
  let indexRequests = 0;
  page.on("request", request => { if (request.url().endsWith("/theme/search.json")) indexRequests++; });
  await page.goto("./", { waitUntil: "networkidle" });
  expect(indexRequests).toBe(0);
  const opener = page.getByRole("button", { name: "Search the design system", exact: true });
  await opener.focus();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  const query = dialog.getByRole("combobox");
  await query.fill("color.text.default");
  const token = dialog.getByRole("option", { name: /color.text.default/ });
  await expect(token).toContainText("#e99499");
  await expect(token.locator(".hex-swatch")).toHaveCount(1);
  await expect(query).toHaveAttribute("aria-activedescendant", await token.getAttribute("id"));
  if (info.project.name === "desktop") expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await query.fill("D-024");
  await expect(dialog.getByRole("option")).toHaveCount(1);
  await expect(dialog.getByRole("option")).toContainText("Distinguish links");
  await query.fill("no-such-command-12345");
  await expect(dialog.getByRole("option")).toHaveCount(0);
  await expect(dialog.getByRole("status")).toHaveText("0 commands");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await opener.click();
  await query.fill("text-field");
  await expect(dialog.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/components\/text-field\/$/);
  expect(indexRequests).toBe(1);
});
test("a component page exposes live behavior, API and canonical rules without catalogue-wide scripts", { annotation }, async ({ page }, info) => {
  const requests = []; page.on("request", request => requests.push(request.url()));
  const audit = await openSpec(page, "components/dialog/");
  await expect(page.getByRole("heading", { name: "Public API", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Canonical specification", exact: true })).toBeVisible();
  expect(requests.some(url => /\/ui\/register\.js$/.test(url))).toBe(false);
  if(info.project.name!=="nojs") { const opener=page.getByRole("button",{name:"Open dialog",exact:true}).first();await opener.click();await expect(page.locator("dialog:modal")).toBeVisible();await page.keyboard.press("Escape");await expect(opener).toBeFocused(); }
  audit.assertClean();
});
test("portal overview meets the automated accessibility scan", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name!=="desktop", "One automated scan; responsive and no-JS behavior are checked separately.");
  await openSpec(page,"./");
  expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);
});
test("Vue records support list, edit, validation, detail and reset", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name==="nojs", "The explicitly client-rendered Vue application requires JavaScript; the portal remains static.");
  const audit=await openSpec(page,"demo/#/records/products");
  await page.getByRole("searchbox",{name:"Search products"}).fill("Atlas");
  await page.getByRole("link",{name:"Atlas product",exact:true}).click();
  await page.getByRole("link",{name:"Edit record →"}).click();
  const name=page.getByRole("textbox",{name:"Product name"});await name.fill("");await page.getByRole("button",{name:"Save product",exact:true}).click();
  expect(await name.evaluate(input=>input.validity.valueMissing)).toBe(true);await page.keyboard.press("Escape");
  await name.fill("Atlas edited locally");await page.getByRole("button",{name:"Save product",exact:true}).click();
  await expect(page.getByRole("heading",{level:1})).toHaveText("Atlas edited locally");
  await page.getByRole("button",{name:"Reset demo ↻"}).click();await expect(page.getByRole("heading",{level:1})).toHaveText("Atlas product");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);audit.assertClean();
});
test("every Vue destination resolves under the Pages base and graph bars use canonical red", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name==="nojs", "The Vue application requires JavaScript; all desktop, narrow and zoom configurations traverse its destinations.");
  const audit=await openSpec(page,"demo/#/dashboards/analytics");
  const tokens=await readJson("exports/tokens.resolved.json");
  const red=tokens.profiles[tokens.defaultProfile].tokens["color.chart.series-2"].css;
  const rgb=red.replace(/^#/,"").match(/../g).map(value=>Number.parseInt(value,16));
  await expect(page.locator("j3w1-chart .chart-series")).toHaveCSS("fill",`rgb(${rgb.join(", ")})`);
  const color = path => { const hex=tokens.profiles[tokens.defaultProfile].tokens[path].css; return `rgb(${hex.slice(1).match(/../g).map(value=>Number.parseInt(value,16)).join(", ")})`; };
  const link=page.getByRole("link",{name:"Open the work board →"});
  await expect(link).toHaveCSS("color",color("color.text.link"));
  await expect(link).toHaveCSS("text-decoration-line","underline");
  await expect(page.locator("main h1")).toHaveCSS("color",color("color.text.prose"));
  await expect(page.locator("j3w1-chart thead th").first()).toHaveCSS("color",color("color.text.bright"));
  await expect(page.locator("j3w1-chart tbody th").first()).toHaveCSS("color",color("color.text.default"));
  await link.hover();await expect(link).toHaveCSS("color",color("color.text.link-hover"));
  for(const destination of hashDestinations) {
    await page.goto(`demo/#${destination}`);
    await expect(page.locator(".demo-topline")).toContainText(`Workspace / ${destination.split('/').filter(Boolean).join(' / ')}`);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".demo-specimen:empty")).toHaveCount(0);
    await expect(page.locator('select:visible')).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).not.toContainText("Unknown component");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for(const href of await page.locator('.demo-sidebar nav a').evaluateAll(nodes=>nodes.map(node=>node.href)))expect(new URL(href).pathname).toBe("/theme/demo/");
  }
  await page.locator('.demo-command [data-open]').click();
  const command = page.locator('.demo-command').getByRole('dialog');
  await command.getByRole('combobox').fill('analytics');
  await expect(command.getByRole('option')).toHaveCount(1);
  if (info.project.name === 'desktop') expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.keyboard.press('Enter');
  await expect(page.locator('.demo-topline')).toContainText('Workspace / dashboards / analytics');
  audit.assertClean();
});

test("agent-kit selection prepares bounded framework and mode commands", { annotation }, async ({ page }, info) => {
  test.skip(info.project.name==="nojs","No-JS readers receive the complete static command and canonical instructions.");
  await openSpec(page,"agents/?component=dialog");
  const command=page.locator("[data-kit-command]");
  await expect(command).toContainText("--components dialog --framework vue --mode package");
  await chooseOptions(page.getByRole("combobox",{name:"Framework",exact:true}), "native");
  await expect(command).toContainText("--framework native --mode mapping");
  await chooseOptions(page.getByRole("combobox",{name:"Framework",exact:true}), "vue");
  await chooseOptions(page.getByRole("combobox",{name:"Consumption mode",exact:true}), "copy");
  await chooseOptions(page.getByRole("listbox",{name:"Components",exact:true}), ["text-field","button"]);
  await expect(command).toContainText("--mode copy");await expect(command).not.toContainText("dialog");
  await expect(page.locator('select:visible')).toHaveCount(0);
});

test('standalone public control enhancement preserves forms and restores native fallback', {annotation}, async ({page},info) => {
  test.skip(info.project.name==='nojs','The public enhancement requires JavaScript; static fallback is retained on destruction.');
  await page.goto('./');
  await page.setContent(`<html><head><link rel="stylesheet" href="/theme/ui/tokens.css"><link rel="stylesheet" href="/theme/ui/styles/controls.css"><style>select{display:block}</style></head><body><main><form><label for="standalone-choice">Destination</label><select id="standalone-choice" name="destination"><option value="one">First</option><option value="two">Second</option></select><label for="standalone-multiple">Features</label><select id="standalone-multiple" name="features" multiple><option value="a">Alpha</option><option value="b">Beta</option></select></form><button id="destroy" type="button">Restore controls</button></main></body></html>`);
  await page.evaluate(async()=>{const {enhanceControls}=await import('/theme/ui/enhance/choice.js');const controller=enhanceControls(document.querySelector('main'));document.querySelector('#destroy').addEventListener('click',()=>controller.destroy());});
  await expect(page.locator('select:visible')).toHaveCount(0);
  await chooseOptions(page.getByRole('combobox',{name:'Destination',exact:true}),'two');
  await chooseOptions(page.getByRole('listbox',{name:'Features',exact:true}),['a','b']);
  expect(await page.locator('form').evaluate(form=>[...new FormData(form)])).toEqual([['destination','two'],['features','a'],['features','b']]);
  await page.getByRole('button',{name:'Restore controls',exact:true}).click();
  await expect(page.locator('select:visible')).toHaveCount(2);await expect(page.locator('.j3w1-choice')).toHaveCount(0);
  await expect(page.getByLabel('Destination',{exact:true})).toHaveValue('two');
});

test('themed task choices move the card and retain keyboard focus', {annotation}, async ({page},info) => {
  test.skip(info.project.name==='nojs','The Vue workflow requires JavaScript; native control fallback is verified separately.');
  const audit=await openSpec(page,'demo/#/apps/kanban');
  const name='Move Review native form flow';
  await chooseOptions(page.getByRole('combobox',{name,exact:true}),'Review');
  await expect(page.locator('.kanban > section').filter({has:page.getByRole('heading',{name:'Review',exact:true,level:2})})).toContainText('Review native form flow');
  await expect(page.getByRole('combobox',{name,exact:true})).toBeFocused();
  await page.getByRole('combobox',{name,exact:true}).press('ArrowDown');
  await expect(page.getByRole('option',{name:'Review',exact:true})).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('Escape');audit.assertClean();
});
