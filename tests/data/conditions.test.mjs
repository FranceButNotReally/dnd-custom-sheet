import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const LOCK=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/fixtures/5etools-version.json'),'utf8'));
const conditions=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/.cache',LOCK.version,'data/conditionsdiseases.json'),'utf8')).condition
  .filter(entry=>entry.source==='XPHB').map(entry=>entry.name).sort();
const a=loadAppTestContext();
resetState(a);

test('the explicit condition model covers every PHB condition exactly once',()=>{
  assert.deepEqual([...conditions],JSON.parse(JSON.stringify(a.CONDITIONS.slice().sort())));
  assert.deepEqual(Object.keys(a.CONDITION_RULES).sort(),JSON.parse(JSON.stringify(a.CONDITIONS.slice().sort())));
  for(const name of a.CONDITIONS) assert.ok(a.CONDITION_RULES[name].tags?.length,name);
});

test('incapacitating conditions break Concentration and apply their inherited rules',()=>{
  for(const name of ['Incapacitated','Paralyzed','Petrified','Stunned','Unconscious']){
    const state=a.conditionEffects({conditions:[name],exhaustion:0});
    assert.equal(state.incapacitated,true,name);
    assert.equal(state.concentrationBroken,true,name);
  }
  const paralyzed=a.conditionEffects({conditions:['Paralyzed'],exhaustion:0});
  assert.equal(paralyzed.speedZero,true);
  assert.deepEqual([...paralyzed.autoFailSaves].sort(),['dex','str']);
  assert.equal(paralyzed.nearbyCriticals,true);

  const migrated=a.migrateCharacter({schema:18,conditions:['Stunned'],concentration:'Fly'});
  assert.equal(migrated.concentration,null);
});

test('condition mechanics expose speed, attacks, checks, saves, initiative, and resistance effects',()=>{
  const restrained=a.conditionEffects({conditions:['Restrained'],exhaustion:0});
  assert.equal(restrained.speedZero,true);
  assert.equal(restrained.attackDisadvantage,true);
  assert.equal(restrained.incomingAttackAdvantage,true);
  assert.equal(restrained.saveDisadvantages.has('dex'),true);

  const poisoned=a.conditionEffects({conditions:['Poisoned'],exhaustion:0});
  assert.equal(poisoned.attackDisadvantage,true);
  assert.equal(poisoned.abilityCheckDisadvantage,true);

  const invisible=a.conditionEffects({conditions:['Invisible'],exhaustion:0});
  assert.equal(invisible.attackAdvantage,false);
  assert.equal(invisible.conditionalAttackAdvantage,true);
  assert.equal(invisible.conditionalIncomingAttackDisadvantage,true);
  assert.equal(invisible.initiativeAdvantage,true);

  const prone=a.conditionEffects({conditions:['Prone'],exhaustion:0});
  assert.equal(prone.attackDisadvantage,true);
  assert.equal(prone.conditionalIncomingAttackAdvantage,true);
  assert.equal(prone.conditionalIncomingAttackDisadvantage,true);

  const petrified=a.conditionEffects({conditions:['Petrified'],exhaustion:0});
  assert.equal(petrified.allDamageResistance,true);
  assert.equal(petrified.conditionImmunities.has('Poisoned'),true);
});

test('attack profiles apply condition Advantage, Disadvantage, and cancellation',()=>{
  const item={name:'Longsword',source:'XPHB',weaponCategory:'Martial',property:[],dmg1:'1d8',dmgType:'S'};
  const base={mods:{str:3,dex:1},stats:{str:16,dex:12},pb:3,d20Penalty:0,effects:{attackBonuses:{},damageBonuses:{}},proficiencies:{weapons:['Martial Weapons']},armorTrainingPenalty:false};
  let profile=a.weaponAttackProfile(item,{...base,conditionEffects:a.conditionEffects({conditions:['Poisoned']})});
  assert.equal(profile.attackRollState,'disadvantage');
  profile=a.weaponAttackProfile(item,{...base,conditionEffects:a.conditionEffects({conditions:['Invisible']})});
  assert.equal(profile.attackRollState,'');
  assert.ok(profile.warnings.some(line=>/Conditional Advantage/i.test(line)));
  profile=a.weaponAttackProfile(item,{...base,conditionEffects:a.conditionEffects({conditions:['Invisible','Poisoned']})});
  assert.equal(profile.attackRollState,'disadvantage');
  assert.ok(profile.warnings.some(line=>/Conditional Advantage/i.test(line)));
  profile=a.weaponAttackProfile(item,{...base,conditionEffects:{attackAdvantage:true,attackDisadvantage:true}});
  assert.equal(profile.attackRollState,'');
  assert.ok(profile.warnings.some(line=>/cancel/i.test(line)));
  profile=a.weaponAttackProfile(item,{...base,conditionEffects:a.conditionEffects({conditions:['Stunned']})});
  assert.equal(profile.attackBlocked,true);
  assert.ok(profile.warnings.some(line=>/Unavailable/i.test(line)));
});

test('Exhaustion remains cumulative in the condition model',()=>{
  const state=a.conditionEffects({conditions:[],exhaustion:4});
  assert.equal(state.selected.has('Exhaustion'),true);
  assert.match(state.active[0],/−8 to D20 Tests/);
  assert.match(state.active[0],/−20 ft\. Speed/);
  assert.equal(a.deathState({hpCurrent:20,exhaustion:6,deathSaves:{success:0,failure:0}},20),'dead');
});
