# The Ashwood (room 55, `ASHWOOD`): Lv 115–130, Greyback, Collier Pitch, the Kiln Stone, the Green Tree

Emberdeep's depth pass, phase E1's second half (`story/world/emberdeep-depth.md`, "The Ashwood"): a branch on the
windward outer slope north of Cinder Flats, the old forest that the forge folk cut and burned for charcoal to feed
the foundry. You reach it up the old charcoal road from Cinder Flats (`ASHWOOD_GATE_X` in the Caldera room). Its iron
bridge over the lava channel had fallen in (E0's gate); the update itself lifted the block, no quest (owner's rule):
`src/branch-gates.js` draws `OPEN.ironbridge` (`drawIronBridge` with an `open` flag, the F3 pattern: the truss hauled
back up level on its stones, Slag's bright new plates riveted over the bent places, the chains it was hauled up on
still hanging off the posts). Ash's and Slag's personas say who did it. **You come in at the EAST end**
(`ASH_EXIT_X`) and climb west, higher and harder (`ASH_ZONES` run hard → easy by x, like the Black Sands; each
zone's sign stands at its east edge). The map draws the Old Foundry west of the Ashwood, and its adit is at the far
west end. Don't "fix" the direction.

- Data: `ASH_ZONES`, `ASH_PLATFORMS`, `PITCH_X`, `ASH_STONE_X`, `FOUNDRY_GATE_X` and the spawns in
  `src/shared/rpg.js`; the room and the door pair in `src/shared/sim.js`. Art: `src/ashwood.js` (the room,
  `drawAshwood`), `src/ashwood-art.js` (mobs, gear, icons, Pitch's dress; the staves and bows are rows in
  `src/staff-art.js` and `src/bow-art.js`).
- The look: a low grey sky, the sea far below to the north, the island's smoke column leaning in from the south,
  the slope behind bristling with far black trunks. Standing charcoal trunks, cracked into little squares the way
  burnt wood is, some with a live red glow deep in a crack; ash coming down like rain, slanting in on the wind; grey
  ash underfoot; and **ferns coming back**, thick at the bottom of the slope by the clearing and only a brave few
  up on the Crown (`FERNS`: the forest returning from the bottom). That gradient is the point of the place.
- East to west: **Collier's Clearing** (no mobs: Collier Pitch's turf hut, its roof a platform, two smoking
  charcoal clamps, a pile of deadwood, the Kiln Stone, the waystone, the sign back to Cinder Flats), **the Fern
  Slope** (fallen trunks, rock ledges; moths and boars), **the Charcoal Stands** (the great burnt trunk, broken off
  high, a `stump` platform; foxes and beetles) and **the Burnt Crown**, the bare top of the slope (wisps, beetles,
  Greyback), with the Old Foundry's bricked-up adit at the very west end.
- **The Green Tree**, the find (last in `ASH_PLATFORMS`, `greentree`): a hollow in the rock high over the Charcoal
  Stands, reached from the great burnt trunk's top. The last living tree of the old forest: small, thick,
  stubborn, in full green leaf, roots gripping the rock, ferns round it and a dented tin cup left for watering. Pitch
  knows and hints ("climb the big black trunk in the Stands, and then a bit more"); he asks finders not to carve on
  it or tell. Nothing else on the island is green like it.
- **The Kiln Stone** (`RUIN_STONES`, shape `kiln`, `src/ruins.js`): a long low Keeper stone half sunk in the ash at
  the clearing's edge, four pictures in a row joined by arrows: a stand of trees, the trees burning, a bar of metal
  on an anvil, a wheel with teeth. One small sapling is cut apart under the trees, with no arrow leading from it (the
  Green Tree, for those who look). A ledger page under a pebble at its foot. Emberdeep's tier by showing only: never
  the Tidewheel, the Stopped Hour, Chronos or Pell. Pitch thinks it's his family's story, cut before his family was
  born, and it bothers him.
- **The Old Foundry's gate** (`EMBERDEEP` in `src/shared/branches.js`, kind `adit`, `FOUNDRY_GATE_X`): a timbered
  mine adit in the slope's rock face, a rail running out of it, **bricked up by the forge folk themselves** (neat
  forge bricks, good mortar, a rusted lamp hook, cold air leaking round one brick). E: "The old adit is bricked up
  from this side. Forge bricks, good mortar. Someone meant it." The Foundry lost `past`; its map `block` is "bricked
  up". Ash says "We bricked it up ourselves. It stays bricked." and no more; Pitch carried bricks and sends you to Ash.
  When E3 opens the Foundry, the update unbricks it (an open look for `adit` in `OPEN`), and those two personas change.
