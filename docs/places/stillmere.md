# The Still Mere (room 77, Lv 160–170) and Old Gullet's den (room 78, the Eel Pit)

Atlas Phase 8, L2 (`story/phase8-plan.md`; the town is `docs/places/fen.md`). Lantern Fen's side branch, reached by
Ferryman Hob's punt from Wickmere: open black water, islets of peat joined by stepping stones, low mist, and the lanterns
the fen folk set adrift for their dead thickest here, carried round and round. At the far end, the Gullet, the deep
reach over the old eel pit, where Old Gullet lies.

Files: the room in `src/shared/rpg.js` (`STILLMERE`, `STILLMERE_W`, `MERE_EXIT_X`, `MERE_WAY_X`, `GULLET_DEN_X`,
`GULLET_DEN`, `STILLMERE_ZONES`, `STILLMERE_PLATFORMS`, the `STAGES` row, the three mobs, Old Gullet, their materials and
gear, Hob's tier and his `SHOPS` row, the spawns, the `DENS` row), `ROOMS[STILLMERE]` and the punt door in
`ROOMS[WICKMERE]` at `STILLMERE_GATE_X` (`src/shared/sim.js`; the den door comes through `denDoors(STILLMERE)`; Hob's `NPCS`
entry has `shop: 'hob'`), the room's drawing in `src/stillmere.js` (`drawStillMere`, and `drawStillMereFront`: low mist in
front of the slimes, under the name tags), the creatures, materials and gear in `src/stillmere-art.js`
(`STILLMERE_MOB_ART`, `STILLMERE_ICONS`, `STILLMERE_SWORDS`, `STILLMERE_HELMETS`, and `drawLantern`, the fen's little
lantern every Fen L2 drawing uses; the staves in `src/staff-art.js`, the bows in `src/bow-art.js`), the den, its way in,
Old Gullet and his freeing in `src/dens-gullet.js` (theme `gullet`, registered in `src/dens.js`), the punt afloat in
`src/branch-gates.js` (`drawPuntOpen`, `OPEN.punt`), the waystone in `src/shared/waystones.js`, his swallow (`PAL.gullet`
in `src/challenge.js`), the `stillmere` and `gullet` music scenes in `src/audio.js`, his pet in `src/shared/house.js`.

## The way there
- **Hob's punt** in Wickmere (`STILLMERE_GATE_X`): until L2 it was drawn up on the boards ("not with the mere this high", a
  gate). L2's update let the mere down: the punt is in the water beside the boardwalk, tied to a post, its bow lantern
  lit, his pole stood up at the stern, a weed line high on the posts where the water was (`drawPuntOpen`). The door is a
  plain door, no Set sail card: it's a short pole across, not a voyage.
- Hob stands right beside it, so his talk range is a little shorter than the others' and the punt's door is a little
  wider and set a step east: E talks to an NPC before it opens a door (`drawHints`), and the two used to overlap.

## The room
West to east (`STILLMERE_ZONES`):
- **The Punt Landing** (no mobs): a low peat islet, a mooring post, Hob's punt tied up alongside (the way back, at its west
  end), the waystone (`MERE_WAY_X`).
- **The Stepping Stones** (160–163): islets and runs of flat stones, a stretch of old eel-trap staging with wicker traps
  hung off it to dry.
- **The Lantern Drift** (163–166): the drifting lanterns at their thickest, small lights on reed floats bobbing along the
  walking line, more of them out on the open water toward the horizon.
- **The Gullet** (166–170): the deep reach. The water darker, turning slowly, a glow far down. **Old Gullet's den** opens
  at `GULLET_DEN_X`: a ring of old eel-trap stakes round a round patch of black water, two lamps hung on them, a ladder of
  stakes going down, and now and then a great dark back curving up through it with lights showing through the skin. The
  far end is open water.
- You walk the punters' bar: flat stones laid just under the surface (`drawBar`), so the floor is the water's skin like the
  Shallows'.
- **The hidden spot** (last in `STILLMERE_PLATFORMS`): an old eel-trap stake standing up out of the mist off the first
  staging, a lantern tied to it whose tag the weather has washed blank. Nobody knows whose; somebody keeps it lit.

