/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata for the FAQ topic pages
 * (/resources/answers/faq/*, template `faq`).
 *
 * Source layout: a left section nav (div.col-lg-3 div.nav-container, every FAQ
 * topic), then the content column: an H1 + intro, one or more FAQ groups
 * (div.accordianTable: an H2, the questions, and usually a "Back to Top" link),
 * sometimes closing default content. Some pages add a right-rail callout box
 * (.rightrail-container, "Contact Us") and a blush CTA band below the content.
 *
 * Sections produced, in order:
 *   1. the left nav (cards-minimal-light-sidenav)
 *   2. the right-rail callout, when present (Style: right-rail), moved ahead of
 *      the content so it can float beside it, as on the source
 *   3. the H1 + intro
 *   4. one section per FAQ group, its "Back to Top" link kept as a paragraph
 *      after the accordion (link to #top: the top of the page)
 *   5. the CTA band, when present (Style: highlight)
 *
 * Selectors that don't match on a page are skipped — never guessed. Breaks are
 * inserted in beforeTransform; Section Metadata is anchored in afterTransform to
 * the surviving marker <hr>.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';
const NAV = 'div.col-lg-3 div.nav-container:has(.sidenav, .sidenav-item-list)';
const RAIL = '.rightrail-container';
const GROUP = 'div.accordianTable';
const CTA = 'div.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive';

const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

function marker(document, id) {
  const hr = document.createElement('hr');
  if (id) hr.setAttribute(SECTION_MARKER_ATTR, id);
  return hr;
}

/** The right-rail callout as plain heading / text / link. */
function railContent(document, rail) {
  const els = [];
  const title = rail.querySelector('.rightrail-title h3, h3');
  if (title) {
    const h3 = document.createElement('h3');
    h3.textContent = clean(title.textContent);
    els.push(h3);
  }
  const desc = rail.querySelector('.rightrail-description');
  if (desc) {
    const p = document.createElement('p');
    p.innerHTML = desc.innerHTML.trim();
    els.push(p);
  }
  rail.querySelectorAll('.hmk-brand-buttons a[href]').forEach((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = clean(a.textContent);
    p.append(link);
    els.push(p);
  });
  return els;
}

const isBackToTop = (a) => /^back to top$/i.test(clean(a.textContent));

/**
 * The group's heading when it sits outside the group, just before it (the
 * Medicare page: each H2 is its own text component above the accordion): the
 * last H2 between the previous group (or the H1) and this one.
 */
function headingBefore(group, h1) {
  if (group.querySelector('h2')) return null;
  let prev = null;
  const walker = group.ownerDocument.createTreeWalker(group.ownerDocument.body, 1);
  for (let node = walker.nextNode(); node && node !== group; node = walker.nextNode()) {
    if (node.matches(GROUP) || node === h1) prev = null;
    else if (node.tagName === 'H2' && !node.closest(GROUP)) prev = node;
  }
  return prev;
}

/**
 * A source comparison table (div.comparisontable: header cells in <thead>,
 * text wrapped in several divs, a mobile "scroll to view all columns" hint)
 * as a plain text table that the table-minimal-dark-compare parser reads.
 */
function plainTable(document, source) {
  const table = document.createElement('table');
  const body = document.createElement('tbody');
  source.querySelectorAll('tr').forEach((tr) => {
    const row = document.createElement('tr');
    tr.querySelectorAll(':scope > th, :scope > td').forEach((cell) => {
      cell.querySelectorAll('.swipemessage').forEach((el) => el.remove());
      const td = document.createElement('td');
      td.textContent = clean(cell.textContent);
      row.append(td);
    });
    body.append(row);
  });
  table.append(body);
  const wrapper = document.createElement('div');
  wrapper.className = 'faq-compare-table';
  wrapper.append(table);
  return wrapper;
}

/**
 * The id the pipeline gives a heading (github-slugger: "ACA - Care" -> "aca---care").
 * A non-breaking space (U+E000 during the import, see onLoad in import-faq-topic.js)
 * counts as a space.
 */
const headingId = (text) => clean(text.replace(/\ue000/g, ' ')).toLowerCase()
  .replace(/[^\p{L}\p{N}\s_-]/gu, '')
  .replace(/\s/g, '-');

/**
 * The FAQ landing's left nav: the parent ("Answers"), its pages as siblings, and
 * the current page's own pages (every FAQ topic) as its children. The topic pages'
 * navs (no child list under the current page) are left to the sidenav parser.
 * The siblings are a list nested under the parent's item, or (since October 2026)
 * items next to the parent's in one list, where a link with a submenu sits in a
 * div.sidenav-item-row beside its toggle. A sibling's own submenu (collapsed on the
 * source: Frequently Asked Questions on Community Resources and Support) follows
 * it as child rows; the block shows it collapsed under that sibling.
 */
function siblingNavWithChildren(document, nav) {
  const active = nav.querySelector('a.active');
  const item = active?.closest('li');
  const children = item?.querySelector(':scope > ul.subnavitem-list');
  const siblings = item?.parentElement;
  const submenus = siblings?.querySelector(':scope > li > ul.subnavitem-list');
  if (!siblings || !submenus) return null;
  const link = (a) => {
    const el = document.createElement('a');
    el.href = a.getAttribute('href');
    el.textContent = clean(a.textContent);
    return el;
  };
  const cells = [];
  const parent = nav.querySelector('a.side-nav-item-parent');
  if (parent) cells.push(['parent', link(parent)]);
  siblings.querySelectorAll(':scope > li > a[href], :scope > li > .sidenav-item-row > a[href]').forEach((a) => {
    if (a === parent) return;
    cells.push([a === active ? 'current' : 'sibling', link(a)]);
    const submenu = a === active ? children : a.closest('li').querySelector(':scope > ul.subnavitem-list');
    submenu?.querySelectorAll(':scope > li > a[href]').forEach((child) => cells.push(['child', link(child)]));
  });
  return WebImporter.Blocks.createBlock(document, { name: 'cards-minimal-light-sidenav', cells });
}

/** One spacing component's height at each width: the source's "ten-padding" is 10px
 * above and below (20px), "twenty-padding" 40px; "tab-" / "mob-" set tablet / phone. */
const SPACER_PX = { ten: 20, twenty: 40, thirty: 60, forty: 80 };
export function spacerHeights(spacer) {
  const cls = spacer.querySelector('section')?.className || '';
  const size = (prefix) => SPACER_PX[(cls.match(new RegExp(`(?:^|\\s)${prefix}(ten|twenty|thirty|forty)-padding`)) || [])[1]] || 0;
  return [size(''), size('tab-'), size('mob-')];
}

/** A run of spacers as section styles: space-<desktop>, plus space-tablet-<n> /
 * space-mobile-<n> where those differ (faq.css turns them into top padding). */
export function spaceStyle([d, t, m]) {
  const styles = [`space-${d}`];
  if (t !== d) styles.push(`space-tablet-${t}`);
  if (m !== d) styles.push(`space-mobile-${m}`);
  return styles.join(', ');
}

/**
 * The source spaces its components with empty "spacing" components, which the import
 * would drop. Walks the content column's components in order: a run of spacers before
 * a component becomes a section break with its space-* style there (or the style of the
 * FAQ group's own break), and content after a FAQ group starts a new section, so the
 * group's 60px bottom margin sits where the source has it.
 * @returns {Map<Element, string>} space styles for FAQ groups
 */
function spacerBreaks(document, column) {
  const leaves = [...column.querySelectorAll('.aem-GridColumn')]
    .filter((el) => !el.querySelector('.aem-GridColumn') && !el.closest(CTA) && !el.querySelector(CTA));
  const isSpacer = (el) => el.matches('.spacing');
  const groupOf = (el) => (el.matches(GROUP) ? el : el.querySelector(GROUP));
  const groupSpace = new Map();
  let pending = null;
  let afterGroup = false;
  leaves.forEach((leaf, i) => {
    if (isSpacer(leaf)) {
      const h = spacerHeights(leaf);
      pending = pending ? pending.map((v, j) => v + h[j]) : h;
      return;
    }
    const style = pending && pending.some(Boolean) ? spaceStyle(pending) : '';
    pending = null;
    const group = groupOf(leaf);
    if (group) {
      if (style) groupSpace.set(group, style);
      afterGroup = true;
      return;
    }
    // a heading component that only titles the next group (Medicare) goes with it
    const next = leaves.slice(i + 1).find((el) => !isSpacer(el));
    const titlesGroup = next && groupOf(next) && leaf.querySelector('h2')
      && clean(leaf.textContent) === clean(leaf.querySelector('h2').textContent);
    if (titlesGroup) {
      if (style) groupSpace.set(groupOf(next), style);
    } else if (style || afterGroup) {
      leaf.before(marker(document, style || undefined));
    }
    afterGroup = false;
  });
  return groupSpace;
}

const linkParagraph = (document, href, text) => {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  p.append(a);
  return p;
};

export default function transform(hookName, element, payload) {
  const { document } = payload;

  if (hookName === 'beforeTransform') {
    // links that open a new tab end with the source's Font Awesome external-link icon
    // (span.global-clr_externallink > i.fa-external-link-alt, with hidden "opens a new
    // tab or window" text): the :external-link: icon here, which scripts.js reads as
    // "open in a new tab". Other links leaving highmark.com open in the same tab.
    element.querySelectorAll('a .global-clr_externallink').forEach((span) => {
      span.replaceWith(document.createTextNode(' :external-link:'));
    });

    // the source's script adds a screen-reader hint to new-tab links
    // (<em>opens a new tab or window</em>); it would import as visible text
    element.querySelectorAll('a *').forEach((el) => {
      if (/^opens a new tab or window$/i.test(clean(el.textContent))) el.remove();
    });

    // lead paragraphs: the source's text style p1 (Sofia Pro semibold, larger) on a
    // whole paragraph outside the answers. Bold here; faq.css styles a paragraph that
    // is all bold as lead text.
    element.querySelectorAll('p span.p1').forEach((span) => {
      const p = span.closest('p');
      if (p.closest('.collapsible-item, .accordion-trigger') || clean(p.textContent) !== clean(span.textContent)) return;
      const strong = document.createElement('strong');
      strong.append(...span.childNodes);
      p.replaceChildren(strong);
    });

    const nav = element.querySelector(NAV);
    const h1 = element.querySelector('h1');

    // 1. left nav (the FAQ landing's has siblings and children; built here). Since
    // October 2026 the topic pages list the topics next to the parent's item, not in
    // a list under it, the shape the sidenav parser reads; nest them again.
    if (nav) {
      nav.before(marker(document));
      const block = siblingNavWithChildren(document, nav);
      if (block) nav.replaceWith(block);
      const root = nav.querySelector('.sidenav-item-list > li.sidenav-item-root');
      const flat = [...nav.querySelectorAll('.sidenav-item-list > li.sidenav-item-level1')];
      if (!block && root && flat.length) {
        const list = document.createElement('ul');
        list.append(...flat);
        root.append(list);
      }
    }

    // in-page jump links (the landing's #ACA, #kids, #home, #all) point at the
    // id the pipeline gives the target group's heading
    element.querySelectorAll('a[href^="#"]').forEach((a) => {
      const id = a.getAttribute('href').slice(1);
      const target = id && element.querySelector(`[id="${id}"]`);
      const heading = target && (target.matches('h2') ? target : target.querySelector('h2'));
      if (heading) a.setAttribute('href', `#${headingId(heading.textContent)}`);
    });

    // the landing's phone-only "complete list of all FAQs" (the source hides it from
    // 992px, where the left nav lists the topics): its own section, Style mobile-only
    const all = element.querySelector('section[id="all"]');
    if (all?.querySelector('h2')) {
      const content = [document.createElement('h2')];
      content[0].textContent = clean(all.querySelector('h2').textContent);
      all.querySelectorAll('p a[href]').forEach((a) => {
        content.push(linkParagraph(document, a.getAttribute('href'), clean(a.textContent)));
      });
      const groups = element.querySelectorAll(GROUP);
      const after = groups[groups.length - 1] || all;
      all.remove();
      after.after(marker(document, 'mobile-only'), ...content);
    }

    // 3. H1 + intro (and 2. the right rail, moved ahead of it)
    if (h1) {
      const rail = element.querySelector(RAIL);
      if (rail) {
        const content = railContent(document, rail);
        rail.closest('.col-lg-3')?.remove();
        rail.remove();
        if (content.length) h1.before(marker(document, 'right-rail'), ...content);
      }
      h1.before(marker(document));
    }

    // the source's spacing components as section breaks with space-* styles; the
    // content column is the H1's outermost ancestor without the left nav
    let column = h1 || element;
    while (h1 && column.parentElement && column.parentElement !== element
      && !(nav && column.parentElement.contains(nav))) column = column.parentElement;
    const groupSpace = h1 ? spacerBreaks(document, column) : new Map();

    // comparison tables (High Blood Pressure) as plain tables for the parser
    element.querySelectorAll('div.comparisontable:has(table)').forEach((source) => {
      source.replaceWith(plainTable(document, source.querySelector('table')));
    });

    // 4. FAQ groups (with their heading when it sits just above), each with its
    // text link (Back to Top, or the landing's "SEE ALL … FAQ") after the accordion
    element.querySelectorAll(GROUP).forEach((group) => {
      (headingBefore(group, h1) || group).before(marker(document, groupSpace.get(group)));
      const cta = group.querySelector('.hmk-brand-buttons a[href]')
        || [...group.querySelectorAll('a')].find(isBackToTop);
      if (!cta) return;
      const p = isBackToTop(cta)
        ? linkParagraph(document, '#top', 'Back to Top')
        : linkParagraph(document, cta.getAttribute('href'), clean(cta.textContent));
      (cta.closest('.hmk-brand-buttons') || cta).remove();
      group.after(p);
    });

    // 5. CTA band
    element.querySelectorAll(CTA).forEach((cta) => cta.before(marker(document, 'highlight')));
  }

  if (hookName === 'afterTransform') {
    element.querySelectorAll(`[${SECTION_MARKER_ATTR}]`).forEach((hr) => {
      const style = hr.getAttribute(SECTION_MARKER_ATTR);
      hr.removeAttribute(SECTION_MARKER_ATTR);
      hr.after(WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style },
      }));
    });
  }
}
