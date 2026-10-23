// Docs: docs/places/heights.md
// The Aurora Heights (room HEIGHTS, data in src/shared/rpg.js): the high snowfield above the Rimeglass
// Glacier's Icefall, up the cutters' new steps. High, still and cold: a night-blue sky, the aurora hanging so
// low its curtains come down to the snow (you walk through their hems), the stars big and close and wrong
// (smeared, clumped), and far below, a sea of cloud with the tops of Frostpeak's peaks poking through. West to
// east (it ends at the crater's rim: the biggest shard of starglass, leaning over a snowbank): the top of the steps (the way back down), the Last Step (no mobs: the waystone, the Serpent Stone in
// src/ruins.js, a cutters' windbreak of snow blocks), the Low Lights (wind-carved cornices), the Starfield
// (the stars closest of all) and the Wyrmfall: a long hollow melted into the snow and frozen to glass, shards
// of starglass standing up round it, where the Pale Wyrm lies. Liv's Reach, an ice spire over the Low Lights
// with a red mitten frozen to a marker pole on top, is the hidden spot.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { HEIGHTS_W, HEIGHTS_EXIT_X, HEIGHTS_ZONES, HEIGHTS_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const HORIZON = 330;
const STAR_X = HEIGHTS_ZONES[2].x0, FALL_X = HEIGHTS_ZONES[3].x0;
const REACH = HEIGHTS_PLATFORMS.at(-1);
const SNOW = '#f4f8ff', SNOW_S = '#cfdcf0', ICE = '#a9c8ee', ICE_D = '#6f94c8', ICE_L = '#dcecfc', ICE_LINE = '#3e5e94';
const GLASS = '#cfe4ff', GLASS_D = '#7f9fd0', GLASS_LINE = '#4a5e98';
const WOOD = '#7a5a44', WOOD_D = '#4e3a2c', LINE = '#3e3448';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const smooth = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3); // src/glow.js
}
// big gradients made once per canvas (docs/performance.md)
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

// ——— seeded scenery ———
// stars: big and close up here, and wrong: some smeared into streaks, some clumped in knots
const stars = (() => {
  const r = mulberry32(4001);
  return Array.from({ length: 90 }, () => ({ x: r() * W * 1.4, y: 6 + r() * 230, s: 0.7 + r() * 1.8, smear: r() < 0.14 ? 4 + r() * 8 : 0, a: (r() - 0.5) * 0.8, p: r() * TAU }));
})();
const knots = (() => {
  const r = mulberry32(4011);
  return Array.from({ length: 5 }, () => ({ x: r() * W * 1.4, y: 30 + r() * 170, n: 5 + Math.floor(r() * 5), seed: Math.floor(r() * 1e6) }));
})();
// the aurora's curtains, in the room (not the sky): their hems come right down to the snow here
const curtains = (() => {
  const r = mulberry32(4021);
  const out = [];
  for (let x = 200; x < HEIGHTS_W + 400; x += 380 + r() * 420) out.push({ x, w: 260 + r() * 360, hue: [150, 165, 175, 290][Math.floor(r() * 4)], top: 20 + r() * 60, hem: 370 + r() * 70, p: r() * TAU, v: 0.25 + r() * 0.3 });
  return out;
})();
// peak tops poking up out of a sea of cloud far below
const peaks = (() => {
  const r = mulberry32(4031);
  return Array.from({ length: 14 }, (_, i) => ({ x: i * 190 + r() * 120, w: 60 + r() * 90, h: 18 + r() * 44 }));
})();
// the snowfield's back: low dunes rising behind the path
const dunes = (() => {
  const r = mulberry32(4041);
  return Array.from({ length: 40 }, () => ({ x: r() * 2800, w: 120 + r() * 260, h: 12 + r() * 30 }));
})();
// wind lines (sastrugi) in the snow, and the glints of diamond dust in the air
const ridges = (() => {
  const r = mulberry32(4051);
  return Array.from({ length: Math.floor(HEIGHTS_W / 70) }, () => ({ x: r() * HEIGHTS_W, y: GROUND + 20 + r() * 60, w: 20 + r() * 50 }));
})();
const dust = (() => {
  const r = mulberry32(4061);
  return Array.from({ length: 60 }, () => ({ x: r() * W, y: 40 + r() * (GROUND - 40), p: r() * TAU, v: 4 + r() * 8 }));
})();
// starglass shards standing up round the Wyrmfall (not platforms)
const shards = (() => {
  const r = mulberry32(4071);
  const out = [];
  for (let x = FALL_X + 40; x < HEIGHTS_W - 120; x += 90 + r() * 170) {
    if (HEIGHTS_PLATFORMS.some((p) => x > p.x - 40 && x < p.x + p.w + 40)) continue;
    out.push({ x, w: 16 + r() * 24, h: 40 + r() * 90, lean: (r() - 0.5) * 0.5 });
  }
  return out;
})();
const WINDBREAK_X = 690; // the cutters' windbreak, east of the Serpent Stone

