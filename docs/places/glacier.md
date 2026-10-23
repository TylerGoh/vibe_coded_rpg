# The Rimeglass Glacier (room 36, `GLACIER`): Lv 60–75, Old Rimehorn, Ice-Cutter Eyvind

Frostpeak's depth pass, phase F1 (`story/world/island-depth.md`, "Frostpeak's depth pass"): the first of
Frostpeak's branches, filling the levels that had nothing of their own after the rebalance (60–75). A great
river of blue ice above Starfall Summit. The way in is the glacier's snout at the Summit's east end
(`GLACIER_GATE_X`, before the Sanctum), drawn open by `src/branch-gates.js` (`OPEN.snout`: an ice wall with
steps cut zig-zagging up it, a rope on pegs, a red flag). You arrive at the WEST end (`GLACIER_EXIT_X`) and
climb east, higher and harder.

- Data: `GLACIER_ZONES`, `GLACIER_PLATFORMS`, `EYVIND_X`, the gate xs and the spawns in `src/shared/rpg.js`;
  the room and door in `src/shared/sim.js`. Art: `src/glacier.js` (the room), `src/glacier-art.js` (mobs, gear,
  icons, Eyvind's clothes); the staves are rows in `src/staff-art.js`.
- Cold and bright: white peaks all round, the sea and the far islands far down past the glacier's foot, an
  ice wall behind the path with crevasses in it, snow blowing down the ice, and the aurora hanging lower
  and brighter the higher you climb (`auroraAt`). Over the Icefall you see the Aurora Heights, a white
  snowfield lit green under the lights (shown since F1, reached since F3).
- West to east: **the Cutters' Camp** (no mobs: the Rime Stone, a waystone, a sledge of ice blocks, Eyvind
  and his hut, whose roof is a platform), **the Snout** (snow hares, snow petrels, glacier rams), **the
  Crevasse Field** (rams, rime wolves, frost wraiths; a snow bridge; the crevasse down to the Blue Halls)
  and **the Icefall** (frost wraiths, great yetis, Old Rimehorn; at the top the sheared climb to the
  Aurora Heights).
- **Ways on** (opened in F3; blocked in F1–F2 by the owner's show-don't-open rule): the crevasse down into
  **the Blue Halls** (`BLUEHALLS_GATE_X`: the smashed ladder replaced by a new one, a lantern at the top;
  `docs/places/bluehalls.md`) and the climb up to **the Aurora Heights** (`HEIGHTS_GATE_X`: new steps cut up
  the icefall, a rope and a red flag; `docs/places/heights.md`). Doors in `ROOMS[GLACIER]`, `entry` art
  `crevasse` and `icefall` (`OPEN`) in `src/branch-gates.js`.
- **The Rime Stone** (`RUIN_STONES`, shape `rime`): a Keeper stone inside a block of clear ice that the
  cutters cut out of the glacier and stood up at the camp. Stars carved and joined into a chart, and two
  islands with the Keepers' road running between them over a strait no wider than a brook. Frostpeak's tier
  is canon Tier 2, so it may say a little more than Greenhollow's stones, but only by showing: the stars on
  it aren't where the stars are now, and the islands were once that close. It never says Pangelea, the
  Stopped Hour or the Wheel.
- **Ylva's Cairn**, the hidden spot (last in `GLACIER_PLATFORMS`, on a pinnacle over the Snout's tallest
  serac): a little cairn for Old Skaldi's late wife, with the driftwood birds he carves, all facing the sea.
  Eyvind carries one up every year; Skaldi's and Eyvind's personas know it, and only hint where it is.
- **Ice-Cutter Eyvind** (`eyvind`, `docs/social/ai-characters.md`): fjord folk (`folk: 'fjord'`, dress
  `icecutter`: a fur cap with horn goggles, a beard, an apron, an ice axe). He cuts blue ice for the hamlet
  and trades (`SHOPS.eyvind`): potions, the Ice-Cutter's Cleaver, the Glacier Staff and the Ice-Cutter's
  Cap, aimed at Lv 66. Narrow lore (Tier 0 plus the glacier). His life: his daughter Liv sailed south on
  the Lodestar's last voyage and hasn't come home; he wrote her a letter a month for when ships sailed again,
  and since atlas Phase 5 the whole box has gone south with Arne (no answer yet; Liv is found in E2).
  Skaldi, Runa and Tove's personas know him and the glacier.

## Mobs (on the frozen curve; legacy brains)
- snow hare (passive, hops) · snow petrel = `dive` (`fly` 62, under the 70 px notice limit) · glacier ram =
  `shell` (great curled horns in front: hit it from behind) · rime wolf = `blink` (whirls away into snow
  and comes round behind you) · frost wraith = `phase` (fades into the snow; can't be hurt while faded) ·
  great yeti = `lob`, `style: 'snow'` (snowballs, `src/hazards.js`). Tove's yeti cubs grow up into these.
- No elites (not a hard pocket). Two wraiths fewer than first laid: their pulses stacked into a wall.
- **Old Rimehorn** (field boss, Lv 75): a mammoth older than the hamlet, shaggy red-brown with icicles in
  his coat and a chipped tusk. Small boss, no story: passive until hit, then `stomp` (rears, lands with a
  shockwave: be off the floor). Drops the Rimehorn Tusk (and its staff twin) and the Woolly Hood. His pet
  is in the Pet Shop (`PETS`; `PETSHOP_W` went up to fit it).

## Gear (`docs/combat/items.md`)
Eyvind's tier (`aim` 66): Ice-Cutter's Cleaver / Glacier Staff, Ice-Cutter's Cap. Mob drops: the Ramhorn
Helm (rams), Rimefang / Howling Staff (rime wolves). Old Rimehorn: the Rimehorn Tusk / Rimehorn Staff and the
Woolly Hood. All on the frozen gear curve at their `lvl`; materials from every mob.

## Waystones
A stone in the Cutters' Camp and one in Icefang Hamlet by the lamp-fire, both Frostpeak's (`isle: 'frost'`):
they only reach each other, never Greenhollow's (`docs/places/waystones.md`).

## Decisions and history
- 2026-10-23: built as F1, together with F0 (Frostpeak's island map and gates, `docs/places/branches.md`).
  Liberal decisions (owner's standing instruction): the plan's names (the Rimeglass Glacier, Eyvind, Old
  Rimehorn, the Rime Stone) are new; the glacier hangs off the Summit, not the Ridge, so its band follows on
  from the Summit's top.
- Music scene `glacier` (`docs/ui/audio.md`).
