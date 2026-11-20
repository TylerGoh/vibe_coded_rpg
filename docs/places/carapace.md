# Old Carapace and his den, the Long Road (room 111, `LONG_DEN`)

Amberdune's final boss (atlas Phase 9, A5 (c); the approved design is `story/a5-plan.md`, every default standing: read it
before changing the fight). You reach him down the Dry Wells and along the Shell Road (`docs/places/drywells.md`), up the
climb at `CARAPACE_DEN_X`. He runs on the final-boss engine (`docs/combat/bosses.md`, "Final bosses") with his own brain;
Ladon, Fenrir, Typhon, the Wickmother and the Escapement are the other five.

**Status: A5 done**, built in one session with A4, 2026-11-20, at the owner's "continue with next two phases": the den, the
whole fight, its look, its track, its rewards and pet, and his freed changes. **Not played by anyone yet.**

## Where things are
- **Data.** In `src/shared/rpg.js`: `MOBS.old_carapace`, `MOBS.thirst_mirage` (his adds), the den's `DENS` row (theme
  `shell`, `CARAPACE_PLATFORMS`), `DUNE_TOP`. His FINAL row (brain `shell`, phases, loops, ultimates) is in
  `src/shared/final.js`. The arena, the Stride, the Well, the mirages and every tuning constant of his own are in
  `src/shared/carapace.js`.
- **Brain.** `server/carapace.js` (`createShell`: the loops, the Stride, the waterskins and the drink, the mirages' brain
  `son`, Lie Down and the Trample, `hold`, `poured`), picked by `createFinal` in `server/final.js`. The waterskins are A22's
  carry with a target (`opts.target`, `opts.x` in `server/challenge.js`; a throw into it calls `poured`, through
  `server/final.js` and `server/rpg.js`). `applyHits` multiplies `final.hold` into hits on him; the story record on a kill.
