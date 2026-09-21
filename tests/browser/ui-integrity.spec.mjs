import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCK = JSON.parse(await fs.readFile(path.join(ROOT, 'tests/fixtures/5etools-version.json'), 'utf8'));
const DATA = path.join(ROOT, 'tests/.cache', LOCK.version);
const RAW_PREFIX = `/5etools-mirror-3/5etools-src/${LOCK.version}/`;

async function mockRulesNetwork(page) {
  await page.route('https://api.github.com/repos/5etools-mirror-3/5etools-src/releases/latest', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ tag_name: LOCK.version }),
  }));
  await page.route('https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/**', async route => {
    const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
    const marker = pathname.indexOf(RAW_PREFIX);
    if (marker < 0) return route.abort('failed');
    const relative = pathname.slice(marker + RAW_PREFIX.length);
    const file = path.resolve(DATA, relative);
    if (file !== DATA && !file.startsWith(`${DATA}${path.sep}`)) return route.abort('blockedbyclient');
    try {
      const body = await fs.readFile(file);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    } catch {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    }
  });
}

async function openReadySheet(page) {
  await mockRulesNetwork(page);
  await page.goto('/index.html');
  await expect(page.locator('#dataBadge')).toContainText(LOCK.version, { timeout: 60_000 });
  await expect(page.locator('#cacheProgressRoot')).toBeHidden({ timeout: 60_000 });
  await expect(page.locator('.sheet-stage')).toBeVisible();
}

async function currentCharacter(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('dnd-2024-5etools-sheet', 5);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const get = (store, key) => new Promise((resolve, reject) => {
      const request = db.transaction(store, 'readonly').objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result?.value ?? request.result ?? null);
      request.onerror = () => reject(request.error);
    });
    const id = await get('kv', 'currentCharacterId');
    return get('characters', id);
  });
}

async function updateCurrentCharacter(page, changes) {
  await page.evaluate(async patch => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('dnd-2024-5etools-sheet', 5);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = (store, key) => new Promise((resolve, reject) => {
      const request = db.transaction(store, 'readonly').objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result?.value ?? request.result ?? null);
      request.onerror = () => reject(request.error);
    });
    const id = await read('kv', 'currentCharacterId');
    const current = await read('characters', id);
    await new Promise((resolve, reject) => {
      const tx = db.transaction('characters', 'readwrite');
      tx.objectStore('characters').put({ ...current, ...patch, id });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }, changes);
}

async function seedCharacterDatabase(page, character) {
  await page.goto('/manifest.webmanifest');
  await page.evaluate(async raw => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('dnd-2024-5etools-sheet', 5);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('kv')) database.createObjectStore('kv', { keyPath: 'key' });
        if (!database.objectStoreNames.contains('data')) database.createObjectStore('data', { keyPath: 'key' });
        if (!database.objectStoreNames.contains('characters')) database.createObjectStore('characters', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise((resolve, reject) => {
      const tx = db.transaction(['kv', 'characters'], 'readwrite');
      tx.objectStore('characters').put(raw);
      tx.objectStore('kv').put({ key: 'currentCharacterId', value: raw.id });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }, character);
}

test('builder choices survive save and reload through IndexedDB', async ({ page }) => {
  await openReadySheet(page);
  await page.getByRole('button', { name: 'Builder' }).click();

  const name = page.locator('[data-builder="name"]');
  await name.fill('Browser Sentinel');
  await name.press('Tab');

  await page.locator('[data-builder="species"]').selectOption('Elf|XPHB');
  await expect(page.locator('[data-species-choice]').first()).toBeVisible();
  await page.locator('[data-species-choice]').first().selectOption({ label: 'High Elf' });

  await page.locator('[data-builder="background"]').selectOption('Acolyte|XPHB');
  await expect(page.locator('[data-builder="bgPlus2"]')).toBeVisible();
  await page.locator('[data-builder="bgPlus2"]').selectOption('wis');
  await page.locator('[data-builder="bgPlus1"]').selectOption('int');

  await page.locator('[data-builder="class"]').selectOption('Cleric|XPHB');
  await expect(page.locator('[data-class-feature-choice]').first()).toBeVisible();
  await page.locator('[data-class-feature-choice]').first().selectOption({ label: 'Protector' });

  await page.locator('[data-builder="standardLanguage1"]').selectOption('Draconic');
  await page.locator('[data-builder="standardLanguage2"]').selectOption('Elvish');
  await page.locator('[data-class-skill="medicine"]').check();
  await page.locator('[data-class-skill="persuasion"]').check();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.locator('.sheet-brandline h1')).toHaveText('Browser Sentinel');
  let saved = await currentCharacter(page);
  expect(saved.species).toEqual({ name: 'Elf', source: 'XPHB' });
  expect(saved.background).toEqual({ name: 'Acolyte', source: 'XPHB' });
  expect(saved.class).toEqual({ name: 'Cleric', source: 'XPHB' });
  expect(saved.standardLanguages).toEqual(['Draconic', 'Elvish']);
  expect(saved.classSkillChoices).toEqual(expect.arrayContaining(['medicine', 'persuasion']));
  expect(Object.values(saved.classFeatureChoices)).toContainEqual({ name: 'Protector', source: 'XPHB' });
  expect(Object.values(saved.speciesChoices).some(choice => choice?.value === 'High Elf')).toBe(true);

  await page.reload();
  await expect(page.locator('#dataBadge')).toContainText(LOCK.version);
  await expect(page.locator('.sheet-brandline h1')).toHaveText('Browser Sentinel');
  saved = await currentCharacter(page);
  expect(saved.name).toBe('Browser Sentinel');
  expect(saved.standardLanguages).toEqual(['Draconic', 'Elvish']);
});

