/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import accordionMinimalLightParser from './parsers/accordion-minimal-light.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import { spacerHeights, spaceStyle } from './transformers/highmark-faq-topic-sections.js';

/**
 * Employer thought-leadership articles (/employer/thought-leadership/..., e.g.
 * whole-person-health/family-mental-health; Template: employer-article).
 *
 * The source is one centred col-lg-8 column (800px at 1440): the h1, the banner image,
 * then text components (the lead paragraph, h2s, paragraphs, lists, links) with AEM
 * spacing components between some of them; a grey box (section.new-hmk-brand-papergrey,
 * Family Mental Health's "Watch how Jamie ..."), the fine print, the Sources accordion
 * and the blush "Find a plan that fits your business needs" band, all in the column.
 * The column's components are walked in order, and each run of spacers becomes a section
 * break with its space-* style (top padding; -tablet- / -mobile- where those differ):
 *   - text components: their headings, paragraphs and lists; the source's lead text
 *     (span.p1 on a whole paragraph: the intro, the podcast titles) is an H5, as on the
 *     other employer pages; a component's links on their own lines (div > a: Kids'
 *     Mental Health's Helpful resources) are paragraphs;
 *   - the banner image: a paragraph holding it;
 *   - the Sources accordion: accordion-minimal-light (one item, collapsed);
 *   - a band: its own section, Style grey / highlight (blush) / accent (polar), with
 *     its leading and trailing spacers as band-top-* / band-bottom-* (inner padding);
 *     the spacers before it stay outside its colour (space-*);
 *   - buttons: an outlined one (brand-button-light, GET STARTED) is an italic link, a
 *     filled one (brand-button-normal) a bold link.
 * Links that open a new tab end with the source's external-link icon: :external-link:
 * here, which scripts.js reads as "open in a new tab".
 */

const BANDS = [
  ['section.new-hmk-brand-papergrey', 'grey'],
  ['section.new-hmk-brand-blush-twnetyfive', 'highlight'],
  ['section.new-hmk-brand-polar', 'accent'],
];
const BAND = BANDS.map(([sel]) => sel).join(', ');

const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();
const add = (a, b) => a.map((v, i) => v + b[i]);
const isBlank = (el) => !el.querySelector('img, br, sup') && !el.textContent.replace(/[\s\u00a0\u200b]/g, '');

/** A run of spacers' style for a band's padding: band-<side>-<d>, plus -tablet- /
 * -mobile- where those differ from it (as space-*). */
function bandStyles(side, [d, t, m]) {
  const s = [`band-${side}-${d}`];
  if (t !== d) s.push(`band-${side}-tablet-${t}`);
  if (m !== d) s.push(`band-${side}-mobile-${m}`);
  return s;
}

/** A copy of a text element without the source's inline styles and wrapper spans. */
function cleanCopy(document, el) {
  const copy = el.cloneNode(true);
  copy.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
  copy.removeAttribute('style');
  copy.querySelectorAll('span:not([class]), span.p1').forEach((s) => s.replaceWith(...s.childNodes));
  return copy;
}

/** The output elements for a text component. */
function textContent(document, cmp) {
  const out = [];
  [...cmp.children].forEach((el) => {
    if (/^(SCRIPT|LINK|STYLE)$/.test(el.tagName)) return;
    // lines of their own (div > a, no space between them: Kids' Mental Health's Helpful
    // resources) -> one paragraph, a line each
    if (el.tagName === 'DIV') {
      if (el.querySelector('p, ul, ol, h1, h2, h3, h4, h5, h6')) {
        out.push(...textContent(document, el));
        return;
      }
      if (isBlank(el)) return;
      const prev = el.previousElementSibling;
      let p = out[out.length - 1];
      if (!(prev?.tagName === 'DIV' && p?.dataset.lines)) {
        p = document.createElement('p');
        p.dataset.lines = 'true';
        out.push(p);
      } else p.append(document.createElement('br'));
      p.append(...cleanCopy(document, el).childNodes);
      return;
    }
    if (!/^(H[1-6]|P|UL|OL)$/.test(el.tagName)) return;
    if (el.tagName === 'P' && isBlank(el)) return;
    // the lead style on a whole paragraph -> an H5
    const lead = el.tagName === 'P' && el.querySelector(':scope > span.p1');
    if (lead && clean(lead.textContent) === clean(el.textContent)) {
      const h5 = document.createElement('h5');
      h5.append(...cleanCopy(document, lead).childNodes);
      // a trailing line break ends nothing here
      while (h5.lastChild && h5.lastChild.nodeName === 'BR') h5.lastChild.remove();
      out.push(h5);
      return;
    }
    const copy = cleanCopy(document, el);
    while (copy.lastChild && copy.lastChild.nodeName === 'BR') copy.lastChild.remove();
    out.push(copy);
  });
  out.forEach((el) => el.removeAttribute('data-lines'));
  return out;
}

