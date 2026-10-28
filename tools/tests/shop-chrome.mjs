/* eslint-env node */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- steps run one after another */
// Shop header/footer (ShopX layout): per-region content, live ZIP change, phone menu, and
// corporate chrome untouched. Shop pages are pointed at the new fragments in-flight.
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const HOST = process.env.HOST || 'http://localhost:3100';
const SWAP = process.env.SWAP !== '0';
const OUT = path.join(HERE, 'shots');
let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};
const SEL = {
  WPA: {
    zipCode: '15222', county: 'Allegheny', state: 'PA', regionCode: 'WPA', region: 'Western PA',
  },
  CPA: {
    zipCode: '17901', county: 'Schuylkill', state: 'PA', regionCode: 'CPA', region: 'Central PA',
  },
  WNY: {
    zipCode: '14202', county: 'Erie', state: 'NY', regionCode: 'WNY', region: 'Western New York',
  },
  NENY: {
    zipCode: '12207', county: 'Albany', state: 'NY', regionCode: 'NENY', region: 'Northeastern NY',
  },
};

async function open(b, url, { width = 1280, selection = null } = {}) {
  const ctx = await b.newContext({ viewport: { width, height: 900 } });
  if (selection) await ctx.addInitScript((s) => localStorage.setItem('shop-zip-county', s), JSON.stringify(selection));
  const pg = await ctx.newPage();
  pg.errors = [];
  pg.on('pageerror', (e) => pg.errors.push(`pageerror ${e.message.slice(0, 120)}`));
  pg.on('console', (m) => { if (m.type() === 'error' && !/livereload/.test(m.text())) pg.errors.push(`console ${m.text().slice(0, 120)}`); });
  pg.on('response', (r) => { if (r.status() >= 400) pg.errors.push(`${r.status()} ${r.url().slice(0, 100)}`); });
  if (SWAP) {
    await pg.route(/\/shop\/[^.]*$/, async (route) => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const resp = await route.fetch();
      const html = (await resp.text())
        .replace('content="/shop/fragments/nav"', 'content="/shop/fragments/shopx-header"')
        .replace('content="/shop/fragments/footer"', 'content="/shop/fragments/shopx-footer"');
      return route.fulfill({ response: resp, body: html });
    });
  }
  await pg.goto(`${HOST}${url}`, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(800);
  await pg.evaluate(() => document.querySelector('dialog[open]')?.close());
  return { ctx, pg };
}

