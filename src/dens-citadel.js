// Docs: docs/combat/bosses.md
// The Aether Citadel's two boss dens: The Grand Foundry (theme 'clock', the Clockwork Colossus) and
// The Hour Sanctum (theme 'chrono', Chronos, Keeper of Hours). Their rooms, their doorways in the Citadel,
// the two bosses and their effects. Only draws. Same contracts as the older dens in src/dens.js (which
// imports this file, so nothing is imported back from it: the few helpers needed are copied here).
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, DENS, MOBS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const TILE = 150; // the grid attacks electrify the floor in 10 tiles of 150 px
const THRONE_X = DEN_W - 105;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const ease = (k) => 1 - (1 - k) ** 3;
const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ——— small helpers (copies of the ones in dens.js) ———

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function arrow(ctx, x, y, dir, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.moveTo(1, -5);
  ctx.lineTo(6, 0);
  ctx.lineTo(1, 5);
  ctx.stroke();
  ctx.restore();
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.4 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
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

// A cog: n teeth around radius r, optional hole. Leaves the path open for fill / stroke.
function gearPath(ctx, x, y, r, n, rot, th = r * 0.24, hole = 0) {
  const step = TAU / n;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + i * step;
    ctx.lineTo(x + Math.cos(a - step * 0.5) * r, y + Math.sin(a - step * 0.5) * r);
    ctx.lineTo(x + Math.cos(a - step * 0.27) * r, y + Math.sin(a - step * 0.27) * r);
    ctx.lineTo(x + Math.cos(a - step * 0.15) * (r + th), y + Math.sin(a - step * 0.15) * (r + th));
    ctx.lineTo(x + Math.cos(a + step * 0.15) * (r + th), y + Math.sin(a + step * 0.15) * (r + th));
    ctx.lineTo(x + Math.cos(a + step * 0.27) * r, y + Math.sin(a + step * 0.27) * r);
  }
  ctx.closePath();
  if (hole > 0) {
    ctx.moveTo(x + hole, y);
    ctx.arc(x, y, hole, 0, TAU, true);
  }
}

function gear(ctx, x, y, r, n, rot, fill, edge, hole = r * 0.3, lw = 2) {
  gearPath(ctx, x, y, r, n, rot, r * 0.24, hole);
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

// clock hands from (x, y): hour hand a1 (0.5 r), minute hand a2 (0.8 r); angle 0 = twelve o'clock
function hands(ctx, x, y, r, a1, a2, col, lw = 3) {
  ctx.strokeStyle = col;
  ctx.lineCap = 'round';
  ctx.lineWidth = lw * 1.3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(a1) * r * 0.5, y - Math.cos(a1) * r * 0.5);
  ctx.stroke();
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.sin(a2) * r * 0.82, y - Math.cos(a2) * r * 0.82);
  ctx.stroke();
}

// a little clock: face, rim, 12 ticks, hands
function miniClock(ctx, x, y, r, a1, a2, face, rim, ink, lw = 2) {
  ctx.fillStyle = face;
  circle(ctx, x, y, r);
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(1.5, r * 0.16);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1, lw * 0.6);
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU, r0 = r * (i % 3 ? 0.78 : 0.68);
    ctx.moveTo(x + Math.sin(a) * r0, y - Math.cos(a) * r0);
    ctx.lineTo(x + Math.sin(a) * r * 0.88, y - Math.cos(a) * r * 0.88);
  }
  ctx.stroke();
  hands(ctx, x, y, r, a1, a2, ink, lw);
  ctx.fillStyle = rim;
  circle(ctx, x, y, Math.max(1.5, r * 0.1));
}

function bolt(ctx, x0, y0, x1, y1, segs, amp, seed) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  ctx.moveTo(x0, y0);
  for (let i = 1; i < segs; i++) {
    const k = i / segs, o = (hash(seed + i * 13.7) - 0.5) * 2 * amp;
    ctx.lineTo(x0 + dx * k + nx * o, y0 + dy * k + ny * o);
  }
  ctx.lineTo(x1, y1);
}

