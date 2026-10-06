import { getMetadata } from '../../scripts/aem.js';

// Desktop breakpoint — below this the header collapses to a hamburger drawer.
const isDesktop = window.matchMedia('(min-width: 992px)');

/**
 * Fetch the nav fragment. Try the standard (metadata-driven) path first —
 * `${navPath}.plain.html`, which is what both the published EDS site and the
 * local dev server serve. Only fall back to /content/nav.plain.html if that
 * misses, so environments that serve at the root never fire a 404 first (a 404
 * resolves normally, so try/catch can't suppress it — the browser still logs
 * the failed request; the only fix is to not make the failing request).
 */
const navPath = () => {
  const navMeta = getMetadata('nav');
  return navMeta ? new URL(navMeta, window.location).pathname : '/nav';
};

async function fetchNav() {
  try {
    let resp = await fetch(`${navPath()}.plain.html`);
    if (!resp.ok) {
      resp = await fetch('/content/nav.plain.html');
    }
    if (!resp.ok) return null;
    const html = await resp.text();
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Nav fragment failed to load', e);
    return null;
  }
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

/** Most suggestions the search box lists (as on highmark.com). */
const MAX_SUGGESTIONS = 5;

/**
 * What the box suggests before anything is typed, as highmark.com does (Careers,
 * Member Login, …): a DA sheet with a `Suggestion` column and an optional `Link`.
 */
const SUGGESTIONS_SHEET = '/search-suggestions.json';

/**
 * A suggestion's label: the parts that match what the visitor typed in regular
 * weight (<mark>), the rest bold, as in highmark.com's type-ahead.
 * @param {string} title page title
 * @param {string[]} terms query words, normalized by the search block (a-z, 0-9 only)
 * @returns {DocumentFragment}
 */
function suggestionLabel(title, terms) {
  const ranges = terms
    .flatMap((term) => [...title.matchAll(new RegExp(`(^|[^\\p{L}\\p{N}])(${term})`, 'giu'))]
      .map((m) => [m.index + m[1].length, m.index + m[0].length]))
    .sort((a, b) => a[0] - b[0]);
  const fragment = document.createDocumentFragment();
  let at = 0;
  ranges.forEach(([start, end]) => {
    if (end <= at) return;
    if (start > at) fragment.append(title.slice(at, start));
    const mark = document.createElement('mark');
    mark.textContent = title.slice(Math.max(start, at), end);
    fragment.append(mark);
    at = end;
  });
  if (at < title.length) fragment.append(title.slice(at));
  return fragment;
}

/**
 * The brand row's icon links (Language Assistance, Contact Us, ...). The pipeline delivers each
 * item as two paragraphs, the linked icon and then its label, which stacked them. highmark.com
 * shows the icon and then the label as the link, on one line: rebuild each item that way. The
 * icon is decorative, since the label names the link.
 * @param {HTMLUListElement} ul
 */
function decorateIconLinks(ul) {
  [...ul.children].forEach((li) => {
    const link = li.querySelector('a');
    const picture = li.querySelector('picture');
    const label = li.textContent.trim();
    if (!link || !picture || !label) return;
    picture.querySelector('img')?.setAttribute('alt', '');
    link.textContent = label;
    li.replaceChildren(picture, link);
  });
}

/**
 * Type-ahead for the search box (highmark.com's): on focus, a "Suggestions" list of
 * authored searches (SUGGESTIONS_SHEET); from the third letter, matching page titles.
 * Arrow keys move through the list and Enter opens the highlighted item; otherwise the
 * form submits to the search page. Matching is the search block's, loaded the first
 * time the box is used.
 * @param {HTMLFormElement} form
 */
function decorateSuggestions(form) {
  const input = form.querySelector('input');
  const popup = form.querySelector('.nav-search-suggestions');
  const list = popup.querySelector('ul');
  const empty = popup.querySelector('.nav-search-empty');
  const status = form.querySelector('.nav-search-status');
  let searchModule;
  let authored;
  let active = -1;
  let run = 0;

  const loadSearch = () => {
    searchModule = searchModule || import('../search/search.js').catch((error) => {
      searchModule = null; // try again next time
      throw error;
    });
    return searchModule;
  };
  const loadAuthored = () => {
    authored = authored || fetch(SUGGESTIONS_SHEET)
      .then((resp) => (resp.ok ? resp.json() : {}))
      .then(({ data = [] }) => data
        .map((row) => ({ label: (row.Suggestion || '').trim(), link: (row.Link || '').trim() }))
        .filter(({ label }) => label))
      .catch(() => []);
    return authored;
  };
  /** The site's results page for a query (the form's own action). */
  const searchPage = (query) => {
    const url = new URL(form.action);
    url.searchParams.set('q', query);
    return `${url.pathname}${url.search}`;
  };
  const options = () => [...list.children];

  const setActive = (index) => {
    active = index;
    options().forEach((option, i) => option.classList.toggle('active', i === index));
    if (index >= 0) input.setAttribute('aria-activedescendant', options()[index].id);
    else input.removeAttribute('aria-activedescendant');
  };

  const close = () => {
    run += 1; // drop any lookup still in flight
    popup.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    setActive(-1);
  };

  /**
   * Opens the list with these items.
   * @param {{label: string, href: string}[]} items
   * @param {string[]} [terms] typed words to set in regular weight (typed suggestions only)
   */
  const show = (items, terms) => {
    list.replaceChildren(...items.map(({ label, href }, i) => {
      const option = document.createElement('li');
      option.id = `nav-search-option-${i}`;
      option.setAttribute('role', 'option');
      const link = document.createElement('a');
      link.href = href;
      link.tabIndex = -1;
      link.append(terms ? suggestionLabel(label, terms) : label);
      option.append(link);
      return option;
    }));
    // authored suggestions are plain text; typed ones are bold apart from the typed words
    popup.classList.toggle('nav-search-authored', !terms);
    empty.hidden = items.length > 0;
    status.textContent = items.length
      ? `${items.length} suggestion${items.length === 1 ? '' : 's'}, use the arrow keys to choose`
      : 'No results found';
    setActive(-1);
    popup.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  const update = async () => {
    run += 1;
    const current = run;
    const search = await loadSearch();
    const [rows, suggestions] = await Promise.all([search.loadIndex(), loadAuthored()]);
    const query = input.value.trim();
    if (current !== run) return; // the visitor kept typing

    if (!query && suggestions.length) {
      // each runs on this site's search page when the site has a match for it, else on
      // highmark.com's (unless the sheet gives a link)
      show(suggestions.slice(0, MAX_SUGGESTIONS).map(({ label, link }) => {
        const here = search.searchIndex(rows, label).length > 0;
        const href = link || (here ? searchPage(label) : search.fallbackSearchUrl(label));
        return { label, href };
      }));
      return;
    }
    if (query.length < search.MIN_QUERY_LENGTH) {
      close();
      return;
    }

    // one suggestion per title (some pages share one), best match first
    const titles = new Set();
    const matches = search.searchIndex(rows, query).filter((row) => {
      const key = search.pageTitle(row).toLowerCase();
      if (titles.has(key)) return false;
      titles.add(key);
      return true;
    }).slice(0, MAX_SUGGESTIONS);
    show(
      matches.map((row) => ({ label: search.pageTitle(row), href: row.path })),
      search.queryTerms(query),
    );
  };

  input.addEventListener('focus', update);
  input.addEventListener('input', update);
  input.addEventListener('keydown', (e) => {
    const open = !popup.hidden;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        update();
        return;
      }
      const count = options().length;
      if (!count) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      const start = e.key === 'ArrowDown' ? 0 : count - 1;
      setActive(active < 0 ? start : (active + step + count) % count);
    } else if (e.key === 'Enter' && open && active >= 0) {
      e.preventDefault();
      window.location.href = options()[active].querySelector('a').href;
    } else if (e.key === 'Escape' && open) {
      e.preventDefault(); // keep the text: close the list only
      close();
    }
  });

  // clicking a suggestion must not blur the box first (that would close the list)
  popup.addEventListener('mousedown', (e) => e.preventDefault());
  form.addEventListener('focusout', (e) => {
    if (!form.contains(e.relatedTarget)) close();
  });
  form.addEventListener('submit', (e) => {
    if (!input.value.trim()) {
      e.preventDefault();
      input.focus();
      return;
    }
    close();
  });
}

