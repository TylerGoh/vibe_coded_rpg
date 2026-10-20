// Docs: docs/places/cliffs.md
// Greenhollow's east cliffs (room CLIFFS in src/shared/sim.js), past the very end of the Wildwood: a
// windy clifftop meadow with no mobs, a bench, a boulder, a telescope, and a fence at the sheer edge.
// The camera may look past the east wall (`viewPad`) over the drop to the open sea, where the other
// islands sit small on the horizon (src/distant.js). This room paints its own sky.
// Also here: the gap in the briar at the Wildwood's east end (drawCliffsPath) and the telescope's
// close-up view (Telescope), drawn over the game in screen space.
import { W, H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { CLIFFS_W, CLIFFS_EXIT_X, CLIFFS_SCOPE_X, CLIFFS_PLATFORMS, CLIFFS } from './shared/sim.js';
import { drawDistantIslands, drawLandmark } from './distant.js';

const GROUND = 450;
const HORIZON = 296; // the sea line, in screen space
const VIEW_W = CLIFFS_W + 380; // the room plus how far the camera may look past the edge (viewPad)
const INK = '#5b4a6b';
const SCOPE_RANGE = 54;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

const clouds = (() => {
  const r = mulberry32(131);
  return Array.from({ length: 7 }, (_, i) => ({ x: i * 260 + r() * 140, y: 40 + r() * 120, s: 0.5 + r() * 0.6 }));
})();
const birds = (() => {
  const r = mulberry32(133);
  return Array.from({ length: 6 }, () => ({ off: r() * 1600, y: 70 + r() * 170, v: 14 + r() * 20, s: 0.6 + r() * 0.5, p: r() * TAU }));
})();
const glints = (() => {
  const r = mulberry32(137);
  return Array.from({ length: 60 }, () => ({ x: r() * 2400, y: r(), w: 8 + r() * 24, p: r() * TAU }));
})();
const grass = (() => {
  const r = mulberry32(139);
  const out = [];
  for (let x = 170; x < CLIFFS_W - 30; x += 9 + r() * 16) out.push({ x, h: 14 + r() * 22, p: r() * TAU, flower: r() < 0.14 ? ['#ffb3c7', '#fff1a8', '#c9b6ff', '#ffffff'][Math.floor(r() * 4)] : null });
  return out;
})();
const streaks = (() => {
  const r = mulberry32(141);
  return Array.from({ length: 9 }, () => ({ y: 120 + r() * 300, off: r() * 2000, len: 40 + r() * 70, v: 120 + r() * 90 }));
})();
const TREES = [{ x: 330, s: 1 }, { x: 860, s: 0.8 }];

export const scopeNear = (me) => !!me && me.room === CLIFFS && me.grounded && !me.onPlat && Math.abs(me.x - CLIFFS_SCOPE_X) < SCOPE_RANGE;

// Everything behind the slimes. camX is the left edge of the view.
export function drawCliffs(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0); // sky and sea in screen space
  drawSky(ctx, camX, time);
  ctx.restore();

  const L = camX - 80, R = camX + viewW + 80;
  for (const t of TREES) if (visible(t.x - 120, t.x + 140, L, R)) drawTree(ctx, t, time);
  drawClifftop(ctx, Math.max(0, L), Math.min(CLIFFS_W, R));
  if (visible(CLIFFS_W - 40, CLIFFS_W + 200, L, R)) drawEdge(ctx, time);
  if (visible(0, 280, L, R)) drawBriar(ctx, time);
  for (const p of CLIFFS_PLATFORMS) {
    if (!visible(p.x - 30, p.x + p.w + 30, L, R)) continue;
    if (p.kind === 'bench') drawBench(ctx, p);
    else drawBoulder(ctx, p);
  }
  if (visible(CLIFFS_SCOPE_X - 70, CLIFFS_SCOPE_X + 70, L, R)) drawTelescope(ctx, CLIFFS_SCOPE_X, time);
  if (visible(CLIFFS_W - 120, CLIFFS_W + 10, L, R)) drawFence(ctx);
  drawGrass(ctx, L, R, time);
  drawStreaks(ctx, L, R, time);
}

