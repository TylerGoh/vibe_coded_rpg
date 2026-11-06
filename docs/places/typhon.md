# Typhon, the Buried Fire, and its den, the Hearth (room 65, `TYPHON_DEN`)

Emberdeep's final boss (E5 (c); the approved design is `story/e5-plan.md`: read it before changing the fight, its
answers are settled). You reach it down the Under-Flues and the Long Flue (`docs/places/underflues.md`), through the
furnace door at `TYPHON_DEN_X`, which swings open now that the den has its `DENS` row. It runs on the final-boss engine
(`docs/combat/bosses.md`, "Final bosses") with its own brain; Ladon (`docs/places/ladon.md`) and Fenrir
(`docs/places/fenrir.md`) are the other two.

**Status: E5 done.** (c1), built 2026-11-02: the den and the whole fight. (c2), built 2026-11-03: its look, its own
track, its four class weapons, the Furnace Mask and the mini Typhon (below).

## Where things are
- Data: `MOBS.typhon` and the den's `DENS` row (theme `hearth`) in `src/shared/rpg.js`; its FINAL row (brain `fire`,
  phases, loops, ultimates) in `src/shared/final.js`; the arena, the plates, the pressure and vents, the Pour and every
  tuning constant of its own in `src/shared/typhon.js`.