/**
 * Build the search form (controls are created in JS, per the DA contract).
 * It submits to the site's search page (blocks/search), with type-ahead suggestions.
 */
function buildSearch() {
  const form = document.createElement('form');
  form.id = 'nav-search';
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/search';
  form.innerHTML = `
    <input type="search" name="q" placeholder="Search Highmark" aria-label="Search Highmark"
      role="combobox" aria-autocomplete="list" aria-expanded="false"
      aria-controls="nav-search-listbox" autocomplete="off" enterkeyhint="search">
    <button type="submit" aria-label="Search"><span class="nav-search-icon" aria-hidden="true"></span></button>
    <div class="nav-search-suggestions" hidden>
      <p class="nav-search-suggestions-heading" id="nav-search-heading">Suggestions</p>
      <ul role="listbox" id="nav-search-listbox" aria-labelledby="nav-search-heading"></ul>
      <p class="nav-search-empty" hidden>No results found</p>
    </div>
    <p class="nav-search-status" role="status"></p>`;
  decorateSuggestions(form);
  return form;
}

/**
 * loads and decorates the header nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();

  // A nav fragment whose sections are styled shop-* (shop-brand, shop-nav, ...) gets
  // the shop header, laid out like ShopX (shop-header.js). The pipeline delivers a
  // section's Style as classes on its div (or, unprocessed, as a section-metadata table).
  const isShop = [...(fragment?.children || [])].some((section) => [...section.classList]
    .some((name) => name.startsWith('shop-'))
    || /\bshop-/.test(section.querySelector('.section-metadata')?.textContent || ''));
  if (isShop) {
    const { default: decorateShopHeader } = await import('./shop-header.js');
    await decorateShopHeader(block, navPath());
    return;
  }

  block.textContent = '';
  if (!fragment) return;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  // Source order: [0] utility links, [1] brand + icons, [2] primary nav.
  const [utilitySection, brandSection, primarySection] = sections;

  // Below the desktop breakpoint highmark.com has no search box in its menu: a search icon
  // in the brand row opens the box in place of the logo.
  const search = buildSearch();
  let searchToggle;
  const setSearchOpen = (open) => {
    nav.classList.toggle('nav-search-open', open);
    searchToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  if (utilitySection) {
    utilitySection.className = 'nav-utility';
    nav.append(utilitySection);
  }

  // Brand + tools row (logo left, utility icons right, search icon + hamburger on mobile).
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

    searchToggle = document.createElement('button');
    searchToggle.type = 'button';
    searchToggle.className = 'nav-search-toggle';
    searchToggle.setAttribute('aria-label', 'Search');
    searchToggle.setAttribute('aria-controls', search.id);
    searchToggle.setAttribute('aria-expanded', 'false');
    searchToggle.innerHTML = '<span class="nav-search-icon" aria-hidden="true"></span>';

    const tools = document.createElement('div');
    tools.className = 'nav-tools';
    if (iconsUl) {
      iconsUl.classList.add('nav-icons');
      decorateIconLinks(iconsUl);
      tools.append(iconsUl);
    }
    brandRow.append(tools, searchToggle, hamburger);
    nav.append(brandRow);

    const setMenuOpen = (open) => {
      nav.classList.toggle('nav-open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      document.body.style.overflowY = open ? 'hidden' : '';
    };
    hamburger.addEventListener('click', () => {
      setSearchOpen(false);
      setMenuOpen(!nav.classList.contains('nav-open'));
    });
    searchToggle.addEventListener('click', () => {
      setMenuOpen(false);
      setSearchOpen(true);
      search.querySelector('input').focus();
    });
  }

  // Primary nav row (nav links + search on desktop).
  const primaryRow = document.createElement('div');
  primaryRow.className = 'nav-primary-row';
  if (primarySection) {
    primarySection.className = 'nav-sections';
    decoratePrimaryNav(primarySection);
    primaryRow.append(primarySection);
  }

  // The search box sits after the nav links on desktop and before the search icon below
  // that, so the tab order follows the screen. It moves when the viewport crosses over.
  const placeSearch = () => {
    if (searchToggle && !isDesktop.matches) searchToggle.before(search);
    else if (primarySection) primarySection.after(search);
    else primaryRow.prepend(search);
  };
  placeSearch();
  if (searchToggle) {
    // The opened box closes on a tap outside it (as on highmark.com), when focus tabs out
    // of it, or on Escape once its suggestion list is closed.
    document.addEventListener('pointerdown', (e) => {
      if (nav.classList.contains('nav-search-open') && !search.contains(e.target)) setSearchOpen(false);
    });
    search.addEventListener('focusout', (e) => {
      if (e.relatedTarget && !search.contains(e.relatedTarget)) setSearchOpen(false);
    });
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented && nav.classList.contains('nav-search-open')) {
        e.preventDefault(); // keep the text (a search input clears on Escape)
        setSearchOpen(false);
        searchToggle.focus();
      }
    });
  }

  // Mobile: relocate the utility links + icons into the drawer (they live in the
  // top bands on desktop; the source repeats them at the bottom of the drawer).
  // Clone so the desktop bands keep their copies.
  if (utilitySection) {
    const utilClone = utilitySection.cloneNode(true);
    utilClone.className = 'nav-drawer-utility';
    primaryRow.append(utilClone);
  }
  if (brandSection) {
    const iconsUl = nav.querySelector('.nav-tools .nav-icons'); // moved out of brandSection above
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
    setSearchOpen(false);
    placeSearch();
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
