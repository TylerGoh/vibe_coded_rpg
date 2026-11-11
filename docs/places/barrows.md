# The Sunk Barrows (room 79, Lv 170–178, a hard pocket) and the Sleeper in the Peat

Atlas Phase 8, L3 (`story/phase8-plan.md`; the room before it is `docs/places/grove.md`, the town `docs/places/fen.md`).
The fen folk's old burial mounds, off the Drowned Grove's Root Halls: stone passages under turf roofs with roots through
them, a niche in every wall with a lantern in it for someone, and the Fen's deepest dead. Until L3 the passage under the
lantern lintel was full of black water (a gate, `barrowmouth`); the update let the water down out of it (no quest, the
owner's rule), and a line of grey silt and dried weed high on every wall shows where it stood. L3 also gave the Shallows
its field boss, **the Bog Bloat** (`docs/places/shallows.md`).

Files: the room in `src/shared/rpg.js` (`BARROWS`, `BARROWS_W`, `BARROWS_EXIT_X`, `PEAT_GATE_X`, `BARROWS_ZONES`,
`BARROWS_PLATFORMS`, the `STAGES` row with `hard`, the four mobs and their elites, the Sleeper, the Bog Bloat and the
boglings, their materials and gear, the spawns), `ROOMS[BARROWS]` and its door in `ROOMS[GROVE]` (`src/shared/sim.js`), the
`barrows` node and the `peat` gate in `LANTERN_FEN` (`src/shared/branches.js`), the room's drawing in `src/barrows.js`
(`drawBarrows`, and `drawBarrowsFront`: roots hanging in front of the slimes), the creatures, materials and gear in
`src/barrows-art.js` (`BARROWS_MOB_ART`, `BARROWS_ICONS`, `BARROWS_SWORDS`, `BARROWS_SWORD_LEN`, `BARROWS_HELMETS`; the staves
in `src/staff-art.js`, the bows in `src/bow-art.js`), the gates' art in `src/branch-gates.js` (`drawBarrowMouth`'s open look,
`drawPeatFall`), the grave lamp's shot (`lampoil` in `src/hazards.js`), the Sleeper's peat (`PAL.peat` in
`src/challenge.js`), the Bog Bloat's shedding (`shedTick` in `server/rpg.js`), the `barrows` music scene and the voices in
`src/audio.js`, the two pets in `src/shared/house.js`.

## The room
West to east (`BARROWS_ZONES`); you come in at the WEST end and go deeper and darker:
- **The Lintel Steps** (no mobs): wet steps down from the Grove under the lantern lintel, a little green daylight from
  above, puddles where the water went out last. No waystone (a hard pocket); the Grove's is a short walk back.
- **The Niches** (170–172): dry-stone walls with niches in rows, each with its lantern and name tag (a few gone dark).
- **The Long Barrow** (172–175): a long chamber of standing kerb stones (cup-and-ring marks) and fallen capstones, fewer
  lights. **The nameless niche** (the find, last in `BARROWS_PLATFORMS`): high in its wall, up off a burial shelf, a niche
  like all the others but with no name cut over it, and a lantern in it with no tag on its string, lit and trimmed.
  Nobody in Wickmere will say who it's for or who trims it (Wren thinks about it at night). Kept to the Fen's own theme;
  it says nothing about the Wickmother or the canon. (The Still Mere's blank-tagged lantern is a different thing: a tag
  the weather washed blank.)
- **The Peat Hall** (175–178): the deepest mound, cut down into the peat itself (spade marks in rows), roots thick
  overhead, the Sleeper's bed scooped in the floor with bronze grave goods and a ring of small lanterns round it.
- **The Peat Barrows' way down** (`PEAT_GATE_X`, a gate, L5): at the far end the old peat cuts go on down, but the roof has
  come in over them: a heap of black peat and turf, roots through it, a roof timber across, and lamplight showing through
  the cracks from below (`drawPeatFall`, which already has its `open` look and its `OPEN` row for L5). The plan put this
  block in L4; it's laid in L3 because the Barrows are its room (the "next shows but doesn't open" rule).

