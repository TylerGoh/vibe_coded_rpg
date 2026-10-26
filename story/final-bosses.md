# Final bosses: one per island, very hard, deep in (plan)

**Status: plan, written 2026-10-24 (owner). Nothing built.** Builds on S5's party mechanics
(`progression.md` section 6, `s5-plan.md`). Order (owner, 2026-10-24): after the skill pool
(`skills-plan.md`), Greenhollow's first, then S5.4 for Emberdeep, then Frostpeak's, then Emberdeep's E1.

## The owner's ask (2026-10-24)
- **Every island gets a final boss**, its strongest by far. Very hard: it needs **at least four players at
  the recommended level** (the boss's own level shown far higher) and takes them **about 30 minutes**.
- **Its moves take real design time:** each final boss has its own move set and order, worked out
  in detail, not a few picks from the shared boss moves.
- **Far deeper in** than anything else on the island. Greenhollow's is reached through the Thornheart and
  Frostpeak's through the Blue Halls, and both pockets get better and deeper to get there. **Why those two**
  (owner): they're the darkest places on their islands, and enclosed: **a trapped feeling.** That's the
  mood every final boss is built around: deep, dark, closed in, a long way from daylight. Choose later
  islands' locations the same way.
- **A room before the den that's cinematic:** the walk up to the boss is an event in itself.
- The old capstones, **the Root Warden and Sigrun, are no longer capstones.** They're the islands'
  second-strongest bosses: **party dens** (built for a party, extremely hard solo, never locked; S5.3
  still switches them on). On new islands too: Emberdeep's Brenna is its party den, and E5 its final boss.
- Greenhollow and Frostpeak are finished islands, so their final bosses go ahead of Emberdeep on the
  roadmap. On new islands the final boss is **the last phase** of the depth pass.

## Boss sizes
| size | example | who it's for | how long |
|---|---|---|---|
| field boss | the Thorn Hart, the Hall Troll | anyone, solo | a minute or two |
| den boss | the Tidemother, the Old Narwhal | any class solo; faster in a group | a few minutes |
| party den | the Root Warden, Sigrun, (Brenna) | a mixed party; extremely hard solo, never locked | a few minutes for a party |
| **final boss** | (new, one per island) | **four or more at the recommended level; under four is not meant to win** | **about 30 minutes for four** |

**The owner's exception** to "every boss can be soloed" (`progression.md` principles): only final bosses.

## The way in: deep route, approach, den
Every final boss sits at the end of the same three steps, past the island's hard pocket:
1. **The deep room** (a new combat room past the pocket's far end): harder than the pocket, up to the
   island's top level, elites throughout, mobs and a landscape of its own, no waystone (hard pockets have
   none), a red level chip. It's what makes the journey there feel deep, and it's worth farming on its own.
2. **The approach** (a new room, no mobs): the cinematic walk. Safe ground where the party gathers before
   going in. What makes it cinematic, all drawing and sound, never `step()` and never a forced cutscene
   (`delivery.md`: the story never takes control away):
   - **the boss seen before it's met**: a silhouette in the background art (a parallax layer) that grows
     as you walk, or a shape behind a wall of ice or thorns;
   - **the room changing with distance**: light dimming or shifting colour, the landscape's life (petals,
     drips, lanterns) thinning out, the music falling to a single held note or a heartbeat;
   - **closing in**: the walls, roof or growth pressing nearer as you go, and the way you came closing
     behind you in the art (thorns knitting back over the road, ice frosting over the stair). Drawing only:
     the door back always works. You should feel shut in, never be shut in;
   - **one line from the boss** when the first slime crosses a mark (sent by the server like boss `lines`);
   - **the den's door as a set piece** (it opens on its own as you come near: thorns drawing back, ice
     cracking open), with both levels on its sign and a count of slimes in the approach beside it
     ("3 here, 4+ recommended"). A count, never a lock.
3. **The den** (the boss's own room, like Sigrun's Seam): on entry a short title card with the boss's name
   and letterbox bars for a few seconds, while you can still move. Then the fight.

## The fight
- **Two levels on show** (owner, 2026-10-24): the boss's own level is **far above** what's recommended, so
  everyone sees how big the challenge is; the **recommended level is lower, with more players**, so people
  are still tempted to try. Shown on the den's door and the approach's sign, on the boss's name tag, and
  on the title card, e.g. "Lv 80 · recommended Lv 60, 4+ players" (Greenhollow) and "Lv 120 · recommended
  Lv 100, 4+ players" (Frostpeak). Defaults `[proposed]`: the boss's level about 20 above the island's top
  (`FINAL_LVL_OVER`); the recommendation is the island's top level and `FINAL_MIN_PLAYERS`.
  - The recommendation is the truth: the FINAL table tunes the fight for four at the **recommended**
    level. The boss's own level is a label for its size, and its stats come from the table, not from the
    frozen curve at that level.
  - Combat has no penalty for fighting above your level (only EXP falls off for fighting below it,
    `overlevelScale`, and never for a top boss, which a final boss is: `expFalloff`), so the high number
    changes nothing by itself. Its EXP and gold come from the
    economy sheet's pricing of a 30-minute kill split four ways, never from the curve at Lv 80 or 120,
    or one kill would hand out several levels.
  - Mobile: the door chip and the title card fit on a phone (`docs/ui/hints.md`).