// the aurora gets stronger toward the Wyrmfall
const auroraAt = (x) => 0.55 + 0.45 * smooth(600, HEIGHTS_W - 600, x);

// Everything behind the slimes. camX is the left edge of the view.
export function drawHeights(ctx, camX, viewW, time) {
  const mid = camX + viewW / 2, aur = auroraAt(mid);
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time, aur);
  ctx.restore();

  const L = camX - 160, R = camX + viewW + 160;
  drawSnowfield(ctx, camX, L, R, time);
  drawCurtains(ctx, L, R, time, aur);
  for (const s of shards) if (visible(s.x - 40, s.x + 40, L, R)) drawShard(ctx, s, time);
  if (visible(FALL_X, HEIGHTS_W, L, R)) drawHollow(ctx, L, R, time);
  for (const p of HEIGHTS_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'cornice') drawCornice(ctx, p, time);
    else if (p.kind === 'starglass') drawStarglass(ctx, p, time);
  }
  if (visible(REACH.x - 80, REACH.x + REACH.w + 80, L, R)) drawReach(ctx, REACH, time);
  if (visible(WINDBREAK_X - 80, WINDBREAK_X + 160, L, R)) drawWindbreak(ctx, WINDBREAK_X, time);
  drawFloor(ctx, Math.max(0, L), Math.min(HEIGHTS_W, R), time);
  if (visible(-160, HEIGHTS_EXIT_X + 160, L, R)) drawStepsTop(ctx, time);
  if (visible(HEIGHTS_W - 300, HEIGHTS_W + 200, L, R)) drawEdge(ctx, time);
  HEIGHTS_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 70;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneWand(ctx, sx, z, i, time);
  });
  if (visible(HEIGHTS_EXIT_X, HEIGHTS_EXIT_X + 260, L, R)) drawExitSign(ctx, HEIGHTS_EXIT_X + 100, time);
  ctx.save();
  ctx.translate(camX, 0);
  ctx.fillStyle = `rgba(140,240,200,${0.05 * aur})`; // the aurora's light on everything
  ctx.fillRect(0, 0, W, H);
  drawDust(ctx, camX, time);
  ctx.restore();
}

