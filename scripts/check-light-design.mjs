import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile,writeFile,mkdir}from'node:fs/promises';
const target=process.env.QOFENO_CHECK_URL||'http://localhost:8787';const remote=!target.includes('localhost');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],...(remote?{proxy:{server:process.env.HTTPS_PROXY}}:{})});
const results=[];await mkdir('test-results/light-2026-11-20',{recursive:true});
for(const width of [1440,390,320]){
 const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},ignoreHTTPSErrors:true,colorScheme:'dark'});const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async r=>{if(r.request().method()!=='GET')return r.abort();if(remote)return r.continue();let n=new URL(r.request().url()).pathname.split('/').pop();try{await r.fulfill({contentType:'application/json',body:await readFile('tests/fixtures/'+n+'.json','utf8')})}catch{await r.continue()}});
 await page.goto(target);await page.waitForTimeout(2300);
 await page.screenshot({path:`test-results/light-2026-11-20/home-${width}.png`});
 const metrics=await page.evaluate(()=>({body:getComputedStyle(document.body).backgroundColor,scheme:getComputedStyle(document.documentElement).colorScheme,overflow:document.documentElement.scrollWidth>innerWidth}));
 await page.locator('.qofeno-header-trigger').click();await page.waitForTimeout(1200);
 await page.screenshot({path:`test-results/light-2026-11-20/menu-${width}.png`});
 const menuAxe=await new AxeBuilder({page}).include('.qofeno-header').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 await page.keyboard.press('Escape');await page.waitForTimeout(800);
 await page.locator('.product-tour').scrollIntoViewIfNeeded();await page.locator('.product-tour-chapter').first().click();await page.waitForTimeout(3000);
 for(const sel of ['.product-tour','.rank-board-section','.editorial-discovery','.placement-process','.questions-section','.reference-closing','.footer-stage']){await page.locator(sel).scrollIntoViewIfNeeded();await page.waitForTimeout(800);}
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 const overflows=await page.locator('body *').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.left>=0&&r.right>innerWidth+1&&r.height>0}).map(e=>({tag:e.tagName,cls:e.getAttribute('class'),text:e.textContent.slice(0,50)})).slice(0,20));
 results.push({width,metrics,overflows,errors,menuViolations:menuAxe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),violations:axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
 await page.screenshot({path:`test-results/light-2026-11-20/footer-${width}.png`});await context.close();
}
console.log(JSON.stringify(results,null,2));await writeFile('test-results/light-2026-11-20/design-audit.json',JSON.stringify(results,null,2));await browser.close();

if(results.some(r=>r.metrics.body!=='rgb(250, 249, 245)'||r.metrics.scheme!=='light'||r.metrics.overflow||r.overflows.length||r.errors.length||r.menuViolations.length||r.violations.length))process.exitCode=1;
