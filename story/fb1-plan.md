# FB1: Greenhollow's final boss, on paper (for the owner to approve)

**Status: written 2026-10-26, waiting on the owner. No code.** Step (a) of FB1 in `final-bosses.md`: the boss,
its move set and its phase order, before anything is built. Everything here is `[proposed]`; the questions
at the bottom are the ones I need answered. Numbers are aims, not code: the economy sheet sets the real ones.

One change from `final-bosses.md`: it says "about 30 minutes", but SP6 made every top boss ~45 minutes for four
(`TOP_PARTY_MIN`, roadmap item 1.3). This plan aims at **~45 minutes for a mixed party of four at Lv 60**,
and the enrage comes a little after that.

## The boss: Old Quill, the Hedge-Keeper
**What it is.** A hedgehog the size of a house. Long ago the Keepers set her across their road under the
Wildwood and told her to *keep the road*: curl up, and let no one by until they came back. They planted
the briar round her as her hedge. They never came back. She stayed curled, and over the years her quills
took root and grew into the briar: **the Thornheart is her.** The great root knot at its east end is the
top of her back. The shard is lodged deep between her quills, and it keeps her curled.

**Why it fits.**
- *Holding on vs letting go* (`characters/bosses.md`): she has held the curl so long she's forgotten how
  to uncurl. The briar choking the east of the island is one creature refusing to let go of an order.
- *Cozy island, quiet menace*: a hedgehog is soft and storybook, and a pun (the *hedge*-hog who keeps the
  hedge). Up close she's huge, slow and patient, she breathes, and she won't move.
- *The trapped feeling* (owner's rule): you're under the briar, inside the thing that grew it. The walls
  are her quills.
- *Tier 1 only*: the Keepers, a road, an order, a shard. Nothing about where the road goes, the Wheel or
  the Heartroot. The road carries on past her into the dark, wet and sunk (a quiet nod toward the drowned
  Keeper roads of the Sunken Reach, atlas Phase 10. Shown in the art only, never a door).
- It agrees with what's already in the game: the Hedge Stone ("planted to keep the road"), the Road Stone
  and the Root Warden ("hold the gate until we come again"). The Warden kept the high road and she keeps
  the low road. They're the same order, given twice, and both of them obeyed it. The Bramble Behemoth's
  briar is the wild outer edge of her hedge.

**Her look.** A dome of briar quills, plum and moss-green, white roses caught in them. When she uncurls:
a long soft grey-brown snout, a wet black nose, small, very old eyes, little clawed hands, a pale belly.
In phase 4 the shard shows in her chest, a gold-white glow between the quills.

**Levels.** Lv 80 on her name tag; "recommended Lv 60, 4+ players" on the door, the approach sign and the
title card (`FINAL_LVL_OVER`, `FINAL_MIN_PLAYERS`). Her stats come from the FINAL table, never from Lv 80.

## The arena: the Kept Road
A long den, about as wide as the Warden's court. The old Keeper road runs along the floor: paving stones
pushed up by roots, lit by glowing seed pods. Two low ledges on each side (root arches) and one high one
in the middle, so there's always somewhere off the floor. Her quills make the roof and the far walls.
The road goes on east past her into the dark (art only).

**The room changes, but the physics doesn't.** Every set piece below (thorn walls closing in, quills on
the floor) is a **hazard**: drawn, timed by the server, hurting you if you stand in it. Nothing changes the
platforms or `step()`, so there's no desync risk (`docs/netcode.md`). A wall of thorns you can walk into
and get hurt is a wall the party learns to respect. If you want walls that truly block, see question 4.

## The order of the fight
Four phases (the shared boss has three: `PHASE_AT` gets a FINAL row). Each is a **fixed loop** the party
can learn, not a random pick. Each move has a long, readable wind-up, then the move, then an opening. Every
S5 mechanic is on from the first slime (`partyAll`); each phase leans on some of them.

Moves marked *new* need code. The rest reuse a shared move with her own look (`looks`).

