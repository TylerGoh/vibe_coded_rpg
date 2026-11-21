// Docs: docs/places/rides.md
// The Gathering Fair's rides on the client (F3): the Ferris wheel and its gondolas going round on the server's clock (drawWheel,
// behind the slimes), a rider in their gondola (drawWheelRider, from the slime pass in src/main.js), the islands' names
// from the top (drawIslandNames); the Green: the High Striker and its puck (strikes from the server), the dunk tank, its
// plank, target and balls (throws from the server), and the teacups (their backs behind the slimes, their fronts over
// them: drawGreenFront), with a slime in a cup spinning (cupSpin: drawing only, like the carousel's bob).
import { TAU, circle, ellipse, clamp } from './util.js';
import { text } from './village.js';
import { islandsAt } from './distant.js';
import { FAIR_GROUND, FAIR_W, WHEEL_X, BELL_AT, meterAt, STRIKER_X, DUNK_X, DUNK_HALF, PLANK, TARGET_X, TARGET_Y, THROW_X, TEACUPS_X, TEACUP_DECK, CUPS } from './shared/fair.js';
import { HUB_Y, WHEEL_R, GONDOLAS, HANG, gondolaAngles, wheelAt } from './shared/wheel.js';

const G = FAIR_GROUND;
const BULBS = ['#ffe28a', '#ff9fb8', '#9fe3ff', '#c4f59a', '#d6b4ff'];
const CABINS = ['#ff9fb8', '#9fe3ff', '#ffd36e', '#b9e58c', '#d6b4ff', '#ffb38a'];
const RED = '#e8546a', CREAM = '#fff4e6', GOLD = '#f2c14e', WOOD = '#b98a5c', DARK = '#5b4a6b';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const ease = (k) => 1 - (1 - k) * (1 - k);

// ——— what's going on (set by main.js each frame, and by the server's messages) ———
let tick = null, riders = [], myTop = 0;
// t: the server tick; rcs: the wheel's riders' clocks (an empty gondola isn't drawn where someone's riding: theirs stands
// in); top: how near the top your own gondola is (0..1: the islands' names)
export const rideTick = () => tick;
export function setRides(t, rcs, top) {
  tick = t;
  riders = rcs;
  myTop = top;
}
let strike = null; // the last swing at the High Striker: { at, h, bell, name }
let plankAt = -99, splashAt = -99; // when the plank last dropped (and the water splashed)
const balls = []; // balls in flight: { at, x, y, hit }
let targetAt = -99;
export function rideEvent(m, time, from) {
  if (m.a === 'strike') strike = { at: time, h: m.h, bell: m.h >= 1 };
  else if (m.a === 'throw') {
    balls.push({ at: time, x: from?.x ?? THROW_X, y: (from?.y ?? G) - 30, hit: m.hit });
    if (balls.length > 6) balls.shift();
    if (m.hit) {
      targetAt = time + BALL_S;
      plankAt = time + BALL_S;
      if (m.who?.length) splashAt = time + BALL_S + 0.35;
    }
  }
}
const BALL_S = 0.45; // a ball's flight

