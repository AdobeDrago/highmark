/*
 * Search
 * Site search over the search index, laid out like highmark.com's results page:
 * a search bar, "Showing N of M results for …", a title + description list with
 * "Show more results" paging, and search tips when nothing matches.
 *
 * The header's search box shares this block's index loading and matching
 * (`loadIndex`, `searchIndex`, `queryTerms`), so both find the same pages.
 */

/** Shortest query the box searches as you type (Enter searches any length). */
export const MIN_QUERY_LENGTH = 3;

/**
 * The site's search index (`search-index` in the site's query.yaml): title, description
 * and the first 5,000 words of each page's text. /query-index.json stays small for
 * breadcrumbs and the redirects tool.
 */
const INDEX_PATH = '/search-index.json';
const PAGE_SIZE = 10;

/** highmark.com's own results page (see `fallbackSearchUrl`). */
const FALLBACK_SEARCH = 'https://www.highmark.com/search-results.html';

/**
 * Index rows that aren't pages to offer: header/footer fragments, modals, drafts, this
 * page, and /shop/beta/ (an unlinked copy of /shop/home whose links don't work here).
 */
const NON_PAGE = /^\/(?:nav|footer|search)$|^\/(?:modals|drafts|tools|shop\/beta)\/|\/fragments\//;

const indexes = new Map();
const normalizedRows = new WeakMap();

/**
 * Lowercases, strips accents and apostrophes, and turns any other punctuation into
 * spaces, padded with spaces so every word start can be found as ` <word>`.
 * @param {string} text
 * @returns {string}
 */
function normalize(text) {
  const words = (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return ` ${words} `;
}

/**
 * The words of a query, normalized like the index text.
 * @param {string} query
 * @returns {string[]}
 */
export function queryTerms(query) {
  return normalize(query).trim().split(' ').filter(Boolean);
}

/**
 * The same search on highmark.com. When nothing matches here, visitors are sent there,
 * as links to unmigrated pages redirect there (see /redirects).
 * @param {string} query
 * @returns {string} URL of highmark.com's results page for the query
 */
export function fallbackSearchUrl(query) {
  const url = new URL(FALLBACK_SEARCH);
  url.searchParams.set('q', query);
  url.searchParams.set('rows', PAGE_SIZE);
  return url.href;
}

/**
 * A page's title, or its URL slug in words when the page has none.
 * @param {Object} row query index row
 * @returns {string}
 */
export function pageTitle(row) {
  if (row.title) return row.title;
  const slug = row.path.split('/').filter(Boolean).pop() || 'home';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * The site's pages from the query index, fetched once per index URL.
 * @param {string} [source] index URL
 * @returns {Promise<Object[]>} index rows, non-page rows removed
 */
export function loadIndex(source = INDEX_PATH) {
  const url = new URL(source, window.location.href);
  if (!url.searchParams.has('limit')) url.searchParams.set('limit', '5000');
  const key = url.href;
  if (!indexes.has(key)) {
    indexes.set(key, fetch(url)
      .then((resp) => {
        if (!resp.ok) throw new Error(`${resp.status} loading ${key}`);
        return resp.json();
      })
      .then(({ data = [] }) => data.filter((row) => row.path && !NON_PAGE.test(row.path)))
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('search index failed to load', error);
        indexes.delete(key);
        return [];
      }));
  }
  return indexes.get(key);
}

/**
 * A row's searchable fields, normalized once per row (the page text is long).
 * @param {Object} row index row
 * @returns {{title: string, description: string, slug: string, content: string}}
 */
function fields(row) {
  if (!normalizedRows.has(row)) {
    normalizedRows.set(row, {
      title: normalize(pageTitle(row)),
      description: normalize(row.description),
      slug: normalize(row.path.split('/').pop()),
      content: normalize(row.content),
    });
  }
  return normalizedRows.get(row);
}

/**
 * Pages matching every word of the query. A word matches where a word in the
 * title, description, URL slug or page text starts with it ("med" finds "Medicare").
 * Best first: the whole query in the title, then every word in the title, then every
 * word in the title, description or slug, then pages whose text is needed for a match.
 * Within the first three groups the earlier the match, the higher; within the last,
 * the more often the words appear in the text.
 * @param {Object[]} rows index rows
 * @param {string} query
 * @returns {Object[]} matching rows, ranked
 */
export function searchIndex(rows, query) {
  const terms = queryTerms(query);
  if (!terms.length) return [];
  const phrase = ` ${terms.join(' ')}`;
  const first = ` ${terms[0]}`;
  const at = (text, part) => {
    const index = text.indexOf(part);
    return index < 0 ? Infinity : index;
  };
  const hasAll = (text) => terms.every((term) => text.includes(` ${term}`));
  const mentions = (text) => terms
    .reduce((sum, term) => sum + text.split(` ${term}`).length - 1, 0);

  return rows
    .map((row, order) => {
      const f = fields(row);
      const summary = `${f.title}${f.description}${f.slug}`;
      let rank;
      let score; // lower is better within a rank
      if (f.title.includes(phrase)) {
        rank = 0;
        score = at(f.title, phrase);
      } else if (hasAll(f.title)) {
        rank = 1;
        score = at(f.title, first);
      } else if (hasAll(summary)) {
        rank = 2;
        score = at(f.description, first);
      } else if (hasAll(`${summary}${f.content}`)) {
        rank = 3;
        score = -mentions(f.content);
      } else {
        return null;
      }
      return {
        row, order, rank, score,
      };
    })
    .filter(Boolean)
    // NaN (two Infinity scores) is falsy, so ties fall through to index order
    .sort((a, b) => a.rank - b.rank || a.score - b.score || a.order - b.order)
    .map(({ row }) => row);
}

