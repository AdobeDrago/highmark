/* eslint-env node */
/* eslint-disable no-console */
// Region layer: ZIP/county modal, county choice, stored selection, location line, region links.
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const HOST = process.env.HOST || 'http://localhost:3100';
const OUT = path.join(HERE, 'shots');
let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

async function open(b, width = 1280, init = null, arg = undefined) {
  const ctx = await b.newContext({ viewport: { width, height: 900 } });
  if (init) await ctx.addInitScript(init, arg);
  const pg = await ctx.newPage();
  pg.errors = [];
  pg.on('pageerror', (e) => pg.errors.push(`pageerror ${e.message.slice(0, 120)}`));
  pg.on('console', (m) => { if (m.type() === 'error') pg.errors.push(`console ${m.text().slice(0, 120)}`); });
  pg.on('response', (r) => { if (r.status() >= 400) pg.errors.push(`${r.status()} ${r.url().slice(0, 100)}`); });
  return { ctx, pg };
}

const modal = (pg) => pg.evaluate(() => {
  const dialog = document.querySelector('dialog[open]');
  const select = dialog?.querySelector('select[name="county"]');
  const error = dialog?.querySelector('.zip-county-form-error');
  return {
    open: !!dialog,
    options: select ? [...select.options].map((o) => `${o.text}${o.disabled ? ' (prompt)' : ''}`) : null,
    value: select?.value,
    disabled: select?.disabled,
    error: error && !error.hidden ? error.textContent : '',
    invalid: [...(dialog?.querySelectorAll('.field-wrapper.invalid') || [])].map((w) => w.querySelector('input, select')?.name),
    zip: dialog?.querySelector('input[name="zip"]')?.value,
  };
});

