# Amberdune's landing: the Saltwind, Saltmouth and Caravanserai (atlas Phase 9, A0)

Atlas Phase 9 (`story/world/atlas.md`; plan `story/phase9-plan.md`). The owner's go-ahead (2026-11-17: "continue with the
next two phases") left every default in the plan standing: **Lv 215–250**, past the Citadel's top; the Saltwind from the
Black Sands; the whole depth pass with Old Carapace as the final boss; no canon tier; all four characters AI. Amberdune is
the south-west side island, a desert, and the theme from another angle again: **moving on** (everyone here is always
about to leave, and never does). A0 is its landing: the crossing, the town, its four people and its first wilds (the
Glass Dunes, `docs/places/glassdunes.md`). A0 and A1 (the Mirage Oasis and the Buried Observatory with the Sunroller,
`docs/places/oasis.md`, `docs/places/observatory.md`) shipped in one update, so A0's own blocks on those two never went
live. A2 opened the Salt Flats and the Netwife (`docs/places/saltflats.md`) and set Kesh trading; A3 the Buried
Caravanserai, the Last Drover and the Glassjaw (`docs/places/buried.md`, `docs/places/glassdunes.md`); A4 the Storm Road, the
Sirocco and the Red Wall, its party den (`docs/places/stormroad.md`). Old Carapace comes in A5 (`story/roadmap.md`).

