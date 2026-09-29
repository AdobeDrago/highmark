/*
 * Breadcrumbs
 * Auto-built under the header on pages with the `Breadcrumbs: true` metadata.
 * The trail is derived from the URL path: every ancestor path that exists as a
 * page is shown, labelled with its `Breadcrumb Title` metadata or, failing that,
 * its title without the " | …" site suffix. Missing ancestors are skipped.
 */

import { getMetadata } from '../../scripts/aem.js';

/** Strip the SEO suffix from a page title ("CHIP Resources | Highmark …"). */
function shortTitle(title) {
  return (title || '').split(' | ')[0].trim();
}

/**
 * Breadcrumb label for a parsed page document.
 * @param {Document} doc
 * @returns {string}
 */
function labelFromDocument(doc) {
  const own = doc.querySelector('meta[name="breadcrumb-title"]')?.content;
  if (own) return own.trim();
  const title = doc.querySelector('meta[property="og:title"]')?.content || doc.title;
  return shortTitle(title);
}

/**
 * Ancestor paths of a pathname, outermost first, excluding the root and the page itself.
 * @param {string} pathname e.g. /western-pennsylvania/chip/doctors-drugs
 * @returns {string[]} e.g. ['/western-pennsylvania', '/western-pennsylvania/chip']
 */
export function ancestorPaths(pathname) {
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  segments.pop();
  return segments.map((_, i) => `/${segments.slice(0, i + 1).join('/')}`);
}

/**
 * Fetches an ancestor page and returns its crumb, or null when it doesn't exist.
 * @param {string} path
 * @returns {Promise<{path: string, label: string}|null>}
 */
async function fetchCrumb(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return null;
    const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
    const label = labelFromDocument(doc);
    return label ? { path, label } : null;
  } catch {
    return null;
  }
}

function crumbItem(label, href) {
  const li = document.createElement('li');
  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    li.append(a);
  } else {
    li.textContent = label;
    li.setAttribute('aria-current', 'page');
  }
  return li;
}

function actionButton(name, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `breadcrumbs-${name}`;
  button.setAttribute('aria-label', label);
  button.innerHTML = `<span class="breadcrumbs-icon" aria-hidden="true"></span><span class="breadcrumbs-action-label" aria-hidden="true">${name}</span>`;
  return button;
}

async function share(status) {
  const data = { title: document.title, url: window.location.href };
  if (navigator.share) {
    try {
      await navigator.share(data);
    } catch {
      // dismissed by the user — nothing to do
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(data.url);
    status.textContent = 'Link copied';
  } catch {
    status.textContent = 'Copy this page’s address from the browser to share it';
  }
  setTimeout(() => { status.textContent = ''; }, 4000);
}

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const home = { path: '/', label: 'Home' };
  const current = getMetadata('breadcrumb-title') || shortTitle(getMetadata('og:title') || document.title);

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const list = document.createElement('ol');
  list.className = 'breadcrumbs-list';
  list.append(crumbItem(home.label, home.path), crumbItem(current));

  // mobile: single back link to the nearest ancestor
  const back = document.createElement('a');
  back.className = 'breadcrumbs-back';
  back.href = home.path;
  back.textContent = home.label;

  const status = document.createElement('span');
  status.className = 'breadcrumbs-status';
  status.setAttribute('role', 'status');

  const print = actionButton('print', 'Print');
  print.addEventListener('click', () => window.print());
  const shareButton = actionButton('share', 'Share');
  shareButton.addEventListener('click', () => share(status));

  const actions = document.createElement('div');
  actions.className = 'breadcrumbs-actions';
  actions.append(print, shareButton, status);

  nav.append(list, back);
  block.replaceChildren(nav, actions);

  // ancestors load after first render; the row keeps its height meanwhile
  const crumbs = (await Promise.all(ancestorPaths(window.location.pathname).map(fetchCrumb)))
    .filter(Boolean);
  if (!crumbs.length) return;
  list.lastElementChild.before(...crumbs.map(({ path, label }) => crumbItem(label, path)));
  const parent = crumbs[crumbs.length - 1];
  back.href = parent.path;
  back.textContent = parent.label;
}
