# The Drained Tubes (room 58, `TUBES`): Lv 115–125, a hard pocket, Hundredfoot, the Skylight

Emberdeep's depth pass, phase E2's third piece (`story/world/emberdeep-depth.md`, "The Drained Tubes"): old lava
tubes, long cold, running down into the Smoking Coast's old sea cliff (`docs/places/coast.md`). The way in is the old
tube mouth at `TUBES_GATE_X` in the Coast's Lava Front. Until this piece it was a gate (`tubemouth`: steam roaring
out, the sea got in below and was boiling off); the update itself lifted it, no quest (owner's rule): the tube has
drained, hence the name. `OPEN.tubemouth` in `src/branch-gates.js` draws `drawTubeMouth`'s `open` look (old steps
going down into the dark, glassy walls, a drip; red-trimmed sign). The `tubes` node in `EMBERDEEP`
(`src/shared/branches.js`) has `rooms` and an `entry`; the door is in `ROOMS[COAST]`.
**You come in at the EAST end** (`TUBES_EXIT_X`, the foot of the old steps) and go west, deeper and darker
(`TUBES_ZONES` run hard → easy by x like the Coast's; each zone's sign stands at its east edge).

- Data: `TUBES_ZONES`, `TUBES_PLATFORMS` and the spawns in `src/shared/rpg.js`; `STAGES[TUBES]` has `hard: true`;
  the room and its door in `src/shared/sim.js`. Art: `src/tubes.js` (the room, `drawTubes`) and `src/tubes-art.js`
  (mobs, gear, icons; the staves and bows are rows in `src/staff-art.js` and `src/bow-art.js`).
- The look: black basalt walls with the flow's old tide-lines in them and a skin of glass that glints, holes in the
  roof letting down thin blades of daylight, roof drips (a few still glowing), fallen roof blocks, a ropy flow floor.
  Darker to the west. Never ice, fur, shell or leaf (Emberdeep's register).
- East to west: **the Tube Mouth** (no mobs: the old steps up into daylight with an iron hand-chain, the last puddles
  of the sea that got in, a white salt tide-line on the wall), **the Glass Galleries** and **the Deep Tube**, with a
  long burnt stripe down its floor where Hundredfoot runs.
- **The Skylight**, the find (last in `TUBES_PLATFORMS`, `skylight`): a ledge high under the biggest hole in the
  roof, over the Deep Tube, reached from the ledge under it. Through the hole the island's thermal column stands
  pale against a hot white sky (drawing only; the balloon there is atlas Phase 6's), and a warm flat stone is wedged
  there to sit on. Liv has only been as far as the first skylight and would like to hear what you saw.
- No waystone (hard pockets have none), no character, no keeper stone.

## Mobs (on the frozen curve; elites only here)
- clinker beetle = `shell` (a lump of rough clinker worn forward, its soft hind end glowing: go round; Lv 116) ·
  tube adder = `blink` (into a crack in the wall, drawn as a red glint while gone; Lv 118) · lava drip = rooted `lob`
  (`speed: 0`, `anchored`, `keep: 0`, like the pitcher plant: a set drop of lava with a molten heart, spitting the
  default ember shot; Lv 121; one sits on the ledge under the Skylight) · cinder moth = `phase` (`fly` 40; Lv 124).
- Elites (`elite()`): `adder_elite` (Great Tube Adder, the Galleries), `clinker_elite` (Old Clinker Beetle, the Deep Tube).
- Voices borrowed (`MOB_HURT` / `MOB_DEATH`).

## Hundredfoot (field boss, Lv 125)
A small boss, no story: a tube centipede as long as a cart, plated in clinker, its legs red at the joints, two long
feelers sweeping ahead. Passive until hit, then `trail` with no `style` (burning lava puddles, the magma slug's) as it
runs the Deep Tube. S5.4: `armour` (Ignis's basalt plates, `looks.shell: 'cinder'`) and `pulse` (the heat building
round it, `looks.pulse: 'heat'`), from two fighters. Drops the Hundredfoot Saw / Staff / Bow, the Hundredfoot Helm,
its plates and clinker scutes. Its pet, the mini Hundredfoot, is in the Pet Shop (`PETS`, between Fenrir's and
Greyback's by level; `PETSHOP_W` went up to fit it).

## Gear (`docs/combat/items.md`)
Mob drops at their mob's level: the Clinker Helm (clinker beetles), Adderglass / Adderglass Staff / Adderglass Bow
(tube adders). Hundredfoot (Lv 127, a step over): the Hundredfoot Saw / Staff / Bow, the Hundredfoot Helm. Materials
from every mob (clinker scute, tube adder scale, drip glass, cinder moth dust) and Hundredfoot Plate.

## Personas that changed with it
Liv (the tube drained, as she said it would; she went as far as the first skylight; hints at the Skylight) and Ash
(the Tubes off his shut-ways list, a line on what's down there).

## Decisions and history
- 2026-10-28: built as E2's third piece. Liberal decisions: east entry (continuing the Coast's westward walk), the
  zone names (the Tube Mouth, the Glass Galleries, the Deep Tube), the Skylight's warm sitting stone, Hundredfoot's
  `armour` + `pulse`, the lava drip's default ember shot (no new `style`), the music scene `tubes` (`docs/ui/audio.md`),
  the iron hand-chain on the steps and the salt tide-line (where the boiling sea stood).
- Not playtested (owner's rule: no headless bot tests): checked by a build, the economy sheet and reading the code.
  The sheet solos Hundredfoot in a median ~4:20 at Lv 125.
