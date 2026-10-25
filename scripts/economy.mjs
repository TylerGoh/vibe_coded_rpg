// Docs: docs/economy.md
// The economy balance sheet (npm run economy): every faucet (what mobs and bosses drop) and every sink
// (the shop, the Boutique, furniture, house expansions, seeds), worked out from the live constants, plus the checks that
// keep prices in line with what players can actually earn. Run it after changing any drop, price, EXP
// or HP number; `--check` exits 1 if a check fails. The assumptions it makes are the constants below.
import { BOSS_HIT_PCT, bossHitPct, pulseHpOf, barrierOf, weakHpOf, TOP_ULT_HP, ULT_EVERY, ULT_WARN, PARTY_DEN_HP_FLOOR, MOBS, SPAWNS, ITEMS, SHOPS, COSMETICS, sellPrice, expToNext, KILLS_PER_MIN, LEVEL_MIN, REBIRTH_HOURS, rebirthCost, FIELD_BOSS_RESPAWN_MS, BOSS_RESPAWN_MS, BOSS_WINDOW_MS, BOSS_REPEAT_SHARE, STAFF_OF, BOW_OF, DENS, STAFF_BOLT_MULT, BOW_SHOT_MULT, bossMaxHp, partyActive, PULSE_EVERY, PULSE_WARN, PULSE_HP, BARRIER_EVERY, BARRIER_WARN, BARRIER_S, BARRIER_PHYS, BARRIER_HP, WEAK_EVERY, WEAK_OPEN_S, WEAK_MARK_S, WEAK_MULT, WEAK_HP, STAGGER_S, STAGGER_DMG, ARMOUR_EVERY, ARMOUR_WARN, ARMOUR_S, ARMOUR_CUT, ARMOUR_CRACKS } from '../src/shared/rpg.js';
const SHOP_STOCK = [...new Set(Object.values(SHOPS).flatMap((k) => k.stock))]; // every shopkeeper's
import { curve } from '../src/shared/curve.js';
import { HOUSE_SIZES, FURNITURE, PET_STARVE_MS } from '../src/shared/house.js';
import { CROPS, RECIPES, needs } from '../src/shared/alchemy.js';
import { DOTS, SPLIT_R, SPLIT_SHARE, SKILLS, CLASSES, CLASS_LVL, statsFor, cooldownOf, durOf, spClass, spNovice, cantLearn, rankOf, mpRegen, apTotal, MAX_ROLL, MOMENTUM_MAX, MOMENTUM_DUR, ARCANE_MAX, ARCANE_DUR, spendsArcane, arcaneMult, BURN_DPS, BURN_S, HOLY_BOLT_MULT, HOLY_BOLT_HEAL, healOf, summonHp, summonHit, SPIRIT_HIT_S, SERAPH_R, BOSS_SUMMON_S, BOSS_SUMMON_HIT, WISP_TICK, spiritCap, BARB_BONUS, NET_BURST_R, hitKinds, isLongBuff, fxText, buffFx, momentumMax, EXEC_AT, BLEED_S, RETRI_HOLD, retriMult, targetsOf, statOf, HOLY_SYMBOL_EXP, JUDGMENT_AT, judgmentMult, DEVOTION_CAP, SUMMON_LIGHT, WARD_PULSE_S, RESOLVE_R, summonCap } from '../src/shared/skills.js';
import { SLAP_REACH, SLAP_COOLDOWN_MS, DASH_CD, PHANTOM_CD, CHARGE_RESET } from '../src/shared/sim.js';

// Assumptions (see docs/economy.md): a player farming mobs at their own level, solo, kills about
// KILLS_PER_MIN a minute counting walking, pickups and potion breaks (src/shared/rpg.js: the EXP curve is
// built on it). Bosses aren't counted in "earned by level".
// Prices in farming time (L2, story/progression.md, owner 2026-10-23: "things shouldn't feel cheap"): a sink
// aimed at level L (its `aim`) costs between these many minutes of farming at L, by kind. Levels are slow
// now, so savings pile up: a share of the gold earned by L would make everything cheap. Two guards: never
// more than everything farmed by L (AIM_MAX of it), and early on, where a level is a couple of minutes, the
// low end gives way to AIM_EARLY of the savings instead.
const PRICE_BANDS = { gear: [10, 25], house: [10, 35], pet: [15, 25] };
const AIM_MAX = 1.0, AIM_EARLY = 0.5;
// Furniture: buying one of every piece is a long-term collection goal: between what farming earns in this
// many hours of play from a new character
const SET_HOURS = [1.5, 4];
// Furniture is priced by size, not aimed; the big pieces cost at most FURN_MAX_MIN minutes of farming at
// FURN_LVL (where the bigger houses are bought)
const FURN_LVL = 60, FURN_MAX_MIN = 10;
// Pets are aimed at their boss's level (PRICE_BANDS.pet), but never under this floor (owner, 2026-10-23: a
// floor of ~15-20k, so no pet is trivial)
const PET_MIN = 20000;
// Changing class (rebirthCost in src/shared/rpg.js: REBIRTH_HOURS of farming gold at your level, on the frozen
// curve) must stay within this of the sheet's real farming gold
const REBIRTH_FIT = [0.75, 1.4];
// Pet food (docs/places/pets.md): a day of feeding the cheapest way costs at most this many minutes of
// farming at the level where the cheapest pet is first affordable (care, not a second price tag)
const PET_UPKEEP_MAX_MIN = 5;

// The frozen legacy curves (CURVE, curve()) live in src/shared/curve.js: the game builds expToNext on them.
// Mobs that were there when the curve was frozen and still stand where they stood (the Wildwood's three):
// they're the curve, so they aren't checked against it. The rebalance (R, 2026-10-23) moved Frostpeak's,
// Emberdeep's and the Citadel's onto it at their new levels, so they're checked like everything else. Every
// other mob that spawns must sit within MOB_FIT of the curve at its level: HP and attack loosely (a
// gimmick can trade one for the other), EXP and gold tightly (they set the levelling speed and the gold
// earned by each level).
const LEGACY_MOBS = new Set(['sprout', 'mushling', 'bramble']);
const MOB_FIT = { hp: [0.6, 1.6], atk: [0.6, 1.6], exp: [0.75, 1.35], gold: [0.7, 1.35] };
// Gear with a `lvl` (anything new) must be about as strong as the curve there, never much stronger
const GEAR_FIT = [0.85, 1.1];
// A field boss kill is worth this many minutes of farming at its level (only those the sheet can't fight: under
// CLASS_LVL; the rest are priced per minute of their fight, FIELD_PAY)
const FIELD_BOSS_WORTH = [1.5, 8];
// Camping a den boss (S0, the reward window): a kill every BOSS_RESPAWN_MS + its fight, one full reward per
// BOSS_WINDOW_MS and BOSS_REPEAT_SHARE for the rest. Its EXP an hour must stay under BOSS_CAMP_MAX times farming
// mobs at the boss's level, so bosses are worth doing but not the way to level (before S0, a full reward every kill:
// ~3x at this pace, ~10x for someone strong enough to kill it each minute). The Novices' dens (no class, so the sheet
// can't fight them) still count CAMP_FIGHT_MIN for the fight.
// SP6 (owner, 2026-10-25): rewards scale with the fight, priced per minute of it, so an hour of boss fighting pays
// about what it did: camped for an hour at its sheet fight time (BOSS PAY), a den or top boss's EXP sits within
// BOSS_PAY of farming its level for that hour (before SP6: 0.4-0.9x camped, where the window bit, ~1.5-2x rotating
// dens; gold, the loot sold, stays where it was too: 2-6x). A field boss (respawn
// FIELD_BOSS_RESPAWN_MS, so an hour holds few) pays FIELD_PAY minutes of farming, gold and EXP, a minute of its fight.
const CAMP_FIGHT_MIN = 2;
const BOSS_CAMP_MAX = 2;
const BOSS_PAY = [0.4, 1.2], FIELD_PAY = [1, 2.5];

const avg = ([, chance, lo, hi]) => chance * (lo + hi) / 2;
const isGear = (id) => ['sword', 'staff', 'bow', 'helmet'].includes(ITEMS[id]?.kind);
// What one kill is worth: gold picked up, and what the other drops sell for (gear apart: it's rare and lumpy)
function perKill(m) {
  let gold = 0, sell = 0, gear = 0;
  for (const d of m.drops ?? []) {
    if (d[0] === 'coin') gold += avg(d);
    else if (isGear(d[0])) gear += avg(d) * sellPrice(d[0]);
    else sell += avg(d) * sellPrice(d[0]);
  }
  return { gold, sell, gear, value: gold + sell };
}
const spawned = new Set(SPAWNS.map((s) => s.kind)); // (minions like the Cogbit only come out of other mobs)
const mobs = Object.entries(MOBS).filter(([id, m]) => spawned.has(id) && !m.field); // (elites included)
const bosses = Object.entries(MOBS).filter(([, m]) => m.boss || m.field);
// The mob a level-L player farms: the toughest ordinary one at or below their level (the first one below
// that). Elites are few and far between, so nobody farms only them.
const farmed = (L) => mobs.filter(([, m]) => m.lvl <= L && !m.elite).sort((a, b) => b[1].lvl - a[1].lvl)[0] ?? mobs.sort((a, b) => a[1].lvl - b[1].lvl)[0];
const goldPerMin = (L) => perKill(farmed(L)[1]).value * KILLS_PER_MIN;
// Gold earned by farming from level 1 up to reaching level L
const earnedBy = (L) => {
  let g = 0;
  for (let l = 1; l < L; l++) {
    const m = farmed(l)[1];
    g += (expToNext(l) / m.exp) * perKill(m).value;
  }
  return g;
};
const minutesTo = (L) => {
  let k = 0;
  for (let l = 1; l < L; l++) k += expToNext(l) / farmed(l)[1].exp;
  return k / KILLS_PER_MIN;
};
// SP4's Holy Symbol (an `exp` long buff, HOLY_SYMBOL_EXP a rank): the pace for a slime who farms with a Priest from the
// level it opens (every kill × (1 + its top share)). The check keeps that inside LEVEL_PACE too (HOLY_PACE_MIN)
const HS = SKILLS.holy_symbol, HS_TOP = HS ? HS.fx(HS.max).exp : 0;
const minutesWithSymbol = (L) => {
  let k = 0;
  for (let l = 1; l < L; l++) k += expToNext(l) / farmed(l)[1].exp / (l >= (HS?.adv ?? Infinity) ? 1 + HS_TOP : 1);
  return k / KILLS_PER_MIN;
};

const expPerMin = (L) => farmed(L)[1].exp * KILLS_PER_MIN;
// A den boss camped for an hour, as a multiple of an hour of farming mobs at its level (gold counts the loot)
function campRatio(m, fight = CAMP_FIGHT_MIN) {
  const kills = 60 / (BOSS_RESPAWN_MS / 60_000 + fight), full = Math.min(kills, 60 / (BOSS_WINDOW_MS / 60_000));
  const k = perKill(m), worth = full + (kills - full) * BOSS_REPEAT_SHARE;
  return { exp: (m.exp * worth) / (expPerMin(m.lvl) * 60), gold: ((k.value + k.gear) * worth) / (goldPerMin(m.lvl) * 60) };
}
// SP6: a field boss's pay a minute of its fight, in minutes of farming at its level
const fieldPay = (m, fight) => ({ exp: m.exp / (KILLS_PER_MIN * farmed(m.lvl)[1].exp) / fight, gold: perKill(m).value / goldPerMin(m.lvl) / fight });
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const hrs = (min) => (min < 90 ? `${Math.round(min)} min` : `${(min / 60).toFixed(1)} h`);
const table = (title, rows) => {
  console.log(`\n${title}`);
  console.table(rows);
};

table('FAUCETS: one kill of each mob (gold = coins picked up; sell = other drops sold to Pip; gear = rare gear sold)', Object.fromEntries(mobs.map(([id, m]) => {
  const k = perKill(m);
  return [id, { lvl: m.lvl, hp: m.hp, exp: m.exp, gold: fmt(k.gold), sell: fmt(k.sell), gear: fmt(k.gear), 'gold/exp': (k.value / m.exp).toFixed(2), 'kills/lvl': Math.ceil(expToNext(m.lvl) / m.exp) }];
})));
table('FAUCETS: one boss kill (loot is shared: one set per kill, whoever picks it up; respawn BOSS_RESPAWN_MS, field bosses FIELD_BOSS_RESPAWN_MS)', Object.fromEntries(bosses.map(([id, m]) => {
  const k = perKill(m);
  return [id, { kind: m.field ? 'field' : 'den', lvl: m.lvl, hp: m.hp, exp: m.exp, gold: fmt(k.gold), sell: fmt(k.sell), 'gear sold': fmt(k.gear), 'vs 1 min farming': `${(k.value / goldPerMin(m.lvl)).toFixed(1)}x` }];
})));
// The pace (L1): play time to reach a level against the owner's target, LEVEL_MIN(L) minutes a level
// (src/shared/rpg.js), never faster than the old curve; the check keeps the play time within LEVEL_PACE of it
const LEVEL_PACE = [0.85, 1.25];
const targetTo = (L) => { let t = 0; for (let l = 1; l < L; l++) t += LEVEL_MIN(l); return t; };
const PROGRESS_AT = [5, 10, 13, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 170, 200];
table(`PROGRESS: farming your own level at ${KILLS_PER_MIN} kills/min (mobs only, no bosses)`, Object.fromEntries(PROGRESS_AT.map((L) => [`lvl ${L}`, {
  farming: farmed(L)[0], 'gold/min': fmt(goldPerMin(L)), 'min a level': (expToNext(L) / farmed(L)[1].exp / KILLS_PER_MIN).toFixed(1), 'play time to reach': hrs(minutesTo(L)), [`with Holy Symbol (+${Math.round(HS_TOP * 100)}%)`]: hrs(minutesWithSymbol(L)), 'target (LEVEL_MIN)': hrs(targetTo(L)), 'gold earned by then': fmt(earnedBy(L)),
}])));

