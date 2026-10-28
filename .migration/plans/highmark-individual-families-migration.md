# Migration Plan: Highmark "Individual & Families" Plans Page

> **Status: Ready, waiting on Execute mode.** I can't change the mode from chat. Please switch it to **Execute** with the mode control next to the chat input, then send any message (such as "go"). The checklist below will then run in order and only pause if a step needs a decision from you.

## Overview
Bring **https://www.highmark.com/plans/individual-families** into AEM Edge Delivery Services (Document Authoring) using the project's standard migration workflow. The goal is a clean, authorable page that looks like the original and reuses the site's existing blocks wherever they fit.

## Current Project Context
- **Project type:** Document Authoring (DA). The project is already set up with its block library.
- **Existing templates:** 9 templates are already cataloged (home, topic hub, sidebar article/FAQ/listing, tabbed answers, and others). This URL is **not in any template yet**, and it's the first page from the `/plans/` section.
- **Existing blocks to reuse where they match:** hero (`hero-minimal-dark-withimg`, `hero-minimal-light`), cards (`-withimg`, `-withimg-2`, `-iconnav`, `-list`, `-sidenav`), `columns-minimal-dark`, `accordion-minimal-light`, `table-minimal-dark-compare`, and the highlight/accent/CTA section styles.
- **ZIP code entry:** Any ZIP or plan-finder prompt on the page will use the project's **existing ZIP modal and fragment pattern**, which only shows when `theme=shop`. The Forms add-on will not be enabled, as you chose.
- **Header and footer:** These were migrated earlier, so they are out of scope unless the page needs something different.

## Approach
1. **Analyze the page:** Scrape the source page, capture screenshots, and map out its sections, content order and block candidates.
2. **Pick a template:** Decide whether the page fits an existing template or needs a new one (probably a new `plans-landing` template, since this is the first `/plans/` page). Record it in the page templates file.
3. **Reuse or add block variants:** Match each block against the existing variants (80% similarity threshold). Reuse the ones that match, and only create new variants for patterns not covered yet. Likely candidates are plan-type cards, a "why Highmark" feature row and a plan-shopping CTA.
4. **Build the import tooling:** Add block mappings (DOM selectors), parsers for any new variants, and transformers for cleanup and sections.
5. **Import the content:** Bundle the import script and run the bulk import to create the page.
6. **Style and check it:** Style any new blocks from the original site's computed styles. Then compare the preview with the original side by side, desktop and mobile, and fix the differences.

## Checklist
- [ ] Start the site migration workflow for the single URL `https://www.highmark.com/plans/individual-families`
- [ ] Scrape the source page and collect its metadata, images, cleaned HTML and screenshots
- [ ] Run page analysis: section boundaries, content sequences, and default content vs. block decisions
- [ ] Classify the page: existing template or new `plans-landing` template. Update the page templates file
- [ ] Match block variants against existing ones and reuse any at ≥80% similarity
- [ ] Name and generate any new block variants that aren't covered yet
- [ ] Add DOM selector mappings for every block on the new or updated template
- [ ] Generate import parsers for new variants and check that they pass
- [ ] Generate import transformers (cleanup, sections, media) and check them
- [ ] Wire any ZIP / plan-finder call to action to the existing ZIP modal fragment (`theme=shop` metadata)
- [ ] Bundle the import script and run the bulk import for this URL
- [ ] Check the imported page in preview: blocks render, images load, no broken links or 404s
- [ ] Style new blocks from the original site's computed styles
- [ ] Visually compare the migrated page with the original (desktop and mobile) and fix the differences
- [ ] Summarize the results: blocks reused vs. new, template used, and any open items

## Risks / Open Questions
- **Dynamic plan content:** Plan pricing or availability that depends on ZIP or county may not import as static content. It will be flagged instead of guessed.
- **Carousels or tabs:** If the page uses interactive components the block library doesn't have, a new block variant will be needed.
- **Shared styling:** Page-level colors and fonts should already come from the homepage styling work. Only differences specific to this page will be fixed.

## Next Step
1. Switch the mode control next to the chat input from **Plan** to **Execute**.
2. Send any message, such as "go", to start the checklist.
