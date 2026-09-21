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

const keys = ['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
const index = read('class/index.json');
const records = Object.fromEntries(keys.map(key => {
  const file = read(`class/${index[key]}`);
  const cls = (file.class || []).find(value => value.source === 'XPHB');
  const subclasses = (file.subclass || []).filter(value => value.classSource === 'XPHB' && value.source === 'XPHB');
  return [key, { file, cls, subclasses }];
}));
const optional = (read('optionalfeatures.json').optionalfeature || []).filter(value => value.source === 'XPHB');
a.state.data.optionalfeatures = { optionalfeature: optional };
a.state.data.feats = read('feats.json');
const spells = (read('spells/spells-xphb.json').spell || []).filter(value => value.source === 'XPHB');
a.state.data.spells = { spell: spells };
a.state.data.spellSourceLookup = read('generated/gendata-spell-source-lookup.json');

const subclass = (key, name) => records[key].subclasses.find(value => value.name === name || value.shortName === name);
const subclassFeatures = (key, name, level = 20) => a.getSubclassFeatures(records[key].file, subclass(key, name), level);

function derivedSubclassEffects(key, subclassName, level, names, mods = {}) {
  const rec = records[key];
  const selected = subclassFeatures(key, subclassName, level).filter(feature => names.includes(feature.name));
  assert.equal(selected.length, names.length, `${rec.cls.name} / ${subclassName}: ${names.join(', ')}`);
  const character = a.emptyCharacter();
  character.level = level;
  return a.buildDerivedEffects(character, {
    classObj: rec.cls,
    classFeatures: [],
    classFeatureOptionObjects: [],
    classProficiencyChoiceSpecs: [],
    subclassFeatures: selected,
    optionalFeatureObjects: [],
    speciesObj: null,
    skillProficiencies: new Set(),
    pb: a.proficiencyBonus(level),
    mods: { str:0, dex:0, con:0, int:0, wis:0, cha:0, ...mods },
    level,
  }, []);
}

test('the pinned PHB class corpus contains all 12 classes, 48 subclasses, and 592 raw feature records', () => {
  assert.equal(Object.keys(records).length, 12);
  assert.equal(Object.values(records).reduce((sum, rec) => sum + rec.subclasses.length, 0), 48);
  const rawClass = Object.values(records).reduce((sum, rec) => sum + (rec.file.classFeature || []).filter(feature => feature.source === 'XPHB' && feature.classSource === 'XPHB').length, 0);
  const rawSubclass = Object.values(records).reduce((sum, rec) => sum + (rec.file.subclassFeature || []).filter(feature => feature.source === 'XPHB' && feature.classSource === 'XPHB').length, 0);
  assert.equal(rawClass, 283);
  assert.equal(rawSubclass, 309);
  assert.equal(Object.values(records).reduce((sum, rec) => sum + a.getClassFeatures(rec.file, rec.cls, 20).length, 0), 260);
  assert.equal(Object.values(records).reduce((sum, rec) => sum + rec.subclasses.reduce((subSum, value) => subSum + a.getSubclassFeatures(rec.file, value, 20).length, 0), 0), 309);
});

test('every printed class feature resolves once and at its exact level boundary', () => {
  for (const rec of Object.values(records)) {
    const all = a.getClassFeatures(rec.file, rec.cls, 20);
    assert.equal(all.length, rec.cls.classFeatures.length, rec.cls.name);
    for (let level = 1; level <= 20; level++) {
      const available = a.getClassFeatures(rec.file, rec.cls, level);
      assert.ok(available.every(feature => Number(feature.level) <= level), `${rec.cls.name} level ${level}`);
      assert.equal(available.length, all.filter(feature => Number(feature.level) <= level).length, `${rec.cls.name} level ${level}`);
    }
  }
});

test('every PHB subclass exposes only its own features at each level boundary', () => {
  for (const rec of Object.values(records)) {
    for (const sub of rec.subclasses) {
      const all = a.getSubclassFeatures(rec.file, sub, 20);
      assert.ok(all.length > 0, `${rec.cls.name} / ${sub.name}`);
      assert.ok(all.every(feature => feature.subclassShortName === sub.shortName), `${rec.cls.name} / ${sub.name}`);
      for (let level = 1; level <= 20; level++) {
        const available = a.getSubclassFeatures(rec.file, sub, level);
        assert.ok(available.every(feature => Number(feature.level) <= level), `${rec.cls.name} / ${sub.name} level ${level}`);
        assert.equal(available.length, all.filter(feature => Number(feature.level) <= level).length, `${rec.cls.name} / ${sub.name} level ${level}`);
      }
    }
  }
});

test('Battle Master receives all maneuver slots from subclass progression', () => {
  const fighter = records.fighter.cls;
  const battleMaster = subclass('fighter', 'Battle Master');
  assert.equal(a.optionalFeatureProgression(fighter, 2, battleMaster).length, 0);
  for (const [level, count] of [[3,3],[7,5],[10,7],[15,9],[20,9]]) {
    const specs = a.optionalFeatureProgression(fighter, level, battleMaster);
    assert.equal(specs.length, count, `level ${level}`);
    assert.ok(specs.every(spec => spec.owner === 'subclass' && spec.category.includes('MV:B')));
    assert.equal(new Set(specs.map(spec => spec.key)).size, count);
  }
  const maneuvers = optional.filter(feature => feature.featureType?.includes('MV:B'));
  assert.equal(maneuvers.length, 20);
});

test('Champion receives its subclass Fighting Style feat slot at level 7', () => {
  const fighter = records.fighter.cls;
  const champion = subclass('fighter', 'Champion');
  assert.equal(a.progressionFeatSlots(fighter, 6, champion).filter(slot => slot.owner === 'subclass').length, 0);
  const slots = a.progressionFeatSlots(fighter, 7, champion).filter(slot => slot.owner === 'subclass');
  assert.equal(slots.length, 1);
  assert.equal(slots[0].name, 'Fighting Style');
  assert.deepEqual(JSON.parse(JSON.stringify(slots[0].category)), ['FS']);
});

test('the optional-feature corpus has every PHB invocation, Metamagic option, and maneuver', () => {
  const count = type => optional.filter(feature => feature.featureType?.includes(type)).length;
  assert.equal(optional.length, 58);
  assert.equal(count('EI'), 28);
  assert.equal(count('MM'), 10);
  assert.equal(count('MV:B'), 20);
});

test('invocation level and dependency prerequisites are enforced', () => {
  const byName = name => optional.find(feature => feature.name === name);
  assert.equal(a.optionalFeaturePrerequisiteMet(byName('Ascendant Step'), 4), false);
  assert.equal(a.optionalFeaturePrerequisiteMet(byName('Ascendant Step'), 5), true);
  assert.equal(a.optionalFeaturePrerequisiteMet(byName('Thirsting Blade'), 5, new Set()), false);
  assert.equal(a.optionalFeaturePrerequisiteMet(byName('Thirsting Blade'), 5, new Set(['pactoftheblade'])), true);
  assert.equal(a.optionalFeaturePrerequisiteMet(byName('Devouring Blade'), 11, new Set(['thirstingblade'])), false);
  assert.equal(a.optionalFeaturePrerequisiteMet(byName('Devouring Blade'), 12, new Set(['thirstingblade'])), true);
});

test('optional-feature reconciliation removes wrong-category, premature, and duplicate selections', () => {
  const specs = a.optionalFeatureProgression(records.warlock.cls, 5);
  const character = a.emptyCharacter();
  character.optionalFeatureChoices = {
    [specs[0].key]: { name:'Armor of Shadows', source:'XPHB' },
    [specs[1].key]: { name:'Armor of Shadows', source:'XPHB' },
    [specs[2].key]: { name:'Ascendant Step', source:'XPHB' },
    [specs[3].key]: { name:'Careful Spell', source:'XPHB' },
  };
  a.reconcileOptionalFeatureChoices(character, specs, 4);
  assert.deepEqual(Object.values(character.optionalFeatureChoices).map(ref => ref.name), ['Armor of Shadows']);
});

test('repeatable invocations survive duplicate reconciliation', () => {
  const specs = a.optionalFeatureProgression(records.warlock.cls, 2);
  const character = a.emptyCharacter();
  character.optionalFeatureChoices = {
    [specs[0].key]: { name:'Agonizing Blast', source:'XPHB' },
    [specs[1].key]: { name:'Agonizing Blast', source:'XPHB' },
  };
  a.reconcileOptionalFeatureChoices(character, specs, 2);
  assert.equal(Object.keys(character.optionalFeatureChoices).length, 2);
});

test('conditional class features do not become permanent sheet resistances', () => {
  const rage = a.getClassFeatures(records.barbarian.file, records.barbarian.cls, 1).find(feature => feature.name === 'Rage');
  const character = a.emptyCharacter();
  const effects = a.buildDerivedEffects(character, {
    classObj: records.barbarian.cls,
    classFeatures: [rage],
    classFeatureOptionObjects: [],
    classProficiencyChoiceSpecs: [],
    subclassFeatures: [],
    optionalFeatureObjects: [],
    speciesObj: null,
    skillProficiencies: new Set(),
    pb: 2,
    mods: { str:0, dex:0, con:0, int:0, wis:0, cha:0 },
    level: 1,
  }, []);
  assert.deepEqual(JSON.parse(JSON.stringify(effects.resistances)), []);
});

test('conditional Metamagic text does not masquerade as permanent Concentration Advantage', () => {
  const character = a.emptyCharacter();
  const base = {
    classObj: records.sorcerer.cls,
    classFeatures: [],
    classFeatureOptionObjects: [],
    classProficiencyChoiceSpecs: [],
    subclassFeatures: [],
    speciesObj: null,
    skillProficiencies: new Set(),
    pb: 2,
    mods: { str:0, dex:0, con:0, int:0, wis:0, cha:0 },
    level: 3,
  };
  const extended = optional.find(feature => feature.name === 'Extended Spell');
  const eldritchMind = optional.find(feature => feature.name === 'Eldritch Mind');
  assert.equal(a.buildDerivedEffects(character, { ...base, optionalFeatureObjects:[extended] }, []).concentrationSaveAdvantage, false);
  assert.equal(a.buildDerivedEffects(character, { ...base, optionalFeatureObjects:[eldritchMind] }, []).concentrationSaveAdvantage, true);
});

test('subclass static sheet effects are applied without activating conditional combat effects', () => {
  const dance = derivedSubclassEffects('bard', 'College of Dance', 3, ['Unarmored Defense']);
  assert.ok(dance.acFormulas.some(formula => formula.abilities.join(',') === 'dex,cha'));

  const valor = derivedSubclassEffects('bard', 'College of Valor', 3, ['Martial Training']);
  assert.ok(valor.weaponProficiencies.includes('Martial Weapons'));
  assert.ok(valor.armorProficiencies.includes('Medium Armor'));
  assert.ok(valor.armorProficiencies.includes('Shields'));

  const draconic = derivedSubclassEffects('sorcerer', 'Draconic Sorcery', 3, ['Draconic Resilience']);
  assert.equal(draconic.hpPerLevel, 1);
  assert.ok(draconic.acFormulas.some(formula => formula.abilities.join(',') === 'dex,cha'));

  const champion = derivedSubclassEffects('fighter', 'Champion', 3, ['Remarkable Athlete']);
  assert.equal(champion.initiativeAdvantage, true);

  const assassin = derivedSubclassEffects('rogue', 'Assassin', 3, ['Assassinate', "Assassin's Tools"]);
  assert.equal(assassin.initiativeAdvantage, true);
  assert.ok(assassin.tools.includes('Disguise Kit'));
  assert.ok(assassin.tools.includes("Poisoner's Kit"));

  const mercy = derivedSubclassEffects('monk', 'Warrior of Mercy', 3, ['Implements of Mercy']);
  assert.ok(mercy.skills.has('insight'));
  assert.ok(mercy.skills.has('medicine'));
  assert.ok(mercy.tools.includes('Herbalism Kit'));
});

test('subclass senses, saves, speed, skill bonuses, and permanent resistances reach derived state', () => {
  const gloom = derivedSubclassEffects('ranger', 'Gloom Stalker', 7, ['Umbral Sight', 'Iron Mind']);
  assert.equal(gloom.darkvisionBonus, 60);
  assert.ok(gloom.savingThrows.has('wis'));

  const shadow = derivedSubclassEffects('monk', 'Warrior of Shadow', 3, ['Darkvision']);
  assert.ok(shadow.senses.includes('Darkvision 60 ft.'));

  const ranger = derivedSubclassEffects('ranger', 'Fey Wanderer', 3, ['Otherworldly Glamour'], { wis:3 });
  assert.equal(ranger.skillBonuses.deception, 3);
  assert.equal(ranger.skillBonuses.performance, 3);
  assert.equal(ranger.skillBonuses.persuasion, 3);

  const glory = derivedSubclassEffects('paladin', 'Oath of Glory', 7, ['Aura of Alacrity']);
  assert.equal(glory.speedBonus, 10);

  const aberrant = derivedSubclassEffects('sorcerer', 'Aberrant Sorcery', 6, ['Psychic Defenses']);
  assert.ok(aberrant.resistances.includes('Psychic'));

  const greatOldOne = derivedSubclassEffects('warlock', 'Great Old One Patron', 10, ['Thought Shield']);
  assert.ok(greatOldOne.resistances.includes('Psychic'));

  const war = derivedSubclassEffects('cleric', 'War Domain', 17, ['Avatar of Battle']);
  assert.deepEqual(JSON.parse(JSON.stringify(war.resistances.sort())), ['Bludgeoning','Piercing','Slashing']);
});

test('subclass proficiency choices cover Lore, Battle Master, and Fey Wanderer', () => {
  const cases = [
    ['bard', 'College of Lore', 3, 'skill', 3],
    ['fighter', 'Battle Master', 3, 'tool', 1],
    ['ranger', 'Fey Wanderer', 3, 'skill', 1],
  ];
  for (const [key, subName, level, kind, count] of cases) {
    const rec = records[key];
    const features = [...a.getClassFeatures(rec.file, rec.cls, level), ...subclassFeatures(key, subName, level)];
    const specs = a.classFeatureProficiencyChoiceSpecs(rec.cls, features).filter(spec => spec.kind === kind && spec.featureName !== 'Expertise');
    assert.equal(specs.length, count, `${rec.cls.name} / ${subName}`);
  }
});

test('selected subclass skill and tool choices flow into derived effects', () => {
  const loreFeatures = subclassFeatures('bard', 'College of Lore', 3);
  const loreSpecs = a.classFeatureProficiencyChoiceSpecs(records.bard.cls, loreFeatures);
  const character = a.emptyCharacter();
  character.classProficiencyChoices = Object.fromEntries(loreSpecs.map((spec, index) => [spec.key, ['arcana','medicine','stealth'][index]]));
  const base = {
    classObj: records.bard.cls,
    classFeatures: [],
    classFeatureOptionObjects: [],
    classProficiencyChoiceSpecs: loreSpecs,
    subclassFeatures: loreFeatures,
    optionalFeatureObjects: [],
    speciesObj: null,
    skillProficiencies: new Set(),
    pb: 2,
    mods: { str:0, dex:0, con:0, int:0, wis:0, cha:0 },
    level: 3,
  };
  const loreEffects = a.buildDerivedEffects(character, base, []);
  assert.deepEqual([...loreEffects.skills].sort(), ['arcana','medicine','stealth']);

  const battleFeatures = subclassFeatures('fighter', 'Battle Master', 3);
  const toolSpec = a.classFeatureProficiencyChoiceSpecs(records.fighter.cls, battleFeatures).find(spec => spec.kind === 'tool');
  const fighter = a.emptyCharacter();
  fighter.classProficiencyChoices = { [toolSpec.key]:'Smith\'s Tools' };
  const toolEffects = a.buildDerivedEffects(fighter, { ...base, classObj:records.fighter.cls, classProficiencyChoiceSpecs:[toolSpec], subclassFeatures:battleFeatures }, []);
  assert.ok(toolEffects.tools.includes("Smith's Tools"));
});

test('remaining subclass choices are classified with their exact PHB options', () => {
  const land = subclass('druid', 'Circle of the Land');
  const landFeatures = subclassFeatures('druid', 'Circle of the Land', 10);
  const landSpecs = a.subclassFeatureChoiceSpecs(records.druid.cls, land, landFeatures);
  const terrain = landSpecs.find(spec => spec.kind === 'additional-spell-group');
  assert.deepEqual(JSON.parse(JSON.stringify(terrain.options.map(option => option.name))), ['Arid Land','Polar Land','Temperate Land','Tropical Land']);

  const wild = subclass('barbarian', 'Path of the Wild Heart');
  const wildSpecs = a.subclassFeatureChoiceSpecs(records.barbarian.cls, wild, subclassFeatures('barbarian', 'Path of the Wild Heart', 20));
  assert.deepEqual(JSON.parse(JSON.stringify(wildSpecs.find(spec => spec.name === 'Rage of the Wilds').options.map(option => option.name))), ['Bear','Eagle','Wolf']);
  assert.deepEqual(JSON.parse(JSON.stringify(wildSpecs.find(spec => spec.name === 'Aspect of the Wilds').options.map(option => option.name))), ['Owl','Panther','Salmon']);
  assert.deepEqual(JSON.parse(JSON.stringify(wildSpecs.find(spec => spec.name === 'Power of the Wilds').options.map(option => option.name))), ['Falcon','Lion','Ram']);

  const fiend = subclass('warlock', 'Fiend Patron');
  const fiendSpecs = a.subclassFeatureChoiceSpecs(records.warlock.cls, fiend, subclassFeatures('warlock', 'Fiend Patron', 10));
  const resilience = fiendSpecs.find(spec => spec.name === 'Fiendish Resilience');
  assert.equal(resilience.options.length, 12);
  assert.ok(!resilience.options.some(option => option.name === 'Force'));

  const gloom = subclass('ranger', 'Gloom Stalker');
  assert.equal(a.subclassFeatureChoiceSpecs(records.ranger.cls, gloom, subclassFeatures('ranger', 'Gloom Stalker', 7), new Set()).some(spec => spec.name.includes('Iron Mind')), false);
  const iron = a.subclassFeatureChoiceSpecs(records.ranger.cls, gloom, subclassFeatures('ranger', 'Gloom Stalker', 7), new Set(['wis'])).find(spec => spec.name.includes('Iron Mind'));
  assert.deepEqual(JSON.parse(JSON.stringify(iron.options.map(option => option.value))), ['int','cha']);
});

test('Circle of the Land choice grants only its selected spells and resistance', () => {
  const sub = subclass('druid', 'Circle of the Land');
  const features = subclassFeatures('druid', 'Circle of the Land', 10);
  const specs = a.subclassFeatureChoiceSpecs(records.druid.cls, sub, features);
  const terrain = specs.find(spec => spec.kind === 'additional-spell-group');
  const character = a.emptyCharacter();
  character.level = 10;
  character.classFeatureChoices = { [terrain.key]:{ name:'Polar Land', source:'XPHB' } };
  assert.equal(a.selectedAdditionalSpellGroupName(character, specs), 'Polar Land');
  assert.deepEqual(JSON.parse(JSON.stringify(a.fixedAdditionalSpellRefs(sub, 10, 'prepared', 'Polar Land'))), [
    'fog cloud|xphb','hold person|xphb','ray of frost|xphb','sleet storm|xphb','ice storm|xphb','cone of cold|xphb',
  ]);
  const effects = a.buildDerivedEffects(character, {
    classObj:records.druid.cls, classFeatures:[], classFeatureOptionObjects:[], classFeatureChoiceSpecs:specs,
    classProficiencyChoiceSpecs:[], subclassFeatures:features, optionalFeatureObjects:[], speciesObj:null,
    skillProficiencies:new Set(), pb:4, mods:{str:0,dex:0,con:0,int:0,wis:4,cha:0}, level:10,
  }, []);
  assert.ok(effects.resistances.includes('Cold'));
  assert.ok(!effects.resistances.includes('Fire'));
});

test('Wild Heart, Fiendish Resilience, and Iron Mind choices reach derived effects', () => {
  const wildSub = subclass('barbarian', 'Path of the Wild Heart');
  const wildFeatures = subclassFeatures('barbarian', 'Path of the Wild Heart', 6);
  const wildSpecs = a.subclassFeatureChoiceSpecs(records.barbarian.cls, wildSub, wildFeatures);
  const aspect = wildSpecs.find(spec => spec.name === 'Aspect of the Wilds');
  const barbarian = a.emptyCharacter();
  barbarian.classFeatureChoices = { [aspect.key]:{ name:'Panther', source:'XPHB' } };
  const base = { classObj:records.barbarian.cls, classFeatures:[], classFeatureOptionObjects:[], classFeatureChoiceSpecs:wildSpecs, classProficiencyChoiceSpecs:[], subclassFeatures:wildFeatures, optionalFeatureObjects:[], speciesObj:null, skillProficiencies:new Set(), pb:3, mods:{str:0,dex:0,con:0,int:0,wis:0,cha:0}, level:6 };
  assert.equal(a.buildDerivedEffects(barbarian, base, []).movementModes.climb, 'speed');

  const fiendFeatures = subclassFeatures('warlock', 'Fiend Patron', 10);
  const fiendSpecs = a.subclassFeatureChoiceSpecs(records.warlock.cls, subclass('warlock', 'Fiend Patron'), fiendFeatures);
  const resilience = fiendSpecs.find(spec => spec.name === 'Fiendish Resilience');
  const warlock = a.emptyCharacter();
  warlock.classFeatureChoices = { [resilience.key]:{ name:'Thunder', source:'XPHB' } };
  assert.ok(a.buildDerivedEffects(warlock, { ...base, classObj:records.warlock.cls, classFeatureChoiceSpecs:fiendSpecs, subclassFeatures:fiendFeatures, level:10 }, []).resistances.includes('Thunder'));

  const ironFeatures = subclassFeatures('ranger', 'Gloom Stalker', 7);
  const ironSpecs = a.subclassFeatureChoiceSpecs(records.ranger.cls, subclass('ranger', 'Gloom Stalker'), ironFeatures, new Set(['wis']));
  const iron = ironSpecs.find(spec => spec.kind === 'saving-throw');
  const ranger = a.emptyCharacter();
  ranger.classFeatureChoices = { [iron.key]:{ name:'Charisma', source:'XPHB' } };
  const ironEffects = a.buildDerivedEffects(ranger, { ...base, classObj:records.ranger.cls, classFeatureChoiceSpecs:ironSpecs, subclassFeatures:ironFeatures, preFeatureSavingThrowProficiencies:new Set(['wis']), level:7 }, []);
  assert.ok(ironEffects.savingThrows.has('cha'));
  assert.ok(!ironEffects.savingThrows.has('int'));
});

test('Darkvision-extending subclass choices add sixty feet to an existing range', () => {
  const none = a.applyDarkvisionBonus([], 60);
  assert.equal(none.at(-1).label, 'Darkvision 60 ft.');
  const existing = a.applyDarkvisionBonus([{ tag:'sense', name:'Darkvision', source:'XPHB', label:'Darkvision 60 ft.' }], 60);
  assert.equal(existing.at(-1).label, 'Darkvision 120 ft.');
});

test('Magical Discoveries and every Savant progression produce bounded spell slots', () => {
  const lore = subclassFeatures('bard', 'College of Lore', 6);
  const discoveries = a.classFeatureSpellChoiceSpecs(records.bard.cls, lore, 6).find(spec => spec.name === 'Magical Discoveries');
  assert.equal(discoveries.choices[0].count, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(discoveries.choices[0].filter.classes)), ['Cleric','Druid','Wizard']);
  assert.equal(Math.max(...discoveries.choices[0].filter.levels), 3);
  assert.ok(a.featureSpellChoiceOptions(discoveries.choices[0]).every(spell => spell.level <= 3));

  for (const [subName, featureName, school] of [
    ['Abjurer','Abjuration Savant','A'], ['Diviner','Divination Savant','D'],
    ['Evoker','Evocation Savant','V'], ['Illusionist','Illusion Savant','I'],
  ]) {
    const features = subclassFeatures('wizard', subName, 17);
    const spec = a.classFeatureSpellChoiceSpecs(records.wizard.cls, features, 17).find(value => value.name === featureName);
    assert.equal(spec.choices.reduce((sum, choice) => sum + choice.count, 0), 9, featureName);
    assert.ok(spec.choices.every(choice => choice.grant === 'spellbook'));
    assert.ok(a.featureSpellChoiceOptions(spec.choices[0]).every(spell => spell.school === school), featureName);
  }
});