const state = (pg) => pg.evaluate(() => {
  const vis = (e) => !!(e && (e.offsetWidth || e.offsetHeight));
  const header = document.querySelector('header .shop-header');
  const footer = document.querySelector('footer .shop-footer');
  const links = (root) => [...(root?.querySelectorAll('a') || [])].filter(vis).map((a) => `${a.textContent.trim()}→${a.getAttribute('href')}${a.target ? ' [_blank]' : ''}`);
  return {
    corporate: !!document.querySelector('header .nav-wrapper'),
    headerLogo: [...(header?.querySelectorAll('.shop-header-brand img') || [])].filter(vis).map((i) => i.alt),
    utility: [...(header?.querySelectorAll('.shop-header-utility a') || [])].filter(vis).map((a) => `${a.textContent.trim()}${a.querySelector('.icon img') ? ' (icon)' : ''}`),
    title: header?.querySelector('.shop-title p')?.textContent,
    region: vis(header?.querySelector('.shop-header-title .shop-header-region')) ? header.querySelector('.shop-header-title .shop-header-region').textContent : null,
    nav: links(header?.querySelector('.shop-header-panel')),
    search: !!header?.querySelector('form, input'),
    headerHeight: Math.round(document.querySelector('header .shop-header-wrapper')?.getBoundingClientRect().height || 0),
    footerLogo: [...(footer?.querySelectorAll('.shop-footer-logo img') || [])].filter(vis).map((i) => i.alt),
    footerColumns: links(footer?.querySelector('.shop-footer-columns')).filter((l) => !l.startsWith('→')),
    social: [...(footer?.querySelectorAll('.shop-footer-social img') || [])].filter(vis).length,
    legalLinks: links(footer?.querySelector('.shop-footer-legal-text')).slice(0, 6),
    legalStart: [...(footer?.querySelectorAll('.shop-footer-legal p') || [])].filter(vis).map((p) => p.textContent.trim().slice(0, 50)),
    raw: [...document.querySelectorAll('header a, footer a')].some((a) => vis(a) && /%7B%7B|\{\{/.test(a.getAttribute('href'))),
  };
});

(async () => {
  const b = await chromium.launch();

  // 1. no ZIP yet
  {
    const { ctx, pg } = await open(b, '/shop/');
    const s = await state(pg);
    check(!s.corporate && JSON.stringify(s.headerLogo) === '["Highmark Blue Cross Blue Shield"]', 'no ZIP: shop header with the BCBS logo', JSON.stringify(s.headerLogo));
    check(s.utility.join('|') === 'Language Assistance (icon)|Contact Us (icon)' && !s.search, 'utility links with icons, no search box', s.utility.join(' | '));
    check(s.title === 'Shop Individual & Family Plans' && s.region === null, 'title, no region label yet', `${s.title} / ${s.region}`);
    check(s.nav.join(' ; ') === 'Home→/shop/ ; Discover→/plans/individual-families ; Find a Doctor or RX→/shop/info-pages/find-a-doctor ; Medicare→https://medicare.highmark.com/home', 'pre-ZIP nav', s.nav.join(' ; '));
    check(JSON.stringify(s.footerLogo) === '["Highmark"]' && s.social === 7, 'generic footer logo + 7 social icons', `${s.footerLogo} ${s.social}`);
    check(s.footerColumns.some((l) => l.startsWith('Customer Service→/contact')) && s.footerColumns.some((l) => l.startsWith('Find a Doctor or Pharmacy')), 'pre-ZIP footer links', s.footerColumns.slice(3, 6).join(' ; '));
    check(s.legalStart.length === 1 && /^®Blue Cross/.test(s.legalStart[0]) && !s.raw, 'generic legal text, no raw tokens', s.legalStart.join(' | '));
    check(pg.errors.length === 0, 'no console errors / failed requests (no ZIP)', pg.errors.join(' | '));
    await pg.screenshot({
      path: path.join(OUT, 'chrome-none-1280.png'),
      clip: {
        x: 0, y: 0, width: 1280, height: 260,
      },
    });
    await ctx.close();
  }

  // 2. regions
  const expect = {
    WPA: {
      logo: 'Highmark Blue Cross Blue Shield', code: 'HMBCBS', pharmacy: 'western-pennsylvania', cs: 'highmarkbcbs.com', legal: /^®Highmark is a registered mark/,
    },
    CPA: {
      logo: 'Highmark Blue Shield', code: 'HMBSHIELD', pharmacy: 'central-pennsylvania', cs: 'highmarkblueshield.com', legal: /^®Highmark is a registered mark/,
    },
    WNY: {
      logo: 'Highmark Blue Cross Blue Shield', code: 'HMBCBS', pharmacy: 'western-new-york', about: 'member/bcbswny.html', legal: /^®Blue Cross, Blue Shield/,
    },
    NENY: {
      logo: 'Highmark Blue Shield', code: 'HMBSHIELD', pharmacy: 'northeastern-new-york', about: 'member/blueshieldneny.html', legal: /^®Blue Shield and the Blue Shield/,
    },
  };
  for (const [code, e] of Object.entries(expect)) {
    const { ctx, pg } = await open(b, '/shop/', { selection: SEL[code] });
    const s = await state(pg);
    check(JSON.stringify(s.headerLogo) === JSON.stringify([e.logo]) && JSON.stringify(s.footerLogo) === JSON.stringify([e.logo]), `${code}: header and footer logos`, `${s.headerLogo} / ${s.footerLogo}`);
    check(s.region === SEL[code].region, `${code}: region label`, s.region);
    const doctor = s.nav.find((l) => l.startsWith('Find a Doctor→'));
    const pharmacy = s.nav.find((l) => l.startsWith('Find a Pharmacy→'));
    check(doctor?.includes(`brandCode=${e.code}`) && doctor.endsWith('[_blank]') && pharmacy?.includes(`/${e.pharmacy}/individual-families/doctors-drugs`), `${code}: Find a Doctor / Pharmacy`, `${doctor} | ${pharmacy}`);
    if (e.cs) check(s.footerColumns.some((l) => l.startsWith('Customer Service→') && l.includes(e.cs)) && !s.footerColumns.some((l) => l.startsWith('Careers')), `${code}: Customer Service link`, s.footerColumns.find((l) => l.startsWith('Customer Service')));
    if (e.about) check(s.footerColumns.some((l) => l.startsWith('About Us→') && l.includes(e.about)) && s.legalLinks[0]?.startsWith('Security→'), `${code}: New York links`, `${s.footerColumns.find((l) => l.startsWith('About Us'))} | ${s.legalLinks[0]}`);
    check(e.legal.test(s.legalStart[0] || '') && !s.raw, `${code}: legal text`, `${s.legalStart.length} paragraphs: ${s.legalStart[0]}`);
    check(pg.errors.length === 0, `${code}: no console errors / failed requests`, pg.errors.join(' | '));
    if (code === 'WPA') {
      check(Math.abs(s.headerHeight - 208) <= 4, 'WPA: header height like ShopX (208px)', s.headerHeight);
      await pg.screenshot({
        path: path.join(OUT, 'chrome-wpa-header-1280.png'),
        clip: {
          x: 0, y: 0, width: 1280, height: 230,
        },
      });
      const f = await pg.$('footer .shop-footer');
      await f.screenshot({ path: path.join(OUT, 'chrome-wpa-footer-1280.png') });
    }
    if (code === 'WNY') {
      const f = await pg.$('footer .shop-footer');
      await f.screenshot({ path: path.join(OUT, 'chrome-wny-footer-1280.png') });
    }
    await ctx.close();
  }

  // 3. changing the ZIP updates the chrome without a reload
  {
    const { ctx, pg } = await open(b, '/shop/', { selection: SEL.WPA });
    await pg.click('.zip-location a');
    await pg.waitForSelector('dialog[open] input[name="zip"]');
    await pg.fill('dialog[open] input[name="zip"]', '17901');
    await pg.waitForTimeout(200);
    await pg.click('dialog[open] form .button, dialog[open] form button[type="submit"]');
    await pg.waitForTimeout(800);
    const s = await state(pg);
    check(JSON.stringify(s.headerLogo) === '["Highmark Blue Shield"]' && s.region === 'Central PA' && JSON.stringify(s.footerLogo) === '["Highmark Blue Shield"]', 'ZIP change switches logo, label and footer live', `${s.headerLogo} / ${s.region} / ${s.footerLogo}`);
    await ctx.close();
  }

  // 4. phone: bar, menu panel, Escape
  {
    const { ctx, pg } = await open(b, '/shop/', { width: 390, selection: SEL.WPA });
    let m = await pg.evaluate(() => ({
      bar: Math.round(document.querySelector('header .shop-header-top').getBoundingClientRect().height),
      title: !!document.querySelector('header .shop-header-title')?.offsetHeight,
      panel: !!document.querySelector('header .shop-header-panel')?.offsetHeight,
      hscroll: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    check(m.bar === 66 && !m.title && !m.panel && !m.hscroll, 'phone: 66px bar, no title, menu closed', JSON.stringify(m));
    await pg.screenshot({
      path: path.join(OUT, 'chrome-wpa-header-390.png'),
      clip: {
        x: 0, y: 0, width: 390, height: 120,
      },
    });
    await pg.click('header .shop-header-toggle');
    await pg.waitForTimeout(300);
    m = await pg.evaluate(() => {
      const panel = document.querySelector('header .shop-header-panel');
      const vis = (e) => !!(e && (e.offsetWidth || e.offsetHeight));
      return {
        open: vis(panel),
        expanded: document.querySelector('header .shop-header-toggle').getAttribute('aria-expanded'),
        items: [...panel.querySelectorAll('a, .shop-header-region')].filter(vis).map((e) => e.textContent.trim()),
      };
    });
    check(m.open && m.expanded === 'true' && m.items.join('|') === 'Home|Discover|Find a Doctor|Find a Pharmacy|Medicare|Language Assistance|Contact Us|Western PA', 'phone menu: nav, utility links, region', m.items.join(' | '));
    await pg.screenshot({
      path: path.join(OUT, 'chrome-wpa-menu-390.png'),
      clip: {
        x: 0, y: 0, width: 390, height: 560,
      },
    });
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(200);
    const closed = await pg.evaluate(() => !document.querySelector('header .shop-header-panel').offsetHeight);
    check(closed, 'Escape closes the menu');
    const f = await pg.$('footer .shop-footer');
    await f.screenshot({ path: path.join(OUT, 'chrome-wpa-footer-390.png') });
    check(pg.errors.length === 0, 'phone: no console errors', pg.errors.join(' | '));
    await ctx.close();
  }

  // 5. corporate chrome untouched (the shop theme alone doesn't switch it)
  for (const url of ['/', '/plans/individual-families', '/shop/info-pages/contact-us']) {
    const { ctx, pg } = await open(b, url, { selection: SEL.WPA });
    const s = await state(pg);
    const shopPage = url.startsWith('/shop/');
    check(shopPage ? !s.corporate && s.headerLogo.length === 1 : s.corporate && s.headerLogo.length === 0, `${url}: ${shopPage ? 'shop' : 'corporate'} chrome`, `corporate=${s.corporate}`);
    await ctx.close();
  }

  await b.close();
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
})();
