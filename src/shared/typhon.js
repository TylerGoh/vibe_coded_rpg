// Docs: docs/places/typhon.md, docs/combat/bosses.md
// Typhon, the Buried Fire (E5 (c), story/e5-plan.md): the Hearth's geometry and every tuning constant of its own
// mechanics (the floor plates, the pressure and the vents, the Pour, its moves), shared by the brain (server/typhon.js)
// and the client (src/typhon.js, src/dens-typhon.js). Its FINAL row (phases, loops, ultimates) is in src/shared/final.js
// with Ladon's and Fenrir's. Nothing here imports src/shared/rpg.js.
import { FIN_W, FIN_FLOOR } from './final.js';

export const TY_MID = FIN_W / 2; // the hearth pit at the back middle, where it rises (the boss mob's start)
// The arena: a high brick ledge at each end (always above the iron), two low ledges each side (under the iron only near
// the top of the Pour, POUR_LEDGE) and the ladle-crane's gantry over the middle. A den's own platforms, never changed
// mid-fight (DENS[].platforms)
export const TYPHON_PLATFORMS = [
  { x: 30, y: 240, w: 150, kind: 'high' },
  { x: 210, y: 345, w: 160, kind: 'low' },
  { x: 470, y: 345, w: 130, kind: 'low' },
  { x: 660, y: 235, w: 180, kind: 'crane' },
  { x: 900, y: 345, w: 130, kind: 'low' },
  { x: 1130, y: 345, w: 160, kind: 'low' },
  { x: 1320, y: 240, w: 150, kind: 'high' },
];
export const HIGH_W = 0, HIGH_E = 6; // (the high end ledges' indexes)
// which of TYPHON_PLATFORMS a slime with feet at (x, y) stands on (-1: none)
export const tyLedgeAt = (x, y) => TYPHON_PLATFORMS.findIndex((p) => Math.abs(y - p.y) < 3 && x >= p.x - 16 && x <= p.x + p.w + 16);
export const onLowLedge = (x, y) => TYPHON_PLATFORMS[tyLedgeAt(x, y)]?.kind === 'low';
export const onFloor = (y) => y > FIN_FLOOR - 6;

// ——— the floor plates: eight cast-iron strips over the fire ———
// st: 'c' cold (dark iron, safe), 'g' glowing (a warning: molten after GLOW_S), 'm' molten (it hurts to stand on:
// MOLTEN_HP of max HP every PLATE_TICK_S, server-timed, nothing blocks; crusts back to cold after PLATE_COOL_S), 'k'
// crusted (frost set it: safe, and an Eruption spares it; cold again after CRUST_S). A frost hit by anyone in the den
// crusts every hot plate in the caster's reach at once (server/typhon.js frost); anyone standing by a hot plate can fill
// its ring (PLATE_RING of the plain hp) to crust it slowly (the poor answer).
export const PLATES = 8;
export const PLATE_W = FIN_W / PLATES;
export const plateAt = (x) => Math.max(0, Math.min(PLATES - 1, Math.floor(x / PLATE_W)));
export const plateMid = (i) => (i + 0.5) * PLATE_W;
export const GLOW_S = 1.6, PLATE_COOL_S = 20, CRUST_S = 14;
export const MOLTEN_HP = 0.035, PLATE_TICK_S = 0.5;
export const PLATE_RING = 0.0004, PLATE_R = 46, PLATE_RING_Y = FIN_FLOOR - 16;

// ——— the pressure (its held breath) and the four vents ———
// One number 0..PRESS_MAX. It climbs PRESS_RATE[phase] a second, and its moves add to it (PRESS_HAMMER, PRESS_BURST,
// POUR_ADD); a Bellows landing lets BELLOWS_LET out; a vent opened lets VENT_DROP out; an Eruption that goes off lets
// ERUPT_LET out. At PRESS_MAX the hearth goes up: an Eruption comes at its next move with no wind-up a freeze can stop
// (`noFreeze`), and leaves it at PRESS_AFTER. (Every Eruption resetting it made the vents pointless: checked by napkin
// math, docs/places/typhon.md.)
export const PRESS_MAX = 100;
export const PRESS_RATE = [0.22, 0.5, 0.42, 0.46];
export const PRESS_HAMMER = 2, PRESS_BURST = 4, BELLOWS_LET = 5, POUR_ADD = 8, VENT_DROP = 30, ERUPT_LET = 15, PRESS_AFTER = 30;
// The vents: the old furnace doors, two in each side wall (a low one by the floor, a high one over the end ledge), an
// iron wheel on each. Fill one's ring (VENT_RING of the plain hp) and it opens: VENT_DROP out, and VENT_DELAY s later a
// column of fire roars out of it along the floor (or across the high ledge) VENT_LEN px for VENT_BLAST_S (a beam: hurts,
// never blocks). Then it's shut VENT_SHUT_S before it turns again. st: 'r' ready, 'o' open (blasting), 's' shut, 'j'
// jammed (the enrage)
export const VENTS = [
  { x: 34, y: 402, side: -1, low: true },
  { x: 34, y: 182, side: -1, low: false },
  { x: FIN_W - 34, y: 402, side: 1, low: true },
  { x: FIN_W - 34, y: 182, side: 1, low: false },
];
export const VENT_R = 30, VENT_RING = 0.0005, VENT_DELAY = 0.9, VENT_BLAST_S = 3, VENT_LEN = 420, VENT_SHUT_S = 18;
export const VENT_LOW_BAND = [404, 452], VENT_HIGH_BAND = [196, 262]; // (feet-y bands the blast covers)