test('invocation targets and Pact of the Tome choices reconcile against live spells', () => {
  const byName = name => ({ ...optional.find(feature => feature.name === name), _choiceKey:`slot|${name}` });
  const character = a.emptyCharacter();
  character.level = 5;
  character.cantrips = ['Eldritch Blast|XPHB','Poison Spray|XPHB','Blade Ward|XPHB'];
  const features = [byName('Agonizing Blast'), { ...byName('Agonizing Blast'), _choiceKey:'slot|Agonizing Blast|2' }, byName('Repelling Blast'), byName('Eldritch Spear'), byName('Pact of the Tome')];
  const specs = a.optionalFeatureSpellChoiceSpecs(features, character, { level:5, alwaysKnownSpells:[] });
  const targets = specs.filter(spec => spec.name !== 'Pact of the Tome');
  assert.equal(targets.length, 4);
  for (const spec of targets) assert.ok(a.featureSpellChoiceOptions(spec.choices[0]).some(spell => spell.name === 'Eldritch Blast'), spec.name);
  assert.ok(!a.featureSpellChoiceOptions(targets[0].choices[0]).some(spell => spell.name === 'Blade Ward'));

  const tome = specs.find(spec => spec.name === 'Pact of the Tome');
  assert.deepEqual(JSON.parse(JSON.stringify(tome.choices.map(choice => choice.count))), [3,2]);
  assert.equal(tome.choices[0].filter.levels[0], 0);
  assert.equal(tome.choices[1].filter.ritual, true);

  const first = targets[0], second = targets[1];
  character.featureSpellChoices = {
    [first.key]:{ picks:{ [first.choices[0].key]:['Eldritch Blast|XPHB'] } },
    [second.key]:{ picks:{ [second.choices[0].key]:['Eldritch Blast|XPHB'] } },
  };
  a.reconcileFeatureSpellChoices(character, specs);
  assert.deepEqual(JSON.parse(JSON.stringify(character.featureSpellChoices[first.key].picks[first.choices[0].key])), ['Eldritch Blast|XPHB']);
  assert.equal(character.featureSpellChoices[second.key].picks[second.choices[0].key], undefined);

  character.cantrips = [];
  const withoutCantrip = a.optionalFeatureSpellChoiceSpecs(features, character, { level:5, alwaysKnownSpells:[] });
  a.reconcileFeatureSpellChoices(character, withoutCantrip);
  assert.equal(character.featureSpellChoices[first.key].picks[first.choices[0].key], undefined);
});

