/* eslint-env node */
/**
 * Shared paths, site constants and helpers for the provider import tools.
 *
 * data/  inputs kept in git: classified.json (every source page's template and checklist
 *        tier), menu-tree.json (the source's mega menu), sidenav.json (the source's side-nav
 *        trees), gated.txt (pages behind the Availity login)
 * work/  per-run files, gitignored: src/ (extracted pages), out/ (built DA documents),
 *        img/ (downloaded images), survey.json
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DATA = path.join(HERE, 'data');
export const WORK = path.join(HERE, 'work');
export const REPO = path.join(HERE, '..', '..');

export const ORG = 'adobedrago';
export const SITE = 'highmark';
export const SRC = 'https://providers.highmark.com';
export const LIVE = `https://main--${SITE}--${ORG}.aem.live`;
export const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' };

export const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/** A list file's entries: one per line or comma-separated. */
export const readList = (file) => fs.readFileSync(file, 'utf8').split(/[\r\n,]+/).map((s) => s.trim()).filter(Boolean);

/** Source paths from the arguments: paths, or batch files (batches/batch4.txt) holding them. */
export const pathsFrom = (args) => args.flatMap((a) => (a.startsWith('/') ? [a] : readList(a)));

/** The DA/admin token (da-auth-helper's cache, or aem content's); never printed. */
export function readToken() {
  const files = [path.join(os.homedir(), '.aem', 'da-token.json'), path.join(REPO, '.hlx', '.da-token.json')];
  const file = files.find((f) => fs.existsSync(f));
  if (!file) throw new Error('No DA token found; run `npx github:adobe-rnd/da-auth-helper token` first.');
  const { access_token: token, expires_at: expires } = readJSON(file);
  if (expires && expires < Date.now() + 60000) throw new Error(`DA token in ${file} has expired.`);
  return token;
}

/** fn over items, size at a time, results in item order. */
export async function pool(items, size, fn) {
  const out = [];
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      // eslint-disable-next-line no-await-in-loop
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}