Files: the town's layout in `src/shared/rpg.js` (`CARAVAN`, `CARAVAN_W`, `KESH_X`, `DUNE_DOCK_X`, `SALTFLATS_GATE_X`,
`DUNE_WAY_X`, `TALLY_X`, `DUNE_SPAWN_X`, `WELL_X`, `ASRA_X`, `DUNE_HOME_X`, `MOTHER_X`, `CARAVAN_EXIT_X`,
`CARAVAN_PLATFORMS`, `SHOPS.mother_dune`, `SHOPS.tally`, Tally's tier: `salt_tulwar`, `sandstone_rod`, `drover_bow`,
`drover_wrap`; `SANDS_SALTWIND_X`), the rooms in `src/shared/sim.js` (`DUNE_OUT`, `DUNE_HOME`, `ROOMS[CARAVAN]`, the
Saltwind's door in `ROOMS[BLACKSANDS]`, the `TOWNS` entry, the four `NPCS`, their `SLAP_QUIPS`), the town's drawing in
`src/caravan.js` (`drawCaravan`, `drawCaravanView`, the Saltwind herself in `drawSaltwindHull`, and `drawDuneSky` /
`drawDuneAir`, shared with every room on the island), the dune folk's look, the people's clothes and the island's gear in
`src/dune-art.js` (`DUNE_PALETTE`, `drawDuneFolk`, `drawDuneDress`, `DUNE_SWORDS`, `DUNE_HELMETS`; the staves and bows in
`src/staff-art.js` and `src/bow-art.js`), the crossing in `src/crossing.js` (the `'dune'` route: `drawDuneSea`, the
island's coast in `drawCoast`, the Saltwind in `SHIPS`), the Saltwind on the Black Sands in `src/branch-gates.js`
(`drawSaltwindBeached`, an entry like the balloon's), Amberdune's landmark in every sky in `src/distant.js`
(`drawAmberdune`, the `dune` view), the island map (`AMBERDUNE` in `src/shared/branches.js`), the gate art in
`src/branch-gates.js` (`drawSoftSalt`), the waystone in `src/shared/waystones.js`, the personas in
`server/characters.js`, the `duneroute` and `caravan` music scenes in `src/audio.js`, the World map in `src/worldmap.js`.

## What it is
- **The way there**: **the Saltwind**, Skipper Kesh's caravan skiff, come round the coast for Forgehold coal, rides in
  the shallows on the Black Sands' Beach Path between the Turning Stone and the way back to Forgehold (her bow run up on
  the sand, a plank down; the Forgehold sign moved east to make room). Her door (`SANDS_SALTWIND_X`) asks first and boards
  `DUNE_OUT`; label "Lv 215+", no gate. The update brought her (owner's rule: no quest). On Emberdeep's island map she's a
  node off the Black Sands, like the balloon off Magma Heart.
- **The crossing** (`docs/places/crossings.md`): route `'dune'`, two decks, `DUNE_OUT` (room 98, the slow one) and
  `DUNE_HOME` (99). The deck is the shared ship; the Saltwind's look in `SHIPS` (a sand-brown hull, a rust-red band, an
  ochre sail, a little stove pipe). Kesh stands at the tiller on both decks (`also`). The sea (`drawDuneSea`, driven by
  `a`, how far toward Amberdune): Emberdeep's smoke column and the ash haze astern, the warm green sea paling to
  turquoise and the sky clearing, gulls, sandbars coming up, the water so shallow the sand shows under her, then a whole
  coast of dunes, Saltmouth's piers standing high and dry a long way inland, tents beyond them, and the new jetty out at
  the water's edge.
- **Caravanserai (room 97, a town and a safe room)**, with **Saltmouth's dry piers** as its waterfront, one room like
  Wickmere and Forgehold. West to east: **the new jetty** over turquoise water with the Saltwind alongside (her gangway,
  `DUNE_DOCK_X`, boards `DUNE_HOME`) and **Kesh's water casks**; the walk in over **the old seabed**, pale and cracked
  with salt, shells in it, **a boat careened on its side** where the water left it (a platform); **the way down onto the
  seabed to the Salt Flats** (`SALTFLATS_GATE_X`: a gate, below); **Saltmouth's stone piers** standing high and dry,
  iron mooring rings far over your head, a white salt line along every wall (the long pier's top is a platform), the
  **waystone** at their foot; **Tally's counting-stall** (a striped canopy, bead strings, a jar of tally sticks, a little
  balance); **the well**, a deep ring of dressed stone with a windlass and its knotted rope, a trough beside it (you wake
  by it, `DUNE_SPAWN_X`); **Asra** at its far side; a stack of packs (a platform); **the striped tent whose flap is
  everyone's own front door** (`DUNE_HOME_X`); a tent's awning (a platform); **the Star Court**, a ring of Keeper
  star-dials half buried in the sand, a rug and cushions in the middle where **Mother Dune** sits (the tilted dial's rim
  is a platform); the east end, out onto the Glass Dunes (`CARAVAN_EXIT_X`). Tents everywhere, **every one of them half
  struck**, packs and bundles beside them, **pack-lizards** (slime-sized sand lizards) dozing in the shade with their
  packs still on, amber glass lanterns lit even by day.
- **Behind** (`drawDuneSky`): a high hot sky, a white sun with a wide ring, the far dunes, the other islands small over
  the sea to the north-east, in town the sea a bright far line out west past a glare of salt, and **a far hill on the
  horizon that isn't always in the same place** (Old Carapace walking: where depends on the hour of the day; the atlas's
  hint at the finale, shown and never named; the World map's island dot does the same).
- **A town** (owner's rule, `docs/world.md`): in `TOWNS`; you wake by the well, your house's front door lets you out
  here, houses can take Caravanserai as their window view (`drawCaravanView`). Its waystone has a new island,
  `isle: 'dune'` (Amberdune's stones: wind-scoured gold, half buried in a drift of sand, a string of blue beads round the
  neck and an amber lamp on top).
- **The dune folk's look** (`folk: 'dune'`, `src/dune-art.js`): warm amber-gold jelly with grains of sand drifting slowly
  down inside it like an hourglass's and a little drift of it at the bottom; the slow folk wobble (Kesh and Asra are
  young: `lively`). Long scarves, wrapped hoods and veils, brass rings and beads.
- **Amberdune in every sky** (`src/distant.js`): a long low gold line of dunes with heat shimmer over it and, now and
  then, a small far hill on its skyline in a different place each hour (south of Greenhollow, south-west of Frostpeak and
  the Citadel, west of Emberdeep, far west of the Fen). From the island the view faces north-east toward the middle of
  the sea (the `dune` view).

## Its people (AI with memory, `docs/social/ai-characters.md`)
None of them names Old Carapace: "the Walker", if anything, and a change of subject. No canon tier (like the Fen): Tier 0
and their island.
- **Skipper Kesh** (`kesh`, at her casks on the jetty and at the Saltwind's tiller): the crossing, no fare; since A2 she
  **trades** salvage off the old fleet from her jetty (`SHOPS.kesh`: the Skiff Gaff and its twins, the Sailcloth Hood,
  `aim` 230; `docs/places/saltflats.md`). The only one
  of the caravan who likes water; moves the jetty out every season and takes it as an insult; trades sand-glass beads to
  Auntie Soot for hot-spring salts and won't say what for (a bath: she tells only someone kind to her several times).
- **Mother Dune** (`mother_dune`, in the Star Court): the caravan's leader and its lore-holder, very old; reads the
  Keepers' star-dials and knows the stars are wrong without knowing why. She **trades** water-skins and the basic potions
  (`SHOPS.mother_dune`: she calls it all water). She has led the caravan out a hundred times in her head and never once
  in fact, because the well still gives a little; she won't look east at sundown.
- **Tally** (`tally`, at his counting-stall): counts everything. He **trades** salt-iron and sandstone (`SHOPS.tally`: the
  Salt-Iron Tulwar, the Sandstone Rod, the Drover's Bow and the Drover's Wrap, `aim` 220, on the gear curve at Lv 216
  like every trader's tier under its aim; `docs/economy.md`). He counts the days since the Walker last passed close to
  town and won't say the number; he sets a cup at supper for everyone who ever left the caravan.
- **Well-keeper Asra** (`asra`, at the well): the well, a nod at farming; lowers the bucket a little further every
  morning and marks the rope. In love with the idea of rain she's never seen, and gets its details wrong on purpose so
  travellers will tell it again. **No shop**: the plan's water-plant seeds would be a new crop (seeds are bought at the
  garden plot, `docs/places/alchemy.md`), so they wait (`docs/ideas.md`).
- Off the island: **Auntie Soot** (Forgehold) and **Liv** (the Smoking Coast) know the Saltwind calls at the Black Sands.

## The way on, and the gate
- **The Glass Dunes** (`docs/places/glassdunes.md`) off the town's east end: open.
- **The Salt Flats** (`docs/places/saltflats.md`), down onto the old seabed off the town's west end (`SALTFLATS_GATE_X`,
  kind `softsalt`): A0's gate was the salt crust wet that season, planks sinking, a pole leaning where someone went in to
  the knee. A2 dried it (the update did it, no quest): the crust hard and white, the planks flat, the pole stood up with
  Kesh's blue rag on it (its `open` look, now an `entry`), and Kesh started trading from her jetty.
