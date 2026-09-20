import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const a = loadAppTestContext();

function baseCharacter(overrides = {}) {
  return {
    ...a.emptyCharacter(),
    level: 1,
    baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    ...overrides,
  };
}

function baseDerived(overrides = {}) {
  const level = Number(overrides.level || 1);
  return {
    speciesObj: null,
    classObj: null,
    classFeatures: [],
    subclassFeatures: [],
    optionalFeatureObjects: [],
    skillProficiencies: new Set(),
    pb: a.proficiencyBonus(level),
    ...overrides,
  };
}

function featChoiceKey(name, source, index = 0, choiceIndex = 0) {
  return name + '|' + source + '|' + index + '|' + choiceIndex;
}

function withState(fn) {
  resetState(a);
  a.state.character = a.emptyCharacter();
  return fn();
}

const cases = [];
function add(name, fn) {
  cases.push([name, fn]);
}

/* 01–12: ability modifiers */
[
  [1, -5], [2, -4], [3, -4], [7, -2], [8, -1], [9, -1],
  [10, 0], [11, 0], [12, 1], [13, 1], [14, 2], [20, 5],
].forEach(([score, expected]) => {
  add('ability modifier: ' + score + ' -> ' + expected, () => {
    assert.equal(a.abilityMod(score), expected);
  });
});

/* 13–22: proficiency bonus */
[
  [1, 2], [4, 2], [5, 3], [8, 3], [9, 4],
  [12, 4], [13, 5], [16, 5], [17, 6], [20, 6],
].forEach(([level, expected]) => {
  add('proficiency bonus: level ' + level + ' -> ' + expected, () => {
    assert.equal(a.proficiencyBonus(level), expected);
  });
});

/* 23–32: modifier formatting */
[
  [-5, '-5'], [-2, '-2'], [-1, '-1'], [0, '+0'], [1, '+1'],
  [2, '+2'], [3, '+3'], [4, '+4'], [5, '+5'], [10, '+10'],
].forEach(([value, expected]) => {
  add('format modifier: ' + value + ' -> ' + expected, () => {
    assert.equal(a.formatMod(value), expected);
  });
});

/* 33–38: standard array */
add('standard array has exactly six scores', () => {
  assert.equal(a.STANDARD_ARRAY.length, 6);
});
add('standard array contains 14', () => {
  assert.ok(a.STANDARD_ARRAY.includes(14));
});
add('standard array contains 13', () => {
  assert.ok(a.STANDARD_ARRAY.includes(13));
});
add('standard array contains 12, 10, and 8', () => {
  assert.ok(a.STANDARD_ARRAY.includes(12));
  assert.ok(a.STANDARD_ARRAY.includes(10));
  assert.ok(a.STANDARD_ARRAY.includes(8));
});
add('every 2024 class has a standard-array row using the same six values', () => {
  const classes = ['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard'];
  const expected = [...a.STANDARD_ARRAY].sort((x, y) => y - x);
  for (const name of classes) {
    assert.ok(a.STANDARD_ARRAY_BY_CLASS[name]);
    assert.deepEqual(Object.values(a.STANDARD_ARRAY_BY_CLASS[name]).sort((x, y) => y - x), expected, name);
  }
});

