# The Undercroft (room 94, `UNDERCROFT`) and the Spoke (room 95, `SPOKE`)

The Citadel's depth pass, C6 (b): the way to the Citadel's final boss, the Escapement. The plan is `story/c6-plan.md`, "On
the way there". The pattern is L5's `docs/places/peatbarrows.md`, E5's `docs/places/underflues.md` and FB2's
`docs/places/oldice.md`: deep room, then approach, then den. The den is room 96, `CATCH_DEN`, `CATCH_DEN_NAME` "The Catch",
built in C6 (c): `docs/places/escapement.md`.

The band, at the owner's 2026-11-12 "past 200" note:
- The Undercroft is Lv 205–215. That's C0's stretch of the plan's 192–200.
- `CITADEL_TOP` is 215. The Escapement's tag reads `finalTag(CITADEL_TOP)`: "Lv 235 · recommended Lv 215, 4+ players".
- From 208 to 215 it's the only place (the Bell Walks end at 208), the way the Peat Barrows were at 180–190.

## The way in (the Keel gets better)
- **The tooth levered aside.** At the Lowest Teeth's far end in the Keel (`UNDERCROFT_GATE_X`, room 93), the tooth that had
  fallen across the shaft (C5's gate) now leans on end against the hull. The long iron bar it was levered with is still
  wedged under it, and a stair is cut down into the shaft beside it, lit blue from below. That's `drawToothLevered`,
  `fallentooth`'s open look in `src/citadel-gates.js`. The update did it, no quest, and nobody says who.
- **The door** is in `ROOMS[KEEL]`.
- **On the island map** it's one node, `undercroft`, under the Keel (`CITADEL_MAP` in `src/shared/branches.js`), with both
  rooms as its `rooms`. Its child is the `catch` node, the Catch (room 96). Until C6 (c) gave the den its `DENS` row that
  node was a gate at the Spoke's end (`catchdoor`, `sign: false`); the gate went with the row, like the Wickmother's inner
  door, and the door is the den's own (`denDoors(SPOKE)`).

## The Undercroft (Lv 205–215, a deep room on hard-pocket rules)
- **Files.** Data: the `UNDERCROFT_*` constants, the mobs, the items and the spawns in `src/shared/rpg.js`; the room in
  `src/shared/sim.js`. Art: `src/undercroft.js` is the room; its `drawUndercroftFront` is the dark closing in, baked once
  and drawn with `globalAlpha`. `src/undercroft-art.js` has the mobs, gear and icons; the staff and bow are rows in
  `src/staff-art.js` and `src/bow-art.js`. Music scene `undercroft`.
- **The look.** The floor of the city's underside, right under the Wheel. Overhead the Wheel's rim fills the top of the sky,
  its teeth as big as houses. The spokes' feet come down out of the dark and go off east toward the hub, a dark drum far
  ahead with a pale-blue light at its heart (the shard, seen from a long way off).
  - The only light is aether leaking up through cracks in the plates. It's darker going east (`darkAt`): the Weight Pit
    is nearly black.
  - The Wheel heaves against the catch on a slow, heavy beat (`UC_BEAT`, slower than the Keel's tick, the Spoke's
    heartbeat starts from it). On each heave the teeth shudder and dust comes down.
  - Aether motes drift **up** (time is wrong down here too).
- **Hard-pocket rules** (`hard` in `STAGES`): red level chips, red-trimmed zone signs, **no waystone, no trader**, elites
  throughout. **You come in at the WEST end** (`UNDERCROFT_EXIT_X`, the foot of the Tooth Stair) and go east:
  - **The Tooth Stair** (no mobs): steps cut down out of the Keel's shaft, the fallen tooth's point showing over the
    stairhead.
  - **The Sump** (205–208): leaked aether standing in pools on the plates, and broken gear-housings for ledges.
  - **The Wrights' Gallery** (208–211): the wheelwrights' scaffold still hung against the Wheel's face, timber poles going
    up into the dark, their tools left hanging (a spanner, a lamp gone out, a bucket).
    **The find** (last in `UNDERCROFT_PLATFORMS`, `brake`) is high on the scaffold: the Wheel's brake lever, pulled hard
    over to HOLD and chained there, an hourglass stamped on the padlock. Beside it on the beam is a wheelwright's chalk
    tally, strokes in fives, the last stroke stopped halfway. Nothing says whose hourglass (Chronos's is on his crown in
    the Hour Sanctum: shown, not said).
  - **The Weight Pit** (211–215): the clock's drive weights hanging in the dark on chains, and the cradles that once held
    them for ledges. At the far end, the foot of the Spoke (`UNDERCROFT_END_X`), a spoke's root ramping up into the dark.
- **No room hazard.** The Keel has the grinds; the Undercroft's danger is the mobs, and the pendulum is saved for the den
  (the Beat, `story/c6-plan.md`).
- **Mobs** (legacy brains, on the frozen curve, `docs/economy.md`):
  - **Sump slimes** (205): leaked aether gone thick and alive, blue-black, drowned gear teeth turning in them. `lob` with the
    new shot style `sump` (`SHOT` in `src/hazards.js`).
  - **Wheelwright echoes** (207): the Keepers' wheelwrights who went down in the Stopped Hour to free the Wheel and never
    came up. They have the Last Echo's look (see-through blue-white, flickering, lines running down them), a wheelwright's
    leather cap with a lamp at the brow, and a great spanner. `phase`, the bell wraith's. Rare: the **Wheelwright's Cap**.
  - **Loose pawls** (210): the Wheel's ratchet pawls come off their pins, hooked iron catches on coiled springs with the
    pin-hole lit like an eye. `stomp`.
  - **Counterweights** (213): the clock's drive weights, great bells of lead on chains out of the dark. `dive`, `fly` 74.
  - Elites: the Great Sump Slime, the Master Pawl, the Great Counterweight.
- **The Mainspring**: a named elite at the far end, coiled across the foot of the Spoke. It's not a boss: no den, no phases,
  an ordinary respawn.
  - What it is: the clock's mainspring, a coil of blue steel as big as a house, wound tight for an age (holding on: it never
    let go of being wound). Its loose outer end lifts like a head.
  - It uncoils at you in a lunge, the `shell` brain's lunge with `cut: 0`, like the Eldest, Garm and Orthrus.
  - It's `elite('counterweight', …)` with its own `art` (`mainspring`) and `fly` cleared, so the sheet checks it as an elite
    of the room's top mob.
  - It drops the **Mainspring Blade** with its twins, the **Coilspring Staff** and the **Springsteel Bow** (`mainspring_bow`;
    `spring_bow` was taken by Slag's Ironspring Bow), at 4%.
- Materials: Sump Glass, Wheelwright's Chalk, Pawl Spring, Weight Lead.

## The Spoke (the approach: no mobs, no combat)
`src/spoke.js`. It isn't a stage (no `STAGES` row, not a combat room): it's safe ground where the party gathers. The owner's
rule: everything cinematic here is drawing and sound, never `step()`, never a cutscene. You should feel shut in, never be.
- **The walk:** down one of the Wheel's spokes toward its hub, a beam of black iron as wide as a road over the dark, rivets
  in rows. The other spokes fan out round you into the black.
- **`spokeDepth(x)`** (0 at the way in, 1 at the den's door) drives it all, from **your own** slime's x:
  - **The hub comes up ahead** (`hubAt`): off to the right at first, then bigger and nearer. Under it, through the escape
    wheel's teeth, is **the Escapement's silhouette**: the anchor hanging off the hub with its pallets biting two teeth,
    the crutch and the bronze bob swinging under it, and the shard's light in the arbor. It's only a shape; it's met in
    the Catch.
  - **The tick** (`TICK_FAR` to `TICK_NEAR` seconds) gets slower the nearer you are. Its phase is carried smoothly as the
    period stretches. On each tick the spoke jolts a pixel, the shard brightens and the door shudders.
  - **Closing in:** the two near spokes either side draw in toward you, and behind you the rim's teeth close in from the
    screen's left edge over the way back (art only: the door back always works).
- **Music scene `spoke`:** a held low note and a cold pad that goes first. The tick gets louder and slower: every beat, then
  every other, then once a bar. From about halfway there's a heartbeat under it, two thumps. The tune is three glass-bell
  notes, further apart the nearer you are. `audio.setDepth` is set every frame from `src/main.js`, as on the Lamp Road.
- **Its line** (`ESC_LINE`): the first slime past `ESC_MARK_X` in an empty Spoke makes the server send
  `{t:'boss', a:'voice', who, text}` to the room (`spokeSaid` in `server/rpg.js`, reset when the room empties), like the
  Wickmother's. It shows as a dark iron bubble with pale aether writing.
- **The Catch's door** at `ESC_DEN_X`: a round iron door in the hub's casing, its edge geared like a wheel, a boss at its
  middle, on a bronze track. In (b) it shuddered on every tick and held. Since C6 (c) gave the den its `DENS` row
  (`CATCH_DOOR_OPEN`) it rolls aside along its track by itself as you come near.
- **The sign beside it:** `CATCH_DEN_NAME`, `finalTag(CITADEL_TOP)` and a live count. A count, never a lock.

## Who knows (personas that changed with it)
Nobody names the Escapement except as a part number.
- **The Commissary**: the tooth moved ("OBSTRUCTION REMOVED. NOT BY STORES."), the Undercroft on a parts list, a roster of
  wheelwrights never signed off, and "ESCAPEMENT, MAIN. IN SERVICE."
- **The Last Echo**: it felt the tooth move. It remembers the wheelwrights going down with their lamps and none coming up.
  At the hub it says only "it was told to hold".
- **Folio**: a drawing of a toothed anchor in its catalogue, the label torn off.
- **Number Nine**: the floor went down a hair, once. It logged it.

## Decisions and history
- 2026-11-15: built in C6 (b) at the owner's "continue with next phase", with the Escapement's plan (`story/c6-plan.md`)
  written the same day. **Not played by anyone yet.** There was no headless test (owner's rule). Checked by a build, the
  sheet, a throwaway server boot, and a Node run of every new drawing function against a stub canvas (no non-finite
  numbers, every mob returns its outline). Nobody has seen the art by eye.
- Liberal decisions:
  - The four mobs and the Mainspring (the plan named only "elites throughout").
  - The zone names.
  - The brake lever as the find (the plan named none).
  - No room hazard.
  - The tooth levered aside with no one named.
  - The Spoke's door as a round geared door that rolls aside.
- The Undercroft's darkness is drawn only (the vignette, `darkAt`). Real darkness round the slimes, A16's light circles
  (`docs/ideas.md`), wasn't added: the den's own phase 4 is the place for it if the owner wants it.
