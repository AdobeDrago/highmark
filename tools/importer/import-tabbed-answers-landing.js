/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalLightParser from './parsers/hero-minimal-light.js';
import cardsMinimalDarkIconnavParser from './parsers/cards-minimal-dark-iconnav.js';
import accordionMinimalLightParser from './parsers/accordion-minimal-light.js';
import cardsMinimalDarkListParser from './parsers/cards-minimal-dark-list.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';
import tableMinimalDarkCompareParser from './parsers/table-minimal-dark-compare.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-answers-sections.js';

// PARSER REGISTRY — section-* entries are styled by the sections transformer.
const parsers = {
  'table-minimal-dark-compare': tableMinimalDarkCompareParser,
  'hero-minimal-light': heroMinimalLightParser,
  'cards-minimal-dark-iconnav': cardsMinimalDarkIconnavParser,
  'accordion-minimal-light': accordionMinimalLightParser,
  'cards-minimal-dark-list': cardsMinimalDarkListParser,
  'columns-minimal-dark': columnsMinimalDarkParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'tabbed-answers-landing',
  description: 'Landing page with hero banner, an icon tab/quick-nav bar, an FAQ accordion section, a three-up card grid, and alternating image/text promo and resource sections',
  urls: [
    'https://www.highmark.com/resources/answers',
    'https://www.highmark.com/resources/answers/health-insurance-glossary',
    'https://www.highmark.com/resources/spending-accounts/commuter-benefits-account',
    'https://www.highmark.com/resources/spending-accounts/flexible-spending-account-fsa',
    'https://www.highmark.com/resources/spending-accounts/health-saving-account-hsa',
    'https://www.highmark.com/resources/spending-accounts/health-reimbursement-arrangement-hra',
  ],
  blocks: [
    // spending-accounts data tables (FSA limits, commuter limits, HSA limits / savings): without
    // a block the raw <table> became a block named after its first header cell in DA
    { name: 'table-minimal-dark-compare', instances: ['.dynamic-table-container'] },
    { name: 'hero-minimal-light', instances: ['section.new-hmk-brand-fifteenpercent-splash'] },
    { name: 'cards-minimal-dark-iconnav', instances: ['div.quicklinks.section', '.quick-link-list-container.bg-blue'] },
    { name: 'accordion-minimal-light', instances: ['div.col-lg-9 div.accordianTable', '.accordianTable'] },
    { name: 'cards-minimal-dark-list', instances: ['.newcardscomponent-variations:has(.cards-variation) .cards-variation'] },
    {
      name: 'columns-minimal-dark',
      instances: ['.side-card-panel.new-hmk-brand-blush-twnetyfive', '.newcardscomponent-variations:last-of-type .side-card-panel'],
    },
    { name: 'section-glossary-highlight', instances: ['.one-card-one-col-panel.new-hmk-brand-darkblue'], section: 'highlight' },
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

/** Find all block instances on the page. Skips section-* markers. */
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
        // Skip an element already contained by (or containing) a claimed one to
        // avoid a broad fallback selector double-claiming a nested block.
        for (const c of claimed) {
          if (c.contains(element) || element.contains(c)) return;
        }
        claimed.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // Source breadcrumb label for this page, read before cleanup removes the
    // breadcrumb row; pages without a source breadcrumb don't get one either.
    const crumb = document.querySelector('ol.breadcrumb-list li.active');
    const crumbLabel = (crumb?.textContent || '').replace(/\s+/g, ' ').trim();
    // The answers landing (/resources/answers: quick-link bar + FAQ accordion) has its
    // own template stylesheet (styles/templates/answers-landing.css).
    const isLanding = !!(document.querySelector('.quick-link-list-container') && document.querySelector('.accordianTable'));

    // Navy glossary intercept (.one-card-one-col-panel.image.new-hmk-brand-darkblue):
    // three art-directed renditions (desktop >= 992, tablet >= 768, mobile) with the
    // heading, copy and CTA -> hero-minimal-dark-withimg (intercept).
    main.querySelectorAll('.one-card-one-col-panel.image.new-hmk-brand-darkblue').forEach((panel) => {
      const picture = panel.querySelector('picture');
      const mobile = picture?.querySelector('img');
      if (!mobile) return;
      const srcFor = (media) => picture.querySelector(`source[media*="${media}"]`)?.getAttribute('srcset')?.split(/[\s,]/)[0];
      const image = (src) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = mobile.getAttribute('alt') || '';
        return img;
      };
      const imgs = [srcFor('992') || mobile.getAttribute('src'), srcFor('768') || mobile.getAttribute('src'), mobile.getAttribute('src')].map(image);
      const pick = (sel) => panel.querySelector(`${sel}.d-lg-block`) || panel.querySelector(sel);
      const text = (el, tag) => {
        if (!el) return null;
        const out = document.createElement(tag);
        out.textContent = el.textContent.replace(/\s+/g, ' ').trim();
        return out;
      };
      const heading = text(pick('h2'), 'h2');
      const copy = text(pick('.body-text')?.querySelector('p') || pick('.body-text'), 'p');
      const ctas = [...panel.querySelectorAll('.buttonGroup a[href]')].map((a) => {
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
        return link;
      });
      const block = WebImporter.Blocks.createBlock(document, {
        name: 'hero-minimal-dark-withimg (intercept)',
        cells: [[imgs], [[heading, copy, ...ctas].filter(Boolean)]],
      });
      // its own section (the section transformer's selector no longer matches)
      panel.replaceWith(document.createElement('hr'), block);
    });

    // Screen-reader-only "opens a new tab or window" notes inside links are not copy.
    main.querySelectorAll('a .sr-only, a .visually-hidden, a [class*="screen-reader"]').forEach((el) => el.remove());
    main.querySelectorAll('a em, a span').forEach((el) => {
      if (/^opens (in )?a new (tab|window)( or (tab|window))?\.?$/i.test(el.textContent.trim())) el.remove();
    });

    // Data tables on these pages (FSA / commuter / HSA limits) are the table block's
    // "data" variant, not the HSA/HRA/FSA comparison look.
    main.querySelectorAll('.dynamic-table-container').forEach((el) => el.setAttribute('data-block-variant', 'data'));

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

    // 4. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    // Page metadata: source meta tags, breadcrumbs (with the source label) when the
    // source has them, and the landing's template.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    if (isLanding) meta.Template = 'answers-landing';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (map root URL to /index to avoid empty-path crash)
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
