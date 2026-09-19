# Changelog

## 0.12.0
- Make saved AC overrides explicit and add one-tap return to automatic AC on the sheet.
- Clear legacy AC overrides from pre-v9 characters unless they were explicitly marked manual.
- Add one-tap return to automatic Max HP and make the automatic/manual state clearer.
- Improve inline rich-text support for `{@br}`, `{@hr}`, and `{@filter ...}`.
- Bump the service-worker shell cache.


## 0.11.1
- Fix inline reference parsing for no-body tags such as `{@br}`.
- Fix `{@filter ...}` labels so the visible text is the filter name instead of the data-page token.
- Bump the service-worker shell cache for reliable update of the new app shell.


## 0.11.0
- Fixed automatic Unarmored Defense calculation for Barbarian and Monk, including a visible AC breakdown.
- Fixed armor/shield type detection so equipped 5etools armor is recognized correctly.
- Fixed conditional AC handling: Defense applies only while armored, and Dual Wielder is no longer treated as a permanent bonus.
- Fixed automatic maximum HP display and expanded the HP formula/status display.
- Added automatic proficiency-choice slots for languages and common tool-choice categories.
- Added general feat progression slots from class `featProgression` data, while keeping optional class features separate.
- Added automatic starting-equipment application from 5etools structured equipment data.
- Added Weapon Mastery selection enforcement and display.
- Fixed known-spell progression to use the character's level value rather than summing the progression.
- Expanded inline 5etools reference handling to class features, subclass features, and optional features.
- Improved `@variantrule` parsing so keyword links display the rule name (for example, `Concentration`) instead of source IDs or prose labels.
- Added safer source-token detection and more robust nested inline-tag parsing.
- Improved weapon attack/damage calculations and only display selected Weapon Mastery on the attack row.
- Migrated character schema to v9 and bumped the service-worker shell cache.