function drawSky(ctx, camX, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#8fc8f0');
  sky.addColorStop(0.65, '#c8e6f7');
  sky.addColorStop(1, '#f6f0e6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  // the sun, low and to the south
  const sx = W - 120 - camX * 0.02, sy = 120;
  const g = ctx.createRadialGradient(sx, sy, 14, sx, sy, 140);
  g.addColorStop(0, 'rgba(255,246,210,0.9)');
  g.addColorStop(1, 'rgba(255,246,210,0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx - 140, sy - 140, 280, 280);
  ctx.fillStyle = '#fff4cc';
  circle(ctx, sx, sy, 30);

  // high clouds, slow
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const c of clouds) {
    const x = ((c.x - camX * 0.06 + time * 5) % (W + 300) + W + 300) % (W + 300) - 150;
    ellipse(ctx, x, c.y, 54 * c.s, 15 * c.s);
    ellipse(ctx, x + 26 * c.s, c.y - 9 * c.s, 34 * c.s, 15 * c.s);
    ellipse(ctx, x - 30 * c.s, c.y - 4 * c.s, 26 * c.s, 11 * c.s);
  }

  // the other islands: bigger and clearer than from the harbour, but still a very long way off
  drawDistantIslands(ctx, { from: 'green', scroll: camX, roomW: VIEW_W, time, horizon: HORIZON, haze: '#f2eee8', fade: 0.45, scale: 0.68, sky: 240 });

  // the open sea, all the way down: deeper the further below the clifftop it is
  const sea = ctx.createLinearGradient(0, HORIZON, 0, H);
  sea.addColorStop(0, '#a9d4e8');
  sea.addColorStop(0.35, '#6fb0d6');
  sea.addColorStop(1, '#3f80b4');
  ctx.fillStyle = sea;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(0, HORIZON, W, 1.5);
  for (const gl of glints) {
    const y = HORIZON + 6 + gl.y * gl.y * (H - HORIZON - 10);
    const x = ((gl.x - camX * (0.15 + gl.y * 0.6)) % W + W) % W;
    const a = 0.25 + 0.25 * Math.sin(time * 1.4 + gl.p);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, gl.w * (0.4 + gl.y), 1.6);
  }

  // seabirds riding the wind
  ctx.strokeStyle = 'rgba(91,74,107,0.55)';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (const b of birds) {
    const x = ((b.off + time * b.v - camX * 0.2) % (W + 200) + W + 200) % (W + 200) - 100;
    const y = b.y + Math.sin(time * 0.7 + b.p) * 10, f = Math.sin(time * 4 + b.p) * 4 * b.s;
    ctx.beginPath();
    ctx.moveTo(x - 8 * b.s, y - f);
    ctx.quadraticCurveTo(x - 3 * b.s, y - 4 * b.s, x, y);
    ctx.quadraticCurveTo(x + 3 * b.s, y - 4 * b.s, x + 8 * b.s, y - f);
    ctx.stroke();
  }
}

// The clifftop: a band of grass over pale chalky rock, to the edge
function drawClifftop(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = '#e6dccb';
  ctx.fillRect(L, GROUND + 14, R - L, H - GROUND);
  ctx.fillStyle = '#d6c9b4';
  for (let x = Math.floor(L / 60) * 60; x < R; x += 60) {
    ellipse(ctx, x + 20, GROUND + 50 + ((x / 60) % 3) * 14, 22, 5);
  }
  ctx.fillStyle = '#7fcf6e';
  ctx.fillRect(L, GROUND, R - L, 16);
  ctx.fillStyle = '#a3e48d';
  ctx.fillRect(L, GROUND, R - L, 4);
  ctx.fillStyle = '#6cb85c';
  for (let x = Math.floor(L / 26) * 26; x < R; x += 26) {
    ctx.beginPath();
    ctx.ellipse(x + 13, GROUND + 16, 13, 6, 0, 0, Math.PI);
    ctx.fill();
  }
}

