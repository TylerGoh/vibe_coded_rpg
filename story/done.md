# Done: what the roadmap has shipped

One line per phase, newest last in each track. The doc named is where it's described now; what was left
over is in `docs/ideas.md` under the phase's name. Full plans as written: `archive/`.

## Geography and travel (atlas phases)
- **Phase 0** (2026-10-20): distant islands in every outdoor sky, in compass direction (`src/distant.js`).
- **Phase 1** (2026-10-20): Greenhollow Harbour, the lighthouse, Captain Brine (`docs/places/harbour.md`).
- **Phase 2** (2026-10-20): the Keeper ruins in Bramble Woods, the east cliffs and telescope (`docs/places/cliffs.md`).
- **Phase 3** (2026-10-20): crossing rooms; the ferry to Frostpeak; the Highlands trail removed (`docs/places/crossings.md`).
- **Phase 4** (2026-10-20): Icefang Fjord and Hamlet, the first town; towns as respawn points with a home
  door; the fjord folk; "Frostpeak Highlands" renamed Frostpeak (`docs/places/fjord.md`).
- **Phase 5 / E0** (2026-10-23): the Lodestar through the Steam Straits, Forgehold with Black Sand Shore,
  the forge folk, "Emberdeep Caldera" renamed Emberdeep, the Caldera pass removed, the balloon grounded
  (`docs/places/forgehold.md`). No gate on the Astral Wyrm (owner: no hard gates).
- **Phase 6** (2026-11-04): the balloon Kite up the thermal column, the Skydocks camp and the Skydocks, the
  skylift removed (`docs/places/skydocks.md`).
- **Phase 7** (2026-11-04): story progress (per-character record of den bosses beaten, lore tiers, characters fed
  canon by tier), lines for every den boss, the four freed world changes, per player (`docs/social/story.md`).

## Island depth: Greenhollow (Lv 1–60)
- **G0** (2026-10-20): field bosses, elites, door level labels, the island map, every branch gate laid,
  the frozen curves (`docs/places/branches.md`).
- **G1** (2026-10-20): Willowmere and Saltspray Coves, Old Snapjaw, the Tidemother, Bun and Moss, waystones
  (`docs/places/willowmere.md`, `docs/places/coves.md`, `docs/places/waystones.md`).
- **G2** (2026-10-21): the Mycelium Deep and Glowroot Hollow, the Knotmole, Forager Truffle (`docs/places/deep.md`).
- **G3** (2026-10-22): the Old Oak Canopy, the Hornet Queen, Ranger Acorn (`docs/places/canopy.md`).
- **G4** (2026-10-22): Wreck Cave and the Thornheart, the Drowned Bosun, the Thorn Hart
  (`docs/places/wreck.md`, `docs/places/thornheart.md`).
- **G5** (2026-10-23): Keeper's Spine and the Root Warden, the party den (`docs/places/spine.md`).
- **R** (2026-10-23): the rebalance: Frostpeak 40–60, Emberdeep 90–115, the Citadel 140–170; owned gear
  became Legacy (`docs/combat/stages.md`, `docs/combat/items.md`).

## Island depth: Frostpeak (Lv 40–100)
- **F0** (2026-10-23): Frostpeak's island map and gates, waystones kept to their island.
- **F1** (2026-10-23): the Rimeglass Glacier, Old Rimehorn, Ice-Cutter Eyvind (`docs/places/glacier.md`).
- **F2** (2026-10-23): the Whale Skerries and the Narwhal Grotto, the Old Narwhal, Hakon
  (`docs/places/skerries.md`, `docs/places/grotto.md`).
- **F3** (2026-10-23): the Aurora Heights and the Blue Halls, the Pale Wyrm, the Hall Troll
  (`docs/places/heights.md`, `docs/places/bluehalls.md`).
- **F4** (2026-10-23): the Queen's Bridge and Sigrun, the party den (`docs/places/queensbridge.md`).

