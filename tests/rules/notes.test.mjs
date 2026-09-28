import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAppTestContext } from '../lib/app-context.mjs';
const a = loadAppTestContext();

test('weapon notes are explanatory and include property/mastery metadata', () => {
  const note = a.weaponNotePayload({name:'Dagger', property:['F','L','T'], mastery:'Nick'});
  assert.equal('damage' in note, false, "note payload should not duplicate the row damage field");
  assert.equal('attackBonus' in note, false, "note payload should not duplicate the row attack-bonus field");
  assert.ok(String(JSON.stringify(note)).includes('Finesse'));
  assert.ok(String(JSON.stringify(note)).includes('Nick'));
  assert.equal(note.kind, 'weapon');
  assert.ok(Array.isArray(note.properties));
  assert.ok(Array.isArray(note.mastery));
});

test('weapon notes include current mastery values when an attack profile is available', () => {
  const item={name:'Battleaxe',source:'XPHB',weaponCategory:'Martial',type:'M',dmg1:'1d8',dmg2:'1d10',dmgType:'S',property:['V'],mastery:'Topple'};
  const d={mods:{str:4,dex:1},stats:{str:18,dex:12},pb:3,d20Penalty:0,proficiencies:{weapons:['Martial Weapons']},effects:{attackBonuses:{},damageBonuses:{}},armorTrainingPenalty:false};
  const profile=a.weaponAttackProfile(item,d,[item],{equipped:true,wielding:true});
  const note=a.weaponNotePayload(item,[],profile,d);
  assert.equal(note.mastery[0].resolution.saveDC,15);
  assert.match(note.mastery[0].resolution.summary,/Constitution save DC 15/);
  assert.match(note.mastery[0].resolution.summary,/Prone/);
});

test('note keyword linker maps rules terms to the same reference system', () => {
  const linked = a.autoLinkNoteKeywords('Use a Bonus Action. The target has Disadvantage and becomes Prone.');
  assert.match(linked, /\{@variantrule Bonus Action\|XPHB\}/);
  assert.match(linked, /\{@variantrule Disadvantage\|XPHB\}/);
  assert.match(linked, /\{@condition Prone\|XPHB\}/);
});
