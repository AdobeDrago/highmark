/* eslint-env node */
/* eslint-disable no-console */
/**
 * Builds press-releases-data.json, the sheet behind the press-release-list block on
 * /newsroom/press-releases. Two tabs (a DA multi-sheet):
 * `data`: one row per highmark.com press release, newest first.
 *   Date          yyyy-mm-dd (sorting and the Year filter)
 *   Display Date  as shown on highmark.com ("Friday, October 02, 2026")
 *   Title, URL    the release title and its page on highmark.com (releases aren't migrated)
 *   Summary       the teaser, as plain text
 *   Locations     comma-separated location groups ("Highmark Inc, Highmark BCBS"), the
 *                 Location filter's options
 * `locations`: the location groups in highmark.com's order (Location, ID = the source tag
 *   ID, which old highmark.com `?group=` links use).
 *
 * Source: the endpoints the highmark.com page itself calls. They don't allow our origin
 * (no CORS), hence this snapshot.
 *   /bin/highmark/cf/new/pressrelease/home.json?start=0&limit=N[&group=<tagId>]
 *   /bin/highmark/filter/tags.json?path=/content/cq:tags/highmark/press-release
 * A release's locations come from querying the list once per group.
 *
 * Usage: node tools/press-releases/build-press-releases-data.mjs [--upload]
 *   Writes press-releases-data.json (DA sheet format) to the current directory. --upload
 *   also uploads it to DA (/newsroom/press-releases-data.json) and previews it; check, then
 *   publish. Re-run when highmark.com adds releases.
 * Needs a DA token for --upload: ~/.aem/da-token.json (da-auth-helper) or .hlx/.da-token.json.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ORG = 'adobedrago';
const SITE = 'highmark';
const SOURCE = 'https://www.highmark.com';
const FILE = 'press-releases-data.json';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' };

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

async function releases(group) {
  const params = new URLSearchParams({ start: 0, limit: 1000 });
  if (group) params.set('group', group);
  const { totalCount, results } = await getJson(`${SOURCE}/bin/highmark/cf/new/pressrelease/home.json?${params}`);
  if (results.length !== totalCount) throw new Error(`${group || 'all'}: got ${results.length} of ${totalCount}`);
  return results;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "Friday, October 02, 2026" -> "2026-10-02"
function isoDate(display) {
  const [, month, day, year] = display.match(/,\s*(\w+)\s+(\d{1,2}),\s*(\d{4})/) || [];
  const m = MONTHS.indexOf(month) + 1;
  if (!m) throw new Error(`Unrecognised date: ${display}`);
  return `${year}-${String(m).padStart(2, '0')}-${day.padStart(2, '0')}`;
}

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–',
};
const plainText = (html) => (html || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(#x?[0-9a-f]+|\w+);/gi, (all, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITIES[e.toLowerCase()] ?? all;
  })
  .replace(/\s+/g, ' ')
  .trim();

function readToken() {
  const files = [path.join(os.homedir(), '.aem', 'da-token.json'), path.join('.hlx', '.da-token.json')];
  const file = files.find((f) => fs.existsSync(f));
  if (!file) throw new Error('No DA token found; run `npx github:adobe-rnd/da-auth-helper token` first.');
  const { access_token: token, expires_at: expires } = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (expires && expires < Date.now() + 60000) throw new Error(`DA token in ${file} has expired.`);
  return token;
}

async function upload(token) {
  const auth = { Authorization: `Bearer ${token}` };
  const body = new FormData();
  body.append('data', new Blob([fs.readFileSync(FILE)], { type: 'application/json' }), FILE);
  const put = await fetch(`https://admin.da.live/source/${ORG}/${SITE}/newsroom/${FILE}`, { method: 'POST', body, headers: auth });
  const preview = await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main/newsroom/${FILE}`, { method: 'POST', headers: auth });
  console.log(`/newsroom/${FILE}: uploaded (${put.status}), previewed (${preview.status})`);
}

const groups = await getJson(`${SOURCE}/bin/highmark/filter/tags.json?path=/content/cq:tags/highmark/press-release`);
const all = await releases();
const byGroup = await Promise.all(groups.map(({ tagId }) => releases(tagId)));
const locationsOf = {};
groups.forEach(({ title }, i) => byGroup[i].forEach(({ name }) => {
  (locationsOf[name] ||= []).push(title);
}));

const data = all
  .map((r) => ({
    Date: isoDate(r.date),
    'Display Date': r.date,
    Title: plainText(r.title),
    URL: `${SOURCE}${r.basePageUrl}`,
    Summary: plainText(r.summary),
    Locations: (locationsOf[r.name] || []).join(', '),
  }))
  .sort((a, b) => b.Date.localeCompare(a.Date)); // stable: same-day releases keep source order

const locations = groups.map(({ tagId, title }) => ({ Location: title, ID: tagId }));
const sheet = (rows) => ({
  total: rows.length, offset: 0, limit: rows.length, data: rows,
});
fs.writeFileSync(FILE, `${JSON.stringify({
  data: sheet(data), locations: sheet(locations), ':names': ['data', 'locations'], ':version': 3, ':type': 'multi-sheet',
}, null, 2)}\n`);

const untagged = data.filter((r) => !r.Locations).length;
console.log(`${FILE}: ${data.length} releases, ${groups.length} location groups, ${untagged} without a location.`);
console.log(`Newest ${data[0]?.Date}, oldest ${data.at(-1)?.Date}.`);
if (process.argv.includes('--upload')) await upload(readToken());