/**
 * Heading level for result titles: one below the last heading before the block.
 * @param {Element} block
 * @returns {string} e.g. 'H2'
 */
function resultHeadingTag(block) {
  const section = block.closest('.section') || block.parentElement;
  const before = [...section.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter((h) => h.compareDocumentPosition(block) === Node.DOCUMENT_POSITION_FOLLOWING);
  const last = before.pop();
  const level = last ? Math.min(Number(last.tagName[1]) + 1, 6) : 2;
  return `H${level}`;
}

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function renderResult(row, headingTag) {
  const li = element('li', 'search-result');
  const heading = element(headingTag, 'search-result-title');
  const link = element('a', '', pageTitle(row));
  link.href = row.path;
  heading.append(link);
  li.append(heading);
  if (row.description) li.append(element('p', 'search-result-description', row.description));
  return li;
}

function renderSummary(summary, shown, total, query) {
  const p = element('p');
  const term = element('strong', '', query);
  p.append(`Showing ${shown} of ${total} result${total === 1 ? '' : 's'} for "`, term, '"');
  summary.replaceChildren(p);
}

function renderNoResults(container, query, headingTag) {
  const heading = element(headingTag, 'search-no-results-title', `We didn't find any pages related to "${query}"`);
  const tips = element('p', 'search-no-results-tips', 'Try searching again using these tips:');
  const list = element('ul');
  [
    'Double check that your search term is spelled correctly',
    'Try rephrasing keywords or using synonyms',
    'Try less specific keywords',
    'Make your query as concise as possible',
  ].forEach((tip) => list.append(element('li', '', tip)));
  const more = element('p', 'search-no-results-fallback');
  const link = element('a', '', `Search all of highmark.com for "${query}"`);
  link.href = fallbackSearchUrl(query);
  more.append(link);
  container.replaceChildren(heading, tips, list, more);
}

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const source = block.querySelector('a[href]')?.href || INDEX_PATH;
  const headingTag = resultHeadingTag(block);

  const form = element('form', 'search-bar');
  form.setAttribute('role', 'search');
  form.action = window.location.pathname;
  form.innerHTML = `
    <div class="search-field">
      <span class="search-field-icon" aria-hidden="true"></span>
      <input type="search" name="q" placeholder="Search..." aria-label="Search Highmark"
        autocomplete="off" enterkeyhint="search">
      <button type="button" class="search-clear" aria-label="Clear search" hidden>
        <span class="search-clear-icon" aria-hidden="true"></span>
      </button>
    </div>
    <button type="submit" class="search-submit">Search</button>`;
  const input = form.querySelector('input');
  const clear = form.querySelector('.search-clear');

  const summary = element('div', 'search-summary');
  summary.setAttribute('role', 'status');
  const results = element('ul', 'search-results');
  const more = element('p', 'search-more');
  const moreButton = element('button', 'search-more-button', 'Show more results');
  moreButton.type = 'button';
  more.append(moreButton);
  more.hidden = true;
  const noResults = element('div', 'search-no-results');
  noResults.hidden = true;

  block.replaceChildren(form, summary, results, more, noResults);

  let matches = [];
  let shown = 0;
  let query = '';
  let run = 0;

  const setUrl = (value) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('q', value);
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  };

  const reset = () => {
    matches = [];
    shown = 0;
    summary.replaceChildren();
    results.replaceChildren();
    more.hidden = true;
    noResults.hidden = true;
  };

  const showMore = () => {
    const next = matches.slice(shown, shown + PAGE_SIZE)
      .map((row) => renderResult(row, headingTag));
    results.append(...next);
    shown += next.length;
    renderSummary(summary, shown, matches.length, query);
    more.hidden = shown >= matches.length;
    return next[0];
  };

  const search = async (value) => {
    run += 1;
    const current = run;
    query = value.trim();
    setUrl(query);
    clear.hidden = !input.value;
    if (!query) {
      reset();
      return;
    }
    const rows = await loadIndex(source);
    if (current !== run) return; // a newer search started while the index loaded
    reset();
    matches = searchIndex(rows, query);
    if (!matches.length) {
      renderNoResults(noResults, query, headingTag);
      noResults.hidden = false;
      return;
    }
    showMore();
  };

  input.addEventListener('input', () => {
    const value = input.value.trim();
    if (value.length >= MIN_QUERY_LENGTH) search(value);
    else if (query) search('');
    clear.hidden = !input.value;
  });

  input.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      search('');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    search(input.value);
    input.blur();
  });

  clear.addEventListener('click', () => {
    input.value = '';
    search('');
    input.focus();
  });

  moreButton.addEventListener('click', () => {
    showMore()?.querySelector('a')?.focus();
  });

  const initial = new URLSearchParams(window.location.search).get('q');
  if (initial) {
    input.value = initial;
    await search(initial);
  }
}
