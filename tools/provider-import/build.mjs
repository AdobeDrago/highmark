/* eslint-env node */
/* eslint-disable no-console */
/**
 * Build DA documents for the provider pages (/providers/...) from the components that
 * extract.mjs pulled from providers.highmark.com (work/src), plus the provider fragments.
 * Writes work/out/<da path>.html and work/out/images.json (source image -> DA path), which
 * upload.mjs uploads.
 *
 * Usage: node build.mjs <source path|batch file>...   (e.g. batches/batch4.txt)
 *   Without arguments, the pages in PAGES (comma-separated source paths).
 *   FRAGMENTS=1  also the nav, footer and service-centres fragments
 *   SIDENAV=1    also the six side-nav fragments (from data/sidenav.json)
 *   SPOTLIGHT=<an article's source path>  also the articles' "In the Spotlight" fragment
 *   OURS_FILE=<json list of paths>  our live pages, for highmark.com links (default: the
 *                live query index)
 *
 * Content, manual and article pages (data/classified.json's template) get the
 * provider-content template; the others, the landing-page layout:
 */
//   secondary-banner          -> hero-minimal-dark-withimg
//   intercept-banner (navy)   -> section dark, center (default content)
//   intercept-banner (photo)  -> section accent + columns-minimal-dark-overlay
//   card-block                -> intro + cards-minimal-dark-withimg (photos) / -icons (icons) /
//                                cards-minimal-dark-list (text), trailing link = button
//   side-panel-card           -> columns-minimal-dark (text | image)
//   regional-link             -> section grey, links-bar (one paragraph of links)
//   takeaway-cards            -> fragment /providers/fragments/service-centers
//   featuredarticles/newscards-> static article cards (cards-minimal-dark-list)
//   notification-block        -> section notice
//   quick-links-menu          -> cards-minimal-dark-iconnav
import fs from 'node:fs';
import path from 'node:path';
// optional dependency (see README): npm i --no-save linkedom
// eslint-disable-next-line import/no-extraneous-dependencies
import { parseHTML } from 'linkedom';
/* eslint-disable import/extensions -- common.mjs is an ES module next to these scripts */
import {
  DATA, LIVE, ORG, SITE, SRC, WORK, pathsFrom, readJSON, readList,
} from './common.mjs';
/* eslint-enable import/extensions */

