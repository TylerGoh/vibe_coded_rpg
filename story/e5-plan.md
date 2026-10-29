# E5: Emberdeep's final boss, on paper (for the owner to approve)

**Status: approved by the owner 2026-10-29 with every default (Typhon; ice as the floor's answer; the Pour floods
the floor; the shard is Ignis's tooth, shown only). The owner will polish it later.** Step (a) of E5 (`final-bosses.md`,
`world/emberdeep-depth.md`): the boss, its move set and its phase order, before anything is built. Numbers are
aims, not code: the economy sheet sets the real ones. Built on the final-boss engine FB1 made and FB2 generalised
(`docs/combat/bosses.md` "Final bosses", `src/shared/final.js`, `server/final.js`): a FINAL row, written loops, the
enrage, fixed HP for four, no reward window. What's new is marked *new*.

## Carried over (owner, FB1 and FB2)
~45 min for a mixed party of four at the recommended level, four phases, no physics changes (every set piece hurts,
nothing blocks), fixed HP, no reward window, telegraphs kept and no hint naming the answer, items-only rewards.

## Where: under the Old Foundry
The two candidates were the Old Foundry and the Drained Tubes, "whichever is darker and more closed in". **The
Foundry**: the Tubes have roof skylights and sit at 115–125, while the Foundry is a sealed hall deep in the mountain at
130–145, right under the island's top. It's also where the story points: the tally board's "ONE SHORT", the half-cast
tooth, the Pattern with Ignis's mark. The final boss is what's under the forge.

## The boss: Typhon, the Buried Fire
**The myth.** Typhon was the last and worst of the monsters: a giant whose head brushed the stars, serpent coils from
the waist down, fire in his eyes, and a hundred voices. The gods beat him at last and buried him under Mount Etna,
and the volcano's fire is his breath; the smith-god's forge was set on top of him. (He's also the father of the
monsters, Ladon among them. Nobody in the game says so.)

**In Slimeville.** Long before the forge folk, the mountain's fire was a creature. The Keepers buried it under the
mountain and built the first forge on top of it: its breath fired every furnace that cast the gear-teeth. They told it
**"Keep the fire until the Wheel has every tooth."** The Wheel never did. The last tooth went up the road with Brenna
and never arrived, and when the Wheel jammed, a tooth snapped and fell all the way back down the mountain into the
fire it was cast in. That's its shard, set in its chest: a broken gear-tooth with a hammer-over-a-flame mark burnt on
it (Ignis's mark, from the Pattern and the tally board; never named). So Typhon keeps the fire. The forges are dead,
the smiths are names on a wall, and it holds the whole mountain's heat under the Foundry, for a pour nobody is coming
to make.

**Why it fits.**
- *Holding on vs letting go* (`characters/bosses.md`): it holds its breath. Everything it does in the fight is the
  pressure of a fire kept in too long.
- *The trapped feeling*: under the deepest room on the island, under the mountain itself, under something buried. The
  den is the first forge's hearth, sealed in brick.
- *Emberdeep's register*: grief and guilt, heat and iron. "ONE SHORT" is answered by showing (the empty mould, the
  tooth in its chest, the mark), never by words. The Tier 3 words stay Ignis's.
- *Three islands, three bindings*: Ladon was told never to sleep, Fenrir to wait "until the end", Typhon to keep the
  fire. Same order given three ways; nobody points it out.
- *Menace, from below*: you see it under your feet first.

**Its look.** Only the top half ever comes out of the hearth: a huge hunched giant of black basalt and cooled slag,
cracked all over with orange light, a shaggy mane of smoke, four burning eyes in a face like a cooling ingot, and two
enormous forearms it uses like hammers. In its chest, behind a grille of its own ribs, the tooth glows gold-white.
Below the waist it's coils, thick as the Foundry's rail-carts are long, scaled in slag, moving under the floor plates;
you see them through the cracks. It breathes like a bellows: every breath, the room's glow brightens and dims.

**Levels.** Lv 170 on its name tag; "recommended Lv 150, 4+ players" on the door, the approach sign and the title card
(`FINAL_LVL_OVER`, `finalTag(150)`). Its stats come from the FINAL table, never from Lv 170.

## Its own mechanics
### The floor plates (the room) *new*
- The den's floor is eight great cast-iron plates laid over the fire. Each plate is **cold** (dark iron, safe),
  **glowing** (a warning: about to melt) or **molten** (it hurts to stand on: a hazard, drawn and timed by the
  server, nothing blocks).
