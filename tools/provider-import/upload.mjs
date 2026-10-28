/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- uploads run one after another */
/**
 * Upload what build.mjs wrote to DA, and preview the documents (it never publishes).
 *
 * Usage:
 *   node upload.mjs fetch             download every image in work/out/images.json to work/img
 *                                     and check sizes (SVG <= 40 KB, others <= 20 MB)
 *   node upload.mjs images            upload those images to DA
 *   node upload.mjs docs [path...]    upload documents (default: all of work/out/providers),
 *                                     e.g. /providers/claims, and preview them
 * Needs a DA token (see common.mjs); it is never printed.
 */
import fs from 'node:fs';
import path from 'node:path';
/* eslint-disable import/extensions -- common.mjs is an ES module next to these scripts */
import {
  HERE, ORG, SITE, UA, WORK, readJSON, readToken,
} from './common.mjs';
/* eslint-enable import/extensions */

const OUT = path.join(WORK, 'out');
const IMG = path.join(WORK, 'img');
const TYPES = {
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
};
const local = (da) => path.join(IMG, da);
const [cmd, ...args] = process.argv.slice(2);
const auth = () => ({ Authorization: `Bearer ${readToken()}` });
const images = () => Object.values(readJSON(path.join(OUT, 'images.json')));

async function put(daPath, file, type) {
  const body = new FormData();
  body.append('data', new Blob([fs.readFileSync(file)], { type }), path.basename(daPath));
  const r = await fetch(`https://admin.da.live/source/${ORG}/${SITE}${daPath}`, { method: 'POST', body, headers: auth() });
  return r.status;
}

/** One image into work/img: a Material icon (white, for the navy quick-links band), a local
 *  file, or the source's image. */
async function fetchImage({
  da, src, icon, local: from,
}) {
  const file = local(da);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (icon) {
    const svg = fs.readFileSync(path.join(HERE, 'assets', 'icons', `${icon}.svg`), 'utf8').replace('<path ', '<path fill="#fff" ');
    fs.writeFileSync(file, svg);
  } else if (from) {
    // a file kept with these tools (assets/...)
    fs.copyFileSync(path.join(HERE, from), file);
  } else {
    const r = await fetch(src, { headers: UA });
    if (!r.ok) {
      console.log(`FAIL ${r.status} ${src}`);
      return;
    }
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  }
  const { size } = fs.statSync(file);
  const ext = da.split('.').pop().toLowerCase();
  const over = (ext === 'svg' && size > 40 * 1024) || size > 20 * 1024 * 1024;
  console.log(`${over ? 'OVER ' : ''}${String(size).padStart(8)} ${da}`);
}

/** Every document under work/out/providers, as DA paths. */
function allDocs() {
  const found = [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (f.endsWith('.html')) found.push(`/${path.relative(OUT, f).split(path.sep).join('/')}`);
  });
  walk(path.join(OUT, 'providers'));
  return found;
}

if (cmd === 'fetch') {
  for (const image of images()) await fetchImage(image);
} else if (cmd === 'images') {
  for (const { da } of images()) {
    const ext = da.split('.').pop().toLowerCase();
    console.log(await put(da, local(da), TYPES[ext]), da);
  }
} else if (cmd === 'docs') {
  const docs = args.length ? args.map((a) => `${a.replace(/\.html$/, '')}.html`) : allDocs();
  for (const doc of docs) {
    const status = await put(doc, path.join(OUT, doc), 'text/html');
    const web = doc.replace(/\.html$/, '').replace(/\/index$/, '/');
    const pv = await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/main${web}`, { method: 'POST', headers: auth() });
    const err = pv.ok ? '' : ` ${pv.headers.get('x-error') || ''}`;
    console.log(`DA ${status}  preview ${pv.status}${err}  ${web}`);
  }
} else {
  console.log('usage: node upload.mjs fetch | images | docs [path...]');
}
