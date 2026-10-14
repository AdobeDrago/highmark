/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalDarkWithimgParser from './parsers/hero-minimal-dark-withimg.js';
import cardsMinimalDarkIconnavParser from './parsers/cards-minimal-dark-iconnav.js';
import cardsMinimalDarkWithimgIconsParser from './parsers/cards-minimal-dark-withimg-icons.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';

// PARSER REGISTRY
const parsers = {
  'hero-minimal-dark-withimg': heroMinimalDarkWithimgParser,
  'cards-minimal-dark-iconnav': cardsMinimalDarkIconnavParser,
  'cards-minimal-dark-withimg-icons': cardsMinimalDarkWithimgIconsParser,
  'columns-minimal-dark': columnsMinimalDarkParser,
};

// TRANSFORMER REGISTRY — cleanup only; sections are cut below, one per source component.
const transformers = [
  cleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "member-regional",
  "description": "Regional member resources pages (/member/bcbs, /blueshield, /bcbswv, /bcbsde, /bcbswny, /blueshieldneny): photo hero with MEMBER LOGIN / REGISTER, navy icon quick-link bar, small-icon task cards, image/text side panels (Member Portal Assistance, Member Services), My Highmark app band with store badges, Got Questions band; the New York pages add Member Bill Pay Options text cards and (Western NY) a Child Health Plus band. One section per source component, styled from its background. Each page gets its region's header and footer fragments (/member/fragments/<region>/nav, /footer; tools/importer/import-member-chrome.js)",
  "urls": [
    "https://www.highmark.com/member/bcbs",
    "https://www.highmark.com/member/blueshield",
    "https://www.highmark.com/member/bcbswv",
    "https://www.highmark.com/member/bcbsde",
    "https://www.highmark.com/member/bcbswny",
    "https://www.highmark.com/member/blueshieldneny"
  ],
  "blocks": [
    {
      "name": "hero-minimal-dark-withimg",
      "instances": [
        "div.secondary-banner.responsivegrid"
      ]
    },
    {
      "name": "cards-minimal-dark-iconnav",
      "instances": [
        "div.quicklinks.section"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg-icons",
      "instances": [
        "div.newcardscomponent-variations:has(li.listSmlImg)"
      ]
    },
    {
      "name": "columns-minimal-dark",
      "instances": [
        "div.newcardscomponent-variations:has(.side-card-panel)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "component",
      "selector": [
        "div.secondary-banner.responsivegrid ~ *"
      ],
      "repeat": true,
      "style": "(from the component's background: blush 25 -> highlight, light pink -> pink, light blue -> pale-blue, polar -> light, splash 15 -> light-blue, paper grey -> grey; text bands add center)",
      "blocks": [],
      "defaultContent": []
    }
  ]
};

// Source background classes -> section style.
const BACKGROUNDS = [
  ['new-hmk-brand-blush-twnetyfive', 'highlight'],
  ['global-light-pink', 'pink'],
  ['global-light-blue', 'pale-blue'],
  ['new-hmk-brand-polar', 'light'],
  ['new-hmk-brand-fifteenpercent-splash', 'light-blue'],
  ['new-hmk-brand-papergrey', 'grey'],
];

// The region is the page's last path segment; it names its header and footer fragments.
const REGIONS = ['bcbs', 'blueshield', 'bcbswv', 'bcbsde', 'bcbswny', 'blueshieldneny'];

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

/** Which block a component holds (by the template's block selectors), or null. */
function blockOf(component) {
  for (const def of PAGE_TEMPLATE.blocks) {
    for (const sel of def.instances) {
      if (component.matches(sel)) return { name: def.name, element: component };
      const inner = component.querySelector(sel);
      if (inner) return { name: def.name, element: inner };
    }
  }
  return null;
}

/** The section style of a component: its background, plus center for text bands. */
function styleOf(component, block) {
  const styles = [];
  // the innermost coloured element decides (a blush panel inside a paper-grey section is blush)
  const coloured = [component, ...component.querySelectorAll('[class]')]
    .filter((el) => BACKGROUNDS.some(([cls]) => el.classList.contains(cls)));
  const el = coloured.pop();
  if (el) styles.push(BACKGROUNDS.find(([cls]) => el.classList.contains(cls))[1]);
  // text bands with a heading, and the card lists' intros, are centred (a footnote isn't)
  if ((!block && component.querySelector('h2, h5')) || block?.name === 'cards-minimal-dark-withimg-icons') styles.push('center');
  return styles.join(', ');
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;
    const region = new URL(params.originalURL).pathname.replace(/\/$/, '').split('/').pop().toLowerCase();

    // Header (nav experience fragment, mobile menu) and footer: they become the region's
    // fragments (import-member-chrome.js). Also the IE notice and the spacing components.
    WebImporter.DOMUtils.remove(main, [
      '.experiencefragment:has(.main-search-bar)',
      '.experiencefragment:has(.mainnavigation-new)',
      '.conf-extra-links-container',
      '.wrapper-header-container',
      '.global-footer',
      '.iedetect',
      'div.breadcrumb',
      '.spacing',
      'a[href="#main-content"]',
    ]);

    // 1. beforeTransform (cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Components, in source order: the block components, and the text bands (the
    // outermost layout sections holding text and no block component: the colour bands, and
    // West Virginia's prior-authorization footnote). On the New York pages one layout
    // section holds several components, so they are found by type.
    const COMPONENT = 'div.secondary-banner.responsivegrid, div.quicklinks, div.newcardscomponent-variations, div.onecard1colpanel';
    const blocks = [...main.querySelectorAll(COMPONENT)].filter((c) => !c.parentElement.closest(COMPONENT));
    const bandCandidates = [...main.querySelectorAll('section.container-fluid-fullwidth')]
      .filter((s) => s.querySelector('h2, h5, p') && s.textContent.trim()
        && !s.querySelector(COMPONENT) && !s.closest(COMPONENT));
    const bands = bandCandidates.filter((s) => !bandCandidates.some((o) => o !== s && o.contains(s)));
    const kept = [...blocks, ...bands]
      .filter((c) => c.textContent.trim() || c.querySelector('img'))
      // eslint-disable-next-line no-bitwise
      .sort((a, b) => ((a.compareDocumentPosition(b) & 4) ? -1 : 1));
    // the hero's colour variants, read before its parser replaces it (see below)
    const heroVariants = {
      light: !!main.querySelector('.secondary-banner h1.d-lg-block.hmk-brand-togetherblue-text-color'),
      dark: !!main.querySelector('.secondary-banner .mobileBackgroundTogetherBlue'),
    };
    // the icon bar's icons are images here (not material-icons ligatures)
    main.querySelectorAll('div.quicklinks').forEach((q) => q.setAttribute('data-iconnav-image-icons', ''));

    // The source's buttons: the filled one (a.brand-button-normal) -> a bold link (primary
    // button), the outlined ones (brand-button-light, -dark) -> an italic link (secondary
    // button); text buttons (a.textButton) stay plain links, as the card CTAs elsewhere.
    // (The hero's pair is marked after its parser runs, below.)
    main.querySelectorAll('.hmk-brand-buttons a[class*="brand-button"]').forEach((a) => {
      if (a.closest('strong, b, em, i, .secondary-banner')) return;
      const wrap = document.createElement(a.classList.contains('brand-button-normal') ? 'strong' : 'em');
      a.replaceWith(wrap);
      wrap.append(a);
    });

    // 3. Section breaks + blocks, one section per component. A marker after each component
    // (outside it, so it survives the parser replacing the component) takes its Section
    // Metadata.
    const pageBlocks = [];
    const plan = kept.map((component, i) => {
      const block = blockOf(component);
      const style = styleOf(component, block);
      if (i > 0) component.before(document.createElement('hr'));
      const end = document.createElement('div');
      component.after(end);
      // outlined buttons, re-marked after the parser rebuilds the block's links
      const outlined = [...component.querySelectorAll('em > a[href]')].map((a) => a.getAttribute('href'));
      return { block, style, end, outlined };
    });
    plan.forEach(({ block, style, end, outlined }) => {
      if (block) {
        pageBlocks.push(block);
        try {
          parsers[block.name](block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name}:`, e);
        }
        const rebuilt = end.previousElementSibling;
        rebuilt?.querySelectorAll('a[href]').forEach((a) => {
          if (!outlined.includes(a.getAttribute('href')) || a.closest('em, strong')) return;
          const em = document.createElement('em');
          a.replaceWith(em);
          em.append(a);
        });
        // The hero's CTA pair, as on /member/member-guide: a bold MEMBER LOGIN (the filled
        // button) and a plain REGISTER, which the hero outlines after a primary one.
        const parsed = end.previousElementSibling;
        // Hero variants, from the source's colours: light = navy text over the photo from
        // 992px (its heading is .hmk-brand-togetherblue-text-color there); dark = a navy
        // panel with white text below 992px (.mobileBackgroundTogetherBlue).
        if (block.name === 'hero-minimal-dark-withimg' && parsed) {
          const variants = [];
          if (heroVariants.light) variants.push('light');
          if (heroVariants.dark) variants.push('dark');
          const nameCell = parsed.querySelector('tr > th, tr > td');
          if (nameCell && variants.length) nameCell.textContent = `${nameCell.textContent.trim()} (${variants.join(', ')})`;
        }
        if (block.name === 'hero-minimal-dark-withimg' && parsed && !parsed.querySelector('strong > a')) {
          const first = [...parsed.querySelectorAll('a[href]')].find((a) => !a.querySelector('img, picture'));
          if (first) {
            const strong = document.createElement('strong');
            first.replaceWith(strong);
            strong.append(first);
          }
        }
      }
      if (style) {
        end.replaceWith(WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style },
        }));
      } else {
        end.remove();
      }
    });

    // 4. afterTransform (final cleanup)
    executeTransformers('afterTransform', main, payload);

    // 5. Page metadata: source meta tags, the region's header and footer, template.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (REGIONS.includes(region)) {
      meta.nav = `/member/fragments/${region}/nav`;
      meta.footer = `/member/fragments/${region}/footer`;
    }
    meta.template = 'member-regional';
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
