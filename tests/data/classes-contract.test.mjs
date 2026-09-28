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

const index = read('class/index.json');
const keys = ['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
const records = keys.map(key => {
  const file = index[key];
  const data = read('class/' + file);
  return {
    key,
    file,
    data,
    cls:(data.class || []).find(x => x.source === 'XPHB'),
    subclasses:(data.subclass || []).filter(x => x.classSource === 'XPHB' && x.source === 'XPHB'),
    classFeatures:(data.classFeature || []).filter(x => x.classSource === 'XPHB'),
    subclassFeatures:(data.subclassFeature || []).filter(x => x.classSource === 'XPHB' && x.source === 'XPHB'),
  };
});
const byName = name => records.find(x => x.cls.name === name);

test('all twelve PHB classes are present', () => {
  assert.equal(records.length,12);
  for (const rec of records) assert.ok(rec.cls,rec.key);
});

test('every PHB class has exactly two saving-throw proficiencies', () => {
  for (const rec of records) assert.equal((rec.cls.proficiency || []).length,2,rec.cls.name);
});

test('PHB class hit dice match the class chassis', () => {
  const expected = {
    Barbarian:12,
    Bard:8,
    Cleric:8,
    Druid:8,
    Fighter:10,
    Monk:8,
    Paladin:10,
    Ranger:10,
    Rogue:8,
    Sorcerer:6,
    Warlock:8,
    Wizard:6,
  };
  for (const rec of records) assert.equal(a.hitDieFaces(rec.cls),expected[rec.cls.name],rec.cls.name);
});

test('every PHB class skill-choice count matches its class rule', () => {
  const expected = {
    Barbarian:2,Bard:3,Cleric:2,Druid:2,Fighter:2,Monk:2,
    Paladin:2,Ranger:3,Rogue:4,Sorcerer:2,Warlock:2,Wizard:2,
  };
  for (const rec of records) assert.equal(a.skillChoiceSpec(rec.cls).count,expected[rec.cls.name],rec.cls.name);
});

test('every PHB class unlocks its subclass at level 3', () => {
  for (const rec of records) assert.equal(a.getSubclassUnlockLevel(rec.cls),3,rec.cls.name);
});

test('every PHB class has exactly four PHB subclasses', () => {
  for (const rec of records) assert.equal(rec.subclasses.length,4,rec.cls.name);
});

test('all PHB subclasses have subclass features in the pinned corpus', () => {
  for (const rec of records) {
    for (const sub of rec.subclasses) {
      assert.ok(rec.subclassFeatures.some(f => f.subclassShortName === sub.shortName || f.subclassShortName === sub.name || f.subclassSource === sub.source), rec.cls.name + ' / ' + sub.name);
    }
  }
});

test('every class table progression spans twenty levels', () => {
  for (const rec of records) {
    for (const group of rec.cls.classTableGroups || []) {
      const n = Array.isArray(group.rows) && group.rows.length ? group.rows.length : Array.isArray(group.rowsSpellProgression) ? group.rowsSpellProgression.length : 0;
      assert.equal(n,20,rec.cls.name + ': ' + JSON.stringify(group.colLabels || []));
    }
  }
});

test('Barbarian Rage and Weapon Mastery scale at known PHB levels', () => {
  const cls=byName('Barbarian').cls;
  assert.equal(a.classTableNumericValue(cls,'rages',1),2);
  assert.equal(a.classTableNumericValue(cls,'rages',3),3);
  assert.equal(a.weaponMasteryCount(cls,1),2);
  assert.equal(a.weaponMasteryCount(cls,4),3);
});

test('Fighter Second Wind and Weapon Mastery scale at level 4', () => {
  const cls=byName('Fighter').cls;
  assert.equal(a.classTableNumericValue(cls,'second wind',1),2);
  assert.equal(a.classTableNumericValue(cls,'second wind',4),3);
  assert.equal(a.weaponMasteryCount(cls,1),3);
  assert.equal(a.weaponMasteryCount(cls,4),4);
});

test('Monk Focus Points and Unarmored Movement scale from level 2', () => {
  const cls=byName('Monk').cls;
  assert.equal(a.classTableNumericValue(cls,'focus points',1),0);
  assert.equal(a.classTableNumericValue(cls,'focus points',2),2);
  assert.equal(a.classTableNumericValue(cls,'focus points',5),5);
  assert.equal(a.classTableNumericValue(cls,'unarmored movement',1),0);
  assert.equal(a.classTableNumericValue(cls,'unarmored movement',2),10);
});

test('Warlock Pact Magic and invocation progression use class-specific tables', () => {
  const cls=byName('Warlock').cls;
  assert.deepEqual([...a.classSpellSlots(cls,1)],[1,0,0,0,0,0,0,0,0]);
  assert.deepEqual([...a.classSpellSlots(cls,3)],[0,2,0,0,0,0,0,0,0]);
  assert.equal(a.optionalFeatureProgression(cls,1).length,1);
  assert.equal(a.optionalFeatureProgression(cls,2).length,3);
  assert.equal(a.optionalFeatureProgression(cls,5).length,5);
});

test('Sorcerer Metamagic progression grants 2, 4, and 6 choices at its scaling levels', () => {
  const cls=byName('Sorcerer').cls;
  assert.equal(a.optionalFeatureProgression(cls,2).length,2);
  assert.equal(a.optionalFeatureProgression(cls,10).length,4);
  assert.equal(a.optionalFeatureProgression(cls,17).length,6);
});

test('full casters expose PHB spell-slot progressions and martial classes do not', () => {
  for (const name of ['Bard','Cleric','Druid','Sorcerer','Wizard']) {
    assert.ok(a.classSpellSlots(byName(name).cls,1).length > 0,name);
  }
  for (const name of ['Barbarian','Fighter','Monk','Rogue']) {
    assert.equal(a.classSpellSlots(byName(name).cls,1).length,0,name);
  }
});

test('2024 Paladin and Ranger have spell slots from level 1', () => {
  for (const name of ['Paladin','Ranger']) {
    const cls=byName(name).cls;
    assert.equal(a.classSpellSlots(cls,1).reduce((a,b)=>a+b,0),2,name);
    assert.ok(a.classSpellSlots(cls,2).reduce((a,b)=>a+b,0)>=2,name);
  }
});

test('all class feature references resolve to feature objects through level 20', () => {
  for (const rec of records) {
    const names = new Set(rec.classFeatures.map(f => f.name + '|' + f.level));
    for (const ref of rec.cls.classFeatures || []) {
      const raw = typeof ref === 'string' ? ref : ref.classFeature || ref.name || '';
      const parts = String(raw).split('|');
      const name = parts[0];
      const level = Number(parts[2] || parts[1] || 0);
      if (!name || !level) continue;
      assert.ok([...names].some(x => x.startsWith(name + '|') && x.endsWith('|' + level)), rec.cls.name + ': ' + raw);
    }
  }
});
