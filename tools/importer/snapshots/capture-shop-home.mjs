/* eslint-disable */
/**
 * Captures the ShopX home page (https://shop.highmark.com/home.html) after the
 * ZIP gate, for tools/importer/import-shop-home.js.
 *
 * The source is an Angular SPA whose main region stays empty until a ZIP and
 * county are entered, so a plain import gets nothing. This script fills the
 * "Information Needed!" modal, waits for the regional content, and saves the
 * main region (scripts and inline styles removed, URLs absolute) as a static
 * page the bulk importer can load.
 *
 * Usage (playwright from the excat content-import skill):
 *   NODE_PATH=<excat-content-import>/scripts/node_modules \
 *     node tools/importer/snapshots/capture-shop-home.mjs [zip] [county] [outFile]
 * Defaults: 15222, ALLEGHENY (Western PA), tools/importer/snapshots/shop/index.html
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [zip = '15222', county = 'ALLEGHENY', outFile = 'tools/importer/snapshots/shop/index.html'] = process.argv.slice(2);
const SOURCE = 'https://shop.highmark.com/home.html';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(SOURCE, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);

const zipBox = page.getByRole('textbox', { name: 'Zip Code' });
await zipBox.click();
await zipBox.pressSequentially(zip, { delay: 80 });
await page.waitForTimeout(2500);
const countyBox = page.getByRole('textbox', { name: 'County' });
if (!(await countyBox.inputValue()).trim()) {
  await countyBox.click();
  await countyBox.pressSequentially(county, { delay: 60 });
  await page.getByRole('option', { name: new RegExp(county, 'i') }).first().click().catch(() => {});
}
await page.getByRole('button', { name: 'Continue' }).click();
await page.waitForFunction(() => {
  const r = document.querySelector('[aria-label="Main"]');
  return r && r.innerText.trim().length > 200;
}, null, { timeout: 30000 });
await page.waitForTimeout(2000);

const { region, regionLabel } = await page.evaluate(() => {
  const r = document.querySelector('[aria-label="Main"]');
  const abs = (v) => { try { return new URL(v, location.href).href; } catch (e) { return v; } };
  // keep CSS background images (the hero's sneaker illustration) as data-bg
  r.querySelectorAll('*').forEach((e) => {
    const bg = getComputedStyle(e).backgroundImage;
    if (bg && bg !== 'none' && /url\(/.test(bg)) e.setAttribute('data-bg', bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''));
  });
  const clone = r.cloneNode(true);
  clone.querySelectorAll('script, noscript, style, svg').forEach((e) => e.remove());
  clone.querySelectorAll('[src]').forEach((e) => e.setAttribute('src', abs(e.getAttribute('src'))));
  clone.querySelectorAll('[href]').forEach((e) => {
    const h = e.getAttribute('href');
    if (!/^(javascript:|#|mailto:|tel:)/.test(h)) e.setAttribute('href', abs(h));
  });
  clone.querySelectorAll('*').forEach((e) => [...e.attributes].forEach((a) => {
    if (/^(_ng|ng-|data-ng)/.test(a.name) || a.name === 'style') e.removeAttribute(a.name);
  }));
  const label = [...document.querySelectorAll('h3')].map((h) => h.textContent.trim()).find((t) => /PA|NY|Delaware|West Virginia/.test(t)) || '';
  return { region: clone.outerHTML, regionLabel: label };
});
await browser.close();

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Shop | Home</title>
<meta name="description" content="Shop Highmark individual and family health plans. Enter your ZIP code and county to see personalized plan options and pricing.">
<meta name="source-url" content="${SOURCE}">
<meta name="captured" content="${new Date().toISOString()}; zip=${zip}; county=${county}; region=${regionLabel}">
</head><body><main>${region}</main></body></html>
`;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html);
console.log(`Saved ${outFile} (${html.length} bytes, region "${regionLabel}")`);
