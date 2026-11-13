# The Aether Citadel's depth pass: room 13, its gates, the Siege Engine and the Commissary

The Citadel's depth pass (`story/citadel-plan.md`, phases C0–C6) gives the old stage 4 (room 13, `CITADEL`: Cogwork
Bastion west, the Chrono Spire east; `docs/combat/stages.md`) the branches, bosses and island map every other island got.
**C0 (2026-11-13)** is the groundwork: the island map, two waystones, every branch's gate, a field boss and a trader in the
Bastion, and the Keepers' Gardens (`docs/places/gardens.md`). Tone (owner's and the region's): solemn, no whimsy, no
living people; machines still doing their last jobs.

Files: the spots in `src/shared/rpg.js` (`CIT_WAY_X`, `COMMISSARY_X`, `GARDENS_GATE_X`, `ARCHIVE_GATE_X`, `KEEL_GATE_X`,
`SPIRE_WAY_X`, `ORRERY_GATE_X`, `ENGINE_GATE_X`, `BELLS_GATE_X`; the Spire's zone label is `156–170`), the island map
`CITADEL_MAP` in `src/shared/branches.js`, the gate art in `src/citadel-gates.js` (merged into `src/branch-gates.js`), the
Siege Engine, the gear and the Commissary's look in `src/bastion-art.js`, room 13's scenery in `src/citadel.js` (its
random props keep clear of the new spots: `FEATURE_XS`).

## Room 13 stays one room
Owner's default (plan decision 3): the den doors (the Grand Foundry at 2280, the Hour Sanctum at 4620), saved positions and
waystones keep working; the branches open off it through gates. West to east:
- **The Bastion's waystone** (`CIT_WAY_X`, `isle: 'citadel'`), then **the Commissary** at its counter (`COMMISSARY_X`).
- **The brass stair** up to the Keepers' Gardens (`GARDENS_GATE_X`, open since C0: an `entry`, kind `gardenstair`; its door
  is in `ROOMS[CITADEL]`).
- **The Archive's stair** (`ARCHIVE_GATE_X`, `shutter`): an iron shutter was down over it with a sentinel's red stamp; **C2
  raised it**: now an `entry`, drawn rolled up with pages drifting up out of the stair, its door in `ROOMS[CITADEL]`
  (`docs/places/archive.md`).
- **The Siege Engine's stretch of wall** (its spawn strip), then **the Grand Foundry's maintenance hatch** (`KEEL_GATE_X`,
  gate `hatch`): clamped under a jammed gear that rocks a tooth once a beat, late. C5 frees it (the Keel, a hard pocket).
- In the Spire: **its waystone** (`SPIRE_WAY_X`), **the Orrery's door** (`ORRERY_GATE_X`, `combolock`: a round brass door
  whose three lock rings turned by themselves and never lined up; **C1 stopped them**: now an `entry`, drawn lined up and
  open, its door in `ROOMS[CITADEL]`: `docs/places/orrery.md`), **the Last Echo** (`ECHO_X`, AI, a Keeper's echo:
  `docs/places/orrery.md`), **the Engine Halls' blast door** (`ENGINE_GATE_X`,
  `blastdoor`: steam jetted from its seams, a turbine glowing through its porthole; **C3 opened it**: now an `entry`, drawn
  open on a turbine turning, its door in `ROOMS[CITADEL]`: `docs/places/engine.md`) and **the stair above the
  Hour Sanctum** (`BELLS_GATE_X`, gate `frozenrain`: rain hanging on the steps, every drop stopped; C4, the Bell Walks).
- The Keel's far end (the way down to the Undercroft, C6) is in a room that doesn't exist yet: the `undercroft` node is
  `past`. Each gate's draw function takes an `open` flag (the F3 pattern), so shipping a branch is data plus its rooms.
- **Changed from the plan:** the Engine Halls' blast door is in the Spire, not in the Orrery (the plan's map hung the Engine
  Halls off the Orrery, but its own C0 list lays every gate in room 13; one way in from the Spire is simpler to find).

