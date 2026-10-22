# The Narwhal Grotto (room 39, `GROTTO`): Lv 70–80, a hard pocket

Frostpeak's depth pass, phase F2, shipped with the Whale Skerries (`docs/places/skerries.md`): a sea cave of
green ice in the cliff at the Skerries' far west end (`GROTTO_GATE_X`; its mouth drawn open by
`src/branch-gates.js`, `OPEN.grotto`, red-trimmed sign). You come in at the WEST end (`GROTTO_EXIT_X`) out of
grey daylight and go east into the cliff.

- Data: `GROTTO_ZONES`, `GROTTO_PLATFORMS` and the spawns in `src/shared/rpg.js`; `STAGES[GROTTO]` has
  `hard: true` (danger look on its doors, red level chips). Art: `src/grotto.js` (the room) and
  `src/skerries-art.js` (its mobs).
- West to east: **the Grotto Mouth** (no mobs), **the Green Halls** (lanternfish, ice eels, a Great Ice Eel)
  and **the Tusk Hall**, where the Old Narwhal's pod shed their tusks for longer than anyone knows and the
  ice kept them: rows of spiral tusks frozen into the back wall, all pointing out to sea (brine slugs, ice
  skates, an Elder Skate).
- **The hidden spot** (last in `GROTTO_PLATFORMS`): a nook up among the tusks with one very small tusk, a
  calf's, set apart in a ring of pebbles. Nothing says whose. Hakon has been in once and came out quickly.
- No waystone (hard pockets have none), no character, no field boss: the den next door is the big fight.

## Mobs (on the frozen curve; elites only here)
- lanternfish = `phase` (`fly` 50; its light goes out) · ice eel = `beam`, `style: 'jet'` (jump it) · brine
  slug = `trail`, `style: 'brine'` (a slick of freezing brine with salt crystals, `src/hazards.js`) · ice
  skate = `blink` (slips under the ice, comes up behind you).
- Elites (`elite()`): `ice_eel_elite` (Great Ice Eel), `skate_elite` (Elder Skate).
- Gear: the Angler's Lamp (lanternfish), the Skate Wing Blade / Skate Staff (ice skates).

## Decisions and history
- 2026-10-23: built in F2. The plan's "elites" kept as the whole of it: no field boss, since the Old
  Narwhal's den sits by the mouth. Music `grotto` (`docs/ui/audio.md`).
