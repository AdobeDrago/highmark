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
  name: 'member-subpage',
  description: 'Regional member sub-pages (/member/<region>/find-a-dentist, find-a-pharmacy, medical-drug-formulary, surprise-billing, disputes-appeals): breadcrumbs with Print / Share, a left nav of the region\'s pages, an H1 + lead text and text sections with links, a right-rail "Questions?" box and a blush "Questions about your benefits?" CTA band; Delaware\'s Disputes and Appeals has no nav (Template legal); the NY Forms Libraries are a Forms Library block (search panel and categorised forms) beside the H1. The same sections as the FAQ topic pages (transformers/highmark-faq-topic-sections.js, Template faq), with the region\'s header and footer fragments (import-member-chrome.js)',
  urls: [
    'https://www.highmark.com/member/bcbs/find-a-dentist',
    'https://www.highmark.com/member/bcbs/medical-drug-formulary',
    'https://www.highmark.com/member/bcbs/find-a-pharmacy',
    'https://www.highmark.com/member/blueshield/find-a-pharmacy',
    'https://www.highmark.com/member/blueshield/find-a-dentist',
    'https://www.highmark.com/member/blueshield/medical-drug-formulary',
    'https://www.highmark.com/member/bcbswv/find-a-pharmacy',
    'https://www.highmark.com/member/bcbswv/find-a-dentist',
    'https://www.highmark.com/member/bcbswv/medical-drug-formulary',
    'https://www.highmark.com/member/bcbsde/find-a-pharmacy',
    'https://www.highmark.com/member/bcbsde/find-a-dentist',
    'https://www.highmark.com/member/bcbsde/disputes-appeals',
    'https://www.highmark.com/member/bcbsde/medical-drug-formulary',
    'https://www.highmark.com/member/bcbswny/find-a-pharmacy',
    'https://www.highmark.com/member/bcbswny/find-a-dentist',
    'https://www.highmark.com/member/bcbswny/medical-drug-formulary',
    'https://www.highmark.com/member/bcbswny/surprise-billing',
    'https://www.highmark.com/member/blueshieldneny/find-a-pharmacy',
    'https://www.highmark.com/member/blueshieldneny/find-a-dentist',
    'https://www.highmark.com/member/blueshieldneny/medical-drug-formulary',
    'https://www.highmark.com/member/blueshieldneny/surprise-billing',
    'https://www.highmark.com/member/bcbswny/forms',
    'https://www.highmark.com/member/blueshieldneny/forms',
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
    const region = new URL(params.originalURL).pathname.split('/').filter(Boolean)[1];

    // The regional header and footer (they are the region's fragments, import-member-chrome.js)
    WebImporter.DOMUtils.remove(main, [
      '.experiencefragment:has(.main-search-bar)',
      '.experiencefragment:has(.mainnavigation-new)',
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
    // The light-blue band below the article (Find a Pharmacy's "Log in to your member
    // portal", outside the source's <main>): its own section, Style light-blue (the
    // sections transformer turns the marker into Section Metadata, as its own).
    main.querySelectorAll('section.new-hmk-brand-fifteenpercent-splash').forEach((band) => {
      if (!band.textContent.trim()) return;
      const hr = document.createElement('hr');
      hr.setAttribute('data-excat-section-id', 'light-blue');
      band.before(hr);
    });
    // the source's PDF icon (a Material Icons ligature, "picture_as_pdf") -> the :pdf: icon
    main.querySelectorAll('a i[class*="material-icons"]').forEach((i) => {
      if (i.textContent.trim() === 'picture_as_pdf') i.replaceWith(document.createTextNode(':pdf: '));
    });
    // The Forms Library (bcbswny/forms, blueshieldneny/forms): the source's search panel
    // and its categorised list become the H1, the intro and a Forms Library block (one
    // row per category: its heading and description; one per form: its name and links).
    // The block builds the search and the category filter.
    const results = main.querySelector('.pdf-result-container');
    if (results) {
      const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();
      const rows = [];
      results.querySelectorAll('li.category-name').forEach((category) => {
        const h2 = document.createElement('h2');
        h2.textContent = clean(category.querySelector('h2')?.textContent);
        const description = clean(category.querySelector(':scope > p')?.textContent);
        rows.push([h2, description]);
        category.querySelectorAll('li.form-container').forEach((form) => {
          const links = document.createElement('div');
          form.querySelectorAll('.form-link-wrapper a[href]').forEach((source) => {
            const p = document.createElement('p');
            const a = document.createElement('a');
            a.href = new URL(source.getAttribute('href'), params.originalURL).href;
            const pdf = !!source.querySelector('.pdf-icon') || source.textContent.includes(':pdf:');
            a.textContent = pdf ? ':pdf: Download PDF' : clean(source.textContent);
            p.append(a);
            links.append(p);
          });
          rows.push([clean(form.querySelector('.formname')?.textContent), links]);
        });
      });
      const h1 = document.createElement('h1');
      h1.textContent = clean(results.querySelector('h1')?.textContent);
      const intro = document.createElement('p');
      intro.textContent = clean(results.querySelector('.form-intro')?.textContent);
      const block = WebImporter.Blocks.createBlock(document, { name: 'Forms Library', cells: rows });
      results.closest('.row').replaceWith(h1, intro, block);
    }
    // Without a left nav (Disputes and Appeals, the Forms Library) the page is a plain
    // article: Template legal (and member-subpage for its column).
    const navEl = main.querySelector('div.col-lg-3 div.nav-container:has(.sidenav, .sidenav-item-list)');
    const hasNav = !!navEl;
    // The spacers that close the text column (Find a Dentist's 40px, 20px on phones): the
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

    // Surprise Billing's lists have hanging bullets (the source's li.insidebullets; the
    // other pages put the bullet inside the text): Style hanging-bullets on their section.
    const breaks = [...main.querySelectorAll('hr')];
    main.querySelectorAll('ul:has(> li.insidebullets)').forEach((ul) => {
      // eslint-disable-next-line no-bitwise
      const hr = breaks.filter((b) => b.compareDocumentPosition(ul) & 4 /* FOLLOWING */).pop();
      if (!hr) return;
      const style = hr.getAttribute('data-excat-section-id');
      if (!(style || '').includes('hanging-bullets')) {
        hr.setAttribute('data-excat-section-id', style ? `${style}, hanging-bullets` : 'hanging-bullets');
      }
    });

    // 4. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Page metadata: the source meta tags, the faq template (legal without a left nav),
    // breadcrumbs (with the source label; the breadcrumbs block brings Print / Share), and
    // the region's header and footer.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    meta.Template = hasNav ? 'faq, member-subpage' : 'legal, member-subpage';
    meta.nav = `/member/fragments/${region}/nav`;
    meta.footer = `/member/fragments/${region}/footer`;
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