// The sky: deep night blue going violet at the cloud line; big close stars, some smeared and clumped; the
// sea of cloud far below with the peaks' tops in it
function drawSky(ctx, camX, time, aur) {
  ctx.fillStyle = vgrad(ctx, 'sky', 0, HORIZON, [[0, '#141a3e'], [0.55, '#2a2e66'], [1, '#6a5e9a']]);
  ctx.fillRect(0, 0, W, HORIZON);
  // stars, drifting a little with the view
  for (const s of stars) {
    const x = ((s.x - camX * 0.03) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2;
    if (x < -20 || x > W + 20) continue;
    const tw = 0.6 + 0.4 * Math.sin(time * 1.3 + s.p);
    if (s.smear) {
      ctx.fillStyle = `rgba(230,240,255,${0.5 * tw})`;
      ellipse(ctx, x, s.y, s.smear, s.s * 0.7, s.a);
    } else {
      ctx.fillStyle = `rgba(255,255,255,${0.85 * tw})`;
      circle(ctx, x, s.y, s.s);
      if (s.s > 2) {
        ctx.fillRect(x - s.s * 3, s.y - 0.4, s.s * 6, 0.8);
        ctx.fillRect(x - 0.4, s.y - s.s * 3, 0.8, s.s * 6);
      }
    }
  }
  // knots: wrong stars clumped together, too close to each other
  for (const k of knots) {
    const x = ((k.x - camX * 0.03) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2;
    if (x < -40 || x > W + 40) continue;
    const r = mulberry32(k.seed);
    glow(ctx, x, k.y, 26, 20, '200,210,255', 0.18);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < k.n; i++) circle(ctx, x + (r() - 0.5) * 22, k.y + (r() - 0.5) * 16, 0.8 + r() * 1.4);
  }
  // high aurora, far off
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let j = 0; j < 2; j++) {
    for (let x = -20; x < W + 20; x += 14) {
      const wx = x + camX * 0.04;
      const y = 26 + j * 40 + Math.sin(wx * 0.006 + time * 0.2 + j * 2) * 18;
      const a = (0.05 + 0.04 * Math.sin(wx * 0.02 + time * 0.7 + j)) * aur;
      ctx.fillStyle = `hsla(${j ? 290 : 155},80%,65%,${a})`;
      ctx.fillRect(x, y, 14, 90);
    }
  }
  ctx.restore();
  // the sea of cloud far below, and the peaks' tops poking up through it
  ctx.fillStyle = vgrad(ctx, 'cloud', HORIZON - 30, H, [[0, '#b8b4dc'], [0.4, '#d4d4ee'], [1, '#e8ecf8']]);
  ctx.fillRect(0, HORIZON - 10, W, H - HORIZON + 10);
  const off = -((camX * 0.08) % 2660);
  for (const rep of [0, 2660]) {
    for (const p of peaks) {
      const x = off + rep + p.x;
      if (x < -p.w || x > W + p.w) continue;
      ctx.fillStyle = '#eef0fa';
      ctx.beginPath();
      ctx.moveTo(x - p.w / 2, HORIZON + 4);
      ctx.lineTo(x - p.w * 0.1, HORIZON - p.h);
      ctx.lineTo(x + p.w * 0.06, HORIZON - p.h + 6);
      ctx.lineTo(x + p.w / 2, HORIZON + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(120,120,190,0.3)';
      ctx.beginPath();
      ctx.moveTo(x + p.w * 0.06, HORIZON - p.h + 6);
      ctx.lineTo(x + p.w / 2, HORIZON + 4);
      ctx.lineTo(x + p.w * 0.1, HORIZON + 4);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(214,214,240,0.7)';
  for (let i = 0; i < 8; i++) ellipse(ctx, ((i * 170 - camX * 0.12 + time * 3) % (W + 300) + W + 300) % (W + 300) - 150, HORIZON + 6 + (i % 3) * 5, 110, 9);
}

// The aurora's curtains, hanging in the room itself, their hems right down at the snow: ripples of green
// (a violet one now and then), brightest at the hem, the bottom edge rippling like cloth
function drawCurtains(ctx, L, R, time, aur) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const c of curtains) {
    if (!visible(c.x - 40, c.x + c.w + 40, L, R)) continue;
    const step = 10;
    for (let x = c.x; x < c.x + c.w; x += step) {
      const k = (x - c.x) / c.w, edge = Math.sin(k * Math.PI);
      const hem = c.hem + Math.sin(x * 0.02 + time * c.v * 3 + c.p) * 18 + Math.sin(x * 0.007 + time * 0.4) * 22;
      const sway = Math.sin(time * c.v + x * 0.004 + c.p) * 10;
      const a = (0.08 + 0.06 * Math.sin(x * 0.03 + time * 1.1 + c.p)) * edge * aur;
      ctx.fillStyle = `hsla(${c.hue},85%,62%,${a})`;
      ctx.fillRect(x + sway, c.top, step, hem - c.top);
      ctx.fillStyle = `hsla(${c.hue},90%,72%,${a * 1.3})`;
      ctx.fillRect(x + sway, hem - 60, step, 36);
      ctx.fillStyle = `hsla(${c.hue},95%,80%,${a * 1.8})`;
      ctx.fillRect(x + sway, hem - 24, step, 24);
    }
  }
  ctx.restore();
}

// The snowfield's back: pale dunes rising behind the path, tinted green underneath by the lights
function drawSnowfield(ctx, camX, L, R, time) {
  const f = 0.35, span = 2800, off = -((camX * f) % span) + camX;
  ctx.fillStyle = '#d8e2f4';
  ctx.fillRect(L, 372, R - L, GROUND - 372);
  for (const rep of [-span, 0, span]) {
    for (const d of dunes) {
      const x = off + rep + d.x;
      if (!visible(x - d.w, x + d.w, L, R)) continue;
      ctx.fillStyle = '#e6eefa';
      ctx.beginPath();
      ctx.ellipse(x, 374, d.w / 2, d.h, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(150,230,200,0.12)';
      ctx.beginPath();
      ctx.ellipse(x - d.w * 0.1, 372, d.w * 0.3, d.h * 0.4, 0, Math.PI, 0);
      ctx.fill();
    }
  }
  ctx.fillStyle = SNOW;
  ctx.fillRect(L, 396, R - L, GROUND - 396);
  ctx.strokeStyle = 'rgba(110,130,190,0.25)';
  ctx.lineWidth = 1.5;
  for (let x = Math.floor(L / 110) * 110; x < R; x += 110) {
    ctx.beginPath();
    ctx.moveTo(x, 408 + (x % 3) * 6);
    ctx.quadraticCurveTo(x + 30, 404 + (x % 3) * 6, x + 60, 410 + (x % 3) * 6);
    ctx.stroke();
  }
}

// A faceted shard of starglass (where the Wyrm's kind fell, the snow melted and froze again as glass): pale,
// see-through, a dim light caught inside
function glassShard(ctx, x, y, w, h, time, p = 0) {
  ctx.fillStyle = 'rgba(207,228,255,0.75)';
  ctx.strokeStyle = GLASS_LINE;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.08, y + h * 0.15);
  ctx.lineTo(x + w * 0.5, y);
  ctx.lineTo(x + w * 0.92, y + h * 0.12);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.14, y + h * 0.18);
  ctx.lineTo(x + w * 0.42, y + h * 0.06);
  ctx.lineTo(x + w * 0.3, y + h - 4);
  ctx.lineTo(x + w * 0.12, y + h - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(127,159,208,0.35)';
  ctx.fillRect(x + w * 0.7, y + h * 0.16, w * 0.22, h * 0.8);
  const a = 0.45 + 0.25 * Math.sin(time * 1.4 + p + x * 0.01);
  glow(ctx, x + w * 0.55, y + h * 0.45, 10, 10, '220,235,255', a);
  ctx.fillStyle = `rgba(255,255,255,${a + 0.2})`;
  circle(ctx, x + w * 0.55, y + h * 0.45, 1.6);
}
function drawShard(ctx, s, time) {
  ctx.save();
  ctx.translate(s.x, GROUND + 4);
  ctx.rotate(s.lean);
  glassShard(ctx, -s.w / 2, -s.h, s.w, s.h, time, s.x);
  ctx.restore();
}

// The Wyrmfall's hollow: a long shallow trench melted into the snow, frozen to glass, faintly lit from under
function drawHollow(ctx, L, R, time) {
  const x0 = FALL_X + 120, x1 = HEIGHTS_W - 260, y = GROUND;
  if (!visible(x0, x1, L, R)) return;
  glow(ctx, (x0 + x1) / 2, y - 10, (x1 - x0) * 0.55, 60, '200,220,255', 0.25 + 0.05 * Math.sin(time * 0.6));
  ctx.fillStyle = 'rgba(190,214,250,0.8)';
  ctx.beginPath();
  ctx.moveTo(x0, y - 6);
  ctx.quadraticCurveTo((x0 + x1) / 2, y - 30, x1, y - 6);
  ctx.lineTo(x1, y);
  ctx.lineTo(x0, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + 20, y - 9);
  ctx.quadraticCurveTo((x0 + x1) / 2, y - 31, x1 - 20, y - 9);
  ctx.stroke();
}

// A wind-carved cornice you can stand on: a pillar of packed snow with an overhanging lip curling east
function drawCornice(ctx, p, time) {
  const { x, y, w } = p;
  // the pillar: blue ice under packed snow
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 14, GROUND);
  ctx.lineTo(x + 20, y + 14);
  ctx.lineTo(x + w - 30, y + 14);
  ctx.lineTo(x + w - 18, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ICE_L;
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 18);
  ctx.lineTo(x + 44, y + 18);
  ctx.lineTo(x + 36, GROUND - 2);
  ctx.lineTo(x + 20, GROUND - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(111,148,200,0.5)';
  ctx.fillRect(x + w - 50, y + 18, 18, GROUND - y - 20);
  // the snow top and its curling lip
  ctx.fillStyle = SNOW;
  ctx.strokeStyle = SNOW_S;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 8);
  ctx.quadraticCurveTo(x - 6, y - 6, x + 10, y - 5);
  ctx.lineTo(x + w - 10, y - 6);
  ctx.quadraticCurveTo(x + w + 20, y - 6, x + w + 18, y + 10);
  ctx.quadraticCurveTo(x + w + 6, y + 22, x + w - 8, y + 14);
  ctx.lineTo(x + 4, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,240,210,0.25)'; // the aurora's light on the lip
  ellipse(ctx, x + w * 0.5, y - 2, w * 0.35, 3);
  ctx.fillStyle = 'rgba(200,232,250,0.9)';
  for (let i = 0; i < w / 26; i++) {
    const ix = x + 16 + i * 26, len = 6 + ((i * 7) % 10);
    ctx.beginPath();
    ctx.moveTo(ix - 2.5, y + 15);
    ctx.lineTo(ix + 2.5, y + 15);
    ctx.lineTo(ix, y + 15 + len);
    ctx.closePath();
    ctx.fill();
  }
}

