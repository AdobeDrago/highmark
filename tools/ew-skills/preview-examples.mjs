/* eslint-env node */
/* eslint-disable no-console */
/**
 * Copies the example DA documents (tools/ew-skills/examples/<path>.html) to
 * drafts/ew-examples/<path>.plain.html (gitignored), so a local aem up can render them:
 *
 *   node tools/ew-skills/preview-examples.mjs
 *   npx @adobe/aem-cli@16 up --port 3100 --no-open --html-folder drafts/ew-examples
 *   -> http://localhost:3100/drafts/ew-examples/plans/medicaid/ph95
 *
 * The CLI renders a .plain.html file (the sections, without <body> and <main>) but does
 * less than the pipeline, so this script adds what the pages need from it: heading ids
 * (the Quick Links anchors) and lowercase metadata keys (the CLI keeps `Template` as
 * written, and the page then has no template).
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'tools/ew-skills/examples';
const OUT = 'drafts/ew-examples';

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

// the pipeline's heading ids: lowercase, runs of anything but a-z / 0-9 as one '-'
const slug = (html) => html.replace(/<[^>]+>/g, '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

walk(SRC).filter((f) => f.endsWith('.html')).forEach((file) => {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/[\s\S]*<main>/, '').replace(/<\/main>[\s\S]*/, '');
  html = html.replace(/<(h[1-6])>([\s\S]*?)<\/\1>/g, (m, tag, inner) => `<${tag} id="${slug(inner)}">${inner}</${tag}>`);
  html = html.replace(
    /<div class="metadata">[\s\S]*$/,
    (block) => block.replace(/<div>\s*<div>([^<]+)<\/div>/g, (row, key) => row.replace(key, key.toLowerCase())),
  );
  const dest = path.join(OUT, path.relative(SRC, file).replace(/\.html$/, '.plain.html'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  console.log(dest);
});