/* 39–53: final ability-score assembly */
add('final stats preserve base scores with no bonuses', () => {
  const c = baseCharacter();
  assert.deepEqual(JSON.parse(JSON.stringify(a.calculateFinalStats(c, null, []))), c.baseStats);
});
add('background +2 applies to selected score', () => {
  const c = baseCharacter({ backgroundAbility: { mode:'split', plus2:'int', plus1:null, plus1b:null, plus1c:null } });
  assert.equal(a.calculateFinalStats(c, null, []).int, 12);
});
add('background +1 applies to selected score', () => {
  const c = baseCharacter({ backgroundAbility: { mode:'split', plus2:null, plus1:'wis', plus1b:null, plus1c:null } });
  assert.equal(a.calculateFinalStats(c, null, []).wis, 11);
});
add('background split does not double-add when +2 and +1 target the same score', () => {
  const c = baseCharacter({ backgroundAbility: { mode:'split', plus2:'cha', plus1:'cha', plus1b:null, plus1c:null } });
  assert.equal(a.calculateFinalStats(c, null, []).cha, 12);
});
add('background three-way mode adds +1 to each selected score', () => {
  const c = baseCharacter({ backgroundAbility: { mode:'three', plus2:null, plus1:'str', plus1b:'dex', plus1c:'wis' } });
  const stats = a.calculateFinalStats(c, null, []);
  assert.equal(stats.str, 11);
  assert.equal(stats.dex, 11);
  assert.equal(stats.wis, 11);
});
add('background +2 is capped at 20', () => {
  const c = baseCharacter({ baseStats:{...baseCharacter().baseStats, int:19}, backgroundAbility:{mode:'split',plus2:'int',plus1:null} });
  assert.equal(a.calculateFinalStats(c, null, []).int, 20);
});
add('background +1 is capped at 20', () => {
  const c = baseCharacter({ baseStats:{...baseCharacter().baseStats, wis:20}, backgroundAbility:{mode:'split',plus2:null,plus1:'wis'} });
  assert.equal(a.calculateFinalStats(c, null, []).wis, 20);
});
add('fixed feat ability increase applies without a choice', () => {
  const c = baseCharacter();
  const feat = {name:'Fixed', source:'XPHB', ability:[{intelligence:1}]};
  assert.equal(a.calculateFinalStats(c, null, [feat]).int, 11);
});
add('selected feat ability choice applies to the selected ability', () => {
  const c = baseCharacter({ featAbilityChoices: { [featChoiceKey('Chooser','XPHB')]: 'wis' } });
  const feat = {name:'Chooser', source:'XPHB', ability:[{choose:{from:['intelligence','wisdom'],count:1,amount:1}}]};
  assert.equal(a.calculateFinalStats(c, null, [feat]).wis, 11);
});
add('unselected feat ability choice does not silently choose the first option', () => {
  const c = baseCharacter({ featAbilityChoices: {} });
  const feat = {name:'Chooser', source:'XPHB', ability:[{choose:{from:['intelligence','wisdom'],count:1,amount:1}}]};
  const stats = a.calculateFinalStats(c, null, [feat]);
  assert.equal(stats.int, 10);
  assert.equal(stats.wis, 10);
});
add('two fixed feat bonuses stack', () => {
  const c = baseCharacter();
  const feats = [
    {name:'A',source:'XPHB',ability:[{intelligence:1}]},
    {name:'B',source:'XPHB',ability:[{intelligence:2}]},
  ];
  assert.equal(a.calculateFinalStats(c, null, feats).int, 13);
});
add('manual ability bonus applies after background and feats', () => {
  const c = baseCharacter({
    manualAbilityBonuses:{str:1},
    backgroundAbility:{mode:'split',plus2:'str',plus1:null}
  });
  const feat = {name:'Feat',source:'XPHB',ability:[{str:1}]};
  assert.equal(a.calculateFinalStats(c, null, [feat]).str, 14);
});
add('zero manual ability bonus is a no-op', () => {
  const c = baseCharacter({manualAbilityBonuses:{str:0}});
  assert.equal(a.calculateFinalStats(c, null, []).str, 10);
});
add('base score below one is clamped to one', () => {
  const c = baseCharacter({baseStats:{str:-10,dex:10,con:10,int:10,wis:10,cha:10}});
  assert.equal(a.calculateFinalStats(c, null, []).str, 1);
});
add('base score above thirty is clamped to thirty', () => {
  const c = baseCharacter({baseStats:{str:99,dex:10,con:10,int:10,wis:10,cha:10}});
  assert.equal(a.calculateFinalStats(c, null, []).str, 30);
});
add('invalid background and feat ability choices are ignored', () => {
  const c = baseCharacter({
    backgroundAbility:{mode:'split',plus2:'bogus',plus1:'also-bogus'},
  });
  const feat = {name:'Bad',source:'XPHB',ability:[{bogus:5}]};
  assert.deepEqual(a.calculateFinalStats(c, null, [feat]).str, 10);
});

