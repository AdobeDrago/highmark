/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- steps run one after another */
// Provider content and article pages on HOST (template provider-content): per page and width,
// no errors or overflow; the panels the page document has (region rows with badges, grey boxes);
// on news articles the heading classes, the two-line side nav and the three spotlight cards.
// Pages: the batch lists in ../provider-import/batches named by LISTS (default: batch 4 and the
// batch-2 pages rebuilt with panels).
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = process.env.HOST || 'http://localhost:3100';
const WIDTHS = (process.env.WIDTHS || '1280,1024,390').split(',').map(Number);
const BATCHES = path.join(path.dirname(fileURLToPath(import.meta.url)), '../provider-import/batches');
const lists = (process.env.LISTS || 'batch4.txt,panels2.txt').split(',');
const paths = lists.flatMap((f) => fs.readFileSync(path.join(BATCHES, f), 'utf8').trim().split(/\r?\n/));
let fails = 0;
const check = (ok, msg) => { if (!ok) { fails += 1; console.log(`FAIL  ${msg}`); } };

(async () => {
  const b = await chromium.launch();
  const stats = { renders: 0 };
  for (const w of WIDTHS) {
    let next = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      const page = await b.newPage({ viewport: { width: w, height: 900 } });
      while (next < paths.length) {
        const p = paths[next]; next += 1;
        const errors = [];
        const onErr = (e) => errors.push(e.message || e.text?.() || String(e));
        page.removeAllListeners('pageerror'); page.removeAllListeners('console'); page.removeAllListeners('response');
        page.on('pageerror', onErr);
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) errors.push(`${r.status()} ${r.url()}`); });
        await page.goto(`${HOST}/providers${p}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        // what the page should show: its document, as the pipeline serves it
        const want = await page.evaluate(async (url) => {
          const html = await (await fetch(url)).text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const h1 = doc.querySelector('h1');
          return {
            regionBlocks: doc.querySelectorAll('.provider-panel.region').length,
            regionRows: doc.querySelectorAll('.provider-panel.region > div').length,
            grey: doc.querySelectorAll('.provider-panel:not(.region)').length,
            article: [...doc.querySelectorAll('p')].some((x) => /^Published Date:/.test(x.textContent.trim())),
            spotlight: !!doc.querySelector('a[href*="/fragments/spotlight"]'),
            headerRegions: h1?.nextElementSibling?.tagName === 'UL',
          };
        }, `${HOST}/providers${p}.plain.html`);
        const got = await page.evaluate(() => {
          const q = (s) => document.querySelectorAll(s).length;
          const nav = [...document.querySelectorAll('.provider-sidenav nav a')].map((a) => a.textContent.trim());
          const current = document.querySelector('.provider-sidenav li.current > a')?.textContent.trim();
          const badgesOk = [...document.querySelectorAll('.provider-panel.region .provider-panel-item')]
            .every((it) => it.querySelector('.provider-panel-regions li'));
          return {
            regionBlocks: q('.provider-panel.region'),
            regionRows: q('.provider-panel.region .provider-panel-item'),
            badgesOk,
            grey: q('.provider-panel:not(.region)'),
            title: q('h1.article-title'),
            topic: q('p.article-topic'),
            date: q('p.article-date'),
            audience: q('p.article-for'),
            headerRegions: q('ul.article-regions li'),
            nav,
            current,
            spotCards: q('.section.spotlight .cards li'),
            spotLinks: [...document.querySelectorAll('.section.spotlight .cards h3 a')].map((a) => a.getAttribute('href')),
            overflow: document.documentElement.scrollWidth > window.innerWidth,
            crumbs: [...document.querySelectorAll('.breadcrumbs a, nav.breadcrumbs a, .breadcrumb a')].length,
          };
        });
        const tag = `@${w} ${p}`;
        check(!errors.length, `${tag} errors: ${errors.slice(0, 2).join(' ; ')}`);
        check(!got.overflow, `${tag} horizontal overflow`);
        check(got.regionBlocks === want.regionBlocks && got.regionRows === want.regionRows && got.badgesOk, `${tag} region panels ${got.regionBlocks}/${got.regionRows} rows, want ${want.regionBlocks}/${want.regionRows}, badges ${got.badgesOk}`);
        check(got.grey === want.grey, `${tag} grey panels ${got.grey}, want ${want.grey}`);
        if (want.article) {
          check(got.title === 1 && got.topic === 1 && got.date === 1 && got.audience === 1, `${tag} article heading classes ${JSON.stringify([got.title, got.topic, got.date, got.audience])}`);
          check(!want.headerRegions || got.headerRegions > 0, `${tag} header region badges`);
          const listing = p.includes('/provider-news/') ? 'Provider News' : 'News and Updates';
          check(got.nav.join('|') === `Communications Hub|${listing}` && got.current === listing, `${tag} side nav ${got.nav.join(' > ')} (current ${got.current})`);
        }
        if (want.spotlight) check(got.spotCards === 3 && got.spotLinks.every((h) => h.startsWith('/providers/communications-hub/news-and-updates/')), `${tag} spotlight ${got.spotCards} cards`);
        stats.renders += 1;
      }
      await page.close();
    }));
  }
  await b.close();
  console.log(fails ? `${fails} FAILED (${stats.renders} page renders)` : `ALL PASSED (${stats.renders} page renders)`);
})();
