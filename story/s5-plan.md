# S5, split into pieces (sub-plan for agents)

**Status (2026-10-24): S5.1 and S5.2 are LIVE (deploy #1, e1df118, shipped dark); S5.5 (potions, loot check) and S5.3
(the party dens switched on and tuned) are LIVE too. S5.4's Greenhollow part is LIVE (9ae4d48); its Frostpeak part
is built (waiting for its deploy); next: S5.4 for Emberdeep. Test faster with `TEST_SPEED=10` (fight
lengths too, since the client clock fix: `docs/testing.md`).** S5 in `progression.md` ("bosses that need a party",
section 6) is too big for one session, so it's cut into five pieces, each sized for one agent. Read
`progression.md` sections 1b and 6 first: they hold the design and the owner's rules. This file pins down what
that plan left open and says who does what. Numbers here are starting points: they live as named constants
in `src/shared/rpg.js` and get tuned after people fight.

## The owner's rules (from progression.md, repeated because every piece leans on them)
- **Den and field bosses stay soloable by any class**, at the boss's level: slower and riskier without the
  right class, never impossible.
- **Party dens** (the Root Warden, Sigrun; later one per island) are built for a full mixed party and are
  **extremely hard without one**. Never locked: a very strong player can still grind one down.
- **Final bosses** (owner, 2026-10-24; `final-bosses.md`) come after S5 and are the one exception: four or
  more players, every mechanic on from the start. S5's engine should allow a boss to switch every mechanic
  on regardless of headcount, with an HP floor and an enrage, but S5 builds none of them.
- **A mechanic only shows up once enough slimes are fighting** (no taunt check when you're alone), so a solo
  player isn't punished for being alone.
- **Every class carries an answer to every mechanic**, even a poor one (Mobility, kiting, jumping,
  potions). A mechanic that only one class can answer is a bug.

## What already exists (don't rebuild it)
- `party` on `MOBS.root_warden` and `MOBS.sigrun` names their mechanics. Nothing reads it yet.
- `m.fighters` (the number of slimes fighting, from `BOSS_HP_PER_PLAYER`'s scaling in `server/rpg.js`): the
  gate counts this.
- **The front-shell cut** (`shell` in `applyHits`: the Obsidian Crab's front takes less, and the client shows
  the same cut) is the pattern for barriers and armour: the server caps, the client predicts the same number.
- **Hunter's Mark** (`m.mark`, everyone's hits boosted) and **Deadeye** crits wait for weak points.
- **The freeze reaches bosses** (`frozenUntil`, `FREEZE_BOSS`): the interrupt only needs to read it during
  `ULT_WARN`.
- **Loot by class is mostly done.** `twinPick` already drops the sword, staff or bow by what the fighters
  hold (S4). What's left is checking that every boss has a twinned weapon in its drops (S5.5).
- The Cleric's Barrier, the Knight's Bubble, Sanctuary and Aegis, and the meter's healing and damage-taken
  rows: the pulse leans on these.

## The mechanics, as built
One shared table, `PARTY` in `src/shared/rpg.js`: each mechanic's numbers and its `min` (how many fighters
switch it on). One gate, `partyOn(m, mech)` in `server/rpg.js`: true if the boss lists `mech` in `party` and
`m.fighters >= PARTY[mech].min` (party dens: `capMin`, see the gates below), and the boss has `partyLive` (see the shipping order). The client gets a bit per active
mechanic on the boss so it can draw it and the hints can explain it.

| mechanic | what the boss does | best answer | everyone else's answer |
|---|---|---|---|
| `focus` | locks onto one slime for `FOCUS_S`: its slams and charges only go at them, and harder (`FOCUS_ATK`). A red line from the boss to them | **Rally** (Knight) taunts: it pulls the focus onto you | the focused slime runs and Dashes; others keep hitting |
| `pulse` | every `PULSE_EVERY` s, after a ring telegraph, a room-wide hit of `PULSE_HP` of each slime's max HP. Can't be dodged (`noDodge`) | Cleric: Barrier and heals; Knight: Sanctuary, Bubble | potions, the **Barrier Draught** (new) |
| `curse` | a move that marks slimes near its target with a curse stack: less damage dealt (`CURSE_DMG` a stack) and a small burn (`CURSE_DOT`), up to `CURSE_MAX` stacks | **Cleanse** (Cleric, new) | stand off at range (`CURSE_FADE_R`) and it fades one stack every `CURSE_FADE_S`; the **Cleansing Tonic** (new) |
| `barrier` | a shield phase (`BARRIER_S`, drawn as a rune dome): physical hits only do `BARRIER_PHYS`. Magic hits wear down its own HP (`BARRIER_HP`, a share of the boss's max). Breaking it staggers the boss for `STAGGER_S` | Mage | wait it out (it drops by itself after `BARRIER_S`). Sigrun's version only covers her front (flank her) |
| `armour` | a shell phase: hits under `ARMOUR_CRACK` of the hitter's normal hit do `ARMOUR_CUT`; big single hits crack it (`ARMOUR_CRACKS` cracks breaks it, then a stagger) | Berserker (Sky Splitter, Blade Storm), Snipe, a shatter | wait it out after `ARMOUR_S` |
| `weakpoint` | a glowing spot high on the boss (a shard, a crystal), open for `WEAK_OPEN_S` now and then. A hit on it does `WEAK_MULT` and counts toward `WEAK_HP`; filling that staggers the boss. Hunter's Mark keeps it open longer (`WEAK_MARK_S`) | Archer (it's in arrow range from the floor), Deadeye's crits | jump and hit it (Upward Cut, Flash Jump), or a Mage bolt aimed high |
| `adds` | its summons scale with fighters (`ADDS_PER_FIGHTER`) and come in bigger waves | Mage, Trapper | a longer fight, kiting |
| `interrupt` | not a boss move: **freezing a boss during `ULT_WARN` cancels the ultimate**. The boss is stunned for `STAGGER_S` and the next one comes `ULT_EVERY` later as usual | Mage (Frostbinder) | dodge it as today |

**How hits are checked** (combat stays client-decided and server-capped, `docs/combat/core.md`): barrier,
armour and weak points all change the cap in `applyHits`, like the front shell. The weak point is a flag on the
hit (`h[4]`); the server accepts it only while the spot is open and the hitter could reach it: a ranged hit
(arrow, bolt) from anywhere in range, or a melee hit from a slime whose `y` is near the spot's height. The
client draws the same multiplied number it sends.

**Curses live on the player** (`curse: { n, until, by }` on the character's state, not saved: a relog or a KO
clears it). The client lowers its own damage by `CURSE_DMG` a stack and the server's cap does the same. The
burn goes through `hurt()` from the boss, so it shows on the meter's damage taken.

## The gates (who sees what)
The owner took these as recommended (2026-10-24):
- **Den and field bosses:** every mechanic at `min: 2` fighters, except `interrupt` (always on: it's a reward,
  not a check). Alone, they fight exactly as today.
- **Party dens:** `capMin: 1` for everything but `focus` (it means nothing alone). That's what makes them
  extremely hard solo: a solo slime faces the pulse, the curse, the barrier and the weak point all at once,
  with only potions and patience.
- **Bigger parties:** nothing extra past the gate; `BOSS_HP_PER_PLAYER` already scales the HP.

## Settled here (beyond progression.md)
The owner's answers to the open questions (2026-10-24) are folded in here.
- **Taunt is not a new skill: it's folded into Rally** (owner, 2026-10-24), the Knight's existing skill (adv 30,
  cooldown 30). Casting Rally also pulls the boss's focus (and every mob's target in range) onto the caster for
  `TAUNT_S`. On a boss without `focus` it still pulls the boss's target for as long, so it's never a dead
  button. Built in S5.1 (`taunt()` in `server/rpg.js`).