- **Client.** `src/carapace.js` (`CarapaceFinal`: the `final` message, which target a hit is on, the drink's window for
  Party.mod, the stride's tell, the Snap's marks, the well's water, the title card, freed), routed by `src/finals.js`.
  `src/dens-carapace.js` is theme `shell`: the den, his head and neck (`POSES`, eased), The Long Road's look, the pet.
- **Looks.** The pulse `stamp`, the shell `carapace`, the curse `thirst` (`src/party.js`, the dome is Typhon's `haze`); the
  rings `grit` (`src/hazards.js`); the gaps `sandwall` (the Red Wall's, `src/challenge.js`); the carry `skin`
  (`drawChip`).
- **Rewards and pet.** `src/drywells-art.js` (`DRYW_SWORDS`, `DRYW_HELMETS`), rows in `src/staff-art.js` and
  `src/bow-art.js`, `drawCarapacePet` (`src/dens-carapace.js`, hooked in `src/furniture.js`).
- **Music.** `carapace` in `src/audio.js` (slot 111).

## Who he is
A tortoise as big as a hill, so old the caravan's first town was built on his back. He carries the empty caravanserai of his
people across the desert toward where Pangelea's heart used to be (the middle of the sea, where the Maelstrom is now): shown,
never told. He has never stopped walking, and the town on his back is dying of thirst. A shard sits in him, under the town's
well. **Holding on: the journey itself.** Letting go is lying down. Nobody on the island says his name ("the Walker").

## The den
His back: the floor is the shell (its great plates going down under it, their growth rings, the road's dust in every
crease); the empty town on it (four striped tents with their flaps tied back on the dark inside, lanterns gone out on poles
with striped rags, the dry well in its ring of dressed stone at `WELL_X` with its windlass frame); the desert going by far
below, scrolling west as he walks (it stops when the town drinks); the sky going from afternoon (phase 1) to late afternoon,
dusk, and the storm's red over the east (phase 4). The town bobs a little on every step. His head and neck are the boss
(`BOSS_ART`), at the east end past the shell's front rim. The way out (`DEN_EXIT_X`) is the shell's rim going down, scales
stepped like a stair.

`CARAPACE_PLATFORMS`: a tent ridge and an awning at each end, and the windlass's beam over the well (`WINDLASS`). Each step
is about 100 px.

## The fight (numbers in `src/shared/carapace.js` and `FINAL.old_carapace`)
- **Title card** on walking in: "OLD CARAPACE" and `finalTag(DUNE_TOP)` ("Lv 270 · recommended Lv 250, 4+ players").
- **His body** never moves (`m.x` held at `HEAD_X`, facing east): the head and neck at the east end, from the floor up
  (`MOBS.old_carapace.w`, `h`). Melee has to get out to the front of the shell; arrows and spells reach from anywhere in
  range. Nothing about him hurts to touch (`noTouch`).
- **The four loops** (`FINAL.old_carapace.loops`):
  1. The Look → Snap → Stamp → (the road's dust: gaps) → (Drawn In), the last two every other loop.
  2. The Look → Snap → Stones → (sinking sand) → Stamp → (rings) → Dust → (Drawn In).
  3. Stamp → The Look → Snap → buried (rescue) → Stones ×2 → Drawn In or Dust by turns.
  4. An ultimate → The Look → Snap → the storm (dark) → Stamp → Stones → the hour backward (swap) → Lie Down → both shields.
  Its lines (entering, each phase, `lines.shield`, freed) are word for word from the plan.
- **The Stride**: he walks on `STRIDE_S` (a full step: the hind foot at phase 0, the fore at 0.5). Each footfall hits
  whoever's on the floor over that foot (`FEET`: the west and the east stretches) for `STRIDE_HP` of max HP, a flat `dot`,
  judged on the server (the Beat's pattern: the phase `sp` and period `ss` go out in the `final` message, the client draws
  the tell: the half about to land lifts, `STRIDE_LIFT` of a half-period ahead, dust streaming off it, a dashed line). A
  jump clears it; every ledge is safe; **the middle round the well is between the feet**. It stops while the town drinks.
- **The Well** (the Tick's role): a **waterskin** drops off a tent at one end (`SKIN_X`) every `WATER_EVERY` s (and soon
  after each one poured). Pick it up with the loot key, throw it with an attack toward the well (within `THROW_RANGE`).
  `WELL_N` in: **the town drinks.** He stops walking for `SLAKE_S`, staggers `SLAKE_STAGGER_S`, every hit on him does
  `SLAKE_MULT` × (`hold()`, the server in `applyHits`, the client in `Party.mod`; a DRINK pop), and the well drains dry. A
  skin not thrown in time bursts and spills (A22's burst). One slime can do it alone; two halve it.
- **The mirages** (phase 2 on): every `MIRAGE_EVERY` s `MIRAGE_BASE` thirst mirages (plus one for every `MIRAGE_PER` drinks,
  within the adds cap) come up off the road at the east end and drift west to the well. One at it drinks a skin's worth back
  out every `DRINK_S` (a pop with the well's level). Frozen, stunned, netted or knocked off, it starts again. Kill them.
- **The Look**: the focus (his gaze reaching back along the shell); **Thirst**: the curse (`looks.curse: 'thirst'`), on from
  phase 2 like every final boss's.
- **Snap** (`SNAP_WARN`): his head swings back over the shell and bites down at the mark; anyone on the floor within `SNAP_R`,
  lower than `SNAP_H`, judged on the client. Some come a beat late (`SNAP_LATE`: "..." then it falls).
- **Stones**: the generic `rain` marks, three a stride, in a line toward the looked-at slime.
- **Phase 3, the Long Walk**: every loop he walks a step faster (`STRIDE_STEP`, at most `STRIDE_STEPS`), and every drink
  slows him a step. Phase 4 walks at `STORM_STEPS` at least.
- **Lie Down** (phase 4): he lowers himself and the dry well's floor falls open: the shard is the weak point for `REST_S`
  (`REST_WEAK`; `MOBS.old_carapace.weak` puts it at the bottom of the well, reachable from the floor and the windlass).
  Filled: the long stagger. Not filled: **the Trample** (`TRAMPLE_HP` of max HP from everyone not on a ledge).
- **The ultimates** are the shared ones (`src/rpg.js` judges them), interruptible by a freeze in the wind-up:
  - **The Long Road** (`wave`, phases 1–2; by turns from phase 3): the road itself comes over his back, a wall of dust and
    stones the length of the shell (`SHELL_ULT`). Jump it or get up on a roof.
  - **Earthshaker** (`nova`): he rears and brings both forefeet down; the quake runs back down the shell. Safe only at least
    `NOVA_SAFE` from his head: back toward his tail.
- **The enrage** (`FINAL_ENRAGE_MIN`): he strides as fast as he can, the well never drinks, and a Stamp every
  `ENRAGE_STAMP_S` besides the loop's.
- **Freed**: his line. He lies down, his head on the sand ahead of the shell, eyes closed (drawn by `src/carapace.js` until
  he's back); the town settles: the flaps fall closed, the lanterns' rags hang still, the dust stops, the desert stops going
  by, the first stars come out over a still dusk.

## His challenges (from day one: `docs/combat/challenges.md`)
- The Snap's late tells (`late`) and the road's dust (`gaps`, `sandwall`) from phase 1; the waterskins (`carry`) all fight.
- Sinking sand (`mash`) and gravel rings (`rings`, style `grit`) from phase 2.
- Buried under a tent (`rescue`, 2+) in phase 3.
- The storm (`dark`) and the hour run backward (`swap`) in phase 4.

Its HP is cut by its uptime share like every boss with challenges, and also by `hold` (what a party nets after the time spent
carrying and the jumps on the footfalls, with the drinks' windows' extra), so the sheet's fight lasts what the real one
should.

## Every class's answer
The plan's table (`story/a5-plan.md`): the Stride (the well's middle, roofs, a jump on the footfall), the Well (two carriers),
the mirages (area attacks, knockbacks, freezes), the Look and Snap (the Knight's Rally), Drawn In (heavy hits), Dust (a Mage,
a Cleric's holy bolts), the Stamp (the Cleric's Barrier and heals), Thirst (Cleanse), the Long Walk (the town drinking), the
ultimates (Frostbinder freezes; a jump or a roof; back toward the tail), Lie Down (the Archer; melee from the floor or the
windlass).

## Its look
The soft procedural style: shell-horn, sand, old hide, caravan stripes and blue beads; no text in the canvas but the pops.
- `drawOldCarapace` eases a handful of numbers between poses (`POSES`: lift, back, tuck, low, eye): walking (looking
  ahead), looking back (the head turned west along the shell), snapping (reared back high), biting (lowered), stamping (up),
  drawn in, dust, lying down, drinking (eyes shut), staggered, the ultimates (head up), freed (down on the sand).
- The neck: thick and creased, its pale throat, rising out of the shell's front rim; the head a long rounded wedge with a
  beak worn smooth, dust in the creases, one old heavy-lidded eye.

## Rewards
One class weapon a kill (`twinPick`): **The Long Road** (Warrior), **the Walking Staff** (Mage), **the Well-Rope Staff**
(Cleric), **the Wayfarer's Bow** (Archer), Lv 259 on the frozen curve × `BOSS_GEAR.final`, 10 slots; **the Carapace Crown**
on a shared chance; coins, royal sap, Tally Stones and Drinker's Grit, scrolls. The **mini Old Carapace** at the Pet Shop
(its own art: a tortoise with three tiny tents on his back, walking very slowly). His gear's effects (`docs/combat/items.md`):
- **Miles** (the weapons): from `MILES_START` of your damage, `MILES_STEP` more every `MILES_EVERY` s you stay in a room, up to
  `MILES_MAX` (the client's own clock, `Gear.miles`); leaving the room starts it over.
- **Wayfarer** (the crown): walking heals `WAY_HEAL` of your HP a second in a combat room (server/rpg.js's once-a-second
  tick). Cost: DEF × `WAY_DEF`.

## Freed, for that character (`docs/social/story.md`, `BOSS_TIER` 0)
- **The hill on Amberdune's horizon lies still** in every sky: `drawDuneSky`'s walker, `drawAmberdune`'s hill and the Storm
  Road's walker read `isWalkerStill` (`src/distant.js`, set each frame by `src/main.js` from your story record): always in
  the same place, low and long, no dust.
- **Caravanserai's well rises a little** (water glinting near the top) and **Mother Dune has struck her tent** at last (rolled
  and tied in the Star Court, two packs and a pole beside it): `drawCaravan`'s `freed`.
- The four in Caravanserai know (`FREED.old_carapace`).

## Its music
`carapace` (`src/audio.js`, slot 111): D phrygian dominant at a walking pace, two great footfalls a bar, a hand drum between,
the shell's drone, the caravan's old song on a reed. Layered by phase (`PHASE_INTENSITY`): Thirst (a rattle of stones, a
walking bass), the Long Walk (the drum doubled, strings pushing), into the storm (the wind roaring up, the reed bent and
wailing), the enrage (every note bent sharp).

## Decisions and history
- 2026-11-20: built at the owner's "continue with next two phases"; every plan default.
- Liberal decisions (beyond the plan's): the shard at the bottom of the well (reachable from the floor there, not only from
  the windlass); two ultimates on the shared kinds rather than new ones; the Stride's `STRIDE_HP` cut from 0.16 to 0.1 when
  a headless run of the brain showed two thirds of the floor hit every two seconds; the gear's effects (Miles, Wayfarer);
  the `carry` banner made general ("throw it: back at the boss, or where it is wanted") so it reads right for the well too.