- Typhon's moves melt plates: its fists, its coils bursting up, its eruptions. A molten plate crusts back over by
  itself after a while (`PLATE_COOL_S`).
- **Cold sets a plate at once** (the answer; *new*): a Frostbinder's frost on a molten plate crusts it over, a chill
  on it, a freeze locking it for longer. Fire did it on the last two islands, ice does it here.
- **Poor answer**: anyone can stand next to a molten plate and hit its ring (like a lantern's) to beat a crust onto it
  slowly. Or live on the ledges and the cold plates.

### The pressure (the breath) *new*
- Typhon holds its breath. A **pressure** number the server tracks, drawn as its chest glowing brighter and cracks
  opening along the walls. Its moves add to it; every Bellows lets a little out; time adds to it.
- **Four vents** (the old furnace doors in the walls, two each side, iron wheels on their faces): hit a vent's ring
  to full and it **opens**: the pressure drops a big step, and a column of fire roars out of that vent along the
  floor in front of it for a few seconds (`VENT_BLAST_S`). So you open the vent nobody's standing in front of,
  and the Knight walks Typhon's attention away from it. That's the two-player answer.
- **Full pressure** means the hearth goes up: Eruption (the ultimate, below) comes early, and with no wind-up to
  freeze.
- From phase 3 the pressure is also the height of the molten iron (below). That's one number to watch.

### The coils (under the floor)
Its coils move under the plates the whole fight: a plate bulges and its cracks glow (the telegraph), then a coil
heaves up through it (a hit), leaving it molten. In phase 4 they come up for good.

## The arena: the Hearth
A long den (Ladon's and Fenrir's width): the first forge, older than the Foundry above it. A vaulted chamber of black
basalt and soot-black brick, much older work than the forge folk's, with Keeper carving on the arches (teeth, a
wheel). The eight floor plates; in the middle of the floor, set into it, a huge **empty mould**: the print of a
gear-tooth in sand, one short. The great hearth pit at the back middle, where Typhon rises. The four vents in the side
walls. Low brick ledges each side, a high one at each end, and the rusted gantry of a ladle-crane overhead with one
great ladle still hanging from it (phase 3). The Flue's last steps come down into the east wall.

## The order of the fight
Four phases, each a fixed loop (the FINAL engine). Every S5 mechanic is on from the first slime (`partyAll`).
Moves marked *new* need code; the rest reuse a shared move with Typhon's look.

### Phase 1: The Buried Fire (100% to 75%, ~10 min)
Only its head, shoulders and arms are out of the hearth. Every plate cold; pressure low and slow.
**Loop:** Glare → Hammer, Hammer → Bellows → (Slag Crust every other loop)
1. **Glare** (the focus): its four eyes settle on one slime, a line of heat from them. Rally takes it.
2. **Hammer** (*new*, from `slam`): a forearm rises (~1.2 s, the landing marked) and comes down on the watched
   slime's plate, which goes glowing, then molten. Then the arm lies on the floor for a couple of seconds, steaming:
   melee's opening, and its knuckles are a ledge to stand on (drawing only: they're where a platform already is).
3. **Bellows** (the pulse, `looks.pulse: 'bellows'`): it draws in (the room dims, the haze pulls toward it), then
   breathes out a wave of heat that hits everyone in the den for a share of max HP. Lets a little pressure out. The
   Cleric's Barrier and heals answer it; potions and the Barrier Draught are the poor answer.
4. **Slag Crust** (every other loop; the armour, `looks.shell: 'slag'`): the cracks on its skin go dark and set hard.
   Ordinary hits do little; heavy hits crack it (Berserker, Snipe, a shatter, Meteor).
