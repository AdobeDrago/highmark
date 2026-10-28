/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: highmark campaign-landing template cleanup.
 *
 * Template-specific cleanup for the `campaign-landing` template
 * (https://www.highmark.com/because-life, /health-options-wv, /ventures).
 * Runs AFTER highmark-cleanup.js and BEFORE highmark-template-sections.js.
 *
 * Unlike highmark-subsidiary-home-cleanup.js this does NOT drop div.home-page
 * wholesale: on /ventures the closing CTA band
 * (div.home-page > div.onecard1colpanel.section > .new-hmk-brand-blush-twnetyfive,
 * "Let's change healthcare" + CONTACT US; template section 12) lives in
 * div.home-page, outside <main>. Only chrome inside/around it is removed.
 *
 * Selectors verified (B = /tmp/analysis-because-life/cleaned.html,
 * W = /tmp/analysis-wv/cleaned.html, V = /tmp/analysis-ventures/cleaned.html,
 * raw = /tmp/src-*.html):
 * - div.home-page: after </main> on all three (B:2009, W:1261, V:273).
 * - .experiencefragment:has(.global-footer): footer XF -- B (cmp-experiencefragment--main-footer,
 *   inside .footer-content.iparsys), W (cmp-experiencefragment--hho-wv-footer, in div.home-page).
 * - div.global-footer.section / section#hmk-global-footer: V:307-308 (no XF wrapper on ventures).
 * - .footer-content.iparsys + .iparys_inherited: B:2014-2015, W:1493-1494, V:435-436.
 * - div.section > div.new (empty): V:432 (also B:2011, W:1490 as bare div.new).
 * - #currentPage-name.d-none: B:2310, W:1507, V:449.
 * - Header chrome (removed only if it ends up outside <header> and <main> after parsing):
 *   div.mobilenavigation.section (V:110), .mobilenavigation / .mobilenavigation-new (W:472, B:825),
 *   .mobile-nav.iparsys (all), nav#conf-menu-expand (all), div.newheaderbar (all),
 *   div.newmainnavigation (V:24), XF .cmp-experiencefragment--hho-wv-header (W:8) and
 *   --highmark-nav (B:17, B:71).
 * - li.listWideImg .typeTwoDiff: W:1213 / raw src-health-options-wv.html:1834
 *   ("Wholecare Call Center" + tel), hidden on the source.
 * - svg.externalIcon: decorative external-link icon inside CTA links,
 *   raw src-health-options-wv.html:1661, 1687, 1772.
 * - /content/digital-marketing/en/highmark/highmarkdotcom/home/... hrefs: raw src-ventures.html
 *   (ventures/portfolio, /team, /contact, /approach), src-because-life.html, src-health-options-wv.html.
 *   Not handled by any other highmark transformer (highmark-cleanup.js only rewrites /content/dam/).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const AEM_HOME_PREFIX = '/content/digital-marketing/en/highmark/highmarkdotcom/home';

// Chrome that must be removed when it sits outside <main> (and outside <header>,
// which highmark-cleanup.js removes as a whole in afterTransform).
const OUTSIDE_MAIN_CHROME = [
  // footer
  '.experiencefragment:has(.global-footer)',
  '.experiencefragment:has(#hmk-global-footer)',
  'div.global-footer.section',
  'div.global-footer',
  'section#hmk-global-footer',
  '.footer-content.iparsys',
  '.iparys_inherited',
  'div.section:has(> div.new)',
  'div.new',
  '#currentPage-name',
  // header / mobile nav / search bar / breadcrumb row (layouts without a <header>
  // element; highmark-cleanup.js removes <header> itself in afterTransform)
  '.experiencefragment:has(.main-search-bar)',
  'div.breadcrumb',
  '.experiencefragment:has(.cmp-experiencefragment--hho-wv-header)',
  '.experiencefragment:has(.cmp-experiencefragment--highmark-nav)',
  'div.mobilenavigation.section',
  'div.mobilenavigation',
  'div.mobilenavigation-new',
  '.mobile-nav.iparsys',
  'nav#conf-menu-expand',
  'div.newheaderbar',
  'div.newmainnavigation',
];

function isInsideMain(el) {
  return !!el.closest('main');
}

function rewriteAemPath(href) {
  if (!href) return href;
  let url = href;
  const absPrefix = `https://www.highmark.com${AEM_HOME_PREFIX}`;
  if (url.startsWith(absPrefix)) url = url.slice('https://www.highmark.com'.length);
  if (!url.startsWith(AEM_HOME_PREFIX)) return href;
  const rest = url.slice(AEM_HOME_PREFIX.length);
  if (rest && !/^[/.?#]/.test(rest)) return href; // e.g. /home-something: not our prefix
  const m = rest.match(/^([^?#]*)(.*)$/);
  let path = m[1].replace(/\.html$/, '');
  const suffix = m[2];
  if (!path || path === '/') path = '/';
  return `${path}${suffix}`;
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // 1. Footer/header chrome outside <main>. Keep the closing CTA band
    //    (div.home-page > div.onecard1colpanel.section) -- it never matches these selectors.
    OUTSIDE_MAIN_CHROME.forEach((sel) => {
      let nodes = [];
      try {
        nodes = [...element.querySelectorAll(sel)];
      } catch (e) {
        nodes = [];
      }
      nodes.forEach((el) => {
        if (!el.isConnected || isInsideMain(el)) return;
        if (el.querySelector('main')) return; // mis-nested wrapper around <main>: keep
        if (el.closest('div.onecard1colpanel.section')) return; // never touch the CTA band
        if (el.querySelector('div.onecard1colpanel.section')) return; // never remove its ancestor
        el.remove();
      });
    });

    // 2. Hidden help-card line (display:none on the source, W).
    WebImporter.DOMUtils.remove(element, ['li.listWideImg .typeTwoDiff']);

    // 3. Decorative external-link icons inside CTA links (W).
    WebImporter.DOMUtils.remove(element, ['svg.externalIcon', '.externalIcon']);

    // 4. Script-driven "FIND CARE" CTA (B: a#doctors-and-drugs href="#0", which the
    //    source's JS sends through its location picker to Find Care). Point it at our
    //    Find Care page so it isn't a dead "#0" link.
    element.querySelectorAll('main a#doctors-and-drugs').forEach((a) => {
      const href = (a.getAttribute('href') || '').trim();
      if (!href || href === '#' || href === '#0') a.setAttribute('href', '/member/member-guide/find-care');
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Source-internal AEM paths -> site-relative paths.
    element.querySelectorAll('a[href*="/content/digital-marketing/en/highmark/highmarkdotcom/home"]').forEach((a) => {
      const href = a.getAttribute('href');
      const next = rewriteAemPath(href);
      if (next !== href) a.setAttribute('href', next);
    });

    // Leftover inline scripts/styles.
    WebImporter.DOMUtils.remove(element, ['script', 'style']);
  }
}
