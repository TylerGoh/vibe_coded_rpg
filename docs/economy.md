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
  gold a minute, minutes a level, play time to reach a level against the target pace (`LEVEL_MIN`), and
  gold earned by then. Checked: play time to each level from 20 on within `LEVEL_PACE` of the target.
- **Sinks**: every price, the level whose lifetime farming gold first reaches it, and for sinks with an
  `aim` level: **minutes of farming at that level** (the key number for pricing since L2) against its band
  in `PRICE_BANDS`. Furniture has its own table: price, size, first affordable level, and minutes of
  farming at three levels, plus what one of every piece costs.
- **Pets** (mini bosses for houses, `PETS`): aimed at their boss's level (`PRICE_BANDS` pet band, about 20
  minutes of farming there), never under the floor `PET_MIN`, never cheaper than an earlier boss's pet; the
  table also shows each one in kills of its own boss. Kept out of the furniture checks. Pets
  eat (`docs/places/pets.md`): the pet food table and a "food a month vs price" column; checked that a day
  of feeding stays under `PET_UPKEEP_MAX_MIN` minutes of farming where pets first become affordable, and
  that a bigger portion is never dearer per belly.
- **Farming / alchemy**: each crop's seed against what its harvest sells for, and each recipe's ingredient
  cost against what its potions sell for. Both must stay below cost (checked), so gardens aren't gold
  farms; seeds and garden plots are small sinks (`docs/places/alchemy.md`). The farming table also shows
  herbs an hour from the two free plots: brewing is meant to be well worth the time. Brewed EXP and gold
  buffs (`exp`, `gold` on a potion's `buff`) speed up the faucets for whoever drinks one; the gold one
  needs Citadel cogs, so it only helps late players and is kept small.
- **Changing class**: `rebirthCost` (S2's Rebirth Pool, not used in the game yet) against the sheet's own
  gold an hour, within `REBIRTH_FIT`.
- **Classes** (S2.4): three tables, the CLASSES section below.
- **Long buffs** (SP1, `story/skills-plan.md`): every long buff (`isLongBuff`) at its top rank, what it does and its
  `exp` share. An `exp` effect is a faucet: every kill's EXP × (1 + share) for everyone it reaches (`kill()` in
  `server/rpg.js`, through `statsFor`'s `exp`). SP4's Holy Symbol is the first: `HOLY_SYMBOL_EXP` a rank (in
  `src/shared/skills.js`), folded into the pace: PROGRESS has a "with Holy Symbol" column (farming with a Priest's
  top rank from Lv 60 on, `minutesWithSymbol`), and the check keeps that pace at or above `LEVEL_PACE`'s floor.
- **Checks**: aimed sinks cost their `PRICE_BANDS` minutes of farming at their aim level, never more than
  `AIM_MAX` of everything farmed by then (early on, where levels take a couple of minutes, the low end gives
  way to `AIM_EARLY` of the savings); house sizes get dearer; furniture: every piece priced, a piece 4× the
  size of another (rugs aside) never cheaper, none dearer than `FURN_MAX_MIN` minutes of farming at
  `FURN_LVL`, one of every piece costing what farming earns in `SET_HOURS` of play; nothing in the shop sells
  for what it costs; no mob is a gold farm (far more gold per EXP than its neighbours).

## The frozen legacy curves (island depth, `story/world/island-depth.md`)
`CURVE` (in `src/shared/curve.js` since L1, so the game's `expToNext` and `rebirthCost` read it too) is today's mobs and gear written down level by level on 2026-10-20 (smoothed knots
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
- **Field bosses** sit in the boss table (kind `field`). Since SP6 each one the sheet can fight is priced a minute of
  its fight (`FIELD_PAY`, below); one under `CLASS_LVL` (Turnipop) must still be worth `FIELD_BOSS_WORTH` minutes of
  farming in gold and in EXP. `FIELD_BOSS_RESPAWN_MS` must be at least 10 min.

## Bosses are no longer the EXP faucet (S0, 2026-10-23)
The over-level falloff (`overlevelScale`) and the den bosses' reward window (`BOSS_WINDOW_MS`,
`docs/combat/bosses.md`). BOSS PAY's "an hour" column (since SP6; before, the boss table's "camped 1 h") is a den boss
killed every `BOSS_RESPAWN_MS` + its sheet fight (the Novices' dens: `CAMP_FIGHT_MIN`), against an hour of farming mobs
at its level, in EXP and in gold (loot sold); the check keeps the EXP under `BOSS_CAMP_MAX`. The Progress table
doesn't change: it farms mobs at your own level.

## Staves (S1, 2026-10-23)
A staff is priced exactly like its twin sword and drops in its place, never as well, so no faucet moved;
the script counts staves as gear, checks a staff with a `lvl` against the sword curve (its MAGIC as if
ATK), checks every staff matches its twin, and that every boss drops a weapon with a staff twin.

## Bows (S4, 2026-10-24)
The same for bows: made from their twin sword (same price, `lvl`, slots, ATK), so drops (one of three kinds now,
never more) and the branch traders' stock move no faucet. The script counts bows as gear on the sword curve,
checks each matches its twin, and that every sword with a staff twin (legacy ones aside) has a bow twin, so
every boss drops something for every class.

## The rebalance (R, 2026-10-23)
Frostpeak's, Emberdeep's and the Citadel's mobs and bosses moved to their new bands (`docs/combat/stages.md`)
and left `LEGACY_MOBS` (only the Wildwood's three are still "the curve"), so they're checked within
`MOB_FIT` like new mobs. How the numbers were set (a one-off; the code holds the values):
- A mob keeps its personality: each stat is its old share of the curve (clamped into `MOB_FIT`) times the
  curve at its new level. The kill's worth too: materials kept their prices, so its coins were set to
  make up the rest. The Cogbit (only split off a Cogling) scaled with the Cogling.
- A den boss's HP, attack, EXP and coins scaled by the curve's own ratio between its old and new level.
  Its gear copies sit on the gear curve and are priced on `swordPrice`/`helmetPrice`, which climb faster
  than mob gold, so a raised den's coins and materials are only 3–6× a minute of farming now (the
  "vs 1 min" column) while gear makes up more of its worth; camped gold is about 3–6×. Its EXP camped is
  unchanged (0.5–0.8×).
- PROGRESS hardly moved below Lv 60. Between 60 and 90 the farmed mob is now a Lv 58 one (nothing sits
  there until Frostpeak's depth pass): "gold earned by" Lv 80 went from ~175k to ~187k, Lv 70 unchanged.
- Pets (`PETS` in `src/shared/house.js`) must get dearer by boss level, so the raised bosses' pets went up
  (Glacia 230k, the Wyrm 280k, Ignis 360k, Pyra 400k, the Colossus 450k; Chronos stays the top at 500k).
- Runa's hood and harpoon copies are aimed at Lv 44.

## Trading (2026-10-23)
Players can trade coins and items (`docs/social/trading.md`). That moves gold rather than making it, so
the script doesn't change, but every sink is priced against ONE player's income: with trading, boss
farmers can fund friends, so pooled gold meets those prices (changing class, house sizes, pets).
Treat aims as "earliest a funded player gets there", and keep prestige sinks for the farmers themselves.

## Frostpeak's depth pass, F1 (2026-10-23)
The Rimeglass Glacier (`docs/places/glacier.md`) put six mobs on the curve at Lv 61–73, so "farming your own
level" between 60 and 90 now picks a glacier mob instead of the Lv 58 thorn stalker. That undoes the
rebalance's bump: "gold earned by" Lv 70 ~137k → ~134k, Lv 80 ~187k → ~176k (where it was before R), Lv 90
~249k → ~228k, and everything after drops by the same ~23k; play time to Lv 90 2.0 h → 1.7 h. Nothing was
re-aimed: the Estate (aim 65) stays at 69%, the Grand Estate is first affordable at Lv 120 (was 116), one of
every piece of furniture by Lv 72 (was 71). Eyvind's tier is aimed at Lv 66 (52–67%). Old Rimehorn is worth
~2.6 min of farming; his pet is 350k, between the Root Warden's and Ignis's (`PETSHOP_W` went up to fit it).

## Frostpeak's depth pass, F2 (2026-10-23)
The Whale Skerries and the Narwhal Grotto (`docs/places/skerries.md`, `docs/places/grotto.md`) put ten mobs on
the curve at Lv 56–78 (and two Grotto elites). "Farming your own level" from 78 on now picks the ice skate, so
"gold earned by" barely moved: Lv 80 ~176.1k → ~175.6k, Lv 90 ~227.8k → ~225.3k, later levels ~3k lower; play
time to Lv 100 1.9 h → 1.8 h. Hakon's tier is aimed at Lv 60 (saber and staff 66%, hood 51%). The Old Narwhal
(Lv 70) sits between the Root Warden and the raised Ignis: ~5.9 min of farming a kill in coins and materials,
camped 0.7× EXP / 3.2× gold. Her pet is 345k, between the Root Warden's (340k) and Old Rimehorn's (350k).

## Frostpeak's depth pass, F3 (2026-10-23)
The Aurora Heights and the Blue Halls (`docs/places/heights.md`, `docs/places/bluehalls.md`) put ten mobs on the
curve at Lv 76–88 (and two Blue Halls elites), filling 75–90, which had nothing at its level: "farming your own
level" at 90 now picks the lost star instead of the Lv 78 ice skate. Gold earned barely moved (the new mobs sit
on the curve): Lv 80 ~175.6k (same), Lv 90 ~225.3k → ~224.8k, later levels ~0.9k lower. No trader, so nothing
new is aimed. Two field bosses, each ~2.4 min of farming a kill: the Hall Troll (Lv 88) and the Pale Wyrm
(Lv 90); their pets are 352k and 356k, between Old Rimehorn's (350k) and Ignis's (360k); `PETSHOP_W` went up
to fit them.

## Frostpeak's depth pass, F4 (2026-10-23)
The Queen's Bridge (`docs/places/queensbridge.md`) put six mobs on the curve at Lv 86–98, filling 90–100, which
had only the lost star: "farming your own level" at 100 now picks the rime archer instead of the Lv 100 magma
slug. Gold earned moved a little: Lv 90 ~224.8k → ~225.8k, Lv 100 ~277.0k → ~281.4k, Lv 120 ~402.9k → ~408.7k
(~1.5%; play time unchanged). No trader, so nothing new is aimed. Sigrun (Lv 100, den) is worth ~4.8 min of
farming a kill in coins and materials, camped 0.7× EXP / 3.9× gold, between the Old Narwhal and Pyra. Her pet
is 370k, between Ignis's (360k) and Pyra's (400k); `PETSHOP_W` went up to fit it.

## Emberdeep's depth pass, E0 (atlas Phase 5, 2026-10-23)
Forgehold, the landing town, adds no mobs, so no faucet moved (PROGRESS unchanged). Two traders: **Slag**'s tier
is aimed at Lv 92, the island's start (`lvl` 88 on the gear curve): the Slag Maul and its twin the Bellows Rod
at 156k (66% of gold earned by Lv 92), the Smith's Iron Cap at 123k (52%). **Auntie Soot** sells the basic
potions and the Spring-Boiled Egg (500 HP for 600: a little better per gold than an elixir's HP, no MP), not
aimed. Trading lets boss farmers fund friends to these sooner (see Trading above).

## The levelling rebalance, L1 and L2 (2026-10-23, `story/progression.md`)
**L1, the pace.** `expToNext` = the larger of the old curve and `LEVEL_MIN(L)` minutes of `KILLS_PER_MIN` kills
of the frozen curve's EXP at L (owner's curve "A": `0.5·L^0.65` minutes up to Lv 100, then `L/10`). Mobs and
their EXP didn't move. PROGRESS, play time to reach: Lv 10 19 min (same), Lv 30 48 min → 1.6 h, Lv 60 77 min →
4.5 h, Lv 100 1.8 h → 10.3 h, Lv 150 2.7 h → 23.7 h, Lv 200 ~40 h (the target's 35 h, plus the gaps where the
farmed mob sits well under your level). "Gold earned by" grew with it (Lv 60 ~99k → ~562k, Lv 100 ~281k →
~2.6M), since a minute pays the same and you spend far longer at each level. Bosses: EXP and the camp
column unchanged (both are per hour); a kill is a smaller share of a level now.

**L2, prices in farming time.** The share-of-savings check (25–100% of "gold earned by" the aim) became
minutes at the aim (`PRICE_BANDS`), since savings went up ~5–10× and every aimed price would have looked
cheap. What moved: Bun's tier unchanged (its early levels still go by in a couple of minutes: capped by
the savings); Moss's Driftwood pair 5,000 → 7,000 and Conch Helm 4,000 → 6,000; Truffle's Rootwood/Glowcap
11,000 → 16,000 and Lantern Cap 8,500 → 14,500; Acorn's Billhook/Oakbranch 16,000 → 21,000 and Ranger's Hat
12,000 → 18,000 (all now ~10–12 min); Runa, Eyvind, Hakon and Slag unchanged (11–24 min already). Houses:
Family House 8,000 → 10,000, Estate 80,000 → 130,000 (~30 min at 65), Grand Estate 400,000 → 210,000 and
aimed at Lv 120 (~30 min). Big furniture up: Garden tree 30k → 36k, Piano 25k → 30k, Fireplace 18k → 22k,
Swing 12k → 15k (one of every piece 138k → 156k, ~2.4 h of play). Pets re-priced at ~20 min at their boss's
level with a 20k floor (`PET_MIN`, was 50k): the five Greenhollow den pets 20k, Tidemother 22k, … Sigrun
151k, Pyra 155k, the Colossus 248k, Chronos 270k (was 500k). Nobody is refunded the difference on pets
already bought. `rebirthCost(L)` (for S2) = `REBIRTH_HOURS` of farming gold on the frozen curve: ~16k at
Lv 10, ~224k at Lv 60, ~440k at Lv 100, ~735k at Lv 150.

## The CLASSES tables (S2.4, 2026-10-23, `story/progression.md` 1b)
"Equal power, different shape", measured. Any change to a skill number, `statsFor`, the AP or point
schedule, a boss's HP or ATK, or the gear curve moves these: re-run and say what moved.
- **The builds.** Each branch (Knight, Berserker, Elementalist, Frostbinder, Priest, Warden, Sniper, Trapper) at `CLASS_AT` levels. Points go
  in the order `BUILDS` gives (an id fills to its max, `[id, n]` to n), spent through `cantLearn`, so the
  game's own rules hold: `spNovice` / `spClass`, the `adv` gates; then every passive of the class the build doesn't list (both branches: no fork since
  2026-10-24, and a passive takes no hotbar slot; the other branch's actives stay out, since the hotbar is the
  limit); Novice points fill the Novice
  tree (`NOVICE_ORDER`). AP: the class's main stat, with `AP_LUK` of it in LUK. Gear on the frozen curve: the
  weapon's ATK (a staff's MAGIC, as S1 did; a bow's ATK) on the sword curve, its reach from the nearest real weapon, a
  staff's MP at the real staves' median MP/MAGIC; the helmet on the helmet curve; no scrolls or brews.
  Every number comes from `statsFor` (the sheet puts the curve gear in `ITEMS` for the run and takes it out
  again before the checks).
- **The fight sim** (`fight`): one action every `ACTION_S` (the swing cooldown, `SLAP_COOLDOWN_MS`; the game
  has no global cooldown, but a player presses one thing at a time). Each action: a potion (solo fights,
  under `POTION_AT`), Jelly Patch when hurt, a buff that's down (Berserk, Rally; with a boss hitting back
  also Mana Shield, Jelly Bubble, Sanctuary, Aegis), else the off-cooldown, affordable skill that does the
  most damage, else the normal attack (sword swing, or staff bolt at `STAFF_BOLT_MULT`). Expected damage per
  hit (the average roll and crit, as `roll` in `src/rpg.js`); MP comes back once a second as the server's
  tick does it; hits taken go through `hurt()`'s order (Aegis, Bubble, DEF, Sanctuary, Mana Shield, Second
  Wind); Jelly Thirst heals after each of your hits. Ultimates are taken as dodged and minions ignored.