const DA_IMG = `https://content.da.live/${ORG}/${SITE}`;
const OUT = path.join(WORK, 'out');
const SRCDIR = path.join(WORK, 'src');
const args = process.argv.slice(2);
const PAGES = args.length ? pathsFrom(args) : (process.env.PAGES || '').split(',').filter(Boolean);
const source = (p) => readJSON(path.join(SRCDIR, `${p === '/' ? 'index' : p.slice(1).replace(/\//g, '__')}.json`));
const fileName = (p) => (p === '/' ? 'index' : p.slice(1).replace(/\//g, '__'));
const docOf = (p) => (p === '/' ? '/providers/index' : `/providers${p}`);
const GATED = new Set(readList(path.join(DATA, 'gated.txt')));
// pages we link to on the source rather than migrating (a form, the search results)
const STAY_ON_SOURCE = [/^\/(communications-hub\/)?join-our-mailing-list(\/|$)/, /^\/search-results/];
// our pages, so highmark.com links to them stay here (the live query index)
const OURS = new Set(process.env.OURS_FILE
  ? readJSON(process.env.OURS_FILE)
  : (await (await fetch(`${LIVE}/query-index.json?limit=5000`)).json()).data.map((r) => r.path));
// contact-us tab anchors on the source -> our headings
const CONTACT_ANCHORS = {
  'hpsc-item-9b92e6d51f-tab': 'highmark-provider-service-centers',
  'hpsc-item-126a9cbdc4-tab': 'highmark-clinical-services',
};

const images = {}; // DA path (or a key) -> { da, src | icon | local }
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
const norm = (t) => t.replace(/\s+/g, ' ').trim();

// links broken on the source -> the working URL (the source links the same file both ways)
const LINK_FIXES = {
  '/pdfs/individual-region/hbcbswv/documents/pdfs/claims-and-authorization/reimbursement-resources/wv-facility-reimb-manual.pdf':
    '/pdfs/individual-region/hbcbswv/documents/pdfs/claims/reimbursement-resources/wv-facility-reimb-manual.pdf',
  // 404 on the source too (2026-10-08); the same files where the source's other pages link them
  '/pdfs/all/documents/pdfs/claims-and-authorization/authorization-guidance/access-mcg-guidelines.pdf':
    '/pdfs/all/documents/pdfs/authorization/mcg-clinical-criteria/access-mcg-guidelines.pdf',
  '/pdfs/multi-region/documents/pdfs/resources-and-education/forms/medicare-part-d-hospice-prior-authorization.pdf':
    '/pdfs/education-resources/forms/prior-authorization/multi-region/medicare-part-d-hospice-prior-authorization.pdf',
  '/pdfs/multi-region/documents/pdfs/resources-and-education/forms/dificid-prior-authorization-form.pdf':
    '/pdfs/education-resources/forms/prior-authorization/multi-region/dificid-prior-authorization-form.pdf',
};

/** Our href for a link on a provider page. */
function mapHref(rawHref) {
  if (!rawHref || rawHref === '#') return null;
  if (rawHref.startsWith('#')) return rawHref; // same-page anchor (see fixAnchors)
  const fix = Object.keys(LINK_FIXES).find((k) => rawHref.endsWith(k));
  const href = fix ? rawHref.replace(fix, LINK_FIXES[fix]) : rawHref;
  let url;
  try { url = new URL(href, `${SRC}/`); } catch { return href; }
  if (url.protocol === 'mailto:' || url.protocol === 'tel:') return href;
  if (url.origin === SRC) {
    let p = decodeURI(url.pathname).replace(/^\/content\/highmark\/en\/providerresourcecenter\/home/, '');
    if (p.startsWith('/content/dam/')) return `${SRC}${encodeURI(p)}`; // files stay on the source
    p = p.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    const hash = CONTACT_ANCHORS[url.hash.slice(1)] ? `#${CONTACT_ANCHORS[url.hash.slice(1)]}` : url.hash;
    if (GATED.has(p) || STAY_ON_SOURCE.some((re) => re.test(p))) return `${SRC}${p}${url.search}${hash}`;
    // a valid page path (lowercase, a-z 0-9 - only), as tools/provider-lists makes the lists'
    // links: a redirect can't match "24,000", and a migrated article sits at the valid path
    const page = p === '/' ? '/' : p.toLowerCase().replace(/[^a-z0-9/-]+/g, '-');
    return `/providers${page}${url.search}${hash}`;
  }
  if (url.host === 'www.highmark.com') {
    const p = url.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    if (OURS.has(p)) return `${p}${url.search}${url.hash}`;
  }
  return url.href;
}

/** A DA picture for a source image, collected for upload into the document's dot-folder. */
function picture(src, alt, docPath) {
  const u = new URL(src, SRC);
  const base = decodeURIComponent(u.pathname.split('/').pop()).toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-(?=\.)/g, '');
  const dir = docPath.replace(/\/([^/]+)$/, '/.$1');
  const da = `${dir}/${base}`;
  images[da] = { da, src: u.href };
  return `<picture><img src="${DA_IMG}${da}" alt="${esc(alt || '')}"></picture>`;
}

/** A link's label: glyph markers dropped; :pdf: for the source's PDF glyph, :lock: for a
 * link behind the Availity login (both become icons). */
function linkText(a) {
  const raw = a.textContent;
  const text = norm(raw.replace(/\[icon:[a-z_]+\]/g, ''));
  const pdf = raw.includes('[icon:picture_as_pdf]') ? ' :pdf:' : '';
  const lock = a.getAttribute('data-lock') || raw.includes('[icon:lock]') ? ' :lock:' : '';
  return `${esc(text)}${pdf}${lock}`;
}

/** Inline HTML of a node with links mapped, glyph markers and target attributes dropped. */
function inline(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('a').forEach((a) => {
    const href = mapHref(a.getAttribute('href'));
    const label = linkText(a);
    if (!href || !norm(a.textContent)) { a.replaceWith(...a.childNodes); return; }
    const link = clone.ownerDocument.createElement('a');
    link.setAttribute('href', href);
    link.innerHTML = label;
    a.replaceWith(link);
  });
  return clone.innerHTML.replace(/\[icon:[a-z_]+\]\s*/g, '').replace(/\s+/g, ' ')
    .replace(/(\s*<br>)+\s*$/, '').trim();
}

const parse = (html) => parseHTML(`<!doctype html><html><body>${html}</body></html>`).document.body;
const linkP = (a) => `<p><a href="${esc(mapHref(a.getAttribute('href')))}">${linkText(a)}</a></p>`;
const sectionMeta = (styles) => (styles.length ? `<div class="section-metadata"><div><div><p>style</p></div><div><p>${styles.join(', ')}</p></div></div></div>` : '');
const block = (name, rows) => `<div class="${name}">${rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')}</div>`;

/** Split a card-block's flat content into intro (before the first card), cards and a
 *  trailing CTA. */
function splitCards(body) {
  const nodes = [...body.childNodes].filter((n) => n.nodeType === 1 || norm(n.textContent));
  const firstCard = nodes.findIndex((n) => n.tagName === 'IMG' || n.tagName === 'H3');
  const intro = firstCard < 0 ? nodes : nodes.slice(0, firstCard);
  const cards = [];
  let cur = null;
  let cta = [];
  (firstCard < 0 ? [] : nodes.slice(firstCard)).forEach((n) => {
    const startsCard = n.tagName === 'IMG' || (n.tagName === 'H3' && !(cur && !cur.h3 && cur.img));
    if (startsCard && !(n.tagName === 'H3' && cur && cur.img && !cur.h3)) {
      cur = {
        img: null, h3: null, rest: [], link: null,
      };
      cards.push(cur);
    }
    if (n.tagName === 'IMG') cur.img = n;
    else if (n.tagName === 'H3') cur.h3 = n;
    else if (n.tagName === 'A') {
      // the card's link, then anything after it is the trailing CTA
      if (!cur.link) cur.link = n;
      else cta.push(n);
    } else if (n.tagName !== 'HR') {
      // a rule between cards is dropped
      if (cur.link) cta.push(n);
      else cur.rest.push(n);
    }
  });
  cta = cta.filter((n) => n.tagName === 'A');
  return { intro, cards, cta };
}

function cardCell(card) {
  const parts = [];
  if (card.h3) parts.push(`<h3>${inline(card.h3)}</h3>`);
  card.rest.forEach((n) => {
    if (n.tagName === 'UL') {
      // region tags (wpa/ nepa, cpa/ sepa)
      parts.push(`<p>${[...n.querySelectorAll('li')].map((li) => esc(norm(li.textContent).replace(/\s*\/\s*/g, '/').toUpperCase())).join(' · ')}</p>`);
    } else if (n.tagName === 'P') {
      const html = inline(n);
      if (norm(n.textContent)) parts.push(`<p>${html}</p>`);
    } else if (n.nodeType === 3) parts.push(`<p>${esc(norm(n.textContent))}</p>`);
  });
  if (card.link) parts.push(linkP(card.link));
  return parts.join('');
}

function cardsBlock(cards, docPath) {
  const withImg = cards.filter((c) => c.img);
  if (!withImg.length) return block('cards-minimal-dark-list', cards.map((c) => [cardCell(c)]));
  const icons = withImg.every((c) => Number(c.img.getAttribute('data-w')) < 120);
  // the source's 335px-wide card images sit in 370px slots, 3 across (variant narrow);
  // its 470px ones 2 across (the block's default)
  const narrow = !icons && withImg.every((c) => Number(c.img.getAttribute('data-w')) <= 345);
  const name = icons ? 'cards-minimal-dark-withimg-icons' : `cards-minimal-dark-withimg${narrow ? ' narrow' : ''}`;
  return block(name, cards.map((c) => (c.img
    ? [picture(c.img.getAttribute('src'), c.img.getAttribute('alt'), docPath), cardCell(c)]
    : [cardCell(c)])));
}

/** Static article cards from a featuredarticles / newscards list. */
function articleCards(body) {
  // each article: [category link] [title link target=_blank] [region text] "For:"
  // [audience] date [summary]
  const cards = [];
  let cur = null;
  const flush = () => { if (cur) cards.push(cur); cur = null; };
  [...body.childNodes].forEach((n) => {
    if (n.tagName === 'H2' || (n.tagName === 'P' && !cur && !cards.length) || n.tagName === 'IMG') return;
    if (n.tagName === 'A' && n.getAttribute('target') === '_blank') {
      // the title; the category link (same or listing href) came just before it
      const prev = cur && !cur.title ? cur : null;
      if (!prev) { flush(); cur = { category: '' }; }
      cur.title = linkText(n);
      cur.href = mapHref(n.getAttribute('href'));
      return;
    }
    if (n.tagName === 'A') {
      const t = norm(n.textContent);
      if (/^view all$/i.test(t)) {
        flush();
        cards.viewAll = n;
      } else if (cur && cur.title && cur.forSeen && !cur.audience) {
        cur.audience = t;
      } else {
        flush();
        cur = { category: t };
      }
      return;
    }
    const t = norm(n.textContent || '');
    if (!t || !cur) return;
    const m = t.match(/^(NEW\s+)?(?:(WNY|NENY|WPA|NEPA|CPA|SEPA|DE|WV)(?:[ ,/]+(?:WNY|NENY|WPA|NEPA|CPA|SEPA|DE|WV))*\s+)?For:\s*$/i)
      || t.match(/^(NEW)$/i);
    if (/For:\s*$/.test(t)) {
      cur.region = (t.match(/\b(WNY|NENY|WPA|NEPA|CPA|SEPA|DE|WV)\b/g) || []).join(', ');
      cur.forSeen = true;
      return;
    }
    if (m) return;
    const date = t.match(/^\|?\s*((Mon|Tue|Wed|Thu|Fri|Sat|Sun), \w{3} \d{2}, \d{4})\s*(.*)$/);
    if (date) {
      const [, day, , rest] = date;
      cur.date = day;
      if (rest) cur.summary = rest;
      return;
    }
    if (cur.date && !cur.summary) cur.summary = t;
  });
  flush();
  const rows = cards.filter((c) => c.title).map((c) => [[
    c.category ? `<p>${esc(c.category)}</p>` : '',
    `<h3><a href="${esc(c.href)}">${c.title}</a></h3>`,
    c.region ? `<p>${esc(c.region)}</p>` : '',
    c.audience ? `<p>For: ${esc(c.audience)}</p>` : '',
    c.date ? `<p>${esc(c.date)}</p>` : '',
    c.summary ? `<p>${esc(c.summary)}</p>` : '',
  ].join('')]);
  return { rows, viewAll: cards.viewAll };
}

/** Default content from a text component: headings (h1 -> h2), paragraphs and lists. */
function richText(body) {
  const out = [];
  [...body.children].forEach((n) => {
    const t = n.tagName;
    if (/^H[1-6]$/.test(t)) {
      const lvl = t === 'H1' ? 2 : Number(t[1]);
      out.push(`<h${lvl}>${norm(inline(n).replace(/<br>/g, ' '))}</h${lvl}>`);
    } else if (t === 'P') {
      if (norm(n.textContent)) out.push(`<p>${inline(n)}</p>`);
    } else if (t === 'UL' || t === 'OL') {
      const tag = t.toLowerCase();
      out.push(`<${tag}>${[...n.children].filter((li) => li.tagName === 'LI').map((li) => `<li>${inline(li)}</li>`).join('')}</${tag}>`);
    }
  });
  return out.join('');
}

/** Phone tables (contact-us) as lines: "label: **number**", hours as their own paragraph. */
function phoneLines(table) {
  const out = [];
  let lines = [];
  table.querySelectorAll('tr').forEach((tr) => {
    const tds = [...tr.querySelectorAll('td')];
    if (tds.length === 2) {
      const label = inline(tds[0]).replace(/(<br>\s*)+$/, '').replace(/\s*<br>\s*/g, '<br>');
      lines.push(`${label}: ${inline(tds[1]).replace(/(<br>\s*)+$/, '')}`);
    } else if (tds.length === 1) {
      if (lines.length) { out.push(`<p>${lines.join('<br>')}</p>`); lines = []; }
      out.push(`<p>${inline(tds[0]).replace(/:\s*<br>\s*/, ': ')}</p>`);
    }
  });
  if (lines.length) out.push(`<p>${lines.join('<br>')}</p>`);
  return out.join('');
}

function regionalText(body, headingLevel) {
  const out = [];
  const h = (lvl) => `h${lvl}`;
  [...body.children].forEach((n) => {
    if (n.tagName === 'UL') return; // region tag, repeats the heading
    if (n.tagName === 'H2') out.push(`<${h(headingLevel)}>${norm(inline(n).replace(/<br>/g, ' '))}</${h(headingLevel)}>`);
    else if (n.tagName === 'H3') out.push(`<${h(headingLevel + 1)}>${norm(inline(n).replace(/<br>/g, ' '))}</${h(headingLevel + 1)}>`);
    else if (n.tagName === 'TABLE') out.push(phoneLines(n));
    else if (n.tagName === 'P') out.push(`<p>${inline(n)}</p>`);
  });
  return out.join('');
}

function metadata(rows) {
  return `<div class="metadata">${Object.entries(rows).filter(([, v]) => v).map(([k, v]) => `<div><div><p>${esc(k)}</p></div><div><p>${esc(v)}</p></div></div>`).join('')}</div>`;
}

function buildPage(name, src, docPath) {
  let heroDone = false;
  const sections = [];
  const add = (styles, html) => sections.push({ styles, html: [html] });
  const last = () => sections[sections.length - 1];
  const comps = [...src.comps, ...(src.tab2 || []).map((c) => ({ ...c, tab2: true }))];

  // contact-us tabs: the source's "view by region" anchors (#hpsccpa, ...) -> the ids the
  // pipeline gives our region headings (central-pennsylvania--southeastern-pennsylvania, and
  // -1 for the same heading in the second tab), in order
  let tab = -1;
  const tabAnchors = [];
  {
    const slug = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s/g, '-');
    const seen = {};
    let t = -1;
    const order = [];
    const slugs = [];
    comps.forEach((c) => {
      if (c.name === 'intercept-banner' && /<img[^>]*blank/i.test(c.html)) {
        t += 1;
        order[t] = [];
        slugs[t] = [];
      }
      if (t < 0) return;
      if (c.name === 'regional-link') order[t] = [...new Set([...c.html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))];
      if (c.name === 'regional-text') {
        const base = slug(norm(parse(c.html).querySelector('h2').textContent));
        const n = seen[base] || 0;
        seen[base] = n + 1;
        slugs[t].push(n ? `${base}-${n}` : base);
      }
    });
    order.forEach((ids, i) => {
      tabAnchors[i] = Object.fromEntries(ids.map((id, j) => [id, slugs[i][j]]));
    });
  }
  comps.forEach((c) => {
    const body = parse(c.html);
    const img = body.querySelector('img');
    switch (c.name) {
      case 'spacing': case 'breadcrumb': case 'footer-disclaimer': case 'separator':
      case 'tab-switcher': break;
      case 'notification-block': {
        const a = body.querySelector('a');
        const p = body.querySelector('p');
        add(['notice'], `<h2><a href="${esc(mapHref(a.getAttribute('href')))}">${esc(norm(a.textContent))}</a></h2><p>${inline(p)}</p>`);
        break;
      }
      case 'secondary-banner': {
        const links = [...body.querySelectorAll('a')];
        if (heroDone) {
          // a later banner (news archive, medical policies) is a photo panel with its own
          // heading: an overlay panel, its h1 demoted so the page keeps one h1
          const sub = body.querySelector('h2');
          const panel = `<h2>${esc(norm(body.querySelector('h1').textContent))}</h2>${sub ? `<p>${esc(norm(sub.textContent))}</p>` : ''}${links.map(linkP).join('')}`;
          add(['accent'], block('columns-minimal-dark-overlay', [[panel, picture(img.getAttribute('src'), '', docPath)]]));
          break;
        }
        heroDone = true;
        const text = [
          `<h1>${esc(norm(body.querySelector('h1').textContent))}</h1>`,
          body.querySelector('h2') ? `<h2>${esc(norm(body.querySelector('h2').textContent))}</h2>` : '',
          ...links.map(linkP),
        ].join('');
        // white text over a dark photo: section style dark
        const white = c.fg === 'rgb(255, 255, 255)';
        add(white ? ['dark'] : [], block('hero-minimal-dark-withimg', [[picture(img.getAttribute('src'), '', docPath)], [text]]));
        break;
      }
      case 'quick-links-menu': {
        const rows = [...body.querySelectorAll('a')].map((a) => {
          const icon = (a.textContent.match(/\[icon:([a-z_]+)\]/) || [])[1];
          images[`icon:${icon}`] = { da: `${docPath.replace(/\/([^/]+)$/, '/.$1')}/icon-${icon}.svg`, icon };
          return [`<picture><img src="${DA_IMG}${images[`icon:${icon}`].da}" alt=""></picture>`, linkP(a)];
        });
        add([], block('cards-minimal-dark-iconnav', rows));
        break;
      }
      case 'intercept-banner': {
        const h2 = body.querySelector('h2');
        const p = body.querySelector('p');
        const links = [...body.querySelectorAll('a')];
        const text = `${h2 ? `<h2>${esc(norm(h2.textContent))}</h2>` : ''}${p ? `<p>${inline(p)}</p>` : ''}${links.filter((a) => !a.closest('p')).map(linkP).join('')}`;
        if (!img) add(['dark', 'center'], text);
        else if (/blank/i.test(img.getAttribute('src'))) {
          // a contact-us tab: its heading and intro in a light-blue band; its regions follow
          tab += 1;
          add(['light-blue', 'center'], text);
        } else add(['accent'], block('columns-minimal-dark-overlay', [[text, picture(img.getAttribute('src'), '', docPath)]]));
        break;
      }
      case 'regional-link': {
        const label = norm(body.querySelector('p')?.textContent || '');
        const links = [...body.querySelectorAll('a')];
        if (!links.length) break;
        const html = `<p>${esc(label)} ${links.map((a) => {
          const href = a.getAttribute('href');
          const anchor = href.startsWith('#') ? `#${tabAnchors[tab]?.[href.slice(1)] || href.slice(1)}` : mapHref(href);
          return `<a href="${esc(anchor)}">${esc(norm(a.textContent))}</a>`;
        }).join(' ')}</p>`;
        add(['grey', 'links-bar'], html);
        break;
      }
      case 'regional-text':
        add(['region-panel'], regionalText(body, 3));
        break;
      case 'card-block': {
        const { intro, cards, cta } = splitCards(body);
        const introHtml = intro.map((n) => {
          if (n.tagName === 'H2') return `<h2>${esc(norm(n.textContent))}</h2>`;
          return n.tagName === 'P' ? `<p>${inline(n)}</p>` : '';
        }).join('');
        add(['center'], `${introHtml}${cardsBlock(cards, docPath)}${cta.map(linkP).join('')}`);
        break;
      }
      case 'button': {
        const a = body.querySelector('a');
        if (a && !/back to top/i.test(a.textContent) && a.getAttribute('href') !== '#hpsc') last().html.push(linkP(a));
        break;
      }
      case 'side-panel-card': {
        const h2 = body.querySelector('h2');
        const text = `<h2>${esc(norm(h2.textContent))}</h2>${[...body.querySelectorAll('p')].map((p) => `<p>${inline(p)}</p>`).join('')}${[...body.querySelectorAll(':scope > a')].map(linkP).join('')}`;
        // the photo sits on the left or the right of the text, as on the source
        const pic = picture(img.getAttribute('src'), '', docPath);
        const left = Number(img.getAttribute('data-cx')) < 50;
        add(['accent'], block('columns-minimal-dark', [left ? [pic, text] : [text, pic]]));
        break;
      }
      case 'takeaway-cards':
        if (!sections.some((s) => s.fragment)) {
          sections.push({ styles: [], fragment: true, html: [block('fragment', [['<p><a href="/providers/fragments/service-centers">/providers/fragments/service-centers</a></p>']])] });
        }
        break;
      case 'featuredarticles': case 'newscards': {
        const h2 = body.querySelector('h2');
        const intro = body.querySelector('h2 + p');
        const { rows, viewAll } = articleCards(body);
        const spot = c.name === 'featuredarticles' && img && name !== 'index' ? picture(img.getAttribute('src'), img.getAttribute('alt'), docPath) : '';
        const blockHtml = spot
          ? block('cards-minimal-dark-withimg', rows.map((r, i) => (i === 0 ? [spot, r[0]] : r)))
          : block('cards-minimal-dark-list', rows);
        add(
          spot ? ['spotlight'] : ['center'],
          `<h2>${esc(norm(h2.textContent))}</h2>${intro ? `<p>${inline(intro)}</p>` : ''}${blockHtml}${viewAll ? linkP(viewAll) : ''}`,
        );
        break;
      }
      case 'title': add([], `<h1>${esc(norm(body.textContent))}</h1>`); break;
      case 'last-updated': last().html.push(`<p>${inline(body.querySelector('p'))}</p>`); break;
      case 'text': {
        if (name === 'contact-us') {
          // "Additional contact information ... HIGHMARK PROVIDER MANUAL" (once, after the regions)
          if (c.tab2) break;
          const a = body.querySelector('a');
          sections.push({ styles: ['light-blue', 'center'], html: [`<p>${esc(norm(body.querySelector('h4').childNodes[0].textContent))}</p>${linkP(a)}`] });
          break;
        }
        if (name === 'legal-information') {
          const ps = [...body.querySelectorAll('p')].map((p) => `<p>${inline(p)}</p>`).join('');
          if (sections.length > 1) add([], ps); else last().html.push(ps);
          break;
        }
        // a text component on a landing page (e.g. the news archive's "Additional Newsletters"
        // heading) is a section of its own; an h1 becomes an h2 (the hero has the page's h1)
        add(['center'], richText(body));
        break;
      }
      default:
        console.warn(`${name}: unhandled component ${c.name}`);
    }
  });

  // contact-us: the second tab's intro section is created by its intercept-banner; the "additional
  // contact" note was pushed after the first tab, so move it to the end
  if (name === 'contact-us') {
    const note = sections.findIndex((s) => s.html[0].startsWith('<p>Additional contact'));
    if (note >= 0) sections.push(...sections.splice(note, 1));
  }

  const meta = {
    Title: src.title,
    Description: src.meta.description,
    Template: name === 'legal-information' ? 'legal' : 'providers',
    Breadcrumbs: name === 'index' ? '' : 'true',
    Region: src.meta['og:region'],
  };
  const html = sections.map((s) => `<div>${sectionMeta(s.styles)}${s.html.join('')}</div>`).join('');
  return `<body><header></header><main>${html}<div>${metadata(meta)}</div></main><footer></footer></body>`;
}

// ---- fragments ----
function buildNav() {
  const tree = readJSON(path.join(DATA, 'menu-tree.json'));
  const lock = (item) => (item.availity ? ' :lock:' : '');
  const li = (item) => {
    if (!item.href || item.href === '#') return `<li>${esc(item.text)}</li>`;
    return `<li><a href="${esc(mapHref(item.href))}">${esc(item.text)}</a>${lock(item)}</li>`;
  };
  const primary = `<ul>${tree.map((top) => `<li><p><a href="${esc(mapHref(top.href))}">${esc(top.text)}</a></p><ul>${top.cats.map((cat) => (cat.items.length
    ? `<li><p><a href="${esc(mapHref(cat.href))}">${esc(cat.text)}</a>${lock(cat)}</p><ul>${cat.items.map(li).join('')}</ul></li>`
    : li(cat))).join('')}</ul></li>`).join('')}</ul>`;
  const icon = (file, alt) => `<picture><img src="${DA_IMG}/providers/fragments/.nav/${file}" alt="${esc(alt)}"></picture>`;
  ['providers-logo.svg', 'icon-contact-us.svg', 'icon-mailing-list.svg', 'icon-availity-login.svg'].forEach((f) => { images[`nav:${f}`] = { da: `/providers/fragments/.nav/${f}`, local: `assets/nav/${f === 'providers-logo.svg' ? 'providers-logo.min.svg' : f}` }; });
  const sections = [
    '<ul><li><a href="https://medicare.highmark.com/">Medicare</a></li><li><a href="/">For Members</a></li><li><a href="/employer">For Employers</a></li><li><a href="https://producer.highmark.com/">For Brokers</a></li></ul>',
    `<p><a href="/providers/">${icon('providers-logo.svg', 'Highmark Provider Resource Center')}</a></p><ul>`
      + `<li><a href="/providers/contact-us">${icon('icon-contact-us.svg', 'Contact Us')}</a> Contact Us</li>`
      + `<li><a href="${SRC}/communications-hub/join-our-mailing-list">${icon('icon-mailing-list.svg', 'Join Our Mailing List')}</a> Join Our Mailing List</li>`
      + `<li><a href="https://apps.availity.com/web/onboarding/availity-fr-ui/#/login">${icon('icon-availity-login.svg', 'Login via Availity')}</a> Login via Availity</li></ul>`,
    `${sectionMeta(['full width'])}${primary}`,
    `<p><a href="${SRC}/search-results.html?filter=All">Search Keyword or Code</a></p>`,
  ];
  return `<body><header></header><main>${sections.map((s) => `<div>${s}</div>`).join('')}</main><footer></footer></body>`;
}

function buildFooter() {
  images['footer:providers-footer-logo.svg'] = { da: '/providers/fragments/.footer/providers-footer-logo.svg', local: 'assets/footer/providers-footer-logo.svg' };
  const legal = source('/').comps.find((c) => c.name === 'footer-disclaimer').html;
  const sections = [
    `<p><picture><img src="${DA_IMG}/providers/fragments/.footer/providers-footer-logo.svg" alt="Highmark Because Life logo for the Highmark Blue Cross Blue Shield companies"></picture></p>`,
    '<p>About Highmark</p><ul><li><a href="/non-discrimination">Non Discrimination Policy</a></li><li><a href="/providers/policies-and-programs/medical-policies">Medical Policy</a></li><li><a href="/providers/contact-us">Contact Us</a></li><li><a href="/member/member-guide/find-care">Provider Directory</a></li></ul>',
    '<p>Be Informed</p><ul><li><a href="/providers/legal-information">Legal Information</a></li></ul>',
    '<p>Related Sites</p><ul><li><a href="https://www.highmarkhealth.org/">Highmark Health</a></li><li><a href="https://www.highmarkdirect.com/">Highmark Direct</a></li><li><a href="https://www.highmarkhealth.org/annualreport2022/index.shtml">Annual Report</a></li></ul>',
    legal.replace(/<br><\/p>/g, '</p>'),
  ];
  return `<body><header></header><main>${sections.map((s) => `<div>${s}</div>`).join('')}</main><footer></footer></body>`;
}

function buildServiceCenters() {
  const src = source('/').comps.find((c) => c.name === 'takeaway-cards');
  const body = parse(src.html);
  const imgs = [...body.querySelectorAll('img')];
  const rows = [...body.querySelectorAll('h2')].map((h2, i) => {
    const p = h2.nextElementSibling;
    const a = p.nextElementSibling;
    return [picture(imgs[i].getAttribute('src'), '', '/providers/fragments/service-centers'),
      `<h3>${esc(norm(h2.textContent))}</h3><p>${inline(p)}</p>${linkP(a)}`];
  });
  return `<body><header></header><main><div>${sectionMeta(['service-centers'])}${block('cards-minimal-dark-withimg', rows)}</div></main><footer></footer></body>`;
}

// ---- content pages (template provider-content) ----
const REGION_TAG = /^(wpa|nepa|cpa|sepa|de|wv|wny|neny)(\s*\/\s*(wpa|nepa|cpa|sepa|de|wv|wny|neny))?$/i;
const isRegionTags = (ul) => ul.tagName === 'UL' && [...ul.children].length
  && [...ul.children].every((li) => REGION_TAG.test(norm(li.textContent)));
const regionLabel = (ul) => `<p><strong>${[...ul.children].map((li) => esc(norm(li.textContent).replace(/\s*\/\s*/g, '/').toUpperCase())).join(' · ')}</strong></p>`;

/** A source table as a table block (header row when the first row has th cells). */
function tableBlock(table) {
  const rows = [...table.querySelectorAll('tr')].filter((tr) => norm(tr.textContent));
  const header = rows[0]?.querySelector('th');
  const width = Math.max(...rows.map((tr) => tr.children.length));
  const cells = rows.map((tr) => {
    const cs = [...tr.children].map((td) => (td.querySelector('p, ul, ol')
      // eslint-disable-next-line no-use-before-define -- tables and rich text nest each other
      ? richNodes([...td.childNodes], { inCell: true })
      : `<p>${inline(td)}</p>`));
    while (cs.length < width) cs.push('');
    return cs;
  });
  return block(`table${header ? '' : ' no-header'}`, cells);
}

/** A cell's content as inline HTML: its paragraphs joined by line breaks. */
const cellInline = (td) => {
  const blocks = [...td.children].filter((e) => ['P', 'DIV'].includes(e.tagName));
  return (blocks.length ? blocks.map((p) => inline(p)) : [inline(td)]).filter((t) => norm(t.replace(/<[^>]+>/g, ''))).join('<br>');
};

/** A table inside a block cell (no nested blocks): one line per row, cells joined. */
const tableLines = (table) => [...table.querySelectorAll('tr')].filter((tr) => norm(tr.textContent))
  .map((tr, i) => { const line = [...tr.children].map(cellInline).filter((t) => norm(t.replace(/<[^>]+>/g, ''))).join(' | '); return `<p>${tr.querySelector('th') || i === 0 ? `<strong>${line.replace(/<\/?strong>/g, '')}</strong>` : line}</p>`; }).join('');

/** The pipeline's heading id for a heading's text. */
const slugOf = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s/g, '-');

/** Same-page links (#roster): to the heading with the link's text, else plain text. */
function fixAnchors(html) {
  const headings = [...html.matchAll(/<h[1-6]>(.*?)<\/h[1-6]>/g)].map((m) => norm(m[1].replace(/<[^>]+>/g, '')));
  return html.replace(/<a href="#[^"]*">(.*?)<\/a>/g, (all, text) => {
    const plain = norm(text.replace(/<[^>]+>/g, ''));
    const h = headings.find((x) => x.toLowerCase() === plain.toLowerCase());
    return h ? `<a href="#${slugOf(h)}">${text}</a>` : text;
  });
}

/** DataTables shows a table as a header table over a body table; put the header rows back
 *  at the top of the body table, so the two become one table block. */
function joinSplitTables(nodes) {
  return nodes.filter((n, i) => {
    if (n.nodeType !== 1 || n.tagName !== 'TABLE') return true;
    const rows = [...n.querySelectorAll('tr')].filter((tr) => norm(tr.textContent));
    if (!rows.length || !rows.every((tr) => [...tr.children].every((c) => c.tagName === 'TH'))) return true;
    const next = nodes.slice(i + 1).find((m) => m.nodeType === 1 || norm(m.textContent || ''));
    if (!next || next.nodeType !== 1 || next.tagName !== 'TABLE') return true;
    (next.querySelector('tbody') || next).prepend(...rows);
    return false;
  });
}

/** Default content from source nodes: headings (h1 -> h2), paragraphs, lists (region-tag
 *  lists become a bold region label), tables (a table block, or lines inside a cell), images. */
function richNodes(nodes, { inCell = false, docPath = '' } = {}) {
  const out = [];
  let loose = [];
  const flush = () => { const t = loose.join('').trim(); if (norm(t.replace(/<[^>]+>/g, ''))) out.push(`<p>${t}</p>`); loose = []; };
  joinSplitTables(nodes).forEach((n) => {
    if (n.nodeType === 3) { if (!/^\s*\[icon:[a-z_]+\]\s*$/.test(n.textContent)) loose.push(esc(n.textContent.replace(/\[icon:[a-z_]+\]/g, ''))); return; }
    if (n.nodeType !== 1) return;
    const t = n.tagName;
    if (['A', 'STRONG', 'EM', 'SUB', 'SUP', 'BR'].includes(t)) { const w = n.ownerDocument.createElement('span'); w.append(n.cloneNode(true)); loose.push(inline(w)); return; }
    flush();
    if (/^H[1-6]$/.test(t)) {
      const lvl = t === 'H1' ? 2 : Number(t[1]);
      const text = norm(inline(n).replace(/<br>/g, ' '));
      if (norm(n.textContent)) out.push(`<h${lvl}>${text}</h${lvl}>`);
    } else if (t === 'P') {
      if (norm(n.textContent) || n.querySelector('img')) out.push(`<p>${inline(n)}</p>`);
    } else if (t === 'UL' || t === 'OL') {
      if (isRegionTags(n)) out.push(regionLabel(n));
      else out.push(`<${t.toLowerCase()}>${[...n.children].filter((li) => li.tagName === 'LI').map((li) => `<li>${inline(li).replace(/(\s*<br>)+\s*<\/li>/g, '</li>')}</li>`).join('')}</${t.toLowerCase()}>`);
    } else if (t === 'TABLE') {
      out.push(inCell ? tableLines(n) : tableBlock(n));
    } else if (t === 'IMG') {
      if (docPath) out.push(`<p>${picture(n.getAttribute('src'), n.getAttribute('alt'), docPath)}</p>`);
    } else if (t === 'HR') {
      // a rule inside DA content would split the section; drop it
    } else {
      out.push(richNodes([...n.childNodes], { inCell, docPath }));
    }
  });
  flush();
  return out.join('');
}

/** An accordion table: one row per heading (question) with what follows it (answer). */
function accordionBlock(body, docPath) {
  const items = [];
  [...body.childNodes].forEach((n) => {
    if (n.nodeType === 1 && /^H[2-6]$/.test(n.tagName)) items.push({ label: norm(n.textContent), nodes: [] });
    else if (items.length) items[items.length - 1].nodes.push(n);
  });
  if (!items.length) return richNodes([...body.childNodes], { docPath });
  return block('accordion-minimal-light', items.map((it) => [`<p>${esc(it.label)}</p>`, richNodes(it.nodes, { inCell: true, docPath })]));
}

/** A region-tag list's labels: "wpa/ nepa" -> "WPA/NEPA". */
const regionLabels = (ul) => [...ul.children].map((li) => norm(li.textContent).replace(/\s*\/\s*/g, '/').toUpperCase());

/** A regional-text component as one provider-panel (region): each region-tag list opens a row
 *  holding what follows it, until the next list (the source stacks one pink box per list, edge
 *  to edge); pink on the source, untinted ("plain") when white. Anything before the first list
 *  is plain content. */
function regionalBlocks(body, bg, docPath) {
  const groups = [{ tags: null, nodes: [] }];
  [...body.childNodes].forEach((n) => {
    if (n.nodeType === 1 && isRegionTags(n)) groups.push({ tags: n, nodes: [] });
    else groups[groups.length - 1].nodes.push(n);
  });
  const tint = bg === 'rgb(254, 240, 236)' ? '' : ' plain';
  const [lead, ...tagged] = groups;
  const rows = tagged.map((g) => [`<p>${esc(regionLabels(g.tags).join(', '))}</p>`, richNodes(g.nodes, { inCell: true, docPath })]);
  return richNodes(lead.nodes, { docPath }) + (rows.length ? block(`provider-panel region${tint}`, rows) : '');
}

/** An article's heading: the topic (a link to its list), the title, its region badges, the
 *  "Published Date" and "For" lines (scripts.js classes them for provider-content.css). */
function articleTitle(body) {
  const out = [];
  const topic = body.querySelector(':scope > a');
  if (topic) out.push(`<p><a href="${esc(mapHref(topic.getAttribute('href')))}">${esc(norm(topic.textContent))}</a></p>`);
  const h = body.querySelector('h1');
  out.push(`<h1>${esc(norm(h ? h.textContent : ''))}</h1>`);
  const tags = [...body.querySelectorAll(':scope > ul')].find(isRegionTags);
  if (tags) out.push(`<ul>${regionLabels(tags).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`);
  body.querySelectorAll(':scope > p').forEach((para) => { if (norm(para.textContent)) out.push(`<p>${esc(norm(para.textContent))}</p>`); });
  return out.join('');
}

/** The source's "In the Spotlight" band (featuredarticles): its cards' topic, link, title, For
 *  and date. */
function spotlightCards(html) {
  const re = /<a href="([^"]+)">([^<]+)<\/a><a href="[^"]+"(?: target="_blank")?>\s*([^<]+?)\s*<\/a>\s*For:\s*<a href="[^"]*">([^<]+)<\/a>\s*([A-Z][a-z]{2}, [A-Z][a-z]{2} \d{2}, \d{4})/g;
  return [...html.matchAll(re)].map(([, href, topic, title, audience, date]) => ({
    href: mapHref(href), topic: norm(topic), title: norm(title), audience: norm(audience), date,
  }));
}

function buildSpotlight(src) {
  const comp = src.comps.find((c) => c.name === 'featuredarticles');
  const cards = spotlightCards(comp.html);
  if (cards.length !== 3) console.warn(`spotlight: ${cards.length} cards`);
  const rows = cards.map((c) => [`<p>${esc(c.topic)}</p><h3><a href="${esc(c.href)}">${esc(c.title)}</a></h3><p>For: ${esc(c.audience)}</p><p>${esc(c.date)}</p>`]);
  return `<body><header></header><main><div>${sectionMeta(['spotlight'])}<h2>In the Spotlight</h2>${block('cards', rows)}</div></main><footer></footer></body>`;
}

// components that sit outside the article column, so never inside a grey box
const OUTSIDE = new Set(['breadcrumb', 'side-navigation', 'right-rail', 'featuredarticles', 'footer-disclaimer']);

function buildContentPage(name, src, docPath, sourcePath) {
  const section = `/${sourcePath.split('/')[1]}`;
  const sidenav = block('provider-sidenav', [[`<p><a href="/providers/fragments/sidenav${section}">/providers/fragments/sidenav${section}</a></p>`]]);
  const article = [];
  let rail = '';
  let titled = false;
  let spotlight = false;
  // DataTables: the data-table component holds only the header table, and the body table
  // opens the next component; put the header rows back on top of the body
  const comps = src.comps.filter((c, i, all) => {
    const head = c.name === 'data-table' && c.html.match(/^<table><tbody>((?:<tr>(?:<th>.*?<\/th>)+<\/tr>)+)<\/tbody><\/table>$/);
    const next = all[i + 1];
    if (!head || !next || !next.html.startsWith('<table><tbody>')) return true;
    next.html = next.html.replace('<table><tbody>', `<table><tbody>${head[1]}`);
    return false;
  });
  // neighbouring components in one tinted container (a grey box) become one provider-panel;
  // inside it nothing can be a block, so tables become lines and accordions plain text
  let boxId = null;
  let boxed = [];
  const flushBox = () => {
    if (boxId !== null && norm(boxed.join('').replace(/<[^>]+>/g, ''))) article.push(block('provider-panel', [[boxed.join('')]]));
    boxId = null;
    boxed = [];
  };
  const emit = (html) => (boxId !== null ? boxed : article).push(html);
  comps.forEach((c) => {
    const inBox = c.box !== undefined && !OUTSIDE.has(c.name);
    if (!inBox || c.box !== boxId) flushBox();
    if (inBox) boxId = c.box;
    const inCell = boxId !== null;
    const body = parse(c.html);
    switch (c.name) {
      case 'spacing': case 'breadcrumb': case 'footer-disclaimer': case 'separator': case 'side-navigation': break;
      // a decorative 51px bar over a footnote
      case 'accent-line': break;
      case 'title': {
        const h = body.querySelector('h1, h2, h3, h4, h5, h6');
        if (!h) break;
        const lvl = !titled ? 1 : Math.max(2, Number(h.tagName[1]));
        titled = true;
        emit(`<h${lvl}>${esc(norm(h.textContent))}</h${lvl}>`);
        break;
      }
      case 'article-title':
        titled = true;
        article.push(articleTitle(body));
        break;
      case 'last-updated': emit(`<p><em>${esc(norm(body.textContent))}</em></p>`); break;
      case 'text': case 'data-table':
        emit(richNodes([...body.childNodes], { docPath, inCell }));
        break;
      case 'regional-text':
        emit(inCell
          ? richNodes([...body.childNodes], { docPath, inCell })
          : regionalBlocks(body, c.bg, docPath));
        break;
      case 'accordion-table':
        emit(inCell
          ? richNodes([...body.childNodes], { docPath, inCell })
          : accordionBlock(body, docPath));
        break;
      case 'image': {
        const img = body.querySelector('img');
        if (img) emit(`<p>${picture(img.getAttribute('src'), img.getAttribute('alt'), docPath)}</p>`);
        break;
      }
      case 'button': {
        const a = body.querySelector('a');
        const href = a?.getAttribute('href') || '';
        // the source's button component is either a filled button (it has a background) or an
        // uppercase text CTA ("Read More"): a bold link or an italic one (see
        // provider-content.css); a link alone in a paragraph elsewhere stays a plain link
        const tag = c.bg ? 'strong' : 'em';
        if (a && !/back to top/i.test(a.textContent) && !href.startsWith('#')) emit(linkP(a).replace(/^<p>(.*)<\/p>$/, `<p><${tag}>$1</${tag}></p>`));
        break;
      }
      case 'right-rail': {
        // "Related Links" (or "Quick Info"), its rule, then the links
        const kids = [...body.childNodes].filter((n) => !(n.nodeType === 1 && n.tagName === 'HR'));
        const first = kids.find((n) => n.nodeType === 1);
        // a short first paragraph is the rail's heading
        const usedFirst = first && first.tagName === 'P' && norm(first.textContent).length < 40;
        const heading = usedFirst ? norm(first.textContent) : 'Related Links';
        rail = `<h2>${esc(heading)}</h2>${richNodes(kids.filter((n) => !(usedFirst && n === first)), { docPath })}`;
        break;
      }
      // the same three curated articles on every article: one fragment
      case 'featuredarticles': spotlight = true; break;
      default:
        console.warn(`${name}: unhandled component ${c.name}`);
    }
  });
  flushBox();
  if (!titled) article.unshift(`<h1>${esc(src.title)}</h1>`);
  const meta = {
    Title: src.title,
    Description: src.meta.description,
    Template: 'provider-content',
    Breadcrumbs: 'true',
    Region: src.meta['og:region'],
  };
  const sections = [
    `<div>${sidenav}</div>`,
    `<div>${fixAnchors(article.join(''))}</div>`,
    rail ? `<div>${sectionMeta(['rail'])}${rail}</div>` : '',
    spotlight ? `<div>${block('fragment', [['<p><a href="/providers/fragments/spotlight">/providers/fragments/spotlight</a></p>']])}</div>` : '',
  ];
  return `<body><header></header><main>${sections.join('')}<div>${metadata(meta)}</div></main><footer></footer></body>`;
}

// ---- section side navs ----
// One fragment per top-level section (/providers/fragments/sidenav/<section>) holding the
// section's whole tree as nested lists: the landing page, its sub-sections in menu order, and
// every page below them as the source's side navs list them. The provider-sidenav block shows
// the part a page needs (its parent, the parent's children, its own children).
const SECTIONS = ['/authorization', '/claims', '/policies-and-programs', '/provider-network', '/resources-and-education', '/communications-hub'];
function buildSidenavs() {
  const { childrenOf, label, lock } = readJSON(path.join(DATA, 'sidenav.json'));
  const { pages: all } = readJSON(path.join(DATA, 'classified.json'));
  const tree = readJSON(path.join(DATA, 'menu-tree.json'));
  // lists of PDF stubs (reimbursement policies) don't nest their items
  const docLists = new Set(all.filter((p) => p.template === 'document-list').map((p) => p.path));
  const titleOf = Object.fromEntries(all.map((p) => [p.path, p.title]));
  const out = {};
  SECTIONS.forEach((top) => {
    const menuTop = tree.find((t) => t.href === top);
    // the section's children: what its own side nav lists, else its menu categories
    const kids = (childrenOf[top] || []).length
      ? childrenOf[top]
      : (menuTop?.cats || []).map((c) => c.href);
    const seen = new Set([top]);
    const li = (key, parent, depth) => {
      const isPath = key.startsWith('/');
      const named = isPath
        ? menuTop?.cats.find((c) => c.href === key)?.text || titleOf[key]
        : key.slice(5);
      const text = label[key] || named || key;
      if (!isPath) return `<li>${esc(text)}</li>`;
      const href = mapHref(key);
      const gated = lock[key] || /^https:\/\/providers\.highmark\.com\//.test(href);
      // nest only real descendants, once each; cross-links stay single links
      const nest = key.startsWith(`${parent}/`) && !seen.has(key) && !docLists.has(key) && depth < 6;
      seen.add(key);
      const sub = nest ? (childrenOf[key] || []).map((k) => li(k, key, depth + 1)).join('') : '';
      return `<li><a href="${esc(href)}">${esc(text)}</a>${gated ? ' :lock:' : ''}${sub ? `<ul>${sub}</ul>` : ''}</li>`;
    };
    const items = kids.map((k) => li(k, top, 1)).join('');
    const topText = menuTop?.text || titleOf[top] || top;
    out[top] = `<body><header></header><main><div><ul><li><a href="${mapHref(top)}">${esc(topText)}</a><ul>${items}</ul></li></ul></div></main><footer></footer></body>`;
  });
  return out;
}

// ---- write ----
const write = (daPath, html) => {
  const file = path.join(OUT, `${daPath}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log(`${daPath}.html ${html.length} bytes`);
};
fs.rmSync(OUT, { recursive: true, force: true });
// content, manual and article pages (left side nav, article, optional rail) get the content
// template
const TEMPLATE_OF = Object.fromEntries(readJSON(path.join(DATA, 'classified.json')).pages.map((p) => [p.path, p.template]));
PAGES.forEach((p) => {
  const src = source(p);
  const content = ['content', 'manual', 'article'].includes(TEMPLATE_OF[p]);
  write(docOf(p), content
    ? buildContentPage(fileName(p), src, docOf(p), p)
    : buildPage(fileName(p), src, docOf(p)));
});
// the fragments only when asked (FRAGMENTS=1): they are live and edited separately
if (process.env.FRAGMENTS === '1') {
  write('/providers/fragments/nav', buildNav());
  write('/providers/fragments/footer', buildFooter());
  write('/providers/fragments/service-centers', buildServiceCenters());
}
// the articles' "In the Spotlight" band, from one article (SPOTLIGHT=<source path>)
if (process.env.SPOTLIGHT) {
  write('/providers/fragments/spotlight', buildSpotlight(source(process.env.SPOTLIGHT)));
}
if (process.env.SIDENAV === '1') {
  Object.entries(buildSidenavs()).forEach(([top, html]) => write(`/providers/fragments/sidenav${top}`, html));
}
fs.writeFileSync(path.join(OUT, 'images.json'), JSON.stringify(images, null, 1));
console.log(`${Object.keys(images).length} images`);