// The frozen curves, extended to where the later islands' bands will go (Frostpeak 40–100, Emberdeep
// ~90–150, the Citadel ~140–200), and how each spawning mob sits on them (100% = on the curve)
table('CURVES (frozen; gold = what a kill is worth)', Object.fromEntries([1, 5, 10, 15, 20, 30, 40, 50, 60, 80, 100, 120, 150, 200].map((L) => [`lvl ${L}`, {
  'mob hp': fmt(curve('hp', L)), 'mob atk': fmt(curve('atk', L)), 'mob exp': fmt(curve('exp', L)), 'mob gold': fmt(curve('gold', L)), 'kills/lvl': (expToNext(L) / curve('exp', L)).toFixed(1),
  'sword atk': fmt(curve('sword', L)), 'helmet def': fmt(curve('helmet', L)), 'sword price': fmt(curve('swordPrice', L)), 'helmet price': fmt(curve('helmetPrice', L)),
}])));
const pct = (v, what, L) => `${Math.round((v / curve(what, L)) * 100)}%`;
table('MOBS vs THE CURVE (at each mob\'s level; legacy ones are the curve, so they wobble around it)', Object.fromEntries(mobs.map(([id, m]) => [id, {
  lvl: m.lvl, legacy: LEGACY_MOBS.has(id) ? 'yes' : m.elite ? 'elite' : 'new', hp: pct(m.hp, 'hp', m.lvl), atk: pct(m.atk, 'atk', m.lvl), exp: pct(m.exp, 'exp', m.lvl), gold: pct(perKill(m).value, 'gold', m.lvl),
}])));

// Sinks: what each costs in minutes of farming at the level you'd buy it, and as a share of lifetime gold
const levelFor = (price) => {
  for (let L = 1; L <= 200; L++) if (earnedBy(L) >= price) return L;
  return '>200';
};
const sinks = [
  ...SHOP_STOCK.map((id) => ({ what: `shop: ${ITEMS[id].name}`, price: ITEMS[id].price, aim: ITEMS[id].aim, band: 'gear' })),
  ...Object.values(COSMETICS).map((c) => ({ what: `boutique: ${c.name}`, price: c.price })),
  ...HOUSE_SIZES.slice(1).map((s) => ({ what: `house: ${s.name}`, price: s.price, aim: s.aim, band: 'house' })),
];
// (not the free chest every house has: it isn't sold)
const furniture = Object.entries(FURNITURE).filter(([, f]) => !f.pet && !f.fixed).sort((a, b) => a[1].price - b[1].price);
// pets (mini bosses, sold at the Pet Shop) are prestige buys priced against boss kills, not furniture
const pets = Object.entries(FURNITURE).filter(([, f]) => f.pet).sort((a, b) => a[1].price - b[1].price);
// and they eat: a full belly (food 1) lasts PET_STARVE_MS. Upkeep a day, fed the cheapest way:
const foods = Object.entries(ITEMS).filter(([, it]) => it.food);
const perBelly = (it) => it.price / it.food;
const upkeepDay = Math.min(...foods.map(([, it]) => perBelly(it))) * (86400_000 / PET_STARVE_MS);
const bossWorth = (kind) => { const k = perKill(MOBS[kind]); return k.value + k.gear; }; // one kill's gold, drops sold and gear sold
table('SINKS: what gold buys ("first affordable" = the level where lifetime farming gold reaches the price)', Object.fromEntries(sinks.map((s) => [s.what, {
  price: fmt(s.price), 'first affordable': `lvl ${levelFor(s.price)}`,
  ...(s.aim ? { aim: `lvl ${s.aim}`, 'farming min at aim': Math.round(s.price / goldPerMin(s.aim)), band: `${PRICE_BANDS[s.band].join('–')} min`, 'share of gold by aim': `${Math.round((s.price / earnedBy(s.aim)) * 100)}%` } : {}),
}])));

table('SINKS: furniture (the furniture store), cheapest first', Object.fromEntries(furniture.map(([k, f]) => [k, {
  price: fmt(f.price), size: `${f.w}×${f.h}`, 'first affordable': `lvl ${levelFor(f.price)}`, 'farming min at lvl 10': (f.price / goldPerMin(10)).toFixed(1), 'at lvl 30': (f.price / goldPerMin(30)).toFixed(1), [`at lvl ${FURN_LVL}`]: (f.price / goldPerMin(FURN_LVL)).toFixed(1),
}])));
const petMin = (f) => f.price / goldPerMin(MOBS[f.pet].lvl); // minutes of farming at its boss's level
table('SINKS: pets (aimed at their boss\'s level, with a floor: price vs farming there, and vs kills of the boss)', Object.fromEntries(pets.map(([k, f]) => [k, {
  price: fmt(f.price), boss: `${f.pet} (lvl ${MOBS[f.pet].lvl})`, 'farming min at its lvl': Math.round(petMin(f)), 'kills of it (all loot sold)': (f.price / bossWorth(f.pet)).toFixed(1), 'first affordable': `lvl ${levelFor(f.price)}`,
  'food a month vs price': `${Math.round(((upkeepDay * 30) / f.price) * 100)}%`,
}])));
table('SINKS: pet food (a full belly lasts PET_STARVE_MS; upkeep = a day fed the cheapest way, per pet)', Object.fromEntries(foods.map(([id, it]) => [id, {
  price: fmt(it.price), fills: `${it.food * 100}%`, 'gold per full belly': fmt(perBelly(it)), 'a day, fed only this': fmt(perBelly(it) * (86400_000 / PET_STARVE_MS)),
}])));
const petLvl = levelFor(pets[0][1].price);
console.log(`Pet upkeep: ${fmt(upkeepDay)} gold a day per pet = ${(upkeepDay / goldPerMin(petLvl)).toFixed(1)} min of farming at lvl ${petLvl} (first pet affordable; max ${PET_UPKEEP_MAX_MIN})`);
const setCost = furniture.reduce((a, [, f]) => a + f.price, 0);
// gold farmed in the first `h` hours of a new character's play
const earnedIn = (h) => { let L = 1; while (L < 400 && minutesTo(L + 1) <= h * 60) L++; return earnedBy(L); };
const playFor = (price) => { let L = 1; while (L < 400 && earnedBy(L) < price) L++; return minutesTo(L); };
console.log(`One of every piece: ${fmt(setCost)} gold (farming has earned that by lvl ${levelFor(setCost)}, ${hrs(playFor(setCost))} of play; target ${SET_HOURS.join('–')} h)`);

table(`CHANGING CLASS: rebirthCost (REBIRTH_HOURS = ${REBIRTH_HOURS} h of farming gold at your level, on the frozen curve) vs the sheet's farming`, Object.fromEntries([10, 20, 30, 40, 60, 80, 100, 120, 150, 200].map((L) => [`lvl ${L}`, {
  'rebirthCost': fmt(rebirthCost(L)), 'sheet: gold an hour × REBIRTH_HOURS': fmt(goldPerMin(L) * 60 * REBIRTH_HOURS), ratio: (rebirthCost(L) / (goldPerMin(L) * 60 * REBIRTH_HOURS)).toFixed(2),
}])));

// Farming and alchemy (docs/places/alchemy.md): seeds are a small sink; herbs and brews must sell for less
// than they cost to make, so a garden is never a gold farm (they're for drinking)
const herbCost = (id) => (CROPS[id] ? CROPS[id].seed / ((CROPS[id].yield[0] + CROPS[id].yield[1]) / 2) : sellPrice(id)); // one herb, or a mob material at what Pip pays
table('FARMING: one planting of each crop (sell = the harvest sold to Pip)', Object.fromEntries(Object.entries(CROPS).map(([id, c]) => {
  const sell = ((c.yield[0] + c.yield[1]) / 2) * sellPrice(id);
  return [id, { seed: c.seed, grows: `${c.grow / 60} min`, 'herbs an hour (2 plots)': Math.round((2 * 3600 / c.grow) * ((c.yield[0] + c.yield[1]) / 2)), 'harvest sells for': fmt(sell), 'sell / seed': (sell / c.seed).toFixed(2) }];
})));
const brewCost = (r) => Object.entries(needs(r.steps)).reduce((a, [id, k]) => a + k * herbCost(id), 0);
table('ALCHEMY: one batch of each recipe (cost = seeds for its herbs + its mob materials at sell price)', Object.fromEntries(Object.entries(RECIPES).map(([id, r]) => [id, {
  steps: r.steps.length, makes: r.makes, cost: fmt(brewCost(r)), 'output sells for': fmt(r.makes * sellPrice(id)), does: ITEMS[id].desc.replace(/^Brewed\. /, ''),
}])));

// SP1's long buffs (story/skills-plan.md): an `exp` effect is a faucet (every kill's EXP × (1 + exp) for everyone it
// reaches, server/rpg.js kill), so each one is listed here with what it gives at its top rank. SP4's Holy Symbol is the
// first (HOLY_SYMBOL_EXP a rank, src/shared/skills.js), folded into the pace above (minutesWithSymbol, the PROGRESS column).
const longBuffs = Object.entries(SKILLS).filter(([, sk]) => isLongBuff(sk));
if (longBuffs.length) table('LONG BUFFS (SP1): at the top rank (exp = more EXP from every kill: a faucet)', Object.fromEntries(longBuffs.map(([id, sk]) => [id, {
  cls: sk.cls, lvl: sk.adv, 'lasts (min)': (durOf(id, sk.max) / 60).toFixed(1), 'party radius': sk.party ?? 'just you', does: sk.buffText?.(sk.max) ?? fxText(sk.fx(sk.max)), 'EXP faucet': sk.fx(sk.max).exp ? `+${Math.round(sk.fx(sk.max).exp * 100)}%` : '',
}])));
else console.log('\nLONG BUFFS (SP1): none');

// The loot check (S5.5, story/progression.md 6: "a boss's loot includes one weapon, its kind picked from the classes
// who fought it"): every den and field boss from LOOT_TWIN_LVL drops a sword with both a staff and a bow twin, so
// twinPick (server/rpg.js) can hand each class its own kind. Under it nobody has a class yet.
const LOOT_TWIN_LVL = 10;
const weaponDrops = (m) => (m.drops ?? []).filter(([d]) => STAFF_OF[d] && BOW_OF[d]);
table(`LOOT BY CLASS: each boss's twinned weapon (sword / staff / bow; checked from Lv ${LOOT_TWIN_LVL})`, Object.fromEntries(bosses.map(([id, m]) => [id, {
  lvl: m.lvl, kind: m.boss ? 'den' : 'field', weapon: weaponDrops(m).map(([d, ch]) => `${d} / ${STAFF_OF[d]} / ${BOW_OF[d]} (${Math.round(ch * 100)}%)`).join(', ') || 'none',
}])));

