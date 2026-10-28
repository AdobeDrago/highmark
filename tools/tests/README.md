# Site tests

Playwright checks of the site's pages and behaviour. Run them against a local `aem up`, against preview, or against live, by setting `HOST`. Each script prints PASS/FAIL lines (or one line per page) and ends with a summary such as `ALL PASSED`, `N FAILED` or `0 problems`. Some write screenshots to `shots/`, which is gitignored.

## Setup

```bash
npm i --no-save playwright linkedom
npx playwright install chromium
```

Playwright is not in package.json, so CI doesn't download browsers. In Git Bash, prefix runs that pass `/paths` in variables with `MSYS_NO_PATHCONV=1`.

## Hosts

- `http://localhost:3100` is the default for most scripts. Start it with `aem up --port 3100 --no-open`. It serves preview content with the working tree's code, which is how to check a change before it merges.
- Preview: `HOST=https://main--highmark--adobedrago.aem.page`
- Live: `HOST=https://main--highmark--adobedrago.aem.live`

## Scripts

| Script | Checks | Default host | Options |
|---|---|---|---|
| `regression.mjs` | 18 key pages at 1280 and 390: no console errors, failed requests, broken images, unloaded blocks or horizontal scroll, and an h1 | live | `LIST=<file of paths>` |
| `search.mjs` | Header type-ahead and the `/search` results page (ranking, paging, phones) | local | `SHOTS=<dir>` |
| `suggestions.mjs` | The search box's suggestions before typing (the `/search-suggestions` sheet) | local | |
| `phone-search.mjs` | The phone header's search icon, box and suggestions | local | |
| `region.mjs` | The ZIP/county modal and what a region changes on `/shop/` | local | |
| `shop-chrome.mjs` | The ShopX header and footer per region | local | `SWAP=0` |
| `provider-header.mjs` | The provider header: search row, full-width panels, lock icons | local | |
| `provider-pages.mjs` | Provider pages: header, footer, breadcrumbs, overflow | local | `PAGES`, `WIDTHS`, `SHOTS=0` |
| `provider-content.mjs` | Provider content and article pages: side nav, article heading, region panels and grey boxes, spotlight | local | `LISTS` (batch files in `../provider-import/batches`), `WIDTHS` |
| `provider-lists.mjs` | The provider list pages: counts, view more, filters, sort, phone toggle | local | `PAGES`, `PREFIX`, `WIDTHS` |
| `provider-links.mjs` | Every link on the live provider pages and provider fragments | live | |
| `list-links.mjs` | Every link in the provider list sheets, through `/redirects` | live | |
| `a11y.mjs` | axe (WCAG 2.1 A/AA and best practice) on `main` at 1280 and 390 | local | `PAGES` |

## Examples

```bash
# a change before merge: aem up on 3100, then
node tools/tests/regression.mjs
node tools/tests/search.mjs

# after publishing, against live
HOST=https://main--highmark--adobedrago.aem.live node tools/tests/provider-content.mjs
MSYS_NO_PATHCONV=1 HOST=https://main--highmark--adobedrago.aem.live PAGES=/providers/claims node tools/tests/a11y.mjs
```

## Known findings

- `a11y.mjs` reports `color-contrast` on blue links over the tinted rail and the region panels. These are the source's colours, and the issue is open.
