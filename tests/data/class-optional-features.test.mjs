import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const LOCK=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/5etools-version.json'),'utf8'));
const DATA=path.join(ROOT,'tests/.cache',LOCK.version,'data');
const read=p=>JSON.parse(fs.readFileSync(path.join(DATA,p),'utf8'));
const a=loadAppTestContext();
resetState(a);

const index=read('class/index.json');
const feats=(read('feats.json').feat||[]).filter(x=>x.source==='XPHB');
const optional=(read('optionalfeatures.json').optionalfeature||[]).filter(x=>x.source==='XPHB');
a.state.data.feats={feat:feats};
a.state.data.optionalfeatures={optionalfeature:optional};

function cls(key){
  const data=read('class/'+index[key]);
  return (data.class||[]).find(x=>x.source==='XPHB');
}
const fighter=cls('fighter');
const paladin=cls('paladin');
const ranger=cls('ranger');
const sorcerer=cls('sorcerer');
const warlock=cls('warlock');
const feat=name=>feats.find(x=>x.name===name);

test('Fighter receives one Fighting Style feat slot at level 1',()=>{
  const slots=a.progressionFeatSlots(fighter,1).filter(x=>x.name==='Fighting Style');
  assert.equal(slots.length,1);
  assert.deepEqual(JSON.parse(JSON.stringify(slots[0].category)),['FS']);
});

test('Paladin and Ranger receive their Fighting Style slots at level 2',()=>{
  const p=a.progressionFeatSlots(paladin,2).find(x=>x.name==='Fighting Style');
  const r=a.progressionFeatSlots(ranger,2).find(x=>x.name==='Fighting Style');
  assert.ok(p);
  assert.ok(r);
  assert.deepEqual(JSON.parse(JSON.stringify(p.category)),['FS','FS:P']);
  assert.deepEqual(JSON.parse(JSON.stringify(r.category)),['FS','FS:R']);
});

test('Paladin Fighting Style categories include Blessed Warrior',()=>{
  const slot=a.progressionFeatSlots(paladin,2).find(x=>x.name==='Fighting Style');
  const available=feats.filter(f=>{
    const cats=Array.isArray(f.category)?f.category:[f.category].filter(Boolean);
    return cats.some(cat=>slot.category.includes(cat));
  });
  assert.ok(available.some(x=>x.name==='Blessed Warrior'));
});

test('Ranger Fighting Style categories include Druidic Warrior',()=>{
  const slot=a.progressionFeatSlots(ranger,2).find(x=>x.name==='Fighting Style');
  const available=feats.filter(f=>{
    const cats=Array.isArray(f.category)?f.category:[f.category].filter(Boolean);
    return cats.some(cat=>slot.category.includes(cat));
  });
  assert.ok(available.some(x=>x.name==='Druidic Warrior'));
});

test('Sorcerer Metamagic remains an optional-feature progression',()=>{
  assert.equal(a.optionalFeatureProgression(sorcerer,2).length,2);
  assert.equal(a.optionalFeatureProgression(sorcerer,10).length,4);
  assert.equal(a.optionalFeatureProgression(sorcerer,17).length,6);
});

test('Warlock Eldritch Invocations remain an optional-feature progression',()=>{
  assert.equal(a.optionalFeatureProgression(warlock,1).length,1);
  assert.equal(a.optionalFeatureProgression(warlock,5).length,5);
  assert.equal(a.optionalFeatureProgression(warlock,20).length,10);
});

function effects(name){
  const c=a.emptyCharacter();
  const d={classObj:null,classFeatures:[],classFeatureOptionObjects:[],classProficiencyChoiceSpecs:[],subclassFeatures:[],optionalFeatureObjects:[],speciesObj:null,skillProficiencies:new Set(),pb:2,mods:{str:0,dex:0,con:0,int:0,wis:0,cha:0},level:1};
  return a.buildDerivedEffects(c,d,[feat(name)]);
}

test('Defense Fighting Style feat gives +1 AC while armored',()=>{
  assert.equal(effects('Defense').acBonusWhileArmored,1);
});

test('Archery Fighting Style feat gives +2 ranged attack rolls',()=>{
  assert.equal(effects('Archery').attackBonuses.ranged,2);
});

test('Dueling Fighting Style feat gives +2 qualifying damage',()=>{
  assert.equal(effects('Dueling').damageBonuses.dueling,2);
});

test('Thrown Weapon Fighting feat gives +2 thrown damage',()=>{
  assert.equal(effects('Thrown Weapon Fighting').damageBonuses.thrown,2);
});

test('Blind Fighting feat gives Blindsight 10 feet',()=>{
  assert.ok(effects('Blind Fighting').senses.includes('Blindsight 10 ft.'));
});

test('non-numeric Fighting Styles retain rule flags for downstream combat handling',()=>{
  for(const [name,flag] of [
    ['Great Weapon Fighting','greatweaponfighting'],
    ['Two-Weapon Fighting','twoweaponfighting'],
    ['Protection','protection'],
    ['Interception','interception'],
    ['Unarmed Fighting','unarmedfighting'],
  ]) assert.equal(effects(name).flags.has(flag),true,name);
});
