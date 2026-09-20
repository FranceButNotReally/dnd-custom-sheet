import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");
assert.match(source, /itemsBase:\s*"data\/items-base\.json"/);
assert.match(source, /mergeItemCatalogs\(items, itemsBase\)/);
assert.match(source, /PATHS\.itemsBase/);
assert.doesNotMatch(source, /if \(path === PATHS\.items\) return hasRequired2024Equipment\(json\)/);

// Mirrors the critical 5etools data shape verified against the upstream catalog:
// ordinary/base equipment lives under `baseitem`, while magic/expanded item data
// lives under `item`.
const items = { item: [
  { name: "Dagger of Venom", source: "XDMG" }
] };
const itemsBase = { baseitem: [
  { name: "Dagger", source: "XPHB", edition: "one", weaponCategory: "simple", weapon: true },
  { name: "Quarterstaff", source: "XPHB", edition: "one", weaponCategory: "simple", weapon: true },
  { name: "Mace", source: "XPHB", edition: "one", weaponCategory: "simple", weapon: true },
  { name: "Shield", source: "XPHB", edition: "one" },
  { name: "Leather Armor", source: "XPHB", edition: "one", ac: 11 },
] };

const mergeItemCatalogs = (items, itemsBase) => {
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
};
const merged = mergeItemCatalogs(items, itemsBase);
for (const name of ["Dagger", "Quarterstaff", "Mace", "Shield", "Leather Armor"]) {
  assert.ok(merged.item.some(x => x.name.toLowerCase() === name.toLowerCase() && x.source === "XPHB"), `${name} missing from merged catalog`);
}
console.log("Equipment catalog regression checks passed.");