/* 54–65: hit points */
add('default hit die is d8 when no class hit die is supplied', () => {
  assert.equal(a.hitDieFaces({}), 8);
});
add('hit die uses explicit d6', () => {
  assert.equal(a.hitDieFaces({hd:{faces:6}}), 6);
});
add('hit die uses explicit d10', () => {
  assert.equal(a.hitDieFaces({hd:{faces:10}}), 10);
});
add('hit die uses explicit d12', () => {
  assert.equal(a.hitDieFaces({hd:{faces:12}}), 12);
});
add('level-one HP uses maximum hit die plus Constitution modifier', () => {
  assert.equal(a.defaultMaxHp({hd:{faces:8}}, 1, 0), 8);
});
add('level-one HP with positive Constitution modifier', () => {
  assert.equal(a.defaultMaxHp({hd:{faces:10}}, 1, 3), 13);
});
add('level-two HP adds one later-level increase', () => {
  assert.equal(a.defaultMaxHp({hd:{faces:8}}, 2, 0), 13);
});
add('level-five d8 HP follows 2024 fixed-average progression', () => {
  assert.equal(a.defaultMaxHp({hd:{faces:8}}, 5, 0), 28);
});
add('negative Constitution cannot reduce level-one HP below one', () => {
  assert.equal(a.defaultMaxHp({hd:{faces:6}}, 1, -5), 1);
});
add('negative Constitution cannot reduce later HP below one per level', () => {
  assert.equal(a.defaultMaxHp({hd:{faces:6}}, 2, -5), 2);
});
add('numeric maximum HP override is honored', () => {
  assert.equal(a.defaultMaxHp({hd:{faces:8}}, 5, 0, 20), 20);
});
add('zero maximum HP override is normalized to one', () => {
  assert.equal(a.defaultMaxHp({hd:{faces:8}}, 5, 0, 0), 1);
});

/* 66–77: spell progression */
add('class spell slots return level-one progression', () => {
  const cls = {classTableGroups:[{rowsSpellProgression:[[2],[4,2,0,0]]}]};
  assert.deepEqual(a.classSpellSlots(cls,1), [2]);
});
add('class spell slots return level-two progression', () => {
  const cls = {classTableGroups:[{rowsSpellProgression:[[2],[4,2,0,0]]}]};
  assert.deepEqual(a.classSpellSlots(cls,2), [4,2,0,0]);
});
add('class spell slots are capped at nine spell levels', () => {
  const cls = {classTableGroups:[{rowsSpellProgression:[[1,2,3,4,5,6,7,8,9,99]]}]};
  assert.equal(a.classSpellSlots(cls,1).length, 9);
});
add('negative spell-slot entries become zero', () => {
  const cls = {classTableGroups:[{rowsSpellProgression:[[-1,2,-3]]}]};
  assert.deepEqual(a.classSpellSlots(cls,1), [0,2,0]);
});
add('missing spell progression returns an empty array', () => {
  assert.equal(a.classSpellSlots({classTableGroups:[]},1).length, 0);
});
add('Pact Magic table yields the correct slot count and level', () => {
  const cls = {classTableGroups:[{colLabels:['Spell Slots','Slot Level'],rows:[[2,1],[2,1],[2,2]]}]};
  assert.deepEqual([...a.classSpellSlots(cls,3)], [0,2,0,0,0,0,0,0,0]);
});
add('invalid Pact Magic slot count is rejected', () => {
  const cls = {classTableGroups:[{colLabels:['Spell Slots','Slot Level'],rows:[[0,1]]}]};
  assert.equal(a.classSpellSlots(cls,1).length, 0);
});
add('invalid Pact Magic slot level is rejected', () => {
  const cls = {classTableGroups:[{colLabels:['Spell Slots','Slot Level'],rows:[[2,10]]}]};
  assert.equal(a.classSpellSlots(cls,1).length, 0);
});
add('cantrip progression returns the level-specific value', () => {
  assert.equal(a.classCantrips({cantripProgression:[3,3,3,4]},4),4);
});
add('missing cantrip progression returns null', () => {
  assert.equal(a.classCantrips({},1),null);
});
add('prepared-spell progression uses the explicit table when present', () => {
  assert.equal(a.classPrepared({preparedSpellsProgression:[4,5]},2,{}),5);
});
add('prepared casters do not expose a fixed known-spell cap', () => {
  assert.equal(a.classKnownSpells({preparedSpellsProgression:[4,5]},2),null);
});

