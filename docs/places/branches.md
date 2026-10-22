# Greenhollow's branches: blocked ways in and the island map

The island depth plan (`story/world/island-depth.md`) grows Greenhollow to Lv 1–60 with side areas
("branches") off the main trail. Phase G0 laid every branch's entrance before any of them exists, so the
island shows what's coming.

- Data: `GREENHOLLOW` in `src/shared/branches.js`. It holds every place on the island map: the towns, the
  three Wildwood zones, the cliffs and the eight branches, each with its band, `hard` for hard pockets,
  the node it hangs off (`from`) and where it sits on the map (`at`). `ISLAND_MAPS` says which islands
  have a map (Greenhollow only; Frostpeak's comes with its depth pass).
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
- The island map (`docs/ui/world-map.md`) reads the same list: shipped places solid with their levels,
  the rest dashed with a short `block` reason. Keep both in step: a node's `block` should match its gate.

## Shipping a branch: the checklist (from G1–G5, for Frostpeak's pass)
Each phase so far touched the same places. Work in a dev copy (`Agent.md`); the Mycelium Deep (G2) is the
fullest example, the Canopy (G3) the last with a trader, G5's Spine the latest (a den, no trader).
- **Data, `src/shared/rpg.js`:** a room id (the next free number below `HOUSE_BASE`: 36 after G5; ids 27,
  31–35 are the Pet Shop, the Canopy, Wreck Cave, the Thornheart, the Spine and the Warden's den), `*_W`, `*_EXIT_X`, the way in's x in the parent room (`*_GATE_X`,
  where the gate stood), the trader's x, `*_ZONES` (the first one a mob-free hub, `lvl: null`),
  `*_PLATFORMS` (put the hidden spot last), a `STAGES` row (`band`, `pill` if the name is long, `hard` for
  a hard pocket), mobs **appended** to `MOBS` (kinds go over the wire as their index), spawns (an
  `onRoomPlat` helper), a `DENS` row for a den, `ITEMS` (materials; gear with `lvl`; trader gear with
  `aim`), a `SHOPS` row.
- **`src/shared/sim.js`:** import and re-export the room id, the door in the parent room (its level chip
  comes from `STAGES` by itself), `ROOMS[id]`, the `NPCS` entry, `SLAP_QUIPS`. **`branches.js`:** the node
  gets `rooms` and an `entry`, loses its `gate`; children's gates move into the new room. **`waystones.js`:**
  a stone in the hub (not in hard pockets). **`house.js`:** `PETS` for any boss or field boss.
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
- **Greenhollow is done** (G0–G5). Next on the G track is R, the rebalance, then Frostpeak's depth pass
  (`story/world/island-depth.md`): `ISLAND_MAPS` gets a Frostpeak list, and its unshipped branches get gates
  here the same way (`past: true` for a place behind another unshipped one).
- A new den: a new theme needs its row in `dens.js`'s shared effect tables (`FXPAL`, `THEME_RGB`, `drawBit`,
  `drawFallObj`, the summon and roar colours); a boss can reuse the shared moves with its own look (`looks`).
