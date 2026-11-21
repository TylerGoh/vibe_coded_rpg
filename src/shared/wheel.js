// Docs: docs/places/rides.md
// The Gathering Fair's Ferris wheel (F3, story/fair-plan.md). Shared by the client and the server: the wheel's size, its
// gondolas going round on the server's clock (drawing only: src/fair-rides.js), and where a rider is. Like the coaster,
// riding is the slime's rd / rc inside step() (src/shared/sim.js): rd = WHEEL while you're in a gondola, rc the ticks since
// you got in. One turn takes you up to the top, where every island shows, and back down, and lets you off at the bottom.
// Cosmetic only: no gold, EXP or power.
import { WHEEL_X, FAIR_GROUND } from './fair.js';

export const WHEEL = 2; // rd while on the wheel (1 is the Gathering Line)
export const HUB_Y = FAIR_GROUND - 240;
export const WHEEL_R = 190;
export const GONDOLAS = 12;
export const WHEEL_T = 2400; // ticks once round (and one ride: in at the bottom, out at the bottom)
export const HANG = 34; // a rider's feet sit this far below their gondola's pivot on the rim
export const BOARD_R = 34; // E within this of the wheel's foot (on the ground) catches the gondola at the bottom
export const BOARD_WINDOW = 40; // ticks: a gondola this close to the bottom can be caught (the client only sends CATCH then)
const TAU = Math.PI * 2;

// the angle of a gondola u turns past the bottom (screen angles, y down: the wheel turns clockwise)
const angleOf = (u) => Math.PI / 2 + TAU * u;
// every gondola's angle at server tick `tick`
export const gondolaAngles = (tick) => Array.from({ length: GONDOLAS }, (_, i) => angleOf(tick / WHEEL_T + i / GONDOLAS));
// is a gondola at the bottom now (within BOARD_WINDOW)?
export function gondolaDown(tick) {
  const per = WHEEL_T / GONDOLAS, d = (((tick % per) + per) % per); // ticks since the last one passed the bottom
  return Math.min(d, per - d) <= BOARD_WINDOW;
}
// A rider rc ticks into their turn: their gondola's pivot (x, y), its angle, and where their feet are
export function wheelAt(rc) {
  const a = angleOf(rc / WHEEL_T), px = WHEEL_X + Math.cos(a) * WHEEL_R, py = HUB_Y + Math.sin(a) * WHEEL_R;
  return { a, px, py, x: px, y: py + HANG };
}
// how near the top a rider is (0 below the hub's height, 1 at the very top): the islands' names show
export const topOf = (rc) => Math.max(0, -Math.sin(angleOf(rc / WHEEL_T)));