/* 78–102: weapons and armor */
add('dagger flags identify finesse, light, thrown, and melee', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(a.weaponFlags({weaponCategory:'simple',property:['F','L','T']}))), {
    ranged:false,thrown:true,finesse:true,light:true,twoHanded:false,melee:true,
  });
});
add('longbow flags identify ranged and two-handed', () => {
  const x=a.weaponFlags({weaponCategory:'ranged',property:['A','H','2H']});
  assert.equal(x.ranged,true);
  assert.equal(x.twoHanded,true);
});
add('R weapon property makes an otherwise untyped weapon ranged', () => {
  assert.equal(a.weaponFlags({weaponCategory:'',property:['R']}).ranged,true);
});
add('T weapon property makes a weapon thrown', () => {
  assert.equal(a.weaponFlags({weaponCategory:'simple',property:['T']}).thrown,true);
});
add('F weapon property makes a weapon finesse', () => {
  assert.equal(a.weaponFlags({weaponCategory:'simple',property:['F']}).finesse,true);
});
add('L weapon property makes a weapon light', () => {
  assert.equal(a.weaponFlags({weaponCategory:'simple',property:['L']}).light,true);
});
add('2H weapon property makes a weapon two-handed', () => {
  assert.equal(a.weaponFlags({weaponCategory:'martial',property:['2H']}).twoHanded,true);
});
add('ranged weapons are not marked melee', () => {
  assert.equal(a.weaponFlags({weaponCategory:'ranged',property:[]}).melee,false);
});
add('melee weapons are marked melee', () => {
  assert.equal(a.weaponFlags({weaponCategory:'simple',property:[]}).melee,true);
});
add('finesse attack uses Dexterity when it is higher', () => {
  assert.equal(a.weaponAbility({property:['F'],weaponCategory:'simple'},{str:1,dex:4}),'dex');
});
add('finesse attack uses Strength when it is higher', () => {
  assert.equal(a.weaponAbility({property:['F'],weaponCategory:'simple'},{str:4,dex:1}),'str');
});
add('ranged attack uses Dexterity', () => {
  assert.equal(a.weaponAbility({property:[],weaponCategory:'ranged'},{str:4,dex:1}),'dex');
});
add('melee attack uses Strength', () => {
  assert.equal(a.weaponAbility({property:[],weaponCategory:'simple'},{str:4,dex:1}),'str');
});
add('exact weapon-name proficiency is accepted', () => {
  assert.equal(a.hasWeaponProficiency({name:'Rapier',weaponCategory:'martial'},['Rapier']),true);
});
add('compact weapon-name proficiency is accepted', () => {
  assert.equal(a.hasWeaponProficiency({name:'Long Sword',weaponCategory:'martial'},['long sword']),true);
});
add('simple weapon category grants proficiency from Simple Weapons', () => {
  assert.equal(a.hasWeaponProficiency({name:'Dagger',weaponCategory:'simple'},['Simple Weapons']),true);
});
add('simple weapon category grants proficiency from simple token', () => {
  assert.equal(a.hasWeaponProficiency({name:'Dagger',weaponCategory:'simple'},['simple']),true);
});
add('martial weapon category grants proficiency from Martial Weapons', () => {
  assert.equal(a.hasWeaponProficiency({name:'Longsword',weaponCategory:'martial'},['Martial Weapons']),true);
});
add('martial weapon category grants proficiency from martial token', () => {
  assert.equal(a.hasWeaponProficiency({name:'Longsword',weaponCategory:'martial'},['martial']),true);
});
add('martial light-property exception is recognized', () => {
  const item={name:'Example',weaponCategory:'martial',property:['L']};
  assert.equal(a.hasWeaponProficiency(item,['Martial Weapons; Light Property']),true);
});
add('simple weapon does not gain martial proficiency from a Simple label mismatch', () => {
  assert.equal(a.hasWeaponProficiency({name:'Dagger',weaponCategory:'simple'},['Martial Weapons']),false);
});
add('shield proficiency recognizes shield label', () => {
  assert.equal(a.hasArmorTraining({armor:['Shield']},'S'),true);
});
add('light armor proficiency recognizes Light Armor', () => {
  assert.equal(a.hasArmorTraining({armor:['Light Armor']},'LA'),true);
});
add('medium armor proficiency recognizes Medium Armor', () => {
  assert.equal(a.hasArmorTraining({armor:['Medium Armor']},'MA'),true);
});
add('heavy armor proficiency recognizes Heavy Armor', () => {
  assert.equal(a.hasArmorTraining({armor:['Heavy Armor']},'HA'),true);
});

