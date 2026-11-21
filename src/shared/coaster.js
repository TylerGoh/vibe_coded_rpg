// Docs: docs/places/coaster.md
// The Gathering Line (F2, story/fair-plan.md): the coaster round the Gathering Fair. Shared by the client and the server:
// the track (one closed loop, sampled once at load), how fast a car goes along it, its four stations, and where a car is
// at any point of the loop. CARTS cars go round all the time on the server's clock (drawing only: src/coaster.js); you
// catch one with E as it passes (owner, 2026-11-21: "catch a cart by pressing E as it passes, dismount by pressing E or
// jumping off"). Riding is two numbers on the slime's state, set and advanced inside step() (src/shared/sim.js): rd (1
// while riding) and rc (where on the loop, in ticks from the start), so it's predicted like walking and in snapshots.
// Cosmetic only: no gold, EXP or power.
import { FAIR_GROUND } from './fair.js';

const G = FAIR_GROUND;
export const RAIL = G - 14; // the rail's height at a station (a car sits on the ground there)
export const SEAT = 16; // a rider's feet sit this far above the rail

// The four stations, west to east along the out line: the cars slow right down through them, so they're the easy places
// to catch one from the ground
export const STATIONS = [
  { id: 'gate', name: 'the Gate Plaza', x: 1400 },
  { id: 'midway', name: 'the Midway', x: 2310 },
  { id: 'ride', name: 'Ride Row', x: 5240 },
  { id: 'pier', name: "the Pier's End", x: 6260 },
];
// E catches a car whose seat is within CATCH_R of your feet (from the ground at a station, or jumping up to one going by);
// the client only sends CATCH when it can see one there
export const CATCH = 1 << 10;
export const CATCH_R = 60;
export const CARTS = 6; // cars round the loop, evenly spaced in time

// ——— the track ———
// Nodes round the loop, smoothed with Catmull-Rom between them. f: 'L' a chain lift (a steady LIFT_V up it), 'T' inside
// the Big Top (riders aren't drawn), 'R' a raw run of dense points (straight between them), 'O' the loop and 'U' the two
// turnarounds (raw too). A car is drawn upright on the way back west and turns round the U as if on a spiral ramp
// (trackAt's d and sx); only in the loop does it go upside down.
// Up high, clear of the fair below (owner, 2026-11-21), dropping to the ground only at the four stations: the Gate Plaza,
// a lift, over the Big Top, the Midway, over the booths, the Ferris wheel and the carousel, Ride Row, the loop over the
// Hall of Mirrors, the Pier's End; then up a turnaround at the east end, back west along the top of the sky, and down a
// turnaround into the Gate Plaza again. (No 'T' stretch any more: the hidden-inside-the-Big-Top code stays for one.)
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
at(1530, 330, 'L');
at(1600, 190, 'L');
at(1680, 132);
// high over the Big Top (owner, 2026-11-21: up out of the way of everything; it used to dive through the roof)
at(1880, 124);
at(2080, 134);
// the Midway
at(2250, RAIL, 'R');
at(2370, RAIL, 'L');
at(2420, 330, 'L');
at(2480, 200, 'L');
at(2560, 146);
// over the Green (F3: the High Striker, the dunk tank, the teacups)
at(2900, 152);
at(3250, 134);
at(3550, 150);
// over the booths, the wheel and the carousel
at(3800, 160);
at(4050, 138);
at(4300, 162);
at(4550, 136);
at(4860, 140);
at(5050, 156);
// Ride Row
at(5190, RAIL, 'R');
at(5300, RAIL, 'L');
at(5360, 330, 'L');
at(5430, 210, 'L');
at(5530, 208);
// the loop over the Hall of Mirrors (under the high line, over the hall's sign)
arc(5620, 160, 48, 0, Math.PI * 2, 1, 1, 36, 'O', 24);
at(5780, 196);
at(5960, 186);
at(6110, 250);
// the Pier's End, and the turnaround up at the east end
at(6210, RAIL, 'R');
at(6340, RAIL, 'R');
arc(6340, 256, RAIL - 256, 0, Math.PI, 1, 1, 30, 'U');
// back west, along the top of the sky
at(6100, 80);
at(5600, 86);
at(5100, 76);
at(4600, 88);
at(4100, 78);
at(3600, 84);
at(3100, 80);
at(2600, 86);
at(2100, 76);
at(1700, 84);
// the turnaround down into the Gate Plaza
arc(1330, 256, RAIL - 256, 0, Math.PI, -1, -1, 30, 'U');

const SMOOTH = 400, PIN_R = 12; // smoothing passes over the dense loop (about 35 px of rounding)
const crx = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
// the loop as a dense polyline (each point keeps its segment's flag)
const dense = [];
for (let i = 0; i < N.length; i++) {
  const a = N[i], b = N[(i + 1) % N.length];
  if (Math.hypot(b.x - a.x, b.y - a.y) < 0.5) continue;
  const raw = 'ROU'.includes(a.f || '-') || 'ROU'.includes(b.f || '-');
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
const TOP_V = 3.4, GRAV = 0.11, Y_TOP = 50; // the height rule: v = sqrt(TOP_V² + 2·GRAV·(y − Y_TOP))
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

// ——— riding ———
export const LOOP_T = Math.round(LOOP_TICKS); // a car's clock goes round in whole ticks
// Where on the loop loop time t is (0 <= t < LOOP_T): {x, y (the rail), a (its angle), v (px a tick), hidden (inside the
// Big Top)}
export function trackAt(t) {
  t = ((t % LOOP_T) + LOOP_T) % LOOP_T;
  t *= LOOP_TICKS / LOOP_T;
  let lo = 0, hi = TRACK_N; // T[lo] <= t < T[lo + 1]
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (T[m] <= t) lo = m;
    else hi = m;
  }
  const n = (lo + 1) % TRACK_N, f = Math.min(1, (t - T[lo]) / (T[lo + 1] - T[lo]));
  let da = A[n] - A[lo];
  if (da > Math.PI) da -= Math.PI * 2;
  if (da < -Math.PI) da += Math.PI * 2;
  const a = A[lo] + da * f, c = Math.cos(a);
  // how to draw the car: d its tilt, sx its x scale (-1 heading west, squashing through 0 round a turnaround)
  const [d, sx] = F[lo] === 'O' ? [a, 1] : F[lo] === 'U' ? [0, Math.sign(c || 1) * Math.max(0.12, Math.abs(c))] : c >= 0 ? [a, 1] : [a - Math.PI, -1];
  return { x: X[lo] + (X[n] - X[lo]) * f, y: Y[lo] + (Y[n] - Y[lo]) * f, a, d, sx, v: DS / (T[lo + 1] - T[lo]), hidden: F[lo] === 'T' };
}
// The loop time of the point on the track nearest a rider's feet at (x, y), and how far off it is
export function nearestOnTrack(x, y) {
  let best = 0, bd = Infinity;
  for (let i = 0; i < TRACK_N; i++) {
    const d = (X[i] - x) ** 2 + (Y[i] - SEAT - y) ** 2;
    if (d < bd) [best, bd] = [i, d];
  }
  return { t: Math.round((T[best] * LOOP_T) / LOOP_TICKS) % LOOP_T, d: Math.sqrt(bd), hidden: F[best] === 'T' };
}
// The cars' loop times at server tick `tick`
export const cartTimes = (tick) => Array.from({ length: CARTS }, (_, i) => Math.floor(tick + (i * LOOP_T) / CARTS) % LOOP_T);
