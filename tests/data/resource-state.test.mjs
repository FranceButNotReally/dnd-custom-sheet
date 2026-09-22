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

function character(overrides={}){
  return {...a.emptyCharacter(),level:5,hpCurrent:20,hpAuto:false,resources:[],...overrides};
}

function withCharacter(c,fn){
  a.state.character=c;
  return fn(c);
}

test('resource reconciliation preserves spent uses when a maximum increases',()=>{
  const c=character({resources:[{id:'rage',name:'Rage',mode:'auto',max:2,current:1}]});
  a.reconcileResources(c,[{id:'rage',name:'Rage',mode:'auto',max:3,recharge:'both'}]);
  assert.equal(c.resources[0].current,2);
});

test('resource reconciliation clamps spent uses safely when a maximum decreases',()=>{
  const c=character({resources:[{id:'pool',name:'Pool',mode:'auto',max:5,current:1}]});
  a.reconcileResources(c,[{id:'pool',name:'Pool',mode:'auto',max:3,recharge:'long'}]);
  assert.equal(c.resources[0].current,0);
});

test('resource reconciliation preserves manual pools and removes obsolete automatic pools',()=>{
  const c=character({resources:[{id:'old',name:'Old',mode:'auto',max:1,current:0},{name:'Arrows',mode:'manual',max:20,current:7}]});
  a.reconcileResources(c,[]);
  assert.equal(c.resources.length,1);
  assert.equal(c.resources[0].name,'Arrows');
  assert.equal(c.resources[0].current,7);
});

test('resource reconciliation supports empty-on-create pools that preserve their current value as maximums change',()=>{
  const c=character();
  const spec={id:'arcane-ward',name:'Arcane Ward Hit Points',mode:'auto',max:15,recharge:'',initialCurrent:0,preserveCurrent:true,longReset:'zero'};
  a.reconcileResources(c,[spec]);
  assert.equal(c.resources[0].current,0);
  c.resources[0].current=9;
  a.reconcileResources(c,[{...spec,max:21}]);
  assert.equal(c.resources[0].current,9);
});

test('Short Rest restores one use for partial-recovery resources',()=>{
  const resource={max:3,current:0,recharge:'both',shortRestore:'one'};
  assert.equal(a.restoreResourceForRest(resource,'short'),true);
  assert.equal(resource.current,1);
});

test('Short Rest fully restores ordinary short-rest resources',()=>{
  const resource={max:5,current:1,recharge:'short',shortRestore:'all'};
  a.restoreResourceForRest(resource,'short');
  assert.equal(resource.current,5);
});

test('Short Rest leaves Long-Rest-only and manual resources unchanged',()=>{
  const c=character({resources:[{max:2,current:0,recharge:'long'},{max:4,current:1,recharge:''}]});
  a.applyShortRest(c);
  assert.deepEqual(c.resources.map(x=>x.current),[0,1]);
});

test('Long Rest restores short, long, and both-rest resources but not manual pools',()=>{
  const resources=[
    {max:2,current:0,recharge:'short'},
    {max:3,current:0,recharge:'long'},
    {max:4,current:0,recharge:'both'},
    {max:5,current:1,recharge:''},
  ];
  for(const resource of resources) a.restoreResourceForRest(resource,'long');
  assert.deepEqual(resources.map(x=>x.current),[2,3,4,1]);
});

test('Long Rest empties pools whose rules reset them to zero',()=>{
  const resource={max:20,current:12,recharge:'',longReset:'zero'};
  assert.equal(a.restoreResourceForRest(resource,'long'),true);
  assert.equal(resource.current,0);
});

test('spending Hit Dice applies Constitution per die and consumes only available dice',()=>{
  const c=character({level:5,hpCurrent:4,hitDiceUsed:3});
  const healed=a.spendHitDice(c,5,9,2,30);
  assert.equal(healed,13);
  assert.equal(c.hpCurrent,17);
  assert.equal(c.hitDiceUsed,5);
});

test('Hit Dice healing cannot be negative or exceed maximum HP',()=>{
  const c=character({level:3,hpCurrent:19,hitDiceUsed:0});
  assert.equal(a.spendHitDice(c,1,1,-3,20),0);
  assert.equal(c.hpCurrent,19);
  assert.equal(a.spendHitDice(c,1,20,2,20),1);
  assert.equal(c.hpCurrent,20);
});

test('Long Rest restores HP, Hit Dice, spell slots, rest resources, and one Exhaustion level',()=>{
  const c=character({
    hpCurrent:2,tempHp:7,hitDiceUsed:4,spellSlotsUsed:[2,1],exhaustion:3,concentration:'Bless',
    deathSaves:{success:1,failure:1},resources:[{max:3,current:0,recharge:'long'},{max:2,current:1,recharge:''}],
  });
  assert.equal(a.applyLongRest(c,38),true);
  assert.equal(c.hpCurrent,38);
  assert.equal(c.tempHp,0);
  assert.equal(c.hitDiceUsed,0);
  assert.deepEqual(JSON.parse(JSON.stringify(c.spellSlotsUsed)),[]);
  assert.equal(c.exhaustion,2);
  assert.equal(c.concentration,null);
  assert.deepEqual(JSON.parse(JSON.stringify(c.deathSaves)),{success:0,failure:0});
  assert.deepEqual(c.resources.map(x=>x.current),[3,1]);
});

test('a character at 0 HP cannot gain Long Rest benefits',()=>{
  const c=character({hpCurrent:0,tempHp:5,hitDiceUsed:2,exhaustion:1});
  const before=JSON.stringify(c);
  assert.equal(a.applyLongRest(c,30),false);
  assert.equal(JSON.stringify(c),before);
});

