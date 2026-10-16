# AGENTS.md

Status and working notes for the Highmark AEM Edge Delivery Services project. Updated 2026-10-13.

## Project

- **Type:** AEM Edge Delivery Services, Document Authoring (`da`) content source.
- **Org / site:** `adobedrago` / `highmark` (see `.migration/project.json`).
- **Content source:** `https://content.da.live/adobedrago/highmark/` — edit at `https://da.live/edit#/adobedrago/highmark/<path>`.
- **Preview:** `https://main--highmark--adobedrago.aem.page/<path>`
- **Live:** `https://main--highmark--adobedrago.aem.live/<path>`
- **Migration checklist:** [`MIGRATION-CHECKLIST.md`](MIGRATION-CHECKLIST.md) tracks every page the highmark.com homepage links to, by priority, with its status here, and in its last part every providers.highmark.com page (by tier, with its source template).
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

- `/redirects` (a DA sheet, published) sends every internal link that would 404 to the same page on highmark.com (on providers.highmark.com for `/providers/...`). It also mirrors the source's own redirects: `/about` → `/about/our-story`, `/privacy-center` → `/privacy-center/announcements`, Integrity & Ethics → highmarkhealth.org. 454 rows live as of 2026-10-13 (318 of them for `/providers`, most of them the provider lists' article links).
- The script reads links from every page in the live query index, plus the fragments in its `FRAGMENTS` list. Blocks load fragments in the browser, so a fragment's links are in no page's HTML; add any new fragment that holds links there. That list includes the six provider side-nav fragments, whose links gave 64 of the 65 rows added on 2026-10-08. It also reads the `Link` column of the provider list sheets in its `LISTS` list (the `provider-list` block renders them in the browser); add any new list sheet there. A list row's `Source` (the article's URL on the source) is the redirect's destination, since the `Link` path may have been made a valid page path.
- The sheet is shared, and so is the tool: on 2026-10-13 a run for the leadership bios published the regenerated sheet, which had dropped the rows of the five unpublished batch-3 list pages, so those 404ed on live from 09:24 to 15:35 UTC, until the pages were published. A regeneration drops the rows of every path that has a DA document, published or not: before publishing the sheet, check that each dropped row's page is live, or will be published with it.
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

  Within each group, provider pages (`/providers/...`) come after the others (2026-10-12): this search is reached from the corporate header, and the provider header searches providers.highmark.com. Before that, "medicare" listed three provider pages above Learn About Medicare.
- Size: the search index is about 126 KB compressed for 105 pages, and the header downloads it the first time the box gets focus. At roughly 1.2 KB per page, a full migration (~1,400 pages) would make it about 1.7 MB, so the full site will need a search service rather than this client-side index.
- `NON_PAGE` in `search.js` also keeps non-page rows out of results, as a safety net when another index is used; add other non-page paths there and to the index excludes.

## Homepage (`template: home`)

Matched to highmark.com's homepage at 1280 and 1440 on 2026-10-06: measured with Playwright, every landmark lines up within 0.1px, and a screenshot diff differs in 0.01% of pixels, all of it photo re-encoding and icon edges.

The homepage and footer content were published the same day:
- the autumn hero photo, at `/.index/home-hero-autumn-1500x500.jpg` in DA;
- the alert banner;
- today's footer link lists and legal text.

Cookie Preferences links to `#`, because this site has no cookie tool. The review drafts, `/drafts/pixel/home` and `/drafts/pixel/footer`, are no longer needed.

- **Template.** `styles/templates/home.css` holds the homepage's desktop rules (from 992px), plus white hero text at every width, since the photo is dark. Phone and tablet widths were not matched.
- **Sections.** On the source, sections butt against each other, so home sections have no outer margins.
- **Card lists.** They use the source's 400px slots (370px cards plus 15px margins; 470px cards in a two-card list) in a 1366px container with 83px padding: 2 + 1 at 1280, 3 across from 1366px.
- **Footnote.** The "Not all benefits" footnote is its own section.
- **Alert banner.** `blocks/alert-banner` is highmark.com's "Important Notifications" banner, which only the homepage shows.
  - Author it as a one-cell block at the top of the page: a title, a text and a link.
  - It moves itself above the header while the first section loads, so nothing shifts.
  - Closing it sets `sessionStorage.disabledAlertBanner`, the source's own flag.
- **Header (all pages, desktop).** Full-width bands with 64px padding:
  - utility bar: 42.5px, 145px piped cells;
  - brand row: 94px, 273 x 28 logo;
  - nav row: 60px, Sofia Pro 20px labels, a soft 5px shadow;
  - search: a 44px pill, a sixth of the row (at least 200px).

  `styles.css` reserves the 196.5px. The brand row's icon links are rebuilt as icon then label link (`decorateIconLinks`) and are copied into the phone menu.
