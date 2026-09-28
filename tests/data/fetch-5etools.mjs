import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCK = JSON.parse(await fs.readFile(path.join(ROOT, 'tests/fixtures/5etools-version.json'), 'utf8'));
const OUT = path.join(ROOT, 'tests/.cache', LOCK.version);

const corePaths = [
  'data/books.json',
  'data/class/index.json',
  'data/races.json',
  'data/backgrounds.json',
  'data/feats.json',
  'data/languages.json',
  'data/optionalfeatures.json',
  'data/spells/index.json',
  'data/generated/gendata-spell-source-lookup.json',
  'data/conditionsdiseases.json',
  'data/variantrules.json',
  'data/actions.json',
  'data/items.json',
  'data/items-base.json',
  'data/spells/spells-xphb.json',
];

async function getJson(relativePath) {
  const file = path.join(OUT, relativePath);
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    const url = `${LOCK.rawRoot}/${relativePath}`;
    const response = await fetch(url, {headers:{'User-Agent':'dnd-2024-character-sheet-tests'}});
    if (!response.ok) throw new Error(`Failed to fetch ${relativePath}: ${response.status} ${response.statusText}`);
    const json = await response.json();
    await fs.mkdir(path.dirname(file), {recursive:true});
    await fs.writeFile(file, JSON.stringify(json));
    return json;
  }
}

await fs.mkdir(OUT, {recursive:true});
for (const relativePath of corePaths) await getJson(relativePath);
const classIndex = await getJson('data/class/index.json');
for (const file of Object.values(classIndex)) await getJson(`data/class/${file}`);
console.log(`5etools ${LOCK.version} test corpus ready at ${OUT}`);
