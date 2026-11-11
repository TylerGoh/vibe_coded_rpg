# The Drowned Grove (room 75, Lv 156–166) and Long-Neck's den (room 76, the Stone Nest)

Atlas Phase 8, L1 (`story/phase8-plan.md`; the town is `docs/places/fen.md`, the room before it `docs/places/shallows.md`).
Lantern Fen's main trail on east from the Shallows' far end: a willow wood the mere came up into long ago, grey trunks
standing in black water, roots arched up out of it like ribs, fronds hanging to the surface, the light green and dim.
At its east end, the Heronry, where Long-Neck stands on her nest of stones.

Files: the room in `src/shared/rpg.js` (`GROVE`, `GROVE_W`, `GROVE_EXIT_X`, `GROVE_WAY_X`, `GROVE_STONE_X`,
`BARROWS_GATE_X`, `HERON_DEN_X`, `HERON_DEN`, `CAUSEWAY_GATE_X`, `GROVE_ZONES`, `GROVE_PLATFORMS`, the `STAGES` row, the
four mobs, Long-Neck, their materials and gear, the spawns, the `DENS` row), `ROOMS[GROVE]` and its door in
`ROOMS[SHALLOWS]` (`src/shared/sim.js`; the den door comes through `denDoors(GROVE)`), the room's drawing in `src/grove.js`
(`drawGrove`, and `drawGroveFront`: fronds hanging in front of the slimes, under the name tags), the creatures, materials
and gear in `src/grove-art.js` (`GROVE_MOB_ART`, `GROVE_ICONS`, `GROVE_SWORDS`, `GROVE_HELMETS`; the staff in
`src/staff-art.js`, the bow in `src/bow-art.js`), the den, its way in, Long-Neck and her freeing in `src/dens-heron.js`
(theme `heron`, registered in `src/dens.js`), the Sunk Stone in `src/ruins.js`, the gates' art in `src/branch-gates.js`
(`drawFloodwaterOpen`, `drawBarrowMouth`, `drawSunkCauseway`), the waystone in `src/shared/waystones.js`, her grey
feathers (`heronfeather` in `src/hazards.js`, `looks.feathers`) and the mire flood (`FLOOD_LOOK.mire` in
`src/challenge.js`), the `drownedgrove` and `longneck` music scenes in `src/audio.js` (keyed `grove` until L2, which the Mushroom Grove's
scene overwrote), her pet in `src/shared/house.js`.

## The room
West to east (`GROVE_ZONES`):
- **The Drowned Gate** (no mobs): the Shallows' boardwalk coming in under two leaning willows, its posts green with a weed
  line high up where the water stood until lately; a waystone (`GROVE_WAY_X`). The way back is its west end.
- **The Weeping Rows** (156–159): willows standing in rows, as if someone planted them once; a stretch of old boardwalk.
  **The Sunk Stone** (`GROVE_STONE_X`, read with E): a Keeper stone sunk to its shoulders, its gear ring half under the
  water, a figure on its face setting a light on the water and the light cut again smaller and smaller as it goes. Someone
  has tied a lantern to it, tag turned in. The Fen adds no canon tier, so it says no more than Tier 1 and leans on the
  island's own theme (letting go).
- **The Root Halls** (159–163): roots in great arches. **The Sunk Barrows' way in** (`BARROWS_GATE_X`): a low green
  mound, a stone doorway with a lantern cut in its lintel. Until L3 its passage was full of black water to the lintel with
  something lit down under it (a gate); L3 let the water down (`drawBarrowMouth`'s open look: wet steps going down, a weed
  line just under the lintel, a lantern far down the passage), and its door is in `ROOMS[GROVE]` (`docs/places/barrows.md`).
- **The Heronry** (163–166): nest rocks streaked white, dead trees with herons' nests in their forks. **Long-Neck's den**
  opens at `HERON_DEN_X`: a gap between two great drowned willow roots, nest stones heaped in its mouth, grey feathers
  caught on the bark, and now and then a long grey neck rising over the reeds behind it to look out.
- **The Lantern Causeway's near end** (`CAUSEWAY_GATE_X`, a gate, L4), the room's east end: the stone causeway goes off
  across the mere, lamps on posts all lit, but its first stretch has sunk, the paving going down under the water, the
  first posts leaning, their lanterns drowned and still glowing.
