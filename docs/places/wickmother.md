# The Wickmother and her den, the Hall of Lamps (room 84, `WICK_DEN`)

Lantern Fen's final boss (L5 (c); the approved design is `story/l5-plan.md`, every default standing: read it before
changing the fight, its answers are settled). You reach her down the Peat Barrows and up the Lamp Road
(`docs/places/peatbarrows.md`), through the inner door at `WICK_DEN_X`, which parts by itself now that the den has its
`DENS` row. She runs on the final-boss engine (`docs/combat/bosses.md`, "Final bosses") with her own brain; Ladon, Fenrir
and Typhon (`docs/places/ladon.md`, `docs/places/fenrir.md`, `docs/places/typhon.md`) are the other three.

**Status: L5 done**, built in one session (c1 and c2 together), 2026-11-12, at the owner's "all defaults are fine, build the
fight": the den, the whole fight, her look, her track, her rewards and pet, and her freed changes.

## Where things are
- Data: `MOBS.wickmother`, `MOBS.hall_moth` (her moths) and the den's `DENS` row (theme `lamps`, `HALL_PLATFORMS`) in
  `src/shared/rpg.js`; her FINAL row (brain `moth`, phases, loops, ultimates) in `src/shared/final.js`; the arena, the
  hall lanterns, the Hold, the silk walls, the dark and every tuning constant of her own in `src/shared/wickmother.js`.
