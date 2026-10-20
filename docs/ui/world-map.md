# The World map (Esc menu)

**World map** in the Esc menu opens a page with a hand-drawn chart of the Glass Sea: Greenhollow,
Frostpeak, Emberdeep and the Aether Citadel floating over the Maelstrom. It also shows the sea routes,
fog with a "?" where the charts run out, and a bouncing slime in your colour on the island you're on. The
owner asked for it as a **teaser of where the world is heading**, so it shows the story's geography
(`story/world/geography.md`, `story/world/atlas.md`), not today's back-door chain of stages.

- Code: `src/worldmap.js` (all the drawing; `islandOf(room)` maps a room to its island, with dens going
  by `DENS[].from`), the page markup in `index.html` (`#worldmap`), its styles in `src/style.css`, and
  `showMap` in `src/main.js`. It works like the Controls page: `#menu.mapview` hides the rest of the menu.
- It only draws while the page is open (its own `requestAnimationFrame` loop, stopped by `hide()`), and
  it sends nothing to the server.
- Same layout on phones: the chart is in canvas pixels × `--s`, like every overlay.
- **No spoilers:** names and labels stay at canon Tier 0–1 plus the stage names players already see
  (`story/canon.md`). The uncharted fogs hint at the proposed side islands without naming them.
- Greenhollow's east rim is drawn white: the east cliffs (`docs/places/cliffs.md`).
- Aboard a crossing, `islandOf` says `'sea'` and the pin sits on the ferry's route (`PINS`).
- Frostpeak shows Icefang Hamlet where the ferry comes in (turf huts, a fire) and the Queen's cracked ice
  bridge running out to sea (`docs/places/fjord.md`).
- **Keep it in step with the story:** when an island, route or place ships (or a proposed one becomes
  real), add or un-fog it here. Positions follow the compass layout in `story/world/geography.md`.
