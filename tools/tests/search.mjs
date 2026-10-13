/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- steps run one after another */
// End-to-end checks for the header type-ahead and the /search results page.
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const HOST = process.env.HOST || 'http://localhost:3100';
const OUT = path.join(HERE, process.env.SHOTS || 'shots');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

async function page(b, width, height = 900) {
  const ctx = await b.newContext({ viewport: { width, height } });
  const pg = await ctx.newPage();
  pg.errors = [];
  pg.requests = [];
  pg.on('pageerror', (e) => pg.errors.push(`pageerror ${e.message.slice(0, 120)}`));
  pg.on('console', (m) => { if (m.type() === 'error') pg.errors.push(`console ${m.text().slice(0, 120)}`); });
  pg.on('response', (r) => { if (r.status() >= 400) pg.errors.push(`${r.status()} ${r.url().slice(0, 120)}`); });
  pg.on('request', (r) => pg.requests.push(r.url()));
  return { ctx, pg };
}

const popupState = (pg) => pg.evaluate(() => {
  const form = document.querySelector('header .nav-search');
  const popup = form.querySelector('.nav-search-suggestions');
  const input = form.querySelector('input');
  return {
    open: !popup.hidden && popup.offsetHeight > 0,
    expanded: input.getAttribute('aria-expanded'),
    activedescendant: input.getAttribute('aria-activedescendant'),
    options: [...popup.querySelectorAll('[role=option]')].map((o) => ({
      text: o.textContent, href: o.querySelector('a').getAttribute('href'), marks: [...o.querySelectorAll('mark')].map((m) => m.textContent), active: o.classList.contains('active'),
    })),
    empty: !popup.querySelector('.nav-search-empty').hidden,
    status: form.querySelector('.nav-search-status').textContent,
    box: popup.getBoundingClientRect().toJSON(),
    value: input.value,
  };
});