test('feature spell picks stay in their prepared, cantrip, and spellbook collections', () => {
  const character = a.emptyCharacter();
  const discoveries = a.classFeatureSpellChoiceSpecs(records.bard.cls, subclassFeatures('bard', 'College of Lore', 6), 6)[0];
  const savant = a.classFeatureSpellChoiceSpecs(records.wizard.cls, subclassFeatures('wizard', 'Abjurer', 3), 3)[0];
  const tomeFeature = { ...optional.find(feature => feature.name === 'Pact of the Tome'), _choiceKey:'warlock|tome' };
  const tome = a.optionalFeatureSpellChoiceSpecs([tomeFeature], character, { level:3, alwaysKnownSpells:[] })[0];
  character.featureSpellChoices = {
    [discoveries.key]:{ picks:{ [discoveries.choices[0].key]:['Guidance|XPHB','Shield|XPHB'] } },
    [savant.key]:{ picks:{ [savant.choices[0].key]:['Alarm|XPHB','Shield|XPHB'] } },
    [tome.key]:{ picks:{
      [tome.choices[0].key]:['Light|XPHB','Mage Hand|XPHB','Sacred Flame|XPHB'],
      [tome.choices[1].key]:['Detect Magic|XPHB','Identify|XPHB'],
    } },
  };
  const specs = [discoveries, savant, tome];
  assert.deepEqual(JSON.parse(JSON.stringify(a.featureGrantedSpellRefs(character, specs, 'known'))), ['Light|XPHB','Mage Hand|XPHB','Sacred Flame|XPHB']);
  assert.deepEqual(JSON.parse(JSON.stringify(a.featureGrantedSpellRefs(character, specs, 'prepared'))), ['Guidance|XPHB','Shield|XPHB','Detect Magic|XPHB','Identify|XPHB']);
  assert.deepEqual(JSON.parse(JSON.stringify(a.featureGrantedSpellRefs(character, specs, 'spellbook'))), ['Alarm|XPHB','Shield|XPHB']);
});

