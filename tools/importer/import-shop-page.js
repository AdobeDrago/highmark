/* eslint-disable */
/* global WebImporter */

/**
 * Import script: ShopX content pages -> DA /shop/... (template shop-page).
 *
 * The sources are ShopX (shop.highmark.com) AEM-grid pages. Most are Angular pages whose
 * main region stays empty until a ZIP + county is entered, so this script runs against
 * static captures made by tools/importer/snapshots/capture-shop-page.mjs (default ZIP
 * 15222 / Allegheny, Western PA), served locally, e.g.:
 *   npx http-server tools/importer/snapshots -p 8765
 *   urls file: http://localhost:8765/shop/about-you/qualifying-life-events/landing.html
 *
 * Page kinds (detected from the capture):
 *   info        (legal-policies; its body only renders once a ZIP is stored):
 *               "< HOME" + title | one section per policy group (h3 + copy)
 *   qle         special-enrollment landing: h1 | main column (copy, flip-cards for the
 *               qualifying life events, copy) | Style main | Resources | Style aside
 *   enrollment  dental / Blue Edge Balance enrollment: h1 | "Let us help" | Style aside |
 *               enrollment-form (intro, effective date, child-only policy, Submit ->
 *               the live ShopX enrollment) | Style form
 *               These pages have their own header (title + nav), so the page gets
 *               `nav` metadata pointing at /shop/fragments/shopx-header-<product>, and
 *               the same capture with ?fragment=header imports that fragment.
 *   Metadata: Title, Description, Template shop-page (+ nav).
 *
 * Links back into ShopX pages that are migrated (home) point at /shop/; links into
 * ShopX flows that are not (event steps, enrollment) stay on shop.highmark.com.
 */

const SECTION_BREAK = 'hr';
const SHOPX = 'https://shop.highmark.com';
// the main shop header's logos (local copies of DA /shop/fragments/.shopx-header/*)
const HEADER_MEDIA = '/media-da/shop/fragments/shopx-header';

function sectionMetadata(document, style) {
  return WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: { Style: style },
  });
}

function regionSection(document, style, regions) {
  return WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: { Style: style, Regions: regions },
  });
}

function el(document, tag, html) {
  const e = document.createElement(tag);
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function text(node) {
  return (node?.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

/** tel: URL for a phone number such as 1-844-844-8040 or (866) 692-8062 */
function telHref(number) {
  const digits = number.replace(/[^\d]/g, '');
  const [, one, a, b, c] = digits.match(/^(1?)(\d{3})(\d{3})(\d{4})$/) || [];
  return a ? `tel:${one ? '1-' : ''}${a}-${b}-${c}` : `tel:${digits}`;
}

/** tel: for phone-number links (ShopX's are broken "/_TTY_..." links), /shop/ for home */
function fixLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const label = text(a);
    const href = a.getAttribute('href');
    if (/^[\d()\-\s.]{10,}$/.test(label)) {
      a.setAttribute('href', telHref(label));
    } else if (/^https:\/\/shop\.highmark\.com\/(beta\/)?home(\.html)?$/.test(href)) {
      a.setAttribute('href', '/shop/');
    }
    ['target', 'rel', 'aria-description', 'title'].forEach((n) => a.removeAttribute(n));
    a.textContent = label;
  });
  return root;
}

/** AEM rich text -> clean copy: drop spans/classes, &nbsp;, empty headings */
function cleanCopy(document, node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('span').forEach((s) => s.replaceWith(...s.childNodes));
  clone.querySelectorAll('u').forEach((u) => u.replaceWith(...u.childNodes));
  clone.querySelectorAll('b').forEach((b) => {
    const strong = document.createElement('strong');
    strong.append(...b.childNodes);
    b.replaceWith(strong);
  });
  clone.querySelectorAll('*').forEach((e) => {
    e.removeAttribute('class');
    e.removeAttribute('id');
  });
  clone.innerHTML = clone.innerHTML.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ');
  clone.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((e) => {
    if (!text(e) && !e.querySelector('img')) e.remove();
  });
  return fixLinks(clone);
}

