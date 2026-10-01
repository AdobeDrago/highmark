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

  // tools/importer/import-leadership.js
  var import_leadership_exports = {};
  __export(import_leadership_exports, {
    default: () => import_leadership_default
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

  // tools/importer/parsers/cards-minimal-dark-withimg.js
  function parse2(element, { document: document2 }) {
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

  // tools/importer/import-leadership.js
  var parsers = {
    "cards-minimal-light-sidenav": parse,
    "cards-minimal-dark-withimg": parse2
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    "name": "leadership",
    "description": "Leadership Team & Board: left section navigation, leader photo card grids (leadership team, market leaders), Board of Directors feature and member name list",
    "urls": [
      "https://www.highmark.com/about/our-story/leadership-team-board"
    ],
    "blocks": [
      {
        "name": "cards-minimal-light-sidenav",
        "instances": [
          "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)",
          "div.d-none.d-lg-block.col-lg-3 div.nav-container"
        ]
      },
      {
        "name": "cards-minimal-dark-withimg",
        "instances": [
          "div.gridcontrol:has(section.hmk-home_cardwrapper)"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "sidenav",
        "selector": [
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
        "name": "title",
        "selector": [
          "div.col-lg-9 > div.row > div.col-lg-9 div.page__par"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": []
      },
      {
        "id": "3",
        "name": "leaders-and-board",
        "selector": [
          "div.col-lg-9 > div.row > div.col-lg-12"
        ],
        "style": null,
        "blocks": [
          "cards-minimal-dark-withimg",
          "columns-minimal-dark"
        ],
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
  var import_leadership_default = {
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
      const boardImg = main.querySelector('section.container-fluid-fullwidth img.image-comp-img[src*="/leadership/"]');
      const imgCol = boardImg && boardImg.closest("section.container-fluid-fullwidth.aem-GridColumn");
      const textCol = imgCol && imgCol.nextElementSibling;
      if (imgCol && textCol) {
        const content = [];
        textCol.querySelectorAll(".cmp-text").forEach((ct) => {
          [...ct.children].filter((el) => ["H2", "H3", "H4", "P"].includes(el.tagName) && el.textContent.trim()).forEach((el) => content.push(el));
        });
        const linkedin = textCol.querySelector('a[href*="linkedin.com"]');
        if (linkedin) {
          const p = document2.createElement("p");
          const a = document2.createElement("a");
          a.setAttribute("href", linkedin.getAttribute("href"));
          a.textContent = "LinkedIn";
          p.append(a);
          content.push(p);
        }
        const img = document2.createElement("img");
        img.setAttribute("src", boardImg.getAttribute("src"));
        img.setAttribute("alt", boardImg.getAttribute("alt") || "");
        imgCol.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "columns-minimal-dark", cells: [[[img], content]] }));
        textCol.remove();
      }
      main.querySelectorAll(".cmp-text table").forEach((table) => {
        const ul = document2.createElement("ul");
        table.querySelectorAll("td p").forEach((p) => {
          const name = p.textContent.split(String.fromCharCode(160)).join(" ").trim();
          if (!name) return;
          const li = document2.createElement("li");
          li.textContent = name;
          ul.append(li);
        });
        table.replaceWith(ul);
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
      meta.template = "leadership";
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
  return __toCommonJS(import_leadership_exports);
})();
