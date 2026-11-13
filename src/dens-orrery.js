// Docs: docs/combat/bosses.md, docs/places/orrery.md
// The Orrery's boss den (the Armillary, the Citadel's depth pass C1), its way in under the Orrery's dome (a round hole in
// the glass floor beside the great pivot, a brass spiral stair going down, starlight coming up and rings turning far
// below), and Meridian itself: the orrery's engine, a brass armillary sphere the size of a house, its rings turning round
// a glass heart, that keeps dragging the stars back to where they were before they fell. The plan: story/citadel-plan.md.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must NOT
// import dens.js: the few helpers it needs are copied below. The shared boss effects take its theme ('orrery': FXPAL in
// dens.js); The Old Sky is the shared `nova` ult (starlight already). Its freeing (drawMeridianFreed, the den's bossDie):
// the rings slow and come to rest, and the stars it held on their wires let go and drift out to where they are now.
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, FIELD_GROUND, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';
import { drawSunk } from './challenge.js';
import { starPoint } from './orrery-art.js';

const GROUND = FIELD_GROUND;
export const MERIDIAN_FREED_S = 6; // how long the freeing plays (the den's bossDie lasts this long)
const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const STAR = '214,228,255';
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
function gearPath(ctx, x, y, r, n, a) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r * 0.82 : r, aa = a + (i / (n * 2)) * TAU;
    ctx.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr);
  }
  ctx.closePath();
}

// Freed: the stars stay where they drifted to for a while after (set from drawMeridianFreed)
let freedPending = false, freedAt = -1e9;

// ——— the den: the orrery's engine room under the dome's crown, a round brass chamber. Gear trains climb the walls; the
// great pivot comes down through the roof into the middle; stars hang on fine brass wires from the roof, every wire drawn
// taut toward one place, the stars straining back where they were. The floor is dark glass with the old sky drawn on it
// in brass ———
const hung = (() => { // the stars on their wires: where each hangs, and where the wire drags it
  const r = mulberry32(8701);
  return Array.from({ length: 26 }, () => {
    const x = 60 + r() * (DEN_W - 120), y = 60 + r() * 170;
    return { x, y, dx: (r() - 0.5) * 90, dy: (r() - 0.5) * 30, s: 0.8 + r() * 0.8, p: r() * TAU };
  });
})();
const wallGears = (() => {
  const r = mulberry32(8711);
  return Array.from({ length: 12 }, () => ({ x: r() * DEN_W, y: 120 + r() * 250, r: 22 + r() * 40, n: 10 + Math.floor(r() * 8), v: (r() - 0.5) * 0.6 }));
})();
const floorMarks = (() => {
  const r = mulberry32(8721);
  return Array.from({ length: 40 }, () => ({ x: r() * DEN_W, y: GROUND + 10 + r() * 70, s: 0.6 + r() }));
})();

function drawDenOrrery(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  if (freedPending) (freedPending = false), (freedAt = time);
  const freedT = time - freedAt, freed = freedT < BOSS_RESPAWN_MS / 1000;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'bg-orrery', 0, GROUND, [[0, '#12163a'], [0.5, '#2a2850'], [1, '#3e3658']]);
  ctx.fillRect(L, 0, R - L, H);
  // the round chamber's ribs
  ctx.strokeStyle = 'rgba(200,170,110,0.35)';
  ctx.lineWidth = 3;
  for (let x = Math.floor(L / 180) * 180; x < R + 180; x += 180) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND);
    ctx.quadraticCurveTo(x + 40, GROUND * 0.4, DEN_W / 2 + (x - DEN_W / 2) * 0.3, 0);
    ctx.stroke();
  }
  // gear trains on the walls (freed: still)
  for (const g of wallGears) {
    if (!visible(g.x - g.r, g.x + g.r, L, R)) continue;
    const a = freed ? g.v : time * g.v;
    gearPath(ctx, g.x, g.y, g.r, g.n, a);
    ctx.fillStyle = 'rgba(138,104,60,0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,60,30,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(30,26,50,0.6)';
    circle(ctx, g.x, g.y, g.r * 0.25);
  }
  // the great pivot down through the roof
  const px = DEN_W / 2;
  if (visible(px - 40, px + 40, L, R)) {
    const g = ctx.createLinearGradient(px - 22, 0, px + 22, 0);
    g.addColorStop(0, BRASS_E);
    g.addColorStop(0.5, BRASS_L);
    g.addColorStop(1, BRASS_D);
    ctx.fillStyle = g;
    ctx.fillRect(px - 20, 0, 40, 70);
    ctx.fillStyle = BRASS_D;
    ellipse(ctx, px, 72, 46, 10);
  }
  // the stars on their wires, drawn taut back toward their old places (freed: slack, hanging where they are)
  for (const s of hung) {
    if (!visible(s.x - 60, s.x + 60, L, R)) continue;
    const pull = freed ? 0 : 0.5 + 0.5 * Math.sin(time * 0.5 + s.p);
    const sx = s.x + s.dx * pull, sy = s.y + s.dy * pull;
    ctx.strokeStyle = freed ? 'rgba(200,170,110,0.25)' : 'rgba(253,227,160,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x - s.dx * 0.6, 0);
    if (freed) ctx.quadraticCurveTo(sx + 6, sy * 0.6, sx, sy);
    else ctx.lineTo(sx, sy);
    ctx.stroke();
    const tw = 0.6 + 0.4 * Math.sin(time * 1.6 + s.p);
    starPoint(ctx, sx, sy, s.s * 4 * tw + 2, 0.85);
  }
  // the floor: dark glass, the old sky drawn on it in brass
  ctx.fillStyle = vgrad(ctx, 'floor-orrery', GROUND, H, [[0, '#2a2a4a'], [1, '#12122a']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(L, GROUND - 2, R - L, 4);
  ctx.strokeStyle = 'rgba(240,196,112,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(DEN_W / 2, GROUND + 40, DEN_W * 0.42, 30, 0, 0, TAU);
  ctx.stroke();
  for (const m of floorMarks) {
    if (!visible(m.x - 3, m.x + 3, L, R)) continue;
    ctx.fillStyle = 'rgba(240,196,112,0.45)';
    circle(ctx, m.x, m.y, m.s);
  }
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Armillary', 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawSunk(ctx, p, i, () => drawLedge(ctx, p))); // (drawSunk: a boss's moving arena, src/challenge.js)
  ctx.restore();
}

