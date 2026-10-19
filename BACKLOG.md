# Backlog

Open problems on the live site (`https://main--highmark--adobedrago.aem.live`), each with where it is, who owns it and the fix. They came out of a site walkthrough on 2026-10-15: every page in the query index rendered at 1280 and 390, every internal link followed, the `tools/tests` suites run, and axe on a sample of pages. Every item was re-checked on live on 2026-10-16.

When you fix an item, delete it here in the same PR. Add new findings in the same form.

## Needs fixing

### 1. FSA and Commuter Benefits pages 404

- **Paths:** `/resources/spending-accounts/flexible-spending-account-fsa`, `/resources/spending-accounts/commuter-benefits-account`.
- **Linked from:** the corporate header (`/nav`, so every corporate page), `/resources/spending-accounts`, `/resources/spending-accounts/health-saving-account-hsa` and `/resources/spending-accounts/health-reimbursement-arrangement-hra`.
- **Cause:** both have DA documents (#44) but were never published. A path with a DA document never gets a `/redirects` row, so nothing catches them.
- **Owner:** #44 (art-golk-merkle).
- **Fix:** publish both pages. If they aren't ready, add both paths to `FORCE` in `tools/redirects/build-redirects.mjs` so they redirect to highmark.com, then regenerate and publish `/redirects` (see AGENTS.md, "Redirects").

### 2. Medicare Advantage Stars link ends on a 404 on providers.highmark.com

- **Link:** `/providers/claims/value-based-reimbursement-programs-overview/medicare-advantage-stars-overview/medicare-advantage-member-and-provider-programs`. `/redirects` sends it to the same path on providers.highmark.com, which now 404s.
- **Linked from:** `/providers/claims/value-based-reimbursement-programs-overview/medicare-advantage-stars-overview` and the Claims side nav (`/providers/fragments/sidenav/claims`).
- **Cause:** the source renamed the page to `.../medicare-advantage-stars-program-guidance-and-resources`. The source's Stars Overview page links the new path; our `tools/provider-import/data/sidenav.json` still has the old one.
- **Owner:** provider migration (William).
- **Fix:** in `tools/provider-import`:
  1. Run `sidenav-extract.mjs` to pick up the new path and the source's new label "BestPractice/ValueBlue Reimbursement".
  2. Re-extract and rebuild the Stars Overview page, and rebuild the side navs (`SIDENAV=1 node build.mjs ...`).
  3. Upload and preview, then publish the page and `/providers/fragments/sidenav/claims`.
  4. Regenerate `/redirects` (compare DA, preview and live first), then publish it.

### 3. Broken LinkedIn link on the Timothy Vessel bio

- **Page:** `/about/our-story/leadership-team-board/timothy-vessel`.
- **Link:** the "LinkedIn" link's URL is the photo's alt text (`Timothy%20Vessel%20President%20of%20Highmark%20Blue%20Cross%20Blue%20Shield%20Delaware`), a relative URL that 404s.
- **Owner:** #100 (Bhupesh).
- **Fix:** use the URL of the source page's LinkedIn icon, which the source renders in script, so check it in a browser. Jessica Cox's bio has the same link pointing at `#`; fix both the same way, or remove both links.

### 4. Seven leadership pages have an empty `<title>`

- **Pages:** `/about/our-story/leadership-team-board` and six bios under it: `gustavo-giraldo`, `jaysheehy`, `jessicacox`, `kate-musler`, `sarah-marche`, `victorfields`.
- **Effect:** a blank browser tab title and `og:title`, and search labels the Leadership page from its URL ("Leadership Team Board"). AGENTS.md has noted the Leadership page since 2026-10-02.
- **Cause:** each page's metadata has a blank `Title` row.
- **Owner:** #94 (Bhupesh).
- **Fix:** fill in the Title rows, then preview and publish. The source's titles: Leadership Team & Board, Gustavo Giraldo, Jay Sheehy, Jessica Cox, Kate Musler (the source has "Kate-Musler "; don't copy the typo), Sarah Marche, Victor Fields.

### 5. `/contact` form fails colour contrast

- **What:** axe reports 20 serious `color-contrast` failures at 1280 and 390, on the form's labels and hints (`#form-addcomments-label`, `#form-addcomments-help > .field-hint`, ...).
- **Owner:** #107 (Bhupesh).
- **Fix:** darken the label and hint text to at least 4.5:1 against its background. If the source's colours fail too, decide whether to match the source or meet WCAG AA, as for the provider rail (see Deferred).

### 6. News and Updates list is 8 articles behind the source

- **Sheet:** `/providers/lists/news-and-updates.json` has 208 rows; the source's feed has 216 (2026-10-16). The other four list sheets match their feeds.
- **Owner:** provider migration (William).
- **Fix:** run `node tools/provider-lists/build-provider-lists.mjs --upload`, check preview, and publish the five sheets. Then regenerate `/redirects` (compare DA, preview and live first) so the new articles' links get rows, and publish it. The source adds news weekly, so this comes back; it may need a schedule.

### 7. Homepage below 992px doesn't match highmark.com (in progress)

- **What (2026-10-16, at 390 and 768):**
  - the hero used the desktop photo, squeezed to 220px, with the text crammed over it;
  - the mental-health and group bands laid their text over a 91px strip of the desktop photo;
  - three of the four quick links showed at 390;
  - white gaps between sections;
  - Find Care's photo came after its text;
  - type and spacing were off throughout.
- **Shared chrome:**
  - the phone header bar had the logo on the left and the menu on the right;
  - the alert banner's insets and type were off;
  - the footer's rows, LinkedIn size and legal line height were off;
  - with the banner showing, the open menu was covered by the bar.
