# The Shallows (room 73, Lv 150–158, Lantern Fen's first wilds)

Atlas Phase 8, L0 (`story/phase8-plan.md`; the town is `docs/places/fen.md`). East off Wickmere's boardwalk: knee-deep
still water over peat, reed beds, lily pads and stretches of old boardwalk still up on their posts, under the Fen's
violet dusk.

Files: the room in `src/shared/rpg.js` (`SHALLOWS`, `SHALLOWS_W`, `SHALLOWS_EXIT_X`, `SHALLOWS_WAY_X`,
`FIREFLY_GATE_X`, `GROVE_GATE_X`, `SHALLOWS_ZONES`, `SHALLOWS_PLATFORMS`, the `STAGES` row, the four mobs, their
materials and spawns), `ROOMS[SHALLOWS]` in `src/shared/sim.js`, its drawing in `src/shallows.js` (`drawShallows`; the
sky and the mere are Wickmere's `drawFenSky` / `drawFenAir`), its creatures and materials in `src/shallows-art.js`
(`SHALLOWS_MOB_ART`, `SHALLOWS_ICONS`), the frog's mud and the bog slime's muck in `src/hazards.js` (shot style `mud`,
puddle style `bog`), the gates' art in `src/branch-gates.js` (`drawWillowfall`, `drawFloodwater`), the waystone in
`src/shared/waystones.js`, the `shallows` music scene and the mobs' voices in `src/audio.js`.

## The room
West to east (`SHALLOWS_ZONES`):
- **The Landing Stage** (no mobs): the last boards of Wickmere's boardwalk on their posts, a lantern on the last one, and
  a waystone (`SHALLOWS_WAY_X`). The way back to Wickmere is its west end.
- **The Reedbeds** (150–152): reed clumps and tussocks of peat (platforms); the side path to **Firefly Hollow** goes off
  here, a fallen willow across it (a gate, below).
- **The Lily Flats** (152–155): open water thick with lily pads, an old boardwalk high on its posts.
- **The Sunken Boardwalk** (155–158): the boardwalk's posts poking up where the boards have gone, a high stretch still
  standing; at the far end the **Drowned Grove**'s path, under water to the rails (a gate).
- **The find:** the **drowned signpost** (last in `SHALLOWS_PLATFORMS`), a tall post up off the high boardwalk, a plank
  across its top to stand on, its arms pointing at every island the fen folk know (GREENHOLLOW, FROSTPEAK, EMBERDEEP)
  and one pointing up with no name on it.

## Its mobs (on the frozen curve; no elites, no field boss until L3)
- **Lantern moth** (150): a big soft grey-violet moth with a light in its belly; passive, flutters over the reeds
  (`fly`). The fen folk say they're the dead's lanterns learning to fly.
- **Bog slime** (152): the fen's own peat gone to jelly, slow and heavy; leaves a trail of stinging bog muck (`trail`,
  style `bog`). The plan's "sticky: slows you" would need a movement change in `step()`, so it's the muck instead.
- **Mire frog** (154): sits on the lily flats and lobs gobbets of mud (`lob`, style `mud`); its throat swells first.
- **Mudskipper** (156): a goggle-eyed fish that runs at you across the mud on its fins, quick and low. Drops the Reed
  Hood now and then (very rarely).
Materials: lamp dust, bog jelly, mire frog skin, mudskipper fins (`docs/economy.md`).

## Gates here (`LANTERN_FEN`, `docs/places/branches.md`; lifted by L1)
- **Firefly Hollow** (`FIREFLY_GATE_X`, kind `willowfall`): a great willow down across the side path, its root plate
  torn up, dead fronds in the water, a few fireflies on the far side: "A great willow came down across the side path.
  Too rotten to climb, too big to shift."
- **The Drowned Grove** (`GROVE_GATE_X`, kind `floodwater`): the boardwalk runs on east under a sheet of risen water up
  to its rails, a lantern post half drowned with its light still going under the water: "The water's up over the
  boardwalk rails. Nobody wades the Grove path like this."

## Decisions and history
- 2026-11-11: built in L0 with the town. **Not played yet** (`docs/places/fen.md`, "Decisions").
- Its band starts where the Citadel's ends (owner's Lv 150–180 for the Fen), so the 150–155 slice has the Shallows and
  the Citadel's top; Firefly Hollow (L1) is its easy second place.