- **The columns.** Single-target and crowd damage a second over `SIM_S` (the crowd: `CROWD` mobs over
  `CROWD_W` px, so a skill catches as many as its width covers); **ranged** damage a second at a target
  `RANGED_PX` away (only what reaches: that's the Warrior's "bad at range", since everything but Pebble Toss
  is melee); **toughness**: seconds alone, no potions, under a boss on the curve at that level (the dens'
  median ATK against `curve('atk')`) hitting for `BOSS_HIT_MULT` every `BOSS_HIT_EVERY.warrior`, while doing
  its single-target rotation, capped at `TOUGH_CAP`.
- **Time to solo each den** at the den's own level (dens under `CLASS_LVL` are the Novices' and left out):
  the real boss's HP and ATK, a hit every `BOSS_HIT_EVERY` by class (most often for a Warrior up close, least
  for a Mage, a Cleric or an Archer at range), potions drunk (the biggest shop potion that fits) and their gold, against what the kill pays.
- **Top bosses** (S5.3's party dens, widened in SP6: `top` on the boss, the Root Warden, Sigrun, the Clockwork
  Colossus, Chronos, the final bosses) are left out of the solo table and get **TOP BOSSES**: a party of `PARTY_TEAM`,
  a lopsided one (`LOPSIDED_TEAM`) on a boss with mechanics, and each branch alone, against the mechanics as they meet
  them (pulse, barrier, weak point, the top boss's ultimate: `fight`'s `mech`; adds and focus left out), the HP from
  `bossMaxHp` (never under `PARTY_DEN_HP_FLOOR` slimes' worth). In a team each member runs `PARTY_SIM_S` with the
  boss's hits shared out, the others' spells wearing the barrier, the arrows filling the weak point, the Clerics'
  party-wide heals (`healGive`, `HEAL_GIVE` of their time) and a Knight's Sanctuary covering them (`teamHelp`); the
  Knight in front of a front-only barrier, the rest behind it `PARTY_BEHIND` of the time; alone, `SOLO_BEHIND` and
  `WEAK_JUMP`. The ultimate goes off every `ULT_GAP` s unless a Frostbinder is there to interrupt it, cut by the
  team's best answer (`ultXOf`: a Knight's Sanctuary, `ULT_CLERIC` with a Cleric). Potions are drunk early when a
  pulse or ultimate is coming (you see the warning). Checks below (SP6).
