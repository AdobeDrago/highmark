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

  // tools/importer/import-chip-landing.js
  var import_chip_landing_exports = {};
  __export(import_chip_landing_exports, {
    default: () => import_chip_landing_default
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

  // tools/importer/parsers/cards-minimal-dark-withimg-2.js
  function parse5(element, { document: document2 }) {
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

  // tools/importer/transformers/highmark-chip-landing-sections.js
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
  function contentRoot(element) {
    return element.querySelector(".page__par") || element.querySelector("main") || element;
  }
  function removeMobileDuplicates(root) {
    root.querySelectorAll(".quicklinks .quick-link-list-container").forEach((container) => {
      const desktop = container.querySelector(".quick-link-list-inner:not(.quick-link-list-mobile-inner)");
      if (!desktop) return;
      container.querySelectorAll(".quick-link-list-inner.quick-link-list-mobile-inner").forEach((el) => el.remove());
    });
    WebImporter.DOMUtils.remove(root, [
      // hero mobile content wrapper (cleaned.html:1809)
      ".hero.responsivegrid .sub-hero-content-container .left-content.d-block.d-lg-none",
      // onecard1colpanel color bands: mobile h2 + body-text
      ".onecard1colpanel .one-card-content-center-container > .d-block.d-lg-none"
    ]);
  }
  function prepareSharedParsers(root) {
    root.querySelectorAll("div.quicklinks.section").forEach((el) => {
      el.setAttribute("data-iconnav-image-icons", "");
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
      const root = contentRoot(element);
      removeMobileDuplicates(root);
      prepareSharedParsers(root);
      WebImporter.DOMUtils.remove(root, ["div.zipcodegate.section"]);
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

  // tools/importer/import-chip-landing.js
  var parsers = {
    "hero-minimal-dark-withimg": parse,
    "cards-minimal-dark-iconnav": parse2,
    "cards-minimal-dark-withimg-icons": parse3,
    "columns-minimal-dark": parse4,
    "cards-minimal-dark-withimg-2": parse5
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    "name": "chip-landing",
    "description": "Western PA CHIP landing page: photo hero, navy icon quick-link bar, colour bands with centred CTAs, small-icon card list, image/text support panel, two wide help cards",
    "urls": [
      "https://www.highmark.com/western-pennsylvania/chip?zg=false"
    ],
    "blocks": [
      {
        "name": "hero-minimal-dark-withimg",
        "instances": [
          "div.hero.responsivegrid.section"
        ]
      },
      {
        "name": "cards-minimal-dark-iconnav",
        "instances": [
          "div.quicklinks.section"
        ]
      },
      {
        "name": "cards-minimal-dark-withimg-icons",
        "instances": [
          "section.container-fluid-fullwidth.section:has(li.listSmlImg)"
        ]
      },
      {
        "name": "columns-minimal-dark",
        "instances": [
          "div.newcardscomponent-variations.section:has(.side-card-panel)"
        ]
      },
      {
        "name": "cards-minimal-dark-withimg-2",
        "instances": [
          "div.newcardscomponent-variations.section:has(.cards-variation)"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "hero",
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
        "id": "2",
        "name": "quicklinks",
        "selector": [
          "div.quicklinks.section"
        ],
        "style": null,
        "blocks": [
          "cards-minimal-dark-iconnav"
        ],
        "defaultContent": []
      },
      {
        "id": "3",
        "name": "understanding-band",
        "selector": [
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash)"
        ],
        "style": "light-blue, center",
        "blocks": [],
        "defaultContent": [
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash) h2",
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash) p",
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash) a"
        ]
      },
      {
        "id": "4",
        "name": "get-care",
        "selector": [
          "section.container-fluid-fullwidth.section:has(li.listSmlImg)"
        ],
        "style": "center",
        "blocks": [
          "cards-minimal-dark-withimg-icons"
        ],
        "defaultContent": [
          "section.container-fluid-fullwidth.section:has(li.listSmlImg) h2.cardsTitle",
          "section.container-fluid-fullwidth.section:has(li.listSmlImg) p.cardsPara"
        ]
      },
      {
        "id": "5",
        "name": "renew-band",
        "selector": [
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive)"
        ],
        "style": "highlight, center",
        "blocks": [],
        "defaultContent": [
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive) h2",
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive) p",
          "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive) a"
        ]
      },
      {
        "id": "6",
        "name": "enhanced-supports",
        "selector": [
          "div.newcardscomponent-variations.section:has(.side-card-panel)"
        ],
        "style": "light",
        "blocks": [
          "columns-minimal-dark"
        ],
        "defaultContent": []
      },
      {
        "id": "7",
        "name": "promo-cards",
        "selector": [
          "div.newcardscomponent-variations.section:has(.cards-variation)"
        ],
        "style": null,
        "blocks": [
          "cards-minimal-dark-withimg-2"
        ],
        "defaultContent": []
      },
      {
        "id": "8",
        "name": "get-covered-cta",
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
  var import_chip_landing_default = {
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
      meta["Breadcrumb Title"] = "CHIP - Highmark Healthy Kids";
      meta.template = "chip-landing";
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
  return __toCommonJS(import_chip_landing_exports);
})();
