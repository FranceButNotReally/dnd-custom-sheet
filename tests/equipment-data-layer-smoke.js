const fs = require("fs");
const vm = require("vm");

const sourcePath = require("path").join(__dirname, "..", "app.js");
const source = fs.readFileSync(sourcePath, "utf8");
const cutoff = source.indexOf("ensureCacheProgressRoot();");
if (cutoff < 0) throw new Error("Could not locate app initialization boundary.");

const context = {
  navigator: { onLine: true },
  console, setTimeout, clearTimeout, URL, AbortController, TextEncoder, TextDecoder,
  structuredClone: global.structuredClone, crypto: global.crypto, performance, Promise,
  Map, Set, Array, Object, String, Number, Boolean, Math, Date, RegExp, JSON,
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source.slice(0, cutoff) + "\nglobalThis.__testState = state; globalThis.__testPaths = PATHS;", context);

const state = context.__testState;
const PATHS = context.__testPaths;
const assert = (value, message) => { if (!value) throw new Error(message); };

state.data.officialSources = new Set(["XPHB", "XDMG"]);
state.data.items = { item: [
  { name: "Dagger", source: "XPHB", type: "M", weaponCategory: "simple", rarity: "none", mastery: [{ name: "Nick" }] },
  { name: "Quarterstaff", source: "XPHB", type: "M", weaponCategory: "simple", rarity: "none", mastery: [{ name: "Topple" }] },
  { name: "Mace", source: "XPHB", type: "M", weaponCategory: "simple", rarity: "none", mastery: [{ name: "Sap" }] },
  { name: "Shield", source: "XPHB", type: "S", rarity: "none" },
  { name: "Leather Armor", source: "XPHB", type: "LA", rarity: "none" },
  { name: "Dagger", source: "PHB", type: "M", weaponCategory: "simple" },
] };
state.data.itemIndex = context.buildItemIndex(state.data.items, state.data.officialSources);

assert(context.findOfficialItemByName("dagger", "xphb")?.source === "XPHB", "Dagger lookup failed");
assert(context.findOfficialItemByName("quarterstaff", "xphb")?.source === "XPHB", "Quarterstaff lookup failed");
assert(context.equipmentCatalogDiagnostics(state.data.items).missing.length === 0, "Equipment diagnostics failed");
assert(context.matchesSearchText("Quarterstaff", "quarterstuff"), "Quarterstaff typo search failed");
assert(context.matchesSearchText("Dagger", "daggers"), "Dagger plural search failed");
const terms = context.extractEquipmentTerms([{ item: "dagger|xphb" }, { item: "quarterstaff|xphb" }]);
assert(terms.length === 2 && terms[0].ref === "dagger|xphb" && terms[1].ref === "quarterstaff|xphb", "Plain 5etools item refs failed");

let cached = { item: [{ name: "Not a complete catalog", source: "XPHB" }] };
let fetchCount = 0, deleteCount = 0, storeCount = 0;
context.cachedData = async () => cached;
context.deleteCachedData = async () => { deleteCount++; cached = null; };
context.cacheData = async () => { storeCount++; };
context.fetchJson = async () => {
  fetchCount++;
  return { item: [
    { name: "Dagger", source: "XPHB" }, { name: "Quarterstaff", source: "XPHB" },
    { name: "Mace", source: "XPHB" }, { name: "Shield", source: "XPHB" },
    { name: "Leather Armor", source: "XPHB" },
  ] };
};
Promise.all([
  context.fetch5eData("v-test", PATHS.items),
  context.fetch5eData("v-test", PATHS.items),
]).then(() => {
  assert(fetchCount === 1, "Single-flight download failed");
  assert(deleteCount === 1, "Invalid cached catalog was not removed");
  assert(storeCount === 1, "Valid fresh catalog was not cached");
  console.log("equipment-data-layer-smoke: PASS");
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
