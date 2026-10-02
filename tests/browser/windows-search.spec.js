import {readFileSync} from 'node:fs';
import {test,expect} from './evidence-fixture.mjs';
import {verification} from './verification.mjs';

const settings=JSON.parse(readFileSync(new URL('../../ports/windows/dist/windows-11-start-menu-styler.json',import.meta.url),'utf8'));
const tokens=JSON.parse(readFileSync(new URL('../../exports/tokens.resolved.json',import.meta.url),'utf8')).profiles.default.tokens;
const color=role=>`rgb(${tokens[role].value.components.map(x=>Math.round(x*255)).join(', ')})`;
const dimension=role=>`${tokens[role].value.value}${tokens[role].value.unit}`;
const css=settings.webContentStyles.map(rule=>`${rule.target}{${rule.styles.join(';')}}`).join('\n');
// Synthetic host fills deliberately conflict with the generated theme. This
// fixture exercises emitted CSS, never a native Search import or acceptance.
const specimen=`<html data-profile="default"><head><style>
 .suggestion {display:flex;max-width:100%;padding:8px;box-sizing:border-box}
 .details {background:GrayText;flex:1}.iconContainer {background:GrayText;padding:8px}
 .title,.secondaryText {background:GrayText}
 .leftPill::before {content:"";width:2px}
 </style><style>${css}</style></head><body class="darkTheme">
 <div class="suggestion leftPill" role="option" aria-selected="false" tabindex="0">
 <div class="iconContainer">Icon</div><div class="details"><div class="title">Sample application</div><div class="secondaryText">Application</div></div>
 </div><button>Outside</button><div class="previewContainer" tabindex="0">Preview</div>
 </body></html>`;
const fill=page=>page.locator('.suggestion, .details, .iconContainer, .title, .secondaryText').evaluateAll(elements=>elements.map(element=>getComputedStyle(element).backgroundColor));

test('Search result fill follows hover and selection without separate child rectangles',verification({component:'list',category:'appearance',states:['default','hover','selected'],variants:[],note:'Generated Search WebView CSS on synthetic markup. Covers hover exit, selection, selected hover and deselection; does not exercise native Search admission or host navigation.'}),async({page})=>{
 await page.setContent(specimen);
 const row=page.getByRole('option'),outside=page.getByRole('button',{name:'Outside'});
 await outside.hover();expect(await fill(page)).toEqual(Array(5).fill(color('color.surface.canvas')));
 await row.hover();expect(await fill(page)).toEqual(Array(5).fill(color('color.interaction.hover.bg')));
 await outside.hover();expect(await fill(page)).toEqual(Array(5).fill(color('color.surface.canvas')));
 await row.evaluate(element=>element.setAttribute('aria-selected','true'));
 expect(await fill(page)).toEqual(Array(5).fill(color('color.interaction.selection.bg')));
 await row.hover();expect(await fill(page)).toEqual(Array(5).fill(color('color.interaction.selection.bg')));
 for(const selector of ['.title','.secondaryText'])
  expect(await page.locator(selector).evaluate(element=>getComputedStyle(element).color)).toBe(color('color.interaction.selection.text'));
 expect(await row.evaluate(element=>getComputedStyle(element,'::before').backgroundColor)).toBe(color('color.border.active'));
 await row.evaluate(element=>element.setAttribute('aria-selected','false'));
 await outside.hover();expect(await fill(page)).toEqual(Array(5).fill(color('color.surface.canvas')));
 await expect(row).toHaveAttribute('aria-selected','false');await expect(row).toHaveAttribute('tabindex','0');
});

test('Search selection retains the control focus ring and preview retains its container ring',verification({component:'list',category:'keyboard',states:['focus-visible','selected+focus-visible'],variants:[],note:'Synthetic keyboard focus with generated Search CSS. Checks existing focus targets and approved control/container ring mappings; not a native Search keyboard protocol.'}),async({page})=>{
 await page.setContent(specimen);
 const row=page.getByRole('option');await row.evaluate(element=>element.setAttribute('aria-selected','true'));
 await page.keyboard.press('Tab');await expect(row).toBeFocused();
 const outline=locator=>locator.evaluate(element=>{const style=getComputedStyle(element);return {color:style.outlineColor,width:style.outlineWidth,offset:style.outlineOffset,style:style.outlineStyle};});
 expect(await outline(row)).toEqual({color:color('color.interaction.focus.ring'),width:dimension('border.width.default'),offset:dimension('focus.offset'),style:'dashed'});
 expect(await fill(page)).toEqual(Array(5).fill(color('color.interaction.selection.bg')));
 await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Outside'})).toBeFocused();
 await page.keyboard.press('Tab');const preview=page.locator('.previewContainer');await expect(preview).toBeFocused();
 expect(await outline(preview)).toEqual({color:color('color.interaction.focus.ring-container'),width:dimension('border.width.emphasis'),offset:dimension('focus.offset-container'),style:'solid'});
 await page.emulateMedia({forcedColors:'active'});
 expect(await preview.evaluate(element=>getComputedStyle(element).forcedColorAdjust)).toBe('auto');
 expect((await outline(preview)).color).not.toBe(color('color.interaction.focus.ring-container'));
});
