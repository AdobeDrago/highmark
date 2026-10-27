/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-employer-article.js
  var import_employer_article_exports = {};
  __export(import_employer_article_exports, {
    default: () => import_employer_article_default
  });

  // tools/importer/parsers/accordion-minimal-light.js
  function parse(element, { document }) {
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

  // tools/importer/import-employer-article.js
  var BANDS = [
    ["section.new-hmk-brand-papergrey", "grey"],
    ["section.new-hmk-brand-blush-twnetyfive", "highlight"],
    ["section.new-hmk-brand-polar", "accent"]
  ];
  var BAND = BANDS.map(([sel]) => sel).join(", ");
  var clean = (text) => (text || "").replace(/\s+/g, " ").trim();
  var add = (a, b) => a.map((v, i) => v + b[i]);
  var isBlank = (el) => !el.querySelector("img, br, sup") && !el.textContent.replace(/[\s\u00a0\u200b]/g, "");
  function bandStyles(side, [d, t, m]) {
    const s = [`band-${side}-${d}`];
    if (t !== d) s.push(`band-${side}-tablet-${t}`);
    if (m !== d) s.push(`band-${side}-mobile-${m}`);
    return s;
  }
  function cleanCopy(document, el) {
    const copy = el.cloneNode(true);
    copy.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style"));
    copy.removeAttribute("style");
    copy.querySelectorAll("span:not([class]), span.p1").forEach((s) => s.replaceWith(...s.childNodes));
    return copy;
  }
  function textContent(document, cmp) {
    const out = [];
    [...cmp.children].forEach((el) => {
      if (/^(SCRIPT|LINK|STYLE)$/.test(el.tagName)) return;
      if (el.tagName === "DIV") {
        if (el.querySelector("p, ul, ol, h1, h2, h3, h4, h5, h6")) {
          out.push(...textContent(document, el));
          return;
        }
        if (isBlank(el)) return;
        const prev = el.previousElementSibling;
        let p = out[out.length - 1];
        if (!((prev == null ? void 0 : prev.tagName) === "DIV" && (p == null ? void 0 : p.dataset.lines))) {
          p = document.createElement("p");
          p.dataset.lines = "true";
          out.push(p);
        } else p.append(document.createElement("br"));
        p.append(...cleanCopy(document, el).childNodes);
        return;
      }
      if (!/^(H[1-6]|P|UL|OL)$/.test(el.tagName)) return;
      if (el.tagName === "P" && isBlank(el)) return;
      const lead = el.tagName === "P" && el.querySelector(":scope > span.p1");
      if (lead && clean(lead.textContent) === clean(el.textContent)) {
        const h5 = document.createElement("h5");
        h5.append(...cleanCopy(document, lead).childNodes);
        while (h5.lastChild && h5.lastChild.nodeName === "BR") h5.lastChild.remove();
        out.push(h5);
        return;
      }
      const copy = cleanCopy(document, el);
      while (copy.lastChild && copy.lastChild.nodeName === "BR") copy.lastChild.remove();
      out.push(copy);
    });
    out.forEach((el) => el.removeAttribute("data-lines"));
    return out;
  }
  function buttonContent(document, cmp) {
    return [...cmp.querySelectorAll(".hmk-brand-buttons a[href]")].map((a) => {
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = clean(a.textContent);
      if (a.matches(".brand-button-normal, .brand-button-light")) {
        const wrap = document.createElement(a.matches(".brand-button-normal") ? "strong" : "em");
        wrap.append(link);
        p.append(wrap);
      } else p.append(link);
      return p;
    });
  }
  function sectionBreak(document, main, styles) {
    main.append(document.createElement("hr"));
    if (styles.length) {
      main.append(WebImporter.Blocks.createBlock(document, {
        name: "Section Metadata",
        cells: { style: styles.join(", ") }
      }));
    }
  }
  var import_employer_article_default = {
    /**
     * As in import-employer-plan.js: non-breaking spaces in text become U+E000 (the
     * Markdown round trip would make them spaces; upload-to-da.mjs turns them back),
     * and the Sources' empty spacer paragraphs (<p>&nbsp;</p>) a zero-width space.
     */
    onLoad: ({ document }) => {
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
      var _a, _b;
      const { document, url, params } = payload;
      const body = document.body;
      transform("beforeTransform", body, payload);
      const h1 = body.querySelector("h1");
      const column = h1.closest(".col-lg-8") || h1.closest(".page__par");
      const crumb = document.querySelector("ol.breadcrumb-list li.active");
      const crumbHome = (((_a = document.querySelector("ol.breadcrumb-list li:first-child a")) == null ? void 0 : _a.getAttribute("href")) || "").replace(/^https:\/\/www\.highmark\.com/, "").replace(/\/$/, "");
      const crumbLabel = clean(crumb == null ? void 0 : crumb.textContent);
      const meta = WebImporter.Blocks.getMetadata(document) || {};
      column.querySelectorAll("a .global-clr_externallink").forEach((span) => {
        span.replaceWith(document.createTextNode(" :external-link:"));
      });
      column.querySelectorAll("a *").forEach((el) => {
        if (/^opens a new tab or window$/i.test(clean(el.textContent))) el.remove();
      });
      column.querySelectorAll(".image a:has(img)").forEach((a) => a.replaceWith(...a.childNodes));
      const leaves = [...column.querySelectorAll(".aem-GridColumn")].filter((el) => !el.querySelector(".aem-GridColumn"));
      const isSpacer = (el) => el.matches(".spacing");
      const bandOf = (el) => {
        const band = el.closest(BAND);
        return band && column.contains(band) ? band : null;
      };
      const bandPad = /* @__PURE__ */ new Map();
      leaves.forEach((leaf) => {
        const band = bandOf(leaf);
        if (!band || bandPad.has(band)) return;
        const own = leaves.filter((l) => bandOf(l) === band);
        const lead = [];
        for (const l of own) {
          if (!isSpacer(l)) break;
          lead.push(l);
        }
        const trail = [];
        for (const l of [...own].reverse()) {
          if (!isSpacer(l) || lead.includes(l)) break;
          trail.push(l);
        }
        const sum = (list) => list.map(spacerHeights).reduce(add, [0, 0, 0]);
        bandPad.set(band, { edge: /* @__PURE__ */ new Set([...lead, ...trail]), top: sum(lead), bottom: sum(trail) });
      });
      const main = document.createElement("div");
      let pending = [0, 0, 0];
      let current = null;
      let leftBand = false;
      const bandStyle = (band) => BANDS.find(([sel]) => band.matches(sel))[1];
      leaves.forEach((leaf) => {
        const band = bandOf(leaf);
        if (band !== current) {
          const styles = [];
          if (band) {
            const pad = bandPad.get(band);
            styles.push(bandStyle(band));
            if (pending.some(Boolean)) styles.push(spaceStyle(pending));
            if (pad.top.some(Boolean)) styles.push(...bandStyles("top", pad.top));
            if (pad.bottom.some(Boolean)) styles.push(...bandStyles("bottom", pad.bottom));
            sectionBreak(document, main, styles);
            pending = [0, 0, 0];
          } else leftBand = true;
          current = band;
        }
        if (isSpacer(leaf)) {
          if (!band || !bandPad.get(band).edge.has(leaf)) pending = add(pending, spacerHeights(leaf));
          return;
        }
        if (pending.some(Boolean) || leftBand) {
          const space = pending.some(Boolean) ? [spaceStyle(pending)] : [];
          sectionBreak(document, main, [...band ? [bandStyle(band)] : [], ...space]);
          pending = [0, 0, 0];
          leftBand = false;
        }
        if (leaf.matches(".image")) {
          const src = leaf.querySelector("img");
          if (!src) return;
          const img = document.createElement("img");
          img.src = src.getAttribute("src");
          img.alt = src.getAttribute("alt") || "";
          const p = document.createElement("p");
          p.append(img);
          main.append(p);
        } else if (leaf.querySelector(".accordianTable")) {
          const acc = leaf.querySelector(".accordianTable");
          const holder = document.createElement("div");
          holder.append(acc);
          parse(acc, { document, url, params });
          main.append(...holder.childNodes);
        } else if (leaf.matches(".button") || leaf.querySelector(".hmk-brand-buttons")) {
          main.append(...buttonContent(document, leaf));
        } else {
          const cmp = leaf.matches(".cmp-text") ? leaf : leaf.querySelector(".cmp-text") || leaf;
          main.append(...textContent(document, cmp));
        }
      });
      if (pending.some(Boolean)) sectionBreak(document, main, [spaceStyle(pending)]);
      if (((_b = main.firstElementChild) == null ? void 0 : _b.tagName) === "HR") main.firstElementChild.remove();
      sectionBreak(document, main, []);
      meta.Template = "employer-article";
      meta.breadcrumbs = "true";
      if (crumbLabel) meta["Breadcrumb Title"] = crumbLabel;
      if (crumbHome.startsWith("/")) meta["Breadcrumb Home"] = crumbHome;
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      body.replaceChildren(...main.childNodes);
      transform("afterTransform", body, payload);
      WebImporter.rules.adjustImageUrls(body, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      return [{
        element: body,
        path: WebImporter.FileUtils.sanitizePath(rawPath),
        report: { title: document.title, template: "employer-article", blocks: ["accordion-minimal-light"] }
      }];
    }
  };
  return __toCommonJS(import_employer_article_exports);
})();
