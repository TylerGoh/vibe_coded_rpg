# The Buried Observatory (room 101, Lv 222–232) and the Sunroller's den (room 102, the Dial Floor)

Atlas Phase 9, A1 (`story/phase9-plan.md`; the town is `docs/places/amberdune.md`, the room before it
`docs/places/glassdunes.md`). The Keepers' star-dials half swallowed by sand on east from the Glass Dunes: great bronze
rings standing up out of the dunes green and gold, a sundial's gnomon as tall as a tower, steps going down into the sand,
and under the sand everywhere the bronze lines of the dial floor showing through. Down in it, the Sunroller rolls its
stone sun round and round.

Files: the room in `src/shared/rpg.js` (`OBSERVATORY`, `OBS_W`, `OBS_EXIT_X`, `OBS_WAY_X`, `OBS_STONE_X`, `GNOMON_X`,
`BURIED_GATE_X`, `SUN_DEN_X`, `SUN_DEN`, `STORM_GATE_X`, `OBS_ZONES`, `OBS_PLATFORMS`, the `STAGES` row, the four mobs,
the Sunroller, their materials and gear, the spawns, the `DENS` row), `ROOMS[OBSERVATORY]` and its door in
`ROOMS[GLASSDUNES]` (`src/shared/sim.js`; the den door comes through `denDoors(OBSERVATORY)`), the room's drawing in
`src/observatory.js` (`drawObservatory`), the creatures and materials in `src/observatory-art.js` (`OBS_MOB_ART`,
`OBS_ICONS`), the rare helm and the Sunroller's gear in `src/dune-art.js` (the staff and bow in `src/staff-art.js`,
`src/bow-art.js`), the den, its way in, the Sunroller, The Long Day and its freeing in `src/dens-sun.js` (theme `sundial`,
registered in `src/dens.js`), the Dial Stone in `src/ruins.js`, the gates' art in `src/branch-gates.js` (`drawSandfall`,
`drawRedStorm`), the waystone in `src/shared/waystones.js`, the sentry's beam (`sunbeam` in `src/hazards.js`), the rings
of sunlight (`sun` in `src/hazards.js`, `looks.rings`), the glare (`drawGlare` in `src/challenge.js`, `looks.gaps`), the
den's heat pulse (`noon` in `src/party.js`, `looks.pulse`), the `observatory` and `sunroller` music scenes in
`src/audio.js`, its pet in `src/shared/house.js`, its freed change in `src/shared/story.js` (`BOSS_TIER`) and
`server/lore.js` (`FREED`).

## The room
West to east (`OBS_ZONES`):
- **The Sunken Steps** (no mobs): broad stone steps the trail comes down over into the sand; a waystone (`OBS_WAY_X`).
  **The Dial Stone** (`OBS_STONE_X`, read with E): a Keeper stone buried to its shoulders, a dial on its face (a ring of
  gear teeth, a sun in the middle, the stars round it cut twice, the second set lighter: the stars moved, which everyone
  knows), and below it, where someone has scooped the sand away, small figures walking east, and beside them something
  much bigger walking the same way, too worn to make out (the atlas's hint at Old Carapace, shown, never told). Amberdune
  adds no canon tier, so the stone says no more than Tier 1. A string of the caravan folk's blue beads is tied round it.
- **The Ring Walk** (222–225): the great rings half sunk in the dunes, star marks along them; fallen ring arcs laid across
  stone blocks (the `ring` platforms).
- **The Gnomon** (225–229): the gnomon itself (`GNOMON_X`), a great wedge of bronze-clad stone with the hours cut down its
  edge, a bracket ledge on its side, its long shadow lying east across the dial floor. **The noon mark** on its top is the
  hidden spot (last in `OBS_PLATFORMS`). **The stair down to the Buried Caravanserai** (`BURIED_GATE_X`): a dark
  doorway between two bronze ring-ends, the steps going down. A1's gate had **sand pouring down over them** from a crack
  above in a steady fall (kind `sandfall`, "buried a little deeper every hour"); A3 stopped it (the crack dry, the heap
  shovelled aside, an amber lamp hung in the doorway: the `open` look, now an `entry`), and the stair goes down to the hard
  pocket (`docs/places/buried.md`).
- **The Dial Court** (229–232): **the Sunroller's den** opens at `SUN_DEN_X`: a round opening in the sand under a bronze
  arch with a sun on its keystone, steps going down into the light, a groove worn in the sand round it, and now and then
  the top of the stone sun going by far down there.
- **The far end**: the old caravan road going on east. A1's gate was **a standing storm** across it, a wall of red sand
  from the ground to the sky, churning and not moving, the road's marker stones going into it (`STORM_GATE_X`, kind
  `redstorm`). A4 drew it back east (the update did it): the road goes on clear between its marker stones with the red far
  off down it (the `open` look, now an `entry`), onto the Storm Road (`docs/places/stormroad.md`). The sky still reddens
  toward it and the dust thickens.
