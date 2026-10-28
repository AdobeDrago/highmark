/* eslint-env node */
/* eslint-disable no-console */
/**
 * Re-syncs the left nav (cards-minimal-light-sidenav block) of our pages with the
 * source's: for each page with the block, the rows the source nav implies are compared
 * with the block in the page's DA document, and differing blocks are rebuilt.
 *
 * Rows (see blocks/cards-minimal-light-sidenav): parent, then each item as current or
 * sibling, each followed by its sub-pages as child rows. The block opens the current
 * page's sub-pages and collapses a sibling's, with the toggle, as the source does.
 * The source writes its own page paths (/content/digital-marketing/.../home/x); they
 * become our paths (/x).
 *
 * Only the block changes: the rest of the document is kept as it is in DA. New links to
 * pages we don't have 404 until /redirects covers them: publish the pages, then run
 * tools/redirects/build-redirects.mjs --upload and publish /redirects.json.
 *
 * Usage: node tools/sidenav/sync-sidenav.mjs [--apply] [path ...]
 *   Without paths, every page in the live query index that has the block.
 *   Without --apply, lists the pages whose nav differs and the new links' status on
 *   our live site. --apply uploads the rebuilt documents to DA and previews them (never
 *   publishes). Needs linkedom (npm i --no-save linkedom) and a DA token as for
 *   tools/redirects/build-redirects.mjs.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// optional dependency (see tools/provider-import/README.md): npm i --no-save linkedom
// eslint-disable-next-line import/no-extraneous-dependencies
import { parseHTML } from 'linkedom';

const ORG = 'adobedrago';
const SITE = 'highmark';
const LIVE = `https://main--${SITE}--${ORG}.aem.live`;
const SOURCE = 'https://www.highmark.com';
const SOURCE_ROOT = /^\/content\/digital-marketing\/en\/highmark\/highmarkdotcom\/home/;

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const paths = args.filter((a) => !a.startsWith('--')).map((p) => `/${p.replace(/^\/|\.html$/g, '')}`);

function readToken() {
  const files = [path.join(os.homedir(), '.aem', 'da-token.json'), path.join('.hlx', '.da-token.json')];
  const file = files.find((f) => fs.existsSync(f));
  // no token file: send no Authorization header, for environments that inject credentials
  if (!file) return null;
  const { access_token: token, expires_at: expires } = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (expires && expires < Date.now() + 60000) throw new Error(`DA token in ${file} has expired.`);
  return token;
}
const token = readToken();
const auth = token ? { Authorization: `Bearer ${token}` } : {};

const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
const ourPath = (href) => (href || '').replace(SOURCE_ROOT, '').replace(/^https:\/\/www\.highmark\.com/, '')
  .replace(/\.html$/, '').replace(/(.)\/$/, '$1') || '/';
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const key = (rows) => rows.map((r) => r.join('|')).join('\n');

async function pool(items, size, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) {
      const n = i;
      i += 1;
      // eslint-disable-next-line no-await-in-loop
      out[n] = await fn(items[n]);
    }
  }));
  return out;
}

/** The source nav as rows. Its items are a list under the parent's item, or (since
 * October 2026) items next to it; a submenu is ul.subnavitem-list. */
function sourceRows(html) {
  const { document } = parseHTML(html);
  const list = document.querySelector('main .sidenav-item-list, .sidenav .sidenav-item-list');
  if (!list) return null;
  const rows = [];
  const parent = list.querySelector('a.side-nav-item-parent');
  if (parent) rows.push(['parent', clean(parent.textContent), ourPath(parent.getAttribute('href'))]);
  const root = list.querySelector(':scope > li.sidenav-item-root');
  const nested = root?.querySelector(':scope > ul:not(.subnavitem-list)');
  const items = nested ? [...nested.children] : [...list.children].filter((li) => li !== root);
  const linkOf = (li) => li.querySelector(':scope > a, :scope > .sidenav-item-row > a');
  items.forEach((li) => {
    const a = linkOf(li);
    if (!a) return;
    const active = a.classList.contains('active') || a.getAttribute('aria-current') === 'page';
    rows.push([active ? 'current' : 'sibling', clean(a.textContent), ourPath(a.getAttribute('href'))]);
    [...(li.querySelector(':scope > ul.subnavitem-list')?.children || [])].forEach((c) => {
      const ca = linkOf(c);
      if (ca) rows.push(['child', clean(ca.textContent), ourPath(ca.getAttribute('href'))]);
    });
  });
  return rows;
}