// an electric arc: a soft wide glow stroke, then a bright core
function zap(ctx, x0, y0, x1, y1, segs, amp, seed, rgb, a, wide = 7) {
  if (a <= 0.01) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  bolt(ctx, x0, y0, x1, y1, segs, amp, seed);
  ctx.strokeStyle = `rgba(${rgb},${0.45 * a})`;
  ctx.lineWidth = wide;
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${a})`;
  ctx.lineWidth = wide * 0.3;
  ctx.stroke();
}

function safeTag(ctx, x, y, time, label = 'SAFE', rgb = '120,240,160') {
  const bounce = Math.abs(Math.sin(time * 5)) * 4;
  ctx.font = "700 12px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(48, ctx.measureText(label).width + 20);
  ctx.fillStyle = `rgba(${rgb},0.95)`;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - tw / 2, y - 11 - bounce, tw, 20, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, label, x, y - 0.5 - bounce, 12, '#1e4a30');
}

// The warning sign on a post that every den mouth has (see drawDenEntrance in dens.js)
function bossSign(ctx, x, half, b, theme, time, fill, edge) {
  const den = Math.max(0, DENS.findIndex((d) => d.theme === theme));
  const spec = MOBS[DENS[den]?.boss];
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const sx = x - half - Math.max(92, ctx.measureText(spec?.name ?? 'Boss').width + 24) / 2 + 8;
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.roundRect(sx - 4, b - 86, 8, 88, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(sx, b - 76);
  ctx.rotate(Math.sin(time * 1.2 + den) * 0.025 - 0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const name = spec?.name ?? 'Boss';
  const tw = Math.max(92, ctx.measureText(name).width + 24);
  ctx.fillStyle = fill;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -16, tw, 52, 10);
  ctx.fill();
  ctx.stroke();
  // rivets / studs in the corners
  ctx.fillStyle = edge;
  for (const [dx, dy] of [[-tw / 2 + 7, -9], [tw / 2 - 7, -9], [-tw / 2 + 7, 29], [tw / 2 - 7, 29]]) circle(ctx, dx, dy, 2);
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
  text(ctx, `Lv ${spec?.lvl ?? '?'}`, 0, 25.5, 11, '#b0405a');
  ctx.restore();
  return den;
}

// the eyes peeking out of a den mouth
function peekEyes(ctx, x, ey, den, time, eyeCol) {
  const peek = Math.sin(time * 0.7 + den * 2);
  const blink = ((time + den) % 3.7) < 0.14;
  const ex = x + peek * 8;
  for (const s of [-1, 1]) {
    glow(ctx, ex + s * 11, ey, 14, 12, eyeCol, 0.6);
    ctx.fillStyle = `rgb(${eyeCol})`;
    ellipse(ctx, ex + s * 11, ey, 4.5, blink ? 0.8 : 5.5);
    if (!blink) {
      ctx.fillStyle = '#fff';
      circle(ctx, ex + s * 11 + 1.4, ey - 2, 1.4);
    }
  }
  ctx.strokeStyle = `rgba(${eyeCol},0.8)`;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ex - 17, ey - 10);
  ctx.lineTo(ex - 6, ey - 6);
  ctx.moveTo(ex + 17, ey - 10);
  ctx.lineTo(ex + 6, ey - 6);
  ctx.stroke();
}

// an hourglass standing on (x, y) bottom-centre, s = height; frac = how much sand has fallen (0..1)
function hourglass(ctx, x, y, s, frac, time, gold = '#ffd66a', goldDark = '#b8863a', a = 1) {
  const hw = s * 0.27, top = y - s, mid = y - s / 2, neck = s * 0.035;
  ctx.save();
  ctx.globalAlpha *= a;
  const bulb = () => {
    ctx.beginPath();
    ctx.moveTo(x - hw, top + s * 0.07);
    ctx.bezierCurveTo(x - hw * 1.05, top + s * 0.3, x - neck * 2, mid - s * 0.08, x - neck, mid);
    ctx.bezierCurveTo(x - neck * 2, mid + s * 0.08, x - hw * 1.05, y - s * 0.3, x - hw, y - s * 0.07);
    ctx.lineTo(x + hw, y - s * 0.07);
    ctx.bezierCurveTo(x + hw * 1.05, y - s * 0.3, x + neck * 2, mid + s * 0.08, x + neck, mid);
    ctx.bezierCurveTo(x + neck * 2, mid - s * 0.08, x + hw * 1.05, top + s * 0.3, x + hw, top + s * 0.07);
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(200,235,255,0.22)';
  bulb();
  ctx.fill();
  // the sand
  ctx.save();
  bulb();
  ctx.clip();
  ctx.fillStyle = '#ffd98a';
  const topLevel = mid - s * 0.06 - (1 - frac) * s * 0.34; // the top bulb's sand surface
  ctx.beginPath();
  ctx.moveTo(x - hw * 1.2, topLevel);
  ctx.quadraticCurveTo(x, topLevel + s * 0.07, x + hw * 1.2, topLevel);
  ctx.lineTo(x + hw, mid);
  ctx.lineTo(x - hw, mid);
  ctx.fill();
  const pile = frac * s * 0.3;
  ctx.beginPath();
  ctx.moveTo(x - hw * 1.2, y - s * 0.05);
  ctx.lineTo(x - hw * 1.2, y - s * 0.07 - pile * 0.45);
  ctx.quadraticCurveTo(x, y - s * 0.07 - pile * 1.35, x + hw * 1.2, y - s * 0.07 - pile * 0.45);
  ctx.lineTo(x + hw * 1.2, y - s * 0.05);
  ctx.fill();
  if (frac < 0.98) {
    ctx.fillStyle = '#ffe9b0';
    ctx.fillRect(x - Math.max(0.8, s * 0.008), mid, Math.max(1.6, s * 0.016), s / 2 - s * 0.07 - pile * 0.9);
    // falling grains glinting
    for (let i = 0; i < 3; i++) {
      const k = (time * 1.6 + i / 3) % 1;
      ctx.fillStyle = `rgba(255,250,220,${1 - k})`;
      circle(ctx, x, mid + k * (s / 2 - s * 0.1 - pile), Math.max(0.8, s * 0.012));
    }
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(230,248,255,0.85)';
  ctx.lineWidth = Math.max(1.2, s * 0.014);
  bulb();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ellipse(ctx, x - hw * 0.55, top + s * 0.2, hw * 0.12, s * 0.08, 0.2);
  // frame: two plates and posts
  ctx.strokeStyle = goldDark;
  ctx.lineWidth = Math.max(2, s * 0.03);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const sx of [-1, 1]) {
    ctx.moveTo(x + sx * hw * 1.18, top + s * 0.03);
    ctx.lineTo(x + sx * hw * 1.18, y - s * 0.03);
  }
  ctx.stroke();
  ctx.fillStyle = gold;
  ctx.strokeStyle = goldDark;
  ctx.lineWidth = Math.max(1.2, s * 0.014);
  for (const py of [top - s * 0.02, y - s * 0.06]) {
    ctx.beginPath();
    ctx.roundRect(x - hw * 1.42, py, hw * 2.84, s * 0.08, s * 0.04);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = gold;
  for (const sx of [-1, 1]) {
    circle(ctx, x + sx * hw * 1.18, mid, s * 0.035);
  }
  ctx.restore();
}

// ——— seeded scenery, built once ———

const FOUNDRY = (() => {
  const r = mulberry32(1601);
  const gears = [
    [150, 140, 76, 14, 0.12], [262, 252, 42, 9, -0.22], [520, 96, 56, 11, -0.16], [700, 330, 34, 8, 0.3],
    [1010, 150, 92, 16, 0.09], [1148, 268, 44, 9, -0.2], [1330, 110, 62, 12, -0.13], [840, 70, 40, 9, 0.22],
  ].map(([x, y, rr, n, sp]) => ({ x, y, r: rr, n, sp, p: r() * TAU }));
  const portholes = [{ x: 380, y: 165, r: 50 }, { x: 1130, y: 160, r: 50 }];
  const pendulums = [{ x: 575, len: 255, p: 0 }, { x: 925, len: 255, p: Math.PI }];
  const trolleys = Array.from({ length: 7 }, (_, i) => ({ o: i / 7 + r() * 0.05, kind: i % 3, p: r() * TAU }));
  const valves = [75, 525, 975, 1425].map((x) => ({ x, p: r() * 4 }));
  const sparks = Array.from({ length: 34 }, () => ({ x: r() * DEN_W, p: r(), sp: 0.22 + r() * 0.3, drift: (r() - 0.5) * 50, s: 0.6 + r() * 0.8 }));
  const motes = Array.from({ length: 26 }, () => ({ x: r() * DEN_W, y: 80 + r() * 330, p: r() * TAU, s: 0.6 + r() * 0.8 }));
  const clouds = Array.from({ length: 6 }, () => ({ o: r(), y: (r() - 0.5) * 50, s: 0.6 + r() * 0.6 }));
  return { gears, portholes, pendulums, trolleys, valves, sparks, motes, clouds };
})();

const SANCTUM = (() => {
  const r = mulberry32(1701);
  const stars = Array.from({ length: 160 }, () => ({ x: r() * (DEN_W * 0.25 + 1100) - 70, y: r() * 430, s: 0.5 + r() * 1.3, p: r() * TAU }));
  const nebulae = [[220, 120, '120,220,255'], [640, 70, '200,140,255'], [1080, 160, '120,240,230'], [420, 300, '170,120,255'], [1300, 320, '255,160,220']]
    .map(([x, y, rgb]) => ({ x, y, rgb, rx: 200 + r() * 130, ry: 90 + r() * 60 }));
  const isles = [[120, 380, 1], [520, 340, 0.7], [900, 395, 0.85], [1240, 350, 0.75]].map(([x, y, s]) => ({ x, y, s, p: r() * TAU }));
  const spires = [{ x: 545, top: 120, bot: 400, p: 0.3 }, { x: 955, top: 130, bot: 405, p: 2.1 }];
  const glasses = [{ x: 150, y: 210, s: 70, p: 0.4, sp: 0.3 }, { x: 1250, y: 175, s: 56, p: 2, sp: -0.24 }];
  const shards = Array.from({ length: 12 }, () => ({ x: r() * DEN_W, y: 70 + r() * 260, s: 0.5 + r() * 0.8, p: r() * TAU, rot: (r() - 0.5) * 0.8 }));
  const sand = Array.from({ length: 64 }, () => ({ x: r() * DEN_W, y: r() * 450, p: r() * TAU, s: 0.6 + r() * 0.9, sp: 8 + r() * 14, gold: r() < 0.7 }));
  const STAR_IN = Array.from({ length: 34 }, () => ({ x: r() - 0.5, y: -r() * 0.95, s: 0.5 + r() * 1.3, p: r() * TAU }));
  return { stars, nebulae, isles, spires, glasses, shards, sand, STAR_IN };
})();

// ——— The Grand Foundry (clock) ———

const BRASS = '#f0c46a', BRASS_L = '#fff0b8', BRASS_D = '#b8783e', INK_B = '#6a4630';

function foundryBack(ctx, L, R, time) {
  const F = FOUNDRY;
  // riveted wall panels (one per floor tile)
  const i0 = Math.max(0, Math.floor(L / TILE)), i1 = Math.min(10, Math.ceil(R / TILE));
  ctx.strokeStyle = 'rgba(60,28,34,0.28)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = i0; i <= i1; i++) {
    ctx.moveTo(i * TILE, 30);
    ctx.lineTo(i * TILE, 384);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,180,0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = i0; i <= i1; i++) {
    ctx.moveTo(i * TILE + 3, 30);
    ctx.lineTo(i * TILE + 3, 384);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(60,28,34,0.3)';
  ctx.beginPath();
  for (let i = i0; i <= i1; i++) {
    for (let y = 60; y < 380; y += 46) {
      ctx.moveTo(i * TILE - 8 + 2.4, y);
      ctx.arc(i * TILE - 8, y, 2.4, 0, TAU);
      ctx.moveTo(i * TILE + 12 + 2.4, y);
      ctx.arc(i * TILE + 12, y, 2.4, 0, TAU);
    }
  }
  ctx.fill();
  // big slow gears set into the wall
  for (const g of F.gears) {
    if (!visible(g.x - g.r - 20, g.x + g.r + 20, L, R)) continue;
    const rot = g.p + time * g.sp;
    gear(ctx, g.x, g.y, g.r, g.n, rot, 'rgba(70,36,44,0.32)', null, g.r * 0.28);
    ctx.strokeStyle = 'rgba(255,214,150,0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r * 0.72, 0, TAU);
    for (let k = 0; k < 4; k++) {
      const a = rot + (k * TAU) / 4;
      ctx.moveTo(g.x + Math.cos(a) * g.r * 0.3, g.y + Math.sin(a) * g.r * 0.3);
      ctx.lineTo(g.x + Math.cos(a) * g.r * 0.72, g.y + Math.sin(a) * g.r * 0.72);
    }
    ctx.stroke();
  }
  // round portholes onto the bright sky outside
  for (const p of F.portholes) {
    if (!visible(p.x - p.r - 20, p.x + p.r + 20, L, R)) continue;
    glow(ctx, p.x, p.y, p.r * 2.2, p.r * 1.8, '255,236,190', 0.28);
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.clip();
    ctx.fillStyle = vgrad(ctx, 'cl-port', p.y - p.r - 10, p.y + p.r + 10, [[0, '#7fb8ee'], [0.6, '#bfe2ff'], [1, '#f4fbff']]);
    ctx.fillRect(p.x - p.r, p.y - p.r - 10, p.r * 2, p.r * 2 + 20);
    // a far brass tower and the clouds drifting past
    ctx.fillStyle = 'rgba(200,150,110,0.55)';
    ctx.beginPath();
    ctx.roundRect(p.x + 10, p.y - 18, 16, 80, 4);
    ctx.roundRect(p.x - 30, p.y + 4, 22, 60, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x + 18, p.y - 18, 10, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    for (const c of F.clouds) {
      const cx = p.x - p.r - 40 + ((c.o + time * 0.012 * c.s) % 1) * (p.r * 2 + 80);
      const cy = p.y + 20 + c.y * 0.6;
      circle(ctx, cx, cy, 13 * c.s);
      circle(ctx, cx + 14 * c.s, cy + 3, 10 * c.s);
      circle(ctx, cx - 13 * c.s, cy + 4, 9 * c.s);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(ctx, p.x - p.r * 0.35, p.y - p.r * 0.4, p.r * 0.32, p.r * 0.13, -0.6);
    ctx.restore();
    ctx.strokeStyle = BRASS_D;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 6, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = BRASS;
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,248,220,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 8, Math.PI * 1.1, Math.PI * 1.6);
    ctx.stroke();
    ctx.fillStyle = INK_B;
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      circle(ctx, p.x + Math.cos(a) * (p.r + 6), p.y + Math.sin(a) * (p.r + 6), 2.2);
    }
    // a cross bar
    ctx.strokeStyle = BRASS_D;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x - p.r, p.y);
    ctx.lineTo(p.x + p.r, p.y);
    ctx.stroke();
  }
  // the low wainscot and a long steam pipe along the back wall
  ctx.fillStyle = 'rgba(60,26,30,0.22)';
  ctx.fillRect(L, 384, R - L, GROUND - 384);
  ctx.fillStyle = 'rgba(255,214,150,0.35)';
  ctx.fillRect(L, 382, R - L, 3);
  ctx.fillStyle = '#9a5a3a';
  ctx.fillRect(L, 362, R - L, 14);
  ctx.fillStyle = 'rgba(255,200,160,0.45)';
  ctx.fillRect(L, 364, R - L, 3);
  ctx.fillStyle = 'rgba(60,20,20,0.25)';
  ctx.fillRect(L, 372, R - L, 4);
  for (let x = Math.floor(L / TILE) * TILE + 75; x < R + 20; x += TILE) {
    ctx.fillStyle = BRASS_D;
    ctx.beginPath();
    ctx.roundRect(x - 6, 357, 12, 24, 3);
    ctx.fill();
    ctx.fillStyle = BRASS;
    ctx.fillRect(x - 4, 359, 3, 20);
  }
  for (const v of F.valves) {
    if (!visible(v.x - 60, v.x + 60, L, R)) continue;
    ctx.fillStyle = '#e06a5a';
    ctx.strokeStyle = '#8a3a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(v.x + 30, 350, 8, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#ffd0c8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(v.x + 24, 350);
    ctx.lineTo(v.x + 36, 350);
    ctx.moveTo(v.x + 30, 344);
    ctx.lineTo(v.x + 30, 356);
    ctx.stroke();
    ctx.fillStyle = '#9a5a3a';
    ctx.fillRect(v.x + 27, 356, 6, 7);
    // a puff every few seconds
    const k = ((time + v.p) % 4) / 1.6;
    if (k < 1) {
      for (let j = 0; j < 3; j++) {
        const kk = clamp(k - j * 0.12, 0, 1);
        if (kk <= 0) continue;
        ctx.fillStyle = `rgba(255,248,240,${0.6 * Math.sin(kk * Math.PI)})`;
        circle(ctx, v.x + 40 + kk * 26 + j * 6, 348 - kk * 50, 6 + kk * 12);
      }
    }
  }
  // two big pendulums from the ceiling's clockwork
  for (const p of F.pendulums) {
    if (!visible(p.x - 130, p.x + 130, L, R)) continue;
    const a = 0.26 * Math.sin(time * 1.9 + p.p);
    const bx = p.x + Math.sin(a) * p.len, by = 30 + Math.cos(a) * p.len;
    ctx.strokeStyle = 'rgba(120,70,50,0.75)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, 30);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240,196,106,0.75)';
    ctx.lineWidth = 3;
    ctx.stroke();
    glow(ctx, bx, by, 40, 40, '255,220,150', 0.25);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#d89a50';
    ctx.strokeStyle = '#8a5a34';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bx, by, 25, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f0c46a';
    circle(ctx, bx, by, 17);
    gear(ctx, bx, by, 10, 8, -a * 3, '#d89a50', null, 3.5);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ellipse(ctx, bx - 8, by - 9, 7, 3.5, -0.6);
    ctx.restore();
    // the escapement gear it hangs from
    gear(ctx, p.x, 34, 16, 10, a * 2, BRASS_D, INK_B, 5);
    ctx.fillStyle = BRASS;
    circle(ctx, p.x, 34, 4);
  }
  // the girder ceiling
  ctx.fillStyle = '#3c2632';
  ctx.fillRect(L, 0, R - L, 30);
  ctx.strokeStyle = '#5e3c40';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = Math.floor(L / 50) * 50; x < R + 50; x += 50) {
    ctx.moveTo(x, 4);
    ctx.lineTo(x + 25, 24);
    ctx.lineTo(x + 50, 4);
  }
  ctx.stroke();
  ctx.fillStyle = '#9a6040';
  ctx.fillRect(L, 24, R - L, 8);
  ctx.fillStyle = 'rgba(255,214,150,0.4)';
  ctx.fillRect(L, 24, R - L, 2);
  // the overhead trolley rail, hooks carrying cogs and crates along
  ctx.fillStyle = '#7a4a34';
  ctx.fillRect(L, 42, R - L, 5);
  ctx.fillStyle = 'rgba(255,214,150,0.5)';
  ctx.fillRect(L, 42, R - L, 1.5);
  for (const tr of F.trolleys) {
    const x = ((tr.o + time * 0.016) % 1) * (DEN_W + 200) - 100;
    if (x < L - 40 || x > R + 40) continue;
    const sway = Math.sin(time * 2.2 + tr.p) * 0.08;
    ctx.fillStyle = '#5a3a34';
    ctx.beginPath();
    ctx.roundRect(x - 10, 36, 20, 10, 4);
    ctx.fill();
    ctx.fillStyle = BRASS;
    circle(ctx, x - 5, 44, 3);
    circle(ctx, x + 5, 44, 3);
    ctx.save();
    ctx.translate(x, 46);
    ctx.rotate(sway);
    ctx.strokeStyle = '#5a3a34';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 22);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 25, 4, -Math.PI * 0.5, Math.PI * 0.9);
    ctx.stroke();
    if (tr.kind === 0) {
      gear(ctx, 0, 40, 12, 9, time * 0.5 + tr.p, 'rgba(240,196,106,0.85)', 'rgba(106,70,48,0.85)', 4);
    } else if (tr.kind === 1) {
      ctx.fillStyle = 'rgba(200,130,80,0.85)';
      ctx.strokeStyle = 'rgba(106,70,48,0.85)';
      ctx.beginPath();
      ctx.roundRect(-13, 28, 26, 22, 4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-13, 28);
      ctx.lineTo(13, 50);
      ctx.moveTo(13, 28);
      ctx.lineTo(-13, 50);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(140,200,210,0.85)';
      ctx.strokeStyle = 'rgba(70,90,110,0.85)';
      ctx.beginPath();
      ctx.roundRect(-8, 28, 16, 26, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(-4, 32, 3, 16);
    }
    ctx.restore();
  }
}

function floorClock(ctx, L, R, time) {
  const y = GROUND;
  ctx.fillStyle = '#8f5e46';
  ctx.fillRect(L, y, R - L, H - y + 10);
  ctx.fillStyle = '#764a3a';
  ctx.fillRect(L, y + 60, R - L, H - y);
  const i0 = Math.max(0, Math.floor(L / TILE)), i1 = Math.min(9, Math.floor(R / TILE));
  for (let i = i0; i <= i1; i++) {
    const x0 = i * TILE;
    // a riveted floor plate per tile, with a pilot lamp in the middle
    ctx.fillStyle = i % 2 ? 'rgba(255,220,170,0.1)' : 'rgba(255,220,170,0.05)';
    ctx.strokeStyle = 'rgba(70,34,28,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x0 + 8, y + 18, TILE - 16, 50, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,180,0.12)';
    ctx.beginPath();
    ctx.moveTo(x0 + 16, y + 21);
    ctx.lineTo(x0 + TILE - 16, y + 21);
    ctx.stroke();
    ctx.fillStyle = 'rgba(70,34,28,0.5)';
    for (const [dx, dy] of [[16, 26], [TILE - 16, 26], [16, 60], [TILE - 16, 60]]) circle(ctx, x0 + dx, y + dy, 2.4);
    // vent slots
    ctx.fillStyle = 'rgba(60,28,24,0.45)';
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.roundRect(x0 + 75 + k * 14 - 4, y + 52, 8, 10, 3);
      ctx.fill();
    }
    const a = 0.55 + 0.3 * Math.sin(time * 2 + i * 0.9);
    glow(ctx, x0 + 75, y + 34, 22, 12, '120,240,220', a * 0.55);
    ctx.fillStyle = '#5a3a34';
    circle(ctx, x0 + 75, y + 34, 6);
    ctx.fillStyle = `rgba(190,255,240,${a + 0.2})`;
    circle(ctx, x0 + 75, y + 34, 3.8);
  }
  // seams between the tiles, all the way down
  ctx.fillStyle = 'rgba(60,26,22,0.55)';
  for (let i = i0; i <= i1 + 1; i++) ctx.fillRect(i * TILE - 2, y + 8, 4, H - y);
  ctx.fillStyle = 'rgba(255,220,180,0.14)';
  for (let i = i0; i <= i1 + 1; i++) ctx.fillRect(i * TILE + 2, y + 8, 2, H - y);
  // the polished brass lip
  ctx.fillStyle = vgrad(ctx, 'cl-lip', y - 5, y + 14, [[0, BRASS_L], [0.35, BRASS], [1, BRASS_D]]);
  ctx.beginPath();
  ctx.roundRect(L - 4, y - 5, R - L + 8, 18, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(L, y - 3, R - L, 2);
  ctx.fillStyle = INK_B;
  for (let i = i0; i <= i1 + 1; i++) {
    const sx = i * TILE;
    if (sx < L - 10 || sx > R + 10) continue;
    ctx.fillRect(sx - 1.5, y - 4, 3, 17);
    circle(ctx, sx - 9, y + 5, 2);
    circle(ctx, sx + 9, y + 5, 2);
  }
  ctx.fillStyle = 'rgba(106,70,48,0.45)';
  ctx.fillRect(L, y + 11, R - L, 2);
}

function throneClock(ctx, x, b, time) {
  glow(ctx, x, b - 120, 140, 160, '255,190,120', 0.4);
  // the crest gear turning behind the boiler
  gear(ctx, x, b - 214, 54, 14, time * 0.25, '#d89a50', INK_B, 16, 3);
  ctx.fillStyle = BRASS;
  circle(ctx, x, b - 214, 10);
  // two smokestacks with steam
  for (const [dx, top] of [[-50, b - 300], [46, b - 282]]) {
    ctx.fillStyle = '#7a4a3a';
    ctx.strokeStyle = '#4a2a28';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x + dx - 11, top, 22, b - 190 - top, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = BRASS_D;
    ctx.beginPath();
    ctx.roundRect(x + dx - 15, top - 8, 30, 12, 5);
    ctx.fill();
    ctx.stroke();
    for (let j = 0; j < 3; j++) {
      const k = (time * 0.5 + j / 3 + dx * 0.01) % 1;
      ctx.fillStyle = `rgba(255,248,240,${0.55 * Math.sin(k * Math.PI)})`;
      circle(ctx, x + dx + Math.sin(k * 5 + j) * 8, top - 14 - k * 70, 8 + k * 14);
    }
  }
  // the copper boiler
  const g = ctx.createLinearGradient(x - 90, 0, x + 90, 0);
  g.addColorStop(0, '#b8603a');
  g.addColorStop(0.35, '#f4a878');
  g.addColorStop(1, '#a8563a');
  ctx.fillStyle = g;
  ctx.strokeStyle = INK_B;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 84, b - 204, 168, 176, 48);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ellipse(ctx, x - 50, b - 150, 10, 34, 0.05);
  // brass bands with rivets
  for (const by of [b - 176, b - 62]) {
    ctx.fillStyle = BRASS;
    ctx.beginPath();
    ctx.roundRect(x - 86, by - 6, 172, 12, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK_B;
    for (let k = -3; k <= 3; k++) circle(ctx, x + k * 22, by, 2);
  }
  // the clock face on top
  const cx = x, cy = b - 140;
  ctx.fillStyle = BRASS_D;
  circle(ctx, cx, cy, 34);
  const now = time * 0.15;
  miniClock(ctx, cx, cy, 27, now * 0.083, now, '#fff6e0', BRASS, '#6a4630', 3);
  // the glowing furnace door
  const fy = b - 92, flick = 0.75 + 0.25 * Math.sin(time * 7) * Math.sin(time * 3.1);
  glow(ctx, x, fy, 60, 40, '255,150,70', 0.6 * flick);
  ctx.fillStyle = '#4a2a28';
  ctx.beginPath();
  ctx.roundRect(x - 34, fy - 18, 68, 36, 14);
  ctx.fill();
  const fg = ctx.createLinearGradient(0, fy - 14, 0, fy + 14);
  fg.addColorStop(0, '#ffdf8a');
  fg.addColorStop(1, '#ff7a3a');
  ctx.fillStyle = fg;
  ctx.globalAlpha = 0.6 + 0.4 * flick;
  ctx.beginPath();
  ctx.roundRect(x - 28, fy - 13, 56, 26, 11);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#4a2a28';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let k = -2; k <= 2; k++) {
    ctx.moveTo(x + k * 10, fy - 14);
    ctx.lineTo(x + k * 10, fy + 14);
  }
  ctx.stroke();
  // pressure gauges with wobbling needles
  for (const s of [-1, 1]) {
    const gx = x + s * 58, gy = b - 116;
    ctx.fillStyle = BRASS_D;
    circle(ctx, gx, gy, 12);
    ctx.fillStyle = '#fff6e0';
    circle(ctx, gx, gy, 9);
    const na = -0.6 + Math.sin(time * (2.5 + s) + s) * 0.5;
    ctx.strokeStyle = '#d04a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + Math.sin(na) * 7, gy - Math.cos(na) * 7);
    ctx.stroke();
  }
  // the base and steps
  for (const [w, y, c] of [[210, b - 22, '#7a4a3a'], [176, b - 36, BRASS_D]]) {
    ctx.fillStyle = c;
    ctx.strokeStyle = INK_B;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, w, 24, 6);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,240,200,0.45)';
  ctx.fillRect(x - 84, b - 34, 168, 2);
}

function exitClock(ctx, time) {
  const x = DEN_EXIT_X, b = GROUND, hw = 40, top = b - 128;
  const opening = () => {
    ctx.beginPath();
    ctx.moveTo(x - hw, b + 2);
    ctx.lineTo(x - hw, top + hw);
    ctx.arc(x, top + hw, hw, Math.PI, 0);
    ctx.lineTo(x + hw, b + 2);
    ctx.closePath();
  };
  glow(ctx, x, b - 50, 110, 90, '210,235,255', 0.4);
  ctx.save();
  opening();
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, 'cl-exit', top, b, [[0, '#8fc4f4'], [0.6, '#d8eeff'], [1, '#ffffff']]);
  ctx.fillRect(x - hw, top, hw * 2, b - top + 4);
  ctx.fillStyle = 'rgba(210,160,110,0.6)';
  ctx.fillRect(x + 6, top + 40, 12, 90);
  ctx.beginPath();
  ctx.arc(x + 12, top + 40, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) circle(ctx, x - hw + i * 26, b - 26 + (i % 2) * 6, 18);
  ctx.restore();
  glow(ctx, x + 30, b + 4, 90, 14, '230,245,255', 0.35);
  // a riveted brass hatch frame
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 20;
  opening();
  ctx.stroke();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 11;
  opening();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,248,220,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, top + hw, hw + 3, Math.PI * 1.08, Math.PI * 1.45);
  ctx.stroke();
  ctx.fillStyle = INK_B;
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    circle(ctx, x + Math.cos(a) * (hw + 5), top + hw + Math.sin(a) * (hw + 5), 2.2);
  }
  for (const s of [-1, 1]) for (let yy = top + hw + 16; yy < b; yy += 22) circle(ctx, x + s * (hw + 5), yy, 2.2);
  gear(ctx, x, top - 4, 15, 10, time * 0.8, BRASS, INK_B, 5);
  ctx.fillStyle = BRASS_D;
  circle(ctx, x, top - 4, 4);
  // sign
  ctx.save();
  ctx.translate(x, top - 34);
  ctx.rotate(Math.sin(time * 1.3) * 0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const label = 'Citadel';
  const tw = ctx.measureText(label).width + 40;
  ctx.fillStyle = '#b8783e';
  ctx.strokeStyle = INK_B;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -12, tw, 24, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, label, 7, 0.5, 13, '#fffaf0');
  arrow(ctx, -tw / 2 + 13, 0, -1, 0.8, '#fffaf0');
  ctx.restore();
}

function bannerClock(ctx, name, x, time) {
  const top = 92;
  ctx.save();
  ctx.font = "700 20px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = ctx.measureText(name).width + 104, hh = 46;
  const sw = Math.sin(time * 0.9) * 1.2;
  // chains up to the ceiling
  ctx.lineCap = 'round';
  for (const [col, lw] of [['#5a3a34', 5], [BRASS, 2.5]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x - tw / 2 + 18, 30);
    ctx.lineTo(x - tw / 2 + 18 + sw, top);
    ctx.moveTo(x + tw / 2 - 18, 30);
    ctx.lineTo(x + tw / 2 - 18 + sw, top);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.translate(x + sw, top);
  glow(ctx, 0, hh / 2, tw * 0.7, hh * 1.3, '255,220,150', 0.3);
  // a brass nameplate
  const g = ctx.createLinearGradient(0, 0, 0, hh);
  g.addColorStop(0, BRASS_L);
  g.addColorStop(0.45, BRASS);
  g.addColorStop(1, '#c88a48');
  ctx.fillStyle = g;
  ctx.strokeStyle = INK_B;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, 0, tw, hh, 12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(106,70,48,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 7, 6, tw - 14, hh - 12, 7);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 12, 3, tw - 24, 4, 2);
  ctx.fill();
  ctx.fillStyle = INK_B;
  for (const [dx, dy] of [[-tw / 2 + 10, 9], [tw / 2 - 10, 9], [-tw / 2 + 10, hh - 9], [tw / 2 - 10, hh - 9]]) circle(ctx, dx, dy, 2.2);
  for (const side of [-1, 1]) {
    const ex = side * (tw / 2 - 25);
    gear(ctx, ex, hh / 2, 8, 8, time * side, BRASS_D, INK_B, 3, 1.5);
  }
  ctx.fillStyle = 'rgba(255,248,220,0.6)';
  ctx.textAlign = 'center';
  text(ctx, name, 0, hh / 2 + 2, 20, 'rgba(255,248,220,0.6)');
  text(ctx, name, 0, hh / 2 + 1, 20, '#5a3424');
  ctx.restore();
}

// chains up to the girders (drawn before the banner, so it hangs in front of them)
function ledgeChains(ctx, L, R) {
  for (const [col, lw] of [['#5a3a34', 5], [BRASS, 2.5]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (const { x, y, w } of DEN_PLATFORMS) {
      if (!visible(x, x + w, L, R)) continue;
      for (const vx of [x + 24, x + w - 24]) {
        ctx.moveTo(vx, 32);
        ctx.lineTo(vx, y);
      }
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function ledgeClock(ctx, p, i, time) {
  const { x, y, w } = p;
  glow(ctx, x + w / 2, y + 12, w * 0.6, 34, '255,214,150', 0.32);
  // the girder under the deck
  ctx.fillStyle = '#8a5638';
  ctx.strokeStyle = INK_B;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 6, w - 8, 20, [0, 0, 9, 9]);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#d89a50';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const n = Math.round((w - 20) / 20);
  for (let k = 0; k <= n; k++) {
    const kx = x + 10 + (k * (w - 20)) / n;
    k ? ctx.lineTo(kx, k % 2 ? y + 23 : y + 10) : ctx.moveTo(kx, y + 10);
  }
  ctx.stroke();
  // the little pilot lamp underneath
  const a = 0.6 + 0.3 * Math.sin(time * 2.4 + i);
  glow(ctx, x + w / 2, y + 30, 16, 10, '120,240,220', a * 0.7);
  ctx.fillStyle = '#5a3a34';
  ctx.beginPath();
  ctx.roundRect(x + w / 2 - 8, y + 24, 16, 8, 3);
  ctx.fill();
  ctx.fillStyle = `rgba(190,255,240,${a})`;
  circle(ctx, x + w / 2, y + 31, 3.5);
  // the deck: a bright brass walkway
  const g = ctx.createLinearGradient(0, y - 4, 0, y + 10);
  g.addColorStop(0, BRASS_L);
  g.addColorStop(0.5, BRASS);
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  ctx.strokeStyle = INK_B;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 4, w + 12, 13, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.roundRect(x, y - 3, w, 2.5, 1.2);
  ctx.fill();
  ctx.fillStyle = INK_B;
  for (let k = 0; k < 7; k++) circle(ctx, x + 10 + (k * (w - 20)) / 6, y + 4, 1.6);
  // a gear on each end, turning
  for (const [gx, dir] of [[x - 6, 1], [x + w + 6, -1]]) {
    gear(ctx, gx, y + 6, 12, 9, time * 1.1 * dir + i, '#e0a850', INK_B, 3.5);
    ctx.fillStyle = INK_B;
    circle(ctx, gx, y + 6, 2.5);
  }
  // a glint sliding along the deck
  const tw = (time * 0.35 + i * 0.37) % 1;
  ctx.fillStyle = `rgba(255,255,255,${Math.sin(tw * Math.PI) * 0.9})`;
  star(ctx, x + tw * w, y, 3.5);
}

function ambientClock(ctx, L, R, time) {
  // sparks drifting down from the clockwork overhead
  for (const s of FOUNDRY.sparks) {
    const k = (time * s.sp + s.p) % 1;
    const x = s.x + Math.sin(time * 1.3 + s.p * 9) * 10 + k * s.drift, y = 40 + k * 400;
    if (x < L || x > R) continue;
    const a = Math.sin(k * Math.PI) * (0.6 + 0.4 * Math.sin(time * 9 + s.p * 20));
    glow(ctx, x, y, 7 * s.s, 7 * s.s, '255,190,90', a * 0.6);
    ctx.fillStyle = `rgba(255,236,170,${a})`;
    circle(ctx, x, y, 1.5 * s.s);
  }
  // warm dust motes in the light
  for (const m of FOUNDRY.motes) {
    const x = m.x + Math.sin(time * 0.3 + m.p) * 20, y = m.y + Math.sin(time * 0.5 + m.p * 2) * 12;
    if (x < L || x > R) continue;
    ctx.fillStyle = `rgba(255,236,200,${0.25 + 0.25 * Math.sin(time * 1.2 + m.p)})`;
    circle(ctx, x, y, 1.4 * m.s);
  }
}

function drawFoundry(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'cl-bg', 0, GROUND + 10, [[0, '#4e3446'], [0.35, '#7a4e52'], [0.8, '#b07a5c'], [1, '#c48c62']]);
  ctx.fillRect(L, 0, R - L, H);
  foundryBack(ctx, L, R, time);
  if (visible(THRONE_X - 130, THRONE_X + 130, L, R)) throneClock(ctx, THRONE_X, GROUND, time);
  floorClock(ctx, Math.max(-40, L), Math.min(DEN_W + 40, R), time);
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) exitClock(ctx, time);
  ledgeChains(ctx, L, R);
  if (visible(750 - 280, 750 + 280, L, R)) bannerClock(ctx, den?.name ?? 'The Grand Foundry', 750, time);
  DEN_PLATFORMS.forEach((p, i) => {
    if (visible(p.x - 60, p.x + p.w + 60, L, R)) ledgeClock(ctx, p, i, time);
  });
  ambientClock(ctx, L, R, time);
  ctx.restore();
}

// ——— The Hour Sanctum (chrono) ———

const GOLD = '#ffd66a', GOLD_D = '#c9a64a', VIO = '#4a3f9a', VIO_D = '#2a2458';
const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

function sanctumBack(ctx, L, R, camX, viewW, time) {
  const S = SANCTUM;
  for (const n of S.nebulae) {
    const ax = n.x + camX * 0.7;
    if (ax + n.rx < camX - 40 || ax - n.rx > camX + viewW + 40) continue;
    glow(ctx, ax, n.y, n.rx, n.ry, n.rgb, 0.32);
  }
  for (const s of S.stars) {
    const ax = s.x + camX * 0.75;
    if (ax < camX - 10 || ax > camX + viewW + 10) continue;
    const tw = 0.5 + 0.5 * Math.sin(time * (1 + s.s) + s.p);
    ctx.fillStyle = `rgba(240,250,255,${0.3 + 0.6 * tw})`;
    if (s.s > 1.6) star(ctx, ax, s.y, 2.4 + tw * 2);
    else circle(ctx, ax, s.y, s.s);
  }
  // far floating islands with tiny clock towers
  for (const is of S.isles) {
    const ax = is.x + camX * 0.45, y = is.y + Math.sin(time * 0.5 + is.p) * 5;
    if (ax < camX - 160 || ax > camX + viewW + 160) continue;
    ctx.save();
    ctx.translate(ax, y);
    ctx.scale(is.s, is.s);
    ctx.fillStyle = 'rgba(60,50,130,0.75)';
    ctx.beginPath();
    ctx.moveTo(-80, 0);
    ctx.quadraticCurveTo(-40, 60, 0, 70);
    ctx.quadraticCurveTo(40, 60, 80, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(110,100,200,0.75)';
    ctx.beginPath();
    ctx.roundRect(-84, -6, 168, 12, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(90,80,170,0.8)';
    ctx.fillRect(-14, -80, 28, 76);
    ctx.beginPath();
    ctx.moveTo(-20, -80);
    ctx.lineTo(0, -112);
    ctx.lineTo(20, -80);
    ctx.fill();
    ctx.fillRect(26, -40, 18, 36);
    glow(ctx, 0, -58, 22, 22, '255,214,106', 0.35);
    ctx.fillStyle = 'rgba(255,230,160,0.8)';
    circle(ctx, 0, -58, 8);
    ctx.strokeStyle = 'rgba(90,80,170,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -58);
    ctx.lineTo(0, -64);
    ctx.moveTo(0, -58);
    ctx.lineTo(4, -58);
    ctx.stroke();
    ctx.restore();
  }
  // the giant clock face on the back wall
  const cx = 750, cy = 268, Rr = 160;
  if (visible(cx - Rr - 40, cx + Rr + 40, L, R)) {
    glow(ctx, cx, cy, Rr * 1.5, Rr * 1.4, '159,232,255', 0.22);
    ctx.save();
    ctx.translate(cx, cy);
    // an outer dashed ring turning the other way
    ctx.strokeStyle = 'rgba(255,214,106,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 9]);
    ctx.lineDashOffset = -time * 6;
    ctx.beginPath();
    ctx.arc(0, 0, Rr + 22, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(120,100,230,0.2)';
    circle(ctx, 0, 0, Rr);
    ctx.fillStyle = 'rgba(160,240,255,0.08)';
    circle(ctx, 0, 0, Rr * 0.62);
    ctx.strokeStyle = 'rgba(201,166,74,0.7)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 0, Rr, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,190,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, Rr - 7, 0, TAU);
    ctx.stroke();
    // minute ticks
    ctx.strokeStyle = 'rgba(255,230,170,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue;
      const a = (i / 60) * TAU;
      ctx.moveTo(Math.sin(a) * (Rr - 12), -Math.cos(a) * (Rr - 12));
      ctx.lineTo(Math.sin(a) * (Rr - 20), -Math.cos(a) * (Rr - 20));
    }
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      text(ctx, ROMAN[i], Math.sin(a) * (Rr - 36), -Math.cos(a) * (Rr - 36) + 1, 17, 'rgba(255,240,200,0.6)');
    }
    // a slow ring of little stars inside
    ctx.fillStyle = 'rgba(200,245,255,0.5)';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + time * 0.05;
      star(ctx, Math.cos(a) * Rr * 0.5, Math.sin(a) * Rr * 0.5, 3);
    }
    // ornate hands
    const ha = time * 0.02, ma = time * 0.22;
    for (const [a, len, wd] of [[ha, Rr * 0.5, 9], [ma, Rr * 0.78, 6]]) {
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = 'rgba(255,214,106,0.65)';
      ctx.strokeStyle = 'rgba(150,110,40,0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-wd * 0.3, 14);
      ctx.lineTo(-wd * 0.3, -len * 0.7);
      ctx.lineTo(-wd, -len * 0.78);
      ctx.lineTo(0, -len);
      ctx.lineTo(wd, -len * 0.78);
      ctx.lineTo(wd * 0.3, -len * 0.7);
      ctx.lineTo(wd * 0.3, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    glow(ctx, 0, 0, 22, 22, '255,214,106', 0.7);
    ctx.fillStyle = GOLD;
    circle(ctx, 0, 0, 8);
    ctx.fillStyle = '#9fe8ff';
    circle(ctx, 0, 0, 3.5);
    ctx.restore();
  }
  // floating crystal clock-spires between the ledges
  for (const s of S.spires) {
    if (!visible(s.x - 50, s.x + 50, L, R)) continue;
    const bob = Math.sin(time * 0.9 + s.p) * 7, top = s.top + bob, bot = s.bot + bob;
    glow(ctx, s.x, (top + bot) / 2, 46, (bot - top) * 0.6, '160,140,255', 0.3);
    ctx.fillStyle = 'rgba(120,100,220,0.55)';
    ctx.strokeStyle = 'rgba(200,190,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, top - 40);
    ctx.lineTo(s.x + 18, top);
    ctx.lineTo(s.x + 14, bot - 30);
    ctx.lineTo(s.x, bot);
    ctx.lineTo(s.x - 14, bot - 30);
    ctx.lineTo(s.x - 18, top);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(s.x, top - 40);
    ctx.lineTo(s.x - 18, top);
    ctx.lineTo(s.x - 14, bot - 30);
    ctx.lineTo(s.x, bot);
    ctx.closePath();
    ctx.fill();
    miniClock(ctx, s.x, top + 26, 15, time * 0.1 + s.p, time * 1.2 + s.p, 'rgba(255,248,230,0.85)', GOLD_D, '#3a2f72', 2);
    ctx.fillStyle = GOLD_D;
    ctx.beginPath();
    ctx.roundRect(s.x - 20, top - 2, 40, 6, 3);
    ctx.fill();
    // a few chips of crystal drifting under it
    for (let k = 0; k < 3; k++) {
      const yy = bot + 14 + k * 16 + Math.sin(time * 1.4 + k + s.p) * 4;
      ctx.fillStyle = `rgba(200,190,255,${0.7 - k * 0.18})`;
      ctx.beginPath();
      ctx.moveTo(s.x, yy - 6 + k);
      ctx.lineTo(s.x + 4 - k, yy);
      ctx.lineTo(s.x, yy + 6 - k);
      ctx.lineTo(s.x - 4 + k, yy);
      ctx.fill();
    }
  }
  // two hourglasses floating and slowly turning
  for (const g of S.glasses) {
    if (!visible(g.x - 70, g.x + 70, L, R)) continue;
    const y = g.y + Math.sin(time * 0.8 + g.p) * 8;
    glow(ctx, g.x, y, 60, 60, '255,214,106', 0.22);
    ctx.save();
    ctx.translate(g.x, y);
    ctx.rotate(Math.sin(time * g.sp + g.p) * 0.35);
    hourglass(ctx, 0, g.s / 2, g.s, ((time / 14 + g.p) % 1), time, GOLD, GOLD_D, 0.85);
    ctx.restore();
  }
  // floating crystal shards
  for (const sh of S.shards) {
    if (sh.x < L - 20 || sh.x > R + 20) continue;
    const y = sh.y + Math.sin(time * 0.7 + sh.p) * 10;
    ctx.save();
    ctx.translate(sh.x, y);
    ctx.rotate(sh.rot + Math.sin(time * 0.5 + sh.p) * 0.2);
    ctx.scale(sh.s, sh.s);
    ctx.fillStyle = 'rgba(170,230,255,0.45)';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 14);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-6, 0);
    ctx.lineTo(0, 2);
    ctx.fill();
    ctx.restore();
  }
}

function floorChrono(ctx, L, R, time) {
  const y = GROUND;
  ctx.fillStyle = '#2e2866';
  ctx.fillRect(L, y, R - L, H - y + 10);
  ctx.fillStyle = '#251f55';
  ctx.fillRect(L, y + 60, R - L, H - y);
  const i0 = Math.max(0, Math.floor(L / TILE)), i1 = Math.min(9, Math.floor(R / TILE));
  for (let i = i0; i <= i1; i++) {
    const x0 = i * TILE, mx = x0 + 75, my = y + 40;
    ctx.fillStyle = i % 2 ? 'rgba(160,140,255,0.08)' : 'rgba(120,220,255,0.05)';
    ctx.fillRect(x0 + 2, y + 10, TILE - 4, H - y);
    // a faint dial rune in each tile, its hand turning
    const a = 0.32 + 0.18 * Math.sin(time * 1.3 + i * 0.8);
    glow(ctx, mx, my, 44, 13, '159,232,255', a * 0.5);
    ctx.strokeStyle = `rgba(255,214,106,${a + 0.1})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(mx, my, 36, 11, 0, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 12; k++) {
      const ang = (k / 12) * TAU;
      const c = Math.cos(ang), s = Math.sin(ang), r0 = k % 3 ? 0.84 : 0.7;
      ctx.moveTo(mx + c * 36 * r0, my + s * 11 * r0);
      ctx.lineTo(mx + c * 36 * 0.95, my + s * 11 * 0.95);
    }
    ctx.stroke();
    const ha = time * (0.3 + i * 0.05) + i;
    ctx.strokeStyle = `rgba(255,230,160,${a + 0.25})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx + Math.cos(ha) * 28, my + Math.sin(ha) * 8.5);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,230,160,${a + 0.3})`;
    ellipse(ctx, mx, my, 3, 1.6);
  }
  // gold seams between the tiles
  ctx.fillStyle = 'rgba(255,214,106,0.45)';
  for (let i = i0; i <= i1 + 1; i++) ctx.fillRect(i * TILE - 1, y + 8, 2, H - y);
  // the crystal lip
  ctx.fillStyle = vgrad(ctx, 'ch-lip', y - 5, y + 14, [[0, '#d8ccff'], [0.4, '#9a8ae8'], [1, '#5a4ab8']]);
  ctx.beginPath();
  ctx.roundRect(L - 4, y - 5, R - L + 8, 17, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(L, y - 3, R - L, 2);
  ctx.fillStyle = GOLD_D;
  ctx.fillRect(L, y + 10, R - L, 3);
  ctx.fillStyle = GOLD;
  for (let i = i0; i <= i1 + 1; i++) {
    const sx = i * TILE;
    if (sx < L - 10 || sx > R + 10) continue;
    ctx.beginPath();
    ctx.moveTo(sx, y - 4);
    ctx.lineTo(sx + 5, y + 4);
    ctx.lineTo(sx, y + 12);
    ctx.lineTo(sx - 5, y + 4);
    ctx.closePath();
    ctx.fill();
  }
  // long reflections
  ctx.fillStyle = 'rgba(200,190,255,0.12)';
  for (let x = Math.floor(L / 190) * 190; x < R; x += 190) ellipse(ctx, x + 60, y + 24, 40, 2, -0.03);
}

