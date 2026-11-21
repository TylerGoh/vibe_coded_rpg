// Docs: docs/places/coaster.md
// The Gathering Line (F2, story/fair-plan.md): the coaster round the Gathering Fair. Shared by the client and the server:
// the track (one closed loop, sampled once at load), how fast a car goes along it, its four stations, and where a rider
// is on any tick of their ride. A ride is two numbers on the slime's state, set and advanced inside step()
// (src/shared/sim.js): rd (which ride: 1 + from * 4 + to, 0 when not riding) and rc (ticks since it left), so it's
// predicted like walking, in snapshots (wire version 12), and friends who board together ride together.
// Cosmetic only: no gold, EXP or power.
import { FAIR_GROUND } from './fair.js';

const G = FAIR_GROUND;
export const RAIL = G - 14; // the rail's height at a station (a car sits on the ground there)
export const SEAT = 16; // a rider's feet sit this far above the rail

// The four stations, west to east along the out line. x: where you stand to board (and where you're set down)
export const STATIONS = [
  { id: 'gate', name: 'the Gate Plaza', x: 1400 },
  { id: 'midway', name: 'the Midway', x: 2310 },
  { id: 'ride', name: 'Ride Row', x: 4240 },
  { id: 'pier', name: "the Pier's End", x: 5260 },
];
export const STATION_R = 40; // stand within this of a station's x to board
// The card's pick, sent with the E press as input bits (sim.js PICK): 1 + the station you want to get off at
export const PICK_SHIFT = 10, PICK_MASK = 7 << PICK_SHIFT;

// ——— the track ———
// Nodes round the loop, smoothed with Catmull-Rom between them. f: 'L' a chain lift (a steady LIFT_V up it), 'T' inside
// the Big Top (riders aren't drawn), 'R' a raw run of dense points (the turnarounds and the loop: straight between them).
// Out east low: the Gate Plaza, the lift, the dive through the Big Top's roof, the Midway, over the booths, the Ferris
// wheel and the carousel, Ride Row, up and round the loop over the Hall of Mirrors, down to the Pier's End; then up a
// half circle at the east end and back west high over everything, and down a half circle into the Gate Plaza again.
const N = [];
const at = (x, y, f = '') => N.push({ x, y, f });
const arc = (cx, cy, r, a0, a1, sx, sy, n, f = 'R', drift = 0) => {
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n;
    at(cx + sx * r * Math.sin(t) + drift * (i / n), cy + sy * r * Math.cos(t), f);
  }
};
// the Gate Plaza, and the lift up beside the Big Top
at(1330, RAIL, 'R');
at(1470, RAIL, 'L');
at(1560, 300, 'L');
at(1690, 132);
// the dive into the Big Top's roof and out of its far side
at(1770, 196, 'T');
at(1880, 340, 'T');
at(1990, 246, 'T');
at(2060, 200);
at(2130, 196);
// the Midway
at(2250, RAIL, 'R');
at(2370, RAIL, 'L');
at(2470, 236);
// over the booths, the wheel and the carousel
at(2650, 200);
at(2860, 250);
at(3060, 180);
at(3280, 244);
at(3480, 176);
at(3660, 150);
at(3860, 110);
at(4040, 160);
// Ride Row
at(4190, RAIL, 'R');
at(4300, RAIL, 'L');
at(4430, 300, 'L');
at(4560, 222);
// the loop over the Hall of Mirrors
arc(4620, 152, 70, 0, Math.PI * 2, 1, 1, 40, 'R', 24);
at(4800, 236);
at(4980, 300);
at(5120, 380);
// the Pier's End, and the half circle up at the east end
at(5210, RAIL, 'R');
at(5340, RAIL, 'R');
arc(5340, 266, RAIL - 266, 0, Math.PI, 1, 1, 30);
// back west, high
at(5100, 108);
at(4600, 124);
at(4100, 100);
at(3600, 128);
at(3100, 104);
at(2600, 126);
at(2100, 100);
at(1700, 116);
// the half circle down into the Gate Plaza
arc(1330, 266, RAIL - 266, 0, Math.PI, -1, -1, 30);

const SMOOTH = 400, PIN_R = 12; // smoothing passes over the dense loop (about 35 px of rounding)
const crx = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
// the loop as a dense polyline (each point keeps its segment's flag)
const dense = [];
for (let i = 0; i < N.length; i++) {
  const a = N[i], b = N[(i + 1) % N.length];
  if (Math.hypot(b.x - a.x, b.y - a.y) < 0.5) continue;
  const raw = a.f === 'R' || b.f === 'R';
  const p0 = N[(i - 1 + N.length) % N.length], p3 = N[(i + 2) % N.length];
  const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3));
  for (let k = 0; k < steps; k++) {
    const t = k / steps;
    const x = a.x + (b.x - a.x) * t, pin = a.f === 'R' && a.y === RAIL && b.y === RAIL && STATIONS.some((st) => Math.abs(x - st.x) < PIN_R); // a station's middle stays put
    dense.push(raw ? { x, y: a.y + (b.y - a.y) * t, f: a.f, pin } : { x: crx(p0.x, a.x, b.x, p3.x, t), y: crx(p0.y, a.y, b.y, p3.y, t), f: a.f });
  }
}
// rounded off (no kinks where a drop meets a station's run, or a straight meets an arc), the stations' runs pinned flat
for (let pass = 0; pass < SMOOTH; pass++) {
  const px = dense.map((d) => d.x), py = dense.map((d) => d.y), n = dense.length;
  for (let i = 0; i < n; i++) {
    if (dense[i].pin) continue;
    const a = (i - 1 + n) % n, b = (i + 1) % n;
    dense[i].x = (px[a] + 2 * px[i] + px[b]) / 4;
    dense[i].y = (py[a] + 2 * py[i] + py[b]) / 4;
  }
}