test('legacy character migrations are persisted, not only applied in memory', async ({ page }) => {
  await mockRulesNetwork(page);
  await seedCharacterDatabase(page, {
    id: 'legacy-browser-character',
    schema: 16,
    name: 'Legacy Sentinel',
    level: 1,
    class: { name: 'Cleric', source: 'XPHB' },
    hpCurrent: 8,
    deathSaves: { success: 2, failure: 1 },
    knownSpells: ['Cure Wounds|XPHB'],
    preparedSpells: ['Bless|XPHB'],
  });
  await page.goto('/index.html');
  await expect(page.locator('#dataBadge')).toContainText(LOCK.version, { timeout: 60_000 });
  await expect(page.locator('.sheet-brandline h1')).toHaveText('Legacy Sentinel');

  const migrated = await currentCharacter(page);
  expect(migrated.schema).toBe(17);
  expect(migrated.knownSpells).toEqual([]);
  expect(migrated.preparedSpells).toEqual(expect.arrayContaining(['Bless|XPHB', 'Cure Wounds|XPHB']));
  expect(migrated.deathSaves).toEqual({ success: 0, failure: 0 });
});

test('sheet controls persist Short Rest, Long Rest, and critical damage at 0 HP', async ({ page }) => {
  await openReadySheet(page);
  await updateCurrentCharacter(page, {
    name: 'State Sentinel',
    level: 3,
    class: { name: 'Fighter', source: 'XPHB' },
    hpAuto: false,
    hpMaxOverride: 30,
    hpCurrent: 10,
    hitDiceUsed: 0,
    tempHp: 0,
    resources: [
      { name: 'Short Pool', max: 3, current: 1, recharge: 'short', mode: 'manual' },
      { name: 'Long Pool', max: 4, current: 1, recharge: 'long', mode: 'manual' },
    ],
  });
  await page.reload();
  await expect(page.locator('.sheet-brandline h1')).toHaveText('State Sentinel');

  const prompts = ['1', '5'];
  page.on('dialog', async dialog => dialog.accept(prompts.shift() ?? '0'));
  await page.getByRole('button', { name: 'Short Rest' }).click();
  await expect(page.getByText('Short Pool').locator('..').getByText('3/3')).toBeVisible();
  let saved = await currentCharacter(page);
  expect(saved.hitDiceUsed).toBe(1);
  expect(saved.hpCurrent).toBeGreaterThan(10);
  expect(saved.resources.find(resource => resource.name === 'Long Pool').current).toBe(1);

  await page.getByRole('button', { name: 'Long Rest' }).click();
  await expect(page.getByText('30 / 30')).toBeVisible();
  saved = await currentCharacter(page);
  expect(saved.hitDiceUsed).toBe(0);
  expect(saved.resources.find(resource => resource.name === 'Long Pool').current).toBe(4);

  await updateCurrentCharacter(page, { hpCurrent: 0, deathSaves: { success: 0, failure: 0 } });
  await page.reload();
  await expect(page.getByText('Dying', { exact: false })).toBeVisible();
  const damageDialogs = ['1', 'yes'];
  page.removeAllListeners('dialog');
  page.on('dialog', async dialog => {
    const response = damageDialogs.shift();
    if (dialog.type() === 'confirm') await dialog.accept();
    else await dialog.accept(response ?? '1');
  });
  await page.getByRole('button', { name: 'Damage' }).click();
  saved = await currentCharacter(page);
  expect(saved.deathSaves.failure).toBe(2);
});