// ——— the Pour (phase 3): the molten iron's height is the pressure ———
// floodN: how many plates from each end are under the iron (the low plates go first, edge to middle: one more a side
// every POUR_STEP of pressure). At POUR_LEDGE the low ledges go under too; the high ledges and the crane never do. Iron
// over a plate hurts like a molten plate; a crust on it (frost, or its ring) is a skin you can stand on.
export const POUR_STEP = 25, POUR_LEDGE = 88;
export const floodN = (ph, pr) => (ph === 2 ? Math.max(0, Math.min(PLATES / 2, Math.floor(pr / POUR_STEP))) : 0);
export const flooded = (i, n) => i < n || i >= PLATES - n;
export const ledgesFlooded = (ph, pr) => ph === 2 && pr >= POUR_LEDGE;
// is plate i hot (it hurts to stand on: molten, or under the iron without a skin)?
export const plateHot = (st, i, n) => st === 'm' || (st !== 'k' && flooded(i, n));

// ——— the moves (s unless named) ———
// Glare: its four eyes settle on one slime for GLARE_S (the focus; Rally takes it)
export const GLARE_S = 30;
// Hammer: a forearm rises HAMMER_WARN[phase] (the landing marked), comes down within HAMMER_R of the mark on anyone low
// (within HAMMER_H of the floor), the plate under it glowing, then molten; the arm lies there HAMMER_REST (melee's opening)
export const HAMMER_WARN = [1.3, 1.2, 1.1, 1.0], HAMMER_R = 110, HAMMER_H = 90, HAMMER_REST = 2.2;
// Coil Burst: BURST_N plates nearest the watched slime bulge in turn (BURST_GAP apart), each BURST_WARN before a coil
// heaves up through it: anyone on the floor over it is hit; it's left molten
export const BURST_N = 3, BURST_WARN = 1.1, BURST_GAP = 0.6;
// Fire Breath: along the floor or at low-ledge height (feet-y bands), after BREATH_WARN (the high ledges and crane are over it)
export const BREATH_WARN = 1.3, BREATH_FLOOR = [404, 452], BREATH_LEDGE = [290, 366];
// Coil Sweep (phase 4): SWEEP_WARN marked, then it drags its coils toward the watched slime's end at SWEEP_SPEED px/s,
// to BODY_EDGE from the wall; anyone within SWEEP_H of the floor when the front passes is hit; every plate it crosses melts
export const SWEEP_WARN = 1.5, SWEEP_SPEED = 520, SWEEP_H = 90;
// Inhale (phase 4): its ribs spread INHALE_S, the tooth in its chest the weak point (INHALE_WEAK × a top boss's weak point
// HP; filled: the long stagger and all the pressure out). Unfilled: the breath out is a double Bellows and every plate glows
export const INHALE_S = 6, INHALE_WEAK = 3;
// Phase 4: it moves along the den on its coils, its middle never nearer a wall than BODY_EDGE
export const BODY_EDGE = 220;
// The brood (phase 2 on): cinder whelps climb out of hot plates every BROOD_EVERY s, BROOD_BASE plus one for every
// BROOD_PER hot plates (within the adds cap). A crusted plate gives none.
export const BROOD_EVERY = 20, BROOD_BASE = 1, BROOD_PER = 3;
// Phase 4 starts with UNBURIED_GLOW plates glowing (the coils came up through them)
export const UNBURIED_GLOW = 5;
// The enrage (FINAL_ENRAGE_MIN): every vent jams, nothing crusts, and one more plate goes molten for good every
// ENRAGE_PLATE_S; a Bellows every ENRAGE_BREATH_S (src/shared/final.js) besides the loop's own

export const ENRAGE_PLATE_S = 20;

// ——— the ultimates ———
// Eruption: every plate erupts but the crusted ones and ERUPT_DARK the wind-up leaves dark (judged on x: a slime over
// a safe plate at any height is safe; everywhere else, ledges too, is not); the erupted ones are left molten.
// The Last Pour: a wave of iron from one end to the other at POUR_SPEED px/s (u.dir: the way it runs, the ladle swings
// that way); judged as its front passes you: safe only on the high ledge at the end it runs to, or standing on a
// crusted plate.
export const ERUPT_DARK = 2, POUR_SPEED = 480;
export function pourSafe(dir, x, y, ledge, crusted) {
  if (ledge === (dir > 0 ? HIGH_E : HIGH_W)) return true;
  return onFloor(y) && !!crusted[plateAt(x)];
}

// ——— its targets (h[4] = 2 + slot: slots 0–3 the vents, 4–11 the plates' rings) ———
export const PLATE_SLOT = 4;
export const tySpot = (slot) => (slot < PLATE_SLOT ? { x: VENTS[slot].x, y: VENTS[slot].y, r: VENT_R } : { x: plateMid(slot - PLATE_SLOT), y: PLATE_RING_Y, r: PLATE_R });
