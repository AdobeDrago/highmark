/* eslint-env node */
/* eslint-disable no-console */
// Checks for the suggestions shown on focus, before typing (from /search-suggestions.json).
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

const EXPECTED = [
  ['Careers', 'https://www.highmark.com/search-results.html?q=Careers&rows=10'],
  ['Member Login', '/search?q=Member+Login'],
  ['ExpressScripts', 'https://www.highmark.com/search-results.html?q=ExpressScripts&rows=10'],
  ['Formulary', '/search?q=Formulary'],
  ['Dentist', '/search?q=Dentist'],
];

const state = (pg) => pg.evaluate(() => {
  const popup = document.querySelector('header .nav-search-suggestions');
  const options = [...popup.querySelectorAll('[role=option]')];
  return {
    open: !popup.hidden && popup.offsetHeight > 0,
    authored: popup.classList.contains('nav-search-authored'),
    heading: popup.querySelector('.nav-search-suggestions-heading').textContent,
    items: options.map((o) => [o.textContent, o.querySelector('a').getAttribute('href')]),
    weights: options.map((o) => getComputedStyle(o.querySelector('a')).fontWeight),
    marks: popup.querySelectorAll('mark').length,
    box: popup.getBoundingClientRect().toJSON(),
  };
});

(async () => {
  const b = await chromium.launch();
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage();
    const errors = [];
    pg.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
    pg.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url().slice(0, 120)}`); });
    const sheetRequests = [];
    pg.on('request', (r) => { if (r.url().includes('search-suggestions.json')) sheetRequests.push(r.url()); });
    await pg.goto(`${HOST}/employer`, { waitUntil: 'networkidle' });
    check(sheetRequests.length === 0, 'sheet not requested before the box is used');
    const input = pg.locator('header .nav-search input');
    await input.click();
    await pg.waitForTimeout(700);
    let s = await state(pg);
    check(s.open && s.authored && s.heading === 'Suggestions', 'list opens on focus, before typing', `${s.items.length} items`);
    check(JSON.stringify(s.items) === JSON.stringify(EXPECTED), 'five authored items with the right links', JSON.stringify(s.items));
    check(s.weights.every((w) => w === '400') && s.marks === 0, 'plain regular-weight labels', s.weights.join(','));
    check(s.box.right <= 1280, 'list on screen', `${Math.round(s.box.left)}-${Math.round(s.box.right)}`);
    check(sheetRequests.length === 1, 'sheet fetched once', sheetRequests.join(' '));
    await pg.screenshot({
      path: path.join(OUT, 'defaults-1280.png'),
      clip: {
        x: 640, y: 80, width: 640, height: 400,
      },
    });

    await input.type('me', { delay: 60 });
    await pg.waitForTimeout(400);
    s = await state(pg);
    check(!s.open, 'hidden at 1-2 letters');
    await input.type('d', { delay: 60 });
    await pg.waitForTimeout(400);
    s = await state(pg);
    check(s.open && !s.authored && s.marks > 0, 'typed suggestions take over at 3 letters', s.items.map((i) => i[0]).join(' | '));
    await pg.keyboard.press('Control+A');
    await pg.keyboard.press('Backspace');
    await pg.waitForTimeout(400);
    s = await state(pg);
    check(s.open && s.authored && s.items.length === 5, 'cleared box shows them again');

    await pg.keyboard.press('Escape');
    await pg.keyboard.press('ArrowDown');
    await pg.waitForTimeout(400);
    await pg.keyboard.press('ArrowDown');
    await pg.keyboard.press('ArrowDown');
    s = await state(pg);
    await Promise.all([pg.waitForURL(/\/search\?q=/, { timeout: 15000 }).catch(() => {}), pg.keyboard.press('Enter')]);
    await pg.waitForTimeout(800);
    const r = await pg.evaluate(() => ({ url: window.location.pathname + window.location.search, n: document.querySelectorAll('.search-result').length, value: document.querySelector('.search input')?.value }));
    check(r.url === '/search?q=Member+Login' && r.n > 0 && r.value === 'Member Login', 'keyboard pick of "Member Login" searches this site', JSON.stringify(r));
    check(sheetRequests.length >= 1 && errors.length === 0, 'no console errors / failed requests', errors.join(' | '));
    await ctx.close();
  }
  {
    // clicking an item that goes to highmark.com (navigation intercepted, not loaded)
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage();
    await pg.route('https://www.highmark.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>stub</p>' }));
    await pg.goto(`${HOST}/plans`, { waitUntil: 'networkidle' });
    await pg.click('header .nav-search input');
    await pg.waitForTimeout(700);
    await Promise.all([pg.waitForURL(/highmark\.com/, { timeout: 15000 }).catch(() => {}), pg.locator('header .nav-search-suggestions [role=option]').filter({ hasText: 'Careers' }).click()]);
    check(pg.url() === 'https://www.highmark.com/search-results.html?q=Careers&rows=10', 'clicking "Careers" (no match here) opens highmark.com results', pg.url());
    await ctx.close();
  }
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage();
    await pg.goto(`${HOST}/plans`, { waitUntil: 'networkidle' });
    await pg.click('header .nav-search-toggle'); // opens the bar's box, focused (2026-10-05)
    await pg.waitForTimeout(700);
    const s = await state(pg);
    check(s.open && s.authored && s.items.length === 5 && s.box.right <= 390, 'phone: list on opening the search, on screen', `${Math.round(s.box.left)}-${Math.round(s.box.right)}`);
    await pg.screenshot({
      path: path.join(OUT, 'defaults-390.png'),
      clip: {
        x: 0, y: 0, width: 390, height: 844,
      },
    });
    await ctx.close();
  }
  await b.close();
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
})();
