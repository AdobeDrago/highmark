/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS


// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {

};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "language-assistance",
  "description": "Language Assistance: intro, index of 26 language jump links, one notice (h2 + paragraph) per language, back-to-top link",
  "urls": [
    "https://www.highmark.com/language-assistance"
  ],
  "blocks": [],
  "sections": [
    {
      "id": "1",
      "name": "intro-and-index",
      "selector": [
        "section#langtop > .aem-Grid > div.cmp-text:has(h1)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "notices",
      "selector": [
        "section#langtop > .aem-Grid > section.container-fluid-fullwidth"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "back-to-top",
      "selector": [
        "section#langtop > .aem-Grid > div.cmp-text:last-child"
      ],
      "style": "center",
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

    // Global nav / search bar and the breadcrumb + print/share row, on layouts
    // without a <header> element (highmark-cleanup.js removes <header> only).
    WebImporter.DOMUtils.remove(main, [
      '.experiencefragment:has(.main-search-bar)',
      '.experiencefragment:has(.footer-list)',
      'div.breadcrumb',
    ]);

    // Index grid of language links -> one bulleted list; jump links point at the new
    // heading ids (EDS derives ids from each notice's h2 text; the source used English ids).
    const HREFS = {"#English": "#english", "#Spanish": "#español", "#chinese": "#中文", "#french": "#francês", "#arabic": "#عربي", "#Bengali": "#বাংলা", "#german": "#deutsch", "#igbo": "#igbo", "#Greek": "#ελληνικά", "#gujarati": "#ગુજરાતી", "#hindi": "#हिंदी", "#korean": "#한국어", "#italian": "#italiano", "#japanese": "#日本語", "#swahili": "#kiswahili", "#Persian": "#فارسی", "#Haitian": "#kreyòl-ayisyen", "#nepali": "#nepali", "#polish": "#polski", "#portuguese": "#português", "#russian": "#русский-язык", "#tagalog": "#tagalog", "#vietnamese": "#tiếng-việt", "#urdu": "#ودرا", "#Yiddish": "#יידיש", "#yoruba": "#yoruba", "#langtop": "#top"};
    main.querySelectorAll('section#langtop div.gridcontrol').forEach((grid) => {
      const ul = document.createElement('ul');
      grid.querySelectorAll('a[href]').forEach((a) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        const href = a.getAttribute('href');
        link.setAttribute('href', HREFS[href] || href);
        link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
        li.append(link);
        ul.append(li);
      });
      grid.replaceWith(ul);
    });
    main.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (HREFS[href]) a.setAttribute('href', HREFS[href]);
    });
    // drop trailing <br>s (every notice ends with one); keep in-text breaks like Igbo "(TTY:<br>711)"
    main.querySelectorAll('section#langtop br').forEach((br) => {
      let next = br.nextSibling;
      while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
      if (!next) br.remove();
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
    // with the source label, and template=language-assistance (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'language-assistance';
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
