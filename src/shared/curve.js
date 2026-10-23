// Docs: docs/economy.md
// The frozen legacy curves (story/world/island-depth.md, G0), shared so the game and the balance sheet
// (scripts/economy.mjs) read the same numbers: the EXP curve (expToNext) and the class-change price
// (rebirthCost) in src/shared/rpg.js are built on them.
// ——— the frozen legacy curves (story/world/island-depth.md, G0) ———
// Today's mobs and gear written down level by level, frozen on 2026-10-20. NEVER REFIT: the rebalance
// changes the legacy numbers, and everything new is priced against these, so the levelling speed and the
// house and shop aims stay valid.
// - Mobs: a smoothed fit through the legacy mobs that spawn (local log-log fits around each knot level;
//   the Sprout itself at Lv 1): HP, attack, EXP, and gold = what a kill is worth (coins plus drops sold,
//   gear apart). Kills per level fall from ~10 at Lv 5 to ~5 by Lv 70, as they do today.
// - Gear: the sword and helmet ladder itself (shop gear, then each den's: Briar 12, Frostbite 18,
//   Starforged 25, Magma Maul 36, Phoenix 46, Cog Cleaver 60, Chrono 80, and the matching helmets).
// Between knots it's straight on log-log; past the last knot it carries on as a power law with `tail`
// (fitted on the Lv 30+ mobs; EXP's is expToNext's own 1.7, so kills per level stay flat from there; gear
// keeps its last segment's slope). Prices: a rough a·L^b guide for the table, not checked.
export const CURVE = {
  hp: { at: [1, 5, 10, 15, 20, 30, 40, 50, 60, 72], v: [22, 70, 222, 521, 937, 1979, 3145, 4330, 5654, 7545], tail: 1.451 },
  atk: { at: [1, 5, 10, 15, 20, 30, 40, 50, 60, 72], v: [5, 11, 22, 36, 51, 80, 109, 141, 175, 221], tail: 1.169 },
  exp: { at: [1, 5, 10, 15, 20, 30, 40, 50, 60, 72], v: [6, 18, 56, 131, 264, 645, 1120, 1685, 2421, 3660], tail: 1.7 },
  gold: { at: [1, 5, 10, 15, 20, 30, 40, 50, 60, 72], v: [5, 15, 44, 87, 145, 259, 369, 486, 621, 807], tail: 1.265 },
  sword: { at: [1, 5, 9, 12, 18, 25, 36, 46, 60, 80], v: [5, 12, 22, 32, 44, 62, 78, 92, 112, 135], tail: 0.69 },
  helmet: { at: [1, 5, 9, 12, 18, 25, 36, 46, 60, 80], v: [2, 5, 9, 14, 20, 28, 34, 40, 50, 62], tail: 0.79 },
  swordPrice: { pow: [38.616, 2.037] }, helmetPrice: { pow: [31.592, 2.022] },
};
export function curve(what, L) {
  const c = CURVE[what];
  if (c.pow) return c.pow[0] * L ** c.pow[1];
  const n = c.at.length;
  if (L >= c.at[n - 1]) return c.v[n - 1] * (L / c.at[n - 1]) ** c.tail;
  const i = Math.max(1, c.at.findIndex((k) => k >= L));
  const b = Math.log(c.v[i] / c.v[i - 1]) / Math.log(c.at[i] / c.at[i - 1]);
  return c.v[i - 1] * (L / c.at[i - 1]) ** b;
}
