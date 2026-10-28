export default function decorate(block) {
  /* Icon quick-nav bar: each row = one nav item (icon + linked label).
     Render as a single horizontal <ul> of links. */
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-minimal-dark-iconnav-item';

    // Collect the icon (EDS icon span or material-icons token) and the link/label.
    const anchor = row.querySelector('a');
    const link = document.createElement('a');
    if (anchor) {
      link.href = anchor.getAttribute('href') || '#';
      if (anchor.title) link.title = anchor.title;
    }
    link.className = 'cards-minimal-dark-iconnav-link';

    // Icon: prefer an EDS icon span, else the first cell's material-icon
    // ligature token (e.g. "warning_amber", "list_alt").
    const iconSpan = row.querySelector('span.icon, i');
    const icon = document.createElement('span');
    icon.className = 'cards-minimal-dark-iconnav-icon';
    if (iconSpan) {
      icon.append(...iconSpan.childNodes);
      if (iconSpan.className && iconSpan.className.includes('icon-')) {
        icon.classList.add(...[...iconSpan.classList].filter((c) => c.startsWith('icon')));
      }
    } else {
      // First cell holds the Material Icons ligature name as plain text.
      const firstCell = row.querySelector(':scope > div');
      const token = firstCell ? firstCell.textContent.trim() : '';
      if (token) icon.textContent = token;
    }
    link.append(icon);

    // Label: the anchor text (or the last cell's text).
    const label = document.createElement('span');
    label.className = 'cards-minimal-dark-iconnav-label';
    const labelText = anchor ? anchor.textContent.trim() : row.textContent.trim();
    label.textContent = labelText;
    link.append(label);

    li.append(link);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
