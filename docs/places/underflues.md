# The Under-Flues (room 63, `UNDERFLUES`) and the Long Flue (room 64, `LONGFLUE`)

E5 (b): the way to Emberdeep's final boss, Typhon, the Buried Fire (`story/e5-plan.md`, "On the way there"; the
pattern is FB2's `docs/places/oldice.md` and FB1's `docs/places/sunkenroad.md`). Deep room, then approach, then den
(room 65, `TYPHON_DEN`, `TYPHON_DEN_NAME` "The Hearth", kept for E5 (c)).

## The way in (the Old Foundry gets better)
- **The fallen pit:** the back of the Old Foundry's biggest casting pit, at the Casting Floor's west end, has fallen
  in (the update did it, no quest), and under the half-cast tooth a brick flue runs down, hot air coming up it, the
  stokers' old ladder pegged down its throat (`UNDERFLUES_GATE_X`; `OPEN.flue` in `src/branch-gates.js`, a red-trimmed
  "The Under-Flues" sign). On the island map it's one node, `underflues`, under the Foundry (`EMBERDEEP` in
  `src/shared/branches.js`; both rooms are its `rooms`), and (until E5 (c)) the den's node, `hearth`, blocked ("the door
  holds").
- **The stoker's ledger** (`RUIN_STONES` in `src/ruins.js`, shape `ledger`, at `FOUNDRY_LEDGER_X`): the Foundry's
  second find, a reading with E like the tally board (`wing` / `when`). The stokers' own book, open on a stool by the
  flue's mouth: the shifts that fed the fire from below, entries getting shorter, the last one alone on a clean page:
  "IT BREATHED BACK. WE CAME UP." A shovel leans on the stool. Tier 3 stays out (no Typhon, no Keepers named).
