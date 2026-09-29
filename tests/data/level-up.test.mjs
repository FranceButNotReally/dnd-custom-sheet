import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const version=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/5etools-version.json'),'utf8')).version;
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'tests/.cache',version,'data',name),'utf8'));
const index=read('class/index.json');
const a=loadAppTestContext();
resetState(a);
const file=name=>read(`class/${index[name.toLowerCase()]}`);
function context(name,level,overrides={}) {
  const classFile=file(name),classObj=classFile.class.find(x=>x.name===name&&x.source==='XPHB');
  const c=a.emptyCharacter();c.creationPending=false;c.class={name,source:'XPHB'};c.subclass=level>=3?{name:'Champion',source:'XPHB'}:null;c.level=level;
  Object.assign(c,overrides);
  return {c,d:{classFile,classObj,subclassObj:null,spellcastingSource:classObj,mods:{con:2},pb:a.proficiencyBonus(level),maxHp:a.defaultMaxHp(classObj,level,2,null,c.hpLevelRolls),effects:{hpPerLevel:0},optionalFeatureSpecs:[],classFeatureChoiceSpecs:[],progressionFeatSlots:[]}};
}

test('level-up preview uses actual class progression across feature, feat, spell, and proficiency boundaries',()=>{
  const fighter=context('Fighter',4);
  const next=a.levelUpPreview(fighter.c,fighter.d);
  assert.equal(next.to,5);
  assert.equal(next.proficiencyAfter,3);
  assert.ok(next.newClassFeatures.some(feature=>feature.name==='Extra Attack'));
  const feat=a.levelUpPreview(context('Fighter',3).c,context('Fighter',3).d);
  assert.ok(feat.newFeatSlots.some(spec=>spec.name==='Ability Score Improvement'));
  const wizard=context('Wizard',2);
  const spells=a.levelUpPreview(wizard.c,wizard.d);
  assert.equal(spells.needsSubclass,true);
  assert.ok(spells.slotsAfter.some((count,i)=>count>(spells.slotsBefore[i]||0)));
  assert.equal(a.levelUpPreview(context('Fighter',20).c,context('Fighter',20).d),null);
});

test('fixed and rolled hit points survive leveling, later Constitution changes, and migration',()=>{
  const {c,d}=context('Fighter',1);
  const first=a.levelUpPreview(c,d);
  assert.equal(first.fixedHp,8);
  a.applyLevelUp(c,d,first,{mode:'rolled',roll:4});
  assert.equal(c.level,2);
  assert.equal(c.hpLevelRolls[2],4);
  assert.equal(a.defaultMaxHp(d.classObj,2,2,null,c.hpLevelRolls),18);
  assert.equal(a.defaultMaxHp(d.classObj,2,3,null,c.hpLevelRolls),20);
  const migrated=a.migrateCharacter(JSON.parse(JSON.stringify(c)));
  assert.equal(migrated.hpLevelRolls[2],4);
  assert.equal(migrated.pendingLevelUp.to,2);
  assert.throws(()=>a.applyLevelUp(c,d,first,{mode:'fixed'}),/out of date/);
  const second=a.levelUpPreview(c,{...d,maxHp:18,pb:2});
  a.applyLevelUp(c,d,second,{mode:'fixed'});
  assert.equal(c.level,3);
  assert.equal(a.defaultMaxHp(d.classObj,3,2,null,c.hpLevelRolls),26);
  assert.equal(c.hpLevelRolls[3],undefined);
});

