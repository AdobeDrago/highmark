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

  // tools/importer/import-employer-plan.js
  var import_employer_plan_exports = {};
  __export(import_employer_plan_exports, {
    default: () => import_employer_plan_default
  });

  // tools/importer/parsers/cards-minimal-light-sidenav.js
  function parse(element, { document }) {
    const labelOf = (a) => (a.textContent || "").replace(/\s+/g, " ").trim();
    const cleanLink = (a) => {
      const link = document.createElement("a");
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
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards-minimal-light-sidenav",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-minimal-light.js
  function parse2(element, { document }) {
    const leadingEls = [];
    const heading = element.querySelector("h2.maintitle, .maintitle, h2");
    if (heading) leadingEls.push(heading);
    const items = Array.from(element.querySelectorAll("div.collapsible-item, .collapsible-item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const trigger = item.querySelector("button.accordion-trigger, .accordion-trigger");
      const headingSpan = item.querySelector(
        "span.collapsible-item-heading, .collapsible-item-heading"
      );
      let titleEl;
      if (headingSpan) {
        titleEl = document.createElement("p");
        titleEl.textContent = (headingSpan.textContent || "").replace(/\s+/g, " ").trim();
      } else if (trigger) {
        titleEl = document.createElement("p");
        titleEl.textContent = (trigger.textContent || "").replace(/\s+/g, " ").trim();
      } else {
        titleEl = document.createElement("p");
      }
      const desc = item.querySelector(
        "div.collapsible-item-description, .collapsible-item-description"
      );
      const contentCell = [];
      if (desc) {
        contentCell.push(...Array.from(desc.childNodes));
      }
      cells.push([titleEl, contentCell.length ? contentCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "accordion-minimal-light",
      cells
    });
    element.replaceWith(...leadingEls, block);
  }

  // tools/importer/parsers/table-minimal-dark-compare.js
  function parse3(element, { document }) {
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
    const variant = element.getAttribute("data-block-variant");
    const name = variant ? `table-minimal-dark-compare (${variant})` : "table-minimal-dark-compare";
    const block = WebImporter.Blocks.createBlock(document, { name, cells });
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

  // tools/importer/transformers/highmark-faq-topic-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var NAV = "div.col-lg-3 div.nav-container:has(.sidenav, .sidenav-item-list)";
  var RAIL = ".rightrail-container";
  var GROUP = "div.accordianTable";
  var CTA = "div.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive";
  var clean = (text) => (text || "").replace(/\s+/g, " ").trim();
  function marker(document, id) {
    const hr = document.createElement("hr");
    if (id) hr.setAttribute(SECTION_MARKER_ATTR, id);
    return hr;
  }
  function railContent(document, rail) {
    const els = [];
    const title = rail.querySelector(".rightrail-title h3, h3");
    if (title) {
      const h3 = document.createElement("h3");
      h3.textContent = clean(title.textContent);
      els.push(h3);
    }
    const desc = rail.querySelector(".rightrail-description");
    if (desc) {
      const p = document.createElement("p");
      p.innerHTML = desc.innerHTML.trim();
      els.push(p);
    }
    rail.querySelectorAll(".hmk-brand-buttons a[href]").forEach((a) => {
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = clean(a.textContent);
      p.append(link);
      els.push(p);
    });
    return els;
  }
  var isBackToTop = (a) => /^back to top$/i.test(clean(a.textContent));
  function headingBefore(group, h1) {
    if (group.querySelector("h2")) return null;
    let prev = null;
    const walker = group.ownerDocument.createTreeWalker(group.ownerDocument.body, 1);
    for (let node = walker.nextNode(); node && node !== group; node = walker.nextNode()) {
      if (node.matches(GROUP) || node === h1) prev = null;
      else if (node.tagName === "H2" && !node.closest(GROUP)) prev = node;
    }
    return prev;
  }
  function plainTable(document, source) {
    const table = document.createElement("table");
    const body = document.createElement("tbody");
    source.querySelectorAll("tr").forEach((tr) => {
      const row = document.createElement("tr");
      tr.querySelectorAll(":scope > th, :scope > td").forEach((cell) => {
        cell.querySelectorAll(".swipemessage").forEach((el) => el.remove());
        const td = document.createElement("td");
        td.textContent = clean(cell.textContent);
        row.append(td);
      });
      body.append(row);
    });
    table.append(body);
    const wrapper = document.createElement("div");
    wrapper.className = "faq-compare-table";
    wrapper.append(table);
    return wrapper;
  }
  var headingId = (text) => clean(text.replace(/\ue000/g, " ")).toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
  function siblingNavWithChildren(document, nav) {
    const active = nav.querySelector("a.active");
    const item = active == null ? void 0 : active.closest("li");
    const children = item == null ? void 0 : item.querySelector(":scope > ul.subnavitem-list");
    const siblings = item == null ? void 0 : item.parentElement;
    const submenus = siblings == null ? void 0 : siblings.querySelector(":scope > li > ul.subnavitem-list");
    if (!siblings || !submenus) return null;
    const link = (a) => {
      const el = document.createElement("a");
      el.href = a.getAttribute("href");
      el.textContent = clean(a.textContent);
      return el;
    };
    const cells = [];
    const parent = nav.querySelector("a.side-nav-item-parent");
    if (parent) cells.push(["parent", link(parent)]);
    siblings.querySelectorAll(":scope > li > a[href], :scope > li > .sidenav-item-row > a[href]").forEach((a) => {
      if (a === parent) return;
      cells.push([a === active ? "current" : "sibling", link(a)]);
      const submenu = a === active ? children : a.closest("li").querySelector(":scope > ul.subnavitem-list");
      submenu == null ? void 0 : submenu.querySelectorAll(":scope > li > a[href]").forEach((child) => cells.push(["child", link(child)]));
    });
    return WebImporter.Blocks.createBlock(document, { name: "cards-minimal-light-sidenav", cells });
  }
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
  function spacerBreaks(document, column) {
    const leaves = [...column.querySelectorAll(".aem-GridColumn")].filter((el) => !el.querySelector(".aem-GridColumn") && !el.closest(CTA) && !el.querySelector(CTA));
    const isSpacer = (el) => el.matches(".spacing");
    const groupOf = (el) => el.matches(GROUP) ? el : el.querySelector(GROUP);
    const groupSpace = /* @__PURE__ */ new Map();
    let pending = null;
    let afterGroup = false;
    leaves.forEach((leaf, i) => {
      if (isSpacer(leaf)) {
        const h = spacerHeights(leaf);
        pending = pending ? pending.map((v, j) => v + h[j]) : h;
        return;
      }
      const style = pending && pending.some(Boolean) ? spaceStyle(pending) : "";
      pending = null;
      const group = groupOf(leaf);
      if (group) {
        if (style) groupSpace.set(group, style);
        afterGroup = true;
        return;
      }
      const next = leaves.slice(i + 1).find((el) => !isSpacer(el));
      const titlesGroup = next && groupOf(next) && leaf.querySelector("h2") && clean(leaf.textContent) === clean(leaf.querySelector("h2").textContent);
      if (titlesGroup) {
        if (style) groupSpace.set(groupOf(next), style);
      } else if (style || afterGroup) {
        leaf.before(marker(document, style || void 0));
      }
      afterGroup = false;
    });
    return groupSpace;
  }
  var linkParagraph = (document, href, text) => {
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    p.append(a);
    return p;
  };
  function transform2(hookName, element, payload) {
    var _a;
    const { document } = payload;
    if (hookName === "beforeTransform") {
      element.querySelectorAll("a .global-clr_externallink").forEach((span) => {
        span.replaceWith(document.createTextNode(" :external-link:"));
      });
      element.querySelectorAll("a *").forEach((el) => {
        if (/^opens a new tab or window$/i.test(clean(el.textContent))) el.remove();
      });
      element.querySelectorAll("p span.p1").forEach((span) => {
        const p = span.closest("p");
        if (p.closest(".collapsible-item, .accordion-trigger") || clean(p.textContent) !== clean(span.textContent)) return;
        const strong = document.createElement("strong");
        strong.append(...span.childNodes);
        p.replaceChildren(strong);
      });
      const nav = element.querySelector(NAV);
      const h1 = element.querySelector("h1");
      if (nav) {
        nav.before(marker(document));
        const block = siblingNavWithChildren(document, nav);
        if (block) nav.replaceWith(block);
        const root = nav.querySelector(".sidenav-item-list > li.sidenav-item-root");
        const flat = [...nav.querySelectorAll(".sidenav-item-list > li.sidenav-item-level1")];
        if (!block && root && flat.length) {
          const list = document.createElement("ul");
          list.append(...flat);
          root.append(list);
        }
      }
      element.querySelectorAll('a[href^="#"]').forEach((a) => {
        const id = a.getAttribute("href").slice(1);
        const target = id && element.querySelector(`[id="${id}"]`);
        const heading = target && (target.matches("h2") ? target : target.querySelector("h2"));
        if (heading) a.setAttribute("href", `#${headingId(heading.textContent)}`);
      });
      const all = element.querySelector('section[id="all"]');
      if (all == null ? void 0 : all.querySelector("h2")) {
        const content = [document.createElement("h2")];
        content[0].textContent = clean(all.querySelector("h2").textContent);
        all.querySelectorAll("p a[href]").forEach((a) => {
          content.push(linkParagraph(document, a.getAttribute("href"), clean(a.textContent)));
        });
        const groups = element.querySelectorAll(GROUP);
        const after = groups[groups.length - 1] || all;
        all.remove();
        after.after(marker(document, "mobile-only"), ...content);
      }
      if (h1) {
        const rail = element.querySelector(RAIL);
        if (rail) {
          const content = railContent(document, rail);
          (_a = rail.closest(".col-lg-3")) == null ? void 0 : _a.remove();
          rail.remove();
          if (content.length) h1.before(marker(document, "right-rail"), ...content);
        }
        h1.before(marker(document));
      }
      let column = h1 || element;
      while (h1 && column.parentElement && column.parentElement !== element && !(nav && column.parentElement.contains(nav))) column = column.parentElement;
      const groupSpace = h1 ? spacerBreaks(document, column) : /* @__PURE__ */ new Map();
      element.querySelectorAll("div.comparisontable:has(table)").forEach((source) => {
        source.replaceWith(plainTable(document, source.querySelector("table")));
      });
      element.querySelectorAll(GROUP).forEach((group) => {
        (headingBefore(group, h1) || group).before(marker(document, groupSpace.get(group)));
        const cta = group.querySelector(".hmk-brand-buttons a[href]") || [...group.querySelectorAll("a")].find(isBackToTop);
        if (!cta) return;
        const p = isBackToTop(cta) ? linkParagraph(document, "#top", "Back to Top") : linkParagraph(document, cta.getAttribute("href"), clean(cta.textContent));
        (cta.closest(".hmk-brand-buttons") || cta).remove();
        group.after(p);
      });
      element.querySelectorAll(CTA).forEach((cta) => cta.before(marker(document, "highlight")));
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll(`[${SECTION_MARKER_ATTR}]`).forEach((hr) => {
        const style = hr.getAttribute(SECTION_MARKER_ATTR);
        hr.removeAttribute(SECTION_MARKER_ATTR);
        hr.after(WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style }
        }));
      });
    }
  }

  // tools/importer/import-employer-plan.js
  var parsers = {
    "cards-minimal-light-sidenav": parse,
    "accordion-minimal-light": parse2,
    "table-minimal-dark-compare": parse3
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "employer-plan",
    description: `Employer plan pages (/employer/solutions/{small,large}-business/<region>/medical-plans/<plan>, and Western PA's balanced-funding and pharmacy): breadcrumbs with Print / Share, the region's plans as a left nav, the article (headings, text, images, buttons) and a grey "Get more info" right rail. The same sections as the FAQ topic pages (transformers/highmark-faq-topic-sections.js, Template faq, employer-plan).`,
    urls: [
      "https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/choice-blue",
      "https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/copay-go",
      "https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/copay-go-hdhp",
      "https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/epo-blue-easy",
      "https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/lehigh-valley-flex-blue",
      "https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/performance-blue",
      "https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/performance-blue-flex",
      "https://www.highmark.com/employer/solutions/large-business/de/medical-plans/copay-go",
      "https://www.highmark.com/employer/solutions/large-business/de/medical-plans/copay-go-hdhp",
      "https://www.highmark.com/employer/solutions/large-business/neny/medical-plans/copay-go",
      "https://www.highmark.com/employer/solutions/large-business/neny/medical-plans/copay-go-hdhp",
      "https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/copay-go",
      "https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/copay-go-hdhp",
      "https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/epo-blue-easy",
      "https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/lehigh-valley-flex-blue",
      "https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/performance-blue",
      "https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/performance-blue-flex",
      "https://www.highmark.com/employer/solutions/large-business/sepa/medical-plans/copay-go",
      "https://www.highmark.com/employer/solutions/large-business/sepa/medical-plans/copay-go-hdhp",
      "https://www.highmark.com/employer/solutions/large-business/sepa/medical-plans/epo-blue",
      "https://www.highmark.com/employer/solutions/large-business/wny/medical-plans/copay-go",
      "https://www.highmark.com/employer/solutions/large-business/wny/medical-plans/copay-go-hdhp",
      "https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/copay-go",
      "https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/copay-go-hdhp",
      "https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/epo-blue-easy",
      "https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/performance-blue",
      "https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/performance-blue-flex",
      "https://www.highmark.com/employer/solutions/large-business/wv/medical-plans/copay-go",
      "https://www.highmark.com/employer/solutions/large-business/wv/medical-plans/copay-go-hdhp",
      "https://www.highmark.com/employer/solutions/small-business/cpa/medical-plans/choice-blue",
      "https://www.highmark.com/employer/solutions/small-business/cpa/medical-plans/lehigh-valley-flex-blue",
      "https://www.highmark.com/employer/solutions/small-business/nepa/medical-plans/lehigh-valley-flex-blue",
      "https://www.highmark.com/employer/solutions/small-business/wpa/medical-plans/together-blue",
      "https://www.highmark.com/employer/solutions/large-business/wpa/balanced-funding",
      "https://www.highmark.com/employer/solutions/large-business/wpa/pharmacy",
      "https://www.highmark.com/employer/solutions/small-business/wpa/balanced-funding",
      "https://www.highmark.com/employer/solutions/small-business/wpa/pharmacy"
    ],
    blocks: [
      { name: "cards-minimal-light-sidenav", instances: ["div.col-lg-3 div.nav-container:has(.sidenav, .sidenav-item-list)"] },
      { name: "accordion-minimal-light", instances: ["div.accordianTable"] },
      // source div.comparisontable, rebuilt as a plain table by the sections transformer
      { name: "table-minimal-dark-compare", instances: ["div.faq-compare-table"] },
      { name: "section-right-rail", instances: [".rightrail-container"], section: "right-rail" },
      { name: "section-cta-highlight", instances: ["div.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive"], section: "highlight" }
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
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    const claimed = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      if (blockDef.name.startsWith("section-")) return;
      blockDef.instances.forEach((selector) => {
        let elements;
        try {
          elements = document.querySelectorAll(selector);
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
  var import_employer_plan_default = {
    /**
     * Non-breaking spaces in text ("(ACA)&nbsp;FAQ") keep the source's line breaks,
     * but the importer drops them: it copies the page before the transform, and the
     * Markdown round trip turns any left (and &nbsp; entities) into plain spaces. So,
     * on the live page, each becomes U+E000, a private-use character no step treats as
     * whitespace, and upload-to-da.mjs turns it back into &nbsp;. Other text that is
     * only spaces is left alone.
     *
     * In the answers the source spaces blocks with empty paragraphs (<p>&nbsp;</p>),
     * one line high, and only some blocks have one (a paragraph is followed by its
     * list without a gap). They're kept as a paragraph holding a zero-width space
     * (the pipeline drops a paragraph holding only &nbsp; as blank); faq.css gives
     * answer paragraphs no margins.
     */
    onLoad: ({ document }) => {
      document.querySelectorAll(".spacing section").forEach((sp) => {
        sp.setAttribute("data-space", Math.round(sp.getBoundingClientRect().height));
      });
      document.querySelectorAll("main img, #main-content img").forEach((img) => {
        if (img.complete && !img.naturalWidth && img.getAttribute("src")) img.setAttribute("data-broken", "");
      });
      document.querySelectorAll(".collapsible-item-description > p").forEach((p) => {
        if (!p.querySelector("img, br") && !p.textContent.replace(/[\s\u00a0]/g, "")) p.textContent = "\u200B";
      });
      const walker = document.createTreeWalker(
        document.body,
        4
        /* NodeFilter.SHOW_TEXT */
      );
      const texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      texts.filter((t) => t.nodeValue.includes("\xA0") && /[^\s\u00a0]/.test(t.nodeValue)).forEach((t) => {
        t.nodeValue = t.nodeValue.replace(/\u00a0/g, "\uE000");
      });
    },
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      WebImporter.DOMUtils.remove(main, [
        ".newheaderbar",
        ".newmainnavigation",
        ".empmobilenav",
        ".experiencefragment:has(.global-footer)",
        ".conf-extra-links-container",
        ".wrapper-header-container",
        ".global-footer",
        ".iedetect"
      ]);
      main.querySelectorAll("a .global-clr_externallink").forEach((span) => {
        span.before(...[...span.childNodes].filter((n) => !(n.nodeType === 1 && n.matches("i, em"))));
      });
      main.querySelectorAll("p span.p1").forEach((span) => {
        const p = span.closest("p");
        if (p.textContent.trim() !== span.textContent.trim()) return;
        const h5 = document.createElement("h5");
        h5.append(...span.childNodes);
        p.replaceWith(h5);
      });
      main.querySelectorAll("p b > br:last-child, p strong > br:last-child").forEach((br) => br.parentElement.after(br));
      main.querySelectorAll('a i[class*="material-icons"]').forEach((i) => {
        if (i.textContent.trim() === "picture_as_pdf") i.replaceWith(document.createTextNode(":pdf: "));
      });
      main.querySelectorAll(".hmk-brand-buttons a").forEach((a) => {
        const text = a.textContent.replace(/\s+/g, " ").trim();
        const href = a.getAttribute("href") || (/^get started$/i.test(text) ? "/employer/get-started" : "");
        if (!href) return;
        const p = document.createElement("p");
        const link = document.createElement("a");
        link.href = href;
        link.textContent = text;
        if (a.matches(".brand-button-normal, .brand-button-light")) {
          const wrap = document.createElement(a.matches(".brand-button-normal") ? "strong" : "em");
          wrap.append(link);
          p.append(wrap);
        } else p.append(link);
        (a.closest(".hmk-brand-buttons") || a).replaceWith(p);
      });
      main.querySelectorAll(".image a:has(img)").forEach((a) => a.replaceWith(...a.childNodes));
      const gridClass = (el, kind) => Number((el.className.match(new RegExp(`aem-GridColumn--${kind}--(\\d+)`)) || [])[1]);
      const innerGrid = (c) => c.matches("section.container-fluid-fullwidth") && c.querySelector(":scope > .parent-width > section > .aem-Grid");
      const gridSpan = (grid) => Number((grid.className.match(/aem-Grid--(\d+)(?:\s|$)/) || [])[1]);
      const leadSpacers = (grid) => {
        const r = [];
        for (const k of grid.children) {
          if (!k.matches(".spacing")) break;
          r.push(k);
        }
        return r;
      };
      const spacerPx = (sp) => {
        var _a;
        const [d, t, m] = spacerHeights(sp);
        const measured = Number((_a = sp.querySelector("section")) == null ? void 0 : _a.getAttribute("data-space"));
        return Number.isNaN(measured) || !sp.querySelector("section[data-space]") ? [d, t, m] : [measured, t, m];
      };
      const height = (spacers) => spacers.map(spacerPx).reduce((a, h) => a.map((v, i) => v + h[i]), [0, 0, 0]);
      const topStyles = (name, [d, t, m]) => [d ? `${name}-top-${d}` : "", t !== d ? `${name}-top-tablet-${t}` : "", m !== t ? `${name}-top-mobile-${m}` : ""].filter(Boolean);
      const pairOf = (a, b) => {
        const ga = a && innerGrid(a);
        const gb = b && innerGrid(b);
        if (!ga || !gb || !ga.querySelector(".image") || gb.querySelector(".image")) return null;
        return gridSpan(ga) + gridSpan(gb) === 12 ? [ga, gb] : null;
      };
      const rowCells = ([icon, text]) => {
        const iconTop = height(leadSpacers(icon));
        const textTop = height(leadSpacers(text));
        text.querySelectorAll(".gridcontrol").forEach((gc) => {
          const ul = document.createElement("ul");
          gc.querySelectorAll("li").forEach((li) => ul.append(li));
          gc.replaceWith(ul);
        });
        text.querySelectorAll(".spacing").forEach((s) => s.remove());
        const img = icon.querySelector("img:not([data-broken])");
        const content = [...text.querySelectorAll("h3, h5, p, ul")].filter((e) => !e.parentElement.closest("ul"));
        return { cells: img ? [img, content] : [content], span: gridSpan(icon), iconTop, textTop };
      };
      const rowsBlock = (rows) => {
        const { span, iconTop, textTop } = rows[0];
        const options = ["icon-rows", `icon-${span}`, ...topStyles("icon", iconTop), ...topStyles("text", textTop)];
        return WebImporter.Blocks.createBlock(document, { name: `Columns (${options.join(", ")})`, cells: rows.map((r) => r.cells) });
      };
      main.querySelectorAll(".aem-Grid").forEach((grid) => {
        const kids = [...grid.children];
        const rowEls = kids.filter((c) => {
          const g = innerGrid(c);
          const parts = g ? [...g.children] : [];
          return parts.length === 2 && pairOf(parts[0], parts[1]);
        });
        if (rowEls.length) {
          const rows = rowEls.map((c) => {
            const parts = [...innerGrid(c).children];
            return rowCells(pairOf(parts[0], parts[1]));
          });
          rowEls[0].before(rowsBlock(rows));
          kids.slice(kids.indexOf(rowEls[0]), kids.indexOf(rowEls[rowEls.length - 1]) + 1).forEach((k) => (rowEls.includes(k) || k.matches(".spacing")) && k.remove());
          return;
        }
        for (let i = 0; i < kids.length - 1; i += 1) {
          const pair = pairOf(kids[i], kids[i + 1]);
          if (pair) {
            kids[i].before(rowsBlock([rowCells(pair)]));
            kids[i].remove();
            kids[i + 1].remove();
            i += 1;
          }
        }
      });
      main.querySelectorAll(".image").forEach((cmp) => {
        const img = cmp.querySelector("img:not([data-broken])");
        if (!img) {
          cmp.remove();
          return;
        }
        const span = gridClass(cmp, "default");
        const offset = gridClass(cmp, "offset--default");
        const options = [span && span < 12 ? `span-${span}` : "", offset ? `offset-${offset}` : ""].filter(Boolean);
        const name = options.length ? `Image (${options.join(", ")})` : "Image";
        cmp.replaceChildren(WebImporter.Blocks.createBlock(document, { name, cells: [[img]] }));
        cmp.classList.remove("image");
      });
      main.querySelectorAll("section.new-hmk-brand-polar").forEach((band) => {
        if (!band.textContent.trim()) return;
        const cmpOf = (el) => el == null ? void 0 : el.closest('.cmp-text, .text, [class*="aem-GridColumn"]');
        const heading = cmpOf(band.querySelector("h2"));
        const copy = cmpOf(band.querySelector("p span.p1, h5, p"));
        const grid = (heading == null ? void 0 : heading.parentElement) || band.querySelector(".aem-Grid");
        const styles = ["accent"];
        [["span", heading], ["text-span", copy]].forEach(([name, cmp]) => {
          if (!cmp) return;
          const span = gridClass(cmp, "default") || 12;
          const phone = gridClass(cmp, "phone") || span;
          if (span < 12) styles.push(`${name}-${span}`);
          if (phone !== span) styles.push(`${name}-phone-${phone}`);
        });
        if (grid) {
          const kids = [...grid.children];
          const run = (list) => {
            const r = [];
            for (const k of list) {
              if (!k.matches(".spacing")) break;
              r.push(k);
            }
            return r;
          };
          [["top", run(kids)], ["bottom", run([...kids].reverse())]].forEach(([side, spacers]) => {
            if (!spacers.length || spacers.length === kids.length) return;
            const [d, t, m] = spacers.map(spacerHeights).reduce((a, h) => a.map((v, k) => v + h[k]), [0, 0, 0]);
            styles.push(`band-${side}-${d}`);
            if (t !== d) styles.push(`band-${side}-tablet-${t}`);
            if (m !== t) styles.push(`band-${side}-mobile-${m}`);
            spacers.forEach((sp) => sp.remove());
          });
        }
        const start = document.createElement("hr");
        start.setAttribute("data-excat-section-id", styles.join(", "));
        start.setAttribute("data-band-start", "");
        band.setAttribute("data-band", "");
        band.prepend(start);
        band.after(document.createElement("hr"));
      });
      const navEl = main.querySelector("div.col-lg-3 div.nav-container:has(.sidenav, .sidenav-item-list)");
      const hasNav = !!navEl;
      const h1 = main.querySelector("h1");
      if (h1 && hasNav) {
        let column = h1;
        while (column.parentElement && column.parentElement !== main && !column.parentElement.contains(navEl)) column = column.parentElement;
        const leaves = [...column.querySelectorAll(".aem-GridColumn")].filter((el) => !el.querySelector(".aem-GridColumn") && !el.closest(".rightrail-container, .rightRail, div.one-card-one-col-panel") && !el.querySelector(".rightrail-container, div.one-card-one-col-panel"));
        const lastContent = leaves.findLastIndex((el) => !el.matches(".spacing"));
        const trailing = leaves.slice(lastContent + 1).map(spacerHeights).reduce((sum, h) => sum.map((v, j) => v + h[j]), [0, 0, 0]);
        if (lastContent >= 0 && trailing.some(Boolean)) {
          const hr2 = document.createElement("hr");
          hr2.setAttribute("data-excat-section-id", spaceStyle(trailing));
          leaves[lastContent].after(hr2);
        }
      }
      const crumb = document.querySelector("ol.breadcrumb-list li.active");
      const crumbLabel = ((crumb == null ? void 0 : crumb.textContent) || "").replace(/\s+/g, " ").trim();
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      main.querySelectorAll("hr[data-band-start]").forEach((start) => {
        start.removeAttribute("data-band-start");
        const next = [...main.querySelectorAll("hr")].find(
          (h) => start.compareDocumentPosition(h) & 4
          /* FOLLOWING */
        );
        if (!next || !next.hasAttribute("data-excat-section-id")) return;
        const between = document.createRange();
        between.setStartAfter(start);
        between.setEndBefore(next);
        const gap = between.cloneContents();
        if (gap.textContent.trim() || gap.querySelector("img, picture, table")) return;
        next.after(start);
      });
      main.querySelectorAll("[data-band]").forEach((band) => {
        band.removeAttribute("data-band");
        const parts = [...band.querySelectorAll("hr[data-excat-section-id]")];
        const start = parts.find((h) => h.getAttribute("data-excat-section-id").startsWith("accent"));
        const inner = parts.slice(parts.indexOf(start) + 1);
        if (!start || !inner.length) return;
        const own = start.getAttribute("data-excat-section-id").split(", ");
        const keep = own.filter((t) => t === "accent" || /^(text-)?span-/.test(t));
        const bottom = own.filter((t) => t.startsWith("band-bottom"));
        start.setAttribute("data-excat-section-id", own.filter((t) => !bottom.includes(t)).join(", "));
        inner.forEach((hr2, i) => {
          const add = [...keep, ...i === inner.length - 1 ? bottom : []];
          hr2.setAttribute("data-excat-section-id", `${hr2.getAttribute("data-excat-section-id")}, ${add.join(", ")}`);
        });
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document) || {};
      meta.Template = hasNav ? "faq, employer-plan" : "legal, employer-plan";
      meta.breadcrumbs = "true";
      if (crumbLabel) meta["Breadcrumb Title"] = crumbLabel;
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
  return __toCommonJS(import_employer_plan_exports);
})();
