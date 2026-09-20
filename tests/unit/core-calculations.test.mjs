import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAppTestContext } from '../lib/app-context.mjs';

const a = loadAppTestContext();

function assertObjectEqual(actual, expected, label) {
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected, label);
}

test('ability modifiers use 2024 normal floor calculation', () => {
  assert.equal(a.abilityMod(1), -5);
  assert.equal(a.abilityMod(8), -1);
  assert.equal(a.abilityMod(9), -1);
  assert.equal(a.abilityMod(10), 0);
  assert.equal(a.abilityMod(15), 2);
  assert.equal(a.abilityMod(20), 5);
});

test('proficiency bonus scales at the correct levels', () => {
  assert.equal(a.proficiencyBonus(1), 2);
  assert.equal(a.proficiencyBonus(4), 2);
  assert.equal(a.proficiencyBonus(5), 3);
  assert.equal(a.proficiencyBonus(8), 3);
  assert.equal(a.proficiencyBonus(9), 4);
  assert.equal(a.proficiencyBonus(20), 6);
});

test('2024 standard array has six distinct scores', () => {
  assert.deepEqual([...a.STANDARD_ARRAY].sort((x, y) => y - x), [15, 14, 13, 12, 10, 8]);
});

test('PHB standard-array-by-class assignments are complete and use the standard array', () => {
  const expectedClasses = ['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];
  for (const cls of expectedClasses) {
    const row = a.STANDARD_ARRAY_BY_CLASS[cls];
    assert.ok(row, `missing PHB row for ${cls}`);
    assert.deepEqual(Object.values(row).sort((x, y) => y - x), [...a.STANDARD_ARRAY].sort((x, y) => y - x), cls);
  }
});

test('class spell slot progression exposes expected tier-one values', () => {
  const wizard = {classTableGroups:[{rowsSpellProgression:[[2],[4,0,0,0],[4,2,0,0,0],[4,3,0,0,0],[4,3,2,0,0]]}]};
  assert.deepEqual([...a.classSpellSlots(wizard, 1)], [2]);
  assert.deepEqual([...a.classSpellSlots(wizard, 5)], [4,3,2,0,0]);
  assert.deepEqual([...a.classSpellSlots({classTableGroups:[]}, 1)], []);
});

test('weapon proficiency categories recognize 2024 compact tokens', () => {
  const dagger = {name:'Dagger', weaponCategory:'simple', property:['F','L']};
  const longsword = {name:'Longsword', weaponCategory:'martial', property:['V']};
  assert.equal(a.hasWeaponProficiency(dagger, ['simple']), true);
  assert.equal(a.hasWeaponProficiency(dagger, ['Simple Weapons']), true);
  assert.equal(a.hasWeaponProficiency(longsword, ['martial']), true);
  assert.equal(a.hasWeaponProficiency(longsword, ['Simple']), false);
});

test('finesse chooses the higher of Strength and Dexterity for automatic attacks', () => {
  const dagger = {name:'Dagger', weaponCategory:'simple', property:['F']};
  assert.equal(a.weaponAbility(dagger, {str:1,dex:4}), 'dex');
  assert.equal(a.weaponAbility(dagger, {str:4,dex:1}), 'str');
});

test('weapon flags interpret 5etools property codes', () => {
  const dagger = a.weaponFlags({weaponCategory:'simple', property:['F','L','T']});
  assertObjectEqual(dagger, {ranged:false, thrown:true, finesse:true, light:true, twoHanded:false, melee:true}, 'dagger flags');
  const longbow = a.weaponFlags({weaponCategory:'ranged', property:['A','H','2H']});
  assert.equal(longbow.ranged, true);
  assert.equal(longbow.twoHanded, true);
});

test('unarmored defense is present only for classes that define it', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(a.getUnarmoredDefenseFormula({name:'Barbarian'}, 1))), {base:10, abilities:['dex','con'], allowShield:true, label:'Unarmored Defense (10 + DEX + CON)'});
  assert.deepEqual(JSON.parse(JSON.stringify(a.getUnarmoredDefenseFormula({name:'Monk'}, 1))), {base:10, abilities:['dex','wis'], allowShield:false, label:'Unarmored Defense (10 + DEX + WIS)'});
  assert.equal(a.getUnarmoredDefenseFormula({name:'Wizard'}, 1), null);
});

test('character migration preserves schema and creates required choice containers', () => {
  const c = a.migrateCharacter({schema: 1, name:'Old'});
  for (const key of ['featAbilityChoices','featSaveChoices','featSkillChoices','featMixedChoices','featSpellChoices','featExpertiseChoices','speciesChoices','classFeatureChoices','classProficiencyChoices']) {
    assert.ok(c[key] && typeof c[key] === 'object', key);
  }
  assert.ok(Array.isArray(c.standardLanguages));
  assert.equal(c.standardLanguages.length, 2);
});
