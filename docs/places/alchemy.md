# Farming and alchemy (crafting potions)

Files: `src/shared/alchemy.js` (`CROPS`, `RECIPES`, `ACTIONS`, `GIFT`, `recipeFor`, `needs`), herbs and
brews in `ITEMS` (`src/shared/rpg.js`), the two pieces of furniture in `FURNITURE`
(`src/shared/house.js`), `server/house.js` (crops: `plant`, `harvest`, `atLab`), `server/rpg.js`
(`brew`, brewed buffs in `buffsOf` / `statsFor`, drinking), `src/alchemy.js` (seed card, the lab panel,
prompts, the buff on the HUD), `src/alchemy-art.js` (crops, herb and potion icons), `src/house.js`
(draws crops over plots).

## Owner decisions (2026-10-20)
- Crafting starts with potions only. You farm in your own backyard and take what you grow to an
  alchemy lab, which brews potions from recipes shown on the side. Stronger potions need more complex
  steps. The plots and the lab **reuse the decoration system** (owner's words): they're furniture,
  bought at the furniture store (its "Farm & lab" section) and placed with Decorate.
- Made without asking (the owner said to make liberal decisions; revisit if they say otherwise):
  - **Every house gets 2 garden plots and a lab free** (`GIFT`). New houses have them out already
    (`DEFAULT_LAYOUT`); houses from before get them put away once, with a toast at login (the row's
    `gift` flag). More plots are the gold sink (`price` on `garden_plot`).
  - **Seeds are bought at the plot** (E on an empty plot → the seed card), so they never take bag space.
    Crops grow in real time, also while you're offline.
  - Garden plots only go in the backyard (`yard: true` on the piece; `cleanLayout` / `snapPlacement`
    keep them there). The lab goes anywhere.
  - Only the owner plants and harvests; **anyone in a house can brew at its lab** (with their own bag).
  - Recipes mix herbs with real loot, so the top brews need the later stages too. More steps per tier:
    3 at the bottom, 13 at the top.

## Owner decisions (2026-10-20, later): more recipes, real loot, worth the time
- The owner said brewing was "wayy too hard": 12 minutes of growing for 2 potions isn't worth it when the
  shop sells potions. So crops now grow in minutes, not hours, and yield more (`CROPS`); every recipe
  makes 2–4 potions per batch (`makes`) and a batch goes up to `BREW_MAX`. Two free plots of Mintleaf
  give hundreds of potions an hour (the economy table shows herbs an hour). Brewing is meant to beat the
  shop by far: that's the reward for the steps, and it can't be turned into gold (see Balance).
- "Include real world loot for rarer potions": the recipe list grew to 18 (`RECIPES`), and past the herbs
  they use every stage's mob materials (sprout leaves, mushling caps, thorns, ice shards, stardust, ember
  cores, obsidian, cogs, aether crystals) and shop jellies. The rarest take a **boss reagent**
  (`reagent: true` in `ITEMS`): `royal_sap` (Wildwood bosses), `frost_heart` (Highlands),
  `phoenix_feather` (Caldera), `time_sand` (Citadel). Only bosses drop them (their `drops`), so the best
  brews come from boss runs. The recipe book says "boss drop" next to them.
- New buff kinds (made without asking): `exp` (more EXP from kills, `gainExp` in `server/rpg.js`), `gold`
  (more gold picked up, the coin pickup), `regen` (fight HP regen, `statsFor`). Still one brewed buff at
  a time, so an EXP or gold buff costs you the fighting one. Buffs last 10 minutes (the Elixir of Hours 15).
- The lab's ingredient shelf only shows what you carry plus what the open recipe needs (there are too
  many ingredients for one grid); the book and the shelf scroll.

## How brewing works
- A step is `stir` / `heat` / `cool` / `distill`, or `add:<item>` / `grind:<item>` (the Mortar toggle
  grinds the next ingredient). The lab panel collects your steps; Bottle sends them all at once
  (`{t:'brew', steps, n}`). The server checks you're at a lab, that the steps are exactly some recipe
  (`recipeFor`), and that your bag holds the ingredients × the batch size `n` (up to `BREW_MAX`).
- Wrong steps make one Murky Sludge (`sludge`) and **the ingredients are lost**. The panel warns first
  (a second Bottle press within a few seconds goes ahead), the book ticks off steps as you follow them
  and marks the first wrong one red.
- Ingredients are only taken when you bottle, so the panel can be closed or emptied freely.
- A recipe's id is the id of the potion it makes (`RECIPES[id].makes` of them per batch).

## Brewed potions
- Kind `potion` with `brewed: true`, so they work in the bag and the potion hotbar like any other.
  `heal` / `mana` restore, `full` fills HP and MP, `buff` gives `{ atk, crit, ward }` for `dur` seconds:
  `atk` multiplies ATK and MAGIC, `crit` adds crit chance, `ward` cuts damage taken (not ultimates).
- **One brewed buff at a time**: drinking another replaces it. It's saved with the character (`brew`),
  so it survives a relog, and `me` sends it (`brew: {id, left}`) for the HUD pill under the HP panel.

## The boss-mechanic potions (S5.5, 2026-10-24)
- `story/progression.md` section 6: every class gets a poor answer to every boss mechanic. For curses and pulses
  that answer is brewed: the **Cleansing Tonic** (`cure: 'curse'`: lifts all your curse stacks, `uncurse` in
  `server/rpg.js`) and the **Barrier Draught** (`cure: 'pulse'`: the next boss pulse that hits you within
  `DRAUGHT_S` is taken whole, in `hurt()`). Both need a `royal_sap`, which the bosses that curse and pulse drop.
- **Weaker than the class answer, on purpose**: one use each, self only (Cleanse also clears a friend, every few
  seconds), and drinking either starts `CURE_CD`, which both share (the plan said "a cooldown shared with the
  other brews"; there was no brew cooldown, and adding one to every brew would have changed them all, so the two
  share their own). `CURE_CD` is longer than a pulse's or a curse's beat, so they cover every other one at best.
- The Barrier Draught isn't a brewed buff: it doesn't replace your Brew of Might. It, and the cooldown, show in
  the status box (`src/status.js`); neither is saved, and a KO drops a waiting draught. The tonic refuses (and isn't
  used up) when you aren't cursed or it's cooling down. No prompt suggests it (boss fights name no answers,
  `docs/ui/hints.md`).

## Plots and their crops
- Each plot in a layout carries an `id` the server gives it (`tag` in `server/house.js`); crops are kept
  in the house row's `farm` under that id, out of the client's reach. Moving a plot while decorating
  keeps its id (the carried piece remembers it), so the crop moves with it. Crops whose plot is gone are
  dropped at the next login.
- The house message carries `farm: {id: [crop, ms left]}` (time left, not a timestamp: the clocks don't
  have to agree). It's re-sent on every plant / harvest / layout change.

## Balance (see `docs/economy.md`)
- Herbs and brews sell to Pip for less than they cost to make (`npm run economy` checks both), so a
  garden is never a gold farm. With the big yields that keeps herb and brew sell prices tiny on purpose.
  Boss reagents sell like any loot, so they add a little to each boss kill's value. Their value is in drinking them: brews heal far more per gold than shop
  potions, which is the reward for the waiting and the steps.

## Testing
- `TEST_GROW=60` (test servers only) makes crops grow 60× faster.
