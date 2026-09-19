# D&D 2024 Character Sheet PWA

Tablet-first Progressive Web App using 5etools data cached locally on the device.

## Deployment

Deploy the repository with GitHub Pages using `.github/workflows/pages.yml`.

## Rules data

The app checks the latest `5etools-mirror-3/5etools-src` release, discovers official 2024-era player-facing sources, downloads the relevant JSON data, and caches it locally. Character state is stored separately in IndexedDB.

The app does not require your PC, a home server, or a persistent network connection during play after the rules data has been synchronized.

## Character data

Character state is independent from rules data. It includes ability scores, feat choices, proficiencies, languages, equipment, spell selections, resources, current HP, and other play-state fields.

Characters can be exported/imported as JSON backups.

## 0.11.0 highlights

- Fixed Unarmored Defense and added an explicit AC breakdown.
- Fixed automatic maximum HP handling/display.
- Added language/tool choice slots.
- Added general feat progression support.
- Added structured starting-equipment choices.
- Added Weapon Mastery selection.
- Improved weapon attack and damage calculations.
- Added class-feature, subclass-feature, and optional-feature inline references.
- Fixed `Concentration`/`Advantage`-style 5etools reference labels.
- Fixed known-spell progression.
