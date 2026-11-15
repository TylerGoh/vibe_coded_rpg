# C6: the Citadel's final boss, the Escapement, on paper

**Status: written 2026-11-15 at the owner's "continue with next phase". Every `[default]` stands unless the owner changes
it (the standing "make liberal decisions" instruction). (b) built the same day (`docs/places/undercroft.md`); (c) built the
same day too, at "continue with next phase and the phase after" (`docs/places/escapement.md`, its liberal decisions
there). C6 is done.** Step (a) of C6 (`citadel-plan.md`, `final-bosses.md`): the boss, its moves and its phase order, before the fight
is built. Numbers here are aims, not code; the economy sheet sets the real ones. It's built on the final-boss engine
(`docs/combat/bosses.md` "Final bosses", `src/shared/final.js`, `server/final.js`): a FINAL row, written loops, the
enrage, fixed HP for four, no reward window. What's new is marked *new*.

## Carried over (owner, FB1, FB2, E5, L5)
- About 45 minutes for a mixed party of four at the recommended level, in four phases.
- No physics changes: every set piece hurts, nothing blocks.
- Fixed HP, no reward window, items-only rewards.
- Telegraphs are kept, and no hint names the answer.
- Boss challenges from day one (`docs/combat/challenges.md`): it ships with a `ch` list, not a retrofit.

## The band: the Citadel's top is Lv 215 `[default]`
- C0 stretched the plan's band past 200, as the owner's 2026-11-12 note asked. The Undercroft is **Lv 205–215**, and the
  Escapement is fought at **Lv 215**.
- `CITADEL_TOP` = 215, so its tag reads **"Lv 235 · recommended Lv 215, 4+ players"** (`finalTag`).
- That makes it the game's top for now. Lantern Fen tops out at 190 (the Wickmother), and the Bell Walks run to 208.
- Between 205 and 215 there are two places: the Bell Walks' top (to 208) and the Undercroft. Past 208 it's the Undercroft
  alone, like the Peat Barrows was at 180–190. Amberdune (Phase 9) is where the next band goes.

