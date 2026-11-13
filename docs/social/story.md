# Story progress: lore tiers and who tells you what

Atlas Phase 7, "story progress" (`story/world/atlas.md`; plan `story/phase7-plan.md`, approved by the owner 2026-11-04
with every default; the rules in `story/delivery.md`). The story never blocks hanging out: there's no quest log and
nothing to read. Characters just know more for you once you've been out and earned it.

Files: the boss → tier table and helpers in `src/shared/story.js` (`BOSS_TIER`, `tierOf`, `cleanStory`), the record in
`server/rpg.js` (`story` on each character, `STORY_TOAST`), the canon slices and the prompt section in `server/lore.js`
(`CANON`, `loreFor`), the plumbing in `server/npc.js` (`reply`'s `tier`, a character's `lore` cap) and
`server/index.js` (the asking slime's `tierOf`), the caps in `server/characters.js`.

## Your story record
- Each character saves `story`: every den boss it has ever been counted in the fight of when it died (the same
  `hitters` the EXP and loot use, so healers count), with the time of the first kill. **Never reset**: rebirth, a class
  change and the rollback leave it alone (unlike `bossAt`, which only remembers the reward window).
- **The lore tier** (`tierOf`): the highest tier among your bosses in `BOSS_TIER`, and every tier under it comes with it.
  Tier 1: any Greenhollow den boss · 2: any Frostpeak one · 3: any Emberdeep one · 4: the Colossus, Chronos or (since the
  Citadel's C1 and C2) Meridian or the Indexer. Field
  bosses don't count. **A new den boss needs its `BOSS_TIER` row** or it gives nothing.
- **Backfill (owner, 2026-11-04: "from now on")**: a character saved before Phase 7 starts from the bosses still in its
  reward window (`bossAt`); nothing older is known. At launch that was nobody: everyone started at Tier 0.
- When a first kill opens a new tier you get one toast, a few seconds after the kill's own: `STORY_TOAST` ("Something
  has changed. Elder Mochi might have more to tell you now."). No page, no log.

## Characters fed by tier
- The canon is read from `story/canon.md` itself at start-up (its `## Tier N` sections and "Deliberately open"), so the
  bible and the game can't drift apart: **editing canon.md changes what characters say** (owner's okay needed, as the
  file says). The server warns at start-up if a tier section is missing.
- A character with a `lore` cap gets, for the slime it's answering, canon Tier 1 up to `min(that slime's tier, cap)`
  (`loreFor`), told to share it freely in its own voice, a little at a time, as things the slime found out, and to
  deflect anything deeper without hinting; plus the open questions, which nobody may answer. At tier 0 it's told the
  slime knows nothing of the old story yet.
- Caps so far: **the Last Echo 4** (the Citadel's C1, `loreKnows`: it was there; it never names itself or the other Keepers),
  **Folio 4** (the Citadel's C2, no `loreKnows`: it catalogued the records and never read them)
  and **Elder Mochi 4** (he knows it all and never volunteers it; at Tier 4 his persona lets him say he was
  Pell's apprentice and the tree is a cutting of the Heartroot) and **Curator Clio 4** (the slimes' own past is a
  separate subject from the museum's wings; she states only what the visitor has found). Every other character has no
  cap yet (their personas hold Tier 0 plus their trade, as before): Phase 7 (c) gives them island caps.
- **Island caps (Phase 7 (c))**: Greenhollow's people 1 (Bun, Truffle, Acorn, Moss, Auntie Clover), Frostpeak's 2
  (Skaldi, Runa, Tove, Eyvind, Hakon, and the two skippers, Brine and Arne), Emberdeep's 3 (Ash, Soot, Slag, Liv,
  Ochre, Pitch, and Tamp up at the camp). Kestrel, Ione and the Dockwarden have none (Tier 0 only: the sky and the
  Citadel aren't theirs to explain). These have only *heard* the story (`loreKnows` unset): `loreFor` lets them talk
  over what the slime found out in their own life's terms, overriding their "don't know" lists for exactly those lines
  and adding nothing. Mochi and Clio have `loreKnows`: they confirm and deepen. Tamp's "never name a wheel" gives way
  once the slime has found it out.
- Chat is public and each reply is for the one slime who asked, so a bystander can overhear more than they've earned
  (owner's default: fine, it's how rumours spread).

## Boss lines (Phase 7 (c))
Every den boss now speaks (`docs/combat/bosses.md`): the seven without `lines` got them (the plan's six plus the Frost
Queen, who had only her dome line). Their freed lines carry their tier softly: the Behemoth names the Keepers, Mother
Mushroom hears the other islands, the Frost Queen and the Astral Wyrm the one land breaking, the Colossus "protect the
Keeper", Chronos the little one who swept the leaves under a tree (never Pell's name: Mochi's to tell).

## The freed world changes (Phase 7 (d))
Once **you** have beaten one of four den bosses, its place is drawn changed for you alone (owner's default: per player;
other slimes see their own world). The client gets your record's bosses as `me.freed` and `src/main.js` passes a
`freed` flag to the room's draw. Drawing only: no platforms, mobs or sim change (but the Wickmother's front door, below).
- **The Tidemother** → Saltspray Coves' Tide Pools (`drawPool` in `src/coves.js`): stale before (green water, scum,
  driftwood and weed, drooping anemones), clear after (the tide washing in, waving anemones, a little fish).
- **The Knotmole** → the Mycelium Deep's threads (`drawThreads` in `src/deep.js`): her knots untied (a slack kink left)
  and the glow running west in full the whole way, not just a trickle past the Knotted Halls.
- **The Old Narwhal** → the Whale Skerries' sea (`drawSky`, `drawSeaFloes` in `src/skerries.js`): the pack across the
  outer sound broken into loose pieces, the near floes fewer and drifting west out to sea, fish leaping.
- **The Root Warden** → Keeper's Spine's Crest (`drawCrestRoots`, `drawWallTop` in `src/spine.js`): the roots off the
  walls and sunk back into the turf as low humps with moss and heather.
- The characters who live by each place (`FREED` in `server/lore.js`: Moss; Truffle; Hakon, Skaldi, Runa and Tove;
  Acorn) get a line for a slime who has freed it (`freedFor`), so they don't describe it as stuck to the one who
  freed it. Their personas still describe the old state for everyone else: keep both in step.
- **The Wickmother** (L5 (c), `docs/places/wickmother.md`; in `BOSS_TIER` at 0: the Fen adds no canon tier, she's in the
  record for her changes only, so the story checks are `k in BOSS_TIER`, not truthy) → Wickmere's Lamp Walk burns low
  (`drawWickmere`'s `freed`: a third of its lanterns out, their tags gone, Wren's husband's always among them), and the
  Hall of Lamps' front door at the Causeway's end opens: a gate with `freed` drawn open, and a door with `freed` through
  it, the one freed change that isn't drawing only (its slime state flag `fw`: `docs/netcode.md`). Wren, Hob, Sedge and
  Netta know (`FREED.wickmother`).
- **Meridian** (the Citadel's C1, `docs/places/orrery.md`) → the Orrery's dome (`drawOrrery`'s `freed`): the stars sit where
  they are now with no lines dragging them back, the orrery's arms hang still. The Last Echo knows (`FREED.meridian`).
- **The Indexer** (the Citadel's C2, `docs/places/archive.md`) → the Archive (`drawArchive`'s `freed`): no pages drift up;
  they lie still on the floor. Folio knows (`FREED.indexer`).
- Later, if wanted (plan): Ladon, Fenrir (the cutters finish the Long Stair), Typhon (the Foundry's pits go cold). The
  one world-wide flag stays for the finale (`story/delivery.md`).
