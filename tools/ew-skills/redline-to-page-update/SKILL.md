---
name: redline-to-page-update
description: Apply a Word document of marked-up changes to existing highmark.com pages in Document Authoring. In these documents new copy is red and removed copy is red strikethrough, and each page starts with a table giving its URL, Meta Title and Meta Description (for example the "Wholecare Medicare D-SNP AEP Content - 2027 Updates" document). Use when the user attaches such a document and wants the pages updated. Not for content briefs for new pages; use brief-to-page for those.
version: 1
status: approved
---

# Redline to page update

You apply the changes in a marked-up Word document to existing pages in Document Authoring (DA) for the site `adobedrago/highmark`, then preview them. You never publish, and you never delete or unpublish a page.

Work through the five steps in order. Each step ends with something you show the user; do not start the next step until it is done. Do not skip step 5: the report is part of the job.

## Step 1. Read the document

Read the attached Word document. It covers one or more pages. Each page starts with a title line (such as "... 2027 Updates- Enrollment") and a table:

- `URL`: the page. `https://www.highmark.com/wholecare/medicare/enrollment` is the DA document `/wholecare/medicare/enrollment`.
- `Meta Title / Title Tag` and `Meta Description`: the new values, or "No updates."

The page's copy follows, as it should read after the update:

| In the document | Meaning |
|---|---|
| Black text | Unchanged. Use it to find the place to edit. |
| Red text | New: add it. |
| Strikethrough (red or black) | Removed: delete it. |
| `[Coming soon:] ...` | Not part of this update. Don't add it; list it. |
| Other text in square brackets (`[VIEW REQUIREMENTS]`, `[Last Updated: July 22, 2026]`) | An editor's note, not copy. Don't add it; list it. |

**Comments** in the margin are instructions for the text they're attached to:

- Do the ones meant for this update: "REMOVE", "This link should be updated to the anchored section on the page", "Redirect link: <url>" (point the link there), "Adding a quick link section".
- Don't do the ones about a later date or still waiting on someone: "Will need to remove for January", "Will need to update for January", "Not update for October", "Joanna still to confirm this link needs to be updated". List them, with the text they're attached to.
- "This page should be removed entirely ..." is never yours to do: list it.
- A comment that names a file you don't have ("Link to PDF: ....pdf", "Image also saved here: ....png"): list the file.

If you can't see the document's colours, strikethrough or comments, stop and tell the user: without them the changes can't be told apart from the unchanged text.

Show the user, page by page: its path, whether its title or description change, and a short list of its changes.

## Step 2. Check the pages exist

For each page, check that its DA document exists at its path. A page that isn't in DA can't be updated: mark it "needs import", leave it out of the next steps, and keep going with the others. (Importing a page from highmark.com is done by the developers, outside Experience Workspace.)

For each page that exists, check that the unchanged text around each change is in the document. When it isn't (the page reads differently from the Word document), don't guess where the change goes: mark that change "can't place" and keep it for the report.

Show the user which pages are ready, which need import, and which changes can't be placed.

## Step 3. Ask where the changes go

Ask the user, and wait for the answer:

> **Should these pages be drafted in drafts?**
> - **Yes:** I'll copy each page to `/drafts/<your-name>/<path>` and make the changes in the copy. The real pages stay as they are.
> - **No:** I'll make the changes in the pages themselves.

For Yes, suggest the user's first name in lowercase as `<your-name>` and let them change it. If a draft copy already exists at a path, say so and ask before replacing it.

## Step 4. Apply the changes and preview

For each page that is ready (in its draft copy, when the answer was Yes):

- Make each change from step 1 that can be placed: add the red text, delete the struck text, follow this update's comments. Keep the page's blocks, sections and formatting as they are; change only the copy. New text takes the formatting of the text around it (a new list item is a list item; a new heading takes the level the document shows).
- Update the Title and Description in the page's metadata block when the table gives new values.
- A new link from the document keeps its address. A link to `https://www.highmark.com/<path>` becomes the relative `/<path>` when this site has that page.
- Embedded images: don't add them; list them.

Then preview each changed document. Do not publish.

## Step 5. Report

Tell the user:

1. Each updated page, with its DA edit link (`https://da.live/edit#/adobedrago/highmark/<path>`) and preview link (`https://main--highmark--adobedrago.aem.page/<path>`), and a one-line summary of what changed.
2. Pages that need import.
3. Changes that couldn't be placed, with the text from the document.
4. What wasn't done, and why:
   - "Coming soon" items and editor's notes;
   - later-date and unconfirmed comments, with the text they're attached to (a to-do list for the next update);
   - pages to remove, which is a decision for the content owner;
   - files and images named in the document.
5. For pages in drafts: their changes go to the real pages once approved.
