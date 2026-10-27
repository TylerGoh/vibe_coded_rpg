// Docs: docs/places/fenrir.md, docs/combat/bosses.md
// Fenrir, the Bound Wolf (FB2 (c), story/fb2-plan.md): the Wolf's Hold's geometry and every tuning constant of its
// own mechanics, shared by the brain (server/fenrir.js) and the client (src/fenrir.js, src/dens-fenrir.js). Its FINAL
// row (phases, loops, ultimates) is in src/shared/final.js with Ladon's. Nothing here imports src/shared/rpg.js.
import { FIN_W, FIN_FLOOR } from './final.js';

export const FEN_MID = FIN_W / 2; // where it's bound (the den's middle; the boss mob's start)
// The arena: two low ice ledges each side and one high one in the middle, above the wolf's head (Ladon's layout: the
// den rooms take `DENS[].platforms`)
export const FENRIR_PLATFORMS = [
  { x: 120, y: 345, w: 170, kind: 'ice' },
  { x: 400, y: 345, w: 170, kind: 'ice' },
  { x: 930, y: 345, w: 170, kind: 'ice' },
  { x: 1210, y: 345, w: 170, kind: 'ice' },
  { x: 665, y: 235, w: 170, kind: 'high' },
];

// ——— the reach (the fetters) ———
// The reach is how much fetter it has: a band MID ± reach (px) its jaws and claws can't strike past (a frost line on the
// floor at each end). Each phase starts at REACH_START and stays within REACH_MIN..REACH_MAX; an unanswered Strain lets
// it out REACH_STEP, an anchor set pulls it in REACH_STEP. Its body's middle stays REACH_JAW inside the band's ends
// (its head and forepaws reach the rest), and never closer than BODY_EDGE to a wall.
export const REACH_START = [260, 420, 560, 750];
export const REACH_MIN = [200, 340, 480, 750];
export const REACH_MAX = [400, 560, 700, 750];
export const REACH_STEP = 70, REACH_JAW = 120, BODY_EDGE = 200;
export const bodyRange = (rc) => [Math.max(BODY_EDGE, FEN_MID - Math.max(0, rc - REACH_JAW)), Math.min(FIN_W - BODY_EDGE, FEN_MID + Math.max(0, rc - REACH_JAW))];
export const inReach = (rc, x) => Math.abs(x - FEN_MID) <= rc;
// where a strike at x lands, kept inside the band
export const reachClamp = (rc, x) => Math.max(FEN_MID - rc, Math.min(FEN_MID + rc, x));

// ——— the anchors: four Keeper stones, two each side (0 west low, 1 west high, 2 east low, 3 east high) ———
// x, y: the ring's middle (the carved face). The low ones stand on the floor by the walls; the high ones are set in the
// wall over the outer ledges. A phase change snaps one for good (SNAP_ORDER[ph - 1]); the last left is the one whose
// fetter runs to its teeth (TEETH).
export const ANCHORS = [
  { x: 112, y: 398, side: -1 },
  { x: 58, y: 282, side: -1 },
  { x: 1388, y: 398, side: 1 },
  { x: 1442, y: 282, side: 1 },
];
export const ANCHOR_R = 30;
export const SNAP_ORDER = [1, 3, 0], TEETH = 2;
// Strain: it lunges against its fetters toward the watched slime for STRAIN_S, the far anchor's ring open (ANCHOR_RING
// of its plain hp, like a weak point's: one slime fills it in a few seconds). Filled: the anchor is set, it's yanked
// back (a stagger) and the reach shrinks a step; not: the reach grows a step.
export const STRAIN_S = 7, ANCHOR_RING = 0.0005;

// ——— the lanterns: six cutters' lanterns on old Keeper lamp posts ———
// Lit, dark, or relighting (a dark one being hit: its ring, LANTERN_RING of the plain hp). A fire or holy hit relights
// one at once. LIGHT_R: the pool of light on the floor round each (judged on x only). DARK_HP: the cold of the dark, a
// share of max HP a second outside every lit lantern's pool (a hazard: hurts, never blocks; server-timed); at the enrage
// it rises DARK_RAGE_MIN a minute.
export const LANTERN_X = [140, 390, 620, 880, 1110, 1360];
export const LANTERN_Y = 385, LANTERN_R = 22, LIGHT_R = 150;
export const LANTERN_RING = 0.0006;
export const DARK_HP = 0.02, DARK_RAGE_MIN = 0.01;
export const inLight = (lit, x) => LANTERN_X.some((lx, i) => lit[i] && Math.abs(x - lx) < LIGHT_R);

