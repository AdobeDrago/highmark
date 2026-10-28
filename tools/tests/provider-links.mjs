/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- steps run one after another */

const L = process.env.HOST || 'https://main--highmark--adobedrago.aem.live';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' };
const docs = [...(await (await fetch(`${L}/query-index.json?limit=5000`)).json()).data.map((r) => r.path).filter((p) => p.startsWith('/providers')).map((p) => (p.endsWith('/') ? `${p}index` : p)), '/providers/fragments/nav', '/providers/fragments/footer', '/providers/fragments/service-centers', ...['authorization', 'claims', 'policies-and-programs', 'provider-network', 'resources-and-education', 'communications-hub'].map((s) => `/providers/fragments/sidenav/${s}`)];
const links = new Map();
for (const d of docs) {
  const h = await (await fetch(`${L}${d}.plain.html`)).text();
  for (const [, href] of h.matchAll(/href="([^"#][^"]*)"/g)) {
    const u = new URL(href.replace(/&amp;/g, '&'), L);
    if (u.origin === L || u.host === 'providers.highmark.com') { if (!links.has(u.href)) links.set(u.href, d); }
  }
}
const bad = [];
let i = 0;
const list = [...links.keys()];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (i < list.length) {
    const u = list[i];
    i += 1;
    const r = await fetch(u, { headers: UA, redirect: 'follow' }).catch((e) => ({ status: `ERR ${e.message}` }));
    if (r.status !== 200) bad.push(`${r.status} ${u} (from ${links.get(u)})`);
  }
}));
console.log(`${list.length} links checked (${list.filter((u) => u.startsWith(L)).length} internal), ${bad.length} not OK`);
bad.forEach((b) => console.log('  ', b));
