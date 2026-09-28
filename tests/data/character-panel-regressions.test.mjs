import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const version=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/5etools-version.json'),'utf8')).version;
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'tests/.cache',version,'data',name),'utf8'));
const a=loadAppTestContext();
resetState(a);
const races=read('races.json').race.filter(x=>x.source==='XPHB');
const feats=read('feats.json').feat.filter(x=>x.source==='XPHB');
a.state.data.races={race:races}; a.state.data.feats={feat:feats};

test('Skilled excludes prior skill and tool proficiency, including another Skilled pick',()=>{
  const feat=feats.find(x=>x.name==='Skilled');
  const c=a.emptyCharacter(); a.state.character=c;
  c.customSkillProficiencies=['acrobatics'];
  c.manualToolProficiencies=['Thieves\' Tools'];
  const d={classObj:null,backgroundObj:null,speciesObj:null,featObjs:[feat]};
  const spec=a.featMixedChoiceSpecs(feat)[0];
  const options=a.mixedChoiceOptions(spec);
  const acrobatics=options.find(o=>o.kind==='Skill'&&o.value==='acrobatics');
  const athletics=options.find(o=>o.kind==='Skill'&&o.value==='athletics');
  const tool=options.find(o=>o.kind==='Tool'&&o.value==="Thieves' Tools");
  assert.equal(a.skilledChoiceAvailable(c,d,spec.key,acrobatics),false);
  assert.equal(a.skilledChoiceAvailable(c,d,spec.key,tool),false);
  assert.equal(a.skilledChoiceAvailable(c,d,spec.key,athletics),true);
  c.featMixedChoices[spec.key]='Skill:acrobatics';
  a.reconcileSkilledChoices(c,d);
  assert.equal(c.featMixedChoices[spec.key],undefined);
  c.featMixedChoices[spec.key]='Skill:athletics';
  assert.equal(a.skilledChoiceAvailable(c,d,a.featMixedChoiceSpecs(feat)[1].key,athletics),false);
  const human=races.find(x=>x.name==='Human');
  const skillChoice=a.speciesChoiceSpecs(human).find(s=>s.kind==='skill');
  c.speciesChoices[skillChoice.key]={value:'Acrobatics'};
  d.speciesObj=human;
  c.customSkillProficiencies=[];
  assert.equal(a.skilledChoiceAvailable(c,d,spec.key,acrobatics),false);
});

test('PHB species resources follow lineage, level, recovery, and spent uses',()=>{
  const species=name=>races.find(x=>x.name===name);
  const gnome=species('Gnome');
  const spec=a.speciesChoiceSpecs(gnome).find(x=>x.options.some(y=>y.name==='Forest Gnome'));
  const c=a.emptyCharacter(); c.level=5;
  c.speciesChoices[spec.key]={value:'Forest Gnome',ability:'wis'};
  let resources=a.speciesResourceSpecs(gnome,c,{pb:3});
  assert.equal(resources.find(r=>r.name.includes('Speak with Animals'))?.max,3);
  a.reconcileResources(c,resources);
  c.resources[0].current=1;
  a.reconcileResources(c,a.speciesResourceSpecs(gnome,c,{pb:4}));
  assert.equal(c.resources[0].current,2);
  c.speciesChoices[spec.key]={value:'Rock Gnome',ability:'wis'};
  a.reconcileResources(c,a.speciesResourceSpecs(gnome,c,{pb:4}));
  assert.equal(c.resources.length,0);
  const orc=a.speciesResourceSpecs(species('Orc'),c,{pb:3});
  assert.equal(orc.find(r=>r.name==='Adrenaline Rush')?.recharge,'both');
  assert.equal(orc.find(r=>r.name==='Relentless Endurance')?.max,1);
  const dragon=a.speciesResourceSpecs(species('Dragonborn'),c,{pb:3});
  assert.equal(dragon.find(r=>r.name==='Breath Weapon')?.max,3);
  assert.ok(dragon.some(r=>r.name==='Draconic Flight'));
  c.level=1;
  assert.equal(a.speciesResourceSpecs(species('Dragonborn'),c,{pb:2}).some(r=>r.name==='Draconic Flight'),false);
  for(const name of ['Elf','Tiefling']) {
    const race=species(name), lineage=a.speciesChoiceSpecs(race).find(s=>s.options.some(o=>o.name===race.additionalSpells[0].name));
    c.level=5; c.speciesChoices={[lineage.key]:{value:race.additionalSpells[0].name,ability:'cha'}};
    assert.equal(a.speciesResourceSpecs(race,c,{pb:3}).filter(r=>r.name.includes('Free Cast')).length,2,name);
  }
  c.speciesChoices={};
  assert.deepEqual(Array.from(a.speciesResourceSpecs(species('Aasimar'),c,{pb:3}),r=>r.name),['Healing Hands','Celestial Revelation']);
  assert.equal(a.speciesResourceSpecs(species('Dwarf'),c,{pb:3})[0]?.max,3);
  const giant=species('Goliath'), ancestry=a.speciesChoiceSpecs(giant).find(s=>s.options.some(o=>o.name?.startsWith("Cloud's Jaunt")));
  c.speciesChoices={[ancestry.key]:{value:ancestry.options[0].name}};
  assert.deepEqual(Array.from(a.speciesResourceSpecs(giant,c,{pb:3}),r=>r.name),['Giant Ancestry','Large Form']);
  for(const name of ['Halfling','Human']) assert.equal(a.speciesResourceSpecs(species(name),c,{pb:3}).length,0,name);
});

