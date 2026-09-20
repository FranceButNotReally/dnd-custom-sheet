import fs from 'node:fs';
const s = fs.readFileSync(new URL('./app.js', import.meta.url), 'utf8');
for (const needle of [
  'WEAPON_PROPERTY_INFO',
  'WEAPON_MASTERY_INFO',
  'SPELL_COMPONENT_INFO',
  'function weaponNotePayload',
  'function spellNotePayload',
  'data-note-payload',
  'renderAttackNoteDialog',
]) if (!s.includes(needle)) throw new Error(`Missing ${needle}`);
if (s.includes('renderAttackDetails(row.details')) throw new Error('Old duplicated-details renderer remains');
if (!s.includes('row.notePayload')) throw new Error('Attack rows are not using note payloads');
console.log('attack notes smoke test passed');
