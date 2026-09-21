import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const LOCK=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/5etools-version.json'),'utf8'));
const DATA=path.join(ROOT,'tests/.cache',LOCK.version,'data');
const SPELLS=JSON.parse(fs.readFileSync(path.join(DATA,'spells/spells-xphb.json'),'utf8'));
const LOOKUP=JSON.parse(fs.readFileSync(path.join(DATA,'generated/gendata-spell-source-lookup.json'),'utf8'));
const FEATS=JSON.parse(fs.readFileSync(path.join(DATA,'feats.json'),'utf8')).feat.filter(x=>x.source==='XPHB');
const classIndex=JSON.parse(fs.readFileSync(path.join(DATA,'class/index.json'),'utf8'));
const classes=[];
const subclasses=[];
for(const file of Object.values(classIndex)){
  const json=JSON.parse(fs.readFileSync(path.join(DATA,'class',file),'utf8'));
  classes.push(...(json.class||[]).filter(x=>x.source==='XPHB'));
  subclasses.push(...(json.subclass||[]).filter(x=>x.source==='XPHB'));
}

const a=loadAppTestContext();
function setup(){
  resetState(a);
  a.state.data.spells={spell:SPELLS.spell};
  a.state.data.spellSourceLookup=LOOKUP;
  a.state.character=a.emptyCharacter();
}
function cls(name){return classes.find(x=>x.name===name);}
function sub(name){return subclasses.find(x=>x.name===name||x.shortName===name);}
function feat(name){return FEATS.find(x=>x.name===name);}
function spell(name){return SPELLS.spell.find(x=>x.name===name);}
function derived(className,level,subclassName=null){
  const classObj=cls(className),subclassObj=subclassName?sub(subclassName):null;
  const d={classObj,subclassObj,level,spellcastingSource:null,spellSlots:[],cantrips:null,maxPrepared:null};
  d.spellcastingSource=a.spellcastingSource(d);
  d.spellSlots=a.classSpellSlots(d.spellcastingSource,level);
  d.cantrips=a.classCantrips(d.spellcastingSource,level);
  d.maxPrepared=a.classPrepared(d.spellcastingSource,level,{int:3,wis:3,cha:3});
  d.alwaysPreparedSpells=[];
  return d;
}

test('every XPHB spell has a pinned source-lookup record',()=>{
  const missing=SPELLS.spell.filter(s=>!a.spellLookupEntry(s,LOOKUP)).map(s=>s.name);
  assert.deepEqual(missing,[]);
});

test('class spell lookup allows only printed PHB class lists',()=>{
  setup();
  assert.equal(a.spellAvailableToClassName(spell('Fireball'),'Wizard',LOOKUP),true);
  assert.equal(a.spellAvailableToClassName(spell('Fireball'),'Sorcerer',LOOKUP),true);
  assert.equal(a.spellAvailableToClassName(spell('Fireball'),'Cleric',LOOKUP),false);
  assert.equal(a.spellAvailableToClassName(spell('Cure Wounds'),'Cleric',LOOKUP),true);
  assert.equal(a.spellAvailableToClassName(spell('Cure Wounds'),'Wizard',LOOKUP),false);
});

test('subclass lookup grants subclass spells without widening the base class list',()=>{
  setup();
  assert.equal(a.spellAvailableToCharacter(spell('Fireball'),derived('Cleric',5,'Light Domain')),true);
  assert.equal(a.spellAvailableToCharacter(spell('Fireball'),derived('Cleric',5,'Life Domain')),false);
  assert.equal(a.spellAvailableToCharacter(spell('Fireball'),derived('Fighter',13,'Eldritch Knight')),true);
});

test('Eldritch Knight and Arcane Trickster use subclass spellcasting progressions',()=>{
  for(const [className,subclassName] of [['Fighter','Eldritch Knight'],['Rogue','Arcane Trickster']]){
    const d=derived(className,3,subclassName);
    assert.equal(d.spellcastingSource.shortName,subclassName);
    assert.deepEqual([...d.spellSlots],[2,0,0,0]);
    assert.equal(d.cantrips,2);
    assert.equal(d.maxPrepared,3);
  }
});