/* 103–122: choices and proficiency normalization */
add('ability normalization accepts all six named abilities and abbreviations', () => {
  assert.deepEqual(
    ['str','strength','dexterity','con','intelligence','wisdom','cha'].map(v=>a.normalizeAbilityKey(v)),
    ['str','str','dex','con','int','wis','cha']
  );
});
add('invalid ability normalization returns null', () => {
  assert.equal(a.normalizeAbilityKey('Luck'),null);
});
add('skill normalization accepts keys and display names', () => {
  assert.equal(a.normalizeSkillKey('athletics'),'athletics');
  assert.equal(a.normalizeSkillKey('Athletics'),'athletics');
});
add('invalid skill normalization returns null', () => {
  assert.equal(a.normalizeSkillKey('Quantum Mechanics'),null);
});
add('granted skill maps are deduplicated', () => {
  const skills=a.grantedSkillsFromMap([{athletics:true},{Athletics:true},{stealth:true}]);
  assert.deepEqual(JSON.parse(JSON.stringify(skills.sort())),['athletics','stealth']);
});
add('normalized proficiency labels remove quantity suffixes', () => {
  assert.equal(a.normalizedProficiencyLabel('Smith Tools ×2'),'smithtools');
});
add('friendly proficiency labels normalize simple and martial', () => {
  assert.equal(a.friendlyProficiencyKey('simple'),'Simple Weapons');
  assert.equal(a.friendlyProficiencyKey('martial'),'Martial Weapons');
});
add('proficiency choice parser respects an explicit count', () => {
  const obj={languageProficiencies:[{choose:{from:['anyStandard'],count:2}}]};
  const specs=a.proficiencyChoiceSpecs(obj,'languageProficiencies','bg');
  assert.equal(specs.length,1);
  assert.equal(specs[0].count,2);
});
add('proficiency choice parser recognizes any-token choices', () => {
  const obj={toolProficiencies:[{anyArtisansTool:1}]};
  const specs=a.proficiencyChoiceSpecs(obj,'toolProficiencies','bg');
  assert.equal(specs.length,1);
  assert.equal(specs[0].any,true);
});
add('language proficiency choices are tagged as language choices', () => {
  const obj={languageProficiencies:[{choose:{from:['anyStandard'],count:1}}]};
  assert.equal(a.proficiencyChoiceSpecs(obj,'languageProficiencies','bg')[0].kind,'language');
});
add('tool proficiency choices are tagged as tool choices', () => {
  const obj={toolProficiencies:[{choose:{from:['anyTool'],count:1}}]};
  assert.equal(a.proficiencyChoiceSpecs(obj,'toolProficiencies','bg')[0].kind,'tool');
});
add('background parser recognizes weighted +2/+1 choices', () => {
  const bg={ability:[{choose:{weighted:{from:['str','dex','con'],weights:[2,1]}}}]};
  const spec=a.backgroundAbilitySpec(bg);
  assert.deepEqual(JSON.parse(JSON.stringify(spec.plus2From.sort())),['con','dex','str']);
  assert.deepEqual(JSON.parse(JSON.stringify(spec.plus1From.sort())),['con','dex','str']);
});
add('background parser recognizes three +1 choices', () => {
  const bg={ability:[{choose:{weighted:{from:['str','dex','wis'],weights:[1,1,1]}}}]};
  const spec=a.backgroundAbilitySpec(bg);
  assert.equal(spec.supportsThree,true);
});
add('feat parser recognizes fixed ability bonuses', () => {
  const feat={name:'Fixed',source:'XPHB',ability:[{wisdom:1}]};
  assert.deepEqual(JSON.parse(JSON.stringify(a.featAbilitySpecs(feat)[0])),{index:0,choiceIndex:0,from:['wis'],amount:1,fixed:true});
});
add('feat parser creates one choice spec per requested ability slot', () => {
  const feat={name:'Choose',source:'XPHB',ability:[{choose:{from:['str','dex'],count:2,amount:1}}]};
  assert.equal(a.featAbilitySpecs(feat).length,2);
});
add('feat save parser recognizes fixed saving-throw proficiency', () => {
  const feat={savingThrowProficiencies:['wisdom']};
  assert.equal(a.featSaveSpecs(feat)[0].from[0],'wis');
});
add('feat skill parser recognizes a selectable skill', () => {
  const feat={skillProficiencies:[{choose:{from:['Arcana','Stealth'],count:1}}]};
  assert.deepEqual(a.featSkillSpecs(feat)[0].from.sort(),['arcana','stealth']);
});
add('mixed feat parser creates one choice per count', () => {
  const feat={name:'Skilled',source:'XPHB',skillToolLanguageProficiencies:[{choose:{from:['anySkill','anyTool'],count:2}}]};
  assert.equal(a.featMixedChoiceSpecs(feat).length,2);
});
add('expertise feat parser supports any proficient skill choices', () => {
  const feat={name:'Boon of Skill',source:'XPHB',expertise:[{choose:{from:['anyProficientSkill'],count:1}}]};
  const spec=a.featExpertiseSpecs(feat)[0];
  assert.equal(spec.anyProficientSkill,true);
  assert.equal(spec.from.length,Object.keys(a.SKILLS).length);
});
add('additional spell choice parser captures spell lists and abilities', () => {
  const feat={name:'Magic Initiate',source:'XPHB',additionalSpells:[{names:['Cleric','Druid','Wizard'],ability:{choose:{from:['wisdom','intelligence','charisma']}}}]};
  const spec=a.featAdditionalSpellChoiceSpecs(feat)[0];
  assert.deepEqual(JSON.parse(JSON.stringify(spec.names)),['Cleric','Druid','Wizard']);
  assert.deepEqual(JSON.parse(JSON.stringify(spec.abilityFrom.sort())),['cha','int','wis']);
});

