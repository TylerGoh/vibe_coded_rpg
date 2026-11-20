// Docs: docs/places/carapace.md, docs/combat/bosses.md
// Old Carapace (atlas Phase 9, A5 (c), story/a5-plan.md): the Long Road's geometry and every tuning constant of its own
// mechanics (the Stride: his footfalls jolting each half of the shell; the Well: water carried and thrown into the town's dry
// well until it drinks; the mirages drinking it back; the walk quickening in phase 3; Lie Down in phase 4; his moves and
// ultimates), shared by the brain (server/carapace.js) and the client (src/carapace.js, src/dens-carapace.js). Its FINAL
// row (phases, loops, ultimates) is in src/shared/final.js with the others'. Nothing here imports src/shared/rpg.js.
import { FIN_W, FIN_FLOOR } from './final.js';

// His head, far off at the east end of the shell on its long neck, looking ahead: the boss mob's x (it never moves) and the
// only part of him a hit can reach (but the shard, below)
export const HEAD_X = 1390;
// The town's dry well in its ring of stone, a little west of the middle (the still point between his feet)
export const WELL_X = 640;
// The arena: tents and roofs of the empty town, and the windlass over the well (Lie Down's melee reach to the shard). Each
// step up is about 100 px (a jump is ~139). A den's own platforms, never changed mid-fight (DENS[].platforms).
export const CARAPACE_PLATFORMS = [
  { x: 110, y: 340, w: 160, kind: 'tent' },
  { x: 330, y: 246, w: 130, kind: 'roof' },
  { x: WELL_X - 60, y: 232, w: 120, kind: 'windlass' },
  { x: 860, y: 340, w: 160, kind: 'tent' },
  { x: 1050, y: 246, w: 130, kind: 'roof' },
];
export const WINDLASS = 2;
// which of CARAPACE_PLATFORMS a slime with feet at (x, y) stands on (-1: none)
export const shellLedgeAt = (x, y) => CARAPACE_PLATFORMS.findIndex((p) => Math.abs(y - p.y) < 3 && x >= p.x - 16 && x <= p.x + p.w + 16);

// ——— the Stride ———
// He walks on a fixed period, STRIDE_S a full step (the hind foot at phase 0, the fore foot at 0.5). Each footfall jolts its
// half of the shell (FEET: the stretch of floor over that leg); whoever's on the floor there is hit, STRIDE_HP of max HP,
// a flat dot (server-timed from the fight's start, the Beat's pattern: both sides know the phase, no step() change). A jump
// on the footfall clears it, and every ledge is safe. The middle round the well is between the feet. STRIDE_LIFT: how long
// before a footfall its half lifts (the tell), a share of the half-period.
export const STRIDE_S = 4.2, STRIDE_HP = 0.1, STRIDE_LIFT = 0.55;
// Phase 3, the Long Walk: every loop the stride quickens a step (STRIDE_STEP of the period, at most STRIDE_STEPS); every time
// the town drinks it slows one. Phase 4 walks at STORM_STEPS; enraged, at its quickest
export const STRIDE_STEP = 0.11, STRIDE_STEPS = 4, STORM_STEPS = 3;
export const strideOf = (steps) => STRIDE_S * (1 - STRIDE_STEP * Math.max(0, Math.min(STRIDE_STEPS, steps)));
export const FEET = [{ x0: 40, x1: 520 }, { x0: 780, x1: 1250 }];
// which foot lands at stride phase crossing p (0: the hind at 0, 1: the fore at 0.5)
export const footAt = (x) => FEET.findIndex((f) => x >= f.x0 && x <= f.x1);
// is a slime with feet at (x, y), on a ledge or not, on the floor over foot i as it lands?
export const strideHits = (i, x, y, onPlat) => !onPlat && y > FIN_FLOOR - 6 && x >= FEET[i].x0 && x <= FEET[i].x1;

// ——— the Well ———
// From phase 1, a waterskin drops off a tent at one end of the town every WATER_EVERY s (A22's carry, aimed at the well:
// server/challenge.js `target`). WELL_N thrown in: the town drinks. He stops walking for SLAKE_S, staggers SLAKE_STAGGER_S,
// and every hit on him does SLAKE_MULT × (hold()). Then the well drains dry again. The skins drop at SKIN_X (one end or the
// other, away from the well)
export const WATER_EVERY = 16, WELL_N = 3, SLAKE_S = 8, SLAKE_STAGGER_S = 3, SLAKE_MULT = 1.5;
export const SKIN_X = [190, 1120];
// ——— the mirages (phase 2 on): thirst mirages come up off the road at the east end every MIRAGE_EVERY s and drift west to
// the well; one at it drinks a skin's worth back out every DRINK_S. MIRAGE_BASE of them, plus one for every MIRAGE_PER drinks
// the town has had (within the adds cap)
export const MIRAGE_EVERY = 24, MIRAGE_BASE = 1, MIRAGE_PER = 2, DRINK_S = 5, MIRAGE_X = 1240;

// ——— its moves (s unless named) ———
// The Look: his head turns back along the shell and one eye settles on a slime for LOOK_S (the focus; Rally takes it)
export const LOOK_S = 30;
// Snap: his head swings back over the shell and bites down at the looked-at slime's mark (SNAP_WARN[phase]); anyone on the
// floor within SNAP_R of it, lower than SNAP_H; some come a beat late (SNAP_LATE[phase]: A10's cousin)
export const SNAP_WARN = [1.7, 1.55, 1.4, 1.3], SNAP_R = 110, SNAP_H = 96, SNAP_LATE = [0.25, 0.3, 0.35, 0.4], SNAP_REST = 1.4;
// Stones: STONES_N stones kicked up by his feet come down in a line toward the looked-at slime, STONES_GAP apart, a group of
// three a stride (STONES_WARN marked)
export const STONES_N = 6, STONES_GAP = 120, STONES_WARN = 1.2;
// Lie Down (phase 4): he lowers himself, so tired, and the dry well's floor falls open: the shard is the weak point for
// REST_S (REST_WEAK × a top boss's weak point HP). Filled: the long stagger. Unfilled: he gets up, the Trample, TRAMPLE_HP of
// max HP from every slime not up on a ledge
export const REST_S = 6, REST_WEAK = 3, TRAMPLE_HP = 0.7;
// The enrage (FINAL_ENRAGE_MIN): he strides as fast as he can, the well never drinks, and a Stamp every ENRAGE_STAMP_S
// besides the loop's
export const ENRAGE_STAMP_S = 14;
