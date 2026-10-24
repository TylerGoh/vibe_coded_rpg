# Willowmere (room 24, `WILLOWMERE`): Greenhollow's first branch, Lv 5–15

Island depth G1 (`story/world/island-depth.md`). An easy branch up the brook path from Sprout Meadow: the
door is the mended footbridge at `WILLOWMERE_GATE_X` in the Wildwood (drawn by `drawEntries`,
`src/branch-gates.js`); the way back is `WILLOWMERE_EXIT_X` at the west end.

- Data: `WILLOWMERE_ZONES`, `WILLOWMERE_PLATFORMS`, `BUN_X` and the spawns in `src/shared/rpg.js`. Art:
  `src/willowmere.js` (the room, its own sky), `src/willowmere-art.js` (mobs, gear, icons, Bun's dress).
- West to east: The Mill (no mobs: Miller Bun, the waystone, the weir stone right under the wheel's axle,
  a Keeper stone in `src/ruins.js`), the Reedy Banks (pond frogs, dragonflies), the Millpond (gloop
  snails, Old Snapjaw). A high willow bough at the far end is the off-the-path spot. Duchess the heron
  stands in the millrace (Bun's persona knows her).
- Mobs reuse legacy brains: dragonfly = `dive`, gloop snail = `trail` with `style: 'goo'` (a lilac sticky
  puddle in `src/hazards.js`), Old Snapjaw = a field boss with the `shell` brain (hit him from behind). S5.4: with two or more slimes on him he
  also takes the `armour` party mechanic (his whole shell hardens, on top of the front cut; drawn as mossy scutes,
  `looks.shell: 'scute'`): heavy hits crack it, or wait it out (`docs/combat/bosses.md`). Alone, nothing changes.
- **Miller Bun** (`server/characters.js`): trades basic potions, the Reed Rapier and the Miller's Cap
  (`SHOPS.bun`); knows Tier 0 plus Willowmere. Music scene `willowmere` (`src/audio.js`).
