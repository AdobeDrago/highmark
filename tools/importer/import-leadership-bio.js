/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-minimal-dark': columnsMinimalDarkParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "leadership-bio",
  "description": "Leadership Team & Board bio: one executive per page (photo, name, title, biography)",
  "urls": [
    "https://www.highmark.com/about/our-story/leadership-team-board/EdwardShellard",
    "https://www.highmark.com/about/our-story/leadership-team-board/JaySheehy",
    "https://www.highmark.com/about/our-story/leadership-team-board/JessicaCox",
    "https://www.highmark.com/about/our-story/leadership-team-board/JoeHaddock",
    "https://www.highmark.com/about/our-story/leadership-team-board/Timothy-Vessel",
    "https://www.highmark.com/about/our-story/leadership-team-board/VictorFields",
    "https://www.highmark.com/about/our-story/leadership-team-board/anthony-benevento",
    "https://www.highmark.com/about/our-story/leadership-team-board/dan-tropeano",
    "https://www.highmark.com/about/our-story/leadership-team-board/david-holmberg",
    "https://www.highmark.com/about/our-story/leadership-team-board/gustavo-giraldo",
    "https://www.highmark.com/about/our-story/leadership-team-board/joy-matoney",
    "https://www.highmark.com/about/our-story/leadership-team-board/kate-musler-",
    "https://www.highmark.com/about/our-story/leadership-team-board/mark-lawrence",
    "https://www.highmark.com/about/our-story/leadership-team-board/matthew-rhenish",
    "https://www.highmark.com/about/our-story/leadership-team-board/sarah-marche",
    "https://www.highmark.com/about/our-story/leadership-team-board/thomas-fitzpatrick"
  ],
  "blocks": [
    {
      "name": "columns-minimal-dark",
      "instances": [
        "div.page__par section.flex-container"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "bio",
      "selector": [
        "main.container div.page__par"
      ],
      "style": null,
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": [
        "div.page__par div.cmp-text"
      ]
    }
  ]
};

const LEADERSHIP = '/about/our-story/leadership-team-board';

/**
 * EDS paths are lowercase, without trailing hyphens in a segment: the source's
 * /leadership-team-board/EdwardShellard and /kate-musler- are served here as
 * /leadership-team-board/edwardshellard and /kate-musler.
 */
function ourPath(pathname) {
  return pathname
    .replace(/\.html?$/, '')
    .replace(/\/+$/, '')
    .split('/')
    .map((s) => s.toLowerCase().replace(/-+$/, ''))
    .join('/');
}

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

    // Empty (&nbsp;) spacer paragraphs in the biography.
    main.querySelectorAll('.page__par .cmp-text p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, picture')) p.remove();
    });

    // The bio header's LinkedIn link is an icon only; give it a label so the shared
    // cleanup (highmark-template-sections.js drops label-less a.textButton) keeps it.
    // The importer has already dropped the empty <i class="fab fa-linkedin">, so it is the
    // header's only link without text, other than Request Interview and the PDF. That also
    // covers the two whose href is not a LinkedIn URL (Timothy-Vessel, JessicaCox).
    main.querySelectorAll('.div-bio-header a').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const linkedIn = /linkedin\.com/i.test(href)
        || (!a.textContent.trim() && !a.querySelector('img, picture') && a.id !== 'bio-modal'
          && !/\.pdf$/i.test(href));
      if (linkedIn && !a.textContent.trim()) a.textContent = 'LinkedIn';
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

    // The hidden "Contact us to arrange an interview" popup: the bio header parser has
    // linked it (as /modals/request-interview) where the page has one; drop the markup.
    main.querySelectorAll('.biomodal-content').forEach((popup) => {
      (popup.closest('.biomodal, [id*="modal" i]') || popup).remove();
    });

    // Links to the Leadership page and to other bios: relative, at our (lowercase) paths.
    main.querySelectorAll('a[href]').forEach((a) => {
      let link;
      try {
        link = new URL(a.getAttribute('href'), 'https://www.highmark.com');
      } catch (e) {
        return;
      }
      if (!/^(www\.)?highmark\.com$/.test(link.hostname)) return;
      if (!link.pathname.toLowerCase().startsWith(LEADERSHIP)) return;
      a.setAttribute('href', `${ourPath(link.pathname)}${link.hash}`);
    });

    // 4. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Page metadata: source meta tags, breadcrumbs (when the source has them)
    // with the source label (the person's name), and template=leadership-bio (body class
    // scoping). The source's robots=noindex is not carried over (decided 2026-10-12).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    delete meta.robots;
    delete meta.Robots;
    meta.template = 'leadership-bio';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Path: lowercase, no trailing hyphens (see ourPath)
    const path = WebImporter.FileUtils.sanitizePath(ourPath(new URL(params.originalURL).pathname));

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
