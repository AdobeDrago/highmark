/* eslint-env node */
/* eslint-disable no-console */
/**
 * Survey providers.highmark.com for the migration checklist: every sitemap URL's status (200,
 * or 302 to the Availity login), title, region, and the sequence of content components on the
 * page (from the server-rendered AEM markup), plus which of our pages link to it.
 * Writes work/survey.json, which classify.mjs reads.
 *
 * Usage: node survey.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
// optional dependency (see README): npm i --no-save linkedom
// eslint-disable-next-line import/no-extraneous-dependencies
import { parseHTML } from 'linkedom';
/* eslint-disable import/extensions -- common.mjs is an ES module next to these scripts */
import {
  LIVE, SRC, UA, WORK, pool,
} from './common.mjs';
/* eslint-enable import/extensions */

// chrome and layout-only components
const SKIP = /^(header-bar|main-navigation|search-bar|toast-message|footer|footer-disclaimer|breadcrumb|spacing|separator|experiencefragment|feedback.*|modal.*)$/;

const sitemap = await (await fetch(`${SRC}/sitemap.xml`, { headers: UA })).text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)]
  .map(([, loc, lastmod]) => ({ path: new URL(loc).pathname.replace(/\/$/, '') || '/', lastmod: lastmod.slice(0, 10) }));

const pages = await pool(urls, 6, async ({ path: p, lastmod }) => {
  const r = await fetch(`${SRC}${p}`, { headers: UA, redirect: 'manual' }).catch(() => null);
  if (!r) return { path: p, lastmod, status: 0 };
  if (r.status !== 200) {
    return {
      path: p, lastmod, status: r.status, location: r.headers.get('location'),
    };
  }
  const { document } = parseHTML(await r.text());
  const comps = [];
  document.querySelectorAll('.aem-GridColumn').forEach((el) => {
    if (el.querySelector('.aem-GridColumn')) return;
    if (el.closest('.experiencefragment, header, footer')) return;
    const name = [...el.classList].find((c) => !/^aem-|^responsivegrid$|^section$/.test(c));
    if (!name || SKIP.test(name)) return;
    if (comps[comps.length - 1] !== name) comps.push(name);
  });
  const og = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const title = (og || document.querySelector('title')?.textContent || '').replace(/\s+/g, ' ').trim();
  const pdfs = [...document.querySelectorAll('a[href$=".pdf"]')].length;
  const region = document.querySelector('meta[property="og:region"]')?.getAttribute('content') || '';
  return {
    path: p, lastmod, status: 200, title, comps, pdfs, region,
  };
});

// our side: the live provider pages, and redirect rows for provider paths
const index = await (await fetch(`${LIVE}/query-index.json?limit=5000`)).json();
const live = index.data.map((r) => r.path).filter((p) => p.startsWith('/providers'));
const redirects = (await (await fetch(`${LIVE}/redirects.json?limit=5000`)).json()).data
  .filter((r) => r.Source.startsWith('/providers/')).map((r) => r.Source);
// which of our documents link to which provider path (body links, nav, footer)
const linkedFrom = {};
const docs = [...live.map((p) => (p.endsWith('/') ? `${p}index` : p)),
  '/providers/fragments/nav', '/providers/fragments/footer', '/providers/fragments/service-centers'];
await pool(docs, 6, async (doc) => {
  const html = await (await fetch(`${LIVE}${doc}.plain.html`)).text();
  [...html.matchAll(/href="([^"]+)"/g)].forEach(([, href]) => {
    const u = new URL(href.replace(/&amp;/g, '&'), LIVE);
    let p = null;
    if (u.origin === LIVE && u.pathname.startsWith('/providers/')) p = u.pathname.replace(/^\/providers/, '').replace(/\/$/, '') || '/';
    else if (u.host === 'providers.highmark.com') p = decodeURI(u.pathname).replace(/\.html$/, '').replace(/\/$/, '') || '/';
    if (p) (linkedFrom[p] = linkedFrom[p] || new Set()).add(doc.replace(/\/index$/, '/'));
  });
});

fs.mkdirSync(WORK, { recursive: true });
fs.writeFileSync(path.join(WORK, 'survey.json'), JSON.stringify({
  surveyed: new Date().toISOString(),
  pages,
  live,
  redirects,
  linkedFrom: Object.fromEntries(Object.entries(linkedFrom).map(([k, v]) => [k, [...v]])),
}, null, 1));
const by = pages.reduce((a, p) => ({ ...a, [p.status]: (a[p.status] || 0) + 1 }), {});
console.log(`${pages.length} URLs`, by, `| live provider pages ${live.length}, redirect rows ${redirects.length}, linked paths ${Object.keys(linkedFrom).length}`);
