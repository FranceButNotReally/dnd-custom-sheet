const REPO = "5etools-mirror-3/5etools-src";
const GITHUB_RELEASE_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const RAW_ROOT = `https://raw.githubusercontent.com/${REPO}`;
const DATA_SOURCE = "XPHB";
const CORE_2024_DATE = "2024-09-17";
const APP_VERSION = "0.6.0";

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
const SPELL_SCHOOLS = { A: "Abjuration", C: "Conjuration", D: "Divination", E: "Enchantment", V: "Evocation", I: "Illusion", N: "Necromancy", T: "Transmutation" };
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

const state = {
  view: "sheet",
  online: navigator.onLine,
  busy: false,
  version: null,
  lastSync: null,
  lastReleaseCheck: null,
  data: { books: null, classIndex: null, races: null, backgrounds: null, feats: null, languages: null, optionalfeatures: null, spells: null, items: null, classFiles: new Map(), officialSources: new Set(), sourceMeta: [] },
  character: null,
  deferredInstallPrompt: null,
  spellPickerTab: "prepared",
  sheetPage: 1,
  lastDerived: null,
};

const DB_NAME = "dnd-2024-5etools-sheet";
const DB_VERSION = 3;
let dbPromise;

function emptyCharacter() {
  return {
    schema: 5,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: "New Character",
    player: "",
    level: 1,
    class: null,
    subclass: null,
    species: null,
    background: null,
    feat: null,
    feats: [],
    featAbilityChoices: {},
    featSaveChoices: {},
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
    backgroundAbility: { plus2: null, plus1: null },
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
    attacks: [],
    notes: "",
  };
}

