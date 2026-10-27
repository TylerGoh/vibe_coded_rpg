# Fenrir, the Bound Wolf, and its den, the Wolf's Hold (room 52, `FENRIR_DEN`)

Frostpeak's final boss (FB2 (c); the approved design is `story/fb2-plan.md`, where the den is "the Glacier's Bed":
read it before changing the fight, its "Owner's answers" are settled). You reach it down the Old Ice and the Long Stair
(`docs/places/oldice.md`). It runs on the final-boss engine (`docs/combat/bosses.md`, "Final bosses") with its own
brain; Ladon (`docs/places/ladon.md`) is the other one.

## Where things are
- Data: `MOBS.fenrir`, `MOBS.skoll` / `MOBS.hati` (`son`) and the den's `DENS` row in `src/shared/rpg.js`; its FINAL row
  (brain `wolf`, phases, loops, ultimates) in `src/shared/final.js`; the arena, the reach, the anchors, the lanterns and
  every tuning constant of its own in `src/shared/fenrir.js`.
- Brain: `server/fenrir.js` (`createWolf`: the loops, the reach, Strain, the lanterns and the dark, the pack, the sons'
  brain `son()`), picked by `createFinal` in `server/final.js`, hooked into `server/rpg.js` (`stepMob`, `applyHits`,
  `damage`'s `knockAt`).
- Client: `src/fenrir.js` (`FenrirFinal`: the `final` message, which target a hit is on, the moves it judges itself,
  the title card, the dark, lanterns, fetters, frost lines and marks, its eyes over the dark, freed), routed by
  `src/finals.js`; `src/dens-fenrir.js` (theme `wolf`: the baked den, the wolf and its poses, Skoll and Hati, the dark
  layer, both ultimates' effects). Music: slot 52 in `src/audio.js` is Sigrun's track until its own comes (piece 2).

## The den
The bottom of the glacier: black-blue layered ice with things older than the hamlet frozen in it (ribs, a tree, a Keeper
lamp post, antlers: silhouettes only), a floor of bare rock scraped smooth, the Long Stair's last steps coming down into
the west wall (the way out). Two low ice ledges each side and one high one in the middle (`FENRIR_PLATFORMS`). Two
Keeper anchor stones each side (`ANCHORS`: a standing stone on the floor by the wall, one set in the wall over the
outer ledge), each carved with one of the fetter's impossible things (a paw, roots, a fish's breath, a beard). Six Keeper
lamp posts with the cutters' lanterns on them (`LANTERN_X`). The stone hand lies by the middle.

## The fight (numbers in `src/shared/fenrir.js` and `FINAL.fenrir`)
- **Title card** on walking in: "FENRIR, THE BOUND WOLF" and `finalTag(FROST_TOP)`, letterbox bars, you can move all
  the while. It's lying down when you come in and gets up for its first move.
- **The four loops**: 1. Watch → Lunge → Claw ×2 → Strain → (Rime Coat every other loop). 2. Watch → Lunge → Strain →
  Howl → Frost Breath → (Fetter Ward every other loop); the pack and the paw curse join. 3. Howl → Watch → Lunge →
  Strain → Claw ×2 → Rime or Ward by turns → Frost Breath; Skoll and Hati. 4. an ultimate → Watch → Pounce → Howl →
  Falling Ice → Rearing → both shields. Swallow the Light comes on a timer in phases 1–3 (`ultEvery`); from phase 3 it
  alternates with Fimbulwinter. Lines (enter, each phase, `lines.shield`, freed) word for word from the plan.
- **The reach** (`f.rc`, sent as `rc`): a band round the middle its jaws and claws can't pass, drawn as a frost line on
  the floor at each end. It walks (in its openings, after the watched slime) only inside it (`bodyRange`); the Lunge,
  Claw, Pounce landings are clamped to it (`reachClamp`). Each phase starts at `REACH_START` and stays within
  `REACH_MIN`..`REACH_MAX`; phase 4's is the whole den. The Howl, the breath, the ice and the ultimates ignore it.
- **The anchors and Strain**: a phase change snaps one fetter for good (`SNAP_ORDER`; the last, `TEETH`, runs to its
  mouth in phase 4). Strain: it lunges toward the watched slime and the held anchor on the far side cracks (its ring,
  `ANCHOR_RING`, open `STRAIN_S`). Filled: the anchor is set, it staggers and the reach shrinks `REACH_STEP`; not: the
  reach grows a step.
- **The lanterns and the dark**: lit, dark or relighting. Outside every lit lantern's pool (`LIGHT_R`, x only) you
  take `DARK_HP` of max HP a second (server-timed, `hurt(..., 'dot')`: no physics, nothing blocks). A Howl that lands
  (phase 2 on) puts out the lit lantern nearest it; a son swallows one; Swallow the Light all but two. A fire or holy
  hit (`fire` in `applyHits`: fire spells, a burn, Smite, the holy bolts) relights one at once; any other hit fills its
  ring (`LANTERN_RING`). **Hits on an anchor or a lantern don't hurt the wolf** (`prop` in `applyHits`; they still
  count as fighting it for the EXP and loot). The dark is one low-resolution layer, rebuilt only when the light changes
  (`drawDark`, `docs/performance.md`); telegraphs, rings, the fetters and its eyes are drawn over it.
