/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Health Insurance Glossary (/resources/answers/health-insurance-glossary).
 *
 * The source glossary is one client-rendered component (div.glossary): an A–Z bar
 * (ol.glossary-name-list-inner, letters without terms are a.disabled) and one
 * div.glossary-list-item per letter with its letter badge (.glossary-list-key), the
 * terms (li.glossary-link-item: h3 + a div of text) and a "Back to Top" link.
 *
 * Output, in three sections:
 *   1. hero-minimal-light block: the H1 and the intro (the source's lead style p1,
 *      bold here; glossary.css styles it)
 *   2. Style glossary-letters: the A–Z bar as a list, a letter with terms linking to
 *      its group (#a = the id the pipeline gives the group's "A" heading), the
 *      others plain text
 *   3. Style glossary: per letter an H2 (the badge), its terms as H3 + text, and a
 *      "Back to Top" link to #top
 * Section Metadata is anchored in afterTransform, as in the FAQ transformer.
 */
const SECTION_MARKER_ATTR = 'data-excat-section-id';

const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

function marker(document, id) {
  const hr = document.createElement('hr');
  if (id) hr.setAttribute(SECTION_MARKER_ATTR, id);
  return hr;
}

function heroBlock(document, hero) {
  const h1 = document.createElement('h1');
  h1.textContent = clean(hero.querySelector('h1').textContent);
  const cell = [h1];
  const lead = hero.querySelector('span.p1');
  if (lead) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = clean(lead.textContent);
    p.append(strong);
    cell.push(p);
  }
  return WebImporter.Blocks.createBlock(document, { name: 'hero-minimal-light', cells: [[cell]] });
}

function letterBar(document, glossary) {
  const ul = document.createElement('ul');
  glossary.querySelectorAll('.glossary-name-list a.glossary-name-item').forEach((a) => {
    const letter = clean(a.textContent).toUpperCase();
    const li = document.createElement('li');
    if (a.classList.contains('disabled')) {
      li.textContent = letter;
    } else {
      const link = document.createElement('a');
      link.href = `#${letter.toLowerCase()}`;
      link.textContent = letter;
      li.append(link);
    }
    ul.append(li);
  });
  return ul;
}

function letterGroups(document, glossary) {
  const content = [];
  glossary.querySelectorAll('.glossary-list-item').forEach((item) => {
    const terms = [...item.querySelectorAll('li.glossary-link-item')];
    const key = clean(item.querySelector('.glossary-list-key')?.textContent)
      || clean(terms[0]?.querySelector('h3')?.textContent).charAt(0);
    const h2 = document.createElement('h2');
    h2.textContent = key.toUpperCase();
    content.push(h2);
    terms.forEach((term) => {
      const h3 = document.createElement('h3');
      h3.textContent = clean(term.querySelector('h3').textContent);
      content.push(h3);
      const text = term.querySelector(':scope > div');
      if (text) content.push(...text.childNodes);
    });
    const p = document.createElement('p');
    const top = document.createElement('a');
    top.href = '#top';
    top.textContent = 'Back to Top';
    p.append(top);
    content.push(p);
  });
  return content;
}

export default function transform(hookName, element, payload) {
  const { document } = payload;

  if (hookName === 'beforeTransform') {
    // links that open a new tab end with the source's Font Awesome external-link icon;
    // the :external-link: icon here (see the FAQ transformer)
    element.querySelectorAll('a .global-clr_externallink').forEach((span) => {
      span.replaceWith(document.createTextNode(' :external-link:'));
    });
    element.querySelectorAll('a *').forEach((el) => {
      if (/^opens a new tab or window$/i.test(clean(el.textContent))) el.remove();
    });

    const hero = element.querySelector('section.new-hmk-brand-fifteenpercent-splash');
    const glossary = element.querySelector('div.glossary');
    if (!hero || !glossary) return;

    const bar = letterBar(document, glossary);
    const groups = letterGroups(document, glossary);
    hero.replaceWith(heroBlock(document, hero));
    glossary.replaceWith(
      marker(document, 'glossary-letters'),
      bar,
      marker(document, 'glossary'),
      ...groups,
    );
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