/* 123–142: derived feature effects */
add('Gnomish Cunning grants INT/WIS/CHA save advantage', () => {
  const species={name:'Gnome',source:'XPHB',entries:[{name:'Gnomish Cunning',entries:['You have Advantage on Intelligence, Wisdom, and Charisma saving throws.']}]};
  const e=a.buildDerivedEffects(baseCharacter(),baseDerived({speciesObj:species}),[]);
  assert.deepEqual([...e.savingThrowAdvantages].sort(),['cha','int','wis']);
});
add('Dwarven Toughness adds one HP per level', () => {
  const species={name:'Dwarf',source:'XPHB',entries:[{name:'Dwarven Toughness',entries:['Your Hit Point maximum increases by 1, and it increases by 1 again whenever you gain a level.']}]};
  const e=a.buildDerivedEffects(baseCharacter({level:7}),baseDerived({speciesObj:species,level:7}),[]);
  assert.equal(e.hpPerLevel,1);
});
add('Dwarven Resilience grants Poison resistance', () => {
  const species={name:'Dwarf',source:'XPHB',entries:[{name:'Dwarven Resilience',entries:['You have Resistance to Poison damage.']}]};
  const e=a.buildDerivedEffects(baseCharacter(),baseDerived({speciesObj:species}),[]);
  assert.ok(e.resistances.includes('Poison'));
});
add('Tough adds two HP per level', () => {
  const feat={name:'Tough',source:'XPHB',entries:[]};
  const e=a.buildDerivedEffects(baseCharacter({level:5}),baseDerived({level:5}),[feat]);
  assert.equal(e.hpPerLevel,2);
});
add('2024 Alert adds the proficiency bonus to initiative', () => {
  const feat={name:'Alert',source:'XPHB',entries:[]};
  const e=a.buildDerivedEffects(baseCharacter({level:9}),baseDerived({level:9}),[feat]);
  assert.equal(e.initiativeBonus,4);
});
add('legacy Alert is not treated as the 2024 Alert implementation', () => {
  const feat={name:'Alert',source:'PHB',entries:[]};
  const e=a.buildDerivedEffects(baseCharacter({level:9}),baseDerived({level:9}),[feat]);
  assert.equal(e.initiativeBonus,0);
});
add('Dual Wielder activates its sheet flag', () => {
  const feat={name:'Dual Wielder',source:'XPHB',entries:[]};
  const e=a.buildDerivedEffects(baseCharacter(),baseDerived(),[feat]);
  assert.equal(e.flags.has('dualWielder'),true);
});
add('Defense fighting style adds armored AC bonus', () => {
  const feature={name:'Defense',source:'XPHB',entries:[]};
  const e=a.buildDerivedEffects(baseCharacter(),baseDerived({optionalFeatureObjects:[feature]}),[]);
  assert.equal(e.acBonusWhileArmored,1);
});
add('Archery fighting style adds ranged attack bonus', () => {
  const feature={name:'Archery',source:'XPHB',entries:[]};
  const e=a.buildDerivedEffects(baseCharacter(),baseDerived({optionalFeatureObjects:[feature]}),[]);
  assert.equal(e.attackBonuses.ranged,2);
});
add('Dueling fighting style adds its damage flag', () => {
  const feature={name:'Dueling',source:'XPHB',entries:[]};
  const e=a.buildDerivedEffects(baseCharacter(),baseDerived({optionalFeatureObjects:[feature]}),[]);
  assert.equal(e.damageBonuses.dueling,2);
});
add('Thrown Weapon Fighting adds thrown damage', () => {
  const feature={name:'Thrown Weapon Fighting',source:'XPHB',entries:[]};
  const e=a.buildDerivedEffects(baseCharacter(),baseDerived({optionalFeatureObjects:[feature]}),[]);
  assert.equal(e.damageBonuses.thrown,2);
});
add('Blind Fighting grants Blindsight', () => {
  const feature={name:'Blind Fighting',source:'XPHB',entries:[]};
  const e=a.buildDerivedEffects(baseCharacter(),baseDerived({optionalFeatureObjects:[feature]}),[]);
  assert.ok(e.senses.includes('Blindsight 10 ft.'));
});
add('Fast Movement activates its conditional flag', () => {
  const feature={name:'Fast Movement',source:'XPHB',entries:[]};
  const e=a.buildDerivedEffects(baseCharacter(),baseDerived({classFeatures:[feature]}),[]);
  assert.equal(e.flags.has('fastMovement'),true);
});
add('Barbarian Unarmored Defense is represented in effects', () => {
  const e=a.buildDerivedEffects(baseCharacter(),baseDerived({classObj:{name:'Barbarian'}}),[]);
  assert.deepEqual(JSON.parse(JSON.stringify(e.acFormulas[0].abilities)),['dex','con']);
});
add('Monk Unarmored Defense is represented in effects', () => {
  const e=a.buildDerivedEffects(baseCharacter(),baseDerived({classObj:{name:'Monk'}}),[]);
  assert.deepEqual(JSON.parse(JSON.stringify(e.acFormulas[0].abilities)),['dex','wis']);
});
add('textual save Advantage parsing recognizes exact named abilities', () => {
  const e={savingThrowAdvantages:new Set(),active:[]};
  a.applyTextualRulesEffects('You have Advantage on Strength and Dexterity saving throws.',e,'Test');
  assert.deepEqual([...e.savingThrowAdvantages].sort(),['dex','str']);
});
add('selected feat save proficiency changes derived saving throws', () => {
  const feat={name:'Save Feat',source:'XPHB',savingThrowProficiencies:[{choose:{from:['wisdom','charisma']}}]};
  const key=featChoiceKey('Save Feat','XPHB');
  const c=baseCharacter({featSaveChoices:{[key]:'cha'}});
  const e=a.buildDerivedEffects(c,baseDerived(),[feat]);
  assert.ok(e.savingThrows.has('cha'));
});
add('selected feat skill proficiency grants a new skill', () => {
  const feat={name:'Skill Feat',source:'XPHB',skillProficiencies:[{choose:{from:['arcana','stealth']}}]};
  const key=featChoiceKey('Skill Feat','XPHB');
  const c=baseCharacter({featSkillChoices:{[key]:'arcana'}});
  const e=a.buildDerivedEffects(c,baseDerived(),[feat]);
  assert.ok(e.skills.has('arcana'));
});
add('selected feat skill on an existing proficiency becomes expertise', () => {
  const feat={name:'Skill Feat',source:'XPHB',skillProficiencies:[{choose:{from:['arcana','stealth']}}]};
  const key=featChoiceKey('Skill Feat','XPHB');
  const c=baseCharacter({featSkillChoices:{[key]:'arcana'}});
  const e=a.buildDerivedEffects(c,baseDerived({skillProficiencies:new Set(['arcana'])}),[feat]);
  assert.ok(e.expertise.has('arcana'));
});
add('mixed feat choices support skill, tool, and language selections', () => {
  const feat={name:'Mixed',source:'XPHB',skillToolLanguageProficiencies:[
    {choose:{from:['anySkill'],count:1}},
    {choose:{from:['anyTool'],count:1}},
    {choose:{from:['anyStandard'],count:1}},
  ]};
  const specs=a.featMixedChoiceSpecs(feat);
  const c=baseCharacter({featMixedChoices:{
    [specs[0].key]:'Skill:arcana',
    [specs[1].key]:'Tool:Smith Tools',
    [specs[2].key]:'Language:Common',
  }});
  const e=a.buildDerivedEffects(c,baseDerived(),[feat]);
  assert.ok(e.skills.has('arcana'));
  assert.ok(e.tools.includes('Smith Tools'));
  assert.ok(e.languages.includes('Common'));
});