- **The ultimate, Eruption** (*new*, first below `ULT_FIRST`): it sinks into the hearth to the shoulders and the
  whole floor starts to glow. Every plate erupts **except the ones crusted cold** and the two the wind-up leaves dark
  (so there's always somewhere). A party with a Frostbinder makes its own safe ground ahead of time. Freeze it in the
  wind-up to stop it. Plates that erupted are left molten.

**Its line, entering:** "Is it the last one? Have you brought the last one? ...I have kept it hot."

### Phase 2: The Pressure (75% to 50%, ~11 min)
It pushes up to the waist; the coils start moving under the floor and the pressure climbs faster.
**Loop:** Glare → Coil Burst → Bellows → Fire Breath → Hammer → (Heat Haze every other loop)
1. **Coil Burst** (*new*, from `spikes`): three plates bulge in turn, nearest the watched slime first, and a coil
   heaves up through each, leaving them molten.
2. **Fire Breath** (`beam`, fire look): a breath along the floor or at ledge height (the wind-up shows which).
3. **Heat Haze** (the barrier, `looks.dome: 'haze'`): the air round it shimmers into a ward. A Mage unravels it
   fastest; a Cleric's holy bolts and Smite help. First time, `lines.shield`: "Not yet. The fire stays in. It
   stays in until the Wheel has every tooth."
- **The curse** (the thinning, `looks.curse: 'scorch'`; canon: great heat thins slimes out): a scorch ring opens
  under someone. Step out, or the heat thins you (S5's curse stacks: you're see-through and take more damage).
  Cleanse lifts it.
- **The brood** (adds): cinder whelps (small fire serpents) climb out of the molten plates, more of them the more
  plates are molten. Freezing a plate also stops its whelps.
- Pressure is now a real clock: open vents, or the next Eruption comes early.

**Its line:** "They are quiet up there. No hammers. When did the hammers stop?"

### Phase 3: The Pour (50% to 25%, ~12 min): the set piece
It remembers the order and tries to finish it. It reaches up and tips the great ladle on the crane, and molten iron
pours down the channels into the empty mould in the middle of the floor and runs over: **the floor floods.**
- **The rule** (*new*): the molten iron's height is the pressure. As it rises the low plates go under first (in
  steps, edge to middle), then the middle ones; the low ledges stay above it until near the top; the high ledges at
  each end are always above it. Iron over a plate hurts like a molten plate. Open a vent and the level drops a
  step; frost crusts a skin on the iron over a plate, so you can stand on it for a while. A party that keeps the
  pressure down fights on the floor; one that doesn't fights from the ledges and the crane, which suits the Archer
  and nobody else.
- The vents are now all low on the walls: opening one means going down to it, near the iron.
**Loop:** Bellows → Glare → Hammer → Coil Burst → Fire Breath → Slag Crust or Heat Haze by turns → (the Pour tops up
the level every loop)
- **Its second ultimate, the Last Pour** (*new*, from `wave`): it tips the ladle all the way. A wave of iron runs
  from one end of the den to the other (the wind-up says which: the ladle swings that way). Only the high ledges at
  the far end, and anywhere frosted, are safe. Freeze it in the wind-up to stop it. Phase 3 alternates Eruption and
  the Last Pour.
- An ultimate nobody interrupts also hits the people in the safe place (`TOP_ULT_HP`), as on any top boss.

**Its line:** "One short. ONE SHORT. Then I will cast it myself. Hold still. You are the right shape."

### Phase 4: Unburied (25% to 0%, ~12 min): the hardest
The ladle's empty. Typhon tears the rest of itself out of the hearth: the coils come up through the plates and lie
along the den's middle, and from here on **it moves** along the den on them (unlike phases 1–3). The iron drains back
into the channels; the floor is all plates again, and most of them glowing.
**Loop:** Eruption or the Last Pour (alternating) → Glare → Coil Sweep → Bellows → Hammer, Hammer → Inhale → Slag
Crust and Heat Haze *together*
1. **Coil Sweep** (*new*, from `charge`): it drags its coils from one end of the den to the other toward the watched
   slime, melting every plate it crosses. A Knight holding the Glare can steer which way it goes.
2. **Inhale** (*new*, the weak point): it draws the deepest breath of the fight; its ribs spread and **the tooth in
   its chest is the weak point**, in melee reach from the front and in arrow reach whenever it's open. Filling it
   staggers Typhon for longer than anything else and lets out all the pressure at once. Nobody filling it means the
   breath out is a double Bellows and every plate glows.
3. **Both shields at once** (final bosses only): the haze over the crust. The Mage takes the haze, the Berserker the
   crust.
- The vents, the plates, the curse and the brood run all phase. A party missing a role has its worst time here.
- **The hundred voices** (art and sound only): its roars in this phase come in many voices at once, low and
  overlapping, like a forge full of smiths shouting. Nothing explains it.

**Its line:** "Everyone I warmed is a name on a wall. If I let it out, what is left of them?"

### The enrage (`FINAL_ENRAGE_MIN`, a little past 45 minutes)
Every vent jams shut, nothing crusts, and every plate goes molten in turn and stays molten. The Bellows comes twice
as often. A party that's too weak runs out of time instead of winning slowly.

