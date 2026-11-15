# The Keel (room 93, `KEEL`): Lv 188–200, a hard pocket, and the Rustwyrm

The Citadel's depth pass, **C5** (`story/citadel-plan.md`; room 13 and its gates: `docs/places/citadel.md`). Down the ladder
under the Grand Foundry's maintenance hatch in Cogwork Bastion (`KEEL_GATE_X`). Since C0 the hatch had been clamped under a
jammed gear that ticked one beat slow. C5 knocked the gear free: it now lies propped against the housing, and the ladder's
top shows in the open hatch (`hatch`'s open look in `src/citadel-gates.js`; the update did it, no quest). Down the ladder
is the hollow under the city, among the Wheel's lowest teeth. It is dark and closed in. The keel's great iron ribs curve
up into the black, and chains hang out of it. Overhead is the jammed Wheel's underside, its teeth as big as houses, one
tooth missing from the row. The only light is aether leaking up through cracks in the deck. Everything ticks, and each
tick lands late in its beat. Tone: the Citadel's (solemn, no living people), and darker than anywhere else in it so far:
the plan's "trapped" mood starts here and the Undercroft (C6 (b), `docs/places/undercroft.md`) finishes it.

Files: the room in `src/shared/rpg.js` (`KEEL`, `KEEL_W`, `KEEL_EXIT_X`, `UNDERCROFT_GATE_X`, `KEEL_ZONES`,
`KEEL_PLATFORMS`, `GRINDS` and `grindAt`, the `STAGES` row with `hard`, the three mobs and two elites, the Rustwyrm, their
items, spawns), `ROOMS[KEEL]` and its door in `ROOMS[CITADEL]` (`src/shared/sim.js`), the `keel` node (rooms, `entry`) and
the `undercroft` node's gate in `CITADEL_MAP` (`src/shared/branches.js`), the grinds' damage in `server/rpg.js`, the room's
drawing in `src/keel.js` (`drawKeel`, which takes the render tick), the mobs, gear and icons in `src/keel-art.js`, the
`fallentooth` gate in `src/citadel-gates.js`, the `grease` puddle in `src/hazards.js`, the `chain` snare in
`src/challenge.js` (`PAL`), the `keel` music scene in `src/audio.js`.

## The room
You come in at the WEST end, at the foot of the Hatch Ladder. West to east (`KEEL_ZONES`):
- **The Hatch Ladder** (no mobs): the ladder down from the round hatch high overhead, with a little of the Bastion's light
  coming through it and a lamp left hanging on a rung. The jammed gear that held the hatch lies on the deck by the
  ladder's foot, one tooth broken. **No waystone** (a hard pocket, like the Tubes and the Foundry); the Bastion's stone is a
  short walk from the hatch.
- **The Bilge Walk** (188–192): gear lice on the deck and the ribs' girders, a chain hound or two.
- **The Chain Locker** (192–196): chain hounds on the deck and the hanging chain-stages, lice, **an Old Chain Hound** (elite).
- **The Lowest Teeth** (196–200): keel wardens on the deck and on the flat tops of teeth come down through it, hounds, **an
  Elder Keel Warden** (elite), and **the Rustwyrm** hanging out of the dark over it (field boss). At the far end is **the
  way down to the Undercroft** (`UNDERCROFT_GATE_X`, gate `fallentooth`): one of the Wheel's teeth, big as a house, has come
  down across the shaft, its root sheared, aether leaking up round it. It was C6's gate ("Below, something holds."); since C6 (b) the tooth stands levered aside and a stair goes down beside it to the Undercroft.
- **The grinds** (`GRINDS`, a room hazard: the Engine Halls' turbine blades' pattern). These are slots in the deck where the
  Wheel's lowest teeth pass under it. The Wheel is jammed but still strains on its tick. On each slot's own offset in a
  `GRIND_CYCLE`:
  - **The warning** (`GRIND_WARN`): the deck over the slot shudders, dust sifts off it and the slot glows with the aether
    below.
  - **The tooth** (`GRIND_UP`): a tooth heaves up through the slot. It hurts whoever stands on the deck over it,
    `GRIND_DOT` of max HP every `PATCH_HIT_EVERY` ticks.
  - Then the tooth sinks back.

  How it works:
  - Both sides read the server tick (`grindAt`), so nothing goes over the wire.
  - The damage is a flat `'dot'` (no knockback), so `step()` doesn't change.
  - A rib or a stage over the slot is safe, and so is stepping off it.
  - It's only drawn, the turbines' way, so phones need nothing new.
- **The find** (last in `KEEL_PLATFORMS`, `socket`): high on a rib over the Bilge Walk's chain-stage is a great brass
  boss with a square hole in it: the snapped tooth's empty socket. The stumps of sheared bolts ring it, bright where they
  broke, and the mark of the tooth's root is worn into it. Nothing says so. (The tooth is on the Bearer's Seat in
  Emberdeep, `docs/places/rim.md`: shown, not said.) The gap in the row of teeth overhead is the same tooth's.

