/* eslint-env node */
/* eslint-disable no-console */
/**
 * The source's mega menu (levels 1-3, with each item's region and Availity flags), from
 * providers.highmark.com's home page. Writes data/menu-tree.json, which classify.mjs and
 * build.mjs read, and prints the tree.
 *
 * Usage: node menu-tree.mjs
 */
// optional dependency (see README): npm i --no-save playwright
// eslint-disable-next-line import/no-extraneous-dependencies
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
/* eslint-disable import/extensions -- common.mjs is an ES module next to these scripts */
import { DATA, SRC } from './common.mjs';
/* eslint-enable import/extensions */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 }, userAgent: UA });
  await pg.goto(`${SRC}/`, { waitUntil: 'networkidle', timeout: 60000 });
  const tree = await pg.evaluate(() => {
    const clean = (el) => {
      const c = el.cloneNode(true);
      c.querySelectorAll('.material-icons, .material-icons-outlined, [class*="tooltip"], [class*="Tooltip"], i').forEach((x) => x.remove());
      return c.textContent.replace(/\s+/g, ' ').trim();
    };
    return [...document.querySelectorAll('nav.mainNav ul.firstLevel > li')].map((li) => {
      const top = li.querySelector(':scope > a, :scope > div > a, a');
      return {
        text: clean(top),
        href: top.getAttribute('href'),
        cats: [...li.querySelectorAll('li.secondLevelNavMenuItem')].map((c) => {
          const a = [...c.querySelectorAll(':scope a')].find((x) => clean(x) && !x.closest('li.thirdLevelNavMenuItem'));
          return {
            text: a ? clean(a) : clean(c).slice(0, 60),
            href: a?.getAttribute('href'),
            target: a?.target || '',
            region: c.getAttribute('region'),
            availity: c.hasAttribute('availity'),
            items: [...c.querySelectorAll('li.thirdLevelNavMenuItem')].map((t) => {
              const ta = [...t.querySelectorAll('a')].find((x) => clean(x));
              return {
                text: ta ? clean(ta) : clean(t), href: ta?.getAttribute('href') || null, target: ta?.target || '', region: t.getAttribute('region'), availity: t.hasAttribute('availity'),
              };
            }).filter((t) => t.text),
          };
        }),
      };
    });
  });
  fs.writeFileSync(path.join(DATA, 'menu-tree.json'), JSON.stringify(tree, null, 1));
  const line = (item) => `${item.availity ? '[A] ' : ''}${item.text} -> ${item.href}${item.target ? ` ${item.target}` : ''}`;
  tree.forEach((t) => {
    console.log(`${t.text} -> ${t.href}`);
    t.cats.forEach((c) => {
      console.log(`  ${line(c)}`);
      c.items.forEach((i) => console.log(`      ${line(i)}`));
    });
  });
  await b.close();
})();
