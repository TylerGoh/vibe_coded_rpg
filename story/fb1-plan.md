# FB1: Greenhollow's final boss, on paper (for the owner to approve)

**Status: second draft 2026-10-26, with the owner's answers; waiting on the owner's OK of the move set. No
code.** Step (a) of FB1 in `final-bosses.md`: the boss, its move set and its phase order, before anything is
built. Numbers are aims, not code: the economy sheet sets the real ones.

## Owner's answers (2026-10-26)
- **The boss: Ladon, the Briar Hydra** (picked from a list of mythological creatures; the first draft, a
  giant hedgehog, wasn't menacing enough, and a second list of briar creatures not mythological enough).
- **~45 minutes** for a mixed party of four at Lv 60 (SP6's `TOP_PARTY_MIN`, not the older plan's 30).
- **Four phases.** **No physics changes**: the closing walls are hazards (they hurt; they don't block).
- **Fixed HP**: a final boss's HP never changes with the headcount. It's always a party of four's worth: no
  `BOSS_HP_PER_PLAYER` growth and no floor rule, one number in the FINAL table. Five players make it faster;
  two make it very long.
- **No reward window** on the final bosses: the rewards aren't strong enough to be worth locking. Every kill
  pays in full (no `FINAL_WINDOW_MS`, and `BOSS_WINDOW_MS` doesn't apply to them).

## The boss: Ladon, the Briar Hydra
**The myth.** In the old story Ladon is the many-headed dragon that guarded the garden of golden apples, and
it never slept. Cut a head off the hydra and two grow back, unless fire seals the wound.

**In Slimeville.** The Keepers set Ladon under the Wildwood to keep their road, and told it never to sleep
while the road was open. Then they left, and the road was never closed. Ladon has been awake ever since.
Its body is the great root knot at the Thornheart's east end; **the briar is its necks**, grown out over the
years through the whole east of the island. The shard is set in the brow of its first and largest head,
which stays back in the dark until the end.

**Why it fits.**
- *Holding on vs letting go* (`characters/bosses.md`): it can't let go even of a lost head. Cut one and two
  grow back: it refuses to lose anything, and it gets worse for every refusal.
- *Menace*: you never see all of it. Heads come out of the walls, out of the floor, out of the dark;
  pairs of white eyes open behind the canes as you walk in.
- *The trapped feeling*: you're under the briar, inside the thing that grew it. Every wall is a neck.
- *Tier 1 only*: the Keepers, a road, an order, a shard. Nothing names where the road goes. In the art the
  road runs off west, under the island toward the village, with an old root along its edge (the same quiet
  hint as the Root Stone and the Road Stone). In the myth Ladon guards an apple tree; Slimeville has a very
  old one. Nobody in the game ever says so.
- It agrees with what's in the game: the Hedge Stone ("planted to keep the road") and the Root Warden
  ("hold the gate until we come again"). The Warden keeps the high road and Ladon the low one; they're the
  same order given twice. The Bramble Behemoth's briar is the wild outer edge of Ladon's.

**Its look.** Necks of black-green briar, thick as trunks, thorns like teeth along them. Heads like long
dragon skulls of woven thorn, with leaf frills and white roses for eyes that glow. A faint green glow in
each throat. The first head is twice the size, crowned with thorns, the shard a gold-white light in its brow.

**Levels.** Lv 80 on its name tag; "recommended Lv 60, 4+ players" on the door, the approach sign and the
title card (`FINAL_LVL_OVER`). Its stats come from the FINAL table, never from Lv 80.

## The heads (its own mechanic)
The one thing no other boss does, straight from the myth:
- Ladon is one boss with one HP bar, but **its heads are targets of their own**. Each head has a small ring
  (like a weak point's): fill it and **the head falls**. That's a big chunk off Ladon's HP, the head stops
  attacking, and a stump is left.
- **A stump grows back as two heads** after a while (a sprouting stump is drawn as it swells), **unless it's
  burned.** Any fire hit on the stump seals it: an Elementalist's fire spells, a burn, a Cleric's holy light
  (Smite, the holy bolts). A sealed stump stays sealed until the next phase, when the necks push through again.
- More heads means more attacks at once. The cap is seven.
- **Poor answer** (the S5 rule: every mechanic answerable by any class): no fire, so you cut the two new
  heads as well. Slower and noisier, never stuck. (Later, if wanted: a brewed lamp-oil flask anyone can
  throw at a stump, `docs/places/alchemy.md`.)
- **Reaching the heads**: arrows reach any head (the Archer's job, as on any weak point). Heads come low
  when they bite, and **a head that bites sticks in the ground for a few seconds**: that's melee's opening.
- Each falling head scatters seeds that grow into **briarlings** (the adds).
- The **body** (the root knot at the back of the den) can always be hit for normal damage. Cutting heads is
  faster than hitting the body, and it makes the fight quieter.

## The arena: the Root of the Road
A long den, about the width of the Warden's court. The old Keeper road runs along the floor: paving stones
pushed up by roots, lit by glowing seed pods. Two low ledges (root arches) on each side and one high one in
the middle, with room for four, barely. Ladon's body fills the back wall; its necks are the roof and the
side walls. The road goes on west into the dark (art only).

**No physics changes**: every set piece is a hazard, drawn and timed by the server, that hurts you if you
stand in it. Nothing changes the platforms or `step()`.

## The order of the fight
Four phases (the shared boss has three: `PHASE_AT` gets a FINAL row). Each is a **fixed loop** the party can
learn, not a random pick: wind-up, move, opening. Every S5 mechanic is on from the first slime (`partyAll`);
each phase leans on some of them. Heads act **in turn**, and the head about to act lights its eyes first.
Moves marked *new* need code; the rest reuse a shared move with Ladon's look.

### Phase 1: The Three (100% to 75%, ~10 min)
Three heads, out of the walls. The first head is only a pair of eyes in the dark behind the body.
**Loop:** Watch → Bite, Bite, Bite → Lash → (Bark every other loop)
1. **Watch** (the focus): the eyes in the dark settle on one slime, and the focus line runs to them out of
   the dark. Every head bites at whoever is watched. Rally takes it as always.
2. **Bite** (*new*, from `leap`): one head after another rears back (eyes lit, ~1.2 s) and strikes down at
   the watched slime's spot, marked on the floor. It sticks in the ground for a few seconds: melee's opening.
3. **Lash** (`beam`, briar look): a neck sweeps across the den at one of two heights, floor or ledge,
   shown in its wind-up. Stand where it isn't.
4. **Bark** (every other loop; the armour, `looks.shell: 'bark'`): the body's root knot hardens. Ordinary
   hits on the body do little; heavy hits crack it (Berserker, Snipe, a shatter). Heads aren't armoured.
- **The heads start growing back here.** A party that cuts heads without fire ends phase 1 with five or six.
- **The ultimate, Hundred Heads** (*new*, from `lanes`), first below `ULT_FIRST`: every neck rises at once
  out of the walls and the floor and strikes down across the den. The safe places are the few gaps
  between the necks, marked in the wind-up. Freeze it in the wind-up to stop it.

**Its line, entering:** "Awake. Awake. Always awake. Something is on the road."

### Phase 2: The Briar Wakes (75% to 50%, ~11 min)
The stumps all push through again (sealed ones too): **five heads**. The briar curse joins.
**Loop:** Watch → Coil → Bite, Bite → Thorn Rows → Breath → (White Rose Ward every other loop)
1. **Coil** (*new*, the two-player answer): all the heads turn to the watched slime and coil toward them,
   about 4 s. **Only while they're turned do their throats show, glowing, on the far side**, and a hit on a
   glowing throat does extra and fills the head's ring fast. So the Knight takes the Watch with Rally and
   holds still, the heads all turn to face him, and the rest of the party gets behind the necks. If the
   watched slime runs, the heads turn after them and the throats swing away.
2. **Bite, Bite**: as in phase 1, faster.
3. **Thorn Rows** (`grid`, root look): necks burst up out of the floor in alternate rows, two waves.
4. **Breath** (the pulse, `looks.pulse`: a green hiss of thorn dust): every head draws in at once, a long
   warning, then breathes out across the whole den. Everyone takes a share of max HP. The Cleric's Barrier
   and heals answer it; potions and the Barrier Draught are the poor answer.
5. **White Rose Ward** (the barrier, `looks.dome: 'rose'`): white roses close over the body in a dome. A
   Mage breaks it fastest; a Cleric's holy bolts and Smite help. The heads outside it can still be cut. First
   time, a `lines.shield`: "The roses. They planted the roses over me. Nothing gets through the roses."
- **The curse** (the thorns, `looks.curse: 'thorn'`): a briar sigil opens under someone. Step out, or the
  thorns take root in you. Cleanse lifts it.
- **Briarlings** (adds) grow wherever a head falls; more heads cut, more briarlings.
- **Hundred Heads** as in phase 1, more often.

**Its line:** "Two for one. Two for one. Every one you take, I keep twice."

### Phase 3: The Coils (50% to 25%, ~12 min): the set piece
Six heads. **The necks coil in from both ends of the den,** one step at a time, and the arena gets narrower.
**The rule:** each time the **Breath** lands, the coils take one step in. Each time the party **cuts a head
or staggers Ladon** (the ward broken, the bark broken, an ultimate interrupted), they draw back one step. A
party that answers the mechanics keeps its room; one that doesn't gets squeezed. In phase 3 the coils stop at
a narrow middle strip; only the enrage closes them all the way.
**Loop:** Breath → Watch → Coil → Bite, Bite, Bite → Bark or White Rose Ward (alternating) → Lash
- Every move from phases 1 and 2, in a smaller room. The bites land on top of the thorn rows' leftovers.
- **Its second ultimate, Strangle** (*new*, from `stomp`): the coils surge in all at once, floor and low
  ledges. The only safe place is the high middle ledge, which just fits four. Freeze it in the wind-up to stop
  it. Phase 3 alternates Hundred Heads and Strangle; the wind-up says which (the heads rise for one, the coils
  tense for the other).
- An ultimate nobody interrupts also hits the people in the safe place (`TOP_ULT_HP`), as on any top boss.

**Its line:** "Closer. A hedge is for keeping. I keep."

### Phase 4: The First Head (25% to 0%, ~12 min): the hardest
The first head comes out of the dark: twice the size of the others, crowned with thorns, the shard in its
brow. The coils stay where phase 3 left them. Every stump grows back; the others keep fighting.
**Loop:** Hundred Heads or Strangle (alternating) → Watch → The Gaze → Breath → Thorn Storm → Coil →
White Rose Ward and Bark *together*
1. **The ultimates come in turns** as in phase 3, and more often.
2. **The Gaze** (*new*): the first head lowers itself to the floor and stares at the watched slime, eyes
   blazing, for a few seconds. While it's down, **the shard in its brow is the weak point** in reach of melee
   (arrows reach it any time it's open). Filling it staggers Ladon for longer than anything else. The watched
   slime takes heavy damage the whole time it stares, so the Knight holding the Watch is the one who can take it.
3. **Thorn Storm** (`barrage`, thorn look): every head spits thorns in a fan at the watched slime, then at
   someone else.
4. **Both shields at once** (final bosses only): the roses outside, the bark under them. The Mage takes the
   roses, the Berserker the bark. With only one of them the shields wait out their time.
- **Focus, curse, adds and the regrowing heads run all phase.** A party missing a role has its worst time here.

**Its line:** "I have not closed my eyes since they left. Not once. You will not be the reason."

### The enrage (`FINAL_ENRAGE_MIN`, a little past 45 minutes)
The petals in the den turn to thorns. Every stump grows back at once and nothing seals them, the coils close
to the middle over about a minute and nothing pushes them back, and the Breath comes twice as often. A party
that's too weak runs out of time instead of winning slowly.

### Freed
The heads sink one by one, the first head last. It lays its brow on the road, and for the first time, its eyes
close. Its line: "...They're not coming back. Then... may I sleep? Only a little. I've been awake so long."
The coils go slack. (Later, with story delivery: the Thornheart's roof thins and daylight comes in, a
"freed" world change.)

## Every class's answer (the S5 rule: no mechanic belongs to one class)
| what it does | best answer | everyone else |
|---|---|---|
| The heads (cut, regrow) | Archer cuts (every arrow reaches); Mage or Cleric burns the stump | melee cuts heads stuck after a bite; cut the regrown pair too |
| Watch (focus) + Bite | Knight's Rally: he takes it and places the bites | the watched one Dashes; get on a ledge |
| Coil (throats) | Knight holds the Watch still, the others get behind the necks | hit the throats while they swing |
| Bark (armour) | Berserker, Snipe, a shatter, Meteor | wait it out; cut heads instead |
| White Rose Ward (barrier) | Mage; a Cleric's holy bolts and Smite | wait it out; cut heads instead |
| Breath (pulse) | Cleric's Barrier and heals; Knight's Bubble, Sanctuary, Aegis | potions, the Barrier Draught |
| Thorns (curse) | Cleric's Cleanse | step out; stand far off to fade it; the Cleansing Tonic |
| Hundred Heads / Strangle (ultimates) | Frostbinder freezes the wind-up | the gaps / the high ledge |
| The Gaze (the shard) | Archer; the Knight takes the stare | jump for it while the head is down |
| Briarlings (adds) | area attacks (Cyclone, Blizzard, Spread Shot) | single hits |
| The coils (phase 3) | cut heads and stagger it: every right answer pushes them back | live in a narrow room |

## Rewards (items only, owner; no reward window)
One piece per class, Greenhollow's best, a clear step above the Root Warden's on the frozen curve (S5's loot
by class): *Ladon's Fang* (Warrior), *the Unsleeping Staff* (Mage), *the White Rose Rod* (Cleric), *the
Hydra's Sinew Bow* (Archer), plus a shared chance of *the Crown of Thorns* (a hat). Gold and EXP from the
economy sheet: a 45-minute kill split four ways. A mini Ladon pet (three tiny heads that bicker), priced above
the mini Root Warden.

## On the way there (part (b), summarised; designed in full when it's built)
- **The Thornheart gets better:** the root knot at its east end has split (the update does it), and there's
  a dark way down between the roots. Also: a second find in the Maze, and thorn patches that grow back
  (the pocket's hazard, `docs/ideas.md`).
- **The Sunken Road** (deep room, Lv 55–60, hard, elites only): the Keeper road under the briar. New mobs:
  *briarlings* (Ladon's seeds, grown wild), *old road guards* (Keeper stone figures the briar has grown
  through: front shell), *seed-pod lanterns* (rooted, lob glowing seeds), *root creepers* (dive under and come
  up behind). The elite at the far end: **the Severed Neck**, a head that was cut off long ago and grew a body
  of its own.
- **The Road's End** (the approach, no mobs): the road climbs into a hollow walled in white roses. The petals
  stop falling. Behind the canes something huge moves, and pairs of white eyes open in the dark, one after
  another, more with every step. The Thornheart's heartbeat turns into several heartbeats out of time with each
  other. The briar knits shut behind you (art only; the way back always works). One line when the first slime
  crosses the mark: "Something is on the road." At the end the necks draw back from the den's door by
  themselves, with the two levels on its sign and "3 here, 4+ recommended" beside it.
- **The den:** a title card "LADON, THE BRIAR HYDRA · Lv 80 · recommended Lv 60, 4+ players" and letterbox
  bars for a few seconds while you can still move. Mobile: both fit a phone.

## What's new in code (so the owner can see the size)
- A FINAL row in the boss data: four phases, written loops instead of random picks, fixed HP for four, the
  enrage.
- **The heads**: several hit targets on one boss, each with a ring, falling, stumps, regrowing two, fire
  sealing them (hits on a head carry which head, like the weak point's flag; the server caps them the same way).
- New moves: Watch (the focus from the dark), Bite (sticks in the ground), Coil (the throats), the Gaze, and two
  ultimates (Hundred Heads, Strangle). Both shields at once.
- The phase 3 coils: a server-timed hazard that steps in on a Breath and back on a cut head or a stagger.
- Art: the body, the necks and heads (and stumps, sealed and swelling), the first head, the den, the coils,
  the roses, the briarlings, the Sunken Road and its mobs, the Road's End and its eyes, the title card. Music:
  the approach's heartbeats and Ladon's own track.
- Two sessions: (b) the way there, then (c) the den and the boss.

## Questions for the owner
1. **The heads** (cut, two grow back unless burned): the core of the fight. OK as written?
2. **Seven heads at most**, three at the start: too many on screen for a phone, or about right?
3. **Two ultimates**, alternating from phase 3: OK?
