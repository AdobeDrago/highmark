/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-press-releases.js
  var import_press_releases_exports = {};
  __export(import_press_releases_exports, {
    default: () => import_press_releases_default
  });

  // tools/importer/transformers/highmark-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#ZN_bmb74MCuuQ38dlc",
        // Qualtrics website-feedback snippet (cleaned.html:2)
        ".mega-menu-overlay",
        // nav mega-menu overlay (cleaned.html:81)
        "#modalIeDetect",
        // legacy IE-detection modal (cleaned.html:1637)
        "#onetrust-consent-sdk"
        // OneTrust cookie banner + preference center (plans cleaned.html:2631)
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        // fixed global header/nav (cleaned.html:6)
        ".footer-content.iparsys.parsys",
        // global footer experience fragment incl. disclaimer (cleaned.html:2029)
        "div.col-md-12.col-lg-9"
        // breadcrumb + print/share utility column (cleaned.html:1656), sibling of content col-lg-12
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".d-block.d-lg-none"
      ]);
      element.querySelectorAll('a[href^="/content/dam/"]').forEach((a) => {
        a.setAttribute("href", `https://www.highmark.com${a.getAttribute("href")}`);
      });
      WebImporter.DOMUtils.remove(element, [
        "link",
        "noscript",
        "iframe"
      ]);
    }
  }

  // tools/importer/transformers/highmark-template-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
      if (el) return el;
    }
    return null;
  }
  function queryAll(root, selectors) {
    const found = [];
    (Array.isArray(selectors) ? selectors : [selectors]).forEach((sel) => {
      if (!sel) return;
      try {
        root.querySelectorAll(sel).forEach((el) => {
          if (!found.includes(el)) found.push(el);
        });
      } catch (e) {
      }
    });
    return found;
  }
  function hasContentBefore(node, root) {
    const range = root.ownerDocument.createRange();
    range.setStart(root, 0);
    range.setEndBefore(node);
    const frag = range.cloneContents();
    return !!(frag.textContent.trim() || frag.querySelector("img, picture"));
  }
  function sharedCleanup(root) {
    root.querySelectorAll('a.headNoLink:not([href]), a.headNoLink[href=""]').forEach((a) => {
      a.replaceWith(...a.childNodes);
    });
    root.querySelectorAll('a[href="tel:"]').forEach((a) => a.remove());
    root.querySelectorAll("a.textButton").forEach((a) => {
      if (!a.textContent.trim() && !a.querySelector("img, picture")) a.remove();
    });
    root.querySelectorAll("li.listWideImg picture").forEach((picture) => {
      const img = picture.querySelector("img");
      const desktop = picture.querySelector('source[media*="992"][srcset]');
      const src = desktop && desktop.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0];
      if (img && src) img.setAttribute("src", src);
    });
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      sharedCleanup(element);
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const targets = section.repeat ? queryAll(element, section.selector) : [querySection(element, section.selector)].filter(Boolean);
        targets.reverse().forEach((sectionEl) => {
          const hr = document.createElement("hr");
          if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
          sectionEl.before(hr);
        });
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        let anchors = [...element.querySelectorAll(`[${SECTION_MARKER_ATTR}="${section.id}"]`)];
        if (!anchors.length) {
          const el = querySection(element, section.selector);
          anchors = el ? [el] : [];
        }
        anchors.forEach((anchor) => {
          const metadataBlock = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          anchor.after(metadataBlock);
          if (anchor.tagName === "HR") anchor.removeAttribute(SECTION_MARKER_ATTR);
        });
      }
      let first = element.querySelector("hr");
      while (first && !hasContentBefore(first, element)) {
        first.remove();
        first = element.querySelector("hr");
      }
    }
  }

  // tools/importer/transformers/highmark-press-releases.js
  var MAX_ITEMS = 25;
  var SOURCE_ORIGIN = "https://www.highmark.com";
  var SEE_ALL_URL = "https://www.highmark.com/newsroom/press-releases";
  var SEE_ALL_LABEL = "See all press releases on highmark.com";
  var clean = (text) => (text || "").replace(/\s+/g, " ").trim();
  function absolute(href) {
    try {
      const u = new URL(href, SOURCE_ORIGIN);
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
        return `${SOURCE_ORIGIN}${u.pathname}${u.search}${u.hash}`;
      }
      return u.href;
    } catch (e) {
      return href;
    }
  }
  var urlKey = (href) => absolute(href).replace(/\/$/, "").toLowerCase();
  function domReleases(listing) {
    return [...listing.querySelectorAll(".release-item")].map((item) => {
      var _a;
      const link = item.querySelector("a.release-title");
      const summary = item.querySelector(".release-summary");
      return {
        date: clean((_a = item.querySelector(".release-date")) == null ? void 0 : _a.textContent),
        title: clean(link == null ? void 0 : link.textContent),
        url: link ? absolute(link.getAttribute("href")) : "",
        summary: summary ? summary.innerHTML : ""
      };
    }).filter((r) => r.title && r.url);
  }
  function mergeReleases(fromDom, fromSnapshot) {
    const seen = /* @__PURE__ */ new Set();
    const merged = [];
    [...fromDom, ...fromSnapshot].forEach((r) => {
      if (!r || !r.title || !r.url) return;
      const key = urlKey(r.url);
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(__spreadProps(__spreadValues({}, r), { url: absolute(r.url), time: Date.parse(clean(r.date)) || 0 }));
    });
    return merged.sort((a, b) => b.time - a.time).slice(0, MAX_ITEMS);
  }
  function teaserParagraph(document2, html) {
    const holder = document2.createElement("div");
    holder.innerHTML = html || "";
    const p = document2.createElement("p");
    const paras = holder.querySelectorAll("p");
    (paras.length ? [...paras] : [holder]).forEach((src, i) => {
      if (i) p.append(" ");
      p.append(...src.childNodes);
    });
    p.querySelectorAll("b, strong, i, em").forEach((el) => {
      if (!el.textContent.trim()) el.replaceWith(" ");
    });
    p.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", absolute(a.getAttribute("href"))));
    const walker = document2.createTreeWalker(
      p,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach((t) => {
      t.textContent = t.textContent.replace(/\s+/g, " ");
    });
    if (texts.length) {
      texts[0].textContent = texts[0].textContent.replace(/^ /, "");
      const last = texts[texts.length - 1];
      last.textContent = last.textContent.replace(/ $/, "");
    }
    return clean(p.textContent) ? p : null;
  }
  function buildList(document2, heading, releases) {
    const frag = document2.createDocumentFragment();
    const h1 = document2.createElement("h1");
    h1.textContent = heading;
    frag.append(h1);
    releases.forEach((r) => {
      if (r.date) {
        const date = document2.createElement("p");
        date.textContent = clean(r.date);
        frag.append(date);
      }
      const h2 = document2.createElement("h2");
      const a = document2.createElement("a");
      a.href = r.url;
      a.textContent = clean(r.title);
      h2.append(a);
      frag.append(h2);
      const teaser = teaserParagraph(document2, r.summary);
      if (teaser) frag.append(teaser);
    });
    const more = document2.createElement("p");
    const moreLink = document2.createElement("a");
    moreLink.href = SEE_ALL_URL;
    moreLink.textContent = SEE_ALL_LABEL;
    more.append(moreLink);
    frag.append(more);
    return frag;
  }
  function transform3(hookName, element, payload) {
    var _a, _b;
    if (hookName !== "beforeTransform") return;
    if (((_a = payload == null ? void 0 : payload.template) == null ? void 0 : _a.name) && payload.template.name !== "press-releases") return;
    const results = element.querySelector("#release-results");
    if (!results) return;
    const listing = results.closest(".pressrelease-new, .press-release") || results;
    const { document: document2 } = payload;
    const heading = clean((_b = results.querySelector(":scope > h2, :scope > h1")) == null ? void 0 : _b.textContent) || "Press Releases";
    const snapshot = payload.pressReleases || {};
    const releases = mergeReleases(domReleases(results), snapshot.releases || []);
    listing.replaceWith(buildList(document2 || element.ownerDocument, heading, releases));
    console.log(`press-releases: ${releases.length} releases (snapshot fetched ${snapshot.fetched || "n/a"})`);
  }

  // tools/importer/data/press-releases.json
  var press_releases_default = {
    source: "https://www.highmark.com/bin/highmark/cf/new/pressrelease/home.json?start=0&limit=25",
    fetched: "2026-10-05",
    totalCount: 276,
    releases: [
      {
        date: "Friday, October 02, 2026",
        title: "Highmark Invests $825,000 in Six Initiatives Improving Health across the Capital Region",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-invests-825000-in-six-initiatives-improving-health-across-the-capital-region",
        summary: "<p>Highmark Blue Shield is deepening its commitment to the Capital Region with an investment of $825,000 in six community health initiatives through Blue Fund, an initiative of the Highmark Bright Blue Futures charitable giving and community involvement program.</p>\n"
      },
      {
        date: "Thursday, October 01, 2026",
        title: "Highmark remains committed to Medicare Advantage members in 2027",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-remains-committed-to-medicare-advantage-members-in-2027",
        summary: "<p>The Annual Enrollment Period (AEP) for Medicare coverage in 2027 begins on Thursday, Oct. 15, and Highmark is encouraging Medicare beneficiaries to take time to understand their coverage, compare available options and choose the plan that best fits their health needs.&nbsp;</p>\n"
      },
      {
        date: "Wednesday, September 23, 2026",
        title: "Highmark and Rothman Orthopaedics reach agreement to maintain in-network access for patients and members",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-and-rothman-orthopaedics-reach-agreement-to-maintain-in-network-access-for-patients-and-members",
        summary: "<p>Highmark Blue Shield and Rothman Orthopaedics have reached an agreement that will allow Rothman to remain an in-network provider for Highmark commercial, ACA, FEP and CHIP members in Pennsylvania.&nbsp;</p>\n"
      },
      {
        date: "Monday, September 14, 2026",
        title: "Highmark Inc. executive to speak about AI reliability",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-inc-executive-to-speak-about-ai-reliability",
        summary: "<p>Emily Iacolo, Vice President of Customer Data, Insights, and Guidance Product Management at Highmark Inc. (Highmark), will speak at the Healthcare Keynote session at the 2026 Dreamforce conference.</p>\n"
      },
      {
        date: "Saturday, September 12, 2026",
        title: "Fitness @ the Field Moves to the New Highmark Stadium",
        url: "https://www.highmark.com/newsroom/press-releases/fitness-at-the-field-moves-to-the-new-highmark-stadium",
        summary: "<p>Before fans take their seats for the 2026 home opener at the new Highmark Stadium, Western New Yorkers will have a chance to experience the highly anticipated venue in a unique and active way.&nbsp;</p>\n"
      },
      {
        date: "Thursday, September 10, 2026",
        title: "Highmark invests $3.75 million in 20 initiatives improving health across Western New York",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-invests-3-and-75-million-in-20-initiatives-improving-health-across-western-new-york",
        summary: "<p>Highmark Blue Cross Blue Shield is deepening its commitment to Western New York with a $3.75 million investment in 20 community health initiatives through Blue Fund, an initiative of the Highmark Bright Blue Futures charitable giving and community involvement program.</p>\n"
      },
      {
        date: "Monday, August 31, 2026",
        title: "Highmark Delaware named a 2026 Delaware top workplace by The News Journal",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-delaware-named-a-2026-delaware-top-workplace-by-the-news-journal",
        summary: "<p>Highmark Delaware has been awarded a Top Workplaces 2026 honor by The News Journal.&nbsp;</p>\n"
      },
      {
        date: "Monday, August 31, 2026",
        title: "Wider Circle joins with Highmark Wholecare to launch peer-led community health program",
        url: "https://www.highmark.com/newsroom/press-releases/wider-circle-joins-with-highmark-wholecare-to-launch-peer-led-community-health-program",
        summary: "<p>Wider Circle, a company focused on building communities to improve health and quality of life through trusted connections, recently joined with Highmark Wholecare to launch a proven peer-led, community-based health program for its Medicaid members.</p>\n"
      },
      {
        date: "Tuesday, August 25, 2026",
        title: "New study finds community pharmacist services improve medication adherence for Pa. Medicaid members",
        url: "https://www.highmark.com/newsroom/press-releases/new-study-finds-community-pharmacist-services-improve-medication-adherence-for-pa-medicaid-members",
        summary: "<p>A new study published in the Journal of the American Pharmacists Association found that community pharmacist-provided medication adherence services delivered through a Pennsylvania Medicaid managed care payor program were associated with meaningful improvements in how consistently members took medications used to manage cardiovascular disease, cholesterol and diabetes.&nbsp;</p>\n"
      },
      {
        date: "Monday, August 24, 2026",
        title: "Highmark Health Options launches GEDWorks Program to support state workforce development",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-health-options-launches-gedworks-program-to-support-state-workforce-development",
        summary: "<p>Longterm evidence-based research has highlighted the importance of employment and career on an individual\u2019s health and wellness, as well as the impact of a high school diploma on earning potential.&nbsp;</p>\n"
      },
      {
        date: "Monday, August 24, 2026",
        title: "Highmark Blue Cross Blue Shield and Buffalo Bills Celebrate Grand Opening of Highmark Trail",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-blue-cross-blue-shield-and-buffalo-bills-celebrate-grand-opening-of-highmark-trail",
        summary: "<p>Highmark Blue Cross Blue Shield and the Buffalo Bills officially celebrated the grand opening of the Highmark Trail, a new 1.7-mile community trail surrounding the new Highmark Stadium, during a community-wide event that brought together local residents, families, community leaders and Bills fans for a day focused on wellness, recreation and connection.</p>\n"
      },
      {
        date: "Monday, August 24, 2026",
        title: "Highmark Health Appoints Gustavo (Gus) Giraldo as President of Highmark Health Plan",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-health-appoints-gustavo-giraldo-as-president-of-highmark-health-plan",
        summary: "<p>Highmark today announced the appointment of Gustavo (Gus) Giraldo as President of Highmark Health Plan, effective immediately.</p>\n"
      },
      {
        date: "Tuesday, July 21, 2026",
        title: "Shared success: Highmark Wholecare and Wellspan Forge Inspired Path to Community Reinvestment",
        url: "https://www.highmark.com/newsroom/press-releases/shared-success-highmark-wholecare-and-wellspan-forge-inspired-path-to-community-reinvestment",
        summary: "<p>Highmark Wholecare and WellSpan Health today announced a groundbreaking program within their new value-based care agreement.&nbsp; &nbsp;</p>\n"
      },
      {
        date: "Wednesday, July 15, 2026",
        title: "Highmark Blue Cross Blue Shield, Buffalo Bills bring community together with preseason scavenger hunt",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-blue-cross-blue-shield-buffalo-bills-bring-community-together-with-preseason-scavenger-hunt",
        summary: "<p>Highmark Blue Cross Blue Shield and the Buffalo Bills today announced the launch of <i>Heart of Buffalo Health Quest, </i>a community-wide scavenger hunt designed to bring Western New Yorkers together in celebration of two exciting milestones.</p>\n"
      },
      {
        date: "Tuesday, July 07, 2026",
        title: "Highmark Wholecare and United Concordia Dental to provide no cost on-site dental services in underserved communities ",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-wholecare-and-united-concordia-dental-to-provide-no-cost-on-site-dental-services-in-underserved-communities",
        summary: "<p>For the eighth consecutive year, Highmark Wholecare and United Concordia Dental are holding their summer Healthy Smiles for Miles tour, providing no cost on-site dental services \u2014<b> </b>including exams, cleanings, X-rays and fluoride treatments \u2014<b> </b>to Highmark Children\u2019s Health Insurance Program (CHIP) and Highmark Wholecare members in underserved communities throughout Pennsylvania.&nbsp;</p>\n"
      },
      {
        date: "Tuesday, June 30, 2026",
        title: "Foodsmart and Highmark Health Options introduce program to improve member nutrition care and health outcomes",
        url: "https://www.highmark.com/newsroom/press-releases/foodsmart-and-highmark-health-options-introduce-program-to-improve-member-nutrition-care-and-health-outcomes",
        summary: "<p>Highmark Health Options West Virginia (HHOWV) and Foodsmart today announced a new program to bring personalized nutrition care and food support to members across the state.</p>\n"
      },
      {
        date: "Thursday, June 25, 2026",
        title: "Summer City Fitness returns to East Buffalo for 11th season",
        url: "https://www.highmark.com/newsroom/press-releases/summer-city-fitness-returns-to-east-buffalo-for-11th-season",
        summary: "<p>Highmark Blue Cross Blue Shield and the City of Buffalo today announced the return of its Summer City Fitness Series.</p>\n"
      },
      {
        date: "Monday, June 15, 2026",
        title: "Highmark Mann enters new era with Golden Grand Reveal of reimagined campus",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-mann-enters-new-era-with-golden-grand-reveal-of-reimagined-campus",
        summary: "<p>Today, Highmark Mann Center for the Performing Arts officially unveiled its reimagined campus during its Golden Grand Reveal, marking one of the most significant milestones in the organization\u2019s history as it launches its landmark 50th anniversary season.</p>\n"
      },
      {
        date: "Monday, June 08, 2026",
        title: "Highmark Names Keith Payet Head of Government Business Segment",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-names-keith-payet-head-of-government-business-segment",
        summary: "<p>Highmark Inc., the third largest overall Blue Cross Blue Shield-affiliated organization in the country with nearly eight million members, today announced the appointment of Keith Payet as Government Business Segment President.&nbsp;</p>\n"
      },
      {
        date: "Thursday, May 28, 2026",
        title: "Highmark Bright Blue Futures invests in PASSHE Foundation to expand access to education and strengthen Pennsylvania\u2019s workforce",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-bright-blue-futures-invests-passhe-foundation",
        summary: "<p>As demand grows for a skilled workforce across Pennsylvania, Highmark today reaffirmed its nearly 30-year investment in higher education \u2014 presenting a $250,000 contribution to the Pennsylvania State System of Higher Education (PASSHE) Foundation to help students access college and prepare for in-demand careers.</p>\n"
      },
      {
        date: "Monday, May 04, 2026",
        title: "Highmark reinforces commitment to mental health, highlights comprehensive support during Mental Health Awareness Month ",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-reinforces-commitment-to-mental-health,-highlights-comprehensive-support-during-mental-health-awareness-month-1",
        summary: "<p>May is Mental Health Awareness Month, and Highmark is encouraging members to take time to prioritize their mental health and wellbeing.&nbsp;</p>\n"
      },
      {
        date: "Friday, April 24, 2026",
        title: "Highmark Western and Northeastern New York announces new board appointments",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-western-and-northeastern-new-york-announces-new-board",
        summary: "<p>Highmark Western and Northeastern New York today announced changes to its Board of Directors, appointing Richard S. Gold, former President and COO of M&amp;T Bank Corporation, as its new Chairperson. Additionally, Jill K. Bond, Esq., a distinguished attorney, has been named as a new member of the Board.</p>\n"
      },
      {
        date: "Wednesday, April 22, 2026",
        title: "Beyond medication: Kellyn Foundation and Highmark Wholecare tackle type 2 diabetes, obesity with comprehensive lifestyle program",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-wholecare-and-kellyn-foundation-tackle-diabetes-obesity",
        summary: "<p>According to a 2024 report from the American Diabetes Association, 1.1 million adult Pennsylvanians have been diagnosed with diabetes, with thousands more undiagnosed. The same study found that more than a third of the state\u2019s adult population is obese. According to the Centers for Disease Control and Prevention (CDC), annual cost nationwide to treat these two conditions exceeds $400 billion.</p>\n"
      },
      {
        date: "Monday, April 20, 2026",
        title: "Highmark Blue Cross Blue Shield Launches Bright Blue Days of Service",
        url: "https://www.highmark.com/newsroom/press-releases/highmark-bcbs-launches-bright-blue-days-service",
        summary: "<p>Highmark Blue Cross Blue Shield is proud to announce its first-ever <i>Highmark Bright Blue Days of Service Week</i>, a dedicated week of volunteerism designed to empower team members to give back to the community.&nbsp;</p>\n"
      },
      {
        date: "Wednesday, April 08, 2026",
        title: "2026 Highmark Walk for a Healthy Community registration now open",
        url: "https://www.highmark.com/newsroom/press-releases/2026-highmark-walk-for-a-healthy-community-registration-now-open",
        summary: "<p>Highmark Inc. is inviting others to step in support their favorite nonprofit organizations during its annual Highmark Walk for a Healthy Community, which will benefit 150+ nonprofits throughout Pennsylvania and Delaware this May and June.&nbsp;</p>\n"
      }
    ]
  };

  // tools/importer/import-press-releases.js
  var parsers = {};
  var transformers = [
    transform3,
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    "name": "press-releases",
    "description": "Newsroom press releases: h1, then a static newest-first list of recent releases (date, linked title, teaser) injected from the press-release JSON endpoint snapshot, then a 'See all press releases on highmark.com' link; search box, filters and paging dropped",
    "urls": [
      "https://www.highmark.com/newsroom/press-releases"
    ],
    "blocks": [],
    "sections": [
      {
        "id": "1",
        "name": "press-release-listing",
        "selector": [
          "main .page__par"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "#release-results > h2",
          "#release-results .release-list > .release-item"
        ]
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE, pressReleases: press_releases_default });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const claimed = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        let elements;
        try {
          elements = document2.querySelectorAll(selector);
        } catch (e) {
          console.warn(`Invalid selector for ${blockDef.name}: ${selector}`, e);
          return;
        }
        elements.forEach((element) => {
          if (claimed.has(element)) return;
          claimed.add(element);
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_press_releases_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      const crumb = document2.querySelector("ol.breadcrumb-list li.active");
      const crumbLabel = ((crumb == null ? void 0 : crumb.textContent) || "").replace(/\s+/g, " ").trim();
      WebImporter.DOMUtils.remove(main, [
        ".experiencefragment:has(.main-search-bar)",
        ".experiencefragment:has(.footer-list)",
        "div.breadcrumb"
      ]);
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      const meta = WebImporter.Blocks.getMetadata(document2) || {};
      if (crumb) {
        meta.breadcrumbs = "true";
        if (crumbLabel) meta["Breadcrumb Title"] = crumbLabel;
      }
      if (!meta.Title) {
        const h1 = main.querySelector("h1");
        if (h1) meta.Title = h1.textContent.replace(/\s+/g, " ").trim();
      }
      meta.template = "press-releases";
      main.append(WebImporter.Blocks.getMetadataBlock(document2, meta));
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_press_releases_exports);
})();
