# The Keeper ruins and the east cliffs

Atlas Phase 2, "the Wildwood's story" (`story/world/atlas.md`). Story: `story/world/regions/greenhollow.md`.

Files: `src/ruins.js` (the stones, their text and drawing), `src/cliffs.js` (the cliffs room, the gap in
the briar at the Wildwood's east end, the telescope view), `drawLandmark` in `src/distant.js` (one island
on its own, for the telescope), the room in `src/shared/sim.js` (`CLIFFS`, `CLIFFS_W`, `CLIFFS_EXIT_X`,
`CLIFFS_SCOPE_X`, `CLIFFS_PLATFORMS`), the path in `src/shared/rpg.js` (`CLIFFS_PATH_X`), the `cliffs`
music scene in `src/audio.js`, wiring in `src/main.js`.

## The Keeper ruins (Bramble Woods)
- Four mossy stones in Bramble Woods (`RUIN_STONES`): the Waystone, the Fallen Gate, the Roll of Keepers
  and the Root Stone. Scenery only, drawn after the field (`drawRuins`); the one you could read glows.
- E next to one (on the ground) opens it on the museum's fact-sheet card (`Museum.renderStone` in
  `src/museum.js`): what it looks like, what you can still read, and a cozy aside; ←/→ browse the four.
  The card's "Ask Clio" button is hidden out here (Clio is only askable in the museum). The hotbar hides
  while the card is up (`src/style.css`), since it sits over the card's buttons in a combat room.
- They stand in a mob zone on purpose (the atlas puts the ruins in Bramble Woods). Bramblehogs can still
  bump you while you read.
- **Lore limit: canon Tier 1** (`story/canon.md`): the Keepers' name, gears, "still turning", an hourglass
  scratched out, a root "under all". No Pangelea, no Tidewheel, no Pell. Keep it that way when editing;
  the carving of the great wheel belongs behind the Bramble Behemoth (`story/arcs/main-arc.md`).

## The east cliffs (room 20)
- Reached through a gap in the briar at the Wildwood's very east end (`CLIFFS_PATH_X`). The Wildwood was
  lengthened (`FIELD_W`) for it: the last stretch past the Highlands trail has no spawns, so the briar
  thins out toward the sea. The Highlands trail stays until the ferry works (atlas Phase 3).
- A safe vista (no mobs, not a combat room): a windy clifftop with two windswept trees, a boulder and a
  bench you can stand on (`CLIFFS_PLATFORMS`), the telescope, and a fence at the sheer edge.
- **The camera looks past the east wall.** The room has `viewPad` (read by the camera clamps in
  `src/main.js`), so at the fence the screen shows the drop and the open sea while you can't walk off.
- The other islands are drawn a bit bigger and clearer than from the harbour but must still look far
  (the owner's complaint the story fixes; see `docs/places/harbour.md`).

## The telescope
- E at `CLIFFS_SCOPE_X` opens a lens drawn over the game (`Telescope` in `src/cliffs.js`, drawn after the
  world in screen space). ←/→ (or A/D) swing it between Frostpeak, the Citadel and Emberdeep; E or Esc
  steps back. While it's up your slime stands still (`keys()` returns 0).
- Phones: the movement pad stays visible and does the same thing; a tap on the canvas's sides swings, a
  tap in the middle steps back. The usage line sits inside the lens there (the top edge has buttons).
- Captions are canon Tier 0 plus what a sailor would say. Frostpeak's mentions Brine's ferry and the dark
  lighthouse, which ties into the next phase.

## Next phase hooks
- Phase 3 removes the Highlands trail; the cliffs path then is the Wildwood's only east exit.
- `[proposed]` Clio could ask players for rubbings of the stones (the Slime Ages wing, `story/roadmap.md`).
