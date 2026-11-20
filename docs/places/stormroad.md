# The Storm Road (room 107, Lv 236–250), the Sirocco and the Red Wall (den 108, the Storm's Eye)

Atlas Phase 9, A4 (`story/phase9-plan.md`; the room before it is `docs/places/observatory.md`, the town
`docs/places/amberdune.md`). The old caravan road on east from the Buried Observatory's far end, the main trail's top: the
sky reddens going east and the dust thickens, the wind gets up on every rise, and the road's marker stones lead on to where
the storm still stands. That storm, the Red Wall, swallowed a caravan an age ago and holds it yet: Amberdune's party den.

Files: the room in `src/shared/rpg.js` (`STORMROAD`, `STORM_W`, `STORM_EXIT_X`, `STORM_WAY_X`, `DRYWELL_GATE_X`,
`STORM_LAMP_X`, `RED_DEN_X`, `RED_DEN`, `STORM_ZONES`, `STORM_PLATFORMS`, `SQUALLS` and `squallAt`, the `STAGES` row, the four
mobs, the Sirocco, the Red Wall, their materials and gear, the spawns, the `DENS` row), `ROOMS[STORMROAD]` and its door in
`ROOMS[OBSERVATORY]` (`src/shared/sim.js`; the den door comes through `denDoors(STORMROAD)`), the room's drawing in
`src/stormroad.js` (`drawStormRoad`), the creatures, the gear and the materials in `src/stormroad-art.js` (`STORM_MOB_ART`,
`STORM_SWORDS`, `STORM_HELMETS`, `STORM_ICONS`; the staves and bows in `src/staff-art.js` (the new `orb` head),
`src/bow-art.js`), the den, its way in, the Red Wall, The Wall Comes On and its freeing in `src/dens-storm.js` (theme `storm`,
registered in `src/dens.js`), the way in from the Observatory (`drawRedStorm`'s open look) and the dry well's gate
(`drawDryWell`) in `src/branch-gates.js`, the waystone in `src/shared/waystones.js`, the red wisp's bolt (`redbolt` in
`BEAM`, `src/hazards.js`), the wall of sand (`drawSandWall` in `src/challenge.js`, `looks.gaps: 'sandwall'`), the gust pulse
and the sandstone armour (`PULSES.gust`, `SHELLS.sandstone` in `src/party.js`), the squalls' hurt in `server/rpg.js`, the
Red Wall's gear effects in `src/shared/gearfx.js` and `src/gear.js`, the `stormroad` and `redwall` music scenes in
`src/audio.js`, the pets in `src/shared/house.js`, its freed change in `src/shared/story.js` (`BOSS_TIER`) and
`server/lore.js` (`FREED`).

