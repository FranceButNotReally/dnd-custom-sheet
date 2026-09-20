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
const races = (read('races.json').race || []).filter(x => x.source === 'XPHB');
const backgrounds = (read('backgrounds.json').background || []).filter(x => x.source === 'XPHB');
const feats = (read('feats.json').feat || []).filter(x => x.source === 'XPHB');
a.state.data.races = {race:races};
a.state.data.backgrounds = {background:backgrounds};
a.state.data.feats = {feat:feats};

const byName = (list, name) => list.find(x => x.name === name);
const baseDerived = speciesObj => ({speciesObj,classObj:null,classFeatures:[],subclassFeatures:[],optionalFeatureObjects:[],skillProficiencies:new Set(),pb:2});
const findChoice = (species, names) => a.speciesChoiceSpecs(species).find(spec => names.every(name => spec.options.some(o => o.name === name)));

test('2024 origins corpus contains all ten PHB species', () => {
  const expected = ['Aasimar','Dragonborn','Dwarf','Elf','Gnome','Goliath','Halfling','Human','Orc','Tiefling'];
  assert.deepEqual(races.map(x => x.name).sort(), expected.sort());
});

test('2024 origins corpus contains all sixteen PHB backgrounds', () => {
  const expected = ['Acolyte','Artisan','Charlatan','Criminal','Entertainer','Farmer','Guard','Guide','Hermit','Merchant','Noble','Sage','Sailor','Scribe','Soldier','Wayfarer'];
  assert.deepEqual(backgrounds.map(x => x.name).sort(), expected.sort());
});

test('all PHB species expose their printed base walking speed', () => {
  const expected = {Aasimar:30,Dragonborn:30,Dwarf:30,Elf:30,Gnome:30,Goliath:35,Halfling:30,Human:30,Orc:30,Tiefling:30};
  for (const species of races) assert.equal(a.dfltSpeed(species), expected[species.name], species.name);
});

test('Dragonborn exposes ten ancestry choices and selected ancestry resistance', () => {
  const species = byName(races,'Dragonborn');
  const spec = findChoice(species,['Black','Blue','Brass','Bronze','Copper','Gold','Green','Red','Silver','White']);
  assert.ok(spec);
  assert.equal(spec.options.length,10);
  const c=a.emptyCharacter(); c.speciesChoices={[spec.key]:{value:'Black'}};
  const e=a.buildDerivedEffects(c,baseDerived(species),[]);
  assert.ok(e.resistances.includes('Acid'));
});

test('Elf exposes lineage and Keen Senses choices', () => {
  const species=byName(races,'Elf');
  const lineage=findChoice(species,['Drow','High Elf','Wood Elf']);
  assert.ok(lineage);
  const keen=a.speciesChoiceSpecs(species).find(x=>x.kind==='skill' && /Keen Senses/i.test(x.label));
  assert.ok(keen);
  assert.deepEqual(JSON.parse(JSON.stringify(keen.options.map(x=>x.value).sort())),['insight','perception','survival']);
});

test('Wood Elf and Drow selected lineage effects are derived', () => {
  const species=byName(races,'Elf');
  const spec=findChoice(species,['Drow','High Elf','Wood Elf']);
  const wood=a.emptyCharacter(); wood.speciesChoices={[spec.key]:{value:'Wood Elf',ability:'wis'}};
  const woodEffects=a.buildDerivedEffects(wood,baseDerived(species),[]);
  assert.equal(woodEffects.speedMinimum,35);
  const drow=a.emptyCharacter(); drow.speciesChoices={[spec.key]:{value:'Drow',ability:'cha'}};
  const drowEffects=a.buildDerivedEffects(drow,baseDerived(species),[]);
  assert.ok(drowEffects.senses.includes('Darkvision 120 ft.'));
});

test('Gnome, Goliath, and Tiefling expose their persistent lineage choices', () => {
  const gnome=findChoice(byName(races,'Gnome'),['Forest Gnome','Rock Gnome']);
  assert.ok(gnome);
  assert.deepEqual(JSON.parse(JSON.stringify(gnome.abilityFrom.sort())),['cha','int','wis']);
  const goliath=findChoice(byName(races,'Goliath'),["Cloud's Jaunt (Cloud Giant)","Fire's Burn (Fire Giant)","Frost's Chill (Frost Giant)","Hill's Tumble (Hill Giant)","Stone's Endurance (Stone Giant)","Storm's Thunder (Storm Giant)"]);
  assert.ok(goliath);
  assert.equal(goliath.options.length,6);
  const tiefling=findChoice(byName(races,'Tiefling'),['Abyssal','Chthonic','Infernal']);
  assert.ok(tiefling);
  assert.deepEqual(JSON.parse(JSON.stringify(tiefling.abilityFrom.sort())),['cha','int','wis']);
});

