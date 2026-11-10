# Tanky to tricky: boss challenges (plan, owner-approved 2026-11-06)

**Status: (a) on paper 2026-11-06; the owner approved every challenge type (A1–A23), every boss's set (B1–B21) and
both global rules (G1, G2): "I like all of these".** T0 (the engine, the snare and the swap) built 2026-11-06, shipped
dark (`docs/combat/challenges.md`); T1a (Greenhollow's and Frostpeak's big four) built 2026-11-10; next is T1b. Start at
"The phases" below; each phase is sized for one session.

Owner, 2026-11-06: "Bosses right now take a long time to kill but not because they are challenging but because they are
tanky. Let's scale down the health by 40%. The difficulty will be in how pixel perfect. How many challenges are inside.
Let's get creative. Some bosses maybe make it so you get trapped and need to enter a key combination to escape." The HP
cut is live (`BOSS_HP_SCALE`, `docs/economy.md` "Tanky to tricky"). This plan is the other half: the moves.

## The owner's rules (repeated, because every phase leans on them)
- **Den and field bosses stay soloable by any class** at their level; party dens and final bosses are built for a party
  but never locked (`story/s5-plan.md`). A challenge that needs two slimes (A5, A18, A23) only switches on with two or
  more fighters, through the S5 gate (`partyOn`, a new mechanic name per challenge).
- **Every class carries an answer.** A dodge challenge is answered by moving (everyone walks, jumps and has Dash);
  a challenge that only one class can answer is a bug (`progression.md` 1b).
- **Mobile too** (`docs/ui/mobile.md`): every key combo has an on-screen arrow pad; nothing needs two thumbs at once.
- **Fewer hints** (2026-10-26, `docs/ui/hints.md`): no prompts telling you the answer, except G2's once-only banner.
- **No hard gates, no quests.** **No headless playtests** (owner, 2026-10-27): the owner tests by hand in the sandbox.
- **G1 (owner-approved): teach, then combine.** A boss's challenge shows up slowly in the phase that introduces it;
  later phases speed it up and run it alongside others (A13).
- **G2 (owner-approved): a one-line banner the first time.** The first time a character meets a challenge type, one
  line says what it is ("Snared! Enter the arrows to break free"). Saved on the character (`c.seen`), never shown again.

## What already exists (don't rebuild it)
- **The hazards pipeline** (`docs/combat/stages.md`): the server sends one event per move (`newMove` / `mobAi`),
  `hazardEvent` in `src/rpg.js` turns it into `this.hz`, `hazardHits` judges it on each fresh step (client-decided, Dash /
  Blink i-frames skip it), `src/hazards.js` draws it. Most dodge challenges (A6–A12) are new hazard kinds here.