// ——— the Ferris wheel ———
const angDist = (a, b) => {
  const d = (((a - b) % TAU) + TAU) % TAU;
  return Math.min(d, TAU - d);
};
function cabin(ctx, px, py, color, front) {
  // an open basket hanging from its pivot on two rods (the slime in it pokes up between them)
  const fy = py + HANG; // the basket's floor
  if (!front) {
    ctx.strokeStyle = '#8a7fb0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 26, fy - 14);
    ctx.lineTo(px, py);
    ctx.lineTo(px + 26, fy - 14);
    ctx.stroke();
    ctx.fillStyle = '#6f5f96';
    ctx.beginPath();
    ctx.roundRect(px - 27, fy - 16, 54, 22, [3, 3, 11, 11]);
    ctx.fill();
    ctx.fillStyle = GOLD;
    circle(ctx, px, py, 3);
    return;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(px - 28, fy - 14, 56, 21, [3, 3, 12, 12]);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(px - 28, fy - 14, 56, 4);
  ctx.fillStyle = 'rgba(91,74,107,0.25)';
  for (let i = -1; i <= 1; i++) circle(ctx, px + i * 16, fy - 2, 3);
}
export function drawWheel(ctx, L, R, time) {
  if (!visible(WHEEL_X - WHEEL_R - 40, WHEEL_X + WHEEL_R + 40, L, R)) return;
  const x = WHEEL_X, y = HUB_Y, angs = gondolaAngles(tick ?? time * 60), a = angs[0];
  // the legs and the boarding steps at its foot
  ctx.strokeStyle = '#8a7fb0';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x - 95, G);
  ctx.lineTo(x, y);
  ctx.lineTo(x + 95, G);
  ctx.stroke();
  ctx.strokeStyle = '#d6c8f0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, WHEEL_R, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, WHEEL_R - 26, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < GONDOLAS; i++) {
    const t = a + (i / GONDOLAS) * TAU;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(t) * WHEEL_R, y + Math.sin(t) * WHEEL_R);
    ctx.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const t = a + (i / 24) * TAU;
    ctx.fillStyle = BULBS[(i + Math.floor(time * 2)) % BULBS.length];
    circle(ctx, x + Math.cos(t) * WHEEL_R, y + Math.sin(t) * WHEEL_R, 2.6);
  }
  ctx.fillStyle = GOLD;
  circle(ctx, x, y, 13);
  ctx.fillStyle = '#fff1b8';
  circle(ctx, x, y, 5);
  // the gondolas (each rider's stands in for the empty one nearest them)
  const taken = riders.map((rc) => wheelAt(rc).a);
  angs.forEach((t, i) => {
    if (taken.some((r) => angDist(r, t) < Math.PI / GONDOLAS)) return;
    const px = x + Math.cos(t) * WHEEL_R, py = y + Math.sin(t) * WHEEL_R;
    cabin(ctx, px, py, 0, false);
    cabin(ctx, px, py, CABINS[i % CABINS.length], true);
  });
  // the platform at its foot, and its sign
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.roundRect(x - 44, G - 8, 88, 10, 4);
  ctx.fill();
  // its sign, hung from the hub inside the wheel (the booths either side would hide one on the ground)
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20, y + 12);
  ctx.lineTo(x - 26, G - 160);
  ctx.moveTo(x + 20, y + 12);
  ctx.lineTo(x + 26, G - 160);
  ctx.stroke();
  ctx.fillStyle = '#3f3a78';
  ctx.beginPath();
  ctx.roundRect(x - 50, G - 162, 100, 26, 13);
  ctx.fill();
  text(ctx, 'THE WHEEL', x, G - 149, 12, GOLD);
}
// A rider rc ticks into their turn, in their gondola: its back, the slime, its front over the slime's lower half
export function drawWheelRider(ctx, s, rc, draw) {
  const p = wheelAt(rc);
  let i = 0;
  if (tick !== null) {
    const angs = gondolaAngles(tick);
    let bd = Infinity;
    angs.forEach((t, k) => {
      const d = angDist(t, p.a);
      if (d < bd) [i, bd] = [k, d];
    });
  }
  cabin(ctx, p.px, p.py, 0, false);
  draw();
  cabin(ctx, p.px, p.py, CABINS[i % CABINS.length], true);
}
// From the top of the wheel every island shows: their names over them on the horizon (screen space, over the sky)
export function drawIslandNames(ctx, camX, horizon) {
  if (myTop < 0.55) return;
  const k = clamp((myTop - 0.55) / 0.35, 0, 1);
  ctx.save();
  ctx.globalAlpha = k;
  for (const isl of islandsAt({ from: 'fair', scroll: camX, roomW: FAIR_W, scale: 0.85 })) {
    const y = horizon - 70 - 40 * isl.s;
    ctx.fillStyle = 'rgba(63,58,120,0.75)';
    ctx.font = "700 12px Fredoka, 'Trebuchet MS', sans-serif";
    const w = ctx.measureText(isl.name).width + 18;
    ctx.beginPath();
    ctx.roundRect(isl.x - w / 2, y - 10, w, 20, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(63,58,120,0.75)';
    ctx.beginPath();
    ctx.moveTo(isl.x - 5, y + 10);
    ctx.lineTo(isl.x + 5, y + 10);
    ctx.lineTo(isl.x, y + 16);
    ctx.fill();
    text(ctx, isl.name, isl.x, y, 12, '#fff4e6');
  }
  text(ctx, 'every island, from the top of the wheel', 480, 68, 13, 'rgba(255,244,230,0.9)');
  ctx.restore();
}

// ——— the Green: the High Striker ———
const MARKS = [[0.25, 'WOBBLY'], [0.5, 'SQUISHY'], [0.75, 'STURDY'], [0.85, 'MIGHTY']];
const TOWER_H = 230; // the bell's height over the pad
function puckAt(time) {
  if (!strike) return { k: 0, ringing: 0 };
  const t = time - strike.at, up = 0.55, hold = 0.35, down = 0.5;
  if (t < 0) return { k: 0, ringing: 0 };
  if (t < up) return { k: strike.h * ease(t / up), ringing: 0 };
  if (t < up + hold) return { k: strike.h, ringing: strike.bell ? 1 : 0, word: true };
  if (t < up + hold + down) return { k: strike.h * (1 - ((t - up - hold) / down) ** 2), ringing: strike.bell ? 1 - (t - up - hold) / down : 0, word: true };
  return { k: 0, ringing: 0, word: t < up + hold + down + 0.8 };
}
function drawStriker(ctx, time) {
  const x = STRIKER_X + 18, top = G - TOWER_H;
  const p = puckAt(time);
  // the tower: a tall striped board with its scale
  ctx.fillStyle = '#3f3a78';
  ctx.beginPath();
  ctx.roundRect(x - 16, top - 4, 32, TOWER_H - 18, 6);
  ctx.fill();
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i % 2 ? RED : CREAM;
    ctx.fillRect(x - 10, top + 20 + i * ((TOWER_H - 50) / 10), 20, (TOWER_H - 50) / 10);
  }
  // the bell zone at the top of the scale, and the light running up and down it: slap as it's in the zone (meterAt, on
  // the server's clock: everyone sees the same light)
  const lvl = (k) => G - 26 - k * (TOWER_H - 32);
  ctx.fillStyle = 'rgba(242,193,78,0.85)';
  ctx.fillRect(x - 12, lvl(1) - 4, 24, lvl(BELL_AT) - lvl(1) + 4);
  if (tick !== null) {
    const ly = lvl(meterAt(tick)), hot = meterAt(tick) >= BELL_AT;
    ctx.fillStyle = hot ? 'rgba(255,236,150,0.55)' : 'rgba(255,255,255,0.3)';
    circle(ctx, x - 24, ly, hot ? 12 : 9);
    ctx.fillStyle = hot ? '#fff1b8' : '#ffffff';
    circle(ctx, x - 24, ly, 5);
    ctx.fillRect(x - 12, ly - 1.5, 24, 3);
  }
  for (const [k, word] of MARKS) {
    const y = lvl(k);
    ctx.fillStyle = GOLD;
    ctx.fillRect(x + 12, y - 1, 10, 2);
    text(ctx, word, x + 26, y, 9, '#fff4e6', 'left');
  }
  // the bell (shaking while it rings)
  const shake = p.ringing ? Math.sin(time * 60) * 3 * p.ringing : 0;
  if (p.ringing) {
    ctx.fillStyle = `rgba(255,236,150,${0.45 * p.ringing})`;
    circle(ctx, x, top - 8, 34);
  }
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(x - 16 + shake, top + 2);
  ctx.quadraticCurveTo(x - 14 + shake, top - 22, x + shake, top - 24);
  ctx.quadraticCurveTo(x + 14 + shake, top - 22, x + 16 + shake, top + 2);
  ctx.fill();
  ctx.fillStyle = '#fff1b8';
  circle(ctx, x - 5 + shake, top - 12, 3);
  // the puck on its wire
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, top + 4);
  ctx.lineTo(x, G - 24);
  ctx.stroke();
  const py = G - 26 - p.k * (TOWER_H - 32);
  ctx.fillStyle = '#ff6f91';
  ctx.beginPath();
  ctx.roundRect(x - 9, py - 6, 18, 12, 5);
  ctx.fill();
  // the pad and its lever at the foot
  ctx.fillStyle = '#7d5634';
  ctx.fillRect(x - 40, G - 12, 60, 12);
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.roundRect(x - 36, G - 18 + (time - (strike?.at ?? -9) < 0.15 ? 4 : 0), 30, 8, 4);
  ctx.fill();
  // the sign, and how high the last swing went
  ctx.fillStyle = '#3f3a78';
  ctx.beginPath();
  ctx.roundRect(x - 62, top - 64, 124, 26, 13);
  ctx.fill();
  text(ctx, 'HIGH STRIKER', x, top - 51, 12, GOLD);
  if (p.word && strike) {
    const w = strike.bell ? 'DING! THE BELL!' : MARKS.filter(([k]) => strike.h >= k).pop()?.[1] ?? 'A TAP';
    text(ctx, w, x - 70, G - 26 - strike.h * (TOWER_H - 32), strike.bell ? 14 : 11, strike.bell ? '#ffe28a' : '#fff4e6', 'right');
  }
}

