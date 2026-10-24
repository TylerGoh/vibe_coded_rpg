# The Old Oak Canopy (room 31, `CANOPY`): Lv 25–40

Island depth G3 (`story/world/island-depth.md`). The treetops above Bramble Woods. The way in is the rope
ladder at `CANOPY_GATE_X` in the Wildwood, restrung (`drawEntries`, `src/branch-gates.js`: new rope and
rungs pegged down, the rotten old one coiled beside it, Acorn's bread basket on its pulley); you arrive at
the Canopy's WEST end (`CANOPY_EXIT_X`, the ladder back down) and go east, higher and harder.

- Data: `CANOPY_ZONES`, `CANOPY_PLATFORMS`, `ACORN_X`, `SPINE_GATE_X` and the spawns in `src/shared/rpg.js`;
  the room in `src/shared/sim.js`. Art: `src/canopy.js` (the room), `src/canopy-art.js` (mobs, the Hornet
  Queen, gear, icons, Acorn's dress).
- **A wide room, not a tall one** (the plan's rule): rooms have a fixed ground and the camera doesn't scroll
  up, so the floor is the Great Bough (an oak limb as broad as a road, the leafy depths drawn under it) and
  the "height" is side boughs and rope bridges at three heights, with trunks running off the top of the
  screen. A vertical camera would be its own `step()`/camera project.
- West to east: the Treehouse Camp (no mobs: Ranger Acorn's treehouse, its roof a platform; a waystone; the
  Lifted Stone, a Keeper stone the oak grew round and lifted, in `src/ruins.js`), the Squirrel Boughs, the
  Owl Hollows (shadier, eyes blinking in the knotholes) and the Wasp Crowns (golden light, paper nests in the
  far leaves). Through gaps in the far leaves you see the sea and the far islands (`drawDistantIslands`).
- **Keeper's Spine**: from the Owl Hollows on, its bare grey ridge with standing stones rises over the
  leaves (`drawSpine`), and at the far end the fallen trunk across the high path has a passage sawn through
  it (G5: the `trunk` entry in `GREENHOLLOW`, `src/shared/branches.js`; `docs/places/spine.md`).
- The **Crow's Nest**, a wicker lookout high over the Owl Hollows (last in `CANOPY_PLATFORMS`), is the
  off-the-path spot: a flag, a spyglass pointed at the Spine and a golden acorn.
- Mobs reuse legacy brains: oak squirrel = `lob` (`style: 'acorn'`), tent caterpillar = `trail` (`style:
  'silk'`, a sticky white web), flying squirrel = `blink` (glides round behind you), tawny owl = `dive`,
  wasp nest = `split` into three wasps (minions), hornet = `lob` from the air (`style: 'sting'`). Styles
  are drawn in `src/hazards.js`. Wasp nests are `anchored` (hits don't knock them along the bough; before
  that, a few swings pushed them out of reach).
- **The Hornet Queen** (field boss, Lv 38, small: no story): roams the Wasp Crowns on the `dive` brain,
  passive until hit, the usual field-boss rules (`docs/combat/stages.md`). Her pet is the Mini Hornet Queen.
- Fliers only pick a target within 70 px of their height (`stepMob`), so owls and hornets hover low
  (`fly` ≤ 66) to notice slimes on the bough; the queen hovers higher and is passive anyway.
- **Ranger Acorn** (`server/characters.js`): trades basic potions, mega elixirs, the Ranger's Billhook, the
  Oakbranch Staff, her own Ranger's Longbow and the Ranger's Hat (`SHOPS.acorn`); since S4 she's the archers'
  trader (owner's plan), a good shot herself (at targets, never a nest), and passes on the basics of the
  class in chat (DEX, distance, Retreat Shot, nets); knows Tier 0, the Canopy's creatures and nests, the trunk across the
  path to the Spine, cut through now (not why it's called that; she's been up as far as the first standing
  stones), and that the oak lifted the old stone; nothing else of the
  lore. Her life: hasn't touched the ground in six years, Zip the hat-stealing flying squirrel, knitted
  hats for the squirrels, Professor Hoot the owl, her logbook (volume nine). Music scene `canopy`.