test('spell level selection is capped by the character current slots',()=>{
  setup();
  const low=derived('Wizard',1),high=derived('Wizard',5);
  a.state.character.spellbook=['Fireball|XPHB'];
  assert.equal(a.spellSelectionAllowed(spell('Fireball'),'preparedSpells',low,a.state.character),false);
  assert.equal(a.spellSelectionAllowed(spell('Fireball'),'preparedSpells',high,a.state.character),true);
});

test('Wizard preparation requires the spell to be in the spellbook',()=>{
  setup();
  const d=derived('Wizard',5);
  assert.equal(a.usesWizardSpellbook(d),true);
  assert.equal(a.spellSelectionAllowed(spell('Fireball'),'preparedSpells',d,a.state.character),false);
  assert.equal(a.spellSelectionAllowed(spell('Fireball'),'spellbook',d,a.state.character),true);
  a.state.character.spellbook=['Fireball|XPHB'];
  assert.equal(a.spellSelectionAllowed(spell('Fireball'),'preparedSpells',d,a.state.character),true);
});

test('non-Wizards cannot put spells in a spellbook collection',()=>{
  setup();
  assert.equal(a.spellSelectionAllowed(spell('Cure Wounds'),'spellbook',derived('Cleric',5),a.state.character),false);
});

test('spell reconciliation removes wrong-list, above-level, duplicate, and excess choices',()=>{
  setup();
  const d=derived('Cleric',1);
  a.state.character.cantrips=['Guidance|XPHB','Guidance|xphb','Fire Bolt|XPHB','Sacred Flame|XPHB','Thaumaturgy|XPHB'];
  a.state.character.preparedSpells=['Cure Wounds|XPHB','Magic Missile|XPHB','Flame Strike|XPHB','Bless|XPHB','Command|XPHB','Guiding Bolt|XPHB'];
  a.reconcileSpellSelections(a.state.character,d);
  assert.deepEqual([...a.state.character.cantrips],['Guidance|XPHB','Sacred Flame|XPHB','Thaumaturgy|XPHB']);
  assert.deepEqual([...a.state.character.preparedSpells],['Cure Wounds|XPHB','Bless|XPHB','Command|XPHB','Guiding Bolt|XPHB']);
});

test('class always-prepared spells unlock at the printed levels',()=>{
  assert.deepEqual([...a.fixedAdditionalSpellRefs(cls('Ranger'),1,'prepared')],["hunter's mark|xphb"]);
  assert.deepEqual([...a.fixedAdditionalSpellRefs(cls('Paladin'),2,'prepared')],['divine smite|xphb']);
  assert.deepEqual([...a.fixedAdditionalSpellRefs(cls('Paladin'),5,'prepared')],['divine smite|xphb','find steed|xphb']);
  assert.deepEqual([...a.fixedAdditionalSpellRefs(cls('Druid'),2,'prepared')],['speak with animals|xphb','find familiar|xphb']);
});

test('subclass always-prepared spells unlock without counting as selected preparations',()=>{
  const light=sub('Light Domain');
  assert.equal(a.fixedAdditionalSpellRefs(light,3,'prepared').includes('fireball|xphb'),false);
  assert.equal(a.fixedAdditionalSpellRefs(light,5,'prepared').includes('fireball|xphb'),true);
});

test('Magic Initiate exposes one list choice, one ability, two cantrips, and one level-1 spell',()=>{
  setup();
  const [spec]=a.featAdditionalSpellChoiceSpecs(feat('Magic Initiate'),1);
  assert.deepEqual([...spec.names],['Cleric Spells','Druid Spells','Wizard Spells']);
  assert.deepEqual([...spec.abilityFrom],['int','wis','cha']);
  const cleric=spec.groups.find(x=>x.name==='Cleric Spells');
  assert.deepEqual(Array.from(cleric.choices,x=>[x.kind,x.count,x.filter.levels[0]]),[['known',2,0],['innate',1,1]]);
});