test('level-up preserves damage, zero HP, manual maxima, and warns of unfinished feat choices',()=>{
  const {c,d}=context('Fighter',3,{hpAuto:false,hpCurrent:10,hpMaxOverride:29});
  d.maxHp=29;
  const preview=a.levelUpPreview(c,d);
  assert.throws(()=>a.applyLevelUp(c,d,preview,{mode:'rolled',roll:11}),/between 1 and 10/);
  assert.equal(c.level,3);
  a.applyLevelUp(c,d,preview,{mode:'fixed'});
  assert.equal(c.hpCurrent,18);
  assert.equal(c.hpMaxOverride,37);
  const spec=preview.newFeatSlots.find(s=>s.name==='Ability Score Improvement');
  const checklist=a.levelUpChecklist(c,{...d,progressionFeatSlots:preview.newFeatSlots});
  assert.ok(checklist.some(task=>task.label.includes('Ability Score Improvement')&&!task.done));
  c.progressionFeats[spec.key]={name:'Ability Score Improvement',source:'XPHB'};
  assert.ok(a.levelUpChecklist(c,{...d,progressionFeatSlots:preview.newFeatSlots}).every(task=>!task.required||task.done));
  const dying=context('Fighter',1,{hpAuto:false,hpCurrent:0});
  a.applyLevelUp(dying.c,dying.d,a.levelUpPreview(dying.c,dying.d),{mode:'fixed'});
  assert.equal(dying.c.hpCurrent,0);
});

test('ASI level-up stays unfinished until its pattern and ability picks are recorded',()=>{
  a.state.data.feats=read('feats.json');
  const {c,d}=context('Fighter',3);
  a.applyLevelUp(c,d,a.levelUpPreview(c,d),{mode:'fixed'});
  d.progressionFeatSlots=a.progressionFeatSlots(d.classObj,4);
  for(const spec of d.progressionFeatSlots.filter(s=>s.name!=='Ability Score Improvement')) c.progressionFeats[spec.key]={name:'Archery',source:'XPHB'};
  const slot=d.progressionFeatSlots.find(s=>s.name==='Ability Score Improvement');
  c.progressionFeats[slot.key]={name:'Ability Score Improvement',source:'XPHB'};
  d.featObjs=a.selectedFeatObjects(c);
  let tasks=a.levelUpChecklist(c,d);
  assert.ok(tasks.some(t=>t.control==='data-feat-ability-mode'&&!t.done));
  const asi=d.featObjs.find(a.isAbilityScoreImprovementFeat);
  const modeKey=a.featInstanceKey(asi);
  c.featAbilityModes[modeKey]='split';
  d.featObjs=a.selectedFeatObjects(c);
  tasks=a.levelUpChecklist(c,d);
  assert.equal(tasks.filter(t=>t.control==='data-feat-ability'&&!t.done).length,2);
  const choices=a.featAbilitySpecs(d.featObjs.find(a.isAbilityScoreImprovementFeat));
  c.featAbilityChoices[a.featSpecKey(d.featObjs.find(a.isAbilityScoreImprovementFeat),choices[0])]='str';
  assert.equal(a.levelUpChecklist(c,d).filter(t=>t.required&&!t.done).length,1);
  c.featAbilityChoices[a.featSpecKey(d.featObjs.find(a.isAbilityScoreImprovementFeat),choices[1])]='dex';
  assert.ok(a.levelUpChecklist(c,d).filter(t=>t.required).every(t=>t.done));
});

test('Wizard spellbook guidance counts new spells separately from existing and Savant spells after migration',()=>{
  const {c,d}=context('Wizard',1,{spellbook:['Shield|XPHB']});
  a.applyLevelUp(c,d,a.levelUpPreview(c,d),{mode:'fixed'});
  const saved=a.migrateCharacter(JSON.parse(JSON.stringify(c)));
  assert.deepEqual(JSON.parse(JSON.stringify(saved.pendingLevelUp.spellbookBefore)),['Shield|XPHB']);
  d.maxPrepared=5;
  let task=a.levelUpChecklist(saved,d).find(t=>t.spellTab==='spellbook');
  assert.equal(task.done,false);
  saved.spellbook.push('Magic Missile|XPHB','Detect Magic|XPHB');
  task=a.levelUpChecklist(saved,d).find(t=>t.spellTab==='spellbook');
  assert.equal(task.done,true);
  assert.ok(task.detail.includes('Savant spells are additional'));
  assert.ok(a.levelUpChecklist(saved,d).some(t=>t.spellTab==='prepared'));
});
