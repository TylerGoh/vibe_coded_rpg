// Docs: docs/combat/challenges.md
// Boss challenges ("tanky to tricky", story/tricky-plan.md): the table of challenge types and the helpers both sides
// share (the snare's key combo from a seed, how long it is, the sheet's uptime). The server starts and judges them
// (server/challenge.js); the client draws them and takes the combo (src/challenge.js); the physics side (trapped,
// controls swapped) is `tr` / `cs` in sim.js step().

// One row per type (A1–A23 in the plan). built: switched on in the code so far (T0: the snare and the swap); min: how
// many fighters it needs (a party-only type stays off below that); banner: G2's one line, shown the first time a
// character meets it (c.seen), never again. Only built types are ever sent.
export const CHALLENGES = {
  snare: { a: 1, name: 'Snare', built: true, min: 1, banner: 'Snared! Enter the arrows to break free' },
  mash: { a: 2, name: 'Mash free', min: 1, banner: 'Stuck! Mash Jump to break out' },
  rhythm: { a: 3, name: 'Rhythm lock', min: 1, banner: 'Locked! Enter each arrow on the beat' },
  mirror: { a: 4, name: 'Mirror trap', min: 1, banner: 'A mirrored snare! Enter what the arrows mean' },
  rescue: { a: 5, name: 'Rescue trap', min: 2, banner: 'Caged! A friend at the cage can enter its arrows' },
  gaps: { a: 6, name: 'Thin gaps', min: 1, banner: 'A wall with one gap' },
  grid: { a: 7, name: 'Laser grid', min: 1, banner: 'Beams that blink on and off' },
  rings: { a: 8, name: 'Bullet rings', min: 1, banner: 'Rings with gaps in them' },
  safezone: { a: 9, name: 'Moving safe zone', min: 1, banner: 'The safe spot moves' },
  late: { a: 10, name: 'Late tells', min: 1, banner: 'Watch the boss, not the floor' },
  feint: { a: 11, name: 'Fake-outs', min: 1, banner: 'Not every wind-up lands when you think' },
  lava: { a: 12, name: 'Floor is lava', min: 1, banner: 'The floor heats up in waves' },
  double: { a: 13, name: 'Two at once', min: 1, banner: 'Two moves at once' },
  jobs: { a: 14, name: 'Adds with jobs', min: 1, banner: 'Some of these adds matter more than others' },
  arena: { a: 15, name: 'Moving arena', min: 1, banner: 'The floor itself moves' },
  dark: { a: 16, name: 'Darkness', min: 1, banner: 'The lights go out' },
  swap: { a: 17, name: 'Controls swap', built: true, min: 1, banner: 'Turned around! Left is right for a few seconds' },
  tether: { a: 18, name: 'Tethers', min: 2, banner: 'Chained together! Stay close' },
  punish: { a: 19, name: 'Punish window', min: 1, banner: 'It missed everyone: hit it now' },
  parry: { a: 20, name: 'Parry', min: 1, banner: 'A glowing hit: attack right as it lands' },
  airweak: { a: 21, name: 'Weak spot mid-air', min: 1, banner: 'A weak spot up high' },
  carry: { a: 22, name: 'Carry the thing', min: 1, banner: 'Something to pick up' },
  lock: { a: 23, name: 'Group key-lock', min: 2, banner: 'Everyone enter the arrows together' },
};

// The four arrows of a combo: the bound Left / Right / Jump / Down keys (rebinding works: docs/ui/keybinds.md)
export const ARROWS = ['left', 'right', 'up', 'down'];
export const ARROW_GLYPH = ['◀', '▶', '▲', '▼'];

// A1, the snare. TRAP_HOLD in `tr` means "until freed" (A5's cage, later); anything less counts down a tick a step.
export const TRAP_HOLD = 255;
export const SNARE_S = 4; // seconds to enter the combo before it fails (fits a u8 of ticks: under 4.25 s)
export const SNARE_TICKS = Math.round(SNARE_S * 60);
export const SNARE_WARN = 1.1; // s the roots show on the floor before they spring
export const SNARE_LIVE = 0.45; // s they're up and catching
export const SNARE_R = 42; // px either side of the mark
export const SNARE_HIT = 0.3; // × the boss's ATK: the snare itself does little
export const SNARE_PUNISH = 2; // failing it: the boss's next hit on you does this ×
export const PUNISH_KEEP_S = 10; // that waits this long for the hit, then lapses
// Combo length by the boss's level (plan's default): 3 for the Novices' bosses, 4 to Lv 60, 5 to 120, 6 past
export const snareLen = (lvl) => (lvl < 10 ? 3 : lvl < 60 ? 4 : lvl < 120 ? 5 : 6);

// A17, the controls swap: a slow orb; a hit swaps left and right for SWAP_S (`cs`, counted down in step())
export const SWAP_S = 3;
export const SWAP_TICKS = Math.round(SWAP_S * 60);
export const SWAP_SPEED = 330; // px/s
export const SWAP_R = 13; // the orb's radius
export const SWAP_HIT = 0.6; // × ATK
export const SWAP_KNOCK = 220;

// How long the server keeps a challenge claimable after it should have landed (lag), ms
export const CLAIM_SLACK_MS = 1500;

// A seeded generator (mulberry32): the same seed gives the same combo on both sides
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Each slime caught by the same snare gets its own combo: the challenge's seed mixed with the slime's id
export const seedFor = (seed, id) => (seed ^ Math.imul((id | 0) + 1, 2654435761)) >>> 0;
// len arrows (0 left, 1 right, 2 up, 3 down), never the same one three times running
export function comboFor(seed, len) {
  const r = rng(seed), out = [];
  while (out.length < len) {
    const a = Math.floor(r() * 4);
    if (out.length >= 2 && out[out.length - 1] === a && out[out.length - 2] === a) continue;
    out.push(a);
  }
  return out;
}
export const sameCombo = (a, b) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);

// The economy sheet's downtime (scripts/economy.mjs): a snared or carrying slime isn't hitting, so a boss with
// challenges (`ch` on its MOBS row: the types it uses) takes longer by 1 / uptime. 1 for a boss without any yet.
export const UPTIME_DEN = 0.9, UPTIME_TOP = 0.8;
export const uptimeOf = (m) => (m?.ch?.length ? (m.top || m.final ? UPTIME_TOP : UPTIME_DEN) : 1);
