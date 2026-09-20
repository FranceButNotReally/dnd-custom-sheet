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
