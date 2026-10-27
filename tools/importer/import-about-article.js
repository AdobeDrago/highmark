/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsMinimalLightSidenavParser from './parsers/cards-minimal-light-sidenav.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

/**
 * The left nav as the block's rows (see blocks/cards-minimal-light-sidenav): parent,
 * then each item as current or sibling, each followed by its sub-pages as child rows,
 * as tools/sidenav/sync-sidenav.mjs builds them. Since October 2026 the source lists
 * the items next to the parent's item (li.sidenav-item-level1), a link with a submenu
 * in a div.sidenav-item-row; the shared parser reads the older nested shape, so it
 * still handles navs without level-1 items.
 */
function sidenavParser(element, { document, url, params }) {
  const list = element.querySelector('.sidenav-item-list');
  const items = list ? [...list.querySelectorAll(':scope > li.sidenav-item-level1')] : [];
  if (!items.length) {
    cardsMinimalLightSidenavParser(element, { document, url, params });
    return;
  }
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const link = (a) => {
    const el = document.createElement('a');
    el.setAttribute('href', (a.getAttribute('href') || '')
      .replace(/^https:\/\/www\.highmark\.com/, '')
      .replace(/^\/content\/digital-marketing\/en\/highmark\/highmarkdotcom\/home/, '')
      .replace(/\.html$/, '')
      .replace(/(.)\/$/, '$1') || '/');
    el.textContent = clean(a.textContent);
    return el;
  };
  const linkOf = (li) => li.querySelector(':scope > a, :scope > .sidenav-item-row > a');
  const cells = [];
  const parent = list.querySelector('a.side-nav-item-parent');
  if (parent) cells.push(['parent', link(parent)]);
  items.forEach((li) => {
    const a = linkOf(li);
    if (!a) return;
    const active = a.classList.contains('active') || a.getAttribute('aria-current') === 'page';
    cells.push([active ? 'current' : 'sibling', link(a)]);
    [...(li.querySelector(':scope > ul.subnavitem-list')?.children || [])].forEach((c) => {
      const ca = linkOf(c);
      if (ca) cells.push(['child', link(ca)]);
    });
  });
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'cards-minimal-light-sidenav', cells }));
}

// PARSER REGISTRY
const parsers = {
  'cards-minimal-light-sidenav': sidenavParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "about-article",
  "description": "About / Corporate Responsibility article: left section navigation, long-form article (headings, paragraphs, lists, images) and an optional right-rail callout",
  "urls": [
    "https://www.highmark.com/about/our-story",
    "https://www.highmark.com/about/our-story/mission-vision",
    "https://www.highmark.com/about/our-story/our-businesses",
    "https://www.highmark.com/about/corporate-responsibility",
    "https://www.highmark.com/about/corporate-responsibility/valuing-our-people",
    "https://www.highmark.com/about/corporate-responsibility/social-determinants-of-health",
    "https://www.highmark.com/about/corporate-responsibility/sustainability",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/happenings",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/community-health",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/community-economic-resilience",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/community-health-employee-programs",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-bright-blue-futures-community-reports",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/corporate-giving",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-caring-place",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-delaware-blueprints",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/blue-fund",
    "https://www.highmark.com/about/corporate-responsibility/sustainability/what-you-can-do",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-bright-blue-futures-awards",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-neny-giving",
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-wny-giving"
  ],
  "blocks": [
    {
      "name": "cards-minimal-light-sidenav",
      "instances": [
        "div.col-lg-3 div.nav-container:has(.sidenav-item-list)",
        "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)",
        "div.d-none.d-lg-block.col-lg-3 div.nav-container"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "sidenav",
      "selector": [
        "div.col-lg-3 div.nav-container:has(.sidenav-item-list)",
        "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)",
        "div.d-none.d-lg-block.col-lg-3 div.nav-container"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-light-sidenav"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "article",
      "selector": [
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par",
        "div.col-lg-9 div.page__par"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "right-rail",
      "selector": [
        "div.rightRail"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    }
  ]
};

/**
 * Execute all page transformers for a hook.
 */
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

/**
 * Find all block instances on the page. An element already claimed by an earlier
 * block definition is not re-collected by a later, broader selector.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const claimed = new Set();
  template.blocks.forEach((blockDef) => {
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
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // Source breadcrumb label for this page, read before cleanup removes the
    // breadcrumb row; pages without a source breadcrumb don't get one either.
    const crumb = document.querySelector('ol.breadcrumb-list li.active');
    const crumbLabel = (crumb?.textContent || '').replace(/\s+/g, ' ').trim();

    // The source's text buttons (Blue Fund's "Go to ... overview", the rail's SEND EMAIL)
    // become italic links (<p><em><a>, the uppercase text CTA); its filled brand buttons
    // (a.brand-button-normal) stay links alone in their paragraph (the filled button).
    main.querySelectorAll('.hmk-brand-buttons a.textButton').forEach((a) => {
      const em = document.createElement('em');
      em.append(...a.childNodes);
      a.append(em);
    });

    // Global nav / search bar and the breadcrumb + print/share row, on layouts
    // without a <header> element (highmark-cleanup.js removes <header> only).
    WebImporter.DOMUtils.remove(main, [
      '.experiencefragment:has(.main-search-bar)',
      '.experiencefragment:has(.footer-list)',
      'div.breadcrumb',
    ]);

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

    // In-page links without a target on the source (Community & Economic Resilience's
    // #providing / #taking / #power) point at the heading their text starts with, by
    // the id the pipeline gives it. #top scrolls to the top in browsers.
    const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
    const headingId = (t) => clean(t).toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
    main.querySelectorAll('a[href^="#"]:not([href="#"]):not([href="#top"])').forEach((a) => {
      const id = a.getAttribute('href').slice(1);
      if (main.querySelector(`[id="${id}"], a[name="${id}"]`)) return;
      const text = clean(a.textContent).toLowerCase();
      const heading = [...main.querySelectorAll('h2, h3, h4')]
        .find((h) => clean(h.textContent) && text.startsWith(clean(h.textContent).toLowerCase()));
      if (heading) a.setAttribute('href', `#${headingId(heading.textContent)}`);
    });
    // 4. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Page metadata: source meta tags, breadcrumbs (when the source has them)
    // with the source label, and template=about-article (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'about-article';
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
