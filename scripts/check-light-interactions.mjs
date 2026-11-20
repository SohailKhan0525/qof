import {chromium,expect} from '@playwright/test';
import {writeFile,mkdir}from'node:fs/promises';
const target=process.env.QOFENO_CHECK_URL||'https://qofeno-payments-test.sohailkhannn-0525.workers.dev';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],proxy:{server:process.env.HTTPS_PROXY}});
const context=await browser.newContext({viewport:{width:1440,height:1000},ignoreHTTPSErrors:true,colorScheme:'dark'});const page=await context.newPage();page.setDefaultTimeout(12000);const checks=[];const errors=[];const blocked=[];
page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',r=>{if(r.request().method()!=='GET'){blocked.push(new URL(r.request().url()).pathname);return r.abort()}return r.continue()});
const check=async(name,fn)=>{await fn();checks.push({name,passed:true});console.log('PASS '+name)};
await page.goto(target);await page.waitForTimeout(1800);
await check('Always light, even with dark device preference',async()=>{expect(await page.locator('html').evaluate(e=>getComputedStyle(e).colorScheme)).toBe('light')});
await check('Desktop navigation opens, closes and restores focus',async()=>{const btn=page.locator('.qofeno-header-trigger');await btn.click();await expect(btn).toHaveAttribute('aria-expanded','true');await page.waitForTimeout(900);await page.keyboard.press('Escape');await expect(btn).toHaveAttribute('aria-expanded','false');await expect(btn).toBeFocused()});
await check('Owner placement sits on the live board directly after the hero',async()=>{await expect(page.locator('.reference-hero + #board #qofeno-placement')).toContainText('Active · Owner placement');await expect(page.locator('#qofeno-placement a')).toHaveAttribute('href','https://loopproof.me/');await expect(page.locator('#discover,#take-a-look')).toHaveCount(0)});
await check('Ranking example opens and closes without payment',async()=>{const b=page.locator('.rank-demo-toggle button');await b.click();await expect(b).toHaveAttribute('aria-expanded','true');await expect(page.locator('#ranking-example')).toBeVisible();await b.click();await expect(b).toHaveAttribute('aria-expanded','false')});
await check('Checkout preview opens and closes without an order',async()=>{await page.locator('.qofeno-header-buy').click();await expect(page.locator('dialog[open]')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('dialog[open]')).toHaveCount(0)});
for(const route of ['/terms','/privacy','/refunds','/contact','/advertising-policy','/my-spot','/owner']){
 await check(route+' renders without horizontal overflow',async()=>{await page.goto(target+route);await page.waitForTimeout(750);await expect(page.locator('main')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(250, 249, 245)')});
}
await check('No client runtime errors',async()=>expect(errors).toEqual([]));
await mkdir('test-results/light-2026-11-20',{recursive:true});await writeFile('test-results/light-2026-11-20/interactions.json',JSON.stringify({target,checks,errors,blocked},null,2));await browser.close();console.log(checks.length+' checks passed.');
