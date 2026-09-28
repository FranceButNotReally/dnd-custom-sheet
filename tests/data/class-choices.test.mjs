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

const index=read('class/index.json');
function record(key){
  const file=read('class/'+index[key]);
  return {file, cls:(file.class||[]).find(x=>x.source==='XPHB')};
}
const cleric=record('cleric');
const druid=record('druid');

function specByName(rec,level,name){
  return a.classFeatureChoiceSpecs(rec.file,rec.cls,level).find(x=>x.name===name);
}
function selectedEffect(rec,level,specName,optionName,mods={}){
  const spec=specByName(rec,level,specName);
  assert.ok(spec, specName+' spec missing');
  const c=a.emptyCharacter();
  c.level=level;
  c.classFeatureChoices={[spec.key]:{name:optionName,source:'XPHB'}};
  const selected=a.selectedClassFeatureOptionObjects(c,[spec]);
  assert.equal(selected.length,1,optionName);
  const d={
    classObj:rec.cls,
    classFeatures:[],
    classFeatureOptionObjects:selected,
    subclassFeatures:[],
    optionalFeatureObjects:[],
    speciesObj:null,
    skillProficiencies:new Set(),
    pb:a.proficiencyBonus(level),
    mods:{str:0,dex:0,con:0,int:0,wis:0,cha:0,...mods},
    level,
  };
  return a.buildDerivedEffects(c,d,[]);
}

test('Cleric Divine Order is a persistent level-1 choice',()=>{
  const spec=specByName(cleric,1,'Divine Order');
  assert.ok(spec);
  assert.deepEqual(JSON.parse(JSON.stringify(spec.options.map(x=>x.name).sort())),['Protector','Thaumaturge']);
});

test('Cleric Channel Divinity is not treated as a persistent creation choice',()=>{
  const names=a.classFeatureChoiceSpecs(cleric.file,cleric.cls,2).map(x=>x.name);
  assert.equal(names.includes('Channel Divinity'),false);
});

test('Cleric Blessed Strikes appears at level 7 and not before',()=>{
  assert.equal(Boolean(specByName(cleric,6,'Blessed Strikes')),false);
  const spec=specByName(cleric,7,'Blessed Strikes');
  assert.ok(spec);
  assert.deepEqual(JSON.parse(JSON.stringify(spec.options.map(x=>x.name).sort())),['Divine Strike','Potent Spellcasting']);
});

test('Druid Primal Order is a persistent level-1 choice',()=>{
  const spec=specByName(druid,1,'Primal Order');
  assert.ok(spec);
  assert.deepEqual(JSON.parse(JSON.stringify(spec.options.map(x=>x.name).sort())),['Magician','Warden']);
});

test('Druid Elemental Fury appears at level 7 and not before',()=>{
  assert.equal(Boolean(specByName(druid,6,'Elemental Fury')),false);
  const spec=specByName(druid,7,'Elemental Fury');
  assert.ok(spec);
  assert.deepEqual(JSON.parse(JSON.stringify(spec.options.map(x=>x.name).sort())),['Potent Spellcasting','Primal Strike']);
});

test('Protector grants Martial Weapons and Heavy Armor training',()=>{
  const e=selectedEffect(cleric,1,'Divine Order','Protector');
  assert.ok(e.weaponProficiencies.includes('Martial Weapons'));
  assert.ok(e.armorProficiencies.includes('Heavy Armor'));
});

test('Thaumaturge grants an extra cantrip and Wisdom-based Arcana/Religion bonus',()=>{
  const e=selectedEffect(cleric,1,'Divine Order','Thaumaturge',{wis:3});
  assert.equal(e.cantripBonus,1);
  assert.equal(e.skillBonuses.arcana,3);
  assert.equal(e.skillBonuses.religion,3);
});

test('Thaumaturge skill bonus has a minimum of +1',()=>{
  const e=selectedEffect(cleric,1,'Divine Order','Thaumaturge',{wis:-2});
  assert.equal(e.skillBonuses.arcana,1);
  assert.equal(e.skillBonuses.religion,1);
});

test('Warden grants Martial Weapons and Medium Armor training',()=>{
  const e=selectedEffect(druid,1,'Primal Order','Warden');
  assert.ok(e.weaponProficiencies.includes('Martial Weapons'));
  assert.ok(e.armorProficiencies.includes('Medium Armor'));
});

test('Magician grants an extra cantrip and Wisdom-based Arcana/Nature bonus',()=>{
  const e=selectedEffect(druid,1,'Primal Order','Magician',{wis:4});
  assert.equal(e.cantripBonus,1);
  assert.equal(e.skillBonuses.arcana,4);
  assert.equal(e.skillBonuses.nature,4);
});

test('selected Blessed Strikes option becomes a derived class feature',()=>{
  const divine=selectedEffect(cleric,7,'Blessed Strikes','Divine Strike');
  assert.equal(divine.flags.has('divinestrike'),true);
  const potent=selectedEffect(cleric,7,'Blessed Strikes','Potent Spellcasting');
  assert.equal(potent.flags.has('potentspellcasting'),true);
});

test('selected Elemental Fury option becomes a derived class feature',()=>{
  const primal=selectedEffect(druid,7,'Elemental Fury','Primal Strike');
  assert.equal(primal.flags.has('primalstrike'),true);
  const potent=selectedEffect(druid,7,'Elemental Fury','Potent Spellcasting');
  assert.equal(potent.flags.has('potentspellcasting'),true);
});

test('class choice reconciliation removes invalid and level-ineligible selections',()=>{
  const l7=a.classFeatureChoiceSpecs(cleric.file,cleric.cls,7);
  const blessed=l7.find(x=>x.name==='Blessed Strikes');
  const c=a.emptyCharacter();
  c.classFeatureChoices={
    [blessed.key]:{name:'Divine Strike',source:'XPHB'},
    bogus:{name:'Imaginary Option',source:'XPHB'},
  };
  a.reconcileClassFeatureChoices(c,l7);
  assert.ok(c.classFeatureChoices[blessed.key]);
  assert.equal(c.classFeatureChoices.bogus,undefined);

  const l6=a.classFeatureChoiceSpecs(cleric.file,cleric.cls,6);
  a.reconcileClassFeatureChoices(c,l6);
  assert.equal(c.classFeatureChoices[blessed.key],undefined);
});

test('invalid option values are removed rather than silently defaulted',()=>{
  const spec=specByName(druid,1,'Primal Order');
  const c=a.emptyCharacter();
  c.classFeatureChoices={[spec.key]:{name:'Not an Order',source:'XPHB'}};
  a.reconcileClassFeatureChoices(c,[spec]);
  assert.equal(c.classFeatureChoices[spec.key],undefined);
});
