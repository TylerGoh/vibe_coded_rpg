# The Smoking Coast (room 56, `COAST`): Lv 100–115, Liv, the Landing Stone, Liv's Lookout, the Hatchkeeper (den 57)

Emberdeep's depth pass, phase E2's first piece (`story/world/emberdeep-depth.md`, "The Smoking Coast"): a branch on
the island's south shore, where the lava still runs into the sea. You reach it down the gully south off Cinder Flats
(`COAST_GATE_X` in the Caldera room). A fresh lava tongue had run down the gully (E0's gate); the update itself lifted
the block, no quest (owner's rule): `src/branch-gates.js` draws `OPEN.lavatongue` (`drawLavaTongue` with an `open`
flag, the F3 pattern: the tongue crusted hard and cold, steps cut down the middle, an iron hand-chain pegged along one
side, a last wisp of warmth). Ash's and Slag's personas say who did it (the smiths cut the steps, Slag pegged the
chain). **You come in at the EAST end** (`COAST_EXIT_X`) and walk west toward the lava, harder as you go
(`COAST_ZONES` run hard → easy by x, like the Ashwood; each zone's sign stands at its east edge). The map draws the
Drained Tubes west of the Coast, and the old tube mouth is in the west part. Don't "fix" the direction.

- Data: `COAST_ZONES`, `COAST_PLATFORMS`, `LIV_X`, `COAST_STONE_X`, `HATCH_DEN_X`, `TUBES_GATE_X` and the spawns in
  `src/shared/rpg.js`; the room and the door pair in `src/shared/sim.js`. Art: `src/coast.js` (the room, `drawCoast`),
  `src/coast-art.js` (mobs, gear, icons, Liv's look and dress; the staves and bows are rows in `src/staff-art.js` and
  `src/bow-art.js`).
- The look: a low hazy sky, the open sea to the south with **nothing on it** (no distant islands on purpose: the far
  side of the world, the sea getting wider), the island's smoke column leaning over from the north. Walls of steam
  rolling up where the flows go into the surf (`STEAM_WALLS`, biggest at the far west), pillow lava heaped in mounds,
  glowing runnels at the Lava Front, and **new black land still red in its cracks at the far west end**: the one
  place in the game where land grows. That gradient (raw and hot at the west, glittering black-glass sand at the
  east) is the point of the place.
- East to west: **the Glass Beach** (no mobs: black sand glittering with glass, Liv's shelter (a driftwood and iron
  lean-to against a boulder, its roof a platform), her stone workbench, quench tub and raft, the Landing Stone, the
  waystone, the sign back to Cinder Flats), **the Warm Surf** (iguanas, boobies), **the Pillow Shelf** (sea stacks;
  lobsters and pumice crabs) and **the Lava Front**, with the old sea cliff behind it (`drawSeaCliff`).
- **Liv's Lookout**, the find (last in `COAST_PLATFORMS`, `lookout`): the top of the tallest sea stack in the Pillow
  Shelf, reached from its shoulder (the `stack` platform before it). A row of little black-glass birds along its
  edge, copied from Old Skaldi's driftwood ones, all looking the same way (north, home), a worn sitting place and a
  tin cup. Liv hints ("the tallest stack, if you can get up it"); she wrote to Skaldi about it, not to her father.
- **The Landing Stone** (`RUIN_STONES`, shape `landing`, `src/ruins.js`): a squat old mooring stone at the top of the
  beach, rope-worn on one shoulder. Its face: a quay, barges along it loaded with toothed blocks, a line of barges
  heading out to sea with the last one empty; a tally of fives down the side, the last stroke half cut. A newer
  black-fibre rope round it with an iron ring (Liv moors her raft there). Emberdeep's tier by showing only: never the
  Tidewheel, the Stopped Hour, Chronos or Pell.
- **Waystone** `coast` on the Glass Beach (`isle: 'ember'`, `src/shared/waystones.js`).

## The Hatchkeeper (den 57, `HATCH_DEN`, The Buried Clutch, Lv 115; E2's second piece)
A big boss with a story (`story/characters/bosses.md`) and `lines`: a great black marine iguana, older than anyone,
who with a shard under her crest keeps her clutch buried in sand the lava keeps hot, warm forever, so it never
hatches and never leaves her (Eyvind and Liv's story from the other side). Her mouth is on the nesting sand at
`HATCH_DEN_X` (`drawNestingSand` in `src/coast.js` underneath, her theme's `ENTRANCE_ART` over it: a hollow in the sand
bank, steam, an egg's top at the lip, a salt-white snout looking out now and then). The door comes from her `DENS` row
through `denDoors(COAST)`.
- Art: `src/dens-hatch.js` (theme `hatch`; its rows in `dens.js`'s shared tables). The den is a cove under the old sea
  cliff: basalt columns on the west half, the open sea behind (nothing on it), black glittering sand, the clutch
  buried in a low red-cracked mound mid-den (`NEST_X`, eggs' tops showing, steam), the surf at the far east end
  (`SEA_X`). Ledges are pillow-lava slabs crusted with salt; the banner a driftwood plank on an iron chain.
- Her look (`BOSS_ART.hatchkeeper`): long, low and black, rust-red flank patches, a saw of pale spines down her back,
  a salt-crusted blunt head with amber eyes, the long tail along the sand; she rears and opens her jaw to warn, and
  sneezes salt now and then. The shard sits where `weak` puts the weak point (over the neck, in reach from the floor).
- Moves: charge, slam (her tail), rain (hot rock spat out of the sand: `drawFallObj`), beam (`looks.beam: 'brine'`, a
  snort of hot brine and salt; a `BEAM` row in `src/hazards.js`), geysers (the sand spitting lava), summon (marine
  iguanas: passive on the Coast, but minions always come for you), leap, barrage. Ultimate **Boiling Sand**: the
  `spores` ult (safe circles from the server as always), drawn by `ULT_LOOKS.hatch` as the sand going red and boiling
  everywhere but the tide-wet patches (dark wet sand with a foam lip). dens.js's `drawUltFx` checks `ULT_LOOKS[theme]`
  first: a den can give a shared ult its own look that way.
- **Freed** (`lines.freed`, then `drawHatchFreed`, run from the den's `bossDie`, which lasts `HATCH_FREED_S` for this
  theme): the eggs shake and crack one by one and the little ones run east down the sand into the surf, each with a
  splash. The den keeps the split shells on the cooled mound until she's back (`BOSS_RESPAWN_MS`). She buries a new
  clutch each time she comes back; nobody says so in the game but Liv.
- S5.4 party mechanics (`docs/combat/bosses.md`): the shard as a weak point (`weakpoint`), the nest heaving heat (a
  `pulse` with Ignis's `heat` look), and freezing Boiling Sand as it wells up cancels it (`interrupt`).
- Rewards like the Old Narwhal's: coins and Hatchling Eggshells (a few minutes of farming), the Black Crest Blade with
  its Nestfire Staff and Black Crest Bow twins, and the Clutchkeeper Helm (9 slots, a step over Liv's tier). Her pet,
  the mini Hatchkeeper, is in the Pet Shop (`PETS`).
- Music: the Old Narwhal's `narwhal` track (slot 57), on purpose: the same story, a mother holding on.
- Personas: Liv knows her as the Hatchkeeper now, saw the eggs hatch once, and won't give fighting advice; Ash names
  her level.

## The Drained Tubes (room 58, E2's third piece: `docs/places/tubes.md`)
Their way in is the old lava tube in the sea cliff at `TUBES_GATE_X`. Until they shipped it was a gate (steam roaring
out, the sea got in below and was boiling off); the update itself drained it: the `tubes` node in `EMBERDEEP` has
`rooms` and an `entry`, the door is in `ROOMS[COAST]`, and `OPEN.tubemouth` draws `drawTubeMouth`'s `open` look (old
steps going down into the dark, glassy walls, a drip). Liv's and Ash's personas say it drained.

## Liv (AI trader, `docs/social/ai-characters.md`)
Ice-Cutter Eyvind's daughter, fjord folk thinned nearly clear by seven years of heat (`folk: 'thinned'`: the fjord
palette made see-through, `THIN_PALETTE` and `drawThinFolk` in `src/coast-art.js`, read by `src/slime.js`; accessory
`glasscutter`: a leather apron with a pocket of glass flakes, the smoked-glass visor pushed up, a knapping hammer,
and **the other red mitten** tucked into her apron string; the first is on Liv's Reach, `docs/places/heights.md`).
She cuts black glass the way her father cuts ice: one clean stroke. She stayed when the Lodestar went home, and now
she's afraid the cold would set her solid, so she stays; the letters go both ways. No quest: nothing to deliver.
Tier 0 plus her corner (the Coast and its mobs, the old tube (drained now), the nesting sand she sits up with, the Landing
Stone, Forgehold's people). Shop `liv` (`SHOPS`): the basic potions and a tier aimed at Lv 108 (`aim`): the
Glasscutter's Blade, its Quenchglass Staff and Glasscutter's Bow twins, the Smoked-Glass Visor.

Personas that learned her news in the same update: Eyvind (her letter came back; asks finders, once, whether she
looks well and still has the other mitten), Skaldi (she wrote him about the glass birds), Runa, Arne ("Not your
fault, skipper"), Soot (passes the letters, knitted her the thinnest scarf), Slag (asks her about snow), Ash (the
Coast's dangers instead of the lava tongue in his shut-ways list).

## Mobs (on the frozen curve)
- marine iguana (passive, Lv 101: basks flat with its chin up when it isn't walking, sneezes salt; no brain, the
  basking is drawing only) · ashfoot booby = `dive` (`fly` 62, under the 70 px notice limit; Lv 104) · rock lobster =
  `shell` (plated front and claws: go round behind; ~124% HP like the other shell mobs; Lv 107) · pumice crab =
  `split` into two pumice crumbs (minions kept small, the economy script doesn't check them; Lv 110) · steam ray =
  `phase` (`fly` 36; Lv 113). Voices borrowed (`MOB_HURT` / `MOB_DEATH`). No elites, no field boss (the den is the
  Coast's big fight).

## Gear (`docs/combat/items.md`)
Liv's tier (Lv 104, `aim` 108): Glasscutter's Blade / Quenchglass Staff / Glasscutter's Bow, Smoked-Glass Visor. The
Hatchkeeper (Lv 116, a step over): Black Crest Blade / Nestfire Staff / Black Crest Bow, Clutchkeeper Helm. Mob
drops at their mob's level: the Pillow-Lava Helm (rock lobsters), Scaldbarb / Scaldbarb Staff / Scaldbarb Bow (steam
rays). Materials from every mob (iguana crest spine, ashfoot feather, rock lobster claw, pumice stone, steam ray
barb). Ids checked unique across `ITEMS`. Names in Emberdeep's register (black glass, basalt, iron; "Black Glass ..."
was already the Black Sands' cutlass, so Liv's are the Glasscutter's).

## Decisions and history
- 2026-10-28: built as E2's first piece. Liberal decisions (owner's standing instruction): east entry (the map puts
  the Tubes west), zone names, the Glass Beach as the hub, the Landing Stone's rope and ring (Liv's raft), the
  lookout's birds facing north, the Tubes' block (steam from the sea getting in, lifted by "drained"), the open-sea
  sky with no islands, the `thinned` folk look, the red mitten on her apron string, gear names.
- Not playtested (owner's rule: no headless bot tests): checked by a build, the economy sheet and reading the code.
- Music scene `coast` (`docs/ui/audio.md`).
- 2026-10-28: the Hatchkeeper's den (E2's second piece). Liberal decisions: the den as an open cove with the surf at
  its east end (so the hatchlings have somewhere to run), the name The Buried Clutch, her brine snort and lava-spitting
  sand, the shells staying till she's back, reusing the `narwhal` track, Liv having seen a freeing once. Not
  playtested: the sheet solos her in a median ~15:20.
