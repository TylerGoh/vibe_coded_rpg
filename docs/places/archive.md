# The Archive (room 88, `ARCHIVE`): Lv 165–178, the Indexer and Folio

The Citadel's depth pass, **C2** (`story/citadel-plan.md`; room 13 and its gates: `docs/places/citadel.md`). Down the stair
off Cogwork Bastion (`ARCHIVE_GATE_X`): the iron shutter that was down over it since C0 has gone up, its stamp taken off
(`shutter`'s open look in `src/citadel-gates.js`; the update did it, no quest). The Keepers' records: shelving out of sight
in every direction, tall stacks of bound volumes rising into a dark with no roof to be seen, rolling ladders, reading
galleries on brass brackets, and **loose pages drifting upward** out of the stacks all the time (time is wrong here too).
Tone: the Citadel's (solemn, no living people; a machine still doing its last job).

Files: the room in `src/shared/rpg.js` (`ARCHIVE`, `ARCHIVE_W`, `ARCHIVE_EXIT_X`, `ARCHIVE_WAY_X`, `FOLIO_X`, `ARCHIVE_ZONES`,
`ARCHIVE_PLATFORMS`, the `STAGES` row, the four mobs, the Indexer, their items, spawns, the `DENS` row: `INDEXER_DEN`,
`INDEXER_DEN_X`, `SHOPS.folio`), `ROOMS[ARCHIVE]` and its door in `ROOMS[CITADEL]` and Folio's `NPCS` row
(`src/shared/sim.js`), the node in `CITADEL_MAP` (`src/shared/branches.js`), the waystone (`src/shared/waystones.js`), the
room's drawing in `src/archive.js` (`drawArchive`, its own dark), the mobs, gear, icons and Folio's look in
`src/archive-art.js`, the Indexer and the den in `src/dens-archive.js`, the `archive` and `indexer` music scenes in
`src/audio.js`, Folio's persona in `server/characters.js`.

## The room
You come in at the WEST end, at the foot of the stair. West to east (`ARCHIVE_ZONES`):
- **The Reading Room** (no mobs): the Archive's waystone (`ARCHIVE_WAY_X`, `isle: 'citadel'`: the stair is a long walk from
  the Bastion's stone, so unlike the Gardens and the Orrery it has one of its own), reading tables under green-shaded
  lamps, and **Folio** at the issue desk (`FOLIO_X`, a sign over it: ISSUES · RETURNS).
- **The Stacks** (165–169): free-standing bookcases (`stack`) and a reading gallery (`gallery`); page swarms and ink slimes.
- **The Long Shelves** (169–173): more stacks and a gallery; ink slimes, binder automata, a page swarm.
- **The Index Hall** (173–178): the great card catalogue on the back wall, drawer over drawer up into the dark, a rolling
  ladder on its rail, a cabinet (`cabinet`) and a gallery to stand on; binders and index moths; **the way down to the
  Indexer** at its east end (`INDEXER_DEN_X`: a narrow stair between two of the catalogue's cabinets, an empty label frame
  over it, pages drifting up out of it: `ENTRANCE_ART.archive`).
- **The find** (last in `ARCHIVE_PLATFORMS`, `ledger`): on top of the tallest stack, standing on the Stacks' gallery, a heavy
  ledger open on a brass stand: a column of names in a neat hand, every one struck through hard but one, which reads
  **Pell**. Nothing says so. (Tier 4, shown; the other names stay unreadable: canon's "deliberately open" who the other
  Keepers were.) Folio hints that someone "went through it very thoroughly with a pen".
- **Freed** (per slime, Phase 7 (d)'s rule: `drawArchive`'s `freed`, from your story record): once **you** have beaten the
  Indexer no pages drift up; they lie still on the floor where they came down. Drawing only. Folio knows (`FREED.indexer`).
- Mobile: nothing new to press (doors, the waystone, Folio's Trade button and the den door are the usual prompts).

## Its mobs (on the frozen curve, read off the Fen's at the same levels)
- **Page swarm** (166): a flock of loose pages turning over and over round a knot of them, two ink-blot eyes on the front
  page; a flier (`fly` 34), a plain chaser. The Indexer's minion. Material: Loose Leaf.
- **Ink slime** (169): the Archive's spilt ink gone to slime in the wells, glossy black with a violet sheen and a nib-shaped
  glint; it leaves a stinging trail (`trail`, a new puddle style `ink` in `src/hazards.js`). Material: Archive Ink.
- **Binder automaton** (173): a rebinding press on stubby legs, a screw wheel on top, a great leather-bound board held up in
  front (`shell`, the causeway guard's: get round behind it, where its grille is). HP 120% of the curve like the other shell
  mobs. Material: the Binder Clasp.
- **Index moth** (176): a grey moth whose wings are catalogue cards with tabs, asleep on the top drawers; it drops on you
  (`dive`). Material: the Index Tab.
- Voices borrowed (the wisp's, the magma slug's, the golem's, the cinder bat's). No elites, no field boss (the plan has none
  here).

## The Indexer (den 89, the Last Drawer, Lv 177)
The Archive's cataloguing automaton: a great oak-and-brass card cabinet the size of a house on six short legs, its front all
little drawers sliding in and out as it files, four thin brass arms off its top (a pen, a stamp, a blotter, a pair of
tongs), one reading lens on a telescoping stalk for an eye, and its top drawer standing open in front with the cards up in
it and the shard among them. Holding on: **the record of the last day, kept perfect**. Since the Stopped Hour it has been
filing the same day, and starting again from the morning, and it won't let the drawer close.
- Its moves (`bossBrain`, `phases` in `MOBS.indexer`): charge, slam, rain (bound volumes off the top drawers: `drawFallObj`'s
  `archive`), from phase 2 summon (page swarms), phase 3 leap and barrage (flung cards: the `page` shot, `looks.feathers`).
- **Challenges from day one** (`ch: ['grid', 'snare', 'swap']`, `docs/combat/challenges.md`): the laser grid every phase
  (`lasers`: index lines ruled down off its drawers; it stands for it the first phase), from phase 2 the snare (`snare`: it
  pins one slime under an index card with its catalogue number in red, `looks.snare: 'paper'`, a new `PAL` row in
  `src/challenge.js`), from phase 3 the controls swap (`reverse`: filed back to front). All three work alone. The punish window.
- **Party mechanics** (S5.4, `partyLive`): the shard in its open top drawer flares (`weakpoint`, on its front: `weak.front`,
  a jump from the floor), its binding boards close round it (`armour`, `looks.shell: 'brass'`: heavy hits crack it), and
  freezing **Closing Time** as it gathers cancels it (`interrupt`).
- **Closing Time**: the shared `lanes` ult (drawers slamming shut along the floor, one lane clear in each wave).
- **Lines**: "Quiet, please. The last day is being filed"; at phase 2 a page is always out of order, it will begin again from
  the morning; at phase 3, if it closes the drawer it is over; freed, it files the last page: "Then it happened, and it is
  over. Close the drawer. Gently, please."
- **Freed** (`drawIndexerFreed`, `INDEXER_FREED_S`): the last page comes down out of the air into its open drawer, the drawer
  slides shut, and every page in the air comes down and settles; for a while after (`BOSS_RESPAWN_MS`) the den's great
  drawer stays shut and its pages lie on the floor.
- The den: a tall chamber walled in little drawers up into the dark, a reading lamp on a long chain, a great drawer pulled
  out of the back wall with the cards riffling in it, pages drifting up; its ledges are drawers pulled out of the walls; its
  name on a card in a brass label frame. Theme `archive` (`FXPAL`, `THEME_RGB`, `drawBit`, `drawFallObj` in `src/dens.js`).
- **Story**: in `BOSS_TIER` at 4 (a Citadel den): beating it opens Tier 4.
- Drops (`docs/combat/items.md`): the Indexer's Spike and its twins (the Sentinel Stamp, the Catalogue Bow), the Drawer
  Crown, Last Index Cards; the mini Indexer in the Pet Shop (`PETS`).

## Folio (AI, `folio`; trades)
The Archive's issuing automaton at the Reading Room's desk: a small neat brass slime-shape (`accessory: 'archivist'`,
`drawArchivistDress`: a card drawer in its front, round reading lenses, a green eyeshade, a pen on a thin arm, a stack of
cards it keeps squaring up). Dry, precise and prim, quiet (it shushes), fond of rules and patrons; not in capitals (that's
the Commissary, which it sends requisitions to by pneumatic tube). It opens a reader's card for every slime the first time
(its ordinary per-player memory).
- **Its purpose**: it sells the potions and the archivists' kit (`SHOPS.folio`, aim Lv 172): the Archivist's Rule, the
  Archivist's Pointer, the Archivist's Bow and the Reading Visor. And it's the Archive's guide "in the manner of a catalogue":
  the rooms, the mobs, the Indexer ("my superior"; it hasn't been permitted to file a card since the day stopped, and thinks
  privately the Indexer ought to be allowed to finish), a hint at the ledger.
- **Lore**: `lore: 4` without `loreKnows` (the plan's "Tier 4 at most"): it catalogued everything and **read nothing**, so it
  can only talk over what a slime has already found, "as filed", and knows no names from the ledger.
- Its life: one volume still out on loan from before the day stopped (it works out the fine every morning, to the page, and
  would waive it); a lost-and-found box (a glove, a pressed leaf, spectacles too big for anyone); it shushes the Commissary.
- Plan decision 6 (traders are automata still on duty) stands.

## Decisions and history
- 2026-11-13: built at the owner's "continue with next phase" (every plan default). **Not played by anyone yet**; checked by a
  build, the economy sheet, a start-up of a throwaway server, every new draw function run against a stub canvas in Node,
  and reading the code (owner's rule: no headless bot tests).
- A waystone in the Reading Room, though the plan names only the Bastion's and the Spire's: the stair is ~1,240 px from the
  Bastion's stone (the Orrery's door is 260 from the Spire's).
- The Commissary now says the shutter went up ("THE ARCHIVIST'S STAMP HAS BEEN RECEIVED") and knows of Folio; only the
  Foundry's hatch is left on its shut list.
