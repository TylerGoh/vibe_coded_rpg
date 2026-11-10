# Boss challenges ("tanky to tricky")

Files: `src/shared/challenge.js` (the table `CHALLENGES`, every challenge number, the combo from a seed, `uptimeOf`),
`server/challenge.js` (starting, judging, ending: `createChallenges`, `KIND`), `src/challenge.js` (the client: hazards,
the combo, the touch arrow pad, the art, G2's banner, `drawSunk`). Physics: `tr` / `cs` / `pf` in `step()`
(`src/shared/sim.js`); T1b adds `tl` (the tilting floor). The final bosses' own: `server/final.js` (Ladon),
`server/fenrir.js` (Fenrir), `server/typhon.js` (Typhon's iron, its second Hammer, the lava waves), `src/ladon.js` (Head
Swap's marks), `src/dens-ladon.js` (the moving gaps). The bosses using `bossBrain` (the Root Warden, Sigrun, Brenna, the
Colossus, Chronos) start theirs from `server/rpg.js` (`CHAL_MOVE`, and the fake-out in `newMove`). The plan, every type (A1–A23) and every boss's set
(B1–B21): `story/tricky-plan.md`.

## Why (owner, 2026-11-06)
"Bosses take a long time to kill but not because they are challenging but because they are tanky." Boss HP went to 0.6×
(`BOSS_HP_SCALE`, `docs/economy.md`); the difficulty moves into the moves: tighter dodges, more going on, and traps you
escape with a key combination. The owner approved every type, every boss's set and the two global rules:
- **G1, teach then combine**: a challenge shows up slowly in the phase that introduces it, faster and alongside others later.
- **G2, one banner line the first time** a character meets a type (`banner` in `CHALLENGES`; saved as `c.seen`, per
  character, never shown again). It's the one exception to "no text naming the answer" (`docs/ui/hints.md`).

## Where it stands
- **T0 (built, shipped dark, 2026-11-06)**: the engine, with the snare (A1) and the controls swap (A17).
- **T1a (built, live, 2026-11-10)**: Greenhollow's and Frostpeak's big bosses, with the types they need (below, "The
  bosses so far"). Not played by anyone yet: the owner plays them in the sandbox and with friends next.
- **T1b (built, live, 2026-11-10)**: Emberdeep's and the end-game's big four (Brenna, the Colossus, Chronos, Typhon) and
  their types: the mirror trap, the laser grid, late tells, fake-outs, floor-is-lava waves, carrying the thing, the
  tilting floor and Rewind. Not played either. T1 is done.
- A type is live only when its row says `built`; the server refuses the rest. `loop` rows (Two at once, the moving safe
  zone, Head Swap, the Hunt, the fake-outs, floor-is-lava) only come from a boss's own loop or brain, never from the
  sandbox's **Challenge now**.
- Next: T2 (den bosses), T3 (field bosses, the Novices'), T4 (tuning):
  `story/roadmap.md`. A boss gets its challenges as a `ch` list on its `MOBS` row (what the sheet reads, below) and starts
  them from its brain: a move in its `phases` named in `CHAL_MOVE` (`server/rpg.js`: `bash`, `tether`, `cage`, `arena`,
  `snare`, `fetter`, `gaps`, `dark`, and T1b's `tilt`, `tooth`, `lasers`, `late`, `reverse`, `rewind`; `CHAL_TIME` says how
  long the boss stands for it; `offslam` is its own case in `newMove`), or `d.challenge(m, type, opts)`
  from its loop (`server/final.js`, `server/fenrir.js`, `server/typhon.js`). A party-only move is left out of the pick
  while fewer than its `min` are standing.

## How it works
- **Starting**: `start(m, type)` in `server/challenge.js` aims it at everyone standing in the boss's room (checking the
  type's `min` fighters: party-only types stay off alone), pushes a live record on the boss (`m.ch`: type, seed, combo
  length, until when it can be claimed, `CLAIM_SLACK_MS` past its time) and sends one boss event, `a: 'chal'`.
- **Hitting is client-decided**, like every boss hazard: the event becomes hazards in `src/rpg.js` (`hazardEvent` hands it
  to `Challenges.event`), `hazardHits` judges them on fresh steps (Dash / Blink i-frames skip them), and the hit goes out
  as an `ouch` of kind `snare` or `swap`. The server's `ouch` only takes it while that boss has one of that kind live
  (`claim`), then `apply` makes the physics edit.
- **The physics edit is predicted** (`docs/netcode.md`): the client's `step` returns `{tr}` or `{cs}` (with or without a
  knockback) and `applyKick` sets it at that input, again on every replay; the server sets the same at the same input.
  `step()` then does the rest on both sides: while `tr` is set you don't walk, jump, dash, blink or take doors (gravity
  only; keys held are still noted, so a key held through it isn't a fresh press after); while `cs` is set left and right
  swap. `tr` counts down a tick a step (`TRAP_HOLD` = until freed, for A5's cage later); `cs` likewise.
- **Escaping**: the combo is `comboFor(seedFor(seed, your id), len)`, so everyone caught by one snare gets their own, and
  both sides know it. The arrows are the bound Left / Right / Jump / Down keys (`docs/ui/keybinds.md`: rebinding works; a
  touch device also gets a four-arrow pad, `#chpad`, while snared). A wrong key starts the combo over. Done, the client sends
  `{t:'free', s, k}` and frees itself at that input (`net.free`, replayed like a Charge); the server runs it in input order,
  checks the order against the seed (not the timing: friends' game) and clears `tr` there; the room hears `freed`.
- **Failing**: `tr` runs out first. The server (`tick`) notes `p.punish`: the boss's next hit on you does `SNARE_PUNISH`×
  (within `PUNISH_KEEP_S`; ultimates and challenge hits don't use it up). The client shows "TOO SLOW" and a red ring.
  Knocked out or gone from the room meanwhile: no punish.
- **While snared** you can't attack or cast (`slapToward`, `castSkill` in `src/main.js`); potions still work.

## The bosses so far (T1a)
G1 holds throughout: a type shows up once, slowly, in the phase that introduces it, then faster and alongside others.
- **The Root Warden** (`bossBrain`): `arena` in every phase (one ledge sinks in phase 1, two and a checkerboard of roots on
  the floor in phase 2, all but one and the whole floor in phase 3); `cage` from phase 2 (2+ fighting); its barrier
  brings the **group key-lock** (2+ fighting: `ch` lists `lock`, `shieldUp` starts it).
- **Sigrun** (`bossBrain`): `bash` (the parry) in every phase, its warning shorter each phase (`BASH_WARN`); `tether` from
  phase 2 and `cage` in phase 3 (both 2+).
- **Ladon** (its loop): from phase 2 a Bite's roots spring beside where it struck (`rootsAt`: a snare at
  `BITE_R + SNARE_R + 30` px, one side, both from phase 3) and a Lash, the Rows and the Storm come with a second head's
  Bite (`alsoBite`, A13); from phase 3 **Head Swap** (`swapbite` in the loops) and Hundred Heads' gaps shrink and drift
  (A9: `u.to`).
- **Fenrir** (its loop): `fetter` (the rhythm lock, every other loop in phase 1), `blackout` (the dark, from phase 2),
  `gaps` (from phase 3, sliding in phase 4) and `hunt` (phases 3–4, when Skoll and Hati are up).
- **Brenna** (`bossBrain`, T1b): `tilt` in every phase (the hoist leans the floor, steeper each phase: `TILT_V`), `tooth`
  (a chip to throw back at her) and `cage` (2+) from phase 2.
- **The Clockwork Colossus** (`bossBrain`, T1b): `lasers` (the laser grid) in every phase, standing still for it in phase
  1 and fighting on through it after; `offslam` (the fake-out) from phase 2, sometimes cancelling into Gear Teeth from
  then; the **gear lock** on its armour (2+: `ch` lists `lock`, so `shieldUp` starts it on any shield of a boss that lists
  it; `lockBroken` breaks the armour).
- **Chronos** (`bossBrain`, T1b): `reverse` (the controls swap: time reversed) from phase 1; `late` (the stopped hour) and
  `rewind` from phase 2; all three in phase 3.
- **Typhon** (its loop, T1b): from phase 2 a Coil Burst or a Breath comes with a Hammer from its other arm at someone
  else (`alsoHammer`, A13) and the plates heat in a wave (`lava`, A12); phase 3 adds the Pour's iron setting round
  everyone (`iron`: a snare with `looks.snare: 'iron'`); phase 4 the mirror trap (`mirror`) and a faster wave.
- **Solo**: the party-only types (cage, tether, lock) stay off alone, so a lone slime meets the arena and the parry on the
  party dens, everything on Ladon and Fenrir (their Hunt sends both sons at you).

## The types built so far
- **A1 Snare**: roots twitch on the floor under each target for `SNARE_WARN`, then spring for `SNARE_LIVE` (a hazard of type
  `snare`, drawn with the puddles behind the slimes: `drawSnareHz`). On the floor within `SNARE_R` of the mark = caught (a
  jump or a ledge clears it). It does `SNARE_HIT`× the boss's ATK, no knockback, and holds you `SNARE_S` (`SNARE_TICKS`).
  Combo length by the boss's level, `snareLen` (3 for the Novices' bosses up to 6 past Lv 120). A second snare while held
  does nothing. Art (`src/challenge.js`): vines wound round the slime (anyone snared, from `tr` in the snapshots), the combo
  in a row of key caps over your own head with a time bar, roots bursting when you break free.
- **A17 Controls swap**: a slow lilac orb at each target (a `shot` with style `swap`, `SWAP_SPEED`), `SWAP_HIT`× ATK and a
  small knockback; left and right swap for `SWAP_S` (`SWAP_TICKS`). A turning sign with a time ring floats over the slime.

- **A3 Rhythm lock** (Fenrir's fetters): the snare's shape (`style: 'fetter'`: a silk ribbon, `drawFetters`), one arrow
  fewer (`rhythmLen`), held `RHYTHM_S`. An arrow only counts within `RHYTHM_WINDOW` of a beat (every `RHYTHM_BEAT` from
  the moment it caught you; a ring closes in on the key and flashes green on the beat); off the beat starts it over. The
  server can't see timing: it refuses a combo done in less than `(len - 1)` beats (less `RHYTHM_SLACK_MS`).
- **A5 Rescue trap** (2+): a cage drops on one slime (not the watched one if it can help it; `CAGE_WARN` of shadow and a
  ring, any height within 70 px of the mark). Caught: `tr` = `TRAP_HOLD`, a clock over you; you can't enter your own
  arrows. Everyone else gets `{t:'chal', a:'caged', seed, len}` and sees the cage's arrows over it when standing within
  `RESCUE_R`; their walk / jump / drop keys (or the pad) enter them (they still move you: tap). Done: `{t:'free', s, k,
  who}`; the server checks the rescuer's distance and the order and clears the caged slime's `tr` itself (held, it hasn't
  moved, so its prediction doesn't jerk). Shut `CAGE_S`: knocked out (`faint`), `tr` cleared so a Revive works.
- **A6 Thin gaps** (Fenrir's Howl): ice down the whole den but a gap `GAP_W` wide (`gapX`: sliding at `GAP_SLIDE` in phase
  4), `GAPS_WARN` of warning (the roof's icicles shiver, the gap outlined), `GAPS_LIVE` of falling. Anyone whose middle is
  past `GAP_W / 2 - GAP_GRACE` from the gap's middle is hit (`GAPS_HIT`), on a ledge or not. Never marked done, so a Dash
  skips a moment of it, not all of it.
- **A9 Moving safe zone** (Ladon's Hundred Heads from phase 3): the gaps go from `HUNDRED_GAP_W` to `SAFE_SHRINK_W` and
  drift up to `SAFE_DRIFT` while it warns (`gapsAt`, eased, in `headsWarn`); judged at `u.to`.
- **A13 Two at once** (Ladon from phase 2): `alsoBite`, `DOUBLE_DELAY` s in, a head that isn't busy, at someone not watched.
- **Head Swap** (Ladon, phase 3 on): two heads rear at two marks, the real one's eyes lit, the other's dark
  (`decoys` in `src/ladon.js`). `HEADSWAP_AT` of the way through the wind-up they trade aim (the server moves their `x`;
  each mark's path hands over to the other head). The lit one bites where the other was aiming (`biteHit`); the other
  pulls back (`feint`). The marks look alike: the head is the tell.
- **A15 Moving arena** (the Root Warden): roots drag ledges into the floor for `ARENA_S` after `ARENA_WARN` (they shake;
  `ARENA_SINK` to go down and come up). On the slime it's `pf`, a mask of sunk platforms: each client sinks and raises
  them as its own clock passes the schedule, a predicted edit at its newest input (`net.edit`) sent as `{t:'pf', s, pf}`;
  the server takes only bits a boss in the room has sunk (`masks`, rebuilt each tick) and clears `pf` once none has.
  From phase 2 a root grid strikes the floor `ARENA_GRID_AT` after they sink. Drawn by `drawSunk` round each den art's
  ledges (the basic dens and the Spine's, Seam's, Deep's, Coves', Skerries', Clutch's and Hoist's; the Caldera's and
  Citadel's dens don't sink theirs visibly, but the physics does).
- **A16 Darkness** (Fenrir from phase 2): `DARK_S` of near-black over the den but a light `DARK_R` round each slime and a
  smaller one at the boss's eyes (one offscreen layer, holes cut in it: `drawDark`). Moves go on in it. Drawn over the
  slimes and hazards, under your spells and name tags.
- **A18 Tethers** (Sigrun, 2+): random pairs (an odd one out to the boss) for `TETHER_S` after `TETHER_WARN`; the server
  checks distances every tick: past `TETHER_R` it snaps, `TETHER_HP` of max HP to both (`hurtFlat`: flat, no knockback),
  `{type:'snap'}`. Drawn as a dashed chain of old ice that sags when slack and reddens near its length.
- **A20 Parry** (Sigrun's shield bash): the shield glows `BASH_WARN[stage]` s (a ring closing in on the moment), then she
  drives it `BASH_REACH` in front (low: `BASH_H`). Judged once, `PARRY_LATE_MS` after it lands: in its reach then, if you
  attacked (`chal.swung()`, from a slap or a cast) within `PARRY_MS` before (or `PARRY_LATE_MS` after) it landed, you
  parry: `{t:'ouch', kind:'parry'}`, no hit; the server checks a bash was live and you stood in front, then she takes
  `PARRY_REFLECT` of her max HP from you and staggers `PARRY_STAGGER_S` (once a bash). Else it hits (`BASH_HIT`,
  `BASH_KNOCK`). Jumping over it or backing out of it also works.
- **A23 Group key-lock** (the Root Warden's barrier, 2+): roots seize everyone at once (`LOCK_WARN`, a golden ring under
  each; dodgeable like a snare); everyone caught gets the same arrows (the seed itself). All of them free within `LOCK_S`
  of the first: `{type:'lockDone', ok: 1}` and the barrier breaks (`lockBroken`: `breakShield`, its stagger). Out of
  step, or one too slow: it holds (and the slow one's next hit is punished, as a snare).
- **The Hunt** (Fenrir phases 3–4): Skoll and Hati each run at one of the two fighters farthest apart (alone: both at
  you) at `HUNT_SPEED` × for `HUNT_S` (`m.hunt`, in `son()`); if the brothers come within `HUNT_CLASH` of each other they
  crash: stunned `HUNT_STUN_S`, `HUNT_CLASH_HP` of their max HP off each. Their bites are their ordinary touch. Drawn as a
  red mark over each hunted slime and a dashed line from its hunter.

### T1b's types
- **A4 Mirror trap** (Typhon, phase 4): the snare, its arrows drawn mirrored (`flip` 'h': left and right traded; 'v': up
  and down; `MIRROR`) in a silvered frame with the axis marked; you enter what they mean (the combo is the snare's own,
  so the server checks it the same way).
- **A7 Laser grid** (the Colossus's pistons): `LASER_COLS` beams from the roof, `LASER_BEATS[stage]` beats of
  `LASER_BEAT`; each beat's on/off mask comes with the event (`masks`). A safe lane two beams wide steps at most one beam
  a beat (always walkable at `WALK`), the rest on at random. The next beat's beams show a dashed outline a beat ahead;
  any height (no ledge shields you); judged every step, not once (the hit's invulnerability spaces them).
- **A10 Late tells** (Chronos's stopped hour): `LATE_WIND` of the room greying and a glow at him (the real tell); the
  clock's hands come down where everyone stood when it began, their lines showing only `LATE_TELL` first. Move when he
  glows.
- **A11 Fake-outs** (the Colossus): its slam ring held with no countdown while it ticks (`FEINT_BEAT`, a pip and a tick
  each); it leaps so it lands half a beat after a tick (`FEINT_TICKS`), the jump the last tell; from phase 2 it may
  cancel into Gear Teeth (`FEINT_CANCEL`). The landing is the ordinary slam.
- **A12 Floor is lava** (Typhon): the plates glow and go molten one after another from one end (`LAVA_GAP` apart,
  `LAVA_GLOW[phase]` of glow, `LAVA_HOT` molten); a crusted plate is spared and only cold plates heat. The plates' own
  heat does the hurting (server-timed, as ever).
- **A13 Two at once** (Typhon from phase 2): `alsoHammer`, `DOUBLE_DELAY` in, at someone it isn't aiming at.
- **A15's tilting floor** (Brenna's hoist): `TILT_WARN` of chevrons flashing along the floor, then `TILT_S` of the floor
  leaning: on it (not on a ledge) you slide downhill at `tiltV(tl)` on top of walking (`tl` in `step()`, set and cleared
  by predicted edits like `pf`: `{t:'pf', s, tl}`, the server taking only the lean a boss in the room has going and
  levelling you when it ends). At the low end the hoist's chain grinds: `TILT_HP` of max HP every `TILT_TICK` within
  `TILT_EDGE` of the wall (server-judged). `tl` holds the way and how steep (`tiltOf`), steeper each phase.
- **A22 Carry the thing** (Brenna): a chip of the tooth lands `CARRY_FAR` from her. The loot key (Z; Loot on a phone)
  picks it up within `CARRY_R` (before any loot: `pick`, from the server's `pickup`); carrying it you can't attack or
  cast: an attack (X; Hit) throws it the way you face (`{t:'carry', a:'throw'}`). Her body within `THROW_RANGE` that way:
  `CARRY_HIT` of her max HP and a `CARRY_STAGGER_S` stagger, both doubled from behind (the strap on her back, like her
  weak point); else it lands short and can be picked up again. Not back in her by `CARRY_S`: it bursts
  (`CARRY_BURST_HP` of max HP to anyone within `CARRY_BURST_R`, the one holding it too). Its carrier going down drops it.
  Any class can throw it from anywhere in range: from behind is the bonus, not the rule (a lone slime can't always get
  behind her).
- **Rewind** (Chronos, phase 2 on): a ghost of everyone stays where they stood, a clock hand sweeping round it; `REWIND_S`
  later each client snaps itself back to its ghost (`net.edit` with `x`, `y`, speed zeroed; `{t:'rw', s, x, y}`, the server
  taking it within `REWIND_SLACK` of where it had you, once) and the boss's attacks of those seconds come again in the
  same order (`bossEvent` records them while `m.rec` is set: `REPLAY`, the hazards only, not its moving about; `snap`
  replays them through `later`). Chronos fights on through it, so there's something to dodge twice.
- **A17's time reverse** (Chronos): the controls swap, as built in T0.

## Owner rules every challenge keeps (from the plan)
- Den and field bosses stay soloable by any class; a type that needs two slimes only switches on with two or more.
- Every class carries an answer (moving, jumping, Dash); a challenge only one class can answer is a bug.
- Mobile too: every combo has the on-screen pad; nothing needs two thumbs at once.
- No prompts naming the answer beyond G2's one line; no headless playtests: the owner tests by hand in the sandbox.

## The economy sheet
A boss with challenges loses some of your hitting time: `uptimeOf` (`UPTIME_DEN` for dens and fields, `UPTIME_TOP` for
top and final bosses; 1 while its `MOBS` row has no `ch`) scales your own hits in `fight()` (`scripts/economy.mjs`; dots
and summons keep going). The same share comes off its HP (the `BOSS_HP_SCALE` loop), so a fight lasts what it did
before its challenges: HP is the lever, never rewards (`docs/economy.md`). T1a's four moved by under a minute; T1b's four
by under 40 s.

## Wire and protocol
Wire version 8 (`docs/netcode.md`): `tr` and `cs` in every slime record; version 9 (T1a) adds `pf`; version 10 (T1b) adds
`tl`. Messages: the `chal` boss event, the `ouch` kinds (`KIND` maps each to its type), `{t:'free'}` (with `who` for a
friend's cage), `{t:'pf'}` (with `pf` or `tl`), `{t:'rw'}`, `{t:'carry'}`, `{t:'chal', a:'freed' | 'first' | 'caged' |
'crushed'}`, all in the protocol comment at the top of `server/index.js`.

## Not done yet
- T2 onward. Nobody has played T1's challenges: the numbers are the plan's starting points (T4 tunes them).
- Phones: the owner wanted the swap and the arrow pad checked on a phone in the sandbox before T1 shipped; T1a and T1b
  shipped on the owner's "continue with next phase" without that check, so it's still owed (with the rhythm lock, the
  cage, the mirror trap, the tilt and throwing the chip).
- Known rough edges: a slime that walks into a den mid-arena (or mid-tilt) doesn't sink its ledges (or lean) until the
  next one, and doesn't see a Rewind's ghosts it wasn't there for; the Caldera's and Citadel's dens don't draw a sunk
  ledge (only the sandbox can sink them); a lock alone never opens; the tilt is drawn as chevrons and a grinding chain,
  the den itself doesn't lean. A Rewind's snap is your client's own record of where you stood, so on a bad connection
  the server may refuse it (past `REWIND_SLACK`) and you stay put.
