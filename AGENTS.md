# AGENTS.md

Status and working notes for the Highmark AEM Edge Delivery Services project. Updated 2026-09-17.

## Project

- **Type:** AEM Edge Delivery Services, Document Authoring (`da`) content source.
- **Org / site:** `adobedrago` / `highmark` (see `.migration/project.json`).
- **Content source:** `https://content.da.live/adobedrago/highmark/` — edit at `https://da.live/edit#/adobedrago/highmark/<path>`.
- **Preview:** `https://main--highmark--adobedrago.aem.page/<path>`
- **Live:** `https://main--highmark--adobedrago.aem.live/<path>`
- **Local dev:** `http://localhost:3000/<path>` (serves fragments/content at the root and under `/content`).

### Content vs. code

- **Code** lives in this git repo (`blocks/`, `scripts/`, `styles/`).
- **Content** lives in Document Authoring, NOT in git — the local `content/` directory is a gitignored mirror for local preview only. Never hand-edit files under `content/`; publish real content changes to DA via the admin API:
  - Upload: `POST -F "data=@<file>.html;type=text/html" https://admin.da.live/source/adobedrago/highmark/<path>.html`
  - Publish: `POST https://admin.hlx.page/{preview,live}/adobedrago/highmark/main/<path>`
- Credentials for git, `admin.hlx.page`, and `admin.da.live` are injected automatically — do not paste tokens into chat.

## Shop section (current focus)

Everything under `/shop` is a migration of the Highmark ShopX Angular SPA (`shop.highmark.com`). The source is a ZIP-gated SPA with an empty static `<main>`, so pages were authored from the live client-rendered content rather than scrape-imported.

### Live shop pages (all published)

| Page | Notes |
|------|-------|
| `/shop/home` | Hero + 3 plan cards + Special Enrollment + Learn More. Canonical home. |
| `/shop/beta/home` | Same content as home (mirrors source `/beta/home`). |
| `/shop/info-pages/contact-us` | Call / Request a Call / Member Benefits / Direct Store. |
| `/shop/info-pages/find-a-doctor` | Find a Doctor + Find a Pharmacy links. |
| `/shop/info-pages/legal-policies` | Legal Notices + Other Policies. |

### Shop chrome (fragments)

- `/shop/fragments/nav` and `/shop/fragments/footer` hold the **shop-specific** header/footer.
- All shop pages set `nav` / `footer` page metadata pointing at these fragments, plus `theme: shop`.
- The site-default `/nav` and `/footer` still hold the generic highmark.com chrome — leave them for non-shop pages.

### ZIP/county modal

- Blocks: `blocks/zip-modal/` (opener + `zip-store.js` localStorage helpers + `zip-tokens.js` token substitution) and `blocks/zip-county-form/` (sheet-driven form).
- Modal content is an authored fragment at `/modals/zip-county` (heading + subtitle + `zip-county-form` block) — the aem.live modal pattern.
- Data sheets: `/shop/zip-county-form.json` (form definition) and `/shop/zip-regions.json` (ZIP → region, `ZIP`/`Option`/`Value` columns).
- **Trigger:** auto-opens on any page whose `theme` metadata is `shop`, only when no ZIP is stored in `localStorage` (key `shop-zip-county`). Gate lives in `scripts/scripts.js` (`autoOpenShopZipModal`).
- **Tokens:** `{{region}}` / `{{zip}}` anywhere in a shop doc are filled from the stored selection; token lines stay hidden until a value exists.
- **Persistence:** currently `localStorage`. Wiring into the app's Redux/IndexedDB store is tracked in issue #9.

## Open PRs

- **#16** — Fetch nav/footer from standard path first to avoid 404 console logs (branch `claude/fragment-fetch-order`). A 404 resolves rather than throws, so try/catch can't hide it; the fix reorders the fetch so the succeeding path runs first. Current working branch.
- **#13** — Fix `zip-county-form` empty form caused by DA rewriting `.json` links (branch `claude/zip-modal-sheet-path-fix`). Reads sheet paths from block row text instead of anchor hrefs.

## Known follow-ups

- Issue #9: move ZIP persistence from `localStorage` to the app's Redux/IndexedDB store.
- The two `404 /content/{nav,footer}.plain.html` console errors on published pages clear once #16 merges.

## Conventions

- Run `npm run lint` (eslint + stylelint) before opening a PR.
- Branch off `main`, open a PR, squash-merge, delete the branch.
- Verify rendering in preview (Playwright) before publishing content changes.
- Don't generate HTML directly into `content/`; use DA upload/publish or the bundled import script.
