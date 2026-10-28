---
title: "Highmark Website - Developer Guide"
subtitle: "Code, architecture and tooling of the AEM Edge Delivery Services site"
date: "October 21, 2026"
---

# Quick Reference

This guide is for the developers who maintain and extend the Highmark website on AEM Edge Delivery Services: its code, the content structures the code depends on, and the tooling that builds the site's generated content. The companion **Author Guide** covers how content is authored.

## Project URLs

| Resource | URL |
|:---------------|:----------------------------------------------|
| Code repository | `https://github.com/AdobeDrago/highmark` (branch `main`) |
| Preview | `https://main--highmark--adobedrago.aem.page/` |
| Live | `https://main--highmark--adobedrago.aem.live/` |
| Branch preview | `https://<branch>--highmark--adobedrago.aem.page/` |
| Local development | `http://localhost:3000/` (`aem up`) |
| Content (Document Authoring) | `https://da.live/#/adobedrago/highmark/` |
| Content source | `https://content.da.live/adobedrago/highmark/` |
| Admin API | `https://admin.hlx.page/` (preview, publish, index, status, config) |
| DA Source API | `https://admin.da.live/` (read and write DA documents and sheets) |

## Site configuration (Config Service)

| Setting | Value |
|:-----------------|:--------------------------------------------|
| Organization / site | `adobedrago` / `highmark`: a single, standard (not repoless) site |
| Code | GitHub `adobedrago/highmark`, synced by the AEM Code Sync GitHub app |
| Content | `https://content.da.live/adobedrago/highmark/` (type `markup`, Document Authoring) |
| Indexes | `query.yaml`: `main-index` (`/query-index.json`) and `search-index` (`/search-index.json`) |
| Access | Admin role only; sign-in required for preview and publish (`requireAuth: auto`) |
| Production CDN | None configured yet: `aem.live` is the production host |
| Sitemap, headers, robots | Not configured (defaults) |

There is no `fstab.yaml` or `helix-config.yaml`; everything above lives in the Config Service (`https://admin.hlx.page/config/adobedrago/sites/highmark.json`).

# Architecture Overview

## Tech stack

- Vanilla JavaScript (ES modules) and CSS with custom properties. No build step, no framework, no runtime dependencies: files are served as committed.
- Content from Document Authoring (DA), rendered by the Edge Delivery Services pipeline into semantic HTML that the code decorates.
- Started on 2026-08-17 from Adobe's AEM Block Collection (DA flavour); `package.json` still carries its name.

## Project structure

```
├── blocks/            40 block folders (29 project blocks, 11 untouched boilerplate)
├── scripts/
│   ├── aem.js         Core library (unmodified since the initial commit)
│   ├── scripts.js     Page decoration, loading phases, template and ZIP logic
│   ├── delayed.js     Empty
│   ├── sidekick.js    DA experimentation hook for the Sidekick
│   └── context.js     Unused DA context-editing helper
├── styles/
│   ├── styles.css     Global and section styles (imports brand.css)
│   ├── brand.css      Brand tokens: fonts, colours, heading sizes
│   ├── fonts.css      Local @font-face (loaded lazily)
│   ├── lazy-styles.css  Empty
│   └── templates/     34 page-template stylesheets
├── icons/             14 SVG icons (:name: syntax)
├── fonts/             Local font files (mostly unused, see Known Issues)
├── plugins/experimentation/  Vendored, never loaded
├── tools/             Migration and content-generation tooling (see "Tooling")
├── head.html          CSP, Adobe Fonts kit, aem.js, scripts.js, styles.css
└── .github/workflows/main.yaml   CI: lint on every push
```

There is no `templates/` folder: page templates are CSS files in `styles/templates/` plus a few body-class hooks in `scripts.js` (see "Templates").

## Loading phases (eager, lazy, delayed)

| Phase | What this site loads | Notes |
|:--------|:----------------------------------|:------------------------------|
| **Head** | CSP meta, `use.typekit.net/iaj7yko.css`, `aem.js`, `scripts.js`, `styles.css` | The Adobe Fonts stylesheet is **render-blocking** in `head.html`. It was kept deliberately to match highmark.com's font metrics. |
| **Eager** (`loadEager`) | Template classes, every template stylesheet in `Template` metadata, `decorateMain`, the per-template decorators, the first section | `body.appear` waits for the template CSS, so a template stylesheet blocks first paint. `fonts.css` also loads eagerly on screens 900px and wider. |
| **Lazy** (`loadLazy`) | Modal link handler, remaining sections, hash scroll, header, breadcrumbs, footer, `lazy-styles.css`, fonts, ZIP tokens and modal | |
| **Delayed** (`loadDelayed`) | `delayed.js` after 3 seconds | The file is empty: there is no analytics, tag manager or consent tool. Only Adobe's built-in RUM runs (about 1 in 100 visits; force with `?rum=on`). |

**Rules:** add third-party scripts to `delayed.js`, never to `scripts.js` or `head.html`. Keep the first section's blocks light; they load eagerly.

**Content Security Policy.** `head.html` sets `script-src 'nonce-aem' 'strict-dynamic' 'unsafe-inline' http: https:; base-uri 'self'; object-src 'none'` and moves it to an HTTP header. Scripts created from already-trusted scripts are allowed through `strict-dynamic`; a `<script>` tag added straight to `head.html` needs `nonce="aem"`.

## `scripts/scripts.js`

It imports from `aem.js`: `buildBlock`, `decorateBlock`, `loadBlock`, `loadHeader`, `loadFooter`, `decorateButtons`, `decorateIcons`, `decorateBlocks`, `decorateTemplateAndTheme`, `getMetadata`, `waitForFirstImage`, `loadSection`, `loadSections`, `loadCSS`, `sampleRUM`, `readBlockConfig`, `toClassName` and `toCamelCase`. Its own `decorateSections` replaces the one in `aem.js`.

