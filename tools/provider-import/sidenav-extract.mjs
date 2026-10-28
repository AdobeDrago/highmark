/* eslint-env node */
/* eslint-disable no-console */
/**
 * Side-navigation trees of the provider content and manual pages (server-rendered on the
 * source), merged into one tree per section. Writes data/sidenav.json, which build.mjs reads
 * for the side-nav fragments (SIDENAV=1): { childrenOf, label, lock, pageRoot }.
 *
 * Usage: node sidenav-extract.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
// optional dependency (see README): npm i --no-save linkedom
// eslint-disable-next-line import/no-extraneous-dependencies
import { parseHTML } from 'linkedom';
/* eslint-disable import/extensions -- common.mjs is an ES module next to these scripts */
import {
  DATA, SRC, UA, pool, readJSON,
} from './common.mjs';
/* eslint-enable import/extensions */

const { pages } = readJSON(path.join(DATA, 'classified.json'));
const targets = pages.filter((p) => ['content', 'manual'].includes(p.template)).map((p) => p.path);

const norm = (t) => t.replace(/\s+/g, ' ').trim();
const clean = (a) => {
  const c = a.cloneNode(true);
  c.querySelectorAll('.material-icons, .material-icons-outlined, i, [class*="tooltip"], [class*="Tooltip"]').forEach((x) => x.remove());
  return norm(c.textContent);
};
const pathOf = (href) => {
  try {
    const u = new URL(href, `${SRC}/`);
    if (u.origin !== SRC) return null;
    return decodeURI(u.pathname)
      .replace(/^\/content\/highmark\/en\/providerresourcecenter\/home/, '')
      .replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  } catch { return null; }
};

function tree(ul) {
  return [...ul.children].filter((li) => li.tagName === 'LI').map((li) => {
    const a = li.querySelector(':scope > a, :scope > div > a, :scope > span > a, :scope > p > a');
    const sub = li.querySelector(':scope > ul, :scope > div > ul');
    const lock = !!li.querySelector(':scope > a [class*="lock"], :scope > div > a [class*="lock"]')
      || /\block\b/.test(a?.textContent || '');
    return {
      text: a ? clean(a) : norm(li.textContent),
      path: a ? pathOf(a.getAttribute('href')) : null,
      href: a?.getAttribute('href') || null,
      lock,
      children: sub ? tree(sub) : [],
    };
  }).filter((n) => n.text || n.children.length);
}

const perPage = {};
await pool(targets, 6, async (p) => {
  const r = await fetch(`${SRC}${p}`, { headers: UA });
  const { document } = parseHTML(await r.text());
  const ul = document.querySelector('.side-navigation ul');
  if (!ul) return;
  // the first item is the section root; the next list holds its tree (the source nests it
  // in an unlabelled item)
  const [root, ...others] = tree(ul);
  const rest = root.children.length
    ? root.children
    : others.flatMap((n) => (n.path ? [n] : n.children));
  perPage[p] = { root: { text: root.text, path: root.path }, children: rest };
});

// one parent -> children map across all pages (each page shows its parent, the parent's
// children and its own children), keeping the first-seen order; labels by path
const childrenOf = {};
const label = {};
const lock = {};
const add = (parent, list) => {
  childrenOf[parent] = childrenOf[parent] || [];
  list.forEach((n) => {
    const key = n.path || `text:${n.text}`;
    if (!label[key]) label[key] = n.text;
    if (n.lock) lock[key] = true;
    if (!childrenOf[parent].includes(key)) childrenOf[parent].push(key);
    if (n.path && n.children.length) add(n.path, n.children);
  });
};
Object.values(perPage).forEach(({ root, children }) => {
  if (root.path && !label[root.path]) label[root.path] = root.text;
  add(root.path, children);
});
const pageRoot = Object.fromEntries(Object.entries(perPage).map(([p, v]) => [p, v.root.path]));
fs.writeFileSync(path.join(DATA, 'sidenav.json'), JSON.stringify({
  childrenOf, label, lock, pageRoot,
}, null, 1));
console.log(`${Object.keys(perPage).length}/${targets.length} pages with a side nav; ${Object.keys(childrenOf).length} parents, ${Object.keys(label).length} labelled paths`);
