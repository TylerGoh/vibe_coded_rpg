# The Escapement and its den, the Catch (room 96, `CATCH_DEN`)

The Aether Citadel's final boss (the Citadel's depth pass, C6 (c); the approved design is `story/c6-plan.md`, every default
standing: read it before changing the fight, its answers are settled). You reach it down the Undercroft and along the Spoke
(`docs/places/undercroft.md`), through the round door at `ESC_DEN_X`, which rolls aside by itself now that the den has its
`DENS` row. It runs on the final-boss engine (`docs/combat/bosses.md`, "Final bosses") with its own brain; Ladon, Fenrir,
Typhon and the Wickmother (`docs/places/ladon.md`, `fenrir.md`, `typhon.md`, `wickmother.md`) are the other four.

**Status: C6 done**, built in one session (c1 and c2 together), 2026-11-15, at the owner's "continue with next phase and the
phase after": the den, the whole fight, its look, its track, its rewards and pet, and its freed tick. **Not played by
anyone yet.**

## Where things are
- **Data.** In `src/shared/rpg.js`: `MOBS.escapement`, `MOBS.catch_pawl` (its pawls) and the den's `DENS` row (theme `catch`,
  `CATCH_PLATFORMS`). Its FINAL row (brain `catch`, phases, loops, ultimates) is in `src/shared/final.js`. The arena, the
  pendulum, the pallets, the pawls, the Stopping and every tuning constant of its own are in `src/shared/escapement.js`.
- **Brain.** `server/escapement.js` (`createCatch`: the loops, the Beat, the Tick, the pawls' brain `son`, the Stopping,
  Rewound and the Drop, the three ultimates, `hold`), picked by `createFinal` in `server/final.js`. Hooked into
  `server/rpg.js`: `applyHits` multiplies `final.hold` into hits on its body; `ultGoesOff` makes the Counter-Swing last as
  long as its sweep; the story record on a kill.