function throneChrono(ctx, x, b, time) {
  const cy = b - 160;
  glow(ctx, x, cy, 140, 170, '200,170,255', 0.35);
  // an orbit ring tilted around the great hourglass
  const ring = (front) => {
    ctx.strokeStyle = 'rgba(255,214,106,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, cy, 100, 26, -0.18, front ? 0 : Math.PI, front ? Math.PI : TAU);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + time * 0.4;
      const inFront = Math.sin(a) > 0;
      if (inFront !== front) continue;
      const ex = Math.cos(a) * 100, ey = Math.sin(a) * 26;
      const px = x + ex * Math.cos(-0.18) - ey * Math.sin(-0.18), py = cy + ex * Math.sin(-0.18) + ey * Math.cos(-0.18);
      ctx.fillStyle = i % 3 ? '#fff3c0' : '#9fe8ff';
      star(ctx, px, py, i % 3 ? 3.5 : 5);
    }
  };
  ring(false);
  const frac = (time / 24) % 1;
  hourglass(ctx, x, b - 44, 230, frac, time, GOLD, GOLD_D);
  glow(ctx, x, b - 159, 18, 18, '255,240,180', 0.6);
  ring(true);
  // dais
  for (const [w, y, c] of [[200, b - 22, VIO_D], [160, b - 44, VIO]]) {
    ctx.fillStyle = c;
    ctx.strokeStyle = GOLD_D;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, w, 24, 6);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = `rgba(255,214,106,${0.5 + 0.3 * Math.sin(time * 2)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 64, b - 32);
  ctx.lineTo(x + 64, b - 32);
  ctx.stroke();
}

function exitChrono(ctx, time) {
  const x = DEN_EXIT_X, b = GROUND, hw = 40, top = b - 128;
  const opening = () => {
    ctx.beginPath();
    ctx.moveTo(x - hw, b + 2);
    ctx.lineTo(x - hw, top + hw);
    ctx.arc(x, top + hw, hw, Math.PI, 0);
    ctx.lineTo(x + hw, b + 2);
    ctx.closePath();
  };
  glow(ctx, x, b - 50, 110, 90, '170,220,255', 0.35);
  ctx.save();
  opening();
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, 'ch-exit', top, b, [[0, '#4a3c96'], [0.55, '#7a8ad8'], [1, '#bfeaf4']]);
  ctx.fillRect(x - hw, top, hw * 2, b - top + 4);
  ctx.fillStyle = 'rgba(255,250,235,0.9)';
  for (let i = 0; i < 6; i++) circle(ctx, x - hw + ((i * 29) % (hw * 2)), top + 14 + ((i * 41) % 50), 1.3);
  ctx.fillStyle = 'rgba(235,230,255,0.95)';
  for (let i = 0; i < 4; i++) circle(ctx, x - hw + i * 26, b - 24 + (i % 2) * 6, 18);
  ctx.restore();
  glow(ctx, x + 30, b + 4, 90, 14, '200,230,255', 0.35);
  // a frame of crystal blocks with gold edges
  for (let i = 0; i <= 10; i++) {
    const k = i / 10;
    let bx, by;
    if (k < 0.25) [bx, by] = [x - hw - 8, b - 10 - (k / 0.25) * (b - top - hw - 10)];
    else if (k > 0.75) [bx, by] = [x + hw + 8, b - 10 - ((1 - k) / 0.25) * (b - top - hw - 10)];
    else {
      const a = Math.PI + ((k - 0.25) / 0.5) * Math.PI;
      [bx, by] = [x + Math.cos(a) * (hw + 8), top + hw + Math.sin(a) * (hw + 8)];
    }
    ctx.fillStyle = i % 2 ? '#5a4ab8' : VIO;
    ctx.strokeStyle = GOLD_D;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx - 11, by - 10, 22, 20, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(bx - 8, by - 7, 5, 12);
  }
  glow(ctx, x, top - 10, 24, 24, '255,214,106', 0.55 + 0.2 * Math.sin(time * 2));
  miniClock(ctx, x, top - 10, 13, time * 0.2, time * 2, '#fff6e0', GOLD_D, '#3a2f72', 2);
  ctx.save();
  ctx.translate(x, top - 42);
  ctx.rotate(Math.sin(time * 1.3) * 0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const label = 'Citadel';
  const tw = ctx.measureText(label).width + 40;
  ctx.fillStyle = '#3a2f72';
  ctx.strokeStyle = GOLD_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -12, tw, 24, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, label, 7, 0.5, 13, '#fff6d8');
  arrow(ctx, -tw / 2 + 13, 0, -1, 0.8, '#fff6d8');
  ctx.restore();
}

function bannerChrono(ctx, name, x, time) {
  const top = 70;
  ctx.save();
  ctx.font = "700 20px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = ctx.measureText(name).width + 84, hh = 44;
  const sw = Math.sin(time * 0.9) * 1.5;
  ctx.strokeStyle = GOLD_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - tw / 2 + 16, 0);
  ctx.lineTo(x - tw / 2 + 16 + sw, top);
  ctx.moveTo(x + tw / 2 - 16, 0);
  ctx.lineTo(x + tw / 2 - 16 + sw, top);
  ctx.stroke();
  ctx.translate(x + sw, top);
  glow(ctx, 0, hh / 2, tw * 0.7, hh * 1.4, '200,170,255', 0.3);
  ctx.fillStyle = '#2e2468';
  ctx.strokeStyle = '#16123a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, 0);
  ctx.lineTo(tw / 2, 0);
  ctx.lineTo(tw / 2, hh);
  for (let i = 5; i >= 0; i--) {
    const x0 = -tw / 2 + (tw * i) / 6;
    ctx.quadraticCurveTo(x0 + tw / 12, hh + 14, x0, hh);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GOLD_D;
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - 10, -5, tw + 20, 10, 5);
  ctx.fill();
  ctx.fillStyle = GOLD;
  circle(ctx, -tw / 2 - 10, 0, 5);
  circle(ctx, tw / 2 + 10, 0, 5);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 6, 6, tw - 12, hh - 12, 6);
  ctx.stroke();
  for (const side of [-1, 1]) {
    const ex = side * (tw / 2 - 22);
    hourglass(ctx, ex, hh / 2 + 10, 20, (time / 6 + (side > 0 ? 0.5 : 0)) % 1, time, GOLD, GOLD_D);
  }
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowOffsetY = 2;
  text(ctx, name, 0, hh / 2 + 1, 20, '#fff6d8');
  ctx.restore();
}

function ledgeChrono(ctx, p, i, time) {
  const { x, y, w } = p;
  const cx = x + w / 2;
  glow(ctx, cx, y + 26, w * 0.6, 44, '170,150,255', 0.42);
  // a little clock turning under the slab, crystals hanging off it
  ctx.fillStyle = '#342c6a';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 14);
  ctx.lineTo(x + w - 8, y + 14);
  ctx.lineTo(cx + w * 0.2, y + 30);
  ctx.lineTo(cx - w * 0.2, y + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(200,190,255,0.85)';
  for (const [dx, hh] of [[-0.32, 14], [-0.22, 22], [0.22, 18], [0.32, 12]]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * w - 5, y + 16);
    ctx.lineTo(cx + dx * w, y + 16 + hh);
    ctx.lineTo(cx + dx * w + 5, y + 16);
    ctx.fill();
  }
  gear(ctx, cx, y + 34, 17, 12, time * 0.5 * (i % 2 ? -1 : 1), GOLD_D, '#6a5020', 0, 1.5);
  miniClock(ctx, cx, y + 34, 13, time * 0.15 + i, time * 1.4 + i * 2, '#fff6e0', GOLD, '#3a2f72', 1.8);
  // the slab
  ctx.fillStyle = VIO;
  ctx.strokeStyle = '#1e1848';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 3, w + 10, 20, 8);
  ctx.fill();
  ctx.stroke();
  const g = ctx.createLinearGradient(0, y - 5, 0, y + 6);
  g.addColorStop(0, '#d8ccff');
  g.addColorStop(1, '#8a7ae0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 5, w + 10, 10, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.roundRect(x + 2, y - 4, w - 4, 2.5, 1.2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 9);
  ctx.lineTo(x + w + 2, y + 9);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  for (let k = 0; k < 5; k++) {
    const kx = x + 12 + (k * (w - 24)) / 4;
    ctx.beginPath();
    ctx.moveTo(kx, y + 5);
    ctx.lineTo(kx + 4, y + 9);
    ctx.lineTo(kx, y + 13);
    ctx.lineTo(kx - 4, y + 9);
    ctx.fill();
  }
  for (let k = 0; k < 2; k++) {
    const ang = time * 1.1 + k * Math.PI + i;
    const ox = cx + Math.cos(ang) * (w / 2 + 12), oy = y + 10 + Math.sin(ang) * 14;
    ctx.fillStyle = k ? '#9fe8ff' : '#fff3c0';
    star(ctx, ox, oy, 3.5);
  }
}

function ambientChrono(ctx, L, R, time) {
  for (const p of SANCTUM.sand) {
    const fall = (time * p.sp + p.y) % 460;
    const x = p.x + Math.sin(time * 0.6 + p.p) * 26, y = fall - 5;
    if (x < L || x > R) continue;
    const a = 0.45 + 0.4 * Math.sin(time * 2 + p.p);
    if (p.gold) {
      ctx.fillStyle = `rgba(255,222,140,${a})`;
      circle(ctx, x, y, 1.5 * p.s);
    } else {
      glow(ctx, x, y, 6 * p.s, 6 * p.s, '159,232,255', a * 0.5);
      ctx.fillStyle = `rgba(220,248,255,${a})`;
      star(ctx, x, y, 2.4 * p.s);
    }
  }
}

function drawSanctum(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'ch-bg', 0, GROUND + 10, [[0, '#0e0a2a'], [0.3, '#1e1652'], [0.7, '#2e2a72'], [1, '#2c5a86']]);
  ctx.fillRect(L, 0, R - L, H);
  sanctumBack(ctx, L, R, camX, viewW, time);
  if (visible(THRONE_X - 130, THRONE_X + 130, L, R)) throneChrono(ctx, THRONE_X, GROUND, time);
  floorChrono(ctx, Math.max(-40, L), Math.min(DEN_W + 40, R), time);
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) exitChrono(ctx, time);
  if (visible(750 - 280, 750 + 280, L, R)) bannerChrono(ctx, den?.name ?? 'The Hour Sanctum', 750, time);
  DEN_PLATFORMS.forEach((p, i) => {
    if (visible(p.x - 60, p.x + p.w + 60, L, R)) ledgeChrono(ctx, p, i, time);
  });
  ambientChrono(ctx, L, R, time);
  ctx.restore();
}

export const DEN_ART = { clock: drawFoundry, chrono: drawSanctum };

// ——— the doorways in the Citadel ———

function denMouth(ctx, x, b) {
  const mw = 46, mh = 104, mtop = b - mh;
  ctx.beginPath();
  ctx.moveTo(x - mw, b + 2);
  ctx.lineTo(x - mw, mtop + mw);
  ctx.arc(x, mtop + mw, mw, Math.PI, 0);
  ctx.lineTo(x + mw, b + 2);
  ctx.closePath();
}

function entranceClock(ctx, x, b, time) {
  ctx.save();
  // a brass gatehouse: a riveted tower with a dome, gears and a chimney
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(x - 100, b + 4);
    ctx.lineTo(x - 100, b - 120);
    ctx.quadraticCurveTo(x - 100, b - 150, x - 70, b - 150);
    ctx.lineTo(x + 70, b - 150);
    ctx.quadraticCurveTo(x + 100, b - 150, x + 100, b - 120);
    ctx.lineTo(x + 100, b + 4);
    ctx.closePath();
  };
  // chimney behind
  ctx.fillStyle = '#7a4a3a';
  ctx.strokeStyle = '#4a2a28';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x + 52, b - 210, 22, 70, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(x + 48, b - 218, 30, 12, 5);
  ctx.fill();
  ctx.stroke();
  for (let j = 0; j < 3; j++) {
    const k = (time * 0.45 + j / 3) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.75 * Math.sin(k * Math.PI)})`;
    circle(ctx, x + 63 + Math.sin(k * 5 + j) * 7 + k * 14, b - 226 - k * 60, 7 + k * 12);
  }
  // side gears
  for (const [gx, gy, r, dir] of [[x - 100, b - 104, 26, 1], [x - 96, b - 54, 16, -1.6], [x + 102, b - 80, 22, -1]]) {
    gear(ctx, gx, gy, r, Math.round(r / 2.4), time * 0.7 * dir, '#d89a50', INK_B, r * 0.3, 2.5);
    ctx.fillStyle = BRASS_L;
    circle(ctx, gx, gy, r * 0.16);
  }
  const g = ctx.createLinearGradient(x - 100, 0, x + 100, 0);
  g.addColorStop(0, '#c88a48');
  g.addColorStop(0.35, '#f6d690');
  g.addColorStop(1, '#b8783e');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = INK_B;
  ctx.lineWidth = 3;
  ctx.stroke();
  // the dome, with a clock face
  ctx.fillStyle = '#e0a060';
  ctx.beginPath();
  ctx.moveTo(x - 60, b - 148);
  ctx.quadraticCurveTo(x - 58, b - 206, x, b - 208);
  ctx.quadraticCurveTo(x + 58, b - 206, x + 60, b - 148);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ellipse(ctx, x - 26, b - 184, 10, 16, -0.4);
  ctx.strokeStyle = INK_B;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, b - 208);
  ctx.lineTo(x, b - 226);
  ctx.stroke();
  ctx.fillStyle = '#e06a5a';
  circle(ctx, x, b - 228, 5);
  ctx.fillStyle = BRASS_D;
  circle(ctx, x, b - 168, 25);
  miniClock(ctx, x, b - 168, 20, time * 0.05, time * 0.6, '#fff6e0', BRASS, INK_B, 2.4);
  // panel lines and rivets
  ctx.strokeStyle = 'rgba(106,70,48,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 100, b - 140);
  ctx.lineTo(x + 100, b - 140);
  ctx.moveTo(x - 100, b - 30);
  ctx.lineTo(x + 100, b - 30);
  ctx.stroke();
  ctx.fillStyle = INK_B;
  for (let k = -4; k <= 4; k++) {
    circle(ctx, x + k * 22, b - 140 + 6, 2);
    circle(ctx, x + k * 22, b - 30 + 6, 2);
  }
  for (const s of [-1, 1]) {
    // portholes either side
    ctx.fillStyle = BRASS_D;
    circle(ctx, x + s * 74, b - 116, 11);
    ctx.fillStyle = `rgba(255,200,120,${0.75 + 0.2 * Math.sin(time * 3 + s)})`;
    circle(ctx, x + s * 74, b - 116, 7);
  }
  // the mouth: a warm furnace glow inside
  const mtop = b - 104;
  const mg = ctx.createLinearGradient(0, mtop, 0, b);
  mg.addColorStop(0, '#2a1622');
  mg.addColorStop(1, '#5a2e2a');
  ctx.fillStyle = mg;
  denMouth(ctx, x, b);
  ctx.fill();
  ctx.save();
  denMouth(ctx, x, b);
  ctx.clip();
  glow(ctx, x, b, 70, 50, '255,140,60', 0.55 + 0.15 * Math.sin(time * 5));
  // a cog shadow turning deep inside
  gear(ctx, x + 24, b - 30, 28, 12, time * 0.6, 'rgba(20,10,16,0.4)', null, 9);
  ctx.restore();
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 9;
  denMouth(ctx, x, b);
  ctx.stroke();
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 4;
  denMouth(ctx, x, b);
  ctx.stroke();
  // gear teeth round the arch, like a gate's portcullis
  ctx.fillStyle = BRASS_D;
  for (const fx of [-30, -15, 0, 15, 30]) {
    const fy = mtop + 46 - Math.sqrt(Math.max(0, 46 * 46 - fx * fx)) + 3;
    ctx.beginPath();
    ctx.roundRect(x + fx - 5, fy - 2, 10, Math.abs(fx) < 10 ? 14 : 10, 3);
    ctx.fill();
  }
  ctx.restore();
  return mtop;
}

