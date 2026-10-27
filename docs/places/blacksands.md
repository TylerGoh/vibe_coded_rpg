# The Black Sands (room 54, `BLACKSANDS`): Lv 90–100, the Bellower, the Kettle, the Turning Stone

Emberdeep's depth pass, phase E1 (`story/world/emberdeep-depth.md`, "The Black Sands"): an easy pocket, the beach
west of Forgehold's quay, out along the beach path past Auntie Soot's springs. The geyser that broke out across
the path (E0's gate) has gone quiet: `src/branch-gates.js` draws `OPEN.geyser` (`drawGeyser` with an `open` flag,
the F3 pattern: the old hole crusted with sulphur, a wisp of steam, flat stones laid across, the rope and stakes
pulled up and left lying). The update itself lifted it, no quest (owner's rule); Slag laid the stones (his
persona says so). **You come in at the EAST end** (`SANDS_EXIT_X`; Forgehold lies east) and walk west, deeper
and harder, so its zones run hard → easy by x (`SANDS_ZONES`), like the Whale Skerries. Don't "fix" this.

- Data: `SANDS_ZONES`, `SANDS_PLATFORMS`, `SANDS_STONE_X`, `SANDS_VENT_X` and the spawns in `src/shared/rpg.js`;
  the room and the door pair (Forgehold's at `SANDS_GATE_X`) in `src/shared/sim.js`. Art: `src/blacksands.js`
  (the room, `drawBlackSands`), `src/blacksands-art.js` (mobs, gear, icons; the staves and bows are rows in
  `src/staff-art.js` and `src/bow-art.js`).
- Warm and open, the one easy place on a hard island: an ash-hazed afternoon, a pale sun over the warm green sea
  to the west, far sea stacks with steam round their feet, the other islands far off to the north, the island's
  smoke column leaning in from the east. Black sand glittering wet, hot green pools rimmed with sulphur, and
  little geysers that puff and now and then spout (drawing only: a geyser that throws you would be a `step()`
  job, not planned).
- East to west: **the Beach Path** (no mobs: path stones, the Turning Stone, the sign back to Forgehold), **the
  Warm Shallows** (basalt boulders, hot pools; crabs and steam toads), **the Stacks** (columns of jointed basalt
  standing in the shallows; scald eels and frigatebirds) and **the Bellowing Vent**, a great yellow-crusted mound
  steaming against the black cliffs at the west end, where the Bellower squats. Each zone's sign stands at its
  east edge (you walk in from the east).
- **The Kettle**, the find (last in `SANDS_PLATFORMS`, on the tallest stack, reached up from the stack beside
  it): a little hot pool cupped in the top of the stack, two tin mugs with red bands left on its rim, one
  tipped over. Nobody's persona says whose they are; Soot says she doesn't climb.
- **The Turning Stone** (`RUIN_STONES`, shape `turning`, `src/ruins.js`): a round Keeper stone stood on its edge
  like a millstone on a plinth of black rock by the path. A dial: islands in a ring round the rim, close at the top
  with one road through them, scattered at the bottom with waves between, little arrows all round pointing the
  same way, and a gear in the middle with one long tooth reaching to the top. A ring of pebbles at its foot (close
  on one side, spread on the other) that someone lays again every morning. Emberdeep's tier by showing only:
  never the Tidewheel, the Stopped Hour, Chronos or Pell. Ash knows it's there and doesn't pretend to know more.
- No trader (Soot is next door), no waystone (the town's is a short walk), no elites (not a hard pocket).

## Mobs (on the frozen curve)
- black-sand crab (passive, Lv 91) · steam toad = `trail`, `style: 'steam'` (puffs of scalding steam where it's
  been: `drawSteamPuff` in `src/hazards.js`; Lv 93) · scald eel = `phase` (ducks into a pool, only a boiling
  ring and its fin showing, and comes up in a scalding pulse; Lv 95) · frigatebird = `dive` (`fly` 62, under the
  70 px notice limit; Lv 97). Their voices are borrowed (`MOB_HURT` / `MOB_DEATH` in `src/audio.js`).
- **The Bellower** (field boss, Lv 100): a steam toad the size of a hut, black sand caked on its back, sulphur
  warts the size of buckets, a throat sac that swells and booms, steam pouring off it. Small boss, no story (a
  name, a look, a line: its `desc`). Passive until hit; then `stomp` (it heaves itself up and lands with a
  shockwave along the beach: jump it or stand on a boulder). S5.4: with two or more on it, `armour` (the sand on
  its back bakes into basalt plates, `looks.shell: 'cinder'`, Ignis's look reused) and `focus`
  (`docs/combat/bosses.md`). Drops the Bellower's Maul (with its staff and bow twins) and the Toadstone Helm.
  Its pet is in the Pet Shop (`PETS`; `PETSHOP_W` went up to fit it).

## Gear (`docs/combat/items.md`)
Mob drops: the Basalt Helm (crabs), the Black Glass Cutlass / Black Glass Staff / Black Glass Bow (frigatebirds).
The Bellower: the Bellower's Maul / Bellower's Staff / Bellower's Bow and the Toadstone Helm. All on the frozen
gear curve at their `lvl`; materials from every mob (the crab's claw, the toad's sulphur wart, scald eel skin,
the frigatebird's plume, the Bellower's toadstone). Item ids must be unique across `ITEMS`: the eel's skin is
`scald_skin` because the Grotto's ice eel already has `eel_skin`.

## Decisions and history
- 2026-10-27: built as E1's first half (the Ashwood is the second). Liberal decisions (owner's standing
  instruction): zone names, the Bellowing Vent, where the Kettle and the stone stand, the Bellower's party
  mechanics (armour and focus, like Old Rimehorn's stomp), Slag laying the stones, and the gear names.
- The plan's hot-spring herb for the alchemy lab was left out: a crop needs seeds, art, a recipe and economy rows,
  not cheap enough for this phase (`docs/places/alchemy.md`).
- Personas that changed: Ash (the Black Sands' dangers instead of the geyser in his shut-ways list), Soot (the
  path is open again), Slag (he laid the stones).
- Not playtested (owner's rule: no headless bot tests): checked by a build, the economy sheet and reading the code.
- Music scene `blacksands` (`docs/ui/audio.md`).
