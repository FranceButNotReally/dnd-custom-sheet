const REPO = "5etools-mirror-3/5etools-src";
const GITHUB_RELEASE_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const RAW_ROOT = `https://raw.githubusercontent.com/${REPO}`;
const CORE_PATHS = {
  classIndex: "data/class/index.json",
  races: "data/races.json",
  backgrounds: "data/backgrounds.json",
  feats: "data/feats.json",
  spellIndex: "data/spells/index.json",
};
const SKILLS = {
  acrobatics: ["Dex", "Acrobatics"],
  animalHandling: ["Wis", "Animal Handling"],
  arcana: ["Int", "Arcana"],
  athletics: ["Str", "Athletics"],
  deception: ["Cha", "Deception"],
  history: ["Int", "History"],
  insight: ["Wis", "Insight"],
  intimidation: ["Cha", "Intimidation"],
  investigation: ["Int", "Investigation"],
  medicine: ["Wis", "Medicine"],
  nature: ["Int", "Nature"],
  perception: ["Wis", "Perception"],
  performance: ["Cha", "Performance"],
  persuasion: ["Cha", "Persuasion"],
  religion: ["Int", "Religion"],
  sleightOfHand: ["Dex", "Sleight of Hand"],
  stealth: ["Dex", "Stealth"],
  survival: ["Wis", "Survival"],
};
const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];
const ABILITY_LABELS = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };

const state = {
  view: "sheet",
  online: navigator.onLine,
  version: null,
  lastSync: null,
  lastDerived: null,
  data: {
    classIndex: null,
    races: null,
    backgrounds: null,
    feats: null,
    spells: null,
    items: null,
  },
  character: null,
};

