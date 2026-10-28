/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: highmark site-wide cleanup.
 *
 * Removes non-authorable site chrome so the import contains only page-level
 * authorable content. All selectors below were verified by reading
 * migration-work/cleaned.html (line references are from that capture).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Widgets / overlays / modals that can interfere with parsing.
    WebImporter.DOMUtils.remove(element, [
      '#ZN_bmb74MCuuQ38dlc',   // Qualtrics website-feedback snippet (cleaned.html:2)
      '.mega-menu-overlay',    // nav mega-menu overlay (cleaned.html:81)
      '#modalIeDetect',        // legacy IE-detection modal (cleaned.html:1637)
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome.
    WebImporter.DOMUtils.remove(element, [
      'header',                          // fixed global header/nav (cleaned.html:6)
      '.footer-content.iparsys.parsys',  // global footer experience fragment incl. disclaimer (cleaned.html:2029)
      'div.col-md-12.col-lg-9',          // breadcrumb + print/share utility column (cleaned.html:1656), sibling of content col-lg-12
    ]);

    // Responsive duplicate copies. Highmark renders desktop (`.d-none.d-lg-block`)
    // and mobile (`.d-block.d-lg-none`) copies of the same default content (e.g. the
    // Health Insurance Glossary band's heading + paragraph). Block parsers already
    // dedupe their own blocks before this hook, so any remaining mobile-only copies
    // are default content — drop them so the import keeps a single copy.
    WebImporter.DOMUtils.remove(element, [
      '.d-block.d-lg-none',
    ]);

    // Leftover non-content elements.
    WebImporter.DOMUtils.remove(element, [
      'link',
      'noscript',
      'iframe',
    ]);
  }
}