## Classes and progression (the S track, `progression.md`)
- **S0** (2026-10-23): over-level EXP falloff, the per-player boss reward window (`docs/combat/bosses.md`).
- **S1** (2026-10-23): staves, the staff bolt, weapon scrolls (`docs/combat/items.md`).
- **L** (2026-10-23): slower levelling, prices in minutes of farming, the top characters rolled back (`docs/economy.md`).
- **S2** (2026-10-23): Novices, the four class trees, the Rebirth Pool, forks and advancements, the Warrior's
  chase moves, the Mage's combos (`docs/combat/skills.md`; plan: `archive/s2-plan.md`).
- **S3** (2026-10-23): the Cleric, summons, healing on the damage meter (`docs/combat/skills.md`).
- **S4** (2026-10-24): the Archer and bows (`docs/combat/skills.md`, `docs/combat/items.md`).
- **SP4** (2026-10-25): the Cleric's skill pool: Radiance, Blessing, Sacred Light, Devotion, Consecration, Judgment,
  Holy Symbol (the first EXP buff), Genesis, Sprites, Warding Totem, Stone Guardian, Resolve, Host (`docs/combat/skills.md`).
- **SP5** (2026-10-25): the Archer's skill pool: Spread Shot, Focus, Ricochet, Splitting Arrow, Sharp Eyes, Eagle Eye,
  Poison Arrow, Blast Trap, Hawk, Huntmaster; holding X / Hit keeps attacking (`docs/combat/skills.md`).
- **SP6** (2026-10-25): the balance pass: % of max HP boss hits, ~15 min dens, ~45 min top bosses for four, pay scaled
  to match, the Warrior's Sword Mastery attack (`docs/economy.md` "The balance pass", `docs/combat/bosses.md`).
- **Fewer fight hints** (2026-10-26): boss mechanics explained only by telegraphs, no answer text; top bosses
  give full EXP at any level gap (`docs/ui/hints.md`).
- **S5.4 Emberdeep** (2026-10-27): party mechanics on Ignis, Pyra, the Clockwork Colossus and Chronos, the last of the
  retrofit (`docs/combat/bosses.md`).

## Other
- **Trading** (2026-10-23): coins and items between players, server-checked, logged (`docs/social/trading.md`).
- **Shop previews** (2026-10-24): an item's stats before you buy, on every shop and trader (`docs/combat/items.md`).
- **Story:** the Keeper ruins' plaques (`src/ruins.js`); the regional characters Brine, Skaldi, Runa, Tove,
  Bun, Moss, Truffle, Acorn, Eyvind, Hakon, Ash, Soot, Slag and Arne; the fjord hamlet and Forgehold;
  the fjord and forge folk (`Slime.setFolk`).
- **FB1, Greenhollow's final boss** (2026-10-26): Ladon, the Briar Hydra (rooms 47–49: the Sunken Road, the Road's End, the
  Root of the Road); four phases, heads that regrow unless burned, fixed HP for four (`docs/places/ladon.md`).
