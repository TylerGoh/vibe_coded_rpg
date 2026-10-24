# The Aurora Heights (room 40, `HEIGHTS`): Lv 75–90, the Pale Wyrm

Frostpeak's depth pass, phase F3 (`story/world/island-depth.md`): the high snowfield above the Rimeglass
Glacier's Icefall, where the aurora hangs low enough to touch and the wrong stars are closest. The way in is
the top of the Icefall in the Glacier (`HEIGHTS_GATE_X`), drawn open by `src/branch-gates.js`
(`OPEN.icefall`: new steps cut zig-zagging up, a new rope on pegs, a red flag at the top). You arrive at the
WEST end (`HEIGHTS_EXIT_X`) and go east, higher and harder. Shipped with the Blue Halls
(`docs/places/bluehalls.md`).

- Data: `HEIGHTS_ZONES`, `HEIGHTS_PLATFORMS` and the spawns in `src/shared/rpg.js`; the room and its door in
  `src/shared/sim.js`. Art: `src/heights.js` (the room), `src/heights-art.js` (mobs, gear, icons); the staves
  are rows in `src/staff-art.js`.
- High, still and cold: a night-blue sky with big close stars, some smeared and some clumped (the wrong
  stars), a sea of cloud far below with peak tops in it, diamond dust in the air, and the aurora's curtains
  hanging in the room itself with their hems right down at the snow (`drawCurtains`, drawn over the
  snowfield on purpose: you walk through the light). The aurora brightens toward the Wyrmfall.
- West to east: **the Last Step** (no mobs: the top of the steps, a waystone, the Serpent Stone, a cutters'
  windbreak of snow blocks with a bench and a stove), **the Low Lights** (wind-carved cornices), **the
  Starfield** and **the Wyrmfall**: a long hollow melted into the snow and frozen to glass, shards of
  starglass standing up round it (`starglass` platforms), ending at the crater's rim, the biggest shard of all
  leaning over a snowbank (`drawEdge`).
- **Liv's Reach**, the hidden spot (last in `HEIGHTS_PLATFORMS`, on an ice spire over the Low Lights): a
  cutters' marker pole with a small red mitten frozen to it, and LIV scratched in the ice with a row of little
  stars. Eyvind's daughter climbed up there before she sailed south; his persona only hints where.
- **The Serpent Stone** (`RUIN_STONES`, shape `serpent`, `src/ruins.js`): a Keeper stone at the top of the
  steps, a serpent of joined stars across the top, a row of boats all following it, two islands close
  together ("STEER BY THE SERPENT"). One small star near its tail is cut deeper (the Pale Wyrm, unnamed), and
  a newer little star lies on its side low down. Canon Tier 2 by showing only: never Pangelea, the Wheel or
  the Stopped Hour.
- No character up here (like Keeper's Spine): Eyvind, Skaldi, Runa and Tove talk about it.

## Mobs (on the frozen curve)
- ptarmigan (passive, hops) · snow fox = `blink` (dives into the snow, comes up behind you; drawn as a
  mound with a tail tip while gone) · rime eagle = `dive` (`fly` 62, under the 70 px notice limit) · aurora
  jelly = `phase` (`fly` 44) · musk ox = `shell` (a boss of horn in front) · lost star = `lob`, `style: 'star'`
  (`src/hazards.js`), little stars that fell with the Wyrm.
- No elites (not a hard pocket).

## The Pale Wyrm (field boss, Lv 90)
Something of the Astral Wyrm's kind that fell with it (`story/characters/bosses.md`): a long serpent of
frosted starglass with a dim star in every coil and a mane of faint aurora wisps, lying drowsy in the
Wyrmfall. It could go back up; it would rather stay fallen. Passive until hit, then `dive` (`fly` 80): it lifts
off the snow and falls on you, again and again. Its eyes are shut unless it's striking. Drops the Pale Star
Blade / Pale Star Staff, the Aurora Crown and Pale Wyrm Scales. A field boss has no `lines`, so its story is
told by the stone, the personas and Skaldi's one-line song. Its pet is in the Pet Shop (`PETS`).
S5.4: with two or more fighting it, a `curse` (the cold of falling: a pale sigil with dim stars sinking into it,
`looks.curse: 'pale'`) and a `weakpoint`, the last bright star in its coils (`weak`, mid-back, in the air like the
Hornet Queen's: arrows or a jump; `looks.weak: 'star'`): `docs/combat/bosses.md`.

## Gear (`docs/combat/items.md`)
Mob drops: the Foxfire Blade / Foxfire Staff (snow foxes), the Musk Ox Helm (musk oxen). The Pale Wyrm: above.
All on the frozen gear curve at their `lvl`; materials from every mob.

## Waystone
One at the Last Step (`isle: 'frost'`), reaching the hamlet's, the Glacier's and the Skerries'
(`docs/places/waystones.md`).

## Decisions and history
- 2026-10-23: built as F3. Liberal decisions (owner's standing instruction): the names (the Last Step, the
  Low Lights, the Starfield, the Wyrmfall, the Serpent Stone, Liv's Reach, the Pale Wyrm) are new; no trader
  (the plan named none). The island map puts the Heights at the top edge, so the "you are here" label goes
  beside the pin there (`drawIslandMap` in `src/worldmap.js`).
- Music scene `heights` (`docs/ui/audio.md`).
