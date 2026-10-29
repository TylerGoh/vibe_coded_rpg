# The Old Foundry (room 60, `FOUNDRY`): Lv 130–145, a hard pocket, Old Crucible, the tally board, the Pattern

Emberdeep's depth pass, phase E3's second piece, E3b (`story/world/emberdeep-depth.md`, "The Old Foundry"): where the
forge folk cast the great gear-teeth, a cold hall deep in the mountain at the end of the Ashwood's old mine adit
(`docs/places/ashwood.md`). The way in is the adit at `FOUNDRY_GATE_X`, the Ashwood's far west end. Until E3b it was a
gate (`adit`: bricked up by the forge folk themselves); the update itself lifted it, no quest (owner's rule): **Ash had
the bricks taken down** ("Someone ought to see it. It isn't going to be me."), and they're stacked neatly beside the
mouth with a lamp lit on the old hook. `OPEN.adit` in `src/branch-gates.js` draws `drawAdit`'s `open` look
(`drawAditOpen`: the dark mouth, the rail running in, a far orange glow down it; red-trimmed sign). The `foundry` node in
`EMBERDEEP` (`src/shared/branches.js`) has `rooms` and an `entry`; the door is in `ROOMS[ASHWOOD]`.
**You come in at the EAST end** (`FOUNDRY_EXIT_X`, out of the adit) and go west, deeper and older (`FOUNDRY_ZONES` run
hard → easy by x; each zone's sign stands at its east edge).

- Data: `FOUNDRY_ZONES`, `FOUNDRY_PLATFORMS`, `FOUNDRY_PIT_X`, `FOUNDRY_TALLY_X` and the spawns in `src/shared/rpg.js`;
  `STAGES[FOUNDRY]` has `hard: true`; the room and its door in `src/shared/sim.js`. Art: `src/foundry.js` (the room,
  `drawFoundry`) and `src/foundry-art.js` (mobs, gear, icons; the staves and bows are rows in `src/staff-art.js` and
  `src/bow-art.js`).
- The look: soot-black brick arches along the back wall, iron trusses and the gantry crane's rail overhead with chains
  down (some holding empty ladles), rails along the floor, ore carts left standing (you stand on their tubs), slag
  heaps, stacks of cold moulds with the tooth's print pressed in the top one, small cold pits cut in the floor, soot
  coming down. Emberdeep's harsh industrial register: iron, slag, brick, soot; red only where something is still hot.
- East to west: **the Adit** (no mobs: the mine tunnel, timber props, a lamp on the last prop, daylight from the Ashwood
  far up), **the Rail Yard**, **the Slag Heaps** and **the Casting Floor**, with the biggest casting pit
  (`FOUNDRY_PIT_X`): brick-lined, glowing at the bottom, and standing up out of its mould in it **the half-cast tooth**,
  a great iron gear-tooth whose pour stopped halfway (the iron ends in a ragged line; the rest of its shape is only a
  dashed outline in the sand). Old Crucible lives in that pit and keeps it hot.
- **The tally board** (`RUIN_STONES` in `src/ruins.js`, shape `tally`, at `FOUNDRY_TALLY_X` by the pit): the foreman's
  board, a reading with E like Wreck Cave's logbook (`wing` and `when` set the card's header). Rows of chalk tallies, one
  stroke per tooth sent up the rail, the old smith's mark burnt in at the top (a hammer over a flame: Ignis's mark,
  which nothing names); the last row isn't full, and under it one line, the chalk snapped: **ONE SHORT**. Someone has
  wiped the dust off that last line, recently (left open: Ignis? Ash? nobody says).
- **The Pattern**, the find (last in `FOUNDRY_PLATFORMS`, `pattern`): the pattern loft, a timber platform high over the
  Casting Floor, reached from the crane's end girder under it. On it, the wooden master of the tooth, pale varnished
  pine, every mould in the hall pressed from it, with the same mark burnt into its face; a chisel rack, old shavings.
- Tier 3 stays out: the board and the Pattern show teeth, a rail going up and a mark, never the Tidewheel, the
  Stopped Hour, Chronos or Pell. "One short" pairs with the Landing Stone's half-cut last mark (`docs/places/coast.md`)
  and Ignis's snapped tooth (`story/characters/bosses.md`) without saying so.
- No waystone (hard pockets have none), no character, no keeper stone.

