# A5: Amberdune's final boss, Old Carapace, on paper

**Status: written 2026-11-20 at the owner's "continue with the next two phases" (A4 and A5), and built the same day: (b)
`docs/places/drywells.md`, (c) `docs/places/carapace.md`. Every `[default]` stands (the standing "make liberal decisions"
instruction).** Step (a) of A5 (`phase9-plan.md`, `final-bosses.md`): the boss, its moves and its phase order, before the
fight is built. Numbers here are aims, not code; the economy sheet sets the real ones. It's built on the final-boss engine
(`docs/combat/bosses.md` "Final bosses", `src/shared/final.js`, `server/final.js`), on the face of the Escapement's
(`c6-plan.md`). What's new is marked *new*.

## Carried over (owner, FB1, FB2, E5, L5, C6)
- About 45 minutes for a mixed party of four at the recommended level on the old sheet (~26 since `BOSS_HP_SCALE`), in four
  phases; fixed HP for four, no reward window, items-only rewards.
- No physics changes: every set piece hurts, nothing blocks.
- Telegraphs kept, no hint names the answer. Boss challenges from day one (a `ch` list).

## The band: Amberdune's top is Lv 250 `[default]`
- `DUNE_TOP` = 250: the tag reads **"Lv 270 · recommended Lv 250, 4+ players"** (`finalTag`).
- The Dry Wells are **Lv 244–250**, the deep room on hard-pocket rules (elites, no waystone, no trader). Between 244 and 250
  there are two places: the Storm Road's top and the Dry Wells.
- It makes Old Carapace the game's top boss for now (the Escapement's 215, the Red Wall's 248).

## Where: down the dry well, up his leg
The plan's way in (`phase9-plan.md`): through the darkest pocket, then an approach.
1. **The way down**: the Storm Road's old well on the Red Rise, chained shut by the caravan's rule since seven went down to
   dig it deeper and never came up. A5 opens it (the update did it, no quest): the chain cut and coiled beside it, the
   grating swung back, and **Asra's rope ladder** hanging down into it (she went to look, at last, and Mother Dune let her).
2. **The Dry Wells** (the deep room): the old well-shafts and the cisterns between them, dry an age, the walls scratched with
   tally marks of the days without rain, darker going east. Its far end climbs out by an old dry spring onto the open desert.
3. **The Shell Road** (the approach): up out of the wells onto the open desert at dusk, where **Old Carapace walks past**, a
   hill moving. You climb his foreleg as it plants, scale by scale, the ground shaking with every step.
4. **The Long Road** (the den): his back.

## The boss: Old Carapace
**Nobody on the island says his name.** Mother Dune calls him "the Walker" and won't look east at sundown; Tally counts the
days since he passed close to town; the Red Wall's caravan was following him when it was taken.

**What he is** (shown, never told):
- A tortoise as big as a hill, so old the caravan's first town was built on his back. His people lived up there, a whole
  caravanserai of tents round a well, and he carried them across the desert toward where Pangelea's heart used to be (the
  middle of the sea, where the Maelstrom is now). He has never stopped walking.
- The town on his back is empty now: its people died of thirst one by one, or climbed down and stayed (they're the caravan
  folk's grandmothers' grandmothers). Its well went dry an age ago. He walks on anyway. A shard sits in him, under the well.
- **Holding on to the journey itself** (`characters/bosses.md`): not a person or a thing, the going. Letting go is lying
  down.

**Its look.**
- The den is his back: the shell's plates under the floor, the empty town on it (tents with their flaps tied back, a dry
  well in a ring of stone in the middle, lanterns gone out on poles), all tilting a little with every step. The desert
  scrolls past below and the sky goes from noon to dusk to the red of the storm over the fight.
- His **head** is far off at the east end, out past the front of the shell on a neck as long as a road, looking ahead. It
  turns to look back at you. Old, kind, very tired eyes; a beak worn smooth; dust in every crease.
- No body to hit but the head and neck at the east end (the boss's x never moves). The shard is under the well.

**Levels.** Lv 270 on the tag; "recommended Lv 250, 4+ players" on the door, the approach sign and the title card.

## Its own mechanics
### The Stride *new* (the Beat's kind)
- He walks on a fixed period (`STRIDE_S`): the hind foot comes down under the west end of the shell, then the fore foot
  under the east end. Each footfall jolts its half of the shell: whoever's on the floor there is hit (`STRIDE_HP`, a flat
  `dot`, server-timed from the fight's start: the Beat's pattern, no `step()` change). A jump on the footfall clears it, and
  the ledges are safe.
