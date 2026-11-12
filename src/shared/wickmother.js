// Docs: docs/places/wickmother.md, docs/combat/bosses.md
// The Wickmother (L5 (c), story/l5-plan.md): the Hall of Lamps' geometry and every tuning constant of her own mechanics
// (the eight hall lanterns and the Hold, Kindle and her moths, the silk walls, phase 4's dark and her light, her moves),
// shared by the brain (server/wickmother.js) and the client (src/wickmother.js, src/dens-wick.js). Her FINAL row (phases,
// loops, ultimates) is in src/shared/final.js with the others'. Nothing here imports src/shared/rpg.js.
import { FIN_W, FIN_FLOOR } from './final.js';

export const WM_MID = FIN_W / 2; // under the Crown of Lamps, the middle of the Hall (the boss mob's start)
// The arena: a low root shelf at each end, a root ledge higher up each side, and the highest root ledge at each end (the
// Long Night's only shelter is the one at the end its wave runs to). A den's own platforms, never changed mid-fight
// (DENS[].platforms). Each step up is about 110 px (a jump is ~139).
export const HALL_PLATFORMS = [
  { x: 150, y: 340, w: 170, kind: 'shelf' },
  { x: 1180, y: 340, w: 170, kind: 'shelf' },
  { x: 420, y: 250, w: 140, kind: 'ledge' },
  { x: 940, y: 250, w: 140, kind: 'ledge' },
  { x: 20, y: 228, w: 120, kind: 'high' },
  { x: 1360, y: 228, w: 120, kind: 'high' },
];
export const HIGH_W = 4, HIGH_E = 5; // (the end high ledges' indexes)
// which of HALL_PLATFORMS a slime with feet at (x, y) stands on (-1: none)
export const wickLedgeAt = (x, y) => HALL_PLATFORMS.findIndex((p) => Math.abs(y - p.y) < 3 && x >= p.x - 16 && x <= p.x + p.w + 16);
export const onFloor = (y) => y > FIN_FLOOR - 6;

// ——— the hall lanterns: eight big ones on long strings from the willow's ribs ———
// x, y: the lantern's middle. Four hang low (hit from the floor), two by the low shelves, two by the high ledges.
// st: 'l' lit, 'o' out (its light gone up through the roof), 'p' party-lit (phase 4: a fire or holy hit lit it for
// ROOM_LIGHT_S). A lit one's ring (LAMP_RING of the plain hp) fills with any hit; full, it goes out. A Cleric's holy hit
// (laying it to rest) or a frost hit (the wick pinched out) lets it go at once. Hits on a lantern never hurt her.
export const HALL_LAMPS = [
  { x: 110, y: 300 },
  { x: 300, y: 392 },
  { x: 490, y: 205 },
  { x: 600, y: 390 },
  { x: 900, y: 390 },
  { x: 1010, y: 205 },
  { x: 1200, y: 392 },
  { x: 1390, y: 300 },
];
export const LAMP_R = 22, LAMP_RING = 0.0005, LIGHT_R = 130;
// each lantern owns the strip of floor nearest it (All Souls' Night's safe ground is judged by it, on x only)
export const lampAt = (x) => HALL_LAMPS.reduce((b, l, i) => (Math.abs(l.x - x) < Math.abs(HALL_LAMPS[b].x - x) ? i : b), 0);
// The Hold: every lit lantern takes HOLD_PER_LAMP off each hit on her body, at most HOLD_MAX (all eight lit: she's nearly
// untouchable; all out: she's open). Party-lit ones (phase 4) don't count: they're not hers.
export const HOLD_PER_LAMP = 0.1, HOLD_MAX = 0.8;
export const holdMult = (lit) => 1 - Math.min(HOLD_MAX, HOLD_PER_LAMP * lit);
// Kindle: she touches the out lantern nearest her with a wing tip (its wick glows KINDLE_WARN first: freeze or stun her
// then and it doesn't happen); from phase 3 her loop kindles twice
export const KINDLE_WARN = 1.6;

// ——— her moths (phase 2 on): the Causeway's lamp moths, come down out of the roof to relight the out lanterns ———
// MOTHS_EVERY s, MOTHS_BASE plus one for every MOTHS_PER_DARK lanterns out (within the adds cap). Each flies to the
// nearest out lantern no other moth is after and relights it in RELIGHT_S unless it's killed, frozen, stunned or
// knocked back first (a SAVED pop, Skoll and Hati's rule turned round). MOTH_Y: the height it hangs at by the lantern.
export const MOTHS_EVERY = 24, MOTHS_BASE = 1, MOTHS_PER_DARK = 3, RELIGHT_S = 5;

