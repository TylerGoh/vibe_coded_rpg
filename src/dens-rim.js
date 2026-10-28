// Docs: docs/combat/bosses.md, docs/places/rim.md
// The Caldera Rim's party den (the Bearer's Hoist, room BRENNA_DEN), its way in at the rim's highest point (a cleft
// in the crest rock under the old hoist frame, BRENNA_DEN_X; the frame itself is src/rim.js), and Brenna, the Last
// Bearer herself: a forge-slime grown round the last gear-tooth she holds up to the city going over, the straps
// still across her, a shard caught in the tooth. Her story: story/characters/bosses.md. Tier 3 by showing only (a
// tooth, a wheel, a city): no words here name what the tooth was for.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must NOT
// import dens.js: the few helpers it needs are copied below. The shared boss effects take her theme ('hoist': FXPAL in
// dens.js). Two looks of her own that dens.js hands over by theme: Last Delivery (the `wave` ult: HOIST_ULT, the
// tooth rolled end to end of the den, toothMass) and her freeing (drawBrennaFreed, run from the den's bossDie: she
// lowers the tooth and sets it down; the den keeps it on the floor until she's back).
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, DENS, MOBS, FIELD_GROUND, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
export const BRENNA_FREED_S = 7; // how long the freeing plays (the den's bossDie lasts this long)
const BAS = '#3a3438', BAS_D = '#221e22', BAS_L = '#5a5258';
const IRON = '#6e6870', IRON_D = '#34303a', IRON_L = '#9a94a0';
const STRAP = '#4a3428', STRAP_L = '#6e5040';
const HOIST_X = DEN_W - 190; // the old hoist at the den's far end, its hook hanging empty over the crater
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);
const ease = (k) => 1 - (1 - k) ** 3;

// ——— small helpers (copies of the ones in dens.js) ———
function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.9, 0.35, 0.35); // src/glow.js
}
const gradCache = new WeakMap();
function vgrad(ctx, key, y0, y1, stops) {
  let c = gradCache.get(ctx);
  if (!c) gradCache.set(ctx, (c = {}));
  if (!c[key]) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [k, col] of stops) g.addColorStop(k, col);
    c[key] = g;
  }
  return c[key];
}

