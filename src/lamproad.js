// Docs: docs/places/peatbarrows.md
// The Lamp Road (room LAMPROAD, data in src/shared/rpg.js): the approach to the Wickmother's den. No mobs and no combat;
// everything that makes it what it is is drawn here (and heard: the `lamproad` music scene, given roadDepth by
// src/main.js), never step() and never a cutscene. The way the fen folk carried their dead's lanterns up into the Hall of
// Lamps from below: a stair of roots climbing landing by landing (the flight you came up is drawn in the wall behind
// you), under a roof of moth-silk strung with lanterns, every one lit, each with its paper name tag turning in a
// draught. How far east YOU are (roadDepth: 0 at the way in, 1 at the den's door) sets everything: the lanterns
// thicken, the silk comes lower and brighter, and across it a huge shadow walks (the Wickmother, on the Hall's roof
// above, backlit by the lanterns), bigger and slower the higher you are; past EYES_X two great eyes of lamplight look
// down through the silk and follow you. Her wings beat slowly (WING_S): with each beat the lanterns sway, the silk
// bellies and the dust comes down. The silk draws closed behind you over the way back (art only: the door back always
// works). At the east end the Hall's inner door: a curtain of moth-silk across a doorway in the willow's root, moths
// asleep on it, breathing with her wings and holding (until the den is there: WICK_DOOR_OPEN, then it parts by itself as
// you come near), with a sign beside it: both levels (finalTag) and a live count of slimes on the road. Her one line
// (WICK_LINE, sent by the server: say) is a bubble out of the light overhead.
import { W, H, TAU, mulberry32, circle, clamp } from './util.js';
import { LAMPROAD_EXIT_X, WICK_DEN_X, WICK_DEN, WICK_DEN_NAME, FEN_TOP, FINAL_MIN_PLAYERS, finalTag, FIELD_GROUND, DENS } from './shared/rpg.js';
import { glow as softGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
const PEAT = '#2a1e18', PEAT_D = '#140e0a', ROOT = '#4a3a2e', ROOT_D = '#2a2018', BARK = '#8a8478', BARK_D = '#4e4a44';
const SILK = [214, 206, 222];
const LAMP = '255,206,130';
// the door parts only once the den has its DENS row (L5 (c)); without it, it breathes with her wings and holds
const WICK_DOOR_OPEN = DENS.some((d) => d.room === WICK_DEN);

// 0 at the way in, 1 at the den's door: how far up the road a slime at x is
export const roadDepth = (x) => clamp((x - 260) / (WICK_DEN_X - 460), 0, 1);

function text(ctx, str, x, y, size, color, align = 'center', weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function mixc(a, b, k, al = 1) {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * k));
  return al === 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${al})`;
}

// ——— seeded scenery ———
const R0 = mulberry32(8301);
const LANDING_W = 330; // one landing: a flight of root steps up, then a landing
const LANDINGS = Array.from({ length: Math.floor((WICK_DEN_X - 300) / LANDING_W) }, (_, i) => 300 + i * LANDING_W);
const WING_S = 7.5; // one slow beat of her wings, overhead
// how far into a wingbeat it is: 0 at rest, 1 at the downstroke (the silk bellies, the lanterns swing, dust comes down)
export const wingBeat = (time) => {
  const c = (time % WING_S) / WING_S;
  return c < 0.5 ? 0 : Math.sin(((c - 0.5) / 0.5) * Math.PI);
};
// the eyes: through the silk over the last landing, opening as you come under them
const EYES_X = WICK_DEN_X - 420;
// the lanterns strung under the silk: x, how far down they hang, which depth they show from (more the higher you go)
const LAMPS = Array.from({ length: 150 }, () => ({ x: 120 + R0() * (WICK_DEN_X - 60), drop: 20 + R0() * 70, from: R0(), p: R0() * TAU, s: 0.7 + R0() * 0.5, tag: R0() < 0.85 }));
const dust = Array.from({ length: 80 }, () => ({ x: R0() * W, y: R0() * 430, v: 6 + R0() * 10, p: R0() * TAU, s: 0.8 + R0() * 1.2, k: R0() }));

let lastT = null, eyeOpen = 0, nearK = 0;
let says = null; // her line: { text, at }
export function say(text, time) {
  says = { text, at: time };
}

// Everything behind the slimes. me: our own state (null when offline), here: slimes in the room (us included)
export function drawLampRoad(ctx, camX, viewW, time, me, here) {
  const mx = me?.x ?? 0, k = roadDepth(mx), dt = lastT === null ? 0 : clamp(time - lastT, 0, 0.1), b = wingBeat(time);
  lastT = time;
  eyeOpen += ((mx > EYES_X - 140 ? 1 : 0) - eyeOpen) * Math.min(1, dt * 0.6);
  nearK += (smooth(clamp((mx - (WICK_DEN_X - 520)) / 360, 0, 1)) - nearK) * Math.min(1, dt * 1.5);
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.translate(camX, 0);
  drawBack(ctx, k, b);
  ctx.restore();
  drawWall(ctx, L, R, k);
  for (const x of LANDINGS) if (x + 40 > L && x - 240 < R) drawFlight(ctx, x, k);
  drawSilk(ctx, camX, L, R, k, b, time, me ? me.x : camX + W / 2);
  drawDoor(ctx, nearK, b, time);
  if (Math.abs(WICK_DEN_X - 260 - camX - viewW / 2) < viewW / 2 + 160) drawSign(ctx, WICK_DEN_X - 260, here, time);
  drawFloor(ctx, Math.max(0, L), R);
  if (LAMPROAD_EXIT_X + 360 > L) drawWayDown(ctx, k);
}

// The dark behind the roots, warming toward violet-gold the higher you go (the Hall's light coming down)
function drawBack(ctx, k, b) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, mixc([20, 14, 20], [58, 44, 52], k));
  g.addColorStop(1, mixc([16, 10, 8], [36, 24, 20], k));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  glow(ctx, W / 2, 60, W * 0.8, 160, LAMP, 0.06 + 0.14 * k + 0.04 * b);
}

// The walls: a tangle of great willow roots, the peat packed between them
function drawWall(ctx, L, R, k) {
  const top = 120 + 60 * smooth(k);
  ctx.fillStyle = PEAT_D;
  ctx.fillRect(L, top, R - L, GROUND - top);
  ctx.lineCap = 'round';
  for (let x = Math.floor(L / 90) * 90; x < R + 90; x += 90) {
    const h = (x * 13) % 7, w = 10 + h * 2;
    ctx.strokeStyle = h % 2 ? ROOT_D : ROOT;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, top - 10);
    ctx.bezierCurveTo(x + 30, top + 60, x - 20 - h * 4, GROUND - 120, x + 18, GROUND);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150,130,110,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.25, top - 6);
    ctx.bezierCurveTo(x + 26 - w * 0.25, top + 60, x - 22 - h * 4, GROUND - 120, x + 14, GROUND - 4);
    ctx.stroke();
  }
}

// The flight up to each landing: root steps climbing in the wall behind you, a lantern left on the top one
function drawFlight(ctx, x, k) {
  const y0 = GROUND - 8, y1 = GROUND - 150;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.moveTo(x - 230, y0);
  ctx.lineTo(x - 20, y1);
  ctx.lineTo(x - 20, y1 + 14);
  ctx.lineTo(x - 230, y0 + 14);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 7; i++) {
    const u = i / 7, px = x - 230 + 210 * u, py = y0 + (y1 - y0) * u;
    ctx.fillStyle = i % 2 ? ROOT : '#5a4838';
    ctx.beginPath();
    ctx.roundRect(px, py - 6, 34, 10, 5);
    ctx.fill();
  }
  // the lantern somebody left on the top step on their way up
  const lx = x - 26, ly = y1 - 14;
  glow(ctx, lx, ly, 40, 32, LAMP, 0.35 + 0.2 * k);
  ctx.fillStyle = '#3a2c20';
  ctx.fillRect(lx - 6, ly - 8, 12, 14);
  ctx.fillStyle = '#ffe0a0';
  ctx.fillRect(lx - 4, ly - 6, 8, 10);
}

// The roof of moth-silk with the lanterns strung under it, and her shadow walking across it overhead
function drawSilk(ctx, camX, L, R, k, b, time, meX) {
  const y = 70 + 100 * smooth(k) + 6 * b; // (it comes lower the higher you go, and bellies on each wingbeat)
  // the silk sheet: pale, thin, lit from above
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(L, 0);
  ctx.lineTo(L, y);
  for (let x = Math.floor(L / 140) * 140; x <= R + 140; x += 140) ctx.quadraticCurveTo(x + 70, y + 26 + 8 * b, x + 140, y);
  ctx.lineTo(R + 140, 0);
  ctx.closePath();
  ctx.fillStyle = mixc([60, 52, 62], SILK, 0.25 + 0.45 * k, 0.95);
  ctx.fill();
  ctx.clip();
  // light behind it, and her shadow on it: a great moth walking slowly across the Hall's roof above (parallax, slower
  // than the road), wings opening and closing, bigger the higher you are
  glow(ctx, camX + W / 2, y - 40, W * 0.7, 90, LAMP, 0.25 + 0.3 * k);
  const sh = smooth((k - 0.15) / 0.45);
  if (sh > 0.01) {
    const sx = camX + W / 2 + Math.sin(time * 0.05) * 360 + (camX - 1200) * -0.25, sy = y - 30, s = 0.8 + 1.1 * k, open = 0.55 + 0.45 * b;
    ctx.fillStyle = `rgba(30,22,30,${0.55 * sh})`;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(sx + d * 120 * s * open, sy - 10 * s, 140 * s * open, 70 * s, d * 0.25, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sx + d * 80 * s * open, sy + 40 * s, 80 * s * open, 46 * s, -d * 0.4, 0, TAU);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(sx, sy, 26 * s, 80 * s, 0, 0, TAU);
    ctx.fill();
  }
  // the threads of the weave
  ctx.strokeStyle = 'rgba(255,250,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.floor(L / 23) * 23; x < R; x += 23) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 14, y + 20);
  }
  ctx.stroke();
  ctx.restore();
  // her eyes: two great eyes of lamplight looking down through the silk over the last landing, following you
  if (eyeOpen > 0.02) {
    for (const d of [-1, 1]) {
      const ex = EYES_X + d * 110, ey = y - 18;
      if (ex < L - 120 || ex > R + 120) continue;
      const look = clamp((meX - ex) / 400, -1, 1), o = eyeOpen;
      glow(ctx, ex, ey, 120, 60, LAMP, 0.5 * o);
      ctx.fillStyle = `rgba(255,236,190,${0.75 * o})`;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 54, Math.max(0.5, 26 * o), 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(30,18,26,${0.85 * o})`;
      ctx.beginPath();
      ctx.ellipse(ex + look * 18, ey + 2, 26, Math.max(0.4, 22 * o), 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(255,220,160,${0.8 * o})`; // a light moving in them
      circle(ctx, ex + look * 18 - 8, ey - 6, 4);
    }
  }
  // the lanterns: on strings under the silk, more of them the higher you go, swinging on each wingbeat, tags turning
  for (const l of LAMPS) {
    if (l.from > 0.25 + 0.85 * k || l.x < L - 30 || l.x > R + 30) continue;
    const sw = Math.sin(time * 0.8 + l.p) * 0.05 + 0.08 * b * Math.sin(time * 2 + l.p), len = l.drop * (0.6 + 0.4 * k);
    const lx = l.x + Math.sin(sw) * len, ly = y + 10 + Math.cos(sw) * len;
    ctx.strokeStyle = 'rgba(200,190,200,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(l.x, y + 10);
    ctx.lineTo(lx, ly - 8 * l.s);
    ctx.stroke();
    glow(ctx, lx, ly, 26 * l.s, 22 * l.s, LAMP, 0.4);
    ctx.fillStyle = '#3a2c22';
    ctx.beginPath();
    ctx.roundRect(lx - 5 * l.s, ly - 8 * l.s, 10 * l.s, 14 * l.s, 2);
    ctx.fill();
    ctx.fillStyle = '#ffe2a6';
    ctx.fillRect(lx - 3.5 * l.s, ly - 6 * l.s, 7 * l.s, 9 * l.s);
    if (l.tag) {
      // the name tag on its string, turning
      const turn = Math.cos(time * 1.4 + l.p * 3), tx = lx + 3 * l.s, ty = ly + 10 * l.s;
      ctx.strokeStyle = 'rgba(200,190,200,0.5)';
      ctx.beginPath();
      ctx.moveTo(lx, ly + 6 * l.s);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = turn > 0 ? '#efe4d0' : '#cfc2ae';
      ctx.fillRect(tx - 5 * l.s * Math.abs(turn), ty, 10 * l.s * Math.abs(turn) + 0.5, 6 * l.s);
    }
  }
}

// The floor: packed peat over the roots, the stair's landings worn smooth
function drawFloor(ctx, L, R) {
  ctx.fillStyle = PEAT;
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = '#3a2a20';
  ctx.fillRect(L, GROUND, R - L, 4);
  ctx.strokeStyle = ROOT_D;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let x = Math.floor(L / 170) * 170; x < R; x += 170) {
    ctx.moveTo(x, GROUND + 14);
    ctx.quadraticCurveTo(x + 60, GROUND + 30, x + 130, GROUND + 18);
  }
  ctx.stroke();
}

// The way back down: the Peat Barrows' dark at the foot of the stair, hidden by the silk the higher you are (art only)
function drawWayDown(ctx, k) {
  glow(ctx, LAMPROAD_EXIT_X, GROUND - 80, 110, 100, '200,160,110', 0.16 * (1 - smooth(k * 1.5)));
}

// The Hall's inner door at the top of the road: a tall pointed doorway in the great willow's root, grey bark round it,
// and a curtain of moth-silk across it with moths asleep on it, light moving behind. Until the den is there it breathes
// with her wings (bellying in on the downstroke) and holds. With the den (WICK_DOOR_OPEN) it parts to both sides by itself
// as you come near (near: 0..1)
function drawDoor(ctx, near, b, time) {
  const x = WICK_DEN_X, top = GROUND - 270;
  const arch = (pad) => {
    ctx.beginPath();
    ctx.moveTo(x - 90 - pad, GROUND + 2);
    ctx.lineTo(x - 90 - pad, top + 110);
    ctx.quadraticCurveTo(x - 80 - pad, top - pad, x, top - 40 - pad);
    ctx.quadraticCurveTo(x + 80 + pad, top - pad, x + 90 + pad, top + 110);
    ctx.lineTo(x + 90 + pad, GROUND + 2);
    ctx.closePath();
  };
  // the root round it: grey willow bark, ribbed
  ctx.fillStyle = BARK_D;
  arch(46);
  ctx.fill();
  ctx.fillStyle = BARK;
  arch(30);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,36,32,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -4; i <= 4; i++) {
    ctx.moveTo(x + i * 26, top - 50 + Math.abs(i) * 10);
    ctx.lineTo(x + i * 30, GROUND);
  }
  ctx.stroke();
  ctx.fillStyle = '#1a1218';
  arch(0);
  ctx.fill();
  const open = WICK_DOOR_OPEN ? near : 0;
  // the Hall's light behind it
  glow(ctx, x, GROUND - 120, 140, 150, LAMP, (WICK_DOOR_OPEN ? 0.25 + 0.45 * open : 0.18) + 0.1 * b);
  // the curtain: two halves of silk, parting to the sides as it opens; bellying in on each wingbeat
  ctx.save();
  arch(-2);
  ctx.clip();
  for (const d of [-1, 1]) {
    const edge = x + d * (2 + 86 * open), belly = 10 * b * (1 - open);
    ctx.beginPath();
    ctx.moveTo(x + d * 92, top - 50);
    ctx.lineTo(edge, top - 50);
    ctx.quadraticCurveTo(edge - d * belly, (top + GROUND) / 2, edge + d * 6 * open, GROUND + 2);
    ctx.lineTo(x + d * 92, GROUND + 2);
    ctx.closePath();
    ctx.fillStyle = mixc([150, 142, 160], SILK, 0.6, 0.92);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 6; i++) {
      const fx = x + d * (8 + i * 15) * (0.2 + 0.8 * (1 - open) + 0.8 * open * 1.0);
      ctx.moveTo(fx, top - 40);
      ctx.quadraticCurveTo(fx - d * belly * 0.6, (top + GROUND) / 2, fx, GROUND);
    }
    ctx.stroke();
  }
  // light showing through the weave where it's thinnest
  glow(ctx, x, GROUND - 130, 60, 110, LAMP, 0.18 + 0.12 * b);
  ctx.restore();
  // the moths asleep on it, wings folded, stirring on a wingbeat
  if (open < 0.7) {
    for (const [mx, my] of [[-44, 70], [30, 120], [-16, 170], [52, 200], [-60, 220], [10, 40]]) {
      const px = x + mx * (1 + open), py = top + my, st = b * Math.sin(time * 9 + mx) * 0.3;
      ctx.fillStyle = 'rgba(110,98,104,0.95)';
      ctx.beginPath();
      ctx.moveTo(px, py - 6);
      ctx.lineTo(px - 7 - st * 6, py + 6);
      ctx.lineTo(px, py + 3);
      ctx.lineTo(px + 7 + st * 6, py + 6);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// The sign by the door: the den's name, both levels (finalTag) and a live count of slimes here. A count, never a lock
function drawSign(ctx, x, here, time) {
  ctx.fillStyle = ROOT_D;
  ctx.beginPath();
  ctx.roundRect(x - 5, GROUND - 110, 10, 112, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 120);
  ctx.rotate(Math.sin(time * 0.7) * 0.012);
  const tag = finalTag(FEN_TOP), n = here | 0;
  ctx.font = `700 13px ${FONT}`;
  const tw = Math.max(250, ctx.measureText(tag).width + 34);
  ctx.fillStyle = '#2a2230';
  ctx.strokeStyle = '#e0526e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -46, tw, 92, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,220,240,0.35)'; // a strand of silk caught along its top
  ctx.fillRect(-tw / 2 + 14, -47, tw - 28, 2);
  text(ctx, WICK_DEN_NAME, 0, -26, 17, '#fff4e8');
  ctx.fillStyle = '#e0526e';
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 12, -10, tw - 24, 20, 10);
  ctx.fill();
  text(ctx, tag, 0, 0, 13, '#ffffff');
  const enough = n >= FINAL_MIN_PLAYERS;
  text(ctx, `${n} here, ${FINAL_MIN_PLAYERS}+ recommended`, 0, 28, 14, enough ? '#ffe0b0' : '#f4d0da');
  ctx.restore();
}

// Over the slimes: a soft dark at the edges, the wing-dust coming down thicker the higher you are (silver in the lamp
// light, a flurry on each wingbeat), the silk drawing closed behind you, and her line
export function drawLampRoadFront(ctx, camX, viewW, time, me) {
  const k = roadDepth(me?.x ?? 0), b = wingBeat(time);
  ctx.save();
  ctx.translate(camX, 0);
  const g = ctx.createRadialGradient(W / 2, H * 0.55, 120, W / 2, H * 0.55, W * 0.7);
  g.addColorStop(0, 'rgba(10,6,10,0)');
  g.addColorStop(1, `rgba(10,6,10,${0.55 - 0.2 * k})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (const d of dust) {
    if (d.k > 0.35 + k) continue;
    const x = ((d.x - camX * 0.3 + Math.sin(time * 0.5 + d.p) * 18) % W + W) % W;
    const y = ((d.y + time * d.v * (1 + 1.5 * b)) % 450) + 10;
    ctx.fillStyle = `rgba(236,228,244,${0.35 + 0.35 * k})`;
    circle(ctx, x, y, d.s);
  }
  // the silk closing behind you: pale strands drawn across the way back (art only)
  const hk = smooth((k - 0.1) / 0.6);
  if (hk > 0.01) {
    const hg = ctx.createLinearGradient(0, 0, W * 0.4, 0);
    hg.addColorStop(0, `rgba(190,180,200,${0.6 * hk})`);
    hg.addColorStop(1, 'rgba(190,180,200,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W * 0.4, H);
    ctx.strokeStyle = `rgba(240,234,248,${0.3 * hk})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const y = 40 + i * 52;
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(W * 0.18, y + 30 + Math.sin(time * 0.4 + i) * 8, W * 0.36 * hk, y + 8);
    }
    ctx.stroke();
  }
  drawSays(ctx, me ? me.x - camX : W / 2, time);
  ctx.restore();
}
// Her line: a dark violet bubble with lamplit writing, coming down out of the light overhead (screen space)
function drawSays(ctx, sx, time) {
  if (!says) return;
  const life = 7, age = time - says.at;
  if (age > life || age < 0) return void (says = null);
  ctx.save();
  ctx.globalAlpha = clamp(Math.min(age * 1.2, life - age), 0, 1);
  ctx.font = `700 15px ${FONT}`;
  const w = ctx.measureText(says.text).width + 30, h = 34;
  const x = clamp(sx + 100 - w / 2, 16, W - w - 16), y = 120;
  ctx.fillStyle = 'rgba(28,18,32,0.92)';
  ctx.strokeStyle = 'rgba(255,214,150,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, says.text, x + w / 2, y + h / 2 + 1, 15, '#ffeccc');
  ctx.restore();
}