// The sheer edge: chalk cliff falling away to the sea, surf far below
function drawEdge(ctx, time) {
  const x = CLIFFS_W;
  ctx.fillStyle = '#efe6d6';
  ctx.beginPath();
  ctx.moveTo(x - 4, GROUND);
  ctx.quadraticCurveTo(x + 10, GROUND + 4, x + 14, GROUND + 18);
  ctx.lineTo(x + 8, GROUND + 50);
  ctx.lineTo(x + 22, GROUND + 70);
  ctx.lineTo(x + 18, H);
  ctx.lineTo(x - 4, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d2c4ae';
  ctx.beginPath();
  ctx.moveTo(x + 14, GROUND + 18);
  ctx.lineTo(x + 8, GROUND + 50);
  ctx.lineTo(x + 22, GROUND + 70);
  ctx.lineTo(x + 18, H);
  ctx.lineTo(x + 8, H);
  ctx.lineTo(x + 2, GROUND + 60);
  ctx.closePath();
  ctx.fill();
  // grass lip hanging over
  ctx.fillStyle = '#7fcf6e';
  ellipse(ctx, x + 4, GROUND + 4, 14, 6, 0.2);
  // surf breaking at the cliff foot, far below
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.35 + i / 3) % 1;
    ctx.globalAlpha = 1 - k;
    ctx.beginPath();
    ctx.ellipse(x + 26, H - 6, 12 + k * 60, 4 + k * 4, 0, Math.PI, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// A low wooden fence along the edge (the room ends here)
function drawFence(ctx) {
  const x0 = CLIFFS_W - 100, x1 = CLIFFS_W - 8;
  ctx.fillStyle = '#a0704a';
  for (let x = x0; x <= x1; x += 46) {
    ctx.beginPath();
    ctx.roundRect(x - 5, GROUND - 48, 10, 50, 3);
    ctx.fill();
  }
  ctx.fillStyle = '#b8845a';
  ctx.beginPath();
  ctx.roundRect(x0 - 8, GROUND - 42, x1 - x0 + 16, 7, 3);
  ctx.roundRect(x0 - 8, GROUND - 22, x1 - x0 + 16, 7, 3);
  ctx.fill();
  // a little sign on it
  ctx.save();
  ctx.translate(x0 + 30, GROUND - 62);
  ctx.rotate(-0.05);
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#c99b6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-36, -11, 72, 22, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Mind the edge', 0, 0.5, 10, INK);
  ctx.restore();
}

// The way back: the briar closing in at the west end, with the gap you came through
function drawBriar(ctx, time) {
  const x = CLIFFS_EXIT_X;
  ctx.fillStyle = '#5e4a56';
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(x + 40, 0);
  ctx.quadraticCurveTo(x + 120, 120, x + 70, GROUND - 170);
  ctx.quadraticCurveTo(x + 150, GROUND - 120, x + 190, GROUND + 2);
  ctx.lineTo(-10, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  // the gap: dim green light from the woods
  const g = ctx.createRadialGradient(x, GROUND - 60, 10, x, GROUND - 60, 90);
  g.addColorStop(0, 'rgba(120,150,110,0.95)');
  g.addColorStop(1, 'rgba(94,74,86,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, GROUND - 60, 46, 66, 0, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 6; i++) briarArc(ctx, x - 40 + i * 30, 70 + i * 22, 130 - i * 6, i, time);
  arrowSign(ctx, x + 70, GROUND - 98, -1, 'The Wildwood', time);
}

function briarArc(ctx, x, w, h, seed, time) {
  const base = GROUND + 2, sway = Math.sin(time * 0.8 + seed) * 2;
  ctx.strokeStyle = '#7a4f66';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const px = x + w * t, py = base - Math.sin(t * Math.PI) * (h + sway);
    t ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#e8506a';
  circle(ctx, x + w * 0.5, base - h - sway + 6, 2.6);
}

// a wooden arrow sign on a post
function arrowSign(ctx, x, y, dir, label, time) {
  ctx.fillStyle = '#a0704a';
  ctx.beginPath();
  ctx.roundRect(x - 4, y, 8, GROUND - y, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 1.2 + x) * 0.02);
  ctx.font = "700 12px Fredoka, 'Trebuchet MS', sans-serif";
  const w = ctx.measureText(label).width + 30;
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#c99b6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (dir > 0) {
    ctx.moveTo(-w / 2, -10);
    ctx.lineTo(w / 2 - 6, -10);
    ctx.lineTo(w / 2 + 6, 1);
    ctx.lineTo(w / 2 - 6, 12);
    ctx.lineTo(-w / 2, 12);
  } else {
    ctx.moveTo(w / 2, -10);
    ctx.lineTo(-w / 2 + 6, -10);
    ctx.lineTo(-w / 2 - 6, 1);
    ctx.lineTo(-w / 2 + 6, 12);
    ctx.lineTo(w / 2, 12);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, label, dir * 3, 1.5, 12, INK);
  ctx.restore();
}

// Windswept trees, leaning away from the sea
function drawTree(ctx, t, time) {
  const s = t.s, sway = Math.sin(time * 1.1 + t.x) * 3;
  ctx.save();
  ctx.translate(t.x, GROUND + 2);
  ctx.strokeStyle = '#8a6a50';
  ctx.lineWidth = 14 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-10 * s, -80 * s, -50 * s + sway, -140 * s);
  ctx.stroke();
  ctx.lineWidth = 7 * s;
  ctx.beginPath();
  ctx.moveTo(-14 * s, -70 * s);
  ctx.quadraticCurveTo(-30 * s, -96 * s, -76 * s + sway, -104 * s);
  ctx.stroke();
  ctx.fillStyle = '#6cbf72';
  ellipse(ctx, -60 * s + sway, -150 * s, 62 * s, 30 * s, -0.12);
  ellipse(ctx, -96 * s + sway, -112 * s, 40 * s, 20 * s, -0.1);
  ctx.fillStyle = '#86d48a';
  ellipse(ctx, -46 * s + sway, -160 * s, 40 * s, 16 * s, -0.12);
  ctx.restore();
}

function drawBoulder(ctx, p) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.fillStyle = 'rgba(40,25,60,0.15)';
  ellipse(ctx, cx, GROUND + 2, w * 0.6, 8);
  ctx.fillStyle = '#b4aab8';
  ctx.beginPath();
  ctx.moveTo(x - 8, GROUND + 2);
  ctx.quadraticCurveTo(x - 10, y + 20, x + 14, y + 2);
  ctx.lineTo(x + w - 14, y);
  ctx.quadraticCurveTo(x + w + 14, y + 26, x + w + 10, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ccc3d0';
  ellipse(ctx, x + w * 0.3, y + 26, 18, 30, 0.2);
  ctx.fillStyle = '#7fcf6e';
  ctx.beginPath();
  ctx.roundRect(x + 4, y - 4, w - 8, 10, 5);
  ctx.fill();
}

function drawBench(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = 'rgba(40,25,60,0.15)';
  ellipse(ctx, x + w / 2, GROUND + 2, w * 0.55, 6);
  ctx.fillStyle = '#8f6240';
  for (const lx of [x + 12, x + w - 18]) ctx.fillRect(lx, y + 4, 6, GROUND - y - 2);
  ctx.fillStyle = '#b8845a';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 8, 3);
  ctx.fill();
  // the backrest, facing the sea
  ctx.fillStyle = '#a0704a';
  ctx.fillRect(x + 6, y - 30, 5, 30);
  ctx.fillRect(x + w - 11, y - 30, 5, 30);
  ctx.fillStyle = '#b8845a';
  ctx.beginPath();
  ctx.roundRect(x + 2, y - 30, w - 4, 7, 3);
  ctx.roundRect(x + 2, y - 18, w - 4, 7, 3);
  ctx.fill();
  // a little brass plate
  ctx.fillStyle = '#e0b860';
  ctx.fillRect(x + w / 2 - 12, y - 27, 24, 4);
}

