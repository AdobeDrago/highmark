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

  // tools/importer/import-bright-blue-futures.js
  var import_bright_blue_futures_exports = {};
  __export(import_bright_blue_futures_exports, {
    default: () => import_bright_blue_futures_default
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
    const subHero = element.matches(".sub-hero-sec") ? element : element.querySelector(".sub-hero-sec");
    const options = [];
    if (subHero) {
      options.push("sub");
      if (subHero.querySelector('.left-content.d-lg-none[class*="brand-togather"]')) options.push("navy");
      if (subHero.querySelector('.left-content.d-lg-block [class*="white-text"]')) options.push("light");
    }
    const name = options.length ? `hero-minimal-dark-withimg (${options.join(", ")})` : "hero-minimal-dark-withimg";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-minimal-dark.js
  function parse2(element, { document: document2 }) {
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

  // tools/importer/parsers/cards-minimal-dark-withimg-icons.js
  function parse3(element, { document: document2 }) {
    const hasHref = (a) => {
      const href = (a.getAttribute("href") || "").trim();
      return !!href && href !== "#";
    };
    const unwrapDeadAnchors = (root) => {
      if (!root) return;
      root.querySelectorAll("a").forEach((a) => {
        if (!hasHref(a)) a.replaceWith(...a.childNodes);
      });
    };
    let cards = Array.from(element.querySelectorAll(".cardWrapper > .card.cardBlock"));
    if (!cards.length) cards = Array.from(element.querySelectorAll(".card.cardBlock, .cardBlock"));
    let smlImgList = false;
    if (!cards.length) {
      cards = Array.from(element.querySelectorAll("li.listSmlImg"));
      smlImgList = cards.length > 0;
    }
    if (!cards.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const introEls = [];
    const introContainer = element.querySelector(".cardBlockTitleContainer");
    if (smlImgList) {
      const introHeading = element.querySelector("h2.cardsTitle");
      if (introHeading) {
        unwrapDeadAnchors(introHeading);
        introEls.push(introHeading);
      }
      introEls.push(...Array.from(element.querySelectorAll("p.cardsPara")));
    } else if (introContainer) {
      const introHeading = introContainer.querySelector("h1, h2, h3");
      if (introHeading) {
        unwrapDeadAnchors(introHeading);
        introEls.push(introHeading);
      }
      const introDesc = introContainer.querySelector(".cardDescription");
      if (introDesc) {
        const descParas = Array.from(introDesc.querySelectorAll(":scope > p"));
        if (descParas.length) {
          introEls.push(...descParas);
        } else if (introDesc.textContent.trim()) {
          const p = document2.createElement("p");
          p.append(...introDesc.childNodes);
          introEls.push(p);
        }
      } else {
        const p = introContainer.querySelector("p");
        if (p) introEls.push(p);
      }
    }
    const trailingEls = [];
    Array.from(element.querySelectorAll(".hmk-brand-buttons.brand-center-content a")).filter((a) => !a.closest(".card, .cardBlock, .cardWrapper, li.listSmlImg")).forEach((a) => {
      const p = document2.createElement("p");
      if (hasHref(a)) {
        p.append(a);
      } else {
        p.append(...a.childNodes);
      }
      trailingEls.push(p);
    });
    const cells = [];
    cards.forEach((card) => {
      const image = card.querySelector("picture, img");
      const textRoot = card.querySelector(".cardText") || smlImgList && card.querySelector(":scope > div") || card;
      const heading = textRoot.querySelector("h1, h2, h3, h4, h5, h6");
      unwrapDeadAnchors(heading);
      let paragraphs = Array.from(textRoot.querySelectorAll(":scope > p"));
      if (!paragraphs.length) {
        paragraphs = Array.from(textRoot.querySelectorAll("p")).filter((p) => !p.closest(".hmk-brand-buttons"));
      }
      const ctas = Array.from(textRoot.querySelectorAll(".hmk-brand-buttons a, a.textButton")).filter((a, i, arr) => arr.indexOf(a) === i).filter((a) => !paragraphs.some((p) => p.contains(a)));
      const contentCell = [];
      if (heading) contentCell.push(heading);
      contentCell.push(...paragraphs);
      ctas.forEach((a) => {
        const p = document2.createElement("p");
        if (hasHref(a)) {
          p.append(a);
        } else {
          p.append(...a.childNodes);
        }
        contentCell.push(p);
      });
      cells.push([image || "", contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-minimal-dark-withimg-icons", cells });
    element.replaceWith(...introEls, block, ...trailingEls);
  }

  // tools/importer/parsers/cards-minimal-dark-withimg-2.js
  function parse4(element, { document: document2 }) {
    const cards = Array.from(element.querySelectorAll("li.listWideImg, .listWideImg, .cardul > li"));
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
      const heading = card.querySelector('h1, h2, h3, h4, [class*="titleHead"]');
      unwrapDeadHeadingLinks(heading);
      const paragraphs = Array.from(card.querySelectorAll(".wideCardText p, .type2Txt p, p"));
      const links = Array.from(card.querySelectorAll('a.textButton, a.button, a[class*="button"], a[href]')).filter((a) => !paragraphs.some((p) => p.contains(a)));
      const contentCell = [];
      if (heading) contentCell.push(heading);
      contentCell.push(...paragraphs);
      links.forEach((a) => {
        const label = a.previousElementSibling;
        if (label && label.matches("span.wideCardTextTwo") && label.textContent.trim()) {
          const p = document2.createElement("p");
          p.append(`${label.textContent.trim()} `, a);
          contentCell.push(p);
        } else {
          contentCell.push(a);
        }
      });
      cells.push([image || "", contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-minimal-dark-withimg-2", cells });
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

  // tools/importer/import-bright-blue-futures.js
  var parsers = {
    "hero-minimal-dark-withimg": parse,
    "columns-minimal-dark": parse2,
    "cards-minimal-dark-withimg-icons": parse3,
    "cards-minimal-dark-withimg-2": parse4
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    "name": "bright-blue-futures",
    "description": "Bright Blue Futures corporate-giving landing: photo hero, logo, alternating white/polar side panels, illustration cards, blush report CTA, wide program cards, splash CTA band, video disclaimer footnote.",
    "urls": [
      "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures"
    ],
    "blocks": [
      {
        "name": "hero-minimal-dark-withimg",
        "instances": [
          "div.hero.responsivegrid.section"
        ]
      },
      {
        "name": "columns-minimal-dark",
        "instances": [
          "div.newcardscomponent-variations.section:has(.side-card-panel)"
        ]
      },
      {
        "name": "cards-minimal-dark-withimg-icons",
        "instances": [
          "div.newcardscomponent-variations.section:has(li.listSmlImg)"
        ]
      },
      {
        "name": "cards-minimal-dark-withimg-2",
        "instances": [
          "div.newcardscomponent-variations.section:has(li.listWideImg)"
        ]
      }
    ],
    "sections": [
      {
        "id": "hero",
        "name": "Hero",
        "selector": [
          "div.hero.responsivegrid.section"
        ],
        "style": null,
        "blocks": [
          "hero-minimal-dark-withimg"
        ],
        "defaultContent": []
      },
      {
        "id": "logo",
        "name": "Logo",
        "selector": [
          "section.container-fluid-fullwidth.section:has(img.image-comp-img)"
        ],
        "style": "center",
        "blocks": [],
        "defaultContent": [
          "img.image-comp-img"
        ]
      },
      {
        "id": "side-panel-white",
        "name": "Side panel (white)",
        "selector": [
          "div.newcardscomponent-variations.section:has(.side-card-panel:not(.new-hmk-brand-polar))"
        ],
        "style": null,
        "blocks": [
          "columns-minimal-dark"
        ],
        "defaultContent": [],
        "repeat": true
      },
      {
        "id": "side-panel-polar",
        "name": "Side panel (polar band)",
        "selector": [
          "div.newcardscomponent-variations.section:has(.side-card-panel.new-hmk-brand-polar)"
        ],
        "style": "light",
        "blocks": [
          "columns-minimal-dark"
        ],
        "defaultContent": [],
        "repeat": true
      },
      {
        "id": "focus-areas",
        "name": "Focus areas cards",
        "selector": [
          "div.newcardscomponent-variations.section:has(li.listSmlImg)"
        ],
        "style": "center",
        "blocks": [
          "cards-minimal-dark-withimg-icons"
        ],
        "defaultContent": [
          "div.newcardscomponent-variations.section:has(li.listSmlImg) h2.cardsTitle",
          "div.newcardscomponent-variations.section:has(li.listSmlImg) p.cardsPara"
        ]
      },
      {
        "id": "impact-report",
        "name": "Community Impact Report (blush)",
        "selector": [
          "section.container-fluid-fullwidth.section:has(.new-hmk-brand-blush-twnetyfive)"
        ],
        "style": "highlight, center",
        "blocks": [],
        "defaultContent": [
          ".one-card-content-center-container h2.d-lg-block",
          ".one-card-content-center-container .body-text.d-lg-block",
          ".hmk-brand-buttons a"
        ]
      },
      {
        "id": "program-cards",
        "name": "Program wide cards",
        "selector": [
          "div.newcardscomponent-variations.section:has(li.listWideImg)"
        ],
        "style": null,
        "blocks": [
          "cards-minimal-dark-withimg-2"
        ],
        "defaultContent": []
      },
      {
        "id": "blue-fund",
        "name": "Introducing Blue Fund (splash)",
        "selector": [
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash)"
        ],
        "style": "light-blue, center",
        "blocks": [],
        "defaultContent": [
          ".one-card-content-center-container h2.d-lg-block",
          ".one-card-content-center-container .body-text.d-lg-block",
          ".hmk-brand-buttons a"
        ]
      },
      {
        "id": "footnotes",
        "name": "Video disclaimer footnote",
        "selector": [
          "section.container-fluid-fullwidth.section:has(> div.container):has(.cmp-text)"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".cmp-text p"
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
  var import_bright_blue_futures_default = {
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
      meta.template = "bright-blue-futures";
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
  return __toCommonJS(import_bright_blue_futures_exports);
})();