- **Waystone** `ashwood` in the clearing (`isle: 'ember'`, `src/shared/waystones.js`).

## Collier Pitch (AI trader, `docs/social/ai-characters.md`)
The last charcoal-burner, a forge-slime (`folk: 'forge'`, accessory `collier`: a sooty hood pushed back, a
smoke-cloth, a long clamp rake, a fat ledger tied with string). His family burned the old forest for the foundry; he
burns only deadwood now, counts fern seedlings in his ledger every morning, sits up nights with the clamp and talks
to the ferns. Dry, slow, sad. Tier 0 plus his corner (the slope, its mobs, Greyback, the bridge, the adit he helped
brick up, the Kiln Stone, the Green Tree he won't quite place). Shop `pitch` (`SHOPS`): the basic potions and a tier
aimed at Lv 122 (`aim`): the Collier's Axe, its Deadwood Staff and Charcoal Bow twins, the Collier's Hood.

## Mobs (on the frozen curve)
- ash moth (passive, `fly` 26, Lv 116) · char boar (aggressive, no special: it just charges on sight, Lv 118) ·
  ember fox = `blink` (drops into the ash, a skitter of sparks, and comes up behind you; Lv 121) · ironbark beetle =
  `shell` (a wing-case like burnt bark in front: go round behind; ~124% HP like the other shell mobs; Lv 123) · smoke
  wisp = `phase` (`fly` 44, under the 70 px notice limit; Lv 126). Voices borrowed (`MOB_HURT` / `MOB_DEATH`).
- **Greyback** (field boss, Lv 130): an old bear gone ash-grey, scorched bald in patches, a notched ear, embers in
  his ruff; his den was the last big tree on the Crown, the one Pitch's grandfather burned. Small boss, no story (a
  name, a look, a line: its `desc`). Passive until hit; then `lob` with shot style `log` (`src/hazards.js`: a charred
  log turning end over end, both ends burning): he rears up with the log over his head (`m.warn`) and throws. S5.4:
  `focus` and `curse` (`looks.curse: 'ember'`, the logs leave you smouldering), like the Thorn Hart's pair. Drops
  Greyback's Brand (with its Smoulder Staff and Greyback's Bow twins) and the Greyback Helm. Its pet is in the Pet
  Shop (`PETS`, between Fenrir's and the Colossus's; `PETSHOP_W` went up to fit it).

## Gear (`docs/combat/items.md`)
Pitch's tier (Lv 118, `aim` 122): Collier's Axe / Deadwood Staff / Charcoal Bow, Collier's Hood. Mob drops at their
mob's level: Emberfang / Fox-Ember Staff / Emberfang Bow (ember foxes), Ironbark Helm (beetles). Greyback a step over
(Lv 132): Greyback's Brand / Smoulder Staff / Greyback's Bow, Greyback Helm. Materials from every mob (moth wing,
charred tusk, ember brush, ironbark chip, bottled smoke, Greyback's claw). Ids checked unique across `ITEMS`.

## Decisions and history
- 2026-10-27: built as E1's second half. Liberal decisions (owner's standing instruction): east entry (the map puts
  the Foundry west), zone names, Collier's Clearing as the hub, where the Green Tree and the stone stand, the sapling
  on the stone, Greyback's party pair (focus + curse) and the `log` shot, the smiths hauling the bridge out on chains
  with Slag riveting, the adit's text, gear names. Personas that changed: Ash (the Ashwood's dangers and the adit
  instead of the bridge in his shut-ways list), Slag (the plates, Pitch's fern seed), Soot (Pitch comes down for
  eggs).
- Same pass: the Queen's Bridge's leopard seal whisker was a second `seal_whisker` in `ITEMS` (the later entry
  silently replaced the Skerries' ice seal one); it is `leopard_whisker` now (`docs/places/queensbridge.md`).
- Not playtested (owner's rule: no headless bot tests): checked by a build, the economy sheet and reading the code.
- Music scene `ashwood` (`docs/ui/audio.md`).
