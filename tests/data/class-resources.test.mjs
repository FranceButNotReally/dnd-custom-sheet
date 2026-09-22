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
    data,
    cls:(data.class || []).find(x => x.source === 'XPHB'),
    features:(data.classFeature || []).filter(x => x.classSource === 'XPHB'),
    subclasses:(data.subclass || []).filter(x => x.source === 'XPHB'),
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
function subclassSpecs(key, name, level, mods={}) {
  const record = records[key];
  const subclass = record.subclasses.find(value => value.name === name);
  if (!subclass) throw new Error(`Unknown ${key} subclass: ${name}`);
  const features = a.getSubclassFeatures(record.data, subclass, level);
  return a.subclassResourceSpecs(subclass, features, d(level,mods));
}
function subclassResource(key, subclass, resource, level, mods={}) {
  return subclassSpecs(key,subclass,level,mods).find(value => value.name === resource);
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

test('subclass dice pools follow every PHB scaling breakpoint', () => {
  assert.deepEqual([3,6,12,17].map(level => subclassResource('barbarian','Path of the Zealot','Warrior of the Gods Dice',level).max),[4,5,6,7]);

  const superiority = [3,7,10,15,18].map(level => {
    const spec=subclassResource('fighter','Battle Master','Superiority Dice',level);
    return [spec.max,spec.die];
  });
  assert.deepEqual(JSON.parse(JSON.stringify(superiority)),[[4,'d8'],[5,'d8'],[5,'d10'],[6,'d10'],[6,'d12']]);

  for (const [key,name] of [['fighter','Psi Warrior'],['rogue','Soulknife']]) {
    const psionic = [3,5,9,11,13,17].map(level => {
      const spec=subclassResource(key,name,'Psionic Energy Dice',level);
      return [spec.max,spec.die,spec.shortRestore];
    });
    assert.deepEqual(JSON.parse(JSON.stringify(psionic)),[[4,'d6','one'],[6,'d8','one'],[8,'d8','one'],[8,'d10','one'],[10,'d10','one'],[12,'d12','one']],name);
  }
});

test('subclass resource upgrades and ability-based pools retain exact semantics', () => {
  assert.equal(subclassResource('cleric','Light Domain','Warding Flare',3,{wis:3}).recharge,'long');
  assert.equal(subclassResource('cleric','Light Domain','Warding Flare',6,{wis:3}).recharge,'both');
  assert.equal(subclassResource('wizard','Diviner','Portent Rolls',3).max,2);
  assert.equal(subclassResource('wizard','Diviner','Portent Rolls',14).max,3);

  const ward=subclassResource('wizard','Abjurer','Arcane Ward Hit Points',20,{int:5});
  assert.equal(ward.max,45);
  assert.equal(ward.initialCurrent,0);
  assert.equal(ward.preserveCurrent,true);
  assert.equal(ward.longReset,'zero');
  assert.equal(ward.unit,'HP');

  const light3=subclassResource('warlock','Celestial Patron','Healing Light Dice',3);
  const light20=subclassResource('warlock','Celestial Patron','Healing Light Dice',20);
  assert.deepEqual([light3.max,light3.die,light20.max,light20.die],[4,'d6',21,'d6']);
});

test('separate free casts and alternate recovery routes remain visible resources', () => {
  const land=subclassSpecs('druid','Circle of the Land',20);
  assert.deepEqual(JSON.parse(JSON.stringify(land.map(value => value.name))),['Circle Spell Free Cast','Natural Recovery']);
  assert.equal(land[1].unit,'10 slot levels');

  const illusionist=subclassSpecs('wizard','Illusionist',20);
  assert.ok(illusionist.some(value => value.name === 'Summon Beast Free Cast'));
  assert.ok(illusionist.some(value => value.name === 'Summon Fey Free Cast'));

  const berserker=subclassResource('barbarian','Path of the Berserker','Intimidating Presence',20);
  assert.match(berserker.recoveryNote,/expend a use of your Rage/i);
  assert.equal(featureResource('paladin','Lay on Hands',10).recoveryNote,'');
});

test('all 48 PHB subclasses have exact level-20 resource profiles', () => {
  const expected = {
    'Path of the Berserker':[['Intimidating Presence',1,'long','all','']],
    'Path of the Zealot':[['Zealous Presence',1,'long','all',''],['Rage of the Gods',1,'long','all',''],['Warrior of the Gods Dice',7,'long','all','d12']],
    'College of Glamour':[['Beguiling Magic',1,'long','all',''],['Mantle of Majesty',1,'long','all','']],
    'Light Domain':[['Warding Flare',5,'both','all',''],['Corona of Light',5,'long','all','']],
    'War Domain':[['War Priest',5,'both','all','']],
    'Circle of the Land':[['Circle Spell Free Cast',1,'long','all',''],['Natural Recovery',1,'long','all','10 slot levels']],
    'Circle of the Moon':[['Moonlight Step',5,'long','all','']],
    'Circle of the Stars':[['Star Map',5,'long','all',''],['Cosmic Omen',5,'long','all','']],
    'Battle Master':[['Superiority Dice',6,'both','all','d12'],['Know Your Enemy',1,'long','all','']],
    'Psi Warrior':[['Bulwark of Force',1,'long','all',''],['Psionic Energy Dice',12,'both','one','d12'],['Telekinesis Free Cast',1,'long','all','']],
    'Warrior of Mercy':[['Flurry of Healing and Harm',1,'long','all',''],['Hand of Ultimate Mercy',1,'long','all','']],
    'Warrior of the Open Hand':[['Wholeness of Body',5,'long','all','']],
    'Oath of Devotion':[['Holy Nimbus',1,'long','all','']],
    'Oath of Glory':[['Glorious Defense',5,'long','all',''],['Living Legend',1,'long','all','']],
    'Oath of the Ancients':[['Undying Sentinel',1,'long','all',''],['Elder Champion',1,'long','all','']],
    'Oath of Vengeance':[['Avenging Angel',1,'long','all','']],
    'Fey Wanderer':[['Misty Wanderer',5,'long','all',''],['Summon Fey Free Cast',1,'long','all','']],
    'Gloom Stalker':[['Dread Ambusher',5,'long','all','']],
    'Arcane Trickster':[['Spell Thief',1,'long','all','']],
    'Soulknife':[['Psychic Veil',1,'long','all',''],['Rend Mind',1,'long','all',''],['Psionic Energy Dice',12,'both','one','d12']],
    'Aberrant Sorcery':[['Warping Implosion',1,'long','all','']],
    'Clockwork Sorcery':[['Restore Balance',5,'long','all',''],['Trance of Order',1,'long','all',''],['Clockwork Cavalcade',1,'long','all','']],
    'Draconic Sorcery':[['Dragon Wings',1,'long','all',''],['Summon Dragon Free Cast',1,'long','all','']],
    'Wild Magic Sorcery':[['Tamed Surge',1,'long','all',''],['Tides of Chaos',1,'long','all','']],
    'Archfey Patron':[['Steps of the Fey',5,'long','all',''],['Beguiling Defenses',1,'long','all','']],
    'Celestial Patron':[['Searing Vengeance',1,'long','all',''],['Healing Light Dice',21,'long','all','d6']],
    'Fiend Patron':[["Dark One's Own Luck",5,'long','all',''],['Hurl Through Hell',1,'long','all','']],
    'Great Old One Patron':[['Clairvoyant Combatant',1,'both','all','']],
    'Abjurer':[['Arcane Ward Hit Points',45,'','all','HP']],
    'Diviner':[['The Third Eye',1,'both','all',''],['Portent Rolls',3,'long','all','rolls']],
    'Evoker':[['Safe Overchannel',1,'long','all','use']],
    'Illusionist':[['Illusory Self',1,'both','all',''],['Summon Beast Free Cast',1,'long','all',''],['Summon Fey Free Cast',1,'long','all','']],
  };
  let count=0;
  for (const [key,record] of Object.entries(records)) {
    for (const subclass of record.subclasses) {
      count++;
      const actual=subclassSpecs(key,subclass.name,20,{str:5,dex:5,con:5,int:5,wis:5,cha:5})
        .map(value => [value.name,value.max,value.recharge,value.shortRestore,value.die||value.unit||'']);
      assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected[subclass.name]||[],subclass.name);
    }
  }
  assert.equal(count,48);
});