/** A button component as a paragraph: bold (filled) or italic (outlined) link. */
function buttonContent(document, cmp) {
  return [...cmp.querySelectorAll('.hmk-brand-buttons a[href]')].map((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = clean(a.textContent);
    if (a.matches('.brand-button-normal, .brand-button-light')) {
      const wrap = document.createElement(a.matches('.brand-button-normal') ? 'strong' : 'em');
      wrap.append(link);
      p.append(wrap);
    } else p.append(link);
    return p;
  });
}

function sectionBreak(document, main, styles) {
  main.append(document.createElement('hr'));
  if (styles.length) {
    main.append(WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: { style: styles.join(', ') },
    }));
  }
}

export default {
  /**
   * As in import-employer-plan.js: non-breaking spaces in text become U+E000 (the
   * Markdown round trip would make them spaces; upload-to-da.mjs turns them back),
   * and the Sources' empty spacer paragraphs (<p>&nbsp;</p>) a zero-width space.
   */
  onLoad: ({ document }) => {
    document.querySelectorAll('.collapsible-item-description > p').forEach((p) => {
      if (!p.querySelector('img, br') && !p.textContent.replace(/[\s\u00a0]/g, '')) p.textContent = '\u200b';
    });
    const walker = document.createTreeWalker(document.body, 4 /* NodeFilter.SHOW_TEXT */);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.filter((t) => t.nodeValue.includes('\u00a0') && /[^\s\u00a0]/.test(t.nodeValue)).forEach((t) => {
      t.nodeValue = t.nodeValue.replace(/\u00a0/g, '\ue000');
    });
  },

  transform: (payload) => {
    const { document, url, params } = payload;
    const body = document.body;
    cleanupTransformer('beforeTransform', body, payload);

    const h1 = body.querySelector('h1');
    const column = h1.closest('.col-lg-8') || h1.closest('.page__par');
    const crumb = document.querySelector('ol.breadcrumb-list li.active');
    // the trail's first crumb: highmark.com's employer pages start at Home = /employer, so
    // the page gets Breadcrumb Home /employer (the trail then has no Employer crumb)
    const crumbHome = (document.querySelector('ol.breadcrumb-list li:first-child a')?.getAttribute('href') || '')
      .replace(/^https:\/\/www\.highmark\.com/, '').replace(/\/$/, '');
    const crumbLabel = clean(crumb?.textContent);
    const meta = WebImporter.Blocks.getMetadata(document) || {};

    // new-tab links: the source's external-link icon -> :external-link:, and its
    // screen-reader hint goes
    column.querySelectorAll('a .global-clr_externallink').forEach((span) => {
      span.replaceWith(document.createTextNode(' :external-link:'));
    });
    column.querySelectorAll('a *').forEach((el) => {
      if (/^opens a new tab or window$/i.test(clean(el.textContent))) el.remove();
    });
    // a video's image links to the video; nothing else here links an image
    column.querySelectorAll('.image a:has(img)').forEach((a) => a.replaceWith(...a.childNodes));

    const leaves = [...column.querySelectorAll('.aem-GridColumn')].filter((el) => !el.querySelector('.aem-GridColumn'));
    const isSpacer = (el) => el.matches('.spacing');
    const bandOf = (el) => {
      const band = el.closest(BAND);
      return band && column.contains(band) ? band : null;
    };
    // each band's leading and trailing spacers are its padding
    const bandPad = new Map();
    leaves.forEach((leaf) => {
      const band = bandOf(leaf);
      if (!band || bandPad.has(band)) return;
      const own = leaves.filter((l) => bandOf(l) === band);
      const lead = [];
      for (const l of own) { if (!isSpacer(l)) break; lead.push(l); }
      const trail = [];
      for (const l of [...own].reverse()) { if (!isSpacer(l) || lead.includes(l)) break; trail.push(l); }
      const sum = (list) => list.map(spacerHeights).reduce(add, [0, 0, 0]);
      bandPad.set(band, { edge: new Set([...lead, ...trail]), top: sum(lead), bottom: sum(trail) });
    });

    const main = document.createElement('div');
    let pending = [0, 0, 0];
    let current = null; // the band the output is in
    let leftBand = false; // the content after a band starts a section
    const bandStyle = (band) => BANDS.find(([sel]) => band.matches(sel))[1];
    leaves.forEach((leaf) => {
      const band = bandOf(leaf);
      if (band !== current) {
        // entering or leaving a band: a new section; the spacers before it stay outside
        const styles = [];
        if (band) {
          const pad = bandPad.get(band);
          styles.push(bandStyle(band));
          if (pending.some(Boolean)) styles.push(spaceStyle(pending));
          if (pad.top.some(Boolean)) styles.push(...bandStyles('top', pad.top));
          if (pad.bottom.some(Boolean)) styles.push(...bandStyles('bottom', pad.bottom));
          sectionBreak(document, main, styles);
          pending = [0, 0, 0];
        } else leftBand = true;
        current = band;
      }
      if (isSpacer(leaf)) {
        if (!band || !bandPad.get(band).edge.has(leaf)) pending = add(pending, spacerHeights(leaf));
        return;
      }
      if (pending.some(Boolean) || leftBand) {
        // a spacer inside a band keeps the band's colour
        const space = pending.some(Boolean) ? [spaceStyle(pending)] : [];
        sectionBreak(document, main, [...(band ? [bandStyle(band)] : []), ...space]);
        pending = [0, 0, 0];
        leftBand = false;
      }
      if (leaf.matches('.image')) {
        const src = leaf.querySelector('img');
        if (!src) return;
        const img = document.createElement('img');
        img.src = src.getAttribute('src');
        img.alt = src.getAttribute('alt') || '';
        const p = document.createElement('p');
        p.append(img);
        main.append(p);
      } else if (leaf.querySelector('.accordianTable')) {
        const acc = leaf.querySelector('.accordianTable');
        const holder = document.createElement('div');
        holder.append(acc);
        accordionMinimalLightParser(acc, { document, url, params });
        main.append(...holder.childNodes);
      } else if (leaf.matches('.button') || leaf.querySelector('.hmk-brand-buttons')) {
        main.append(...buttonContent(document, leaf));
      } else {
        const cmp = leaf.matches('.cmp-text') ? leaf : (leaf.querySelector('.cmp-text') || leaf);
        main.append(...textContent(document, cmp));
      }
    });
    // spacers that end the column: an empty section of their height
    if (pending.some(Boolean)) sectionBreak(document, main, [spaceStyle(pending)]);
    // the first break (before the h1) opens nothing
    if (main.firstElementChild?.tagName === 'HR') main.firstElementChild.remove();

    // metadata: the source's, with breadcrumbs under the source label
    sectionBreak(document, main, []);
    meta.Template = 'employer-article';
    meta.breadcrumbs = 'true';
    if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    if (crumbHome.startsWith('/')) meta['Breadcrumb Home'] = crumbHome;
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    body.replaceChildren(...main.childNodes);
    cleanupTransformer('afterTransform', body, payload);
    WebImporter.rules.adjustImageUrls(body, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    return [{
      element: body,
      path: WebImporter.FileUtils.sanitizePath(rawPath),
      report: { title: document.title, template: 'employer-article', blocks: ['accordion-minimal-light'] },
    }];
  },
};
