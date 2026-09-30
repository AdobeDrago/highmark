# AGENTS.md

Status and working notes for the Highmark AEM Edge Delivery Services project. Updated 2026-09-30.

## Project

- **Type:** AEM Edge Delivery Services, Document Authoring (`da`) content source.
- **Org / site:** `adobedrago` / `highmark` (see `.migration/project.json`).
- **Content source:** `https://content.da.live/adobedrago/highmark/` — edit at `https://da.live/edit#/adobedrago/highmark/<path>`.
- **Preview:** `https://main--highmark--adobedrago.aem.page/<path>`
- **Live:** `https://main--highmark--adobedrago.aem.live/<path>`
- **Migration checklist:** [`MIGRATION-CHECKLIST.md`](MIGRATION-CHECKLIST.md) tracks every page the highmark.com homepage links to, by priority, with its status here.
- **Local dev:** `aem up` → `http://localhost:3000/<path>`, proxying content from the preview host above. Add `--html-folder content` to also serve local-only HTML from `content/` at `/content/<path>`; the header/footer fall back to `/content/{nav,footer}.plain.html` when their metadata path misses.

### Content vs. code

- **Code** lives in this git repo (`blocks/`, `scripts/`, `styles/`).
- **Content** lives in Document Authoring, NOT in git — the local `content/` directory is a gitignored mirror for local preview only. Never hand-edit files under `content/`; publish real content changes to DA via the admin API:
  - Upload: `POST -F "data=@<file>.html;type=text/html" https://admin.da.live/source/adobedrago/highmark/<path>.html`
  - Publish: `POST https://admin.hlx.page/{preview,live}/adobedrago/highmark/main/<path>`
- Credentials are not stored in the repo, and a local clone has none injected: git uses your own credential helper, preview/publish goes through AEM Sidekick, and `admin.da.live` calls need an IMS token (`aem content` does a browser login and caches it in `.hlx/.da-token.json`, which is gitignored). Never paste tokens into chat.

## Shop section (current focus)

Everything under `/shop` is a migration of the Highmark ShopX Angular SPA (`shop.highmark.com`). The source is a ZIP-gated SPA with an empty static `<main>`, so pages were authored from the live client-rendered content rather than scrape-imported.

### Live shop pages (all published)

| Page | Notes |
|------|-------|
| `/shop/home` | Hero + ZIP location line (CHANGE AREA) + 3 plan cards + Special Enrollment + Learn More; the Marketplace and brochure links follow the visitor's region. Canonical home. `template: shop-home` scopes its page CSS (`body.shop-home`). |
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
- Data sheets: `/shop/zip-county-form.json` (form definition) and `/shop/zip-regions.json` (ZIP → region: `ZIP`/`Option`/`Value`, plus optional `County`, `State`, `Region Code`, `Marketplace`). It holds one sample ZIP per region, not full ZIP coverage. County is a read-only field filled from the ZIP match as the user types (#18): the `County` column, falling back to the region.
- **Trigger:** auto-opens on any page whose `theme` metadata is `shop`, only when no ZIP is stored in `localStorage` (key `shop-zip-county`). Gate lives in `scripts/scripts.js` (`autoOpenShopZipModal`). Links to `/modals/zip-county` (e.g. CHANGE AREA, "find out more") open the same styled modal (`autolinkModals`).
- **Tokens:** `{{zip}}`, `{{region}}` and any `zip-regions` column, lowercased and hyphenated (`{{county}}`, `{{state}}`, `{{region-code}}`, `{{marketplace}}`), are filled from the stored selection. They work in text and in link URLs; the pipeline percent-encodes braces in hrefs and `zip-tokens.js` decodes them. A line stays hidden until every token in it is filled. Filled links that leave highmark.com, or open a PDF, get `target="_blank"`.
- **Persistence:** currently `localStorage`. Wiring into the app's Redux/IndexedDB store is tracked in issue #9.

## Legal pages (`template: legal`)

The footer's legal pages and their sub-pages (`/privacy`, `/fraud/*`, `/privacy-center/*`, ...) set `Template: legal` and `Breadcrumbs: true`; `styles/templates/legal.css` matches the highmark.com originals at 390 / 768 / 1280. Authoring conventions in these pages:

- A link alone in a paragraph is a plain text link. `_link_` (italic) is the uppercase text CTA (the source's `.textButton`). `**link**` (bold) is the outlined, centered brand button.
- `:pdf:` after a PDF link's text adds the PDF icon (`icons/pdf.svg`).
- Two-column content (e.g. the claims-payment region cards) is a `columns` block, two cells per row.
- Images go in DA next to the page (`/<dir>/.<page>/<file>`); SVGs over 40 KB are rasterized first (EDS rejects them).

## Open PRs

- None (as of 2026-09-30; the offshore team's `develop` work merged as #28).

## Known follow-ups

- Issue #9: move ZIP persistence from `localStorage` to the app's Redux/IndexedDB store.
- Real ZIP coverage: `/shop/zip-regions` only knows its sample ZIPs, so most real ZIPs are rejected by the modal. ShopX looks ZIPs up through `api.hmhs.com/sxesvc/api/v2/zipCode/countyList`, which only allows `shop.highmark.com` (CORS) and needs its app session.
- `/shop/home` still differs from ShopX in the shop header (title bar + region label, nav items), the Special Enrollment copy alignment, and the footer (ShopX's is light with per-region legal text).
- `/shop/beta/home`: its token lines lost their tokens ("Showing plans for · ZIP", "availability in ."), so they show empty.
- Legal pages: the source separates content chunks with fixed "spacing" components (40px desktop / 20px tablet / 0 mobile) that have no EDS equivalent, so some of our pages run 2-8% shorter. `/privacy-center` has no page or redirect (no `/redirects` sheet yet), so the "Privacy Center" side-nav link 404s and the `/privacy-center/*` breadcrumbs skip that level.
- `zip-county-form` ignores its authored sheet paths: `readConfig` only reads `<a>` hrefs, but the `/modals/zip-county` fragment holds the paths as plain text, so the block always falls back to its built-in defaults (which match today's paths). #13 would have read the row text instead, but was closed unmerged.

## Conventions

- Run `npm run lint` (eslint + stylelint) before opening a PR; CI runs the same check on every push.
- Line endings are LF, enforced by `.gitattributes` and ESLint `linebreak-style`. On Windows, set VS Code `files.eol` to `\n` so new files don't fail lint.
- Branch off `main`, open a PR, squash-merge, delete the branch.
- Verify rendering in preview (Playwright) before publishing content changes.
- Don't generate HTML directly into `content/`; use DA upload/publish or the bundled import script.
