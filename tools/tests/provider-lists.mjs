/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- steps run one after another */
// Batch 3 checks: each list page at 1280 / 1024 / 390 - no errors or overflow, the count line,
// items, view more, filters, sort, Clear All, the phone filter toggle; screenshots in shots/.
// HOST + PREFIX pick the pages (local drafts by default); META=1 injects the template metadata
// (aem up's --html-folder drops it).
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'shots');
const HOST = process.env.HOST || 'http://localhost:3100';
const PREFIX = process.env.PREFIX || '/providers';
const META = process.env.META ? process.env.META !== '0' : PREFIX.startsWith('/drafts');
const WIDTHS = (process.env.WIDTHS || '1280,1024,390').split(',').map(Number);
const PAGES = (process.env.PAGES || 'reimbursement-policies,news-and-updates,provider-news,medical-policy-update,formulary-updates').split(',');
const TOTALS = {
  'reimbursement-policies': 74, 'news-and-updates': 208, 'provider-news': 10, 'medical-policy-update': 14, 'formulary-updates': 5,
};
let fails = 0;
const check = (ok, msg) => { if (!ok) fails += 1; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };
const pathOf = (name) => (PREFIX.startsWith('/providers')
  ? `${PREFIX}${name === 'reimbursement-policies' ? '/claims/reimbursement-resources' : '/communications-hub'}/${name}`
  : `${PREFIX}/${name}`);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  for (const w of WIDTHS) {
    for (const name of PAGES) {
      const page = await b.newPage({ viewport: { width: w, height: 900 } });
      if (META) {
        await page.addInitScript(() => document.addEventListener('readystatechange', () => {
          if (document.readyState !== 'interactive') return;
          [['template', 'provider-content'], ['breadcrumbs', 'true']].forEach(([n, c]) => {
            const m = document.createElement('meta'); m.name = n; m.content = c; document.head.append(m);
          });
        }));
      }
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(`${HOST}${pathOf(name)}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.provider-list-item', { timeout: 15000 }).catch(() => {});
      const docs = name === 'reimbursement-policies';
      const size = docs ? 10 : 7;
      const total = TOTALS[name];
      const tag = `@${w} ${name}`;
      const state = () => page.evaluate(() => ({
        count: document.querySelector('.provider-list-count')?.textContent,
        items: document.querySelectorAll('.provider-list-item').length,
        more: !document.querySelector('.provider-list-more')?.hidden,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      }));
      let s = await state();
      check(s.items === Math.min(size, total) && s.count === `Showing 1 - ${Math.min(size, total)} of ${total} results`, `${tag} first page: ${s.items} items, "${s.count}"`);
      check(!s.overflow, `${tag} no horizontal overflow`);
      check(s.more === total > size, `${tag} more button ${s.more ? 'shown' : 'hidden'}`);
      if (total > size) {
        await page.click('.provider-list-more');
        s = await state();
        check(s.items === Math.min(2 * size, total) && s.count.startsWith(`Showing 1 - ${Math.min(2 * size, total)} of`), `${tag} view more: ${s.items} items, "${s.count}"`);
        const focusIdx = await page.evaluate(() => [...document.querySelectorAll('.provider-list-item .provider-list-title a')].indexOf(document.activeElement));
        check(focusIdx === size, `${tag} focus moves to the first new item (title #${focusIdx})`);
      }
      const first = await page.evaluate(() => {
        const li = document.querySelector('.provider-list-item');
        const a = li?.querySelector('.provider-list-title a');
        return {
          tag: li?.querySelector('.provider-list-title')?.tagName,
          text: a?.textContent,
          href: a?.getAttribute('href'),
          target: a?.target,
          meta: li?.querySelector('.provider-list-meta')?.textContent,
          topic: li?.querySelector('.provider-list-topic')?.textContent,
          pdf: !!a?.querySelector('.icon-pdf img[alt="PDF"]'),
        };
      });
      console.log(`      first item: <${first.tag}> "${first.text}" -> ${first.href} ${first.target || ''} | ${first.topic || ''} | ${first.meta} | pdf icon ${first.pdf}`);
      if (docs) {
        check(first.tag === 'H3' && /^MRP-001/.test(first.text) && first.pdf && first.meta === 'Published Date: 7/2021 | Last Updated Date: 8/2022', `${tag} first policy as on the source`);
        const gated = await page.evaluate(() => {
          const more = document.querySelector('.provider-list-more');
          while (!more.hidden) more.click();
          const li = [...document.querySelectorAll('.provider-list-item')].find((x) => /RP-019A/.test(x.textContent));
          return { all: document.querySelectorAll('.provider-list-item').length, lock: !!li?.querySelector('.icon-lock img[alt="Availity login required"]') };
        });
        check(gated.all === total && gated.lock, `${tag} all ${gated.all} load; RP-019A has the lock icon`);
      } else {
        check(first.tag === 'H2' && !!first.topic && /^For: .+ \| Published Date: \w{3}, \w+ \d{2}, \d{4}$/.test(first.meta), `${tag} item: h2, topic, "For | Published Date" line`);
        const filters = await page.evaluate(() => [...document.querySelectorAll('.provider-list-field label')].map((l) => l.textContent));
        check(filters.join('|') === 'Topics|For|Date Last Updated|From Date:|To Date:|Document Type|Sort By', `${tag} filters: ${filters.join(', ')}`);
        const phone = w < 992;
        const visible = await page.evaluate(() => !!document.querySelector('.provider-list-filters-form')?.offsetParent);
        check(visible === !phone, `${tag} filter form ${visible ? 'visible' : 'folded'}`);
        if (phone) {
          await page.click('.provider-list-filters-toggle');
          const open = await page.evaluate(() => [!!document.querySelector('.provider-list-filters-form')?.offsetParent, document.querySelector('.provider-list-filters-toggle').getAttribute('aria-expanded')]);
          check(open[0] && open[1] === 'true', `${tag} toggle opens the filters (aria-expanded ${open[1]})`);
        }
        // a topic filter: the count matches the sheet's rows of that topic
        const topic = await page.evaluate(() => document.querySelector('select[name="Topic"] option:nth-child(2)')?.value);
        const want = await page.evaluate(async (t) => {
          const url = performance.getEntriesByType('resource').map((r) => r.name).find((n) => /\/lists\/[^/]+\.json/.test(n));
          const { data } = await (await fetch(url)).json();
          return data.filter((r) => r.Topic === t).length;
        }, topic);
        await page.selectOption('select[name="Topic"]', topic);
        s = await state();
        const clearShown = await page.evaluate(() => !document.querySelector('.provider-list-clear').hidden);
        check(s.count === `Showing 1 - ${Math.min(size, want)} of ${want} results` && clearShown, `${tag} Topics = ${topic}: "${s.count}" (sheet ${want}), Clear All shown`);
        await page.selectOption('select[name="sort"]', 'Oldest');
        const dates = await page.evaluate(() => [...document.querySelectorAll('.provider-list-meta')].map((m) => Date.parse(m.textContent.split('Published Date: ')[1])));
        check(dates.every((d, i) => !i || d >= dates[i - 1]), `${tag} Oldest sorts ascending`);
        await page.selectOption('select[name="Updated"]', 'Custom Date Range');
        const custom = await page.evaluate(() => !document.querySelector('.provider-list-custom-dates').hidden);
        check(custom, `${tag} Custom Date Range shows From/To`);
        await page.click('.provider-list-clear');
        await page.waitForTimeout(100);
        s = await state();
        const reset = await page.evaluate(() => [document.querySelector('.provider-list-clear').hidden, document.querySelector('.provider-list-custom-dates').hidden]);
        check(s.count === `Showing 1 - ${Math.min(size, total)} of ${total} results` && reset[0] && reset[1], `${tag} Clear All resets: "${s.count}"`);
        const regional = await page.evaluate(() => {
          const li = document.querySelector('.provider-list-item.regional');
          return li ? [getComputedStyle(li).backgroundColor, [...li.querySelectorAll('.provider-list-regions li')].map((x) => x.textContent).join(',')] : null;
        });
        if (regional) check(regional[0] === 'rgb(254, 240, 236)' && !!regional[1], `${tag} region-only item tinted, badges ${regional[1]}`);
      }
      if (w !== 1024) await page.screenshot({ path: path.join(OUT, `${name}-${w}.png`), fullPage: true });
      check(!errors.length, `${tag} no console errors / failed requests ${errors.slice(0, 3).join(' ; ')}`);
      await page.close();
    }
  }
  await b.close();
  console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
})();
