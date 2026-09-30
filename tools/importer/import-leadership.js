/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsMinimalLightSidenavParser from './parsers/cards-minimal-light-sidenav.js';
import cardsMinimalDarkWithimgParser from './parsers/cards-minimal-dark-withimg.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-minimal-light-sidenav': cardsMinimalLightSidenavParser,
  'cards-minimal-dark-withimg': cardsMinimalDarkWithimgParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "leadership",
  "description": "Leadership Team & Board: left section navigation, leader photo card grids (leadership team, market leaders), Board of Directors feature and member name list",
  "urls": [
    "https://www.highmark.com/about/our-story/leadership-team-board"
  ],
  "blocks": [
    {
      "name": "cards-minimal-light-sidenav",
      "instances": [
        "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)",
        "div.d-none.d-lg-block.col-lg-3 div.nav-container"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg",
      "instances": [
        "div.gridcontrol:has(section.hmk-home_cardwrapper)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "sidenav",
      "selector": [
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
      "name": "title",
      "selector": [
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "leaders-and-board",
      "selector": [
        "div.col-lg-9 > div.row > div.col-lg-12"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-withimg",
        "columns-minimal-dark"
      ],
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

    // Global nav / search bar and the breadcrumb + print/share row, on layouts
    // without a <header> element (highmark-cleanup.js removes <header> only).
    WebImporter.DOMUtils.remove(main, [
      '.experiencefragment:has(.main-search-bar)',
      '.experiencefragment:has(.footer-list)',
      'div.breadcrumb',
    ]);

    // Board of Directors feature: an image grid column + a text grid column on the source.
    // Author it as one columns-minimal-dark row [ photo | name + title + bio + Read Bio + LinkedIn ].
    const boardImg = main.querySelector('section.container-fluid-fullwidth img.image-comp-img[src*="/leadership/"]');
    const imgCol = boardImg && boardImg.closest('section.container-fluid-fullwidth.aem-GridColumn');
    const textCol = imgCol && imgCol.nextElementSibling;
    if (imgCol && textCol) {
      const content = [];
      textCol.querySelectorAll('.cmp-text').forEach((ct) => {
        [...ct.children]
          .filter((el) => ['H2', 'H3', 'H4', 'P'].includes(el.tagName) && el.textContent.trim())
          .forEach((el) => content.push(el));
      });
      const linkedin = textCol.querySelector('a[href*="linkedin.com"]');
      if (linkedin) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', linkedin.getAttribute('href'));
        a.textContent = 'LinkedIn';
        p.append(a);
        content.push(p);
      }
      const img = document.createElement('img');
      img.setAttribute('src', boardImg.getAttribute('src'));
      img.setAttribute('alt', boardImg.getAttribute('alt') || '');
      imgCol.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'columns-minimal-dark', cells: [[[img], content]] }));
      textCol.remove();
    }
    // Board member names sit in a layout table; a raw table would become a block in
    // Document Authoring, so author them as one list (styled in two columns).
    main.querySelectorAll('.cmp-text table').forEach((table) => {
      const ul = document.createElement('ul');
      table.querySelectorAll('td p').forEach((p) => {
        const name = p.textContent.split(String.fromCharCode(160)).join(' ').trim();
        if (!name) return;
        const li = document.createElement('li');
        li.textContent = name;
        ul.append(li);
      });
      table.replaceWith(ul);
    });

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

    // 5. Page metadata: source meta tags, breadcrumbs (when the source has them)
    // with the source label, and template=leadership (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'leadership';
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
