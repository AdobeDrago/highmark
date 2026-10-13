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

  // tools/importer/import-leadership-bio.js
  var import_leadership_bio_exports = {};
  __export(import_leadership_bio_exports, {
    default: () => import_leadership_bio_default
  });

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
      if (/linkedin\.com/i.test(href)) {
        if (/^https?:\/\//i.test(href)) content.push(linkPara(href, "LinkedIn"));
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
  function parse(element, { document: document2 }) {
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

  // tools/importer/import-leadership-bio.js
  var parsers = {
    "columns-minimal-dark": parse
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    "name": "leadership-bio",
    "description": "Leadership Team & Board bio: one executive per page (photo, name, title, biography)",
    "urls": [
      "https://www.highmark.com/about/our-story/leadership-team-board/EdwardShellard",
      "https://www.highmark.com/about/our-story/leadership-team-board/JaySheehy",
      "https://www.highmark.com/about/our-story/leadership-team-board/JessicaCox",
      "https://www.highmark.com/about/our-story/leadership-team-board/JoeHaddock",
      "https://www.highmark.com/about/our-story/leadership-team-board/Timothy-Vessel",
      "https://www.highmark.com/about/our-story/leadership-team-board/VictorFields",
      "https://www.highmark.com/about/our-story/leadership-team-board/anthony-benevento",
      "https://www.highmark.com/about/our-story/leadership-team-board/dan-tropeano",
      "https://www.highmark.com/about/our-story/leadership-team-board/david-holmberg",
      "https://www.highmark.com/about/our-story/leadership-team-board/gustavo-giraldo",
      "https://www.highmark.com/about/our-story/leadership-team-board/joy-matoney",
      "https://www.highmark.com/about/our-story/leadership-team-board/kate-musler-",
      "https://www.highmark.com/about/our-story/leadership-team-board/mark-lawrence",
      "https://www.highmark.com/about/our-story/leadership-team-board/matthew-rhenish",
      "https://www.highmark.com/about/our-story/leadership-team-board/sarah-marche",
      "https://www.highmark.com/about/our-story/leadership-team-board/thomas-fitzpatrick"
    ],
    "blocks": [
      {
        "name": "columns-minimal-dark",
        "instances": [
          "div.page__par section.flex-container"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "bio",
        "selector": [
          "main.container div.page__par"
        ],
        "style": null,
        "blocks": [
          "columns-minimal-dark"
        ],
        "defaultContent": [
          "div.page__par div.cmp-text"
        ]
      }
    ]
  };
  var LEADERSHIP = "/about/our-story/leadership-team-board";
  function ourPath(pathname) {
    return pathname.replace(/\.html?$/, "").replace(/\/+$/, "").split("/").map((s) => s.toLowerCase().replace(/-+$/, "")).join("/");
  }
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
  var import_leadership_bio_default = {
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
      main.querySelectorAll(".page__par .cmp-text p").forEach((p) => {
        if (!p.textContent.trim() && !p.querySelector("img, picture")) p.remove();
      });
      main.querySelectorAll('.div-bio-header a[href*="linkedin.com"]').forEach((a) => {
        if (!a.textContent.trim()) a.textContent = "LinkedIn";
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
      main.querySelectorAll(".biomodal-content").forEach((popup) => {
        (popup.closest('.biomodal, [id*="modal" i]') || popup).remove();
      });
      main.querySelectorAll("a[href]").forEach((a) => {
        let link;
        try {
          link = new URL(a.getAttribute("href"), "https://www.highmark.com");
        } catch (e) {
          return;
        }
        if (!/^(www\.)?highmark\.com$/.test(link.hostname)) return;
        if (!link.pathname.toLowerCase().startsWith(LEADERSHIP)) return;
        a.setAttribute("href", `${ourPath(link.pathname)}${link.hash}`);
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document2) || {};
      if (crumb) {
        meta.breadcrumbs = "true";
        if (crumbLabel) meta["Breadcrumb Title"] = crumbLabel;
      }
      delete meta.robots;
      delete meta.Robots;
      meta.template = "leadership-bio";
      main.append(WebImporter.Blocks.getMetadataBlock(document2, meta));
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(ourPath(new URL(params.originalURL).pathname));
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
  return __toCommonJS(import_leadership_bio_exports);
})();