// ——— phase 3: the silk walls ———
// Two walls of silk close in from the ends, SILK_STEP px a step (each Hush that lands and each Kindle steps them in),
// at most SILK_STEPS; every lantern let go cuts them back a step (the light going up burns a hole through the silk).
// Inside the silk hurts: SILK_HP of max HP every SILK_TICK_S (server-timed, a hazard: nothing blocks).
export const SILK_STEP = 90, SILK_STEPS = 5, SILK_HP = 0.03, SILK_TICK_S = 0.5;
export const inSilk = (sw, x) => sw > 0 && (x < sw || x > FIN_W - sw);

// ——— phase 4: the Last Light ———
// Every lantern goes out at once and the Hall is dark but for her: outside MOTHER_LIGHT_R of her (x only) and every
// party-lit lantern's pool the dark's cold hurts, DARK_HP of max HP a second (DARK_RAGE_MIN more a minute once enraged).
// A fire or holy hit on an out lantern lights it for ROOM_LIGHT_S (a pool to stand in away from her).
export const MOTHER_LIGHT_R = 260, DARK_HP = 0.025, DARK_RAGE_MIN = 0.01, ROOM_LIGHT_S = 25;
export const inLightP4 = (bx, lamps, x) => Math.abs(x - bx) < MOTHER_LIGHT_R || HALL_LAMPS.some((l, i) => lamps[i] === 'p' && Math.abs(x - l.x) < LIGHT_R);

// ——— her moves (s unless named) ———
// Watching Eyes: the eye spots on her wings turn to one slime for EYES_S (the focus; Rally takes it)
export const EYES_S = 30;
// Stoop: she drops at the watched slime, STOOP_WARN[phase] (the landing marked; the fall is the last STOOP_FALL of it),
// lands within STOOP_R of the mark on anyone low (within STOOP_H of the floor), then lies there STOOP_REST with her wings
// spread (melee's opening), and climbs back. Fake-outs (from phase 1, FEINT_CHANCE): she pulls up short and stoops again
// where the watched slime went, FEINT_AGAIN later.
export const STOOP_WARN = [1.6, 1.5, 1.4, 1.3], STOOP_FALL = 0.5, STOOP_R = 120, STOOP_H = 90, STOOP_REST = 2.4;
export const FEINT_CHANCE = [0.3, 0.35, 0.4, 0.45], FEINT_AGAIN = 1.0;
// the Stoop's strand (a snare) springs this far past the landing's edge (and the snare's own radius) either side: a
// slime that dodged by a hair is caught
export const SNARE_OFF = 30;
// Silk Line: a strand drawn across the Hall at floor or ledge height (feet-y bands), after LINE_WARN
export const LINE_WARN = 1.3, LINE_FLOOR = [404, 452], LINE_LEDGE = [290, 366];
// Lantern Rain: RAIN_N small lanterns fall in a line toward the watched slime (RAIN_GAP px apart), RAIN_WARN marked, and
// burst in lamp oil where they land
export const RAIN_N = 7, RAIN_GAP = 110, RAIN_WARN = 1.3;
// Drawing the Light (phase 4): she pulls the light out of every lantern for DRAW_S, the shard in her thorax the weak
// point (DRAW_WEAK × a top boss's weak point HP; filled: the long stagger, GAZE_STAGGER_S, and the lanterns stay lit);
// unfilled: a double Hush and every lantern out
export const DRAW_S = 6, DRAW_WEAK = 3;
// Phase 4: she moves along the floor, never nearer a wall than BODY_EDGE; in phases 1–3 she keeps to the Crown (and from
// phase 2 drifts along the ribs, within RIB_RANGE of the middle)
export const BODY_EDGE = 230, RIB_RANGE = 380;
// The enrage (FINAL_ENRAGE_MIN): every hall lantern relights by itself and nothing lets them go (her Hold is full), the
// dark's cold rises, and a Hush every ENRAGE_HUSH_S besides the loop's own
export const ENRAGE_HUSH_S = 14;

// ——— the ultimates ———
// All Souls' Night: every lit lantern flares, burning everything in its strip of floor (lampAt, at any height); safe:
// the strips of lanterns let go, and SOULS_DARK more the wind-up leaves dark (so there's always somewhere). The more
// you've let go, the more room there is. In phase 4 (all out but the party's) it's the party-lit ones that flare.
// The Long Night: she pulls every strand at once and a wave of silk rolls from one end to the other at NIGHT_SPEED px/s
// (u.dir: the way it runs); judged as its front passes you: safe only on the high root ledge at the end it runs to.
export const SOULS_DARK = 2, NIGHT_SPEED = 470;
export const nightSafe = (dir, ledge) => ledge === (dir > 0 ? HIGH_E : HIGH_W);

// ——— her targets (h[4] = 2 + slot: slots 0–7 the hall lanterns) ———
export const wickSpot = (slot) => ({ x: HALL_LAMPS[slot].x, y: HALL_LAMPS[slot].y, r: LAMP_R });
