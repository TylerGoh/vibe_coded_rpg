# Boss challenges ("tanky to tricky")

Files: `src/shared/challenge.js` (the table `CHALLENGES`, every challenge number, the combo from a seed, `uptimeOf`),
`server/challenge.js` (starting, judging, ending: `createChallenges`), `src/challenge.js` (the client: hazards, the combo,
the touch arrow pad, the art, G2's banner). Physics: `tr` / `cs` in `step()` (`src/shared/sim.js`). The plan, every type
(A1–A23) and every boss's set (B1–B21): `story/tricky-plan.md`.

## Why (owner, 2026-11-06)
"Bosses take a long time to kill but not because they are challenging but because they are tanky." Boss HP went to 0.6×
(`BOSS_HP_SCALE`, `docs/economy.md`); the difficulty moves into the moves: tighter dodges, more going on, and traps you
escape with a key combination. The owner approved every type, every boss's set and the two global rules:
- **G1, teach then combine**: a challenge shows up slowly in the phase that introduces it, faster and alongside others later.
- **G2, one banner line the first time** a character meets a type (`banner` in `CHALLENGES`; saved as `c.seen`, per
  character, never shown again). It's the one exception to "no text naming the answer" (`docs/ui/hints.md`).

## Where it stands
- **T0 (built, shipped dark, 2026-11-06)**: the engine, with the snare (A1) and the controls swap (A17). No boss uses them
  yet; the sandbox's **Challenge now** fires either on any den's boss (`docs/sandbox.md`). A type is live only when its row
  says `built`; the server refuses the rest.
- Next: T1 (the top and final bosses), T2 (den bosses), T3 (field bosses, the Novices'), T4 (tuning): `story/roadmap.md`.
  A boss gets its challenges as a `ch` list on its `MOBS` row (what the sheet reads, below) and calls `start` from its
  brain (`bossBrain`) or its loop (`server/final.js`, `server/fenrir.js`, `server/typhon.js`).

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

## The types built so far
- **A1 Snare**: roots twitch on the floor under each target for `SNARE_WARN`, then spring for `SNARE_LIVE` (a hazard of type
  `snare`, drawn with the puddles behind the slimes: `drawSnareHz`). On the floor within `SNARE_R` of the mark = caught (a
  jump or a ledge clears it). It does `SNARE_HIT`× the boss's ATK, no knockback, and holds you `SNARE_S` (`SNARE_TICKS`).
  Combo length by the boss's level, `snareLen` (3 for the Novices' bosses up to 6 past Lv 120). A second snare while held
  does nothing. Art (`src/challenge.js`): vines wound round the slime (anyone snared, from `tr` in the snapshots), the combo
  in a row of key caps over your own head with a time bar, roots bursting when you break free.
- **A17 Controls swap**: a slow lilac orb at each target (a `shot` with style `swap`, `SWAP_SPEED`), `SWAP_HIT`× ATK and a
  small knockback; left and right swap for `SWAP_S` (`SWAP_TICKS`). A turning sign with a time ring floats over the slime.

## Owner rules every challenge keeps (from the plan)
- Den and field bosses stay soloable by any class; a type that needs two slimes only switches on with two or more.
- Every class carries an answer (moving, jumping, Dash); a challenge only one class can answer is a bug.
- Mobile too: every combo has the on-screen pad; nothing needs two thumbs at once.
- No prompts naming the answer beyond G2's one line; no headless playtests: the owner tests by hand in the sandbox.

## The economy sheet
A boss with challenges loses some of your hitting time: `uptimeOf` (`UPTIME_DEN` for dens and fields, `UPTIME_TOP` for
top and final bosses; 1 while its `MOBS` row has no `ch`) scales your own hits in `fight()` (`scripts/economy.mjs`; dots
and summons keep going). In T0 no boss has `ch`, so the sheet didn't move. If a boss's challenges push it out of band
later, its HP is the lever, not its rewards (`docs/economy.md`).

## Wire and protocol
Wire version 8 (`docs/netcode.md`): `tr` and `cs` in every slime record. Messages: the `chal` boss event, the `ouch` kinds,
`{t:'free'}`, `{t:'chal', a:'freed' | 'first'}`, all in the protocol comment at the top of `server/index.js`.

## Not done yet
- Everything past T0. Phones: the owner wants the swap and the arrow pad checked on a phone in the sandbox before T1 ships.
