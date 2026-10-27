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

  // tools/importer/import-about-article.js
  var import_about_article_exports = {};
  __export(import_about_article_exports, {
    default: () => import_about_article_default
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
    const topItems = Array.from(element.querySelectorAll("ul.sidenav-item-list > li"));
    const flat = !element.querySelector("a.side-nav-item-parent") && topItems.length > 1 && topItems.every((li) => li.classList.contains("sidenav-item-level1") && !li.querySelector("ul"));
    if (flat) {
      topItems.forEach((li) => {
        const a = li.querySelector("a[href]");
        if (!a) return;
        const isActive = a.classList.contains("active") || a.getAttribute("aria-current") === "page";
        cells.push(rowFor(isActive ? "current" : "sibling", a));
      });
      element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "cards-minimal-light-sidenav", cells }));
      return;
    }
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

  // tools/importer/import-about-article.js
  function sidenavParser(element, { document: document2, url, params }) {
    const list = element.querySelector(".sidenav-item-list");
    const items = list ? [...list.querySelectorAll(":scope > li.sidenav-item-level1")] : [];
    if (!items.length) {
      parse(element, { document: document2, url, params });
      return;
    }
    const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
    const link = (a) => {
      const el = document2.createElement("a");
      el.setAttribute("href", (a.getAttribute("href") || "").replace(/^https:\/\/www\.highmark\.com/, "").replace(/^\/content\/digital-marketing\/en\/highmark\/highmarkdotcom\/home/, "").replace(/\.html$/, "").replace(/(.)\/$/, "$1") || "/");
      el.textContent = clean(a.textContent);
      return el;
    };
    const linkOf = (li) => li.querySelector(":scope > a, :scope > .sidenav-item-row > a");
    const cells = [];
    const parent = list.querySelector("a.side-nav-item-parent");
    if (parent) cells.push(["parent", link(parent)]);
    items.forEach((li) => {
      var _a;
      const a = linkOf(li);
      if (!a) return;
      const active = a.classList.contains("active") || a.getAttribute("aria-current") === "page";
      cells.push([active ? "current" : "sibling", link(a)]);
      [...((_a = li.querySelector(":scope > ul.subnavitem-list")) == null ? void 0 : _a.children) || []].forEach((c) => {
        const ca = linkOf(c);
        if (ca) cells.push(["child", link(ca)]);
      });
    });
    element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "cards-minimal-light-sidenav", cells }));
  }
  var parsers = {
    "cards-minimal-light-sidenav": sidenavParser
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    "name": "about-article",
    "description": "About / Corporate Responsibility article: left section navigation, long-form article (headings, paragraphs, lists, images) and an optional right-rail callout",
    "urls": [
      "https://www.highmark.com/about/our-story",
      "https://www.highmark.com/about/our-story/mission-vision",
      "https://www.highmark.com/about/our-story/our-businesses",
      "https://www.highmark.com/about/corporate-responsibility",
      "https://www.highmark.com/about/corporate-responsibility/valuing-our-people",
      "https://www.highmark.com/about/corporate-responsibility/social-determinants-of-health",
      "https://www.highmark.com/about/corporate-responsibility/sustainability",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/happenings",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/community-health",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/community-economic-resilience",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/community-health-employee-programs",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-bright-blue-futures-community-reports",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/corporate-giving",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-caring-place",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-delaware-blueprints",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/blue-fund",
      "https://www.highmark.com/about/corporate-responsibility/sustainability/what-you-can-do",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-bright-blue-futures-awards",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-neny-giving",
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures/highmark-wny-giving"
    ],
    "blocks": [
      {
        "name": "cards-minimal-light-sidenav",
        "instances": [
          "div.col-lg-3 div.nav-container:has(.sidenav-item-list)",
          "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)",
          "div.d-none.d-lg-block.col-lg-3 div.nav-container"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "sidenav",
        "selector": [
          "div.col-lg-3 div.nav-container:has(.sidenav-item-list)",
          "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)",
          "div.d-none.d-lg-block.col-lg-3 div.nav-container"
        ],
        "style": null,
        "blocks": [
          "cards-minimal-light-sidenav"
        ],
        "defaultContent": []
      },
      {
        "id": "2",
        "name": "article",
        "selector": [
          "div.col-lg-9 > div.row > div.col-lg-9 div.page__par",
          "div.col-lg-9 div.page__par"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": []
      },
      {
        "id": "3",
        "name": "right-rail",
        "selector": [
          "div.rightRail"
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
  var import_about_article_default = {
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
      main.querySelectorAll(".hmk-brand-buttons a.textButton").forEach((a) => {
        const em = document2.createElement("em");
        em.append(...a.childNodes);
        a.append(em);
      });
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
      const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
      const headingId = (t) => clean(t).toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
      main.querySelectorAll('a[href^="#"]:not([href="#"]):not([href="#top"])').forEach((a) => {
        const id = a.getAttribute("href").slice(1);
        if (main.querySelector(`[id="${id}"], a[name="${id}"]`)) return;
        const text = clean(a.textContent).toLowerCase();
        const heading = [...main.querySelectorAll("h2, h3, h4")].find((h) => clean(h.textContent) && text.startsWith(clean(h.textContent).toLowerCase()));
        if (heading) a.setAttribute("href", `#${headingId(heading.textContent)}`);
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document2) || {};
      if (crumb) {
        meta.breadcrumbs = "true";
        if (crumbLabel) meta["Breadcrumb Title"] = crumbLabel;
      }
      meta.template = "about-article";
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
  return __toCommonJS(import_about_article_exports);
})();
