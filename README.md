# D&D 2024 5etools Character Sheet PWA

Tablet-first D&D 2024 character builder and sheet backed by versioned 5etools data.

## Deployment

This is a static PWA intended for GitHub Pages. Keep `.github/workflows/pages.yml` unchanged and deploy from the `main` branch.

## Data

The app checks the latest 5etools release, loads the official 2024/revised player-relevant data it can identify, and caches that data locally. Character data is stored separately so rules-data updates do not overwrite characters.

## Current build

Version 0.37.0


## v0.37.0

This build adds a rules-audit pass for structured character-creation choices and derived effects. Gnomish Cunning-style saving-throw advantages are now represented automatically, species lineage/ancestry choices are surfaced during creation, feat choices are no longer silently defaulted, and Notes dialogs use the same formatted-rules/linked-keyword treatment as other rules text. Equipment code remains on the v0.36 known-good implementation. Spell selection remains a separate follow-up.

## v0.28.0

This build completes the equipment/spell hydration pass, fixes Simple/Martial weapon proficiency normalization, makes legacy PHB references resolve against the current XPHB catalog, adds inventory filtering, supports three +1 background ability increases, removes redundant gaming-set placeholders, and applies the parchment character-sheet theme consistently across editor and management surfaces.
