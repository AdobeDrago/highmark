/* eslint-env node */
/* eslint-disable no-console */
/**
 * Sets the status of provider pages in MIGRATION-CHECKLIST.md and recomputes the provider
 * part's tallies (the "### P1: ... (a/b)" headings and the tier table).
 *
 * Usage: node mark.mjs <"To do"|"Preview only"|Live> <batch file>...
 *   A batch file (batches/batch4.txt) lists source paths, one per line or comma-separated.
 *   Live also ticks the line's box.
 */
import fs from 'node:fs';
import path from 'node:path';
/* eslint-disable import/extensions -- common.mjs is an ES module next to these scripts */
import { REPO, readList } from './common.mjs';
/* eslint-enable import/extensions */

const [status, ...files] = process.argv.slice(2);
if (!['To do', 'Preview only', 'Live'].includes(status) || !files.length) {
  console.log('usage: node mark.mjs <"To do"|"Preview only"|Live> <batch file>...');
  process.exit(1);
}
const CHECKLIST = path.join(REPO, 'MIGRATION-CHECKLIST.md');
const lines = fs.readFileSync(CHECKLIST, 'utf8').split('\n');

let marked = 0;
files.flatMap(readList).forEach((p) => {
  const prefix = `- [ ] \`/providers${p}\` `;
  const i = lines.findIndex((l) => l.startsWith(prefix) || l.startsWith(prefix.replace('[ ]', '[x]')));
  if (i < 0) {
    console.log('not found', p);
    return;
  }
  lines[i] = lines[i].replace(/\*\*(To do|Preview only|Live)\*\*/, `**${status}**`);
  lines[i] = lines[i].replace(/^- \[[ x]\] /, status === 'Live' ? '- [x] ' : '- [ ] ');
  marked += 1;
});

// tallies: count each tier's page lines under its "### ... (a/b)" heading
const start = lines.findIndex((l) => l.startsWith('## Provider pages'));
const tiers = {};
let tier = null;
lines.slice(start).forEach((line, k) => {
  const heading = line.match(/^### (Done|P\d)\b.*\(\d+\/\d+\)$/);
  if (heading) {
    [, tier] = heading;
    tiers[tier] = { line: start + k, done: 0, all: 0 };
  } else if (line.startsWith('### ')) {
    tier = null;
  } else if (tier && /^- \[[ x]\] `\/providers/.test(line)) {
    tiers[tier].all += 1;
    if (line.startsWith('- [x]')) tiers[tier].done += 1;
  }
});
Object.entries(tiers).forEach(([t, { line, done, all }]) => {
  lines[line] = lines[line].replace(/\(\d+\/\d+\)$/, `(${done}/${all})`);
  const row = lines.findIndex((l, i) => i > start && l.startsWith(`| ${t} |`));
  if (row > 0) lines[row] = lines[row].replace(/\| \d+\/\d+ \|$/, `| ${done}/${all} |`);
});
fs.writeFileSync(CHECKLIST, lines.join('\n'));
console.log(`${marked} lines set to ${status}`);