### Phase 1: The Hedge (100% to 75%, ~10 min)
She stays curled: a ball of quills on the road. She doesn't walk. She rolls.
**Loop:** Sniff → Roll → Shed → Thud → Opening → (Bristle every other loop)
1. **Sniff** (*new*, the focus): her snout pokes out of the ball and sniffs. The focus line goes to one
   slime. Rally takes it as always.
2. **Roll** (*new*, from `charge`): she tucks, rocks back (a long rumble, the quills flatten, ~1.5 s), then
   rolls the length of the den at the focused slime and out to the far wall. She's as tall as the low
   ledges, so get on a ledge or Dash/Blink through her.
3. **Shed** (*new*, floor hazard): where she rolled she leaves a carpet of shed quills, in patches with
   gaps. It hurts to stand on for a while, then withers. **This is the floor control of the whole fight:**
   the den slowly fills with places you can't stand.
4. **Thud**: she hits the wall. The roof shakes and canes drop where shadows show (`rain`, briar look).
5. **The opening** (*new*, ~5 s): she's dizzy against the wall. Her snout uncurls and her nose is the weak
   point, **low and on her front** (`weak.front`), so melee can reach it. Fill it and she staggers.
6. **Bristle** (every other loop; the armour): her quills stand up and lock (`armour`, `looks.shell:
   'quill'`). Ordinary hits do little. Heavy hits crack it: Berserker, Snipe, a shatter.
- **Every class's answer here**: the Knight holds the Sniff so the Roll goes where he wants it; the Archer
  fills the nose; the Berserker cracks the quills; a Frostbinder can freeze her mid-roll (slowed, not
  stopped). Without any of them it's slower: dodge the roll, hit the nose by jumping.
- **The ultimate, Curl Tight** (*new*: `stomp` with a twist), first below `ULT_FIRST`: she draws in and
  every quill on the floor stands up at once, the whole floor and the low ledges. Be on the **high** middle
  ledge (only room for two or three at a time, so the party has to choose) or freeze it in the wind-up.

**Her line, entering:** "Hush. You're on the road. Nobody walks the road. I was told."

### Phase 2: The Briar Wakes (75% to 50%, ~11 min)
She half-uncurls and stands on all fours. The briar wakes with her: the walls are part of her now.
**Loop:** Lash → Snuffle → Rose Ward → Rows of Thorns → (Hoglets every other loop)
1. **Lash** (`beam`, cane look): a cane cracks across the den at one of two heights, floor or ledge, and
   which one is shown in its wind-up. Stand where it isn't.
2. **Snuffle** (*new*, the two-player answer): she rears onto her hind legs and snuffles toward her focus
   for ~4 s. **Only while she's up does her belly show (the weak point, high on her front).** So the Knight
   holds the focus *in front of her* and stays there, and the Archer shoots the belly from the same side.
   If the focus is behind her, nobody reaches the belly. If the focused slime runs, she turns and it's
   gone. This is the move the plan asks for: one on the weak point while the Knight holds the boss.
3. **Rose Ward** (the barrier, `looks.dome: 'rose'`): white roses close over her in a dome. A Mage's spells
   break it (fire does it fastest, which fits the briar); a Cleric's holy bolts help. Unbroken it lasts a
   long time (`TOP_BARRIER_S`) and roughly doubles the phase. First time, a `lines.shield`: "The roses.
   They were planted for me. They'll keep me."
4. **Rows of Thorns** (`grid`, root look): canes burst up out of the floor in alternate rows, two waves.
   Mixed with the shed quills from phase 1 still on the floor, the safe squares get scarce.
5. **Hoglets** (adds): her little ones roll in from the walls, tiny curled balls of briar. They roll at
   whoever is nearest. Cute and annoying. More for a bigger party (`ADDS_PER_FIGHTER`).
