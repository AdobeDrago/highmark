/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-minimal-dark-withimg. Base: hero.
 * Source: https://www.highmark.com/resources (div.hero.responsivegrid.section)
 * Generated: 2026-08-17
 *
 * Block library structure (1 column, 3 rows):
 *   Row 1: block name
 *   Row 2: Background image (optional)
 *   Row 3: Title (heading) + Subheading + optional CTA
 *
 * Source note: the hero renders duplicate desktop (.d-lg-block) and mobile
 * (.d-lg-none) content wrappers with the same heading/subheading. We select a
 * single content wrapper (desktop preferred) to avoid duplicated text.
 */
export default function parse(element, { document }) {
  // Additive branch (plans/d-snp, plans/medicaid, get-help, blue-neighbors, find-care):
  // div.secondary-banner.responsivegrid
  //   .secondaryBannerContent > picture (img.desktopImage = desktop rendition)
  //     + .contentWrapper > h1.bannerHeadingText + h2.bannerSubHeadingText, each twice:
  //       mobile (.d-block.d-lg-none) first, then desktop (.d-lg-block.d-none)
  //     + .buttonGroup (usually empty)
  // Same block structure: Row 2 [ background image ], Row 3 [ title + subheading + CTA ].
  const banner = element.querySelector('.secondaryBannerContent');
  if (banner) {
    const bannerImg = banner.querySelector('img.desktopImage') || banner.querySelector('picture img, img');
    const wrapper = banner.querySelector('.contentWrapper') || banner;
    const pick = (sel) => wrapper.querySelector(`${sel}.d-lg-block`) || wrapper.querySelector(sel);
    // Re-create headings without the responsive visibility classes (d-none) so they survive.
    const clean = (el) => {
      if (!el) return null;
      const h = document.createElement(el.tagName.toLowerCase());
      h.textContent = el.textContent.replace(/\s+/g, ' ').trim();
      return h;
    };
    const title = clean(pick('h1.bannerHeadingText') || wrapper.querySelector('h1'));
    const sub = clean(pick('.bannerSubHeadingText'));
    const ctas = Array.from(wrapper.querySelectorAll('.buttonGroup a[href]'));
    if (!title && !sub && !bannerImg) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const bannerCells = [];
    if (bannerImg) bannerCells.push([bannerImg]);
    bannerCells.push([[title, sub, ...ctas].filter(Boolean)]);
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'hero-minimal-dark-withimg', cells: bannerCells }));
    return;
  }

  // --- Background image (Row 2, optional) ---
  const bgImage = element.querySelector('picture img, img[class*="image"], img');

  // --- Content: prefer the desktop wrapper, fall back to any content wrapper ---
  // Hero sections (div.hero.responsivegrid) always resolve to a .content-wrapper.
  const heroWrapper = element.querySelector('.left-content.d-lg-block .content-wrapper')
    || element.querySelector('.left-content .content-wrapper')
    || element.querySelector('.content-wrapper');
  // Additive fallback (plans page, div.onecard1colpanel image banner): content lives in
  // .one-card-content-left-container (H2 + .body-text paragraph + button). Only used
  // when no hero .content-wrapper exists, so existing hero output is unchanged.
  const contentWrapper = heroWrapper
    || element.querySelector('.one-card-content-left-container')
    || element;

  let heading = contentWrapper.querySelector('h1, h2, .banner-heading, [class*="banner-heading"]');
  // Additive fallback (onecard banner only): its headings carry responsive visibility
  // classes (h2.d-none.d-lg-block) that get the heading dropped during conversion.
  // Re-create it as a plain heading of the same level so the text survives.
  if (!heroWrapper && heading && /\bd-none\b|\bd-lg-none\b/.test(heading.className || '')) {
    const cleanHeading = document.createElement(heading.tagName.toLowerCase());
    cleanHeading.append(...heading.childNodes);
    heading = cleanHeading;
  }
  const subheading = contentWrapper.querySelector('h2.banner-sub-heading-sub, h3.banner-sub-heading-sub, .banner-sub-heading-sub, [class*="sub-heading"]');
  const ctaLinks = Array.from(contentWrapper.querySelectorAll('a.button, a.cta, a[class*="cta"], a[class*="button"]'));

  // Additive fallback (onecard banner only): its <img> is the 375px mobile rendition;
  // the desktop rendition is on <source media="(min-width: 992px)">. Promote it.
  if (!heroWrapper && bgImage) {
    const desktopSource = bgImage.closest('picture')?.querySelector('source[media*="992"][srcset]');
    const desktopSrc = desktopSource && desktopSource.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0];
    if (desktopSrc) bgImage.setAttribute('src', desktopSrc);
  }

  // Additive fallback: body paragraph(s) from .body-text when there is no sub-heading
  // and no hero .content-wrapper. The desktop copy (.d-lg-block) is preferred so the
  // mobile duplicate (.d-lg-none) is never emitted as well.
  const bodyParas = [];
  if (!heroWrapper && !subheading) {
    const bodyText = contentWrapper.querySelector('.body-text.d-lg-block')
      || contentWrapper.querySelector('.body-text');
    if (bodyText) {
      const paras = Array.from(bodyText.querySelectorAll(':scope > p'));
      if (paras.length) {
        bodyParas.push(...paras);
      } else if (bodyText.textContent.trim()) {
        const p = document.createElement('p');
        p.append(...bodyText.childNodes);
        bodyParas.push(p);
      }
    }
  }

  // Empty-block guard
  if (!heading && !subheading && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 3: single cell holding title + subheading + CTA(s)
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (subheading) contentCell.push(subheading);
  contentCell.push(...bodyParas);
  contentCell.push(...ctaLinks);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-minimal-dark-withimg', cells });
  element.replaceWith(block);
}
