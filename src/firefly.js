// Docs: docs/places/firefly.md
// Firefly Hollow (room FIREFLY, src/shared/rpg.js; atlas Phase 8, L1): the Fen's easy pocket, down the side path off the
// Shallows' Reedbeds where the fallen willow was sawn through. A calm glade under old willows, still water like glass,
// and fireflies everywhere, thicker than anywhere else on the Fen. West to east: the Willow Gap (the sawn trunk's two
// ends either side of the path; no mobs), the Glade, the Still Pool, and the Sitting Stones (no mobs), a ring of low
// flat stones round a little peat fire where the fen folk come to sit. The high willow crook (last in FIREFLY_PLATFORMS)
// is the hidden spot: glow-worms in its bark. The sky is Wickmere's (drawFenSky, drawFenAir: src/wickmere.js); the
// water, reeds, tussocks and pads are the Shallows' (src/shallows.js).
import { H, W, TAU, mulberry32, circle, ellipse } from './util.js';
import { FIREFLY_W, FIELD_GROUND, FIREFLY_PLATFORMS, FIREFLY_ZONES, FIREFLY_RING_X } from './shared/rpg.js';
import { drawFenSky, drawFenAir } from './wickmere.js';
import { drawWater, drawReeds, drawTussock, drawPad } from './shallows.js';

const GROUND = FIELD_GROUND;
const GAP_END = FIREFLY_ZONES[0].x1;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const CROOK = FIREFLY_PLATFORMS.find((p) => p.kind === 'crook');

const willows = (() => {
  const r = mulberry32(7401);
  const out = [];
  for (let x = 160; x < FIREFLY_W; x += 260 + r() * 200) out.push({ x, w: 40 + r() * 26, h: 260 + r() * 80, p: r() * TAU });
  return out;
})();
const clumps = (() => {
  const r = mulberry32(7411);
  return Array.from({ length: 34 }, () => ({ x: 200 + r() * (FIREFLY_W - 400), h: 40 + r() * 50, n: 3 + Math.floor(r() * 5), back: r() < 0.5 }));
})();
const pads = (() => {
  const r = mulberry32(7421);
  const pool = FIREFLY_ZONES[2];
  return Array.from({ length: 30 }, () => ({ x: pool.x0 - 100 + r() * (pool.x1 - pool.x0 + 200), s: 0.7 + r() * 0.6, a: r() * TAU, bloom: r() < 0.4 }));
})();
const flies = (() => {
  const r = mulberry32(7431);
  return Array.from({ length: 140 }, () => ({ x: r() * FIREFLY_W, y: 140 + r() * 300, p: r() * TAU, v: 0.3 + r() * 0.6 }));
})();

// Everything in Firefly Hollow behind the slimes
export function drawFirefly(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawFenSky(ctx, camX, time, FIREFLY_W, { causeway: false });
  ctx.fillStyle = 'rgba(30,40,34,0.35)'; // the willows' shade, a little green
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const L = camX - 120, R = camX + viewW + 120;
  for (const wl of willows) if (visible(wl.x - 200, wl.x + 200, L, R)) drawWillow(ctx, wl, time);
  for (const c of clumps) if (c.back && visible(c.x - 30, c.x + 30, L, R)) drawReeds(ctx, c, time, true);
  drawWater(ctx, Math.max(0, L), Math.min(FIREFLY_W, R), time);
  // the pool's glassy middle: the fireflies twice, once in the water
  const pool = FIREFLY_ZONES[2];
  if (visible(pool.x0, pool.x1, L, R)) {
    ctx.fillStyle = 'rgba(214,204,232,0.08)';
    ctx.fillRect(Math.max(pool.x0, L), GROUND + 4, Math.min(pool.x1, R) - Math.max(pool.x0, L), 40);
  }
  if (visible(0, GAP_END + 60, L, R)) drawSawnTrunk(ctx);
  for (const p of FIREFLY_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'log') drawLog(ctx, p);
    else if (p.kind === 'bough') drawBough(ctx, p, time);
    else if (p.kind === 'tussock') drawTussock(ctx, p, time);
    else if (p.kind === 'crook') drawCrook(ctx, time);
  }
  if (visible(FIREFLY_RING_X - 200, FIREFLY_RING_X + 200, L, R)) drawSittingStones(ctx, time);
  for (const pd of pads) if (visible(pd.x - 20, pd.x + 20, L, R)) drawPad(ctx, pd, time);
  for (const c of clumps) if (!c.back && visible(c.x - 30, c.x + 30, L, R)) drawReeds(ctx, c, time, false);
  // the fireflies, and their lights in the still water below them
  for (const f of flies) {
    const x = f.x + Math.sin(time * f.v + f.p) * 40, y = f.y + Math.sin(time * f.v * 1.3 + f.p) * 18;
    if (x < L || x > R) continue;
    const a = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(time * 3 + f.p * 5));
    ctx.fillStyle = `rgba(230,255,160,${a * 0.25})`;
    circle(ctx, x, y, 5);
    ctx.fillStyle = `rgba(240,255,180,${a})`;
    circle(ctx, x, y, 1.6);
    if (y > GROUND - 160) {
      ctx.fillStyle = `rgba(230,255,160,${a * 0.18})`;
      ellipse(ctx, x, GROUND + (GROUND - y) * 0.2 + 6, 2.4, 1);
    }
  }
  ctx.save();
  ctx.translate(camX, 0);
  drawFenAir(ctx, camX, time);
  ctx.restore();
}

