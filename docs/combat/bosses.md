# Boss dens, bosses and ultimates

Data: `DENS`, `MOBS` (entries with `boss: true`), `PHASE_AT`, `COMBO_CHANCE`, `COMBO_MAX`, `ULT_FIRST`,
`ULT_EVERY`, `ULT_WARN`, `BOSS_HP_PER_PLAYER`, `BOSS_RESPAWN_MS` in `src/shared/rpg.js`. Brain:
`bossBrain()` in `server/rpg.js`. Client: `bossEvent` / `step` in `src/rpg.js`. Art: `src/dens.js` (dens,
the first five bosses, boss bar, `drawUltBanner`), `src/dens-caldera.js` and `src/dens-citadel.js`
(`DEN_ART` / `ENTRANCE_ART` / `BOSS_ART` / `FX2` hooked into dens.js).

Small bosses that roam the open stages (field bosses, like Turnipop) aren't den bosses: `docs/combat/stages.md`.

## The nine dens (each a room behind a cave mouth in its stage)
Wildwood: Sprout King, Mother Mushroom, Bramble Behemoth · Highlands: Frost Queen Glacia, Astral Wyrm ·
Caldera: Ignis the Magma Tyrant, Pyra the Ember Phoenix · Citadel: The Clockwork Colossus, Chronos.

Tenth den: **The Tidemother's Hoard** (room 26, Saltspray Coves, art `src/dens-coves.js`). Eleventh:
**The Knotted Burrow** (room 30, the Mycelium Deep, art `src/dens-deep.js`; `docs/places/deep.md`). Big
bosses can have `lines` (enter / phase / freed) that they say in a bubble and the chat: only those two
have them so far. A new den's art lives in its own file with `DEN_ART` / `ENTRANCE_ART` / `BOSS_ART`
(merged in `dens.js`), plus its theme's row in the shared effect tables (`FXPAL`, `THEME_RGB`, the theme
branches of `drawBit` and `drawFallObj`).

## How a fight works
- Three stages by HP (`PHASE_AT`), each with its own move list (`MOBS[boss].phases`) and longer combos.
  Stage 3 is enraged (music intensifies via `audio.setIntensity`).
- Basic moves: slam (anyone on the floor within range when it lands: jump or use a ledge), leap, charge,
  rain, barrage, summon. The later bosses add their own (geysers, feathers, beams, clock bombs, void
  sweeps…), all sent through the hazards pipeline (`docs/combat/stages.md`).
- Boss HP grows per extra slime in the den (`BOSS_HP_PER_PLAYER`), aimed at a few minutes per fight.
  Everyone leaving for a few seconds resets it; a kill respawns after `BOSS_RESPAWN_MS` (`b` in `mobs`
  is the countdown). Bosses drop their unique gear, scrolls, gold and potions. Events: `{t:'boss', a: …}`.

## The damage meter (owner, 2026-10-21)
- Every den boss and field boss counts the damage each slime has done to it (`dmg` on the mob in
  `server/rpg.js`, by name; overkill doesn't count) and sends it to the room as `{t:'bossdmg'}` while it
  changes. The client draws it on the right, under the boss bar (`drawMeter` in `src/rpg.js`): the top
  five with their share, and you always.
- **It starts over whenever the boss's HP does**: a respawn after a kill, a den boss healing when
  everyone left, a field boss healing when left alone. HP growing for more fighters
  (`BOSS_HP_PER_PLAYER`) and Pyra's Rebirth heal aren't resets. After a kill the den keeps showing the
  final standings until the boss is back.

## Ultimates: one-hit KOs, on purpose (the owner wanted real stakes)
First below `ULT_FIRST`, then every `ULT_EVERY` s, after a `ULT_WARN` warning banner with the safe spots
drawn. The **client** decides whether you were safe and sends an `ult` ouch; the server KOs unless Aegis,
Bubble, Sanctuary or Second Wind save you.
- stomp: be off the floor · spores: stand in a safe circle · wave: jump the rolling wave · lanes: stand in
  the safe lane · nova: be `NOVA_SAFE` px away
- magma (Ignis): stand on the one ledge that holds · rebirth (Pyra): break her egg in time or everyone is
  KO'd and she heals · overclock (Colossus): three lethal zaps, safe columns far apart, needs Dash + Blink
  · timestop (Chronos): don't move · collapse (Chronos): void walls from both ends, Dash/Blink through one
- Dash/Blink i-frames don't save you from ultimates marked noDodge (all but collapse and wave).

## Status
Only bots have fought these; numbers are untested with people (`docs/ideas.md`).
