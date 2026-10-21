/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata (spending-account pages:
 * /resources/spending-accounts/health-saving-account-hsa, ...-hra).
 *
 * The source page is a run of sibling AEM components: the title band
 * (section.container-fluid-fullwidth holding the h1), the quick-link bar, a centred
 * intro (div.onecard1colpanel), side panels (div.newcardscomponent-variations: text
 * and a photo), text-card grids (div.card-block) and full-width text sections
 * (section.container-fluid-fullwidth: "How HSAs Work", the tables, the footnotes).
 * Each component is its own section, in source order, found by type.
 *
 * Section styles:
 *   - title band (global-helionlightblue)          -> title-band
 *   - centred intro                                -> intro
 *   - footnotes (the last text section, all <sup>s) -> footnotes
 *   - a band's own brand colour: polar -> accent, blush -> highlight,
 *     papergrey -> grey (for side panels, the panel's colour)
 *   - a side panel with its photo on the left (.image-area.left-content) adds image-left
 *
 * Follows the reference before/after hook + marker pattern: breaks are inserted in
 * beforeTransform (while every component still exists), Section Metadata in
 * afterTransform next to the marker that survives the parsers.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';
const SECTION_STYLE_ATTR = 'data-excat-section-style';

const COMPONENTS = [
  'section.container-fluid-fullwidth.section',
  'div.quicklinks.section',
  'div.onecard1colpanel.section',
  'div.newcardscomponent-variations.section',
  'div.card-block.section',
].join(', ');

const BRAND_STYLES = [
  ['new-hmk-brand-polar', 'accent'],
  ['new-hmk-brand-blush-twnetyfive', 'highlight'],
  ['new-hmk-brand-papergrey', 'grey'],
];

/** The band's own colour: the class on its first coloured wrapper (a table's header
 * colours further in don't count). */
function brandOf(el) {
  const own = (e) => BRAND_STYLES.find(([cls]) => (e?.className || '').toString().split(/\s+/).includes(cls));
  let found = own(el);
  for (let e = el.firstElementChild; !found && e; e = e.firstElementChild) found = own(e);
  return found ? found[1] : '';
}

function styleFor(component, isLast) {
  if (component.matches('section.container-fluid-fullwidth') && component.querySelector('h1')) return 'title-band';
  if (component.matches('div.quicklinks.section, div.card-block.section')) return '';
  if (component.matches('div.onecard1colpanel.section')) return 'intro';
  if (component.matches('div.newcardscomponent-variations.section')) {
    const panel = component.querySelector('.side-card-panel');
    const styles = [panel ? brandOf(panel) : ''];
    if (component.querySelector('.image-area.left-content')) styles.push('image-left');
    // copy that is bare text in a div (no <p>) has the source's plain 16/24 style
    if ([...component.querySelectorAll('.text-area > div')].some((d) => !d.children.length && d.textContent.trim())) styles.push('plain-copy');
    return styles.filter(Boolean).join(', ');
  }
  if (isLast && component.querySelector('sup') && !component.querySelector('h2, table')) return 'footnotes';
  const inner = component.querySelector(':scope > .parent-width > section') || component;
  return brandOf(inner);
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // A band that only wraps whole components (FSA's "How FSAs Work": the table band,
    // a side panel and the footnotes) gives way to them, so each is its own section.
    element.querySelectorAll('section.container-fluid-fullwidth.section').forEach((band) => {
      const grid = band.querySelector(':scope > .parent-width > section > .aem-Grid');
      const inner = grid ? [...grid.children] : [];
      const isComponent = (c) => c.matches('section.container-fluid-fullwidth, div.newcardscomponent-variations');
      if (inner.length < 2 || !inner.every(isComponent)) return;
      inner.forEach((c) => c.classList.add('section'));
      band.replaceWith(...inner);
    });

    const components = [...element.querySelectorAll(COMPONENTS)]
      .filter((c) => !c.parentElement.closest(COMPONENTS));
    components.forEach((component, i) => {
      const style = styleFor(component, i === components.length - 1);
      if (i === 0 && !style) return; // first section: no leading break
      // the first section gets no break, only a placeholder for its metadata
      const marker = document.createElement(i === 0 ? 'div' : 'hr');
      if (style) {
        marker.setAttribute(SECTION_MARKER_ATTR, `section-${i + 1}`);
        marker.setAttribute(SECTION_STYLE_ATTR, style);
      }
      component.before(marker);
    });
  }

  if (hookName === 'afterTransform') {
    element.querySelectorAll(`[${SECTION_MARKER_ATTR}]`).forEach((marker) => {
      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: marker.getAttribute(SECTION_STYLE_ATTR) },
      });
      if (marker.tagName === 'DIV') {
        marker.replaceWith(metadataBlock);
        return;
      }
      marker.after(metadataBlock);
      marker.removeAttribute(SECTION_MARKER_ATTR);
      marker.removeAttribute(SECTION_STYLE_ATTR);
    });
  }
}