// ——— speed: slow at the crests, quick in the dips, steady up a lift, braking into every station ———
export const LIFT_V = 3; // px a tick up a chain lift
export const STATION_V = 2.2; // px a tick through a station
export const STATION_RUN = 140; // px of track either side of a station to brake over
const TOP_V = 3.4, GRAV = 0.11, Y_TOP = 60; // the height rule: v = sqrt(TOP_V² + 2·GRAV·(y − Y_TOP))
const DS = 4; // px between samples

// Resampled every DS px along the loop: x, y, the rail's angle, the flag, and the ticks it takes to get there (T)
const X = [], Y = [], A = [], F = [], T = [];
{
  let acc = 0, carry = 0;
  X.push(dense[0].x), Y.push(dense[0].y), F.push(dense[0].f);
  for (let i = 0; i < dense.length; i++) {
    const a = dense[i], b = dense[(i + 1) % dense.length], d = Math.hypot(b.x - a.x, b.y - a.y);
    let u = DS - carry;
    while (u <= d) {
      X.push(a.x + ((b.x - a.x) * u) / d), Y.push(a.y + ((b.y - a.y) * u) / d), F.push(a.f);
      u += DS;
    }
    carry = d - (u - DS);
    acc += d;
  }
}
export const TRACK_N = X.length;
for (let i = 0; i < TRACK_N; i++) {
  const p = (i - 1 + TRACK_N) % TRACK_N, n = (i + 1) % TRACK_N;
  A.push(Math.atan2(Y[n] - Y[p], X[n] - X[p]));
}
// each station's sample: the nearest point on a flat run at rail height
for (const st of STATIONS) {
  let best = -1, bd = Infinity;
  for (let i = 0; i < TRACK_N; i++) if (Math.abs(Y[i] - RAIL) < 0.5 && Math.abs(X[i] - st.x) < bd) [best, bd] = [i, Math.abs(X[i] - st.x)];
  st.i = best;
}
const vAt = (i) => {
  let v = F[i] === 'L' ? LIFT_V : Math.sqrt(TOP_V * TOP_V + 2 * GRAV * Math.max(0, Y[i] - Y_TOP));
  for (const st of STATIONS) {
    const d = Math.min(Math.abs(i - st.i), TRACK_N - Math.abs(i - st.i)) * DS;
    if (d < STATION_RUN) v = Math.min(v, STATION_V + (v - STATION_V) * (d / STATION_RUN));
  }
  return v;
};
T.push(0);
for (let i = 1; i <= TRACK_N; i++) T.push(T[i - 1] + DS / ((vAt(i - 1) + vAt(i % TRACK_N)) / 2));
export const LOOP_TICKS = T[TRACK_N]; // once round the whole loop

// the track for drawing: [x, y, flag] every DS px
export const TRACK = X.map((x, i) => [x, Y[i], F[i]]);

// ——— a ride ———
export const rideCode = (from, to) => 1 + from * 4 + to;
export const rideFrom = (rd) => ((rd - 1) >> 2) & 3;
export const rideTo = (rd) => (rd - 1) & 3;
// How long a ride takes, in ticks
export const rideTicks = (rd) => {
  const a = T[STATIONS[rideFrom(rd)].i], b = T[STATIONS[rideTo(rd)].i];
  return b > a ? b - a : b + LOOP_TICKS - a;
};
// Where a rider is rc ticks into ride rd: {x, y (the rail), a (its angle), hidden (inside the Big Top), done}
export function rideAt(rd, rc) {
  const len = rideTicks(rd);
  if (rc >= len) return { done: true, x: STATIONS[rideTo(rd)].x, y: RAIL, a: 0, hidden: false };
  let t = T[STATIONS[rideFrom(rd)].i] + rc;
  if (t >= LOOP_TICKS) t -= LOOP_TICKS;
  let lo = 0, hi = TRACK_N; // T[lo] <= t < T[lo + 1]
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (T[m] <= t) lo = m;
    else hi = m;
  }
  const n = (lo + 1) % TRACK_N, f = (t - T[lo]) / (T[lo + 1] - T[lo]);
  let da = A[n] - A[lo];
  if (da > Math.PI) da -= Math.PI * 2;
  if (da < -Math.PI) da += Math.PI * 2;
  return { done: false, x: X[lo] + (X[n] - X[lo]) * f, y: Y[lo] + (Y[n] - Y[lo]) * f, a: A[lo] + da * f, hidden: F[lo] === 'T' };
}
// The station a slime standing at s could board at (-1: none). (The room check is the caller's: sim.js)
export const stationAt = (s) => (s.grounded && !s.onPlat ? STATIONS.findIndex((st) => Math.abs(s.x - st.x) < STATION_R) : -1);
