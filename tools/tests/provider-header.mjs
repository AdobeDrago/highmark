/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- steps run one after another */
// Provider header behaviour on HOST (default local): full-width panels, group labels, locks,
// the search row submitting to providers.highmark.com, the phone menu and search; and the
// corporate header on / left as it was.
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';

const HOST = process.env.HOST || 'http://localhost:3100';
let failed = 0;
const check = (ok, label, detail = '') => { if (!ok) failed += 1; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`); };

(async () => {
  const b = await chromium.launch();

  // ---- desktop ----
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await pg.goto(`${HOST}/providers/claims`, { waitUntil: 'networkidle' });
  await pg.waitForSelector('header nav .nav-primary');
  const tops = await pg.locator('header nav .nav-primary > li').count();
  check(tops === 6, 'six top-level items', tops);
  for (let i = 0; i < tops; i += 1) {
    const li = pg.locator('header nav .nav-primary > li').nth(i);
    await li.hover();
    await pg.waitForTimeout(150);
    const r = await li.evaluate((el) => {
      const panel = el.querySelector('.nav-panel');
      const box = panel.getBoundingClientRect();
      const row = document.querySelector('.nav-primary-row').getBoundingClientRect();
      return {
        label: el.querySelector(':scope > a').textContent, visible: getComputedStyle(panel).display !== 'none', left: box.left, right: box.right, top: box.top, rowBottom: row.bottom, cols: panel.children.length,
      };
    });
    check(r.visible && r.left === 0 && r.right <= 1280 && Math.abs(r.top - r.rowBottom) < 1, `panel "${r.label}" opens under the row, within the page`, `${r.cols} columns, x ${Math.round(r.left)}-${Math.round(r.right)}`);
  }
  await pg.locator('header nav .nav-primary > li', { hasText: 'Claims' }).first().hover();
  await pg.waitForTimeout(200);
  const claims = await pg.evaluate(() => {
    const panel = [...document.querySelectorAll('.nav-panel')].find((p) => getComputedStyle(p).display !== 'none');
    const labels = [...panel.querySelectorAll('li')].filter((li) => !li.querySelector('a') && !li.querySelector('ul'));
    const locks = [...panel.querySelectorAll('.icon-lock img')];
    return {
      labels: labels.map((li) => `${li.textContent.trim()}:${getComputedStyle(li).color}`),
      locks: locks.length,
      locksLoaded: locks.filter((i) => i.complete && i.naturalWidth > 0).length,
      lockAlt: locks[0]?.alt,
      lockHref: locks[0]?.closest('li').querySelector('a').href,
    };
  });
  check(claims.labels.length === 3 && claims.labels.every((l) => l.endsWith('rgb(137, 150, 161)')), 'Claims: three grey group labels', claims.labels.join(' | '));
  check(claims.locks === 10 && claims.locksLoaded === 10, 'Claims: ten lock icons, all loaded', `${claims.locksLoaded}/${claims.locks}`);
  check(claims.lockAlt === 'Availity login required', 'lock icon has alt text', claims.lockAlt);
  check(/^https:\/\/providers\.highmark\.com\/claims\//.test(claims.lockHref), 'a locked item links to the source page', claims.lockHref);
  await pg.mouse.move(640, 700);

  // search row: submits to the provider site's results page
  const box = pg.locator('.nav-search-row input[name="q"]');
  check(await box.isVisible(), 'search row is shown on desktop');
  check((await box.getAttribute('placeholder')) === 'Search Keyword or Code', 'search placeholder from the fragment');
  const [request] = await Promise.all([
    pg.waitForRequest((r) => r.url().startsWith('https://providers.highmark.com/search-results.html'), { timeout: 10000 }),
    box.fill('97110').then(() => box.press('Enter')),
  ]);
  check(request.url() === 'https://providers.highmark.com/search-results.html?q=97110&filter=All', 'search submits to providers.highmark.com', request.url());
  check(await pg.evaluate(() => !document.querySelector('.nav-search-row .nav-search-suggestions')), 'no suggestions list on the provider box');
  await pg.close();

  // ---- phone ----
  const ph = await b.newPage({ viewport: { width: 390, height: 844 } });
  await ph.goto(`${HOST}/providers/claims`, { waitUntil: 'networkidle' });
  await ph.waitForSelector('header nav .nav-hamburger');
  check(!(await ph.locator('.nav-search-row').isVisible()), 'phone: no search row');
  await ph.click('header nav .nav-hamburger');
  await ph.waitForTimeout(400);
  const drawer = await ph.evaluate(() => ({
    open: document.querySelector('header nav').classList.contains('nav-open'),
    items: [...document.querySelectorAll('.nav-primary > li > a')].filter((a) => a.getBoundingClientRect().width > 0).length,
    icons: [...document.querySelectorAll('.nav-drawer-icons li')].map((li) => li.textContent.trim()),
  }));
  check(drawer.open && drawer.items === 6, 'phone: menu opens with six items', JSON.stringify(drawer));
  await ph.locator('.nav-primary > li', { hasText: 'Claims' }).first().locator('.nav-panel-toggle').click();
  await ph.waitForTimeout(300);
  const sub = await ph.evaluate(() => [...document.querySelectorAll('.nav-primary > li.open .nav-panel a')].filter((a) => a.getBoundingClientRect().width > 0).length);
  check(sub >= 20, 'phone: Claims expands to its links', sub);
  const overflow = await ph.evaluate(() => document.documentElement.scrollWidth);
  check(overflow <= 390, 'phone: open menu does not widen the page', overflow);
  await ph.click('header nav .nav-hamburger');
  await ph.waitForTimeout(400);
  await ph.click('header nav .nav-search-toggle');
  await ph.waitForTimeout(200);
  const phBox = ph.locator('.nav-brand-row input[name="q"]');
  check(await phBox.isVisible(), 'phone: search icon opens the box');
  const [phReq] = await Promise.all([
    ph.waitForRequest((r) => r.url().startsWith('https://providers.highmark.com/search-results.html'), { timeout: 10000 }),
    phBox.fill('claims').then(() => phBox.press('Enter')),
  ]);
  check(phReq.url() === 'https://providers.highmark.com/search-results.html?q=claims&filter=All', 'phone: search submits to providers.highmark.com', phReq.url());
  await ph.close();

  // ---- corporate header unchanged ----
  const co = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await co.goto(`${HOST}/`, { waitUntil: 'networkidle' });
  await co.waitForSelector('header nav .nav-primary');
  const corp = await co.evaluate(() => ({
    row: !!document.querySelector('.nav-search-row'),
    full: document.querySelector('header nav').classList.contains('nav-panels-full'),
    action: document.querySelector('form.nav-search').getAttribute('action'),
    suggestions: !!document.querySelector('.nav-search-suggestions'),
    headerH: Math.round(document.querySelector('header').getBoundingClientRect().height),
  }));
  // since 2026-10-08 the corporate menu also uses the full-width panels (as highmark.com does)
  check(!corp.row && corp.full && corp.action === '/search' && corp.suggestions && corp.headerH === 197, 'corporate header on /: own search, full-width panels', JSON.stringify(corp));
  await co.close();

  console.log(failed ? `${failed} FAILED` : 'ALL PASSED');
  await b.close();
})();