// ——— CLASSES (S2.4, story/progression.md 1b: "equal power, different shape") ———
// Each class and branch at CLASS_AT levels: a build (BUILDS: skill points spent in priority order the way
// the game allows it: spNovice / spClass, the adv gates and one branch, through cantLearn; AP into the main
// stat with AP_LUK of it in LUK), gear on the frozen curve (a sword's ATK, or a staff's MAGIC, on the sword
// curve; the helmet on the helmet curve; no scrolls, no brews) and statsFor for every number. Then a fight
// sim: one action every ACTION_S (the swing cooldown, SLAP_COOLDOWN_MS: a player presses one thing at a
// time), each action the best-damage skill that's off cooldown and affordable, else the normal attack (sword
// swing / staff bolt). Expected damage per hit (the average roll and crit, as src/rpg.js roll does it), MP
// regenerated once a second as server/rpg.js tick does it (none of the HP regen, since a hit lands more often
// than every 5 s), hits taken through hurt()'s order (Aegis, Jelly Bubble, DEF, Sanctuary, Mana Shield,
// Second Wind) and Jelly Thirst healing after each of your hits. Ultimates are dodged (Mobility) and minions
// ignored. The Warrior's chase moves (S2.5) are in too (CHASE_ACTIONS): Charge is a dash then a stronger
// hit (two actions; Dash comes back CHARGE_RESET sooner), Leap Slam a jump then a slam (two actions, an area),
// Upward Cut rides on a normal swing (one action, one target, melee only: the ranged column's ledge is out
// of its reach), and each that lands stacks Momentum (kept up while the chain goes on). The Mage's combos
// (S2.6): Arcane Charge (each staff bolt that lands stores a charge, the next Mage spell spends them; the
// choice of the best action counts them) and burns (a fire spell sets its targets burning for BURN_DPS of its
// damage a second over BURN_S, the stronger burn kept). Chill / freeze is control (a frozen boss is only
// slowed, and the sim's boss doesn't move), and a shatter needs a fire spell on a frost mage's freeze: the
// two Mage branches together, never one alone, so solo fights have none. The Cleric (S3): its normal attack
// is the holy bolt (a staff bolt's range, on MAGIC, HOLY_BOLT_HEAL of it healing itself when alone); Smite heals it a share of its
// damage; Jelly Heal (under HEAL_AT of max HP), Miracle (under MIRACLE_AT), Mend (under MEND_AT, a heal a
// second) and the Lantern Wisp (a heal every WISP_TICK) keep it up; the Barrier soaks hits before they land;
// the Guardian Totem cuts them. Spirits (and the Seraph) add their hits every SPIRIT_HIT_S on any column (they
// walk to the target) and DRAW a share of a boss's hits onto themselves (the boss is after them, so its aimed
// moves go there) until their HP runs out; the totem and every spirit near the boss are also worn down by
// BOSS_SUMMON_HIT of its hit every BOSS_SUMMON_S.
// BUILDS: per branch, its class, then the order points go in (an id fills to its max, [id, n] to n). The
// fork's other branch never appears, so cantLearn keeps it to one; skills not open yet are skipped.
const BUILDS = {
  // (SP2: each branch's new staples as they open, then War Cry and Hook; the new passives come in with "every passive")
  knight: { cls: 'warrior', order: ['jelly_thirst', 'power_strike', 'iron_jelly', 'cleave', 'vitality', 'rally', 'second_wind', ['dash', 1], 'charge', 'momentum', 'jelly_bubble', 'leap_slam', 'shield_bash', 'ground_shake', 'sanctuary', 'holy_lance', 'shockwave', 'aegis', 'judgement', 'guardians_oath', 'war_cry', 'hook', ['blink', 1], 'flash_jump', 'dash', 'blink', 'phantom_step'] },
  berserker: { cls: 'warrior', order: ['power_strike', 'jelly_thirst', 'berserk', 'whirlwind', ['dash', 1], 'charge', 'momentum', 'iron_jelly', 'cleave', 'rending_slash', 'leap_slam', 'sword_mastery', 'blade_storm', 'execution', 'sky_splitter', 'cyclone', 'war_cry', 'hook', 'upward_cut', ['blink', 1], 'flash_jump', 'dash', 'blink', 'phantom_step'] },
  // (SP3: Arcane Burst with the basics, each branch's new staples as they open, then Arcane Insight; the passives come with "every passive")
  elementalist: { cls: 'mage', order: ['magic_bolt', 'arcane_mind', 'arcane_burst', 'mana_shield', 'fireball', 'fire_wall', 'flame_lance', 'kindling', 'meteor', 'combustion', 'arcane_charge', ['dash', 1], 'starfall', 'phoenix', 'arcane_insight', 'mana_flow', ['blink', 1], 'flash_jump', 'dash', 'blink', 'phantom_step'] },
  frostbinder: { cls: 'mage', order: ['magic_bolt', 'arcane_mind', 'arcane_burst', 'mana_shield', 'chain_lightning', 'frost_nova', 'frost_bolt', 'frost_armor', 'glacial_spike', 'blizzard', 'arcane_charge', ['dash', 1], 'absolute_zero', 'thunder_call', 'arcane_insight', 'mana_flow', ['blink', 1], 'flash_jump', 'dash', 'blink', 'phantom_step'] },
  // (SP4: Radiance with the basics, each branch's new staples as they open, then Blessing and the Priest's Holy Symbol;
  // Devotion, Warding Totem and Host come with "every passive")
  priest: { cls: 'cleric', order: [['smite', 1], ['jelly_spirit', 1], ['heal', 1], 'smite', 'radiance', 'jelly_spirit', 'heal', 'faith', 'cleanse', 'sacred_light', 'mend', 'lantern_wisp', 'consecration', 'judgment', 'holy_power', 'revive', 'genesis', 'miracle', 'holy_symbol', 'blessing', ['dash', 1], ['blink', 1], 'flash_jump', 'dash', 'blink', 'phantom_step'] },
  // the Archer (S4): its core arrows first, Dash early for Retreat Shot, Evasion for the boss fights (SP5: Spread Shot
  // with the basics, each branch's new staples as they open, then Focus and Sharp Eyes; Ricochet, Eagle Eye and
  // Huntmaster come with "every passive")
  sniper: { cls: 'archer', order: ['double_shot', 'steady_hands', 'spread_shot', 'evasion', ['dash', 1], 'retreat_shot', 'keen_eye', 'snipe', 'piercing_arrow', 'deadeye', 'splitting_arrow', 'hunters_mark', 'heartseeker', 'sharp_eyes', 'bow_focus', ['blink', 1], 'flash_jump', 'dash', 'blink', 'phantom_step'] },
  trapper: { cls: 'archer', order: ['double_shot', 'steady_hands', 'spread_shot', 'evasion', ['dash', 1], 'retreat_shot', 'keen_eye', 'arrow_rain', 'poison_arrow', ['net_trap', 1], 'barbed_arrows', 'blast_trap', 'trap_mastery', 'net_trap', 'thousand_arrows', 'hawk', 'bow_focus', ['blink', 1], 'flash_jump', 'dash', 'blink', 'phantom_step'] },
  warden: { cls: 'cleric', order: [['smite', 1], ['jelly_spirit', 1], ['heal', 1], 'smite', 'radiance', 'jelly_spirit', 'faith', 'cleanse', 'heal', 'sprites', 'barrier', 'guardian_totem', 'stone_guardian', 'spirit_bond', 'seraph', 'resolve', 'blessing', ['dash', 1], ['blink', 1], 'flash_jump', 'dash', 'blink', 'phantom_step'] },
};
// SP3: a new staple takes the hotbar slot of the one a tier before it (story/skills-plan.md, Rule 1: "the new one
// replaces the old on the hotbar"), so the old one stops firing once the new one is held. Every class's (owner,
// 2026-10-25): the Mage's, the Warrior's, the Cleric's (SP4: Smite stays, the cheap filler with its self-heal).
const HOTBAR_SWAPS = {
  arcane_burst: ['fireball', 'frost_nova'], magic_bolt: ['flame_lance', 'frost_bolt'], flame_lance: ['combustion'], glacial_spike: ['thunder_call'],
  cleave: ['ground_shake', 'whirlwind'], ground_shake: ['shockwave'], shockwave: ['judgement'], whirlwind: ['blade_storm'], blade_storm: ['cyclone'],
  power_strike: ['shield_bash', 'rending_slash'], shield_bash: ['holy_lance'], rending_slash: ['execution'], execution: ['sky_splitter'],
  radiance: ['sacred_light', 'sprites'], sacred_light: ['consecration'], // (SP4: the Cleric's; Smite stays, the filler between its big spells)
  spread_shot: ['piercing_arrow', 'arrow_rain'], piercing_arrow: ['splitting_arrow'], arrow_rain: ['blast_trap'], poison_arrow: ['hawk'], // (SP5: the Archer's; Double Shot stays, its filler)
};
const NOVICE_ORDER = ['slime_bash', 'pebble_toss', 'jelly_patch']; // (nine points fill all three by Lv 9)
const CLASS_AT = [10, 30, 60, 100, 150, 200];
const AP_LUK = 0.2; // share of AP in LUK (the rest in the class's main stat)
const ACTION_S = SLAP_COOLDOWN_MS / 1000;
const SIM_S = 60; // the rotation's length for the damage columns
const CROWD = 5, CROWD_W = 300; // the crowd column: 5 mobs standing over this many px
const RANGED_PX = 200; // the ranged column: a target this far away (on a ledge, across a gap)
// Hits taken in a boss fight: a solo player who dodges well still takes one every BOSS_HIT_EVERY s, of the
// boss's ATK × BOSS_HIT_MULT (OUCH in server/rpg.js: its moves hit for 1.1–1.5×); more often up close (a
// sword) than from range (a staff: progression.md 1b, "kills fast before it gets hit much"). The toughness
// column puts every class under the same melee pressure from a boss on the curve at its level (the dens'
// own ATK against curve('atk'), their median).
const BOSS_HIT_EVERY = { warrior: 2.5, mage: 3.5, cleric: 3.5, archer: 3.5 }, BOSS_HIT_MULT = 1.25; // (by class: only the Warrior fights up close)
// The Cleric's choices (S3): heal under these shares of max HP; a spirit draws SPIRIT_DRAW of a boss's hits
// (the Seraph SERAPH_DRAW) while it stands
const HEAL_AT = 0.65, MEND_AT = 0.85, MIRACLE_AT = 0.45, SPIRIT_DRAW = 0.5, SERAPH_DRAW = 0.75;
// SP4: the stone guardian taunts every GUARDIAN_TAUNT_S (a boss too): it draws GUARDIAN_DRAW of a boss's hits while it
// stands; the Warding Totem's pulse and a planted field catch a lone boss FIELD_BOSS_SHARE of the time (below)
const GUARDIAN_DRAW = 0.75;
const TOUGH_CAP = 600; // s: the toughness column stops counting here ("outlasts")
// Solo: drink the biggest shop potion that fits when HP falls under POTION_AT (an action each); a branch
// can solo a den if it never faints and its potions cost at most SOLO_POTION_SHARE of what the kill pays
// (coins, drops and gear sold: a solo kill has to pay for itself)
const POTION_AT = 0.4, SOLO_POTION_SHARE = 0.5;
// Each branch's time to solo a den (at the den's level) within CLASS_FIT of the median of all four branches
const CLASS_FIT = [0.6, 1.6];
// Each class's "bad at" (progression.md 1b): its lowest column against the other classes' mean (BAD_AT). The
// Archer has two ("crowds of mobs, and anything that gets up close": the toughness column is a boss up close),
// so they must be its two lowest. And the Mage is the least tough class of all ("least HP and DEF").
const BAD_AT = { warrior: ['ranged'], mage: ['tough'], cleric: ['crowd'], archer: ['tough', 'crowd'] };