test('selected Tiefling legacy contributes resistance', () => {
  const species=byName(races,'Tiefling');
  const spec=findChoice(species,['Abyssal','Chthonic','Infernal']);
  const c=a.emptyCharacter(); c.speciesChoices={[spec.key]:{value:'Infernal',ability:'cha'}};
  const e=a.buildDerivedEffects(c,baseDerived(species),[]);
  assert.ok(e.resistances.includes('Fire'));
});

test('Aasimar automatic Celestial Resistance contributes Necrotic and Radiant resistance', () => {
  const species=byName(races,'Aasimar');
  const e=a.buildDerivedEffects(a.emptyCharacter(),baseDerived(species),[]);
  assert.ok(e.resistances.includes('Necrotic'));
  assert.ok(e.resistances.includes('Radiant'));
});

test('Human exposes Skillful and Versatile creation choices', () => {
  const specs=a.speciesChoiceSpecs(byName(races,'Human'));
  const skill=specs.find(x=>x.kind==='skill' && /Skillful/i.test(x.label));
  const feat=specs.find(x=>x.kind==='feat' && /Versatile/i.test(x.label));
  assert.ok(skill);
  assert.equal(skill.options.length,Object.keys(a.SKILLS).length);
  assert.ok(feat);
  assert.ok(feat.options.length>0);
});

test('Elf Keen Senses and Human Skillful choices become derived proficiencies', () => {
  for (const [speciesName,label,value,expected] of [['Elf','Keen Senses','Perception','perception'],['Human','Skillful','Arcana','arcana']]) {
    const species=byName(races,speciesName);
    const spec=a.speciesChoiceSpecs(species).find(x=>x.kind==='skill' && new RegExp(label,'i').test(x.label));
    const c=a.emptyCharacter(); c.speciesChoices={[spec.key]:{value}};
    const e=a.buildDerivedEffects(c,baseDerived(species),[]);
    assert.ok(e.skills.has(expected), speciesName);
  }
});

test('every background supports both PHB ability-increase patterns over exactly three abilities', () => {
  for (const bg of backgrounds) {
    const spec=a.backgroundAbilitySpec(bg);
    assert.equal(spec.supportsThree,true,bg.name);
    assert.equal(spec.plus2From.length,3,bg.name);
    assert.equal(spec.plus1From.length,3,bg.name);
    assert.equal(spec.threeFrom.length,3,bg.name);
  }
});

test('every PHB background grants exactly two skills', () => {
  for (const bg of backgrounds) assert.equal(a.grantedSkillsFromMap(bg.skillProficiencies).length,2,bg.name);
});

test('every PHB background has one tool proficiency or tool choice', () => {
  for (const bg of backgrounds) {
    assert.ok(Array.isArray(bg.toolProficiencies),bg.name);
    assert.equal(bg.toolProficiencies.length,1,bg.name);
  }
});

test('every PHB background resolves exactly one origin feat', () => {
  for (const bg of backgrounds) {
    const refs=a.backgroundFeatNames(bg);
    assert.equal(refs.length,1,bg.name);
    assert.ok(feats.some(f=>f.name.toLowerCase()===refs[0].name.toLowerCase()),bg.name+': '+refs[0].name);
  }
});

test('background tool-choice parsers recognize artisan, instrument, and gaming-set choices', () => {
  for (const name of ['Artisan','Entertainer','Guard']) {
    const specs=a.proficiencyChoiceSpecs(byName(backgrounds,name),'toolProficiencies','background');
    assert.equal(specs.length,1,name);
    assert.equal(specs[0].any,true,name);
  }
});

test('language display includes Common plus two selected Standard Languages', () => {
  resetState(a);
  a.state.character=a.emptyCharacter();
  a.state.character.standardLanguages=['Elvish','Dwarvish'];
  const prof=a.parseProficiencyDisplay(null,null,null,null,true);
  for (const name of ['Common','Elvish','Dwarvish']) assert.ok(prof.languages.includes(name),name);
});
