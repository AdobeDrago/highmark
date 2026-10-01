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

  // tools/importer/import-language-assistance.js
  var import_language_assistance_exports = {};
  __export(import_language_assistance_exports, {
    default: () => import_language_assistance_default
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

  // tools/importer/import-language-assistance.js
  var parsers = {};
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
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
  var import_language_assistance_default = {
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
      const HREFS = { "#English": "#english", "#Spanish": "#espa\xF1ol", "#chinese": "#\u4E2D\u6587", "#french": "#franc\xEAs", "#arabic": "#\u0639\u0631\u0628\u064A", "#Bengali": "#\u09AC\u09BE\u0982\u09B2\u09BE", "#german": "#deutsch", "#igbo": "#igbo", "#Greek": "#\u03B5\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC", "#gujarati": "#\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0", "#hindi": "#\u0939\u093F\u0902\u0926\u0940", "#korean": "#\uD55C\uAD6D\uC5B4", "#italian": "#italiano", "#japanese": "#\u65E5\u672C\u8A9E", "#swahili": "#kiswahili", "#Persian": "#\u0641\u0627\u0631\u0633\u06CC", "#Haitian": "#krey\xF2l-ayisyen", "#nepali": "#nepali", "#polish": "#polski", "#portuguese": "#portugu\xEAs", "#russian": "#\u0440\u0443\u0441\u0441\u043A\u0438\u0439-\u044F\u0437\u044B\u043A", "#tagalog": "#tagalog", "#vietnamese": "#ti\u1EBFng-vi\u1EC7t", "#urdu": "#\u0648\u062F\u0631\u0627", "#Yiddish": "#\u05D9\u05D9\u05D3\u05D9\u05E9", "#yoruba": "#yoruba", "#langtop": "#top" };
      main.querySelectorAll("section#langtop div.gridcontrol").forEach((grid) => {
        const ul = document2.createElement("ul");
        grid.querySelectorAll("a[href]").forEach((a) => {
          const li = document2.createElement("li");
          const link = document2.createElement("a");
          const href = a.getAttribute("href");
          link.setAttribute("href", HREFS[href] || href);
          link.textContent = a.textContent.replace(/\s+/g, " ").trim();
          li.append(link);
          ul.append(li);
        });
        grid.replaceWith(ul);
      });
      main.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (HREFS[href]) a.setAttribute("href", HREFS[href]);
      });
      main.querySelectorAll("section#langtop br").forEach((br) => {
        let next = br.nextSibling;
        while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
        if (!next) br.remove();
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
      meta.template = "language-assistance";
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
  return __toCommonJS(import_language_assistance_exports);
})();