const SHEET_W = '__sheet_weapon', SHEET_H = '__sheet_helmet';
const realWeapons = (kind) => Object.entries(ITEMS).filter(([id, it]) => it.kind === kind && !id.startsWith('__'));
const powerOf = (it) => it.atk ?? it.magic;
const reachNear = (kind, p) => realWeapons(kind).map(([, it]) => it).sort((a, b) => Math.abs(powerOf(a) - p) - Math.abs(powerOf(b) - p))[0].reach;
const staffMp = (() => { const r = realWeapons('staff').map(([, it]) => it.mp / it.magic).sort((a, b) => a - b); return r[r.length >> 1]; })();
function gearAt(L, kind) {
  const p = Math.round(curve('sword', L));
  ITEMS[SHEET_W] = kind === 'staff' ? { name: 'sheet staff', kind, magic: p, mp: Math.round(p * staffMp), reach: reachNear(kind, p) } : { name: `sheet ${kind}`, kind, atk: p, reach: reachNear(kind, p) };
  ITEMS[SHEET_H] = { name: 'sheet helmet', kind: 'helmet', def: Math.round(curve('helmet', L)) };
}
function classChar(branch, L) {
  const b = BUILDS[branch], cls = CLASSES[b.cls];
  gearAt(L, cls.weapon);
  const c = { lvl: L, cls: b.cls, skills: {}, gear: { weapon: SHEET_W, helmet: SHEET_H } };
  // no fork since 2026-10-24: the build's own actives (the hotbar holds only HOTBAR of them), then every passive
  // of the class it doesn't list yet, both branches (a passive takes no slot)
  const passives = Object.keys(SKILLS).filter((id) => SKILLS[id].cls === b.cls && SKILLS[id].kind === 'passive' && !b.order.some((e) => (Array.isArray(e) ? e[0] : e) === id));
  for (const e of [...NOVICE_ORDER, ...b.order, ...passives]) {
    const [id, cap] = Array.isArray(e) ? e : [e, SKILLS[e].max];
    while (rankOf(c.skills, id) < cap && !cantLearn(c, id)) c.skills[id] = rankOf(c.skills, id) + 1;
  }
  const ap = apTotal(L), luk = Math.round(ap * AP_LUK);
  c.ap = { [cls.stat]: ap - luk, luk };
  return c;
}
const avgHit = (st) => ((st.minRoll + MAX_ROLL) / 2) * (1 + st.crit * (st.critMult - 1));
// the chase moves: actions each one takes (a dash or a jump first), and how many targets it can catch
// (the Archer's Retreat Shot, S4: a dash, then a stronger bow shot; Dash comes back at its own pace)
const CHASE_ACTIONS = { charge: 2, leap_slam: 2, upward_cut: 1, retreat_shot: 2, hook: 2 }; // (Hook, SP2: the throw, then the ride; melee only, like Charge)
const dashCd = (c) => (DASH_CD[rankOf(c.skills, 'dash')] / 60) * (1 - PHANTOM_CD * rankOf(c.skills, 'phantom_step'));
const chaseCd = (c, id) => (id === 'charge' ? dashCd(c) * (1 - CHARGE_RESET[rankOf(c.skills, 'charge')]) : id === 'retreat_shot' ? dashCd(c) : cooldownOf(id, rankOf(c.skills, id)));
const DAMAGE_KINDS = new Set(['strike', 'cleave', 'spin', 'storm', 'bolt', 'fireball', 'chain', 'meteor', 'nova', 'starfall', 'shot', 'pierce', 'rain', 'wave', 'field']);
const PHYS = new Set(['strike', 'cleave', 'spin', 'storm', 'shot', 'pierce', 'rain', 'wave']);
const ARROWS = new Set(['shot', 'pierce', 'rain']); // (Barbed Arrows: everything after the first arrow hits a slowed mob)
const barbed = (c) => 1 + BARB_BONUS * rankOf(c.skills, 'barbed_arrows');
// SP5's Huntmaster: traps and the hawk on a slowed mob (a Trapper with Barbed Arrows slows whatever it shoots: always)
const huntX = (c) => (rankOf(c.skills, 'barbed_arrows') && rankOf(c.skills, 'huntmaster') ? 1 + SKILLS.huntmaster.bonus(rankOf(c.skills, 'huntmaster')) : 1);
// how many of n targets standing over CROWD_W px a hit `w` px wide catches
const caught = (n, w) => (n === 1 ? 1 : Math.min(n, Math.max(1, (n * w) / CROWD_W)));
// SP3: a planted field (not one that follows its caster, like Cyclone) on a lone target, a boss, catches it only
// FIELD_BOSS_SHARE of its time: a boss walks, charges and leaps about its den; a pack stands in it
const FIELD_BOSS_SHARE = 0.5;
// (SP2: wave, Shockwave, along the floor both ways; field, a field's every tick over its whole time, in one action:
// Cyclone carried through the pack, a Mage's walls; a strip covers 2 × radius too)
function hitsOf(sk, st, n, rank) {
  const melee = SLAP_REACH + st.reach + (sk.reach ?? 0);
  return {
    wave: caught(n, 2 * (sk.range ?? 0)), field: sk.kind === 'field' ? (sk.dur / (sk.every ?? 1)) * caught(n, 2 * sk.radius) * (n === 1 && !sk.follow ? FIELD_BOSS_SHARE : 1) : 0,
    strike: 1, cleave: Math.min(targetsOf(sk, rank), caught(n, melee)), spin: caught(n, 2 * sk.radius), storm: sk.hits * caught(n, 2 * sk.radius),
    bolt: 1, fireball: caught(n, 2 * sk.radius), chain: Math.min(sk.targets, n), meteor: caught(n, 2 * sk.radius), nova: caught(n, 2 * sk.radius), starfall: caught(n, 2 * sk.radius),
    // (SP5: Spread Shot, an arrow at each of the first `spread`; Splitting Arrow, its first mob then SPLIT_SHARE on the ones
    // behind it within SPLIT_R, up to `split`)
    shot: sk.spread ? Math.min(sk.spread, n) : sk.split ? 1 + SPLIT_SHARE * Math.min(sk.split, caught(n, SPLIT_R) - 1) : sk.arrows, pierce: Math.min(targetsOf(sk, rank), n), rain: sk.hits * caught(n, 2 * sk.radius),
  }[sk.kind];
}
function rangeOf(sk, st) {
  if (sk.kind === 'strike' || sk.kind === 'cleave') return SLAP_REACH + st.reach + sk.reach;
  if (sk.kind === 'wave') return 0; // (Shockwave runs along your own floor: never up to a ledge)
  if (['spin', 'storm', 'nova', 'starfall', 'field'].includes(sk.kind)) return sk.radius;
  return sk.range;
}
// one cast's expected damage on n targets (0 if it can't reach `range`). c: the character (Barbed Arrows, the net)
function castDmg(id, rank, st, n, range, c) {
  const sk = SKILLS[id];
  if (sk.what === 'net') { // Net Trap: only its Trap Mastery bursts do damage, on mobs that walk into it (never one on a ledge)
    const tm = rankOf(c.skills, 'trap_mastery');
    return tm && !range ? st.atk * SKILLS.trap_mastery.burst(tm) * avgHit(st) * Math.min(1 + tm, n) * caught(n, 2 * NET_BURST_R) * huntX(c) : 0;
  }
  // SP5's Blast Trap: set where you stand, the first mob over it sets it off on everything near; a lone boss walks over it
  // FIELD_BOSS_SHARE of the time (never one on a ledge)
  if (sk.what === 'blast') return !range ? summonHit(id, rank, st) * avgHit(st) * (n === 1 ? FIELD_BOSS_SHARE : caught(n, 2 * sk.radius)) * huntX(c) : 0;
  if (rangeOf(sk, st) < range) return 0;
  const base = sk.kind === 'field' ? statOf(sk, st) * (sk.fire ? st.fire : 1) : PHYS.has(sk.kind) ? st.atk : (sk.stat === 'best' ? Math.max(st.atk, st.magic) : st.magic) * (sk.fire ? st.fire : 1) * (sk.holy ? st.heal : 1);
  const hits = hitsOf(sk, st, n, rank), lead = sk.lead && hits >= 1 ? (sk.lead - 1 + hits) / hits : 1; // (SP3: Thunder Call's first mob takes lead ×)
  return base * sk.mult(rank) * avgHit(st) * hits * lead * (ARROWS.has(sk.kind) ? barbed(c) : 1);
}
// the normal attack's expected damage at `range` (c: the character, for Barbed Arrows)
const attackDmg = (st, range, c) => (st.boltRange ? (st.boltRange >= range ? st.magic * (st.holyBolt ? HOLY_BOLT_MULT : STAFF_BOLT_MULT) * avgHit(st) : 0) : st.arrowRange ? (st.arrowRange >= range ? st.atk * BOW_SHOT_MULT * avgHit(st) * barbed(c) : 0) : SLAP_REACH + st.reach >= range ? st.atk * avgHit(st) : 0);
const POTIONS = [...new Set(Object.values(SHOPS).flatMap((k) => k.stock))].filter((id) => ITEMS[id].kind === 'potion' && ITEMS[id].heal).map((id) => ITEMS[id]).sort((a, b) => a.heal - b.heal);
// A fight: n targets, `range` px away; `hit` raw damage every BOSS_HIT_EVERY s (0: nobody hits back);
// `hp`: stop once that much damage is done (a boss); `potions`: drink them. → { t, dealt, faint, drunk, gold }
// SP6: pct, the share of max HP each boss hit takes on top (bossHitPct × BOSS_HIT_MULT, past DEF); mech.ult: a top boss's
// uninterrupted ultimate every that many s (TOP_ULT_HP of max HP, flat like the pulse); mech.pulseHp / mech.bar: its
// pulse and barrier (pulseHpOf, barrierOf)
function fight(c, { n = 1, range = 0, hit = 0, pct = 0, every = BOSS_HIT_EVERY.warrior, hp: bossHp = Infinity, potions = false, until = SIM_S, mech = null }) {
  const r = (id) => rankOf(c.skills, id);
  // S5's party mechanics (PARTY DENS below): mech = { pulse, barrier, weak, hp1 (the boss's one-slime HP), behind (a
  // share of your hits from behind a front-only barrier), front (Sigrun's: front-only barrier and weak point), jump
  // (a share of your non-arrow hits that reach a high weak point), help { magic, weak } (the rest of the party's
  // damage a second on the barrier and the weak point) }; S5.4: armour (a shell phase: non-heavy hits ×ARMOUR_CUT,
  // your heavy hits crack it, one an action; the others' cracks aren't counted, so a party is a little slower here)
  const M = mech ? { bar: barrierOf({}), pulseHp: PULSE_HP, weakHp: WEAK_HP, ultX: 1, ultT: mech.ult || 0, shNext: (mech.bar ?? barrierOf({})).every * 0.5, shFrom: 0, shUntil: 0, shHp: 0, wkNext: WEAK_EVERY * 0.5, wkOpen: false, wkUntil: 0, wkFill: 0, stag: 0, pulse: PULSE_EVERY + PULSE_WARN, staggers: 0, arNext: ARMOUR_EVERY * 0.5, arFrom: 0, arUntil: 0, cracks: 0, ...mech } : null;
  const shUp = (t) => M?.barrier && t >= M.shFrom && t < M.shUntil, wkUp = (t) => M?.weak && M.wkOpen && t < M.wkUntil;
  const arUp = (t) => M?.armour && !M.barrier && t >= M.arFrom && t < M.arUntil;
  const stagger = (t) => { M.stag = t + STAGGER_S; M.staggers++; };
  const wearShield = (d, t) => { if ((M.shHp -= d) <= 0) { M.shUntil = t; stagger(t); } }; // (broken: the next still comes on time)
  const fillWeak = (d, t) => { if ((M.wkFill += d) >= M.hp1 * M.weakHp) { M.wkOpen = false; M.wkNext = t + WEAK_EVERY; stagger(t); } };
  // the boss's phases at time t (and the party's help wearing them down since the last action)
  const mechStep = (t, dt) => {
    if (!M) return;
    if (M.barrier) {
      if (t >= M.shNext) [M.shFrom, M.shUntil, M.shHp, M.shNext] = [M.shNext + BARRIER_WARN, M.shNext + BARRIER_WARN + M.bar.s, M.hp1 * M.bar.hp, M.shNext + BARRIER_WARN + M.bar.s + M.bar.every];
      if (shUp(t)) wearShield(M.help.magic * dt, t);
    }
    if (M.armour && !M.barrier && t >= M.arNext) [M.arFrom, M.arUntil, M.cracks, M.arNext] = [M.arNext + ARMOUR_WARN, M.arNext + ARMOUR_WARN + ARMOUR_S, 0, M.arNext + ARMOUR_WARN + ARMOUR_S + ARMOUR_EVERY];
    if (M.weak) {
      if (M.wkOpen && t >= M.wkUntil) [M.wkOpen, M.wkNext] = [false, M.wkUntil + WEAK_EVERY];
      if (!M.wkOpen && t >= M.wkNext) [M.wkOpen, M.wkUntil, M.wkFill] = [true, t + (buff.mark > t || M.help.mark ? WEAK_MARK_S : WEAK_OPEN_S), 0];
      if (wkUp(t)) fillWeak(M.help.weak * dt, t);
    }
  };
  // what the phases do to a hit of `kinds` for d at time t (the barrier and weak point worn down by it)
  const mechHit = (d, kinds, t) => {
    if (!M || !d) return d;
    let k = M.stag > t ? 1 + STAGGER_DMG : 1;
    const facing = M.front ? 1 - M.behind : 1; // (the share of hits that land on her front: her shield)
    if (shUp(t)) {
      if (!kinds.magic) k *= 1 - facing + facing * M.bar.phys;
      else wearShield(d * facing, t);
    }
    if (arUp(t)) {
      if (!kinds.heavy) k *= ARMOUR_CUT;
      else if (++M.cracks >= ARMOUR_CRACKS) { M.arUntil = t; stagger(t); }
    }
    if (wkUp(t)) {
      const reach = facing * (kinds.arrow ? 1 : M.jump);
      k *= 1 + (WEAK_MULT - 1) * reach;
      fillWeak(d * k * reach, t);
    }
    return d * k;
  };
  const buff = { berserk: 0, rally: 0, manaShield: 0, bubble: 0, aegis: 0, zone: 0, mark: 0 }, cds = {};
  let evadeAcc = 0; // Evasion (Archer): a share of the hits that miss, counted out evenly
  let momentum = 0, momentumUntil = 0, busy = 0; // busy: actions still taken by a two-action chase move
  let charges = 0, chargesUntil = 0, burnDps = 0, burnUntil = 0; // Arcane Charge; the burn on the target(s) (summed over a crowd)
  let bleedDps = 0, bleedUntil = 0, retri = 0; // (SP2: a bleed on the target(s), like the burn; Retribution's store)
  // SP2: the long buffs held are on all fight (cast before it, minutes long: War Cry, Guardian's Oath on yourself)
  const long = buffFx(Object.keys(c.skills).filter((id) => isLongBuff(SKILLS[id]) && r(id)).map((id) => SKILLS[id].fx(r(id))));
  // the Cleric: its spirits / Seraph up ({ id, until, hp, def, dps, draw }), the totem, the Barrier, Mend, the wisp
  const sums = [];
  let drawAcc = 0, totem = null, barrier = 0, barrierUntil = 0, mendUntil = 0, mendAmt = 0, wispUntil = 0, wispAmt = 0;
  // SP4: Devotion's ward (overheal kept, soaked after the Barrier), a field's heal ticking on you (Radiance, Consecration)
  let ward = 0, fieldHealUntil = 0, fieldHeal = 0;
  const healUp = (amt, st) => { // every Cleric heal on yourself goes through here (Devotion keeps a share of the overheal)
    const over = hp + amt - st.maxHp;
    hp = Math.min(st.maxHp, hp + amt);
    if (over > 0 && r('devotion')) ward = Math.min(st.maxHp * DEVOTION_CAP, ward + over * SKILLS.devotion.share(r('devotion')));
  };
  const statsAt = (t) => statsFor(c, { berserk: buff.berserk > t, rally: buff.rally > t ? SKILLS.rally.boost(r('rally')) : 0, manaShield: buff.manaShield > t, momentum: momentumUntil > t ? momentum : 0, long, hp, attackers: hit ? 1 : 0 }); // (hp: Bloodlust; one boss after you: Unbroken)
  const chases = Object.keys(CHASE_ACTIONS).filter((id) => r(id) && ((id !== 'charge' && id !== 'retreat_shot' && id !== 'hook') || r('dash')));
  // Hunter's Mark (Sniper): everything on the marked mob hits harder; on a crowd only one of them is marked
  const markX = (t) => (buff.mark > t ? 1 + SKILLS.hunters_mark.boost(r('hunters_mark')) / n : 1);
  let hp = Infinity; // (statsAt reads it for Bloodlust: set just below)
  const top = statsFor(c, { long });
  hp = top.maxHp;
  let mp = top.maxMp, dealt = 0, drunk = 0, gold = 0, swReady = 0, lastHurt = -99, nextHit = every, nextRegen = 1;
  const actives = Object.keys(c.skills).filter((id) => SKILLS[id].kind !== 'passive' && SKILLS[id].kind !== 'move' && !(HOTBAR_SWAPS[id] ?? []).some((by) => r(by))); // (HOTBAR_SWAPS: swapped out by a newer staple)
  const ready = (id, t) => r(id) && (cds[id] ?? 0) <= t && mp >= SKILLS[id].mp;
  const use = (id, t) => { mp -= SKILLS[id].mp; cds[id] = t + cooldownOf(id, r(id)); };
  for (let t = 0; t < until; t += ACTION_S) {
    // what happened since the last action: MP (and HP) regen once a second, the boss's hits
    for (;;) {
      const hT = hit ? nextHit : Infinity, pT = M?.pulse ? +M.pulse : Infinity, uT = M?.ultT || Infinity, at0 = Math.min(nextRegen, hT, pT, uT);
      if (at0 > t) break;
      const flatHit = uT === at0 ? 'ult' : pT === at0 ? 'pulse' : null, pulse = !!flatHit; // (SP6: an ultimate goes like a pulse)
      if (pulse || hT === at0) {
        const at = at0, st = statsAt(at);
        if (flatHit === 'ult') M.ultT += mech.ult;
        else if (pulse) M.pulse += PULSE_EVERY + PULSE_WARN;
        else nextHit += every;
        if (!pulse && M?.stag > at) continue; // (staggered: no moves)
        if (buff.aegis > at) continue;
        if (buff.bubble > at) { buff.bubble = 0; continue; }
        if (!pulse && st.evade && (evadeAcc += st.evade) >= 1) { evadeAcc -= 1; continue; } // (Evasion: it missed)
        const drawer = !pulse && sums.find((q) => q.until > at && q.hp > 0 && q.draw);
        if (drawer && (drawAcc += drawer.draw) >= 1) { // the boss is after the spirit: this one lands on it
          drawAcc -= 1;
          drawer.hp -= Math.max(1, hit - drawer.def);
          continue;
        }
        let d = pulse ? Math.round(st.maxHp * (flatHit === 'ult' ? TOP_ULT_HP : M.pulseHp)) : Math.max(1, Math.round(hit - st.def)) + Math.round(st.maxHp * pct); // (the pulse: flat, past DEF; SP6: pct of max HP too)
        if (flatHit === 'ult') d = Math.round(d * M.ultX); // (SP6: the team's answer, timed for it: a Knight's Sanctuary, a Cleric's Barrier)
        if (buff.zone > at) d = Math.max(1, Math.round(d * (1 - SKILLS.sanctuary.cut(r('sanctuary')))));
        else if (M?.help?.zone && at % M.help.zone.every < M.help.zone.dur) d = Math.max(1, Math.round(d * (1 - M.help.zone.cut))); // (SP6: a Knight friend's)
        if (totem && totem.until > at && totem.hp > 0) d = Math.max(1, Math.round(d * (1 - totem.cut)));
        if (r('resolve') && (sums.some((q) => q.until > at && q.hp > 0) || (totem && totem.until > at && totem.hp > 0))) d = Math.max(1, Math.round(d * (1 - SKILLS.resolve.cut(r('resolve'))))); // (SP4: by its own summons)
        if (barrier > 0 && barrierUntil > at) { const soak = Math.min(barrier, d); barrier -= soak; d -= soak; if (d <= 0) continue; }
        if (ward > 0) { const soak = Math.min(ward, d); ward -= soak; d -= soak; if (d <= 0) continue; } // (SP4: Devotion)
        if (st.manaShield) { const take = Math.min(Math.round(d * st.manaShield), Math.floor(mp)); mp -= take; d -= take; }
        if (buff.rally > at && r('retribution')) retri = Math.min(st.maxHp * RETRI_HOLD, retri + d); // (SP2: stored for the next Shield Bash)
        hp -= d;
        lastHurt = at;
        if (hp <= 0 && r('second_wind') && at >= swReady) { hp = 1; swReady = at + SKILLS.second_wind.cdFor(r('second_wind')); }
        if (hp <= 0) return { t: at, dealt, faint: true, drunk, gold };
      } else {
        const at = nextRegen, st = statsAt(at);
        nextRegen += 1;
        if (hp < st.maxHp && at - lastHurt >= 5) hp = Math.min(st.maxHp, hp + Math.max(1, st.maxHp * 0.01 * st.hpRegen));
        mp = Math.min(st.maxMp, mp + Math.max(1, st.maxMp * 0.02) * mpRegen(c.skills));
        if (mendUntil > at) healUp(mendAmt, st);
        if (wispUntil > at) healUp(wispAmt / WISP_TICK, st);
        if (fieldHealUntil > at) healUp(fieldHeal, st); // (SP4: standing in your own Radiance / Consecration)
        if (M?.help?.heal) hp = Math.min(st.maxHp, hp + M.help.heal); // (SP6: a Cleric friend's heals, HP a second)
      }
    }
    // a burn ticking since the last action (the server's BURN_TICK_MS, smoothed)
    if (burnUntil > t - ACTION_S) {
      dealt += burnDps * Math.min(ACTION_S, burnUntil - (t - ACTION_S));
      if (dealt >= bossHp) return { t, dealt, faint: false, drunk, gold };
    }
    if (bleedUntil > t - ACTION_S) { // (SP2: a bleed, the same way)
      dealt += bleedDps * Math.min(ACTION_S, bleedUntil - (t - ACTION_S));
      if (dealt >= bossHp) return { t, dealt, faint: false, drunk, gold };
    }
    // the spirits' hits since the last action, and the boss wearing them (and the totem) down
    for (let i = sums.length - 1; i >= 0; i--) {
      const q = sums[i];
      if (q.until <= t - ACTION_S || q.hp <= 0) { sums.splice(i, 1); continue; }
      dealt += q.dps * ACTION_S;
      if (q.light) healUp(q.dps * ACTION_S * q.light, statsAt(t)); // (SP4: sprites and the guardian heal with what they hit)
      if (hit) q.hp -= Math.max(1, (hit / BOSS_HIT_MULT) * BOSS_SUMMON_HIT - q.def) * (ACTION_S / BOSS_SUMMON_S);
    }
    if (totem && totem.until > t - ACTION_S && totem.hp > 0 && totem.pulse) { // (SP4: the Warding Totem's pulse)
      dealt += totem.pulse * ACTION_S;
      healUp(totem.pulse * ACTION_S * SUMMON_LIGHT * statsAt(t).heal, statsAt(t));
    }
    if (hit && totem && totem.until > t) totem.hp -= Math.max(1, (hit / BOSS_HIT_MULT) * BOSS_SUMMON_HIT - totem.def) * (ACTION_S / BOSS_SUMMON_S);
    if (dealt >= bossHp) return { t, dealt, faint: false, drunk, gold };
    mechStep(t, ACTION_S);
    if (busy > 0) {
      busy--;
      continue;
    }
    const st = statsAt(t);
    // this action: a potion, Jelly Patch, a buff that's down, the best hit, or the normal attack
    // (SP6: a pulse or a top boss's ultimate coming, drink first if it would take you under POTION_AT: you see it coming)
    const soon = M ? Math.max(M.pulse && M.pulse - t < PULSE_WARN ? M.pulseHp : 0, M.ultT && M.ultT - t < ULT_WARN ? TOP_ULT_HP * M.ultX : 0) : 0;
    if (hit && potions && hp < (POTION_AT + soon) * st.maxHp) {
      const p = [...POTIONS].reverse().find((q) => q.heal <= st.maxHp - hp) ?? POTIONS[0];
      hp = Math.min(st.maxHp, hp + p.heal);
      mp = Math.min(st.maxMp, mp + (p.mana ?? 0));
      drunk++;
      gold += p.price;
      continue;
    }
    if (hit && hp < 0.7 * st.maxHp && ready('jelly_patch', t)) {
      use('jelly_patch', t);
      hp = Math.min(st.maxHp, hp + SKILLS.jelly_patch.amount(r('jelly_patch')));
      continue;
    }
    // the Cleric: heals when low, then its summons and wards whenever they're down
    const lowFor = (id, at) => hit && ready(id, t) && hp < at * st.maxHp;
    const healNow = lowFor('miracle', MIRACLE_AT) ? 'miracle' : lowFor('heal', HEAL_AT) ? 'heal' : null;
    if (healNow) {
      use(healNow, t);
      healUp(healOf(healNow, r(healNow), st), st);
      continue;
    }
    if (lowFor('mend', MEND_AT) && mendUntil <= t) {
      use('mend', t);
      [mendUntil, mendAmt] = [t + SKILLS.mend.dur, healOf('mend', r('mend'), st)];
      continue;
    }
    const spirits = (id) => sums.filter((q) => q.id === id && q.until > t && q.hp > 0).length;
    const call = ['seraph', 'stone_guardian', 'jelly_spirit'].find((id) => ready(id, t) && spirits(id) < summonCap(SKILLS[id], c.skills)); // (Host: one more, SP4)
    if (call) {
      use(call, t);
      const n2 = call === 'seraph' ? caught(n, 2 * SERAPH_R) : 1, every = SKILLS[call].every ?? SPIRIT_HIT_S;
      sums.push({ id: call, until: t + SKILLS[call].dur, hp: summonHp(call, r(call), st), def: st.def * 0.5, dps: (summonHit(call, r(call), st) * avgHit(st) * n2) / every, draw: call === 'seraph' ? SERAPH_DRAW : call === 'stone_guardian' ? GUARDIAN_DRAW : SPIRIT_DRAW, light: (SKILLS[call].lightHeal?.(r(call)) ?? 0) * st.heal });
      continue;
    }
    // SP4: Sprites, a whole set whenever they're down (each after a different mob: one on a lone target, the others idle)
    if (ready('sprites', t) && !spirits('sprites')) {
      use('sprites', t);
      const k = Math.min(summonCap(SKILLS.sprites, c.skills), n), each = (summonHit('sprites', r('sprites'), st) * avgHit(st)) / SPIRIT_HIT_S;
      for (let i = 0; i < k; i++) sums.push({ id: 'sprites', until: t + SKILLS.sprites.dur, hp: summonHp('sprites', r('sprites'), st), def: st.def * 0.5, dps: each, draw: i ? 0 : SPIRIT_DRAW, light: SKILLS.sprites.lightHeal(r('sprites')) * st.heal });
      continue;
    }
    // SP5: the Hawk, whenever it's down (a flier like the Phoenix, on ATK; Huntmaster on a slowed target). Planted traps
    // and the hawk don't reach a mob on a ledge (range)
    if (!range && ready('hawk', t) && !sums.some((q) => q.id === 'hawk' && q.until > t)) {
      use('hawk', t);
      sums.push({ id: 'hawk', until: t + SKILLS.hawk.dur, hp: Infinity, def: 0, dps: (summonHit('hawk', r('hawk'), st) * avgHit(st) * huntX(c)) / SKILLS.hawk.every, draw: 0 });
      continue;
    }
    // SP3: the Phoenix, whenever it's down (a flier: one mob a dive, never hurt, draws nothing)
    if (ready('phoenix', t) && !sums.some((q) => q.id === 'phoenix' && q.until > t)) {
      use('phoenix', t);
      sums.push({ id: 'phoenix', until: t + SKILLS.phoenix.dur, hp: Infinity, def: 0, dps: (summonHit('phoenix', r('phoenix'), st) * avgHit(st)) / SKILLS.phoenix.every, draw: 0 });
      continue;
    }
    if (hit && ready('lantern_wisp', t) && wispUntil <= t) {
      use('lantern_wisp', t);
      [wispUntil, wispAmt] = [t + SKILLS.lantern_wisp.dur, healOf('lantern_wisp', r('lantern_wisp'), st)];
      continue;
    }
    if ((hit || r('warding_totem')) && ready('guardian_totem', t) && !(totem && totem.until > t && totem.hp > 0)) {
      use('guardian_totem', t);
      // (SP4: the Warding Totem pulses on what's in its ring: the crowd it catches, a lone boss FIELD_BOSS_SHARE of the time)
      const pulse = r('warding_totem') ? (st.magic * SKILLS.warding_totem.mult(r('warding_totem')) * (1 + 0.06 * st.bond) * avgHit(st) * (n === 1 ? FIELD_BOSS_SHARE : caught(n, 2 * SKILLS.guardian_totem.radius))) / WARD_PULSE_S : 0;
      totem = { until: t + SKILLS.guardian_totem.dur, hp: summonHp('guardian_totem', r('guardian_totem'), st), def: st.def * 0.5, cut: SKILLS.guardian_totem.cut(r('guardian_totem')), pulse };
      continue;
    }
    if (hit && ready('barrier', t) && !(barrier > 0 && barrierUntil > t)) {
      use('barrier', t);
      [barrier, barrierUntil] = [healOf('barrier', r('barrier'), st), t + SKILLS.barrier.dur];
      continue;
    }
    const buffs = { berserk: ['berserk', true], rally: ['rally', true], mark: ['hunters_mark', true], manaShield: ['mana_shield', hit], bubble: ['jelly_bubble', hit], zone: ['sanctuary', hit], aegis: ['aegis', hit] };
    const b = Object.entries(buffs).find(([k, [id, want]]) => want && buff[k] <= t && ready(id, t));
    if (b) {
      const [k, [id]] = b;
      use(id, t);
      buff[k] = SKILLS[id].toggle ? Infinity : t + durOf(id, r(id)); // (a toggle stays on)
      continue;
    }
    let best = null, dmg = attackDmg(st, range, c);
    const held = chargesUntil > t ? charges : 0;
    for (const id of actives) {
      if ((!DAMAGE_KINDS.has(SKILLS[id].kind) && SKILLS[id].what !== 'net' && SKILLS[id].what !== 'blast') || !ready(id, t)) continue;
      // (SP2: Execution on a boss in its last EXEC_AT; a Shield Bash lets Retribution's store out; a bleed's whole tick-down)
      const sk = SKILLS[id], low = (sk.exec && bossHp < Infinity && dealt >= (1 - EXEC_AT) * bossHp ? sk.exec(r(id)) : 1) * (sk.combust && burnUntil > t ? sk.combust(r(id)) : 1) // (SP3: Combustion on a burning target)
        * (sk.judge ? judgmentMult(c.skills, hp < JUDGMENT_AT * st.maxHp ? 1 : 0) : 1); // (SP4: Judgment, alone: you're the hurt one)
      const one = castDmg(id, r(id), st, n, range, c) * (spendsArcane(id) ? arcaneMult(c.skills, held) : 1) * low;
      const d = one + (sk.stun && one ? st.atk * retriMult(c.skills, retri, st.atk) * avgHit(st) : 0) + (sk.dot ? one * sk.dot.share(r(id)) * DOTS[sk.dot.kind].s * 0.5 : 0); // (half the bleed / poison counted when choosing)
      if (d > dmg) [best, dmg] = [id, d];
    }
    // a chase move, if it beats that per action it takes (n targets: Leap Slam catches the crowd)
    let chase = null;
    for (const id of chases) {
      if ((cds[id] ?? 0) > t || range > (id === 'retreat_shot' ? st.arrowRange : SLAP_REACH + st.reach)) continue;
      const one = id === 'retreat_shot' ? attackDmg(st, range, c) * SKILLS[id].mult(r(id)) : st.atk * SKILLS[id].mult(r(id)) * avgHit(st);
      const d = id === 'leap_slam' ? one * caught(n, 2 * SKILLS[id].radius) : id === 'upward_cut' ? one + attackDmg(st, range, c) : one;
      if (d / CHASE_ACTIONS[id] > dmg) [best, chase, dmg] = [null, id, d];
    }
    if (chase) {
      cds[chase] = t + chaseCd(c, chase);
      busy = CHASE_ACTIONS[chase] - 1;
      if (r('momentum')) [momentum, momentumUntil] = [Math.min(momentumMax(c.skills), (momentumUntil > t ? momentum : 0) + 1), t + MOMENTUM_DUR];
    }
    if (best) use(best, t);
    if (best && SKILLS[best].stun) retri = 0;
    if (best && r('rampage') && r('momentum') && (best === 'whirlwind' || best === 'blade_storm')) [momentum, momentumUntil] = [Math.min(momentumMax(c.skills), (momentumUntil > t ? momentum : 0) + 1), t + MOMENTUM_DUR]; // (Rampage)
    if (best && SKILLS[best].dot) { // the bleed (SP5: or poison): share of the hit a second over its DOTS time (the dot part of dmg taken back out)
      const ds = DOTS[SKILLS[best].dot.kind].s, hitPart = dmg / (1 + SKILLS[best].dot.share(r(best)) * ds * 0.5);
      [bleedDps, bleedUntil] = [Math.max(bleedUntil > t ? bleedDps : 0, hitPart * SKILLS[best].dot.share(r(best))), t + ds];
      dmg = hitPart;
    }
    if (best && spendsArcane(best)) charges = 0;
    else if (!best && !chase && st.boltRange && !st.holyBolt && dmg && r('arcane_charge')) [charges, chargesUntil] = [Math.min(ARCANE_MAX, held + 1), t + ARCANE_DUR];
    if (best && SKILLS[best].combust && burnUntil > t) [burnDps, burnUntil] = [0, 0]; // (SP3: Combustion spends the burn)
    if (best && SKILLS[best].el === 'fire') [burnDps, burnUntil] = [Math.max(burnUntil > t ? burnDps : 0, dmg * BURN_DPS), t + BURN_S];
    if (!dmg) continue;
    dmg *= markX(t);
    if (M) dmg = mechHit(dmg, chase ? { arrow: chase === 'retreat_shot' } : best ? hitKinds(SKILLS[best], r(best), st, held, c.skills) : { magic: !!st.boltRange, arrow: !!st.arrowRange }, t);
    dealt += dmg; // (a crowd: the sum over the mobs it caught)
    if (st.thirst) hp = Math.min(st.maxHp, hp + dmg * st.thirst);
    if (best && SKILLS[best].smite) healUp(dmg * SKILLS[best].smite(r(best)) * st.heal, st); // Smite
    if (!best && !chase && st.holyBolt) healUp(dmg * HOLY_BOLT_HEAL * st.heal, st); // the holy bolt (alone: it heals you)
    // SP4: Sacred Light heals you for each mob it hit, `lightHeal` a share of the damage (alone: on you), a field's heal ticks
    if (best && SKILLS[best].selfPer) healUp(Math.min(n, caught(n, 2 * SKILLS[best].radius)) * st.magic * SKILLS[best].selfPer(r(best)) * st.heal, st);
    if (best && SKILLS[best].lightHeal) healUp(dmg * SKILLS[best].lightHeal(r(best)) * st.heal, st);
    if (best && SKILLS[best].kind === 'field' && SKILLS[best].heal) [fieldHealUntil, fieldHeal] = [t + SKILLS[best].dur, (st.magic * SKILLS[best].heal(r(best)) * st.heal) / (SKILLS[best].every ?? 1)];
    if (dealt >= bossHp) return { t: t + ACTION_S, dealt, faint: false, drunk, gold };
  }
  return { t: until, dealt, faint: false, drunk, gold, staggers: M?.staggers };
}
// the dens' ATK against the curve at their level (for the toughness column's boss at any level)
const denBosses = DENS.map((d) => MOBS[d.boss]);
const bossAtkX = (() => { const r = denBosses.map((m) => m.atk / curve('atk', m.lvl)).sort((a, b) => a - b); return r[r.length >> 1]; })();
const branches = Object.keys(BUILDS);
const mmss = (s) => { const r = Math.round(s); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };
const classRows = {}, classAt = {};
for (const L of CLASS_AT) for (const br of branches) {
  const c = classChar(br, L), st = statsFor(c);
  const single = fight(c, {}).dealt / SIM_S, crowd = fight(c, { n: CROWD }).dealt / SIM_S, ranged = fight(c, { range: RANGED_PX }).dealt / SIM_S;
  const tough = fight(c, { hit: curve('atk', L) * bossAtkX * BOSS_HIT_MULT, every: BOSS_HIT_EVERY.warrior, until: TOUGH_CAP }).t;
  classAt[`${br} ${L}`] = { single, crowd, ranged, tough };
  classRows[`${br} lvl ${L}`] = {
    'single dps': fmt(single), [`crowd dps (${CROWD})`]: fmt(crowd), [`ranged dps (${RANGED_PX} px)`]: fmt(ranged), 'toughness (s)': tough >= TOUGH_CAP ? `${TOUGH_CAP}+` : Math.round(tough),
    hp: st.maxHp, def: st.def, mp: st.maxMp, 'atk / magic': `${st.atk} / ${st.magic}`, points: Object.entries(c.skills).filter(([id]) => SKILLS[id].cls !== 'novice').map(([id, n]) => `${id.split('_').map((w) => w[0]).join('')}${n}`).join(' '),
  };
}
table(`CLASSES: each branch with gear on the frozen curve (BUILDS, AP_LUK in LUK); damage a second from a ${SIM_S} s rotation (one action every ${ACTION_S} s), toughness = seconds alone under a curve boss's hits every ${BOSS_HIT_EVERY.warrior} s, no potions`, classRows);
const medianOf = (xs) => { const ts = [...xs].sort((a, b) => a - b), h = ts.length >> 1; return ts.length % 2 ? ts[h] : (ts[h - 1] + ts[h]) / 2; };
const isPartyDen = (m) => !!(m.partyDen && m.partyLive); // (S5.3: the Root Warden, Sigrun)
// SP6 (owner, 2026-10-25; story/skills-plan.md): the top bosses (`top`: the party dens, the Clockwork Colossus, Chronos,
// the final bosses) are measured for a party of four in TOP BOSSES below; every other den alone in the solo table. Every
// boss hit takes bossHitPct of max HP on top of its flat part (pctOf: the average move, × BOSS_HIT_MULT like the flat).
const isTop = (m) => !!m.top;
const pctOf = (m) => bossHitPct(m) * BOSS_HIT_MULT;
const bossFight = (m) => ({ hit: m.atk * BOSS_HIT_MULT, pct: pctOf(m) });
// SP6's targets (owner, 2026-10-25), in the sheet's minutes (it plays faster than people do): an ordinary den soloed at
// its level about 15 min (the eight branches' median within DEN_SOLO_MIN); a field boss longer than it was but well
// short of a den (FIELD_SOLO_MIN, about 4); a top boss about 45 min for a party of four (TOP_PARTY_MIN), alone TOP_SOLO ×
// the party's time (possible but miserable, never blocked), and a lopsided party with no answer to its mechanics
// (LOPSIDED_TEAM: no healer, no Mage) TOP_LOPSIDED_MIN, on a lot of potions
const DEN_SOLO_MIN = [12, 18], FIELD_SOLO_MIN = [3, 6], TOP_PARTY_MIN = [38, 55], TOP_SOLO = [2, 3.5], TOP_LOPSIDED_MIN = [60, 100];
const LOPSIDED_TEAM = ['berserker', 'berserker', 'sniper', 'trapper'];
// (the time is only checked on a boss whose barrier covers it all round: Sigrun's is front-only, and flanking her is
// everyone's answer to it, so a lopsided party there pays in potions, at least LOPSIDED_POTS a member, not in time)
const LOPSIDED_POTS = 100;
const SOLO_UNTIL = 5 * 3600; // s: a fight the sim gives up on
const fightMin = {}; // boss id → the sheet's minutes for its fight (dens and fields: the solo median; top: the party's), for BOSS PAY
const soloDens = DENS.map((d) => [d.boss, MOBS[d.boss]]).filter(([, m]) => m.lvl >= CLASS_LVL && !isTop(m)).sort((a, b) => a[1].lvl - b[1].lvl);
const solo = {};
for (const [id, m] of soloDens) {
  solo[id] = {};
  for (const br of branches) solo[id][br] = fight(classChar(br, m.lvl), { ...bossFight(m), every: BOSS_HIT_EVERY[BUILDS[br].cls], hp: m.hp, potions: true, until: SOLO_UNTIL });
  fightMin[id] = medianOf(branches.map((br) => solo[id][br].t)) / 60;
}
const soloRow = (f) => (f.faint ? `faints at ${mmss(f.t)}` : `${mmss(f.t)}${f.drunk ? ` (${f.drunk} pots, ${fmt(f.gold)}g)` : ''}`);
table(`CLASSES: time to solo each den boss at its level (potions drunk under ${POTION_AT * 100}% HP; dens under Lv ${CLASS_LVL} are the Novices'; want the median in DEN_SOLO_MIN ${DEN_SOLO_MIN.join('–')} min)`, Object.fromEntries(soloDens.map(([id, m]) => {
  return [id, { lvl: m.lvl, hp: fmt(m.hp), ...Object.fromEntries(branches.map((br) => [br, soloRow(solo[id][br])])), median: mmss(fightMin[id] * 60), 'kill pays': fmt(bossWorth(id)) }];
})));
// SP6: field bosses alone at their level (their party mechanics need two slimes, RETROFIT below)
const fieldBosses = bosses.filter(([, m]) => m.field && m.lvl >= CLASS_LVL).sort((a, b) => a[1].lvl - b[1].lvl);
const fieldSolo = {};
for (const [id, m] of fieldBosses) {
  fieldSolo[id] = Object.fromEntries(branches.map((br) => [br, fight(classChar(br, m.lvl), { ...bossFight(m), every: BOSS_HIT_EVERY[BUILDS[br].cls], hp: m.hp, potions: true, until: SOLO_UNTIL })]));
  fightMin[id] = medianOf(branches.map((br) => fieldSolo[id][br].t)) / 60;
}
table(`FIELD BOSSES: time to solo each at its level (want the median in FIELD_SOLO_MIN ${FIELD_SOLO_MIN.join('–')} min)`, Object.fromEntries(fieldBosses.map(([id, m]) => [id, { lvl: m.lvl, hp: fmt(m.hp), ...Object.fromEntries(branches.map((br) => [br, soloRow(fieldSolo[id][br])])), median: mmss(fightMin[id] * 60), 'kill pays': fmt(bossWorth(id)) }])));
// TOP BOSSES (S5.3's PARTY DENS, SP6): a team's kill time. A party den fights a lone slime with every mechanic but the
// focus on (PARTY capMin); Colossus and Chronos have none yet (their retrofit hasn't come). The sim leaves out the adds and
// the focus; a top boss's ultimate goes off every ULT_GAP s for TOP_ULT_HP of everyone's max HP unless a Frostbinder is in
// the team to interrupt it (on a boss with `interrupt`). Its HP is bossMaxHp's (never under PARTY_DEN_HP_FLOOR slimes'
// worth). In a team the boss's hits are shared out (each member takes one every team-size × as often), the Mages' and
// Clerics' spells wear the barrier down for everyone, the Archers' arrows fill the weak point, and the Knight holds a
// front-only barrier's focus (all hits on her front) while the others flank (PARTY_BEHIND). Alone, a slime reaches a high
// weak point with WEAK_JUMP of its non-arrow hits and gets round a front-only one with SOLO_BEHIND of them. Each member's
// run is PARTY_SIM_S long (its damage a second, and potions scaled up to the whole fight).
const PARTY_TEAM = ['knight', 'priest', 'frostbinder', 'sniper'];
const WEAK_JUMP = 0.3, SOLO_BEHIND = 0.35, PARTY_BEHIND = 0.8, PARTY_SIM_S = 1200;
const ULT_GAP = ULT_EVERY[1] + ULT_WARN;
const topBosses = DENS.map((d) => [d.boss, MOBS[d.boss]]).filter(([, m]) => isTop(m)).sort((a, b) => a[1].lvl - b[1].lvl);
// SP6: a top boss's ultimate (ULT_GAP) unless a Frostbinder interrupts it; ultX: what of it lands, with the team's best
// answer timed for it (a Knight's Sanctuary, ULT_CLERIC with a Cleric's Barrier and heals)
const ULT_CLERIC = 0.5;
const ultXOf = (team) => Math.min(1, ...team.map((br) => (br === 'knight' ? 1 - SKILLS.sanctuary.cut(SKILLS.sanctuary.max) : BUILDS[br].cls === 'cleric' ? ULT_CLERIC : 1)));
const mechOf = (m, fighters, team = []) => ({ pulse: partyActive(m, fighters, 'pulse'), barrier: partyActive(m, fighters, 'barrier'), weak: partyActive(m, fighters, 'weakpoint'), hp1: m.hp, front: !!m.barrierFront, pulseHp: pulseHpOf(m), bar: barrierOf(m), weakHp: weakHpOf(m), ult: m.top && !(team.includes('frostbinder') && partyActive(m, fighters, 'interrupt')) ? ULT_GAP : 0, ultX: ultXOf(team) });
// SP6: what a team's Clerics and Knights do for the others in TOP BOSSES and RETROFIT (heals are party-wide: Jelly Heal,
// Mend, the wisp, the Barrier, each on cooldown, HEAL_GIVE of the time spent on friends), HP a second; a Knight's
// Sanctuary covering them on its cooldown
const HEAL_GIVE = 0.35;
const healGive = (br, L) => {
  const c = classChar(br, L), st = statsFor(c), r = (id) => rankOf(c.skills, id);
  const per = (id, k = 1) => (r(id) ? (healOf(id, r(id), st) * k) / cooldownOf(id, r(id)) : 0);
  return HEAL_GIVE * (per('heal') + per('mend', SKILLS.mend.dur) + per('lantern_wisp', SKILLS.lantern_wisp.dur / WISP_TICK) + per('barrier'));
};
const zoneOf = (br, L) => { const c = classChar(br, L), k = rankOf(c.skills, 'sanctuary'); return k ? { every: cooldownOf('sanctuary', k), dur: SKILLS.sanctuary.dur, cut: SKILLS.sanctuary.cut(k) } : null; };
const teamHelp = (others, L) => ({ heal: others.filter((o) => BUILDS[o].cls === 'cleric').reduce((a, o) => a + healGive(o, L), 0), zone: others.map((o) => zoneOf(o, L)).find(Boolean) ?? null });
const isMagic = (br) => ['mage', 'cleric'].includes(BUILDS[br].cls), isArrow = (br) => BUILDS[br].cls === 'archer';
const teamRun = (m, team) => {
  const n = team.length, hp = bossMaxHp(m, n), front = !!m.barrierFront;
  const base = Object.fromEntries(team.map((br) => [br, fight(classChar(br, m.lvl), {}).dealt / SIM_S]));
  const behindOf = (br) => (front && br !== 'knight' ? PARTY_BEHIND : 0);
  const onFront = (br) => (front ? 1 - behindOf(br) : 1);
  const runs = team.map((br, i) => {
    const others = team.filter((o, j) => j !== i);
    const help = { ...teamHelp(others, m.lvl), magic: others.filter(isMagic).reduce((a, o) => a + base[o] * onFront(o), 0), weak: others.reduce((a, o) => a + base[o] * onFront(o) * (isArrow(o) ? 1 : front ? 1 : WEAK_JUMP), 0), mark: others.some((o) => rankOf(classChar(o, m.lvl).skills, 'hunters_mark')) };
    const f = fight(classChar(br, m.lvl), { ...bossFight(m), every: BOSS_HIT_EVERY[BUILDS[br].cls] * n, potions: true, until: PARTY_SIM_S, mech: { ...mechOf(m, n, team), behind: behindOf(br), jump: front ? 1 : WEAK_JUMP, help } });
    return { br, dps: f.dealt / f.t, faint: f.faint, drunk: f.drunk / f.t };
  });
  const t = hp / runs.reduce((a, q) => a + q.dps, 0);
  return { hp, t, runs, pots: Math.round(runs.reduce((a, q) => a + q.drunk * t, 0)) };
};
const topRun = {};
for (const [id, m] of topBosses) {
  const party = teamRun(m, PARTY_TEAM), lop = m.partyLive ? teamRun(m, LOPSIDED_TEAM) : null;
  const soloMech = (br) => ({ ...mechOf(m, 1, [br]), behind: SOLO_BEHIND, jump: m.barrierFront ? 1 : WEAK_JUMP, help: { magic: 0, weak: 0 } });
  const alone = Object.fromEntries(branches.map((br) => [br, fight(classChar(br, m.lvl), { ...bossFight(m), every: BOSS_HIT_EVERY[BUILDS[br].cls], hp: bossMaxHp(m, 1), potions: true, until: SOLO_UNTIL, mech: soloMech(br) })]));
  topRun[id] = { m, party, lop, alone, med: medianOf(branches.map((br) => alone[br].t)) };
  fightMin[id] = party.t / 60;
}
const partyCell = (q) => `${mmss(q.t)} (${q.pots} pots${q.runs.some((r) => r.faint) ? `; ${q.runs.filter((r) => r.faint).map((r) => r.br).join(' ')} faint` : ''})`;
table(`TOP BOSSES: a party of ${PARTY_TEAM.join(', ')} (want TOP_PARTY_MIN ${TOP_PARTY_MIN.join('–')} min), a lopsided one of ${LOPSIDED_TEAM.join(', ')} (TOP_LOPSIDED_MIN ${TOP_LOPSIDED_MIN.join('–')}, bosses with mechanics), and each branch alone (median ÷ the party within TOP_SOLO ${TOP_SOLO.join('–')})`, Object.fromEntries(topBosses.map(([id]) => {
  const q = topRun[id], done = branches.filter((br) => !q.alone[br].faint);
  return [id, { lvl: q.m.lvl, [`party of ${PARTY_TEAM.length}`]: partyCell(q.party), lopsided: q.lop ? partyCell(q.lop) : '', ...Object.fromEntries(branches.map((br) => { const f = q.alone[br]; return [br, `${f.faint ? `faints ${mmss(f.t)}` : mmss(f.t)}${f.drunk ? ` (${f.drunk})` : ''}`]; })), 'alone median': `${mmss(q.med)}${done.length < branches.length ? ` (${branches.length - done.length} faint)` : ''}`, 'alone ÷ party': (q.med / q.party.t).toFixed(1), hp: fmt(q.party.hp) }];
})));
// RETROFIT (S5.4; story/s5-plan.md): the den and field bosses given party mechanics (`partyLive`, not a top boss).
// Alone nothing switches on, so the solo tables above don't move; this shows what they do to a duo (RETRO_DUOS, at
// the boss's level, its hits shared out like TOP BOSSES'): the kill time with them off / on. Only the pulse, barrier,
// armour, weak point and stagger are modelled (not the focus, curse or adds: a duo answers those by playing, not by DPS).
const RETRO_DUOS = [['berserker', 'sniper'], ['knight', 'frostbinder']];
const retro = bosses.filter(([, m]) => m.partyLive && !m.top && m.lvl >= CLASS_LVL).sort((a, b) => a[1].lvl - b[1].lvl);
const duoRun = (m, duo, on) => {
  const n = duo.length, hp = bossMaxHp(m, n), base = Object.fromEntries(duo.map((br) => [br, fight(classChar(br, m.lvl), {}).dealt / SIM_S]));
  const runs = duo.map((br) => {
    const o = duo.filter((x) => x !== br);
    const help = { ...teamHelp(o, m.lvl), magic: o.filter(isMagic).reduce((a, x) => a + base[x], 0), weak: o.reduce((a, x) => a + base[x] * (isArrow(x) ? 1 : WEAK_JUMP), 0), mark: o.some((x) => rankOf(classChar(x, m.lvl).skills, 'hunters_mark')) };
    const mech = on ? { ...mechOf(m, n, duo), armour: partyActive(m, n, 'armour'), behind: 0, jump: WEAK_JUMP, help } : null;
    const f = fight(classChar(br, m.lvl), { ...bossFight(m), every: BOSS_HIT_EVERY[BUILDS[br].cls] * n, potions: true, until: PARTY_SIM_S, mech });
    return f.dealt / f.t;
  });
  return hp / runs.reduce((a, d) => a + d, 0);
};
table(`RETROFIT: den and field bosses with party mechanics (alone: none on, the solo tables hold); a duo's kill time with them off / on`, Object.fromEntries(retro.map(([id, m]) => [id, { lvl: m.lvl, field: m.field ? 'yes' : '', mechanics: m.party.join(' '), ...Object.fromEntries(RETRO_DUOS.map((duo) => { const off = duoRun(m, duo, false), on = duoRun(m, duo, true); return [duo.join(' + '), `${mmss(off)} / ${mmss(on)} (${on <= off ? '' : '+'}${Math.round((on / off - 1) * 100)}%)`]; })) }])));
// SP6 (owner, 2026-10-25): a boss twice your level kills you in about KILL_HITS hits or fewer, so a big level gap is
// never safe: each branch at half the boss's level (curve gear there, every passive; no buffs, potions or dodges) under
// its average hit (BOSS_HIT_MULT of its ATK less DEF, plus pctOf of max HP)
const KILL_HITS = 6;
const killHits = (m, br) => { const st = statsFor(classChar(br, Math.floor(m.lvl / 2))); return Math.ceil(st.maxHp / (Math.max(1, m.atk * BOSS_HIT_MULT - st.def) + st.maxHp * pctOf(m))); };
const killBosses = bosses.filter(([, m]) => Math.floor(m.lvl / 2) >= CLASS_LVL).sort((a, b) => a[1].lvl - b[1].lvl);
const kills = Object.fromEntries(killBosses.map(([id, m]) => [id, Object.fromEntries(branches.map((br) => [br, killHits(m, br)]))]));
table(`HITS TO KO at half the boss's level (want KILL_HITS ${KILL_HITS} or fewer)`, Object.fromEntries(killBosses.map(([id, m]) => [id, { lvl: m.lvl, you: Math.floor(m.lvl / 2), ...kills[id] }])));
// SP6: what each boss's fight pays, against its sheet time (dens and fields: the solo median; top bosses: the party's)
table(`BOSS PAY: the sheet's fight, and an hour of it vs farming (dens: camped, BOSS_PAY ${BOSS_PAY.join('–')}x EXP, BOSS_CAMP_MAX ${BOSS_CAMP_MAX}; fields: a minute of the fight, FIELD_PAY ${FIELD_PAY.join('–')})`, Object.fromEntries(bosses.filter(([id]) => fightMin[id]).sort((a, b) => a[1].lvl - b[1].lvl).map(([id, m]) => {
  const f = fightMin[id], c = m.field ? fieldPay(m, f) : campRatio(m, f);
  return [id, { kind: m.field ? 'field' : m.top ? 'top' : 'den', lvl: m.lvl, fight: mmss(f * 60), exp: fmt(m.exp), 'kill pays': fmt(bossWorth(id)), 'kills / h': m.field ? '' : (60 / (BOSS_RESPAWN_MS / 60_000 + f)).toFixed(1), 'exp / gold vs farming': `${c.exp.toFixed(2)}x / ${c.gold.toFixed(2)}x${m.field ? ' a min' : ' an hour'}` }];
})));
delete ITEMS[SHEET_W];
delete ITEMS[SHEET_H];
const classProblems = [];
for (const [id, m] of topBosses) {
  const q = topRun[id], r = q.med / q.party.t;
  if (q.party.t < TOP_PARTY_MIN[0] * 60 || q.party.t > TOP_PARTY_MIN[1] * 60) classProblems.push(`a party of ${PARTY_TEAM.length} kills top boss ${id} in ${mmss(q.party.t)} (want TOP_PARTY_MIN ${TOP_PARTY_MIN.join('–')} min)`);
  if (r < TOP_SOLO[0] || r > TOP_SOLO[1]) classProblems.push(`top boss ${id} alone takes ${mmss(q.med)} (median), ${r.toFixed(1)}x the party's ${mmss(q.party.t)} (want TOP_SOLO ${TOP_SOLO.join('–')}x)`);
  if (q.lop && q.lop.pots < LOPSIDED_POTS * LOPSIDED_TEAM.length) classProblems.push(`a lopsided party (${LOPSIDED_TEAM.join(' ')}) at top boss ${id} drinks only ${q.lop.pots} potions (want LOPSIDED_POTS ${LOPSIDED_POTS} a member or more)`);
  if (q.lop && !m.barrierFront && (q.lop.t < TOP_LOPSIDED_MIN[0] * 60 || q.lop.t > TOP_LOPSIDED_MIN[1] * 60)) classProblems.push(`a lopsided party (${LOPSIDED_TEAM.join(' ')}) kills top boss ${id} in ${mmss(q.lop.t)} (want TOP_LOPSIDED_MIN ${TOP_LOPSIDED_MIN.join('–')} min)`);
  if (branches.every((br) => q.alone[br].faint)) classProblems.push(`nobody can solo top boss ${id}: it must stay possible (never locked)`);
  for (const r of q.party.runs) if (r.faint) classProblems.push(`the ${r.br} faints in the party at top boss ${id}`);
}
for (const [id, m] of soloDens) {
  const med = fightMin[id] * 60;
  if (med < DEN_SOLO_MIN[0] * 60 || med > DEN_SOLO_MIN[1] * 60) classProblems.push(`den boss ${id} (lvl ${m.lvl}) solos in ${mmss(med)} (median): want DEN_SOLO_MIN ${DEN_SOLO_MIN.join('–')} min`);
  for (const br of branches) {
    const f = solo[id][br];
    if (f.faint) classProblems.push(`${br} can't solo ${id} at lvl ${m.lvl}: faints at ${mmss(f.t)}`);
    else if (f.gold > SOLO_POTION_SHARE * bossWorth(id)) classProblems.push(`${br}'s potions to solo ${id} cost ${fmt(f.gold)}: more than SOLO_POTION_SHARE of what the kill pays (${fmt(bossWorth(id))})`);
    if (f.t < CLASS_FIT[0] * med || f.t > CLASS_FIT[1] * med) classProblems.push(`${br} solos ${id} (lvl ${m.lvl}) in ${mmss(f.t)}: ${(f.t / med).toFixed(2)}x the median ${mmss(med)} (want CLASS_FIT ${CLASS_FIT.join('–')})`);
  }
}
for (const [id, m] of fieldBosses) {
  const med = fightMin[id] * 60;
  if (med < FIELD_SOLO_MIN[0] * 60 || med > FIELD_SOLO_MIN[1] * 60) classProblems.push(`field boss ${id} (lvl ${m.lvl}) solos in ${mmss(med)} (median): want FIELD_SOLO_MIN ${FIELD_SOLO_MIN.join('–')} min`);
  for (const br of branches) if (fieldSolo[id][br].faint) classProblems.push(`${br} can't solo field boss ${id} at lvl ${m.lvl}: faints at ${mmss(fieldSolo[id][br].t)}`);
}
for (const [id, m] of killBosses) for (const br of branches) if (kills[id][br] > KILL_HITS) classProblems.push(`${id} (lvl ${m.lvl}) takes ${kills[id][br]} hits to KO a lvl ${Math.floor(m.lvl / 2)} ${br} (want KILL_HITS ${KILL_HITS} or fewer)`);
// a class's shape: the mean of its branches; its "bad at" column must be its lowest against the other class
const COLS = ['single', 'crowd', 'ranged', 'tough'];
const meanOf = (cls, col, L) => { const bs = branches.filter((b) => BUILDS[b].cls === cls); return bs.reduce((a, b) => a + classAt[`${b} ${L}`][col], 0) / bs.length; };
const CLS = Object.keys(BAD_AT);
const othersOf = (cls, col, L) => { const o = CLS.filter((k) => k !== cls); return o.reduce((a, k) => a + meanOf(k, col, L), 0) / o.length; };
table(`CLASSES: shape, each class ÷ the others' mean (mean of each class's branches; toughness capped at ${TOUGH_CAP} s). Bad at (BAD_AT): each class's lowest column(s) must be its bad-at (${CLS.map((k) => `${k} ${BAD_AT[k].join(' and ')}`).join(', ')})`, Object.fromEntries(CLASS_AT.flatMap((L) => CLS.map((cls) => [`${cls} lvl ${L}`, Object.fromEntries(COLS.map((col) => [col, (meanOf(cls, col, L) / Math.max(1e-9, othersOf(cls, col, L))).toFixed(2)]))]))));
for (const L of CLASS_AT) {
  // (crowd is only a shape once someone has an area skill: before the fork every branch's crowd column is its single one)
  const areaYet = branches.some((b) => classAt[`${b} ${L}`].crowd > classAt[`${b} ${L}`].single * 1.01);
  for (const [cls, all] of Object.entries(BAD_AT)) {
    const bad = all.filter((b) => b !== 'crowd' || areaYet);
    if (!bad.length) continue;
    const ratio = Object.fromEntries(COLS.map((col) => [col, meanOf(cls, col, L) / Math.max(1e-9, othersOf(cls, col, L))]));
    const low = [...COLS].sort((a, b) => ratio[a] - ratio[b]).slice(0, bad.length);
    if (bad.some((b) => !low.includes(b))) classProblems.push(`at lvl ${L} the ${cls}'s lowest column${bad.length > 1 ? 's' : ''} against the others: ${low.map((c) => `${c} (${ratio[c].toFixed(2)}x)`).join(', ')}, not its bad-at ${bad.map((c) => `${c} (${ratio[c].toFixed(2)}x)`).join(', ')}`);
  }
  // the Mage is the least tough of all (its own bad-at, and nobody else's is lower)
  for (const cls of CLS) if (cls !== 'mage' && meanOf(cls, 'tough', L) < meanOf('mage', 'tough', L)) classProblems.push(`at lvl ${L} the ${cls} is less tough than the mage (${Math.round(meanOf(cls, 'tough', L))} s vs ${Math.round(meanOf('mage', 'tough', L))} s): the mage should be the least tough`);
}

