/*
 * Provider side navigation (providers.highmark.com's .side-navigation).
 *
 * Authoring: one cell holding a link to the section's side-nav fragment, e.g.
 * /providers/fragments/sidenav/claims. The fragment is the section's whole tree as nested
 * lists (the landing page, then every page below it); edit it once for the section.
 *
 * Like the source, the block shows the part of the tree around the current page: its parent
 * at the top, the parent's children below it, the current page bold and expanded to its own
 * children. Items with children of their own have a toggle; :lock: after an item marks a page
 * behind the Availity login.
 */
import { decorateIcons } from '../../scripts/aem.js';

const pathOf = (href) => new URL(href, window.location.href).pathname
  .replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/$/, '$1');

const linkOf = (li) => li.querySelector(':scope > a');
const listOf = (li) => li.querySelector(':scope > ul');

function addToggle(li, open) {
  const label = linkOf(li)?.textContent.trim() || '';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'provider-sidenav-toggle';
  const set = (expanded) => {
    li.classList.toggle('open', expanded);
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    button.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} ${label}`);
  };
  button.addEventListener('click', () => set(!li.classList.contains('open')));
  set(open);
  linkOf(li)?.after(button);
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const source = link ? link.getAttribute('href') : block.textContent.trim();
  block.textContent = '';
  if (!source) return;

  const resp = await fetch(`${pathOf(source)}.plain.html`);
  if (!resp.ok) return;
  const fragment = document.createElement('div');
  fragment.innerHTML = await resp.text();
  const tree = fragment.querySelector('ul');
  if (!tree) return;
  // the pipeline wraps an item's link in a <p> (always when it has a sub-list); unwrap it
  tree.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));

  // the current page's item: the one linking here
  const here = pathOf(window.location.href);
  const items = [...tree.querySelectorAll('li')];
  const current = items.find((li) => linkOf(li) && pathOf(linkOf(li).href) === here);
  // its parent heads the nav; without a match, the section's landing page does
  const parent = current?.parentElement.closest('li') || tree.querySelector(':scope > li');
  if (!parent || !listOf(parent)) return;

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'In this section');
  const root = linkOf(parent).cloneNode(true);
  root.className = 'provider-sidenav-root';
  const list = listOf(parent);
  list.className = 'provider-sidenav-list';

  [...list.querySelectorAll('li')].forEach((li) => {
    const isCurrent = li === current;
    if (isCurrent) {
      li.classList.add('current');
      linkOf(li)?.setAttribute('aria-current', 'page');
    }
    // the current page's own children show; deeper levels and other branches start closed
    if (listOf(li)) addToggle(li, isCurrent);
  });

  nav.append(root, list);
  decorateIcons(nav);
  nav.querySelectorAll('.icon-lock img').forEach((img) => { img.alt = 'Availity login required'; });
  block.append(nav);
}
