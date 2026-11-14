# The Engine Halls (room 90, `ENGINE`): Lv 175–190, the Stormcoil and Number Nine

The Citadel's depth pass, **C3** (`story/citadel-plan.md`; room 13 and its gates: `docs/places/citadel.md`). Through the
blast door in the Chrono Spire (`ENGINE_GATE_X`): it vented steam too hot to pass since C0; it has stopped and stands open
(`blastdoor`'s open look in `src/citadel-gates.js`; the update did it, no quest). The engines that keep the city in the sky:
a long iron hall open high up on its far side to the dusk over the clouds, great aether turbines behind glass burning blue,
their shafts going down through a grated floor that is a catwalk over a long drop, gantries hung from the roof, wind
through every grating. Tone: the Citadel's (solemn, no living people; machines still on shift).

Files: the room in `src/shared/rpg.js` (`ENGINE`, `ENGINE_W`, `ENGINE_EXIT_X`, `ENGINE_WAY_X`, `NINE_X`, `HELM_GATE_X`,
`ENGINE_ZONES`, `ENGINE_PLATFORMS`, `TURBINES` and `turbineAt`, the `STAGES` row, the three mobs, the Stormcoil, their items,
spawns, `SHOPS.nine`), `ROOMS[ENGINE]`, its door in `ROOMS[CITADEL]` and Number Nine's `NPCS` row (`src/shared/sim.js`), the
nodes in `CITADEL_MAP` (`src/shared/branches.js`: `engine`, and `helm`, the next gate), the waystone
(`src/shared/waystones.js`), the turbines' damage in `server/rpg.js`, the room's drawing in `src/engine.js`
(`drawEngineHalls`, which takes the render tick), the mobs, gear, icons and Nine's look in `src/engine-art.js`, the Helm's
bulkhead in `src/citadel-gates.js` (`bulkhead`, drawn open since C4 as the Helm's den door: `docs/places/helm.md`), the `cinder` shot and `arc` beam in `src/hazards.js`, the `arc` pulse in
`src/party.js`, the `engine` music scene in `src/audio.js`, Nine's persona in `server/characters.js`.

## The room
You come in at the WEST end, through the blast door. West to east (`ENGINE_ZONES`):
- **The Boiler Gallery** (no mobs): the Engine Halls' waystone (`ENGINE_WAY_X`, `isle: 'citadel'`: the blast door is 760 px
  from the Spire's stone and Nine trades here, so like the Archive it has its own), **Number Nine** at its furnace
  (`NINE_X`), a coke bunker, and the shift board on the wall: twelve pegs, one tag left, a 9.
- **The Stoke Hold** (175–180): catwalks and a gantry; stoker automata and arc jellies.
- **The Turbine Walk** (180–185): arc jellies, governor balls, a stoker; the first turbine slots.
- **The Governor's Deck** (185–190): governor balls and jellies, a turbine slot, **the Stormcoil** hanging over it (field
  boss), and at the far end **the Helm's bulkhead** (`HELM_GATE_X`, `bulkhead`: a steel door sealed while the city was
  under way, its gauge in the red, UNDER WAY on its plate, a great wheel's spokes turning past its porthole). **C4 opened
  it**: swung back on a lit stair, the door into the Helmsman's den (the party den, `docs/places/helm.md`).
- **The turbine blades** (`TURBINES`, a room hazard: the Skydocks' gusts' pattern). The great turbines' blades come round
  up through slots in the catwalk floor (a dark slot, hazard stripes either side). On each slot's own offset in a
  `TURBINE_CYCLE` the turbine spins up (`TURBINE_WARN`: the slot glows blue, the grating shakes), the blades sweep through
  (`TURBINE_SPIN`: they hurt whoever stands on the floor over the slot, `TURBINE_DOT` of max HP every `PATCH_HIT_EVERY`
  ticks) and it slows. Both sides read the server tick (`turbineAt`), so nothing goes over the wire; a flat `'dot'` (no
  knockback), so no `step()` change. A catwalk over the slot, or stepping off it, is safe. Telegraphed by drawing only (no
  new prompt), the gusts' way, so phones need nothing new.
- **The find** (last in `ENGINE_PLATFORMS`, `telegraph`): on the Stoke Hold's top gantry, the engine-room telegraph, its
  handle stopped hard at FULL AHEAD, a paper tag tied to it in a neat hand: **HOLD**. Nothing says so. (The Stopped Hour's
  order, shown; Tier 4.)

## Its mobs (on the frozen curve, read off the Fen's deep room at the same levels)
- **Stoker automaton** (177): a squat iron fireman, a furnace door in its chest burning blue, a shovel for one arm; it throws
  a scoop of burning aether-coke (`lob`, a new `SHOT` style `cinder`). HP 96%. Material: Aether-Coke.
- **Arc jelly** (182): a spark of loose aether gone soft, a pale blue bell trailing filaments; it throws an arc along the
  grating (`beam`, a new `BEAM` style `arc`, the sentry drone's way). A flier (`fly` 40), HP 87%. Material: the Arc Filament.
- **Governor ball** (187): an engine's flyweight governor off its spindle, two brass balls on a bent arm; it bounds and comes
  down with a clang (`stomp`). HP 93%. Material: the Governor Weight.
- Voices borrowed (the golem's, the wisp's, the cogling's). No elites; the halls' den is the Helm (C4), through the bulkhead.

## The Stormcoil (field boss, Lv 186)
One of the great aether coils that drive the turbines, come loose of its housing: a tall drum of copper windings round a
glass core burning blue, brass end-caps, two cracked gauge-lenses for eyes, torn cables hanging off it into the dark, arcs
jumping off it. Small boss, no story (a `desc`). Number Nine logged it as "Coil Four". Passive until hit; then it hovers
(`fly` 70) and throws arcs along the deck (`beam`, style `arc`). T3's (`docs/combat/challenges.md`): `rings` of sparks
from the start (`looks.rings: 'spark'`) and from its second third `late` tells. S5.4: with two or more on it, `pulse` (its
charge builds round it till it breaks, a new `PULSES` look `arc`, "ARC") and `focus`. Drops the Coil Lance (twins: the Coil
Staff, the Arc Bow) and the Stormcoil Helm, Lv 188, `BOSS_GEAR.field`; Coil Windings and Arc Filaments. Its pet, the mini
Stormcoil, sits between Grandfather Mire's and the Wickmother's (`PETS`; `PETSHOP_W` up to fit it).

## Number Nine (AI, `nine`; trades)
The last stoker automaton on shift (`accessory: 'stoker'`, `drawStokerDress`: soot down its front, a big chipped 9, a
furnace grille in its belly, a peaked cap with a lamp, a shovel it leans on). Twelve stokers on the board; the others stopped
one by one; it was never relieved, and takes every slime for its relief at first. Short, gruff, kind, dry jokes; not in
capitals (that's the Commissary).
- **Its purpose**: its locker of spare kit (`SHOPS.nine`, aim Lv 185): the potions, the Stoker's Slice-Bar, the Damper Rod,
  the Firegrate Bow and the Stoker's Goggles. And the halls as a stoker knows them: the mobs, when the turbine blades come
  round, Coil Four (the Stormcoil), the Helm's bulkhead ("sealed while under way. We're still on the last heading. Always
  have been.").
- No `lore` cap: like the Commissary it's a worker with no canon to give ("above my grade. I stoke.").
- Its life: it counts shovels and loses count; it keeps the other eleven tags in a tin and polishes them; it hums with the
  turbines. Plan decision 6 (traders are automata still on duty) stands.

## Decisions and history
- 2026-11-13: built at the owner's "continue with next phase" (every plan default). **Not played by anyone yet**; checked by a
  build, the economy sheet, a start-up of a throwaway server, every new draw function run against a stub canvas in Node,
  and reading the code (owner's rule: no headless bot tests).
- The plan's three mobs; the arc jelly's "shock ring" became an arc along the grating (a `beam`), so no new brain was needed.
- The plan names no find for the Engine Halls; the telegraph tagged HOLD was added so every branch has one.
- A waystone in the Boiler Gallery though the plan names only the Bastion's and the Spire's (as the Archive's, C2).
- The Last Echo now knows the blast door stopped venting and asks after Nine ("Nine was always on shift").
