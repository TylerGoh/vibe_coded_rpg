# Greenhollow's branches: blocked ways in and the island map

The island depth plan (`story/world/island-depth.md`) grows Greenhollow to Lv 1–60 with side areas
("branches") off the main trail. Phase G0 laid every branch's entrance before any of them exists, so the
island shows what's coming.

- Data: `GREENHOLLOW` in `src/shared/branches.js`. It holds every place on the island map: the towns, the
  three Wildwood zones, the cliffs and the eight branches, each with its band, `hard` for hard pockets,
  the node it hangs off (`from`) and where it sits on the map (`at`). `ISLAND_MAPS` says which islands
  have a map (Greenhollow only; Frostpeak's comes with its depth pass).
- **A branch that hasn't shipped has a `gate`**: the blocked way in, in a real room (the room and x, the
  kind of art, the prompt, and what E says). Gates are drawn by `src/branch-gates.js`: Willowmere's
  washed-out footbridge (Sprout Meadow), the rockfall on the shore path (the harbour's west end), the
  Mycelium Deep's root-choked stump (Mushroom Grove), the Old Oak Canopy's rotten rope ladder (Bramble
  Woods, before the ruins) and the Thornheart's wall of thorns (the mob-free end of Bramble Woods). Each
  has a small sign with the place's name (red-trimmed for a hard pocket).
- Places behind another unshipped one (Wreck Cave, Glowroot Hollow, Keeper's Spine) have `past: true`
  and no gate: their way in will be in a room that doesn't exist yet.
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
- The island map (`docs/ui/world-map.md`) reads the same list: shipped places solid with their levels,
  the rest dashed with a short `block` reason. Keep both in step: a node's `block` should match its gate.

## Shipping a branch: the checklist (from G1–G3, for G4, G5 and Frostpeak's pass)
Each phase so far touched the same places. Work in a dev copy (`Agent.md`); the Mycelium Deep (G2) is the
fullest example, the Canopy (G3) the most recent.
- **Data, `src/shared/rpg.js`:** a room id (the next free number below `HOUSE_BASE`: 32 after G3; ids 27
  and 31 are the Pet Shop and the Canopy), `*_W`, `*_EXIT_X`, the way in's x in the parent room (`*_GATE_X`,
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
  Lv 38 Hornet Queen's pet had to go above Lv 36 Ignis's.
- **A gate's `says` must fit the toast** (it doesn't wrap): under about 90 characters.
- **3/4 music scenes need `beats: 3, melSteps: 6`** as well as `spb: 6`.
- The island map's "you are here" label moves beside the pin when a card sits right above (`drawPin`).
- Testing: a fresh test account is Lv 1; copy a mid-level character's row from a copy of the accounts DB
  into the test DB's `rpg_chars` to fight. In a test script, a second Esc opens the menu and eats later
  key presses.

## The next phases' loose ends (where things already are)
- **G4:** Wreck Cave's gate is in Saltspray Coves (`flooded`, x 130); the Thornheart's in the Wildwood
  (`thorns`, x 4920, the mob-free end of Bramble Woods). Both are hard pockets: `elite()` for their elites,
  `hard: true` on their `STAGES` rows (the red chip and sign follow). The Drowned Bosun is a small field boss.
- **G5:** Keeper's Spine's gate is the fallen trunk at the Canopy's far end (`SPINE_GATE_X`). Its door goes
  there, with an `OPEN.trunk` (the trunk cut through or rolled aside). The Canopy already draws the Spine
  over the leaves (`drawSpine` in `src/canopy.js`: a bare grey ridge, standing stones on the crest): keep
  the Spine's own art in step. It gets a waystone (`docs/places/waystones.md`) and the capstone den, the
  Root Warden (a big boss: `lines` and a story in `story/characters/bosses.md`).
