/*
 * Press release list: a searchable, filterable, load-more list of press releases.
 *
 * Content contract: one row, one cell, a link to the data sheet
 * (/newsroom/press-releases-data.json, built by
 * tools/press-releases/build-press-releases-data.mjs):
 *   data       Date (yyyy-mm-dd), Display Date, Title, URL, Summary, Locations (comma-separated)
 *   locations  Location, ID: the Location filter's options, in order (optional; without it
 *              the options are the distinct Locations values, A-Z)
 *
 * Like the highmark.com listing, the state lives in the query string (?keyword=&group=&year=),
 * so a filtered list can be linked to. `group` is the location's slug; highmark.com tag IDs
 * (highmark:press-release/<slug>) are accepted too.
 * On desktop a filter change applies at once and a keyword search on Enter or blur; in the
 * mobile filter drawer nothing applies until APPLY.
 */
import { toClassName } from '../../scripts/aem.js';

const PAGE_SIZE = 10;
const DESKTOP = window.matchMedia('(width >= 992px)');

const ICONS = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  filter: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6h16v2H4zm3 5h10v2H7zm3 5h4v2h-4z"/></svg>',
};

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'html') node.innerHTML = v;
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  });
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
};

async function loadData(href) {
  const url = new URL(href, window.location.href);
  url.searchParams.set('limit', '1000');
  const resp = await fetch(`${url.pathname}${url.search}`);
  if (!resp.ok) throw new Error(`${url.pathname}: ${resp.status}`);
  const json = await resp.json();
  const rows = (json.data?.data || json.data || []).filter((r) => r.Title);
  const releases = rows
    .map((r) => ({
      date: r.Date || '',
      displayDate: r['Display Date'] || r.Date || '',
      title: r.Title,
      url: r.URL,
      summary: r.Summary || '',
      locations: (r.Locations || '').split(',').map((l) => l.trim()).filter(Boolean),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
  releases.forEach((r) => {
    r.slugs = r.locations.map((l) => toClassName(l));
    r.text = `${r.title} ${r.summary} ${r.locations.join(' ')}`.toLowerCase();
  });
  const listed = json.locations?.data?.map((l) => l.Location).filter(Boolean);
  const labels = listed?.length
    ? listed
    : [...new Set(releases.flatMap((r) => r.locations))].sort();
  const locations = labels.map((label) => ({ label, slug: toClassName(label) }));
  const years = [...new Set(releases.map((r) => r.date.slice(0, 4)).filter(Boolean))]
    .sort()
    .reverse();
  return { releases, locations, years };
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

function matches(release, { keyword, group, year }) {
  if (group && !release.slugs.includes(group)) return false;
  if (year && !release.date.startsWith(year)) return false;
  if (keyword) {
    return keyword.toLowerCase().split(/\s+/).every((word) => release.text.includes(word));
  }
  return true;
}

function buildSelect(id, name, label, allLabel, options) {
  const select = el('select', { id, name });
  select.append(el('option', { value: '' }, allLabel));
  options.forEach(({ value, text }) => select.append(el('option', { value }, text)));
  return el('div', { class: 'press-release-list-select' }, el('label', { for: id }, label), select);
}

function buildControls(data, uid) {
  const keyword = el('input', {
    type: 'search', id: `${uid}-keyword`, name: 'keyword', placeholder: 'Search by Keyword', 'aria-label': 'Search press releases by keyword',
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
  const location = buildSelect(`${uid}-group`, 'group', 'Type', 'All Locations', data.locations.map((l) => ({ value: l.slug, text: l.label })));
  const year = buildSelect(`${uid}-year`, 'year', 'Date', 'All Years', data.years.map((y) => ({ value: y, text: y })));
  const controls = el(
    'div',
    { class: 'press-release-list-controls' },
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

function renderItem(release) {
  const title = el('a', { class: 'press-release-list-title', href: release.url }, release.title);
  return el(
    'li',
    { class: 'press-release-list-item' },
    el('p', { class: 'press-release-list-date' }, release.displayDate),
    el('h3', {}, title),
    release.summary ? el('p', { class: 'press-release-list-summary' }, release.summary) : null,
  );
}

export default async function decorate(block) {
  const link = block.querySelector('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  block.textContent = '';

  let data;
  try {
    data = await loadData(href);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('press-release-list: could not load', href, e);
    block.append(el('p', { class: 'press-release-list-error' }, 'Press releases could not be loaded. Please try again later.'));
    return;
  }

  const uid = `press-release-list-${[...document.querySelectorAll('.press-release-list')].indexOf(block)}`;
  const ui = buildControls(data, uid);

  // Mobile: a Filter trigger opens a drawer holding the same controls, applied on APPLY.
  const trigger = el(
    'button',
    {
      type: 'button', class: 'press-release-list-trigger', 'aria-expanded': 'false', 'aria-controls': `${uid}-filters`,
    },
    el('span', { class: 'press-release-list-trigger-icon', html: ICONS.filter }),
    'Filter',
  );
  const close = el('button', {
    type: 'button', class: 'press-release-list-close', 'aria-label': 'Close filters', html: ICONS.close,
  });
  const apply = el('button', { type: 'button', class: 'press-release-list-apply' }, 'Apply');
  const rail = el(
    'div',
    {
      class: 'press-release-list-filters', id: `${uid}-filters`, role: 'search', 'aria-label': 'Filter press releases',
    },
    el('div', { class: 'press-release-list-drawer-header' }, el('span', { class: 'press-release-list-trigger-icon', html: ICONS.filter }), close),
    ui.controls,
    apply,
  );
  const backdrop = el('div', { class: 'press-release-list-backdrop', hidden: '' });

  const searched = el('h4', { class: 'press-release-list-searched', hidden: '' });
  const count = el('p', { class: 'press-release-list-count', 'aria-live': 'polite' });
  const list = el('ul', { class: 'press-release-list-items' });
  const empty = el('p', { class: 'press-release-list-empty', hidden: '' }, 'No press releases match your search.');
  const more = el('button', { type: 'button', class: 'press-release-list-more' }, 'Load More Stories');
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
    more.parentElement.hidden = shown >= matched.length;
  };

  const showMore = () => {
    const next = matched.slice(shown, shown + PAGE_SIZE);
    list.append(...next.map(renderItem));
    shown += next.length;
    updateCount();
  };

  const render = () => {
    matched = data.releases.filter((r) => matches(r, state));
    shown = 0;
    list.textContent = '';
    searched.hidden = !state.keyword;
    searched.textContent = state.keyword ? `You searched for “${state.keyword}”` : '';
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