// An old willow: a short thick trunk leaning, a great weeping crown of fronds down to the water
function drawWillow(ctx, wl, time) {
  const top = GROUND - wl.h;
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.moveTo(wl.x - wl.w * 0.7, GROUND + 4);
  ctx.quadraticCurveTo(wl.x - wl.w * 0.3, GROUND - wl.h * 0.4, wl.x - wl.w * 0.2, top + 40);
  ctx.lineTo(wl.x + wl.w * 0.3, top + 40);
  ctx.quadraticCurveTo(wl.x + wl.w * 0.3, GROUND - wl.h * 0.4, wl.x + wl.w * 0.7, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(74,96,64,0.75)'; // the crown
  ellipse(ctx, wl.x, top + 30, 150, 60);
  ctx.strokeStyle = 'rgba(96,120,80,0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 26; i++) {
    const fx = wl.x - 140 + i * 11, sw = Math.sin(time * 0.6 + i + wl.p) * 5, len = 120 + ((i * 37) % 60) + (Math.abs(i - 13) < 6 ? 0 : -40);
    ctx.moveTo(fx, top + 30 + Math.abs(i - 13) * 2);
    ctx.quadraticCurveTo(fx + sw * 0.5, top + 30 + len * 0.5, fx + sw, top + 30 + len);
  }
  ctx.stroke();
}