## Its mobs (on the frozen curve; no elites, no field boss)
- **Mist shade** (161): the mere's mist got up into a hooded shape, faceless but for two pale eyes; it thins to nothing and
  comes back with a cold pulse (`phase`, like the Grove's wisps but slower and wider).
- **Mere eel** (164): a long black eel along the bottom of the shallows; it goes under (only a fin and a ring show) and
  comes up behind you and bites (`blink`: the Knot spider's and the Aether Knight's brain). Old Gullet's minion.
- **Lamp crab** (168): a big black mere crab wearing a lantern stolen off the water on its back, claws up in front. The
  claws turn most of a blow from the front (`shell` with `cut`, the stoker warden's): get round behind it. Drops the
  **Crab Lantern** very rarely.
Materials: shade veil, mere eelskin, crab glass; Old Gullet's swallowed lamps (`docs/economy.md`). (The crab's material is
`crab_glass`, not `lamp_glass`: Wreck Cave's drowned lamp already drops a `lamp_glass`, and the first try overwrote it.)

## Ferryman Hob's trade
Hob trades from his punt in Wickmere (`SHOPS.hob`, at `HOB_X`): the potions, and his tier aimed at Lv 165, the middle of the
Fen's 160–170 (`lvl` 161 on the gear curve, the way Sedge's is aimed at 155): **Hob's Boathook** (sword), the **Punt-Pole
Staff**, the **Decoy Bow** (a carved duck in the grip), the **Oilskin Hat** (a duck on the band). No trader stands in the
Still Mere itself.

## Old Gullet (den boss, Lv 169, the Eel Pit)
- **Who he is** (the plan, `story/phase8-plan.md`): an eel older than Wickmere, as long as a street, at the bottom of the
  eel pit the fen folk dug long ago. Every lantern set adrift that sinks at last, he swallows and keeps, and he glows from
  the inside with all of them. The Fen's theme again (holding on): down there they'd go out and nobody would know; in him
  they're warm. His `lines` say it; he never names the Wickmother.
- **The den** (`dens-gullet.js`): inside the old pit, a round well of stacked stone going up into mist, lamps on iron hooks
  round the wall, black water over the floor with sunk lanterns glowing faintly under it; the ledges are stone courses
  with wicker eel traps hung under them; the way out is a ladder of stakes. Freed (`drawGulletFreed`, `GULLET_FREED_S`): he
  opens his jaws and the lights go up out of him and out of the pit, every one, and for a while after
  (`BOSS_RESPAWN_MS`) the last of them are still rising out of the water and the sunk ones are dim.
- **His look**: his body comes up out of the water behind him in a great black arch and down to a blunt heavy head held low,
  a pale lip and a small pale eye; the lanterns glow through his skin (clipped to him); the jaw drops wide on a warn and
  the glow shows inside. The shard is among the lights in his belly.
- **His moves** (`bossBrain`, the shared ones): charge, slam, rain, summon (mere eels), leap, barrage. Ultimate: **The
  Undertow** (the shared `wave` ult, drawn with the Tidemother's water: `waterMass` in `dens.js` takes his theme too).
- **Challenges from day one** (`ch: ['mash', 'dark']`, `docs/combat/challenges.md`): **swallowed** every phase (`gulp`, a new
  move name in `CHAL_MOVE` for the mash free, drawn as his dark jaws round you with the lights showing through:
  `looks.snare: 'gullet'`, `PAL.gullet`) and **the dark** from phase 2 (`dark` as a move of its own: the pit's lamps go out
  and the only light is round each slime and at him). `WARN` has both (a move missing from `WARN` gets a `NaN` timer). The
  punish window like every den.
- **Party mechanics** (S5.4): the shard glints in his belly (the weak point, in reach from the floor), the pit breathes up
  cold (a pulse, the Narwhal's `breath` look), and freezing The Undertow cancels it.
- **Rewards**: Old Gullet's Tooth with its twins (the Sunken Lamp Staff, the Eelbone Bow), the Eelskin Cowl, swallowed
  lamps, coins; a mini Old Gullet at the Pet Shop (`PETS`). No story tier (the Fen adds none).

## Decisions and history
- 2026-11-11: built in L2. **Not played by anyone yet**; no headless test (owner's rule), only a build, the sheet, a server
  boot and a draw check of every new drawing function in Node against a fake canvas.
- Lv 169, not 170: the Pet Shop's prices must rise with the boss's level, and Typhon's pet (Lv 170) sits right above.
- The plan's "mere eels surface and snap" is the `blink` brain (gone under, then up behind you); "lamp crabs: hit from
  behind" is the `shell` brain's front cut; "mist shades fade and pulse" is `phase`. No new brains.
- L2 also fixed an L1 slip: the Drowned Grove's music scene was keyed `grove`, which the Mushroom Grove's scene further
  down `SONGS` overwrote; it's `drownedgrove` now (`docs/ui/audio.md`).
- Rough edges: no freed world change (the Fen has no story tier); Old Gullet's challenges are the plan's starting numbers
  (the shared `MASH_N`, `DARK_S`), untuned.
