/*
 * Press release list: a searchable, filterable, load-more list of press releases, or of
 * events with the `events` option ("Press Release List (events)").
 *
 * Content contract: one row, one cell, a link to the data sheet
 * (/newsroom/press-releases-data.json or /about/events-data.json, built by
 * tools/press-releases/build-press-releases-data.mjs and tools/events/build-events-data.mjs):
 *   data       Date (yyyy-mm-dd), Display Date, Title, URL, Summary, Locations (comma-separated),
 *              and for events Image, Image Alt
 *   locations  Location, ID: the location filter's options, in order (optional; without it
 *              the options are the distinct Locations values, A-Z)
 *
 * Like the highmark.com listings, the state lives in the query string (?keyword=&group=&year=),
 * so a filtered list can be linked to. `group` is the location's slug; highmark.com tag IDs
 * (highmark:press-release/<slug>, highmark:event-locations/<slug>) are accepted too.
 * On desktop a filter change applies at once and a keyword search on Enter or blur; in the
 * mobile filter drawer nothing applies until APPLY.
 */
import { toClassName } from '../../scripts/aem.js';

const PAGE_SIZE = 10;
const DESKTOP = window.matchMedia('(width >= 992px)');

// Wording and behaviour per listing, as on the highmark.com pages.
const MODES = {
  releases: {
    noun: 'press releases',
    searchLabel: '',
    typeLabel: 'TYPE',
    allTypes: 'All Locations',
    dateLabel: 'DATE',
    allDates: 'All Years',
    more: 'Load More Stories',
    newestFirst: true, // re-sorted by Date
    futureYears: 0,
    tags: false,
    hideFilterWhenEmpty: false,
  },
  events: {
    noun: 'events',
    searchLabel: 'Search',
    typeLabel: 'Region',
    allTypes: 'All',
    dateLabel: 'DATE',
    allDates: 'Any',
    more: 'Load More Events',
    newestFirst: false, // the sheet's order (upcoming first)
    futureYears: 3, // highmark.com offers this year to this year + 3
    tags: true, // each event's region is a button that applies that filter
    hideFilterWhenEmpty: true, // no Filter trigger when there are no events at all
  },
};

const ICONS = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
};

// The mobile/tablet filter icon is an authored asset (DA media), so it can be swapped
// without a code change.
const FILTER_ICON = '/docs/library/icons/filter.svg';

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'html') node.innerHTML = v;
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  });
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
};

const filterIcon = () => el(
  'span',
  { class: 'press-release-list-trigger-icon' },
  el('img', {
    src: FILTER_ICON, alt: '', width: '35', height: '35',
  }),
);

async function loadData(href, mode) {
  const url = new URL(href, window.location.href);
  url.searchParams.set('limit', '1000');
  const resp = await fetch(`${url.pathname}${url.search}`);
  if (!resp.ok) throw new Error(`${url.pathname}: ${resp.status}`);
  const json = await resp.json();
  const rows = (json.data?.data || json.data || []).filter((r) => r.Title);
  const items = rows.map((r) => ({
    date: r.Date || '',
    displayDate: r['Display Date'] || r.Date || '',
    title: r.Title,
    url: r.URL,
    summary: r.Summary || '',
    image: r.Image || '',
    imageAlt: r['Image Alt'] || '',
    locations: (r.Locations || '').split(',').map((l) => l.trim()).filter(Boolean),
  }));
  if (mode.newestFirst) items.sort((a, b) => b.date.localeCompare(a.date));
  items.forEach((r) => {
    r.slugs = r.locations.map((l) => toClassName(l));
    r.text = `${r.title} ${r.summary} ${r.locations.join(' ')}`.toLowerCase();
  });
  const listed = json.locations?.data?.map((l) => l.Location).filter(Boolean);
  const labels = listed?.length
    ? listed
    : [...new Set(items.flatMap((r) => r.locations))].sort();
  const locations = labels.map((label) => ({ label, slug: toClassName(label) }));
  const thisYear = new Date().getFullYear();
  const upcoming = mode.futureYears
    ? Array.from({ length: mode.futureYears + 1 }, (_, i) => String(thisYear + i))
    : [];
  const years = [...new Set([...items.map((r) => r.date.slice(0, 4)), ...upcoming])]
    .filter(Boolean)
    .sort();
  if (mode.newestFirst) years.reverse();
  return { items, locations, years };
}

