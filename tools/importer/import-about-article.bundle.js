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

  // tools/importer/transformers/highmark-faq-topic-sections.js
  var SPACER_PX = { ten: 20, twenty: 40, thirty: 60, forty: 80 };
  function spacerHeights(spacer) {
    var _a;
    const cls = ((_a = spacer.querySelector("section")) == null ? void 0 : _a.className) || "";
    const size = (prefix) => SPACER_PX[(cls.match(new RegExp(`(?:^|\\s)${prefix}(ten|twenty|thirty|forty)-padding`)) || [])[1]] || 0;
    return [size(""), size("tab-"), size("mob-")];
  }
  function spaceStyle([d, t, m]) {
    const styles = [`space-${d}`];
    if (t !== d) styles.push(`space-tablet-${t}`);
    if (m !== d) styles.push(`space-mobile-${m}`);
    return styles.join(", ");
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
    const styles = { "right-rail": payload.railStyle, article: payload.articleStyle };
    const template = payload.railStyle || payload.articleStyle ? __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections: PAGE_TEMPLATE.sections.map((s) => styles[s.name] ? __spreadProps(__spreadValues({}, s), { style: styles[s.name] }) : s) }) : PAGE_TEMPLATE;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template });
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
    /**
     * An empty paragraph opening the text after a tinted box (Delaware's <p>&nbsp;</p>)
     * spaces the box from what follows by a line. The import drops blank paragraphs (it
     * copies the page before the transform), so it's kept here, on the live page, as a
     * paragraph holding a zero-width space, as the FAQ importer does.
     */
    onLoad: ({ document: document2 }) => {
      document2.querySelectorAll(".page__par section.container-fluid-fullwidth:has(section.new-hmk-brand-fifteenpercent-splash, section.global-grey_garden)").forEach((box) => {
        const next = box.nextElementSibling;
        const p = (next == null ? void 0 : next.matches(".cmp-text")) && next.querySelector(":scope > p:first-child");
        if (p && !p.querySelector("img, br") && !p.textContent.replace(/[\s\u00a0]/g, "")) p.textContent = "\u200B";
      });
      const parts = [...document2.querySelectorAll(".page__par .spacing, .page__par .cmp-text, .page__par .button, .page__par .gridcontrol")];
      parts.forEach((button, index) => {
        var _a;
        if (!button.matches(".button") || !button.querySelector('a.textButton[href="#top"]')) return;
        const space = [0, 0, 0];
        for (let i = index + 1; (_a = parts[i]) == null ? void 0 : _a.matches(".spacing"); i += 1) {
          spacerHeights(parts[i]).forEach((h, k) => {
            space[k] += h;
          });
        }
        if (space.join() !== "20,20,20") return;
        const p = document2.createElement("p");
        p.textContent = "\u200B";
        button.after(p);
      });
    },
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
      main.querySelectorAll(".page__par .hmk-brand-buttons a.brand-button-normal").forEach((a) => {
        const strong = document2.createElement("strong");
        const em = document2.createElement("em");
        em.append(...a.childNodes);
        strong.append(em);
        a.append(strong);
      });
      const sectionHeadings = {};
      main.querySelectorAll('.page__par section[id]:not([id="top"])').forEach((section) => {
        const heading = section.querySelector("h2, h3, h4");
        if (heading == null ? void 0 : heading.textContent.trim()) sectionHeadings[section.id] = heading.textContent;
      });
      const title = main.querySelector(".page__par h1");
      const lead = title && [...main.querySelectorAll(".page__par p")].find((p) => title.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING);
      const leadSpan = lead == null ? void 0 : lead.querySelector(":scope > span.p1");
      if (leadSpan && lead.textContent.trim() === leadSpan.textContent.trim()) {
        const h5 = document2.createElement("h5");
        h5.append(...leadSpan.childNodes);
        lead.replaceWith(h5);
      }
      const gridSpan = (el, kind) => +(el.className.match(new RegExp(`aem-GridColumn--${kind}--(\\d+)`)) || [])[1] || 0;
      const PARTS = [".spacing", ".cmp-text", ".image", ".button", ".title", "table"].map((s) => `.page__par ${s}`).join(", ");
      const spaceBefore = (el) => {
        const parts2 = [...main.querySelectorAll(PARTS)];
        let i = parts2.findIndex((p) => p === el || el.contains(p) || el.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING);
        if (i < 0) i = parts2.length;
        const space = [0, 0, 0];
        for (i -= 1; i >= 0; i -= 1) {
          const part = parts2[i];
          if (part.matches(".spacing")) {
            if (!part.closest(".page__par .cmp-text")) spacerHeights(part).forEach((h, k) => {
              space[k] += h;
            });
          } else if (!part.contains(el) && (part.textContent.trim() || part.querySelector("img"))) break;
        }
        return space;
      };
      const spaceAfter = (el) => {
        const parts2 = [...main.querySelectorAll(PARTS)];
        const i = parts2.findIndex((p) => p !== el && !el.contains(p) && el.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING);
        const space = [0, 0, 0];
        for (let k = i; k >= 0 && k < parts2.length; k += 1) {
          const part = parts2[k];
          if (part.matches(".spacing")) {
            if (!part.closest(".page__par .cmp-text")) spacerHeights(part).forEach((h, j) => {
              space[j] += h;
            });
          } else if (part.textContent.trim() || part.querySelector("img")) break;
        }
        return space;
      };
      main.querySelectorAll(".page__par .image").forEach((cmp) => {
        const img = cmp.querySelector("img");
        const span = gridSpan(cmp, "default");
        if (!img || !span) return;
        const offset = gridSpan(cmp, "offset--default");
        const phone = gridSpan(cmp, "phone") || span;
        const space = spaceBefore(cmp);
        const after = spaceAfter(cmp);
        const options = [
          span < 12 ? `span-${span}` : "",
          offset ? `offset-${offset}` : "",
          !offset && phone < 12 ? `span-phone-${phone}` : "",
          space.some(Boolean) ? spaceStyle(space) : "",
          after.some(Boolean) ? spaceStyle(after).replace(/space-/g, "space-after-") : ""
        ].filter(Boolean);
        const name = options.length ? `Image (${options.join(", ")})` : "Image";
        cmp.replaceWith(WebImporter.Blocks.createBlock(document2, { name, cells: [[img]] }));
      });
      main.querySelectorAll(".page__par .gridcontrol").forEach((grid) => {
        const cells = [...grid.querySelectorAll('.aem-hmk-row > [class*="hmk-col-"]')].map((col) => {
          const cell = document2.createElement("div");
          col.querySelectorAll(".cmp-text").forEach((text) => cell.append(...text.childNodes));
          return cell;
        });
        if (!cells.some((cell) => cell.textContent.trim())) return;
        const wrapper = grid.closest("section.container-fluid-fullwidth");
        const alone = wrapper && [...wrapper.querySelectorAll(PARTS)].every((part) => grid.contains(part) || part.matches(".spacing") && !(grid.compareDocumentPosition(part) & Node.DOCUMENT_POSITION_FOLLOWING));
        const target = alone ? wrapper : grid;
        const pad = [0, 0, 0];
        if (alone) {
          wrapper.querySelectorAll(".spacing").forEach((spacer) => {
            if (!grid.contains(spacer)) spacerHeights(spacer).forEach((h, i) => {
              pad[i] += h;
            });
          });
        }
        const space = spaceBefore(target);
        const options = [
          alone && wrapper.querySelector(":scope > .parent-width > section.global-grey_garden") ? "grey" : "",
          pad.some(Boolean) ? spaceStyle(pad).replace(/space-/g, "pad-") : "",
          space.some(Boolean) ? spaceStyle(space) : ""
        ].filter(Boolean);
        const name = options.length ? `Grid (${options.join(", ")})` : "Grid";
        target.replaceWith(WebImporter.Blocks.createBlock(document2, { name, cells: [cells] }));
      });
      const CALLOUTS = {
        "section.new-hmk-brand-fifteenpercent-splash": "light-blue",
        "section.global-grey_garden": "grey",
        "section.global-helionlightblue": "pale-blue",
        "section.new-hmk-brand-blush-twnetyfive:has(.brand-center-content)": "blush, center"
      };
      Object.entries(CALLOUTS).forEach(([selector, variant]) => {
        main.querySelectorAll(`.page__par ${selector}`).forEach((box) => {
          const cell = document2.createElement("div");
          box.querySelectorAll(".cmp-text, .button").forEach((part) => {
            if (part.matches(".cmp-text")) {
              cell.append(...part.childNodes);
              return;
            }
            const link = part.querySelector("a[href]");
            if (!link) return;
            const p = document2.createElement("p");
            const a = document2.createElement("a");
            a.href = link.getAttribute("href");
            a.textContent = link.textContent.trim();
            p.append(a);
            cell.append(p);
          });
          if (!cell.textContent.trim()) return;
          const wrapper = box.closest("section.container-fluid-fullwidth") || box;
          const space = spaceBefore(wrapper);
          const after = [0, 0, 0];
          for (let next = wrapper.nextElementSibling; next == null ? void 0 : next.matches(".spacing"); next = next.nextElementSibling) {
            spacerHeights(next).forEach((h, i) => {
              after[i] += h;
            });
          }
          const rest = [...main.querySelectorAll(PARTS)].filter((part) => !wrapper.contains(part) && wrapper.compareDocumentPosition(part) & Node.DOCUMENT_POSITION_FOLLOWING);
          if (!rest.some((part) => !part.matches(".spacing") && (part.textContent.trim() || part.querySelector("img")))) after.fill(0);
          const options = [
            variant,
            space.some(Boolean) ? spaceStyle(space) : "",
            after.some(Boolean) ? spaceStyle(after).replace(/space-/g, "space-after-") : ""
          ].filter(Boolean);
          const block = WebImporter.Blocks.createBlock(document2, { name: `Callout (${options.join(", ")})`, cells: [[cell]] });
          wrapper.replaceWith(block);
        });
      });
      const railGrey = !!main.querySelector(".rightrail-container.new-hmk-brand-papergrey");
      payload.railStyle = railGrey ? "rail-grey" : null;
      const parts = [...main.querySelectorAll('.page__par .spacing, .page__par .cmp-text, .page__par .image, .page__par .button, .page__par .title, .page__par [class*="callout"], .page__par table')];
      const closing = [0, 0, 0];
      for (let i = parts.length - 1; i >= 0; i -= 1) {
        const part = parts[i];
        if (part.matches(".spacing")) {
          if (!part.closest(".page__par .cmp-text")) spacerHeights(part).forEach((h, k) => {
            closing[k] += h;
          });
        } else if (part.textContent.trim() || part.querySelector("img")) break;
      }
      payload.articleStyle = closing.some(Boolean) ? spaceStyle(closing).replace(/space-/g, "space-after-") : null;
      const last = parts.reverse().find((part) => !part.matches(".spacing") && part.textContent.trim());
      if (!payload.articleStyle && (last == null ? void 0 : last.querySelector(":scope > p:last-child > :is(b, strong):only-child > a:only-child"))) {
        payload.articleStyle = "close-flush";
      }
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
        if (sectionHeadings[id]) {
          a.setAttribute("href", `#${headingId(sectionHeadings[id])}`);
          return;
        }
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
