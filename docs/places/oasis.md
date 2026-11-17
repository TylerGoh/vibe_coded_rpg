# The Mirage Oasis (room 103, Lv 215–220)

Atlas Phase 9, A1 (`story/phase9-plan.md`). Amberdune's easy pocket, down the side path off the Glass Dunes' Wind Shelves
(`docs/places/glassdunes.md`). Palms round a still pool, and in the pool **a different sky**: green and grey, with rain
falling in it, though not a drop falls here. Nobody knows whose sky it is. Good for newcomers and for sitting about.

Files: the room in `src/shared/rpg.js` (`OASIS`, `OASIS_W`, `OASIS_EXIT_X`, `OASIS_POOL_X`, `OASIS_PALM_X`,
`OASIS_ZONES`, `OASIS_PLATFORMS`, the `STAGES` row, the spawns), `ROOMS[OASIS]` and its door in `ROOMS[GLASSDUNES]`
(`src/shared/sim.js`), the room's drawing in `src/oasis.js` (`drawOasis`), the carved palm in `src/ruins.js`, the `oasis`
music scene in `src/audio.js`. The sky is Caravanserai's (`drawDuneSky`, without the walking hill).

## The room
West to east (`OASIS_ZONES`):
- **The Slip** (no mobs): the sand sliding down into the hollow from the dunes above, a line of footprints.
- **The Palms** (215–218): date palms, red sandstone boulders, palms whose crowns spread flat enough to stand on (the
  `frond` platforms).
- **The Still Pool** (218–220): grass and reeds round the water; in the pool the green sky and its rain, rings spreading
  on the water where nothing is falling (`OASIS_POOL_X`).
- **The Far Shade** (no mobs): **the carved palm** (`OASIS_PALM_X`, read with E; a reading, not a Keeper stone): a date
  palm cut all over in small letters, old grey cuts and fresh ones, stories of rain with their details wrong and other
  hands correcting them ("You cannot climb them. It is water, in drops."), and a water-skin and a cup left hanging for
  whoever stays to talk. It's Asra's, though she'd never say so (`docs/places/amberdune.md`).
- **The hidden spot**: the tallest palm's crown (last in `OASIS_PLATFORMS`), a weaver bird's empty nest in it.
- No waystone (it's beside the Dune Gate's, like Firefly Hollow by the Shallows'); its mobs are the Glass Dunes' skippers
  and mirages, and a dune beetle or two by the pool. No new mob.
