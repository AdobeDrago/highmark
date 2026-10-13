/* eslint-env node */
/* eslint-disable no-console */
/**
 * Builds the DA sheets behind the provider-list block: a snapshot of each list on
 * providers.highmark.com, read from the feeds its list pages load in the browser.
 *   reimbursement-policies  /bin/prc/blog (a document list: one PDF per policy)
 *   news-and-updates, provider-news, medical-policy-update, formulary-updates
 *                           /bin/prc/topics (article listings)
 *
 * Columns: Title, Link, Type (Web Page | PDF), Topic, For, Published, Updated, Regions,
 * Description, Gated.
 * - Articles link to our /providers path (/providers/x is providers.highmark.com/x), so
 *   /redirects sends them to the source until they are migrated; PDFs link to the source's
 *   file. Published and Updated are ISO dates for articles, the source's M/YYYY for policies.
 * - Regions holds the badge labels of a region-only item (WPA/NEPA, CPA/SEPA, DE, WV, WNY,
 *   NENY); it is empty for an item every region gets.
 * - Gated is "yes" when the link leads to the Availity login.
 *
 * The lists change weekly on the source; re-run this, then publish the sheets and rebuild
 * /redirects (tools/redirects/build-redirects.mjs reads the sheets' links).
 *
 * Usage: node tools/provider-lists/build-provider-lists.mjs [--upload]
 *   Writes <list>.json (DA sheet format) to the current directory. --upload also uploads each
 *   to DA (/providers/lists/<list>.json) and previews it; check, then publish.
 * Needs a DA token for --upload: ~/.aem/da-token.json (da-auth-helper) or .hlx/.da-token.json.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ORG = 'adobedrago';
const SITE = 'highmark';
const SOURCE = 'https://providers.highmark.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const DOCUMENT_LISTS = {
  'reimbursement-policies': '/claims/reimbursement-resources/reimbursement-policies',
};
const ARTICLE_LISTS = {
  'news-and-updates': '/communications-hub/news-and-updates',
  'provider-news': '/communications-hub/provider-news',
  'medical-policy-update': '/communications-hub/medical-policy-update',
  'formulary-updates': '/communications-hub/formulary-updates',
};
// the source tags items with brand codes or region labels; every region (or "all" alone)
// means no badge
const REGIONS = {
  hbcbs: 'WPA/NEPA',
  hbs: 'CPA/SEPA',
  hbcbsde: 'DE',
  hbcbswv: 'WV',
  hbcbswny: 'WNY',
  hbsneny: 'NENY',
};
const ALL_REGIONS = Object.values(REGIONS);

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

const sheet = (data) => ({
  total: data.length, offset: 0, limit: data.length, data, ':type': 'sheet',
});

/** The feeds pick the list by the Referer, and answer only XHR-style requests. */
async function feed(url, listPath) {
  const res = await fetch(`${SOURCE}${url}`, {
    headers: { 'User-Agent': UA, 'X-Requested-With': 'XMLHttpRequest', Referer: `${SOURCE}${listPath}` },
  });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

const text = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|\s+/g, ' ').trim();

function regions(tags) {
  const labels = [...new Set(String(tags || '').split(',').map((tag) => {
    const t = tag.trim().toLowerCase();
    return REGIONS[t] || (t === 'all' ? '' : t.replace(/\s+/g, '').toUpperCase());
  }).filter(Boolean))];
  return ALL_REGIONS.every((r) => labels.includes(r)) ? '' : labels.join(', ');
}

/** Where a source link really leads: a stub page redirects to its PDF, a gated PDF to Availity. */
async function resolve(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
  if (!res) return { url, gated: false };
  await res.body?.cancel();
  return { url: res.url, gated: /availity\.com/.test(new URL(res.url).hostname) };
}

async function documentList(listPath) {
  const { results } = await feed('/bin/prc/blog?start=0&limit=1000&location=alllocations&year=allyears&orderBy=@blogTitle&orderType=asc', listPath);
  const rows = await pool(results, 6, async (item) => ({
    Title: text(item.blogTitle),
    Link: item.redirectTarget,
    Type: 'PDF',
    Topic: '',
    For: '',
    Published: item.pubDate || '',
    Updated: item.revDate || '',
    Regions: '',
    Description: text(item.blogSummary),
    Gated: (await resolve(item.redirectTarget)).gated ? 'yes' : '',
  }));
  return rows.sort((a, b) => a.Title.localeCompare(b.Title, 'en', { numeric: true }));
}

/** Every doc of a topics list, a page of results at a time. */
async function topics(listPath, start = 0) {
  const sort = encodeURIComponent('articlePublishDate_dt desc');
  const { response } = await feed(`/bin/prc/topics?start=${start}&qp=${encodeURIComponent(listPath)}&sort=${sort}`, listPath);
  const end = start + response.docs.length;
  if (!response.docs.length || end >= response.numFound) return response.docs;
  return [...response.docs, ...await topics(listPath, end)];
}

async function articleList(listPath) {
  const docs = await topics(listPath);
  return pool(docs, 6, async (doc) => {
    const pdf = doc.Content_Type_s === 'application/pdf';
    // a PDF item is a stub page on the source: link the file it redirects to
    const target = pdf ? await resolve(`${SOURCE}${doc.shortId_s}`) : null;
    return {
      Title: text(doc.title),
      Link: pdf ? target.url : `/providers${doc.shortId_s}`,
      Type: pdf ? 'PDF' : 'Web Page',
      Topic: doc.topic_s || '',
      For: doc.addressingFor_s || '',
      Published: (doc.articlePublishDate_dt || '').slice(0, 10),
      Updated: (doc.Last_Modified_dt || '').slice(0, 10),
      Regions: regions(doc.region_ss),
      Description: text(doc.description),
      Gated: target?.gated || doc.ssoToken_s === 'true' ? 'yes' : '',
    };
  });
}

async function upload(name, token) {
  const auth = { Authorization: `Bearer ${token}` };
  const body = new FormData();
  body.append('data', new Blob([fs.readFileSync(name)], { type: 'application/json' }), name);
  const put = await fetch(`https://admin.da.live/source/${ORG}/${SITE}/providers/lists/${name}`, { method: 'POST', body, headers: auth });
  const preview = await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main/providers/lists/${name}`, { method: 'POST', headers: auth });
  console.log(`/providers/lists/${name}: uploaded (${put.status}), previewed (${preview.status})`);
}

const token = process.argv.includes('--upload') ? readToken() : null;
const lists = [
  ...Object.entries(DOCUMENT_LISTS).map(([name, listPath]) => [name, () => documentList(listPath)]),
  ...Object.entries(ARTICLE_LISTS).map(([name, listPath]) => [name, () => articleList(listPath)]),
];
await pool(lists, 1, async ([name, build]) => {
  const rows = await build();
  fs.writeFileSync(`${name}.json`, `${JSON.stringify(sheet(rows), null, 1)}
`);
  const gated = rows.filter((r) => r.Gated).length;
  const regional = rows.filter((r) => r.Regions).length;
  console.log(`${name}.json: ${rows.length} rows (${regional} region-only, ${gated} gated)`);
  if (token) await upload(`${name}.json`, token);
});
