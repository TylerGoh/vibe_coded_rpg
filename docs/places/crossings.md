# Crossings: the ferry, the Lodestar and the sea between islands

Atlas Phase 3, "the crossing room", and Phase 5, the Steam Straits (`story/world/atlas.md`). Story:
`story/world/geography.md` (distance and travel), `story/world/regions/frostpeak.md`,
`story/world/regions/emberdeep.md`.

Files: the rooms in `src/shared/sim.js` (`FERRY_N`, `FERRY_S`, `STEAM_N`, `STEAM_S`, `DECK_W`, `DECK_GROUND`, `DECK_PLATFORMS`,
`DECK_GANGWAY_X`, `GANGWAY_X`, `CAST_OFF`, each room's `crossing`, `doorOpen`, `voyage`, `VOYAGE_MAX`), the
drawing in `src/crossing.js` (`drawCrossing`, `drawCrossingFront`, `crossingAt`, `SHIPS`, `shipName`), the harbour end in
`src/harbour.js`, the Frostpeak end at Icefang Hamlet's quay (`src/fjord.js`, `docs/places/fjord.md`: both
ships moor there), the Emberdeep end at Forgehold's quay (`src/forgehold.js`, `docs/places/forgehold.md`), the
voyage pill in `src/main.js`, the `crossing` and `straits` music scenes in `src/audio.js`, the "you are here"
pin at sea in `src/worldmap.js`, Brine's and Arne's personas in
`server/characters.js`.

## What it is
- A crossing is **a room: the deck of a ship under way**, not a loading screen. Friends board together, walk
  about, climb the crates, the cabin roof, the yard and the crow's nest (`DECK_PLATFORMS`), talk, slap, and
  chat with Captain Brine at the wheel. No mobs: crossings are safe rooms (atlas).
- **One room type, themed per route.** A room is a crossing when its `ROOMS` entry has `crossing: { route,
  from, to, ticks }`. `route` picks the palette and props in `src/crossing.js` (only `'cold'` so far: the
  Greenhollow–Frostpeak ferry); `from` / `to` are `src/distant.js` island keys. The Lodestar (atlas Phase 5) is the `'steam'` route; the
  balloon (Phase 6) will be another entry plus a route theme, not a new code path. Each route's ship has its
  own look on the same deck (`SHIPS`: hull, name, a paddle box or not, the funnel, the sail), and its name is
  on the voyage pill (`shipName`).
- **Each direction is its own room** (`FERRY_N` out, `FERRY_S` home), so the two sailings don't share a deck
  and nobody sees the sea run backwards. Captain Brine stands in both (`also` on his `NPCS` entry).
- The first crossing out is the slow one (`story/world/geography.md`): the way home has a smaller `ticks`.

## The voyage clock (the netcode bit)
- `state.vt` counts ticks since you came aboard, inside `step()` (0 in every other room, reset by every door).
  The way ashore is an ordinary door with `after: crossing.ticks`; `doorOpen` keeps it shut until your clock
  gets there. So boarding, sailing and arriving are all predicted like any other door (`docs/netcode.md`).
- **The clock is per slime.** Two friends who board a few seconds apart arrive a few seconds apart, and each
  sees the sea at their own progress. Board together to sail together.
- Everything that moves (the coasts, the sea, icebergs, snow, the aurora, the smoke, the sail) is drawing
  only, driven by YOUR `vt` (`crossingAt`). The deck itself never moves: the physics are plain `step()`.
- `vt` is in snapshots (wire version 2, `src/shared/wire.js`) and survives a restart (`savePositions`).
- Once she's in, the clock stops mattering: you can stay aboard as long as you like; the gangway is open.
- **Boarding asks first** (owner: someone walked aboard by accident and was stuck at sea for a minute). A
  gangway door has `ask`; E there opens a small "Set sail?" card (`sail` in `src/main.js`, `#sail`) instead
  of stepping aboard, and its Set sail button (or E / Enter again) sends the E press itself, so the door is
  still taken inside `step()`. Phones get the same card. Walking off the gangway closes it.