test('Lessons of the First Ones grants distinct Origin feats through repeatable invocation slots', () => {
  const invocationSlots = a.optionalFeatureProgression(records.warlock.cls, 2);
  const lessons = optional.find(feature => feature.name === 'Lessons of the First Ones');
  const selected = invocationSlots.slice(0, 2).map(slot => ({ ...lessons, _choiceKey:slot.key }));
  const specs = a.optionalFeatureFeatChoiceSpecs(selected);
  assert.equal(specs.length, 2);
  assert.ok(specs.every(spec => spec.options.length >= 10));
  const character = a.emptyCharacter();
  character.featureFeatChoices = {
    [specs[0].key]:{ name:'Alert', source:'XPHB' },
    [specs[1].key]:{ name:'Alert', source:'XPHB' },
  };
  a.reconcileFeatureFeatChoices(character, specs);
  assert.equal(character.featureFeatChoices[specs[1].key], undefined);
  character.featureFeatChoices[specs[1].key] = { name:'Tough', source:'XPHB' };
  a.reconcileFeatureFeatChoices(character, specs);
  const granted = a.selectedFeatObjects(character);
  assert.deepEqual(JSON.parse(JSON.stringify(granted.map(feat => feat.name).sort())), ['Alert','Tough']);
  const effects = a.buildDerivedEffects(character, {
    classObj:records.warlock.cls, classFeatures:[], classFeatureOptionObjects:[], classFeatureChoiceSpecs:[],
    classProficiencyChoiceSpecs:[], subclassFeatures:[], optionalFeatureObjects:selected, speciesObj:null,
    skillProficiencies:new Set(), pb:2, mods:{str:0,dex:0,con:0,int:0,wis:0,cha:3}, level:2,
  }, granted);
  assert.equal(effects.initiativeBonus, 2);
  assert.equal(effects.hpPerLevel, 2);
});
