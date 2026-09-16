I'll explore the repository structure to build an informed plan.Let me examine the existing modal block, the shop content, and how blocks/scripts work here.Let me look at scripts.js, the shop home content, and how sheets/JSON work here.Let me check a couple more things — how data sheets are served locally and the IndexedDB/redux context.I have a good understanding of the codebase now. A few decisions will shape the implementation, so let me confirm them.# Shop ZIP/County Modal Plan

## Overview
Add an auto-opening modal on all Shop pages that prompts the visitor for their ZIP code and county ("Information Needed!"). The modal validates the ZIP against a data-driven "fake API" sheet (ZIP → Region), lets the user select their region/county, and persists the choice so it only appears once.

## Confirmed Decisions
- **Persistence:** Use `localStorage` (self-contained; no IndexedDB config needed). Key stores `zipCode` and selected region/county.
- **Dropdown source:** Populated from the **REGION** column of the fake API sheet.
- **Trigger:** Auto-open **only when no ZIP is stored yet**. Once set, the modal stays closed on subsequent loads.

## How It Fits the Existing Codebase
- Reuses the existing `blocks/modal/modal.js` `createModal()` / `showModal()` helpers (native `<dialog>`, backdrop, close button, `modal-open` body class) — no changes to the core modal mechanics.
- New self-contained **`zip-modal`** block that builds its own DOM (heading, ZIP input, county `<select>`, Continue button) and calls `createModal()`.
- Fake API served as a JSON sheet (EDS spreadsheet format: `{ total, offset, limit, data: [...] }`), fetched at runtime — matching how EDS data sheets normally work.
- Auto-open logic scoped to `/shop` paths, wired via a small auto-block hook so no page authoring is required on every shop page.

## Design Details

### 1. Fake API sheet (ZIP → Region)
- Create a JSON sheet file (e.g. `content/shop/zip-regions.json`) in EDS sheet format with rows:
  | ZIP | REGION |
  |------|--------|
  | 15222 | Western PA |
  | 17901 | Central PA |
  | 18073 | Southeastern PA (Dual County) |
  | 18501 | Northeastern PA |
  | 19702 | Delaware |
  | 25311 | West Virginia |
- Block fetches this sheet, builds a ZIP→region lookup, and populates the county/region dropdown from the distinct REGION values.
- (JSON data sheet only — no HTML content is generated in the content directory.)

### 2. `zip-modal` block (`blocks/zip-modal/`)
- **`zip-modal.js`**
  - Fetch the sheet; build region options for the `<select>`.
  - Compose modal content: blue-themed panel, `Information Needed!` heading, instructional subtext, white card containing a floating-label ZIP input (`Zip Code*`, pre-filled from store if present), a `Please Select County*` dropdown, and a `CONTINUE` button.
  - Validation: ZIP required + must match a sheet entry; county required. Show inline error if invalid. Optionally auto-select the matching region when a known ZIP is entered.
  - On Continue (valid): write `zipCode` + selected region/county to `localStorage`, close the dialog.
  - Export an `openZipModal()` used by the auto-open hook.
- **`zip-modal.css`**
  - Blue full-bleed modal panel, large bold white heading, centered subtext, inner white rounded card, bordered floating-label inputs, outlined dropdown, outlined Continue button — matching the mockup. Overrides scoped under `.zip-modal` / its dialog so the shared modal styles still apply.

### 3. Auto-open on all Shop pages
- Add a guarded hook (in `scripts.js` `buildAutoBlocks`/`loadLazy`, or a tiny `delayed.js` addition) that:
  - Runs only when `window.location.pathname` starts with `/shop`.
  - Reads `localStorage`; if no `zipCode` is stored, dynamically imports `zip-modal.js` and opens the modal.
  - Does nothing if a ZIP is already stored.

### 4. Preview & verify
- Load a shop page in the preview, confirm the modal auto-opens when no ZIP is stored.
- Verify dropdown is populated from the sheet, validation works, Continue persists to `localStorage` and closes.
- Reload to confirm the modal does **not** reappear once a ZIP is set. Check styling against the mockup (blue panel, white card, floating labels).

## Checklist
- [ ] Create fake API JSON sheet `content/shop/zip-regions.json` (ZIP → REGION rows) in EDS sheet format
- [ ] Create `blocks/zip-modal/zip-modal.js`: fetch sheet, build modal content, populate region dropdown
- [ ] Implement ZIP + county validation and inline error handling in `zip-modal.js`
- [ ] Persist `zipCode` + region/county to `localStorage` on Continue and close the modal
- [ ] Create `blocks/zip-modal/zip-modal.css` styled to match the mockup (blue panel, white card, floating labels, outlined button)
- [ ] Add `/shop`-scoped auto-open hook that opens the modal only when no ZIP is stored in `localStorage`
- [ ] Reuse existing `createModal()`/`showModal()` from `blocks/modal/modal.js`
- [ ] Preview a shop page: verify auto-open, dropdown data, validation, persistence, and that it stays closed after a ZIP is saved
- [ ] Verify styling against the mockup and run lint on new JS/CSS

---
*Execution requires Execute mode. Approve this plan (exit plan mode) to begin implementation.*