const page = (pg) => pg.evaluate(() => {
  const vis = (e) => !!(e && (e.offsetWidth || e.offsetHeight));
  const loc = document.querySelector('.zip-location p');
  const spanish = [...document.querySelectorAll('a')].find((a) => /Spanish/.test(a.textContent));
  const shop = [...document.querySelectorAll('.cards a')].find((a) => /SHOP PLANS/i.test(a.textContent));
  const brochure = [...document.querySelectorAll('a')].find((a) => /product brochure\./i.test(a.textContent));
  return {
    location: vis(loc) ? loc.querySelector('.zip-location-place')?.textContent : null,
    locationShown: vis(loc) ? loc.innerText.replace(/\s+/g, ' ').trim() : null,
    marketplace: vis(shop) ? shop.href : null,
    brochure: vis(brochure) ? brochure.href : null,
    spanish: vis(spanish) ? spanish.href : null,
    rawTokens: /\{\{|%7B%7B/.test(document.querySelector('main').innerHTML.replace(/data-[a-z-]+="[^"]*"/g, '')) && [...document.querySelectorAll('main a')].some((a) => vis(a) && /%7B%7B|\{\{/.test(a.getAttribute('href'))),
    stored: JSON.parse(localStorage.getItem('shop-zip-county') || 'null'),
  };
});

async function enterZip(pg, zip, county) {
  const input = pg.locator('dialog[open] input[name="zip"]');
  await input.fill('');
  await input.type(zip, { delay: 30 });
  await pg.waitForTimeout(200);
  if (county) await pg.selectOption('dialog[open] select[name="county"]', county);
}
const submit = async (pg) => { await pg.click('dialog[open] form button[type="submit"], dialog[open] form .button'); await pg.waitForTimeout(400); };

(async () => {
  const b = await chromium.launch();

  // 1-7: a first-time visitor walks through ZIPs
  {
    const { ctx, pg } = await open(b);
    await pg.goto(`${HOST}/shop/`, { waitUntil: 'networkidle' });
    await pg.waitForSelector('dialog[open] select[name="county"]', { timeout: 15000 }).catch(() => {});
    let m = await modal(pg);
    let p = await page(pg);
    check(m.open && m.disabled && m.options?.[0] === 'Enter ZIP first (prompt)', 'modal opens for a new visitor; county list waits for a ZIP', JSON.stringify(m.options));
    check(p.location === null && p.spanish === null, 'location line and Spanish line hidden before a ZIP');
    await pg.screenshot({
      path: path.join(OUT, 'region-modal-empty.png'),
      clip: {
        x: 300, y: 100, width: 680, height: 620,
      },
    });

    await enterZip(pg, '15222');
    m = await modal(pg);
    check(!m.disabled && m.value === 'Allegheny' && m.options.length === 2, 'single-county ZIP picks its county', JSON.stringify(m.options));
    await submit(pg);
    m = await modal(pg);
    p = await page(pg);
    check(!m.open, 'Continue closes the modal');
    check(JSON.stringify(p.stored) === JSON.stringify({
      zipCode: '15222', county: 'Allegheny', state: 'PA', regionCode: 'WPA', region: 'Western PA',
    }), 'full selection stored', JSON.stringify(p.stored));
    check(p.location === 'Allegheny County, PA 15222' && /CHANGE AREA$/i.test(p.locationShown), 'location line filled', p.locationShown);
    check(p.marketplace === 'https://highmark.healthsherpa.com/?_agent_id=highmark', 'Marketplace link for PA', p.marketplace);
    check(/\/WPA_2026_ACA_Brochure\.pdf$/.test(p.brochure || ''), 'Western PA brochure', p.brochure);
    check(p.spanish === null && !p.rawTokens, 'no Spanish line outside Southeastern PA, no raw tokens');
    await pg.screenshot({
      path: path.join(OUT, 'region-shop-wpa.png'),
      clip: {
        x: 0, y: 0, width: 1280, height: 700,
      },
    });

    await pg.click('.zip-location a');
    await pg.waitForSelector('dialog[open] select[name="county"]', { timeout: 15000 });
    m = await modal(pg);
    check(m.open && m.zip === '15222' && m.value === 'Allegheny', 'Change area reopens with the stored ZIP and county', `${m.zip} / ${m.value}`);
    await enterZip(pg, '15068');
    m = await modal(pg);
    check(JSON.stringify(m.options) === JSON.stringify(['Select your county (prompt)', 'Allegheny', 'Westmoreland']) && m.value === '', 'multi-county ZIP asks for a county', JSON.stringify(m.options));
    await pg.screenshot({
      path: path.join(OUT, 'region-modal-multi.png'),
      clip: {
        x: 300, y: 100, width: 680, height: 620,
      },
    });
    await submit(pg);
    m = await modal(pg);
    check(m.open && m.error === 'Please select your county.' && m.invalid.includes('county'), 'Continue without a county shows an error', m.error);
    await pg.selectOption('dialog[open] select[name="county"]', 'Westmoreland');
    m = await modal(pg);
    check(m.error === '', 'choosing a county clears the error');
    await submit(pg);
    p = await page(pg);
    check(p.location === 'Westmoreland County, PA 15068' && p.stored.regionCode === 'WPA', 'chosen county stored and shown', p.location);

    await pg.click('.zip-location a');
    await pg.waitForSelector('dialog[open] select[name="county"]', { timeout: 15000 });
    await enterZip(pg, '18073', 'Montgomery');
    await submit(pg);
    p = await page(pg);
    check(p.stored.regionCode === 'SEPA' && p.stored.region === 'Southeastern PA' && p.location === 'Montgomery County, PA 18073', 'Southeastern PA selection', p.location);
    check(/\/SEPA_2026_ACA_Brochure\.pdf$/.test(p.brochure || '') && /SEPA_2026_ACA_Brochure_Spanish\.pdf$/.test(p.spanish || ''), 'SEPA brochure plus the Spanish brochure line', `${p.brochure} | ${p.spanish}`);
    await pg.screenshot({ path: path.join(OUT, 'region-shop-sepa-learnmore.png'), fullPage: true });

    await pg.click('.zip-location a');
    await pg.waitForSelector('dialog[open] select[name="county"]', { timeout: 15000 });
    await enterZip(pg, '14202');
    await submit(pg);
    p = await page(pg);
    check(p.stored.regionCode === 'WNY' && p.marketplace === 'https://nystateofhealth.ny.gov/' && p.spanish === null, 'Western NY uses NY State of Health, no Spanish line', p.marketplace);

    await pg.click('.zip-location a');
    await pg.waitForSelector('dialog[open] select[name="county"]', { timeout: 15000 });
    await enterZip(pg, '10001');
    m = await modal(pg);
    check(/outside the service areas/.test(m.error) && m.invalid.includes('zip') && m.disabled, 'out-of-area message while typing', m.error.slice(0, 60));
    await pg.screenshot({
      path: path.join(OUT, 'region-modal-outside.png'),
      clip: {
        x: 300, y: 100, width: 680, height: 660,
      },
    });
    await submit(pg);
    m = await modal(pg);
    check(m.open && /outside the service areas/.test(m.error), 'out-of-area ZIP is not accepted');
    await enterZip(pg, '1234');
    await submit(pg);
    m = await modal(pg);
    check(m.open && m.error === 'Please enter a valid 5-digit ZIP code.', 'short ZIP rejected', m.error);
    p = await page(pg);
    check(p.stored.zipCode === '14202', 'a rejected entry keeps the previous selection', p.stored.zipCode);
    check(pg.errors.length === 0, 'no console errors / failed requests', pg.errors.join(' | '));
    await ctx.close();
  }

  // 8: a selection saved by the previous version (no county) asks again
  {
    const { ctx, pg } = await open(b, 1280, () => localStorage.setItem('shop-zip-county', JSON.stringify({ zipCode: '15222', region: 'Western PA' })));
    await pg.goto(`${HOST}/shop/`, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(1500);
    const m = await modal(pg);
    const p = await page(pg);
    check(m.open && p.location === null, 'old saved selection reopens the modal', JSON.stringify(p.stored));
    await ctx.close();
  }

  // 9: region-only sections ("Regions" section metadata → data-regions)
  {
    const sel = {
      zipCode: '18073', county: 'Montgomery', state: 'PA', regionCode: 'SEPA', region: 'Southeastern PA',
    };
    const { ctx, pg } = await open(b, 1280, (s) => localStorage.setItem('shop-zip-county', s), JSON.stringify(sel));
    await pg.goto(`${HOST}/shop/`, { waitUntil: 'networkidle' });
    const vis = await pg.evaluate(async (code) => {
      const main = document.querySelector('main');
      const add = (regions) => { const d = document.createElement('div'); d.className = 'section'; d.dataset.regions = regions; d.textContent = regions; main.append(d); return d; };
      const els = {
        sepa: add('SEPA'), wpaNepa: add('WPA, NEPA'), none: add('none'), mixed: add('sepa , cpa'),
      };
      const { default: apply } = await import(`${code}/blocks/zip-modal/zip-tokens.js`);
      await apply();
      return Object.fromEntries(Object.entries(els).map(([k, e]) => [k, !e.hidden && getComputedStyle(e).display !== 'none']));
    }, '');
    check(vis.sepa && !vis.wpaNepa && !vis.none && vis.mixed, 'Regions lists show only for the visitor\'s region', JSON.stringify(vis));
    await ctx.close();
  }
  {
    const { ctx, pg } = await open(b);
    await pg.goto(`${HOST}/shop/`, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(800);
    const vis = await pg.evaluate(async () => {
      document.querySelector('dialog[open]')?.close();
      const main = document.querySelector('main');
      const add = (regions) => { const d = document.createElement('div'); d.className = 'section'; d.dataset.regions = regions; d.textContent = regions; main.append(d); return d; };
      const els = { none: add('none'), wpa: add('WPA') };
      // the site's own module, from the page's origin
      const tokens = '/blocks/zip-modal/zip-tokens.js';
      const { default: apply } = await import(tokens);
      await apply();
      return Object.fromEntries(Object.entries(els).map(([k, e]) => [k, !e.hidden]));
    });
    check(vis.none && !vis.wpa, '"none" shows for visitors without a ZIP', JSON.stringify(vis));
    await ctx.close();
  }

  // 10: the old /shop/home copy (text tokens) with a stored selection
  {
    const sel = {
      zipCode: '15068', county: 'Westmoreland', state: 'PA', regionCode: 'WPA', region: 'Western PA',
    };
    const { ctx, pg } = await open(b, 1280, (s) => localStorage.setItem('shop-zip-county', s), JSON.stringify(sel));
    await pg.goto(`${HOST}/shop/home`, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(800);
    const p = await page(pg);
    check(p.location === 'Westmoreland County, PA 15068' && !p.rawTokens && /WPA_2026/.test(p.brochure || ''), '/shop/home (text tokens) shows the same location line', p.locationShown);
    check(pg.errors.length === 0, 'no console errors on /shop/home', pg.errors.join(' | '));
    await ctx.close();
  }

  // 11: phone layout of the modal and the page
  {
    const { ctx, pg } = await open(b, 390);
    await pg.goto(`${HOST}/shop/`, { waitUntil: 'networkidle' });
    await pg.waitForSelector('dialog[open] select[name="county"]', { timeout: 15000 }).catch(() => {});
    await enterZip(pg, '18073');
    const hscroll = await pg.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    await pg.screenshot({ path: path.join(OUT, 'region-modal-390.png'), fullPage: false });
    await pg.selectOption('dialog[open] select[name="county"]', 'Bucks');
    await submit(pg);
    const p = await page(pg);
    check(!hscroll && p.location === 'Bucks County, PA 18073', 'phone: modal fits, selection works', p.location);
    await pg.screenshot({ path: path.join(OUT, 'region-shop-390.png'), fullPage: false });
    await ctx.close();
  }

  await b.close();
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
})();
