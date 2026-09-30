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

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-minimal-dark-withimg.js
  function parse(element, { document: document2 }) {
    var _a;
    const banner = element.querySelector(".secondaryBannerContent");
    if (banner) {
      const bannerImg = banner.querySelector("img.desktopImage") || banner.querySelector("picture img, img");
      const wrapper = banner.querySelector(".contentWrapper") || banner;
      const pick = (sel) => wrapper.querySelector(`${sel}.d-lg-block`) || wrapper.querySelector(sel);
      const clean = (el) => {
        if (!el) return null;
        const h = document2.createElement(el.tagName.toLowerCase());
        h.textContent = el.textContent.replace(/\s+/g, " ").trim();
        return h;
      };
      const title = clean(pick("h1.bannerHeadingText") || wrapper.querySelector("h1"));
      const sub = clean(pick(".bannerSubHeadingText"));
      const ctas = Array.from(wrapper.querySelectorAll(".buttonGroup a[href]"));
      if (!title && !sub && !bannerImg) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const bannerCells = [];
      if (bannerImg) bannerCells.push([bannerImg]);
      bannerCells.push([[title, sub, ...ctas].filter(Boolean)]);
      element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "hero-minimal-dark-withimg", cells: bannerCells }));
      return;
    }
    const bgImage = element.querySelector('picture img, img[class*="image"], img');
    const heroWrapper = element.querySelector(".left-content.d-lg-block .content-wrapper") || element.querySelector(".left-content .content-wrapper") || element.querySelector(".content-wrapper");
    const contentWrapper = heroWrapper || element.querySelector(".one-card-content-left-container") || element;
    let heading = contentWrapper.querySelector('h1, h2, .banner-heading, [class*="banner-heading"]');
    if (!heroWrapper && heading && /\bd-none\b|\bd-lg-none\b/.test(heading.className || "")) {
      const cleanHeading = document2.createElement(heading.tagName.toLowerCase());
      cleanHeading.append(...heading.childNodes);
      heading = cleanHeading;
    }
    const subheading = contentWrapper.querySelector('h2.banner-sub-heading-sub, h3.banner-sub-heading-sub, .banner-sub-heading-sub, [class*="sub-heading"]');
    const ctaLinks = Array.from(contentWrapper.querySelectorAll('a.button, a.cta, a[class*="cta"], a[class*="button"]'));
    if (!heroWrapper && bgImage) {
      const desktopSource = (_a = bgImage.closest("picture")) == null ? void 0 : _a.querySelector('source[media*="992"][srcset]');
      const desktopSrc = desktopSource && desktopSource.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0];
      if (desktopSrc) bgImage.setAttribute("src", desktopSrc);
    }
    const bodyParas = [];
    if (!heroWrapper && !subheading) {
      const bodyText = contentWrapper.querySelector(".body-text.d-lg-block") || contentWrapper.querySelector(".body-text");
      if (bodyText) {
        const paras = Array.from(bodyText.querySelectorAll(":scope > p"));
        if (paras.length) {
          bodyParas.push(...paras);
        } else if (bodyText.textContent.trim()) {
          const p = document2.createElement("p");
          p.append(...bodyText.childNodes);
          bodyParas.push(p);
        }
      }
    }
    if (!heading && !subheading && !bgImage) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) {
      cells.push([bgImage]);
    }
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (subheading) contentCell.push(subheading);
    contentCell.push(...bodyParas);
    contentCell.push(...ctaLinks);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-minimal-dark-withimg", cells });
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

  // tools/importer/parsers/cards-minimal-dark-withimg.js
  function parse3(element, { document: document2 }) {
    const introEls = [];
    const introContainer = element.querySelector(".cardBlockTitleContainer");
    if (introContainer) {
      const introHeading = introContainer.querySelector("h1, h2, h3");
      const introDesc = introContainer.querySelector(".cardDescription, p");
      if (introHeading) introEls.push(introHeading);
      if (introDesc) introEls.push(introDesc);
    }
    let cards = Array.from(element.querySelectorAll(".card.cardBlock, .cardBlock, .card"));
    if (!cards.length) {
      const people = Array.from(element.querySelectorAll("section.hmk-home_cardwrapper"));
      if (people.length) {
        const peopleCells = people.map((person) => {
          const photo = person.querySelector("img");
          const nameLink = person.querySelector(".hmk-cardwrapper_title a");
          const h3 = document2.createElement("h3");
          if (nameLink) {
            const a = document2.createElement("a");
            a.setAttribute("href", nameLink.getAttribute("href"));
            a.textContent = nameLink.textContent.trim();
            h3.append(a);
          }
          const text = [h3];
          const desc = person.querySelector("p.hmk-homecarddesc");
          if (desc) text.push(desc);
          person.querySelectorAll(".hmk-brand-buttons a[href]").forEach((a) => {
            const p = document2.createElement("p");
            const link = document2.createElement("a");
            link.setAttribute("href", a.getAttribute("href"));
            link.textContent = a.querySelector(".fa-linkedin") ? "LinkedIn" : a.textContent.trim();
            p.append(link);
            text.push(p);
          });
          return [photo || "", text];
        });
        element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "cards-minimal-dark-withimg", cells: peopleCells }));
        return;
      }
    }
    if (!cards.length) {
      cards = Array.from(element.querySelectorAll("li.cardThree")).filter((li) => li.querySelector("picture, img"));
      if (cards.length) {
        const introHeading = element.querySelector("h2.cardsTitle");
        if (introHeading) introEls.push(introHeading);
        introEls.push(...Array.from(element.querySelectorAll("p.cardsPara")));
      }
    }
    if (cards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const unwrapDeadHeadingLinks = (heading) => {
      if (!heading) return;
      heading.querySelectorAll("a").forEach((a) => {
        const href = (a.getAttribute("href") || "").trim();
        if (!href || href === "#") {
          a.replaceWith(...a.childNodes);
        }
      });
    };
    const cells = [];
    cards.forEach((card) => {
      const image = card.querySelector("picture, img");
      const heading = card.querySelector('h1, h2, h3, h4, [class*="title"]');
      unwrapDeadHeadingLinks(heading);
      const paragraphs = Array.from(card.querySelectorAll(".cardText > p, p"));
      const links = Array.from(card.querySelectorAll('a.textButton, a.button, a[class*="button"], a')).filter((a) => {
        const href = (a.getAttribute("href") || "").trim();
        return href && href !== "#";
      });
      const contentCell = [];
      if (heading) contentCell.push(heading);
      contentCell.push(...paragraphs);
      contentCell.push(...links);
      cells.push([image || "", contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-minimal-dark-withimg", cells });
    element.replaceWith(...introEls, block);
  }

  // tools/importer/parsers/columns-minimal-dark.js
  function parse4(element, { document: document2 }) {
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

  // tools/importer/transformers/highmark-home-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var SECTIONS = [
    { id: "section-hero", selector: "div.hero.responsivegrid.section" },
    { id: "section-iconnav", selector: "div.quicklinks.section" },
    { id: "section-cards2", selector: ".card-block.responsivegrid:has(.wideCardWrapper)", style: "accent" },
    { id: "section-mentalhealth", selector: 'div.one-card-one-col-panel.image.new-hmk-brand-polar:has(a[href*="mental-health"])', style: "accent" },
    { id: "section-app", selector: ".card-block.responsivegrid:has(.cardWrapper.ghostMode)" },
    { id: "section-findcare", selector: ".side-card-panel", style: "highlight" },
    { id: "section-building", selector: ".card-block.responsivegrid:not(:has(.wideCardWrapper)):not(:has(.ghostMode))" },
    { id: "section-group", selector: 'div.one-card-one-col-panel.image.new-hmk-brand-polar:has(a[href*="employer"])', style: "accent" }
  ];
  function transform2(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      SECTIONS.forEach((section) => {
        let matches;
        try {
          matches = element.querySelectorAll(section.selector);
        } catch (e) {
          return;
        }
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
        let anchor = marker;
        if (!anchor) {
          try {
            anchor = element.querySelector(section.selector);
          } catch (e) {
            anchor = null;
          }
        }
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

  // tools/importer/import-home.js
  var parsers = {
    "hero-minimal-dark-withimg": parse,
    "cards-minimal-dark-iconnav": parse2,
    "cards-minimal-dark-withimg": parse3,
    "columns-minimal-dark": parse4
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "home",
    description: "Highmark home page: hero banner, icon quick-nav bar, alternating card grids and image/text promo panels, and a group-insurance CTA panel",
    urls: [
      "https://www.highmark.com"
    ],
    blocks: [
      { name: "hero-minimal-dark-withimg", instances: ["div.hero.responsivegrid.section"] },
      { name: "cards-minimal-dark-iconnav", instances: ["div.quicklinks.section", ".quick-link-list-container.bg-blue"] },
      {
        name: "cards-minimal-dark-withimg",
        instances: [
          ".card-block.responsivegrid:has(.wideCardWrapper)",
          ".card-block.responsivegrid:has(.cardWrapper.ghostMode)",
          ".card-block.responsivegrid:not(:has(.wideCardWrapper)):not(:has(.ghostMode))"
        ]
      },
      { name: "columns-minimal-dark", instances: ["div.one-card-one-col-panel.image", ".side-card-panel"] }
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
  var import_home_default = {
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
  return __toCommonJS(import_home_exports);
})();