function metadata(document, meta) {
  return WebImporter.Blocks.getMetadataBlock(document, meta);
}

/* ---------------------------------------------------------------- info */
function importInfo(document, source) {
  const out = document.createElement('div');
  // "< HOME" + title, then one section per policy group (h3 + copy); ShopX's separators,
  // blank paragraphs and the OneTrust "Cookie Preferences" button are dropped
  source.querySelectorAll('.cmp-text').forEach((t) => {
    const copy = cleanCopy(document, t);
    copy.querySelectorAll('button').forEach((b) => b.closest('p')?.remove());
    [...copy.children].forEach((child) => {
      const home = child.matches('h1, h2, h3, h4') && child.querySelector('a') && /^<\s*HOME$/i.test(text(child));
      if (home) {
        const p = document.createElement('p');
        const a = child.querySelector('a');
        a.textContent = '< HOME';
        p.append(a);
        out.append(p);
        return;
      }
      if (child.tagName === 'H3' && out.querySelector('h1')) out.append(document.createElement(SECTION_BREAK));
      out.append(child);
    });
  });
  return out;
}

/* ---------------------------------------------------------------- qle */
function importQle(document, source, blocks) {
  const out = document.createElement('div');
  const h1 = source.querySelector('h1');
  out.append(el(document, 'h1', text(h1)));

  // main column: the 7-column container after the title
  out.append(document.createElement(SECTION_BREAK));
  const mainCol = source.querySelector('section.container-fluid-fullwidth[class*="default--7"] .aem-Grid');
  [...(mainCol?.children || [])].forEach((cmp) => {
    const selector = cmp.querySelector('sxe-special-enrollment-event-selector-cards-component');
    if (selector) {
      let events = [];
      try { events = JSON.parse(selector.getAttribute('sep-objects')); } catch (e) { events = []; }
      const rows = events.map((ev) => {
        const icon = document.createElement('img');
        icon.src = new URL(ev.fileReference_cardThumbnail, SHOPX).href;
        icon.alt = ev.imgAltText || '';
        const title = el(document, 'p', `<strong>${el(document, 'div', ev.title).textContent.trim()}</strong>`);
        const back = el(document, 'p', ev.content.replace(/<b>/g, '<strong>').replace(/<\/b>/g, '</strong>').replace(/<br\s*\/?>\s*/g, '<br>'));
        const link = document.createElement('a');
        link.href = new URL(ev.selectNavUrl, SHOPX).href;
        link.textContent = 'Select';
        return [icon, title, back, link];
      });
      out.append(WebImporter.Blocks.createBlock(document, { name: 'flip-cards', cells: rows }));
      blocks.push('flip-cards');
      return;
    }
    const copy = cmp.querySelector('.cmp-text');
    if (copy) out.append(...cleanCopy(document, copy).childNodes);
  });
  out.append(sectionMetadata(document, 'main'));

  // Resources sidebar (the 2-column container)
  const aside = source.querySelector('section.container-fluid-fullwidth[class*="default--2"]');
  if (aside) {
    out.append(document.createElement(SECTION_BREAK));
    aside.querySelectorAll('.cmp-text').forEach((t) => out.append(...cleanCopy(document, t).childNodes));
    out.append(sectionMetadata(document, 'aside'));
  }
  return out;
}

