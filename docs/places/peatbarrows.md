# The Peat Barrows (room 82, `PEATBARROWS`) and the Lamp Road (room 83, `LAMPROAD`)

L5 (b): the way to Lantern Fen's final boss, the Wickmother (`story/l5-plan.md`, "On the way there"; the pattern is E5's
`docs/places/underflues.md`, FB2's `docs/places/oldice.md` and FB1's `docs/places/sunkenroad.md`). Deep room, then approach,
then den (room 84, `WICK_DEN`, `WICK_DEN_NAME` "The Hall of Lamps": L5 (c)). The Fen's first place past Lv 180, and the
game's first numbers past 200 (the Wickmother's tag, Lv 210): owner, 2026-11-12, "don't be afraid to make the levels go past
200". `FEN_TOP` is 190 (the Fen was approved at 150–180; its deep room goes on to 190).

## The way in (the Sunk Barrows get better)
- **The peat cuts dug out:** at the Peat Hall's far end (`PEAT_GATE_X`), the cave-in over the old peat cuts (L3's gate) has
  been dug out and its roof timber propped up as a lintel, the dug peat stacked either side, steps cut down, lamplight
  coming up (`drawPeatFall`'s open look, `OPEN.peatfall` in `src/branch-gates.js`). Sedge and Hob's two eldest did it (the
  update itself, no quest). The door is in `ROOMS[BARROWS]`. On the island map it's one node, `peat`, under the Barrows
  (`LANTERN_FEN` in `src/shared/branches.js`; both rooms are its `rooms`).
- **The Hall of Lamps** (`hall`) is a node with **two gates** (a node's `gate` may be a list since L5 (b); `GATES` flattens
  them): the Lamp Road's inner door (`silkdoor`, `sign: false`, no art in `src/branch-gates.js`: the Lamp Road draws the door
  and its own sign) and the front door at the Causeway's end (`mothsilk`, L4's, `docs/places/causeway.md`). The plan's
  default: the Mother keeps the front door shut; in (c) it opens for a slime who has freed her (a freed world change).

## The Peat Barrows (Lv 180–190, a deep room on hard-pocket rules)
- Data: `PEATBARROWS_*` and the spawns in `src/shared/rpg.js`, the room in `src/shared/sim.js`. Art: `src/peatbarrows.js` (the
  room; `drawPeatBarrowsFront`: roots and silk hanging in front of the slimes), `src/peatbarrows-art.js` (mobs, gear, icons;
  the staff and bow are rows in `src/staff-art.js` and `src/bow-art.js`). Music scene `peatbarrows`.
- The old peat workings under the bog, where the fen folk cut their fuel and later carried their dead's lanterns down:
  walls of black cut peat with spade marks in rows, black bog-oak trunks lying in them, roots thick overhead, the roof
  coming lower going east, and the only light the lanterns set on ledges cut in the peat.
- Hard-pocket rules (`hard` in `STAGES`): red level chips, red-trimmed zone signs, **no waystone, no trader**, elites
  throughout. **You come in at the WEST end** (`PEATBARROWS_EXIT_X`, the foot of the cutters' ladder) and go east:
  - **The Cuttings** (no mobs): the ladder down, spades left standing in the face, a peat barrow with a few bricks still
    in it, a lantern on a hook.
  - **The Bog Roads** (180–183): the old corduroy trackways (logs laid side by side) along the floor and raised on posts
    (`trackway` platforms), a few lanterns on ledges.
  - **The Carriers' Way** (183–186): lanterns on every ledge, rows of them, and lanterns left on the floor where someone
    set one down and went back for another. **The child's lantern** (the find, last in `PEATBARROWS_PLATFORMS`): high on a
    root shelf, a lantern smaller than all the others, painted once, its tag big for it and scrawled in a child's hand
    (never readable). Somebody small carried it all the way down here. Kept to the Fen's own theme; says nothing about the
    canon.
  - **The Moth Cradle** (186–190): the Wickmother's brood. Silk wound down the roots, cocoons hanging on strands (a light
    moving in some), and at the far end the root stair up (`PEATBARROWS_END_X`), warm light coming down it: the Lamp Road.
- Mobs (legacy brains, on the frozen curve, `docs/economy.md`): **wick grubs** (181: her caterpillars, pale as tallow, a lit
  wick on the back like a candle's; `trail` with the new puddle style `tallow` in `src/hazards.js`), **peat wraiths** (183:
  mourners made of peat-smoke carrying a lantern; `blink`, drawn as a light moving under the floor while `m.special`),
  **lamp-bearers** (186: old fen slimes still carrying a lantern down, held out in front; `shell` with `cut`: get behind
  them; the rare **Lamp-Carrier's Hood**), **dusk moths** (188: great grey moths, eye spots like lanterns in fog; `dive`,
  `fly` 62). Elites: the Great Wick Grub, the Old Lamp-Bearer, the Dusk Moth Matron.
