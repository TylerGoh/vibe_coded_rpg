# L5: Lantern Fen's final boss, the Wickmother, on paper

**Status: written 2026-11-12 at the owner's "continue with next phase. Also don't be afraid to make the levels go past
200"; every `[default]` stands unless the owner changes it (the standing "make liberal decisions" instruction). (b)
built 2026-11-12 (`docs/places/peatbarrows.md`); (c) waits for the owner's look at this page.** Step (a) of L5
(`phase8-plan.md`, `final-bosses.md`): the boss, its move set and its phase order before the fight is built. Numbers
are aims, not code: the economy sheet sets the real ones. Built on the final-boss engine (`docs/combat/bosses.md`
"Final bosses", `src/shared/final.js`, `server/final.js`): a FINAL row, written loops, the enrage, fixed HP for four,
no reward window. What's new is marked *new*.

## Carried over (owner, FB1, FB2, E5)
~45 min for a mixed party of four at the recommended level, four phases, no physics changes (every set piece hurts,
nothing blocks), fixed HP, no reward window, telegraphs kept and no hint naming the answer, items-only rewards. Boss
challenges from day one (`docs/combat/challenges.md`): a `ch` list as it ships, not a retrofit.

## The band goes past 200 (owner, 2026-11-12) `[default]`
- The Fen was approved at Lv 150–180. Its deep room, **the Peat Barrows, is Lv 180–190**, the first place past the
  Causeway's top, and the Wickmother is fought at **Lv 190**: her tag reads **"Lv 210 · recommended Lv 190, 4+
  players"** (`FEN_TOP` = 190, `finalTag`). The game's first numbers past 200.
- Nothing caps levels (S6 was dropped, 2026-11-06), and the frozen curve runs on past its last knot as a power law
  (`src/shared/curve.js`), so mobs and gear past 200 are priced the same way. The sheet's PROGRESS and "first
  affordable" tables reach past 200 from (b) on.
- Between 180 and 190 the Peat Barrows is the only place (the Citadel's pass will add a second there; its own top can
  now go well past 200 too: `citadel-plan.md`).

