import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/fixtures/rule-coverage.json"), "utf8"));

test("rules coverage registry is internally consistent", () => {
  const allowed = new Set(["covered", "partial", "gap", "manual"]);
  assert.ok(Array.isArray(registry.domains));
  assert.ok(registry.domains.length >= 20);
  const ids = new Set();
  for (const domain of registry.domains) {
    assert.ok(domain.id, "coverage domain missing id");
    assert.ok(!ids.has(domain.id), `duplicate coverage domain: ${domain.id}`);
    ids.add(domain.id);
    assert.ok(allowed.has(domain.status), `${domain.id}: invalid status ${domain.status}`);
    assert.ok(domain.notes, `${domain.id}: missing coverage note`);
  }
});

test("spell selection and spell collections have hard logic and browser coverage", () => {
  for (const id of ["spell-selection", "cantrips", "prepared-known-spells"]) {
    const domain = registry.domains.find(x => x.id === id);
    assert.ok(domain, id);
    assert.equal(domain.status, "covered", id);
  }
});

test("the PHB equipment tables have hard behavioral coverage", () => {
  for (const id of ["weapon-properties", "armor-and-shields", "equipment"]) {
    const domain = registry.domains.find(x => x.id === id);
    assert.ok(domain, id);
    assert.equal(domain.status, "covered", id);
  }
  assert.equal(registry.domains.find(x => x.id === "equipment-effects")?.status, "partial");
});

test("rest, Hit Dice, and death-state transitions have hard behavioral coverage", () => {
  for (const id of ["rests", "hit-dice", "death-saves", "hp-state"]) {
    const domain = registry.domains.find(x => x.id === id);
    assert.ok(domain, id);
    assert.equal(domain.status, "covered", id);
  }
});

test("browser-backed persistence, touch, and offline behavior are hard coverage", () => {
  for (const id of ["touch-interactions", "save-load-migration", "offline-cache"]) {
    const domain = registry.domains.find(x => x.id === id);
    assert.ok(domain, id);
    assert.equal(domain.status, "covered", id);
  }
  assert.equal(registry.domains.find(x => x.id === "ui-choices")?.status, "partial");
});

test("subclass and optional-feature coverage records the exhaustive pinned corpus honestly", () => {
  const subclasses = registry.domains.find(x => x.id === "subclass-choices");
  const optional = registry.domains.find(x => x.id === "optional-class-features");
  assert.equal(subclasses?.status, "partial");
  assert.match(subclasses.notes, /48 PHB subclasses/i);
  assert.match(subclasses.notes, /309 subclass-feature records/i);
  assert.equal(optional?.status, "covered");
  assert.match(optional.notes, /58 PHB optional features/i);
  assert.match(optional.notes, /Pact of the Tome/i);
  assert.match(optional.notes, /invocation cantrip targets/i);
  assert.match(optional.notes, /Lessons of the First Ones/i);
});

test("feat choices and conditions have complete behavioral and browser coverage", () => {
  const feats = registry.domains.find(x => x.id === "feat-choices");
  const conditions = registry.domains.find(x => x.id === "conditions");
  assert.equal(feats?.status, "covered");
  assert.match(feats.notes, /77 PHB feats/i);
  assert.match(feats.notes, /tool/i);
  assert.match(feats.notes, /Chromium/i);
  assert.equal(conditions?.status, "covered");
  assert.match(conditions.notes, /fifteen PHB conditions/i);
  assert.match(conditions.notes, /Concentration/i);
});