- **RETROFIT** (S5.4): the den and field bosses given party mechanics (`partyLive`, not a party den). Alone none
  switch on, so the solo tables don't move; the table shows a duo (`RETRO_DUOS`) killing each with the mechanics off
  / on. `fight` models armour too now (non-heavy hits cut, your own heavy hits crack it; a partner's cracks aren't
  counted, so it reads a little slow). Focus, curse and adds aren't modelled. No check: it's a guide. Owner's targets (`story/s5-plan.md`): a mixed party wins in a few
  minutes; alone only by playing very well for much longer. The sim plays faster than people do (ordinary dens'
  solo kills came out at 1.5–3 min here before SP6, ~15 since). A duo still moves −8% to +26% with the mechanics on.
- **The shape table**: each class ÷ the other classes' mean, per column (mean of each class's branches).
- **Checks.** Every branch can solo every den: never faints, and its potions cost at most
  `SOLO_POTION_SHARE` of what the kill pays. Every branch's solo time within `CLASS_FIT` of the median of all
  of them. Each class's "bad at" (`BAD_AT`: the Warrior's ranged, the Mage's toughness, the Cleric's crowd, the
  Archer's toughness and crowd) is its lowest column (the Archer: its two lowest) against the others' mean, at
  every level (a crowd bad-at only once someone has an area skill: before the fork every crowd column is the
  single one). And the Mage is the least tough class of all (progression.md: "least HP and DEF"), so no class's
  toughness may fall under the Mage's.
