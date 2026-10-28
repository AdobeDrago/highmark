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

  // tools/importer/import-request-interview.js
  var import_request_interview_exports = {};
  __export(import_request_interview_exports, {
    default: () => import_request_interview_default
  });
  var import_request_interview_default = {
    transform: ({ document }) => {
      const popup = document.querySelector(".biomodal-content");
      const main = document.createElement("div");
      if (!popup) {
        return [{ element: main, path: "/modals/request-interview", report: { error: "no .biomodal-content on the page" } }];
      }
      const title = popup.querySelector(".biomodal-title h1, .biomodal-title h2, .biomodal-title h3, h3");
      if (title) {
        const h2 = document.createElement("h2");
        h2.textContent = title.textContent.replace(/\s+/g, " ").trim();
        main.append(h2);
      }
      const contacts = [...popup.querySelectorAll(".biomodal-contactsp, .biomodal-contactss")].map((contact) => {
        const cell = document.createElement("div");
        contact.querySelectorAll("p").forEach((p) => {
          const text = p.textContent.replace(/\s+/g, " ").trim();
          if (!text) return;
          const out = document.createElement("p");
          const link = p.querySelector("a[href]");
          if (link) {
            const a = document.createElement("a");
            a.href = link.getAttribute("href").trim();
            a.textContent = text;
            out.append(a);
          } else {
            out.textContent = text;
          }
          cell.append(out);
        });
        return cell;
      });
      if (contacts.length) {
        main.append(WebImporter.Blocks.createBlock(document, { name: "columns", cells: [contacts] }));
      }
      return [{
        element: main,
        path: "/modals/request-interview",
        report: { title: title ? title.textContent.trim() : "", contacts: contacts.length }
      }];
    }
  };
  return __toCommonJS(import_request_interview_exports);
})();
