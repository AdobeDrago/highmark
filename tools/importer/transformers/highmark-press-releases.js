/**
 * Transformer: newsroom press-releases listing (template "press-releases" only).
 *
 * The source page (https://www.highmark.com/newsroom/press-releases) is a client-side
 * search: a keyword box, Location/Type and Date filters, a "Showing 1 - 10 of N results"
 * counter, 10 results and a "LOAD MORE STORIES" pager. None of that works on EDS, so
 * (user decision) the whole listing component is replaced with a static list:
 *
 *   <h1>Press Releases</h1>
 *   per release, newest first: <p>date</p> <h2><a href="https://www.highmark.com/...">title</a></h2> <p>teaser</p>
 *   <p><a href="https://www.highmark.com/newsroom/press-releases">See all press releases on highmark.com</a></p>
 *
 * Release links stay absolute (www.highmark.com) because the release pages aren't migrated.
 *
 * Data: the rendered page only holds the newest 10 results, so the list is the union of
 *  - the results in the rendered DOM (#release-results .release-item), and
 *  - tools/importer/data/press-releases.json, a snapshot of the endpoint the page itself
 *    calls on load / "LOAD MORE STORIES":
 *      GET https://www.highmark.com/bin/highmark/cf/new/pressrelease/home.json?start=0&limit=25
 *      -> { totalCount, results: [{ title, date, summary (HTML), basePageUrl, ... }] }
 *    import-press-releases.js imports the JSON (esbuild inlines it into the bundle, so the
 *    import needs no network access) and passes it in as payload.pressReleases.
 * merged by URL, sorted by date (newest first) and cut to MAX_ITEMS.
 *
 * Refresh the snapshot, then re-bundle and re-import:
 *   curl -s "https://www.highmark.com/bin/highmark/cf/new/pressrelease/home.json?start=0&limit=25" \
 *     | jq '{source: "https://www.highmark.com/bin/highmark/cf/new/pressrelease/home.json?start=0&limit=25",
 *            fetched: (now | strftime("%Y-%m-%d")), totalCount: .totalCount,
 *            releases: [.results[] | {date, title, url: ("https://www.highmark.com" + .basePageUrl), summary}]}' \
 *     > tools/importer/data/press-releases.json
 *   npx @adobe/aem-import-helper bundle --importjs tools/importer/import-press-releases.js
 */

const MAX_ITEMS = 25;
const SOURCE_ORIGIN = 'https://www.highmark.com';
const SEE_ALL_URL = 'https://www.highmark.com/newsroom/press-releases';
const SEE_ALL_LABEL = 'See all press releases on highmark.com';

// \s also matches &nbsp; (U+00A0)
const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

function absolute(href) {
  try {
    const u = new URL(href, SOURCE_ORIGIN);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return `${SOURCE_ORIGIN}${u.pathname}${u.search}${u.hash}`;
    }
    return u.href;
  } catch (e) {
    return href;
  }
}

// key used to merge DOM results with snapshot rows (case/trailing-slash insensitive)
const urlKey = (href) => absolute(href).replace(/\/$/, '').toLowerCase();

function domReleases(listing) {
  return [...listing.querySelectorAll('.release-item')].map((item) => {
    const link = item.querySelector('a.release-title');
    const summary = item.querySelector('.release-summary');
    return {
      date: clean(item.querySelector('.release-date')?.textContent),
      title: clean(link?.textContent),
      url: link ? absolute(link.getAttribute('href')) : '',
      summary: summary ? summary.innerHTML : '',
    };
  }).filter((r) => r.title && r.url);
}

function mergeReleases(fromDom, fromSnapshot) {
  const seen = new Set();
  const merged = [];
  [...fromDom, ...fromSnapshot].forEach((r) => {
    if (!r || !r.title || !r.url) return;
    const key = urlKey(r.url);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({ ...r, url: absolute(r.url), time: Date.parse(clean(r.date)) || 0 });
  });
  // stable sort: same-day releases keep source order
  return merged.sort((a, b) => b.time - a.time).slice(0, MAX_ITEMS);
}

// teaser HTML (one or more <p>) -> a single paragraph keeping inline markup (<i>, <b>, links)
function teaserParagraph(document, html) {
  const holder = document.createElement('div');
  holder.innerHTML = html || '';
  const p = document.createElement('p');
  const paras = holder.querySelectorAll('p');
  (paras.length ? [...paras] : [holder]).forEach((src, i) => {
    if (i) p.append(' ');
    p.append(...src.childNodes);
  });
  p.querySelectorAll('b, strong, i, em').forEach((el) => {
    if (!el.textContent.trim()) el.replaceWith(' ');
  });
  p.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', absolute(a.getAttribute('href'))));
  // trim and collapse whitespace (incl. &nbsp;) in the text nodes
  const walker = document.createTreeWalker(p, 4 /* NodeFilter.SHOW_TEXT */);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach((t) => { t.textContent = t.textContent.replace(/\s+/g, ' '); });
  if (texts.length) {
    texts[0].textContent = texts[0].textContent.replace(/^ /, '');
    const last = texts[texts.length - 1];
    last.textContent = last.textContent.replace(/ $/, '');
  }
  return clean(p.textContent) ? p : null;
}

function buildList(document, heading, releases) {
  const frag = document.createDocumentFragment();
  const h1 = document.createElement('h1');
  h1.textContent = heading;
  frag.append(h1);

  releases.forEach((r) => {
    if (r.date) {
      const date = document.createElement('p');
      date.textContent = clean(r.date);
      frag.append(date);
    }
    const h2 = document.createElement('h2');
    const a = document.createElement('a');
    a.href = r.url;
    a.textContent = clean(r.title);
    h2.append(a);
    frag.append(h2);
    const teaser = teaserParagraph(document, r.summary);
    if (teaser) frag.append(teaser);
  });

  const more = document.createElement('p');
  const moreLink = document.createElement('a');
  moreLink.href = SEE_ALL_URL;
  moreLink.textContent = SEE_ALL_LABEL;
  more.append(moreLink);
  frag.append(more);
  return frag;
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  if (payload?.template?.name && payload.template.name !== 'press-releases') return;

  const results = element.querySelector('#release-results');
  if (!results) return;
  // the whole listing component: filter rail + results column
  const listing = results.closest('.pressrelease-new, .press-release') || results;
  const { document } = payload;

  const heading = clean(results.querySelector(':scope > h2, :scope > h1')?.textContent) || 'Press Releases';
  const snapshot = payload.pressReleases || {};
  const releases = mergeReleases(domReleases(results), snapshot.releases || []);

  listing.replaceWith(buildList(document || element.ownerDocument, heading, releases));
  // eslint-disable-next-line no-console
  console.log(`press-releases: ${releases.length} releases (snapshot fetched ${snapshot.fetched || 'n/a'})`);
}
