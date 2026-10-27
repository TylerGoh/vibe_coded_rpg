# FB2: Frostpeak's final boss, on paper (for the owner to approve)

**Status: approved by the owner 2026-10-27 (the dark hurts, Skoll and Hati, no bites in phase 4).** Step (a) of FB2 in `final-bosses.md`: the boss, its move
set and its phase order, before anything is built. Numbers are aims, not code: the economy sheet sets the real
ones. Built on FB1's engine (`docs/combat/bosses.md` "Final bosses", `src/shared/final.js`, `server/final.js`):
a FINAL row, written loops, the enrage, fixed HP for four, no reward window. What's new is marked *new*.

## Owner's answers so far (2026-10-27)
- **The boss: Fenrir, the Bound Wolf** (picked from Fenrir, Ymir, Nidhogg and a draugr-king): a huge wolf
  bound at the glacier's bed. Its mechanic is the fetters: they set how far it reaches, it snaps one a phase,
  and the party can freeze an anchor tight again. It swallows the lanterns, and fire or holy light relights them.
- **The dark hurts a little**; **Skoll and Hati** as named lantern-hunters; **no bites in phase 4**.
- Carried over from FB1 (owner, 2026-10-26): ~45 min for a mixed party of four at the recommended level, four
  phases, no physics changes (every set piece hurts, nothing blocks), fixed HP, no reward window.

## The boss: Fenrir, the Bound Wolf
**The myth.** Fenrir is the great wolf the gods feared. Chains couldn't hold him, so the dwarves made Gleipnir,
a fetter as thin as a ribbon, out of impossible things: the sound of a cat's footfall, the roots of a mountain,
the breath of a fish. He let himself be bound only with a god's hand in his mouth as a pledge, and he lies
bound until the end of the world, when he breaks free and swallows the light.

**In Slimeville.** Long before the hamlet, a wolf ran the whole of Frostpeak. The Keepers bound it under the
ice where the glacier would cover it, with a fetter of impossible things fixed to four of their stones, and
told it to wait "until the end". They left a stone hand at its paws as their pledge to come back and loose it.
The end didn't come, and neither did they. The fetter wore thin long ago. The shard is set in the lock of its
collar, and **the last fetter, the thinnest, it now holds in its own teeth**: it keeps itself bound, because it
was told to, and because it's afraid of what it is when it's free.

**Why it fits.**
- *Holding on vs letting go* (`characters/bosses.md`): a creature that holds its own chain. The Frostpeak
  register: Glacia held her island, Sigrun held Glacia's oath; Fenrir holds a promise nobody kept.
- *The trapped feeling*: the deepest, darkest place on the island, at the bottom of a stair nobody finished,
  under the oldest ice. It's bound and so, in the dark, are you.
- *What the cutters stopped digging toward*: they heard it breathe through the ice, and the chain. The
  Blue Halls get their record of it (below). Eyvind's grandfather was on that crew.
- *Tier 1–2 only*: the Keepers, an order, a pledge, a shard, and "the end" never explained. The stone hand
  and "until the end" are the only hints; nobody says what the end was (the Stopped Hour) or that it came.
- *Menace, quietly*: you see the eyes first, then the breath, then the size of it.

**Its look.** A wolf the size of the den's back wall, grey-white fur gone to rime at the tips, black
lips, pale eyes. A heavy Keeper collar of dark stone, the gold-white shard glowing in its lock. The
fetters: ribbons of pale light, thin as silk, running from the collar to four Keeper stones in the walls.
The last one, between its teeth, frayed and shining. Its breath smokes. When it lies still it looks like
a snowdrift with eyes.

**Levels.** Lv 120 on its name tag; "recommended Lv 100, 4+ players" on the door, the approach sign and
the title card (`FINAL_LVL_OVER`). Its stats come from the FINAL table, never from Lv 120.

## Its own mechanics
### The fetters (the reach) *new*
- Fenrir is bound to the middle of the den. **Its reach is how much fetter it has**: a band of floor around
  the middle, drawn as a line of frost on the floor at each end. Its bites and claws can't go past it;
  its Howl, its breath and the falling ice can. (The opposite of Ladon's coils: there the safe room shrank from
  the ends; here the danger grows from the middle.)
