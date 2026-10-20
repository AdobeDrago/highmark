---
name: brief-to-page
description: Build a new highmark.com page in Document Authoring from a Highmark content brief (a Word document titled "CONTENT BRIEF", with a Metadata table and a Page Content table of web components such as Secondary Banner, Text Component and Intercept Banner). Use when the user attaches a content brief and wants the page created; the result is a DA page, never a Word file. Not for documents that mark changes to existing pages in red and strikethrough; use redline-to-page-update for those.
version: 2
status: approved
---

# Brief to page

You turn a Highmark content brief into a page in Document Authoring (DA) for the site `adobedrago/highmark`, then preview it. You never publish.

**The result is a DA page, created with the `da-live-admin` MCP tools.** The attached Word document is only your input. Never create a Word document, a file to download or an artifact, and never answer with the page as text instead of creating it. If the DA tools (`da_get_source`, `da_create_source`) aren't available to you, stop and tell the user so; don't make a file instead.

Work through the five steps in order. Each step ends with something you show the user; do not start the next step until it is done. Do not skip step 5: the report is part of the job.

## Step 1. Read the brief

Read the attached Word document. A brief has:

- **Page details** near the top: `New URL` (the page's path, e.g. `https://www.highmark.com/plans/medicaid/ph95` is `/plans/medicaid/ph95`), `Example URL`, any `Redirect old URL to new URL`, and the Search Intent notes (navigation, search).
- **Metadata table**: `AEM Page Template`, `Meta Title / Title Tag`, `Meta Description`, `Open Graph Image`.
- **Page Content table**: one row per section, named in the first column (`Secondary Banner`, `Text Component`, `Intercept Banner`, `Additional Disclaimers`). Briefs differ in their columns. Take the copy from the column headed "Content from Copywriting" when there is one, otherwise from "Content outline/Instructions from content strategy". The other columns hold instructions, image specs and stakeholder questions: read them, but they are not page copy.

Copy is marked up in several ways; treat them all the same:

| Marker in the brief | Meaning |
|---|---|
| `H1:`, `<h1>` | Page heading (banner only) |
| `H2:`, `<h2>` | Section heading (in the banner, the subtitle) |
| `H3:`, `<h3>` | Sub-heading under an H2 |
| `P1:`, `<p1>` | Lead line under a heading |
| `P2:`, `<p2>`, unmarked text | Paragraph |
| `Button:` | Button label |
| `Inline image: ... (file.jpg)` | An image to place here |

Drop the markers themselves from the copy. A line inside a bulleted list that has no bullet of its own (Word often loses one) is still a list item. Two items run together on one line, split at the line break, are two list items.

Show the user a short outline: the target path, title, description, and each section with its headings.

## Step 2. Check the copy

Compare the copy with the limits the brief states and list what is outside them. These are warnings; build the page anyway.

- Meta title: the brief's limit (50-60 or 65 characters, spaces included).
- Meta description: 150-160 characters.
- Banner H1: 25-35. Banner subtitle (H2): 60-85. Button labels: 10-20, all caps.
- Text Component H2: 35-50. Lead (P1): 140-160.
- Intercept Banner H2: 35-50. Subtext: 150-175.

Also list:

- headings out of order (an H3 with no H2 before it), and a Text Component with no H2 at its start;
- every image the brief names, with its size: the banner photo (desktop 1500 x 400, tablet 784 x 288, mobile 375 x 200), the Open Graph image (1200 x 630) and each inline image (540 x 292). **Do not add images to the page.** They come later; the page is built without them;
- every stakeholder question, reviewer comment, and instruction you could not follow.

## Step 3. Ask where the page goes

Ask the user, and wait for the answer:

> **Should this page be drafted in drafts?**
> - **Yes:** I'll create it at `/drafts/<your-name>/<path>`, so nothing appears at the real URL yet.
> - **No:** I'll create it at `<path>`.

For Yes, suggest the user's first name in lowercase as `<your-name>` (for example `/drafts/lamont/plans/medicaid/ph95`) and let them change it.

Then call `da_get_source` with org `adobedrago`, repo `highmark` and the path plus `.html` (no leading slash, e.g. `drafts/lamont/plans/medicaid/ph95.html`). If a document is already there, say so and ask before replacing it.

## Step 4. Create the page in DA and preview it

1. Write the page as HTML, as described in **Page structure** below.
2. Create it with `da_create_source`: org `adobedrago`, repo `highmark`, path `<path>.html` (no leading slash), and the HTML as its content. If the user agreed in step 3 to replace an existing document, call `da_create_version` on it first, then `da_update_source`.
3. Read it back with `da_get_source` to check it was saved.
4. Preview it, if your DA tools have a preview action. Never call `da_publish`.

If any of these calls fails, show the user the error and ask how to go on. Don't fall back to making a file.

## Step 5. Report

Tell the user:

1. Where the page is: the DA edit link (`https://da.live/edit#/adobedrago/highmark/<path>`) and the preview link (`https://main--highmark--adobedrago.aem.page/<path>`). If you couldn't preview it, say so: the user can preview it from the DA editor.
2. The warnings from step 2.
3. What is left to do by hand:
   - the images, with their sizes, and where each goes;
   - a navigation entry, when the brief asks for one (e.g. "should appear in top-level navigation under Plans / Medicaid as ..."). The corporate menu is the `/nav` document;
   - redirects the brief asks for. A redirect from another domain (such as `medicare.highmark.com`) can't be made on this site; it has to be set up on that domain;
   - for a page in drafts: moving it to its real path when it is approved;
   - after the page is published at its real path, the site's redirects sheet has to be rebuilt (`node tools/redirects/build-redirects.mjs --upload`, then publish `/redirects.json`). This is a developer step;
   - the stakeholder questions still open.

## Page structure

Every page uses the `program-page` template (Highmark's Program Page, "Landing Page Light"). Sections are separated as DA sections, in this order:

**1. Secondary Banner**: a `hero-minimal-dark-withimg` block. Its one row holds the H1 and, when the brief has one, the subtitle as an H2. With images still to come, the block has only this text row. (When the photos are added later, they go in a first row of their own: desktop, tablet and mobile crops, in that order.) A banner button is a link in its own paragraph after the H2.

**2. Text Component**: default content, no block.

- Headings as H2 and H3. The lead line (P1) is an **H5**.
- Bold labels at the start of a line ("Highmark Tip:", "Good to Know:", "Apply Online:") stay bold, in their paragraph.
- A link written as `Label (https://...)` becomes a link on the label: `<a href="https://...">Label</a>`. A link written as `Download and print (url) a paper application` becomes a link on the words before the URL.
- **Quick Links** (a heading followed by a list of the page's section headings) becomes a bulleted list of links to those headings. The anchor is the heading text in lowercase, with every run of characters other than a-z and 0-9 replaced by one `-`, and no `-` at either end: "Does My Child Qualify?" is `#does-my-child-qualify`. A quick link whose label differs from its heading points at the heading ("FAQs" points at `#frequently-asked-questions`). A heading that moved to the Intercept Banner keeps its anchor.
- **FAQs**: the H2 ("Frequently Asked Questions"), then an `accordion` block, one row per question: the question in the first cell, the whole answer (paragraphs, lists, bold labels) in the second.
- A link that is the only thing in its paragraph becomes a button. Keep links inside sentences.

**3. Intercept Banner** (only when the brief has one): default content with section metadata `Style: intercept`. The H2, the subtext as a paragraph, then each button as a link alone in its own paragraph, its label in capitals as the brief gives it. A phone-number button links to `tel:+1` and the ten digits (`CALL 1-800-692-7462` is `tel:+18006927462`). A phone number inside a sentence is a `tel:` link on the number.

**4. Additional Disclaimers** (only when the brief gives disclaimer text): default content with section metadata `Style: footnotes`. Use footnote numbers, not asterisks, when there is more than one.

**5. Metadata** block, last:

| Key | Value |
|---|---|
| Title | The brief's Meta Title |
| Description | The brief's Meta Description |
| Template | `program-page` |

Leave out keys the brief doesn't fill in.

### Links

- A link to `https://www.highmark.com/<path>` becomes the relative `/<path>` when this site already has that page (it previews at `https://main--highmark--adobedrago.aem.page/<path>`). Otherwise keep the full highmark.com link.
- Links to other sites stay as they are.

### Example

The brief for `/plans/medicaid/ph95` produces this document (shortened):

```html
<body>
  <header></header>
  <main>
    <div>
      <div class="hero-minimal-dark-withimg">
        <div><div>
          <h1>Medicaid for Children with Special Needs (PH95)</h1>
          <h2>Get secondary health coverage regardless of income to help cover costs.</h2>
        </div></div>
      </div>
    </div>
    <div>
      <h2>Extra Medical Help for Your Child–At No Cost to You.</h2>
      <h5>Many families don’t realize that their child may qualify for extra health coverage. We’re here to help.</h5>
      <p>PH95 (Medicaid for Children with Special Needs) offers ...</p>
      <h2>Quick Links</h2>
      <ul>
        <li><a href="#what-this-program-covers">What This Program Covers</a></li>
        <li><a href="#frequently-asked-questions">FAQs</a></li>
      </ul>
      <h2>How to Get Started</h2>
      <p><strong>Apply Online:</strong> Use <a href="https://www.compass.dhs.pa.gov/">COMPASS</a>.</p>
      <h2>Frequently Asked Questions</h2>
      <div class="accordion">
        <div>
          <div>What happens to my commercial insurance?</div>
          <div><p>Nothing changes! ...</p><p><strong>Note:</strong> Always make sure ...</p></div>
        </div>
      </div>
    </div>
    <div>
      <h2>Take the Next Step</h2>
      <p>Need help? Call the COMPASS HELPLINE, Mon–Fri, 8:30 a.m.–4:30 p.m. ...</p>
      <p><a href="tel:+18006927462">CALL 1-800-692-7462</a></p>
      <div class="section-metadata"><div><div>Style</div><div>intercept</div></div></div>
    </div>
    <div>
      <div class="metadata">
        <div><div>Title</div><div>PH95 Medicaid Benefits for Children with Special Needs | Highmark</div></div>
        <div><div>Description</div><div>Discover PA PH95 Medicaid benefits for children with special needs. ...</div></div>
        <div><div>Template</div><div>program-page</div></div>
      </div>
    </div>
  </main>
  <footer></footer>
</body>
```

The complete documents for both sample briefs are in the site's code repository, under `tools/ew-skills/examples/`.