- **Skoll and Hati** (phase 3 on): two named adds with their own HP bars, out of the dark ends. Each runs to the nearest
  lit lantern no brother is after and swallows it in `SWALLOW_S`; a freeze, stun or net, or a hit knocking it back at
  least `SON_KNOCK`, stops it there ("SAVED"). Killed, each comes back `SONS_BACK_S` later.
- **The pack** (phase 2 on): `black_wolf` minions out of the darker end every `PACK_EVERY` s, `PACK_BASE` plus one per
  `PACK_PER_DARK` lanterns out, within the adds cap.
- **Its moves' looks**: Rime Coat is the shell `rime`, Fetter Ward the dome `fetter`, the Howl the pulse `howl`, the
  curse `paw`, Frost Breath the beam style `rime` at floor or ledge height (`BREATH_FLOOR` / `BREATH_LEDGE`).
- **Moves judged on the client** (`src/fenrir.js`): the Lunge's and the Pounce's bites near the marked landing on the
  floor (`LUNGE_R`, `POUNCE_R`), the Claw's red box (`CLAW_W` × `CLAW_H`), the Rearing's landing (`REAR_R`, wide).
  Rearing (phase 4): the shard in the collar is the weak point for `REAR_S` (`REAR_WEAK`, front only, a jump for
  melee); filled, it staggers `GAZE_STAGGER_S` and doesn't land.
- **Ultimates** (both interruptible by a freeze in the wind-up; an uninterrupted one also hits for `TOP_ULT_HP`):
  Swallow the Light (`u.keep`: the two pools marked SAFE; fangs everywhere else; the rest go dark) and Fimbulwinter
  (`u.dir`: the snow streams the way it'll blow; safe only in the lee strips at the far end, `inLee`: the floor by the
  wall behind the low stone, `LEE_FLOOR`, or the wall end of the outer ledge, `LEE_LEDGE`).
- **The enrage** (`FINAL_ENRAGE_MIN`): every lantern out and none relight, the dark's cold rising `DARK_RAGE_MIN` a
  minute, a Howl every `ENRAGE_HOWL_S` too.
- **Freed**: its line; it lies down (the `freed` pose), the last fetter lies shining on the floor and the lanterns come
  back one by one (client art only).

## Every class's answer
As in the plan's table: ranged stand outside the reach, melee works the Lunge's pant; the Knight's Rally takes the Watch
and places the Lunge, Strain and Pounce; anyone sets the far anchor (arrows and spells reach it at any height); a Mage's
fire or a Cleric's Smite / holy bolts relight a lantern at once, anyone else slowly; knockbacks, freezes and stuns keep
the sons off a lantern; the shields, the Howl and the curse answer as on any S5 boss; a Frostbinder freezes either
ultimate's wind-up; arrows find the shard any time it's open.

## What was tested (2026-10-27, bots at TEST_SPEED=10, TEST_GOD, small TEST_BOSS_HP)
Seen with a party of four bots (Archer, Mage, Knight, Cleric on a phone): the Long Stair's door opens and the title card
shows; all four loops run in order with their phase lines; Strain answered (anchor set, stagger, reach shrinks) and once
unanswered (reach grows); the snaps at each phase; a Howl puts out a lantern, a fire / holy hit and a ring relight one;
Skoll and Hati come out and swallow lanterns, and are stopped ("SAVED"); both ultimates warn, a freeze interrupts them,
and both land; Rime Coat, Fetter Ward and both at once; Pounce, Falling Ice, Rearing's landing; the kill and the freed
line. **Not bot-tested** (owner stopped bot testing): the dark's damage (TEST_GOD hid it), the enrage, the Rearing shard
filling (no Archer stood in front), Ladon's regression after the engine split, the den on a phone (the phone page ended a
run back in Slimeville, cause not found). Two mid-fight screenshots came out washed pale (probably Fimbulwinter's hit
effect, which lasts the warning's length); worth a look in piece 2.

## Not done yet (FB2 (c) piece 2)
Polished art (the wolf's poses, the sons, the paw sigil, the den), its own music track (slot 52), the rewards (the four
class weapons, the Wolf-Pelt Hood; it drops Sigrun's `oath_blade` as a stand-in so `twinPick` works) and the mini
Fenrir pet. Numbers untested with people.

## Decisions and history
- 2026-10-27: built in FB2 (c) piece 1. The plan's "Glacier's Bed" keeps (b)'s room name, the Wolf's Hold. Hits on
  anchors and lanterns don't damage the wolf (the choice costs damage time).
