/* eslint-disable */
/* global WebImporter */

/**
 * Header and footer fragments of the regional member pages (/member/bcbs, /blueshield,
 * /bcbswv, /bcbsde, /bcbswny, /blueshieldneny), read from each source page. The page URL's
 * ?part= picks the fragment: part=nav -> /member/fragments/<region>/nav, part=footer ->
 * /member/fragments/<region>/footer (the pages' nav / footer metadata,
 * import-member-regional.js).
 *
 * nav: two sections, so the header has no utility bar (blocks/header):
 *   1. the region's logo and its mobile logo, in one link home;
 *   2. the menu: a link to /nav, the corporate menu. Where the source menu has a "NY State
 *      Plans" group (Western NY) in place of "CHIP - Highmark Healthy Kids", a list item
 *      labelled "CHIP - Highmark Healthy Kids" holds it, and the header swaps it in.
 * footer: the corporate footer's sections (blocks/footer) plus a footer-top band:
 *   1. footer-top: the "Federal Employee Program" link band;
 *   2. brand: logo, LinkedIn, Customer Service and its phone number, the extra links
 *      (COVID-19 Resources);
 *   3-5. the three link columns (About Highmark, Be Informed, Related Sites);
 *   6. the legal text.
 */

const SOURCE_PREFIX = '/content/digital-marketing/en/highmark/highmarkdotcom/home';

// Source paths -> site-relative paths; the source's "external link" glyphs go.
function cleanLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href.startsWith(SOURCE_PREFIX)) a.setAttribute('href', href.slice(SOURCE_PREFIX.length) || '/');
    ['target', 'data-cmp-target', 'data-cmp-clickable', 'data-cmp-cta-name', 'tabindex', 'type'].forEach((k) => a.removeAttribute(k));
  });
  root.querySelectorAll('i.fa, i[class*="fa-"]').forEach((i) => i.remove());
}

const el = (document, tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  e.append(...children);
  return e;
};

const text = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();

function navFragment(document) {
  const out = document.createElement('div');
  // 1. logo
  // the region's logo (img.fixed-height), then the mobile one (img.fixed-height-mobile),
  // in one link; the header shows the second below 992px
  const logos = ['img.fixed-height', 'img.fixed-height-mobile']
    .map((sel) => document.querySelector(sel)).filter(Boolean)
    .map((logo) => el(document, 'img', { src: logo.getAttribute('src'), alt: logo.getAttribute('alt') || 'Highmark logo' }));
  if (logos.length) out.append(el(document, 'p', {}, el(document, 'a', { href: '/' }, ...logos)));
  out.append(document.createElement('hr'));
  // 2. menu: the corporate one, with this region's replacement group if it has one
  out.append(el(document, 'p', {}, el(document, 'a', { href: '/nav' }, '/nav')));
  const menu = document.querySelector('ul.main-menu');
  const nyGroup = menu && [...menu.querySelectorAll('li.nav-menu-item')]
    .find((li) => text(li.querySelector(':scope > a')) === 'NY State Plans');
  if (nyGroup) {
    const head = nyGroup.querySelector(':scope > a');
    const items = [...nyGroup.querySelectorAll(':scope > ul > li > a')].map((a) => el(document, 'li', {}, el(document, 'a', { href: a.getAttribute('href') }, text(a))));
    const group = el(document, 'li', {},
      el(document, 'p', {}, el(document, 'a', { href: head.getAttribute('href') }, text(head))),
      el(document, 'ul', {}, ...items));
    out.append(el(document, 'ul', {}, el(document, 'li', {},
      el(document, 'p', {}, 'CHIP - Highmark Healthy Kids'),
      el(document, 'ul', {}, group))));
  }
  return out;
}

function footerFragment(document) {
  const footer = document.querySelector('.global-footer');
  const out = document.createElement('div');
  if (!footer) return out;
  cleanLinks(footer);

  // 1. top band
  const topLinks = [...footer.querySelectorAll('.topfooter-link-list a[href]')].filter((a) => text(a));
  if (topLinks.length) {
    topLinks.forEach((a) => out.append(el(document, 'p', {}, el(document, 'a', { href: a.getAttribute('href') }, text(a)))));
    out.append(WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style: 'footer-top' } }));
    out.append(document.createElement('hr'));
  }

  // 2. brand
  const logo = footer.querySelector('img.footerlogoimg');
  if (logo) out.append(el(document, 'p', {}, el(document, 'img', { src: logo.getAttribute('src'), alt: logo.getAttribute('alt') || '' })));
  const social = [...footer.querySelectorAll('.extended-social-icons-list a[href], .social-icons-list a[href]')];
  if (social.length) {
    out.append(el(document, 'ul', {}, ...social.map((a) => {
      const icon = a.querySelector('img');
      const content = icon ? el(document, 'img', { src: icon.getAttribute('src'), alt: icon.getAttribute('alt') || text(a) }) : text(a);
      return el(document, 'li', {}, el(document, 'a', { href: a.getAttribute('href') }, content));
    })));
  }
  const phoneLabel = footer.querySelector('.footer-find-dr-phone-1');
  const phone = footer.querySelector('a.footer-find-dr-phone-2');
  if (phoneLabel) out.append(el(document, 'p', {}, text(phoneLabel)));
  if (phone) out.append(el(document, 'p', {}, el(document, 'a', { href: phone.getAttribute('href') }, text(phone))));
  footer.querySelectorAll('.additional-links-section a[href]').forEach((a) => {
    out.append(el(document, 'p', {}, el(document, 'a', { href: a.getAttribute('href') }, text(a))));
  });

  // 3-5. link columns (the desktop copies)
  footer.querySelectorAll('.footer-list.desktop').forEach((col) => {
    out.append(document.createElement('hr'));
    out.append(el(document, 'p', {}, text(col.querySelector('.footer-section-title'))));
    out.append(el(document, 'ul', {}, ...[...col.querySelectorAll('li a[href]')]
      .map((a) => el(document, 'li', {}, el(document, 'a', { href: a.getAttribute('href') }, text(a))))));
  });

  // 6. legal text ({currentyear} is filled in at import)
  out.append(document.createElement('hr'));
  const legal = footer.querySelector('.global-footer-disclaimer') || footer.querySelector('.copy-right');
  [...(legal?.querySelectorAll(':scope > p') || [])].forEach((p) => {
    if (!text(p)) return;
    const copy = p.cloneNode(true);
    copy.querySelectorAll('br:last-child').forEach((br) => br.remove());
    [copy, ...copy.querySelectorAll('*')].forEach((e) => { e.removeAttribute('class'); e.removeAttribute('id'); });
    copy.innerHTML = copy.innerHTML.replace(/\{currentyear\}/g, String(new Date().getFullYear()));
    out.append(copy);
  });
  return out;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const source = new URL(params.originalURL);
    const part = source.searchParams.get('part') === 'footer' ? 'footer' : 'nav';
    const region = source.pathname.replace(/\/$/, '').split('/').pop().toLowerCase();

    const main = part === 'footer' ? footerFragment(document) : navFragment(document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    return [{
      element: main,
      path: `/member/fragments/${region}/${part}`,
      report: {
        title: `${region} ${part}`,
        template: 'member-chrome',
      },
    }];
  },
};
