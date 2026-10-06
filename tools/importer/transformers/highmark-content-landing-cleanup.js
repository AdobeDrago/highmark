/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: highmark content-landing template cleanup.
 *
 * Template-specific cleanup for the `content-landing` template
 * (https://www.highmark.com/podcast, https://www.highmark.com/public-policy).
 * Runs AFTER highmark-cleanup.js and BEFORE highmark-template-sections.js.
 *
 * Selectors verified against the raw source HTML of both pages:
 * - div.page__par hr: 20 decorative <hr /> on podcast (one per episode + after "Episodes")
 * - div.video.aem-GridColumn: empty video component (podcast Episode 15)
 * - div.spacing / section.spacing-transparent: AEM spacer components (podcast)
 * - div.d-none.d-lg-block.col-lg-3 / .col-lg-2: left/right rails; podcast's right rail
 *   only holds a spacer, public-policy's rails are empty. The podcast left rail
 *   (aside with img.image-comp-img) is kept for the columns-minimal-dark parser.
 * - <a name="s1e1" id="s1e1"></a>, <a id="s1e2"></a>: empty in-heading anchor targets
 * - public-policy has no <h1>; its first page__par heading is an <h2>
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const HOME_PREFIX = '/content/digital-marketing/en/highmark/highmarkdotcom/home';
const HIGHMARK_HOST = /^https?:\/\/(www\.)?highmark\.com(?=[/?#]|$)/i;

function hasContent(el) {
  return el.textContent.trim() !== '' || !!el.querySelector('img, picture, video, iframe, table');
}

/**
 * Normalize a highmark.com href to a relative EDS path.
 * Returns null when the href should be left untouched.
 */
function normalizeHref(href) {
  if (!href) return null;
  let value = href.trim();
  const isAbsolute = HIGHMARK_HOST.test(value);
  if (isAbsolute) value = value.replace(HIGHMARK_HOST, '') || '/';
  else if (!value.startsWith('/') || value.startsWith('//')) return null; // external, anchor, mailto, etc.

  // DAM documents: absolute ones stay absolute on www.highmark.com; relative ones
  // are left for highmark-cleanup.js (afterTransform) to make absolute.
  if (value.startsWith('/content/dam/')) {
    return isAbsolute ? `https://www.highmark.com${value}` : null;
  }

  const match = value.match(/^([^?#]*)(.*)$/);
  let path = match[1];
  const suffix = match[2];

  if (path === HOME_PREFIX || path === `${HOME_PREFIX}.html`) {
    path = '/';
  } else if (path.startsWith(`${HOME_PREFIX}/`)) {
    path = path.substring(HOME_PREFIX.length);
  }
  path = path.replace(/\.html$/i, '') || '/';

  return `${path}${suffix}`;
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // 1. Decorative dividers would become section breaks in EDS.
    WebImporter.DOMUtils.remove(element, ['div.page__par hr']);

    // 2. Empty AEM component wrappers / spacers.
    WebImporter.DOMUtils.remove(element, [
      'div.spacing',
      'section.spacing-transparent',
    ]);
    element.querySelectorAll('div.video').forEach((v) => {
      if (!hasContent(v)) v.remove();
    });
    // Left/right rails with no image/text (cover-image rail is kept).
    element.querySelectorAll('div.d-none.d-lg-block[class*="col-lg-"]').forEach((rail) => {
      if (!hasContent(rail)) rail.remove();
    });

    // 3. Normalize internal links.
    element.querySelectorAll('a[href]').forEach((a) => {
      const normalized = normalizeHref(a.getAttribute('href'));
      if (normalized !== null) a.setAttribute('href', normalized);
    });

    // 4. Empty anchor-only name/id targets (e.g. inside episode headings).
    element.querySelectorAll('a:not([href])').forEach((a) => {
      if (!hasContent(a)) a.remove();
    });

    // 4b. A line break at the end of an inline wrapper (<a><b>WATCH VIDEO<br></b></a>
    // <sub>See disclaimer below</sub>) is dropped by the importer, gluing the CTA to
    // the note that follows; move it after the outermost inline wrapper instead.
    element.querySelectorAll('div.page__par p br').forEach((br) => {
      const isLast = (n) => {
        let next = n.nextSibling;
        while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
        return !next;
      };
      let parent = br.parentElement;
      while (parent && parent.tagName !== 'P' && /^(A|B|STRONG|I|EM|SPAN)$/.test(parent.tagName) && isLast(br)) {
        parent.after(br);
        parent = br.parentElement;
      }
    });

    // 4c. Bold heading text marked only by an inline style
    // (<h2><span style="letter-spacing: -0.1px;font-weight: bolder;">, public-policy)
    // would lose its weight; keep it as <strong>. Paragraph spans are left alone:
    // "bolder" on 300-weight body copy is regular weight, not bold.
    element.querySelectorAll('div.page__par :is(h1, h2, h3, h4, h5, h6) span[style]').forEach((span) => {
      if (!/font-weight\s*:\s*(bold|bolder|[6-9]00)\b/i.test(span.getAttribute('style'))) return;
      const strong = span.ownerDocument.createElement('strong');
      while (span.firstChild) strong.appendChild(span.firstChild);
      span.replaceWith(strong);
    });

    // 5. Ensure one <h1>: promote the first content heading when none exists.
    const par = element.querySelector('div.page__par');
    // Scoped to <main>: the global header (removed later, in afterTransform) is still here.
    if (par && !element.querySelector('main h1, div.page__par h1')) {
      const first = par.querySelector('h2, h3, h4, h5, h6');
      if (first) {
        const h1 = first.ownerDocument.createElement('h1');
        while (first.firstChild) h1.appendChild(first.firstChild);
        first.replaceWith(h1);
      }
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Inline component clientlib scripts left in the content.
    WebImporter.DOMUtils.remove(element, ['script']);
  }
}
