/*
 * Forms library (highmark.com's regional Forms Library: /member/bcbswny/forms, ...).
 *
 * Authoring: one row per category, then one row per form in it.
 * - A category row starts with a heading (the category's name) and may have a second
 *   cell with its description.
 * - A form row has the form's name, then its link(s): "Download PDF" (:pdf: before the
 *   text adds the PDF icon) or a link to the online form.
 *
 * The block lists the forms by category, with the source's search panel beside them:
 * a keyword search (run with Enter or the search button; it matches every word of
 * the query in a form's name, and resets the category to All) and the category
 * filter (All, or one category). Below 768px the panel folds under a Filter button.
 * The intro (the section's text before the block) hides while a filter is on, as on
 * the source.
 */

let uid = 0;

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

/** An icon as decorateIcons makes one (the panel is built after decoration). */
function icon(name) {
  const span = element('span', `icon icon-${name}`);
  const img = element('img');
  img.dataset.iconName = name;
  img.src = `${window.hlx.codeBasePath}/icons/${name}.svg`;
  img.alt = '';
  img.loading = 'lazy';
  span.append(img);
  return span;
}

const words = (text) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/** Categories and their forms from the authored rows. */
function readRows(block) {
  const categories = [];
  [...block.children].forEach((row) => {
    const [first, ...rest] = [...row.children];
    if (!first) return;
    const heading = first.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      categories.push({ name: heading.textContent.trim(), description: rest[0], forms: [] });
      return;
    }
    const name = first.textContent.trim();
    if (!name) return;
    if (!categories.length) categories.push({ name: 'Forms', forms: [] });
    categories[categories.length - 1].forms.push({ name, links: rest.flatMap((cell) => [...cell.querySelectorAll('a')]) });
  });
  return categories;
}

function renderForm(form) {
  const li = element('li', 'forms-library-form');
  li.append(element('h3', 'forms-library-form-name', form.name));
  const links = element('p', 'forms-library-form-links');
  form.links.forEach((a) => {
    a.className = 'forms-library-link';
    a.closest('.button-container')?.classList.remove('button-container');
    if (/\.pdf($|[?#])/i.test(a.getAttribute('href') || '') || a.querySelector('.icon-pdf')) {
      a.classList.add('forms-library-link-pdf');
    }
    links.append(a);
  });
  li.append(links);
  li.dataset.words = words(form.name).join(' ');
  return li;
}

function renderCategory(category, id) {
  const group = element('div', 'forms-library-group');
  group.id = id;
  group.append(element('h2', 'forms-library-group-name', category.name));
  const description = category.description?.textContent.trim();
  if (description) group.append(element('p', 'forms-library-group-description', description));
  const list = element('ul', 'forms-library-forms');
  list.append(...category.forms.map(renderForm));
  group.append(list);
  return group;
}

function buildPanel(categories, ids, n) {
  const panel = element('div', 'forms-library-panel');
  panel.id = `forms-library-panel-${n}`;

  const search = element('form', 'forms-library-search');
  search.setAttribute('role', 'search');
  const title = element('p', 'forms-library-search-title', 'Forms Library Search');
  title.id = `forms-library-search-title-${n}`;
  const field = element('div', 'forms-library-search-field');
  const input = element('input');
  input.type = 'search';
  input.name = 'keyword';
  input.placeholder = 'Search by Keyword';
  input.setAttribute('aria-labelledby', title.id);
  const submit = element('button', 'forms-library-search-submit');
  submit.type = 'submit';
  submit.setAttribute('aria-label', 'Search');
  submit.append(icon('search'));
  field.append(input, submit);
  search.append(title, field);

  const filter = element('div', 'forms-library-filter');
  filter.append(element('p', 'forms-library-filter-title', 'Filter'));
  const label = element('p', 'forms-library-category-label', 'Form Category');
  label.id = `forms-library-category-label-${n}`;
  const list = element('ul', 'forms-library-categories');
  list.setAttribute('aria-labelledby', label.id);
  const button = (name, target) => {
    const li = element('li');
    const b = element('button', 'forms-library-category-button', name);
    b.type = 'button';
    b.dataset.target = target;
    b.setAttribute('aria-pressed', target ? 'false' : 'true');
    if (target) b.setAttribute('aria-controls', target);
    li.append(b);
    return li;
  };
  list.append(button('All', ''), ...categories.map((c, i) => button(c.name, ids[i])));
  filter.append(label, list);

  panel.append(search, filter);
  return panel;
}

function noResults() {
  const box = element('div', 'forms-library-no-results');
  box.setAttribute('role', 'status');
  box.hidden = true;
  const text = element('p');
  const query = element('strong');
  const reset = element('button', 'forms-library-reset', 'new search term');
  reset.type = 'button';
  text.append('Sorry, your search for ', query, ' did not return any results. Please, try again with a ', reset, '.');
  box.append(text);
  return { box, query, reset };
}

export default function decorate(block) {
  const categories = readRows(block);
  uid += 1;
  const ids = categories.map((c, i) => `forms-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uid}-${i}`);
  const panel = buildPanel(categories, ids, uid);
  const results = element('div', 'forms-library-results');
  const groups = categories.map((c, i) => renderCategory(c, ids[i]));
  results.append(...groups);

  // below 768px the panel folds under a Filter button
  const toggle = element('button', 'forms-library-toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', panel.id);
  toggle.append(icon('filter'), 'Filter');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.classList.toggle('open', open);
  });

  const input = panel.querySelector('input');
  const buttons = [...panel.querySelectorAll('.forms-library-category-button')];
  // the intro text (not the H1) before the block in its section
  const intro = [...(block.closest('.section')?.querySelectorAll('.default-content-wrapper > p') || [])];
  const state = { keyword: '', category: '' };
  const empty = noResults();
  results.append(empty.box);

  const render = () => {
    const query = words(state.keyword);
    let shown = 0;
    groups.forEach((group) => {
      let inGroup = 0;
      group.querySelectorAll('.forms-library-form').forEach((li) => {
        const name = li.dataset.words.split(' ');
        const match = query.every((q) => name.some((w) => w.startsWith(q)));
        li.hidden = !match;
        if (match) inGroup += 1;
      });
      group.hidden = !inGroup || (state.category && group.id !== state.category);
      if (!group.hidden) shown += inGroup;
    });
    buttons.forEach((b) => b.setAttribute('aria-pressed', b.dataset.target === state.category ? 'true' : 'false'));
    empty.box.hidden = shown > 0;
    empty.query.textContent = state.keyword;
    intro.forEach((p) => { p.hidden = !!state.category || shown === 0; });
  };
  empty.reset.addEventListener('click', () => {
    input.value = '';
    state.keyword = '';
    render();
    input.focus();
  });

  panel.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.keyword = input.value.trim();
    state.category = '';
    render();
  });
  buttons.forEach((b) => b.addEventListener('click', () => {
    state.category = b.dataset.target;
    render();
  }));

  block.replaceChildren(toggle, panel, results);
}
