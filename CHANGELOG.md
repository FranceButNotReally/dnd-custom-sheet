# v0.27.2 — equipment, spells, filters, and editor polish

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

# Changelog

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

## v0.27.6
- Added an Equipment Cache Diagnostic on Data & App showing cached item/weapon counts and exact starting-equipment reference resolution.