test('Magic Initiate spell options obey the selected class list',()=>{
  setup();
  const [spec]=a.featAdditionalSpellChoiceSpecs(feat('Magic Initiate'),1);
  const cleric=spec.groups.find(x=>x.name==='Cleric Spells');
  const levelOne=cleric.choices.find(x=>x.filter.levels.includes(1));
  const names=new Set(a.featSpellChoiceOptions(levelOne,SPELLS.spell,LOOKUP).map(x=>x.name));
  assert.equal(names.has('Cure Wounds'),true);
  assert.equal(names.has('Magic Missile'),false);
});

test('Fey-Touched and Shadow-Touched retain fixed spells and school filters',()=>{
  for(const [name,fixed,schools] of [['Fey-Touched','misty step|xphb',['E','D']],['Shadow-Touched','invisibility|xphb',['I','N']]]){
    const [spec]=a.featAdditionalSpellChoiceSpecs(feat(name),4);
    assert.equal(spec.fixedRefs.includes(fixed),true);
    assert.deepEqual([...spec.choices[0].filter.schools],schools);
  }
});

test('Ritual Caster scales its level-1 ritual choices from two to six',()=>{
  const ritual=feat('Ritual Caster');
  assert.equal(a.featAdditionalSpellChoiceSpecs(ritual,1)[0].choices.reduce((n,x)=>n+x.count,0),2);
  assert.equal(a.featAdditionalSpellChoiceSpecs(ritual,5)[0].choices.reduce((n,x)=>n+x.count,0),3);
  assert.equal(a.featAdditionalSpellChoiceSpecs(ritual,17)[0].choices.reduce((n,x)=>n+x.count,0),6);
  const options=a.featSpellChoiceOptions(a.featAdditionalSpellChoiceSpecs(ritual,1)[0].choices[0],SPELLS.spell,LOOKUP);
  assert.equal(options.every(x=>x.level===1&&x.meta?.ritual),true);
});

test('fighting-style feats expose exactly two cantrip choices from their printed list',()=>{
  for(const [name,className] of [['Blessed Warrior','Cleric'],['Druidic Warrior','Druid']]){
    const [spec]=a.featAdditionalSpellChoiceSpecs(feat(name),2);
    assert.equal(spec.choices.length,1);
    assert.equal(spec.choices[0].count,2);
    assert.deepEqual([...spec.choices[0].filter.levels],[0]);
    assert.deepEqual([...spec.choices[0].filter.classes],[className.toLowerCase()]);
  }
});

test('fixed feat spells are represented even when no picker is required',()=>{
  assert.deepEqual([...a.featGrantedSpellRefs([feat('Telekinetic')],{featSpellChoices:{}},4)],['mage hand|xphb']);
  assert.deepEqual([...a.featGrantedSpellRefs([feat('Telepathic')],{featSpellChoices:{}},4)],['detect thoughts|xphb']);
});

test('selected feat spell picks combine with fixed granted spells without duplicates',()=>{
  setup();
  const f=feat('Fey-Touched'),[spec]=a.featAdditionalSpellChoiceSpecs(f,4),choice=spec.choices[0];
  const character={featSpellChoices:{[spec.key]:{picks:{[choice.key]:['Bless|XPHB']}}}};
  assert.deepEqual([...a.featGrantedSpellRefs([f],character,4)],['misty step|xphb','Bless|XPHB']);
});

test('current schema migration moves legacy known spells into prepared spells once',()=>{
  const migrated=a.migrateCharacter({schema:16,knownSpells:['Cure Wounds|XPHB'],preparedSpells:['Bless|XPHB']});
  assert.equal(migrated.schema,18);
  assert.deepEqual([...migrated.preparedSpells],['Bless|XPHB','Cure Wounds|XPHB']);
  assert.deepEqual([...migrated.knownSpells],[]);
});
