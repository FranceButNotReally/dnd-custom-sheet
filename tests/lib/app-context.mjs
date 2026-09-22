import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const APP_PATH = path.join(ROOT, 'app.js');

function makeDocumentStub() {
  return {
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() {
      return {
        id: '', className: '', hidden: false, innerHTML: '', style: {},
        appendChild() {}, remove() {}, querySelector() { return null; },
        querySelectorAll() { return []; }, addEventListener() {},
      };
    },
    addEventListener() {},
    body: { appendChild() {} },
  };
}

/**
 * Evaluate the real application source without running browser startup.
 * This deliberately exposes the real functions rather than copied test versions,
 * so a renamed or removed implementation makes the test harness fail.
 */
export function loadAppTestContext() {
  const source = fs.readFileSync(APP_PATH, 'utf8');
  const startupMarker = '\nensureCacheProgressRoot();';
  const cutoff = source.indexOf(startupMarker);
  if (cutoff < 0) throw new Error('Could not locate application startup boundary.');
  const runnable = source.slice(0, cutoff);
  const apiNames = [
    'state', 'ABILITIES', 'ABILITY_NAMES', 'STANDARD_ARRAY', 'STANDARD_ARRAY_BY_CLASS', 'STANDARD_LANGUAGE_NAMES',
    'SKILLS', 'CONDITIONS', 'CONDITION_RULES', 'SPECIAL_SENSES', 'WEAPON_PROPERTY_INFO', 'WEAPON_MASTERY_INFO', 'SPELL_COMPONENT_INFO',
    'emptyCharacter', 'migrateCharacter', 'abilityMod', 'formatMod', 'proficiencyBonus', 'selectedFeatObjects', 'featInstanceKey', 'featSpecKey', 'isAbilityScoreImprovementFeat',
    'classSpellSlots', 'classCantrips', 'classPrepared', 'classKnownSpells', 'spellcastingSource', 'normalizeSpellRef', 'fixedAdditionalSpellRefs', 'hitDieFaces', 'defaultMaxHp',
    'skillChoiceSpec', 'optionalFeatureProgression', 'progressionFeatSlots', 'availableOptionalFeatures', 'optionalFeatureIsRepeatable', 'optionalFeaturePrerequisiteMet', 'reconcileOptionalFeatureChoices', 'selectedOptionalFeatureObjects', 'optionalFeatureFeatChoiceSpecs', 'reconcileFeatureFeatChoices', 'featPrerequisiteMet', 'featCanSelectForSlot', 'getSubclassUnlockLevel', 'getClassFeatures', 'getSubclassFeatures', 'classFeatureChoiceSpecs', 'reconcileClassFeatureChoices', 'selectedClassFeatureOptionObjects', 'preSubclassSavingThrowProficiencies', 'subclassFeatureChoiceSpecs', 'selectedClassFeatureChoiceOption', 'selectedAdditionalSpellGroupName', 'resolveClassFeatureRef', 'classFeatureProficiencyChoiceSpecs', 'reconcileClassProficiencyChoices', 'applyClassProficiencyChoices',
    'featAbilitySpecs', 'featSaveSpecs', 'featSkillSpecs', 'featToolSpecs', 'featMixedChoiceSpecs', 'featExpertiseSpecs',
    'featAdditionalSpellChoiceSpecs', 'parseSpellChoiceFilter', 'fixedSpellRefsInAdditionalGroup', 'spellMatchesChoiceFilter', 'featSpellChoiceOptions', 'activeFeatSpellPlan', 'featGrantedSpellRefs', 'reconcileFeatSpellSelection', 'classFeatureSpellChoiceSpecs', 'optionalFeatureSpellChoiceSpecs', 'featureSpellChoiceOptions', 'reconcileFeatureSpellChoices', 'featureGrantedSpellRefs', 'featDamageChoiceSpecs', 'mixedChoiceOptions', 'speciesChoiceSpecs', 'reconcileSpeciesChoices',
    'reconcileFeatChoices', 'backgroundAbilitySpec', 'reconcileBackgroundAbilityChoices', 'backgroundFeatNames', 'calculateFinalStats',
    'proficiencyChoiceSpecs', 'proficiencyOverlaps', 'hasWeaponProficiency', 'weaponPropertyCode', 'weaponPropertyCodes', 'weaponAbility', 'weaponFlags',
    'itemTypeCode', 'equipmentCategory', 'numericItemBonus', 'itemRequiresAttunement', 'itemEffectActive', 'reconcileAttunement', 'inventoryWeight', 'carryingCapacity', 'heavyWeaponRequirement', 'weaponDamageText', 'weaponAttackProfile', 'weaponMasteryResolution',
    'hasArmorTraining', 'calcAutoAc', 'classTableNumericValue', 'getUnarmoredDefenseFormula', 'applyTextualRulesEffects',
    'applySelectedSpeciesOptionEffects', 'applyDarkvisionBonus', 'collectSenseRefs', 'conditionEffects', 'buildDerivedEffects', 'featureRechargeDetails', 'featureResourceSpecs',
    'classTableResourceSpecs', 'featResourceSpecs', 'reconcileResources', 'weaponMasteryCount', 'masteryObjects', 'masteryLabel',
    'resetDeathSaves', 'deathState', 'recordDeathSave', 'applyDamage', 'applyHealing', 'restoreResourceForRest', 'applyShortRest', 'spendHitDice', 'applyLongRest', 'countSlotUsed', 'setSlotUsed',
    'normalizeAbilityKey', 'normalizeSkillKey', 'grantedSkillsFromMap', 'friendlyProficiencyKey', 'normalizedProficiencyLabel',
    'damageTypeName', 'formatSpellRange', 'formatSpellTime', 'formatDuration', 'dfltSpeed', 'sizeLabel', 'resourceRechargeLabel', 'inferFeatureUseMaxFromText',
    'autoLinkNoteKeywords', 'renderNoteText', 'weaponNotePayload', 'spellNotePayload', 'matchesSearchText',
    'spellLookupEntry', 'lookupSpellHasClass', 'lookupSpellHasSubclass', 'spellAvailableToClassName', 'spellAvailableToCharacter', 'spellById', 'maxCastableSpellLevel', 'dedupeSpellRefs', 'usesWizardSpellbook', 'spellSelectionAllowed', 'reconcileSpellSelections', 'findOfficial', 'findBackground', 'findSpecies', 'findFeat',
    'findLanguage', 'mergeItemCatalogs', 'buildItemIndex', 'equipmentCatalogDiagnostics', 'officialItemCatalog',
    'officialWeaponCatalog', 'itemFromCatalog', 'findOfficialItemByName', 'friendlyProficiencyKey',
    'parseProficiencyDisplay', 'allLanguageOptionsForChoice', 'standardLanguageOptions', 'allToolOptionsForChoice',
  ];

  const sandbox = {
    console,
    navigator: { onLine: true },
    document: makeDocumentStub(),
    crypto: globalThis.crypto,
    URL,
    URLSearchParams,
    AbortController,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    fetch: async () => { throw new Error('fetch disabled in unit-test context'); },
    atob: globalThis.atob,
    btoa: globalThis.btoa,
  };
  vm.createContext(sandbox);
  const expose = `\n;globalThis.__TEST_API__ = {${apiNames.map(name => `${name}: typeof ${name} !== 'undefined' ? ${name} : undefined`).join(',')}};`;
  vm.runInContext(runnable + expose, sandbox, { filename: APP_PATH });
  for (const [name, value] of Object.entries(sandbox.__TEST_API__)) {
    if (value === undefined) throw new Error(`Test API function/constant missing: ${name}`);
  }
  return sandbox.__TEST_API__;
}

export function resetState(api) {
  api.state.character = null;
  api.state.data = {
    books: null, classIndex: null, races: null, backgrounds: null, feats: null, languages: null,
    optionalfeatures: null, spells: null, spellIndex: null, spellSourceLookup: null, items: null, conditionsdiseases: null,
    variantrules: null, actions: null, classFiles: new Map(), spellFiles: new Map(), referenceCache: new Map(),
    officialSources: new Set(['XPHB', 'XDMG', 'XMM']), sourceMeta: [], itemIndex: new Map(), itemSourceData: null, itemsBase: null,
  };
  api.state.lastDerived = null;
}
