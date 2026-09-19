const REPO = "5etools-mirror-3/5etools-src";
const GITHUB_RELEASE_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const RAW_ROOT = `https://raw.githubusercontent.com/${REPO}`;
const DATA_SOURCE = "XPHB";
const APP_VERSION = "0.4.0";

const PATHS = {
  classIndex: "data/class/index.json",
  races: "data/races.json",
  backgrounds: "data/backgrounds.json",
  feats: "data/feats.json",
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
  data: { classIndex: null, races: null, backgrounds: null, feats: null, spells: null, items: null, classFiles: new Map() },
  character: null,
  deferredInstallPrompt: null,
  spellPickerTab: "prepared",
  lastDerived: null,
};

const DB_NAME = "dnd-2024-5etools-sheet";
const DB_VERSION = 3;
let dbPromise;

function emptyCharacter() {
  return {
    schema: 2,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: "New Character",
    player: "",
    level: 1,
    class: null,
    subclass: null,
    species: null,
    background: null,
    feat: null,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    classSkillChoices: [],
    customSkillProficiencies: [],
    expertise: [],
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
  c.schema = 2;
  c.stats = { ...base.stats, ...(raw.stats || {}) };
  c.deathSaves = { ...base.deathSaves, ...(raw.deathSaves || {}) };
  c.currency = { ...base.currency, ...(raw.currency || {}) };
  c.backgroundAbility = { ...base.backgroundAbility, ...(raw.backgroundAbility || {}) };
  c.classSkillChoices = Array.isArray(raw.classSkillChoices) ? raw.classSkillChoices : [];
  c.customSkillProficiencies = Array.isArray(raw.customSkillProficiencies)
    ? raw.customSkillProficiencies
    : (Array.isArray(raw.skillProficiencies) ? raw.skillProficiencies : []);
  c.expertise = Array.isArray(raw.expertise) ? raw.expertise : [];
  c.conditions = Array.isArray(raw.conditions) ? raw.conditions : [];
  c.spellbook = Array.isArray(raw.spellbook) ? raw.spellbook : [];
  c.knownSpells = Array.isArray(raw.knownSpells) ? raw.knownSpells : [];
  c.preparedSpells = Array.isArray(raw.preparedSpells) ? raw.preparedSpells : [];
  c.cantrips = Array.isArray(raw.cantrips) ? raw.cantrips : [];
  c.inventory = Array.isArray(raw.inventory) ? raw.inventory : [];
  c.resources = Array.isArray(raw.resources) ? raw.resources : [];
  c.attacks = Array.isArray(raw.attacks) ? raw.attacks : [];
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

function xphbEntries(json, prop) {
  return Array.isArray(json?.[prop]) ? json[prop].filter(x => x && x.source === DATA_SOURCE) : [];
}

async function loadCoreData(version) {
  const [classIndex, races, backgrounds, feats, spellIndex] = await Promise.all([
    fetch5eData(version, PATHS.classIndex),
    fetch5eData(version, PATHS.races),
    fetch5eData(version, PATHS.backgrounds),
    fetch5eData(version, PATHS.feats),
    fetch5eData(version, PATHS.spellIndex),
  ]);
  const spellFile = spellIndex?.[DATA_SOURCE];
  if (!spellFile) throw new Error("The 5etools release has no XPHB spell index entry.");
  const spells = await fetch5eData(version, `data/spells/${spellFile}`);
  return { classIndex, races, backgrounds, feats, spells, items: null, classFiles: new Map() };
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

function findXphb(arr, name) {
  const needle = String(name || "").trim().toLowerCase();
  return (arr || []).find(x => x && String(x.name || "").toLowerCase() === needle && x.source === DATA_SOURCE) || null;
}

function getClassFromFile(file, name) {
  return findXphb(file?.class, name) || file?.class?.find(x => x.name === name) || null;
}

function getSubclassOptions(file, className) {
  return (file?.subclass || []).filter(s => s.className === className && s.source === DATA_SOURCE && s.classSource === DATA_SOURCE).sort((a, b) => a.name.localeCompare(b.name));
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
    const matches = all.filter(f => f.name === ref.name && f.className === classObj.name && Number(f.level) === ref.level);
    return matches.find(f => f.source === DATA_SOURCE) || matches.find(f => f.source === ref.source) || matches[0];
  }).filter(f => f && f.level <= level && f.source === DATA_SOURCE);
}

function getSubclassFeatures(file, subclassObj, level) {
  if (!subclassObj) return [];
  return (file?.subclassFeature || []).filter(f =>
    f.source === DATA_SOURCE &&
    f.className === subclassObj.className &&
    f.classSource === DATA_SOURCE &&
    f.subclassShortName === subclassObj.shortName &&
    f.subclassSource === DATA_SOURCE &&
    Number(f.level) <= level
  );
}

function entriesToText(entries) {
  if (entries == null) return "";
  if (typeof entries === "string") return stripTags(entries);
  if (typeof entries === "number" || typeof entries === "boolean") return String(entries);
  if (Array.isArray(entries)) return entries.map(entriesToText).filter(Boolean).join(" ");
  if (typeof entries === "object") {
    if (entries.entry) return `${entries.name ? `${entries.name}: ` : ""}${entriesToText(entries.entry)}`;
    if (entries.entries) return `${entries.name ? `${entries.name}: ` : ""}${entriesToText(entries.entries)}`;
    if (entries.items) return entriesToText(entries.items);
    const parts = [];
    if (entries.name && entries.type !== "table") parts.push(`${entries.name}:`);
    for (const [key, value] of Object.entries(entries)) {
      if (["name", "type", "style", "colLabels", "colStyles", "rows", "id"].includes(key)) continue;
      const text = entriesToText(value);
      if (text) parts.push(text);
    }
    return parts.join(" ");
  }
  return "";
}

function stripTags(text) {
  let out = String(text);
  for (let i = 0; i < 8; i++) {
    out = out.replace(/\{@([\w-]+)\s+([^{}]*)\}/g, (_, tag, body) => {
      const parts = body.split("|");
      if (tag === "dice" || tag === "damage") return parts[1] || parts[0];
      return parts[2] || parts[1] || parts[0] || tag;
    });
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
  return choose ? { from: choose.from || [], count: Number(choose.count || 1) } : { from: [], count: 0 };
}
function grantedSkillsFromMap(mapList) {
  const out = new Set();
  for (const obj of mapList || []) for (const [skill, enabled] of Object.entries(obj || {})) if (enabled) out.add(skill);
  return [...out];
}
function backgroundAbilitySpec(bg) {
  const entries = Array.isArray(bg?.ability) ? bg.ability : [];
  const choices = entries.map((entry, index) => {
    const choose = entry?.choose;
    if (!choose) return null;
    const weighted = choose.weighted;
    const from = weighted?.from || choose.from || [];
    const amount = weighted?.weights?.includes(2) ? 2 : Number(choose.amount || 1);
    return { index, from, amount };
  }).filter(Boolean);
  const fallback = choices.length ? choices : [];
  return {
    choices: fallback,
    plus2From: fallback.find(x => x.amount === 2)?.from || [],
    plus1From: fallback.find(x => x.amount === 1)?.from || [],
  };
}
function backgroundFeatNames(bg) {
  const feats = bg?.feats || [];
  const names = [];
  for (const obj of feats) {
    if (!obj || typeof obj !== "object") continue;
    for (const key of Object.keys(obj)) names.push(key.split("|")[0].split(";")[0].trim());
  }
  return [...new Set(names)];
}
function findBackground(name) { return findXphb(state.data.backgrounds?.background, name); }
function findSpecies(name) { return findXphb(state.data.races?.race, name); }
function findFeat(name) { return findXphb(state.data.feats?.feat, name); }

function calcAutoAc(c, mods, itemsData = null) {
  const inventory = Array.isArray(c.inventory) ? c.inventory : [];
  const equipped = inventory.filter(x => x && x.equipped && x.name);
  if (!itemsData || !equipped.length) return 10 + mods.dex;
  const items = xphbEntries(itemsData, "item");
  const resolved = equipped.map((owned, index) => {
    const found = items.find(it => it.name === owned.name && it.source === (owned.source || DATA_SOURCE)) || items.find(it => it.name === owned.name);
    return found ? { owned, item: found, index } : null;
  }).filter(Boolean);
  const armor = resolved.filter(({ item }) => /^(LA|MA|HA)(\||$)/.test(String(item.type || "")));
  const shields = resolved.filter(({ item }) => /^S(\||$)/.test(String(item.type || "")));
  let best = 10 + mods.dex;
  if (armor.length) {
    for (const { item } of armor) {
      let base = Number(item.ac);
      if (!Number.isFinite(base)) continue;
      const bonus = Number.parseInt(String(item.bonusAc || "0"), 10) || 0;
      let dex = 0;
      const type = String(item.type || "");
      if (/^LA(\||$)/.test(type)) dex = mods.dex;
      else if (/^MA(\||$)/.test(type)) {
        const cap = Number(item.dexterityMax ?? item.dexMax ?? 2);
        dex = Math.min(mods.dex, Number.isFinite(cap) ? cap : 2);
      }
      const candidate = base + bonus + dex;
      if (candidate > best) best = candidate;
    }
  }
  if (shields.length) {
    const shieldAc = Math.max(...shields.map(({ item }) => Number(item.ac || 0) + (Number.parseInt(String(item.bonusAc || "0"), 10) || 0)));
    best += shieldAc;
  }
  return best;
}

async function deriveCharacter() {
  const c = state.character;
  const mods = Object.fromEntries(ABILITIES.map(a => [a, abilityMod(c.stats[a])]));
  const d = {
    mods,
    pb: proficiencyBonus(c.level),
    classFile: null,
    classObj: null,
    subclassObj: null,
    subclassOptions: [],
    speciesObj: findSpecies(c.species?.name),
    backgroundObj: findBackground(c.background?.name),
    featObj: findFeat(c.feat?.name),
    classFeatures: [],
    subclassFeatures: [],
    skillProficiencies: new Set(),
    skillChoiceSpec: { from: [], count: 0 },
    maxHp: 1,
    currentHp: Number(c.hpCurrent ?? 0),
    ac: Number(c.acOverride ?? (10 + mods.dex)),
    acAutomatic: true,
    speed: Number(c.speedOverride ?? findSpecies(c.species?.name)?.speed ?? 30),
    spellcastingAbility: null,
    spellSlots: [],
    maxPrepared: null,
    knownSpells: null,
    cantrips: null,
    inventoryWeight: 0,
  };
  if (c.class?.name) {
    d.classFile = await getClassDetails(c.class.name);
    d.classObj = getClassFromFile(d.classFile, c.class.name);
    d.subclassOptions = getSubclassOptions(d.classFile, c.class.name);
    d.subclassObj = d.subclassOptions.find(s => s.name === c.subclass?.name && s.source === DATA_SOURCE) || null;
    d.classFeatures = getClassFeatures(d.classFile, d.classObj, c.level);
    d.subclassFeatures = getSubclassFeatures(d.classFile, d.subclassObj, c.level);
    d.skillChoiceSpec = skillChoiceSpec(d.classObj);
    d.spellcastingAbility = d.classObj?.spellcastingAbility || null;
    d.spellSlots = classSpellSlots(d.classObj, c.level);
    d.cantrips = classCantrips(d.classObj, c.level);
    d.maxPrepared = classPrepared(d.classObj, c.level, mods);
    d.knownSpells = classKnownSpells(d.classObj, c.level);
  }
  if (c.acOverride == null && Array.isArray(c.inventory) && c.inventory.some(x => x?.equipped)) {
    try {
      const itemsData = await getItemsData();
      d.ac = calcAutoAc(c, mods, itemsData);
    } catch (error) {
      console.warn("Equipment AC calculation unavailable", error);
    }
  } else if (c.acOverride != null) {
    d.ac = Number(c.acOverride);
    d.acAutomatic = false;
  }
  const bgSkills = grantedSkillsFromMap(d.backgroundObj?.skillProficiencies);
  for (const s of bgSkills) d.skillProficiencies.add(s);
  for (const s of c.classSkillChoices) d.skillProficiencies.add(s);
  for (const s of c.customSkillProficiencies) d.skillProficiencies.add(s);
  for (const s of d.speciesObj?.skillProficiencies ? grantedSkillsFromMap(d.speciesObj.skillProficiencies) : []) d.skillProficiencies.add(s);
  d.maxHp = defaultMaxHp(d.classObj, c.level, mods.con, c.hpMaxOverride);
  if (c.hpAuto || c.hpCurrent == null) { c.hpCurrent = d.maxHp; d.currentHp = d.maxHp; c.hpAuto = true; await saveCharacter(); }
  if (d.currentHp > d.maxHp && c.hpMaxOverride == null) { d.currentHp = d.maxHp; c.hpCurrent = d.maxHp; await saveCharacter(); }
  state.lastDerived = d;
  return d;
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
  return `<div class="card empty-state"><div class="empty-icon">◆</div><h2>Sync 5etools to begin</h2><p>The first sync downloads the 2024 XPHB player data to this device. After that, the character sheet can work offline.</p><button class="button button-primary" data-action="sync">Sync 5etools</button></div>`;
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
  const classLine = [c.species?.name, c.class?.name, c.subclass?.name, c.background?.name].filter(Boolean).join(" · ");
  const saves = ABILITIES.map(a => {
    const prof = d.classObj?.proficiency?.map(String).map(x => x.toLowerCase()).includes(a);
    return `<div class="list-row"><span class="name">${ABILITY_LABELS[a]} ${prof ? "●" : "○"}</span><span class="value">${formatMod(d.mods[a] + (prof ? d.pb : 0))}</span></div>`;
  }).join("");
  const skills = Object.entries(SKILLS).map(([key,[ability,name]]) => {
    const prof = d.skillProficiencies.has(key), exp = c.expertise.includes(key);
    const bonus = d.mods[ability] + (prof ? d.pb : 0) + (exp ? d.pb : 0);
    return `<div class="skill-line"><span><span class="dot ${prof ? "on" : ""}"></span>${escapeHtml(name)}</span><strong>${formatMod(bonus)}</strong></div>`;
  }).join("");
  const features = [...d.classFeatures.map(f => ({ ...f, sourceKind: "Class" })), ...d.subclassFeatures.map(f => ({ ...f, sourceKind: "Subclass" }))]
    .sort((a,b) => Number(a.level) - Number(b.level) || a.name.localeCompare(b.name))
    .map(f => `<button class="feature" data-action="feature" data-name="${encodeURIComponent(f.name)}" data-kind="${f.sourceKind}"><div class="feature-top"><strong>${escapeHtml(f.name)}</strong><span>Lv ${f.level}</span></div><div class="feature-preview">${escapeHtml(entriesToText(f.entries).slice(0, 190))}${entriesToText(f.entries).length > 190 ? "…" : ""}</div></button>`).join("");
  const prepared = c.preparedSpells.map(spellId => spellById(spellId)).filter(Boolean).sort((a,b) => a.level - b.level || a.name.localeCompare(b.name));
  const cantrips = c.cantrips.map(spellId => spellById(spellId)).filter(Boolean).sort((a,b) => a.name.localeCompare(b.name));
  const spellbook = c.spellbook.map(spellId => spellById(spellId)).filter(Boolean).sort((a,b) => a.level - b.level || a.name.localeCompare(b.name));
  const known = c.knownSpells.map(spellId => spellById(spellId)).filter(Boolean).sort((a,b) => a.level - b.level || a.name.localeCompare(b.name));
  const conditions = CONDITIONS.map(x => `<button class="chip ${c.conditions.includes(x) ? "selected" : ""}" data-action="condition" data-condition="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join("");
  const resourceCards = c.resources.length ? c.resources.map((r,i) => `<div class="resource-card"><div class="resource-head"><strong>${escapeHtml(r.name || "Resource")}</strong><button class="icon-button" data-action="remove-resource" data-index="${i}">×</button></div><div class="resource-meta">${Number(r.current || 0)} / ${Number(r.max || 0)}${r.recharge ? ` · ${escapeHtml(r.recharge)} rest` : ""}</div>${pipBar(Number(r.max || 0), Number(r.max || 0) - Number(r.current || 0), "resource-pip", { resource: i })}</div>`).join("") : `<div class="empty">No class resources configured yet.</div>`;
  const attacks = (c.attacks || []).map((a,i) => `<div class="attack-row"><div><strong>${escapeHtml(a.name || "Attack")}</strong><span>${escapeHtml(a.attackBonus || "—")} to hit · ${escapeHtml(a.damage || "—")}${a.range ? ` · ${escapeHtml(a.range)}` : ""}</span></div><button class="button button-small" data-action="remove-attack" data-index="${i}">Remove</button></div>`).join("") || `<div class="empty">Add the attacks you actually use at the table.</div>`;
  const speciesTraits = (d.speciesObj?.entries || []).filter(x => x && x.type === "entries" && x.name).slice(0, 8);
  const speciesTraitHtml = speciesTraits.map(t => `<button class="feature" data-action="species-trait" data-name="${encodeURIComponent(t.name)}"><div class="feature-top"><strong>${escapeHtml(t.name)}</strong><span>Species</span></div><div class="feature-preview">${escapeHtml(entriesToText(t.entries).slice(0, 170))}${entriesToText(t.entries).length > 170 ? "…" : ""}</div></button>`).join("");
  const spellAbility = d.spellcastingAbility ? ABILITY_LABELS[d.spellcastingAbility] : "—";
  const spellDc = d.spellcastingAbility ? 8 + d.pb + d.mods[d.spellcastingAbility] : "—";
  const spellAttack = d.spellcastingAbility ? formatMod(d.pb + d.mods[d.spellcastingAbility]) : "—";

  app.innerHTML = `
    ${pageHeader("2024 CHARACTER", c.name || "Unnamed Character", `${classLine || "Build your character"} · Level ${c.level}`, `<button class="button" data-action="builder">Edit</button><button class="button" data-action="character-menu">Characters</button>`)}

    <div class="card identity-card">
      <div class="identity-stats">${ABILITIES.map(a => `<div class="stat"><div class="label">${ABILITY_LABELS[a]}</div><div class="value">${c.stats[a]}</div><div class="mod">${formatMod(d.mods[a])}</div></div>`).join("")}</div>
      <div class="identity-strip"><span>PB <strong>${formatMod(d.pb)}</strong></span><span>Speed <strong>${d.speed} ft</strong></span><span>Hit Die <strong>d${hitDieFaces(d.classObj)}</strong></span><span>${d.spellcastingAbility ? `Spellcasting <strong>${spellAbility}</strong>` : ""}</span></div>
    </div>

    <div class="dashboard-grid">
      <section class="card card-accent"><div class="section-title">Combat</div><div class="big-metrics">
        <div class="big-metric"><span>AC</span><strong>${d.ac}</strong></div>
        <div class="big-metric hp-metric"><span>HP</span><strong>${d.currentHp}<small> / ${d.maxHp}</small></strong><em>${c.tempHp ? `+${c.tempHp} temp` : ""}</em></div>
        <div class="big-metric"><span>Initiative</span><strong>${formatMod(d.mods.dex)}</strong></div>
      </div><div class="quick-actions"><button class="button" data-action="hp" data-delta="-1">−1</button><button class="button" data-action="hp" data-delta="1">+1</button><button class="button" data-action="hp" data-delta="-10">−10</button><button class="button" data-action="hp" data-delta="10">+10</button><button class="button" data-action="rest-short">Short Rest</button><button class="button" data-action="rest-long">Long Rest</button></div></section>
      <section class="card"><div class="section-title">Saving Throws</div><div class="list">${saves}</div></section>
      <section class="card"><div class="section-title">Spellcasting</div><div class="metric-grid">${metric("Spell DC", spellDc)}${metric("Spell Attack", spellAttack)}${metric("Prepared", d.maxPrepared ?? "—")}${metric("Cantrips", d.cantrips ?? "—")}</div><div class="mini" style="margin-top:10px">${d.spellcastingAbility ? `Ability: ${ABILITY_NAMES[d.spellcastingAbility]} · ${c.spellbook.length} in spellbook · ${c.knownSpells.length} known` : "Choose a spellcasting class."}</div></section>
    </div>

    <div class="grid two compact-gap">
      <section class="card"><div class="section-head"><div class="section-title">Skills</div><span class="mini">● proficient · ◎ expertise</span></div><div class="skills-grid">${skills}</div></section>
      <section class="card"><div class="section-head"><div class="section-title">Hit Dice & Death Saves</div><button class="button button-small" data-action="death-reset">Reset saves</button></div><div class="resource-block"><div class="resource-head"><strong>Hit Dice used</strong><span>${c.hitDiceUsed} / ${c.level}</span></div>${pipBar(c.level, c.hitDiceUsed, "hitdie")}</div><div class="resource-block"><div class="resource-head"><strong>Death saves</strong><span>${c.deathSaves.success} success · ${c.deathSaves.failure} failure</span></div><div class="quick-actions"><button class="button button-small" data-action="death" data-type="success">+ Success</button><button class="button button-small" data-action="death" data-type="failure">+ Failure</button></div></div></section>
    </div>

    <div class="grid two compact-gap">
      <section class="card"><div class="section-head"><div class="section-title">Spell Slots</div><button class="button button-small" data-action="spells">Spellbook</button></div>${d.spellSlots.map((n,i) => n ? `<div class="resource-block"><div class="resource-head"><strong>Level ${i+1}</strong><span>${countSlotUsed(c,i+1)} / ${n}</span></div>${pipBar(n, countSlotUsed(c,i+1), "slot", { level: i+1 })}</div>` : "").join("") || `<div class="empty">No spell slots.</div>`}</section>
      <section class="card"><div class="section-head"><div class="section-title">Prepared Spells</div><button class="button button-small button-primary" data-action="spells">Manage</button></div>${prepared.length ? `<div class="spell-chips">${prepared.slice(0, 14).map(s => `<button class="spell-chip" data-action="spell" data-spell="${encodeURIComponent(s.name)}">${escapeHtml(s.name)}</button>`).join("")}</div>${prepared.length > 14 ? `<div class="mini" style="margin-top:8px">+ ${prepared.length - 14} more</div>` : ""}` : `<div class="empty">No prepared spells yet.</div>`}<div class="quick-actions" style="margin-top:10px"><button class="button button-small" data-action="spells-tab" data-spell-tab="cantrips">Cantrips (${cantrips.length}${d.cantrips != null ? `/${d.cantrips}` : ""})</button><button class="button button-small" data-action="spells-tab" data-spell-tab="spellbook">Spellbook (${spellbook.length})</button><button class="button button-small" data-action="spells-tab" data-spell-tab="known">Known (${known.length})</button></div></section>
    </div>

    <div class="grid two compact-gap">
      <section class="card"><div class="section-head"><div class="section-title">Features</div><span class="mini">From 5etools</span></div><div class="feature-grid">${features || `<div class="empty">Choose a class and subclass to load features.</div>`}</div></section>
      <section class="card"><div class="section-head"><div class="section-title">Resources</div><button class="button button-small" data-action="manage-resources">Manage</button></div><div class="resource-grid">${resourceCards}</div></section>
    </div>

    <div class="grid two compact-gap">
      <section class="card"><div class="section-head"><div class="section-title">Attacks</div><button class="button button-small button-primary" data-action="manage-attacks">Manage</button></div><div class="attack-list">${attacks}</div></section>
      <section class="card"><div class="section-head"><div class="section-title">Species & Origin</div><span class="mini">From 5etools</span></div>${speciesTraitHtml || `<div class="empty">Choose a species to see traits here.</div>`}${c.feat?.name ? `<button class="feature" data-action="feat-detail" data-name="${encodeURIComponent(c.feat.name)}"><div class="feature-top"><strong>${escapeHtml(c.feat.name)}</strong><span>Origin Feat</span></div><div class="feature-preview">${escapeHtml(entriesToText(d.featObj?.entries).slice(0,180))}</div></button>` : ""}</section>
    </div>

    <div class="grid two compact-gap">
      <section class="card"><div class="section-head"><div class="section-title">Origin</div><span class="mini">2024 XPHB</span></div>${d.backgroundObj ? `<div class="detail-list"><div><strong>Background</strong><span>${escapeHtml(d.backgroundObj.name)}</span></div><div><strong>Skills</strong><span>${escapeHtml(grantedSkillsFromMap(d.backgroundObj.skillProficiencies).map(k=>SKILLS[k]?.[1]||k).join(", ") || "—")}</span></div><div><strong>Origin feat</strong><span>${escapeHtml(backgroundFeatNames(d.backgroundObj).join(", ") || c.feat?.name || "—")}</span></div><div><strong>Tools</strong><span>${escapeHtml(entriesToText(d.backgroundObj.toolProficiencies) || "—")}</span></div></div>` : `<div class="empty">Choose a background to populate your origin details.</div>`}</section>
      <section class="card"><div class="section-head"><div class="section-title">Species</div><span class="mini">${escapeHtml(d.speciesObj?.name || "Not selected")}</span></div>${d.speciesObj ? `<div class="rules-text rules-preview">${escapeHtml(entriesToText(d.speciesObj.entries).slice(0,900))}${entriesToText(d.speciesObj.entries).length > 900 ? "…" : ""}</div><button class="button button-small" style="margin-top:10px" data-action="species-detail">Full species rules</button>` : `<div class="empty">Choose a species to see its traits here.</div>`}</section>
    </div>

    <section class="card compact-gap"><div class="section-head"><div class="section-title">Conditions</div><div class="quick-actions"><button class="button button-small" data-action="clear-conditions">Clear</button></div></div><div class="chips">${conditions}</div></section>

    <section class="card compact-gap"><div class="section-head"><div class="section-title">Notes</div><span class="mini">Saved automatically</span></div><textarea data-field="notes" rows="6" placeholder="Character notes, reminders, campaign notes…">${escapeHtml(c.notes)}</textarea></section>
  `;
  bindEvents();
}

function countSlotUsed(c, level) { return Math.max(0, Number(c.spellSlotsUsed?.[level - 1] || 0)); }
function setSlotUsed(c, level, value) { if (!Array.isArray(c.spellSlotsUsed)) c.spellSlotsUsed = []; while (c.spellSlotsUsed.length < level) c.spellSlotsUsed.push(0); c.spellSlotsUsed[level - 1] = Math.max(0, Number(value)); }

async function renderBuilder(app) {
  const c = state.character;
  const races = xphbEntries(state.data.races, "race").sort((a,b)=>a.name.localeCompare(b.name));
  const backgrounds = xphbEntries(state.data.backgrounds, "background").sort((a,b)=>a.name.localeCompare(b.name));
  const feats = xphbEntries(state.data.feats, "feat").sort((a,b)=>a.name.localeCompare(b.name));
  const classNames = Object.keys(state.data.classIndex || {}).sort((a,b)=>a.localeCompare(b)).map(x => x.charAt(0).toUpperCase() + x.slice(1));
  const bg = findBackground(c.background?.name);
  const d = await deriveCharacter();
  const bgAbility = backgroundAbilitySpec(bg);
  const bgFeatNames = backgroundFeatNames(bg);
  const availableOriginFeats = bgFeatNames.length ? feats.filter(f => bgFeatNames.some(n => n.toLowerCase() === f.name.toLowerCase())) : feats.filter(x => x.category !== "O" || !x.category);
  const selectedAbility2 = c.backgroundAbility.plus2;
  const selectedAbility1 = c.backgroundAbility.plus1;
  const classSkillChoices = new Set(c.classSkillChoices);
  const classOptions = d.skillChoiceSpec?.from || [];
  const maxClassSkills = d.skillChoiceSpec?.count || 0;
  const pointBuyTotal = ABILITIES.reduce((sum,a)=>sum+(POINT_BUY_COST[Math.max(8, Math.min(15, Number(c.stats[a] || 10)))] ?? 0),0);

  app.innerHTML = `
    ${pageHeader("CHARACTER BUILDER", `Build ${c.name || "your character"}`, "All selectable rules entries are sourced from cached 2024 5etools data.", `<button class="button" data-action="sheet">Character</button><button class="button button-primary" data-action="save-builder">Save</button>`)}

    <section class="card"><div class="section-title">Identity</div><div class="form-grid three">
      <label class="field">Character name<input type="text" data-builder="name" value="${escapeHtml(c.name)}"></label>
      <label class="field">Player<input type="text" data-builder="player" value="${escapeHtml(c.player)}"></label>
      <label class="field">Level<input type="number" min="1" max="20" data-builder="level" value="${c.level}"></label>
      <label class="field">Species<select data-builder="species"><option value="">— Select —</option>${races.map(x=>`<option value="${escapeHtml(x.name)}" ${c.species?.name===x.name?"selected":""}>${escapeHtml(x.name)}</option>`).join("")}</select></label>
      <label class="field">Background<select data-builder="background"><option value="">— Select —</option>${backgrounds.map(x=>`<option value="${escapeHtml(x.name)}" ${c.background?.name===x.name?"selected":""}>${escapeHtml(x.name)}</option>`).join("")}</select></label>
      <label class="field">Class<select data-builder="class"><option value="">— Select —</option>${classNames.map(x=>`<option value="${escapeHtml(x)}" ${c.class?.name===x?"selected":""}>${escapeHtml(x)}</option>`).join("")}</select></label>
      <label class="field">Subclass<select data-builder="subclass" id="subclassSelect"><option value="">${c.class ? "Loading…" : "Choose a class first"}</option></select></label>
    </div></section>

    <section class="card compact-gap"><div class="section-head"><div><div class="section-title">Ability scores</div><div class="mini">The sheet stores final scores; background increases are tracked separately below.</div></div><div class="quick-actions"><button class="button button-small" data-action="apply-standard-array">Standard array</button><button class="button button-small" data-action="apply-point-buy">27-point reset</button><span class="status-pill">Point buy: ${pointBuyTotal} / 27</span></div></div><div class="ability-editor">${ABILITIES.map(a=>`<label class="ability-editor-cell"><span>${ABILITY_LABELS[a]}</span><input type="number" min="1" max="30" data-stat="${a}" value="${c.stats[a]}"></label>`).join("")}</div></section>

    <section class="card compact-gap"><div class="section-title">Background ability increases</div>${bg ? `<div class="mini" style="margin-bottom:10px">${escapeHtml(bg.name)} offers ${escapeHtml((bgAbility.plus2From || []).map(x=>ABILITY_LABELS[x]).join(", "))} for +2 and ${escapeHtml((bgAbility.plus1From || []).map(x=>ABILITY_LABELS[x]).join(", "))} for +1.</div><div class="form-grid two"><label class="field">+2 ability<select data-builder="bgPlus2"><option value="">— Select —</option>${(bgAbility.plus2From || []).map(x=>`<option value="${x}" ${selectedAbility2===x?"selected":""}>${ABILITY_NAMES[x]}</option>`).join("")}</select></label><label class="field">+1 ability<select data-builder="bgPlus1"><option value="">— Select —</option>${(bgAbility.plus1From || []).map(x=>`<option value="${x}" ${selectedAbility1===x?"selected":""}>${ABILITY_NAMES[x]}</option>`).join("")}</select></label></div>` : `<div class="empty">Choose a 2024 background to see its ability-score options.</div>`}</section>

    <div class="grid two compact-gap">
      <section class="card"><div class="section-head"><div class="section-title">Class skill choices</div><span class="status-pill">${classSkillChoices.size} / ${maxClassSkills || 0}</span></div>${classOptions.length ? `<div class="skill-grid">${classOptions.map(key=>`<label class="skill-check"><input type="checkbox" data-class-skill="${key}" ${classSkillChoices.has(key)?"checked":""}>${SKILLS[key]?.[1] || key}</label>`).join("")}</div><div class="mini" style="margin-top:10px">Class skills are kept separate from background and manual proficiencies.</div>` : `<div class="empty">Choose a class to load its skill choices from 5etools.</div>`}</section>
      <section class="card"><div class="section-title">Background</div>${bg ? `<div class="detail-list"><div><strong>Skills</strong><span>${escapeHtml(grantedSkillsFromMap(bg.skillProficiencies).map(k=>SKILLS[k]?.[1]||k).join(", ") || "None")}</span></div><div><strong>Origin feat</strong><span>${escapeHtml(bgFeatNames.join(", ") || "Choice")}</span></div><div><strong>Tools</strong><span>${escapeHtml(entriesToText(bg.toolProficiencies) || "—")}</span></div></div>` : `<div class="empty">Choose a background.</div>`}</section>
    </div>

    <section class="card compact-gap"><div class="section-title">Origin feat</div><div class="form-grid two"><label class="field">Feat<select data-builder="feat"><option value="">— Choose —</option>${availableOriginFeats.map(x=>`<option value="${escapeHtml(x.name)}" ${c.feat?.name===x.name?"selected":""}>${escapeHtml(x.name)}</option>`).join("")}</select></label><div>${c.feat?.name ? `<button class="feature feature-block" data-action="feat-detail" data-name="${encodeURIComponent(c.feat.name)}"><strong>${escapeHtml(c.feat.name)}</strong><span>${escapeHtml(entriesToText(findFeat(c.feat.name)?.entries).slice(0,250))}</span></button>` : `<div class="empty">Choose a feat to keep a rules reference on the character.</div>`}</div></div></section>

    <div class="grid two compact-gap">
      <section class="card"><div class="section-title">Combat overrides</div><div class="form-grid two"><label class="field">AC override<input type="number" min="0" max="60" data-builder="acOverride" value="${c.acOverride ?? ""}" placeholder="Automatic"></label><label class="field">Speed override<input type="number" min="0" max="200" data-builder="speedOverride" value="${c.speedOverride ?? ""}" placeholder="Automatic"></label><label class="field">Max HP override<input type="number" min="1" max="1000" data-builder="hpMaxOverride" value="${c.hpMaxOverride ?? ""}" placeholder="Automatic"></label><label class="field">Current HP<input type="number" min="0" max="1000" data-builder="hpCurrent" value="${c.hpAuto ? "" : (c.hpCurrent ?? "")}" placeholder="${c.hpAuto ? `Automatic (${c.hpCurrent ?? 0})` : "Manual"}"></label><label class="field">Temporary HP<input type="number" min="0" max="1000" data-builder="tempHp" value="${c.tempHp}"></label></div></section>
      <section class="card"><div class="section-title">Manual skill proficiencies</div><div class="skill-grid">${Object.entries(SKILLS).map(([key,[,name]])=>`<label class="skill-check"><input type="checkbox" data-custom-skill="${key}" ${c.customSkillProficiencies.includes(key)?"checked":""}>${name}</label>`).join("")}</div></section>
    </div>

    <section class="card compact-gap"><div class="section-title">Character notes</div><textarea data-builder="notes" rows="7">${escapeHtml(c.notes)}</textarea></section>
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
    select.innerHTML = `<option value="">— Select —</option>${options.map(s=>`<option value="${escapeHtml(s.name)}" ${currentName===s.name?"selected":""}>${escapeHtml(s.name)}</option>`).join("")}`;
  } catch (e) {
    select.innerHTML = `<option value="">Unable to load subclasses</option>`;
  }
}

async function renderSpellbook(app) {
  const c = state.character;
  await deriveCharacter();
  const spells = Array.isArray(state.data.spells?.spell) ? xphbEntries(state.data.spells, "spell").sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name)) : [];
  const maxPrepared = state.lastDerived?.maxPrepared ?? null;
  const maxCantrips = state.lastDerived?.cantrips ?? null;
  const tab = state.spellPickerTab;
  const collection = tab === "prepared" ? c.preparedSpells : tab === "cantrips" ? c.cantrips : tab === "spellbook" ? c.spellbook : c.knownSpells;
  const collectionIds = new Set(collection.map(x=>String(x).toLowerCase()));
  const className = c.class?.name || "";
  const castLevel = Math.max(0, Number(c.level || 1));
  const knownLimit = state.lastDerived?.knownSpells ?? null;
  const available = spells.filter(s => s.level === 0 ? true : s.level <= castLevel).slice(0, 1000);

  app.innerHTML = `${pageHeader("SPELLBOOK", `${escapeHtml(c.name || "Character")} · Spells`, `${escapeHtml(className || "No class")} · 2024 XPHB spell data`, `<button class="button" data-action="sheet">Character</button>`)}
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
    return `<div class="spell-row"><label class="spell-select"><input type="checkbox" data-spell-toggle="${escapeHtml(id)}" ${checked?"checked":""}> <span class="spell-title">${escapeHtml(s.name)}</span></label><span class="spell-meta">${s.level===0?"Cantrip":`Lv ${s.level}`} · ${escapeHtml(spellSchoolName(s.school))}</span><button class="button button-small" data-action="spell-info" data-spell="${encodeURIComponent(s.name)}">Info</button></div>`;
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
    species: xphbEntries(state.data.races, "race").length,
    backgrounds: xphbEntries(state.data.backgrounds, "background").length,
    feats: xphbEntries(state.data.feats, "feat").length,
    spells: xphbEntries(state.data.spells, "spell").length,
    items: state.data.items ? xphbEntries(state.data.items, "item").length : null,
  };
  const chars = await getCharacters();
  app.innerHTML = `${pageHeader("DATA & APP", "5etools synchronization", `App ${APP_VERSION} · rules data is stored locally on this tablet.`, `<button class="button button-primary" data-action="sync">Check for updates</button>`)}
    <section class="card"><div class="data-row"><div><strong>Rules data</strong><span>2024 XPHB release currently used by the app</span></div><strong>${escapeHtml(state.version || "Not synced")}</strong></div><div class="data-row"><div><strong>Last successful sync</strong><span>Stored locally</span></div><strong>${state.lastSync ? escapeHtml(new Date(state.lastSync).toLocaleString()) : "—"}</strong></div><div class="data-row"><div><strong>Connectivity</strong><span>Internet is only needed to update rules data</span></div><strong>${state.online ? "Online" : "Offline"}</strong></div></section>
    <div class="grid three compact-gap">${Object.entries(counts).map(([k,v])=>metric(k, v == null ? "Not loaded" : v)).join("")}</div>
    <section class="card compact-gap"><div class="section-head"><div><div class="section-title">Characters on this device</div><div class="mini">Character state is independent of 5etools rules data.</div></div><button class="button button-small button-primary" data-action="new-character">New character</button></div><div class="character-list">${chars.map(ch=>`<div class="character-row ${ch.id===state.character.id?"current":""}"><button class="character-select" data-action="switch-character" data-id="${ch.id}"><strong>${escapeHtml(ch.name)}</strong><span>${escapeHtml([ch.species?.name,ch.class?.name,csv(ch.subclass?.name),`Level ${ch.level}`].filter(Boolean).join(" · "))}</span></button>${ch.id!==state.character.id?`<button class="icon-button" data-action="delete-character" data-id="${ch.id}">×</button>`:""}</div>`).join("")}</div></section>
    <section class="card compact-gap"><div class="section-title">Storage model</div><p class="note">The app caches versioned 5etools JSON on the device, stores character state separately, and can continue running without a network connection after synchronization. A rules-data update does not replace your character.</p><p class="mini">Data source: ${escapeHtml(REPO)} · source ${DATA_SOURCE}</p></section>`;
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
        if (action === "spells") { state.view = "spells"; state.spellPickerTab = "prepared"; return render(); }
        if (action === "spells-tab") { state.view = "spells"; state.spellPickerTab = el.dataset.spellTab || "prepared"; return render(); }
        if (action === "equipment") { state.view = "equipment"; return render(); }
        if (action === "character-menu") return openCharacterMenu();
        if (action === "save-builder") { await readBuilder(); await saveCharacter(); await deriveCharacter(); state.view = "sheet"; showToast("Character saved."); return render(); }
        if (action === "export") return exportCharacter();
        if (action === "import") return openImport();
        if (action === "hp") { const delta = Number(el.dataset.delta || 0); const d = await deriveCharacter(); state.character.hpCurrent = Math.max(0, Math.min(d.maxHp, Number(state.character.hpCurrent || 0) + delta)); state.character.hpAuto = false; await saveCharacter(); return render(); }
        if (action === "temp-hp") { const value = prompt("Temporary hit points", String(state.character.tempHp || 0)); if (value !== null) { state.character.tempHp = Math.max(0, Number(value || 0)); await saveCharacter(); return render(); } return; }
        if (action === "hitdie") { const idx = Number(el.dataset.index); state.character.hitDiceUsed = idx < state.character.hitDiceUsed ? idx : Math.min(state.character.level, idx + 1); await saveCharacter(); return render(); }
        if (action === "slot") { const level = Number(el.dataset.level); const cap = Number(state.lastDerived?.spellSlots?.[level - 1] || 0); const current = countSlotUsed(state.character, level); const idx = Number(el.dataset.index); setSlotUsed(state.character, level, idx < current ? idx : Math.min(cap, idx + 1)); await saveCharacter(); return render(); }
        if (action === "death") { const type = el.dataset.type; state.character.deathSaves[type] = Math.min(3, Number(state.character.deathSaves[type] || 0) + 1); await saveCharacter(); return render(); }
        if (action === "death-reset") { state.character.deathSaves = { success: 0, failure: 0 }; await saveCharacter(); return render(); }
        if (action === "condition") { toggleArray(state.character.conditions, el.dataset.condition); await saveCharacter(); return render(); }
        if (action === "clear-conditions") { state.character.conditions = []; await saveCharacter(); return render(); }
        if (action === "feature") { const f = findFeatureByButton(el); if (f) return openFeatureModal(f); }
        if (action === "feat-detail") { const feat = findFeat(decodeURIComponent(el.dataset.name || "")); if (feat) return openFeatModal(feat); }
        if (action === "species-detail") { if (state.lastDerived?.speciesObj) return openModal(state.lastDerived.speciesObj.name, `<div class="modal-kicker">${escapeHtml(state.lastDerived.speciesObj.source)}</div><div class="rules-text">${escapeHtml(entriesToText(state.lastDerived.speciesObj.entries))}</div>`); }
        if (action === "spell") { const s = spellById(`${decodeURIComponent(el.dataset.spell)}|${DATA_SOURCE}`); if (s) return openSpellModal(s); }
        if (action === "spell-info") { const s = spellById(`${decodeURIComponent(el.dataset.spell)}|${DATA_SOURCE}`); if (s) return openSpellModal(s); }
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
        if (action === "species-trait") { const trait = (state.lastDerived?.speciesObj?.entries || []).find(x => x?.name === decodeURIComponent(el.dataset.name || "")); if (trait) return openModal(trait.name, `<div class="rules-text">${escapeHtml(entriesToText(trait.entries))}</div>`); }
        if (action === "resource-pip") { const i = Number(el.dataset.resource); const resource = state.character.resources[i]; if (!resource) return; const used = idxUsed(resource.max, Number(el.dataset.index)); resource.current = Math.max(0, resource.max - used); await saveCharacter(); return render(); }
        if (action === "rest-short") { return shortRest(); }
        if (action === "rest-long") { return longRest(); }
        if (action === "new-character") { await createCharacter(); state.view = "builder"; return render(); }
        if (action === "switch-character") { await switchCharacter(el.dataset.id); return; }
        if (action === "delete-character") { if (confirm("Delete this character from this device?")) await deleteCharacter(el.dataset.id); return; }
        if (action === "apply-standard-array") { applyStandardArray(); return; }
        if (action === "apply-point-buy") { applyPointBuyDefault(); return; }
      } catch (err) {
        console.error(err);
        showToast(`Action failed: ${err.message}`);
      }
    };
  });

  document.querySelectorAll("[data-field=notes]").forEach(el => el.oninput = debounce(async () => { state.character.notes = el.value; await saveCharacter(); }, 250));
  document.querySelectorAll("[data-builder]").forEach(el => {
    el.onchange = async () => {
      const key = el.dataset.builder;
      await readBuilder();
      if (key === "background") render();
    };
  });
  document.querySelectorAll("[data-stat]").forEach(el => el.onchange = async () => { state.character.stats[el.dataset.stat] = clamp(Number(el.value),1,30); await saveCharacter(); render(); });
  document.querySelectorAll("[data-class-skill]").forEach(el => el.onchange = async () => {
    const arr = state.character.classSkillChoices;
    toggleArray(arr, el.dataset.classSkill, el.checked);
    const max = state.lastDerived?.skillChoiceSpec?.count || 0;
    if (arr.length > max) { arr.splice(arr.indexOf(el.dataset.classSkill),1); el.checked=false; showToast(`Choose only ${max} class skills.`); return; }
    await saveCharacter(); render();
  });
  document.querySelectorAll("[data-custom-skill]").forEach(el => el.onchange = async () => { toggleArray(state.character.customSkillProficiencies, el.dataset.customSkill, el.checked); await saveCharacter(); render(); });
  document.querySelectorAll("[data-spell-toggle]").forEach(el => el.onchange = async () => toggleSpellCollection(el.dataset.spellToggle, el.checked));
  document.querySelectorAll("[data-spell-tab]").forEach(el => el.onclick = () => { state.spellPickerTab = el.dataset.spellTab; render(); });
  const search = document.querySelector("#spellSearch");
  const level = document.querySelector("#spellLevel");
  if (search) search.oninput = () => updateSpellResultFilter();
  if (level) level.onchange = () => updateSpellResultFilter();
  document.querySelectorAll("[data-currency]").forEach(el => el.onchange = async () => { state.character.currency[el.dataset.currency] = Math.max(0, Number(el.value || 0)); await saveCharacter(); });
  const classSelect = document.querySelector('[data-builder="class"]');
  if (classSelect) classSelect.onchange = async () => { await readBuilder(); state.character.subclass = null; await saveCharacter(); await populateSubclasses(state.character.class?.name, null); render(); };
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
  if (get("species")) c.species = get("species").value ? { name: get("species").value, source: DATA_SOURCE } : null;
  if (get("background")) c.background = get("background").value ? { name: get("background").value, source: DATA_SOURCE } : null;
  if (get("class")) c.class = get("class").value ? { name: get("class").value, source: DATA_SOURCE } : null;
  if (get("subclass")) c.subclass = get("subclass").value ? { name: get("subclass").value, source: DATA_SOURCE } : null;
  if (get("bgPlus2")) c.backgroundAbility.plus2 = get("bgPlus2").value || null;
  if (get("bgPlus1")) c.backgroundAbility.plus1 = get("bgPlus1").value || null;
  if (get("feat")) c.feat = get("feat").value ? { name: get("feat").value, source: DATA_SOURCE } : null;
  const selectedBackground = findBackground(c.background?.name);
  const backgroundFeats = backgroundFeatNames(selectedBackground);
  if (backgroundFeats.length === 1) {
    const resolved = findFeat(backgroundFeats[0]);
    if (resolved) c.feat = { name: resolved.name, source: DATA_SOURCE };
  } else if (backgroundFeats.length > 1 && c.feat && !backgroundFeats.some(n => n.toLowerCase() === c.feat.name.toLowerCase())) {
    c.feat = null;
  }
  if (c.class?.name) {
    const file = await getClassDetails(c.class.name);
    const obj = getClassFromFile(file, c.class.name);
    const spec = skillChoiceSpec(obj);
    c.classSkillChoices = c.classSkillChoices.filter(x => spec.from.includes(x)).slice(0, spec.count);
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
  openModal(f.name, `<div class="modal-kicker">${escapeHtml(f.source)} · level ${f.level}</div><div class="rules-text">${escapeHtml(entriesToText(f.entries)).replace(/\n/g,"<br>")}</div>`);
}
function openFeatModal(feat) { openModal(feat.name, `<div class="modal-kicker">${escapeHtml(feat.source)}</div><div class="rules-text">${escapeHtml(entriesToText(feat.entries))}</div>`); }
function openSpellModal(s) {
  openModal(s.name, `<div class="modal-kicker">${s.source} · ${s.level===0?"Cantrip":`Level ${s.level}`} · ${escapeHtml(spellSchoolName(s.school))}</div><div class="spell-facts"><span>${escapeHtml(formatSpellTime(s.time))}</span><span>${escapeHtml(formatSpellRange(s.range))}</span><span>${escapeHtml(formatComponents(s.components))}</span><span>${escapeHtml(formatDuration(s.duration))}</span></div><div class="rules-text">${escapeHtml(entriesToText(s.entries))}</div>${s.entriesHigherLevel?`<hr><div class="modal-kicker">Higher Levels</div><div class="rules-text">${escapeHtml(entriesToText(s.entriesHigherLevel))}</div>`:""}`);
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
    const items = xphbEntries(data, "item").sort((a,b)=>a.name.localeCompare(b.name));
    openModal("Add 2024 item", `<div class="spell-toolbar"><input id="itemSearch" type="search" placeholder="Search items…"></div><div id="itemResults" class="spell-results"></div>`);
    const rerender = () => {
      const q = (document.querySelector("#itemSearch")?.value || "").toLowerCase().trim();
      const list = items.filter(i=>!q||i.name.toLowerCase().includes(q)).slice(0,300);
      const root = document.querySelector("#itemResults"); if(!root)return;
      root.innerHTML = list.map((it,i)=>`<div class="spell-row"><div><strong>${escapeHtml(it.name)}</strong><div class="spell-meta">${escapeHtml(it.type || "Item")}</div></div><button class="button button-small button-primary" data-add-item="${i}">Add</button><button class="button button-small" data-item-detail="${i}">Info</button></div>`).join("")||`<div class="empty">No matching items.</div>`;
      root.querySelectorAll("[data-add-item]").forEach(btn=>btn.onclick=async()=>{const it=list[Number(btn.dataset.addItem)]; if(!it)return; addInventoryItem(it); closeModal(); state.view="equipment"; render();});
      root.querySelectorAll("[data-item-detail]").forEach(btn=>btn.onclick=()=>{const it=list[Number(btn.dataset.itemDetail)]; if(it)openModal(it.name,`<div class="modal-kicker">${escapeHtml(it.source)} · ${escapeHtml(it.type||"")}</div><div class="rules-text">${escapeHtml(entriesToText(it.entries))}</div>`);});
    };
    document.querySelector("#itemSearch").oninput=rerender; rerender();
  } catch(e){showToast(`Items could not be loaded: ${e.message}`);}
}
function addInventoryItem(it){const existing=state.character.inventory.find(x=>x.name===it.name&&x.source===it.source);if(existing)existing.quantity=Number(existing.quantity||1)+1;else state.character.inventory.push({name:it.name,source:it.source,quantity:1,equipped:false});saveCharacter();}
function adjustItemQty(i,delta){const item=state.character.inventory[i];if(!item)return;item.quantity=Number(item.quantity||1)+delta;if(item.quantity<=0)state.character.inventory.splice(i,1);saveCharacter().then(render);}
async function openInventoryItemInfo(i){const item=state.character.inventory[i];if(!item)return;const data=await getItemsData();const found=xphbEntries(data,"item").find(x=>x.name===item.name&&x.source===item.source)||xphbEntries(data,"item").find(x=>x.name===item.name);if(found)openModal(found.name,`<div class="modal-kicker">${escapeHtml(found.source)} · ${escapeHtml(found.type||"")}</div><div class="rules-text">${escapeHtml(entriesToText(found.entries))}</div>`);}

function updateSpellResultFilter(){
  const spells = xphbEntries(state.data.spells,"spell").sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name));
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
  ABILITIES.forEach((a,i)=>state.character.stats[a]=STANDARD_ARRAY[i]);saveCharacter().then(render);
}
function applyPointBuyDefault(){
  const values=[15,14,13,12,10,8];ABILITIES.forEach((a,i)=>state.character.stats[a]=values[i]);saveCharacter().then(render);showToast("Loaded the 27-point-buy baseline (15, 14, 13, 12, 10, 8). Adjust individual scores as needed.");
}
function shortRest(){
  const c=state.character;c.deathSaves={success:0,failure:0};for(const r of c.resources){if(r.recharge==="short")r.current=r.max;}saveCharacter().then(()=>{showToast("Short rest recorded.");render();});
}
function longRest(){
  const c=state.character;c.hpCurrent=state.lastDerived?.maxHp??c.hpCurrent;c.tempHp=0;c.hitDiceUsed=0;c.deathSaves={success:0,failure:0};c.spellSlotsUsed=[];for(const r of c.resources){if(r.recharge==="short"||r.recharge==="long")r.current=r.max;}saveCharacter().then(()=>{showToast("Long rest recorded.");render();});
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
