# The Sunken Road (room 47, `SUNKEN`) and the Road's End (room 48, `ROADSEND`)

FB1 (b): the way to Greenhollow's final boss, Ladon the Briar Hydra (`story/fb1-plan.md`, "On the way
there"; the pattern is `story/final-bosses.md`, "The way in: deep route, approach, den"). Deep room, then
approach, then den (room 49, `LADON_DEN`, built by FB1 (c)).

## The way in
The Thornheart's root knot has split at its east end (`SUNKEN_GATE_X`): a dark way down between the roots
(`OPEN.rootsplit` in `src/branch-gates.js`, a red-trimmed "Sunken Road" sign). Owner's rule: the update itself
split it, no quest or event. On the island map it's one node, `sunkenroad`, under the Thornheart
(`GREENHOLLOW` in `src/shared/branches.js`; both rooms are its `rooms`).

## The Sunken Road (Lv 55–60, a deep room on hard-pocket rules)
- Data: `SUNKEN_*` and the spawns in `src/shared/rpg.js`, the room in `src/shared/sim.js`. Art:
  `src/sunkenroad.js` (the room), `src/sunkenroad-art.js` (mobs, gear, icons). Music scene `sunkenroad`.
- The old Keeper road under the briar: flagstones lifted and tipped by roots, an old root running along its
  edge the whole way (the quiet hint that the road goes back west under the island; Tier 1 only), a roof of
  black briar with no daylight, glowing seed pods hanging from it as the only light. Darker than the
  Thornheart: same plum and moss, pushed toward black.
- Hard-pocket rules (`hard` in `STAGES`): red level chips, red-trimmed zone signs, **no waystone, no trader**,
  elites throughout. West to east: the Root Stair (no mobs; the roots you climbed down), the Old Road, the
  Lantern Reach, the Neck's Hollow, and at `SUNKEN_END_X` the road climbs out east into the Road's End.
- Mobs (legacy brains, on the frozen curve, `docs/economy.md`): briarlings (Ladon's seeds grown wild; plain
  chasers, no `ai`; in Ladon's den, where a head falls, they unfold out of a split seed: `sprout`, `SPROUT_S`), old road guards (Keeper stone figures the briar grew through; `shell`: hit them from
  behind), seed-pod lanterns (rooted `lob`, `anchored`, new shot style `seed` in `src/hazards.js`), root
  creepers (`blink`: under the paving and up behind you). Elites: Elder Briarling, Road Guard Captain, Great
  Seed Lantern. Ladon's things share one tell: small white glowing eyes.
- **The Severed Neck**: a named elite at the far end (not a boss: no den, no phases, an ordinary respawn). One
  of Ladon's heads cut off long ago that grew a body of its own. It's `elite('root_creeper', …)` with its own
  `art` (`drawMob` in `src/field.js` uses `spec.art` before `spec.base`), bigger, and a quicker `blink`. The
  economy script checks it as an elite of the root creeper.
- Drops: four materials, the Road Guard's Helm (road guards), the Neckthorn Fang and its staff and bow twins
  (rare off root creepers, likelier off the Severed Neck).
- The Milestone (last in `SUNKEN_PLATFORMS`): the hidden spot, a Keeper milestone the roots lifted high, a
  hand carved on it pointing west, back along the road.

## The Road's End (the approach: no mobs, no combat)
`src/roadsend.js`. Not a stage (no `STAGES` row, not a combat room): safe ground where the party gathers.
Owner's rule: everything cinematic here is drawing and sound, never `step()`, never a cutscene; you should
feel shut in, never be shut in.
- `roadsDepth(x)` (0 at the way in, 1 at the den's door) drives it all, from **your own** slime's x:
  the light dims, the petals thin out and stop, the roses turn their faces to follow you, the necks behind
  the rose wall show more, pairs of white eyes open one after another (each at its own depth, easing open),
  the dark closes in from the edges over the slimes (`drawRoadsEndFront`), and the briar knits shut over the
  way you came (art only: the door back always works, and walking back opens it again).
- Music scene `roadsend`: no tune, a held note and heartbeats. `audio.setDepth` (set every frame from
  `src/main.js`, 0 anywhere else) adds hearts on their own periods so they never line up, and slows and
  louds the first one.
- **Ladon's line** (`LADON_LINE`): the first slime past `LADON_MARK_X` in an empty Road's End makes the server
  send `{t:'boss', a:'voice', who, text}` to the room (`roadsEndSaid` in `server/rpg.js`, checked every
  `PATCH_HIT_EVERY` ticks, reset when the room empties). The client shows a dark bubble out in the dark and
  a chat line. Not a mob's `lines`: it's sent before anyone is in the den, so it isn't one of `MOBS.ladon`'s.
- **The den's door** at `LADON_DEN_X`: a dark way in between the roots with necks coiled across it that draw
  back by themselves as you come near. The sign beside it: the den's name, `finalTag(GREEN_TOP)` (both levels,
  from `FINAL_LVL_OVER` and `FINAL_MIN_PLAYERS`) and a live count, "3 here, 4+ recommended": a count, never a
  lock.

## The den
FB1 (c) hooked it up: the den's `DENS` row makes the door (its art is still `src/roadsend.js`'s), and the den itself,
Ladon and the fight are `docs/places/ladon.md`. The den rooms' exit label reads the row's `fromName` when its `from`
isn't a stage (the Road's End).
