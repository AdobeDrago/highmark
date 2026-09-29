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

  // tools/importer/import-chip.js
  var import_chip_exports = {};
  __export(import_chip_exports, {
    default: () => import_chip_default
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
    const subnavList = element.querySelector("ul.subnavitem-list, .subnavitem-list");
    if (subnavList) {
      const current = element.querySelector('a.active, a[aria-expanded="true"]');
      if (current && current !== parent) cells.push(rowFor("current", current));
      Array.from(subnavList.querySelectorAll("a[href]")).forEach((a) => {
        if (a === current || a === parent) return;
        cells.push(rowFor("child", a));
      });
    } else {
      const siblingAnchors = Array.from(
        element.querySelectorAll("ul.sidenav-item-list ul a[href], .sidenav-item-list ul a[href], ul li ul a[href]")
      ).filter((a) => a !== parent);
      const seen = /* @__PURE__ */ new Set();
      siblingAnchors.forEach((a) => {
        if (seen.has(a)) return;
        seen.add(a);
        const isActive = a.classList.contains("active") || a.getAttribute("aria-current") === "page";
        cells.push(rowFor(isActive ? "current" : "sibling", a));
      });
    }
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

  // tools/importer/parsers/table-minimal-dark-compare.js
  function parse2(element, { document: document2 }) {
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
    const block = WebImporter.Blocks.createBlock(document2, { name: "table-minimal-dark-compare", cells });
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
      WebImporter.DOMUtils.remove(element, [
        "link",
        "noscript",
        "iframe"
      ]);
    }
  }

  // tools/importer/transformers/highmark-chip-sections.js
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
  function removeMobileTables(root) {
    root.querySelectorAll(".dynamic-table-container").forEach((container) => {
      const tables = [...container.children].filter((c) => c.tagName === "TABLE");
      const hasMobile = tables.some((t) => t.classList.contains("d-md-none"));
      const hasDesktop = container.querySelector("table.d-md-table");
      if (hasMobile && !hasDesktop) container.remove();
    });
  }
  function removeMobileCopies(root) {
    WebImporter.DOMUtils.remove(root, [
      // onecard1colpanel CTA band: mobile h2 + body-text (D:2171, D:2177)
      ".onecard1colpanel .one-card-content-center-container > .d-block.d-lg-none"
    ]);
  }
  function resolveHref(href, baseUrl) {
    if (!href || !baseUrl) return href;
    if (/^(\/|#|[a-z][a-z0-9+.-]*:)/i.test(href)) return href;
    try {
      return new URL(href, baseUrl).pathname;
    } catch (e) {
      return href;
    }
  }
  function cleanRightRail(root, baseUrl) {
    root.querySelectorAll("div.rightRail .rightrail-container").forEach((rail) => {
      rail.querySelectorAll("hr.breakLine").forEach((hr) => hr.remove());
      rail.querySelectorAll("a[href]").forEach((a) => {
        a.setAttribute("href", resolveHref(a.getAttribute("href"), baseUrl));
      });
    });
  }
  var CONTENT_SCOPES = [
    "div.col-lg-9 > div.row > div.col-lg-9 div.page__par",
    "div.rightRail .rightrail-container"
  ];
  var EXTERNAL_ICON_SELECTOR = "a i.fa-external-link-alt, a i.fa-external-link";
  function replaceExternalLinkIcons(root) {
    const icons = /* @__PURE__ */ new Set();
    CONTENT_SCOPES.forEach((scope) => {
      root.querySelectorAll(scope).forEach((container) => {
        container.querySelectorAll(EXTERNAL_ICON_SELECTOR).forEach((i) => icons.add(i));
      });
    });
    icons.forEach((i) => {
      i.replaceWith(document.createTextNode(" :external-link:"));
    });
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (hookName === "preprocess") {
      replaceExternalLinkIcons(element);
    }
    if (hookName === "beforeTransform") {
      const baseUrl = payload && payload.params && payload.params.originalURL || payload && payload.url || null;
      removeMobileTables(element);
      removeMobileCopies(element);
      cleanRightRail(element, baseUrl);
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

  // tools/importer/import-chip.js
  var parsers = {
    "cards-minimal-light-sidenav": parse,
    "table-minimal-dark-compare": parse2
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    "name": "chip",
    "description": "Western PA CHIP article page: left CHIP section nav, main article (headings, lists, pricing tables on some pages), a small grey right-rail callout, and on some pages a light-blue centered CTA band",
    "urls": [
      "https://www.highmark.com/western-pennsylvania/chip/chip-eligibility-and-costs",
      "https://www.highmark.com/western-pennsylvania/chip/chip-resources",
      "https://www.highmark.com/western-pennsylvania/chip/doctors-drugs"
    ],
    "blocks": [
      {
        "name": "cards-minimal-light-sidenav",
        "instances": [
          "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)"
        ]
      },
      {
        "name": "table-minimal-dark-compare",
        "instances": [
          ".dynamic-table-container:has(table.d-md-table)"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "sidenav",
        "selector": [
          "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)"
        ],
        "style": null,
        "blocks": [
          "cards-minimal-light-sidenav"
        ],
        "defaultContent": []
      },
      {
        "id": "2",
        "name": "main-content",
        "selector": [
          "div.col-lg-9 > div.row > div.col-lg-9 div.page__par"
        ],
        "style": null,
        "blocks": [
          "table-minimal-dark-compare"
        ],
        "defaultContent": [
          "div.col-lg-9 > div.row > div.col-lg-9 div.page__par h1",
          "div.col-lg-9 > div.row > div.col-lg-9 div.page__par h2",
          "div.col-lg-9 > div.row > div.col-lg-9 div.page__par h3",
          "div.col-lg-9 > div.row > div.col-lg-9 div.page__par p",
          "div.col-lg-9 > div.row > div.col-lg-9 div.page__par ul",
          "div.col-lg-9 > div.row > div.col-lg-9 div.page__par img"
        ]
      },
      {
        "id": "3",
        "name": "right-rail-callout",
        "selector": [
          "div.rightRail .rightrail-container"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "div.rightRail .rightrail-container h2, div.rightRail .rightrail-container h3",
          "div.rightRail .rightrail-container p",
          "div.rightRail .rightrail-container a"
        ]
      },
      {
        "id": "4",
        "name": "cta-band",
        "selector": [
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-polar)"
        ],
        "style": "light, center",
        "blocks": [],
        "defaultContent": [
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-polar) h2",
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-polar) p",
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-polar) a"
        ]
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
  var import_chip_default = {
    // Runs before helix-importer's preProcess() (which strips empty inline
    // elements, e.g. Font Awesome <i> icons) — see highmark-chip-sections.js.
    preprocess: (payload) => {
      executeTransformers("preprocess", payload.document.body, payload);
    },
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
      const meta = WebImporter.Blocks.getMetadata(document2) || {};
      meta.breadcrumbs = "true";
      meta.template = "chip";
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
  return __toCommonJS(import_chip_exports);
})();
