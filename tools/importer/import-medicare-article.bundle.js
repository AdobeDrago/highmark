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

  // tools/importer/import-medicare-article.js
  var import_medicare_article_exports = {};
  __export(import_medicare_article_exports, {
    default: () => import_medicare_article_default
  });
  var SPACE = { ten: 20, twenty: 40, thirty: 60, forty: 80 };
  function spacerPx(section) {
    const m = (section.className.match(/(?:^|\s)(ten|twenty|thirty|forty)-padding/) || [])[1];
    return m ? SPACE[m] : 40;
  }
  function sectionBreak(document, main, style) {
    main.append(document.createElement("hr"));
    if (style) {
      main.append(WebImporter.Blocks.createBlock(document, {
        name: "Section Metadata",
        cells: { style }
      }));
    }
  }
  var import_medicare_article_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const body = document.body;
      const h1 = body.querySelector("h1");
      const article = h1.closest(".col-lg-8") || h1.closest(".aem-Grid");
      const crumb = document.querySelector("ol.breadcrumb-list li.active");
      const crumbLabel = ((crumb == null ? void 0 : crumb.textContent) || "").replace(/\s+/g, " ").trim();
      const meta = WebImporter.Blocks.getMetadata(document) || {};
      const main = document.createElement("div");
      const items = article.querySelectorAll(".image img, .cmp-text > *, .text > *, .spacing section");
      let pendingSpace = 0;
      items.forEach((el) => {
        if (el.matches(".spacing section")) {
          pendingSpace += spacerPx(el);
          return;
        }
        if (el.closest(".spacing")) return;
        if (pendingSpace) {
          sectionBreak(document, main, `space-${pendingSpace}`);
          pendingSpace = 0;
        }
        if (el.tagName === "IMG") {
          const img = document.createElement("img");
          img.src = el.getAttribute("src");
          img.alt = el.getAttribute("alt") || "";
          const p = document.createElement("p");
          p.append(img);
          main.append(p);
          return;
        }
        if (!/^(H[1-6]|P|UL|OL)$/.test(el.tagName)) return;
        if (el.tagName === "P" && !el.textContent.replace(/[\s ]/g, "") && !el.querySelector("img")) return;
        el.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style"));
        main.append(el.cloneNode(true));
      });
      if (pendingSpace) sectionBreak(document, main, `space-${pendingSpace}`);
      const panel = body.querySelector(".one-card-one-col-panel");
      if (panel) {
        sectionBreak(document, main, "highlight");
        const heading = panel.querySelector("h2.d-lg-block, h2");
        if (heading) {
          const h2 = document.createElement("h2");
          h2.textContent = heading.textContent.replace(/\s+/g, " ").trim();
          main.append(h2);
        }
        const text = panel.querySelector(".d-lg-block.body-text p, .body-text p");
        if (text) {
          const p = document.createElement("p");
          p.textContent = text.textContent.replace(/\s+/g, " ").trim();
          main.append(p);
        }
        panel.querySelectorAll(".hmk-brand-buttons a[href]").forEach((a) => {
          const p = document.createElement("p");
          const link = document.createElement("a");
          link.href = a.getAttribute("href");
          link.textContent = a.textContent.replace(/\s+/g, " ").trim();
          p.append(link);
          main.append(p);
        });
      }
      const notes = [...body.querySelectorAll("section.container-fluid-fullwidth p")].filter((p) => (!panel || panel.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING) && !p.closest(".one-card-one-col-panel, footer, .global-footer, .footer-content") && p.textContent.trim());
      if (notes.length) {
        sectionBreak(document, main, "footnote");
        notes.forEach((p) => main.append(p.cloneNode(true)));
      }
      sectionBreak(document, main);
      if (crumb) {
        meta.breadcrumbs = "true";
        if (crumbLabel) meta["Breadcrumb Title"] = crumbLabel;
      }
      meta.template = "medicare-article";
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      body.replaceChildren(...main.childNodes);
      WebImporter.rules.adjustImageUrls(body, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      return [{
        element: body,
        path: WebImporter.FileUtils.sanitizePath(rawPath),
        report: { title: document.title, template: "medicare-article", blocks: [] }
      }];
    }
  };
  return __toCommonJS(import_medicare_article_exports);
})();