function readState() {
  const params = new URLSearchParams(window.location.search);
  return {
    keyword: (params.get('keyword') || '').trim(),
    group: toClassName((params.get('group') || '').replace(/^.*\//, '')),
    year: (params.get('year') || '').trim(),
  };
}

function writeState(state) {
  const url = new URL(window.location.href);
  ['keyword', 'group', 'year'].forEach((key) => {
    if (state[key]) url.searchParams.set(key, state[key]);
    else url.searchParams.delete(key);
  });
  window.history.pushState(null, '', url);
}

function matches(item, { keyword, group, year }) {
  if (group && !item.slugs.includes(group)) return false;
  if (year && !item.date.startsWith(year)) return false;
  if (keyword) {
    return keyword.toLowerCase().split(/\s+/).every((word) => item.text.includes(word));
  }
  return true;
}

function buildSelect(id, name, label, allLabel, options) {
  const select = el('select', { id, name });
  select.append(el('option', { value: '' }, allLabel));
  options.forEach(({ value, text }) => select.append(el('option', { value }, text)));
  return el('div', { class: 'press-release-list-select' }, el('label', { for: id }, label), select);
}

function buildControls(data, uid, mode) {
  const keyword = el('input', {
    type: 'search', id: `${uid}-keyword`, name: 'keyword', placeholder: 'Search by Keyword', 'aria-label': `Search ${mode.noun} by keyword`,
  });
  const clear = el('button', {
    type: 'button', class: 'press-release-list-clear', 'aria-label': 'Clear search', hidden: '', html: ICONS.close,
  });
  const search = el(
    'div',
    { class: 'press-release-list-search' },
    el('span', { class: 'press-release-list-search-icon', html: ICONS.search }),
    keyword,
    clear,
  );
  const location = buildSelect(`${uid}-group`, 'group', mode.typeLabel, mode.allTypes, data.locations.map((l) => ({ value: l.slug, text: l.label })));
  const year = buildSelect(`${uid}-year`, 'year', mode.dateLabel, mode.allDates, data.years.map((y) => ({ value: y, text: y })));
  const controls = el(
    'div',
    { class: 'press-release-list-controls' },
    mode.searchLabel ? el('p', { class: 'press-release-list-filter-label' }, mode.searchLabel) : null,
    search,
    el('p', { class: 'press-release-list-filter-label' }, 'Filter'),
    location,
    year,
  );
  return {
    controls,
    keyword,
    clear,
    group: location.querySelector('select'),
    year: year.querySelector('select'),
  };
}

function renderItem(item, mode) {
  const title = el('a', { class: 'press-release-list-title', href: item.url }, item.title);
  const tags = mode.tags && item.locations.length
    ? el('p', { class: 'press-release-list-tags' }, ...item.locations.map((label, i) => el('button', {
      type: 'button', class: 'press-release-list-tag', 'data-group': item.slugs[i],
    }, label)))
    : null;
  return el(
    'li',
    { class: 'press-release-list-item' },
    item.image ? el('p', { class: 'press-release-list-image' }, el('img', {
      src: item.image, alt: item.imageAlt, loading: 'lazy',
    })) : null,
    el('p', { class: 'press-release-list-date' }, item.displayDate),
    el('h3', {}, title),
    item.summary ? el('p', { class: 'press-release-list-summary' }, item.summary) : null,
    tags,
  );
}

export default async function decorate(block) {
  const link = block.querySelector('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  const mode = block.classList.contains('events') ? MODES.events : MODES.releases;
  block.textContent = '';

  let data;
  try {
    data = await loadData(href, mode);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('press-release-list: could not load', href, e);
    block.append(el('p', { class: 'press-release-list-error' }, `The ${mode.noun} could not be loaded. Please try again later.`));
    return;
  }

  const uid = `press-release-list-${[...document.querySelectorAll('.press-release-list')].indexOf(block)}`;
  const ui = buildControls(data, uid, mode);

  // Mobile: a Filter trigger opens a drawer holding the same controls, applied on APPLY.
  const trigger = el(
    'button',
    {
      type: 'button', class: 'press-release-list-trigger', 'aria-expanded': 'false', 'aria-controls': `${uid}-filters`,
    },
    filterIcon(),
    'Filter',
  );
  trigger.hidden = mode.hideFilterWhenEmpty && !data.items.length;
  const close = el('button', {
    type: 'button', class: 'press-release-list-close', 'aria-label': 'Close filters', html: ICONS.close,
  });
  const apply = el('button', { type: 'button', class: 'press-release-list-apply' }, 'Apply');
  const rail = el(
    'div',
    {
      class: 'press-release-list-filters', id: `${uid}-filters`, role: 'search', 'aria-label': `Filter ${mode.noun}`,
    },
    el('div', { class: 'press-release-list-drawer-header' }, filterIcon(), close),
    ui.controls,
    apply,
  );
  const backdrop = el('div', { class: 'press-release-list-backdrop', hidden: '' });

  const searched = el('h4', { class: 'press-release-list-searched', hidden: '' });
  const count = el('p', { class: 'press-release-list-count', 'aria-live': 'polite' });
  const list = el('ul', { class: 'press-release-list-items' });
  const emptyTerm = el('strong', { class: 'press-release-list-empty-term' });
  const empty = mode === MODES.events
    ? el(
      'p',
      { class: 'press-release-list-empty', hidden: '', 'aria-live': 'polite' },
      'Sorry, your search for ',
      emptyTerm,
      ' did not return any results. Please, try again with ',
      el('a', { href: window.location.pathname }, 'a new search term.'),
    )
    : el('p', { class: 'press-release-list-empty', hidden: '' }, `No ${mode.noun} match your search.`);
  const more = el('button', { type: 'button', class: 'press-release-list-more' }, mode.more);
  const results = el(
    'div',
    { class: 'press-release-list-results' },
    el('div', { class: 'press-release-list-summary-row' }, searched, count),
    list,
    empty,
    el('div', { class: 'press-release-list-more-row' }, more),
  );

  block.append(trigger, rail, backdrop, results);

  let state = readState();
  let matched = [];
  let shown = 0;

  const syncControls = () => {
    ui.keyword.value = state.keyword;
    ui.clear.hidden = !state.keyword;
    ui.group.value = data.locations.some((l) => l.slug === state.group) ? state.group : '';
    ui.year.value = data.years.includes(state.year) ? state.year : '';
  };

  const updateCount = () => {
    count.textContent = matched.length
      ? `Showing 1 - ${shown} of ${matched.length} results`
      : 'Showing 0 results';
    // events: like highmark.com, a search without results shows only the "Sorry" message
    count.hidden = mode === MODES.events && !matched.length;
    more.parentElement.hidden = shown >= matched.length;
  };

  const showMore = () => {
    const next = matched.slice(shown, shown + PAGE_SIZE);
    list.append(...next.map((item) => renderItem(item, mode)));
    shown += next.length;
    updateCount();
  };

  const render = () => {
    matched = data.items.filter((r) => matches(r, state));
    shown = 0;
    list.textContent = '';
    const showSearched = !!state.keyword && (mode !== MODES.events || matched.length > 0);
    searched.hidden = !showSearched;
    searched.textContent = showSearched ? `You searched for “${state.keyword}”` : '';
    emptyTerm.textContent = state.keyword;
    empty.hidden = matched.length > 0;
    showMore();
  };

  const readControls = () => ({
    keyword: ui.keyword.value.trim(),
    group: ui.group.value,
    year: ui.year.value,
  });

  const run = () => {
    const next = readControls();
    if (next.keyword === state.keyword && next.group === state.group
      && next.year === state.year) return;
    state = next;
    writeState(state);
    render();
  };

  const setDrawer = (open) => {
    block.classList.toggle('filters-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    backdrop.hidden = !open;
    document.body.classList.toggle('press-release-list-locked', open);
    if (open) ui.keyword.focus();
    else trigger.focus();
  };

  const inDrawer = () => !DESKTOP.matches;

  ui.keyword.addEventListener('input', () => { ui.clear.hidden = !ui.keyword.value; });
  ui.keyword.addEventListener('change', () => { if (!inDrawer()) run(); });
  ui.keyword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && inDrawer()) { e.preventDefault(); apply.click(); }
  });
  ui.clear.addEventListener('click', () => {
    ui.keyword.value = '';
    ui.clear.hidden = true;
    if (!inDrawer()) run();
    ui.keyword.focus();
  });
  [ui.group, ui.year].forEach((select) => select.addEventListener('change', () => { if (!inDrawer()) run(); }));

  // events: a region tag applies that region's filter (on mobile too, without the drawer)
  list.addEventListener('click', (e) => {
    const tag = e.target.closest('.press-release-list-tag');
    if (!tag) return;
    ui.group.value = tag.dataset.group;
    state = { ...readControls(), keyword: state.keyword, year: state.year };
    syncControls();
    writeState(state);
    render();
    block.scrollIntoView({ block: 'start' });
  });

  trigger.addEventListener('click', () => { syncControls(); setDrawer(true); });
  close.addEventListener('click', () => { syncControls(); setDrawer(false); });
  backdrop.addEventListener('click', () => close.click());
  apply.addEventListener('click', () => {
    run();
    setDrawer(false);
    block.scrollIntoView({ block: 'start' });
  });
  block.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && block.classList.contains('filters-open')) close.click();
  });
  DESKTOP.addEventListener('change', () => {
    if (DESKTOP.matches && block.classList.contains('filters-open')) {
      block.classList.remove('filters-open');
      backdrop.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('press-release-list-locked');
    }
  });

  more.addEventListener('click', () => {
    const first = shown;
    showMore();
    list.children[first]?.querySelector('a')?.focus({ preventScroll: true });
  });

  window.addEventListener('popstate', () => {
    state = readState();
    syncControls();
    render();
  });

  syncControls();
  render();
}
