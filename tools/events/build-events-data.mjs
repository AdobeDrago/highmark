/* eslint-env node */
/* eslint-disable no-console */
/**
 * Builds events-data.json, the sheet behind the press-release-list (events) block on
 * /about/events. Two tabs (a DA multi-sheet):
 * `data`: one row per highmark.com event, in the source's order (upcoming first).
 *   Date          yyyy-mm-dd when the event's date can be read (the Date filter), else empty
 *   Display Date  as shown on highmark.com: the date, or the recurrence ("Every Tuesday ...")
 *   Title, URL    the event title and its page on highmark.com (events aren't migrated)
 *   Summary       the description, as plain text
 *   Locations     the event's region ("Western PA"), the Region filter's options
 *   Image, Image Alt  the event image on highmark.com
 * `locations`: the event regions in highmark.com's order (Location, ID = the source tag ID,
 *   which old highmark.com `?group=` links use).
 *
 * Source: the endpoints the highmark.com page itself calls. They don't allow our origin
 * (no CORS), hence this snapshot.
 *   /bin/highmark/cf/events/home.json?start=0&limit=N
 *   /bin/highmark/filter/tags.json?path=/content/cq:tags/highmark/event-locations
 * Field names follow the page's events-item-template. On 2026-10-06 the source had no
 * events, so the data tab was empty.
 *
 * Usage: node tools/events/build-events-data.mjs [--upload]
 *   Writes events-data.json (DA sheet format) to the current directory. --upload also
 *   uploads it to DA (/about/events-data.json) and previews it; check, then publish.
 *   Re-run when highmark.com adds events.
 * Needs a DA token for --upload: ~/.aem/da-token.json (da-auth-helper) or .hlx/.da-token.json.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ORG = 'adobedrago';
const SITE = 'highmark';
const SOURCE = 'https://www.highmark.com';
const FILE = 'events-data.json';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' };

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "Friday, October 02, 2026" / "October 2, 2026" -> "2026-10-02"; anything else -> ""
function isoDate(display) {
  const [, month, day, year] = (display || '').match(/([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/) || [];
  const m = MONTHS.indexOf(month) + 1;
  return m ? `${year}-${String(m).padStart(2, '0')}-${day.padStart(2, '0')}` : '';
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

const absolute = (url) => (url && url.startsWith('/') ? `${SOURCE}${url}` : url || '');

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
  const put = await fetch(`https://admin.da.live/source/${ORG}/${SITE}/about/${FILE}`, { method: 'POST', body, headers: auth });
  const preview = await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main/about/${FILE}`, { method: 'POST', headers: auth });
  console.log(`/about/${FILE}: uploaded (${put.status}), previewed (${preview.status})`);
}

const groups = await getJson(`${SOURCE}/bin/highmark/filter/tags.json?path=/content/cq:tags/highmark/event-locations`);
const { totalCount, results = [] } = await getJson(`${SOURCE}/bin/highmark/cf/events/home.json?start=0&limit=1000`);
if (results.length !== Number(totalCount)) throw new Error(`got ${results.length} of ${totalCount} events`);

// tagName is the region's title (the page matches it against the tag list the same way)
const regionOf = (tagName) => {
  const title = typeof tagName === 'object' ? tagName?.title : tagName;
  return groups.find((g) => g.title === title)?.title || title || '';
};

const data = results.map((r) => {
  const display = r.recurringEvent ? r.recurringEventdetail : r.date;
  return {
    Date: r.recurringEvent ? '' : isoDate(r.date),
    'Display Date': plainText(display),
    Title: plainText(r.title),
    URL: absolute(r.basePageUrl),
    Summary: plainText(r.summary),
    Locations: regionOf(r.tagName),
    Image: absolute(r.image),
    'Image Alt': plainText(r.imageAltText),
  };
});

const locations = groups.map(({ tagId, title }) => ({ Location: title, ID: tagId }));
const sheet = (rows) => ({
  total: rows.length, offset: 0, limit: rows.length, data: rows,
});
fs.writeFileSync(FILE, `${JSON.stringify({
  data: sheet(data), locations: sheet(locations), ':names': ['data', 'locations'], ':version': 3, ':type': 'multi-sheet',
}, null, 2)}\n`);

console.log(`${FILE}: ${data.length} events, ${groups.length} regions (${groups.map((g) => g.title).join(', ')}).`);
if (process.argv.includes('--upload')) await upload(readToken());
