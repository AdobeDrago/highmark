/* eslint-disable */
/**
 * Captures ShopX pages (https://shop.highmark.com/...) as static pages for the
 * shop importers (generalises capture-shop-home.mjs to any ShopX URL).
 *
 * ShopX is an Angular SPA; many pages show an "Information Needed!" ZIP/county
 * modal and keep their main region empty until it is filled, and some keep it empty
 * without showing the modal. This script sets the ZIP on the home page first (default
 * 15222 / ALLEGHENY, Western PA), fills the modal again if a page shows it, waits for
 * the main region, and saves it (scripts and inline styles removed, URLs absolute,
 * CSS background images kept as data-bg) to
 * tools/importer/snapshots/shop/<source path without .html>.html, plus a
 * full-page screenshot next to it (.png). The page's header is kept too (in <header>):
 * some ShopX pages have their own header title and nav.
 *
 * Usage (playwright from the excat content-import skill):
 *   NODE_PATH=<excat-content-import>/scripts/node_modules \
 *     node tools/importer/snapshots/capture-shop-page.mjs <url> [url ...] [--zip=15222] [--county=ALLEGHENY]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (name, def) => (args.find((a) => a.startsWith(`--${name}=`)) || '').split('=')[1] || def;
const zip = opt('zip', '15222');
const county = opt('county', 'ALLEGHENY');
const urls = args.filter((a) => !a.startsWith('--'));
const OUT_ROOT = 'tools/importer/snapshots/shop';

const browser = await chromium.launch();

async function passGate(page) {
  const zipBox = page.getByRole('textbox', { name: 'Zip Code' });
  if (!(await zipBox.isVisible().catch(() => false))) return false;
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
  return true;
}

// Some pages (e.g. /info-pages/legal-policies) show no ZIP modal but only render their
// body once a ZIP is stored, so the ZIP is set once on the home page first.
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const home = await context.newPage();
await home.goto('https://shop.highmark.com/home.html', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await home.waitForTimeout(3000);
await passGate(home);
await home.waitForTimeout(4000);
await home.close();

for (const source of urls) {
  const page = await context.newPage();
  await page.goto(source, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await passGate(page);
  await page.waitForFunction(() => {
    const r = document.querySelector('[aria-label="Main"]') || document.querySelector('main');
    return r && r.innerText.trim().length > 50;
  }, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  // dismiss the cookie banner so it isn't in the screenshot
  await page.evaluate(() => document.querySelector('#onetrust-consent-sdk')?.remove());

  const rel = new URL(source).pathname.replace(/\.html$/, '').replace(/\/$/, '/index');
  const outFile = path.join(OUT_ROOT, `${rel}.html`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await page.screenshot({ path: outFile.replace(/\.html$/, '.png'), fullPage: true });

  const { region, header, title, description, regionLabel } = await page.evaluate(() => {
    const r = document.querySelector('[aria-label="Main"]') || document.querySelector('main');
    const abs = (v) => { try { return new URL(v, location.href).href; } catch (e) { return v; } };
    const clean = (el) => {
      el.querySelectorAll('*').forEach((e) => {
        const bg = getComputedStyle(e).backgroundImage;
        if (bg && bg !== 'none' && /url\(/.test(bg)) e.setAttribute('data-bg', bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''));
      });
      const clone = el.cloneNode(true);
      clone.querySelectorAll('script, noscript, style, svg').forEach((e) => e.remove());
      clone.querySelectorAll('[src]').forEach((e) => e.setAttribute('src', abs(e.getAttribute('src'))));
      clone.querySelectorAll('[href]').forEach((e) => {
        const h = e.getAttribute('href');
        if (!/^(javascript:|#|mailto:|tel:)/.test(h)) e.setAttribute('href', abs(h));
      });
      clone.querySelectorAll('*').forEach((e) => [...e.attributes].forEach((a) => {
        if (/^(_ng|ng-|data-ng)/.test(a.name) || a.name === 'style') e.removeAttribute(a.name);
      }));
      return clone;
    };
    // the page's own header (title and nav differ on some ShopX pages, e.g. "Shop Dental Plans")
    const banner = document.querySelector('[aria-label="Banner"]');
    const head = banner?.closest('header') || banner?.parentElement?.parentElement;
    const label = [...document.querySelectorAll('h3')].map((h) => h.textContent.trim()).find((t) => /PA|NY|Delaware|West Virginia/.test(t)) || '';
    return {
      region: clean(r).outerHTML,
      header: head ? clean(head).outerHTML : '',
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content || '',
      regionLabel: label,
    };
  });
  await page.close();

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="source-url" content="${source}">
<meta name="captured" content="${new Date().toISOString()}; zip=${zip}; county=${county}; region=${regionLabel}">
</head><body><header>${header}</header><main>${region}</main></body></html>
`;
  fs.writeFileSync(outFile, html);
  console.log(`Saved ${outFile} (${html.length} bytes, region "${regionLabel}")`);
}
await context.close();
await browser.close();
