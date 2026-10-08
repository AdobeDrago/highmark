/* eslint-env node */
/* eslint-disable no-console */
/**
 * Rebuilds the DA `/redirects` sheet so no internal link on the site lands on a 404:
 * every internal link that 404s on the live site is redirected to the same page on its
 * source site, or to our page when the source itself redirects to a page we have migrated.
 * Pages under /providers come from providers.highmark.com (/providers/claims is its /claims);
 * everything else from highmark.com.
 * Rows already in the sheet are re-checked, so a path that now has a DA document drops out.
 *
 * Redirects take precedence over pages: a row hides any page published at that path.
 * Run this after each import batch and publish the new sheet before (or with) the new pages.
 *
 * Usage: node tools/redirects/build-redirects.mjs [--upload]
 *   Writes redirects.json (DA sheet format) to the current directory. --upload also uploads
 *   it to DA and previews it; check preview, then publish /redirects.json from DA or Sidekick.
 * Needs a DA token: ~/.aem/da-token.json (da-auth-helper) or .hlx/.da-token.json (aem content).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ORG = 'adobedrago';
const SITE = 'highmark';
const LIVE = `https://main--${SITE}--${ORG}.aem.live`;
const PREVIEW = `https://main--${SITE}--${ORG}.aem.page`;
const SOURCE = 'https://www.highmark.com';
// Source sites by path prefix: our /providers/x is providers.highmark.com/x.
const SOURCES = [
  { prefix: '/providers', origin: 'https://providers.highmark.com' },
  { prefix: '', origin: SOURCE },
];
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' };
// Fragments whose links are checked too: blocks load them in the browser, so their links are
// not in any page's HTML. A provider side nav lists every page in its section.
const FRAGMENTS = ['/nav', '/footer', '/shop/fragments/shopx-header', '/shop/fragments/shopx-footer',
  '/providers/fragments/nav', '/providers/fragments/footer', '/providers/fragments/service-centers',
  ...['authorization', 'claims', 'policies-and-programs', 'provider-network',
    'resources-and-education', 'communications-hub'].map((s) => `/providers/fragments/sidenav/${s}`)];
// Paths that always redirect: drafts that exist in DA but should not be published, and
// retired pages. path -> destination.
const FORCE = {
  '/resources/answers/faq/medicare-reservations': `${SOURCE}/resources/answers/faq/medicare`,
  '/shop/home': '/shop/', // the shop home moved to /shop/ (2026-10-01)
  '/shop': '/shop/', // a folder's index page is only served with the trailing slash
  '/shop/beta/home': '/shop/', // a copy of the old shop home whose links don't work here (2026-10-05)
  '/providers': '/providers/', // the provider pages' home (DA /providers/index)
};

function readToken() {
  const files = [path.join(os.homedir(), '.aem', 'da-token.json'), path.join('.hlx', '.da-token.json')];
  const file = files.find((f) => fs.existsSync(f));
  if (!file) throw new Error('No DA token found; run `npx github:adobe-rnd/da-auth-helper token` first.');
  const { access_token: token, expires_at: expires } = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (expires && expires < Date.now() + 60000) throw new Error(`DA token in ${file} has expired.`);
  return token;
}

async function pool(items, size, fn) {
  const out = [];
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      // eslint-disable-next-line no-await-in-loop
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

const normPath = (p) => decodeURI(p).replace(/\.html$/, '').replace(/\/+$/, '') || '/';

async function internalLinks(host, page) {
  const res = await fetch(`${host}${page === '/' ? '/index' : page}.plain.html`);
  if (!res.ok) return [];
  const html = await res.text();
  return [...html.matchAll(/href="([^"]+)"/g)].map(([, href]) => {
    if (!href.startsWith('/') || href.startsWith('//')) return null;
    const p = normPath(new URL(href, LIVE).pathname);
    return /^\/(modals|fragments)\//.test(p) || /\{\{|%7B%7B/i.test(href) ? null : p;
  }).filter(Boolean);
}

/** The source site of one of our paths, and the path there. */
function sourceOf(p) {
  const { prefix, origin } = SOURCES.find((s) => !s.prefix || p === s.prefix || p.startsWith(`${s.prefix}/`));
  return { prefix, origin, path: p.slice(prefix.length) || '/' };
}