// The Willow Gap: the great willow that came down across the side path, sawn through, its two ends pushed back
// either side of the way, the cut faces pale with rings; the path going on between
function drawSawnTrunk(ctx) {
  for (const [x, dir] of [[150, -1], [430, 1]]) {
    ctx.fillStyle = '#5a5048';
    ctx.beginPath();
    ctx.moveTo(x, GROUND - 62);
    ctx.quadraticCurveTo(x + dir * 80, GROUND - 56, x + dir * 170, GROUND - 40);
    ctx.lineTo(x + dir * 170, GROUND - 4);
    ctx.quadraticCurveTo(x + dir * 80, GROUND - 16, x, GROUND - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d8c8a8'; // the cut face, rings in it
    ctx.beginPath();
    ctx.ellipse(x, GROUND - 33, 13, 29, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(122,100,70,0.6)';
    ctx.lineWidth = 1;
    for (let r = 4; r < 28; r += 5) {
      ctx.beginPath();
      ctx.ellipse(x, GROUND - 33, r * 0.45, r, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(110,138,78,0.75)';
    for (let i = 0; i < 4; i++) ellipse(ctx, x + dir * (30 + i * 34), GROUND - 58 + i * 4, 14, 4);
  }
  ctx.fillStyle = 'rgba(232,216,184,0.6)'; // sawdust on the path
  for (let i = 0; i < 18; i++) circle(ctx, 200 + ((i * 47) % 200), GROUND - 2 + (i % 3), 1.4);
}

// a mossy log lying half in the water (a platform on its top)
function drawLog(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#4a4038';
  ctx.beginPath();
  ctx.moveTo(x - 10, GROUND);
  ctx.quadraticCurveTo(x - 6, y + 8, x + 8, y);
  ctx.lineTo(x + w - 8, y);
  ctx.quadraticCurveTo(x + w + 6, y + 8, x + w + 10, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5e5248';
  ctx.beginPath();
  ctx.roundRect(x, y - 3, w, 10, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(110,138,78,0.85)';
  for (let k = 0; k < 6; k++) ellipse(ctx, x + 12 + (k * (w - 24)) / 5, y - 2, 9, 3);
  ctx.fillStyle = '#e8e0cc'; // little pale mushrooms
  for (const fx of [0.3, 0.36, 0.72]) {
    ctx.fillRect(x + w * fx - 0.8, y - 8, 1.6, 5);
    ellipse(ctx, x + w * fx, y - 8, 3, 1.6);
  }
}

// a low willow bough reaching out over the path (a platform), fronds hanging off it
function drawBough(ctx, p, time) {
  const { x, y, w } = p;
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 40, y - 60);
  ctx.quadraticCurveTo(x, y + 6, x + w * 0.4, y + 3);
  ctx.lineTo(x + w, y + 2);
  ctx.stroke();
  ctx.strokeStyle = '#4a443c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 1);
  ctx.lineTo(x + w - 4, y - 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(96,120,80,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < w / 14; i++) {
    const fx = x + 8 + i * 14, sw = Math.sin(time * 0.7 + i) * 3;
    ctx.moveTo(fx, y + 6);
    ctx.quadraticCurveTo(fx + sw, y + 30, fx + sw * 1.5, y + 50 + (i % 3) * 12);
  }
  ctx.stroke();
}

// The high willow crook: the fork of the oldest willow's trunk, a hollow at the back of it full of glow-worms, green
// lights in the dark like a second sky. Nobody comes up here; you have to climb the bough first
function drawCrook(ctx, time) {
  const { x, y, w } = CROOK;
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 4);
  ctx.quadraticCurveTo(x + w / 2, y + 30, x + w + 10, y + 4);
  ctx.lineTo(x + w + 30, y - 40);
  ctx.lineTo(x + w + 4, y - 4);
  ctx.lineTo(x - 4, y - 4);
  ctx.lineTo(x - 26, y - 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a443c';
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#141210'; // the hollow
  ellipse(ctx, x + w / 2, y + 16, 26, 10);
  for (let i = 0; i < 16; i++) {
    const a = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * 1.4 + i * 1.9));
    ctx.fillStyle = `rgba(170,255,200,${a})`;
    circle(ctx, x + w / 2 - 22 + ((i * 29) % 44), y + 10 + ((i * 13) % 12), 1.1);
  }
}

// The Sitting Stones: a ring of low flat stones round a little peat fire, worn smooth on top, a lantern hung on a
// willow stake. The fen folk come here to sit with the dead and say nothing much
function drawSittingStones(ctx, time) {
  const x = FIREFLY_RING_X, b = GROUND;
  // the stake and its lantern
  ctx.fillStyle = '#4a4058';
  ctx.fillRect(x + 150, b - 110, 6, 110);
  ctx.fillRect(x + 140, b - 110, 26, 4);
  ctx.fillStyle = 'rgba(255,214,150,0.28)';
  circle(ctx, x + 162, b - 92, 16);
  ctx.fillStyle = '#ffe2a8';
  ctx.fillRect(x + 158, b - 102, 8, 12);
  // the fire, very small, very old
  const fl = Math.sin(time * 9) * 1.5;
  ctx.fillStyle = 'rgba(255,170,90,0.25)';
  circle(ctx, x, b - 10, 26);
  ctx.fillStyle = '#3a2c22';
  ellipse(ctx, x, b - 2, 18, 5);
  ctx.fillStyle = '#ff9a4a';
  ctx.beginPath();
  ctx.moveTo(x - 7, b - 3);
  ctx.quadraticCurveTo(x - 2 + fl, b - 22, x, b - 26 - fl);
  ctx.quadraticCurveTo(x + 2 - fl, b - 20, x + 7, b - 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe2a8';
  ellipse(ctx, x, b - 8, 3, 6);
  ctx.fillStyle = 'rgba(214,204,232,0.25)'; // a thread of smoke
  for (let i = 0; i < 4; i++) circle(ctx, x + Math.sin(time + i) * 6, b - 34 - i * 16 - ((time * 10) % 16), 4 + i);
  // the stones, in a ring (back ones smaller)
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.3, sx = x + Math.cos(a) * 110, back = Math.sin(a) < 0, sy = b - 2 + Math.sin(a) * 6;
    ctx.fillStyle = back ? '#6a6878' : '#8a8898';
    ctx.strokeStyle = '#3e3c48';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(sx - 20, sy - (back ? 14 : 18), 40, back ? 14 : 18, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; // worn smooth on top
    ellipse(ctx, sx, sy - (back ? 13 : 17), 14, 2);
  }
}