- Brain: `server/wickmother.js` (`createMoth`: the loops, the lanterns, Kindle, the moths' brain `son`, the silk walls,
  phase 4's dark, Drawing the Light, both ultimates, `hold`), picked by `createFinal` in `server/final.js`, hooked into
  `server/rpg.js` (`applyHits`: `final.hold` on hits on her body, `holy` passed to `hitHead`; `ultGoesOff`: the Long
  Night lasts as long as its wave; the story record and `fw` on a kill).
- Client: `src/wickmother.js` (`WickFinal`: the `final` message, which target a hit is on, the Hold for Party.mod, the
  moves it judges itself, the lights going up, the Long Night's wave, the title card, freed), routed by `src/finals.js`
  (`hold`); `src/dens-wick.js` (theme `lamps`: the baked den, the Crown of Lamps, her poses, the hall lanterns, the silk
  walls, the dark, both ultimates' effects, the small sleeping moth). Looks: the pulse `hush`, the curse `tag`, the shell
  `wings`, the dome `cocoon` (`src/party.js`), the beam `silk` and the shots `souls` (`src/hazards.js`), the snare `silk`
  (`src/challenge.js`). Rewards and pet: `src/wick-art.js`, rows in `src/staff-art.js` (the `moth` head) and
  `src/bow-art.js`. Music: `wickmother` in `src/audio.js` (slot 84).

## The den
Inside the great hollow willow: walls of grey ribbed inner bark leaning in toward a hole far up where the trunk broke (a
little real night sky, where the lights go out), thousands of small lanterns hung from the ribs each with its tag (baked),
the Crown of Lamps (a knot of lanterns) hanging from the middle of the roof, a floor of packed peat with black water in the
hollows, the Lamp Road coming in through the roots at the west end (`DEN_EXIT_X`, every den's way out). `HALL_PLATFORMS`:
a low root shelf at each end, a root ledge higher up each side, and the highest root ledge at each end (`HIGH_W`,
`HIGH_E`); each step about 110 px (a jump is ~139).

## The fight (numbers in `src/shared/wickmother.js` and `FINAL.wickmother`)
- **Title card** on walking in: "THE WICKMOTHER" and `finalTag(FEN_TOP)`, letterbox bars, you can move all the while.
- **Her body** is one tall box (`MOBS.wickmother.h`) from the floor up past the Crown: she hangs wrapped round it, her
  wings trailing to the floor, so the floor and every ledge can reach her in every phase (the plan's "she keeps to the
  high half" is drawing: her poses lift her thorax, never the box). Liberal decision: a body only the Stoop brings in
  reach would have left melee out of three phases.
- **The four loops** (`FINAL.wickmother.loops`): 1. Watching Eyes → Stoop → Kindle → Hush → (Folded Wings every other
  loop). 2. Watching Eyes → Stoop → Silk Line → (tether) → Kindle → Hush → Lantern Rain → (rings) → (Cocoon). 3. Hush →
  Watching Eyes → Stoop → cocooned (rescue) → Kindle ×2 → Silk Line → Lantern Rain → wings or cocoon by turns. 4. an
  ultimate → Watching Eyes → Stoop → the dark → Hush → Lantern Rain → Drawing the Light → both shields. All Souls' Night
  comes on a timer in phases 1–3 (`ultEvery`); from phase 3 it alternates with The Long Night. Lines (enter, each phase,
  `lines.shield`, freed) word for word from the plan.
- **The hall lanterns** (`HALL_LAMPS`, eight on long strings from the ribs: four low, two by the low shelves, two by the
  high ledges): `'l'` lit, `'o'` out, `'p'` party-lit (phase 4). **The Hold** (`holdMult`): every lit one takes
  `HOLD_PER_LAMP` off each hit on her body, at most `HOLD_MAX`; the server (`final.hold` in `applyHits`) and the client
  (`Party.mod`, a HELD pop when it's heavy) cut it alike. Phases 1–3, any hit on a lit lantern fills its ring
  (`LAMP_RING` of the plain hp) and full it goes out, its light drifting up out of the Hall; a Cleric's holy hit (`holy`:
  the holy bolt, Smite, any `holy` skill) or a frost hit lets it go at once. Hits on a lantern never hurt her (`prop`).
  Arrows and spells reach one at any height; anything else needs the body near its height (a ledge, a jump).
- **Kindle** (`KINDLE_WARN`): she touches the out lantern nearest her; frozen, stunned or dazed in the wind-up (`kd` in
  the message: its wick glows first) and it doesn't happen (SAVED).
- **Her moths** (phase 2–3): `MOTHS_EVERY` s, `MOTHS_BASE` plus one per `MOTHS_PER_DARK` lanterns out, within the adds
  cap; each flies to an out lantern no other moth is after, up to its height, and relights it in `RELIGHT_S` unless it's
  frozen, stunned, netted or knocked back first (SAVED), Skoll and Hati's rule turned round. Killed, it's gone. Drawn as
  the Causeway's lamp moths (`art: 'lamp_moth'`).
- **The name tags**: her curse (`looks.curse: 'tag'`), on from phase 2 like every final boss's.
- **The silk walls** (phase 3): two walls close in from the ends, `SILK_STEP` px a step (each Hush that lands and each
  Kindle that lights), at most `SILK_STEPS`; every lantern let go cuts them back a step. Inside them hurts, `SILK_HP` of
  max HP every `SILK_TICK_S` (server-timed, `hurt(..., 'dot')`; nothing blocks). Phase 4 the silk falls away.
- **The Last Light** (phase 4): every lantern goes out at once and the Crown with them. Outside her own light
  (`MOTHER_LIGHT_R` of her, x only) and the party's lanterns the dark's cold hurts, `DARK_HP` a second (`inLightP4`;
  `DARK_RAGE_MIN` more a minute once enraged). An out lantern hit with fire or holy light is lit at once for
  `ROOM_LIGHT_S` (`'p'`: a pool of `LIGHT_R` away from her); any other hit fills its ring to light it (the poor answer). She
  walks the floor (`walk`, never nearer a wall than `BODY_EDGE`); in phases 2–3 she drifts along the ribs toward the
  watched slime (within `RIB_RANGE`), in phase 1 she keeps to the Crown.
- **Her moves** (judged on the client, `src/wickmother.js`): the Stoop (`STOOP_WARN`, the landing marked; anyone within
  `STOOP_R` and `STOOP_H` of the floor; then she lies there `STOOP_REST` with her wings spread, melee's opening, and climbs
  back), Silk Line (beam style `silk`, floor or ledge height), Lantern Rain (the generic `rain` marks, in a line from under
  her toward the watched slime). Drawing the Light (phase 4): the shard in her thorax is the weak point for `DRAW_S`
  (`DRAW_WEAK`; `MOBS.wickmother.weak`, front only); filled: the long stagger and the lanterns stay lit; not: a double
  Hush and every lantern out.
- **Ultimates**: **All Souls' Night** (`souls`: `u.dark`, the `SOULS_DARK` lanterns the wind-up leaves dark; at the hit
  `u.safe` is the strips (`lampAt`, each lantern's stretch of floor, at any height) whose lantern is out or left dark,
  and in phase 4 none in her own light) and **The Long Night** (`night`: `u.dir`; a wave of silk at `NIGHT_SPEED`,
  judged as its front passes you, `nightSafe`: only the high root ledge at the end it rolls to). Both are interruptible
  by a freeze in the wind-up (`INTERRUPT_CHANCE`).
- **The enrage** (`FINAL_ENRAGE_MIN`): every hall lantern relights by itself and nothing lets them go (her Hold full,
  the moths have nothing to do), the dark's cold rises in phase 4, and a Hush every `ENRAGE_HUSH_S` besides the loop's.
- **Freed**: her line; the lights drift up through the hole in the roof one by one, the lanterns dimming gently, and she
  sleeps under the Crown an ordinary moth's size, a little light still in her (client art only: `drawSmallMoth`).

## Her challenges (from day one: `docs/combat/challenges.md`)
The Stoop's strand (`snare`, `looks.snare: 'silk'`: a snare either side of where she landed, `SNARE_OFF`), fake-outs
(`feint`: `FEINT_CHANCE` of Stoops pull up short and stoop again where the watched slime went, `FEINT_AGAIN` later),
tethers and bullet rings (`rings`, the dead's little lights: `looks.rings: 'souls'`) from phase 2, cocooned (`rescue`, 2+)
in phase 3, the dark in phase 4. Her HP is cut by her uptime share like every boss with challenges, and also by `hold`
(`uptimeOf`: the share of a party's damage the Hold soaks or that goes on lanterns), so the sheet's fight lasts what the
real one should.

## Every class's answer
The plan's table: the Cleric's holy hits and a Frostbinder's frost let lanterns go at once (everyone else fills rings and
jumps for the high ones); freezes and stuns stop Kindle and the moths, area attacks and knockbacks the moths; the
Knight's Rally holds Watching Eyes and places the Stoop; the Berserker's and the Sniper's heavy hits the Folded Wings, a
Mage's magic the Cocoon; the Cleric's Barrier and heals the Hush, Cleanse the tags; letting lanterns go keeps the silk
walls back; in phase 4 a Mage's fire or a Cleric's holy light lights a lantern for a pool; the Archer finds the shard.

## Her look
The soft procedural style, grey-violet and gold, no text in the canvas but SAFE, OUT and the pops. `drawWickmother`
eases a handful of numbers between poses (`POSES`: lift, open, lie, reach, shard, wrap, fold), so she moves between them:
wrapped round the Crown with her wings hanging like a cloak (`crown`), drifting on the ribs, rising for the Stoop, lying
on the floor with her wings spread, kindling with a wing tip out, beating her wings for the Hush, folded tight, cocooned
in silk, wings wide for All Souls' Night, drawing the light (the shard on `MOBS.wickmother.weak`'s spot: move one, move
the other), walking the floor in phase 4. A furred thorax with a ruff and the shard like a flame behind glass, a long soft
segmented abdomen, a head with a huge black eye (a light moving in it) and feathered antennae, three legs seen each
holding a lantern (dark in phase 4), four wings with eye spots that catch the light the more she opens, wing-dust
coming off her. The den: baked once (the ribs, the small lanterns, the roots, the floor); the Crown, the dust and the
freed moth are live. The dark is one low-res layer rebuilt only when her light or a party lantern changes
(`docs/performance.md`).

## Her music
`wickmother` (`src/audio.js`, slot 84): the Lamp Road's music box waltz carried into the Hall, A minor in 3/4, her
wingbeat a soft deep whump on every downbeat; layered by phase like the other finals' (`PHASE_INTENSITY`): the Gathering
(a bowed low pad, a soft pulse on one, the moths' wings flickering), the Cocoons (a quiet tremolo, a low tom), the Last
Light (the box thins and drifts out of tune, a hush of voices, a heartbeat), the enrage (every note bent sharp, the
wings every beat). Not rendered or measured offline this time (Typhon's was): its loudness against the others' is a
guess.

## Rewards (items only, no reward window)
One weapon a kill, picked by who fought (`twinPick`): **the Last Wick** (Warrior: a long grey blade, a flame sealed in
glass at the hilt that never moves, a guard of folded moth wings), **the Mother's Staff** (Mage: willow, a moth asleep at
its head round a light, her wings opening now and then: the `moth` head), **the Lantern Crook** (Cleric: `cls: 'cleric'`,
a carrier's crook with a small lantern on its hook), **the Moth-Wing Bow** (Archer: moth-silk string, eye spots), one twin
set (`last_wick`) at Lv 199 on the frozen curve, a step above Grandfather Mire's Lv 181 and the Eldest's Lv 190; and **the
Mothwing Hood** (a helmet, Lv 199: soft grey fur, two feathered antennae, a little wing at each side) on a shared chance.
Their effects (`docs/combat/items.md`): the weapons' **The Last Light** (below half your HP, more damage; less max HP),
the hood's **Moth-Wing** (the Colossus's glide: jump higher, hold Jump to flutter down; less DEF). The **mini Wickmother**
is in the Pet Shop (`drawWickPet`: a small furry moth circling a tiny lantern), the dearest pet. Numbers:
`docs/economy.md`, "L5 (c)".

## Her freed changes (per character: `docs/social/story.md`)
Beating her puts `wickmother` in your story record (no canon tier: `BOSS_TIER` 0) and sets `fw` in your slime's state:
- **The Hall's front door** at the Causeway's end (`HALL_GATE_X`, the `mothsilk` gate, a `shut` gate on the `hall` node
  with `freed`): for you it's drawn open, its silk cut down, and a door with `freed` goes through it to the Lamp Road's top
  (`LAMP_FRONT_X`, a low way out through the Hall's outer roots, drawn only for you), and back. Everyone else meets the
  gate, the Mother keeping it shut.
- **Wickmere's Lamp Walk** burns low for you (`drawWickmere`'s `freed`): a third of its lanterns out and their tags gone,
  always the one nearest Wren's stall (her husband's).
- **Wren, Hob, Sedge and Netta** (`FREED.wickmother` in `server/lore.js`) talk of it as changed with you, gently.

## Tested (2026-11-12: no bots, no test server playing it, owner's rule)
The client builds into the scratchpad; the server files pass `node --check`; the economy sheet is green; a throwaway
server on another port booted clean and exited; the brain was ticked offline with a mock party for a whole fight (every
phase in order, both ultimates, the moths relighting, Kindle, the silk walls, the dark, Drawing the Light, every
challenge, a kill at minute 25) without errors; every new drawing function (every pose in phases 1 and 4, the den, the
lanterns' three states, the silk walls, the dark, both ultimates' effects, the weapons, the hood, the pet) and the client
fight object (every event, both ultimates, the wave, freed) ran against a fake canvas with no bad values. **Not tried**:
any of it in the game (nobody has seen her or the den by eye: the poses may need work), the hit judgements on real
slimes, the moths' flight up to the high lanterns, the numbers with people, the music on speakers, the front door with a
slime who has freed her, the den on a phone.

## Decisions and history
- 2026-11-12: built at the owner's "all defaults are fine, build the fight" (the plan's open decisions all at their
  defaults: `FEN_TOP` 190 and her tag Lv 210, the front door shut until you've freed her, the Hold, phase 4 turned round).
- Liberal decisions: her body box reaches the floor in every phase (above); the moths are their own kind (`hall_moth`,
  the lamp moth's look, Lv 190) so the Causeway's ordinary lamp moths keep their own brain; the silk walls step in with
  each Hush and each Kindle, and back with each lantern let go; in phase 4 any hit can also light an out lantern (its ring,
  the poor answer) as well as fire and holy at once; All Souls' Night in phase 4 also burns her own light's strips, so
  the party's lanterns are the safe ground there; her weapons' and hood's effects (the plan named none) are new; the front
  door's way in is a second door at the Lamp Road's top (`LAMP_FRONT_X`) rather than straight into the den, so a freed
  slime still walks in under the inner door; the HELD pop (like WARDED) when the Hold takes more than a third.
