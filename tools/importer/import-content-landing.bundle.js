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

  // tools/importer/import-content-landing.js
  var import_content_landing_exports = {};
  __export(import_content_landing_exports, {
    default: () => import_content_landing_default
  });

  // tools/importer/parsers/columns-minimal-dark-content-landing.js
  var clean = (text) => (text || "").replace(/\s+/g, " ").trim();
  function hasContent(nodes) {
    return nodes.some((n) => clean(n.textContent) !== "" || n.querySelector && n.querySelector("img, picture"));
  }
  function parseRailImage(element, document2) {
    const image = element.querySelector("img.image-comp-img") || element.querySelector("picture, img");
    const contentCell = [];
    const row = element.closest("div.row");
    const par = row ? row.querySelector("div.page__par") : null;
    const h1 = par ? par.querySelector(".cmp-text h1") : null;
    const startCmp = h1 ? h1.closest(".cmp-text") : null;
    if (startCmp) {
      const parts = [startCmp];
      let next = startCmp.nextElementSibling;
      while (next) {
        if (!next.classList.contains("cmp-text")) {
          if (["LINK", "SCRIPT", "STYLE", "META"].includes(next.tagName)) {
            next = next.nextElementSibling;
            continue;
          }
          break;
        }
        const firstHeading = next.querySelector("h1, h2, h3, h4, h5, h6");
        if (firstHeading && firstHeading.tagName !== "H1") break;
        parts.push(next);
        next = next.nextElementSibling;
      }
      parts.forEach((cmp) => {
        cmp.querySelectorAll("link, script, style").forEach((n) => n.remove());
        contentCell.push(...Array.from(cmp.children));
        cmp.remove();
      });
    }
    if (!image && !hasContent(contentCell)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[image ? [image] : [""], contentCell.length ? contentCell : [""]]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-minimal-dark", cells });
    element.replaceWith(block);
  }
  function parseHostCard(element, document2) {
    const image = element.querySelector("img.card-wrapper-img") || element.querySelector("picture, img");
    const contentCell = [];
    const nameEl = element.querySelector("p.hmk-homecardheadertext");
    if (nameEl && clean(nameEl.textContent)) {
      const p = document2.createElement("p");
      const strong = document2.createElement("strong");
      strong.textContent = clean(nameEl.textContent);
      p.append(strong);
      contentCell.push(p);
    }
    const descEl = element.querySelector("p.hmk-homecarddesc");
    if (descEl && clean(descEl.textContent)) {
      const p = document2.createElement("p");
      p.textContent = clean(descEl.textContent);
      contentCell.push(p);
    }
    const cta = element.querySelector("a.textButton[href]");
    if (cta && clean(cta.textContent)) {
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.href = cta.getAttribute("href");
      a.textContent = clean(cta.textContent);
      p.append(a);
      contentCell.push(p);
    }
    const quoteCmp = Array.from(element.querySelectorAll(".cmp-text")).find((c) => !c.closest(".hmk-home_cardwrapper"));
    if (quoteCmp) {
      Array.from(quoteCmp.querySelectorAll("p")).filter((p) => clean(p.textContent)).forEach((p) => contentCell.push(p));
    }
    if (!image && !hasContent(contentCell)) {
      element.replaceWith(...element.childNodes);
      return;
    }
    if (image && !(image.getAttribute("alt") || "").trim() && nameEl && clean(nameEl.textContent)) {
      image.setAttribute("alt", clean(nameEl.textContent));
    }
    const cells = [[image ? [image] : [""], contentCell.length ? contentCell : [""]]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-minimal-dark", cells });
    element.replaceWith(block);
  }
  function parse(element, { document: document2 }) {
    if (element.matches("aside") || element.querySelector("img.image-comp-img")) {
      parseRailImage(element, document2);
    } else {
      parseHostCard(element, document2);
    }
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

  // tools/importer/transformers/highmark-content-landing-cleanup.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var HOME_PREFIX = "/content/digital-marketing/en/highmark/highmarkdotcom/home";
  var HIGHMARK_HOST = /^https?:\/\/(www\.)?highmark\.com(?=[/?#]|$)/i;
  function hasContent2(el) {
    return el.textContent.trim() !== "" || !!el.querySelector("img, picture, video, iframe, table");
  }
  function normalizeHref(href) {
    if (!href) return null;
    let value = href.trim();
    const isAbsolute = HIGHMARK_HOST.test(value);
    if (isAbsolute) value = value.replace(HIGHMARK_HOST, "") || "/";
    else if (!value.startsWith("/") || value.startsWith("//")) return null;
    if (value.startsWith("/content/dam/")) {
      return isAbsolute ? `https://www.highmark.com${value}` : null;
    }
    const match = value.match(/^([^?#]*)(.*)$/);
    let path = match[1];
    const suffix = match[2];
    if (path === HOME_PREFIX || path === `${HOME_PREFIX}.html`) {
      path = "/";
    } else if (path.startsWith(`${HOME_PREFIX}/`)) {
      path = path.substring(HOME_PREFIX.length);
    }
    path = path.replace(/\.html$/i, "") || "/";
    return `${path}${suffix}`;
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      WebImporter.DOMUtils.remove(element, ["div.page__par hr"]);
      WebImporter.DOMUtils.remove(element, [
        "div.spacing",
        "section.spacing-transparent"
      ]);
      element.querySelectorAll("div.video").forEach((v) => {
        if (!hasContent2(v)) v.remove();
      });
      element.querySelectorAll('div.d-none.d-lg-block[class*="col-lg-"]').forEach((rail) => {
        if (!hasContent2(rail)) rail.remove();
      });
      element.querySelectorAll("a[href]").forEach((a) => {
        const normalized = normalizeHref(a.getAttribute("href"));
        if (normalized !== null) a.setAttribute("href", normalized);
      });
      element.querySelectorAll("a:not([href])").forEach((a) => {
        if (!hasContent2(a)) a.remove();
      });
      element.querySelectorAll("div.page__par p br").forEach((br) => {
        const isLast = (n) => {
          let next = n.nextSibling;
          while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
          return !next;
        };
        let parent = br.parentElement;
        while (parent && parent.tagName !== "P" && /^(A|B|STRONG|I|EM|SPAN)$/.test(parent.tagName) && isLast(br)) {
          parent.after(br);
          parent = br.parentElement;
        }
      });
      const par = element.querySelector("div.page__par");
      if (par && !element.querySelector("main h1, div.page__par h1")) {
        const first = par.querySelector("h2, h3, h4, h5, h6");
        if (first) {
          const h1 = first.ownerDocument.createElement("h1");
          while (first.firstChild) h1.appendChild(first.firstChild);
          first.replaceWith(h1);
        }
      }
    }
    if (hookName === TransformHook2.afterTransform) {
      WebImporter.DOMUtils.remove(element, ["script"]);
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
  function transform3(hookName, element, payload) {
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

  // tools/importer/import-content-landing.js
  var parsers = {
    "columns-minimal-dark": parse
  };
  var transformers = [
    transform,
    transform2,
    transform3
  ];
  var PAGE_TEMPLATE = {
    "name": "content-landing",
    "description": "Content landing page: optional left-rail image beside the H1 + intro (podcast cover art), then long-form default content (headings, paragraphs, link lists; podcast episode entries with linked video thumbnails and transcript links) and an optional host card",
    "urls": [
      "https://www.highmark.com/podcast",
      "https://www.highmark.com/public-policy"
    ],
    "blocks": [
      {
        "name": "columns-minimal-dark",
        "instances": [
          "div.d-none.d-lg-block.col-lg-3 aside:has(img.image-comp-img)",
          "div.gridcontrol:has(.hmk-home_cardwrapper)"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "main-content",
        "selector": [
          "main.container > div.row:has(div.page__par)",
          "main.container div.page__par"
        ],
        "style": null,
        "blocks": [
          "columns-minimal-dark"
        ],
        "defaultContent": [
          "div.page__par .cmp-text h1",
          "div.page__par .cmp-text h2",
          "div.page__par .cmp-text h3",
          "div.page__par .cmp-text h4",
          "div.page__par .cmp-text p",
          "div.page__par .cmp-text ul",
          "div.page__par .image img.image-comp-img"
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
  var import_content_landing_default = {
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
      meta.template = "content-landing";
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
  return __toCommonJS(import_content_landing_exports);
})();