async function classify(p, auth) {
  if (FORCE[p]) return { Source: p, Destination: FORCE[p] };
  const da = await fetch(`https://admin.da.live/source/${ORG}/${SITE}${p}.html`, { method: 'HEAD', headers: auth });
  if (da.status === 200) return { skip: `${p}: has a DA document (publish it instead)` };
  const { prefix, origin, path: srcPath } = sourceOf(p);
  const src = await fetch(`${origin}${encodeURI(srcPath)}`, { headers: UA }).catch(() => ({ status: 0 }));
  if (src.status !== 200) return { skip: `${p}: source returns ${src.status}; fix the link instead` };
  const final = new URL(src.url);
  const finalPath = normPath(final.pathname);
  if (final.origin === origin && finalPath !== srcPath) {
    const ours = await fetch(`${LIVE}${prefix}${finalPath}`, { method: 'HEAD', redirect: 'manual' });
    if (ours.status === 200) return { Source: p, Destination: `${prefix}${finalPath}` };
  }
  // a provider page behind the Availity login redirects to the login; send visitors to the
  // page itself, which returns them there after they sign in
  const own = final.origin === origin || prefix;
  return { Source: p, Destination: own ? `${origin}${srcPath}` : src.url };
}

async function upload(file, token) {
  const auth = { Authorization: `Bearer ${token}` };
  const body = new FormData();
  body.append('data', new Blob([fs.readFileSync(file)], { type: 'application/json' }), 'redirects.json');
  const put = await fetch(`https://admin.da.live/source/${ORG}/${SITE}/redirects.json`, { method: 'POST', body, headers: auth });
  const preview = await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main/redirects.json`, { method: 'POST', headers: auth });
  console.log(`Uploaded to DA (${put.status}), previewed (${preview.status}). Check ${PREVIEW}, then publish /redirects.json.`);
}

const token = readToken();
const auth = { Authorization: `Bearer ${token}` };
const index = await (await fetch(`${LIVE}/query-index.json?limit=5000`)).json();
const pages = [...new Set([...FRAGMENTS, ...index.data.map((r) => normPath(r.path))])];
const sources = [...pages.map((p) => [LIVE, p]), ...FRAGMENTS.map((p) => [PREVIEW, p])];
const linkLists = await pool(sources, 8, ([host, p]) => internalLinks(host, p));
const targets = [...new Set(linkLists.flat())];
const statuses = await pool(targets, 10, async (p) => [p, (await fetch(`${LIVE}${encodeURI(p)}`, { method: 'HEAD', redirect: 'manual' })).status]);
const dead = statuses.filter(([, s]) => s === 404).map(([p]) => p);
const current = await fetch(`${LIVE}/redirects.json?limit=5000`).then((r) => (r.ok ? r.json() : { data: [] }));
const currentRows = current.data || [];
const candidates = [
  ...new Set([...dead, ...currentRows.map((r) => r.Source), ...Object.keys(FORCE)]),
].sort();
const results = await pool(candidates, 6, (p) => classify(p, auth));
const data = results.filter((r) => r.Source);
fs.writeFileSync('redirects.json', `${JSON.stringify({
  total: data.length, offset: 0, limit: data.length, data, ':type': 'sheet',
}, null, 2)}\n`);

const before = new Set(currentRows.map((r) => r.Source));
const after = new Set(data.map((r) => r.Source));
console.log(`${pages.length} pages, ${targets.length} internal link targets, ${dead.length} returning 404.`);
console.log(`redirects.json: ${data.length} rows (${[...after].filter((s) => !before.has(s)).length} new, ${[...before].filter((s) => !after.has(s)).length} dropped).`);
results.filter((r) => r.skip).forEach((r) => console.log(`  skipped ${r.skip}`));
if (process.argv.includes('--upload')) await upload('redirects.json', token);