- **What it says (2026-10-23).** Mages out-damage Warriors most at Lv 10–60 (Warrior 0.66–0.81× single
  target), and closer later (0.86–0.88×, the Berserker a little above the Mages from Lv 100); Mages last
  15–30 s under the pressure Warriors shrug off (Jelly Thirst plus DEF and HP: usually past `TOUGH_CAP`),
  so they solo fastest but drink: up to ~16 potions on Chronos, still a few % of what the kill pays. The
  Knight is the slowest soloist (about 1.3–1.5× the median from Lv 99), never needs potions, and has
  Rally for a party. The two Mage branches are near twins here: their difference is control (slows,
  combos, S2.6), which the sim doesn't count. MP hardly limits a Mage once Mana Flow is in. Real fights
  will disagree: watch the damage meter.
- **Tuned to get here** (`src/shared/skills.js`): the Novice skills Slime Bash and Pebble Toss went from a
  1 s / 1.2 s cooldown to 3 s (they were a third of every class's damage forever; "weak once you have a
  class"); Jelly Thirst 3% → 1% a rank (at 3% a rank a Warrior healed 3–4× what a boss did to it: never a
  potion, never in danger); Power Strike (1.6 + 0.42/rank → 1.8 + 0.6) and Cleave (1.3 + 0.33 → 1.5 + 0.4) up
  for both Warrior branches; Rally +15–25% for 15 s every 40 s → +20–40% for 20 s every 30 s (the Knight's
  only damage: it was 1.7–1.8× the median solo time from Lv 99, outside `CLASS_FIT`). Nothing else moved:
  no mob, boss, gold, EXP, price or curve. Arcane Charge (S2.6) adds a damage kind to `fight` when it lands.
- **The Warrior's chase moves (S2.5)** are in `fight` (`CHASE_ACTIONS`): Charge is a dash and a stronger
  hit (two actions, Dash back `CHARGE_RESET` sooner), Leap Slam a jump and a slam (two actions, an area),
  Upward Cut rides on a swing (one action, melee only: the ranged column's ledge stays out of reach, so
  the Warrior's bad-at holds), each landing stacks Momentum. Both Warrior BUILDS take Dash 1, Charge and
  Momentum after their core skills (the Berserker Leap Slam too). What moved: the Warriors' single-target
  damage against the Mages went from 0.86–0.88× to 0.88× at Lv 100 and 0.97–1.02× at Lv 150–200 (the
  Knight solos the dens from Sigrun on ~11% faster; the Berserker the Lv 150+ ones ~8% faster, the Astral
  Wyrm ~20%, and Ignis ~10% slower, since its points moved); Lv 10–60 barely
  moved (few points to spare). Momentum was first +3/4% a stack: the Berserker ran 1.3× the Mages at
  Lv 200, so it's +2/3%. Nothing else moved.

- **The Mage's combos (S2.6)** are in `fight` too: Arcane Charge (a staff bolt that lands stores a charge,
  the next Mage spell spends them; choosing the best action counts them) and burns (a fire spell's
  `BURN_DPS` over `BURN_S`, the stronger kept; summed over a crowd). Chill / freeze is control the sim
  doesn't count, and a shatter needs both Mage branches, so solo fights have none. Both Mage BUILDS take
  Arcane Charge after their branch's Lv 60 skills. Tuned down twice to get here (+30% a charge and 8% burn
  first ran the Mages 15–30% up): at +4/8/12% a charge and a 2% burn, the Mages gained ~5% single target
  (the Elementalist ~10%, and ~15–20% in a crowd, from burns), so Warrior ÷ Mage single target went
  0.88 → 0.82 at Lv 100, 0.97 → 0.90 at 150, 1.02 → 0.94 at 200 (Lv 10–60 barely moved); the Elementalist
  solos dens ~8–10% faster, the Frostbinder ~3–5%. Nothing else moved: no mob, boss, gold, EXP or price.

