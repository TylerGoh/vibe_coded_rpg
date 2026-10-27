// Docs: docs/combat/bosses.md, docs/places/ladon.md, docs/places/fenrir.md
// The final bosses' machinery (FB1 (c), story/fb1-plan.md; the pattern in story/final-bosses.md), shared by client
// and server: the FINAL table (each final boss's phases, its written loops, its heads), the heads' geometry (where
// each head hangs, bites, lowers; where its stump is), the coils, and the arena's ledges. The brain is
// server/final.js; the drawing and the client's prediction src/ladon.js and src/dens-ladon.js.
// Nothing here imports src/shared/rpg.js (rpg.js imports this file), so the den's size is its own constant: it
// matches DEN_W and FIELD_GROUND there.
export const FIN_W = 1500; // (= DEN_W)
export const FIN_FLOOR = 450; // (= FIELD_GROUND)

// The arena (the Root of the Road, room 49): two low root arches each side and one high one in the middle with
// room for four slimes, barely (Strangle's only safe place). A new room's own platforms, never changed mid-fight.
export const LADON_PLATFORMS = [
  { x: 120, y: 345, w: 170, kind: 'arch' },
  { x: 400, y: 345, w: 170, kind: 'arch' },
  { x: 930, y: 345, w: 170, kind: 'arch' },
  { x: 1210, y: 345, w: 170, kind: 'arch' },
  { x: 665, y: 235, w: 170, kind: 'high' },
];
export const LADON_HIGH = 4; // (index of the high middle arch)
export const LADON_BODY_X = FIN_W / 2; // the root knot at the back wall (the boss mob's x)

// ——— the FINAL table: one row per final boss (owner, 2026-10-26: fixed HP for four, no reward window) ———
// at: the HP shares where phases 2, 3 and 4 start (four phases: PHASE_AT's FINAL row). heads: side heads at each
// phase's start (stumps and sealed stumps all push through again). first: the phase the first head comes out of
// the dark. ultEvery: s between ultimates in phases 1–3 (the first below ULT_FIRST; in phase 4 the loop holds
// them). loops: each phase's written loop, run in order for ever: a move name, 'name:2' (every other loop), 'shield'
// (bark and ward by turns), 'ult' (the two ultimates by turns from phase 3). brain: which brain runs it
// (server/final.js: 'hydra', Ladon's heads and coils; server/fenrir.js: 'wolf', Fenrir's fetters and lanterns; FB2).
export const FINAL = {
  ladon: {
    brain: 'hydra',
    at: [0.75, 0.5, 0.25],
    heads: [3, 5, 6, 6],
    first: 3,
    ultEvery: [70, 55, 45, 0],
    ults: [{ name: 'Hundred Heads', kind: 'heads' }, { name: 'Strangle', kind: 'strangle' }],
    alternateFrom: 2, // (phase index from which the two ultimates alternate)
    loops: [
      ['watch', 'bite', 'bite', 'bite', 'lash', 'bark:2'],
      ['watch', 'coil', 'bite', 'bite', 'rows', 'breath', 'ward:2'],
      ['breath', 'watch', 'coil', 'bite', 'bite', 'bite', 'shield', 'lash'],
      ['ult', 'watch', 'gaze', 'breath', 'storm', 'coil', 'both'],
    ],
  },
  // Fenrir, the Bound Wolf (FB2 (c), story/fb2-plan.md; its own constants: src/shared/fenrir.js). 'rime': Rime Coat
  // (the armour), 'ward': Fetter Ward (the barrier), 'howl': the pulse, 'ice': Falling Ice, 'rear': Rearing (the shard)
  fenrir: {
    brain: 'wolf',
    at: [0.75, 0.5, 0.25],
    ultEvery: [80, 65, 55, 0],
    ults: [{ name: 'Swallow the Light', kind: 'swallow' }, { name: 'Fimbulwinter', kind: 'fimbul' }],
    alternateFrom: 2,
    loops: [
      ['watch', 'lunge', 'claw', 'claw', 'strain', 'rime:2'],
      ['watch', 'lunge', 'strain', 'howl', 'breath', 'ward:2'],
      ['howl', 'watch', 'lunge', 'strain', 'claw', 'claw', 'shield', 'breath'],
      ['ult', 'watch', 'pounce', 'howl', 'ice', 'rear', 'both'],
    ],
  },
};
export const finalPhase = (row, frac) => row.at.filter((a) => frac <= a).length; // 0–3
// FINAL_ENRAGE_MIN: a little past the ~45 min a party of four should take (the server's TEST_ENRAGE_MIN shortens it
// in tests). At it: the petals turn to thorns, every stump regrows at once and nothing seals one, the coils close to
// the middle over COIL_ENRAGE_S and nothing pushes them back, and the Breath comes every ENRAGE_BREATH_S as well.
export const FINAL_ENRAGE_MIN = 48;
export const COIL_ENRAGE_S = 60;
export const ENRAGE_BREATH_S = 14;
// A final boss's ultimates warn FINAL_ULT_WARN s (a little longer than ULT_WARN: a party has to climb the high arch)
export const FINAL_ULT_WARN = 4;
export const FINAL_GAP_S = [1.4, 1.2, 1.0, 0.9]; // the opening after each move, per phase

