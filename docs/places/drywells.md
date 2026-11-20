# The Dry Wells (room 109, Lv 244–250, the deep room) and the Shell Road (room 110, the approach)

Atlas Phase 9, A5 (b) (`story/a5-plan.md`; the room above is `docs/places/stormroad.md`, the den past it
`docs/places/carapace.md`). Amberdune's way to its final boss, the way the other islands' go: down through the darkest
pocket, the deep room, then an approach. Shipped together with the fight, A5 (c), so the climb never held.

Files: the rooms in `src/shared/rpg.js` (`DRYWELLS`, `DRYW_W`, `DRYW_EXIT_X`, `DRYW_END_X`, `DRYW_CUP_X`, `DRYW_ZONES`,
`DRYW_PLATFORMS`, the `STAGES` row (`hard`), `DUNE_TOP`, the four mobs, their three elites, the Seventh Digger, their
materials and the rare helm, the spawns; `SHELLROAD`, `SHELL_W`, `SHELL_EXIT_X`, `CARAPACE_MARK_X`, `CARAPACE_DEN_X`,
`CARAPACE_LINE`), `ROOMS[DRYWELLS]`, `ROOMS[SHELLROAD]` and the well's door in `ROOMS[STORMROAD]` (`src/shared/sim.js`; the
climb is the den's door, `denDoors(SHELLROAD)`), the Dry Wells' drawing in `src/drywells.js` (`drawDryWells`), the creatures,
the helm and the icons in `src/drywells-art.js` (`DRYW_MOB_ART`, `DRYW_HELMETS`, `DRYW_ICONS`; Old Carapace's sword and crown
too, `DRYW_SWORDS`), the Shell Road in `src/shellroad.js` (`drawShellRoad`, `drawShellRoadFront`, `shellDepth`, `say`), the
way in (`drawDryWell`'s open look in `src/branch-gates.js`), the dust drinker's grit (`grit` in `SHOT`, `src/hazards.js`),
the line in `server/rpg.js`, the `drywells` and `shellroad` music scenes in `src/audio.js`.

## The way in
A4 laid the gate on the Storm Road's Red Rise: the old well's mouth under an iron grating, chained down and padlocked, the
caravan's tally-mark on the lock (the rule the mothers made: nobody goes down, since seven went down to dig it deeper when
it failed and never came up). **A5 opened it** (the update did it, no quest): the chain cut and coiled beside it, the
grating swung back, and **Asra's rope ladder** hanging down into it, one of her blue beads on the bottom rung (she went to
look at last, and Mother Dune let her: `drawDryWell`'s `open` flag, `OPEN.drywell`). The node (`drywells`) has both rooms as
`rooms` and an `entry`; the door at `DRYWELL_GATE_X` climbs down.

## The Dry Wells
Hard-pocket rules: elites throughout, no waystone, no trader. West to east (`DRYW_ZONES`), darker going east (a dark wash in
screen space):
- **The Well Foot** (no mobs): the bottom of the old well, a round of red-gold daylight far overhead and Asra's ladder down
  out of it.
- **The Cisterns** (244–246): vaulted cisterns dry an age, the high-water mark far up the walls, buckets hanging on rotten
  ropes from the vaults; fallen well-head stones (`stone` platforms) and the vaults' shelves (`shelf`).
- **The Tally Galleries** (246–248): tally marks on every wall, seven and a stroke through, thousands, the days without
  rain; old bucket-beams across the shafts (`beam`), their pulleys still on them. Old well-shafts go up through the vaults
  to small rounds of daylight, a beam of light with dust in it under each.
- **The Deep Cistern** (248–250): the darkest. **The find**: high on a ledge (`DRYW_CUP_X`, last in `DRYW_PLATFORMS`), a tin
  cup full of sand, seven tally marks scratched beside it and an eighth begun. Asra brought one like it up (her persona).
- **The dry spring** at the east end (`DRYW_END_X`): a cleft going up through the rock to a slot of dusk sky, steps worn in
  it by water an age gone. It climbs out onto the Shell Road.

## Its mobs (on the frozen curve: `docs/economy.md`)
- **Dry striders** (244): the cisterns' water striders from when there was water, a small dusty body slung between six long
  legs, the pads at their feet for walking on water (quick chasers). Elite: **the Old Strider**.
- **Bucket mimics** (246): the wells' old buckets gone hungry, iron-bound, a mouth where the water went, their rope's end
  trailing; they hop and slam down (`stomp`); the rare **Bucket Helm** (Lv 246). Elite: **the Great Bucket**.
- **Tally wraiths** (248): the dust of the seven diggers, hooded, a pick over the shoulder, scratching tally marks that hang
  in the air a moment; they fade and come back with a pulse (`phase`).
- **Dust drinkers** (250): old goatskin water-bags gone alive and bone dry, cracked like old leather, spitting packed grit
  (`lob`, shot style `grit`). Elite: **the Last Waterskin**.
- **The Seventh Digger** (a named elite of the tally wraiths, at the Deep Cistern's far end): the last of the seven, tall,
  a broad digger's hat, a great pick, tally marks scratched all over his coat; still digging for water. He brings the pick
  down where you stand (`stomp`). No gear of his own.

## The Shell Road (no mobs, no combat; no `STAGES` row)
The approach, drawn in `src/shellroad.js` (never `step()`, never a cutscene). Up out of the dry spring onto the open desert at
dusk: dunes for ever, the sky violet over orange, the sun going down behind you, first stars, the storm's red smear far off
south-east. How far east you are (`shellDepth`: 0 at the way in, 1 at the climb) sets everything:
- **Old Carapace walks past**: first a hill on the horizon, then nearer at every step, a shell like a sky with the empty
  town on top of it, four slow legs, the head out ahead looking east, dust under him; at the far end one great foreleg is
  planted in the sand in front of you.
- **His footfalls** get slower and heavier the nearer you are (`STEP_FAR` to `STEP_NEAR`): on each one the view jolts and
  dust jumps off the dunes. The `shellroad` music takes `shellDepth` (`audio.setDepth`): a wide held pad and a long horn
  call, his footfalls coming in under them and getting heavier.
- **His line** at `CARAPACE_MARK_X` (the first slime past it in an empty Shell Road hears it, the Spoke's pattern): "Who is
  that, down there? ...Come up, then. Come up. We have a long way to go." A bubble out of the dusk above
  (`drawShellRoadFront`).
- **The climb** (`CARAPACE_DEN_X`): his near foreleg, thick as a tower, its scales stepped like a stair going up into the
  shell's shadow, the sand heaped round the foot. The door goes up onto his back, the Long Road. Its sign: the den's name,
  both levels (`finalTag(DUNE_TOP)`) and a live count ("3 here, 4+ recommended"); the HUD pill counts slimes on the road.

## Decisions and history
- 2026-11-20: built at the owner's "continue with next two phases" (A4 and A5; every plan default). **Not played by anyone
  yet**; checked by a build, the sheet, a headless run of the drawing and reading the code.
- Liberal decisions: Asra as the one who cut the chain (Mother Dune let her); the four mobs and the Seventh Digger (no gear:
  the deep room's named elite needn't have a set); the cup on the ledge; the Shell Road at dusk with the storm in the sky.
