/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsMinimalLightSidenavParser from './parsers/cards-minimal-light-sidenav.js';
import accordionMinimalLightParser from './parsers/accordion-minimal-light.js';
import tableMinimalDarkCompareParser from './parsers/table-minimal-dark-compare.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer, { spacerHeights, spaceStyle } from './transformers/highmark-faq-topic-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-minimal-light-sidenav': cardsMinimalLightSidenavParser,
  'accordion-minimal-light': accordionMinimalLightParser,
  'table-minimal-dark-compare': tableMinimalDarkCompareParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'employer-plan',
  description: 'Employer plan pages (/employer/solutions/{small,large}-business/<region>/medical-plans/<plan>, and Western PA\'s balanced-funding and pharmacy): breadcrumbs with Print / Share, the region\'s plans as a left nav, the article (headings, text, images, buttons) and a grey "Get more info" right rail. The same sections as the FAQ topic pages (transformers/highmark-faq-topic-sections.js, Template faq, employer-plan).',
  urls: [
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/choice-blue',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/epo-blue-easy',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/lehigh-valley-flex-blue',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/performance-blue',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/performance-blue-flex',
    'https://www.highmark.com/employer/solutions/large-business/de/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/de/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/neny/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/neny/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/epo-blue-easy',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/lehigh-valley-flex-blue',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/performance-blue',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/performance-blue-flex',
    'https://www.highmark.com/employer/solutions/large-business/sepa/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/sepa/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/sepa/medical-plans/epo-blue',
    'https://www.highmark.com/employer/solutions/large-business/wny/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/wny/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/epo-blue-easy',
    'https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/performance-blue',
    'https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/performance-blue-flex',
    'https://www.highmark.com/employer/solutions/large-business/wv/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/wv/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/small-business/cpa/medical-plans/choice-blue',
    'https://www.highmark.com/employer/solutions/small-business/cpa/medical-plans/lehigh-valley-flex-blue',
    'https://www.highmark.com/employer/solutions/small-business/nepa/medical-plans/lehigh-valley-flex-blue',
    'https://www.highmark.com/employer/solutions/small-business/wpa/medical-plans/together-blue',
    'https://www.highmark.com/employer/solutions/large-business/wpa/balanced-funding',
    'https://www.highmark.com/employer/solutions/large-business/wpa/pharmacy',
    'https://www.highmark.com/employer/solutions/small-business/wpa/balanced-funding',
    'https://www.highmark.com/employer/solutions/small-business/wpa/pharmacy',
  ],
  blocks: [
    { name: 'cards-minimal-light-sidenav', instances: ['div.col-lg-3 div.nav-container:has(.sidenav, .sidenav-item-list)'] },
    { name: 'accordion-minimal-light', instances: ['div.accordianTable'] },
    // source div.comparisontable, rebuilt as a plain table by the sections transformer
    { name: 'table-minimal-dark-compare', instances: ['div.faq-compare-table'] },
    { name: 'section-right-rail', instances: ['.rightrail-container'], section: 'right-rail' },
    { name: 'section-cta-highlight', instances: ['div.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive'], section: 'highlight' },
  ],
};

