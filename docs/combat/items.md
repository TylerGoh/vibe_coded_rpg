# Items, gear, scrolls, gold, the shop and the Boutique

Any price or drop change: check it against the balance sheet first (`docs/economy.md`, `npm run economy`).

Data: `ITEMS`, `STACKS`, scroll rules, `SHOP_STOCK`, `COSMETICS` in `src/shared/rpg.js`. Server: bag
actions, `scroll()` and `shop()` in `server/rpg.js`. Client: bag UI in `src/rpg.js`, shop in
`src/shop.js`, icons in `src/field.js` (`drawItemIcon`).

## Items
**Weapon lock (S2):** a Novice wields anything; a Warrior only swords, a Mage only staves (`weaponOk`,
`CLASSES` in `src/shared/skills.js`; `docs/combat/skills.md`). Loot keeps dropping both kinds.

Kinds: coin · potion (HP and/or MP) · loot (materials, mostly for selling) · sword (ATK, reach) · staff
(MAGIC, MP, bolt range) · helmet (DEF) · scroll. Swords and staves go in the one **weapon** slot (`gear.weapon`,
`WEAPON_KINDS`, `gearSlotOf`); before S1 it was called `sword`, and `load()` in `server/rpg.js` moves old saves over. Herbs (`herb: true`, loot) and brewed potions (`brewed: true`: also full restores and
timed buffs) come from farming and the alchemy lab: `docs/places/alchemy.md`. Recipes use some mob
materials, so those aren't only for selling any more. Bosses drop unique swords and helmets; their later ones have more upgrade slots.

## Staves (S1, 2026-10-23: `story/progression.md`)
- Every staff has a **twin** sword (`twin` on the staff, `STAFF_OF`): the same price, slots and `lvl`, with
  MAGIC equal to the sword's ATK (the economy script checks the match). Wherever the twin sword drops (boss
  sets, rare mob drops), `twinPick` in `server/rpg.js` drops one or the other: the kind a random fighter is
  holding, flipped `STAFF_OFFKIND` of the time so everyone sees both. Drops stay worth the same gold.
- Staves: Pip's three starters, one at each branch trader (Bun, Moss, Truffle, Acorn, Eyvind, Hakon, Slag), one per den
  and field boss, and the Sentinel Staff (G5: the first twin of a sword that only drops from mobs). The
  other mob-only swords (Coral Saber, Silkthread, Glowroot, Stingblade, Moray Fang, Stalker's Claw,
  Whalebone Harpoon) have no twin yet. Each staff's look is a row in `STAFFS` (`src/staff-art.js`).
- A staff adds its MAGIC to spells and its `mp` to max MP (`statsFor`), and changes the normal attack to the
  **staff bolt** (`docs/combat/core.md`). Swords still don't help spells, and the level's `magicFor` is
  unchanged, so nobody lost spell power when staves came in.
- Art: `src/staff-art.js`: `STAFFS` describes each one (shaft colours, a head shape from `HEADS`, gem and
  glow colours) and `drawStaff` draws it for the bag icon (a shortened shaft so the head shows), the back
  and the cast pose (`drawStaffOnBack` / `drawStaffCast` in `src/slime.js`). The glow colour tints its bolt.

## Legacy items (the rebalance, R, 2026-10-23: `story/world/island-depth.md`)
- When Frostpeak's, Emberdeep's and the Citadel's mobs and bosses moved up to their new bands, their gear
  got **scaled copies**: `<id>_n` (`frost_blade_n`, `chrono_staff_n`…), with a `lvl` (checked on the frozen
  gear curve like any new gear), stats and price scaled along that curve, and `art: '<id>'`. The raised
  mobs, bosses and Runa's shop drop and sell only the copies.
- The **old id stays the legacy item**: same stats, scrolls and enhancements, `legacy: true`, its name
  ends " (Legacy)" and its bag card says so (the trade window too). Nothing drops or sells it any more,
  but it works forever and can still be scrolled. No save was migrated: bags and gear hold ids, so what
  players owned simply became the legacy item.
- Art: every art lookup by id goes through `artOf` (`src/shared/rpg.js`): `drawItemIcon`, `drawSword`,
  `drawHelmet`, `drawStaff`, `staffGlow`, and `Slime.setLook` (which stores art ids for drawing). A copy
  needs no art of its own. Do the same for any future copy.
- Copied: the 12 den-boss items of the six raised dens, their six staves, and Runa's Seal-Fur Hood and
  Whalebone Harpoon. Potions, scrolls and materials kept their ids (materials kept their prices: the
  raised mobs' coins make up the rest of a kill's worth).

## Scrolls (enhancement, MapleStory style; boss drops only)
- 100% / 60% / 10% weapon and helmet scrolls ("Sword Scroll" until S1; the ids are still `scroll_s*`), dark 30% ones (a failure may DESTROY the item), and a chaos
  scroll that rerolls an item's bonuses.
- A weapon scroll on a staff adds its ATK and MAGIC the other way round, so the bigger number lands on MAGIC.
- Every weapon/helmet has upgrade slots (`slotsOf`); every scroll used takes one whether it works or not,
  never refunded. The roll is `rollScroll`.
- An item's enhancement `e = {u, s, atk, magic, def, hp}` travels with it (bag entries, worn gear in
  `gearE`, loot); `statsFor` adds it. `look.plus` makes the weapon glow (`drawEnhanceGlow`).
- Bag → select a scroll → "Use on …" (dark scrolls ask twice).

