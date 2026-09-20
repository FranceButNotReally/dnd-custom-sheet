const REPO = "5etools-mirror-3/5etools-src";
const GITHUB_RELEASE_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const RAW_ROOT = `https://raw.githubusercontent.com/${REPO}`;
const DATA_SOURCE = "XPHB";
const CORE_2024_DATE = "2024-09-17";
const APP_VERSION = "0.37.0";

const PATHS = {
  books: "data/books.json",
  classIndex: "data/class/index.json",
  races: "data/races.json",
  backgrounds: "data/backgrounds.json",
  feats: "data/feats.json",
  languages: "data/languages.json",
  optionalfeatures: "data/optionalfeatures.json",
  spellIndex: "data/spells/index.json",
  items: "data/items.json",
  itemsBase: "data/items-base.json",
  conditionsdiseases: "data/conditionsdiseases.json",
  variantrules: "data/variantrules.json",
  actions: "data/actions.json",
};

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
const ABILITY_LABELS = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };
const ABILITY_NAMES = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
const SKILLS = {
  acrobatics: ["dex", "Acrobatics"],
  animalHandling: ["wis", "Animal Handling"],
  arcana: ["int", "Arcana"],
  athletics: ["str", "Athletics"],
  deception: ["cha", "Deception"],
  history: ["int", "History"],
  insight: ["wis", "Insight"],
  intimidation: ["cha", "Intimidation"],
  investigation: ["int", "Investigation"],
  medicine: ["wis", "Medicine"],
  nature: ["int", "Nature"],
  perception: ["wis", "Perception"],
  performance: ["cha", "Performance"],
  persuasion: ["cha", "Persuasion"],
  religion: ["int", "Religion"],
  sleightOfHand: ["dex", "Sleight of Hand"],
  stealth: ["dex", "Stealth"],
  survival: ["wis", "Survival"],
};
const CONDITIONS = ["Blinded", "Charmed", "Deafened", "Exhaustion", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious"];
const SPECIAL_SENSES = ["Blindsight", "Darkvision", "Tremorsense", "Truesight"];
const SPECIAL_SENSE_FALLBACKS = {
  Blindsight: { name: "Blindsight", source: "XPHB", entries: ["A creature with Blindsight can perceive its surroundings without relying on sight within the specified range."] },
  Darkvision: { name: "Darkvision", source: "XPHB", entries: ["A creature with Darkvision can see in Dim Light within the specified range as if it were Bright Light and in Darkness within that range as if it were Dim Light."] },
  Tremorsense: { name: "Tremorsense", source: "XPHB", entries: ["A creature with Tremorsense can detect and pinpoint the origin of vibrations within the specified range, provided the creature and the source of the vibrations are in contact with the same ground or substance."] },
  Truesight: { name: "Truesight", source: "XPHB", entries: ["A creature with Truesight can see in normal and magical Darkness, notice invisible creatures and objects, automatically detect visual illusions, succeed on saving throws against them, and perceive the original form of a transformed creature or object."] },
};
const SPELL_SCHOOLS = { A: "Abjuration", C: "Conjuration", D: "Divination", E: "Enchantment", V: "Evocation", I: "Illusion", N: "Necromancy", T: "Transmutation" };
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const STANDARD_ARRAY_BY_CLASS = {
  Barbarian: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
  Bard:      { str: 8,  dex: 14, con: 12, int: 13, wis: 10, cha: 15 },
  Cleric:    { str: 14, dex: 8,  con: 13, int: 10, wis: 15, cha: 12 },
  Druid:    { str: 8,  dex: 12, con: 14, int: 13, wis: 15, cha: 10 },
  Fighter:  { str: 15, dex: 14, con: 13, int: 8,  wis: 10, cha: 12 },
  Monk:     { str: 12, dex: 15, con: 13, int: 10, wis: 14, cha: 8 },
  Paladin:  { str: 15, dex: 10, con: 13, int: 8,  wis: 12, cha: 14 },
  Ranger:   { str: 12, dex: 15, con: 13, int: 8,  wis: 14, cha: 10 },
  Rogue:    { str: 12, dex: 15, con: 13, int: 14, wis: 10, cha: 8 },
  Sorcerer: { str: 10, dex: 13, con: 14, int: 8,  wis: 12, cha: 15 },
  Warlock:  { str: 8,  dex: 14, con: 13, int: 12, wis: 10, cha: 15 },
  Wizard:   { str: 8,  dex: 12, con: 13, int: 15, wis: 14, cha: 10 },
};
const STANDARD_LANGUAGE_NAMES = ["Common Sign Language", "Draconic", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc"];
const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

const WEAPON_PROPERTY_INFO = {
  A: { label: "Ammunition", description: "Requires the appropriate ammunition to make a ranged attack; each attack expends one piece of ammunition." },
  F: { label: "Finesse", description: "You can choose Strength or Dexterity for the attack and damage rolls, using the same ability for both." },
  H: { label: "Heavy", description: "You have Disadvantage on attacks with this weapon when the relevant Strength or Dexterity requirement for Heavy is not met." },
  L: { label: "Light", description: "After attacking with a Light weapon, you can make one extra attack later on the same turn with a different Light weapon as a Bonus Action." },
  LD: { label: "Loading", description: "You can fire only one piece of ammunition from this weapon when you use an action, Bonus Action, or Reaction to fire it." },
  R: { label: "Reach", description: "The weapon adds 5 feet to your reach for attacks and Opportunity Attacks made with it." },
  T: { label: "Thrown", description: "You can throw the weapon for a ranged attack and draw it as part of that attack." },
  "2H": { label: "Two-Handed", description: "You need two hands when you attack with the weapon." },
  V: { label: "Versatile", description: "You can use the weapon with one or two hands; its listed parenthetical damage applies when used with two hands." },
};

const WEAPON_MASTERY_INFO = {
  cleave: "When you hit a creature with this weapon, you can make a qualifying extra attack against another creature within the weapon's reach. The extra attack uses the same ability modifier and doesn't add that modifier to its damage unless the modifier is negative.",
  graze: "When an attack with this weapon misses, you can deal damage to the target equal to the ability modifier used for the attack. The damage is the weapon's damage type and is affected only by increasing that ability modifier.",
  nick: "When you make the extra attack granted by the Light property, you can make that extra attack as part of the Attack action instead of as a Bonus Action. You can use this extra attack only once per turn.",
  push: "When you hit a creature with this weapon, you can push it up to 10 feet directly away from you if it is Large or smaller.",
  sap: "When you hit a creature with this weapon, it has Disadvantage on its next attack roll before the start of your next turn.",
  slow: "When you hit a creature and deal damage with this weapon, its Speed can be reduced by 10 feet until the start of your next turn. Repeated hits don't increase the reduction beyond 10 feet.",
  topple: "When you hit a creature with this weapon, you can force a Constitution saving throw against 8 + your Proficiency Bonus + the ability modifier used for the attack. On a failure, the target has the Prone condition.",
  vex: "When you hit a creature and deal damage with this weapon, you have Advantage on your next attack roll against that creature before the end of your next turn.",
};

const SPELL_COMPONENT_INFO = {
  V: { label: "Verbal (V)", description: "The spell requires spoken words." },
  S: { label: "Somatic (S)", description: "The spell requires a somatic gesture." },
  M: { label: "Material (M)", description: "The spell requires the listed material component or a suitable spellcasting focus when the rules allow one." },
};

const state = {
  view: "sheet",
  online: navigator.onLine,
  busy: false,
  cacheProgress: null,
  libraryReady: false,
  version: null,
  lastSync: null,
  lastReleaseCheck: null,
  data: { books: null, classIndex: null, races: null, backgrounds: null, feats: null, languages: null, optionalfeatures: null, spells: null, spellIndex: null, items: null, conditionsdiseases: null, variantrules: null, actions: null, classFiles: new Map(), spellFiles: new Map(), referenceCache: new Map(), officialSources: new Set(), sourceMeta: [] },
  character: null,
  deferredInstallPrompt: null,
  spellPickerTab: "prepared",
  sheetPage: 1,
  lastDerived: null,
};

const DB_NAME = "dnd-2024-5etools-sheet";
const DB_VERSION = 5;
let dbPromise;

function emptyCharacter() {
  return {
    schema: 15,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: "New Character",
    player: "",
    level: 1,
    xp: 0,
    class: null,
    subclass: null,
    species: null,
    background: null,
    feat: null,
    feats: [],
    additionalFeats: [],
    featAbilityChoices: {},
    featSaveChoices: {},
    featSkillChoices: {},
    featMixedChoices: {},
    featSpellChoices: {},
    featExpertiseChoices: {},
    speciesChoices: {},
    baseStats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    manualAbilityBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    classSkillChoices: [],
    customSkillProficiencies: [],
    expertise: [],
    manualWeaponProficiencies: [],
    manualArmorProficiencies: [],
    manualToolProficiencies: [],
    manualLanguages: [],
    languageChoices: [],
    standardLanguages: [null, null],
    backgroundAbility: { mode: "split", plus2: null, plus1: null, plus1b: null, plus1c: null },
    hpCurrent: null,
    hpAuto: true,
    hpMaxOverride: null,
    tempHp: 0,
    acOverride: null,
    speedOverride: null,
    hitDiceUsed: 0,
    deathSaves: { success: 0, failure: 0 },
    conditions: [],
    spellbook: [],
    knownSpells: [],
    preparedSpells: [],
    cantrips: [],
    spellSlotsUsed: [],
    inventory: [],
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    resources: [],
    senses: [],
    attacks: [],
    notes: "",
    optionalFeatureChoices: {},
    weaponMasteries: [],
    startingEquipment: { class: null, background: null },
    progressionFeats: {},
    toolChoices: [],
    languageChoiceSlots: {},
    toolChoiceSlots: {},
    appearance: "",
    age: "",
    height: "",
    weight: "",
    eyes: "",
    skin: "",
    hair: "",
    alignment: "",
    faith: "",
    allies: "",
    organization: "",
    backstory: "",
    personality: "",
    ideals: "",
    bonds: "",
    flaws: "",
  };
}

function migrateCharacter(raw) {
  const base = emptyCharacter();
  if (!raw || typeof raw !== "object") return base;
  const c = { ...base, ...raw };
  c.schema = 15;
  c.baseStats = { ...base.baseStats, ...(raw.baseStats || raw.stats || {}) };
  c.xp = Math.max(0, Number(raw.xp || 0));
  c.manualAbilityBonuses = { ...base.manualAbilityBonuses, ...(raw.manualAbilityBonuses || {}) };
  c.deathSaves = { ...base.deathSaves, ...(raw.deathSaves || {}) };
  c.currency = { ...base.currency, ...(raw.currency || {}) };
  c.backgroundAbility = { ...base.backgroundAbility, ...(raw.backgroundAbility || {}) };
  if (!['split','three'].includes(c.backgroundAbility.mode)) c.backgroundAbility.mode = 'split';
  c.backgroundAbility.plus2 = c.backgroundAbility.plus2 || null;
  c.backgroundAbility.plus1 = c.backgroundAbility.plus1 || null;
  c.backgroundAbility.plus1b = c.backgroundAbility.plus1b || null;
  c.backgroundAbility.plus1c = c.backgroundAbility.plus1c || null;
  c.classSkillChoices = Array.isArray(raw.classSkillChoices) ? raw.classSkillChoices.map(normalizeSkillKey).filter(Boolean) : [];
  c.expertise = Array.isArray(raw.expertise) ? raw.expertise.map(normalizeSkillKey).filter(Boolean) : [];
  c.customSkillProficiencies = Array.isArray(raw.customSkillProficiencies)
    ? raw.customSkillProficiencies
    : (Array.isArray(raw.skillProficiencies) ? raw.skillProficiencies : []);
  c.manualWeaponProficiencies = Array.isArray(raw.manualWeaponProficiencies) ? raw.manualWeaponProficiencies : [];
  c.manualArmorProficiencies = Array.isArray(raw.manualArmorProficiencies) ? raw.manualArmorProficiencies : [];
  c.manualToolProficiencies = Array.isArray(raw.manualToolProficiencies) ? raw.manualToolProficiencies : [];
  c.manualLanguages = Array.isArray(raw.manualLanguages) ? raw.manualLanguages : [];
  c.languageChoices = Array.isArray(raw.languageChoices) ? raw.languageChoices : [];
  c.standardLanguages = Array.isArray(raw.standardLanguages) ? raw.standardLanguages.slice(0, 2).map(x => x ? String(x) : null) : [null, null];
  if (c.standardLanguages.length < 2) while (c.standardLanguages.length < 2) c.standardLanguages.push(null);
  c.standardLanguages = c.standardLanguages.map((value, i, arr) => {
    if (!value || value === "Common") return value || null;
    if (!STANDARD_LANGUAGE_NAMES.some(name => name.toLowerCase() === String(value).toLowerCase())) return null;
    const duplicate = arr.findIndex((other, j) => j < i && other && other.toLowerCase() === String(value).toLowerCase());
    return duplicate >= 0 ? null : value;
  });
  c.conditions = Array.isArray(raw.conditions) ? raw.conditions : [];
  c.spellbook = Array.isArray(raw.spellbook) ? raw.spellbook : [];
  c.knownSpells = Array.isArray(raw.knownSpells) ? raw.knownSpells : [];
  c.preparedSpells = Array.isArray(raw.preparedSpells) ? raw.preparedSpells : [];
  c.cantrips = Array.isArray(raw.cantrips) ? raw.cantrips : [];
  c.inventory = Array.isArray(raw.inventory) ? raw.inventory : [];
  c.resources = Array.isArray(raw.resources) ? raw.resources.map(r => ({ ...r, mode: r?.mode === "auto" ? "auto" : "manual" })) : [];
  c.senses = Array.isArray(raw.senses) ? raw.senses : [];
  c.attacks = Array.isArray(raw.attacks) ? raw.attacks : [];
  c.optionalFeatureChoices = { ...(raw.optionalFeatureChoices || {}) };
  c.weaponMasteries = Array.isArray(raw.weaponMasteries) ? raw.weaponMasteries : [];
  c.startingEquipment = { ...base.startingEquipment, ...(raw.startingEquipment || {}) };
  if (Number(raw.schema || 0) < 11) {
    for (const kind of ["class", "background"]) {
      const legacy = raw.startingEquipment?.[kind];
      if (legacy?.option && Number(legacy.currency || 0) > 0) {
        const legacyCp = Math.max(0, Number(legacy.currency || 0));
        c.currency.cp = Math.max(0, Number(c.currency.cp || 0) - legacyCp);
        const parts = currencyPartsFromCp(legacyCp);
        for (const [denom, amount] of Object.entries(parts)) c.currency[denom] = Number(c.currency[denom] || 0) + amount;
        c.startingEquipment[kind] = { choices: { 1: legacy.option }, currencyApplied: parts, currencyCp: legacyCp };
      }
    }
  }
  c.progressionFeats = { ...(raw.progressionFeats || {}) };
  c.toolChoices = Array.isArray(raw.toolChoices) ? raw.toolChoices : [];
  c.languageChoiceSlots = { ...(raw.languageChoiceSlots || {}) };
  c.toolChoiceSlots = { ...(raw.toolChoiceSlots || {}) };
  for (const key of ["appearance","age","height","weight","eyes","skin","hair","alignment","faith","allies","organization","backstory","personality","ideals","bonds","flaws"]) c[key] = raw[key] == null ? "" : String(raw[key]);
  c.feats = Array.isArray(raw.feats) ? raw.feats : (raw.feat ? [raw.feat] : []);
  c.feat = raw.feat ? raw.feat : (c.feats[0] || null);
  c.additionalFeats = Array.isArray(raw.additionalFeats) ? raw.additionalFeats : c.feats.slice(1);
  c.featAbilityChoices = { ...(raw.featAbilityChoices || {}) };
  c.featSaveChoices = { ...(raw.featSaveChoices || {}) };
  c.featSkillChoices = { ...(raw.featSkillChoices || {}) };
  c.featMixedChoices = { ...(raw.featMixedChoices || {}) };
  c.featSpellChoices = { ...(raw.featSpellChoices || {}) };
  c.featExpertiseChoices = { ...(raw.featExpertiseChoices || {}) };
  c.speciesChoices = { ...(raw.speciesChoices || {}) };
  c.customSkillProficiencies = c.customSkillProficiencies.map(normalizeSkillKey).filter(Boolean);
  c.expertise = [...new Set(c.expertise || [])];
  c.heroicInspiration = Boolean(raw.heroicInspiration);
  c.exhaustion = clamp(Number(raw.exhaustion || 0), 0, 6);
  c.concentration = raw.concentration ? String(raw.concentration) : null;
  if (raw.hpCurrent == null && raw.hp != null) c.hpCurrent = raw.hp;
  // Legacy builds stored calculated AC as `ac`; never turn that into a permanent manual override.
  // Older prototypes could also persist `acOverride` while it was only a calculated value.
  if (raw.acOverride != null) c.acOverride = Number(raw.acOverride);
  if (Number(raw.schema || 0) < 10 && raw.acOverride != null && raw.acManual !== true) c.acOverride = null;
  // v0.20 and earlier could persist a calculated level-1 HP value of 1 as a manual override.
  // That value is specifically a migration artifact, not a user choice. Discard it on upgrade.
  if (Number(raw.schema || 0) < 12 && Number(raw.hpMaxOverride) === 1) c.hpMaxOverride = null;
  if (Number(raw.schema || 0) < 10 && (!Number.isFinite(Number(raw.hpMaxOverride)) || Number(raw.hpMaxOverride) <= 0)) c.hpMaxOverride = null;
  if (raw.speedOverride == null && raw.speed != null) c.speedOverride = raw.speed;
  if (c.hpMaxOverride === undefined) c.hpMaxOverride = null;
  if (c.tempHp == null) c.tempHp = 0;
  if (Number(c.hpCurrent) > 0) c.deathSaves = { success: 0, failure: 0 };
  if (c.hpAuto === undefined) c.hpAuto = raw.hpAuto ?? (raw.hpCurrent == null && raw.hp == null);
  return c;
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv", { keyPath: "key" });
      if (!db.objectStoreNames.contains("data")) db.createObjectStore("data", { keyPath: "key" });
      if (!db.objectStoreNames.contains("characters")) db.createObjectStore("characters", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGet(store, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result?.value ?? req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store, key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const record = store === "characters" ? { id: key, ...value } : { key, value };
    tx.objectStore(store).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAll(store) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbDeletePrefix(store, prefix) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const cursorReq = tx.objectStore(store).openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith(prefix)) cursor.delete();
      cursor.continue();
    };
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function dataKey(version, path) { return `${version}::${path}`; }
async function cachedData(version, path) { return idbGet("data", dataKey(version, path)); }
async function cacheData(version, path, json) { return idbPut("data", dataKey(version, path), json); }
async function deleteCachedData(version, path) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("data", "readwrite");
    tx.objectStore("data").delete(dataKey(version, path));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function loadCharacter() {
  let currentId = await idbGet("kv", "currentCharacterId");
  if (!currentId) {
    const old = await idbGet("kv", "character");
    if (old) {
      const migrated = migrateCharacter(old);
      await idbPut("characters", migrated.id, migrated);
      currentId = migrated.id;
      await idbPut("kv", "currentCharacterId", currentId);
    }
  }
  if (!currentId) {
    const c = emptyCharacter();
    await idbPut("characters", c.id, c);
    currentId = c.id;
    await idbPut("kv", "currentCharacterId", currentId);
  }
  const raw = await idbGet("characters", currentId);
  state.character = migrateCharacter(raw);
  if (state.character.id !== currentId) await idbPut("characters", state.character.id, state.character);
  state.version = await idbGet("kv", "version");
  state.lastSync = await idbGet("kv", "lastSync");
  state.lastReleaseCheck = await idbGet("kv", "lastReleaseCheck");
}

async function saveCharacter() {
  state.character = migrateCharacter(state.character);
  await idbPut("characters", state.character.id, state.character);
  await idbPut("kv", "currentCharacterId", state.character.id);
}

async function getCharacters() {
  return (await idbGetAll("characters")).map(migrateCharacter).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

async function switchCharacter(id) {
  const raw = await idbGet("characters", id);
  if (!raw) return;
  state.character = migrateCharacter(raw);
  await idbPut("kv", "currentCharacterId", id);
  render();
}

async function createCharacter() {
  const c = emptyCharacter();
  c.name = "New Character";
  await idbPut("characters", c.id, c);
  state.character = c;
  await idbPut("kv", "currentCharacterId", c.id);
  render();
}

async function deleteCharacter(id) {
  const chars = await getCharacters();
  if (chars.length <= 1) return showToast("Keep at least one character on the device.");
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("characters", "readwrite");
    tx.objectStore("characters").delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  const next = (await getCharacters())[0];
  await switchCharacter(next.id);
}

async function persistMeta() {
  await idbPut("kv", "version", state.version);
  await idbPut("kv", "lastSync", state.lastSync);
  await idbPut("kv", "lastReleaseCheck", state.lastReleaseCheck);
}

async function fetchJson(url, { timeoutMs = 30000, headers = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store", headers });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getLatestReleaseTag(forceCheck = false) {
  const cachedCheck = Number(state.lastReleaseCheck || 0);
  if (!forceCheck && state.version && Date.now() - cachedCheck < 6 * 60 * 60 * 1000) return state.version;
  const release = await fetchJson(GITHUB_RELEASE_URL, { timeoutMs: 12000, headers: { Accept: "application/vnd.github+json" } });
  if (!release?.tag_name) throw new Error("GitHub did not return a release tag.");
  state.lastReleaseCheck = Date.now();
  await persistMeta();
  return release.tag_name;
}

const dataFetchesInFlight = new Map();

function isUsableCachedData(path, json) {
  if (json == null || typeof json !== "object") return false;
  if (path === PATHS.items) return Array.isArray(json?.item);
  if (path === PATHS.itemsBase) return Array.isArray(json?.baseitem);
  if (path === PATHS.classIndex) return json && typeof json === "object" && Object.keys(json).length > 0;
  if (path === PATHS.spellIndex) return json && typeof json === "object" && Object.keys(json).length > 0;
  return true;
}

async function fetch5eData(version, path) {
  const requestKey = dataKey(version, path);
  if (dataFetchesInFlight.has(requestKey)) return dataFetchesInFlight.get(requestKey);
  const request = (async () => {
    const cached = await cachedData(version, path);
    if (cached !== null) {
      if (isUsableCachedData(path, cached)) return cached;
      // Never let an incomplete/stale catalog poison the staged cache.
      await deleteCachedData(version, path);
    }
    const url = `${RAW_ROOT}/${encodeURIComponent(version)}/${path}`;
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const json = await fetchJson(url, { timeoutMs: path === PATHS.items ? 60000 : 45000 });
        if (!isUsableCachedData(path, json)) throw new Error(`Downloaded ${path} is structurally incomplete.`);
        await cacheData(version, path, json);
        return json;
      } catch (error) {
        lastError = error;
        const transient = /^(408|429|5\d\d)\b/.test(String(error?.message || "")) || error?.name === "AbortError" || error instanceof TypeError;
        if (!transient || attempt === 2) throw error;
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    throw lastError || new Error(`Unable to load ${path}`);
  })();
  dataFetchesInFlight.set(requestKey, request);
  try { return await request; } finally { dataFetchesInFlight.delete(requestKey); }
}

function sourceLabel(source) {
  return state.data.sourceMeta?.find(x => x.source === source)?.name || source || "Unknown source";
}

function isOfficial2024Entity(entity, sourceSet = state.data.officialSources) {
  const sources = sourceSet && typeof sourceSet.has === "function" ? sourceSet : state.data.officialSources;
  return Boolean(entity && (
    sources.has(entity.source) ||
    entity.edition === "one" ||
    entity.basicRules2024 ||
    entity.srd52
  ));
}

function officialEntries(json, prop) {
  return Array.isArray(json?.[prop]) ? json[prop].filter(x => isOfficial2024Entity(x)) : [];
}

function sourceEntries(json, prop, source) {
  return Array.isArray(json?.[prop]) ? json[prop].filter(x => x && x.source === source) : [];
}

function buildOfficialSourceMeta(books) {
  const list = Array.isArray(books?.book) ? books.book : [];
  const seen = new Map();
  const cutoff = new Date(CORE_2024_DATE + "T00:00:00Z").getTime();
  for (const book of list) {
    const date = book.published ? new Date(book.published + "T00:00:00Z").getTime() : NaN;
    const author = String(book.author || "");
    if (book.source && (book.source === DATA_SOURCE || book.source === "XDMG" || book.source === "XMM" || (Number.isFinite(date) && date >= cutoff))) {
      seen.set(book.source, { source: book.source, name: book.name || book.source, published: book.published || null });
    }
  }
  for (const source of [DATA_SOURCE, "XDMG"]) if (!seen.has(source)) seen.set(source, { source, name: source });
  return [...seen.values()].sort((a,b) => (a.published || "9999").localeCompare(b.published || "9999") || a.name.localeCompare(b.name));
}


const CORE_CACHE_PATHS = [
  PATHS.books,
  PATHS.classIndex,
  PATHS.races,
  PATHS.backgrounds,
  PATHS.feats,
  PATHS.languages,
  PATHS.optionalfeatures,
  PATHS.spellIndex,
  PATHS.conditionsdiseases,
  PATHS.variantrules,
  PATHS.actions,
  PATHS.items,
  PATHS.itemsBase,
];

function nextTick() { return new Promise(resolve => setTimeout(resolve, 0)); }

function setCacheProgress({label="Preparing rules data…", detail="", done=0, total=1, phase="Caching"} = {}) {
  const safeTotal = Math.max(1, Number(total || 1));
  const safeDone = Math.min(safeTotal, Math.max(0, Number(done || 0)));
  state.cacheProgress = { label, detail, done: safeDone, total: safeTotal, phase };
  const root = document.querySelector("#cacheProgressRoot");
  if (!root) return;
  const pct = Math.round((safeDone / safeTotal) * 100);
  root.hidden = false;
  const title = root.querySelector("[data-cache-progress-title]");
  const detailEl = root.querySelector("[data-cache-progress-detail]");
  const bar = root.querySelector("[data-cache-progress-bar]");
  const count = root.querySelector("[data-cache-progress-count]");
  const phaseEl = root.querySelector("[data-cache-progress-phase]");
  if (title) title.textContent = label;
  if (detailEl) detailEl.textContent = detail;
  if (bar) bar.style.width = `${pct}%`;
  if (count) count.textContent = `${pct}% · ${safeDone} / ${safeTotal}`;
  if (phaseEl) phaseEl.textContent = phase;
}

function hideCacheProgress() {
  state.cacheProgress = null;
  const root = document.querySelector("#cacheProgressRoot");
  if (root) root.hidden = true;
}

async function loadPathsInBatches(version, paths, {batchSize=3, phase="Core catalogs", startDone=0, total=paths.length, label="Caching core catalogs"} = {}) {
  const results = new Array(paths.length);
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const values = [];
    for (const path of batch) {
      const index = i + values.length;
      setCacheProgress({
        label,
        detail: path,
        done: startDone + index,
        total,
        phase,
      });
      values.push(await fetch5eData(version, path));
      setCacheProgress({
        label,
        detail: path,
        done: startDone + index + 1,
        total,
        phase,
      });
      await nextTick();
    }
    for (let j = 0; j < values.length; j++) results[i + j] = values[j];
    await nextTick();
  }
  return results;
}

async function runCacheBatches(entries, worker, {batchSize=4, phase="Library cache", done=0, total=entries.length, label="Caching data"} = {}) {
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    setCacheProgress({ label, detail: `Preparing ${Math.min(i + batch.length, entries.length)} entries in this batch`, done, total, phase });
    await Promise.all(batch.map((entry, offset) => worker(entry, i + offset)));
    done += batch.length;
    setCacheProgress({ label, detail: `${done} of ${total}`, done, total, phase });
    await nextTick();
  }
}

function officialSpellSourcesForData(core) {
  const index = core?.spellIndex || {};
  const official = core?.officialSources || new Set([DATA_SOURCE]);
  const keys = Object.keys(index);
  return keys.filter(source => official.has(source) || String(source).toLowerCase() === String(DATA_SOURCE).toLowerCase());
}

async function cacheAllLibraryData(version, core = null) {
  const loadedCore = core || await loadCoreData(version);
  await ensureEquipmentCatalogReady(loadedCore);
  const classEntries = Object.entries(loadedCore.classIndex || {});
  const spellSources = officialSpellSourcesForData(loadedCore);
  const total = CORE_CACHE_PATHS.length + classEntries.length + spellSources.length;
  let done = CORE_CACHE_PATHS.length;
  setCacheProgress({label: "Caching 2024 rules library", detail: `${done} of ${total} core catalogs loaded`, done, total, phase: "Core catalogs"});

  await runCacheBatches(classEntries, async ([name, file]) => {
    const data = await fetch5eData(version, `data/class/${file}`);
    state.data.classFiles.set(String(name).toLowerCase(), data);
  }, {batchSize: 3, phase: "Classes", done, total, label: "Caching class files"});
  done += classEntries.length;

  await runCacheBatches(spellSources, async source => {
    await loadSpellSource(version, source);
  }, {batchSize: 3, phase: "Spells", done, total, label: "Caching spell sources"});
  done += spellSources.length;

  mergeOfficialSpells();
  state.libraryReady = true;
  setCacheProgress({label: "Rules library ready", detail: "All staged 2024 player-facing data is cached on this device.", done: total, total, phase: "Complete"});
  await nextTick();
  return { core: loadedCore, total, classCount: classEntries.length, spellSourceCount: spellSources.length };
}

async function loadCoreData(version) {
  const [books, classIndex, races, backgrounds, feats, languages, optionalfeatures, spellIndex, conditionsdiseases, variantrules, actions, items, itemsBase] = await loadPathsInBatches(
    version,
    CORE_CACHE_PATHS,
    {batchSize: 3, phase: "Core catalogs", total: CORE_CACHE_PATHS.length, label: "Loading core 2024 catalogs"}
  );
  const sourceMeta = buildOfficialSourceMeta(books);
  const officialSources = new Set(sourceMeta.map(x => x.source));
  const referenceCache = new Map();
  for (const sense of SPECIAL_SENSES) referenceCache.set(referenceCacheKey("sense", sense, DATA_SOURCE), SPECIAL_SENSE_FALLBACKS[sense]);
  const mergedItems = mergeItemCatalogs(items, itemsBase);
  const itemIndex = buildItemIndex(mergedItems, officialSources);
  return { books, classIndex, races, backgrounds, feats, languages, optionalfeatures, spells: null, spellIndex, items: mergedItems, itemSourceData: items, itemsBase, itemIndex, conditionsdiseases, variantrules, actions, classFiles: new Map(), spellFiles: new Map(), referenceCache, officialSources, sourceMeta };
}

async function loadSpellSource(version, source) {
  if (!source || !state.data.spellIndex) return null;
  const key = String(source).toLowerCase();
  if (state.data.spellFiles.has(key)) return state.data.spellFiles.get(key);
  const file = state.data.spellIndex[source] || state.data.spellIndex[Object.keys(state.data.spellIndex).find(k => k.toLowerCase() === key)] || (key === String(DATA_SOURCE).toLowerCase() ? "spells-xphb.json" : null);
  if (!file) return null;
  try {
    const data = await fetch5eData(version, `data/spells/${file}`);
    state.data.spellFiles.set(key, data);
    mergeOfficialSpells();
    return data;
  } catch (e) {
    console.warn(`Unable to load spell source ${source}:`, e);
    return null;
  }
}

function mergeOfficialSpells() {
  const merged = { spell: [] };
  for (const data of state.data.spellFiles.values()) {
    for (const spell of data?.spell || []) if (isOfficial2024Entity(spell, state.data.officialSources)) merged.spell.push(spell);
  }
  const seen = new Set();
  merged.spell = merged.spell.filter(spell => {
    const key = `${String(spell.name || '').toLowerCase()}|${spell.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  state.data.spells = merged;
  return merged;
}

async function hydrateSpellData(version, all = false) {
  if (!state.data.spellIndex) return null;
  const sources = Object.keys(state.data.spellIndex);
  if (all) {
    await Promise.all(sources.map(source => loadSpellSource(version, source)));
  }
  return mergeOfficialSpells();
}

async function loadVersion(version) {
  state.libraryReady = false;
  const core = await loadCoreData(version);
  state.data = core;
  await ensureEquipmentCatalogReady(state.data);
  return core;
}

async function ensureLibraryReady(version) {
  if (!version) return false;
  if (state.libraryReady) return true;
  setCacheProgress({label: "Finishing 2024 rules cache", detail: "Loading the remaining classes and spell sources in small batches…", done: 0, total: 1, phase: "Preparing"});
  const result = await cacheAllLibraryData(version, state.data?.classIndex ? state.data : null);
  return Boolean(result);
}

async function hydrateBackgroundData(version) {
  try {
    await ensureLibraryReady(version);
  } catch (e) {
    state.libraryReady = false;
    console.warn("Rules library hydration failed", e);
    showToast(`Rules library is incomplete: ${e.message}`);
  }
}

async function syncData(force = false) {
  if (state.busy) return;
  state.busy = true;
  state.libraryReady = false;
  setBusy(true);
  updateHeader();
  try {
    if (!state.online) {
      if (!state.version) throw new Error("Connect to the internet for the first data sync.");
      setCacheProgress({label: "Checking cached rules library", detail: "Offline mode — using data already stored on this device.", done: 0, total: 1, phase: "Offline"});
      await loadVersion(state.version);
      await ensureLibraryReady(state.version);
      render();
      showToast(`Offline: 5etools ${state.version} rules library is ready.`);
      return;
    }

    const latest = await getLatestReleaseTag(force);
    const needsUpdate = force || !state.version || latest !== state.version;
    const oldVersion = state.version;
    if (!needsUpdate) {
      await loadVersion(state.version);
      await ensureLibraryReady(state.version);
      render();
      showToast(`5etools ${state.version} is current; rules library is fully cached.`);
      return;
    }

    showToast(`Downloading 5etools ${latest} in staged batches…`);
    await loadVersion(latest);
    state.version = latest;
    const result = await cacheAllLibraryData(latest, state.data);
    state.lastSync = new Date().toISOString();
    await persistMeta();
    if (oldVersion && oldVersion !== latest) await idbDeletePrefix("data", `${oldVersion}::`);
    render();
    showToast(`5etools updated to ${latest}: ${result.classCount} class files and ${result.spellSourceCount} spell sources cached.`);
  } catch (error) {
    console.warn(error);
    if (state.version) {
      try {
        await loadVersion(state.version);
        await ensureLibraryReady(state.version);
        render();
        showToast(`Using cached 5etools ${state.version}. ${state.libraryReady ? "Rules library ready." : "Rules library remains incomplete."}`);
      } catch (cacheError) {
        state.libraryReady = false;
        showToast(`5etools data could not be loaded: ${cacheError.message}`);
      }
    } else {
      state.libraryReady = false;
      showToast(`Could not load 5etools data: ${error.message}`);
    }
  } finally {
    state.busy = false;
    setBusy(false);
    updateHeader();
    if (state.libraryReady) {
      setCacheProgress({label: "Rules library ready", detail: "All staged 2024 player-facing data is cached on this device.", done: 1, total: 1, phase: "Complete"});
      setTimeout(hideCacheProgress, 650);
    } else {
      setCacheProgress({label: "Rules cache incomplete", detail: "Retry Update data while online to resume the staged cache.", done: 0, total: 1, phase: "Incomplete"});
    }
    render();
  }
}

async function getClassDetails(className) {
  if (!className || !state.data.classIndex) return null;
  const cacheKey = className.toLowerCase();
  if (state.data.classFiles.has(cacheKey)) return state.data.classFiles.get(cacheKey);
  const file = state.data.classIndex[cacheKey];
  if (!file) throw new Error(`No 5etools class file found for ${className}.`);
  const data = await fetch5eData(state.version, `data/class/${file}`);
  state.data.classFiles.set(cacheKey, data);
  return data;
}

function mergeItemCatalogs(items, itemsBase) {
  const merged = { ...(items && typeof items === "object" ? items : {}) };
  const normalItems = Array.isArray(items?.item) ? items.item : [];
  const baseItems = Array.isArray(itemsBase?.baseitem) ? itemsBase.baseitem : [];
  const seen = new Set(normalItems.map(x => `${String(x?.name || "").toLowerCase()}|${String(x?.source || "").toLowerCase()}`));
  merged.item = normalItems.slice();
  for (const item of baseItems) {
    const key = `${String(item?.name || "").toLowerCase()}|${String(item?.source || "").toLowerCase()}`;
    if (item?.name && !seen.has(key)) {
      merged.item.push(item);
      seen.add(key);
    }
  }
  return merged;
}

function hasRequired2024Equipment(items) {
  const list = Array.isArray(items?.item) ? items.item : [];
  const required = ["dagger", "quarterstaff", "mace", "shield", "leather armor"];
  return required.every(name => list.some(item => String(item?.name || "").toLowerCase() === name && String(item?.source || "").toUpperCase() === "XPHB"));
}

async function refreshItemsData(version) {
  await deleteCachedData(version, PATHS.items);
  await deleteCachedData(version, PATHS.itemsBase);
  const freshItems = await fetch5eData(version, PATHS.items);
  const freshBase = await fetch5eData(version, PATHS.itemsBase);
  const merged = mergeItemCatalogs(freshItems, freshBase);
  if (!hasRequired2024Equipment(merged)) throw new Error("The downloaded 2024 equipment catalog is missing required core items.");
  state.data.items = merged;
  state.data.itemSourceData = freshItems;
  state.data.itemsBase = freshBase;
  state.data.itemIndex = buildItemIndex(merged, state.data.officialSources);
  return merged;
}

function buildItemIndex(items, sourceSet = state.data.officialSources) {
  const index = new Map();
  const list = Array.isArray(items?.item) ? items.item : [];
  for (const item of list) {
    const source = String(item?.source || "").toUpperCase();
    if (!item?.name) continue;
    // Restore the known-good v0.28 behavior, with an explicit XPHB safety net.
    if (isOfficial2024Entity(item, sourceSet) || source === DATA_SOURCE) {
      index.set(`${String(item.name).toLowerCase()}|${String(item.source || "").toLowerCase()}`, item);
    }
  }
  return index;
}

function equipmentCatalogDiagnostics(items, sourceSet = state.data.officialSources) {
  const list = Array.isArray(items?.item) ? items.item : [];
  const index = buildItemIndex(items, sourceSet);
  const required = ["dagger", "quarterstaff", "mace", "shield", "leather armor"];
  const missing = required.filter(name => !index.has(`${name}|xphb`));
  return { rawCount: list.length, indexCount: index.size, missing };
}

function rebuildItemIndex() {
  state.data.itemIndex = buildItemIndex(state.data.items);
  const diag = equipmentCatalogDiagnostics(state.data.items);
  if (diag.missing.length) throw new Error(`2024 equipment index is incomplete: missing ${diag.missing.join(", ")}.`);
  return diag;
}

async function ensureEquipmentCatalogReady(core = state.data) {
  if (!core?.items || !hasRequired2024Equipment(core.items)) {
    if (!state.online) throw new Error("The cached equipment catalog is incomplete; reconnect to repair it.");
    setCacheProgress({label: "Repairing equipment catalog", detail: "Refreshing the complete 2024 item catalog…", done: 0, total: 1, phase: "Equipment"});
    const fresh = await refreshItemsData(state.version);
    core.items = fresh;
  }
  const diag = equipmentCatalogDiagnostics(core.items, core.officialSources);
  if (diag.missing.length) {
    if (!state.online) throw new Error(`The cached equipment index is incomplete: ${diag.missing.join(", ")}.`);
    setCacheProgress({label: "Repairing equipment catalog", detail: `Refreshing item index (${diag.missing.join(", ")})…`, done: 0, total: 1, phase: "Equipment"});
    const fresh = await refreshItemsData(state.version);
    core.items = fresh;
  }
  core.itemIndex = buildItemIndex(core.items, core.officialSources);
  const finalDiag = equipmentCatalogDiagnostics(core.items, core.officialSources);
  if (finalDiag.missing.length) throw new Error(`2024 equipment index remains incomplete: ${finalDiag.missing.join(", ")}.`);
  return finalDiag;
}

async function getItemsData() {
  if (!state.data.items) state.data.items = await fetch5eData(state.version, PATHS.items);
  await ensureEquipmentCatalogReady(state.data);
  rebuildItemIndex();
  return state.data.items;
}

function officialItemCatalog() {
  const entries = Array.isArray(state.data.items?.item) ? state.data.items.item.filter(item => isOfficial2024Entity(item) || String(item?.source || "").toUpperCase() === DATA_SOURCE) : [];
  if (!state.data.itemIndex) state.data.itemIndex = buildItemIndex(state.data.items);
  if (!state.data.itemIndex.has("dagger|xphb") || !state.data.itemIndex.has("quarterstaff|xphb")) {
    state.data.itemIndex = buildItemIndex(state.data.items);
  }
  return entries;
}

function officialWeaponCatalog() {
  return officialItemCatalog().filter(it => Boolean(it?.weaponCategory) && masteryObjects(it).length > 0);
}

function itemFromCatalog(name, source=null) {
  const raw = String(name||'').trim();
  const src = source ? String(source).toLowerCase() : null;
  const index = state.data.itemIndex || new Map();
  if (src) {
    const exact = index.get(`${raw.toLowerCase()}|${src}`);
    if (exact) return exact;
  }
  for (const candidate of [raw, canonicalLabel(raw, 'item')]) {
    const hit = [...index.values()].find(x => String(x.name||'').toLowerCase() === String(candidate).toLowerCase() && (!src || String(x.source||'').toLowerCase() === src));
    if (hit) return hit;
  }
  // Last-resort exact lookup against the raw 5etools catalog. This keeps the
  // resolver independent from derived indexes and is especially important for
  // XPHB starting-equipment refs such as dagger|xphb.
  const rawItems = Array.isArray(state.data.items?.item) ? state.data.items.item : [];
  for (const candidate of [raw, canonicalLabel(raw, 'item')]) {
    const hit = rawItems.find(x => String(x?.name || '').toLowerCase() === String(candidate).toLowerCase() && (!src || String(x?.source || '').toLowerCase() === src));
    if (hit && (isOfficial2024Entity(hit) || String(hit.source || '').toUpperCase() === DATA_SOURCE)) return hit;
  }
  return null;
}

function getLoadedSpells() {
  if (!state.data.spells) mergeOfficialSpells();
  return state.data.spells?.spell || [];
}

async function getSpellById(id) {
  const [nameRaw, sourceRaw] = String(id || "").split("|");
  const name = String(nameRaw || "").trim();
  const source = String(sourceRaw || DATA_SOURCE).trim();
  if (!name) return null;
  let found = getLoadedSpells().find(s => s.name?.toLowerCase() === name.toLowerCase() && (!sourceRaw || s.source?.toLowerCase() === source.toLowerCase()));
  if (found) return found;
  await loadSpellSource(state.version, source);
  mergeOfficialSpells();
  found = getLoadedSpells().find(s => s.name?.toLowerCase() === name.toLowerCase() && (!sourceRaw || s.source?.toLowerCase() === source.toLowerCase()));
  if (found) { cacheReferenceEntity("spell", found); return found; }
  // Older character data may carry PHB-era source markers even though the active 2024 spell
  // catalog uses XPHB. Prefer the current 2024 entry by name as a compatibility fallback.
  found = getLoadedSpells().find(s => s.name?.toLowerCase() === name.toLowerCase());
  if (found) { cacheReferenceEntity("spell", found); return found; }
  for (const src of Object.keys(state.data.spellIndex || {})) {
    if (!state.data.spellFiles.has(src.toLowerCase())) await loadSpellSource(state.version, src);
    found = getLoadedSpells().find(s => s.name?.toLowerCase() === name.toLowerCase());
    if (found) { cacheReferenceEntity("spell", found); return found; }
  }
  return null;
}

function findOfficial(json, prop, name, source = null) {
  const needle = String(name || "").trim().toLowerCase();
  const src = source ? String(source).toLowerCase() : null;
  const entries = officialEntries(json, prop);
  return entries.find(x => String(x.name || "").toLowerCase() === needle && (!src || String(x.source || "").toLowerCase() === src)) || null;
}

function findBackground(name, source = null) { return findOfficial(state.data.backgrounds, "background", name, source); }
function findSpecies(name, source = null) { return findOfficial(state.data.races, "race", name, source); }
function findFeat(name, source = null) { return findOfficial(state.data.feats, "feat", name, source); }
function findLanguage(name, source = null) { return findOfficial(state.data.languages, "language", name, source); }

function getClassFromFile(file, name, source = null) {
  const entries = (file?.class || []).filter(x => isOfficial2024Entity(x));
  const needle = String(name || "").trim().toLowerCase();
  return entries.find(x => x.name.toLowerCase() === needle && (!source || String(x.source || "").toLowerCase() === String(source).toLowerCase())) ||
    entries.find(x => x.name.toLowerCase() === needle && x.edition === "one") ||
    entries.find(x => x.name.toLowerCase() === needle) || null;
}

function getSubclassOptions(file, className) {
  return (file?.subclass || []).filter(s => s && s.className === className && isOfficial2024Entity(s)).sort((a,b) => {
    const sa = a.source === DATA_SOURCE ? 0 : 1; const sb = b.source === DATA_SOURCE ? 0 : 1;
    return sa - sb || a.name.localeCompare(b.name);
  });
}

function parseFeatureRef(ref) {
  const value = typeof ref === "string" ? ref : ref?.classFeature;
  if (!value) return null;
  const parts = value.split("|");
  return { name: parts[0], className: parts[1], classSource: parts[2] || "", level: Number(parts[3] || 0), source: parts[4] || parts[2] || "" };
}

function getClassFeatures(file, classObj, level) {
  const all = file?.classFeature || [];
  return (classObj?.classFeatures || []).map(parseFeatureRef).filter(Boolean).map(ref => {
    const matches = all.filter(f => f.name === ref.name && f.className === classObj.name && Number(f.level) === ref.level && isOfficial2024Entity(f));
    return matches.find(f => f.source === ref.source) || matches.find(f => f.source === DATA_SOURCE) || matches.find(f => f.edition === "one") || matches[0];
  }).filter(f => f && f.level <= level && isOfficial2024Entity(f));
}

function getSubclassFeatures(file, subclassObj, level) {
  if (!subclassObj) return [];
  return (file?.subclassFeature || []).filter(f =>
    isOfficial2024Entity(f) &&
    f.className === subclassObj.className &&
    (!f.classSource || f.classSource === subclassObj.classSource) &&
    f.subclassShortName === subclassObj.shortName &&
    (!f.subclassSource || f.subclassSource === subclassObj.source) &&
    Number(f.level) <= level
  );
}


function progressionCountAtLevel(progression, level) {
  const lvl = Math.max(1, Number(level || 1));
  if (Array.isArray(progression)) return Math.max(0, Number(progression[lvl - 1] || 0));
  const levels = Object.keys(progression || {}).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  let count = 0;
  for (const lv of levels) {
    if (lv > lvl) break;
    count = Math.max(0, Number(progression[String(lv)] || 0));
  }
  return count;
}

function progressionUnlockLevel(progression) {
  if (Array.isArray(progression)) {
    const idx = progression.findIndex(v => Number(v || 0) > 0);
    return idx >= 0 ? idx + 1 : null;
  }
  const levels = Object.keys(progression || {}).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  for (const lv of levels) if (Number(progression[String(lv)] || 0) > 0) return lv;
  return null;
}

function optionalFeatureProgression(classObj, level) {
  const out = [];
  // 2024 optional class features (notably Warlock Eldritch Invocations) use
  // optionalfeatureProgression + featureType rather than featProgression + category.
  for (const prog of classObj?.optionalfeatureProgression || []) {
    const progression = prog?.progression || [];
    const count = progressionCountAtLevel(progression, level);
    const unlockLevel = progressionUnlockLevel(progression);
    if (!count || !unlockLevel) continue;
    const category = Array.isArray(prog.featureType) ? prog.featureType : (prog.featureType ? [prog.featureType] : []);
    for (let i = 0; i < count; i++) out.push({ key: `${prog.name}|${category.join(",")}|${i+1}`, name: prog.name, category, index: i+1, level: unlockLevel });
  }
  return out;
}

function progressionFeatSlots(classObj, level) {
  const out = [];
  for (const prog of classObj?.featProgression || []) {
    const progression = prog?.progression || {};
    const levels = Object.keys(progression).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    let count = 0, unlockLevel = null;
    for (const lv of levels) if (lv <= Number(level || 1)) { count = Number(progression[String(lv)] || 0); unlockLevel = lv; }
    if (!count || !unlockLevel) continue;
    const category = Array.isArray(prog.category) ? prog.category : [];
    const hasOptional = availableOptionalFeatures({ category }).length > 0;
    if (hasOptional) continue;
    for (let i = 0; i < count; i++) {
      out.push({ key: `feat:${prog.name}|${category.join(",")}|${i+1}`, name: prog.name, category, index: i+1, level: unlockLevel });
    }
  }
  return out;
}

function featCategoryMatches(feat, categories) {
  const wanted = new Set((categories || []).map(x => String(x).toLowerCase()));
  if (!wanted.size) return true;
  const cats = Array.isArray(feat?.category) ? feat.category : (feat?.category ? [feat.category] : []);
  return cats.some(x => wanted.has(String(x).toLowerCase()));
}

function availableOptionalFeatures(spec) {
  const entries = officialEntries(state.data.optionalfeatures, "optionalfeature");
  return entries.filter(x => {
    const types = Array.isArray(x.featureType) ? x.featureType : [];
    return !spec.category.length || spec.category.some(cat => types.includes(cat));
  }).sort((a,b)=>a.name.localeCompare(b.name) || String(a.source).localeCompare(String(b.source)));
}

function selectedOptionalFeatureObjects(c, classObj, level) {
  const specs = optionalFeatureProgression(classObj, level);
  const out = [];
  for (const spec of specs) {
    const ref = c.optionalFeatureChoices?.[spec.key];
    if (!ref) continue;
    const found = findOfficial(state.data.optionalfeatures, "optionalfeature", ref.name, ref.source || null);
    if (found) out.push({ ...found, _choiceKey: spec.key });
  }
  return out;
}

function weaponMasteryCount(classObj, level) {
  const value = classTableNumericValue(classObj, "weapon mastery", level);
  return Math.max(0, Number(value) || 0);
}

function masteryObjects(item) {
  const mastery = Array.isArray(item?.mastery) ? item.mastery : (item?.mastery ? [item.mastery] : []);
  return mastery.map(x => {
    if (typeof x === "string") {
      const [name, source] = x.split("|");
      return { name: canonicalLabel(name), source: source || DATA_SOURCE };
    }
    if (x && typeof x === "object") return { name: canonicalLabel(x.name || x.entry || x.label || ""), source: x.source || DATA_SOURCE, entries: x.entries || x.entry };
    return null;
  }).filter(x => x?.name);
}
function masteryLabel(item) {
  return masteryObjects(item).map(x => x.name).join(", ");
}

function selectedWeaponMasteryRefs(c) { return Array.isArray(c.weaponMasteries) ? c.weaponMasteries : []; }

function hasSelectedWeaponMastery(c, item) {
  const key = normalizeRefId(item?.name, item?.source);
  return selectedWeaponMasteryRefs(c).some(x => String(x).toLowerCase() === key.toLowerCase());
}

function extractEquipmentTerms(value, out = []) {
  if (value == null) return out;
  if (Array.isArray(value)) { for (const v of value) extractEquipmentTerms(v, out); return out; }
  if (typeof value === "string") {
    const tag = value.match(/\{@item\s+([^|}]+)(?:\|([^|}]+))?(?:\|([^}]+))?\}/i);
    if (tag) {
      const name = tag[1].trim();
      const source = tag[2]?.trim() || DATA_SOURCE;
      const displayName = tag[3]?.trim() || name;
      const qtyMatch = displayName.match(/(?:^|\s)(\d+)\s+(?:bolts?|arrows?|darts?|bullets?|needles?|pieces?|uses?)\b/i);
      out.push({ type: "item", ref: `${name}|${source}`, quantity: qtyMatch ? Number(qtyMatch[1]) : 1, displayName: qtyMatch ? name : displayName });
      return out;
    }
    const plainRef = value.trim().match(/^([^|]+)\|([A-Za-z][A-Za-z0-9-]{1,15})(?:\|([^|]+))?$/);
    if (plainRef && !/^(?:a|an|the|or|and)$/i.test(plainRef[1].trim())) {
      out.push({ type: "item", ref: `${plainRef[1].trim()}|${plainRef[2].trim()}`, quantity: 1, displayName: plainRef[3]?.trim() || plainRef[1].trim() });
      return out;
    }
    const money = value.match(/(\d+(?:\.\d+)?)\s*(pp|gp|ep|sp|cp)\b/i);
    if (money) {
      const amount = Number(money[1]);
      const denom = money[2].toLowerCase();
      const multiplier = { pp:1000, gp:100, ep:50, sp:10, cp:1 }[denom];
      if (Number.isFinite(amount) && multiplier) out.push({ type: "value", value: Math.round(amount * multiplier), display: `${amount} ${denom.toUpperCase()}` });
    }
    return out;
  }
  if (typeof value !== "object") return out;
  if (value.item) out.push({ type: "item", ref: String(value.item), quantity: Math.max(1, Number(value.quantity || 1)), displayName: value.displayName || null });
  if (Number.isFinite(Number(value.value))) out.push({ type: "value", value: Number(value.value) });
  if (Number.isFinite(Number(value.containsValue))) out.push({ type: "value", value: Number(value.containsValue) });
  if (value.special && typeof value.special === "string") out.push({ type: "special", name: value.special, quantity: Math.max(1, Number(value.quantity || 1)) });
  if (value.equipmentType) out.push({ type: "equipmentType", value: String(value.equipmentType) });
  for (const key of ["_", "A", "B", "C", "D", "E", "F"]) if (Object.prototype.hasOwnProperty.call(value,key)) extractEquipmentTerms(value[key], out);
  return out;
}

function normalizeStartingEquipmentGroups(obj) {
  const data = Array.isArray(obj?.startingEquipment?.defaultData)
    ? obj.startingEquipment.defaultData
    : Array.isArray(obj?.startingEquipment)
      ? obj.startingEquipment
      : [];
  return data.map((raw, index) => {
    const base = raw && typeof raw === "object" && Object.prototype.hasOwnProperty.call(raw, "_") ? extractEquipmentTerms(raw._) : [];
    const branches = raw && typeof raw === "object"
      ? Object.entries(raw).filter(([k]) => /^[A-F]$/i.test(k))
      : [];
    if (!branches.length) return { group: index + 1, options: [{ key: "fixed", label: "Included", items: [...base, ...extractEquipmentTerms(raw)] }] };
    return {
      group: index + 1,
      options: branches.map(([key, value]) => ({ key: key.toUpperCase(), label: `Option ${key.toUpperCase()}`, items: [...base, ...extractEquipmentTerms(value)] }))
    };
  }).filter(g => g.options.some(o => o.items.length));
}

function equipmentChoicesFromObject(obj) {
  return normalizeStartingEquipmentGroups(obj).flatMap(group => group.options.map(option => ({ ...option, group: group.group })));
}

function currencyToCp(currency = {}) {
  return Math.max(0,
    Number(currency.cp || 0) +
    Number(currency.sp || 0) * 10 +
    Number(currency.ep || 0) * 50 +
    Number(currency.gp || 0) * 100 +
    Number(currency.pp || 0) * 1000
  );
}

function currencyPartsFromCp(copper) {
  let cp = Math.max(0, Math.round(Number(copper) || 0));
  const gp = Math.floor(cp / 100); cp -= gp * 100;
  const sp = Math.floor(cp / 10); cp -= sp * 10;
  return { gp, sp, cp };
}

function addCurrencySnapshot(c, copper) {
  const parts = currencyPartsFromCp(copper);
  for (const [k, v] of Object.entries(parts)) c.currency[k] = Number(c.currency[k] || 0) + v;
  return parts;
}

function removeCurrencySnapshot(c, snapshot = {}) {
  for (const [k, v] of Object.entries(snapshot)) c.currency[k] = Math.max(0, Number(c.currency[k] || 0) - Number(v || 0));
}

function equipmentOriginRecord(c, kind) {
  const raw = c.startingEquipment?.[kind];
  if (!raw || typeof raw !== "object") return { choices: {}, currencyApplied: {} };
  if (raw.choices && typeof raw.choices === "object") return { choices: { ...raw.choices }, currencyApplied: { ...(raw.currencyApplied || {}) } };
  if (raw.option) return { choices: { 1: raw.option }, currencyApplied: raw.currency ? { cp: Number(raw.currency) } : {} };
  return { choices: {}, currencyApplied: {} };
}

function equipmentChoiceDescriptionHtml(choice) {
  const parts = choice.items.map(x => {
    if (x.type === "value") return escapeHtml(x.display || formatCurrencyValue(x.value));
    if (x.type === "special") return `<span>${escapeHtml(x.name)}</span>`;
    const { name, source } = splitRefId(x.ref);
    const found = findOfficialItemByName(name, source) || findOfficialItemByName(name);
    const display = x.displayName || found?.name || name;
    const link = found ? renderReferenceTag("item", `${found.name}|${found.source}|${display}`) : escapeHtml(display);
    return `${x.quantity > 1 ? `${x.quantity} × ` : ""}${link}`;
  });
  return parts.join(", ") || "No contents detected";
}

function equipmentChoiceDescription(choice) {
  return stripTags(equipmentChoiceDescriptionHtml(choice)).replace(/\s+/g, " ").trim();
}

function formatCurrencyValue(copper) {
  const value = Number(copper || 0);
  if (!value) return "0 CP";
  if (value % 100 === 0) return `${value/100} GP`;
  if (value % 10 === 0) return `${value/10} SP`;
  return `${value} CP`;
}

function removeStartingEquipmentOrigin(c, kind) {
  const record = equipmentOriginRecord(c, kind);
  const origin = `${kind}-starting`;
  c.inventory = (c.inventory || []).filter(x => x.origin !== origin);
  removeCurrencySnapshot(c, record.currencyApplied);
  c.startingEquipment[kind] = null;
}

async function applyStartingEquipment(kind, groupKey, optionKey, obj) {
  const c = state.character;
  // Structured starting-equipment entries contain item references; resolve them against the
  // actual 2024 item database before rebuilding the origin inventory.
  let itemsData = null;
  try { itemsData = await getItemsData(); } catch {}
  c.startingEquipment = { ...(c.startingEquipment || {}) };
  const previous = equipmentOriginRecord(c, kind);
  const choices = { ...previous.choices, [String(groupKey)]: optionKey };
  removeStartingEquipmentOrigin(c, kind);
  const groups = normalizeStartingEquipmentGroups(obj);
  const origin = `${kind}-starting`;
  let currencyCp = 0;
  for (const group of groups) {
    const chosen = group.options.find(o => String(o.key) === String(choices[group.group])) || (group.options.length === 1 ? group.options[0] : null);
    if (!chosen) continue;
    choices[group.group] = chosen.key;
    for (const term of chosen.items) {
      if (term.type === "value") { currencyCp += term.value; continue; }
      if (term.type === "special") {
        c.inventory.push({ name: term.name, source: DATA_SOURCE, quantity: term.quantity, equipped: false, origin, displayName: term.name, unresolved: true });
        continue;
      }
      if (term.type === "equipmentType") {
        const label = term.value === "focusSpellcastingArcane" ? "Arcane Focus" : canonicalLabel(term.value);
        const found = findOfficialItemByName(label, DATA_SOURCE) || findOfficialItemByName(label);
        c.inventory.push({ name: found?.name || label, source: found?.source || DATA_SOURCE, quantity: 1, equipped: false, origin, displayName: found?.name || label, unresolved: !found });
        continue;
      }
      const { name, source } = splitRefId(term.ref);
      const found = findOfficialItemByName(name, source) || findOfficialItemByName(name);
      const canonicalName = found?.name || name;
      if (found) cacheReferenceEntity("item", found);
      const canonicalSource = found?.source || source || DATA_SOURCE;
      const existing = c.inventory.find(x => x.name?.toLowerCase() === canonicalName.toLowerCase() && String(x.source||"").toLowerCase() === String(canonicalSource||"").toLowerCase() && x.origin === origin);
      if (existing) existing.quantity += term.quantity;
      else {
        const isWeapon = Boolean(found?.weaponCategory);
        c.inventory.push({ name: canonicalName, source: canonicalSource, quantity: term.quantity, equipped: isWeapon, wielding: isWeapon, origin, displayName: term.displayName || canonicalName });
      }
    }
  }
  const currencyApplied = addCurrencySnapshot(c, currencyCp);
  c.startingEquipment[kind] = { choices, currencyApplied, currencyCp };
  await saveCharacter();
  showToast(`${kind === "class" ? "Class" : "Background"} starting equipment updated.`);
}

async function getAllClassOptions() {
  const entries = [];
  for (const [key, file] of Object.entries(state.data.classIndex || {})) {
    try {
      const data = await getClassDetails(key.charAt(0).toUpperCase() + key.slice(1));
      for (const cls of data?.class || []) if (isOfficial2024Entity(cls)) entries.push(cls);
    } catch (e) { console.warn("Class option load failed", key, e); }
  }
  const byName = new Map();
  for (const cls of entries) {
    const prev = byName.get(cls.name.toLowerCase());
    if (!prev || (cls.source === DATA_SOURCE && prev.source !== DATA_SOURCE)) byName.set(cls.name.toLowerCase(), cls);
  }
  return [...byName.values()].sort((a,b) => a.name.localeCompare(b.name));
}

function normalizeRefId(name, source) { return `${name}|${source || DATA_SOURCE}`; }
function splitRefId(id) { const [name, ...rest] = String(id || "").split("|"); return { name, source: rest.join("|") || null }; }

function decodeHtmlEntities(text) {
  return String(text || "").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function normalizeSkillKey(value) {
  const raw = decodeHtmlEntities(String(value || "")).trim();
  if (!raw) return null;
  if (SKILLS[raw]) return raw;
  const norm = raw.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const found = Object.entries(SKILLS).find(([key, [, name]]) => key.replace(/[^a-z0-9]/gi, "").toLowerCase() === norm || name.replace(/[^a-z0-9]/gi, "").toLowerCase() === norm);
  return found ? found[0] : null;
}
function normalizeAbilityKey(value) {
  const raw = decodeHtmlEntities(String(value || "")).trim().toLowerCase();
  const aliases = { strength:"str", dexterity:"dex", constitution:"con", intelligence:"int", wisdom:"wis", charisma:"cha" };
  return ABILITIES.includes(raw) ? raw : aliases[raw] || null;
}
function normalizeSkillArray(values) { return [...new Set((values || []).map(normalizeSkillKey).filter(Boolean))]; }
function featRefKey(feat, index = 0, choiceIndex = 0) { return `${feat?.name || "Feat"}|${feat?.source || ""}|${index}|${choiceIndex}`; }
function featSpecKey(feat, spec) { return featRefKey(feat, spec.index, spec.choiceIndex || 0); }
function selectedFeatObjects(c) {
  const refs = [
    ...(c?.feat ? [c.feat] : []),
    ...(Array.isArray(c?.additionalFeats) ? c.additionalFeats : []),
    ...(Object.values(c?.progressionFeats || {}) || []),
    ...(Array.isArray(c?.feats) && !c?.additionalFeats?.length && !Object.keys(c?.progressionFeats || {}).length ? c.feats.slice(1) : []),
  ];
  const out = [];
  for (const ref of refs) {
    const obj = findFeat(ref?.name, ref?.source || null);
    if (obj && !out.some(x => x.name.toLowerCase() === obj.name.toLowerCase() && x.source === obj.source)) out.push(obj);
  }
  return out;
}
function featAbilitySpecs(feat) {
  const specs = [];
  for (const [index, entry] of (Array.isArray(feat?.ability) ? feat.ability : []).entries()) {
    if (entry?.choose?.weighted) {
      const from = entry.choose.weighted.from || [];
      const weights = entry.choose.weighted.weights || [];
      weights.forEach((amount, choiceIndex) => specs.push({ index, choiceIndex, from: from.map(normalizeAbilityKey).filter(Boolean), amount: Number(amount) || 1 }));
      continue;
    }
    if (entry?.choose) {
      const from = Array.isArray(entry.choose.from) ? entry.choose.from : (Array.isArray(entry.choose) ? entry.choose : []);
      const count = Math.max(1, Number(entry.choose.count || 1));
      const amount = Number(entry.choose.amount ?? entry.amount ?? 1);
      for (let choiceIndex = 0; choiceIndex < count; choiceIndex++) specs.push({ index, choiceIndex, from: from.map(normalizeAbilityKey).filter(Boolean), amount });
      continue;
    }
    for (const [ability, value] of Object.entries(entry || {})) {
      const key = normalizeAbilityKey(ability);
      if (key && Number(value) !== 0 && Number.isFinite(Number(value))) specs.push({ index, choiceIndex: 0, from: [key], amount: Number(value), fixed: true });
    }
  }
  return specs;
}
function featSaveSpecs(feat) {
  const specs = [];
  for (const [index, entry] of (Array.isArray(feat?.savingThrowProficiencies) ? feat.savingThrowProficiencies : []).entries()) {
    if (typeof entry === "string") { const key = normalizeAbilityKey(entry); if (key) specs.push({ index, choiceIndex: 0, from: [key], count: 1, fixed: true }); continue; }
    const choose = entry?.choose;
    if (choose) {
      const from = Array.isArray(choose.from) ? choose.from.map(normalizeAbilityKey).filter(Boolean) : [];
      const count = Math.max(1, Number(choose.count || 1));
      for (let choiceIndex = 0; choiceIndex < count; choiceIndex++) specs.push({ index, choiceIndex, from, count: 1 });
      continue;
    }
    for (const [ability, value] of Object.entries(entry || {})) if (value) { const key = normalizeAbilityKey(ability); if (key) specs.push({ index, choiceIndex: 0, from: [key], count: 1, fixed: true }); }
  }
  return specs;
}
function featSkillSpecs(feat) {
  const specs = [];
  for (const [index, entry] of (Array.isArray(feat?.skillProficiencies) ? feat.skillProficiencies : []).entries()) {
    if (typeof entry === "string") { const key = normalizeSkillKey(entry); if (key) specs.push({ index, choiceIndex: 0, from: [key], count: 1, fixed: true }); continue; }
    const choose = entry?.choose;
    if (choose) {
      const from = Array.isArray(choose.from) ? choose.from.map(normalizeSkillKey).filter(Boolean) : [];
      const count = Math.max(1, Number(choose.count || 1));
      for (let choiceIndex = 0; choiceIndex < count; choiceIndex++) specs.push({ index, choiceIndex, from, count: 1 });
      continue;
    }
    for (const [skill, value] of Object.entries(entry || {})) if (value) { const key = normalizeSkillKey(skill); if (key) specs.push({ index, choiceIndex: 0, from: [key], count: 1, fixed: true }); }
  }
  return specs;
}

function featMixedChoiceSpecs(feat) {
  const specs = [];
  const groups = Array.isArray(feat?.skillToolLanguageProficiencies) ? feat.skillToolLanguageProficiencies : [];
  for (const [index, entry] of groups.entries()) {
    const choose = entry?.choose;
    if (!choose) continue;
    const from = Array.isArray(choose.from) ? choose.from.map(String) : [];
    const count = Math.max(1, Number(choose.count || 1));
    for (let choiceIndex = 0; choiceIndex < count; choiceIndex++) specs.push({ index, choiceIndex, from, key: `${feat?.name || "Feat"}|${feat?.source || ""}|mixed|${index}|${choiceIndex}` });
  }
  return specs;
}
function featExpertiseSpecs(feat) {
  const specs = [];
  const groups = Array.isArray(feat?.expertise) ? feat.expertise : [];
  for (const [index, entry] of groups.entries()) {
    const choose = entry?.choose;
    if (!choose) continue;
    const from = Array.isArray(choose.from) ? choose.from.map(normalizeSkillKey).filter(Boolean) : [];
    const count = Math.max(1, Number(choose.count || 1));
    for (let choiceIndex = 0; choiceIndex < count; choiceIndex++) specs.push({ index, choiceIndex, from, key: `${feat?.name || "Feat"}|${feat?.source || ""}|expertise|${index}|${choiceIndex}` });
  }
  return specs;
}
function featAdditionalSpellChoiceSpecs(feat) {
  const specs = [];
  const raw = feat?.additionalSpells;
  const groups = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? Object.values(raw).filter(x => x && typeof x === "object") : [];
  for (const [index, group] of groups.entries()) {
    const names = [];
    const add = value => {
      if (value == null) return;
      if (Array.isArray(value)) return value.forEach(add);
      if (typeof value === "object") return add(value.name || value.value || value.class);
      if (typeof value === "string" && value.trim() && !names.some(x => textNorm(x) === textNorm(value))) names.push(value.trim());
    };
    add(group?.names); add(group?.name); if (!names.length && group?.choose?.from) add(group.choose.from);
    const abilityChoose = group?.ability?.choose;
    const abilityFrom = Array.isArray(abilityChoose?.from) ? abilityChoose.from.map(normalizeAbilityKey).filter(Boolean) : Array.isArray(abilityChoose) ? abilityChoose.map(normalizeAbilityKey).filter(Boolean) : [];
    if (names.length || abilityFrom.length) specs.push({ index, names, abilityFrom, key: `${feat?.name || "Feat"}|${feat?.source || ""}|spells|${index}` });
  }
  return specs;
}
function mixedChoiceOptions(spec) {
  const out = [];
  const add = (name, kind, value = name) => { if (!name) return; const key = `${kind}:${textNorm(value)}`; if (!out.some(x => x._key === key)) out.push({ name, kind, value, _key: key }); };
  for (const tokenRaw of spec?.from || []) {
    const token = String(tokenRaw || ""), low = token.toLowerCase();
    if (low === "anyskill") for (const [key, [,name]] of Object.entries(SKILLS)) add(name, "Skill", key);
    else if (low === "anytool" || low === "anytools") for (const name of TOOL_GENERIC_OPTIONS) add(name, "Tool", name);
    else if (low === "anystandard" || low === "anylanguage") for (const lang of standardLanguageOptions()) add(lang.name, "Language", lang.name);
    else {
      const skill = normalizeSkillKey(token); if (skill && SKILLS[skill]) add(SKILLS[skill][1], "Skill", skill);
      const tool = findOfficialItemByName(token, DATA_SOURCE) || findOfficialItemByName(token); if (tool) add(tool.name, "Tool", tool.name);
      const lang = findLanguage(token); if (lang) add(lang.name, "Language", lang.name);
    }
  }
  return out.sort((a,b) => `${a.kind} ${a.name}`.localeCompare(`${b.kind} ${b.name}`));
}
function speciesChoiceSpecs(species) {
  const specs = [];
  const root = species?.entries;
  if (!root) return specs;
  const choicePattern = /\b(?:choose|select)\b[^.]{0,160}\b(?:one|an option|option|following)\b/i;
  const lineagePattern = /\b(?:lineage|lineages|ancestry|ancestries|legacy|legacies|heritage|heritages)\b/i;
  const abilityChoicesFromText = text => /\bspellcasting ability\b/i.test(text) ? ABILITIES.filter(k => new RegExp(`\\b${ABILITY_NAMES[k]}\\b`, "i").test(text)) : [];
  const cleanOption = item => {
    if (typeof item === "string") return { name: stripTags(item), entries: [] };
    if (!item || typeof item !== "object") return null;
    return { name: stripTags(item.name || item.title || ""), entries: item.entries || item.entry || item.items || [], raw: item };
  };
  const register = (names, context) => {
    const unique=[]; for (const opt of names) if (opt && opt.name && !unique.some(x => textNorm(x.name)===textNorm(opt.name))) unique.push(opt);
    if (unique.length < 2 || unique.length > 12) return;
    if (!(choicePattern.test(context) || lineagePattern.test(context))) return;
    const key = `${species?.name || "Species"}|${species?.source || ""}|choice|${specs.length}`;
    const abilityFrom = abilityChoicesFromText(context);
    specs.push({ key, index: specs.length, options: unique, abilityFrom, label: lineagePattern.test(context) ? "Lineage / ancestry choice" : "Species choice" });
  };
  const walk = (node, context = "") => {
    if (Array.isArray(node)) {
      for (let i=0;i<node.length;i++) {
        const siblingContext = `${context} ${node.slice(Math.max(0,i-2),i+1).map(plainTextFromEntries).join(" ")}`;
        walk(node[i], siblingContext);
      }
      return;
    }
    if (!node || typeof node !== "object") return;
    const own = `${context} ${stripTags(node.name || node.title || "")} ${plainTextFromEntries(node.entries || node.entry || "")}`;
    const type = String(node.type || "").toLowerCase();
    if (type === "list" || type === "items") {
      const items = Array.isArray(node.items) ? node.items : Array.isArray(node.entries) ? node.entries : [];
      register(items.map(cleanOption), own);
    } else if (type === "table") {
      const rows = Array.isArray(node.rows) ? node.rows : [];
      register(rows.map(r => cleanOption(Array.isArray(r) ? r[0] : r)), own);
    }
    for (const [k,v] of Object.entries(node)) if (!["name","title","type"].includes(k)) walk(v, own);
  };
  walk(root, species?.name || "Species");
  const out=[]; for (const spec of specs) if (!out.some(x => x.options.length===spec.options.length && x.options.every((o,i)=>textNorm(o.name)===textNorm(spec.options[i].name)))) out.push(spec);
  const fullText = stripTags(plainTextFromEntries(root));
  const fullAbilityFrom = /\bspellcasting ability\b/i.test(fullText) ? ABILITIES.filter(k => new RegExp(`\\b${ABILITY_NAMES[k]}\\b`, "i").test(fullText)) : [];
  if (fullAbilityFrom.length && out.length) for (const spec of out) if (!spec.abilityFrom.length) spec.abilityFrom = fullAbilityFrom.slice();
  return out.slice(0,8);
}
function reconcileSpeciesChoices(c, species) {
  c.speciesChoices = { ...(c.speciesChoices || {}) };
  const specs = speciesChoiceSpecs(species);
  const valid = new Set(specs.map(s => s.key));
  for (const key of Object.keys(c.speciesChoices)) if (!valid.has(key)) delete c.speciesChoices[key];
  for (const spec of specs) {
    const chosen = c.speciesChoices[spec.key];
    if (chosen && !spec.options.some(o => textNorm(o.name) === textNorm(chosen.value || chosen))) delete c.speciesChoices[spec.key];
  }
  return specs;
}

function reconcileFeatChoices(c, feats) {
  c.featAbilityChoices = { ...(c.featAbilityChoices || {}) };
  c.featSaveChoices = { ...(c.featSaveChoices || {}) };
  c.featSkillChoices = { ...(c.featSkillChoices || {}) };
  c.featMixedChoices = { ...(c.featMixedChoices || {}) };
  c.featSpellChoices = { ...(c.featSpellChoices || {}) };
  c.featExpertiseChoices = { ...(c.featExpertiseChoices || {}) };
  const validMixed = new Set(), validSpell = new Set(), validExpertise = new Set();
  for (const feat of feats || []) {
    for (const spec of featAbilitySpecs(feat)) { const key=featSpecKey(feat,spec); if (spec.fixed) c.featAbilityChoices[key]=spec.from[0]; else if (!spec.from.includes(c.featAbilityChoices[key])) c.featAbilityChoices[key]=null; }
    for (const spec of featSaveSpecs(feat)) { const key=featSpecKey(feat,spec); if (spec.fixed) c.featSaveChoices[key]=spec.from[0]; else if (!spec.from.includes(c.featSaveChoices[key])) c.featSaveChoices[key]=null; }
    for (const spec of featSkillSpecs(feat)) { const key=featSpecKey(feat,spec); if (spec.fixed) c.featSkillChoices[key]=spec.from[0]; else if (!spec.from.includes(c.featSkillChoices[key])) c.featSkillChoices[key]=null; }
    for (const spec of featMixedChoiceSpecs(feat)) validMixed.add(spec.key);
    for (const spec of featAdditionalSpellChoiceSpecs(feat)) validSpell.add(spec.key);
    for (const spec of featExpertiseSpecs(feat)) validExpertise.add(spec.key);
  }
  for (const key of Object.keys(c.featMixedChoices)) if (!validMixed.has(key)) delete c.featMixedChoices[key];
  for (const key of Object.keys(c.featSpellChoices)) if (!validSpell.has(key)) delete c.featSpellChoices[key];
  for (const key of Object.keys(c.featExpertiseChoices)) if (!validExpertise.has(key)) delete c.featExpertiseChoices[key];
}
function canonicalLabel(value, kind = "") {
  const raw = decodeHtmlEntities(String(value || "")).trim();
  if (!raw) return "";
  const plain = raw.split("|")[0].trim();
  const norm = plain.replace(/[^a-z0-9]/gi, "").toLowerCase();
  for (const [key, [, name]] of Object.entries(SKILLS)) if (key.replace(/[^a-z0-9]/gi, "").toLowerCase() === norm || name.replace(/[^a-z0-9]/gi, "").toLowerCase() === norm) return name;
  if (kind === "feat") {
    const found = findFeat(plain, raw.includes("|") ? raw.split("|")[1] : null);
    if (found) return found.name;
  }
  if (kind === "spell") {
    const [refName, refSource] = raw.split("|");
    const found = getLoadedSpells().find(x => x.name?.toLowerCase() === String(refName || "").trim().toLowerCase() && (!refSource || x.source?.toLowerCase() === refSource.toLowerCase()));
    if (found) return found.name;
  }
  if (kind === "item") {
    const found = state.data.items ? officialEntries(state.data.items, "item").find(x => x.name.toLowerCase() === plain.toLowerCase() && (!raw.includes("|") || x.source === raw.split("|")[1])) : null;
    if (found) return found.name;
  }
  if (["condition","status","variantrule","action","sense","book","language","race","background","class","subclass"].includes(kind)) {
    const found = findReferenceEntitySync(kind, plain, raw.includes("|") ? raw.split("|")[1] : null);
    if (found?.name) return found.name;
  }
  const aliases = {
    animalhandling: "Animal Handling", sleightofhand: "Sleight of Hand", savageattacker: "Savage Attacker",
    spellattack: "Spell Attack", passiveperception: "Passive Perception", heroicinspiration: "Heroic Inspiration",
    simple: "Simple Weapons", simples: "Simple Weapons", simpleweapon: "Simple Weapons", martial: "Martial Weapons", martialweapons: "Martial Weapons",
    light: "Light Armor", medium: "Medium Armor", heavy: "Heavy Armor", shield: "Shields", shields: "Shields",
    advantage: "Advantage", disadvantage: "Disadvantage", concentration: "Concentration",
  };
  if (aliases[norm]) return aliases[norm];
  return plain.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\s+/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

function splitTagParts(body) {
  return decodeHtmlEntities(body).split("|").map(x => x.trim());
}

function isLikelySourceToken(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  if (state.data.officialSources?.has?.(raw)) return true;
  if (["PHB","XPHB","DMG","XDMG","MM","XMM","SRD","TCE","XGE","VGM","SCAG","FRAiF","FRHoF","EFA","ABH","HBW"].includes(raw.toUpperCase())) return true;
  return /^[A-Z][A-Z0-9-]{1,11}$/.test(raw);
}

function looksLikeSentenceLabel(value) {
  const raw = String(value || "").trim();
  return raw.length > 44 || /[.!?,;:]\s/.test(raw);
}

function parseInlineTag(tag, body) {
  const kind = String(tag || "").toLowerCase();
  const parts = splitTagParts(body);
  if (kind === "link") {
    return { tag: kind, url: parts[0] || "", name: parts[0] || "", source: null, label: parts[1] || parts[0] || "" };
  }
  const name = parts[0] || "";
  if (kind === "filter") {
    return { tag: kind, name, source: null, label: name, page: parts[1] || null, filterParams: parts.slice(2) };
  }
  let source = null;
  let label = name;
  if (parts[1] && isLikelySourceToken(parts[1])) {
    source = parts[1];
    label = parts[2] || name;
  } else if (parts[1]) {
    label = parts[1];
    if (parts[2] && isLikelySourceToken(parts[2])) source = parts[2];
  }
  // Variant-rule tags commonly have prose in their third field. That field is metadata,
  // not the visible name, so always keep the canonical rule name when a source is present.
  if (kind === "variantrule") {
    if (source && looksLikeSentenceLabel(label)) label = name;
    else if (!source && parts.length > 2 && isLikelySourceToken(parts[2])) { source = parts[2]; label = name; }
  }
  return { tag: kind, name, source, label };
}

function referenceIsInteractive(tag) {
  return ["spell","item","feat","race","background","class","subclass","classfeature","subclassfeature","optionalfeature","optfeature","condition","status","language","action","sense","variantrule","book","skill","mastery"].includes(String(tag || "").toLowerCase());
}

const BASIC_RULE_FALLBACKS = {
  "advantage": {
    name: "Advantage",
    source: "XPHB",
    entries: ["When you have Advantage on a d20 Test, roll two d20s and use the higher roll."]
  },
  "disadvantage": {
    name: "Disadvantage",
    source: "XPHB",
    entries: ["When you have Disadvantage on a d20 Test, roll two d20s and use the lower roll."]
  },
  "concentration": {
    name: "Concentration",
    source: "XPHB",
    entries: ["Some spells require Concentration. You can maintain Concentration on only one spell at a time, and certain events can end it."]
  },
  "resistance": {
    name: "Resistance",
    source: "XPHB",
    entries: ["Resistance reduces damage of the specified type by half, subject to the normal rules for rounding."]
  },
  "initiative": {
    name: "Initiative",
    source: "XPHB",
    entries: ["Initiative determines the order of turns in combat and is normally based on your Dexterity modifier."]
  }
};

function findByNameAndSource(entries, name, source = null) {
  const needle = String(name || "").trim().toLowerCase();
  const src = source ? String(source).toLowerCase() : null;
  if (!needle) return null;
  return (entries || []).find(x => String(x?.name || "").toLowerCase() === needle && (!src || String(x?.source || "").toLowerCase() === src)) ||
    (entries || []).find(x => String(x?.name || "").toLowerCase() === needle) || null;
}

function findClassFeatureByName(name, source = null, subclass = false) {
  const list = subclass ? (state.lastDerived?.subclassFeatures || []) : (state.lastDerived?.classFeatures || []);
  return findByNameAndSource(list, name, source);
}

function referenceCacheKey(tag, name, source = null) {
  return `${String(tag || "").toLowerCase()}|${String(name || "").trim().toLowerCase()}|${String(source || "").trim().toLowerCase()}`;
}
function cacheReferenceEntity(tag, entity) {
  if (!entity?.name) return entity;
  if (!state.data.referenceCache) state.data.referenceCache = new Map();
  state.data.referenceCache.set(referenceCacheKey(tag, entity.name, entity.source), entity);
  return entity;
}

function findReferenceEntitySync(tag, name, source = null) {
  const kind = String(tag || "").toLowerCase();
  const needle = String(name || "").trim().toLowerCase();
  if (!needle) return null;
  const cached = state.data.referenceCache?.get(referenceCacheKey(kind, name, source));
  if (cached) return cached;
  if (kind === "spell") {
    const found = getLoadedSpells().find(x => x.name?.toLowerCase() === needle && (!source || x.source?.toLowerCase() === String(source).toLowerCase()));
    return found ? cacheReferenceEntity(kind, found) : null;
  }
  if (kind === "item") {
    const found = findOfficialItemByName(name, source) || findOfficialItemByName(canonicalLabel(name, "item"), source);
    return found ? cacheReferenceEntity(kind, found) : null;
  }
  if (kind === "feat") return findFeat(name, source);
  if (kind === "race") return findSpecies(name, source);
  if (kind === "background") return findBackground(name, source);
  if (kind === "language") return findLanguage(name, source);
  if (kind === "condition" || kind === "status") {
    const prop = kind === "status" ? "status" : "condition";
    const entries = officialEntries(state.data.conditionsdiseases, prop);
    return findByNameAndSource(entries, name, source) || (BASIC_RULE_FALLBACKS[needle] || null);
  }
  if (kind === "action") {
    const entries = officialEntries(state.data.actions, "action");
    return findByNameAndSource(entries, name, source);
  }
  if (kind === "variantrule") {
    const entries = officialEntries(state.data.variantrules, "variantrule");
    return findByNameAndSource(entries, name, source) || (BASIC_RULE_FALLBACKS[needle] || null);
  }
  if (kind === "sense") {
    const senseKey = SPECIAL_SENSES.find(x => textNorm(x) === textNorm(name)) || null;
    if (senseKey) return cacheReferenceEntity(kind, SPECIAL_SENSE_FALLBACKS[senseKey]);
    const entries = officialEntries(state.data.variantrules, "variantrule");
    const found = findByNameAndSource(entries, name, source) || findByNameAndSource(officialEntries(state.data.actions, "action"), name, source) || null;
    return found ? cacheReferenceEntity(kind, found) : null;
  }
  if (kind === "book") {
    const entries = officialEntries(state.data.books, "book");
    return findByNameAndSource(entries, name, source) || null;
  }
  if (kind === "class") {
    const current = state.lastDerived?.classObj;
    if (current && current.name?.toLowerCase() === needle && (!source || current.source === source)) return current;
    const all = Array.from(state.data.classFiles?.values?.() || []).flatMap(x => x.class || []).filter(isOfficial2024Entity);
    return findByNameAndSource(all, name, source);
  }
  if (kind === "subclass") {
    const current = state.lastDerived?.subclassObj;
    if (current && current.name?.toLowerCase() === needle && (!source || current.source === source)) return current;
    return findByNameAndSource(state.lastDerived?.subclassOptions || [], name, source);
  }
  if (kind === "classfeature") return findClassFeatureByName(name, source, false);
  if (kind === "subclassfeature") return findClassFeatureByName(name, source, true);
  if (kind === "optionalfeature" || kind === "optfeature") return findOfficial(state.data.optionalfeatures, "optionalfeature", name, source);
  if (kind === "mastery") return masteryRuleFallback(name);
  if (kind === "skill") return { name: canonicalLabel(name, "skill"), source: "XPHB", type: "skill" };
  return null;
}

async function findReferenceEntity(tag, name, source = null) {
  const kind = String(tag || "").toLowerCase();
  if (kind === "item" && !state.data.items) {
    try { await getItemsData(); } catch {}
  }
  let found = findReferenceEntitySync(kind, name, source);
  if (found) return found;
  if (kind === "spell") {
    found = await getSpellById(`${name}${source ? `|${source}` : ""}`);
    if (found) return found;
  }
  if (kind === "class" && name) {
    try {
      const file = await getClassDetails(name);
      found = getClassFromFile(file, name, source);
      if (found) return found;
    } catch {}
  }
  if (kind === "subclass" && name) {
    const className = state.character?.class?.name;
    if (className) {
      try {
        const file = await getClassDetails(className);
        const options = getSubclassOptions(file, className);
        found = findByNameAndSource(options, name, source);
        if (found) return found;
      } catch {}
    }
  }
  if ((kind === "classfeature" || kind === "subclassfeature") && name) {
    const className = state.character?.class?.name;
    if (className) {
      try {
        const file = await getClassDetails(className);
        const classObj = getClassFromFile(file, className, state.character?.class?.source || null);
        const features = kind === "classfeature" ? getClassFeatures(file, classObj, state.character?.level || 1) : getSubclassFeatures(file, state.lastDerived?.subclassObj, state.character?.level || 1);
        found = findByNameAndSource(features, name, source);
        if (found) return found;
      } catch {}
    }
  }
  return found;
}

function tagLabel(tag, body) {
  const { tag: kind, name, source, label } = parseInlineTag(tag, body);
  if (["b", "bold", "i", "italic", "u", "underline", "s", "strike", "kbd"].includes(kind)) return label;
  if (["skill", "feat", "spell", "item", "race", "background", "class", "subclass", "classfeature", "subclassfeature", "optionalfeature", "optfeature", "condition", "status", "language", "action", "sense", "variantrule", "book", "mastery"].includes(kind)) {
    const entity = findReferenceEntitySync(kind, name, source);
    if (entity?.name) return entity.name;
    if (label && label !== name && !/^X[A-Z0-9]+$/i.test(label)) return label;
    return canonicalLabel(name, kind);
  }
  if (kind === "dice" || kind === "damage" || kind === "dc" || kind === "hit" || kind === "chance") return label || name;
  if (kind === "filter") return label || name || "Filter";
  if (kind === "link") return label || name;
  return label || name || kind;
}

function sanitizeExternalUrl(url) {
  const value = String(url || "").trim();
  try {
    const parsed = new URL(value, window.location.href);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch { return null; }
}

function renderReferenceTag(tag, body) {
  const info = parseInlineTag(tag, body);
  if (info.tag === "link") {
    const href = sanitizeExternalUrl(info.url);
    const label = info.label || info.url;
    return href ? `<a class="rules-external-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>` : escapeHtml(label);
  }
  const label = tagLabel(tag, body);
  if (!referenceIsInteractive(info.tag)) return `<span class="rules-chip" title="${escapeHtml(info.tag)}">${escapeHtml(label)}</span>`;
  const payload = encodeURIComponent(JSON.stringify({ tag: info.tag, name: info.name, source: info.source, label }));
  return `<button type="button" class="rules-ref-link" data-ref="${escapeHtml(payload)}" title="View ${escapeHtml(label)}"><span>${escapeHtml(label)}</span></button>`;
}

function findInlineTagEnd(text, start) {
  let depth = 1;
  for (let i = start + 2; i < text.length; i++) {
    if (text.startsWith("{@", i)) { depth++; i++; continue; }
    if (text[i] === "}") { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function renderInlineTag(tag, body) {
  const kind = String(tag || "").toLowerCase();
  if (["b", "bold"].includes(kind)) return `<strong>${renderInline(body)}</strong>`;
  if (["i", "italic"].includes(kind)) return `<em>${renderInline(body)}</em>`;
  if (["u", "underline"].includes(kind)) return `<u>${renderInline(body)}</u>`;
  if (["s", "strike"].includes(kind)) return `<s>${renderInline(body)}</s>`;
  if (kind === "kbd") return `<kbd>${renderInline(body)}</kbd>`;
  if (kind === "br") return "<br>";
  if (kind === "note") return `<span class="rules-chip">${renderInline(body)}</span>`;
  return renderReferenceTag(tag, body);
}

function renderInline(text) {
  const input = String(text ?? "");
  let out = "";
  let pos = 0;
  while (pos < input.length) {
    const start = input.indexOf("{@", pos);
    if (start < 0) { out += escapeHtml(input.slice(pos)); break; }
    out += escapeHtml(input.slice(pos, start));
    const end = findInlineTagEnd(input, start);
    if (end < 0) { out += escapeHtml(input.slice(start)); break; }
    const inner = input.slice(start + 2, end);
    const space = inner.search(/\s/);
    if (space < 0) {
      const tag = inner.trim();
      if (tag === "br") out += renderInlineTag(tag, "");
      else if (tag === "hr") out += "<hr class=\"rules-hr\">";
      else out += escapeHtml(input.slice(start, end + 1));
    } else {
      const tag = inner.slice(0, space);
      const body = inner.slice(space + 1);
      out += renderInlineTag(tag, body);
    }
    pos = end + 1;
  }
  return out;
}

function renderRichEntry(entry, depth = 0) {
  if (entry == null) return "";
  if (typeof entry === "string") return `<p>${renderInline(entry)}</p>`;
  if (typeof entry === "number" || typeof entry === "boolean") return `<p>${escapeHtml(entry)}</p>`;
  if (Array.isArray(entry)) return entry.map(x => renderRichEntry(x, depth)).join("");
  if (typeof entry !== "object") return "";
  const type = String(entry.type || "").toLowerCase();
  const title = entry.name ? `<h4>${renderInline(entry.name)}</h4>` : "";
  if (type === "list" || type === "items") {
    const items = entry.items || entry.entries || [];
    return `<ul>${items.map(x => `<li>${renderRichEntry(x, depth + 1).replace(/^<p>(.*)<\/p>$/s, "$1")}</li>`).join("")}</ul>`;
  }
  if (type === "table") {
    const headers = entry.colLabels || [];
    const rows = entry.rows || [];
    return `<div class="rules-table-wrap"><table class="rules-table">${headers.length ? `<thead><tr>${headers.map(h => `<th>${renderInline(h)}</th>`).join("")}</tr></thead>` : ""}<tbody>${rows.map(row => `<tr>${(row || []).map(cell => `<td>${renderRichEntry(cell, depth + 1).replace(/^<p>(.*)<\/p>$/s, "$1")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  if (type === "quote") return `<blockquote>${title}${renderRichEntry(entry.entries || entry.entry || [], depth + 1)}</blockquote>`;
  if (type === "inset" || type === "insetreadaloud") return `<aside class="rules-inset">${title}${renderRichEntry(entry.entries || entry.entry || [], depth + 1)}</aside>`;
  if (type === "image") return entryalt(entry);
  if (entry.entries) return `<section class="rules-section depth-${Math.min(depth, 3)}">${title}${renderRichEntry(entry.entries, depth + 1)}</section>`;
  if (entry.entry) return `<section class="rules-section depth-${Math.min(depth, 3)}">${title}${renderRichEntry(entry.entry, depth + 1)}</section>`;
  if (entry.items) return renderRichEntry({ type: "list", items: entry.items }, depth);
  const fragments = [];
  if (entry.name && !title) fragments.push(`<strong>${renderInline(entry.name)}</strong>`);
  for (const [key, value] of Object.entries(entry)) {
    if (["name", "type", "id", "style", "colLabels", "colStyles", "rows"].includes(key)) continue;
    fragments.push(renderRichEntry(value, depth + 1));
  }
  return fragments.join("");
}

function entryalt(entry) {
  const alt = entry.altText || entry.title || "Illustration";
  return `<div class="rules-image-placeholder">${escapeHtml(alt)}</div>`;
}

function renderRichEntries(entries) { return renderRichEntry(entries); }

function plainTextFromEntries(entries) {
  if (entries == null) return "";
  if (typeof entries === "string") return stripTags(entries);
  if (typeof entries === "number" || typeof entries === "boolean") return String(entries);
  if (Array.isArray(entries)) return entries.map(plainTextFromEntries).filter(Boolean).join(" ");
  if (typeof entries === "object") {
    const parts = [];
    if (entries.name) parts.push(canonicalLabel(entries.name));
    if (entries.entry) parts.push(plainTextFromEntries(entries.entry));
    if (entries.entries) parts.push(plainTextFromEntries(entries.entries));
    if (entries.items) parts.push(plainTextFromEntries(entries.items));
    return parts.filter(Boolean).join(" ");
  }
  return "";
}

function entriesToText(entries) { return plainTextFromEntries(entries); }

function stripTags(text) {
  let out = String(text);
  for (let i = 0; i < 8; i++) {
    out = out.replace(/\{@([\w-]+)\s+([^{}]*)\}/g, (_, tag, body) => tagLabel(tag, body));
  }
  return out.replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

function abilityMod(score) { return Math.floor((Number(score || 10) - 10) / 2); }
function formatMod(mod) { return mod >= 0 ? `+${mod}` : String(mod); }
function proficiencyBonus(level) { return 2 + Math.floor((Math.max(1, Number(level || 1)) - 1) / 4); }
function classSpellSlots(classObj, level) {
  const lvl = Math.max(1, Number(level || 1));
  const progressionGroup = (classObj?.classTableGroups || []).find(g => Array.isArray(g.rowsSpellProgression));
  const progressionRow = progressionGroup?.rowsSpellProgression?.[lvl - 1];
  if (Array.isArray(progressionRow)) return progressionRow.slice(0, 9).map(v => Math.max(0, Number(v) || 0));

  // Some 2024 classes (notably Warlock) expose Pact Magic in an ordinary
  // class-table row instead of rowsSpellProgression. The table contains both
  // the number of slots and the level of those slots.
  for (const group of classObj?.classTableGroups || []) {
    const labels = Array.isArray(group.colLabels) ? group.colLabels : [];
    const slotIdx = labels.findIndex(label => textNorm(stripTags(label)) === "spellslots" || textNorm(stripTags(label)).includes("spellslots"));
    const slotLevelIdx = labels.findIndex(label => textNorm(stripTags(label)) === "slotlevel" || textNorm(stripTags(label)).includes("slotlevel"));
    if (slotIdx < 0 || slotLevelIdx < 0 || !Array.isArray(group.rows)) continue;
    const row = group.rows[lvl - 1];
    if (!Array.isArray(row)) continue;
    const count = Number(row[slotIdx]);
    const slotLevel = Number(row[slotLevelIdx]);
    if (!Number.isFinite(count) || !Number.isFinite(slotLevel) || count <= 0 || slotLevel < 1 || slotLevel > 9) continue;
    const out = Array(9).fill(0);
    out[slotLevel - 1] = Math.floor(count);
    return out;
  }
  return [];
}
function classCantrips(classObj, level) { return Number(classObj?.cantripProgression?.[level - 1] || 0) || null; }
function classPrepared(classObj, level, mods) {
  const prog = classObj?.preparedSpellsProgression?.[level - 1];
  if (Number.isFinite(prog)) return prog;
  if (typeof classObj?.preparedSpells === "string") {
    const match = classObj.preparedSpells.match(/<\$level\$>\s*\+\s*<\$(\w+)_mod\$>/);
    if (match) return Math.max(1, level + Number(mods[match[1]] || 0));
  }
  return null;
}
function classKnownSpells(classObj, level) {
  // Prepared/spellbook casters don't have a fixed "known spells" cap. In
  // particular, the Wizard's fixed progression describes spells added to the
  // spellbook rather than the maximum number of spells the wizard can know.
  if (Array.isArray(classObj?.preparedSpellsProgression) || classObj?.preparedSpells || classObj?.spellbook) return null;
  const prog = classObj?.spellsKnownProgressionFixed;
  if (!Array.isArray(prog)) return null;
  const value = Number(prog[Math.max(0, Number(level || 1) - 1)] || 0);
  return value || null;
}
function hitDieFaces(classObj) { return Number(classObj?.hd?.faces || 8); }
function defaultMaxHp(classObj, level, conMod, override) {
  const hasOverride = override !== null && override !== undefined && override !== "" && Number.isFinite(Number(override));
  if (hasOverride) return Math.max(1, Number(override));
  const lvl = Math.max(1, Number(level || 1));
  const faces = hitDieFaces(classObj);
  const first = Math.max(1, faces + conMod);
  const later = Math.max(1, Math.floor(faces / 2) + 1 + conMod);
  return Math.max(1, first + Math.max(0, lvl - 1) * later);
}
function spellSchoolName(code) { return SPELL_SCHOOLS[code] || code || ""; }
function skillChoiceSpec(classObj) {
  const groups = classObj?.startingProficiencies?.skills || [];
  const choose = groups.find(x => x?.choose)?.choose;
  return choose ? { from: normalizeSkillArray(choose.from || []), count: Number(choose.count || 1) } : { from: [], count: 0 };
}
function grantedSkillsFromMap(mapList) {
  const out = new Set();
  for (const obj of mapList || []) for (const [skill, enabled] of Object.entries(obj || {})) if (enabled) { const key = normalizeSkillKey(skill); if (key) out.add(key); }
  return [...out];
}
function backgroundAbilitySpec(bg) {
  const entries = Array.isArray(bg?.ability) ? bg.ability : [];
  const choices = [];
  const plus2From = new Set();
  const plus1From = new Set();
  let supportsThree = false;
  let threeFrom = [];

  for (const [index, entry] of entries.entries()) {
    const choose = entry?.choose;
    if (choose?.weighted) {
      const from = (Array.isArray(choose.weighted.from) ? choose.weighted.from : []).map(normalizeAbilityKey).filter(Boolean);
      const weights = Array.isArray(choose.weighted.weights) ? choose.weighted.weights.map(Number) : [];
      choices.push({ index, from, weighted: true, weights });
      if (weights.includes(2)) from.forEach(a => plus2From.add(a));
      if (weights.includes(1)) from.forEach(a => plus1From.add(a));
      if (weights.length >= 3 && weights.every(w => w === 1)) {
        supportsThree = true;
        threeFrom = [...new Set([...threeFrom, ...from])];
      }
      continue;
    }
    if (choose) {
      const from = (Array.isArray(choose.from) ? choose.from : []).map(normalizeAbilityKey).filter(Boolean);
      const amount = Number(choose.amount || 1);
      const count = Math.max(1, Number(choose.count || 1));
      choices.push({ index, from, amount, count });
      if (amount === 2) from.forEach(a => plus2From.add(a));
      if (amount === 1) from.forEach(a => plus1From.add(a));
      if (amount === 1 && count >= 3) { supportsThree = true; threeFrom = [...new Set([...threeFrom, ...from])]; }
      continue;
    }
    for (const [ability, value] of Object.entries(entry || {})) {
      const a = normalizeAbilityKey(ability);
      if (value === 2) plus2From.add(a);
      if (value === 1) plus1From.add(a);
    }
  }
  return { choices, plus2From:[...plus2From].filter(a=>ABILITIES.includes(a)), plus1From:[...plus1From].filter(a=>ABILITIES.includes(a)), supportsThree, threeFrom: threeFrom.filter(a=>ABILITIES.includes(a)) };
}

function applyBackgroundAbilityFallback(c, bg) {
  const spec = backgroundAbilitySpec(bg);
  if (!spec.supportsThree) c.backgroundAbility.mode = 'split';
}

function reconcileBackgroundAbilityChoices(c, bg) {
  const prior = c.backgroundAbility || {};
  c.backgroundAbility = {
    mode: ['split','three'].includes(prior.mode) ? prior.mode : 'split',
    plus2: prior.plus2 || null,
    plus1: prior.plus1 || null,
    plus1b: prior.plus1b || null,
    plus1c: prior.plus1c || null,
  };
  const spec = backgroundAbilitySpec(bg);
  if (!spec.supportsThree && c.backgroundAbility.mode === 'three') c.backgroundAbility.mode = 'split';
  if (c.backgroundAbility.mode === 'three') {
    const choices = [c.backgroundAbility.plus1, c.backgroundAbility.plus1b, c.backgroundAbility.plus1c].filter(Boolean);
    const fixed = [];
    for (const value of choices) if (spec.threeFrom.includes(value) && !fixed.includes(value)) fixed.push(value);
    while (fixed.length < 3) {
      const next = spec.threeFrom.find(a => !fixed.includes(a));
      if (!next) break;
      fixed.push(next);
    }
    c.backgroundAbility.plus1 = fixed[0] || null;
    c.backgroundAbility.plus1b = fixed[1] || null;
    c.backgroundAbility.plus1c = fixed[2] || null;
    c.backgroundAbility.plus2 = null;
    return;
  }
  c.backgroundAbility.plus2 = spec.plus2From.includes(c.backgroundAbility.plus2) ? c.backgroundAbility.plus2 : (spec.plus2From[0] || null);
  const validPlus1 = spec.plus1From.filter(a => a !== c.backgroundAbility.plus2);
  c.backgroundAbility.plus1 = validPlus1.includes(c.backgroundAbility.plus1) ? c.backgroundAbility.plus1 : (validPlus1[0] || null);
  c.backgroundAbility.plus1b = null;
  c.backgroundAbility.plus1c = null;
}

function backgroundFeatNames(bg) {
  const feats = bg?.feats || [];
  const refs = [];
  for (const obj of feats) {
    if (!obj || typeof obj !== "object") continue;
    for (const key of Object.keys(obj)) {
      const [nameAndSource] = key.split(";");
      const [name, source] = nameAndSource.split("|");
      const resolved = findFeat(name, source || null);
      refs.push({ name: resolved?.name || name.trim(), source: resolved?.source || source || null });
    }
  }
  const seen = new Set(); return refs.filter(r => { const key=`${r.name}|${r.source||""}`; if(seen.has(key)) return false; seen.add(key); return true; });
}


function calculateFinalStats(c, bg, featObjs = selectedFeatObjects(c)) {
  const stats = { ...(c.baseStats || c.stats || {}) };
  for (const a of ABILITIES) stats[a] = clamp(Number(stats[a] ?? 10), 1, 30);
  const bgAbility = c.backgroundAbility || {};
  if (bgAbility.mode === "three") {
    for (const ability of [bgAbility.plus1, bgAbility.plus1b, bgAbility.plus1c]) if (ability && ABILITIES.includes(ability)) stats[ability] = Math.min(20, Number(stats[ability]) + 1);
  } else {
    const bonus2 = bgAbility.plus2;
    const bonus1 = bgAbility.plus1;
    if (bonus2 && ABILITIES.includes(bonus2)) stats[bonus2] = Math.min(20, Number(stats[bonus2]) + 2);
    if (bonus1 && ABILITIES.includes(bonus1) && bonus1 !== bonus2) stats[bonus1] = Math.min(20, Number(stats[bonus1]) + 1);
  }
  for (const feat of featObjs || []) {
    for (const spec of featAbilitySpecs(feat)) {
      const key = featSpecKey(feat, spec);
      const selected = c.featAbilityChoices?.[key];
      const ability = spec.fixed ? spec.from[0] : selected;
      if (ability && ABILITIES.includes(ability)) stats[ability] = Math.min(30, Number(stats[ability]) + Number(spec.amount || 0));
    }
  }
  for (const a of ABILITIES) stats[a] = Math.min(30, Number(stats[a]) + Number(c.manualAbilityBonuses?.[a] || 0));
  return stats;
}

function friendlyProficiencyKey(key) {
  const map = {
    anyArtisansTool: "Choose an Artisan's Tool", anyArtisansTools: "Choose an Artisan's Tool",
    anyGamingSet: "Choose a Gaming Set", anyMusicalInstrument: "Choose a Musical Instrument",
    anyLanguage: "Choose a Language", anyStandard: "Choose a standard language", anyExotic: "Choose an exotic language",
    thievesTools: "Thieves' Tools", disguiseKit: "Disguise Kit", forgeryKit: "Forgery Kit", herbalismKit: "Herbalism Kit",
    navigatorTools: "Navigator's Tools", vehiclesLand: "Land Vehicles", vehiclesWater: "Water Vehicles", vehiclesAir: "Air Vehicles",
  };
  if (map[key]) return map[key];
  const norm = String(key || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const aliases = { simple: "Simple Weapons", martial: "Martial Weapons", light: "Light Armor", medium: "Medium Armor", heavy: "Heavy Armor", shield: "Shields", shields: "Shields" };
  if (aliases[norm]) return aliases[norm];
  return canonicalLabel(stripTags(key));
}

function dedupeLabels(values) {
  const seen = new Set(); const out = [];
  for (const value of values || []) { const label = String(value || "").trim(); if (!label) continue; const k = label.toLowerCase(); if (seen.has(k)) continue; seen.add(k); out.push(label); }
  return out;
}

function languageChoicesFromMap(map) {
  const labels = [];
  for (const [key, value] of Object.entries(map || {})) {
    const count = Number(value) || 1;
    const lower = key.toLowerCase();
    if (lower.startsWith("any")) labels.push(`${friendlyProficiencyKey(key)}${count > 1 ? ` ×${count}` : ""}`);
    else {
      const lang = findLanguage(key);
      labels.push(`${lang?.name || canonicalLabel(key)}${count > 1 ? ` ×${count}` : ""}`);
    }
  }
  return labels;
}

const ARTISAN_TOOL_OPTIONS = ["Alchemist's Supplies","Brewer's Supplies","Calligrapher's Supplies","Carpenter's Tools","Cartographer's Tools","Cobbler's Tools","Cook's Utensils","Glassblower's Tools","Jeweler's Tools","Leatherworker's Tools","Mason's Tools","Painter's Supplies","Potter's Tools","Smith's Tools","Tinker's Tools","Weaver's Tools","Woodcarver's Tools"];
const GAMING_SET_OPTIONS = ["Dice","Dragonchess","Playing Cards","Three-Dragon Ante"]; 
const MUSICAL_INSTRUMENT_OPTIONS = ["Bagpipes","Drum","Dulcimer","Flute","Lute","Lyre","Pan Flute","Shawm","Viol"]; 
const TOOL_GENERIC_OPTIONS = [...ARTISAN_TOOL_OPTIONS, ...GAMING_SET_OPTIONS, ...MUSICAL_INSTRUMENT_OPTIONS, "Disguise Kit", "Forgery Kit", "Herbalism Kit", "Poisoner's Kit", "Navigator's Tools", "Thieves' Tools", "Vehicles (Land)", "Vehicles (Water)"];

function proficiencyChoiceSpecs(obj, prop, ownerKey) {
  const out = [];
  const sources = [];
  if (Array.isArray(obj?.[prop])) sources.push(...obj[prop].map((x, i) => ({ value: x, index: i })));
  for (const { value, index } of sources) {
    if (!value || typeof value !== "object") continue;
    if (value.choose) {
      const fromRaw = Array.isArray(value.choose.from) ? value.choose.from : [];
      const count = Number(value.choose.count || 1);
      if (count > 0) out.push({ key: `${ownerKey}:${prop}:choose:${index}`, from: fromRaw, count, kind: prop.includes("language") ? "language" : "tool" });
      continue;
    }
    for (const [key, amount] of Object.entries(value)) {
      if (!/^any/i.test(key)) continue;
      const count = Math.max(1, Number(amount) || 1);
      out.push({ key: `${ownerKey}:${prop}:any:${index}:${key}`, from: [key], count, kind: prop.includes("language") ? "language" : "tool", any: true });
    }
  }
  return out;
}

function proficiencyChoiceOwners(classObj, backgroundObj, speciesObj, featObjs = []) {
  const owners = [];
  if (classObj) owners.push({ key: "class", obj: classObj });
  if (backgroundObj) owners.push({ key: "background", obj: backgroundObj });
  if (speciesObj) owners.push({ key: "species", obj: speciesObj });
  for (const feat of featObjs || []) owners.push({ key: `feat:${feat.name}|${feat.source || ""}`, obj: feat });
  return owners;
}

function allLanguageOptionsForChoice(spec) {
  const from = Array.isArray(spec.from) ? spec.from : [];
  const expanded = [];
  for (const token of from) {
    const key = String(token || "");
    const low = key.toLowerCase();
    if (low === "anystandard" || low === "anylanguage") return officialEntries(state.data.languages, "language").sort((a,b)=>a.name.localeCompare(b.name));
    if (low === "anyexotic") return officialEntries(state.data.languages, "language").filter(x => String(x.type || "").toLowerCase().includes("exotic")).sort((a,b)=>a.name.localeCompare(b.name));
    const found = findLanguage(key);
    expanded.push(found || { name: friendlyProficiencyKey(key), source: DATA_SOURCE, _displayOnly: true });
  }
  return dedupeByName(expanded);
}

function standardLanguageOptions() {
  const all = officialEntries(state.data.languages, "language");
  return STANDARD_LANGUAGE_NAMES.map(name => {
    const found = findByNameAndSource(all, name, DATA_SOURCE) || all.find(x => String(x.name || "").toLowerCase() === name.toLowerCase());
    return found || { name, source: DATA_SOURCE, _displayOnly: true };
  });
}

function findOfficialItemByName(name, source = null) {
  const raw = String(name || "").trim();
  if (!raw) return null;
  const candidates = [raw, canonicalLabel(raw, "item")];
  if (/^(dragonchess|dice|playing cards|three-dragon ante)$/i.test(raw)) candidates.push(`${raw} Set`);
  if (/^playing cards$/i.test(raw)) candidates.push("Playing Card Set");
  for (const candidate of candidates) {
    const found = itemFromCatalog(candidate, source);
    if (found) return found;
  }
  return null;
}
function allToolOptionsForChoice(spec) {
  const from = Array.isArray(spec.from) ? spec.from : [];
  const items = officialEntries(state.data.items, "item");
  const byNames = names => names.map(name => {
    const found = findOfficialItemByName(name, DATA_SOURCE) || findOfficialItemByName(name);
    if (!found) return { name, source: DATA_SOURCE, _displayOnly: true, _displayName: String(name).replace(/\s+Set$/i, "") };
    return { ...found, _displayName: /^(dragonchess|dice|playing cards|three-dragon ante|playing card set|dice set|dragonchess set|three-dragon ante set)$/i.test(found.name) ? found.name.replace(/\s+Set$/i, "") : found.name };
  });
  if (from.some(x => /^anyartisans?tools?$/i.test(String(x)))) {
    const candidates = items.filter(x => {
      const type = String(x.type || "").toUpperCase();
      return type.startsWith("AT") || /artisan.?s? tools?/i.test(stripTags(JSON.stringify(x)));
    });
    return candidates.length ? dedupeByName(candidates.sort((a,b)=>a.name.localeCompare(b.name))) : byNames(ARTISAN_TOOL_OPTIONS);
  }
  if (from.some(x => /^anygamingset$/i.test(String(x)))) {
    const candidates = items.filter(x => {
      const type = String(x.type || "").toUpperCase();
      return type.startsWith("GS") || /gaming set|dragonchess|three-dragon ante|playing card|^dice$/i.test(String(x.name || ""));
    });
    const usable = candidates.length ? candidates : byNames(GAMING_SET_OPTIONS);
    return dedupeByName(usable.sort((a,b)=>a.name.localeCompare(b.name)).map(x => ({ ...x, _displayName: String(x.name || "").replace(/\s+Set$/i, "") })));
  }
  if (from.some(x => /^anymusicalinstrument$/i.test(String(x)))) {
    const candidates = items.filter(x => /instrument/i.test(String(x.type || "")) || /musical instrument/i.test(x.name));
    return candidates.length ? dedupeByName(candidates.sort((a,b)=>a.name.localeCompare(b.name))) : byNames(MUSICAL_INSTRUMENT_OPTIONS);
  }
  return dedupeByName(from.map(token => {
    const found = findOfficialItemByName(String(token).replace(/^.+\//, ""), DATA_SOURCE);
    return found || { name: friendlyProficiencyKey(String(token)), source: DATA_SOURCE, _displayOnly: true };
  }));
}

function dedupeByName(values) {
  const seen = new Set();
  return (values || []).filter(x => { const key=String(x?.name || "").toLowerCase(); if (!key || seen.has(key)) return false; seen.add(key); return true; });
}

function renderProficiencyChoiceFields(owners, c) {
  const specs = owners.flatMap(owner => [
    ...proficiencyChoiceSpecs(owner.obj, "languageProficiencies", owner.key),
    ...proficiencyChoiceSpecs(owner.obj?.startingProficiencies || {}, "languages", `${owner.key}:starting`),
    ...proficiencyChoiceSpecs(owner.obj, "toolProficiencies", owner.key),
    ...proficiencyChoiceSpecs(owner.obj?.startingProficiencies || {}, "tools", `${owner.key}:starting`),
  ]);
  return specs.map(spec => {
    const values = spec.kind === "language" ? allLanguageOptionsForChoice(spec) : allToolOptionsForChoice(spec);
    const storage = spec.kind === "language" ? (c.languageChoiceSlots || {}) : (c.toolChoiceSlots || {});
    return Array.from({length: spec.count}, (_, i) => {
      const slot = `${spec.key}:${i+1}`;
      const selected = storage[slot] || "";
      const label = spec.kind === "language" ? "Language" : "Tool proficiency";
      const selectedObj = values.find(v => String(v.name).toLowerCase() === String(selected).toLowerCase());
      let infoLink = "";
      if (selectedObj && !selectedObj._displayOnly) {
        const tag = spec.kind === "tool" ? "item" : "language";
        infoLink = `<div class="choice-reference">${renderReferenceTag(tag, `${selectedObj.name}|${selectedObj.source}|${selectedObj.name}`)}</div>`;
      }
      return `<div class="feat-choice-row"><label class="field">${escapeHtml(label)} · Choose ${i+1}<select data-proficiency-choice-kind="${spec.kind}" data-proficiency-choice-slot="${escapeHtml(slot)}"><option value="">— Select —</option>${values.map(v=>`<option value="${escapeHtml(v.name)}" ${String(selected).toLowerCase()===String(v.name).toLowerCase()?"selected":""}>${escapeHtml(v._displayName || v.name)}</option>`).join("")}</select></label>${infoLink}</div>`;
    }).join("");
  }).join("") || `<div class="empty">No automatic language or tool choices are encoded for the current selections.</div>`;
}

function inferSpeciesProficiencyEntries(speciesObj) {
  const tools = [], weapons = [], languages = [];
  const entries = Array.isArray(speciesObj?.entries) ? speciesObj.entries : [];
  const knownLanguages = officialEntries(state.data.languages, "language");
  for (const entry of entries) {
    const name = textNorm(entry?.name);
    const raw = JSON.stringify(entry?.entries || entry?.entry || entry || "");
    if (name.includes("language")) {
      const matches = [...raw.matchAll(/\{@language\s+([^|}]+)(?:\|([^|}]+))?\}/gi)];
      if (matches.length) languages.push(...matches.map(m => m[1]));
      else for (const lang of knownLanguages) if (new RegExp(`\\b${lang.name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i").test(stripTags(raw))) languages.push(lang.name);
    }
    if (name.includes("tool") || name.includes("weapon") || /proficien/i.test(stripTags(raw))) {
      const matches = [...raw.matchAll(/\{@item\s+([^|}]+)(?:\|([^|}]+))?\}/gi)];
      for (const m of matches) {
        const item = findByNameAndSource(officialEntries(state.data.items, "item"), m[1], m[2] || null);
        if (item?.weaponCategory) weapons.push(item.name);
        if (item && !item.weaponCategory) tools.push(item.name);
      }
    }
  }
  return { tools, weapons, languages };
}

function toolChoiceCategory(name) {
  const n = textNorm(name);
  if (/gaming set/.test(n)) return "gaming";
  if (/artisan/.test(n)) return "artisan";
  if (/musical instrument/.test(n)) return "musical";
  return null;
}

function toolConcreteCategory(name) {
  const direct = toolChoiceCategory(name);
  if (direct && /^choose a /i.test(String(name))) return null;
  const item = findOfficialItemByName(String(name), DATA_SOURCE) || findOfficialItemByName(String(name));
  const type = String(item?.type || "").toUpperCase();
  const itemName = String(item?.name || name);
  if (direct) return direct;
  if (type.startsWith("GS") || /gaming set/i.test(itemName)) return "gaming";
  if (type.startsWith("AT") || /artisan.?s? tools?/i.test(itemName)) return "artisan";
  if (/musical instrument/i.test(itemName)) return "musical";
  return null;
}
function cleanChoicePlaceholders(values, slots = {}) {
  const chosenValues = [...Object.values(slots || {}), ...(state.character.toolChoices || []), ...(state.character.manualToolProficiencies || [])].map(String);
  const normalizedChosenValues = chosenValues.map(v => displayToolProficiencyLabel(v));
  const selectedCategories = new Set([...chosenValues, ...normalizedChosenValues].map(toolConcreteCategory).filter(Boolean));
  const hasConcreteGaming = normalizedChosenValues.some(v => /dragonchess|three-dragon ante|playing cards|dice(?: set)?/i.test(v)) || selectedCategories.has("gaming");
  return (values || []).map(value => {
    const text = String(value || "").trim();
    if (/^Dragonchess Set$/i.test(text)) return "Dragonchess";
    if (/^Dice Set$/i.test(text)) return "Dice";
    if (/^Playing Card Set$/i.test(text)) return "Playing Cards";
    if (/^Three-Dragon Ante Set$/i.test(text)) return "Three-Dragon Ante";
    return text;
  }).filter(text => {
    const cat = toolChoiceCategory(text);
    if (/^choose a gaming set$/i.test(text) && hasConcreteGaming) return false;
    return !(cat && /^choose a /i.test(text) && selectedCategories.has(cat));
  });
}

function renderReferenceList(values, tag) {
  return [...new Set(values || [])].map(raw => {
    const value = canonicalLabel(raw);
    const entity = findReferenceEntitySync(tag, value, DATA_SOURCE);
    if (tag === "item" && entity?.name) return renderReferenceTag("item", `${entity.name}|${entity.source}|${entity.name}`);
    if (tag === "language") {
      const lang = findLanguage(value, DATA_SOURCE) || findLanguage(value, null);
      if (lang?.name) return renderReferenceTag("language", `${lang.name}|${lang.source}|${lang.name}`);
    }
    return `<span>${escapeHtml(value)}</span>`;
  }).join(", ");
}

function parseProficiencyDisplay(classObj, backgroundObj, speciesObj, featObjs = null, includeManual = true) {
  const armor = [], weapons = [], tools = [], languages = [];
  const featList = Array.isArray(featObjs) ? featObjs : (featObjs ? [featObjs] : []);
  for (const obj of [classObj?.startingProficiencies, classObj?.armorProficiencies]) {
    for (const value of obj?.armor || obj?.armorProficiencies || []) {
      for (const x of (typeof value === "string" ? [value] : Object.keys(value || {}))) armor.push(friendlyProficiencyKey(x));
    }
  }
  for (const obj of [classObj?.startingProficiencies, classObj?.weaponProficiencies]) {
    for (const value of obj?.weapons || obj?.weaponProficiencies || []) {
      for (const x of (typeof value === "string" ? [value] : Object.keys(value || {}))) weapons.push(friendlyProficiencyKey(x));
    }
  }
  for (const obj of [classObj?.startingProficiencies, backgroundObj, speciesObj, ...featList]) {
    for (const map of obj?.toolProficiencies || []) tools.push(...Object.entries(map || {}).map(([k,v]) => `${friendlyProficiencyKey(k)}${Number(v) > 1 ? ` ×${v}` : ""}`));
    for (const map of obj?.languageProficiencies || []) languages.push(...languageChoicesFromMap(map));
  }
  const inferred = inferSpeciesProficiencyEntries(speciesObj);
  weapons.push(...inferred.weapons); tools.push(...inferred.tools); languages.push(...inferred.languages);
  const toolSlots = cSafeToolSlots(includeManual);
  const languageSlots = cSafeLanguageSlots(includeManual);
  return {
    armor: dedupeLabels(includeManual ? [...armor, ...(state.character.manualArmorProficiencies || [])] : armor),
    weapons: dedupeLabels(includeManual ? [...weapons, ...(state.character.manualWeaponProficiencies || [])] : weapons),
    tools: dedupeLabels(cleanChoicePlaceholders(includeManual ? [...tools, ...Object.values(toolSlots), ...(state.character.toolChoices || []), ...(state.character.manualToolProficiencies || [])] : tools, toolSlots)),
    languages: dedupeLabels(cleanChoicePlaceholders(includeManual ? ["Common", ...(state.character.standardLanguages || []).filter(Boolean), ...languages, ...Object.values(languageSlots), ...(state.character.languageChoices || []), ...(state.character.manualLanguages || [])] : languages, languageSlots)),
  };
}

function cSafeToolSlots(includeManual=true){ return includeManual ? (state.character.toolChoiceSlots || {}) : {}; }
function cSafeLanguageSlots(includeManual=true){ return includeManual ? (state.character.languageChoiceSlots || {}) : {}; }

function normalizedProficiencyLabel(value) {
  return textNorm(stripTags(String(value || "")).replace(/\s+×\d+$/i, ""));
}
function proficiencyOverlaps(classObj, backgroundObj, c) {
  const bgSkills = new Set(grantedSkillsFromMap(backgroundObj?.skillProficiencies));
  const classSkills = new Set(normalizeSkillArray(c?.classSkillChoices || []));
  for (const value of classObj?.startingProficiencies?.skills || []) {
    if (typeof value === "string") classSkills.add(normalizeSkillKey(value));
    else if (value && typeof value === "object" && !value.choose) for (const key of Object.keys(value)) classSkills.add(normalizeSkillKey(key));
  }
  const classP = classObj ? parseProficiencyDisplay(classObj, null, null, null, false) : {tools: [], languages: []};
  const bgP = backgroundObj ? parseProficiencyDisplay(null, backgroundObj, null, null, false) : {tools: [], languages: []};
  const overlapValues = (a, b) => {
    const bSet = new Set((b || []).map(normalizedProficiencyLabel).filter(Boolean));
    return dedupeLabels((a || []).filter(v => bSet.has(normalizedProficiencyLabel(v))));
  };
  return {
    skills: [...classSkills].filter(Boolean).filter(skill => bgSkills.has(skill)),
    tools: overlapValues(classP.tools, bgP.tools),
    languages: overlapValues(classP.languages, bgP.languages),
  };
}

function hasWeaponProficiency(item, profs) {
  const name = String(item?.name || "").toLowerCase();
  const clean = (profs || []).map(p => stripTags(String(p || "")).trim().toLowerCase());
  const normalizedName = textNorm(name);
  const compact = p => p.replace(/[^a-z0-9]/g, "");
  const compactSet = new Set(clean.map(compact));
  if (clean.some(p => p === name || textNorm(p) === normalizedName || p.includes(normalizedName))) return true;
  const category = String(item?.weaponCategory || "").toLowerCase();
  const props = new Set((item?.property || []).map(String).map(x => x.split("|")[0].toUpperCase()));
  if (category === "simple" && (compactSet.has("simple") || compactSet.has("simpleweapons"))) return true;
  if (category === "martial") {
    if (compactSet.has("martial") || compactSet.has("martialweapons")) return true;
    if (clean.some(p => /martial weapons.*light property/i.test(p)) && props.has("L")) return true;
  }
  return false;
}

function weaponAbility(item, mods) {
  const props = new Set((item?.property || []).map(String).map(x => x.split("|")[0]));
  if (props.has("F")) return mods.dex >= mods.str ? "dex" : "str";
  const category = String(item?.weaponCategory || "").toLowerCase();
  return category === "ranged" || props.has("R") ? "dex" : "str";
}

function weaponFlags(item) {
  const props = new Set((item?.property || []).map(x => String(x).split("|")[0]));
  const category = String(item?.weaponCategory || "").toLowerCase();
  return {
    ranged: category === "ranged" || props.has("R"),
    thrown: props.has("T"),
    finesse: props.has("F"),
    light: props.has("L"),
    twoHanded: props.has("2H"),
    melee: category !== "ranged" && !props.has("R"),
  };
}

async function getAttackRows(d) {
  let itemsData = null;
  try { itemsData = await getItemsData(); } catch {}
  const officialItems = itemsData ? officialEntries(itemsData, "item") : [];
  const rows = [];
  for (const owned of state.character.inventory || []) {
    if (!owned?.equipped || owned.wielding === false || !owned.name) continue;
    const item = officialItems.find(x => x.name === owned.name && (!owned.source || x.source === owned.source)) || officialItems.find(x => x.name === owned.name);
    if (!item || !item.weaponCategory) continue;
    const ability = weaponAbility(item, d.mods);
    const proficient = hasWeaponProficiency(item, d.proficiencies.weapons);
    const flags = weaponFlags(item);
    const itemBonus = Number.parseInt(String(item.attackBonus ?? item.bonusWeapon ?? 0), 10) || 0;
    let bonus = d.mods[ability] + (proficient ? d.pb : 0) + itemBonus + Number(d.d20Penalty || 0);
    if (flags.ranged) bonus += Number(d.effects?.attackBonuses?.ranged || 0);
    const abilityDamage = d.mods[ability];
    let extraDamage = 0;
    if (d.effects?.damageBonuses?.dueling && flags.melee && !flags.twoHanded) {
      const wieldedWeapons = (state.character.inventory || []).filter(x => x?.equipped && x.wielding !== false && x?.name).map(x => officialItems.find(it => it.name === x.name && (!x.source || it.source === x.source)) || officialItems.find(it => it.name === x.name)).filter(it => it?.weaponCategory);
      const otherWeaponCount = wieldedWeapons.filter(other => other !== item).length;
      if (otherWeaponCount === 0) extraDamage += Number(d.effects.damageBonuses.dueling || 0);
    }
    if (d.effects?.damageBonuses?.thrown && flags.thrown) extraDamage += Number(d.effects.damageBonuses.thrown || 0);
    const damageFormula = item.dmg1 ? `${item.dmg1}${abilityDamage || extraDamage ? ` ${formatMod(abilityDamage + extraDamage)}` : ""}` : "—";
    rows.push({ nameHtml: renderReferenceTag("item", `${item.name}|${item.source}|${item.name}`), name: item.name, attackBonus: `${formatMod(bonus)}${proficient ? "" : "*"}`, damage: damageFormula, notePayload: weaponNotePayload(item) });
  }
  for (const custom of state.character.attacks || []) rows.push({ name: custom.name || "Attack", attackBonus: custom.attackBonus || "—", damage: custom.damage || "—", notePayload: custom.range || custom.notes ? customNotePayload([custom.range, custom.notes].filter(Boolean).join(" · "), `${custom.name || "Attack"} · Notes`) : null });
  for (const spell of (state.character.cantrips || []).map(spellById).filter(Boolean)) rows.push({ nameHtml: renderReferenceTag("spell", `${spell.name}|${spell.source}|${spell.name}`), name: spell.name, attackBonus: d.spellcastingAbility ? formatMod(d.pb + d.mods[d.spellcastingAbility] + Number(d.d20Penalty || 0)) : "—", damage: (spell.damageInflict || []).map(damageTypeName).join(", ") || "Cantrip", notePayload: spellNotePayload(spell) });
  return rows.slice(0, 12);
}

function damageTypeName(value) {
  const map = { B: "Bludgeoning", P: "Piercing", S: "Slashing", A: "Acid", C: "Cold", F: "Fire", O: "Force", L: "Lightning", N: "Necrotic", I: "Poison", Y: "Psychic", R: "Radiant", T: "Thunder" };
  return map[String(value || "").split("|")[0]] || canonicalLabel(value);
}

function hasArmorTraining(proficiencies, itemType) {
  const labels = Array.isArray(proficiencies?.armor) ? proficiencies.armor : [];
  const wanted = itemType === "S" ? "shield" : itemType === "LA" ? "lightarmor" : itemType === "MA" ? "mediumarmor" : itemType === "HA" ? "heavyarmor" : "";
  if (!wanted) return false;
  return labels.some(label => {
    const n = textNorm(stripTags(label));
    if (n === wanted) return true;
    if (itemType === "S") return n === "shields";
    if (itemType === "LA") return n === "light";
    if (itemType === "MA") return n === "medium";
    if (itemType === "HA") return n === "heavy";
    return false;
  });
}

function calcAutoAc(c, mods, itemsData = null, effects = null, proficiencies = null, abilityScores = null) {
  const inventory = Array.isArray(c.inventory) ? c.inventory : [];
  const equipped = inventory.filter(x => x && x.equipped && x.name);
  const items = itemsData ? officialEntries(itemsData, "item") : [];
  const resolved = equipped.map((owned, index) => {
    const found = items.find(it => it.name === owned.name && String(it.source || "").toLowerCase() === String(owned.source || "").toLowerCase()) || items.find(it => it.name === owned.name);
    return found ? { owned, item: found, index } : null;
  }).filter(Boolean);
  const itemType = item => String(item?.type || "").split("|")[0];
  const armor = resolved.filter(({ item }) => ["LA", "MA", "HA"].includes(itemType(item)));
  const shields = resolved.filter(({ item }) => itemType(item) === "S");
  const trainedArmor = armor.filter(({ item }) => hasArmorTraining(proficiencies, itemType(item)));
  const trainedShields = shields.filter(({ item }) => hasArmorTraining(proficiencies, "S"));
  const formula = effects?.acFormulas?.[0] || getUnarmoredDefenseFormula(c.class, c.level);

  let best = 10 + mods.dex;
  let reason = `10 + DEX (${formatMod(mods.dex)}) = ${best}`;
  let sourceMode = "base";
  let breakdown = [`10`, `DEX ${formatMod(mods.dex)}`];

  if (!armor.length && formula) {
    const values = formula.abilities.map(key => Number(mods[key] || 0));
    const candidate = Number(formula.base || 10) + values.reduce((sum, value) => sum + value, 0);
    // An Unarmored Defense formula is only invalid when a shield is prohibited.
    if (!shields.length || formula.allowShield) {
      best = candidate;
      sourceMode = "unarmored";
      breakdown = [String(formula.base || 10), ...formula.abilities.map(key => `${ABILITY_LABELS[key]} ${formatMod(mods[key] || 0)}`)];
      reason = `${formula.label || "Unarmored Defense"} = ${best}`;
    }
  }

  if (trainedArmor.length) {
    for (const { item } of trainedArmor) {
      const base = Number(item.ac);
      if (!Number.isFinite(base)) continue;
      const bonus = Number.parseInt(String(item.bonusAc || "0"), 10) || 0;
      let dex = 0;
      const type = itemType(item);
      if (type === "LA") dex = mods.dex;
      else if (type === "MA") {
        const cap = Number(item.dexterityMax ?? item.dexMax ?? 2);
        dex = Math.min(mods.dex, Number.isFinite(cap) ? cap : 2);
      }
      const candidate = base + bonus + dex;
      if (candidate >= best) {
        best = candidate;
        sourceMode = "armor";
        breakdown = [String(base), bonus ? `armor ${formatMod(bonus)}` : null, dex ? `DEX ${formatMod(dex)}` : null].filter(Boolean);
        reason = `${item.name} = ${best}`;
      }
    }
  }

  if (trainedShields.length) {
    const canUseShield = sourceMode !== "unarmored" || Boolean(formula?.allowShield);
    if (canUseShield) {
      const shieldAc = Math.max(0, ...trainedShields.map(({ item }) => Number(item.ac || 0) + (Number.parseInt(String(item.bonusAc || "0"), 10) || 0)));
      if (shieldAc) { best += shieldAc; breakdown.push(`shield +${shieldAc}`); reason += ` + shield`; }
    }
  }
  let conditionalAcBonus = 0;
  if (effects?.flags?.has?.("dualWielder")) {
    const meleeWeapons = resolved.filter(({ owned, item }) => {
      if (owned?.wielding === false || !item.weaponCategory) return false;
      const category = String(item.weaponCategory).toLowerCase();
      const props = new Set((item.property || []).map(x => String(x).split("|")[0]));
      return category !== "ranged" && !props.has("R") && !props.has("2H");
    });
    if (meleeWeapons.length >= 2) conditionalAcBonus += 1;
  }
  let armorSpeedPenalty = 0;
  for (const { item } of armor) {
    const req = Number(item.str ?? item.strRequirement ?? item.strengthRequirement ?? 0);
    const score = Number(abilityScores?.str ?? c.baseStats?.str ?? 10);
    if (req > 0 && score < req) armorSpeedPenalty = Math.max(armorSpeedPenalty, 10);
  }
  const acBonus = sourceMode === "armor"
    ? Number(effects?.acBonus || 0) + Number(effects?.acBonusWhileArmored || 0)
    : sourceMode === "unarmored"
      ? Number(effects?.acBonus || 0) + Number(effects?.acBonusWhileUnarmored || 0)
      : Number(effects?.acBonus || 0);
  const totalAcBonus = acBonus + conditionalAcBonus;
  if (totalAcBonus) { best += totalAcBonus; breakdown.push(`other ${formatMod(totalAcBonus)}`); reason += ` + ${formatMod(totalAcBonus)}`; }
  const formulaText = sourceMode === "unarmored" ? breakdown.join(" ") + ` = ${best}` : reason;
  return { value: best, reason: formulaText, mode: sourceMode, breakdown, speedPenalty: armorSpeedPenalty, wearingHeavyArmor: armor.some(({ item }) => itemType(item) === "HA") };
}

function textNorm(value) { return String(value || "").replace(/[^a-z0-9]/gi, "").toLowerCase(); }
function classTableNumericValue(classObj, labelNeedle, level) {
  const target = String(labelNeedle || "").toLowerCase();
  for (const group of classObj?.classTableGroups || []) {
    const labels = group.colLabels || [];
    const idx = labels.findIndex(label => stripTags(String(label)).toLowerCase().includes(target));
    if (idx < 0) continue;
    const row = group.rows?.[Math.max(0, level - 1)];
    const cell = Array.isArray(row) ? row[idx] : null;
    if (Number.isFinite(Number(cell))) return Number(cell);
    if (cell && typeof cell === "object") {
      for (const key of ["value", "amount"]) if (Number.isFinite(Number(cell[key]))) return Number(cell[key]);
      if (Number.isFinite(Number(cell.bonusSpeed?.value))) return Number(cell.bonusSpeed.value);
    }
  }
  return 0;
}
function hasNamedFeature(features, name) {
  const target = textNorm(name);
  return (features || []).some(f => textNorm(f?.name) === target);
}

function getUnarmoredDefenseFormula(classObj, level) {
  const cls = textNorm(classObj?.name);
  if (Number(level || 0) < 1) return null;
  if (cls === "barbarian") return { base: 10, abilities: ["dex", "con"], allowShield: true, label: "Unarmored Defense (10 + DEX + CON)" };
  if (cls === "monk") return { base: 10, abilities: ["dex", "wis"], allowShield: false, label: "Unarmored Defense (10 + DEX + WIS)" };
  return null;
}

function applyTextualRulesEffects(text, effects, sourceName = "Feature") {
  const raw = stripTags(String(text || ""));
  if (!raw) return;
  for (const match of raw.matchAll(/\bAdvantage\s+on\s+([^.!?;:]+?)\s+saving throws\b/gi)) {
    const phrase = String(match[1] || "");
    const abilities = ABILITIES.filter(key => new RegExp(`\\b${ABILITY_NAMES[key]}\\b`, "i").test(phrase));
    for (const ability of abilities) effects.savingThrowAdvantages.add(ability);
    if (abilities.length) effects.active.push(`${sourceName}: Advantage on ${abilities.map(a => ABILITY_NAMES[a]).join(", ")} saving throws`);
  }
}
function applySelectedSpeciesOptionEffects(c, speciesObj, effects) {
  for (const spec of speciesChoiceSpecs(speciesObj)) {
    const selected = c.speciesChoices?.[spec.key]; if (!selected) continue;
    const option = spec.options.find(o => textNorm(o.name) === textNorm(selected.value || selected));
    if (!option) continue;
    effects.active.push(`${speciesObj.name}: ${option.name}`);
    applyTextualRulesEffects(option.entries, effects, `${speciesObj.name} · ${option.name}`);
  }
}

function buildDerivedEffects(c, d, featObjs) {
  const effects = {
    acFormulas: [], acBonus: 0, acBonusWhileArmored: 0, acBonusWhileUnarmored: 0, hpPerLevel: 0, hpFlat: 0, speedBonus: 0, initiativeBonus: 0, d20Penalty: effectiveD20Penalty(c),
    passivePerceptionBonus: 0, passiveInvestigationBonus: 0, resistances: [], senses: [], active: [], flags: new Set(),
    savingThrows: new Set(), savingThrowAdvantages: new Set(), skills: new Set(), expertise: new Set(), tools: [], languages: [], attackBonuses: {}, damageBonuses: {}
  };
  const allFeatures = [...(d.classFeatures || []), ...(d.subclassFeatures || [])];
  const speciesFeatures = (d.speciesObj?.entries || []).filter(x => x && x.name);
  const uad = getUnarmoredDefenseFormula(d.classObj, c.level);
  if (uad) effects.acFormulas.push(uad);

  // Class/subclass features. Identity-based effects are deliberately conservative:
  // we only automate effects that can be represented reliably on a sheet.
  for (const feature of allFeatures) {
    const n = textNorm(feature.name);
    applyTextualRulesEffects(feature.entries, effects, feature.name);
    if (n === "unarmoreddefense" && uad) effects.active.push(`${uad.label}`);
    if (n === "unarmoredmovement") {
      const bonus = classTableNumericValue(d.classObj, "unarmored movement", c.level);
      if (bonus) { effects.speedBonus += bonus; effects.active.push(`Unarmored Movement: +${bonus} ft.`); }
    }
    if (n === "fastmovement") { effects.flags.add("fastMovement"); effects.active.push("Fast Movement: +10 ft. while not wearing heavy armor"); }
  }
  if (d.classObj && ["barbarian", "monk"].includes(textNorm(d.classObj.name)) && !hasNamedFeature(allFeatures, "Unarmored Defense")) {
    effects.active.push(`${uad.label} (class rule)`);
  }

  // Optional class features such as Fighting Styles and Eldritch Invocations.
  for (const feature of d.optionalFeatureObjects || []) {
    const n = textNorm(feature.name);
    applyTextualRulesEffects(feature.entries, effects, feature.name);
    effects.active.push(`${feature.name}`);
    if (n === "defense") { effects.acBonusWhileArmored += 1; effects.active[effects.active.length - 1] += ": +1 AC while wearing armor"; }
    if (n === "archery") { effects.attackBonuses.ranged = (effects.attackBonuses.ranged || 0) + 2; effects.active[effects.active.length - 1] += ": +2 ranged attack rolls"; }
    if (n === "dueling") { effects.damageBonuses.dueling = 2; effects.active[effects.active.length - 1] += ": +2 damage with qualifying one-handed attacks"; }
    if (n === "thrownweaponfighting") { effects.damageBonuses.thrown = 2; effects.active[effects.active.length - 1] += ": +2 damage with thrown weapons"; }
    if (n === "blindfighting") { effects.senses.push("Blindsight 10 ft."); effects.active[effects.active.length - 1] += ": Blindsight 10 ft."; }
    if (["greatweaponfighting","twoweaponfighting","protection","interception"].includes(n)) effects.flags.add(n);
  }

  // Species traits.
  for (const trait of speciesFeatures) {
    const n = textNorm(trait.name);
    applyTextualRulesEffects(trait.entries, effects, trait.name);
    if (n === "dwarventoughness") {
      effects.hpPerLevel += 1;
      effects.active.push("Dwarven Toughness: +1 Hit Point per character level");
    }
    if (n === "dwarvenresilience") {
      effects.resistances.push("Poison");
      effects.active.push("Dwarven Resilience: Resistance to Poison damage; Advantage on saves vs Poisoned");
    }
  }
  applySelectedSpeciesOptionEffects(c, d.speciesObj, effects);

  for (const feat of featObjs || []) {
    const n = textNorm(feat.name);
    applyTextualRulesEffects(feat.entries, effects, feat.name);
    if (n === "tough") { effects.hpPerLevel += 2; effects.active.push("Tough: +2 Hit Points per character level"); }
    if (n === "dualwielder") { effects.flags.add("dualWielder"); effects.active.push("Dual Wielder: +1 AC while wielding a qualifying weapon in each hand"); }
    if (n === "alert" && String(feat.source || "").toLowerCase() === DATA_SOURCE.toLowerCase()) { effects.initiativeBonus += d.pb; effects.active.push("Alert: add Proficiency Bonus to Initiative"); }
    if (n === "observant" && String(feat.source || "").toLowerCase() !== DATA_SOURCE.toLowerCase()) {
      effects.passivePerceptionBonus += 5;
      effects.passiveInvestigationBonus += 5;
      effects.active.push("Observant (2014): +5 passive Perception and Investigation");
    }
    for (const spec of featSaveSpecs(feat)) {
      const selected = c.featSaveChoices?.[featSpecKey(feat, spec)];
      if (selected) effects.savingThrows.add(selected);
    }
    for (const spec of featSkillSpecs(feat)) {
      const selected = c.featSkillChoices?.[featSpecKey(feat, spec)];
      if (selected) {
        if (d.skillProficiencies?.has?.(selected)) effects.expertise.add(selected);
        else effects.skills.add(selected);
      }
    }
    for (const spec of featMixedChoiceSpecs(feat)) {
      const selected = c.featMixedChoices?.[spec.key]; if (!selected) continue;
      const [kind, value] = String(selected).split(":");
      if (kind === "Skill" && SKILLS[value]) effects.skills.add(value);
      else if (kind === "Tool") effects.tools.push(value);
      else if (kind === "Language") effects.languages.push(value);
    }
    for (const spec of featExpertiseSpecs(feat)) { const selected=c.featExpertiseChoices?.[spec.key]; if (selected) effects.expertise.add(selected); }
    for (const map of feat.skillProficiencies || []) for (const key of grantedSkillsFromMap([map])) effects.skills.add(key);
    for (const r of feat.resist || []) effects.resistances.push(canonicalLabel(stripTags(String(r))));
  }
  return effects;
}

function resourceRechargeLabel(value) {
  if (Array.isArray(value)) {
    const parts = value.map(resourceRechargeLabel).filter(Boolean);
    if (parts.includes("short") && parts.includes("long")) return "both";
    return parts[0] || "";
  }
  const raw = String(value ?? "").toLowerCase().replace(/[_-]/g, " ");
  const hasShort = raw.includes("short") || /\bsr\b/.test(raw) || raw.includes("restshort");
  const hasLong = raw.includes("long") || /\blr\b/.test(raw) || raw.includes("restlong") || raw.includes("daily") || raw.includes("day");
  if (hasShort && hasLong) return "both";
  if (hasShort) return "short";
  if (hasLong) return "long";
  return "";
}
function resourceMaxValue(number, d) {
  if (typeof number === "number" && Number.isFinite(number)) return Math.max(0, Math.floor(number));
  const raw = String(number ?? "").trim().toLowerCase();
  if (raw === "pb" || raw === "proficiency bonus") return Number(d.pb || 0);
  if (/^\d+$/.test(raw)) return Number(raw);
  return 0;
}

function numberWordValue(value) {
  const key = String(value || "").toLowerCase().trim();
  return ({once:1, twice:2, "three times":3, "four times":4, "five times":5, "six times":6})[key] || 0;
}

function inferFeatureUseMaxFromText(feature, d) {
  const text = entriesToText(feature?.entries || "");
  if (!text || !featureRechargeFromText(feature)) return 0;
  let count = /\b(?:once you use|when you use|after you use|can't use (?:this feature|it) again|cannot use (?:this feature|it) again)\b/i.test(text) ? 1 : 0;
  if (/a number of times equal to (?:your )?proficiency bonus/i.test(text)) count = Math.max(count, Number(d?.pb || 0));
  const modMatch = text.match(/a number of times equal to (?:your )?(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) modifier/i);
  if (modMatch) {
    const key = modMatch[1].slice(0,3).toLowerCase();
    count = Math.max(count, Number(d?.mods?.[key] || 0));
  }
  const gated = /(?:starting at|when you reach|at)\s+(?:level\s+)?(\d+)[^.!?]{0,120}?(?:can|may) use (?:this feature|it)\s+(once|twice|three times|four times|five times|six times)/gi;
  for (const m of text.matchAll(gated)) {
    if (Number(d?.level || 1) >= Number(m[1])) count = Math.max(count, numberWordValue(m[2]));
  }
  const gatedReverse = /(?:can|may) use (?:this feature|it)\s+(once|twice|three times|four times|five times|six times)[^.!?]{0,120}?(?:starting at|when you reach|at)\s+(?:level\s+)?(\d+)/gi;
  for (const m of text.matchAll(gatedReverse)) {
    if (Number(d?.level || 1) >= Number(m[2])) count = Math.max(count, numberWordValue(m[1]));
  }
  const countBeforeGate = /\b(once|twice|three times|four times|five times|six times)[^.!?]{0,80}?(?:starting at|when you reach|at)\s+(?:level\s+)?(\d+)/gi;
  for (const m of text.matchAll(countBeforeGate)) {
    if (Number(d?.level || 1) >= Number(m[2])) count = Math.max(count, numberWordValue(m[1]));
  }
  if (!count) {
    const direct = text.match(/\b(?:can|may) use (?:this feature|it)\s+(once|twice|three times|four times|five times|six times)\b/i);
    if (direct && !/starting at\s+(?:level\s+)?\d+|when you reach\s+(?:level\s+)?\d+|at\s+(?:level\s+)?\d+/i.test(direct[0])) count = numberWordValue(direct[1]);
  }
  return count;
}

function featureRechargeDetails(feature) {
  const text = entriesToText(feature?.entries || "");
  const sentences = text.split(/(?<=[.!?])\s+/);
  let short = false, long = false;
  let shortRestore = "all", longRestore = "all";
  for (const sentence of sentences) {
    const hasRestRecovery = /(regain|regains|recover|recovers|restore|restores|restored|replenish|replenishes|replenished)/i.test(sentence);
    const hasUseReset = /(?:use|uses) (?:this feature|it) again|use (?:this feature|it)\s+until|finish (?:a|an) (?:short|long) rest before (?:you )?(?:can )?use/i.test(sentence);
    const hasPerRest = /(?:once|twice|three times|four times|five times|six times|\d+ times)\s+per\s+(short|long) rest/i.test(sentence);
    if (!hasRestRecovery && !hasUseReset && !hasPerRest) continue;
    if (/short rest/i.test(sentence)) {
      short = true;
      if (/regain (?:one|1) (?:expended )?uses?/i.test(sentence) || /regain (?:one|1) of (?:your|its) expended uses?/i.test(sentence)) shortRestore = "one";
    }
    if (/long rest/i.test(sentence)) long = true;
  }
  // “Short or Long Rest before you can use it again” means the resource is
  // completely refreshed by either rest, unlike features that explicitly
  // regain one expended use on a Short Rest.
  if (/short or long rest/i.test(text) && /(?:use|uses) (?:this feature|it) again/i.test(text)) {
    short = long = true;
    shortRestore = longRestore = "all";
  }
  return { recharge: short && long ? "both" : short ? "short" : long ? "long" : "", shortRestore, longRestore };
}

function featureRechargeFromText(feature) { return featureRechargeDetails(feature).recharge; }

function featureResourceSpecs(features, d, prefix) {
  const out = [];
  for (const f of features || []) {
    const uses = f?.uses;
    const max = uses && typeof uses === "object"
      ? resourceMaxValue(uses.number ?? uses.max ?? uses.amount, d)
      : inferFeatureUseMaxFromText(f, d);
    if (!max) continue;
    const details = uses && typeof uses === "object" && resourceRechargeLabel(uses.recharge || uses.recovery || uses.rest)
      ? { recharge: resourceRechargeLabel(uses.recharge || uses.recovery || uses.rest), shortRestore: "all", longRestore: "all" }
      : featureRechargeDetails(f);
    if (!details.recharge) continue;
    const id = `${prefix}:${f.source || DATA_SOURCE}:${f.name}`.toLowerCase();
    out.push({ id, name: f.name, max, recharge: details.recharge, shortRestore: details.shortRestore, longRestore: details.longRestore, mode: "auto", origin: { type: prefix, name: f.name, source: f.source || DATA_SOURCE } });
  }
  return out;
}
function classTableResourceSpecs(classObj, features, d) {
  const out = [];
  const featureMap = new Map((features || []).map(f => [textNorm(f?.name), f]));
  const ignored = new Set(["cantrips", "preparedspells", "spellslots", "slotlevel", "weaponmastery", "ragedamage"]);
  for (const group of classObj?.classTableGroups || []) {
    const labels = Array.isArray(group.colLabels) ? group.colLabels : [];
    const row = Array.isArray(group.rows) ? group.rows[Math.max(0, Number(d.level || 1) - 1)] : null;
    if (!Array.isArray(row)) continue;
    labels.forEach((label, idx) => {
      const normalized = textNorm(stripTags(label));
      if (!normalized || ignored.has(normalized)) return;
      const feature = featureMap.get(normalized) || featureMap.get(normalized.replace(/s$/, "")) ||
        (normalized === "rages" ? featureMap.get("rage") : null);
      if (!feature) return;
      const max = resourceMaxValue(row[idx], d);
      if (!max) return;
      const details = featureRechargeDetails(feature);
      if (!details.recharge) return;
      const id = `classfeature:${feature.source || DATA_SOURCE}:${feature.name}`.toLowerCase();
      out.push({ id, name: feature.name, max, recharge: details.recharge, shortRestore: details.shortRestore, longRestore: details.longRestore, mode: "auto", origin: { type: "classfeature", name: feature.name, source: feature.source || DATA_SOURCE } });
    });
  }
  return out;
}
function reconcileResources(c, specs) {
  const existing = Array.isArray(c.resources) ? c.resources : [];
  const byId = new Map(existing.filter(r => r?.mode === "auto" && r.id).map(r => [r.id, r]));
  const manual = existing.filter(r => r?.mode !== "auto");
  const unique = new Map();
  for (const spec of specs || []) unique.set(spec.id, spec);
  const auto = [...unique.values()].map(spec => {
    const prior = byId.get(spec.id);
    return { ...spec, mode: "auto", current: prior ? clamp(Number(prior.current ?? spec.max), 0, spec.max) : spec.max };
  });
  c.resources = [...manual, ...auto];
}
async function deriveCharacter() {
  const c = state.character;
  const backgroundObj = findBackground(c.background?.name, c.background?.source || null);
  const speciesObj = findSpecies(c.species?.name, c.species?.source || null);
  if (backgroundObj) reconcileBackgroundAbilityChoices(c, backgroundObj);
  else c.backgroundAbility = { mode: "split", plus2: null, plus1: null, plus1b: null, plus1c: null };
  const featObjs = selectedFeatObjects(c);
  reconcileFeatChoices(c, featObjs);
  reconcileSpeciesChoices(c, speciesObj);
  const finalStats = calculateFinalStats(c, backgroundObj, featObjs);
  const mods = Object.fromEntries(ABILITIES.map(a => [a, abilityMod(finalStats[a])]));
  const d = {
    level: Number(c.level || 1), mods, stats: finalStats, baseStats: c.baseStats || c.stats || finalStats, pb: proficiencyBonus(c.level),
    classFile: null, classObj: null, subclassObj: null, subclassOptions: [],
    senseRefs: [],
    speciesObj, backgroundObj,
    featObj: featObjs[0] || null, featObjs, classFeatures: [], subclassFeatures: [],
    skillProficiencies: new Set(), skillChoiceSpec: { from: [], count: 0 }, savingThrowProficiencies: new Set(), savingThrowAdvantages: new Set(),
    unarmoredDefense: null, acBreakdown: [],
    effects: null, maxHp: 1, currentHp: Number(c.hpCurrent ?? 0), progressionFeatSlots: [], ac: Number(c.acOverride ?? (10 + mods.dex)), acAutomatic: c.acOverride == null,
    acReason: "10 + Dexterity modifier", d20Penalty: effectiveD20Penalty(c), speed: Number(c.speedOverride ?? dfltSpeed(findSpecies(c.species?.name, c.species?.source || null))),
    size: sizeLabel(findSpecies(c.species?.name, c.species?.source || null)?.size), spellcastingAbility: null, spellSlots: [],
    maxPrepared: null, knownSpells: null, cantrips: null, inventoryWeight: 0, passivePerception: 10 + mods.wis,
    passiveInvestigation: 10 + mods.int, proficiencies: { armor: [], weapons: [], tools: [], languages: [] },
    resistances: [], senses: [], sourceSummary: state.data.sourceMeta || []
  };
  if (c.class?.name) {
    d.classFile = await getClassDetails(c.class.name);
    d.classObj = getClassFromFile(d.classFile, c.class.name, c.class.source || null);
    d.subclassOptions = getSubclassOptions(d.classFile, c.class.name);
    const subclassUnlock = getSubclassUnlockLevel(d.classObj);
    if (Number(c.level || 1) < subclassUnlock) c.subclass = null;
    d.subclassObj = d.subclassOptions.find(s => s.name.toLowerCase() === String(c.subclass?.name || "").toLowerCase() && (!c.subclass?.source || s.source === c.subclass.source)) || null;
    d.classFeatures = getClassFeatures(d.classFile, d.classObj, c.level);
    d.subclassFeatures = getSubclassFeatures(d.classFile, d.subclassObj, c.level);
    d.optionalFeatureSpecs = optionalFeatureProgression(d.classObj, c.level);
    d.progressionFeatSlots = progressionFeatSlots(d.classObj, c.level);
    d.optionalFeatureObjects = selectedOptionalFeatureObjects(c, d.classObj, c.level);
    d.autoResourceSpecs = [
      ...featureResourceSpecs(d.classFeatures, d, "classfeature"),
      ...classTableResourceSpecs(d.classObj, d.classFeatures, d),
      ...featureResourceSpecs(d.subclassFeatures, d, "subclassfeature"),
      ...featureResourceSpecs(d.featObjs, d, "feat"),
      ...featureResourceSpecs(d.optionalFeatureObjects, d, "optionalfeature")
    ];
    reconcileResources(c, d.autoResourceSpecs);
    d.weaponMasteryCount = weaponMasteryCount(d.classObj, c.level);
    if (d.weaponMasteryCount <= 0) c.weaponMasteries = [];
    else {
      try {
        const masteryItems = officialEntries(await getItemsData(), "item").filter(it => String(it.source || "") === DATA_SOURCE && it.weaponCategory && masteryLabel(it) && (it.rarity == null || String(it.rarity).toLowerCase() === "none") && hasWeaponProficiency(it, parseProficiencyDisplay(d.classObj, backgroundObj, d.speciesObj, featObjs).weapons));
        const validKeys = new Set(masteryItems.map(it => normalizeRefId(it.name, it.source).toLowerCase()));
        c.weaponMasteries = (c.weaponMasteries || []).filter(x => validKeys.has(String(x).toLowerCase())).slice(0, d.weaponMasteryCount);
      } catch {}
    }
    d.skillChoiceSpec = skillChoiceSpec(d.classObj);
    d.spellcastingAbility = d.classObj?.spellcastingAbility || null;
    d.spellSlots = classSpellSlots(d.classObj, c.level);
    d.cantrips = classCantrips(d.classObj, c.level);
    d.maxPrepared = classPrepared(d.classObj, c.level, mods);
    d.knownSpells = classKnownSpells(d.classObj, c.level);
    if (Number.isFinite(Number(d.cantrips)) && c.cantrips.length > d.cantrips) c.cantrips = c.cantrips.slice(0, d.cantrips);
    if (Number.isFinite(Number(d.maxPrepared)) && c.preparedSpells.length > d.maxPrepared) c.preparedSpells = c.preparedSpells.slice(0, d.maxPrepared);
    if (Number.isFinite(Number(d.knownSpells)) && c.knownSpells.length > d.knownSpells) c.knownSpells = c.knownSpells.slice(0, d.knownSpells);
    for (const save of d.classObj?.proficiency || []) { const key = normalizeAbilityKey(save); if (key) d.savingThrowProficiencies.add(key); }
  } else {
    reconcileResources(c, []);
  }
  // Build base proficiencies before feature effects so choice-based effects (e.g. 2024 Observant)
  // can distinguish a new proficiency from expertise on an already-proficient skill.
  const bgSkillsPre = grantedSkillsFromMap(d.backgroundObj?.skillProficiencies);
  for (const s of bgSkillsPre) d.skillProficiencies.add(s);
  for (const s of normalizeSkillArray(c.classSkillChoices)) d.skillProficiencies.add(s);
  for (const s of normalizeSkillArray(c.customSkillProficiencies)) d.skillProficiencies.add(s);
  for (const s of d.speciesObj?.skillProficiencies ? grantedSkillsFromMap(d.speciesObj.skillProficiencies) : []) d.skillProficiencies.add(s);
  d.effects = buildDerivedEffects(c, d, featObjs);
  for (const save of d.effects.savingThrows) d.savingThrowProficiencies.add(save);
  d.savingThrowAdvantages = new Set(d.effects.savingThrowAdvantages || []);
  d.activeEffects = [...(d.effects.active || [])];
  if (c.exhaustion) d.activeEffects.push(`Exhaustion ${c.exhaustion}: ${Math.abs(d.d20Penalty)} penalty to D20 Tests; -${5 * c.exhaustion} ft. Speed`);
  for (const value of d.effects.resistances || []) if (value && !d.resistances.includes(value)) d.resistances.push(value);
  const speciesResists = Array.isArray(d.speciesObj?.resist) ? d.speciesObj.resist : [];
  for (const value of speciesResists) { const label = canonicalLabel(stripTags(String(value))); if (label && !d.resistances.includes(label)) d.resistances.push(label); }
  if (d.speciesObj?.darkvision) d.senseRefs.push({ tag: "sense", name: "Darkvision", source: DATA_SOURCE, label: `Darkvision ${d.speciesObj.darkvision} ft.` });
  for (const [sense, value] of Object.entries(d.speciesObj?.senses || {})) if (value) {
    const canonical = senseName(sense) || canonicalLabel(sense);
    d.senseRefs.push({ tag: "sense", name: canonical, source: DATA_SOURCE, label: `${canonical} ${value} ft.` });
  }
  for (const ref of collectSenseRefs([d.speciesObj?.entries || [], d.classFeatures || [], d.subclassFeatures || [], d.optionalFeatureObjects || [], featObjs || []])) d.senseRefs.push(ref);
  for (const sense of d.effects.senses || []) {
    const parsed = String(sense).match(/^(Blindsight|Darkvision|Tremorsense|Truesight)(?:\s+(.*))?$/i);
    if (parsed) d.senseRefs.push({ tag: "sense", name: parsed[1], source: DATA_SOURCE, label: parsed[2] ? `${parsed[1]} ${parsed[2]}` : parsed[1] });
    else if (sense && !d.senses.includes(sense)) d.senses.push(sense);
  }
  for (const sense of c.senses || []) {
    const parsed = String(sense).match(/^(Blindsight|Darkvision|Tremorsense|Truesight)(?:\s+(.*))?$/i);
    if (parsed) d.senseRefs.push({ tag: "sense", name: parsed[1], source: DATA_SOURCE, label: parsed[2] ? `${parsed[1]} ${parsed[2]}` : parsed[1] });
    else if (sense && !d.senses.includes(sense)) d.senses.push(sense);
  }
  const senseByType = new Map();
  const senseRange = ref => {
    const m = String(ref.label || "").match(/(\d+)\s*ft\.?/i);
    return m ? Number(m[1]) : null;
  };
  for (const ref of d.senseRefs) {
    const key = textNorm(ref.name);
    if (!key) continue;
    const existing = senseByType.get(key);
    if (!existing) { senseByType.set(key, ref); continue; }
    const oldRange = senseRange(existing), newRange = senseRange(ref);
    if (newRange != null && (oldRange == null || newRange > oldRange)) senseByType.set(key, ref);
  }
  d.senseRefs = [...senseByType.values()];
  const specialSenseNames = new Set(SPECIAL_SENSES.map(textNorm));
  d.senses = d.senses.filter(value => !specialSenseNames.has(textNorm(String(value).replace(/\s+\d+\s*ft\.?$/i, ""))));
  d.proficiencies = parseProficiencyDisplay(d.classObj, d.backgroundObj, d.speciesObj, featObjs);
  try {
    const acResult = calcAutoAc(c, mods, await getItemsData(), d.effects, d.proficiencies, d.stats);
    d.heavyArmorWorn = Boolean(acResult.wearingHeavyArmor);
    d.armorSpeedPenalty = Number(acResult.speedPenalty || 0);
    d.unarmoredDefense = d.effects.acFormulas?.[0] || getUnarmoredDefenseFormula(d.classObj || c.class, c.level);
    if (c.acOverride == null) {
      d.ac = acResult.value;
      d.acReason = acResult.reason;
      d.acBreakdown = acResult.breakdown || [];
    } else {
      d.ac = Number(c.acOverride); d.acAutomatic = false; d.acReason = "Manual override";
    }
  } catch (error) { console.warn("Equipment AC calculation unavailable", error); d.heavyArmorWorn = false; d.armorSpeedPenalty = 0; }
  for (const s of d.effects.skills) d.skillProficiencies.add(s);
  const effectiveExpertise = new Set([...(c.expertise || []), ...(d.effects.expertise || [])]);
  d.effectiveExpertise = effectiveExpertise;
  const perceptionKey = "perception";
  if (d.skillProficiencies.has(perceptionKey)) d.passivePerception += d.pb;
  if (effectiveExpertise.has(perceptionKey)) d.passivePerception += d.pb;
  d.passivePerception += Number(d.effects.passivePerceptionBonus || 0);
  if (d.skillProficiencies.has("investigation")) d.passiveInvestigation += d.pb;
  if (effectiveExpertise.has("investigation")) d.passiveInvestigation += d.pb;
  d.passiveInvestigation += Number(d.effects.passiveInvestigationBonus || 0);
  const fastMovementBonus = d.effects.flags.has("fastMovement") && !d.heavyArmorWorn ? 10 : 0;
  d.speed = Number(c.speedOverride ?? Math.max(0, dfltSpeed(d.speciesObj) + Number(d.effects.speedBonus || 0) + fastMovementBonus - 5 * Number(c.exhaustion || 0) - Number(d.armorSpeedPenalty || 0)));
  const baseMaxHp = defaultMaxHp(d.classObj, c.level, mods.con, c.hpMaxOverride);
  const hpPerLevelBonus = Number(d.effects.hpPerLevel || 0) * Number(c.level || 1) + Number(d.effects.hpFlat || 0);
  d.maxHp = c.hpMaxOverride == null ? baseMaxHp + hpPerLevelBonus : baseMaxHp;
  d.maxHpAutomatic = c.hpMaxOverride == null;
  const faces = hitDieFaces(d.classObj);
  const later = Math.max(1, Math.floor(faces / 2) + 1 + mods.con);
  d.hpFormula = c.hpMaxOverride == null
    ? `Level 1: max of 1 or d${faces} ${formatMod(mods.con)}; later levels: max of 1 or ${formatMod(later)} each${hpPerLevelBonus ? `; automatic feature bonus ${formatMod(hpPerLevelBonus)} total` : ""}`
    : "Manual maximum";
  if (c.acOverride == null && !Number.isFinite(d.ac)) d.ac = 10 + mods.dex;
  c.hitDiceUsed = Math.min(Math.max(0, Number(c.hitDiceUsed || 0)), Math.max(0, Number(c.level || 1)));
  if (Array.isArray(c.spellSlotsUsed) && d.spellSlots.length) c.spellSlotsUsed = c.spellSlotsUsed.slice(0, d.spellSlots.length).map((used, i) => Math.min(Math.max(0, Number(used || 0)), Number(d.spellSlots[i] || 0)));
  c.exhaustion = clamp(Number(c.exhaustion || 0), 0, 6);
  if (c.hpAuto || c.hpCurrent == null) { c.hpCurrent = d.maxHp; d.currentHp = d.maxHp; c.hpAuto = true; }
  else { d.currentHp = clamp(Number(c.hpCurrent || 0), 0, d.maxHp); }
  if (d.currentHp > d.maxHp && c.hpMaxOverride == null) { d.currentHp = d.maxHp; c.hpCurrent = d.maxHp; }
  if (d.currentHp > 0 && (Number(c.deathSaves?.success || 0) || Number(c.deathSaves?.failure || 0))) c.deathSaves = { success: 0, failure: 0 };
  if (!c.baseStats) c.baseStats = { ...c.stats };
  if (c.backgroundAbility?.mode === "split" && c.backgroundAbility?.plus2 === c.backgroundAbility?.plus1) c.backgroundAbility.plus1 = null;
  state.lastDerived = d;
  await saveCharacter();
  return d;
}

function sizeLabel(value) { return Array.isArray(value) ? value.join(" / ") : (value || "—"); }

function dfltSpeed(species) {
  if (!species?.speed) return 30;
  if (typeof species.speed === "number") return species.speed;
  if (species.speed.walk) return Number(species.speed.walk);
  return 30;
}

function updateHeader() {
  const net = document.querySelector("#networkBadge");
  const data = document.querySelector("#dataBadge");
  const install = document.querySelector("#installBtn");
  if (net) {
    net.textContent = state.online ? "Online" : "Offline";
    net.className = `status-pill ${state.online ? "online" : "offline"}`;
  }
  if (data) data.textContent = state.version ? `5etools ${state.version}${state.libraryReady ? "" : " · caching…"}` : "5etools: not synced";
  if (install) install.hidden = !state.deferredInstallPrompt;
}
function setBusy(value) { state.busy = value; const btn = document.querySelector("#updateBtn"); if (btn) { btn.disabled = value; btn.textContent = value ? "Updating…" : "Update data"; } }
function showToast(message) {
  const root = document.querySelector("#toastRoot");
  if (!root) return;
  root.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { root.innerHTML = ""; }, 3500);
}

function render() {
  const app = document.querySelector("#app");
  if (!app) return;
  document.querySelectorAll(".tab").forEach(btn => btn.classList.toggle("is-active", btn.dataset.view === state.view));
  if (!state.version || !state.data.classIndex || !state.libraryReady) {
    app.innerHTML = !state.version ? emptyState() : `<div class="card empty-state"><div class="empty-icon">◆</div><h2>Rules library is not ready</h2><p>The complete 2024 player-facing rules library is synchronized in batches before the character sheet is made available. Existing cached batches are reused automatically.</p><button class="button button-primary" data-action="sync" ${state.busy ? "disabled" : ""}>${state.busy ? "Synchronizing…" : "Retry synchronization"}</button></div>`;
    bindEvents();
    return;
  }
  if (state.view === "builder") return renderBuilder(app).catch(renderError);
  if (state.view === "spells") return renderSpellbook(app).catch(renderError);
  if (state.view === "equipment") return renderEquipment(app).catch(renderError);
  if (state.view === "data") return renderDataView(app).catch(renderError);
  return renderSheet(app).catch(renderError);
}

function renderError(error) {
  console.error(error);
  const app = document.querySelector("#app");
  if (app) app.innerHTML = `<div class="card empty-state"><div class="empty-icon">!</div><h2>Something went wrong</h2><p>${escapeHtml(error?.message || String(error))}</p><button class="button button-primary" data-action="sheet">Return to character</button></div>`;
  bindEvents();
}

function pageHeader(kicker, title, meta, actions = "") {
  return `<div class="hero"><div><div class="mini">${escapeHtml(kicker)}</div><h1>${escapeHtml(title)}</h1>${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ""}</div><div class="hero-actions">${actions}</div></div>`;
}

function emptyState() {
  return `<div class="card empty-state"><div class="empty-icon">◆</div><h2>Sync 5etools to begin</h2><p>The first sync downloads and caches the 2024 player-facing rules library in small batches. A progress bar shows what is being stored so the app does not depend on partially cached data.</p><button class="button button-primary" data-action="sync">Sync 5etools</button></div>`;
}

function metric(label, value, sub = "") {
  return `<div class="metric"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div>${sub ? `<div class="metric-sub">${escapeHtml(sub)}</div>` : ""}</div>`;
}
function pipBar(count, used, action, data = {}) {
  const n = Number(count || 0), u = Math.min(n, Math.max(0, Number(used || 0)));
  return `<div class="pips">${Array.from({ length: n }, (_, i) => `<button class="pip ${i < u ? "used" : ""}" data-action="${action}" data-index="${i}" ${Object.entries(data).map(([k,v]) => `data-${k}="${escapeHtml(v)}"`).join(" ")}></button>`).join("")}</div>`;
}

function renderInventoryItemLink(item) {
  if (!item?.name) return "—";
  const found = findOfficialItemByName(item.name, item.source || null);
  if (found?.name) return renderReferenceTag("item", `${found.name}|${found.source}|${found.name}`);
  return `<span>${escapeHtml(canonicalLabel(item.name, "item"))}</span>`;
}

function displayToolProficiencyLabel(value) {
  const raw = String(value || "").trim();
  if (/^Dragonchess Set$/i.test(raw)) return "Dragonchess";
  if (/^Dice Set$/i.test(raw)) return "Dice";
  if (/^Playing Card Set$/i.test(raw)) return "Playing Cards";
  if (/^Three-Dragon Ante Set$/i.test(raw)) return "Three-Dragon Ante";
  return raw;
}
function renderProficiencyGroup(values, kind) {
  if (!values?.length) return `<span class="muted">None</span>`;
  if (kind === "tool" || kind === "weapon") {
    return values.map(v => {
      const labelValue = kind === "tool" ? displayToolProficiencyLabel(v) : String(v || "");
      const placeholder = /^Choose a /i.test(labelValue);
      if (placeholder) return `<span class="proficiency-placeholder">${escapeHtml(labelValue)}</span>`;
      const found = findOfficialItemByName(labelValue, DATA_SOURCE) || findOfficialItemByName(labelValue);
      const isItem = found && (kind === "tool" ? !found.weaponCategory : Boolean(found.weaponCategory));
      return isItem ? renderReferenceTag("item", `${found.name}|${found.source}|${labelValue}`) : `<span>${escapeHtml(canonicalLabel(labelValue))}</span>`;
    }).join(", ");
  }
  if (kind === "language") {
    return values.map(v => {
      const found = findLanguage(v, DATA_SOURCE) || findLanguage(v);
      return found ? renderReferenceTag("language", `${found.name}|${found.source}|${found.name}`) : `<span>${escapeHtml(canonicalLabel(v))}</span>`;
    }).join(", ");
  }
  return values.map(v => `<span>${escapeHtml(canonicalLabel(v))}</span>`).join(", ");
}

function renderConditionChip(name, selected) {
  const ref = encodeURIComponent(JSON.stringify({ tag: "condition", name, source: DATA_SOURCE, label: name }));
  if (name === "Exhaustion") {
    return `<div class="condition-chip-wrap"><button class="sheet-chip rules-condition-hover ${selected ? "selected" : ""}" data-ref="${escapeHtml(ref)}" data-action="condition" data-condition="Exhaustion">Exhaustion ${Number(state.character.exhaustion || 0)}/6</button><button type="button" class="condition-level-btn" data-action="exhaustion" data-delta="-1">−</button><button type="button" class="condition-level-btn" data-action="exhaustion" data-delta="1">+</button></div>`;
  }
  return `<div class="condition-chip-wrap"><button class="sheet-chip rules-condition-hover ${selected ? "selected" : ""}" data-ref="${escapeHtml(ref)}" data-action="condition" data-condition="${escapeHtml(name)}">${escapeHtml(name)}</button></div>`;
}

function renderMasteryDetail(item) {
  const mastery = masteryObjects(item);
  if (!mastery.length) return "";
  const labels = mastery.map(x => x.name);
  return labels.join(", ");
}

function masteryRuleFallback(name) {
  const key = textNorm(name);
  const entries = {
    cleave: "If you hit a creature with a qualifying weapon, you can make an extra attack against another creature within range after the hit. The extra attack uses the same ability and weapon and doesn’t add your ability modifier to its damage unless that modifier is negative.",
    graze: "If an attack with this weapon misses, you can deal damage equal to the ability modifier used for the attack (minimum 1) to the target.",
    nick: "When you make an extra attack with this weapon’s Light property, you can make that extra attack as part of the Attack action instead of as a Bonus Action.",
    push: "If you hit a creature with this weapon, you can push the creature up to 10 feet straight away from you if it is no more than one size larger than you.",
    sap: "If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.",
    slow: "If you hit a creature with this weapon, its Speed is reduced by 10 feet until the start of your next turn.",
    topple: "If you hit a creature with this weapon, you can force it to make a Constitution saving throw or have the Prone condition.",
    vex: "If you hit a creature with this weapon and deal damage, you have Advantage on your next attack roll against that creature before the end of your next turn."
  };
  const label = canonicalLabel(name);
  return entries[key] ? { name: label, source: DATA_SOURCE, entries: [entries[key]] } : null;
}

function renderWeaponMasteryLink(name) {
  const payload = encodeURIComponent(JSON.stringify({ tag: "mastery", name, source: DATA_SOURCE, label: canonicalLabel(name) }));
  return `<button type="button" class="rules-ref-link" data-ref="${escapeHtml(payload)}" title="View ${escapeHtml(canonicalLabel(name))} mastery">${escapeHtml(canonicalLabel(name))}</button>`;
}

function senseName(value) {
  const key = textNorm(stripTags(String(value || "")));
  return SPECIAL_SENSES.find(x => textNorm(x) === key) || null;
}
function senseFromNameAndText(name, text) {
  const sense = senseName(name);
  if (!sense) return null;
  const raw = stripTags(String(text || ""));
  const match = raw.match(/\b(?:within|range of)\s+(?:a\s+)?(\d+)\s*(?:-|–)?\s*(?:foot|feet|ft\.?|f\.?t\.?)\b/i);
  const range = match ? `${match[1]} ft.` : "";
  return { tag: "sense", name: sense, source: DATA_SOURCE, label: range ? `${sense} ${range}` : sense };
}
function collectSenseRefs(source) {
  const out = [];
  const push = (name, label, sourceRef = DATA_SOURCE) => {
    const canonical = senseName(name);
    if (!canonical) return;
    out.push({ tag: "sense", name: canonical, source: sourceRef || DATA_SOURCE, label: label || canonical });
  };
  const scanText = value => {
    const text = stripTags(String(value || ""));
    for (const m of text.matchAll(/\{@sense\s+([^|}]+)(?:\|([^|}]+))?(?:\|([^}]+))?\}/gi)) {
      push(m[1].trim(), m[3]?.trim() || m[1].trim(), m[2] || DATA_SOURCE);
    }
    for (const m of text.matchAll(/\b(Blindsight|Darkvision|Tremorsense|Truesight)\b(?:\s+(?:up to\s+)?(\d+)\s*(?:-|–)?\s*(?:foot|feet|ft\.?|f\.?t\.?))?/gi)) {
      push(m[1], m[2] ? `${m[1]} ${m[2]} ft.` : m[1]);
    }
  };
  const walk = value => {
    if (value == null) return;
    if (typeof value === "string") { scanText(value); return; }
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (typeof value === "object") {
      if (value.senses && typeof value.senses === "object" && !Array.isArray(value.senses)) {
        for (const [name, range] of Object.entries(value.senses)) {
          const n = senseName(name);
          if (n) push(n, range != null && range !== true ? `${n} ${range} ft.` : n);
        }
      }
      if (Array.isArray(value.senses)) value.senses.forEach(v => {
        const match = String(v || "").match(/^(Blindsight|Darkvision|Tremorsense|Truesight)(?:\s+(.*))?$/i);
        if (match) push(match[1], match[2] ? `${match[1]} ${match[2]}` : match[1]);
        else scanText(v);
      });
      if (value.name) {
        const direct = senseFromNameAndText(value.name, value.entries ?? value.entry ?? "");
        if (direct) out.push(direct);
      }
      scanText(value.entries ?? value.entry ?? "");
      for (const [key, v] of Object.entries(value)) {
        if (key !== "senses" && key !== "entries" && key !== "entry") walk(v);
      }
    }
  };
  walk(source);
  return out;
}
function renderSenseRef(ref) {
  const payload = encodeURIComponent(JSON.stringify({ tag: "sense", name: ref.name, source: ref.source || DATA_SOURCE, label: ref.label || ref.name }));
  return `<button type="button" class="rules-ref-link sense-ref" data-ref="${escapeHtml(payload)}" title="View ${escapeHtml(ref.name)} rules">${escapeHtml(ref.label || ref.name)}</button>`;
}

function effectiveD20Penalty(c) { return -2 * clamp(Number(c?.exhaustion || 0), 0, 6); }

function renderSheetResources(c) {
  const resources = (c.resources || []).filter(r => r && Number(r.max || 0) > 0);
  if (!resources.length) return `<div class="resource-sheet-empty">No limited-use resources.</div>`;
  return `<div class="sheet-resource-grid">${resources.map((r,i)=>{
    const max=Number(r.max||0), current=clamp(Number(r.current ?? max),0,max), spent=max-current;
    return `<div class="sheet-resource-card"><div class="sheet-resource-head"><span>${escapeHtml(r.name || "Resource")}</span><strong>${current}/${max}</strong></div>${r.origin?.name ? `<small>${escapeHtml(r.origin.name)}</small>` : ""}<div class="pips sheet-resource-pips">${Array.from({length:max},(_,idx)=>`<button class="pip ${idx<spent?"used":""}" data-action="resource-pip" data-resource="${i}" data-index="${idx}" aria-label="${escapeHtml(r.name||"Resource")} ${idx+1}"></button>`).join("")}</div><div class="resource-meta">${escapeHtml(r.recharge ? (r.recharge==="both"?"Short or Long Rest":`${r.recharge==="short"?"Short":"Long"} Rest`) : "Manual")}</div></div>`;
  }).join("")}</div>`;
}

function normalizeWeaponPropertyCode(value) {
  const raw = String(value?.name ?? value ?? "").split("|")[0].trim();
  const byLabel = Object.entries(WEAPON_PROPERTY_INFO).find(([code, info]) => info.label.toLowerCase() === raw.toLowerCase());
  return byLabel ? byLabel[0] : raw.toUpperCase();
}

function weaponNotePayload(item) {
  const properties = [];
  const codes = [];
  for (const value of Array.isArray(item?.property) ? item.property : []) {
    const code = normalizeWeaponPropertyCode(value);
    const info = WEAPON_PROPERTY_INFO[code];
    if (!info) continue;
    if (codes.includes(code)) continue;
    codes.push(code);
    properties.push({ code, label: info.label, description: info.description, raw: String(value?.name ?? value ?? "") });
  }
  const masteryNames = masteryObjects(item).map(x => String(x?.name || "")).filter(Boolean);
  return {
    kind: "weapon",
    title: `${item?.name || "Weapon"} · Notes`,
    range: item?.range ? String(item.range) : "",
    properties,
    shorthand: codes.map(code => ({ code, label: WEAPON_PROPERTY_INFO[code].label })),
    mastery: masteryNames.map(name => ({
      name: canonicalLabel(name),
      description: WEAPON_MASTERY_INFO[textNorm(name)] || "This weapon has this Weapon Mastery property in the 2024 rules."
    })),
    mastered: Boolean(state.character && hasSelectedWeaponMastery(state.character, item)),
  };
}

function spellNotePayload(spell) {
  const components = [];
  const c = spell?.components || {};
  if (c.v) components.push(SPELL_COMPONENT_INFO.V);
  if (c.s) components.push(SPELL_COMPONENT_INFO.S);
  if (c.m) components.push(SPELL_COMPONENT_INFO.M);
  return {
    kind: "spell",
    title: `${spell?.name || "Cantrip"} · Notes`,
    range: formatSpellRange(spell?.range),
    castingTime: formatSpellTime(spell?.time),
    duration: formatDuration(spell?.duration),
    components,
  };
}

function autoLinkNoteKeywords(text) {
  const phrases = [
    ["Constitution saving throw", "variantrule"], ["Proficiency Bonus", "variantrule"], ["Bonus Action", "variantrule"], ["Attack action", "variantrule"], ["Opportunity Attack", "variantrule"], ["Short Rest", "variantrule"], ["Long Rest", "variantrule"], ["Concentration", "variantrule"], ["Advantage", "variantrule"], ["Disadvantage", "variantrule"], ["Prone", "condition"], ["Speed", "variantrule"], ["Reaction", "variantrule"]
  ];
  return String(text || "").split(/(\{@[^}]*\})/g).map(chunk => {
    if (chunk.startsWith("{@")) return chunk;
    let out=chunk;
    for (const [phrase,tag] of phrases) { const escaped=phrase.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); out=out.replace(new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`,"g"),`{@${tag} ${phrase}|${DATA_SOURCE}}`); }
    return out;
  }).join("");
}
function renderNoteText(text) { return renderInline(autoLinkNoteKeywords(String(text || ""))); }

function customNotePayload(text, title = "Attack Notes") {
  const note = String(text || "").trim();
  return note ? { kind: "custom", title, text: note } : null;
}

function renderAttackDetails(notePayload) {
  if (!notePayload) return "";
  const payload = encodeURIComponent(JSON.stringify(notePayload));
  const label = notePayload.kind === "weapon" ? "Notes" : notePayload.kind === "spell" ? "Notes" : "Notes";
  const title = notePayload.title || "Notes";
  return `<button type="button" class="sheet-note-link" data-action="attack-details" data-note-payload="${escapeHtml(payload)}" aria-label="${escapeHtml(title)}">${label}</button>`;
}

function renderAttackNoteDialog(payload) {
  if (!payload) return;
  if (payload.kind === "custom") {
    return openModal(payload.title || "Attack Notes", `<div class="rules-text formatted-rules"><p>${renderNoteText(payload.text || "")}</p></div>`);
  }
  if (payload.kind === "weapon") {
    const range = payload.range ? `<section class="note-section"><h3>Range</h3><p>${renderNoteText(payload.range)}</p></section>` : "";
    const propertyRows = (payload.properties || []).map(x => `<div class="note-definition"><strong>${escapeHtml(x.label)} <small>(${escapeHtml(x.code)})</small></strong><span>${renderNoteText(x.description)}</span></div>`).join("");
    const shorthand = (payload.shorthand || []).map(x => `<span class="note-chip"><b>${escapeHtml(x.code)}</b><span>${escapeHtml(x.label)}</span></span>`).join("");
    const masteryRows = (payload.mastery || []).map(x => `<div class="note-definition"><strong>${escapeHtml(x.name)}</strong><span>${renderNoteText(x.description)}</span></div>`).join("");
    const masteryStatus = payload.mastery?.length ? `<p class="note-status">${payload.mastered ? "You currently have this weapon mastery selected." : "You do not currently have this weapon mastery selected."}</p>` : "";
    return openModal(payload.title || "Weapon Notes", `<div class="rules-text formatted-rules note-dialog-content">${range}${propertyRows ? `<section class="note-section"><h3>Weapon Properties</h3>${propertyRows}</section>` : ""}${shorthand ? `<section class="note-section"><h3>Shorthand</h3><div class="note-chip-row">${shorthand}</div></section>` : ""}${masteryRows ? `<section class="note-section"><h3>Weapon Mastery</h3>${masteryRows}${masteryStatus}</section>` : ""}</div>`);
  }
  if (payload.kind === "spell") {
    const facts = [["Casting Time", payload.castingTime], ["Range", payload.range], ["Duration", payload.duration]].filter(([,v]) => v).map(([k,v]) => `<div class="note-fact"><strong>${escapeHtml(k)}</strong><span>${renderNoteText(v)}</span></div>`).join("");
    const components = (payload.components || []).map(x => `<div class="note-definition"><strong>${escapeHtml(x.label)}</strong><span>${renderNoteText(x.description)}</span></div>`).join("");
    return openModal(payload.title || "Cantrip Notes", `<div class="rules-text formatted-rules note-dialog-content">${facts ? `<section class="note-section"><h3>Spell Basics</h3><div class="note-fact-grid">${facts}</div></section>` : ""}${components ? `<section class="note-section"><h3>Components</h3>${components}</section>` : ""}</div>`);
  }
}

async function renderSheet(app) {
  const c = state.character;
  const d = await deriveCharacter();
  const selectedSpellRefs = [...(c.cantrips || []), ...(c.preparedSpells || []), ...(c.spellbook || []), ...(c.knownSpells || [])];
  if (selectedSpellRefs.length) await Promise.all(selectedSpellRefs.map(getSpellById));
  const attackRows = await getAttackRows(d);
  const page = state.sheetPage || 1;
  const classLine = [c.class?.name, c.subclass?.name].filter(Boolean).join(" · ");
  const identityLine = [c.background?.name, c.species?.name].filter(Boolean).join(" · ");
  const saves = ABILITIES.map(a => {
    const prof = d.savingThrowProficiencies.has(a), adv = d.savingThrowAdvantages?.has(a);
    return `<div class="sheet-save-row"><span class="check-circle ${prof ? "on" : ""}"></span><span>${ABILITY_NAMES[a]} Save${adv ? ` <sup class="save-advantage">ADV</sup>` : ""}</span><strong>${formatMod(d.mods[a] + (prof ? d.pb : 0) + Number(d.d20Penalty || 0))}</strong></div>`;
  }).join("");
  const skillsByAbility = Object.fromEntries(ABILITIES.map(a => [a, []]));
  for (const [key,[ability,name]] of Object.entries(SKILLS)) skillsByAbility[ability].push({ key, name, prof: d.skillProficiencies.has(key), exp: d.effectiveExpertise?.has(key) || false, bonus: d.mods[ability] + (d.skillProficiencies.has(key) ? d.pb : 0) + (d.effectiveExpertise?.has(key) ? d.pb : 0) + Number(d.d20Penalty || 0) });
  const abilityBoxes = ABILITIES.map(a => `<section class="ability-box">
      <div class="ability-head"><span>${ABILITY_LABELS[a]}</span><strong>${d.stats[a]}</strong><em>${formatMod(d.mods[a])}</em></div>
      <div class="ability-save"><span class="check-circle ${d.savingThrowProficiencies.has(a) ? "on" : ""}"></span><b>Saving Throw${d.savingThrowAdvantages?.has(a) ? ` <sup class="save-advantage">ADV</sup>` : ""}</b><strong>${formatMod(d.mods[a] + (d.savingThrowProficiencies.has(a) ? d.pb : 0) + Number(d.d20Penalty || 0))}</strong></div>
      <div class="skill-stack">${skillsByAbility[a].map(sk => `<div class="sheet-skill-row"><span class="check-circle ${sk.prof ? "on" : ""}"></span><span>${escapeHtml(sk.name)}${sk.exp ? " <sup>EX</sup>" : ""}</span><strong>${formatMod(sk.bonus)}</strong></div>`).join("")}</div>
    </section>`).join("");
  const featureRows = [...d.classFeatures.map(f => ({...f, kind:"Class"})), ...d.subclassFeatures.map(f => ({...f, kind:"Subclass"}))]
    .sort((a,b) => Number(a.level)-Number(b.level) || a.name.localeCompare(b.name))
    .map(f => `<button class="sheet-feature-row" data-action="feature" data-name="${encodeURIComponent(f.name)}" data-kind="${f.kind}"><div><strong>${escapeHtml(f.name)}</strong><span>${escapeHtml(f.kind)} · Level ${f.level}</span></div><span>›</span></button>`).join("") || `<div class="sheet-empty">No class features yet.</div>`;
  const speciesTraits = (d.speciesObj?.entries || []).filter(x => x && x.name).slice(0, 10);
  const traitRows = speciesTraits.map(t => `<button class="sheet-feature-row" data-action="species-trait" data-name="${encodeURIComponent(t.name)}"><div><strong>${escapeHtml(t.name)}</strong><span>Species</span></div><span>›</span></button>`).join("") || `<div class="sheet-empty">Choose a species.</div>`;
  const featRow = d.featObjs.length ? d.featObjs.map(feat => `<button class="sheet-feature-row" data-action="feat-detail" data-name="${encodeURIComponent(`${feat.name}|${feat.source}`)}"><div><strong>${escapeHtml(feat.name)}</strong><span>Feat · ${escapeHtml(sourceLabel(feat.source))}</span></div><span>›</span></button>`).join("") : `<div class="sheet-empty">Choose a feat.</div>`;
  const conditionChips = CONDITIONS.map(x => renderConditionChip(x, x === "Exhaustion" ? Number(c.exhaustion || 0) > 0 : c.conditions.includes(x))).join("");
  const inspiration = c.heroicInspiration ? "★" : "☆";
  const slots = Array.from({length: 9}, (_,i) => d.spellSlots[i] ? `<div class="spell-slot-box"><strong>${i+1}</strong>${pipBar(d.spellSlots[i], countSlotUsed(c,i+1), "slot", {level:i+1})}</div>` : "").filter(Boolean).join("");
  const prepared = (await Promise.all((c.preparedSpells || []).map(getSpellById))).filter(Boolean).sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name));
  const cantrips = (await Promise.all((c.cantrips || []).map(getSpellById))).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
  const languages = d.proficiencies.languages.length ? d.proficiencies.languages : ["None recorded"];
  const attackHtml = attackRows.map(row => `<div class="weapon-row"><span>${row.nameHtml || escapeHtml(row.name)}</span><strong>${escapeHtml(row.attackBonus)}</strong><span>${escapeHtml(row.damage)}</span><small>${renderAttackDetails(row.notePayload)}</small></div>`).join("") || `<div class="sheet-empty">Equip a weapon or add a custom attack.</div>`;
  const featurePreview = f => renderRichEntries((Array.isArray(f.entries) ? f.entries : [f.entries]).slice(0,2));

  const pageOne = `<div class="sheet-page">
    <div class="sheet-brandline"><div><span class="sheet-kicker">D&D 2024 · CHARACTER SHEET</span><h1>${escapeHtml(c.name || "Unnamed Character")}</h1><p>${escapeHtml(classLine || "Class not chosen")} · Level ${c.level}</p></div><div class="sheet-page-actions"><button class="sheet-nav ${page===1?"active":""}" data-action="sheet-page" data-page="1">Page 1</button><button class="sheet-nav ${page===2?"active":""}" data-action="sheet-page" data-page="2">Page 2</button><button class="sheet-nav" data-action="builder">Edit</button><button class="sheet-nav" data-action="character-menu">Characters</button></div></div>
    <div class="identity-grid">
      <div class="identity-fields"><div class="field-line"><span>Character Name</span><strong>${escapeHtml(c.name || "—")}</strong></div><div class="field-line"><span>Background</span><strong>${escapeHtml(c.background?.name || "—")}</strong></div><div class="field-line"><span>Species</span><strong>${escapeHtml(c.species?.name || "—")}</strong></div><div class="field-line"><span>Player</span><strong>${escapeHtml(c.player || "—")}</strong></div></div>
      <div class="identity-fields"><div class="field-line"><span>Class & Subclass</span><strong>${escapeHtml(classLine || "—")}</strong></div><div class="field-line"><span>Level</span><strong>${c.level}</strong></div><div class="field-line"><span>Experience</span><strong>${Number(c.xp || 0).toLocaleString()}</strong></div><div class="field-line"><span>Proficiency Bonus</span><strong>${formatMod(d.pb)}</strong></div></div>
      <div class="identity-stat-box"><span>Armor Class</span><strong>${d.ac}</strong><small>${escapeHtml(d.acReason || "Automatic")}</small>${!d.acAutomatic ? `<div class="stat-actions"><button class="sheet-mini-btn" data-action="clear-ac-override">Use automatic AC</button></div>` : ""}</div>
      <div class="identity-stat-box hp"><span>Hit Points</span><strong>${d.currentHp} / ${d.maxHp}</strong><small>Current / Maximum</small><div class="hp-max-label">MAX HP: ${d.maxHp}${c.hpMaxOverride == null ? " · Automatic" : " · Manual"}</div><div class="hp-formula">${escapeHtml(d.hpFormula || "Automatic maximum")}</div>${c.hpMaxOverride != null ? `<div class="stat-actions"><button class="sheet-mini-btn" data-action="clear-hp-override">Use automatic Max HP</button></div>` : ""}<div class="hp-actions" role="group" aria-label="Hit Point controls"><button type="button" data-action="damage">Damage</button><button type="button" data-action="heal">Heal</button><button type="button" data-action="hp">Set HP</button></div><div class="hp-temp-row"><span>Temporary HP</span><strong>${Number(c.tempHp || 0)}</strong><button data-action="temp-hp">Set</button></div></div>
      <div class="identity-stat-box"><span>Hit Dice</span><strong>d${hitDieFaces(d.classObj)}</strong><small>${c.hitDiceUsed} used</small></div>
      <div class="identity-stat-box"><span>Death Saves</span><strong>${c.deathSaves.success} ✓ · ${c.deathSaves.failure} ✕</strong><small>${d.currentHp === 0 ? `<button data-action="death" data-type="success">Success</button> <button data-action="death" data-type="failure">Failure</button>` : `Only tracked at 0 HP.`}</small></div>
    </div>
    <div class="sheet-metrics"><div><span>Initiative</span><strong>${formatMod(d.mods.dex + Number(d.effects?.initiativeBonus || 0) + Number(d.d20Penalty || 0))}</strong></div><div><span>Speed</span><strong>${d.speed} ft.</strong></div><div><span>Size</span><strong>${escapeHtml(d.size)}</strong></div><div><span>Passive Perception</span><strong>${d.passivePerception}</strong></div><div><span>Spell Save DC</span><strong>${d.spellcastingAbility ? 8 + d.pb + d.mods[d.spellcastingAbility] : "—"}</strong></div><div><span>Spell Attack</span><strong>${d.spellcastingAbility ? formatMod(d.pb+d.mods[d.spellcastingAbility] + Number(d.d20Penalty || 0)) : "—"}</strong></div></div>${d.activeEffects?.length || d.optionalFeatureObjects?.length || d.weaponMasteryCount ? `<section class="sheet-panel derived-effects-panel"><div class="sheet-panel-title">Active Rules Effects</div><div class="active-effect-list">${d.activeEffects.map(x=>`<span class="active-effect-chip">${escapeHtml(x)}</span>`).join("")}${d.optionalFeatureObjects.map(x=>`<button class="active-effect-chip effect-link" data-action="optional-feature-detail" data-name="${encodeURIComponent(`${x.name}|${x.source}`)}">${escapeHtml(x.name)}</button>`).join("")}${d.weaponMasteryCount ? `<span class="active-effect-chip">Weapon Mastery ${Math.min(selectedWeaponMasteryRefs(c).length,d.weaponMasteryCount)}/${d.weaponMasteryCount}</span>` : ""}</div></section>` : ""}
    <div class="sheet-grid-main"><div class="ability-column">${abilityBoxes}</div><div class="sheet-right-column">
      <section class="sheet-panel"><div class="sheet-panel-title">Weapons & Damage Cantrips <button class="sheet-mini-btn" data-action="manage-attacks">Manage</button></div><div class="weapon-table head"><span>Name</span><span>Atk</span><span>Damage</span><span>Notes</span></div>${attackHtml}</section>
      ${d.weaponMasteryCount ? `<section class="sheet-panel"><div class="sheet-panel-title">Weapon Masteries</div><div class="selection-count">${selectedWeaponMasteryRefs(c).length} / ${d.weaponMasteryCount}</div>${selectedWeaponMasteryRefs(c).map(ref => { const item = findOfficialItemByName(splitRefId(ref).name, splitRefId(ref).source); return item ? `<div class="mastery-sheet-row"><span>${renderReferenceTag("item", `${item.name}|${item.source}|${item.name}`)}</span><span>${masteryObjects(item).map(x=>renderWeaponMasteryLink(x.name)).join(", ") || "—"}</span></div>` : `<div class="mastery-sheet-row"><span>${escapeHtml(splitRefId(ref).name)}</span><span>—</span></div>`; }).join("") || `<div class="sheet-empty">No Weapon Masteries selected.</div>`}</section>` : ""}
      <section class="sheet-panel"><div class="sheet-panel-title">Class Features</div>${featureRows}</section>
      <section class="sheet-panel"><div class="sheet-panel-title">Species Traits</div>${traitRows}</section>
      <section class="sheet-panel"><div class="sheet-panel-title">Feats</div>${featRow}</section>
      <section class="sheet-panel inspiration-panel"><div><div class="sheet-panel-title">Heroic Inspiration</div><p>${c.heroicInspiration ? "Available" : "Not available"}</p></div><button data-action="heroic" class="inspiration-button">${inspiration}</button></section>
      <section class="sheet-panel"><div class="sheet-panel-title">Conditions</div><div class="sheet-chips">${conditionChips}</div></section>
      <section class="sheet-panel"><div class="sheet-panel-title">Resources</div>${renderSheetResources(c)}<div class="resource-actions sheet-resource-actions"><button class="sheet-nav" data-action="rest-short">Short Rest</button><button class="sheet-nav" data-action="rest-long">Long Rest</button><button class="sheet-nav" data-action="manage-resources">Manage</button><button class="sheet-nav" data-action="temp-hp">Temporary HP</button><span>Exhaustion ${c.exhaustion}/6</span></div></section>
    </div></div>
  </div>`;

  const pageTwo = `<div class="sheet-page">
    <div class="sheet-brandline"><div><span class="sheet-kicker">D&D 2024 · CHARACTER SHEET</span><h1>${escapeHtml(c.name || "Unnamed Character")}</h1><p>Spellcasting, personality, proficiencies & equipment</p></div><div class="sheet-page-actions"><button class="sheet-nav ${page===1?"active":""}" data-action="sheet-page" data-page="1">Page 1</button><button class="sheet-nav ${page===2?"active":""}" data-action="sheet-page" data-page="2">Page 2</button></div></div>
    <div class="spellcasting-head"><div><span>Spellcasting Ability</span><strong>${d.spellcastingAbility ? ABILITY_LABELS[d.spellcastingAbility] : "—"}</strong></div><div><span>Spell Save DC</span><strong>${d.spellcastingAbility ? 8+d.pb+d.mods[d.spellcastingAbility] : "—"}</strong></div><div><span>Spell Attack Bonus</span><strong>${d.spellcastingAbility ? formatMod(d.pb+d.mods[d.spellcastingAbility] + Number(d.d20Penalty || 0)) : "—"}</strong></div><div><span>Prepared</span><strong>${d.maxPrepared ?? "—"}</strong></div><div><span>Concentration</span><strong>${c.concentration ? escapeHtml(c.concentration) : "—"}</strong></div></div>
    <section class="sheet-panel spell-slots-panel"><div class="sheet-panel-title">Spell Slots</div><div class="spell-slot-grid">${slots || `<div class="sheet-empty">No spell slots.</div>`}</div></section>
    <div class="sheet-grid-two"><section class="sheet-panel"><div class="sheet-panel-title">Cantrips <button class="sheet-mini-btn" data-action="spells">Manage</button></div>${cantrips.length ? cantrips.map(s => `<div class="sheet-list-item static"><span>${renderReferenceTag("spell", `${s.name}|${s.source}|${s.name}`)}</span><small>${escapeHtml(spellSchoolName(s.school))}</small></div>`).join("") : `<div class="sheet-empty">No cantrips selected.</div>`}</section><section class="sheet-panel"><div class="sheet-panel-title">Prepared Spells <button class="sheet-mini-btn" data-action="spells">Manage</button></div>${prepared.length ? prepared.map(s => `<div class="sheet-list-item static"><span>${renderReferenceTag("spell", `${s.name}|${s.source}|${s.name}`)}</span><small>Level ${s.level}</small></div>`).join("") : `<div class="sheet-empty">No prepared spells selected.</div>`}</section></div>
    <div class="sheet-grid-two compact-sheet-gap"><section class="sheet-panel"><div class="sheet-panel-title">Proficiencies & Languages</div><div class="proficiency-groups"><div><b>Armor</b><p>${renderProficiencyGroup(d.proficiencies.armor, "armor") || "None"}</p></div><div><b>Weapons</b><p>${renderProficiencyGroup(d.proficiencies.weapons, "weapon") || "None"}</p></div><div><b>Tools</b><p>${renderProficiencyGroup(d.proficiencies.tools, "tool") || "None"}</p></div><div><b>Languages</b><p>${renderProficiencyGroup(languages, "language") || "None"}</p></div></div>${d.resistances.length ? `<div class="derived-subgroup"><b>Damage Resistances</b><p>${escapeHtml(d.resistances.join(", "))}</p></div>` : ""}<div class="derived-subgroup"><b>Senses</b><p class="sense-list">${d.senseRefs.length ? d.senseRefs.map(renderSenseRef).join(", ") : "No special senses"}${d.senses.length ? `${d.senseRefs.length ? ", " : ""}${escapeHtml(d.senses.join(", "))}` : ""}</p></div><button class="sheet-mini-btn" data-action="builder">Edit proficiencies</button></section><section class="sheet-panel"><div class="sheet-panel-title">Personality & Backstory</div><textarea class="sheet-notes" data-field="notes" rows="12" placeholder="Character notes, personality, ideals, bonds, flaws, backstory…">${escapeHtml(c.notes)}</textarea></section></div>
    <div class="sheet-grid-two compact-sheet-gap"><section class="sheet-panel"><div class="sheet-panel-title">Equipment</div>${(c.inventory || []).length ? c.inventory.slice(0,12).map((it,i) => `<div class="sheet-list-item static"><span>${renderInventoryItemLink(it)}${it.quantity>1?` ×${it.quantity}`:""}</span><small>${it.equipped ? "Equipped" : ""}</small></div>`).join("") : `<div class="sheet-empty">No equipment.</div>`}<button class="sheet-mini-btn" data-action="equipment">Open equipment</button></section><section class="sheet-panel"><div class="sheet-panel-title">Coins & Attunement</div><div class="coin-grid">${["cp","sp","ep","gp","pp"].map(k => `<label><span>${k.toUpperCase()}</span><input type="number" data-currency="${k}" value="${Number(c.currency?.[k] || 0)}" min="0"></label>`).join("")}</div><div class="attunement"><b>Magic Item Attunement</b><p>Track attuned items in Equipment.</p></div></section></div>
  </div>`;

  app.innerHTML = `<div class="sheet-stage">${page === 1 ? pageOne : pageTwo}</div>`;
  bindEvents();
}

function countSlotUsed(c, level) { return Math.max(0, Number(c.spellSlotsUsed?.[level - 1] || 0)); }
function setSlotUsed(c, level, value) { if (!Array.isArray(c.spellSlotsUsed)) c.spellSlotsUsed = []; while (c.spellSlotsUsed.length < level) c.spellSlotsUsed.push(0); c.spellSlotsUsed[level - 1] = Math.max(0, Number(value)); }

async function renderBuilder(app) {
  const c = state.character;
  const races = officialEntries(state.data.races, "race").sort((a,b)=>a.name.localeCompare(b.name) || String(a.source).localeCompare(String(b.source)));
  const backgrounds = officialEntries(state.data.backgrounds, "background").sort((a,b)=>a.name.localeCompare(b.name) || String(a.source).localeCompare(String(b.source)));
  const feats = officialEntries(state.data.feats, "feat").sort((a,b)=>a.name.localeCompare(b.name));
  const classOptions = await getAllClassOptions();
  const bg = findBackground(c.background?.name, c.background?.source || null);
  const d = await deriveCharacter();
  const classChoiceSpecs = d.classObj ? optionalFeatureProgression(d.classObj, c.level) : [];
  const generalFeatSlots = d.progressionFeatSlots || [];
  const masteryCount = d.weaponMasteryCount || 0;
  const masteryItemsData = masteryCount ? await getItemsData().catch(() => null) : null;
  const masteryItems = masteryItemsData ? officialWeaponCatalog()
    .filter(it => String(it.source || "").toLowerCase() === String(DATA_SOURCE).toLowerCase() && (it.rarity == null || String(it.rarity).toLowerCase() === "none") && hasWeaponProficiency(it, d.proficiencies.weapons))
    .sort((a,b)=>a.name.localeCompare(b.name)) : [];
  const uniqueMasteryItems = [];
  const masteryNames = new Set();
  for (const item of masteryItems) {
    const key = textNorm(item.name);
    if (masteryNames.has(key)) continue;
    masteryNames.add(key);
    uniqueMasteryItems.push(item);
  }
  const bgAbility = backgroundAbilitySpec(bg);
  const proficiencyChoicesMarkup = renderProficiencyChoiceFields(proficiencyChoiceOwners(d.classObj, bg, d.speciesObj, d.featObjs), c);
  const bgFeatRefs = backgroundFeatNames(bg);
  const availableOriginFeats = bgFeatRefs.length ? feats.filter(f => bgFeatRefs.some(ref => String(ref.name || ref).toLowerCase() === f.name.toLowerCase() && (!ref.source || String(ref.source).toLowerCase() === String(f.source).toLowerCase()))) : [];
  const featChoiceMarkup = d.featObjs.flatMap(feat => [
    ...featAbilitySpecs(feat).map(spec => {
      const key=featSpecKey(feat,spec);
      if (spec.fixed || !spec.from.length) return "";
      const selected = c.featAbilityChoices?.[key] || "";
      return `<div class="feat-choice-row"><label class="field">${escapeHtml(feat.name)} · Ability increase (+${spec.amount})<select data-feat-ability="${escapeHtml(key)}"><option value="">— Select —</option>${spec.from.map(a=>`<option value="${a}" ${selected===a?"selected":""}>${ABILITY_NAMES[a]}</option>`).join("")}</select></label></div>`;
    }),
    ...featSaveSpecs(feat).map(spec => {
      const key=featSpecKey(feat,spec);
      if (spec.fixed || !spec.from.length) return "";
      const selected = c.featSaveChoices?.[key] || "";
      return `<div class="feat-choice-row"><label class="field">${escapeHtml(feat.name)} · Saving throw proficiency<select data-feat-save="${escapeHtml(key)}"><option value="">— Select —</option>${spec.from.map(a=>`<option value="${a}" ${selected===a?"selected":""}>${ABILITY_NAMES[a]}</option>`).join("")}</select></label></div>`;
    }),
    ...featSkillSpecs(feat).map(spec => {
      const key=featSpecKey(feat,spec);
      if (spec.fixed || !spec.from.length) return "";
      const selected = c.featSkillChoices?.[key] || "";
      return `<div class="feat-choice-row"><label class="field">${escapeHtml(feat.name)} · Skill proficiency<select data-feat-skill="${escapeHtml(key)}"><option value="">— Select —</option>${spec.from.map(sk=>`<option value="${sk}" ${selected===sk?"selected":""}>${escapeHtml(SKILLS[sk]?.[1]||sk)}</option>`).join("")}</select></label></div>`;
    }),
    ...featMixedChoiceSpecs(feat).map(spec => {
      const selected=c.featMixedChoices?.[spec.key]||"", options=mixedChoiceOptions(spec);
      return `<div class="feat-choice-row"><label class="field">${escapeHtml(feat.name)} · Choose skill/tool/language<select data-feat-mixed="${escapeHtml(spec.key)}"><option value="">— Select —</option>${options.map(o=>{const val=`${o.kind}:${o.value}`; return `<option value="${escapeHtml(val)}" ${selected===val?"selected":""}>${escapeHtml(o.kind)} · ${escapeHtml(o.name)}</option>`}).join("")}</select></label></div>`;
    }),
    ...featExpertiseSpecs(feat).map(spec => {
      const selected=c.featExpertiseChoices?.[spec.key]||"";
      return `<div class="feat-choice-row"><label class="field">${escapeHtml(feat.name)} · Expertise<select data-feat-expertise="${escapeHtml(spec.key)}"><option value="">— Select —</option>${spec.from.map(sk=>`<option value="${sk}" ${selected===sk?"selected":""}>${escapeHtml(SKILLS[sk]?.[1]||sk)}</option>`).join("")}</select></label></div>`;
    }),
    ...featAdditionalSpellChoiceSpecs(feat).flatMap(spec => {
      const selected=c.featSpellChoices?.[spec.key]||{};
      const list = spec.names.length ? `<div class="feat-choice-row"><label class="field">${escapeHtml(feat.name)} · Spell list<select data-feat-spell-list="${escapeHtml(spec.key)}"><option value="">— Select —</option>${spec.names.map(name=>`<option value="${escapeHtml(name)}" ${String(selected.list||"").toLowerCase()===String(name).toLowerCase()?"selected":""}>${escapeHtml(name)}</option>`).join("")}</select></label></div>` : "";
      const ability = spec.abilityFrom.length ? `<div class="feat-choice-row"><label class="field">${escapeHtml(feat.name)} · Spellcasting ability<select data-feat-spell-ability="${escapeHtml(spec.key)}"><option value="">— Select —</option>${spec.abilityFrom.map(a=>`<option value="${a}" ${selected.ability===a?"selected":""}>${ABILITY_NAMES[a]}</option>`).join("")}</select></label></div>` : "";
      return [list,ability].filter(Boolean);
    })
  ]).filter(Boolean).join("");
  const selectedAbility2 = c.backgroundAbility.plus2;
  const selectedAbility1 = c.backgroundAbility.plus1;
  const selectedAbility1b = c.backgroundAbility.plus1b;
  const selectedAbility1c = c.backgroundAbility.plus1c;
  const bgMode = c.backgroundAbility.mode === "three" ? "three" : "split";
  const classSkillChoices = new Set(normalizeSkillArray(c.classSkillChoices));
  const classOptionsSkills = d.skillChoiceSpec?.from || [];
  const maxClassSkills = d.skillChoiceSpec?.count || 0;
  const pointBuyTotal = ABILITIES.reduce((sum,a)=>sum+(POINT_BUY_COST[Math.max(8, Math.min(15, Number(c.baseStats[a] || 10)))] ?? 0),0);
  const sourceOptions = state.data.sourceMeta || [];
  const backgroundProficiencies = bg ? parseProficiencyDisplay(null, bg, null, null, false) : {armor:[],weapons:[],tools:[],languages:[]};
  const classProficiencies = d.classObj ? parseProficiencyDisplay(d.classObj, null, null, null, false) : {armor:[],weapons:[],tools:[],languages:[]};
  const proficiencyOverlap = proficiencyOverlaps(d.classObj, bg, c);
  const bgSkills = new Set(grantedSkillsFromMap(bg?.skillProficiencies));
  const standardLanguageChoices = Array.isArray(c.standardLanguages) ? c.standardLanguages : [null, null];
  const standardLanguageValues = standardLanguageOptions();
  const refValue = (obj) => normalizeRefId(obj.name, obj.source);
  const selectRefOptions = (list, current) => list.map(x => `<option value="${escapeHtml(refValue(x))}" ${current?.name===x.name && current?.source===x.source?"selected":""}>${escapeHtml(x.name)}${x.source!==DATA_SOURCE?` · ${escapeHtml(sourceLabel(x.source))}`:""}</option>`).join("");
  const speciesChoiceSpecsNow = speciesChoiceSpecs(d.speciesObj);
  const speciesChoiceMarkup = speciesChoiceSpecsNow.map(spec => {
    const current=c.speciesChoices?.[spec.key]||{}; const selectedValue=current.value||current||"";
    const optionSelect=`<label class="field">${escapeHtml(d.speciesObj?.name||"Species")} · ${escapeHtml(spec.label||"Choice")}<select data-species-choice="${escapeHtml(spec.key)}"><option value="">— Select —</option>${spec.options.map(o=>`<option value="${escapeHtml(o.name)}" ${textNorm(selectedValue)===textNorm(o.name)?"selected":""}>${escapeHtml(o.name)}</option>`).join("")}</select></label>`;
    const abilitySelect=spec.abilityFrom?.length?`<label class="field">${escapeHtml(d.speciesObj?.name||"Species")} · Spellcasting ability<select data-species-choice-ability="${escapeHtml(spec.key)}"><option value="">— Select —</option>${spec.abilityFrom.map(a=>`<option value="${a}" ${current.ability===a?"selected":""}>${ABILITY_NAMES[a]}</option>`).join("")}</select></label>`:"";
    return `<div class="choice-card"><div class="mini">${escapeHtml(spec.label||"Choose an option from this species.")}</div><div class="form-grid two">${optionSelect}${abilitySelect}</div></div>`;
  }).join("");
  const manualList = (key) => (c[key] || []).map((x,i)=>`<span class="editable-chip">${escapeHtml(x)}<button data-action="remove-manual" data-list="${key}" data-index="${i}">×</button></span>`).join("") || `<span class="mini">None added manually.</span>`;
  const bgBonusFor = a => bgMode === "three" ? ([selectedAbility1, selectedAbility1b, selectedAbility1c].includes(a) ? "+1" : "") : (selectedAbility2===a?"+2":selectedAbility1===a?"+1":"");
  const autoBonusLines = `<div class="final-stat-preview">${ABILITIES.map(a => `<div><span>${ABILITY_LABELS[a]}</span><strong>${c.baseStats[a]}</strong><em>${bgBonusFor(a)}</em><b>${d.stats[a]}</b></div>`).join("")}</div>`;
  const generalFeatMarkup = generalFeatSlots.length ? generalFeatSlots.map(spec => {
    const selected = c.progressionFeats?.[spec.key];
    const options = feats.filter(f => featCategoryMatches(f, spec.category)).filter(f => Number(f.prerequisite?.[0]?.level || 0) <= Number(c.level || 1));
    return `<div class="feat-choice-row"><label class="field">${escapeHtml(spec.name)} · Choice ${spec.index} (level ${spec.level})<select data-progression-feat="${escapeHtml(spec.key)}"><option value="">— Select —</option>${options.map(f=>`<option value="${escapeHtml(refValue(f))}" ${selected?.name===f.name&&selected?.source===f.source?"selected":""}>${escapeHtml(f.name)} · ${escapeHtml(f.source)}</option>`).join("")}</select></label></div>`;
  }).join("") : `<div class="empty">No general feat slot is granted by this class at the current level.</div>`;
  const optionalChoiceMarkup = classChoiceSpecs.length ? classChoiceSpecs.map(spec => {
    const selected = c.optionalFeatureChoices?.[spec.key];
    const options = availableOptionalFeatures(spec);
    return `<div class="feat-choice-row"><label class="field">${escapeHtml(spec.name)} · Choice ${spec.index}<select data-optional-feature="${escapeHtml(spec.key)}"><option value="">— Select —</option>${options.map(f=>`<option value="${escapeHtml(refValue(f))}" ${selected?.name===f.name&&selected?.source===f.source?"selected":""}>${escapeHtml(f.name)}${f.source!==DATA_SOURCE?` · ${escapeHtml(sourceLabel(f.source))}`:""}</option>`).join("")}</select></label></div>`;
  }).join("") : `<div class="empty">This class has no selectable optional class features at this level.</div>`;
  const masteryMarkup = masteryCount ? `<div class="selection-count">${selectedWeaponMasteryRefs(c).length} / ${masteryCount} selected</div><div class="mastery-picker"><label class="field">Mastered weapon<select id="weaponMasterySelect" data-weapon-mastery-select><option value="">Choose a weapon…</option>${uniqueMasteryItems.filter(item=>!hasSelectedWeaponMastery(c,item)).map(item=>`<option value="${escapeHtml(normalizeRefId(item.name,item.source))}">${escapeHtml(item.name)} — ${escapeHtml(masteryLabel(item))}</option>`).join("")}</select></label></div><div class="selected-mastery-list">${selectedWeaponMasteryRefs(c).map(ref=>{const item=findOfficialItemByName(splitRefId(ref).name,splitRefId(ref).source); return item ? `<div class="selected-mastery-item"><span>${renderReferenceTag("item", `${item.name}|${item.source}|${item.name}`)} <small>${masteryObjects(item).map(x=>renderWeaponMasteryLink(x.name)).join(", ")}</small></span><button type="button" class="button button-small" data-remove-weapon-mastery="${escapeHtml(normalizeRefId(item.name,item.source))}">Remove</button></div>` : "";}).join("") || `<div class="empty">No weapon masteries selected.</div>`}</div>` : `<div class="empty">Weapon Mastery is not part of this class at the current level.</div>`;
  const startOptions = (obj, kind) => {
    const groups = normalizeStartingEquipmentGroups(obj);
    if (!groups.length) return `<div class="empty">No structured starting-equipment choices are available for this ${kind} in the cached 5etools data.</div>`;
    const current = equipmentOriginRecord(c, kind).choices;
    return groups.map(group => `<div class="start-equip-group"><div class="subhead">Equipment choice ${group.group}</div><div class="start-equip-grid">${group.options.map(ch=>`<div class="start-equip-option ${String(current[group.group])===String(ch.key)?"selected":""}"><div class="start-equip-head"><strong>${escapeHtml(ch.label)}</strong>${String(current[group.group])===String(ch.key)?`<span class="status-pill">Applied</span>`:""}</div><div class="mini">${equipmentChoiceDescriptionHtml(ch)}</div><button class="button button-small button-primary" data-action="apply-starting-equipment" data-kind="${kind}" data-group="${group.group}" data-option="${escapeHtml(ch.key)}">Use ${escapeHtml(ch.label)}</button></div>`).join("")}</div></div>`).join("");
  };
  const startingEquipmentMarkup = `${d.classObj ? `<section class="card compact-gap"><div class="section-head"><div><div class="section-title">Starting equipment</div><div class="mini">These choices come from 5etools structured 2024 starting-equipment data. Applying an option replaces the app's previously applied starting equipment for that source.</div></div></div><h3 class="subhead">${escapeHtml(d.classObj.name)}</h3>${startOptions(d.classObj,"class")}${bg ? `<h3 class="subhead">${escapeHtml(bg.name)}</h3>${startOptions(bg,"background")}` : ""}</section>` : ""}`;

  app.innerHTML = `
    ${pageHeader("CHARACTER BUILDER", `Build ${c.name || "your character"}`, `All 2024 official player-facing sources currently discovered in 5etools are available.`, `<button class="button" data-action="sheet">Character</button><button class="button button-primary" data-action="save-builder">Save</button>`)}
    <section class="card"><div class="section-title">Identity</div><div class="form-grid three">
      <label class="field">Character name<input type="text" data-builder="name" value="${escapeHtml(c.name)}"></label>
      <label class="field">Player<input type="text" data-builder="player" value="${escapeHtml(c.player)}"></label>
      <label class="field">Level<input type="number" min="1" max="20" data-builder="level" value="${c.level}"></label><label class="field">Experience Points<input type="number" min="0" step="1" data-builder="xp" value="${Number(c.xp || 0)}"></label>
      <label class="field">Species<select data-builder="species"><option value="">— Select —</option>${selectRefOptions(races,c.species)}</select></label>
      <label class="field">Background<select data-builder="background"><option value="">— Select —</option>${selectRefOptions(backgrounds,c.background)}</select></label>
      <label class="field">Class<select data-builder="class"><option value="">— Select —</option>${classOptions.map(x=>`<option value="${escapeHtml(refValue(x))}" ${c.class?.name===x.name && c.class?.source===x.source?"selected":""}>${escapeHtml(x.name)}${x.source!==DATA_SOURCE?` · ${escapeHtml(sourceLabel(x.source))}`:""}</option>`).join("")}</select></label>
      <label class="field">Subclass<select data-builder="subclass" id="subclassSelect" disabled><option value="">${c.class ? "Loading…" : "Choose a class first"}</option></select></label>
    </div>${speciesChoiceMarkup ? `<div class="subhead">Species choices</div><div class="structured-choice-stack">${speciesChoiceMarkup}</div>` : ""}</section>

    <section class="card compact-gap"><div class="section-head"><div><div class="section-title">Ability scores</div><div class="mini">Base scores are stored separately. The final values include background increases and any manual bonuses.</div></div><div class="quick-actions"><button class="button button-small" data-action="apply-standard-array">Standard array</button><button class="button button-small" data-action="apply-point-buy">27-point reset</button><span class="status-pill">Point buy: ${pointBuyTotal} / 27</span></div></div><div class="ability-editor">${ABILITIES.map(a=>`<label class="ability-editor-cell"><span>${ABILITY_LABELS[a]}</span><input type="number" min="1" max="30" data-stat="${a}" value="${c.baseStats[a]}"><small>Final ${d.stats[a]}</small></label>`).join("")}</div></section>

    <div class="grid two compact-gap"><section class="card"><div class="section-head"><div><div class="section-title">Class feature choices</div><div class="mini">Choices such as Fighting Styles and Eldritch Invocations are stored as 5etools references and can contribute derived effects.</div></div></div>${optionalChoiceMarkup}<div class="subhead"><div class="section-title">General feats</div></div>${generalFeatMarkup}</section><section class="card"><div class="section-head"><div><div class="section-title">Weapon Mastery</div><div class="mini">Select the weapons you have mastered. Only currently proficient weapons with 5etools mastery data are shown.</div></div></div>${masteryMarkup}</section></div>
    <section class="card compact-gap"><div class="section-head"><div><div class="section-title">Background ability increases</div><div class="mini">2024 backgrounds can use either +2/+1 or +1/+1/+1 when the background offers that choice.</div></div></div>${bg ? `<div class="mini" style="margin-bottom:10px">${escapeHtml(bg.name)}: choose from ${escapeHtml((bgAbility.plus1From || []).map(x=>ABILITY_LABELS[x]).join(", ") || "the listed abilities")}.</div>${bgAbility.supportsThree ? `<label class="field">Increase pattern<select data-builder="bgMode"><option value="split" ${bgMode==="split"?"selected":""}>+2 / +1</option><option value="three" ${bgMode==="three"?"selected":""}>+1 / +1 / +1</option></select></label>` : ""}${bgMode === "three" && bgAbility.supportsThree ? `<div class="form-grid three"><label class="field">+1 ability<select data-builder="bgPlus1"><option value="">— Select —</option>${bgAbility.threeFrom.map(x=>`<option value="${x}" ${selectedAbility1===x?"selected":""}>${ABILITY_NAMES[x]}</option>`).join("")}</select></label><label class="field">+1 ability<select data-builder="bgPlus1b"><option value="">— Select —</option>${bgAbility.threeFrom.filter(x=>x!==selectedAbility1).map(x=>`<option value="${x}" ${selectedAbility1b===x?"selected":""}>${ABILITY_NAMES[x]}</option>`).join("")}</select></label><label class="field">+1 ability<select data-builder="bgPlus1c"><option value="">— Select —</option>${bgAbility.threeFrom.filter(x=>x!==selectedAbility1&&x!==selectedAbility1b).map(x=>`<option value="${x}" ${selectedAbility1c===x?"selected":""}>${ABILITY_NAMES[x]}</option>`).join("")}</select></label></div>` : `<div class="form-grid two"><label class="field">+2 ability<select data-builder="bgPlus2"><option value="">— Select —</option>${(bgAbility.plus2From || []).map(x=>`<option value="${x}" ${selectedAbility2===x?"selected":""}>${ABILITY_NAMES[x]}</option>`).join("")}</select></label><label class="field">+1 ability<select data-builder="bgPlus1"><option value="">— Select —</option>${(bgAbility.plus1From || []).filter(x=>x!==selectedAbility2).map(x=>`<option value="${x}" ${selectedAbility1===x?"selected":""}>${ABILITY_NAMES[x]}</option>`).join("")}</select></label></div>`}${autoBonusLines}` : `<div class="empty">Choose a 2024 background to see its ability-score options.</div>`}</section>

    <div class="grid two compact-gap"><section class="card"><div class="section-head"><div><div class="section-title">Languages</div><div class="mini">Every character starts with Common and chooses two additional languages from the 2024 PHB Standard Languages table. Rare languages are excluded here; class, species, background, and feats can add more separately.</div></div><span class="status-pill">${standardLanguageChoices.filter(Boolean).length} / 2 selected</span></div><div class="language-choice-grid"><div class="language-fixed"><strong>Common</strong><span>Always known</span></div><label class="field">Standard language 1<select data-builder="standardLanguage1" data-standard-language="0"><option value="">— Select —</option>${standardLanguageValues.map(v=>`<option value="${escapeHtml(v.name)}" ${standardLanguageChoices[0]===v.name?"selected":""}>${escapeHtml(v.name)}</option>`).join("")}</select></label><label class="field">Standard language 2<select data-builder="standardLanguage2" data-standard-language="1"><option value="">— Select —</option>${standardLanguageValues.filter(v=>v.name!==standardLanguageChoices[0]).map(v=>`<option value="${escapeHtml(v.name)}" ${standardLanguageChoices[1]===v.name?"selected":""}>${escapeHtml(v.name)}</option>`).join("")}</select></label></div></section><section class="card"><div class="section-head"><div class="section-title">Class skill choices</div><span class="status-pill">${classSkillChoices.size} / ${maxClassSkills || 0}</span></div>${classOptionsSkills.length ? `<div class="skill-grid">${classOptionsSkills.map(key=>{ const overlap=bgSkills.has(key); const checked=classSkillChoices.has(key); return `<label class="skill-check ${overlap?"skill-overlap":""}"><input type="checkbox" data-class-skill="${key}" ${checked?"checked":""} ${overlap&&!checked?"disabled":""}><span>${escapeHtml(SKILLS[key]?.[1] || canonicalLabel(key))}</span>${overlap?`<small class="choice-warning">${checked?"Also from background · choose another":"Already from background"}</small>`:""}</label>`; }).join("")}</div>` : `<div class="empty">Choose a class to load its skill choices from 5etools.</div>`}<div class="section-title subhead">Skill expertise</div><div class="skill-grid">${Object.entries(SKILLS).map(([key,[,name]])=>`<label class="skill-check"><input type="checkbox" data-expertise="${key}" ${c.expertise.includes(key)?"checked":""}>${escapeHtml(name)}</label>`).join("")}</div></section><section class="card"><div class="section-title">Background</div>${bg ? `<div class="detail-list"><div><strong>Skills</strong><span>${escapeHtml(grantedSkillsFromMap(bg.skillProficiencies).map(k=>SKILLS[k]?.[1]||canonicalLabel(k)).join(", ")||"None")} ${proficiencyOverlap.skills.length ? `<small class="choice-warning">Class overlap: ${escapeHtml(proficiencyOverlap.skills.map(k=>SKILLS[k]?.[1]||k).join(", "))}</small>` : ""}</span></div><div><strong>Origin feat</strong><span>${escapeHtml(bgFeatRefs.map(x=>x.name || x).join(", ")||"Choice")}</span></div><div><strong>Tools</strong><span>${escapeHtml(backgroundProficiencies.tools.join(", ")||"None")}</span></div><div><strong>Languages</strong><span>${escapeHtml(backgroundProficiencies.languages.join(", ")||"None")}</span></div></div>` : `<div class="empty">Choose a background.</div>`}</section></div>
${startingEquipmentMarkup}
    <section class="card compact-gap"><div class="section-title">Origin feat</div><div class="form-grid two"><label class="field">Feat<select data-builder="feat"><option value="">— Choose —</option>${availableOriginFeats.map(x=>`<option value="${escapeHtml(refValue(x))}" ${c.feat?.name===x.name&&c.feat?.source===x.source?"selected":""}>${escapeHtml(x.name)} · ${escapeHtml(x.source)}</option>`).join("")}</select></label><div>${d.featObj ? `<button class="feature feature-block" data-action="feat-detail" data-name="${encodeURIComponent(`${d.featObj.name}|${d.featObj.source}`)}"><strong>${escapeHtml(d.featObj.name)}</strong>${renderRichEntries((d.featObj.entries||[]).slice(0,2))}</button>` : `<div class="empty">Choose a feat to keep a rules reference on the character.</div>`}</div></div>${featChoiceMarkup}
    ${featChoiceMarkup ? `<div class="structured-choice-stack"><div class="subhead" style="margin-top:12px">Feat choices</div>${featChoiceMarkup}</div>` : ""}
    <div class="subhead" style="margin-top:12px">Additional feats</div><div class="mini" style="margin-bottom:6px">Additional feats are stored separately from the background's Origin Feat. Their structured choices and supported mechanical effects are included in the sheet.</div><div class="chips">${(c.additionalFeats||[]).map((feat,i)=>`<span class="editable-chip">${escapeHtml(feat.name)}<button data-action="remove-additional-feat" data-index="${i}" title="Remove feat">×</button></span>`).join("") || `<span class="mini">None added.</span>`}</div><div class="manual-add" style="margin-top:8px"><select id="additionalFeatPicker"><option value="">Choose a feat…</option>${feats.filter(f=>Number(f.prerequisite?.[0]?.level || 0) <= Number(c.level || 1)).map(f=>`<option value="${escapeHtml(refValue(f))}">${escapeHtml(f.name)} · ${escapeHtml(f.source)}</option>`).join("")}</select><button class="button button-small" data-action="add-additional-feat">Add feat</button></div></section>

    <div class="grid two compact-gap"><section class="card"><div class="section-title">Proficiencies & languages</div><div class="proficiency-summary"><div><strong>Armor</strong><span>${escapeHtml(d.proficiencies.armor.join(", ")||"None")}</span></div><div><strong>Weapons</strong><span>${escapeHtml(d.proficiencies.weapons.join(", ")||"None")}</span></div><div><strong>Tools</strong><span>${escapeHtml(d.proficiencies.tools.join(", ")||"None")}</span></div><div><strong>Languages</strong><span>${escapeHtml(d.proficiencies.languages.join(", ")||"None")}</span></div></div>${(proficiencyOverlap.skills.length||proficiencyOverlap.tools.length||proficiencyOverlap.languages.length) ? `<div class="proficiency-overlap"><strong>Duplicate proficiencies</strong><span>${proficiencyOverlap.skills.length?`Skills: ${escapeHtml(proficiencyOverlap.skills.map(k=>SKILLS[k]?.[1]||k).join(", "))}. `:""}${proficiencyOverlap.tools.length?`Tools: ${escapeHtml(proficiencyOverlap.tools.join(", "))}. `:""}${proficiencyOverlap.languages.length?`Languages: ${escapeHtml(proficiencyOverlap.languages.join(", "))}. `:""}These are granted by both class and background.</span></div>` : ""}</section><section class="card"><div class="section-title">Automatic proficiency choices</div><div class="mini">These selections fill 5etools choices such as any standard language or any artisan tool. They remain part of character state and are reflected on the sheet.</div>${proficiencyChoicesMarkup}</section></div>

    <div class="grid two compact-gap"><section class="card"><div class="section-title">Add manual proficiencies</div><div class="manual-add-grid"><div><div class="chips">${manualList("manualArmorProficiencies")}</div><div class="manual-add"><input data-manual-input="manualArmorProficiencies" placeholder="Armor proficiency"><button class="button button-small" data-action="add-manual" data-list="manualArmorProficiencies">Add</button></div></div><div><div class="chips">${manualList("manualWeaponProficiencies")}</div><div class="manual-add"><input data-manual-input="manualWeaponProficiencies" placeholder="Weapon proficiency"><button class="button button-small" data-action="add-manual" data-list="manualWeaponProficiencies">Add</button></div></div><div><div class="chips">${manualList("manualToolProficiencies")}</div><div class="manual-add"><input data-manual-input="manualToolProficiencies" placeholder="Tool proficiency"><button class="button button-small" data-action="add-manual" data-list="manualToolProficiencies">Add</button></div></div><div><div class="chips">${manualList("manualLanguages")}</div><div class="manual-add"><select id="languagePicker"><option value="">Choose a language</option>${officialEntries(state.data.languages, "language").sort((a,b)=>a.name.localeCompare(b.name)).map(x=>`<option value="${escapeHtml(refValue(x))}">${escapeHtml(x.name)}${x.source!==DATA_SOURCE?` · ${escapeHtml(sourceLabel(x.source))}`:""}</option>`).join("")}</select><button class="button button-small" data-action="add-language-choice">Add</button></div><div class="manual-add"><input data-manual-input="manualLanguages" placeholder="Other language"><button class="button button-small" data-action="add-manual" data-list="manualLanguages">Add</button></div></div></div></section></div>

    <div class="grid two compact-gap"><section class="card"><div class="section-head"><div><div class="section-title">Combat overrides</div><div class="mini">Leave these blank to use automatic 2024 calculations.</div></div><button class="button button-small" data-action="clear-combat-overrides">Clear overrides</button></div><div class="form-grid two"><label class="field">AC override<input type="number" min="0" max="60" data-builder="acOverride" value="${c.acOverride ?? ""}" placeholder="Automatic: ${d.ac}"></label><label class="field">Speed override<input type="number" min="0" max="200" data-builder="speedOverride" value="${c.speedOverride ?? ""}" placeholder="Automatic"></label><label class="field">Max HP override<input type="number" min="1" max="1000" data-builder="hpMaxOverride" value="${c.hpMaxOverride ?? ""}" placeholder="Automatic: ${d.maxHp}"><small class="field-help">Automatic maximum: ${d.maxHp}</small></label><label class="field">Current HP<input type="number" min="0" max="1000" data-builder="hpCurrent" value="${c.hpAuto ? "" : (c.hpCurrent ?? "")}" placeholder="${c.hpAuto ? `Automatic (${c.hpCurrent ?? 0})` : "Manual"}"></label><label class="field">Temporary HP<input type="number" min="0" max="1000" data-builder="tempHp" value="${c.tempHp}"></label><label class="field full">Additional senses<input type="text" data-builder="senses" value="${escapeHtml((c.senses || []).join(", "))}" placeholder="e.g. Tremorsense 10 ft."></label></div></section><section class="card"><div class="section-title">Notes</div><p class="mini">The full character sheet follows the official 2024 two-page organization; this builder is for setup and corrections.</p><textarea data-builder="notes" rows="7">${escapeHtml(c.notes)}</textarea></section></div>
  `;
  bindEvents();
  populateSubclasses(c.class?.name, c.subclass?.name);
}

function getSubclassUnlockLevel(classObj) {
  const refs = Array.isArray(classObj?.classFeatures) ? classObj.classFeatures.map(parseFeatureRef).filter(Boolean) : [];
  const levels = refs.filter(r => /subclass|subclassfeature|gainSubclassFeature/i.test(`${r.name} ${JSON.stringify(r)}`)).map(r => Number(r.level)).filter(Number.isFinite);
  return levels.length ? Math.min(...levels) : 3;
}

async function populateSubclasses(className, currentName) {
  const select = document.querySelector("#subclassSelect");
  if (!select) return;
  if (!className) { select.innerHTML = `<option value="">Choose a class first</option>`; select.disabled = true; return; }
  try {
    const file = await getClassDetails(className);
    const classObj = getClassFromFile(file, className, state.character.class?.source || null);
    const unlock = getSubclassUnlockLevel(classObj);
    const options = getSubclassOptions(file, className);
    const currentSource = state.character.subclass?.source;
    const unlocked = Number(state.character.level || 1) >= unlock;
    select.disabled = !unlocked;
    select.innerHTML = `<option value="">${unlocked ? "— Select —" : `Available at level ${unlock}`}</option>${options.map(s=>`<option value="${escapeHtml(normalizeRefId(s.name,s.source))}" ${currentName===s.name && (!currentSource||currentSource===s.source)?"selected":""}>${escapeHtml(s.name)}${s.source!==DATA_SOURCE?` · ${escapeHtml(sourceLabel(s.source))}`:""}</option>`).join("")}`;
    if (!unlocked && state.character.subclass) { state.character.subclass = null; saveCharacter(); }
  } catch (e) { select.disabled = true; select.innerHTML = `<option value="">Unable to load subclasses</option>`; }
}

function normalizeRefName(value) { return String(value || "").split("|")[0].trim().toLowerCase(); }
function spellClassRefs(spell) {
  const refs = [];
  const classes = spell?.classes || {};
  for (const key of ["fromClassList", "fromClassListVariant", "fromSubclass"]) {
    for (const value of classes[key] || []) {
      if (typeof value === "string") refs.push(value);
      else if (value && typeof value === "object") {
        for (const nested of [value.name, value.className, value.subclass, value.subclassName]) if (nested) refs.push(String(nested));
      }
    }
  }
  for (const value of spell?.class || []) refs.push(typeof value === "string" ? value : value?.name);
  return refs.filter(Boolean);
}
function spellAvailableToCharacter(spell, d = state.lastDerived) {
  if (!spell) return false;
  const refs = spellClassRefs(spell).map(normalizeRefName);
  const className = normalizeRefName(d?.classObj?.name);
  if (!className) return true;
  if (!refs.length) return true;
  if (refs.some(ref => ref === className)) return true;
  const subclassName = normalizeRefName(d?.subclassObj?.name);
  return Boolean(subclassName && refs.some(ref => ref === subclassName || ref.includes(subclassName) || subclassName.includes(ref)));
}

async function renderSpellbook(app) {
  if (!state.data.spellFiles.has(String(DATA_SOURCE).toLowerCase())) await loadSpellSource(state.version, DATA_SOURCE);
  await hydrateSpellData(state.version, true);
  const c = state.character;
  await deriveCharacter();
  let spells = Array.isArray(state.data.spells?.spell) ? officialEntries(state.data.spells, "spell").sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name)) : [];
  if (!spells.length) { await loadSpellSource(state.version, DATA_SOURCE); mergeOfficialSpells(); spells = officialEntries(state.data.spells, "spell").sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name)); }
  const maxPrepared = state.lastDerived?.maxPrepared ?? null;
  const maxCantrips = state.lastDerived?.cantrips ?? null;
  const tab = state.spellPickerTab;
  const collection = tab === "prepared" ? c.preparedSpells : tab === "cantrips" ? c.cantrips : tab === "spellbook" ? c.spellbook : c.knownSpells;
  const collectionIds = new Set(collection.map(x=>String(x).toLowerCase()));
  const className = c.class?.name || "";
  const knownLimit = state.lastDerived?.knownSpells ?? null;
  // This is a spell library, not a cast-at-this-moment filter. Selection limits are enforced separately.
  const available = spells.filter(s => spellAvailableToCharacter(s, state.lastDerived)).slice(0, 2000);

  app.innerHTML = `${pageHeader("SPELLBOOK", `${escapeHtml(c.name || "Character")} · Spells`, `${escapeHtml(className || "No class")} · 2024 official spell data`, `<button class="button" data-action="sheet">Character</button>`)}
    <section class="card"><div class="tabbar"><button class="tab-inner ${tab==="prepared"?"active":""}" data-spell-tab="prepared">Prepared ${maxPrepared!=null?`(${c.preparedSpells.length}/${maxPrepared})`:""}</button><button class="tab-inner ${tab==="cantrips"?"active":""}" data-spell-tab="cantrips">Cantrips ${maxCantrips!=null?`(${c.cantrips.length}/${maxCantrips})`:""}</button><button class="tab-inner ${tab==="spellbook"?"active":""}" data-spell-tab="spellbook">Spellbook ${c.spellbook.length}</button><button class="tab-inner ${tab==="known"?"active":""}" data-spell-tab="known">Known ${knownLimit!=null?`(${c.knownSpells.length}/${knownLimit})`:""}</button></div><div class="spell-toolbar"><input id="spellSearch" type="search" placeholder="Search 2024 spells…"><select id="spellLevel"><option value="all">All levels</option>${Array.from({length:10},(_,i)=>`<option value="${i}">${i===0?"Cantrip":`Level ${i}`}</option>`).join("")}</select></div><div id="spellResults" class="spell-results"></div></section>`;
  bindEvents();
  renderSpellResults(available);
}

function renderSpellResults(allSpells) {
  const root = document.querySelector("#spellResults");
  if (!root) return;
  const q = (document.querySelector("#spellSearch")?.value || "").trim().toLowerCase();
  const level = document.querySelector("#spellLevel")?.value || "all";
  const tab = state.spellPickerTab;
  const tabFilter = tab === "cantrips" ? s => s.level === 0 : s => s.level > 0;
  const list = allSpells.filter(s => tabFilter(s) && (!q || s.name.toLowerCase().includes(q)) && (level === "all" || String(s.level) === level)).slice(0, 300);
  const c = state.character;
  const collection = state.spellPickerTab === "prepared" ? c.preparedSpells : state.spellPickerTab === "cantrips" ? c.cantrips : state.spellPickerTab === "spellbook" ? c.spellbook : c.knownSpells;
  const set = new Set(collection.map(x=>String(x).toLowerCase()));
  root.innerHTML = list.map(s => {
    const id = `${s.name}|${s.source}`;
    const checked = set.has(id.toLowerCase());
    return `<div class="spell-row"><label class="spell-select"><input type="checkbox" data-spell-toggle="${escapeHtml(id)}" ${checked?"checked":""}> <span class="spell-title">${renderReferenceTag("spell", `${s.name}|${s.source}|${s.name}`)}</span></label><span class="spell-meta">${s.level===0?"Cantrip":`Lv ${s.level}`} · ${escapeHtml(spellSchoolName(s.school))}</span></div>`;
  }).join("") || `<div class="empty">No matching spells.</div>`;
}

function spellById(id) {
  const [name, source] = String(id || "").split("|");
  return getLoadedSpells().find(s => s.name?.toLowerCase() === String(name || "").toLowerCase() && (!source || s.source?.toLowerCase() === source.toLowerCase())) || null;
}

function searchEditDistance(a, b) {
  const x = String(a || "").toLowerCase();
  const y = String(b || "").toLowerCase();
  if (x === y) return 0;
  if (!x) return y.length;
  if (!y) return x.length;
  const row = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= y.length; j++) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (x[i - 1] === y[j - 1] ? 0 : 1));
      prev = saved;
    }
  }
  return row[y.length];
}

function matchesSearchText(value, query) {
  const text = String(value || "").trim().toLowerCase();
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  if (text.includes(q)) return true;
  // Be forgiving of the common plural form and small touch-keyboard typos.
  const singular = q.endsWith("s") && q.length > 3 ? q.slice(0, -1) : q;
  if (singular !== q && text.includes(singular)) return true;
  if (q.length >= 5) {
    const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.some(token => token.length >= 5 && Math.abs(token.length - q.length) <= 2 && searchEditDistance(token, q) <= 2)) return true;
  }
  return false;
}

async function renderEquipment(app) {
  try { await getItemsData(); officialItemCatalog(); } catch (e) {
    console.error("Equipment catalog hydration failed", e);
    app.innerHTML = `${pageHeader("EQUIPMENT", `${escapeHtml(state.character.name || "Character")} · Equipment`, "The 2024 equipment catalog could not be prepared.", `<button class="button" data-action="sheet">Character</button>`)}<section class="card empty-state"><div class="empty-icon">!</div><h2>Equipment data unavailable</h2><p>${escapeHtml(e?.message || String(e))}</p><button class="button button-primary" data-action="sync">Repair rules data</button></section>`;
    bindEvents();
    return;
  }
  const items = state.character.inventory || [];
  app.innerHTML = `${pageHeader("EQUIPMENT", `${escapeHtml(state.character.name || "Character")} · Equipment`, "Items are resolved against the cached 2024 5etools equipment catalog.", `<button class="button" data-action="sheet">Character</button><button class="button button-primary" data-action="item-picker">Add item</button>`)}
  <section class="card"><div class="equipment-total-value">Total currency value: <strong>${formatCurrencyValue(currencyToCp(state.character.currency))}</strong></div><div class="equipment-state-legend"><strong>Equipped</strong> = worn or otherwise active for equipment effects and Armor Class. <strong>Wielding</strong> = a weapon is currently held and counts for attacks and weapon-dependent effects. Wielding a weapon automatically equips it; a weapon can stay equipped without being wielded.</div><div class="currency-grid">${["pp","gp","ep","sp","cp"].map(k=>`<label class="field"><span>${k.toUpperCase()}</span><input type="number" data-currency="${k}" min="0" step="1" value="${Number(state.character.currency?.[k] || 0)}"></label>`).join("")}</div>
  <div class="picker-toolbar equipment-page-toolbar"><input id="equipmentSearch" type="search" placeholder="Filter inventory…"><select id="equipmentCategory"><option value="all">All equipment</option><option value="weapon">Weapons</option><option value="armor">Armor</option><option value="shield">Shields</option><option value="tool">Tools</option><option value="gear">Adventuring gear</option><option value="magic">Magic items</option></select><label class="picker-check"><input id="equipmentEquipped" type="checkbox"> Equipped only</label></div>
  <div id="equipmentRows" class="equipment-list"></div></section>`;
  const categoryOf = it => {
    const found = findOfficialItemByName(it.name, it.source) || findOfficialItemByName(it.name);
    const x = found || it; const t = String(x.type || "").toUpperCase();
    if (x.weaponCategory) return "weapon";
    if (x.ac != null || /^(LA|MA|HA|S)$/.test(t.split("|")[0])) return t.startsWith("S") ? "shield" : "armor";
    if (t.startsWith("AT") || t.startsWith("GS") || t.startsWith("INS") || t.startsWith("T")) return "tool";
    if (x.rarity && String(x.rarity).toLowerCase() !== "none") return "magic";
    return "gear";
  };
  const rerender = () => {
    const q = (document.querySelector("#equipmentSearch")?.value || "").trim().toLowerCase();
    const cat = document.querySelector("#equipmentCategory")?.value || "all";
    const equippedOnly = Boolean(document.querySelector("#equipmentEquipped")?.checked);
    const list = items.map((it,index)=>({it,index})).filter(({it}) => {
      const label = String(it.displayName || it.name || "");
      return matchesSearchText(label, q) && (cat === "all" || categoryOf(it) === cat) && (!equippedOnly || it.equipped);
    });
    const root = document.querySelector("#equipmentRows"); if (!root) return;
    root.innerHTML = list.length ? list.map(({it,index})=>{
      const found = findOfficialItemByName(it.name,it.source) || findOfficialItemByName(it.name);
      const isWeapon = Boolean(found?.weaponCategory);
      const label = found?.name || it.displayName || it.name;
      return `<div class="equipment-row"><div>${found ? renderReferenceTag("item", `${found.name}|${found.source}|${found.name}`) : `<span>${escapeHtml(label)}</span>`}<div class="mini">${escapeHtml(found?.source || it.source || DATA_SOURCE)}${it.quantity>1?` · ×${it.quantity}`:""}${it.equipped?" · Equipped":""}${isWeapon && it.wielding!==false?" · Wielding":""}</div></div><div class="quick-actions"><button class="button button-small ${it.equipped?"button-primary":""}" data-action="toggle-equipped" data-index="${index}">${it.equipped?"Equipped":"Equip"}</button>${isWeapon?`<button class="button button-small ${it.wielding!==false?"button-primary":""}" data-action="toggle-wielding" data-index="${index}">${it.wielding!==false?"Wielding":"Wield"}</button>`:""}<button class="button button-small" data-action="item-info" data-index="${index}">Details</button><button class="button button-small" data-action="qty-minus" data-index="${index}">−</button><button class="button button-small" data-action="qty-plus" data-index="${index}">+</button><button class="button button-small button-danger" data-action="remove-item" data-index="${index}">Remove</button></div></div>`;
    }).join("") : `<div class="empty">No equipment matches the current filters.</div>`;
    bindEvents();
  };
  bindEvents();
  document.querySelector("#equipmentSearch").oninput = rerender;
  document.querySelector("#equipmentCategory").onchange = rerender;
  document.querySelector("#equipmentEquipped").onchange = rerender;
  rerender();
}

async function renderDataView(app) {
  const counts = {
    classes: Object.keys(state.data.classIndex || {}).length,
    species: officialEntries(state.data.races, "race").length,
    backgrounds: officialEntries(state.data.backgrounds, "background").length,
    feats: officialEntries(state.data.feats, "feat").length,
    spells: officialEntries(state.data.spells, "spell").length,
    languages: officialEntries(state.data.languages, "language").length,
    items: state.data.items ? officialEntries(state.data.items, "item").length : null,
    conditions: officialEntries(state.data.conditionsdiseases, "status").length + officialEntries(state.data.conditionsdiseases, "condition").length,
    rules: officialEntries(state.data.variantrules, "variantrule").length,
  };
  const chars = await getCharacters();
  app.innerHTML = `${pageHeader("DATA & APP", "5etools synchronization", `App ${APP_VERSION} · all detected 2024 official player-facing sources are included.`, `<button class="button button-primary" data-action="sync">Check for updates</button>`)}
    <section class="card"><div class="data-row"><div><strong>Rules data</strong><span>Versioned 5etools release cached locally on this tablet</span></div><strong>${escapeHtml(state.version || "Not synced")}</strong></div><div class="data-row"><div><strong>Detected official 2024-era sources</strong><span>Discovered from 5etools source metadata and 2024 entity markers</span></div><strong>${state.data.sourceMeta?.length || 0}</strong></div><div class="data-row"><div><strong>Last successful sync</strong><span>Stored locally</span></div><strong>${state.lastSync ? escapeHtml(new Date(state.lastSync).toLocaleString()) : "—"}</strong></div><div class="data-row"><div><strong>Connectivity</strong><span>Internet is only needed to check/download newer rules data</span></div><strong>${state.online ? "Online" : "Offline"}</strong></div></section>
    <section class="card compact-gap"><div class="section-title">Detected 2024-era official sources</div><div class="source-chip-grid">${(state.data.sourceMeta || []).map(x=>`<div class="source-chip"><strong>${escapeHtml(x.name)}</strong><span>${escapeHtml(x.source)}${x.published?` · ${escapeHtml(x.published)}`:""}</span></div>`).join("")}</div></section>
    <div class="grid three compact-gap">${Object.entries(counts).map(([k,v])=>metric(k, v == null ? "Not loaded" : v)).join("")}</div>
    <section class="card compact-gap"><div class="section-head"><div><div class="section-title">Characters on this device</div><div class="mini">Character state is independent of 5etools rules data.</div></div><button class="button button-small button-primary" data-action="new-character">New character</button></div><div class="character-list">${chars.map(ch=>`<div class="character-row ${ch.id===state.character.id?"current":""}"><button class="character-select" data-action="switch-character" data-id="${ch.id}"><strong>${escapeHtml(ch.name)}</strong><span>${escapeHtml([ch.species?.name,ch.class?.name,ch.subclass?.name,`Level ${ch.level}`].filter(Boolean).join(" · "))}</span></button>${ch.id!==state.character.id?`<button class="icon-button" data-action="delete-character" data-id="${ch.id}">×</button>`:""}</div>`).join("")}</div></section>
    <section class="card compact-gap"><div class="section-title">Storage model</div><p class="note">The app caches the complete versioned 5etools JSON library on the device in staged batches, stores character state separately, and can continue running without a network connection after synchronization. A rules-data update does not replace your character.</p><p class="mini">Data source: ${escapeHtml(REPO)} · 2024 sources detected automatically</p></section>`;
  bindEvents();
}
function csv(value){return value||"";}


async function openRuleReference(ref) {
  let info = ref;
  try { if (typeof ref === "string") info = JSON.parse(decodeURIComponent(ref)); } catch {}
  const entity = await findReferenceEntity(info.tag, info.name, info.source || null);
  const title = entity?.name || info.label || info.name || "Reference";
  if (!entity) {
    openModal(title, `<div class="modal-kicker">${escapeHtml(info.tag || "Reference")}</div><p class="empty">No matching 5etools entry was found in the cached rules data.</p>`);
    return;
  }
  if (entity.type === "skill") {
    const pair = Object.values(SKILLS).find(([, label]) => label.toLowerCase() === String(entity.name).toLowerCase());
    openModal(title, `<div class="modal-kicker">2024 Skill</div><p>${escapeHtml(title)} is a ${escapeHtml(ABILITY_NAMES[pair?.[0]] || "ability")} skill.</p>`);
    return;
  }
  const kicker = [sourceLabel(entity.source), entity.level != null && Number.isFinite(Number(entity.level)) && Number(entity.level) > 0 ? `Level ${entity.level}` : ""].filter(Boolean).join(" · ");
  let body = `<div class="modal-kicker">${escapeHtml(kicker || info.tag || "Reference")}</div>`;
  if (entity.entries) body += `<div class="rules-text formatted-rules">${renderRichEntries(entity.entries)}</div>`;
  else if (entity.entry) body += `<div class="rules-text formatted-rules">${renderRichEntries(entity.entry)}</div>`;
  else body += `<pre class="reference-json">${escapeHtml(JSON.stringify(entity, null, 2))}</pre>`;
  openModal(title, body);
}

async function showRuleReferenceTooltip(el) {
  if (window.matchMedia?.("(pointer: coarse)").matches) return;
  const tip = document.querySelector("#referenceTooltip");
  if (!tip) return;
  let info;
  try { info = JSON.parse(decodeURIComponent(el.dataset.ref || "")); } catch { return; }
  const entity = await findReferenceEntity(info.tag, info.name, info.source || null);
  const title = entity?.name || info.label || info.name || "Reference";
  const content = entity?.entries ? renderRichEntries((Array.isArray(entity.entries) ? entity.entries : [entity.entries]).slice(0, 2)) : `<p>No cached rules text.</p>`;
  tip.innerHTML = `<strong>${escapeHtml(title)}</strong>${content}`;
  tip.hidden = false;
  const rect = el.getBoundingClientRect();
  const width = Math.min(340, window.innerWidth - 24);
  tip.style.width = `${width}px`;
  let left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
  let top = rect.bottom + 8;
  if (top + tip.offsetHeight > window.innerHeight - 12) top = Math.max(12, rect.top - tip.offsetHeight - 8);
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}
function hideRuleReferenceTooltip() { const tip = document.querySelector("#referenceTooltip"); if (tip) tip.hidden = true; }
function bindRuleReferenceLinks(root = document) {
  root.querySelectorAll?.(".rules-ref-link")?.forEach(el => {
    if (el.dataset.refBound) return;
    el.dataset.refBound = "1";
    el.addEventListener("click", async e => { e.preventDefault(); hideRuleReferenceTooltip(); await openRuleReference(el.dataset.ref || ""); });
    el.addEventListener("pointerenter", () => showRuleReferenceTooltip(el));
    el.addEventListener("pointerleave", hideRuleReferenceTooltip);
    el.addEventListener("focus", () => showRuleReferenceTooltip(el));
    el.addEventListener("blur", hideRuleReferenceTooltip);
  });
}
function bindConditionTooltips(root = document) {
  root.querySelectorAll?.(".rules-condition-hover")?.forEach(el => {
    if (el.dataset.conditionRefBound) return;
    el.dataset.conditionRefBound = "1";
    if (!window.matchMedia?.("(pointer: coarse)").matches) {
      el.addEventListener("pointerenter", () => showRuleReferenceTooltip(el));
      el.addEventListener("pointerleave", hideRuleReferenceTooltip);
      el.addEventListener("focus", () => showRuleReferenceTooltip(el));
      el.addEventListener("blur", hideRuleReferenceTooltip);
    }
    let timer = null;
    const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
    el.addEventListener("pointerdown", () => {
      if (!window.matchMedia?.("(pointer: coarse)").matches) return;
      cancel();
      timer = setTimeout(async () => {
        timer = null;
        el.dataset.suppressClick = "1";
        await openRuleReference(el.dataset.ref || "");
      }, 650);
    });
    el.addEventListener("pointerup", cancel);
    el.addEventListener("pointercancel", cancel);
    el.addEventListener("pointerleave", cancel);
  });
}


function bindEvents() {
  bindRuleReferenceLinks(document);
  bindConditionTooltips(document);
  document.querySelectorAll("[data-action]").forEach(el => {
    el.onclick = async () => {
      const action = el.dataset.action;
      try {
        if (action === "sync") return syncData(true);
        if (action === "builder") { state.view = "builder"; return render(); }
        if (action === "sheet") { state.view = "sheet"; return render(); }
        if (action === "sheet-page") { state.sheetPage = Number(el.dataset.page || 1); return render(); }
        if (action === "spells") { state.view = "spells"; state.spellPickerTab = "prepared"; return render(); }
        if (action === "spells-tab") { state.view = "spells"; state.spellPickerTab = el.dataset.spellTab || "prepared"; return render(); }
        if (action === "equipment") { state.view = "equipment"; return render(); }
        if (action === "character-menu") return openCharacterMenu();
        if (action === "save-builder") { await readBuilder(); await saveCharacter(); await deriveCharacter(); state.view = "sheet"; showToast("Character saved."); return render(); }
        if (action === "optional-feature-detail") { const ref = splitRefId(decodeURIComponent(el.dataset.name || "")); const obj = findOfficial(state.data.optionalfeatures, "optionalfeature", ref.name, ref.source || null); if (obj) return openModal(obj.name, `<div class="modal-kicker">${escapeHtml(sourceLabel(obj.source))}</div><div class="rules-text formatted-rules">${renderRichEntries(obj.entries)}</div>`); }
        if (action === "apply-starting-equipment") { await readBuilder(); const kind = el.dataset.kind; const group = el.dataset.group || "1"; const option = el.dataset.option; const obj = kind === "class" ? state.lastDerived?.classObj : state.lastDerived?.backgroundObj; if (obj) await applyStartingEquipment(kind, group, option, obj); return render(); }
        if (action === "export") return exportCharacter();
        if (action === "import") return openImport();
        if (action === "clear-ac-override") { state.character.acOverride = null; await saveCharacter(); return render(); }
        if (action === "clear-hp-override") { state.character.hpMaxOverride = null; state.character.hpAuto = true; state.character.hpCurrent = null; await saveCharacter(); return render(); }
        if (action === "hp") {
          const d = await deriveCharacter();
          const mode = el.dataset.mode || "set";
          const before = Number(state.character.hpCurrent || 0);
          if (mode === "damage") {
            applyDamage(Number(el.dataset.amount || 0), d.maxHp);
          } else if (mode === "heal") {
            applyHealing(Number(el.dataset.amount || 0), d.maxHp);
          } else {
            const raw = prompt("Current hit points", String(before));
            if (raw === null) return;
            const next = clamp(Number(raw || 0), 0, d.maxHp);
            state.character.hpCurrent = next;
            state.character.hpAuto = false;
            if (next > 0) resetDeathSaves();
          }
          await saveCharacter(); return render();
        }
        if (action === "damage") { const d = await deriveCharacter(); const amount = Number(prompt("Damage taken", "1") || 0); if (amount > 0) { applyDamage(amount, d.maxHp); await saveCharacter(); return render(); } return; }
        if (action === "heal") { const d = await deriveCharacter(); const amount = Number(prompt("Hit Points regained", "1") || 0); if (amount > 0) { applyHealing(amount, d.maxHp); await saveCharacter(); return render(); } return; }
        if (action === "temp-hp") { const value = prompt("Temporary hit points", String(state.character.tempHp || 0)); if (value !== null) { state.character.tempHp = Math.max(0, Number(value || 0)); await saveCharacter(); return render(); } return; }
        if (action === "heroic") { state.character.heroicInspiration = !state.character.heroicInspiration; await saveCharacter(); return render(); }
        if (action === "concentration") { const value = prompt("Concentration spell (leave blank to clear)", state.character.concentration || ""); if (value !== null) { state.character.concentration = value.trim() || null; await saveCharacter(); return render(); } return; }
        if (action === "exhaustion") { state.character.exhaustion = clamp(Number(state.character.exhaustion || 0) + Number(el.dataset.delta || 0), 0, 6); await saveCharacter(); return render(); }
        if (action === "hitdie") { const idx = Number(el.dataset.index); state.character.hitDiceUsed = idx < state.character.hitDiceUsed ? idx : Math.min(state.character.level, idx + 1); await saveCharacter(); return render(); }
        if (action === "slot") { const level = Number(el.dataset.level); const cap = Number(state.lastDerived?.spellSlots?.[level - 1] || 0); const current = countSlotUsed(state.character, level); const idx = Number(el.dataset.index); setSlotUsed(state.character, level, idx < current ? idx : Math.min(cap, idx + 1)); await saveCharacter(); return render(); }
        if (action === "death") {
          if (Number(state.lastDerived?.currentHp ?? state.character.hpCurrent ?? 0) > 0) { showToast("Death saves can only be tracked at 0 HP."); return; }
          const type = el.dataset.type; state.character.deathSaves[type] = Math.min(3, Number(state.character.deathSaves[type] || 0) + 1); await saveCharacter(); return render();
        }
        if (action === "death-reset") { state.character.deathSaves = { success: 0, failure: 0 }; await saveCharacter(); return render(); }
        if (action === "condition") { if (el.dataset.suppressClick) { delete el.dataset.suppressClick; return; } const condition = el.dataset.condition; if (condition === "Exhaustion") { if (Number(state.character.exhaustion || 0) > 0) state.character.exhaustion = 0; else state.character.exhaustion = 1; } else toggleArray(state.character.conditions, condition); await saveCharacter(); return render(); }
        if (action === "clear-conditions") { state.character.conditions = []; state.character.exhaustion = 0; await saveCharacter(); return render(); }
        if (action === "attack-details") {
          try {
            const payload = JSON.parse(decodeURIComponent(el.dataset.notePayload || ""));
            return renderAttackNoteDialog(payload);
          } catch {
            const note = el.dataset.note || "";
            if (note) return openModal(el.dataset.noteTitle || "Notes", `<div class="rules-text formatted-rules"><p>${renderNoteText(note)}</p></div>`);
          }
        }
        if (action === "feature") { const f = findFeatureByButton(el); if (f) return openFeatureModal(f); }
        if (action === "feat-detail") { const ref = splitRefId(decodeURIComponent(el.dataset.name || "")); const feat = findFeat(ref.name, ref.source || null); if (feat) return openFeatModal(feat); }
        if (action === "species-detail") { if (state.lastDerived?.speciesObj) return openModal(state.lastDerived.speciesObj.name, `<div class="modal-kicker">${escapeHtml(sourceLabel(state.lastDerived.speciesObj.source))}</div><div class="rules-text formatted-rules">${renderRichEntries(state.lastDerived.speciesObj.entries)}</div>`); }
        if (action === "spell" || action === "spell-info") { const ref = splitRefId(decodeURIComponent(el.dataset.spell || "")); const s = await getSpellById(normalizeRefId(ref.name, ref.source || DATA_SOURCE)); if (s) return openSpellModal(s); showToast("Spell data is not available yet."); }
        if (action === "item-picker") return openItemPicker();
        if (action === "item-info") return openInventoryItemInfo(Number(el.dataset.index));
        if (action === "toggle-equipped") {
          const i = Number(el.dataset.index); const item = state.character.inventory[i]; if (!item) return;
          const official = findOfficialItemByName(item.name,item.source) || findOfficialItemByName(item.name);
          if (!official) { showToast(`Could not resolve ${item.name} from the cached equipment data.`); return; }
          item.name = official.name; item.source = official.source; item.displayName = official.name; item.unresolved = false;
          const isWeapon = Boolean(official.weaponCategory);
          item.equipped = !item.equipped;
          if (!item.equipped) item.wielding = false;
          else if (isWeapon) item.wielding = true;
          await saveCharacter(); return render();
        }
        if (action === "toggle-wielding") {
          const i = Number(el.dataset.index); const item = state.character.inventory[i]; if (!item) return;
          const official = findOfficialItemByName(item.name,item.source) || findOfficialItemByName(item.name);
          if (!official?.weaponCategory) { showToast(`Could not resolve ${item.name} as a weapon.`); return; }
          item.name = official.name; item.source = official.source; item.displayName = official.name; item.unresolved = false;
          item.wielding = item.wielding === false; if (item.wielding) item.equipped = true;
          await saveCharacter(); return render();
        }
        if (action === "remove-item") { state.character.inventory.splice(Number(el.dataset.index),1); await saveCharacter(); return render(); }
        if (action === "qty-minus") { adjustItemQty(Number(el.dataset.index), -1); return; }
        if (action === "qty-plus") { adjustItemQty(Number(el.dataset.index), 1); return; }
        if (action === "add-resource") { state.character.resources.push({ name: "Resource", current: 0, max: 1, recharge: "", mode: "manual" }); await saveCharacter(); return render(); }
        if (action === "remove-resource") { state.character.resources.splice(Number(el.dataset.index),1); await saveCharacter(); return render(); }
        if (action === "manage-resources") return openResourceManager();
        if (action === "manage-attacks") return openAttackManager();
        if (action === "remove-attack") { state.character.attacks.splice(Number(el.dataset.index),1); await saveCharacter(); return render(); }
        if (action === "species-trait") { const trait = (state.lastDerived?.speciesObj?.entries || []).find(x => x?.name === decodeURIComponent(el.dataset.name || "")); if (trait) return openModal(trait.name, `<div class="rules-text formatted-rules">${renderRichEntries(trait.entries)}</div>`); }
        if (action === "resource-pip") { const i = Number(el.dataset.resource); const resource = state.character.resources[i]; if (!resource) return; const pip=Number(el.dataset.index)+1; const max=Number(resource.max||0); const current=clamp(Number(resource.current ?? max),0,max); const spent=max-current; resource.current = pip <= spent ? Math.min(max, max - Math.max(0,pip-1)) : Math.max(0, max - pip); await saveCharacter(); return render(); }
        if (action === "rest-short") return shortRest();
        if (action === "rest-long") return longRest();
        if (action === "new-character") { await createCharacter(); state.view = "builder"; return render(); }
        if (action === "switch-character") { await switchCharacter(el.dataset.id); return; }
        if (action === "delete-character") { if (confirm("Delete this character from this device?")) await deleteCharacter(el.dataset.id); return; }
        if (action === "apply-standard-array") { applyStandardArray(); return; }
        if (action === "apply-point-buy") { applyPointBuyDefault(); return; }
        if (action === "clear-combat-overrides") { state.character.acOverride = null; state.character.speedOverride = null; state.character.hpMaxOverride = null; state.character.hpAuto = true; state.character.hpCurrent = null; await saveCharacter(); return render(); }
        if (action === "add-manual") { const list = el.dataset.list; const input = document.querySelector(`[data-manual-input="${list}"]`); const value = input?.value.trim(); if (value) { if (!Array.isArray(state.character[list])) state.character[list]=[]; if (!state.character[list].some(x=>x.toLowerCase()===value.toLowerCase())) state.character[list].push(value); input.value=""; await saveCharacter(); return render(); } return; }
        if (action === "add-language-choice") { const select=document.querySelector("#languagePicker"); const ref=splitRefId(select?.value||""); const lang=findLanguage(ref.name, ref.source||null); if(lang){ if(!state.character.languageChoices.some(x=>x.toLowerCase()===lang.name.toLowerCase())) state.character.languageChoices.push(lang.name); await saveCharacter(); return render(); } return; }
        if (action === "add-additional-feat") { const select=document.querySelector("#additionalFeatPicker"); const ref=splitRefId(select?.value||""); const feat=findFeat(ref.name, ref.source||null); if(feat){ const exists=(state.character.additionalFeats||[]).some(x=>x.name===feat.name&&x.source===feat.source); if(!exists){ state.character.additionalFeats.push({name:feat.name,source:feat.source}); state.character.feats=[...(state.character.feat?[state.character.feat]:[]),...state.character.additionalFeats]; await saveCharacter(); return render(); } } return; }
        if (action === "remove-additional-feat") { const idx=Number(el.dataset.index); state.character.additionalFeats.splice(idx,1); state.character.feats=[...(state.character.feat?[state.character.feat]:[]),...state.character.additionalFeats]; await saveCharacter(); return render(); }
        if (action === "remove-manual") { const list=el.dataset.list; const idx=Number(el.dataset.index); if (Array.isArray(state.character[list])) state.character[list].splice(idx,1); await saveCharacter(); return render(); }
      } catch (err) {
        console.error(err); showToast(`Action failed: ${err.message}`);
      }
    };
  });

  document.querySelectorAll("[data-field=notes]").forEach(el => el.oninput = debounce(async () => { state.character.notes = el.value; await saveCharacter(); }, 250));
  document.querySelectorAll("[data-builder]").forEach(el => {
    el.onchange = async () => {
      const key = el.dataset.builder;
      await readBuilder();
      if (["background","bgMode","bgPlus2","bgPlus1","bgPlus1b","bgPlus1c","species","class","subclass","feat","level","xp"].includes(key)) render();
    };
  });
  document.querySelectorAll("[data-optional-feature]").forEach(el => el.onchange = async () => {
    const key = el.dataset.optionalFeature;
    if (!state.character.optionalFeatureChoices) state.character.optionalFeatureChoices = {};
    if (!el.value) delete state.character.optionalFeatureChoices[key];
    else { const ref = splitRefId(el.value); state.character.optionalFeatureChoices[key] = { name: ref.name, source: ref.source || DATA_SOURCE }; }
    await saveCharacter(); render();
  });
  document.querySelectorAll("[data-progression-feat]").forEach(el => el.onchange = async () => {
    if (!state.character.progressionFeats) state.character.progressionFeats = {};
    const key = el.dataset.progressionFeat;
    if (!el.value) delete state.character.progressionFeats[key];
    else { const ref = splitRefId(el.value); state.character.progressionFeats[key] = { name: ref.name, source: ref.source || DATA_SOURCE }; }
    state.character.feats = [...(state.character.feat ? [state.character.feat] : []), ...(state.character.additionalFeats || []), ...Object.values(state.character.progressionFeats)];
    await saveCharacter(); render();
  });
  document.querySelectorAll("[data-weapon-mastery-select]").forEach(el => el.onchange = async () => {
    const key = el.value; const max = state.lastDerived?.weaponMasteryCount || 0;
    if (!key) return;
    if (!Array.isArray(state.character.weaponMasteries)) state.character.weaponMasteries = [];
    if (state.character.weaponMasteries.length >= max) { showToast(`Choose only ${max} weapon masteries.`); return; }
    if (!state.character.weaponMasteries.some(x=>String(x).toLowerCase()===key.toLowerCase())) state.character.weaponMasteries.push(key);
    await saveCharacter(); render();
  });
  document.querySelectorAll("[data-remove-weapon-mastery]").forEach(el => el.onclick = async () => {
    const key=String(el.dataset.removeWeaponMastery||"").toLowerCase();
    state.character.weaponMasteries=(state.character.weaponMasteries||[]).filter(x=>String(x).toLowerCase()!==key);
    await saveCharacter(); render();
  });
  document.querySelectorAll("[data-proficiency-choice-slot]").forEach(el => el.onchange = async () => {
    const kind = el.dataset.proficiencyChoiceKind;
    const store = kind === "language" ? state.character.languageChoiceSlots : state.character.toolChoiceSlots;
    if (!el.value) delete store[el.dataset.proficiencyChoiceSlot]; else store[el.dataset.proficiencyChoiceSlot] = el.value;
    await saveCharacter(); render();
  });  document.querySelectorAll("[data-standard-language]").forEach(el => el.onchange = async () => {
    const idx = Number(el.dataset.standardLanguage);
    const value = el.value || null;
    if (idx === 0) state.character.standardLanguages[0] = value;
    if (idx === 1) state.character.standardLanguages[1] = value;
    if (state.character.standardLanguages[0] && state.character.standardLanguages[0] === state.character.standardLanguages[1]) state.character.standardLanguages[1] = null;
    await saveCharacter(); render();
  });

  document.querySelectorAll("[data-stat]").forEach(el => el.onchange = async () => { state.character.baseStats[el.dataset.stat] = clamp(Number(el.value),1,30); await saveCharacter(); render(); });
  document.querySelectorAll("[data-feat-ability]").forEach(el => el.onchange = async () => { state.character.featAbilityChoices[el.dataset.featAbility] = el.value; await saveCharacter(); render(); });
  document.querySelectorAll("[data-feat-save]").forEach(el => el.onchange = async () => { state.character.featSaveChoices[el.dataset.featSave] = el.value; await saveCharacter(); render(); });
  document.querySelectorAll("[data-feat-skill]").forEach(el => el.onchange = async () => { state.character.featSkillChoices[el.dataset.featSkill] = el.value; await saveCharacter(); render(); });
  document.querySelectorAll("[data-feat-mixed]").forEach(el => el.onchange = async () => { const key=el.dataset.featMixed; if (el.value) state.character.featMixedChoices[key]=el.value; else delete state.character.featMixedChoices[key]; await saveCharacter(); render(); });
  document.querySelectorAll("[data-feat-expertise]").forEach(el => el.onchange = async () => { const key=el.dataset.featExpertise; if (el.value) state.character.featExpertiseChoices[key]=el.value; else delete state.character.featExpertiseChoices[key]; await saveCharacter(); render(); });
  document.querySelectorAll("[data-feat-spell-list]").forEach(el => el.onchange = async () => { const key=el.dataset.featSpellList; const cur=state.character.featSpellChoices[key]||{}; state.character.featSpellChoices[key]=el.value?{...cur,list:el.value}:{...cur}; if(!el.value) delete state.character.featSpellChoices[key].list; await saveCharacter(); render(); });
  document.querySelectorAll("[data-feat-spell-ability]").forEach(el => el.onchange = async () => { const key=el.dataset.featSpellAbility; const cur=state.character.featSpellChoices[key]||{}; state.character.featSpellChoices[key]=el.value?{...cur,ability:el.value}:{...cur}; if(!el.value) delete state.character.featSpellChoices[key].ability; await saveCharacter(); render(); });
  document.querySelectorAll("[data-species-choice]").forEach(el => el.onchange = async () => { const key=el.dataset.speciesChoice; const cur=state.character.speciesChoices[key]||{}; if(el.value) state.character.speciesChoices[key]={...cur,value:el.value}; else delete state.character.speciesChoices[key]; await saveCharacter(); render(); });
  document.querySelectorAll("[data-species-choice-ability]").forEach(el => el.onchange = async () => { const key=el.dataset.speciesChoiceAbility; const cur=state.character.speciesChoices[key]||{}; if(el.value) state.character.speciesChoices[key]={...cur,ability:el.value}; else { const next={...cur}; delete next.ability; if(next.value) state.character.speciesChoices[key]=next; else delete state.character.speciesChoices[key]; } await saveCharacter(); render(); });
  document.querySelectorAll("[data-class-skill]").forEach(el => el.onchange = async () => { const arr=state.character.classSkillChoices; toggleArray(arr,normalizeSkillKey(el.dataset.classSkill),el.checked); const max=state.lastDerived?.skillChoiceSpec?.count||0; if(arr.length>max){arr.splice(arr.indexOf(normalizeSkillKey(el.dataset.classSkill)),1);el.checked=false;showToast(`Choose only ${max} class skills.`);return;} await saveCharacter(); render(); });
  document.querySelectorAll("[data-custom-skill]").forEach(el => el.onchange = async () => { toggleArray(state.character.customSkillProficiencies, normalizeSkillKey(el.dataset.customSkill), el.checked); await saveCharacter(); render(); });
  document.querySelectorAll("[data-expertise]").forEach(el => el.onchange = async () => { toggleArray(state.character.expertise, normalizeSkillKey(el.dataset.expertise), el.checked); await saveCharacter(); render(); });
  document.querySelectorAll("[data-spell-toggle]").forEach(el => el.onchange = async () => toggleSpellCollection(el.dataset.spellToggle, el.checked));
  document.querySelectorAll("[data-spell-tab]").forEach(el => el.onclick = () => { state.spellPickerTab = el.dataset.spellTab; render(); });
  const search = document.querySelector("#spellSearch"); const level = document.querySelector("#spellLevel");
  if (search) search.oninput = () => { updateSpellResultFilter().catch(console.warn); }; if (level) level.onchange = () => { updateSpellResultFilter().catch(console.warn); };
  document.querySelectorAll("[data-currency]").forEach(el => el.onchange = async () => { state.character.currency[el.dataset.currency] = Math.max(0, Number(el.value || 0)); await saveCharacter(); });
  const classSelect = document.querySelector('[data-builder="class"]');
  if (classSelect) classSelect.onchange = async () => {
    await readBuilder();
    state.character.subclass = null;
    const obj = state.character.class ? getClassFromFile(await getClassDetails(state.character.class.name), state.character.class.name, state.character.class.source || null) : null;
    if (obj) {
      const groups = normalizeStartingEquipmentGroups(obj);
      for (const group of groups) {
        if (group.options.length === 1) await applyStartingEquipment("class", group.group, group.options[0].key, obj);
        else if (group === groups[0] && group.options.length) await applyStartingEquipment("class", group.group, group.options[0].key, obj);
      }
    } else {
      removeStartingEquipmentOrigin(state.character, "class");
      await saveCharacter();
    }
    await populateSubclasses(splitRefId(classSelect.value).name, null);
    render();
  };
  const backgroundSelect = document.querySelector('[data-builder="background"]');
  if (backgroundSelect) backgroundSelect.onchange = async () => {
    const previous = state.character.background?.name;
    await readBuilder();
    const obj = state.character.background ? findBackground(state.character.background.name, state.character.background.source || null) : null;
    if (obj) {
      const groups = normalizeStartingEquipmentGroups(obj);
      for (const group of groups) {
        if (group.options.length === 1) await applyStartingEquipment("background", group.group, group.options[0].key, obj);
        else if (group === groups[0] && group.options.length) await applyStartingEquipment("background", group.group, group.options[0].key, obj);
      }
    } else if (state.character.background?.name !== previous) {
      removeStartingEquipmentOrigin(state.character, "background");
      await saveCharacter();
    }
    render();
  };
  const subclassSelect = document.querySelector('[data-builder="subclass"]');
  if (subclassSelect) subclassSelect.onchange = async () => { await readBuilder(); render(); };
}

function debounce(fn, ms) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }; }
function clamp(n,min,max){return Math.max(min,Math.min(max,Number.isFinite(n)?n:min));}
function toggleArray(arr, value, forced) { const i = arr.indexOf(value); const should = typeof forced === "boolean" ? forced : i < 0; if (should && i < 0) arr.push(value); if (!should && i >= 0) arr.splice(i,1); }
function idxUsed(max, idx) { return Math.min(Number(max||0), Number(idx||0)+1); }

async function readBuilder() {
  const c = state.character;
  const get = key => document.querySelector(`[data-builder="${key}"]`);
  if (get("name")) c.name = get("name").value.trim() || "Unnamed Character";
  if (get("player")) c.player = get("player").value.trim();
  if (get("level")) c.level = clamp(Number(get("level").value || 1),1,20);
  if (get("xp")) c.xp = Math.max(0, Number(get("xp").value || 0));
  const previousClass = c.class?.name || null;
  const previousBackground = c.background?.name || null;
  for (const key of ["species","background","class","subclass","feat"]) {
    if (!get(key)) continue;
    const ref = splitRefId(get(key).value);
    c[key] = ref.name ? { name: ref.name, source: ref.source || DATA_SOURCE } : null;
  }
  c.additionalFeats = Array.isArray(c.additionalFeats) ? c.additionalFeats : [];
  if (!c.backgroundAbility) c.backgroundAbility = { mode:"split", plus2:null, plus1:null, plus1b:null, plus1c:null };
  if (get("bgMode")) c.backgroundAbility.mode = get("bgMode").value === "three" ? "three" : "split";
  if (get("bgPlus2")) c.backgroundAbility.plus2 = get("bgPlus2").value || null;
  if (get("bgPlus1")) c.backgroundAbility.plus1 = get("bgPlus1").value || null;
  if (get("bgPlus1b")) c.backgroundAbility.plus1b = get("bgPlus1b").value || null;
  if (get("bgPlus1c")) c.backgroundAbility.plus1c = get("bgPlus1c").value || null;
  if (get("standardLanguage1")) c.standardLanguages[0] = get("standardLanguage1").value || null;
  if (get("standardLanguage2")) c.standardLanguages[1] = get("standardLanguage2").value || null;
  { const vals = (c.standardLanguages || []).filter(Boolean); c.standardLanguages = [vals[0] || null, vals[1] || null]; if (c.standardLanguages[0] && c.standardLanguages[1] && c.standardLanguages[0] === c.standardLanguages[1]) c.standardLanguages[1] = null; }
  if (c.backgroundAbility.mode === "three") { c.backgroundAbility.plus2 = null; const vals=[c.backgroundAbility.plus1,c.backgroundAbility.plus1b,c.backgroundAbility.plus1c].filter(Boolean); const uniq=[]; for (const v of vals) if (!uniq.includes(v)) uniq.push(v); c.backgroundAbility.plus1=uniq[0]||null; c.backgroundAbility.plus1b=uniq[1]||null; c.backgroundAbility.plus1c=uniq[2]||null; }
  else if (c.backgroundAbility.plus2 && c.backgroundAbility.plus2 === c.backgroundAbility.plus1) c.backgroundAbility.plus1 = null;
  c.classSkillChoices = normalizeSkillArray(c.classSkillChoices);
  c.customSkillProficiencies = normalizeSkillArray(c.customSkillProficiencies);
  c.expertise = normalizeSkillArray(c.expertise);

  const selectedBackground = findBackground(c.background?.name, c.background?.source || null);
  const backgroundFeats = backgroundFeatNames(selectedBackground);
  if (backgroundFeats.length === 1) {
    const resolved = findFeat(backgroundFeats[0].name || backgroundFeats[0], backgroundFeats[0].source || null);
    if (resolved) c.feat = { name: resolved.name, source: resolved.source };
  } else if (!backgroundFeats.length) {
    c.feat = null;
  } else if (c.feat && !backgroundFeats.some(n => String(n.name || n).toLowerCase() === c.feat.name.toLowerCase() && (!n.source || n.source === c.feat.source))) {
    c.feat = null;
  }

  c.additionalFeats = Array.isArray(c.additionalFeats) ? c.additionalFeats : [];

  if (c.class?.name) {
    const file = await getClassDetails(c.class.name);
    const obj = getClassFromFile(file, c.class.name, c.class.source || null);
    const spec = skillChoiceSpec(obj);
    c.classSkillChoices = normalizeSkillArray(c.classSkillChoices).filter(x => spec.from.includes(x)).slice(0, spec.count);
    const unlock = getSubclassUnlockLevel(obj);
    if (Number(c.level || 1) < unlock) c.subclass = null;

    const currentFeatSlots = progressionFeatSlots(obj, c.level);
    const allowedFeatKeys = new Set(currentFeatSlots.map(x => x.key));
    for (const key of Object.keys(c.progressionFeats || {})) if (!allowedFeatKeys.has(key)) delete c.progressionFeats[key];

    const currentOptionalSpecs = optionalFeatureProgression(obj, c.level);
    const allowedOptionalKeys = new Set(currentOptionalSpecs.map(x => x.key));
    for (const key of Object.keys(c.optionalFeatureChoices || {})) if (!allowedOptionalKeys.has(key)) delete c.optionalFeatureChoices[key];

    if (c.class.name !== previousClass) {
      c.weaponMasteries = [];
      c.optionalFeatureChoices = {};
      c.progressionFeats = {};
      c.startingEquipment.class = null;
    }
  } else {
    c.classSkillChoices = [];
    c.subclass = null;
    c.weaponMasteries = [];
    c.optionalFeatureChoices = {};
    c.progressionFeats = {};
    if (c.class !== null) c.startingEquipment.class = null;
  }

  if (c.background?.name !== previousBackground) c.startingEquipment.background = null;
  c.feats = [...(c.feat ? [c.feat] : []), ...c.additionalFeats, ...Object.values(c.progressionFeats || {})];

  if (get("acOverride")) c.acOverride = get("acOverride").value === "" ? null : Number(get("acOverride").value);
  if (get("speedOverride")) c.speedOverride = get("speedOverride").value === "" ? null : Number(get("speedOverride").value);
  if (get("hpMaxOverride")) c.hpMaxOverride = get("hpMaxOverride").value === "" ? null : Number(get("hpMaxOverride").value);
  if (get("hpCurrent")) { c.hpCurrent = get("hpCurrent").value === "" ? null : Number(get("hpCurrent").value); c.hpAuto = get("hpCurrent").value === ""; }
  if (get("tempHp")) c.tempHp = Math.max(0, Number(get("tempHp").value || 0));
  if (get("senses")) c.senses = get("senses").value.split(",").map(x=>x.trim()).filter(Boolean);
  if (get("notes")) c.notes = get("notes").value;
  for (const el of document.querySelectorAll("[data-species-choice]")) { const key=el.dataset.speciesChoice; const cur=c.speciesChoices?.[key]||{}; if (el.value) c.speciesChoices[key]={...cur,value:el.value}; else delete c.speciesChoices[key]; }
  for (const el of document.querySelectorAll("[data-species-choice-ability]")) { const key=el.dataset.speciesChoiceAbility; const cur=c.speciesChoices?.[key]||{}; if (el.value) c.speciesChoices[key]={...cur,ability:el.value}; else if (cur.value) { delete cur.ability; c.speciesChoices[key]=cur; } else delete c.speciesChoices[key]; }
  await saveCharacter();
}

function findFeatureByButton(el) {
  const name = decodeURIComponent(el.dataset.name || "");
  const all = [...(state.lastDerived?.classFeatures || []), ...(state.lastDerived?.subclassFeatures || [])];
  const kind = el.dataset.kind || "";
  return all.find(f => f.name === name && (!kind || (kind === "Class" && state.lastDerived?.classFeatures?.includes(f)) || (kind === "Subclass" && state.lastDerived?.subclassFeatures?.includes(f)))) || all.find(f => f.name === name) || null;
}

function openFeatureModal(f) {
  openModal(f.name, `<div class="modal-kicker">${escapeHtml(sourceLabel(f.source))} · level ${f.level}</div><div class="rules-text formatted-rules">${renderRichEntries(f.entries)}</div>`);
}
function openFeatModal(feat) { openModal(feat.name, `<div class="modal-kicker">${escapeHtml(sourceLabel(feat.source))}</div><div class="rules-text formatted-rules">${renderRichEntries(feat.entries)}</div>`); }
function openSpellModal(s) {
  openModal(s.name, `<div class="modal-kicker">${escapeHtml(sourceLabel(s.source))} · ${s.level===0?"Cantrip":`Level ${s.level}`} · ${escapeHtml(spellSchoolName(s.school))}</div><div class="spell-facts"><span>${escapeHtml(formatSpellTime(s.time))}</span><span>${escapeHtml(formatSpellRange(s.range))}</span><span>${escapeHtml(formatComponents(s.components))}</span><span>${escapeHtml(formatDuration(s.duration))}</span></div><div class="rules-text formatted-rules">${renderRichEntries(s.entries)}</div>${s.entriesHigherLevel?`<hr><div class="modal-kicker">Higher Levels</div><div class="rules-text formatted-rules">${renderRichEntries(s.entriesHigherLevel)}</div>`:""}`);
}
function formatSpellTime(time){const t=time?.[0];return t?`${t.number} ${t.unit}`:"";}
function formatSpellRange(range){const d=range?.distance; if(!d)return ""; return d.amount!=null?`${d.amount} ${d.type}`:d.type||"";}
function formatComponents(c){if(!c)return "";const out=[];if(c.v)out.push("V");if(c.s)out.push("S");if(c.m)out.push("M");return out.join("/");}
function formatDuration(d){const x=d?.[0]; if(!x)return ""; if(x.type==="instant")return "Instantaneous"; const u=x.duration?.unit||x.type; const a=x.duration?.amount; return `${a?`${a} `:""}${u}${x.concentration?" (Concentration)":""}`;}


function openResourceManager() {
  const resources = state.character.resources;
  const renderRows = () => resources.map((r,i) => `<div class="editor-row resource-editor-row">
    <input class="editor-name" data-resource-name="${i}" value="${escapeHtml(r.name || "Resource")}" aria-label="Resource name" ${r.mode==="auto"?"readonly":""}>
    <input type="number" min="0" max="99" data-resource-max="${i}" value="${Number(r.max || 0)}" aria-label="Resource maximum" ${r.mode==="auto"?"readonly":""}>
    <input type="number" min="0" max="99" data-resource-current="${i}" value="${Number(r.current || 0)}" aria-label="Current resource">
    <select data-resource-recharge="${i}" aria-label="Recharge" ${r.mode==="auto"?"disabled":""}><option value="" ${!r.recharge?"selected":""}>Manual</option><option value="short" ${r.recharge==="short"?"selected":""}>Short rest</option><option value="long" ${r.recharge==="long"?"selected":""}>Long rest</option><option value="both" ${r.recharge==="both"?"selected":""}>Short or Long rest</option></select>
    <span class="resource-mode">${r.mode==="auto" ? `Auto · ${escapeHtml(r.origin?.name || "Feature")}` : "Manual"}</span>${r.mode==="auto" ? `<button class="icon-button" disabled title="Automatic resources are derived from their feature">×</button>` : `<button class="icon-button" data-resource-delete="${i}" title="Remove">×</button>`}
  </div>`).join("") || `<div class="empty">No resources. Add one below.</div>`;
  openModal("Manage resources", `<div class="editor-head"><span>Name</span><span>Max</span><span>Current</span><span>Recharge</span><span>Mode / Origin</span><span></span></div><div id="resourceEditor" class="editor-list">${renderRows()}</div><button class="button button-primary" data-resource-add style="margin-top:12px">Add manual resource</button>`);
  const wire = () => {
    const root = document.querySelector("#resourceEditor");
    if (!root) return;
    root.querySelectorAll("[data-resource-name]").forEach(el => el.oninput = () => { resources[Number(el.dataset.resourceName)].name = el.value; saveCharacter(); });
    root.querySelectorAll("[data-resource-max]").forEach(el => el.onchange = () => { const r=resources[Number(el.dataset.resourceMax)]; r.max=Math.max(0,Number(el.value||0)); r.current=Math.min(r.current||0,r.max); saveCharacter(); renderResourceManager(); });
    root.querySelectorAll("[data-resource-current]").forEach(el => el.onchange = () => { const r=resources[Number(el.dataset.resourceCurrent)]; r.current=Math.max(0,Math.min(r.max,Number(el.value||0))); saveCharacter(); renderResourceManager(); });
    root.querySelectorAll("[data-resource-recharge]").forEach(el => el.onchange = () => { resources[Number(el.dataset.resourceRecharge)].recharge = el.value || ""; saveCharacter(); });
    root.querySelectorAll("[data-resource-delete]").forEach(el => el.onclick = () => { resources.splice(Number(el.dataset.resourceDelete),1); saveCharacter(); renderResourceManager(); });
    document.querySelector("[data-resource-add]")?.addEventListener("click", () => { resources.push({name:"Resource",max:1,current:0,recharge:"",mode:"manual"}); saveCharacter(); renderResourceManager(); });
  };
  wire();
}

function renderResourceManager() { closeModal(); openResourceManager(); }

function openAttackManager() {
  const attacks = state.character.attacks;
  const renderRows = () => attacks.map((a,i) => `<div class="attack-editor">
    <div class="form-grid two">
      <label class="field">Name<input data-attack-name="${i}" value="${escapeHtml(a.name || "Attack")}"></label>
      <label class="field">Attack bonus<input data-attack-bonus="${i}" value="${escapeHtml(a.attackBonus || "")}" placeholder="+5"></label>
      <label class="field">Damage<input data-attack-damage="${i}" value="${escapeHtml(a.damage || "")}" placeholder="1d8 + 3"></label>
      <label class="field">Range<input data-attack-range="${i}" value="${escapeHtml(a.range || "")}" placeholder="5 ft / 60 ft"></label>
      <label class="field full">Notes<input data-attack-notes="${i}" value="${escapeHtml(a.notes || "")}" placeholder="Weapon mastery, rider, ammunition…"></label>
    </div>
    <button class="button button-small button-danger" data-attack-delete="${i}">Remove attack</button>
  </div>`).join("") || `<div class="empty">No attacks configured.</div>`;
  openModal("Manage attacks", `<div id="attackEditor" class="editor-list">${renderRows()}</div><button class="button button-primary" data-attack-add style="margin-top:12px">Add attack</button>`);
  const root = document.querySelector("#attackEditor");
  if (!root) return;
  root.querySelectorAll("[data-attack-name]").forEach(el=>el.oninput=()=>{attacks[Number(el.dataset.attackName)].name=el.value;saveCharacter();});
  root.querySelectorAll("[data-attack-bonus]").forEach(el=>el.oninput=()=>{attacks[Number(el.dataset.attackBonus)].attackBonus=el.value;saveCharacter();});
  root.querySelectorAll("[data-attack-damage]").forEach(el=>el.oninput=()=>{attacks[Number(el.dataset.attackDamage)].damage=el.value;saveCharacter();});
  root.querySelectorAll("[data-attack-range]").forEach(el=>el.oninput=()=>{attacks[Number(el.dataset.attackRange)].range=el.value;saveCharacter();});
  root.querySelectorAll("[data-attack-notes]").forEach(el=>el.oninput=()=>{attacks[Number(el.dataset.attackNotes)].notes=el.value;saveCharacter();});
  root.querySelectorAll("[data-attack-delete]").forEach(el=>el.onclick=()=>{attacks.splice(Number(el.dataset.attackDelete),1);saveCharacter();openAttackManager();});
  document.querySelector("[data-attack-add]")?.addEventListener("click",()=>{attacks.push({name:"Attack",attackBonus:"",damage:"",range:"",notes:""});saveCharacter();openAttackManager();});
}

async function openItemPicker() {
  try {
    const data = await getItemsData();
    const items = officialItemCatalog().sort((a,b)=>a.name.localeCompare(b.name));
    const categories = [
      ["all", "All equipment"], ["weapon", "Weapons"], ["armor", "Armor"], ["shield", "Shields"],
      ["tool", "Tools"], ["gear", "Adventuring gear"], ["magic", "Magic items"], ["mount", "Mounts & vehicles"]
    ];
    openModal("Add 2024 equipment", `<div class="picker-toolbar equipment-picker-toolbar"><input id="itemSearch" type="search" placeholder="Search equipment…"><select id="itemCategory">${categories.map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select><label class="picker-check"><input id="itemAttune" type="checkbox"> Requires attunement</label></div><div id="itemResults" class="spell-results"></div>`);
    const categoryOf = it => {
      const t = String(it.type || "").toUpperCase();
      if (it.weaponCategory) return "weapon";
      if (it.ac != null || /^(LA|MA|HA|S)$/.test(t.split("|")[0])) return t.startsWith("S") ? "shield" : "armor";
      if (t.startsWith("AT") || t.startsWith("GS") || t.startsWith("INS") || t.startsWith("T")) return "tool";
      if (it.speed != null || /^MNT|VEH/.test(t)) return "mount";
      if (it.rarity && String(it.rarity).toLowerCase() !== "none") return "magic";
      return "gear";
    };
    const rerender = () => {
      const q = (document.querySelector("#itemSearch")?.value || "").toLowerCase().trim();
      const cat = document.querySelector("#itemCategory")?.value || "all";
      const attune = Boolean(document.querySelector("#itemAttune")?.checked);
      const list = items.filter(i => matchesSearchText(i.name, q) && (cat === "all" || categoryOf(i) === cat) && (!attune || Boolean(i.reqAttune))).slice(0,500);
      const root = document.querySelector("#itemResults"); if(!root)return;
      root.innerHTML = list.map((it,i)=>`<div class="spell-row"><div>${renderReferenceTag("item", `${it.name}|${it.source}|${it.name}`)}<div class="spell-meta">${escapeHtml(it.type || "Item")}${it.rarity && String(it.rarity).toLowerCase() !== "none" ? ` · ${escapeHtml(String(it.rarity))}` : ""}</div></div><button class="button button-small button-primary" data-add-item="${i}">Add</button></div>`).join("")||`<div class="empty">No matching equipment.</div>`;
      bindRuleReferenceLinks(root);
      root.querySelectorAll("[data-add-item]").forEach(btn=>btn.onclick=async()=>{const it=list[Number(btn.dataset.addItem)]; if(!it)return; await addInventoryItem(it); closeModal(); state.view="equipment"; render();});
    };
    document.querySelector("#itemSearch").oninput=rerender;
    document.querySelector("#itemCategory").onchange=rerender;
    document.querySelector("#itemAttune").onchange=rerender;
    rerender();
  } catch(e){showToast(`Equipment could not be loaded: ${e.message}`);}
}
async function addInventoryItem(it){const existing=state.character.inventory.find(x=>x.name===it.name&&x.source===it.source);if(existing)existing.quantity=Number(existing.quantity||1)+1;else state.character.inventory.push({name:it.name,source:it.source,quantity:1,equipped:false,wielding:false}); await saveCharacter();}
function adjustItemQty(i,delta){const item=state.character.inventory[i];if(!item)return;item.quantity=Number(item.quantity||1)+delta;if(item.quantity<=0)state.character.inventory.splice(i,1);saveCharacter().then(render);}
async function openInventoryItemInfo(i){const item=state.character.inventory[i];if(!item)return;await getItemsData();const found=findOfficialItemByName(item.name,item.source)||findOfficialItemByName(item.name);if(found){cacheReferenceEntity("item",found);openModal(found.name,`<div class="modal-kicker">${escapeHtml(sourceLabel(found.source))} · ${escapeHtml(found.type||"")}</div><div class="rules-text formatted-rules">${renderRichEntries(found.entries||found.entry||[])}</div>`);}}

function maxCastableSpellLevel(d = state.lastDerived) {
  const slots = d?.spellSlots || [];
  for (let i = slots.length - 1; i >= 0; i--) if (Number(slots[i] || 0) > 0) return i + 1;
  return 0;
}
async function updateSpellResultFilter(){
  await loadSpellSource(state.version, DATA_SOURCE);
  mergeOfficialSpells();
  const spells = getLoadedSpells().filter(s => isOfficial2024Entity(s)).sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name));
  const d = state.lastDerived || await deriveCharacter();
  const available = spells.filter(s => spellAvailableToCharacter(s, d)).slice(0,2000);
  renderSpellResults(available);
}
async function toggleSpellCollection(id, checked){
  const listName = state.spellPickerTab === "prepared" ? "preparedSpells" : state.spellPickerTab === "cantrips" ? "cantrips" : state.spellPickerTab === "spellbook" ? "spellbook" : "knownSpells";
  const list = state.character[listName];
  const lower=id.toLowerCase();
  const idx=list.findIndex(x=>String(x).toLowerCase()===lower);
  const s=await getSpellById(id);
  if(checked){
    if(idx<0){
      if(listName==="preparedSpells" && state.lastDerived?.maxPrepared!=null && list.length>=state.lastDerived.maxPrepared) { showToast(`Prepared spell limit reached (${state.lastDerived.maxPrepared}).`); updateSpellResultFilter(); return; }
      if(listName==="cantrips" && state.lastDerived?.cantrips!=null && list.length>=state.lastDerived.cantrips) { showToast(`Cantrip limit reached (${state.lastDerived.cantrips}).`); updateSpellResultFilter(); return; }
      if(listName==="knownSpells" && state.lastDerived?.knownSpells!=null && list.length>=state.lastDerived.knownSpells) { showToast(`Known spell limit reached (${state.lastDerived.knownSpells}).`); updateSpellResultFilter(); return; }
      if(s)list.push(id);
    }
  } else if(idx>=0) list.splice(idx,1);
  await saveCharacter(); updateSpellResultFilter();
}

function openModal(title, body) {
  const root = document.querySelector("#modalRoot");
  root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><div class="modal-title">${escapeHtml(title)}</div></div><button class="modal-close" data-modal-close>Close</button></div><div class="modal-body">${body}</div></section></div>`;
  root.querySelector("[data-modal-close]").onclick=closeModal;
  root.querySelector("[data-modal-backdrop]").onclick=e=>{if(e.target===e.currentTarget)closeModal();};
  bindRuleReferenceLinks(root);
}
function closeModal(){const root=document.querySelector("#modalRoot");if(root)root.innerHTML="";}

async function openCharacterMenu(){
  const chars=await getCharacters();
  openModal("Characters on this tablet",`${chars.map(ch=>`<div class="character-row ${ch.id===state.character.id?"current":""}"><button class="character-select" data-switch-modal="${ch.id}"><strong>${escapeHtml(ch.name)}</strong><span>${escapeHtml([ch.species?.name,ch.class?.name,ch.subclass?.name,`Level ${ch.level}`].filter(Boolean).join(" · "))}</span></button></div>`).join("")}<div class="quick-actions" style="margin-top:12px"><button class="button button-primary" data-new-modal>New character</button><button class="button" data-action="export">Export current</button><button class="button" data-action="import">Import</button></div>`);
  document.querySelectorAll("[data-switch-modal]").forEach(btn=>btn.onclick=async()=>{await switchCharacter(btn.dataset.switchModal);closeModal();});
  document.querySelector("[data-new-modal]")?.addEventListener("click",async()=>{await createCharacter();closeModal();state.view="builder";render();});
  bindEvents();
}

function exportCharacter(){const blob=new Blob([JSON.stringify(state.character,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${safeFileName(state.character.name||"character")}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function safeFileName(s){return String(s).replace(/[^a-z0-9-_]+/gi,"-").replace(/^-+|-+$/g,"").toLowerCase()||"character";}
function openImport(){const input=document.createElement("input");input.type="file";input.accept="application/json";input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const parsed=migrateCharacter(JSON.parse(await file.text()));await idbPut("characters",parsed.id,parsed);state.character=parsed;await idbPut("kv","currentCharacterId",parsed.id);state.view="sheet";render();showToast("Character imported.");}catch(e){showToast(`Import failed: ${e.message}`);}};input.click();}

function applyStandardArray(){
  const className = state.character.class?.name || "";
  const mapping = Object.entries(STANDARD_ARRAY_BY_CLASS).find(([name]) => name.toLowerCase() === className.toLowerCase())?.[1] || null;
  if (mapping) {
    for (const ability of ABILITIES) state.character.baseStats[ability] = mapping[ability];
    saveCharacter().then(render);
    showToast(`Applied the 2024 PHB Standard Array for ${className}.`);
    return;
  }
  ABILITIES.forEach((a,i)=>state.character.baseStats[a]=STANDARD_ARRAY[i]);
  saveCharacter().then(render);
  showToast(className ? `No 2024 PHB class row exists for ${className}; used the neutral 15/14/13/12/10/8 order.` : "Choose a class to use its 2024 PHB Standard Array arrangement.");
}
function applyPointBuyDefault(){
  const values=[15,14,13,12,10,8];ABILITIES.forEach((a,i)=>state.character.baseStats[a]=values[i]);saveCharacter().then(render);showToast("Loaded the 27-point-buy baseline (15, 14, 13, 12, 10, 8). Adjust individual scores as needed.");
}
function resetDeathSaves(){ state.character.deathSaves = { success: 0, failure: 0 }; }
function applyDamage(amount, maxHp){
  const n = Math.max(0, Number(amount || 0));
  if (!n) return;
  const c = state.character;
  let remaining = n;
  const temp = Math.max(0, Number(c.tempHp || 0));
  const absorbed = Math.min(temp, remaining);
  c.tempHp = temp - absorbed;
  remaining -= absorbed;
  const hp = clamp(Number(c.hpCurrent ?? maxHp ?? 0), 0, maxHp);
  c.hpCurrent = clamp(hp - remaining, 0, maxHp);
  c.hpAuto = false;
}
function applyHealing(amount, maxHp){
  const n = Math.max(0, Number(amount || 0));
  if (!n) return;
  const c = state.character;
  const before = clamp(Number(c.hpCurrent ?? 0), 0, maxHp);
  c.hpCurrent = clamp(before + n, 0, maxHp);
  c.hpAuto = false;
  if (c.hpCurrent > 0) resetDeathSaves();
}
function shortRest(){
  const c=state.character;
  for(const r of c.resources){
    if(r.recharge!=="short" && r.recharge!=="both") continue;
    if(r.shortRestore === "one") r.current=Math.min(Number(r.max||0), Number(r.current||0)+1);
    else r.current=r.max;
  }
  saveCharacter().then(()=>{showToast("Short rest recorded.");render();});
}
function longRest(){
  const c=state.character;
  c.hpCurrent=state.lastDerived?.maxHp??c.hpCurrent;
  c.hpAuto = c.hpMaxOverride == null;
  c.tempHp=0;
  // 2024 PHB: a Long Rest restores all spent Hit Dice.
  c.hitDiceUsed=0;
  c.deathSaves={success:0,failure:0};
  c.spellSlotsUsed=[];
  c.exhaustion=Math.max(0, Number(c.exhaustion||0)-1);
  c.concentration=null;
  for(const r of c.resources){if(r.recharge==="short"||r.recharge==="long"||r.recharge==="both")r.current=r.max;}
  saveCharacter().then(()=>{showToast("Long rest recorded. HP, spell slots, hit dice, and exhaustion updated.");render();});
}

ensureCacheProgressRoot();
window.addEventListener("online",()=>{state.online=true;updateHeader();showToast("Back online.");});
window.addEventListener("offline",()=>{state.online=false;updateHeader();showToast("Offline mode. Cached rules data remains available.");});
window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();state.deferredInstallPrompt=event;updateHeader();});
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{state.view=btn.dataset.view;render();}));

function ensureCacheProgressRoot() {
  if (document.querySelector("#cacheProgressRoot")) return;
  const root = document.createElement("div");
  root.id = "cacheProgressRoot";
  root.className = "cache-progress-root";
  root.hidden = true;
  root.innerHTML = `<div class="cache-progress-card" role="status" aria-live="polite"><div class="cache-progress-phase" data-cache-progress-phase>Preparing</div><div class="cache-progress-title" data-cache-progress-title>Preparing rules data…</div><div class="cache-progress-detail" data-cache-progress-detail></div><div class="cache-progress-track"><div class="cache-progress-bar" data-cache-progress-bar style="width:0%"></div></div><div class="cache-progress-count" data-cache-progress-count>0%</div></div>`;
  document.body.appendChild(root);
}

document.querySelector("#updateBtn")?.addEventListener("click",()=>syncData(true));
document.querySelector("#installBtn")?.addEventListener("click",async()=>{if(!state.deferredInstallPrompt)return;state.deferredInstallPrompt.prompt();await state.deferredInstallPrompt.userChoice;state.deferredInstallPrompt=null;updateHeader();});

document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&state.online&&state.version&&Date.now()-Number(state.lastReleaseCheck||0)>6*60*60*1000)syncData(false);});

async function init(){
  await loadCharacter();
  ensureCacheProgressRoot();
  updateHeader();
  // Do not expose a partially hydrated character sheet. Complete/resume the staged
  // rules synchronization first; every later view can then assume the library exists.
  if(state.version || state.online){
    setCacheProgress({label:"Preparing 2024 rules library",detail:"Checking the local cache and preparing staged synchronization…",done:0,total:1,phase:"Preparing"});
    await syncData(false);
  } else {
    render();
  }
  if("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then(reg=>reg.update()).catch(console.warn);
  }
}

init().catch(err=>{console.error(err);showToast(`Startup error: ${err.message}`);});