// A great slab of starglass standing up out of the snow, flat on top (a platform), a star caught inside
function drawStarglass(ctx, p, time) {
  const { x, y, w } = p;
  glassShard(ctx, x + 10, y + 4, w - 20, GROUND - y, time, x);
  ctx.fillStyle = 'rgba(232,242,255,0.95)';
  ctx.strokeStyle = GLASS_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 11, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SNOW;
  ellipse(ctx, x + w * 0.3, y - 4, w * 0.22, 3);
  ellipse(ctx, x + w * 0.75, y - 3, w * 0.12, 2.5);
}

// Liv's Reach: an ice spire over the Low Lights, so high the aurora's hem brushes it. On top, a cutters' marker
// pole with a small red mitten frozen to it, and LIV scratched in the ice with a row of little stars
function drawReach(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  // the spire, rising from the cornice below (its top is the platform)
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, 252);
  ctx.lineTo(x + 10, y + 6);
  ctx.lineTo(x + w - 8, y + 6);
  ctx.lineTo(x + w - 2, 252);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ICE_L;
  ctx.fillRect(x + 14, y + 10, 12, 236 - y);
  ctx.fillStyle = SNOW;
  ctx.strokeStyle = SNOW_S;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 12, 6);
  ctx.fill();
  ctx.stroke();
  // LIV and the little stars, scratched in the spire's face
  ctx.strokeStyle = 'rgba(62,94,148,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - 14, y + 22);
  ctx.lineTo(cx - 14, y + 32);
  ctx.lineTo(cx - 8, y + 32);
  ctx.moveTo(cx - 3, y + 22);
  ctx.lineTo(cx - 3, y + 32);
  ctx.moveTo(cx + 3, y + 22);
  ctx.lineTo(cx + 7, y + 32);
  ctx.lineTo(cx + 11, y + 22);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const sx = cx - 16 + i * 8, sy = y + 42;
    ctx.beginPath();
    ctx.moveTo(sx - 2, sy);
    ctx.lineTo(sx + 2, sy);
    ctx.moveTo(sx, sy - 2);
    ctx.lineTo(sx, sy + 2);
    ctx.stroke();
  }
  // the marker pole and the red mitten frozen to it
  glow(ctx, cx + 8, y - 30, 30, 26, '160,240,210', 0.25 + 0.08 * Math.sin(time * 1.2));
  ctx.fillStyle = WOOD;
  ctx.fillRect(cx + 6, y - 52, 3, 50);
  ctx.save();
  ctx.translate(cx + 10, y - 40);
  ctx.rotate(0.25 + Math.sin(time * 1.5) * 0.04);
  ctx.fillStyle = '#d0485a';
  ctx.strokeStyle = '#7a2434';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-1, 0, 11, 13, [5, 5, 3, 3]);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-1, 6, 3, 4, -0.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f4f0e8';
  ctx.fillRect(-1, 11, 11, 3);
  ctx.fillStyle = 'rgba(240,248,255,0.9)'; // rime on it
  ellipse(ctx, 5, 1, 5, 1.6);
  ctx.restore();
}

