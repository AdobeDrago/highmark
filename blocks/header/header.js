import { getMetadata } from '../../scripts/aem.js';

// Desktop breakpoint — below this the header collapses to a hamburger drawer.
const isDesktop = window.matchMedia('(min-width: 992px)');

/**
 * Fetch the nav fragment. Dual-fetch: localhost / `aem up` serves the plain
 * file at /content/nav.plain.html; DA/EDS serves it at `${navPath}.plain.html`.
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) {
    const navMeta = getMetadata('nav');
    const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
    resp = await fetch(`${navPath}.plain.html`);
  }
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

/** Close every open megamenu panel. */
function closeAllPanels(navList) {
  navList.querySelectorAll(':scope > li.has-panel').forEach((li) => {
    li.classList.remove('open');
    const a = li.querySelector(':scope > a');
    if (a) a.setAttribute('aria-expanded', 'false');
  });
  document.body.classList.remove('nav-panel-open');
}

/**
 * Build the primary nav (with megamenu panels) from the source <ul> tree.
 * Each top-level <li> whose content includes a nested <ul> becomes a
 * megamenu trigger; the nested <ul> is its panel of category columns.
 */
function decoratePrimaryNav(sectionEl) {
  const navList = sectionEl.querySelector(':scope > ul');
  if (!navList) return sectionEl;
  navList.classList.add('nav-primary');

  // DA wraps a standalone link in a <p> (e.g. `<li><p><a>Plans</a></p><ul>…`),
  // whereas local `aem up` serves the raw `<li><a>Plans</a><ul>…`. The trigger
  // lookup and the CSS both expect the anchor as a direct child of the <li>, so
  // unwrap any <p> that holds a single anchor throughout the nav tree.
  navList.querySelectorAll('li > p').forEach((p) => {
    const only = p.children.length === 1 && p.firstElementChild.tagName === 'A';
    if (only && !p.textContent.replace(p.firstElementChild.textContent, '').trim()) {
      p.replaceWith(p.firstElementChild);
    }
  });

  navList.querySelectorAll(':scope > li').forEach((li) => {
    const panel = li.querySelector(':scope > ul');
    const trigger = li.querySelector(':scope > a');
    if (panel && trigger) {
      li.classList.add('has-panel');
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      panel.classList.add('nav-panel');

      // Desktop: hover opens/closes the panel.
      li.addEventListener('mouseenter', () => {
        if (!isDesktop.matches) return;
        closeAllPanels(navList);
        li.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        document.body.classList.add('nav-panel-open');
      });
      li.addEventListener('mouseleave', () => {
        if (!isDesktop.matches) return;
        li.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-panel-open');
      });

      // Mobile: the chevron toggles the panel; the label still navigates.
      const chevron = document.createElement('button');
      chevron.type = 'button';
      chevron.className = 'nav-panel-toggle';
      chevron.setAttribute('aria-label', `Toggle ${trigger.textContent} submenu`);
      chevron.addEventListener('click', (e) => {
        if (isDesktop.matches) return;
        e.preventDefault();
        e.stopPropagation();
        const isOpen = li.classList.contains('open');
        closeAllPanels(navList);
        if (!isOpen) {
          li.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
      trigger.after(chevron);
    }
  });
  return sectionEl;
}

/** Build the search form (controls are created in JS, per the DA contract). */
function buildSearch() {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/search';
  form.innerHTML = `
    <input type="search" name="q" placeholder="Search Highmark" aria-label="Search Highmark">
    <button type="submit" aria-label="Search"><span class="nav-search-icon" aria-hidden="true"></span></button>`;
  return form;
}

/**
 * loads and decorates the header nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  // Source order: [0] utility links, [1] brand + icons, [2] primary nav.
  const [utilitySection, brandSection, primarySection] = sections;

  if (utilitySection) {
    utilitySection.className = 'nav-utility';
    nav.append(utilitySection);
  }

  // Brand + tools row (logo left, utility icons right, hamburger on mobile).
  const brandRow = document.createElement('div');
  brandRow.className = 'nav-brand-row';
  if (brandSection) {
    const logoP = brandSection.querySelector(':scope > p');
    const iconsUl = brandSection.querySelector(':scope > ul');
    const brand = document.createElement('div');
    brand.className = 'nav-brand';
    if (logoP) brand.append(logoP);
    brandRow.append(brand);

    const hamburger = document.createElement('button');
    hamburger.type = 'button';
    hamburger.className = 'nav-hamburger';
    hamburger.setAttribute('aria-controls', 'nav');
    hamburger.setAttribute('aria-label', 'Open navigation');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';

    const tools = document.createElement('div');
    tools.className = 'nav-tools';
    if (iconsUl) {
      iconsUl.classList.add('nav-icons');
      tools.append(iconsUl);
    }
    brandRow.append(tools, hamburger);
    nav.append(brandRow);

    hamburger.addEventListener('click', () => {
      const open = nav.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      document.body.style.overflowY = open ? 'hidden' : '';
    });
  }

  // Primary nav row (nav links + search).
  const primaryRow = document.createElement('div');
  primaryRow.className = 'nav-primary-row';
  if (primarySection) {
    primarySection.className = 'nav-sections';
    decoratePrimaryNav(primarySection);
    primaryRow.append(primarySection);
  }
  primaryRow.append(buildSearch());

  // Mobile: relocate the utility links + icons into the drawer (they live in the
  // top bands on desktop; the source repeats them at the bottom of the drawer).
  // Clone so the desktop bands keep their copies.
  if (utilitySection) {
    const utilClone = utilitySection.cloneNode(true);
    utilClone.className = 'nav-drawer-utility';
    primaryRow.append(utilClone);
  }
  if (brandSection) {
    const iconsUl = brandSection.querySelector('.nav-icons');
    if (iconsUl) {
      const iconsClone = iconsUl.cloneNode(true);
      const wrap = document.createElement('div');
      wrap.className = 'nav-drawer-icons';
      wrap.append(iconsClone);
      primaryRow.append(wrap);
    }
  }

  nav.append(primaryRow);

  // Close panels on Escape.
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      const navList = nav.querySelector('.nav-primary');
      if (navList) closeAllPanels(navList);
    }
  });

  // Reset state when crossing the desktop/mobile boundary.
  isDesktop.addEventListener('change', () => {
    nav.classList.remove('nav-open');
    document.body.style.overflowY = '';
    const hb = nav.querySelector('.nav-hamburger');
    if (hb) {
      hb.setAttribute('aria-expanded', 'false');
      hb.setAttribute('aria-label', 'Open navigation');
    }
    const navList = nav.querySelector('.nav-primary');
    if (navList) closeAllPanels(navList);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
