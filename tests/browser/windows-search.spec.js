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
 expect(await row.evaluate(element=>getComputedStyle(element,'::before').content)).toBe('none');
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

for(const layout of ['outer-container','inner-container','class-selection']) {
 test(`Search selection frame owns the whole result in ${layout}`,verification({component:'list',category:'appearance',states:['default','hover','selected','selected+focus-visible'],variants:[],note:'Generated CSS on synthetic nested Search markup, including the documented leftPill state. Checks full-row fill, a single reserved frame, selected hover, focus, hover exit and deselection. Native host appearance remains a separate acceptance check.'}),async({page})=>{
  const outer=layout==='inner-container'?'suggestion':'suggContainer';
  const inner=layout==='inner-container'?'suggContainer':'suggestion';
  const markup=`<html data-profile="default"><head><style>
   #result {width:360px;max-width:100%;box-sizing:border-box;padding:12px}
   .suggestion,.suggContainer,.iconContainer,.details,.title,.secondaryText {background:GrayText}
   #inner {display:flex}.details {flex:1}.iconContainer {padding:8px}
   .leftPill::before {content:"";position:absolute;width:2px;height:24px;background:GrayText}
  </style><style>${css}</style></head><body><div id="result" class="${outer}" role="option" tabindex="0" ${layout==='class-selection'?'':'aria-selected="false"'}><div id="inner" class="${inner}"><div class="iconContainer">Icon</div><div class="details"><div class="title">Sample application</div><div class="secondaryText">Application</div></div></div></div><button>Outside</button></body></html>`;
  await page.setContent(markup);
  const row=page.getByRole('option'),outside=page.getByRole('button',{name:'Outside'});
  const backgrounds=()=>page.locator('#result,#inner,.details,.iconContainer,.title,.secondaryText').evaluateAll(elements=>elements.map(element=>getComputedStyle(element).backgroundColor));
  const frame=()=>row.evaluate(element=>{const style=getComputedStyle(element);return {width:style.borderTopWidth,leadingWidth:style.borderInlineStartWidth,color:style.borderTopColor,leadingColor:style.borderInlineStartColor,style:style.borderTopStyle,radius:style.borderRadius};});
  await outside.hover();
  expect(await backgrounds()).toEqual(Array(6).fill(color('color.surface.canvas')));
  const before=await row.boundingBox();
  await row.hover();expect(await backgrounds()).toEqual(Array(6).fill(color('color.interaction.hover.bg')));
  await outside.hover();expect(await backgrounds()).toEqual(Array(6).fill(color('color.surface.canvas')));
  await row.evaluate((element,kind)=>{if(kind==='class-selection')element.classList.add('leftPill');else element.setAttribute('aria-selected','true');},layout);
  expect(await backgrounds()).toEqual(Array(6).fill(color('color.interaction.selection.bg')));
  expect(await frame()).toEqual({width:dimension('border.width.default'),leadingWidth:dimension('border.width.emphasis'),color:color('color.border.control'),leadingColor:color('color.border.selected-indicator'),style:'solid',radius:dimension('radius.none')});
  expect(await row.boundingBox()).toEqual(before);
  expect(await page.locator('#inner').evaluate(element=>getComputedStyle(element).borderTopStyle)).toBe('none');
  await row.hover();expect(await backgrounds()).toEqual(Array(6).fill(color('color.interaction.selection.bg')));
  await row.evaluate(element=>element.classList.add('leftPill'));
  expect(await row.evaluate(element=>getComputedStyle(element,'::before').content)).toBe('none');
  for(const selector of ['.title','.secondaryText'])expect(await page.locator(selector).evaluate(element=>getComputedStyle(element).color)).toBe(color('color.interaction.selection.text'));
  await page.keyboard.press('Tab');await expect(row).toBeFocused();
  expect(await row.evaluate(element=>{const style=getComputedStyle(element);return {color:style.outlineColor,width:style.outlineWidth,offset:style.outlineOffset,style:style.outlineStyle};})).toEqual({color:color('color.interaction.focus.ring'),width:dimension('border.width.default'),offset:dimension('focus.offset'),style:'dashed'});
  expect(await backgrounds()).toEqual(Array(6).fill(color('color.interaction.selection.bg')));
  // Explicit ARIA deselection defeats a stale host pill class.
  await row.evaluate(element=>element.setAttribute('aria-selected','false'));
  await outside.hover();expect(await backgrounds()).toEqual(Array(6).fill(color('color.surface.canvas')));
  expect((await frame()).color).toBe(color('color.surface.canvas'));
  expect(await row.boundingBox()).toEqual(before);
 });
}
