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

  // tools/importer/import-shop-home.js
  var import_shop_home_exports = {};
  __export(import_shop_home_exports, {
    default: () => import_shop_home_default
  });
  var SECTION_BREAK = "hr";
  function sectionMetadata(document, style) {
    return WebImporter.Blocks.createBlock(document, {
      name: "Section Metadata",
      cells: { Style: style }
    });
  }
  function img(document, src, alt = "") {
    const el = document.createElement("img");
    el.src = src;
    el.alt = alt;
    return el;
  }
  function cleanText(el) {
    el.querySelectorAll("br").forEach((br) => {
      if (!br.nextSibling || br.nextSibling.nodeType === 3 && !br.nextSibling.textContent.trim() && !br.nextSibling.nextSibling) br.remove();
    });
    el.innerHTML = el.innerHTML.replace(/&nbsp;/g, " ").replace(/\u00a0/g, " ");
    return el;
  }
  function plainLink(document, a) {
    const link = document.createElement("a");
    link.href = a.getAttribute("href");
    link.textContent = a.textContent.replace(/\s+/g, " ").trim();
    if (a.getAttribute("title")) link.title = a.getAttribute("title");
    const p = document.createElement("p");
    p.append(link);
    return p;
  }
  var import_shop_home_default = {
    transform: (payload) => {
      var _a, _b;
      const { document, params } = payload;
      const source = document.querySelector("main") || document.body;
      const out = document.createElement("div");
      const blocks = [];
      const heroSection = source.querySelector("section.global-highmark_blue");
      const heroHeading = heroSection == null ? void 0 : heroSection.querySelector("h1, h2");
      if (heroSection && heroHeading) {
        const h1 = document.createElement("h1");
        h1.textContent = heroHeading.textContent.replace(/\s+/g, " ").trim();
        const bg = heroSection.getAttribute("data-bg");
        const cells = [];
        if (bg) cells.push([img(document, bg)]);
        cells.push([h1]);
        out.append(WebImporter.Blocks.createBlock(document, { name: "hero-minimal-dark-withimg", cells }));
        blocks.push("hero-minimal-dark-withimg");
      }
      if (source.querySelector(".zip-county-modal, sxe-zip-county-modal-trigger")) {
        out.append(document.createElement(SECTION_BREAK));
        const p = document.createElement("p");
        p.append(document.createElement("br"));
        const a = document.createElement("a");
        a.href = "/modals/zip-county";
        a.textContent = "Change area";
        p.append(a);
        out.append(p, sectionMetadata(document, "zip-location"));
      }
      const grids = [...source.querySelectorAll(".gridcontrol .aem-hmk-row")];
      const cardCols = grids[0] ? [...grids[0].children] : [];
      const linkCols = grids[1] ? [...grids[1].children] : [];
      if (cardCols.length) {
        out.append(document.createElement(SECTION_BREAK));
        const rows = cardCols.map((col, i) => {
          var _a2;
          const image = col.querySelector("img");
          const text = col.querySelector(".cmp-text");
          const content = [];
          text == null ? void 0 : text.querySelectorAll("h1, h2, h3, h4, p").forEach((el) => content.push(cleanText(el.cloneNode(true))));
          const link = (_a2 = linkCols[i]) == null ? void 0 : _a2.querySelector("a[href]");
          if (link) {
            const p = plainLink(document, link);
            if (/marketplace/i.test((text == null ? void 0 : text.textContent) || "")) p.querySelector("a").setAttribute("href", "{{marketplace}}");
            content.push(p);
          }
          return [image ? img(document, image.getAttribute("src"), image.getAttribute("alt") || "") : "", content];
        });
        out.append(WebImporter.Blocks.createBlock(document, { name: "Cards (shop)", cells: rows }));
        blocks.push("cards");
      }
      const se = source.querySelector("section.global-pastel_blue");
      if (se) {
        out.append(document.createElement(SECTION_BREAK));
        se.querySelectorAll(".cmp-text").forEach((t) => {
          t.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach((el) => out.append(cleanText(el.cloneNode(true))));
        });
        const cta = se.querySelector("#button-component a[href], .button a[href]");
        if (cta) out.append(plainLink(document, cta));
        out.append(sectionMetadata(document, "blue, center"));
      }
      const learnHeading = [...source.querySelectorAll(".cmp-text h2")].find((h) => /learn more/i.test(h.textContent));
      if (learnHeading) {
        out.append(document.createElement(SECTION_BREAK));
        const text = learnHeading.closest(".cmp-text");
        let spanish = false;
        text.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach((el) => {
          const clone = cleanText(el.cloneNode(true));
          clone.querySelectorAll("a").forEach((a) => {
            a.removeAttribute("target");
            a.removeAttribute("rel");
            a.removeAttribute("aria-description");
            a.textContent = a.textContent.trim();
            if (/spanish/i.test(a.textContent)) {
              a.setAttribute("href", "{{spanish-brochure}}");
              spanish = true;
            } else {
              a.setAttribute("href", a.getAttribute("href").replace(/\/brochures\/[A-Z]+_(\d{4})_ACA_Brochure\.pdf$/, "/brochures/{{region-code}}_$1_ACA_Brochure.pdf"));
            }
          });
          if (clone.textContent.trim()) out.append(clone);
        });
        if (!spanish) {
          const h3 = document.createElement("h3");
          const a = document.createElement("a");
          a.setAttribute("href", "{{spanish-brochure}}");
          a.textContent = "Product Brochure Spanish";
          h3.append(a);
          out.append(h3);
        }
        let imageCmp = text.nextElementSibling;
        while (imageCmp && !imageCmp.matches(".image")) imageCmp = imageCmp.nextElementSibling;
        const image = imageCmp == null ? void 0 : imageCmp.querySelector("img");
        if (image) out.append(img(document, image.getAttribute("src"), image.getAttribute("alt") || ""));
        out.append(sectionMetadata(document, "learn-more"));
      }
      out.append(document.createElement(SECTION_BREAK));
      const description = ((_a = document.querySelector('meta[name="description"]')) == null ? void 0 : _a.getAttribute("content")) || "";
      const meta = { Title: document.title || "Shop | Home" };
      if (description) meta.Description = description;
      meta.Template = "shop-home";
      out.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      return [{
        element: out,
        path: "/shop/index",
        report: {
          title: document.title,
          template: "shop-home",
          blocks,
          captured: ((_b = document.querySelector('meta[name="captured"]')) == null ? void 0 : _b.getAttribute("content")) || ""
        }
      }];
    }
  };
  return __toCommonJS(import_shop_home_exports);
})();
