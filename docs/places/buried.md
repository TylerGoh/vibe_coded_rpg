# The Buried Caravanserai (room 106, Lv 234–242, a hard pocket) and the Last Drover

Atlas Phase 9, A3 (`story/phase9-plan.md`; the room above it is `docs/places/observatory.md`). The caravan's first town,
swallowed by a dune an age ago, down the stair under the Buried Observatory's dial ring. Its streets are dark and close
under ceilings of packed sand held up on the old roof beams, its tents gone stiff as boards, its lamps out but where the
lamplighters still go their rounds. The caravan moved on from here, the only time it ever did, and left an old drover
behind. A3 also brought the Glass Dunes' field boss, the Glassjaw (`docs/places/glassdunes.md`).

Files: the room in `src/shared/rpg.js` (`BURIED`, `BURIED_W`, `BURIED_EXIT_X`, `BURIED_WELL_X`, `BURIED_ZONES`,
`BURIED_PLATFORMS`, the `STAGES` row (`hard`), the three mobs, their elites, the Last Drover and his phantom pack-beast, their
materials and gear, the spawns), `ROOMS[BURIED]` and its door in `ROOMS[OBSERVATORY]` (`src/shared/sim.js`), the room's
drawing in `src/buried.js` (`drawBuried`), the creatures, the gear and the materials in `src/buried-art.js`
(`BURIED_MOB_ART`, `BURIED_SWORDS`, `BURIED_HELMETS`, `BURIED_ICONS`, and `lantern`, the little amber lamp everything here
carries; the staff and bow in `src/staff-art.js`, `src/bow-art.js`), the way in (`drawSandfall`'s open look in
`src/branch-gates.js`), the lobbed lamps (`amber` in `SHOT`, `src/hazards.js`), his lead rope (`PAL.rope` in
`src/challenge.js`), the `buried` music scene in `src/audio.js`, the pets in `src/shared/house.js`.

## The way in
A1 laid the gate: sand pouring down the stair under the dial ring from a crack above, the steps buried a little deeper
every hour. **A3 stopped it** (the update did it, no quest): the crack has run dry, the heap's been shovelled back to
either side, the steps go down clear into the dark, and someone has hung an amber lamp in the doorway (`drawSandfall`'s
`open` flag, `OPEN.sandfall`). The node has `rooms` and an `entry` (`docs/places/branches.md`), red-trimmed as a hard pocket;
its door at `BURIED_GATE_X` in the Observatory goes down the Sand Stair.

## The room
West to east (`BURIED_ZONES`), darker going east (a hard pocket: the far end is the darkest):
- **The Sand Stair** (no mobs, no waystone: a hard pocket): the steps down from the Observatory, sand heaped on them, the
  daylight at the top.
- **Lantern Street** (234–237): buried market stalls with their striped awnings gone stiff (the `stall` platforms, the
  awnings are what you stand on), mud-brick walls with doorways, old roof beams come down at a slant and caught on posts
  (the `beam` platforms). Threads of sand sift down from the ceiling and stop.
- **The Stiff Tents** (237–240): tents in rows, gone as hard as boards, their stripes faded to nothing, their door-flaps
  open on the dark (the `tent` platforms are their ridges).
- **The Drovers' Yard** (240–242): **the old well** (`BURIED_WELL_X`), a ring of dressed stone with its windlass frame, and a
  ring worn in the floor round it where the string has walked round and round. **The find**: up on the windlass beam (last
  in `BURIED_PLATFORMS`), the rope cut short with the bucket still tied on it, knots marked down it one a morning (Asra's way,
  long before Asra). Nobody tells you it's there.
- A few lamps are still lit over the dark: the lamplighters' rounds.
- A dead end: nothing goes on from here.

## Its mobs (on the frozen curve: `docs/economy.md`)
- **Husk lizards** (236): pack-lizards dried out where their drovers left them, still wearing their packs; quick and hungry
  (plain chasers). Elite: **the Old Pack-Husk**.
- **Buried lamplighters** (238): the old town's lamplighters gone dry as paper, a long hood and a pole with an amber lamp on
  its hook, two amber points in the hood for eyes; still going their rounds, they lob lamps of hot amber at anything that
  isn't a lamp (`lob`, shot style `amber`); the rare **Lamplighter's Hood** (Lv 238).
- **Stiff tents** (240): tents gone hard under the sand that get up on their poles and come down on you (`stomp`), a dark
  door-flap for a mouth and two eyes in it. Elite: **the Great Pavilion**.

## The Last Drover (field boss, Lv 241)
A drover slime dried out under the sand to leather and bone, his wrap and hood stiff as old hide, a goad in one hand and his
lantern in the other, a string of little bells at his belt; he walks his string round and round the well in the Drovers'
Yard, calling to pack-beasts that are only dust now (spawn strip over the Yard). Passive until hit.
- **Moves**: he throws his lantern at you (`lob`, style `amber`).
- **Challenges** (T3, `chf`): **the controls swap** from the start (he turns you round in the dark), and from his second third
  **mash free** (his lead rope round you, `looks.snare: 'rope'`, `PAL.rope`); the punish window like every field boss's.
- **Party** (S5.4): with two or more on him his **phantom string** comes up out of the dust (adds: `minion: 'phantom_beast'`,
  a pack-lizard of drifting dust and amber light, a split-style minion kept small so the sheet needn't check it) and he
  picks one slime to drive (**focus**).
- **Rewards**: **the Drover's Goad** and its twins the **Lantern Crook** and the **Dustline Bow** (Lv 243), **the Last
  Drover's Hood**, Drover's Bells, Husk Scales, coins, scrolls; the **mini Last Drover** at the Pet Shop.
- His name is the first in Tally's ledger of everyone who ever left (or stayed behind); Tally sets a cup for him too, and
  Mother Dune doesn't like to talk about it (`docs/social/ai-characters.md`).