## The island map
`CITADEL_MAP` (`ISLAND_MAPS.citadel`, `docs/ui/world-map.md`): the Skydocks Camp (town), the Skydocks, the Bastion and the
Spire (room 13's zones, `zr: CITADEL`), the Keepers' Gardens (open), the Orrery (open since C1), the Archive (open since C2),
the Engine Halls (open since C3), and dashed with their block: the Keel (hatch jammed, hard), the Undercroft (below the Keel,
hard), the Helm (its bulkhead sealed, off the Engine Halls: C4), the Bell Walks (frozen rain). Bands on the dashed nodes follow the plan, stretched past 200 at the owner's
note (2026-11-12): the Keel 188–200, the Bell Walks 195–208, the Undercroft 205–215; the plan's revision says the rest.

## The Siege Engine (field boss, Lv 154)
A wall engine on six iron wheels, a ballista on a turntable on top, a rack of bolts along its side, a sighting hood with
one lens: still defending the Bastion against an attack that never came. Small boss, no story (a `desc`). Passive until hit;
then `lob` (style `bolt`, a new `SHOT` in `src/hazards.js`): it winds the arms back (the lens goes red) and looses an iron
bolt where you stand. T3's (`docs/combat/challenges.md`): `feint` (an empty wind-up now and then, the real bolt after) and
from its second third `rings` of bolts with a gap (`looks.rings: 'bolt'`). S5.4: with two or more on it, `armour` (the
Colossus's bronze plates, `looks.shell: 'brass'`) and `focus`. Drops the Siege Ram (twins: the Siege Staff, the Siege Bow)
and the Siege Helm, Lv 156, `BOSS_GEAR.field`; Siege Bolts and cogs. Its pet, the mini Siege Engine, is between the
Colossus's and the Bog Bloat's (`PETS`; `PETSHOP_W` up to fit it).

## The Commissary (AI, `commissary`; trades)
A tall brass vending automaton behind a counter in the Bastion's wall (`accessory: 'issuer'`: a coin slot, an issue hatch,
a stamp on a spring arm, a green lamp on its top, a paper tape curling to the floor). It takes every slime for a guard
reporting for duty, gives each a guard number the first time (its ordinary per-player memory), and speaks in capitals like
the Dockwarden. It sells the potions and the guards' standard issue (`SHOPS.commissary`, aim Lv 150): the Bastion Guard's
Saber, Staff, Bow and Helm. It knows the Bastion, the stair to the gardens, the Siege Engine ("AN ATTACK IS EXPECTED"), and
notes the shut ways as stores matters; it knows nothing of Keepers, wheels or the hour ("NOT ON THE ISSUE LIST"). No `lore`
cap: like the Dockwarden it has no canon to give. Plan decision 6 (traders are automata still on duty) stands.

## Decisions and history
- 2026-11-13: C3 built (the Engine Halls, the Stormcoil, Number Nine: `docs/places/engine.md`); the Last Echo knows the blast
  door opened and asks after Nine; the Helm's gate (`bulkhead`) is laid in the Engine Halls.
- 2026-11-13: C2 built (the Archive, the Indexer, Folio: `docs/places/archive.md`); the Commissary says the shutter went up
  and knows of Folio.
- 2026-11-13: C1 built (the Orrery, Meridian, the Last Echo: `docs/places/orrery.md`); the Commissary heard the lock stop and logs
  the Echo as "UNISSUED".
- 2026-11-13: C0 built at the owner's "continue with next phase", every open decision in the plan at its default (the
  owner's standing "make liberal decisions"), the band stretched past 200 per the owner's 2026-11-12 note.
  **Not played by anyone yet**; checked by a build, the economy sheet, a start-up of a throwaway server and reading the
  code (owner's rule: no headless bot tests).
- The Dockwarden's persona now mentions the Commissary. No other persona lists the Citadel's shut ways yet; when a branch
  ships, add it to the Commissary's (it names the Foundry's hatch; since C1 it notes the star-hall's lock has stopped, since C2 that the Archive's shutter went up). The Last
  Echo (C1) remembers the Spire's other two shut ways as they were in the Stopped Hour: keep it in step when they open (since C3
  it knows the blast door opened; the rain on the stair is left).