- **Freed** (per character, `docs/social/story.md`): for a slime who has freed the Sunroller the gnomon stands at noon and
  casts no shadow, only a pool of shade at its foot; Caravanserai's four know.

## Its mobs (on the frozen curve: `docs/economy.md`)
- **Dust wraiths** (224): the old astronomers' dust in the shape of a hooded slime, motes turning in it like stars; they
  fade out and come back with a pulse (`phase`).
- **Dial sentries** (227): Keeper-made watchmen still on watch, green-gold bronze on three short legs, a dial ring turning
  round them, one sun-glass lens that brightens and throws a beam of sun (`beam`, style `sunbeam`); the rare **Dialwatch
  Helm** (Lv 227).
- **Sand asps** (229): lie under the sand with only the head and a coil showing, rear and lunge (`shell` with `cut: 0`,
  the reed stalker's).
- **Amber moths** (231): big, slow and golden, old things caught in their wings; they hang high and stoop (`dive`). The
  Sunroller's minion.
- No elites, no field boss (the Buried Caravanserai has both: `docs/places/buried.md`).

## The Sunroller (den 102, Lv 232)
A den boss with a story (`story/phase9-plan.md`): a great scarab as big as a wagon, blue-black with a gold sheen, rolling a
stone sun round the observatory's dial floor to keep the hours turning, because the Keepers told the hours by it and
nobody ever told it to stop. A shard in its back. Holding on: the old sky's time.
- **The den, the Dial Floor**: a round court sunk deep in the sand and open to the sky (the real sun straight overhead),
  dressed stone walls with an hour-stone for each hour (cut in tally strokes, no numerals), sand streaming down them, the
  bronze dial floor with its hour lines and the groove the sun has worn round and round; the ledges are hour-stones fallen
  out of the walls onto bronze brackets. The name hangs on a bronze dial-plate.
- **Its look**: head bowed against the stone sun it pushes ahead of it (the sun is part of its body, at the front, cut
  with a sun face, gold-veined), six legs, two wing-cases with a seam down the middle. Walking, the sun turns; charging,
  it turns fast and dust flies; on a warning the wing-cases lift a crack and gold light shows, and the sun glows. The shard
  glints between the wing-cases near the top (`weak`: in reach with a jump).
- **Its moves** (`phases`): charges (the sun rolled at you), slams, rain, `late` in every phase, and from phase 2 its
  minions and **rings of sunlight** off the sun (`orbs`), from phase 3 leaps, barrages and **the glare**.
- **Challenges from day one** (`ch`, `docs/combat/challenges.md`): **late tells** (every phase: the shadow on the dial
  comes too late), **bullet rings** (phase 2 on, `looks.rings` `sun`), and **thin gaps** (phase 3): the dial floor goes
  white with glare everywhere but one strip of shade, the gnomon's shadow (`looks.gaps` `glare`, `drawGlare`).
- **Party** (S5.4): the weak point, a heat pulse ("NOON", `looks.pulse` `noon`), and freezing its ultimate as it gathers
  cancels it.
- **Its ultimate, The Long Day**: the shared `wave` ult drawn as the stone sun rolling the length of the den (`ULT_LOOKS`:
  the sun drawn back and rocking, glowing hotter, then rolling, dust behind it). Jump it or get up on a ledge.
- **Its lines** (`lines`): "Mind the dial. The hour is coming round..."; at phase 3, "I will roll it till the sky
  agrees!"; freed, "...Noon. There. It has come to noon. ...And it can stay there."
- **Freed** (the den's bossDie, `SUN_FREED_S`): the sun rolls to the middle of the dial and stops, a shaft of noon light
  comes straight down on it, and it rests there until the Sunroller is back.
- **Rewards** (`docs/combat/items.md`, `docs/economy.md`): the **Gnomon Blade** and its twins the **Sundial Staff** and the
  **Scarab Bow** (Lv 233, 9 slots), the **Scarab Crown** (Lv 233, 9 slots), Sunstone Chips, coins, royal sap, scrolls;
  the **mini Sunroller** at the Pet Shop (`docs/places/pets.md`).