- The **middle**, round the well, is between the feet: the still point.
- The tell: the half about to land lifts first, dust streaming off it, a shadow sliding under it.

### The Well *new* (the Tick's role: the town is thirsty, carry water to it)
- From phase 1, a **waterskin** drops off a tent at one end of the town every `WATER_EVERY` s: A22's carry (pick it up with
  the loot key, throw it with an attack), but the target is **the well**, not him.
- `WELL_N` skins thrown in fill it: **the town drinks.** He stops walking (`SLAKE_S`, no strides), staggers, and his hide
  softens: hits on him do `SLAKE_MULT` × (`hold()`, as the Escapement's Tick). Then the well drains dry again.
- A skin not thrown in time bursts and spills (the chip's burst).
- One slime can do it alone (slowly); two halve it. That's the party's other job.

### Mirages (the adds) *new brain*, the pawls' kind
- From phase 2, **thirst mirages** (the Glass Dunes' heat mirages gone thirsty) come up off the road at the east end and
  drift west to the well. One at the well drinks: it takes a skin's worth back out every `DRINK_S`.
- Kill them; area attacks are the answer. More come the more the town has drunk.

### The Look (the focus) and Thirst (the curse)
- **The Look**: his head turns back along the shell and one old eye settles on a slime (Rally takes it).
- **Thirst** (S5's curse, `looks.curse: 'thirst'`): a ring of cracked earth under a slime that dries it out, stacking like
  every curse. Cleanse lifts it; the Cleansing Tonic is the poor answer.

## The order of the fight (four phases, each a fixed loop; every S5 mechanic on from the first slime)
### Phase 1: The Road (100% to 75%)
**Loop:** The Look → Snap → Stamp → (the road's dust: gaps, every other loop) → (Drawn In, every other loop)
1. **Snap** (*new*, the Pallet Strike's kind): his head swings back over the shell on its long neck and bites down at the
   looked-at slime's mark (`SNAP_WARN`, `SNAP_R`). Some come a beat late (`late`).
2. **Stamp** (the pulse, `looks.pulse: 'stamp'`): he stamps, and a quake runs through the whole shell.
3. **Drawn In** (the armour, `looks.shell: 'carapace'`): he draws his head into the shell; heavy hits break through.
- **The Stride** runs all fight; **the Well** from the start.
- **Challenges:** late tells (the Snap), thin gaps (the road's dust blowing over the shell with one gap: `sandwall`).
- **Ultimate, The Long Road** (`wave`): the road itself comes over his back, a wall of dust and stones the length of the
  shell. Jump it or get up on a roof. Freeze it in the wind-up to stop it.
- **Line, entering:** "Keep up, little ones. Keep up. It is a long road, and we are nearly there."

### Phase 2: Thirst (75% to 50%)
**Loop:** The Look → Snap → Stones → (sinking sand) → Stamp → (rings) → Dust → (Drawn In)
1. **Stones** (from `rain`): stones kicked up by his feet come down in a line toward the looked-at slime, a group a stride.
2. **Dust** (the barrier, `looks.dome: 'haze'`): a haze of hot dust hangs round his head. The first time, `lines.shield`:
   "Not now. Not now, we are so close."
- **Mirages** and **Thirst** start.
- **Challenges:** mash free (`mash`: the sand under you gives, the old sinking sand), bullet rings (`rings`, looks `grit`:
  gravel thrown off the shell's edges).
- **Line:** "The well is dry? It was always dry. Walk. There is water at the end of the road."

### Phase 3: The Long Walk (50% to 25%): the set piece
- **He walks faster** (*new*): every loop the Stride quickens a step (`STRIDE_STEP`, at most `STRIDE_STEPS`), the footfalls
  coming closer together. **Every time the town drinks, it slows a step.** A party that keeps the well filled keeps its
  footing (the Escapement's widening swing, built on the well instead of the Tick).
- **Buried** (`rescue`, 2+): a tent comes down over a slime. A friend at it enters its arrows.
- **Second ultimate, Earthshaker** (`nova`): he rears and brings both forefeet down; the quake runs back down the shell.
  Safe only far back toward his tail. Phase 3 alternates The Long Road and Earthshaker.
- **Line:** "Faster, then. Faster! If we stop now, we stop forever!"

### Phase 4: Into the Storm (25% to 0%): the hardest
His last phase is the walk into the storm (`phase9-plan.md`): the Red Wall, standing ahead of him across the desert.
- **The storm comes over the shell** (`dark`), and **the hour runs backward** in it (`swap`).
- The Stride at its quickest. The well still drinks.
- **Lie Down** (*new*, the weak point): he stops, and for a breath he lowers himself, so tired, and the dry well's floor
  falls open: **the shard is the weak point**, in arrow reach and melee reach from the windlass over the well, for `REST_S`.
  - Filled: the long stagger.
  - Not filled: **he gets up**, the Trample: every slime not up on a roof takes `TRAMPLE_HP` of max HP.
- **Both shields at once** (final bosses only): the dust over the drawn-in head.
- **Line:** "There. The storm. Our road goes through it. It always went through it. Walk."

### The enrage (`FINAL_ENRAGE_MIN`)
- He strides as fast as he can and the well never drinks (it's dry for good); a Stamp every `ENRAGE_STAMP_S` besides the
  loop's.

### Freed
- He stops. He lies down, slowly, all the way, and the town on his back settles for the first time; the dust stops; the
  tents' flaps fall closed. The well gives a little water, at last.
- His line: "...Is this the end of the road? ...It is a good place. There is shade. ...Then I will lie down here, and you
  will all go on without me. That is how it is meant to go."
- **Per character** (`[default]`, Phase 7's freed changes, `docs/social/story.md`): **the hill on Amberdune's horizon lies
  still** in every sky (no more walking), **Caravanserai's well rises a little** (water glints in it), and **Mother Dune has
  struck her tent**, packed, the bundles beside her. Caravanserai's four know.
- Alternatives: (1) server-wide on the first kill; (2) nothing outside the den.

## Every class's answer (no mechanic belongs to one class)
| what it does | best answer | everyone else |
|---|---|---|
| The Stride | learn it; the middle by the well; roofs | jump on the footfall |
| The Well (carry water) | two carriers, one each end | one carrier, slowly |
| Mirages (drink the well) | area attacks, knockbacks, freezes | single hits |
| The Look + Snap | Knight's Rally | the looked-at one gets out from under |
| Drawn In (armour) | Berserker, Snipe, a shatter, Meteor | wait it out |
| Dust (barrier) | Mage; a Cleric's holy bolts and Smite | wait it out |
| Stamp (pulse) | Cleric's Barrier and heals; Knight's Bubble, Sanctuary, Aegis | potions, the Barrier Draught |
| Thirst (curse) | Cleric's Cleanse | step out; the Cleansing Tonic |
| The Long Walk (phase 3) | the town drinking (each slows him) | the roofs |
| The Long Road / Earthshaker | Frostbinder freezes the wind-up | jump or a roof / back toward the tail |
| Lie Down (the shard) | Archer; melee from the windlass | jump for it while it's open |

## Rewards (items only; no reward window)
- **One weapon a kill by class** (`twinPick`): Amberdune's best, a step over the Escapement's on the frozen curve (aim Lv
  ~259, `BOSS_GEAR.final`).
  - *The Long Road* (Warrior): a broad blade of shell-horn, plated like his back, worn smooth where a road's worth of dust
    went over it.
  - *The Walking Staff* (Mage): a staff of dark horn with a little dry well-ring for a head, a bead of water at its middle
    that never falls.
  - *The Well-Rope Staff* (Cleric): a staff wound with the town's last well-rope, a bucket's handle at the head.
  - *The Wayfarer's Bow* (Archer): two of his worn claws for limbs, strung with caravan silk.
- **A shared chance of** *the Carapace Crown* (a hat): a ring of shell plates, a tiny tent standing on top.
- Its gear effects (every top and final boss has two): **Carried** (the weapons: every hit you land while a friend is
  within reach does more) and **Shell** (the crown: standing still you take much less, and walking is slower).
- **A mini Old Carapace** at the Pet Shop: a tortoise with a tiny town on his back, walking very slowly, always. The Pet
  Shop's dearest.

## On the way there: part (b)
Room ids: the next free ones. 109 the Dry Wells, 110 the Shell Road, 111 the Long Road.

### The Dry Wells (Lv 244–250, the deep room)
- Hard-pocket rules: elites throughout, no waystone, no trader; in at the west end, out east by the dry spring.
- Old well-shafts going up to small rounds of daylight, and the cisterns between them: vaulted, dry an age, buckets on rotten
  ropes, the high-water marks far up the walls. Every wall is scratched with tally marks, seven to a group with a stroke
  through, thousands. Darker going east.
- **The zones**, west to east: **the Well Foot** (no mobs, the ladder down), **the Cisterns** (244–246), **the Tally
  Galleries** (246–248), **the Deep Cistern** (248–250), and the dry spring up at the far end (the way on).
- **New mobs**: *dry striders* (the cisterns' water striders, skating on dust now: quick chasers), *bucket mimics* (old well
  buckets gone hungry, iron-bound, hop and slam: `stomp`; rare: the Bucket Helm), *tally wraiths* (the seven diggers' dust,
  still scratching their marks: `phase`), *dust drinkers* (old waterskins gone alive and dry, spitting packed grit: `lob`, a
  new shot style `grit`).
- **Elites** throughout, and **the Seventh Digger**, a named elite at the far end (holding on: still digging for water).
- **The find**: at the bottom of the deepest cistern, up on a ledge, a tin cup full of sand set out beside seven tally marks
  and an eighth begun. (Tally sets a cup for everyone who ever left; this one was set for him, a long time ago.)

### The approach: the Shell Road (no mobs)
- Up out of the dry spring onto the open desert at dusk: dunes going on forever, the sky orange and violet, the storm's red
  wall far off south-east.
- **Old Carapace walks past**: first a hill on the horizon, then bigger at every step, until at the far end one great
  foreleg plants in the sand in front of you, its scales like steps going up into the dusk, the shell over it like a sky.
- **The ground shakes** on every footfall (`audio.setDepth`, the Long Flue's and the Spoke's way): the music gets slower and
  heavier, each step a thump.
- **Its line** at the mark: "Who is that, down there? ...Come up, then. Come up. We have a long way to go."
- At the far end, **the climb**: his foreleg, its scales stepped like a stair. Its sign: both levels and a live count.

### Personas
- Mother Dune: the well's rule was the mothers'; she let Asra go down the ladder because "someone should, before I die,
  and it won't be me". She knows the Walker passes close now. She doesn't say his name.
- Tally: his count of the days since the Walker passed close is at zero now, and that frightens him more.
- Asra: she went down, a little way, and came back with a tin cup full of sand; she won't say whose.
- Kesh: she has seen him from the water at dusk, walking the shore.

## What's new in code (so the owner can see the size)
- A FINAL row, its own brain (`server/carapace.js`, brain `shell`), `src/carapace.js` on the client, `src/dens-carapace.js`
  (theme `shell`), `src/shared/carapace.js` (its constants).
- **The Stride**: two footfalls a cycle, server-timed, each half of the shell's floor; quicker in phase 3 (slowed by the
  town drinking) and phase 4.
- **The Well**: A22's carry aimed at a target that isn't the boss (`opts.target` and a `poured` hook in
  `server/challenge.js`), the well's level, the drink and its window.
- **Mirages**: their brain (`son: 'mirage'`): drift to the well and drink.
- **Lie Down** and the Trample. Moves: the Look, Snap, Stamp, Stones, Drawn In, Dust. Ultimates on the shared `wave` and
  `nova`.
- Art: the den (his back, the town, the scrolling desert, the head and neck), the Dry Wells and their mobs, the Shell Road
  and the walking hill. Music: the Dry Wells, the Shell Road's footfalls, the Long Road's own track.

## Open decisions (each has a default)
1. **The band.** The Dry Wells 244–250, the tag Lv 270, recommended 250 `[default]`.
2. **The Well** (carry water to it) as the party's job `[default]`. Alternative: hit the well (no carrying).
3. **Freed**: the hill lies still, the well rises, Mother Dune strikes her tent, per character `[default]`.
4. **Names**: Old Carapace and the Long Road are the atlas's; the Dry Wells and the Shell Road the phase plan's; the
   Stride, the Look, Snap, Stamp, Drawn In, Dust, Lie Down, the Trample, The Long Road (the ultimate), Earthshaker, the
   Seventh Digger, dry striders, bucket mimics, tally wraiths, dust drinkers, thirst mirages: proposed.
