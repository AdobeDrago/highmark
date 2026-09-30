# Migration checklist: pages linked from the highmark.com homepage

Tracks every page the [highmark.com](https://www.highmark.com/) homepage links to (header, body, footer, and the regional pages behind the ZIP gate) and whether it is migrated to this site. Updated 2026-09-30.

**Priority** follows general visibility on the source:

| Tier | What | Visibility | Status |
|------|------|------------|--------|
| P1 | Header links visible at load | every page, always on screen | 4/9 done, 3 to do |
| P2 | Homepage body links | the most-visited page | 3/8 done, 2 in progress, 1 preview only, 2 to do |
| P3 | Footer links | every page, low prominence | 0/15 done, 13 in progress, 1 deferred |
| P4 | Header megamenu items | every page, one click in | 30/47 done, 9 preview only, 7 to do |
| P5 | ZIP-gated regional pages | behind the ZIP gate (nav items with no plain link) | 5/87 live |

**Statuses:** **Live** = published on `main--highmark--adobedrago.aem.live`. **Preview only** = in DA and previewed, not published. **To do** = not in DA. **Redirect only** / **External** = the source link redirects, so there is nothing to import; our site still needs the redirect or an updated link. There is no `/redirects` sheet in DA yet, so the first redirect means creating one. Only **Live** items are checked.

Before importing a page, check the `nav-group*` branches' `tools/importer/urls-*.txt` lists and the recent preview log: other people migrate pages into the same DA tree, and a second import overwrites the first.

## P1: header links visible on every page

- [ ] `/about/alert-notice` (Learn More) **To do**
- [x] `/employer` (For Employers) **Live**
- [ ] `/language-assistance` (Language Assistance) **To do**
- [ ] `/contact` (Contact Us) **To do**
- [x] `/plans` (Plans) **Live**
- [x] `/member/member-guide` (For Members) **Live**
- [x] `/resources` (Resources) **Live**
- [ ] `/about` (About) **Redirect only** source redirects to /about/our-story (live here): add a redirect, no import
- [ ] `/newsroom` (Newsroom) **Redirect only** source redirects to /newsroom/press-releases: add a redirect once that page exists

## P2: homepage body links

- [x] `/member/member-guide/find-care` (Find Care) **Live**
- [x] `/resources/answers` (Highmark Answers) **Live**
- [x] `/resources/mental-health-services` (Mental Health) **Live**
- [ ] `/about/corporate-responsibility/bright-blue-futures` (Highmark Bright Blue Futures) **Preview only** in progress: art-golk-merkle `nav-group4` (on preview)
- [ ] `/newsroom/press-releases` (Press Releases) **To do**
- [ ] `/because-life` (learn about us) **To do**
- [ ] `/privacy` (Digital Privacy Policy) **On preview (publishes after the legal CSS merges)**
- [ ] `/terms-service` (Terms of Service) **On preview (publishes after the legal CSS merges)**

## P3: footer links

- [ ] `/non-discrimination` (Non Discrimination Policy) **On preview (publishes after the legal CSS merges)**
- [ ] `/fraud` (Fraud Prevention) **On preview (publishes after the legal CSS merges)**
- [ ] `/western-pennsylvania/medical-policy` (Medical Policy) **Deferred** ZIP-gated regional page; deferred to the P5 decision
- [ ] `/cms-onc-interoperability` (CMS Interoperability Patient Access Rule) **On preview (publishes after the legal CSS merges)**
- [ ] `/cms-onc-interoperability-prior-authorization-rule` (CMS Interoperability Prior Authorization Rule) **On preview (publishes after the legal CSS merges)**
- [ ] `/accessibility-statement` (Accessibility Statement) **On preview (publishes after the legal CSS merges)**
- [ ] `/sms-texting` (SMS Texting) **On preview (publishes after the legal CSS merges)**
- [ ] `/privacy-center` (Privacy Center) **Redirect only** source redirects to /privacy-center/announcements: add a redirect
- [ ] `/privacy-center/announcements` (Privacy Center: Announcements) **On preview (publishes after the legal CSS merges)**
- [ ] `/no-surprises-act` (No Surprises Act) **On preview (publishes after the legal CSS merges)**
- [ ] `/transparency-in-coverage` (Transparency in Coverage) **On preview (publishes after the legal CSS merges)**
- [ ] `/network-access` (Network Access & Adequacy) **On preview (publishes after the legal CSS merges)**
- [ ] `/mandates` (State Law Requirements) **On preview (publishes after the legal CSS merges)**
- [ ] `/gdpr` (GDPR) **On preview (publishes after the legal CSS merges)**
- [ ] `/ohca` (OHCA Statement) **On preview (publishes after the legal CSS merges)**

Sub-pages the batch pages link to (side navs and links); not linked from the homepage, and missing here, so these links 404 until they are imported:

- [ ] `/fraud/red-flags` **To do** linked from `/fraud`
- [ ] `/fraud/contact` **To do** linked from `/fraud`
- [ ] `/fraud/senior-fraud-prevention` **To do** linked from `/fraud`
- [ ] `/privacy-center/privacy-policies-and-practices` **To do** linked from `/privacy-center/announcements`
- [ ] `/privacy-center/state-specific-notices` **To do** linked from `/privacy-center/announcements`
- [ ] `/privacy-center/terms-of-service` **To do** linked from `/privacy-center/announcements`
- [ ] `/privacy-center/health-information-exchanges` **To do** linked from `/privacy-center/announcements`
- [ ] `/privacy-center/privacy-forms` **To do** linked from `/privacy-center/announcements`
- [ ] `/transparency-in-coverage/claims-payment-policies-and-other-information` **To do** linked from `/transparency-in-coverage`
- [ ] `/privacy/digital-privacy-policy` **To do** linked from `/privacy`

Also in P3:

- [ ] Our `/footer` fragment: the CSI Policy link points at a mangled relative path (`/content/dam/…/csipolicy-pdf`); it needs the source's absolute PDF URL.
- [ ] Our `/footer` fragment is older than the source footer: the source also links CMS Interoperability Prior Authorization Rule and Privacy Center.

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
- [ ] `/employer/get-started` (Get Started) **To do**
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
- [ ] `/resources/spending-accounts/flexible-spending-account-fsa` (Flexible Savings Accounts (FSA)) **Preview only** drafted in DA 2026-09-16 and previewed, never published: review and publish
- [x] `/resources/spending-accounts/health-reimbursement-arrangement-hra` (Health Reimbursement Arrangement (HRA)) **Live**
- [ ] `/resources/spending-accounts/commuter-benefits-account` (Commuter Benefits) **Preview only** drafted in DA 2026-09-16 and previewed, never published: review and publish
- [x] `/about/our-story` (Our Story) **Live** imported 2026-09-29; art-golk-merkle `nav-group4` also lists it: coordinate before their import overwrites it
- [ ] `/about/our-story/mission-vision` (Mission, Vision & Core Behaviors) **Preview only** in progress: art-golk-merkle `nav-group4` (on preview)
- [ ] `/about/our-story/our-businesses` (Our Businesses) **Preview only** in progress: art-golk-merkle `nav-group4` (on preview)
- [ ] `/about/our-story/leadership-team-board` (Leadership Team & Board) **Preview only** in progress: art-golk-merkle `nav-group4` (on preview)
- [ ] `/about/corporate-responsibility` (Corporate Responsibility) **Preview only** in progress: art-golk-merkle `nav-group4` (on preview)
- [ ] `/about/corporate-responsibility/valuing-our-people` (Valuing Our People) **Preview only** in progress: art-golk-merkle `nav-group4` (on preview)
- [ ] `/about/corporate-responsibility/integrity-ethics` (Integrity & Ethics) **External** source redirects to highmarkhealth.org: point our nav link there
- [ ] `/about/corporate-responsibility/social-determinants-of-health` (Social Determinants of Health) **Preview only** in progress: art-golk-merkle `nav-group4` (on preview)
- [ ] `/about/corporate-responsibility/sustainability` (Sustainability) **Preview only** in progress: art-golk-merkle `nav-group4` (on preview)
- [ ] `/about/events` (Events) **To do**
- [ ] `/newsroom/media-relations-contacts` (Media Relations Contacts) **To do**
- [ ] `/newsroom/news-alert` (News Alert) **To do**
- [ ] `/newsroom/weekly-capitol-hill-report` (Weekly Capitol Hill Report) **To do**
- [x] `/resources/answers/faq` (Frequently Asked Questions) **Live**
- [ ] `/about/corporate-responsibility/blue-fund` (Blue Fund) **To do**

Also in P4:

- [ ] Our `/nav`: "Shop Individual and Family Plans" and "Special Enrollment Period" point at `/` (placeholders for the ZIP-gated regional pages in P5).

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
