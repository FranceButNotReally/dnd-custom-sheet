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
const RACES=JSON.parse(fs.readFileSync(path.join(DATA,'races.json'),'utf8')).race.filter(x=>x.source==='XPHB');
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
  a.state.data.feats={feat:FEATS};
  a.state.data.races={race:RACES};
  a.state.character=a.emptyCharacter();
}
function cls(name){return classes.find(x=>x.name===name);}
function sub(name){return subclasses.find(x=>x.name===name||x.shortName===name);}
function feat(name){return FEATS.find(x=>x.name===name);}
function race(name){return RACES.find(x=>x.name===name);}
function spell(name){return SPELLS.spell.find(x=>x.name===name);}
function speciesChoice(species,names){return a.speciesChoiceSpecs(species).find(spec=>names.every(name=>spec.options.some(option=>option.name===name)));}
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

test('species spells unlock by lineage and character level',()=>{
  setup();
  const elf=race('Elf'),elfLineage=speciesChoice(elf,['Drow','High Elf','Wood Elf']);
  const c=a.state.character;
  c.species={name:'Elf',source:'XPHB'};
  c.speciesChoices[elfLineage.key]={value:'Drow',ability:'cha'};
  const at1=new Set(a.speciesGrantedSpellRefs(elf,c,1).map(x=>x.toLowerCase()));
  const at3=new Set(a.speciesGrantedSpellRefs(elf,c,3).map(x=>x.toLowerCase()));
  const at5=new Set(a.speciesGrantedSpellRefs(elf,c,5).map(x=>x.toLowerCase()));
  assert.deepEqual([...at1],['dancing lights|xphb']);
  assert.equal(at3.has('faerie fire|xphb'),true);
  assert.equal(at3.has('darkness|xphb'),false);
  assert.equal(at5.has('darkness|xphb'),true);

  const tiefling=race('Tiefling'),legacy=speciesChoice(tiefling,['Abyssal','Chthonic','Infernal']);
  c.species={name:'Tiefling',source:'XPHB'};
  c.speciesChoices={[legacy.key]:{value:'Infernal',ability:'int'}};
  const infernal=new Set(a.speciesGrantedSpellRefs(tiefling,c,5).map(x=>x.toLowerCase()));
  for(const ref of ['thaumaturgy|xphb','fire bolt|xphb','hellish rebuke|xphb','darkness|xphb']) assert.equal(infernal.has(ref),true,ref);
});

test('automatic and prose-only species spells are represented',()=>{
  setup();
  const c=a.state.character;
  assert.deepEqual(Array.from(a.speciesGrantedSpellRefs(race('Aasimar'),c,1),x=>x.toLowerCase()),['light|xphb']);
  const gnome=race('Gnome'),lineage=speciesChoice(gnome,['Forest Gnome','Rock Gnome']);
  c.speciesChoices={[lineage.key]:{value:'Forest Gnome',ability:'wis'}};
  const forest=new Set(a.speciesGrantedSpellRefs(gnome,c,1).map(x=>x.toLowerCase()));
  assert.equal(forest.has('minor illusion|xphb'),true);
  assert.equal(forest.has('speak with animals|xphb'),true);
});

test('High Elf cantrip choice is validated and joins its automatic spells',()=>{
  setup();
  const elf=race('Elf'),lineage=speciesChoice(elf,['Drow','High Elf','Wood Elf']);
  const c=a.state.character;
  c.speciesChoices={[lineage.key]:{value:'High Elf',ability:'int'}};
  const specs=a.speciesSpellChoiceSpecs(elf,c,3);
  assert.equal(specs.length,1);
  const options=new Set(a.featSpellChoiceOptions(specs[0],SPELLS.spell,LOOKUP).map(x=>x.name));
  assert.equal(options.has('Fire Bolt'),true);
  assert.equal(options.has('Cure Wounds'),false);
  c.speciesSpellChoices[specs[0].key]=['Fire Bolt|XPHB','Cure Wounds|XPHB'];
  a.reconcileSpeciesSpellChoices(c,specs);
  assert.deepEqual([...c.speciesSpellChoices[specs[0].key]],['Fire Bolt|XPHB']);
  const refs=new Set(a.speciesGrantedSpellRefs(elf,c,3).map(x=>x.toLowerCase()));
  assert.equal(refs.has('fire bolt|xphb'),true);
  assert.equal(refs.has('detect magic|xphb'),true);
});

test('feat and species grants create spell tabs for a noncaster without consuming class limits',()=>{
  setup();
  const d={classObj:cls('Fighter'),spellcastingSource:null,maxPrepared:null,cantrips:null,alwaysPreparedSpells:[],alwaysKnownSpells:[],alwaysSpellbookSpells:[],featSpellRefs:['Fire Bolt|XPHB','Magic Missile|XPHB'],speciesSpellRefs:['Light|XPHB']};
  assert.deepEqual([...a.spellPickerTabs(d)],['prepared','cantrips']);
  assert.equal(a.automaticSpellRefsForList('cantrips',d).has('fire bolt|xphb'),true);
  assert.equal(a.automaticSpellRefsForList('cantrips',d).has('light|xphb'),true);
  assert.equal(a.automaticSpellRefsForList('preparedSpells',d).has('magic missile|xphb'),true);
  a.state.character.cantrips=['Fire Bolt|XPHB'];
  a.state.character.preparedSpells=['Magic Missile|XPHB'];
  a.reconcileSpellSelections(a.state.character,d);
  assert.deepEqual([...a.state.character.cantrips],[]);
  assert.deepEqual([...a.state.character.preparedSpells],[]);
});

test('a species-granted Magic Initiate feat carries its spell choices into the spell picker',()=>{
  setup();
  const human=race('Human'),versatile=a.speciesChoiceSpecs(human).find(spec=>spec.kind==='feat');
  const c=a.state.character;
  c.species={name:'Human',source:'XPHB'};
  c.speciesChoices[versatile.key]={value:'Magic Initiate'};
  const selected=a.selectedFeatObjects(c);
  assert.deepEqual(Array.from(selected,x=>x.name),['Magic Initiate']);
  const [spec]=a.featAdditionalSpellChoiceSpecs(selected[0],1),wizard=spec.groups.find(group=>group.name==='Wizard Spells');
  c.featSpellChoices[spec.key]={list:'Wizard Spells',ability:'int',picks:{
    [wizard.choices[0].key]:['Fire Bolt|XPHB','Mage Hand|XPHB'],
    [wizard.choices[1].key]:['Magic Missile|XPHB'],
  }};
  a.reconcileFeatChoices(c,selected);
  const refs=a.featGrantedSpellRefs(selected,c,1);
  assert.deepEqual([...refs],['Fire Bolt|XPHB','Mage Hand|XPHB','Magic Missile|XPHB']);
  assert.deepEqual([...a.spellPickerTabs({maxPrepared:null,cantrips:null,featSpellRefs:refs,speciesSpellRefs:[]})],['prepared','cantrips']);
  assert.equal(a.featResourceSpecs(selected,{pb:2}).filter(resource=>resource.name==='Magic Initiate · Level 1 Free Cast').length,1);
});

test('current schema migration moves legacy known spells into prepared spells once',()=>{
  const migrated=a.migrateCharacter({schema:16,knownSpells:['Cure Wounds|XPHB'],preparedSpells:['Bless|XPHB']});
  assert.equal(migrated.schema,21);
  assert.deepEqual([...migrated.preparedSpells],['Bless|XPHB','Cure Wounds|XPHB']);
  assert.deepEqual([...migrated.knownSpells],[]);
});
