# Ladon, the Briar Hydra, and its den, the Root of the Road (room 49, `LADON_DEN`)

Greenhollow's final boss (FB1 (c); the approved design is `story/fb1-plan.md`, read it before changing the fight). You
reach it down the Sunken Road and through the Road's End (`docs/places/sunkenroad.md`). The engine it runs on (FINAL
table, heads, coils, enrage) is `docs/combat/bosses.md`, "Final bosses".

## Where things are
- Data: `MOBS.ladon` and its `DENS` row in `src/shared/rpg.js` (`final: 'ladon'`, `heads`, `still`, `touchW`, `touchH`, `denX`,
  `partyAll`, `partyLive`, `top`, `lines`, `looks`); its FINAL row, the heads' slots (`LADON_SLOTS`), the arena's
  ledges (`LADON_PLATFORMS`, `LADON_HIGH`) and every tuning constant in `src/shared/final.js`.
- Brain: `server/final.js` (the loops, the heads, the coils, the enrage), hooked into `server/rpg.js` (`stepMob`,
  `applyHits`, `partyTick`, `kill`).
- Client: `src/ladon.js` (the `final` message, which part a hit is on, the Bite / coils / ultimates judged on the
  client, the title card, the heads' and necks' drawing, freed) and `src/dens-ladon.js` (theme `hydra`: the den, the
  body, the head / stump / coil / eye drawings, both ultimates' effects). Its rewards' art: `src/ladon-art.js` (the
  Fang, the Crown of Thorns, the mini Ladon pet), rows in `src/staff-art.js` and `src/bow-art.js`. Music: `ladon` in
  `src/audio.js` (slot 49).

## The den
The old Keeper road along the floor (paving pushed up by roots, an old root along its edge), lit by glowing seed pods
hanging from the roof of necks; the road goes on west into the dark (art only: the quiet Tier 1 hint). Two low root
arches each side and one high one in the middle that just fits four (`LADON_PLATFORMS`: a new room's own ledges; the
den rooms use `DENS[].platforms`). The body, a great root knot, is the boss mob at the middle of the back wall
(`LADON_BODY_X`); it never walks. Its thorns hurt (owner, 2026-10-26: getting too close should): a touch within
`touchW` of its middle and `touchH` of the floor, never up on the arches (the high arch over it is Strangle's safe place). White roses on the walls; petals drift down, thorns once
it's enraged.

## The fight (what's built; the numbers live in `src/shared/final.js`)
- **Title card** on walking in: "LADON, THE BRIAR HYDRA" and `finalTag(GREEN_TOP)` with letterbox bars for `CARD_S`
  (`src/ladon.js`), drawn over the HUD while you can still move. A breath (2.5 s) before its first move.
- **Fixed HP for four** (owner), no reward window, Lv 80 on the tag (`finalTag`), stats from the FINAL table.
- **The four loops** (`FINAL.ladon.loops`), with the first head's eyes in the dark until phase 4:
  1. Watch → Bite ×3 → Lash → (Bark every other loop). 3 heads.
  2. Watch → Coil → Bite ×2 → Thorn Rows → Breath → (White Rose Ward every other loop). 5 heads; the thorns curse joins.
  3. Breath → Watch → Coil → Bite ×3 → Bark or Ward by turns → Lash. 6 heads; the coils.
  4. Hundred Heads or Strangle → Watch → the Gaze → Breath → Thorn Storm → Coil → both shields. The first head comes out.
  Hundred Heads comes on a timer in phases 1–3 (`ultEvery`, the first below `ULT_FIRST`); from phase 3 the two
  ultimates alternate. Lines: enter, each new phase, `lines.shield` (the first ward), freed, as written in the plan.
- **Its looks** on the shared moves: Lash is the `beam` style `briar`, Thorn Rows the `grid` style `briar`
  (`src/hazards.js`), Breath the pulse look `thorn` (green, "BREATH"), the ward the dome `rose` (white roses), the bark
  the shell `bark`, the curse `thorn` (`src/party.js`). Thorn Storm uses the `thorn` shot style.
- **The Bite hits everything in its path** (owner, 2026-10-26): not just the floor within `BITE_R` of the mark but
  anyone within `BITE_PATH_R` of the line from where the head rears down to the mark, up on an arch too
  (`onBitePath`, judged on the client like the rest of a Bite). The warning shows that path as a red band.
- **Bite pacing** (owner, 2026-10-26: doubled): Bite to Bite is the warning `BITE_WARN`, the strike, `BITE_REST_S` and
  the usual `FINAL_GAP_S`: about 6 s in phase 1, 5 s in phase 2, 4.6 s in phase 3 (measured at TEST_SPEED=10). Phase 4
  has no Bites.
- **Briarlings** (the Sunken Road's `briarling`, as `minion`) spring up wherever a head falls.

## Every class's answer
As in the plan's table (`story/fb1-plan.md`): arrows, spells and bolts cut any head in range at any height (owner,
2026-10-26: a Cleric's bolts all flew into the body; before, only arrows reached the hanging heads); a Mage's fire or a
Cleric's holy light seals a stump; melee cuts heads
stuck after a Bite, or jumps / climbs the arches for the hanging ones; the Knight's Rally takes the Watch (tested); a
Frostbinder freezes either ultimate's wind-up (tested); the shields and the pulse answer as on any S5 boss.

## Its look (FB1 piece 3)
Menacing but in the soft procedural style; no image assets, no text but the SAFE tags and OUT.
- **The den** is baked: everything that doesn't move (back wall, roof, side necks, the road, the low arches, the way
  out) is drawn once into a canvas at the screen's resolution (`denLayer`, rebuilt on a resize or the enrage) and
  copied 1:1 each frame (`docs/performance.md`). Live on top: the pods, the petals (thorns once enraged), and **pairs of
  white eyes in the dark** behind the canes, opening and closing out of time (`darkEyes`). The wall roses wither when
  it enrages. **The high arch is drawn in front of the body** (`drawHighArch`, from `src/ladon.js`): the knot used to
  hide it, and it's Strangle's only safe place.
- **The body**: a hunched beast of woven briar crouched facing the road (owner, 2026-10-26: the first try, a round
  knot of canes with a mouth in it, read as "just a giant circle"). Haunches and a tail behind; a chest that narrows
  down between the legs, split open with thorn ribs across it and plated belly under it; two sprawled forelegs with
  thorn claws on the road; spined shoulder humps, the necks fanning up out of the dip between them (rimmed so they
  stand off the den's canes). Its outline (`torsoPath`) is also the hit flash's. Baked in two layers (`BODY_*`,
  `drawBodyBack` / `drawBodyFront`, copied 1:1 unless a hit or its death squashes it) so the live hearts glow between
  the ribs, each beating at its own rate; buds on it open as small white eyes. Red once enraged. It barely reacts to hits (owner: the squash made it look weird): a rooted boss (`still`) gets no
  squash, shove or turning round in `drawBoss` (`src/dens.js`), only a faint flash and a smaller wind-up.
- **The heads** (`drawHead`, side heads at `HEAD_S`, the first at twice that, necks `NECK_W`): long dragon skulls of
  woven thorn with a pale rim so they read on the dark, a jaw of thorn teeth that hangs open (wide when it rears to
  bite, open with a Coil, a little when it acts), leaf frills, a white rose eye. **The acting head's eye lights first**,
  then its jaw opens. A Coil lights the throat sacs. A hit that fills a head's ring flashes it (`HURT_S`). Hanging
  heads stay near profile (`PROFILE_MAX`; one pointing straight down didn't read); a bitten head lies with its snout
  buried in the road. The first head: crown of thorns, the gold-white shard in its brow; in phases 1–3 only its eyes
  show, above the boss bar (`EYES_Y`), a glint of the shard over them.
- **Stumps** (`drawStump`, `STUMP_S`): raw (a pale green cut, sap dripping); swelling (it bulges and pulses, splits
  down the middle and two shut-eyed buds push out); sealed (charred black, embers glowing in its cracks, embers and
  smoke rising).
- **The coils** (`drawCoilWall`): a dark wall of necks writhing toward the middle, eyes opening in it, and its edge (where
  it hurts) a row of thorns pointing in along a pulsing warm line.
- **Hundred Heads**: the floor cracks and a neck with an opening eye pushes up at every spot but the gaps; the gaps are
  green columns with SAFE tags; on the hit the necks shoot up with their jaws snapping. **Strangle**: the coils surge
  in from both sides, the floor heaves, the high arch is lit and boxed with SAFE and arrows pointing up at it; on the hit
  the canes sweep up to just under the high arch.
- **Briarlings** that spring up in the den (where a head fell) unfold out of a split seed (`sprout`, set by
  `src/ladon.js`; `SPROUT_S` in `src/sunkenroad-art.js`).
- **Freed** (`Final.drawFreed`): its body sinks slowly (a final boss's ghost fades at a sixth of a boss's rate,
  `src/rpg.js`); the side heads sink one by one (`FREED_GAP`), eyes closed; the first head comes down last, lays its
  brow on the road and closes its eyes. Gone after `FREED_S`.

## Its music
`ladon` (`src/audio.js`, slot 49): dark EDM in E phrygian (owner, 2026-10-26: "more flare, a bit of EDM", with
`~/game`'s last stage as the reference). The kick is a heartbeat (lub-dub) on the floor, an off-beat pumping bass, claps
on 2 and 4, a saw arp over a supersaw pad, the bowed melody as a detuned lead. Every 8 bars a two-bar break: only the
hearts, each on its own period as in the Road's End, a riser and a snare roll, then a crash into the drop. Its intensity
comes from the fight (`src/rpg.js`): 0.7 in the last phase (16th hats and arp, the lead doubled up an octave, brass
stabs), 1 once enraged (a wobble bass, the heartbeat doubled, the pad a semitone sharp). The first version was written
two octaves too low (a drone near 20 Hz) and was silent on laptop and phone speakers: keep everything at E2 (82 Hz) or
above.

## Rewards (FB1 piece 3; items only, no reward window)
One weapon a kill, picked by who fought (S5's loot by class, `twinPick`): **Ladon's Fang** (Warrior), **the Unsleeping
Staff** (Mage), **the White Rose Rod** (Cleric: a staff with `cls: 'cleric'`, `CLERIC_STAFF_OF`), **the Hydra's Sinew
Bow** (Archer), all one twin set (`ladon_fang`) at Lv 70 on the frozen curve, a step above the Warden's (Lv 62); and
**the Crown of Thorns** (a helmet, Lv 70) on a shared chance. Coins, potions, royal sap, briar seeds and scrolls besides.
The **mini Ladon** is in the Pet Shop (`PETS`), between Old Rimehorn's and the Hall Troll's: three little heads on one
knot that bicker (its own art and size, `petWH`, not the knot shrunk). Its numbers (HP, EXP, coins) are the economy
sheet's FINAL BOSSES table (`docs/economy.md`).

## Tested (2026-10-26, TEST_SPEED=10, TEST_GOD, TEST_BOSS_HP=0.002, TEST_ENRAGE_MIN=7)
Four headless players (Archer, Elementalist, Frostbinder, Knight; one on a phone): walked in from the Road's End
through the door (title card on desktop and phone), arrows cut a head, its stump swelled and grew back as two, a
Flame Lance sealed the next one, each phase's loop ran in order (events logged), the curse joined in phase 2, the
coils stepped in on each Breath and back on cuts and staggers (to 196 px), Hundred Heads and Strangle warned (on a
phone too) and were frozen out (`ultCancel`, stagger) and one landed, the Gaze opened the shard, both shields went up
together and the roses broke, Rally moved the Watch to the Knight, a hit on a turned head's far side popped THROAT!,
the enrage came (coils closing, petals to thorns), and the kill said the freed line. Not tried: real people, the
numbers (TEST_GOD hid all damage taken), a Cleric's Smite on a stump, the full 45 minutes.

## Tested (FB1 piece 3, 2026-10-26, TEST_SPEED=10, TEST_GOD)
Every state drawn by injecting `final` messages on a headless client (the three phases' heads, a stump raw / swelling /
sealed, the Bite, a Coil's throats, the coils' edge, the Gaze and the first head, the enrage, both ultimates' warning and
hit, a head's hurt flash, freed), on desktop and a phone. Ten real kills by one class at a time (`TEST_BOSS_HP`): each
dropped its own weapon but two (`STAFF_OFFKIND`), the Crown in about half, the freed line said. The mini Ladon on its
plinth, the four weapons and the crown worn and in the bag. The track rendered offline at intensity 0, 0.7 and 1. Frame
time at 4× CPU slowdown: the den during a fight ~39 ms of drawing a frame (the Warden's court ~32, the Thornheart ~48,
the Sunken Road ~55), seven heads with the coils ~52, with Hundred Heads' warning on top ~58. Not tried: real people,
sound on real speakers, the full 45 minutes.
