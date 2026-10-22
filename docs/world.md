# World: rooms, doors, layout

All layout numbers live in `src/shared/sim.js` (`ROOMS`, `PLATFORMS`, the `*_DOOR_X` / `*_EXIT_X`
constants) and, for the combat stages, `src/shared/rpg.js`. Room ids are indices into `ROOMS`.

## Rooms
| room | id | doors (press E) |
|---|---|---|
| Slimeville (village) | 0 `VILLAGE` | Harbour gate (west end) · Furniture store · your house · Pet Shop · Lecture Hall · Music House · Museum · Wildwood gate (east end) |
| Lecture Hall | 1 `HALL` | exit · Tutoring Room (side door) |
| Music House (piano) | 2 `PIANO` | exit |
| Grand Museum of History | 3 `MUSEUM` | exit · wing portals in the lobby (`wingPortalX`) · back-to-lobby door at each wing (`wingReturnX`) |
| Tutoring Room | 4 `TUTOR` | back to the hall |
| The Wildwood | 5 `FIELD` | village · 3 dens · Willowmere's footbridge · the Mycelium Deep's stump · the Old Oak Canopy's rope ladder · the cut in the thorns to the Thornheart · the gap to the east cliffs (east end; the Highlands trail went when the ferry started) |
| Frostpeak (Frostpine Ridge, Starfall Summit) | 9 `HIGHLANDS` | down to Icefang Hamlet (west end) · 2 dens · Caldera pass |
| Icefang Hamlet (Icefang Fjord) | 23 `FJORD` | the ferry's gangway (`FJORD_DOCK_X`, boards `FERRY_S`) · your house (`FJORD_HOME_X`) · up to Frostpine Ridge (east end) (`docs/places/fjord.md`) |
| Emberdeep Caldera | 12 `CALDERA` | Highlands · 2 dens · Citadel skylift |
| Aether Citadel | 13 `CITADEL` | Caldera · 2 dens |
| Greenhollow's East Cliffs | 20 `CLIFFS` | back into the Wildwood (west end); a vista, no mobs (`docs/places/cliffs.md`) |
| Greenhollow Harbour | 19 `HARBOUR` | back up to the village (east end) · the ferry's gangway (`GANGWAY_X`, boards `FERRY_N`) (`docs/places/harbour.md`) |
| The ferry's deck, out / home | 21 `FERRY_N`, 22 `FERRY_S` | ashore at Icefang Hamlet / Greenhollow Harbour, once she's in; back ashore while she casts off (`docs/places/crossings.md`) |
| Willowmere | 24 `WILLOWMERE` | back to Sprout Meadow (west end) (`docs/places/willowmere.md`) |
| Saltspray Coves | 25 `COVES` | back to the harbour (east end) · the Tidemother's den · into Wreck Cave (west end) (`docs/places/coves.md`) |
| The Mycelium Deep | 28 `MYCELIUM` | up to Mushroom Grove (west end) · the Knotmole's den · down to Glowroot Hollow (east end) (`docs/places/deep.md`) |
| Glowroot Hollow | 29 `GLOWROOT` | back up into the Deep (west end); a hard pocket |
| The Old Oak Canopy | 31 `CANOPY` | down the rope ladder to Bramble Woods (west end); through the cut trunk up to Keeper's Spine (east end) (`docs/places/canopy.md`) |
| Wreck Cave | 32 `WRECK` | back out to the Coves (east end); a hard pocket (`docs/places/wreck.md`) |
| The Thornheart | 33 `THORNHEART` | back out to Bramble Woods (west end); a hard pocket (`docs/places/thornheart.md`) |
| Keeper's Spine | 34 `SPINE` | back down through the trunk to the Canopy (west end) · the Root Warden's den (east end) (`docs/places/spine.md`) |
| Pet Shop | 27 `PETSHOP` | exit (`docs/places/pets.md`) |
| Furniture store | 18 `STORE` | exit · section doors in the lobby (`storePortalX`) · an Entrance door at each later section (`docs/places/houses.md`) |
| Boss dens | 6, 7, 8, 10, 11, 14, 15, 16, 17, 26, 30, 35 | exit, back to the stage it's in (`DENS[].from`) |
| Personal houses | `HOUSE_BASE` and up, one per account | out to your town (`docs/places/houses.md`) |

Look rooms up with `roomDef(room)`, not `ROOMS[room]`: houses aren't in `ROOMS`.

Stages and dens: `docs/combat/stages.md`, `docs/combat/bosses.md`. No level gate on any door, but every door
into a combat room says who it's for: a `band` ("Lv 1–12", from `STAGES[room].band`; "Boss Lv 12" into a
den) set on the door in `src/shared/sim.js`, shown as a chip in its prompt and over the door
(`drawDoorBand`, `src/hints.js`; den mouths have their own boss sign, so no chip there). A stage with
`hard` (a hard pocket) gets a red chip with a warning mark. Don't write levels into door labels; set the
band. Blocked ways into branches that haven't shipped: `docs/places/branches.md`.

## Towns
**Owner's rule (2026-10-20): every island's landing has a town, and every town works like Slimeville.**
A town (`TOWNS` in `src/shared/sim.js`: Slimeville and Icefang Hamlet so far) has a door into your own
house, and being in one makes it **your town** (`state.town`, set inside `step()`, in snapshots and saved
with the character). You wake up there after fainting, start there when your spot from before a restart
wasn't kept, your house's front door (`to: TOWN`) lets you out there, and invites work from any town. A
toast says so when your town changes. A new town = a `TOWNS` entry (room, wake-up x, house door x) and a
`HOME` door in its room. Towns are safe rooms (no mobs).

## The village
- Spawn at `SPAWN_X`. West to east: the harbour gate (`HARBOUR_GATE_X`), the furniture store (`STORE_DOOR_X`; a floating island was moved off
  its roof), Bakery, mushroom house (sign "Home": its door, `HOME_DOOR_X`, leads
  into your own house), the big tree with decks and Elder Mochi, the
  Inn, Merchant Pip's stall (`SHOP_X`), the Pet Shop (`PETSHOP_DOOR_X`; the lamp east of Pip's moved west of it), then the Lecture Hall, Music House and Museum doors and the gate
  to the Wildwood. Floating islands above are one-way platforms.
- Scenery is drawn by `src/village.js`; each building's outside is drawn by its feature's file
  (`src/hall.js`, `src/piano.js`, `src/museum.js`, `src/field.js` for the gate).

## Doors and rooms run in the physics
Doors are in `ROOMS[room].doors` and are taken inside `step()` on the USE input bit (`doorAt`), so a room
change is predicted like any other movement. Never move a player between rooms with a side message.
A door can be shut for now: `doorOpen` checks your own house exists (`HOME`) and a door's `after` / `before`
(the ferry's gangway opens when your voyage clock `state.vt` reaches it, and the way back ashore closes
once she has cast off, `docs/places/crossings.md`). A door with `ask` shows a confirm card first (the
ferry's gangways).

## Camera
The camera stays inside the room, except that a room with `viewPad` lets it look that far past its east
wall (the cliffs, so you see the drop and the sea from the fence).

## Platforms
- One-way platforms: you land on them from above. Holding ↓ on one drops through it (↓ + jump also works).
  It used to need ↓ + jump, which on phones was nearly impossible (▼ and Jump share the right thumb).
- Each combat stage has its own platform list in `src/shared/rpg.js` (`FIELD_PLATFORMS`,
  `HIGHLAND_PLATFORMS`, …; dens share `DEN_PLATFORMS`).
