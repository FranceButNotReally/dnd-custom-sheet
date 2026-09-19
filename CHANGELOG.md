# Changelog

## 0.6.0
- Fixed the `sourceSet?.has is not a function` startup crash caused by passing `Array.filter` arguments into the source-check helper.
- Added a rules-effect layer for selected feats and class features, including Unarmored Defense, Unarmored Movement, Fast Movement, Tough, Alert, Observant, feat ability increases, and feat saving-throw proficiency choices.
- Normalized 5etools skill identifiers so values such as `animal handling` correctly become the internal `animalHandling` skill and contribute to skill bonuses.
- Improved automatic AC derivation and expose the reason/source on the sheet.
- Added derived passive Investigation, damage-resistance, sense, initiative, speed, and HP effects where the selected 5etools data provides them.
- Made the origin-feat picker stop offering arbitrary feats when a background has no origin-feat reference.
- Migrated character schema to v5 and bumped the service-worker shell cache.
- Added visible Active Rules Effects so automated modifiers can be checked at the table.
