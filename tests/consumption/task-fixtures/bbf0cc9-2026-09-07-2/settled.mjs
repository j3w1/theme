import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:320,height:568}});const page=await context.newPage();
await page.goto(pathToFileURL(path.resolve('.cache/task-kit-acceptance/composed-output-corrected/result.html')).href);
await page.locator('#display-name').fill('Long'.repeat(150));await page.locator('#save').click();
await page.locator('dialog').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished));});
const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
const focus=[];for(let i=0;i<8;i++){focus.push(await page.evaluate(()=>({id:document.activeElement.id,tag:document.activeElement.tagName,classes:document.activeElement.className})));await page.keyboard.press('Tab');}
await page.locator('#close').focus();await page.keyboard.press('Tab');const focusedBody=await page.evaluate(()=>({classes:document.activeElement.className,outline:getComputedStyle(document.activeElement).outline,offset:getComputedStyle(document.activeElement).outlineOffset}));
const before=await page.locator('.dialog-body').evaluate(e=>e.scrollTop);for(let i=0;i<3;i++)await page.keyboard.press('PageDown');await page.waitForTimeout(300);const after=await page.locator('.dialog-body').evaluate(e=>e.scrollTop);
await page.keyboard.press('Home');await page.waitForFunction(()=>document.querySelector('.dialog-body').scrollTop===0);const home=await page.locator('.dialog-body').evaluate(e=>e.scrollTop);
await page.emulateMedia({forcedColors:'active'});const forced=await page.locator('.dialog-body').evaluate(e=>{const c=getComputedStyle(e),probe=document.createElement('span');probe.style.color='Highlight';document.body.append(probe);const highlight=getComputedStyle(probe).color;probe.remove();return {color:c.outlineColor,style:c.outlineStyle,width:c.outlineWidth,offset:c.outlineOffset,highlight,focused:e===document.activeElement};});await page.emulateMedia({forcedColors:'none'});
const result={settlement:'Awaited all dialog animations without modifying candidate',violations:axe.violations,incomplete:axe.incomplete.map(x=>({id:x.id,nodes:x.nodes.length})),focusCycle:focus,focusedBody,forced,keyboardScroll:{before,after,home},body:await page.locator('.dialog-body').evaluate(e=>({tabIndex:e.tabIndex,role:e.getAttribute('role'),name:e.getAttribute('aria-label'),clientHeight:e.clientHeight,scrollHeight:e.scrollHeight})),opacity:await page.locator('dialog').evaluate(e=>getComputedStyle(e).opacity)};
await page.screenshot({path:'.cache/task-kit-acceptance/composed-review-corrected/settled-narrow-modal.png'});await browser.close();fs.writeFileSync('.cache/task-kit-acceptance/composed-review-corrected/settled.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));

