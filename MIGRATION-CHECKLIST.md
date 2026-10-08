# Migration checklist: pages linked from the highmark.com homepage

Tracks every page the [highmark.com](https://www.highmark.com/) homepage links to (header, body, footer, and the regional pages behind the ZIP gate) and whether it is migrated to this site. Updated 2026-10-07.

The provider pages (providers.highmark.com, migrated to `/providers`) have their own part at the end: [Provider pages](#provider-pages-providershighmarkcom--providers).

**Priority** follows general visibility on the source:

| Tier | What | Visibility | Status |
|------|------|------------|--------|
| P1 | Header links visible at load | every page, always on screen | 7/9 done, 1 to do |
| P2 | Homepage body links | the most-visited page | 6/8 done, 2 preview only |
| P3 | Footer links | every page, low prominence | 14/15 done, 1 deferred |
| P4 | Header megamenu items | every page, one click in | 41/47 done, 2 preview only, 4 to do |
| P5 | ZIP-gated regional pages | behind the ZIP gate (nav items with no plain link) | 5/87 live |

**Statuses:** **Live** = published on `main--highmark--adobedrago.aem.live`. **Preview only** = in DA and previewed, not published. **To do** = not in DA. **Redirected** = the source link itself redirects, and ours now does the same. **Redirect only** = the source redirects to a page we don't have yet. Pages that aren't migrated are sent to the same page on highmark.com by the `/redirects` sheet ("redirects to highmark.com for now"), so their links work but leave the site. Only **Live** and **Redirected** items are checked.

Before importing a page, check the `nav-group*` branches' `tools/importer/urls-*.txt` lists and the recent preview log: other people migrate pages into the same DA tree, and a second import overwrites the first. After importing, regenerate the `/redirects` sheet (`node tools/redirects/build-redirects.mjs --upload`, see AGENTS.md): a redirect row hides a page published at the same path.

## P1: header links visible on every page

- [ ] `/about/alert-notice` (Learn More) **To do**
- [x] `/employer` (For Employers) **Live**
- [x] `/language-assistance` (Language Assistance) **Live** imported by the `nav-group6` batch (#42)
- [x] `/contact` (Contact Us) **Live** imported by the `nav-group6` batch (#42)
- [x] `/plans` (Plans) **Live**
- [x] `/member/member-guide` (For Members) **Live**
- [x] `/resources` (Resources) **Live**
- [x] `/about` (About) **Redirected** redirects to /about/our-story, as the source does
- [ ] `/newsroom` (Newsroom) **Redirect only** source redirects to /newsroom/press-releases, which is preview only (2026-10-05): ours redirects to highmark.com until it is published, then `build-redirects.mjs` points it at our page

## P2: homepage body links

- [x] `/member/member-guide/find-care` (Find Care) **Live**
- [x] `/resources/answers` (Highmark Answers) **Live**
- [x] `/resources/mental-health-services` (Mental Health) **Live**
- [x] `/about/corporate-responsibility/bright-blue-futures` (Highmark Bright Blue Futures) **Live** imported by the `nav-group4` batch
- [ ] `/newsroom/press-releases` (Press Releases) **Preview only** imported 2026-10-05 as a static list of the 25 newest releases (no search, filters or paging, by decision); each links to the release on highmark.com, and "See all press releases on highmark.com" ends the list. Refresh `tools/importer/data/press-releases.json` and re-import to update it
- [ ] `/because-life` (learn about us) **Preview only** imported 2026-10-05 (`campaign-landing` template); FIND CARE goes straight to our `/member/member-guide/find-care`
- [x] `/privacy` (Digital Privacy Policy) **Live**
- [x] `/terms-service` (Terms of Service) **Live**

## P3: footer links

- [x] `/non-discrimination` (Non Discrimination Policy) **Live**
- [x] `/fraud` (Fraud Prevention) **Live**
- [ ] `/western-pennsylvania/medical-policy` (Medical Policy) **Deferred** ZIP-gated regional page; deferred to the P5 decision; redirects to highmark.com for now
- [x] `/cms-onc-interoperability` (CMS Interoperability Patient Access Rule) **Live**
- [x] `/cms-onc-interoperability-prior-authorization-rule` (CMS Interoperability Prior Authorization Rule) **Live**
- [x] `/accessibility-statement` (Accessibility Statement) **Live**
- [x] `/sms-texting` (SMS Texting) **Live**
- [x] `/privacy-center` (Privacy Center) **Redirected** redirects to /privacy-center/announcements, as the source does
- [x] `/privacy-center/announcements` (Privacy Center: Announcements) **Live**
- [x] `/no-surprises-act` (No Surprises Act) **Live**
- [x] `/transparency-in-coverage` (Transparency in Coverage) **Live**
- [x] `/network-access` (Network Access & Adequacy) **Live**
- [x] `/mandates` (State Law Requirements) **Live**
- [x] `/gdpr` (GDPR) **Live**
- [x] `/ohca` (OHCA Statement) **Live**

Sub-pages the footer pages link to (side navs and links); not linked from the homepage. 10/11 live:

- [x] `/fraud/red-flags` **Live** linked from `/fraud`
- [x] `/fraud/contact` **Live** linked from `/fraud`
- [x] `/fraud/senior-fraud-prevention` **Live** linked from `/fraud`
- [x] `/privacy-center/privacy-policies-and-practices` **Live** linked from `/privacy-center/announcements`
- [x] `/privacy-center/state-specific-notices` **Live** linked from `/privacy-center/announcements`
- [x] `/privacy-center/terms-of-service` **Live** linked from `/privacy-center/announcements`
- [x] `/privacy-center/health-information-exchanges` **Live** linked from `/privacy-center/announcements`
- [x] `/privacy-center/privacy-forms` **Live** linked from `/privacy-center/announcements`
- [x] `/transparency-in-coverage/claims-payment-policies-and-other-information` **Live** linked from `/transparency-in-coverage`
- [x] `/privacy/digital-privacy-policy` **Live** linked from `/privacy`
- [ ] `/fraud/fraud-form` **To do** linked from `/fraud/contact`; the Health Care Fraud Form (55 fields, posts to the source's `/bin/hmk/genericmailer`): needs a form-handling decision, not just an import; redirects to highmark.com for now

Also in P3:

- [x] Legal template update (PR #36, 2026-09-30): lists, letter-spacing, in-text link blue, standalone links as text links, centered outlined brand buttons, the two-column grid, PDF-link icons; the held sub-pages and the pages it affected are published.
- [x] `/privacy-center` redirects to `/privacy-center/announcements`, as on the source (`/redirects` sheet, 2026-10-01), so the "Privacy Center" side-nav parent link on the six `/privacy-center/*` pages works.
- [x] Our `/footer` fragment: the CSI Policy link points at the source PDF (`https://www.highmark.com/content/dam/…/pdfs/CSIPolicy.pdf`), published 2026-10-01. Before that it kept the importer's mangled file name (`…/csipolicy-pdf`) and 404ed.
- [ ] Our `/footer` fragment is older than the source footer: the source labels the first CMS link "CMS Interoperability Patient Access Rule" (ours: "CMS's Interoperability Rule") and also links CMS Interoperability Prior Authorization Rule and Privacy Center.

## P4: header megamenu items

- [x] `/plans/individual-families` (Individual and Family Plans) **Live**
- [x] `/plans/individual-families/get-help` (Get Help) **Live**
- [x] `/western-pennsylvania/chip/chip-enhanced-member-supports-and-case-management` (CHIP Enhanced Member Supports and Case Management) **Live**
- [x] `/plans/medicare/learn-about-medicare` (Learn About Medicare) **Live**
- [x] `/plans/d-snp` (Dual Special Needs Plans (D-SNP)) **Live**
- [x] `/plans/medicare/blue-neighbors` (Volunteer Support) **Live**
- [x] `/plans/medicare/get-help` (Get Help) **Live**
- [x] `/plans/medicaid` (Medicaid) **Live**
- [ ] `/wholecare/medicare/get-help` (Get Help) **To do**
- [x] `/employer/solutions` (Solutions) **Live**
- [x] `/employer/cost-management` (Cost Management) **Live**
- [x] `/employer/care-management` (Care Management) **Live**
- [x] `/employer/client-resources` (Client Resources) **Live**
- [x] `/employer/thought-leadership` (Thought Leadership) **Live**
- [ ] `/employer/get-started` (Get Started) **To do** redirects to highmark.com for now
- [x] `/resources/answers/faq/aca-plans` (Individual and Family Insurance (ACA)) **Live**
- [x] `/resources/answers/faq/chip` (CHIP - Highmark Healthy Kids) **Live**
- [x] `/resources/answers/faq/home-prescription-delivery` (Home Prescription Delivery) **Live**
- [x] `/resources/answers/faq/covid` (COVID-19) **Live**
- [x] `/resources/answers/health-insurance-glossary` (Health Insurance Glossary) **Live**
- [x] `/resources/answers/community-assistance-resources` (Community Resources & Support) **Live**
- [x] `/resources/mental-health-services/depression` (Depression) **Live**
- [x] `/resources/mental-health-services/anxiety` (Anxiety) **Live**
- [x] `/resources/mental-health-services/substance-use-disorders` (Substance Use Disorder) **Live**
- [x] `/resources/mental-health-services/eating-disorders` (Eating Disorders) **Live**
- [x] `/resources/mental-health-services/mental-health-resources-teens-children` (Mental Health in Children & Adolescents) **Live**
- [x] `/resources/mental-health-services/mental-health-resources` (Mental Health Resources) **Live**
- [x] `/resources/spending-accounts` (Spending Accounts) **Live**
- [x] `/resources/spending-accounts/health-saving-account-hsa` (Health Savings Accounts (HSA)) **Live**
- [ ] `/resources/spending-accounts/flexible-spending-account-fsa` (Flexible Savings Accounts (FSA)) **Preview only** held back from publishing until art-golk's PR #44 (data-table fix) merges; re-previewed 2026-10-01
- [x] `/resources/spending-accounts/health-reimbursement-arrangement-hra` (Health Reimbursement Arrangement (HRA)) **Live**
- [ ] `/resources/spending-accounts/commuter-benefits-account` (Commuter Benefits) **Preview only** held back from publishing until art-golk's PR #44 (data-table fix) merges; re-previewed 2026-10-01
- [x] `/about/our-story` (Our Story) **Live** imported 2026-09-29; the `nav-group4` batch re-published it 2026-09-30 with breadcrumbs and `template: about-article` metadata (body unchanged)
- [x] `/about/our-story/mission-vision` (Mission, Vision & Core Behaviors) **Live** imported by the `nav-group4` batch
- [x] `/about/our-story/our-businesses` (Our Businesses) **Live** imported by the `nav-group4` batch
- [x] `/about/our-story/leadership-team-board` (Leadership Team & Board) **Live** imported by the `nav-group4` batch
- [x] `/about/corporate-responsibility` (Corporate Responsibility) **Live** imported by the `nav-group4` batch
- [x] `/about/corporate-responsibility/valuing-our-people` (Valuing Our People) **Live** imported by the `nav-group4` batch
- [x] `/about/corporate-responsibility/integrity-ethics` (Integrity & Ethics) **Redirected** redirects to highmarkhealth.org, as the source does
- [x] `/about/corporate-responsibility/social-determinants-of-health` (Social Determinants of Health) **Live** imported by the `nav-group4` batch
- [x] `/about/corporate-responsibility/sustainability` (Sustainability) **Live** imported by the `nav-group4` batch
- [ ] `/about/events` (Events) **To do** redirects to highmark.com for now
- [x] `/newsroom/media-relations-contacts` (Media Relations Contacts) **Live** imported by the `nav-group5` batch (#34)
- [x] `/newsroom/news-alert` (News Alert) **Live** 2026-10-06 (`news-alert` template, `form-minimal-light` block, #59), with its `/newsroom/news-alert-form.json` field sheet. The form does not work yet: it still posts to the source's `/bin/hmk/genericmailer`, which expects the reCAPTCHA token tied to highmark.com (why `nav-group5`, #34, deferred it). Replace the submit URL (row 2 of the block), then re-publish the page
- [x] `/newsroom/weekly-capitol-hill-report` (Weekly Capitol Hill Report) **Live** imported by the `nav-group5` batch (#34)
- [x] `/resources/answers/faq` (Frequently Asked Questions) **Live**
- [ ] `/about/corporate-responsibility/blue-fund` (Blue Fund) **To do**

Also in P4:

- [x] Our `/nav` placeholders (2026-10-01): the 14 ZIP-gated items point at Western PA pages until the P5 decision. The CHIP items are our pages, and the Individual & Family items redirect to highmark.com. "Shop Individual and Family Plans" goes to `/shop/`, and "My Location" opens the ZIP modal.

## P5: ZIP-gated regional pages

The source's ACA and CHIP nav items have no plain link: they open the ZIP gate (`/zipcode-gate-login`) and then go to `/<region>/individual-families/<page>` or `/<region>/chip/<page>`. Decide the approach before importing: one page per region (up to 8 near-duplicates per page type), or one region-aware page per type built on the shop's region layer (link tokens and `Regions` sections, see AGENTS.md).

| Nav item | WPA | CPA | NEPA | SEPA | DE | WV | WNY | NENY |
|----------|---|---|---|---|---|---|---|---|
| Shop Individual and Family Plans | to do | to do | to do | to do | to do | to do | to do | to do |
| Understanding Health Insurance | to do | to do | to do | to do | to do | to do | to do | to do |
| Special Enrollment Period | to do | to do | to do | to do | to do | to do | to do | to do |
| Doctors and Drugs | to do | to do | to do | to do | to do | to do | to do | to do |
| Dental Plans | to do | to do | to do | to do | to do | to do | to do | to do |
| Conversion Coverage | to do | to do | to do | to do | to do | to do | to do | to do |
| Travel Health Insurance | to do | to do | to do | to do | to do | to do | to do | to do |
| How to Pick a Plan | to do | to do | to do | to do | to do | to do | to do | to do |
| CHIP (main nav) | live | to do | to do | to do | to do | to do | to do | to do |
| What is CHIP? | live | to do | to do | · | · | · | · | · |
| Apply or Renew CHIP | to do | to do | to do | · | · | · | · | · |
| CHIP Eligibility and Costs | live | to do | to do | · | · | · | · | · |
| CHIP Doctors and Drugs | live | to do | to do | · | · | · | · | · |
| CHIP Resources | live | to do | to do | · | · | · | · | · |

`·` = the page does not exist for that region on the source. The footer's Medical Policy link (`/western-pennsylvania/medical-policy`) is also ZIP-gated and waits on this decision.

`/zipcode-gate-login` itself is **Preview only** (2026-10-05): the page text plus the `zip-county-form` block from `/modals/zip-county`, and the "What is employer-sponsored health insurance?" FAQ as an `accordion-minimal-light` block, collapsed as on the source. On a page (not in the modal), Continue goes to the URL's `?redirect=` (or `?return=`, or the block's optional `Redirect` row; same-site links only), otherwise it shows "Thanks! Your area is set to …". The `/employer/solutions/zipcode-gate-login` and `/reservations/medicare/zipcode-gate-login` variants are not migrated.

## Other top-level pages

Not linked from the homepage; found in the sitemap. Imported 2026-10-05, **Preview only**. Their links to sub-pages we don't have (`/ventures/portfolio`, `/health-options-de/duals`, ...) are in the `/redirects` sheet.

- [ ] `/podcast`, `/public-policy` (`content-landing` template). Podcast transcripts and images stay on highmark.com; the host headshot and "Read Bio" page 404 on the source too.
- [ ] `/medicare-hra` (`medicare-hra` template): the quiz's welcome screen only; "I'm ready" goes to the quiz on highmark.com.
- [ ] `/wholecare`, `/health-options-de` (`subsidiary-home` template). The Delaware "We're in your community" video plays inline through `columns-minimal-dark` (a cell holding only an `.mp4` link).
- [ ] `/health-options-wv`, `/ventures` (`campaign-landing` template, with `/because-life`). Ventures keeps the source's closing "Let's change healthcare" band.

## Provider pages (providers.highmark.com → /providers)

Tracks every page of [providers.highmark.com](https://providers.highmark.com/) (the Provider Resource Center) and whether it is migrated to `/providers` on this site: our `/providers/claims` is the source's `/claims`. Built 2026-10-07 from the source's sitemap (464 URLs) and its own list servlets; see "Provider pages" in AGENTS.md for how the pages are built.

**Priority** follows visibility on the source:

| Tier | What | Pages | Live |
|------|------|-------|------|
| Done | The home page and the top-level landing pages | 9 | 9/9 |
| P1 | Mega-menu items (every page, one click in) | 87 | 17/87 |
| P2 | Pages our live provider pages link to (not in the menu) | 18 | 0/18 |
| P3 | The rest of each section | 86 | 0/86 |
| P4 | Communications Hub articles and archive lists | 219 | 0/219 |
| Source | Stay on providers.highmark.com (Availity login, forms, search) | 45 | n/a |

**Statuses:** **Live** = published; **Preview only** = in DA and previewed, awaiting review; **To do** = not in DA; **Needs decision** = a form that posts to the source (no form solution here yet); **Stays on source** = not migrated by decision. Links from our pages to provider pages not yet migrated go to the same page on providers.highmark.com through the `/redirects` sheet; re-run `build-redirects.mjs` and publish the sheet after each batch.

A region list after a page (e.g. "WNY") means the source shows it only for those regions in its region picker; our menu shows every page, so each needs a decision when imported: show it to everyone, labelled, or use `Regions` section metadata as on `/shop/`.

**Templates** (from the components on each source page; **Needs** = what the first batch of that template needs):

| Template | Pages | What it is | Needs |
|----------|-------|------------|-------|
| `landing` | 26 | Hero banner, intercept banners, card blocks, service-centre cards (the 9 live pages) | Ready: the provider converter (`extract.cjs` + `build.mjs`) |
| `content` | 95 | Title, left side nav, text; some with data tables, accordions, region-tagged text, a right rail | A side-nav model (`cards-minimal-light-sidenav`, as the highmark.com sidebar pages), `table`, `accordion-minimal-light`; a rule for region-tagged text (static menu: show every region, labelled) |
| `manual` | 55 | The Provider Manual: chapters and their units (side nav = the manual's contents) | As `content`, plus images and buttons |
| `article` | 214 | News and Updates articles (205) and Provider News newsletters (10): title, date, audience, body, related articles | An article template; related articles static or from the query index |
| `article-listing` | 4 | News and Updates, Provider News, Medical Policy Update, Formulary Updates: searchable lists from the source's `/bin/prc/topics` servlet | A list block over the query index (articles migrate first); Medical Policy Update and Formulary Updates list 19 PDFs, not pages |
| `document-list` | 20 | Lists from the `/bin/prc/blog` servlet: reimbursement policies and the regional news archives, 719 PDFs in all, each behind a stub page that redirects to the PDF | A list block fed by a sheet (title, date, PDF link), like `press-release-list`; the PDFs stay on the source |
| `form` | 5 | Forms posting to the source's servlets with reCAPTCHA | A form decision (as for `/fraud/fraud-form`); until then, link to the source |
| `empty` | 2 | PDF stub pages that happen to be in the sitemap | Nothing: they are items of a `document-list` |

### Done (9/9)

- [x] `/providers/` (Provider Resource Center: Home) `landing` **Live**
- [x] `/providers/authorization` (Authorizations) `landing` **Live**
- [x] `/providers/claims` (Claims) `landing` **Live**
- [x] `/providers/communications-hub` (Communications Hub) `landing` **Live**
- [x] `/providers/contact-us` (Contact Us) `landing` **Live** regional text
- [x] `/providers/legal-information` (Legal Information) `content` **Live**
- [x] `/providers/policies-and-programs` (Policies and Programs) `landing` **Live**
- [x] `/providers/provider-network` (Provider Network) `landing` **Live**
- [x] `/providers/resources-and-education` (Resources and Education) `landing` **Live**

### P1: mega-menu items (17/87)

In menu order.

**Authorization**

- [ ] `/providers/authorization/obtaining-authorizations` (Obtaining Authorizations) `content` **Preview only** accordion
- [ ] `/providers/authorization/mcg-clinical-criteria` (MCG Clinical Criteria) `content` **Preview only** regional text
- [ ] `/providers/authorization/gold-carding-program` (Gold Carding Program) `content` **Preview only** WPA/NEPA, CPA/SEPA, DE, WNY, NENY; regional text, accordion
- [ ] `/providers/authorization/availity` (Availity Essentials Guidance) `content` **Preview only** accordion

**Claims**

- [x] `/providers/claims/value-based-reimbursement-programs-overview` (Value-Based Reimbursement) `landing` **Live**
- [ ] `/providers/claims/value-based-reimbursement-programs-overview/medicare-advantage-stars-overview` (Medicare Advantage Stars) `content` **Preview only**
- [ ] `/providers/claims/value-based-reimbursement-programs-overview/valueblue` (ValueBlue and ValueBlue Connect) `content` **Preview only** WPA/NEPA, CPA/SEPA, WV, WNY, NENY; regional text, accordion
- [ ] `/providers/claims/value-based-reimbursement-programs-overview/best-practice` (BestPractice) `content` **Preview only** WNY; regional text
- [x] `/providers/claims/reimbursement-resources` (Reimbursement Resources) `landing` **Live**
- [ ] `/providers/claims/reimbursement-resources/electronic-claims-submission-status-and-inquiry` (Electronic Claims) `content` **Preview only** table, accordion
- [ ] `/providers/claims/reimbursement-resources/reimbursement-policies` (Reimbursement Policies) `document-list` **To do** 74 PDFs
- [ ] `/providers/claims/reimbursement-resources/apc-pricing-component-update-calendar` (APC Pricing Component Update Calendar) `content` **Preview only** table
- [ ] `/providers/claims/reimbursement-resources/guidelines-and-tips` (Guidelines and Tips) `content` **Preview only** WPA/NEPA, CPA/SEPA, DE, WV; regional text
- [ ] `/providers/claims/reimbursement-resources/hospital-opps-based-payment-method` (Hospital OPPS-Based Payment Method) `content` **Preview only** regional text
- [ ] `/providers/claims/reimbursement-resources/independent-dispute-resolution-process-hbcbswny-and-hbsneny` (Independent Dispute Resolution) `content` **Preview only** WNY, NENY

**Policies and Programs**

- [x] `/providers/policies-and-programs/medical-policies` (Medical Policies) `landing` **Live** policy search on the source
- [x] `/providers/policies-and-programs/care-management` (Care Management) `landing` **Live**
- [ ] `/providers/policies-and-programs/care-management/behavioral-health-resources` (Behavioral Health Resources) `content` **Preview only** regional text
- [ ] `/providers/policies-and-programs/care-management/right-care-program` (Right Care Program) `content` **Preview only** table
- [ ] `/providers/policies-and-programs/care-management/well-in-place` (Well in Place) `content` **Preview only** WPA/NEPA, CPA/SEPA, DE; regional text
- [x] `/providers/policies-and-programs/pharmacy-programs` (Pharmacy Programs) `landing` **Live** pharmacy policy search on the source
- [ ] `/providers/policies-and-programs/pharmacy-programs/channel-alignment-program` (Channel Alignment Program) `content` **Preview only**
- [ ] `/providers/policies-and-programs/pharmacy-programs/free-market-health` (Free Market Health) `content` **Preview only**
- [ ] `/providers/policies-and-programs/pharmacy-programs/hemophilia-and-bleeding-disorder-drug` (Hemophilia and Bleeding Disorder Drug Program) `content` **Preview only** WPA/NEPA, CPA/SEPA, DE, WNY, NENY; regional text
- [ ] `/providers/policies-and-programs/pharmacy-programs/medical-injectable-drug-program` (Medical Injectable Drug Program) `content` **Preview only** regional text
- [ ] `/providers/policies-and-programs/pharmacy-programs/medicare-programs` (Medicare Programs) `content` **Preview only** WPA/NEPA, CPA/SEPA; regional text
- [ ] `/providers/policies-and-programs/pharmacy-programs/pharmaceutical-management` (Pharmaceutical Management) `content` **Preview only** regional text
- [ ] `/providers/policies-and-programs/pharmacy-programs/program-for-self-administered-injectable-or-oral-biotechnology-d` (Program for Self-Administered Injectable or Oral Biotechnology Drugs) `content` **Preview only** regional text
- [ ] `/providers/policies-and-programs/pharmacy-programs/site-of-care-drug-management` (Site of Care Drug Management) `content` **Preview only** table, regional text
- [x] `/providers/policies-and-programs/formulary` (Formulary) `landing` **Live**
- [ ] `/providers/policies-and-programs/formulary/what-is-formulary` (What is Highmark Formulary) `content` **Preview only** regional text
- [ ] `/providers/policies-and-programs/formulary/medicare-formulary` (Medicare Formulary) `content` **Preview only** regional text
- [x] `/providers/policies-and-programs/transform-health-with-telehealth` (Telehealth) `landing` **Live**
- [x] `/providers/policies-and-programs/transform-health-with-telehealth/condition-management-programs` (Condition Management Programs) `landing` **Live**
- [ ] `/providers/policies-and-programs/transform-health-with-telehealth/virtual-health-overview` (Virtual Health Overview) `content` **Preview only**

**Provider Network**

- [x] `/providers/provider-network/credentialing` (Credentialing) `landing` **Live**
- [ ] `/providers/provider-network/credentialing/professional` (Professional) `content` **Preview only** table, accordion, regional text
- [ ] `/providers/provider-network/credentialing/organizational` (Organizational) `content` **Preview only** table, regional text
- [x] `/providers/provider-network/high-performance-networks` (High Performance Networks) `landing` **Live** WPA/NEPA, CPA/SEPA; regional text
- [ ] `/providers/provider-network/high-performance-networks/practice-performance-insights` (Practice Performance Insights) `content` **Preview only**
- [ ] `/providers/provider-network/high-performance-networks/home-health-agency-network` (Home Health Agency Network) `content` **Preview only** WPA/NEPA, CPA/SEPA; regional text
- [ ] `/providers/provider-network/high-performance-networks/pt-ot-chiro-network` (Physical Therapy, Occupational Therapy, and Chiropractic Network) `content` **Preview only** WPA/NEPA, CPA/SEPA; regional text
- [ ] `/providers/provider-network/high-performance-networks/select-durable-medical-equipment-network` (Select Durable Medical Equipment Network) `content` **Preview only** WPA/NEPA, CPA/SEPA; regional text
- [ ] `/providers/provider-network/high-performance-networks/skilled-nursing-facility-network` (Skilled Nursing Facility Network) `content` **Preview only** WPA/NEPA, CPA/SEPA; regional text
- [x] `/providers/provider-network/inter-plan-programs` (Inter-Plan Programs) `landing` **Live**
- [ ] `/providers/provider-network/inter-plan-programs/blue-distinction-centers-for-specialty-care-program-page` (Blue Distinction for Specialty Care) `content` **Preview only** regional text
- [ ] `/providers/provider-network/inter-plan-programs/bluecard-information-center` (BlueCard Information) `content` **Preview only** regional text
- [ ] `/providers/provider-network/inter-plan-programs/medical-policy-pre-certification-and-pre-authorization-out-of-area-members` (Medical Policy, Pre-Certification and Pre-Authorization Out-of-Area Members) `form` **Needs decision** a prefix lookup form posting to the source's `interplansearch` servlet (reCAPTCHA)
- [ ] `/providers/provider-network/inter-plan-programs/medicare-advantage-pffs-search` (Medicare Advantage Private Fee-for-Service Search) `form` **Needs decision** a prefix lookup form posting to the source's `interplansearch` servlet (reCAPTCHA)
- [ ] `/providers/provider-network/highmark-healthy-kids-chip` (Highmark Healthy Kids (CHIP)) `content` **Preview only** WPA/NEPA, CPA/SEPA; regional text
- [ ] `/providers/provider-network/copaygo` (CopayGo Health Plan) `content` **Preview only** accordion

**Resources and Education**

- [x] `/providers/resources-and-education/highmark-provider-manual` (Provider Manual) `landing` **Live**
- [ ] `/providers/resources-and-education/highmark-provider-manual/whats-new` (What's New) `manual` **Preview only** accordion
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-1-general-information` (General Information) `manual` **Preview only**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-2-product-information` (Product Information) `manual` **Preview only**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-3-provider-network-participation` (Network Participation) `manual` **Preview only**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-4-provider-responsibilities-and-guidelines` (Responsibilities and Guidelines) `manual` **Preview only**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-5-care-and-quality-management` (Care and Quality Management) `manual` **Preview only**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-6-billing-and-payment` (Billing and Payment) `manual` **Preview only**
- [x] `/providers/resources-and-education/training-and-guides` (Training and Guides) `landing` **Live**
- [ ] `/providers/resources-and-education/training-and-guides/ma-resources` (Medicare Advantage Resources) `content` **Preview only** regional text
- [ ] `/providers/resources-and-education/training-and-guides/no-surprises-act` (No Surprises Act) `content` **Preview only** accordion
- [ ] `/providers/resources-and-education/training-and-guides/provider-onboarding` (Provider Onboarding) `content` **Preview only** accordion
- [ ] `/providers/resources-and-education/training-and-guides/provider-data-accuracy-compliance` (Provider Data Accuracy Compliance) `content` **Preview only** regional text
- [ ] `/providers/resources-and-education/training-and-guides/reference-guide-of-highmark-member-programs` (Reference Guide of Highmark Member Programs) `content` **Preview only**
- [ ] `/providers/resources-and-education/training-and-guides/self-service-hub` (Self-Service Hub) `content` **Preview only** table
- [x] `/providers/resources-and-education/educational-programs` (Educational Programs) `landing` **Live**
- [ ] `/providers/resources-and-education/educational-programs/axialhealthcare-substance-use-risk-and-recovery-programs` (axialHealthcare Substance Use Risk Mitigation Program) `content` **Preview only**
- [ ] `/providers/resources-and-education/educational-programs/behavioral-health-toolkit` (Behavioral Health Toolkit) `content` **Preview only** accordion
- [x] `/providers/resources-and-education/clinical-quality-education` (Clinical Quality and Education) `landing` **Live**
- [ ] `/providers/resources-and-education/clinical-quality-education/cahps-qhp-ees-survey-results` (CAHPS®/QHP EES Results) `content` **Preview only** regional text
- [ ] `/providers/resources-and-education/clinical-quality-education/coding-education-hcc-university` (Coding Education/HCC University) `content` **Preview only** accordion
- [ ] `/providers/resources-and-education/clinical-quality-education/educational-resources-member-provider` (Educational Resources - Member and Provider) `content` **Preview only** regional text
- [ ] `/providers/resources-and-education/clinical-quality-education/preventive-health-guidelines` (Preventive Health Guidelines) `content` **Preview only** regional text
- [x] `/providers/resources-and-education/forms` (Forms) `landing` **Live**
- [ ] `/providers/resources-and-education/forms/behavioral-health-forms` (Behavioral Health Forms) `content` **Preview only** regional text
- [ ] `/providers/resources-and-education/forms/certificate-of-medical-necessity-cmn-for-dme-providers` (CMN for DME Providers) `content` **Preview only** WPA/NEPA, CPA/SEPA, DE, WV; regional text
- [ ] `/providers/resources-and-education/forms/medical-authorization-forms` (Medical Authorization Forms) `content` **Preview only** regional text
- [ ] `/providers/resources-and-education/forms/medical-injectable-drug-forms` (Medical Injectable Drug Forms) `content` **Preview only** regional text
- [ ] `/providers/resources-and-education/forms/pharmacy-prior-authorization-forms` (Pharmacy Prior Authorization Forms) `content` **Preview only** regional text
- [ ] `/providers/resources-and-education/forms/provider-information-management-forms` (Provider Information Management Forms) `content` **Preview only** regional text
- [ ] `/providers/resources-and-education/forms/miscellaneous-forms` (Miscellaneous Forms) `content` **Preview only** regional text

**Communications Hub**

- [ ] `/providers/communications-hub/formulary-updates` (Formulary Updates) `article-listing` **To do**
- [ ] `/providers/communications-hub/news-and-updates` (News and Updates) `article-listing` **To do** 2025-09-29; WNY, NENY
- [ ] `/providers/communications-hub/provider-news` (Provider News) `article-listing` **To do**
- [ ] `/providers/communications-hub/medical-policy-update` (Medical Policy Update) `article-listing` **To do**
- [x] `/providers/communications-hub/news-archive` (News Archive) `landing` **Live**

### P2: linked from our live provider pages (0/18)

- [ ] `/providers/communications-hub/news-and-updates/2027-bestpractice-program-changes` (2027 BestPractice Program Changes) `article` **To do** 2026-09-25; WNY; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/accessibility-expectations-ensuring-timely-access-to-care` (Accessibility Expectations: Ensuring Timely Access to Care) `article` **To do** 2026-10-06; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/cms-requires-use-of-electronic-claim-attachments-by-2028` (CMS Requires Use of Electronic Claim Attachments by 2028) `article` **To do** 2026-09-23; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/delaware-providers-new-credentialing-portal-launches-oct-5` (Delaware Providers: New Credentialing Portal Launches Oct. 5) `article` **To do** 2026-09-24; DE; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/evolent-to-manage-medical-and-radiation-oncology-authorizations` (Evolent to Manage Medical and Radiation Oncology Authorizations) `article` **To do** 2026-09-23; linked from `/providers/`, `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/guidance-on-new-coding-and-billing-model-for-maternity-care` (Guidance on New Coding and Billing Model for Maternity Care) `article` **To do** 2026-09-28; linked from `/providers/`, `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/karen-hanlon-named-chief-executive-officer-and-president` (Karen Hanlon Named Chief Executive Officer and President of Highmark Health) `article` **To do** 2026-10-06; linked from `/providers/`, `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/medical-injectable-drug-program-changes-in-the-new-year-de-pa-wv` (Medical Injectable Drug Program Changes in the New Year) `article` **To do** 2026-09-24; WPA/NEPA, CPA/SEPA, DE, WV; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/medical-injectable-drug-program-changes-in-the-new-year-ny` (Medical Injectable Drug Program Changes in the New Year) `article` **To do** 2026-09-24; WNY, NENY; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-september-2026` (New and Updated Reimbursement Policies – September 2026) `article` **To do** 2026-09-28; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/support-program-update-some-beneficial-changes-for-prescribers` (SUPPORT Program Update: Some Beneficial Changes for Prescribers) `article` **To do** 2026-09-22; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/upcoming-changes-for-highmark-condition-management-programs` (Upcoming Changes for Highmark Condition Management Programs) `article` **To do** 2026-09-23; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/news-and-updates/valueblue-base-rates-set-for-2027` (ValueBlue Base Rates Set for 2027) `article` **To do** 2026-09-25; NENY; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/provider-news/august-2026-newsletter` (August 2026 Newsletter) `article` **To do** 2026-08-31; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/provider-news/july-2026-newsletter` (July 2026 Newsletter) `article` **To do** 2026-07-27; linked from `/providers/communications-hub`
- [ ] `/providers/communications-hub/provider-news/september-2026-newsletter` (September 2026 Newsletter) `article` **To do** 2026-09-28; linked from `/providers/communications-hub`
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-1-general-information/unit-2-online-resources-and-contact-information` (Unit 2: Online Resources and Contact Information) `manual` **To do** linked from `/providers/contact-us`; table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-6-billing-and-payment/unit-8-payment-review` (Unit 8: Payment Review) `manual` **To do** linked from `/providers/claims`

### P3: the rest of each section (0/86)

**Authorization**

- [ ] `/providers/authorization/obtaining-authorizations/authorization-management` (Authorization Management Vendors) `content` **To do** accordion
- [ ] `/providers/authorization/obtaining-authorizations/prior-authorization-metrics` (Prior Authorization Metrics) `content` **To do**

**Claims**

- [ ] `/providers/claims/reimbursement-resources/guidelines-and-tips/documentation-guidelines-for-evolution-and-management-services` (Documentation Guidelines for Evaluation and Management Services) `content` **To do**
- [ ] `/providers/claims/reimbursement-resources/guidelines-and-tips/documentation-guidelines-for-evolution-and-management-services/auditor-s-scoring-worksheets-using-95-97-guidelines-prior-to-202` (Auditor’s Scoring Worksheets Using 95/97 Guidelines Prior to 2021) `content` **To do** WPA/NEPA, CPA/SEPA, DE, WV; regional text
- [ ] `/providers/claims/reimbursement-resources/guidelines-and-tips/documentation-guidelines-for-evolution-and-management-services/auditors-scoring-worksheets-using-95-97-guidelines-for-em-services-other-than-outpatient-office-em-services-2021` (Auditor's Scoring Worksheets Using 95/97 Guidelines 2021) `content` **To do** WPA/NEPA, CPA/SEPA, DE, WV; regional text
- [ ] `/providers/claims/reimbursement-resources/guidelines-and-tips/highmark-coding-tips` (Highmark Coding Tips) `content` **To do** regional text
- [ ] `/providers/claims/reimbursement-resources/reimbursement-policies-archived-policies` (Reimbursement Policy Archive) `document-list` **To do** 15 PDFs
- [ ] `/providers/claims/value-based-reimbursement-programs-overview/medicare-advantage-stars-overview/medicare-advantage-member-and-provider-programs` (Medicare Advantage Member and Provider Programs) `content` **To do** regional text
- [ ] `/providers/claims/value-based-reimbursement-programs-overview/medicare-advantage-stars-overview/medicare-advantage-stars` (Medicare Advantage Stars) `content` **To do** accordion
- [ ] `/providers/claims/value-based-reimbursement-programs-overview/medicare-advantage-stars-overview/medicare-advantage-stars/home-visit-programs` (Home Visit Programs) `content` **To do** regional text

**Policies and Programs**

- [ ] `/providers/policies-and-programs/care-management/behavioral-health-resources/behavioral-health-telemedicine-and-virtual-visits` (Behavioral Health Telemedicine and Virtual Visits) `content` **To do** accordion
- [ ] `/providers/policies-and-programs/medical-policies/medical-policy-faqs` (Frequently Asked Questions) `content` **To do**
- [ ] `/providers/policies-and-programs/medical-policies/mission-statement` (Mission Statement) `content` **To do**
- [ ] `/providers/policies-and-programs/pharmacy-programs/pharmaceutical-management/process-for-requesting-drug-coverage-from-a-pharmaceutical-manag` (Process for Requesting Drug Coverage From a Pharmaceutical Management Program) `content` **To do** regional text
- [ ] `/providers/policies-and-programs/transform-health-with-telehealth/condition-management-programs/cardiopulmonary-management` (Cardiopulmonary Management) `content` **To do**
- [ ] `/providers/policies-and-programs/transform-health-with-telehealth/condition-management-programs/kidney-health-management-program` (Kidney Health Management) `content` **To do**
- [ ] `/providers/policies-and-programs/transform-health-with-telehealth/condition-management-programs/metabolic-conditions` (Metabolic Conditions) `content` **To do**
- [ ] `/providers/policies-and-programs/transform-health-with-telehealth/condition-management-programs/msk-care-programs` (Musculoskeletal Care Programs) `content` **To do**
- [ ] `/providers/policies-and-programs/transform-health-with-telehealth/condition-management-programs/womens-health` (Women's Health Programs) `content` **To do**

**Resources and Education**

- [ ] `/providers/resources-and-education/clinical-quality-education/educational-resources-member-provider/inventory-request-form` (Inventory Request Form) `form` **Needs decision** an order form posting to `/bin/prc/genericmailer` (reCAPTCHA)
- [ ] `/providers/resources-and-education/clinical-quality-education/practice-site-resources` (Practice Site Resources) `content` **To do** WPA/NEPA, CPA/SEPA, DE, WV; regional text
- [ ] `/providers/resources-and-education/clinical-quality-education/practice-site-resources/behavioral-health-practice-resources` (Behavioral Health Practice Resources) `content` **To do** WPA/NEPA, CPA/SEPA, DE, WV; regional text
- [ ] `/providers/resources-and-education/clinical-quality-education/practice-site-resources/office-site-and-medical-record-evaluation-forms` (Office Site and Medical Record Evaluation Forms) `content` **To do** WPA/NEPA, CPA/SEPA, DE, WV; regional text
- [ ] `/providers/resources-and-education/clinical-quality-education/practice-site-resources/pcp-and-obgyn-practice-resources` (PCP and OBGYN Practice Resources) `content` **To do** WPA/NEPA, CPA/SEPA, DE, WV; regional text
- [ ] `/providers/resources-and-education/educational-programs/new-york-states-end-the-epidemic-hiv-aids-plan-hbcbswny-and-hbsneny` (New York State's End the Epidemic – HIV/AIDS Plan) `content` **To do** WNY, NENY; regional text
- [ ] `/providers/resources-and-education/educational-programs/overview-of-the-quality-improvement-program` (Overview of the Quality Improvement Program) `content` **To do** WNY, NENY; regional text
- [ ] `/providers/resources-and-education/educational-programs/population-health-university` (Population Health University) `landing` **To do**
- [ ] `/providers/resources-and-education/educational-programs/population-health-university/additional-resources` (Other Resources) `content` **To do**
- [ ] `/providers/resources-and-education/educational-programs/population-health-university/all-resources-a-z` (All Resources A-Z) `content` **To do** accordion
- [ ] `/providers/resources-and-education/educational-programs/population-health-university/care-management` (Care Management) `content` **To do**
- [ ] `/providers/resources-and-education/educational-programs/population-health-university/clinical-insights-education` (Clinical Insights and Education) `content` **To do**
- [ ] `/providers/resources-and-education/educational-programs/population-health-university/clinical-pharmacy-resources` (Clinical Pharmacy Resources) `content` **To do**
- [ ] `/providers/resources-and-education/educational-programs/population-health-university/disease-management` (Disease Management) `content` **To do**
- [ ] `/providers/resources-and-education/educational-programs/population-health-university/emergency-department-utilization` (Emergency Department Utilization) `content` **To do**
- [ ] `/providers/resources-and-education/educational-programs/population-health-university/sdoh` (Social Determinants of Health) `content` **To do**
- [ ] `/providers/resources-and-education/educational-programs/population-health-university/transition-of-care` (Transitions of Care) `content` **To do**
- [ ] `/providers/resources-and-education/educational-programs/population-health-university/value-based-care` (Value-Based Care 101) `content` **To do**
- [ ] `/providers/resources-and-education/educational-programs/population-health-university/VBR-program-resources` (VBR Program Resources) `content` **To do**
- [ ] `/providers/resources-and-education/training-and-guides/cultural-and-language-resources` (Cultural and Language Resources) `content` **To do**
- [ ] `/providers/resources-and-education/training-and-guides/health-equity` (Health Equity and Access) `content` **To do**

<details><summary>Provider Manual units (0/46)</summary>

- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-1-general-information/unit-1-introduction` (Unit 1: Introduction) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-1-general-information/unit-3-electronic-solutions-edi-and-availity` (Unit 3: Electronic Solutions: EDI and Availity) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-1-general-information/unit-4-highmark-member-information` (Unit 4: Highmark Member Information) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-1-general-information/unit-5-member-rights-and-responsibilities` (Unit 5: Member Rights and Responsibilities) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-2-product-information/unit-1-product-overview` (Unit 1: Product Overview) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-2-product-information/unit-2-medicare-advantage-products-and-programs` (Unit 2: Medicare Advantage Products and Programs) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-2-product-information/unit-3-other-government-programs` (Unit 3: Other Government Programs) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-2-product-information/unit-4-benefit-plan-programs` (Unit 4: Benefit Plan Programs) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-2-product-information/unit-5-telemedicine-services` (Unit 5: Telemedicine Services) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-2-product-information/unit-6-the-bluecard-program` (Unit 6: The BlueCard Program) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-3-provider-network-participation/unit-1-network-participation-overview` (Unit 1: Network Participation Overview) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-3-provider-network-participation/unit-2-professional-provider-credentialing` (Unit 2: Professional Provider Credentialing) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-3-provider-network-participation/unit-3-professional-provider-guidelines` (Unit 3: Professional Provider Guidelines) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-3-provider-network-participation/unit-4-organizational-provider-participation-facility-ancillary` (Unit 4: Organizational Provider Participation (Facility/Ancillary)) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-3-provider-network-participation/unit-5-ohio-healthcare-simplification-act-pa-and-wv-only` (Unit 5: Ohio Healthcare Simplification Act (PA and WV Only)) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-4-provider-responsibilities-and-guidelines/unit-1-pcps-and-specialists` (Unit 1: PCPs and Specialists) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-4-provider-responsibilities-and-guidelines/unit-2-behavioral-health-providers` (Unit 2: Behavioral Health Providers) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-4-provider-responsibilities-and-guidelines/unit-3-facility-specific-guidelines` (Unit 3: Facility-Specific Guidelines) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-4-provider-responsibilities-and-guidelines/unit-4-ancillary-services` (Unit 4: Ancillary Services) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-4-provider-responsibilities-and-guidelines/unit-5-outpatient-radiology-and-laboratory` (Unit 5: Outpatient Radiology and Laboratory) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-4-provider-responsibilities-and-guidelines/unit-6-prescription-drug-programs` (Unit 6: Prescription Drug Programs) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-4-provider-responsibilities-and-guidelines/unit-7-medical-records-documentation-requirements` (Unit 7: Medical Records Documentation Requirements) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-5-care-and-quality-management/unit-1-care-management-overview` (Unit 1: Care Management Overview) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-5-care-and-quality-management/unit-2-authorizations` (Unit 2: Authorizations) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-5-care-and-quality-management/unit-3-medicare-advantage-procedures` (Unit 3: Medicare Advantage Procedures) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-5-care-and-quality-management/unit-4-behavioral-health` (Unit 4: Behavioral Health) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-5-care-and-quality-management/unit-5-denials-adverse-benefit-determinations-grievances-and-app` (Unit 5: Denials, Adverse Benefit Determinations, Grievances, and Appeals) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-5-care-and-quality-management/unit-6-quality-management` (Unit 6: Quality Management) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-5-care-and-quality-management/unit-7-value-based-reimbursement-programs` (Unit 7: Value-Based Reimbursement Programs) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-6-billing-and-payment/unit-1-general-claim-submission-guidelines` (Unit 1: General Claim Submission Guidelines) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-6-billing-and-payment/unit-2-electronic-claim-submission` (Unit 2: Electronic Claim Submission) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-6-billing-and-payment/unit-3-facility-ub048371-billing` (Unit 3: Facility (UB-04/8371) Billing) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-6-billing-and-payment/unit-4-professional-1500837p-reporting-tips` (Unit 4: Professional (1500/837P) Reporting Tips) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-6-billing-and-payment/unit-5-1500-claim-form-guidelines` (Unit 5: 1500 Claim Form Guidelines) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-6-billing-and-payment/unit-6-coordination-of-benefits` (Unit 6: Coordination of Benefits) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-6-billing-and-payment/unit-7-payment-eobs-remittances` (Unit 7: Payment/EOBs/Remittances) `manual` **To do** table
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-7-appendix` (Chapter 7 - Appendix) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-7-appendix/unit-1-medicare-advantage-member-evidence-of-coverage-booklets` (Unit 1: Medicare Advantage Member Evidence of Coverage Booklets) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-7-appendix/unit-2-medicare-advantage-compliance-language` (Unit 2: Medicare Advantage Compliance Language) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-7-appendix/unit-3-article-viii-of-the-bylaws-of-highmark-inc` (Unit 3: Article VIII of the Bylaws of Highmark Inc.) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-7-appendix/unit-4-review-committee-guidelines` (Unit 4: Review Committee Guidelines) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-7-appendix/unit-5-third-party-code-of-conduct` (Unit 5: Third Party Code of Conduct) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-7-appendix/unit-6-professional-regulations` (Unit 6: Professional Regulations) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-7-appendix/unit-7-medicare-advantage-supplemental-requirements` (Unit 7: Medicare Advantage Supplemental Requirements) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-7-appendix/unit-8-legal-information` (Unit 8: Legal Information) `manual` **To do**
- [ ] `/providers/resources-and-education/highmark-provider-manual/chapter-7-appendix/unit-9-disclaimer` (Unit 9: Disclaimer) `manual` **To do**

</details>

### P4: Communications Hub articles and archive lists (0/219)

Articles newest first, with their date and, where an article is for some regions only, those regions.

<details><summary>News and Updates articles (0/191)</summary>

- [ ] `/providers/communications-hub/news-and-updates/2027-risk-program-compensation-update` (2027 Risk Program Compensation Update) `article` **To do** 2026-09-22
- [ ] `/providers/communications-hub/news-and-updates/chip-reproductive-services-coverage-update` (CHIP Reproductive Services Coverage Update) `article` **To do** 2026-09-22; WPA/NEPA, CPA/SEPA
- [ ] `/providers/communications-hub/news-and-updates/genetic-molecular-lab-testing-to-require-authorization-in-ny` (Genetic/Molecular Lab Testing to Require Authorization in NY Starting Nov. 1) `article` **To do** 2026-09-22; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/changes-to-24-7-coverage-requirements-for-providers` (Changes to 24/7 Coverage Requirements for Providers) `article` **To do** 2026-09-21
- [ ] `/providers/communications-hub/news-and-updates/extra-support-for-your-patients-no-cost-brochures-posters-and-more` (Extra Support for Your Patients: No-Cost Brochures, Posters, and More) `article` **To do** 2026-09-15
- [ ] `/providers/communications-hub/news-and-updates/auth-submissions-temporarily-unavailable-via-availity-sept-18-21` (Auth Submissions Temporarily Unavailable via Availity Sept. 18-21) `article` **To do** 2026-09-11
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-august-2026` (New and Updated Reimbursement Policies – August 2026) `article` **To do** 2026-08-31
- [ ] `/providers/communications-hub/news-and-updates/healthhelp-transition-training-sign-up-prior-auth-code-list` (HealthHelp Transition: Training Sign-Up, Prior Auth Code List, and NY Update) `article` **To do** 2026-08-28
- [ ] `/providers/communications-hub/news-and-updates/are-you-eligible-for-high-performance-networks` (Are You Eligible for High-Performance Networks?) `article` **To do** 2026-08-27
- [ ] `/providers/communications-hub/news-and-updates/credentialing-update-transition-to-certify-continues` (Credentialing Update: Transition to CertifyOS Portal Continues) `article` **To do** 2026-08-27
- [ ] `/providers/communications-hub/news-and-updates/evolving-primary-care-reimbursement-in-2027-introducing-valueblu` (Evolving Primary Care Reimbursement in 2027: Introducing ValueBlue and ValueBlue Connect) `article` **To do** 2026-08-27; WPA/NEPA, CPA/SEPA, WV, WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/gold-card-fall-expansion-more-than-24,000-providers-now-in-the-program` (Gold Card Fall Expansion: More than 24,000 Providers Now in the Program) `article` **To do** 2026-08-27; WPA/NEPA, CPA/SEPA, DE, WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/medical-record-requests-for-other-blue-plans` (Medical Record Requests for Other Blue Plans) `article` **To do** 2026-08-27
- [ ] `/providers/communications-hub/news-and-updates/prior-authorization-changes-one-code-added-and-nine-removed` (Prior Authorization Changes: One Code Added and Nine Removed) `article` **To do** 2026-08-27
- [ ] `/providers/communications-hub/news-and-updates/claim-adjustment-requests-must-be-filed-within-15-months-of-original-claim-finalization-date` (Claim Adjustment Requests Must Be Filed Within 15 Months of Original Claim Finalization Date) `article` **To do** 2026-08-26
- [ ] `/providers/communications-hub/news-and-updates/is-your-provider-directory-information-still-accurate-` (Is Your Provider Directory Information Still Accurate?) `article` **To do** 2026-08-26
- [ ] `/providers/communications-hub/news-and-updates/make-the-switch-to-highmark-EDI-for-electronic-claims-by-sept-30` (Make the Switch to Highmark-EDI for Electronic Claims by Sept. 30) `article` **To do** 2026-08-26; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/authorization-enhancements-improving-search-experience-in-predictal` (Authorization Enhancements: Improving the Search Experience in Predictal) `article` **To do** 2026-08-25
- [ ] `/providers/communications-hub/news-and-updates/choice-blue-going-away-starting-jan-1-2027` (CPA: Choice Blue Going Away – Starting Jan. 1, 2027) `article` **To do** 2026-08-25; CPA/SEPA
- [ ] `/providers/communications-hub/news-and-updates/medically-unlikely-edits-logic-for-span-dated-claims-new-implementation-date` (Medically Unlikely Edits Logic for Span-Dated Claims – New Implementation Date) `article` **To do** 2026-08-25
- [ ] `/providers/communications-hub/news-and-updates/ny-providers-sign-and-return-updated-contracts-by-dec-1` (NY Providers: Sign and Return Updated Contracts by Dec. 1) `article` **To do** 2026-08-25; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/health-outcomes-survey-now-underway-for-ma-members` (Health Outcomes Survey Now Underway for MA Members) `article` **To do** 2026-08-24
- [ ] `/providers/communications-hub/news-and-updates/sepa-self-service-tools-required-for-claim-status-and-investigation` (SEPA: Self-Service Tools Required for Claim Status and Investigation – Starting Nov. 1) `article` **To do** 2026-08-24; CPA/SEPA
- [ ] `/providers/communications-hub/news-and-updates/standard-professional-fee-schedules-q3-2026-updates-now-available` (Standard Professional Fee Schedules: Q3 Updates Now Available) `article` **To do** 2026-08-19
- [ ] `/providers/communications-hub/news-and-updates/reimbursement-update-cpt-code-97153-for-aba-therapy-in-de-pa-wv` (Reimbursement Update: CPT Code 97153 for ABA Therapy in DE, PA, and WV) `article` **To do** 2026-08-17; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/new-claims-edit-patient-dob-validation-coming-january-2027` (New Claims Edit: Patient Date of Birth Validation Coming January 2027) `article` **To do** 2026-08-05
- [ ] `/providers/communications-hub/news-and-updates/narrow-network-claims-remittance-info-now-available` (Narrow Network Claims – Remittance Info Now Available for All Participating Providers) `article` **To do** 2026-08-04
- [ ] `/providers/communications-hub/news-and-updates/coding-alignment-for-prior-auth-processing-of-select-mids` (Technical Coding Alignment for Prior Auth Processing of Select MIDs) `article` **To do** 2026-07-27
- [ ] `/providers/communications-hub/news-and-updates/highmark-to-perform-hospital-opps-claim-reviews` (Highmark to Perform Hospital OPPS Claim Reviews) `article` **To do** 2026-07-27
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-july-2026` (New and Updated Reimbursement Policies – July 2026) `article` **To do** 2026-07-27
- [ ] `/providers/communications-hub/news-and-updates/practice-performance-insights-key-performance-metric-tool` (Introducing Practice Performance Insights: Key Performance Metric Tool) `article` **To do** 2026-07-27
- [ ] `/providers/communications-hub/news-and-updates/healthhelp-molecular-lab-prior-auth-training` (HealthHelp Transition: Sign Up for Molecular Lab Prior Auth Training) `article` **To do** 2026-07-24
- [ ] `/providers/communications-hub/news-and-updates/annual-phone-survey-to-verify-directory-information` (Annual Phone Survey to Verify Directory Information Will Occur in August) `article` **To do** 2026-07-23
- [ ] `/providers/communications-hub/news-and-updates/reimbursement-update-massage-therapy-cpt-code-97124` (Reimbursement Update: Massage Therapy CPT Code 97124) `article` **To do** 2026-07-23
- [ ] `/providers/communications-hub/news-and-updates/annual-chlamydia-screening-for-pa-chip-members-age-16-plus` (Annual Chlamydia Screening for PA CHIP Members Age 16+) `article` **To do** 2026-07-22; WPA/NEPA, CPA/SEPA
- [ ] `/providers/communications-hub/news-and-updates/best-coding-practices-migraines` (Best Coding Practices: Migraines) `article` **To do** 2026-07-22
- [ ] `/providers/communications-hub/news-and-updates/reminder-annual-medicare-compliance-training` (Reminder: Annual Medicare Compliance Training) `article` **To do** 2026-07-22
- [ ] `/providers/communications-hub/news-and-updates/bh-outpatient-update-electronic-auth-extensions-now-available` (BH Outpatient Update: Electronic Auth Extensions Now Available) `article` **To do** 2026-07-20
- [ ] `/providers/communications-hub/news-and-updates/organizational-providers-change-of-ownership-reminder` (Organizational Providers: Change of Ownership Reminder) `article` **To do** 2026-07-10
- [ ] `/providers/communications-hub/news-and-updates/medicare-glp-1-bridge-new-cms-program-for-certain-weight-loss-drugs` (Medicare GLP-1 Bridge: New CMS Program for Certain Weight-Loss Drugs) `article` **To do** 2026-07-07
- [ ] `/providers/communications-hub/news-and-updates/procedure-code-update-outpatient-surgery-site-of-care-medical-policies` (Procedure Code Update: Outpatient Surgery Site of Care Medical Policies) `article` **To do** 2026-07-07; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/maternity-billing-changes-for-2027` (Maternity Billing Changes for 2027) `article` **To do** 2026-07-01
- [ ] `/providers/communications-hub/news-and-updates/issue-identified-bluecard-claim-status-not-available-in-availity` (Issue Resolved: BlueCard Claim Status Now Available in Availity) `article` **To do** 2026-06-29
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-june-2026` (New and Updated Reimbursement Policies – June 2026) `article` **To do** 2026-06-29
- [ ] `/providers/communications-hub/news-and-updates/new-name-for-enhanced-community-care-management-program` (New Name for Enhanced Community Care Management Program) `article` **To do** 2026-06-29; WPA/NEPA, CPA/SEPA, DE
- [ ] `/providers/communications-hub/news-and-updates/best-coding-practices-major-depressive-disorder` (Best Coding Practices: Major Depressive Disorder) `article` **To do** 2026-06-25
- [ ] `/providers/communications-hub/news-and-updates/healthhelp-to-manage-molecular-lab-prior-authorization` (HealthHelp to Manage Molecular Lab Prior Authorization) `article` **To do** 2026-06-25
- [ ] `/providers/communications-hub/news-and-updates/mid-year-preventive-schedule-update-meb-screening-and-rsv-vaccine` (Mid-Year Preventive Schedule Update: MEB Screening and RSV Vaccine) `article` **To do** 2026-06-25
- [ ] `/providers/communications-hub/news-and-updates/prevent-claim-denials-ny-providers-must-transition-to-highmark-edi` (Prevent Claim Denials: NY Providers Must Transition to Highmark-EDI by Sept. 30) `article` **To do** 2026-06-25; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/pricing-calculated-to-five-decimal-points-for-certain-drug-codes` (Pricing Calculated to Five Decimal Points for Certain Drug Codes) `article` **To do** 2026-06-25
- [ ] `/providers/communications-hub/news-and-updates/two-midnight-rule-faq-document` (Two-Midnight Rule: New FAQ Document Offers Greater Clarity for MA Organizations) `article` **To do** 2026-06-23
- [ ] `/providers/communications-hub/news-and-updates/expanded-list-of-non-specific-codes-subject-to-additional-review` (Update: Expanded List of Non-Specific Codes Subject to Additional Review) `article` **To do** 2026-06-12
- [ ] `/providers/communications-hub/news-and-updates/highmark-seeking-members-for-medical-review-committee-2027-2028` (Medical Review Committee 2027-28: Application Deadline Extended) `article` **To do** 2026-06-09; WPA/NEPA, CPA/SEPA
- [ ] `/providers/communications-hub/news-and-updates/standard-professional-fee-schedules-q2-updates-de-pa-wv` (Standard Professional Fee Schedules: Q2 Updates Now Available for DE, PA, and WV) `article` **To do** 2026-06-03; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/highmark-s-telehealth-policy-will-be-updated-on-sept-1` (Highmark’s Telehealth Policy Will Be Updated on Sept 1) `article` **To do** 2026-05-26
- [ ] `/providers/communications-hub/news-and-updates/how-to-obtain-credentialing-with-highmark-using-the-certifyos-pl` (How to Obtain Credentialing with Highmark Using the CertifyOS Platform) `article` **To do** 2026-05-26; DE
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-may-2026` (New and Updated Reimbursement Policies – May 2026) `article` **To do** 2026-05-26
- [ ] `/providers/communications-hub/news-and-updates/corrected-claims-must-be-filed-within-15-months-of-original-claim` (Updated: Corrected Claims Must Be Filed Within 15 Months of Original Claim Finalization Date) `article` **To do** 2026-05-21; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/avoid-this-error-when-submitting-msk-authorization-requests` (Avoid This Error When Submitting MSK Authorization Requests) `article` **To do** 2026-05-19
- [ ] `/providers/communications-hub/news-and-updates/prior-authorization-updates-two-additions-and-90-removals` (Prior Authorization Updates: Two Additions and 90+ Removals) `article` **To do** 2026-05-19
- [ ] `/providers/communications-hub/news-and-updates/evolent-oncology-auth-submissions-managing-the-new-process` (Evolent Oncology Auth Submissions: Managing the New Process) `article` **To do** 2026-05-15
- [ ] `/providers/communications-hub/news-and-updates/medical-injectable-drug-crysvita-to-require-prior-authorization` (Medical Injectable Drug Crysvita to Require Prior Authorization) `article` **To do** 2026-05-14
- [ ] `/providers/communications-hub/news-and-updates/ny-corrected-claims-must-be-filed-within-15-months-of-original-claim` (Updated: Corrected Claims in New York Must Be Filed Within 15 Months of Original Claim Finalization Date) `article` **To do** 2026-05-13; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/risk-adjustment-importance-of-hcc-gap-closures` (Risk Adjustment: Importance of HCC Gap Closures) `article` **To do** 2026-05-11
- [ ] `/providers/communications-hub/news-and-updates/case-management-referrals-caring-for-members-with-complex-conditions` (Case Management Referrals: Caring for Members with Complex Conditions) `article` **To do** 2026-05-07
- [ ] `/providers/communications-hub/news-and-updates/standard-professional-fee-schedules-new-york-q2-updates-now-available` (Standard Professional Fee Schedules: New York Q2 Updates Now Available) `article` **To do** 2026-05-06; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/issue-identified-and-corrected-psychotherapy-procedure-code-90834` (Issue Identified and Corrected: Psychotherapy Procedure Code 90834) `article` **To do** 2026-05-01
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-april-2026` (New and Updated Reimbursement Policies – April 2026) `article` **To do** 2026-04-27
- [ ] `/providers/communications-hub/news-and-updates/upcoming-fee-schedule-changes-including-highmarks-annual-adjustment` (Upcoming Fee Schedule Changes, Including Highmark’s Annual Adjustment) `article` **To do** 2026-04-27
- [ ] `/providers/communications-hub/news-and-updates/evolent-transition-sign-up-for-oncology-prior-auth-training` (Evolent Transition: Sign Up for Oncology Prior Auth Training) `article` **To do** 2026-04-24
- [ ] `/providers/communications-hub/news-and-updates/latest-edition-of-mcg-care-guidelines` (Latest Edition of MCG Care Guidelines) `article` **To do** 2026-04-24
- [ ] `/providers/communications-hub/news-and-updates/retrospective-auth-requests-must-be-submitted-within-two-years` (Retrospective Auth Requests Must Be Submitted Within Two Years) `article` **To do** 2026-04-24
- [ ] `/providers/communications-hub/news-and-updates/quality-program-information-for-2026` (Quality Program Information for 2026) `article` **To do** 2026-04-23
- [ ] `/providers/communications-hub/news-and-updates/follow-proper-procedures-for-paper-claims` (Follow Proper Procedures for Paper Claims; Noncompliant Forms Will Be Returned) `article` **To do** 2026-04-22; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/member-id-card-update-suitcase-icon-moving-on` (Member ID Card Update: Suitcase Icon Moving On) `article` **To do** 2026-04-22
- [ ] `/providers/communications-hub/news-and-updates/population-health-improving-member-care` (Population Health: Improving Member Care) `article` **To do** 2026-04-22
- [ ] `/providers/communications-hub/news-and-updates/issue-identified-and-corrected-telehealth-claims-with-code-w5604` (Issue Identified and Corrected: Telehealth Claims with Code W5604) `article` **To do** 2026-04-21
- [ ] `/providers/communications-hub/news-and-updates/msk-authorization-transition-your-questions-answered` (MSK Authorization Transition on May 1; Your Questions Answered) `article` **To do** 2026-04-17; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/predictal-manage-your-pre-auth-notification-contact-details` (New Functionality in Predictal: Manage Your Pre-Auth Notification Contact Details) `article` **To do** 2026-04-16
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-march-2026` (New and Updated Reimbursement Policies – March 2026) `article` **To do** 2026-03-30
- [ ] `/providers/communications-hub/news-and-updates/new-audit-requirements-for-million-dollar-claims` (New Audit Requirements for Million-Dollar Claims) `article` **To do** 2026-03-30
- [ ] `/providers/communications-hub/news-and-updates/reimbursement-policy-changes-for-billing-of-skin-substitutes` (Reimbursement Policy Changes for Billing of Skin Substitutes) `article` **To do** 2026-03-30
- [ ] `/providers/communications-hub/news-and-updates/msk-codes-being-added-to-site-of-care-policy-may-1` (MSK Codes Being Added to Site of Care Policy on May 1) `article` **To do** 2026-03-25; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/provider-chat-expands-to-delaware-and-new-york` (Provider Chat Expands to Delaware and New York) `article` **To do** 2026-03-25; DE, WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/fast-easy-and-secure-submit-claim-attachments-electronically` (Fast, Easy, and Secure: Submit Claim Attachments Electronically) `article` **To do** 2026-03-24
- [ ] `/providers/communications-hub/news-and-updates/population-health-management` (Population Health Management – Helping Members Achieve Better Health) `article` **To do** 2026-03-24
- [ ] `/providers/communications-hub/news-and-updates/reminder-register-for-evolent-oncology-prior-authorization-training` (Reminder: Register For Evolent Oncology Prior Authorization Training) `article` **To do** 2026-03-24
- [ ] `/providers/communications-hub/news-and-updates/2026-true-performance-quality-incentive-threshold-changes` (2026 True Performance Quality Incentive Threshold Changes) `article` **To do** 2026-03-17; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/highmark-inc-and-blue-kc-receive-regulatory-approval-for-affilia` (Highmark Inc. and Blue KC Receive Regulatory Approval for Affiliation) `article` **To do** 2026-03-17
- [ ] `/providers/communications-hub/news-and-updates/standard-professional-fee-schedules-q1-updates-now-available-de-pa-wv` (Standard Professional Fee Schedules: Q1 Updates Now Available for DE, PA, and WV) `article` **To do** 2026-03-11; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/highmark-reminders-utilization-review-patient-notification-and-more` (Important Highmark Reminders: Utilization Review, Patient Notification, and More) `article` **To do** 2026-03-04
- [ ] `/providers/communications-hub/news-and-updates/how-to-credential-with-highmark-using-the-certify-platform` (Delayed: Rollout of Certify Platform for Credentialing on Hold) `article` **To do** 2026-02-27; DE
- [ ] `/providers/communications-hub/news-and-updates/standard-professional-fee-schedules-new-york-q1-updates-now-available` (Standard Professional Fee Schedules: New York Q1 Updates Now Available) `article` **To do** 2026-02-26; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/msk-authorization-will-transition-from-evicore-to-highmark` (MSK Authorization Will Transition from eviCore to Highmark on May 1, 2026) `article` **To do** 2026-02-23; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-february-2026` (New and Updated Reimbursement Policies – February 2026) `article` **To do** 2026-02-23
- [ ] `/providers/communications-hub/news-and-updates/new-guide-answers-auth-related-questions` (Simplifying Authorizations: A New Guide Answers Your Auth-Related Questions) `article` **To do** 2026-02-23
- [ ] `/providers/communications-hub/news-and-updates/prior-authorization-changes-to-oncology-related-codes` (Prior Authorization Changes to Oncology-related Codes) `article` **To do** 2026-02-23
- [ ] `/providers/communications-hub/news-and-updates/2026-gold-card-spring-expansion` (2026 Gold Card Spring Expansion: Streamlining Prior Authorizations for Providers) `article` **To do** 2026-02-18; WPA/NEPA, CPA/SEPA, DE, WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/expanding-care-for-members-with-substance-use-disorder` (Expanding Care for Members with Substance Use Disorder) `article` **To do** 2026-02-18
- [ ] `/providers/communications-hub/news-and-updates/annual-hedis-medical-record-reviews-to-begin-this-month` (Annual HEDIS® Medical Record Reviews to Begin This Month) `article` **To do** 2026-02-17
- [ ] `/providers/communications-hub/news-and-updates/coding-corner-understanding-external-cause-codes` (Coding Corner: Understanding External Cause Codes) `article` **To do** 2026-02-17
- [ ] `/providers/communications-hub/news-and-updates/colorectal-cancer-screening-proper-billing-tips` (Colorectal Cancer Screening: Proper Billing Tips) `article` **To do** 2026-02-17
- [ ] `/providers/communications-hub/news-and-updates/low-acuity-non-emergent-professional-claim-review` (Update: Low Acuity Non-Emergent Professional Claim Review) `article` **To do** 2026-02-17
- [ ] `/providers/communications-hub/news-and-updates/need-some-claims-guidance-check-out-these-recent-articles` (Need Some Claims Guidance? Check Out These Recent Articles) `article` **To do** 2026-02-17
- [ ] `/providers/communications-hub/news-and-updates/issue-identified-some-auth-requests-for-evicore-managed-services` (Issue Resolved: Authorization Requests for eviCore-Managed Services Are Correctly Processing) `article` **To do** 2026-01-30; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/update-true-performance-home-health-program` (Update: True Performance Home Health Program) `article` **To do** 2026-01-30; WPA/NEPA, CPA/SEPA
- [ ] `/providers/communications-hub/news-and-updates/evolent-to-manage-oncology-prior-authorization-review` (Evolent to Manage Oncology Prior Authorization Review) `article` **To do** 2026-01-26
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-january-2026` (New and Updated Reimbursement Policies – January 2026) `article` **To do** 2026-01-26
- [ ] `/providers/communications-hub/news-and-updates/highmark-now-accepting-275-claim-attachments-via-edi` (Highmark Now Accepting 275 Claim Attachments via EDI) `article` **To do** 2026-01-23
- [ ] `/providers/communications-hub/news-and-updates/provider-chat-expands-to-west-virginia` (Provider Chat Expands to West Virginia) `article` **To do** 2026-01-23; WV
- [ ] `/providers/communications-hub/news-and-updates/provider-chat-is-auth-required-tool-now-available` (Provider Chat: “Is Auth Required?” Tool Now Available) `article` **To do** 2026-01-23; WPA/NEPA, CPA/SEPA
- [ ] `/providers/communications-hub/news-and-updates/2026-update-to-highmarks-preventive-schedule-and-preventive-heal` (2026 Update to Highmark’s Preventive Schedule and Preventive Health Guidelines) `article` **To do** 2026-01-22
- [ ] `/providers/communications-hub/news-and-updates/provider-training-orientation-webinar-self-service-tools-resourc` (Provider Training: Orientation Webinar, Self-Service Tools, and Availity Resources) `article` **To do** 2026-01-22
- [ ] `/providers/communications-hub/news-and-updates/third-party-administrator-plans-customer-service-inquiries-` (Third-Party Administrator Plans: Customer Service Inquiries) `article` **To do** 2026-01-22
- [ ] `/providers/communications-hub/news-and-updates/two-imaging-codes-to-be-removed-from-prior-auth-list` (Two Imaging Codes to Be Removed from Prior Auth List; No Longer Separately Reimbursable) `article` **To do** 2026-01-22
- [ ] `/providers/communications-hub/news-and-updates/delaware-mandate-allergenic-protein-dietary-supplement-coverage` (Delaware Mandate – Allergenic Protein Dietary Supplement Coverage) `article` **To do** 2026-01-21; DE
- [ ] `/providers/communications-hub/news-and-updates/ensuring-quality-your-role-in-timely-medical-record-submission` (Ensuring Quality: Your Role in Timely Medical Record Submission) `article` **To do** 2026-01-21
- [ ] `/providers/communications-hub/news-and-updates/medically-unlikely-edits-providers-must-bill-for-individual-date` (Medically Unlikely Edits: Providers Must Bill for Individual Dates, Instead of Span Dating) `article` **To do** 2026-01-21
- [ ] `/providers/communications-hub/news-and-updates/preventive-lung-cancer-screening-coding` (Preventive Lung Cancer Screening Coding) `article` **To do** 2026-01-21
- [ ] `/providers/communications-hub/news-and-updates/tips-for-verifying-facility-pricing-part-ii--when-claims-are-den` (Tips for Verifying Facility Pricing Part II: When Claims Are Denied) `article` **To do** 2026-01-21
- [ ] `/providers/communications-hub/news-and-updates/update-outpatient-surgery-site-of-care-medical-policies` (Update: Outpatient Surgery Site of Care Medical Policies) `article` **To do** 2026-01-13; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/issue-resolved-technical-issue-affecting-highmark-electronic-aut` (Issue Resolved: Technical Issue Affecting Highmark Electronic Authorization Submission) `article` **To do** 2026-01-08
- [ ] `/providers/communications-hub/news-and-updates/chapter-57-mandate-highmark-billing-guidance-for-eligible-member` (Chapter 57 Mandate – Highmark Billing Guidance for Eligible Members) `article` **To do** 2025-12-29; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/reminder-for-drug-wastage-claims-use-modifiers-jw-and-jz` (Reminder: For Drug Wastage Claims, Use Modifiers JW and JZ — It’s Required!) `article` **To do** 2025-12-29
- [ ] `/providers/communications-hub/news-and-updates/updated--new-availity-functionality-for-high-volume-claim-issue-` (Updated: New Availity Functionality for High Volume Claim Issue Inquiry) `article` **To do** 2025-12-29
- [ ] `/providers/communications-hub/news-and-updates/post-acute-care-management-authorization-process-changing` (Post-Acute Care Management: Authorization Process Changing) `article` **To do** 2025-12-22; WPA/NEPA, CPA/SEPA, WV
- [ ] `/providers/communications-hub/news-and-updates/acupuncturist-credentialing-and-eligibility-updates-for-ma` (Acupuncturist Credentialing and Eligibility Updates for MA Participation) `article` **To do** 2025-12-19
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-december-2025` (New and Updated Reimbursement Policies – December 2025) `article` **To do** 2025-12-19
- [ ] `/providers/communications-hub/news-and-updates/reminder-changes-occurring-in-2026` (Reminder: Changes Coming in 2026) `article` **To do** 2025-12-19
- [ ] `/providers/communications-hub/news-and-updates/thank-you-for-your-care-and-commitment-` (Thank You for Your Care and Commitment) `article` **To do** 2025-12-18
- [ ] `/providers/communications-hub/news-and-updates/important-highmark-bluecard-executive-for-provider-mdl-settlemen` (Important: Highmark BlueCard Executive for Provider MDL Settlement Class) `article` **To do** 2025-12-17
- [ ] `/providers/communications-hub/news-and-updates/changes-to-payment-remittances-and-electronic-claims` (NY Claims Submission and Payment Changes in 2026) `article` **To do** 2025-12-16; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/checklist-for-the-new-year-verify-your-networks-starting-jan-1` (Checklist for the New Year: Verify Your Networks Starting Jan. 1) `article` **To do** 2025-12-16
- [ ] `/providers/communications-hub/news-and-updates/clinical-solutions-for-2026-noom-sud-specialty-care-additional-offerings` (Clinical Solutions for 2026: Noom, SUD Specialty Care, and Additional Offerings) `article` **To do** 2025-12-16
- [ ] `/providers/communications-hub/news-and-updates/delaware-abortion-coverage-mandate` (Delaware Abortion Coverage Mandate) `article` **To do** 2025-12-16; DE
- [ ] `/providers/communications-hub/news-and-updates/tips-for-verifying-pricing-on-facility-claims` (Tips for Verifying Pricing on Facility Claims) `article` **To do** 2025-12-16
- [ ] `/providers/communications-hub/news-and-updates/highmark-inc--and-blue-kc-announce-affiliation-agreement` (Highmark Inc. and Blue KC Announce Affiliation Agreement) `article` **To do** 2025-12-11
- [ ] `/providers/communications-hub/news-and-updates/new-york-state-s-end-the-epidemic-hiv-aids-plan-and-prep-guideli` (New York State’s End the Epidemic - HIV/AIDS Plan and PrEP Guidelines) `article` **To do** 2025-12-11; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/rich-products-members-will-have-access-to-highmark-ppoblue-provi` (Rich Products Members Will Have Access to Highmark PPOBlue Provider Network) `article` **To do** 2025-12-11
- [ ] `/providers/communications-hub/news-and-updates/express-scripts-will-no-longer-fill-prescriptions-written` (Express Scripts Will No Longer Fill Prescriptions Written for Less Than a 35-Day Supply) `article` **To do** 2025-12-08
- [ ] `/providers/communications-hub/news-and-updates/prior-authorization-submission-help` (Prior Authorization Submission Help and Tips) `article` **To do** 2025-12-05
- [ ] `/providers/communications-hub/news-and-updates/medical-injectable-drug-claims--the-correct-ndc-appears-on-the-p` (Medical Injectable Drug Claims: The Correct NDC Appears on the Package or Carton, NOT on the Vial) `article` **To do** 2025-12-03
- [ ] `/providers/communications-hub/news-and-updates/2025-covid-vaccine-administration-update-medicare-and-commercial` (2025 COVID Vaccine Administration Update: Medicare and Commercial) `article` **To do** 2025-11-24
- [ ] `/providers/communications-hub/news-and-updates/behavioral-health-upcoming-prior-authorization-changes` (Behavioral Health: Upcoming Prior Authorization Changes) `article` **To do** 2025-11-24
- [ ] `/providers/communications-hub/news-and-updates/cultural-and-language-resources-on-the-prc` (Cultural and Language Resources on the PRC) `article` **To do** 2025-11-24
- [ ] `/providers/communications-hub/news-and-updates/fep-update-select-medications-to-require-prior-authorization` (FEP Update: Select Medications to Require Prior Authorization) `article` **To do** 2025-11-24
- [ ] `/providers/communications-hub/news-and-updates/highmarks-new-communications-hub` (Highmark’s New Communications Hub) `article` **To do** 2025-11-24
- [ ] `/providers/communications-hub/news-and-updates/holiday-loneliness-and-stress-supporting-patients-with-mental-we` (Holiday Loneliness and Stress: Supporting Patients with Mental Well-Being) `article` **To do** 2025-11-24
- [ ] `/providers/communications-hub/news-and-updates/is-your-promise-id-up-to-date-` (Is Your PROMISe ID Up to Date?) `article` **To do** 2025-11-24; WPA/NEPA, CPA/SEPA
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-november-2025` (New and Updated Reimbursement Policies – November 2025) `article` **To do** 2025-11-24
- [ ] `/providers/communications-hub/news-and-updates/new-kidney-health-support-coming-to-new-york-in-2026` (New Kidney Health Support Coming to New York in 2026) `article` **To do** 2025-11-24
- [ ] `/providers/communications-hub/news-and-updates/provider-chat-update-24-7-auth-status-check-is-now-live` (Provider Chat Update: 24/7 Auth Status Check Is Now Live) `article` **To do** 2025-11-24; WPA/NEPA, CPA/SEPA
- [ ] `/providers/communications-hub/news-and-updates/provider-news-update-new-year-brings-new-email-address` (Provider News Update: New Year Brings New Email Address) `article` **To do** 2025-11-24
- [ ] `/providers/communications-hub/news-and-updates/provider-service-center-updates-credentialing-information-and-sc` (Provider Service Center Updates: Credentialing Information and Scheduling Change) `article` **To do** 2025-11-24; WPA/NEPA, CPA/SEPA, WV, WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/reminder-updated-workflow-for-initial-medical-authorization-requests` (Reminder: Updated Workflow for Initial Medical Authorization Requests) `article` **To do** 2025-11-24
- [ ] `/providers/communications-hub/news-and-updates/update-to-the-standard-professional-fee-schedule-for-commercial` (Update to the Standard Professional Fee Schedule for Commercial) `article` **To do** 2025-11-24; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/vbr-news-will-soon-have-a-new-home` (VBR News Will Soon Have a New Home) `article` **To do** 2025-11-24
- [ ] `/providers/communications-hub/news-and-updates/reminder-covid-19-vaccinations-are-covered-for-chip-enrollees` (Reminder: COVID-19 Vaccinations are Covered for CHIP Enrollees) `article` **To do** 2025-11-13; WPA/NEPA, CPA/SEPA
- [ ] `/providers/communications-hub/news-and-updates/2026-medicare-advantage-formulary-updates` (2026 Medicare Advantage Formulary Updates) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/changes-to-highmark-insurance-programs-in-2026` (Changes to Highmark Insurance Programs in 2026) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/delaware-doula-services-mandate` (Delaware Doula Services Mandate) `article` **To do** 2025-10-27; DE
- [ ] `/providers/communications-hub/news-and-updates/hedis-help-detailed-information-on-47-measures` (HEDIS Help: Detailed Information on 47 Measures) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/introducing-copaygo` (Introducing CopayGo: Highmark's New Tiered Copay Plan for ASO Large Group Accounts) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/ma-prescription-coverage-update-humira-stelara-not-preferred-2026` (MA Prescription Coverage Update: Humira and Stelara Will Not Be Preferred in 2026) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-october-2025` (New and Updated Reimbursement Policies – October 2025) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/new-fertility-and-family-building-benefit` (New Fertility and Family Building Benefit) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/prior-authorization-changes-occurring-in-the-new-year` (Prior Authorization Changes Occurring in the New Year) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/risk-adjustment-programs-new-compensation-model-for-2026` (Risk Adjustment Programs: New Compensation Model for 2026) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/some-preferred-diabetic-suppliers-changing-for-ma-members-2026` (Some Preferred Diabetic Suppliers are Changing for MA Members in 2026) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/survey-says-how-cahps-can-help-improve-the-patient-experience` (Survey Says: How CAHPS Can Help Improve the Patient Experience) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/we-are-listening-streamlining-credentialing-for-a-better-experience` (We’re Listening: Streamlining Credentialing for a Better Experience) `article` **To do** 2025-10-27
- [ ] `/providers/communications-hub/news-and-updates/important-update-regarding-medicare-telehealth-coverage` (Important Update Regarding Medicare Telehealth Coverage) `article` **To do** 2025-10-24
- [ ] `/providers/communications-hub/news-and-updates/help-us-create-a-truly-remarkable-health-experience` (Help Us Create a Truly Remarkable Health Experience and Make Your Voice Heard!) `article` **To do** 2025-10-14
- [ ] `/providers/communications-hub/news-and-updates/2025-gold-card-fall-expansion--streamlining-prior-authorizations` (2025 Gold Card Fall Expansion: Streamlining Prior Authorizations for Providers) `article` **To do** 2025-09-29; WPA/NEPA, CPA/SEPA, DE, WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/2026-risk-adjustment-program-update-` (2026 Risk Adjustment Program Update) `article` **To do** 2025-09-29; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/additional-drugs-designated-as-voluntary-for-highmark-s-medical-` (Additional Drugs Designated as Voluntary for Highmark’s Medical Injectable Drug Program) `article` **To do** 2025-09-29
- [ ] `/providers/communications-hub/news-and-updates/breast-cancer-awareness-month--tips-for-rescheduling-patients-be` (Breast Cancer Awareness Month: Tips for Rescheduling Patients before January) `article` **To do** 2025-09-29
- [ ] `/providers/communications-hub/news-and-updates/combatting-childhood-obesity--how-highmark-is-helping-parents-an` (Combatting Childhood Obesity: How Highmark is Helping Parents and Providers) `article` **To do** 2025-09-29
- [ ] `/providers/communications-hub/news-and-updates/how-to-credential-with-highmark-using-the-certify-platform-` (How to Credential with Highmark Using the Certify Platform) `article` **To do** 2025-09-29; WPA/NEPA, CPA/SEPA, WV, WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/important-claim-updates-for-new-york-providers-` (Important Claim Updates for New York Providers) `article` **To do** 2025-09-29; WNY, NENY
- [ ] `/providers/communications-hub/news-and-updates/medicare-advantage-network-updates--what-providers-need-to-know-` (Medicare Advantage Network Updates: What Providers Need to Know) `article` **To do** 2025-09-29
- [ ] `/providers/communications-hub/news-and-updates/medicare-part-b-claim-changes-effective-jan--1--2026` (Medicare Part B Claim Changes Effective Jan. 1, 2026) `article` **To do** 2025-09-29
- [ ] `/providers/communications-hub/news-and-updates/navigating-digital-member-id-cards-` (Navigating Digital Member ID Cards) `article` **To do** 2025-09-29
- [ ] `/providers/communications-hub/news-and-updates/new-and-updated-reimbursement-policies-september-2025` (New and Updated Reimbursement Policies – September 2025) `article` **To do** 2025-09-29
- [ ] `/providers/communications-hub/news-and-updates/new-wv-law-allows-optometrists-to-perform-laser-surgery-` (New WV Law Allows Optometrists to Perform Laser Surgery) `article` **To do** 2025-09-29; WV
- [ ] `/providers/communications-hub/news-and-updates/radcard-authorization-moving-from-evicore-to-highmark-` (RadCard Authorization Moving from eviCore to Highmark) `article` **To do** 2025-09-29; WPA/NEPA, CPA/SEPA, DE, WV
- [ ] `/providers/communications-hub/news-and-updates/rx-processing-changes-for-three-drugs-effective-jan--1--2026-` (Rx Processing Changes for Three Drugs Effective Jan. 1, 2026) `article` **To do** 2025-09-29
- [ ] `/providers/communications-hub/news-and-updates/snf-billing-change--patient-driven-payment-model-to-replace-rugs` (SNF Billing Change: Patient-Driven Payment Model to Replace RUGs on Oct. 1) `article` **To do** 2025-09-29; WPA/NEPA, CPA/SEPA
- [ ] `/providers/communications-hub/news-and-updates/upcoming-site-of-care-program-impacts-certain-outpatient-surgeri` (Upcoming Site of Care Program Impacts Certain Outpatient Surgeries) `article` **To do** 2025-09-29
- [ ] `/providers/communications-hub/news-and-updates/update-to-highmark-s-medicare-advantage-professional-physician-o` (Update to Highmark’s Medicare Advantage Professional Physician Office Laboratory Fee Schedule) `article` **To do** 2025-09-29
- [ ] `/providers/communications-hub/news-and-updates/bcbsa-provider-settlement` (BCBSA Provider Settlement) `article` **To do** 2025-09-23

</details>

<details><summary>Provider News newsletters (0/7)</summary>

- [ ] `/providers/communications-hub/provider-news/june-2026-newsletter` (June 2026 Newsletter) `article` **To do** 2026-06-29
- [ ] `/providers/communications-hub/provider-news/may-2026-newsletter` (May 2026 Newsletter) `article` **To do** 2026-05-26
- [ ] `/providers/communications-hub/provider-news/april-2026-newsletter` (April 2026 Newsletter) `article` **To do** 2026-04-27
- [ ] `/providers/communications-hub/provider-news/march-2026-newsletter` (March 2026 Newsletter) `article` **To do** 2026-03-30
- [ ] `/providers/communications-hub/provider-news/february-2026-newsletter` (February 2026 Newsletter) `article` **To do** 2026-02-23
- [ ] `/providers/communications-hub/provider-news/january-2026-newsletter` (January 2026 Newsletter) `article` **To do** 2026-01-26
- [ ] `/providers/communications-hub/provider-news/december-2025-newsletter` (December 2025 Newsletter) `article` **To do** 2025-12-22

</details>

<details><summary>News archive lists (0/21)</summary>

- [ ] `/providers/communications-hub/news-archive/formulary-updates-archive` (Formulary Updates Archive) `content` **To do**
- [ ] `/providers/communications-hub/news-archive/medical-policy-update-hbcbsde` (Medical Policy Update DE) `document-list` **To do** DE; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/medical-policy-update-hbcbspa` (Medical Policy Update WPA) `document-list` **To do** WPA/NEPA; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/medical-policy-update-hbcbswny` (Medical Policy Update HBCBSWNY) `document-list` **To do** WNY; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/medical-policy-update-hbcbswv` (Medical Policy Update WV) `document-list` **To do** WV; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/medical-policy-update-hbsneny` (Medical Policy Update HBSNENY) `document-list` **To do** NENY; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/medical-policy-update-hbspa` (Medical Policy Update HBSPA) `document-list` **To do** CPA/SEPA; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/provider-news-hbcbsde` (Provider News HBCBSDE) `document-list` **To do** DE; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/provider-news-hbcbspa` (Provider News HBCBSPA) `document-list` **To do** WPA/NEPA; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/provider-news-hbcbswny` (Provider News WNY) `document-list` **To do** WNY; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/provider-news-hbcbswv` (Provider News WV) `document-list` **To do** WV; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/provider-news-hbsneny` (Provider News NENY) `document-list` **To do** NENY; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/provider-news-hbspa` (Provider News) `document-list` **To do** CPA/SEPA; 17 PDFs
- [ ] `/providers/communications-hub/news-archive/special-bulletin-hbcbsde` (Special Bulletin HBCBSDE) `document-list` **To do** DE; 69 PDFs
- [ ] `/providers/communications-hub/news-archive/special-bulletins-hbcbspa` (Special Bulletins HBCBSPA) `document-list` **To do** WPA/NEPA; 75 PDFs
- [ ] `/providers/communications-hub/news-archive/special-bulletins-hbcbspa/authorization-changes-postponed-for-msk-procedures` (Authorization Changes Postponed for MSK Procedures, Molecular and Genomic Testing, and Radiation Services) `empty` **To do** WPA/NEPA
- [ ] `/providers/communications-hub/news-archive/special-bulletins-hbcbswny` (Special Bulletins HBCBSWNY) `document-list` **To do** WNY; 70 PDFs
- [ ] `/providers/communications-hub/news-archive/special-bulletins-hbcbswny/authorization-changes-postponed-for-msk-procedures` (Authorization Changes Postponed for MSK Procedures, Molecular and Genomic Testing, and Radiation Services) `empty` **To do**
- [ ] `/providers/communications-hub/news-archive/special-bulletins-hbcbswv` (Special Bulletins HBCBSWV) `document-list` **To do** WV; 68 PDFs
- [ ] `/providers/communications-hub/news-archive/special-bulletins-hbsneny` (Special Bulletins HBSNENY) `document-list` **To do** NENY; 67 PDFs
- [ ] `/providers/communications-hub/news-archive/special-bulletins-hbspa` (Special Bulletins) `document-list` **To do** CPA/SEPA; 77 PDFs

</details>

### Staying on providers.highmark.com (45)

Not migrated, by decision (2026-10-07). Our links to them go to the source.

- `/404` (404) this site has its own 404 page
- `/communications-hub/join-our-mailing-list` (Join Our Mailing List) the mailing-list form (`/bin/prc/sfmc`, reCAPTCHA); the header and hub link to the source
- `/communications-hub/join-our-mailing-list/error` (Error) the confirmation page of a source form
- `/communications-hub/join-our-mailing-list/thank-you` (Thank You) the confirmation page of a source form
- `/join-our-mailing-list` (Join Our Mailing List) the mailing-list form (`/bin/prc/sfmc`, reCAPTCHA); the header and hub link to the source
- `/join-our-mailing-list/error` (Error) the confirmation page of a source form
- `/join-our-mailing-list/thank-you` (Thank You) the confirmation page of a source form
- `/resources-and-education/clinical-quality-education/educational-resources-member-provider/inventory-request-form/error` (Error) the confirmation page of a source form
- `/resources-and-education/clinical-quality-education/educational-resources-member-provider/inventory-request-form/thank-you` (Thank You) the confirmation page of a source form
- `/search-results` (Search Results) the provider header's search box submits here

<details><summary>Behind the Availity login (35)</summary>

Each redirects to the Availity login on the source. The menu marks them with a lock and links to the source page.

- `/claims/reimbursement-programs`
- `/claims/reimbursement-resources/billing-highlights-for-facilities`
- `/claims/reimbursement-resources/fee-schedule-information`
- `/claims/reimbursement-resources/inpatient-facility-diagnosis-guidelines`
- `/claims/reimbursement-resources/lab-exempt-codes`
- `/claims/reimbursement-resources/lab-exempt-codes/lab-exempt-codes-general-all-physicians`
- `/claims/reimbursement-resources/lab-exempt-codes/lab-exempt-codes-outpatient-facility`
- `/claims/reimbursement-resources/lab-exempt-codes/lab-exempt-codes-speciality`
- `/claims/reimbursement-resources/lab-exempt-codes/lab-exempt-codes-surgical-pathology`
- `/claims/reimbursement-resources/medically-unlikely-edit-update-schedule`
- `/claims/reimbursement-resources/physical-therapy-occupational-therapy-and-chiropractic-daily-bundle-maximum`
- `/claims/value-based-reimbursement-programs-overview/best-practice/best-practice-capitated-code-list`
- `/claims/value-based-reimbursement-programs-overview/best-practice/best-practice-reimbursement`
- `/claims/value-based-reimbursement-programs-overview/quality-blue-hospital-program`
- `/claims/value-based-reimbursement-programs-overview/specialist-performance-initiative`
- `/claims/value-based-reimbursement-programs-overview/true-performance-programs-overview`
- `/claims/value-based-reimbursement-programs-overview/true-performance-programs-overview/true-performance-home-health-episodic-bundled-value-based-payment-program`
- `/claims/value-based-reimbursement-programs-overview/true-performance-programs-overview/true-performance-home-health-pay-for-value-program`
- `/claims/value-based-reimbursement-programs-overview/true-performance-programs-overview/true-performance-lite-program`
- `/claims/value-based-reimbursement-programs-overview/true-performance-programs-overview/true-performance-physical-and-occupational-pay-for-value-program-page`
- `/claims/value-based-reimbursement-programs-overview/true-performance-programs-overview/true-performance-skilled-nursing-facility-episodic-value-based-bundled-payment-program`
- `/claims/value-based-reimbursement-programs-overview/true-performance-programs-overview/true-performance-skilled-nursing-facility-pay-for-value-program`
- `/claims/value-based-reimbursement-programs-overview/valueblue/valueblue-connect-faqs`
- `/claims/value-based-reimbursement-programs-overview/valueblue/valueblue-faqs`
- `/communications-hub/news-archive/portal-message-library-hbcbspa`
- `/communications-hub/news-archive/portal-message-library-hbcbswny`
- `/communications-hub/news-archive/portal-message-library-hbcbswv`
- `/communications-hub/news-archive/portal-message-library-hbsneny`
- `/communications-hub/news-archive/portal-message-library-hbspa`
- `/communications-hub/news-archive/portal-message-library-hdebcbs`
- `/policies-and-programs/care-management/oncology-management-pathways`
- `/resources-and-education/clinical-quality-education/hedis`
- `/resources-and-education/clinical-quality-education/risk-adjustment-programs`
- `/resources-and-education/educational-programs/population-health-university/value-insight-center`
- `/resources-and-education/forms/office-administration-forms`

</details>
