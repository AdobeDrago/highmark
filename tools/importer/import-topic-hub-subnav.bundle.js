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

  // tools/importer/import-topic-hub-subnav.js
  var import_topic_hub_subnav_exports = {};
  __export(import_topic_hub_subnav_exports, {
    default: () => import_topic_hub_subnav_default
  });

  // tools/importer/parsers/hero-minimal-dark-withimg.js
  function parse(element, { document: document2 }) {
    var _a;
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

  // tools/importer/parsers/columns-minimal-dark.js
  function parse3(element, { document: document2 }) {
    const textArea = element.querySelector(".text-area") || element;
    const imageArea = element.querySelector(".image-area") || element;
    const image = imageArea.querySelector("picture, img");
    const heading = textArea.querySelector("h1, h2, h3, h4");
    const bodyBlocks = Array.from(textArea.querySelectorAll(":scope > div"));
    const links = Array.from(textArea.querySelectorAll('a.textButton, a.button, a[class*="button"], a[href]'));
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

  // tools/importer/parsers/cards-minimal-dark-withimg.js
  function parse4(element, { document: document2 }) {
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

  // tools/importer/parsers/cards-minimal-dark-list.js
  function parse5(element, { document: document2 }) {
    const introEls = [];
    const introHeading = element.querySelector("h2.cardsTitle, .cardsTitle, h1, h2");
    const introDesc = element.querySelector("p.cardsPara, .cardsPara, .container-sm-img > div > p");
    if (introHeading) introEls.push(introHeading);
    if (introDesc) introEls.push(introDesc);
    const cards = Array.from(element.querySelectorAll("li.cardThree, .cardThree"));
    if (cards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cards.forEach((card) => {
      const heading = card.querySelector('h3, h2, h4, [class*="titleHead"]');
      const listWrap = card.querySelector("span.cardsText, .cardsText");
      const list = listWrap ? listWrap.querySelector("ul, ol") : card.querySelector(".typeThreeTxt ul, .typeThreeTxt ol");
      const cta = card.querySelector('a.textButton, a.button, a[class*="button"], .hmk-brand-buttons a, a');
      const contentCell = [];
      if (heading) contentCell.push(heading);
      if (list) contentCell.push(list);
      if (cta) {
        const link = document2.createElement("a");
        link.setAttribute("href", cta.getAttribute("href") || "");
        link.textContent = (cta.textContent || "").trim();
        contentCell.push(link);
      }
      cells.push([contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-minimal-dark-list", cells });
    element.replaceWith(...introEls, block);
  }

  // tools/importer/parsers/cards-minimal-dark-withimg-2.js
  function parse6(element, { document: document2 }) {
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

  // tools/importer/parsers/cards-minimal-dark-withimg-icons.js
  function parse7(element, { document: document2 }) {
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

  // tools/importer/parsers/columns-minimal-dark-overlay.js
  function parse8(element, { document: document2 }) {
    const panel = element.querySelector(".one-card-one-col-panel.image") || element;
    const picture = panel.querySelector("picture");
    const img = panel.querySelector("picture img, img");
    const textRoot = panel.querySelector('.one-card-content-left, [class*="one-card-content"]') || panel;
    const heading = textRoot.querySelector("h1, h2, h3");
    const bodyText = textRoot.querySelector(".body-text");
    const paragraphs = bodyText ? Array.from(bodyText.querySelectorAll("p")) : [];
    const links = Array.from(textRoot.querySelectorAll(".buttonGroup a, .hmk-brand-buttons a")).filter((a, i, arr) => arr.indexOf(a) === i).filter((a) => {
      const href = (a.getAttribute("href") || "").trim();
      return href && href !== "#";
    });
    if (!heading && !paragraphs.length && !img) {
      element.replaceWith(...element.childNodes);
      return;
    }
    let image = "";
    if (img) {
      const desktop = picture && Array.from(picture.querySelectorAll("source")).find((s) => /min-width:\s*992px/.test(s.getAttribute("media") || "") && s.getAttribute("srcset"));
      image = document2.createElement("img");
      image.setAttribute("src", desktop ? desktop.getAttribute("srcset").split(/\s+/)[0] : img.getAttribute("src"));
      image.setAttribute("alt", img.getAttribute("alt") || "");
    }
    const contentCell = [];
    if (heading) contentCell.push(heading);
    contentCell.push(...paragraphs);
    links.forEach((a) => {
      const p = document2.createElement("p");
      p.append(a);
      contentCell.push(p);
    });
    const cells = [[contentCell, image]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-minimal-dark-overlay", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-minimal-dark-compare.js
  function parse9(element, { document: document2 }) {
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

  // tools/importer/transformers/highmark-subnav-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var SECTIONS = [
    { id: "section-hero", selector: "div.hero.responsivegrid.section" },
    { id: "section-iconnav", selector: "div.quicklinks.section" },
    { id: "section-video-cards", selector: "section.container-fluid-fullwidth.section:has(.cardText)" },
    { id: "section-columns", selector: "div.newcardscomponent-variations.section:has(.side-card-panel):not(:has(.side-card-panel.new-hmk-brand-polar))" },
    { id: "section-columns-light", selector: "div.newcardscomponent-variations.section:has(.side-card-panel.new-hmk-brand-polar)", style: "light" },
    { id: "section-crisis", selector: "div.onecard1colpanel.section:not(:has(.one-card-one-col-panel.image)):not(:has(.new-hmk-brand-papergrey))", style: "highlight" },
    { id: "section-grey", selector: "div.onecard1colpanel.section:has(.new-hmk-brand-papergrey)", style: "grey" },
    { id: "section-story", selector: "div.onecard1colpanel.section:has(.one-card-one-col-panel.image)" },
    { id: "section-table", selector: ".dynamic-table-container" },
    { id: "section-cards-img", selector: "div.newcardscomponent-variations.section:has(ul.gridcardsul):has(.cardThree img)" },
    { id: "section-card-block", selector: "div.card-block.responsivegrid.section:has(.cardBlock)" },
    { id: "section-cards-icons", selector: "div.newcardscomponent-variations.section:has(li.listSmlImg:not(.cardThree))" },
    { id: "section-cards-list", selector: "div.newcardscomponent-variations.section:has(ul.gridcardsul):not(:has(picture)):not(:has(img))" },
    // Wide cards sit on the polar band (the block's default on these pages); the
    // white variant (mental-health-resources) opts out with style: white.
    { id: "section-cards-wide", selector: "div.newcardscomponent-variations.section:has(.listWideImg):has(.new-hmk-brand-polar)" },
    { id: "section-cards-wide-white", selector: "div.newcardscomponent-variations.section:has(.listWideImg):not(:has(.new-hmk-brand-polar))", style: "white" }
  ];
  function transform2(hookName, element, payload) {
    const sections = SECTIONS;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const matches = element.querySelectorAll(section.selector);
        if (!matches.length) continue;
        for (let m = matches.length - 1; m >= 0; m -= 1) {
          const sectionEl = matches[m];
          if (section.id === "section-hero" && !sectionEl.previousElementSibling) continue;
          const hr = document.createElement("hr");
          if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
          sectionEl.before(hr);
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const markers = [...element.querySelectorAll(`[${SECTION_MARKER_ATTR}="${section.id}"]`)];
        const anchors = markers.length ? markers : [...element.querySelectorAll(section.selector)];
        anchors.forEach((anchor) => {
          const metadataBlock = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          anchor.after(metadataBlock);
          anchor.removeAttribute(SECTION_MARKER_ATTR);
        });
      }
    }
  }

  // tools/importer/import-topic-hub-subnav.js
  var parsers = {
    "hero-minimal-dark-withimg": parse,
    "cards-minimal-dark-iconnav": parse2,
    "columns-minimal-dark": parse3,
    "cards-minimal-dark-withimg": parse4,
    "cards-minimal-dark-list": parse5,
    "cards-minimal-dark-withimg-2": parse6,
    "cards-minimal-dark-withimg-icons": parse7,
    "columns-minimal-dark-overlay": parse8,
    "table-minimal-dark-compare": parse9
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "topic-hub-subnav",
    description: "Sub-topic detail page: full-bleed hero, an icon quick-nav bar linking to child topics, alternating image/text info sections, promo cards, and (on some pages) a comparison table and video call-to-actions.",
    urls: [
      "https://www.highmark.com/resources/mental-health-services/anxiety",
      "https://www.highmark.com/resources/mental-health-services/depression",
      "https://www.highmark.com/resources/mental-health-services/eating-disorders",
      "https://www.highmark.com/resources/spending-accounts",
      "https://www.highmark.com/resources/mental-health-services/substance-use-disorders",
      "https://www.highmark.com/resources/mental-health-services/mental-health-resources-teens-children",
      "https://www.highmark.com/resources/mental-health-services/mental-health-resources"
    ],
    blocks: [
      { name: "hero-minimal-dark-withimg", instances: ["div.hero.responsivegrid.section"] },
      { name: "cards-minimal-dark-iconnav", instances: ["div.quicklinks.section"] },
      {
        name: "columns-minimal-dark",
        instances: [
          "div.newcardscomponent-variations.section:has(.side-card-panel)",
          "section.container-fluid-fullwidth.section:has(.side-card-panel)"
        ]
      },
      {
        name: "cards-minimal-dark-withimg",
        instances: [
          "div.newcardscomponent-variations.section:has(ul.gridcardsul):has(.cardThree picture)",
          "div.newcardscomponent-variations.section:has(ul.gridcardsul):has(.cardThree img)",
          "section.container-fluid-fullwidth.section:has(.cardText)",
          "div.card-block.responsivegrid.section:has(.cardBlock)"
        ]
      },
      {
        name: "cards-minimal-dark-withimg-icons",
        instances: ["div.newcardscomponent-variations.section:has(li.listSmlImg:not(.cardThree))"]
      },
      {
        name: "cards-minimal-dark-list",
        instances: ["div.newcardscomponent-variations.section:has(ul.gridcardsul):not(:has(picture)):not(:has(img))"]
      },
      { name: "cards-minimal-dark-withimg-2", instances: ["div.newcardscomponent-variations.section:has(.listWideImg)"] },
      {
        name: "table-minimal-dark-compare",
        instances: [".dynamic-table-container", "section.container-fluid-fullwidth.section:has(table)"]
      },
      {
        name: "columns-minimal-dark-overlay",
        instances: ["div.onecard1colpanel.section:has(.one-card-one-col-panel.image)"]
      },
      {
        name: "section-crisis-highlight",
        instances: ["div.onecard1colpanel.section:not(:has(.one-card-one-col-panel.image)):not(:has(.new-hmk-brand-papergrey))"],
        section: "highlight"
      },
      { name: "section-grey", instances: ["div.onecard1colpanel.section:has(.new-hmk-brand-papergrey)"], section: "grey" },
      {
        name: "section-white",
        instances: ["div.newcardscomponent-variations.section:has(.listWideImg):not(:has(.new-hmk-brand-polar))"],
        section: "white"
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
          claimed.add(element);
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_topic_hub_subnav_default = {
    transform: (payload) => {
      var _a;
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      const crumbLabel = (((_a = document2.querySelector("ol.breadcrumb-list li.active")) == null ? void 0 : _a.textContent) || "").replace(/\s+/g, " ").trim();
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
      if (crumbLabel) meta["Breadcrumb Title"] = crumbLabel;
      meta.template = "topic-hub-subnav";
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
  return __toCommonJS(import_topic_hub_subnav_exports);
})();
