/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- steps run one after another */
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';
import fs from 'node:fs';

const LIVE = process.env.HOST || 'https://main--highmark--adobedrago.aem.live';
const LISTED = process.env.LIST ? fs.readFileSync(process.env.LIST, 'utf8').split(/\r?\n/).filter(Boolean) : null;
const J = LISTED || ['/', '/plans', '/plans/individual-families', '/shop/home', '/member/member-guide', '/member/member-guide/find-care', '/resources', '/resources/mental-health-services', '/resources/mental-health-services/anxiety', '/resources/mental-health-services/anxiety/treatments', '/resources/answers', '/resources/answers/faq', '/resources/answers/faq/explanation-of-benefits', '/about', '/employer', '/privacy', '/non-discrimination', '/fraud'];
(async () => {
  const b = await chromium.launch();
  const out = [];
  for (const w of [1280, 390]) {
    let next = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (next < J.length) {
        const p = J[next]; next += 1;
        const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
        const pg = await ctx.newPage();
        const errs = []; const failed = [];
        pg.on('pageerror', (e) => errs.push(e.message.slice(0, 80)));
        pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 80)); });
        pg.on('response', (r) => { if (r.status() >= 400 && /aem\.(page|live)|content\.da\.live/.test(r.url())) failed.push(`${r.status()} ${r.url().replace(/^https:\/\/[^/]+/, '').slice(0, 70)}`); });
        await pg.goto(`${LIVE}${p}`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
        await pg.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 700) {
            window.scrollTo(0, y);
            await new Promise((r) => { setTimeout(r, 60); });
          }
        });
        await pg.waitForTimeout(800);
        const m = await pg.evaluate(() => ({
          url: window.location.pathname,
          h1: (document.querySelector('main h1')?.textContent || '').trim().slice(0, 40),
          brokenImg: [...document.querySelectorAll('main img')].filter((i) => i.complete && i.naturalWidth === 0).length,
          unloaded: [...document.querySelectorAll('main .block')].filter((x) => x.dataset.blockStatus !== 'loaded').length,
          hscroll: document.documentElement.scrollWidth > window.innerWidth + 1,
          modal: !!document.querySelector('dialog[open]'),
        }));
        out.push({
          w, p, ...m, errs, failed,
        });
        await ctx.close();
      }
    }));
  }
  await b.close();
  out.sort((a, z) => a.w - z.w || J.indexOf(a.p) - J.indexOf(z.p));
  let issues = 0;
  for (const r of out) {
    const flags = [r.errs.length && `errors ${r.errs.length}`, r.failed.length && `failed ${r.failed.length}`, r.brokenImg && `broken img ${r.brokenImg}`, r.unloaded && `unloaded blocks ${r.unloaded}`, r.hscroll && 'horizontal scroll', !r.h1 && 'no h1'].filter(Boolean);
    if (flags.length) issues += 1;
    console.log(`@${r.w} ${r.p.padEnd(52)} ${r.url !== r.p ? `(-> ${r.url}) ` : ''}${r.modal ? '[ZIP modal] ' : ''}${flags.length ? `!! ${flags.join(', ')}` : 'ok'}`);
    r.errs.slice(0, 2).forEach((e) => console.log(`      error: ${e}`));
    r.failed.slice(0, 2).forEach((e) => console.log(`      failed: ${e}`));
  }
  console.log(`${out.length} renders, ${issues} with issues`);
})();
