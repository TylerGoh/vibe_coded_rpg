// Docs: docs/places/escapement.md, docs/combat/bosses.md
// The Escapement (the Citadel's C6 (c), story/c6-plan.md): the Catch's geometry and every tuning constant of its own
// mechanics (the Beat: the pendulum's sweep; the Tick: both pallets struck in one beat; the pawls jamming them; the sweep
// widening in phase 3; the Stopping in phase 4; its moves and ultimates), shared by the brain (server/escapement.js) and
// the client (src/escapement.js, src/dens-esc.js). Its FINAL row (phases, loops, ultimates) is in src/shared/final.js
// with the others'. Nothing here imports src/shared/rpg.js.
import { FIN_W, FIN_FLOOR } from './final.js';

export const ESC_MID = FIN_W / 2; // under the arbor, the middle of the Catch (the boss mob's x: it never moves)
// The arena: a low bearing housing at each end, a ledge on each side, and the highest bearing ledge at each end (the
// Counter-Swing's only shelter is the one at the end the bob swings to). Every ledge is over the bob's arc. A den's own
// platforms, never changed mid-fight (DENS[].platforms). Each step up is about 110 px (a jump is ~139).
export const CATCH_PLATFORMS = [
  { x: 150, y: 340, w: 170, kind: 'housing' },
  { x: 1180, y: 340, w: 170, kind: 'housing' },
  { x: 520, y: 250, w: 140, kind: 'ledge' },
  { x: 840, y: 250, w: 140, kind: 'ledge' },
  { x: 20, y: 228, w: 120, kind: 'high' },
  { x: 1360, y: 228, w: 120, kind: 'high' },
];
export const HOUSING_W = 0, HOUSING_E = 1, HIGH_W = 4, HIGH_E = 5;
// which of CATCH_PLATFORMS a slime with feet at (x, y) stands on (-1: none)
export const catchLedgeAt = (x, y) => CATCH_PLATFORMS.findIndex((p) => Math.abs(y - p.y) < 3 && x >= p.x - 16 && x <= p.x + p.w + 16);

// ——— the Beat: the pendulum ———
// The bob swings across the den, BEAT_S a full swing there and back (the city's own tick: a tick each time it passes the
// middle). bobX = ESC_MID + amp · sin(2π · phase). It hangs low across most of its arc and rises only near the ends of
// its swing: within LOW_FRAC of its amplitude from the middle it's low, and anyone on the floor (feet lower than BOB_H
// over it) within BOB_R of it is hit, BEAT_HP of max HP, once a pass (BEAT_HIT_CD). Server-timed from the fight's start
// (the grinds' pattern: both sides know the phase, a flat hurt with no knockback, no step() change). Jumping it clears it.
export const BEAT_S = 3, BEAT_RAGE = 0.72; // (× BEAT_S once enraged: it quickens)
export const AMP_BASE = 300, SWING_STEP = 72, SWING_STEPS = 5; // (phase 3: the arc widens a step a loop, a Tick cuts it back one)
export const LOW_FRAC = 0.82, BOB_R = 74, BOB_H = 110, BEAT_HP = 0.2, BEAT_HIT_CD = 0.9;
export const ampOf = (steps) => AMP_BASE + SWING_STEP * Math.max(0, Math.min(SWING_STEPS, steps));
export const bobX = (phase, amp) => ESC_MID + amp * Math.sin(phase * Math.PI * 2);
export const bobLow = (x, amp) => Math.abs(x - ESC_MID) < amp * LOW_FRAC;
// the bob's middle as drawn: low over most of its arc, rising toward the ends (k: how far out, 0..1 of the amp)
export const BOB_LOW_Y = FIN_FLOOR - 66, BOB_RISE = 170;
export const bobY = (x, amp) => {
  const k = Math.min(1, Math.abs(x - ESC_MID) / Math.max(1, amp));
  return BOB_LOW_Y - BOB_RISE * Math.max(0, (k - LOW_FRAC) / (1 - LOW_FRAC)) ** 1.6;
};
// the pendulum's pivot, far above the den (its crutch comes down out of the dark from the arbor)
export const PIVOT_Y = -620;
// is a slime with feet at (x, y), on a ledge or not, under the swinging bob now?
export const beatHits = (bx, amp, x, y, onPlat) => !onPlat && y > FIN_FLOOR - BOB_H && bobLow(bx, amp) && Math.abs(x - bx) < BOB_R;

