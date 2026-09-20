import fs from 'fs';
const src = fs.readFileSync('/mnt/data/dnd_work/app.js','utf8');
function extract(name){
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`missing ${name}`);
  let brace = src.indexOf('{', start), depth = 0, end = brace;
  for (; end < src.length; end++) { const c=src[end]; if(c==='{') depth++; else if(c==='}' && --depth===0){end++;break;} }
  return src.slice(start,end);
}
function loadFn(name,args,helpers={}) { const code = extract(name); return Function(...Object.keys(helpers), `return (${code.match(new RegExp(`function ${name}\\([^]*?\\n}`))[0]});`)(...Object.values(helpers)); }

const effectCode = extract('applyTextualRulesEffects');
const effects={savingThrowAdvantages:new Set(),active:[]};
const ABILITIES=['str','dex','con','int','wis','cha'];
const ABILITY_NAMES={str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'};
const stripTags=s=>String(s).replace(/\{@[^}]+\}/g,'');
Function('applyTextualRulesEffects','effects','ABILITIES','ABILITY_NAMES','stripTags',`${effectCode}; return applyTextualRulesEffects;`)(
  'x', effects, ABILITIES, ABILITY_NAMES, stripTags
);
// Above call is awkward due to the function's internal naming; instead evaluate once directly.
const applyTextualRulesEffects = Function('ABILITIES','ABILITY_NAMES','stripTags',`${effectCode}; return applyTextualRulesEffects;`)(ABILITIES,ABILITY_NAMES,stripTags);
const e={savingThrowAdvantages:new Set(),active:[]};
applyTextualRulesEffects('You have Advantage on Intelligence, Wisdom, and Charisma saving throws.',e,'Gnomish Cunning');
if ([...e.savingThrowAdvantages].sort().join(',')!=='cha,int,wis') throw new Error('Gnomish Cunning save advantage failed');

const featCode=extract('reconcileFeatChoices');
const c={featAbilityChoices:{},featSaveChoices:{},featSkillChoices:{},featMixedChoices:{},featSpellChoices:{},featExpertiseChoices:{}};
const helpers={featAbilitySpecs:()=>[{from:['int','wis'],amount:1,fixed:false}],featSaveSpecs:()=>[{from:['dex','wis'],fixed:false}],featSkillSpecs:()=>[{from:['arcana','history'],fixed:false}],featMixedChoiceSpecs:()=>[],featAdditionalSpellChoiceSpecs:()=>[],featExpertiseSpecs:()=>[],featSpecKey:(feat,s)=>`${feat.name}|x|${s.from?.join(',')||''}`,DATA_SOURCE:'XPHB'};
const reconcile = Function(...Object.keys(helpers), `${featCode}; return reconcileFeatChoices;`)(...Object.values(helpers));
reconcile(c,[{name:'Test Feat',source:'XPHB'}]);
if(c.featAbilityChoices["Test Feat|x|int,wis"] !== null) throw new Error('feat ability choice silently defaults');
if(c.featSaveChoices["Test Feat|x|dex,wis"] !== null) throw new Error('feat save choice silently defaults');
if(c.featSkillChoices["Test Feat|x|arcana,history"] !== null) throw new Error('feat skill choice silently defaults');

const speciesCode=extract('speciesChoiceSpecs');
const speciesFn=Function('plainTextFromEntries','stripTags','textNorm','ABILITIES','ABILITY_NAMES',`${speciesCode}; return speciesChoiceSpecs;`)(
  x=>{ if(typeof x==='string') return x; if(Array.isArray(x)) return x.map(y=>typeof y==='string'?y:(y?.name||y?.title||y?.entry||JSON.stringify(y))).join(' '); if(x&&typeof x==='object') return [x.name,x.title,x.entry].filter(Boolean).join(' ') || JSON.stringify(x); return ''; },stripTags,s=>String(s).replace(/[^a-z0-9]/gi,'').toLowerCase(),ABILITIES,ABILITY_NAMES
);
const specs=speciesFn({name:'Gnome',source:'XPHB',entries:[{type:'list',name:'Gnomish Lineages',items:[{name:'Forest Gnome',entries:['Magic starts here.']},{name:'Rock Gnome',entries:['Technology.']}]}]});
if(specs.length!==1 || specs[0].options.length!==2) throw new Error('species lineage choice not detected');
if(!/lineage\|lineages/.test(extract('speciesChoiceSpecs'))) throw new Error('species lineage plural support missing');

const noteCode=src.slice(src.indexOf('function autoLinkNoteKeywords('), src.indexOf('function renderNoteText('));
for (const phrase of ['Bonus Action','Disadvantage','Prone']) if(!noteCode.includes(phrase)) throw new Error('note keyword coverage missing');
if(!noteCode.includes('{@${tag} ${phrase}|${DATA_SOURCE}}')) throw new Error('note linker template missing');

if (/cacheExtendedRules|Extended cache|extended-cache/i.test(src)) throw new Error('extended cache action still present');
console.log('PASS rules audit smoke');