- **Client.** `src/escapement.js` (`EscFinal`: the `final` message, which target a hit is on, the Tick's window for
  Party.mod, the bob as drawn, the moves it judges itself, the title card, freed, and the city's one tick), routed by
  `src/finals.js`. `src/dens-esc.js` is theme `catch`: the baked den, the escape wheel's teeth, the anchor's poses, the
  pendulum, the three ultimates' effects, the little anchor.
- **Looks.** The pulse `tock`, the curse `count`, the dome `brake` (`src/party.js`, the shell is the Colossus's `brass`);
  the rings `teeth` (`src/hazards.js`); the snare `chain` (the Rustwyrm's, `src/challenge.js`).
- **Rewards and pet.** `src/esc-art.js`, plus rows in `src/staff-art.js` (the `pendulum` head) and `src/bow-art.js`.
- **Music.** `escapement` in `src/audio.js` (slot 96).

## The den
The hollow round the Wheel's hub:
- The hub's iron casing for walls, curving in overhead.
- The great escape wheel across the top (`WHEEL`), half in the dark, its teeth like a row of houses. They turn a tooth on
  every Tick, and once more when it's freed.
- Riveted plates for a floor, worn into a groove where the bob once passed lower.
- Aether leaking up through the seams.
- The hub's round door at the west end (`DEN_EXIT_X`, every den's way out).

`CATCH_PLATFORMS`: a bearing housing at each end, an iron bracket either side of the middle, and the highest bearing ledge at
each end (`HIGH_W`, `HIGH_E`). Each step is about 110 px (a jump is ~139). Every ledge is over the bob's arc.

## The fight (numbers in `src/shared/escapement.js` and `FINAL.escapement`)
- **Title card** on walking in: "THE ESCAPEMENT" and `finalTag(CITADEL_TOP)` ("Lv 235 · recommended Lv 215, 4+ players"),
  with letterbox bars. You can move all the while.
- **Its body** never moves (it hangs off the hub, `m.x` held at `ESC_MID`). The body box (`MOBS.escapement.w`, `h`) is the
  anchor, the crutch and the bob's column in the middle, from the floor up to the arbor. So the floor and the inner brackets
  reach it, and melee has to work round the bob. Nothing about it hurts to touch (`noTouch`): the bob is the danger.
- **The four loops** (`FINAL.escapement.loops`):
  1. The Count → Pallet Strike → Tock → (late hands) → (Locked), every other loop for the last two.
  2. The Count → Pallet Strike → Teeth → (tether) → Tock → (rings) → Brake → (Locked).
  3. Tock → The Count → Pallet Strike → held (rescue) → Teeth ×2 → Brake or Locked by turns.
  4. An ultimate → The Count → Pallet Strike → Tock → Teeth → the hour backward (swap) → Rewound → both shields.
  
  Its lines (entering, each phase, `lines.shield`, freed) are word for word from the plan.
- **The Beat** (the pendulum):
  - The bob swings across the den, `BEAT_S` for a full swing there and back. The server carries its phase (`bp`) and sends
    it with the period and amplitude; the client eases its own toward it and draws it (`bobX`, `bobY`).
  - Within `LOW_FRAC` of its amplitude from the middle it hangs low. Anyone on the floor (feet lower than `BOB_H` over it,
    not on a ledge) within `BOB_R` of it takes `BEAT_HP` of max HP, a flat `dot` with no knockback, at most once a pass
    (`BEAT_HIT_CD`). It's judged on the server, the grinds' pattern, with no `step()` change.
  - A jump clears it. The ends of the den are safe while it's in the middle, and every ledge is safe.
- **The Tick** (the Hold's answer). Its two pallets (`PALLETS`, west and east) are props: hits on them never hurt it
  (`prop`).
  - They're reachable from the floor with a jump, from the housing beside each, and by arrows and spells.
  - A hit marks a pallet struck. Both struck within `TICK_WINDOW` (one tick, half a swing) lets one tooth go. The wheel jolts
    round, it staggers `TICK_STAGGER_S`, and for `TICK_OPEN_S` every hit on its body does `TICK_OPEN_MULT` × (`hold()`: the
    server in `applyHits`, the client in `Party.mod`). A TICK pop shows it.
  - Then the pallets can't be struck until `TICK_CD` after the window.
- **The pawls** (phase 2 on):
  - They come every `PAWLS_EVERY` s: `PAWLS_BASE` of them, plus one for every `PAWLS_PER_TICK` Ticks made (the Wheel fights
    back), within the adds cap. They're the Undercroft's loose pawls (`catch_pawl`, `son: 'pawl'`, drawn as `loose_pawl`).
  - Each crawls to a free pallet (one no other pawl is after, if it can) and sits under it. After `JAM_S` it's jammed: that
    pallet can't be struck (JAMMED).
  - Frozen, stunned, netted or knocked off it, the pawl starts again (FREE). Killed, its pallet comes free.
- **The Count**: the focus (the shard's light reaches for the counted slime) and the curse (`looks.curse: 'count'`), on from
  phase 2 like every final boss's.
- **Pallet Strike** (`STRIKE_WARN`): the pallet on the counted slime's side swings down and slams the floor at the mark.
  - It catches anyone on the floor within `STRIKE_R`, lower than `STRIKE_H`, judged on the client.
  - Some strikes land a tick late (`STRIKE_LATE`: the creak comes, a "..." pop, then it falls).
  - After it, a chain snare either side, sometimes (`SNARE_OFF`).
- **Teeth**: the generic `rain` marks, three teeth a tick, in a line toward the counted slime.
- **Phase 3, Counter-Swing's set piece**: every loop the swing widens a step (`SWING_STEP`, at most `SWING_STEPS`, so the low
  band covers more of the floor), and every Tick cuts it back a step.
- **Phase 4, the Stopped Hour**: the pendulum stops high in the middle (`hl` 2) and the den stops on the beat.
  - On every beat (every tick once enraged) the server reads each slime's state. A slime on the ground and slower than
    `STILL_V` is stopped: the rhythm lock's fetters spring under it (`rhythm` with `at`, A3: enter the arrows on the beat).
    Each slime at most once every `STOP_CD` s.
  - A ring closes round your own slime to the next beat.
- **Rewound** (phase 4): the bob is hauled up and back, the arbor's plates part, and the shard is the weak point for
  `REWOUND_S` (`REWOUND_WEAK`; `MOBS.escapement.weak`).
  - Filled: the long stagger.
  - Not filled: **the Drop**. The server takes `DROP_HP` of max HP from everyone not on a ledge.
- **The ultimates**, all judged on the client and all interruptible by a freeze in the wind-up (`INTERRUPT_CHANCE`):
  - **Hold** (`hold`, phases 1–2; by turns with Counter-Swing in phase 3): the bob is hauled to one end (`u.side`). Safe:
    under it (`HOLD_SAFE_R` of `haulX`) or on that end's housing or high ledge (`holdSafe`).
  - **Counter-Swing** (`counter`): hauled to one end and let go. A full-length sweep at `COUNTER_SPEED`, judged as it passes
    you. Safe only on the high ledge at the far end (`counterSafe`).
  - **The Stopped Hour** (`stopped`, by turns with Counter-Swing in phase 4): everything greys and a clock hand sweeps round.
    Safe: a slime moving (or in the air) as it lands, with `STOPPED_GRACE` s of slack.
- **The enrage** (`FINAL_ENRAGE_MIN`): the beat quickens (`BEAT_RAGE`), the pallets don't open, the Stopping comes every tick
  with no cooldown, and a Tock comes every `ENRAGE_TOCK_S` besides the loop's.
- **Freed**: its line. The bob swings once, freely, the length of the den and settles; the shard goes dark; the escape wheel
  slips one tooth round, slowly (client art only).

## Its challenges (from day one: `docs/combat/challenges.md`)
- The strike's chain (`snare`, `looks.snare: 'chain'`), and late hands (`late`) every other loop of phase 1.
- Tethers and bullet rings (`looks.rings: 'teeth'`) from phase 2.
- Held (`rescue`, 2+) in phase 3.
- The Stopping (`rhythm`) and the hour run backward (`swap`) in phase 4.

Its HP is cut by its uptime share like every boss with challenges, and also by `hold` (`uptimeOf`: what the party nets after
the hits spent on pallets and the time spent off the bob's arc, with the Tick's windows' extra), so the sheet's fight lasts
what the real one should.

## Every class's answer
The plan's table:
- **The Tick**: two melee, one at each end, or an Archer's spread. Two of anyone, in time.
- **The pawls**: area attacks, knockbacks and freezes.
- **The Count and Pallet Strike**: the Knight's Rally.
- **Locked**: the Berserker's and the Sniper's heavy hits, a shatter, Meteor.
- **Brake**: a Mage, and a Cleric's holy bolts.
- **The Tock**: the Cleric's Barrier and heals. **The Count's numerals**: Cleanse.
- **The sweep growing**: Ticks.
- **The Stopping**: keep moving (Mobility, dashes), the rhythm lock to start again.
- **The ultimates**: Frostbinder freezes, the lee, the far ledge, moving.
- **Rewound**: the Archer.

## Its look
The soft procedural style: dark brass, hub iron and pale aether-blue, no text in the canvas but SAFE and the pops.
- `drawEscapement` eases a handful of numbers between poses (`POSES`: clench, sw, down, shard, open, grey, lift).
- The anchor is a broad arch of dark brass from the arbor out and down to each pallet, bright where they bite. It shows:
  - holding, counting (the shard bright);
  - a pallet swinging down for the strike;
  - clenched for the Tock, locked, braked;
  - heaved up for an ultimate;
  - the arbor's plates parted (Rewound);
  - greyed (stopped);
  - slack (freed).
- The pendulum is drawn in world space by `src/escapement.js` (`drawPendulum`): a crutch out of the dark from far above
  (`PIVOT_Y`) and a bob like a bronze bell.
- The den is baked once. The wheel's teeth, the motes (drifting up) and the pendulum are live.

## Its music
`escapement` (`src/audio.js`, slot 96): the Spoke's heartbeat tick carried into the Catch, E minor, 4/4 at the pendulum's
tempo (a tock on every downbeat, a tick on every off-beat), a slow bell-bronze lead over a low organ. It's layered by phase
like the other finals' (`PHASE_INTENSITY`):
- the Escape Wheel: a ratchet of clicks, a bass walking down by tooth-steps;
- Counter-Swing: strings swinging left and right, a low tom;
- the Stopped Hour: the beat drops out every other bar, the lead hangs;
- the enrage: the tick doubled, every note bent sharp.

Not rendered or measured offline: its loudness against the others' is a guess.

## Rewards (items only, no reward window)
One weapon a kill, picked by who fought (`twinPick`), one twin set (`last_tick`) at Lv 224 on the frozen curve: a step over
the Mainspring's Lv 215, the Citadel's best.
- **The Last Tick** (Warrior): a broad blade shaped like a pallet, its edge worn bright where it bit.
- **The Arbor Staff** (Mage): black iron, a dark shard where the pivot was.
- **The Pendulum Rod** (Cleric, `cls: 'cleric'`): dark brass, a little bronze bob always swinging under its head.
- **The Anchor Bow** (Archer): the anchor's two flukes for limbs.
- **The Arbor Crown** (a helmet, Lv 224, on a shared chance): a ring of fine teeth in dark brass, one missing.

Their effects (`docs/combat/items.md`):
- The weapons' **The Tick**: every `TICK_EVERY`rd hit does `TICK_DMG` ×, the others `TICK_OTHER`.
- The crown's **Keep Time**: the dash comes back in `KEEP_DASH` of the time (`GX.QUICKDASH` in `step()`); DEF × `KEEP_DEF`.

The **mini Escapement** is in the Pet Shop (`drawEscPet`: a little anchor rocking tick, tock, a tiny bob under it), the
dearest pet. Numbers: `docs/economy.md`, "C6 (c)".

## Freed: the city ticks once (per character: `docs/social/story.md`)
Beating it puts `escapement` in your story record (`BOSS_TIER` 4, the Citadel's tier, like Meridian's and the Indexer's).
- **The tick.** The next time you're in any Citadel room (`CITADEL_MAP`'s rooms), one great tick is heard and the light
  jumps (`cityTick` in `src/escapement.js`). It happens once, kept in the browser (`TICK_KEY`).
- **Who knows.** The Last Echo, the Commissary, Folio and Number Nine talk of it with you (`FREED.escapement` in
  `server/lore.js`).
- **The Wheel stays jammed** for the finale (atlas Phase 10, server-wide).

## Tested (2026-11-15: no bots, no test server playing it, owner's rule)
What was checked:
- The client builds into the scratchpad; the server files pass `node --check`; the economy sheet is green.
- The brain was ticked offline with a mock party for a whole fight, without errors: every phase in order, all three
  ultimates, the Beat, Ticks, pawls jamming and coming free, the swing widening, the Stopping, Rewound and the Drop, every
  challenge, a kill at minute 25.
- Every new drawing function ran against a fake canvas with no bad values: every pose, the den, the pendulum, the
  ultimates' effects, the weapons, the crown, the pet.
- The client fight object ran the same way: every event, all three ultimates judged, the Tick's window, freed, the city's
  tick.

**Not tried**:
- any of it in the game (nobody has seen it or the den by eye: the anchor and the bob may need work);
- the Beat's sync between server and client on a real connection;
- the pallets' reach from the housings;
- the pawls' walk;
- the numbers with people, the music on speakers, the den on a phone.

## Decisions and history
- 2026-11-15: built at the owner's "continue with next phase and the phase after" (the plan's open decisions all at their
  defaults: the band 205–215 and its tag Lv 235, the Tick needing two in time, phase 4's Stopping, the city ticking once per
  character).
- Liberal decisions:
  - The body never moves, and touching it doesn't hurt: the bob does.
  - The bob's low band is drawn stylised (low across most of its arc, rising only near its ends), so the widening swing can
    cover more floor, as the plan asked.
  - The Beat is judged on the server; the strikes and the ultimates on the client.
  - The Tick needs only a hit on each pallet in time, not a ring.
  - The Stopping uses the rhythm lock's fetters, sprung under a slime the server reads as standing still on the beat. Its
    first-meeting banner is the rhythm lock's.
  - "Held" (the plan's pallet cage) is the generic rescue cage.
  - Rewound's Drop is the server's flat hurt.
  - The two gear effects (the plan named none) are new.
  - The Spire's clock face standing a minute later wasn't built. The Citadel's clock faces were never drawn still (they
    turn), so there was nothing to stop and move on; the tick and the people who know are the freed change.
