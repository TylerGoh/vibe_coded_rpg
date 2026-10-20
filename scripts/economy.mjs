// Docs: docs/economy.md
// The economy balance sheet (npm run economy): every faucet (what mobs and bosses drop) and every sink
// (the shop, the Boutique, furniture, house expansions), worked out from the live constants, plus the checks that
// keep prices in line with what players can actually earn. Run it after changing any drop, price, EXP
// or HP number; `--check` exits 1 if a check fails. The assumptions it makes are the constants below.
import { MOBS, SPAWNS, ITEMS, SHOP_STOCK, COSMETICS, sellPrice, expToNext } from '../src/shared/rpg.js';
import { HOUSE_SIZES, FURNITURE } from '../src/shared/house.js';

// Assumptions (see docs/economy.md): a player farming mobs at their own level, solo, kills about this many
// a minute counting walking, pickups and potion breaks. Bosses aren't counted in "earned by level".
const KILLS_PER_MIN = 6;
// A sink aimed at level L (its `aim`) should cost between these shares of what farming has earned by L
const AIM_MIN = 0.25, AIM_MAX = 1.0;
// Furniture: buying one of every piece is a long-term collection goal, between what farming has earned by
// these two levels
const SET_FROM = 40, SET_TO = 90;

const avg = ([, chance, lo, hi]) => chance * (lo + hi) / 2;
const isGear = (id) => ['sword', 'helmet'].includes(ITEMS[id]?.kind);
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
const mobs = Object.entries(MOBS).filter(([id]) => spawned.has(id));
const bosses = Object.entries(MOBS).filter(([, m]) => m.boss);
// The mob a level-L player farms: the toughest one at or below their level (the first one below that)
const farmed = (L) => mobs.filter(([, m]) => m.lvl <= L).sort((a, b) => b[1].lvl - a[1].lvl)[0] ?? mobs.sort((a, b) => a[1].lvl - b[1].lvl)[0];
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
table('FAUCETS: one boss kill (loot is shared: one set per kill, whoever picks it up; respawn BOSS_RESPAWN_MS)', Object.fromEntries(bosses.map(([id, m]) => {
  const k = perKill(m);
  return [id, { lvl: m.lvl, hp: m.hp, exp: m.exp, gold: fmt(k.gold), sell: fmt(k.sell), 'gear sold': fmt(k.gear), 'vs 1 min farming': `${(k.value / goldPerMin(m.lvl)).toFixed(1)}x` }];
})));
table(`PROGRESS: farming your own level at ${KILLS_PER_MIN} kills/min (mobs only, no bosses)`, Object.fromEntries([5, 10, 13, 15, 20, 25, 30, 40, 50, 60, 70, 80].map((L) => [`lvl ${L}`, {
  farming: farmed(L)[0], 'gold/min': fmt(goldPerMin(L)), 'play time to reach': hrs(minutesTo(L)), 'gold earned by then': fmt(earnedBy(L)),
}])));

// Sinks: what each costs in minutes of farming at the level you'd buy it, and as a share of lifetime gold
const levelFor = (price) => {
  for (let L = 1; L <= 120; L++) if (earnedBy(L) >= price) return L;
  return '>120';
};
const sinks = [
  ...SHOP_STOCK.map((id) => ({ what: `shop: ${ITEMS[id].name}`, price: ITEMS[id].price })),
  ...Object.values(COSMETICS).map((c) => ({ what: `boutique: ${c.name}`, price: c.price })),
  ...HOUSE_SIZES.slice(1).map((s) => ({ what: `house: ${s.name}`, price: s.price, aim: s.aim })),
];
const furniture = Object.entries(FURNITURE).sort((a, b) => a[1].price - b[1].price);
table('SINKS: what gold buys ("first affordable" = the level where lifetime farming gold reaches the price)', Object.fromEntries(sinks.map((s) => [s.what, {
  price: fmt(s.price), 'first affordable': `lvl ${levelFor(s.price)}`,
  ...(s.aim ? { aim: `lvl ${s.aim}`, 'share of gold by aim': `${Math.round((s.price / earnedBy(s.aim)) * 100)}%`, 'farming min at aim': Math.round(s.price / goldPerMin(s.aim)) } : {}),
}])));

table('SINKS: furniture (the furniture store), cheapest first', Object.fromEntries(furniture.map(([k, f]) => [k, {
  price: fmt(f.price), size: `${f.w}×${f.h}`, 'first affordable': `lvl ${levelFor(f.price)}`, 'farming min at lvl 30': (f.price / goldPerMin(30)).toFixed(1), 'at lvl 70': (f.price / goldPerMin(70)).toFixed(1),
}])));
const setCost = furniture.reduce((a, [, f]) => a + f.price, 0);
console.log(`One of every piece: ${fmt(setCost)} gold (farming has earned that by lvl ${levelFor(setCost)}; target lvl ${SET_FROM}–${SET_TO})`);

// ——— checks ———
const problems = [];
for (const s of sinks.filter((s) => s.aim)) {
  const share = s.price / earnedBy(s.aim);
  if (share < AIM_MIN || share > AIM_MAX) problems.push(`${s.what} costs ${Math.round(share * 100)}% of the gold farmed by its aim level ${s.aim} (want ${AIM_MIN * 100}–${AIM_MAX * 100}%)`);
}
for (let i = 2; i < HOUSE_SIZES.length; i++) if (HOUSE_SIZES[i].price <= HOUSE_SIZES[i - 1].price) problems.push(`house size ${HOUSE_SIZES[i].name} isn't dearer than the one before`);
for (const [k, f] of furniture) if (!(f.price > 0)) problems.push(`furniture ${k} has no price`);
// bigger pieces cost more: a piece at least 4× the size (w×h) of another never costs less than it (rugs
// and ponds lie flat, so their h says nothing: they're left out)
const upright = furniture.filter(([, f]) => f.layer !== 'rug');
for (const [a, fa] of upright) for (const [b, fb] of upright) {
  if (fa.w * fa.h >= 4 * fb.w * fb.h && fa.price < fb.price) problems.push(`furniture ${a} is far bigger than ${b} but cheaper`);
}
if (setCost < earnedBy(SET_FROM) || setCost > earnedBy(SET_TO)) problems.push(`one of every piece of furniture costs ${fmt(setCost)}: want it between the gold earned by lvl ${SET_FROM} and lvl ${SET_TO}`);
for (const id of SHOP_STOCK) if (sellPrice(id) >= ITEMS[id].price) problems.push(`${id} sells for as much as it costs`);
for (const [id, m] of mobs) {
  const v = perKill(m).value / m.exp;
  if (v > 1.2) problems.push(`${id} gives ${v.toFixed(2)} gold per EXP: more than any other mob, a gold farm`);
}
console.log(problems.length ? `\nCHECKS FAILED:\n- ${problems.join('\n- ')}` : '\nAll checks pass.');
if (process.argv.includes('--check') && problems.length) process.exit(1);