- **The curse joins** (`looks.curse: 'thorn'`, the Thorn Hart's): a briar sigil under someone; step out,
  or the thorns "take root in you". Cleanse lifts it.
- **The ultimate, Curl Tight**, as in phase 1, a bit more often (`ULT_EVERY`).

**Her line:** "Oh, you're still here. Little ones always want to see what's down the road. There's nothing.
There's the road, and me on it."

### Phase 3: Closing In (50% to 25%, ~12 min): the set piece
The hedge closes. **Thorn walls grow in from both ends of the den,** one step at a time, and the arena
gets narrower. This is the room changing.
**The rule:** each time her **Breath** (the pulse) lands, the walls take one step in. Each time the party
**staggers her** (the ward broken, the quills broken, the belly filled, an ultimate interrupted), they draw
back one step. So a party that answers the mechanics keeps its room, and one that doesn't gets squeezed.
The walls never close fully in phase 3 (they stop at a narrow middle strip). The enrage does that.
**Loop:** Breath → Roll → Bristle or Rose Ward (alternating) → Lash → Snuffle
1. **Breath** (the pulse, `looks.pulse: 'breath'`, the green-plum version): the whole briar rises and falls
   once, slowly (a long warning: the roof lifts). It hurts everyone a share of max HP. The Cleric's Barrier
   and heals answer it; potions and the Barrier Draught are the poor answer.
2. **Roll**, but now in a narrow room: she bounces off the walls, so she crosses twice.
3. Then her shield, alternating each loop: Bristle (the quills) or Rose Ward (the roses).
4. **Lash** and **Snuffle** as in phase 2.
- **Her second ultimate, Keep the Road** (*new*: `lanes` with a twist): she lowers her head and the walls
  surge in all at once, to the middle. The one safe place is **the road itself**: a single strip of
  paving stones lit by the seed pods, and it's somewhere different each time. Unanswered, it also hits the
  people on the road (`TOP_ULT_HP`). Freeze it in the wind-up to stop it.

**Her line:** "Closer. Closer. That's what a hedge is for. You keep things in by holding on."

### Phase 4: The Last of the Road (25% to 0%, ~12 min): the hardest
She uncurls all the way and stands up on her hind legs, the height of the den. The shard shows in her
chest. The walls stay where phase 3 left them.
**Loop:** Curl Tight or Keep the Road (alternating) → Snuffle → Breath → Quill Storm → Roll → Rose Ward and
Bristle *together*
1. **Ultimates come in turns**: Curl Tight (go high), then Keep the Road (go to the road) next time. The
   party must read which one is coming from the wind-up: she draws in for one, lowers her head for the
   other.
2. **Snuffle**: the belly weak point is now **the shard itself**. Filling it here staggers her for longer.
3. **Quill Storm** (*new*, `barrage`, quill look): she shakes and fires quills in a fan at the focused
   slime, then a second fan at someone else.
4. **Both shields at once** (a final boss only): the Rose Ward outside, the quills under it. The Mage takes
   the roses, the Berserker the quills. With only one of those, the shields wait out their time.
- **Focus, curse and adds run all phase.** Everything at once. This is where a party missing a role has
  the worst time.

**Her line:** "I can't. If I let go, the road's open, and they told me. They told me to keep it."

### The enrage (`FINAL_ENRAGE_MIN`, a little past 45 minutes)
The petals in the den turn to thorns (shown). The walls close in to the middle over about a minute,
nothing pushes them back, and the Breath comes twice as often. A party that's too weak runs out of time
instead of winning slowly (the plan's rule).

### Freed
She uncurls on the road, stretches for the first time in an age, yawns, and lies down across the stones
like any old hedgehog in the sun. The quills on the walls go soft. Her line: "...They're not coming back,
are they. Then I can stretch. Oh. Oh, that's nice. Go on, little ones. The road's yours as far as it goes."
(Later, with story delivery: the Thornheart's roof thins and daylight comes in, a "freed" world change.)

## Every class's answer (the S5 rule: no mechanic belongs to one class)
| what she does | best answer | everyone else |
|---|---|---|
| Sniff (focus) + Roll | Knight's Rally: he takes it, and aims the roll | the focused one Dashes; get on a ledge |
| Snuffle (belly weak point) | Archer from in front, while the Knight holds her facing | jump for it from in front; a staff bolt mid-jump |
| Bristle (armour) | Berserker, Snipe, a shatter, Meteor | wait it out |
| Rose Ward (barrier) | Mage (fire), a Cleric's holy bolts and Smite | wait it out |
| Breath (pulse) | Cleric's Barrier and heals; Knight's Bubble, Sanctuary, Aegis | potions, the Barrier Draught |
| Thorns take root (curse) | Cleric's Cleanse | step out; stand far off to fade it; the Cleansing Tonic |
| Curl Tight / Keep the Road (ultimates) | Frostbinder freezes the wind-up | be high / be on the road |
| Hoglets (adds) | anyone's area attacks (Cyclone, Blizzard, Spread Shot) | single hits |
| The walls (phase 3) | stagger her: every right answer pushes them back | live in a narrow room |

## Rewards (items only, owner)
One piece per class, Greenhollow's best, on the frozen curve a clear step above the Root Warden's (S5's
loot by class, a long per-player window `FINAL_WINDOW_MS`): *the Quillsteel Blade* (Warrior), *the
Briarheart Staff* (Mage), *the White Rose Rod* (Cleric), *the Old Quill Bow* (Archer), plus a shared
chance of *the Hedge-Keeper's Hood* (a hat). Gold and EXP from the economy sheet: a 45-minute kill split
four ways. A mini Old Quill pet, priced above the mini Root Warden.

## On the way there (part (b), summarised; designed in full when it's built)
- **The Thornheart gets better:** the root knot at its east end has split (the update does that), and
  there's a dark way down between the roots. Also: a second find in the Maze, and the thorn patches that
  grow back (the pocket's hazard, `docs/ideas.md`).
- **The Sunken Road** (deep room, Lv 55–60, hard, elites only): the Keeper road under the briar. New mobs:
  *hoglets* (hers, wild, curled: roll at you), *old road guards* (Keeper stone figures the briar has
  grown through: front shell), *seed-pod lanterns* (rooted, lob glowing seeds), *root creepers* (dive
  under and come up behind). One new elite at the far end.
- **The Road's End** (the approach, no mobs): the road climbs into a hollow walled in white roses. The
  roses turn to follow you. The petals stop falling. The heartbeat gets louder and slower. Through the
  canes, a great curved shape of quills rises and falls: her back, breathing, bigger with every step. The
  briar knits shut behind you (art only; the way back always works). One line from her when the first
  slime crosses the mark: "Someone's on the road." At the end, the canes draw back from the den's door by
  themselves, with the two levels on its sign and "3 here, 4+ recommended" beside it.
- **The den:** a title card "OLD QUILL, THE HEDGE-KEEPER · Lv 80 · recommended Lv 60, 4+ players" and
  letterbox bars for a few seconds while you can still move. Mobile: both fit a phone.

## What's new in code (so the owner can see the size)
- A FINAL row in the boss data: four phases, written loops instead of random picks, the HP floor of four
  (`FINAL_MIN_PLAYERS`), the enrage.
- New moves: Sniff, Roll (with the bounce in phase 3), Shed (quills left on the floor), Snuffle (the belly
  only while she's up), Quill Storm. Two new ultimates. Both shields at once.
- The phase 3 walls: a server-timed hazard that steps in on a pulse and back on a stagger.
- Art: the boss (curled, half-up, standing), the den, the walls, the roses, the hoglets, the Sunken Road
  and its mobs, the Road's End, the title card. Music: the approach's heartbeat and her own track.
- Big enough for two sessions: (b) the way there, then (c) the den and the boss.

## Questions for the owner (my default first)
1. **The boss:** a giant hedgehog, Old Quill, the Hedge-Keeper? Or something else (a briar stag-mother, a
   great sleeping rose, a Keeper of thorns)?
2. **Length:** ~45 minutes for four, as SP6 set for top bosses? Or the plan's older ~30?
3. **Four phases** as written above, or cut to three (drop phase 1's curled-only part)?
4. **The walls in phase 3:** hurt you if you walk into them (default: no physics change, no desync risk)?
   Or truly solid, which means changing `step()` and is a bigger job?
5. **The reward window** (open in `final-bosses.md`): a day or a week? Default: a week, since it's 45
   minutes for four people.
6. **Four phases with two ultimates:** too much to learn, or about right for a final boss?
