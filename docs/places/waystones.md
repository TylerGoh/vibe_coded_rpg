# Waystones: fast travel on an island

Data `src/shared/waystones.js` (`WAYSTONES`, `wayAt`), server `way` in `server/rpg.js`, client
`src/waystones.js` (stone art, prompt, the `#ways` card in index.html, the shimmer), wiring in `src/main.js`.

- One in Slimeville, one in each branch's mob-free hub (Willowmere's mill, Driftwood Cove, the Deep's Root
  Stair; Glowroot Hollow, a hard pocket off the Deep, has none). Keeper's Spine
  gets one when it ships (G5). Respawn stays at towns (`TOWNS`): waystones are for getting back out.
- E at a stone you don't know → `{t:'way'}` attunes (saved as `ways` on the character). E at one you know
  → the card lists your other stones (tap, click or number keys) → `{t:'way', to}`; the server checks you
  stand at an attuned stone and moves you with `placeAt` (like invites), then sends `warp` to both rooms.
- Mobile: the card's buttons are plain HTML, and E is the touch E button.
