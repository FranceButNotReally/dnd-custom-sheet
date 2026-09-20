# D&D 2024 5etools Character Sheet PWA

Tablet-first D&D 2024 character builder and sheet backed by versioned 5etools data.

## Deployment

This is a static PWA intended for GitHub Pages. Keep `.github/workflows/pages.yml` unchanged and deploy from the `main` branch.

## Data

The app checks the latest 5etools release, loads the official 2024/revised player-relevant data it can identify, and caches that data locally. Character data is stored separately so rules-data updates do not overwrite characters.

## Current build

Version 0.21.0
