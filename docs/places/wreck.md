# Wreck Cave (room 32, `WRECK`): Lv 30–40, a hard pocket

Island depth G4 (`story/world/island-depth.md`). A sea cave behind the mouth at Saltspray Coves' far west
end (`WRECK_GATE_X` in the Coves), with an old apple ship wrecked inside. The mouth was flooded to the roof
until G4; now the water is down to a shallow pool with an old timber laid across it as a plank (`OPEN.flooded`
in `src/branch-gates.js`). Like the Coves, **you come in at the EAST end** (`WRECK_EXIT_X`) and go west,
deeper and harder, so `WRECK_ZONES` run hard → easy by x. Don't "fix" this.

- Data: `WRECK_ZONES`, `WRECK_PLATFORMS` and the spawns in `src/shared/rpg.js`; the room in `src/shared/sim.js`.
  Art: `src/wreck.js` (the room), `src/wreck-art.js` (mobs, the Drowned Bosun, gear, icons).
- East to west: the Cave Mouth (no mobs; daylight and the sea behind you), the Drowned Gallery (rock ledges,
  drowned cargo, old ship's lamps still glowing on pegs, shafts of daylight through the roof) and the Wreck:
  the **Brave Pippin**, broken-backed on the sand, bow west, masts snapped. Her foredeck and aft deck, the
  stern castle and the foremast's yard are platforms.
- **The crow's nest** on the broken foremast (last in `WRECK_PLATFORMS`) is the off-the-path spot: an apple
  flag, a spyglass and someone's little hoard of golden apples.
- **The ship's log** (`RUIN_STONES` in `src/ruins.js`, shape `log`): a sea chest burst open by the stern, the
  logbook on top. It's the one reading that isn't a Keeper stone, so it sets `wing` and `when` for the card's
  header (`renderStone` in `src/museum.js`). What it says stays Tier 0: the same apple run to Icefang took a
  morning, then till noon, then past dark ("the sea's grown"); then the storm, all hands safe, the ship left
  to the octopus. Captain Brine's persona says the same thing about the crossing; keep them in step.
- A hard pocket: no trader, no waystone (`docs/places/waystones.md`), a red "Lv 30–40" chip on the door,
  red-trimmed signs, elites. Mobs reuse legacy brains: barnacle crab = `shell`, drowned lamp = `phase`
  (fly), moray eel = `beam` with `style: 'jet'` (a water jet along the floor: ground spawns only), bilge rat
  = `blink`. Elites: the Old Barnacle Crab (Gallery) and the Great Moray (the Wreck).
- **The Drowned Bosun** (field boss, Lv 40, small: no story): a great grey-lilac octopus in the bosun's coat
  and knitted cap, a brass whistle on a cord. Roams the Wreck on the `lob` brain (`style: 'ink'`), passive
  until hit. Usual field-boss rules (`docs/combat/stages.md`). His pet is the Mini Drowned Bosun. S5.4: with two
  or more fighting him, the drowned's `curse` (a sea-green ink sigil with bubbles, `looks.curse: 'drowned'`;
  Cleanse, a Cleansing Tonic or standing off fades it: `docs/combat/bosses.md`).
- Gear (drops only, on the frozen curve): the Barnacle Helm and the Moray Fang off the mobs, the Bosun's
  Boathook and Bosun's Cap off the Bosun. Beachcomber Moss's persona (`server/characters.js`) knows the cave
  is open and what's in it. Music scene `wreck` (a slow 3/4 shanty, drips, a creaking hull).
