# Items, gear, scrolls, gold, the shop and the Boutique

Any price or drop change: check it against the balance sheet first (`docs/economy.md`, `npm run economy`).

Data: `ITEMS`, `STACKS`, scroll rules, `SHOP_STOCK`, `COSMETICS` in `src/shared/rpg.js`. Server: bag
actions, `scroll()` and `shop()` in `server/rpg.js`. Client: bag UI in `src/rpg.js`, shop in
`src/shop.js`, icons in `src/field.js` (`drawItemIcon`).

## Items
Kinds: coin · potion (HP and/or MP) · loot (materials, mostly for selling) · sword (ATK, reach) · helmet
(DEF) · scroll. Bosses drop unique swords and helmets; their later ones have more upgrade slots.

## Scrolls (enhancement, MapleStory style; boss drops only)
- 100% / 60% / 10% sword and helmet scrolls, dark 30% ones (a failure may DESTROY the item), and a chaos
  scroll that rerolls an item's bonuses.
- Every sword/helmet has upgrade slots (`slotsOf`); every scroll used takes one whether it works or not,
  never refunded. The roll is `rollScroll`.
- An item's enhancement `e = {u, s, atk, magic, def, hp}` travels with it (bag entries, worn gear in
  `gearE`, loot); `statsFor` adds it. `look.plus` makes swords glow (`drawEnhanceGlow`).
- Bag → select a scroll → "Use on …" (dark scrolls ask twice).

## Gold and Merchant Pip's shop
- Mobs drop gold. Pip's stall is in the village at `SHOP_X` (E there). Buy potions and starter gear
  (`price`, `SHOP_STOCK`, `BUY_MAX` at once); sell anything for `SELL_RATE` of its price (`sellPrice`).
  The server only checks you're within `SHOP_RANGE` of the stall.

## The Boutique (a shop tab)
- The friends' signature accessories (ribbon, glasses, notes, bowtie, flute, laptop: ids `src/slime.js`
  draws) sold cheaply as cosmetics (`COSMETICS`). Owned ones are worn in any mix from the bag's Style row,
  which also has "Helmet: shown/hidden" so cosmetics show over armour. `wear` and `showHelmet` ride along
  with gear in `gear` messages; `Slime.setLook()` combines everything.