// The gear-tooth itself: a great wedge of dark forge iron, wide at its root, a bolt-hole through it, the root's
// edge worn bright, and the shard caught in its face (a cold glint). Centred on its middle, root down; s: its height.
export function drawTooth(ctx, s, t = 0, shard = true) {
  const wb = s * 0.82, wt = s * 0.5;
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = Math.max(1.5, s * 0.04);
  ctx.beginPath();
  ctx.moveTo(-wb / 2, s / 2);
  ctx.lineTo(-wt / 2, -s / 2 + s * 0.08);
  ctx.quadraticCurveTo(-wt / 2, -s / 2, -wt / 2 + s * 0.08, -s / 2);
  ctx.lineTo(wt / 2 - s * 0.08, -s / 2);
  ctx.quadraticCurveTo(wt / 2, -s / 2, wt / 2, -s / 2 + s * 0.08);
  ctx.lineTo(wb / 2, s / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; // the light down one face
  ctx.beginPath();
  ctx.moveTo(-wb / 2 + s * 0.08, s / 2 - 2);
  ctx.lineTo(-wt / 2 + s * 0.06, -s / 2 + s * 0.1);
  ctx.lineTo(-wt / 2 + s * 0.16, -s / 2 + s * 0.1);
  ctx.lineTo(-wb / 2 + s * 0.22, s / 2 - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = IRON_L; // the root's edge, worn bright
  ctx.fillRect(-wb / 2 + 2, s / 2 - s * 0.06, wb - 4, s * 0.05);
  ctx.fillStyle = IRON_D; // the bolt-hole
  circle(ctx, 0, s * 0.18, s * 0.07);
  if (shard) {
    const p = 0.6 + 0.4 * Math.sin(t * 2.2);
    glow(ctx, s * 0.04, -s * 0.12, s * 0.22, s * 0.22, '210,232,255', 0.45 * p);
    ctx.fillStyle = '#eef6ff';
    ctx.strokeStyle = '#7a8cb0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(s * 0.04, -s * 0.22);
    ctx.lineTo(s * 0.09, -s * 0.12);
    ctx.lineTo(s * 0.04, -s * 0.02);
    ctx.lineTo(-s * 0.01, -s * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

// Freed: the den keeps the tooth set down on the floor until she's back (set from drawBrennaFreed)
let freedPending = null, freedAt = -1e9, freedX = DEN_W / 2;

// ——— the den: the rim's very top, open to the sky, the crater beyond, the old hoist at the far end ———
const clouds = (() => {
  const r = mulberry32(6201);
  return Array.from({ length: 7 }, (_, i) => ({ x: i * 240 + r() * 120, y: 30 + r() * 70, w: 120 + r() * 120, v: 6 + r() * 6 }));
})();
const grit = (() => {
  const r = mulberry32(6203);
  return Array.from({ length: 140 }, () => ({ x: r() * DEN_W, y: GROUND + 4 + r() * 60, p: r() * TAU, glass: r() < 0.5 }));
})();

function drawDenHoist(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  if (freedPending !== null) (freedX = freedPending), (freedPending = null), (freedAt = time);
  const setDown = time - freedAt < BOSS_RESPAWN_MS / 1000;
  ctx.save();
  // a slate sky, torn wind clouds going over fast
  ctx.fillStyle = vgrad(ctx, 'bg-hoist', 0, GROUND, [[0, '#3e3e4c'], [0.5, '#6a6874'], [0.85, '#9a8e88'], [1, '#b0a094']]);
  ctx.fillRect(L, 0, R - L, H);
  ctx.fillStyle = 'rgba(48,46,58,0.4)';
  for (const c of clouds) {
    const x = ((c.x + time * c.v) % (DEN_W + 400)) - 200;
    if (visible(x - c.w, x + c.w, L, R)) ellipse(ctx, x, c.y, c.w, 16);
  }
  drawCitadel(ctx, time, L, R);
  // the crater beyond: the far rim, its walls falling away, the lake far down, the vent's glow and the column
  ctx.fillStyle = '#4a4248';
  ctx.beginPath();
  ctx.moveTo(L, GROUND - 150);
  for (let x = Math.floor(L / 60) * 60; x <= R + 60; x += 60) ctx.lineTo(x, GROUND - 150 - 14 * Math.sin(x * 0.004) - 8 * Math.sin(x * 0.013));
  ctx.lineTo(R + 60, GROUND - 60);
  ctx.lineTo(L, GROUND - 60);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5ab4b0'; // the lake
  ellipse(ctx, 520, GROUND - 74, 260, 10);
  glow(ctx, 980, GROUND - 82, 110, 34, '255,130,60', 0.55 + 0.15 * Math.sin(time * 1.7));
  ctx.fillStyle = 'rgba(120,110,112,0.55)'; // the column, rolling up
  for (let i = 0; i < 6; i++) {
    const k = ((time * 0.05 + i / 6) % 1);
    ellipse(ctx, 980 + Math.sin(k * 5 + i) * 30, GROUND - 90 - k * 420, 40 + k * 70, 30 + k * 30);
  }
  // the floor: basalt, grit and black glass, and the ring worn into it where she has turned in place
  ctx.fillStyle = vgrad(ctx, 'floor-hoist', GROUND, H, [[0, BAS_L], [0.3, BAS], [1, BAS_D]]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  for (const s of grit) {
    if (s.x < L || s.x > R) continue;
    ctx.fillStyle = s.glass ? `rgba(170,170,200,${0.25 + 0.2 * Math.sin(time * 2 + s.p)})` : 'rgba(200,190,180,0.35)';
    ctx.fillRect(s.x, s.y, 1.8, 1.4);
  }
  ctx.strokeStyle = 'rgba(30,26,30,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(DEN_W / 2, GROUND + 14, 120, 8, 0, 0, TAU);
  ctx.stroke();
  if (visible(HOIST_X - 160, HOIST_X + 220, L, R)) drawBigHoist(ctx, time);
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? "The Bearer's Hoist", 750, time);
  DEN_PLATFORMS.forEach((p) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawLedge(ctx, p));
  if (setDown && visible(freedX - 80, freedX + 80, L, R)) {
    ctx.save();
    ctx.translate(freedX, GROUND - 38);
    drawTooth(ctx, 80, time, false);
    ctx.restore();
  }
  ctx.restore();
}

// The city going over, close: a dark island underneath, towers, lit windows, a ring of light round its spire
function drawCitadel(ctx, time, L, R) {
  const k = (time % 140) / 140, cx = DEN_W + 400 - k * (DEN_W + 800), cy = 74 + Math.sin(time * 0.3) * 4, s = 1.5;
  if (!visible(cx - 140, cx + 140, L, R)) return;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#5a5470';
  ctx.beginPath();
  ctx.moveTo(cx - 70 * s, cy);
  ctx.quadraticCurveTo(cx - 30 * s, cy + 30 * s, cx, cy + 66 * s);
  ctx.quadraticCurveTo(cx + 30 * s, cy + 30 * s, cx + 70 * s, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a84a4';
  for (const [dx, h, w] of [[-40, 20, 12], [-20, 36, 11], [0, 56, 13], [20, 30, 11], [40, 18, 12]]) {
    ctx.beginPath();
    ctx.roundRect(cx + (dx - w / 2) * s, cy - h * s, w * s, h * s + 1, [3 * s, 3 * s, 0, 0]);
    ctx.fill();
  }
  ctx.fillStyle = '#9a94b4';
  ellipse(ctx, cx, cy, 72 * s, 6 * s);
  ctx.fillStyle = 'rgba(255,244,200,0.75)';
  for (const [dx, dy] of [[-22, -22], [-4, -40], [0, -24], [20, -18]]) circle(ctx, cx + dx * s, cy + dy * s, 1.6 * s);
  ctx.strokeStyle = 'rgba(255,240,190,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 64 * s, 8 * s, 8 * s * Math.abs(Math.cos(time * 0.4)) + 1, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// The old hoist at the far end: two great iron legs, a beam out over the crater's edge, its pulley whole up here,
// a chain down off it and the hook at its end hanging empty, swinging in the wind
function drawBigHoist(ctx, time) {
  const x = HOIST_X, top = GROUND - 330;
  ctx.strokeStyle = IRON_D;
  ctx.lineCap = 'round';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(x - 110, GROUND + 2);
  ctx.lineTo(x - 24, top);
  ctx.moveTo(x + 70, GROUND + 2);
  ctx.lineTo(x + 10, top);
  ctx.stroke();
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x - 76, GROUND - 130);
  ctx.lineTo(x + 44, GROUND - 130);
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.roundRect(x - 60, top - 12, 260, 16, 4);
  ctx.fill();
  ctx.strokeStyle = IRON;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x + 170, top + 22, 22, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  circle(ctx, x + 170, top + 22, 5);
  // the chain and the empty hook, swinging
  const sway = Math.sin(time * 0.8) * 0.06;
  ctx.save();
  ctx.translate(x + 192, top + 22);
  ctx.rotate(sway);
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 6 + i * 10, i % 2 ? 2 : 3.4, 5.5, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(-8, 186, 12, -0.2, Math.PI * 1.1);
  ctx.stroke();
  ctx.restore();
}

function drawExit(ctx) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '220,214,220', 0.35);
  ctx.fillStyle = BAS_D;
  ctx.beginPath();
  ctx.moveTo(x - 44, b + 2);
  ctx.lineTo(x - 30, b - 120);
  ctx.lineTo(x + 30, b - 120);
  ctx.lineTo(x + 44, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(200,196,206,0.3)'; // the rim's daylight through the cleft
  ellipse(ctx, x, b - 50, 22, 44);
  text(ctx, 'OUT', x, b - 150, 13, '#f4f0ec');
}

// The name, punched into an iron plate hung off a length of old strap
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 70);
  ctx.rotate(Math.sin(time * 0.9) * 0.02);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50);
  ctx.strokeStyle = STRAP;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-tw / 2 + 16, -70);
  ctx.lineTo(-tw / 2 + 16, -18);
  ctx.moveTo(tw / 2 - 16, -70);
  ctx.lineTo(tw / 2 - 16, -18);
  ctx.stroke();
  ctx.fillStyle = '#7a747e';
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 44, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  for (const dx of [-tw / 2 + 10, tw / 2 - 10]) for (const dy of [-12, 16]) circle(ctx, dx, dy, 2);
  text(ctx, name, 0, 2, 18, '#1e1a20');
  ctx.restore();
}

// The ledges: slabs of the rim's basalt, grit on top
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = BAS;
  ctx.strokeStyle = BAS_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 14, y + 26);
  ctx.lineTo(x + 18, y + 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BAS_L;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 8, 4);
  ctx.fill();
}