function entranceChrono(ctx, x, b, time) {
  ctx.save();
  // a violet crystal mound with a floating clock ring above it
  ctx.fillStyle = '#3a3478';
  ctx.beginPath();
  ctx.moveTo(x - 114, b + 4);
  ctx.bezierCurveTo(x - 110, b - 110, x - 60, b - 156, x, b - 158);
  ctx.bezierCurveTo(x + 60, b - 156, x + 110, b - 110, x + 114, b + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GOLD_D;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ellipse(ctx, x - 50, b - 104, 30, 44, -0.4);
  // crystals poking out
  for (const [dx, hh, col, rgb] of [[-74, 40, '#c9b6ff', '201,182,255'], [-50, 62, '#9fe8ff', '159,232,255'], [56, 54, '#c9b6ff', '201,182,255'], [80, 34, '#9fe8ff', '159,232,255']]) {
    const by = b - 100 + Math.abs(dx) * 0.5;
    glow(ctx, x + dx, by - hh * 0.5, 22, hh * 0.6, rgb, 0.45);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x + dx - 8, by + 6);
    ctx.lineTo(x + dx - 7, by - hh + 10);
    ctx.lineTo(x + dx, by - hh);
    ctx.lineTo(x + dx + 7, by - hh + 10);
    ctx.lineTo(x + dx + 8, by + 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(x + dx - 5, by - hh + 12, 3, hh - 16);
  }
  // the floating clock
  const cy = b - 196 + Math.sin(time * 1.2) * 5;
  glow(ctx, x, cy, 70, 70, '200,170,255', 0.45);
  ctx.strokeStyle = 'rgba(255,214,106,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 7]);
  ctx.lineDashOffset = -time * 8;
  ctx.beginPath();
  ctx.arc(x, cy, 50, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = VIO_D;
  circle(ctx, x, cy, 38);
  miniClock(ctx, x, cy, 32, time * 0.1, time * 1.5, 'rgba(120,100,220,0.7)', GOLD, '#fff3c0', 3);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + time * 0.3;
    ctx.fillStyle = '#fff3c0';
    star(ctx, x + Math.cos(a) * 50, cy + Math.sin(a) * 50, 4);
  }
  // little shards drifting up from the mound to it
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.3 + i / 4) % 1;
    ctx.fillStyle = `rgba(200,240,255,${Math.sin(k * Math.PI)})`;
    star(ctx, x + Math.sin(i * 2.3 + k * 3) * 30, b - 150 - k * 30, 3);
  }
  // the mouth: starry dark inside
  const mtop = b - 104;
  const mg = ctx.createLinearGradient(0, mtop, 0, b);
  mg.addColorStop(0, '#0e0a26');
  mg.addColorStop(1, '#2a2058');
  ctx.fillStyle = mg;
  denMouth(ctx, x, b);
  ctx.fill();
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgba(230,240,255,${0.4 + 0.4 * Math.sin(time * 2 + i * 1.7)})`;
    circle(ctx, x - 34 + ((i * 37) % 68), mtop + 16 + ((i * 53) % 80), 1.3);
  }
  ctx.strokeStyle = VIO_D;
  ctx.lineWidth = 7;
  denMouth(ctx, x, b);
  ctx.stroke();
  ctx.strokeStyle = GOLD_D;
  ctx.lineWidth = 2.5;
  denMouth(ctx, x, b);
  ctx.stroke();
  ctx.fillStyle = '#8a7cd0';
  for (const fx of [-24, -8, 8, 24]) {
    const fy = mtop + 46 - Math.sqrt(Math.max(0, 46 * 46 - fx * fx)) + 2;
    ctx.beginPath();
    ctx.moveTo(fx + x - 6, fy);
    ctx.lineTo(x + fx, fy + (Math.abs(fx) < 10 ? 18 : 12));
    ctx.lineTo(x + fx + 6, fy);
    ctx.fill();
  }
  ctx.restore();
  return mtop;
}

export const ENTRANCE_ART = {
  clock(ctx, x, groundY, time) {
    const mtop = entranceClock(ctx, x, groundY, time);
    const den = bossSign(ctx, x, 118, groundY, 'clock', time, '#b8783e', INK_B);
    peekEyes(ctx, x, mtop + 58, den, time, '150,250,235');
  },
  chrono(ctx, x, groundY, time) {
    const mtop = entranceChrono(ctx, x, groundY, time);
    const den = bossSign(ctx, x, 104, groundY, 'chrono', time, '#4a3f8a', GOLD_D);
    peekEyes(ctx, x, mtop + 58, den, time, '255,226,140');
  },
};

// ——— the bosses ———

// The Clockwork Colossus: a chunky brass robot, one huge lens eye, a spinning clock-gear heart, piston arms
function drawColossus(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const time = st.time ?? t;
  const alive = dying < 0.02;
  const ol = rageCol('#5a3626', enr, 0.2);
  const step = st.walking ? Math.sin(t * 6 + seed) : 0;
  const tx0 = -w * 0.38, tx1 = w * 0.38, ty0 = -h * 0.84, ty1 = -h * 0.2;
  const capR = w * 0.2;
  const sil = () => {
    ctx.beginPath();
    ctx.roundRect(tx0, ty0, tx1 - tx0, ty1 - ty0, 40);
    ctx.moveTo(capR + w * 0.02, ty0 + 6);
    ctx.ellipse(w * 0.02, ty0 + 6, capR, h * 0.085, 0, 0, Math.PI, true);
    ctx.closePath();
  };
  const brassG = (y0, y1) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, rageCol('#ffe6a8', enr, 0.22));
    g.addColorStop(0.5, rageCol('#f0bc64', enr, 0.28));
    g.addColorStop(1, rageCol('#c8843e', enr, 0.32));
    return g;
  };
  const shoulderY = -h * 0.66;
  // arm poses: [fist x, fist y] per side (+1 front, -1 back)
  const pose = (s) => {
    if (warn) return [s * w * 0.3, -h * 1.02 + Math.sin(time * 18) * 3];
    if (charging) return s > 0 ? [w * 0.66, -h * 0.5] : [-w * 0.2, -h * 0.52];
    const sw = st.walking ? -step * s * 10 : Math.sin(t * 1.6 + seed + s) * 3;
    return [s * w * 0.52 + sw, -h * 0.3];
  };
  const arm = (s) => {
    const sx = s * w * 0.38, [fx, fy] = pose(s);
    const mx = (sx + fx) / 2 + s * 12, my = (shoulderY + fy) / 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ol;
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(sx, shoulderY);
    ctx.lineTo(mx, my);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.strokeStyle = rageCol('#b8703e', enr, 0.25);
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(sx, shoulderY);
    ctx.lineTo(mx, my);
    ctx.stroke();
    // the shiny piston rod of the forearm
    ctx.strokeStyle = '#4a4a5e';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.strokeStyle = '#dfe6f2';
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = brassG(my - 12, my + 12);
    ctx.strokeStyle = ol;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(mx, my, 12, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // the fist: a big round mitten
    ctx.fillStyle = brassG(fy - 26, fy + 26);
    ctx.beginPath();
    ctx.arc(fx, fy, 25, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(106,60,40,0.5)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (const k of [-0.4, 0, 0.4]) {
      const a = (warn ? -Math.PI / 2 : charging && s > 0 ? 0 : Math.PI / 2) + k;
      ctx.moveTo(fx + Math.cos(a) * 12, fy + Math.sin(a) * 12);
      ctx.lineTo(fx + Math.cos(a) * 22, fy + Math.sin(a) * 22);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ellipse(ctx, fx - 8, fy - 10, 8, 5, -0.5);
  };
  // legs (behind the torso)
  for (const s of [-1, 1]) {
    const lift = Math.max(0, s * step) * 12;
    const lx = s * w * 0.2;
    ctx.fillStyle = '#4a4a5e';
    ctx.beginPath();
    ctx.roundRect(lx - w * 0.06, ty1 - 14, w * 0.12, -ty1 - 6 - lift, 6);
    ctx.fill();
    ctx.fillStyle = '#c8ccdc';
    ctx.fillRect(lx - w * 0.03, ty1 - 6, w * 0.035, -ty1 - 22 - lift);
    ctx.fillStyle = brassG(-24 - lift, -lift);
    ctx.strokeStyle = ol;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(lx - w * 0.13 + w * 0.02, -24 - lift, w * 0.26, 24, [12, 12, 6, 6]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ol;
    for (const k of [-1, 0, 1]) circle(ctx, lx + w * 0.02 + k * w * 0.07, -8 - lift, 2.2);
  }
  arm(-1);
  // smokestacks on its back
  for (const [dx, ht] of [[-0.24, 34], [-0.1, 24]]) {
    const sx = w * dx;
    ctx.fillStyle = rageCol('#7a4a3a', enr, 0.2);
    ctx.strokeStyle = ol;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(sx - 9, ty0 - ht + 10, 18, ht, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rageCol('#c8843e', enr, 0.2);
    ctx.beginPath();
    ctx.roundRect(sx - 12, ty0 - ht + 4, 24, 10, 4);
    ctx.fill();
    ctx.stroke();
    if (alive) {
      const n = warn ? 4 : 2;
      for (let j = 0; j < n; j++) {
        const k = (time * (warn ? 1.4 : 0.6) + j / n + dx) % 1;
        ctx.fillStyle = enr ? `rgba(255,190,170,${0.6 * Math.sin(k * Math.PI)})` : `rgba(255,250,245,${0.6 * Math.sin(k * Math.PI)})`;
        circle(ctx, sx - k * 18 + Math.sin(k * 6 + j) * 4, ty0 - ht - k * 46, 6 + k * 11);
      }
    }
  }
  // torso
  ctx.fillStyle = brassG(ty0 - h * 0.08, ty1);
  sil();
  ctx.fill();
  ctx.strokeStyle = ol;
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // belly band and panel seams
  ctx.fillStyle = rageCol('#c8843e', enr, 0.3);
  ctx.beginPath();
  ctx.roundRect(tx0 + 2, -h * 0.5, tx1 - tx0 - 4, 10, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.roundRect(tx0 + 16, ty0 + 10, (tx1 - tx0) * 0.45, 8, 4);
  ctx.fill();
  ellipse(ctx, tx0 + 18, -h * 0.62, 6, h * 0.1, 0);
  ctx.fillStyle = ol;
  for (let k = 0; k < 8; k++) {
    const rx = tx0 + 20 + (k * (tx1 - tx0 - 40)) / 7;
    circle(ctx, rx, ty1 - 10, 2.2);
    circle(ctx, rx, -h * 0.5 + 5, 1.8);
  }
  // side vents (red-hot when overclocked)
  for (let k = 0; k < 3; k++) {
    const vy = -h * 0.42 + k * 12;
    ctx.fillStyle = enr && alive ? `rgba(255,${90 + 60 * Math.sin(time * 9 + k)},60,0.95)` : 'rgba(80,40,30,0.55)';
    ctx.beginPath();
    ctx.roundRect(tx0 + 10, vy, 26, 6, 3);
    ctx.fill();
  }
  if (enr && alive) glow(ctx, tx0 + 23, -h * 0.36, 30, 24, '255,90,60', 0.6);
  // the clock-gear heart
  const cgx = -w * 0.02, cgy = -h * 0.35, rot = t * (enr ? 3 : warn ? 2 : 0.7);
  ctx.fillStyle = '#4a2e2e';
  circle(ctx, cgx, cgy, 38);
  glow(ctx, cgx, cgy, 44, 44, enr ? '255,90,60' : '140,240,230', alive ? 0.55 : 0.1);
  gear(ctx, cgx, cgy, 28, 12, rot, rageCol('#ffd88a', enr, 0.2), ol, 0, 2.5);
  miniClock(ctx, cgx, cgy, 19, rot * 0.08, rot, '#fff6e0', rageCol('#c8843e', enr, 0.3), '#5a3626', 2.4);
  // the big lens eye
  const ex = w * 0.1, ey = -h * 0.665, eR = 31;
  ctx.fillStyle = rageCol('#b8703e', enr, 0.2);
  ctx.strokeStyle = ol;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(ex, ey, eR + 9, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,180,0.7)';
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + Math.PI / 8;
    circle(ctx, ex + Math.cos(a) * (eR + 4.5), ey + Math.sin(a) * (eR + 4.5), 1.8);
  }
  if (alive) {
    const hot = warn || enr;
    const lg = ctx.createRadialGradient(ex - 8, ey - 10, 2, ex, ey, eR);
    lg.addColorStop(0, hot ? '#fff0e0' : '#effffb');
    lg.addColorStop(0.45, hot ? '#ff8a6a' : '#7fe8dc');
    lg.addColorStop(1, hot ? '#a83a3a' : '#2a7a8c');
    ctx.fillStyle = lg;
    circle(ctx, ex, ey, eR);
    if (warn) glow(ctx, ex, ey, eR * 2.2, eR * 2.2, '255,120,90', 0.5 + 0.3 * Math.sin(time * 16));
    // the iris / aperture
    const pr = warn ? 7 : charging ? 9 : 12;
    const px = ex + 5, py = ey + (charging ? 3 : 0);
    ctx.fillStyle = '#1e2a3a';
    circle(ctx, px, py, pr);
    ctx.strokeStyle = hot ? 'rgba(255,220,200,0.6)' : 'rgba(200,255,250,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, pr + 5, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    circle(ctx, px + pr * 0.3, py - pr * 0.45, Math.max(2, pr * 0.32));
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ellipse(ctx, ex - 12, ey - 13, 9, 5, -0.6);
    // blinking shutter
    const blink = ((t + seed * 7) % 4.2) < 0.15;
    if (blink) {
      ctx.fillStyle = rageCol('#e0a050', enr, 0.25);
      circle(ctx, ex, ey, eR);
      ctx.strokeStyle = ol;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ex - eR, ey);
      ctx.lineTo(ex + eR, ey);
      ctx.stroke();
    }
    if (hot) {
      // an angry brow plate
      ctx.fillStyle = rageCol('#c8843e', enr, 0.3);
      ctx.strokeStyle = ol;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ex - eR - 8, ey - eR - 4);
      ctx.lineTo(ex + eR + 6, ey - eR + 12);
      ctx.lineTo(ex + eR + 6, ey - eR - 2);
      ctx.lineTo(ex - eR - 8, ey - eR - 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // dying: a dim, cracked lens
    ctx.fillStyle = '#5a6a78';
    circle(ctx, ex, ey, eR);
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ex - 12, ey - 12);
    ctx.lineTo(ex + 12, ey + 12);
    ctx.moveTo(ex + 12, ey - 12);
    ctx.lineTo(ex - 12, ey + 12);
    ctx.stroke();
  }
  // blushing cheek lamps and a little grille mouth
  ctx.fillStyle = enr ? 'rgba(255,90,90,0.6)' : 'rgba(255,140,170,0.55)';
  ellipse(ctx, ex - eR - 14, ey + eR + 2, 9, 5);
  ellipse(ctx, ex + eR + 10, ey + eR + 2, 7, 5);
  const my = ey + eR + 17;
  ctx.strokeStyle = '#4a2a22';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (!alive) {
    ctx.moveTo(ex - 12, my);
    for (let k = 1; k <= 4; k++) ctx.lineTo(ex - 12 + k * 6, my + (k % 2 ? -3 : 3));
    ctx.stroke();
  } else if (warn || charging) {
    ctx.fillStyle = '#3a1e1e';
    ctx.roundRect(ex - 11, my - 6, 22, 13, 6);
    ctx.fill();
    glow(ctx, ex, my, 14, 9, '255,150,80', 0.8);
    ctx.strokeStyle = '#b8703e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - 3.5, my - 6);
    ctx.lineTo(ex - 3.5, my + 7);
    ctx.moveTo(ex + 3.5, my - 6);
    ctx.lineTo(ex + 3.5, my + 7);
    ctx.stroke();
  } else if (enr) {
    ctx.arc(ex, my + 6, 7, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  } else {
    ctx.arc(ex, my - 4, 8, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }
  // the cap: an antenna with a tiny whirling gear
  ctx.strokeStyle = ol;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.06, ty0 - h * 0.08);
  ctx.lineTo(w * 0.08, ty0 - h * 0.15);
  ctx.stroke();
  gear(ctx, w * 0.08, ty0 - h * 0.17, 8, 7, t * (enr ? 8 : 3), enr ? '#ff7a5a' : '#7fe8dc', ol, 2.5, 1.5);
  // the front arm and shoulder
  arm(1);
  for (const s of [-1, 1]) {
    if (s < 0) continue;
    ctx.fillStyle = brassG(shoulderY - 20, shoulderY + 20);
    ctx.strokeStyle = ol;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s * w * 0.38, shoulderY, 20, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ellipse(ctx, s * w * 0.38 - 6, shoulderY - 8, 7, 4, -0.5);
  }
  // overclocked: crackling sparks around it
  if (enr && alive) {
    for (let k = 0; k < 2; k++) {
      const seedK = Math.floor(time * 10) + k * 31;
      if (hash(seedK) < 0.45) continue;
      const a0 = hash(seedK + 1) * TAU, rr = w * 0.45;
      const x0 = Math.cos(a0) * rr * 0.8, y0 = -h * 0.5 + Math.sin(a0) * h * 0.4;
      zap(ctx, x0, y0, x0 + (hash(seedK + 2) - 0.5) * 60, y0 + (hash(seedK + 3) - 0.5) * 60, 4, 8, seedK, '255,120,90', 0.9, 5);
    }
  }
  return sil;
}

// Chronos, Keeper of Hours: a floating hooded figure of starry violet with a golden clock-halo
function drawChronos(ctx, w, h, st, m) {
  const { t, seed, enr, warn, charging, dying } = st;
  const time = st.time ?? t;
  const alive = dying < 0.02;
  if (m?.special && alive) {
    // blinking out / in: thin, stretched and flickering
    const f = 0.5 + 0.5 * Math.sin(time * 34);
    ctx.globalAlpha *= 0.28 + 0.22 * f;
    ctx.scale(0.6 + 0.08 * f, 1.28);
  }
  const bob = Math.sin(t * 1.7 + seed) * 4;
  ctx.translate(0, bob);
  const ol = '#1a1240';
  const hemY = -h * 0.08;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.02, -h);
    ctx.bezierCurveTo(w * 0.24, -h * 1.0, w * 0.36, -h * 0.82, w * 0.34, -h * 0.6);
    ctx.bezierCurveTo(w * 0.36, -h * 0.36, w * 0.52, -h * 0.2, w * 0.5, hemY);
    for (let i = 1; i <= 6; i++) {
      const x1 = w * 0.5 - (i / 6) * w;
      const cy = hemY + 16 + Math.sin(t * 3 + i * 1.3) * 5;
      ctx.quadraticCurveTo(x1 + w / 12, cy, x1, hemY + (i === 6 ? 0 : 2));
    }
    ctx.bezierCurveTo(-w * 0.52, -h * 0.2, -w * 0.4, -h * 0.36, -w * 0.36, -h * 0.6);
    ctx.bezierCurveTo(-w * 0.36, -h * 0.84, -w * 0.26, -h * 1.0, -w * 0.02, -h);
    ctx.closePath();
  };
  // wisps trailing below
  if (alive) {
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.7 + i / 3) % 1;
      ctx.fillStyle = `rgba(150,130,255,${0.4 * (1 - k)})`;
      ellipse(ctx, (i - 1) * w * 0.25 - (charging ? k * 50 : 0), hemY + 14 + k * 26, w * 0.1 * (1 - k * 0.5), 7 * (1 - k * 0.4));
    }
  }
  // the clock halo behind the head
  const hx = -w * 0.04, hy = -h * 0.76, HR = w * 0.5;
  const hot = warn || enr;
  const gold = enr ? '#ffb070' : GOLD, goldD = enr ? '#c8603a' : GOLD_D;
  const spin = t * (warn ? 7 : enr ? 2.4 : 1.1);
  glow(ctx, hx, hy, HR * 1.4, HR * 1.4, hot ? '255,170,110' : '255,214,106', warn ? 0.6 + 0.25 * Math.sin(time * 14) : 0.32);
  ctx.fillStyle = hot ? 'rgba(255,190,140,0.14)' : 'rgba(255,240,200,0.12)';
  circle(ctx, hx, hy, HR);
  ctx.strokeStyle = goldD;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(hx, hy, HR, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,240,190,0.6)`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.lineDashOffset = -spin * 6;
  ctx.beginPath();
  ctx.arc(hx, hy, HR + 11, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const r0 = HR - (i % 3 ? 7 : 13);
    ctx.moveTo(hx + Math.sin(a) * r0, hy - Math.cos(a) * r0);
    ctx.lineTo(hx + Math.sin(a) * (HR - 2), hy - Math.cos(a) * (HR - 2));
  }
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    ctx.fillStyle = i % 2 ? '#9fe8ff' : '#fff3c0';
    star(ctx, hx + Math.sin(a) * (HR + 11), hy - Math.cos(a) * (HR + 11), 5);
  }
  hands(ctx, hx, hy, HR * 0.95, spin * 0.12 + seed, spin + seed * 3, gold, 4.5);
  // body
  const g = ctx.createLinearGradient(0, -h, 0, hemY);
  g.addColorStop(0, rageCol('#7a66e0', enr, 0.3));
  g.addColorStop(1, rageCol('#2a1c6e', enr, 0.3));
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = ol;
  ctx.lineWidth = 3.2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // stars inside the robe
  ctx.save();
  body();
  ctx.clip();
  glow(ctx, -w * 0.1, -h * 0.3, w * 0.35, h * 0.16, '255,140,210', 0.3);
  glow(ctx, w * 0.12, -h * 0.5, w * 0.3, h * 0.14, '120,220,255', 0.3);
  for (const s of SANCTUM.STAR_IN) {
    const tw = 0.5 + 0.5 * Math.sin(time * 2.2 + s.p);
    ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.55 * tw})`;
    if (s.s > 1.5) star(ctx, s.x * w * 0.95, s.y * h, 2.6 + tw);
    else circle(ctx, s.x * w * 0.95, s.y * h, s.s * 0.9);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ellipse(ctx, -w * 0.2, -h * 0.72, w * 0.07, h * 0.12, 0.3);
  ctx.restore();
  // gold trim: the robe's front edge and the hem
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.17, -h * 0.56);
  ctx.quadraticCurveTo(w * 0.2, -h * 0.3, w * 0.24, hemY + 6);
  ctx.stroke();
  // the hood's face opening
  const fx = w * 0.08, fy = -h * 0.71;
  ctx.fillStyle = '#120c30';
  ctx.beginPath();
  ctx.ellipse(fx, fy, w * 0.2, h * 0.115, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,190,255,0.5)';
  for (const [dx, dy] of [[-0.12, -0.04], [0.13, 0.05], [0.02, 0.07]]) circle(ctx, fx + dx * w, fy + dy * h, 1);
  // glowing eyes
  const gap = 12, eyeRgb = hot ? '255,170,120' : '255,226,140';
  if (alive) {
    const blink = ((t + seed * 7) % 4) < 0.13;
    for (const s of [-1, 1]) {
      const ex = fx + s * gap;
      glow(ctx, ex, fy, 13, 11, eyeRgb, 0.9);
      ctx.fillStyle = `rgb(${eyeRgb})`;
      ellipse(ctx, ex, fy, 4.6, blink ? 0.8 : 6.4);
      if (!blink) {
        ctx.fillStyle = '#ffffff';
        circle(ctx, ex + 1.4, fy - 2.2, 1.6);
      }
    }
    if (hot) {
      ctx.strokeStyle = `rgb(${eyeRgb})`;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(fx - gap - 6, fy - 11);
      ctx.lineTo(fx - gap + 5, fy - 7);
      ctx.moveTo(fx + gap + 6, fy - 11);
      ctx.lineTo(fx + gap - 5, fy - 7);
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(${eyeRgb},0.85)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (warn || charging) {
      ctx.fillStyle = `rgba(${eyeRgb},0.9)`;
      ellipse(ctx, fx, fy + 12, 3.2, 3.6);
    } else if (enr) ctx.arc(fx, fy + 16, 4, 1.15 * Math.PI, 1.85 * Math.PI);
    else ctx.arc(fx, fy + 8, 4, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  } else {
    ctx.strokeStyle = `rgb(${eyeRgb})`;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const s of [-1, 1]) {
      const ex = fx + s * gap;
      ctx.moveTo(ex - 3.5, fy - 3.5);
      ctx.lineTo(ex + 3.5, fy + 3.5);
      ctx.moveTo(ex + 3.5, fy - 3.5);
      ctx.lineTo(ex - 3.5, fy + 3.5);
    }
    ctx.stroke();
  }
  // an hourglass pendant
  hourglass(ctx, w * 0.06, -h * 0.34, 30, (time / 8) % 1, time, gold, goldD);
  // floating mitten hands; the front one holds a sceptre shaped like a clock hand
  const handAt = (s) => {
    if (warn) return [s * w * 0.46, -h * 0.9 + Math.sin(time * 12 + s) * 3];
    if (charging) return [s > 0 ? w * 0.58 : -w * 0.5, -h * 0.5];
    return [s * w * 0.52, -h * 0.4 + Math.sin(t * 2 + s * 1.3) * 5];
  };
  for (const s of [-1, 1]) {
    const [px, py] = handAt(s);
    if (s > 0) {
      // the sceptre
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(warn ? 0.3 : charging ? 1.2 : -0.1 + Math.sin(t * 1.2) * 0.06);
      ctx.fillStyle = gold;
      ctx.strokeStyle = goldD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-3, 26);
      ctx.lineTo(-3, -46);
      ctx.lineTo(-10, -50);
      ctx.lineTo(0, -72);
      ctx.lineTo(10, -50);
      ctx.lineTo(3, -46);
      ctx.lineTo(3, 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      glow(ctx, 0, -56, 16, 16, '159,232,255', warn ? 1 : 0.6);
      ctx.fillStyle = '#9fe8ff';
      ctx.beginPath();
      ctx.moveTo(0, -64);
      ctx.lineTo(5, -55);
      ctx.lineTo(0, -48);
      ctx.lineTo(-5, -55);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = gold;
      circle(ctx, 0, 28, 5);
      ctx.restore();
    }
    if (warn) glow(ctx, px, py - 16, 22, 22, hot ? '255,190,140' : '255,230,160', 0.8);
    ctx.fillStyle = rageCol('#8a76ea', enr, 0.3);
    ctx.strokeStyle = ol;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(px, py, 13, 11, s * 0.3, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(ctx, px - 4, py - 4, 4, 2.5, -0.4);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(px - s * 4, py + 7, 9, 3, s * 0.3, 0, Math.PI);
    ctx.stroke();
  }
  // a few motes of time circling it
  if (alive) {
    for (let i = 0; i < 4; i++) {
      const a = t * 0.8 + (i / 4) * TAU;
      const ox = Math.cos(a) * w * 0.62, oy = -h * 0.5 + Math.sin(a) * h * 0.22;
      ctx.fillStyle = i % 2 ? 'rgba(159,232,255,0.9)' : 'rgba(255,230,160,0.9)';
      star(ctx, ox, oy, 3 + Math.sin(time * 3 + i));
    }
  }
  return body;
}

export const BOSS_ART = { colossus: drawColossus, chronos: drawChronos };

// ——— boss effects ———

const FX_RGB = { clock: '255,196,110', chrono: '190,160,255' };
const fxRgb = (e) => FX_RGB[e.theme] ?? '140,235,255';

function blinkMotes(e, r) {
  e.motes = Array.from({ length: 14 }, () => ({ a: r() * TAU, d: 0.6 + r() * 0.7, s: 0.7 + r() * 0.6 }));
}

// the frozen / ticking clocks that time stop scatters around the room
function stopClocks(e, r) {
  e.clocks = Array.from({ length: 8 }, (_, i) => ({
    x: 90 + i * 190 + (r() - 0.5) * 70, y: 90 + r() * 250, r: 26 + r() * 30, a1: r() * TAU, a2: r() * TAU, sp: 4 + r() * 6, d: r() * 0.4,
  }));
  e.motes = Array.from({ length: 50 }, () => ({ x: r() * DEN_W, y: 40 + r() * 400, s: 0.6 + r() * 1 }));
}

function drawStopClock(ctx, c, a1, a2, a, frozen, time) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= a;
  glow(ctx, c.x, c.y, c.r * 1.8, c.r * 1.8, frozen ? '200,230,255' : '220,200,255', 0.4);
  ctx.fillStyle = frozen ? 'rgba(225,240,255,0.55)' : 'rgba(240,230,255,0.45)';
  circle(ctx, c.x, c.y, c.r);
  ctx.strokeStyle = frozen ? '#e8f6ff' : GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = frozen ? 'rgba(90,120,170,0.8)' : 'rgba(70,50,130,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * TAU;
    ctx.moveTo(c.x + Math.sin(ang) * c.r * 0.72, c.y - Math.cos(ang) * c.r * 0.72);
    ctx.lineTo(c.x + Math.sin(ang) * c.r * 0.88, c.y - Math.cos(ang) * c.r * 0.88);
  }
  ctx.stroke();
  hands(ctx, c.x, c.y, c.r, a1, a2, frozen ? '#4a6a9a' : '#3a2f72', 3);
  if (frozen) {
    // a rime of frost on the glass
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c.x - c.r * 0.6, c.y - c.r * 0.2);
    ctx.lineTo(c.x - c.r * 0.2, c.y - c.r * 0.5);
    ctx.lineTo(c.x + c.r * 0.1, c.y - c.r * 0.35);
    ctx.moveTo(c.x - c.r * 0.2, c.y - c.r * 0.5);
    ctx.lineTo(c.x - c.r * 0.3, c.y - c.r * 0.75);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    star(ctx, c.x + c.r * 0.55, c.y - c.r * 0.55, 3 + Math.sin(time * 3 + c.x) * 1);
  }
  ctx.restore();
}

// the great ring at the room's centre
function bigRing(ctx, cx, cy, R, frac, a, frozen, time) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= a;
  const col = frozen ? '230,245,255' : '255,214,106';
  glow(ctx, cx, cy, R * 1.25, R * 1.25, frozen ? '170,215,255' : '255,214,106', 0.25);
  ctx.strokeStyle = `rgba(${col},0.95)`;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
  ctx.stroke();
  ctx.strokeStyle = `rgba(${col},0.5)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 16, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = `rgba(${col},0.85)`;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    if (i / 12 > frac) break;
    const ang = (i / 12) * TAU;
    ctx.moveTo(cx + Math.sin(ang) * (R - 26), cy - Math.cos(ang) * (R - 26));
    ctx.lineTo(cx + Math.sin(ang) * (R - 6), cy - Math.cos(ang) * (R - 6));
  }
  ctx.stroke();
  ctx.restore();
}

