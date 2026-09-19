# 5etools 2024 Character Sheet PWA

A tablet-first, offline-capable D&D 2024 character sheet prototype which uses the 5etools JSON data as its rules/reference source. It does **not** bundle a copy of the data; it downloads a pinned 5etools release to the device and keeps that data in IndexedDB.

## What this prototype already does

- Android/PWA-friendly responsive layout.
- 2024 `XPHB` class, subclass, species, background, feat, and spell data.
- Detects the latest 5etools release through the GitHub Releases API.
- Downloads and caches the 5etools JSON needed by the sheet.
- Keeps character state separate from rules data.
- Works offline after the initial data sync.
- Uses the cached rules data when there is no network.
- Interactive HP/temp HP, spell-slot pips, death saves, conditions, notes, skills, prepared-spell selection, and inventory notes.
- Character JSON export/import.
- GitHub Pages deployment workflow included.

## Deploy on GitHub Pages

1. Create a new GitHub repository.
2. Copy all files from this folder into it.
3. Push to the `main` branch.
4. In GitHub, open **Settings → Pages** and use **GitHub Actions** as the source if GitHub asks for a Pages source.
5. Wait for the workflow to deploy.
6. Open the resulting HTTPS URL on the Android tablet in Chrome.
7. Use Chrome's **Add to Home screen / Install app** option.
8. Open the app once while online and press **Update data**.

## Update behavior

The app checks `https://api.github.com/repos/5etools-mirror-3/5etools-src/releases/latest` for the latest release tag. Data itself is downloaded from the corresponding immutable GitHub tag under `raw.githubusercontent.com`. The currently selected data version is shown in the **Data** tab.

The prototype uses only official `XPHB` 2024 player material for the selectable core data. It intentionally does not include homebrew.

## Notes about the first prototype

This is deliberately a foundation rather than a full D&D Beyond replacement. The data integration is the important part: the app reads the actual 5etools data structures, including the 2024 class progression and feature records. The next development pass should add more complete equipment/armor calculations, multiclassing, detailed background/feat choices, automatic feature-grant resolution, and richer spellbook management.
