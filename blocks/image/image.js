/**
 * Image: one picture at a share of the text column, as the source's image component
 * (a span of its 12-column grid, optionally offset). Options: span-<n> (of 12) and
 * offset-<n>, e.g. Image (span-8, offset-2). The CSS does the sizing.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');
  if (picture) block.replaceChildren(picture);
}
