# Changelog

## Unreleased — rules conformance expansion
- Completed PHB weapon-attack and Weapon Mastery coverage: all 40 weapons now produce exact attack/damage profiles and all eight mastery properties produce deterministic trigger/outcome data, including live Cleave damage, Graze damage, and Topple save DC values rendered in weapon Notes.
- Completed the deterministic Character Math pass for maximum HP, AC, Speed and movement modes, Initiative, special senses, and damage resistances with corpus-backed golden characters and rendered Chromium assertions.
- Added Dread Ambusher's Wisdom-based Initiative, permanent Climb/Swim modes from Athlete, Gift of the Depths, Aquatic Affinity, and Second-Story Work, structured object-form senses, and permanent Psi Warrior, Ancients, Celestial, and Draconic resistance effects.
- Corrected the 2024 Dual Wielder feat by removing the obsolete 2014 +1 AC behavior, and prevented resistance-ignoring attacks or unselected resistance choices from becoming character resistances.
- Made Paladin aura bonuses and Aura of Warding resistances deactivate while the character is Incapacitated.
- Completed structured PHB feat choices in the builder, including Crafter and Musician tool selections, Skilled's three distinct skill/tool selections, proficiency-aware Expertise, duplicate prevention, and Resilient's linked ability/save choice.
- Added an explicit model for all fifteen PHB conditions, applying Speed 0, attack/check/save/Initiative states, inherited Incapacitated/Prone effects, Concentration loss, Petrified resistance/immunity, Exhaustion, and persistent UI state.
- Added reconciled subclass and optional-feature choices for Circle of the Land terrain spells and resistance, all three Wild Heart option groups, Fiendish Resilience, Iron Mind's fallback save, College of Lore Magical Discoveries, every Wizard Savant spell progression, invocation cantrip targets, Pact of the Tome's three cantrips plus two rituals, and distinct Origin feats from repeatable Lessons of the First Ones.
- Added feature-granted prepared, cantrip, and spellbook collections without consuming ordinary preparation limits, including fixed invocation spells and selected off-list spells in the spell UI.
- Corrected Darkvision-extending subclass features to add 60 feet to an existing range and surfaced Wild Heart Climb/Swim speeds on the sheet.
- Added an exhaustive PHB class/subclass corpus gate spanning 12 classes, 48 subclasses, 283 class-feature records, 309 subclass-feature records, and all 58 optional features.
- Added subclass-owned progression support, restoring Battle Master maneuver slots and the Champion's extra Fighting Style to the builder.
- Enforced Eldritch Invocation level, dependency, category, repeatability, and duplicate rules in reconciliation and in the live option lists.
- Added subclass skill/tool choices for College of Lore, Battle Master, and Fey Wanderer, plus persistent subclass AC, HP, Initiative, Speed, sense, proficiency, save, and resistance effects.
- Stopped conditional class and optional-feature text, such as Rage resistance and Extended Spell, from being applied as permanent sheet effects.
- Added a real Chromium integration layer for builder choices, IndexedDB persistence and migration, rest/death controls, touch interactions, and complete offline service-worker reloads.
- Added Playwright to the existing single GitHub Actions rules job so UI/data-integrity checks run with the pure rules and pinned-corpus suites without creating extra workflow fan-out.
- Fixed dynamically rendered spell checkboxes so cantrip, spellbook, and prepared-spell selections now invoke their persistence handler.
- Added deterministic resource-state transitions and a pinned-corpus matrix spanning every PHB class and its subclass resource features.
- Preserved spent uses—not stale remaining uses—when a scaling class resource increases or decreases its maximum.
- Added functional Short Rest Hit Dice spending with Constitution healing, availability limits, and maximum-HP clamping.
- Added complete Long Rest transitions for HP, temporary HP, Hit Dice, spell slots, Exhaustion, Concentration, death saves, and rest-recharging resources, including the 1-HP eligibility rule.
- Added explicit Healthy, Dying, Stable, and Dead states with damage-at-zero failures, critical-hit failures, massive-damage death, temporary-HP protection, and healing recovery.
- Replaced impractical hundred-pip displays for large resource pools with compact numeric adjustment controls while retaining pips for small pools.
- Added a pinned-corpus equipment matrix covering all 40 PHB table weapons, nine weapon properties, eight mastery properties, twelve armor suits, Shield, and every PHB artisan tool and instrument.
- Corrected ranged-weapon detection to use the 5etools item type instead of misreading the `R` (Reach) property, and normalized Lance's object-form conditional Two-Handed property.
- Added damage types, Versatile damage, Heavy ability requirements, magic weapon damage bonuses, and current Disadvantage warnings to generated attack rows.
- Corrected armor behavior so untrained armor still supplies its AC while surfacing Strength/Dexterity D20 Test and spellcasting penalties; added Stealth Disadvantage and multiple-armor warnings.
- Fixed heavy-armor Strength speed penalties against the pinned `strength` field and added inventory weight plus Strength-based carrying capacity.
- Added three-item attunement tracking and gated attunement-required magic weapon/armor enhancements until the item is attuned.
- Repaired 2024 spell selection by loading the pinned 5etools spell-source lookup instead of treating missing per-spell class metadata as universal access.
- Restricted cantrip, prepared-spell, and Wizard spellbook choices by class/subclass list and current spell level, with invalid saved choices reconciled safely.
- Added Eldritch Knight and Arcane Trickster spellcasting ability, cantrip, prepared-spell, and slot progressions.
- Added automatic class/subclass spells that do not count against prepared limits, including fixed bonus cantrips.
- Added complete PHB feat spell pickers for Magic Initiate, Blessed Warrior, Druidic Warrior, Fey-Touched, Shadow-Touched, Ritual Caster, Telekinetic, and Telepathic.
- Migrated legacy 2024 "known spell" selections into the unified prepared-spell model and added an 18-test pinned-corpus spell-selection matrix.
- Added all twelve level-19 Epic Boon feat slots and enforced feat level, ability, armor-training, spellcasting, and repeatability prerequisites in selectors.
- Added persistent PHB feat effects for armor/weapon training, Speedy, Boon of Speed, Boon of Fortitude, Durable, War Caster, Medium Armor Master, and Weapon Master.
- Added distinct damage-type and resistance choices for Elemental Adept and Boon of Energy Resistance, including repeatable-feat duplicate protection.
- Added separate automatic resources for Lucky, Chef, Mage Slayer, Ritual Caster, Magic Initiate, Fey-Touched, Shadow-Touched, Telepathic, Boon of Fate, and Boon of Recovery.
- Added a corpus-backed audit covering all 77 PHB feats while leaving target/trigger-dependent combat rules as linked references.
- Repaired the ASI data contract so both explicit `+2` and `+1/+1` patterns are verified without introducing a hidden default.

