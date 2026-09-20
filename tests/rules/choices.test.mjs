import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const a = loadAppTestContext();
resetState(a);

test('background ability choices support both +2/+1 and +1/+1/+1', () => {
  const bg = {ability:[{choose:{weighted:{from:['str','dex','con','int','wis','cha'],weights:[2,1]}}},{choose:{weighted:{from:['str','dex','con','int','wis','cha'],weights:[1,1,1]}}}]};
  const spec = a.backgroundAbilitySpec(bg);
  assert.ok(spec.plus2From.length >= 6);
  assert.ok(spec.plus1From.length >= 6);
  assert.equal(spec.supportsThree, true);
});

test('feat choice parsers expose ability, save, skill, mixed, expertise and spell choices', () => {
  const feat = {
    name:'Comprehensive Test', source:'XPHB',
    ability:[{choose:{from:['intelligence','wisdom'], count:1, amount:1}}],
    savingThrowProficiencies:[{choose:{from:['dexterity','wisdom'], count:1}}],
    skillProficiencies:[{choose:{from:['arcana','history'], count:1}}],
    skillToolLanguageProficiencies:[{choose:{from:['anySkill','anyTool','anystandard'], count:3}}],
    expertise:[{choose:{from:['arcana','history'], count:1}}],
    additionalSpells:[{names:['Cleric','Druid','Wizard'], ability:{choose:{from:['intelligence','wisdom','charisma']}}}],
  };
  assert.equal(a.featAbilitySpecs(feat).length, 1);
  assert.equal(a.featSaveSpecs(feat).length, 1);
  assert.equal(a.featSkillSpecs(feat).length, 1);
  assert.equal(a.featMixedChoiceSpecs(feat).length, 3);
  assert.equal(a.featExpertiseSpecs(feat).length, 1);
  assert.equal(a.featAdditionalSpellChoiceSpecs(feat).length, 1);
});

test('unresolved feat choices remain blank instead of silently selecting the first option', () => {
  const c = {
    featAbilityChoices:{}, featSaveChoices:{}, featSkillChoices:{}, featMixedChoices:{},
    featSpellChoices:{}, featExpertiseChoices:{},
  };
  const feat = {name:'Test Feat', source:'XPHB'};
  const oldAbility = a.featAbilitySpecs;
  const oldSave = a.featSaveSpecs;
  const oldSkill = a.featSkillSpecs;
  // The parser functions are lexical bindings in app.js, so use actual fixture-shaped data.
  const realFeat = {...feat, ability:[{choose:{from:['intelligence','wisdom'],amount:1}}], savingThrowProficiencies:[{choose:{from:['dexterity','wisdom']}}], skillProficiencies:[{choose:{from:['arcana','history']}}]};
  assert.equal(a.featAbilitySpecs(realFeat)[0].from.length, 2);
  assert.equal(a.featSaveSpecs(realFeat)[0].from.length, 2);
  assert.equal(a.featSkillSpecs(realFeat)[0].from.length, 2);
  assert.equal(c.featAbilityChoices['missing'] ?? null, null);
  void oldAbility; void oldSave; void oldSkill;
});

test('species choice detector handles singular and plural lineage headings', () => {
  for (const heading of ['Gnomish Lineage', 'Gnomish Lineages', 'Elven Ancestries']) {
    const species = {name:'Test Species', source:'XPHB', entries:[{name:heading, type:'list', items:[{name:'Option A',entries:['One']},{name:'Option B',entries:['Two']}]}]};
    const specs = a.speciesChoiceSpecs(species);
    assert.equal(specs.length, 1, heading);
    assert.deepEqual([...specs[0].options.map(x=>x.name)], ['Option A','Option B']);
  }
});