(async () => {
  const b = await chromium.launch();

  // ---- 1. desktop header type-ahead on a regular page ----
  {
    const { ctx, pg } = await page(b, 1280);
    await pg.goto(`${HOST}/plans`, { waitUntil: 'networkidle' });
    check(!pg.requests.some((u) => u.includes('/blocks/search/search.js')), 'search module not loaded before the box is used');
    const input = pg.locator('header .nav-search input');
    await input.click();
    await pg.waitForTimeout(500);
    check(pg.requests.some((u) => u.includes('/blocks/search/search.js')), 'search module loads on focus');
    check(pg.requests.some((u) => u.includes('/search-index.json')), 'index preloaded on focus');
    await input.type('me', { delay: 60 });
    await pg.waitForTimeout(400);
    check(!(await popupState(pg)).open, 'no suggestions under 3 letters');
    await input.type('dicare', { delay: 60 });
    await pg.waitForTimeout(500);
    let s = await popupState(pg);
    check(s.open && s.expanded === 'true', 'suggestions open at 3+ letters', `${s.options.length} options`);
    check(s.options.length > 0 && s.options.length <= 5, 'at most 5 suggestions');
    check(!s.options.some((o) => /^\/(nav|footer|search)$|modals/.test(o.href)), 'no fragment/modal/search rows', s.options.map((o) => o.href).join(' '));
    {
      // title matches first and marked; description-only matches (no mark) may follow
      const inTitle = s.options.map((o) => /medicare/i.test(o.text));
      const marked = s.options.every((o, i) => !inTitle[i] || o.marks.some((m) => /^medicare$/i.test(m)));
      const firstMiss = inTitle.indexOf(false);
      const titleFirst = firstMiss === -1 || inTitle.slice(firstMiss).every((x) => !x);
      check(marked && titleFirst, 'typed word marked; title matches listed first', JSON.stringify(s.options.map((o) => o.marks)));
    }
    check(s.box.right <= 1280 && s.box.left >= 0, 'popup inside the viewport', `${Math.round(s.box.left)}-${Math.round(s.box.right)}`);
    console.log('      suggestions:', s.options.map((o) => `${o.text} -> ${o.href}`).join(' | '));
    console.log('      status:', s.status);
    await pg.screenshot({
      path: path.join(OUT, 'header-1280-suggestions.png'),
      clip: {
        x: 500, y: 0, width: 780, height: 460,
      },
    });

    await pg.keyboard.press('ArrowDown');
    await pg.keyboard.press('ArrowDown');
    s = await popupState(pg);
    check(s.options[1]?.active && s.activedescendant === 'nav-search-option-1', 'arrow keys move the highlight', s.activedescendant);
    await pg.screenshot({
      path: path.join(OUT, 'header-1280-active.png'),
      clip: {
        x: 500, y: 0, width: 780, height: 460,
      },
    });
    await pg.keyboard.press('ArrowUp');
    await pg.keyboard.press('ArrowUp');
    s = await popupState(pg);
    check(s.options[s.options.length - 1]?.active, 'ArrowUp wraps to the last suggestion');
    await pg.keyboard.press('Escape');
    s = await popupState(pg);
    check(!s.open && s.value === 'medicare', 'Escape closes the list and keeps the text', `value "${s.value}"`);
    await pg.keyboard.press('ArrowDown');
    await pg.waitForTimeout(300);
    s = await popupState(pg);
    check(s.open, 'ArrowDown reopens the list');
    await pg.keyboard.press('ArrowDown');
    const target = s.options[0].href;
    await Promise.all([pg.waitForURL((u) => u.pathname === target, { timeout: 15000 }).catch(() => {}), pg.keyboard.press('Enter')]);
    check(new URL(pg.url()).pathname === target, 'Enter on a highlighted suggestion opens that page', pg.url());
    check(pg.errors.length === 0, 'no console errors / failed requests (desktop)', pg.errors.join(' | '));
    await ctx.close();
  }

  // ---- 2. no matches, click-outside, mouse click, plain Enter ----
  {
    const { ctx, pg } = await page(b, 1280);
    await pg.goto(`${HOST}/about/our-story`, { waitUntil: 'networkidle' });
    const input = pg.locator('header .nav-search input');
    await input.click();
    await input.type('zqxjvbn', { delay: 40 });
    await pg.waitForTimeout(500);
    let s = await popupState(pg);
    check(s.open && s.empty && s.options.length === 0, '"No results found" when nothing matches', s.status);
    await pg.screenshot({
      path: path.join(OUT, 'header-1280-empty.png'),
      clip: {
        x: 700, y: 0, width: 580, height: 330,
      },
    });
    await pg.mouse.click(200, 600);
    await pg.waitForTimeout(200);
    s = await popupState(pg);
    check(!s.open, 'click outside closes the list');
    await input.fill('');
    await input.type('anxiety', { delay: 40 });
    await pg.waitForTimeout(500);
    s = await popupState(pg);
    const second = s.options[1];
    await Promise.all([pg.waitForURL((u) => u.pathname === second.href, { timeout: 15000 }).catch(() => {}), pg.locator('header .nav-search-suggestions [role=option]').nth(1).click()]);
    check(new URL(pg.url()).pathname === second.href, 'mouse click on a suggestion opens it', pg.url());
    const input2 = pg.locator('header .nav-search input');
    await input2.click();
    await input2.type('find a doctor', { delay: 30 });
    await pg.waitForTimeout(300);
    await Promise.all([pg.waitForURL(/\/search\?q=/, { timeout: 15000 }).catch(() => {}), pg.keyboard.press('Enter')]);
    const u = new URL(pg.url());
    check(u.pathname === '/search' && u.searchParams.get('q') === 'find a doctor', 'plain Enter submits to /search?q=', pg.url());
    await pg.waitForTimeout(800);
    const r = await pg.evaluate(() => ({
      count: document.querySelectorAll('.search-result').length, first: document.querySelector('.search-result a')?.getAttribute('href'), summary: document.querySelector('.search-summary')?.textContent, value: document.querySelector('.search input')?.value,
    }));
    check(r.count >= 2 && r.first === '/shop/info-pages/find-a-doctor' && r.value === 'find a doctor', 'results page searches the submitted query', `${r.count} shown, first ${r.first}, "${r.summary}"`);
    await input2.click();
    await pg.keyboard.press('Control+A');
    await pg.keyboard.press('Delete');
    const before = pg.url();
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(500);
    check(pg.url() === before, 'empty header search does not submit');
    check(pg.errors.length === 0, 'no console errors / failed requests (flows)', pg.errors.join(' | '));
    await ctx.close();
  }

  // ---- 3. narrow desktop: popup stays on screen at 992 ----
  {
    const { ctx, pg } = await page(b, 992);
    await pg.goto(`${HOST}/plans`, { waitUntil: 'networkidle' });
    const input = pg.locator('header .nav-search input');
    await input.click();
    await input.type('medicare', { delay: 30 });
    await pg.waitForTimeout(500);
    const s = await popupState(pg);
    check(s.open && s.box.right <= 992 && s.box.left >= 0, 'popup on screen at 992', `${Math.round(s.box.left)}-${Math.round(s.box.right)}`);
    await ctx.close();
  }

  // ---- 4. phone header search (the search icon opens the box in the bar, 2026-10-05) ----
  {
    const { ctx, pg } = await page(b, 390, 844);
    await pg.goto(`${HOST}/plans`, { waitUntil: 'networkidle' });
    await pg.click('header .nav-search-toggle');
    await pg.waitForTimeout(300);
    const input = pg.locator('header .nav-search input');
    await input.type('mental', { delay: 40 });
    await pg.waitForTimeout(600);
    const s = await popupState(pg);
    check(s.open && s.box.left >= 0 && s.box.right <= 390, 'phone search suggestions open, on screen', `${s.options.length} options ${Math.round(s.box.left)}-${Math.round(s.box.right)}`);
    await pg.screenshot({
      path: path.join(OUT, 'header-390-search.png'),
      clip: {
        x: 0, y: 0, width: 390, height: 600,
      },
    });
    const hscroll = await pg.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    check(!hscroll, 'no horizontal scroll with the phone search open (390)');
    check(pg.errors.length === 0, 'no console errors / failed requests (mobile)', pg.errors.join(' | '));
    await ctx.close();
  }

  // ---- 5. results page at 1280 / 768 / 390 ----
  for (const w of [1280, 768, 390]) {
    const { ctx, pg } = await page(b, w);
    await pg.goto(`${HOST}/search?q=medicare`, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(800);
    const m = await pg.evaluate(() => ({
      h1: document.querySelector('main h1')?.textContent,
      crumbs: [...document.querySelectorAll('.breadcrumbs li')].map((li) => li.textContent.trim()).join(' / '),
      summary: document.querySelector('.search-summary')?.textContent,
      results: [...document.querySelectorAll('.search-result')].map((li) => li.querySelector('a').getAttribute('href')),
      nested: document.querySelectorAll('.search a a').length,
      images: document.querySelectorAll('.search img, .search picture').length,
      moreHidden: document.querySelector('.search-more').hidden,
      titleTag: document.querySelector('.search-result-title')?.tagName,
      hscroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      submitVisible: !!document.querySelector('.search-submit')?.offsetWidth,
      clearVisible: !!document.querySelector('.search-clear')?.offsetWidth,
      placeholdersRequested: performance.getEntriesByType('resource').some((e) => e.name.includes('placeholders.json')),
    }));
    check(m.h1 === 'Search Highmark' && m.crumbs === 'Home / Search Results', `@${w} heading + breadcrumbs`, `${m.h1} | ${m.crumbs}`);
    const [, shown, total] = (m.summary || '').match(/^Showing (\d+) of (\d+) results for "medicare"$/) || [];
    check(Number(shown) === Math.min(10, Number(total)) && Number(total) > 6, `@${w} count line`, m.summary);
    check(m.results[0] === '/plans/medicare/learn-about-medicare' && !m.results.includes('/nav'), `@${w} results without /nav, title match first`, m.results.slice(0, 3).join(' '));
    check(m.nested === 0 && m.images === 0, `@${w} no nested links, no images`);
    check(m.moreHidden === (Number(total) <= 10), `@${w} "show more" only when there are more than 10`);
    check(!m.hscroll, `@${w} no horizontal scroll`);
    check(m.submitVisible === (w >= 768) && m.clearVisible === (w < 768), `@${w} SEARCH button on desktop/tablet, clear (x) on phones`, `submit ${m.submitVisible} clear ${m.clearVisible}`);
    check(!m.placeholdersRequested, `@${w} no placeholders.json request`);
    check(pg.errors.length === 0, `@${w} no console errors / failed requests`, pg.errors.join(' | '));
    await pg.screenshot({ path: path.join(OUT, `results-${w}.png`), fullPage: true });
    await ctx.close();
  }

  // ---- 6. paging, live typing, no results, clear ----
  {
    const { ctx, pg } = await page(b, 1280);
    await pg.goto(`${HOST}/search?q=health`, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(800);
    let m = await pg.evaluate(() => ({ n: document.querySelectorAll('.search-result').length, summary: document.querySelector('.search-summary').textContent, more: !document.querySelector('.search-more').hidden }));
    const total = Number((m.summary.match(/of (\d+)/) || [])[1]);
    check(m.n === 10 && total > 10 && m.more, 'first 10 of many, with "show more"', m.summary);
    await pg.click('.search-more-button');
    await pg.waitForTimeout(300);
    m = await pg.evaluate(() => ({
      n: document.querySelectorAll('.search-result').length, summary: document.querySelector('.search-summary').textContent, more: !document.querySelector('.search-more').hidden, focused: document.activeElement?.closest('.search-result') ? [...document.querySelectorAll('.search-result')].indexOf(document.activeElement.closest('.search-result')) : -1,
    }));
    check(m.n === Math.min(20, total) && m.focused === 10, '"show more" adds 10 and focuses the first new result', `${m.summary}, focus #${m.focused}`);
    await pg.screenshot({ path: path.join(OUT, 'results-1280-more.png'), fullPage: false });

    const input = pg.locator('.search input');
    await input.fill('');
    await input.type('chip', { delay: 50 });
    await pg.waitForTimeout(500);
    m = await pg.evaluate(() => ({ n: document.querySelectorAll('.search-result').length, q: new URL(window.location.href).searchParams.get('q') }));
    check(m.n >= 8 && m.q === 'chip', 'typing updates the results and ?q=', `${m.n} results, q=${m.q}`);

    await input.fill('');
    await input.type('zqxjvbn', { delay: 50 });
    await pg.waitForTimeout(500);
    m = await pg.evaluate(() => ({
      n: document.querySelectorAll('.search-result').length,
      shown: !document.querySelector('.search-no-results').hidden,
      title: document.querySelector('.search-no-results-title')?.textContent,
      link: document.querySelector('.search-no-results-fallback a')?.href,
      summary: document.querySelector('.search-summary').textContent,
    }));
    check(m.n === 0 && m.shown && m.summary === '', 'no-results state replaces the list', m.title);
    check(m.link === 'https://www.highmark.com/search-results.html?q=zqxjvbn&rows=10', 'fallback link to highmark.com search', m.link);
    await pg.screenshot({
      path: path.join(OUT, 'results-1280-none.png'),
      clip: {
        x: 0, y: 0, width: 1280, height: 900,
      },
    });
    check(pg.errors.length === 0, 'no console errors / failed requests (paging)', pg.errors.join(' | '));
    await ctx.close();
  }
  {
    const { ctx, pg } = await page(b, 390, 844);
    await pg.goto(`${HOST}/search?q=zqxjvbn`, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(600);
    await pg.screenshot({ path: path.join(OUT, 'results-390-none.png'), fullPage: true });
    await pg.click('.search-clear');
    await pg.waitForTimeout(200);
    const m = await pg.evaluate(() => ({
      value: document.querySelector('.search input').value, q: new URL(window.location.href).searchParams.get('q'), none: !document.querySelector('.search-no-results').hidden, clear: !!document.querySelector('.search-clear').offsetWidth, focused: document.activeElement === document.querySelector('.search input'),
    }));
    check(m.value === '' && m.q === null && !m.none && !m.clear && m.focused, 'clear (x) empties box, results and ?q=, refocuses', JSON.stringify(m));
    await ctx.close();
  }

  await b.close();
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
})();
