// Docs: docs/places/orrery.md
// The Orrery (room ORRERY, src/shared/rpg.js; the Citadel's depth pass, C1): the Keepers' star-hall, through the round door
// at the Chrono Spire's foot. A long hall under a cracked glass dome; a great orrery's brass arms sweep slowly overhead
// round the crown, glass planets riding them; the floor is dark glass set with little stars and inlaid brass circles. And
// up in the dome, the stars are being dragged: each one slides back along a faint line toward where it stood before the
// fall, and slips again. West to east: the Star Door (no mobs), the Ring Gallery, the Glass Floor and the Dome's Heart,
// where a spiral stair goes down under the crown to the orrery's engine (Meridian's den: its way in is drawn by
// src/dens-orrery.js). The chart table up on the gallery (last in ORRERY_PLATFORMS) is the find: a star chart with every
// star drawn twice, in two inks.
// freed (the slime drawing has freed Meridian: docs/social/story.md): the arms hang still at rest, and the stars in the
// dome sit where they are now, scattered, no lines dragging them back.
import { H, W, TAU, mulberry32, circle, ellipse } from './util.js';
import { ORRERY_W, FIELD_GROUND, ORRERY_PLATFORMS, ORRERY_ZONES, ORRERY_EXIT_X } from './shared/rpg.js';
import { starPoint } from './orrery-art.js';

const GROUND = FIELD_GROUND;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const STAR = '214,228,255';
const CHART = ORRERY_PLATFORMS.find((p) => p.kind === 'chart');
const HEART = ORRERY_ZONES[3].x0;
const DOME_PX = 0.18; // how fast the dome moves against the camera (it's far up)

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

// the dome's stars: where each one is now (x, y) and where it was (ox, oy) before the fall
const stars = (() => {
  const r = mulberry32(8601);
  return Array.from({ length: 70 }, () => {
    const x = r() * 1400, y = 20 + r() * 200;
    return { x, y, ox: x + (r() - 0.5) * 120, oy: y + (r() - 0.5) * 60, s: 0.6 + r() * 1.2, p: r() * TAU, k: 0.6 + r() * 0.8 };
  });
})();
const panels = (() => { // the back wall's tall glass panels between brass columns
  const out = [];
  for (let x = 160; x < ORRERY_W; x += 240) out.push(x);
  return out;
})();
const floorStars = (() => {
  const r = mulberry32(8611);
  return Array.from({ length: 160 }, () => ({ x: r() * ORRERY_W, y: GROUND + 8 + r() * 80, s: 0.6 + r() * 1.2, p: r() * TAU }));
})();

// Everything in the Orrery behind the slimes
export function drawOrrery(ctx, camX, viewW, time, freed = false) {
  ctx.save();
  ctx.translate(camX, 0);
  drawDome(ctx, camX, time, freed);
  ctx.restore();
  const L = camX - 120, R = camX + viewW + 120;
  drawBackWall(ctx, L, R, time);
  drawFloor(ctx, L, R, time);
  if (visible(0, 320, L, R)) drawStarDoor(ctx, time);
  if (visible(HEART - 200, ORRERY_W, L, R)) drawCrown(ctx, time, freed);
  for (const p of ORRERY_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'plinth') drawPlinth(ctx, p, time);
    else if (p.kind === 'gallery') drawGallery(ctx, p);
    else if (p.kind === 'arm') drawLowArm(ctx, p, time, freed);
  }
  if (CHART && visible(CHART.x - 40, CHART.x + CHART.w + 40, L, R)) drawChart(ctx, CHART, time);
  // dust turning slowly in the light from the dome
  ctx.save();
  ctx.translate(camX, 0);
  const r = mulberry32(8621);
  for (let i = 0; i < 22; i++) {
    const x0 = r() * W, y0 = 80 + r() * 320, ph = r() * TAU;
    const x = ((x0 - camX * 0.3 + Math.sin(time * 0.2 + ph) * 30) % W + W) % W, y = y0 + Math.sin(time * 0.35 + ph) * 16;
    ctx.fillStyle = `rgba(240,232,210,${0.22 + 0.15 * Math.sin(time + ph)})`;
    circle(ctx, x, y, 1.2);
  }
  ctx.restore();
}

