import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const a = loadAppTestContext();
resetState(a);

function baseCharacter(overrides = {}) {
  return {
    ...a.emptyCharacter(),
    level: 1,
    baseStats: {str:10,dex:10,con:10,int:10,wis:10,cha:10},
    ...overrides,
  };
}

function baseDerived({speciesObj = null, classObj = null, classFeatures = [], subclassFeatures = [], optionalFeatureObjects = [], skillProficiencies = new Set(), level = 1} = {}) {
  return { speciesObj, classObj, classFeatures, subclassFeatures, optionalFeatureObjects, skillProficiencies, pb: a.proficiencyBonus(level) };
}

test('Gnomish Cunning gives Advantage on Intelligence, Wisdom, and Charisma saves', () => {
  const c = baseCharacter();
  const species = {name:'Gnome', source:'XPHB', entries:[{name:'Gnomish Cunning', entries:['You have Advantage on Intelligence, Wisdom, and Charisma saving throws.']}]};
  const effects = a.buildDerivedEffects(c, baseDerived({speciesObj:species}), []);
  assert.deepEqual([...effects.savingThrowAdvantages].sort(), ['cha','int','wis']);
});

test('Dwarven Toughness adds one hit point per character level', () => {
  const c = baseCharacter({level:7});
  const species = {name:'Dwarf', source:'XPHB', entries:[{name:'Dwarven Toughness', entries:['Your Hit Point maximum increases by 1, and it increases by 1 again whenever you gain a level.']}]};
  const effects = a.buildDerivedEffects(c, baseDerived({speciesObj:species}), []);
  assert.equal(effects.hpPerLevel, 1);
});

test('Dwarven Resilience records Poison resistance', () => {
  const c = baseCharacter();
  const species = {name:'Dwarf', source:'XPHB', entries:[{name:'Dwarven Resilience', entries:['You have Resistance to Poison damage.']}]};
  const effects = a.buildDerivedEffects(c, baseDerived({speciesObj:species}), []);
  assert.ok(effects.resistances.includes('Poison'));
});

test('Tough adds two hit points per character level', () => {
  const c = baseCharacter({level:5});
  const feat = {name:'Tough', source:'XPHB', entries:[]};
  const effects = a.buildDerivedEffects(c, baseDerived(), [feat]);
  assert.equal(effects.hpPerLevel, 2);
});

test('2024 Alert adds proficiency bonus to initiative', () => {
  const c = baseCharacter({level:9});
  const feat = {name:'Alert', source:'XPHB', entries:[]};
  const effects = a.buildDerivedEffects(c, baseDerived({level:9}), [feat]);
  assert.equal(effects.initiativeBonus, 4);
});

test('Dual Wielder activates the conditional AC flag', () => {
  const c = baseCharacter();
  const feat = {name:'Dual Wielder', source:'XPHB', entries:[]};
  const effects = a.buildDerivedEffects(c, baseDerived(), [feat]);
  assert.equal(effects.flags.has('dualWielder'), true);
});

test('Defense fighting style adds +1 AC while armored', () => {
  const c = baseCharacter();
  const feature = {name:'Defense', source:'XPHB', entries:[]};
  const effects = a.buildDerivedEffects(c, baseDerived({optionalFeatureObjects:[feature]}), []);
  assert.equal(effects.acBonusWhileArmored, 1);
});

test('Archery fighting style adds +2 ranged attack rolls', () => {
  const c = baseCharacter();
  const feature = {name:'Archery', source:'XPHB', entries:[]};
  const effects = a.buildDerivedEffects(c, baseDerived({optionalFeatureObjects:[feature]}), []);
  assert.equal(effects.attackBonuses.ranged, 2);
});