test('death state distinguishes healthy, dying, stable, and dead characters',()=>{
  assert.equal(a.deathState(character({hpCurrent:1})),'healthy');
  assert.equal(a.deathState(character({hpCurrent:0,deathSaves:{success:0,failure:0}})),'dying');
  assert.equal(a.deathState(character({hpCurrent:0,deathSaves:{success:3,failure:1}})),'stable');
  assert.equal(a.deathState(character({hpCurrent:0,deathSaves:{success:2,failure:3}})),'dead');
});

test('death saves can only be recorded while dying at 0 HP',()=>{
  const healthy=character({hpCurrent:1,deathSaves:{success:0,failure:0}});
  assert.equal(a.recordDeathSave(healthy,'failure'),'healthy');
  assert.equal(healthy.deathSaves.failure,0);
  const stable=character({hpCurrent:0,deathSaves:{success:3,failure:0}});
  assert.equal(a.recordDeathSave(stable,'failure'),'stable');
  assert.equal(stable.deathSaves.failure,0);
});

test('three successful death saves produce Stable and three failures produce Dead',()=>{
  const stable=character({hpCurrent:0,deathSaves:{success:2,failure:0}});
  assert.equal(a.recordDeathSave(stable,'success'),'stable');
  assert.deepEqual(JSON.parse(JSON.stringify(stable.deathSaves)),{success:0,failure:0,status:'stable'});
  const dead=character({hpCurrent:0,deathSaves:{success:0,failure:2}});
  assert.equal(a.recordDeathSave(dead,'failure'),'dead');
  assert.deepEqual(JSON.parse(JSON.stringify(dead.deathSaves)),{success:0,failure:3,status:'dead'});
});

test('damage that first reduces a character to 0 HP starts a clean death-save state',()=>withCharacter(character({hpCurrent:5,deathSaves:{success:2,failure:2}}),c=>{
  assert.equal(a.applyDamage(5,20),'dying');
  assert.deepEqual(JSON.parse(JSON.stringify(c.deathSaves)),{success:0,failure:0});
}));

test('damage taken at 0 HP adds one failure, or two on a critical hit',()=>{
  withCharacter(character({hpCurrent:0}),c=>{
    assert.equal(a.applyDamage(1,20),'dying');
    assert.equal(c.deathSaves.failure,1);
  });
  withCharacter(character({hpCurrent:0}),c=>{
    assert.equal(a.applyDamage(1,20,{critical:true}),'dying');
    assert.equal(c.deathSaves.failure,2);
  });
});

test('damage to a Stable character resumes dying and clears successful saves',()=>withCharacter(character({hpCurrent:0,deathSaves:{success:3,failure:0}}),c=>{
  assert.equal(a.applyDamage(1,20),'dying');
  assert.deepEqual(JSON.parse(JSON.stringify(c.deathSaves)),{success:0,failure:1});
}));

test('massive damage equal to maximum HP beyond zero causes immediate death',()=>withCharacter(character({hpCurrent:5}),c=>{
  assert.equal(a.applyDamage(25,20),'dead');
  assert.equal(c.deathSaves.failure,3);
}));

test('temporary HP can absorb damage while at 0 HP without a death-save failure',()=>withCharacter(character({hpCurrent:0,tempHp:5}),c=>{
  assert.equal(a.applyDamage(3,20),'dying');
  assert.equal(c.tempHp,2);
  assert.equal(c.deathSaves.failure,0);
}));

test('temporary HP that absorbs all damage preserves a Stable state',()=>withCharacter(character({hpCurrent:0,tempHp:5,deathSaves:{success:0,failure:0,status:'stable'}}),c=>{
  assert.equal(a.applyDamage(3,20),'stable');
  assert.equal(c.tempHp,2);
  assert.deepEqual(JSON.parse(JSON.stringify(c.deathSaves)),{success:0,failure:0,status:'stable'});
}));

test('healing from 0 HP returns Healthy and clears all death saves',()=>withCharacter(character({hpCurrent:0,deathSaves:{success:2,failure:2}}),c=>{
  assert.equal(a.applyHealing(1,20),'healthy');
  assert.deepEqual(JSON.parse(JSON.stringify(c.deathSaves)),{success:0,failure:0});
}));

test('every PHB class yields at least one automatic class resource by level 20',()=>{
  const index=read('class/index.json');
  for(const key of ['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard']){
    const data=read('class/'+index[key]);
    const cls=(data.class||[]).find(x=>x.source==='XPHB');
    const features=(data.classFeature||[]).filter(x=>x.classSource==='XPHB'&&Number(x.level)<=20);
    const d={level:20,pb:6,mods:{str:5,dex:5,con:5,int:5,wis:5,cha:5}};
    const specs=[...a.featureResourceSpecs(features,d,'classfeature'),...a.classTableResourceSpecs(cls,features,d)];
    assert.ok(specs.length>0,key);
    for(const spec of specs){
      assert.ok(spec.max>0,`${key}: ${spec.name}`);
      assert.ok(['short','long','both'].includes(spec.recharge),`${key}: ${spec.name}`);
    }
  }
});

test('every PHB class has corpus-recognized subclass resources with unique stable IDs',()=>{
  const index=read('class/index.json');
  for(const key of ['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard']){
    const data=read('class/'+index[key]);
    const specs=[];
    for(const subclass of (data.subclass||[]).filter(x=>x.source==='XPHB')){
      const features=a.getSubclassFeatures(data,subclass,20);
      specs.push(...a.subclassResourceSpecs(subclass,features,{level:20,pb:6,mods:{str:5,dex:5,con:5,int:5,wis:5,cha:5}}));
    }
    assert.ok(specs.length>0,key);
    assert.equal(new Set(specs.map(x=>x.id)).size,specs.length,key);
  }
});