## The way in
A0 laid the gate at the Observatory's east end: a standing storm across the old road, a wall of red sand from the ground to
the sky, churning and not moving. **A4 drew it back east** (the update did it, no quest, the owner's rule). The Red Wall is
still out there at the Storm Road's far end, so the open look reads as the storm drawn back, not gone: the road going on
clear between its marker stones, the red standing far off down it, the half-buried pack-saddle dug out and propped up
(`drawRedStorm`'s `open` flag, `OPEN.redstorm`). The node has `rooms` and an `entry`; its door at `STORM_GATE_X` walks on
east onto the Road's End.

## The room
West to east (`STORM_ZONES`), redder going east (`drawRedSky`, `drawDuneAir`'s `thick`):
- **The Road's End** (no mobs): the old road out from between the Observatory's last rings onto open sand, a stone with
  the caravan's road-mark cut in it and a cairn of blue-painted pebbles left by travellers going on; a waystone
  (`STORM_WAY_X`, `isle: 'dune'`).
- **The Marker Road** (236–240): the road's paving half drifted over, marker stones standing along it with a worn band of
  blue paint near the top, some toppled across the road (the `marker` platforms); wind-carved red rock shelves on stalks
  (`rock`).
- **The Red Rise** (240–245): wagons of some old caravan half buried in the drifts, a wheel up, striped cloth snagged on
  the rail (`wagon`). **The tallest pillar** (`STORM_LAMP_X`): a ledge cut at its top with a pole and a lantern on it, lit
  and turned toward the storm; nobody in Caravanserai says who keeps it lit (Tally can't get that number). Its top is the
  hidden spot (last in `STORM_PLATFORMS`). **The old well** (`DRYWELL_GATE_X`): a ring of red dressed stone with a
  windlass frame and no rope, its mouth under an iron grating chained down and padlocked, the caravan's tally-mark
  scratched on the lock (kind `drywell`, "chained shut": the Dry Wells' gate, A5; the caravan's rule, made by the mothers
  before Mother Dune: nobody goes down, because the seven who went down to dig it deeper when it failed never came up).
- **The Wall's Foot** (245–250): the last of the marker stones, and the Red Wall standing across the road from the sand to
  the sky, churning, shapes going round deep in it (a tent, a pack-beast). **Its den** opens at `RED_DEN_X`: a parting in
  the churn where the road goes in, the last marker stones going in after it, sand pulling in toward it along the ground.
- **Far off south on the horizon** a hill walks by with a town on its back, four slow legs and a head out ahead looking east,
  dust under it: Old Carapace, out of reach (`drawWalker`, drawing only; where he is goes with the hour, like
  `drawDuneSky`'s walker; never named). A5 brings him.
- **The squalls** (a room hazard, `SQUALLS`, `squallAt`; the Skydocks' gusts' pattern): on each of the rises the wind gets
  up (`SQUALL_WARN`: sand streams off the crest, the lane darkens), blows (`SQUALL_BLOW`: it hurts whoever stands on the
  floor there, `SQUALL_DOT` of max HP every `PATCH_HIT_EVERY` ticks, a flat `dot`) and drops, on its own offset in a
  `SQUALL_CYCLE`. Both sides read the server tick, nothing goes over the wire, no `step()` change. Get up on a stone or a
  wagon, or jump it.
- **Freed** (per character, `docs/social/story.md`): for a slime who has freed the Red Wall the far end lies clear, the red
  thinned to a little haze, the caravan it held lying out on the sand in the sun (tents flat, packs, a pack-saddle, a
  lamp), and the tallest pillar's lantern out, a blue bead tied to its pole (`drawStormRoad`'s `freed`). Caravanserai's
  four know (`FREED.red_wall`).

## Its mobs (on the frozen curve: `docs/economy.md`)
- **Sand jackals** (237): the storm's dogs, lean and red-gold, ears laid flat as they run, a brush of a tail up when
  they're after you (plain chasers, quick).
- **Storm riders** (240): hooded shapes of red dust on ragged wings of old caravan cloth, two ember points under the hood,
  riding the gusts and stooping (`dive`). The Red Wall's minion.
- **Sand golems** (244): the road's old marker cairns, red stone and packed sand, got up on two stumps and walking the
  road still, the light coming through the holes the wind wore in the face stone; they rear and come down (`stomp`); the
  rare **Sandstone Mask** (Lv 244).
- **Red wisps** (248): a spark of the storm's own lightning caught in a knot of dust, crackling brighter as it aims, that
  throws a red bolt along the ground (`beam`, style `redbolt`).
- No elites (the Dry Wells, A5, have those).

## The Sirocco (field boss, Lv 245)
A great dust devil as tall as a tower, red sand going round an eye of still hot air with two dark hollows in it, a few lost
things caught up in it going round (a pack, a lantern, a scrap of tent stripe), walking the Wall's Foot (spawn strip there).
Passive until hit.
- **Moves**: it falls apart into dust and spins up again beside you (`blink`).
- **Challenges** (T3, `chf`): **the controls swap** from the start (it turns you round in its wind), and from its second
  third **thin gaps** (a wall of blown sand comes along the road with one gap where the wind parts, `looks.gaps:
  'sandwall'`, over its own stretch only, like every field boss's); the punish window like every field boss's.
- **Party** (S5.4): with two or more on it its wind gathers and breaks over the whole stretch (**pulse**, "GUST",
  `looks.pulse: 'gust'`) and it picks one slime to chase (**focus**).
- **Rewards**: the **Dust-Devil Scimitar** and its twins the **Whirling Rod** and the **Sirocco Bow** (Lv 247), the
  **Sirocco Wrap**, Dust-Devil Grit, Red Sandstone, coins, scrolls; the **mini Sirocco** at the Pet Shop.

## The Red Wall (den 108, the Storm's Eye, Lv 248: Amberdune's party den)
The plan's party den: a sandstorm that swallowed a caravan an age ago and has held it inside ever since, the pack-beasts and
the tents and the people's things going round and round in it. **Holding on: the caravan it took.** It isn't cruel: it
thinks it's keeping them safe (the wells went dry, the sun came down, and it kept them).
- **The den, the Storm's Eye**: the calm in the middle of the storm, a well of hot red air with a dull sun straight
  overhead, the storm's wall going round all about from the sand to the sky, rolls of red with the caravan in them (tents,
  packs, lanterns still lit, pack-beasts with their packs on, scraps of striped cloth), the old road's paving under the
  drifts. The ledges are wagon beds the storm set down across pairs of marker stones; the name is on a caravan's painted
  board on a pole driven into the sand, a striped rag tied to it.
- **Its look**: a towering column of red sand, narrow at the foot and wide at the shoulders, bands of sand going round it,
  two dark hollows for eyes and a long dark mouth high up, two arms of streaming sand; the caravan going round it, in
  front on one half of the turn and behind on the other; **the shard in its heart**, a hot glow round it (the weak point,
  in front: `weak.front`, in reach with a jump). On a warning it draws itself up and in, spinning faster, the arms up, the
  mouth wide; charging, it leans in and the dust streams back.
- **The fight** (`bossBrain`, three phases): slams, charges, rain, then storm riders (summon), then barrages and leaps.
- **Challenges from day one** (`ch`, `docs/combat/challenges.md`): **thin gaps** every phase (a wall of blown sand with one
  gap, `gaps`, `looks.gaps: 'sandwall'`); from phase 2 **the dark** (the storm closes over the sun, `dark`) and, with a
  party, **tethers** (the caravan's lead-rope, `tether`); in phase 3 **the controls swap** (turned round in the wind,
  `reverse`). The punish window, as in every den.
- **Party mechanics** (`partyDen`, `partyLive`, `top`): focus, **armour** (the sand packs hard round it into red stone, the
  wind glowing through the seams, `looks.shell: 'sandstone'`), **pulse** (its wind breaking over the den, "GUST",
  `looks.pulse: 'gust'`), the weak point, adds (storm riders) and interrupt (freeze The Wall Comes On as it gathers).
- **Its ultimate, The Wall Comes On**: the shared `wave` ult drawn as the storm's front rolling the length of the den, the
  caravan's things going over in it (`STORM_ULT` through `ULT_LOOKS`). Jump it or get up on a ledge.
- **Its lines** (`lines`): on entering, "Come in. Come in out of the sun. We are all here. Everyone is here, going round."; at
  phase 2, "Round and round. No one gets lost if no one gets out."; at phase 3, "I KEPT THEM! The wells went dry and the sun
  came down and I KEPT THEM, every one! I KEEP THEM STILL!"; freed, "...They were so tired. Round and round, all this time,
  and so tired. ...Lie down, then. Lie down in the sun. I will be quiet now."
- **Freed** (the den's bossDie, `drawStormFreed`, `STORM_FREED_S`): the red thins to a blue sky, the wind drops, and the
  caravan's things come down out of the air, slower and slower, onto the sand; the den stays like that (blue sky, the
  dunes still, the things lying where they fell) until it's back.
- **Rewards** (`docs/combat/items.md`, `docs/economy.md`): **The Long Wind** and its twins the **Whirlwind Staff** and the
  **Storm-Caught Bow**, the **Storm Veil** (Lv 250, 10 slots, `BOSS_GEAR.top`), Storm-Caught Beads, coins, royal sap,
  scrolls; the **mini Red Wall** at the Pet Shop. As a `top` boss its gear carries effects:
  - **Driven Sand** (the weapons): moving or in the air, hits × `DRIVEN_DMG`; standing still `DRIVEN_STILL_S` or more,
    × `DRIVEN_STILL` (the client's own `Gear.stillSince`, Rooted's opposite). Cost: the standing-still cut.
  - **Tailwind** (the veil): Typhon's mask's quicker walk (`GX.FAST20`) without its trail. Cost: DEF × `TAIL_DEF`.

## Decisions and history
- 2026-11-20: built at the owner's "continue with next two phases" (A4 and A5; every plan default). **Not played by anyone
  yet**; checked by a build, the sheet and reading the code.
- Liberal decisions: a fourth mob (the sand jackal) so the band has its own chaser; the Sirocco at Lv 245 (the Wall's Foot)
  with a `blink` brain; the Red Wall at Lv 248 under Old Carapace's 250, its challenges (the plan named none: gaps, the
  dark, tethers, the swap) and the weak point in front; the squalls as the plan's "wind on every rise"; the find (the lit
  lantern on the tallest pillar); who made the dry well's rule and why (Mother Dune's and Tally's personas).
- The well's gate is A5's: when the Dry Wells ship, `drawDryWell`'s `open` look (the chain cut, the grating back, a rope
  ladder down) is already written and `OPEN.drywell` registered.