- **Hot grates** (the Foundry's room hazard, like the Thornheart's thorn patches and the Blue Halls' thin ice): iron
  grates in the floor over the old flues (`HOT_GRATES`). Each warms (`GRATE_WARM`, its bars glowing: the warning),
  vents heat (`GRATE_VENT`) and cools, on its own offset in a `GRATE_CYCLE` (`grateAt(i, tick)`). Both sides read the
  server tick, so nothing goes over the wire: `drawGrate` in `src/foundry.js` draws them from `net.renderTick()`, and
  the server hurts whoever stands on the floor over a venting one, `GRATE_DOT` of max HP every `PATCH_HIT_EVERY` ticks
  as a flat 'dot' (no knockback: no `step()` change). A ledge or a jump is safe. Kept off the door, the ledger, the
  tally board and the zone signs.

## The Under-Flues (Lv 145–150, a deep room on hard-pocket rules)
- Data: `UNDERFLUES_*` and the spawns in `src/shared/rpg.js`, the room in `src/shared/sim.js`. Art:
  `src/underflues.js` (the room), `src/underflues-art.js` (mobs, gear, icons). Music scene `underflues`.
- The brick flues and fire channels under the furnaces: soot-black brick vaults, a fire channel going back into the
  wall under each, glowing seams in the brick that brighten and fade together (a slow breath far below, `BREATH_S`),
  an ember channel down the floor, and a red tint that grows going east (`heatAt`): hotter and redder going in.
- Hard-pocket rules (`hard` in `STAGES`): red level chips, red-trimmed zone signs, **no waystone, no trader**, elites
  throughout. **You come in at the WEST end** (`UNDERFLUES_EXIT_X`, the flue's foot) and go east: the Flue Foot (no
  mobs: the stokers' shovels left standing in a coal heap, a coal barrow tipped over and spilled, a coat on a hook,
  a lamp gone out), the Fire Channels, the Hot Seams (stokers' shovels and fire-irons leaning on the walls) and the
  Hound's Bed (a hollow pressed into a drift of soot, scrape marks in pairs, gnawed iron), where the way down opens
  at `UNDERFLUES_END_X` into the Long Flue.
- Mobs (legacy brains, on the frozen curve, `docs/economy.md`): cinder whelps (the brood: small fire serpents of coal
  scales, `trail` with no `style`, so burning cinders like the magma slug's), flue bats (`dive`, `fly` 60: inside the
  70 px flier rule), clinker crawlers (heaps of fused clinker, `split` into clinker bits: a split minion, kept small)
  and stoker wardens (Keeper iron figures holding a long fire-iron across their front, `shell`: hit them from
  behind). Elites: Eldest Cinder Whelp, Great Clinker Crawler, Elder Stoker Warden. The brood's tell: coal eyes.
- **Orthrus, the Two-Headed Hound**: a named elite at the far end (not a boss: no den, no phases, an ordinary respawn),
  Typhon's son in the myth, never said in the game. A soot hound the size of a cart with two heads, lying across the
  way down; it charges like Garm (the `shell` brain's lunge with `cut: 0`) and barks one head at a time (art: one jaw
  opens with a gout of embers, then the other). `elite('stoker_warden', …)` with its own `art` (`orthrus`), so the
  economy sheet checks it as an elite of the room's top mob, as it checks Garm against the black-ice wolf.
- Drops: four materials (whelp cinder, flue bat wing, clinker cake, stoker's iron), the Stoker's Helm (stoker
  wardens) and the Twinfang with its staff and bow twins (Orthrus only; the staff has a new `fang` head in
  `src/staff-art.js`), priced on the curve between the Rim's gear and Brenna's. Ids checked for clashes.
- The Damper (last in `UNDERFLUES_PLATFORMS`): the hidden spot, a great iron damper wheel across a flue shaft high over
  the Hot Seams, its top rim the ledge, a stoker's tin mug hung on a spoke.

## The Long Flue (the approach: no mobs, no combat)
`src/longflue.js`. Not a stage (no `STAGES` row, not a combat room): safe ground where the party gathers. Owner's
rule: everything cinematic here is drawing and sound, never `step()`, never a cutscene; you should feel shut in,
never be shut in.
- A sloping brick flue down into the heat, landing by landing (`LANDING_W`; the flight of grating you came down is
  drawn in the wall behind each landing), walked on **an iron grating over the drop**: the floor is the grating, and
  the strip of screen under it is the drop.
- `flueDepth(x)` (0 at the way in, 1 at the den's door) drives it all, from **your own** slime's x. Under the grating:
  first only a glow, then a coil sliding past, then the curve of a back with plates along it (`BACK_X`, drifting by
  slower than the grating, so it reads as deeper), and past `EYES_X`, at the last landing, four eyes opening under
  your feet and turning to follow you. **The breath** (`breathOut`, `BREATH_S`): with each one the glow under the
  grating comes up, the grating's bars warm, the heat-haze pulses up through it, the shapes show; between breaths
  it's nearly dark (`drawLongFlueFront`). The roof comes down, the soot comes down thicker, and haze closes in from
  the left over the way back (art only: the door back always works).
- Music scene `longflue`: a deep held note, the bellows breath every two bars (bigger the deeper), the Under-Flues'
  tune thinning to nothing, a slow anvil hammer that fades and stops past the middle, and at the bottom a deep iron
  boom with the breath (the door). `audio.setDepth` is set every frame from `src/main.js`, as on the Long Stair.
- **Typhon's line** (`TYPHON_LINE`): the first slime past `TYPHON_MARK_X` in an empty Long Flue makes the server send
  `{t:'boss', a:'voice', who, text}` to the room (`longFlueSaid` in `server/rpg.js`, checked every `PATCH_HIT_EVERY`
  ticks, reset when the room empties), exactly like Fenrir's. The client shows a dark bubble with ember writing and a
  chat line.
- **The den's door** at `TYPHON_DEN_X`: a great round-topped iron furnace door in a brick arch, riveted, a latch bar
  across it, red-hot at the seams. **In (b) it holds**: with every breath it bangs in its frame (a jolt, the seams
  flaring, sparks and smoke puffing out round it) and doesn't open; a gate (`furnacedoor`, `sign: false`, no art in
  `src/branch-gates.js`: the Long Flue draws the door and its own sign) whose E look says so. The sign beside it:
  `TYPHON_DEN_NAME`, `finalTag(EMBER_TOP)` (both levels, from `FINAL_LVL_OVER` and `FINAL_MIN_PLAYERS`) and a live
  count, "3 here, 4+ recommended": a count, never a lock.

## The door opens (E5 (c))
Add the den's `DENS` row (`from: LONGFLUE`, `fromName`, `entranceX: TYPHON_DEN_X`, room `TYPHON_DEN`) and delete the
`hearth` node: the door comes through `denDoors(LONGFLUE)` (`ROOMS[LONGFLUE]` already spreads it), and
`TYPHON_DOOR_OPEN` (true once the row exists) lets the door swing open by itself on a gust of heat as you come near,
the plan's look. Add the den's room to `ISLAND_OF_STAGE` (`src/worldmap.js`) if `islandOf` doesn't find it by its row.

## Personas that changed with it
Ash (the pit has fallen through; the stokers' flues, before his time; "I'm not going down", flatly; the stokers kept
their own books) and Collier Pitch (his grandfather was a stoker in the flues before he took to the trees, and came up
one day and never went back down: "warm all the way down"). Nothing Tier 3.

## Decisions and history
- 2026-10-29: built in E5 (b). Liberal decisions (owner's standing instruction): the flue at the pit's west end with the
  ledger west of it (clear of the half-cast tooth and Old Crucible's pit), west entry (the Old Ice's pattern), the zone
  names (the Flue Foot, the Fire Channels, the Hot Seams, the Hound's Bed), the Damper as the hidden spot (the plan had
  none), Orthrus checked as an elite of the stoker warden and its Twinfang off Orthrus only, the held door as a hot
  iron door banging with each breath, the den named "The Hearth" (the plan's arena).
- Not playtested (owner's rule: no headless bot tests): checked by a build, a mock-canvas run of every new draw
  function, the economy sheet and reading the code.