/* ---------------------------------------------------------------- enrollment */
function importEnrollment(document, source, blocks, handoff) {
  const out = document.createElement('div');
  out.append(el(document, 'h1', text(source.querySelector('h1'))));

  // "Let us help": the 3-column container (empty h3 spacer dropped; the call line is a link)
  out.append(document.createElement(SECTION_BREAK));
  const help = source.querySelector('section.container-fluid-fullwidth[class*="default--3"]');
  help?.querySelectorAll('.cmp-text').forEach((t) => {
    const copy = cleanCopy(document, t);
    copy.querySelectorAll('p').forEach((p) => {
      const m = text(p).match(/^Call\s+(.+)$/i);
      if (m && !p.querySelector('a')) {
        const a = document.createElement('a');
        a.href = telHref(m[1]);
        a.textContent = text(p);
        p.replaceChildren(a);
      }
    });
    out.append(...copy.childNodes);
  });
  out.append(sectionMetadata(document, 'aside'));

  // the form's first step
  out.append(document.createElement(SECTION_BREAK));
  const form = source.querySelector('.hmhs-dynamic-form');
  const intro = document.createElement('div');
  form?.querySelectorAll('app-inner-html').forEach((html) => {
    const content = html.querySelector(':scope > div > div:first-child');
    if (!content) return;
    const t = text(content);
    if (/^Requested Effective Date/i.test(t)) return; // becomes the field label
    if (content.querySelector('em.required-notice')) {
      intro.append(el(document, 'p', `<em>${text(content)}</em>`));
      return;
    }
    const copy = cleanCopy(document, content);
    copy.querySelectorAll('section, br').forEach((s) => (s.tagName === 'BR' ? s.remove() : s.replaceWith(...s.childNodes)));
    // a line of bold notices (several <strong> in a <div>) becomes one bold paragraph
    copy.querySelectorAll('div').forEach((d) => {
      if (d.querySelector('h1, h2, h3, h4, p, ul')) { d.replaceWith(...d.childNodes); return; }
      d.replaceWith(el(document, 'p', `<strong>${text(d)}</strong>`));
    });
    intro.append(...copy.childNodes);
  });
  const rows = [[intro]];
  const dateField = form?.querySelector('app-individual-market-effective-date-select');
  if (dateField) {
    const placeholder = text(dateField.querySelector('mat-label')) || 'Effective Date';
    rows.push(['Requested Effective Date', 'effective-date', placeholder]);
  }
  form?.querySelectorAll('ptl-radio-input').forEach((radio) => {
    const label = text(radio.querySelector('mat-label')).replace(/\s*\*$/, '');
    const choices = [...radio.querySelectorAll('input[type="radio"]')].map((r) => r.value);
    if (label && choices.length) rows.push([label, 'radio', choices.join(', ')]);
  });
  const submit = document.createElement('a');
  submit.href = handoff;
  submit.textContent = 'Submit';
  rows.push([submit]);
  out.append(WebImporter.Blocks.createBlock(document, { name: 'enrollment-form', cells: rows }));
  blocks.push('enrollment-form');
  out.append(sectionMetadata(document, 'form'));
  return out;
}

/* ---------------------------------------------------------------- header fragment */
function importHeader(document, header) {
  const out = document.createElement('div');
  const logo = (file, alt) => {
    const a = document.createElement('a');
    a.href = '/shop/';
    const image = document.createElement('img');
    image.src = `${HEADER_MEDIA}/${file}`;
    image.alt = alt;
    a.append(image);
    const p = document.createElement('p');
    p.append(a);
    return p;
  };
  // brand logos per region, as the main shop header (/shop/fragments/shopx-header)
  out.append(logo('hmbcbs.png', 'Highmark Blue Cross Blue Shield'), regionSection(document, 'shop-brand', 'none, WPA, NEPA, DE, WV, WNY'));
  out.append(document.createElement(SECTION_BREAK));
  out.append(logo('hmbs.png', 'Highmark Blue Shield'), regionSection(document, 'shop-brand', 'CPA, SEPA, NENY'));

  out.append(document.createElement(SECTION_BREAK));
  out.append(el(document, 'ul', '<li><a href="/language-assistance">:language: Language Assistance</a></li><li><a href="/shop/info-pages/contact-us">:call: Contact Us</a></li>'));
  out.append(sectionMetadata(document, 'shop-utility'));

  out.append(document.createElement(SECTION_BREAK));
  const title = text([...header.querySelectorAll('h2, h3')].find((h) => /^Shop /.test(text(h))));
  out.append(el(document, 'p', title), sectionMetadata(document, 'shop-title, no-region'));

  out.append(document.createElement(SECTION_BREAK));
  const nav = header.querySelector('[aria-label="Navigation"]');
  const ul = document.createElement('ul');
  const seen = new Set();
  [...(nav?.querySelectorAll('a[href]') || [])].forEach((a) => {
    const label = text(a);
    if (!label || seen.has(label)) return;
    seen.add(label);
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = /^https:\/\/shop\.highmark\.com\/(beta\/)?home/.test(a.href) ? '/shop/' : a.href;
    link.textContent = label;
    li.append(link);
    ul.append(li);
  });
  out.append(ul, sectionMetadata(document, 'shop-nav'));
  return { out, title };
}