## Mobs (on the frozen curve; elites only here)
- iron ant = `shell` (a bent plate of scrap iron carried in its jaws like a shield: go round; Lv 131) · slag golem =
  `split` into two slaglings (a heap of slag on two legs; Lv 133; the slagling is a split minion, so its EXP and gold
  stay small: the economy sheet doesn't check minions) · crucible newt = `lob` with the new shot `style` `molten` (a
  cheek pouch of molten metal; Lv 136) · soot hound = a plain aggressive chaser (no brain; Lv 139) · bellows toad =
  `beam` with the new beam `style` `bellows` (a low blast of hot air along the floor: jump it; Lv 142; kept on the
  floor, since a beam's `y0`/`y1` are absolute).
- Elites (`elite()`): `golem_elite` (Great Slag Golem, the Rail Yard; it still splits), `hound_elite` (Old Soot Hound,
  the Casting Floor).
- Voices borrowed (`MOB_HURT` / `MOB_DEATH` in `src/audio.js`).

## Old Crucible (field boss, Lv 145)
A small boss, no story (the owner's rule): a fire salamander as long as a cart, black with orange blotches, its back
crusted with cooled slag cracked to show the glow beneath, a wide flat head. Passive until hit, then `lob` with
`style: 'molten'` (it fills its mouth from the pit and lobs metal), modelled on Greyback. S5.4: `armour` (the slag on
its skin sets into a crust, `looks.shell: 'cinder'`) and `curse` (its splashes leave you smouldering,
`looks.curse: 'ember'`), from two fighters. Its line (`desc`): "Old Crucible is awake in the casting pit. Mind the
pour." Drops the Crucible Blade / Staff / Bow, the Crucible Helm, Crucible Scales and newt skins. Its pet, the mini Old
Crucible (its art shrunk), is in the Pet Shop (`PETS`, between the Brimstone Condor's and the Colossus's by level;
`PETSHOP_W` went up to fit it).

## Gear (`docs/combat/items.md`)
Mob drops at their mob's level: the Scrap-Iron Helm (iron ants), Sootfang / Sootfang Staff / Sootfang Bow (soot hounds).
Old Crucible (Lv 147, a step over): the Crucible Blade / Staff / Bow, the Crucible Helm. Materials from every mob
(ant-carried iron, slag lump, crucible newt skin, soot hound pelt, bellows toad hide) and Crucible Scale.

## Personas that changed with it
Ash (he had the bricks taken down; lists what's down there; won't say why it was shut or talk about the tally board)
and Collier Pitch (he helped stack the bricks and hung the lamp; his family's charcoal fed the foundry; he hasn't been
in).

## Decisions and history
- 2026-10-28: built as E3b. Liberal decisions (owner's standing instruction): the block lifted by Ash's own order (the
  bricks stacked, a lamp lit), east entry (continuing the Ashwood's westward climb), the zone names (the Adit, the Rail
  Yard, the Slag Heaps, the Casting Floor), the ore carts as platforms, the tally board as an E reading (so "one short"
  can be read, not just drawn) and the Pattern as the drawn find, the hammer-over-a-flame mark, the wiped last line,
  Old Crucible's `armour` + `curse`, the music scene `foundry` (`docs/ui/audio.md`).
- Not playtested (owner's rule: no headless bot tests): checked by a build, the economy sheet and reading the code.
  The sheet solos Old Crucible in a median ~4:36 at Lv 145.
- E5 (b), 2026-10-29: the way down to Typhon starts here (the next section).

## E5 (b): the way down (`docs/places/underflues.md`)
- **The fallen pit:** the back of the big casting pit has fallen in (the update did it, no quest), and under the
  half-cast tooth a brick flue runs down to the Under-Flues, hot air coming up it (`UNDERFLUES_GATE_X`, at the pit's
  west end; `OPEN.flue` in `src/branch-gates.js`, a red-trimmed sign). The door is in `ROOMS[FOUNDRY]`.
- **The stoker's ledger**, the second find after the Pattern: a reading with E like the tally board (`RUIN_STONES`,
  shape `ledger`, at `FOUNDRY_LEDGER_X`, west of the flue's mouth so the sign and the book don't overlap): the stokers'
  shifts feeding the fire from below, the entries getting shorter, the last one "IT BREATHED BACK. WE CAME UP."
- **Hot grates** (the Foundry's room hazard, like the Thornheart's thorn patches): iron grates in the floor over the
  old flues (`HOT_GRATES`) that warm, vent and cool on a cycle read from the server tick (`grateAt`); a venting one
  hurts whoever stands on the floor over it (`GRATE_DOT`, a flat 'dot', no `step()` change). `drawFoundry` takes the
  tick for them (`net.renderTick()` from `src/main.js`).
- Personas: Ash and Pitch learned of it (`docs/places/underflues.md`).
