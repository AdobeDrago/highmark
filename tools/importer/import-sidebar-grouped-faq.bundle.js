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

  // tools/importer/import-sidebar-grouped-faq.js
  var import_sidebar_grouped_faq_exports = {};
  __export(import_sidebar_grouped_faq_exports, {
    default: () => import_sidebar_grouped_faq_default
  });

  // tools/importer/parsers/cards-minimal-light-sidenav.js
  function parse(element, { document: document2 }) {
    const labelOf = (a) => (a.textContent || "").replace(/\s+/g, " ").trim();
    const cleanLink = (a) => {
      const link = document2.createElement("a");
      link.setAttribute("href", a.getAttribute("href") || "#");
      link.textContent = labelOf(a);
      return link;
    };
    const rowFor = (level, a) => [level, cleanLink(a)];
    const cells = [];
    const parent = element.querySelector("a.side-nav-item-parent, .sidenav-item > a[href]:not(.active)");
    if (parent) cells.push(rowFor("parent", parent));
    const current = element.querySelector('a.active, a[aria-expanded="true"]');
    if (current) cells.push(rowFor("current", current));
    const childAnchors = Array.from(
      element.querySelectorAll("ul.subnavitem-list a[href], .subnavitem-list a[href]")
    );
    childAnchors.forEach((a) => {
      if (a === current || a === parent) return;
      cells.push(rowFor("child", a));
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "cards-minimal-light-sidenav",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-minimal-light.js
  function parse2(element, { document: document2 }) {
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

  // tools/importer/transformers/highmark-grouped-faq-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var SECTIONS = [
    { id: "section-sidenav", selector: "div.d-none.d-lg-block.col-lg-3 div.nav-container" },
    { id: "section-accordion", selector: "div.col-lg-9 div.accordianTable" },
    { id: "section-cta", selector: "div.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive", style: "highlight" }
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

  // tools/importer/import-sidebar-grouped-faq.js
  var parsers = {
    "cards-minimal-light-sidenav": parse,
    "accordion-minimal-light": parse2
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "sidebar-grouped-faq",
    description: "Two-column layout with a left-hand navigation sidebar, a right-side contact callout box, multiple grouped FAQ accordion sections with back-to-top links, and a tinted CTA band",
    urls: [
      "https://www.highmark.com/resources/answers/faq/northeastern-ny-blue-fund",
      "https://www.highmark.com/resources/answers/faq/western-ny-blue-fund",
      "https://www.highmark.com/resources/spending-accounts/health-reimbursement-arrangement-hra"
    ],
    blocks: [
      { name: "cards-minimal-light-sidenav", instances: ["div.d-none.d-lg-block.col-lg-3 div.nav-container"] },
      { name: "accordion-minimal-light", instances: ["div.col-lg-9 div.accordianTable"] },
      { name: "section-cta-highlight", instances: ["div.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive"], section: "highlight" }
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
          claimed.add(element);
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_sidebar_grouped_faq_default = {
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
  return __toCommonJS(import_sidebar_grouped_faq_exports);
})();