## Gold and the shops
- Mobs drop gold. Every shopkeeper is in `SHOPS` (room, x, stock): **Merchant Pip**'s stall in the village
  at `SHOP_X` (E there; `SHOP_STOCK`, plus the Boutique), and **Netmender Runa**'s net shed at Icefang
  Hamlet (the Trade button in her dialog: she's an AI character too, `docs/places/fjord.md`). Buy
  (`price`, `BUY_MAX` at once); sell anything for `SELL_RATE` of its price (`sellPrice`) at either. Buy and
  sell messages carry `shop` (default `pip`); the server checks you're near that keeper (`SHOP_RANGE`).
- The branches' traders (G1): **Miller Bun** (`SHOPS.bun`, Willowmere) and **Beachcomber Moss**
  (`SHOPS.moss`, the Coves). New gear has a `lvl` (checked on the frozen gear curve) and art in
  `src/willowmere-art.js` / `src/coves-art.js` (`BRANCH_SWORDS`, `BRANCH_HELMETS`, `BRANCH_ICONS` in field.js).
  G2 adds **Forager Truffle** (`SHOPS.truffle`, the Mycelium Deep: also mega elixirs), with the Deep's and
  Glowroot Hollow's gear in `src/deep-art.js` (`DEEP_SWORDS`, `DEEP_SWORD_LEN`, `DEEP_HELMETS`, `DEEP_ICONS`).
  G3 adds **Ranger Acorn** (`SHOPS.acorn`, the Old Oak Canopy: the Ranger's Billhook and Hat, mega elixirs),
  with the Canopy's gear in `src/canopy-art.js` (`CANOPY_SWORDS`, `CANOPY_SWORD_LEN`, `CANOPY_HELMETS`, `CANOPY_ICONS`).
  G4's hard pockets have no trader: their gear only drops (mobs rarely, the field bosses often), art in
  `src/wreck-art.js` (`WRECK_*`) and `src/thornheart-art.js` (`THORN_*`). G5's Keeper's Spine has none
  either (`src/spine-art.js`, `SPINE_*`): mob drops and the Root Warden's set (`docs/places/spine.md`).
  Frostpeak's F1 adds **Ice-Cutter Eyvind** (`SHOPS.eyvind`, the Rimeglass Glacier: the Ice-Cutter's Cleaver,
  the Glacier Staff and the Ice-Cutter's Cap, aimed at Lv 66, mega elixirs), with the glacier's gear in
  `src/glacier-art.js` (`GLACIER_*`): the Ramhorn Helm, Rimefang / Howling Staff and Old Rimehorn's Tusk /
  Rimehorn Staff and Woolly Hood (`docs/places/glacier.md`). F2 adds **Hakon the Bone-Carver** (`SHOPS.hakon`, the
  Whale Skerries: the Bone-Carver's Saber, the Driftbone Staff and the Sealskin Hood, aimed at Lv 60), with the
  Skerries' and the Narwhal Grotto's gear in `src/skerries-art.js` (`SKERRIES_*`): the Whalebone Helm, the Ivory
  Cutlass / Walrus Ivory Staff, the Angler's Lamp, the Skate Wing Blade / Skate Staff, and the Old Narwhal's
  Narwhal Tusk / Narwhal Song Staff and Floe Crown (9 slots; `docs/places/skerries.md`). F3 (no trader) adds the
  Aurora Heights' gear in `src/heights-art.js` (`HEIGHTS_*`): the Foxfire Blade / Foxfire Staff, the Musk Ox Helm
  and the Pale Wyrm's Pale Star Blade / Pale Star Staff and Aurora Crown (`docs/places/heights.md`); and the Blue
  Halls' in `src/bluehalls-art.js` (`BLUEHALLS_*`): the Glass Beetle Helm, the Prism Blade / Prism Staff and the
  Hall Troll's Maul / Troll-Ice Staff and Troll-Ice Helm (`docs/places/bluehalls.md`). F4 (no trader) adds the
  Queen's Bridge's in `src/qbridge-art.js` (`QBRIDGE_*`): the Rimeguard Helm, the Rimeguard Blade / Rimeguard
  Staff, and Sigrun's Shield-Oath Spear / Shield-Oath Staff and Sigrun's Helm (9 slots;
  `docs/places/queensbridge.md`). All on the gear curve at their `lvl`, priced on it.
  Emberdeep's E0 (atlas Phase 5) adds **Slag** (`SHOPS.slag`, Forgehold: the **Slag Maul**, its twin the
  **Bellows Rod** and the **Smith's Iron Cap**, aimed at Lv 92, the island's start; register "forged for a
  wheel that never got it"), art in `src/forgehold-art.js` (`FORGE_*`; the rod is a row in `STAFFS`), and
  **Auntie Soot** (`SHOPS.soot`: the basic potions and her **Spring-Boiled Egg**, `spring_egg`, a plain heal
  between the elixirs; `docs/places/forgehold.md`). Emberdeep's gear names: basalt, black glass, iron, slag,
  charcoal, sulphur, ember, never ice, fur, shell or leaf.
- Runa sells the fjord folk's own gear, the **Seal-Fur Hood** and **Whalebone Harpoon** (each with an
  `aim` level for the balance sheet); floe seals and snow owls drop them rarely. Since the rebalance these
  are the copies (`fur_hood_n`, `bone_harpoon_n`, aimed at Frostpeak's new band); the old ones are Legacy.

## The Boutique (a shop tab)
- The friends' signature accessories (ribbon, glasses, notes, bowtie, flute, laptop: ids `src/slime.js`
  draws) sold cheaply as cosmetics (`COSMETICS`). Owned ones are worn in any mix from the bag's Style row,
  which also has "Helmet: shown/hidden" so cosmetics show over armour. `wear` and `showHelmet` ride along
  with gear in `gear` messages; `Slime.setLook()` combines everything.
