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

const schedules={
  barbarian:[4,8,12,16],
  bard:[4,8,12,16],
  cleric:[4,8,12,16],
  druid:[4,8,12,16],
  fighter:[4,6,8,12,14,16],
  monk:[4,8,12,16],
  paladin:[4,8,12,16],
  ranger:[4,8,12,16],
  rogue:[4,8,10,12,16],
  sorcerer:[4,8,12,16],
  warlock:[4,8,12,16],
  wizard:[4,8,12,16],
};

test('every PHB class exposes an ASI/general-feat slot at each printed level',()=>{
  for(const [key,expected] of Object.entries(schedules)){
    const slots=a.progressionFeatSlots(cls(key),20).filter(x=>x.name==='Ability Score Improvement');
    assert.deepEqual(JSON.parse(JSON.stringify(slots.map(x=>x.level))),expected,key);
    assert.equal(new Set(slots.map(x=>x.key)).size,expected.length,key);
  }
});

test('ASI slots do not appear before their class level',()=>{
  assert.equal(a.progressionFeatSlots(cls('wizard'),3).some(x=>x.name==='Ability Score Improvement'),false);
  assert.deepEqual(
    JSON.parse(JSON.stringify(a.progressionFeatSlots(cls('fighter'),6).filter(x=>x.name==='Ability Score Improvement').map(x=>x.level))),
    [4,6]
  );
});

test('two selected ASI feats remain two repeatable feat instances',()=>{
  const slots=a.progressionFeatSlots(cls('wizard'),8).filter(x=>x.name==='Ability Score Improvement');
  const c=a.emptyCharacter();
  c.progressionFeats=Object.fromEntries(slots.map(slot=>[slot.key,{name:'Ability Score Improvement',source:'XPHB'}]));
  const selected=a.selectedFeatObjects(c).filter(a.isAbilityScoreImprovementFeat);
  assert.equal(selected.length,2);
  assert.notEqual(a.featInstanceKey(selected[0]),a.featInstanceKey(selected[1]));
});

test('each ASI instance stores an independent increase pattern and choices',()=>{
  const slots=a.progressionFeatSlots(cls('wizard'),8).filter(x=>x.name==='Ability Score Improvement');
  const c=a.emptyCharacter();
  c.baseStats={str:10,dex:10,con:10,int:10,wis:10,cha:10};
  c.progressionFeats=Object.fromEntries(slots.map(slot=>[slot.key,{name:'Ability Score Improvement',source:'XPHB'}]));

  let selected=a.selectedFeatObjects(c).filter(a.isAbilityScoreImprovementFeat);
  const firstKey=a.featInstanceKey(selected[0]);
  const secondKey=a.featInstanceKey(selected[1]);
  c.featAbilityModes[firstKey]='plus2';
  c.featAbilityModes[secondKey]='split';

  selected=a.selectedFeatObjects(c).filter(a.isAbilityScoreImprovementFeat);
  const first=selected.find(x=>a.featInstanceKey(x)===firstKey);
  const second=selected.find(x=>a.featInstanceKey(x)===secondKey);
  const firstSpecs=a.featAbilitySpecs(first);
  const secondSpecs=a.featAbilitySpecs(second);
  assert.equal(firstSpecs.length,1);
  assert.equal(firstSpecs[0].amount,2);
  assert.equal(secondSpecs.length,2);
  assert.ok(secondSpecs.every(x=>x.amount===1));

  c.featAbilityChoices[a.featSpecKey(first,firstSpecs[0])]='str';
  c.featAbilityChoices[a.featSpecKey(second,secondSpecs[0])]='dex';
  c.featAbilityChoices[a.featSpecKey(second,secondSpecs[1])]='con';
  a.reconcileFeatChoices(c,selected);

  const stats=a.calculateFinalStats(c,null,selected);
  assert.equal(stats.str,12);
  assert.equal(stats.dex,11);
  assert.equal(stats.con,11);
});

test('ASI cannot raise an ability score above 20',()=>{
  const slot=a.progressionFeatSlots(cls('wizard'),4).find(x=>x.name==='Ability Score Improvement');
  const c=a.emptyCharacter();
  c.baseStats={str:19,dex:10,con:10,int:10,wis:10,cha:10};
  c.progressionFeats={[slot.key]:{name:'Ability Score Improvement',source:'XPHB'}};
  let selected=a.selectedFeatObjects(c).filter(a.isAbilityScoreImprovementFeat);
  const key=a.featInstanceKey(selected[0]);
  c.featAbilityModes[key]='plus2';
  selected=a.selectedFeatObjects(c).filter(a.isAbilityScoreImprovementFeat);
  const spec=a.featAbilitySpecs(selected[0])[0];
  c.featAbilityChoices[a.featSpecKey(selected[0],spec)]='str';
  assert.equal(a.calculateFinalStats(c,null,selected).str,20);
});

test('ordinary General feat ability increases cap at 20',()=>{
  const actor=feats.find(x=>x.name==='Actor');
  const c=a.emptyCharacter();
  c.baseStats={str:10,dex:10,con:10,int:10,wis:10,cha:20};
  assert.equal(a.featAbilitySpecs(actor)[0].max,20);
  assert.equal(a.calculateFinalStats(c,null,[actor]).cha,20);
});

test('Epic Boon ability increases honor their explicit cap of 30',()=>{
  const boon=feats.find(x=>x.name==='Boon of Speed');
  const c=a.emptyCharacter();
  c.baseStats={str:20,dex:10,con:10,int:10,wis:10,cha:10};
  const spec=a.featAbilitySpecs(boon)[0];
  assert.equal(spec.max,30);
  c.featAbilityChoices[a.featSpecKey(boon,spec)]='str';
  assert.equal(a.calculateFinalStats(c,null,[boon]).str,21);
});

test('an ASI with no selected pattern grants no hidden ability increase',()=>{
  const asi=feats.find(x=>x.name==='Ability Score Improvement');
  const instance={...asi,_instanceKey:'test-slot',_abilityMode:null};
  assert.equal(a.featAbilitySpecs(instance).length,0);
  const c=a.emptyCharacter();
  c.baseStats={str:10,dex:10,con:10,int:10,wis:10,cha:10};
  assert.equal(a.calculateFinalStats(c,null,[instance]).str,10);
});

test('changing ASI pattern clears choices from the old pattern',()=>{
  const asi=feats.find(x=>x.name==='Ability Score Improvement');
  const c=a.emptyCharacter();
  let instance={...asi,_instanceKey:'test-slot',_abilityMode:'plus2'};
  const modeKey=a.featInstanceKey(instance);
  c.featAbilityModes[modeKey]='plus2';
  const plus2=a.featAbilitySpecs(instance)[0];
  const oldKey=a.featSpecKey(instance,plus2);
  c.featAbilityChoices[oldKey]='str';
  a.reconcileFeatChoices(c,[instance]);
  assert.equal(c.featAbilityChoices[oldKey],'str');

  c.featAbilityModes[modeKey]='split';
  instance={...asi,_instanceKey:'test-slot',_abilityMode:'split'};
  a.reconcileFeatChoices(c,[instance]);
  assert.equal(c.featAbilityChoices[oldKey],undefined);
});