// The cutters' windbreak at the Last Step: a curved wall of cut snow blocks with a plank bench behind it,
// a kettle on a little stove, where they rest after the climb
function drawWindbreak(ctx, x, time) {
  const b = GROUND;
  ctx.fillStyle = SNOW;
  ctx.strokeStyle = SNOW_S;
  ctx.lineWidth = 1.6;
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 4 - row; i++) {
      const bx = x + row * 13 + i * 26, by = b - 18 - row * 17;
      ctx.beginPath();
      ctx.roundRect(bx, by, 25, 17, 3);
      ctx.fill();
      ctx.stroke();
    }
  }
  // the bench and the stove
  ctx.fillStyle = WOOD;
  ctx.fillRect(x + 100, b - 22, 52, 5);
  ctx.fillRect(x + 104, b - 17, 4, 17);
  ctx.fillRect(x + 144, b - 17, 4, 17);
  ctx.fillStyle = '#4a4a56';
  ctx.beginPath();
  ctx.roundRect(x + 160, b - 22, 20, 22, 3);
  ctx.fill();
  ctx.fillStyle = `rgba(255,170,90,${0.6 + 0.2 * Math.sin(time * 8)})`;
  ctx.fillRect(x + 165, b - 12, 10, 5);
  ctx.fillStyle = '#6a7484';
  ctx.beginPath();
  ctx.roundRect(x + 162, b - 34, 16, 12, 4);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.4 + i / 3) % 1;
    ctx.fillStyle = `rgba(240,244,252,${0.45 * (1 - k)})`;
    circle(ctx, x + 172 + Math.sin(time + i) * 4, b - 38 - k * 40, 3 + k * 6);
  }
}

