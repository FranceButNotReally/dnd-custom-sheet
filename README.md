# D&D 2024 5etools Character Sheet PWA

Tablet-first D&D 2024 character builder and sheet backed by versioned 5etools data.

## Deployment

This is a static PWA intended for GitHub Pages. Keep `.github/workflows/pages.yml` unchanged and deploy from the `main` branch.

## Data

The app checks the latest 5etools release, then synchronizes the complete detected 2024 player-facing rules library in staged batches. Core catalogs, both item catalog files (`items.json` and `items-base.json`), class files, and spell-source files are cached locally in IndexedDB. The character data is stored separately so rules-data updates do not overwrite characters.

The synchronization path validates the equipment catalogue and can repair a stale/incomplete item cache before the library is marked ready.

## Current build

Version 0.34.0

## v0.34.0

- Restored the known-good v0.28 item-catalog/index path while retaining the staged full-library cache architecture.
- Added a validated, single-flight data fetch layer so incomplete cached files are rejected and concurrent requests for the same file share one download.
- Added explicit equipment-catalog/index integrity checks before the library can be marked ready.
- Added a raw-catalog fallback for exact XPHB item resolution, preserving starting-equipment references such as `dagger|xphb` and `quarterstaff|xphb`.
- Added forgiving equipment search for common plurals and small touch-keyboard typos such as `daggers` and `quarterstuff`.
- Added a dedicated equipment-data smoke test for catalog resolution, starting-equipment refs, fuzzy search, cache repair, and single-flight downloads.

## Earlier releases

See `CHANGELOG.md` for the full development history.
