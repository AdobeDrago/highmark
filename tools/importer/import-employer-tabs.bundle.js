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

  // tools/importer/import-employer-tabs.js
  var import_employer_tabs_exports = {};
  __export(import_employer_tabs_exports, {
    default: () => import_employer_tabs_default
  });

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

  // tools/importer/import-employer-tabs.js
  var MEMBER_LOGIN = "https://iel.member.highmark.com/logout?end_url=https://member.myhighmark.com/sign-in";
  var clean = (text) => (text || "").replace(/\s+/g, " ").trim();
  function el(document, tag, children) {
    const e = document.createElement(tag);
    if (typeof children === "string") e.textContent = children;
    else if (children) e.append(...children);
    return e;
  }
  function inline(document, p) {
    const copy = p.cloneNode(true);
    copy.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style"));
    copy.querySelectorAll("span, b").forEach((s) => s.replaceWith(...s.childNodes));
    while (copy.lastChild && copy.lastChild.nodeName === "BR") copy.lastChild.remove();
    return [...copy.childNodes];
  }
  function paragraphs(document, cmp) {
    return [...cmp.querySelectorAll(":scope > p")].filter((p) => clean(p.textContent)).map((p) => {
      const lead = p.querySelector("span.p1");
      const isLead = lead && clean(lead.textContent) === clean(p.textContent);
      return el(document, isLead ? "h5" : "p", inline(document, p));
    });
  }
  function sectionBreak(document, main, style) {
    main.append(document.createElement("hr"));
    if (style) {
      main.append(WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } }));
    }
  }
  function buttons(document, root) {
    return [...root.querySelectorAll(".hmk-brand-buttons a[href]")].map((a) => {
      const link = el(document, "a", clean(a.textContent));
      link.href = a.getAttribute("href");
      const wrap = a.matches(".brand-button-normal") ? "strong" : "em";
      return el(document, "p", [el(document, wrap, [link])]);
    });
  }
  var import_employer_tabs_default = {
    transform: (payload) => {
      var _a;
      const { document, url, params } = payload;
      const body = document.body;
      transform("beforeTransform", body, payload);
      const crumb = document.querySelector("ol.breadcrumb-list li.active");
      const crumbHome = (((_a = document.querySelector("ol.breadcrumb-list li:first-child a")) == null ? void 0 : _a.getAttribute("href")) || "").replace(/^https:\/\/www\.highmark\.com/, "").replace(/\/$/, "");
      const crumbLabel = clean(crumb == null ? void 0 : crumb.textContent);
      const meta = WebImporter.Blocks.getMetadata(document) || {};
      const main = document.createElement("div");
      const h1 = body.querySelector("h1");
      const hero = h1.closest("section.new-hmk-brand-polar");
      main.append(WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style: "accent" } }));
      main.append(el(document, "h1", clean(h1.textContent)));
      if (hero) hero.querySelectorAll(".cmp-text").forEach((cmp) => main.append(...paragraphs(document, cmp)));
      body.querySelectorAll(".newtabnav .tab-content-container > div").forEach((panel) => {
        sectionBreak(document, main, "tab");
        const cards = panel.querySelector(".cards-variation");
        const title = cards == null ? void 0 : cards.querySelector(".cardsTitle");
        if (title) main.append(el(document, "h2", clean(title.textContent)));
        cards == null ? void 0 : cards.querySelectorAll(".cardsPara").forEach((p) => main.append(el(document, "h5", inline(document, p))));
        const rows = [...(cards == null ? void 0 : cards.querySelectorAll("li.listSmlImg")) || []].map((li) => {
          const src = li.querySelector("img");
          const img = el(document, "img");
          img.src = src.getAttribute("src");
          img.alt = src.getAttribute("alt") || "";
          const content = [];
          const h3 = li.querySelector("h3");
          if (h3) content.push(el(document, "h3", clean(h3.textContent)));
          const text = li.querySelector(".cardsText");
          if (text) content.push(el(document, "p", inline(document, text)));
          li.querySelectorAll(".hmk-brand-buttons a").forEach((a) => {
            const label = clean([...a.childNodes].filter((n) => !(n.nodeType === 1 && n.matches(".sr-only, .screen-reader-only, .hmk-visually-hidden"))).map((n) => n.textContent).join(" ")).replace(new RegExp(`,\\s*${clean(h3 == null ? void 0 : h3.textContent).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "");
            const link = el(document, "a", label);
            link.href = a.getAttribute("href") || MEMBER_LOGIN;
            content.push(el(document, "p", [link]));
          });
          return [img, content];
        });
        if (rows.length) main.append(WebImporter.Blocks.createBlock(document, { name: "Cards (small-image)", cells: rows }));
        panel.querySelectorAll(".cmp-text").forEach((cmp) => {
          if (!cmp.closest(".cards-variation")) main.append(...paragraphs(document, cmp));
        });
      });
      const blush = body.querySelector("section.new-hmk-brand-blush-twnetyfive");
      if (blush) {
        sectionBreak(document, main, "highlight");
        const h2 = blush.querySelector("h2");
        if (h2) main.append(el(document, "h2", clean(h2.textContent)));
        blush.querySelectorAll(".cmp-text").forEach((cmp) => {
          if (!cmp.querySelector("h2")) main.append(...paragraphs(document, cmp));
        });
        main.append(...buttons(document, blush));
      }
      const notes = [...body.querySelectorAll(".cmp-text")].filter((cmp) => blush && blush.compareDocumentPosition(cmp) & 4 && !blush.contains(cmp) && !cmp.closest(".global-footer, .experiencefragment, footer"));
      if (notes.length) {
        sectionBreak(document, main, "footnote");
        notes.forEach((cmp) => main.append(...paragraphs(document, cmp)));
      }
      sectionBreak(document, main);
      meta.Template = "employer-tabs";
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
        report: { title: document.title, template: "employer-tabs", blocks: ["cards"] }
      }];
    }
  };
  return __toCommonJS(import_employer_tabs_exports);
})();