// ——— checks ———
const problems = [...classProblems];
for (const L of PROGRESS_AT.filter((L) => L >= 20)) {
  const f = minutesTo(L) / targetTo(L);
  if (f < LEVEL_PACE[0] || f > LEVEL_PACE[1]) problems.push(`reaching lvl ${L} takes ${hrs(minutesTo(L))} of farming, ${Math.round(f * 100)}% of the target pace LEVEL_MIN (want ${LEVEL_PACE[0] * 100}–${LEVEL_PACE[1] * 100}%)`);
  const fh = minutesWithSymbol(L) / targetTo(L); // (SP4: with a Priest's Holy Symbol from its level on, never under the pace's floor)
  if (fh < LEVEL_PACE[0]) problems.push(`with Holy Symbol (HOLY_SYMBOL_EXP) reaching lvl ${L} takes ${hrs(minutesWithSymbol(L))}, ${Math.round(fh * 100)}% of the target pace (want ${LEVEL_PACE[0] * 100}% or more)`);
}
// priced in minutes of farming at the aim level (PRICE_BANDS), never more than the savings by then
const bandProblem = (what, price, aim, band) => {
  const [lo, hi] = PRICE_BANDS[band], gpm = goldPerMin(aim), saved = earnedBy(aim);
  if (price > saved * AIM_MAX) return `${what} costs more than everything farmed by its aim level ${aim} (${fmt(saved)})`;
  if (price > hi * gpm || price < Math.min(lo * gpm, AIM_EARLY * saved)) return `${what} costs ${(price / gpm).toFixed(1)} min of farming at its aim level ${aim} (want ${lo}–${hi})`;
};
for (const s of sinks.filter((s) => s.aim)) {
  const p = bandProblem(s.what, s.price, s.aim, s.band);
  if (p) problems.push(p);
}
for (const L of [10, 20, 30, 40, 60, 80, 100, 120, 150, 200]) {
  const f = rebirthCost(L) / (goldPerMin(L) * 60 * REBIRTH_HOURS);
  if (f < REBIRTH_FIT[0] || f > REBIRTH_FIT[1]) problems.push(`rebirthCost(${L}) is ${f.toFixed(2)}x the sheet's ${REBIRTH_HOURS} h of farming gold (want ${REBIRTH_FIT.join('–')})`);
}
for (let i = 2; i < HOUSE_SIZES.length; i++) if (HOUSE_SIZES[i].price <= HOUSE_SIZES[i - 1].price) problems.push(`house size ${HOUSE_SIZES[i].name} isn't dearer than the one before`);
for (const [k, f] of furniture) if (!(f.price > 0)) problems.push(`furniture ${k} has no price`);
// bigger pieces cost more: a piece at least 4× the size (w×h) of another never costs less than it (rugs
// and ponds lie flat, so their h says nothing: they're left out)
const upright = furniture.filter(([, f]) => f.layer !== 'rug');
for (const [a, fa] of upright) for (const [b, fb] of upright) {
  if (fa.w * fa.h >= 4 * fb.w * fb.h && fa.price < fb.price) problems.push(`furniture ${a} is far bigger than ${b} but cheaper`);
}
for (const [k, f] of furniture) if (f.price / goldPerMin(FURN_LVL) > FURN_MAX_MIN) problems.push(`furniture ${k} costs ${(f.price / goldPerMin(FURN_LVL)).toFixed(1)} min of farming at lvl ${FURN_LVL} (max ${FURN_MAX_MIN})`);
for (const [k, f] of pets) {
  if (f.price < PET_MIN) problems.push(`pet ${k} costs ${fmt(f.price)}: under the floor PET_MIN, ${fmt(PET_MIN)} (owner)`);
  else if (f.price > PET_MIN) { const p = bandProblem(`pet ${k}`, f.price, MOBS[f.pet].lvl, 'pet'); if (p && f.price > PRICE_BANDS.pet[0] * goldPerMin(MOBS[f.pet].lvl)) problems.push(p); }
  for (const [k2, f2] of pets) if (MOBS[f2.pet].lvl < MOBS[f.pet].lvl && f2.price > f.price) problems.push(`pet ${k} (a later boss) is cheaper than ${k2}`);
}
if (upkeepDay / goldPerMin(petLvl) > PET_UPKEEP_MAX_MIN) problems.push(`a day of pet food costs ${(upkeepDay / goldPerMin(petLvl)).toFixed(1)} min of farming at lvl ${petLvl}: more than ${PET_UPKEEP_MAX_MIN}`);
for (const [a, fa] of foods) for (const [b, fb] of foods) if (fa.food > fb.food && perBelly(fa) > perBelly(fb)) problems.push(`pet food ${a} is a bigger portion than ${b} but dearer per belly`);
if (setCost < earnedIn(SET_HOURS[0]) || setCost > earnedIn(SET_HOURS[1])) problems.push(`one of every piece of furniture costs ${fmt(setCost)}: want it between what farming earns in ${SET_HOURS[0]} h and ${SET_HOURS[1]} h of play`);
for (const id of SHOP_STOCK) if (sellPrice(id) >= ITEMS[id].price) problems.push(`${id} sells for as much as it costs`);
for (const [id, c] of Object.entries(CROPS)) if (c.yield[1] * sellPrice(id) >= c.seed) problems.push(`a ${id} harvest can sell for more than its seed costs: a gold farm`);
for (const [id, r] of Object.entries(RECIPES)) {
  if (r.makes * sellPrice(id) >= brewCost(r)) problems.push(`a batch of ${id} sells for more than its ingredients cost: a gold farm`);
  if (ITEMS[id]?.kind !== 'potion') problems.push(`recipe ${id} doesn't make a potion of the same id`);
}
for (const [id, m] of mobs) {
  const v = perKill(m).value / m.exp;
  if (v > 1.2) problems.push(`${id} gives ${v.toFixed(2)} gold per EXP: more than any other mob, a gold farm`);
  if (m.elite) {
    const b = MOBS[m.base];
    if (v > perKill(b).value / b.exp * 1.01) problems.push(`elite ${id} gives more gold per EXP than its base mob ${m.base}`);
  } else if (!LEGACY_MOBS.has(id)) {
    const have = { hp: m.hp, atk: m.atk, exp: m.exp, gold: perKill(m).value };
    for (const [what, [lo, hi]] of Object.entries(MOB_FIT)) {
      const f = have[what] / curve(what, m.lvl);
      if (f < lo || f > hi) problems.push(`${id} (lvl ${m.lvl}) has ${Math.round(f * 100)}% of the frozen curve's ${what} (want ${lo * 100}–${hi * 100}%)`);
    }
  }
}
for (const [id, m] of bosses.filter(([, m]) => m.field)) {
  if (fightMin[id]) { // (SP6: priced a minute of its fight)
    const p = fieldPay(m, fightMin[id]);
    for (const what of ['gold', 'exp']) if (p[what] < FIELD_PAY[0] || p[what] > FIELD_PAY[1]) problems.push(`field boss ${id}'s ${what} pays ${p[what].toFixed(2)} min of farming a minute of its ${mmss(fightMin[id] * 60)} fight (want FIELD_PAY ${FIELD_PAY.join('–')})`);
  } else {
    const worth = perKill(m).value / goldPerMin(m.lvl), expWorth = m.exp / (KILLS_PER_MIN * farmed(m.lvl)[1].exp);
    for (const [what, w] of [['gold', worth], ['EXP', expWorth]]) if (w < FIELD_BOSS_WORTH[0] || w > FIELD_BOSS_WORTH[1]) problems.push(`field boss ${id}'s ${what} is worth ${w.toFixed(1)} min of farming (want ${FIELD_BOSS_WORTH.join('–')})`);
  }
  if (!spawned.has(id)) problems.push(`field boss ${id} never spawns`);
}
for (const [id, m] of bosses.filter(([, m]) => m.boss)) {
  const c = campRatio(m, fightMin[id]);
  if (c.exp > BOSS_CAMP_MAX) problems.push(`camping den boss ${id} for an hour gives ${c.exp.toFixed(1)}x the EXP of farming mobs (max ${BOSS_CAMP_MAX}x)`);
  if (fightMin[id] && (c.exp < BOSS_PAY[0] || c.exp > BOSS_PAY[1])) problems.push(`den boss ${id} camped for an hour (a ${mmss(fightMin[id] * 60)} fight) pays ${c.exp.toFixed(2)}x farming's EXP (want BOSS_PAY ${BOSS_PAY.join('–')})`);
}
if (!(FIELD_BOSS_RESPAWN_MS >= 10 * 60_000)) problems.push('field bosses come back too often (FIELD_BOSS_RESPAWN_MS under 10 min)');
for (const [id, it] of Object.entries(ITEMS)) {
  if (!it.lvl || !['sword', 'staff', 'bow', 'helmet'].includes(it.kind)) continue;
  // a staff's MAGIC and a bow's ATK sit on the sword curve (S1, S4: story/progression.md)
  const f = (it.kind === 'sword' || it.kind === 'bow' ? it.atk : it.kind === 'staff' ? it.magic : it.def) / curve(it.kind === 'staff' || it.kind === 'bow' ? 'sword' : it.kind, it.lvl);
  if (f < GEAR_FIT[0] || f > GEAR_FIT[1]) problems.push(`${id} (lvl ${it.lvl}) has ${Math.round(f * 100)}% of the frozen ${it.kind === 'staff' ? 'sword (as MAGIC)' : it.kind} curve (want ${GEAR_FIT[0] * 100}–${GEAR_FIT[1] * 100}%)`);
}
// A staff is its twin sword's equal: same price, MAGIC = the sword's ATK, so a drop that can be either is
// worth the same (server/rpg.js twinPick) and nobody's loot is worth less
for (const [id, it] of Object.entries(ITEMS)) {
  if (it.kind !== 'staff') continue;
  const tw = ITEMS[it.twin];
  if (!tw || tw.kind !== 'sword') problems.push(`staff ${id} has no twin sword`);
  else if (tw.price !== it.price || tw.atk !== it.magic || (tw.slots ?? 0) !== (it.slots ?? 0) || (tw.lvl ?? 0) !== (it.lvl ?? 0)) problems.push(`staff ${id} doesn't match its twin ${it.twin} (price, MAGIC vs ATK, slots, lvl)`);
}
for (const [id, m] of bosses) if (!(m.drops ?? []).some(([d]) => STAFF_OF[d])) problems.push(`boss ${id} drops no weapon with a staff twin`);
// and a bow is its sword's equal too (S4), and every sword with a staff twin has a bow twin, so every boss drops
// something for each class
for (const [id, it] of Object.entries(ITEMS)) {
  if (it.kind !== 'bow') continue;
  const tw = ITEMS[it.twin];
  if (!tw || tw.kind !== 'sword') problems.push(`bow ${id} has no twin sword`);
  else if (tw.price !== it.price || tw.atk !== it.atk || (tw.slots ?? 0) !== (it.slots ?? 0) || (tw.lvl ?? 0) !== (it.lvl ?? 0)) problems.push(`bow ${id} doesn't match its twin ${it.twin} (price, ATK, slots, lvl)`);
}
for (const [id, m] of bosses) if (m.lvl >= LOOT_TWIN_LVL && !weaponDrops(m).length) problems.push(`${m.boss ? 'boss' : 'field boss'} ${id} (lvl ${m.lvl}) drops no sword with both a staff and a bow twin: twinPick can't give every class its own kind`);
for (const [sword, staff] of Object.entries(STAFF_OF)) if (!BOW_OF[sword] && !ITEMS[sword].legacy) problems.push(`${sword} has a staff twin (${staff}) but no bow twin`);
console.log(problems.length ? `\nCHECKS FAILED:\n- ${problems.join('\n- ')}` : '\nAll checks pass.');
if (process.argv.includes('--check') && problems.length) process.exit(1);
