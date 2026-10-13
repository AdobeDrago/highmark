/* eslint-env node */
/* eslint-disable no-console */
/**
 * Classify the surveyed pages (work/survey.json) into templates and checklist tiers, with the
 * mega menu (data/menu-tree.json). Writes data/classified.json, which build.mjs and
 * sidenav-extract.mjs read, and prints counts.
 *
 * Usage: node classify.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
/* eslint-disable import/extensions -- common.mjs is an ES module next to these scripts */
import { DATA, WORK, readJSON } from './common.mjs';
/* eslint-enable import/extensions */

const s = readJSON(path.join(WORK, 'survey.json'));
const tree = readJSON(path.join(DATA, 'menu-tree.json'));

const has = (p, c) => p.comps?.includes(c);
function template(p) {
  if (p.status !== 200) return 'gated';
  if (has(p, 'form-input')) return 'form';
  if (has(p, 'commhub-search-results')) return 'article-listing';
  if (/\/(thank-you|error)$/.test(p.path)) return 'confirmation';
  if (has(p, 'secondary-banner')) return 'landing';
  if (has(p, 'article-title')) return 'article';
  if (has(p, 'blog')) return 'document-list';
  if (p.path.includes('/highmark-provider-manual')) return 'manual';
  if (has(p, 'side-navigation') && has(p, 'text')) return 'content';
  if (has(p, 'title') && has(p, 'text')) return 'content';
  if (!p.comps.filter((x) => x !== 'container-fluid-fullwidth').length) return 'empty';
  return `other:${p.comps.join('+')}`;
}
// components that need something our block library doesn't do yet, per page
const NEEDS = {
  'data-table': 'table',
  'accordion-table': 'accordion',
  'regional-text': 'regional text',
  'right-rail': 'right rail',
  'side-navigation': 'side nav',
  featuredarticles: 'related articles',
};

// mega-menu paths (source paths), in menu order
const menu = [];
const menuLabel = {};
const addMenu = (item) => {
  const { href } = item;
  if (!href || href === '#' || /^https?:/.test(href) || href.startsWith('/content/')) return;
  const p = item.href.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  if (!menuLabel[p]) { menu.push(p); menuLabel[p] = item.text; }
};
tree.forEach((t) => {
  addMenu(t);
  t.cats.forEach((c) => {
    addMenu(c);
    c.items.forEach(addMenu);
  });
});

const live = new Set(s.live.map((p) => p.replace(/^\/providers/, '').replace(/\/$/, '') || '/'));
const redirected = new Set(s.redirects.map((p) => p.replace(/^\/providers/, '')));
const STAY = [/^\/(communications-hub\/)?join-our-mailing-list(\/|$)/, /^\/search-results$/, /^\/404$/];
const ARTICLE_LISTINGS = /^\/communications-hub\/(news-and-updates|provider-news|medical-policy-update|formulary-updates|news-archive)\//;

/** A page's checklist tier and status. */
function placement(p, t, linked) {
  if (live.has(p.path)) return { tier: 'done', status: 'Live' };
  if (t === 'gated' || t === 'confirmation' || STAY.some((re) => re.test(p.path))) return { tier: 'source', status: 'Stays on source' };
  if (menuLabel[p.path]) return { tier: 'P1', status: 'To do' };
  if (linked.length) return { tier: 'P2', status: 'To do' };
  if (ARTICLE_LISTINGS.test(p.path)) return { tier: 'P4', status: 'To do' };
  return { tier: 'P3', status: 'To do' };
}

const pages = s.pages.map((p) => {
  const t = template(p);
  const linked = (s.linkedFrom[p.path] || []).filter((d) => !/fragments\/nav$/.test(d));
  return {
    ...p,
    template: t,
    ...placement(p, t, linked),
    label: menuLabel[p.path] || p.title || p.path,
    redirect: redirected.has(p.path),
    linked,
    needs: [...new Set((p.comps || []).map((c) => NEEDS[c]).filter(Boolean))],
  };
});
fs.writeFileSync(path.join(DATA, 'classified.json'), JSON.stringify({ surveyed: s.surveyed, menu, pages }, null, 1));

const count = (key) => pages.reduce((a, p) => ({ ...a, [p[key]]: (a[p[key]] || 0) + 1 }), {});
console.log('tiers', count('tier'));
console.log('templates', count('template'));
console.log('menu paths', menu.length, '| menu paths not in sitemap:', menu.filter((m) => !pages.some((p) => p.path === m)));
console.log('other/empty', pages.filter((p) => /^other|empty/.test(p.template)).map((p) => `${p.path} ${p.template}`));