const DESCRIPTIONS = {
  'legal-policies': 'Legal notices and policies for Highmark individual and family health plans, including fraud prevention and SMS texting policies.',
  qle: 'Find out if you qualify for a Special Enrollment Period to sign up for or change Highmark individual and family health coverage after a qualifying life event.',
  'dental-enrollment': 'Start your Highmark dental plan enrollment: tell us about yourself, or call a Highmark representative to learn more about our dental plans.',
  'blue-edge-balance-enrollment': 'Start your Highmark Blue Edge Balance enrollment: tell us about yourself, or call a Highmark representative to learn more about Blue Edge Balance plans.',
};

const TITLES = {
  'dental-enrollment': 'Shop | Dental Enrollment',
  'blue-edge-balance-enrollment': 'Shop | Blue Edge Balance Enrollment',
};

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const pageUrl = new URL(params.originalURL);
    const sourceUrl = document.querySelector('meta[name="source-url"]')?.getAttribute('content') || '';
    const captured = document.querySelector('meta[name="captured"]')?.getAttribute('content') || '';
    const source = document.querySelector('main') || document.body;
    // the DA path mirrors the ShopX path under /shop/
    const docPath = `/shop${new URL(sourceUrl || pageUrl.href).pathname.replace(/\.html$/, '')}`;
    const slug = docPath.split('/').pop();
    const blocks = [];

    // header fragment of a product page (enrollment pages: ?fragment=header)
    if (pageUrl.searchParams.get('fragment') === 'header') {
      const product = slug.replace(/-enrollment$/, '');
      const { out, title } = importHeader(document, document.querySelector('header'));
      return [{
        element: out,
        path: `/shop/fragments/shopx-header-${product}`,
        report: { title, template: 'shop-header-fragment', blocks: [], captured },
      }];
    }

    let out;
    let kind;
    const meta = {};
    if (source.querySelector('[class*="cmp-experiencefragment--"]')
      && /info-pages\//.test(sourceUrl)) {
      kind = 'info';
      out = importInfo(document, source);
      meta.Title = document.title;
      meta.Description = DESCRIPTIONS[slug] || document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      if (!meta.Description) delete meta.Description;
    } else if (source.querySelector('sxe-special-enrollment-event-selector-cards-component')) {
      kind = 'qle';
      out = importQle(document, source, blocks);
      meta.Title = `Shop | ${text(source.querySelector('h1'))}`;
      meta.Description = DESCRIPTIONS.qle;
    } else if (source.querySelector('sxe-plan-enrollment-form')) {
      kind = 'enrollment';
      out = importEnrollment(document, source, blocks, sourceUrl);
      meta.Title = TITLES[slug] || `Shop | ${document.title}`;
      if (DESCRIPTIONS[slug]) meta.Description = DESCRIPTIONS[slug];
      meta.nav = `/shop/fragments/shopx-header-${slug.replace(/-enrollment$/, '')}`;
    } else {
      throw new Error(`Unrecognised ShopX page: ${sourceUrl || pageUrl.href}`);
    }
    meta.Template = 'shop-page';
    out.append(document.createElement(SECTION_BREAK));
    out.append(metadata(document, meta));

    return [{
      element: out,
      path: docPath,
      report: { title: meta.Title, template: 'shop-page', kind, blocks, captured },
    }];
  },
};
