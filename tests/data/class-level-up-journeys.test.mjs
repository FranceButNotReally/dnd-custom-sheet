import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const version=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/5etools-version.json'),'utf8')).version;
const read=file=>JSON.parse(fs.readFileSync(path.join(root,'tests/.cache',version,'data',file),'utf8'));
const keys=['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
const index=read('class/index.json');
const records=keys.map(key=>{const file=read(`class/${index[key]}`);return {key,file,source:'XPHB',cls:file.class.find(x=>x.source==='XPHB'),subs:file.subclass.filter(x=>x.source==='XPHB'&&x.classSource==='XPHB')};});
const artificerFile=read('class/'+index.artificer);
records.push({key:'artificer',source:'EFA',file:artificerFile,cls:artificerFile.class.find(x=>x.source==='EFA'),subs:artificerFile.subclass.filter(x=>x.source==='EFA'&&x.classSource==='EFA')});
const feats={feat:read('feats.json').feat.filter(x=>x.source==='XPHB')},optional={optionalfeature:read('optionalfeatures.json').optionalfeature.filter(x=>x.source==='XPHB')},languages=read('languages.json');
const spells=read('spells/spells-xphb.json');
const races={race:read('races.json').race.filter(x=>x.source==='XPHB')}, backgrounds={background:read('backgrounds.json').background.filter(x=>x.source==='XPHB')};
const itemsBase=read('items-base.json'),items=read('items.json');
const lookup=read('generated/gendata-spell-source-lookup.json');
const equipment={item:loadAppTestContext().mergeItemCatalogs(items,itemsBase).item.filter(x=>x.source==='XPHB')};
const storage=new Map(),a=loadAppTestContext({storage});
const asiLevels={fighter:[4,6,8,12,14,16],rogue:[4,8,10,12,16]};
const copy=x=>JSON.parse(JSON.stringify(x));

// Expectations read printed corpus fields directly, not the functions under test.
function printedFeatures(refs,level,subclass=false) {
  return refs.map(value=>typeof value==='string'?value:value.classFeature||value.subclassFeature).filter(Boolean).map(value=>{
    const parts=value.split('|');return {name:parts[0],level:Number(parts[subclass?5:3])};
  }).filter(value=>value.level<=level).map(x=>`${x.name.toLowerCase()}|${x.level}`).sort();
}
function printedSlots(source,level) {
  if (!source) return [];
  const groups=[...(source.classTableGroups||[]),...(source.subclassTableGroups||[])];
  const spellTable=groups.find(group=>group.rowsSpellProgression);
  if (spellTable) return spellTable.rowsSpellProgression[level-1].slice(0,9);
  if (source.name==='Warlock') {
    const count=level<2?1:level<11?2:level<17?3:4;
    const rank=Math.min(5,Math.ceil(level/2));
    return Array.from({length:9},(_,i)=>i===rank-1?count:0);
  }
  return [];
}
function setup(rec) {
  storage.clear();resetState(a);a.state.data.officialSources.add('EFA');
  Object.assign(a.state.data,{classIndex:index,classFiles:new Map([[rec.key,rec.file]]),feats,optionalfeatures:optional,languages,spells,races,backgrounds,spellSourceLookup:lookup,items:equipment});
  a.state.character=a.emptyCharacter();
  Object.assign(a.state.character,{creationPending:true,species:{name:'Orc',source:'XPHB'},background:{name:'Soldier',source:'XPHB'},backgroundAbility:{mode:'split',plus2:'str',plus1:'dex'},feat:{name:'Savage Attacker',source:'XPHB'},class:{name:rec.cls.name,source:rec.source},baseStats:{str:14,dex:14,con:14,int:14,wis:14,cha:14},hpAuto:false,hpCurrent:rec.cls.hd.faces+2-3,classSkillChoices:a.skillChoiceSpec(rec.cls).from.filter(skill=>!['athletics','intimidation'].includes(skill)).slice(0,a.skillChoiceSpec(rec.cls).count),customSkillProficiencies:Object.keys(a.SKILLS),standardLanguages:['Elvish','Giant'],hitDiceUsed:1});
  return {a,storage};
}
async function chooseSpells(a,d,bookAdditions=0) {
  const c=a.state.character;
  const add=(list,limit)=>{
    for(const spell of (list==='spellbook'?[...spells.spell].sort((x,y)=>y.level-x.level):spells.spell)) {
      const ref=`${spell.name}|${spell.source}`;
      if(c[list].length>=limit)break;
      if(!c[list].includes(ref)&&a.spellSelectionAllowed(spell,list,d,c)&&!a.automaticSpellRefsForList(list,d).has(ref.toLowerCase()))c[list].push(ref);
    }
  };
  if(bookAdditions)add('spellbook',c.spellbook.length+bookAdditions);
  add('cantrips',d.cantrips||0);
  add('preparedSpells',d.maxPrepared||0);
  return a.deriveCharacter();
}
async function resolveChoices(a,d) {
  for(let pass=0;pass<2;pass++) {
    const c=a.state.character;
    for(const spec of d.classFeatureChoiceSpecs) c.classFeatureChoices[spec.key] ||= {name:spec.options[0].name,source:spec.options[0].source};
    for(const spec of d.classProficiencyChoiceSpecs) {
      if(c.classProficiencyChoices[spec.key]) continue;
      const used=new Set(Object.values(c.classProficiencyChoices));
      c.classProficiencyChoices[spec.key]=spec.kind==='language'?languages.language.find(x=>x.source==='XPHB'&&!used.has(x.name)&&!['Common','Elvish','Giant'].includes(x.name)).name:spec.from.find(x=>!used.has(x));
    }
    for(const spec of d.optionalFeatureSpecs) {
      if(c.optionalFeatureChoices[spec.key]) continue;
      const selected=new Set(Object.values(c.optionalFeatureChoices).map(x=>x.name.toLowerCase().replace(/[^a-z0-9]/g,'')));
      const available=a.availableOptionalFeatures(spec).filter(x=>a.optionalFeaturePrerequisiteMet(x,c.level,selected));
      const option=available.find(x=>!Object.values(c.optionalFeatureChoices).some(y=>y.name===x.name)) || available.find(a.optionalFeatureIsRepeatable);
      assert.ok(option,`${c.class.name} level ${c.level}: no valid ${spec.name} option`);
      c.optionalFeatureChoices[spec.key]={name:option.name,source:option.source};
    }
    for(const spec of d.progressionFeatSlots) {
      if(c.progressionFeats[spec.key]) continue;
      const option=feats.feat.filter(x=>x.source==='XPHB').find(x=>x.name===(spec.name==='Ability Score Improvement'?'Ability Score Improvement':spec.name==='Epic Boon'?'Boon of Speed':Object.values(c.progressionFeats).some(f=>f.name==='Archery')?'Defense':'Archery')&&a.featCanSelectForSlot(x,d,c,spec));
      assert.ok(option,`${c.class.name} level ${c.level}: ${spec.name}`);
      c.progressionFeats[spec.key]={name:option.name,source:option.source};
    }
    for(const spec of d.featureFeatChoiceSpecs) {
      const option=spec.options.find(x=>!a.selectedFeatObjects(c).some(y=>y.name===x.name));
      if(!c.featureFeatChoices[spec.key]&&option)c.featureFeatChoices[spec.key]={name:option.name,source:option.source};
    }
    let chosen=a.selectedFeatObjects(c);
    for(const feat of chosen) if(a.isAbilityScoreImprovementFeat(feat)) c.featAbilityModes[a.featInstanceKey(feat)]='plus2';
    chosen=a.selectedFeatObjects(c);
    for(const feat of chosen) for(const spec of a.featAbilitySpecs(feat).filter(x=>!x.fixed)) c.featAbilityChoices[a.featSpecKey(feat,spec)] ||= feat._instanceKey?.includes('level-4')?'con':'str';
    d=await a.deriveCharacter();
    for(const spec of d.featureSpellChoiceSpecs) {
      const record=a.state.character.featureSpellChoices[spec.key] ||= {picks:{}};
      for(const choice of spec.choices) {
        const picks=record.picks[choice.key] ||= [];
        const available=a.featureSpellChoiceOptions(choice);
        for(const spell of available) if(picks.length<choice.count&&!Object.values(record.picks).flat().includes(`${spell.name}|${spell.source}`)) picks.push(`${spell.name}|${spell.source}`);
      }
    }
    // Fill language/tool and mastery choices as a player would before finishing.
    for(const owner of a.proficiencyChoiceOwners(d.classObj,d.backgroundObj,d.speciesObj,d.featObjs)) for(const [obj,prop,key] of [[owner.obj,'languageProficiencies',owner.key],[owner.obj?.startingProficiencies,'languages',`${owner.key}:starting`],[owner.obj,'toolProficiencies',owner.key],[owner.obj?.startingProficiencies,'tools',`${owner.key}:starting`]]) for(const spec of a.proficiencyChoiceSpecs(obj,prop,key)) {
      const values=spec.kind==='language'?a.allLanguageOptionsForChoice(spec):a.allToolOptionsForChoice(spec);
      const slots=a.state.character[spec.kind==='language'?'languageChoiceSlots':'toolChoiceSlots'];
      for(let i=1;i<=spec.count;i++) slots[`${spec.key}:${i}`] ||= values[(i-1)%values.length]?.name;
    }
    if(d.weaponMasteryCount) a.state.character.weaponMasteries=equipment.item.filter(it=>it.weaponCategory&&a.masteryLabel(it)&&a.hasWeaponProficiency(it,d.proficiencies.weapons)).slice(0,d.weaponMasteryCount).map(it=>`${it.name}|${it.source}`);
    d=await a.deriveCharacter();
  }
  return d;
}
function checkClassMechanics(a,d,key,level) {
  const resource=name=>a.state.character.resources.find(r=>r.name===name);
  if(key==='barbarian') {assert.equal(resource('Rage').max,level<3?2:level<6?3:level<12?4:level<17?5:6);assert.equal(d.effects.initiativeAdvantage,level>=7);}
  if(key==='bard') {assert.equal(d.effects.unproficientSkillBonus,level>=2?Math.floor(d.pb/2):0);assert.equal(resource('Bardic Inspiration').recharge,level>=5?'both':'long');}
  if(key==='cleric'&&level>=2) assert.equal(resource('Channel Divinity').max,level<6?2:level<18?3:4);
  if(key==='druid'&&level>=2) assert.equal(resource('Wild Shape').max,level<6?2:level<17?3:4);
  if(key==='fighter') {assert.equal(resource('Second Wind').max,level<4?2:level<10?3:4);if(level>=2)assert.equal(resource('Action Surge').max,level<17?1:2);}
  if(key==='monk'&&level>=2)assert.equal(resource("Monk's Focus").max,level);
  if(key==='paladin') {assert.equal(resource('Lay on Hands').max,level*5);assert.equal(d.effects.savingThrowBonus,level>=6?2:0);}
  if(key==='ranger') {assert.equal(d.movementModes.climb,level>=6?d.speed:null);assert.equal(d.movementModes.swim,level>=6?d.speed:null);}
  if(key==='rogue') {assert.equal(d.savingThrowProficiencies.has('wis'),level>=15);assert.equal(d.savingThrowProficiencies.has('cha'),level>=15);}
  if(key==='sorcerer'&&level>=2)assert.equal(resource('Font of Magic').max,level);
  if(key==='warlock'&&level>=11) {
    const count=[11,13,15,17].filter(boundary=>level>=boundary).length;
    assert.equal(a.state.character.resources.filter(r=>r.name.startsWith('Mystic Arcanum')).length,count);
    assert.equal(d.alwaysPreparedSpells.filter(ref=>a.spellById(ref)?.level>=6).length,count);
  }
  if(key==='wizard') {
    assert.equal(resource('Arcane Recovery').max,1);
    if(level>=18)assert.equal(d.classFeatureSpellChoiceSpecs.find(s=>s.name==='Spell Mastery').choices.length,2);
    if(level===20)assert.equal(a.state.character.resources.filter(r=>r.name.startsWith('Signature Spell')).length,2);
  }
}
async function journey(rec,sub=rec.subs[0]) {
  const {a,storage}=setup(rec);
  let d=await a.deriveCharacter();
  d=await chooseSpells(a,d,rec.key==='wizard'?6:0);
  d=await resolveChoices(a,d);
  d=await chooseSpells(a,d);
  for(const [kind,obj] of [['class',d.classObj],['background',d.backgroundObj]]) for(const group of a.normalizeStartingEquipmentGroups(obj)) await a.applyStartingEquipment(kind,group.group,group.options.at(-1).key,obj);
  d=await a.deriveCharacter();
  const creation=a.creationChecklist(a.state.character,d);
  assert.ok(creation.length>0);
  assert.ok(creation.every(task=>task.done),`${rec.cls.name} creation: ${creation.filter(t=>!t.done).map(t=>t.label)}`);
  assert.equal(a.completeCharacterSetup(a.state.character,d).complete,true);
  const rolls={};
  for(let level=1;level<=20;level++) {
    const label=`${rec.cls.name}/${sub?.name||'class'} level ${level}`;
    if(level>1) {
      const before=d,preview=a.levelUpPreview(a.state.character,d);
      assert.equal(preview.from,level-1,label);assert.equal(preview.to,level,label);
      assert.deepEqual(copy(preview.newClassFeatures.map(x=>`${x.name.toLowerCase()}|${x.level}`).sort()),printedFeatures(rec.cls.classFeatures,level).filter(x=>!printedFeatures(rec.cls.classFeatures,level-1).includes(x)),label);
      assert.equal(preview.needsSubclass,level===3,label);
      assert.equal(preview.spellbookAdded,rec.key==='wizard'?2:0,label);
      const roll=level%2===0?Math.min(level,rec.cls.hd.faces):null;
      if(roll)rolls[level]=roll;
      const spent=new Map(a.state.character.resources.map(r=>[r.id,{spent:Number(r.max)-Number(r.current),current:Number(r.current)}]));
      a.applyLevelUp(a.state.character,d,preview,{mode:roll?'rolled':'fixed',roll});
      await a.saveCharacter();
      // Reload the persisted save before derivation, as browser startup does.
      const saved=storage.get(`characters:${a.state.character.id}`);
      a.state.character=a.migrateCharacter(copy(saved));
      assert.equal(a.state.character.pendingLevelUp.to,level,label);
      d=await a.deriveCharacter();
      for(const r of a.state.character.resources)if(spent.has(r.id))assert.equal(r.current,r.preserveCurrent?Math.min(r.max,spent.get(r.id).current):Math.max(0,r.max-spent.get(r.id).spent),`${label} spent ${r.name}`);
      if(level===3&&sub)a.state.character.subclass={name:sub.name,source:sub.source};
      d=await chooseSpells(a,await a.deriveCharacter(),rec.key==='wizard'?2:0);
      d=await resolveChoices(a,d);
      d=await chooseSpells(a,d);
      const tasks=a.levelUpChecklist(a.state.character,d);
      assert.ok(tasks.filter(t=>t.required).every(t=>t.done),`${label}: ${tasks.filter(t=>t.required&&!t.done).map(t=>t.label)}`);
      if(rec.key==='wizard') assert.ok(tasks.some(t=>t.spellTab==='spellbook'&&t.label.includes('2 Wizard')&&t.done),label);
      const removable=tasks.find(task=>task.control==='data-class-feature-choice'||task.control==='data-progression-feat'||task.control==='data-optional-feature');
      if(removable) {
        const field={'data-class-feature-choice':'classFeatureChoices','data-progression-feat':'progressionFeats','data-optional-feature':'optionalFeatureChoices'}[removable.control];
        const value=a.state.character[field][removable.choiceKey];
        delete a.state.character[field][removable.choiceKey];
        assert.equal(a.completeCharacterSetup(a.state.character,d).complete,false,`${label} missing ${removable.label}`);
        assert.ok(a.state.character.pendingLevelUp,`${label} remains pending`);
        a.state.character[field][removable.choiceKey]=value;
      }
      assert.equal(a.completeCharacterSetup(a.state.character,d).complete,true,label);
      await a.saveCharacter();
      assert.deepEqual(copy(a.state.character.hpLevelRolls),rolls,label);
      assert.equal(a.state.character.hitDiceUsed,1,label);
      if(rec.key==='warlock')assert.equal(a.countSlotUsed(a.state.character,d.spellSlots.findIndex(n=>n>0)+1),1,`${label} spent Pact Magic slot`);
      assert.ok(d.maxHp>before.maxHp,label);
    }
    assert.equal(d.pb,2+Math.floor((level-1)/4),label);
    assert.deepEqual(copy(d.classFeatures.map(x=>`${x.name.toLowerCase()}|${x.level}`).sort()),printedFeatures(rec.cls.classFeatures,level),label);
    assert.deepEqual(copy(d.subclassFeatures.map(x=>`${x.name.toLowerCase()}|${x.level}`).sort()),sub?rec.file.subclassFeature.filter(x=>x.source===rec.source&&x.classSource===rec.source&&x.subclassSource===rec.source&&x.subclassShortName===sub.shortName&&x.level<=level).map(x=>`${x.name.toLowerCase()}|${x.level}`).sort():[],label);
    assert.deepEqual(copy(d.spellSlots),printedSlots(rec.cls.spellcastingAbility?rec.cls:level>=3&&sub?.spellcastingAbility?sub:null,level),label);
    if(d.spellcastingSource)assert.equal(d.maxPrepared,d.spellcastingSource.preparedSpellsProgression?.[level-1]??null,label);
    assert.deepEqual(copy(d.progressionFeatSlots.filter(x=>x.name==='Ability Score Improvement').map(x=>x.level)),(asiLevels[rec.key]||[4,8,12,16]).filter(x=>x<=level),label);
    assert.equal(d.progressionFeatSlots.some(x=>x.name==='Epic Boon'),level>=19,label);
    const hp=rec.cls.hd.faces+d.mods.con+Array.from({length:level-1},(_,i)=>Math.max(1,(rolls[i+2]??Math.floor(rec.cls.hd.faces/2)+1)+d.mods.con)).reduce((sum,n)=>sum+n,0)+d.effects.hpPerLevel*level+d.effects.hpFlat;
    assert.equal(d.maxHp,hp,label);
    assert.equal(d.maxHp-d.currentHp,3,`${label} missing HP`);
    checkClassMechanics(a,d,rec.key,level);
    for(const r of a.state.character.resources)if(r.max>0)r.current=Math.max(0,r.max-1);
    if(rec.key==='warlock')a.setSlotUsed(a.state.character,d.spellSlots.findIndex(n=>n>0)+1,1);
  }
  assert.equal(a.levelUpPreview(a.state.character,d),null);
}
for(const rec of records) {
  test(`${rec.cls.name}: saved level-up journey from 1 through 20`,()=>journey(rec));
  for(const sub of rec.subs)test(`${rec.cls.name} / ${sub.name}: level-up journey from 1 through 20`,()=>journey(rec,sub));
}