- **The Cleric (S3, 2026-10-23)** is in `fight`: the holy bolt (`HOLY_BOLT_MULT`, and `HOLY_BOLT_HEAL` of it
  healing itself; a close staff bonk until 2026-10-24), Smite's self-heal, Jelly Heal under `HEAL_AT`, Miracle under `MIRACLE_AT`, Mend under `MEND_AT` (a
  heal a second), the Lantern Wisp, the Barrier's soak and the Totem's cut, and its spirits: their hits on
  every column (they walk to the target), and they **draw** `SPIRIT_DRAW` of a boss's hits (the Seraph
  `SERAPH_DRAW`) onto their own HP while they stand, worn down by the boss too (`BOSS_SUMMON_HIT` every
  `BOSS_SUMMON_S`). Both Cleric BUILDS take a rank of Smite, the Spirit and Jelly Heal first, and Cleanse (S5.2, one
  point, no damage: about 2% off the Cleric's damage at Lv 60, a few seconds on its solo dens). What it says:
  the Cleric's toughness is past `TOUGH_CAP` at every level and it solos every den **without a potion**; it's
  among the slowest soloists from Lv 47 (about 1.0–1.4× the median; the Knight is slower on a couple of
  dens), lowest in a crowd (0.5–0.85× the others' mean from Lv 30), 0.8–1.0× on one target, about even at
  range (Smite and the spirits). Tuned to get here: the bonk 0.9 → 0.7 of MAGIC, Smite
  1.0 + 0.3/rank → 0.9 + 0.25, the Seraph 1.0 + 0.25 → 0.6 + 0.15, Spirit Bond's damage 10% → 6% a rank (the
  Warden ran level with the Mages at Lv 100+), and Holy Power now also strengthens Smite (the Priest was 1.62×
  the median on Pyra). With six branches the median moved, but no Warrior or Mage number did, and nothing
  outside the CLASSES tables: no mob, boss, gold, EXP, price or curve.
  **The holy bolt (2026-10-24)**: the bonk became a ranged bolt (same multiplier) and the Cleric's
  `BOSS_HIT_EVERY` went 3 → 3.5 (it now stands back like a Mage). Only the ranged column moved: the Cleric
  0.83–0.93× → 1.16–1.49× the others' mean (the Mages' and Archers' ratios dip by that much). Single target,
  crowd, toughness, potions and gold didn't; den solo times within a second or two. Its bad-at (crowd) holds.

- **The Archer (S4, 2026-10-24)** is in `fight`: the bow shot (`BOW_SHOT_MULT`), its arrow kinds (`shot`,
  `pierce`, `rain`: all on ATK, Barbed Arrows' bonus on every arrow after the first, which has slowed the mob;
  Snipe's long-shot bonus is left out, the sim's boss stands close), Retreat Shot as a chase move (a dash, then
  a stronger shot, at range too, Dash's own cooldown), Hunter's Mark as a buff on the target (on a crowd only
  one mob of `n` is marked), the Net Trap's Trap Mastery bursts (on mobs that walk in: never at range), and
  Evasion (a share of the boss's hits that miss, counted out evenly). BOSS_HIT_EVERY for the Archer is the
  Mage's: it keeps its distance. Two bad-ats, from the plan's "crowds of mobs, and anything up close": the
  toughness column is a boss hitting it up close. What it says: Sniper and Trapper solo every den at about the
  median time (the Sniper a little under from Lv 99, the Trapper up to 1.1×), drinking a few potions up to ~29
  on Chronos (~5% of what the kill pays); single target 0.9–1.07× the others' mean, crowd 0.8–1.0× (always under
  its single and ranged), ranged 1.3–1.65× (second only to the Mages), toughness a little over the Mage's.
  **Tuned to get here**: Piercing Arrow 1.1 + 0.2/rank → 0.7 + 0.12 and Arrow Rain 0.55 + 0.1 → 0.4 + 0.08 (the
  crowd column ran 1.05–1.12× the others: an Archer out-crowding the Warriors), and the Archer was less tough
  than the Mage (10 s against 18 at Lv 100: the Mage's Mana Shield doubles its HP), so DEX with a bow gives HP
  like STR (`BOW_DEX_HP`) and Evasion went 4% → 7% a rank. Nothing outside the CLASSES tables moved: no mob,
  boss, gold, EXP or curve number, and no Warrior, Mage or Cleric row (the solo table's median now counts eight
  branches). The new sinks are the bows, each at its twin sword's price (Pip's starters, one at each branch
  trader); a drop that used to be a sword or a staff can now be a bow, worth the same.
- **The party dens (S5.3, 2026-10-24).** Switching the Root Warden's and Sigrun's mechanics on barely slowed a lone
  slime in the sim (the Mage got faster: it breaks the barrier and the stagger pays it back), and a party of four
  killed them in under 1:30, so a party den's HP was reshaped instead: never under `PARTY_DEN_HP_FLOOR` (4)
  slimes' worth (`bossMaxHp`, like the final bosses' "four is the floor"), and its base `hp` raised (the Warden
  440k → 600k, Sigrun 760k → 1.05M; EXP, gold and drops unchanged). Now: a mixed party of four 2:00 / 1:56 in the
  sim; alone, median 8:53 / 8:19 (4.4× / 4.3× the party), the Elementalist fastest (~6 min: it's the barrier's
  answer), the Frostbinder fainting at ~2:13 on both (the pulse on 760 HP with potions only; a player who dodges
  better than the sim's hit every 3.5 s gets through), the Trapper fainting on the Warden. Kill pays per minute
  falls for a lone slime, which is the point. Nothing else moved: the two rows left the solo table (and its
  `CLASS_FIT` check) for the PARTY DENS table, and only their HP changed in FAUCETS.
- **S5.4, Greenhollow's retrofit (2026-10-24).** Seven den and field bosses got party mechanics (`docs/combat/bosses.md`).
  Alone nothing switches on, so no solo row, faucet or check moved; the new RETROFIT table shows what a duo feels. Armour
  slows a duo ~20% on the Bramble Behemoth and Old Snapjaw (a partner's cracks aren't modelled: real duos break it faster),
  the Tidemother's pulse and the focus/curse bosses move ~0–9%, and the Hornet Queen's weak point speeds a duo ~7% (the
  stagger). Her called wasps add a little EXP (a `wasp` every `FIELD_ADDS_EVERY` s against an 18k-EXP boss): ignored.
  The owner OK'd the armour's ~20% (2026-10-24).
- **S5.4, Frostpeak's retrofit (2026-10-24).** Six more (Glacia, the Astral Wyrm, the Old Narwhal, Old Rimehorn, the
  Hall Troll, the Pale Wyrm; `docs/combat/bosses.md`). Again only the RETROFIT table moved. The barriers cost a duo
  with no Mage the most: Berserker + Sniper +26% on Glacia, +15% on the Wyrm (its weak point gives some back); a duo
  with a Frostbinder is no slower (0% / -8%). The Narwhal's and the Pale Wyrm's weak points speed a duo ~6–7%;
  Rimehorn's and the Troll's armour +9–10% for the Berserker duo, ~1% with a Knight + Frostbinder (shatters crack it).

## The potions and the loot check (S5.5, 2026-10-24)
The Cleansing Tonic and the Barrier Draught are brews, priced like the others: a batch's ingredients (a
`royal_sap` plus herbs, ~100–140 gold at sell value) cost far more than its potions sell for (checked). Aimed at the
first bosses that will curse or pulse (the Tidemother, Lv 25, in S5.4's draft), where a batch is a few seconds of
farming in herbs; the real price is the royal sap, a boss drop, and `CURE_CD` keeps them a poor answer. They drop
from nothing and sell to nobody's profit, so no faucet, sink or PROGRESS number moved. The new LOOT BY CLASS table
lists each boss's twinned weapon; the check (`LOOT_TWIN_LVL` up) found every boss already had one.

## The skill pool's machinery (SP1, 2026-10-24)
Ships dark: long buffs, fields, bleed and poison, on-kill hooks, pulls and the new summons exist, but no skill a
player can learn uses them yet (the test skills only appear with `TEST_SKILLS`, never live), so no faucet, sink or
class table moved (`npm run economy` was identical before and after, plus the empty LONG BUFFS line). SP2–SP5 price
their skills through the CLASSES tables as usual; an `exp` buff goes on the sheet as a faucet.

## The Warrior's skill pool (SP2, 2026-10-24)
`fight` learned SP2's pieces: long buffs held are on for the whole fight (cast beforehand: War Cry's ATK, the Oath's
DEF on yourself), `wave` (Shockwave: `caught` over twice its range, never at range: it runs along your own floor) and
`field` (Cyclone, a Mage's walls: every tick of its whole time in one action), Cleave's targets by rank, bleed ticking
like a burn, Execution's × in the boss's last `EXEC_AT`, Retribution's store (hits taken under Rally, let out by the
next Shield Bash), Bloodlust (`statsAt` passes HP), Unbroken (one attacker: the boss), Rampage (`momentumMax`, and
Whirlwind / Blade Storm stack) and Hook as a two-action chase move (melee only, like Charge). Both Warrior BUILDS
take their branch's new staples as they open, then War Cry and Hook; the new passives come with "every passive".
- **What moved** (single / crowd damage a second, before → after): Knight Lv 30 1,511 / 2,575 → 1,603 / 2,612, Lv 60
  4,365 / 7,606 → 4,813 / 8,644, Lv 100 7,096 / 12,365 → 8,642 / 17,085, Lv 200 14,426 / 25,138 → 17,572 / 35,298;
  Berserker Lv 30 1,699 / 2,767 → 1,810 / 2,926, Lv 60 5,222 / 10,202 → 4,903 / 10,262, Lv 100 9,191 / 17,728 →
  11,071 / 21,955, Lv 200 18,693 / 36,052 → 22,894 / 45,230. Shape (Warrior ÷ the others' mean) single 1.04 → 1.26–1.27
  and crowd 1.26 → 1.64–1.66 from Lv 100 (Lv 30–60 within a few %). The Knight's ranged column doubled (Holy Lance's
  reach passes `RANGED_PX`) but stays its bad-at by far (0.12–0.15). Den solo times: the Knight ~10–20% faster (it
  was the slowest soloist), the Berserker ~10–20% faster from Lv 99 (0.72× the median on Ignis, inside `CLASS_FIT`).
  A full-pack clear for a Lv 100+ Warrior is ~25–40% faster. Nothing outside the CLASSES tables: no mob, boss, gold,
  EXP, price or curve. No EXP buff, so the LONG BUFFS line has no faucet.
