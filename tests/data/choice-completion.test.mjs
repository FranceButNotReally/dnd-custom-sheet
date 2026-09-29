import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadAppTestContext,resetState} from '../lib/app-context.mjs';
const version=JSON.parse(fs.readFileSync(new URL('../fixtures/5etools-version.json',import.meta.url))).version;
const read=file=>JSON.parse(fs.readFileSync(new URL(`../.cache/${version}/data/${file}`,import.meta.url)));
const a=loadAppTestContext();resetState(a);a.state.data.feats=read('feats.json');
function featContext(name) {
  const c=a.emptyCharacter();c.creationPending=false;c.level=2;c.pendingLevelUp={from:1,to:2};c.feat={name,source:'XPHB'};
  const d={classObj:{name:'Fighter'},featObjs:a.selectedFeatObjects(c)};
  return {c,d,feat:d.featObjs[0]};
}
test('Magic Initiate blocks completion for its list, ability, two cantrips, and spell independently',()=>{
  const {c,d,feat}=featContext('Magic Initiate');
  const spec=a.featAdditionalSpellChoiceSpecs(feat,2)[0];
  let tasks=a.levelUpChecklist(c,d);
  assert.ok(tasks.some(t=>t.control==='data-feat-spell-list'&&!t.done));
  assert.ok(tasks.some(t=>t.control==='data-feat-spell-ability'&&!t.done));
  assert.equal(a.completeCharacterSetup(c,d).complete,false);
  c.featSpellChoices[spec.key]={list:spec.names[0],ability:spec.abilityFrom[0],picks:{}};
  const plan=a.activeFeatSpellPlan(spec,c.featSpellChoices[spec.key]);
  assert.equal(plan.choices.reduce((sum,x)=>sum+x.count,0),3);
  for(const choice of plan.choices) c.featSpellChoices[spec.key].picks[choice.key]=Array.from({length:choice.count},(_,i)=>`Spell ${choice.key} ${i}|XPHB`);
  assert.ok(a.levelUpChecklist(c,d).every(t=>t.done));
  for(const choice of plan.choices) {
    const picks=c.featSpellChoices[spec.key].picks[choice.key];
    c.featSpellChoices[spec.key].picks[choice.key]=picks.slice(1);
    assert.equal(a.completeCharacterSetup(c,d).complete,false);
    assert.ok(c.pendingLevelUp);
    c.featSpellChoices[spec.key].picks[choice.key]=picks;
  }
  assert.equal(a.completeCharacterSetup(c,d).complete,true);
  assert.equal(c.pendingLevelUp,null);
});
test('Skilled requires all three mixed proficiency choices and Resilient uses one linked ability choice',()=>{
  const {c,d,feat}=featContext('Skilled');
  const specs=a.featMixedChoiceSpecs(feat);
  assert.equal(specs.length,3);
  assert.equal(a.levelUpChecklist(c,d).filter(t=>t.control==='data-feat-mixed'&&!t.done).length,3);
  for(const [i,spec]of specs.entries())c.featMixedChoices[spec.key]=`skill:${['arcana','history','religion'][i]}`;
  assert.equal(a.completeCharacterSetup(c,d).complete,true);
  const r=featContext('Resilient');
  assert.equal(a.levelUpChecklist(r.c,r.d).filter(t=>t.control==='data-feat-ability').length,1);
  assert.equal(a.levelUpChecklist(r.c,r.d).filter(t=>t.control==='data-feat-save').length,0);
});
test('draft status persists, while legacy characters are not forced into creation',()=>{
  const draft=a.emptyCharacter();
  const saved=a.migrateCharacter(JSON.parse(JSON.stringify(draft)));
  assert.equal(saved.creationPending,true);
  assert.equal(a.completeCharacterSetup(saved,{}).complete,false);
  assert.ok(a.creationChecklist(saved,{}).some(t=>t.choiceKey==='class'&&!t.done));
  const legacy=a.migrateCharacter({schema:23,name:'Existing'});
  assert.equal(legacy.creationPending,false);
  assert.equal(a.unfinishedCharacter(legacy),false);
});
test('cantrip choices and Wizard additions are required; prepared spells must fill the class table',()=>{
  const {c,d}=featContext('Savage Attacker');d.cantrips=3;d.maxPrepared=5;
  assert.equal(a.completeCharacterSetup(c,d).complete,false);
  c.cantrips=['A|XPHB','B|XPHB','C|XPHB'];
  assert.equal(a.completeCharacterSetup(c,d).complete,false);
  c.preparedSpells=['One|XPHB','Two|XPHB','Three|XPHB','Four|XPHB','Five|XPHB'];
  assert.equal(a.completeCharacterSetup(c,d).complete,true);
  c.pendingLevelUp={from:1,to:2,spellbookBefore:['Shield|XPHB']};d.classObj={name:'Wizard'};
  assert.equal(a.completeCharacterSetup(c,d).complete,false);
  c.spellbook=['Shield|XPHB','Detect Magic|XPHB','Magic Missile|XPHB'];
  assert.equal(a.completeCharacterSetup(c,d).complete,true);
});

test('Musician tool picks are requested once through feat instance controls',()=>{
  const {c,d}=featContext('Musician');
  const tasks=a.levelUpChecklist(c,d);
  assert.equal(tasks.filter(t=>t.control==='data-feat-tool').length,3);
  assert.equal(tasks.filter(t=>t.control==='data-proficiency-choice-slot').length,0);
});

test('missing cached class rules cannot silently complete a pending level-up',()=>{
  const c=a.emptyCharacter();c.creationPending=false;c.level=2;c.class={name:'Wizard',source:'XPHB'};c.pendingLevelUp={from:1,to:2};
  assert.equal(a.completeCharacterSetup(c,{classObj:null}).complete,false);
  assert.ok(c.pendingLevelUp);
  assert.ok(a.levelUpChecklist(c,{classObj:null}).some(t=>t.label==='Load rules for your class'));
});

test('higher-level Wizard creation includes two spellbook additions for every later level',()=>{
  const c=a.emptyCharacter();c.level=3;
  const d={classObj:{name:'Wizard',spellbook:true,spellcastingAbility:'int'},spellcastingSource:{name:'Wizard',spellbook:true}};
  const task=a.creationChecklist(c,d).find(t=>t.spellTab==='spellbook');
  assert.ok(task.label.includes('10 Wizard spells'));
  assert.equal(task.done,false);
});