## v0.37.0
- Added structured species lineage/ancestry choice detection and character-creation selectors.
- Added structured feat choice selectors for mixed skill/tool/language choices, expertise, saving throws, ability choices, and Magic Initiate-style spell-list/ability choices.
- Non-fixed feat choices no longer silently select the first option; they remain explicitly unselected until the player chooses.
- Added derived saving-throw advantage handling for rules text such as Gnomish Cunning.
- Added `ADV` indicators to affected saving throws without incorrectly treating Advantage as proficiency.
- Refined weapon/cantrip Notes dialogs to use the same parchment rules-text presentation as other reference content and link recognized rules keywords such as Bonus Action, Disadvantage, and Prone.
- Added regression smoke tests for Gnomish Cunning, lineage choices, feat choices, and Notes keyword linking.
- Equipment data/indexing functions remain unchanged from v0.36.
- Spell selection remains deferred to the separate spell pass.


## v0.28.0
- Added explicit 2024 PHB Standard Array by Class assignments for the Standard Array button.
- Added Common plus two selectable non-rare Standard Languages to character creation.
- Added class/background proficiency-overlap indicators, with overlapping background skills marked in class-skill choices.
- Removed the redundant Rest & Recovery panel; rest controls remain in Resources.
- Added an optional extended-cache action for all indexed class and spell-source files.
- Added click-to-open notes for weapon/cantrip attack details.
- Added long-press rules lookup for touch-device condition chips while preserving tap-to-toggle.
- Added an in-app explanation of Equipped versus Wielding.

# v0.27.0 — equipment, spells, filters, and editor polish

- Fixed equipment hydration and weapon equip/wield resolution.
- Added robust Simple/Martial weapon proficiency token handling for Weapon Mastery.
- Weapon Mastery now derives from the complete official 2024 weapon catalog and no longer drops standard weapons because `rarity` is `"none"`.
- Added legacy PHB → XPHB spell reference fallback.
- Spell browser/filter now forces the current XPHB catalog into the merged cache before filtering.
- Equipment page now has inventory search/category/equipped filters.
- Removed redundant gaming-set placeholders once a concrete gaming set is selected.
- Removed duplicate special-sense text so Darkvision 120 ft. is shown once.
- Background ability choices support the 2024 +1/+1/+1 mode.
- Management/editor controls use the parchment character-sheet visual system with readable light inputs and modal surfaces.
- Service-worker cache bumped so the new shell is actually delivered.

