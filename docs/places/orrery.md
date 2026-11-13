# The Orrery (room 86, `ORRERY`): Lv 160–170, Meridian and the Last Echo

The Citadel's depth pass, **C1** (`story/citadel-plan.md`; room 13 and its gates: `docs/places/citadel.md`). Through the
round door at the Chrono Spire's foot (`ORRERY_GATE_X`): the combination lock that turned by itself since C0 has stopped,
its three rings lined up (`combolock`'s open look in `src/citadel-gates.js`; the update did it, no quest). The Keepers'
star-hall: a long hall under a cracked glass dome, a great orrery's brass arms sweeping slowly overhead round the crown
with glass planets on them, the floor dark glass set with little stars and inlaid brass circles. Up in the dome **the
stars are being dragged**: each slides back along a faint dashed line toward where it stood before the fall (a warm ring
marks the old place), and slips home again. That is Meridian's doing. Tone: the Citadel's (solemn, no living people).

Files: the room in `src/shared/rpg.js` (`ORRERY`, `ORRERY_W`, `ORRERY_EXIT_X`, `ORRERY_ZONES`, `ORRERY_PLATFORMS`, the `STAGES`
row, the three mobs, Meridian, their items, spawns, the `DENS` row: `MERIDIAN_DEN`, `MERIDIAN_DEN_X`), `ROOMS[ORRERY]` and its
door in `ROOMS[CITADEL]` (`src/shared/sim.js`), the node in `CITADEL_MAP` (`src/shared/branches.js`), the room's drawing in
`src/orrery.js` (`drawOrrery`, its own dome sky), the mobs, gear, icons and the Last Echo's look in `src/orrery-art.js`,
Meridian and the den in `src/dens-orrery.js`, the `orrery` and `meridian` music scenes in `src/audio.js`, the Echo's persona
in `server/characters.js`.

## The room
You come in at the WEST end. No waystone: the Spire's (`SPIRE_WAY_X`) is just outside the door, as the Bastion's is for
the Gardens. West to east (`ORRERY_ZONES`):
- **The Star Door** (no mobs): the round brass door from inside, its lock rings still.
- **The Ring Gallery** (160–163): lens plinths, a brass gallery on brackets, a low orrery arm; armillary rings and wisps.
- **The Glass Floor** (163–166): plinths and arms; wisps, rings and the first astrolabe sentries.
- **The Dome's Heart** (166–170): the great pivot comes down from the crown as a brass column, star-glass floor lamps
  round its foot; sentries and rings; **the way down to Meridian** beside it (`MERIDIAN_DEN_X`: a round hole in the
  glass floor, a spiral stair's rail curling down, starlight coming up, rings turning far below: `ENTRANCE_ART.orrery`).
- **The find** (last in `ORRERY_PLATFORMS`, `chart`): on the gallery's top, a chart table with a star chart pinned flat,
  every star drawn twice: once in brown ink as they were, once in blue as they are, a ruled line between each pair.
  Nothing says so. (Tier 2's fallen stars, shown.)
- **Freed** (per slime, Phase 7 (d)'s rule: `drawOrrery`'s `freed`, from your story record): once **you** have beaten
  Meridian the dome's stars sit where they are now, scattered, no lines; the arms hang still at rest; the pivot's bands
  stop turning and the low arms' planets stop swaying. Drawing only. The Last Echo knows (`FREED.meridian`).

## Its mobs (on the frozen curve, read off the Still Mere's at the same levels)
- **Armillary ring** (161): three nested brass hoops round a clouded glass bead, rolling along the floor the way they
  used to turn the sky. A plain chaser, fast (no `ai`). Material: the Armillary Pin.
- **Star-glass wisp** (164): a cold point of light with a shell of glass shards turning round it, fallen stars' glass got
  up off the floor (`fly` 30, `phase`). Meridian's minion. Material: the Star-Glass Mote.
- **Astrolabe sentry** (168): a sighting machine on a brass tripod, its disc scored with circles, the rete turning over it;
  the alidade swings to you, the rim lights star-white, and it throws a line of starlight along the floor (`beam`, a new
  style `astro` in `src/hazards.js`'s `BEAM`). Material: the Astrolabe Plate.
- Their voices are borrowed (the cogling's, the chrono wraith's, the sentry drone's). No elites, no field boss, no trader
  (the plan has none here; the Commissary is the Citadel's nearest).

## Meridian (den 87, the Armillary, Lv 168)
The orrery's engine: a brass armillary sphere the size of a house on a three-footed stand, the meridian ring upright, the
horizon flat, the ecliptic slanting across with its band of signs, two inner rings turning round a glass heart with the
shard in it, one sighting lens on top for an eye, two little planets riding its outer rings. Holding on: **the old sky**.
It keeps pulling the stars back where they were, and they won't stay.
- Its moves (`bossBrain`, `phases` in `MOBS.meridian`): charge, slam, rain, and from phase 2 summon (star-glass wisps),
  phase 3 leap and barrage (shots in the `star` style: `looks.feathers`).
- **Challenges from day one** (`ch: ['rings', 'rewind']`, `docs/combat/challenges.md`): bullet rings of stars every phase
  (`orbs`, `looks.rings: 'star'`), and from phase 2 **Rewind** (Chronos's: a ghost where everyone stood, then everyone snaps
  back and its attacks of those seconds come again). Both work alone. The punish window, like every den with a `ch` list.
- **Party mechanics** (S5.4, `partyLive`): the shard in its heart flares (`weakpoint`, `weak` at the sphere's middle, a jump
  from the floor; `looks.weak: 'star'`), its rings close in a shell of starlight (`barrier`, `looks.dome: 'star'`, the Astral
  Wyrm's), and freezing **The Old Sky** as it gathers cancels it (`interrupt`).
- **The Old Sky**: the shared `nova` ult (starlight already, the Astral Wyrm's Supernova): run out past its ring.
- **Lines**: it tells you you're out of place and it's putting everything back; at phase 2 "the sky slips"; at phase 3 that
  every ship and every Keeper read it for the hour; freed, "It is a different sky. It is still a sky."
- **Freed** (`drawMeridianFreed`, `MERIDIAN_FREED_S`): its rings slow and stop, and the stars on their wires let go and
  drift out across the roof to where they are now; for a while after (`BOSS_RESPAWN_MS`) the den's wires hang slack.
- The den: a round brass chamber under the crown, gear trains on the walls (still after a freeing), the pivot through the
  roof, stars hung on fine brass wires drawn taut back toward their old places, the old sky drawn in brass on the glass
  floor; its name on a brass plate on two chains. Theme `orrery` (`FXPAL`, `THEME_RGB` in `src/dens.js`).
- **Story**: in `BOSS_TIER` at 4 (a Citadel den, like the Colossus and Chronos): beating it opens Tier 4.
- Drops (`docs/combat/items.md`): Meridian's Arm and its twins (the Orrery Staff, the Ecliptic Bow), the Armillary Crown,
  Orrery Beads; the mini Meridian in the Pet Shop (`PETS`).

## The Last Echo (AI, `echo`)
A Keeper's echo on the Chrono Spire's floor (room 13, `ECHO_X`, between the Orrery's door and the Engine Halls' blast
door), the plan's Tier 4 character (`story/characters/people.md`). Pale, see-through blue-white (`folk: 'echo'`:
`ECHO_PALETTE`, `drawEchoFolk`: fine lines running down it and a faint stopped clock where its heart would be), flickering;
a grey-white Keeper's cowl with a wheel at the throat and a little brass key it keeps turning, now and then an afterimage
a step behind (`accessory: 'keeper'`, `drawKeeperDress`). It lives its last hour over and over: hurrying to the star-hall
because the stars had begun to move, the lock turning, someone up the Spire saying "hold".
- **Its purpose**: the Orrery's guide, in pieces: the room, its machines, Meridian ("it keeps pulling the stars back"),
  a hint at the chart. It remembers the other shut ways as that hour (the engines' steam, the rain on the stair) and won't
  talk about the Sanctum.
- **Lore**: `lore: 4, loreKnows: true` (it was there: it confirms and deepens, as far as the asking slime has earned,
  `docs/social/story.md`). It has lost its own name and never names the other Keepers or where they went (canon's
  "deliberately open"), never says Pell's or Chronos's name first.
- **Lucid moments** (people.md: "briefly lucid when players bring Mochi's name"): if the slime says Mochi's name, or speaks
  of the little one who swept the leaves or the apple tree, it comes clear for a line or two, remembers a small green
  apprentice always late and laughing, asks if he's well and still keeps the tree, and the hour takes it back.
- No shop. Slap quips are what passing through it is like.

## Decisions and history
- 2026-11-13: built at the owner's "continue with next phase" (every plan default). **Not played by anyone yet**; checked by a
  build, the economy sheet, a start-up of a throwaway server and reading the code (owner's rule: no headless bot tests).
- No waystone in the hub (the Spire's is beside the door), no trader, no field boss, no elites: the plan's C1 has none.
- The plan's map hung the Engine Halls off the Orrery; C0 put their blast door in the Spire, so the Orrery is a side branch
  with one way out, as built.
