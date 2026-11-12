# The Lantern Causeway (room 80, Lv 168–180) and Grandfather Mire's den (room 81, Grandfather's Pool)

Atlas Phase 8, L4 (`story/phase8-plan.md`; the room before it is `docs/places/grove.md`, the town `docs/places/fen.md`).
Lantern Fen's main trail at its top: an old stone causeway straight out across the open mere toward the Hall of Lamps,
posts both sides with a lantern on every one, all lit, and the dead's lights drifting thick on the black water either
side. Near the far end, in his pool beside the road, sits Grandfather Mire, the Fen's party den; at the very end, the
Hall's door, shut with moth-silk (L5's gate).

Files: the room in `src/shared/rpg.js` (`CAUSEWAY`, `CAUSEWAY_W`, `CAUSEWAY_EXIT_X`, `CAUSEWAY_WAY_X`, `MIRE_DEN_X`,
`MIRE_DEN`, `HALL_GATE_X`, `CAUSEWAY_ZONES`, `CAUSEWAY_PLATFORMS`, the `STAGES` row, the four mobs, the Will-Queen,
Grandfather Mire, their materials and gear, the spawns, the `DENS` row), `ROOMS[CAUSEWAY]` and its door in `ROOMS[GROVE]`
(`src/shared/sim.js`; the den door comes through `denDoors(CAUSEWAY)`), the `causeway` node and the `hall` gate in
`LANTERN_FEN` (`src/shared/branches.js`), the room's drawing in `src/causeway.js` (`drawCauseway`, and `drawCausewayFront`:
the near side's lamp posts and mist in front of the slimes), the creatures, materials and gear in `src/causeway-art.js`
(`CAUSEWAY_MOB_ART`, `CAUSEWAY_ICONS`, `CAUSEWAY_SWORDS`, `CAUSEWAY_SWORD_LEN`, `CAUSEWAY_HELMETS`; the staves in
`src/staff-art.js`, the bows in `src/bow-art.js`), the den, its way in, Grandfather Mire and his freeing in
`src/dens-mire.js` (theme `mire`, registered in `src/dens.js`), the gates' art in `src/branch-gates.js` (`drawSunkCauseway`'s
open look, `drawMothSilk`), the waystone in `src/shared/waystones.js`, the Will-Queen's rings (`wisplight` in
`src/hazards.js`), his grid and fetters (`GRID.mire` in `src/hazards.js`, `PAL.mire` in `src/challenge.js`), his croak
(`PULSES.croak` in `src/party.js`), his gear's effects (`promise`, `sittight` in `src/shared/gearfx.js`), the `causeway`
and `mire` music scenes in `src/audio.js`, the two pets in `src/shared/house.js`.