// ——— the heads ———
// Slot 0 is the first head (eyes in the dark behind the body until `first`; never cut: its shard is the Gaze's
// weak point). Slots 1–7 are the side heads, each a neck out of a wall or the roof: `rx, ry` where the neck comes
// from, `x, y` where the head hangs. HEAD_MAX side heads at most (owner: seven).
export const LADON_SLOTS = [
  { rx: 750, ry: 60, x: 750, y: 210 },
  { rx: -60, ry: 330, x: 175, y: 290 },
  { rx: 1560, ry: 330, x: 1325, y: 290 },
  { rx: 330, ry: -60, x: 450, y: 235 },
  { rx: 1170, ry: -60, x: 1050, y: 235 },
  { rx: -60, ry: 150, x: 270, y: 175 },
  { rx: 1560, ry: 150, x: 1230, y: 175 },
  { rx: 560, ry: -60, x: 600, y: 150 },
];
export const HEAD_MAX = 7;
export const HEAD_R = 30; // a head's hit radius (the first head's is HEAD_R × 1.5)
export const HEAD_FLOOR_Y = 420; // a head stuck in the ground after a Bite
export const GAZE_Y = 400; // the first head's brow on the road during the Gaze (its shard: MOBS.ladon.weak)
// A head's ring: HEAD_RING of the boss's plain hp (like a weak point's, so it fills as fast in any party). Full, the
// head falls: HEAD_CHUNK of max HP off the boss, HEAD_ADDS briarlings, a stump that regrows as two after REGROW_S
// (swelling for the last SWELL_S) unless a fire hit seals it (a fire spell, a burn, holy light: Smite, the holy
// bolts). A sealed stump grows back as ONE head after SEALED_REGROW_S (owner, 2026-10-26: burned ones come back too),
// or at the next phase if that comes first.
export const HEAD_RING = 0.0012, HEAD_CHUNK = 0.012, HEAD_ADDS = 2, REGROW_S = 28, SWELL_S = 8, SEALED_REGROW_S = 50;
// Watch: the first head's eyes settle on one slime for WATCH_S (the focus; Rally takes it)
export const WATCH_S = 30;
// Bite: the acting head rears back BITE_WARN[phase] s (its eyes lit, the spot marked on the floor), strikes the
// floor within BITE_R of the mark, and sticks there BITE_STUCK_S (melee's opening)
// Owner, 2026-10-26: Bite to Bite was ~2.3–3 s, too fast; doubled. The warning is twice what it was, and BITE_REST_S
// after the strike (on top of the usual FINAL_GAP_S) makes the whole Bite → next Bite exactly twice the old time.
export const BITE_WARN = [2.4, 2.0, 1.9, 1.8], BITE_REST_S = [1.75, 1.55, 1.35, 1.25], BITE_R = 64, BITE_STUCK_S = 3.2;
// ...and on its way down it hits everything in its path (owner, 2026-10-26): anyone whose body is within BITE_PATH_R of
// the line from where the head rears to where it lands (on an arch too). Judged on the client like the rest of a Bite.
export const BITE_PATH_R = 40;
export function onBitePath(slot, tx, x, feetY) {
  const a = headSpot({ slot, st: 'rear' }), b = { x: tx, y: HEAD_FLOOR_Y }, px = x, py = feetY - 18; // (the slime's middle)
  const dx = b.x - a.x, dy = b.y - a.y, k = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (a.x + dx * k), py - (a.y + dy * k)) < BITE_PATH_R;
}
// Lash: a neck sweeps the den at floor or arch height (LASH_FLOOR / LASH_ARCH, feet y bands), LASH_WARN s warning
export const LASH_WARN = 1.3, LASH_FLOOR = [404, 452], LASH_ARCH = [290, 366];
// Coil: COIL_S s with every head turned to the watched slime; a hit on a head's far side (its glowing throat) does
// THROAT_MULT and fills its ring THROAT_FILL × as fast
export const COIL_S = 4, THROAT_MULT = 1.6, THROAT_FILL = 3;
// The Gaze (phase 4): the first head lowers GAZE_S s; its shard is the weak point (GAZE_WEAK × a top boss's weak
// point HP); the watched slime takes GAZE_HP of max HP a second while it stares; filling it staggers GAZE_STAGGER_S
export const GAZE_S = 6, GAZE_HP = 0.1, GAZE_WEAK = 3, GAZE_STAGGER_S = 7;
// The phase 3 coils: walls from both ends, COIL_STEP px in a step (a Breath landing), back a step for a head cut or
// a stagger, at most COIL_STEPS steps in (a middle strip left) until the enrage closes them
export const COIL_STEP = 98, COIL_STEPS = 5;
// Hundred Heads: necks strike everywhere but HUNDRED_GAPS gaps HUNDRED_GAP_W wide · Strangle: only the high arch
export const HUNDRED_GAPS = 3, HUNDRED_GAP_W = 120;