## v0.25.0

- Fixed structured starting-equipment resolution by loading 2024 item data before applying equipment choices.
- Fixed Equipment rendering so weapon/item references and Equip/Wield controls resolve against cached item data.
- Expanded special-sense discovery/caching for Darkvision, Blindsight, Tremorsense, and Truesight, including prose and direct `senses` structures.
- Normalized gaming-set labels such as `Dragonchess Set` to `Dragonchess` and suppresses redundant `Choose a Gaming Set` entries when a concrete choice is present.
- Kept conditions hover-only on the sheet.
- Tightened HP action sizing for narrow layouts.
- Long Rest now restores all spent Hit Dice per the 2024 rules.
- Refined the character-sheet visual styling and interaction surfaces.


## v0.24.0
- Fixed overlapping Hit Point controls with responsive grid layout.
- Removed redundant condition info controls; conditions retain hover behavior.
- Added persistent special-sense cache fallbacks and character-sheet sense display.
- Made automatic limited-use resources visible on the character sheet; Rage is derived from class-table uses when necessary.
- Improved starting-equipment resolution and weapon visibility/equip state.
- Spell links now use the shared reference/hover system without nested interactive controls; spell view forces XPHB hydration on entry.
- Tool-choice labels display concise names such as Dragonchess while retaining canonical 5etools item references.
- Weapon Mastery uses the base XPHB weapon set only, deduplicated and presented as a compact selector.
- Applied the character-sheet visual language consistently across the app surfaces.
## 0.22.0

- Fixed 2024 optional-feature progression handling for class data that uses `optionalfeatureProgression` and `featureType`, notably Warlock Eldritch Invocations.
- Fixed class-table Pact Magic slot resolution and kept prepared-spell classes from being incorrectly capped by a known-spells progression.
- Added conservative automatic resource detection for feature text when 5etools has no structured `uses` object, including limited-use features such as Action Surge and Indomitable.
- Automatic class-table resources and text-derived feature resources now carry an explicit `auto` mode and feature origin.
- Automatic resources can no longer be deleted as though they were manual resources.
- Removed dynamic expression evaluation from resource maxima.
- Fixed Fast Movement so its +10-foot bonus is suppressed while wearing Heavy Armor, including when AC is manually overridden.
- Armor Strength speed penalties are now checked against equipped armor rather than only trained armor.

## 0.21.0

- Initial character render no longer waits for the complete class and spell datasets.
- Class files are loaded on demand; spell files are loaded by source/reference and the full spell index is only hydrated when the spell browser is opened.
- Added reference caching for rules entities and removed the `spellById()` / `canonicalLabel()` recursion path.
- Added robust targeted spell resolution for tooltips and selected spells.
- HP controls now support direct setting plus damage/healing, with Temporary HP absorbed before normal HP.
- Death saves are only editable at 0 HP and reset when HP becomes positive; Short Rest no longer resets them.
- Added explicit Senses display, including species Darkvision/special senses and manual additional senses.
- Added automatic/manual resource state with automatic resources linked to their originating feature when structured `uses` data is available.
- Preserved Weapon Mastery reconciliation against proficiency and current mastery limit.
- Discarded the legacy max-HP=1 migration artifact when upgrading older character data.


## 0.14.0

- Expanded player-data synchronization beyond XPHB by discovering qualifying official 2024/revised sources.
- Added structured derived effects for Unarmored Defense, Tough, Alert, Defense/Archery/Dueling/Thrown Weapon Fighting, Dwarven Toughness/Resilience, Dual Wielder, and movement features.
- Fixed stale legacy AC and max-HP overrides.
- Added automatic/manual max HP state and recovery controls.
- Added ability score values alongside modifiers.
- Added passive Perception and linked proficiencies/languages.
- Added hover/tap reference links for conditions, rules keywords, equipment, features, traits, feats, and weapon masteries.
- Improved 5etools inline-tag rendering, including Concentration/variantrule links, paragraphs, lists, tables, and insets.
- Improved capitalization of 5etools identifiers for display.
- Added starting-equipment option handling for multiple groups, background equipment, currency conversion, and linked equipment entries.
- Added partial Weapon Mastery tracking and rule displays.
- Added subclass gating below level 3 and pruned invalid post-level-up choices.
- Fixed feat weighted-choice key collisions.
- Added item-backed tool and language selectors.
- Added exhaustion penalties to d20 tests and speed.
- Bumped PWA shell cache to v14.
