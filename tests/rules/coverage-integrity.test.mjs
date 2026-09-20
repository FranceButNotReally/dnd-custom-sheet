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

test("spell selection remains explicitly tracked as a gap until fixed", () => {
  const spellSelection = registry.domains.find(x => x.id === "spell-selection");
  assert.ok(spellSelection);
  assert.equal(spellSelection.status, "gap");
});
