# D&D 2024 Character Sheet Testing Strategy

The character sheet is rules-driven, so tests are organized around the things the sheet actually calculates or asks the player to choose.

## Source of truth

There are two distinct source roles:

1. **2024 Player's Handbook** — normative source for the intended rule outcome. This is what decides what a mechanic means.
2. **Pinned 5etools release** — machine-readable corpus used to make sure the application sees the same classes, species, feats, backgrounds, spells, items, and structured choice metadata. The pinned version lives in `tests/fixtures/5etools-version.json`.

Do not make the tests depend on `main` from 5etools. Update the pin deliberately and review the resulting corpus report when adopting a newer release.

## Test layers

### 1. Deterministic rules-engine tests

These run with Node's built-in test runner and no external packages. They exercise the real functions from `app.js` inside a small browser stub. They cover calculations such as ability modifiers, proficiency bonus, spell slots, weapon properties, armor defense, choice parsing, and derived feature effects.

A regression here must fail CI.

### 2. 5etools data-contract tests

`tests/data/fetch-5etools.mjs` fetches a pinned corpus. `tests/data/data-contract.test.mjs` then verifies that all official 2024 classes and sheet-relevant data structures are present and that the application can represent their structured choices.

This layer catches changes in 5etools data shape as well as missing parser support.

### 3. Corpus coverage audit

`tests/rules/corpus-audit.mjs` scans all XPHB feats, species, backgrounds, classes, and optional features for fields and textual signals that can affect the character sheet. It creates `test-reports/corpus-audit.json`.

The purpose is to make the remaining manual-rule-review surface visible. A new sheet-affecting construct should not silently appear without being classified.

The PHB feat layer also has an exhaustive 77-feat contract. Persistent sheet
effects and choices receive behavioral assertions; combat-only rules that need
a target, trigger, or die roll remain available through the linked feat rules
rather than being approximated as static bonuses.

The spell layer loads the pinned generated spell-source lookup alongside the
spell descriptions. Its corpus tests verify class and subclass eligibility,
current spell-level limits, Wizard spellbook preparation, always-prepared
spells, Eldritch Knight and Arcane Trickster progression, and every structured
PHB feat spell choice. Missing class metadata is never interpreted as access to
every spell list.

The equipment layer exhaustively checks the 40 PHB table weapons, all nine
weapon properties, all eight mastery properties, the twelve armor suits plus
Shield, and every PHB artisan tool and instrument. Behavioral cases cover the
real 5etools object form used by Lance, melee/ranged ability selection,
Versatile damage, Heavy requirements, armor Dexterity caps, armor-training and
Stealth penalties, heavy-armor Strength penalties, Shield stacking, equipment
weight, carrying capacity, and attunement-gated weapon/armor enhancements.
Conditional activated magic-item powers remain explicitly partial rather than
being applied as unconditional static bonuses.

The resource/state layer uses pure transitions for resource scaling, Short and
Long Rests, Hit Dice, damage, healing, temporary Hit Points, and death saves.
Its corpus contracts require every PHB class to expose an automatic resource
by level 20 and every class's PHB subclasses to yield stable resource specs.
Behavioral cases cover partial Short Rest recovery, preserving spent uses when
a resource maximum changes, Long Rest eligibility and complete reset effects,
Hit Dice healing, damage while at 0 Hit Points, critical-hit failures, massive
damage, stabilization, death, and recovery through healing.

### 4. Browser/UI integration

This is the next layer to expand. These tests should use a real browser against the actual PWA and exercise the same paths a player uses: character creation, selection controls, equipment, spell selection, save/skill displays, notes, rests, and touch interaction.

Browser tests should be deterministic by supplying fixture data locally rather than depending on live 5etools during the test.

## Rule coverage domains

The coverage registry in `tests/fixtures/rule-coverage.json` tracks the current state of each domain. `covered` means there is a hard behavioral test. `partial` means the feature exists but not every interaction has a golden case yet. `gap` means the behavior is known to be missing or unreliable.

The long-term target is for every sheet-affecting domain to move to `covered`.

## Golden-character philosophy

For high-value mechanics we should maintain small, fixed character fixtures with exact expected outputs. Examples:

- Gnome + Gnomish Cunning → Advantage on INT/WIS/CHA saves.
- Dwarf + Dwarven Toughness → +1 HP per level.
- Alert → Proficiency Bonus added to Initiative at the appropriate levels.
- Barbarian/Monk → correct Unarmored Defense formula.
- A character with a Dagger → correct Finesse/Light/Thrown behavior and attack calculation.
- A character with a mastered Quarterstaff → correct mastery availability and selection.
- A character using Tough, Dual Wielder, Fighting Styles, and selected feat proficiencies → exact derived values.

The important part is that the fixture starts from a known character state and asserts the complete relevant derived result, not merely that a parser returned something non-empty.

## Choice coverage

Every player-facing choice needs a test for both states:

- **unselected** — the sheet must not silently choose an option;
- **selected** — the chosen option must alter derived data exactly once.

This applies to background ability increases, class skills, languages, species lineages, feat abilities/saves/skills/tools/languages/expertise, Magic Initiate choices, weapon mastery, subclasses, optional class features, and spell selection.

Duplicate choices should also be tested where the rules prevent them.

## CI policy

The GitHub workflow runs deterministic tests, downloads the pinned 5etools corpus, runs data-contract checks, generates the corpus/coverage reports, and checks `app.js`/`sw.js` syntax.

The Pages deployment workflow should depend on the same rules gate so a failing rules test cannot deploy a broken sheet.

As the suite becomes more complete, branch protection should mark **Rules conformance** as a required status check. That is what turns a passing test suite into an actual merge gate.


## Browser test target

When the current rule-engine layer is stable, add Playwright tests for the actual rendered PWA. The browser suite should run at least Chromium desktop plus a touch-emulated tablet profile. It should verify the complete user path, not implementation details: create a character, make a choice, save it, reload it, and verify the derived sheet.

The most important browser scenarios are:

- Character creation with each of the 12 classes; standard array placement, class skills, background ability increases, languages, species choices, subclass, feats, optional class features, and weapon mastery.
- Derived sheet verification for saves, skills, AC, HP, speed, initiative, senses, resistances, resources, attacks, spellcasting, and rest/reset behavior.
- Resource interaction with small pip pools, large numeric pools, Short Rest Hit Dice spending, Long Rest eligibility, and Healthy/Dying/Stable/Dead displays.
- Equipment search/add/equip/wield/attune with Dagger, Quarterstaff, armor, shields, tools, starting-equipment references, weight/capacity, and visible training/Stealth/Heavy warnings.
- Spell selection for cantrips, prepared spells, Wizard spellbooks, subclass spellcasting, always-prepared spells, and feat-granted spells.
- Notes and rule-reference interaction with mouse click, touch click, and long press.
- Offline reload after synchronization, including the complete item and spell catalog.

For CI, browser tests should use a deterministic local fixture server rather than live 5etools. That keeps a rules regression test independent from network availability while the separate data-contract job checks the pinned upstream corpus. Playwright's current GitHub Actions guidance supports running the browser tests in CI and uploading reports/traces when a test fails.
