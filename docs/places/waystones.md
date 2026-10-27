# Waystones: fast travel on an island (never between islands)

Data `src/shared/waystones.js` (`WAYSTONES`, `wayAt`), server `way` in `server/rpg.js`, client
`src/waystones.js` (stone art, prompt, the `#ways` card in index.html, the shimmer), wiring in `src/main.js`.

- One in Slimeville, one in each branch's mob-free hub (Willowmere's mill, Driftwood Cove, the Deep's Root
  Stair, the Canopy's Treehouse Camp, Keeper's Spine's Windgap; the hard pockets, Glowroot Hollow, Wreck Cave and the Thornheart,
  have none). Respawn stays at towns (`TOWNS`): waystones are for getting back out.
- **Each island's stones only reach each other** (`isle` on a stone, Greenhollow when left out; `sameIsle`):
  islands are reached by their crossings (owner's geography rule), so a stone never skips the ferry. The
  server refuses a trip to another island's stone, the card lists only this island's, and the prompt says
  "find another" until you know two on the same island. Frostpeak's (F0–F4): Icefang Hamlet, by the
  lamp-fire, the Rimeglass Glacier's Cutters' Camp, the Whale Skerries' whaling hut, the Aurora Heights'
  Last Step and the Queen's Bridge's Stairhead (none in the Narwhal Grotto or the Blue Halls). Its stones wear snow and rime instead of moss.
  Emberdeep's (atlas Phase 5, E0): Forgehold, by the great forge, and Magma Heart, just past the Molten Forge's
  mouth (`isle: 'ember'`); each later branch adds one in its hub (E1: the Ashwood's, in Collier's Clearing; the Black
  Sands has none, next to town; E2: the Smoking Coast's, on the Glass Beach; none in the Drained Tubes, a hard pocket). They're dusted with ash, with black-glass
  glints and a warm crack (`drawStone` takes the stone's `isle`).
- E at a stone you don't know → `{t:'way'}` attunes (saved as `ways` on the character). E at one you know
  → the card lists your other stones (tap, click or number keys) → `{t:'way', to}`; the server checks you
  stand at an attuned stone and moves you with `placeAt` (like invites), then sends `warp` to both rooms.
- Mobile: the card's buttons are plain HTML, and E is the touch E button.