// ——— the dunk tank ———
const plankDown = (time) => {
  const t = time - plankAt;
  return t < 0 || t > 1.4 ? 0 : t < 0.15 ? t / 0.15 : t > 1.1 ? (1.4 - t) / 0.3 : 1;
};
function drawTankBack(ctx, time) {
  const x0 = DUNK_X - DUNK_HALF, x1 = DUNK_X + DUNK_HALF, top = G - 94;
  // the frame and the back glass
  ctx.fillStyle = 'rgba(159,227,255,0.18)';
  ctx.fillRect(x0, top, x1 - x0, G - top);
  // the cage over the plank
  ctx.strokeStyle = '#8a7fb0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x0 + 4, G);
  ctx.lineTo(x0 + 4, PLANK.y - 70);
  ctx.lineTo(x1 - 4, PLANK.y - 70);
  ctx.lineTo(x1 - 4, G);
  ctx.stroke();
  ctx.fillStyle = '#3f3a78';
  ctx.beginPath();
  ctx.roundRect(DUNK_X - 64, PLANK.y - 96, 128, 26, 13);
  ctx.fill();
  text(ctx, 'DUNK TANK', DUNK_X, PLANK.y - 83, 12, GOLD);
  // the plank: hinged at its west end; it drops when the bull's hit
  const k = plankDown(time);
  ctx.save();
  ctx.translate(PLANK.x, PLANK.y + 4);
  ctx.rotate(k * 1.2);
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.roundRect(0, -4, PLANK.w, 9, 3);
  ctx.fill();
  ctx.fillStyle = '#d9b183';
  ctx.fillRect(2, -4, PLANK.w - 4, 3);
  ctx.restore();
  // the step up (FAIR_PLATFORMS' ladder) and a ladder to it
  ctx.fillStyle = '#c99b6b';
  ctx.fillRect(2925, 374, 46, G - 374);
  ctx.strokeStyle = '#a4785a';
  ctx.lineWidth = 2;
  ctx.strokeRect(2927, 376, 42, G - 378);
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(2960, 374);
  ctx.lineTo(2978, PLANK.y + 4);
  ctx.moveTo(2972, 374);
  ctx.lineTo(2990, PLANK.y + 4);
  ctx.stroke();
  // the target on its arm
  const hit = time - targetAt, wob = hit >= 0 && hit < 0.8 ? Math.sin(hit * 30) * (0.8 - hit) * 8 : 0;
  ctx.strokeStyle = '#8a7fb0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x1 - 4, TARGET_Y);
  ctx.lineTo(TARGET_X, TARGET_Y + wob);
  ctx.stroke();
  for (const [r, c] of [[20, RED], [14, CREAM], [8, RED]]) {
    ctx.fillStyle = c;
    circle(ctx, TARGET_X + 4, TARGET_Y + wob, r);
  }
  if (hit >= 0 && hit < 0.7) text(ctx, 'DING!', TARGET_X + 4, TARGET_Y - 34 - hit * 30, 14, '#ffe28a');
  // the throwing line, and a bucket of balls
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(THROW_X - 30, G - 3, 4, 6);
  ctx.fillStyle = '#8fc8ff';
  ctx.beginPath();
  ctx.moveTo(THROW_X + 22, G - 26);
  ctx.lineTo(THROW_X + 46, G - 26);
  ctx.lineTo(THROW_X + 42, G);
  ctx.lineTo(THROW_X + 26, G);
  ctx.fill();
  for (const [dx, c] of [[28, '#ff9fb8'], [36, '#ffe28a'], [44, '#b9e58c'], [32, '#d6b4ff']]) {
    ctx.fillStyle = c;
    circle(ctx, THROW_X + dx - 2, G - 28 - (dx === 32 ? 6 : 0), 5);
  }
  text(ctx, '3 BALLS? FREE!', THROW_X + 34, G - 52, 9, '#fff4e6');
}
// in front of the slimes: the water and the front glass (anyone dunked is under it), the splash, the balls in flight
function drawTankFront(ctx, time) {
  const x0 = DUNK_X - DUNK_HALF, x1 = DUNK_X + DUNK_HALF, top = G - 94, wl = G - 78;
  ctx.fillStyle = 'rgba(111,170,230,0.45)';
  ctx.beginPath();
  ctx.moveTo(x0, G);
  for (let x = x0; x <= x1; x += 10) ctx.lineTo(x, wl + Math.sin(time * 3 + x * 0.08) * 2);
  ctx.lineTo(x1, G);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x0 + 10, top + 8, 5, G - top - 16);
  ctx.strokeStyle = '#6f5f96';
  ctx.lineWidth = 5;
  ctx.strokeRect(x0, top, x1 - x0, G - top);
  const sp = time - splashAt;
  if (sp >= 0 && sp < 0.9) {
    ctx.fillStyle = `rgba(200,235,255,${0.9 - sp})`;
    for (let i = 0; i < 10; i++) {
      const a = Math.PI + (i / 9) * Math.PI, v = 120 + (i % 3) * 40;
      circle(ctx, DUNK_X + Math.cos(a) * v * sp, wl + Math.sin(a) * v * sp + 260 * sp * sp, 4);
    }
  }
  for (const b of balls) {
    const k = (time - b.at) / BALL_S;
    if (k < 0 || k > 1.8) continue;
    let x, y;
    if (k <= 1) {
      x = b.x + (TARGET_X + 4 - b.x) * k;
      y = b.y + (TARGET_Y - b.y) * k - Math.sin(Math.PI * k) * 50 + (b.hit ? 0 : 26 * k);
    } else {
      const u = k - 1; // (bouncing back off the target, or on past it)
      x = TARGET_X + 4 + (b.hit ? 60 : -50) * u;
      y = TARGET_Y + (b.hit ? 0 : 26) - 60 * u + 400 * u * u;
      if (y > G - 6) continue;
    }
    ctx.fillStyle = '#ff9fb8';
    circle(ctx, x, y, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    circle(ctx, x - 2, y - 2, 2);
  }
}

