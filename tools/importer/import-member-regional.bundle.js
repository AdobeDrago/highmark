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

  // tools/importer/import-member-regional.js
  var import_member_regional_exports = {};
  __export(import_member_regional_exports, {
    default: () => import_member_regional_default
  });

  // tools/importer/parsers/hero-minimal-dark-withimg.js
  function parse(element, { document }) {
    var _a;
    const banner = element.querySelector(".secondaryBannerContent");
    if (banner) {
      const bannerImg = banner.querySelector("img.desktopImage") || banner.querySelector("picture img, img");
      const wrapper = banner.querySelector(".contentWrapper") || banner;
      const pick = (sel) => wrapper.querySelector(`${sel}.d-lg-block`) || wrapper.querySelector(sel);
      const clean = (el) => {
        if (!el) return null;
        const h = document.createElement(el.tagName.toLowerCase());
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
      element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "hero-minimal-dark-withimg", cells: bannerCells }));
      return;
    }
    const bgImage = element.querySelector('picture img, img[class*="image"], img');
    const heroWrapper = element.querySelector(".left-content.d-lg-block .content-wrapper") || element.querySelector(".left-content .content-wrapper") || element.querySelector(".content-wrapper");
    const contentWrapper = heroWrapper || element.querySelector(".one-card-content-left-container") || element;
    let heading = contentWrapper.querySelector('h1, h2, .banner-heading, [class*="banner-heading"]');
    if (!heroWrapper && heading && /\bd-none\b|\bd-lg-none\b/.test(heading.className || "")) {
      const cleanHeading = document.createElement(heading.tagName.toLowerCase());
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
          const p = document.createElement("p");
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
    const block = WebImporter.Blocks.createBlock(document, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-minimal-dark-iconnav.js
  function parse2(element, { document }) {
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
      const link = document.createElement("a");
      link.setAttribute("href", href);
      link.textContent = label;
      cells.push([iconText, link]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-minimal-dark-iconnav", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-minimal-dark-withimg-icons.js
  function parse3(element, { document }) {
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
          const p = document.createElement("p");
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
      const p = document.createElement("p");
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
        const p = document.createElement("p");
        if (hasHref(a)) {
          p.append(a);
        } else {
          p.append(...a.childNodes);
        }
        contentCell.push(p);
      });
      cells.push([image || "", contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-minimal-dark-withimg-icons", cells });
    element.replaceWith(...introEls, block, ...trailingEls);
  }

  // tools/importer/parsers/columns-minimal-dark.js
  function parseBio(element, document) {
    const img = element.querySelector(".div-bio-images img, img");
    const header = element.querySelector(".div-bio-header") || element;
    const name = header.querySelector("h1, h2, h3, h4");
    const title = header.querySelector("p");
    const content = [];
    if (name) {
      const h1 = document.createElement("h1");
      h1.textContent = name.textContent.replace(/\s+/g, " ").trim();
      content.push(h1);
    }
    if (title) {
      const p = document.createElement("p");
      p.textContent = title.textContent.replace(/\s+/g, " ").trim();
      content.push(p);
    }
    const linkPara = (href, text) => {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = text;
      p.append(a);
      return p;
    };
    header.querySelectorAll("a").forEach((a) => {
      const raw = (a.getAttribute("href") || "").trim();
      const href = raw.replace(/(%20|\s)+$/i, "");
      const label = a.textContent.replace(/\s+/g, " ").trim();
      if (/linkedin\.com/i.test(href) || a.querySelector(".fa-linkedin") || label === "LinkedIn") {
        content.push(linkPara(href || "#", "LinkedIn"));
      } else if (a.id === "bio-modal" || /request interview/i.test(label)) {
        content.push(linkPara("/modals/request-interview", "Request Interview"));
      } else if (/\.pdf$/i.test(href)) {
        content.push(linkPara(href, "View as a PDF"));
      } else if (href && href !== "#") {
        content.push(linkPara(href, label || href));
      }
    });
    const cells = [[img ? [img] : "", content]];
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: "columns-minimal-dark", cells }));
  }
  function parse4(element, { document }) {
    if (element.matches("section.flex-container") && element.querySelector(".div-bio-header")) {
      parseBio(element, document);
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
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-minimal-dark", cells });
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

  // tools/importer/import-member-regional.js
  var parsers = {
    "hero-minimal-dark-withimg": parse,
    "cards-minimal-dark-iconnav": parse2,
    "cards-minimal-dark-withimg-icons": parse3,
    "columns-minimal-dark": parse4
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    "name": "member-regional",
    "description": "Regional member resources pages (/member/bcbs, /blueshield, /bcbswv, /bcbsde, /bcbswny, /blueshieldneny): photo hero with MEMBER LOGIN / REGISTER, navy icon quick-link bar, small-icon task cards, image/text side panels (Member Portal Assistance, Member Services), My Highmark app band with store badges, Got Questions band; the New York pages add Member Bill Pay Options text cards and (Western NY) a Child Health Plus band. One section per source component, styled from its background. Each page gets its region's header and footer fragments (/member/fragments/<region>/nav, /footer; tools/importer/import-member-chrome.js)",
    "urls": [
      "https://www.highmark.com/member/bcbs",
      "https://www.highmark.com/member/blueshield",
      "https://www.highmark.com/member/bcbswv",
      "https://www.highmark.com/member/bcbsde",
      "https://www.highmark.com/member/bcbswny",
      "https://www.highmark.com/member/blueshieldneny"
    ],
    "blocks": [
      {
        "name": "hero-minimal-dark-withimg",
        "instances": [
          "div.secondary-banner.responsivegrid"
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
          "div.newcardscomponent-variations:has(li.listSmlImg)"
        ]
      },
      {
        "name": "columns-minimal-dark",
        "instances": [
          "div.newcardscomponent-variations:has(.side-card-panel)"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "component",
        "selector": [
          "div.secondary-banner.responsivegrid ~ *"
        ],
        "repeat": true,
        "style": "(from the component's background: blush 25 -> highlight, light pink -> pink, light blue -> pale-blue, polar -> light, splash 15 -> light-blue, paper grey -> grey; text bands add center)",
        "blocks": [],
        "defaultContent": []
      }
    ]
  };
  var BACKGROUNDS = [
    ["new-hmk-brand-blush-twnetyfive", "highlight"],
    ["global-light-pink", "pink"],
    ["global-light-blue", "pale-blue"],
    ["new-hmk-brand-polar", "light"],
    ["new-hmk-brand-fifteenpercent-splash", "light-blue"],
    ["new-hmk-brand-papergrey", "grey"]
  ];
  var REGIONS = ["bcbs", "blueshield", "bcbswv", "bcbsde", "bcbswny", "blueshieldneny"];
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
  function blockOf(component) {
    for (const def of PAGE_TEMPLATE.blocks) {
      for (const sel of def.instances) {
        if (component.matches(sel)) return { name: def.name, element: component };
        const inner = component.querySelector(sel);
        if (inner) return { name: def.name, element: inner };
      }
    }
    return null;
  }
  function styleOf(component, block) {
    const styles = [];
    const coloured = [component, ...component.querySelectorAll("[class]")].filter((el2) => BACKGROUNDS.some(([cls]) => el2.classList.contains(cls)));
    const el = coloured.pop();
    if (el) styles.push(BACKGROUNDS.find(([cls]) => el.classList.contains(cls))[1]);
    if (!block && component.querySelector("h2, h5") || (block == null ? void 0 : block.name) === "cards-minimal-dark-withimg-icons") styles.push("center");
    return styles.join(", ");
  }
  var import_member_regional_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      const region = new URL(params.originalURL).pathname.replace(/\/$/, "").split("/").pop().toLowerCase();
      WebImporter.DOMUtils.remove(main, [
        ".experiencefragment:has(.main-search-bar)",
        ".experiencefragment:has(.mainnavigation-new)",
        ".conf-extra-links-container",
        ".wrapper-header-container",
        ".global-footer",
        ".iedetect",
        "div.breadcrumb",
        ".spacing",
        'a[href="#main-content"]'
      ]);
      executeTransformers("beforeTransform", main, payload);
      const COMPONENT = "div.secondary-banner.responsivegrid, div.quicklinks, div.newcardscomponent-variations, div.onecard1colpanel";
      const blocks = [...main.querySelectorAll(COMPONENT)].filter((c) => !c.parentElement.closest(COMPONENT));
      const bandCandidates = [...main.querySelectorAll("section.container-fluid-fullwidth")].filter((s) => s.querySelector("h2, h5, p") && s.textContent.trim() && !s.querySelector(COMPONENT) && !s.closest(COMPONENT));
      const bands = bandCandidates.filter((s) => !bandCandidates.some((o) => o !== s && o.contains(s)));
      const kept = [...blocks, ...bands].filter((c) => c.textContent.trim() || c.querySelector("img")).sort((a, b) => a.compareDocumentPosition(b) & 4 ? -1 : 1);
      const heroVariants = {
        light: !!main.querySelector(".secondary-banner h1.d-lg-block.hmk-brand-togetherblue-text-color"),
        dark: !!main.querySelector(".secondary-banner .mobileBackgroundTogetherBlue")
      };
      main.querySelectorAll("div.quicklinks").forEach((q) => q.setAttribute("data-iconnav-image-icons", ""));
      main.querySelectorAll('.hmk-brand-buttons a[class*="brand-button"]').forEach((a) => {
        if (a.closest("strong, b, em, i, .secondary-banner")) return;
        const wrap = document.createElement(a.classList.contains("brand-button-normal") ? "strong" : "em");
        a.replaceWith(wrap);
        wrap.append(a);
      });
      const pageBlocks = [];
      const plan = kept.map((component, i) => {
        const block = blockOf(component);
        const style = styleOf(component, block);
        if (i > 0) component.before(document.createElement("hr"));
        const end = document.createElement("div");
        component.after(end);
        const outlined = [...component.querySelectorAll("em > a[href]")].map((a) => a.getAttribute("href"));
        return { block, style, end, outlined };
      });
      plan.forEach(({ block, style, end, outlined }) => {
        if (block) {
          pageBlocks.push(block);
          try {
            parsers[block.name](block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name}:`, e);
          }
          const rebuilt = end.previousElementSibling;
          rebuilt == null ? void 0 : rebuilt.querySelectorAll("a[href]").forEach((a) => {
            if (!outlined.includes(a.getAttribute("href")) || a.closest("em, strong")) return;
            const em = document.createElement("em");
            a.replaceWith(em);
            em.append(a);
          });
          const parsed = end.previousElementSibling;
          if (block.name === "hero-minimal-dark-withimg" && parsed) {
            const variants = [];
            if (heroVariants.light) variants.push("light");
            if (heroVariants.dark) variants.push("dark");
            const nameCell = parsed.querySelector("tr > th, tr > td");
            if (nameCell && variants.length) nameCell.textContent = `${nameCell.textContent.trim()} (${variants.join(", ")})`;
          }
          if (block.name === "hero-minimal-dark-withimg" && parsed && !parsed.querySelector("strong > a")) {
            const first = [...parsed.querySelectorAll("a[href]")].find((a) => !a.querySelector("img, picture"));
            if (first) {
              const strong = document.createElement("strong");
              first.replaceWith(strong);
              strong.append(first);
            }
          }
        }
        if (style) {
          end.replaceWith(WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style }
          }));
        } else {
          end.remove();
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document) || {};
      if (REGIONS.includes(region)) {
        meta.nav = `/member/fragments/${region}/nav`;
        meta.footer = `/member/fragments/${region}/footer`;
      }
      meta.template = "member-regional";
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
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_member_regional_exports);
})();
