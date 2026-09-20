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

const feats=(read('feats.json').feat||[]).filter(x=>x.source==='XPHB');
const feat=name=>feats.find(x=>x.name===name);
a.state.data.feats={feat:feats};

function derived(level=4,overrides={}){
  return {
    level,
    classObj:null,
    classFeatures:[],
    classFeatureOptionObjects:[],
    classProficiencyChoiceSpecs:[],
    subclassFeatures:[],
    optionalFeatureObjects:[],
    speciesObj:null,
    skillProficiencies:new Set(),
    pb:a.proficiencyBonus(level),
    mods:{str:0,dex:0,con:0,int:0,wis:0,cha:0},
    stats:{str:10,dex:10,con:10,int:10,wis:10,cha:10},
    proficiencies:{armor:[],weapons:[],tools:[],languages:[]},
    spellcastingAbility:null,
    ...overrides,
  };
}

function effects(name,c=a.emptyCharacter(),d=derived()){
  return a.buildDerivedEffects(c,d,[feat(name)]);
}

const index=read('class/index.json');
function cls(key){
  const data=read('class/'+index[key]);
  return (data.class||[]).find(x=>x.source==='XPHB');
}

test('all twelve PHB classes expose one level-19 Epic Boon feat slot',()=>{
  for(const key of ['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard']){
    assert.equal(a.progressionFeatSlots(cls(key),18).some(x=>x.name==='Epic Boon'),false,key);
    const slots=a.progressionFeatSlots(cls(key),19).filter(x=>x.name==='Epic Boon');
    assert.equal(slots.length,1,key);
    assert.equal(slots[0].level,19,key);
    assert.deepEqual(JSON.parse(JSON.stringify(slots[0].category)),[],key);
  }
});

test('feat prerequisites enforce level, ability, armor training, and spellcasting',()=>{
  assert.equal(a.featPrerequisiteMet(feat('Actor'),derived(4,{stats:{str:10,dex:10,con:10,int:10,wis:10,cha:12}})),false);
  assert.equal(a.featPrerequisiteMet(feat('Actor'),derived(4,{stats:{str:10,dex:10,con:10,int:10,wis:10,cha:13}})),true);
  assert.equal(a.featPrerequisiteMet(feat('Moderately Armored'),derived(4)),false);
  assert.equal(a.featPrerequisiteMet(feat('Moderately Armored'),derived(4,{proficiencies:{armor:['Light Armor'],weapons:[],tools:[],languages:[]}})),true);
  assert.equal(a.featPrerequisiteMet(feat('War Caster'),derived(4)),false);
  assert.equal(a.featPrerequisiteMet(feat('War Caster'),derived(4,{spellcastingAbility:'int'})),true);
});

test('nonrepeatable feats cannot occupy two feat slots while repeatable feats can',()=>{
  const c=a.emptyCharacter();
  c.progressionFeats={'feat:first':{name:'Actor',source:'XPHB'}};
  const d=derived(8,{stats:{str:10,dex:10,con:10,int:10,wis:10,cha:13}});
  assert.equal(a.featCanSelectForSlot(feat('Actor'),d,c,{key:'feat:second',name:'Ability Score Improvement'}),false);
  c.progressionFeats={'feat:first':{name:'Ability Score Improvement',source:'XPHB'}};
  assert.equal(a.featCanSelectForSlot(feat('Ability Score Improvement'),d,c,{key:'feat:second',name:'Ability Score Improvement'}),true);
});

test('feat armor and weapon training flow into displayed proficiencies',()=>{
  const c=a.emptyCharacter(); a.state.character=c;
  const profs=a.parseProficiencyDisplay(null,null,null,[feat('Lightly Armored'),feat('Martial Weapon Training'),feat('Tavern Brawler')]);
  assert.ok(profs.armor.includes('Light Armor'));
  assert.ok(profs.armor.includes('Shields'));
  assert.ok(profs.weapons.includes('Martial Weapons'));
  assert.ok(profs.weapons.some(x=>/Improvised/i.test(x)));
});

test('static feat effects update speed, hit points, death saves, and Concentration',()=>{
  assert.equal(effects('Speedy').speedBonus,10);
  assert.equal(effects('Boon of Speed').speedBonus,30);
  assert.equal(effects('Boon of Fortitude').hpFlat,40);
  assert.equal(effects('Durable').deathSaveAdvantage,true);
  assert.equal(effects('War Caster').concentrationSaveAdvantage,true);
});

