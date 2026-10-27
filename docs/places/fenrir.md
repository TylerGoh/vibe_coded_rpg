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
  layer, the lanterns, fetters and the anchors' cracks, both ultimates' effects); the frost paw curse is a look in
  `src/party.js` (`paw`). Its rewards and pet: `src/fenrir-art.js`, rows in `src/staff-art.js` / `src/bow-art.js`.
  Music: `fenrir` in `src/audio.js` (slot 52).

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
effect); c2 toned it down (Its look, below).

## Its look (FB2 (c2))
Menacing in the soft procedural style; no text in the canvas but the SAFE tags and OUT.
- **The wolf** (`drawFenrir`) is a skeleton, not a set of drawings: a hip and a shoulder (the body's axis between them,
  the torso outline built along it), jointed legs (hip, stifle, hock, paw; elbow, wrist, paw: outlined bones, round
  paws), a thick neck under a rimed ruff, the Keeper collar of dark stone blocks with the lock and shard at its throat,
  and the head (a heavy brow slanting down over pale pupil-less eyes in a dark mask, black lips, a fang that shows even
  shut, snarl creases when it bares its teeth, ears laid back when it means it). Every pose in `POSES` sets the same
  numbers (crouch, brace, rear, lie, rest, paw, ear, tongue, tail...), eased each frame, so it moves between poses
  instead of swapping. c1's forelegs came out of the body's middle and looked off: they now hang from under the chest.
- **Poses**: lying is a snowdrift with eyes (head on its paws, eyes half open, snow on its back that slides off as it
  gets up); standing; crouched for the Watch (hackles up); the Lunge in the air, then panting with its tongue out;
  the Claw with a forepaw raised and claws out; Strain hauled back on braced legs; the Howl with its head thrown back;
  Rearing (the rear pose puts the collar's shard on `MOBS.fenrir.weak`'s spot: move one, move the other); staggered;
  freed lies down with its head on its paws and its eyes shut.
- **The fetters** (`drawFetter`): ribbons of pale light that twist as they run (their width swells and pinches) with a
  shimmer travelling along them, hot and straight while straining. In phase 4 the last one's frayed end hangs out of its
  jaws, shining (`look.muzzle` is where the ribbon from its anchor meets it).
- **The anchors**: Keeper stones (a carved frame, a stone ring for the fetter, one impossible thing carved on each:
  the cat's footfall, the roots of a mountain, the fish's breath, the beard) baked with the den. A Strain's crack
  (`drawAnchorCrack`) runs up the stone and branches as its time runs out, light leaking out of it and chips falling;
  a snapped one (`drawAnchorSplit`) is split down the middle with a slab fallen at its foot.
- **The lanterns** (`drawLantern`): a cutters' lamp in a Keeper cage on a carved post; lit it throws a warm pool on the
  floor, dark it's cold iron with frost on the glass, relighting an ember grows in it. The dark itself is unchanged
  from c1 (one low-resolution layer, rebuilt only when the light changes).
- **Skoll and Hati** (`SON_ART`): shadow wolves with a haze of the dark round them and smoke streaming off behind.
  Skoll hunts the sun: long and lean, a flared mane with a gold rim, gold slit eyes, sparks off its tail. Hati hunts
  the moon: heavier, a short broad head, a pale crescent on its brow, round moon-white eyes, a silver rim and mist.
- **The curse** (`looks.curse: 'paw'`, `src/party.js`): a real frost paw print (pad, four toes, claw marks) in the
  ring, ice crystals standing round its rim; its own shape, not a recoloured star.
- **Fimbulwinter** washed the screen pale in c1 (a full-den fill for the whole hit): the warning now has no fill, only a
  cold haze rising off the windward end and thin snow; the hit flashes low and briefly, then the gale streams through.
- **The den** keeps c1's bake and adds the wolf's old claw marks raked into the back wall, a floor scraped deepest
  round the middle, frost in the stone hand's palm.

## Its music
`fenrir` (`src/audio.js`, slot 52): slow, cold and sad, F# minor, seeded with the Long Stair's hum (its two beating
notes, an octave up so speakers carry them). A glassy pad, footfall drums on 1 and 3, and a wolf's howl for the lead:
every note slides up into its pitch, with a slow wide vibrato. It layers in by phase: `src/rpg.js` sets a final boss's
intensity `PHASE_INTENSITY` a step per phase before the last (0.7) and the enrage (1); Ladon's track only listens above
0.5, so it's unchanged. Phase 2: chains clink off the beat and rattle every other bar, a bass walks under it. Phase 3:
Skoll and Hati answer the howl from either side, the drums gallop. Phase 4: the drums pound every beat, low brass, the
howl doubled an octave up, ice cracking. The enrage is the light going out: the pad drops away, the drums go to every
eighth, the chains rattle every beat and a semitone grinds against the hum. Nothing below E2 (Ladon's lesson).

## Rewards (FB2 (c2); items only, no reward window)
One weapon a kill, picked by who fought (`twinPick`): **the Pledge-Hand** (Warrior: a broad pale blade held at the root
by a fist of Keeper stone), **the Gleipnir Staff** (Mage: the fetter's ribbon wound up a grey rod and tied off at the
top, its end streaming), **the Lantern Rod** (Cleric: `cls: 'cleric'`, a Keeper crook with a lit cutters' lantern),
**the Moon-Chaser Bow** (Archer: Hati's, night-blue with a crescent on each tip), one twin set (`pledge_hand`) at Lv 110
on the frozen curve, a step above Sigrun's Lv 102; and **the Wolf-Pelt Hood** (a helmet, Lv 110: the pelt with its ears
up and its shut-eyed face on your brow) on a shared chance. Coins, potions, royal sap, black-ice pelts, fetter scraps
and scrolls besides. The **mini Fenrir** is in the Pet Shop (`PETS`, its own art and size: `petWH`), dearer than the
mini Ladon and Pyra's, below the Colossus's. Numbers: `docs/economy.md`, "FB2 (c2)".

## Tested (c2, 2026-10-27: no bots, no test server, owner's rule)
Only offline: the client builds, the server files pass `node --check`, the economy sheet is green, and every pose, the
sons, the fetters, lanterns, glyphs, the paw sigil, the four weapons, the hood and the pet were drawn on a standalone
page in headless Chromium and looked at; the track was rendered offline at each intensity (levels near Ladon's).
**Not tried**: any of it in the game (the wolf moving between poses during a real fight, the fetters meeting the
collar and teeth, the cracks and splits on the real stones, the dark over the new art, the frame time on a slow
laptop or a phone), the music on real speakers, a kill dropping each class's weapon and the hood, the pet in a house,
and the numbers with people.

## Decisions and history
- 2026-10-27: built in FB2 (c) piece 1. The plan's "Glacier's Bed" keeps (b)'s room name, the Wolf's Hold. Hits on
  anchors and lanterns don't damage the wolf (the choice costs damage time).
- 2026-10-27: FB2 (c2), the polish: its art, music, rewards and pet (above). c1's stand-in drop (Sigrun's
  `oath_blade`) is gone.