- **Cleanse** is a new Cleric skill in the shared trunk (no branch, `adv: 10`), **max 1 rank**, so Priests and
  Wardens both get it. Cast on the nearest cursed friend in range (or yourself): clears every curse stack and
  heals a little. Until a boss curses, the hint says "Nothing to cleanse".
- **Potions** (alchemy lab, `docs/places/alchemy.md`): the **Cleansing Tonic** (clears curses) and the
  **Barrier Draught** (absorbs the next pulse). Reagents from boss drops, priced by the economy sheet's method.
  They're weaker than the class answer (one use, a cooldown shared with the other brews).
- **The stagger** (barrier broken, armour broken, weak point filled, interrupt): the boss stops for `STAGGER_S`,
  takes `STAGGER_DMG` more from everyone, and shows a dizzy ring. It's the shared "you did it" payoff.
- **No new lockouts:** no mechanic makes a boss immune. A barrier still lets `BARRIER_PHYS` through, armour
  still takes `ARMOUR_CUT`, a missed weak point only means a slower fight.
- **Telegraphs:** every mechanic warns before it bites (the ring before a pulse, the red line for focus, the
  dome fading in). The hints system (`docs/ui/hints.md`) names the answer the first few times, e.g. "A curse!
  A Cleric can Cleanse it, or step back to let it fade".