function drawExit(ctx) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 80, 100, 110, STAR, 0.25);
  ctx.strokeStyle = BRASS_D; // the spiral stair going back up
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    const y = b - 10 - i * 28, dx = Math.sin(i * 1.1) * 18;
    ctx.beginPath();
    ctx.moveTo(x - 26 + dx, y);
    ctx.lineTo(x + 26 + dx, y - 6);
    ctx.stroke();
  }
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, b);
  ctx.lineTo(x, b - 180);
  ctx.stroke();
  text(ctx, 'OUT', x, b - 200, 13, '#f0eef8');
}

// The name on a brass plate hung on two chains under the pivot
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 120);
  ctx.rotate(Math.sin(time * 0.4) * 0.01);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50);
  ctx.strokeStyle = 'rgba(200,170,110,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const sx of [-tw / 2 + 18, tw / 2 - 18]) {
    ctx.moveTo(sx, -46);
    ctx.lineTo(sx, -18);
  }
  ctx.stroke();
  ctx.fillStyle = BRASS_D;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 44, 10);
  ctx.fill();
  ctx.stroke();
  starPoint(ctx, -tw / 2 + 16, 2, 5, 0.9);
  starPoint(ctx, tw / 2 - 16, 2, 5, 0.9);
  text(ctx, name, 0, 3, 18, '#2a1e14');
  ctx.restore();
}

// The ledges: brass rings of the chamber's old galleries, a planet hung under one end
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = BRASS_D;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 12, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS_L;
  ctx.fillRect(x + 4, y - 4, w - 8, 2);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.8, y + 8);
  ctx.lineTo(x + w * 0.8, y + 30);
  ctx.stroke();
  ctx.fillStyle = '#8a9ad8';
  circle(ctx, x + w * 0.8, y + 36, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  circle(ctx, x + w * 0.8 - 2, y + 34, 2);
}

export const DEN_ART = { orrery: drawDenOrrery };