- **Second thoughts:** for the first `CAST_OFF` ticks aboard the deck has a second door at the gangway
  (`before`: open only while your clock is under it) back to where you boarded.

## The cold route (the Puddle Jumper)
- Out of Greenhollow: the green coast with Slimeville's roofs and the lit lighthouse slides away astern,
  gulls follow her out. Open sea: icebergs, the sky greying, then snow and the aurora growing overhead. Into
  Frostpeak: black rock, snow and pines come up over the bow, the cracked ice bridge in the sky, and she
  ties up at Icefang Hamlet's quay among the turf huts.
- The Frostpeak end is Icefang Hamlet (room `FJORD`, `docs/places/fjord.md`): she's moored at the quay
  with her gangway down (`FJORD_DOCK_X`), which boards the homebound deck.
- History: in Phase 3 the fjord was frozen (the next phase shown but not open), so she tied up at a rough
  jetty at the ridge's west end with the hamlet in sight up the fjord. The Phase 4 update thawed it and
  moved the berth to the hamlet, no unlock quest (owner's rule); the jetty became the path down.

## The steam route (the Lodestar, atlas Phase 5)
- `STEAM_N` (room 45, out: Icefang Hamlet to Forgehold) and `STEAM_S` (46, home). The long voyage: out is
  clearly longer than the ferry's, home quicker (`ticks`). Boarded at the hamlet's quay (`FJORD_LODESTAR_X`,
  "Lv 90+", no gate) and at Forgehold's (`FORGE_DOCK_X`), each with the "Set sail?" card.
- The sea (`drawSteamSea`), driven by `w` (how far toward Emberdeep): the hamlet and the aurora fall astern,
  the last icebergs thin out, fog banks lie on the water and then fog over everything for a while, the water
  turns warm and green, geysers spout out of the sea and steam lifts off it, ash settles, frigatebirds come
  out, and Emberdeep's smoke column grows over the bow until the black cliffs (Forgehold's lights in rows up
  the wall, the rusted iron quay) come alongside.
- The ship: the Lodestar, an old dark-hulled fjord-folk ship with a gold band, no paddle box, a galley
  stovepipe for a funnel, a cream sail with a red stripe. Skipper Arne at her wheel on both decks (`also`).
- Aboard, the World map's pin sits in the Steam Straits (`islandOf` gives `'straits'`).

## The harbour end
- The lighthouse is lit (the patch lit it, owner's call: Granny Wicks came home and lit it). Brine's
  condition for sailing is met, so the notice says "All aboard!" and the gangway (`GANGWAY_X`) is a door.
  See `docs/places/harbour.md`.

## HUD, hints and phones
- A pill at the top left: where she's bound, seconds to go (or "In at …"), who's aboard, and a thin track
  of the voyage. On phones it's narrower ("Ferry · …") so it clears the top buttons.
- The gangway's beacon and E prompt only appear once it's open (`doorOpen` is used for beacons too).
- Nothing new to press: E at the gangway, as everywhere.

## Decisions and history
- 2026-10-20: built. The Wildwood → Highlands trail went in the same update (the ferry replaces it); the
  Highlands → Caldera pass and the Caldera → Citadel skylift stay until their crossings exist (atlas Phases 5
  and 6: never remove a back door before its crossing works).
- 2026-10-23 (atlas Phase 5): the Lodestar sails. The Caldera pass went in the same update, after both
  directions were tested. The skylift stays until the balloon works (Phase 6).
- Level gate: none (the game has none on purpose, `docs/world.md`); the ferry's gangway label says "Lv 40+" (it said "Lv 13+" until the rebalance, R, raised Frostpeak), the
  Lodestar's "Lv 90+".
- `[proposed]` Later: fishing over the rail, things climbing aboard on the far routes (light, optional,
  never a death trap), a quick sail back once a route is open.
