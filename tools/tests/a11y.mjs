/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- steps run one after another */
// axe (WCAG 2.1 A/AA and best practice) on main at 1280 and 390, with list filters open on
// phones. PAGES: comma-separated paths (default: the two provider list layouts).
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';

const AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
const HOST = process.env.HOST || 'http://localhost:3100';
const PAGES = (process.env.PAGES || '/providers/claims/reimbursement-resources/reimbursement-policies,/providers/communications-hub/news-and-updates').split(',');

(async () => {
  const b = await chromium.launch();
  for (const w of [1280, 390]) {
    for (const path of PAGES) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } });
      await p.goto(`${HOST}${path}`, { waitUntil: 'networkidle' });
      // blocks finish decorating after network idle
      await p.waitForTimeout(800);
      if (w < 992 && await p.$('.provider-list-filters-toggle')) await p.click('.provider-list-filters-toggle');
      await p.addScriptTag({ url: AXE });
      const r = await p.evaluate(async () => {
        const res = await window.axe.run('main', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] });
        return res.violations.map((v) => `${v.impact} ${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
      });
      console.log(`@${w} ${path.split('/').pop()}: ${r.length ? `\n  ${r.join('\n  ')}` : 'no violations'}`);
      await p.close();
    }
  }
  await b.close();
})();