/** The block's rows in a DA document, and the document. */
function daBlock(html) {
  const { document } = parseHTML(html);
  const block = document.querySelector('.cards-minimal-light-sidenav');
  if (!block) return null;
  const rows = [...block.children].map((row) => {
    const cells = [...row.children];
    const a = cells[1]?.querySelector('a');
    return [clean(cells[0].textContent), clean(a ? a.textContent : cells[1]?.textContent), ourPath(a?.getAttribute('href'))];
  });
  return { document, block, rows };
}

let pages = paths;
if (!pages.length) {
  const { data } = await (await fetch(`${LIVE}/query-index.json?limit=10000`)).json();
  const found = await pool(data.map((r) => r.path), 8, async (p) => {
    const html = await (await fetch(`${LIVE}${p}.plain.html`)).text();
    return html.includes('class="cards-minimal-light-sidenav"') ? p.replace(/\/$/, '/index') : null;
  });
  pages = found.filter(Boolean);
}

const results = await pool(pages, 6, async (p) => {
  const docPath = p.replace(/\/index$/, '');
  const [src, da] = await Promise.all([
    fetch(`${SOURCE}${docPath || '/'}`, { headers: { 'user-agent': 'Mozilla/5.0' } }).then((r) => (r.ok ? r.text() : null)),
    fetch(`https://admin.da.live/source/${ORG}/${SITE}${p}.html`, { headers: auth }).then((r) => (r.ok ? r.text() : null)),
  ]);
  const rows = src && sourceRows(src);
  const doc = da && daBlock(da);
  if (!rows || !doc) return { p, error: !rows ? 'no source nav' : 'no block in DA' };
  return {
    p, rows, doc, changed: key(rows) !== key(doc.rows),
  };
});

const changed = results.filter((r) => r.changed);
results.filter((r) => r.error).forEach((r) => console.log(`skip ${r.p}: ${r.error}`));
console.log(`${results.length} pages, ${changed.length} with a different nav`);

const links = [...new Set(changed.flatMap((r) => r.rows.map(([, , href]) => href)))];
const status = Object.fromEntries(await pool(links, 8, async (href) => {
  const resp = await fetch(`${LIVE}${href}`, { redirect: 'manual' });
  return [href, resp.status];
}));

await pool(changed, 1, async (r) => {
  console.log(`  ${r.p}: ${r.doc.rows.length} -> ${r.rows.length} rows`);
  if (apply) {
    r.doc.block.innerHTML = r.rows.map(([level, label, href]) => `<div><div><p>${level}</p></div><div><p><a href="${href}">${esc(label)}</a></p></div></div>`).join('');
    const form = new FormData();
    form.append('data', new Blob([r.doc.document.toString()], { type: 'text/html' }), `${r.p.split('/').pop()}.html`);
    const up = await fetch(`https://admin.da.live/source/${ORG}/${SITE}${r.p}.html`, { method: 'POST', body: form, headers: auth });
    const pv = up.ok ? await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main${r.p.replace(/\/index$/, '/')}`, { method: 'POST', headers: auth }) : null;
    console.log(`    upload ${up.status}, preview ${pv ? pv.status : '-'}`);
  }
});
const missing = links.filter((h) => status[h] === 404);
console.log(`new menus' links: ${links.length}; redirected to the source: ${links.filter((h) => [301, 302].includes(status[h])).length}; 404 on our live site: ${missing.length}`);
missing.forEach((h) => console.log(`  404 ${h}`));
