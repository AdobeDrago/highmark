/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- steps run one after another */
// Phone/tablet header search (highmark.com's pattern): the 84px bar holds the menu button, the
// logo and the search icon, in that order on screen and in the tab order; the icon opens the
// search box in place of the logo; the drawer has no search box; the closed drawer is out of
// the tab order. Desktop keeps the nav-row search box.
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const HOST = process.env.HOST || 'http://localhost:3100';
const OUT = path.join(HERE, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const SEL = JSON.stringify({
  zipCode: '15222', county: 'Allegheny', state: 'PA', regionCode: 'WPA', region: 'Western PA',
});
let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

async function open(b, url, width, height = 844) {
  const ctx = await b.newContext({ viewport: { width, height } });
  await ctx.addInitScript((s) => localStorage.setItem('shop-zip-county', s), SEL);
  const pg = await ctx.newPage();
  pg.errors = [];
  pg.on('pageerror', (e) => pg.errors.push(`pageerror ${e.message.slice(0, 120)}`));
  pg.on('console', (m) => { if (m.type() === 'error' && !/livereload/.test(m.text())) pg.errors.push(`console ${m.text().slice(0, 120)}`); });
  pg.on('response', (r) => { if (r.status() >= 400) pg.errors.push(`${r.status()} ${r.url().slice(0, 100)}`); });
  await pg.goto(`${HOST}${url}`, { waitUntil: 'networkidle' });
  await pg.waitForSelector('header .nav-brand-row', { timeout: 15000 });
  await pg.waitForTimeout(300);
  return { ctx, pg };
}

// state of the header, for the checks
const state = (pg) => pg.evaluate(() => {
  const nav = document.querySelector('header nav');
  const row = nav.querySelector('.nav-brand-row');
  const form = nav.querySelector('.nav-search');
  const toggle = nav.querySelector('.nav-search-toggle');
  const popup = form.querySelector('.nav-search-suggestions');
  const rect = (el) => {
    const r = el.getBoundingClientRect(); return {
      l: Math.round(r.left),
      r: Math.round(r.right),
      t: Math.round(r.top),
      b: Math.round(r.bottom),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  };
  const shown = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
  const logo = nav.querySelector('.nav-brand');
  const main = document.querySelector('main');
  return {
    open: nav.classList.contains('nav-search-open'),
    menuOpen: nav.classList.contains('nav-open'),
    formParent: form.parentElement.className,
    formShown: shown(form),
    form: rect(form),
    toggleShown: shown(toggle),
    toggle: toggle ? rect(toggle) : null,
    expanded: toggle?.getAttribute('aria-expanded'),
    controls: toggle?.getAttribute('aria-controls'),
    logoShown: shown(logo),
    hamburger: rect(nav.querySelector('.nav-hamburger')),
    row: rect(row),
    header: rect(document.querySelector('header')),
    mainTop: Math.round(main.getBoundingClientRect().top + window.scrollY),
    focused: document.activeElement === form.querySelector('input'),
    active: `${document.activeElement.tagName}.${document.activeElement.className}`,
    popupOpen: !popup.hidden,
    popup: rect(popup),
    authored: popup.classList.contains('nav-search-authored'),
    items: [...popup.querySelectorAll('li')].map((li) => li.textContent.trim()),
    drawerHasSearch: !!nav.querySelector('.nav-primary-row .nav-search'),
    drawerVisibility: getComputedStyle(nav.querySelector('.nav-primary-row')).visibility,
    inputFont: getComputedStyle(form.querySelector('input')).fontSize,
    scrollW: document.documentElement.scrollWidth,
  };
});

(async () => {
  const b = await chromium.launch();

  for (const width of [390, 768]) {
    console.log(`\n---- @${width} ----`);
    const { ctx, pg } = await open(b, '/plans', width);
    // the source's container padding: 30px, 64px from 768px
    const pad = width < 768 ? 30 : 64;
    let s = await state(pg);
    check(s.toggleShown && s.logoShown && !s.formShown && !s.open, `@${width} closed: logo + search icon shown, box hidden`);
    check(s.hamburger.l === pad && s.hamburger.w === 27 && s.toggle.l > s.hamburger.r && s.toggle.r <= width - pad + 1 && s.toggle.h === 44, `@${width} menu button at the left edge, search icon on the right, 44px tall`, `menu ${s.hamburger.l}+${s.hamburger.w}, icon ${s.toggle.l}-${s.toggle.r} h${s.toggle.h}`);
    check(s.expanded === 'false' && s.controls === 'nav-search', `@${width} icon aria-expanded=false, aria-controls=nav-search`);
    check(!s.drawerHasSearch && s.formParent === 'nav-brand-row', `@${width} search box is in the brand row, not the menu`, s.formParent);
    check(s.drawerVisibility === 'hidden', `@${width} closed menu is visibility:hidden`, s.drawerVisibility);
    check(s.header.h === 84 && s.row.h === 84, `@${width} header 84px (reserved), the bar 84px`, `header ${s.header.h} row ${s.row.h}`);
    check(s.scrollW === width, `@${width} no sideways scroll (closed)`, `${s.scrollW}`);
    const before = s;
    await pg.screenshot({
      path: path.join(OUT, `msearch-${width}-closed.png`),
      clip: {
        x: 0, y: 0, width, height: 120,
      },
    });

    // open: box in place of the logo, focused, the sheet's suggestions under the row
    await pg.click('header .nav-search-toggle');
    await pg.waitForSelector('header .nav-search-suggestions:not([hidden]) li', { timeout: 10000 }).catch(() => {});
    await pg.waitForTimeout(200);
    s = await state(pg);
    check(s.open && s.formShown && !s.logoShown && !s.toggleShown && s.focused, `@${width} icon opens the box, focused; logo and icon hidden`, s.active);
    check(s.expanded === 'true', `@${width} icon aria-expanded=true while open`);
    check(s.form.l === s.hamburger.r + 13 && s.form.r === width - pad && s.form.h === 40, `@${width} box fills the row after the menu button`, `${s.form.l}-${s.form.r} h${s.form.h}`);
    check(s.inputFont === '16px', `@${width} input text 16px (no iOS zoom)`, s.inputFont);
    check(s.popupOpen && s.authored && s.items.length === 5, `@${width} 5 authored suggestions on open`, s.items.join(', '));
    check(s.popup.l === 0 && s.popup.r === width && s.popup.t === s.row.b, `@${width} suggestions full width under the row`, `${s.popup.l}-${s.popup.r} top ${s.popup.t} row bottom ${s.row.b}`);
    check(s.header.h === before.header.h && s.mainTop === before.mainTop && s.row.h === before.row.h, `@${width} no layout shift on open`, `header ${before.header.h}->${s.header.h} main ${before.mainTop}->${s.mainTop} row ${before.row.h}->${s.row.h}`);
    check(s.scrollW === width, `@${width} no sideways scroll (open)`, `${s.scrollW}`);
    await pg.screenshot({
      path: path.join(OUT, `msearch-${width}-open.png`),
      clip: {
        x: 0, y: 0, width, height: 420,
      },
    });

    // typing: page-title suggestions
    await pg.keyboard.type('medicare', { delay: 30 });
    await pg.waitForTimeout(600);
    s = await state(pg);
    check(s.popupOpen && !s.authored && s.items.length > 0, `@${width} typing lists matching pages`, s.items.slice(0, 3).join(' | '));
    await pg.screenshot({
      path: path.join(OUT, `msearch-${width}-typed.png`),
      clip: {
        x: 0, y: 0, width, height: 420,
      },
    });

    // Escape: first the list, then the box (focus back on the icon)
    await pg.keyboard.press('Escape');
    s = await state(pg);
    check(!s.popupOpen && s.open && s.focused, `@${width} Escape closes the list, keeps the box`);
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(100);
    s = await state(pg);
    check(!s.open && s.logoShown && s.toggleShown && s.active.includes('nav-search-toggle'), `@${width} 2nd Escape closes the box, focus on the icon`, s.active);
    check(s.expanded === 'false', `@${width} icon aria-expanded=false after closing`);

    // reopen keeps the typed text; a tap outside closes it
    await pg.click('header .nav-search-toggle');
    await pg.waitForTimeout(400);
    const kept = await pg.inputValue('header .nav-search input');
    check(kept === 'medicare', `@${width} reopening keeps the typed text`, kept);
    await pg.mouse.click(Math.round(width / 2), 600);
    await pg.waitForTimeout(200);
    s = await state(pg);
    check(!s.open && s.logoShown, `@${width} a tap outside closes the box`);

    // a tap on a suggestion opens it (the box must not close first)
    await pg.click('header .nav-search-toggle');
    await pg.fill('header .nav-search input', '');
    await pg.keyboard.type('medicare', { delay: 30 });
    await pg.waitForSelector('header .nav-search-suggestions:not(.nav-search-authored) li a', { timeout: 10000 });
    const firstHref = await pg.getAttribute('header .nav-search-suggestions li a', 'href');
    await Promise.all([pg.waitForURL((u) => u.pathname === new URL(firstHref, HOST).pathname, { timeout: 15000 }).catch(() => {}), pg.click('header .nav-search-suggestions li a')]);
    check(new URL(pg.url()).pathname === new URL(firstHref, HOST).pathname, `@${width} tapping a suggestion opens it`, `${firstHref} -> ${new URL(pg.url()).pathname}`);

    // submit by tapping the magnifier in the box
    await pg.goto(`${HOST}/plans`, { waitUntil: 'networkidle' });
    await pg.click('header .nav-search-toggle');
    await pg.keyboard.type('dental', { delay: 30 });
    await Promise.all([pg.waitForURL(/[/]search[?]q=dental/, { timeout: 15000 }).catch(() => {}), pg.click('header .nav-search button[type=submit]')]);
    check(/[/]search[?]q=dental/.test(pg.url()), `@${width} the box's search button submits to /search`, pg.url().replace(HOST, ''));

    // menu: no search box; the icon still works with the menu open (closes it)
    await pg.goto(`${HOST}/plans`, { waitUntil: 'networkidle' });
    await pg.click('header .nav-search-toggle');
    await pg.click('header .nav-hamburger');
    await pg.waitForTimeout(450);
    s = await state(pg);
    check(s.menuOpen && !s.open && s.drawerVisibility === 'visible', `@${width} menu button closes the box and opens the menu`);
    const drawer = await pg.evaluate(() => [...document.querySelector('header .nav-primary-row').children].map((c) => c.className));
    check(!drawer.includes('nav-search'), `@${width} menu holds no search box`, drawer.join(', '));
    await pg.screenshot({
      path: path.join(OUT, `msearch-${width}-menu.png`),
      clip: {
        x: 0, y: 0, width, height: 520,
      },
    });
    // Tab from the menu button: the logo, the search icon, then the open menu
    await pg.focus('header .nav-hamburger');
    const openOrder = [];
    for (let i = 0; i < 3; i += 1) {
      await pg.keyboard.press('Tab');
      openOrder.push(await pg.evaluate(() => {
        const a = document.activeElement;
        if (a.closest('.nav-primary-row')) return `menu:${a.textContent.trim()}`;
        if (a.closest('.nav-brand')) return 'logo';
        return a.className;
      }));
    }
    check(openOrder.join(' > ') === 'logo > nav-search-toggle > menu:Plans', `@${width} Tab from the menu button: logo, search icon, then the open menu`, openOrder.join(' > '));
    await pg.click('header .nav-search-toggle');
    await pg.waitForTimeout(450);
    s = await state(pg);
    check(!s.menuOpen && s.open && s.focused, `@${width} search icon with the menu open: menu closes, box opens`);
    check(await pg.evaluate(() => document.body.style.overflowY === ''), `@${width} page scroll restored`);
    await pg.keyboard.press('Escape');
    await pg.keyboard.press('Escape');

    // closed menu is out of the tab order: Tab from the search icon (the bar's last control)
    // leaves the header
    await pg.waitForTimeout(450);
    await pg.focus('header .nav-search-toggle');
    await pg.keyboard.press('Tab');
    const next = await pg.evaluate(() => {
      const a = document.activeElement;
      return { inMenu: !!a.closest('.nav-primary-row'), inHeader: !!a.closest('header'), what: `${a.tagName} ${a.textContent.trim().slice(0, 24)}` };
    });
    check(!next.inMenu && !next.inHeader, `@${width} closed menu: Tab from the search icon leaves the header`, next.what);
    // and the menu button comes first, then the logo, then the icon
    await pg.focus('header .nav-hamburger');
    await pg.keyboard.press('Tab');
    const second = await pg.evaluate(() => !!document.activeElement.closest('.nav-brand'));
    await pg.keyboard.press('Tab');
    const third = await pg.evaluate(() => document.activeElement.classList.contains('nav-search-toggle'));
    check(second && third, `@${width} tab order: menu button, logo, search icon`);

    check(pg.errors.length === 0, `@${width} no console errors / failed requests`, pg.errors.join(' | '));
    await ctx.close();
  }

  // desktop: the nav-row box, no icon
  {
    console.log('\n---- @1280 ----');
    const { ctx, pg } = await open(b, '/plans', 1280, 900);
    let s = await state(pg);
    check(!s.toggleShown && s.formShown && s.formParent === 'nav-primary-row', '@1280 box in the nav row, no search icon', s.formParent);
    const order = await pg.evaluate(() => [...document.querySelector('header .nav-primary-row').children].map((c) => c.className).slice(0, 2).join(' > '));
    check(order === 'nav-sections > nav-search', '@1280 box right after the nav links', order);
    check(s.drawerVisibility === 'visible', '@1280 nav row visible', s.drawerVisibility);
    await pg.click('header .nav-search input');
    await pg.waitForSelector('header .nav-search-suggestions:not([hidden]) li', { timeout: 10000 }).catch(() => {});
    s = await state(pg);
    check(s.popupOpen && s.items.length === 5 && s.popup.w === 377 && s.popup.r === s.form.r, '@1280 desktop suggestions unchanged (377px, under the box)', `${s.popup.w}px ${s.popup.l}-${s.popup.r}`);

    // resize across the breakpoint and back
    await pg.keyboard.press('Escape');
    await pg.setViewportSize({ width: 390, height: 844 });
    await pg.waitForTimeout(300);
    s = await state(pg);
    check(s.formParent === 'nav-brand-row' && !s.formShown && s.toggleShown, 'resize to 390: box moves into the row, hidden behind the icon', s.formParent);
    await pg.click('header .nav-search-toggle');
    await pg.waitForTimeout(300);
    s = await state(pg);
    check(s.open && s.focused, 'resize to 390: the icon opens the box');
    await pg.setViewportSize({ width: 1280, height: 900 });
    await pg.waitForTimeout(300);
    s = await state(pg);
    check(!s.open && s.formParent === 'nav-primary-row' && s.formShown, 'resize back to 1280: box back in the nav row, open state cleared', s.formParent);
    check(pg.errors.length === 0, '@1280 no console errors / failed requests', pg.errors.join(' | '));
    await ctx.close();
  }

  await b.close();
  console.log(`\n${failures ? `${failures} FAILED` : 'all passed'}`);
  process.exit(failures ? 1 : 0);
})();
