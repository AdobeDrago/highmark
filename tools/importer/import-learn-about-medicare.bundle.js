/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-learn-about-medicare.js
  var import_learn_about_medicare_exports = {};
  __export(import_learn_about_medicare_exports, {
    default: () => import_learn_about_medicare_default
  });

  // tools/importer/parsers/hero-minimal-light.js
  function parse(element, { document: document2 }) {
    const bgImage = element.querySelector('picture img, img[class*="image"]');
    const heading = element.querySelector('h1, h2, .banner-heading, [class*="banner-heading"]');
    const paragraph = element.querySelector("p");
    if (!heading && !paragraph && !bgImage) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) {
      cells.push([bgImage]);
    }
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (paragraph) contentCell.push(paragraph);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-minimal-light", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-minimal-dark-withimg.js
  function parse2(element, { document: document2 }) {
    const introEls = [];
    const introContainer = element.querySelector(".cardBlockTitleContainer");
    if (introContainer) {
      const introHeading = introContainer.querySelector("h1, h2, h3");
      const introDesc = introContainer.querySelector(".cardDescription, p");
      if (introHeading) introEls.push(introHeading);
      if (introDesc) introEls.push(introDesc);
    }
    let cards = Array.from(element.querySelectorAll(".card.cardBlock, .cardBlock, .card"));
    if (!cards.length) {
      cards = Array.from(element.querySelectorAll("li.cardThree")).filter((li) => li.querySelector("picture, img"));
      if (cards.length) {
        const introHeading = element.querySelector("h2.cardsTitle");
        if (introHeading) introEls.push(introHeading);
        introEls.push(...Array.from(element.querySelectorAll("p.cardsPara")));
      }
    }
    if (cards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const unwrapDeadHeadingLinks = (heading) => {
      if (!heading) return;
      heading.querySelectorAll("a").forEach((a) => {
        const href = (a.getAttribute("href") || "").trim();
        if (!href || href === "#") {
          a.replaceWith(...a.childNodes);
        }
      });
    };
    const cells = [];
    cards.forEach((card) => {
      const image = card.querySelector("picture, img");
      const heading = card.querySelector('h1, h2, h3, h4, [class*="title"]');
      unwrapDeadHeadingLinks(heading);
      const paragraphs = Array.from(card.querySelectorAll(".cardText > p, p"));
      const links = Array.from(card.querySelectorAll('a.textButton, a.button, a[class*="button"], a')).filter((a) => {
        const href = (a.getAttribute("href") || "").trim();
        return href && href !== "#";
      });
      const contentCell = [];
      if (heading) contentCell.push(heading);
      contentCell.push(...paragraphs);
      contentCell.push(...links);
      cells.push([image || "", contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-minimal-dark-withimg", cells });
    element.replaceWith(...introEls, block);
  }

  // tools/importer/transformers/highmark-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#ZN_bmb74MCuuQ38dlc",
        // Qualtrics website-feedback snippet (cleaned.html:2)
        ".mega-menu-overlay",
        // nav mega-menu overlay (cleaned.html:81)
        "#modalIeDetect",
        // legacy IE-detection modal (cleaned.html:1637)
        "#onetrust-consent-sdk"
        // OneTrust cookie banner + preference center (plans cleaned.html:2631)
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        // fixed global header/nav (cleaned.html:6)
        ".footer-content.iparsys.parsys",
        // global footer experience fragment incl. disclaimer (cleaned.html:2029)
        "div.col-md-12.col-lg-9"
        // breadcrumb + print/share utility column (cleaned.html:1656), sibling of content col-lg-12
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".d-block.d-lg-none"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "link",
        "noscript",
        "iframe"
      ]);
    }
  }

  // tools/importer/transformers/highmark-template-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
      if (el) return el;
    }
    return null;
  }
  function sharedCleanup(root) {
    root.querySelectorAll('a.headNoLink:not([href]), a.headNoLink[href=""]').forEach((a) => {
      a.replaceWith(...a.childNodes);
    });
    root.querySelectorAll('a[href="tel:"]').forEach((a) => a.remove());
    root.querySelectorAll("li.listWideImg picture").forEach((picture) => {
      const img = picture.querySelector("img");
      const desktop = picture.querySelector('source[media*="992"][srcset]');
      const src = desktop && desktop.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0];
      if (img && src) img.setAttribute("src", src);
    });
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      sharedCleanup(element);
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-learn-about-medicare.js
  var parsers = {
    "hero-minimal-light": parse,
    "cards-minimal-dark-withimg": parse2
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    "name": "learn-about-medicare",
    "description": 'Medicare article hub: light-blue intro hero, 3-up grid of 18 article image cards, blush "Understand your Medicare options" CTA band and disclaimers',
    "urls": [
      "https://www.highmark.com/plans/medicare/learn-about-medicare"
    ],
    "blocks": [
      {
        "name": "hero-minimal-light",
        "instances": [
          "section.container-fluid-fullwidth.section:has(.new-hmk-brand-fifteenpercent-splash)"
        ]
      },
      {
        "name": "cards-minimal-dark-withimg",
        "instances": [
          "div.newcardscomponent-variations.section:has(ul.gridcardsul):has(.cardThree img)"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "intro",
        "selector": [
          "section.container-fluid-fullwidth.section:has(.new-hmk-brand-fifteenpercent-splash)"
        ],
        "style": null,
        "blocks": [
          "hero-minimal-light"
        ],
        "defaultContent": []
      },
      {
        "id": "2",
        "name": "article-cards",
        "selector": [
          "div.newcardscomponent-variations.section:has(ul.gridcardsul):has(.cardThree img)"
        ],
        "style": null,
        "blocks": [
          "cards-minimal-dark-withimg"
        ],
        "defaultContent": []
      },
      {
        "id": "3",
        "name": "options-cta",
        "selector": [
          "section.container-fluid-fullwidth.section:has(.new-hmk-brand-blush-twnetyfive)"
        ],
        "style": "highlight, center",
        "blocks": [],
        "defaultContent": []
      },
      {
        "id": "4",
        "name": "disclaimers",
        "selector": [
          "section.container-fluid-fullwidth.section:has(> div.container)"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": []
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const claimed = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        let elements;
        try {
          elements = document2.querySelectorAll(selector);
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
  var import_learn_about_medicare_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      const crumb = document2.querySelector("ol.breadcrumb-list li.active");
      const crumbLabel = ((crumb == null ? void 0 : crumb.textContent) || "").replace(/\s+/g, " ").trim();
      WebImporter.DOMUtils.remove(main, [
        ".experiencefragment:has(.main-search-bar)",
        ".experiencefragment:has(.footer-list)",
        "div.breadcrumb"
      ]);
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document2) || {};
      if (crumb) {
        meta.breadcrumbs = "true";
        if (crumbLabel) meta["Breadcrumb Title"] = crumbLabel;
      }
      meta.template = "learn-about-medicare";
      main.append(WebImporter.Blocks.getMetadataBlock(document2, meta));
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_learn_about_medicare_exports);
})();
