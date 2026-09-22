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

const baseItems=(read('items-base.json').baseitem||[]).filter(x=>x.source==='XPHB');
const merged=a.mergeItemCatalogs(read('items.json'),read('items-base.json'));
const xphb=(merged.item||[]).filter(x=>x.source==='XPHB');
const weapons=baseItems.filter(x=>x.weaponCategory);
const armor=baseItems.filter(x=>['LA','MA','HA','S'].includes(a.itemTypeCode(x)));
const byName=name=>xphb.find(x=>x.name===name);
a.state.data.items=merged;
a.state.data.itemIndex=a.buildItemIndex(merged,a.state.data.officialSources);

function effects(overrides={}){
  return {flags:new Set(),acFormulas:[],acBonus:0,acBonusWhileArmored:0,acBonusWhileUnarmored:0,attackBonuses:{},damageBonuses:{},...overrides};
}

function derived(overrides={}){
  return {
    mods:{str:3,dex:3,con:0,int:0,wis:0,cha:0},
    stats:{str:16,dex:16,con:10,int:10,wis:10,cha:10},
    pb:3,
    d20Penalty:0,
    proficiencies:{armor:[],weapons:['Simple Weapons','Martial Weapons'],tools:[],languages:[]},
    effects:effects(),
    armorTrainingPenalty:false,
    ...overrides,
  };
}

function armorTraining(item){
  return {armor:[{LA:'Light Armor',MA:'Medium Armor',HA:'Heavy Armor',S:'Shields'}[a.itemTypeCode(item)]],weapons:[],tools:[],languages:[]};
}

test('the PHB equipment corpus contains all forty weapon entries without duplicate refs',()=>{
  assert.equal(weapons.length,40);
  assert.equal(new Set(weapons.map(x=>`${x.name}|${x.source}`.toLowerCase())).size,40);
  for(const name of ['Dagger','Longsword','Longbow','Lance','Musket','Pistol']) assert.ok(byName(name),name);
});

test('every PHB weapon property shape resolves to one of the nine 2024 properties',()=>{
  const codes=new Set(weapons.flatMap(x=>[...a.weaponPropertyCodes(x)]));
  assert.deepEqual([...codes].sort(),['2H','A','F','H','L','LD','R','T','V']);
  assert.equal(a.weaponFlags(byName('Lance')).twoHanded,true);
  assert.equal(a.weaponNotePayload(byName('Lance')).properties.find(x=>x.code==='2H').description.includes('unless mounted'),true);
});

test('all eight mastery properties are represented and every PHB weapon has one',()=>{
  const masteries=new Set(weapons.flatMap(x=>a.masteryObjects(x).map(m=>m.name)));
  assert.deepEqual([...masteries].sort(),['Cleave','Graze','Nick','Push','Sap','Slow','Topple','Vex']);
  for(const weapon of weapons) assert.equal(a.masteryObjects(weapon).length,1,weapon.name);
});

test('every PHB weapon mastery produces a complete deterministic resolution profile',()=>{
  const d=derived();
  const expected=new Set(['cleave','graze','nick','push','sap','slow','topple','vex']);
  const resolved=new Set();
  for(const weapon of weapons){
    const profile=a.weaponAttackProfile(weapon,d,[weapon],{equipped:true,wielding:true});
    const mastery=a.weaponMasteryResolution(weapon,d,profile);
    assert.ok(mastery,weapon.name);
    assert.ok(mastery.trigger,weapon.name);
    assert.ok(mastery.summary,weapon.name);
    resolved.add(mastery.key);
  }
  assert.deepEqual(resolved,expected);
});

test('all eight mastery outcomes expose their exact sheet-resolvable values',()=>{
  const d=derived();
  const resolve=name=>{
    const item=byName(name);
    return a.weaponMasteryResolution(item,d,a.weaponAttackProfile(item,d,[item],{equipped:true,wielding:true}));
  };
  assert.deepEqual(
    (({trigger,extraAttack,attackBonus,damage})=>({trigger,extraAttack,attackBonus,damage}))(resolve('Greataxe')),
    {trigger:'hit',extraAttack:true,attackBonus:6,damage:'1d12 Slashing'},
  );
  assert.deepEqual(
    (({trigger,damage,damageType})=>({trigger,damage,damageType}))(resolve('Glaive')),
    {trigger:'miss',damage:3,damageType:'Slashing'},
  );
  assert.deepEqual(
    (({trigger,action,usesPerTurn})=>({trigger,action,usesPerTurn}))(resolve('Dagger')),
    {trigger:'light-extra-attack',action:'Attack Action',usesPerTurn:1},
  );
  assert.deepEqual(
    (({trigger,distance,maximumTargetSize})=>({trigger,distance,maximumTargetSize}))(resolve('Greatclub')),
    {trigger:'hit',distance:10,maximumTargetSize:'Large'},
  );
  assert.equal(resolve('Flail').nextAttackDisadvantage,true);
  assert.deepEqual(
    (({trigger,speedReduction,stacks})=>({trigger,speedReduction,stacks}))(resolve('Club')),
    {trigger:'hit-and-damage',speedReduction:10,stacks:false},
  );
  assert.deepEqual(
    (({trigger,saveAbility,saveDC,failureCondition})=>({trigger,saveAbility,saveDC,failureCondition}))(resolve('Battleaxe')),
    {trigger:'hit',saveAbility:'Constitution',saveDC:14,failureCondition:'Prone'},
  );
  assert.equal(resolve('Rapier').nextAttackAdvantage,true);
});