## Where: under the Keel, down to the hub
The Keel is the Citadel's darkest, most closed-in place (the owner's "trapped" mood). Its far end already has the way down
(C5's gate, `fallentooth`: a tooth of the Wheel fallen across the shaft). So:
1. Down past the tooth into **the Undercroft** (the deep room): the floor of the city's underside, right under the Wheel.
2. Then along **the Spoke** (the approach): a walk down one of the Wheel's great spokes toward its hub.
3. Then **the Catch** (the den), where the Escapement hangs off the hub with the Wheel clamped in its pallets.

The way in is always down and in, toward the middle: the opposite of the Bell Walks' open sky.

## The boss: the Escapement
**Nobody living names it.** The Commissary has it on a parts list ("ESCAPEMENT, MAIN. IN SERVICE."). The Last Echo goes
quiet at it. Folio has a drawing of it with the label torn off.

**What it is** (shown, never told):
- The Wheel's catch: the great toothed anchor on a pivot under the hub that let the Tidewheel turn one tooth at a time,
  tick by tick. Its two pallets (the anchor's flukes) take turns letting a tooth go.
- Under it hangs its pendulum: a crutch of black iron going down into the dark, with a bob of bell bronze as big as a
  house on the end of it.
- In the Stopped Hour, Chronos told it to **hold**. It closed both pallets on the Wheel at once (a catch is never meant to
  do that) and has held ever since. A shard is set in its arbor, the pivot it swings on.
- Beating Chronos freed Pell; it didn't free this. Nobody has told it to let go.

**Why it fits.**
- *Holding on vs letting go* (`characters/bosses.md`): the most literal version in the game. It is a machine whose whole
  job was to let go one tooth at a time, and it has stopped doing it.
- *The trapped feeling*: the bottom of the city, under the Wheel's hub, the teeth closing round.
- *The Citadel's register*: solemn, no whimsy, no living people. Its lines are an order repeated, not a personality. No
  puns.
- *It points at the finale without closing anything*: freed, it unclenches, the city ticks **once** and stops again. The
  Wheel stays jammed for Phase 10.

**Its look.**
- The anchor hangs from the hub's casing at the top of the den, as wide as the den's middle third, in old brass gone dark.
  Its two pallets are bright where they bite the Wheel's teeth.
- The great escape wheel sits overhead, half in the dark, its teeth like a row of houses. The shard glows in the arbor,
  pale aether-blue, the colour of every Citadel light.
- The crutch comes down from the arbor to the bob, and the bob swings.
- No face. It "looks" with the shard, which brightens toward the slime it's counting.

**Levels.** Lv 235 on its name tag; "recommended Lv 215, 4+ players" on the door, the approach sign and the title card.
Its stats come from the FINAL table, never from Lv 235.

## Its own mechanics
### The Beat: the pendulum *new*
- The bob swings across the den on a fixed period (`BEAT_S`, about 3 s for a full swing, the city's own tick). Where it
  passes low over the floor it hurts hard: a band moving with it, drawn and server-timed from the fight's start (the
  grinds' and turbines' pattern: both sides read the tick, a flat hurt with no knockback, no `step()` change).
- **The floor is safe only in its beat.** The bob is low in the den's middle and high at the ends of its swing. So the
  middle is swept twice a period, and the ends are safe while it's in the middle. Stand behind it as it passes, or get up
  on a ledge over its arc.
- The beat drives everything else: its moves land on ticks, its ultimates on the downswing. A party that learns the beat
  learns the fight.

### The Tick: letting one tooth go *new* (the Hold's answer)
- Its two **pallets** (west and east) are props like Fenrir's anchors and the Wickmother's lanterns: hits on them don't
  hurt the boss (`prop` in `applyHits`). They're reachable from the floor at the ends and from the root-high ledges.
- Hit **both pallets within one beat** (`TICK_WINDOW`) and the Escapement lets one tooth go: the Wheel overhead jolts a
  tooth round, it staggers (`TICK_STAGGER_S`), and for `TICK_OPEN_S` it takes more damage (the catch open). Then it bites
  down again.
- That's the plan's "moves that need two players at once": one on each pallet, in time. A Skirmisher's or Archer's
  spread can reach both from the middle, so a party without two melee still has an answer. One slime alone can't make a
  window short enough.
- **The adds block it** (below): a pawl that reaches a pallet jams it, and that pallet can't be struck until the pawl is
  knocked off.

### The pawls (the adds)
- From phase 2, **loose pawls** (the Undercroft's `loose_pawl`) drop out of the teeth a few at a time (`PAWLS_EVERY`).
  Each one crawls to the nearest pallet and jams it in `JAM_S` unless it's killed, frozen, stunned or knocked back first.
- Area attacks and knockbacks are the answer. More come the more Ticks the party has made (the Wheel fights back).

### The Count (the curse)
- Its curse (S5's, `looks.curse: 'count'`): a numeral of light hangs over a slime and counts down with the beat. It
  stacks like every curse (see-through, take more).
- Cleanse lifts it; the Cleansing Tonic is the poor answer.

## The arena: the Catch
- A long den (Ladon's, Fenrir's and the Wickmother's width) in the hollow round the Wheel's hub.
- Overhead the escape wheel's teeth go up out of sight. At the top middle is the anchor on its arbor, with the shard.
- The pendulum hangs down the middle and swings across.
- The floor is the hub's iron casing, riveted plates, worn into a groove where the bob once passed lower than it does
  now.
- Two root-high ledges at each end (bearing housings): over the bob's arc, and level with a pallet each.
- The Spoke comes in at the west end through the hub's door.
- No light but the shard and aether leaking up through the casing's seams.

## The order of the fight
Four phases, each a fixed loop (the FINAL engine), with every S5 mechanic on from the first slime (`partyAll`). Moves
marked *new* need code; the rest reuse a shared move with its look.

### Phase 1: The Order (100% to 75%, ~10 min)
The anchor holds the Wheel, and the beat runs.

**Loop:** The Count → Pallet Strike → Tock → (Locked every other loop)
1. **The Count** (the focus): the shard brightens toward one slime and a numeral of light, ONE, stands over it. Rally
   takes it.
2. **Pallet Strike** (from `stomp`, *new* timing): the pallet on the counted slime's side swings down off the Wheel and
   slams the floor there on the next tick. The tell is the Wheel's tooth it let go creaking. Then it bites again.
3. **Tock** (the pulse, `looks.pulse: 'tock'`): one great tick through the casing, a share of max HP from everyone. The
   Cleric's Barrier and heals answer it; potions are the poor answer.
4. **Locked** (every other loop; the armour, `looks.shell: 'brass'`): both pallets clamp in tight, and plate slides over
   the arbor. Ordinary hits do little; heavy hits (Berserker, Snipe, a shatter, Meteor) break through.

- **The Beat** runs all fight. **The Tick** is open from the start.
- **Challenges:** **late tells** (`late`: some Pallet Strikes land a tick later than the creak says) and **snares**
  (`snare`, looks chain: after a Pallet Strike that missed, a loop of the Rustwyrm's kind of chain comes down on the
  counted slime; enter the arrows).
- **The ultimate, Hold** (*new*, `nova` kind, first below `ULT_FIRST`): both pallets clench at once and a shock runs
  through the whole casing. **Safe: under the bob at the top of its swing** (the lee at whichever end it's swung to,
  shown in the wind-up), or up on that end's ledge. Freeze it in the wind-up to stop it (`INTERRUPT_CHANCE`).

**Its line, entering:** "Hold. I was told to hold. I am holding."

### Phase 2: The Escape Wheel (75% to 50%, ~11 min)
The Wheel overhead strains against the pallets, and teeth start coming down.

**Loop:** The Count → Pallet Strike → Teeth → Tock → Brake → (Locked every other loop)
1. **Teeth** (from `spikes`): the Wheel's teeth drive down out of the dark in a line toward the counted slime, each
   landing marked on the casing, on successive ticks.
2. **Brake** (the barrier, `looks.dome: 'brake'`): a brake band swings shut round the arbor. A Mage unpicks it fastest;
   a Cleric's holy bolts and Smite help. The first time, `lines.shield`: "No. No slip. Not one tooth."

- **The pawls** (adds, above) and **the Count** (the curse) start.
- **Challenges:** **tethers** (`tether`, 2+: a length of chain shackles two slimes; stay close) and **bullet rings**
  (`rings`, looks teeth: rings of sheared gear teeth flung off the Wheel, a gap in each).

**Its line:** "One tooth, and the hour moves. The hour must not move. Hold."

### Phase 3: Counter-Swing (50% to 25%, ~12 min): the set piece
The pendulum swings wider.
- **The sweep grows** (*new*): every loop the bob's arc widens a step (`SWING_STEP`), its low band covering more of the
  floor, until only the end ledges are over it.
- **Each Tick cuts it back a step** (letting a tooth go takes the strain off). So the party that keeps ticking keeps its
  floor (the Wickmother's silk walls' pattern, built on the beat instead of the ends).

**Loop:** Tock → The Count → Pallet Strike → Teeth, Teeth → Brake or Locked by turns
- **Held** (`rescue`, 2+, the cage): the counted slime after a Pallet Strike is caught between a pallet and the Wheel.
  A friend at the pallet enters its arrows to free them, which also strikes that pallet for the Tick.
- **Its second ultimate, Counter-Swing** (*new*, from `wave`): it hauls the bob all the way back to one end and lets it
  go. A full-length swing sweeps the whole floor (the wind-up shows which end). Only the far end's high ledge is safe.
  Freeze it in the wind-up to stop it. Phase 3 alternates Hold and Counter-Swing.

**Its line:** "Every tick is an hour gone. I keep them. I keep all of them."

### Phase 4: The Stopped Hour (25% to 0%, ~12 min): the hardest
It does what Chronos asked of it to the den itself: **the den stops**.
- **Stopping** (*new*, built on the rhythm lock `rhythm`): on every tick the beat is marked round each slime (a ring
  closing like a clock hand). A slime who is **still** when the tick lands is **stopped**: rooted, greyed, taking more,
  for `STOP_S`. A slime who is moving, jumping or attacking in time is not.
  - So the last phase is fought on the beat: keep moving, the plan's "slimes who keep moving in time".
  - It's never a keyboard test of a new kind. Moving is enough; the beat's rings are on every screen, and phones see them
    the same way.
- **The pendulum stops** in the middle of the den, high, held there: no more sweep. The floor belongs to the Stopping
  now.

**Loop:** Hold or Counter-Swing (alternating) → The Count → Pallet Strike → Tock → Teeth → **Rewound** → Brake and
Locked *together*
1. **Rewound** (*new*, the weak point): it draws the bob all the way up and back, and the arbor opens. **The shard is the
   weak point**, in arrow reach while it's open and melee reach from the east ledge.
   - Filling it staggers it for longer than anything else, and the bob is let down gently.
   - Nobody filling it: **the Drop**, the bob let fall the whole length of the den, the hardest hit in the fight. Safe
     only on the ledges.
2. **Both shields at once** (final bosses only): the brake over the locked plates.

- **Challenges:** **the rhythm lock** (`rhythm`, the Stopping's key combo for whoever's stopped: enter it on the beat to
  start again early) and **the controls swap** (`swap`: the hour runs backward for a few seconds, left is right).
- The pawls and the Count run all phase. A party missing a role has its worst time here.
- **The ultimate, The Stopped Hour** (*new*): everything in the den stops for a long beat (the slimes, the bob, the
  light), then everything that didn't move in time is hit at once. Safe: the slimes who kept moving in time through its
  wind-up. Freeze it in the wind-up to stop it. It takes Hold's place every other loop.

**Its line:** "Then nothing moves. Nothing. Not you. Not me. Hold."

### The enrage (`FINAL_ENRAGE_MIN`, a little past 45 minutes)
- The beat quickens, and the Tick can't be made (its pallets don't open).
- The Stopping comes on every tick at full length.
- A Tock every `ENRAGE_TOCK_S`.

A party that's too weak runs out of time instead of winning slowly.

### Freed
- The pallets unclench. The Wheel overhead slips one tooth round, slowly, with a sound like the whole city drawing a
  breath. The bob swings once, freely, the length of the den, and settles. The shard goes dark.
- Its line: "...No one is holding the order. Then I let go. One. ...There. That is all I was for."
- **Per character** (`[default]`, Phase 7's freed changes, `docs/social/story.md`): **the city ticks once.** The next time
  that slime is in any Citadel room they hear it: one great tick, heard everywhere, the music stopping under it.
  - The Chrono Spire's great clock face, which has always stood still, stands one minute later for them.
  - The Last Echo speaks of it to that slime. Something moved, once, and it remembers the next minute of its hour for the
    first time.
  - The Wheel stays jammed for the finale (Phase 10, server-wide).
- Alternatives: (1) the tick is server-wide on every first kill (a broadcast); (2) nothing changes outside the den.

## Every class's answer (the S5 rule: no mechanic belongs to one class)
| what it does | best answer | everyone else |
|---|---|---|
| The Beat (the pendulum's sweep) | learn it; ledges over the arc | stand behind the bob as it passes |
| The Tick (both pallets in one beat) | two melee, one each end; a Skirmisher's or Archer's spread | two of anyone, in time |
| The pawls (jam a pallet) | area attacks, knockbacks, freezes | single hits |
| The Count (focus) + Pallet Strike | Knight's Rally: he takes it and places it | the counted one gets off that side |
| Locked (armour) | Berserker, Snipe, a shatter, Meteor | wait it out |
| Brake (barrier) | Mage; a Cleric's holy bolts and Smite | wait it out |
| Tock (pulse) | Cleric's Barrier and heals; Knight's Bubble, Sanctuary, Aegis | potions, the Barrier Draught |
| The Count's numerals (curse) | Cleric's Cleanse | step out; the Cleansing Tonic |
| The sweep growing (phase 3) | Ticks (each cuts it back) | the ledges |
| The Stopping (phase 4) | keep moving; Mobility, dashes | the rhythm lock to start again |
| Hold / Counter-Swing / The Stopped Hour | Frostbinder freezes the wind-up | the lee, the far ledge, moving in time |
| Rewound (the shard) | Archer; melee from the east ledge | jump for it while it's open |

## Rewards (items only; no reward window)
- **One weapon a kill by class** (`twinPick`): the Citadel's best, a step above the Wickmother's on the frozen curve (aim
  Lv ~224, `BOSS_GEAR.final`).
  - *The Last Tick* (Warrior): a broad blade shaped like a pallet, its edge worn bright where it bit.
  - *The Arbor Staff* (Mage): a black iron rod with a dark shard set where the pivot was.
  - *The Pendulum Rod* (Cleric): a staff with a little bronze bob hanging under its head, always swinging.
  - *The Anchor Bow* (Archer): the anchor's two flukes for limbs.
- **A shared chance of** *the Arbor Crown* (a hat): a ring of fine teeth in dark brass, one missing.
- Gold and EXP from the economy sheet: a 45-minute kill split four ways.
- **A mini Escapement** in the Pet Shop: a little anchor that rocks tick, tock, a tiny bob under it. Priced at its fight
  level, the Pet Shop's dearest.

## On the way there: part (b)
Room ids: the next free ones. 94 is the Undercroft, 95 the Spoke, and 96 the Catch in (c).

### The Keel gets better
At the Lowest Teeth's far end, the tooth fallen across the shaft has been levered aside (the update did it, no quest), and
a stair is cut down beside it into the dark (`fallentooth`'s open look).

### The deep room: the Undercroft (Lv 205–215)
- Hard-pocket rules: elites throughout, no waystone, no trader. You come in at the west end.
- The floor of the city's underside, right under the Wheel. Overhead the Wheel's underside fills the sky, its teeth as big
  as houses. The great spokes go off into the dark toward the hub.
- The only light is aether leaking from cracks, and it's darker going east.
- Everything is tied to the beat: the music, the mobs' tells, the ticking. It's slower than the Keel's and heavier, the
  Wheel straining.
- **The zones**, west to east:
  - **The Tooth Stair** (no mobs): the stair cut down beside the fallen tooth.
  - **The Sump** (205–208): leaked aether standing in pools.
  - **The Wrights' Gallery** (208–211): the wheelwrights' scaffold still hung against the Wheel's face, their tools left
    on it.
  - **The Weight Pit** (211–215): the clock's drive weights hanging in the dark on chains that go up out of sight.
  - At the far end, the foot of the Spoke.
- **New mobs:**
  - *Sump slimes* (`lob`, a new shot style `sump`: a glob of leaked aether): leaked aether gone thick and alive in the
    sump, drowned gear teeth in it.
  - *Wheelwright echoes* (`phase`): echoes of the Keepers' wheelwrights who went down in the Stopped Hour to free the
    Wheel and never came up. Each carries a great spanner and replays its last hour. It shows Tier 4 without saying it,
    the Bell Walks' wraiths' kind. Rare: the Wheelwright's Cap.
  - *Loose pawls* (`stomp`): the Wheel's ratchet pawls come off their pins, iron hooks on coiled springs that spring up
    and slam down like a pawl into a ratchet.
  - *Counterweights* (`dive`): the clock's drive weights, great bells of lead on chain, dropping out of the dark.
- **Elites** throughout.
- **The Mainspring**, a named elite at the far end (holding on: it never let go of being wound): a coil of blue steel as
  big as a house, wound tight for an age, lying across the foot of the Spoke. It lunges by uncoiling at whoever comes
  near.
- **The find:** high on the wrights' scaffold, the Wheel's brake lever, chained in the HOLD position with a padlock
  stamped with an hourglass. Beside it, a wheelwright's chalk tally of ticks, stopped mid-stroke. Shown, not said:
  Chronos's hourglass is on his crown in the Hour Sanctum.

### The approach: the Spoke (no mobs)
- The walk down one of the Wheel's spokes toward the hub: a beam of black iron wide as a road, rivets in rows, the dark
  on both sides going down forever. The spokes radiate out round you into the dark like the ribs of an umbrella.
- **The Escapement seen before it's met:** through the teeth at the far end, the anchor's shape hanging off the hub and
  the pendulum swinging under it, bigger at every step, the shard's light swinging with it.
- **The ticking gets louder and slower** until it's a heartbeat (`audio.setDepth`, as on the Long Flue and the Lamp
  Road). Each tick lands, and the spoke trembles under you.
- **Closing in:** the spokes either side draw together toward the hub. Behind you the rim's teeth close over the way
  back (art only: the door back always works).
- **Its line** at the mark: "Hold. ...Who comes down? No one comes down. Hold."
- **At the end, the Catch's door:** a round iron door in the hub's casing, its edge geared like a wheel, shuddering on
  each tick. In (b) it holds; in (c) it rolls aside by itself as you come near.
- Both levels are on its sign, with a live count: "3 here, 4+ recommended".

### Personas
- The Commissary has the Undercroft on its parts lists and the wheelwrights on a roster that was never closed.
- The Last Echo remembers the wheelwrights going down, and goes quiet at the hub.
- Folio has a drawing with the label torn off.
- Number Nine felt the tooth move ("THE FLOOR WENT DOWN A HAIR. NOBODY LOGGED IT.").
- Nobody says "Escapement" except as a part number.

## What's new in code (so the owner can see the size)
- A FINAL row: four phases, the loops, fixed HP for four, the enrage. Its own brain (`server/escapement.js`, on the face of
  `server/wickmother.js`) and `src/escapement.js` on the client.
- **The Beat**: the pendulum's swing, server-timed from the fight's start, its low band hurting. It widens in phase 3
  (cut back by Ticks) and stops in phase 4.
- **The Tick**: two pallet props, two hits within one beat, the stagger and the open window, and the pawls jamming them.
- **The Stopping**: the rhythm lock on the beat for every slime, with stillness as the trigger. The server reads the
  input bits it already has.
- New moves: Pallet Strike, Teeth (spikes' look), Rewound and the Drop, and three ultimates (Hold, Counter-Swing, The
  Stopped Hour).
- Art: the Escapement (holding, striking, locked, braked, rewound, freed), the pallets jammed and struck, the bob and
  crutch, the Count's numerals, the den. The Undercroft and its mobs, the Mainspring, the Spoke and its silhouette, the
  Keel's opened tooth. Music: the Spoke's heartbeat tick and its own track. The shard's glow and the dark are big
  gradients: bake them (`docs/performance.md`).
- The work is split into sessions, as before: (b) the way there, (c1) the den and the fight, (c2) the art, music, rewards
  and the freed tick.

## Open decisions (each has a default)
1. **The band.** The Undercroft 205–215, its tag Lv 235, recommended 215 `[default]`. Alternative: stop at 210.
2. **The Tick needs two in time** `[default]`. Alternative: any hits on both pallets fill a shared ring (no timing).
3. **Phase 4's Stopping** (stillness on the tick stops you) `[default]`. Alternative: phase 4 without it (only the
   ultimate stops the den).
4. **Its freeing.** The city ticks once, per character `[default]`. Alternatives above.
5. **Names:** the Escapement, the Catch, the Undercroft, the Spoke, the Mainspring, the Tick, the Count, Hold,
   Counter-Swing, the Stopped Hour, the Last Tick, the Arbor Crown: proposed.