- FB2 (2026-10-27): Fenrir, the Bound Wolf, Frostpeak's final boss: the Blue Halls' fallen wall, the Old Ice (50), the Long Stair (51), the Wolf's Hold (52) (`fb2-plan.md`, `docs/places/fenrir.md`).
- E5 (2026-11-03): Typhon, the Buried Fire, Emberdeep's final boss: the Foundry's fallen pit, the Under-Flues (63), the Long Flue (64), the Hearth (65), its look, track, four weapons, the Furnace Mask and the mini Typhon (`e5-plan.md`, `docs/places/typhon.md`).
- E1 (2026-10-27): the Black Sands (54: the Bellower, the Kettle, the Turning Stone) and the Ashwood (55: Greyback, Collier Pitch and his shop, the Kiln Stone, the Green Tree, a waystone, the Old Foundry's bricked-up adit) (`docs/places/blacksands.md`, `ashwood.md`).
- E2 (2026-10-28): the Smoking Coast (56: Liv and her shop, the Landing Stone, Liv's Lookout, a waystone; the gully's lava tongue crusted and stepped), the Hatchkeeper's den (57, The Buried Clutch) and the Drained Tubes (58, hard: Hundredfoot, the Tubes' elites, the Skylight; the tube drained) (`docs/places/coast.md`, `tubes.md`).
- E3 (2026-10-28): the Brimstone Fields (59: Picker Ochre and her shop, the Brimstone Condor, the Breathing Stone, the Organ, a waystone; the vents calmed; the Bearers' stair laid as the Rim's gate) and the Old Foundry (60, hard: its elites, Old Crucible, the Pattern, the tally board; the adit unbricked) (`docs/places/brimstone.md`, `foundry.md`).
- E4 (2026-10-28): the Caldera Rim (61: the Hoist Stone, the Bearer's Seat, a waystone; the Bearers' stair rechained) and Brenna, the Last Bearer's den (62, the Bearer's Hoist: Emberdeep's party den, Last Delivery, `weak.back`); the tooth set down on the Seat and her name on Forgehold's memorial wall; Ignis's and Pyra's lines (`docs/places/rim.md`).
- Atlas Phase 8, L0 (2026-11-11): Lantern Fen's landing at Lv 150+: the Hush from Icefang Hamlet ('fen' crossing, rooms 71/72), Wickmere (70: Netta, Wren and her shop, Hob, Sedge and her shop, the fen folk look, a waystone), the Shallows (73: four mobs, the drowned signpost, gates to Firefly Hollow and the Drowned Grove), the Fen in every sky and on the World map (`phase8-plan.md`, `docs/places/fen.md`, `docs/places/shallows.md`).
- Atlas Phase 8, L1 (2026-11-11): Firefly Hollow (74: the sawn willow, fen newts, the Sitting Stones) and the Drowned Grove (75: will-o'-wisps, reed stalkers, willow wights, marsh herons, the Sunk Stone, a waystone), Long-Neck the great grey heron and her den the Stone Nest (76: late tells and the mire flood, her Bill, Crest and pet; freed, she flies), gates laid to the Sunk Barrows and the Lantern Causeway; Wickmere's four know of it (`phase8-plan.md`, `docs/places/firefly.md`, `docs/places/grove.md`).
- Atlas Phase 8, L2 (2026-11-11): the Still Mere (77: Hob's punt in the water again, mist shades, mere eels, lamp crabs, the blank-tagged lantern, a waystone; Hob trades from his punt), Old Gullet the old eel and his den the Eel Pit (78: swallowed and the dark, his Tooth, Cowl and pet; freed, he lets the swallowed lights go up) (`phase8-plan.md`, `docs/places/stillmere.md`).
- Atlas Phase 8, L4 (2026-11-11): the Lantern Causeway (80, on from the Grove, its sunk near end raised: lamp moths, drifting lights, causeway guards, mire toads, the lantern facing home, the Hall of Lamps' door shut with moth-silk), the Will-Queen (field boss: stoops, rings of wisp-light, the turning light) and Grandfather Mire, the Fen's party den (81, Grandfather's Pool: sinking stones, the toads' chorus, swallowed and sat on; freed, he steps aside); Wickmere's four know of it (`phase8-plan.md`, `docs/places/causeway.md`).
- Atlas Phase 8, L3 (2026-11-11): the Sunk Barrows (79, a hard pocket off the Grove, the water down out of its passage: grave lamps, lantern leeches, peat mounds, barrow hounds, two elites, the nameless niche, the Peat Barrows' way down caved in), the Sleeper in the Peat (field boss: asleep until hit, late hands, the peat) and the Shallows' Bog Bloat (field boss: sheds boglings as it's hit, rings of mud); Wickmere's four know of it (`phase8-plan.md`, `docs/places/barrows.md`).
- Atlas Phase 8, L5 (a) and (b) (2026-11-12): the Wickmother on paper (`l5-plan.md`; the Fen's top to 190, her tag Lv 210), the peat cuts dug out, the Peat Barrows (82: wick grubs, peat wraiths, lamp-bearers, dusk moths, the Eldest, the child's lantern) and the Lamp Road (83: her shadow on the silk, her line, the inner door holding); the sheet reads past 200.
