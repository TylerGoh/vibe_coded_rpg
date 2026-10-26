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

## Other
- **Trading** (2026-10-23): coins and items between players, server-checked, logged (`docs/social/trading.md`).
- **Shop previews** (2026-10-24): an item's stats before you buy, on every shop and trader (`docs/combat/items.md`).
- **Story:** the Keeper ruins' plaques (`src/ruins.js`); the regional characters Brine, Skaldi, Runa, Tove,
  Bun, Moss, Truffle, Acorn, Eyvind, Hakon, Ash, Soot, Slag and Arne; the fjord hamlet and Forgehold;
  the fjord and forge folk (`Slime.setFolk`).
