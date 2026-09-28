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
  const file=read('class/'+index[key]);
  const cls=(file.class||[]).find(x=>x.source==='XPHB');
  const features=(file.classFeature||[]).filter(x=>x.classSource==='XPHB');
  return {file,cls,features};
}
const records=Object.fromEntries(['barbarian','bard','ranger','rogue','wizard'].map(k=>[k,record(k)]));
const through=(key,level)=>records[key].features.filter(f=>Number(f.level)<=level);
const specs=(key,level)=>a.classFeatureProficiencyChoiceSpecs(records[key].cls,through(key,level));

test('Barbarian Primal Knowledge adds one class-list skill choice at level 3',()=>{
  assert.equal(specs('barbarian',2).length,0);
  const s=specs('barbarian',3);
  assert.equal(s.length,1);
  assert.equal(s[0].kind,'skill');
  assert.equal(s[0].featureName,'Primal Knowledge');
  assert.equal(s[0].from.length,6);
  assert.ok(s[0].from.includes('athletics'));
  assert.ok(s[0].from.includes('survival'));
});

test('Bard Expertise supplies two choices at level 2 and four total by level 9',()=>{
  assert.equal(specs('bard',1).filter(x=>x.kind==='expertise').length,0);
  assert.equal(specs('bard',2).filter(x=>x.kind==='expertise').length,2);
  assert.equal(specs('bard',9).filter(x=>x.kind==='expertise').length,4);
});

test('Ranger Deft Explorer supplies one Expertise and two language choices',()=>{
  const s=specs('ranger',2);
  assert.equal(s.filter(x=>x.featureName==='Deft Explorer'&&x.kind==='expertise').length,1);
  assert.equal(s.filter(x=>x.featureName==='Deft Explorer'&&x.kind==='language').length,2);
});

test('Ranger gains two additional Expertise choices at level 9',()=>{
  const s=specs('ranger',9);
  assert.equal(s.filter(x=>x.kind==='expertise').length,3);
  assert.equal(s.filter(x=>x.kind==='language').length,2);
});

test('Rogue starts with two Expertise choices and one additional-language choice',()=>{
  const s=specs('rogue',1);
  assert.equal(s.filter(x=>x.kind==='expertise').length,2);
  assert.equal(s.filter(x=>x.kind==='language').length,1);
});

test('Rogue has four Expertise choices by level 6',()=>{
  assert.equal(specs('rogue',6).filter(x=>x.kind==='expertise').length,4);
});

test('Wizard Scholar restricts Expertise to the six printed knowledge skills',()=>{
  const s=specs('wizard',2).find(x=>x.featureName==='Scholar');
  assert.ok(s);
  assert.equal(s.kind,'expertise');
  assert.deepEqual(JSON.parse(JSON.stringify(s.from.sort())),['arcana','history','investigation','medicine','nature','religion']);
});

test('selected Primal Knowledge skill becomes a derived proficiency',()=>{
  const s=specs('barbarian',3)[0];
  const c=a.emptyCharacter();
  c.classProficiencyChoices={[s.key]:'perception'};
  const d={classProficiencyChoiceSpecs:[s],skillProficiencies:new Set(),classObj:records.barbarian.cls,classFeatures:[],classFeatureOptionObjects:[],subclassFeatures:[],optionalFeatureObjects:[],speciesObj:null,pb:2,mods:{str:0,dex:0,con:0,int:0,wis:0,cha:0},level:3};
  const e=a.buildDerivedEffects(c,d,[]);
  assert.ok(e.skills.has('perception'));
});

test('selected Expertise applies only to an already proficient skill',()=>{
  const s=specs('bard',2).find(x=>x.kind==='expertise');
  const c=a.emptyCharacter();
  c.classProficiencyChoices={[s.key]:'performance'};
  let d={classProficiencyChoiceSpecs:[s],skillProficiencies:new Set(['performance']),classObj:records.bard.cls,classFeatures:[],classFeatureOptionObjects:[],subclassFeatures:[],optionalFeatureObjects:[],speciesObj:null,pb:2,mods:{str:0,dex:0,con:0,int:0,wis:0,cha:0},level:2};
  assert.ok(a.buildDerivedEffects(c,d,[]).expertise.has('performance'));
  d={...d,skillProficiencies:new Set()};
  assert.equal(a.buildDerivedEffects(c,d,[]).expertise.has('performance'),false);
});

test('Ranger selected languages flow into derived language proficiencies',()=>{
  const langs=specs('ranger',2).filter(x=>x.kind==='language');
  const c=a.emptyCharacter();
  c.classProficiencyChoices={[langs[0].key]:'Elvish',[langs[1].key]:'Giant'};
  const d={classProficiencyChoiceSpecs:langs,skillProficiencies:new Set(),classObj:records.ranger.cls,classFeatures:[],classFeatureOptionObjects:[],subclassFeatures:[],optionalFeatureObjects:[],speciesObj:null,pb:2,mods:{str:0,dex:0,con:0,int:0,wis:0,cha:0},level:2};
  const e=a.buildDerivedEffects(c,d,[]);
  assert.ok(e.languages.includes('Elvish'));
  assert.ok(e.languages.includes('Giant'));
});

test("Rogue Thieves' Cant is an automatic language effect",()=>{
  const feature=through('rogue',1).find(f=>f.name==="Thieves' Cant");
  const c=a.emptyCharacter();
  const d={classProficiencyChoiceSpecs:[],skillProficiencies:new Set(),classObj:records.rogue.cls,classFeatures:[feature],classFeatureOptionObjects:[],subclassFeatures:[],optionalFeatureObjects:[],speciesObj:null,pb:2,mods:{str:0,dex:0,con:0,int:0,wis:0,cha:0},level:1};
  const e=a.buildDerivedEffects(c,d,[]);
  assert.ok(e.languages.includes("Thieves' Cant"));
});

test('class proficiency reconciliation removes invalid and level-ineligible choices',()=>{
  const level9=specs('ranger',9);
  const high=level9.find(x=>x.featureName==='Expertise'&&x.level===9);
  const c=a.emptyCharacter();
  c.classProficiencyChoices={[high.key]:'stealth',bogus:'arcana'};
  a.reconcileClassProficiencyChoices(c,level9);
  assert.equal(c.classProficiencyChoices.bogus,undefined);
  assert.equal(c.classProficiencyChoices[high.key],'stealth');

  const level8=specs('ranger',8);
  a.reconcileClassProficiencyChoices(c,level8);
  assert.equal(c.classProficiencyChoices[high.key],undefined);
});

test('invalid skill selections are removed instead of silently defaulted',()=>{
  const s=specs('barbarian',3)[0];
  const c=a.emptyCharacter();
  c.classProficiencyChoices={[s.key]:'arcana'};
  a.reconcileClassProficiencyChoices(c,[s]);
  assert.equal(c.classProficiencyChoices[s.key],undefined);
});
