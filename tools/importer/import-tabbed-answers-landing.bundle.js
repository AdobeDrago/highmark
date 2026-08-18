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

  // tools/importer/import-tabbed-answers-landing.js
  var import_tabbed_answers_landing_exports = {};
  __export(import_tabbed_answers_landing_exports, {
    default: () => import_tabbed_answers_landing_default
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

  // tools/importer/parsers/cards-minimal-dark-iconnav.js
  function parse2(element, { document: document2 }) {
    const list = element.querySelector(".quick-link-list-inner:not(.quick-link-list-mobile-inner)") || element.querySelector(".quick-link-list-inner") || element;
    const items = Array.from(list.querySelectorAll(".quick-link-item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const anchor = item.querySelector("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      const icon = item.querySelector('i.material-icons, i.material-icons-outlined, i[class*="material-icons"]');
      const labelEl = item.querySelector(".quick-link-text");
      const label = (labelEl ? labelEl.textContent : anchor.textContent || "").trim();
      const iconText = icon ? icon.textContent.trim() : "";
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      link.textContent = label;
      cells.push([iconText, link]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-minimal-dark-iconnav", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-minimal-light.js
  function parse3(element, { document: document2 }) {
    const leadingEls = [];
    const heading = element.querySelector("h2.maintitle, .maintitle, h2");
    if (heading) leadingEls.push(heading);
    const items = Array.from(element.querySelectorAll("div.collapsible-item, .collapsible-item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const trigger = item.querySelector("button.accordion-trigger, .accordion-trigger");
      const headingSpan = item.querySelector(
        "span.collapsible-item-heading, .collapsible-item-heading"
      );
      let titleEl;
      if (headingSpan) {
        titleEl = document2.createElement("p");
        titleEl.textContent = (headingSpan.textContent || "").replace(/\s+/g, " ").trim();
      } else if (trigger) {
        titleEl = document2.createElement("p");
        titleEl.textContent = (trigger.textContent || "").replace(/\s+/g, " ").trim();
      } else {
        titleEl = document2.createElement("p");
      }
      const desc = item.querySelector(
        "div.collapsible-item-description, .collapsible-item-description"
      );
      const contentCell = [];
      if (desc) {
        contentCell.push(...Array.from(desc.childNodes));
      }
      cells.push([titleEl, contentCell.length ? contentCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "accordion-minimal-light",
      cells
    });
    element.replaceWith(...leadingEls, block);
  }

  // tools/importer/parsers/cards-minimal-dark-list.js
  function parse4(element, { document: document2 }) {
    const introEls = [];
    const introHeading = element.querySelector("h2.cardsTitle, .cardsTitle, h1, h2");
    const introDesc = element.querySelector("p.cardsPara, .cardsPara, .container-sm-img > div > p");
    if (introHeading) introEls.push(introHeading);
    if (introDesc) introEls.push(introDesc);
    const cards = Array.from(element.querySelectorAll("li.cardThree, .cardThree"));
    if (cards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cards.forEach((card) => {
      const heading = card.querySelector('h3, h2, h4, [class*="titleHead"]');
      const listWrap = card.querySelector("span.cardsText, .cardsText");
      const list = listWrap ? listWrap.querySelector("ul, ol") : card.querySelector(".typeThreeTxt ul, .typeThreeTxt ol");
      const cta = card.querySelector('a.textButton, a.button, a[class*="button"], .hmk-brand-buttons a, a');
      const contentCell = [];
      if (heading) contentCell.push(heading);
      if (list) contentCell.push(list);
      if (cta) {
        const link = document2.createElement("a");
        link.setAttribute("href", cta.getAttribute("href") || "");
        link.textContent = (cta.textContent || "").trim();
        contentCell.push(link);
      }
      cells.push([contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-minimal-dark-list", cells });
    element.replaceWith(...introEls, block);
  }

  // tools/importer/parsers/columns-minimal-dark.js
  function parse5(element, { document: document2 }) {
    const textArea = element.querySelector(".text-area") || element;
    const imageArea = element.querySelector(".image-area") || element;
    const image = imageArea.querySelector("picture, img");
    const heading = textArea.querySelector("h1, h2, h3, h4");
    const bodyBlocks = Array.from(textArea.querySelectorAll(":scope > div"));
    const links = Array.from(textArea.querySelectorAll('a.textButton, a.button, a[class*="button"], a[href]'));
    if (!heading && bodyBlocks.length === 0 && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const contentCell = [];
    if (heading) contentCell.push(heading);
    contentCell.push(...bodyBlocks);
    contentCell.push(...links);
    const imageCell = image ? [image] : [""];
    const cells = [[contentCell, imageCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-minimal-dark", cells });
    element.replaceWith(block);
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
        "#modalIeDetect"
        // legacy IE-detection modal (cleaned.html:1637)
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

  // tools/importer/transformers/highmark-answers-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var SECTIONS = [
    { id: "section-hero", selector: "section.new-hmk-brand-fifteenpercent-splash" },
    { id: "section-iconnav", selector: ".quick-link-list-container.bg-blue" },
    { id: "section-accordion", selector: ".accordianTable" },
    { id: "section-glossary", selector: ".one-card-one-col-panel.new-hmk-brand-darkblue", style: "highlight" },
    { id: "section-cards", selector: ".newcardscomponent-variations .cards-variation" },
    { id: "section-promo", selector: ".side-card-panel.new-hmk-brand-blush-twnetyfive", style: "accent" },
    { id: "section-community", selector: ".newcardscomponent-variations:last-of-type .side-card-panel" }
  ];
  function transform2(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      SECTIONS.forEach((section) => {
        const matches = element.querySelectorAll(section.selector);
        for (let i = matches.length - 1; i >= 0; i -= 1) {
          const el = matches[i];
          const hr = document.createElement("hr");
          if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
          el.before(hr);
        }
      });
    }
    if (hookName === "afterTransform") {
      SECTIONS.forEach((section) => {
        if (!section.style) return;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || element.querySelector(section.selector);
        if (!anchor) return;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) marker.removeAttribute(SECTION_MARKER_ATTR);
      });
    }
  }

  // tools/importer/import-tabbed-answers-landing.js
  var parsers = {
    "hero-minimal-light": parse,
    "cards-minimal-dark-iconnav": parse2,
    "accordion-minimal-light": parse3,
    "cards-minimal-dark-list": parse4,
    "columns-minimal-dark": parse5
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "tabbed-answers-landing",
    description: "Landing page with hero banner, an icon tab/quick-nav bar, an FAQ accordion section, a three-up card grid, and alternating image/text promo and resource sections",
    urls: [
      "https://www.highmark.com/resources/answers",
      "https://www.highmark.com/resources/answers/health-insurance-glossary",
      "https://www.highmark.com/resources/spending-accounts/commuter-benefits-account",
      "https://www.highmark.com/resources/spending-accounts/flexible-spending-account-fsa",
      "https://www.highmark.com/resources/spending-accounts/health-saving-account-hsa",
      "https://www.highmark.com/resources/spending-accounts/health-reimbursement-arrangement-hra"
    ],
    blocks: [
      { name: "hero-minimal-light", instances: ["section.new-hmk-brand-fifteenpercent-splash"] },
      { name: "cards-minimal-dark-iconnav", instances: ["div.quicklinks.section", ".quick-link-list-container.bg-blue"] },
      { name: "accordion-minimal-light", instances: ["div.col-lg-9 div.accordianTable", ".accordianTable"] },
      { name: "cards-minimal-dark-list", instances: [".newcardscomponent-variations:has(.cards-variation) .cards-variation"] },
      {
        name: "columns-minimal-dark",
        instances: [".side-card-panel.new-hmk-brand-blush-twnetyfive", ".newcardscomponent-variations:last-of-type .side-card-panel"]
      },
      { name: "section-glossary-highlight", instances: [".one-card-one-col-panel.new-hmk-brand-darkblue"], section: "highlight" }
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
      if (blockDef.name.startsWith("section-")) return;
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
  var import_tabbed_answers_landing_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
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
      WebImporter.rules.createMetadata(main, document2);
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
  return __toCommonJS(import_tabbed_answers_landing_exports);
})();