// timer-arc + number badge marking a safe tile
function tileBadge(ctx, x, y, label, a, time) {
  const bounce = Math.abs(Math.sin(time * 5 + x * 0.01)) * 4;
  ctx.save();
  ctx.globalAlpha *= a;
  glow(ctx, x, y - bounce, 30, 30, '120,240,160', 0.5);
  ctx.fillStyle = 'rgba(120,240,160,0.97)';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - bounce, 17, 0, TAU);
  ctx.fill();
  ctx.stroke();
  text(ctx, label, x, y - bounce + 1, 20, '#1e4a30');
  ctx.restore();
}

function routeArrow(ctx, x0, x1, y, a, time) {
  const mx = (x0 + x1) / 2, lift = 26 + Math.min(70, Math.abs(x1 - x0) * 0.12);
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.setLineDash([7, 7]);
  ctx.lineDashOffset = -time * 30;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.quadraticCurveTo(mx, y - lift * 2, x1, y);
  ctx.stroke();
  ctx.setLineDash([]);
  // arrowhead at the end, pointing along the curve
  const dir = Math.atan2(y - (y - lift * 2), x1 - mx);
  ctx.translate(x1, y);
  ctx.rotate(dir);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-10, -6);
  ctx.lineTo(-10, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const FX2 = {
  // teleport puff: a column of light pinching shut
  blinkOut: {
    dur: 0.45,
    init: blinkMotes,
    draw(ctx, e, k) {
      const s = e.size ?? 60, rgb = fxRgb(e), cx = e.x, cy = e.y - s * 0.5;
      const fade = 1 - k;
      glow(ctx, cx, cy, s * (1.1 - 0.6 * k), s * (1.1 + 0.3 * k), rgb, fade);
      glow(ctx, cx, cy, s * 0.5 * fade + 1, s * 0.8, '255,255,255', fade * 0.6);
      ctx.fillStyle = `rgba(255,255,255,${0.85 * fade})`;
      ellipse(ctx, cx, cy, Math.max(1, s * 0.22 * (1 - ease(k))), s * (0.55 + 0.7 * k));
      ctx.strokeStyle = `rgba(${rgb},${fade})`;
      ctx.lineWidth = 3 + 3 * fade;
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * (1 - 0.85 * ease(k)) + 2, (s * (1 - 0.85 * ease(k)) + 2) * 0.45, 0, 0, TAU);
      ctx.stroke();
      // tick marks spinning in with it
      ctx.strokeStyle = `rgba(255,255,255,${fade})`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const rr = s * (0.95 - 0.7 * k);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + k * 3;
        ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8);
        ctx.lineTo(cx + Math.cos(a) * (rr - 7), cy + Math.sin(a) * (rr - 7) * 0.8);
      }
      ctx.stroke();
      for (const m of e.motes ?? []) {
        const d = s * m.d * (1 - ease(k)) * 1.3;
        ctx.fillStyle = `rgba(${rgb},${fade})`;
        star(ctx, cx + Math.cos(m.a) * d, cy + Math.sin(m.a) * d * 0.8, 3.5 * m.s * fade + 1);
      }
    },
  },
  // teleport arrival: a burst of light opening out
  blinkIn: {
    dur: 0.45,
    init: blinkMotes,
    draw(ctx, e, k) {
      const s = e.size ?? 60, rgb = fxRgb(e), cx = e.x, cy = e.y - s * 0.5;
      const fade = 1 - k, grow = ease(k);
      if (k < 0.3) glow(ctx, cx, cy, s * 1.2, s * 1.2, '255,255,255', (1 - k / 0.3) * 0.8);
      glow(ctx, cx, cy, s * (0.5 + grow), s * (0.6 + grow * 0.8), rgb, fade * 0.8);
      ctx.fillStyle = `rgba(255,255,255,${0.8 * fade})`;
      ellipse(ctx, cx, cy, Math.max(1, s * 0.2 * fade), s * 1.3 * fade + 2);
      for (let j = 0; j < 2; j++) {
        const kk = clamp(k * 1.4 - j * 0.25, 0, 1);
        if (kk <= 0 || kk >= 1) continue;
        ctx.strokeStyle = `rgba(${rgb},${1 - kk})`;
        ctx.lineWidth = 5 * (1 - kk) + 1;
        ctx.beginPath();
        ctx.ellipse(cx, e.y - 2, s * 1.4 * ease(kk), s * 0.3 * ease(kk) + 1, 0, 0, TAU);
        ctx.stroke();
      }
      for (const m of e.motes ?? []) {
        const d = s * m.d * (0.2 + grow * 1.1);
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        star(ctx, cx + Math.cos(m.a) * d, cy + Math.sin(m.a) * d * 0.8, 3.5 * m.s * fade + 1);
      }
    },
  },
  // Overclock: every tile but the route sparks; the safe tiles are numbered 1, 2, 3
  overclockWarn: {
    dur: 3,
    draw(ctx, e, k) {
      const safe = Array.isArray(e.safe) ? e.safe : [];
      const y = GROUND, pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 14 * k));
      const fadeIn = Math.min(1, k * 5);
      for (let i = 0; i < 10; i++) {
        const x0 = i * TILE;
        if (safe.includes(i)) {
          const g = ctx.createLinearGradient(0, y - 150, 0, y + 10);
          g.addColorStop(0, 'rgba(140,255,190,0)');
          g.addColorStop(1, `rgba(140,255,190,${(0.3 + 0.12 * pulse) * fadeIn})`);
          ctx.fillStyle = g;
          ctx.fillRect(x0 + 3, y - 150, TILE - 6, 160);
          ctx.strokeStyle = `rgba(160,255,200,${(0.7 + 0.3 * pulse) * fadeIn})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(x0 + 6, y - 4, TILE - 12, 20, 8);
          ctx.stroke();
          continue;
        }
        // danger: the plate glows and crackles
        const a = (0.22 + 0.4 * k) * (0.7 + 0.3 * pulse) * fadeIn;
        const g = ctx.createLinearGradient(0, y - 60, 0, y + 16);
        g.addColorStop(0, 'rgba(255,150,70,0)');
        g.addColorStop(1, `rgba(255,120,60,${a})`);
        ctx.fillStyle = g;
        ctx.fillRect(x0 + 3, y - 60, TILE - 6, 76);
        ctx.fillStyle = `rgba(255,${Math.round(150 + 80 * pulse)},90,${a})`;
        ctx.beginPath();
        ctx.roundRect(x0 + 6, y - 3, TILE - 12, 16, 7);
        ctx.fill();
        // little arcs hopping on the plate (more as it charges)
        const n = 1 + Math.floor(k * 3);
        for (let j = 0; j < n; j++) {
          const sd = Math.floor(e.t * 14) * 7 + i * 31 + j * 113;
          const ax = x0 + 12 + hash(sd) * (TILE - 60), len = 24 + hash(sd + 1) * 30;
          zap(ctx, ax, y + 2 - hash(sd + 2) * 6, ax + len, y + 2 - hash(sd + 3) * 14, 4, 6, sd, '255,210,110', fadeIn * (0.6 + 0.4 * k), 5);
        }
      }
      // the route: numbered badges, dashed arrows between them
      const stack = {};
      const pts = safe.map((ti, n) => {
        const c = (stack[ti] = (stack[ti] ?? -1) + 1);
        return { x: ti * TILE + TILE / 2, y: y - 66 - c * 42, n: n + 1, ti };
      });
      for (let n = 1; n < pts.length; n++) {
        if (pts[n].ti === pts[n - 1].ti) continue;
        const a = clamp(k * 4 - n * 0.4, 0, 1);
        routeArrow(ctx, pts[n - 1].x + Math.sign(pts[n].x - pts[n - 1].x) * 22, pts[n].x - Math.sign(pts[n].x - pts[n - 1].x) * 22, y - 66, a, e.t);
      }
      for (const p of pts) tileBadge(ctx, p.x, p.y, String(p.n), clamp(k * 4 - (p.n - 1) * 0.4, 0, 1), e.t);
    },
  },
  // Overclock goes off: a great electric flash across the room
  overclockHit: {
    dur: 0.8,
    init(e, r) {
      e.bolts = Array.from({ length: 9 }, (_, i) => ({ x: 80 + i * 165 + (r() - 0.5) * 60, s: Math.floor(r() * 1000), d: r() * 0.25 }));
    },
    draw(ctx, e, k) {
      const fade = 1 - k;
      ctx.fillStyle = `rgba(255,245,200,${0.55 * fade * fade})`;
      ctx.fillRect(-40, 0, DEN_W + 80, H);
      const g = ctx.createLinearGradient(0, GROUND - 120, 0, GROUND + 20);
      g.addColorStop(0, 'rgba(255,200,110,0)');
      g.addColorStop(1, `rgba(255,220,140,${0.7 * fade})`);
      ctx.fillStyle = g;
      ctx.fillRect(-40, GROUND - 120, DEN_W + 80, 140);
      for (const b of e.bolts ?? []) {
        const kk = clamp((k - b.d) / 0.45, 0, 1);
        if (kk <= 0 || kk >= 1) continue;
        const flick = hash(b.s + Math.floor(e.t * 30)) > 0.3 ? 1 : 0.4;
        zap(ctx, b.x + (hash(b.s) - 0.5) * 40, 30, b.x, GROUND, 9, 22, b.s + Math.floor(e.t * 20), '255,210,110', (1 - kk) * flick, 10);
        glow(ctx, b.x, GROUND, 60, 18, '255,240,180', 1 - kk);
      }
    },
  },
  // Time Stop wind-up: clocks appear all over, spinning down; the colour drains
  timestopWarn: {
    dur: 3,
    init: stopClocks,
    draw(ctx, e, k) {
      ctx.save();
      ctx.globalCompositeOperation = 'saturation';
      ctx.globalAlpha = 0.75 * ease(k);
      ctx.fillStyle = '#808080';
      ctx.fillRect(-40, 0, DEN_W + 80, H);
      ctx.restore();
      ctx.fillStyle = `rgba(120,150,210,${0.16 * k})`;
      ctx.fillRect(-40, 0, DEN_W + 80, H);
      const dur = e.dur || 3;
      for (const c of e.clocks ?? []) {
        const a = clamp((k - c.d) * 4, 0, 1);
        // spinning fast, slowing to a stop as the warning ends
        const turn = c.sp * dur * (k - (k * k) / 2);
        drawStopClock(ctx, c, c.a1 + turn * 0.1, c.a2 + turn, a * 0.9, false, e.t);
      }
      bigRing(ctx, DEN_W / 2, 250, 190, ease(k), Math.min(1, k * 3), false, e.t);
      // the ring's hand sweeping round
      const ha = TAU * ease(k);
      hands(ctx, DEN_W / 2, 250, 180, ha * 0.08, ha, `rgba(255,214,106,${Math.min(1, k * 3) * 0.9})`, 6);
    },
  },
  // Time Stop: the whole den goes grey-blue and still
  timestopHit: {
    dur: 2,
    init: stopClocks,
    draw(ctx, e, k) {
      const a = k < 0.06 ? k / 0.06 : k > 0.85 ? (1 - k) / 0.15 : 1;
      ctx.save();
      ctx.globalCompositeOperation = 'saturation';
      ctx.globalAlpha = a;
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, DEN_W, 540);
      ctx.restore();
      ctx.fillStyle = `rgba(150,175,220,${0.3 * a})`;
      ctx.fillRect(0, 0, DEN_W, 540);
      // the frost of stillness creeping in at the edges
      const v = ctx.createLinearGradient(0, 0, 0, 540);
      v.addColorStop(0, `rgba(220,235,255,${0.3 * a})`);
      v.addColorStop(0.3, 'rgba(220,235,255,0)');
      v.addColorStop(0.8, 'rgba(220,235,255,0)');
      v.addColorStop(1, `rgba(220,235,255,${0.25 * a})`);
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, DEN_W, 540);
      if (k < 0.15) {
        ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - k / 0.15)})`;
        ctx.fillRect(0, 0, DEN_W, 540);
      }
      // motes hanging in the air, not moving
      ctx.fillStyle = `rgba(235,245,255,${0.8 * a})`;
      for (const m of e.motes ?? []) circle(ctx, m.x, m.y, 1.4 * m.s);
      for (const c of e.clocks ?? []) drawStopClock(ctx, c, c.a1, c.a2, a * 0.85, true, e.t);
      bigRing(ctx, DEN_W / 2, 250, 190, 1, a, true, e.t);
      hands(ctx, DEN_W / 2, 250, 180, -0.5, 0.6, `rgba(230,245,255,${0.85 * a})`, 6);
      // a shimmer running round the frozen ring
      const sh = (e.t * 0.7) % 1;
      ctx.fillStyle = `rgba(255,255,255,${a * Math.sin(sh * Math.PI)})`;
      star(ctx, DEN_W / 2 + Math.sin(sh * TAU) * 190, 250 - Math.cos(sh * TAU) * 190, 9);
    },
  },
  // Collapse of Hours wind-up: void gathers at both ends of the den
  collapseWarn: {
    dur: 3,
    init(e, r) {
      e.bits = Array.from({ length: 30 }, () => ({ y: 20 + r() * 430, p: r(), sp: 0.4 + r() * 0.6, side: r() < 0.5 ? -1 : 1, s: 0.6 + r() * 0.8 }));
    },
    draw(ctx, e, k) {
      const W = 40 + 240 * ease(k), pulse = 0.5 + 0.5 * Math.sin(e.t * (5 + 10 * k));
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? 0 : DEN_W, x1 = x0 - side * W;
        const g = ctx.createLinearGradient(x0, 0, x1, 0);
        g.addColorStop(0, `rgba(8,2,26,${0.85 + 0.12 * k})`);
        g.addColorStop(0.45, `rgba(40,10,90,${0.7 * (0.6 + 0.4 * k)})`);
        g.addColorStop(0.8, `rgba(150,70,230,${0.3 * (0.6 + 0.4 * k)})`);
        g.addColorStop(1, 'rgba(170,90,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(Math.min(x0, x1) - (side < 0 ? 40 : 0), 0, W + 40, H);
        // a flickering violet edge with chevrons pointing in
        const ex = x0 - side * W * 0.62;
        glow(ctx, ex, 250, 40, 260, '190,120,255', 0.35 + 0.25 * pulse);
        zap(ctx, ex, 20, ex, GROUND, 12, 7, Math.floor(e.t * 12) + (side > 0 ? 50 : 0), '200,140,255', 0.5 + 0.4 * pulse, 8);
        ctx.strokeStyle = `rgba(255,240,255,${0.45 + 0.4 * pulse})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let j = 0; j < 3; j++) {
          const cy = 140 + j * 110, cx = ex - side * (16 + pulse * 6);
          ctx.beginPath();
          ctx.moveTo(cx + side * 8, cy - 10);
          ctx.lineTo(cx - side * 4, cy);
          ctx.lineTo(cx + side * 8, cy + 10);
          ctx.stroke();
        }
        // a spiral turning in the void
        ctx.strokeStyle = `rgba(190,140,255,${0.5 * k})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const sx = x0 - side * W * 0.3, sy = 250;
        for (let i = 0; i <= 40; i++) {
          const a = i * 0.35 - e.t * 3 * side, rr = i * 2.6 * (0.5 + k);
          const px = sx + Math.cos(a) * rr * 0.6, py = sy + Math.sin(a) * rr;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      // shards and ticks of time being sucked into the ends
      for (const b of e.bits ?? []) {
        const j = (e.t * b.sp + b.p) % 1;
        const x = b.side < 0 ? W + 220 - j * (220 + W * 0.7) : DEN_W - W - 220 + j * (220 + W * 0.7);
        ctx.fillStyle = `rgba(220,190,255,${Math.sin(j * Math.PI) * 0.9})`;
        star(ctx, x, b.y, 3 * b.s);
      }
    },
  },
  collapseHit: {
    dur: 0.6,
    draw(ctx, e, k) {
      const fade = 1 - k;
      ctx.fillStyle = `rgba(230,210,255,${0.5 * fade * fade})`;
      ctx.fillRect(-40, 0, DEN_W + 80, H);
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? 0 : DEN_W;
        const g = ctx.createLinearGradient(x0, 0, x0 - side * 320, 0);
        g.addColorStop(0, `rgba(255,255,255,${fade})`);
        g.addColorStop(0.25, `rgba(190,130,255,${0.8 * fade})`);
        g.addColorStop(1, 'rgba(120,60,220,0)');
        ctx.fillStyle = g;
        ctx.fillRect(side < 0 ? -40 : DEN_W - 320, 0, 360, H);
      }
    },
  },
  // sparks on an electrified tile
  zapBurst: {
    dur: 0.4,
    init(e, r) {
      const x0 = e.x0 ?? e.x - TILE / 2, x1 = e.x1 ?? x0 + TILE;
      e.x0 = x0;
      e.x1 = x1;
      e.parts = Array.from({ length: 14 }, () => ({ x: x0 + r() * (x1 - x0), vx: (r() - 0.5) * 160, vy: -(120 + r() * 260), s: 0.6 + r() * 0.8 }));
      e.sd = Math.floor(r() * 1000);
    },
    draw(ctx, e, k) {
      const fade = 1 - k, y = GROUND;
      const { x0, x1 } = e;
      const mid = (x0 + x1) / 2, rgb = e.theme === 'chrono' ? '190,160,255' : e.theme === 'warden' ? '255,205,120' : '255,210,110';
      glow(ctx, mid, y, (x1 - x0) * 0.7, 30, rgb, fade);
      ctx.fillStyle = `rgba(255,250,220,${0.5 * fade})`;
      ctx.beginPath();
      ctx.roundRect(x0 + 4, y - 4, x1 - x0 - 8, 16, 7);
      ctx.fill();
      for (let j = 0; j < 3; j++) {
        const sd = e.sd + Math.floor(e.t * 30) * 5 + j * 17;
        zap(ctx, x0 + 6, y - 2 - j * 5, x1 - 6, y - 2 - hash(sd) * 10, 8, 8, sd, rgb, fade, 6);
      }
      for (const p of e.parts ?? []) {
        const tt = e.t;
        const px = p.x + p.vx * tt, py = y + p.vy * tt + 0.5 * 900 * tt * tt;
        if (py > y + 2) continue;
        ctx.fillStyle = `rgba(255,240,180,${fade})`;
        star(ctx, px, py, 3 * p.s);
      }
    },
  },
  // a clock bomb going off: a flash and a ring of clock hands flung outwards
  bombBoom: {
    dur: 0.6,
    init(e, r) {
      e.hands = Array.from({ length: 12 }, (_, i) => ({ a: (i / 12) * TAU + r() * 0.2, rot: r() * TAU, vr: (r() - 0.5) * 16, d: 0.7 + r() * 0.5 }));
    },
    draw(ctx, e, k) {
      const R = e.r ?? 110, { x } = e, y = e.y ?? GROUND - 30, fade = 1 - k, grow = ease(k);
      const rgb = e.theme === 'clock' ? '255,190,110' : '255,214,106';
      if (k < 0.3) glow(ctx, x, y, R * 1.3, R * 1.3, '255,250,230', (1 - k / 0.3));
      glow(ctx, x, y, R * (0.6 + grow * 0.6), R * (0.6 + grow * 0.6), rgb, fade * 0.8);
      ctx.strokeStyle = `rgba(255,${k < 0.2 ? 255 : 200},${k < 0.2 ? 255 : 140},${fade})`;
      ctx.lineWidth = 10 * fade + 2;
      ctx.beginPath();
      ctx.arc(x, y, R * grow, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = `rgba(190,160,255,${0.7 * fade})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, R * grow * 0.7, 0, TAU);
      ctx.stroke();
      for (const hd of e.hands ?? []) {
        const d = R * hd.d * grow;
        ctx.save();
        ctx.translate(x + Math.cos(hd.a) * d, y + Math.sin(hd.a) * d);
        ctx.rotate(hd.rot + hd.vr * e.t);
        ctx.fillStyle = `rgba(255,214,106,${fade})`;
        ctx.beginPath();
        ctx.moveTo(-2, 8);
        ctx.lineTo(-2, -6);
        ctx.lineTo(-5, -6);
        ctx.lineTo(0, -14);
        ctx.lineTo(5, -6);
        ctx.lineTo(2, -6);
        ctx.lineTo(2, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    },
  },
  // the Aether Knight's crystal slash, a bright ring swept round it
  slashArc: {
    dur: 0.35,
    init(e, r) {
      e.shards = Array.from({ length: 10 }, () => ({ a: -Math.PI + r() * Math.PI, d: 0.8 + r() * 0.5, s: 0.6 + r() * 0.7, rot: r() * TAU }));
    },
    draw(ctx, e, k) {
      const R = e.r ?? 110, x = e.x, y = (e.y ?? GROUND), cy = y - 26, rgb = fxRgb(e), fade = 1 - k;
      const head = -Math.PI * 1.5 + TAU * ease(k) * 1.05;
      // the swept ring: a crescent trailing behind its bright head
      for (let i = 0; i < 14; i++) {
        const j = i / 14, a0 = head - j * 3.4, a1 = head - (j + 1 / 14) * 3.4;
        ctx.strokeStyle = `rgba(${rgb},${(1 - j) * fade * 0.9})`;
        ctx.lineWidth = (16 * (1 - j) + 2) * (0.6 + 0.4 * fade);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.ellipse(x, cy, R, R * 0.5, 0, a1, a0);
        ctx.stroke();
      }
      ctx.strokeStyle = `rgba(255,255,255,${fade})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, cy, R, R * 0.5, 0, head - 1.4, head);
      ctx.stroke();
      glow(ctx, x + Math.cos(head) * R, cy + Math.sin(head) * R * 0.5, 22, 22, '255,255,255', fade);
      // the floor ring
      ctx.strokeStyle = `rgba(${rgb},${0.6 * fade})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(x, y + 3, R, 12, 0, 0, TAU);
      ctx.stroke();
      for (const sh of e.shards ?? []) {
        const d = R * sh.d * (0.6 + ease(k) * 0.6);
        ctx.save();
        ctx.translate(x + Math.cos(sh.a) * d, cy + Math.sin(sh.a) * d * 0.7);
        ctx.rotate(sh.rot + k * 6);
        ctx.scale(sh.s, sh.s);
        ctx.fillStyle = `rgba(210,250,255,${fade})`;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(4, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    },
  },
  // the Chrono Wraith's time pulse: a ticking ring rushing out
  pulseRing: {
    dur: 0.5,
    draw(ctx, e, k) {
      const R = e.r ?? 190, x = e.x, y = e.y ?? GROUND - 40, rgb = fxRgb(e), fade = 1 - k;
      const rr = R * ease(k);
      ctx.fillStyle = `rgba(${rgb},${0.14 * fade})`;
      circle(ctx, x, y, rr);
      for (let j = 0; j < 2; j++) {
        const r2 = rr * (1 - j * 0.18);
        ctx.strokeStyle = `rgba(${j ? '255,255,255' : rgb},${fade * (j ? 0.6 : 0.95)})`;
        ctx.lineWidth = j ? 2 : 7 * fade + 2;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, r2), 0, TAU);
        ctx.stroke();
      }
      ctx.strokeStyle = `rgba(255,255,255,${fade})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + k * 1.5;
        ctx.moveTo(x + Math.cos(a) * (rr - 10), y + Math.sin(a) * (rr - 10));
        ctx.lineTo(x + Math.cos(a) * (rr + 4), y + Math.sin(a) * (rr + 4));
      }
      ctx.stroke();
      glow(ctx, x, y, 30 * fade + 4, 30 * fade + 4, rgb, fade);
    },
  },
};
