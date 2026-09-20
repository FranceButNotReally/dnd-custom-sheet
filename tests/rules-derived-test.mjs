import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync('/mnt/data/dnd_work/app.js','utf8');
function extractFn(name){const start=`function ${name}(`;const a=src.indexOf(start);if(a<0)throw new Error(name);const b=src.indexOf('\nfunction ',a+1);return src.slice(a,b<0?src.length:b)}
const code=[extractFn('applyTextualRulesEffects'),extractFn('applySelectedSpeciesOptionEffects'),extractFn('buildDerivedEffects')].join('\n');
const ctx={
  ABILITIES:['str','dex','con','int','wis','cha'],ABILITY_NAMES:{str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'},
  SKILLS:{}, textNorm:s=>String(s??'').replace(/[^a-z0-9]/gi,'').toLowerCase(), stripTags:s=>String(s??''), effectiveD20Penalty:()=>0, getUnarmoredDefenseFormula:()=>null, classTableNumericValue:()=>0, hasNamedFeature:()=>true,
  optionalFeatureObjects:[], featureRechargeDetails:()=>({}), featSaveSpecs:()=>[], featSkillSpecs:()=>[], featMixedChoiceSpecs:()=>[], featExpertiseSpecs:()=>[], grantedSkillsFromMap:()=>[], canonicalLabel:s=>String(s||''), findOfficialItemByName:()=>null,
  speciesChoiceSpecs:(species)=>{return species?.__specs||[]},
};
vm.createContext(ctx);vm.runInContext(code,ctx);
const species={name:'Gnome',entries:[{name:'Gnomish Cunning',entries:['You have Advantage on Intelligence, Wisdom, and Charisma saving throws.']} ]};
const d={classFeatures:[],subclassFeatures:[],optionalFeatureObjects:[],speciesObj:species};
const c={level:1,conditions:[],speciesChoices:{},weaponMasteries:[],featSaveChoices:{},featSkillChoices:{},featMixedChoices:{},featExpertiseChoices:{}};
const e=ctx.buildDerivedEffects(c,d,[]);
const got=[...e.savingThrowAdvantages].sort();
if(got.join(',')!=='cha,int,wis')throw new Error('derived advantages wrong '+got);
console.log('PASS derived Gnomish Cunning');