function drawTelescope(ctx, x, time) {
  const base = GROUND + 2;
  ctx.fillStyle = 'rgba(40,25,60,0.15)';
  ellipse(ctx, x, base, 30, 5);
  // tripod
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, base - 58);
  ctx.lineTo(x - 22, base);
  ctx.moveTo(x, base - 58);
  ctx.lineTo(x + 20, base);
  ctx.moveTo(x, base - 58);
  ctx.lineTo(x + 2, base);
  ctx.stroke();
  // the brass tube, pointing out to sea, nodding a touch in the wind
  ctx.save();
  ctx.translate(x, base - 62);
  ctx.rotate(-0.32 + Math.sin(time * 0.9) * 0.02);
  ctx.fillStyle = '#c9963c';
  ctx.beginPath();
  ctx.roundRect(-30, -7, 46, 14, 4);
  ctx.fill();
  ctx.fillStyle = '#e0b860';
  ctx.beginPath();
  ctx.roundRect(14, -9, 30, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#f2d890';
  ctx.fillRect(-26, -5, 36, 3);
  ctx.fillStyle = '#5b6f8a';
  ellipse(ctx, 44, 0, 3, 8);
  ctx.fillStyle = '#8f6a2a';
  ctx.fillRect(-34, -5, 5, 10);
  ctx.restore();
  // its little sign
  ctx.save();
  ctx.translate(x - 46, base - 30);
  ctx.fillStyle = '#a0704a';
  ctx.fillRect(-2, 0, 4, 30);
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#c99b6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-30, -22, 60, 24, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Telescope', 0, -14, 9, INK);
  text(ctx, 'free to look', 0, -4, 8, '#8a7a6a');
  ctx.restore();
}

