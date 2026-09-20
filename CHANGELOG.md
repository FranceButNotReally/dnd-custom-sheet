# Changelog

## v0.34.0

- Restored the known-good v0.28 equipment catalog behavior rather than replacing it with a new item-filtering layer.
- Kept the automatic staged full-library synchronization and all previously added character-sheet functionality.
- Added validation of cached/downloaded item data before accepting `data/items.json`.
- Added single-flight requests so simultaneous loaders cannot race on the same versioned data file.
- Added explicit equipment-index validation before the rules library is considered ready.
- Added exact raw-catalog fallback for XPHB item references, including `dagger|xphb` and `quarterstaff|xphb`.
- Added forgiving equipment search for plurals and small spelling errors.
- Added repeatable Node smoke tests covering the equipment data path and cache behavior.
- Bumped the PWA shell cache to v340.

## v0.33.0

- Fixed a regression where the equipment catalog could be considered cached even when core 2024 items such as Dagger and Quarterstaff were missing or excluded from the item index.
- Added explicit 2024 equipment catalog validation for Dagger, Quarterstaff, Mace, Shield, and Leather Armor.
- Added fresh online repair of the item catalog when cached equipment data fails validation.
- Rebuilt the item index using explicit 2024 core sources (XPHB/XDMG/XMM) as well as 2024-marked entries.
- Kept the staged full-library synchronization model; no separate extended-cache action was added.

## v0.32.0

- Reworked rules-data loading into staged batches with a visible progress overlay.
- Startup now waits for synchronization to finish before exposing the character sheet, and individual downloads retry transient failures automatically.
- Initial synchronization now completes the 2024 player-facing cache before normal sheet views are enabled.
- Interrupted/incomplete caches are detected and resumed rather than leaving individual features dependent on whichever files happened to finish downloading.
- 
# Changelog

## v0.29.0

- Fixed the `bgMode is not defined` regression in the background ability editor by restoring the local mode/selection variables before rendering.
- The complete library is now synchronized through the same automatic staged process; there is no separate extended-cache operation.
- Added visible progress to extended caching so a long cache operation no longer appears to do nothing.


## v0.28.0
- Added explicit 2024 PHB Standard Array by Class assignments for the Standard Array button.
- Added Common plus two selectable non-rare Standard Languages to character creation.
- Added class/background proficiency-overlap indicators, with overlapping background skills marked in class-skill choices.
- Removed the redundant Rest & Recovery panel; rest controls remain in Resources.
- The complete 2024 rules library is now synchronized automatically in staged batches; there is no separate extended-cache action.
- Added click-to-open notes for weapon/cantrip attack details.
- Added long-press rules lookup for touch-device condition chips while preserving tap-to-toggle.
- Added an in-app explanation of Equipped versus Wielding.

# v0.27.0 — equipment, spells, filters, and editor polish

- Fixed equipment hydration and weapon equip/wield resolution.
- Added robust Simple/Martial weapon proficiency token handling for Weapon Mastery.
- Weapon Mastery now derives from the complete official 2024 weapon catalog and no longer drops standard weapons because `rarity` is `"none"`.
- Added legacy PHB → XPHB spell reference fallback.
- Spell browser/filter now forces the current XPHB catalog into the merged cache before filtering.
- Equipment page now has inventory search/category/equipped filters.
- Removed redundant gaming-set placeholders once a concrete gaming set is selected.
- Removed duplicate special-sense text so Darkvision 120 ft. is shown once.
- Background ability choices support the 2024 +1/+1/+1 mode.
- Management/editor controls use the parchment character-sheet visual system with readable light inputs and modal surfaces.
- Service-worker cache bumped so the new shell is actually delivered.

## v0.25.0

- Fixed structured starting-equipment resolution by loading 2024 item data before applying equipment choices.
- Fixed Equipment rendering so weapon/item references and Equip/Wield controls resolve against cached item data.
- Expanded special-sense discovery/caching for Darkvision, Blindsight, Tremorsense, and Truesight, including prose and direct `senses` structures.
- Normalized gaming-set labels such as `Dragonchess Set` to `Dragonchess` and suppresses redundant `Choose a Gaming Set` entries when a concrete choice is present.
- Kept conditions hover-only on the sheet.
- Tightened HP action sizing for narrow layouts.
- Long Rest now restores all spent Hit Dice per the 2024 rules.
- Refined the character-sheet visual styling and interaction surfaces.


