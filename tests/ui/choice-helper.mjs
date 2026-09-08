import { expect } from '@playwright/test';

// Exercise the visible themed UI. Native fallback specimens still use the
// browser's real select interaction; no hidden-control or forced action bypass.
async function visibleControl(locator) {
  if (await locator.count() > 1) locator = locator.and(locator.page().locator('select,[role="combobox"],[role="listbox"][aria-multiselectable="true"]')).filter({ visible: true });
  if (await locator.evaluate(node => node.tagName === 'SELECT')) {
    if (await locator.isVisible()) return locator;
    const id = await locator.evaluate(node => node.nextElementSibling?.querySelector('[role="combobox"],[role="listbox"]')?.id);
    expect(id, 'Hidden native select must have its themed control').toBeTruthy();
    locator = locator.page().locator(`[id=${JSON.stringify(id)}]`);
  }
  await expect(locator).toBeVisible();
  return locator;
}

export async function chooseOptions(source, values) {
  let locator=await visibleControl(source);
  if(await locator.evaluate(node=>node.tagName==='SELECT'))return locator.selectOption(values);
  // A label also names the popup after it opens. Keep the resolved control's
  // identity stable while exercising the real trigger and options.
  const controlId=await locator.getAttribute('id');
  expect(controlId,'Themed control has a stable identity').toBeTruthy();
  locator=locator.page().locator(`[id=${JSON.stringify(controlId)}]`);
  const wanted = (Array.isArray(values) ? values : [values]).map(String);
  if (await locator.getAttribute('role') === 'combobox') {
    expect(wanted).toHaveLength(1);
    if(await locator.getAttribute('aria-expanded')!=='true')await locator.click();
    const list = locator.page().locator(`[id=${JSON.stringify(await locator.getAttribute('aria-controls'))}]`);
    await list.locator(`[data-choice-value=${JSON.stringify(wanted[0])}]`).click();
    await expect(list).toBeHidden();
    // Application selection can move a Vue card and replace its control.
    await expect(await visibleControl(source)).toHaveAttribute('aria-expanded','false');
  } else {
    const options = locator.getByRole('option');
    for(let index=0;index<await options.count();index++) {
      const option=options.nth(index), value=await option.getAttribute('data-choice-value');
      if ((await option.getAttribute('aria-selected') === 'true') !== wanted.includes(value)) await option.click();
    }
    const selected=await locator.locator('[role="option"][aria-selected="true"]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-choice-value')));
    expect([...selected].sort()).toEqual([...wanted].sort());
  }
}
