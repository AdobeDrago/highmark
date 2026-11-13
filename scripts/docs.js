/* Docs layout (template: docs). Turns a guide page into a documentation layout:
   a sidebar with the guide switcher, the guide's pages and this page's sections,
   a compact title, framed live examples and plain links. */
const GUIDES = [['author', 'Author'], ['developer', 'Developer'], ['admin', 'Admin']];

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  e.append(...children);
  return e;
}

export default function decorateDocs(main) {
  const sections = [...main.querySelectorAll(':scope > .section')];
  if (!sections.length) return;
  const guide = (window.location.pathname.match(/^\/docs\/guides\/([^/]+)/) || [])[1];

  sections[0].classList.add('docs-title');

  // the guide's page list: "<Guide> guide: Page · Page · <strong>Current</strong> · ..."
  const navSection = sections.find((s) => /^\s*\w+ guide:/.test(s.textContent));
  const pages = [];
  if (navSection) {
    navSection.querySelectorAll('p > a, p > strong').forEach((n, i) => {
      if (i === 0 && n.tagName === 'STRONG') return;
      pages.push(n.tagName === 'A'
        ? { href: n.getAttribute('href'), text: n.textContent.trim() }
        : { text: n.textContent.trim(), current: true });
    });
    navSection.remove();
  }
  sections.find((s) => /^\s*On this page:/.test(s.textContent))?.remove();

  sections.forEach((s) => {
    const label = s.querySelector(':scope > .default-content-wrapper > p:first-child > em:only-child');
    if (label && /^Example:/.test(label.textContent)) {
      s.classList.add('docs-example');
      label.parentElement.classList.add('docs-example-label');
      label.parentElement.textContent = label.textContent.replace(/^Example:\s*/, '');
    }
    if (s === sections.at(-1) && /Updated .+\d{4}/.test(s.textContent)) {
      s.classList.add('docs-pagefoot');
    }
  });

  // links styled as buttons read as calls to action; in a guide they are plain links
  main.querySelectorAll('.section:not(.docs-example) a.button').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary');
    a.parentElement.classList.remove('button-container');
  });

  // this page's sections, for the sidebar
  const toc = el('ol', { class: 'docs-toc' });
  main.querySelectorAll('.section:not(.docs-example):not(.docs-title) h2').forEach((h) => {
    if (h.id) toc.append(el('li', {}, el('a', { href: `#${h.id}` }, h.textContent)));
  });

  const list = el('ol', { class: 'docs-pages' });
  pages.forEach((p) => {
    const li = el('li');
    if (p.current) {
      li.append(el('a', { href: window.location.pathname, 'aria-current': 'page' }, p.text));
      if (toc.children.length > 1) li.append(toc);
    } else li.append(el('a', { href: p.href }, p.text));
    list.append(li);
  });

  const tabs = el('nav', { class: 'docs-switch', 'aria-label': 'Guides' });
  GUIDES.forEach(([key, name]) => {
    const a = el('a', { href: `/docs/guides/${key}/` }, name);
    if (key === guide) a.setAttribute('aria-current', 'true');
    tabs.append(a);
  });

  const menu = el('details', { class: 'docs-menu' }, el('summary', {}, 'Contents'), list);
  const wide = window.matchMedia('(width >= 1024px)');
  const sync = () => { menu.open = wide.matches; };
  sync();
  wide.addEventListener('change', sync);

  const aside = el(
    'aside',
    { class: 'docs-sidebar' },
    el('a', { class: 'docs-brand', href: '/docs/guides/' }, 'Highmark ', el('span', {}, 'site guides')),
    tabs,
    menu,
  );
  main.before(aside);

  // highlight the section in view
  const links = new Map([...toc.querySelectorAll('a')].map((a) => [a.hash.slice(1), a]));
  if (links.size) {
    const seen = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e) => {
        links.forEach((a) => a.removeAttribute('aria-current'));
        links.get(e.target.id)?.setAttribute('aria-current', 'location');
      });
    }, { rootMargin: '0px 0px -70% 0px' });
    [...links.keys()].forEach((id) => {
      const h = document.getElementById(id);
      if (h) seen.observe(h);
    });
  }
}