## v0.24.0
- Fixed overlapping Hit Point controls with responsive grid layout.
- Removed redundant condition info controls; conditions retain hover behavior.
- Added persistent special-sense cache fallbacks and character-sheet sense display.
- Made automatic limited-use resources visible on the character sheet; Rage is derived from class-table uses when necessary.
- Improved starting-equipment resolution and weapon visibility/equip state.
- Spell links now use the shared reference/hover system without nested interactive controls; spell view forces XPHB hydration on entry.
- Tool-choice labels display concise names such as Dragonchess while retaining canonical 5etools item references.
- Weapon Mastery uses the base XPHB weapon set only, deduplicated and presented as a compact selector.
- Applied the character-sheet visual language consistently across the app surfaces.
## 0.22.0

- Fixed 2024 optional-feature progression handling for class data that uses `optionalfeatureProgression` and `featureType`, notably Warlock Eldritch Invocations.
- Fixed class-table Pact Magic slot resolution and kept prepared-spell classes from being incorrectly capped by a known-spells progression.
- Added conservative automatic resource detection for feature text when 5etools has no structured `uses` object, including limited-use features such as Action Surge and Indomitable.
- Automatic class-table resources and text-derived feature resources now carry an explicit `auto` mode and feature origin.
- Automatic resources can no longer be deleted as though they were manual resources.
- Removed dynamic expression evaluation from resource maxima.
- Fixed Fast Movement so its +10-foot bonus is suppressed while wearing Heavy Armor, including when AC is manually overridden.
- Armor Strength speed penalties are now checked against equipped armor rather than only trained armor.

## 0.21.0

- Initial character render no longer waits for the complete class and spell datasets.
- Class files are loaded on demand; spell files are loaded by source/reference and the full spell index is only hydrated when the spell browser is opened.
- Added reference caching for rules entities and removed the `spellById()` / `canonicalLabel()` recursion path.
- Added robust targeted spell resolution for tooltips and selected spells.
- HP controls now support direct setting plus damage/healing, with Temporary HP absorbed before normal HP.
- Death saves are only editable at 0 HP and reset when HP becomes positive; Short Rest no longer resets them.
- Added explicit Senses display, including species Darkvision/special senses and manual additional senses.
- Added automatic/manual resource state with automatic resources linked to their originating feature when structured `uses` data is available.
- Preserved Weapon Mastery reconciliation against proficiency and current mastery limit.
- Discarded the legacy max-HP=1 migration artifact when upgrading older character data.


## 0.14.0

- Expanded player-data synchronization beyond XPHB by discovering qualifying official 2024/revised sources.
- Added structured derived effects for Unarmored Defense, Tough, Alert, Defense/Archery/Dueling/Thrown Weapon Fighting, Dwarven Toughness/Resilience, Dual Wielder, and movement features.
- Fixed stale legacy AC and max-HP overrides.
- Added automatic/manual max HP state and recovery controls.
- Added ability score values alongside modifiers.
- Added passive Perception and linked proficiencies/languages.
- Added hover/tap reference links for conditions, rules keywords, equipment, features, traits, feats, and weapon masteries.
- Improved 5etools inline-tag rendering, including Concentration/variantrule links, paragraphs, lists, tables, and insets.
- Improved capitalization of 5etools identifiers for display.
- Added starting-equipment option handling for multiple groups, background equipment, currency conversion, and linked equipment entries.
- Added partial Weapon Mastery tracking and rule displays.
- Added subclass gating below level 3 and pruned invalid post-level-up choices.
- Fixed feat weighted-choice key collisions.
- Added item-backed tool and language selectors.
- Added exhaustion penalties to d20 tests and speed.
- Bumped PWA shell cache to v14.