export const DEN_ART = { hoist: drawDenHoist };

// ——— the way in at the rim's highest point (feet at groundY; the old hoist frame behind it is src/rim.js) ———
// A narrow cleft up through the crest rock between the frame's legs, the wind streaming out of it, a frayed strap
// knotted round one leg and flapping. Far up past the cleft, small against the sky, something stands quite still
// with a block held up over it.
function drawEntranceHoist(ctx, x, groundY, time) {
  const den = Math.max(0, DENS.findIndex((d) => d.theme === 'hoist'));
  const spec = MOBS[DENS[den]?.boss];
  const b = groundY;
  ctx.save();
  // the shape up there, still, against the sky
  ctx.fillStyle = 'rgba(34,30,36,0.85)';
  ellipse(ctx, x - 6, b - 170, 13, 11);
  ctx.save();
  ctx.translate(x - 6, b - 194);
  ctx.scale(0.3, 0.3);
  ctx.fillStyle = 'rgba(34,30,36,0.9)';
  ctx.beginPath();
  ctx.moveTo(-34, 40);
  ctx.lineTo(-20, -40);
  ctx.lineTo(20, -40);
  ctx.lineTo(34, 40);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // the cleft
  ctx.fillStyle = BAS;
  ctx.beginPath();
  ctx.moveTo(x - 80, b + 2);
  ctx.lineTo(x - 54, b - 118);
  ctx.lineTo(x + 54, b - 118);
  ctx.lineTo(x + 80, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#141016';
  ctx.beginPath();
  ctx.moveTo(x - 34, b + 2);
  ctx.lineTo(x - 18, b - 112);
  ctx.lineTo(x + 18, b - 112);
  ctx.lineTo(x + 34, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(200,196,206,0.18)';
  ellipse(ctx, x, b - 96, 10, 14);
  // grit streaming out of it on the wind
  for (let i = 0; i < 8; i++) {
    const k = (time * 0.7 + i / 8) % 1;
    ctx.fillStyle = `rgba(210,200,190,${0.4 * (1 - k)})`;
    ctx.fillRect(x + 20 + k * 120, b - 30 - i * 9 - k * 10, 6 + k * 10, 1.4);
  }
  // the strap knotted round the frame's leg, flapping
  ctx.strokeStyle = STRAP;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 66, b - 90);
  ctx.quadraticCurveTo(x + 86, b - 92 + Math.sin(time * 7) * 6, x + 104, b - 84 + Math.sin(time * 7 + 1) * 9);
  ctx.stroke();
  ctx.fillStyle = IRON_L;
  ctx.fillRect(x + 62, b - 94, 7, 8);
  // the warning sign on a post (the way in to a boss): an iron plate on a stake
  const sx = x + 150;
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(sx - 4, b - 86, 8, 88, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(sx, b - 76);
  ctx.rotate(Math.sin(time * 1.6) * 0.03 + 0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const name = spec?.name ?? 'Boss';
  const tw = Math.max(92, ctx.measureText(name).width + 24);
  ctx.fillStyle = '#7a747e';
  ctx.strokeStyle = '#2e2a32';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -16, tw, 52, 10);
  ctx.fill();
  ctx.stroke();
  const pulse = 0.5 + 0.5 * Math.sin(time * 4);
  ctx.fillStyle = mix('#e0565a', '#ff7a6a', pulse);
  ctx.strokeStyle = '#a83a44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-26, -27, 52, 20, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'BOSS', 0, -16.5, 13, '#fffaf0');
  text(ctx, name, 0, 8, 13, '#fffaf0');
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-22, 18, 44, 14, 7);
  ctx.fill();
  text(ctx, `Lv ${spec?.lvl ?? '?'}`, 0, 25.5, 11, '#2e2a32');
  ctx.restore();
  ctx.restore();
}

export const ENTRANCE_ART = { hoist: drawEntranceHoist };

// ——— Brenna (ctx, w, h, st) => sil, origin at her feet, +x = facing ———
// A forge-slime, dark and dense, ember-flecked, her wobble stiff; grown up round the root of a great iron gear-tooth
// she holds up over her, iron streaked through her jelly where she has grown into it. Two old carrying straps run
// from the tooth down over her and cross on her back at an iron buckle (where `weak.back` puts the weak point). Her
// eyes are turned up, at the sky. m.warn: she heaves the tooth higher · charging: she leans in under it
const FLECKS = (() => {
  const r = mulberry32(6211);
  return Array.from({ length: 16 }, () => ({ x: r() * 1.4 - 0.7, y: 0.1 + r() * 0.7, p: r() * TAU }));
})();
function drawBrenna(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const live = dying < 0.02;
  const breathe = Math.sin(t * 1.1 + seed) * 0.012; // (stiff: a forge-slime barely wobbles)
  const lean = charging ? 0.1 : warn ? -0.04 : 0;
  const lift = warn ? h * 0.08 : 0, ts = h * 0.62, ty = -h * 0.9 - ts * 0.42 - lift;
  const body = () => {
    ctx.moveTo(-w * 0.46, -2);
    ctx.bezierCurveTo(-w * 0.54, -h * (0.7 + breathe), -w * 0.3, -h * (0.96 + breathe), -w * 0.14, -h * 0.92);
    ctx.lineTo(w * 0.14, -h * 0.92);
    ctx.bezierCurveTo(w * 0.3, -h * (0.96 + breathe), w * 0.52, -h * (0.7 + breathe), w * 0.44, -2);
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    body();
  };
  ctx.save();
  ctx.translate(0, -h * 0.4);
  ctx.rotate(lean);
  ctx.translate(0, h * 0.4);
  // the tooth, held up over her
  ctx.save();
  ctx.translate(0, ty);
  ctx.rotate(Math.sin(t * 0.7 + seed) * 0.015);
  drawTooth(ctx, ts, t, live);
  ctx.restore();
  // the body: dark forge jelly, ember flecks, iron streaks up into the tooth's root
  const g = ctx.createLinearGradient(0, -h * 0.95, 0, 0);
  g.addColorStop(0, rageCol('#4a4048', enr, 0.2));
  g.addColorStop(1, rageCol('#241c22', enr, 0.2));
  ctx.fillStyle = g;
  ctx.strokeStyle = '#120e12';
  ctx.lineWidth = 4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(150,144,156,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const dx of [-0.12, 0, 0.12]) {
    ctx.moveTo(w * dx, -h * 0.92);
    ctx.quadraticCurveTo(w * dx * 1.6, -h * 0.75, w * dx * 2.2, -h * 0.58);
  }
  ctx.stroke();
  for (const f of FLECKS) {
    const a = 0.45 + 0.4 * Math.sin(t * 2 + f.p);
    ctx.fillStyle = `rgba(255,${130 + Math.round(40 * a)},60,${live ? a : a * 0.3})`;
    circle(ctx, f.x * w * 0.55, -f.y * h * 0.85, 1.8);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ellipse(ctx, -w * 0.22, -h * 0.62, w * 0.06, h * 0.12, -0.3);
  // the straps: from the tooth's root down over her front, and crossing on her back at the buckle
  ctx.strokeStyle = STRAP;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  const bx = -w * 0.4, by = -h * 0.36; // (the buckle: MOBS.brenna.weak)
  ctx.beginPath();
  ctx.moveTo(-w * 0.16, -h * 0.9);
  ctx.quadraticCurveTo(-w * 0.44, -h * 0.66, bx, by);
  ctx.moveTo(w * 0.16, -h * 0.9);
  ctx.quadraticCurveTo(w * 0.1, -h * 0.5, bx, by);
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(-w * 0.1, -h * 0.14, w * 0.36, -h * 0.2);
  ctx.stroke();
  ctx.strokeStyle = STRAP_L;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, -h * 0.86);
  ctx.quadraticCurveTo(-w * 0.42, -h * 0.64, bx + 2, by - 3);
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bx - 9, by - 8, 18, 16, 3);
  ctx.fill();
  ctx.stroke();
  // the face, on her front: tired eyes turned up at the sky
  const ex = w * 0.14, ey = -h * 0.58;
  for (const dx of [-w * 0.075, w * 0.075]) {
    if (live) {
      ctx.fillStyle = '#f4e8dc';
      ellipse(ctx, ex + dx, ey, 5.5, warn ? 4 : 6);
      ctx.fillStyle = '#1a1418';
      circle(ctx, ex + dx + 0.5, ey - (warn ? 1 : 2.6), 3);
      ctx.fillStyle = '#ffffff';
      circle(ctx, ex + dx + 1.6, ey - 3.6, 1);
      ctx.strokeStyle = '#120e12';
      ctx.lineWidth = 2.4;
      ctx.beginPath(); // heavy lids
      ctx.moveTo(ex + dx - 6.5, ey - 4);
      ctx.lineTo(ex + dx + 6.5, ey - 5);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#f4e8dc';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(ex + dx, ey - 1, 4, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = 'rgba(244,232,220,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ex - 6, ey + 16);
  ctx.lineTo(ex + 6, ey + 16);
  ctx.stroke();
  // grit on the wind off her
  const pk = (t * 0.4 + seed) % 1;
  if (live && pk < 0.4) {
    const k = pk / 0.4;
    ctx.fillStyle = `rgba(210,200,190,${0.5 * (1 - k)})`;
    ctx.fillRect(-w * 0.5 - k * 40, -h * 0.5 - k * 12, 6, 1.4);
    ctx.fillRect(-w * 0.5 - k * 60, -h * 0.7 - k * 8, 4, 1.2);
  }
  ctx.restore();
  return sil;
}

export const BOSS_ART = { brenna: drawBrenna };

// ——— Last Delivery: the `wave` ult as the tooth rolled end to end of the den (jump it) ———
// The tooth tumbling end over end along the floor, grit and sparks thrown off where its corners bite, a scraped
// track behind it. hh: its height (the shared wave's 66 px at full)
function toothMass(ctx, fx, dir, hh, time) {
  const y = GROUND + 2, s = hh * 1.05;
  ctx.strokeStyle = 'rgba(255,170,100,0.5)'; // the scraped track
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fx - dir * 260, y - 1);
  ctx.lineTo(fx, y - 1);
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,190,180,0.5)';
  for (let i = 0; i < 6; i++) {
    const j = (time * 3 + i * 0.17) % 1;
    circle(ctx, fx - dir * (20 + j * 90), y - 6 - j * 26 + i * 2, 3 + j * 6);
  }
  ctx.fillStyle = 'rgba(255,190,110,0.95)'; // sparks where it bites
  for (let i = 0; i < 5; i++) {
    const j = (time * 5 + i * 0.23) % 1;
    circle(ctx, fx + dir * (10 - j * 40), y - 4 - j * 30 * (1 - j) * 3, 1.6);
  }
  glow(ctx, fx, y - s * 0.5, s, s * 0.8, '255,150,80', 0.25);
  ctx.save();
  ctx.translate(fx, y - s * 0.5);
  ctx.rotate(dir * (fx / (s * 0.7)));
  drawTooth(ctx, s, time, true);
  ctx.restore();
}
const HOIST_ULT = {
  waveWarn(ctx, e, k) {
    const { x0, dir } = e, y = GROUND;
    const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 14 * k));
    ctx.fillStyle = `rgba(255,110,90,${0.1 + 0.12 * pulse})`; // the lane it will roll down
    ctx.fillRect(-20, y - 70, DEN_W + 40, 72);
    ctx.strokeStyle = `rgba(255,246,236,${0.3 + 0.3 * pulse})`;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 10; i++) {
      const p = (i / 10 + e.t * 0.4) % 1;
      const cx = dir > 0 ? x0 + p * (DEN_W - x0) : x0 - p * x0;
      ctx.beginPath();
      ctx.moveTo(cx - dir * 10, y - 48);
      ctx.lineTo(cx + dir * 4, y - 36);
      ctx.lineTo(cx - dir * 10, y - 24);
      ctx.stroke();
    }
    // the tooth heaved up off its root, rocking, about to go
    const hh = 66 * ease(k);
    if (hh > 2) {
      ctx.save();
      ctx.translate(x0 + dir * 40, y - hh * 0.55);
      ctx.rotate(dir * (0.15 + 0.1 * Math.sin(e.t * 9)) * ease(k));
      drawTooth(ctx, hh * 1.05, e.t, true);
      ctx.restore();
    }
    glow(ctx, x0, y - 40, 120, 80, '255,90,60', 0.25 + 0.3 * pulse);
  },
  waveGo(ctx, e) {
    toothMass(ctx, e.x0 + e.dir * e.speed * e.t, e.dir, 66, e.t);
  },
};
export const ULT_LOOKS = { hoist: HOIST_ULT };

