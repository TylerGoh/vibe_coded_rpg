# The Caldera Rim (room 61, `RIM`): Lv 135–150, the Hoist Stone, the Bearer's Seat, the Bearer's Hoist (Brenna's den, room 62)

Emberdeep's depth pass, phase E4's first piece (E4a; `story/world/emberdeep-depth.md`, "The Caldera Rim"): the
island's heart room, like Keeper's Spine (`docs/places/spine.md`) and the Queen's Bridge (`docs/places/queensbridge.md`):
no trader, no elites, no field boss; the party den at its far end is the danger. You reach it up **the Bearers' stair**
at `RIM_GATE_X`, the Brimstone Fields' top (west) end. Its hand-chains had rusted through (E3a's gate, `bearerstair`);
the update itself lifted the block, no quest (owner's rule): Slag forged new chains, Ochre hung them, and the fallen top
steps were rebuilt in iron (`OPEN.bearerstair`, `drawBearerStair`'s `open` look). **You come in at the EAST end**
(`RIM_EXIT_X`, the stair head) and go west along the rim, harder as you go (`RIM_ZONES` run hard → easy by x, like the
Fields; each zone's sign stands at its east edge). Don't "fix" the direction.

- Data: `RIM_ZONES`, `RIM_PLATFORMS`, `RIM_STONE_X`, `BRENNA_DEN_X` and the spawns in `src/shared/rpg.js`; the room and
  the door pair in `src/shared/sim.js` (`ROOMS[RIM]` already spreads `denDoors(RIM)`, empty until E4b's `DENS` row).
  Art: `src/rim.js` (the room, `drawRim`), `src/rim-art.js` (mobs, gear, icons; the staff and bow are rows in
  `src/staff-art.js` and `src/bow-art.js`). Map: the `rim` node in `EMBERDEEP` (`src/shared/branches.js`) has `rooms`
  and an `entry`; `ISLAND_OF_STAGE` (`src/worldmap.js`) has its `'ember'` row.
- The look: Emberdeep's register at its harshest (basalt, black glass, iron, grey pumice, a little ember), almost no
  warmth and no jokes. A slate sky with torn wind clouds; behind the path the crater: the far rim across it, the inner
  walls falling in dark bands to a turquoise lake far down, and beside the lake the vent glowing, the column rolling up
  out of it past the far rim. **The Aether Citadel circles close overhead** (`drawCitadel` in `src/rim.js`: big, slow,
  crossing the sky one way every few minutes, lit windows and the ring of light at its spire). Grit streams across on
  the wind, sparks blow up out of the crater, old iron stakes of the road along the rim lean with frayed rope on them.
  The near crest rises west to the highest point.
- East to west: **the Stair Head** (no mobs: the top of the stair with its new chain, the sign back down, the Hoist
  Stone, the waystone), **the Windward Lip** (rim goats, pumice puffs), **the Glass Slopes** (glass scorpions, heat
  shimmers) and **the High Rim** (crag rocs, more shimmers, a scorpion), which ends at the rim's highest point and the
  **old hoist frame** at `BRENNA_DEN_X` (below).
- **The Bearer's Seat**, the find (last in `RIM_PLATFORMS`, `seat`): a flat worn ledge on top of a crag over the High
  Rim, reached from the spur under it (`RIM_PLATFORMS[1]`, the platform before it in the High Rim; same jump as the
  Organ's). You can watch the Citadel go over from it. Drawn (`drawSeat`): a pale worn patch the size of something
  heavy, two strap grooves cut in the rock, a roc feather in a crack. **Its left half is kept clear for E4b**, which
  sets Brenna's tooth down there when she's freed (the plan: "it stays there: the Bearer's Seat"). Ochre hints at it.
- **The Hoist Stone** (`RUIN_STONES`, shape `hoist`, `src/ruins.js`) at the Stair Head: three islands close together,
  a road in from each, meeting at a city standing on the ground with a toothed wheel at its heart; up the fire
  island's road (cut deepest) a small figure with a toothed block lashed to its back; above, scratched later and
  rougher, the same city with no ground under it; strap grooves worn at its foot. Emberdeep's tier by showing only:
  never the Tidewheel, the Stopped Hour, Chronos or Pell.
- **Waystone** `rim` at the Stair Head past the stone (`isle: 'ember'`, `src/shared/waystones.js`): a heart room gets
  one, like the Queen's Bridge and Keeper's Spine.

## Brenna's den, the Bearer's Hoist (E4b)
Room 62 (`BRENNA_DEN`), a `DENS` row `from: RIM` at `BRENNA_DEN_X` (theme `hoist`), so its door comes through
`denDoors(RIM)`. Art: `src/dens-rim.js` (`DEN_ART` / `ENTRANCE_ART` / `BOSS_ART` / `ULT_LOOKS`, `drawTooth`,
`drawBrennaFreed`). Plan: "Brenna, the Last Bearer" in `story/world/emberdeep-depth.md`; story in
`story/characters/bosses.md`.
- **The way in**: a cleft up through the crest rock under the old hoist frame (`drawHoistFrame` in `src/rim.js` still
  stands behind it), grit streaming out on the wind, a frayed strap knotted round the frame's leg, the boss sign; far up
  past the cleft, small against the sky, a still shape with a block held up over it.
- **The den**: the rim's very top, open sky, the crater and the column beyond, the Citadel going over close and fast, a
  ring worn in the floor where she has turned in place for years, the old hoist at the far end (`HOIST_X`) with its
  hook hanging empty. The name on an iron plate hung off old strap.
- **Brenna** (`MOBS.brenna`, Lv 149, `top`, `partyDen`): a forge-slime grown round the root of a great gear-tooth she
  holds up over her, iron streaked through her jelly, two carrying straps crossing on her back at an iron buckle, eyes
  turned up at the sky. Moves in Sigrun's pattern (three phases, each adding moves; `geysers` where Sigrun has `echo`).
  Party mechanics: focus; **barrier**: the tooth swung down in front of her (`barrierFront`, the front wall drawn in
  `looks.dome: 'ember'`): flank her; pulse (`ash`, the column's ash over the rim); **weak point on the straps**: the
  buckle on her back, `weak.back` (new in E4b: only a hit from behind finds it, `weakFaces`), low enough to slap from
  the floor; adds (crag rocs); interrupt (freeze Last Delivery as she heaves the tooth up). So in a party the focused
  slime holds her front while the others work her back; alone you get round her while the tooth is down.
- **Last Delivery** (her ultimate): the shared `wave` ult drawn as the tooth heaved up and rolled end to end of the den,
  tumbling, sparks where its corners bite (`HOIST_ULT`, `toothMass`). Jump it. No text says so (owner's rule: keep the
  telegraph, never the answer).
- **`lines`**: enter "Is it time? Has someone come for it?", wearing down through the phases to "Not yet. Not yet. Not
  yet."; `shield` when the tooth first comes down in front ("Not on the ground. It never touches the ground..."); freed
  "...Nobody is coming down for it. Then I can put it down. There. Tell my brother I carried it as far as there was
  road." Freed, she lowers the tooth and sets it down (`drawBrennaFreed`); the den keeps it on the floor until she's back.
- **Tier 3 by showing only**: a tooth, a wheel (the hoist's pulley), a city going over. Nothing here names the
  Tidewheel, the Stopped Hour, Chronos or Pell: in Emberdeep only Ignis says the words (his freed line).
- **The world changed in the same update, for good** (not per kill, the plan's rule): the tooth sits set down on the
  Bearer's Seat's left half (`drawSeat`, using `drawTooth`), its strap loose beside it, the right half still clear to
  sit on; and her name is carved in the memorial wall's blank space in Forgehold (`docs/places/forgehold.md`). The den
  still respawns her holding a tooth (the shard pulls her back, like every boss); only Ochre says so.
- **Numbers** (`docs/economy.md`): HP sized like the other top party dens (a party of four ~47 min on the sheet,
  alone ~2.4x that), EXP and coins between Sigrun's and the Colossus's by level, gear a step over the Rim's (Lv 151), her
  pet between Old Crucible's and the Colossus's. Music: scene `brenna` (`docs/ui/audio.md`).

## Mobs (on the frozen curve)
- rim goat (passive, `hops`, Lv 137) · pumice puff = `split` into pumice bits (the minion kept small, like the
  slagling; Lv 140) · glass scorpion = `shell` (~124% HP like the other shell mobs; Lv 142) · heat shimmer = `phase`
  (`fly` 44; Lv 145) · crag roc = `dive` (`fly` 62, under the 70 px notice limit; Lv 148). Voices borrowed (`MOB_HURT` /
  `MOB_DEATH`). No elites (not a hard pocket), no field boss (the den is the danger).

## Gear (`docs/combat/items.md`)
Mob drops a little under the band's top: the Glassback Helm (Lv 141, glass scorpions) and Cragbeak / Cragbeak Staff /
Cragbeak Bow (Lv 146, crag rocs), on the curve at their `lvl`. Materials from every mob (rim goat horn, puff pumice,
scorpion glass, shimmer bead, crag roc feather). Ids checked unique across `ITEMS`. Names in Emberdeep's register.

## People
No one lives here. Personas that learned the stair was rechained (`server/characters.js`): Ash (Slag forged the
chains, he let him, won't go up or say why; lists the Rim's dangers; Ochre told him something stands up by the old
hoist and he told her to leave it be), Soot (Ash went quiet a whole evening; she doesn't ask about the rim), Slag
(forged every link; Ash watched without a word; wants to see the Citadel close), Ochre (hung the chains; knows the rim's
mobs, hints at the Seat, went close enough to see something standing still by the hoist and came back). E4b: Ochre
saw it was Ash's shape holding a tooth up and told him; later told him the tooth was set down on the Seat, and Ash
carved Brenna's name on the wall himself that night (Soot sat up with him; Slag sharpened the chisel and wants to see
the finished tooth); Ochre has seen something by the hoist again some days since. Ash still won't go up
(`docs/social/ai-characters.md`).

## Decisions and history
- 2026-10-28: built as E4a (E4's first piece; Brenna's den is E4b). Liberal decisions (owner's standing instruction):
  Slag forging the chains (Ochre hanging them), the east entry, zone names, the Citadel crossing on a slow loop, the
  hoist frame as the den's spot, the Seat on a crag reached like the Organ, gear names, music scene `rim`
  (`docs/ui/audio.md`).
- Not playtested (owner's rule: no headless bot tests): checked by a build, the economy sheet and reading the code.
- 2026-10-28: E4b, Brenna's den (E4 done). Liberal decisions: the den's name, the barrier as the tooth swung down in
  front (front-only, like Sigrun's shield) with the weak point on the straps BEHIND her (`weak.back`, the new bit: the
  reverse of Sigrun, so the party's roles differ: the focus holds her front, the flankers break the buckle), crag rocs
  as her adds, `geysers` in her last phase, Ash carving the name himself after Ochre's word (Soot sat up with him), the
  name readable on the wall (the only one), the tooth on the Seat's left half with its strap, the silhouette past the
  cleft kept (the den respawns her; Ochre says so), Ignis's and Pyra's lines. Not playtested: a build, a throwaway
  server boot, the sheet, a mock-canvas run of the new draw functions.