## Its mobs (on the frozen curve; elites only here)
- **Grave lamp** (171): one of the dead's lanterns grown into the barrow wall, a grey grave-post with an iron cage on top
  and a flame in it with two eyes. Rooted (`speed: 0`, `anchored`, like the Tubes' lava drip); it spits a drop of burning
  lamp oil (`lob`, shot style `lampoil`). One sits on the burial shelf under the nameless niche.
- **Lantern leech** (173): a fat black leech that has drunk so much lamp oil it glows amber inside; a plain chaser.
- **Peat mound** (175): a heap of cut peat bricks that got up and walks, turf on top; breaks into two **peat clods**
  (`split`; the clods are kept small, unchecked by the sheet). Drops the **Bog-Iron Helm** very rarely.
- **Barrow hound** (177): a lean old hound buried with its master, peat-dark, a reed collar with a bronze bell, still
  keeping the barrow; fast, low. Drops **Barrowfang** very rarely.
- Elites (`elite()`): the Great Peat Mound (the Long Barrow), the Old Barrow Hound (the Peat Hall).
Materials: Barrow Wick, Lantern Leech Skin, Barrow Peat, Old Collar (`docs/economy.md`).

## The Sleeper in the Peat (field boss, Lv 178)
- A great slime the bog kept, brown as strong tea and leathery, curled asleep under a blanket of peat with a bronze torc
  round it. No story of its own (the plan's "slow and sad"); it isn't one of the Fen's held-on things, and no freed moment.
- Drawn asleep (eyes shut, a slow breath) while its HP is full and nobody's on it; hit, it gets up, the peat sliding off,
  eyes half open and sad (`drawPeatSleeper` reads `m.hp` / `m.maxHp`; the plan's "rises when you near it" is this, not a
  new brain: field bosses are passive until hit).
- `stomp` (it rears up and comes down). T3 challenges from day one (`chf`): **late hands** from its first third, and from
  its second it pulls you down into the peat with it (**mash**, drawn `PAL.peat`). The punish window like every field boss.
- S5.4 (`partyLive`): focus, and a pulse (the barrow's cold breath, the Narwhal's `breath`).
- Drops the Sleeper's Blade with its twins (the Barrow-Oak Staff, the Peat-Yew Bow), the Sleeper's Hood, Bog Bronze and
  Barrow Peat, coins. Its pet, the mini Sleeper, is the dearest in the Pet Shop (`PETS`, above Chronos's: Lv 178).

## The Bog Bloat (the Shallows' field boss, Lv 158)
In the Shallows' Sunken Boardwalk (`docs/places/shallows.md`). A bog slime that never stopped growing, a brown see-through
dome with everything it has rolled over inside it (old boards, weed, a lost lantern still lit). Passive until hit; then
it wallows after you leaving stinging bog muck (`trail`, style `bog`, the bog slime's). **It splits as it's hit**: each
time its HP drops into a new third it sheds three **boglings** (`shed: { kind, n }`, new in L3: `shedTick` in
`server/rpg.js`, capped like a field boss's adds at `FIELD_ADDS_MAX` of its own minions; healed back over two thirds it
starts again), and it's drawn smaller as its HP goes. T3: rings of mud gobbets (`rings`, `looks.rings: 'mud'`, the mire
frog's shot). S5.4: adds (more boglings, `minion`) and focus. Drops the Bog-Iron Cleaver with its twins (the Bog-Glass
Staff, the Bogwood Bow), the Bloat Cap, Bloat Jelly and bog jelly, coins; the mini Bog Bloat in the Pet Shop.

## Personas that changed with it
Wren (the barrows drained, their lanterns still lit, the Sleeper, "leave it sleeping", the untagged lantern she thinks
about; the Bog Bloat), Netta (young fools go down into the barrows; the Bloat), Hob (his grandfather's grandfather is down
there and he won't go and see; the Bloat ate one of his ducks) and Sedge (the best bog-iron is in the barrows' peat; the
Bloat rolled over two of her reed beds).

## Decisions and history
- 2026-11-11: built in L3. **Not played by anyone yet**; no headless test (owner's rule): a build, the sheet, a server boot
  and a draw check of every new drawing function in Node against a fake canvas.
- Liberal decisions: the four mobs and their names (the plan named none), the zone names, the nameless niche as the find,
  laying the Peat Barrows' gate now, the Bloat's `shed` (the plan's "splits as it's hit" needed a little server code;
  the sheet doesn't model the boglings), the Sleeper's late hands and peat, both field bosses' numbers modelled on Old
  Crucible's by the curve.
- The Sleeper and the Bog Bloat have no music of their own (field bosses don't); the Barrows' scene is `barrows`
  (`docs/ui/audio.md`).
