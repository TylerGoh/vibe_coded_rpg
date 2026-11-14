# The Bell Walks (room 91, `BELLS`): Lv 195–208 and the Great Bell

The Citadel's depth pass, **C4** (`story/citadel-plan.md`; room 13 and its gates: `docs/places/citadel.md`). Up the stair
above the Hour Sanctum (`BELLS_GATE_X`): rain had hung on it since C0, every drop stopped in the air. C4 let it fall
(`frozenrain`'s open look in `src/citadel-gates.js`: the steps wet; the update did it, no quest). At the top are open
galleries round the top of the Chrono Spire. Stone arcades stand open to the sky, the great bells hang in their oak frames
stopped mid-swing, and rain hangs in the air everywhere up here. A slow shimmer runs through the drops now and then, and
nothing else moves. Through the clouds far below you can see the whole archipelago, tiny. Tone: the Citadel's (solemn,
no living people). **The main trail's top; the game's top band so far.**

Files: the room in `src/shared/rpg.js` (`BELLS`, `BELLS_W`, `BELLS_EXIT_X`, `BELLS_WAY_X`, `BELLS_ZONES`,
`BELLS_PLATFORMS`, the `STAGES` row, the three mobs, the Great Bell, their items, spawns), `ROOMS[BELLS]` and its door in
`ROOMS[CITADEL]` (`src/shared/sim.js`), the `bells` node in `CITADEL_MAP` (`src/shared/branches.js`), the waystone
(`src/shared/waystones.js`), the room's drawing in `src/bells.js` (`drawBellWalks`), the mobs, gear and icons in
`src/bells-art.js` (it also holds the Helmsman's gear: `docs/places/helm.md`), the `raindrop` shot in `src/hazards.js`, the
`toll` pulse in `src/party.js`, the `bells` music scene in `src/audio.js`.

## The room
You come in at the WEST end, at the head of the stair. West to east (`BELLS_ZONES`):
- **The Rain Stair** (no mobs): the stair's head, wet, a few drops still running down it. The Bell Walks' waystone is here
  (`BELLS_WAY_X`, `isle: 'citadel'`: it's the main trail, and the stair is a long walk from the Spire's stone).
- **The Lower Gallery** (195–199): bell wraiths and a clapper knight or two, balconies on corbels.
- **The Bell Loft** (199–204): the bells in their frames, clapper knights and wraiths, a rain shard on a balcony.
- **The Crown Walk** (204–208): rain shards and knights. **The Great Bell**'s frame stands empty here (`EMPTY_FRAME_X` in
  `src/bells.js`), its headstock torn, and the bell itself is on the floor (the field boss).
- **The find** (last in `BELLS_PLATFORMS`, `rope`): on the loft's top beam is the end of the bell-ringers' rope, coming
  down from the dark and cut clean a little above the beam. Its striped sally lies on the beam beside it. Nothing says
  so. (The Stopped Hour, shown: someone stopped the change being rung.)
- No room hazard, no trader (the plan's). The hanging rain is drawn only; nothing about it reaches `step()`.

## Its mobs (on the frozen curve past 190, its power-law tail; no elites)
- **Bell wraith** (197): an echo of a bell-ringer, a grey hooded shape with a rope's end in its hands, still going round to
  ring a change that never comes. It fades out and back (`phase`, the star-glass wisp's) and flies low (`fly` 30). HP 94%.
  Material: the Wraith's Chime.
- **Clapper knight** (202): the aether knights' heavier kin, cast in bell bronze gone green at the seams, a bell's clapper on
  a chain for a mace. It blinks to you and strikes (`blink`). HP 95%. Material: the Clapper Plate. Rare: the **Clapper
  Helm** (`helmetPrice` at 202).
- **Rain shard** (206): where the stopped rain has grown together on a balcony, a cluster of clear ice spikes rooted to the
  stone, drops hanging round it. It flicks one at you (`lob`, a new `SHOT` style `raindrop`, the pitcher plant's: `speed`
  0, `anchored`). HP 92%. Material: the Stopped Raindrop.
- Voices borrowed (the chrono wraith's, the aether knight's, the wisp's).

## The Great Bell (field boss, Lv 204)
The biggest of the Spire's bells, come down out of its frame onto the Crown Walk: a huge bronze bell green with
verdigris, bands of worn Keeper letters round its waist, the crown's iron straps snapped. It looks out of two sound-holes
on its shoulder, a cold light in each. A small boss with no story (a `desc`). Passive until hit; then it heaves up and
comes down with a toll (`stomp`: the ring along the floor, jump it). T3's (`docs/combat/challenges.md`): from the start
**time stops round it when it tolls** (`late`, the late tells), and from its second third **the toll is a wall of sound
with one gap** (`gaps`). S5.4: with two or more on it, `pulse` (its bronze rings up till it breaks, a new `PULSES` look
`toll`, "TOLL") and `armour` (the Colossus's brass plates, `looks.shell: 'brass'`). It drops the Toll Hammer (twins: the
Toll Staff, the Toll Bow) and the Bell Helm (both Lv 206, `BOSS_GEAR.field`), Bell Bronze and Wraith's Chimes. Its pet,
the mini Great Bell, sits between the mini Helmsman and the mini Wickmother (`PETS`).

## Decisions and history
- 2026-11-14: built at the owner's "continue with next phase" (every plan default). **Not played by anyone yet.** Checked
  by a build, the economy sheet, every new draw function run against a stub canvas in Node, and the room, den and bosses
  drawn to a screenshot from a static page (no game server). There was no headless bot test (owner's rule).
- The band follows C0's stretch (195–208, not the plan's 188–198), so the Great Bell is Lv 204, not ~196.
- The plan's "stops time in a ring" is the late tells (`late`); "rings to jump" is its `stomp`; the wall of sound
  (`gaps`) was added for its second third.
- A waystone, though the plan names only the Bastion's and the Spire's (as with the Archive and the Engine Halls).
- The Last Echo heard the rain fall and knows the walks; the Commissary logs the wet stair and a bell.
