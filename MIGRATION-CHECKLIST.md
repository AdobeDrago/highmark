# Migration checklist: pages linked from the highmark.com homepage

Tracks every page the [highmark.com](https://www.highmark.com/) homepage links to (header, body, footer, and the regional pages behind the ZIP gate) and whether it is migrated to this site. Updated 2026-10-01.

**Priority** follows general visibility on the source:

| Tier | What | Visibility | Status |
|------|------|------------|--------|
| P1 | Header links visible at load | every page, always on screen | 7/9 done, 1 to do |
| P2 | Homepage body links | the most-visited page | 6/8 done, 2 to do |
| P3 | Footer links | every page, low prominence | 14/15 done, 1 deferred |
| P4 | Header megamenu items | every page, one click in | 40/47 done, 2 preview only, 5 to do |
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
- [ ] `/newsroom` (Newsroom) **Redirect only** source redirects to /newsroom/press-releases, which is not migrated: ours redirects to highmark.com for now

## P2: homepage body links

- [x] `/member/member-guide/find-care` (Find Care) **Live**
- [x] `/resources/answers` (Highmark Answers) **Live**
- [x] `/resources/mental-health-services` (Mental Health) **Live**
- [x] `/about/corporate-responsibility/bright-blue-futures` (Highmark Bright Blue Futures) **Live** imported by the `nav-group4` batch
- [ ] `/newsroom/press-releases` (Press Releases) **To do** deferred by `nav-group5` (#34): a dynamic search listing (274 results, filters, paging) that needs a porting decision; redirects to highmark.com for now
- [ ] `/because-life` (learn about us) **To do** redirects to highmark.com for now
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
- [ ] `/newsroom/news-alert` (News Alert) **To do** deferred by `nav-group5` (#34): a signup form whose reCAPTCHA key is tied to highmark.com; redirects to highmark.com for now
- [x] `/newsroom/weekly-capitol-hill-report` (Weekly Capitol Hill Report) **Live** imported by the `nav-group5` batch (#34)
- [x] `/resources/answers/faq` (Frequently Asked Questions) **Live**
- [ ] `/about/corporate-responsibility/blue-fund` (Blue Fund) **To do**

Also in P4:

- [x] Our `/nav` placeholders (2026-10-01): the 14 ZIP-gated items point at Western PA pages until the P5 decision. The CHIP items are our pages, and the Individual & Family items redirect to highmark.com. "Shop Individual and Family Plans" goes to `/shop/home`, and "My Location" opens the ZIP modal.

## P5: ZIP-gated regional pages

The source's ACA and CHIP nav items have no plain link: they open the ZIP gate (`/zipcode-gate-login`) and then go to `/<region>/individual-families/<page>` or `/<region>/chip/<page>`. Decide the approach before importing: one page per region (up to 8 near-duplicates per page type), or one region-aware page per type using the ZIP tokens `/shop/home` uses.

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