- **Dropdowns (corporate nav, 2026-10-08).** The `/nav` menu section has Style `full width`, as the provider nav does: each dropdown opens from the row's left edge in ruled columns, as on highmark.com. Plans has six columns; Additional Plans (Dental Plans, Dental, Vision, and Hearing Plans, Travel Health Insurance) was added then, and Medicaid gained Get Help (`/wholecare/medicare/get-help`), as on the source. `/plans/additional-plans`, its Blue Edge Balance page and that Get Help page redirect to highmark.com until migrated.
- **Footer (all pages, desktop).**
  - Brand column: 400px, its items centred in 280px. Then three 240px link columns.
  - Links to other sites, and PDFs, open in a new tab with Font Awesome's external-link icon (`icons/external-link-alt.svg`, CC BY 4.0).
  - The legal text is the source's, with its non-breaking spaces and curly quotes.
- **Fonts.** Roboto comes from the Adobe Fonts kit, as on the source. `fonts.css` used to override it with local files whose vertical metrics moved text by a pixel or two.
- **Unitless values.** Where the source uses unitless line-heights or rems (1.1, 1.2, 1.6rem), so do we. A px value such as 26.4px rounds to a different 64th of a pixel in Chrome, which showed as one-pixel edges on images further down.

## FAQ topic pages (`template: faq`)

The 20 topics in the FAQ left nav (`/resources/answers/faq/*`, ACA … Spending Accounts) were re-imported on 2026-10-14 with `tools/importer/import-faq-topic.js` (template `faq-topic`, `urls-faq-topic.txt`); Breast Cancer, Cervical Cancer, Colorectal Cancer, High Blood Pressure and Medicare are new. The FAQ landing (`/resources/answers/faq`) uses the same importer and template (2026-10-14):

