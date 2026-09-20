import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/5etools-version.json'), 'utf8'));
const coverage = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/rule-coverage.json'), 'utf8'));
const out = path.join(ROOT, 'test-reports', 'rules-coverage.md');
const counts = coverage.domains.reduce((m, x) => (m[x.status] = (m[x.status] || 0) + 1, m), {});
const lines = [
  `# 2024 Character-Sheet Rules Coverage`,
  ``,
  `Test data: 5etools ${lock.version}`,
  ``,
  `| Status | Count |`,
  `|---|---:|`,
  ...Object.entries(counts).sort().map(([k,v]) => `| ${k} | ${v} |`),
  ``,
  `| Domain | Status | Notes |`,
  `|---|---|---|`,
  ...coverage.domains.map(x => `| ${x.id} | ${x.status} | ${x.notes.replace(/\|/g, '\\|')} |`),
  ``,
  `## CI policy`,
  ``,
  `Covered tests are hard gates. Partial/gap domains are explicit work remaining, not silently treated as covered. New unclassified interactions discovered by the corpus audit should be added to this registry before they can be considered supported.`,
];
fs.mkdirSync(path.dirname(out), {recursive:true});
fs.writeFileSync(out, lines.join('\n'));
console.log(lines.join('\n'));
