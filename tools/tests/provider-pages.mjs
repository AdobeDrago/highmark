/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- steps run one after another */
// Render the provider pages (HOST, default local aem up) at WIDTHS and report problems:
// console errors, failed requests, broken images, blocks that did not load, header/footer
// structure, breadcrumbs, horizontal overflow. Full-page screenshots to shots/<w>-<name>.png.
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'shots');
const HOST = process.env.HOST || 'http://localhost:3100';
const WIDTHS = (process.env.WIDTHS || '1280,390').split(',').map(Number);
const PAGES = (process.env.PAGES || '/providers/,/providers/authorization,/providers/claims,/providers/policies-and-programs,/providers/provider-network,/providers/resources-and-education,/providers/communications-hub,/providers/contact-us,/providers/legal-information').split(',');
const SHOTS = process.env.SHOTS !== '0';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  let problems = 0;
  for (const w of WIDTHS) {
    for (const p of PAGES) {
      const pg = await b.newPage({ viewport: { width: w, height: 900 } });
      const errors = [];
      pg.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 160)}`); });
      pg.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 160)}`));
      pg.on('response', (r) => { if (r.status() >= 400 && !/favicon|rum|\.well-known/.test(r.url())) errors.push(`${r.status()} ${r.url().slice(0, 140)}`); });
      await pg.goto(`${HOST}${p}`, { waitUntil: 'networkidle', timeout: 60000 });
      await pg.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => { setTimeout(r, 80); });
        }
        window.scrollTo(0, 0);
      });
      await pg.waitForTimeout(1200);
      const r = await pg.evaluate(() => {
        const brokenImgs = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && i.getBoundingClientRect().width > 0).map((i) => i.currentSrc || i.src);
        const unloaded = [...document.querySelectorAll('[data-block-status]')].filter((bl) => bl.dataset.blockStatus !== 'loaded').map((bl) => `${bl.className}:${bl.dataset.blockStatus}`);
        const nav = document.querySelector('header nav');
        const crumbs = [...document.querySelectorAll('.breadcrumbs-list li')].map((li) => li.textContent.trim() + (li.querySelector('a') ? `(${li.querySelector('a').getAttribute('href')})` : ''));
        const overflow = document.documentElement.scrollWidth - window.innerWidth;
        return {
          title: document.title,
          height: document.documentElement.scrollHeight,
          header: nav ? {
            searchRow: !!nav.querySelector('.nav-search-row'),
            searchAction: nav.querySelector('form.nav-search')?.action,
            panelsFull: nav.classList.contains('nav-panels-full'),
            topItems: nav.querySelectorAll('.nav-primary > li').length,
            locks: nav.querySelectorAll('.icon-lock img').length,
            icons: nav.querySelectorAll('.nav-icons > li').length,
            headerH: Math.round(document.querySelector('header').getBoundingClientRect().height),
          } : null,
          footerCols: document.querySelectorAll('footer .footer-column').length,
          footerLegal: !!document.querySelector('footer .footer-legal p'),
          serviceCenters: !!document.querySelector('.section.service-centers li'),
          crumbs,
          overflow,
          brokenImgs,
          unloaded,
          sections: document.querySelectorAll('main > .section').length,
        };
      });
      const name = p.replace(/^\/providers\/?/, '') || 'home';
      if (SHOTS) await pg.screenshot({ path: path.join(OUT, `${w}-${name}.png`), fullPage: true });
      const issues = [...errors, ...r.brokenImgs.map((s) => `broken img ${s}`), ...r.unloaded.map((s) => `block ${s}`), ...(r.overflow > 0 ? [`overflow ${r.overflow}px`] : [])];
      problems += issues.length;
      console.log(`${w} ${p} h=${r.height} sections=${r.sections} header=${JSON.stringify(r.header)} footerCols=${r.footerCols} legal=${r.footerLegal} svc=${r.serviceCenters} crumbs=${r.crumbs.join(' > ')}`);
      issues.forEach((i) => console.log(`   ! ${i}`));
      await pg.close();
    }
  }
  console.log(`${problems} problems`);
  await b.close();
})();