- **Its own moves, in a designed order.** Not the shared brains with a random pick: each phase is a written
  sequence the party can learn (wind-up, move, opening, the next move), with long, readable telegraphs.
  Moves that chain into each other, moves that need two players to answer at once (one on the weak point
  while the Knight holds the boss), and **set pieces where the room itself changes** (the floor cracking,
  walls of thorns closing in, a phase fought on a different strip of the den). **The first session of each
  final boss writes its move set and phase order on paper for the owner to approve before any code.**
- **Three or four phases** across the 30 minutes, each changing what the party must do, each with a
  line; the last is the hardest.
- **Every S5 mechanic on from the start** (no headcount gate): focus, pulses, curses, barrier, weak
  points, adds, armour, an ultimate to interrupt. A party missing a role struggles badly; every mechanic
  still has a poor answer for any class (the S5 rule).
- **Four is the floor:** HP scales with players (`BOSS_HP_PER_PLAYER`) but never below four players' worth
  (`FINAL_MIN_PLAYERS`), so two strong players can't shrink it.
- **An enrage** at `FINAL_ENRAGE_MIN` (a little past 30 minutes): much stronger, shown in the room, so a
  party that's too weak runs out of time instead of winning slowly.
- **Fainting:** today's combat-room rule (down until a Cleric's Revive or the town); you can walk back in.
- **Rewards: items only** (owner, 2026-10-24: no unique cosmetic or title): the island's best gear, one
  piece per class (S5's loot by class). A long per-player reward window (`FINAL_WINDOW_MS`).
  Priced through `npm run economy` like any den: a 30-minute kill split four ways.
- **The economy sheet** gains a FINAL table: a mixed party of four (one of each class) at its level wins
  near 30 minutes (`FINAL_KILL_MIN`, checked within a band); three can't before the enrage.
- **Mobile:** every telegraph readable and every answer reachable on a phone; the title card and the
  meter fit a phone with four or more names.

## Greenhollow: under the Thornheart (FB1) `[proposed]`
The Hedge Stone says the briar was planted "to keep the road". The final boss is what keeps it.
- **The pocket gets better:** the root knot at the Thornheart's east end opens (the update lifts it: the
  knot has split, a dark way down between the roots). Also worth doing in the same pass: a second find
  in the Maze, and a room hazard at last (thorn patches that grow back, `docs/ideas.md`).
- **The deep room: the Sunken Road** (Lv 55–60, hard): under the briar, the old Keeper road it was planted
  over, its paving stones lifted by roots, lit by glowing seed pods; the briar's oldest growth. Elites only
  and a couple of new mobs (root things, old thorn guards).
- **The approach: the Road's End**: the road climbs out into a hollow walled in white roses. The roses
  turn to follow you, the petals stop falling, and the Thornheart's heartbeat (its music already has one)
  gets louder and slower with every step. Through the canes ahead, something huge breathes.
- **The boss** (name and story to write, `characters/bosses.md`; a creature twisted by a shard, holding on
  to the road it was told to keep): cozy island, so a quiet menace, but the fight isn't gentle.

## Frostpeak: below the Blue Halls (FB2) `[proposed]`
What the old ice-cutters stopped digging toward.
- **The pocket gets better:** the Deep Blue's east end opens (the Hall Troll's useless walls turn out
  to have been blocking a way down, and the update knocks one over). Also in the same pass: a second find, a
  Keeper stone or the cutters' record of why they stopped, and a hazard (thin ice that cracks when stood on,
  drawing and damage only, or a `step()` change done properly).
- **The deep room: the Old Ice** (Lv 90–100, hard): the oldest, black-blue ice at the glacier's bed, the
  cutters' last abandoned camp, things frozen in the walls that are older than the hamlet. Elites and a
  couple of new mobs.
- **The approach: the Long Stair**: a stair the cutters cut down into clear ice and never finished. On the
  way down, the shape of the boss shows through the ice wall beside you, bigger with each landing. Lanterns
  out one by one, the music down to the ice's own hum; at the bottom the ice of the door cracks open on its own.
- **The boss** (name and story to write; melancholy, cold, almost no humour, Frostpeak's register).

## Emberdeep (E5, after E4) `[default]`
The same three steps past the Old Foundry (or the Drained Tubes, whichever is darker and more closed in
once built: the owner's trapped-feeling rule), at Lv 150. Planned with Emberdeep's own
phases (`world/emberdeep-depth.md`).

## Phases
Each its own session (or two) and dev copy. Before building: read `progression.md` section 6,
`s5-plan.md`, `docs/combat/bosses.md`, `docs/places/branches.md` and the pocket's doc.
- [ ] **FB1: Greenhollow's final boss**: (a) the move set and phase order on paper for the owner (written
      2026-10-26: `fb1-plan.md`, waiting on the owner);
      (b) the Thornheart's pass, the Sunken Road, the Road's End; (c) the den and the boss, the FINAL table.
- [ ] **FB2: Frostpeak's final boss**: the same, through the Blue Halls, the Old Ice and the Long Stair.
- Then each new island's depth pass ends with its own (Emberdeep's is E5).

## Open questions for the owner (default first)
1. The reward window: a day, or a week?