- **Ultimates with safe spots** (`startUlt`, `u.safe`, the client's 'ult' ouch): A9's moving safe zones extend them.
- **S5's party mechanics** (`PARTY`, `partyOn`, `partyHitMult`, the stagger, weak points, barriers): A19 (punish window)
  is a stagger; A21 is a weak point that only opens mid-air; A23 breaks a barrier.
- **Final bosses' written loops** (`server/final.js`, `server/fenrir.js`, `server/typhon.js`): their new challenges go in
  as loop steps, not random picks.
- **The predicted-knockback pattern** (`docs/netcode.md`): a client-decided hit at input seq `s`, the same state edit on
  both sides at that input. Traps and the control swap reuse it (below).
- **The sandbox** (`/rpg_dev`, `docs/sandbox.md`): bosses on demand at any phase. Every phase adds a "challenge now"
  button there so the owner can test each one by hand.

## The engine (new)
- `src/shared/challenge.js`: the table `CHALLENGES` (one row per type, A1–A23: its numbers as named constants, its
  banner line for G2, its `min` fighters) and the shared helpers (combo generation from a seed, timing windows).
- `server/challenge.js`: starting, judging and ending challenges on a boss (called from `bossBrain` and the final
  bosses' loops); `m.ch` holds the live ones.
- `src/challenge.js`: the client: the combo overlay, the arrow pad on touch, the drawing of each type that isn't a hazard.
- **Wire version 8** (`docs/netcode.md`): two more fields in the slime's state: `tr` (trapped: ticks, or 255 = until
  freed) and `cs` (controls swapped: ticks). `step()` reads both: while `tr` is set you don't move (gravity only); while
  `cs` is set left and right swap. Both are set the predicted-knockback way: the client decides the snare / swap hit
  landed at input `s` and sends `{t:'ouch', kind:'snare'|'swap', s}`; both sides apply it at that input. Escaping sends
  `{t:'free', s}`; both clear `tr` there.
- **Key combos**: four arrows (the bound Left / Right / Jump / Down keys, so rebinding works: `docs/ui/keybinds.md`; on
  touch, a four-button pad over the canvas while trapped). A wrong key restarts the combo. Combos come from a seed the
  server sends, so the server checks the order you claim (it can't check timing; friends' game, like hits).

## The challenge types (A1–A23)
Each lists: what happens, how it's judged, and what failing costs. Numbers are starting points (named constants).

**Traps**
- **A1 Snare.** A hazard that hits you snares you (`tr`); a combo of `SNARE_LEN` arrows (4 early, 6 late) shows over your
  head. Fail by `SNARE_S`: the boss's next hit on you does `SNARE_PUNISH`× (2). The snare itself does little damage.
- **A2 Mash free.** Webbed, frozen or buried: mash Jump `MASH_N` times; a friend's hits on the cage count too (the cage is a
  little target, like Fenrir's anchors: `prop`).
- **A3 Rhythm lock.** Rings pulse on a beat; each arrow must land inside a pulse (`RHYTHM_WINDOW` ms). The client judges the
  timing and sends the seq; the server only checks the order and that it took about the right time.
- **A4 Mirror trap.** A1, but drawn flipped (left/right swapped, or upside down); you enter what it means. Late phases
  only.
- **A5 Rescue trap** (party: 2+ fighters). A slime is caged and can't free itself; another stands at the cage and enters
  its combo. Cage time-out: a KO (the S5 rule: a party mechanic can be deadly).

**Precise dodging** (new hazard kinds)
- **A6 Thin gaps.** A wall of projectiles across the room with one gap a slime wide (`GAP_W`), which may slide.
- **A7 Laser grid.** Beams in a pattern that blink on and off on a timer; each cell's state is drawn a beat ahead.
- **A8 Bullet rings.** Rings of orbs spiral out from the boss with gaps; jump or Dash through.
- **A9 Moving safe zone.** An ultimate's safe spot moves, shrinks or splits while it warns (`u.path`).
- **A10 Late tells.** The warning shows for only `LATE_TELL` s; the boss's wind-up pose (art) is the real tell.
- **A11 Fake-outs.** A move winds up, holds a random beat, or cancels into another; the server sends the real start time
  only when it starts.
- **A12 Floor is lava.** Parts of the floor heat in waves (like Typhon's plates and Ignis's magma); stand on platforms or
  the cool parts.

**Chaos**
- **A13 Two at once.** From phase 2 the boss runs a second move alongside the first (`COMBO_*` grows a parallel track).
- **A14 Adds with jobs.** Adds that heal the boss, shield it, or burst into a snare if left alive; kill the right ones.
- **A15 Moving arena.** Platforms that move, crumble and come back, or a tilting floor (a slide, in `step()` from the room's
  state: needs the room's platform clock in the sim, like the voyage clock `vt`).
- **A16 Darkness.** The room goes dark but for a light round each slime and the boss (Fenrir's `drawDark`, reused;
  `docs/performance.md` budget).
- **A17 Controls swap.** A hit swaps left and right for `SWAP_S` (`cs`), with a big icon over you.
- **A18 Tethers** (party). A chain between two slimes (or you and the boss); past `TETHER_R` it snaps for damage.
  Server-judged from positions.

**Answers and rewards**
- **A19 Punish window.** When a big move misses everyone, the boss is stunned `PUNISH_S` and takes `PUNISH_MULT`× (a
  stagger with a bigger multiplier; the server knows from no 'ult'/hazard ouches in the move's window).
- **A20 Parry.** A glowing hit can be parried: attack within `PARRY_MS` of it landing on you. No damage, the boss staggers,
  the hit reflects. Client-judged, sent as `{t:'ouch', kind:'parry'}`; the server checks a parryable hit was live.
- **A21 Weak spot mid-air.** A weak point that only opens above the boss for a moment; reach it with a jump (S5's
  `weakReach` with a height floor).
- **A22 Carry the thing.** An object drops (a bomb, a crystal, a tooth); pick it up (E), carry it (no attacking while
  carrying), throw it at the boss or into a slot. Server-owned object, like loot.
- **A23 Group key-lock** (party). To break a shield, everyone fighting enters the same combo within `LOCK_S` of each
  other. Alone, it isn't used (G-rule above).

## The bosses (B1–B21)
Phase numbers are the boss's own (den bosses: 1–3; final bosses: 1–4). "Unique" moves are this boss's only.

| # | boss | challenges | notes |
|---|---|---|---|
| B1 | Bramble Behemoth (den, Lv 12) | A1 (roots, phase 2+), A21 (its back bark opens mid-leap) | snare combos 4 long |
| B2 | Tidemother (den, 25) | A12 (the tide floods the low floor in waves), A6 (a bubble wall) | |
| B3 | Knotmole (den, 35) | A16 (it goes under and the room darkens), A11 (fake surfacings) | dirt mounds tell where it comes up |
| B4 | Hornet Queen (field, 38) | A2 (wax cage), A8 (stinger rings) | |
| B5 | Root Warden (party den, 60) | A5, A15 (roots raise and lower platforms), A23 (the root shield) | |
| B6 | Ladon (final, 60–80) | A1 (a head's bite snares), A13 (each head runs its own move), A9 (safe gaps between heads shrink) | unique **Head Swap**: two heads trade places mid-wind-up; watch which one glows |
| B7 | Frost Queen (den, 47) | A2 (ice coffin), A7 (ice beams reflecting off mirror pillars) | |
| B8 | Astral Wyrm (den, 57) | A8 (star spirals), A17 (a gravity flip: controls swap) | |
| B9 | Old Narwhal (den, 70) | A12 (ice floes on the water), A10 (a very late tusk charge) | |
| B10 | Sigrun (party den, 100) | A20 (parry her shield bash), A18 (tethers between pairs), A5 | |
| B11 | Pale Wyrm, Hall Troll (field, 88–90) | A11 (feints); the Troll's boulders can be parried back (A20) | |
| B12 | Fenrir (final, 100–120) | A16 (already dark: lean in), A3 (Gleipnir's fetters to a beat), A6 (a gap in the howl) | unique **Hunt**: Skoll and Hati chase the two slimes farthest apart; keep together |
| B13 | Ignis (den, 99) | A12 (magma waves), A22 (carry cooling rocks into its vents) | |
| B14 | Pyra (den, 110) | A9 (the rebirth egg's safe zone moves), A8 (fire rings) | |
| B15 | Hatchkeeper (den, 115) | A14 (hatchlings grow into elites if left), A2 (buried in sand) | |
| B16 | Brenna (party den, 149) | A22 (throw her dropped tooth back at the strap), A15 (the hoist tilts the floor), A5 | |
| B17 | Clockwork Colossus (top, 150) | A7 (piston lasers), A23 (the gear lock), A11 (slams on an off-beat) | |
| B18 | Chronos (top, 170) | A17 (time reverse), A10 (a time stop with only a flash) | unique **Rewind**: the room rewinds you 3 s; dodge the same attacks twice |
| B19 | Typhon (final, 150–170) | A1 (the Pour's iron sets round you), A13, A12 (the plates, tighter), A4 (phase 4) | |
| B20 | Bellower, Hundredfoot, Greyback, Brimstone Condor, Old Crucible (field) | Bellower A6; Hundredfoot A15 (it coils into platforms); Greyback A11; Condor A8 from above; Crucible A22 (throw slag back) | one each |
| B21 | Sprout King, Mother Mushroom (Novices') | an easy A1 (3 arrows, slow), A19 | the gentle first meeting |

Every boss also gets **A19** where a big move can miss everyone (owner-approved as a type; it rewards good dodging over
tanking), and the den bosses' existing moves get G1's pacing.

## The phases (each one session; the roadmap tracks them)
- **T0, the engine** (no boss uses it yet; shipped dark): `src/shared/challenge.js`, `server/challenge.js`,
  `src/challenge.js`; wire version 8 (`tr`, `cs`), the combo overlay and touch arrow pad, `{t:'free'}`, G2's banners
  (`c.seen`), the sandbox's "challenge now" button. Built with A1 and A17 as the first two types (they need the engine).
- **T1, the top and final bosses** (the owner's first batch): B5, B6, B10, B12, B16, B17, B18, B19, with the types they
  need (A1, A3, A4, A5, A6, A7, A9, A10, A11, A13, A15, A16, A17, A18, A20, A22, A23) and their unique moves (Head Swap,
  Hunt, Rewind). The biggest phase: split T1a (Greenhollow's and Frostpeak's: B5, B6, B10, B12) and T1b (Emberdeep's
  and the end-game's: B16–B19) if it runs long.
- **T2, the den bosses**: B1–B3, B7–B9, B13–B15, with the types left (A2, A8, A12, A14, A21) and A19 everywhere.
- **T3, the field bosses and the Novices**: B4, B11, B20, B21.
- **T4, tuning**: after the owner and friends have played T1–T3: the challenge numbers, the fight lengths on the sheet
  (below), the banners' wording.

## The economy sheet
The sheet fights by DPS and can't dodge, so challenges don't show in it directly. Two things it should learn (in T0):
- **Downtime**: each boss gets an `uptime` share (a snared or carrying slime isn't hitting); fight times grow by
  1 / uptime. Starting guess: 0.9 for den bosses, 0.8 for top and final bosses.
- **Punish windows** (A19): `PUNISH_MULT` for `PUNISH_S` every so often, as the stagger is modelled now.
Targets don't move (`DEN_SOLO_MIN` and the rest, set 2026-11-06); if uptime pushes a boss out of band, its HP is the
lever, not the rewards.

## Open questions (defaults chosen; the owner may change them)
- Combo length by level: 3 (Novices), 4 (Lv 10–60), 5 (60–120), 6 (120+). Default as written.
- Failing a snare doubles the boss's next hit on you rather than killing you outright (A5's cage time-out is the only
  trap that KOs). Default as written.
- A17's swap and A16's dark could be unkind on phones; both have a big icon and last a few seconds. Default: as written,
  checked on a phone in the sandbox before T1 ships.
- G2's banner is per character, not per account. Default as written.