- **Landing.** Its left nav is "Answers" over its pages (Community Resources and Support, Frequently Asked Questions, Health Insurance Glossary, Health Insurance Articles), with the FAQ topics open under the current page and its collapse chevron (`sibling` rows, then `child` rows after the `current` one). The jump links point at the groups' heading ids, each group ends with its "SEE ALL … FAQ" link (styled like Back to Top), and the source's phone-only "Complete List of FAQS" link and topic list are kept: the list is a `mobile-only` section, hidden from 992px with that link. Health Insurance Articles has no chevron or children here (the source's is collapsed). `styles/templates/faq.css` matches highmark.com at 390 / 768 / 1024 / 1440.

- **Metadata.** `Template: faq`, `Breadcrumbs: true` and the source's crumb label as `Breadcrumb Title` ("ACA", "WNY Blue Fund"). The breadcrumbs block brings Print / Share; below 992px it shows the "‹ Frequently Asked Questions" back link. The FAQ landing (`/resources/answers/faq`) has `Breadcrumb Title: Frequently Asked Questions` (added in DA 2026-10-14), so the trail doesn't show its long page title.
- **Sections.** Left nav (every topic) | `right-rail` callout (the Blue Fund pages' Contact Us box, moved ahead of the H1) | H1 + intro | one section per FAQ group: H2, accordion, then a `Back to Top` link to `#top` | `highlight` CTA band (Blue Fund pages).
- **Layout.** From 992px a 1200px container (83px minimum gutters): left nav 25%, text 56.25%, right rail 18.75%, as the source's 3 / 9 (9 / 3) grid. Both navs float, so a long nav pushes the footer down instead of overlapping it, and the CTA band clears both. Below 992px both navs are hidden, as on the source.
- **Accordions.** The first question of each group is open; answers sit on the #f7fbfd panel.
- **Import notes.** High Blood Pressure's comparison table is rebuilt as a plain table for the `table-minimal-dark-compare` parser and styled in `faq.css`. The source's "opens a new tab or window" screen-reader text is dropped. Medicare's group H2s sit outside their accordions and are moved into each group's section.
  - **Non-breaking spaces** (2026-10-15). The source's in-text `&nbsp;`s set its line breaks ("Individual and Family / (ACA)&nbsp;FAQ"), but the importer drops them: it copies the page before the transform, and its Markdown round trip turns the character (and the entity) into a space. So `import-faq-topic.js`'s `onLoad` writes U+E000 for each on the live page, and `upload-to-da.mjs` turns it back into `&nbsp;` and rebuilds the ids of headings that hold one. 132 on the 21 pages.
  - **Spacer paragraphs in answers** (2026-10-15). The source spaces some answer blocks with an empty `<p>&nbsp;</p>`, one line high, and not others: a paragraph runs into its list (63 times) and some paragraphs follow each other without one. `onLoad` keeps them as a paragraph holding a zero-width space, 29 on the 21 pages (the pipeline drops a `<p>&nbsp;</p>` as blank), and `faq.css` gives answer paragraphs no margins.
  - **Left nav markup** (changed on the source by 2026-10-15). The topics are now `li.sidenav-item-level1` next to the parent's item, not a list under it, and a link with a submenu sits in a `div.sidenav-item-row`. The transformer nests the topics again for the sidenav parser and reads both shapes for the landing.
  - **New-tab links.** The source marks the links that open a new tab with Font Awesome's external-link icon (56 on the 21 pages; 18 other answer links leave highmark.com in the same tab). The transformer writes the `:external-link:` icon there, and `scripts.js` (`decorateFaqLinks`) opens a link holding it in a new tab, the icon reading "opens a new tab or window" to screen readers. The source's 11 new-tab links outside the answers without an icon (the Log In buttons, Measles' state links) open in the same tab here.
  - **Letter spacing.** Text paragraphs, answers included, are -0.2 / -0.4 / -0.1px (below 768 / to 991 / from 992); list items stay normal, as on the source.
- **Links.** Imports keep the source's absolute `https://www.highmark.com/...` links; `upload-to-da.mjs` now makes those to published pages (and pages in the same batch) relative.
- **Community Resources and Support** (`/resources/answers/community-assistance-resources`, 2026-10-15) uses the same importer and template: it was a sidebar-listing page without breadcrumbs. As a text page (no FAQ accordions) it shows the left nav above the H1 below 992px, as the source does, and its footnote `sup` / `sub` take no line height; bold stand-alone links are bold blue text links. The source now shows the left nav on phones on the FAQ pages too (2026-10-15); ours still hide it there. Its left nav shows the source's collapsed submenus (Frequently Asked Questions, Health Insurance Articles) with their chevrons.
- `/resources/answers/faq/medicare-reservations` (the source's old URL for the Medicare FAQ) is in `build-redirects.mjs`'s `FORCE` list, now pointing at our `/resources/answers/faq/medicare`.

## Health Insurance Glossary (`template: glossary`)

`/resources/answers/health-insurance-glossary`, re-imported on 2026-10-15 with `tools/importer/import-glossary.js` (`urls-glossary.txt`; it was a `tabbed-answers-landing` page, whose import had pointed every A–Z and Back to Top link at `/`). `styles/templates/glossary.css` matches highmark.com at 390 / 800 / 1440: every letter group lines up within 2px.

- **Sections.** A `hero-minimal-light` block (the H1 and the intro, bold for the source's lead style) | Style `glossary-letters`: the A–Z bar, a list whose letters with terms link to their group (`#a`, the id the pipeline gives the group's "A" heading) and whose others are plain text, greyed | Style `glossary`: per letter an H2 (the navy letter badge), its terms as H3 + text, and a `Back to Top` link to `#top`.
- **Metadata.** `Template: glossary`, `Breadcrumbs: true`, `Breadcrumb Title: Health Insurance Glossary`.
- **Layout.** The terms take the middle 8 of 12 columns of the 1366px container from 992px; the A–Z bar is centred when it fits and scrolls sideways when it doesn't. Lists in a term have no bullets or indent, as on the source.
- **Left out.** The source has an empty term (a blank heading) after Emergency Services, about 45px of blank space; it isn't kept.
- To add or change a term, edit the page in DA: an H3 and its text under the letter's H2. A new letter needs an H2 and its link in the A–Z list.

## Left nav (`cards-minimal-light-sidenav`)

On 57 pages (Answers, FAQ topics, About, Fraud, Privacy Center, mental-health guides, CHIP, legal pages). Rows: `parent`, then each item as `current` or `sibling`, each followed by its sub-pages as `child` rows. Under the current page they're an open list; under another sibling a collapsed submenu with its chevron, as on the source (2026-10-15).

- `tools/sidenav/sync-sidenav.mjs` compares every page's block with the source's nav (the source writes its own paths, `/content/digital-marketing/.../home/x`, which become `/x`) and, with `--apply`, rebuilds the differing blocks in DA and previews them; nothing else in the documents changes. On 2026-10-15 it rebuilt 9: the collapsed submenus on 8 pages (Corporate Responsibility's SDoH, Sustainability and Valuing Our People; Our Story's Mission and Our Businesses; Community Resources; the FAQ landing; Why Do Mental Health Conditions Occur) and the missing siblings on Sustainability and Leadership Team & Board.
- New nav links to pages we don't have 404 until `/redirects` covers them: after publishing, run `build-redirects.mjs --upload` and publish the sheet (on 2026-10-15: three Bright Blue Futures pages, `highmark-bright-blue-futures-awards`, `highmark-neny-giving`, `highmark-wny-giving`).
- Re-imports: the FAQ topic transformer builds the Answers navs with these rows; the shared sidenav parser doesn't add a sibling's submenu, so re-run the sync after other importers.
- **Layout.** A chevron toggle is 24px, 24px after its label's text, at the far edge and centred on the label. The templates (`about-article`, `chip`, `faq`, `leadership`, `legal`) lay the nav out themselves. The 9 pages without a template (the 2 Answers article pages and 7 mental-health guides) get the source's grid from 992px, in the block's CSS: a 1200px row with 82px minimum gutters, the nav a quarter (250px at 1440), the text 56.25%. The article-listing nav's indents (current item 18px, its pages 18px further) also follow the source. All 9, and Leadership Team & Board, match highmark.com within 1px at 1440, 1280 and 1024 (2026-10-15). A new template using the block must be added to the `body:not(...)` list there. On those 9 the H1 has no top margin, so it starts level with the nav right under the breadcrumbs, as on the source (2026-10-16).

## Topic hub landings (`template: topic-hub-landing`)

`/resources` and `/resources/mental-health-services`, re-imported on 2026-10-16 with `tools/importer/import-topic-hub-landing.js` (`urls-topic-hub-landing.txt`). `styles/templates/topic-hub-landing.css` matches highmark.com at 390 / 768 / 1024 / 1280 / 1440: section heights within 1px on Mental Health Services from 768 (4px at 390), and on /resources from 1280 (8px at 1024, where the source's polar-band text has a trailing empty line).

- **Sections.** The importer's sections transformer (`transformers/highmark-sections.js`) makes each source component a section, found by type, not position (the two pages have different runs). Its style is the panel's brand colour: navy `dark, center`, blush `highlight` (`text-band` for a centred callout, `columns-band` for a side panel), polar `accent`, splash `light-blue`, white none. Mental Health Services' hero is the source's newer one (`.hero-content-container`) and gets `hero-wide`. Blocks: side panels → `columns-minimal-dark`, card blocks → `cards-minimal-dark-withimg`, wide cards → `cards-minimal-dark-withimg-2`. The source's screen-reader text in links (`.hmk-visually-hidden`) is dropped.
- **Layout.** Sections sit flush. `hero-wide`: the photo sets the height (3:1 from 992; below, the source swaps in 788 × 460 and 414 × 460 crops, so ours is cut to those proportions), the text centred in the left two thirds, inset 30 / 110 (from 1024) / 150px (from 1100), the H1 90% and the subheading 85% of that. Two-column bands: from 992 text at most 502px and the 16:9 photo at most 555px, right-aligned, 48px apart when short of room, in min(1200px, 100% − 166px); below, photo then text. Three cards sit in the source's 400px slots, so they wrap 2 + 1 below 1366px; wide cards are side by side from 1100px. Gutters 30px below 768, 64px to 991.
- The blush text band's own 65px top margin (`styles.css`) is cancelled here: the card section's padding holds it.

## Breadcrumbs on imported pages

Every `/resources` page has the source's trail (2026-10-16). `tools/breadcrumbs/add-breadcrumbs.mjs [--apply] path ...` turns it on for pages imported without it: it sets `Breadcrumbs: true` and the source's active crumb as `Breadcrumb Title` in the DA metadata block and previews the page; nothing else changes (on the 11 pages it was run on, the `.plain.html` stayed byte-identical). The other crumbs come from the published ancestors, so compare the trail with the source's first. The sidebar article, guide-article and listing importers now add both rows when the source has a trail, as the topic-hub and tabbed-answers importers do.

## Regional member sub-pages (`/member/<region>/*`)

The 23 pages under the six regional member pages (`/member/bcbs`, `/blueshield`, `/bcbswv`, `/bcbsde`, `/bcbswny`, `/blueshieldneny`): Find a Dentist, Find a Pharmacy and Find a Formulary in each region, Delaware's Disputes and Appeals, and the two New York regions' Surprise Billing and Forms Library. Imported on 2026-10-15 with `tools/importer/import-member-subpage.js` (template `member-subpage`, `urls-member-subpage.txt`), which runs the FAQ topic transformer and gives each page its region's header and footer fragments. `styles/templates/member-subpage.css` matches highmark.com at 1440 / 768 / 390; 19 of the 21 article pages land within 1px of the source's footer at all three widths, and the Forms Libraries within 7px (1440 / 1024 / 768 / 390).

- **Templates.** Pages with the region's left nav: `Template: faq, member-subpage` (`faq.css` lays them out). Disputes and Appeals and the Forms Libraries have no left nav: `Template: legal, member-subpage`. A `Template` value may list several templates; `scripts.js` adds a body class and loads the stylesheet of each.
- **Breadcrumbs.** The trail's middle crumb is the region page's `Breadcrumb Title` ("Blue Cross Blue Shield", "BCBS West Virginia", "Blue Shield NENY", ...), set by `import-member-regional.js`; the current page is grey.
- **Sections.** As on the FAQ pages, plus: the spacer that closes the text is an empty `space-*` section, Find a Pharmacy's "Log in to your member portal" band is Style `light-blue`, and Surprise Billing's sections are Style `hanging-bullets` (their bullets hang outside the text; elsewhere they sit inside it, as on the source). Lead lines are H5s; a link alone in its paragraph is a plain text link.
- **Forms Library** (`blocks/forms-library`, the two NY Forms pages). The block's rows are the list: a row starting with a heading is a category (the heading and its description), the rows after it its forms (name | link, `:pdf: Download PDF` for a PDF). The block builds the source's panel beside the list: a keyword search (Enter or the search button; every word must start a word of the form's name; it resets the category to All), the category filter, and the source's "Sorry, your search for … did not return any results" message. A search hides empty categories (the source keeps their headings). Below 768px the panel folds under a Filter button, inline (the source's overlay opens under its header without the categories). Form names are H3s (H4s on the source). PDFs link to highmark.com's files.
- **Left out / differs.** Blue Shield's Find a Formulary has a stray empty paragraph after its links on the source (40px). Northeastern NY's Surprise Billing has two spans with their own letter spacing (6-20px). On phones the source's breadcrumb back link puts the label on a second line under its arrow, so our H1s sit 30-56px higher there, as on the other migrated pages. The sub-pages' source footers differ slightly from the region pages' (HIPAA where the region footer has No Surprises Act); they use the region footers.
- **Header.** Western New York's phone and tablet bar is 69px on the source (the other regions' 84px), here too since 2026-10-15. The NY regions' source headers show only a search icon from 992px; ours show the search box (follow-up).

## Legal pages (`template: legal`)

The footer's legal pages and their sub-pages (`/privacy`, `/fraud/*`, `/privacy-center/*`, ...) set `Template: legal` and `Breadcrumbs: true`; `styles/templates/legal.css` matches the highmark.com originals at 390 / 768 / 1280. Authoring conventions in these pages:

- A link alone in a paragraph is a plain text link. `_link_` (italic) is the uppercase text CTA (the source's `.textButton`). `**link**` (bold) is the outlined, centered brand button.
- `:pdf:` after a PDF link's text adds the PDF icon (`icons/pdf.svg`).
- Two-column content (e.g. the claims-payment region cards) is a `columns` block, two cells per row.
- Images go in DA next to the page (`/<dir>/.<page>/<file>`); SVGs over 40 KB are rasterized first (EDS rejects them).

## Provider pages (`/providers`, from providers.highmark.com)

Started 2026-10-07. The Provider Resource Center is migrated into this site under `/providers`: our `/providers/claims` is its `/claims`, and its home is DA `/providers/index` (served at `/providers/`).

- **Source.** 464 sitemap URLs (`providers.highmark.com/sitemap.xml`). 35 redirect to the Availity login and are not migrated: links to them go to providers.highmark.com, which sends visitors through the login. It runs on the same AEM as highmark.com (`/etc.clientlibs/hha`), and its WAF answers HEAD with 403, so use GET.
- **First pass (published 2026-10-07):** the home page, Authorizations, Claims, Policies and Programs, Provider Network, Resources and Education, Communications Hub, Contact Us and Legal Information. Matched structurally, not to the pixel. The mailing-list form (it posts to `/bin/prc/sfmc`, with reCAPTCHA) and the search results stay on the source.
- **Chrome.** The `/metadata` row `/providers/**` sets `nav` `/providers/fragments/nav`, `footer` `/providers/fragments/footer` and `breadcrumb-home` `/providers/` (published 2026-10-07). The corporate nav's "For Providers" links to `/providers/`.
  - The nav fragment has the corporate header's three sections, plus a fourth: one link whose text is the search placeholder and whose URL is the results page (`.../search-results.html?filter=All`). That puts the box in its own row and submits `q` there, without suggestions.
  - Its primary nav section's Style `full width` opens each panel from the row's left edge with ruled columns (the corporate `/nav` uses it too).
    - Each column is as wide as its longest word at least and its longest line at most; when a row is short of room, the long columns give way first.
    - Labels wrap between words, never inside one.
    - From 992 to 1199px the column gutters are 20px instead of 40px.
    - A list item without a link is a grey group label; `:lock:` after an item marks a page behind the Availity login.
  - The region picker ("All Regions") and the Availity login prompt are left out. The menu shows every item, as "All Regions" does on the source, and logging in to Availity unlocks nothing here.
  - `styles.css` reserves the 270.5px desktop header for pages whose `nav` ends in `/providers/fragments/nav`.
- **Template `providers`** (`styles/templates/providers.css`). Pages use the usual blocks; the template adds the provider site's pieces, as section styles:
  - `notice` is the home page's yellow site alert.
  - `links-bar` (with `grey`) is the "READ ABOUT EDI 278 SERVICES:" row of links.
  - `spotlight` is the Communications Hub's featured-article grid.
  - `region-panel` is one Contact Us region.
  - `dark` on a hero means white text over a dark photo (from the source's heading colour).
  - The Provider Service Center / Clinical Services cards on every page are one fragment, `/providers/fragments/service-centers` (Style `service-centers`).
- **Template `provider-content`** (`styles/templates/provider-content.css`) is for the content, manual and news-article pages (batches 2 and 4). Each page has these sections:
  1. a `provider-sidenav` block;
  2. the article;
  3. optionally the rail (Style `rail`, "Related Links" or "Quick Info");
  4. on articles, a `fragment` block for `/providers/fragments/spotlight`.

  From 992px they sit in the source's grid: the nav and the rail a quarter each, 20px before the rail, and without a rail the article runs to the edge. Below 992px the nav and the rail are hidden, as on the source.
  - **Type.** Matched to the source at 1280, 800 and 390:
    - text is Roboto 400 at 16/26 (15/25 below 992); headings are 700;
    - the title sits 68px above the text, or 8px above the "Last Updated" line, which sits 76px above it.

    `scripts.js` (`decorateProviderContent`) gives the "Last Updated: …" paragraph under the h1 the class `last-updated`. CSS can't tell an all-italic paragraph from one with a single italic phrase.
  - **Links on their own line.** `<p><a>` is a plain link (the forms and PDF lists). `_link_` (italic) is the uppercase text CTA ("Read More"). `**link**` (bold) is the filled blue button. This follows the legal pages' convention, except the bold link is filled, as on the source. The converter picks bold or italic from whether the source's button component has a background (8 buttons, 48 CTAs).
  - **Tables.** A `table` block (`no-header` when the source has no header row), with a navy header row and ruled cells.
  - **Region-tagged content and grey boxes** (`blocks/provider-panel`, 2026-10-13). `Provider Panel (region)` is the source's regional text: one row per region group, [regions | content], the regions as navy badges over the content on the source's pink (`plain`: untinted, as the source's white regional text in the newsletters); a component's groups stack edge to edge in one block. `Provider Panel` (one cell) is the source's grey box ("Additional Information"). The 92 regional-text components on 37 batch-2 pages became panels on 2026-10-13, with the 2 grey boxes batch 2 had lost (Obtaining Authorizations, Virtual Health Overview). Region lists inside accordion answers (3 pages) keep a bold label line, as a block can't sit in a block.
  - **News articles** (batch 4, 2026-10-13). The heading is the topic (a link to the list), the title, the region badges, "Published Date: …" and "For: …"; `decorateProviderContent` classes them (`article-topic`, `article-title`, `article-regions`, `article-date`, `article-for`). The side nav shows Communications Hub over the article's list, as on the source. Articles keep the "Quick Info" rail on phones, below the text, and end with the "In the Spotlight" band: `/providers/fragments/spotlight`, a `cards` block of the source's three curated articles (the same on every article; edit it once). The source's accent line (a decorative 51px bar over a footnote) is left out.
- **Side nav** (`blocks/provider-sidenav`).
  - The block is one cell linking the section's fragment, `/providers/fragments/sidenav/<section>`, for `authorization`, `claims`, `policies-and-programs`, `provider-network`, `resources-and-education` and `communications-hub`.
  - The fragment is the section's whole tree as nested lists; edit it once for the section. Document-list children (the RP-xxx PDFs) are left out, and `:lock:` marks a gated page.
  - Like the source, the block shows:
    - the current page's parent at the top;
    - the parent's children;
    - the current page in bold, with its own children open.

    Other branches have toggles.
  - A page below a listed one but not in the tree itself (a news article) gets that listed page alone, bold, under its parent.
- **Lists** (`blocks/provider-list`, batch 3, 2026-10-12). The source's list pages load their items from feeds (`/bin/prc/blog`, `/bin/prc/topics`); here each list is a DA sheet, `/providers/lists/<list>.json`, which the block renders.
  - **Sheets.** `tools/provider-lists/build-provider-lists.mjs` snapshots the five P1 lists from the source's feeds (`--upload` uploads and previews them): `reimbursement-policies`, `news-and-updates`, `provider-news`, `medical-policy-update` and `formulary-updates`. Columns: `Title`, `Link`, `Type` (Web Page or PDF), `Topic`, `For`, `Published`, `Updated`, `Regions`, `Description`, `Gated`, `Source`. The source adds news weekly, so re-run it, publish the sheets, then rebuild and publish `/redirects`.
  - **Links.** Articles link to our `/providers/...` path, which `/redirects` sends to the source until the article is migrated (decided 2026-10-12). The tool makes that path a valid page path (lowercase; anything but a-z, 0-9 and `-` becomes `-`): a redirect row can't match a path with a comma (`…24,000…`), and a migrated article will sit at the valid path. `Source` keeps the source's URL. PDFs link to the source's file, not a copy in DA; a PDF behind the Availity login (RP-019A) gets the `:lock:` icon.
  - **Authoring.** The block's first row links the sheet. An optional `Filters` row lists the filters: `Topics, For, Date Last Updated, Document Type, Sort By` (no Region filter, decided 2026-10-12; the source's "Most Relevant" sort is left out, as there is no search box). The `documents` variant is the document-list layout.
  - **Article listing** (default): topic, title, region badges, "For: … | Published Date: …" and a two-line description; newest first, 7 at a time ("View More Results"). A region-only item is tinted `#fef0ec`, with navy badges. From 992px the page uses the source's wider container, min(1180px, 100% − 20px): the filters, the title and list, then the "Quick Info" rail. Below 992px a **Filters** toggle folds the filters above the list (the source's phone version is broken), and the rail follows the list.
  - **Document list** (`documents`): PDF icon and title, "Published Date: M/YYYY | Last Updated Date: M/YYYY" and the audience line; sheet order, 10 at a time ("Load More Results"); the centre half of the usual container, as on the source.
  - Items published the same day keep the feed's order. The source's own page orders some of them differently.
- **Content choices.**
  - The landing pages' news cards (In the Spotlight, Recent News and Updates, ...) are static cards as of 2026-10-07; the list pages above have the full lists. The Communications Hub's spotlight cards (with images and descriptions) are separate from the articles' spotlight fragment.
  - The Provider News rail's links are `#` on the source; here they go where the other rails' links go (the mailing list, News and Updates, the news archive).
  - Contact Us's two tabs are two sections in a row, so the service-centre cards can link to each (`#highmark-provider-service-centers`, `#highmark-clinical-services`), and "View by region" links to the pipeline's heading ids.
  - Page titles are the source's (the home page's is "Home").
- **Converter** (`tools/provider-import`, in the repo since 2026-10-13; see its README for setup and a batch end to end):
  - `extract.mjs`: Playwright, simplified component HTML per source page (`work/src`), with collapsed accordion answers opened first; a component inside a tinted layout container (a grey box) gets `box`/`boxBg`.
  - `build.mjs`: component → block mapping, link rewriting, images into each page's dot-folder (`work/out`). Content, manual and article pages go through `buildContentPage` (article headings, region panels, grey boxes); `FRAGMENTS=1`, `SIDENAV=1` and `SPOTLIGHT=<an article's path>` also build the provider fragments. It joins DataTables' split tables (a header table, then the body table in the next component).
  - Its `LINK_FIXES` repoints links that 404 on the source too, to the same file where the source's other pages link it. There are 4 as of 2026-10-08: the WV facility manual, the MCG guidelines PDF, and the Medicare Part D hospice and Dificid prior-auth forms.
  - `upload.mjs` (DA and preview, never publish), `admin.mjs` (preview, publish, index, status), `mark.mjs` (checklist statuses); `survey.mjs`, `classify.mjs`, `menu-tree.mjs` and `sidenav-extract.mjs` rebuild the inputs in `data/`. `batches/` lists each batch's source paths.
  - Playwright and linkedom are optional, not in package.json: `npm i --no-save playwright linkedom`.
- **Tests** (`tools/tests`, see its README): the Playwright suites for the site (regression renders, search, suggestions, phone search, region, shop header) and for the provider pages (header, pages, content and articles, lists, links, list-sheet links), plus axe. `HOST` picks local (`aem up` on 3100, the default for most), preview or live.
- **Links.** Provider links are relative (`/providers/...`). `build-redirects.mjs` knows `/providers/x` comes from `providers.highmark.com/x`, so links to provider pages not yet migrated redirect there (139 rows on 2026-10-08). Each provider batch:
  1. Run the script with `--upload`. It drops the batch's rows, since the pages now have DA documents, so preview shows them.
  2. Publish the pages, then publish the sheet straight away.
  3. Re-index the batch (`POST https://admin.hlx.page/index/adobedrago/highmark/main/<path>`). A page published while a redirect row still covers its path is not indexed: no search, no breadcrumbs, and the script doesn't see its links.
  4. Run the script again so the new pages' links get rows, and publish the sheet.
- **Progress.** 112 provider pages are live as of 2026-10-13. See the checklist; P1 is done (85/85): the 2 Inter-Plan lookup forms stay on the source (decided 2026-10-13), with the 45 other source-only pages.
  - 2026-10-07: the first pass, then batch 1 (the 17 P1 landing pages).
  - 2026-10-08: batch 2 (the 63 P1 content and manual pages, with the 6 side-nav fragments), merged as #91 and published. All 63 are in both indexes. They pass at 1280, 1024 and 390, and the 782 links on the provider pages and fragments all resolve.
  - 2026-10-13: batch 3 (the 5 P1 list pages, with their 5 list sheets and the `provider-list` block), merged as #101 and published. All 5 are in both indexes; the 311 list links all resolve (217 through `/redirects` to the source, 92 PDFs, 1 behind the Availity login).
  - 2026-10-13: batch 4 (the 18 P2 pages: 16 news articles and 2 manual units, the spotlight fragment and the `provider-panel` block), with region panels and grey boxes on 39 batch-2 pages, merged as #103 and published. All 18 are in both indexes; P2 is 18/18.
- **Search.** Provider pages are in the site search (`search-index` has no `/providers/**` exclude, decided 2026-10-07). The provider header's own box searches providers.highmark.com.

## Open PRs

None as of 2026-10-06. #44 (FSA, Commuter Benefits and HSA tables) and #56 (`migrate-top-level-pages`) were merged on 2026-10-05, but their pages are mostly still preview-only:
- #44's FSA and Commuter Benefits pages are unpublished, so the header links to them 404.
- #56's 10 top-level pages (`/because-life`, `/ventures`, `/wholecare`, `/podcast`, ...) are previewed only, apart from `/newsroom/press-releases` (live 2026-10-06).
  - This batch's `/redirects` rows (links from its pages to `/ventures/*`, Medicaid and Wholecare pages we don't have) are live since 2026-10-06, in the 146-row sheet that also published `/newsroom/news-alert`. That sheet keeps `/because-life` and `/newsroom/press-releases` redirected to highmark.com: neither page has ever been published, so dropping their rows 404s those homepage links (it did, briefly, on 2026-10-06). When publishing them, run `build-redirects.mjs --upload` (it drops both rows because they have DA documents) and publish the sheet with the pages, not before.
  - It also gives `zip-county-form` a standalone mode for `/zipcode-gate-login`; the modal path is unchanged. Re-run the ZIP/region checks after it merges.

## Known follow-ups

- Issue #9: move ZIP persistence from `localStorage` to the app's Redux/IndexedDB store.
- ZIP data is interim, built from Census data (see the ZIP/county modal section) until enGen supplies the real ZIP/county list. ShopX looks ZIPs up through `api.hmhs.com/sxesvc/api/v2/zipCode/countyList`, which only allows `shop.highmark.com` (CORS) and needs its app session. It also returns rating areas and plan-year service zones, which our sheets don't carry yet.
- `/shop/` still differs from ShopX in the Special Enrollment copy alignment.
- `/shop/` is re-imported from a ShopX capture made with a Western PA ZIP (`tools/importer/import-shop-home.js`). The importer turns that region's links into the `{{marketplace}}`, `{{region-code}}` and `{{spanish-brochure}}` tokens. The 2026-10-07 re-import had hard-coded the Western PA links, which was fixed the same day; re-run the region suite after any re-import.
- Still 404 on live (2026-10-06):
  - FSA and Commuter Benefits in the header (not yet published).
  - `/reservations/aca` on `/resources/answers/faq/insurance-terms` (broken on the source too).
  - `/because-life`, which the homepage's Because Life card links to. The `/redirects` sheet republished at 10:45 and 11:22 UTC that day (144 rows) no longer redirects it, but the page isn't published yet. Gokulraj is publishing it.
- The `/resources` sub-pages Lamont imported on 2026-09-16 (published 2026-10-01) have no template; they have breadcrumbs since 2026-10-16 (see Breadcrumbs on imported pages). The HSA and HRA pages (`/resources/spending-accounts/*`) still differ from the source's layout: its title sits in a centred light-blue band with 80px above it, and its pages run about 1,650px taller; they need a re-import. The FAQ topic pages were redone on 2026-10-14 (see FAQ topic pages): the 20 pages, the re-imported FAQ landing and a `/redirects` edit (the four new pages' rows removed, `medicare-reservations` pointed at our Medicare page; 450 rows) are uploaded and previewed, not published. Publish them together after this branch merges; the main preview renders them without `faq.css` until then.
- Legal pages: the source separates content chunks with fixed "spacing" components (40px desktop / 20px tablet / 0 mobile) that have no EDS equivalent, so some of our pages run 2-8% shorter. `/privacy-center` has no page of its own; it redirects to `/privacy-center/announcements`, as on the source. `/fraud/contact` links to `/fraud/fraud-form`, the source's 55-field Health Care Fraud Form (it posts to an AEM servlet, `/bin/hmk/genericmailer`), which redirects to the source form until a form solution is chosen.
- Query index data (2026-10-02): `/about/our-story/leadership-team-board` has no title, so search labels it from its URL ("Leadership Team Board").
- The header's suggestion list fails axe's `nested-interactive` rule (serious): each `role="option"` holds a link. Fixing it means dropping the links and navigating from the option, which loses open-in-new-tab.

## Conventions

- Run `npm run lint` (eslint + stylelint) before opening a PR; CI runs the same check on every push.
- Line endings are LF, enforced by `.gitattributes` and ESLint `linebreak-style`. On Windows, set VS Code `files.eol` to `\n` so new files don't fail lint.
- Branch off `main`, open a PR, squash-merge, delete the branch.
- Verify rendering in preview (Playwright) before publishing content changes.
- Don't generate HTML directly into `content/`; use DA upload/publish or the bundled import script.