### Freed
It breathes out, the longest breath anyone has heard, and the fire goes down the mountain with it: the plates go
dark, the haze clears, the coils go still. The tooth slides out of its chest and drops into the empty mould on the
floor, and fits. Its line: "...Nobody is coming to pour. Then I can let the fire go. Tell them up there it is
warm enough now." It sinks into the hearth, and the room is just warm.
(Later, with story delivery: a "freed" world change, if wanted: the Foundry's pits go cold, or the column steadies.
Not part of E5; Phase 6's balloon keeps Slag's burner as its reason.)

## Every class's answer (the S5 rule: no mechanic belongs to one class)
| what it does | best answer | everyone else |
|---|---|---|
| Molten plates | Frostbinder's frost crusts them at once | hit a plate's ring to crust it slowly; ledges, cold plates |
| Pressure (vents) | Knight holds the Glare away, anyone opens the far vent | open the vent and dodge your own blast |
| The Pour (flood) | vents drop it; frost skins the iron | fight from the ledges |
| Glare (focus) + Hammer / Coil Sweep | Knight's Rally: he takes it and places them | the watched one Dashes or gets high |
| Slag Crust (armour) | Berserker, Snipe, a shatter, Meteor | wait it out |
| Heat Haze (barrier) | Mage; a Cleric's holy bolts and Smite | wait it out |
| Bellows (pulse) | Cleric's Barrier and heals; Knight's Bubble, Sanctuary, Aegis | potions, the Barrier Draught |
| Scorch (curse) | Cleric's Cleanse | step out; the Cleansing Tonic |
| Eruption / the Last Pour (ultimates) | Frostbinder freezes the wind-up (and pre-crusts plates) | the dark plates / the far high ledge |
| Inhale (the tooth) | Archer; melee in front | jump for it while it's open |
| The brood (adds) | area attacks; freezing their plates | single hits |

## Rewards (items only; no reward window)
One weapon a kill by class (`twinPick`), Emberdeep's best, a step above Brenna's on the frozen curve: *the Last
Hammer* (Warrior: a smith's hammer-sword, Ignis's mark on the pommel), *the Pour Staff* (Mage: a ladle-headed
staff still glowing in the bowl), *the Hearthstone Rod* (Cleric), *the Bellows Bow* (Archer), plus a shared chance of
*the Furnace Mask* (a hat: a smith's iron face-guard with four eye slits). Gold and EXP from the economy sheet: a
45-minute kill split four ways. A **mini Typhon** in the Pet Shop: a small slag serpent with a glowing chest that
puffs smoke rings. Its price sits under Chronos's (the Pet Shop's top stays Chronos; `PETSHOP_W`).

## On the way there (part (b), summarised; designed in full when it's built)
**Status: (b) built 2026-10-29** (`docs/places/underflues.md`): the Foundry's fallen pit, the stoker's ledger and hot
grates; the Under-Flues (room 63: cinder whelps, flue bats, clinker crawlers, stoker wardens, three elites, Orthrus; the
Damper hidden); the Long Flue (room 64) with Typhon's line and the furnace door, which bangs with every breath but holds
(a gate on the map, "the door holds") until (c) adds the den's `DENS` row (room 65, `TYPHON_DEN`, "The
Hearth"). The door's sign says "N here, 4+ recommended" (a live count, not the plan's "3").
Room ids: the next free ones (63, 64, 65 today).
- **The Foundry gets better:** at the Casting Floor's west end, the back of the biggest casting pit has fallen in
  (the update does it): under the half-cast tooth, a brick flue runs down, hot air coming up it. Also in the same
  pass: **a second find**, the stoker's ledger by the flue's mouth (an E reading like the tally board): the stokers'
  shifts feeding the fire from below, the entries getting shorter, the last one "It breathed back. We came up."; and
  **a hazard: hot grates**, floor grates that vent heat on a cycle and hurt if you stand on them while they do
  (drawing and damage only, like the thorn patches and thin ice).
