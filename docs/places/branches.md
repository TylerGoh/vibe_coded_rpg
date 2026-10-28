# Each island's branches: blocked ways in and the island maps

The island depth plan (`story/world/island-depth.md`) grows Greenhollow to Lv 1–60 with side areas
("branches") off the main trail. Phase G0 laid every branch's entrance before any of them exists, so the
island shows what's coming.

- Data: `GREENHOLLOW`, `FROSTPEAK` and `EMBERDEEP` in `src/shared/branches.js`. Each holds every place on its island's
  map: the towns, the stage's zones (`zone`, with `zr` the stage room when it isn't the Wildwood), the
  branches, each with its band, `hard` for hard pockets, the node it hangs off (`from`) and where it sits on
  the map (`at`). `ISLAND_MAPS` says which islands have a map (Greenhollow, Frostpeak, Emberdeep); `GATES`,
  `ENTRIES` and `nodeAt` read all of them.
- **A branch that hasn't shipped has a `gate`**: the blocked way in, in a real room (the room and x, the
  kind of art, the prompt, and what E says). Gates are drawn by `src/branch-gates.js` (`DRAW`); each has a
  small sign with the place's name (red-trimmed for a hard pocket). G0 laid one for every branch; since G5
  none is left on Greenhollow, and all are drawn open (`OPEN`). Frostpeak's pass will lay its own.
- A place behind another unshipped one gets `past: true` and no gate (its way in would be in a room that
  doesn't exist yet). None is left on Greenhollow; Frostpeak's pass may need it again.
- Walking up to a gate shows an E prompt and a beacon (`gateAt`, `drawHints` in `src/main.js`); E shows a
  toast saying what's in the way. Nothing goes to the server.
- **Owner rules** (`Agent.md`, story): the block is an in-world reason, never a "coming soon" sign or a
  stand-in door. When a branch ships, the update itself lifts the block: give it its rooms (`rooms` on
  its node), remove its `gate`, and the art and prompt go with it. Then its children (e.g. Wreck Cave
  after Saltspray Coves) get gates in the new room.
- **Shipped (G1):** Willowmere and Saltspray Coves have `rooms` and an `entry` (`ENTRIES`, drawn by
  `drawEntries`: the mended footbridge, the rockfall rolled aside). Wreck Cave's gate is now in the Coves
  (`flooded`, a hard pocket).
- **Shipped (G2):** the Mycelium Deep (the stump's roots cut back, a rope down: `stump` drawn open) and
  Glowroot Hollow, whose way in is the Deep's own far end (`entry` in the Deep, `crack`). An entry takes
  its node's `hard` for a red-trimmed sign, like a gate's.
- **Shipped (G3):** the Old Oak Canopy (`docs/places/canopy.md`): the rope ladder restrung (`ladder` drawn
  open). Keeper's Spine lost `past` and got its gate in the Canopy (`trunk`, at `SPINE_GATE_X`).
- **Shipped (G4):** the hard pockets, Wreck Cave (`docs/places/wreck.md`: the water down, a plank across,
  `flooded` drawn open) and the Thornheart (`docs/places/thornheart.md`: the thorns cut into a tunnel,
  `thorns` drawn open).
- **Shipped (G5):** Keeper's Spine (`docs/places/spine.md`: the trunk sawn through, `trunk` drawn open) and
  the Root Warden's den. Greenhollow has no gates left.
- **Frostpeak (F0, F1, 2026-10-23):** its map and gates, the same way. Open: the Rimeglass Glacier
  (`docs/places/glacier.md`, its snout on Starfall Summit, `snout`). Blocked: the Whale Skerries (a snow
  slide over the shore path at Icefang Hamlet's west end, `snowslide`, `SKERRIES_GATE_X`), the Narwhal
  Grotto (`past`, behind the Skerries), the Queen's Bridge (its ice stair broken off on Frostpine Ridge by
  the Frozen Throne, `icestair`, `BRIDGE_GATE_X`), and in the Glacier the Blue Halls (the cutters' ladder
  smashed at the bottom of a crevasse, `crevasse`, `BLUEHALLS_GATE_X`) and the Aurora Heights (the steps
  sheared off the Icefall, `icefall`, `HEIGHTS_GATE_X`). Plan and phases: `story/world/island-depth.md`.
- **Shipped (F2, 2026-10-23):** the Whale Skerries (`docs/places/skerries.md`: the snow slide dug through,
  `snowslide` drawn open) and the Narwhal Grotto (`docs/places/grotto.md`), which lost `past` and opened in
  the same phase: its `entry` is in the Skerries (`grotto`, the cave mouth in the sea cliff).
- **Shipped (F3, 2026-10-23):** the Aurora Heights (`docs/places/heights.md`: new steps cut up the icefall,
  `icefall` drawn open) and the Blue Halls (`docs/places/bluehalls.md`: a new ladder down the crevasse,
  `crevasse` drawn open). Frostpeak's only gate left is the Queen's Bridge's ice stair (F4).
- **Shipped (F4, 2026-10-23):** the Queen's Bridge (`docs/places/queensbridge.md`: the ice stair built up again,
  `icestair` drawn open) and Sigrun's den. Frostpeak has no gates left.
- **Emberdeep (E0, atlas Phase 5, 2026-10-23):** its map and every gate, the same way (plan:
  `story/world/emberdeep-depth.md`). Forgehold is the town (`docs/places/forgehold.md`); the legacy stage's
  two zones are nodes (`zr: CALDERA`). Blocked: the Black Sands (a geyser across Forgehold's beach path,
  `geyser`, `SANDS_GATE_X`), the Smoking Coast (a fresh lava tongue down the gully in Cinder Flats,
  `lavatongue`, `COAST_GATE_X`), the Ashwood (the charcoal road's iron bridge fallen into a lava channel,
  `ironbridge`, `ASHWOOD_GATE_X`), the Brimstone Fields (the vent field fuming, up Magma Heart's flank,
  `fumes`, `BRIMSTONE_GATE_X`); `past`: the Drained Tubes (behind the Coast), the Old Foundry (behind the
  Ashwood) and the Caldera Rim (behind the Fields). The balloon by the thermal column (`balloon`, `BALLOON_X`)
  is atlas Phase 6's block, not a branch, drawn and mapped the same way. Mind the den mouths' boss signs: the
  bridge and the balloon first overlapped Ignis's and Pyra's and moved west (the balloon is drawn smaller,
  `SCALE`).
- **Shipped (E1, the Black Sands):** `docs/places/blacksands.md`: the geyser gone quiet, stones laid across
  (`geyser` drawn open by `drawGeyser`'s `open` flag); the node has `rooms` and an `entry` in Forgehold. No waystone
  (the plan's choice: it's next to town).
- **Shipped (E1, the Ashwood):** `docs/places/ashwood.md`: the charcoal road's iron bridge hauled back up (`ironbridge`
  drawn open by `drawIronBridge`'s `open` flag); the node has `rooms` and an `entry` in Cinder Flats. The Old Foundry
  lost `past` and got its gate at the Ashwood's west end (`adit`, `FOUNDRY_GATE_X`: the mine adit bricked up by the
  forge folk themselves). Emberdeep's gates left after E1: the lava tongue (the Coast), the adit (the Foundry), the fumes (the
  Brimstone Fields) and the balloon (Phase 6).