const STUMPY = new Set(['stump', 'sealed']);
export const isStump = (st) => STUMPY.has(st);
// can a hit be aimed at head h? (a live side head, or a stump: a fire hit seals it)
export const headTarget = (h) => h.slot !== 0 && (h.st === 'up' || h.st === 'rear' || h.st === 'bite' || h.st === 'stump');
// where head h ({ slot, st, x }) is as a target → { x, y, r }
export function headSpot(h) {
  const s = LADON_SLOTS[h.slot];
  if (h.st === 'bite') return { x: h.x, y: HEAD_FLOOR_Y, r: HEAD_R };
  if (h.st === 'gaze') return { x: s.x, y: GAZE_Y, r: HEAD_R * 1.5 };
  if (isStump(h.st)) return { x: s.rx + (s.x - s.rx) * 0.9, y: s.ry + (s.y - s.ry) * 0.9, r: HEAD_R }; // (cut just behind the head)
  if (h.st === 'rear') return { x: s.rx + (s.x - s.rx) * 0.85, y: s.ry + (s.y - s.ry) * 0.85 - 14, r: HEAD_R };
  return { x: s.x, y: s.y, r: h.slot === 0 ? HEAD_R * 1.5 : HEAD_R };
}
// can a hit from a slime at (x, feet y) with this horizontal reach find spot s? (any arrow in range, and any spell or
// bolt on a stump: the fire answer; anything else needs the body within WEAK_REACH-ish of the head's height: a jump, an
// arch, a bitten head on the floor)
export const HEAD_REACH = 45;
export const headReach = (s, x, y, reach, arrow, slack = 0) => Math.abs(x - s.x) <= reach + s.r + slack && (arrow || Math.abs(y - 20 - s.y) < s.r + HEAD_REACH + slack);
// is a hit from hitX on head h's throat? (a Coil is on, the head is turned to the watched slime at wx: the throat
// shows on its far side)
export const throatOpen = (h, wx, hitX) => h.st === 'up' && wx !== undefined && Math.abs(hitX - LADON_SLOTS[h.slot].x) > 6 && Math.sign(hitX - LADON_SLOTS[h.slot].x) === -Math.sign(wx - LADON_SLOTS[h.slot].x);
// the coils' reach from each end (px) → is x inside one?
export const inCoils = (cw, x) => cw > 0 && (x < cw || x > FIN_W - cw);
