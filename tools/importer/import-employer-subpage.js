/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';
import cardsMinimalDarkWithimgIconsParser from './parsers/cards-minimal-dark-withimg-icons.js';
import cardsMinimalDarkIconnavParser from './parsers/cards-minimal-dark-iconnav.js';
import cardsMinimalDarkWithimgParser from './parsers/cards-minimal-dark-withimg.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-minimal-dark': columnsMinimalDarkParser,
  'cards-minimal-dark-withimg-icons': cardsMinimalDarkWithimgIconsParser,
  'cards-minimal-dark-iconnav': cardsMinimalDarkIconnavParser,
  'cards-minimal-dark-withimg': cardsMinimalDarkWithimgParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "employer-subpage",
  "description": "Employer sub-landing pages: dark/light centered intro, variable repeated photo/text side panels, icon or photo card grids, quicklinks bar, blush callout/closing CTA, footnotes",
  "urls": [
    "https://www.highmark.com/employer/cost-management",
    "https://www.highmark.com/employer/care-management",
    "https://www.highmark.com/employer/client-resources",
    "https://www.highmark.com/employer/solutions",
    "https://www.highmark.com/employer/thought-leadership"
  ],
  "blocks": [
    {
      "name": "columns-minimal-dark",
      "instances": [
        "div.newcardscomponent-variations.section:has(.side-card-panel)"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg-icons",
      "instances": [
        "div.newcardscomponent-variations.section:has(.cards-variation li.listSmlImg):not(:has(li.cardThree))"
      ]
    },
    {
      "name": "cards-minimal-dark-iconnav",
      "instances": [
        "div.quicklinks.section"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg",
      "instances": [
        "div.newcardscomponent-variations.section:has(.cards-variation li.cardThree)"
      ]
    }
  ],
  "sections": [
    {
      "id": "intro-navy",
      "name": "Intro (navy)",
      "selector": [
        "section.container-fluid-fullwidth.section:has(.new-hmk-brand-togatherblue):has(h1)"
      ],
      "style": "dark, center",
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "intro-light",
      "name": "Intro (polar)",
      "selector": [
        "section.container-fluid-fullwidth.section:has(.new-hmk-brand-polar):has(h1)"
      ],
      "style": "light, center",
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "side-panel-white",
      "name": "Side panel (white)",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel):not(:has(.side-card-panel.new-hmk-brand-polar)):not(:has(.side-card-panel.global-helionlightblue))"
      ],
      "style": null,
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": [],
      "repeat": true
    },
    {
      "id": "side-panel-light",
      "name": "Side panel (polar band)",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel.new-hmk-brand-polar)",
        "div.newcardscomponent-variations.section:has(.side-card-panel.global-helionlightblue)"
      ],
      "style": "light",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": [],
      "repeat": true
    },
    {
      "id": "icon-cards",
      "name": "Icon cards",
      "selector": [
        "div.newcardscomponent-variations.section:has(.cards-variation li.listSmlImg):not(:has(li.cardThree))"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-withimg-icons"
      ],
      "defaultContent": []
    },
    {
      "id": "quicklinks",
      "name": "Quicklinks bar",
      "selector": [
        "div.quicklinks.section"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-iconnav"
      ],
      "defaultContent": []
    },
    {
      "id": "article-cards",
      "name": "Latest articles",
      "selector": [
        "div.newcardscomponent-variations.section:has(.cards-variation li.cardThree)"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-withimg"
      ],
      "defaultContent": []
    },
    {
      "id": "callout-blush",
      "name": "Blush callout",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive)"
      ],
      "style": "highlight, center",
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "closing-cta",
      "name": "Closing CTA",
      "selector": [
        "section.container-fluid-fullwidth.section:has(.new-hmk-brand-blush-twnetyfive)"
      ],
      "style": "highlight, center",
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "footnotes",
      "name": "Footnotes",
      "selector": [
        "section.container-fluid-fullwidth.section:has(> .container):not(:has(h1, h2, [class*=\"new-hmk-brand\"]))"
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
  /**
   * Card grids whose cards have the accent rule under their title (hr.breakLine, the
   * News You Can Use and Whole Person Health landings) are marked data-card-rule on the
   * live page, as the import drops <hr>s; the cards-minimal-dark-withimg parser makes
   * them its (rule) variant.
   */
  onLoad: ({ document }) => {
    document.querySelectorAll('li hr.breakLine').forEach((hr) => {
      hr.closest('.newcardscomponent-variations')?.setAttribute('data-card-rule', '');
    });
  },

  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // Source breadcrumb label for this page, read before cleanup removes the
    // breadcrumb row; pages without a source breadcrumb don't get one either.
    const crumb = document.querySelector('ol.breadcrumb-list li.active');
    // the trail's first crumb: highmark.com's employer pages start at Home = /employer, so
    // the page gets Breadcrumb Home /employer (the trail then has no Employer crumb)
    const crumbHome = (document.querySelector('ol.breadcrumb-list li:first-child a')?.getAttribute('href') || '')
      .replace(/^https:\/\/www\.highmark\.com/, '').replace(/\/$/, '');
    const crumbLabel = (crumb?.textContent || '').replace(/\s+/g, ' ').trim();

    // Global nav / search bar and the breadcrumb + print/share row, on layouts
    // without a <header> element (highmark-cleanup.js removes <header> only).
    WebImporter.DOMUtils.remove(main, [
      '.experiencefragment:has(.main-search-bar)',
      '.experiencefragment:has(.footer-list)',
      'div.breadcrumb',
    ]);

    // Business-size cards (solutions) are ZIP-gated href="#" links on the source; use the regional pages.
    [['small-group-plans-link', '/employer/solutions/small-business'],
      ['large-group-plans-link', '/employer/solutions/large-business'],
      ['national-group-plans-link', '/employer/solutions/national-business']].forEach(([id, href]) => {
      main.querySelectorAll(`a#${id}[href="#"]`).forEach((a) => a.setAttribute('href', href));
    });
    // Quick links use <img> icons (thought-leadership), not material-icons ligatures.
    main.querySelectorAll('div.quicklinks.section').forEach((el) => {
      if (!el.querySelector('i[class*="material-icons"]')) el.setAttribute('data-iconnav-image-icons', '');
    });
    WebImporter.DOMUtils.remove(main, ['div.spacing.section']);
    // the source's screen-reader text in links ("READ ARTICLE<span>, Scaling
    // "Remarkable"</span>", since October 2026) would become visible link text
    main.querySelectorAll('a .hmk-visually-hidden').forEach((span) => span.remove());

    // The intro band's copy and bottom spacer, where they differ from the CSS defaults
    // (copy 6/12 from 992, 8/12 on tablets in a polar band; 40px under it): Section
    // Metadata intro-span-<n>, intro-tablet-span-<n> and intro-bottom-<px> (the News
    // You Can Use and Whole Person Health landings: 8/12, 10/12, 60px).
    const introStyles = [];
    const introH1 = main.querySelector('h1');
    const introGrid = introH1?.closest('.aem-Grid');
    if (introGrid) {
      const copy = [...introGrid.children].find((c) => c.matches('.cmp-text') && !c.querySelector('h1') && c.querySelector('p'));
      const span = (kind) => Number((copy?.className.match(new RegExp(`aem-GridColumn--${kind}--(\\d+)`)) || [])[1]);
      if (span('default') && span('default') !== 6) introStyles.push(`intro-span-${span('default')}`);
      if (span('tablet') && span('tablet') !== 8) introStyles.push(`intro-tablet-span-${span('tablet')}`);
      const last = [...introGrid.children].pop();
      const size = (last?.querySelector('section')?.className.match(/(?:^|\s)(ten|twenty|thirty|forty)-padding/) || [])[1];
      const px = { ten: 20, twenty: 40, thirty: 60, forty: 80 }[size];
      if (last?.matches('.spacing') && px && px !== 40) introStyles.push(`intro-bottom-${px}`);
    }

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
    // the intro's options, on its section's style
    if (introStyles.length) {
      const sm = [...main.querySelectorAll('table')].find((t) => /^section metadata$/i.test((t.querySelector('tr')?.textContent || '').trim()));
      const cell = sm && [...sm.querySelectorAll('tr')].find((tr) => /^style$/i.test(tr.children[0]?.textContent.trim()))?.children[1];
      if (cell) cell.textContent = `${cell.textContent.trim()}, ${introStyles.join(', ')}`;
    }

    // 5. Page metadata: source meta tags, breadcrumbs (when the source has them)
    // with the source label, and template=employer-subpage (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
      if (crumbHome.startsWith('/')) meta['Breadcrumb Home'] = crumbHome;
    }
    meta.template = 'employer-subpage';
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
