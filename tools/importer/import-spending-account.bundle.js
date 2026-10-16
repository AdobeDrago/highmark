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

  // tools/importer/import-spending-account.js
  var import_spending_account_exports = {};
  __export(import_spending_account_exports, {
    default: () => import_spending_account_default
  });

  // tools/importer/parsers/cards-minimal-dark-iconnav.js
  function parse(element, { document: document2 }) {
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
      let iconText = icon ? icon.textContent.trim() : "";
      if (!icon && element.hasAttribute("data-iconnav-image-icons")) {
        const img = item.querySelector("img.whiteimage") || item.querySelector("img.quicklinks-img:not(.bgimage)") || item.querySelector("img:not(.bgimage)");
        if (img) iconText = img;
      }
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      link.textContent = label;
      cells.push([iconText, link]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-minimal-dark-iconnav", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-minimal-dark.js
  function parseBio(element, document2) {
    const img = element.querySelector(".div-bio-images img, img");
    const header = element.querySelector(".div-bio-header") || element;
    const name = header.querySelector("h1, h2, h3, h4");
    const title = header.querySelector("p");
    const content = [];
    if (name) {
      const h1 = document2.createElement("h1");
      h1.textContent = name.textContent.replace(/\s+/g, " ").trim();
      content.push(h1);
    }
    if (title) {
      const p = document2.createElement("p");
      p.textContent = title.textContent.replace(/\s+/g, " ").trim();
      content.push(p);
    }
    const linkPara = (href, text) => {
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.href = href;
      a.textContent = text;
      p.append(a);
      return p;
    };
    header.querySelectorAll("a").forEach((a) => {
      const raw = (a.getAttribute("href") || "").trim();
      const href = raw.replace(/(%20|\s)+$/i, "");
      const label = a.textContent.replace(/\s+/g, " ").trim();
      if (/linkedin\.com/i.test(href) || a.querySelector(".fa-linkedin") || label === "LinkedIn") {
        content.push(linkPara(href || "#", "LinkedIn"));
      } else if (a.id === "bio-modal" || /request interview/i.test(label)) {
        content.push(linkPara("/modals/request-interview", "Request Interview"));
      } else if (/\.pdf$/i.test(href)) {
        content.push(linkPara(href, "View as a PDF"));
      } else if (href && href !== "#") {
        content.push(linkPara(href, label || href));
      }
    });
    const cells = [[img ? [img] : "", content]];
    element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "columns-minimal-dark", cells }));
  }
  function parse2(element, { document: document2 }) {
    if (element.matches("section.flex-container") && element.querySelector(".div-bio-header")) {
      parseBio(element, document2);
      return;
    }
    const textArea = element.querySelector(".text-area") || element;
    const imageArea = element.querySelector(".image-area") || element;
    const image = imageArea.querySelector("picture, img");
    const heading = textArea.querySelector("h1, h2, h3, h4");
    const bodyBlocks = Array.from(textArea.querySelectorAll(":scope > div"));
    const isCta = (a) => a.matches('a.textButton, a.button, a[class*="button"]') || !!a.closest("b, strong");
    const links = Array.from(textArea.querySelectorAll('a.textButton, a.button, a[class*="button"], a[href]')).filter((a) => (a.getAttribute("href") || "").trim()).filter((a) => isCta(a) || !bodyBlocks.some((b) => b.contains(a)));
    if (!heading && bodyBlocks.length === 0 && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const contentCell = [];
    if (heading) contentCell.push(heading);
    contentCell.push(...bodyBlocks);
    contentCell.push(...links);
    const imageCell = image ? [image] : [""];
    const imageLeft = !!element.querySelector(".image-area.left-content");
    const cells = [imageLeft ? [imageCell, contentCell] : [contentCell, imageCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-minimal-dark", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-minimal-dark-compare.js
  function parse3(element, { document: document2 }) {
    const table = element.querySelector("table");
    if (!table) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rows = Array.from(table.querySelectorAll(":scope > tbody > tr, :scope > tr"));
    if (rows.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    let colCount = 0;
    rows.forEach((row) => {
      const c = row.querySelectorAll(":scope > th, :scope > td").length;
      if (c > colCount) colCount = c;
    });
    const cells = [];
    rows.forEach((row) => {
      const rowCells = Array.from(row.querySelectorAll(":scope > th, :scope > td"));
      const outRow = rowCells.map((cell) => {
        const inner = Array.from(cell.children);
        if (inner.length > 0) return inner;
        const text = (cell.textContent || "").trim();
        return text;
      });
      while (outRow.length < colCount) outRow.push("");
      cells.push(outRow);
    });
    const variant = element.getAttribute("data-block-variant");
    const name = variant ? `table-minimal-dark-compare (${variant})` : "table-minimal-dark-compare";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
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
      element.querySelectorAll('a[href^="/content/dam/"]').forEach((a) => {
        a.setAttribute("href", `https://www.highmark.com${a.getAttribute("href")}`);
      });
      WebImporter.DOMUtils.remove(element, [
        "link",
        "noscript",
        "iframe"
      ]);
    }
  }

  // tools/importer/transformers/highmark-spending-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var SECTION_STYLE_ATTR = "data-excat-section-style";
  var COMPONENTS = [
    "section.container-fluid-fullwidth.section",
    "div.quicklinks.section",
    "div.onecard1colpanel.section",
    "div.newcardscomponent-variations.section",
    "div.card-block.section"
  ].join(", ");
  var BRAND_STYLES = [
    ["new-hmk-brand-polar", "accent"],
    ["new-hmk-brand-blush-twnetyfive", "highlight"],
    ["new-hmk-brand-papergrey", "grey"]
  ];
  function brandOf(el) {
    const own = (e) => BRAND_STYLES.find(([cls]) => ((e == null ? void 0 : e.className) || "").toString().split(/\s+/).includes(cls));
    let found = own(el);
    for (let e = el.firstElementChild; !found && e; e = e.firstElementChild) found = own(e);
    return found ? found[1] : "";
  }
  function styleFor(component, isLast) {
    if (component.matches("section.container-fluid-fullwidth") && component.querySelector("h1")) return "title-band";
    if (component.matches("div.quicklinks.section, div.card-block.section")) return "";
    if (component.matches("div.onecard1colpanel.section")) return "intro";
    if (component.matches("div.newcardscomponent-variations.section")) {
      const panel = component.querySelector(".side-card-panel");
      const styles = [panel ? brandOf(panel) : ""];
      if (component.querySelector(".image-area.left-content")) styles.push("image-left");
      if ([...component.querySelectorAll(".text-area > div")].some((d) => !d.children.length && d.textContent.trim())) styles.push("plain-copy");
      return styles.filter(Boolean).join(", ");
    }
    if (isLast && component.querySelector("sup") && !component.querySelector("h2, table")) return "footnotes";
    const inner = component.querySelector(":scope > .parent-width > section") || component;
    return brandOf(inner);
  }
  function transform2(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      const components = [...element.querySelectorAll(COMPONENTS)].filter((c) => !c.parentElement.closest(COMPONENTS));
      components.forEach((component, i) => {
        const style = styleFor(component, i === components.length - 1);
        if (i === 0 && !style) return;
        const marker = document.createElement(i === 0 ? "div" : "hr");
        if (style) {
          marker.setAttribute(SECTION_MARKER_ATTR, `section-${i + 1}`);
          marker.setAttribute(SECTION_STYLE_ATTR, style);
        }
        component.before(marker);
      });
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll(`[${SECTION_MARKER_ATTR}]`).forEach((marker) => {
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: marker.getAttribute(SECTION_STYLE_ATTR) }
        });
        if (marker.tagName === "DIV") {
          marker.replaceWith(metadataBlock);
          return;
        }
        marker.after(metadataBlock);
        marker.removeAttribute(SECTION_MARKER_ATTR);
        marker.removeAttribute(SECTION_STYLE_ATTR);
      });
    }
  }

  // tools/importer/import-spending-account.js
  function textCardsParser(element, { document: document2 }) {
    const title = element.querySelector(".cardBlockTitleContainer");
    const nodes = title ? [...title.querySelectorAll(":scope > h2, :scope > .cardDescription > *")] : [];
    const cells = [...element.querySelectorAll(".cardBlock .cardText")].map((card) => [[...card.children]]);
    if (!cells.length) return;
    const block = WebImporter.Blocks.createBlock(document2, { name: "Cards", cells });
    element.replaceWith(...nodes, block);
  }
  var parsers = {
    "cards-minimal-dark-iconnav": parse,
    "columns-minimal-dark": parse2,
    "table-minimal-dark-compare": parse3,
    cards: textCardsParser
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "spending-account",
    description: "Spending-account page: a light-blue title band, the account quick-link bar, a centred intro, side panels (text and a photo, alternating sides), text-card grids, data tables and footnotes",
    urls: [
      "https://www.highmark.com/resources/spending-accounts/health-saving-account-hsa",
      "https://www.highmark.com/resources/spending-accounts/health-reimbursement-arrangement-hra"
    ],
    blocks: [
      // the FSA / commuter / HSA limits and savings tables: the table block's "data" variant
      { name: "table-minimal-dark-compare", instances: [".dynamic-table-container"] },
      { name: "cards-minimal-dark-iconnav", instances: ["div.quicklinks.section"] },
      { name: "columns-minimal-dark", instances: ["div.newcardscomponent-variations.section:has(.side-card-panel)"] },
      { name: "cards", instances: ["div.card-block.section:has(.cardBlock)"] }
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
        document2.querySelectorAll(selector).forEach((element) => {
          if (claimed.has(element)) return;
          claimed.add(element);
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_spending_account_default = {
    // A side panel's empty spacer paragraph (one line above "WATCH VIDEO") is kept as a
    // zero-width space, on the live page: the importer copies the page before the
    // transform, and the pipeline drops a blank paragraph.
    onLoad: ({ document: document2 }) => {
      document2.querySelectorAll(".side-card-panel p").forEach((p) => {
        if (!p.querySelector("img, br, a") && !p.textContent.replace(/[\s\u00a0]/g, "")) p.textContent = "\u200B";
      });
    },
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
      main.querySelectorAll('a .sr-only, a .visually-hidden, a .hmk-visually-hidden, a [class*="screen-reader"]').forEach((el) => el.remove());
      main.querySelectorAll("a em, a span").forEach((el) => {
        if (/^opens (in )?a new (tab|window)( or (tab|window))?\.?$/i.test(el.textContent.trim())) el.remove();
      });
      main.querySelectorAll("a").forEach((a) => {
        if (!(a.getAttribute("href") || "").trim() && !a.textContent.trim() && !a.querySelector("img")) a.remove();
      });
      main.querySelectorAll(".hmk-brand-buttons").forEach((el) => {
        if (!el.textContent.trim()) el.remove();
      });
      main.querySelectorAll("p > b > a[href], p > strong > a[href]").forEach((a) => {
        const bold = a.parentElement;
        const p = bold.parentElement;
        if (bold.childNodes.length !== 1 || p.textContent.trim() === a.textContent.trim()) return;
        const strong = document2.createElement("strong");
        strong.append(...a.childNodes);
        a.append(strong);
        bold.replaceWith(a);
      });
      main.querySelectorAll(".dynamic-table-container").forEach((el) => el.setAttribute("data-block-variant", "data"));
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        try {
          parser(block.element, { document: document2, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document2) || {};
      meta.Template = "spending-account";
      if (crumb) {
        meta.breadcrumbs = "true";
        if (crumbLabel) meta["Breadcrumb Title"] = crumbLabel;
      }
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
  return __toCommonJS(import_spending_account_exports);
})();
