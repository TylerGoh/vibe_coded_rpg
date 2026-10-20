# Crossings: the ferry and the sea between islands

Atlas Phase 3, "the crossing room" (`story/world/atlas.md`). Story: `story/world/geography.md` (distance and
travel), `story/world/regions/frostpeak.md`.

Files: the rooms in `src/shared/sim.js` (`FERRY_N`, `FERRY_S`, `DECK_W`, `DECK_GROUND`, `DECK_PLATFORMS`,
`DECK_GANGWAY_X`, `GANGWAY_X`, each room's `crossing`, `doorOpen`, `voyage`, `VOYAGE_MAX`), the drawing in
`src/crossing.js` (`drawCrossing`, `drawCrossingFront`, `crossingAt`), the harbour end in `src/harbour.js`, the
Frostpeak end (`drawJetty`) in `src/highlands.js`, the voyage pill in `src/main.js`, the `crossing` music
scene in `src/audio.js`, the "you are here" pin at sea in `src/worldmap.js`, Brine's persona in
`server/characters.js`.

## What it is
- A crossing is **a room: the deck of a ship under way**, not a loading screen. Friends board together, walk
  about, climb the crates, the cabin roof, the yard and the crow's nest (`DECK_PLATFORMS`), talk, slap, and
  chat with Captain Brine at the wheel. No mobs: crossings are safe rooms (atlas).
- **One room type, themed per route.** A room is a crossing when its `ROOMS` entry has `crossing: { route,
  from, to, ticks }`. `route` picks the palette and props in `src/crossing.js` (only `'cold'` so far: the
  Greenhollow–Frostpeak ferry); `from` / `to` are `src/distant.js` island keys. The Steam Straits ship and
  the balloon (atlas Phases 5 and 6) are new entries plus a new route theme, not new code paths.
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
  Frostpeak: black rock, snow and pines come up over the bow, and she ties up at the ridge jetty.
- **The next phase shows but doesn't open** (owner's rule): up the fjord you can see Icefang Hamlet's
  turf huts and the cracked ice bridge, but the fjord has frozen over, so she ties up at a rough jetty at the
  foot of Frostpine Ridge instead (Brine says so). Atlas Phase 4 builds the fjord landing and the hamlet;
  that update thaws the fjord and moves the berth there: no unlock quest.
- The Frostpeak end is the Highlands' west end (`HIGHLANDS_EXIT_X`): the bow moored in a strip of fjord
  water, a plank jetty, a lantern post and a sign home. The door there boards the homebound deck.

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
- Level gate: none (the game has none on purpose, `docs/world.md`); the gangway label says "Lv 13+".
- `[proposed]` Later: fishing over the rail, things climbing aboard on the far routes (light, optional,
  never a death trap), a quick sail back once a route is open.
