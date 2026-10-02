# AGENTS.md

Status and working notes for the Highmark AEM Edge Delivery Services project. Updated 2026-10-02.

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

## Redirects (highmark.com fallback)

- `/redirects` (a DA sheet, published) sends every internal link that would 404 to the same page on highmark.com. It also mirrors the source's own redirects: `/about` → `/about/our-story`, `/privacy-center` → `/privacy-center/announcements`, Integrity & Ethics → highmarkhealth.org. 136 rows as of 2026-10-01.
- **Redirects take precedence over pages:** a row hides any page published at that path. Don't hand-edit the sheet. After each import batch, run `node tools/redirects/build-redirects.mjs --upload` (it drops rows for paths that now have a DA document), check preview, then publish `/redirects.json`.
- Paths with a DA document are never redirected, so an unpublished draft 404s on live until it is published. Drafts that should stay redirected go in the script's `FORCE` list.
- The nav's ZIP-gated items point at Western PA pages for now: the CHIP items are our pages, and the Individual & Family items redirect to highmark.com. "Shop Individual and Family Plans" goes to `/shop/home`, and "My Location" opens the ZIP modal.
- Link to pages on this site with relative paths. An absolute `https://www.highmark.com/...` link leaves the site even when we have the page; imports often keep the source's absolute links. Absolute links to pages we haven't migrated are fine.
- A paragraph that holds only a link renders as a button. Put link lists in one paragraph, one link per line (as on the `/resources/answers/faq` topic list), so long labels don't become buttons that overflow on phones.

## Search

- `/search` is the `search` block (its one row links `/search-index.json`), laid out like highmark.com's results page: the page's authored "Search Highmark" H1 and `Breadcrumbs: true`, then a search bar, "Showing N of M results for …", title + description rows, and "Show more results" (10 at a time). When nothing matches, it shows the source's search tips and a link to the same search on highmark.com.
- The header search box submits to `/search?q=`. From the third letter it lists up to 5 matching page titles, as on highmark.com; arrow keys and Enter open one. It imports `blocks/search/search.js` the first time the box gets focus and uses the same `loadIndex` / `searchIndex` as the page, so the suggestions are the top of the results.
- Before anything is typed, the box lists the searches in the `/search-suggestions` DA sheet, as highmark.com lists Careers, Member Login, ExpressScripts, Formulary and Dentist.
  - Columns: `Suggestion`, plus an optional `Link`. The first 5 rows are shown.
  - A row with a `Link` opens that link. Otherwise the item runs `/search` when this site has a match for it, or highmark.com's results when it doesn't, so items move to our search as pages are migrated.
  - To change the list, edit the sheet in DA, then preview and publish `/search-suggestions.json`. No code change is needed.
- Search uses its own index, `search-index` (`/search-index.json`).
  - It is defined in the site's `query.yaml` in the configuration service, not in this repo. It holds each page's title, description and the first 5,000 words of `main`.
  - It excludes fragments, drafts, sheets, `/nav`, `/footer`, `/search`, `/modals/**`, `/docs/**` and `/shop/beta/**`.
  - `main-index` (`/query-index.json`) stays metadata-only for breadcrumbs and the redirects tool.
  - Pages are indexed when published. After changing `query.yaml`, re-index everything with `POST https://admin.hlx.page/index/adobedrago/highmark/main/*` (site admin role), or use the Index Admin tool.
- Matching: every word of the query must start a word in the page's title, description, URL slug or text. Results are ordered in four groups:
  1. the whole query in the title;
  2. every word in the title;
  3. every word in the title, description or slug;
  4. pages that only match in their text, those mentioning the words most first.
- Size: the search index is about 126 KB compressed for 105 pages, and the header downloads it the first time the box gets focus. At roughly 1.2 KB per page, a full migration (~1,400 pages) would make it about 1.7 MB, so the full site will need a search service rather than this client-side index.
- `NON_PAGE` in `search.js` also keeps non-page rows out of results, as a safety net when another index is used; add other non-page paths there and to the index excludes.

## Legal pages (`template: legal`)

