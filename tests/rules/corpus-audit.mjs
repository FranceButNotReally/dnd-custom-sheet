import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/5etools-version.json'), 'utf8'));
const dataRoot = path.join(ROOT, 'tests/.cache', lock.version, 'data');
if (!fs.existsSync(dataRoot)) {
  console.log(`Corpus audit skipped locally: ${dataRoot} is not present. Run npm run test:data first.`);
  process.exit(0);
}
const read = p => JSON.parse(fs.readFileSync(path.join(dataRoot, p), 'utf8'));

const interactionFields = [
  'ability', 'savingThrowProficiencies', 'skillProficiencies', 'skillToolLanguageProficiencies',
  'expertise', 'additionalSpells', 'resist', 'speed', 'senses', 'darkvision', 'immune', 'vulnerable',
  'proficiency', 'startingProficiencies', 'armorProficiencies', 'weaponProficiencies', 'entries',
];
const textSignals = /\b(?:choose|select|advantage|disadvantage|resistance|immune|speed|initiative|armor class|hit point|saving throw|proficiency|expertise|darkvision|blindsight|tremorsense|truesight)\b/i;

function inspectEntity(entity, owner, interactionIds, examples) {
  const found = [];
  for (const key of interactionFields) if (entity?.[key] != null) found.push(key);
  const text = JSON.stringify(entity?.entries ?? entity ?? '');
  const textual = textSignals.test(text);
  if (textual) found.push('textual-rule-signal');
  if (found.length) {
    interactionIds.push(...found.map(key => `${owner}:${key}`));
    if (examples.length < 200 && textual) examples.push({owner, name:entity?.name || '(unnamed)', signals:found});
  }
}

const feats = (read('feats.json').feat || []).filter(x => x.source === 'XPHB');
const races = (read('races.json').race || []).filter(x => x.source === 'XPHB');
const backgrounds = (read('backgrounds.json').background || []).filter(x => x.source === 'XPHB');
const classes = [];
const classIndex = read('class/index.json');
for (const [source, file] of Object.entries(classIndex)) if (source === 'XPHB') classes.push((read(`class/${file}`).class || []).find(x => x.source === 'XPHB'));
const optionalfeatures = (read('optionalfeatures.json').optionalfeature || []).filter(x => x.source === 'XPHB');

const interactionIds = [];
const examples = [];
for (const x of feats) inspectEntity(x, `feat|${x.name}|${x.source}`, interactionIds, examples);
for (const x of races) inspectEntity(x, `species|${x.name}|${x.source}`, interactionIds, examples);
for (const x of backgrounds) inspectEntity(x, `background|${x.name}|${x.source}`, interactionIds, examples);
for (const x of classes.filter(Boolean)) inspectEntity(x, `class|${x.name}|${x.source}`, interactionIds, examples);
for (const x of optionalfeatures) inspectEntity(x, `optionalfeature|${x.name}|${x.source}`, interactionIds, examples);

const report = {
  source: lock,
  counts: { feats:feats.length, species:races.length, backgrounds:backgrounds.length, classes:classes.filter(Boolean).length, optionalfeatures:optionalfeatures.length, interactionSignals:interactionIds.length },
  uniqueSignals: [...new Set(interactionIds)].length,
  examples,
  generatedAt: new Date().toISOString(),
};
const out = path.join(ROOT, 'test-reports', 'corpus-audit.json');
fs.mkdirSync(path.dirname(out), {recursive:true});
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`Corpus audit: ${report.counts.interactionSignals} interaction signals across ${report.counts.feats + report.counts.species + report.counts.backgrounds + report.counts.classes + report.counts.optionalfeatures} XPHB entities.`);
console.log(`Report: ${out}`);
