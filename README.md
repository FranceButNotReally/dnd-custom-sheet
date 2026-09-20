## v0.30.0

The 5etools data layer now uses staged caching with a visible progress bar. Core catalogs, class files, and official spell sources are downloaded/cached in small groups rather than all at once. Normal character views are enabled only after the local rules library is complete, and interrupted caches can be resumed or repaired from Data → Complete / repair rules cache.



- Reworked rules-data loading into staged batches with a visible progress overlay.
- Initial synchronization now completes the 2024 player-facing cache before normal sheet views are enabled.
- Interrupted/incomplete caches are detected and resumed rather than leaving individual features dependent on whichever files happened to finish downloading.
- The extended cache action now means “Complete / repair rules cache” and uses the same batching/progress system.

# D&D 2024 5etools Character Sheet PWA

Tablet-first D&D 2024 character builder and sheet backed by versioned 5etools data.

## Deployment

This is a static PWA intended for GitHub Pages. Keep `.github/workflows/pages.yml` unchanged and deploy from the `main` branch.

## Data

The app checks the latest 5etools release, loads the official 2024/revised player-relevant data it can identify, and caches that data locally. Character data is stored separately so rules-data updates do not overwrite characters.

## Current build

Version 0.25.0


## v0.29.0

This build completes the equipment/spell hydration pass, fixes Simple/Martial weapon proficiency normalization, makes legacy PHB references resolve against the current XPHB catalog, adds inventory filtering, supports three +1 background ability increases, removes redundant gaming-set placeholders, and applies the parchment character-sheet theme consistently across editor and management surfaces.
