# Inventory: what's in the game today, and what the story makes of it

Update this when the game changes. Source of truth for names is the code (`src/shared/rpg.js`,
`src/shared/sim.js`, `server/characters.js`, `src/history.js`).

## Places
| in game now | story reading | change needed |
|---|---|---|
| Slimeville (village) | Greenhollow Bay village | none (the harbour gate is at the west end) |
| Greenhollow Harbour | the west end: the lighthouse (lit again: Granny Wicks came home), the ferry; the shore path south to Saltspray Coves (the rockfall rolled aside, G1) | |
| The ferry's deck (two crossing rooms, out and home) | the Puddle Jumper crossing the cold sea to Frostpeak | more routes later (Steam Straits ship, balloon) |
| The Wildwood: Sprout Meadow, Mushroom Grove, Bramble Woods | Greenhollow's interior (Lv 1–12); Keeper ruins in Bramble Woods (4 readable stones); Turnipop, a field boss, in Sprout Meadow; Elder Bramblehogs (elites) in Bramble Woods; the mended footbridge into Willowmere (G1); the open stump into the Mycelium Deep (G2); the restrung ladder up to the Old Oak Canopy (G3); a blocked way into the Thornheart (its briar) | the branches open in G1–G5 (`world/island-depth.md`) |
| Greenhollow's East Cliffs | the vista past the Wildwood's east end: bench, telescope, the open sea | none |
| Icefang Hamlet (Icefang Fjord), a town | Frostpeak's landing: the ferry's quay, the hamlet, the cracked ice bridge; the Lodestar laid up | the Lodestar sails south in Phase 5 |
| Frostpeak: Frostpine Ridge, Starfall Summit | Frostpeak, far north, up the path from the hamlet | none |
| Emberdeep Caldera: Cinder Flats, Magma Heart | Emberdeep, far south | add the Black Sand Shore landing and Forgehold; a ship instead of the pass |
| Aether Citadel: Cogwork Bastion, Chrono Spire | the Keepers' sky city | add the Skydocks; a balloon instead of the skylift |
| Floating islands over the village | small chips of Pangelea that never landed | none; a nice detail for Mochi |
| Lecture Hall, Music House, tutoring | village life | none |
| Grand Museum of History | Clio's museum | maybe the Slime Ages wing |
| Personal houses, gardens, alchemy | village life; every town has a door into your house | none; herbs could later come from other islands |
| Willowmere (G1) | Lv 5–15 branch off Sprout Meadow: the mill, Miller Bun (AI, trades), the weir stone (Keeper), pond frogs, dragonflies, gloop snails, Old Snapjaw (field boss), a waystone | fishing, riverside herbs |
| Saltspray Coves (G1) | Lv 10–25 branch off the harbour: Beachcomber Moss (AI, trades), the tide post (Keeper), rock crabs, tide jellies, storm gulls, snapshrimp, the Tidemother's den, Wreck Cave's flooded mouth, a waystone | Wreck Cave (G4) |
| The Mycelium Deep (G2) | Lv 15–35 branch under Mushroom Grove, down the hollow stump: Forager Truffle (AI, trades), the Listening Stone (Keeper), the Glow Shelf, puffcaps, cave bats, puffballs, root beetles, knot spiders, the Knotmole's den, the crack down to Glowroot Hollow, a waystone | the Knotmole's freed change (the glow runs west again) |
| The Old Oak Canopy (G3) | Lv 25–40 branch in the treetops over Bramble Woods, up the rope ladder: Ranger Acorn (AI, trades), the Lifted Stone (Keeper), the Crow's Nest, oak squirrels, tent caterpillars, flying squirrels, tawny owls, wasp nests, hornets, the Hornet Queen (field boss), a waystone; Keeper's Spine seen over the leaves | Keeper's Spine past the fallen trunk (G5) |
| Glowroot Hollow (G2) | Lv 40–50 hard pocket at the Deep's bottom: the Heart Knot, glowworms, glow moths, threadweavers, elites (Old Glowworm, Elder Threadweaver) | none |
| Waystones (G1) | Keeper stones that still work: Slimeville, Willowmere, the Coves, the Deep (G2), the Canopy (G3) | Keeper's Spine (G5) |

## Characters
| in game now | story role |
|---|---|
| Elder Mochi | Pell's apprentice, keeper of the Heartroot cutting (the apple tree) |
| Curator Clio | historian; becomes a field historian of the Slime Ages |
| Captain Brine | the ferry captain, at her wheel on the crossing; knows Tier 0 only; sails into Icefang Hamlet since the fjord thawed |
| Old Skaldi | Icefang Hamlet's lamplighter; the old songs (Tier 2 in fragments) |
| Netmender Runa | Icefang Hamlet's trader (Trade button: warm gear, frostbloom) |
| Tove | Skaldi's granddaughter; the guide to the ridge's creatures |
| Miller Bun, Beachcomber Moss, Forager Truffle, Ranger Acorn | the branches' traders (Willowmere, the Coves, the Deep, the Canopy); Tier 0 plus their own corner (Moss: a light Tier 1 thread, Keeper marks; Truffle: the threads run under the sea) |
| Merchant Pip | cozy trader; later stocks goods from other islands |
| The nine bosses, the Tidemother and the Knotmole | creatures twisted by Anchor shards (`characters/bosses.md`) |
| Mobs | wildlife of each island; the late Citadel mobs are Keeper machines and echoes |

## Mechanics with an in-world reading
- **Boss respawns:** the shard keeps pulling the creature back until the Wheel turns.
- **One-hit ultimates:** the shard's raw Wheel power.
- **Fainting:** slimes are jelly; they wobble back together.
- **Broadcast voice** (`docs/social/voice.md`): `[proposed]` "the Bell", old Keeper tech for carrying a
  voice across the sea. It fits the theme exactly.
