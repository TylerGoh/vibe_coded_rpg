// Docs: docs/sandbox.md
// The dev sandbox at /rpg_dev (owner, 2026-10-27; story/roadmap.md 5b): what the client and the server share about
// it. Only a server run with SANDBOX=1 ever puts anyone in the Training Yard or spawns a dummy (server/sandbox.js);
// on the live server the room exists but no door leads to it, and every sandbox message is refused.
// No imports here: sim.js and rpg.js both read this file.

export const ARENA = 53; // the Training Yard's room id (ROOMS in sim.js; a combat room: COMBAT_ROOMS in rpg.js)
export const ARENA_W = 2200;
export const ARENA_SPAWN_X = 260; // where you stand on logging in, waking up and coming back from a boss
// two wooden stands to jump on (an area skill's arc, a Leap Slam), drawn by src/sandbox-art.js
export const ARENA_PLATFORMS = [
  { x: 640, y: 340, w: 200, kind: 'stand' },
  { x: 1380, y: 340, w: 200, kind: 'stand' },
];
// The dummies (MOBS.dummy, MOBS.dummy_spar in rpg.js): never die, give nothing. DUMMY_HP is only how full the bar
// starts; each hit sets it back to the dummy's HP setting (dummyHp: the panel's share, for "below x% HP" skills).
export const DUMMY_HP = 100_000_000;
export const DUMMY_HP_SHARES = [1, 0.5, 0.25, 0.1];
export const DUMMY_MAX = 12; // dummies in the yard at once
export const DUMMY_PACK = 5; // a pack (for area skills)
export const DUMMY_GAP = 70; // px between a pack's dummies
// the one that hits back: a share of your max HP a hit (like a boss's, bossHitPct), whatever your level
export const SPAR_HIT_PCT = 0.06;
// how often the DPS readout is sent while it changes (ms)
export const METER_EVERY_MS = 250;
// the level shortcuts on the panel (the advancements, then the cap)
export const SANDBOX_LEVELS = [1, 10, 30, 60, 100, 150, 200];
export const SANDBOX_MAX_LVL = 200;
// an ability point build in one go: every point into the class's main stat
export const MAIN_STAT = { novice: 'str', warrior: 'str', mage: 'int', cleric: 'int', archer: 'dex' };
// "Stock potions": these, SANDBOX_POTS of each, the first three on the potion hotbar
export const SANDBOX_POTIONS = ['mega_elixir', 'star_tonic', 'barrier_draught', 'cleansing_tonic'];
export const SANDBOX_POTS = 999;