// ——— the Tick: the two pallets (props: hits on them never hurt it) ———
// The anchor's two flukes, west and east, bright where they bite the escape wheel's teeth. Reachable from the floor with a
// jump, from the ledge beside each, and by arrows and spells. Strike BOTH within TICK_WINDOW s (one tick: half a swing)
// and it lets one tooth go: it staggers TICK_STAGGER_S and for TICK_OPEN_S takes TICK_OPEN_MULT × on every hit to its
// body (hold()). Then it bites down again and the pallets can't be struck for TICK_CD s after the window.
export const PALLETS = [{ x: 372, y: 300 }, { x: 1128, y: 300 }];
export const PALLET_R = 34, TICK_WINDOW = 1.5, TICK_STAGGER_S = 3, TICK_OPEN_S = 7, TICK_OPEN_MULT = 1.5, TICK_CD = 4;
// ——— the pawls (phase 2 on): loose pawls drop out of the teeth and crawl to a pallet; one that sits at it JAM_S jams
// it (that pallet can't be struck until the pawl is killed). Frozen, stunned, netted or knocked back: it starts again.
// PAWLS_EVERY s, PAWLS_BASE plus one for every PAWLS_PER_TICK Ticks the party has made (the Wheel fights back), within
// the adds cap.
export const PAWLS_EVERY = 26, PAWLS_BASE = 1, PAWLS_PER_TICK = 3, JAM_S = 6;

// ——— phase 4: the Stopping ———
// The pendulum stops high in the middle of the den. On every beat (BEAT_S; every tick once enraged) a slime standing
// still is stopped: the rhythm lock's fetters under it (A3: enter the arrows on the beat to start again), at most once
// every STOP_CD s each. Moving or jumping is enough.
export const STOP_CD = 6;
export const STILL_V = 4; // (px/s: slower than this on the ground counts as standing still)

// ——— its moves (s unless named) ———
// The Count: the shard brightens toward one slime for COUNT_S (the focus; Rally takes it)
export const COUNT_S = 30;
// Pallet Strike: the pallet on the counted slime's side swings down off the Wheel and slams the floor at the mark
// (STRIKE_WARN[phase], the creak of the tooth it let go); anyone on the floor within STRIKE_R of it, lower than STRIKE_H
// over it. Some land a tick late (STRIKE_LATE[phase], A10's cousin). After it: a chain snare either side, sometimes.
export const STRIKE_WARN = [1.6, 1.5, 1.4, 1.3], STRIKE_R = 110, STRIKE_H = 90, STRIKE_LATE = [0.25, 0.3, 0.35, 0.4], STRIKE_REST = 1.6;
export const SNARE_OFF = 30;
// Teeth: TEETH_N teeth drive down out of the dark in a line toward the counted slime, TEETH_GAP apart, a group of three
// each tick (TEETH_WARN marked)
export const TEETH_N = 6, TEETH_GAP = 120, TEETH_WARN = 1.2;
// Rewound (phase 4): the bob drawn all the way up and back, the arbor open; the shard is the weak point for REWOUND_S
// (REWOUND_WEAK × a top boss's weak point HP; filled: the long stagger, the bob let down gently); unfilled: the Drop, the
// bob let fall the length of the den, DROP_HP of max HP from everyone not up on a ledge
export const REWOUND_S = 6, REWOUND_WEAK = 3, DROP_HP = 0.7;
// The enrage (FINAL_ENRAGE_MIN): the beat quickens (BEAT_RAGE), the pallets don't open, the Stopping on every tick, and a
// Tock every ENRAGE_TOCK_S besides the loop's
export const ENRAGE_TOCK_S = 14;

// ——— the ultimates ———
// Hold: both pallets clench at once and a shock runs through the casing. It hauls the bob up to one end first (u.side);
// safe: under the bob there (within HOLD_SAFE_R of HAUL_X) or up on that end's housing or high ledge.
// Counter-Swing: it hauls the bob all the way back to one end (u.side) and lets it go; a full-length swing sweeps the floor
// and every ledge but one at COUNTER_SPEED px/s, judged as it passes you: safe only on the high ledge at the far end.
// The Stopped Hour: everything stops for a long beat, then everything that didn't move in time is hit: safe, a slime that
// was moving (or in the air) as it lands (judged on the client, STOPPED_GRACE s of slack).
export const HAUL_X = 610, HOLD_SAFE_R = 170, COUNTER_SPEED = 520, STOPPED_GRACE = 0.3;
export const haulX = (side) => ESC_MID + side * HAUL_X;
export const holdSafe = (side, x, ledge) => Math.abs(x - haulX(side)) < HOLD_SAFE_R || ledge === (side > 0 ? HOUSING_E : HOUSING_W) || ledge === (side > 0 ? HIGH_E : HIGH_W);
export const counterSafe = (dir, ledge) => ledge === (dir > 0 ? HIGH_E : HIGH_W);

// ——— its targets (h[4] = 2 + slot: slots 0–1 the pallets) ———
export const palletSpot = (slot) => ({ x: PALLETS[slot].x, y: PALLETS[slot].y, r: PALLET_R });
