# Experience Workspace skills

Skills for the AI assistant in Experience Workspace (EW), the Document Authoring editor's assistant. They are kept here so they are versioned and reviewed; EW reads them from the site config.

| Skill | Does | Input |
|---|---|---|
| [`brief-to-page`](brief-to-page/SKILL.md) | Builds a new page from a Highmark content brief, with the `program-page` template | A content brief `.docx` (e.g. Well in Place, PH95) attached in EW chat |
| [`redline-to-page-update`](redline-to-page-update/SKILL.md) | Applies red / strikethrough changes to existing pages | A redline `.docx` (e.g. the Wholecare Medicare D-SNP 2027 update) attached in EW chat |

Both ask whether to work in `/drafts/<name>/...`, preview what they change, and never publish. EW skips the last steps of long skills, so each one has five steps and ends with a report.

## Install

Skills live in the `skills` sheet of the site config, `https://da.live/config#/adobedrago/highmark/`: one row per skill, with its name, the SKILL.md text and a status. A skill shows up in EW only when its status is `approved`, both in the sheet and in EW's Skills list. After changing a SKILL.md here, update its row too.

## Examples

`examples/` holds the documents `brief-to-page` should produce for the two sample briefs: [`member/well-in-place.html`](examples/member/well-in-place.html) and [`plans/medicaid/ph95.html`](examples/plans/medicaid/ph95.html). To see them with the site's code:

```bash
node tools/ew-skills/preview-examples.mjs
npx @adobe/aem-cli@16 up --port 3100 --no-open --html-folder drafts/ew-examples
```

Then open `http://localhost:3100/drafts/ew-examples/plans/medicaid/ph95`. (`aem up` 14 has no `--html-folder`.)

## Template

The pages use `styles/templates/program-page.css`, matched to highmark.com's Program Page (`/member/case-manager`) at 390, 768 and 1440 on 2026-10-20. A local copy of that page with its own photos matched it at every measured element at all three widths.
