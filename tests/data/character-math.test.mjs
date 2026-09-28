import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCK = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/5etools-version.json'), 'utf8'));
const DATA = path.join(ROOT, 'tests/.cache', LOCK.version, 'data');
const read = value => JSON.parse(fs.readFileSync(path.join(DATA, value), 'utf8'));
const a = loadAppTestContext();
resetState(a);

const classIndex = read('class/index.json');
const classKeys = ['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
const records = Object.fromEntries(classKeys.map(key => {
  const file = read(`class/${classIndex[key]}`);
  return [key, {
    file,
    cls:(file.class || []).find(value => value.source === 'XPHB'),
    subclasses:(file.subclass || []).filter(value => value.classSource === 'XPHB' && value.source === 'XPHB'),
  }];
}));
const feats = (read('feats.json').feat || []).filter(value => value.source === 'XPHB');
const species = (read('races.json').race || []).filter(value => value.source === 'XPHB');
const optional = (read('optionalfeatures.json').optionalfeature || []).filter(value => value.source === 'XPHB');
const items = a.mergeItemCatalogs(read('items.json'), read('items-base.json'));

const feat = name => feats.find(value => value.name === name);
const race = name => species.find(value => value.name === name);
const optionalFeature = name => optional.find(value => value.name === name);
const subclass = (key, name) => records[key].subclasses.find(value => value.name === name || value.shortName === name);
const subclassFeatures = (key, name, level = 20) => a.getSubclassFeatures(records[key].file, subclass(key, name), level);
const subclassFeature = (key, subclassName, featureName, level = 20) => {
  const found = subclassFeatures(key, subclassName, level).find(value => value.name === featureName);
  assert.ok(found, `${key} / ${subclassName} / ${featureName}`);
  return found;
};

function derived(overrides = {}) {
  const level = Number(overrides.level || 1);
  return {
    level,
    classObj:null,
    classFeatures:[],
    classFeatureOptionObjects:[],
    classFeatureChoiceSpecs:[],
    classProficiencyChoiceSpecs:[],
    subclassFeatures:[],
    optionalFeatureObjects:[],
    speciesObj:null,
    skillProficiencies:new Set(),
    preFeatureSavingThrowProficiencies:new Set(),
    pb:a.proficiencyBonus(level),
    mods:{str:0,dex:0,con:0,int:0,wis:0,cha:0},
    stats:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
    ...overrides,
  };
}

test('maximum-HP bonuses from every persistent PHB source compose exactly once', () => {
  const level = 10;
  const character = a.emptyCharacter();
  character.level = level;
  const effects = a.buildDerivedEffects(character, derived({
    level,
    classObj:records.fighter.cls,
    speciesObj:race('Dwarf'),
    mods:{str:0,dex:0,con:2,int:0,wis:0,cha:0},
  }), [feat('Tough'), feat('Boon of Fortitude')]);
  const base = a.defaultMaxHp(records.fighter.cls, level, 2, null);
  assert.equal(base, 84);
  assert.equal(effects.hpPerLevel, 3);
  assert.equal(effects.hpFlat, 40);
  assert.equal(base + effects.hpPerLevel * level + effects.hpFlat, 154);
});

test('armor golden cases stack only printed PHB bonuses and reject the removed Dual Wielder AC bonus', () => {
  const character = a.emptyCharacter();
  character.level = 4;
  character.inventory = [
    {name:'Plate Armor', source:'XPHB', equipped:true},
    {name:'Shield', source:'XPHB', equipped:true},
  ];
  const defense = a.buildDerivedEffects(character, derived({
    level:4,
    classObj:records.fighter.cls,
  }), [feat('Defense')]);
  const trained = {armor:['Heavy Armor','Shields'], weapons:[], tools:[], languages:[]};
  assert.equal(a.calcAutoAc(character, {str:3,dex:4,con:0,int:0,wis:0,cha:0}, items, defense, trained, {str:16,dex:18}).value, 21);

  character.inventory = [
    {name:'Scimitar', source:'XPHB', equipped:true, wielding:true},
    {name:'Shortsword', source:'XPHB', equipped:true, wielding:true},
  ];
  const dualWielder = a.buildDerivedEffects(character, derived({level:4}), [feat('Dual Wielder')]);
  assert.equal(dualWielder.flags.has('dualWielder'), false);
  assert.equal(a.calcAutoAc(character, {str:1,dex:3,con:0,int:0,wis:0,cha:0}, items, dualWielder, trained, {str:12,dex:16}).value, 13);
});

test('every permanent equal-to-Speed climb and swim source reaches movement modes', () => {
  const character = a.emptyCharacter();
  assert.equal(a.buildDerivedEffects(character, derived(), [feat('Athlete')]).movementModes.climb, 'speed');
  assert.equal(a.buildDerivedEffects(character, derived({optionalFeatureObjects:[optionalFeature('Gift of the Depths')]}), []).movementModes.swim, 'speed');
  assert.equal(a.buildDerivedEffects(character, derived({subclassFeatures:[subclassFeature('druid', 'Circle of the Sea', 'Aquatic Affinity', 6)]}), []).movementModes.swim, 'speed');
  assert.equal(a.buildDerivedEffects(character, derived({subclassFeatures:[subclassFeature('rogue', 'Thief', 'Second-Story Work', 3)]}), []).movementModes.climb, 'speed');
});

test('Gloom Stalker Dread Ambusher adds Wisdom to Initiative and stacks with Alert', () => {
  const character = a.emptyCharacter();
  character.level = 5;
  const effects = a.buildDerivedEffects(character, derived({
    level:5,
    classObj:records.ranger.cls,
    subclassFeatures:[subclassFeature('ranger', 'Gloom Stalker', 'Dread Ambusher', 3)],
    mods:{str:0,dex:2,con:0,int:0,wis:3,cha:0},
  }), [feat('Alert')]);
  assert.equal(effects.initiativeBonus, 6);
  const lowWisdom = a.buildDerivedEffects(character, derived({
    level:5,
    classObj:records.ranger.cls,
    subclassFeatures:[subclassFeature('ranger', 'Gloom Stalker', 'Dread Ambusher', 3)],
    mods:{str:0,dex:2,con:0,int:0,wis:-1,cha:0},
  }), []);
  assert.equal(lowWisdom.initiativeBonus, 0);
});

test('object-form PHB senses resolve for feats and Eldritch Invocations', () => {
  const refs = a.collectSenseRefs([feat('Skulker'), feat('Boon of Truesight'), optionalFeature('Witch Sight')]);
  assert.ok(refs.some(value => value.name === 'Blindsight' && value.label === 'Blindsight 10 ft.'));
  assert.ok(refs.some(value => value.name === 'Truesight' && value.label === 'Truesight 60 ft.'));
  assert.ok(refs.some(value => value.name === 'Truesight' && value.label === 'Truesight 30 ft.'));
  assert.ok(!refs.some(value => value.label.includes('[object Object]')));
});

test('permanent subclass resistances cover Psi Warrior, Celestial, and Ancients', () => {
  const character = a.emptyCharacter();
  const cases = [
    ['fighter','Psi Warrior','Guarded Mind',10,['Psychic']],
    ['warlock','Celestial Patron','Radiant Soul',6,['Radiant']],
    ['paladin','Oath of the Ancients','Aura of Warding',7,['Necrotic','Psychic','Radiant']],
  ];
  for (const [key, sub, name, level, expected] of cases) {
    character.level = level;
    const effects = a.buildDerivedEffects(character, derived({level, classObj:records[key].cls, subclassFeatures:[subclassFeature(key, sub, name, level)]}), []);
    assert.deepEqual([...effects.resistances].sort(), [...expected].sort(), name);
  }
});

test('Paladin auras stop modifying the sheet while Incapacitated', () => {
  const character = a.emptyCharacter();
  character.level = 7;
  character.conditions = ['Incapacitated'];
  const warding = subclassFeature('paladin', 'Oath of the Ancients', 'Aura of Warding', 7);
  const effects = a.buildDerivedEffects(character, derived({
    level:7,
    classObj:records.paladin.cls,
    classFeatures:[{name:'Aura of Protection', source:'XPHB'}],
    subclassFeatures:[warding],
    mods:{str:0,dex:0,con:0,int:0,wis:0,cha:4},
  }), []);
  assert.equal(effects.savingThrowBonus, 0);
  assert.deepEqual([...effects.resistances], []);
  assert.ok(effects.active.some(value => value.includes('inactive while Incapacitated')));
});

test('Draconic Sorcery exposes and applies exactly one Elemental Affinity choice', () => {
  const sub = subclass('sorcerer', 'Draconic Sorcery');
  const features = subclassFeatures('sorcerer', 'Draconic Sorcery', 6);
  const specs = a.subclassFeatureChoiceSpecs(records.sorcerer.cls, sub, features);
  const affinity = specs.find(value => value.name === 'Elemental Affinity');
  assert.deepEqual(JSON.parse(JSON.stringify(affinity.options.map(value => value.name))), ['Acid','Cold','Fire','Lightning','Poison']);
  const character = a.emptyCharacter();
  character.level = 6;
  character.classFeatureChoices = {[affinity.key]:{name:'Lightning', source:'XPHB'}};
  const effects = a.buildDerivedEffects(character, derived({
    level:6,
    classObj:records.sorcerer.cls,
    classFeatureChoiceSpecs:specs,
    subclassFeatures:features,
  }), []);
  assert.deepEqual([...effects.resistances], ['Lightning']);
});

test('resistance text parser accepts grants but rejects choices and resistance-ignoring attacks', () => {
  const parsed = {savingThrowAdvantages:new Set(), active:[], resistances:[], speedMinimum:0, senses:[]};
  a.applyTextualRulesEffects('You have Resistance to Fire damage and Cold damage.', parsed, 'Grant');
  assert.deepEqual(parsed.resistances.sort(), ['Cold','Fire']);

  for (const name of ['Boon of Energy Resistance','Boon of Irresistible Offense','Elemental Adept','Poisoner']) {
    const effects = a.buildDerivedEffects(a.emptyCharacter(), derived({level:19}), [feat(name)]);
    assert.deepEqual([...effects.resistances], [], name);
  }
});