- **The deep room: the Under-Flues** (Lv 145–150, hard, elites only, a red level chip, no waystone): the brick flues
  and fire channels that fed the furnaces from below, hotter and redder going in, glowing seams in the brick, the
  stokers' abandoned shovels and a coal barrow tipped over. New mobs: *cinder whelps* (the brood: small fire serpents,
  `trail`, burning), *flue bats* (`dive`), *stoker wardens* (Keeper iron figures with long fire-irons, front shell),
  *clinker crawlers* (`split`). The elite at the far end: **Orthrus, the Two-Headed Hound** (Typhon's son in the myth),
  a soot hound the size of a cart with two heads, lying across the way down. It barks one head at a time.
- **The approach: the Long Flue** (no mobs): a sloping brick flue down into the heat, walked on **an iron grating
  over the drop**. Through the grating you see it below: first a glow, then a coil sliding past, then the curve of a
  back, then, at the last landing, four eyes opening under your feet. Every breath it takes, the glow under the
  grating brightens and the heat-haze pulses; between breaths it's nearly dark. The flue narrows, soot comes down
  thicker, the haze behind you hides the way back (art only; the way back always works). The music falls to the
  bellows breath and a slow hammer on an anvil that stops partway down. Its line when the first slime crosses the
  mark: "Is it time to pour? ...No. Not you. Go back up." At the bottom the furnace door swings open by itself on a
  gust of heat, with both levels on its sign and "3 here, 4+ recommended" beside it.
- **The den:** a title card "TYPHON, THE BURIED FIRE · Lv 170 · recommended Lv 150, 4+ players" and letterbox bars
  for a few seconds while you can still move. Mobile: both fit a phone.
- **Personas:** Ash learns the Foundry's pit has fallen through and says flatly he isn't going down; Pitch knows his
  grandfather was a stoker; Ignis's freed line is unchanged (the words stay his).

## What's new in code (so the owner can see the size)
- A FINAL row for Typhon: four phases, its loops, fixed HP for four, the enrage; its own brain (`server/typhon.js`)
  with the same face as `server/ladon.js` and `server/fenrir.js`, and `src/typhon.js` on the client.
- **The plates**: eight floor strips the server tracks (cold, glowing, molten, crusted), a hazard for the molten ones,
  frost hits on a plate crusting it (frost already exists: `el` on the skill), a ring on each for the poor answer.
- **The pressure and the vents**: one server number; four wall targets with rings (Fenrir's anchors' plumbing,
  `h[4] = 2 + slot`); a vent blast as a timed hazard.
- **The Pour**: the molten level as a hazard band whose top follows the pressure, frosted patches over it.
- **Phase 4's movement**: Typhon walks the den on its coils (Fenrir already moves inside its reach).
- New moves: Hammer, Coil Burst, Coil Sweep, Inhale, and two ultimates (Eruption, the Last Pour).
- Art: Typhon (in the hearth to the shoulders, to the waist, unburied; hammering, breathing, inhaling with the tooth
  showing, freed), the coils under and over the plates, the plates' four states, the vents and their blasts, the
  molten iron and the ladle, the brood, the Hearth; the Under-Flues and its mobs, Orthrus, the Long Flue and the shape
  under the grating, the Foundry's fallen pit, ledger and hot grates. Music: the flue's bellows and hammer, Typhon's
  own track. Performance: the glow and the iron are big gradients, so bake them (`docs/performance.md`).
- Sessions, as before: (b) the way there, then (c1) the den and the fight, then (c2) art, music and rewards.

## Questions for the owner
All answered 2026-10-29: the defaults below stand ("all looks good as defaults").
1. **The boss.** Typhon, the Buried Fire (above) is my pick. Other myths that fit a forge under a volcano:
   - *Surtr*, the fire giant with the burning sword who waits at the edge of the world for the end. Strong, but
     it's Norse again after Fenrir, and "waiting for the end" is Fenrir's story.
   - *Talos*, the bronze giant the smith-god built, whose one vein of fire is shut with a single nail at the ankle
     (pull it and he dies; a lovely weak point). Too close to the Clockwork Colossus, though.
   - *Fafnir*, the smith's brother who became a dragon on a hoard: here, a hoard of gear-teeth. Too close to the
     Tidemother's hoarding.
2. **Ice as the answer to the floor.** Fire was the answer on both earlier islands; here the Frostbinder's frost
   is. OK, or keep fire somewhere in it too?
3. **The Pour floods the floor** in phase 3, pushing the fight up onto the ledges: a vertical set piece, unlike
   Ladon's coils and Fenrir's reach. OK, or too hard on melee?
4. **The tooth in its chest** is Ignis's snapped tooth, shown by the mark only and never said. OK to tie it to
   Ignis that way?