test('Cleave omits a positive ability modifier but retains a negative one',()=>{
  const item=byName('Greataxe');
  const positive=derived({mods:{str:3,dex:0,con:0,int:0,wis:0,cha:0}});
  const negative=derived({mods:{str:-1,dex:0,con:0,int:0,wis:0,cha:0}});
  assert.equal(a.weaponMasteryResolution(item,positive).damage,'1d12 Slashing');
  assert.equal(a.weaponMasteryResolution(item,negative).damage,'1d12 -1 Slashing');
});

test('every PHB weapon produces a finite proficient attack profile and damage line',()=>{
  const d=derived();
  for(const weapon of weapons){
    const profile=a.weaponAttackProfile(weapon,d,[weapon],{equipped:true,wielding:true});
    assert.equal(Number.isFinite(profile.attackBonus),true,weapon.name);
    assert.equal(profile.proficient,true,weapon.name);
    assert.notEqual(profile.damage,'—',weapon.name);
    assert.match(profile.damage,/Bludgeoning|Piercing|Slashing/,weapon.name);
    assert.equal(profile.abilityModifier,d.mods[profile.ability],weapon.name);
    assert.equal(Number.isFinite(profile.damageBonus),true,weapon.name);
  }
});

test('finesse and ranged weapons select the correct attack ability',()=>{
  assert.equal(a.weaponAttackProfile(byName('Dagger'),derived({mods:{str:1,dex:4}})).ability,'dex');
  assert.equal(a.weaponAttackProfile(byName('Dagger'),derived({mods:{str:4,dex:1}})).ability,'str');
  assert.equal(a.weaponAttackProfile(byName('Longbow'),derived({mods:{str:4,dex:1}})).ability,'dex');
});

test('Heavy weapon requirements use Strength for melee and Dexterity for ranged weapons',()=>{
  assert.deepEqual(JSON.parse(JSON.stringify(a.heavyWeaponRequirement(byName('Greatsword')))),{ability:'str',score:13});
  assert.deepEqual(JSON.parse(JSON.stringify(a.heavyWeaponRequirement(byName('Longbow')))),{ability:'dex',score:13});
  assert.equal(a.heavyWeaponRequirement(byName('Dagger')),null);
});

test('Heavy weapon profiles surface Disadvantage only below the relevant score',()=>{
  const low=a.weaponAttackProfile(byName('Greatsword'),derived({stats:{str:12,dex:16}}));
  const enough=a.weaponAttackProfile(byName('Greatsword'),derived({stats:{str:13,dex:10}}));
  assert.ok(low.warnings.some(x=>x.startsWith('Disadvantage')));
  assert.ok(!enough.warnings.some(x=>x.startsWith('Disadvantage')));
});

test('Versatile weapon damage includes both one-handed and two-handed formulas',()=>{
  const damage=a.weaponAttackProfile(byName('Longsword'),derived()).damage;
  assert.match(damage,/1d8 \+3 Slashing/);
  assert.match(damage,/1d10 \+3 two-handed/);
});

test('magic weapon bonuses remain inactive until required attunement is recorded',()=>{
  const magic=(merged.item||[]).find(x=>x.name==='Blackrazor'&&x.source==='XDMG');
  assert.ok(magic);
  const inactive=a.weaponAttackProfile(magic,derived(),[magic],{equipped:true,wielding:true,attuned:false});
  const active=a.weaponAttackProfile(magic,derived(),[magic],{equipped:true,wielding:true,attuned:true});
  assert.equal(active.attackBonus-inactive.attackBonus,3);
  assert.match(active.damage,/\+6/);
});

test('the PHB armor table contains all twelve suits plus the Shield',()=>{
  assert.equal(armor.length,13);
  assert.equal(armor.filter(x=>a.itemTypeCode(x)==='LA').length,3);
  assert.equal(armor.filter(x=>a.itemTypeCode(x)==='MA').length,5);
  assert.equal(armor.filter(x=>a.itemTypeCode(x)==='HA').length,4);
  assert.equal(armor.filter(x=>a.itemTypeCode(x)==='S').length,1);
});

test('every PHB armor suit calculates its printed AC formula',()=>{
  const mods={str:3,dex:3,con:0,int:0,wis:0,cha:0};
  for(const item of armor.filter(x=>a.itemTypeCode(x)!=='S')){
    const c=a.emptyCharacter(); c.inventory=[{name:item.name,source:item.source,equipped:true}];
    const result=a.calcAutoAc(c,mods,merged,effects(),armorTraining(item),{str:16,dex:16});
    const type=a.itemTypeCode(item);
    const expected=Number(item.ac)+(type==='LA'?3:type==='MA'?2:0);
    assert.equal(result.value,expected,item.name);
    assert.equal(result.selectedArmor,item.name,item.name);
  }
});