- **The hidden spot** (last in `GROVE_PLATFORMS`): the high crook of the oldest willow, up off a bough in the Root Halls,
  a heron's moulted feathers lodged in it.

## Its mobs (on the frozen curve; no elites, no field boss: the Fen's field bosses are the Shallows' and the Barrows', L3)
- **Will-o'-wisp** (157): a cold blue-white flame with eyes, drifting; it fades out and comes back with a pulse (`phase`).
- **Reed stalker** (160): a great bittern striped like the reeds, neck stiff and bill to the sky; it levels the bill and
  lunges (`shell` with `cut: 0`, the black-ice wolf's lunge).
- **Willow wight** (163): a stump of drowned willow got up and walking, hollow knots for eyes with a green glow; it heaves
  up and its roots come up round it (`stomp`, a small one like the bull walrus's). Drops the Wight Crown very rarely.
- **Marsh heron** (166): a grey heron that hangs over the water and stabs down (`dive`). Long-Neck's minion.
Materials: wisp light, stalker plume, wight bark, heron feather; Long-Neck's nest stones (`docs/economy.md`).

## Long-Neck (den boss, Lv 166, the Stone Nest)
- **Who she is** (the plan, `story/phase8-plan.md`): a great grey heron, older than the willows. Every spring her young
  flew off over the mere and none came back, so the last egg she keeps, and keeps; with a shard in her breast she holds it
  and it is a stone. The Fen's theme, grief and holding on, in one animal. Her `lines` (enter, phases, freed) say it.
- **The den** (`dens-heron.js`): a hollow inside a ring of huge drowned willows, the light green through the fronds, black
  still water over the floor, the nest of stones on a hummock in the middle with the grey egg-stone in it; the ledges are
  willow roots. Freed (`drawHeronFreed`, `HERON_FREED_S`): she opens her wings and flies off east over the mere, grey
  feathers drifting down, and the nest shows only the stone and one feather until she's back.
- **Her moves** (`bossBrain`, the shared ones): charge (bill first, wings half open), slam, her grey feathers in fans
  (`feathers`, drawn `heronfeather` through `looks.feathers`), rain, summon (marsh herons), leap, barrage. Ultimate: **The
  Long Wait** (the `lanes` ult as dens.js draws it).
- **Challenges from day one** (`ch`, `docs/combat/challenges.md`): **late tells** every phase (`late`: she goes still and
  grey, then the bill comes down where you stood; a heron's stillness is the tell) and **the mere flooding the den** from
  phase 2 (`flood`, style `mire`). The punish window like every den.
- **Party mechanics** (S5.4): the shard in her breast glints (the weak point, in reach from the floor), the nest breathes
  cold mist (a pulse, the Narwhal's `breath` look), and freezing The Long Wait cancels it.
- **Rewards**: Long-Neck's Bill with its twins (the Stillwater Staff, the Greywing Bow), the Heron Crest, nest stones,
  coins; a mini Long-Neck at the Pet Shop (`PETS`). No story tier: the Fen adds none (`src/shared/story.js` leaves her out).

## Decisions and history
- 2026-11-11: built in L1 with Firefly Hollow. **Not played by anyone yet**; no headless test (owner's rule), only a build,
  the sheet, a server boot and a draw check of every new drawing function in Node against a fake canvas.
- The way in: the plan's "the water's up; the update lets it down". The boardwalk is out again, wet, the weed line high on
  its posts (`drawFloodwaterOpen`); Hob's punt waited for the mere itself to go down (L2, `docs/places/stillmere.md`).
- The plan's "reed stalkers wait in the reeds" is drawn (reed stems in front of it, neck up like a hiding bittern), not a
  new brain; "willow wights' roots grab: a short slow" would need `step()`, so it's the stomp's ring of roots instead.
- Her late strike is drawn as the shared late-tell blade (`src/challenge.js`, Chronos's), and the first-time banner for
  `late` is Chronos's wording ("When he glows, move"): most slimes here met it at the Old Narwhal already. A heron-bill
  look for it is a possible polish.
- No freed world change for Long-Neck (Phase 7's per-character changes are tied to story tiers; the Fen has none). Rough
  edge: the Heronry doesn't look different after you've freed her.
