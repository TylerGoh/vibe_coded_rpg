// Docs: docs/places/sunkenroad.md
// The Road's End (room ROADSEND, data in src/shared/rpg.js): the approach to Ladon's den. No mobs and no
// combat; everything that makes it frightening is drawn here (and heard: the `roadsend` music scene, given
// roadsDepth by src/main.js), never step() and never a cutscene. The road climbs out of the Sunken Road into a
// hollow walled in white roses. How far east YOU are (roadsDepth: 0 at the way in, 1 at the den's door) sets
// everything: the light dims, the petals thin out and stop, the roses turn their faces to follow you, behind
// the canes the shapes of necks rise and sway, pairs of white eyes open in the dark one after another (more
// with every step), and in the west the briar knits shut over the way you came (art only: the door back always
// works, and walking back opens it again). At the east end the den's door is a set piece: the necks coiled over
// it draw back by themselves as you come near, and beside it a sign with both levels (finalTag) and a live count
// of slimes in the approach. Ladon's one line (LADON_LINE, sent by the server: say) is a dark bubble from the dark.
import { W, H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { ROADSEND_W, ROADSEND_EXIT_X, LADON_DEN_X, GREEN_TOP, FINAL_MIN_PLAYERS, finalTag, FIELD_GROUND } from './shared/rpg.js';
import { glow as softGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));

// 0 at the way in, 1 at the den's door: how deep into the approach a slime at x is
export const roadsDepth = (x) => clamp((x - 260) / (LADON_DEN_X - 460), 0, 1);

function text(ctx, str, x, y, size, color, align = 'center', weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function thorn(ctx, x, y, a, len, base, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a + Math.PI / 2) * base, y + Math.sin(a + Math.PI / 2) * base);
  ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  ctx.lineTo(x + Math.cos(a - Math.PI / 2) * base, y + Math.sin(a - Math.PI / 2) * base);
  ctx.closePath();
  ctx.fill();
}
// a white rose whose face turns toward tx (look: -1..1)
function rose(ctx, x, y, r, look, a = 1) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = '#f4eeec';
  ctx.strokeStyle = 'rgba(160,130,140,0.7)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const an = (i / 5) * TAU - Math.PI / 2;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(an) * r * 0.55 * (1 - Math.abs(look) * 0.3), y + Math.sin(an) * r * 0.55, r * 0.55 * (1 - Math.abs(look) * 0.25), r * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#e8d488';
  circle(ctx, x + look * r * 0.35, y, r * 0.28);
  ctx.restore();
}

// ——— seeded scenery ———
const R0 = mulberry32(4801);
// the necks behind the canes (a slow parallax layer): each rises from below, curves, and ends in a head
const NECK_F = 0.22;
const necks = Array.from({ length: 7 }, (_, i) => ({
  x: 120 + i * 190 + R0() * 80, lean: (R0() - 0.5) * 1.2, h: 250 + R0() * 120, w: 34 + R0() * 22, p: R0() * TAU, th: 0.05 + i * 0.13,
}));
// free pairs of eyes in the dark (a nearer parallax layer), each with the depth it opens at
const EYE_F = 0.4;
const eyes = Array.from({ length: 18 }, (_, i) => {
  const th = 0.04 + (i / 18) * 0.9 + R0() * 0.04;
  return { x: 260 + th * (ROADSEND_W * EYE_F + 200) + (R0() - 0.5) * 220, y: 130 + R0() * 220, s: 0.7 + R0() * 0.8, th, p: R0() * TAU };
});
// the rose walls: canes and roses along the back of the hollow
const canes = (() => {
  const out = [];
  for (let x = -60; x < ROADSEND_W + 80; x += 38 + R0() * 40) out.push({ x, h: 200 + R0() * 120, lw: 5 + R0() * 6, lean: (R0() - 0.5) * 50 });
  return out;
})();
const roses = (() => {
  const out = [];
  for (let x = 0; x < ROADSEND_W; x += 18 + R0() * 26) out.push({ x, y: 215 + R0() * 200, r: 4 + R0() * 4.5, p: R0() * TAU });
  return out;
})();
const flags = (() => {
  const out = [];
  for (let x = 0; x < ROADSEND_W; ) {
    const w = 48 + R0() * 28;
    out.push({ x, w, lift: R0() < 0.2 ? 2 + R0() * 4 : 0 });
    x += w + 3;
  }
  return out;
})();
const petals = Array.from({ length: 34 }, () => ({ x: R0() * W, y: R0() * 420, v: 12 + R0() * 14, p: R0() * TAU, s: 1.6 + R0() * 1.4, k: R0() }));

