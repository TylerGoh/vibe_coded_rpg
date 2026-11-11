# Lantern Fen's landing: the Hush, Reedwater and Wickmere (atlas Phase 8, L0)

Atlas Phase 8 (`story/world/atlas.md`; plan `story/phase8-plan.md`, approved by the owner 2026-11-11: **Lv 150–180**,
not the plan's 70–110 default; the Hush from Icefang Hamlet; the full island with the Wickmother as its final boss;
every other default). Lantern Fen is the east side island: a marsh of ghost lights, the theme from another angle,
grief. L0 is its landing: the crossing, the town, its four people and its first wilds (the Shallows,
`docs/places/shallows.md`). The rest comes in L1–L5 (`story/roadmap.md`).

Files: the town's layout in `src/shared/rpg.js` (`WICKMERE`, `WICK_W`, `NETTA_X`, `WICK_DOCK_X`, `WICK_WAY_X`,
`WREN_X`, `WICK_SPAWN_X`, `WICK_HOME_X`, `HOB_X`, `STILLMERE_GATE_X`, `SEDGE_X`, `WICK_EXIT_X`, `WICK_PLATFORMS`,
`SHOPS.wren`, `SHOPS.sedge`, Sedge's tier: `reedcutter`, `willow_staff`, `wicker_bow`, `reed_hood`; `FJORD_HUSH_X`),
the rooms in `src/shared/sim.js` (`FEN_OUT`, `FEN_HOME`, `ROOMS[WICKMERE]`, the Hush's door in `ROOMS[FJORD]`, the
`TOWNS` entry, the four `NPCS`, their `SLAP_QUIPS`; Ione's `folk`), the town's drawing in `src/wickmere.js`
(`drawWickmere`, `drawWickmereView`, and `drawFenSky` / `drawFenAir`, shared with the Shallows), the fen folk's look,
the people's clothes and Sedge's gear in `src/wickmere-art.js` (`FEN_PALETTE`, `drawFenFolk`, `drawFenDress`,
`FEN_SWORDS`, `FEN_HELMETS`; the staff and bow in `src/staff-art.js` and `src/bow-art.js`), the crossing in
`src/crossing.js` (the `'fen'` route: `drawFenSea`, the Fen's coast in `drawCoast`, the Hush in `SHIPS`, her bow
lantern), the Hush at anchor and her lantern post in `src/fjord.js` (`drawHushAtAnchor`, `drawHushPost`), the Fen's
landmark in every sky in `src/distant.js` (`drawLanternFen`, the `fen` view), the island map (`LANTERN_FEN` in
`src/shared/branches.js`), the gate art in `src/branch-gates.js` (`drawPunt`), the waystone in
`src/shared/waystones.js`, the personas in `server/characters.js`, the `fenroute` and `wickmere` music scenes in
`src/audio.js`, the World map in `src/worldmap.js`, the telescope's view in `src/cliffs.js`.

## What it is
- **The way there** (owner's pick: Ione's road): **the Hush**, Skipper Netta's black eel-boat from the Fen, lies at
  anchor out in Icefang Hamlet's fjord between the ferry and the Lodestar (drawn small and far out, her violet bow
  lantern lit). On the quay between the two ships stands her **lantern post**, a ladder down and Netta's chalk board
  ("HUSH · EAST"); its door (`FJORD_HUSH_X`) asks first and boards `FEN_OUT`. Label "Lv 150+", no gate. Nothing was
  shown before at the hamlet: the Fen's "seen" was Pilgrim Ione at the Skydocks camp and the violet blur from the
  balloon; the update brought the boat in (owner's rule: no quest).
- **The crossing** (`docs/places/crossings.md`): route `'fen'`, two decks, `FEN_OUT` (room 71, the slow one) and
  `FEN_HOME` (72). A side trip, so shorter than the Lodestar's long voyage. The deck is the shared ship; the Hush's look
  in `SHIPS` (black hull, a violet band, a dun sail, a stove pipe) and **a lantern on a pole at her bow**. Netta stands
  at the tiller on both decks (`also`). The sea (`drawFenSea`, driven by `f`, how far toward the Fen): the hamlet and
  the aurora astern, the grey northern water stilling and going dark, mist in the middle of the crossing, then **the
  dead's lanterns adrift on the water**, more and more, a moon's path, lily pads and fireflies, and Reedwater's jetty
  and Wickmere's stilt houses out of the fog. She ties up at Wickmere's jetty.
- **Wickmere (room 70, a town and a safe room)**, with **Reedwater** as its waterfront, one room like Icefang Hamlet and
  Forgehold: stilt houses on a boardwalk over black still water, a lantern in every window. West to east:
  **Reedwater's jetty** with the Hush tied up alongside (her gangway, `WICK_DOCK_X`, boards `FEN_HOME`) and **Netta's
  eel boxes** (a platform), the **waystone** on the landing, **Wren's lamp stall** where **the Lamp Walk** begins (a
  lantern post every few steps along the boardwalk, each with a name tag on a string, every one lit), **the great
  lantern stand** on its landing (you wake by it, `WICK_SPAWN_X`), **the stilt house whose door is everyone's own
  front door** (`WICK_HOME_X`; its balcony is a platform, like the other houses'), **the lantern gallery** (a plank
  walkway on two tall poles, hung with lanterns: a platform), **Ferryman Hob's punt** drawn up on the boards (a gate,
  below), **Sedge's reed shed**, and the boardwalk's east end running off into the reeds (`WICK_EXIT_X`, into the
  Shallows). Behind: a violet dusk, a low moon, the still mere with the dead's lights drifting far out on it, and far
  across the water the line of the **Lantern Causeway's** lamps going off into the mist (drawing only: seen, not
  reached, `story/phase8-plan.md`).