- **Shipped (E2, the Smoking Coast):** `docs/places/coast.md`: the gully's lava tongue crusted hard, steps cut down it
  (`lavatongue` drawn open by `drawLavaTongue`'s `open` flag); the node has `rooms` and an `entry` in Cinder Flats. The
  Drained Tubes lost `past` and got their gate in the Coast's sea cliff (`tubemouth`, `TUBES_GATE_X`: steam roaring out
  of the old lava tube, the sea got in below); `drawTubeMouth` already has its `open` look and `OPEN.tubemouth` is
  registered, so shipping the Tubes is data only. The Hatchkeeper's den (room 57, `HATCH_DEN`) opens at `HATCH_DEN_X`
  (E2's second piece; its door comes with its `DENS` row through `denDoors(COAST)`). Emberdeep's gates left: the tube mouth (the Tubes), the adit
  (the Foundry), the fumes (the Brimstone Fields) and the balloon (Phase 6).
- **Shipped (E2, the Drained Tubes):** `docs/places/tubes.md`: the tube drained, the steam gone (`tubemouth` drawn open);
  the node has `rooms` and an `entry` in the Coast. No waystone (a hard pocket). E2 done. Emberdeep's gates left: the adit
  (the Foundry), the fumes (the Brimstone Fields) and the balloon (Phase 6).
- **Shipped (E3a, the Brimstone Fields):** `docs/places/brimstone.md`: the wind turned, the fumes lean off the path and
  Ochre cairned it (`fumes` drawn open by `drawFumes`' `open` flag); the node has `rooms` and an `entry` in the Caldera
  room. The Caldera Rim lost `past` and got its gate at the Fields' west (top) end (`bearerstair`, `RIM_GATE_X`: the
  Bearers' stair, its hand-chains rusted through and its top steps fallen); `drawBearerStair` already has its `open`
  look and `OPEN.bearerstair` is registered. Emberdeep's gates left: the adit (the Foundry, E3b), the Bearers' stair
  (the Rim, E4) and the balloon (Phase 6).
- **Shipped (E3b, the Old Foundry):** `docs/places/foundry.md`: Ash had the adit's bricks taken down, stacked beside the
  mouth, a lamp lit on the hook (`adit` drawn open by `drawAdit`'s `open` flag); the node has `rooms` and an `entry` in the
  Ashwood. No waystone (a hard pocket). E3 done. Emberdeep's gates left: the Bearers' stair (the Rim, E4) and the balloon
  (Phase 6).
- The island map (`docs/ui/world-map.md`) reads the same list: shipped places solid with their levels,
  the rest dashed with a short `block` reason. Keep both in step: a node's `block` should match its gate.

## Shipping a branch: the checklist (from G1–G5, for Frostpeak's pass)
Each phase so far touched the same places. Work in a dev copy (`Agent.md`); the Mycelium Deep (G2) is the
fullest example, the Canopy (G3) the last with a trader, G5's Spine the latest (a den, no trader).
- **Data, `src/shared/rpg.js`:** a room id (the next free number below `HOUSE_BASE`: 61 after E3b's Old Foundry (60), E3a's Brimstone Fields (59), E2's Smoking Coast (56), the Hatchkeeper's den (57) and the Drained Tubes (58), E1's Ashwood (55) and Black Sands (54); 53 is the dev sandbox's Training Yard; ids 27, 31–52 are the Pet Shop, the Canopy, Wreck Cave, the Thornheart, the Spine, the Warden's den, the Glacier, the Skerries, the Narwhal's den, the Grotto, the Aurora Heights, the Blue Halls, the Queen's Bridge, Sigrun's den, Forgehold, the Lodestar's two decks, the Sunken Road, the Road's End, Ladon's den (49), the Old Ice, the Long Stair and Fenrir's den (52, the Wolf's Hold)), `*_W`, `*_EXIT_X`, the way in's x in the parent room (`*_GATE_X`,
  where the gate stood), the trader's x, `*_ZONES` (the first one a mob-free hub, `lvl: null`),
  `*_PLATFORMS` (put the hidden spot last; `onRoomPlat` helper names must be new: F2 first clashed with
  Willowmere's `onWPlat`), a `STAGES` row (`band`, `pill` if the name is long, `hard` for
  a hard pocket), mobs **appended** to `MOBS` (kinds go over the wire as their index), spawns (an
  `onRoomPlat` helper), a `DENS` row for a den, `ITEMS` (materials; gear with `lvl`; trader gear with
  `aim`), a `SHOPS` row.
- **`src/shared/sim.js`:** import and re-export the room id, the door in the parent room (its level chip
  comes from `STAGES` by itself), `ROOMS[id]`, the `NPCS` entry, `SLAP_QUIPS`. **`branches.js`:** the node
  gets `rooms` and an `entry`, loses its `gate`; children's gates move into the new room. **`waystones.js`:**
  a stone in the hub (not in hard pockets), with its `isle`. **`house.js`:** `PETS` for any boss or field boss.
- **Server:** a persona in `server/characters.js`. The mob brains are generic, so usually nothing else; a new
  mob flag needs its line (G3's `anchored` in `damage()`).
- **Client:** a room art file (`draw<Room>(ctx, camX, viewW, time)`, painting its own sky) and a
  `<room>-art.js` exporting `*_MOB_ART`, `*_SWORDS`, `*_SWORD_LEN`, `*_HELMETS`, `*_ICONS` and the trader's
  dress; register them in `src/field.js` and the dress in `src/slime.js`; the render branch in `main.js`;
  the open art (`OPEN`) and any new gate art (`DRAW`, `SIGN_AT`) in `src/branch-gates.js`; new shot or
  puddle `style`s in `src/hazards.js`; a Keeper stone in `src/ruins.js`; a music scene in `src/audio.js`
  (its `ROOM_KEYS` slot is the room id: pad with `null`s) and the new mobs' voices borrowed in `MOB_HURT` /
  `MOB_DEATH`.
- **Checks:** `npm run economy` before and after, `--check` green; `npm run docs:check` (in a dev copy it
  also complains that `dist/` is missing: that's only the copy); a headless test (`docs/testing.md`) of the
  room, the way in and out, the trader's Trade button, the waystone, the gate's E message, the island map
  and a phone screenshot.

Gotchas already hit:
- **Fliers only notice slimes within 70 px of their own height** (`stepMob`): a `fly` over ~66 never aggros
  anyone on the floor. Field bosses are passive until hit, so they can hover higher.
- **Knockback slides slow or still mobs away.** A mob that shouldn't move (a nest) needs `anchored: true`.
- **`split` minions aren't checked by the economy script** (only spawned mobs are). Keep their EXP and gold
  small, like the pufflings and wasps.
- **Pet prices must rise with the boss's level**, field bosses included (`--check` fails otherwise): the
  Lv 38 Hornet Queen's pet had to go above Lv 36 Ignis's. Every new pet also needs room in the Pet Shop:
  the server warns at start-up when `PETSHOP_W` is too small (G4 raised it).
- **A place that opens changes what characters say.** Update the personas that describe its block (G4:
  Moss on Wreck Cave, Acorn on the thorns).
- **A gate's `says` must fit the toast** (it doesn't wrap): under about 90 characters.
- **3/4 music scenes need `beats: 3, melSteps: 6`** as well as `spb: 6`.
- The island map's "you are here" label moves beside the pin when a card sits right above (`drawPin`).
- Testing: a fresh test account is Lv 1; copy a mid-level character's row from a copy of the accounts DB
  into the test DB's `rpg_chars` to fight. In a test script, a second Esc opens the menu and eats later
  key presses.

## The next phases' loose ends (where things already are)
- **Greenhollow's way to its final boss** (FB1 (b), `docs/places/sunkenroad.md`): the `sunkenroad` node under the
  Thornheart (two rooms, entry `rootsplit`). A deep room and an approach follow the branch checklist above, except
  the approach is no stage at all (no `STAGES` row: not a combat room).
- **Frostpeak's way to its final boss** (FB2 (b), `docs/places/oldice.md`): the `oldice` node under the Blue Halls
  (two rooms, entry `fallenwall`). Until FB2 (c) a `wolfhold` node gated the den's door ("the ice holds"); (c) added the
  den's `DENS` row and deleted the node, so the door comes through `denDoors` like Ladon's (`docs/places/fenrir.md`).
- **Greenhollow is done** (G0–G5) and **Frostpeak is done** (F0–F4). **Emberdeep's E0 shipped** (atlas Phase 5:
  the Lodestar, Forgehold, the map and every gate). E1 shipped: the Black Sands (`docs/places/blacksands.md`) and the Ashwood
  (`docs/places/ashwood.md`), plan in `story/world/emberdeep-depth.md` (the owner approved every default); both gates
  lifted with open looks in `OPEN` (the F3 pattern: the draw function with an `open` flag) and the Old Foundry's gate laid
  in the Ashwood (E3 unbricks it the same way). **E2 is done** (the Smoking Coast, the Hatchkeeper's den, the Drained
  Tubes: `docs/places/coast.md`, `docs/places/tubes.md`); E3a shipped the Brimstone Fields (`docs/places/brimstone.md`,
  the Rim's gate laid there) and E3b the Old Foundry (`docs/places/foundry.md`, the adit unbricked): **E4 is next** (the
  Caldera Rim, its gate the Bearers' stair in the Fields). Every new Emberdeep room needs its
  `ISLAND_OF_STAGE` row (`'ember'`) and its waystone `isle: 'ember'`; update Ash's persona (he lists the blocks).
- F4 gotchas: the open art for the ice stair is `drawIcestair` with an `open` flag (the F3 pattern); a party den
  with a new `wave` look needs its own mass in `fxWaveWarn` / `fxWaveGo` (`iceMass`); a staff can need a new head
  shape in `HEADS` (`shield`); Sigrun's pet pushed `PETSHOP_W` up again.
- F3 gotchas: the open art for a gate can be the gate's own draw function with an `open` flag (`crevasse`,
  `icefall`); a node at the island map's top edge needs the pin label beside it (`drawIslandMap`); two more
  pets meant `PETSHOP_W` went up again.
  Each lifted gate becomes an `entry` with open art (`OPEN`), and its block reason comes off the map.
- A gate in a town room (the snow slide in Icefang Hamlet) works like any other; mind the town's own props
  (the hamlet's waystone moved to the lamp-fire to keep its west end clear).
- A room off Greenhollow needs its row in `ISLAND_OF_STAGE` (`src/worldmap.js`), or the map's pin lands on
  Greenhollow.
- A new den: a new theme needs its row in `dens.js`'s shared effect tables (`FXPAL`, `THEME_RGB`, `drawBit`,
  `drawFallObj`, the summon and roar colours); a boss can reuse the shared moves with its own look (`looks`).
