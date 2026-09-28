# D&D 2024 5etools Character Sheet PWA

Tablet-first D&D 2024 character builder and sheet backed by versioned 5etools data.

## Deployment

This is a static PWA intended for GitHub Pages. Keep `.github/workflows/pages.yml` unchanged and deploy from the `main` branch.

## Data

The app checks the latest 5etools release, loads the official 2024/revised player-relevant data it can identify, and caches that data locally. Character data is stored separately so rules-data updates do not overwrite characters.

## Current build

Version 0.37.0


## v0.37.0

This build includes the completed rules-conformance expansion for character math, origins, classes, feats, equipment, magic, resources, and UI/data integrity. Structured choices are reconciled across their grant sources, automatic and selected spells are kept separate from ordinary class limits, and the pinned data, deterministic rules, and Chromium suites protect the supported 2024 rules interactions.

## v0.28.0

This build completes the equipment/spell hydration pass, fixes Simple/Martial weapon proficiency normalization, makes legacy PHB references resolve against the current XPHB catalog, adds inventory filtering, supports three +1 background ability increases, removes redundant gaming-set placeholders, and applies the parchment character-sheet theme consistently across editor and management surfaces.

## Rules testing

The project now includes a rules-conformance suite under `tests/`. Run `npm run test:unit` for deterministic local tests. `npm run test:ci` additionally fetches the pinned 5etools corpus, validates the data contract, and produces rules/corpus coverage reports.

The 5etools test corpus version is pinned in `tests/fixtures/5etools-version.json`; update that pin deliberately when adopting a newer 5etools release.