test('Medium Armor Master raises the medium-armor Dexterity cap only at Dexterity 16+',()=>{
  const c=a.emptyCharacter();
  c.inventory=[{name:'Test Medium Armor',source:'XPHB',equipped:true}];
  a.state.character=c;
  const e=effects('Medium Armor Master',c,derived(4,{stats:{str:10,dex:16,con:10,int:10,wis:10,cha:10}}));
  const items={item:[{name:'Test Medium Armor',source:'XPHB',type:'MA',ac:14,dexterityMax:2}]};
  const trained={armor:['Medium Armor'],weapons:[],tools:[],languages:[]};
  assert.equal(a.calcAutoAc(c,{str:0,dex:3,con:0,int:0,wis:0,cha:0},items,e,trained,{str:10,dex:16}).value,17);
  assert.equal(a.calcAutoAc(c,{str:0,dex:2,con:0,int:0,wis:0,cha:0},items,e,trained,{str:10,dex:14}).value,16);
});

test('Weapon Master contributes one additional mastery choice',()=>{
  assert.equal(a.weaponMasteryCount(null,4,[]),0);
  assert.equal(a.weaponMasteryCount(null,4,[feat('Weapon Master')]),1);
});

test('Boon of Energy Resistance exposes two distinct persistent choices',()=>{
  const boon=feat('Boon of Energy Resistance');
  const specs=a.featDamageChoiceSpecs(boon);
  assert.equal(specs.length,2);
  const c=a.emptyCharacter();
  c.featDamageChoices[specs[0].key]='Fire';
  c.featDamageChoices[specs[1].key]='Cold';
  a.reconcileFeatChoices(c,[boon]);
  const e=a.buildDerivedEffects(c,derived(19),[boon]);
  assert.ok(e.resistances.includes('Fire'));
  assert.ok(e.resistances.includes('Cold'));
  assert.ok(!e.resistances.includes('[Object Object]'));
});

test('repeatable Elemental Adept instances cannot silently duplicate a damage type',()=>{
  const base=feat('Elemental Adept');
  const instances=[{...base,_instanceKey:'one'},{...base,_instanceKey:'two'}];
  const c=a.emptyCharacter();
  for(const instance of instances) c.featDamageChoices[a.featDamageChoiceSpecs(instance)[0].key]='Fire';
  a.reconcileFeatChoices(c,instances);
  assert.equal(Object.values(c.featDamageChoices).filter(x=>x==='Fire').length,1);
});

test('Boon of Skill exposes its any-proficient-skill Expertise choice',()=>{
  const specs=a.featExpertiseSpecs(feat('Boon of Skill'));
  assert.equal(specs.length,1);
  assert.equal(specs[0].anyProficientSkill,true);
  assert.equal(specs[0].from.length,Object.keys(a.SKILLS).length);
});

test('rest-limited PHB feat resources remain separate and scale correctly',()=>{
  const selected=['Chef','Lucky','Mage Slayer','Magic Initiate','Ritual Caster','Fey-Touched','Shadow-Touched','Telepathic','Boon of Fate','Boon of Recovery'].map(feat);
  const resources=a.featResourceSpecs(selected,derived(19,{pb:6}));
  const byName=new Map(resources.map(x=>[x.name,x]));
  assert.equal(byName.get('Bolstering Treats').max,6);
  assert.equal(byName.get('Luck Points').max,6);
  assert.equal(byName.get('Guarded Mind').recharge,'both');
  assert.equal(byName.get('Quick Ritual').max,1);
  assert.equal(byName.get('Fey-Touched · Misty Step Free Cast').max,1);
  assert.equal(byName.get('Shadow-Touched · Invisibility Free Cast').max,1);
  assert.equal(byName.get('Telepathic · Detect Thoughts Free Cast').max,1);
  assert.equal(byName.get('Improve Fate').recharge,'both');
  assert.equal(byName.get('Last Stand').max,1);
  assert.equal(byName.get('Recover Vitality Dice').max,10);
  assert.equal(resources.filter(x=>x.name.includes('Fey-Touched')).length,2);
  assert.equal(resources.filter(x=>x.name.includes('Shadow-Touched')).length,2);
});

test('all 77 PHB feats are accounted for by sheet automation or explicit linked-reference behavior',()=>{
  assert.equal(feats.length,77);
  const linkedReferenceOnly=new Set(['Healer','Savage Attacker']);
  const unrepresented=[];
  for(const f of feats){
    const c=a.emptyCharacter();
    const e=a.buildDerivedEffects(c,derived(19),[f]);
    const structured=Boolean(f.ability||f.armorProficiencies||f.weaponProficiencies||f.toolProficiencies||f.skillProficiencies||f.savingThrowProficiencies||f.skillToolLanguageProficiencies||f.expertise||f.additionalSpells||f.resist||f.senses);
    const automated=structured||a.featResourceSpecs([f],derived(19)).length||e.active.length||e.flags.size||e.senses.length||e.resistances.length;
    if(!automated&&!linkedReferenceOnly.has(f.name)) unrepresented.push(f.name);
  }
  assert.deepEqual(unrepresented,[]);
});