| Function | Phase | What it does |
|:--------------------|:--------|:--------------------------------------------------|
| `buildHeroBlock`, `buildAutoBlocks` | Eager | Auto-builds a `hero` when a picture precedes the H1 outside any block; skipped for template `medicare-hra` |
| `decorateMain` (exported) | Eager | Buttons, icons, auto blocks, sections, blocks. Also used by `fragment.js`. |
| `decorateShopHomeLinks` | Eager | `body.shop-home`: off-site and PDF links open in a new tab |
| `decorateProviderContent` | Eager | `body.provider-content`: classes the "Last Updated" line and the news article heading parts (`article-topic`, `-title`, `-regions`, `-date`, `-for`) |
| `decorateLeadershipBio` | Eager | `body.leadership-bio`: classes paragraphs by their text, and the LinkedIn link |
| `decorateLegalLinks` | Eager | `body.legal`: classes four CMS-ONC API links by their text |
| `decorateFaqLinks` | Eager | `body.faq`: links holding `:external-link:` open in a new tab, with screen-reader text |
| `loadEager` | Eager | `lang`, template classes and CSS, breadcrumb row reservation, decorators, first section, RUM |
| `autolinkModals` | Lazy | Click delegate: links containing `/modals/zip-county` open the ZIP modal; other `/modals/` links open `blocks/modal` |
| `autoOpenShopZipModal` | Lazy | Applies ZIP tokens when `Theme: shop` or tokens are present; auto-opens the ZIP modal on `Theme: shop` pages with no stored selection |
| `loadBreadcrumbs` | Lazy | Builds the `breadcrumbs` block when `Breadcrumbs: true` |
| `loadLazy`, `loadDelayed`, `loadSidekick`, `loadPage` | | Phase orchestration; `sidekick.js` on `sidekick-ready` |
| `da()` | Module | `?dapreview` loads DA's live preview; `?daexperiment` loads DA's experiment UI |

## Templates in code

- `TEMPLATE_STYLES` (`scripts.js`) lists the 34 template names that have a stylesheet; it matches `styles/templates/` exactly. `loadEager` splits the comma-separated `Template` metadata, normalises each value with `toClassName` and loads each listed stylesheet in parallel.
- Every `Template` and `Theme` value also becomes a body class (`decorateTemplateAndTheme`), listed or not. `chip`, `chip-landing`, `topic-hub-subnav` and `shop` are styled from `styles/styles.css` and block CSS instead of a template file.
- **Adding a template** takes a file in `styles/templates/` and an entry in `TEMPLATE_STYLES`.

## Client storage, events and URL state

