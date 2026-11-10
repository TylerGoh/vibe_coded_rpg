// Docs: docs/combat/challenges.md
// Boss challenges ("tanky to tricky", story/tricky-plan.md): the table of challenge types and the helpers both sides
// share (the snare's key combo from a seed, how long it is, the sheet's uptime). The server starts and judges them
// (server/challenge.js); the client draws them and takes the combo (src/challenge.js); the physics side (trapped,
// controls swapped) is `tr` / `cs` in sim.js step().

// One row per type (A1–A23 in the plan). built: switched on in the code so far (T0: the snare and the swap; T1a: the
// rhythm lock, the rescue cage, thin gaps, the darkness, the moving arena, tethers, the parry, the group key-lock, and
// the three that live inside the final bosses' loops: two at once, the moving safe zone and the fake-outs' cousin, Head
// Swap; T1b: the mirror trap, the laser grid, late tells, the fake-outs, floor-is-lava waves, carrying the thing, the
// tilting floor and Rewind); min: how many fighters it needs (a party-only type stays off below that); banner: G2's one line, shown the
// first time a character meets it (c.seen), never again. Only built types are ever sent. loop: only a boss's own loop
// starts it (server/final.js, server/fenrir.js), never `start` (so the sandbox's Challenge now leaves it out).
export const CHALLENGES = {
  snare: { a: 1, name: 'Snare', built: true, min: 1, banner: 'Snared! Enter the arrows to break free' },
  mash: { a: 2, name: 'Mash free', min: 1, banner: 'Stuck! Mash Jump to break out' },
  rhythm: { a: 3, name: 'Rhythm lock', built: true, min: 1, banner: 'Fettered! Enter each arrow on the beat' },
  mirror: { a: 4, name: 'Mirror trap', built: true, min: 1, banner: 'A mirrored snare! Enter what the arrows mean' },
  rescue: { a: 5, name: 'Rescue trap', built: true, min: 2, banner: 'Caged! A friend at the cage can enter its arrows' },
  gaps: { a: 6, name: 'Thin gaps', built: true, min: 1, banner: 'A wall with one gap: stay in it' },
  grid: { a: 7, name: 'Laser grid', built: true, min: 1, banner: 'Beams that blink on and off' },
  rings: { a: 8, name: 'Bullet rings', min: 1, banner: 'Rings with gaps in them' },
  safezone: { a: 9, name: 'Moving safe zone', built: true, loop: true, min: 1, banner: 'The safe spot moves' },
  late: { a: 10, name: 'Late tells', built: true, min: 1, banner: 'Time stops! When he glows, move: the marks come too late' },
  headswap: { a: 0, name: 'Head Swap', built: true, loop: true, min: 1, banner: 'Two heads rear: watch which one glows' },
  hunt: { a: 0, name: 'The Hunt', built: true, loop: true, min: 1, banner: 'Hunted! The sons run at the two farthest apart' },
  rewind: { a: 0, name: 'Rewind', built: true, min: 1, banner: 'Rewind! Where you stand now, you go back to' },
  feint: { a: 11, name: 'Fake-outs', built: true, loop: true, min: 1, banner: 'Count the ticks: it lands off the beat' },
  lava: { a: 12, name: 'Floor is lava', built: true, loop: true, min: 1, banner: 'The plates heat in a wave: keep ahead of it' },
  double: { a: 13, name: 'Two at once', built: true, loop: true, min: 1, banner: 'Two moves at once' },
  jobs: { a: 14, name: 'Adds with jobs', min: 1, banner: 'Some of these adds matter more than others' },
  arena: { a: 15, name: 'Moving arena', built: true, min: 1, banner: 'The ledges sink! Find one that holds' },
  tilt: { a: 15, name: 'Tilting floor', built: true, min: 1, banner: 'The floor tilts! Walk uphill, or stand on a ledge' },
  dark: { a: 16, name: 'Darkness', built: true, min: 1, banner: 'The lights go out' },
  swap: { a: 17, name: 'Controls swap', built: true, min: 1, banner: 'Turned around! Left is right for a few seconds' },
  tether: { a: 18, name: 'Tethers', built: true, min: 2, banner: 'Chained together! Stay close' },
  punish: { a: 19, name: 'Punish window', min: 1, banner: 'It missed everyone: hit it now' },
  parry: { a: 20, name: 'Parry', built: true, min: 1, banner: 'A glowing hit: attack right as it lands' },
  airweak: { a: 21, name: 'Weak spot mid-air', min: 1, banner: 'A weak spot up high' },
  carry: { a: 22, name: 'Carry the thing', built: true, min: 1, banner: 'A piece of the tooth! Pick it up and throw it back at her' },
  lock: { a: 23, name: 'Group key-lock', built: true, min: 2, banner: 'Everyone enter the arrows together' },
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

// ——— T1a's types (story/tricky-plan.md: the top and final bosses of Greenhollow and Frostpeak) ———
// Every trap below sets `tr` like the snare (a predicted edit at the hit's input); TRAP_MAX is the longest a counted
// one can last (a u8 of ticks below TRAP_HOLD).
export const TRAP_MAX = TRAP_HOLD - 1;

// A3, the rhythm lock (Fenrir's fetters, Gleipnir): a snare whose arrows only count on the beat. Beats every RHYTHM_BEAT
// s from the moment you're caught (rings pulse in to each); a press more than RHYTHM_WINDOW s off a beat is wrong (the
// combo starts over). The server checks the order and that the whole combo took at least (len - 1) beats, less
// RHYTHM_SLACK_MS (it can't see the timing itself). Held at most RHYTHM_S.
export const RHYTHM_BEAT = 0.5, RHYTHM_WINDOW = 0.14, RHYTHM_S = 4.2, RHYTHM_SLACK_MS = 350;
export const RHYTHM_TICKS = Math.min(TRAP_MAX, Math.round(RHYTHM_S * 60));
export const rhythmLen = (lvl) => snareLen(lvl) - 1; // (one arrow fewer than a snare: each one waits for its beat)

// A5, the rescue cage (party: 2+ fighting): a cage drops on one slime (marked CAGE_WARN on the floor and over it, CAGE_R
// either side); caught, it's held until freed (`tr` = TRAP_HOLD) and can't enter its own arrows: a friend within
// RESCUE_R of it enters them (its combo shows over the cage to everyone else). Not freed in CAGE_S: knocked out (the S5
// rule: a party mechanic may be deadly).
export const CAGE_WARN = 1.6, CAGE_R = 52, CAGE_S = 12, RESCUE_R = 120, CAGE_HIT = 0.4;

// A6, thin gaps (Fenrir's Howl brings the roof's ice down): ice falls along the whole den but one gap GAP_W wide, its
// middle at gapX(h, t): from x0 at a steady v px/s (0 in the phase that teaches it). Warned GAPS_WARN, falling GAPS_LIVE;
// anyone whose middle is past GAP_W / 2 - GAP_GRACE from the gap's middle is hit (Dash's i-frames skip it, as ever).
export const GAPS_WARN = 1.8, GAPS_LIVE = 0.9, GAP_W = 84, GAP_GRACE = 12, GAP_SLIDE = 150, GAPS_HIT = 1.3;
export const gapX = (h, t) => h.x0 + h.v * Math.max(0, t - h.from);

// A9, the moving safe zone (Ladon's Hundred Heads from phase 3): each gap shrinks from HUNDRED_GAP_W to SAFE_SHRINK_W
// and drifts up to SAFE_DRIFT px while it warns; judged where it ends (u.to).
export const SAFE_SHRINK_W = 64, SAFE_DRIFT = 110;
export const gapsAt = (from, to, k) => from.map(([a, b], i) => [a + (to[i][0] - a) * k, b + (to[i][1] - b) * k]);

// A13, two at once (Ladon from phase 2): a Lash or the Rows comes with a Bite from another head, DOUBLE_DELAY s in.
export const DOUBLE_DELAY = 0.5;
// Head Swap (Ladon, phase 3 on): two heads rear at two marks, the real one's eyes lit; HEADSWAP_AT of the way through
// the wind-up they trade marks (each turns to the other's). The lit one bites; the other pulls back.
export const HEADSWAP_AT = 0.5, HEADSWAP_SPREAD = 260;

// A15, the moving arena (the Root Warden): roots drag ledges (indices in the room's platforms) down into the floor for
// ARENA_S after ARENA_WARN (they shake meanwhile), then raise them again. On the slime it's `pf` (sim.js): a mask of
// the platforms that are down for it, set by predicted edits as each client's clock passes the schedule ({t:'pf'}).
// From its phase 2 the floor's roots strike while they're down (a grid ARENA_GRID_AT s after they sink).
export const ARENA_WARN = 1.5, ARENA_S = 6, ARENA_SINK = 0.35, ARENA_GRID_AT = 1.2;

// A16, darkness (Fenrir, phase 2 on): DARK_S of black but a light round each slime (DARK_R) and the boss's eyes; the
// moves go on in it.
export const DARK_S = 7, DARK_R = 95;

// A18, tethers (party: 2+; Sigrun's chains of old ice): pairs of fighters (an odd one out is chained to the boss) for
// TETHER_S; past TETHER_R apart it snaps: TETHER_HP of max HP to both (server-judged from positions, no knockback).
export const TETHER_S = 10, TETHER_R = 280, TETHER_HP = 0.3, TETHER_WARN = 1;

// A20, the parry (Sigrun's shield bash): her shield glows BASH_WARN[stage] s, then she drives it BASH_REACH px in front
// (anyone low in it: BASH_HIT × ATK, BASH_KNOCK). Attack within PARRY_MS before it lands (or PARRY_LATE_MS after) while
// in it: parried: no damage, she staggers PARRY_STAGGER_S and takes PARRY_REFLECT of her max HP (from you).
export const BASH_WARN = [1.3, 1.05, 0.85], BASH_REACH = 230, BASH_H = 110, BASH_HIT = 1.6, BASH_KNOCK = 480;
export const PARRY_MS = 260, PARRY_LATE_MS = 90, PARRY_STAGGER_S = 2.5, PARRY_REFLECT = 0.004;

// A23, the group key-lock (party: 2+; the Root Warden's root shield): roots seize everyone at once (dodgeable like a
// snare, LOCK_WARN); all those caught get the SAME arrows, and if every one of them is free within LOCK_S of the first,
// the barrier breaks (a stagger). Out of step, or one too slow: it holds.
export const LOCK_WARN = 1.3, LOCK_S = 2, LOCK_R = 70;

// The Hunt (Fenrir, phase 3 on): Skoll and Hati each run at one of the two fighters farthest apart (alone: both at you)
// for HUNT_S at HUNT_SPEED ×; if the brothers meet (within HUNT_CLASH px) they crash into each other: stunned
// HUNT_STUN_S, HUNT_CLASH_HP of their max HP off each. Stay together and they collide.
export const HUNT_S = 8, HUNT_SPEED = 1.7, HUNT_CLASH = 50, HUNT_STUN_S = 4, HUNT_CLASH_HP = 0.25;

// ——— T1b's types (Emberdeep's and the end-game's big four: Brenna, the Colossus, Chronos, Typhon) ———

// A4, the mirror trap (Typhon, phase 4): a snare whose arrows are drawn mirrored: flip 'h' (left and right traded) or 'v'
// (up and down); you enter what they mean (the true combo, comboFor as ever). Its art is the snare's (`style`).
export const MIRROR = { h: [1, 0, 2, 3], v: [0, 1, 3, 2] }; // flip → the arrow drawn for each true one

// A7, the laser grid (the Colossus's pistons): LASER_COLS beams down from the roof, every LASER_GAP px, LASER_W wide,
// each on or off for each of LASER_BEATS[stage] beats of LASER_BEAT s (`masks`, one per beat, sent with the event). The
// next beat's beams glow faintly a beat ahead; a safe lane two beams wide steps at most one beam a beat, so there's
// always somewhere to walk to. Any height (they come from the roof); LASER_HIT × ATK.
export const LASER_COLS = 10, LASER_GAP = 150, LASER_W = 64, LASER_BEAT = 0.75, LASER_BEATS = [5, 6, 8], LASER_WARN = 1.2, LASER_HIT = 1.2;
export const laserX = (c) => LASER_GAP / 2 + c * LASER_GAP;

// A10, late tells (Chronos's stopped hour): he gathers himself LATE_WIND s (he glows and the room greys: time stops),
// then the hands of the clock come down where everyone stood when it began, the marks showing only LATE_TELL s first.
// A column LATE_R either side, any height; LATE_HIT × ATK. Moving as he glows is the answer.
export const LATE_WIND = 1.1, LATE_TELL = 0.3, LATE_R = 64, LATE_HIT = 1.4;

// A11, fake-outs (the Colossus): it rears up for a slam and ticks: FEINT_BEAT s a tick, FEINT_TICKS (min, max) of them,
// and it comes down half a beat after a tick (off the beat), never on one; from its phase 2 it may cancel into Gear Teeth
// instead (FEINT_CANCEL). The landing is the ordinary slam (its radius FEINT_R): the jump itself is the last tell.
export const FEINT_BEAT = 0.5, FEINT_TICKS = [2, 4], FEINT_CANCEL = 0.35, FEINT_R = 300;

// A12, floor is lava (Typhon, from phase 2): the plates heat one after another from one end, LAVA_GAP s apart, each
// glowing LAVA_GLOW[phase] s then molten LAVA_HOT s (the plates' own heat: MOLTEN_HP, server-timed); a crusted plate is
// spared. Keep ahead of the wave, or let it pass on a ledge.
export const LAVA_GAP = 0.45, LAVA_GLOW = [1.1, 1.1, 0.9, 0.75], LAVA_HOT = 2.6;

// A15's cousin, the tilting floor (Brenna's hoist): after TILT_WARN the floor leans one way for TILT_S; on it you slide
// downhill TILT_V[stage] px/s (`tl` in sim.js step(): walk against it; ledges don't tilt). Within TILT_EDGE px of the low
// wall the hoist's chain grinds: TILT_HP of max HP every TILT_TICK s (server-judged, like Typhon's plates).
// `tl`: 0 level, else 1 + 2 × stage + (1 if it leans right): odd leans left.
export const TILT_WARN = 1.4, TILT_S = 6, TILT_V = [80, 100, 120], TILT_EDGE = 150, TILT_HP = 0.04, TILT_TICK = 0.5;
export const tiltOf = (dir, stage) => 1 + 2 * Math.min(TILT_V.length - 1, stage) + (dir > 0 ? 1 : 0);
export const tiltV = (tl) => (tl ? (tl % 2 ? -1 : 1) * TILT_V[(tl - 1) >> 1] : 0); // px/s, signed

// A22, carry the thing (Brenna): she knocks a chip off the tooth; it lands CARRY_FAR px from her and lies there CARRY_S.
// Pick it up (your loot key, within CARRY_R) and attack to throw it (no attacking or casting while you carry it): if
// she's within THROW_RANGE that way, it hits her: CARRY_HIT of her max HP and a CARRY_STAGGER_S stagger, twice both
// from behind (the strap on her back). Missed, it lands and can be picked up again. Not back in her in CARRY_S, it
// bursts: CARRY_BURST_HP of max HP to anyone within CARRY_BURST_R (the one carrying it too).
export const CARRY_S = 12, CARRY_R = 70, CARRY_FAR = [260, 480], THROW_RANGE = 560, CARRY_HIT = 0.004, CARRY_STAGGER_S = 2.5;
export const CARRY_BURST_R = 220, CARRY_BURST_HP = 0.35;

// Rewind (Chronos, from phase 2): a ghost stays where each slime stood; REWIND_S later everyone snaps back to theirs
// (a predicted edit, {t:'rw'}: the server takes it within REWIND_SLACK px of where it had you) and the attacks of those
// REWIND_S come again, in the same order. Dodge them twice.
export const REWIND_S = 3, REWIND_SLACK = 150;

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
