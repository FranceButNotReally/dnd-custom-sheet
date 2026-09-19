# D&D 2024 Character Sheet PWA

Tablet-first Progressive Web App using 5etools data cached locally on the device.

## Deployment

Deploy the repository with GitHub Pages using `.github/workflows/pages.yml`.

## Rules data

The app checks the latest `5etools-mirror-3/5etools-src` release, downloads the official 2024-relevant player data currently represented by the repository, and caches it locally. Character state is stored separately in IndexedDB.

## 0.6.0 highlights

- Fixed the startup crash in the source filter.
- Added rules-aware effects for several common 2024 features/feats.
- Added normalized skill proficiency handling.
- Added derived senses/resistances and transparent active-effect display.