| Kind | Name | Owner |
|:-----------|:-------------------------|:-----------------------------|
| localStorage | `shop-zip-county` (`{zipCode, county, state, regionCode, region}`) | `blocks/zip-modal/zip-store.js` |
| sessionStorage | `disabledAlertBanner` (highmark.com's own flag) | `blocks/alert-banner` |
| sessionStorage | `fonts-loaded` | `scripts.js` |
| Custom event | `zip-county-submit` (bubbles, `detail` = the selection) | Dispatched by `zip-county-form`, handled by the shop header |
| URL state | `?q=` | `blocks/search` (`replaceState`) |
| URL state | `?keyword=&group=&year=` | `blocks/press-release-list` (`pushState`) |

# Local Development

## Prerequisites

- **Node.js 20.** CI uses 20. There is no `.nvmrc` or `engines` field yet; the tools need at least 18 (global `fetch`, `FormData`, `Blob`).
- **AEM CLI:** `npm install -g @adobe/aem-cli` (tested with 16.21).
- **Git with LF line endings.** `.gitattributes` sets `eol=lf` and ESLint enforces `linebreak-style: unix`. On Windows set VS Code's `files.eol` to `\n`.

## Setup

```bash
git clone https://github.com/AdobeDrago/highmark.git
cd highmark
npm install
aem up            # http://localhost:3000, proxying preview content
```

- `aem up` serves the working tree's code with content from `main--highmark--adobedrago.aem.page`, and reloads on file changes. A single site needs no `--pages-url`.
- **Local-only HTML:** `aem up --html-folder content` also serves files from the gitignored `content/` folder at `/content/<path>`. When the header or footer fragment named in metadata is missing, they fall back to `/content/nav.plain.html` and `/content/footer.plain.html`.
- **For the test suites,** run `aem up --port 3100 --no-open` (their default `HOST`).

## Linting

```bash
npm run lint        # eslint . && stylelint "blocks/**/*.css" "styles/**/*.css"
```

ESLint extends `airbnb-base` (browser env, `.js` extensions required in imports, `import/no-cycle` off). Stylelint uses `stylelint-config-standard`. CI runs the same command on every push.

## Credentials

Nothing is stored in the repo.

- **Preview and publish** go through the AEM Sidekick or the DA editor, signed in with your Adobe account. Your account needs a role in the site's `access` config.
- **Admin API from scripts:** an `x-auth-token` from `https://admin.hlx.page/login/adobedrago/highmark/main`.
- **DA Source API and the tools in `tools/`:** an IMS token. `npx github:adobe-rnd/da-auth-helper token` writes `~/.aem/da-token.json` (about 24 hours); `aem content` writes `.hlx/.da-token.json` (gitignored). The tools read either file and send it as a Bearer token.
- **Windows / Git Bash:** prefix tool commands that pass `/paths` as arguments with `MSYS_NO_PATHCONV=1`, or MSYS rewrites them into Windows paths.

# Design System

## Tokens

Brand tokens are in `styles/brand.css`, imported at the top of `styles.css`.

```css
/* fonts */
--heading-font-family: sofia-pro, "Helvetica Neue", helvetica, arial, sans-serif;
--body-font-family: roboto, "Helvetica Neue", helvetica, arial, sans-serif;

/* colours */
--background-color: #fff;
--text-color: #003963;        /* Highmark navy: headings and base text */
--text-body-color: #001446;   /* body copy */
--link-color: #0066b1;        /* Highmark blue */
--link-hover-color: #003963;
--light-color: #f7fbfd;       /* styles.css */
--dark-color: #003963;        /* styles.css */

/* section tints */
--highlight-color: #fef0ec;   /* blush */
--accent-color: #f7fbfd;      /* polar */
--light-blue-color: #d9ebf6;  /* splash */
--grey-color: #f1f4f4;        /* paper grey */

/* heading sizes: desktop (brand.css); below 900px styles.css overrides them */
--heading-size-xxl: 56px;  /* 36px below 900px */
--heading-size-xl: 34px;   /* 28px */
--heading-size-l: 24px;
--heading-size-m: 20px;
--heading-size-s: 18px;
--heading-size-xs: 16px;

/* body sizes */
--body-font-size-m: 16px;
--body-font-size-s: 16px;
--body-font-size-xs: 14px;

/* layout */
--content-max-width: 1200px;
--nav-height: 84px;           /* header bar below 992px */
--header-height: var(--nav-height);
--breadcrumbs-height: 44px;   /* 94px from 992px */
```

Most page layouts don't use these tokens: they carry the source site's measured values (px sizes, unitless line-heights) directly in the template and block CSS. That was deliberate, to match highmark.com within a pixel. Keep unitless values unitless: a px line-height such as 26.4px rounds differently in Chrome and shifts later images by a pixel.

## Fonts

| Family | Source | Weights | Usage |
|:---------------|:-----------------------------|:---------|:------------------|
| Sofia Pro | Adobe Fonts kit `iaj7yko` (`head.html`) | Kit weights | Headings, nav labels |
| Roboto | Adobe Fonts kit `iaj7yko` | Kit weights | Body text |
| Roboto Condensed | `fonts/roboto-condensed-bold.woff2` (`fonts.css`) | 700 | Declared, but no rule uses it |
| Material Icons | `fonts.gstatic.com` (from `cards-minimal-dark-iconnav.css`) | | Ligature icons typed as text in the quick-link bar |

Fallback faces `roboto-fallback` and `roboto-condensed-fallback` (Arial, size-adjusted) are in `styles.css`. Local Roboto files used to override the kit; their vertical metrics moved text, so they were dropped from `fonts.css`, and `fonts/roboto-{regular,medium,bold}.woff2` are now unused.

## Breakpoints

The site follows highmark.com's grid rather than the boilerplate's:

| Breakpoint | Media query | Usage |
|:-----------|:------------------------------|:------------------------------------------|
| Phone | default, `width < 768px` | Phone layouts |
| Tablet | `width >= 768px` (about 160 rules) | Tablet layouts, 64px gutters |
| Desktop | `width >= 992px` (about 150 rules) | Desktop header, multi-column layouts |
| Boilerplate | `width >= 900px` (about 40 rules) | Older block rules and heading sizes |
| Wide | `width >= 1200px`, `>= 1366px` | Card grids (three 400px slots from 1366px) |

Several one-off breakpoints (428, 576, 1024, 1100px) copy the source's art-direction and layout switches. Use 768 and 992 for new work.

## Section styles

Global section styles (`styles.css`): `light`, `accent`, `light-blue`, `blue`, `highlight`, `highlight text-band`, `dark`, `center`, `grey`. Template-scoped styles are listed per template in the Author Guide. Section metadata reaches the page as classes and `data-` attributes on the section `div` (the pipeline converts it in `.plain.html`; `scripts.js` handles unprocessed HTML).

## Header height reservation

`styles.css` reserves the header's height before it loads, keyed on the literal `nav` metadata value:

| `nav` value | Below 992px | From 992px |
|:--------------------|:----------|:----------|
| default (`/nav`) | 84px | 196.5px |
| ends `/providers/fragments/nav` | 84px | 270.5px |
| starts `/member/fragments/` | 84px (69px for `/member/fragments/bcbswny/nav`) | 154px |
| ends `/shopx-header` | 67px | 208px |
| plus breadcrumbs row | 44px | 94px |

**A new header fragment path needs a rule here**, or it gets the corporate reservation and the page shifts when the header loads.

# Blocks Reference

## Inventory

| Block | Origin | Commits | Last change |
|:--------------------------|:------------------------------|:------|:-----------|
| accordion, carousel, columns, embed, form, fragment, modal, quote, table, tabs, video | Boilerplate, untouched | 1 | 2026-08-17 |
| cards | Boilerplate + `shop` variant | 4 | 2026-10-07 |
| hero | Boilerplate + CSS `light` variant | 2 | 2026-09-10 |
| header, footer, search | Boilerplate, rewritten | 19, 16, 6 | 2026-10-19 |
| hero-minimal-dark-withimg | Project | 21 | 2026-10-19 |
| columns-minimal-dark | Project | 15 | 2026-10-16 |
| cards-minimal-dark-list | Project | 13 | 2026-10-16 |
| cards-minimal-light-sidenav | Project | 11 | 2026-10-16 |
| cards-minimal-dark-iconnav, -withimg, -withimg-icons | Project | 10 each | 2026-10-05 to 10-19 |
| cards-minimal-dark-withimg-2, form-minimal-light | Project | 9 each | 2026-10-05, 10-14 |
| accordion-minimal-light | Project | 6 | 2026-10-14 |
| columns-minimal-dark-overlay, zip-county-form, zip-modal | Project | 5 each | 2026-10-02 to 10-19 |
| press-release-list | Project | 4 | 2026-10-06 |
| breadcrumbs, table-minimal-dark-compare | Project | 3 each | 2026-10-08, 10-01 |
| alert-banner, hero-minimal-light, provider-sidenav | Project | 2 each | |
| enrollment-form, flip-cards, forms-library, provider-list, provider-panel | Project | 1 each | 2026-10-08 to 10-15 |

The untouched boilerplate blocks are unused on live pages, apart from `columns`, `table` and `fragment` (restyled by templates) and `modal` (used through links). The block READMEs and `metadata.json` files come from the importer and are partly stale (several say "No variations" for blocks that have them).

## Project blocks

| Block | Purpose | Variants (JS-checked in bold) | Key technical details |
|:------------------|:-----------------------|:------------------|:--------------------------------------------|
| hero-minimal-dark-withimg | Page hero, photo banner | `sub`, `navy`, `light`, `dark`, **`intercept`** | Exports `buildArtDirectedPicture` and `INTERCEPT_MEDIA`. Three images in the first cell become one art-directed `<picture>` (switch at 428 / 768px; `intercept` at 768 / 992px). Largest block CSS; restyled by 13 templates. |
| hero-minimal-light | Title band, no image | | CSS only (the JS is a no-op) |
| cards-minimal-dark-withimg | Image card grid | `narrow`, `underline`, `mobile-center`, `compact`, `small-image` (template-scoped CSS) | `createOptimizedPicture` at 750 and keeps authored width and height |
| cards-minimal-dark-withimg-2 | Two wide promo cards | | JS identical to boilerplate `cards.js` apart from the class prefix |
| cards-minimal-dark-withimg-icons | Illustrated cards | `underline` | Same JS as -2. `underline` is added by CSS context when in a `center` section without links. |
| cards-minimal-dark-list | Text cards | | Adds an `hr` under each H3 (see Known Issues) |
| cards-minimal-dark-iconnav | Quick-link bar | | Icon cell: image, `:icon:`, or a Material Icons ligature name as text |
| cards-minimal-light-sidenav | Left nav | | Rows `parent`, `current`, `sibling`, `child` (legacy `active`). Two shapes: guide (any sibling) and article. Falls back to matching the current path when no row is `current`. |
| columns-minimal-dark | Text beside a photo | | Adds `-N-cols` and `-img-col`; a cell holding only an `.mp4` link becomes a `<video>` |
| columns-minimal-dark-overlay | Photo band with overlaid text | | Imports the hero's picture builder; adds `-overlay-right` when the image cell is first; reads an ancestor `.highlight` section |
| accordion-minimal-light | FAQ accordion | | Rows become `details`/`summary`; first item opens only on `body.chip`, `.answers-landing`, `.faq` |
| table-minimal-dark-compare | Comparison tables | **`no-header`**, `data` | Copy of `table.js` that drops the importer's artifact first row |
| alert-banner | Homepage notification | | Moves itself before `<header>`; sessionStorage `disabledAlertBanner`; fixed id `#alert-banner-title` |
| breadcrumbs | Trail with Print and Share | | Built by `scripts.js`, not authored. Fetches `/query-index.json?limit=5000`, then each ancestor's page HTML for its `breadcrumb-title`. `navigator.share` with a clipboard fallback. |
| search | `/search` results | | Exports `loadIndex`, `searchIndex`, `queryTerms`, `pageTitle`, `fallbackSearchUrl` for the header. Fetches `/search-index.json?limit=5000`; ranking in four groups, provider pages last; `NON_PAGE` regex excludes non-pages. |
| press-release-list | Press releases, events | **`events`** | Multi-sheet (`data`, `locations`) at `?limit=1000`; filters in the URL (`pushState`, `popstate`); loads `/docs/library/icons/filter.svg` from content |
| provider-list | Provider article and document lists | **`documents`** | Sheet at `?limit=5000`; `Filters` row; region items tinted; PDF and lock icons from `/icons/` |
| provider-panel | Provider grey and region boxes | **`region`**, `plain` | Region badges as `ul[aria-label=Regions]` |
| provider-sidenav | Provider left menu | | Fetches the fragment's raw `.plain.html` (not `loadFragment`), so `decorateMain` doesn't run on it; calls `decorateIcons` itself |
| forms-library | Regional Forms Library | | Category and keyword filters; hides the section's intro paragraphs while filtering; hard-coded h2/h3 |
| form-minimal-light | Contact, fraud, news-alert forms | | Wraps `blocks/form/form.js` (doesn't load `form.css`). Adds floating labels, help and error text, and `other-of-<select>` conditional fields. POSTs JSON to the block's second link. |
| zip-county-form | Shop ZIP and county form | | Uses `form-fields.js` and `zip-store`; writes `shop-zip-county`; dispatches `zip-county-submit`; closes its `<dialog>`. Standalone mode follows a same-origin `?redirect=`. |
| zip-modal | ZIP modal and region layer (helper, not authorable) | | `zip-modal.js` (`openZipModal`, `autoOpenZipModal`), `zip-store.js` (storage, sheet paths, memoised `fetchSheet`), `zip-tokens.js` (tokens, `data-regions`, location line) |
| enrollment-form | Shop enrollment first step | | Validates `effective-date` and `radio` fields, then navigates to the authored link. Nothing is posted or stored. |
| flip-cards | Shop life-event picker | | Front and back swapped with `inert`; SVG icons kept as-is |

## Header and footer

Both pick a layout from the **shape of the fragment** named in `nav` / `footer` metadata (default `/nav`, `/footer`):

| Fragment | Header layout | Footer layout |
|:---------------------------|:-------------------------------|:-------------------------------|
| Any section styled `shop-*` | Shop header (`shop-header.js`) | Shop footer (`shop-footer.js`) |
| 3 sections | Corporate: utility, brand, menu | |
| 4 sections | Provider: corporate + a search-target link | |
| 2 sections | Regional member: brand, menu (can inherit `/nav`'s menu) | |
| Brand, columns, legal | | Corporate; `footer-regional` for `/member/fragments/`, `footer-providers` for `/providers/` paths |

- **Sections are read by position**, not by name (`header.js`, `footer.js`). Reordering a fragment's sections breaks the layout.
- The menu section's `full width` style gives the ruled full-width dropdowns. `placeSearch` moves the one search form between the desktop nav row and the phone bar at 992px.
- The header search box lazy-loads `blocks/search/search.js` on first focus and uses the same index and ranking as `/search`. Pre-typing suggestions come from `/search-suggestions.json`.
- The shop header and footer re-apply ZIP tokens and `Regions` sections when the visitor changes ZIP (`zip-county-submit`).

## ZIP and region layer

```
/modals/zip-county (DA fragment)
  └─ zip-county-form ── reads /shop/zip-county-form.json, /shop/zip-counties.json, /shop/regions.json
        └─ writes localStorage shop-zip-county, dispatches zip-county-submit
zip-tokens.js (applyZipTokens)
  ├─ {{token}} in hrefs (pipeline percent-encodes braces; decoded here) and text
  ├─ hides a line until all its tokens are filled (.zip-token-line / .zip-token-ready)
  ├─ [data-regions] sections shown only for matching regionCode (or "none")
  ├─ .zip-location: "<County> County, <ST> <ZIP>" at the start of the first paragraph
  └─ filled off-site or PDF links get target=_blank
```

- Tokens are the selection's fields plus every `regions` sheet column, lowercased and hyphenated.
- `applyZipTokens` runs on page load only when `Theme: shop` or the page contains a token; otherwise `Regions` sections all show until a submit.
- A stored selection without `regionCode` (from an earlier version) counts as none.
- The ZIP data is interim, built from Census data (see "Tooling", `zip-data`).

## Cross-block dependencies

| Module | Used by |
|:-------------------------------|:------------------------------------------------|
| `blocks/fragment` (`loadFragment`) | modal, zip-modal, shop header and footer |
| `blocks/modal` (`createModal`, `openModal`) | zip-modal, `scripts.js` |
| `blocks/form` (`form.js`, `form-fields.js`) | form-minimal-light, zip-county-form |
| `blocks/zip-modal` (`zip-store`, `zip-tokens`) | shop header and footer, zip-county-form, `scripts.js` |
| `blocks/search` | header |
| `blocks/hero-minimal-dark-withimg` (`buildArtDirectedPicture`) | columns-minimal-dark-overlay |

Template stylesheets restyle the shared blocks heavily: `hero-minimal-dark-withimg` is restyled by 13 templates, `columns-minimal-dark` by 14. When you change a block's base CSS, check the templates that override it (search `styles/templates/` for the block class) and test their example pages.

# Templates

Applied with `Template: <name>` in page metadata (comma-separated for several). Each stylesheet is scoped to `body.<name>`.

| Template | Pages | Special behaviour |
|:----------------------|:------------------------------------|:---------------------------------|
| `home` | `/` | Homepage layout; alert banner; art-directed hero and bands |
| `about-article`, `leadership`, `leadership-bio`, `bright-blue-futures`, `events` | About section | `leadership-bio`: `decorateLeadershipBio` text-to-class mapping |
| `topic-hub-landing`, `topic-hub-subnav`, `spending-account`, `answers-landing` | `/resources` | `topic-hub-subnav` has no file (styled in `styles.css`) |
| `faq` | FAQ landing and topics | `decorateFaqLinks`; accordion opens first item; spacer section styles |
| `glossary` | Health Insurance Glossary | A–Z bar and letter groups |
| `legal` | Legal, fraud and privacy pages | `decorateLegalLinks`; link-to-button conventions differ |
| `member-regional`, `member-subpage` | `/member/<region>` and sub-pages | `member-subpage` only as a second value (`faq, member-subpage` / `legal, member-subpage`) |
| `chip`, `chip-landing` | Western PA CHIP | No files (styled in `styles.css`); accordion opens first item on `chip` |
| `state-plans`, `get-help`, `learn-about-medicare`, `blue-neighbors` | `/plans` | |
| `employer-landing`, `employer-subpage` | `/employer` | Some rules keyed on heading ids |
| `campaign-landing`, `subsidiary-home` | Campaign and subsidiary pages | Some rules keyed on heading ids |
| `contact`, `media-contacts`, `capitol-hill-report`, `news-alert`, `language-assistance`, `find-care` | Single pages | |
| `providers`, `provider-content` | `/providers` | `decorateProviderContent` (article heading parts) |
| `shop-home`, `shop-page` | `/shop` | `decorateShopHomeLinks` |
| `content-landing`, `zipcode-gate-login` | Preview only | Not yet published |
| `medicare-hra` | None live | Only disables the auto hero |
| `press-releases` | `/newsroom/press-releases` | No styles; the value does nothing |

# Content the Code Depends On

The code reads these DA paths at runtime. Renaming or moving one breaks the feature.

| Path | Read by |
|:------------------------------------|:----------------------------------------|
| `/nav`, `/footer`, `/member/fragments/<region>/{nav,footer,footer-basic}` | header, footer |
| `/shop/fragments/shopx-header[-dental\|-blue-edge-balance]`, `/shop/fragments/shopx-footer` | shop header and footer |
| `/providers/fragments/{nav,footer,service-centers,spotlight}`, `/providers/fragments/sidenav/<section>` | header, footer, fragment, provider-sidenav |
| `/modals/zip-county` | zip-modal (hard-coded) |
| `/shop/zip-county-form.json`, `/shop/zip-counties.json`, `/shop/regions.json` | zip-store (defaults) |
| `/search-index.json`, `/query-index.json`, `/search-suggestions.json` | search, breadcrumbs, header |
| `/providers/lists/*.json`, `/newsroom/press-releases-data.json`, `/about/events-data.json` | provider-list, press-release-list (linked from the block) |
| `/docs/library/icons/filter.svg` | press-release-list |
| `/metadata.json` (bulk metadata) | pipeline: `nav`, `footer`, `theme`, `breadcrumb-home` for `/shop/**`, `/providers/**`, `/drafts/**` |
| `/redirects.json` | pipeline (generated by `tools/redirects`) |

**Indexes** are defined in the Config Service's `query.yaml`, not in the repo:

- `main-index`: title, description, image and lastModified for every page; used by breadcrumbs and the redirects tool.
- `search-index`: title, description and the first 5,000 words of `main`. It excludes fragments, drafts, sheets, `/nav`, `/footer`, `/search`, `/modals/**`, `/docs/**` and `/shop/beta/**`.

After changing `query.yaml`, re-index with `POST https://admin.hlx.page/index/adobedrago/highmark/main/*`. The search index is about 1 MB (280 KB compressed) for about 285 pages and is downloaded whole on first use. A full migration (about 1,400 pages) would make it around 5 MB (1.4 MB compressed), so the full site needs a search service.

**DA block library:** the DA config's `library` lists Blocks (`/docs/library/blocks.json`), Templates (`/docs/library/templates.json`, which doesn't exist) and Icons. Each block doc's sections are Library items: a `library-metadata` block (`name`, `description`), then the block. Add an item when you add a block or variant.

# Tooling

Everything under `tools/` is Node ESM (`node tools/<dir>/<script>.mjs`). Shared conventions:

- Constants: org `adobedrago`, site `highmark`, branch `main`.
- **Read-only by default.** Writes happen only behind `--upload` or `--apply`, and they write to DA and preview, **never publish** (except `provider-import/admin.mjs live`).
- Without a flag, the data builders write their JSON to the current directory: run them from a scratch directory and don't commit the output.
- Optional dependencies, not in `package.json`: `npm i --no-save playwright linkedom` and `npx playwright install chromium`.
- `tools/` isn't in `.hlxignore`, so committed files there are publicly served from the code bus at `/tools/...`.

## Generated content and its tools

| Tool | Builds | Command | Keep after migration? |
|:-----------------|:-----------------------------|:-------------------------------------|:-------------------|
| `redirects/build-redirects.mjs` | `/redirects.json` | `node tools/redirects/build-redirects.mjs [--upload]` | Yes, until no internal link points at an unmigrated page |
| `provider-lists/build-provider-lists.mjs` | `/providers/lists/<list>.json` (5 lists) | `... [--upload]` | Yes, while provider news is a feed snapshot (weekly) |
| `press-releases/build-press-releases-data.mjs` | `/newsroom/press-releases-data.json` | `... [--upload]` | While highmark.com is the source of releases |
| `events/build-events-data.mjs` | `/about/events-data.json` | `... [--upload]` | While highmark.com is the source of events |
| `zip-data/build-zip-data.mjs` | `/shop/zip-counties.json`, `/shop/regions.json` | `... [--upload]` | Until enGen's ZIP list replaces it; update each plan year |
| `forms/build-*-form-fields.mjs` | Contact and fraud form field sheets | `... <importer json> [--upload]` | No (maintain the sheets in DA) |

### Redirects (critical)

`build-redirects.mjs` crawls every page in the live query index, plus the fragments in its `FRAGMENTS` list and the `Link` column of the sheets in its `LISTS` list. It finds links that 404 on live and writes a row sending each to the same path on its source (`/providers/*` to providers.highmark.com, the rest to highmark.com), or to our page when the source itself redirects there.

- **Any path with a DA document, published or not, gets no row.** An unpublished draft therefore 404s on live once the regenerated sheet is published. Drafts that should stay redirected, and retired URLs, go in `FORCE`.
- **Redirects beat pages:** a row hides any page published at its path. Publish a page and the regenerated sheet together.
- **The sheet is shared.** Before publishing, compare DA (`admin.da.live/source/adobedrago/highmark/redirects.json`) with live, and check that every dropped row's page is live or is being published with it.
- Rows also disappear when the source returns non-200 at run time. The run aborts without writing on any 429 or 5xx.
- Add new link-bearing fragments to `FRAGMENTS` and new list sheets to `LISTS`. Never hand-edit the sheet.
- A page published while a redirect covered its path isn't indexed: re-index it (`POST https://admin.hlx.page/index/adobedrago/highmark/main/<path>`).

### Provider lists

Snapshots `providers.highmark.com/bin/prc/blog` and `/bin/prc/topics` into five sheets (`Title, Link, Type, Topic, For, Published, Updated, Regions, Description, Gated, Source`).

- Links become valid page paths (lowercase, anything outside `a-z0-9-` becomes `-`); `Source` keeps the original URL, which becomes the redirect destination.
- **Order:** re-run, publish the sheets, then rebuild and publish `/redirects`.
- A new list must also be added to `LISTS` in `build-redirects.mjs` and in `tools/tests/list-links.mjs`.

### ZIP data

Builds the interim shop data from the Census 2020 ZIP-to-county file (downloaded each run) and county-to-region tables hard-coded from Highmark's service-area map.

- Drops counties with under 2% of a ZIP's land.
- PO-box ZIPs are missing; `EXTRA_ROWS` adds 18501.
- Centre County is split by an approximation (`CENTRE_WESTERN_ZIPS`).
- The brochure base URL is hard-coded to the 2026 plan year.
- `--upload` overwrites `regions.json`; DA edits are lost.
- To switch to enGen's list, replace the input and keep the columns.

## Migration tooling

| Tool | Purpose | Keep after migration? |
|:-------------------|:--------------------------------------------|:------------------|
| `importer/` | Import scripts per page template (`import-<template>.js`, about 40), `parsers/` (20 block parsers), `transformers/` (21), `urls-<template>.txt`, esbuild bundles (`*.bundle.js`), `upload-to-da.mjs` | Until the remaining highmark.com pages are migrated |
| `provider-import/` | Custom converter for providers.highmark.com: `extract.mjs` (Playwright), `build.mjs`, `upload.mjs`, `admin.mjs` (preview, live, index, status), `mark.mjs` (checklist). See its README for a batch end to end. | Until the remaining provider pages are done; `admin.mjs` stays useful |
| `sidenav/sync-sidenav.mjs` | Rebuilds left-nav blocks from highmark.com's menu (`--apply`) | **No:** it overwrites hand edits; retire at cut-over |
| `breadcrumbs/add-breadcrumbs.mjs` | Adds `Breadcrumbs` and `Breadcrumb Title` metadata from the source's trail | No |
| `demo/`, `demo-app*` | DA App SDK samples from the boilerplate | No (delete) |
| `sidekick/config.json` | Legacy Sidekick config (project name still "DA Block Collection") | Fix the name |

**Importer notes:**

- The importer's runner (Adobe's import tooling) isn't in the repo. Edit `import-<template>.js`, then rebuild its bundle with `npx @adobe/aem-import-helper bundle --importjs tools/importer/import-<x>.js`; the runner executes the bundle.
- The runner writes `content/<path>.plain.html` (gitignored). `upload-to-da.mjs` then:
  - makes highmark.com links to live pages relative;
  - restores non-breaking spaces;
  - uploads images into DA dot-folders;
  - uploads and previews the document.
- Re-imports overwrite DA edits. After a batch:
  1. run `build-redirects.mjs --upload`;
  2. run `sync-sidenav.mjs`;
  3. run `add-breadcrumbs.mjs` where needed.

# Testing and CI

## CI

`.github/workflows/main.yaml` runs on every push: Ubuntu, Node 20, `npm ci`, `npm run lint`. **No tests run in CI** and there is no deploy step; code reaches preview and live through the AEM Code Sync app as soon as a branch is pushed (`<branch>--highmark--adobedrago.aem.page`).

## Test suites (`tools/tests/`)

Playwright scripts run with `node tools/tests/<suite>.mjs`. They print PASS / FAIL lines and a summary; screenshots go to the gitignored `tools/tests/shots/`.

`HOST` selects the target:

- the default `http://localhost:3100` is `aem up --port 3100 --no-open`, i.e. your working tree with preview content;
- `HOST=https://main--highmark--adobedrago.aem.page` tests preview;
- `HOST=https://main--highmark--adobedrago.aem.live` tests live (the default of `regression`, `provider-links` and `list-links`).

| Suite | Covers |
|:----------------------|:----------------------------------------------------|
| `regression.mjs` | 18 key pages at 1280 and 390: console errors, failed requests, broken images, unloaded blocks, horizontal scroll, H1 |
| `search.mjs`, `suggestions.mjs`, `phone-search.mjs` | Header type-ahead, `/search` ranking and paging, suggestions sheet, phone search |
| `region.mjs`, `shop-chrome.mjs` | ZIP modal, stored selection, location line, region links; shop header and footer per region |
| `provider-header.mjs`, `provider-pages.mjs`, `provider-content.mjs`, `provider-lists.mjs` | Provider header, landing pages, content pages and articles, list pages |
| `provider-links.mjs`, `list-links.mjs` | Every link on provider pages and fragments; every list-sheet link through `/redirects` |
| `a11y.mjs` | axe-core 4.10.2, WCAG 2.1 A/AA plus best practice, at 1280 and 390 |

Some suites hard-code expected data (`suggestions.mjs`'s `EXPECTED`, `provider-lists.mjs`'s `TOTALS`, a first search result in `search.mjs`) and fail after legitimate content changes; update the expectations with the content.

# Environments and Git Workflow

| Environment | URL | Purpose |
|:-------------|:------------------------------------------|:--------------------|
| Local | `http://localhost:3000` | Development |
| Branch | `https://<branch>--highmark--adobedrago.aem.page` | PR testing (code from the branch, preview content) |
| Preview | `https://main--highmark--adobedrago.aem.page` | Staging: `main` code, previewed content |
| Live | `https://main--highmark--adobedrago.aem.live` | Production (no custom domain yet) |

**Workflow:**

1. Branch off `main`. Keep branch names short and lowercase: they become part of the preview hostname, which is limited to 63 characters.
2. Run `npm run lint`, then the relevant test suites against `aem up --port 3100`.
3. Open a PR with the branch preview URLs of the pages you changed. The PR template still has the boilerplate's URLs; replace them.
4. Squash-merge and delete the branch. `main` is live as soon as it's merged.

Code changes go live on merge, but **content** needs its own preview and publish. If a change needs new content (a sheet, a fragment, a library doc), publish it with the merge.

# Common Development Tasks

## Add a block

1. Create `blocks/<name>/<name>.js` exporting `default function decorate(block)`, and `blocks/<name>/<name>.css` scoped to `.<name>`.
2. Build a test page in DA (or under `content/` with `aem up --html-folder content`) using the real content model.
3. Check it at 390, 768, 992 and 1280 against the source design, and run `regression.mjs` on the page.
4. Add a Library entry: a doc under `/docs/library/blocks/<name>` (one section per variant: a `library-metadata` block, then the block) and a row in `/docs/library/blocks.json`; preview both.
5. Lint, PR, merge.

## Add a template

1. Create `styles/templates/<name>.css`, with every rule scoped to `body.<name>`.
2. Add `<name>` to `TEMPLATE_STYLES` in `scripts/scripts.js`.
3. If the template needs JS, add a body-class-gated decorator in `loadEager`, like `decorateFaqLinks`.
4. If the left nav is used, add the template to the `body:not(...)` list in `cards-minimal-light-sidenav.css`.

## Add a section style

Add `.section.<style>` rules to `styles.css` (global) or the template file (scoped), then document the value for authors.

## Add a header or footer fragment

Create the fragment in DA with the section shape its layout expects. If it is a new `nav` path, add its height reservation to `styles.css`. Add it to `FRAGMENTS` in `build-redirects.mjs` if it holds links.

## Add analytics or a marketing tool

Load it from `scripts/delayed.js`, never from `scripts.js` or `head.html`. Check it under the CSP and in the Network tab, and confirm Lighthouse isn't affected.

## Refresh generated content

| Content | Steps |
|:-----------------|:----------------------------------------------------------|
| Provider news lists | `build-provider-lists.mjs --upload` → check preview → publish the 5 sheets → `build-redirects.mjs --upload` → compare DA with live → publish `/redirects.json` |
| Press releases, events | `build-press-releases-data.mjs --upload` (or events) → check preview → publish |
| ZIP data | `build-zip-data.mjs --upload` → check the shop on preview (`region.mjs`, `shop-chrome.mjs`) → publish both sheets |
| After publishing new pages | `build-redirects.mjs --upload` → publish the sheet with the pages → re-index pages published while redirected |

## Debug a block

1. Check the console and the Network tab for 404s on `/blocks/<name>/<name>.{js,css}`; the folder name must match the block class.
2. Compare the block's `.plain.html` (`<page>.plain.html`) with what the JS expects. Authors' tables arrive as nested `div`s.
3. Check which template stylesheets also style the block.
4. `data-block-status` on the block shows whether it loaded.

# Known Issues

Found during the handover analysis on 2026-10-21. Content issues (broken links, missing titles) are tracked in `BACKLOG.md`.

## Functional

1. **Forms can't submit.** `form-minimal-light` on `/contact`, `/fraud/fraud-form` and `/newsroom/news-alert` POSTs JSON to `https://www.highmark.com/bin/hmk/genericmailer`. Its CORS preflight returns no `Access-Control-Allow-Origin` header, so browsers block the request, and the endpoint expects a reCAPTCHA token. The base `form.js` reports failures only to the console, so visitors get no message.
2. **The Universal Editor branch breaks page load.** `scripts.js` top-level-awaits `/ue/scripts/ue.js` on `*.ue.da.live` hosts, and `ue/` was deleted from the repo. There, `scripts.js` fails before `loadPage()` runs. Remove the branch, or restore the file if Universal Editor is wanted.
3. **Product shop headers shift the page.** `/shop/fragments/shopx-header-dental` and `-blue-edge-balance` don't match the `/shopx-header` height rule, so they get the corporate reservation (84px / 196.5px instead of 67px / 208px).
4. **Hard-coded sheet limits truncate silently:** ZIP sheets 10,000 rows (3,810 today; enGen's list may be larger), search index 5,000, query index 5,000, provider lists 5,000, press releases 1,000.
5. **`cards-minimal-dark-list` adds one `hr` per cell** under each H3: the H3 loop sits inside the per-cell loop.
6. **The DA Library's Templates entry points at a missing sheet** (`/docs/library/templates.json`).

## Fragile coupling

7. **CSS keyed on heading ids.** Rewording these headings silently changes the layout:
   - `#types-of-eating-disorders-and-treatment` (`cards-minimal-dark-withimg.css`);
   - `#employee-health-care-management`, `#highmark-client-resources-for-employers`, `#education-for-employers` (`employer-subpage.css`);
   - `#app-developers-api-support` (`legal.css`);
   - `#highmark-ventures-is-transforming-healthcare`, `#medicare-d-snp-medicaid-and-chip` (`campaign-landing.css`);
   - two in `bright-blue-futures.css`;
   - `#mental-health-resources`, `#eating-disorders` (`hero-minimal-dark-withimg.css`);
   - `#elizabeths-story` (`columns-minimal-dark-overlay.css`);
   - `#dynamic-table` (`table-minimal-dark-compare.css`).
8. **Classes chosen by matching authored text:** `LEADERSHIP_BIO_CLASSES`, `LEGAL_LINK_CLASSES`, the LinkedIn link, and the region-code regex in `decorateProviderContent`, which duplicates the regions sheet.
9. **Positional fragment parsing.** Header and footer sections are read by index; `inheritMenu` takes the other nav's third section.
10. **Content paths hard-coded in code:** the nav paths in `styles.css` and `header.css`, the footer path prefixes, `/modals/zip-county`, the `/shop/*.json` defaults, `/docs/library/icons/filter.svg` and `/search-suggestions.json`.
11. **External hosts in code:** `https://www.highmark.com/search-results.html` (search fallback), `www.highmark.com` treated as same-site in the footer, a `highmark.com` hostname regex for new-tab logic, `fonts.gstatic.com` (Material Icons) and the `da.live` modules.

## Performance

12. **Render-blocking font CSS:** the Adobe Fonts stylesheet loads in `head.html`, and template CSS is awaited before first paint.
13. **Breadcrumbs make N+1 requests:** the full query index, then each ancestor's whole page HTML to read one meta tag.
14. **The shop header and footer fetch their fragment twice** (a raw fetch, then `loadFragment`).
15. **The search index is downloaded whole** (about 280 KB compressed today); it won't scale to the full site.

## Accessibility

16. Footer accordion headings are click-only `<p>` elements, with no button or `aria-expanded`.
17. Header suggestion options contain links, which fails axe `nested-interactive`.
18. `#alert-banner-title` is a fixed id, so two banners on a page would collide.

## Maintenance

19. **Dead code:**
    - `scripts/delayed.js` and `styles/lazy-styles.css` are empty;
    - `scripts/context.js` and `styles/context.css` are unused;
    - `plugins/experimentation/` is never loaded, so `Experiment` metadata does nothing;
    - the `build:json` scripts and husky hook target the deleted `ue/models`;
    - `fonts/roboto-{regular,medium,bold}.woff2` and the `roboto-condensed` face are unused;
    - `zip-county-form` loads `form.css`, which has no effect;
    - `hero.js` is empty;
    - the `press-releases` template value does nothing.
20. **Duplicated code:**
    - an `element()` helper in 8 files;
    - heading-level and icon helpers;
    - "off-site or PDF opens a new tab" in 4 places;
    - three filter-drawer implementations;
    - `cards-minimal-dark-withimg-2` and `-icons` identical to `cards.js`;
    - `table-minimal-dark-compare` nearly identical to `table`.
21. **Boilerplate leftovers:**
    - `package.json` name, repository and homepage (`@adobe/aem-block-collection`);
    - the PR template's URLs;
    - `tools/sidekick/config.json`'s project name;
    - stale block READMEs;
    - `blocks/*/metadata.json` (importer metadata, publicly served).
22. **Tooling gaps:**
    - `tools/importer/upload-to-da.mjs` sends no `Authorization` header, so it gets 401 from a local clone; give it the other tools' `readToken()`;
    - no Node version pin (add `.nvmrc` with `20` and `engines`);
    - CI runs lint only; consider adding `regression.mjs` against the branch preview.
23. **Library docs log two 404s on preview:** they request a `library-metadata` block that doesn't exist. Preview only.

# Troubleshooting

| Issue | Check |
|:-----------------------------|:------------------------------------------------------|
| Block not loading | Folder name matches the block class? JS exports `default function decorate`? 404 for its JS or CSS in Network? |
| Styles not applying | Is a template stylesheet overriding the block? Is the template in `TEMPLATE_STYLES`? Specificity? |
| Page waits blank, then appears | Template CSS failed to load: `body.appear` waits for it |
| Content not updating | Was the document previewed (not just saved in DA)? Hard refresh; the CDN can take a minute or two |
| A published page redirects to highmark.com | A `/redirects` row covers its path; regenerate and publish the sheet |
| Page missing from search or breadcrumbs | Not indexed: it was published while a redirect covered it. Re-index it. |
| Header jumps on load | The `nav` path has no height reservation in `styles.css` |
| Header or footer layout broken | Fragment sections reordered, or a section count changed (the layouts are positional) |
| Region links missing on a shop page | No stored ZIP yet, or the `regions` column is empty for that region; check `shop-zip-county` in localStorage |
| `about:error` images or a broken share image | The `<img src>` or `Image` metadata isn't reachable when previewing |
| Tool gets 401 | DA token missing or expired: `npx github:adobe-rnd/da-auth-helper token` |
| Lint fails on Windows | CRLF line endings: set VS Code `files.eol` to `\n` and re-save |

# Resources and Support

## Documentation

| Resource | URL |
|:-----------------------------|:----------------------------------------------|
| AEM Edge Delivery Services documentation | `https://www.aem.live/docs/` |
| Developer tutorial | `https://www.aem.live/developer/tutorial` |
| Block Collection | `https://www.aem.live/developer/block-collection` |
| Keeping it 100 (loading phases) | `https://www.aem.live/developer/keeping-it-100` |
| Development good practices | `https://www.aem.live/docs/dev-collab-and-good-practices` |
| Admin API | `https://www.aem.live/docs/admin.html` |
| Document Authoring | `https://docs.da.live/` |
| Repo notes | `AGENTS.md` (working notes), `BACKLOG.md` (open issues), `MIGRATION-CHECKLIST.md` (page status), `tools/provider-import/README.md`, `tools/tests/README.md` |

## Support contacts

| Need | Contact |
|:------------------------------|:------------------------------|
| Site configuration and access | [Site administrator: name, email] |
| Code and tooling questions | [Development lead: name, email] |
| Adobe support | [Adobe account contact] |