- **Four anchors**, Keeper stones in the den's walls (two each side), each carved with one of the fetter's
  impossible things. A phase change snaps one fetter for good: reach grows a big step each phase. By phase 4
  only the one in its teeth is left, and it reaches the whole den.
- **Strain** (the two-player answer): Fenrir lunges against its fetters **toward the watched slime**, and the
  anchor **on the far side** starts to crack. Its ring opens (like a weak point's); fill it before the crack
  runs and the anchor is set: the fetter snaps tight, Fenrir is yanked back off its feet (a stagger) and the
  reach shrinks a step. Leave it and the reach grows a step. So the Knight takes the Watch with Rally and
  holds it on one side, and someone else sets the anchor on the other.
- Reach can't shrink below its phase's minimum or grow past its maximum. Being well outside the reach is the
  ranged classes' safe place, until the Howl, the breath and the ice find them.

### The lanterns (the dark) *new*
- The cutters' lanterns hang along the den (six of them; the Keepers' lamp posts, the cutters hung theirs on
  them). **Darkness hurts**: standing outside every lantern's light chills you a little each second (a hazard;
  drawn, timed by the server, nothing blocks). In the light you're fine.
- Fenrir swallows lanterns (one each time its Howl lands from phase 2; Skoll and Hati hunt them in phase 3;
  Swallow the Light takes all but two). **Fire or holy light relights one at once** (a Mage's fire, a burn, a
  Cleric's Smite or holy bolts, as fire sealed Ladon's stumps). **Poor answer:** anyone can stand at a dark
  lantern and hit it to relight it slowly (a ring), or just accept less light.
- Telegraphs are always drawn in the dark (owner: keep telegraphs). The dark hides the wolf's body, never its
  warnings: in the dark you see its eyes and its breath.

