/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: highmark subsidiary-home template cleanup.
 *
 * Template-specific cleanup for the `subsidiary-home` template
 * (https://www.highmark.com/health-options-de, https://www.highmark.com/wholecare).
 * Runs AFTER highmark-cleanup.js and BEFORE highmark-template-sections.js.
 *
 * Selectors verified against migration-work/cleaned.html (health-options-de):
 * - header .mobile-nav / div.mobile-nav.iparsys (cleaned.html:1055): mobile nav parsys
 *   inside the <header> (header itself is removed by highmark-cleanup.js afterTransform).
 * - div.home-page (cleaned.html:1396): subsidiary footer wrapper, sibling AFTER <main>.
 *   Holds .experiencefragment > .cmp-experiencefragment--hho-delaware-footer >
 *   .global-footer (cleaned.html:1398) and .footer-content.iparsys (cleaned.html:1628).
 * - #currentPage-name.d-none (cleaned.html:1641): empty hidden page-name holder
 *   (an id, not a class, in the source).
 * - li.listWideImg .typeTwoDiff (cleaned.html:1375): "Wholecare Call Center" + tel link,
 *   display:none on both source pages.
 * Nothing inside <main> is removed except the hidden .typeTwoDiff line.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

function isInsideMain(el) {
  return !!el.closest('main');
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // 1. Subsidiary-brand footer chrome (outside <main> only).
    element.querySelectorAll(
      '.experiencefragment:has(.global-footer), div.home-page, #currentPage-name, div.currentPage-name, header .mobile-nav, .mobile-nav.iparsys',
    ).forEach((el) => {
      if (el.isConnected && !isInsideMain(el)) el.remove();
    });

    // 2. Hidden help-card line (display:none on both source pages).
    WebImporter.DOMUtils.remove(element, ['li.listWideImg .typeTwoDiff']);
  }

  if (hookName === TransformHook.afterTransform) {
    // Leftover inline scripts/styles (the <video> is handled by its parser).
    WebImporter.DOMUtils.remove(element, ['script', 'style']);
  }
}