- **The Eldest**: a named elite at the far end (not a boss: no den, no phases, an ordinary respawn), the Wickmother's first
  child, a wick grub grown as long as a barge that never turned into a moth (old silk trailing off it where it began a
  cocoon and never finished), coiled across the foot of the root stair. It heaves itself at you like Garm and Orthrus (the
  `shell` brain's lunge with `cut: 0`), its wick flaring first. `elite('dusk_moth', …)` with its own `art` (`eldest`) and
  `fly` cleared, so the sheet checks it as an elite of the room's top mob, as Orthrus is of the stoker warden. Drops the
  **Cradle-Silk Blade** with its staff and bow twins (4%).
- Materials: Grub Tallow, Peat Smoke, Carrier's Tag, Dusk Scale.

## The Lamp Road (the approach: no mobs, no combat)
`src/lamproad.js`. Not a stage (no `STAGES` row, not a combat room): safe ground where the party gathers. Owner's rule:
everything cinematic here is drawing and sound, never `step()`, never a cutscene; you should feel shut in, never be.
- The way the fen folk carried their dead's lanterns up into the Hall from below: a stair of roots climbing landing by
  landing (`LANDING_W`; the flight you came up drawn in the wall behind each landing, a lantern left on its top step),
  under **a roof of moth-silk strung with lanterns**, every one lit, each with its paper name tag turning.
- `roadDepth(x)` (0 at the way in, 1 at the den's door) drives it all, from **your own** slime's x: the lanterns thicken,
  the silk comes lower and brighter, and across it **a huge shadow walks** (the Wickmother on the Hall's roof above,
  backlit, parallaxed slower than the road), bigger the higher you are; past `EYES_X` **two great eyes of lamplight** look
  down through the silk and follow you. **Her wings** (`wingBeat`, `WING_S`): with each slow downstroke the silk bellies,
  the lanterns swing and the wing-dust comes down in a flurry (`drawLampRoadFront`). The silk draws closed behind you over
  the way back (art only: the door back always works).
- Music scene `lamproad`: a music box waltz (3/4) over a held low note; the pad goes first, the music box's left hand by the
  middle, its notes ring longer the higher you are, and her wingbeat comes in under it as a soft deep whump every two bars.
  `audio.setDepth` is set every frame from `src/main.js`, as on the Long Flue.
- **Her line** (`WICK_LINE`): the first slime past `WICK_MARK_X` in an empty Lamp Road makes the server send
  `{t:'boss', a:'voice', who, text}` to the room (`lampRoadSaid` in `server/rpg.js`, reset when the room empties), as Typhon's
  and Fenrir's. A dark violet bubble with lamplit writing.
- **The Hall's inner door** at `WICK_DEN_X`: a tall pointed doorway in the great willow's root, grey ribbed bark round it,
  a curtain of moth-silk across it with moths asleep on it and light moving behind. **In (b) it holds**: it breathes with
  her wings (the curtain bellying in on each downstroke) and doesn't part; a gate (`silkdoor`, above). `WICK_DOOR_OPEN`
  (true once the den has a `DENS` row, L5 (c)) parts it to both sides as you come near. The sign beside it:
  `WICK_DEN_NAME`, `finalTag(FEN_TOP)` ("Lv 210 · recommended Lv 190, 4+ players") and a live count: a count, never a lock.

## Personas that changed with it
Wren (the old way up, under the barrows; she carried her husband's lantern up the Lamp Road once, as far as the door, and
came back without going in), Hob (he cut peat there as a boy; won't go), Sedge (she dug the cuts out "for the bog-iron" and
wants the Eldest's silk) and Netta (heard of it; changes the subject). Nobody says the Wickmother's name.

## Decisions and history
- 2026-11-12: built in L5 (b), with the Wickmother's plan (`story/l5-plan.md`) written the same day. **Not played by anyone
  yet**; no headless test (owner's rule): a build, the sheet, a throwaway server boot and a Node draw check of every new
  drawing function against a fake canvas. Nobody has seen the art by eye.
- Liberal decisions: the band past 180 (180–190, the owner's "past 200" note), the zone names, the four mobs and the Eldest
  (the plan named only the brood), the child's lantern as the find, the dug-out cave-in (L3's gate art already had that
  open look: Sedge and Hob's eldest, as with the Causeway), the Lamp Road coming up from below with the Hall's front door
  left shut (the plan's open decision 2), the node's two gates.
- No room hazard (the Foundry and the Blue Halls have one; the Peat Barrows' danger is the mobs).