test('Wizard spellbook, prepared spell, and cantrip selections persist through the UI', async ({ page }) => {
  await openReadySheet(page);
  await updateCurrentCharacter(page, {
    name: 'Spell Sentinel',
    level: 3,
    class: { name: 'Wizard', source: 'XPHB' },
    subclass: null,
    spellbook: [],
    preparedSpells: [],
    knownSpells: [],
    cantrips: [],
  });
  await page.reload();
  await page.getByRole('button', { name: 'Spells' }).click();

  await page.getByRole('button', { name: /^Spellbook/ }).click();
  await expect(page.getByRole('button', { name: /^Spellbook/ })).toHaveClass(/active/);
  await page.locator('#spellSearch').fill('Magic Missile');
  await page.locator('[data-spell-toggle="Magic Missile|XPHB"]').check();
  await expect.poll(async () => (await currentCharacter(page)).spellbook).toContain('Magic Missile|XPHB');

  await page.getByRole('button', { name: /^Prepared/ }).click();
  await expect(page.getByRole('button', { name: /^Prepared/ })).toHaveClass(/active/);
  await page.locator('#spellSearch').fill('Magic Missile');
  await page.locator('[data-spell-toggle="Magic Missile|XPHB"]').check();
  await expect.poll(async () => (await currentCharacter(page)).preparedSpells).toContain('Magic Missile|XPHB');

  await page.getByRole('button', { name: /^Cantrips/ }).click();
  await expect(page.getByRole('button', { name: /^Cantrips/ })).toHaveClass(/active/);
  await page.locator('#spellSearch').fill('Mage Hand');
  await page.locator('[data-spell-toggle="Mage Hand|XPHB"]').check();
  await expect.poll(async () => (await currentCharacter(page)).cantrips).toContain('Mage Hand|XPHB');

  let saved = await currentCharacter(page);
  expect(saved.spellbook).toContain('Magic Missile|XPHB');
  expect(saved.preparedSpells).toContain('Magic Missile|XPHB');
  expect(saved.cantrips).toContain('Mage Hand|XPHB');

  await page.reload();
  await page.getByRole('button', { name: 'Spells' }).click();
  await page.getByRole('button', { name: /^Cantrips/ }).click();
  await expect(page.getByRole('button', { name: /^Cantrips/ })).toHaveClass(/active/);
  await page.locator('#spellSearch').fill('Mage Hand');
  await expect(page.locator('[data-spell-toggle="Mage Hand|XPHB"]')).toBeChecked();
  saved = await currentCharacter(page);
  expect(saved.knownSpells).toEqual([]);
});

test('equipment can be added, wielded, attuned, and reloaded from the real catalog UI', async ({ page }) => {
  await openReadySheet(page);
  await updateCurrentCharacter(page, {
    name: 'Equipment Sentinel',
    level: 3,
    class: { name: 'Fighter', source: 'XPHB' },
    inventory: [],
  });
  await page.reload();
  await page.getByRole('button', { name: 'Equipment' }).click();

  await page.getByRole('button', { name: 'Add item' }).click();
  await page.locator('#itemSearch').fill('Dagger');
  const daggerResult = page.locator('#itemResults .spell-row').filter({ hasText: 'Dagger' }).first();
  await daggerResult.getByRole('button', { name: 'Add' }).click();
  let daggerRow = page.locator('#equipmentRows .equipment-row').filter({ hasText: 'Dagger' }).first();
  await daggerRow.getByRole('button', { name: 'Wield' }).click();
  daggerRow = page.locator('#equipmentRows .equipment-row').filter({ hasText: 'Dagger' }).first();
  await daggerRow.locator('[data-action="qty-plus"]').click();

  await page.getByRole('button', { name: 'Add item' }).click();
  await page.locator('#itemSearch').fill('Arrow-Catching Shield');
  const shieldResult = page.locator('#itemResults .spell-row').filter({ hasText: 'Arrow-Catching Shield' }).first();
  await shieldResult.getByRole('button', { name: 'Add' }).click();
  const shieldRow = page.locator('#equipmentRows .equipment-row').filter({ hasText: 'Arrow-Catching Shield' }).first();
  await shieldRow.getByRole('button', { name: 'Attune' }).click();

  let saved = await currentCharacter(page);
  expect(saved.inventory.find(item => item.name === 'Dagger')).toMatchObject({ quantity: 2, equipped: true, wielding: true });
  expect(saved.inventory.find(item => item.name === 'Arrow-Catching Shield')).toMatchObject({ attuned: true });

  await page.reload();
  await page.getByRole('button', { name: 'Equipment' }).click();
  await expect(page.locator('#equipmentRows .equipment-row').filter({ hasText: 'Dagger' })).toContainText('×2');
  await expect(page.locator('#equipmentRows .equipment-row').filter({ hasText: 'Arrow-Catching Shield' })).toContainText('Attuned');
  saved = await currentCharacter(page);
  expect(saved.inventory).toHaveLength(2);
});