// The floor: hard snow, wind-ridged, a faint green sheen from the lights; glassy in the Wyrmfall
function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = vgrad(ctx, 'floor', GROUND, H, [[0, '#eef4ff'], [0.4, '#c8d6ee'], [1, '#8ea2c8']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = SNOW;
  ctx.fillRect(L, GROUND - 2, R - L, 10);
  ctx.fillStyle = 'rgba(150,240,200,0.15)';
  ctx.fillRect(L, GROUND + 8, R - L, 3);
  ctx.strokeStyle = 'rgba(100,120,180,0.35)';
  ctx.lineWidth = 1.4;
  for (const r of ridges) {
    if (!visible(r.x, r.x + r.w, L, R)) continue;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y);
    ctx.quadraticCurveTo(r.x + r.w * 0.5, r.y - 4, r.x + r.w, r.y + 1);
    ctx.stroke();
  }
  // the Wyrmfall's glassy floor
  const g0 = Math.max(L, FALL_X), g1 = Math.min(R, HEIGHTS_W);
  if (g1 > g0) {
    ctx.fillStyle = 'rgba(190,214,250,0.45)';
    ctx.fillRect(g0, GROUND + 2, g1 - g0, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let x = Math.floor(g0 / 60) * 60; x < g1; x += 60) ctx.fillRect(x + 10, GROUND + 10 + (x % 7), 26, 1.5);
  }
}