// eyes open one after another: each eases toward its target (state kept between frames)
const eyeOpen = new Float32Array(eyes.length + necks.length);
let lastT = null;
let says = null; // Ladon's line: { text, at }

export function say(text, time) {
  says = { text, at: time };
}

// Everything behind the slimes. me: our own state (null when offline), here: slimes in the room (us included)
export function drawRoadsEnd(ctx, camX, viewW, time, me, here) {
  const k = roadsDepth(me?.x ?? 0), dt = lastT === null ? 0 : clamp(time - lastT, 0, 0.1);
  lastT = time;
  const all = [...eyes.map((e) => e.th), ...necks.map((n) => n.th + 0.04)];
  all.forEach((th, i) => {
    const want = k > th ? 1 : 0;
    eyeOpen[i] += (want - eyeOpen[i]) * Math.min(1, dt * (want ? 1.6 : 3));
  });
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, k, time);
  drawNecks(ctx, camX, k, time);
  ctx.restore();
  drawHedge(ctx, L, R, k, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawEyes(ctx, camX, k, time);
  ctx.restore();
  drawCanes(ctx, L, R, k, time, me);
  drawDoor(ctx, k, time, me);
  if (Math.abs(LADON_DEN_X - 250 - camX - viewW / 2) < viewW / 2 + 160) drawSign(ctx, LADON_DEN_X - 250, here, time);
  drawFloor(ctx, Math.max(0, L), Math.min(ROADSEND_W, R), k);
  if (ROADSEND_EXIT_X + 200 > L) drawKnit(ctx, k, time);
}

