import fs from 'node:fs';
import vm from 'node:vm';
const src = fs.readFileSync('/mnt/data/dnd_work/app.js','utf8');
function extract(start,end){const a=src.indexOf(start);const b=src.indexOf(end,a);if(a<0||b<0)throw new Error(`missing ${start}`);return src.slice(a,b)}
const helpers = [
  'function featMixedChoiceSpecs(feat) {',
  'function featExpertiseSpecs(feat) {',
  'function featAdditionalSpellChoiceSpecs(feat) {',
  'function mixedChoiceOptions(spec) {',
  'function speciesChoiceSpecs(species) {',
  'function reconcileSpeciesChoices(c, species) {',
  'function applyTextualRulesEffects(text, effects, sourceName = "Feature") {',
  'function applySelectedSpeciesOptionEffects(c, speciesObj, effects) {',
  'function autoLinkNoteKeywords(text) {',
  'function renderNoteText(text) {',
].map(x=>src.slice(src.indexOf(x), src.indexOf('\nfunction ',src.indexOf(x)+1)<0?src.length:src.indexOf('\nfunction ',src.indexOf(x)+1))).join('\n');
const context={
  ABILITIES:['str','dex','con','int','wis','cha'],
  ABILITY_NAMES:{str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'},
  SKILLS:{athletics:['str','Athletics'],arcana:['int','Arcana'],stealth:['dex','Stealth']},
  TOOL_GENERIC_OPTIONS:["Smith's Tools","Playing Cards"],
  DATA_SOURCE:'XPHB',
  textNorm:s=>String(s??'').replace(/[^a-z0-9]/gi,'').toLowerCase(),
  stripTags:s=>String(s??'').replace(/\{@[^}]+\}/g,m=>m.replace(/\{@[^ ]+\s+([^|}]+).*\}/,'$1')),
  plainTextFromEntries:function x(v){if(v==null)return '';if(typeof v==='string')return v;if(Array.isArray(v))return v.map(x).join(' ');if(typeof v==='object')return [v.name,x(v.entry),x(v.entries),x(v.items)].filter(Boolean).join(' ');return String(v)},
  normalizeSkillKey:s=>{const raw=String(s??'');const map={Athletics:'athletics',athletics:'athletics',Arcana:'arcana',arcana:'arcana',Stealth:'stealth',stealth:'stealth'};return map[raw]||null},
  normalizeAbilityKey:s=>{const v=String(s??'').toLowerCase();return ({strength:'str',dexterity:'dex',constitution:'con',intelligence:'int',wisdom:'wis',charisma:'cha',str:'str',dex:'dex',con:'con',int:'int',wis:'wis',cha:'cha'})[v]||null},
  standardLanguageOptions:()=>[{name:'Dwarvish'},{name:'Elvish'}],
  findLanguage:()=>null,
  findOfficialItemByName:()=>null,
  renderInline:s=>s,
};
vm.createContext(context);
vm.runInContext(helpers,context);

const effects={savingThrowAdvantages:new Set(),active:[]};
context.applyTextualRulesEffects('You have Advantage on Intelligence, Wisdom, and Charisma saving throws.', effects, 'Gnomish Cunning');
if (![...effects.savingThrowAdvantages].sort().join(',')==='cha,int,wis') { throw new Error('Gnomish Cunning parser failed: '+[...effects.savingThrowAdvantages]); }

const gnome={name:'Gnome',source:'XPHB',entries:[
  {name:'Gnomish Cunning',entries:['You have Advantage on Intelligence, Wisdom, and Charisma saving throws.']},
  {name:'Gnomish Lineage',entries:['Choose one of the following Gnomish Lineage options.',{type:'list',items:[{name:'Forest Gnome',entries:['Minor Illusion']},{name:'Rock Gnome',entries:['Mending']}]}]}
]};
const specs=context.speciesChoiceSpecs(gnome);
if(!specs.length || specs[0].options.length!==2) throw new Error('Gnome lineage choices not discovered: '+JSON.stringify(specs));
if(!specs[0].options.some(x=>x.name==='Forest Gnome') || !specs[0].options.some(x=>x.name==='Rock Gnome')) throw new Error('Gnome lineage option names wrong');

const skilled={name:'Skilled',source:'XPHB',skillToolLanguageProficiencies:[{choose:{from:['anySkill','anyTool'],count:3}}]};
if(context.featMixedChoiceSpecs(skilled).length!==3) throw new Error('Skilled did not generate 3 choice slots');
if(context.mixedChoiceOptions(context.featMixedChoiceSpecs(skilled)[0]).length<5) throw new Error('Mixed skill/tool options missing');

const mi={name:'Magic Initiate',source:'XPHB',additionalSpells:[{names:['Cleric','Druid','Wizard'],ability:{choose:{from:['intelligence','wisdom','charisma']}}}]};
const ms=context.featAdditionalSpellChoiceSpecs(mi);
if(ms.length!==1 || ms[0].names.length!==3 || ms[0].abilityFrom.length!==3) throw new Error('Magic Initiate choices not discovered');

const note=context.autoLinkNoteKeywords('Use a Bonus Action. The target has Disadvantage. It becomes Prone.');
if(!note.includes('{@variantrule Bonus Action|XPHB}') || !note.includes('{@variantrule Disadvantage|XPHB}') || !note.includes('{@condition Prone|XPHB}')) throw new Error('Notes keyword linker failed: '+note);
console.log('PASS rules audit helpers');