- **Why the Warrior now leads both columns from Lv 100**: the sim lets every learned active fire (it doesn't model the
  six hotbar slots, and the K panel's Cast makes the rest reachable anyway), so every new staple adds damage instead
  of replacing the old one. Only the Warrior has its pool so far; SP3–SP5 add the others' the same way, and SP6
  balances all four at once (owner: balance by shape; the Mage should top mobbing). The new skills were tuned down
  once already (first cut: Berserker 0.52× the median on Chronos, failing `CLASS_FIT`): per cast they're stronger than
  the tier before (Rule 1), with long cooldowns so they add less per second.

## The Mage's skill pool (SP3, 2026-10-25)
`fight` learned SP3's pieces: Combustion's × on a burning target (it spends the burn), Thunder Call's `lead` (the
first mob's ×), the Phoenix (a summon that's never hurt and draws nothing, re-cast whenever it's down), and Frost
Armor's DEF and Arcane Insight's MAGIC as long buffs. Two modelling changes:
- **`HOTBAR_SWAPS`**: a new staple takes the hotbar slot of the one a tier before it (`skills-plan.md` Rule 1), so the
  old one stops firing on the sheet: Arcane Burst gives way to Fireball / Frost Nova at Lv 30, Magic Bolt to Flame
  Lance / Frost Bolt, Flame Lance to Combustion at Lv 60, Glacial Spike to Thunder Call at Lv 100. Without it nothing
  could be added: **the Cleric was already at 1.59× the median on Colossus** (`CLASS_FIT` 1.6), so any branch soloing
  den bosses faster moves the median and fails the Cleric. Owner (2026-10-25): swaps apply to every class. The Warrior's were added then
  (Cleave → Ground Shake / Whirlwind → …, Power Strike → Shield Bash / Rending Slash → …), which dropped its sheet
  damage to about 0.75× the others' mean on both single and crowd from Lv 60: SP6 retunes the Warrior's numbers.
- **`FIELD_BOSS_SHARE`**: a planted field counts that share of its ticks on a lone target (a boss walks out of it); a
  pack counts every tick; a field that follows its caster (Cyclone) counts in full. Owner (2026-10-25): keep it (sheet only; in the game a field hits
  whatever stands in it).
- **What moved** (single / crowd damage a second, before → after): Elementalist Lv 30 2,148 / 2,766 → 2,187 / 4,307,
  Lv 60 4,759 / 8,398 → 4,660 / 11,782, Lv 100 7,903 / 14,624 → 7,908 / 19,672, Lv 200 15,994 / 29,597 → 15,998 /
  39,800; Frostbinder Lv 30 2,135 / 3,550 → 2,037 / 3,716, Lv 60 4,595 / 7,228 → 4,707 / 10,528, Lv 100 7,707 /
  12,853 → 7,610 / 20,891, Lv 200 15,597 / 26,011 → 15,397 / 42,265. Shape (Mage ÷ the others' mean): crowd 1.58 →
  2.01 at Lv 30, 1.14 → 1.63 at 60, 0.99 → 1.46 at 100, 0.98 → 1.45 at 200: **the Mage now tops mobbing at every
  advancement** (the Warrior: 1.15 / 1.27 / 1.38 / 1.41). Single 0.90–1.02 from Lv 60 (was 0.91–1.01), ranged ~1.3,
  still the least tough. Den solo times from Lv 99 are unchanged within a second or two (they had no room, above);
  Lv 12–57 dens a little faster (Arcane Burst, Fire Wall). Nothing outside the CLASSES tables: no mob, boss, gold, EXP,
  price or curve; no EXP buff (LONG BUFFS lists Arcane Insight and Frost Armor, no faucet).
- **Farming**: a Mage's full-pack clear from Lv 60 is ~35–60% faster by crowd damage alone, more with Ignite / Cold
  Snap chains (kills aren't on the sheet). `KILLS_PER_MIN` is left as it is (owner: faster farming is fine); SP6
  retunes it with all four classes in.

## The Cleric's skill pool (SP4, 2026-10-25)
`fight` learned SP4's pieces: Sacred Light's heal for each mob it hits, `lightHeal` (alone: on you), a field's heal
ticking on you while it lasts (Radiance, Consecration), Devotion's ward (overheal kept, soaked after the Barrier, at
most `DEVOTION_CAP`), Judgment (alone you're the hurt one: × for one slime under `JUDGMENT_AT`), Genesis (a `starfall`
whose radius covers the room: every target), Sprites (a set whenever they're down: one on a lone target, `min(cap, n)`
in a crowd, the first draws like a spirit), the Stone Guardian (`GUARDIAN_DRAW` of a boss's hits while it stands, its
hits heal), the Warding Totem's pulse (the totem is now planted in every fight when held: the crowd in its ring, a lone
boss `FIELD_BOSS_SHARE` of the time), Resolve's cut while any of your summons stands, and Host (`summonCap`). Both
Cleric BUILDS take Radiance with the basics, their branch's new staples as they open, then Blessing (the Priest also
Holy Symbol); Devotion, Warding Totem and Host come with "every passive". `HOTBAR_SWAPS`: Radiance gives way to Sacred
Light / Sprites, Sacred Light to Consecration; **Smite stays** (the cheap filler with its self-heal: swapping it for
Judgment or the Guardian made the Priest slower at dens than before).
- **What moved** (single / crowd damage a second, before → after): Priest Lv 30 1,649 / 1,649 → 1,756 / 2,030, Lv 60
  3,823 / 3,823 → 4,304 / 5,274, Lv 100 6,240 / 6,240 → 7,094 / 8,962, Lv 200 12,630 / 12,630 → 14,351 / 18,131; Warden
  Lv 30 1,649 / 1,649 → 1,788 / 2,008, Lv 60 3,823 / 3,823 → 4,795 / 5,938, Lv 100 6,809 / 9,275 → 8,438 / 13,271, Lv 200
  13,782 / 18,774 → 17,070 / 26,848. Shape (Cleric ÷ the others' mean): single 0.86 → 1.02–1.05, crowd 0.47–0.61 →
  0.68–0.75, ranged 1.15 → 1.36–1.51, toughness unchanged (past `TOUGH_CAP`). **Still last-but-close at mobbing**: under
  the Mage (1.7–2.0) and the Archer from Lv 60 (0.95–1.04; 0.55 at Lv 30); level with the Warrior (0.67–1.00), which sits
  low on the sheet since SP3's swaps until SP6. Still first at staying alive.
- **Den solo times** (the room SP3 asked for): the Priest 1.45× → 1.19× the median on Colossus (3:45 → 3:05), 3:50 →
  3:12 on Chronos, 2:27 → 2:06 on the Old Narwhal; the Warden 3:21 → 2:54 on Colossus. Lv 12–35 dens within a few
  seconds. The Root Warden's mixed party 1:34 → 1:31 (the Priest in it). The new skills were tuned down once (first cut:
  the Cleric 1.16× single and 0.98× crowd, top of the Archer's crowd column): Judgment, Sacred Light, Consecration,
  Radiance, Genesis, the Guardian, Sprites and the pulse all cut, and Sprites no longer gang up on a lone mob.
- **Holy Symbol**: +`HOLY_SYMBOL_EXP` × 3 = +12% EXP at its top rank for a party with a Priest. The pace with it from Lv 60:
  Lv 100 10.3 → 9.7 h (target 10.0 h), Lv 200 40.4 → 36.6 h (target 34.9 h): inside `LEVEL_PACE`, so the curve stands.
- Nothing else moved: no mob, boss, gold, price or curve (other classes' shape ratios shift a little because the mean
  they're measured against now has a stronger Cleric).

## The Archer's skill pool (SP5, 2026-10-25)
`fight` learned SP5's pieces: Spread Shot (`spread`: one arrow at each of the first few, `min(spread, n)` hits),
Splitting Arrow (`split`: the first mob, then `SPLIT_SHARE` on the ones behind it within `SPLIT_R`, `caught(n, SPLIT_R)`),
Poison Arrow (a dot like the Berserker's bleed: `fight` now reads each dot's own time, `DOTS[kind].s`, where it assumed
`BLEED_S`), the Blast Trap (set where you stand like the Net Trap: the crowd within its radius, a lone boss
`FIELD_BOSS_SHARE` of the time, never one on a ledge), the Hawk (a flier like the Phoenix, on ATK, never on a ledge),
Huntmaster (`huntX`: the traps and the hawk always on a slowed mob for a Trapper with Barbed Arrows), and Focus / Sharp
Eyes as long buffs. Both Archer BUILDS take Spread Shot with the basics, their branch's new staples as they open, then
Sharp Eyes / the Hawk and Focus. `HOTBAR_SWAPS`: Spread Shot gives way to Piercing Arrow / Arrow Rain at Lv 30, Piercing
Arrow to Splitting Arrow and Arrow Rain to the Blast Trap at Lv 60, Poison Arrow to the Hawk at Lv 100; **Double Shot
stays** (the cheap filler, like Smite). Not on the sheet: Ricochet (kills) and Eagle Eye (past `FAR_PX`).
- **What moved** (single / crowd damage a second, before → after): Sniper Lv 30 1,375 / 1,534 → 1,443 / 1,610, Lv 60
  5,744 / 6,467 → 6,317 / 6,990, Lv 100 10,632 / 14,267 → 11,744 / 15,865, Lv 200 21,681 / 29,092 → 23,981 / 32,395;
  Trapper Lv 30 1,390 / 1,612 → 1,432 / 1,619, Lv 60 4,574 / 8,102 → 4,993 / 7,919, Lv 100 7,647 / 14,260 → 8,494 /
  15,428, Lv 200 15,594 / 29,079 → 17,325 / 31,466. Shape (Archer ÷ the others' mean): single 0.76 / 1.22 / 1.28 / 1.29 →
  0.79 / 1.34 / 1.42 / 1.43 (Lv 30 / 60 / 100 / 200): **the Archer tops single-target from Lv 60**; crowd 0.55 / 0.95 /
  1.03 / 1.04 → 0.57 / 0.97 / 1.13 / 1.14: past the Cleric (0.68–0.74) from Lv 60, under the Mage (1.64–1.95); ranged
  1.02–1.63 → 1.07–1.72; still the least tough with the Mage. Crowd and toughness stay its two lowest (`BAD_AT`). The
  others' ratios drop a little against the stronger mean (the Mage's crowd 1.70 → 1.64 at Lv 200, the Warrior's single
  0.72 → 0.69).
- **Den solo times**: the Sniper is the fastest soloist and the closest to `CLASS_FIT`'s floor: Ignis 1:12 → 1:04, Pyra
  1:19 → 1:11 (0.62× the median), Colossus 1:47 → 1:36, Chronos 1:52 → 1:40; the Trapper Colossus 2:25 → 2:09, Chronos
  2:32 → 2:16. The first cut failed there (the Sniper 0.52× the median on Pyra, the Trapper's crowd over the Mage's), so
  the buffs, the Hawk, Poison Arrow, the Blast Trap and Splitting Arrow were all cut; Splitting Arrow now hits about what
  Piercing Arrow did on one mob, its fan reaching wider. **Any more Sniper boss damage fails `CLASS_FIT`**: SP6 should
  slow the Sniper's bossing or speed the others'. Party dens: the Sniper alone 5:10 → 4:49 on the Root Warden.
- **Farming**: an Archer's full-pack clear (the crowd column) is ~5% faster at Lv 30, ~8% (Sniper) at Lv 60 (the
  Trapper ~2% slower there on the sheet: its Blast Trap takes Arrow Rain's slot), ~8–11% from Lv 100, more with Ricochet
  chains. Under the Mage's, so `KILLS_PER_MIN` (set by the class that clears fastest) stays; SP6 retunes it with all four.
- No EXP buff (LONG BUFFS lists Focus and Sharp Eyes, no faucet). Nothing outside the CLASSES tables moved: no mob,
  boss, gold, price or curve.

## The balance pass (SP6, 2026-10-25; owner's brief: `story/roadmap.md`, `story/skills-plan.md`)
- **Every boss hit takes a share of max HP** on top of its flat part (`bossHitPct`: `BOSS_HIT_PCT`, `TOP_HIT_PCT` on a top
  boss, × the move's multiplier; `docs/combat/core.md`). The sheet passes it as `pct` to `fight` (× `BOSS_HIT_MULT`).
  The toughness column leaves it out on purpose: it's the same share for every class, so it only blurs the shape.
- **Fight lengths**, sheet minutes (it plays faster than people): an ordinary den soloed at its level, the eight
  branches' median within `DEN_SOLO_MIN` (~15); a field boss within `FIELD_SOLO_MIN` (~4: the owner left it to judgement,
  "longer than now, well short of a den"; FIELD BOSSES table); a top boss for `PARTY_TEAM` within `TOP_PARTY_MIN` (~45),
  alone `TOP_SOLO` × that (possible, miserable, never locked: at least one branch finishes), a lopsided party within
  `TOP_LOPSIDED_MIN` (70–90 wanted) and drinking at least `LOPSIDED_POTS` a member. Sigrun's lopsided time isn't checked:
  her barrier is front-only and flanking it is everyone's answer, so a party without a healer, Mage or Frostbinder pays
  there in potions (~1,300), not time (~37 min). Nobody in the right party faints.
- **A boss twice your level kills you in `KILL_HITS` hits or fewer** (HITS TO KO): each branch at half the boss's level,
  curve gear there, every passive, no buffs, potions or dodges, under its average hit. On this sheet the most is 5 (the
  Warriors); the roadmap's older count (Warrior 7–11) came from an earlier build, and without the % share the Warriors
  still took 7 on three field bosses.
- **Pay** (BOSS PAY): rewards were rescaled with the fights so an hour of boss fighting pays about what it did: each den
  and top boss's camped EXP and gold an hour back at its pre-SP6 ratio (`BOSS_PAY` keeps the EXP in band; 0.5–0.8× EXP,
  2–6× gold), every field boss `FIELD_PAY` (~1.6) minutes of farming a minute of its fight. EXP and coins moved; gear
  and scrolls stay one set a kill, so coins carry most of the gold (a top boss drops millions). The Bramble Behemoth's
  coins went a little higher than that (8,000–12,600) so a solo Archer's potions stay under `SOLO_POTION_SHARE`.
- **Mechanic shares** shrank with the HP: `BARRIER_HP`, `WEAK_HP`, `TOP_BARRIER_HP`, `TOP_WEAK_HP`, `EGG_HP` (one Mage or
  Archer breaks them about as fast as before).
- **Cross-class** (`SWORD_MASTERY_ATK`): the Warrior went from ~0.7× single and 0.65× crowd from Lv 60 to 0.94× single
  and 0.88–1.04× crowd (between the Cleric and the Mage, as the shape wants). `CLASS_FIT` and `BAD_AT` green; the Sniper
  is no longer at `CLASS_FIT`'s floor (~0.7× the median on the late dens).
- The Novices' dens (Sprout King, Mother Mushroom) weren't lengthened: the sheet can't fight them (no class), and a
  15-minute fight at Lv 4–8 is a question for the owner.

## How to price something new (since L2: in minutes of farming)
1. Decide who it's for: the level (or stage) a player should be able to buy it at. That's its `aim`.
2. Price it in **minutes of farming at that level** (the PROGRESS table's gold/min), by kind
   (`PRICE_BANDS`): potions, pet food, seeds and small furniture 1–3; bigger furniture up to ~10; shop and
   trader gear and the smaller houses 10–20 (weapons ~12, helmets ~10); the high end (big houses, top
   gear, late pets) ~30. Not a share of the gold earned by then: levels are slow, savings pile up, and
   share-of-savings prices all felt cheap (owner: "things shouldn't feel cheap"). Add the `aim` to the
   data when the item lives in a list the script reads (like `HOUSE_SIZES`, or an `ITEMS` entry sold in a
   shop: every shopkeeper's stock in `SHOPS` is read); otherwise add it to the script's sinks list.
3. Something meant only for players who farm bosses (a prestige item) gets no `aim`: price it against
   the boss rows (a few dozen late-boss kills), and say so in a comment.
4. Re-run the script and keep the checks green. If you have to break a target, write down why here.

## How to scale a new mob, boss or stage
- Gold per EXP falls smoothly from the first stage to the last; a new mob should land between its
  neighbours by level. A mob on the curve keeps the pace: `expToNext` is built on the curve's EXP, so a
  level is about `LEVEL_MIN` minutes of farming wherever you are (dozens of kills late on since L1).
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