// ——— the way in under the Orrery's dome (feet at groundY) ———
// A round hole in the glass floor ringed with brass, a spiral stair's rail curling down into it, starlight coming up, and
// far below a ring turning slowly, then another
function drawEntranceOrrery(ctx, x, groundY, time) {
  const b = groundY;
  ctx.save();
  glow(ctx, x, b - 10, 130, 60, STAR, 0.22 + 0.06 * Math.sin(time * 0.9));
  ctx.fillStyle = 'rgba(8,8,24,0.85)';
  ctx.beginPath();
  ctx.ellipse(x, b + 6, 100, 14, 0, 0, TAU);
  ctx.fill();
  ctx.save(); // the rings turning far down, seen through the hole
  ctx.beginPath();
  ctx.ellipse(x, b + 6, 100, 14, 0, 0, TAU);
  ctx.clip();
  for (let i = 0; i < 3; i++) {
    const a = time * (0.4 + i * 0.15) + i;
    ctx.strokeStyle = `rgba(240,196,112,${0.35 - i * 0.08})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, b + 8, (50 + i * 16) * Math.abs(Math.cos(a)) + 8, 6 + i * 2, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = BRASS_E; // the brass rim
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(x, b + 6, 100, 14, 0, Math.PI, TAU);
  ctx.stroke();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = BRASS_D; // the stair's rail, curling down
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 70, b - 40);
  ctx.quadraticCurveTo(x - 90, b - 6, x - 50, b + 6);
  ctx.quadraticCurveTo(x - 10, b + 14, x + 20, b + 8);
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(x - 72, b - 44, 5, 46);
  for (let i = 0; i < 4; i++) starPoint(ctx, x - 40 + i * 28, b - 16 - ((time * 20 + i * 17) % 60), 3, 0.5); // a few motes of light rising
  ctx.restore();
}
export const ENTRANCE_ART = { orrery: drawEntranceOrrery };

// ——— Meridian (ctx, w, h, st) => sil, origin under it on the floor, +x = facing ———
// A brass armillary sphere the size of a house on a great three-footed stand: the meridian ring standing upright, the
// horizon ring flat round its middle, the ecliptic slanting across, and two more turning inside; at its heart a sphere of
// clouded glass with the shard in it (where `weak` puts the weak point). One sighting lens on the meridian ring's top is
// the nearest thing it has to an eye. st.warn: its rings spin up and glow star-white; charging: it tips forward on its
// stand; enraged: the brass reddens.
function drawMeridian(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const live = dying < 0.02;
  const R = Math.min(w, h) * 0.42, cy = -h * 0.55;
  const spin = live ? (warn ? 3.2 : 0.6) : 0;
  const brass = rageCol(BRASS, enr, 0.22), brassD = rageCol(BRASS_D, enr, 0.22), brassE = rageCol(BRASS_E, enr, 0.2);
  const sil = () => {
    ctx.beginPath();
    ctx.arc(0, cy, R + 6, 0, TAU);
    ctx.rect(-w * 0.36, cy + R * 0.6, w * 0.72, -cy - R * 0.6);
  };
  ctx.save();
  // the stand: three curved brass feet on a ring, a column up to the sphere
  ctx.strokeStyle = brassE;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const fx of [-0.4, 0.4]) {
    ctx.moveTo(0, cy + R * 0.9);
    ctx.quadraticCurveTo(w * fx * 0.6, cy + R * 1.2, w * fx, -4);
  }
  ctx.stroke();
  ctx.strokeStyle = brassD;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = brassD;
  ctx.fillRect(-9, cy + R * 0.86, 18, -cy - R * 0.86 - 6);
  ctx.fillStyle = brassE;
  for (const fx of [-0.4, 0.4]) ellipse(ctx, w * fx, -3, 14, 5);
  ellipse(ctx, 0, -3, 22, 6);
  // the glass heart, behind the rings
  const hk = live ? 0.7 + 0.3 * Math.sin(t * 1.4 + seed) : 0.25;
  glow(ctx, 0, cy, R * 0.9, R * 0.9, STAR, 0.35 * hk);
  const hg = ctx.createRadialGradient(-R * 0.12, cy - R * 0.12, 2, 0, cy, R * 0.34);
  hg.addColorStop(0, `rgba(240,246,255,${0.6 + 0.35 * hk})`);
  hg.addColorStop(1, `rgba(90,104,170,${0.55 + 0.2 * hk})`);
  ctx.fillStyle = hg;
  circle(ctx, 0, cy, R * 0.34);
  ctx.strokeStyle = 'rgba(70,80,140,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, cy, R * 0.34, 0, TAU);
  ctx.stroke();
  // the shard (every great beast carries one), in the heart (MOBS.meridian.weak)
  const sh = 0.6 + 0.4 * Math.sin(t * 3);
  glow(ctx, 0, cy, 22, 22, '255,236,190', live ? 0.5 * sh : 0.1);
  ctx.fillStyle = live ? '#fff4d8' : '#b8b0a0';
  ctx.strokeStyle = '#a88a50';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-1, cy - 11);
  ctx.lineTo(7, cy - 1);
  ctx.lineTo(1, cy + 8);
  ctx.lineTo(-6, cy - 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the rings: two inner ones turning, the ecliptic slanting, the horizon flat, the meridian upright (drawn outermost)
  const ring = (rx, ry, rot, lw, col, edge) => {
    ctx.strokeStyle = edge;
    ctx.lineWidth = lw + 3;
    ctx.beginPath();
    ctx.ellipse(0, cy, rx, ry, rot, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.stroke();
  };
  const a1 = t * spin + seed, a2 = -t * spin * 0.7 + seed * 2;
  ring(R * 0.62, R * 0.62 * Math.abs(Math.cos(a1)) + 3, 0.5, 4, BRASS_L, brassD);
  ring(R * 0.62 * Math.abs(Math.cos(a2)) + 3, R * 0.62, -0.4, 4, BRASS_L, brassD);
  ring(R * 0.9, R * 0.3, -0.38, 6, brass, brassE); // the ecliptic, its band of signs
  ctx.strokeStyle = 'rgba(90,60,30,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + (live ? t * 0.2 : 0);
    const ex = Math.cos(a) * R * 0.9, ey = Math.sin(a) * R * 0.3;
    const rx2 = ex * Math.cos(-0.38) - ey * Math.sin(-0.38), ry2 = ex * Math.sin(-0.38) + ey * Math.cos(-0.38);
    ctx.beginPath();
    ctx.arc(rx2, cy + ry2, 2, 0, TAU);
    ctx.stroke();
  }
  ring(R, R * 0.22, 0, 7, brass, brassE); // the horizon
  ring(R * 0.24, R, 0, 7, brass, brassE); // the meridian, upright, seen edge-on-ish
  ctx.strokeStyle = brassE; // the meridian ring's full face, a little turned
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, cy, R, -Math.PI * 0.5 - 1.2, -Math.PI * 0.5 + 1.2);
  ctx.stroke();
  ctx.strokeStyle = brass;
  ctx.lineWidth = 6;
  ctx.stroke();
  // the warn: the rings blaze star-white
  if (warn) {
    ctx.strokeStyle = `rgba(${STAR},${0.5 + 0.4 * Math.sin(t * 20)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, cy, R * 0.9, R * 0.3, -0.38, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, cy, R, R * 0.22, 0, 0, TAU);
    ctx.stroke();
  }
  // the sighting lens on the meridian ring's top: its eye
  const ex = R * 0.18, ey = cy - R * 0.98;
  ctx.fillStyle = brassE;
  circle(ctx, ex, ey, 11);
  ctx.fillStyle = '#1e2440';
  circle(ctx, ex, ey, 8);
  if (live) {
    ctx.fillStyle = warn || charging ? 'rgba(255,240,200,0.95)' : `rgba(${STAR},${0.75 + 0.2 * Math.sin(t * 2)})`;
    circle(ctx, ex + 1.5, ey, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    circle(ctx, ex - 1.5, ey - 2.5, 1.6);
  } else {
    ctx.strokeStyle = 'rgba(214,228,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - 5, ey - 5); ctx.lineTo(ex + 5, ey + 5);
    ctx.moveTo(ex + 5, ey - 5); ctx.lineTo(ex - 5, ey + 5);
    ctx.stroke();
  }
  // two little planets riding its outer rings
  if (live) {
    const pa = t * (warn ? 2.4 : 0.5) + seed;
    for (let i = 0; i < 2; i++) {
      const a = pa + i * Math.PI;
      const px = Math.cos(a) * R, py = cy + Math.sin(a) * R * 0.22;
      ctx.fillStyle = i ? '#e0c8ff' : '#c8e0ff';
      circle(ctx, px, py, 7);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      circle(ctx, px - 2, py - 2, 2);
    }
  }
  ctx.restore();
  return sil;
}
export const BOSS_ART = { meridian: drawMeridian };
export const ULT_LOOKS = {}; // (The Old Sky is the shared `nova` ult, starlight already: dens.js)

// ——— freed: its rings slow and stop, and the stars it held let go: they rise off it and drift out across the roof to
// where they are now, settling (the den's bossDie, MERIDIAN_FREED_S long) ———
export function drawMeridianFreed(ctx, e) {
  const tt = e.t;
  if (tt > 2) freedPending = true;
  const x0 = e.x ?? 750, y0 = GROUND - 120;
  for (let i = 0; i < 30; i++) {
    const start = 0.4 + (i % 10) * 0.25 + Math.floor(i / 10) * 0.1;
    const j = clamp((tt - start) / 3.2, 0, 1);
    if (j <= 0) continue;
    const ease = 1 - (1 - j) ** 3;
    const tx = 60 + ((i * 211) % (DEN_W - 120)), ty = 50 + ((i * 97) % 180);
    const x = x0 + (tx - x0) * ease + Math.sin(tt * 1.2 + i) * 6 * (1 - j), y = y0 + (ty - y0) * ease;
    ctx.save();
    ctx.globalAlpha *= Math.min(1, j * 5) * (tt > MERIDIAN_FREED_S - 1 ? Math.max(0, MERIDIAN_FREED_S - tt) : 1);
    starPoint(ctx, x, y, 3 + (i % 3) * 1.5, 0.95);
    ctx.restore();
  }
  // the rings, slowing round where it stood, then still
  const k = clamp(1 - tt / (MERIDIAN_FREED_S * 0.7), 0, 1);
  ctx.strokeStyle = `rgba(240,196,112,${0.6 * (1 - tt / MERIDIAN_FREED_S)})`;
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const a = (1 - k * k) * 3 + i;
    ctx.beginPath();
    ctx.ellipse(x0, y0 + 20, 80 * Math.abs(Math.cos(a)) + 6, 80, 0, 0, TAU);
    ctx.stroke();
  }
}