## Where: under the Sunk Barrows, up into the Hall from below
The Sunk Barrows is the Fen's darkest, most closed-in place (the owner's "trapped" mood), and its Peat Hall's far end
already had the old peat cuts going down, caved in (L3's gate). So: down through the peat (the deep room), then **up**
the Lamp Road under the bog into the Hall of Lamps' roots from beneath. The Fen's register is grief, so the way in is the
way the dead's lanterns were carried: down, then up into the light.

**The moth-silk door at the Causeway's end** (L4's gate) is the Hall's front door, and **the Mother keeps it shut**
`[default]`: nobody comes in the front any more. It stays shut in (b). In (c), once a character has freed her, the silk
falls off it **for that character** (a freed world change, Phase 7's kind, `docs/social/story.md`) and it opens onto the
Lamp Road's top, by the Hall: a short way back for those who've done the long one. Alternatives: (1) it opens for
everyone in (c), a front way to the den that skips the deep room; (2) it never opens (a dead end, which the owner's
rule doesn't like).

## The boss: the Wickmother
**In the fen folk's songs** she's "the Mother": the one who keeps the lights. Nobody in Wickmere says more.

**What she is** (shown, never told). A moth as big as a boathouse, grey-violet, furred, her wings patterned with eye
spots that look like lanterns seen through fog. Long ago the fen folk set their dead's lanterns adrift and let them go
out, and she was a moth among the moths that came to them. Then an Anchor shard sank into the mere, she swallowed it
with a lantern's flame, and since then she **can't bear to let a single light go out**. She gathered every lantern
into the great hollow willow (the Hall of Lamps), keeps every one burning, sends her moths out to relight any that
gutter, and wove the front door shut so nobody can take one away. The shard sits in her thorax like a flame behind
glass, the brightest light in the Hall.

**Why it fits.**
- *Holding on vs letting go* (`characters/bosses.md`): the plainest version yet. Everything she does is keeping lights
  lit; everything the party does to win is letting them go. Freed, she lets them go herself.
- *The trapped feeling*: under the bog, then up into a hollow tree hung so thick with lanterns there's no sky.
- *The Fen's register* (strange, gentle, sad): she is never cruel; her lines are a mother's. No puns.
- *The Fen's own story*: Wren's husband's lantern, Netta's in her cabin window, the nameless niche, the lantern facing
  home: every one of them is here, and in (c) the Lamp Walk burns low for whoever freed her.

**Her look.** Wrapped round the Crown of Lamps (a great knot of lanterns hung from the Hall's heart) like a moth round
a candle, wings folded over it. Six furred legs holding lanterns. Feathered antennae, huge soft black eyes with a light
moving in them. When she opens her wings the eye spots catch every lantern's light. Dust (wing scales) sifts off her
all the time, silver in the lamplight.

**Levels.** Lv 210 on her name tag; "recommended Lv 190, 4+ players" on the door, the approach sign and the title card.
Her stats come from the FINAL table, never from Lv 210.

## Her own mechanics
### The Hall's lanterns: the Hold *new*
- **Eight hall lanterns** (`HALL_LAMPS`) hang on long strings from the willow's ribs across the den, some low enough to
  hit from the floor, some only from the root ledges. Each is **lit**, **going out** (being let go: its ring filling)
  or **out** (a little light gone up through the roof).
- **The Hold:** while lanterns are lit she's wrapped round them. Every lit lantern takes a share off each hit on her
  (`HOLD_PER_LAMP`, capped, drawn as her wings closing tighter). All eight lit, she's nearly untouchable; all out,
  she's open.
- **Letting a lantern go** (the opposite of Fenrir's): any hit on a lantern fills its ring (`LAMP_RING`); filled, it
  goes out and its light drifts up out of the Hall. **A Cleric's holy hit** (laying it to rest) or **a Frostbinder's
  frost** (the wick pinched out) lets it go at once. Hits on a lantern don't hurt her (`prop` in `applyHits`, as on
  Fenrir's lanterns and anchors), so every lantern costs damage time.
- **She relights them** (*new*: Kindle, below), and her moths do too (the adds). So it's a tug of war the party wins by
  being quicker than her, never a puzzle you solve once.
- **What the lanterns give back:** each lit lantern throws a pool of light (Fenrir's `LIGHT_R`, x only). In phases 1–3
  the light is just light. In phase 4 the Hall goes dark (below) and the pools matter.

### The moths (the adds, Skoll and Hati's job given to many)
From phase 2, **moths** (`lamp_moth`, the Causeway's) come down out of the roof in a few at a time
(`MOTHS_EVERY`), each flying to the nearest **out** lantern and relighting it in `RELIGHT_S` unless it's killed,
frozen, stunned or knocked back first (Skoll and Hati's "SAVED"). Area attacks and knockbacks are the answer; more of
them the more lanterns are out (`MOTHS_PER_DARK`), within the adds cap.

### The name tags (the curse)
Her curse (S5's, `looks.curse: 'tag'`): a lantern's paper name tag flutters down and hangs off a slime, someone's name
written on it. Stacks like every curse (see-through, take more). Cleanse lifts it; the Cleansing Tonic is the poor
answer. (Whose names: never readable, just writing.)

## The arena: the Hall of Lamps
A long den (Ladon's and Fenrir's width): inside the great hollow willow. The walls are the tree's inner bark, grey and
ribbed, going up out of sight; roots make the floor's low shelves at each end and two high ledges; the floor is packed
peat with black water standing in the hollows. Lanterns everywhere, thousands, hung from the ribs on strings, each with
a tag; the eight hall lanterns are the big ones on the long strings. The Crown of Lamps hangs from the middle of the roof
with her round it. A hole far up in the roof where the trunk broke, a little real night sky (the lights go out through
it). The Lamp Road comes in through the roots at the west end.

## The order of the fight
Four phases, each a fixed loop (the FINAL engine). Every S5 mechanic is on from the first slime (`partyAll`). Moves
marked *new* need code; the rest reuse a shared move with her look.

### Phase 1: The Keeper of Lights (100% to 75%, ~10 min)
She stays wrapped round the Crown. All eight hall lanterns lit; she only relights in this phase with Kindle.
**Loop:** Watching Eyes → Stoop → Kindle → Hush → (Folded Wings every other loop)
1. **Watching Eyes** (the focus): the eye spots on her wings turn to one slime, two pools of lamplight on them. Rally
   takes it.
2. **Stoop** (from `dive`, *new* timing): she drops off the Crown at the watched slime, a long soft fall (~1.3 s, the
   landing marked), and lies on the floor a moment with her wings spread: melee's opening, and the moment to get at
   the low lanterns she's left. Then she climbs back up.
3. **Kindle** (*new*): she touches one **out** lantern with a wing tip and it's lit again (the one nearest her, shown a
   beat early: its wick glows first). Freeze or stun her in the wind-up and it doesn't happen.
4. **Hush** (the pulse, `looks.pulse: 'hush'`): she beats her wings once, slowly, and a wave of wing-dust rolls through
   the Hall: a share of max HP from everyone. The Cleric's Barrier and heals answer it; potions are the poor answer.
5. **Folded Wings** (every other loop; the armour, `looks.shell: 'wings'`): she folds her wings over herself. Ordinary
   hits do little; heavy hits (Berserker, Snipe, a shatter, Meteor) break through.
- **Challenges:** **moth-silk snares** (`snare`, looks silk: a strand comes down on the watched slime after a Stoop that
  missed; enter the arrows) and **fake-outs** (`feint`: some Stoops pull up short and land where you went).
- **The ultimate, All Souls' Night** (*new*, first below `ULT_FIRST`): she opens her wings wide and every lit lantern in
  the Hall flares, burning everything in its light. **Safe: the dark under the lanterns you've let go** (plus the two
  the wind-up leaves dark, so there's always somewhere). The more you've let go, the more room there is. Freeze her in
  the wind-up to stop it (`INTERRUPT_CHANCE`).

**Her line, entering:** "Hush. Hush now. Who have you come to see? They're all here. I've kept them all."

### Phase 2: The Gathering (75% to 50%, ~11 min)
She climbs down off the Crown and moves along the roof's ribs (she keeps to the high half of the den, swooping down).
The moths come.
**Loop:** Watching Eyes → Stoop → Silk Line → Kindle → Hush → Lantern Rain → (Cocoon every other loop)
1. **Silk Line** (`beam`, silk look): a line of silk drawn across the Hall at floor or ledge height (the wind-up shows
   which), like Fire Breath.
2. **Lantern Rain** (from `spikes`): small lanterns drop from the roof in a line toward the watched slime, each
   landing marked, bursting in lamp oil where they hit.
3. **Cocoon** (the barrier, `looks.dome: 'cocoon'`): silk wraps round her into a ward. A Mage unravels it fastest; a
   Cleric's holy bolts and Smite help. First time, `lines.shield`: "No. Not this one. Not yet. Just a little longer."
- **The moths** (adds, above) and **the name tags** (the curse) start.
- **Challenges:** **tethers** (`tether`, 2+: a thread of moth-silk ties two slimes; stay close), **bullet rings**
  (`rings`, looks lights: rings of the dead's little lights coming off her with a gap in each).

**Her line:** "Every one of them was loved. Do you know how many people are loved? I do. I counted."

### Phase 3: The Cocoons (50% to 25%, ~12 min): the set piece
She gathers what she can't keep lit. Silk comes down from the roof and starts wrapping the Hall itself: **the room
closes in from both ends** (*new*: the silk walls). Two walls of silk move in from the ends in steps (`SILK_STEP`), the
den's open floor getting shorter; standing in the silk hurts (a hazard band, drawn and timed by the server; nothing
blocks). Each hall lantern let go **cuts the walls back one step** (the light going up burns a hole through the silk).
So the party that keeps letting lights go keeps its room.
**Loop:** Hush → Watching Eyes → Stoop → Kindle, Kindle → Silk Line → Lantern Rain → Folded Wings or Cocoon by turns
- **Cocooned** (`rescue`, 2+, the cage): the watched slime after a Stoop is wrapped up and hung from a rib; a friend
  at the cocoon enters its arrows to cut them down.
- **Her second ultimate, The Long Night** (*new*, from `wave`): she pulls every strand at once and a wave of silk rolls
  from one end of the Hall to the other (the wind-up says which: the walls at that end bulge). Only the high root
  ledge at the far end is safe. Freeze her in the wind-up to stop it. Phase 3 alternates All Souls' Night and The Long
  Night.

**Her line:** "If I let them go, who will remember them? You won't. You're only passing through."

### Phase 4: The Last Light (25% to 0%, ~12 min): the hardest
She takes every light into herself: every lantern in the Hall goes out at once (her line), the Crown too, and **the
whole Hall is dark but for her** (the plan's "the whole hall going dark but for her"). The silk walls fall away.
- **The dark** (Fenrir's, inverted *new*): outside her own light (`MOTHER_LIGHT_R` round her, x only) the dark's cold
  hurts (`DARK_HP` a second). So you fight in her light, where her moves land. The hall lanterns are lit **only by the
  party** now: a fire or holy hit on an out lantern lights it again for a while (`ROOM_LIGHT_S`), a pool to stand in
  away from her (and Drawing the Light, below, takes them back). The phase turns the whole fight round:
  three phases letting lights go, and in the last you need one.
- **She moves** along the floor now (unlike phases 1–3), wings open, the shard bright in her thorax.
**Loop:** All Souls' Night or The Long Night (alternating) → Watching Eyes → Stoop → Hush → Lantern Rain → **Drawing
the Light** → Folded Wings and Cocoon *together*
1. **Drawing the Light** (*new*, the weak point): she pulls the light out of every lit lantern into herself (they go
   out); her wings spread and **the shard in her thorax is the weak point**, in melee reach from the front and arrow
   reach while it's open. Filling it staggers her for longer than anything else and breaks the pull (the lanterns stay
   lit). Nobody filling it: a double Hush, every lantern out.
2. **Both shields at once** (final bosses only): the cocoon over the folded wings.
- **Challenges:** **the dark** (`dark`, the blackout: her moves go on in it, only her eyes and the shard to see by).
- The moths and the tags run all phase. A party missing a role has its worst time here.

**Her line:** "Then I'll hold them myself. All of them. I'll be the only light there is."

### The enrage (`FINAL_ENRAGE_MIN`, a little past 45 minutes)
Every hall lantern relights by itself and nothing lets them go; her Hold is full; the dark's cold rises; a Hush every
`ENRAGE_HUSH_S`. A party that's too weak runs out of time instead of winning slowly.

### Freed
She opens her wings and lets go. The lights come out of her, one by one, and drift up through the hole in the roof; the
hall lanterns dim, gently, not all at once; the shard goes dark. Her line: "...Oh. They're going home. All this time I
thought they'd be lost without me." She folds up small under the Crown and sleeps, an ordinary moth's size, a little
light still in her. **Per character** (`[default]`, Phase 7's freed changes, `docs/social/story.md`): back in Wickmere the
Lamp Walk burns low and a few lanterns are out, their tags gone; Wren's husband's is one of them. Wren speaks of it to
that slime (gently: she let it go). And the moth-silk door at the Causeway's end opens for them.

## Every class's answer (the S5 rule: no mechanic belongs to one class)
| what it does | best answer | everyone else |
|---|---|---|
| The Hold (lit lanterns shield her) | Cleric's holy hits / Frostbinder's frost let a lantern go at once | hit its ring; jump to the high ones |
| Kindle (she relights) | freeze or stun the wind-up | let it go again |
| The moths (relight out lanterns) | area attacks, knockbacks, freezes | single hits |
| Watching Eyes (focus) + Stoop | Knight's Rally: he takes it and places her | the watched one Dashes or gets high |
| Folded Wings (armour) | Berserker, Snipe, a shatter, Meteor | wait it out |
| Cocoon (barrier) | Mage; a Cleric's holy bolts and Smite | wait it out |
| Hush (pulse) | Cleric's Barrier and heals; Knight's Bubble, Sanctuary, Aegis | potions, the Barrier Draught |
| Name tags (curse) | Cleric's Cleanse | step out; the Cleansing Tonic |
| The silk walls (phase 3) | let lanterns go (each cuts them back) | fight in the middle |
| The dark (phase 4) | a Mage's fire / a Cleric's holy lights a lantern for a pool | stay in her light |
| All Souls' Night / The Long Night | Frostbinder freezes the wind-up; let lanterns go ahead of time | the dark spots / the far high ledge |
| Drawing the Light (the shard) | Archer; melee in front | jump for it while it's open |

## Rewards (items only; no reward window)
One weapon a kill by class (`twinPick`), the Fen's best, a step above Grandfather Mire's on the frozen curve (aim Lv
~199, `BOSS_GEAR.final`): *the Last Wick* (Warrior: a long grey blade with a flame that never moves, sealed in glass at
the hilt), *the Mother's Staff* (Mage: a willow staff with a sleeping moth at its head, wings folded round a light), *the
Lantern Crook* (Cleric), *the Moth-Wing Bow* (Archer: a bow strung with moth-silk, eye spots on its limbs), plus a
shared chance of *the Mothwing Hood* (a hat: soft grey fur, two feathered antennae). Gold and EXP from the economy sheet:
a 45-minute kill split four ways. A **mini Wickmother** in the Pet Shop: a small furry moth that circles a tiny lantern.
Its price at her fight level, the Pet Shop's dearest.

## On the way there: part (b)
Room ids: the next free ones (82 the Peat Barrows, 83 the Lamp Road, 84 the Hall in (c)).
- **The Sunk Barrows get better:** the cave-in at the Peat Hall's far end has been dug out and its roof timber propped up
  as a lintel (Sedge and Hob's two eldest did it: the update itself, no quest), steps cut down, lamplight coming up.
- **The deep room: the Peat Barrows** (Lv 180–190, hard pocket rules, elites throughout, no waystone): the old peat
  workings under the bog, where the fen folk once cut fuel and later carried their dead's lanterns down; black peat
  walls with spade marks, the old bog-oak trackways (log roads laid across soft peat), roots overhead, the only light the
  lanterns somebody carried down here, set on every ledge. And her brood: going east, more and more silk, the Moth
  Cradle's cocoons hanging from the roots. New mobs: *wick grubs* (her caterpillars, a lit wick on the back, `trail`:
  drips of hot tallow), *peat wraiths* (mourners made of peat-smoke carrying a lantern, `blink`: down into the peat, up
  behind you), *lamp-bearers* (old fen slimes still carrying a lantern down, holding it out in front, `shell`: get
  behind them), *dusk moths* (great moths asleep on the roof, `dive`). Elites throughout. At the far end, **the Eldest**:
  her first child, a wick grub grown to the size of a barge that never turned into a moth (holding on: it never let go of
  being small), coiled across the foot of the stair up.
- **The approach: the Lamp Road** (no mobs): the way the dead's lanterns were carried up into the Hall, a stair of roots
  climbing under a roof of moth-silk strung with every lantern the fen has ever lit, all burning, their name tags turning
  in a draught. Going up: more lanterns, lower silk, the tags thicker; a huge shadow moving across the silk overhead,
  backlit by the lanterns, bigger at each landing (her, walking the roof of the Hall above); at the top, two great eyes
  of lamplight through the silk. The music falls to a music box. The silk draws closed behind you (art only). Her line
  at the mark: "Who are you carrying? ...No one? Then why have you come so far?" At the top the Hall's inner door, a
  curtain of moth-silk across a doorway in the willow's root, breathes with her wings and doesn't part (in (b)); in (c)
  it parts by itself as you come near. Both levels on its sign and a live count, "3 here, 4+ recommended".
- **Personas:** Wren (the peat cuts open; the carriers' road; she carried her husband's lantern up it, once, and came
  back without going in), Hob (he cut peat down there as a boy), Sedge (the Eldest: her bog-iron's down there), Netta.

## What's new in code (so the owner can see the size)
- A FINAL row for her: four phases, the loops, fixed HP for four, the enrage; her own brain (`server/wickmother.js`, the
  face of `server/fenrir.js` and `server/typhon.js`) and `src/wickmother.js` on the client.
- **The hall lanterns and the Hold**: eight lights the server tracks (lit, going out, out; Fenrir's lanterns turned
  round), the damage share they take off her, holy and frost hits letting one go at once, Kindle and the moths relighting.
- **The silk walls**: two hazard bands closing from the ends in steps, cut back by let-go lanterns.
- **Phase 4's dark**: Fenrir's dark with the light round the boss instead of round the lanterns, and lanterns the party
  lights with fire and holy hits for a while.
- New moves: Stoop, Kindle, Lantern Rain, Drawing the Light, two ultimates (All Souls' Night, The Long Night).
- Art: the Wickmother (on the Crown, on the ribs, stooping, spread, drawing the light, freed and small), the hall
  lanterns' three states and their lights going up, the silk walls, the moths, the tags, the Hall; the Peat Barrows and
  its mobs, the Eldest, the Lamp Road and her shadow on the silk, the Barrows' dug-out cave-in. Music: the road's music
  box, her own track. The dark and the lamp glow are big gradients: bake them (`docs/performance.md`).
- Sessions, as before: (b) the way there; (c1) the den and the fight; (c2) art, music, rewards, the freed changes.

## Open decisions (each has a default)
1. **Levels past 200.** The Peat Barrows 180–190, her tag Lv 210, recommended 190 `[default]`. Alternative: keep the
   Fen's 180 top (the Barrows 176–180 and her tag 200).
2. **The front door.** Shut until you've freed her, then open for you `[default]`. Alternatives above.
3. **The Hold.** Lanterns shield her and you let them go `[default]`. Alternative: lanterns only feed her heals.
4. **Phase 4 turned round** (you need light you were letting go) `[default]`. Alternative: phase 4 dark with no pools,
   only her light.
5. **Names:** the Wickmother, the Eldest, the Peat Barrows, the Lamp Road, the Hall of Lamps, the Crown of Lamps, All
   Souls' Night, The Long Night, the Last Wick: proposed.
