# The Gathering Fair's rides and the Big Top (F3)

Planned as F3 in `story/fair-plan.md` (owner's list, 2026-11-20): the Ferris wheel's gondolas, the teacups (your controls
swap while you spin), the Big Top's trampoline ring and Fizz's show, the High Striker (the server decides how high the
puck goes), the dunk tank (a friend on the plank, you throw at the target). Shipped 2026-11-21. The fair itself:
`docs/places/fair.md`; its coaster: `docs/places/coaster.md`. Cosmetic only, the fair's rule: nothing here gives or costs
gold, EXP or power (the High Striker's bell gives tickets, which only buy prizes), so the economy sheet doesn't move.

Files: `src/shared/wheel.js` (the wheel, its gondolas' clock, `wheelAt`), `src/shared/bigtop.js` (room 113, the
trampolines and their bounce, the show's clock and acts), the Green's constants in `src/shared/fair.js` (`GREEN_X`,
`STRIKER_X`, `DUNK_X`, `PLANK`, `THROW_X`, `TEACUPS_X`, `CUPS`), the riding, bouncing and spinning inside `step()` in
`src/shared/sim.js`, `src/fair-rides.js` (the wheel, a rider in a gondola, the islands' names from the top, the High
Striker, the dunk tank, the teacups), `src/bigtop.js` (the tent's inside and the show), the prompts in `src/fair.js`, the
strikes and throws in `server/fair.js`, Fizz's lines in `server/characters.js`, the sounds in `src/audio.js`.

## Where it all is
- **The Green** (`GREEN_X`, `GREEN_W` wide), new in F3 between Pop Gallery and Bonk-a-Knotmole: the High Striker, the dunk
  tank and its throwing line, the teacups. Everything east of it moved `GREEN_W` along and `FAIR_W` grew by as much (the
  coaster's nodes, stations and pylons too). The Ferris wheel moved a little west at the same time, so its foot (where
  you board) is clear of the Ring Toss and Hook-a-Duck booths either side.
- **The Big Top** is a door (`BIGTOP_X`, in the fair's room def) into its own room, `BIGTOP` (113). Its flap
  (`BIGTOP_EXIT_X`) lets you back out at the door. Its own room rather than an open front because the ring, two stands, a
  trapeze rig and a cannon need far more room than the tent's 560 px in the fair.

## The Ferris wheel
- `GONDOLAS` gondolas go round all the time on the server's clock (`gondolaAngles`), once every `WHEEL_T` ticks, so
  everyone sees the same ones. Stand at the wheel's foot (`BOARD_R`) and press E as a gondola reaches the bottom
  (`gondolaDown`: within `BOARD_WINDOW` ticks; the prompt says "wait for the next gondola" otherwise).
- Riding works like the coaster (owner's rule, everything that moves you is in `step()`): E with `CATCH` at the wheel's
  foot sets `rd = WHEEL` (2; the coaster is 1) and `rc = 0`; each tick `rc` goes up one and `wheelAt(rc)` puts you in
  your gondola. At `rc = WHEEL_T` you're back at the bottom and let off; E or Jump hops out sooner, flying off with the
  rim's speed (a long way down from the top, but nothing hurts at the fair). No wire change: `rd` and `rc` were already in
  snapshots (version 12). The client only sends `CATCH` when it can see a gondola at the bottom; `step()` doesn't check,
  like the coaster, which is harmless.
- Your gondola stands in for the empty one nearest it (`drawWheelRider`; `drawWheel` skips that one). It can sit up to
  `BOARD_WINDOW` ticks off the empty one's place: a small jump when you get in.
- **From the top every island shows** (the plan's words): near the top of your own turn (`topOf`), the islands on the
  fair's horizon get their names over them (`drawIslandNames`, using `islandsAt` in `src/distant.js`). Only for you: it's
  your view.

## The teacups
- Three cups (`CUPS`) on a turntable, each a one-way platform. Standing in one sets `cs` (the boss challenges' swapped
  controls, `docs/combat/challenges.md`) to `CUP_SPIN_TICKS` every tick, inside `step()`, so your left and right swap while
  you're in a cup and for a moment after you hop out, still dizzy. Predicted, because it's `step()` itself.
- The slime in a cup is drawn spinning (`spinOf`: its x scale goes round with the cup's handle; drawing only, like the
  carousel's bob). The cups' fronts are drawn over the slimes (`drawGreenFront`), so you sit in the cup.

## The High Striker
- Slap its pad (a slap anywhere in reach, `STRIKER_RANGE`: `slapToward` in `src/main.js` calls `fair.slapped`) or press E
  there. The client sends `{t:'fair', a:'strike'}`; the server, at most once per `STRIKE_CD_MS`, rolls how high the puck
  goes (`strikeHeight`) and tells everyone in the fair (`{a:'strike', id, h, tickets}`). A **Charge** (dashing, or just
  after: the server's own `dt` / `cw`) hits harder: the bell goes about one swing in ten, one in four with a Charge.
- Ringing the bell gives `STRIKE_TICKETS`. Kept near the booths' pace (a good booth round is about 12 tickets for 35 s
  or so; dash-slapping the bell all day comes to a little more than that a minute). The marks up the tower name how
  high it went (WOBBLY to MIGHTY, then the bell).

## The dunk tank
- Climb the step (`ladder` platform) onto the plank over the water (`PLANK`, which must stay `FAIR_PLATFORMS[0]`). From the
  throwing line (`THROW_X`) E throws a ball (`{a:'throw'}`, once per `THROW_CD_MS`); the server rolls a hit (`DUNK_HIT`)
  and tells the fair (`{a:'throw', id, hit, who}`).
- A hit drops the plank under everyone sitting on it: the server sets the plank's bit (`DUNK_BIT`) in their `pf` (the
  boss arenas' sunk platforms, `docs/combat/challenges.md`) for `DUNK_MS`, so `step()` lets them fall through into the
  tank. That's the one movement here a message causes, so it's done the way the bosses' arenas are: a state field the
  server sets and the snapshot carries, which the client's prediction picks up. `server/challenge.js` keeps that bit
  alive in the fair (`arenaMask`); `pf` is 8 bits, which is why the plank comes first.
- The tank has no walls: you walk out of the water. Anyone inside its glass is drawn under the water (`drawTankFront`).
- A hit with nobody up there still drops the empty plank, for practice.

## The Big Top (room 113)
- The ring with three trampolines (`TRAMPS`), the stands either side (`bench` platforms, a crowd of little jellies behind
  them), the back curtain, the trapeze rig, the cannon and its cushions, a board by the flap saying when the next show is
  (the fair's Big Top door says it too: `fair.update` rewrites that door's label).
- **Trampolines** are a platform kind `step()` bounces you off (`p.kind === 'tramp'`): each landing sends you back up
  with `bounceOf` (keeps `TRAMP_KEEP` of the fall, at least `TRAMP_MIN`, `TRAMP_KICK` more holding Jump, capped at
  `TRAMP_MAX`, which keeps you under the roof and on screen). Holding Down lands you like any platform, and then drops you
  through it, off. The mat dips under whoever's over it; you hear a boing.
- **Fizz's show** runs every `SHOW_EVERY` ticks of the server's clock for `SHOW_LEN` (`showAt`), so everyone in the tent
  sees the same act at once with nothing sent. The acts (`ACTS`, each with Fizz's line in a bubble): the welcome, the
  Tumbling Trio on the trampolines, the Flying Wobbles on the trapeze (there is a net), Bombo the Slime Cannonball
  through the air into the cushions, and the bow with confetti. The performers are ordinary `Slime`s posed from the show
  clock (`poseOf`), Fizz in his hat; the lights go down behind them and the players (never over the players), with
  spotlights on the acts; drums, a cymbal, the cannon and the crowd on cues (`CUES`). Players can bounce on the
  trampolines all through it.
- Fizz the NPC stays at his prize counter: the ringmaster in the ring is part of the show's drawing.

## Not done
- Untested with people: whether catching a gondola is easy enough (on a phone too), the trampolines' feel, the dunk
  tank's odds, the striker's ticket pace, the show's length and how often it runs. Checked: the Big Top's show and a
  trampoline bounce by screenshots on a test server; the plank, the dunk, the wheel's turn and the teacups' swap in a
  node sim of `step()` and `server/fair.js`. Not seen on screen: the Green and the wheel (a headless check of them was
  stopped), phones.
