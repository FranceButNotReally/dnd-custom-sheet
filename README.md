# 5etools 2024 Character Sheet PWA

A tablet-first, offline-first D&D 2024 character sheet. Rules/reference data comes from a pinned 5etools release and is stored locally on the Android device in IndexedDB. Character state is stored separately.

## Deploy with GitHub Pages

Put the contents of this folder at the root of a GitHub repository, including `.github/workflows/pages.yml`.

In **Settings → Pages**, choose **GitHub Actions** as the source. The included workflow deploys the static PWA whenever `main` changes.

## Android tablet

Open the GitHub Pages URL in Chrome on the tablet. Use **Install** when the browser offers it, or Chrome's **Add to Home screen / Install app** command.

After the first successful data sync, the sheet is usable without the internet. The PC does not need to be running and the tablet can be on a completely different network.

## 5etools data

The app checks the latest public 5etools release through GitHub's Releases API. It discovers official 2024-era sources from `books.json` and 2024 entity markers, then downloads the player-facing data it needs directly from the corresponding version tag on GitHub. New official sources added to 5etools are therefore picked up automatically on the next data sync.

The **Update data** button always performs a fresh release check. Passive checks happen at most once every six hours. Cached rules data is versioned, and old versions are cleaned up after a successful update.

## Character storage

Characters are stored independently in IndexedDB. HP, spell-slot usage, conditions, inventory, resources, notes, and other play state therefore survive rules-data updates.

Characters can be exported/imported as JSON for backup or transfer between devices.

## Current scope

- All official 2024-era player-facing sources represented in 5etools, not only `XPHB`
- 2024 classes, subclasses, species, backgrounds, origin feats, spells, languages, and items
- Multiple characters stored on the tablet
- Builder for identity, class/subclass, species, background, ability scores, background ability choices, skills, expertise, origin feat, proficiencies/languages, and combat overrides
- Automatic proficiency bonus, saving throws, skill bonuses, HP, AC, speed, spell DC, spell attack, cantrips, prepared-spell capacity, and spell-slot progression
- Class/subclass feature references resolved from 5etools data
- Prepared spells, spellbook/added spells, spell reference modals, and filters
- 2024 official equipment picker and item reference data
- HP controls, spell slots, hit dice, death saves, conditions, resources, notes, short/long rest controls
- Offline service-worker shell plus IndexedDB rules/character storage

## Data source

`5etools-mirror-3/5etools-src` · official 2024-era source set discovered dynamically from 5etools metadata