// ——— the teacups ———
export const cupSpin = (i, time) => Math.cos(time * (2.6 + i * 0.5) + i * 2);
function drawTeacupsBack(ctx, time) {
  const x = TEACUPS_X;
  // the turntable, its stripes turning
  ctx.fillStyle = '#d6b4ff';
  ellipse(ctx, x, G - 2, TEACUP_DECK, 16);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, G - 2, TEACUP_DECK, 16, 0, 0, TAU);
  ctx.clip();
  for (let i = 0; i < 16; i++) {
    const a = time * 0.8 + (i / 16) * TAU;
    if (Math.sin(a) < 0) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x + Math.cos(a) * TEACUP_DECK - 8, G - 20, 16, 36);
  }
  ctx.restore();
  // a big teapot behind, steaming, with the sign
  ctx.fillStyle = '#ff9fb8';
  ellipse(ctx, x, G - 120, 66, 52);
  ctx.fillStyle = '#ffd1dc';
  ellipse(ctx, x, G - 168, 40, 10);
  ctx.fillStyle = '#ff9fb8';
  circle(ctx, x, G - 180, 8);
  ctx.strokeStyle = '#ff9fb8';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(x + 70, G - 118, 24, -1.2, 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 60, G - 110);
  ctx.quadraticCurveTo(x - 100, G - 120, x - 108, G - 160);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const t = (time * 0.6 + i / 3) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - t)})`;
    circle(ctx, x - 110 - t * 10, G - 168 - t * 50, 6 + t * 8);
  }
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = BULBS[(i + Math.floor(time * 3)) % BULBS.length];
    circle(ctx, x - 52 + i * 15, G - 92, 3);
  }
  ctx.fillStyle = '#3f3a78';
  ctx.beginPath();
  ctx.roundRect(x - 56, G - 232, 112, 26, 13);
  ctx.fill();
  text(ctx, 'TEACUPS', x, G - 219, 12, GOLD);
  text(ctx, '(left is right in here)', x, G - 196, 9, '#fff4e6');
  // each cup's back, and its saucer
  for (const c of CUPS) {
    const cx = c.x + c.w / 2;
    ctx.fillStyle = '#f7e9ff';
    ellipse(ctx, cx, G - 6, 42, 7);
    ctx.fillStyle = '#5b4a6b';
    ellipse(ctx, cx, c.y - 16, 30, 6);
  }
}
const CUP = ['#9fe3ff', '#ffd36e', '#b9e58c'];
function drawTeacupsFront(ctx, time) {
  for (const c of CUPS) {
    const cx = c.x + c.w / 2, rim = c.y - 16, k = cupSpin(c.i, time), sn = Math.sin(time * (2.6 + c.i * 0.5) + c.i * 2);
    // the handle going round: behind the cup when it's on the far side
    const hx = cx + k * 34;
    ctx.fillStyle = CUP[c.i];
    ctx.beginPath();
    ctx.moveTo(cx - 32, rim);
    ctx.quadraticCurveTo(cx - 32, G - 8, cx, G - 8);
    ctx.quadraticCurveTo(cx + 32, G - 8, cx + 32, rim);
    ctx.closePath();
    ctx.fill();
    // dots going round with it
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 4; i++) {
      const a = time * (2.6 + c.i * 0.5) + c.i * 2 + (i / 4) * TAU;
      if (Math.sin(a) > 0) circle(ctx, cx + Math.cos(a) * 22, rim + 18, 4 * Math.sin(a));
    }
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ellipse(ctx, cx, rim, 32, 5);
    ctx.fillStyle = CUP[c.i];
    ellipse(ctx, cx, rim + 1.5, 30, 3.5);
    if (sn > 0) {
      ctx.strokeStyle = CUP[c.i];
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(hx, rim + 16, 7 * Math.max(0.2, Math.abs(Math.sin(time * 2.6 + c.i))), 10, 0, 0, TAU);
      ctx.stroke();
    }
  }
}

// ——— hooks for drawFair (behind the slimes) and main.js (in front of them) ———
export function drawGreen(ctx, L, R, time) {
  if (visible(STRIKER_X - 100, STRIKER_X + 120, L, R)) drawStriker(ctx, time);
  if (visible(DUNK_X - 140, THROW_X + 60, L, R)) drawTankBack(ctx, time);
  if (visible(TEACUPS_X - TEACUP_DECK - 120, TEACUPS_X + TEACUP_DECK + 20, L, R)) drawTeacupsBack(ctx, time);
}
export function drawGreenFront(ctx, camX, viewW, time) {
  const L = camX - 120, R = camX + viewW + 120;
  if (visible(DUNK_X - 140, THROW_X + 60, L, R)) drawTankFront(ctx, time);
  if (visible(TEACUPS_X - TEACUP_DECK, TEACUPS_X + TEACUP_DECK, L, R)) drawTeacupsFront(ctx, time);
}
// a slime standing in a teacup: how it's squashed as it spins (its x scale), or null when it isn't in one
export function spinOf(s, time) {
  for (const c of CUPS) if (Math.abs(s.y - c.y) < 2 && s.x >= c.x - 8 && s.x <= c.x + c.w + 8) {
    const k = cupSpin(c.i, time);
    return Math.sign(k || 1) * Math.max(0.15, Math.abs(k));
  }
  return null;
}
