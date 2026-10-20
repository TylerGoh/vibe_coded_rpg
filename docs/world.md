# World: rooms, doors, layout

All layout numbers live in `src/shared/sim.js` (`ROOMS`, `PLATFORMS`, the `*_DOOR_X` / `*_EXIT_X`
constants) and, for the combat stages, `src/shared/rpg.js`. Room ids are indices into `ROOMS`.

## Rooms
| room | id | doors (press E) |
|---|---|---|
| Slimeville (village) | 0 `VILLAGE` | Furniture store · your house · Lecture Hall · Music House · Museum · Wildwood gate (east end) |
| Lecture Hall | 1 `HALL` | exit · Tutoring Room (side door) |
| Music House (piano) | 2 `PIANO` | exit |
| Grand Museum of History | 3 `MUSEUM` | exit · wing portals in the lobby (`wingPortalX`) · back-to-lobby door at each wing (`wingReturnX`) |
| Tutoring Room | 4 `TUTOR` | back to the hall |
| The Wildwood | 5 `FIELD` | village · 3 dens · Highlands trail |
| Frostpeak Highlands | 9 `HIGHLANDS` | Wildwood · 2 dens · Caldera pass |
| Emberdeep Caldera | 12 `CALDERA` | Highlands · 2 dens · Citadel skylift |
| Aether Citadel | 13 `CITADEL` | Caldera · 2 dens |
| Furniture store | 18 `STORE` | exit (`docs/places/houses.md`) |
| Boss dens | 6, 7, 8, 10, 11, 14, 15, 16, 17 | exit, back to the stage it's in (`DENS[].from`) |
| Personal houses | `HOUSE_BASE` and up, one per account | out to the village (`docs/places/houses.md`) |

Look rooms up with `roomDef(room)`, not `ROOMS[room]`: houses aren't in `ROOMS`.

Stages and dens: `docs/combat/stages.md`, `docs/combat/bosses.md`. No level gate on any door.

## The village
- Spawn at `SPAWN_X`. West to east: the furniture store (`STORE_DOOR_X`; a floating island was moved off
  its roof), Bakery, mushroom house (sign "Home": its door, `HOME_DOOR_X`, leads
  into your own house), the big tree with decks and Elder Mochi, the
  Inn, Merchant Pip's stall (`SHOP_X`), then the Lecture Hall, Music House and Museum doors and the gate
  to the Wildwood. Floating islands above are one-way platforms.
- Scenery is drawn by `src/village.js`; each building's outside is drawn by its feature's file
  (`src/hall.js`, `src/piano.js`, `src/museum.js`, `src/field.js` for the gate).

## Doors and rooms run in the physics
Doors are in `ROOMS[room].doors` and are taken inside `step()` on the USE input bit (`doorAt`), so a room
change is predicted like any other movement. Never move a player between rooms with a side message.

## Platforms
- One-way platforms: you land on them from above. Holding ↓ on one drops through it (↓ + jump also works).
  It used to need ↓ + jump, which on phones was nearly impossible (▼ and Jump share the right thumb).
- Each combat stage has its own platform list in `src/shared/rpg.js` (`FIELD_PLATFORMS`,
  `HIGHLAND_PLATFORMS`, …; dens share `DEN_PLATFORMS`).
