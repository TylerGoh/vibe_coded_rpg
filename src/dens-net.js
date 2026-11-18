// Docs: docs/combat/bosses.md, docs/places/saltflats.md
// The Salt Flats' boss den (the Dry Harbour, atlas Phase 9 A2), its way in at the Harbour Mouth (a gap in the old
// breakwater with nets hung over it like a curtain, steps going down into the dry harbour, and now and then a pale shape
// going by behind the nets), and the Netwife herself: a great sand spider crusted white with salt, as big as a boat, mending
// the fleet's nets in the harbour where the fleet used to come home. A shard in her back. The plan: story/phase9-plan.md.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must NOT import
// dens.js: the few helpers it needs are copied below. The shared boss effects take its theme ('nets': FXPAL in dens.js).
// Her ultimate, The Last Haul, is the shared `wave` ult drawn as a great net hauled the length of the harbour (ULT_LOOKS:
// jump it or get up on a ledge). Her freeing (drawNetFreed, run from the den's bossDie): the nets lift off their poles on
// the wind and go up and away over the harbour wall, and she folds her legs and rests.
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, FIELD_GROUND, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';
import { drawSunk } from './challenge.js';

const GROUND = FIELD_GROUND;
export const NET_FREED_S = 7; // how long the freeing plays (the den's bossDie lasts this long)
const SALT = '#f6f2ea', SALT_D = '#cfc6b4', SALT_S = '#a89c86';
const BODY = '#d8bc96', BODY_D = '#9a7a56', BODY_L = '#f0dcbc';
const TWINE = 'rgba(214,196,150,0.85)', TWINE_D = '#8a7a5a';
const STONE = '#c8b898', STONE_D = '#8a7a5c';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);

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
function ease(k) {
  return k * k * (3 - 2 * k);
}
// a stretch of net between (x0, y0) and (x1, y1), `drop` deep, its mesh as hanging drops and a few rows across
function net(ctx, x0, y0, x1, y1, drop, sway, a = 1) {
  ctx.strokeStyle = `rgba(214,196,150,${0.85 * a})`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + drop * 0.25 + sway, x1, y1);
  ctx.stroke();
  ctx.strokeStyle = `rgba(214,196,150,${0.5 * a})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const n = Math.max(4, Math.round(Math.abs(x1 - x0) / 18));
  for (let k = 0; k <= n; k++) {
    const t = k / n, s = Math.sin(t * Math.PI);
    const hx = x0 + (x1 - x0) * t, hy = y0 + (y1 - y0) * t + s * (drop * 0.25 + sway);
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + sway * 0.5, hy + drop * (0.6 + 0.4 * s));
  }
  for (let j = 1; j < 4; j++) {
    const dy = j * drop * 0.24;
    ctx.moveTo(x0, y0 + dy);
    ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + dy + drop * 0.4 + sway, x1, y1 + dy);
  }
  ctx.stroke();
  ctx.fillStyle = `rgba(240,232,214,${a})`; // floats on the head-rope
  for (let k = 1; k < 5; k++) {
    const t = k / 5;
    circle(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * (drop * 0.25 + sway) + 2, 3);
  }
}

// Freed: the nets are gone off the poles and the harbour is quiet, until she's back
let freedPending = false, freedAt = -1e9;

// ——— the den: the old harbour basin, dried out, seen from its floor: the quay walls of dressed stone all round with a salt
// line high up and iron rings, the sky over it, two of the fleet lying on their sides in the silt, and overhead the
// Netwife's rigging, poles and lines across the basin hung with nets drying, everywhere ———
const POLES = [90, 330, 560, 760, 960, 1180, 1410];
const BOATS = [{ x: 260, len: 260, dir: 1 }, { x: 1240, len: 300, dir: -1 }];
const cracks = (() => {
  const r = mulberry32(9711);
  return Array.from({ length: 50 }, () => ({ x: r() * DEN_W, y: GROUND + 8 + r() * 70, w: 30 + r() * 50, a: (r() - 0.5) * 0.5 }));
})();

function drawDenNet(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  if (freedPending) (freedPending = false), (freedAt = time);
  const freed = time - freedAt < BOSS_RESPAWN_MS / 1000;
  ctx.save();
  // the sky over the harbour, hot and pale, and the quay walls going up to it
  ctx.fillStyle = vgrad(ctx, 'bg-net', 0, GROUND, [[0, '#3a78c0'], [0.25, '#9ac8e8'], [0.32, '#f2e8d4'], [1, '#e0d4bc']]);
  ctx.fillRect(L, 0, R - L, H);
  ctx.fillStyle = 'rgba(255,252,236,0.85)';
  circle(ctx, DEN_W * 0.7, 36, 16);
  glow(ctx, DEN_W * 0.7, 36, 140, 80, '255,250,226', 0.45);
  // the far quay wall, across the basin
  ctx.fillStyle = STONE;
  ctx.fillRect(L, 140, R - L, GROUND - 140);
  ctx.strokeStyle = 'rgba(138,122,92,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = 164; y < GROUND; y += 28) {
    ctx.moveTo(L, y);
    ctx.lineTo(R, y);
  }
  for (let x = Math.floor(L / 70) * 70; x < R; x += 70) {
    for (let y = 136; y < GROUND; y += 56) {
      ctx.moveTo(x, y + 28);
      ctx.lineTo(x, y + 56);
      ctx.moveTo(x + 35, y);
      ctx.lineTo(x + 35, y + 28);
    }
  }
  ctx.stroke();
  ctx.fillStyle = '#ddd0b4'; // the quay's coping
  ctx.fillRect(L, 132, R - L, 12);
  ctx.fillStyle = 'rgba(246,242,234,0.85)'; // the salt line, high up, where the water stood
  ctx.fillRect(L, 214, R - L, 6);
  ctx.strokeStyle = '#6a5a4a'; // iron mooring rings far over your head
  ctx.lineWidth = 3;
  for (let x = 140; x < DEN_W; x += 260) {
    if (!visible(x - 10, x + 10, L, R)) continue;
    ctx.beginPath();
    ctx.arc(x, 186, 9, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200,190,170,0.6)'; // weed dried white down the wall
  for (let x = 60; x < DEN_W; x += 110) if (visible(x - 10, x + 10, L, R)) ellipse(ctx, x, 236 + (x % 3) * 8, 5, 14);
  // two of the fleet lying in the silt of the basin
  for (const b of BOATS) if (visible(b.x - b.len, b.x + b.len, L, R)) drawLyingBoat(ctx, b);
  // the floor: grey-white silt crazed into plates, shells in it
  ctx.fillStyle = vgrad(ctx, 'floor-net', GROUND, H, [[0, '#e8e0d0'], [0.4, '#c8bca4'], [1, '#8a7c66']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = '#f6f2ea';
  ctx.fillRect(L, GROUND - 4, R - L, 6);
  ctx.strokeStyle = 'rgba(138,122,96,0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const c of cracks) {
    if (!visible(c.x, c.x + c.w, L, R)) continue;
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + c.w * Math.cos(c.a), c.y + c.w * Math.sin(c.a) * 0.3);
  }
  ctx.stroke();
  // her rigging: poles round the basin, lines across, nets hung on them (gone, once she's freed)
  for (const x of POLES) {
    if (!visible(x - 10, x + 10, L, R)) continue;
    ctx.fillStyle = '#8a7258';
    ctx.fillRect(x - 4, 60, 8, GROUND - 60);
    ctx.fillStyle = SALT_D;
    ctx.fillRect(x - 6, 56, 12, 6);
  }
  if (!freed) {
    for (let i = 0; i < POLES.length - 1; i++) {
      const a = POLES[i], b = POLES[i + 1];
      if (!visible(a, b, L, R)) continue;
      net(ctx, a, 70 + (i % 2) * 20, b, 70 + ((i + 1) % 2) * 20, 110 + (i % 3) * 30, Math.sin(time * 0.8 + i) * 4);
    }
  } else {
    ctx.strokeStyle = 'rgba(138,114,88,0.6)'; // the bare lines
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < POLES.length - 1; i++) {
      ctx.moveTo(POLES[i], 70 + (i % 2) * 20);
      ctx.quadraticCurveTo((POLES[i] + POLES[i + 1]) / 2, 100, POLES[i + 1], 70 + ((i + 1) % 2) * 20);
    }
    ctx.stroke();
  }
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Dry Harbour', 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawSunk(ctx, p, i, () => drawLedge(ctx, p))); // (drawSunk: a boss's moving arena, src/challenge.js)
  ctx.restore();
}

// a boat lying on its side in the basin, bleached, a band of old paint
function drawLyingBoat(ctx, b) {
  const { x, len, dir } = b;
  ctx.save();
  ctx.translate(x, GROUND - 2);
  ctx.scale(dir, 1);
  ctx.fillStyle = '#a89070';
  ctx.strokeStyle = '#7a5e44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.quadraticCurveTo(-len * 0.5, -len * 0.34, 0, -len * 0.4);
  ctx.quadraticCurveTo(len * 0.4, -len * 0.4, len * 0.56, -len * 0.16);
  ctx.quadraticCurveTo(len * 0.5, -4, len * 0.4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(62,106,138,0.55)';
  ctx.fillRect(-len * 0.46, -len * 0.28, len, len * 0.05);
  ctx.fillStyle = 'rgba(246,242,234,0.7)';
  ctx.fillRect(-len * 0.48, -len * 0.12, len * 1.02, 4);
  ctx.restore();
}

function drawExit(ctx) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '255,250,236', 0.35);
  ctx.fillStyle = '#e8e0d0'; // the harbour steps going up the quay wall
  ctx.beginPath();
  ctx.moveTo(x - 40, b + 2);
  ctx.lineTo(x - 36, b - 120);
  ctx.lineTo(x + 36, b - 120);
  ctx.lineTo(x + 40, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(138,122,92,0.6)';
  for (let i = 0; i < 7; i++) ctx.fillRect(x - 36 + i * 2, b - 14 - i * 16, 72 - i * 4, 4);
  text(ctx, 'OUT', x, b - 150, 13, '#4a3a2a');
}

// The name, painted on a boat's board hung on two lines from her rigging
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 96);
  ctx.rotate(Math.sin(time * 0.5) * 0.015);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50);
  ctx.strokeStyle = TWINE_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const sx of [-tw / 2 + 18, tw / 2 - 18]) {
    ctx.moveTo(sx, -40);
    ctx.lineTo(sx, -18);
  }
  ctx.stroke();
  ctx.fillStyle = '#c8aa82';
  ctx.strokeStyle = '#7a5e44';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 44, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(62,106,138,0.7)';
  ctx.fillRect(-tw / 2 + 6, 14, tw - 12, 5);
  text(ctx, name, 0, 1, 18, '#3a2a1a');
  ctx.restore();
}

// The ledges: upturned boats laid on trestles in the basin, keels up
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.strokeStyle = '#7a5e44';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const bx of [x + 24, x + w - 24]) {
    ctx.moveTo(bx - 14, GROUND);
    ctx.lineTo(bx, y + 10);
    ctx.lineTo(bx + 14, GROUND);
  }
  ctx.stroke();
  ctx.fillStyle = '#b89a76';
  ctx.strokeStyle = '#7a5e44';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 16);
  ctx.quadraticCurveTo(x + w / 2, y - 14, x + w + 6, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d8c2a0';
  ctx.beginPath();
  ctx.roundRect(x + 4, y - 4, w - 8, 6, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(246,242,234,0.75)';
  ellipse(ctx, x + w * 0.3, y + 6, w * 0.16, 3);
}

export const DEN_ART = { nets: drawDenNet };

// ——— the way in at the Salt Flats' Harbour Mouth (feet at groundY) ———
// A gap in the old breakwater, steps going down into the dry harbour, and over it nets hung like a curtain from a spar,
// salt-stiff, stirring; now and then a pale long-legged shape going by behind them
function drawEntranceNet(ctx, x, groundY, time) {
  const b = groundY;
  ctx.save();
  ctx.fillStyle = '#3a3026'; // the gap in the breakwater
  ctx.beginPath();
  ctx.moveTo(x - 60, b);
  ctx.lineTo(x - 60, b - 130);
  ctx.lineTo(x + 60, b - 130);
  ctx.lineTo(x + 60, b);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c8bca4'; // the harbour steps' top going down
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 1 - i * 0.2;
    ctx.fillRect(x - 50 + i * 6, b - 10 - i * 8, 100 - i * 12, 4);
  }
  ctx.globalAlpha = 1;
  const k = (time * 0.1) % 1; // the pale shape going by behind the nets
  if (k < 0.3) {
    const sx = x - 70 + (k / 0.3) * 140;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 60, b - 130, 120, 130);
    ctx.clip();
    ctx.fillStyle = 'rgba(232,220,196,0.5)';
    ellipse(ctx, sx, b - 70, 40, 22);
    ctx.strokeStyle = 'rgba(232,220,196,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const lx = sx - 30 + i * 20;
      ctx.moveTo(lx, b - 70);
      ctx.lineTo(lx + (i < 2 ? -14 : 14), b - 100);
      ctx.lineTo(lx + (i < 2 ? -24 : 24), b - 2);
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#8a7258'; // the spar the nets hang from, its ends on the wall
  ctx.fillRect(x - 76, b - 140, 152, 8);
  net(ctx, x - 70, b - 134, x + 70, b - 134, 120, Math.sin(time * 0.9) * 5);
  ctx.fillStyle = 'rgba(246,242,234,0.9)'; // salt along the spar
  for (let i = 0; i < 8; i++) ctx.fillRect(x - 70 + i * 19, b - 142, 3, 3);
  ctx.restore();
}
export const ENTRANCE_ART = { nets: drawEntranceNet };

// ——— the Netwife (ctx, w, h, st) => sil, origin at her feet on the floor, +x = facing ———
// A great sand spider as big as a boat, pale sand-gold crusted white with salt, a broad rounded abdomen behind (where the
// shard glints in the salt on her back: `weak`), a smaller head and body in front with a cluster of soft dark eyes, eight
// long jointed legs. Her two front legs hold a netting needle and a fold of net she's mending. m.warn: she rears, her front
// legs and the needle up; charging: legs going fast, salt dust off the floor.
function drawNetwife(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying, walking } = st;
  const live = dying < 0.02;
  const step = walking || charging ? Math.sin(t * (charging ? 18 : 7)) : 0;
  const body = rageCol(BODY, enr, 0.2), bodyL = rageCol(BODY_L, enr, 0.15);
  const rear = warn ? 1 : 0;
  const ax = -w * 0.16, ay = -h * 0.58; // the abdomen's middle
  const cx = w * 0.16, cy = -h * 0.5 - rear * h * 0.08; // the head-body's middle
  const sil = () => {
    ctx.beginPath();
    ctx.ellipse(ax, ay, w * 0.26, h * 0.32, 0, 0, TAU);
    ctx.moveTo(cx + w * 0.14, cy);
    ctx.ellipse(cx, cy, w * 0.14, h * 0.18, 0, 0, TAU);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(60,50,40,0.22)';
  ellipse(ctx, 0, 0, w * 0.5, 7);
  // the legs: eight, long and jointed, four a side (the far side's drawn darker, behind)
  const leg = (bx, by, kx, ky, fx, col, lw) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(kx, ky);
    ctx.lineTo(fx, -2);
    ctx.stroke();
  };
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const LEGS = [[-0.34, -0.7, 1], [-0.12, -0.4, -1], [0.1, 0.12, 1], [0.26, 0.42, -1]]; // [knee x, foot x, phase]
  for (const [kx, fx, ph] of LEGS) leg(cx - w * 0.06, cy + h * 0.06, w * kx - 8, -h * 0.92 + step * ph * 6, w * fx - 6 + step * ph * 10, BODY_D, 7);
  for (const [kx, fx, ph] of LEGS) {
    leg(cx - w * 0.02, cy + h * 0.1, w * kx + 10, -h * 0.84 - step * ph * 6, w * fx + 12 - step * ph * 10, rageCol('#c8a882', enr, 0.2), 8);
  }
  ctx.strokeStyle = 'rgba(246,242,234,0.8)'; // salt crusted on the knees
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const [kx] of LEGS) {
    ctx.moveTo(w * kx + 4, -h * 0.86);
    ctx.lineTo(w * kx + 14, -h * 0.84);
  }
  ctx.stroke();
  // the abdomen: broad and round, banded, crusted white across the top
  const g = ctx.createRadialGradient(ax - w * 0.08, ay - h * 0.14, 4, ax, ay, w * 0.3);
  g.addColorStop(0, bodyL);
  g.addColorStop(0.6, body);
  g.addColorStop(1, BODY_D);
  ctx.fillStyle = g;
  ctx.strokeStyle = BODY_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(ax, ay, w * 0.26, h * 0.32, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(ax, ay, w * 0.26, h * 0.32, 0, 0, TAU);
  ctx.clip();
  ctx.strokeStyle = 'rgba(154,122,86,0.45)'; // bands
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo(ax + i * w * 0.08 - 8, ay - h * 0.34);
    ctx.quadraticCurveTo(ax + i * w * 0.1, ay, ax + i * w * 0.08 - 8, ay + h * 0.34);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(246,242,234,0.88)'; // the salt on her back
  ellipse(ctx, ax - w * 0.02, ay - h * 0.24, w * 0.22, h * 0.12);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 16; i++) {
    const a = Math.sin(seed * 9 + i * 41.3) * 9e3, b2 = Math.sin(seed * 5 + i * 17.7) * 7e3;
    const fx = ax - w * 0.2 + (a - Math.floor(a)) * w * 0.4, fy = ay - h * 0.34 + (b2 - Math.floor(b2)) * h * 0.2, s = 1.6 + ((a * 3) % 1) * 2;
    ctx.fillRect(fx, fy, s, s);
  }
  ctx.restore();
  // the spinnerets and a trailing line of twine
  ctx.strokeStyle = TWINE;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(ax - w * 0.26, ay + h * 0.06);
  ctx.quadraticCurveTo(ax - w * 0.36, ay + h * 0.3, ax - w * 0.42, -2);
  ctx.stroke();
  // the shard, glinting in the salt on her back (the weak point)
  const sx = -w * 0.16, sy = -h * 0.74;
  if (live) glow(ctx, sx, sy, 30, 30, '200,240,255', 0.35 + 0.25 * Math.sin(t * 3));
  ctx.fillStyle = '#e8f6ff';
  ctx.strokeStyle = '#6a9ac8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 12);
  ctx.lineTo(sx + 7, sy);
  ctx.lineTo(sx, sy + 9);
  ctx.lineTo(sx - 6, sy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the head-body: smaller, in front, rearing on a warning
  const hg = ctx.createRadialGradient(cx - 6, cy - 10, 2, cx, cy, w * 0.16);
  hg.addColorStop(0, bodyL);
  hg.addColorStop(1, body);
  ctx.fillStyle = hg;
  ctx.strokeStyle = BODY_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.14, h * 0.18, -rear * 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(246,242,234,0.8)';
  ellipse(ctx, cx - 4, cy - h * 0.12, w * 0.08, h * 0.05);
  // her eyes: a cluster of soft dark ones, two big and four small, kind and very tired
  const ex = cx + w * 0.08, ey = cy - h * 0.06;
  ctx.fillStyle = live ? (enr ? '#5a1e1a' : '#2a2430') : '#8a8078';
  circle(ctx, ex, ey, 6);
  circle(ctx, ex + 12, ey + 2, 5);
  for (const [dx, dy] of [[-8, -9], [4, -11], [16, -8], [22, 2]]) circle(ctx, ex + dx, ey + dy, 2.4);
  if (live) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    circle(ctx, ex + 1.6, ey - 2, 1.8);
    circle(ctx, ex + 13.4, ey, 1.5);
  }
  // her front legs and the needle and the net she's mending, held up on a warning
  const hx = cx + w * 0.22, hy = cy + h * 0.04 - rear * h * 0.3;
  ctx.strokeStyle = rageCol('#c8a882', enr, 0.2);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.08, cy + h * 0.08);
  ctx.quadraticCurveTo(cx + w * 0.22, cy - h * 0.06 - rear * h * 0.2, hx, hy);
  ctx.moveTo(cx + w * 0.06, cy + h * 0.12);
  ctx.quadraticCurveTo(cx + w * 0.24, cy + h * 0.1 - rear * h * 0.1, hx + 6, hy + 18);
  ctx.stroke();
  net(ctx, hx - 4, hy + 4, hx + 30, hy + 10, 34, Math.sin(t * 2) * 2);
  ctx.save(); // the netting needle, bone white
  ctx.translate(hx + 2, hy);
  ctx.rotate(-0.8 - rear * 0.6 + Math.sin(t * 4) * (walking || charging ? 0 : 0.15));
  ctx.fillStyle = SALT;
  ctx.strokeStyle = SALT_S;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, 0);
  ctx.lineTo(-3, -30);
  ctx.quadraticCurveTo(0, -38, 3, -30);
  ctx.lineTo(3, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (charging) { // salt dust off the floor
    ctx.fillStyle = 'rgba(240,234,220,0.6)';
    for (let i = 0; i < 6; i++) ellipse(ctx, -w * 0.5 - i * 16, -6 - (i % 2) * 8, 18 - i * 2, 8 - i);
  }
  ctx.restore();
  return sil;
}
export const BOSS_ART = { netwife: drawNetwife };

// ——— The Last Haul: the `wave` ult drawn as a great net hauled the length of the harbour (jump it, or get up on a ledge) ———
const NET_ULT = {
  waveWarn(ctx, e, k) {
    const { x0, dir } = e, y = GROUND;
    const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 14 * k));
    ctx.fillStyle = `rgba(240,232,214,${0.08 + 0.12 * pulse})`; // the lane it will sweep, the silt trembling
    ctx.fillRect(-20, y - 140, DEN_W + 40, 142);
    ctx.strokeStyle = `rgba(214,196,150,${0.3 + 0.4 * k})`; // the haul-lines going taut down the harbour
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y - 120 * ease(k));
    ctx.lineTo(dir > 0 ? DEN_W + 20 : -20, y - 130);
    ctx.moveTo(x0, y - 4);
    ctx.lineTo(dir > 0 ? DEN_W + 20 : -20, y - 6);
    ctx.stroke();
    // the net gathered up, rising off the floor as she takes up the slack
    const ht = 130 * ease(k);
    net(ctx, x0 - dir * 30, y - ht, x0 + dir * 30, y - ht, ht, Math.sin(e.t * 6) * 3 * k);
  },
  waveGo(ctx, e) {
    const x = e.x0 + e.dir * e.speed * e.t, top = GROUND - 136;
    ctx.fillStyle = 'rgba(240,234,220,0.55)'; // salt dust kicked up before it
    for (let i = 0; i < 6; i++) ellipse(ctx, x + e.dir * (20 + i * 18), GROUND - 8 - (i % 2) * 8, 20 - i * 2, 8 - i);
    ctx.strokeStyle = 'rgba(214,196,150,0.9)'; // the net, a wall of mesh, its floats along the top and its sinkers along the floor
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const yy = top + (i * (GROUND - top)) / 6;
      ctx.moveTo(x - e.dir * 70, yy + 6);
      ctx.quadraticCurveTo(x - e.dir * 20, yy - 8, x, yy);
    }
    for (let j = 0; j < 5; j++) {
      const xx = x - e.dir * j * 16;
      ctx.moveTo(xx, top + j * 2);
      ctx.lineTo(xx - e.dir * 4, GROUND);
    }
    ctx.stroke();
    ctx.fillStyle = '#f0e8d6';
    for (let j = 0; j < 5; j++) circle(ctx, x - e.dir * j * 16, top + j * 2 - 2, 4);
    ctx.fillStyle = '#6a5a4a';
    for (let j = 0; j < 5; j++) circle(ctx, x - e.dir * j * 16 - e.dir * 4, GROUND - 3, 3);
  },
};
export const ULT_LOOKS = { nets: NET_ULT };

// ——— freed: the nets lift off their poles on the wind and go up and away over the harbour wall; she folds her legs and
// rests (the den's bossDie, NET_FREED_S long) ———
const FLY = (() => {
  const r = mulberry32(9719);
  return Array.from({ length: 6 }, (_, i) => ({ x: POLES[i] + 60 + r() * 60, d: 0.3 + r() * 0.8, v: 0.7 + r() * 0.5, s: (r() - 0.5) * 2 }));
})();
export function drawNetFreed(ctx, e) {
  const tt = e.t;
  if (tt > 2) freedPending = true;
  ctx.save();
  for (const f of FLY) {
    const k = clamp((tt - f.d) / 5, 0, 1);
    if (k <= 0) continue;
    const a = 1 - clamp((tt - NET_FREED_S + 1.2) / 1.2, 0, 1);
    const x = f.x + f.s * 160 * ease(k) + Math.sin(tt * 1.4 + f.d) * 20, y = 90 - 260 * ease(k) * f.v;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(tt * 1.1 + f.d * 3) * 0.4 * k);
    net(ctx, -60, 0, 60, 0, 80 * (1 - 0.4 * k), Math.sin(tt * 2 + f.d) * 8, a);
    ctx.restore();
  }
  ctx.restore();
}
