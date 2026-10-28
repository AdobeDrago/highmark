/*
 * Provider panel: providers.highmark.com's tinted boxes in an article.
 *
 * Authoring:
 * - Provider Panel: one cell holding the box's content (the source's grey "Additional
 *   Information" boxes).
 * - Provider Panel (region): one row per panel, [regions | content]; the regions, comma-separated
 *   (e.g. "WPA/NEPA, CPA/SEPA"), show as navy badges over the content, on the source's pink.
 *   Add "plain" for a region panel without the tint.
 */
function badges(text) {
  const list = document.createElement('ul');
  list.className = 'provider-panel-regions';
  list.setAttribute('aria-label', 'Regions');
  text.split(',').map((r) => r.trim()).filter(Boolean).forEach((r) => {
    const li = document.createElement('li');
    li.textContent = r;
    list.append(li);
  });
  return list;
}

export default function decorate(block) {
  const region = block.classList.contains('region');
  const panels = [...block.children].map((row) => {
    const cells = [...row.children];
    const panel = document.createElement('div');
    panel.className = 'provider-panel-item';
    if (region && cells.length > 1) {
      panel.append(badges(cells[0].textContent), ...cells[1].childNodes);
    } else {
      cells.forEach((cell) => panel.append(...cell.childNodes));
    }
    return panel;
  });
  block.replaceChildren(...panels);
}
