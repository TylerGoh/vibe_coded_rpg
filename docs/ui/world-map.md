# The World map (Esc menu)

**World map** in the Esc menu opens a page with a hand-drawn chart of the Glass Sea: Greenhollow,
Frostpeak, Emberdeep and the Aether Citadel floating over the Maelstrom. It also shows the sea routes,
fog with a "?" where the charts run out, and a bouncing slime in your colour on the island you're on. The
owner asked for it as a **teaser of where the world is heading**, so it shows the story's geography
(`story/world/geography.md`, `story/world/atlas.md`), not today's back-door chain of stages.

- Code: `src/worldmap.js` (all the drawing; `islandOf(room)` maps a room to its island, with dens going
  by `DENS[].from`; every room off Greenhollow needs its row in `ISLAND_OF_STAGE`, or its pin lands on
  Greenhollow: the Glacier, the Skerries, the Grotto, the Heights, the Blue Halls and the Queen's Bridge have theirs,
  and Forgehold (Emberdeep's legacy stage was already there); the "you are
  here" label goes beside the pin when a card sits right above or the node is at the map's top edge), the page markup in `index.html` (`#worldmap`), its styles in `src/style.css`, and
  `showMap` in `src/main.js`. It works like the Controls page: `#menu.mapview` hides the rest of the menu.
- It only draws while the page is open (its own `requestAnimationFrame` loop, stopped by `hide()`), and
  it sends nothing to the server.
- Same layout on phones: the chart is in canvas pixels × `--s`, like every overlay.
- **No spoilers:** names and labels stay at canon Tier 0–1 plus the stage names players already see
  (`story/canon.md`). The uncharted fogs hint at the proposed side islands without naming them.
- Slimeville is the apple tree, a few roofs and a small glowing dot for the Rebirth Pool beside the tree.
- Greenhollow's east rim is drawn white: the east cliffs (`docs/places/cliffs.md`).
- Aboard a crossing, `islandOf` says `'sea'` and the pin sits on the ferry's route, or `'straits'` aboard the
  Lodestar, in the Steam Straits, `'sky'` aboard the balloon, on its climb, or `'fenroute'` aboard the Hush, on her way
  east (`PINS`). The Skydocks camp and the Skydocks are on the Citadel (`docs/places/skydocks.md`), whose sub-label
  names the camp. Since the Citadel's depth pass (C0) it has its own map, `CITADEL_MAP` (`LOOK.citadel`: cream and brass on
  clouds; `docs/places/citadel.md`): the camp, the Skydocks, the Bastion and the Spire, the Keepers' Gardens, the Orrery (C1), the Archive (C2), the Engine Halls (C3),
  and the four branches still shut (the Helm off the Engine Halls since C3), dashed with their reasons.
- **Lantern Fen** (atlas Phase 8) is charted where the eastern fog was: a low violet island with meres, Wickmere's stilt
  houses at its west end, a thinner mist and the lights still flickering over it; the Hush's dashed route runs to it
  from Frostpeak. Its own map is `LANTERN_FEN` (`src/shared/branches.js`; `LOOK.fen`): Wickmere, the Shallows, Firefly Hollow
  and the Drowned Grove (L1), the Still Mere (L2), the Sunk Barrows (L3), the Lantern Causeway (L4), the Peat Barrows
  under the Barrows (L5 (b), its node covers the Lamp Road too), and the Hall of Lamps, top left of the Peat Barrows (its
  path comes up from them), dashed "the silk holds": two gates, the Lamp Road's inner door and the front door at the
  Causeway's end.
- Emberdeep's sub-label names Forgehold; it sits near the chart's bottom edge, so its "tap for its map" hint
  goes beside it, not under it.
- Frostpeak shows Icefang Hamlet where the ferry comes in (turf huts, a fire) and the Queen's cracked ice
  bridge running out to sea (`docs/places/fjord.md`).
- **Island maps:** tapping (or clicking) an island that has one (`ISLAND_MAPS`: Greenhollow, Frostpeak since its depth pass, Emberdeep since atlas Phase 5, Lantern Fen, the Citadel since C0) opens its own map: its places as cards joined by paths, drawn from `GREENHOLLOW` / `FROSTPEAK` / `EMBERDEEP` in `src/shared/branches.js` (`docs/places/branches.md`), coloured per island (`LOOK`: Frostpeak is snow on a grey-blue sea, Emberdeep dark sand on warm green water). `TAP` says where to tap each island on the chart. Open places are solid with their level band;
  ones not open yet are dashed with a short reason ("bridge out"), hard pockets red with a "!". Your pin (its "you are here" moves beside it when a card sits right above)
  sits on the place you're in (`nodeAt`: the Wildwood and Frostpeak's stage by zone, a den by its stage; the village's
  buildings and houses count as Slimeville). The pink pill top-left goes back to the chart. Taps are
  `pointerdown` on the canvas, so mouse and touch work alike; the chart says "tap / click for its map".
- **Keep it in step with the story:** when an island, route or place ships (or a proposed one becomes
  real), add or un-fog it here. Positions follow the compass layout in `story/world/geography.md`.