/* 143–152: resources and recovery metadata */
add('resource recharge label recognizes short rest', () => {
  assert.equal(a.resourceRechargeLabel('short rest'),'short');
});
add('resource recharge label recognizes long rest', () => {
  assert.equal(a.resourceRechargeLabel('long rest'),'long');
});
add('resource recharge label recognizes both', () => {
  assert.equal(a.resourceRechargeLabel('short or long rest'),'both');
});
add('resource recharge label merges short and long arrays', () => {
  assert.equal(a.resourceRechargeLabel(['short rest','long rest']),'both');
});
add('resource recharge label treats daily as long-rest recovery', () => {
  assert.equal(a.resourceRechargeLabel('daily'),'long');
});
add('resource recharge label rejects unrelated text', () => {
  assert.equal(a.resourceRechargeLabel('whenever the moon is full'),'');
});
add('feature recovery parser recognizes short-rest recovery', () => {
  const f={entries:['You regain all expended uses when you finish a Short Rest.']};
  assert.equal(a.featureRechargeDetails(f).recharge,'short');
});
add('feature recovery parser recognizes long-rest recovery', () => {
  const f={entries:['You regain all expended uses when you finish a Long Rest.']};
  assert.equal(a.featureRechargeDetails(f).recharge,'long');
});
add('feature recovery parser recognizes short-or-long recovery', () => {
  const f={entries:['You can use this feature again after you finish a Short or Long Rest.']};
  assert.equal(a.featureRechargeDetails(f).recharge,'both');
});
add('feature use inference recognizes proficiency-bonus-sized resources', () => {
  const f={entries:['You can use this feature a number of times equal to your Proficiency Bonus. You regain all expended uses when you finish a Long Rest.']};
  assert.equal(a.inferFeatureUseMaxFromText(f,{pb:4,mods:{},level:9}),4);
});

