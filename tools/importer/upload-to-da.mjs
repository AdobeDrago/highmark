/* eslint-disable */
/**
 * Uploads imported pages (content/<path>.plain.html) to Document Authoring and previews
 * them (admin.hlx.page preview, never publish).
 *
 * Images: DA keeps a page's media in a sibling folder `.<page name>/`.
 *   - src already on content.da.live: kept
 *   - /media-da/<dir>/<page>/<file>: the DA copy at /<dir>/.<page>/<file> when it exists
 *     (e.g. the shop header logos), otherwise the local file is uploaded there
 *   - any other URL (e.g. ShopX icons on shop.highmark.com): downloaded and uploaded to
 *     /<page dir>/.<page name>/<file>
 * <picture> wrappers are dropped (DA stores plain <img>).
 *
 * Usage: node tools/importer/upload-to-da.mjs [--no-preview] <path> [path ...]
 *   e.g. node tools/importer/upload-to-da.mjs shop/about-you/qualifying-life-events/landing
 * Credentials are injected by the environment (no Authorization header here).
 */
import fs from 'node:fs';
import path from 'node:path';

const ORG = 'adobedrago';
const REPO = 'highmark';
const DA_SOURCE = `https://admin.da.live/source/${ORG}/${REPO}`;
const DA_CONTENT = `https://content.da.live/${ORG}/${REPO}`;
const PREVIEW = `https://admin.hlx.page/preview/${ORG}/${REPO}/main`;

const args = process.argv.slice(2);
const preview = !args.includes('--no-preview');
const pages = args.filter((a) => !a.startsWith('--')).map((p) => p.replace(/^\/|\.plain\.html$/g, ''));

async function exists(daPath) {
  const resp = await fetch(`${DA_SOURCE}${daPath}`, { method: 'HEAD' });
  return resp.ok;
}

async function upload(daPath, blob, filename) {
  const form = new FormData();
  form.append('data', blob, filename);
  const resp = await fetch(`${DA_SOURCE}${daPath}`, { method: 'POST', body: form });
  if (!resp.ok) throw new Error(`DA upload ${daPath}: ${resp.status} ${await resp.text()}`);
}

const TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', gif: 'image/gif', webp: 'image/webp' };

async function localizeImage(src, pageDir, pageName) {
  if (src.startsWith(DA_CONTENT)) return src;
  const local = src.match(/^\/media-da\/(.+)\/([^/]+)\/([^/]+)$/);
  if (local) {
    const [, dir, doc, file] = local;
    const daPath = `/${dir}/.${doc}/${file}`;
    if (!(await exists(daPath))) {
      const ext = file.split('.').pop().toLowerCase();
      const data = fs.readFileSync(path.join('content', src));
      await upload(daPath, new Blob([data], { type: TYPES[ext] || 'application/octet-stream' }), file);
    }
    return `${DA_CONTENT}${daPath}`;
  }
  const url = new URL(src);
  const file = decodeURIComponent(url.pathname.split('/').pop()).replace(/[^\w.-]+/g, '-').toLowerCase();
  const daPath = `/${pageDir ? `${pageDir}/` : ''}.${pageName}/${file}`;
  if (!(await exists(daPath))) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`download ${src}: ${resp.status}`);
    const ext = file.split('.').pop().toLowerCase();
    await upload(daPath, new Blob([await resp.arrayBuffer()], { type: TYPES[ext] || resp.headers.get('content-type') }), file);
  }
  return `${DA_CONTENT}${daPath}`;
}

for (const page of pages) {
  const file = path.join('content', `${page}.plain.html`);
  let html = fs.readFileSync(file, 'utf-8');
  const pageDir = path.posix.dirname(page) === '.' ? '' : path.posix.dirname(page);
  const pageName = path.posix.basename(page);

  html = html.replace(/<picture>\s*(<img[^>]*>)\s*<\/picture>/g, '$1');
  const srcs = [...new Set([...html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]))];
  for (const src of srcs) {
    const daSrc = await localizeImage(src.replace(/&amp;/g, '&'), pageDir, pageName);
    html = html.split(`src="${src}"`).join(`src="${daSrc}"`);
  }

  const doc = `<body><header></header><main>${html}</main><footer></footer></body>`;
  await upload(`/${page}.html`, new Blob([doc], { type: 'text/html' }), `${pageName}.html`);
  let status = 'uploaded';
  if (preview) {
    const resp = await fetch(`${PREVIEW}/${page}`, { method: 'POST' });
    status += resp.ok ? ', previewed' : `, preview failed (${resp.status})`;
  }
  console.log(`${page}: ${status} (${srcs.length} image${srcs.length === 1 ? '' : 's'})`);
}
