// DealBeacon screenshot script: renders the real site with Playwright and
// takes 4 screenshots (cover, filtered view, detail view, phone view).
// Run after `node serve.ts` is up on http://localhost:8080.

import { chromium } from '/home/hatch/workspace/BeefTV-inspect/web/node_modules/playwright/index.mjs';

const base = 'http://localhost:8080';
const out = new URL('./screenshots/', import.meta.url).pathname;

const browser = await chromium.launch({ executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome', args: ['--no-sandbox'] });

// 1. Cover: desktop grid, best-value sort (default), many deals visible.
const cover = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await cover.goto(base + '/', { waitUntil: 'networkidle' });
await cover.waitForSelector('.card', { timeout: 10000 });
await cover.waitForTimeout(400);
await cover.screenshot({ path: out + '1-cover.jpg', type: 'jpeg', quality: 80 });
console.log('1-cover.jpg done');

// 2. Filtered view: search "Dyson" + 40%+ filter, showing search/filter work.
const filtered = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await filtered.goto(base + '/', { waitUntil: 'networkidle' });
await filtered.waitForSelector('.card', { timeout: 10000 });
await filtered.fill('#search-box', 'Dyson');
await filtered.selectOption('#discount-select', '40');
await filtered.waitForTimeout(400);
const count = await filtered.locator('.card').count();
console.log('filtered Dyson 40%+ cards:', count);
await filtered.screenshot({ path: out + '2-filtered.jpg', type: 'jpeg', quality: 80 });
console.log('2-filtered.jpg done');

// 3. Detail view: AirPods Pro 3 detail, showing evidence + source + check time.
const detail = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await detail.goto(base + '/#/deal/airpods-pro-3', { waitUntil: 'networkidle' });
await detail.waitForSelector('#deal-detail:not([hidden])', { timeout: 10000 });
await detail.waitForTimeout(600);
await detail.screenshot({ path: out + '3-detail.jpg', type: 'jpeg', quality: 80 });
console.log('3-detail.jpg done');

// 4. Phone view: 390x844 grid.
const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await phone.goto(base + '/', { waitUntil: 'networkidle' });
await phone.waitForSelector('.card', { timeout: 10000 });
await phone.waitForTimeout(400);
await phone.screenshot({ path: out + '4-phone.jpg', type: 'jpeg', quality: 80 });
console.log('4-phone.jpg done');

await browser.close();
console.log('all screenshots done');