- **The interrupt** (owner, 2026-10-24): a freeze landing during `ULT_WARN` cancels the ult outright.
- **Mobile:** Rally and Cleanse are ordinary hotbar skills; the weak point is hit by aiming normally (a tap
  aims arrows already). Nothing new to touch.

## Order and shipping
```
S5.1 engine, focus, taunt, pulse ──→ S5.2 curse/Cleanse, barrier, armour, weak point, interrupt
                                     → deploy #1 (S5.1 + S5.2 together, with no boss switched on)
                                       then S5.3 the party dens                → deploy #2
                                       then S5.4 the retrofit, a stage at a time → deploys #3…
                                       S5.5 potions + loot check, alongside S5.4
```
- **S5.1 first, alone.** The gate, the wire bits and the `PARTY` table are what everything else hangs on.
- **S5.2 after S5.1**, not alongside it: both edit `bossBrain`, `applyHits`, the boss drawing in `src/rpg.js` and
  `src/shared/skills.js`.
- **Deploy #1 ships the engine dark.** The two party dens already list `party`, so the gate also needs the
  boss to be switched on (`partyLive` on its entry, added by S5.3 and S5.4). Players get Rally's taunt and Cleanse
  (harmless without curses) and nothing else changes.
- **S5.3** switches the party dens on and tunes them. Its own deploy, so the owner can try them.
- **S5.4** is the long tail: each boss gets one or two mechanics, shipped a stage at a time.
- **S5.5** can run alongside S5.4 (different files: the alchemy recipes, items, the economy script).

## Rules for every agent (repeat these in the prompt)
- Read `Agent.md`, `story/progression.md` (sections 1b and 6), this file, and the docs listed under your piece.
- Work in your own copy of the repo (Agent.md, "Big features"). Build into the scratchpad
  (`npx vite build --outDir <scratch>/testdist`), test on a throwaway port with a copy of the DB
  (`docs/testing.md`). **Never build into `dist/`, never restart `rpg`, never deploy or push.** Hand back a list
  of changed files and what you tested; the main session deploys.
- Mobile works too (`docs/ui/mobile.md`). No emoji in canvas text. Docs updated, `npm run docs:check` green,
  `npm run economy -- --check` green (Rally's taunt, Cleanse, the stagger and the potions all touch power).
- Test with two or more test players in the den (the gate needs them): `docs/testing.md` has how to run
  several headless players.

## The pieces

### S5.1: the engine, focus and Rally's taunt, the pulse (built 2026-10-24)
**Built and live** (deploy #1, with S5.2). What landed, and what S5.2 should know:
- `PARTY`, `PARTY_MECHS`, `partyBit`, `partyActive` in `src/shared/rpg.js` (`partyDen` on the Warden and Sigrun,
  `partyAll` for the final bosses); `partyOn`, `partyTick`, `inFight`, `sendParty`, `taunt` in `server/rpg.js`. No
  real boss has `partyLive`, so nothing changes for players but Rally's taunt (which pulls ordinary mobs too).
- The active bits go to the client as `{t:'party'}` (JSON, on change and every 2 s), **not** in the mob flags:
  eight bits don't fit the binary mob record. `Party` (`src/party.js`) keeps them; `rpg.party.on(mech, id)` is
  what S5.2's drawing should ask.
- `hurt()` got a `flat` argument (the pulse: past DEF, the roll, Evasion; `knock` 0 skips the knockback). The
  pulse and the focus pick both wait out an ultimate's warning.
- The status box is `src/status.js`: S5.2's curse shows as soon as `me.curse = { n, left }` is sent (its icon
  and red rim are already there). Momentum's pips and the Arcane diamonds moved into it.
- `TEST_PARTY=<boss>:<mechs>` switches mechanics on for tests (`docs/testing.md`).
- Tested with two and three headless players and a phone: everything in the test line below worked. Not tried
  on a field boss.

Docs: `docs/combat/bosses.md`, `docs/combat/skills.md` (the Knight), `docs/netcode.md` (the boss wire bits),
`docs/ui/hints.md`.
- `PARTY` table and `partyOn` gate; the active-mechanic bits on the boss in the snapshot (next to the combo
  bits, `server/rpg.js` around the mob flags); the client reads them.
- `focus`: who's focused (on the boss's state, sent to the room), the red line, the brain aiming only at them
  while it lasts, `FOCUS_ATK` on their hits taken.
