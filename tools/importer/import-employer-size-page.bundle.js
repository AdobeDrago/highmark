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

  // tools/importer/import-employer-size-page.js
  var import_employer_size_page_exports = {};
  __export(import_employer_size_page_exports, {
    default: () => import_employer_size_page_default
  });
  var import_employer_size_page_default = {
    transform: (payload) => {
      var _a;
      const { document, params } = payload;
      const main = document.body;
      const title = (document.title || "").trim();
      const crumbs = [...document.querySelectorAll("ol.breadcrumb-list li a")];
      const home = ((_a = crumbs[0]) == null ? void 0 : _a.getAttribute("href")) || "/employer";
      main.replaceChildren();
      const meta = {
        Title: title,
        breadcrumbs: "true",
        "Breadcrumb Home": home.replace(/^\/content\/digital-marketing\/en\/highmark\/highmarkdotcom\/home/, "").replace(/\.html$/, "") || "/employer",
        "Breadcrumb Current": "false",
        template: "employer-subpage, employer-size-page"
      };
      main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath);
      return [{
        element: main,
        path,
        report: { title, template: "employer-size-page", blocks: [] }
      }];
    }
  };
  return __toCommonJS(import_employer_size_page_exports);
})();
