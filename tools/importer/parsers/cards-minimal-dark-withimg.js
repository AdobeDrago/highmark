/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-minimal-dark-withimg. Base: cards.
 * Source: https://www.highmark.com/resources (div.card-block.responsivegrid.section)
 * Generated: 2026-08-17
 *
 * Block library structure (2 columns, N rows):
 *   Row 1: block name
 *   Each card row: [ image | heading + description + CTA link ]
 *
 * Source note: the matched section also contains a centered intro
 * (H2 "How can we help?" + description) that is default content, not part of
 * the cards block. It is preserved as default content emitted before the block.
 *
 * Also verified (no code change) on https://www.highmark.com/plans/individual-families
 * section 5 (section.new-hmk-brand-papergrey .card-block.responsivegrid).
 */
export default function parse(element, { document }) {
  // --- Leading default content (intro heading + description) ---
  const introEls = [];
  const introContainer = element.querySelector('.cardBlockTitleContainer');
  if (introContainer) {
    const introHeading = introContainer.querySelector('h1, h2, h3');
    const introDesc = introContainer.querySelector('.cardDescription, p');
    if (introHeading) introEls.push(introHeading);
    if (introDesc) introEls.push(introDesc);
  }

  // --- Cards ---
  let cards = Array.from(element.querySelectorAll('.card.cardBlock, .cardBlock, .card'));

  // Additive branch (about/our-story/leadership-team-board): people cards
  //   div.gridcontrol .hmk-col-lg-3 > .cardwrapper > section.hmk-home_cardwrapper
  //     > .hmk-homewrapper_img img.card-wrapper-img
  //     + .hmk-homewrapper_content > .hmk-cardwrapper_title a (name -> bio page),
  //       p.hmk-homecarddesc (job title), .hmk-brand-buttons a ("Read Bio", LinkedIn icon)
  // Rows keep the library structure: [ photo | name heading + title + Read Bio + LinkedIn ].
  if (!cards.length) {
    const people = Array.from(element.querySelectorAll('section.hmk-home_cardwrapper'));
    if (people.length) {
      const peopleCells = people.map((person) => {
        const photo = person.querySelector('img');
        const nameLink = person.querySelector('.hmk-cardwrapper_title a');
        const h3 = document.createElement('h3');
        if (nameLink) {
          const a = document.createElement('a');
          a.setAttribute('href', nameLink.getAttribute('href'));
          a.textContent = nameLink.textContent.trim();
          h3.append(a);
        }
        const text = [h3];
        const desc = person.querySelector('p.hmk-homecarddesc');
        if (desc) text.push(desc);
        person.querySelectorAll('.hmk-brand-buttons a[href]').forEach((a) => {
          const p = document.createElement('p');
          const link = document.createElement('a');
          link.setAttribute('href', a.getAttribute('href'));
          // the LinkedIn CTA is an icon-only link on the source; give it a text label
          link.textContent = a.querySelector('.fa-linkedin') ? 'LinkedIn' : a.textContent.trim();
          p.append(link);
          text.push(p);
        });
        return [photo || '', text];
      });
      element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'cards-minimal-dark-withimg', cells: peopleCells }));
      return;
    }
  }

  // Additive fallback (mental-health topic pages, e.g. "Anxiety types and treatments"):
  // shadowed small-image card list
  //   .cards-variation > .container-sm-img
  //     > div > h2.cardsTitle, div > p.cardsPara                 -> default content BEFORE block
  //     > ul.cardul > li.cardThree.listSmlImg
  //         > img.smallImage + div.typeThreeTxt > h3.titleHead, hr.breakLineNone,
  //           span.cardsText p, .hmk-brand-buttons a.textButton
  // Only used when no .cardBlock cards exist, so the card-block path is unchanged.
  // Rows keep the library structure: [ image | heading + description + CTA ];
  // the shared card loop below reads h3.titleHead, span.cardsText p and a.textButton.
  if (!cards.length) {
    cards = Array.from(element.querySelectorAll('li.cardThree'))
      .filter((li) => li.querySelector('picture, img'));
    if (cards.length) {
      const introHeading = element.querySelector('h2.cardsTitle');
      if (introHeading) introEls.push(introHeading);
      introEls.push(...Array.from(element.querySelectorAll('p.cardsPara')));
    }
  }

  // Empty-block guard
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // A card heading is sometimes wrapped in a non-navigating anchor
  // (source uses <a class="headNoLink"> with no href as a plain-text label).
  // EDS would serialize that as <a href=""> — a broken/empty link. Unwrap any
  // heading anchor that lacks a usable href so the heading stays plain text.
  const unwrapDeadHeadingLinks = (heading) => {
    if (!heading) return;
    heading.querySelectorAll('a').forEach((a) => {
      const href = (a.getAttribute('href') || '').trim();
      if (!href || href === '#') {
        a.replaceWith(...a.childNodes);
      }
    });
  };

  const cells = [];
  cards.forEach((card) => {
    const image = card.querySelector('picture, img');
    const heading = card.querySelector('h1, h2, h3, h4, [class*="title"]');
    unwrapDeadHeadingLinks(heading);
    const paragraphs = Array.from(card.querySelectorAll('.cardText > p, p'));
    // Exclude anchors with no usable href (non-navigating heading labels).
    const links = Array.from(card.querySelectorAll('a.textButton, a.button, a[class*="button"], a'))
      .filter((a) => {
        const href = (a.getAttribute('href') || '').trim();
        return href && href !== '#';
      });

    const contentCell = [];
    if (heading) contentCell.push(heading);
    contentCell.push(...paragraphs);
    contentCell.push(...links);

    // 2-column row: [ image | content ]
    cells.push([image || '', contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-minimal-dark-withimg', cells });
  element.replaceWith(...introEls, block);
}