- Rally's taunt (owner: no new Taunt skill): its cast on the server, its hint and its word above the slime.
- `pulse`: the ring telegraph (a new boss event, drawn in `src/rpg.js` / `src/hazards.js`), the hit through
  `hurt()` as `noDodge`, Barrier, Bubble, Sanctuary and Aegis absorbing it as they do other hits.
- **The status box** (owner, 2026-10-24: "buffs and nerfs probably need a box status"; lumped into S5 because
  curses and focus are the first debuffs, and players need to see a curse's stacks to know to Cleanse or back
  off). A row of small icons under the HP/MP panel, one per thing on you, each with its time left (or its
  stacks): the buffs that exist today (Berserk, Rally, Bubble, Aegis, Barrier with what's left of it, Mend, a
  brewed potion, Challenge the Gods, Mana Shield while it's switched on, with no timer, Second Wind's
  cooldown), Momentum's pips and Arcane Charge moved into it, and from S5 the debuffs (focus, curse stacks)
  with a red rim. The server's `me` already sends most of the timers (`sendMe`). Tap / hover an icon for its
  name. Phones: it must fit beside the touch controls (`docs/ui/mobile.md`). Built here so S5.2's curse
  lands with somewhere to show.
- Test: a test boss with `party: ['focus', 'pulse']` and two test Knights: the focus moves, Rally pulls it,
  the pulse lands, Barrier soaks it, alone neither shows up. The status box shows a Knight's buffs and the focus.

