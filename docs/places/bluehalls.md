# The Blue Halls (room 41, `BLUEHALLS`): Lv 80–90, a hard pocket, the Hall Troll

Frostpeak's depth pass, phase F3, shipped with the Aurora Heights (`docs/places/heights.md`): ice caves inside
the Rimeglass Glacier, under the Crevasse Field. The way in is the crevasse at `BLUEHALLS_GATE_X` in the
Glacier, drawn open by `src/branch-gates.js` (`OPEN.crevasse`: a new ladder of pale pine pegged to the lip, a
lantern on a pole, a coil of rope; red-trimmed sign). You come in at the WEST end (`BLUEHALLS_EXIT_X`), at the
ladder's foot, and go east, deeper.

- Data: `BLUEHALLS_ZONES`, `BLUEHALLS_PLATFORMS` and the spawns in `src/shared/rpg.js`; `STAGES[BLUEHALLS]`
  has `hard: true` (danger look on its door, red level chips). Art: `src/bluehalls.js` (the room) and
  `src/bluehalls-art.js` (mobs, gear, icons).
- Deep blue: walls of old glacier ice with its layers, stones and strings of bubbles frozen in, thin blades of
  daylight down through roof cracks, columns where icicles met the floor. It darkens toward the east.
- West to east: **the Ladder Foot** (no mobs: the new ladder up into a slit of daylight, the old smashed one
  heaped beside it, a lantern, a sledge runner and an ice saw), **the Blue Halls** (a frozen waterfall,
  columns) and **the Deep Blue**, where the Hall Troll's walls of cut blocks stand about for no reason.
- **The Cutters' Niche**, the hidden spot (last in `BLUEHALLS_PLATFORMS`, high in the first hall): an old pick
  frozen into the wall (Eyvind's grandfather's) with generations of cutters' names scratched round it. Eyvind
  only hints.
- No waystone (hard pockets have none), no character.

## FB2 (b): the way down (`docs/places/oldice.md`)
- **The fallen wall:** the troll's last wall at the Deep Blue's east end has fallen over (the update did it, no
  quest; `walls` in `src/bluehalls.js` leaves it out), and behind it is the way down to the Old Ice at
  `OLDICE_GATE_X`, the cutters' old ladder in a slot in the ice (`OPEN.fallenwall`, red-trimmed sign).
- **The cutters' record**, the second find after the Niche: a patch of the wall west of the way down scraped smooth
  (`RECORD_X`, clear of the shelves: it first sat behind one), a tally of days cut in fives, then three lines: "We
  heard it breathe. We heard the chain. We stopped." Eyvind's grandfather's crew; nothing in the game says so, and
  Eyvind only hints.
- **Thin ice** (the Blue Halls' room hazard, like the Thornheart's thorn patches): pale glassy patches over dark
  water in the floor (`THIN_ICE`). Stand on one and it cracks; after `THIN_ICE_HOLD` ticks it gives and hurts,
  `THIN_ICE_DOT` of max HP every `PATCH_HIT_EVERY` ticks as a flat 'dot' (no knockback: no `step()` change), until you
  step off, onto a ledge or jump. The server counts each slime's time on the ice (`q.thinIce`); the client draws the
  cracks from the slimes it sees (`onFloor` in `src/main.js`), so nothing goes over the wire.

## Mobs (on the frozen curve; elites only here)
- icicle bat = `dive` (`fly` 60) · ice worm = `blink` (tunnels; drawn as a ripple of ice chips while gone) ·
  glass beetle = `shell` (wing cases of clear ice worn forward) · prism crawler = `beam`, `style: 'prism'`
  (blue light along the floor: jump it).
- Elites (`elite()`): `worm_elite` (Great Ice Worm), `beetle_elite` (Old Glass Beetle).
- Gear: the Glass Beetle Helm (glass beetles), the Prism Blade / Prism Staff (prism crawlers).

## The Hall Troll (field boss, Lv 88)
A small boss, no story: a great blue-grey troll out of the cutters' stories, mossy and rimed, who cuts blocks of
ice and stacks walls nobody needs. Passive until hit, then `lob`, `style: 'ice'` (throws blocks, keeps its
distance). Drops the Hall Troll's Maul / Troll-Ice Staff, the Troll-Ice Helm and its teeth. Its pet is in the
Pet Shop (`PETS`; `PETSHOP_W` went up to fit both F3 pets). S5.4: with two or more fighting it, `armour` (blocks
of ice stacked round it, `looks.shell: 'block'`) and `focus` (it throws at one slime at a time):
`docs/combat/bosses.md`.

## Decisions and history
- 2026-10-23: built in F3. The plan's "elites" plus a field boss (like the G4 pockets); the names (the Ladder
  Foot, the Deep Blue, the Cutters' Niche, the Hall Troll) are new. Music `bluehalls` (`docs/ui/audio.md`).
