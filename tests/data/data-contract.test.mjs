import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCK = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/5etools-version.json'), 'utf8'));
const DATA = path.join(ROOT, 'tests/.cache', LOCK.version, 'data');
const read = p => JSON.parse(fs.readFileSync(path.join(DATA, p), 'utf8'));
const a = loadAppTestContext();
resetState(a);

a.state.data.officialSources = new Set(['XPHB','XDMG','XMM']);

test('the pinned 5etools corpus contains all twelve 2024 classes', () => {
  const index = read('class/index.json');
  const expected = ['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
  for (const name of expected) assert.ok(index[name], `missing 2024 class index entry: ${name}`);
  assert.equal(expected.length, 12);
});

test('every 2024 class file resolves exactly one XPHB class entry', () => {
  const index = read('class/index.json');
  const expected = ['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
  for (const name of expected) {
    const file = index[name];
    const data = read(`class/${file}`);
    const matches = (data.class || []).filter(x => x.source === 'XPHB');
    assert.equal(matches.length, 1, `${name}: ${file}`);
    assert.ok(matches[0].name);
  }
});

test('all XPHB feats with structured ability choices are representable by the feat parser', () => {
  const feats = read('feats.json').feat.filter(x => x.source === 'XPHB');
  for (const feat of feats) {
    if (!feat.ability) continue;
    assert.ok(a.featAbilitySpecs(feat).length > 0, `No ability spec for feat ${feat.name}`);
  }
});

test('all XPHB feats with structured save/skill/mixed/expertise/spell choices are representable', () => {
  const feats = read('feats.json').feat.filter(x => x.source === 'XPHB');
  for (const feat of feats) {
    if (feat.savingThrowProficiencies) assert.ok(a.featSaveSpecs(feat).length > 0, `No save spec for ${feat.name}`);
    if (feat.skillProficiencies) assert.ok(a.featSkillSpecs(feat).length > 0, `No skill spec for ${feat.name}`);
    if (feat.skillToolLanguageProficiencies) assert.ok(a.featMixedChoiceSpecs(feat).length > 0, `No mixed choice spec for ${feat.name}`);
    if (feat.expertise) {
      const specs = a.featExpertiseSpecs(feat);
      const universal = feat.expertise.some(entry => entry?.choose?.from?.some(token => /^anyProficientSkill$/i.test(String(token))));
      assert.ok(specs.length > 0 || universal, `No expertise spec for ${feat.name}`);
    }
    if (feat.additionalSpells) assert.ok(a.featAdditionalSpellChoiceSpecs(feat).length > 0, `No additional-spell spec for ${feat.name}`);
  }
});

test('XPHB spell corpus is non-empty and every spell has required sheet fields', () => {
  const spells = read('spells/spells-xphb.json').spell.filter(x => x.source === 'XPHB');
  assert.ok(spells.length > 100);
  for (const spell of spells) {
    for (const key of ['name','level','school','source']) assert.ok(spell[key] !== undefined, `${spell.name || '(unnamed)'} missing ${key}`);
    assert.ok(Array.isArray(spell.time) && spell.time.length > 0, `${spell.name} missing casting time`);
    assert.ok(spell.range, `${spell.name} missing range`);
    assert.ok(Array.isArray(spell.duration) && spell.duration.length > 0, `${spell.name} missing duration`);
  }
});

test('the 2024 item catalogue combines base and expanded items', () => {
  const items = read('items.json');
  const base = read('items-base.json');
  const merged = a.mergeItemCatalogs(items, base);
  const index = a.buildItemIndex(merged, new Set(['XPHB','XDMG','XMM']));
  for (const name of ['Dagger','Quarterstaff','Mace','Shield','Leather Armor']) {
    assert.ok(index.has(`${name.toLowerCase()}|xphb`), `${name} is absent from merged item index`);
  }
});
