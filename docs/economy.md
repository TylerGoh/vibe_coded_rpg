# Economy and scaling: the balance sheet

**Read this before adding or changing anything that gives or costs gold, EXP or power**: a mob, a boss, a
drop table, a shop price, a cosmetic, a house size, a skill number, the EXP curve. Then run
`npm run economy` (`scripts/economy.mjs`) and paste what changed in its tables into your reply.

The script works everything out from the live constants (`MOBS`, `SPAWNS`, `ITEMS`, `SHOP_STOCK`,
`SELL_RATE`, `COSMETICS`, `HOUSE_SIZES`, `expToNext`), so this doc holds the method, the targets and the
owner's intent; the code holds the numbers. `npm run economy -- --check` exits 1 when a check fails.

## What the script prints
- **Faucets, mobs**: per kill: EXP, gold picked up, what the other drops sell for, rare gear sold, gold
  per EXP, and kills per level at the mob's own level.
- **Faucets, bosses**: the same per kill, and how many minutes of ordinary farming one kill is worth.
- **Progress**: for a player farming mobs at their own level (`KILLS_PER_MIN`, mobs only, no bosses):
  gold a minute, play time to reach a level, and **gold earned by then** (the key number for pricing).
- **Sinks**: every price, the level whose lifetime farming gold first reaches it, and for sinks with an
  `aim` level: what share of the gold earned by that level it costs. Furniture has its own table: price,
  size, first affordable level, and minutes of farming at two levels, plus what one of every piece costs.
- **Pets** (mini bosses for houses, `PETS`): prestige sinks priced against the boss rows, not an aim; the
  table shows each one in kills of its own boss and in farming minutes. Checked: at least `PET_MIN` (the
  owner's floor) and never cheaper than an earlier boss's pet. Kept out of the furniture checks. Pets
  eat (`docs/places/pets.md`): the pet food table and a "food a month vs price" column; checked that a day
  of feeding stays under `PET_UPKEEP_MAX_MIN` minutes of farming where pets first become affordable, and
  that a bigger portion is never dearer per belly.
- **Farming / alchemy**: each crop's seed against what its harvest sells for, and each recipe's ingredient
  cost against what its potions sell for. Both must stay below cost (checked), so gardens aren't gold
  farms; seeds and garden plots are small sinks (`docs/places/alchemy.md`). The farming table also shows
  herbs an hour from the two free plots: brewing is meant to be well worth the time. Brewed EXP and gold
  buffs (`exp`, `gold` on a potion's `buff`) speed up the faucets for whoever drinks one; the gold one
  needs Citadel cogs, so it only helps late players and is kept small.
- **Checks**: aimed sinks cost between `AIM_MIN` and `AIM_MAX` of the gold earned by their aim level;
  house sizes get dearer; furniture: every piece priced, a piece 4× the size of another (rugs aside) never
  cheaper, one of every piece costing between the gold earned by `SET_FROM` and `SET_TO`; nothing in the shop sells for what it costs; no mob is a gold farm (far more
  gold per EXP than its neighbours).

## The frozen legacy curves (island depth, `story/world/island-depth.md`)
`CURVE` in the script is today's mobs and gear written down level by level on 2026-10-20 (smoothed knots
through the legacy mobs; the sword and helmet ladder itself), carried on past the last knot as a power law
so it reaches the later islands' bands (to Lv 200). **Never refit it**: the rebalance will move the legacy
mobs onto it, and every new mob and item is priced against it, so the levelling speed and the house and
shop aims stay valid. A power-law fit was tried first and rejected: it ran about twice today's EXP at
Lv 5–20, which would have doubled early levelling.
- The CURVES table prints it; MOBS vs THE CURVE shows each spawning mob as a % of it. Mobs listed in
  `LEGACY_MOBS` are the curve and aren't checked; **every other mob must sit within `MOB_FIT`** (HP and
  attack loosely, so a gimmick can trade one for the other; EXP and gold tightly).
- **Gear with a `lvl`** (anything new) must be within `GEAR_FIT` of the sword or helmet curve: about as
  strong as the curve there, never much stronger.
- **Elites** (`ELITE_*` in rpg.js) are checked against their base mob: never more gold per EXP. They don't
  count as what a player farms ("farming your own level" picks ordinary mobs).
- **Field bosses** sit in the boss table (kind `field`) and must be worth `FIELD_BOSS_WORTH` minutes of
  farming in gold and in EXP (dens are worth 6–20×); `FIELD_BOSS_RESPAWN_MS` must be at least 10 min.

## Trading (2026-10-23)
Players can trade coins and items (`docs/social/trading.md`). That moves gold rather than making it, so
the script doesn't change, but every sink is priced against ONE player's income: with trading, boss
farmers can fund friends, so pooled gold meets those prices (the Rebirth's 500k, house sizes, pets).
Treat aims as "earliest a funded player gets there", and keep prestige sinks for the farmers themselves.

## How to price something new
1. Decide who it's for: the level (or stage) a player should be able to buy it at. That's its `aim`.
2. Read "gold earned by then" for that level and price it at roughly half to three quarters of it: a real
   goal, but not everything they have (potions keep costing). Add the `aim` to the data when the item
   lives in a list the script reads (like `HOUSE_SIZES`, or an `ITEMS` entry sold in a shop: every
   shopkeeper's stock in `SHOPS` is read); otherwise add it to the script's sinks list.
3. Something meant only for players who farm bosses (a prestige item) gets no `aim`: price it against
   the boss rows (a few dozen late-boss kills), and say so in a comment.
4. Re-run the script and keep the checks green. If you have to break a target, write down why here.

## How to scale a new mob, boss or stage
- Gold per EXP falls smoothly from the first stage to the last; a new mob should land between its
  neighbours by level. Kills per level stay roughly flat (a handful), so levels come at a steady pace.
- Drops are mostly gold and materials (sold at `SELL_RATE`); gear drops are rare. Bosses drop a lot more
  (see their "vs 1 min farming" column) because the fight is hard and the loot is shared, one set per kill.
- A stage's shop prices and the next house size should be reachable around the levels that stage is for
  (its `ZONES` level ranges).

## What the numbers say (snapshot 2026-10-20, re-run for the current state)
- **Mob farming is balanced and smooth.** Gold per EXP falls steadily from the Wildwood to the Citadel
  and kills per level stay flat. The Progress table's play times assume `KILLS_PER_MIN` at every level,
  which is optimistic late on (late mobs have far more HP), so they're a lower bound; "gold earned by
  then" doesn't depend on the kill rate.
- **Bosses are the real faucet, and their gear is the biggest part of it.** A late boss's unique gear
  sells to Pip for many minutes of farming (gear prices climb steeply and `SELL_RATE` applies to them
  too), and bosses respawn every `BOSS_RESPAWN_MS`. Real saves show it: most players hold a few thousand
  gold, but one who farmed bosses far past the last stage's levels holds millions.
- **Until houses, there was almost nothing to spend gold on** once you had stage-one gear: shop gear tops
  out early, potions are cheap next to late income, and the Boutique is pocket change. House sizes
  (`HOUSE_SIZES`) and furniture (bought one piece at a time at the furniture store, big pieces dear)
  are the first sinks that scale with the whole game, ending in a prestige house size for boss farmers.
- **Ideas if gold keeps piling up** (not done, ask the owner first): sell boss gear for less than other
  items (its own sell rate), more prestige sinks (furniture colours, garden extras, cosmetics with a
  late-game price), or a gold cost on scroll re-tries.
