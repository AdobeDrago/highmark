# AGENTS.md

Status and working notes for the Highmark AEM Edge Delivery Services project. Updated 2026-10-05.

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
| `/shop/` (DA `/shop/index`) | The canonical shop home (decided 2026-10-02); `/shop`, the old `/shop/home` and `/shop/beta/home` redirect here. (`/shop/beta/home` mirrored ShopX's `/beta/home`; its ZIP lines had lost their tokens and its ShopX links 404ed, so on 2026-10-05 it was unpublished, keeping the DA document, and redirected.) Hero + ZIP location line (CHANGE AREA) + 3 plan cards + Special Enrollment + Learn More; the Marketplace and brochure links follow the visitor's region, and Southeastern PA also gets the Spanish brochure. `template: shop-home` scopes its page CSS (`body.shop-home`). |
| `/shop/info-pages/contact-us` | Call / Request a Call / Member Benefits / Direct Store. |
| `/shop/info-pages/find-a-doctor` | Find a Doctor + Find a Pharmacy links. |
| `/shop/info-pages/legal-policies` | Legal Notices + Other Policies. |

### Shop chrome (fragments)

- Shop pages get `theme: shop` plus `nav` / `footer` from the bulk `/metadata` sheet (row `/shop/**`). The site-default `/nav` and `/footer` hold the corporate highmark.com chrome; leave them for non-shop pages. `/plans/individual-families` has `theme: shop` (for the ZIP modal) but keeps the corporate chrome.
- **ShopX-style chrome** (2026-10-02) lives in `/shop/fragments/shopx-header` and `/shop/fragments/shopx-footer`. They replaced `/shop/fragments/nav` and `/shop/fragments/footer`, which were deleted.
  - Each section says what it holds with its `Style`:
    - header: `shop-brand`, `shop-utility`, `shop-title`, `shop-nav`;
    - footer: `shop-footer-logo`, `shop-footer-social`, `shop-footer-explore`, `shop-footer-care`, `shop-footer-links`, `shop-footer-legal-links` (add `piped` for `|` separators), `shop-footer-legal`.
  - Anything that differs by region is a separate section with `Regions` metadata (see the ZIP/county modal section): the logos (BCBS: none, WPA, NEPA, DE, WV, WNY; Blue Shield: CPA, SEPA, NENY), the pre-ZIP nav and footer links (`none`), the New York link set, and the 7 legal-text versions.
  - Region links are `{{tokens}}` from the regions sheet.
- **How a fragment gets this layout:** `blocks/header/header.js` and `blocks/footer/footer.js` hand it to `shop-header.js` / `shop-footer.js` when its sections carry `shop-*` styles. Other fragments keep the corporate layout. In `.plain.html` the pipeline delivers section metadata as classes and `data-` attributes on the section div.
- **What the shop header does:**
  - The region label comes from the stored selection and updates when the visitor changes ZIP; logos, links and legal text update too.
  - Below 992px a menu button opens ShopX's panel: nav, utility links, region.
  - No search box and no Text Size control (2026-10-02 decision).
  - `styles.css` reserves the header's height (208px desktop, 67px phone) for pages whose `nav` is `.../shopx-header`, so nothing shifts when it loads.
- Icons in the utility links are code icons (`:language:`, `:call:`, from `icons/`). Logos and social icons are images in the fragments' DA dot-folders.
- Copied from ShopX on 2026-10-02, with some links normalised:
  - GDPR is listed in every PA/DE/WV region.
  - Medicare is listed for Western NY too.
  - The ↗ icon marks only links that open a new tab, so our own Discover and Shop pages don't get it.
  - Discover links to our `/plans/individual-families`, where `discoverhighmark.com` now redirects.
  - "Last updated on January 31st, 2026" is static text.
  - `highmarkdirect.com` (Find a Direct Store) didn't respond from our network; check it.

### ZIP/county modal

- Blocks: `blocks/zip-modal/` (opener + `zip-store.js` selection and sheet helpers + `zip-tokens.js`, which applies the selection to a page) and `blocks/zip-county-form/` (sheet-driven form).
- Modal content is an authored fragment at `/modals/zip-county` (heading + subtitle + `zip-county-form` block) — the aem.live modal pattern. The block's rows name its sheets: `Form`, `Counties`, `Regions`.
- **Data sheets:**
  - `/shop/zip-county-form.json` is the form definition.
  - `/shop/zip-counties.json` has one row per ZIP and county: `ZIP`, `County`, `State`, `FIPS`, `Region`, `Note`. A ZIP that spans counties has one row per county.
  - `/shop/regions.json` has one row per region: `Region Code`, `Region`, `Brand`, `Marketplace`, `Brochure`, `Spanish Brochure`, plus the shop chrome's region links `Find a Doctor`, `Find a Pharmacy`, `Customer Service` and `About Us` (New York only).
  - The old `/shop/zip-regions.json` sample sheet is unused.
- **Where the ZIP data comes from** (interim, until enGen's list):
  - `tools/zip-data/build-zip-data.mjs` builds both sheets (`--upload` uploads and previews them).
  - Counties come from the Census 2020 ZIP-to-county file, with each region's counties taken from Highmark's published service-area map. 3,810 rows, 3,179 ZIPs.
  - Known gaps: PO box ZIPs aren't Census ZIP areas, so they aren't found (18501 was added by hand). Counties with under 2% of a ZIP's land are dropped. Centre County is split between Western and Central PA by an approximation (its rows carry a `Note`).
  - To use enGen's list, replace the generator's input and keep the same columns.
- **Form:**
  - After a 5-digit ZIP, County lists that ZIP's counties, as on ShopX. One county is picked for the visitor; several must be chosen.
  - A ZIP outside the footprint shows ShopX's "outside the service areas" message.
  - Continue stores `{zipCode, county, state, regionCode, region}`. A selection saved by the earlier version (no `regionCode`) counts as none, so the modal asks again.
- **Trigger:** auto-opens on any page whose `theme` metadata is `shop`, only when no selection is stored in `localStorage` (key `shop-zip-county`). Gate lives in `scripts/scripts.js` (`autoOpenShopZipModal`). Links to `/modals/zip-county` (e.g. CHANGE AREA, "find out more") open the same styled modal (`autolinkModals`).
- **What the selection changes on a page** (`zip-tokens.js`):
  - **Location line:** a section styled `zip-location` starts its first paragraph with "<County> County, <ST> <ZIP>", ahead of the CHANGE AREA link. This uses no tokens, because the DA editor strips `{{…}}` from text (it emptied `/shop/`'s line on 2026-10-01).
  - **Tokens in link URLs:** `{{zip}}`, `{{county}}`, `{{state}}`, `{{region}}`, `{{region-code}}`, and any `regions` column, lowercased and hyphenated (`{{marketplace}}`, `{{brochure}}`, `{{spanish-brochure}}`, `{{brand}}`).
    - The pipeline percent-encodes braces in hrefs, and `zip-tokens.js` decodes them.
    - A line stays hidden until every token in it is filled, so `{{spanish-brochure}}` shows only for Southeastern PA.
    - Filled links that leave highmark.com, or open a PDF, get `target="_blank"`.
    - Text tokens still work, but only survive in documents uploaded through the API, not ones edited in DA.
  - **Region-only sections:** a section with `Regions` section metadata (codes, e.g. `SEPA` or `WPA, NEPA`, or `none` for visitors without a ZIP) shows only for those regions.
- **Persistence:** currently `localStorage`. Wiring into the app's Redux/IndexedDB store is tracked in issue #9.

## Redirects (highmark.com fallback)

- `/redirects` (a DA sheet, published) sends every internal link that would 404 to the same page on highmark.com. It also mirrors the source's own redirects: `/about` → `/about/our-story`, `/privacy-center` → `/privacy-center/announcements`, Integrity & Ethics → highmarkhealth.org. 146 rows live as of 2026-10-06.
- **Redirects take precedence over pages:** a row hides any page published at that path. Don't hand-edit the sheet. After each import batch, run `node tools/redirects/build-redirects.mjs --upload` (it drops rows for paths that now have a DA document), check preview, then publish `/redirects.json`.
- The sheet is shared, and publishing it publishes whatever is in DA. Before publishing, compare DA (`admin.da.live/source/adobedrago/highmark/redirects.json`) with live, in case another batch's regenerated sheet is waiting there for its pages.
- Paths with a DA document are never redirected, so an unpublished draft 404s on live until it is published. Drafts that should stay redirected, and retired URLs, go in the script's `FORCE` list. It sends `/shop/home` and `/shop/beta/home` (copies of the old shop home) to `/shop/`, and `/shop` to `/shop/`, because a folder's index page is only served at its trailing-slash URL.
- The nav's ZIP-gated items point at Western PA pages for now: the CHIP items are our pages, and the Individual & Family items redirect to highmark.com. "Shop Individual and Family Plans" goes to `/shop/`, and "My Location" opens the ZIP modal.
- Link to pages on this site with relative paths. An absolute `https://www.highmark.com/...` link leaves the site even when we have the page; imports often keep the source's absolute links. Absolute links to pages we haven't migrated are fine.
- A paragraph that holds only a link renders as a button. Put link lists in one paragraph, one link per line (as on the `/resources/answers/faq` topic list), so long labels don't become buttons that overflow on phones.
- A metadata `Image` (the share image) must load when the page is previewed, or `og:image` becomes `about:error`. Imports copy the source's `og:image`, and on some highmark.com pages that file 404s. Without the row, the page's first image is used. That's how `/resources/spending-accounts` and `/plans/medicare/get-help` were fixed on 2026-10-05.

## Search

- `/search` is the `search` block (its one row links `/search-index.json`), laid out like highmark.com's results page: the page's authored "Search Highmark" H1 and `Breadcrumbs: true`, then a search bar, "Showing N of M results for …", title + description rows, and "Show more results" (10 at a time). When nothing matches, it shows the source's search tips and a link to the same search on highmark.com.
- The header search box submits to `/search?q=`. From the third letter it lists up to 5 matching page titles, as on highmark.com; arrow keys and Enter open one. It imports `blocks/search/search.js` the first time the box gets focus and uses the same `loadIndex` / `searchIndex` as the page, so the suggestions are the top of the results.
- Phones and tablets (below 992px), as on highmark.com (2026-10-05): the menu has no search box.
  - A search icon next to the menu button opens the box in place of the logo, with focus in it; the suggestions drop under the bar, full width.
  - A tap outside closes it, and so do tabbing out and Escape (the first Escape closes an open suggestion list).
  - `header.js` moves the one search form between the desktop nav row and the bar when the viewport crosses 992px, so the tab order follows the screen.
  - The bar keeps its height when the box opens (both are 40px), so nothing shifts; the closed menu is `visibility: hidden`, which keeps its links out of the tab order.
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

- #44 (`fix-fsa-commuter-tables`, art-golk-merkle): fixes the FSA, Commuter Benefits and HSA data tables. The FSA and Commuter Benefits pages stay unpublished until it merges. Still open as of 2026-10-05.
- `migrate-top-level-pages` (Gokulraj, 2026-10-05, not merged): 10 top-level pages (`/because-life`, `/ventures`, `/wholecare`, `/podcast`, ...), previewed but not published.
  - This batch's `/redirects` rows (links from its pages to `/ventures/*`, Medicaid and Wholecare pages we don't have) are live since 2026-10-06, in the 146-row sheet that also published `/newsroom/news-alert`. That sheet keeps `/because-life` and `/newsroom/press-releases` redirected to highmark.com: neither page has ever been published, so dropping their rows 404s those homepage links (it did, briefly, on 2026-10-06). When publishing them, run `build-redirects.mjs --upload` (it drops both rows because they have DA documents) and publish the sheet with the pages, not before.
  - It also gives `zip-county-form` a standalone mode for `/zipcode-gate-login`; the modal path is unchanged. Re-run the ZIP/region checks after it merges.

## Known follow-ups

- Issue #9: move ZIP persistence from `localStorage` to the app's Redux/IndexedDB store.
- ZIP data is interim, built from Census data (see the ZIP/county modal section) until enGen supplies the real ZIP/county list. ShopX looks ZIPs up through `api.hmhs.com/sxesvc/api/v2/zipCode/countyList`, which only allows `shop.highmark.com` (CORS) and needs its app session. It also returns rating areas and plan-year service zones, which our sheets don't carry yet.
- `/shop/` still differs from ShopX in the Special Enrollment copy alignment.
- Still 404 on live (2026-10-05): FSA and Commuter Benefits in the header (held for #44), and `/reservations/aca` on `/resources/answers/faq/insurance-terms` (broken on the source too).
- The `/resources` sub-pages Lamont imported on 2026-09-16 (published 2026-10-01) have no template, like the live FAQ pages: no breadcrumbs, and the FAQ side navs list only the current topic.
- Legal pages: the source separates content chunks with fixed "spacing" components (40px desktop / 20px tablet / 0 mobile) that have no EDS equivalent, so some of our pages run 2-8% shorter. `/privacy-center` has no page of its own; it redirects to `/privacy-center/announcements`, as on the source. `/fraud/contact` links to `/fraud/fraud-form`, the source's 55-field Health Care Fraud Form (it posts to an AEM servlet, `/bin/hmk/genericmailer`), which redirects to the source form until a form solution is chosen.
- Query index data (2026-10-02): `/about/our-story/leadership-team-board` has no title, so search labels it from its URL ("Leadership Team Board").
- The header's suggestion list fails axe's `nested-interactive` rule (serious): each `role="option"` holds a link. Fixing it means dropping the links and navigating from the option, which loses open-in-new-tab.

## Conventions

- Run `npm run lint` (eslint + stylelint) before opening a PR; CI runs the same check on every push.
- Line endings are LF, enforced by `.gitattributes` and ESLint `linebreak-style`. On Windows, set VS Code `files.eol` to `\n` so new files don't fail lint.
- Branch off `main`, open a PR, squash-merge, delete the branch.
- Verify rendering in preview (Playwright) before publishing content changes.
- Don't generate HTML directly into `content/`; use DA upload/publish or the bundled import script.
