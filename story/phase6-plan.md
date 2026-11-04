# Atlas Phase 6: the climb, on paper (for the owner to approve)

**Status: approved by the owner 2026-11-04 with every default (and all four characters AI). (b) and (c) built
2026-11-04 (`docs/places/skydocks.md`): Phase 6 is done.** Phase 6 of `world/atlas.md`: the thermal column vista, the balloon
crossing, the Skydocks zone, the Skydocks camp as the Citadel's town, the Dockwarden. The skylift goes. Story:
`world/regions/citadel.md`, `world/geography.md`, `world/emberdeep-depth.md` (decision 3: the column stalls,
Slag's forge-burner lifts it). Marked `[default]` = what gets built unless the owner says otherwise.

## The shape
```
Magma Heart (east end)          the balloon, up / down             the Citadel
 the cradle at BALLOON_X  ==>  SKY_UP (66) / SKY_DOWN (67)  ==>  the Skydocks camp (68, town)
 the column vista (east end)                                        |  east, out along the last pier
                                                                     the Skydocks (69, Lv 135–145)
                                                                     |  east end, up the loading ramp
                                                                     Cogwork Bastion (CITADEL, west end)
```
Four new rooms `[default]`. The camp is a safe room like every town, so the fighting zone is its own room
past it. Cogwork Bastion's west door (today the skylift down) becomes the way back to the Skydocks.

## 1. The thermal column vista (Magma Heart's east end, no new room) `[default]`
- The **update lifts the block** (owner's rule, no quest): the balloon in its cradle at `BALLOON_X` is
  inflated, a squat iron burner (Slag's, his hammer marks on it) under the envelope, the basket on its
  tether. Its door has `ask` (the "Set sail?" card, worded "Cast off?") and boards `SKY_UP`. Label band
  "Lv 135+" `[default]`, no gate.
- **The skylift station goes** (`drawSkylift`, the `CITADEL_DOOR_X` door), but only once the balloon is
  tested both ways, in the same update (never strand an island). The east end becomes the vista: the
  column roaring up out of the vent, ash and sparks lifting in it, the Citadel's underside far overhead
  with broken piers hanging off it (drawing only).
- The island map's `column` gate becomes the balloon's launch (an open way, like the other lifted gates).

## 2. The balloon (a crossing route, `'sky'`) `[default]`
- Two decks like the ferry and the Lodestar: `SKY_UP` (Magma Heart → camp, the slow one) and `SKY_DOWN`
  (camp → Magma Heart, quicker). Same room type, same voyage clock, same `CAST_OFF` second thoughts.
- **The ship:** not a basket you can't move in, but a long wicker-and-plank **gondola** slung under a
  great patched envelope (rope rigging instead of a mast; the yard and crow's nest become the rigging
  ring and the burner's platform). Same `DECK_PLATFORMS`, its own look in `SHIPS`. Her name: **the Kite**.
- **The climb** (driven by `vt`): Magma Heart's crater drops away, the column's smoke around the
  gondola, the burner roaring at each stall (the deck shudders: drawing only), then up through three
  cloud layers into a clear cold blue, and **the whole archipelago small below**: Greenhollow, Frostpeak's
  aurora, Emberdeep's smoke, the far blur where Lantern Fen would be (the game's best view: citadel.md).
  Then the Citadel's underside comes over: gears the size of houses, hanging piers, and she moors at
  the camp's pier. The way down runs it in reverse.
- The pilot stands at the burner on both decks (`also`), like Brine and Arne.

## 3. The Skydocks camp (room 68, the Citadel's town) `[default]`
- Tents and a brazier lashed to **the one pier that still holds**, at the edge of a dead city. Wind all
  the time (flapping canvas, rope creak). West to east: the balloon's mooring mast and gangway, the
  pilot's stall (crates of goods hauled up), the brazier (you wake by it), a waystone, a tent whose flap
  is **everyone's own front door** (`HOME`), the pilgrim's lantern, the apprentice's pile of salvaged
  gears, then the pier's end and the way out onto the Skydocks.
- A **town**: a `TOWNS` entry, respawn, home door, invites (`docs/world.md`). A waystone with a new
  `isle: 'citadel'` (Citadel stones reach only the Citadel: the camp to start).
- No people of its own (the Citadel is empty, that's the point): the camp is **visitors huddled at the
  edge**, each in their own island's look. No new folk look `[default]` (the roadmap's "the Skydocks'
  folk look" becomes: three visitors from three islands, and the Dockwarden's brass).

### Its people (AI characters with memory, narrow lore, rich lives) `[default names, proposed]`
- **Pilot Kestrel** (the trader, `shop`): a forge-slime who grew up under the column and flew short hops
  until it began to stall; Slag built her the burner. Sells potions and cold-weather things and her own
  Aeronaut's Goggles (a hat) and a Sky Anchor (a weapon? `[default: a hat only]`), priced by the sheet.
  Tier 0 plus the sky. Life: talks to the balloon; counts every flight in a logbook; afraid of the ground.
- **Pilgrim Ione** of Wickmere (Lantern Fen, not open yet: foreshadowing only): carries a lantern for
  someone who went up to the Citadel long ago and didn't come down. Gentle, strange. Tier 0; Wickmere and
  its lanterns as home talk. **This is Phase 8's "seen but not open"** (a person from the fen, the fen a
  blur from the balloon; no door, no ship).
- **Tamp**, a forge-slime looking for a gear Ignis made: an old apprentice from the forge, sure "the
  master's best piece" went up the road and never came down. Blunt, guilty. Tier 0 plus forge talk;
  **never names the Tidewheel or the tooth** (Tier 3 stays Ignis's).

## 4. The Skydocks (room 69, Lv 135–145) `[default]`
- Broken piers hanging off the city's underside, empty mooring rings, wind. One zone. A hazard: **gusts**
  `[default: drawing and a little push? no — no physics change: gusts are a telegraphed hit, like the
  Rim's]`. Platforms are pier ends and hanging gantries.
- Mobs (the sheet prices them; band between the Rim and Cogwork Bastion): **loose bolts** (a swarm, like
  cogbits), **rigging moths** (fly), and one heavier: **a mooring hook** (a crane arm that swings) `[default]`.
  One field boss `[default: none; the Colossus is the Citadel's]`.
- **The Dockwarden**: a porter automaton at its post on the middle pier, still logging arrivals that
  never come. `[default: an AI character like the rest]` (owner's rule: every character chattable), its
  speech all ledger entries; it logs YOU, by name, and remembers how many times you came in. Knows
  nothing past "the port is open; departures are suspended pending the hour". Tier 4 stays the Last Echo's.
- East end: the loading ramp up into Cogwork Bastion's west end (`CITADEL_EXIT_X`).

## 5. Everything else
- Music: `sky` (the crossing: wind, a slow climbing line) and `skydocks` (thin, ticking, cold). Audio doc.
- World map: the balloon route already drawn; the pin on the balloon's decks (`islandOf`), the camp and
  the Skydocks in the Citadel's list. A Citadel island map `[default: no, later]`.
- Personas: Slag (built the burner, proud and won't say so), Ash, Soot, Arne, Brine learn the balloon flies;
  every persona's "shut ways" list loses the balloon.
- Economy: the Skydocks' mobs and Kestrel's stock go through the sheet (`npm run economy -- --check`).
- Mobile: nothing new to press (E at the gangway, the shop card).
- **Next phase shows but doesn't open:** Phase 7 isn't a place; Phase 8 (Lantern Fen) shows through the
  pilgrim and the blur on the horizon from the balloon.

## Build order `[default]`
- **(b)** the balloon (both decks), the column vista, the camp and its three people, music; the skylift
  stays one more step. The camp's east end shows the Skydocks blocked in-world (the plank to the next pier
  is down: "Wind's too strong on the piers. Wait for a lull." `[default]`).
- **(c)** the Skydocks room, its mobs, the Dockwarden, the plank laid across; **the skylift goes**.