test('automatic damage cantrips appear with custom attacks and have no row cap',async()=>{
  const c=a.emptyCharacter(); a.state.character=c;
  c.attacks=Array.from({length:15},(_,i)=>({name:`Custom ${i}`}));
  c.cantrips=['Fire Bolt|XPHB'];
  a.state.data.spells={spell:[{name:'Fire Bolt',source:'XPHB',level:0,damageInflict:['F'],entries:['Make a ranged spell attack.']} ]};
  const d={alwaysKnownSpells:[],alwaysPreparedSpells:[],featSpellRefs:['Fire Bolt|XPHB'],speciesSpellRefs:[],featObjs:[],pb:2,mods:{int:3},spellcastingAbility:'int',equipmentEffects:{},conditionEffects:{},d20Penalty:0};
  const rows=await a.getAttackRows(d);
  assert.equal(rows.filter(r=>r.name==='Fire Bolt').length,1);
  assert.equal(rows.find(r=>r.name==='Fire Bolt')?.attackBonus,'+5');
  assert.equal(rows.length,16);
});

test('Magic Initiate attack cantrips use the chosen feat ability even without class spellcasting',async()=>{
  const c=a.emptyCharacter(); a.state.character=c;
  const feat=feats.find(x=>x.name==='Magic Initiate');
  const spec=a.featAdditionalSpellChoiceSpecs(feat,1)[0];
  const wizard=spec.groups.find(x=>x.name==='Wizard Spells');
  const choice=wizard.choices.find(x=>x.kind==='known');
  c.featSpellChoices[spec.key]={list:wizard.name,ability:'cha',picks:{[choice.key]:['Fire Bolt|XPHB']}};
  a.state.data.spells={spell:[{name:'Fire Bolt',source:'XPHB',level:0,damageInflict:['F'],entries:['Make a ranged spell attack.']}]};
  const d={alwaysKnownSpells:[],alwaysPreparedSpells:[],featSpellRefs:a.featGrantedSpellRefs([feat],c,1),speciesSpellRefs:[],featObjs:[feat],pb:2,mods:{cha:4},spellcastingAbility:null,equipmentEffects:{},conditionEffects:{},d20Penalty:0};
  const rows=await a.getAttackRows(d);
  assert.equal(rows.find(r=>r.name==='Fire Bolt')?.attackBonus,'+6');
});

test('references without cached prose show item details without exposing JSON',()=>{
  const item=a.renderReferenceWithoutEntries({rarity:'uncommon',weight:2,value:75,opaque:{private:'raw'}},'item');
  assert.match(item,/Rarity: uncommon/);
  assert.match(item,/No rules description/);
  assert.doesNotMatch(item,/opaque|private|\{|<pre/);
  const language=a.renderReferenceWithoutEntries({name:'Common'},'language');
  assert.match(language,/this language/);
});
