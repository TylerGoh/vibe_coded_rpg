# The Keepers' Gardens (room 85, `GARDENS`): Lv 145–152, the Citadel's easy pocket

The Citadel's depth pass, C0 (`story/citadel-plan.md`; room 13 and its gates: `docs/places/citadel.md`). Up the brass
spiral stair off Cogwork Bastion (`GARDENS_GATE_X`, drawn open from the start: `gardenstair` in `src/citadel-gates.js`):
the Keepers' roof gardens, open to the wind under a high bright sky. Dead beds of grey soil in brass-edged boxes with a
blank brass label each, pergolas with nothing climbing them, a dry fountain whose spout still turns, plinths along the
parapet that have mostly lost their statues (two brass feet left), the whole archipelago tiny far below. Kept, and
nothing grows. Easy and quiet on purpose: for alts and for sitting.

Files: the room in `src/shared/rpg.js` (`GARDENS`, `GARDENS_W`, `GARDENS_EXIT_X`, `GARDENS_ZONES`, `GARDENS_PLATFORMS`, the
`STAGES` row, the three mobs, their materials and spawns), `ROOMS[GARDENS]` and its door in `ROOMS[CITADEL]`
(`src/shared/sim.js`), the drawing in `src/gardens.js` (`drawGardens`, its own sky and the distant islands), the mobs, icons
in `src/bastion-art.js`, the `gardens` music scene in `src/audio.js` (`docs/ui/audio.md`).

## The room
You come in at the WEST end. West to east (`GARDENS_ZONES`):
- **The Stair Head** (no mobs): the top of the brass stair, its rail curling down out of sight.
- **The Dry Beds** (145–148): raised planters, the broken pergola; gardener drones and seed moths.
- **The Fountain Court** (148–152): the dry fountain (a platform, its rim), the second pergola; hedge shears, seed moths, a drone.
- **The Wind Terrace** (no mobs): the roof stops at a balustrade over the drop; a stone bench worn smooth where people sat
  (a platform), a brass telescope pointing down at the islands, its cap left off. The place to sit and chat.
- **The find** (last in `GARDENS_PLATFORMS`, `urn`): on the broken pergola's post, high up, a cracked stone urn with a sapling
  in it, the one living thing in the gardens, a faint green light about it. Its leaves are shaped like the apple tree's in
  Slimeville and nothing says so (the Heartroot is Tier 4: shown, never named).
- No waystone (the Bastion's is at the stair's foot), no trader (the Commissary is beside the stair), no elites, no boss.

## Its mobs (on the frozen curve)
- **Gardener drone** (146): a little brass watering can on four whirring vanes, a rose nozzle on a crane neck, sprinkling
  soil where nothing grows. A passive flier (`fly` 40): it minds you only when hit. Material: the Brass Nozzle.
- **Seed moth** (148): a paper-white moth of brass wire and seed-fluff whose wings tick open and shut like a clock. Comes at
  you (`fly` 36). Material: Seed-Fluff (no seeds in it).
- **Hedge shears** (151): a pair of topiary shears walking on their handles, blades up, a gearbox at the pivot with one
  lens. Passive, armoured in front (`shell` with `cut`, the lamp crab's): hit them from behind. Material: the Shear Pin.
- Their voices are borrowed (the sentry drone's, the cinder bat's, the cogling's).

## Decisions and history
- 2026-11-13: built in C0 (every plan default). The gardens are open from the start (no gate ever laid): the plan's C0
  ships them, so the stair is an `entry` from day one. **Not played by anyone yet.**
- No gear drop: the Bastion's Commissary sells the tier for this band, and the Siege Engine drops a step over it.
