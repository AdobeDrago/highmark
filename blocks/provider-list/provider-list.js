/*
 * Provider list (providers.highmark.com's article listings and document lists).
 *
 * Authoring: the first row links the list's sheet, e.g. /providers/lists/news-and-updates.json
 * (built by tools/provider-lists/build-provider-lists.mjs). An optional "Filters" row names the
 * filters to offer, comma-separated: Topics, For, Date Last Updated, Document Type, Sort By.
 *
 * Sheet columns: Title, Link, Type (Web Page | PDF), Topic, For, Published, Updated, Regions
 * (badge labels, comma-separated), Description, Gated ("yes" behind the Availity login).
 *
 * Two layouts, as on the source:
 * - an article listing (default): topic, title, region badges, "For: … | Published Date: …"
 *   and a two-line description, newest first, 7 at a time, with the filters beside the list;
 * - a document list (variant "documents"): title, "Published Date: … | Last Updated Date: …"
 *   (M/YYYY, as the sheet has them) and the description, in sheet order, 10 at a time.
 * A region-only item is tinted, with its regions as badges.
 */
const PAGE_SIZE = { articles: 7, documents: 10 };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DATE_RANGES = ['This Month', 'Last Month', 'Last 3 Months', 'This Year', 'Last 2 Years',
  'Custom Date Range'];

