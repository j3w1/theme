import {readFileSync} from 'node:fs';
import {test,expect} from './evidence-fixture.mjs';
import {verification} from './verification.mjs';

const css=readFileSync(new URL('../../ports/windows/dist/markdown-theme.css',import.meta.url),'utf8');
const specimen=`<div class="container"><h1>Markdown reading specimen</h1><p>Rose prose with <strong>bold text</strong> and <code>inline code</code>.</p><h2>Second heading</h2><h3>Third heading</h3><ul><li>First item</li><li>Second item with a long phrase that must wrap within a narrow preview pane.</li></ul><pre><code>const veryLongSyntheticLine = '${'x'.repeat(100)}';</code></pre><blockquote><p>A quotation retains a separate edge and readable padding.</p></blockquote><table><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody><tr><td>Preview</td><td>Safe</td></tr></tbody></table></div>`;

test('Markdown CSS keeps canonical reading metrics and bounded preview reflow',verification({component:'page',category:'reflow',states:['default'],variants:[],note:'Generated PowerToys Markdown CSS with synthetic HTML at 320 and 600 CSS pixels. This checks layout, not PowerToys parsing, native admission or owner visual acceptance.'}),async({page})=>{
 for(const width of [320,600]){
  await page.setViewportSize({width,height:900});await page.setContent(`<html><head><style>${css}</style></head><body>${specimen}</body></html>`);
  const actual=await page.evaluate(()=>{
   const style=s=>{const v=getComputedStyle(document.querySelector(s));return {fontSize:v.fontSize,lineHeight:v.lineHeight,color:v.color,padding:v.padding,marginLeft:v.marginLeft};};
   return {body:style('body'),h1:style('h1'),h2:style('h2'),h3:style('h3'),strong:style('strong'),pre:style('pre'),quote:style('blockquote'),td:style('td'),
    overflow:document.documentElement.scrollWidth>innerWidth,codeOverflow:document.querySelector('pre').scrollWidth>document.querySelector('pre').clientWidth};
  });
  expect(actual.body.fontSize).toBe('15px');expect(actual.body.lineHeight).toBe('24px');expect(actual.body.color).toBe('rgb(233, 148, 153)');
  expect(actual.h1.fontSize).toBe('20px');expect(actual.h1.lineHeight).toBe('28px');expect(actual.h1.color).toBe('rgb(244, 238, 238)');
  expect(actual.h2.fontSize).toBe('16px');expect(actual.h3.fontSize).toBe('13px');expect(actual.strong.color).toBe(actual.body.color);
  expect(actual.pre.fontSize).toBe('13px');expect(actual.pre.padding).toBe('12px');expect(actual.quote.padding).toBe('8px 12px');expect(actual.quote.marginLeft).toBe('0px');
  expect(actual.td.padding).toBe('8px 12px');expect(actual.overflow).toBe(false);expect(actual.codeOverflow).toBe(true);
 }
});

test('Markdown CSS yields color choices to forced colors',verification({component:'page',category:'appearance',states:['default'],variants:[],note:'Synthetic HTML and generated Markdown CSS under browser forced colors; not a native Windows high-contrast transition test.'}),async({page})=>{
 await page.emulateMedia({forcedColors:'active'});await page.setContent(`<style>${css}</style>${specimen}`);
 expect(await page.evaluate(()=>matchMedia('(forced-colors: active)').matches)).toBe(true);
 expect(await page.locator('p').first().evaluate(el=>getComputedStyle(el).forcedColorAdjust)).toBe('auto');
 expect(await page.locator('p').first().evaluate(el=>getComputedStyle(el).color)).not.toBe('rgb(233, 148, 153)');
});
