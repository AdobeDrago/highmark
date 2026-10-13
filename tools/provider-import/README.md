# Provider import

Scripts that migrate providers.highmark.com pages into this site under `/providers` (our `/providers/claims` is the source's `/claims`). They extract a source page's components, convert them to a DA document, and upload it to DA with a preview. Publishing is a separate step. AGENTS.md ("Provider pages") explains the page model, the blocks and the decisions behind them; MIGRATION-CHECKLIST.md tracks every source page.

## Setup

- Node 18 or later.
- Playwright and linkedom are not in package.json, so CI doesn't download browsers. Install them locally without saving:

  ```bash
  npm i --no-save playwright linkedom
  npx playwright install chromium
  ```

- A DA token for anything that writes to DA or calls the admin API. The token is cached in `~/.aem/da-token.json`; the `> /dev/null` keeps it out of the terminal:

  ```bash
  npx github:adobe-rnd/da-auth-helper token > /dev/null
  ```

- In Git Bash, prefix commands that take `/providers/...` arguments with `MSYS_NO_PATHCONV=1`. Otherwise Git Bash turns them into Windows paths.

## Folders

| Folder | What | In git |
|---|---|---|
| `data/` | Inputs: `classified.json` (every source page's template and checklist tier), `menu-tree.json` (the source's mega menu), `sidenav.json` (its side-nav trees), `gated.txt` (pages behind the Availity login) | yes |
| `batches/` | Source paths of each import batch, one per line or comma-separated | yes |
| `assets/` | Files the converter uses: Material icons for the quick-links band, the provider footer logo | yes |
| `work/` | Per run: `src/` (extracted pages), `out/` (built documents and `images.json`), `img/` (downloaded images), `survey.json` | no |

## Scripts

| Script | Does |
|---|---|
| `extract.mjs <paths or batch files>` | Renders each source page in Chromium and saves its components to `work/src/` |
| `build.mjs <paths or batch files>` | Converts `work/src/` pages to DA documents in `work/out/`. `FRAGMENTS=1`, `SIDENAV=1` and `SPOTLIGHT=<article path>` also build the provider fragments. |
| `upload.mjs fetch \| images \| docs [paths]` | Downloads and size-checks the images, uploads them, uploads the documents and previews them. It never publishes. |
| `admin.mjs preview\|live\|index\|status <paths or batch files>` | Admin API calls, one path at a time. Batch-file entries become `/providers` paths. |
| `mark.mjs <status> <batch files>` | Sets the pages' status in MIGRATION-CHECKLIST.md (`"To do"`, `"Preview only"`, `Live`) and recomputes its tallies |
| `survey.mjs`, then `classify.mjs` | Re-survey the source's sitemap and rebuild `data/classified.json`, for example when the source adds pages |
| `menu-tree.mjs` | Rebuild `data/menu-tree.json` from the source's mega menu |
| `sidenav-extract.mjs` | Rebuild `data/sidenav.json` from the source's side navs |

## A batch, end to end

Run these from this folder.

1. **List the batch.** Put its source paths in `batches/<name>.txt`, taken from MIGRATION-CHECKLIST.md.
2. **Extract and build.**

   ```bash
   node extract.mjs batches/<name>.txt
   node build.mjs batches/<name>.txt
   ```

   Read `work/out/` before uploading. If the build prints `unhandled component`, the converter doesn't map that source component yet.
3. **Upload and preview.**

   ```bash
   node upload.mjs fetch
   node upload.mjs images
   node upload.mjs docs
   ```

4. **Regenerate `/redirects` in DA and preview only.** First compare DA, preview and live (AGENTS.md, "Redirects"): the sheet is shared. Then run `node ../redirects/build-redirects.mjs --upload`. It drops the rows of the batch's pages, so preview shows them.
5. **Check.** Run the provider suites in `../tests/` against `aem up` on port 3100, which serves preview content with the working tree's code. Then run `node mark.mjs "Preview only" batches/<name>.txt`.
6. **Publish, after review and merge.**
   1. Publish the pages, then `/redirects.json`: `node admin.mjs live batches/<name>.txt /redirects.json`.
   2. Re-index the pages: `node admin.mjs index batches/<name>.txt`. A page published while a redirect row covered it isn't indexed until this runs.
   3. Run `build-redirects.mjs --upload` again, so links on the new pages get rows, and publish `/redirects.json`.
   4. Run the live suites, then `node mark.mjs Live batches/<name>.txt`.

## Things to know

- **What gets uploaded:** `build.mjs` rebuilds `work/out/` from scratch on each run, so `upload.mjs docs` without paths uploads only what the last build wrote.
- **Rebuilding a published page:** before overwriting one, check in DA that nobody has edited it since its last upload.
- **Links:** provider links become `/providers/...` paths, made valid page paths (lowercase; anything but a-z, 0-9 and `-` becomes `-`). Files stay on the source. Pages behind the Availity login, and the mailing-list form, link to the source.
- **Our live pages:** `build.mjs` reads the live query index to know which highmark.com pages we have, so links to those stay on our site. `OURS_FILE=<json list>` pins that list instead, for example to reproduce an earlier build.
- **Broken source links:** `LINK_FIXES` in `build.mjs` repoints links that are broken on the source too, to the file the source's other pages link.
