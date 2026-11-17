import { test, expect } from './evidence-fixture.mjs';
import { verification } from './verification.mjs';
import { chooseOptions } from '../ui/choice-helper.mjs';

const scope = verification({
  component: 'select', category: 'enhancements',
  states: ['default'],
  variants: ['default', 'multiple'],
  note: 'Choice test helper only, with default-root scope: real native selects and public progressive enhancement, including a controlled locator-query boundary, single/multiple selection, and popup expansion/collapse. These functional protocols do not claim additional catalogue root states. No manual accessibility or comprehensive state coverage claim.',
});

async function fixture(page) {
  await page.goto('./');
  await page.setContent(`<html><head>
    <link rel="stylesheet" href="/theme/ui/tokens.css">
    <link rel="stylesheet" href="/theme/ui/styles/controls.css">
    </head><body><main><form>
    <label for="destination">Destination</label>
    <select id="destination" name="destination"><option value="one">First</option><option value="two">Second</option></select>
    <label for="features">Features</label>
    <select id="features" name="features" multiple><option value="a" selected>Alpha</option><option value="b">Beta</option></select>
    </form></main></body></html>`);
}

const enhance = page => page.evaluate(async () => {
  const { enhanceControls } = await import('/theme/ui/enhance/choice.js');
  enhanceControls(document.querySelector('main'));
});
const values = page => page.locator('form').evaluate(form => [...new FormData(form)]);

test('choice helper exercises the visible native single and multiple fallbacks', scope, async ({ page }) => {
  await fixture(page);
  await chooseOptions(page.getByLabel('Destination', { exact: true }), 'two');
  await chooseOptions(page.getByLabel('Features', { exact: true }), ['a', 'b']);
  expect(await values(page)).toEqual([['destination', 'two'], ['features', 'a'], ['features', 'b']]);
  await expect(page.locator('select:visible')).toHaveCount(2);
});

test('choice helper resolves labels, open popups and hidden native sources', scope, async ({ page }, info) => {
  test.skip(info.project.name === 'nojs', 'The native fallback is exercised separately without JavaScript.');
  await fixture(page);
  await page.locator('#destination').evaluate(select => select.setAttribute('aria-label', 'Destination'));
  await enhance(page);
  const source = page.getByLabel('Destination', { exact: true });
  await expect(source).toHaveCount(3);
  await page.getByRole('combobox', { name: 'Destination', exact: true }).click();
  await chooseOptions(source, 'two');
  await chooseOptions(page.locator('#destination'), 'one');
  await chooseOptions(page.getByLabel('Features', { exact: true }), ['b']);
  await chooseOptions(page.locator('#features'), ['a', 'b']);
  expect(await values(page)).toEqual([['destination', 'one'], ['features', 'a'], ['features', 'b']]);
  await expect(page.getByRole('combobox', { name: 'Destination', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('select:visible')).toHaveCount(0);
});

// Synchronize enhancement at the lookup boundary, without replacing DOM,
// query results, or actions. The old helper sees count=1 and then evaluates
// the now-ambiguous label. Derived locators retain the same boundary hook so
// a resolver that narrows before querying exercises the enhanced controls too.
function duringEnhancement(locator, start) {
  return new Proxy(locator, {
    get(target, key) {
      if (key === 'count') return async () => {
        const count = await target.count();
        await start();
        return count;
      };
      if (key === 'evaluate' || key === '_expect') return async (...args) => {
        await start();
        return target[key](...args);
      };
      if (['and', 'or', 'filter', 'locator'].includes(key)) return (...args) => duringEnhancement(target[key](...args), start);
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

test('choice helper survives the one-to-two label transition during enhancement', scope, async ({ page }, info) => {
  test.skip(info.project.name === 'nojs', 'Progressive enhancement requires JavaScript.');
  await fixture(page);
  const source = page.getByLabel('Destination', { exact: true });
  const transition = [];
  let started;
  const start = () => started ??= (async () => {
    transition.push(await source.count());
    await enhance(page);
    transition.push(await source.count());
  })();
  await chooseOptions(duringEnhancement(source, start), 'two');
  expect(transition).toEqual([1, 2]);
  expect(await values(page)).toEqual([['destination', 'two'], ['features', 'a']]);
  await expect(page.getByRole('combobox', { name: 'Destination', exact: true })).toHaveAttribute('aria-expanded', 'false');
});

test('choice helper rejects two visible eligible controls with the same label', scope, async ({ page }) => {
  await fixture(page);
  await page.locator('form').evaluate(form => {
    const label = document.createElement('label');
    label.htmlFor = 'other-destination';
    label.textContent = 'Destination';
    const select = document.createElement('select');
    select.id = label.htmlFor;
    select.append(new Option('First', 'one'), new Option('Second', 'two'));
    form.append(label, select);
  });
  await expect(page.getByLabel('Destination', { exact: true })).toHaveCount(2);
  await expect(chooseOptions(page.getByLabel('Destination', { exact: true }), 'two')).rejects.toThrow(/strict mode violation/);
  await expect(page.locator('#destination')).toHaveValue('one');
  await expect(page.locator('#other-destination')).toHaveValue('one');
});

test('choice helper rejects a hidden native source with no themed companion', scope, async ({ page }, info) => {
  test.skip(info.project.name === 'nojs', 'Progressive enhancement requires JavaScript.');
  await fixture(page);
  await enhance(page);
  await page.locator('#destination').evaluate(select => select.nextElementSibling.remove());
  await expect(chooseOptions(page.locator('#destination'), 'two')).rejects.toThrow(/toBeVisible/);
  await expect(page.locator('#destination')).toHaveValue('one');
});

for (const [name, value] of [['Destination', 'two'], ['Features', ['b']]]) {
  test(`choice helper rejects the ${name} themed control without its stable id`, scope, async ({ page }, info) => {
    test.skip(info.project.name === 'nojs', 'Progressive enhancement requires JavaScript.');
    await fixture(page);
    await enhance(page);
    const control = page.getByRole(name === 'Destination' ? 'combobox' : 'listbox', { name, exact: true });
    await control.evaluate(element => element.removeAttribute('id'));
    await expect(chooseOptions(control, value)).rejects.toThrow(/Themed control has a stable identity/);
    expect(await values(page)).toEqual([['destination', 'one'], ['features', 'a']]);
  });
}