// ——— the moves (s unless named) ———
// Lunge: LUNGE_WARN[phase] crouched (the landing and the reach's end marked), LUNGE_FLY in the air, a bite within
// LUNGE_R of the mark (on the floor), then it pants PANT_S (melee's opening)
export const LUNGE_WARN = [1.3, 1.2, 1.1, 1.0], LUNGE_FLY = 0.35, LUNGE_R = 80, PANT_S = 2.6;
// Claw: a paw swipe CLAW_W in front of it, inside the reach, after CLAW_WARN; anyone low (within CLAW_H of the floor)
export const CLAW_WARN = 0.8, CLAW_W = 230, CLAW_H = 80;
// Frost Breath: along the floor or at ledge height (feet-y bands), past the fetters, after BREATH_WARN
export const BREATH_WARN = 1.3, BREATH_FLOOR = [404, 452], BREATH_LEDGE = [290, 366];
// Pounce (phase 4): POUNCE_N bounds at the watched slime, each marked POUNCE_MARK s before it lands, at most POUNCE_MAX
// px a bound, a hit within POUNCE_R of each landing
export const POUNCE_N = 3, POUNCE_MARK = 0.9, POUNCE_FLY = 0.45, POUNCE_MAX = 520, POUNCE_R = 90;
// Falling Ice (phase 4): ICE_N icicles across the den and one on each fighter, ICE_WARN marked
export const ICE_N = 9, ICE_WARN = 1.4;
// Rearing (phase 4): up REAR_S with the shard in its collar open (REAR_WEAK × a top boss's weak point HP; filled: the
// long stagger, GAZE_STAGGER_S); unfilled, it comes down on where the watched slime stood, REAR_R wide
export const REAR_S = 6, REAR_WEAK = 3, REAR_R = 240;
// Watch: its eyes settle on one slime for FEN_WATCH_S (the focus; Rally takes it)
export const FEN_WATCH_S = 30;
// The pack (phase 2 on): black-ice wolves out of the dark ends every PACK_EVERY s, PACK_BASE plus one for every
// PACK_PER_DARK lanterns out (within the adds cap)
export const PACK_EVERY = 22, PACK_BASE = 1, PACK_PER_DARK = 2;
// Skoll and Hati (phase 3 on): each runs to a lit lantern and swallows it in SWALLOW_S; a freeze, a stun or a net, or a
// hit knocking it back at least SON_KNOCK, stops it there (it starts over). Killed, it comes back after SONS_BACK_S.
export const SONS = ['skoll', 'hati'], SWALLOW_S = 5, SON_KNOCK = 250, SONS_BACK_S = 40;
// The enrage (FINAL_ENRAGE_MIN): every lantern out and none relight, the dark's cold rising, a Howl every ENRAGE_HOWL_S too
export const ENRAGE_HOWL_S = 14;

// ——— the ultimates ———
// Swallow the Light: every lantern dark but two (the wind-up shows which); frost fangs everywhere outside their pools.
// Fimbulwinter: a blizzard from one end (u.dir: the way it blows); the only shelter is a strip in the lee of an anchor
// stone at the far end: on the floor between the low stone and the wall, or on the outer ledge's wall end (LEE).
export const LEE_FLOOR = 100, LEE_LEDGE = 60;
export function inLee(dir, x, y, onLedge) {
  if (dir > 0) return (x >= FIN_W - LEE_FLOOR && y > FIN_FLOOR - 40) || (onLedge === 3 && x >= FENRIR_PLATFORMS[3].x + FENRIR_PLATFORMS[3].w - LEE_LEDGE);
  return (x <= LEE_FLOOR && y > FIN_FLOOR - 40) || (onLedge === 0 && x <= FENRIR_PLATFORMS[0].x + LEE_LEDGE);
}
// which of FENRIR_PLATFORMS a slime with feet at (x, y) stands on (-1: none)
export const ledgeAt = (x, y) => FENRIR_PLATFORMS.findIndex((p) => Math.abs(y - p.y) < 2 && x >= p.x - 16 && x <= p.x + p.w + 16);

// ——— its targets (h[4] = 2 + slot: slots 0–3 the anchors, 4–9 the lanterns) ———
export const LANTERN_SLOT = 4;
// where target slot is → { x, y, r }
export const fenSpot = (slot) => (slot < LANTERN_SLOT ? { x: ANCHORS[slot].x, y: ANCHORS[slot].y, r: ANCHOR_R } : { x: LANTERN_X[slot - LANTERN_SLOT], y: LANTERN_Y, r: LANTERN_R });