## Its mobs (on the frozen curve past 190, a little tougher than the open rooms', two elites)
- **Gear louse** (190): a brass mite the size of a dog that lives in the Wheel's teeth and eats the grease off them, its
  shell black with grease, mandibles like gear teeth. It leaves a slick of old grease behind it (`trail`, a new puddle
  style `grease`: a black slick, a dull sheen, brass filings). HP 95%. Material: the Louse Plate.
- **Chain hound** (194): one of the keel's watchdogs, built of linked chain on an iron frame, a plate skull with a hinged
  jaw, a padlock for a heart with its keyhole lit. A quick plain chaser, HP 104% like the barrow hound. Material: the
  Hound's Link. Elite: the **Old Chain Hound**.
- **Keel warden** (198): one of the hollow's great iron keepers, a riveted barrel with a lamp-slot face, a bulkhead plate
  held across its front (`shell`, the causeway guard's: get round behind). HP 120% like every `shell` mob. Material: the
  Keel Rivet. Rare: the **Keel Warden's Visor** (`helmetPrice` at 198). Elite: the **Elder Keel Warden**.
- Voices borrowed (the obsidian crab's, the soot hound's, the aether knight's).

## The Rustwyrm (field boss, Lv 196)
A serpent of linked chain as thick as a slime, rusted red, hanging out of the dark between the Wheel's teeth. The chain goes
up out of sight. Its head is a great iron hook plated like a skull, with two aether lamps behind grilles for eyes. A small
boss with no story (a `desc`). Passive until hit; then it draws its head up into the dark and drops on you (`dive`, `fly`
80, the Pale Wyrm's).
- **T3** (`docs/combat/challenges.md`): from the start some drops are feints (`feint`: it pulls up and comes down where you
  went). From its second third it wraps you in its chain (`mash`, `looks.snare: 'chain'`, a new `PAL` row).
- **S5.4**: with two or more on it, it picks one slime to hunt (`focus`) and its links close up into plate (`armour`, the
  Colossus's brass, `looks.shell: 'brass'`).
- **Drops**: the Rust Flail (twins: the Linkwork Staff and the Chainstring Bow) and the Rustwyrm Coif (both Lv 198,
  `BOSS_GEAR.field`), Rustwyrm Links and Hound's Links.
- **Its pet**: the mini Rustwyrm, between the mini Helmsman and the mini Great Bell (`PETS`; `PETSHOP_W` up to fit it).

## Who knows
- **The Commissary** (`docs/places/citadel.md`) logged the gear coming free ("REQUISITION CLOSED. NO GEAR WAS ISSUED. THIS
  IS IRREGULAR."). It calls the wardens and hounds "THE KEEL WATCH", the lice "PESTS", and the Rustwyrm "LARGE MAINTENANCE
  ITEM. DO NOT ISSUE."
- **The Last Echo** (`docs/places/orrery.md`) heard the hatch go. It goes still at the keel ("It's holding. Something down
  there is still holding."). It remembers a tooth taken out of the wheel long before and the hole it left, and nothing
  more: where the tooth went is for the slime to find.

## Decisions and history
- 2026-11-14: built at the owner's "continue with next phase" (every plan default). **Not played by anyone yet.** Checked
  by a build, the economy sheet, and every new draw function run against a stub canvas in Node. There was no headless bot
  test (owner's rule).
- The band follows C0's stretch (188–200, not the plan's 183–193), so the Rustwyrm is Lv 196, not ~191.
- The plan names no hazard for the Keel; the grinds were added for "ticking that is always one beat slow", so the Wheel's
  tick is something you have to mind down here.
- The plan's chain hounds and keel wardens became the two elites (a hard pocket's).
- The Undercroft lost `past`: its gate (`fallentooth`) was laid at the Keel's east end with its open look ready, so C6 (b) was
  data plus the room. 2026-11-15, C6 (b): lifted. The tooth now leans on end against the hull, the lever still under it, a
  stair cut down beside it (`drawToothLevered`); the door is in `ROOMS[KEEL]` (`docs/places/undercroft.md`).
- Tamp (the Skydocks camp) is still looking for his master's gear and hasn't been in; nobody tells him about the hatch's
  gear yet (it isn't his).