test('armor grants its AC without training and reports the rules penalty',()=>{
  const item=byName('Chain Mail');
  const c=a.emptyCharacter(); c.inventory=[{name:item.name,source:item.source,equipped:true}];
  const result=a.calcAutoAc(c,{str:1,dex:5},merged,effects(),{armor:[]},{str:12,dex:20});
  assert.equal(result.value,16);
  assert.deepEqual(JSON.parse(JSON.stringify(result.untrainedEquipment)),['Chain Mail']);
});

test('heavy armor reads the corpus Strength requirement and applies the speed penalty',()=>{
  const item=byName('Chain Mail');
  const c=a.emptyCharacter(); c.inventory=[{name:item.name,source:item.source,equipped:true}];
  assert.equal(a.calcAutoAc(c,{str:1,dex:0},merged,effects(),armorTraining(item),{str:12,dex:10}).speedPenalty,10);
  assert.equal(a.calcAutoAc(c,{str:1,dex:0},merged,effects(),armorTraining(item),{str:13,dex:10}).speedPenalty,0);
});

test('armor with the Stealth field reports Dexterity Stealth Disadvantage',()=>{
  const item=byName('Scale Mail');
  const c=a.emptyCharacter(); c.inventory=[{name:item.name,source:item.source,equipped:true}];
  assert.equal(a.calcAutoAc(c,{str:2,dex:2},merged,effects(),armorTraining(item),{str:14,dex:14}).stealthDisadvantage,true);
});

test('a Shield stacks once with armor and requires Shield training to avoid penalties',()=>{
  const leather=byName('Leather Armor'),shield=byName('Shield');
  const c=a.emptyCharacter(); c.inventory=[{name:leather.name,source:leather.source,equipped:true},{name:shield.name,source:shield.source,equipped:true},{name:shield.name,source:shield.source,equipped:true}];
  const trained={armor:['Light Armor','Shields']};
  assert.equal(a.calcAutoAc(c,{str:0,dex:3},merged,effects(),trained,{str:10,dex:16}).value,16);
  const untrained=a.calcAutoAc(c,{str:0,dex:3},merged,effects(),{armor:['Light Armor']},{str:10,dex:16});
  assert.ok(untrained.untrainedEquipment.includes('Shield'));
});

test('attunement gates an attuned magic shield enhancement but not its base Shield AC',()=>{
  const magic=(merged.item||[]).find(x=>x.name==='Arrow-Catching Shield'&&x.source==='XDMG');
  assert.ok(magic);
  const c=a.emptyCharacter(); c.inventory=[{name:magic.name,source:magic.source,equipped:true,attuned:false}];
  const inactive=a.calcAutoAc(c,{str:0,dex:2},merged,effects(),{armor:['Shields']},{str:10,dex:14});
  c.inventory[0].attuned=true;
  const active=a.calcAutoAc(c,{str:0,dex:2},merged,effects(),{armor:['Shields']},{str:10,dex:14});
  assert.equal(inactive.value,14);
  assert.equal(active.value,16);
});

test('attunement reconciliation rejects non-attunement items and caps active items at three',()=>{
  const attuned=(merged.item||[]).filter(x=>x.source==='XDMG'&&x.reqAttune).slice(0,4);
  assert.equal(attuned.length,4);
  const c=a.emptyCharacter();
  c.inventory=[{name:'Dagger',source:'XPHB',attuned:true},...attuned.map(x=>({name:x.name,source:x.source,attuned:true}))];
  assert.equal(a.reconcileAttunement(c,merged),3);
  assert.equal(c.inventory[0].attuned,false);
  assert.equal(c.inventory.filter(x=>x.attuned).length,3);
});

test('equipping multiple suits is detected while only the best armor formula is used',()=>{
  const c=a.emptyCharacter(); c.inventory=[{name:'Leather Armor',source:'XPHB',equipped:true},{name:'Chain Mail',source:'XPHB',equipped:true}];
  const result=a.calcAutoAc(c,{str:3,dex:3},merged,effects(),{armor:['Light Armor','Heavy Armor']},{str:16,dex:16});
  assert.equal(result.value,16);
  assert.equal(result.multipleArmor,true);
});

test('inventory weight respects quantities and carrying capacity uses Strength times fifteen',()=>{
  const c=a.emptyCharacter(); c.inventory=[{name:'Dagger',source:'XPHB',quantity:3},{name:'Chain Mail',source:'XPHB',quantity:1}];
  assert.equal(a.inventoryWeight(c,merged),58);
  assert.equal(a.carryingCapacity({str:12}),180);
});

test('all PHB artisan tools and instruments are classified as tools',()=>{
  const tools=baseItems.filter(x=>['AT','GS','INS'].some(prefix=>a.itemTypeCode(x).startsWith(prefix))||a.itemTypeCode(x)==='T');
  assert.equal(tools.length,27);
  for(const item of tools) assert.equal(a.equipmentCategory(item),'tool',item.name);
});