## The way in
The Drowned Grove's east end (`CAUSEWAY_GATE_X`): until L4 the causeway's first stretch had sunk under the mere, its posts
leaning, their lanterns drowned and still lit (a gate). The update raised it (the owner's rule: no quest): Hob's two eldest
and Sedge drove new bog-oak piles and hauled the stones back up (`drawSunkCauseway`'s open look: pale new piles under the
old grey stones, mud and weed still on them, the leaning posts stood up and lit). The personas say who did it.

## The room
West to east (`CAUSEWAY_ZONES`); you come in at the WEST end:
- **The Causeway Foot** (no mobs): the raised stretch, new piles under it, mud on the stones, a coil of rope and a mallet
  left where the work stopped; a waystone (`CAUSEWAY_WAY_X`, `isle: 'fen'`: it's the main trail, not a pocket).
- **The Lamp Posts** (168–171): the causeway proper, lamp posts both sides, moths round every lamp.
- **The Open Mere** (171–175): old arches standing over the road. **The lantern facing home** (the find, last in
  `CAUSEWAY_PLATFORMS`): the broken arch over the Open Mere had a second storey once; one slim pier still stands on its
  lintel with a broken capstone across it, and on that, a small lantern on a stub of iron set facing back WEST toward
  Wickmere, when every other lamp on the causeway faces the Hall. Its tag says "come home" in a child's letters. Nobody
  in Wickmere mentions it (it's the Fen's theme; it names no one).
- **The Toad's Reach** (175–180): lily pads and toad spawn in the water beside the road. **Grandfather's Pool** opens at
  `MIRE_DEN_X` (`drawEntranceMire`): stone steps down off the road's edge into a reed-ringed pool, and just above the
  water two great gold eyes that blink, slowly, and the hump of a warty back with a lily pad on it.
- **The Hall of Lamps' door** (`HALL_GATE_X`, a gate, L5): the causeway runs up to a great pointed doorway in a wall of
  grey willow bark, and the door is shut with moth-silk, sheet over sheet, moths asleep on it, lights moving slowly
  behind it (`drawMothSilk`, which already has its `open` look and its `OPEN` row: the silk cut down). On the horizon the
  Hall itself (a great hollow willow lit from inside, its crown hung with silk) grows as you walk east and ends up behind
  its own door (`drawHall` in `src/causeway.js`).

## Its mobs (on the frozen curve; no elites: not a hard pocket)
- **Lamp moth** (169): a lantern moth grown huge on the causeway's lamps, wings like old parchment with an eye on each;
  hangs over the posts and stoops (`dive`, `fly` 62, under the 70 px notice limit).
- **Drifting light** (170): a little flame come loose from a lantern adrift, a bead of glass under it; passive, a slow
  flier ("harmless, too many", the plan). Its material, the Stray Flame, leans toward the Hall however you hold it.
- **Causeway guard** (174): an old fen slime on stilt legs in grey reed armour and a tall reed hat with a lantern on its
  crest, a woven shield across its front (`shell`, the lamp crab's: get round behind). They stood the causeway for the
  Mother so long they forgot why. Drops the **Causeway Helm** very rarely.
- **Mire toad** (178): Grandfather Mire's, squat and warty, gold eyes; hops and flicks its tongue (`lob`, style `mud`, the
  mire frog's). His minion in the den.
Materials: Moth-Silk, Stray Flame, Guard's Reed, Toadstone (`docs/economy.md`).

## The Will-Queen (field boss, Lv 176)
A great will-o'-wisp as tall as a house, a cold white flame with a warm core, a crown of small flames, long calm dark eyes,
a veil of light trailing behind her, a court of little lights circling. No story of her own (the plan's field boss). She
drifts over the Open Mere (spawns 2200–3300), passive until hit; then she stoops (`dive`, `fly` 80, like the Brimstone
Condor). T3 challenges from day one (`chf`): **rings** of wisp-light (`looks.rings: 'wisplight'`), and from her second
third **the turning light** (`swap`, the controls swap: a slow light that turns you round, what a will-o'-wisp does to
travellers). The punish window like every field boss. S5.4: focus, and a pulse (the mere's cold mist, the Narwhal's
`breath`). Drops **Queenlight** with its twins (the Queenlight Staff, the Queenlight Bow), the **Will-Queen's Veil**,
Will-Queen's Glow and Stray Flames, coins; the mini Will-Queen at the Pet Shop.

## Grandfather Mire (party den, Lv 179, Grandfather's Pool)
- **Who he is** (the plan): a toad as big as a boathouse, older than the causeway, a lily pad grown on his head like a cap.
  Long ago the Mother asked him to sit across the causeway and let nobody by to the Hall; he promised, and she has never
  come to say he may stop. Holding on to a promise. He isn't angry with anyone; he's sorry, and he will not move. Every
  grandmother in Wickmere took him crickets as a girl (Wren, Sedge); Hob gave him a carved duck once and he ate it.
- **The den** (`dens-mire.js`): the pool beside the causeway, wide and still, ringed with reeds, lily pads thick on it, a
  few of the dead's lights drifted in; the causeway runs across the back on its arches, every lamp lit. The ledges are
  causeway stones fallen into the pool (they sink: the moving arena). The name on an old toll board hung on chains.
- **His moves** (`bossBrain`, Sigrun's pattern of three phases, each adding moves): slam, charge (a lunge, mouth open),
  leap, then rain, summon (mire toads), and in the last phase barrage and grid (the pool welling up between the stones:
  `GRID.mire`). Ultimate: **The Long Promise** (the `wave` ult drawn as the pool's water heaving along the den when he
  settles his weight: `waterMass`, the Tidemother's and Old Gullet's). Jump it.
- **Party mechanics** (`partyDen`, `partyLive`, `top`): focus; **armour** (his hide puffs and hardens, the Colossus's
  armour drawn in mossy scutes, `looks.shell: 'scute'`: heavy hits crack it); pulse (**his croak**, `looks.pulse:
  'croak'`, "CROAK"); **weak point in his throat sac** (`weak.front`: the sac puffs out under his chin to croak, the shard
  glinting inside; from the front, low enough to hit from the floor); adds (mire toads); interrupt (freeze The Long
  Promise as he heaves up). Unlike Sigrun and Brenna there's no front wall: the party's split is armour-breakers (heavy
  hitters) and whoever faces him for the throat. Alone he's a long fight (the sheet: ~2.3× the party).
- **Challenges from day one** (`ch`, `docs/combat/challenges.md`): **the stones sink** in every phase (`arena`, the Root
  Warden's moving arena: the ledges go down into the pool, more each phase, and from phase 2 the floor between them
  wells up); from phase 2 **the toads' chorus** (`fetter`, the rhythm lock: weed and spawn wound round you, each arrow on
  the beat, drawn `PAL.mire`); in phase 3 **he takes one of you into his mouth and sits** (`cage`, the rescue trap, 2+
  fighting: a friend enters its arrows). The punish window like every den.
- **`lines`**: enter "Hrrm. No further, little ones. Not past me. I promised.", the phases wearing from "She asked me so
  kindly" to "Until she does I do not move. I do NOT move!", freed "...She is not coming to tell me, is she. Then I shall
  tell myself. There. I have got up. Oh, my old legs. Go by, little ones. Go by."
- **Freed** (`drawMireFreed`, `MIRE_FREED_S`): he heaves himself up and steps aside, in three slow hops, into the reeds at
  the den's east end, and sits down there with his eyes shut, his cap's flower open; the den keeps him there until he's
  back (`drawSitting`). He doesn't open the Hall's door (the moth-silk is L5's, and the plan's "he steps aside" is the
  den's own moment, per kill, like every boss's freeing).
- **Rewards**: Grandfather's Promise with its twins (the Toadstone Staff, the Long-Promise Bow), Grandfather's Cap, Mire
  Pearls, coins; the mini Grandfather Mire at the Pet Shop. As a `top` boss his gear carries effects (`docs/combat/items.md`):
  the weapons' **The Promise** (each hit on the mob you hit last does `PROMISE_STEP` more, up to `PROMISE_MAX`; a different
  mob first breaks it, that hit × `PROMISE_BROKEN`) and the cap's **Sit Tight** (still for `SIT_S`: damage taken ×
  `SIT_CUT`; walk × `BULWARK_WALK`, Sigrun's helm's `SLOW15` bit). No story tier: the Fen adds none.

## Personas that changed with it
Wren (the causeway walkable again, its dangers, the Will-Queen, Grandfather Mire and the crickets, the Hall's moth-silk
door "nobody has ever been in"), Netta (the Will-Queen leads boats astray too; Grandfather by the far end), Hob (his two
eldest drove the piles, he's proud; the duck Grandfather ate; "he promised; you understand promises") and Sedge (she
helped haul the stones; the guards' reed armour, the best moth-silk, and who wove the Hall's door).

## Decisions and history
- 2026-11-11: built in L4. **Not played by anyone yet**; no headless test (owner's rule): a build, the sheet, a throwaway
  server boot, a draw check of every new drawing function in Node against a fake canvas, and the room, den, gate and
  gear drawn to screenshots from a static page (no game server) to check the layout by eye.
- Liberal decisions: who raised the causeway (Hob's eldest and Sedge), the zone names, the fourth mob (the mire toad, so
  the den's adds live in the room too), the lantern facing home as the find, the Will-Queen's `dive` and her turning
  light (`swap`: the plan only named her), Grandfather's armour-and-throat party split (no front wall, unlike Sigrun and
  Brenna), his three challenges (sinking stones, the chorus on the beat, swallowed and sat on), the Hall's door laid at
  the room's east end as L5's gate (the plan's "the Hall of Lamps' door shut by moth-silk"; the plan's map also has the
  Lamp Road coming up from the Peat Barrows: L5 (a) decided the Road comes up from below and this door stays the Hall's
  front door, which the Mother keeps shut, opening in (c) for a slime who has freed her: `story/l5-plan.md`; since L5 (b)
  it is one of the `hall` node's two gates, `docs/places/peatbarrows.md`), his gear's effects (`promise`, `sittight`).
- His freeing doesn't change the room (Phase 7's freed world changes go with story tiers; the Fen has none). Rough edge:
  the Toad's Reach still shows his eyes in the pool after you've freed him.
