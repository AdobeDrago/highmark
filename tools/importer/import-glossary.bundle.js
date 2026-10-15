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

  // tools/importer/import-glossary.js
  var import_glossary_exports = {};
  __export(import_glossary_exports, {
    default: () => import_glossary_default
  });

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

  // tools/importer/transformers/highmark-glossary-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var clean = (text) => (text || "").replace(/\s+/g, " ").trim();
  function marker(document, id) {
    const hr = document.createElement("hr");
    if (id) hr.setAttribute(SECTION_MARKER_ATTR, id);
    return hr;
  }
  function heroBlock(document, hero) {
    const h1 = document.createElement("h1");
    h1.textContent = clean(hero.querySelector("h1").textContent);
    const cell = [h1];
    const lead = hero.querySelector("span.p1");
    if (lead) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = clean(lead.textContent);
      p.append(strong);
      cell.push(p);
    }
    return WebImporter.Blocks.createBlock(document, { name: "hero-minimal-light", cells: [[cell]] });
  }
  function letterBar(document, glossary) {
    const ul = document.createElement("ul");
    glossary.querySelectorAll(".glossary-name-list a.glossary-name-item").forEach((a) => {
      const letter = clean(a.textContent).toUpperCase();
      const li = document.createElement("li");
      if (a.classList.contains("disabled")) {
        li.textContent = letter;
      } else {
        const link = document.createElement("a");
        link.href = `#${letter.toLowerCase()}`;
        link.textContent = letter;
        li.append(link);
      }
      ul.append(li);
    });
    return ul;
  }
  function letterGroups(document, glossary) {
    const content = [];
    glossary.querySelectorAll(".glossary-list-item").forEach((item) => {
      var _a, _b, _c;
      const terms = [...item.querySelectorAll("li.glossary-link-item")];
      const key = clean((_a = item.querySelector(".glossary-list-key")) == null ? void 0 : _a.textContent) || clean((_c = (_b = terms[0]) == null ? void 0 : _b.querySelector("h3")) == null ? void 0 : _c.textContent).charAt(0);
      const h2 = document.createElement("h2");
      h2.textContent = key.toUpperCase();
      content.push(h2);
      terms.forEach((term) => {
        const h3 = document.createElement("h3");
        h3.textContent = clean(term.querySelector("h3").textContent);
        content.push(h3);
        const text = term.querySelector(":scope > div");
        if (text) content.push(...text.childNodes);
      });
      const p = document.createElement("p");
      const top = document.createElement("a");
      top.href = "#top";
      top.textContent = "Back to Top";
      p.append(top);
      content.push(p);
    });
    return content;
  }
  function transform2(hookName, element, payload) {
    const { document } = payload;
    if (hookName === "beforeTransform") {
      element.querySelectorAll("a .global-clr_externallink").forEach((span) => {
        span.replaceWith(document.createTextNode(" :external-link:"));
      });
      element.querySelectorAll("a *").forEach((el) => {
        if (/^opens a new tab or window$/i.test(clean(el.textContent))) el.remove();
      });
      const hero = element.querySelector("section.new-hmk-brand-fifteenpercent-splash");
      const glossary = element.querySelector("div.glossary");
      if (!hero || !glossary) return;
      const bar = letterBar(document, glossary);
      const groups = letterGroups(document, glossary);
      hero.replaceWith(heroBlock(document, hero));
      glossary.replaceWith(
        marker(document, "glossary-letters"),
        bar,
        marker(document, "glossary"),
        ...groups
      );
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll(`[${SECTION_MARKER_ATTR}]`).forEach((hr) => {
        const style = hr.getAttribute(SECTION_MARKER_ATTR);
        hr.removeAttribute(SECTION_MARKER_ATTR);
        hr.after(WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style }
        }));
      });
    }
  }

  // tools/importer/import-glossary.js
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "glossary",
    description: "Health Insurance Glossary: breadcrumbs with Print / Share, a hero with the H1 and a lead intro, an A\u2013Z bar, and one group per letter (letter badge, terms, Back to Top)",
    urls: [
      "https://www.highmark.com/resources/answers/health-insurance-glossary"
    ],
    blocks: [
      { name: "hero-minimal-light", instances: ["section.new-hmk-brand-fifteenpercent-splash"] },
      { name: "section-glossary-letters", instances: ["div.glossary .glossary-name-list"], section: "glossary-letters" },
      { name: "section-glossary", instances: ["div.glossary .glossary-list"], section: "glossary" }
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
  var import_glossary_default = {
    /**
     * Non-breaking spaces in text keep the source's line breaks, but the importer drops
     * them (see import-faq-topic.js): on the live page each becomes U+E000, which
     * upload-to-da.mjs turns back into &nbsp;. Text that is only spaces is left alone.
     */
    onLoad: ({ document }) => {
      const walker = document.createTreeWalker(
        document.body,
        4
        /* NodeFilter.SHOW_TEXT */
      );
      const texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      texts.filter((t) => t.nodeValue.includes("\xA0") && /[^\s\u00a0]/.test(t.nodeValue)).forEach((t) => {
        t.nodeValue = t.nodeValue.replace(/\u00a0/g, "\uE000");
      });
    },
    transform: (payload) => {
      const {
        document,
        url,
        params
      } = payload;
      const main = document.body;
      const crumb = document.querySelector("ol.breadcrumb-list li.active");
      const crumbLabel = ((crumb == null ? void 0 : crumb.textContent) || "").replace(/\s+/g, " ").trim();
      executeTransformers("beforeTransform", main, payload);
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document) || {};
      meta.Template = "glossary";
      meta.breadcrumbs = "true";
      if (crumbLabel) meta["Breadcrumb Title"] = crumbLabel;
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: ["hero-minimal-light"]
        }
      }];
    }
  };
  return __toCommonJS(import_glossary_exports);
})();