// ——— freed: she lowers the tooth, slowly, and sets it down (the den's bossDie, BRENNA_FREED_S long) ———
export function drawBrennaFreed(ctx, e) {
  const tt = e.t, x = e.x ?? DEN_W / 2, s = 80;
  const k = clamp((tt - 0.6) / 4, 0, 1), down = k * k * (3 - 2 * k);
  const y = mix0(GROUND - 230, GROUND - 38, down);
  if (k < 1) {
    // her shape under it, going still and thin
    ctx.fillStyle = `rgba(36,28,34,${0.55 * (1 - k)})`;
    ellipse(ctx, x, GROUND - 60, 60, 60);
  } else {
    freedPending = x; // (set down: the den keeps it on the floor till she's back)
    const j = clamp((tt - 4.6) / 1.2, 0, 1);
    if (j < 1) {
      ctx.fillStyle = `rgba(200,190,180,${0.6 * (1 - j)})`;
      for (let i = 0; i < 6; i++) circle(ctx, x + (i - 2.5) * 22 * (0.5 + j), GROUND - 6 - j * 18, 8 + j * 12);
    }
  }
  ctx.save();
  ctx.translate(x, y);
  drawTooth(ctx, s, tt, k < 1);
  ctx.restore();
}
const mix0 = (a, b, k) => a + (b - a) * k;
