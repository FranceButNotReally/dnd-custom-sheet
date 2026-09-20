import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAppTestContext } from '../lib/app-context.mjs';
const a = loadAppTestContext();

test('weapon notes are explanatory and include property/mastery metadata', () => {
  const note = a.weaponNotePayload({name:'Dagger', property:['F','L','T'], mastery:'Nick'});
  assert.equal('damage' in note, false, "note payload should not duplicate the row damage field");
  assert.equal('attackBonus' in note, false, "note payload should not duplicate the row attack-bonus field");
  assert.ok(String(JSON.stringify(note)).includes('Finesse'));
  assert.ok(String(JSON.stringify(note)).includes('Nick'));
  assert.equal(note.kind, 'weapon');
  assert.ok(Array.isArray(note.properties));
  assert.ok(Array.isArray(note.mastery));
});

test('note keyword linker maps rules terms to the same reference system', () => {
  const linked = a.autoLinkNoteKeywords('Use a Bonus Action. The target has Disadvantage and becomes Prone.');
  assert.match(linked, /\{@variantrule Bonus Action\|XPHB\}/);
  assert.match(linked, /\{@variantrule Disadvantage\|XPHB\}/);
  assert.match(linked, /\{@condition Prone\|XPHB\}/);
});
