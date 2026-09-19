## 0.5.2

- Expanded player-data loading beyond `XPHB` to all official 2024-era sources discoverable from 5etools metadata/entity markers; future qualifying sources are included automatically after sync.
- Corrected 2024 background ability parsing for weighted +2/+1 choices and auto-populated the first legal choices when a background is selected.
- Added explicit skill expertise tracking and improved background tool/language display.
- Added manual armor proficiency tracking alongside weapon/tool/language proficiencies.
- Improved formatted rules rendering for lists/options/read-aloud entries and ensured item reference dialogs use the structured renderer.
- Updated the app shell/cache version.

# Changelog

## 0.3.0

- Added Heroic Inspiration, concentration, and exhaustion tracking.
- Corrected Long Rest Hit Dice recovery to half of expended Hit Dice, rounded up.
- Long Rest now reduces exhaustion by one and clears concentration.
- Recovering from 0 HP resets death saves.
- Equipped inventory items now feed the automatic armor/shield AC calculation.
- Improved 2024 background-origin-feat filtering.
- Added character-schema migration for the new table-state fields.
- Bumped the service-worker shell cache version.