- **Owner:** William.
- **Status:** fixed in code on `william-gajewski-dev` (2026-10-19), not merged. Against the test draft `/drafts/william/home-mobile`, the page is as tall as the source's at 360 to 900 and at 1280 and 1440, and 0.01–0.1% of pixels differ. AGENTS.md ("Homepage") has the details.
- **Restored first:** on 2026-10-19 `/index`, `/nav` and `/footer` in DA were put back to their live versions, and each preview now matches live byte for byte. Unpublished overwrites between 10-09 and 10-15 (lamont@adobe.com, previewed by mer81531@adobe.com) had reverted all three:
  - the homepage had lost its alert banner and autumn hero;
  - the nav had lost the 10-08 menu;
  - the footer had lost the 10-06 link lists.

  Their versions are in DA's version history.
- **Still to do:**
  1. Merge.
  2. Put the source's tablet and mobile crops in `/index`'s three photo cells (the crops are already in `/.index/`), and preview. A script for this is ready: `import-work/scratch-backup-2026-10-19/day16/content/index-add-crops.mjs.bak` (gitignored). It stops if `main` doesn't have the code yet, or if `/index` changed after the restore.
  3. Check the preview, then publish `/index`.
  4. Delete the test draft.

## Minor

- **`/reservations/aca` 404s.** It is broken on the source too.
  - Linked from `/resources/answers/health-insurance-glossary` (#128, Gokulraj) and `/resources/answers/faq/insurance-terms` (the 2026-09-16 `/resources` import).
  - Fix: pick a target (the source has none) and repoint both links, or remove them.
- **`/gdpr` has no h1.** Its first heading is an h2, "General Data Protection Regulation (GDPR) Statement", as on the source, and axe reports `heading-order` (moderate).
  - Owner: legal pages (William).
  - Fix: make that heading the h1, which departs from the source on purpose.
- **Heading order on `/about/our-story/leadership-team-board`.** axe reports `heading-order` (moderate) at `#gustavo-giraldo`: the bio names skip a heading level.
  - Owner: #94 (Bhupesh).
- **`/docs/library/blocks/hero` is published.** It requests `/blocks/library-metadata/library-metadata.{js,css}`, which don't exist, so the page logs two 404s. Search already excludes `/docs/**`.
  - Fix: unpublish it, unless the Sidekick library uses it from live; in that case add the block.
- **Glossary links fail `link-in-text-block`.** `/resources/answers/health-insurance-glossary` has 58 serious failures: its links in body text are told apart only by colour, as on the source.
  - Owner: #128 (Gokulraj).
  - Fix: underline links in running text.
- **`/newsroom/press-releases` has no description** (no `description` meta).
  - Owner: #56 (Gokulraj).
- **Stale `/redirects` row.** `/fraud/fraud-form` → `/fraud/fraud-form` points at itself. The page serves 200, since the fraud form was built on 2026-10-14 (Bhupesh), so the row does nothing.
  - The next `build-redirects.mjs --upload` drops it.
  - AGENTS.md ("Known follow-ups") still says the form redirects to the source; update that line.
- **Stale search test.** `tools/tests/search.mjs` expects a different first result for "medicare". `/resources/answers/faq/medicare` (title "Medicare") now ranks first, which is right by the ranking rules (AGENTS.md, "Search").
  - Fix: update the expectation.
- **No logo in the Blue Cross Blue Shield region's phone header.** `/member/fragments/bcbs/nav` has its two logos in separate paragraphs. The header keeps the first, the desktop logo, which it hides below 992px. The other five regions put both logos in one link.
  - Owner: Bhupesh.
  - Fix: put both pictures in the logo's link, as in the other regions.
- **Western NY footer has extra lines.** `/member/fragments/bcbswny/footer` shows "1 (888) BLUE-428" and "1 (888) 558-3428", which the source's Western NY footer doesn't show at any width. That makes our footer about 200px taller on phones.
  - Owner: Bhupesh.
- **Homepage from 992 to 1199px isn't matched.** The source's header is 30px taller there. Its footer only goes side by side from 1200px (it stacks below that), while ours does from 992px.
- **Phone menu.** The bar matches, but the open menu doesn't. The source's is a panel under the bar, its items Sofia Pro 20px, with the secondary links on a grey band. Ours is a full-screen drawer with Roboto bold 17px items.
- **Provider pages' phone bar.** Since 2026-10-19 it is highmark.com's bar, which is closer to the source than before. providers.highmark.com's is about 70px tall, with a smaller logo and a search row under it instead of the search icon.
- **Duplicate titles.** For information only: all three match the source.
  - "Pharmacy Finder | Highmark Blue Cross Blue Shield": `/member/bcbs/find-a-pharmacy`, `/member/bcbswny/find-a-pharmacy`, `/member/blueshieldneny/find-a-pharmacy`.
  - "Forms Library": `/member/bcbswny/forms`, `/member/blueshieldneny/forms`.
  - "Medical Injectable Drug Program Changes in the New Year": the `-de-pa-wv` and `-ny` articles under `/providers/communications-hub/news-and-updates/`.

## Deferred

- **Provider rail and region-panel link contrast.**
  - Blue links (`#0078c1`) on the rail's `#f1f4f4` are about 4.3:1, under AA's 4.5:1. On `/providers/claims` axe reports 6 serious failures (`a[title="CPA/SEPA"]`, `a[title="DE"]`, ...).
  - The same links on the region panels' `#fef0ec` have the same problem.
  - These are the source's colours. Deferred on 2026-10-13.

## Not checked

- **The DA copy of `/redirects`, and the admin log.** The DA token had expired, so neither was checked. Before the next `/redirects` publish, compare DA (`admin.da.live/source/adobedrago/highmark/redirects.json`) with preview and live, as AGENTS.md says.
