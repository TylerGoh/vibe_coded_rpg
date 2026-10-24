# Keeper's Spine (room 34, `SPINE`): Lv 45–60, and the Root Warden (den 35)

Island depth G5 (`story/world/island-depth.md`), the last of Greenhollow's branches: the bare stone ridge
along the top of the island, above the Old Oak Canopy. The way in is the fallen trunk at the Canopy's far
end (`SPINE_GATE_X`), sawn through now (`OPEN.trunk` in `src/branch-gates.js`: a passage cut clean through,
the block rolled aside, steps notched up the far side). You arrive at the Spine's WEST end (`SPINE_EXIT_X`,
the cut trunk from this side) and go east along the Keepers' road, higher and harder.

- Data: `SPINE_ZONES`, `SPINE_PLATFORMS`, `WARDEN_DEN_X` and the spawns in `src/shared/rpg.js`; the room in
  `src/shared/sim.js`. Art: `src/spine.js` (the room), `src/spine-art.js` (mobs, gear, icons),
  `src/dens-spine.js` (the Warden's Court, its gatehouse, the Root Warden, the roots of Hold Fast).
- High, bright and windy: clouds blowing past at your height, the sea far below on every side with the far
  islands on it (`drawDistantIslands`), the Canopy's treetops dropping away in the west, heather petals on
  the wind. Grey-lilac stone like the ridge the Canopy shows over its leaves (`drawSpine` in `src/canopy.js`:
  keep the two alike). West to east: the Windgap (no mobs: a waystone and the Road Stone), the Heather
  Slopes (rock outcrops), the Standing Stones (trilithons, their lintels the platforms) and the Warden's
  Crest (ruined Keeper walls, great roots running east along the road, golden late light), where the road
  ends at a ruined gatehouse into the Root Warden's court.
- **The Road Stone** (`RUIN_STONES`, shape `road`, in the Windgap): a Keeper milestone. Tier 1 only: "the
  high road, keep it", the Warden "holds the gate until we come again", and a carved root runs under the
  road off the stone's west edge, toward the village (the quiet Heartroot hint; it agrees with the Root
  Stone in Bramble Woods and the Hedge Stone's "planted to keep the road", `docs/places/thornheart.md`).
- **The Watch Seat**, a stone seat carved on a capstone stacked over the middle trilithon (last in
  `SPINE_PLATFORMS`), facing the sea, a cairn of visitors' pebbles on it, is the off-the-path spot.
- No trader and no character (owner's "make liberal decisions": the Spine is empty stone and wind; the
  Keepers are the people here, through their stones and the Warden). Ranger Acorn's persona knows the trunk
  is cut and has been up as far as the first standing stones.
- Mobs reuse legacy brains (all on the frozen curve): moss turtle = `shell` (a mossy brow-plate in front:
  hit it from behind), crag kite = `dive` (`fly` 62: under the 70 px notice limit), stone sentinel =
  `beam` (`style: 'warden'`, Keeper amber; slow, stays on the road), gale sprite = `phase`, rootling =
  `blink` (dives underground and comes up behind you). No elites (not a hard pocket) and no field boss: the
  party den is the danger. Gear (drops only): the Mossback Helm and the Sentinel Blade (and its twin,
  the Sentinel Staff: the first mob-drop sword with a staff twin).
- Waystone in the Windgap (`docs/places/waystones.md`). Music scenes `spine` (A dorian, a horn over open
  fifths and wind) and `warden` (`docs/ui/audio.md`).

## The Root Warden (The Warden's Court, den 35)
Greenhollow's **party den** boss (Lv 60; the island's second-strongest, after the final boss to come: `story/final-bosses.md`), a big boss with a story (`story/characters/bosses.md`): a Keeper
guardian of grey stone the roots have grown through, still holding the sealed gate at the end of the road.
Its `lines` are a sentry who has forgotten every word but "hold"; freed, it lets the roots have it and
the gate stays shut, but the road is yours. No world change after a kill (like the Tidemother and the
Knotmole: only its line says so).
- Moves: slam, its eye **beam** (low or high, like the Colossus's, drawn in Keeper amber), charge; phase 2
  adds the root **grid** (roots heaving the floor tiles up, `style: 'root'`), summons (rootlings) and
  **echo** slams; phase 3 adds barrage (falling Keeper stones) and leap. `looks` on its `MOBS` entry
  picks how the shared beam and grid moves are drawn (`server/rpg.js` reads it; the Colossus and Chronos
  keep their defaults). Its ultimate **Hold Fast** is the shared `lanes` ult drawn as roots bursting up
  through every lane but one (`wardenRoot`, used by `fxLanesWarn` / `fxLanesHit` in `src/dens.js` when the
  theme is `warden`).
- **Built for the party mechanics** (`story/progression.md`, S5): party dens are meant to be extremely hard
  without a mixed party. `party` on its entry names what S5 switches on (focus, pulse, barrier, weakpoint,
  adds); nothing reads it yet. The art already has the weak point: the Anchor shard glowing high in its back.
- The den: an open court at the very top of the ridge, sky all round, a broken colonnade (the ledges are
  fallen lintels), flagstones heaved up by roots, and in the far wall the **sealed gate**: a round stone
  door with a ring of pictures like the Roll of Keepers (the hourglass scratched out), roots holding it shut
  like fingers, a faint warm light round its edge. It never opens.
- Loot: the Warden's Greatblade (or its twin, the Warden's Rootstaff) and the Wardenstone Helm, on the
  frozen curve a step above the Spine's mob gear; its pet is the mini Root Warden (`PETS`, priced between
  the Thorn Hart's and the Colossus's; `PETSHOP_W` was raised for it).