## The arena: the Glacier's Bed
A long den (Ladon's width): the bottom of the glacier, black-blue ice with things frozen into it that are
older than the hamlet (bones, trees, a Keeper lamp post). The floor is bare rock scraped smooth. Two anchor
stones in each side wall, the fetters running from them to the collar. Low ice ledges each side and one high
ledge in the middle, above the wolf's head.
The stone hand at its paws. The Long Stair's last steps come down into the west wall.

## The order of the fight
Four phases, each a fixed loop (FB1's engine). Every S5 mechanic is on from the first slime (`partyAll`).
Moves marked *new* need code; the rest reuse a shared move with Fenrir's look.

### Phase 1: The Bound Wolf (100% to 75%, ~10 min)
Four fetters; short reach; every lantern lit. It's lying down when you come in, and gets up slowly.
**Loop:** Watch → Lunge → Claw, Claw → Strain → (Rime Coat every other loop)
1. **Watch** (the focus): its eyes settle on one slime; the focus line runs from them. Rally takes it.
2. **Lunge** (*new*, from `leap`): it gathers itself (~1.2 s) and springs at the watched slime as far as the
   fetters let it, jaws first; the landing spot and the reach's end are marked. Then it stands panting for a
   couple of seconds: melee's opening.
3. **Claw** (`slam`, frost look): a paw swipe in front of it, inside the reach.
4. **Strain** (*new*, above): toward the watched slime; set the far anchor.
5. **Rime Coat** (every other loop; the armour, `looks.shell: 'rime'`): its fur freezes into plates. Ordinary
   hits do little; heavy hits crack it (Berserker, Snipe, a shatter, Meteor).
- **The ultimate, Swallow the Light** (*new*, first below `ULT_FIRST`): it lifts its head and draws in a
  long breath; the lanterns' flames bend toward its mouth, and it swallows all of them but two (the wind-up
  shows which two stay). Then frost fangs come up out of every dark patch of floor. Only the two pools of
  light are safe. Freeze it in the wind-up to stop it. The swallowed lanterns stay dark until relit.

**Its line, entering:** "Chain. Still chain. ...Is it the end? They said they would come at the end."

### Phase 2: The Howl (75% to 50%, ~11 min)
It bites through the first fetter (the anchor's stone splits): reach grows. The pack and the curse join.
**Loop:** Watch → Lunge → Strain → Howl → Frost Breath → (Fetter Ward every other loop)
1. **Howl** (the pulse, `looks.pulse: 'howl'`): it throws its head back and howls, a long warning, then
   the sound hits everyone in the den for a share of max HP. **Each Howl that lands puts out a lantern.**
   The Cleric's Barrier and heals answer it; potions and the Barrier Draught are the poor answer.
2. **Frost Breath** (`beam`, frost look): a breath of white along the floor or at ledge height (the
   wind-up shows which). It reaches past the fetters.
3. **Fetter Ward** (the barrier, `looks.dome: 'fetter'`): the ribbons wind round it in a glowing cocoon. A
   Mage unravels it fastest; a Cleric's holy bolts and Smite help. First time, `lines.shield`: "They bound
   me in this. Sound of a footfall. Breath of a fish. Nothing breaks it. I tried."
- **The curse** (the frost, `looks.curse: 'paw'`): a frost paw print opens under someone. Step out, or the
  cold sets you half-solid (S5's curse stacks). Cleanse lifts it.
- **The pack** (adds): rime wolves come out of the dark ends of the den (from the Old Ice); more of them the
  more lanterns are out.
- **Swallow the Light** as in phase 1, more often.

**Its line:** "The end came, didn't it. I felt it in the ice. And nobody came down the stair."

### Phase 3: Skoll and Hati (50% to 25%, ~12 min): the set piece
The second fetter snaps. **Its two sons come out of the dark**: Skoll and Hati, big shadow wolves (in the
myth, the wolves that chase the sun and the moon). They don't fight you much: **they hunt the lanterns.**
Each runs to a lit lantern and swallows it, then the next, and the den gets darker phase-long.
**The rule:** the lanterns are the room. A party that relights and keeps the sons off keeps its light; one
that doesn't fights in the dark, where the cold hurts and the pack comes thicker.
- **Skoll and Hati** (*new*, two named adds with their own HP bars): kill one and it sinks into the dark and
  comes back after a while (`SONS_BACK_S`). Hitting one off a lantern (a stagger, a knockback, a freeze) saves it.
**Loop:** Howl → Watch → Lunge → Strain → Claw, Claw → Rime Coat or Fetter Ward by turns → Frost Breath
- **Its second ultimate, Fimbulwinter** (*new*, from `wave`): the cold comes off the glacier in one long
  blizzard from one end of the den (the wind-up says which: the snow starts streaming that way). **The only
  shelter is in the lee of an anchor stone** on the far side from the wind: a narrow strip behind each one.
  Freeze it in the wind-up to stop it. Phase 3 alternates Swallow the Light and Fimbulwinter.
- An ultimate nobody interrupts also hits the people in the safe place (`TOP_ULT_HP`), as on any top boss.

**Its line:** "My sons hunt the light. Let them. It is colder without. You stop needing to see."

### Phase 4: The Last Fetter (25% to 0%, ~12 min): the hardest
The third fetter snaps. **Only the last is left, the one in its teeth**: it reaches the whole den, and
because it won't open its jaws, it **doesn't bite any more.** It fights with its paws, its weight and its voice.
The sons and the pack keep hunting.
**Loop:** Swallow the Light or Fimbulwinter (alternating) → Watch → Pounce → Howl → Falling Ice → Rearing
→ Rime Coat and Fetter Ward *together*
1. **Pounce** (*new*, from `charge` + `leap`): it crosses the den in three bounds at the watched slime, each
   landing marked; whatever's under a landing is hit. A Knight holding the Watch can place them.
2. **Falling Ice** (`rain`): the Howl shakes the roof and icicles come down across the den, marked.
3. **Rearing** (*new*, the weak point): it rears up on its hind legs, the collar lifted high, and comes
   down on the watched slime. While it's up, **the shard in its collar lock is the weak point** in reach of
   melee from the front (arrows reach it any time it's open). Filling it staggers Fenrir for longer than
   anything else; nobody filling it means the landing hits hard and wide.
4. **Both shields at once** (final bosses only): the fetters wind round it over the rime. The Mage takes
   the ward, the Berserker the rime.
- Swallowed lanterns, the curse, the sons and the pack run all phase. A party missing a role has its worst
  time here.

**Its line:** "This one I hold myself. If I let go, there is nothing left to stop me. Nothing."

### The enrage (`FINAL_ENRAGE_MIN`, a little past 45 minutes)
Every lantern goes out at once and nothing relights them; the cold of the dark gets worse each minute; the
Howl comes twice as often. A party that's too weak runs out of time instead of winning slowly.

### Freed
It opens its jaws. The last fetter slides out and lies on the floor, still shining. The wolf lies down with
its head on its paws beside the stone hand, and the lanterns come back on one by one. Its line:
"...Nobody is coming. Then nobody needs me bound. I will stay here. I only wanted someone to tell me."
(Later, with story delivery: the cutters go back down the Long Stair and finish it, a "freed" world change.)

## Every class's answer (the S5 rule: no mechanic belongs to one class)
| what it does | best answer | everyone else |
|---|---|---|
| The reach (fetters) | ranged classes stand outside it; melee works the Lunge's opening | stay near the frost line |
| Watch (focus) + Lunge / Pounce | Knight's Rally: he takes it and places the landings | the watched one Dashes or gets high |
| Strain (anchors) | Knight holds the Watch on one side, anyone sets the far anchor | everyone runs to the anchor; reach grows |
| The lanterns (dark) | Mage's fire, a Cleric's holy light relight at once | hit a lantern to relight it slowly; live in the dark |
| Rime Coat (armour) | Berserker, Snipe, a shatter, Meteor | wait it out |
| Fetter Ward (barrier) | Mage; a Cleric's holy bolts and Smite | wait it out |
| Howl (pulse) | Cleric's Barrier and heals; Knight's Bubble, Sanctuary, Aegis | potions, the Barrier Draught |
| Frost paw (curse) | Cleric's Cleanse | step out; the Cleansing Tonic |
| Swallow the Light / Fimbulwinter (ultimates) | Frostbinder freezes the wind-up | the two lit pools / the anchors' lee |
| Rearing (the shard) | Archer; melee in front | jump for it while it's up |
| Skoll and Hati, the pack (adds) | knockbacks and freezes keep the sons off lanterns; area attacks for the pack | single hits; relight after them |

## Rewards (items only, owner; no reward window)
One weapon a kill by class (`twinPick`), Frostpeak's best, a step above Sigrun's on the frozen curve:
*the Pledge-Hand* (Warrior: a stone-hilted sword), *the Gleipnir Staff* (Mage: a ribbon of light wound up
it), *the Lantern Rod* (Cleric), *the Moon-Chaser Bow* (Archer: Hati's), plus a shared chance of *the Wolf-Pelt
Hood* (a hat with ears). Gold and EXP from the economy sheet: a 45-minute kill split four ways. A **mini
Fenrir** in the Pet Shop: a fluffy pup with a ribbon collar that chews the end of its own ribbon.

## On the way there (part (b), summarised; designed in full when it's built)
**Status: (b) built 2026-10-27** (`docs/places/oldice.md`): the fallen wall, the cutters' record and thin ice in
the Blue Halls; the Old Ice (room 50; the plan's "rime wolves" are *black-ice wolves*, `black_wolf`, since the
Glacier's Lv 67 mob already has the name: (c)'s pack reuses them); the Long Stair (room 51) with Fenrir's line and
the door, which cracks but holds (a gate on the map, "the ice holds") until (c) adds the den's `DENS` row (room 52,
`FENRIR_DEN`, "The Wolf's Hold").
- **The Blue Halls get better:** one of the Hall Troll's walls in the Deep Blue has fallen over (the update
  does it) and there was a way down behind it all along. Also: **the cutters' record**, a second find, carved
  in the ice by the old ladder down: a tally of days, then "We heard it breathe. We heard the chain. We
  stopped." (Eyvind's grandfather's crew; Eyvind hints, never says). And a hazard: **thin ice** that cracks
  under you and hurts if you stand on it (drawing and damage only, like the Thornheart's thorn patches).
- **The Old Ice** (deep room, Lv 90–100, hard, elites only): the oldest black-blue ice at the glacier's bed,
  the cutters' last camp left in a hurry (a sledge half-loaded, a pot frozen on a dead fire), and things frozen
  in the walls older than the hamlet. New mobs: *rime wolves* (the pack; `charge`), *rime ravens* (`dive`),
  *chain-wardens* (Keeper stone figures holding lengths of old fetter, front shell), *gnawers* (pale ice rats
  that tunnel and come up behind you, `blink`). The elite at the far end: **Garm, the Hound at the Gate**, a
  chained hound that howls at the top of the Long Stair, as in the myth.
- **The Long Stair** (the approach, no mobs): a stair the cutters cut down into clear ice and never
  finished, landing by landing. The wolf's shape shows through the ice wall beside you, bigger at each landing:
  first a shadow, then the curve of its back, then an eye that opens as you pass. Its breath frosts the ice
  from the other side. The lanterns on the stair are out one by one below you, the music falls to the ice's
  hum, and a chain clinks somewhere under it. The ice frosts over the stair behind you (art only; the way back
  always works). One line when the first slime crosses the mark: "Is it the end? ...No. Not yet. Go back up."
  At the bottom the ice over the den's door cracks open by itself, with both levels on its sign and
  "3 here, 4+ recommended" beside it.
- **The den:** a title card "FENRIR, THE BOUND WOLF · Lv 120 · recommended Lv 100, 4+ players" and letterbox
  bars for a few seconds while you can still move. Mobile: both fit a phone.

## What's new in code (so the owner can see the size)
- A FINAL row for Fenrir: four phases, its loops, fixed HP for four, the enrage (the engine is FB1's).
- **The reach**: a server number that grows with phases and unanswered Strains and shrinks on set anchors;
  Fenrir walks inside it (unlike Ladon, it moves), and its melee moves are judged against it on the client.
- **The anchors**: four targets in the walls, each with a ring (Ladon's heads' hit plumbing: `h[4] = 2 + slot`).
- **The lanterns**: six lights the server tracks (lit, dark, relighting), a darkness hazard, fire / holy hits
  relighting, and a darkness overlay drawn cheaply (baked, `docs/performance.md`: the risk is old laptops).
- **Skoll and Hati**: two named adds with their own brain (run to a lit lantern, swallow it).
- New moves: Lunge, Strain, Pounce, Rearing, and two ultimates (Swallow the Light, Fimbulwinter).
- Art: the wolf (lying, standing, lunging, rearing, howling, freed), the fetters, the anchors, the lanterns
  and the dark, the sons, the den; the Old Ice and its mobs, Garm, the Long Stair and the shape in the ice,
  the Blue Halls' fallen wall, record and thin ice. Music: the stair's hum and chain, Fenrir's own track.
- Two sessions, as FB1: (b) the way there, then (c) the den and the boss.
- **Status: (c1) built 2026-10-27** (`docs/places/fenrir.md`): the Wolf's Hold (room 52), the door open, Fenrir's whole
  fight on the final-boss engine (its own brain, `server/fenrir.js`), the reach and anchors, the lanterns and the dark,
  Skoll and Hati, the pack, both ultimates, the enrage, freed; placeholder art, music and pay.
- **Status: (c2) built 2026-10-27** (`docs/places/fenrir.md`): the wolf's art and poses, the fetters, anchors, lanterns,
  Skoll and Hati and the frost paw curse; its own music track; the four class weapons and the Wolf-Pelt Hood; the mini
  Fenrir in the Pet Shop. FB2 is done but for playtesting with people.

## Questions for the owner
All answered 2026-10-27: the dark hurts a little (relighting matters), Skoll and Hati as written, no bites
in phase 4.
