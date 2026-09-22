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
const a=loadAppTestContext();
resetState(a);

const index=read('class/index.json');
function record(key){
  const data=read('class/'+index[key]);
  return {
    cls:(data.class||[]).find(x=>x.source==='XPHB'),
    features:(data.classFeature||[]).filter(x=>x.classSource==='XPHB')
  };
}
const records=Object.fromEntries(['barbarian','bard','paladin','ranger','rogue'].map(k=>[k,record(k)]));
const feature=(key,name,level=null)=>records[key].features.find(f=>f.name===name&&(level==null||Number(f.level)===level));
const effects=(key,level,names,mods={})=>{
  const d={
    classObj:records[key].cls,
    classFeatures:names.map(name=>feature(key,name)).filter(Boolean),
    subclassFeatures:[],
    optionalFeatureObjects:[],
    speciesObj:null,
    skillProficiencies:new Set(),
    pb:a.proficiencyBonus(level),
    mods:{str:0,dex:0,con:0,int:0,wis:0,cha:0,...mods},
    level,
  };
  const c=a.emptyCharacter(); c.level=level;
  return a.buildDerivedEffects(c,d,[]);
};

test('Barbarian Feral Instinct marks Initiative as advantaged',()=>{
  assert.equal(effects('barbarian',7,['Feral Instinct']).initiativeAdvantage,true);
});

test('Barbarian Danger Sense grants Dexterity saving throw Advantage',()=>{
  const e=effects('barbarian',2,['Danger Sense']);
  assert.ok(e.savingThrowAdvantages.has('dex'));
});

test('Bard Jack of All Trades scales at half proficiency bonus',()=>{
  assert.equal(effects('bard',2,['Jack of All Trades']).unproficientSkillBonus,1);
  assert.equal(effects('bard',9,['Jack of All Trades']).unproficientSkillBonus,2);
});

test('Paladin Aura of Protection adds Charisma modifier to all saves with minimum +1',()=>{
  assert.equal(effects('paladin',6,['Aura of Protection'],{cha:4}).savingThrowBonus,4);
  assert.equal(effects('paladin',6,['Aura of Protection'],{cha:-1}).savingThrowBonus,1);
});

test('Ranger Roving records its conditional speed increase',()=>{
  const e=effects('ranger',6,['Roving']);
  assert.equal(e.flags.has('roving'),true);
});

test('Rogue Slippery Mind adds Wisdom and Charisma save proficiencies',()=>{
  const e=effects('rogue',15,['Slippery Mind']);
  assert.ok(e.savingThrows.has('wis'));
  assert.ok(e.savingThrows.has('cha'));
});
