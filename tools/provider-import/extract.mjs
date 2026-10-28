/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- steps run one after another */
/**
 * Extract the visible content of each top-level AEM component on providers.highmark.com
 * pages, simplified to semantic HTML (headings, paragraphs, lists, links, images, emphasis),
 * with the component's name and a few layout facts (background colour, image side, the tinted
 * box it sits in). Writes work/src/<name>.json per page, with the page's metadata; build.mjs
 * reads them.
 *
 * Usage: node extract.mjs <source path|batch file>...   (e.g. batches/batch4.txt)
 *   Without arguments, the pages in PAGES (comma-separated source paths).
 */
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
/* eslint-disable import/extensions -- common.mjs is an ES module next to these scripts */
import { SRC, WORK, pathsFrom } from './common.mjs';
/* eslint-enable import/extensions */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const args = process.argv.slice(2);
const PAGES = args.length ? pathsFrom(args) : (process.env.PAGES || '').split(',').filter(Boolean);
const OUT = path.join(WORK, 'src');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  for (const p of PAGES) {
    try {
      const pg = await b.newPage({ viewport: { width: 1280, height: 900 }, userAgent: UA });
      await pg.goto(`${SRC}${p}`, { waitUntil: 'networkidle', timeout: 60000 });
      // scroll so lazy images resolve
      await pg.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => { setTimeout(r, 120); });
        }
        window.scrollTo(0, 0);
      });
      await pg.waitForTimeout(1200);
      // open every collapsed panel (accordion answers) so its content counts as visible
      await pg.evaluate(() => document.querySelectorAll('.collapse, .collapsible-item-description').forEach((e) => e.style.setProperty('display', 'block', 'important')));
      const extractFn = (panelText) => {
        const KEEP = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'LI', 'A', 'IMG', 'STRONG', 'B', 'EM', 'I', 'SUB', 'SUP', 'BR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'HR']);
        const visible = (el) => {
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden') return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };
        const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // material icon glyph names render as text; drop them (and tooltips) but report icons
        const isGlyph = (el) => /material-(icons|symbols)/.test(el.className || '');
        function simplify(node) {
          if (node.nodeType === 3) return esc(node.textContent.replace(/\s+/g, ' '));
          if (node.nodeType !== 1) return '';
          const el = node;
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'BUTTON', 'svg', 'INPUT', 'SELECT', 'FORM'].includes(el.tagName)) return '';
          if (isGlyph(el)) return el.textContent.trim() ? `[icon:${el.textContent.trim()}]` : '';
          // a link classed tooltip* is one behind the Availity login (the source shows a lock and a
          // tooltip); keep it, flagged, and drop only the tooltip text itself
          const cls = typeof el.className === 'string' ? el.className : '';
          if (el.tagName !== 'A' && /tooltip|sr-only|visually-hidden/i.test(cls)) return '';
          if (el.tagName !== 'IMG' && el.tagName !== 'BR' && !visible(el)) return '';
          const inner = [...el.childNodes].map(simplify).join('');
          if (el.tagName === 'IMG') {
            if (!visible(el)) return '';
            const src = el.currentSrc || el.src;
            const r = el.getBoundingClientRect();
            // x: where the image sits in its component (side panels put it left or right)
            const comp = el.closest('.aem-GridColumn')?.getBoundingClientRect();
            const rx = comp && comp.width ? Math.round(((r.left + r.width / 2 - comp.left) / comp.width) * 100) : '';
            return `<img src="${src}" alt="${esc(el.alt || '')}" data-w="${Math.round(r.width)}" data-h="${Math.round(r.height)}" data-nw="${el.naturalWidth}" data-nh="${el.naturalHeight}" data-cx="${rx}">`;
          }
          if (el.tagName === 'A') {
            const href = el.getAttribute('href');
            if (!href) return inner;
            return `<a href="${esc(href)}"${el.target === '_blank' ? ' target="_blank"' : ''}${/tooltip/i.test(cls) ? ' data-lock="1"' : ''}>${inner}</a>`;
          }
          if (KEEP.has(el.tagName)) {
            if (el.tagName === 'BR' || el.tagName === 'HR') return `<${el.tagName.toLowerCase()}>`;
            const t = { B: 'strong', I: 'em' }[el.tagName] || el.tagName.toLowerCase();
            return inner.trim() ? `<${t}>${inner}</${t}>` : '';
          }
          // a background image on a wrapper
          const bg = getComputedStyle(el).backgroundImage;
          const bgImg = bg && bg.startsWith('url(') ? `<img src="${bg.slice(5, -2)}" alt="" data-bg="1" data-w="${Math.round(el.getBoundingClientRect().width)}" data-h="${Math.round(el.getBoundingClientRect().height)}">` : '';
          return bgImg + inner;
        }
        const skip = (el) => el.closest('.header-bar, .main-navigation, .search-bar, .toast-message, .footer, footer, header');
        const comps = [];
        // tinted layout containers (grey "Additional Information" boxes): which one a component
        // sits in, so the converter can wrap neighbouring components in one panel
        const boxes = [...document.querySelectorAll('.custom-layout-container')].filter((x) => {
          const c = getComputedStyle(x).backgroundColor;
          return c !== 'rgba(0, 0, 0, 0)' && c !== 'rgb(255, 255, 255)';
        });
        const root = panelText ? [...document.querySelectorAll('[role="tabpanel"]')].find((x) => x.getBoundingClientRect().height > 0 && x.textContent.includes(panelText)) : document;
        root.querySelectorAll('.aem-GridColumn').forEach((el) => {
          if (skip(el) || el.querySelector('.aem-GridColumn')) return;
          const name = [...el.classList].find((c) => !/^aem-|^responsivegrid$|^section$/.test(c));
          if (!name || !visible(el)) return;
          const r = el.getBoundingClientRect();
          // background colour of the component (first non-transparent going down a few levels)
          let bgc = '';
          for (const x of [el, ...el.querySelectorAll('*')].slice(0, 12)) {
            const c = getComputedStyle(x).backgroundColor;
            if (c && c !== 'rgba(0, 0, 0, 0)') { bgc = c; break; }
          }
          const html = simplify(el).replace(/\s+/g, ' ').replace(/> </g, '><').trim();
          // text colour of the first visible heading (white over a dark photo)
          const head = [...el.querySelectorAll('h1, h2')].find((x) => visible(x));
          const fg = head ? getComputedStyle(head).color : '';
          const box = boxes.find((x) => x.contains(el));
          comps.push({
            name,
            y: Math.round(r.y + window.scrollY),
            w: Math.round(r.width),
            h: Math.round(r.height),
            x: Math.round(r.x),
            bg: bgc,
            fg,
            html,
            ...(box && { box: boxes.indexOf(box), boxBg: getComputedStyle(box).backgroundColor }),
          });
        });
        const meta = {};
        document.querySelectorAll('meta[name], meta[property]').forEach((m) => {
          meta[m.getAttribute('name') || m.getAttribute('property')] = m.content;
        });
        return { title: document.title, meta, comps };
      };
      const data = await pg.evaluate(extractFn, null);
      if (p === '/contact-us') {
        await pg.locator('[role="tab"]', { hasText: /Clinical/i }).first().click();
        await pg.waitForTimeout(800);
        data.tab2 = (await pg.evaluate(extractFn, 'Highmark Clinical Services')).comps;
      }
      const name = p === '/' ? 'index' : p.slice(1).replace(/\//g, '__');
      fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 1));
      console.log(`${p}: ${data.comps.length} components, title "${data.title}"`);
      await pg.close();
    } catch (e) { console.log(`FAILED ${p}: ${e.message.slice(0, 120)}`); }
  }
  await b.close();
})();