const DB_NAME = "dnd-2024-5etools-sheet";
const DB_VERSION = 1;
let dbPromise;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv", { keyPath: "key" });
      if (!db.objectStoreNames.contains("data")) db.createObjectStore("data", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function idbGet(store, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store, key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(store, key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDeletePrefix(store, prefix) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    const request = os.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith(prefix)) cursor.delete();
      cursor.continue();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function dataKey(version, path) { return `${version}::${path}`; }

async function cachedData(version, path) {
  return idbGet("data", dataKey(version, path));
}

async function cacheData(version, path, json) {
  await idbPut("data", dataKey(version, path), json);
}

function emptyCharacter() {
  return {
    schema: 1,
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: "New Character",
    player: "",
    level: 1,
    class: null,
    subclass: null,
    species: null,
    background: null,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skillProficiencies: [],
    expertise: [],
    maxHpOverride: null,
    hp: null,
    tempHp: 0,
    ac: 10,
    speed: 30,
    hitDiceUsed: 0,
    deathSaves: { success: 0, failure: 0 },
    conditions: [],
    preparedSpells: [],
    knownSpells: [],
    inventory: [],
    notes: "",
  };
}

async function saveCharacter() {
  await idbPut("kv", "character", state.character);
}

async function loadCharacter() {
  state.character = (await idbGet("kv", "character")) || emptyCharacter();
  if (!state.character.stats) state.character.stats = emptyCharacter().stats;
  if (!Array.isArray(state.character.skillProficiencies)) state.character.skillProficiencies = [];
  if (!Array.isArray(state.character.expertise)) state.character.expertise = [];
  if (!Array.isArray(state.character.preparedSpells)) state.character.preparedSpells = [];
  if (!Array.isArray(state.character.knownSpells)) state.character.knownSpells = [];
  if (!Array.isArray(state.character.inventory)) state.character.inventory = [];
  if (!Array.isArray(state.character.conditions)) state.character.conditions = [];
  if (!state.character.deathSaves) state.character.deathSaves = { success: 0, failure: 0 };
  state.version = await idbGet("kv", "version");
  state.lastSync = await idbGet("kv", "lastSync");
}

async function persistMeta() {
  await idbPut("kv", "version", state.version);
  await idbPut("kv", "lastSync", state.lastSync);
}

async function fetchJson(url, { timeoutMs = 25000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getLatestReleaseTag() {
  const release = await fetchJson(GITHUB_RELEASE_URL, { timeoutMs: 12000 });
  if (!release?.tag_name) throw new Error("GitHub did not return a release tag.");
  return release.tag_name;
}

async function fetch5eData(version, path) {
  const cached = await cachedData(version, path);
  if (cached !== null) return cached;
  const url = `${RAW_ROOT}/${encodeURIComponent(version)}/${path}`;
  const json = await fetchJson(url, { timeoutMs: 35000 });
  await cacheData(version, path, json);
  return json;
}

async function loadCoreData(version) {
  const [classIndex, races, backgrounds, feats, spellIndex] = await Promise.all([
    fetch5eData(version, CORE_PATHS.classIndex),
    fetch5eData(version, CORE_PATHS.races),
    fetch5eData(version, CORE_PATHS.backgrounds),
    fetch5eData(version, CORE_PATHS.feats),
    fetch5eData(version, CORE_PATHS.spellIndex),
  ]);
  const spellPath = spellIndex?.XPHB;
  if (!spellPath) throw new Error("The 5etools release did not expose an XPHB spell data file.");
  const spells = await fetch5eData(version, `data/spells/${spellPath}`);
  return { classIndex, races, backgrounds, feats, spells };
}

async function syncData(force = false) {
  setBusy(true);
  try {
    let latest = null;
    if (state.online) latest = await getLatestReleaseTag();
    else if (state.version) latest = state.version;
    else throw new Error("No cached 5etools data is available yet. Connect to the internet for the first sync.");

    const needsUpdate = force || !state.version || state.version !== latest;
    if (needsUpdate) {
      showToast(`Downloading 5etools ${latest}…`);
      const oldVersion = state.version;
      const core = await loadCoreData(latest);
      state.version = latest;
      state.lastSync = new Date().toISOString();
      state.data = core;
      await persistMeta();
      if (oldVersion && oldVersion !== latest) await idbDeletePrefix("data", `${oldVersion}::`);
      showToast(`5etools data updated to ${latest}.`);
    } else {
      state.version = latest;
      state.data = await loadCoreData(latest);
      if (!state.lastSync) { state.lastSync = new Date().toISOString(); await persistMeta(); }
    }
  } catch (error) {
    console.warn(error);
    if (state.version) {
      state.data = await loadCoreData(state.version);
      showToast(`Using cached 5etools ${state.version}. ${state.online ? "Update check failed." : "You are offline."}`);
    } else {
      showToast(`Could not load 5etools data: ${error.message}`);
    }
  } finally {
    setBusy(false);
    updateHeader();
    render();
  }
}

async function getClassDetails(className) {
  if (!state.data.classIndex) throw new Error("Class index is not loaded.");
  const file = state.data.classIndex[className.toLowerCase()];
  if (!file) throw new Error(`No 5etools class file found for ${className}.`);
  return fetch5eData(state.version, `data/class/${file}`);
}

async function getItemsData() {
  if (state.data.items) return state.data.items;
  state.data.items = await fetch5eData(state.version, "data/items.json");
  return state.data.items;
}

function sourceEntries(json, prop) {
  return Array.isArray(json?.[prop]) ? json[prop].filter(x => x && x.source === "XPHB") : [];
}

function getClassFromFile(classFile, name) {
  return classFile?.class?.find(c => c.name === name && c.source === "XPHB") || classFile?.class?.find(c => c.name === name);
}

function getSubclassOptions(classFile, className) {
  return (classFile?.subclass || []).filter(s => s.className === className && s.source === "XPHB" && (s.classSource === "XPHB" || !s.classSource));
}

function getFeatureText(feature) {
  return entriesToText(feature?.entries || []);
}

function getClassFeatures(classFile, classObj, level) {
  const result = [];
  for (const ref of classObj?.classFeatures || []) {
    const parsed = typeof ref === "string" ? ref.split("|") : null;
    const name = parsed?.[0];
    const refSource = parsed?.[2];
    const refLevel = Number(parsed?.[3] || 0);
    const feature = classFile?.classFeature?.find(f => f.name === name && f.className === classObj.name && f.level === refLevel && (f.source === classObj.source || f.source === refSource || !refSource));
    if (feature && feature.level <= level && feature.source === "XPHB") result.push(feature);
  }
  return result;
}

function getSubclassFeatures(classFile, subclass, level) {
  if (!subclass) return [];
  return (classFile?.subclassFeature || []).filter(f =>
    f.subclassShortName === subclass.shortName &&
    f.subclassSource === subclass.source &&
    f.className === subclass.className &&
    f.level <= level &&
    f.source === "XPHB"
  );
}

function entriesToText(entries) {
  if (entries == null) return "";
  if (typeof entries === "string") return stripTags(entries);
  if (typeof entries === "number" || typeof entries === "boolean") return String(entries);
  if (Array.isArray(entries)) return entries.map(entriesToText).filter(Boolean).join(" ");
  if (typeof entries === "object") {
    if (entries.entry) return `${entries.name ? entries.name + ": " : ""}${entriesToText(entries.entry)}`;
    const bits = [];
    if (entries.name && entries.type !== "table") bits.push(entries.name + ":");
    for (const [key, value] of Object.entries(entries)) {
      if (["name", "type", "style", "colLabels", "rows"].includes(key)) continue;
      const text = entriesToText(value);
      if (text) bits.push(text);
    }
    return bits.join(" ");
  }
  return "";
}

function stripTags(text) {
  let out = String(text);
  for (let i = 0; i < 5; i++) {
    out = out.replace(/\{@([a-zA-Z0-9_-]+)\s+([^{}]*)\}/g, (_, tag, body) => {
      const parts = body.split("|");
      return parts[2] || parts[0] || tag;
    });
  }
  out = out.replace(/\{@([a-zA-Z0-9_-]+)\s+([^{}]*)/g, "$2");
  return out.replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function abilityMod(score) { return Math.floor((Number(score || 10) - 10) / 2); }
function formatMod(mod) { return mod >= 0 ? `+${mod}` : String(mod); }
function proficiencyBonus(level) { return 2 + Math.floor((Math.max(1, Number(level || 1)) - 1) / 4); }
function classSpellSlots(classObj, level) {
  const group = (classObj?.classTableGroups || []).find(g => Array.isArray(g.rowsSpellProgression));
  const row = group?.rowsSpellProgression?.[Math.max(0, level - 1)];
  return Array.isArray(row) ? row.slice(0, 9).map(Number) : [];
}
function maxPrepared(classObj, level, intMod) {
  const progress = classObj?.preparedSpellsProgression?.[Math.max(0, level - 1)];
  if (Number.isFinite(progress)) return progress;
  const formula = classObj?.preparedSpells;
  if (typeof formula === "string") {
    const base = Number(formula.match(/<\$level\$>/)?.[0] ? level : 0);
    if (formula.includes("<$level$>") && formula.includes("<$")) return Math.max(1, level + intMod);
  }
  return null;
}
function spellSchoolName(code) {
  return ({A:"Abjuration",C:"Conjuration",D:"Divination",E:"Enchantment",V:"Evocation",I:"Illusion",N:"Necromancy",T:"Transmutation"})[code] || code || "";
}

async function deriveCharacter() {
  const c = state.character;
  const derived = {
    pb: proficiencyBonus(c.level),
    mods: Object.fromEntries(ABILITIES.map(a => [a, abilityMod(c.stats[a])])),
    classObj: null,
    classFile: null,
    subclassObj: null,
    subclassOptions: [],
    classFeatures: [],
    subclassFeatures: [],
    spellSlots: [],
    maxPrepared: null,
    cantrips: null,
  };
  if (c.class?.name) {
    derived.classFile = await getClassDetails(c.class.name);
    derived.classObj = getClassFromFile(derived.classFile, c.class.name);
    derived.subclassOptions = getSubclassOptions(derived.classFile, c.class.name);
    if (c.subclass?.name) {
      derived.subclassObj = derived.subclassOptions.find(s => s.name === c.subclass.name && s.source === c.subclass.source) || derived.subclassOptions.find(s => s.name === c.subclass.name);
    }
    derived.classFeatures = getClassFeatures(derived.classFile, derived.classObj, c.level);
    derived.subclassFeatures = getSubclassFeatures(derived.classFile, derived.subclassObj, c.level);
    derived.spellSlots = classSpellSlots(derived.classObj, c.level);
    derived.maxPrepared = maxPrepared(derived.classObj, c.level, derived.mods.int);
    derived.cantrips = derived.classObj?.cantripProgression?.[Math.max(0, c.level - 1)] ?? null;
  }
  if (c.hp == null) c.hp = calculateDefaultMaxHp(derived.classObj, c.level, derived.mods.con, c.maxHpOverride);
  if (c.ac == null) c.ac = 10 + derived.mods.dex;
  state.lastDerived = derived;
  return derived;
}
function calculateDefaultMaxHp(classObj, level, conMod, override) {
  if (Number.isFinite(Number(override))) return Number(override);
  const faces = classObj?.hd?.faces || 8;
  const first = faces + conMod;
  const later = Math.floor(faces / 2) + 1 + conMod;
  return Math.max(1, first + Math.max(0, level - 1) * later);
}

function updateHeader() {
  const network = document.querySelector("#networkBadge");
  const data = document.querySelector("#dataBadge");
  if (network) { network.textContent = state.online ? "Online" : "Offline"; network.className = `status-pill ${state.online ? "online" : "offline"}`; }
  if (data) data.textContent = state.version ? `5etools ${state.version}` : "5etools: not synced";
}
function setBusy(busy) {
  const btn = document.querySelector("#updateBtn");
  if (btn) { btn.disabled = busy; btn.textContent = busy ? "Updating…" : "Update data"; }
}
function showToast(message) {
  const root = document.querySelector("#toastRoot");
  if (!root) return;
  root.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
  setTimeout(() => { if (root) root.innerHTML = ""; }, 3600);
}

function render() {
  const app = document.querySelector("#app");
  if (!app) return;
  document.querySelectorAll(".tab").forEach(btn => btn.classList.toggle("is-active", btn.dataset.view === state.view));
  if (!state.version || !state.data.classIndex) {
    app.innerHTML = emptyState();
    return;
  }
  if (state.view === "builder") return renderBuilder(app);
  if (state.view === "data") return renderDataView(app);
  renderSheet(app);
}

function emptyState() {
  return `<div class="card empty"><h2>Sync 5etools data to begin</h2><p>Connect to the internet and use <strong>Update data</strong>. The 2024 XPHB data will then be cached locally on this tablet for offline play.</p><div class="actions" style="justify-content:center;margin-top:12px"><button class="button button-primary" data-action="sync">Sync 5etools</button></div></div>`;
}

async function renderSheet(app) {
  const d = await deriveCharacter();
  const c = state.character;
  const classLabel = c.class?.name || "Class not set";
  const subLabel = c.subclass?.name ? ` · ${c.subclass.name}` : "";
  const species = c.species?.name || "Species not set";
  const background = c.background?.name || "Background not set";
  const currentHp = Number(c.hp ?? 0);
  const maxHp = calculateDefaultMaxHp(d.classObj, c.level, d.mods.con, c.maxHpOverride);
  const skillRows = Object.entries(SKILLS).map(([key,[ability,name]]) => {
    const abilityKey = ability.toLowerCase();
    const prof = c.skillProficiencies.includes(key);
    const exp = c.expertise.includes(key);
    const bonus = d.mods[abilityKey] + (prof ? d.pb : 0) + (exp ? d.pb : 0);
    return `<div class="list-row"><span class="name">${name}</span><span class="value">${formatMod(bonus)} <span class="mini">${ABILITY_LABELS[abilityKey]}${prof ? " · Prof" : ""}${exp ? " · Exp" : ""}</span></span></div>`;
  }).join("");
  const saves = ABILITIES.map(a => {
    const prof = d.classObj?.proficiency?.includes(a);
    const bonus = d.mods[a] + (prof ? d.pb : 0);
    return `<div class="list-row"><span class="name">${ABILITY_LABELS[a]}</span><span class="value">${formatMod(bonus)} ${prof ? "· Prof" : ""}</span></div>`;
  }).join("");
  const features = [...d.classFeatures.map(f => ({...f, kind:"Class"})), ...d.subclassFeatures.map(f => ({...f, kind:"Subclass"}))]
    .sort((a,b) => a.level - b.level || a.name.localeCompare(b.name))
    .map(f => `<button class="feature" data-action="feature" data-name="${encodeURIComponent(f.name)}" data-level="${f.level}" data-kind="${f.kind}"><div><span class="feature-name">${escapeHtml(f.name)}</span><span class="feature-level">Lv ${f.level}</span></div><div class="feature-preview">${escapeHtml(getFeatureText(f).slice(0, 170))}${getFeatureText(f).length > 170 ? "…" : ""}</div></button>`).join("");
  const prepared = c.preparedSpells.map((id, i) => spellById(id)).filter(Boolean).map(s => `<button class="list-row" style="width:100%;text-align:left" data-action="spell" data-spell="${encodeURIComponent(s.name)}" data-spell-level="${s.level}"><span class="name">${escapeHtml(s.name)}</span><span class="value">${s.level === 0 ? "Cantrip" : `Level ${s.level}`}</span></button>`).join("");
  const inventory = c.inventory.map((it, i) => `<div class="list-row"><span class="name">${escapeHtml(it.name)}${it.quantity > 1 ? ` ×${it.quantity}` : ""}</span><button class="button button-small button-danger" data-action="remove-item" data-index="${i}">Remove</button></div>`).join("");
  const conditions = ["Blinded","Charmed","Deafened","Exhaustion","Frightened","Grappled","Incapacitated","Invisible","Paralyzed","Petrified","Poisoned","Prone","Restrained","Stunned","Unconscious"].map(x => `<button class="button button-small ${c.conditions.includes(x) ? "button-primary" : ""}" data-action="condition" data-condition="${x}">${x}</button>`).join("");

  app.innerHTML = `
    <div class="hero">
      <div>
        <div class="mini">2024 CHARACTER</div>
        <h1>${escapeHtml(c.name || "Unnamed Character")}</h1>
        <div class="meta">${escapeHtml(species)} · ${escapeHtml(classLabel)} ${escapeHtml(subLabel)} · ${escapeHtml(background)} · Level ${c.level}</div>
      </div>
      <div class="hero-actions">
        <button class="button" data-action="builder">Edit</button>
        <button class="button" data-action="export">Export JSON</button>
        <button class="button" data-action="import">Import JSON</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="stat-grid">${ABILITIES.map(a => `<div class="stat"><div class="label">${ABILITY_LABELS[a]}</div><div class="value">${c.stats[a]}</div><div class="mod">${formatMod(d.mods[a])}</div></div>`).join("")}</div>
    </div>

    <div class="grid three">
      <div class="card"><h3 class="section-title">Combat</h3><div class="metric-grid">
        ${metric("AC", c.ac)}${metric("HP", `${currentHp}/${maxHp}`)}${metric("Initiative", formatMod(d.mods.dex))}${metric("Speed", `${c.speed} ft`)}
      </div><div class="actions" style="margin-top:10px"><button class="button button-small" data-action="hp" data-delta="-1">−1 HP</button><button class="button button-small" data-action="hp" data-delta="1">+1 HP</button><button class="button button-small" data-action="hp" data-delta="-10">−10</button><button class="button button-small" data-action="hp" data-delta="10">+10</button></div></div>
      <div class="card"><h3 class="section-title">Saving Throws</h3><div class="list">${saves}</div></div>
      <div class="card"><h3 class="section-title">Hit Dice & Death Saves</h3><div class="resource"><div class="resource-head"><span class="resource-label">Hit Dice used</span><span class="resource-count">${c.hitDiceUsed}/${c.level}</span></div><div class="pips">${Array.from({length:c.level},(_,i)=>`<button class="pip ${i < c.hitDiceUsed ? "used" : ""}" data-action="hitdie" data-index="${i}"></button>`).join("")}</div></div><div class="resource" style="margin-top:14px"><div class="resource-head"><span class="resource-label">Death saves</span><span class="resource-count">${c.deathSaves.success} success · ${c.deathSaves.failure} failure</span></div><div class="actions"><button class="button button-small" data-action="death" data-type="success">+ Success</button><button class="button button-small" data-action="death" data-type="failure">+ Failure</button><button class="button button-small" data-action="death-reset">Reset</button></div></div></div>
    </div>

    <div class="grid two" style="margin-top:14px">
      <div class="card"><h3 class="section-title">Skills</h3><div class="list">${skillRows}</div></div>
      <div class="card"><h3 class="section-title">Spellcasting</h3><div class="metric-grid">${metric("Spell DC", 8 + d.pb + d.mods.int)}${metric("Spell Attack", formatMod(d.pb + d.mods.int))}${metric("Prepared", d.maxPrepared ?? "—")}${metric("Cantrips", d.cantrips ?? "—")}</div><div class="resource" style="margin-top:12px"><div class="resource-head"><span class="resource-label">Spell slots</span><span class="resource-count">Used / available</span></div>${d.spellSlots.map((n,i)=> n ? `<div class="resource" style="margin-top:7px"><div class="resource-head"><span class="mini">Level ${i+1}</span><span class="resource-count">${countUsed(c, i+1)}/${n}</span></div><div class="pips">${Array.from({length:n},(_,j)=>`<button class="pip ${j < countUsed(c,i+1) ? "used" : ""}" data-action="slot" data-level="${i+1}" data-index="${j}"></button>`).join("")}</div></div>` : "").join("")}</div></div>
    </div>

    <div class="grid two" style="margin-top:14px">
      <div class="card"><div class="actions" style="justify-content:space-between"><h3 class="section-title" style="margin:0">Prepared spells</h3><button class="button button-small button-primary" data-action="spell-picker">Manage</button></div>${prepared ? `<div class="list" style="margin-top:10px">${prepared}</div>` : `<div class="empty">No prepared spells yet.</div>`}</div>
      <div class="card"><div class="actions" style="justify-content:space-between"><h3 class="section-title" style="margin:0">Inventory</h3><button class="button button-small button-primary" data-action="item-picker">Add 5etools item</button></div>${inventory ? `<div class="list" style="margin-top:10px">${inventory}</div>` : `<div class="empty">No inventory items yet.</div>`}</div>
    </div>

    <div class="card" style="margin-top:14px"><h3 class="section-title">Features</h3><div class="feature-grid">${features || `<div class="empty">Choose a class to load class features from 5etools.</div>`}</div></div>

    <div class="card" style="margin-top:14px"><h3 class="section-title">Conditions</h3><div class="actions">${conditions}</div></div>

    <div class="card" style="margin-top:14px"><h3 class="section-title">Notes</h3><textarea data-field="notes" rows="6" placeholder="Character notes, campaign notes, reminders…">${escapeHtml(c.notes)}</textarea></div>
  `;
  bindEvents();
}

function metric(label, value) { return `<div class="metric"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`; }
function countUsed(c, level) { return c.spellSlotsUsed?.[level - 1] || 0; }
function setCountUsed(c, level, count) { if (!Array.isArray(c.spellSlotsUsed)) c.spellSlotsUsed = []; while (c.spellSlotsUsed.length < level) c.spellSlotsUsed.push(0); c.spellSlotsUsed[level-1] = Math.max(0, count); }

function renderBuilder(app) {
  const c = state.character;
  const races = sourceEntries(state.data.races, "race").sort((a,b)=>a.name.localeCompare(b.name));
  const backgrounds = sourceEntries(state.data.backgrounds, "background").sort((a,b)=>a.name.localeCompare(b.name));
  const feats = sourceEntries(state.data.feats, "feat").sort((a,b)=>a.name.localeCompare(b.name));
  const classNames = Object.keys(state.data.classIndex || {}).sort((a,b)=>a.localeCompare(b)).map(k => k[0].toUpperCase()+k.slice(1));
  app.innerHTML = `
    <div class="hero"><div><div class="mini">CHARACTER BUILDER</div><h1>Edit character</h1><div class="meta">Selections are stored on this tablet; rules data comes from the cached 5etools release.</div></div><div class="hero-actions"><button class="button" data-action="sheet">Back to character</button><button class="button button-primary" data-action="save-builder">Save</button></div></div>
    <div class="card"><h3 class="section-title">Identity</h3><div class="form-grid"><label class="field">Character name<input type="text" data-builder="name" value="${escapeHtml(c.name)}"></label><label class="field">Player<input type="text" data-builder="player" value="${escapeHtml(c.player)}"></label><label class="field">Level<input type="number" min="1" max="20" data-builder="level" value="${c.level}"></label><label class="field">Species<select data-builder="species"><option value="">— Select —</option>${races.map(x=>`<option value="${escapeHtml(x.name)}" ${c.species?.name===x.name ? "selected" : ""}>${escapeHtml(x.name)}</option>`).join("")}</select></label><label class="field">Background<select data-builder="background"><option value="">— Select —</option>${backgrounds.map(x=>`<option value="${escapeHtml(x.name)}" ${c.background?.name===x.name ? "selected" : ""}>${escapeHtml(x.name)}</option>`).join("")}</select></label><label class="field">Class<select data-builder="class"><option value="">— Select —</option>${classNames.map(x=>`<option value="${escapeHtml(x)}" ${c.class?.name===x ? "selected" : ""}>${escapeHtml(x)}</option>`).join("")}</select></label><label class="field">Subclass<select id="subclassSelect" data-builder="subclass"><option value="">${c.class ? "Loading…" : "Choose a class first"}</option></select></label></div></div>
    <div class="card" style="margin-top:14px"><h3 class="section-title">Ability scores</h3><div class="form-grid three">${ABILITIES.map(a=>`<label class="field">${ABILITY_LABELS[a]}<input type="number" min="1" max="30" data-stat="${a}" value="${c.stats[a]}"></label>`).join("")}</div><div class="mini" style="margin-top:8px">2024 species entries do not apply the older edition's racial ability-score bonuses; background/feat choices will be handled explicitly in a later builder pass.</div></div>
    <div class="grid two" style="margin-top:14px"><div class="card"><h3 class="section-title">Skill proficiencies</h3><div class="skill-grid">${Object.entries(SKILLS).map(([key,[ab,name]])=>`<label class="skill-check"><input type="checkbox" data-skill="${key}" ${c.skillProficiencies.includes(key) ? "checked" : ""}>${name}<small>${ab}</small></label>`).join("")}</div></div><div class="card"><h3 class="section-title">Other combat values</h3><div class="form-grid"><label class="field">AC<input type="number" min="0" max="60" data-builder="ac" value="${c.ac}"></label><label class="field">Speed<input type="number" min="0" max="200" data-builder="speed" value="${c.speed}"></label><label class="field">Max HP override<input type="number" min="1" max="1000" data-builder="maxHpOverride" value="${c.maxHpOverride ?? ""}" placeholder="Automatic"></label><label class="field">Current HP<input type="number" min="0" max="1000" data-builder="hp" value="${c.hp ?? ""}"></label></div></div></div>
    <div class="card" style="margin-top:14px"><h3 class="section-title">Feat</h3><select data-builder="feat"><option value="">— Optional reference —</option>${feats.map(x=>`<option value="${escapeHtml(x.name)}" ${c.feat?.name===x.name ? "selected" : ""}>${escapeHtml(x.name)}</option>`).join("")}</select><div class="mini" style="margin-top:8px">The selected feat is stored as a reference in this prototype; feat-granted choices and automatic effects are next.</div></div>
    <div class="card" style="margin-top:14px"><h3 class="section-title">Character notes</h3><textarea rows="8" data-builder="notes">${escapeHtml(c.notes)}</textarea></div>
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
    const opts = getSubclassOptions(file, className).sort((a,b)=>a.name.localeCompare(b.name));
    select.innerHTML = `<option value="">— Select —</option>${opts.map(s=>`<option value="${escapeHtml(s.name)}" ${currentName===s.name ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("")}`;
  } catch (e) {
    select.innerHTML = `<option value="">Unable to load subclasses</option>`;
  }
}

function renderDataView(app) {
  const c = state.character;
  const counts = {
    classes: Object.keys(state.data.classIndex || {}).length,
    species: sourceEntries(state.data.races,"race").length,
    backgrounds: sourceEntries(state.data.backgrounds,"background").length,
    feats: sourceEntries(state.data.feats,"feat").length,
    spells: sourceEntries(state.data.spells,"spell").length,
    items: state.data.items ? sourceEntries(state.data.items,"item").length : null,
  };
  app.innerHTML = `<div class="hero"><div><div class="mini">DATA</div><h1>5etools synchronization</h1><div class="meta">The sheet downloads 2024 XPHB data to IndexedDB and can continue working without a network connection.</div></div><div class="hero-actions"><button class="button button-primary" data-action="sync">Check for update</button></div></div>
  <div class="card"><div class="data-row"><div class="left"><strong>Installed data</strong><span>Version used by your character sheet</span></div><strong>${escapeHtml(state.version || "Not synced")}</strong></div><div class="data-row"><div class="left"><strong>Last sync</strong><span>Stored locally on this device</span></div><strong>${state.lastSync ? escapeHtml(new Date(state.lastSync).toLocaleString()) : "—"}</strong></div><div class="data-row"><div class="left"><strong>Network</strong><span>The sheet does not require this after the first successful sync</span></div><strong>${state.online ? "Online" : "Offline"}</strong></div></div>
  <div class="grid three" style="margin-top:14px">${Object.entries(counts).map(([k,v])=>metric(k,v==null?"Not loaded":v)).join("")}</div>
  <div class="card" style="margin-top:14px"><h3 class="section-title">Storage model</h3><p class="note">Rules data and character state are stored separately. Updating 5etools replaces the cached rules data, while your character JSON remains on the tablet. The app never needs to run on your PC.</p></div>`;
  bindEvents();
}

function spellById(id) {
  const [name, source] = String(id || "").split("|");
  return state.data.spells?.spell?.find(s => s.name.toLowerCase() === name.toLowerCase() && (source ? s.source.toLowerCase() === source.toLowerCase() : s.source === "XPHB")) || state.data.spells?.spell?.find(s => s.name.toLowerCase() === name.toLowerCase() && s.source === "XPHB");
}

function featureForButton(el) {
  const name = decodeURIComponent(el.dataset.name || "");
  const kind = el.dataset.kind;
  if (kind === "Subclass") return state.lastDerived?.subclassFeatures?.find(f => f.name === name);
  return state.lastDerived?.classFeatures?.find(f => f.name === name);
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach(el => {
    el.onclick = async () => {
      const action = el.dataset.action;
      if (action === "sync") return syncData(true);
      if (action === "builder") { state.view = "builder"; return render(); }
      if (action === "sheet") { state.view = "sheet"; return render(); }
      if (action === "save-builder") { await readBuilder(); await saveCharacter(); showToast("Character saved."); state.view = "sheet"; return render(); }
      if (action === "export") return exportCharacter();
      if (action === "import") return openImport();
      if (action === "hp") { const delta = Number(el.dataset.delta || 0); state.character.hp = Math.max(0, Number(state.character.hp ?? 0) + delta); await saveCharacter(); return render(); }
      if (action === "hitdie") { const idx = Number(el.dataset.index); state.character.hitDiceUsed = idx < state.character.hitDiceUsed ? idx : Math.min(state.character.level, idx + 1); await saveCharacter(); return render(); }
      if (action === "death") { const type=el.dataset.type; state.character.deathSaves[type] = Math.min(3, (state.character.deathSaves[type] || 0) + 1); await saveCharacter(); return render(); }
      if (action === "death-reset") { state.character.deathSaves={success:0,failure:0}; await saveCharacter(); return render(); }
      if (action === "condition") { toggleArray(state.character.conditions, el.dataset.condition); await saveCharacter(); return render(); }
      if (action === "slot") { const level=Number(el.dataset.level); const current=countUsed(state.character, level); const cap=Number((await deriveCharacter()).spellSlots[level-1] || 0); const idx=Number(el.dataset.index); setCountUsed(state.character,level, idx < current ? idx : Math.min(cap,idx+1)); await saveCharacter(); return render(); }
      if (action === "feature") { const f = featureForButton(el); if (f) return openModal(f.name, `<div class="note"><strong>${escapeHtml(f.source)} · level ${f.level}</strong></div><p style="line-height:1.6">${escapeHtml(getFeatureText(f))}</p>`); return; }
      if (action === "spell") { const s=spellById(`${decodeURIComponent(el.dataset.spell)}|XPHB`); if(s) return openSpellModal(s); return; }
      if (action === "spell-picker") return openSpellPicker();
      if (action === "item-picker") return openItemPicker();
      if (action === "remove-item") { state.character.inventory.splice(Number(el.dataset.index),1); await saveCharacter(); return render(); }
    };
  });

  document.querySelectorAll("[data-field=notes]").forEach(el => el.oninput = async () => { state.character.notes = el.value; await saveCharacter(); });
  document.querySelectorAll("[data-builder]").forEach(el => el.onchange = async () => { await readBuilder(); });
  document.querySelectorAll("[data-stat]").forEach(el => el.onchange = async () => { state.character.stats[el.dataset.stat] = Number(el.value); await saveCharacter(); render(); });
  document.querySelectorAll("[data-skill]").forEach(el => el.onchange = async () => { toggleArray(state.character.skillProficiencies, el.dataset.skill, el.checked); await saveCharacter(); render(); });

  const cls = document.querySelector('[data-builder="class"]');
  if (cls) cls.addEventListener("change", async () => { state.character.subclass = null; await readBuilder(); await populateSubclasses(state.character.class?.name, null); });
}

async function readBuilder() {
  const c = state.character;
  const get = key => document.querySelector(`[data-builder="${key}"]`);
  if (get("name")) c.name = get("name").value.trim() || "Unnamed Character";
  if (get("player")) c.player = get("player").value.trim();
  if (get("level")) c.level = Math.min(20, Math.max(1, Number(get("level").value || 1)));
  if (get("ac")) c.ac = Number(get("ac").value || 10);
  if (get("speed")) c.speed = Number(get("speed").value || 30);
  if (get("hp")) c.hp = Number(get("hp").value || 0);
  if (get("maxHpOverride")) c.maxHpOverride = get("maxHpOverride").value === "" ? null : Number(get("maxHpOverride").value);
  if (get("notes")) c.notes = get("notes").value;
  if (get("feat")) c.feat = get("feat").value ? {name:get("feat").value,source:"XPHB"} : null;
  if (get("species")) c.species = get("species").value ? {name:get("species").value,source:"XPHB"} : null;
  if (get("background")) c.background = get("background").value ? {name:get("background").value,source:"XPHB"} : null;
  if (get("class")) {
    const className = get("class").value;
    if (className) {
      c.class = {name:className,source:"XPHB"};
      const sub = get("subclass")?.value;
      if (sub) c.subclass = {name:sub,source:"XPHB"};
    } else { c.class=null; c.subclass=null; }
  }
  await saveCharacter();
}

function toggleArray(arr, value, forced) {
  const has = arr.includes(value);
  const shouldHave = typeof forced === "boolean" ? forced : !has;
  if (shouldHave && !has) arr.push(value);
  if (!shouldHave && has) arr.splice(arr.indexOf(value),1);
}

async function openSpellPicker() {
  const spells = sourceEntries(state.data.spells,"spell").sort((a,b)=>a.level-b.level || a.name.localeCompare(b.name));
  const max = (await deriveCharacter()).maxPrepared;
  openModal("Manage prepared spells", `<div class="spell-toolbar"><input id="spellSearch" type="text" placeholder="Search spells…"><span class="status-pill" id="spellCount">${state.character.preparedSpells.length}${max!=null?` / ${max}`:""} prepared</span></div><div id="pickerSpells" class="spell-list"></div>`);
  const renderList = () => {
    const q = (document.querySelector("#spellSearch")?.value || "").toLowerCase().trim();
    const items = spells.filter(s => !q || s.name.toLowerCase().includes(q)).slice(0,220);
    const root = document.querySelector("#pickerSpells");
    if (!root) return;
    root.innerHTML = items.map(s => {
      const id = `${s.name}|${s.source}`.toLowerCase();
      const selected = state.character.preparedSpells.some(x=>String(x).toLowerCase()===id);
      return `<div class="spell-row"><input type="checkbox" data-pick-spell="${escapeHtml(`${s.name}|${s.source}`)}" ${selected?"checked":""}><div><div class="name">${escapeHtml(s.name)}</div><div class="meta">${s.level===0?"Cantrip":`Level ${s.level}`} · ${escapeHtml(spellSchoolName(s.school))}</div></div><button class="button button-small" data-pick-detail="${encodeURIComponent(`${s.name}|${s.source}`)}">Info</button></div>`;
    }).join("") || `<div class="empty">No matching spells.</div>`;
    root.querySelectorAll("[data-pick-spell]").forEach(cb=>cb.addEventListener("change",async()=>{
      const id=cb.dataset.pickSpell; const lower=id.toLowerCase(); const idx=state.character.preparedSpells.findIndex(x=>String(x).toLowerCase()===lower);
      const maxNow=(await deriveCharacter()).maxPrepared;
      if(cb.checked){ if(maxNow!=null && state.character.preparedSpells.length>=maxNow){cb.checked=false; showToast(`Prepared spell limit reached (${maxNow}).`); return;} if(idx<0) state.character.preparedSpells.push(id); }
      else if(idx>=0) state.character.preparedSpells.splice(idx,1);
      await saveCharacter(); document.querySelector("#spellCount").textContent = `${state.character.preparedSpells.length}${maxNow!=null?` / ${maxNow}`:""} prepared`;
    }));
    root.querySelectorAll("[data-pick-detail]").forEach(btn=>btn.addEventListener("click",()=>{const s=spellById(decodeURIComponent(btn.dataset.pickDetail)); if(s) openSpellModal(s);}));
  };
  document.querySelector("#spellSearch").addEventListener("input",renderList); renderList();
}

function openSpellModal(s) {
  const desc = entriesToText(s.entries || []);
  const higher = entriesToText(s.entriesHigherLevel || []);
  openModal(s.name, `<div class="note">${s.level===0?"Cantrip":`Level ${s.level}`} · ${escapeHtml(spellSchoolName(s.school))} · ${escapeHtml(s.source)}</div><p><strong>Time:</strong> ${escapeHtml(entriesToText(s.time || []))}</p><p><strong>Range:</strong> ${escapeHtml(s.range ? JSON.stringify(s.range) : "—")}</p><p style="line-height:1.6">${escapeHtml(desc)}</p>${higher?`<hr><p><strong>At Higher Levels</strong></p><p style="line-height:1.6">${escapeHtml(higher)}</p>`:""}`);
}

async function openItemPicker() {
  try {
    const data = await getItemsData();
    const items = sourceEntries(data,"item").sort((a,b)=>a.name.localeCompare(b.name));
    openModal("Add 5etools item", `<div class="item-toolbar"><input id="itemSearch" type="text" placeholder="Search 2024 items…"></div><div id="itemResults" class="spell-list"></div>`);
    const renderItems = () => {
      const q=(document.querySelector("#itemSearch")?.value||"").toLowerCase().trim();
      const filtered=items.filter(i=>!q||i.name.toLowerCase().includes(q)).slice(0,180);
      const root=document.querySelector("#itemResults"); if(!root) return;
      root.innerHTML=filtered.map(i=>`<div class="spell-row"><div><div class="name">${escapeHtml(i.name)}</div><div class="meta">${escapeHtml(i.type||"")} · ${escapeHtml(i.source)}</div></div><button class="button button-small button-primary" data-add-item="${encodeURIComponent(i.name)}">Add</button><button class="button button-small" data-item-detail="${encodeURIComponent(i.name)}">Info</button></div>`).join("") || `<div class="empty">No matching items.</div>`;
      root.querySelectorAll("[data-add-item]").forEach(btn=>btn.addEventListener("click",async()=>{const name=decodeURIComponent(btn.dataset.addItem); const existing=state.character.inventory.find(i=>i.name===name); if(existing) existing.quantity++; else state.character.inventory.push({name,source:"XPHB",quantity:1}); await saveCharacter(); closeModal(); render();}));
      root.querySelectorAll("[data-item-detail]").forEach(btn=>btn.addEventListener("click",()=>{const it=items.find(i=>i.name===decodeURIComponent(btn.dataset.itemDetail)); if(it) openModal(it.name, `<div class="note">${escapeHtml(it.source)} · ${escapeHtml(it.type||"")}</div><p style="line-height:1.6">${escapeHtml(entriesToText(it.entries || []))}</p>`);}));
    };
    document.querySelector("#itemSearch").addEventListener("input",renderItems); renderItems();
  } catch(e) { showToast(`Items could not be loaded: ${e.message}`); }
}

function openModal(title, body) {
  const root=document.querySelector("#modalRoot");
  root.innerHTML=`<div class="modal-backdrop" data-modal-backdrop><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div class="modal-title">${escapeHtml(title)}</div><button class="modal-close" data-modal-close>Close</button></div><div class="modal-body">${body}</div></section></div>`;
  root.querySelector("[data-modal-close]").onclick=closeModal;
  root.querySelector("[data-modal-backdrop]").addEventListener("click",e=>{if(e.target===e.currentTarget) closeModal();});
}
function closeModal(){const root=document.querySelector("#modalRoot"); if(root) root.innerHTML="";}

function exportCharacter(){
  const blob=new Blob([JSON.stringify(state.character,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${(state.character.name||"character").replace(/[^a-z0-9-_]+/gi,"-").toLowerCase()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function openImport(){
  const input=document.createElement("input"); input.type="file"; input.accept="application/json"; input.onchange=async()=>{const file=input.files?.[0]; if(!file)return; try{const parsed=JSON.parse(await file.text()); if(!parsed?.schema || !parsed?.stats) throw new Error("This does not look like a character exported by this app."); state.character=parsed; await saveCharacter(); render(); showToast("Character imported.");}catch(e){showToast(`Import failed: ${e.message}`);}}; input.click();
}

window.addEventListener("online",()=>{state.online=true; updateHeader();});
window.addEventListener("offline",()=>{state.online=false; updateHeader();});
document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{state.view=btn.dataset.view; render();}));
document.querySelector("#updateBtn")?.addEventListener("click",()=>syncData(true));

async function init(){
  await loadCharacter();
  updateHeader();
  render();
  if(state.online) await syncData(false); else if(state.version) { try { state.data=await loadCoreData(state.version); render(); } catch(e) { console.warn(e); } }
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(console.warn);
}

init().catch(err=>{console.error(err);showToast(`Startup error: ${err.message}`);});