test('subclass progressions and invocation prerequisites work through the builder UI', async ({ page }) => {
  await openReadySheet(page);
  await updateCurrentCharacter(page, {
    name: 'Subclass Sentinel',
    level: 3,
    class: { name: 'Fighter', source: 'XPHB' },
    subclass: { name: 'Battle Master', source: 'XPHB' },
    optionalFeatureChoices: {},
    progressionFeats: {},
  });
  await page.reload();
  await page.getByRole('button', { name: 'Builder' }).click();

  let optionSlots = page.locator('[data-optional-feature]');
  await expect(optionSlots).toHaveCount(3);
  await optionSlots.nth(0).selectOption({ label: 'Ambush' });
  optionSlots = page.locator('[data-optional-feature]');
  await optionSlots.nth(1).selectOption({ label: 'Bait and Switch' });
  optionSlots = page.locator('[data-optional-feature]');
  await optionSlots.nth(2).selectOption({ label: "Commander's Strike" });
  await expect.poll(async () => Object.values((await currentCharacter(page)).optionalFeatureChoices || {}).length).toBe(3);

  await updateCurrentCharacter(page, {
    level: 5,
    class: { name: 'Warlock', source: 'XPHB' },
    subclass: { name: 'Fiend Patron', source: 'XPHB' },
    optionalFeatureChoices: {},
    progressionFeats: {},
  });
  await page.reload();
  await page.getByRole('button', { name: 'Builder' }).click();

  optionSlots = page.locator('[data-optional-feature]');
  await expect(optionSlots).toHaveCount(5);
  await expect(optionSlots.first().locator('option', { hasText: 'Ascendant Step' })).toHaveCount(1);
  await expect(optionSlots.first().locator('option', { hasText: 'Devouring Blade' })).toHaveCount(0);
  await expect(optionSlots.first().locator('option', { hasText: 'Thirsting Blade' })).toHaveCount(0);
  await optionSlots.first().selectOption({ label: 'Pact of the Blade' });

  optionSlots = page.locator('[data-optional-feature]');
  await expect(optionSlots.nth(1).locator('option', { hasText: 'Thirsting Blade' })).toHaveCount(1);
  await optionSlots.nth(1).selectOption({ label: 'Thirsting Blade' });
  await expect.poll(async () => Object.values((await currentCharacter(page)).optionalFeatureChoices || {}).map(value => value.name)).toEqual(expect.arrayContaining(['Pact of the Blade', 'Thirsting Blade']));

  await page.reload();
  const saved = await currentCharacter(page);
  expect(Object.values(saved.optionalFeatureChoices).map(value => value.name)).toEqual(expect.arrayContaining(['Pact of the Blade', 'Thirsting Blade']));
});

test('a synchronized installation reloads its shell and rules data offline', async ({ page, context }) => {
  await openReadySheet(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await updateCurrentCharacter(page, { name: 'Offline Sentinel' });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#networkBadge')).toContainText('Offline');
  await expect(page.locator('#dataBadge')).toContainText(LOCK.version);
  await expect(page.locator('.sheet-brandline h1')).toHaveText('Offline Sentinel');
  await expect(page.locator('#cacheProgressRoot')).toBeHidden({ timeout: 60_000 });
});

test.describe('touch interactions', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 820, height: 1180 } });

  test('long-pressing a condition opens its cached rules reference', async ({ page }) => {
    await openReadySheet(page);
    const blinded = page.locator('[data-action="condition"][data-condition="Blinded"]');
    await blinded.tap();
    await expect(blinded).toHaveClass(/selected/);

    const prone = page.locator('[data-action="condition"][data-condition="Prone"]');
    await prone.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true });
    await page.waitForTimeout(700);
    await expect(page.locator('#modalRoot')).toContainText('Prone');
    await expect(page.locator('#modalRoot')).toContainText(/condition/i);
    await prone.dispatchEvent('pointerup', { pointerType: 'touch', isPrimary: true });
    await prone.dispatchEvent('click');
    await page.locator('[data-modal-close]').click();

    const saved = await currentCharacter(page);
    expect(saved.conditions).toContain('Blinded');
    expect(saved.conditions).not.toContain('Prone');
  });
});