// The sky over the hollow: a dim pale glow at the way in, falling to near black toward the den
function drawSky(ctx, k, time) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, mixc([44, 36, 52], [12, 9, 14], k));
  g.addColorStop(1, mixc([70, 60, 74], [20, 16, 22], k));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  glow(ctx, W * (0.3 - k * 0.2), 40, 520, 220, '235,232,240', 0.22 * (1 - k) + 0.02);
}
function mixc(a, b, k) {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// The necks, far back behind the canes: huge dark shapes, swaying; they show more the deeper you are. Each ends
// in a long head whose eyes open in turn
function drawNecks(ctx, camX, k, time) {
  const a = 0.25 + 0.6 * smooth(k * 1.3);
  necks.forEach((n, i) => {
    const bx = n.x + 300 - camX * NECK_F;
    if (bx < -300 || bx > W + 300) return;
    const sway = Math.sin(time * 0.35 + n.p) * 26, rise = Math.sin(time * 0.22 + n.p * 2) * 14;
    const hx = bx + n.lean * 120 + sway, hy = GROUND - n.h + rise;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#1c1820';
    ctx.lineCap = 'round';
    ctx.lineWidth = n.w;
    ctx.beginPath();
    ctx.moveTo(bx - n.lean * 60, GROUND + 40);
    ctx.bezierCurveTo(bx - n.lean * 40, GROUND - n.h * 0.4, hx - n.lean * 80 - sway * 0.5, hy + 60, hx, hy);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,110,130,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // its head: a long skull of thorn, pointing the way it leans
    const d = n.lean >= 0 ? 1 : -1;
    ctx.fillStyle = '#1c1820';
    ctx.beginPath();
    ctx.moveTo(hx - d * 18, hy - 16);
    ctx.quadraticCurveTo(hx + d * 40, hy - 26, hx + d * 76, hy + 4);
    ctx.quadraticCurveTo(hx + d * 36, hy + 16, hx - d * 20, hy + 18);
    ctx.closePath();
    ctx.fill();
    for (let j = 0; j < 3; j++) thorn(ctx, hx - d * (6 - j * 16), hy - 16 - j * 2, -Math.PI / 2 - d * 0.5, 12, 3, '#1c1820');
    ctx.restore();
    // its eyes
    const o = eyeOpen[eyes.length + i];
    if (o > 0.02) eyePair(ctx, hx + d * 26, hy - 4, 5, 1, o, time, n.p);
  });
}

// the free pairs of eyes, in the dark between the necks
function drawEyes(ctx, camX, k, time) {
  eyes.forEach((e, i) => {
    const o = eyeOpen[i];
    if (o < 0.02) return;
    const x = e.x - camX * EYE_F;
    if (x < -40 || x > W + 40) return;
    eyePair(ctx, x + Math.sin(time * 0.3 + e.p) * 6, e.y + Math.sin(time * 0.5 + e.p) * 3, 9 * e.s, e.s, o, time, e.p);
  });
}
function eyePair(ctx, x, y, gap, s, open, time, p) {
  const blink = ((time + p * 4) % 6.5) < 0.14 ? 0.1 : 1;
  const oy = open * blink;
  glow(ctx, x, y, 34 * s, 18 * s, '235,255,235', 0.3 * open);
  ctx.fillStyle = '#f6fff2';
  for (const ex of [x - gap, x + gap]) ellipse(ctx, ex, y, 3.4 * s, Math.max(0.3, 2.6 * s * oy));
}

// The wall of the hollow: a dark mass of briar along the back, its top ragged with canes, a rim of the last light
// on it at the way in. Eyes open in it; necks rise behind it
function drawHedge(ctx, L, R, k, time) {
  const top = (x) => 190 + Math.sin(x * 0.011) * 22 + Math.sin(x * 0.037) * 10 + Math.sin(time * 0.4 + x * 0.002) * 3;
  ctx.fillStyle = mixc([40, 32, 42], [16, 12, 18], k);
  ctx.beginPath();
  ctx.moveTo(L - 20, GROUND + 4);
  for (let x = L - (L % 30) - 30; x <= R + 30; x += 30) ctx.lineTo(x, top(x));
  ctx.lineTo(R + 20, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(200,190,210,${0.18 * (1 - k)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = L - (L % 30) - 30; x <= R + 30; x += 30) (x === L - (L % 30) - 30 ? ctx.moveTo(x, top(x)) : ctx.lineTo(x, top(x)));
  ctx.stroke();
  // canes sticking up out of it
  ctx.lineCap = 'round';
  for (const c of canes) {
    if (c.x + 80 < L || c.x - 80 > R) continue;
    const t0 = top(c.x);
    ctx.strokeStyle = '#1a1418';
    ctx.lineWidth = c.lw * 0.6;
    ctx.beginPath();
    ctx.moveTo(c.x, t0 + 20);
    ctx.quadraticCurveTo(c.x + c.lean * 0.4, t0 - c.h * 0.2, c.x + c.lean, t0 - c.h * 0.35);
    ctx.stroke();
  }
}

// The rose walls: canes along the back of the hollow, white roses all over them. The roses turn their faces to
// you; the petals and the light thin out the deeper you are
function drawCanes(ctx, L, R, k, time, me) {
  const mx = me?.x ?? 0;
  ctx.lineCap = 'round';
  for (const c of canes) {
    if (c.x + 80 < L || c.x - 80 > R) continue;
    const near = Math.abs(c.x - mx) < 260 && k > 0.35 ? Math.sin(time * 3 + c.x) * 3 * k : 0; // they stir as you pass
    // an arching cane, rooted at the floor, bowing over toward the next
    const span = 70 + (c.h % 60), up = c.h * 0.55;
    ctx.strokeStyle = '#2a2028';
    ctx.lineWidth = c.lw;
    ctx.beginPath();
    ctx.moveTo(c.x, GROUND + 6);
    ctx.quadraticCurveTo(c.x + c.lean * 0.3 + near, GROUND - up * 1.6, c.x + span + near, GROUND - up * 0.4);
    ctx.stroke();
    for (let j = 1; j < 4; j++) thorn(ctx, c.x + (span * j) / 4 + c.lean * 0.1, GROUND - up * (0.6 + 0.25 * Math.sin(j * 1.3)), j % 2 ? -1.2 : -2, 7, 2, '#5a4c56');
  }
  for (const r of roses) {
    if (r.x < L - 20 || r.x > R + 20) continue;
    const look = clamp((mx - r.x) / 300, -1, 1) * smooth(k * 2);
    rose(ctx, r.x + Math.sin(time * 0.8 + r.p) * 1.2, r.y, r.r, look, 0.55 + 0.4 * (1 - k));
  }
}

// The den's door at LADON_DEN_X: a great dark way in between the roots, necks coiled across it. They draw back
// by themselves (open: 0..1) as you come near, curling up and aside
function drawDoor(ctx, k, time, me) {
  const x = LADON_DEN_X, open = smooth(clamp(((me?.x ?? 0) - (x - 560)) / 380, 0, 1));
  // the opening itself
  glow(ctx, x, GROUND - 90, 170, 130, '150,220,140', 0.12 + 0.06 * Math.sin(time * 0.9));
  ctx.fillStyle = '#050406';
  ctx.beginPath();
  ctx.moveTo(x - 110, GROUND + 4);
  ctx.bezierCurveTo(x - 120, GROUND - 230, x + 120, GROUND - 230, x + 110, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  // the root frame round it
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = i % 2 ? '#2e2228' : '#3e2c34';
    ctx.lineWidth = 22 - i * 4;
    ctx.beginPath();
    ctx.moveTo(x - 124 - i * 8, GROUND + 6);
    ctx.bezierCurveTo(x - 140 - i * 8, GROUND - 250 - i * 6, x + 140 + i * 8, GROUND - 250 - i * 6, x + 124 + i * 8, GROUND + 6);
    ctx.stroke();
  }
  // the necks across it: three thick briar coils, pulled up and aside as it opens
  for (let i = 0; i < 3; i++) {
    const side = i % 2 ? 1 : -1, y0 = GROUND - 40 - i * 55, pull = open * (120 + i * 30), sway = Math.sin(time * 0.7 + i * 2) * 5 * (1 - open);
    ctx.strokeStyle = '#141a12';
    ctx.lineWidth = 34 - i * 5;
    ctx.beginPath();
    ctx.moveTo(x - 150 * side, y0 + 20);
    ctx.bezierCurveTo(x - 40 * side, y0 - 30 - pull * 0.6 + sway, x + 60 * side - pull * side, y0 + 30 - pull + sway, x + (150 + pull * 0.4) * side, y0 - pull * 0.8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,120,74,0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let t = 0.2; t < 0.9; t += 0.2) {
      const bx = x - 150 * side + (300 + pull * 0.4) * side * t, by = y0 + 10 - (pull * 0.9 + 30) * Math.sin(t * Math.PI) * 0.8;
      thorn(ctx, bx, by - 15, -Math.PI / 2 + side * 0.3, 13, 3.6, '#cfc4ca');
    }
  }
  // a few white roses on the frame, and the road running in
  for (const [dx, dy] of [[-130, -160], [120, -120], [-90, -230], [60, -236], [140, -40]]) rose(ctx, x + dx, GROUND + dy, 6, 0, 0.9);
  ctx.fillStyle = 'rgba(120,116,110,0.5)';
  for (let j = 0; j < 3; j++) {
    ctx.beginPath();
    ctx.roundRect(x - 60 + j * 44, GROUND - 2 - j * 2, 38, 6, 3);
    ctx.fill();
  }
}

// The sign by the door: the den's name, both levels (finalTag) and a live count of slimes here. A count, never
// a lock: the line says how many are here and how many are recommended, nothing else
function drawSign(ctx, x, here, time) {
  ctx.fillStyle = '#3a2e2a';
  ctx.beginPath();
  ctx.roundRect(x - 5, GROUND - 110, 10, 112, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 120);
  ctx.rotate(Math.sin(time * 0.9) * 0.012);
  const tag = finalTag(GREEN_TOP), n = here | 0;
  ctx.font = `700 13px ${FONT}`;
  const tw = Math.max(250, ctx.measureText(tag).width + 34);
  ctx.fillStyle = '#2a2230';
  ctx.strokeStyle = '#e0526e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -46, tw, 92, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'The Root of the Road', 0, -26, 17, '#fbeef4');
  ctx.fillStyle = '#e0526e';
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 12, -10, tw - 24, 20, 10);
  ctx.fill();
  text(ctx, tag, 0, 0, 13, '#ffffff');
  const enough = n >= FINAL_MIN_PLAYERS;
  text(ctx, `${n} here, ${FINAL_MIN_PLAYERS}+ recommended`, 0, 28, 14, enough ? '#bfe8a8' : '#f4d0da');
  ctx.restore();
}

// The road through the hollow: flagstones, white petals fallen on them (fewer deeper in)
function drawFloor(ctx, L, R, k) {
  ctx.fillStyle = '#1a161c';
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  for (const f of flags) {
    if (f.x + f.w < L - 20 || f.x > R + 20) continue;
    ctx.fillStyle = '#4e4a4a';
    ctx.strokeStyle = '#242022';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(f.x, GROUND - f.lift, f.w, 14, 4);
    ctx.fill();
    ctx.stroke();
    if (f.x / ROADSEND_W < 0.75) {
      ctx.fillStyle = 'rgba(244,238,236,0.7)';
      ellipse(ctx, f.x + f.w * 0.3, GROUND + 2 - f.lift, 2.6, 1.3, f.x);
      if (f.x / ROADSEND_W < 0.4) ellipse(ctx, f.x + f.w * 0.75, GROUND + 3 - f.lift, 2.2, 1.2, -f.x);
    }
  }
}

// The way you came, knitting shut: canes grow across the west opening the deeper you are (art only)
function drawKnit(ctx, k, time) {
  const x = ROADSEND_EXIT_X, g = smooth((k - 0.15) / 0.6);
  // the opening, pale with the Sunken Road's pods far below
  glow(ctx, x, GROUND - 70, 110, 100, '190,230,170', 0.25 * (1 - g));
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const y = GROUND - 20 - i * 30, reach = 40 + g * 150;
    ctx.strokeStyle = i % 2 ? '#2a2026' : '#362830';
    ctx.lineWidth = 9 - (i % 3);
    ctx.beginPath();
    ctx.moveTo(x - 80, y + 10);
    ctx.quadraticCurveTo(x - 80 + reach * 0.5, y - 20 + Math.sin(time * 0.6 + i) * 3, x - 80 + reach, y + (i % 2 ? 14 : -10));
    ctx.stroke();
    if (g > 0.2) thorn(ctx, x - 80 + reach * 0.7, y - 6, -Math.PI / 2, 7, 2, '#5a4c54');
    if (g > 0.5 && i % 2) rose(ctx, x - 80 + reach, y + 14, 4, 0, g);
  }
}

// Over the slimes: the dark closing in from the edges, deeper the further east, and Ladon's line
export function drawRoadsEndFront(ctx, camX, viewW, time, me) {
  const k = roadsDepth(me?.x ?? 0);
  ctx.save();
  ctx.translate(camX, 0);
  const g = ctx.createRadialGradient(W / 2, H * 0.6, 120, W / 2, H * 0.6, W * 0.7);
  g.addColorStop(0, 'rgba(6,4,8,0)');
  g.addColorStop(1, `rgba(6,4,8,${0.2 + 0.5 * k})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(6,4,8,${0.12 * k})`;
  ctx.fillRect(0, 0, W, H);
  drawPetals(ctx, camX, k, time);
  drawSays(ctx, me ? me.x - camX : W / 2, time);
  ctx.restore();
}
// petals drifting down: they stop falling the deeper you are (each petal has its own depth it stops at)
function drawPetals(ctx, camX, k, time) {
  for (const m of petals) {
    if (m.k < k * 1.5) continue;
    const x = ((m.x - camX * 0.25 + Math.sin(time * 0.7 + m.p) * 24) % W + W) % W;
    const y = 30 + ((m.y + time * m.v) % 430);
    ctx.fillStyle = `rgba(250,244,244,${0.5 + 0.25 * Math.sin(time * 2 + m.p)})`;
    ellipse(ctx, x, y, m.s, m.s * 0.6, time + m.p);
  }
}
// Ladon's line: a dark bubble with pale writing, out in the dark ahead of you (screen space)
function drawSays(ctx, sx, time) {
  if (!says) return;
  const life = 6, age = time - says.at;
  if (age > life || age < 0) return void (says = null);
  ctx.save();
  ctx.globalAlpha = clamp(Math.min(age * 1.5, life - age), 0, 1);
  ctx.font = `700 15px ${FONT}`;
  const w = ctx.measureText(says.text).width + 30, h = 34;
  const x = clamp(sx + 140, 16, W - w - 16), y = 120;
  ctx.fillStyle = 'rgba(14,12,16,0.92)';
  ctx.strokeStyle = 'rgba(235,255,235,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, says.text, x + w / 2, y + h / 2 + 1, 15, '#eef8ea');
  ctx.restore();
}