/* 153–157: HP damage/healing/death state */
add('damage is absorbed by temporary HP before real HP', () => withState(() => {
  a.state.character.hpCurrent=10;
  a.state.character.tempHp=5;
  a.applyDamage(3,10);
  assert.equal(a.state.character.tempHp,2);
  assert.equal(a.state.character.hpCurrent,10);
}));
add('damage spills past temporary HP into real HP', () => withState(() => {
  a.state.character.hpCurrent=10;
  a.state.character.tempHp=3;
  a.applyDamage(5,10);
  assert.equal(a.state.character.tempHp,0);
  assert.equal(a.state.character.hpCurrent,8);
}));
add('damage clamps real HP at zero', () => withState(() => {
  a.state.character.hpCurrent=2;
  a.applyDamage(50,10);
  assert.equal(a.state.character.hpCurrent,0);
}));
add('healing clamps at maximum HP', () => withState(() => {
  a.state.character.hpCurrent=9;
  a.applyHealing(5,10);
  assert.equal(a.state.character.hpCurrent,10);
}));
add('healing from zero HP resets death saves', () => withState(() => {
  a.state.character.hpCurrent=0;
  a.state.character.deathSaves={success:2,failure:1};
  a.applyHealing(1,10);
  assert.deepEqual(JSON.parse(JSON.stringify(a.state.character.deathSaves)),{success:0,failure:0});
}));

assert.ok(cases.length >= 157, 'The core regression matrix must retain at least the original 157 cases.');

for (const [name, fn] of cases) test(name, fn);