// The way back down: the top of the icefall, the new steps going down over the edge, the rope on its pegs and
// the cutters' red flag; the Glacier's top far below
function drawStepsTop(ctx, time) {
  const x = HEIGHTS_EXIT_X, b = GROUND;
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-160, b + 90);
  ctx.lineTo(-160, b - 10);
  ctx.lineTo(x - 30, b - 6);
  ctx.lineTo(x - 6, b + 90);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ICE_L;
  for (let i = 0; i < 5; i++) ctx.fillRect(x - 40 - i * 18, b - 2 + i * 16, 26, 5);
  ctx.strokeStyle = '#a07e58';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 14, b - 30);
  ctx.quadraticCurveTo(x - 30, b - 10, x - 100, b + 70);
  ctx.stroke();
  ctx.fillStyle = '#5a5a66';
  ctx.fillRect(x + 11, b - 36, 6, 12);
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(x - 20, b - 70, 3, 64);
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.moveTo(x - 17, b - 70);
  ctx.quadraticCurveTo(x - 4, b - 66 + Math.sin(time * 4) * 3, x + 4, b - 62 + Math.sin(time * 4 + 1) * 4);
  ctx.lineTo(x - 17, b - 54);
  ctx.closePath();
  ctx.fill();
}

// The east end: the crater's rim, where the Wyrm's kind came down hardest: the biggest shard of starglass of
// all, leaning over a bank of snow, a dim star caught deep inside it
function drawEdge(ctx, time) {
  const x = HEIGHTS_W - 110, b = GROUND;
  glow(ctx, x, b - 160, 200, 200, '200,220,255', 0.22 + 0.05 * Math.sin(time * 0.5));
  ctx.save();
  ctx.translate(x + 30, b + 6);
  ctx.rotate(-0.12);
  glassShard(ctx, -70, -330, 140, 330, time, 7);
  ctx.restore();
  ctx.save();
  ctx.translate(x - 70, b + 4);
  ctx.rotate(0.3);
  glassShard(ctx, -22, -140, 44, 140, time, 3);
  ctx.restore();
  ctx.fillStyle = SNOW;
  ctx.strokeStyle = SNOW_S;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 140, b + 4);
  ctx.quadraticCurveTo(x - 60, b - 40, x + 40, b - 34);
  ctx.quadraticCurveTo(x + 120, b - 30, x + 160, b - 10);
  ctx.lineTo(x + 160, b + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// The zones' markers: a cutters' marker wand with a red rag, and a little board with the name and a level chip
function drawZoneWand(ctx, x, z, i, time) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.fillStyle = WOOD_D;
  ctx.fillRect(x - tw / 2 + 10, GROUND - 92, 5, 92);
  ctx.fillRect(x + tw / 2 - 15, GROUND - 92, 5, 92);
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.moveTo(x + tw / 2 - 10, GROUND - 92);
  ctx.quadraticCurveTo(x + tw / 2 + 2, GROUND - 88 + Math.sin(time * 4) * 2, x + tw / 2 + 8, GROUND - 84 + Math.sin(time * 4 + 1) * 3);
  ctx.lineTo(x + tw / 2 - 10, GROUND - 80);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 66);
  ctx.fillStyle = '#c8a87e';
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 46, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -6, 15, '#3e2c22');
  const red = i === HEIGHTS_ZONES.length - 1;
  ctx.fillStyle = red ? '#d0485a' : 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-32, 6, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 14.5, 11, red ? '#fffaf0' : '#3e2c22');
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - 2, -24, tw + 4, 8, 4);
  ctx.fill();
  ctx.restore();
}

// The way back down to the Glacier
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = WOOD;
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.6) * 0.03);
  ctx.fillStyle = '#e2bf8f';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(64, -12);
  ctx.lineTo(-58, -12);
  ctx.lineTo(-70, 0);
  ctx.lineTo(-58, 12);
  ctx.lineTo(64, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Down to the Glacier', -2, 1, 11, '#5b4a6b');
  ctx.fillStyle = SNOW;
  ellipse(ctx, 0, -12, 56, 3);
  ctx.restore();
}

// Diamond dust: tiny ice crystals hanging in the still air, catching the light
function drawDust(ctx, camX, time) {
  for (const d of dust) {
    const x = ((d.x - camX * 0.5 + Math.sin(time * 0.3 + d.p) * 12) % W + W) % W;
    const y = d.y + Math.sin(time * 0.5 + d.p) * d.v;
    const a = Math.max(0, Math.sin(time * 1.7 + d.p * 3));
    ctx.fillStyle = `rgba(255,255,255,${0.8 * a})`;
    ctx.fillRect(x - 0.5, y - 2.5, 1, 5);
    ctx.fillRect(x - 2.5, y - 0.5, 5, 1);
  }
}
