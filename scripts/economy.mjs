// Docs: docs/economy.md
// The economy balance sheet (npm run economy): every faucet (what mobs and bosses drop) and every sink
// (the shop, the Boutique, furniture, house expansions, seeds), worked out from the live constants, plus the checks that
// keep prices in line with what players can actually earn. Run it after changing any drop, price, EXP
// or HP number; `--check` exits 1 if a check fails. The assumptions it makes are the constants below.
import { MOBS, SPAWNS, ITEMS, SHOPS, COSMETICS, sellPrice, expToNext, KILLS_PER_MIN, LEVEL_MIN, REBIRTH_HOURS, rebirthCost, FIELD_BOSS_RESPAWN_MS, BOSS_RESPAWN_MS, BOSS_WINDOW_MS, BOSS_REPEAT_SHARE, STAFF_OF } from '../src/shared/rpg.js';
const SHOP_STOCK = [...new Set(Object.values(SHOPS).flatMap((k) => k.stock))]; // every shopkeeper's
import { curve } from '../src/shared/curve.js';
import { HOUSE_SIZES, FURNITURE, PET_STARVE_MS } from '../src/shared/house.js';
import { CROPS, RECIPES, needs } from '../src/shared/alchemy.js';

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
// A field boss kill is worth this many minutes of farming at its level (dens are worth far more)
const FIELD_BOSS_WORTH = [1.5, 8];
// Camping a den boss (S0, the reward window): a kill every BOSS_RESPAWN_MS + CAMP_FIGHT_MIN, one full
// reward per BOSS_WINDOW_MS and BOSS_REPEAT_SHARE for the rest. Its EXP an hour must stay within
// BOSS_CAMP_MAX times farming mobs at the boss's level, so bosses are worth doing but not the way to level
// (before S0, a full reward every kill: ~3x at this pace, ~10x for someone strong enough to kill it each minute)
const CAMP_FIGHT_MIN = 2;
const BOSS_CAMP_MAX = 2;

const avg = ([, chance, lo, hi]) => chance * (lo + hi) / 2;
const isGear = (id) => ['sword', 'staff', 'helmet'].includes(ITEMS[id]?.kind);
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

const expPerMin = (L) => farmed(L)[1].exp * KILLS_PER_MIN;
// A den boss camped for an hour, as a multiple of an hour of farming mobs at its level (gold counts the loot)
function campRatio(m) {
  const kills = 60 / (BOSS_RESPAWN_MS / 60_000 + CAMP_FIGHT_MIN), full = Math.min(kills, 60 / (BOSS_WINDOW_MS / 60_000));
  const k = perKill(m), worth = full + (kills - full) * BOSS_REPEAT_SHARE;
  return { exp: (m.exp * worth) / (expPerMin(m.lvl) * 60), gold: ((k.value + k.gear) * worth) / (goldPerMin(m.lvl) * 60) };
}
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
  return [id, { kind: m.field ? 'field' : 'den', lvl: m.lvl, hp: m.hp, exp: m.exp, gold: fmt(k.gold), sell: fmt(k.sell), 'gear sold': fmt(k.gear), 'vs 1 min farming': `${(k.value / goldPerMin(m.lvl)).toFixed(1)}x`,
    'camped 1 h vs mobs (exp / gold)': m.field ? '' : `${campRatio(m).exp.toFixed(1)}x / ${campRatio(m).gold.toFixed(1)}x` }];
})));
// The pace (L1): play time to reach a level against the owner's target, LEVEL_MIN(L) minutes a level
// (src/shared/rpg.js), never faster than the old curve; the check keeps the play time within LEVEL_PACE of it
const LEVEL_PACE = [0.85, 1.25];
const targetTo = (L) => { let t = 0; for (let l = 1; l < L; l++) t += LEVEL_MIN(l); return t; };
const PROGRESS_AT = [5, 10, 13, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 170, 200];
table(`PROGRESS: farming your own level at ${KILLS_PER_MIN} kills/min (mobs only, no bosses)`, Object.fromEntries(PROGRESS_AT.map((L) => [`lvl ${L}`, {
  farming: farmed(L)[0], 'gold/min': fmt(goldPerMin(L)), 'min a level': (expToNext(L) / farmed(L)[1].exp / KILLS_PER_MIN).toFixed(1), 'play time to reach': hrs(minutesTo(L)), 'target (LEVEL_MIN)': hrs(targetTo(L)), 'gold earned by then': fmt(earnedBy(L)),
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
const furniture = Object.entries(FURNITURE).filter(([, f]) => !f.pet).sort((a, b) => a[1].price - b[1].price);
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

// ——— checks ———
const problems = [];
for (const L of PROGRESS_AT.filter((L) => L >= 20)) {
  const f = minutesTo(L) / targetTo(L);
  if (f < LEVEL_PACE[0] || f > LEVEL_PACE[1]) problems.push(`reaching lvl ${L} takes ${hrs(minutesTo(L))} of farming, ${Math.round(f * 100)}% of the target pace LEVEL_MIN (want ${LEVEL_PACE[0] * 100}–${LEVEL_PACE[1] * 100}%)`);
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
  const worth = perKill(m).value / goldPerMin(m.lvl), expWorth = m.exp / (KILLS_PER_MIN * farmed(m.lvl)[1].exp);
  for (const [what, w] of [['gold', worth], ['EXP', expWorth]]) if (w < FIELD_BOSS_WORTH[0] || w > FIELD_BOSS_WORTH[1]) problems.push(`field boss ${id}'s ${what} is worth ${w.toFixed(1)} min of farming (want ${FIELD_BOSS_WORTH.join('–')})`);
  if (!spawned.has(id)) problems.push(`field boss ${id} never spawns`);
}
for (const [id, m] of bosses.filter(([, m]) => m.boss)) if (campRatio(m).exp > BOSS_CAMP_MAX) problems.push(`camping den boss ${id} for an hour gives ${campRatio(m).exp.toFixed(1)}x the EXP of farming mobs (max ${BOSS_CAMP_MAX}x)`);
if (!(FIELD_BOSS_RESPAWN_MS >= 10 * 60_000)) problems.push('field bosses come back too often (FIELD_BOSS_RESPAWN_MS under 10 min)');
for (const [id, it] of Object.entries(ITEMS)) {
  if (!it.lvl || !['sword', 'staff', 'helmet'].includes(it.kind)) continue;
  // a staff's MAGIC sits on the sword curve (S1, story/progression.md)
  const f = (it.kind === 'sword' ? it.atk : it.kind === 'staff' ? it.magic : it.def) / curve(it.kind === 'staff' ? 'sword' : it.kind, it.lvl);
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
console.log(problems.length ? `\nCHECKS FAILED:\n- ${problems.join('\n- ')}` : '\nAll checks pass.');
if (process.argv.includes('--check') && problems.length) process.exit(1);