### S5.2: curses and Cleanse, barrier, armour, weak points, the interrupt (built 2026-10-24)
**Built and live** (deploy #1, with S5.1). What landed, and what S5.3 / S5.4 should know:
- Numbers: `CURSE_*`, `BARRIER_*`, `ARMOUR_*`, `WEAK_*`, `STAGGER_S`, `STAGGER_DMG` in `src/shared/rpg.js`, with
  `curseMult`, `heavyHit`, `weakOf`, `weakReach` and `partyHitMult` (the one rule the client's prediction and the
  server's cap share). `hitKinds` in `src/shared/skills.js` says whether a skill's hit is magic, heavy or an arrow;
  Blade Storm has `crack: true`. Cleanse is `SKILLS.cleanse` (Cleric trunk, adv 10, max 1, `kind: 'cleanse'`).
- Server (`server/rpg.js`): `partyTick` runs the curse's sigil, the shield phases (`m.shield`) and the weak point
  (`m.weak`); `partyHit` / `partyHitLanded` in `applyHits`; `stagger`, `interruptUlt` (from `element()`), `curse`,
  `uncurse`, `curseTick`, `cleanseTarget`. Client: `src/party.js` (`mod`, the drawing, the events), Cleanse's cast in
  `src/rpg.js`, the prompts in `src/main.js` `drawHints`.
- Calls made here: `BARRIER_HP` and `WEAK_HP` are shares of the boss's one-slime HP (`k.hp`), not its party-scaled
  max, so one Mage / Archer does it in a few seconds in any party. Heavy = a multiplier of `ARMOUR_CRACK` or more,
  so Power Strike cracks armour for any Warrior, not only Berserkers (Berserkers have three ways). Weak points:
  every arrow reaches them from anywhere; everything else needs its hitter up at the spot's height. The stagger
  drops a wind-up but lets a move already going off (or an ultimate) finish first. A curse ends on a KO, leaving
  the room or the boss dying, and Aegis blocks one. Summons and burns ignore barrier and armour.
- For S5.3: give the Warden and Sigrun their `weak` (`{ dx, dy, r }`, shares of w / h from the feet; the default
  sits near the top front), Sigrun's front-only barrier (not built: the barrier covers all sides now), `partyLive`.
  The interrupt only works on a boss that lists `interrupt` in `party`: neither party den does yet.
- Tested on the Sprout King with two headless players a mechanic (a Frostbinder, a Sniper, a Berserker, a Priest):
  details in `docs/combat/bosses.md`. Phone screenshots of the stagger and the interrupt were checked.

Docs: the S5.1 ones, plus `docs/combat/core.md` (hits on mobs, the cap), the Cleric and Mage sections of
`docs/combat/skills.md`.
- `curse`: the boss move that lays it, the player's `curse` state, the client damage cut and the server's
  matching cap, the burn through `hurt()`, the fade at range, a curse mark on the slime (small dark wisps).
- **Cleanse** in `skills.js`, both casts, its icon and hint.
- `barrier`, `armour`: the phases in the brain, the cap in `applyHits` (like `shell`), the dome and the shell
  drawn on the boss, the stagger.
- `weakpoint`: where the spot sits (a `weak: { dx, dy, r }` on the boss, so each boss places its own), when it
  opens, `h[4]` on the hit and the server's check, the glow, the stagger. Hunter's Mark keeps it open.
- `interrupt`: a freeze landing while `ULT_WARN` runs cancels the ult (a new boss event so the banner clears
  for everyone), then the stagger.
- Test: the same test boss with each mechanic in turn, with a Mage, an Archer, a Berserker and a Cleric.
  Record the stagger and the cancelled ult as phone screenshots too.

### S5.3: the party dens (built 2026-10-24)
**Built** (waiting for deploy #2). What landed, and what S5.4 should know:
- The Root Warden and Sigrun have `partyLive`, their `weak` (the Warden's shard high on its back; Sigrun's in her
  shield's boss, `front: true`), a `lines.shield` and `looks.dome`. Both also list `interrupt` now (liberal call:
  the Frostbinder's payoff; the plan's table names it as a party mechanic).
- **Sigrun's front-only barrier**: `barrierFront`, `barrierCovers` / `weakFaces` / `inFront` shared, the hitter's x into
  `Party.mod` and `partyHit`, `BARRIER_TURN_S` (she plants and turns slowly while it's up). Any S5.4 boss can reuse it.
- **`adds` is built** (it wasn't in S5.2): `ADDS_PER_FIGHTER`, `ADDS_MAX`, `addsCap`. Alone a wave is unchanged.
- **The HP, a deviation from "nothing extra past the gate"**: the mechanics alone barely slowed a lone slime in the
  sim (2:25 vs 2:23 on the Warden; the Mage got faster), and a party of four won in under 1:30. So a party den's
  HP is never under `PARTY_DEN_HP_FLOOR` (4) slimes' worth (`bossMaxHp`, the final bosses' "four is the floor"),
  and the base `hp` went up (Warden 600k, Sigrun 1.05M). Sim: party 2:00 / 1:56, alone ~9 / ~8 min median (4.4×),
  two branches fainting. Owner to confirm after real fights; the knobs are `PARTY_DEN_HP_FLOOR` and the two `hp`s.
- `npm run economy` has a PARTY DENS table and its checks (`docs/economy.md`); `fight` models the pulse, the barrier,
  the weak point and the stagger (`mech`), which S5.4 can use to check a retrofitted boss.
- Tested with headless bots (one browser each, `TEST_GOD`): `docs/places/spine.md`, `docs/places/queensbridge.md`.
  Found: past ~2× `TEST_SPEED` the client's clock lags (`docs/testing.md`), so fight lengths are measured at 1×.
- Not tested: real people, survival (the bots don't dodge), the adds' bigger waves with four, a duo or trio.

Docs: `docs/places/spine.md`, `docs/places/queensbridge.md`, `docs/combat/bosses.md`.
- Turn the Warden's and Sigrun's `party` on (`capMin`), place their weak points (the Warden's shard high on its
  back, Sigrun's in her shield's boss), give Sigrun the front-only barrier, tune with a mixed test party of four
  at the boss's level and with one strong solo slime. Target: a mixed party wins in a few minutes; a solo slime
  can win only by playing very well for much longer.
- Their `lines` can mention the mechanic once (the Warden's rune shield going up), in their voice.

### S5.4: the retrofit, a boss at a time
**Greenhollow built (2026-10-24, waiting for its deploy).** What landed, and what the next stage should know:
- The seven Greenhollow bosses below have `party` + `partyLive` as drafted, plus `interrupt` on the three den bosses
  (Behemoth, Tidemother, Knotmole). One swap: the Hornet Queen's weak point is her honey sac (`weak` on her), not a
  nest on a ledge, since a weak point is a hit on the boss. Their looks: `looks.shell` / `pulse` / `curse` / `weak`
  (tables in `src/party.js`); reuse or add a row for each Frostpeak boss (ice armour, a breathing-hole pulse...).
- **Field bosses work** (first tried here): the gate counts `fieldFighters`; the idle heal and death now switch the bits
  off and send its called adds away; the curse sigil sits on its floor (`fy`). A field boss has no summon, so `adds`
  there is `FIELD_ADDS_EVERY` / `FIELD_ADDS_MAX` and its `minion` (Hornet Queen: `wasp`). Field bosses have no ult, so
  no interrupt. Fliers' weak points are in the air (arrows or a jump), as the Pale Wyrm's will be.
- `TEST_BOSS_HP` now also holds when a field boss's HP grows or heals (it reset to full HP before).
- `npm run economy` has a RETROFIT table (a duo's kill time, mechanics off / on) and `fight` models armour. Alone
  nothing moves; armour costs a duo ~20%, a weak point saves ~7%. **Settled: the owner OK'd the armour's ~20% on the
  Behemoth and Snapjaw (2026-10-24)**; later stages use the same armour numbers.
- Tested with two headless players on all seven (one on a phone): `docs/combat/bosses.md`. Not tried: the interrupt on
  them, the den adds' bigger waves, people.

**Frostpeak built (2026-10-24, waiting for its deploy).** What landed, and what the next stage (Emberdeep) should know:
- The six Frostpeak bosses have `party` + `partyLive` as drafted, no swaps; the three den bosses also got `interrupt`
  (Glacia's was in the draft). Glacia has one `lines.shield` (her only line, said the first time the dome goes up).
  The Narwhal's weak point is `front` (Sigrun's rule: it's on her face), low enough for melee from the floor.
- Looks added to `src/party.js`'s tables: domes `queen`, `star` (`DOMES`, with their own rune shapes), shells `rime`
  (icicles), `block` (square ice blocks), pulse `breath` (with a `plume` of mist), curse `pale`, weak `star`
  (`starPath`). Emberdeep's cooling rock / heat / burning can add rows the same way. Pale looks vanish on the snow
  rooms' white: check contrast in a screenshot (Glacia's dome had to go a deeper blue).
- **The interrupt is tested now**: a Frostbinder with Glacial Spike then Frost Nova into Absolute Zero's warning.
- `TEST_BOSS_HP` with a den that still counts two fighters from an earlier run: a den boss keeps `m.fighters` after
  people leave (until it resets), so a "solo" check right after a duo isn't one. Use a fresh server or another den.
- Economy: only RETROFIT moved (`docs/economy.md`): barriers hit a no-Mage duo hardest (+26% on Glacia).
- Not tried: people, den adds' bigger waves, a Narwhal fight from behind.

Docs: `docs/combat/bosses.md`, `docs/combat/stages.md` (field bosses), each boss's place doc.
One or two mechanics each, picked to fit the boss (a draft; the agent can swap them for a better fit, and
says why). Bosses below Lv 10 get none: nobody has a class yet.

| boss | Lv | mechanics |
|---|---|---|
| Sprout King, Mother Mushroom, Turnipop | 4–8 | none (before classes) |
| Bramble Behemoth | 12 | `armour` (its bark) |
| Old Snapjaw (field) | 15 | `armour` (its shell, already front-cut) |
| The Tidemother | 25 | `adds`, `pulse` (the tide) |
| The Knotmole | 35 | `focus`, `adds` |
| The Hornet Queen (field) | 38 | `adds`, `weakpoint` (the nest on a ledge) |
| The Drowned Bosun (field) | 40 | `curse` (the drowned) |
| Frost Queen Glacia | 47 | `barrier` (ice), `interrupt` reads well here |
| Astral Wyrm | 57 | `weakpoint` (a star on its back), `barrier` |
| The Thorn Hart (field) | 58 | `focus`, `curse` (the thorns) |
| The Old Narwhal | 70 | `weakpoint` (the tusk's root), `pulse` (the breathing hole) |
| Old Rimehorn (field) | 75 | `armour`, `focus` |
| The Hall Troll (field) | 88 | `armour`, `focus` |
| The Pale Wyrm (field) | 90 | `curse`, `weakpoint` |
| Ignis | 99 | `armour` (cooling rock), `pulse` (the heat) |
| Pyra | 110 | `curse` (burning), `adds` |
| The Clockwork Colossus | 150 | `armour`, `weakpoint` (the core) |
| Chronos | 170 | `barrier`, `curse` (borrowed time) |

- Each boss's art gets its dome / shell / spot drawn to fit it (its own art file, `src/dens*.js`).
- Run `npm run economy` before and after: the stagger speeds kills up a little, so a boss's EXP an hour moves.

### S5.5: the potions and the loot check (built 2026-10-24)
**Built** (hand-back to the main session; ships with whichever deploy comes next). What landed:
- Two recipes (`RECIPES.cleansing_tonic`, `RECIPES.barrier_draught`, tier 3, three potions a batch), both on a
  `royal_sap`: the reagent the cursing / pulsing bosses already drop (the Tidemother, the Knotmole, the Root Warden,
  the Old Narwhal, Sigrun), so no new drop and no faucet moved. Items carry `cure: 'curse' | 'pulse'`.
- "One use, a cooldown shared with the other brews": there was no brew cooldown, and putting one on every brew
  would have changed them all, so the two share their own, `CURE_CD` (`src/shared/alchemy.js`). The Barrier
  Draught is not a brewed buff (it doesn't take the Brew of Might's slot): it waits `DRAUGHT_S` for a pulse. With
  `CURE_CD` over `PULSE_EVERY` and `CURSE_EVERY`, they cover at most every other pulse or curse, and one slime
  can't cover both at once: weaker than Cleanse and a Barrier, on purpose.
- Server: the drink in `use` (`server/rpg.js`, `p.cureAt`, `p.draughtUntil`, not saved, a KO drops the draught);
  the draught takes the pulse in `hurt()` on `flat === true` (after Aegis, before a Bubble), guard `draught`;
  the tonic uses `uncurse`, guard `cleansed`. `me` sends `draught` and `cure` (ms left).
- Client: the status box (`src/status.js`) shows the waiting draught and the shared cooldown (greyed); `drink`
  refuses on cooldown or when not cursed; the "drink a Cleansing Tonic" prompt; the pulse and curse toasts name
  the potions. Flask art in `src/alchemy-art.js` (marks `spark`, `shield`).
- The loot check: every boss already dropped a sword with both twins, so no twins were added. `npm run economy`
  now prints LOOT BY CLASS and checks it from `LOOT_TWIN_LVL`.
- Tested on a test server with `TEST_PARTY=sprout_king:pulse,curse`, two players (one on a phone): brewing both
  at a house lab, the draught absorbing a pulse (the other slime took 30%), the cooldown refusing, the tonic
  refused when not cursed and lifting two stacks, the status box on desktop and phone.

Docs: `docs/places/alchemy.md`, `docs/combat/items.md`, `docs/economy.md`.
- The Cleansing Tonic and the Barrier Draught: recipes, reagents, prices by the economy method, the buff
  hooks into S5.2's curse and S5.1's pulse.
- The loot check in `scripts/economy.mjs`: every boss and field boss Lv 10+ drops at least one twinned weapon
  (so `twinPick` can give each class its own kind). Add twins where one's missing.
- (S5.2 already marked the S3 and S4 leftovers in `docs/ideas.md`: Cleanse, weak points, the interrupt.)

## The open questions, answered (owner, 2026-10-24)
1. **The gates:** as recommended (den and field bosses: every mechanic at 2 fighters, the interrupt always on;
   party dens: `capMin` 1 for all but focus).
2. **Taunt:** folded into Rally, not a new skill.
3. **Cleanse:** a new 1-rank skill in the Cleric's shared trunk (S5.2 builds it).
4. **The interrupt:** a freeze during `ULT_WARN` cancels the ult outright (S5.2 builds it).
