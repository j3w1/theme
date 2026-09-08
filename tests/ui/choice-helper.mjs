import { expect } from '@playwright/test';

// Exercise the visible themed UI. Native fallback specimens still use the
// browser's real select interaction; no hidden-control or forced action bypass.
export async function chooseOptions(locator, values) {
  if (await locator.count() > 1) locator = locator.filter({ visible: true });
  if (await locator.evaluate(node => node.tagName === 'SELECT')) {
    if (await locator.isVisible()) return locator.selectOption(values);
    const id = await locator.evaluate(node => node.nextElementSibling?.querySelector('[role="combobox"],[role="listbox"]')?.id);
    expect(id, 'Hidden native select must have its themed control').toBeTruthy();
    locator = locator.page().locator(`[id=${JSON.stringify(id)}]`);
  }
  await expect(locator).toBeVisible();
  const wanted = (Array.isArray(values) ? values : [values]).map(String);
  if (await locator.getAttribute('role') === 'combobox') {
    expect(wanted).toHaveLength(1);
    await locator.click();
    const list = locator.page().locator(`[id=${JSON.stringify(await locator.getAttribute('aria-controls'))}]`);
    await list.locator(`[data-choice-value=${JSON.stringify(wanted[0])}]`).click();
    await expect(locator).toHaveAttribute('aria-expanded','false');
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
