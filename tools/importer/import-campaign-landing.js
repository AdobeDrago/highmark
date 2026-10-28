/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
// Every block on the three pages reuses an existing shared parser unchanged; the
// photo/plan cards go through a campaign-landing wrapper that adds the
// /health-options-wv card variants (title rule, centred mobile CTA) around the
// shared cards-minimal-dark-withimg parser, and builds /because-life/south-park-activities'
// small-image activity cards (with their bullet lists) itself.
import heroMinimalDarkWithimgParser from './parsers/hero-minimal-dark-withimg.js';
import cardsMinimalDarkWithimgIconsParser from './parsers/cards-minimal-dark-withimg-icons.js';
import cardsMinimalDarkWithimgParser from './parsers/cards-minimal-dark-withimg-campaign-landing.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';
import cardsMinimalDarkWithimg2Parser from './parsers/cards-minimal-dark-withimg-2.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import campaignLandingCleanupTransformer from './transformers/highmark-campaign-landing-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-minimal-dark-withimg': heroMinimalDarkWithimgParser,
  'cards-minimal-dark-withimg-icons': cardsMinimalDarkWithimgIconsParser,
  'cards-minimal-dark-withimg': cardsMinimalDarkWithimgParser,
  'columns-minimal-dark': columnsMinimalDarkParser,
  'cards-minimal-dark-withimg-2': cardsMinimalDarkWithimg2Parser,
};

// TRANSFORMER REGISTRY — site cleanup, campaign-landing chrome (subsidiary header/footer
// fragments; keeps the /ventures closing CTA band outside <main>), source-path links,
// then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  campaignLandingCleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "campaign-landing",
  "description": "Campaign / brand landing page (Because Life campaign and its South Park activities page, Highmark Health Options West Virginia home, Highmark Ventures): photo hero (secondary-banner or sub-hero), optional navy/polar/blush colour bands, icon feature cards, photo or wide plan cards, photo banner with CTA, white/polar/papergrey image+text side panels, wide help cards and a footnote; the South Park page has a no-image navy secondary banner and a grid of small-image activity cards (photo, title, bullet list, address, DIRECTIONS link)",
  "urls": [
    "https://www.highmark.com/because-life",
    "https://www.highmark.com/health-options-wv",
    "https://www.highmark.com/ventures",
    "https://www.highmark.com/because-life/south-park-activities"
  ],
  "blocks": [
    {
      "name": "hero-minimal-dark-withimg",
      "instances": [
        "div.secondary-banner.responsivegrid.section",
        "div.hero.responsivegrid.section",
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.image)",
        "div.secondary-banner.responsivegrid:has(.secondaryBannerContentContainer.noImage)"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg-icons",
      "instances": [
        "div.card-block.responsivegrid.section:has(.cardWrapper.ghostMode)"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg",
      "instances": [
        "div.card-block.responsivegrid.section:has(.cardBlock):not(:has(.cardWrapper.ghostMode))",
        "div.newcardscomponent-variations:has(li.cardThree.listSmlImg)"
      ]
    },
    {
      "name": "columns-minimal-dark",
      "instances": [
        "div.newcardscomponent-variations.section:has(.side-card-panel)"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg-2",
      "instances": [
        "div.newcardscomponent-variations.section:has(li.listWideImg)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "hero",
      "selector": [
        "div.secondary-banner.responsivegrid.section",
        "div.hero.responsivegrid.section",
        "div.secondary-banner.responsivegrid:has(.secondaryBannerContentContainer.noImage)"
      ],
      "style": null,
      "blocks": [
        "hero-minimal-dark-withimg"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "navy-intro-band",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-togatherblue)"
      ],
      "style": "dark, center",
      "blocks": [],
      "defaultContent": [
        ".one-card-content-center-container h2.d-lg-block",
        ".one-card-content-center-container .body-text.d-lg-block p"
      ]
    },
    {
      "id": "3",
      "name": "icon-feature-cards",
      "selector": [
        "div.card-block.responsivegrid.section:has(.cardWrapper.ghostMode)"
      ],
      "style": "center",
      "blocks": [
        "cards-minimal-dark-withimg-icons"
      ],
      "defaultContent": [
        ".cardBlockTitleContainer h2",
        ".cardBlockTitleContainer .cardDescription p",
        ".cardBlockContent > div > .hmk-brand-buttons a"
      ]
    },
    {
      "id": "4",
      "name": "photo-banner",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.image)"
      ],
      "style": null,
      "blocks": [
        "hero-minimal-dark-withimg"
      ],
      "defaultContent": []
    },
    {
      "id": "5",
      "name": "photo-cards",
      "selector": [
        "div.card-block.responsivegrid.section:has(.cardBlock):not(:has(.cardWrapper.ghostMode))"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-withimg"
      ],
      "defaultContent": [
        ".cardBlockTitleContainer h2",
        ".cardBlockTitleContainer .cardDescription p"
      ]
    },
    {
      "id": "6",
      "name": "find-doctor-polar-band",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-polar)"
      ],
      "style": "light, center",
      "blocks": [],
      "defaultContent": [
        ".one-card-content-center-container img",
        ".one-card-content-center-container h2.d-lg-block",
        ".one-card-content-center-container .body-text.d-lg-block p",
        ".one-card-content-center-container .hmk-brand-buttons a"
      ]
    },
    {
      "id": "7",
      "name": "side-panel-papergrey",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel.new-hmk-brand-papergrey)"
      ],
      "style": "grey",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "8",
      "name": "side-panel-white",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel):not(:has(.new-hmk-brand-polar)):not(:has(.new-hmk-brand-papergrey))"
      ],
      "style": null,
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "9",
      "name": "side-panel-polar",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel.new-hmk-brand-polar)"
      ],
      "style": "light",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "10",
      "name": "help-cards",
      "selector": [
        "div.newcardscomponent-variations.section:has(li.listWideImg)"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-withimg-2"
      ],
      "defaultContent": []
    },
    {
      "id": "11",
      "name": "footnotes",
      "selector": [
        "main section.container-fluid-fullwidth.section:has(.cmp-text)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".cmp-text p"
      ]
    },
    {
      "id": "12",
      "name": "closing-cta-blush-band",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive)"
      ],
      "style": "highlight, center",
      "blocks": [],
      "defaultContent": [
        ".one-card-content-center-container h2.d-lg-block",
        ".one-card-content-center-container .body-text.d-lg-block p",
        ".one-card-content-center-container .hmk-brand-buttons a"
      ]
    },
    {
      "id": "13",
      "name": "small-image-activity-cards",
      "selector": [
        "div.newcardscomponent-variations:has(li.cardThree.listSmlImg)"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-withimg"
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
    // with the source label, and template=campaign-landing (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'campaign-landing';
    // A share image that 404s on the source (/because-life/south-park-activities'
    // south-park-og.jpg) would make og:image "about:error" on preview; drop the row
    // so the page's first image is used. Images that load (the other pages) are kept.
    if (meta.Image) {
      const shareImg = meta.Image.tagName === 'IMG' ? meta.Image : meta.Image.querySelector?.('img');
      const shareSrc = shareImg && shareImg.getAttribute('src');
      if (shareSrc) {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('HEAD', new URL(shareSrc, params.originalURL).href, false);
          xhr.send();
          if (xhr.status === 404) delete meta.Image;
        } catch (e) {
          // network error: keep the source's image
        }
      }
    }
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