function migrateCharacter(raw) {
  const base = emptyCharacter();
  if (!raw || typeof raw !== "object") return base;
  const c = { ...base, ...raw };
  c.schema = 5;
  c.baseStats = { ...base.baseStats, ...(raw.baseStats || raw.stats || {}) };
  c.manualAbilityBonuses = { ...base.manualAbilityBonuses, ...(raw.manualAbilityBonuses || {}) };
  c.deathSaves = { ...base.deathSaves, ...(raw.deathSaves || {}) };
  c.currency = { ...base.currency, ...(raw.currency || {}) };
  c.backgroundAbility = { ...base.backgroundAbility, ...(raw.backgroundAbility || {}) };
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
  c.conditions = Array.isArray(raw.conditions) ? raw.conditions : [];
  c.spellbook = Array.isArray(raw.spellbook) ? raw.spellbook : [];
  c.knownSpells = Array.isArray(raw.knownSpells) ? raw.knownSpells : [];
  c.preparedSpells = Array.isArray(raw.preparedSpells) ? raw.preparedSpells : [];
  c.cantrips = Array.isArray(raw.cantrips) ? raw.cantrips : [];
  c.inventory = Array.isArray(raw.inventory) ? raw.inventory : [];
  c.resources = Array.isArray(raw.resources) ? raw.resources : [];
  c.attacks = Array.isArray(raw.attacks) ? raw.attacks : [];
  c.feats = Array.isArray(raw.feats) ? raw.feats : (raw.feat ? [raw.feat] : []);
  c.feat = c.feats[0] || null;
  c.featAbilityChoices = { ...(raw.featAbilityChoices || {}) };
  c.featSaveChoices = { ...(raw.featSaveChoices || {}) };
  c.customSkillProficiencies = c.customSkillProficiencies.map(normalizeSkillKey).filter(Boolean);
  c.expertise = [...new Set(c.expertise || [])];
  c.heroicInspiration = Boolean(raw.heroicInspiration);
  c.exhaustion = clamp(Number(raw.exhaustion || 0), 0, 6);
  c.concentration = raw.concentration ? String(raw.concentration) : null;
  if (raw.hpCurrent == null && raw.hp != null) c.hpCurrent = raw.hp;
  if (raw.acOverride == null && raw.ac != null) c.acOverride = raw.ac;
  if (raw.speedOverride == null && raw.speed != null) c.speedOverride = raw.speed;
  if (c.hpMaxOverride === undefined) c.hpMaxOverride = null;
  if (c.tempHp == null) c.tempHp = 0;
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

async function fetch5eData(version, path) {
  const cached = await cachedData(version, path);
  if (cached !== null) return cached;
  const url = `${RAW_ROOT}/${encodeURIComponent(version)}/${path}`;
  const json = await fetchJson(url, { timeoutMs: 45000 });
  await cacheData(version, path, json);
  return json;
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

async function loadAll2024SpellData(version, spellIndex, officialSources) {
  // Load every indexed spell file and let the entity-level 2024 markers/source set decide
  // what belongs in the player rules dataset. This keeps future official 2024 books from
  // being missed merely because a source is absent from books.json metadata.
  const sources = Object.entries(spellIndex || {});
  const files = await Promise.all(sources.map(async ([source, file]) => {
    try { return await fetch5eData(version, `data/spells/${file}`); }
    catch (e) { console.warn(`Unable to load spell source ${source}:`, e); return null; }
  }));
  const merged = { spell: [] };
  for (const data of files) for (const spell of data?.spell || []) if (isOfficial2024Entity(spell, officialSources)) merged.spell.push(spell);
  const seen = new Set();
  merged.spell = merged.spell.filter(spell => {
    const key = `${spell.name.toLowerCase()}|${spell.source}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  return merged;
}

async function loadCoreData(version) {
  const [books, classIndex, races, backgrounds, feats, languages, optionalfeatures, spellIndex] = await Promise.all([
    fetch5eData(version, PATHS.books),
    fetch5eData(version, PATHS.classIndex),
    fetch5eData(version, PATHS.races),
    fetch5eData(version, PATHS.backgrounds),
    fetch5eData(version, PATHS.feats),
    fetch5eData(version, PATHS.languages),
    fetch5eData(version, PATHS.optionalfeatures),
    fetch5eData(version, PATHS.spellIndex),
  ]);
  const sourceMeta = buildOfficialSourceMeta(books);
  const officialSources = new Set(sourceMeta.map(x => x.source));
  const spells = await loadAll2024SpellData(version, spellIndex, officialSources);
  return { books, classIndex, races, backgrounds, feats, languages, optionalfeatures, spells, items: null, classFiles: new Map(), officialSources, sourceMeta };
}

async function loadVersion(version) {
  const core = await loadCoreData(version);
  state.data = core;
}

async function syncData(force = false) {
  if (state.busy) return;
  state.busy = true;
  setBusy(true);
  updateHeader();
  try {
    if (!state.online) {
      if (!state.version) throw new Error("Connect to the internet for the first data sync.");
      await loadVersion(state.version);
      showToast(`Offline: using cached 5etools ${state.version}.`);
      return;
    }
    const latest = await getLatestReleaseTag(force);
    const needsUpdate = force || !state.version || latest !== state.version;
    if (!needsUpdate) {
      await loadVersion(state.version);
      showToast(`5etools ${state.version} is current.`);
      return;
    }
    showToast(`Downloading 5etools ${latest}…`);
    const oldVersion = state.version;
    await loadVersion(latest);
    state.version = latest;
    state.lastSync = new Date().toISOString();
    await persistMeta();
    if (oldVersion && oldVersion !== latest) await idbDeletePrefix("data", `${oldVersion}::`);
    showToast(`5etools updated to ${latest}.`);
  } catch (error) {
    console.warn(error);
    if (state.version) {
      try {
        await loadVersion(state.version);
        showToast(`Using cached 5etools ${state.version}. ${state.online ? "Update check failed." : "Offline mode."}`);
      } catch (cacheError) {
        showToast(`5etools data could not be loaded: ${cacheError.message}`);
      }
    } else {
      showToast(`Could not load 5etools data: ${error.message}`);
    }
  } finally {
    state.busy = false;
    setBusy(false);
    updateHeader();
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

async function getItemsData() {
  if (state.data.items) return state.data.items;
  state.data.items = await fetch5eData(state.version, PATHS.items);
  return state.data.items;
}

function findOfficial(json, prop, name, source = null) {
  const needle = String(name || "").trim().toLowerCase();
  const entries = officialEntries(json, prop);
  return entries.find(x => String(x.name || "").toLowerCase() === needle && (!source || x.source === source)) || null;
}

function findBackground(name, source = null) { return findOfficial(state.data.backgrounds, "background", name, source); }
function findSpecies(name, source = null) { return findOfficial(state.data.races, "race", name, source); }
function findFeat(name, source = null) { return findOfficial(state.data.feats, "feat", name, source); }
function findLanguage(name, source = null) { return findOfficial(state.data.languages, "language", name, source); }

function getClassFromFile(file, name, source = null) {
  const entries = (file?.class || []).filter(x => isOfficial2024Entity(x));
  const needle = String(name || "").trim().toLowerCase();
  return entries.find(x => x.name.toLowerCase() === needle && (!source || x.source === source)) ||
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
  return { name: parts[0], className: parts[1], classSource: parts[2] || "", level: Number(parts[3] || 0), source: parts[4] || "" };
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
function featRefKey(feat, index = 0) { return `${feat?.name || "Feat"}|${feat?.source || ""}|${index}`; }
function selectedFeatObjects(c) {
  const refs = Array.isArray(c?.feats) && c.feats.length ? c.feats : (c?.feat ? [c.feat] : []);
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
      for (const amount of weights) specs.push({ index, from: from.map(normalizeAbilityKey).filter(Boolean), amount: Number(amount) || 1 });
      continue;
    }
    if (entry?.choose) {
      const from = Array.isArray(entry.choose.from) ? entry.choose.from : (Array.isArray(entry.choose) ? entry.choose : []);
      const amount = Number(entry.choose.amount ?? entry.amount ?? 1);
      specs.push({ index, from: from.map(normalizeAbilityKey).filter(Boolean), amount });
      continue;
    }
    for (const [ability, value] of Object.entries(entry || {})) {
      const key = normalizeAbilityKey(ability);
      if (key && Number(value) !== 0 && Number.isFinite(Number(value))) specs.push({ index, from: [key], amount: Number(value), fixed: true });
    }
  }
  return specs;
}
function featSaveSpecs(feat) {
  const specs = [];
  for (const [index, entry] of (Array.isArray(feat?.savingThrowProficiencies) ? feat.savingThrowProficiencies : []).entries()) {
    if (typeof entry === "string") { const key = normalizeAbilityKey(entry); if (key) specs.push({ index, from: [key], count: 1, fixed: true }); continue; }
    const choose = entry?.choose;
    if (choose) {
      const from = Array.isArray(choose.from) ? choose.from.map(normalizeAbilityKey).filter(Boolean) : [];
      specs.push({ index, from, count: Number(choose.count || 1) });
      continue;
    }
    for (const [ability, value] of Object.entries(entry || {})) if (value) { const key = normalizeAbilityKey(ability); if (key) specs.push({ index, from: [key], count: 1, fixed: true }); }
  }
  return specs;
}
function reconcileFeatChoices(c, feats) {
  c.featAbilityChoices = { ...(c.featAbilityChoices || {}) };
  c.featSaveChoices = { ...(c.featSaveChoices || {}) };
  for (const feat of feats || []) {
    for (const spec of featAbilitySpecs(feat)) {
      const key = featRefKey(feat, spec.index);
      if (spec.fixed) { c.featAbilityChoices[key] = spec.from[0]; continue; }
      if (!spec.from.includes(c.featAbilityChoices[key])) c.featAbilityChoices[key] = spec.from[0] || null;
    }
    for (const spec of featSaveSpecs(feat)) {
      const key = featRefKey(feat, spec.index);
      if (spec.fixed) { c.featSaveChoices[key] = spec.from[0]; continue; }
      if (!spec.from.includes(c.featSaveChoices[key])) c.featSaveChoices[key] = spec.from[0] || null;
    }
  }
}
function canonicalLabel(value, kind = "") {
  const raw = decodeHtmlEntities(String(value || "")).trim();
  if (!raw) return "";
  const norm = raw.replace(/[^a-z0-9]/gi, "").toLowerCase();
  for (const [key, [, name]] of Object.entries(SKILLS)) if (key.replace(/[^a-z0-9]/gi, "").toLowerCase() === norm || name.replace(/[^a-z0-9]/gi, "").toLowerCase() === norm) return name;
  if (kind === "feat") {
    const found = findFeat(raw.split("|")[0], raw.includes("|") ? raw.split("|")[1] : null);
    if (found) return found.name;
  }
  if (kind === "spell") {
    const found = spellById(raw);
    if (found) return found.name;
  }
  if (kind === "item") {
    const name = raw.split("|")[0];
    const found = state.data.items ? officialEntries(state.data.items, "item").find(x => x.name.toLowerCase() === name.toLowerCase()) : null;
    if (found) return found.name;
  }
  const aliases = {
    animalhandling: "Animal Handling", sleightofhand: "Sleight of Hand", savageattacker: "Savage Attacker",
    spellattack: "Spell Attack", passiveperception: "Passive Perception", heroicinspiration: "Heroic Inspiration",
    simple: "Simple Weapons", simples: "Simple Weapons", simpleweapon: "Simple Weapons", martial: "Martial Weapons", martialweapons: "Martial Weapons",
    light: "Light Armor", medium: "Medium Armor", heavy: "Heavy Armor", shield: "Shields"
  };
  if (aliases[norm]) return aliases[norm];
  return raw.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\s+/g, " ").replace(/\b\w/g, m => m.toUpperCase());
}

function tagLabel(tag, body) {
  const parts = decodeHtmlEntities(body).split("|");
  const raw = parts[0] || "";
  if (["b", "bold", "i", "italic", "u", "underline", "s", "strike", "kbd"].includes(tag)) return raw;
  if (["skill", "feat", "spell", "item", "race", "background", "class", "subclass", "condition", "language", "action", "sense", "variantrule", "book"].includes(tag)) return canonicalLabel(raw, tag);
  if (tag === "dice" || tag === "damage" || tag === "dc" || tag === "hit" || tag === "chance") return parts[1] || raw;
  if (tag === "filter") return parts[0] || "Filter";
  if (tag === "link") return parts[2] || parts[0];
  return parts[2] || parts[1] || parts[0] || tag;
}

function renderInline(text) {
  let out = escapeHtml(String(text ?? ""));
  for (let i = 0; i < 6; i++) {
    out = out
      .replace(/\{@(b|bold)\s+([^{}]+)\}/gi, (_, tag, body) => `<strong>${renderInline(body)}</strong>`)
      .replace(/\{@(i|italic)\s+([^{}]+)\}/gi, (_, tag, body) => `<em>${renderInline(body)}</em>`)
      .replace(/\{@(u|underline)\s+([^{}]+)\}/gi, (_, tag, body) => `<u>${renderInline(body)}</u>`)
      .replace(/\{@(s|strike)\s+([^{}]+)\}/gi, (_, tag, body) => `<s>${renderInline(body)}</s>`)
      .replace(/\{@kbd\s+([^{}]+)\}/gi, (_, body) => `<kbd>${renderInline(body)}</kbd>`)
      .replace(/\{@br\}/gi, "<br>");
  }
  out = out.replace(/\{@([\w-]+)\s+([^{}]*)\}/g, (_, tag, body) => {
    const label = escapeHtml(tagLabel(tag, body));
    const interactive = ["spell", "item", "feat", "race", "background", "language"].includes(tag.toLowerCase());
    return `<span class="rules-chip${interactive ? " rules-chip-link" : ""}" title="${escapeHtml(tag)}">${label}</span>`;
  });
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
  const group = (classObj?.classTableGroups || []).find(g => Array.isArray(g.rowsSpellProgression));
  const row = group?.rowsSpellProgression?.[level - 1];
  return Array.isArray(row) ? row.slice(0, 9).map(Number) : [];
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
  const prog = classObj?.spellsKnownProgressionFixed;
  if (!Array.isArray(prog)) return null;
  return prog.slice(0, Math.max(0, Number(level || 1))).reduce((sum, value) => sum + (Number(value) || 0), 0) || null;
}
function hitDieFaces(classObj) { return Number(classObj?.hd?.faces || 8); }
function defaultMaxHp(classObj, level, conMod, override) {
  if (Number.isFinite(Number(override))) return Math.max(1, Number(override));
  const faces = hitDieFaces(classObj);
  const first = faces + conMod;
  const later = Math.floor(faces / 2) + 1 + conMod;
  return Math.max(1, first + Math.max(0, level - 1) * later);
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

  for (const [index, entry] of entries.entries()) {
    const choose = entry?.choose;
    if (choose?.weighted) {
      // 2024 backgrounds normally encode the +2/+1 choice as one weighted choice,
      // e.g. weights [2, 1] from the same list of abilities.
      const from = Array.isArray(choose.weighted.from) ? choose.weighted.from : [];
      const weights = Array.isArray(choose.weighted.weights) ? choose.weighted.weights : [];
      choices.push({ index, from, amount: 2, weighted: true, weights });
      if (weights.includes(2)) from.forEach(a => plus2From.add(a));
      if (weights.includes(1)) from.forEach(a => plus1From.add(a));
      continue;
    }
    if (choose) {
      const from = Array.isArray(choose.from) ? choose.from : [];
      const amount = Number(choose.amount || 1);
      choices.push({ index, from, amount });
      if (amount === 2) from.forEach(a => plus2From.add(a));
      if (amount === 1) from.forEach(a => plus1From.add(a));
      continue;
    }
    // Be tolerant of a fixed ability object such as {str: true}.
    for (const [ability, value] of Object.entries(entry || {})) {
      if (value === 2) plus2From.add(ability);
      if (value === 1) plus1From.add(ability);
    }
  }

  return {
    choices,
    plus2From: [...plus2From].filter(a => ABILITIES.includes(a)),
    plus1From: [...plus1From].filter(a => ABILITIES.includes(a)),
  };
}

function reconcileBackgroundAbilityChoices(c, bg) {
  c.backgroundAbility = { plus2: c.backgroundAbility?.plus2 || null, plus1: c.backgroundAbility?.plus1 || null };
  const spec = backgroundAbilitySpec(bg);
  const plus2 = spec.plus2From || [];
  const plus1 = spec.plus1From || [];
  if (!plus2.includes(c.backgroundAbility.plus2)) c.backgroundAbility.plus2 = plus2[0] || null;
  if (!plus1.includes(c.backgroundAbility.plus1) || c.backgroundAbility.plus1 === c.backgroundAbility.plus2) {
    c.backgroundAbility.plus1 = plus1.find(a => a !== c.backgroundAbility.plus2) || null;
  }
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
  const bonus2 = c.backgroundAbility?.plus2;
  const bonus1 = c.backgroundAbility?.plus1;
  if (bonus2 && ABILITIES.includes(bonus2)) stats[bonus2] = Math.min(20, Number(stats[bonus2]) + 2);
  if (bonus1 && ABILITIES.includes(bonus1) && bonus1 !== bonus2) stats[bonus1] = Math.min(20, Number(stats[bonus1]) + 1);
  for (const feat of featObjs || []) {
    for (const spec of featAbilitySpecs(feat)) {
      const key = featRefKey(feat, spec.index);
      const ability = c.featAbilityChoices?.[key] || spec.from[0];
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

function parseProficiencyDisplay(classObj, backgroundObj, speciesObj, featObjs = null, includeManual = true) {
  const armor = [], weapons = [], tools = [], languages = [];
  const featList = Array.isArray(featObjs) ? featObjs : (featObjs ? [featObjs] : []);
  for (const obj of [classObj?.startingProficiencies, classObj?.armorProficiencies, classObj?.multiclassing?.proficienciesGained]) {
    for (const value of obj?.armor || obj?.armorProficiencies || []) {
      for (const x of (typeof value === "string" ? [value] : Object.keys(value || {}))) armor.push(friendlyProficiencyKey(x));
    }
  }
  for (const obj of [classObj?.startingProficiencies, classObj?.weaponProficiencies, classObj?.multiclassing?.proficienciesGained]) {
    for (const value of obj?.weapons || obj?.weaponProficiencies || []) {
      for (const x of (typeof value === "string" ? [value] : Object.keys(value || {}))) weapons.push(friendlyProficiencyKey(x));
    }
  }
  for (const obj of [classObj?.startingProficiencies, backgroundObj, speciesObj, ...featList]) {
    for (const map of obj?.toolProficiencies || []) tools.push(...Object.entries(map || {}).map(([k,v]) => `${friendlyProficiencyKey(k)}${Number(v) > 1 ? ` ×${v}` : ""}`));
    for (const map of obj?.languageProficiencies || []) languages.push(...languageChoicesFromMap(map));
  }
  return {
    armor: dedupeLabels(includeManual ? [...armor, ...(state.character.manualArmorProficiencies || [])] : armor),
    weapons: dedupeLabels(includeManual ? [...weapons, ...(state.character.manualWeaponProficiencies || [])] : weapons),
    tools: dedupeLabels(includeManual ? [...tools, ...(state.character.manualToolProficiencies || [])] : tools),
    languages: dedupeLabels(includeManual ? [...languages, ...(state.character.languageChoices || []), ...(state.character.manualLanguages || [])] : languages),
  };
}

function hasWeaponProficiency(item, profs) {
  const name = String(item?.name || "").toLowerCase();
  const clean = (profs || []).map(p => stripTags(String(p || "")).toLowerCase());
  if (clean.some(p => p === name)) return true;
  const category = String(item?.weaponCategory || "").toLowerCase();
  const props = new Set((item?.property || []).map(String).map(x => x.split("|")[0]));
  if (category === "simple" && clean.some(p => p === "simple weapons")) return true;
  if (category === "martial") {
    if (clean.some(p => p === "martial weapons")) return true;
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

async function getAttackRows(d) {
  let itemsData = null;
  try { itemsData = await getItemsData(); } catch {}
  const officialItems = itemsData ? officialEntries(itemsData, "item") : [];
  const rows = [];
  for (const owned of state.character.inventory || []) {
    if (!owned?.equipped || !owned.name) continue;
    const item = officialItems.find(x => x.name === owned.name && (!owned.source || x.source === owned.source)) || officialItems.find(x => x.name === owned.name);
    if (!item || !item.weaponCategory) continue;
    const ability = weaponAbility(item, d.mods);
    const proficient = hasWeaponProficiency(item, d.proficiencies.weapons);
    const itemBonus = Number.parseInt(String(item.attackBonus ?? item.bonusWeapon ?? 0), 10) || 0;
    const bonus = d.mods[ability] + (proficient ? d.pb : 0) + itemBonus;
    const damage = item.dmg1 ? `${item.dmg1}${item.dmgType ? ` ${damageTypeName(item.dmgType)}` : ""}` : "—";
    const properties = (item.property || []).map(x => canonicalLabel(String(x).split("|")[0])).join(", ");
    const mastery = (item.mastery || []).map(x => canonicalLabel(String(x).split("|")[0])).join(", ");
    rows.push({ name: item.name, attackBonus: `${formatMod(bonus)}${proficient ? "" : "*"}`, damage, details: [item.range ? `Range ${item.range}` : "", properties, mastery ? `Mastery: ${mastery}` : ""].filter(Boolean).join(" · ") });
  }
  for (const custom of state.character.attacks || []) rows.push({ name: custom.name || "Attack", attackBonus: custom.attackBonus || "—", damage: custom.damage || "—", details: custom.range || custom.notes || "" });
  for (const spell of (state.character.cantrips || []).map(spellById).filter(Boolean)) rows.push({ name: spell.name, attackBonus: d.spellcastingAbility ? formatMod(d.pb + d.mods[d.spellcastingAbility]) : "—", damage: (spell.damageInflict || []).map(damageTypeName).join(", ") || "Cantrip", details: spell.range ? formatSpellRange(spell.range) : "" });
  return rows.slice(0, 12);
}

function damageTypeName(value) {
  const map = { B: "Bludgeoning", P: "Piercing", S: "Slashing", A: "Acid", C: "Cold", F: "Fire", O: "Force", L: "Lightning", N: "Necrotic", I: "Poison", Y: "Psychic", R: "Radiant", T: "Thunder" };
  return map[String(value || "").split("|")[0]] || canonicalLabel(value);
}

function calcAutoAc(c, mods, itemsData = null, effects = null) {
  const inventory = Array.isArray(c.inventory) ? c.inventory : [];
  const equipped = inventory.filter(x => x && x.equipped && x.name);
  const items = itemsData ? officialEntries(itemsData, "item") : [];
  const resolved = equipped.map((owned, index) => {
    const found = items.find(it => it.name === owned.name && it.source === owned.source) || items.find(it => it.name === owned.name);
    return found ? { owned, item: found, index } : null;
  }).filter(Boolean);
  const armor = resolved.filter(({ item }) => /^(LA|MA|HA)(\||$)/.test(String(item.type || "")));
  const shields = resolved.filter(({ item }) => /^S(\||$)/.test(String(item.type || "")));
  let best = 10 + mods.dex;
  let reason = "10 + Dexterity modifier";
  const formula = effects?.acFormulas?.[0] || null;
  if (!armor.length && formula && (!shields.length || formula.allowShield)) {
    best = Number(formula.base || 10) + formula.abilities.reduce((sum, key) => sum + Number(mods[key] || 0), 0);
    reason = formula.label || "Feature formula";
  }
  if (armor.length) {
    for (const { item } of armor) {
      let base = Number(item.ac); if (!Number.isFinite(base)) continue;
      const bonus = Number.parseInt(String(item.bonusAc || "0"), 10) || 0; let dex = 0;
      const type = String(item.type || "");
      if (/^LA(\||$)/.test(type)) dex = mods.dex;
      else if (/^MA(\||$)/.test(type)) { const cap = Number(item.dexterityMax ?? item.dexMax ?? 2); dex = Math.min(mods.dex, Number.isFinite(cap) ? cap : 2); }
      const candidate = base + bonus + dex; if (candidate > best || !best) { best = candidate; reason = item.name; }
    }
  }
  if (shields.length) {
    const shieldAc = Math.max(...shields.map(({ item }) => Number(item.ac || 0) + (Number.parseInt(String(item.bonusAc || "0"), 10) || 0)));
    best += shieldAc;
    reason += " + shield";
  }
  best += Number(effects?.acBonus || 0);
  return { value: best, reason };
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
function buildDerivedEffects(c, d, featObjs) {
  const effects = {
    acFormulas: [], acBonus: 0, hpPerLevel: 0, hpFlat: 0, speedBonus: 0, initiativeBonus: 0,
    passivePerceptionBonus: 0, passiveInvestigationBonus: 0, resistances: [], senses: [], active: [],
    savingThrows: new Set(), skills: new Set(), tools: [], languages: []
  };
  const allFeatures = [...(d.classFeatures || []), ...(d.subclassFeatures || [])];
  for (const feature of allFeatures) {
    const n = textNorm(feature.name);
    if (n === "unarmoreddefense") {
      if (textNorm(d.classObj?.name) === "barbarian") {
        effects.acFormulas.push({ base: 10, abilities: ["dex", "con"], allowShield: true, label: "Unarmored Defense (10 + DEX + CON)" });
        effects.active.push("Unarmored Defense: 10 + Dexterity + Constitution");
      } else if (textNorm(d.classObj?.name) === "monk") {
        effects.acFormulas.push({ base: 10, abilities: ["dex", "wis"], allowShield: false, label: "Unarmored Defense: 10 + DEX + WIS" });
        effects.active.push("Unarmored Defense: 10 + Dexterity + Wisdom");
      }
    }
    if (n === "unarmoredmovement") {
      const bonus = classTableNumericValue(d.classObj, "unarmored movement", c.level);
      if (bonus) { effects.speedBonus += bonus; effects.active.push(`Unarmored Movement: +${bonus} ft.`); }
    }
    if (n === "fastmovement") { effects.speedBonus += 10; effects.active.push("Fast Movement: +10 ft."); }
  }
  for (const feat of featObjs || []) {
    const n = textNorm(feat.name);
    if (n === "tough") { effects.hpPerLevel += 2; effects.active.push("Tough: +2 Hit Points per character level"); }
    if (n === "alert") { effects.initiativeBonus += d.pb; effects.active.push("Alert: Initiative proficiency"); }
    if (n === "observant") { effects.passivePerceptionBonus += 5; effects.passiveInvestigationBonus += 5; effects.active.push("Observant: +5 passive Perception and Investigation"); }
    for (const spec of featSaveSpecs(feat)) {
      const selected = c.featSaveChoices?.[featRefKey(feat, spec.index)];
      if (selected) effects.savingThrows.add(selected);
    }
    for (const map of feat.skillProficiencies || []) for (const key of grantedSkillsFromMap([map])) effects.skills.add(key);
    for (const r of feat.resist || []) effects.resistances.push(canonicalLabel(stripTags(String(r))));
  }
  return effects;
}

async function deriveCharacter() {
  const c = state.character;
  const backgroundObj = findBackground(c.background?.name, c.background?.source || null);
  if (backgroundObj) reconcileBackgroundAbilityChoices(c, backgroundObj);
  else c.backgroundAbility = { plus2: null, plus1: null };
  const featObjs = selectedFeatObjects(c);
  reconcileFeatChoices(c, featObjs);
  const finalStats = calculateFinalStats(c, backgroundObj, featObjs);
  const mods = Object.fromEntries(ABILITIES.map(a => [a, abilityMod(finalStats[a])]));
  const d = {
    mods, stats: finalStats, baseStats: c.baseStats || c.stats || finalStats, pb: proficiencyBonus(c.level),
    classFile: null, classObj: null, subclassObj: null, subclassOptions: [],
    speciesObj: findSpecies(c.species?.name, c.species?.source || null), backgroundObj,
    featObj: featObjs[0] || null, featObjs, classFeatures: [], subclassFeatures: [],
    skillProficiencies: new Set(), skillChoiceSpec: { from: [], count: 0 }, savingThrowProficiencies: new Set(),
    effects: null, maxHp: 1, currentHp: Number(c.hpCurrent ?? 0), ac: Number(c.acOverride ?? (10 + mods.dex)), acAutomatic: true,
    acReason: "10 + Dexterity modifier", speed: Number(c.speedOverride ?? dfltSpeed(findSpecies(c.species?.name, c.species?.source || null))),
    size: sizeLabel(findSpecies(c.species?.name, c.species?.source || null)?.size), spellcastingAbility: null, spellSlots: [],
    maxPrepared: null, knownSpells: null, cantrips: null, inventoryWeight: 0, passivePerception: 10 + mods.wis,
    passiveInvestigation: 10 + mods.int, proficiencies: { armor: [], weapons: [], tools: [], languages: [] },
    resistances: [], senses: [], sourceSummary: state.data.sourceMeta || []
  };
  if (c.class?.name) {
    d.classFile = await getClassDetails(c.class.name);
    d.classObj = getClassFromFile(d.classFile, c.class.name, c.class.source || null);
    d.subclassOptions = getSubclassOptions(d.classFile, c.class.name);
    d.subclassObj = d.subclassOptions.find(s => s.name.toLowerCase() === String(c.subclass?.name || "").toLowerCase() && (!c.subclass?.source || s.source === c.subclass.source)) || null;
    d.classFeatures = getClassFeatures(d.classFile, d.classObj, c.level);
    d.subclassFeatures = getSubclassFeatures(d.classFile, d.subclassObj, c.level);
    d.skillChoiceSpec = skillChoiceSpec(d.classObj);
    d.spellcastingAbility = d.classObj?.spellcastingAbility || null;
    d.spellSlots = classSpellSlots(d.classObj, c.level);
    d.cantrips = classCantrips(d.classObj, c.level);
    d.maxPrepared = classPrepared(d.classObj, c.level, mods);
    d.knownSpells = classKnownSpells(d.classObj, c.level);
    for (const save of d.classObj?.proficiency || []) { const key = normalizeAbilityKey(save); if (key) d.savingThrowProficiencies.add(key); }
  }
  d.effects = buildDerivedEffects(c, d, featObjs);
  for (const save of d.effects.savingThrows) d.savingThrowProficiencies.add(save);
  d.activeEffects = [...(d.effects.active || [])];
  for (const value of d.effects.resistances || []) if (value && !d.resistances.includes(value)) d.resistances.push(value);
  const speciesResists = Array.isArray(d.speciesObj?.resist) ? d.speciesObj.resist : [];
  for (const value of speciesResists) { const label = canonicalLabel(stripTags(String(value))); if (label && !d.resistances.includes(label)) d.resistances.push(label); }
  if (d.speciesObj?.darkvision) d.senses.push(`Darkvision ${d.speciesObj.darkvision} ft.`);
  for (const [sense, value] of Object.entries(d.speciesObj?.senses || {})) if (value) d.senses.push(`${canonicalLabel(sense)} ${value} ft.`);
  if (c.acOverride == null) {
    try { const acResult = calcAutoAc(c, mods, await getItemsData(), d.effects); d.ac = acResult.value; d.acReason = acResult.reason; }
    catch (error) { console.warn("Equipment AC calculation unavailable", error); }
  } else { d.ac = Number(c.acOverride); d.acAutomatic = false; d.acReason = "Manual override"; }
  const bgSkills = grantedSkillsFromMap(d.backgroundObj?.skillProficiencies);
  for (const s of bgSkills) d.skillProficiencies.add(s);
  for (const s of normalizeSkillArray(c.classSkillChoices)) d.skillProficiencies.add(s);
  for (const s of normalizeSkillArray(c.customSkillProficiencies)) d.skillProficiencies.add(s);
  for (const s of d.speciesObj?.skillProficiencies ? grantedSkillsFromMap(d.speciesObj.skillProficiencies) : []) d.skillProficiencies.add(s);
  for (const s of d.effects.skills) d.skillProficiencies.add(s);
  const perceptionKey = "perception";
  if (d.skillProficiencies.has(perceptionKey)) d.passivePerception += d.pb;
  if (c.expertise.includes(perceptionKey)) d.passivePerception += d.pb;
  d.passivePerception += Number(d.effects.passivePerceptionBonus || 0);
  if (d.skillProficiencies.has("investigation")) d.passiveInvestigation += d.pb;
  if (c.expertise.includes("investigation")) d.passiveInvestigation += d.pb;
  d.passiveInvestigation += Number(d.effects.passiveInvestigationBonus || 0);
  d.proficiencies = parseProficiencyDisplay(d.classObj, d.backgroundObj, d.speciesObj, featObjs);
  d.speed = Number(c.speedOverride ?? (dfltSpeed(d.speciesObj) + Number(d.effects.speedBonus || 0)));
  const baseMaxHp = defaultMaxHp(d.classObj, c.level, mods.con, c.hpMaxOverride);
  d.maxHp = c.hpMaxOverride == null ? baseMaxHp + Number(d.effects.hpPerLevel || 0) * Number(c.level || 1) + Number(d.effects.hpFlat || 0) : baseMaxHp;
  if (c.acOverride == null && !Number.isFinite(d.ac)) d.ac = 10 + mods.dex;
  c.hitDiceUsed = Math.min(Math.max(0, Number(c.hitDiceUsed || 0)), Math.max(0, Number(c.level || 1)));
  if (Array.isArray(c.spellSlotsUsed) && d.spellSlots.length) c.spellSlotsUsed = c.spellSlotsUsed.slice(0, d.spellSlots.length).map((used, i) => Math.min(Math.max(0, Number(used || 0)), Number(d.spellSlots[i] || 0)));
  c.exhaustion = clamp(Number(c.exhaustion || 0), 0, 6);
  if (c.hpAuto || c.hpCurrent == null) { c.hpCurrent = d.maxHp; d.currentHp = d.maxHp; c.hpAuto = true; }
  else { d.currentHp = clamp(Number(c.hpCurrent || 0), 0, d.maxHp); }
  if (d.currentHp > d.maxHp && c.hpMaxOverride == null) { d.currentHp = d.maxHp; c.hpCurrent = d.maxHp; }
  if (!c.baseStats) c.baseStats = { ...c.stats };
  if (c.backgroundAbility?.plus2 === c.backgroundAbility?.plus1) c.backgroundAbility.plus1 = null;
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
  if (data) data.textContent = state.version ? `5etools ${state.version}` : "5etools: not synced";
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
  if (!state.version || !state.data.classIndex) {
    app.innerHTML = emptyState();
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
  return `<div class="card empty-state"><div class="empty-icon">◆</div><h2>Sync 5etools to begin</h2><p>The first sync downloads the 2024 official player-facing data currently represented by 5etools to this device. After that, the character sheet can work offline.</p><button class="button button-primary" data-action="sync">Sync 5etools</button></div>`;
}

function metric(label, value, sub = "") {
  return `<div class="metric"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div>${sub ? `<div class="metric-sub">${escapeHtml(sub)}</div>` : ""}</div>`;
}
function pipBar(count, used, action, data = {}) {
  const n = Number(count || 0), u = Math.min(n, Math.max(0, Number(used || 0)));
  return `<div class="pips">${Array.from({ length: n }, (_, i) => `<button class="pip ${i < u ? "used" : ""}" data-action="${action}" data-index="${i}" ${Object.entries(data).map(([k,v]) => `data-${k}="${escapeHtml(v)}"`).join(" ")}></button>`).join("")}</div>`;
}

async function renderSheet(app) {
  const c = state.character;
  const d = await deriveCharacter();
  const attackRows = await getAttackRows(d);
  const page = state.sheetPage || 1;
  const classLine = [c.class?.name, c.subclass?.name].filter(Boolean).join(" · ");
  const identityLine = [c.background?.name, c.species?.name].filter(Boolean).join(" · ");
  const saves = ABILITIES.map(a => {
    const prof = d.savingThrowProficiencies.has(a);
    return `<div class="sheet-save-row"><span class="check-circle ${prof ? "on" : ""}"></span><span>${ABILITY_NAMES[a]} Save</span><strong>${formatMod(d.mods[a] + (prof ? d.pb : 0))}</strong></div>`;
  }).join("");
  const skillsByAbility = Object.fromEntries(ABILITIES.map(a => [a, []]));
  for (const [key,[ability,name]] of Object.entries(SKILLS)) skillsByAbility[ability].push({ key, name, prof: d.skillProficiencies.has(key), exp: c.expertise.includes(key), bonus: d.mods[ability] + (d.skillProficiencies.has(key) ? d.pb : 0) + (c.expertise.includes(key) ? d.pb : 0) });
  const abilityBoxes = ABILITIES.map(a => `<section class="ability-box">
      <div class="ability-head"><span>${ABILITY_LABELS[a]}</span><strong>${formatMod(d.mods[a])}</strong></div>
      <div class="ability-save"><span class="check-circle ${d.savingThrowProficiencies.has(a) ? "on" : ""}"></span><b>Saving Throw</b><strong>${formatMod(d.mods[a] + (d.savingThrowProficiencies.has(a) ? d.pb : 0))}</strong></div>
      <div class="skill-stack">${skillsByAbility[a].map(sk => `<div class="sheet-skill-row"><span class="check-circle ${sk.prof ? "on" : ""}"></span><span>${escapeHtml(sk.name)}${sk.exp ? " <sup>EX</sup>" : ""}</span><strong>${formatMod(sk.bonus)}</strong></div>`).join("")}</div>
    </section>`).join("");
  const featureRows = [...d.classFeatures.map(f => ({...f, kind:"Class"})), ...d.subclassFeatures.map(f => ({...f, kind:"Subclass"}))]
    .sort((a,b) => Number(a.level)-Number(b.level) || a.name.localeCompare(b.name))
    .map(f => `<button class="sheet-feature-row" data-action="feature" data-name="${encodeURIComponent(f.name)}" data-kind="${f.kind}"><div><strong>${escapeHtml(f.name)}</strong><span>${escapeHtml(f.kind)} · Level ${f.level}</span></div><span>›</span></button>`).join("") || `<div class="sheet-empty">No class features yet.</div>`;
  const speciesTraits = (d.speciesObj?.entries || []).filter(x => x && x.name).slice(0, 10);
  const traitRows = speciesTraits.map(t => `<button class="sheet-feature-row" data-action="species-trait" data-name="${encodeURIComponent(t.name)}"><div><strong>${escapeHtml(t.name)}</strong><span>Species</span></div><span>›</span></button>`).join("") || `<div class="sheet-empty">Choose a species.</div>`;
  const featRow = d.featObjs.length ? d.featObjs.map(feat => `<button class="sheet-feature-row" data-action="feat-detail" data-name="${encodeURIComponent(`${feat.name}|${feat.source}`)}"><div><strong>${escapeHtml(feat.name)}</strong><span>Feat · ${escapeHtml(sourceLabel(feat.source))}</span></div><span>›</span></button>`).join("") : `<div class="sheet-empty">Choose a feat.</div>`;
  const conditionChips = CONDITIONS.map(x => `<button class="sheet-chip ${c.conditions.includes(x) ? "selected" : ""}" data-action="condition" data-condition="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join("");
  const inspiration = c.heroicInspiration ? "★" : "☆";
  const slots = Array.from({length: 9}, (_,i) => d.spellSlots[i] ? `<div class="spell-slot-box"><strong>${i+1}</strong>${pipBar(d.spellSlots[i], countSlotUsed(c,i+1), "slot", {level:i+1})}</div>` : "").filter(Boolean).join("");
  const prepared = c.preparedSpells.map(spellById).filter(Boolean).sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name));
  const cantrips = c.cantrips.map(spellById).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
  const languages = d.proficiencies.languages.length ? d.proficiencies.languages : ["None recorded"];
  const attackHtml = attackRows.map(row => `<div class="weapon-row"><span>${escapeHtml(row.name)}</span><strong>${escapeHtml(row.attackBonus)}</strong><span>${escapeHtml(row.damage)}</span><small>${escapeHtml(row.details || "")}</small></div>`).join("") || `<div class="sheet-empty">Equip a weapon or add a custom attack.</div>`;
  const featurePreview = f => renderRichEntries((Array.isArray(f.entries) ? f.entries : [f.entries]).slice(0,2));

  const pageOne = `<div class="sheet-page">
    <div class="sheet-brandline"><div><span class="sheet-kicker">D&D 2024 · CHARACTER SHEET</span><h1>${escapeHtml(c.name || "Unnamed Character")}</h1><p>${escapeHtml(classLine || "Class not chosen")} · Level ${c.level}</p></div><div class="sheet-page-actions"><button class="sheet-nav ${page===1?"active":""}" data-action="sheet-page" data-page="1">Page 1</button><button class="sheet-nav ${page===2?"active":""}" data-action="sheet-page" data-page="2">Page 2</button><button class="sheet-nav" data-action="builder">Edit</button><button class="sheet-nav" data-action="character-menu">Characters</button></div></div>
    <div class="identity-grid">
      <div class="identity-fields"><div class="field-line"><span>Character Name</span><strong>${escapeHtml(c.name || "—")}</strong></div><div class="field-line"><span>Background</span><strong>${escapeHtml(c.background?.name || "—")}</strong></div><div class="field-line"><span>Species</span><strong>${escapeHtml(c.species?.name || "—")}</strong></div><div class="field-line"><span>Player</span><strong>${escapeHtml(c.player || "—")}</strong></div></div>
      <div class="identity-fields"><div class="field-line"><span>Class & Subclass</span><strong>${escapeHtml(classLine || "—")}</strong></div><div class="field-line"><span>Level</span><strong>${c.level}</strong></div><div class="field-line"><span>Experience</span><strong>—</strong></div><div class="field-line"><span>Proficiency Bonus</span><strong>${formatMod(d.pb)}</strong></div></div>
      <div class="identity-stat-box"><span>Armor Class</span><strong>${d.ac}</strong><small>${escapeHtml(d.acReason || "Automatic")}</small></div>
      <div class="identity-stat-box hp"><span>Hit Points</span><strong>${d.currentHp}<small> / ${d.maxHp}</small></strong><div class="hp-actions"><button data-action="hp" data-delta="-1">−</button><button data-action="hp" data-delta="1">+</button></div></div>
      <div class="identity-stat-box"><span>Hit Dice</span><strong>d${hitDieFaces(d.classObj)}</strong><small>${c.hitDiceUsed} used</small></div>
      <div class="identity-stat-box"><span>Death Saves</span><strong>${c.deathSaves.success} ✓ · ${c.deathSaves.failure} ✕</strong><small><button data-action="death" data-type="success">Success</button> <button data-action="death" data-type="failure">Failure</button></small></div>
    </div>
    <div class="sheet-metrics"><div><span>Initiative</span><strong>${formatMod(d.mods.dex + Number(d.effects?.initiativeBonus || 0))}</strong></div><div><span>Speed</span><strong>${d.speed} ft.</strong></div><div><span>Size</span><strong>${escapeHtml(d.size)}</strong></div><div><span>Passive Perception</span><strong>${d.passivePerception}</strong></div><div><span>Spell Save DC</span><strong>${d.spellcastingAbility ? 8 + d.pb + d.mods[d.spellcastingAbility] : "—"}</strong></div><div><span>Spell Attack</span><strong>${d.spellcastingAbility ? formatMod(d.pb+d.mods[d.spellcastingAbility]) : "—"}</strong></div></div>${d.activeEffects?.length ? `<section class="sheet-panel derived-effects-panel"><div class="sheet-panel-title">Active Rules Effects</div><div class="active-effect-list">${d.activeEffects.map(x=>`<span class="active-effect-chip">${escapeHtml(x)}</span>`).join("")}</div></section>` : ""}
    <div class="sheet-grid-main"><div class="ability-column">${abilityBoxes}</div><div class="sheet-right-column">
      <section class="sheet-panel"><div class="sheet-panel-title">Weapons & Damage Cantrips <button class="sheet-mini-btn" data-action="manage-attacks">Manage</button></div><div class="weapon-table head"><span>Name</span><span>Atk</span><span>Damage</span><span>Notes</span></div>${attackHtml}</section>
      <section class="sheet-panel"><div class="sheet-panel-title">Class Features</div>${featureRows}</section>
      <section class="sheet-panel"><div class="sheet-panel-title">Species Traits</div>${traitRows}</section>
      <section class="sheet-panel"><div class="sheet-panel-title">Feats</div>${featRow}</section>
      <section class="sheet-panel inspiration-panel"><div><div class="sheet-panel-title">Heroic Inspiration</div><p>${c.heroicInspiration ? "Available" : "Not available"}</p></div><button data-action="heroic" class="inspiration-button">${inspiration}</button></section>
      <section class="sheet-panel"><div class="sheet-panel-title">Conditions</div><div class="sheet-chips">${conditionChips}</div></section>
    </div></div>
  </div>`;

  const pageTwo = `<div class="sheet-page">
    <div class="sheet-brandline"><div><span class="sheet-kicker">D&D 2024 · CHARACTER SHEET</span><h1>${escapeHtml(c.name || "Unnamed Character")}</h1><p>Spellcasting, personality, proficiencies & equipment</p></div><div class="sheet-page-actions"><button class="sheet-nav ${page===1?"active":""}" data-action="sheet-page" data-page="1">Page 1</button><button class="sheet-nav ${page===2?"active":""}" data-action="sheet-page" data-page="2">Page 2</button></div></div>
    <div class="spellcasting-head"><div><span>Spellcasting Ability</span><strong>${d.spellcastingAbility ? ABILITY_LABELS[d.spellcastingAbility] : "—"}</strong></div><div><span>Spell Save DC</span><strong>${d.spellcastingAbility ? 8+d.pb+d.mods[d.spellcastingAbility] : "—"}</strong></div><div><span>Spell Attack Bonus</span><strong>${d.spellcastingAbility ? formatMod(d.pb+d.mods[d.spellcastingAbility]) : "—"}</strong></div><div><span>Prepared</span><strong>${d.maxPrepared ?? "—"}</strong></div></div>
    <section class="sheet-panel spell-slots-panel"><div class="sheet-panel-title">Spell Slots</div><div class="spell-slot-grid">${slots || `<div class="sheet-empty">No spell slots.</div>`}</div></section>
    <div class="sheet-grid-two"><section class="sheet-panel"><div class="sheet-panel-title">Cantrips</div>${cantrips.length ? cantrips.map(s => `<button class="sheet-list-item" data-action="spell" data-spell="${encodeURIComponent(`${s.name}|${s.source}`)}"><span>${escapeHtml(s.name)}</span><small>${escapeHtml(spellSchoolName(s.school))}</small></button>`).join("") : `<div class="sheet-empty">No cantrips selected.</div>`}</section><section class="sheet-panel"><div class="sheet-panel-title">Prepared Spells</div>${prepared.length ? prepared.map(s => `<button class="sheet-list-item" data-action="spell" data-spell="${encodeURIComponent(`${s.name}|${s.source}`)}"><span>${escapeHtml(s.name)}</span><small>Level ${s.level}</small></button>`).join("") : `<div class="sheet-empty">No prepared spells selected.</div>`}</section></div>
    <div class="sheet-grid-two compact-sheet-gap"><section class="sheet-panel"><div class="sheet-panel-title">Proficiencies & Languages</div><div class="proficiency-groups"><div><b>Armor</b><p>${escapeHtml(d.proficiencies.armor.join(", ") || "None")}</p></div><div><b>Weapons</b><p>${escapeHtml(d.proficiencies.weapons.join(", ") || "None")}</p></div><div><b>Tools</b><p>${escapeHtml(d.proficiencies.tools.join(", ") || "None")}</p></div><div><b>Languages</b><p>${escapeHtml(languages.join(", ") || "None")}</p></div></div>${d.resistances.length ? `<div class="derived-subgroup"><b>Damage Resistances</b><p>${escapeHtml(d.resistances.join(", "))}</p></div>` : ""}${d.senses.length ? `<div class="derived-subgroup"><b>Senses</b><p>${escapeHtml(d.senses.join(", "))}</p></div>` : ""}<button class="sheet-mini-btn" data-action="builder">Edit proficiencies</button></section><section class="sheet-panel"><div class="sheet-panel-title">Personality & Backstory</div><textarea class="sheet-notes" data-field="notes" rows="12" placeholder="Character notes, personality, ideals, bonds, flaws, backstory…">${escapeHtml(c.notes)}</textarea></section></div>
    <div class="sheet-grid-two compact-sheet-gap"><section class="sheet-panel"><div class="sheet-panel-title">Equipment</div>${(c.inventory || []).length ? c.inventory.slice(0,12).map((it,i) => `<div class="sheet-list-item static"><span>${escapeHtml(it.name)}${it.quantity>1?` ×${it.quantity}`:""}</span><small>${it.equipped ? "Equipped" : ""}</small></div>`).join("") : `<div class="sheet-empty">No equipment.</div>`}<button class="sheet-mini-btn" data-action="equipment">Open equipment</button></section><section class="sheet-panel"><div class="sheet-panel-title">Coins & Attunement</div><div class="coin-grid">${["cp","sp","ep","gp","pp"].map(k => `<label><span>${k.toUpperCase()}</span><input type="number" data-currency="${k}" value="${Number(c.currency?.[k] || 0)}" min="0"></label>`).join("")}</div><div class="attunement"><b>Magic Item Attunement</b><p>Track attuned items in Equipment.</p></div></section></div>
    <section class="sheet-panel compact-sheet-gap"><div class="sheet-panel-title">Rest & Resources</div><div class="resource-actions"><button class="sheet-nav" data-action="rest-short">Short Rest</button><button class="sheet-nav" data-action="rest-long">Long Rest</button><button class="sheet-nav" data-action="manage-resources">Manage Resources</button><button class="sheet-nav" data-action="temp-hp">Temporary HP</button><span>Exhaustion ${c.exhaustion}/6</span></div></section>
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
  const bgAbility = backgroundAbilitySpec(bg);
  const bgFeatRefs = backgroundFeatNames(bg);
  const availableOriginFeats = bgFeatRefs.length ? feats.filter(f => bgFeatRefs.some(ref => String(ref.name || ref).toLowerCase() === f.name.toLowerCase() && (!ref.source || ref.source === f.source))) : [];
  const selectedAbility2 = c.backgroundAbility.plus2;
  const selectedAbility1 = c.backgroundAbility.plus1;
  const classSkillChoices = new Set(normalizeSkillArray(c.classSkillChoices));
  const classOptionsSkills = d.skillChoiceSpec?.from || [];
  const maxClassSkills = d.skillChoiceSpec?.count || 0;
  const pointBuyTotal = ABILITIES.reduce((sum,a)=>sum+(POINT_BUY_COST[Math.max(8, Math.min(15, Number(c.baseStats[a] || 10)))] ?? 0),0);
  const sourceOptions = state.data.sourceMeta || [];
  const backgroundProficiencies = bg ? parseProficiencyDisplay(null, bg, null, null, false) : {armor:[],weapons:[],tools:[],languages:[]};
  const refValue = (obj) => normalizeRefId(obj.name, obj.source);
  const selectRefOptions = (list, current) => list.map(x => `<option value="${escapeHtml(refValue(x))}" ${current?.name===x.name && current?.source===x.source?"selected":""}>${escapeHtml(x.name)}${x.source!==DATA_SOURCE?` · ${escapeHtml(sourceLabel(x.source))}`:""}</option>`).join("");
  const manualList = (key) => (c[key] || []).map((x,i)=>`<span class="editable-chip">${escapeHtml(x)}<button data-action="remove-manual" data-list="${key}" data-index="${i}">×</button></span>`).join("") || `<span class="mini">None added manually.</span>`;
  const autoBonusLines = `<div class="final-stat-preview">${ABILITIES.map(a => `<div><span>${ABILITY_LABELS[a]}</span><strong>${c.baseStats[a]}</strong><em>${c.backgroundAbility.plus2===a?"+2":c.backgroundAbility.plus1===a?"+1":""}</em><b>${d.stats[a]}</b></div>`).join("")}</div>`;

  app.innerHTML = `
    ${pageHeader("CHARACTER BUILDER", `Build ${c.name || "your character"}`, `All 2024 official player-facing sources currently discovered in 5etools are available.`, `<button class="button" data-action="sheet">Character</button><button class="button button-primary" data-action="save-builder">Save</button>`)}
    <section class="card"><div class="section-title">Identity</div><div class="form-grid three">
      <label class="field">Character name<input type="text" data-builder="name" value="${escapeHtml(c.name)}"></label>
      <label class="field">Player<input type="text" data-builder="player" value="${escapeHtml(c.player)}"></label>
      <label class="field">Level<input type="number" min="1" max="20" data-builder="level" value="${c.level}"></label>
      <label class="field">Species<select data-builder="species"><option value="">— Select —</option>${selectRefOptions(races,c.species)}</select></label>
      <label class="field">Background<select data-builder="background"><option value="">— Select —</option>${selectRefOptions(backgrounds,c.background)}</select></label>
      <label class="field">Class<select data-builder="class"><option value="">— Select —</option>${classOptions.map(x=>`<option value="${escapeHtml(refValue(x))}" ${c.class?.name===x.name && c.class?.source===x.source?"selected":""}>${escapeHtml(x.name)}${x.source!==DATA_SOURCE?` · ${escapeHtml(sourceLabel(x.source))}`:""}</option>`).join("")}</select></label>
      <label class="field">Subclass<select data-builder="subclass" id="subclassSelect"><option value="">${c.class ? "Loading…" : "Choose a class first"}</option></select></label>
    </div></section>

    <section class="card compact-gap"><div class="section-head"><div><div class="section-title">Ability scores</div><div class="mini">Base scores are stored separately. The final values include background increases and any manual bonuses.</div></div><div class="quick-actions"><button class="button button-small" data-action="apply-standard-array">Standard array</button><button class="button button-small" data-action="apply-point-buy">27-point reset</button><span class="status-pill">Point buy: ${pointBuyTotal} / 27</span></div></div><div class="ability-editor">${ABILITIES.map(a=>`<label class="ability-editor-cell"><span>${ABILITY_LABELS[a]}</span><input type="number" min="1" max="30" data-stat="${a}" value="${c.baseStats[a]}"><small>Final ${d.stats[a]}</small></label>`).join("")}</div></section>

    <section class="card compact-gap"><div class="section-head"><div><div class="section-title">Background ability increases</div><div class="mini">Choose the increases granted by the selected 2024 background. The final scores above update immediately. The +2/+1 choices are prefilled to the first legal options and remain editable.</div></div></div>${bg ? `<div class="mini" style="margin-bottom:10px">${escapeHtml(bg.name)}: +2 from ${escapeHtml((bgAbility.plus2From || []).map(x=>ABILITY_LABELS[x]).join(", ") || "choice")} and +1 from ${escapeHtml((bgAbility.plus1From || []).map(x=>ABILITY_LABELS[x]).join(", ") || "choice")}.</div><div class="form-grid two"><label class="field">+2 ability<select data-builder="bgPlus2"><option value="">— Select —</option>${(bgAbility.plus2From || []).map(x=>`<option value="${x}" ${selectedAbility2===x?"selected":""}>${ABILITY_NAMES[x]}</option>`).join("")}</select></label><label class="field">+1 ability<select data-builder="bgPlus1"><option value="">— Select —</option>${(bgAbility.plus1From || []).filter(x=>x!==selectedAbility2).map(x=>`<option value="${x}" ${selectedAbility1===x?"selected":""}>${ABILITY_NAMES[x]}</option>`).join("")}</select></label></div>${autoBonusLines}` : `<div class="empty">Choose a 2024 background to see its ability-score options.</div>`}</section>

    <div class="grid two compact-gap"><section class="card"><div class="section-head"><div class="section-title">Class skill choices</div><span class="status-pill">${classSkillChoices.size} / ${maxClassSkills || 0}</span></div>${classOptionsSkills.length ? `<div class="skill-grid">${classOptionsSkills.map(key=>`<label class="skill-check"><input type="checkbox" data-class-skill="${key}" ${classSkillChoices.has(key)?"checked":""}>${escapeHtml(SKILLS[key]?.[1] || canonicalLabel(key))}</label>`).join("")}</div>` : `<div class="empty">Choose a class to load its skill choices from 5etools.</div>`}<div class="section-title subhead">Skill expertise</div><div class="skill-grid">${Object.entries(SKILLS).map(([key,[,name]])=>`<label class="skill-check"><input type="checkbox" data-expertise="${key}" ${c.expertise.includes(key)?"checked":""}>${escapeHtml(name)}</label>`).join("")}</div></section><section class="card"><div class="section-title">Background</div>${bg ? `<div class="detail-list"><div><strong>Skills</strong><span>${escapeHtml(grantedSkillsFromMap(bg.skillProficiencies).map(k=>SKILLS[k]?.[1]||canonicalLabel(k)).join(", ")||"None")}</span></div><div><strong>Origin feat</strong><span>${escapeHtml(bgFeatRefs.map(x=>x.name || x).join(", ")||"Choice")}</span></div><div><strong>Tools</strong><span>${escapeHtml(backgroundProficiencies.tools.join(", ")||"None")}</span></div><div><strong>Languages</strong><span>${escapeHtml(backgroundProficiencies.languages.join(", ")||"None")}</span></div></div>` : `<div class="empty">Choose a background.</div>`}</section></div>
    <section class="card compact-gap"><div class="section-title">Origin feat</div><div class="form-grid two"><label class="field">Feat<select data-builder="feat"><option value="">— Choose —</option>${availableOriginFeats.map(x=>`<option value="${escapeHtml(refValue(x))}" ${c.feat?.name===x.name&&c.feat?.source===x.source?"selected":""}>${escapeHtml(x.name)} · ${escapeHtml(x.source)}</option>`).join("")}</select></label><div>${d.featObj ? `<button class="feature feature-block" data-action="feat-detail" data-name="${encodeURIComponent(`${d.featObj.name}|${d.featObj.source}`)}"><strong>${escapeHtml(d.featObj.name)}</strong>${renderRichEntries((d.featObj.entries||[]).slice(0,2))}</button>` : `<div class="empty">Choose a feat to keep a rules reference on the character.</div>`}</div></div>${d.featObjs.flatMap(feat => featAbilitySpecs(feat).map(spec => { const key=featRefKey(feat,spec.index); return spec.fixed || !spec.from.length ? "" : `<div class="feat-choice-row"><label class="field">${escapeHtml(feat.name)} · Ability increase (+${spec.amount})<select data-feat-ability="${escapeHtml(key)}">${spec.from.map(a=>`<option value="${a}" ${c.featAbilityChoices?.[key]===a?"selected":""}>${ABILITY_NAMES[a]}</option>`).join("")}</select></label></div>`; })).join("")}</section>

    <div class="grid two compact-gap"><section class="card"><div class="section-title">Proficiencies & languages</div><div class="proficiency-summary"><div><strong>Armor</strong><span>${escapeHtml(d.proficiencies.armor.join(", ")||"None")}</span></div><div><strong>Weapons</strong><span>${escapeHtml(d.proficiencies.weapons.join(", ")||"None")}</span></div><div><strong>Tools</strong><span>${escapeHtml(d.proficiencies.tools.join(", ")||"None")}</span></div><div><strong>Languages</strong><span>${escapeHtml(d.proficiencies.languages.join(", ")||"None")}</span></div></div></section><section class="card"><div class="section-title">Add manual proficiencies</div><div class="manual-add-grid"><div><div class="chips">${manualList("manualArmorProficiencies")}</div><div class="manual-add"><input data-manual-input="manualArmorProficiencies" placeholder="Armor proficiency"><button class="button button-small" data-action="add-manual" data-list="manualArmorProficiencies">Add</button></div></div><div><div class="chips">${manualList("manualWeaponProficiencies")}</div><div class="manual-add"><input data-manual-input="manualWeaponProficiencies" placeholder="Weapon proficiency"><button class="button button-small" data-action="add-manual" data-list="manualWeaponProficiencies">Add</button></div></div><div><div class="chips">${manualList("manualToolProficiencies")}</div><div class="manual-add"><input data-manual-input="manualToolProficiencies" placeholder="Tool proficiency"><button class="button button-small" data-action="add-manual" data-list="manualToolProficiencies">Add</button></div></div><div><div class="chips">${manualList("manualLanguages")}</div><div class="manual-add"><select id="languagePicker"><option value="">Choose a language</option>${officialEntries(state.data.languages, "language").sort((a,b)=>a.name.localeCompare(b.name)).map(x=>`<option value="${escapeHtml(refValue(x))}">${escapeHtml(x.name)}${x.source!==DATA_SOURCE?` · ${escapeHtml(sourceLabel(x.source))}`:""}</option>`).join("")}</select><button class="button button-small" data-action="add-language-choice">Add</button></div><div class="manual-add"><input data-manual-input="manualLanguages" placeholder="Other language"><button class="button button-small" data-action="add-manual" data-list="manualLanguages">Add</button></div></div></div></section></div>

    <div class="grid two compact-gap"><section class="card"><div class="section-title">Combat overrides</div><div class="form-grid two"><label class="field">AC override<input type="number" min="0" max="60" data-builder="acOverride" value="${c.acOverride ?? ""}" placeholder="Automatic"></label><label class="field">Speed override<input type="number" min="0" max="200" data-builder="speedOverride" value="${c.speedOverride ?? ""}" placeholder="Automatic"></label><label class="field">Max HP override<input type="number" min="1" max="1000" data-builder="hpMaxOverride" value="${c.hpMaxOverride ?? ""}" placeholder="Automatic"></label><label class="field">Current HP<input type="number" min="0" max="1000" data-builder="hpCurrent" value="${c.hpAuto ? "" : (c.hpCurrent ?? "")}" placeholder="${c.hpAuto ? `Automatic (${c.hpCurrent ?? 0})` : "Manual"}"></label><label class="field">Temporary HP<input type="number" min="0" max="1000" data-builder="tempHp" value="${c.tempHp}"></label></div></section><section class="card"><div class="section-title">Notes</div><p class="mini">The full character sheet follows the official 2024 two-page organization; this builder is for setup and corrections.</p><textarea data-builder="notes" rows="7">${escapeHtml(c.notes)}</textarea></section></div>
  `;
  bindEvents();
  populateSubclasses(c.class?.name, c.subclass?.name);
}

async function populateSubclasses(className, currentName) {
  const select = document.querySelector("#subclassSelect");
  if (!select) return;
  if (!className) { select.innerHTML = `<option value="">Choose a class first</option>`; return; }
  try {
    const file = await getClassDetails(className);
    const options = getSubclassOptions(file, className);
    const currentSource = state.character.subclass?.source;
    select.innerHTML = `<option value="">— Select —</option>${options.map(s=>`<option value="${escapeHtml(normalizeRefId(s.name,s.source))}" ${currentName===s.name && (!currentSource||currentSource===s.source)?"selected":""}>${escapeHtml(s.name)}${s.source!==DATA_SOURCE?` · ${escapeHtml(s.source)}`:""}</option>`).join("")}`;
  } catch (e) { select.innerHTML = `<option value="">Unable to load subclasses</option>`; }
}

async function renderSpellbook(app) {
  const c = state.character;
  await deriveCharacter();
  const spells = Array.isArray(state.data.spells?.spell) ? officialEntries(state.data.spells, "spell").sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name)) : [];
  const maxPrepared = state.lastDerived?.maxPrepared ?? null;
  const maxCantrips = state.lastDerived?.cantrips ?? null;
  const tab = state.spellPickerTab;
  const collection = tab === "prepared" ? c.preparedSpells : tab === "cantrips" ? c.cantrips : tab === "spellbook" ? c.spellbook : c.knownSpells;
  const collectionIds = new Set(collection.map(x=>String(x).toLowerCase()));
  const className = c.class?.name || "";
  const castLevel = Math.max(0, Number(c.level || 1));
  const knownLimit = state.lastDerived?.knownSpells ?? null;
  const available = spells.filter(s => s.level === 0 ? true : s.level <= castLevel).slice(0, 1000);

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
    return `<div class="spell-row"><label class="spell-select"><input type="checkbox" data-spell-toggle="${escapeHtml(id)}" ${checked?"checked":""}> <span class="spell-title">${escapeHtml(s.name)}</span></label><span class="spell-meta">${s.level===0?"Cantrip":`Lv ${s.level}`} · ${escapeHtml(spellSchoolName(s.school))}</span><button class="button button-small" data-action="spell-info" data-spell="${encodeURIComponent(`${s.name}|${s.source}`)}">Info</button></div>`;
  }).join("") || `<div class="empty">No matching spells.</div>`;
}

function spellById(id) {
  const [name, source] = String(id || "").split("|");
  return state.data.spells?.spell?.find(s => s.name.toLowerCase() === String(name || "").toLowerCase() && (!source || s.source.toLowerCase() === source.toLowerCase())) || null;
}

function renderEquipment(app) {
  const items = state.character.inventory || [];
  app.innerHTML = `${pageHeader("EQUIPMENT", `${escapeHtml(state.character.name || "Character")} · Equipment`, "Items can be resolved directly from the cached 2024 5etools item data.", `<button class="button" data-action="sheet">Character</button><button class="button button-primary" data-action="item-picker">Add item</button>`)}
  <section class="card"><div class="currency-grid">${["pp","gp","ep","sp","cp"].map(k=>`<label class="field"><span>${k.toUpperCase()}</span><input type="number" data-currency="${k}" min="0" step="1" value="${Number(state.character.currency?.[k] || 0)}"></label>`).join("")}</div><div class="equipment-list">${items.length ? items.map((it,i)=>`<div class="equipment-row"><div><strong>${escapeHtml(it.name)}</strong><div class="mini">${escapeHtml(it.source || DATA_SOURCE)}${it.quantity>1?` · ×${it.quantity}`:""}${it.equipped?" · Equipped":""}</div></div><div class="quick-actions"><button class="button button-small ${it.equipped?"button-primary":""}" data-action="toggle-equipped" data-index="${i}">${it.equipped?"Equipped":"Equip"}</button><button class="button button-small" data-action="qty-minus" data-index="${i}">−</button><button class="button button-small" data-action="qty-plus" data-index="${i}">+</button><button class="button button-small" data-action="item-info" data-index="${i}">Info</button><button class="button button-small button-danger" data-action="remove-item" data-index="${i}">Remove</button></div></div>`).join("") : `<div class="empty">No inventory items yet.</div>`}</div></section>`;
  bindEvents();
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
  };
  const chars = await getCharacters();
  app.innerHTML = `${pageHeader("DATA & APP", "5etools synchronization", `App ${APP_VERSION} · all detected 2024 official player-facing sources are included.`, `<button class="button button-primary" data-action="sync">Check for updates</button>`)}
    <section class="card"><div class="data-row"><div><strong>Rules data</strong><span>Versioned 5etools release cached locally on this tablet</span></div><strong>${escapeHtml(state.version || "Not synced")}</strong></div><div class="data-row"><div><strong>Detected official 2024-era sources</strong><span>Discovered from 5etools source metadata and 2024 entity markers</span></div><strong>${state.data.sourceMeta?.length || 0}</strong></div><div class="data-row"><div><strong>Last successful sync</strong><span>Stored locally</span></div><strong>${state.lastSync ? escapeHtml(new Date(state.lastSync).toLocaleString()) : "—"}</strong></div><div class="data-row"><div><strong>Connectivity</strong><span>Internet is only needed to check/download newer rules data</span></div><strong>${state.online ? "Online" : "Offline"}</strong></div></section>
    <section class="card compact-gap"><div class="section-title">Detected 2024-era official sources</div><div class="source-chip-grid">${(state.data.sourceMeta || []).map(x=>`<div class="source-chip"><strong>${escapeHtml(x.name)}</strong><span>${escapeHtml(x.source)}${x.published?` · ${escapeHtml(x.published)}`:""}</span></div>`).join("")}</div></section>
    <div class="grid three compact-gap">${Object.entries(counts).map(([k,v])=>metric(k, v == null ? "Not loaded" : v)).join("")}</div>
    <section class="card compact-gap"><div class="section-head"><div><div class="section-title">Characters on this device</div><div class="mini">Character state is independent of 5etools rules data.</div></div><button class="button button-small button-primary" data-action="new-character">New character</button></div><div class="character-list">${chars.map(ch=>`<div class="character-row ${ch.id===state.character.id?"current":""}"><button class="character-select" data-action="switch-character" data-id="${ch.id}"><strong>${escapeHtml(ch.name)}</strong><span>${escapeHtml([ch.species?.name,ch.class?.name,ch.subclass?.name,`Level ${ch.level}`].filter(Boolean).join(" · "))}</span></button>${ch.id!==state.character.id?`<button class="icon-button" data-action="delete-character" data-id="${ch.id}">×</button>`:""}</div>`).join("")}</div></section>
    <section class="card compact-gap"><div class="section-title">Storage model</div><p class="note">The app caches versioned 5etools JSON on the device, stores character state separately, and can continue running without a network connection after synchronization. A rules-data update does not replace your character.</p><p class="mini">Data source: ${escapeHtml(REPO)} · 2024 sources detected automatically</p></section>`;
  bindEvents();
}
function csv(value){return value||"";}

function bindEvents() {
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
        if (action === "export") return exportCharacter();
        if (action === "import") return openImport();
        if (action === "hp") { const delta = Number(el.dataset.delta || 0); const d = await deriveCharacter(); const before = Number(state.character.hpCurrent || 0); const next = Math.max(0, Math.min(d.maxHp, before + delta)); state.character.hpCurrent = next; state.character.hpAuto = false; if (next > 0 && before === 0) state.character.deathSaves = { success: 0, failure: 0 }; await saveCharacter(); return render(); }
        if (action === "temp-hp") { const value = prompt("Temporary hit points", String(state.character.tempHp || 0)); if (value !== null) { state.character.tempHp = Math.max(0, Number(value || 0)); await saveCharacter(); return render(); } return; }
        if (action === "heroic") { state.character.heroicInspiration = !state.character.heroicInspiration; await saveCharacter(); return render(); }
        if (action === "concentration") { const value = prompt("Concentration spell (leave blank to clear)", state.character.concentration || ""); if (value !== null) { state.character.concentration = value.trim() || null; await saveCharacter(); return render(); } return; }
        if (action === "exhaustion") { state.character.exhaustion = clamp(Number(state.character.exhaustion || 0) + Number(el.dataset.delta || 0), 0, 6); await saveCharacter(); return render(); }
        if (action === "hitdie") { const idx = Number(el.dataset.index); state.character.hitDiceUsed = idx < state.character.hitDiceUsed ? idx : Math.min(state.character.level, idx + 1); await saveCharacter(); return render(); }
        if (action === "slot") { const level = Number(el.dataset.level); const cap = Number(state.lastDerived?.spellSlots?.[level - 1] || 0); const current = countSlotUsed(state.character, level); const idx = Number(el.dataset.index); setSlotUsed(state.character, level, idx < current ? idx : Math.min(cap, idx + 1)); await saveCharacter(); return render(); }
        if (action === "death") { const type = el.dataset.type; state.character.deathSaves[type] = Math.min(3, Number(state.character.deathSaves[type] || 0) + 1); await saveCharacter(); return render(); }
        if (action === "death-reset") { state.character.deathSaves = { success: 0, failure: 0 }; await saveCharacter(); return render(); }
        if (action === "condition") { toggleArray(state.character.conditions, el.dataset.condition); await saveCharacter(); return render(); }
        if (action === "clear-conditions") { state.character.conditions = []; await saveCharacter(); return render(); }
        if (action === "feature") { const f = findFeatureByButton(el); if (f) return openFeatureModal(f); }
        if (action === "feat-detail") { const ref = splitRefId(decodeURIComponent(el.dataset.name || "")); const feat = findFeat(ref.name, ref.source || null); if (feat) return openFeatModal(feat); }
        if (action === "species-detail") { if (state.lastDerived?.speciesObj) return openModal(state.lastDerived.speciesObj.name, `<div class="modal-kicker">${escapeHtml(sourceLabel(state.lastDerived.speciesObj.source))}</div><div class="rules-text formatted-rules">${renderRichEntries(state.lastDerived.speciesObj.entries)}</div>`); }
        if (action === "spell" || action === "spell-info") { const ref = splitRefId(decodeURIComponent(el.dataset.spell || "")); const s = spellById(normalizeRefId(ref.name, ref.source || DATA_SOURCE)); if (s) return openSpellModal(s); }
        if (action === "item-picker") return openItemPicker();
        if (action === "item-info") return openInventoryItemInfo(Number(el.dataset.index));
        if (action === "toggle-equipped") { const i = Number(el.dataset.index); const item = state.character.inventory[i]; if (!item) return; item.equipped = !item.equipped; await saveCharacter(); return render(); }
        if (action === "remove-item") { state.character.inventory.splice(Number(el.dataset.index),1); await saveCharacter(); return render(); }
        if (action === "qty-minus") { adjustItemQty(Number(el.dataset.index), -1); return; }
        if (action === "qty-plus") { adjustItemQty(Number(el.dataset.index), 1); return; }
        if (action === "add-resource") { state.character.resources.push({ name: "Resource", current: 0, max: 1, recharge: "long" }); await saveCharacter(); return render(); }
        if (action === "remove-resource") { state.character.resources.splice(Number(el.dataset.index),1); await saveCharacter(); return render(); }
        if (action === "manage-resources") return openResourceManager();
        if (action === "manage-attacks") return openAttackManager();
        if (action === "remove-attack") { state.character.attacks.splice(Number(el.dataset.index),1); await saveCharacter(); return render(); }
        if (action === "species-trait") { const trait = (state.lastDerived?.speciesObj?.entries || []).find(x => x?.name === decodeURIComponent(el.dataset.name || "")); if (trait) return openModal(trait.name, `<div class="rules-text formatted-rules">${renderRichEntries(trait.entries)}</div>`); }
        if (action === "resource-pip") { const i = Number(el.dataset.resource); const resource = state.character.resources[i]; if (!resource) return; const used = idxUsed(resource.max, Number(el.dataset.index)); resource.current = Math.max(0, resource.max - used); await saveCharacter(); return render(); }
        if (action === "rest-short") return shortRest();
        if (action === "rest-long") return longRest();
        if (action === "new-character") { await createCharacter(); state.view = "builder"; return render(); }
        if (action === "switch-character") { await switchCharacter(el.dataset.id); return; }
        if (action === "delete-character") { if (confirm("Delete this character from this device?")) await deleteCharacter(el.dataset.id); return; }
        if (action === "apply-standard-array") { applyStandardArray(); return; }
        if (action === "apply-point-buy") { applyPointBuyDefault(); return; }
        if (action === "add-manual") { const list = el.dataset.list; const input = document.querySelector(`[data-manual-input="${list}"]`); const value = input?.value.trim(); if (value) { if (!Array.isArray(state.character[list])) state.character[list]=[]; if (!state.character[list].some(x=>x.toLowerCase()===value.toLowerCase())) state.character[list].push(value); input.value=""; await saveCharacter(); return render(); } return; }
        if (action === "add-language-choice") { const select=document.querySelector("#languagePicker"); const ref=splitRefId(select?.value||""); const lang=findLanguage(ref.name, ref.source||null); if(lang){ if(!state.character.languageChoices.some(x=>x.toLowerCase()===lang.name.toLowerCase())) state.character.languageChoices.push(lang.name); await saveCharacter(); return render(); } return; }
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
      if (["background","bgPlus2","bgPlus1","species","class","subclass","feat","level"].includes(key)) render();
    };
  });
  document.querySelectorAll("[data-stat]").forEach(el => el.onchange = async () => { state.character.baseStats[el.dataset.stat] = clamp(Number(el.value),1,30); await saveCharacter(); render(); });
  document.querySelectorAll("[data-feat-ability]").forEach(el => el.onchange = async () => { state.character.featAbilityChoices[el.dataset.featAbility] = el.value; await saveCharacter(); render(); });
  document.querySelectorAll("[data-feat-save]").forEach(el => el.onchange = async () => { state.character.featSaveChoices[el.dataset.featSave] = el.value; await saveCharacter(); render(); });
  document.querySelectorAll("[data-class-skill]").forEach(el => el.onchange = async () => { const arr=state.character.classSkillChoices; toggleArray(arr,normalizeSkillKey(el.dataset.classSkill),el.checked); const max=state.lastDerived?.skillChoiceSpec?.count||0; if(arr.length>max){arr.splice(arr.indexOf(el.dataset.classSkill),1);el.checked=false;showToast(`Choose only ${max} class skills.`);return;} await saveCharacter(); render(); });
  document.querySelectorAll("[data-custom-skill]").forEach(el => el.onchange = async () => { toggleArray(state.character.customSkillProficiencies, normalizeSkillKey(el.dataset.customSkill), el.checked); await saveCharacter(); render(); });
  document.querySelectorAll("[data-expertise]").forEach(el => el.onchange = async () => { toggleArray(state.character.expertise, normalizeSkillKey(el.dataset.expertise), el.checked); await saveCharacter(); render(); });
  document.querySelectorAll("[data-spell-toggle]").forEach(el => el.onchange = async () => toggleSpellCollection(el.dataset.spellToggle, el.checked));
  document.querySelectorAll("[data-spell-tab]").forEach(el => el.onclick = () => { state.spellPickerTab = el.dataset.spellTab; render(); });
  const search = document.querySelector("#spellSearch"); const level = document.querySelector("#spellLevel");
  if (search) search.oninput = () => updateSpellResultFilter(); if (level) level.onchange = () => updateSpellResultFilter();
  document.querySelectorAll("[data-currency]").forEach(el => el.onchange = async () => { state.character.currency[el.dataset.currency] = Math.max(0, Number(el.value || 0)); await saveCharacter(); });
  const classSelect = document.querySelector('[data-builder="class"]');
  if (classSelect) classSelect.onchange = async () => { await readBuilder(); state.character.subclass=null; await saveCharacter(); await populateSubclasses(splitRefId(classSelect.value).name, null); render(); };
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
  for (const key of ["species","background","class","subclass","feat"]) {
    if (!get(key)) continue;
    const ref = splitRefId(get(key).value);
    c[key] = ref.name ? { name: ref.name, source: ref.source || DATA_SOURCE } : null;
  }
  c.feats = c.feat ? [c.feat] : [];
  if (get("bgPlus2")) c.backgroundAbility.plus2 = get("bgPlus2").value || null;
  if (get("bgPlus1")) c.backgroundAbility.plus1 = get("bgPlus1").value || null;
  if (c.backgroundAbility.plus2 && c.backgroundAbility.plus2 === c.backgroundAbility.plus1) c.backgroundAbility.plus1 = null;
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
  c.feats = c.feat ? [c.feat] : [];
  if (c.class?.name) {
    const file = await getClassDetails(c.class.name);
    const obj = getClassFromFile(file, c.class.name, c.class.source || null);
    const spec = skillChoiceSpec(obj);
    c.classSkillChoices = normalizeSkillArray(c.classSkillChoices).filter(x => spec.from.includes(x)).slice(0, spec.count);
  }
  if (get("acOverride")) c.acOverride = get("acOverride").value === "" ? null : Number(get("acOverride").value);
  if (get("speedOverride")) c.speedOverride = get("speedOverride").value === "" ? null : Number(get("speedOverride").value);
  if (get("hpMaxOverride")) c.hpMaxOverride = get("hpMaxOverride").value === "" ? null : Number(get("hpMaxOverride").value);
  if (get("hpCurrent")) { c.hpCurrent = get("hpCurrent").value === "" ? null : Number(get("hpCurrent").value); c.hpAuto = get("hpCurrent").value === ""; }
  if (get("tempHp")) c.tempHp = Math.max(0, Number(get("tempHp").value || 0));
  if (get("notes")) c.notes = get("notes").value;
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
    <input class="editor-name" data-resource-name="${i}" value="${escapeHtml(r.name || "Resource")}" aria-label="Resource name">
    <input type="number" min="0" max="99" data-resource-max="${i}" value="${Number(r.max || 0)}" aria-label="Resource maximum">
    <input type="number" min="0" max="99" data-resource-current="${i}" value="${Number(r.current || 0)}" aria-label="Current resource">
    <select data-resource-recharge="${i}" aria-label="Recharge"><option value="" ${!r.recharge?"selected":""}>Manual</option><option value="short" ${r.recharge==="short"?"selected":""}>Short rest</option><option value="long" ${r.recharge==="long"?"selected":""}>Long rest</option></select>
    <button class="icon-button" data-resource-delete="${i}" title="Remove">×</button>
  </div>`).join("") || `<div class="empty">No resources. Add one below.</div>`;
  openModal("Manage resources", `<div class="editor-head"><span>Name</span><span>Max</span><span>Current</span><span>Recharge</span><span></span></div><div id="resourceEditor" class="editor-list">${renderRows()}</div><button class="button button-primary" data-resource-add style="margin-top:12px">Add resource</button>`);
  const wire = () => {
    const root = document.querySelector("#resourceEditor");
    if (!root) return;
    root.querySelectorAll("[data-resource-name]").forEach(el => el.oninput = () => { resources[Number(el.dataset.resourceName)].name = el.value; saveCharacter(); });
    root.querySelectorAll("[data-resource-max]").forEach(el => el.onchange = () => { const r=resources[Number(el.dataset.resourceMax)]; r.max=Math.max(0,Number(el.value||0)); r.current=Math.min(r.current||0,r.max); saveCharacter(); renderResourceManager(); });
    root.querySelectorAll("[data-resource-current]").forEach(el => el.onchange = () => { const r=resources[Number(el.dataset.resourceCurrent)]; r.current=Math.max(0,Math.min(r.max,Number(el.value||0))); saveCharacter(); renderResourceManager(); });
    root.querySelectorAll("[data-resource-recharge]").forEach(el => el.onchange = () => { resources[Number(el.dataset.resourceRecharge)].recharge = el.value || ""; saveCharacter(); });
    root.querySelectorAll("[data-resource-delete]").forEach(el => el.onclick = () => { resources.splice(Number(el.dataset.resourceDelete),1); saveCharacter(); renderResourceManager(); });
    document.querySelector("[data-resource-add]")?.addEventListener("click", () => { resources.push({name:"Resource",max:1,current:0,recharge:"long"}); saveCharacter(); renderResourceManager(); });
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
    const items = officialEntries(data, "item").sort((a,b)=>a.name.localeCompare(b.name));
    openModal("Add 2024 item", `<div class="spell-toolbar"><input id="itemSearch" type="search" placeholder="Search items…"></div><div id="itemResults" class="spell-results"></div>`);
    const rerender = () => {
      const q = (document.querySelector("#itemSearch")?.value || "").toLowerCase().trim();
      const list = items.filter(i=>!q||i.name.toLowerCase().includes(q)).slice(0,300);
      const root = document.querySelector("#itemResults"); if(!root)return;
      root.innerHTML = list.map((it,i)=>`<div class="spell-row"><div><strong>${escapeHtml(it.name)}</strong><div class="spell-meta">${escapeHtml(it.type || "Item")}</div></div><button class="button button-small button-primary" data-add-item="${i}">Add</button><button class="button button-small" data-item-detail="${i}">Info</button></div>`).join("")||`<div class="empty">No matching items.</div>`;
      root.querySelectorAll("[data-add-item]").forEach(btn=>btn.onclick=async()=>{const it=list[Number(btn.dataset.addItem)]; if(!it)return; addInventoryItem(it); closeModal(); state.view="equipment"; render();});
      root.querySelectorAll("[data-item-detail]").forEach(btn=>btn.onclick=()=>{const it=list[Number(btn.dataset.itemDetail)]; if(it)openModal(it.name,`<div class="modal-kicker">${escapeHtml(sourceLabel(it.source))} · ${escapeHtml(it.type||"")}</div><div class="rules-text formatted-rules">${renderRichEntries(it.entries)}</div>`);});
    };
    document.querySelector("#itemSearch").oninput=rerender; rerender();
  } catch(e){showToast(`Items could not be loaded: ${e.message}`);}
}
function addInventoryItem(it){const existing=state.character.inventory.find(x=>x.name===it.name&&x.source===it.source);if(existing)existing.quantity=Number(existing.quantity||1)+1;else state.character.inventory.push({name:it.name,source:it.source,quantity:1,equipped:false});saveCharacter();}
function adjustItemQty(i,delta){const item=state.character.inventory[i];if(!item)return;item.quantity=Number(item.quantity||1)+delta;if(item.quantity<=0)state.character.inventory.splice(i,1);saveCharacter().then(render);}
async function openInventoryItemInfo(i){const item=state.character.inventory[i];if(!item)return;const data=await getItemsData();const found=officialEntries(data,"item").find(x=>x.name===item.name&&x.source===item.source)||officialEntries(data,"item").find(x=>x.name===item.name);if(found)openModal(found.name,`<div class="modal-kicker">${escapeHtml(sourceLabel(found.source))} · ${escapeHtml(found.type||"")}</div><div class="rules-text formatted-rules">${renderRichEntries(found.entries)}</div>`);}

function updateSpellResultFilter(){
  const spells = officialEntries(state.data.spells,"spell").sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name));
  const maxSpellLevel = Math.max(0, Number(state.character.level || 1));
  const available = spells.filter(s => s.level === 0 || s.level <= maxSpellLevel).slice(0,1000);
  renderSpellResults(available);
}
async function toggleSpellCollection(id, checked){
  const listName = state.spellPickerTab === "prepared" ? "preparedSpells" : state.spellPickerTab === "cantrips" ? "cantrips" : state.spellPickerTab === "spellbook" ? "spellbook" : "knownSpells";
  const list = state.character[listName];
  const lower=id.toLowerCase();
  const idx=list.findIndex(x=>String(x).toLowerCase()===lower);
  const s=spellById(id);
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
  ABILITIES.forEach((a,i)=>state.character.baseStats[a]=STANDARD_ARRAY[i]);saveCharacter().then(render);
}
function applyPointBuyDefault(){
  const values=[15,14,13,12,10,8];ABILITIES.forEach((a,i)=>state.character.baseStats[a]=values[i]);saveCharacter().then(render);showToast("Loaded the 27-point-buy baseline (15, 14, 13, 12, 10, 8). Adjust individual scores as needed.");
}
function shortRest(){
  const c=state.character;c.deathSaves={success:0,failure:0};for(const r of c.resources){if(r.recharge==="short")r.current=r.max;}saveCharacter().then(()=>{showToast("Short rest recorded.");render();});
}
function longRest(){
  const c=state.character;
  c.hpCurrent=state.lastDerived?.maxHp??c.hpCurrent;
  c.hpAuto=false;
  c.tempHp=0;
  const totalHitDice=Math.max(1, Number(c.level||1));
  c.hitDiceUsed=Math.max(0, Number(c.hitDiceUsed||0)-Math.ceil(totalHitDice/2));
  c.deathSaves={success:0,failure:0};
  c.spellSlotsUsed=[];
  c.exhaustion=Math.max(0, Number(c.exhaustion||0)-1);
  c.concentration=null;
  for(const r of c.resources){if(r.recharge==="short"||r.recharge==="long")r.current=r.max;}
  saveCharacter().then(()=>{showToast("Long rest recorded. HP, spell slots, hit dice, and exhaustion updated.");render();});
}

window.addEventListener("online",()=>{state.online=true;updateHeader();showToast("Back online.");});
window.addEventListener("offline",()=>{state.online=false;updateHeader();showToast("Offline mode. Cached rules data remains available.");});
window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();state.deferredInstallPrompt=event;updateHeader();});
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{state.view=btn.dataset.view;render();}));
document.querySelector("#updateBtn")?.addEventListener("click",()=>syncData(true));
document.querySelector("#installBtn")?.addEventListener("click",async()=>{if(!state.deferredInstallPrompt)return;state.deferredInstallPrompt.prompt();await state.deferredInstallPrompt.userChoice;state.deferredInstallPrompt=null;updateHeader();});

document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&state.online&&state.version&&Date.now()-Number(state.lastReleaseCheck||0)>6*60*60*1000)syncData(false);});

async function init(){
  await loadCharacter();
  if(state.version){
    try { await loadVersion(state.version); } catch(e){console.warn("Cached data load failed",e);}
  }
  updateHeader();
  render();
  if(state.online) await syncData(false);
  if("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then(reg=>reg.update()).catch(console.warn);
  }
}

init().catch(err=>{console.error(err);showToast(`Startup error: ${err.message}`);});
