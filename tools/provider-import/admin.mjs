/* eslint-env node */
/* eslint-disable no-console */
/**
 * Admin API calls for site pages, one path at a time in the order given.
 *
 * Usage: node admin.mjs <preview|live|index|status> <path|batch file>...
 *   A path is a site path (/providers/claims, /redirects.json); a batch file
 *   (batches/batch4.txt) lists source paths, which become /providers paths.
 *   status prints each path's preview and live time, and flags a preview older than DA.
 * Needs a DA token (see common.mjs); it is never printed.
 */
/* eslint-disable import/extensions -- common.mjs is an ES module next to these scripts */
import {
  ORG, SITE, readList, readToken,
} from './common.mjs';
/* eslint-enable import/extensions */

const [route, ...args] = process.argv.slice(2);
if (!['preview', 'live', 'index', 'status'].includes(route) || !args.length) {
  console.log('usage: node admin.mjs <preview|live|index|status> <path|batch file>...');
  process.exit(1);
}
const sitePath = (p) => (p === '/' ? '/providers/' : `/providers${p}`);
const paths = args.flatMap((a) => (a.startsWith('/') ? [a] : readList(a).map(sitePath)));
const auth = { Authorization: `Bearer ${readToken()}` };
const url = (p) => `https://admin.hlx.page/${route}/${ORG}/${SITE}/main${p}`;
const time = (s) => (s ? new Date(s).toISOString().slice(0, 16) : '-');

await paths.reduce((done, p) => done.then(async () => {
  if (route === 'status') {
    const s = await (await fetch(url(p), { headers: auth })).json().catch(() => ({}));
    const { edit = {}, preview = {}, live = {} } = s;
    const stale = edit.lastModified && preview.lastModified
      && new Date(edit.lastModified) > new Date(preview.lastModified) ? '  PREVIEW OLDER THAN DA' : '';
    console.log(`${p}  preview ${preview.status} ${time(preview.lastModified)} | live ${live.status} ${time(live.lastModified)}${stale}`);
    return;
  }
  const res = await fetch(url(p), { method: 'POST', headers: auth });
  console.log(`${route} ${res.status}${res.ok ? '' : ` ${res.headers.get('x-error') || ''}`}  ${p}`);
}), Promise.resolve());
