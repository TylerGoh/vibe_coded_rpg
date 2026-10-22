# Waystones: fast travel on an island (never between islands)

Data `src/shared/waystones.js` (`WAYSTONES`, `wayAt`), server `way` in `server/rpg.js`, client
`src/waystones.js` (stone art, prompt, the `#ways` card in index.html, the shimmer), wiring in `src/main.js`.

- One in Slimeville, one in each branch's mob-free hub (Willowmere's mill, Driftwood Cove, the Deep's Root
  Stair, the Canopy's Treehouse Camp, Keeper's Spine's Windgap; the hard pockets, Glowroot Hollow, Wreck Cave and the Thornheart,
  have none). Respawn stays at towns (`TOWNS`): waystones are for getting back out.
- **Each island's stones only reach each other** (`isle` on a stone, Greenhollow when left out; `sameIsle`):
  islands are reached by their crossings (owner's geography rule), so a stone never skips the ferry. The
  server refuses a trip to another island's stone, the card lists only this island's, and the prompt says
  "find another" until you know two on the same island. Frostpeak's (F0–F2): Icefang Hamlet, by the
  lamp-fire, the Rimeglass Glacier's Cutters' Camp and the Whale Skerries' whaling hut (none in the Narwhal Grotto). Its stones wear snow and rime instead of moss.
- E at a stone you don't know → `{t:'way'}` attunes (saved as `ways` on the character). E at one you know
  → the card lists your other stones (tap, click or number keys) → `{t:'way', to}`; the server checks you
  stand at an attuned stone and moves you with `placeAt` (like invites), then sends `warp` to both rooms.
- Mobile: the card's buttons are plain HTML, and E is the touch E button.
