/* eslint-env node */
/* eslint-disable no-console */
/**
 * Turns the breadcrumb trail on for pages that were imported without it: sets
 * `Breadcrumbs: true` and the source's crumb label (`Breadcrumb Title`, the active
 * item of highmark.com's ol.breadcrumb-list) in each page's metadata block in DA,
 * then previews the page (never publishes). Nothing else in the documents changes.
 * Pages whose source has no breadcrumbs are skipped.
 *
 * The trail's other crumbs come from the published ancestors (blocks/breadcrumbs),
 * so check that they match the source's before publishing.
 *
 * Usage: node tools/breadcrumbs/add-breadcrumbs.mjs [--apply] path ...
 *   Without --apply, lists what would change. Needs linkedom (npm i --no-save linkedom)
 *   and a DA token as for tools/redirects/build-redirects.mjs.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
// optional dependency (see tools/provider-import/README.md): npm i --no-save linkedom
// eslint-disable-next-line import/no-extraneous-dependencies
import { parseHTML } from 'linkedom';

const ORG = 'adobedrago';
const SITE = 'highmark';
const SOURCE = 'https://www.highmark.com';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const pages = args.filter((a) => !a.startsWith('--')).map((p) => `/${p.replace(/^\/|\.html$/g, '')}`);

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

/** Sets a row of the metadata block, adding it when missing. */
function setRow(document, block, key, value) {
  const row = [...block.children].find((r) => clean(r.children[0]?.textContent).toLowerCase() === key.toLowerCase());
  const cell = (text) => {
    const div = document.createElement('div');
    const p = document.createElement('p');
    p.textContent = text;
    div.append(p);
    return div;
  };
  if (row) {
    const before = clean(row.children[1]?.textContent);
    row.children[1].replaceWith(cell(value));
    return before === value ? null : `${key}: ${before} -> ${value}`;
  }
  const div = document.createElement('div');
  div.append(cell(key), cell(value));
  block.append(div);
  return `${key}: + ${value}`;
}

for (const page of pages) {
  // eslint-disable-next-line no-await-in-loop
  const [src, da] = await Promise.all([
    fetch(`${SOURCE}${page}`, { headers: { 'user-agent': 'Mozilla/5.0' } }).then((r) => (r.ok ? r.text() : '')),
    fetch(`https://admin.da.live/source/${ORG}/${SITE}${page}.html`, { headers: auth }).then((r) => (r.ok ? r.text() : '')),
  ]);
  const label = clean(parseHTML(src).document.querySelector('ol.breadcrumb-list li.active')?.textContent);
  const { document } = parseHTML(da);
  const block = document.querySelector('.metadata');
  if (!label || !block) {
    console.log(`skip ${page}: ${!label ? 'no breadcrumbs on the source' : 'no metadata block in DA'}`);
    // eslint-disable-next-line no-continue
    continue;
  }
  const changes = [setRow(document, block, 'Breadcrumbs', 'true'), setRow(document, block, 'Breadcrumb Title', label)].filter(Boolean);
  console.log(`${page}: ${changes.length ? changes.join('; ') : 'unchanged'}`);
  if (apply && changes.length) {
    const form = new FormData();
    form.append('data', new Blob([document.toString()], { type: 'text/html' }), `${page.split('/').pop()}.html`);
    // eslint-disable-next-line no-await-in-loop
    const up = await fetch(`https://admin.da.live/source/${ORG}/${SITE}${page}.html`, { method: 'POST', body: form, headers: auth });
    // eslint-disable-next-line no-await-in-loop
    const pv = up.ok ? await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main${page}`, { method: 'POST', headers: auth }) : null;
    console.log(`    upload ${up.status}, preview ${pv ? pv.status : '-'}`);
  }
}