// The dome, seen from below: night sky through leaded glass, brass ribs curving up to the crown, cracked panes; the great
// orrery's upper arms sweeping round over the hall; the stars being dragged back (or, freed, resting)
function drawDome(ctx, camX, time, freed) {
  ctx.fillStyle = vgrad(ctx, 'orr-sky', 0, H, [[0, '#0e1230'], [0.4, '#1e2450'], [0.75, '#3a3a66'], [1, '#5a4e70']]);
  ctx.fillRect(0, 0, W, H);
  const sx = -camX * DOME_PX;
  // the stars
  for (const s of stars) {
    let x = ((s.x + sx) % 1400 + 1400) % 1400 - 220, y = s.y;
    if (x < -40 || x > W + 40) continue;
    const tw = 0.55 + 0.45 * Math.sin(time * 1.3 * s.k + s.p);
    if (!freed) {
      // dragged: it slides back toward where it was, most of the way, then slips home again
      const c = ((time * 0.12 * s.k + s.p) % 1);
      const pull = c < 0.8 ? Math.sin((c / 0.8) * Math.PI * 0.5) * 0.7 : 0.7 * (1 - (c - 0.8) / 0.2);
      const ox = s.ox - s.x, oy = s.oy - s.y;
      ctx.strokeStyle = `rgba(${STAR},${0.12 + 0.12 * pull})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ox, y + oy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,214,170,0.22)'; // the old place, a faint warm ring
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, 2.2, 0, TAU);
      ctx.fill();
      x += ox * pull;
      y += oy * pull;
    }
    starPoint(ctx, x, y, s.s * (freed ? 2.6 : 2.2) * tw + 0.6, 0.55 + 0.4 * tw);
  }
  // the leading and the brass ribs: a fan of curves converging on the crown, far off to the east
  const cx = W * 0.5 + (ORRERY_W * 0.85 - camX - W / 2) * DOME_PX, cy = -120;
  ctx.strokeStyle = 'rgba(200,170,110,0.5)';
  ctx.lineWidth = 3;
  for (let i = -9; i <= 9; i++) {
    const a = Math.PI / 2 + i * 0.16;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + Math.cos(a) * 900, cy + 200, cx + Math.cos(a) * 1500, H);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(200,170,110,0.28)';
  ctx.lineWidth = 1.5;
  for (const r of [260, 420, 600, 820]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.4, r, 0, 0, Math.PI);
    ctx.stroke();
  }
  // the cracks in the glass
  ctx.strokeStyle = 'rgba(230,236,255,0.32)';
  ctx.lineWidth = 1;
  const r = mulberry32(8631);
  for (let k = 0; k < 5; k++) {
    let x = ((r() * 1600 + sx * 1.1) % 1600 + 1600) % 1600 - 300, y = 10 + r() * 80;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < 6; j++) {
      x += (r() - 0.3) * 40;
      y += 12 + r() * 20;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // the orrery's upper arms, sweeping round the crown (freed: at rest, hanging still)
  for (let i = 0; i < 4; i++) {
    const len = 520 + i * 180;
    const a = freed ? Math.PI / 2 + 0.25 * (i - 1.5) : Math.PI / 2 + Math.sin(time * (0.05 + i * 0.013) + i * 1.7) * 0.9;
    const ex = cx + Math.cos(a) * len * 1.3, ey = cy + Math.sin(a) * len * 0.42;
    ctx.strokeStyle = 'rgba(90,60,30,0.55)';
    ctx.lineWidth = 7 - i;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240,196,112,0.75)';
    ctx.lineWidth = 4 - i * 0.6;
    ctx.stroke();
    if (ex > -60 && ex < W + 60) {
      const pr = 9 + i * 4;
      const g = ctx.createRadialGradient(ex - pr * 0.3, ey - pr * 0.3, 1, ex, ey, pr);
      g.addColorStop(0, ['#f4f0ff', '#ffe8c8', '#e0f0ff', '#f0d8ff'][i]);
      g.addColorStop(1, ['#6a6aa8', '#a8784a', '#4a7aa8', '#7a5aa8'][i]);
      ctx.fillStyle = g;
      circle(ctx, ex, ey, pr);
    }
  }
  // the haze where the dome meets the wall
  ctx.fillStyle = vgrad(ctx, 'orr-haze', 220, 380, [[0, 'rgba(60,56,96,0)'], [1, 'rgba(90,80,110,0.7)']]);
  ctx.fillRect(0, 220, W, 160);
}

// The back wall: tall brass-framed glass panels with star charts etched in them, columns between, a gallery rail
function drawBackWall(ctx, L, R, time) {
  const top = GROUND - 250;
  ctx.fillStyle = '#4a4262';
  ctx.fillRect(L, top, R - L, GROUND - top);
  for (const x of panels) {
    if (!visible(x - 120, x + 120, L, R)) continue;
    ctx.fillStyle = 'rgba(40,44,84,0.9)';
    ctx.beginPath();
    ctx.roundRect(x - 80, top + 30, 160, 190, [70, 70, 4, 4]);
    ctx.fill();
    ctx.strokeStyle = BRASS_D;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(214,228,255,0.25)'; // an etched constellation
    ctx.lineWidth = 1;
    const r = mulberry32(8640 + x);
    let px = x - 50 + r() * 30, py = top + 80 + r() * 40;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let j = 0; j < 4; j++) {
      px = x - 60 + r() * 120;
      py = top + 70 + r() * 120;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,170,110,0.35)';
    ctx.beginPath();
    ctx.arc(x, top + 130, 52, 0, TAU);
    ctx.stroke();
    // the column to its right
    ctx.fillStyle = '#5e5478';
    ctx.fillRect(x + 100, top, 40, GROUND - top);
    ctx.fillStyle = BRASS_D;
    ctx.fillRect(x + 96, top, 48, 10);
    ctx.fillRect(x + 96, GROUND - 14, 48, 14);
  }
  ctx.fillStyle = BRASS_E; // the rail along the wall's top
  ctx.fillRect(L, top - 6, R - L, 6);
  ctx.fillStyle = 'rgba(253,227,160,0.6)';
  ctx.fillRect(L, top - 6, R - L, 2);
}

// The floor: dark glass with stars set in it and great brass circles inlaid
function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = vgrad(ctx, 'orr-floor', GROUND, H, [[0, '#2a2a4a'], [0.4, '#1e1e38'], [1, '#14142a']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(L, GROUND - 2, R - L, 4);
  ctx.strokeStyle = 'rgba(240,196,112,0.32)';
  ctx.lineWidth = 2;
  for (let c = 500; c < ORRERY_W; c += 900) {
    if (!visible(c - 420, c + 420, L, R)) continue;
    ctx.beginPath();
    ctx.ellipse(c, GROUND + 44, 400, 28, 0, 0, TAU);
    ctx.stroke();
  }
  for (const s of floorStars) {
    if (!visible(s.x - 4, s.x + 4, L, R)) continue;
    ctx.fillStyle = `rgba(${STAR},${0.35 + 0.3 * Math.sin(time * 1.1 + s.p)})`;
    circle(ctx, s.x, s.y, s.s);
  }
}

// The Star Door from inside: the round brass door, its three lock rings lined up and still, standing open
function drawStarDoor(ctx, time) {
  const x = ORRERY_EXIT_X + 30, b = GROUND;
  ctx.fillStyle = '#2a2440'; // the doorway, the Spire's dusk light beyond it
  ctx.beginPath();
  ctx.arc(x, b - 90, 86, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(190,160,255,0.25)';
  ctx.beginPath();
  ctx.arc(x, b - 90, 74, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(x, b - 90, 86, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = BRASS_L; // the lock's three rings, still, their marks lined up at the top
  ctx.lineWidth = 3;
  for (const rr of [96, 104, 112]) {
    ctx.beginPath();
    ctx.arc(x, b - 90, rr, -Math.PI * 0.95, -Math.PI * 0.05);
    ctx.stroke();
    ctx.fillStyle = BRASS_E;
    ctx.fillRect(x - 2, b - 90 - rr - 4, 4, 8);
  }
}

// The Dome's Heart: the orrery's great pivot coming down from the crown as a brass column, a ring of floor lamps round
// its foot (the way down to the engine opens beside it: the den's entrance art)
function drawCrown(ctx, time, freed) {
  const x = HEART + 520, b = GROUND;
  ctx.fillStyle = 'rgba(253,227,160,0.08)';
  ctx.beginPath();
  ctx.moveTo(x - 40, 0);
  ctx.lineTo(x + 40, 0);
  ctx.lineTo(x + 200, b);
  ctx.lineTo(x - 200, b);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
  g.addColorStop(0, BRASS_E);
  g.addColorStop(0.45, BRASS_L);
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  ctx.fillRect(x - 24, 0, 48, b - 120);
  ctx.strokeStyle = 'rgba(138,90,46,0.7)'; // its turning bands
  ctx.lineWidth = 2;
  const turn = freed ? 0 : (time * 20) % 40;
  for (let y = -turn; y < b - 120; y += 40) {
    ctx.beginPath();
    ctx.moveTo(x - 24, y);
    ctx.lineTo(x + 24, y + 10);
    ctx.stroke();
  }
  ctx.fillStyle = BRASS_D; // the bearing it turns in, over the floor
  ctx.beginPath();
  ctx.ellipse(x, b - 120, 70, 16, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = 0; i < 6; i++) { // little floor lamps of star-glass round its foot
    const lx = x - 150 + i * 60;
    ctx.fillStyle = BRASS_E;
    ctx.fillRect(lx - 2, b - 30, 4, 30);
    const k = 0.6 + 0.4 * Math.sin(time * 1.4 + i);
    starPoint(ctx, lx, b - 36, 5 * k + 2, 0.8);
  }
}

// A lens plinth: a squat brass pedestal holding a great round lens, a ring of brass round its top to stand on
function drawPlinth(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.fillStyle = '#5e5478';
  ctx.fillRect(cx - w * 0.3, y + 4, w * 0.6, GROUND - y - 4);
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(cx - w * 0.36, GROUND - 14, w * 0.72, 14);
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 10, 5);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.stroke();
  const g = ctx.createRadialGradient(cx - 8, y + 30, 2, cx, y + 40, 26); // the lens set in its face
  g.addColorStop(0, 'rgba(240,246,255,0.9)');
  g.addColorStop(1, 'rgba(90,110,180,0.8)');
  ctx.fillStyle = g;
  circle(ctx, cx, y + 40, 22);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, y + 40, 22, 0, TAU);
  ctx.stroke();
}

// The gallery: a brass walkway on curled brackets, a thin rail
function drawGallery(ctx, p) {
  const { x, y, w } = p;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  for (const bx of [x + 20, x + w - 20]) {
    ctx.beginPath();
    ctx.moveTo(bx, y + 6);
    ctx.quadraticCurveTo(bx, y + 40, bx + (bx < x + w / 2 ? -18 : 18), y + 50);
    ctx.stroke();
  }
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 10, 3);
  ctx.fill();
  ctx.fillStyle = BRASS_L;
  ctx.fillRect(x, y - 4, w, 2);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 30);
  ctx.lineTo(x + w - 4, y - 30);
  for (let rx = x + 6; rx < x + w; rx += 24) {
    ctx.moveTo(rx, y - 30);
    ctx.lineTo(rx, y - 4);
  }
  ctx.stroke();
}

// One of the orrery's low arms: a brass bar on a post, a glass planet at its end, swaying a little (freed: still)
function drawLowArm(ctx, p, time, freed) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(cx - 5, y + 6, 10, GROUND - y - 6);
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.ellipse(cx, GROUND - 4, 26, 6, 0, 0, TAU);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y - 4, 0, y + 8);
  g.addColorStop(0, BRASS_L);
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 11, 5);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.stroke();
  const sway = freed ? 0 : Math.sin(time * 0.6 + x) * 3;
  const px = x + w + 10, py = y + 16 + sway;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w - 6, y + 2);
  ctx.lineTo(px, py);
  ctx.stroke();
  const pg = ctx.createRadialGradient(px - 4, py - 4, 1, px, py, 14);
  pg.addColorStop(0, '#f4f0ff');
  pg.addColorStop(1, '#5a6aa8');
  ctx.fillStyle = pg;
  circle(ctx, px, py, 13);
  ctx.strokeStyle = 'rgba(240,196,112,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(px, py, 20, 5, -0.3, 0, TAU);
  ctx.stroke();
}

// The find: a chart table on the gallery's top, a star chart pinned flat on it with brass weights, every star drawn
// twice: once in brown ink as they were, once in blue as they are, a line ruled between each pair
function drawChart(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 4);
  ctx.lineTo(x + 10, y + 70);
  ctx.moveTo(x + w - 14, y + 4);
  ctx.lineTo(x + w - 10, y + 70);
  ctx.stroke();
  ctx.fillStyle = '#6a4a32';
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 9, 3);
  ctx.fill();
  ctx.fillStyle = '#efe4c8'; // the chart, curling at one corner
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 5);
  ctx.lineTo(x + w - 10, y - 5);
  ctx.quadraticCurveTo(x + w - 2, y - 12, x + w - 6, y - 16);
  ctx.lineTo(x + 10, y - 14);
  ctx.closePath();
  ctx.fill();
  const r = mulberry32(8651);
  for (let i = 0; i < 7; i++) {
    const ax = x + 14 + r() * (w - 30), ay = y - 7 - r() * 6;
    const bx = ax + (r() - 0.5) * 14, by = y - 7 - r() * 6;
    ctx.strokeStyle = 'rgba(90,70,60,0.45)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.fillStyle = '#7a4a2a';
    circle(ctx, ax, ay, 1.1);
    ctx.fillStyle = '#3a5ab0';
    circle(ctx, bx, by, 1.1);
  }
  ctx.fillStyle = BRASS; // the weights
  circle(ctx, x + 10, y - 9, 3);
  circle(ctx, x + w - 14, y - 9, 3);
  // a faint light over it, so it can be found
  ctx.fillStyle = `rgba(253,227,160,${0.06 + 0.04 * Math.sin(time * 1.2)})`;
  ellipse(ctx, cx, y - 20, w * 0.6, 22);
}