- Brain: `server/typhon.js` (`createTyphon`: the loops, the plates, the pressure, the vents, the brood, the Inhale,
  phase 4's movement, both ultimates, `frost`), picked by `createFinal` in `server/final.js`, hooked into
  `server/rpg.js` (`applyHits`: frost on a plate, and any frost hit in the den through `final.frost`; `element`: a
  `noFreeze` ultimate can't be interrupted; `ultGoesOff`: the Last Pour lasts as long as its wave).
- Client: `src/typhon.js` (`TyphonFinal`: the `final` message, which target a hit is on, the moves it judges itself,
  the plates' rings, the vents, the ladle, the pressure dial, the Last Pour's wave, the title card, freed), routed by
  `src/finals.js`; `src/dens-typhon.js` (theme `hearth`: the baked den, the plates' four baked looks, the iron, the
  vents' wheels, Typhon and its rise, both ultimates' effects). Looks: the pulse `bellows`, the curse `scorch`, the shell
  `slag`, the dome `haze` (`src/party.js`), beams `hearth` and `vent` (`src/hazards.js`). Its rewards and pet:
  `src/typhon-art.js`, rows in `src/staff-art.js` / `src/bow-art.js`. Music: `typhon` in `src/audio.js` (slot 65).

## The den
The first forge, older than the Foundry: a vault of black basalt and soot-black brick, two side arches with Keeper
carving (teeth round the arch, a wheel in the keystone), the great hearth pit at the back middle where it rises, the
empty mould set in the middle of the floor (a gear-tooth's print in sand, one short), four old furnace doors in the side
walls (the vents, `VENTS`), the ladle-crane's rail across the vault with the great ladle hanging off it, a pressure dial
on the hearth's west pillar. `TYPHON_PLATFORMS`: a high brick ledge at each end (`HIGH_W`, `HIGH_E`), two low ledges
each side, and the crane's gantry walkway over the middle. The Flue's last steps come down into the **west** wall (every
den's way out is at `DEN_EXIT_X`; the plan's "east wall" gave way to that).

## The fight (numbers in `src/shared/typhon.js` and `FINAL.typhon`)
- **Title card** on walking in: "TYPHON, THE BURIED FIRE" and `finalTag(EMBER_TOP)`, letterbox bars, you can move all
  the while. It's sunk in the hearth when you come in and rises for its first move.
- **The four loops**: 1. Glare → Hammer ×2 → Bellows → (Slag Crust every other loop). 2. Glare → Coil Burst → Bellows →
  Fire Breath → Hammer → (Heat Haze every other loop); the curse and the brood join. 3. Bellows → Glare → Hammer → Coil
  Burst → Fire Breath → crust or haze by turns → the Pour tops up. 4. an ultimate → Glare → Coil Sweep → Bellows →
  Hammer ×2 → Inhale → both shields. Eruption comes on a timer in phases 1–3 (`ultEvery`); from phase 3 it alternates
  with the Last Pour. Lines (enter, each phase, `lines.shield`, freed) word for word from the plan. It shows more of
  itself each phase (`RISE` in the art: head and shoulders, the waist, more, all of it) and in phase 4 the coils lie
  out along the floor and it moves.
- **The plates** (`PLATES`, eight strips across the floor, `plateAt`): cold, glowing (`GLOW_S`, then molten), molten
  (anyone on the floor over it takes `MOLTEN_HP` of max HP every `PLATE_TICK_S`: server-timed, `hurt(..., 'dot')`, no
  physics, nothing blocks; cold again after `PLATE_COOL_S`) or crusted (`CRUST_S`; safe, and an Eruption spares it).
  Moves melt them: the Hammer the plate it lands on, Coil Burst and the Sweep every plate they go through, an Eruption
  or a Last Pour everything that wasn't safe, an unanswered Inhale every plate but the crusted ones.
- **Frost crusts a plate at once** (the answer): any frost-element hit that lands on anything in the den
  (`server/rpg.js` calls `final.frost` after `applyHits`) crusts every hot plate from under the caster out to the
  skill's range in front of it; a frost hit aimed at a plate's ring crusts that one. **The poor answer**: anyone standing
  by a hot plate (within `PLATE_NEAR` of its middle, on the floor) can fill its ring (`PLATE_RING` of the plain hp) to
  beat a crust onto it. The rings only show once someone's filling one. A plate's ring never takes arrows or spells
  from afar (they'd steal hits meant for Typhon): the far answer is frost.
- **The pressure** (`f.press`, sent as `pr`; drawn as the dial's needle, the hearth's glow, the cracks in its skin and,
  from a third of the way, cracks of light up the walls): climbs `PRESS_RATE[phase]` a second, plus `PRESS_HAMMER`,
  `PRESS_BURST`, `POUR_ADD`; a Bellows landing lets out `BELLOWS_LET`, an Eruption that goes off `ERUPT_LET`, a vent
  `VENT_DROP`. At `PRESS_MAX` the next move is an Eruption with `noFreeze` (a freeze can't stop it; the banner still
  warns), which leaves it at `PRESS_AFTER`.
- **The vents** (four, `h[4] = 2 + slot` 0–3): fill a ready one's ring (`VENT_RING`; arrows and spells reach it at any
  height) and it opens: `VENT_DROP` off the pressure, and `VENT_DELAY` later a column of fire roars out of it
  `VENT_LEN` px along the floor (the low ones) or across the end ledge (the high ones) for `VENT_BLAST_S` (a beam,
  style `vent`, judged on the client like any beam). Then it's shut `VENT_SHUT_S`. The enrage jams them.
- **The Pour** (phase 3): it tips the ladle on entering and with every loop's `pour` (`POUR_ADD`). The iron's height is
  the pressure: `floodN` plates from each end are under it (one more a side every `POUR_STEP`), and at `POUR_LEDGE` the
  low ledges too (`ledgesFlooded`); the high ledges and the crane never. Iron over a plate hurts like a molten plate
  (`plateHot`); a crust on it is a skin you can stand on. Phase 4 drains it and starts with `UNBURIED_GLOW` plates
  glowing.
- **Its moves** (judged on the client, `src/typhon.js`): the Hammer (`HAMMER_WARN`, the landing marked; anyone within
  `HAMMER_R` and `HAMMER_H` of the floor; then the arm lies on the floor `HAMMER_REST`: melee's opening), Coil Burst
  (`BURST_N` plates nearest the watched slime bulge in turn, `BURST_WARN` each; anyone low over one is hit), Fire Breath
  (beam style `hearth`, floor or low-ledge height: `BREATH_FLOOR` / `BREATH_LEDGE`), Coil Sweep (phase 4: marked
  `SWEEP_WARN`, then its body slides toward the watched slime's end at `SWEEP_SPEED` to `BODY_EDGE`; anyone within
  `SWEEP_H` of the floor when the front passes is hit; a Knight holding the Glare picks the way). The Inhale (phase 4):
  the tooth in its chest is the weak point for `INHALE_S` (`INHALE_WEAK`; `MOBS.typhon.weak`, front only, a jump or a
  ledge for melee); filled: the long stagger (`GAZE_STAGGER_S`) and all the pressure out; not: a double Bellows and
  every plate glowing.
- **The brood** (phase 2 on): cinder whelps (`k.minion`) out of hot plates every `BROOD_EVERY` s, `BROOD_BASE` plus one
  per `BROOD_PER` hot plates, within the adds cap. A crusted plate gives none.
- **Phase 4 movement**: in its openings it hauls itself after the watched slime (`walk`, never nearer a wall than
  `BODY_EDGE`); in phases 1–3 it's rooted at the hearth (`TY_MID`).
- **Ultimates**: **Eruption** (`u.dark`: the
  `ERUPT_DARK` plates the wind-up leaves dark, marked SAFE with every crusted plate, live; at the hit the server sends
  `u.safe`, the crusted ones then plus the dark ones, and the client checks the plate under it, **at any height**: a
  ledge is not safe) and **the Last Pour** (`u.dir`: the ladle swings that way; a wave of iron at `POUR_SPEED`, judged as
  its front passes you, `pourSafe`: only on the high ledge at the end it runs to, or on the floor over a crusted plate).
  Both are interruptible by a freeze in the wind-up (`interruptUlt`, `INTERRUPT_CHANCE`) except a full-pressure Eruption. Everything they
  hit is left molten.
- **The enrage** (`FINAL_ENRAGE_MIN`): every vent jams, every crust goes, nothing crusts again (frost and rings are
  ignored), one more plate goes molten for good every `ENRAGE_PLATE_S`, and a Bellows every `ENRAGE_BREATH_S` besides
  the loop's own.
- **Freed**: its line; it sinks into the hearth, the plates go dark and the tooth drops from its chest into the empty
  mould (client art only).

## Every class's answer
As in the plan's table: a Frostbinder's frost crusts plates ahead of time and freezes either ultimate's wind-up (but not
a full-pressure Eruption); anyone opens a vent (ranged from anywhere; mind the blast), the Knight's Rally holds the
Glare and steers the Hammer and the Sweep; a Mage's magic takes the haze, the Berserker's heavy hits the crust; the
Cleric's Barrier and heals the Bellows, Cleanse the scorch; the Archer finds the tooth any time it's open and lives on the
ledges in the Pour; area attacks for the brood. The poor answers: rings on plates, the dark plates and the far ledge,
potions.

## Its look (E5 (c2))
Menacing in the soft procedural style; no text in the canvas but the SAFE tags and OUT.
- **Typhon** (`drawTyphon`) eases a handful of numbers per pose (`POSE`: hunch, lean, jaw, raise, glare; plus c1's arm,
  rest, ribs and rise), so it moves between poses instead of swapping. A hunched torso of black basalt with columnar
  facets and a skin of slag round the waist, a network of glowing cracks (`CRACKS`, seeded once) that brighten with the
  pressure, each breath, its glare and the enrage, boulder shoulders, slag dripping off it, a mane of smoke rolling up
  lit from below, and a collar of molten iron where it goes into the floor. The head: an ingot of a face under a crag of
  slag, a heavy brow, four slanted eyes (two big, two small) that flare to glare, gutter when it staggers and shut when
  it's freed, and a jaw that opens to roar, breathe fire and work the bellows (glowing inside, blunt teeth).
- **Its arms** (`limb`, `fist`): the back one braced on the hearth's lip (raised toward the ladle for the Pour), the
  front one raised overhead for the Hammer, then brought down **on the mark**: the client tells the art where the
  Hammer lands (`look.hx`, set on the `hammer` event in `src/typhon.js`) and the forearm lies out across the floor to it,
  steaming, for the rest (the knuckles-as-a-ledge drawing c1 left: art only, nothing to stand on).
- **The chest**: the tooth behind a grille of thick basalt ribs; while it inhales the ribs spread, the tooth blazes and
  light pours out between them. The tooth stays on `MOBS.typhon.weak`'s spot (w × 0.1, -h × 0.62): move one, move the
  other.
- **Its coils**: from phase 2, a dark shape slides under the plates, light showing between its scales across the plates'
  faces, and the seams between the plates glow with the heat (more with the pressure). Phase 4: two lengths of
  slag-scaled body lie out along the floor from its waist, rolling, glowing between the scales, the front one longer
  as it leans into the Sweep (`drawCoils`).
- **The den** keeps c1's bake and adds an arch of wedge bricks round the hearth's mouth (mortar glowing, a Keeper wheel
  at the crown), soot streaks over the hearth and the vents, the smiths' racks of tongs and hammers either side, chains
  off the crane's rail and the old dents of its fists in the side walls. All baked: no cost a frame.

## Its music
`typhon` (`src/audio.js`, slot 65): heavy and grieving, E phrygian, seeded with the Long Flue: the bellows breath every
two bars and the smith's hammer that stopped partway down the flue, going again here on the anvil (two strokes and a
rest). A held drone and a low horn for the lead, a lament on the flat second. It layers in by phase like Fenrir's
(`PHASE_INTENSITY` in `src/rpg.js`): phase 2 the hammer falls on a drum and a bass pulses; phase 3 the Pour (toms running
into every fourth bar, a slow glide up as the ladle tips, lava bubbling); phase 4 the plan's hundred voices (the lead
sung by a choir of detuned saws across three octaves, the drums and anvil every beat); the enrage the pressure (a tone
sliding up every two bars, drums every eighth, the lead bent sharp). Nothing below E2. Measured offline at every
intensity: its loudness sits with Fenrir's and Ladon's.

## Rewards (E5 (c2); items only, no reward window)
One weapon a kill, picked by who fought (`twinPick`): **the Last Hammer** (Warrior: a smith's hammer drawn out into a
blade, its edge glowing, the hammer's head across the tip, the mark (a hammer over a flame) on the pommel), **the Pour
Staff** (Mage: a casting ladle for a head, the bowl still glowing, a drip off the lip), **the Hearthstone Rod** (Cleric:
`cls: 'cleric'`, a hearthstone in a cradle of basalt claws), **the Bellows Bow** (Archer: riveted forge iron with a little
bellows at the grip that squeezes as you draw, glowing caps; `bellows` and the `ember` tip in `src/bow-art.js`), one
twin set (`last_hammer`) at Lv 159 on the frozen curve, a step above Brenna's Lv 151; and **the Furnace Mask** (a
helmet, Lv 159: a smith's iron face-guard worn pushed up on the brow, its four eye slits glowing, so the slime's own
face still shows) on a shared chance. Coins, potions, royal sap, whelp embers, stoker's iron and scrolls besides. The
**mini Typhon** is in the Pet Shop (`PETS`, its own art and size: `petWH`): a little slag serpent coiled with its head
up and a glowing chest; every few seconds it breathes in and puffs a smoke ring. Priced between the Colossus's and
Chronos's. Numbers: `docs/economy.md`, "E5 (c2)".

## Safe zones (the owner's 2026-10-30 bug report)
Both ultimates judge safety by the state at the moment they land (crusts then, plus the dark plates; the wave by your
spot as its front passes). Eruption is judged on x only, so standing anywhere above a safe plate is safe; nothing else
is. Until 2026-11-06 a top boss's uninterrupted ultimate also hit everyone for 60% of max HP even in the safe spot,
the likeliest cause of "one-shot skills still kill you in the safe zone"; the owner had it removed: the safe spot is
safe (`docs/combat/bosses.md`).

## Tested (c1, 2026-11-02: no bots, no test server, owner's rule)
The client builds; the server files pass `node --check`; the economy sheet is green; the brain was ticked offline with
a mock party for a whole 40-minute fight (every phase, both ultimates, full-pressure Eruptions only when nobody opened
a vent, vents, crusts, the brood, the Inhale, the Sweep) without errors. **Not tried**: any of it in the game (the art,
the hit judgements, the plates' heat on real slimes, the rings, the den on a phone), the numbers with people.

## Tested (c2, 2026-11-03: no bots, no test server, owner's rule)
Only offline: the client builds, the server files pass `node --check`, the economy sheet is green; every pose (idle,
glare, the Hammer raised and lying on the mark, bellows, breath, pour, inhale, stagger, coil, sweep), the den in phases 2
and 4, the four weapons, the mask on a slime, the pet and the item icons were drawn on a standalone page in headless
Chromium and looked at; the track was rendered offline at each intensity. **Not tried**: any of it in a real fight
(poses changing on the server's timing, the arm reaching marks at the den's ends, the coils with the Sweep moving it,
the frame time on a slow laptop or a phone), the music on real speakers, a kill dropping each class's weapon and the
mask, the pet in a house, and the numbers with people.

## Decisions and history
- 2026-11-02: built in E5 (c1). Liberal decisions (owner's standing instruction): the exit stays in the west wall like
  every den; the vents stay where they are in phase 3 (two low by the floor, two high by the end ledges: the low ones
  are the hard ones under the iron) rather than moving; frost crusts plates by reach from the caster (a hit landing
  anywhere in the den) instead of only by aiming at a plate, so a Frostbinder's spells at Typhon still crust the floor
  in front of them; a chill and a freeze crust alike (the plan's "a freeze locks it for longer" left out); regular
  Eruptions let out only `ERUPT_LET` (every one resetting the pressure made the vents pointless); the knuckles-as-a-ledge
  drawing is left to c2. Stand-in drop: Brenna's twin set (`bearer_blade`), as FB2's c1 used Sigrun's.
- 2026-11-03: E5 (c2), the polish: its look, music, rewards and pet (above). Liberal decisions: the Furnace Mask is worn
  pushed up (a face-guard over the eyes would hide the slime's face); the hammering fist reaches the real mark, however
  far, instead of a fixed reach; the Bellows Bow's id is `bellows_bow` (`bellows_rod` is Slag's). c1's stand-in drop
  (Brenna's `bearer_blade`) is gone.
