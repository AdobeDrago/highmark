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
 * Links are read from every page in the live query index, the fragments in FRAGMENTS and the
 * list sheets in LISTS (live and preview for both).
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
    'resources-and-education', 'communications-hub'].map((s) => `/providers/fragments/sidenav/${s}`),
  // the regional member pages' headers and footers (/member/bcbs, ...; footer-only links such
  // as /help and Delaware's Disputes and Appeals)
  ...['bcbs', 'blueshield', 'bcbswv', 'bcbsde', 'bcbswny', 'blueshieldneny']
    .flatMap((r) => [`/member/fragments/${r}/nav`, `/member/fragments/${r}/footer`])];
// Sheets behind provider-list blocks: the block renders their Link column in the browser, so
// those links are in no page's HTML either (tools/provider-lists/build-provider-lists.mjs).
const LISTS = ['reimbursement-policies', 'news-and-updates', 'provider-news', 'medical-policy-update',
  'formulary-updates'].map((l) => `/providers/lists/${l}.json`);
// Paths that always redirect: drafts that exist in DA but should not be published, and
// retired pages. path -> destination.
const FORCE = {
  // the source's old URL for its Medicare FAQ, migrated here (2026-10-14)
  '/resources/answers/faq/medicare-reservations': '/resources/answers/faq/medicare',
  '/shop/home': '/shop/', // the shop home moved to /shop/ (2026-10-01)
  '/shop': '/shop/', // a folder's index page is only served with the trailing slash
  '/shop/beta/home': '/shop/', // a copy of the old shop home whose links don't work here (2026-10-05)
  '/providers': '/providers/', // the provider pages' home (DA /providers/index)
  // the regional member footers' Help link: highmark.com sends /help to its home page
  // (/content/.../home.html, which the source-redirect check can't map), here ours (2026-10-14)
  '/help': '/',
  // published here, but its row still sent it to highmark.com; kept that way until its
  // owner decides to show our page (2026-10-22)
  '/public-policy': 'https://www.highmark.com/public-policy',
  // Leadership bios whose highmark.com URLs aren't valid EDS paths (mixed case, trailing
  // hyphen): served here at the lowercase path (2026-10-12).
  ...Object.fromEntries([
    'EdwardShellard', 'JaySheehy', 'JessicaCox', 'JoeHaddock', 'Timothy-Vessel', 'VictorFields', 'kate-musler-',
  ].map((name) => [
    `/about/our-story/leadership-team-board/${name}`,
    `/about/our-story/leadership-team-board/${name.toLowerCase().replace(/-+$/, '')}`,
  ])),
};

function readToken() {
  const files = [path.join(os.homedir(), '.aem', 'da-token.json'), path.join('.hlx', '.da-token.json')];
  const file = files.find((f) => fs.existsSync(f));
  // no token file: send no Authorization header, for environments that inject credentials
  // (a local clone without a token gets 401s; run `npx github:adobe-rnd/da-auth-helper token`)
  if (!file) return null;
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

// Responses that are neither a success nor a 404 (rate limiting, server errors). Any of them
// means the run saw an incomplete site, so it stops before writing a sheet: a sheet built
// from 429s once came out with 13 of its 466 rows.
const failures = [];
// The live CDN rate-limits a full run (429): retry those, waiting as long as it asks
// (Retry-After) or 2, 4, 8, ... seconds, before counting the request as failed.
async function get(url, opts) {
  for (let i = 0; ; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(url, opts);
    if ((res.status !== 429 && res.status < 500) || i >= 5) return res;
    const wait = Number(res.headers.get('retry-after')) || 2 ** (i + 1);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, wait * 1000); });
  }
}
const note = (res, url) => {
  if (!res.ok && res.status !== 404) failures.push(`${res.status} ${url}`);
  return res;
};

async function internalLinks(host, page) {
  const url = `${host}${page === '/' ? '/index' : page}.plain.html`;
  const res = note(await get(url), url);
  if (!res.ok) return [];
  const html = await res.text();
  return [...html.matchAll(/href="([^"]+)"/g)].map(([, href]) => {
    if (!href.startsWith('/') || href.startsWith('//')) return null;
    const p = normPath(new URL(href, LIVE).pathname);
    return /^\/(modals|fragments)\//.test(p) || /\{\{|%7B%7B/i.test(href) ? null : p;
  }).filter(Boolean);
}

// A list row's Source: the article's URL on the source, for a Link whose path had to be made
// a valid page path ("24,000" -> "24-000"). path -> URL
const LISTED = new Map();

async function sheetLinks(host, sheet) {
  const url = `${host}${sheet}?limit=5000`;
  const res = note(await get(url), url);
  if (!res.ok) return [];
  const { data = [] } = await res.json();
  return data.filter((row) => /^\/(?!\/)/.test(String(row.Link || ''))).map((row) => {
    const p = normPath(new URL(row.Link, LIVE).pathname);
    if (row.Source) LISTED.set(p, row.Source);
    return p;
  });
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
  const listed = LISTED.get(p);
  const src = await fetch(listed || `${origin}${encodeURI(srcPath)}`, { headers: UA }).catch(() => ({ status: 0 }));
  if (src.status !== 200) return { skip: `${p}: source returns ${src.status}; fix the link instead` };
  if (listed) return { Source: p, Destination: listed };
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
  const auth = token ? { Authorization: `Bearer ${token}` } : {};
  const body = new FormData();
  body.append('data', new Blob([fs.readFileSync(file)], { type: 'application/json' }), 'redirects.json');
  const put = await fetch(`https://admin.da.live/source/${ORG}/${SITE}/redirects.json`, { method: 'POST', body, headers: auth });
  const preview = await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main/redirects.json`, { method: 'POST', headers: auth });
  console.log(`Uploaded to DA (${put.status}), previewed (${preview.status}). Check ${PREVIEW}, then publish /redirects.json.`);
}

const token = readToken();
const auth = token ? { Authorization: `Bearer ${token}` } : {};
const index = await (await fetch(`${LIVE}/query-index.json?limit=5000`)).json();
const pages = [...new Set([...FRAGMENTS, ...index.data.map((r) => normPath(r.path))])];
const sources = [...pages.map((p) => [LIVE, p]), ...FRAGMENTS.map((p) => [PREVIEW, p])];
const linkLists = await pool(sources, 8, ([host, p]) => internalLinks(host, p));
const sheetSources = LISTS.flatMap((l) => [[LIVE, l], [PREVIEW, l]]);
const sheetLists = await pool(sheetSources, 4, ([host, l]) => sheetLinks(host, l));
const targets = [...new Set([...linkLists, ...sheetLists].flat())];
const statuses = await pool(targets, 10, async (p) => [p, (await get(`${LIVE}${encodeURI(p)}`, { method: 'HEAD', redirect: 'manual' })).status]);
statuses.filter(([, s]) => s === 429 || s >= 500).forEach(([p, s]) => failures.push(`${s} ${LIVE}${p}`));
const dead = statuses.filter(([, s]) => s === 404).map(([p]) => p);
const currentRes = note(await fetch(`${LIVE}/redirects.json?limit=5000`), `${LIVE}/redirects.json`);
if (!currentRes.ok) failures.push(`${currentRes.status} ${LIVE}/redirects.json (the current sheet)`);
if (failures.length) {
  console.error(`Stopped: ${failures.length} requests failed (e.g. ${failures.slice(0, 3).join('; ')}). No sheet written; run again later.`);
  process.exit(1);
}
const currentRows = (await currentRes.json()).data || [];
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
