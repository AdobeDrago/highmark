/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: highmark section boundaries + section metadata (topic-hub-landing).
 *
 * The topic-hub-landing pages (/resources, /resources/mental-health-services) are
 * a run of sibling AEM components under div.page__par > section: the hero, card
 * blocks, one-card panels (div.onecard1colpanel) and card variations
 * (div.newcardscomponent-variations: a side panel, image and text, or wide cards).
 * Each component is its own section, in source order; the two pages have
 * different runs, so components are found by type, not by position.
 *
 * A section's style is its panel's brand colour:
 *   - new-hmk-brand-togatherblue (navy, white text)  -> dark, center
 *   - new-hmk-brand-blush-twnetyfive (pink)           -> highlight (centred text;
 *     plus `text-band` for a centred one-card callout: heading + copy + CTA)
 *   - new-hmk-brand-polar (pale blue)                 -> accent
 *   - new-hmk-brand-fifteenpercent-splash (light blue) -> light-blue
 *   - none (white)                                    -> no style
 * A side panel in pink is a columns band, not a centred one: `highlight, columns-band`.
 *
 * Follows the reference before/after hook + marker pattern: breaks are inserted
 * in beforeTransform (while every section element still exists, before block
 * parsers can replace them), and Section Metadata is inserted in afterTransform
 * anchored to the marker <hr>.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';
const SECTION_STYLE_ATTR = 'data-excat-section-style';

const COMPONENTS = [
  'div.hero.responsivegrid.section',
  'div.card-block.responsivegrid.section',
  'div.onecard1colpanel.section',
  'div.newcardscomponent-variations.section',
].join(', ');

const BRAND_STYLES = [
  ['new-hmk-brand-togatherblue', 'dark, center'],
  ['new-hmk-brand-blush-twnetyfive', 'highlight'],
  ['new-hmk-brand-polar', 'accent'],
  ['new-hmk-brand-fifteenpercent-splash', 'light-blue'],
];

/** The section style of a component, from its panel's brand colour (the hero's
 * own colour is the block's). */
function styleFor(component) {
  // the newer hero (text in the left two thirds, the photo setting the height)
  if (component.matches('div.hero.section')) return component.querySelector('.hero-content-container') ? 'hero-wide' : '';
  const panel = component.querySelector('.one-card-one-col-panel, .side-card-panel') || component;
  const own = (panel.className || '').toString();
  const brand = BRAND_STYLES.find(([cls]) => own.includes(cls))
    || BRAND_STYLES.find(([cls]) => panel.querySelector(`.${cls}`));
  if (!brand) return '';
  const [cls, style] = brand;
  if (cls.includes('blush') && panel.matches('.one-card-one-col-panel')
    && panel.querySelector('.one-card-content-center-container')) return `${style}, text-band`;
  if (cls.includes('blush') && panel.matches('.side-card-panel')) return `${style}, columns-band`;
  return style;
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // The source's screen-reader context in links (", Are you or a loved one in
    // crisis?") would join the visible label in the import, as it does on no page here.
    element.querySelectorAll('a .hmk-visually-hidden').forEach((span) => span.remove());

    // A component nested in another (none today) stays in its parent's section.
    const components = [...element.querySelectorAll(COMPONENTS)]
      .filter((c) => !c.parentElement.closest(COMPONENTS));
    components.forEach((component, i) => {
      const style = styleFor(component);
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
    // Parsers may have replaced the components; the markers survive.
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
