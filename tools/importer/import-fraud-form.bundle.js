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

  // tools/importer/import-fraud-form.js
  var import_fraud_form_exports = {};
  __export(import_fraud_form_exports, {
    default: () => import_fraud_form_default
  });

  // tools/importer/parsers/form-minimal-light.js
  var FORM_DEFINITIONS = {
    newsalert: "/newsroom/news-alert-form.json",
    "fraud-form": "/fraud/fraud-form-fields.json",
    "contact-form": "/contact-form-fields.json"
  };
  var PLACEHOLDER_SUBMIT = "https://www.highmark.com/newsroom/news-alert-submit";
  function link(document2, href) {
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = href;
    return a;
  }
  function parse(element, { document: document2 }) {
    const rawAction = (element.getAttribute("action") || "").trim();
    let submitUrl = PLACEHOLDER_SUBMIT;
    if (rawAction && rawAction !== "#" && !/^javascript:/i.test(rawAction)) {
      try {
        submitUrl = new URL(rawAction, "https://www.highmark.com").href;
      } catch (e) {
        submitUrl = PLACEHOLDER_SUBMIT;
      }
    }
    const cells = [
      [link(document2, FORM_DEFINITIONS[element.id] || FORM_DEFINITIONS.newsalert)],
      [link(document2, submitUrl)]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "form-minimal-light", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-minimal-light-sidenav.js
  function parse2(element, { document: document2 }) {
    const labelOf = (a) => (a.textContent || "").replace(/\s+/g, " ").trim();
    const cleanLink = (a) => {
      const link2 = document2.createElement("a");
      link2.setAttribute("href", a.getAttribute("href") || "#");
      link2.textContent = labelOf(a);
      return link2;
    };
    const rowFor = (level, a) => [level, cleanLink(a)];
    const cells = [];
    const parent = element.querySelector("a.side-nav-item-parent, .sidenav-item > a[href]:not(.active)");
    if (parent) cells.push(rowFor("parent", parent));
    const activeLink = element.querySelector("a.active");
    const subnavList = element.querySelector("ul.subnavitem-list.show") || activeLink && activeLink.parentElement.querySelector(":scope > ul.subnavitem-list") || !activeLink && element.querySelector("ul.subnavitem-list, .subnavitem-list");
    const inCollapsedList = (a) => {
      const list = a.closest("ul.subnavitem-list");
      return !!list && list !== subnavList && list.classList.contains("collapse") && !list.classList.contains("show");
    };
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
      ).filter((a) => a !== parent && !inCollapsedList(a));
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
  function queryAll(root, selectors) {
    const found = [];
    (Array.isArray(selectors) ? selectors : [selectors]).forEach((sel) => {
      if (!sel) return;
      try {
        root.querySelectorAll(sel).forEach((el) => {
          if (!found.includes(el)) found.push(el);
        });
      } catch (e) {
      }
    });
    return found;
  }
  function hasContentBefore(node, root) {
    const range = root.ownerDocument.createRange();
    range.setStart(root, 0);
    range.setEndBefore(node);
    const frag = range.cloneContents();
    return !!(frag.textContent.trim() || frag.querySelector("img, picture"));
  }
  function sharedCleanup(root) {
    root.querySelectorAll('a.headNoLink:not([href]), a.headNoLink[href=""]').forEach((a) => {
      a.replaceWith(...a.childNodes);
    });
    root.querySelectorAll('a[href="tel:"]').forEach((a) => a.remove());
    root.querySelectorAll("a.textButton").forEach((a) => {
      if (!a.textContent.trim() && !a.querySelector("img, picture")) a.remove();
    });
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
        const targets = section.repeat ? queryAll(element, section.selector) : [querySection(element, section.selector)].filter(Boolean);
        targets.reverse().forEach((sectionEl) => {
          const hr = document.createElement("hr");
          if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
          sectionEl.before(hr);
        });
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        let anchors = [...element.querySelectorAll(`[${SECTION_MARKER_ATTR}="${section.id}"]`)];
        if (!anchors.length) {
          const el = querySection(element, section.selector);
          anchors = el ? [el] : [];
        }
        anchors.forEach((anchor) => {
          const metadataBlock = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          anchor.after(metadataBlock);
          if (anchor.tagName === "HR") anchor.removeAttribute(SECTION_MARKER_ATTR);
        });
      }
      let first = element.querySelector("hr");
      while (first && !hasContentBefore(first, element)) {
        first.remove();
        first = element.querySelector("hr");
      }
    }
  }

  // tools/importer/import-fraud-form.js
  var parsers = {
    "form-minimal-light": parse,
    "cards-minimal-light-sidenav": parse2
  };
  var transformers = [
    transform,
    transform2
  ];
  var TEMPLATES = {
    "/fraud/fraud-form": {
      "name": "fraud-form",
      "description": "Fraud Prevention > Health Care Fraud Form: Fraud Prevention side nav, h1, intro, required-fields note, then the form-minimal-light block (fields from /fraud/fraud-form-fields.json, built by tools/forms/build-fraud-form-fields.mjs)",
      "urls": [
        "https://www.highmark.com/fraud/fraud-form"
      ],
      "blocks": [
        {
          "name": "cards-minimal-light-sidenav",
          "instances": [
            "div.d-none.d-lg-block.col-lg-3 div.nav-container"
          ]
        },
        {
          "name": "form-minimal-light",
          "instances": [
            "form#fraud-form"
          ]
        }
      ],
      "sections": [
        {
          "id": "1",
          "name": "fraud-form",
          "selector": [
            "main.container"
          ],
          "style": null,
          "blocks": [
            "cards-minimal-light-sidenav",
            "form-minimal-light"
          ],
          "defaultContent": [
            "div.page__par div.cmp-text"
          ]
        }
      ]
    },
    "/fraud-thank-you": {
      "name": "fraud-thank-you",
      "description": "The Health Care Fraud Form confirmation page (the form redirects here): h1 + one paragraph",
      "urls": [
        "https://www.highmark.com/fraud-thank-you"
      ],
      "blocks": [],
      "sections": [
        {
          "id": "1",
          "name": "thank-you",
          "selector": [
            "main"
          ],
          "style": null,
          "blocks": [],
          "defaultContent": [
            "div.cmp-text"
          ]
        }
      ]
    }
  };
  TEMPLATES["/contact-thank-you"] = TEMPLATES["/fraud-thank-you"];
  var PAGE_TEMPLATE = TEMPLATES["/fraud/fraud-form"];
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
  var import_fraud_form_default = {
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
      const pagePath = new URL(params.originalURL).pathname.replace(/\.html?$/, "").replace(/\/$/, "");
      PAGE_TEMPLATE = TEMPLATES[pagePath] || TEMPLATES["/fraud/fraud-form"];
      main.querySelectorAll(".cmp-text p").forEach((p) => {
        if (!p.textContent.trim() && !p.querySelector("img, picture")) p.remove();
      });
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
      meta.template = "legal";
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
  return __toCommonJS(import_fraud_form_exports);
})();
