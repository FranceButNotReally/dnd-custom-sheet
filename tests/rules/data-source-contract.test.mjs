import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const LOCKFILE = path.join(ROOT, 'tests', 'fixtures', '5etools-version.json');

test('5etools dependency is pinned for reproducible data tests', () => {
  const lock = JSON.parse(fs.readFileSync(LOCKFILE, 'utf8'));
  assert.match(lock.source, /^5etools-mirror-3\/5etools-src$/);
  assert.match(lock.version, /^v\d+\.\d+\.\d+$/);
});
