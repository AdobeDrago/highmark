/* eslint-env node */
/* eslint-disable no-console */
// Every Link in the live list sheets: relative links through our site (redirects followed),
// PDFs on the source; each must end in a 200 (a page, a PDF, or the Availity login if Gated).

const L = process.env.HOST || 'https://main--highmark--adobedrago.aem.live';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' };
const LISTS = ['reimbursement-policies', 'news-and-updates', 'provider-news', 'medical-policy-update', 'formulary-updates'];
const rows = (await Promise.all(LISTS.map(async (l) => (await (await fetch(`${L}/providers/lists/${l}.json?limit=5000`)).json()).data.map((r) => ({ ...r, list: l }))))).flat();
const bad = [];
const kinds = {};
let next = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < rows.length) {
    const r = rows[next]; next += 1;
    const url = new URL(r.Link, L).href;
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(url, { headers: UA }).catch((e) => ({
      status: 0, url, headers: new Map(), e,
    }));
    res.body?.cancel?.();
    const host = new URL(res.url).hostname;
    const type = res.headers.get?.('content-type') || '';
    let kind = host;
    if (/availity/.test(host)) kind = 'availity';
    else if (/pdf/.test(type)) kind = 'pdf';
    else if (host === new URL(L).hostname) kind = 'ours';
    kinds[kind] = (kinds[kind] || 0) + 1;
    const ok = res.status === 200 && (kind !== 'availity' || r.Gated === 'yes') && (r.Type !== 'PDF' || kind === 'pdf' || kind === 'availity');
    if (!ok) bad.push(`${res.status} ${kind} ${r.list}: ${r.Title} -> ${r.Link}`);
  }
}));
console.log(`${rows.length} links: ${JSON.stringify(kinds)}; not OK: ${bad.length}`);
bad.forEach((b) => console.log(`  ${b}`));
