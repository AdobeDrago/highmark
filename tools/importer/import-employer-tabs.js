/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';

/**
 * Employer tabbed card pages (/employer/client-resources/onboarding-tools, "Thinking
 * outside the doctor's office"; Template: employer-tabs).
 *
 * Source: a full-width polar band (h1 + lead), a tab component (div.newtabnav: a tab
 * button per panel; each panel a cards component, div.newcardscomponent-variations: its
 * title, its lead and its small-image cards, li.listSmlImg, then sometimes a footnote),
 * the full-width blush "Find a plan" band and the page's footnotes. Output sections:
 *   1. Style accent: the h1 and the lead (an H5, the source's p1 style);
 *   2. one per tab panel, Style tab: its title (H2, which is also the tab's label), its
 *      lead (H5), a Cards (small-image) block (image | heading, text, text link) and the
 *      panel's footnote; scripts.js builds the tab bar from these sections;
 *   3. Style highlight: the blush band (H2, the lead as an H5, the note, the outlined
 *      GET STARTED as an italic link);
 *   4. Style footnote: the footnotes.
 * The source's tab labels are its panel titles. A card button without a link on the
 * source (Tools' "LOG IN OR REGISTER") links to the member login, as the footer's
 * Member Login does.
 */

const MEMBER_LOGIN = 'https://iel.member.highmark.com/logout?end_url=https://member.myhighmark.com/sign-in';

const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

function el(document, tag, children) {
  const e = document.createElement(tag);
  if (typeof children === 'string') e.textContent = children;
  else if (children) e.append(...children);
  return e;
}

/** A paragraph's inline content, without the source's spans and inline styles. */
function inline(document, p) {
  const copy = p.cloneNode(true);
  copy.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
  copy.querySelectorAll('span, b').forEach((s) => s.replaceWith(...s.childNodes));
  while (copy.lastChild && copy.lastChild.nodeName === 'BR') copy.lastChild.remove();
  return [...copy.childNodes];
}

/** A text component's paragraphs: the lead style (span.p1 on the whole paragraph) as H5. */
function paragraphs(document, cmp) {
  return [...cmp.querySelectorAll(':scope > p')].filter((p) => clean(p.textContent)).map((p) => {
    const lead = p.querySelector('span.p1');
    const isLead = lead && clean(lead.textContent) === clean(p.textContent);
    return el(document, isLead ? 'h5' : 'p', inline(document, p));
  });
}

function sectionBreak(document, main, style) {
  main.append(document.createElement('hr'));
  if (style) {
    main.append(WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } }));
  }
}

/** The outlined (brand-button-light) or filled (brand-button-normal) buttons as italic or bold links. */
function buttons(document, root) {
  return [...root.querySelectorAll('.hmk-brand-buttons a[href]')].map((a) => {
    const link = el(document, 'a', clean(a.textContent));
    link.href = a.getAttribute('href');
    const wrap = a.matches('.brand-button-normal') ? 'strong' : 'em';
    return el(document, 'p', [el(document, wrap, [link])]);
  });
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const body = document.body;
    cleanupTransformer('beforeTransform', body, payload);

    const crumb = document.querySelector('ol.breadcrumb-list li.active');
    const crumbLabel = clean(crumb?.textContent);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    const main = document.createElement('div');

    // 1. the polar band: h1 and lead
    const h1 = body.querySelector('h1');
    const hero = h1.closest('section.new-hmk-brand-polar');
    main.append(WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style: 'accent' } }));
    main.append(el(document, 'h1', clean(h1.textContent)));
    if (hero) hero.querySelectorAll('.cmp-text').forEach((cmp) => main.append(...paragraphs(document, cmp)));

    // 2. the tab panels
    body.querySelectorAll('.newtabnav .tab-content-container > div').forEach((panel) => {
      sectionBreak(document, main, 'tab');
      const cards = panel.querySelector('.cards-variation');
      const title = cards?.querySelector('.cardsTitle');
      if (title) main.append(el(document, 'h2', clean(title.textContent)));
      cards?.querySelectorAll('.cardsPara').forEach((p) => main.append(el(document, 'h5', inline(document, p))));
      const rows = [...(cards?.querySelectorAll('li.listSmlImg') || [])].map((li) => {
        const src = li.querySelector('img');
        const img = el(document, 'img');
        img.src = src.getAttribute('src');
        img.alt = src.getAttribute('alt') || '';
        const content = [];
        const h3 = li.querySelector('h3');
        if (h3) content.push(el(document, 'h3', clean(h3.textContent)));
        const text = li.querySelector('.cardsText');
        if (text) content.push(el(document, 'p', inline(document, text)));
        li.querySelectorAll('.hmk-brand-buttons a').forEach((a) => {
          // the button's text, without the card title the source appends for screen readers
          const label = clean([...a.childNodes].filter((n) => !(n.nodeType === 1 && n.matches('.sr-only, .screen-reader-only, .hmk-visually-hidden'))).map((n) => n.textContent).join(' '))
            .replace(new RegExp(`,\\s*${clean(h3?.textContent).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '');
          const link = el(document, 'a', label);
          link.href = a.getAttribute('href') || MEMBER_LOGIN;
          content.push(el(document, 'p', [link]));
        });
        return [img, content];
      });
      if (rows.length) main.append(WebImporter.Blocks.createBlock(document, { name: 'Cards (small-image)', cells: rows }));
      // the panel's footnote, after its cards
      panel.querySelectorAll('.cmp-text').forEach((cmp) => {
        if (!cmp.closest('.cards-variation')) main.append(...paragraphs(document, cmp));
      });
    });

    // 3. the blush band
    const blush = body.querySelector('section.new-hmk-brand-blush-twnetyfive');
    if (blush) {
      sectionBreak(document, main, 'highlight');
      const h2 = blush.querySelector('h2');
      if (h2) main.append(el(document, 'h2', clean(h2.textContent)));
      blush.querySelectorAll('.cmp-text').forEach((cmp) => {
        if (!cmp.querySelector('h2')) main.append(...paragraphs(document, cmp));
      });
      main.append(...buttons(document, blush));
    }

    // 4. the footnotes: text after the blush band
    const notes = [...body.querySelectorAll('.cmp-text')].filter((cmp) => blush
      && (blush.compareDocumentPosition(cmp) & 4 /* FOLLOWING */) && !blush.contains(cmp)
      && !cmp.closest('.global-footer, .experiencefragment, footer'));
    if (notes.length) {
      sectionBreak(document, main, 'footnote');
      notes.forEach((cmp) => main.append(...paragraphs(document, cmp)));
    }

    // metadata
    sectionBreak(document, main);
    meta.Template = 'employer-tabs';
    meta.breadcrumbs = 'true';
    if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    body.replaceChildren(...main.childNodes);
    cleanupTransformer('afterTransform', body, payload);
    WebImporter.rules.adjustImageUrls(body, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    return [{
      element: body,
      path: WebImporter.FileUtils.sanitizePath(rawPath),
      report: { title: document.title, template: 'employer-tabs', blocks: ['cards'] },
    }];
  },
};