function drawGrass(ctx, L, R, time) {
  ctx.lineCap = 'round';
  for (const g of grass) {
    if (g.x < L || g.x > R) continue;
    const bend = 5 + Math.sin(time * 2 + g.p + g.x * 0.01) * 4; // the wind blows inland
    ctx.strokeStyle = '#5fb85a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, GROUND + 3);
    ctx.quadraticCurveTo(g.x - bend * 0.3, GROUND - g.h * 0.6, g.x - bend, GROUND - g.h);
    ctx.moveTo(g.x + 4, GROUND + 3);
    ctx.quadraticCurveTo(g.x + 3 - bend * 0.3, GROUND - g.h * 0.4, g.x + 4 - bend * 0.8, GROUND - g.h * 0.75);
    ctx.stroke();
    if (g.flower) {
      ctx.fillStyle = g.flower;
      circle(ctx, g.x - bend, GROUND - g.h, 3.2);
      ctx.fillStyle = '#ffcf4d';
      circle(ctx, g.x - bend, GROUND - g.h, 1.3);
    }
  }
}

// thin streaks of wind blowing in off the sea
function drawStreaks(ctx, L, R, time) {
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  for (const s of streaks) {
    const span = R - L + 400;
    const x = R + 200 - (((s.off + time * s.v) % span) + span) % span;
    ctx.beginPath();
    ctx.moveTo(x, s.y);
    ctx.quadraticCurveTo(x + s.len / 2, s.y - 4, x + s.len, s.y);
    ctx.stroke();
  }
}