- **A town** (owner's rule, `docs/world.md`): in `TOWNS`; you wake by the lantern stand, your house's front door lets
  you out here, houses can take Wickmere as their window view (`drawWickmereView`). Its waystone has a new island,
  `isle: 'fen'` (the Fen's stones: peat-dark and wet with a slime tide line, and a candle stub kept lit on top).
- **The fen folk's look** (`folk: 'fen'`, `src/wickmere-art.js`): pale, see-through violet-grey jelly with a soft warm
  light deep inside (as if each carries a small lantern) and a faint mist line, the slow folk wobble. **Pilgrim Ione**
  at the Skydocks camp got it in the same update (`docs/places/skydocks.md`).
- **The Fen in every sky** (`src/distant.js`): a low dark island lying in its own violet mist, lights hovering over it
  (its landmark is the lights, not a shape): east of Greenhollow, south-east of Frostpeak, north-east of Emberdeep. From
  Wickmere the view faces west over the mere (the `fen` view). The east cliffs' telescope has a fourth view of it
  (`docs/places/cliffs.md`).

## Its people (AI characters with memory, `docs/social/ai-characters.md`)
All four are fen folk. None says the Wickmother's name ("the Mother", and a change of subject): the story stays hidden
(owner's rule), and their lore is Tier 0 plus their trade and their island. Wren knows the old funeral songs that name
"the Keepers" without knowing who they were. Personal lives lean into grief and holding on.
- **Skipper Netta** (`netta`, at her eel boxes; at the tiller on both decks): the crossing, no fare. Smokes eels for
  Runa's shed and loses every argument about salt. Her husband's lantern hangs in the wheelhouse window and she talks
  to it about the weather. Steers round every drifting lantern, never over.
- **Wren the Lamplady** (`wren`, trades: `SHOPS.wren`, potions she calls lamp oil): tends every lantern on the Lamp Walk.
  Her husband's lantern is the oldest on the Walk; she has wanted for years to let it go out and can't. Nobody's lantern
  in Wickmere has ever gone out, and she doesn't let herself think about why.
- **Ferryman Hob** (`hob`, no trade): his punt is the way to the Still Mere (L2), drawn up on the boards "with the mere
  this high". Twelve grandchildren and no lantern for any of them; carves willow ducks; can't swim.
- **Sedge** (`sedge`, trades: `SHOPS.sedge`, the island's first gear tier and the potions): a young reed-weaver who has
  lost no one and keeps a lantern lit "for practice". Wants to see snow.
- **Changed by the update:** Runa (Icefang Hamlet) buys Netta's eels and tells travellers about the Hush; Ione may now
  say the way home is open (and still never names the Wickmother).
- **Changed by L1:** all four know Firefly Hollow is open again (Hob and his two eldest sawed the willow through) and the
  Grove's water is down; Wren, Hob and Sedge speak of the Sitting Stones, and of Long-Neck on her nest (Wren understands
  her better than she says). The mere itself is still too high for Hob's punt (L2).

## Gates here (`LANTERN_FEN`, `docs/places/branches.md`)
- **The Still Mere** (L2): Hob's punt at `STILLMERE_GATE_X`, drawn up on the boards, his pole laid along it, the mere
  lapping over the boardwalk's edge behind (`drawPunt`): "Hob's punt is drawn up on the boards. 'Not with the mere this
  high,' he says." L2's update puts it in the water.

## Numbers and the sheet
Sedge's tier is aimed at the island's start (`aim`, `docs/economy.md`): the Reedcutter, the Willow Staff, the Wicker
Bow and the Reed Hood, a step above the Skydocks' and Kestrel's, within `GEAR_FIT`. The town has no mobs.

## Decisions and history
- 2026-11-10: (a) on paper (`story/phase8-plan.md`). 2026-11-11: the owner chose Lv 150–180 (new top-end content past
  the Citadel) over the plan's 70–110; the Fen is still a side island in the story (reached from the north, off the
  main road) and adds no canon tier.
- 2026-11-11: L0 built: the Hush, the `'fen'` crossing, Wickmere, its four people, the fen folk look, the Fen in every
  sky and on the World map, and the Shallows. **Not played by anyone yet**; no headless test (owner's rule), only a
  build, the sheet, a server boot and a draw check of every new drawing function in Node against a fake canvas.
- Where the Hush ties up at the hamlet: the quay was full (the ferry, the Lodestar, the Skerries path), so she rides at
  anchor out in the fjord and the door is a lantern post and ladder on the quay between the two ships.
- Rough edges: the Hush's deck is the shared ship (the same size as the ferry, not a small eel-boat); the town's
  Lantern Causeway is a line of lights in the sky band, not yet a place.