The footer's legal pages and their sub-pages (`/privacy`, `/fraud/*`, `/privacy-center/*`, ...) set `Template: legal` and `Breadcrumbs: true`; `styles/templates/legal.css` matches the highmark.com originals at 390 / 768 / 1280. Authoring conventions in these pages:

- A link alone in a paragraph is a plain text link. `_link_` (italic) is the uppercase text CTA (the source's `.textButton`). `**link**` (bold) is the outlined, centered brand button.
- `:pdf:` after a PDF link's text adds the PDF icon (`icons/pdf.svg`).
- Two-column content (e.g. the claims-payment region cards) is a `columns` block, two cells per row.
- Images go in DA next to the page (`/<dir>/.<page>/<file>`); SVGs over 40 KB are rasterized first (EDS rejects them).

## Open PRs

- #44 (`fix-fsa-commuter-tables`, art-golk-merkle): fixes the FSA, Commuter Benefits and HSA data tables. The FSA and Commuter Benefits pages stay unpublished until it merges. As of 2026-10-01.

## Known follow-ups

- Issue #9: move ZIP persistence from `localStorage` to the app's Redux/IndexedDB store.
- Real ZIP coverage: `/shop/zip-regions` only knows its sample ZIPs, so most real ZIPs are rejected by the modal. ShopX looks ZIPs up through `api.hmhs.com/sxesvc/api/v2/zipCode/countyList`, which only allows `shop.highmark.com` (CORS) and needs its app session.
- `/shop/home` still differs from ShopX in the shop header (title bar + region label, nav items), the Special Enrollment copy alignment, and the footer (ShopX's is light with per-region legal text).
- `/shop/beta/home`: its token lines lost their tokens ("Showing plans for · ZIP", "availability in ."), so they show empty. Its SHOP PLANS, Get Started and brochure links are ShopX-relative paths that 404 here.
- `/shop/home` was moved in DA to `/shop/index.html` and published as `/shop/` (mer81531, 2026-10-01). The live `/shop/home` is now a copy with no DA source. The move also stripped the ZIP tokens from `/shop/`'s location line, which shows "County," with no values, the same loss as `/shop/beta/home`. Agree with art-golk which URL is canonical, then restore the tokens.
- Still 404 on live (2026-10-01): FSA and Commuter Benefits in the header (held for #44), `/reservations/aca` on `/resources/answers/faq/insurance-terms` (broken on the source too), and the `/shop/beta/home` links above.
- The `/resources` sub-pages Lamont imported on 2026-09-16 (published 2026-10-01) have no template, like the live FAQ pages: no breadcrumbs, and the FAQ side navs list only the current topic.
- Legal pages: the source separates content chunks with fixed "spacing" components (40px desktop / 20px tablet / 0 mobile) that have no EDS equivalent, so some of our pages run 2-8% shorter. `/privacy-center` has no page of its own; it redirects to `/privacy-center/announcements`, as on the source. `/fraud/contact` links to `/fraud/fraud-form`, the source's 55-field Health Care Fraud Form (it posts to an AEM servlet, `/bin/hmk/genericmailer`), which redirects to the source form until a form solution is chosen.
- Query index data (2026-10-02): `/about/our-story/leadership-team-board` has no title, so search labels it from its URL ("Leadership Team Board"). `/resources/spending-accounts` and `/plans/medicare/get-help` index an `about:error` image, meaning their first image is broken.
- In the mobile drawer the search box sits below the nav sections, not at the top as `header.css` intends: its `order` rules target `.nav-primary`, which is inside the `.nav-sections` flex item.
- `zip-county-form` ignores its authored sheet paths: `readConfig` only reads `<a>` hrefs, but the `/modals/zip-county` fragment holds the paths as plain text, so the block always falls back to its built-in defaults (which match today's paths). #13 would have read the row text instead, but was closed unmerged.

## Conventions

- Run `npm run lint` (eslint + stylelint) before opening a PR; CI runs the same check on every push.
- Line endings are LF, enforced by `.gitattributes` and ESLint `linebreak-style`. On Windows, set VS Code `files.eol` to `\n` so new files don't fail lint.
- Branch off `main`, open a PR, squash-merge, delete the branch.
- Verify rendering in preview (Playwright) before publishing content changes.
- Don't generate HTML directly into `content/`; use DA upload/publish or the bundled import script.