// ——— the Wildwood end: the gap in the briar, with daylight and a sign ———
export function drawCliffsPath(ctx, x, groundY, time) {
  ctx.save();
  // open sky through the gap
  const g = ctx.createRadialGradient(x, groundY - 70, 10, x, groundY - 70, 130);
  g.addColorStop(0, 'rgba(230,246,255,1)');
  g.addColorStop(0.55, 'rgba(200,232,250,0.85)');
  g.addColorStop(1, 'rgba(200,232,250,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, groundY - 70, 52, 82, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(160,210,240,0.9)';
  ctx.fillRect(x - 40, groundY - 40, 80, 3); // a sliver of sea through the gap
  for (let i = 0; i < 5; i++) briarArcAt(ctx, x - 70 + i * 12, groundY, 60 + i * 6, 120 + (i % 2) * 30, i, time);
  for (let i = 0; i < 4; i++) briarArcAt(ctx, x + 10 + i * 12, groundY, 60, 110 + (i % 2) * 34, i + 7, time);
  arrowSign(ctx, x - 70, groundY - 96, 1, 'Sea cliffs', time);
  ctx.restore();
}
// (drawn against any ground line: the briar arcs above use the clifftop's)
function briarArcAt(ctx, x, base, w, h, seed, time) {
  const sway = Math.sin(time * 0.8 + seed) * 2;
  ctx.strokeStyle = '#7a4f66';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const px = x + w * t, py = base + 2 - Math.sin(t * Math.PI) * (h + sway);
    t ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
}

// ——— the telescope's view (screen space, over everything) ———
// Swing left and right between the three landmarks you can see from here. Captions stay at canon Tier 0
// (story/canon.md): names and what a sailor would tell you, nothing of the history.
const VIEWS = [
  { key: 'frost', name: 'Frostpeak, far to the north', s: 1.45, line: 'Snow on every peak, and coloured lights rippling over them even by day. Captain Brine sails there, when the lighthouse is lit.' },
  { key: 'citadel', name: 'Something in the sky', s: 2.4, sky: 34, line: 'A pale island hanging over the middle of the sea, towers and all. Clouds drift. This does not.' },
  { key: 'ember', name: 'Emberdeep, far to the south', s: 1.6, line: 'A volcano with a smoke column you could set a clock by. The sea round it steams.' },
];
const LENS_R = 196, LENS_Y = H / 2 - 34;

export class Telescope {
  constructor() {
    this.open = false;
    this.view = 0; // which landmark you're looking at
    this.pos = 0; // where the tube points, easing toward `view`
  }

  get isOpen() {
    return this.open;
  }

  show() {
    this.open = true;
    this.pos = this.view;
  }

  close() {
    this.open = false;
  }

  turn(d) {
    this.view = clamp(this.view + d, 0, VIEWS.length - 1);
  }

  // a tap or click while looking: the sides swing the tube, the middle steps back
  tap(fx) {
    if (fx < 0.3) this.turn(-1);
    else if (fx > 0.7) this.turn(1);
    else this.close();
  }

  update(dt) {
    this.pos += (this.view - this.pos) * Math.min(1, dt * 5);
  }

  draw(ctx, time, touch) {
    const cx = W / 2, cy = LENS_Y, horizon = cy + 92;
    ctx.save();
    ctx.fillStyle = 'rgba(29,26,42,0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(cx, cy, LENS_R, 0, TAU);
    ctx.clip();
    const sky = ctx.createLinearGradient(0, cy - LENS_R, 0, horizon);
    sky.addColorStop(0, '#9ccbee');
    sky.addColorStop(1, '#f2ece4');
    ctx.fillStyle = sky;
    ctx.fillRect(cx - LENS_R, cy - LENS_R, LENS_R * 2, horizon - cy + LENS_R);
    const sea = ctx.createLinearGradient(0, horizon, 0, cy + LENS_R);
    sea.addColorStop(0, '#a3cfe4');
    sea.addColorStop(1, '#5c9cc8');
    ctx.fillStyle = sea;
    ctx.fillRect(cx - LENS_R, horizon, LENS_R * 2, LENS_R);
    // the three landmarks side by side; swinging slides between them
    VIEWS.forEach((v, i) => {
      const x = cx + (i - this.pos) * 560;
      if (Math.abs(x - cx) > LENS_R + 300) return;
      drawLandmark(ctx, v.key, x, horizon, v.s, { time, haze: '#f2ece4', fade: 0.18, sky: v.sky, night: 0.25 });
    });
    // waves in the foreground
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const y = horizon + 12 + i * 12, x = cx - LENS_R + ((i * 97 + time * (14 + i * 6) - this.pos * 300) % (LENS_R * 2) + LENS_R * 2) % (LENS_R * 2);
      ctx.beginPath();
      ctx.moveTo(x - 14 - i * 2, y);
      ctx.quadraticCurveTo(x, y - 3, x + 14 + i * 2, y);
      ctx.stroke();
    }
    // the lens: darker toward the rim
    const vig = ctx.createRadialGradient(cx, cy, LENS_R * 0.6, cx, cy, LENS_R);
    vig.addColorStop(0, 'rgba(20,16,30,0)');
    vig.addColorStop(1, 'rgba(20,16,30,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(cx - LENS_R, cy - LENS_R, LENS_R * 2, LENS_R * 2);
    ctx.restore();
    // the brass rim
    ctx.strokeStyle = '#c9963c';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, LENS_R + 5, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#f2d890';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, LENS_R + 1, Math.PI * 1.1, Math.PI * 1.6);
    ctx.stroke();
    // swing arrows (drawn as paths: unicode arrows aren't in every font)
    for (const d of [-1, 1]) {
      const can = d < 0 ? this.view > 0 : this.view < VIEWS.length - 1;
      ctx.globalAlpha = can ? 0.95 : 0.25;
      chevron(ctx, cx + d * (LENS_R + 56), cy, d);
    }
    ctx.globalAlpha = 1;
    // the caption
    const v = VIEWS[this.view];
    text(ctx, v.name, cx, cy + LENS_R + 34, 19, '#fff4cc');
    wrap(ctx, v.line, cx, cy + LENS_R + 58, touch ? 500 : 640, 14, '#e8e0f0'); // (on phones, clear of the touch pads)
    // how to use it: inside the lens on phones (the top edge has the touch buttons)
    if (touch) text(ctx, 'tap the sides to swing  ·  tap the middle to step back', cx, cy + LENS_R - 22, 12, 'rgba(255,255,255,0.8)');
    else text(ctx, '← →  swing the telescope  ·  E or Esc  step back', cx, 22, 13, 'rgba(232,224,240,0.7)');
  }
}

function chevron(ctx, x, y, dir) {
  ctx.fillStyle = 'rgba(255,250,240,0.12)';
  circle(ctx, x, y, 26);
  ctx.strokeStyle = '#fff4cc';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - dir * 5, y - 11);
  ctx.lineTo(x + dir * 7, y);
  ctx.lineTo(x - dir * 5, y + 11);
  ctx.stroke();
}

function wrap(ctx, str, x, y, maxW, size, color) {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  const words = str.split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  lines.push(line);
  lines.forEach((l, i) => text(ctx, l, x, y + i * (size + 4), size, color));
}
