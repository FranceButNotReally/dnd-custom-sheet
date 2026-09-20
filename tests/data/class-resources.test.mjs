import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAppTestContext, resetState } from '../lib/app-context.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCK = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/5etools-version.json'), 'utf8'));
const DATA = path.join(ROOT, 'tests/.cache', LOCK.version, 'data');
const read = p => JSON.parse(fs.readFileSync(path.join(DATA, p), 'utf8'));
const a = loadAppTestContext();
resetState(a);

const index = read('class/index.json');
function record(key) {
  const data = read('class/' + index[key]);
  return {
    cls:(data.class || []).find(x => x.source === 'XPHB'),
    features:(data.classFeature || []).filter(x => x.classSource === 'XPHB'),
  };
}
const records = Object.fromEntries(['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'].map(k => [k, record(k)]));
const feature = (key,name,level=null) => records[key].features.find(f => f.name === name && (level == null || Number(f.level) === level));
const featuresThrough = (key,level) => records[key].features.filter(f => Number(f.level) <= level);
const d = (level,mods={}) => ({level,pb:a.proficiencyBonus(level),mods:{str:0,dex:0,con:0,int:0,wis:0,cha:0,...mods}});

function tableResource(key, name, level, mods={}) {
  const specs = a.classTableResourceSpecs(records[key].cls, featuresThrough(key,level), d(level,mods));
  return specs.find(x => x.name === name);
}
function featureResource(key, name, level, mods={}) {
  const specs = a.featureResourceSpecs(featuresThrough(key,level), d(level,mods), 'classfeature');
  return specs.find(x => x.name === name);
}

test('Barbarian Rage tracks table uses and partial Short Rest recovery', () => {
  const l1=tableResource('barbarian','Rage',1);
  const l3=tableResource('barbarian','Rage',3);
  assert.equal(l1.max,2);
  assert.equal(l1.recharge,'both');
  assert.equal(l1.shortRestore,'one');
  assert.equal(l3.max,3);
});

test('Bardic Inspiration respects Charisma minimum and Font of Inspiration recovery', () => {
  const l1=featureResource('bard','Bardic Inspiration',1,{cha:-1});
  assert.equal(l1.max,1);
  assert.equal(l1.recharge,'long');
  const l5=featureResource('bard','Bardic Inspiration',5,{cha:3});
  assert.equal(l5.max,3);
  assert.equal(l5.recharge,'both');
  assert.equal(l5.shortRestore,'all');
});

test('Cleric Channel Divinity tracks table uses and one-use Short Rest recovery', () => {
  const l2=tableResource('cleric','Channel Divinity',2);
  assert.equal(l2.max,2);
  assert.equal(l2.recharge,'both');
  assert.equal(l2.shortRestore,'one');
});

test('Druid Wild Shape tracks table uses and one-use Short Rest recovery', () => {
  const l2=tableResource('druid','Wild Shape',2);
  assert.equal(l2.max,2);
  assert.equal(l2.recharge,'both');
  assert.equal(l2.shortRestore,'one');
});

test('Fighter Second Wind scales from two to three uses and recovers one on Short Rest', () => {
  const l1=tableResource('fighter','Second Wind',1);
  const l4=tableResource('fighter','Second Wind',4);
  assert.equal(l1.max,2);
  assert.equal(l1.shortRestore,'one');
  assert.equal(l4.max,3);
});

test('Fighter Action Surge and Indomitable infer their level-gated use counts', () => {
  assert.equal(featureResource('fighter','Action Surge',2).max,1);
  assert.equal(featureResource('fighter','Action Surge',17).max,2);
  assert.equal(featureResource('fighter','Indomitable',9).max,1);
  assert.equal(featureResource('fighter','Indomitable',13).max,2);
  assert.equal(featureResource('fighter','Indomitable',17).max,3);
});

test('Monk Focus Points map the Focus Points table onto Monk\'s Focus', () => {
  const l2=tableResource('monk',"Monk's Focus",2);
  const l10=tableResource('monk',"Monk's Focus",10);
  assert.equal(l2.max,2);
  assert.equal(l2.recharge,'both');
  assert.equal(l2.shortRestore,'all');
  assert.equal(l10.max,10);
});

test('Paladin Lay on Hands is a level-scaled healing pool', () => {
  assert.equal(featureResource('paladin','Lay on Hands',1).max,5);
  assert.equal(featureResource('paladin','Lay on Hands',10).max,50);
  assert.equal(featureResource('paladin','Lay on Hands',10).recharge,'long');
});

test('Paladin Channel Divinity is tracked separately from Lay on Hands', () => {
  const l3=tableResource('paladin','Channel Divinity',3);
  assert.equal(l3.max,2);
  assert.equal(l3.recharge,'both');
  assert.equal(l3.shortRestore,'one');
});

test('Ranger Favored Enemy free Hunter\'s Mark casts use the class table', () => {
  const l1=tableResource('ranger','Favored Enemy',1);
  assert.equal(l1.max,2);
  assert.equal(l1.recharge,'long');
});

test('Ranger Wisdom-modifier resources honor minimum one use', () => {
  const tireless=featureResource('ranger','Tireless',10,{wis:-1});
  const veil=featureResource('ranger',"Nature's Veil",14,{wis:4});
  assert.equal(tireless.max,1);
  assert.equal(veil.max,4);
  assert.equal(veil.recharge,'long');
});

test('Sorcery Points map the table onto Font of Magic', () => {
  const l2=tableResource('sorcerer','Font of Magic',2);
  const l10=tableResource('sorcerer','Font of Magic',10);
  assert.equal(l2.max,2);
  assert.equal(l2.recharge,'long');
  assert.equal(l10.max,10);
});

test('Warlock Magical Cunning is a once-per-Long-Rest class resource', () => {
  const spec=featureResource('warlock','Magical Cunning',2);
  assert.equal(spec.max,1);
  assert.equal(spec.recharge,'long');
});

test('Wizard Arcane Recovery is a once-per-Long-Rest class resource', () => {
  const spec=featureResource('wizard','Arcane Recovery',1);
  assert.equal(spec.max,1);
  assert.equal(spec.recharge,'long');
});

test('Rogue Stroke of Luck is restored by a Short or Long Rest', () => {
  const spec=featureResource('rogue','Stroke of Luck',20);
  assert.equal(spec.max,1);
  assert.equal(spec.recharge,'both');
});