/** Execute all page transformers for a hook. */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/** Find all block instances on the page. */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const claimed = new Set();

  template.blocks.forEach((blockDef) => {
    if (blockDef.name.startsWith('section-')) return;
    blockDef.instances.forEach((selector) => {
      let elements;
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for ${blockDef.name}: ${selector}`, e);
        return;
      }
      elements.forEach((element) => {
        if (claimed.has(element)) return;
        claimed.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  /**
   * Non-breaking spaces in text ("(ACA)&nbsp;FAQ") keep the source's line breaks,
   * but the importer drops them: it copies the page before the transform, and the
   * Markdown round trip turns any left (and &nbsp; entities) into plain spaces. So,
   * on the live page, each becomes U+E000, a private-use character no step treats as
   * whitespace, and upload-to-da.mjs turns it back into &nbsp;. Other text that is
   * only spaces is left alone.
   *
   * In the answers the source spaces blocks with empty paragraphs (<p>&nbsp;</p>),
   * one line high, and only some blocks have one (a paragraph is followed by its
   * list without a gap). They're kept as a paragraph holding a zero-width space
   * (the pipeline drops a paragraph holding only &nbsp; as blank); faq.css gives
   * answer paragraphs no margins.
   */
  onLoad: ({ document }) => {
    // an image the source fails to load (CopayGo's last icon) shows nothing there
    document.querySelectorAll('main img, #main-content img').forEach((img) => {
      if (img.complete && !img.naturalWidth && img.getAttribute('src')) img.setAttribute('data-broken', '');
    });
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
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;
    // The employer header and footer (the site's own header and footer are used)
    WebImporter.DOMUtils.remove(main, [
      '.newheaderbar', '.newmainnavigation', '.empmobilenav',
      '.experiencefragment:has(.global-footer)',
      '.conf-extra-links-container',
      '.wrapper-header-container',
      '.global-footer',
      '.iedetect',
    ]);
    // A link whose text sits inside the source's external-link span (Surprise Billing: <a>
    // <span.global-clr_externallink><b>FAIR HEALTH CONSUMER</b></span></a>): the text goes
    // before the span, which the sections transformer replaces with the :external-link: icon.
    main.querySelectorAll('a .global-clr_externallink').forEach((span) => {
      span.before(...[...span.childNodes].filter((n) => !(n.nodeType === 1 && n.matches('i, em'))));
    });
    // The source's lead text (span.p1, a whole paragraph: the formulary pages' plan-type
    // lines) -> an H5, which is how the other lead lines here are authored; the sections
    // transformer would make it an all-bold paragraph, and on these pages those are
    // plain bold labels ("Emergency services").
    main.querySelectorAll('p span.p1').forEach((span) => {
      const p = span.closest('p');
      if (p.textContent.trim() !== span.textContent.trim()) return;
      const h5 = document.createElement('h5');
      h5.append(...span.childNodes);
      p.replaceWith(h5);
    });
    // a line break at the end of a bold ("WATCH VIDEO", then "See disclaimer below¹"):
    // after it, as Markdown drops it there
    main.querySelectorAll('p b > br:last-child, p strong > br:last-child').forEach((br) => br.parentElement.after(br));
    // the source's PDF icon (a Material Icons ligature, "picture_as_pdf") -> the :pdf: icon
    main.querySelectorAll('a i[class*="material-icons"]').forEach((i) => {
      if (i.textContent.trim() === 'picture_as_pdf') i.replaceWith(document.createTextNode(':pdf: '));
    });
    // The source's buttons: a filled one (brand-button-normal) is a bold link, an outlined
    // one (brand-button-light) an italic link, and a text button (textButton, "WATCH
    // VIDEO") a plain link alone in its paragraph; employer-plan.css styles them. A
    // "get started" button without a link on the source (Choice Blue: an <a type=submit>
    // that goes nowhere) links where the page's other "get started" links go.
    main.querySelectorAll('.hmk-brand-buttons a').forEach((a) => {
      const text = a.textContent.replace(/\s+/g, ' ').trim();
      const href = a.getAttribute('href') || (/^get started$/i.test(text) ? '/employer/get-started' : '');
      if (!href) return;
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = href;
      link.textContent = text;
      if (a.matches('.brand-button-normal, .brand-button-light')) {
        const wrap = document.createElement(a.matches('.brand-button-normal') ? 'strong' : 'em');
        wrap.append(link);
        p.append(wrap);
      } else p.append(link);
      (a.closest('.hmk-brand-buttons') || a).replaceWith(p);
    });
    // A video's image links to the video; the WATCH VIDEO link under it does too.
    main.querySelectorAll('.image a:has(img)').forEach((a) => a.replaceWith(...a.childNodes));

    const gridClass = (el, kind) => Number((el.className.match(new RegExp(`aem-GridColumn--${kind}--(\\d+)`)) || [])[1]);
    const innerGrid = (c) => c.matches('section.container-fluid-fullwidth')
      && c.querySelector(':scope > .parent-width > section > .aem-Grid');
    const gridSpan = (grid) => Number((grid.className.match(/aem-Grid--(\d+)(?:\s|$)/) || [])[1]);
    const leadSpacers = (grid) => { const r = []; for (const k of grid.children) { if (!k.matches('.spacing')) break; r.push(k); } return r; };
    const height = (spacers) => spacers.map(spacerHeights).reduce((a, h) => a + h[0], 0);
    // An image column beside a text column (two containers, their grids N and 12 - N wide;
    // the image one may have failed to load): [image grid, text grid], or null.
    const pairOf = (a, b) => {
      const ga = a && innerGrid(a);
      const gb = b && innerGrid(b);
      if (!ga || !gb || !ga.querySelector('.image') || gb.querySelector('.image')) return null;
      return gridSpan(ga) + gridSpan(gb) === 12 ? [ga, gb] : null;
    };
    // A row: the icon (or none) and its text, with the spacers at the top of each column.
    const rowCells = ([icon, text]) => {
      const iconTop = height(leadSpacers(icon));
      const textTop = height(leadSpacers(text));
      text.querySelectorAll('.gridcontrol').forEach((gc) => {
        const ul = document.createElement('ul');
        gc.querySelectorAll('li').forEach((li) => ul.append(li));
        gc.replaceWith(ul);
      });
      text.querySelectorAll('.spacing').forEach((s) => s.remove());
      const img = icon.querySelector('img:not([data-broken])');
      const content = [...text.querySelectorAll('h3, h5, p, ul')].filter((e) => !e.parentElement.closest('ul'));
      return { cells: img ? [img, content] : [content], span: gridSpan(icon), iconTop, textTop };
    };
    const rowsBlock = (rows) => {
      const { span, iconTop, textTop } = rows[0];
      const options = ['icon-rows', `icon-${span}`, iconTop ? `icon-top-${iconTop}` : '', textTop ? `text-top-${textTop}` : ''].filter(Boolean);
      return WebImporter.Blocks.createBlock(document, { name: `Columns (${options.join(', ')})`, cells: rows.map((r) => r.cells) });
    };
    // Icon rows: CopayGo's (each row a container of an icon column and a text column,
    // spaced by spacing components) are one Columns (icon-rows, icon-2, text-top-20)
    // block, a row each; Balanced Funding's formula box is one such pair, in the band.
    // A row's two side-by-side lists (gridcontrol) are one list, set in two columns.
    main.querySelectorAll('.aem-Grid').forEach((grid) => {
      const kids = [...grid.children];
      // (a row's grid is just the two columns; a band with spacers around a pair isn't one)
      const rowEls = kids.filter((c) => {
        const g = innerGrid(c);
        const parts = g ? [...g.children] : [];
        return parts.length === 2 && pairOf(parts[0], parts[1]);
      });
      if (rowEls.length) {
        const rows = rowEls.map((c) => {
          const parts = [...innerGrid(c).children];
          return rowCells(pairOf(parts[0], parts[1]));
        });
        rowEls[0].before(rowsBlock(rows));
        // the rows and the spacers between them go
        kids.slice(kids.indexOf(rowEls[0]), kids.indexOf(rowEls[rowEls.length - 1]) + 1)
          .forEach((k) => (rowEls.includes(k) || k.matches('.spacing')) && k.remove());
        return;
      }
      for (let i = 0; i < kids.length - 1; i += 1) {
        const pair = pairOf(kids[i], kids[i + 1]);
        if (pair) {
          kids[i].before(rowsBlock([rowCells(pair)]));
          kids[i].remove();
          kids[i + 1].remove();
          i += 1;
        }
      }
    });
    // The source's other images (an image component: a span of its 12-column grid,
    // offset or not) -> an Image block, Image (span-8, offset-2).
    main.querySelectorAll('.image').forEach((cmp) => {
      const img = cmp.querySelector('img:not([data-broken])');
      if (!img) { cmp.remove(); return; }
      const span = gridClass(cmp, 'default');
      const offset = gridClass(cmp, 'offset--default');
      const options = [span && span < 12 ? `span-${span}` : '', offset ? `offset-${offset}` : ''].filter(Boolean);
      const name = options.length ? `Image (${options.join(', ')})` : 'Image';
      // in place: the component stays, so a spacer before it still makes its break
      cmp.replaceChildren(WebImporter.Blocks.createBlock(document, { name, cells: [[img]] }));
      cmp.classList.remove('image');
    });
    // A polar band (the closing "Get started" band, Balanced Funding's formula box): its
    // own section, Style accent, with the shares of the column its heading and its text
    // take (span-10 / text-span-8: their grid spans; span-phone-8, text-span-phone-8) and
    // its own leading and trailing spacers as its padding (band-top-* / band-bottom-*).
    // Those spacers are taken out, so the sections transformer doesn't add them to its
    // neighbours'; the band starts with its own section break (inside it, after the break
    // the transformer puts before it) and is followed by a plain one.
    main.querySelectorAll('section.new-hmk-brand-polar').forEach((band) => {
      if (!band.textContent.trim()) return;
      const cmpOf = (el) => el?.closest('.cmp-text, .text, [class*="aem-GridColumn"]');
      const heading = cmpOf(band.querySelector('h2'));
      const copy = cmpOf(band.querySelector('p span.p1, h5, p'));
      const grid = heading?.parentElement || band.querySelector('.aem-Grid');
      const styles = ['accent'];
      [['span', heading], ['text-span', copy]].forEach(([name, cmp]) => {
        if (!cmp) return;
        const span = gridClass(cmp, 'default') || 12;
        const phone = gridClass(cmp, 'phone') || span;
        if (span < 12) styles.push(`${name}-${span}`);
        if (phone !== span) styles.push(`${name}-phone-${phone}`);
      });
      if (grid) {
        const kids = [...grid.children];
        const run = (list) => { const r = []; for (const k of list) { if (!k.matches('.spacing')) break; r.push(k); } return r; };
        [['top', run(kids)], ['bottom', run([...kids].reverse())]].forEach(([side, spacers]) => {
          if (!spacers.length || spacers.length === kids.length) return;
          const [d, t, m] = spacers.map(spacerHeights).reduce((a, h) => a.map((v, k) => v + h[k]), [0, 0, 0]);
          styles.push(`band-${side}-${d}`);
          if (t !== d) styles.push(`band-${side}-tablet-${t}`);
          if (m !== t) styles.push(`band-${side}-mobile-${m}`);
          spacers.forEach((sp) => sp.remove());
        });
      }
      const start = document.createElement('hr');
      start.setAttribute('data-excat-section-id', styles.join(', '));
      start.setAttribute('data-band-start', '');
      band.setAttribute('data-band', '');
      band.prepend(start);
      band.after(document.createElement('hr'));
    });
    // Without a left nav the page is a plain article: Template legal (and employer-plan).
    const navEl = main.querySelector('div.col-lg-3 div.nav-container:has(.sidenav, .sidenav-item-list)');
    const hasNav = !!navEl;
    // The spacers that close the text column: the
    // sections transformer keeps spacers only ahead of content, so they become an empty
    // section with their space-* style, between the text and the "Questions?" box / band.
    const h1 = main.querySelector('h1');
    if (h1 && hasNav) {
      let column = h1;
      while (column.parentElement && column.parentElement !== main
        && !column.parentElement.contains(navEl)) column = column.parentElement;
      const leaves = [...column.querySelectorAll('.aem-GridColumn')].filter((el) => !el.querySelector('.aem-GridColumn')
        && !el.closest('.rightrail-container, .rightRail, div.one-card-one-col-panel') && !el.querySelector('.rightrail-container, div.one-card-one-col-panel'));
      const lastContent = leaves.findLastIndex((el) => !el.matches('.spacing'));
      const trailing = leaves.slice(lastContent + 1).map(spacerHeights)
        .reduce((sum, h) => sum.map((v, j) => v + h[j]), [0, 0, 0]);
      if (lastContent >= 0 && trailing.some(Boolean)) {
        const hr = document.createElement('hr');
        hr.setAttribute('data-excat-section-id', spaceStyle(trailing));
        leaves[lastContent].after(hr);
      }
    }

    // Source breadcrumb label for this page ("ACA", "WNY Blue Fund"), read before
    // cleanup removes the breadcrumb row.
    const crumb = document.querySelector('ol.breadcrumb-list li.active');
    const crumbLabel = (crumb?.textContent || '').replace(/\s+/g, ' ').trim();

    // 1. beforeTransform (cleanup + section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by a prior parser.
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // A band's own break goes after the sections transformer's break for the spacers
    // before it (inside the band, ahead of its first content), when nothing is between:
    // that space stays outside the band's colour.
    main.querySelectorAll('hr[data-band-start]').forEach((start) => {
      start.removeAttribute('data-band-start');
      // eslint-disable-next-line no-bitwise
      const next = [...main.querySelectorAll('hr')].find((h) => start.compareDocumentPosition(h) & 4 /* FOLLOWING */);
      if (!next || !next.hasAttribute('data-excat-section-id')) return;
      const between = document.createRange();
      between.setStartAfter(start);
      between.setEndBefore(next);
      const gap = between.cloneContents();
      if (gap.textContent.trim() || gap.querySelector('img, picture, table')) return;
      next.after(start);
    });
    // The transformer's breaks inside a band (for the band's own middle spacers) keep
    // its colour and width; its bottom padding goes to its last part.
    main.querySelectorAll('[data-band]').forEach((band) => {
      band.removeAttribute('data-band');
      const parts = [...band.querySelectorAll('hr[data-excat-section-id]')];
      const start = parts.find((h) => h.getAttribute('data-excat-section-id').startsWith('accent'));
      const inner = parts.slice(parts.indexOf(start) + 1);
      if (!start || !inner.length) return;
      const own = start.getAttribute('data-excat-section-id').split(', ');
      const keep = own.filter((t) => t === 'accent' || /^(text-)?span-/.test(t));
      const bottom = own.filter((t) => t.startsWith('band-bottom'));
      start.setAttribute('data-excat-section-id', own.filter((t) => !bottom.includes(t)).join(', '));
      inner.forEach((hr, i) => {
        const add = [...keep, ...(i === inner.length - 1 ? bottom : [])];
        hr.setAttribute('data-excat-section-id', `${hr.getAttribute('data-excat-section-id')}, ${add.join(', ')}`);
      });
    });

    // 4. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Page metadata: the source meta tags, the faq template with employer-plan (legal
    // without a left nav) and breadcrumbs (with the source label; the breadcrumbs block
    // brings Print / Share).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    meta.Template = hasNav ? 'faq, employer-plan' : 'legal, employer-plan';
    meta.breadcrumbs = 'true';
    if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