/** "2026-10-09" -> "Fri, October 09, 2026" (the date as written, whatever the time zone). */
function longDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return iso;
  const day = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${day}, ${MONTHS[m - 1]} ${String(d).padStart(2, '0')}, ${y}`;
}

/** A local date as ISO (YYYY-MM-DD). */
function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** [from, to] (ISO, inclusive; '' for open) of a "Date Last Updated" choice. */
function dateRange(choice, custom) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (choice) {
    case 'This Month': return [isoDate(new Date(y, m, 1)), ''];
    case 'Last Month': return [isoDate(new Date(y, m - 1, 1)), isoDate(new Date(y, m, 0))];
    case 'Last 3 Months': return [isoDate(new Date(y, m - 3, now.getDate())), ''];
    case 'This Year': return [`${y}-01-01`, ''];
    case 'Last 2 Years': return [isoDate(new Date(y - 2, m, now.getDate())), ''];
    case 'Custom Date Range': return [custom.from || '', custom.to || ''];
    default: return ['', ''];
  }
}

/** Heading level for item titles: one below the last heading before the block. */
function itemHeadingTag(block) {
  const section = block.closest('.section') || block.parentElement;
  const before = [...section.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter((h) => h.compareDocumentPosition(block) === Node.DOCUMENT_POSITION_FOLLOWING);
  const last = before.pop();
  return `h${last ? Math.min(Number(last.tagName[1]) + 1, 6) : 2}`;
}

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

/** An icon as decorateIcons makes one, with alt text (items are added after decoration). */
function icon(name, alt) {
  const span = element('span', `icon icon-${name}`);
  const img = element('img');
  img.dataset.iconName = name;
  img.src = `${window.hlx.codeBasePath}/icons/${name}.svg`;
  img.alt = alt;
  img.loading = 'lazy';
  span.append(img);
  return span;
}

function renderItem(row, { documents, headingTag }) {
  const li = element('li', 'provider-list-item');
  const regions = String(row.Regions || '').split(',').map((r) => r.trim()).filter(Boolean);
  if (regions.length) li.classList.add('regional');

  if (!documents && row.Topic) li.append(element('p', 'provider-list-topic', row.Topic));

  const heading = element(headingTag, 'provider-list-title');
  const link = element('a');
  link.href = row.Link;
  const pdf = row.Type === 'PDF';
  if (pdf) {
    link.target = '_blank';
    link.rel = 'noopener';
    link.append(icon('pdf', 'PDF'));
  }
  link.append(document.createTextNode(row.Title));
  if (row.Gated) link.append(icon('lock', 'Availity login required'));
  heading.append(link);
  li.append(heading);

  if (regions.length) {
    const badges = element('ul', 'provider-list-regions');
    badges.setAttribute('aria-label', 'Regions');
    regions.forEach((r) => badges.append(element('li', '', r)));
    li.append(badges);
  }

  const meta = documents
    ? [row.Published && `Published Date: ${row.Published}`, row.Updated && `Last Updated Date: ${row.Updated}`]
    : [row.For && `For: ${row.For}`, row.Published && `Published Date: ${longDate(row.Published)}`];
  if (meta.some(Boolean)) li.append(element('p', 'provider-list-meta', meta.filter(Boolean).join(' | ')));
  if (row.Description) li.append(element('p', 'provider-list-description', row.Description));
  return li;
}

/** A labelled select of "All" plus the given options. */
function selectField(name, label, options, all = 'All') {
  const field = element('div', 'provider-list-field');
  const id = `provider-list-${name}-${Math.random().toString(36).slice(2, 8)}`;
  const lab = element('label', '', label);
  lab.htmlFor = id;
  const select = element('select');
  select.id = id;
  select.name = name;
  [all, ...options].forEach((o) => {
    const option = element('option', '', o);
    option.value = o === all ? '' : o;
    select.append(option);
  });
  field.append(lab, select);
  return field;
}

function dateField(name, label) {
  const field = element('div', 'provider-list-field provider-list-date');
  const id = `provider-list-${name}-${Math.random().toString(36).slice(2, 8)}`;
  const lab = element('label', '', label);
  lab.htmlFor = id;
  const input = element('input');
  input.type = 'date';
  input.id = id;
  input.name = name;
  field.append(lab, input);
  return field;
}

const distinct = (rows, column) => [...new Set(rows.map((r) => String(r[column] || '').trim())
  .filter(Boolean))].sort((a, b) => a.localeCompare(b));

function buildFilters(rows, names) {
  const form = element('form', 'provider-list-filters-form');
  form.setAttribute('aria-label', 'Filters');
  const head = element('div', 'provider-list-filters-head');
  const clear = element('button', 'provider-list-clear', 'Clear All');
  clear.type = 'reset';
  clear.hidden = true;
  head.append(element('p', 'provider-list-filters-title', 'Filters'), clear);
  form.append(head);
  names.forEach((name) => {
    switch (name) {
      case 'topics': form.append(selectField('Topic', 'Topics', distinct(rows, 'Topic'))); break;
      case 'for': form.append(selectField('For', 'For', distinct(rows, 'For'))); break;
      case 'document type': form.append(selectField('Type', 'Document Type', distinct(rows, 'Type'))); break;
      case 'date last updated': {
        form.append(selectField('Updated', 'Date Last Updated', DATE_RANGES));
        const custom = element('div', 'provider-list-custom-dates');
        custom.hidden = true;
        custom.append(dateField('from', 'From Date:'), dateField('to', 'To Date:'));
        form.append(custom);
        break;
      }
      case 'sort by': form.append(selectField('sort', 'Sort By', ['Oldest'], 'Newest')); break;
      default:
    }
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  return form;
}

/** The rows the form's choices keep, in the chosen order. */
function applyFilters(rows, form, documents) {
  if (!form) return rows;
  const data = new FormData(form);
  const value = (name) => String(data.get(name) || '');
  const [from, to] = dateRange(value('Updated'), { from: value('from'), to: value('to') });
  const kept = rows.filter((row) => ['Topic', 'For', 'Type'].every((col) => !value(col) || row[col] === value(col))
    && (!from || String(row.Updated) >= from) && (!to || String(row.Updated) <= to));
  if (documents) return kept;
  const sign = value('sort') === 'Oldest' ? 1 : -1;
  // stable: same-day items keep the sheet's order
  return kept.map((row, i) => [row, i]).sort(([a, i], [b, j]) => {
    if (a.Published === b.Published) return i - j;
    return a.Published < b.Published ? -sign : sign;
  }).map(([row]) => row);
}

export default async function decorate(block) {
  const documents = block.classList.contains('documents');
  const rows = [...block.children].map((row) => [...row.children]);
  const link = block.querySelector('a');
  const source = link ? link.getAttribute('href') : rows[0]?.[0]?.textContent.trim();
  const filterRow = rows.find(([key]) => /^filters$/i.test(key?.textContent.trim() || ''));
  const filterNames = filterRow?.[1]?.textContent.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) || [];
  block.textContent = '';
  if (!source) return;

  const url = new URL(source, window.location.href);
  url.searchParams.set('limit', '5000');
  let data = [];
  try {
    const resp = await fetch(`${url.pathname}${url.search}`);
    if (resp.ok) ({ data = [] } = await resp.json());
  } catch (e) {
    // leave the list empty
  }

  const headingTag = itemHeadingTag(block);
  const size = PAGE_SIZE[documents ? 'documents' : 'articles'];
  const results = element('div', 'provider-list-results');
  const count = element('p', 'provider-list-count');
  count.setAttribute('aria-live', 'polite');
  const list = element('ul', 'provider-list-items');
  const more = element('button', 'provider-list-more', documents ? 'Load More Results' : 'View More Results');
  more.type = 'button';
  results.append(count, list, more);

  let form = null;
  if (filterNames.length) {
    const filters = element('div', 'provider-list-filters');
    const toggle = element('button', 'provider-list-filters-toggle', 'Filters');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    form = buildFilters(data, filterNames);
    form.id = `provider-list-filters-${Math.random().toString(36).slice(2, 8)}`;
    toggle.setAttribute('aria-controls', form.id);
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      filters.classList.toggle('open', open);
    });
    filters.append(toggle, form);
    block.append(filters);
  }
  block.append(results);

  let shown = 0;
  let matches = [];
  const showMore = () => {
    const next = matches.slice(shown, shown + size)
      .map((row) => renderItem(row, { documents, headingTag }));
    list.append(...next);
    shown += next.length;
    count.textContent = matches.length
      ? `Showing 1 - ${shown} of ${matches.length} results`
      : 'No results match these filters.';
    more.hidden = shown >= matches.length;
    return next[0];
  };
  const render = () => {
    matches = applyFilters(data, form, documents);
    list.textContent = '';
    shown = 0;
    showMore();
  };
  more.addEventListener('click', () => {
    // keyboard users land on the first new item
    showMore()?.querySelector('a')?.focus();
  });

  if (form) {
    const custom = form.querySelector('.provider-list-custom-dates');
    const clear = form.querySelector('.provider-list-clear');
    const update = () => {
      if (custom) custom.hidden = form.elements.Updated?.value !== 'Custom Date Range';
      // Clear All shows once anything is chosen
      clear.hidden = ![...form.elements].some((el) => el.name && el.value);
      render();
    };
    form.addEventListener('change', update);
    // a reset clears the fields after its event; update once they are cleared
    form.addEventListener('reset', () => setTimeout(update));
  }
  render();
}
