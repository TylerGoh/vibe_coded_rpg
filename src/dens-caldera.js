// Docs: docs/combat/bosses.md
// The Emberdeep Caldera's two boss dens (The Molten Forge, Phoenix Roost), their cave mouths in the
// Caldera, their bosses (Ignis the Magma Tyrant, Pyra the Ember Phoenix) and their boss effects.
// dens.js imports this file and dispatches to it (same contracts as its own dens/bosses/effects), so this
// file must NOT import dens.js: the few helpers it needs are copied below.
// Everything only draws. Same soft, rounded, pastel style as the rest of the game: warm, not grim.
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, DENS, MOBS, FIELD_GROUND } from './shared/rpg.js';

const GROUND = FIELD_GROUND;
const GRAV = 900;
const THRONE_X = DEN_W - 105;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const ease = (k) => 1 - (1 - k) ** 3;
const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);

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

// A soft round glow: one unit-radius gradient per colour, scaled into place
const glowCache = new WeakMap();
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  if (a <= 0.01 || rx <= 0 || ry <= 0) return;
  let c = glowCache.get(ctx);
  if (!c) glowCache.set(ctx, (c = {}));
  let g = c[rgb];
  if (!g) {
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${rgb},0.9)`);
    g.addColorStop(0.35, `rgba(${rgb},0.35)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c[rgb] = g;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  ctx.globalAlpha *= Math.min(1, a);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// Gradients that only depend on y (or are drawn in a fixed local frame) are made once per key
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

function stripes(ctx, x0, y0, x1, y1, gap, off, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = gap * 0.45;
  ctx.beginPath();
  for (let sx = x0 - (y1 - y0) - gap + (off % gap); sx < x1 + gap; sx += gap) {
    ctx.moveTo(sx, y1);
    ctx.lineTo(sx + (y1 - y0), y0);
  }
  ctx.stroke();
}

function safeTag(ctx, x, y, time, rgb = '120,240,160') {
  const bounce = Math.abs(Math.sin(time * 5)) * 4;
  ctx.fillStyle = `rgba(${rgb},0.95)`;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 24, y - 11 - bounce, 48, 20, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'SAFE', x, y - 0.5 - bounce, 12, '#1e4a30');
}

// A cute teardrop flame standing on (x, y), h tall, w wide, its tip leaning by s
function flamePath(ctx, x, y, w, h, s) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x - w * 0.62, y, x - w * 0.5, y - h * 0.5, x + s, y - h);
  ctx.bezierCurveTo(x + w * 0.5, y - h * 0.5, x + w * 0.62, y, x, y);
  ctx.closePath();
}
const FLAME = ['#ff6a3a', '#ffa83a', '#fff0a0'];
const FLAME_HOT = ['#ff4a3a', '#ff9a3a', '#fffbe0'];
const LAVA = ['#ff6a2a', '#ffa63a', '#ffe7a0'];
function flame(ctx, x, y, w, h, t, p = 0, cols = FLAME) {
  const f = 1 + 0.14 * Math.sin(t * 11 + p) + 0.06 * Math.sin(t * 23 + p * 2);
  const s = Math.sin(t * 6 + p) * w * 0.25, hh = h * f;
  ctx.fillStyle = cols[0];
  flamePath(ctx, x, y, w, hh, s);
  ctx.fill();
  ctx.fillStyle = cols[1];
  flamePath(ctx, x + s * 0.1, y - h * 0.02, w * 0.66, hh * 0.72, s * 0.7);
  ctx.fill();
  ctx.fillStyle = cols[2];
  flamePath(ctx, x, y - h * 0.03, w * 0.34, hh * 0.42, s * 0.4);
  ctx.fill();
}

// A dark iron chain hanging from y0 to y1
function chain(ctx, x, y0, y1, col = '#2a1822', hi = 'rgba(255,170,120,0.35)') {
  ctx.lineWidth = 3;
  for (let y = y0, i = 0; y < y1 - 4; y += 11, i++) {
    ctx.strokeStyle = col;
    ctx.beginPath();
    if (i % 2) ctx.ellipse(x, y + 6, 4.2, 7, 0, 0, TAU);
    else {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 12);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = hi;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 3, y0);
  ctx.lineTo(x - 3, y1 - 4);
  ctx.stroke();
}

function floorDeco(seed, types) {
  const r = mulberry32(seed);
  const out = [];
  for (let x = 150; x < DEN_W - 10; x += 22 + r() * 44) {
    const k = r();
    let acc = 0, type = types[0][0];
    for (const [t, p] of types) {
      acc += p;
      if (k < acc) {
        type = t;
        break;
      }
    }
    out.push({ type, x, s: 0.8 + r() * 0.5, p: r() * TAU, c: Math.floor(r() * 5) });
  }
  return out;
}
function pebbles(seed) {
  const r = mulberry32(seed);
  return Array.from({ length: DEN_W / 28 }, () => ({ x: r() * DEN_W, dy: 26 + r() * (H - GROUND - 30), r: 2 + r() * 3 }));
}

// ——— seeded scenery, built once ———

const MAGMA = (() => {
  const r = mulberry32(1401);
  // the back wall: rows of rounded basalt blocks, lit warmer near the lava below
  const blocks = [];
  for (let row = 0; row < 8; row++) {
    const y = 22 + row * 54;
    let x = -80 + (row % 2) * 44 + r() * 20;
    while (x < DEN_W + 80) {
      const w = 64 + r() * 64, warm = clamp(y / 430, 0, 1) ** 1.6;
      const col = mix(mix('#2c1426', '#5e2632', warm), '#46203a', r() * 0.3);
      blocks.push({ x, y, w: w - 6, h: 48, col, hi: mix(col, '#ffb08a', 0.12 + warm * 0.12), lo: mix(col, '#12060e', 0.35) });
      x += w;
    }
  }
  const falls = [{ x: 182, w: 34 }, { x: 548, w: 28 }, { x: 990, w: 40 }, { x: 1150, w: 24 }].map((f) => ({ ...f, p: r() * TAU }));
  const stal = [];
  for (let x = -10; x < DEN_W + 20; x += 22 + r() * 40) stal.push({ x, len: 14 + r() * (r() < 0.25 ? 60 : 26), w: 14 + r() * 18, drip: r() < 0.28, p: r() });
  const hooks = [{ x: 410, len: 150 }, { x: 1160, len: 120 }, { x: 905, len: 70 }];
  const embers = Array.from({ length: 70 }, () => ({ x: r() * DEN_W, y: r() * 460, p: r() * TAU, s: 0.6 + r() * 0.9, sp: 0.03 + r() * 0.05 }));
  const veins = [];
  for (let x = 30; x < DEN_W; x += 90 + r() * 110) {
    const pts = [[x, GROUND + 18 + r() * 40]];
    for (let i = 0; i < 5; i++) {
      const [px, py] = pts.at(-1);
      pts.push([px + 12 + r() * 20, clamp(py + (r() - 0.5) * 22, GROUND + 14, H - 6)]);
    }
    veins.push({ pts, p: r() * TAU });
  }
  const deco = floorDeco(1411, [['tuft', 0.3], ['rock', 0.25], ['flame', 0.17], ['crystal', 0.18], ['anvil', 0.1]]);
  return { blocks, falls, stal, hooks, embers, veins, deco, pebbles: pebbles(1413) };
})();

const PHOENIX = (() => {
  const r = mulberry32(1501);
  const clouds = [];
  for (let x = -200; x < DEN_W * 0.4 + 1300; x += 120 + r() * 140) clouds.push({ x, y: 150 + r() * 160, s: 0.7 + r() * 0.8, p: r() * TAU, n: 3 + Math.floor(r() * 3) });
  const peaks = [];
  for (let x = -200; x < DEN_W * 0.5 + 1300; x += 110 + r() * 130) peaks.push({ x, h: 90 + r() * 120, w: 120 + r() * 90, lava: r() < 0.45 });
  const near = [];
  for (let x = -200; x < DEN_W * 0.3 + 1300; x += 160 + r() * 160) near.push({ x, h: 50 + r() * 70, w: 150 + r() * 110 });
  const plumes = [{ x: 548, h: 240, lean: -0.14, c: 0 }, { x: 952, h: 260, lean: 0.12, c: 2 }, { x: 200, h: 180, lean: 0.16, c: 1 }];
  const feathers = Array.from({ length: 26 }, () => ({ x: r() * DEN_W, y: r() * 470, p: r() * TAU, s: 0.7 + r() * 0.7, sp: 14 + r() * 16, c: Math.floor(r() * 3) }));
  const embers = Array.from({ length: 50 }, () => ({ x: r() * DEN_W, y: 100 + r() * 360, p: r() * TAU, s: 0.6 + r() * 0.9, sp: 0.03 + r() * 0.05 }));
  const twigs = [];
  for (let x = -20; x < DEN_W + 30; x += 9 + r() * 12) twigs.push({ x, a: (r() - 0.5) * 0.5, l: 16 + r() * 22, dy: r() * 10, c: r() < 0.5 });
  const deco = floorDeco(1511, [['lily', 0.28], ['feather', 0.22], ['flame', 0.14], ['rock', 0.2], ['tuft', 0.16]]);
  return { clouds, peaks, near, plumes, feathers, embers, twigs, deco, pebbles: pebbles(1513) };
})();

const FEATHER_COLS = [['#ff6a4a', '#ffb05a'], ['#ffa63a', '#ffe08a'], ['#e8406a', '#ff9a6a']];

// A big soft feather, quill at (0, 0) pointing up the local -y axis, len long
// (simple: one flat colour and no vane notches, for the many tiny ones)
function featherShape(ctx, len, wd, cols, t = 0, p = 0, simple = false) {
  const sw = Math.sin(t * 1.4 + p) * 0.04;
  ctx.save();
  ctx.rotate(sw);
  if (simple) ctx.fillStyle = cols[1];
  else {
    const g = ctx.createLinearGradient(0, 0, 0, -len);
    g.addColorStop(0, cols[0]);
    g.addColorStop(0.7, cols[1]);
    g.addColorStop(1, '#fff0b0');
    ctx.fillStyle = g;
  }
  ctx.beginPath();
  ctx.moveTo(0, -len * 0.08);
  ctx.bezierCurveTo(-wd, -len * 0.25, -wd * 0.9, -len * 0.8, 0, -len);
  ctx.bezierCurveTo(wd * 0.9, -len * 0.8, wd, -len * 0.25, 0, -len * 0.08);
  ctx.fill();
  if (simple) {
    ctx.strokeStyle = '#fff3d0';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, -len * 0.9);
    ctx.stroke();
    ctx.restore();
    return;
  }
  // the vane's soft notches
  ctx.strokeStyle = 'rgba(255,240,210,0.55)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 1; i < 6; i++) {
    const y = -len * (0.2 + i * 0.12);
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(-wd * 0.4, y + 4, -wd * 0.75, y + 14);
    ctx.moveTo(0, y - 6);
    ctx.quadraticCurveTo(wd * 0.4, y - 2, wd * 0.75, y + 8);
  }
  ctx.stroke();
  ctx.strokeStyle = '#fff3d0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.quadraticCurveTo(wd * 0.08, -len * 0.5, 0, -len * 0.96);
  ctx.stroke();
  ctx.restore();
}

// ——— The Molten Forge (magma) ———

function drawMagmaBack(ctx, L, R, time) {
  const M = MAGMA;
  for (const b of M.blocks) {
    if (!visible(b.x, b.x + b.w, L, R)) continue;
    ctx.fillStyle = b.col;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 11);
    ctx.fill();
    ctx.fillStyle = b.lo;
    ctx.beginPath();
    ctx.roundRect(b.x + 3, b.y + b.h - 9, b.w - 6, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = b.hi;
    ctx.beginPath();
    ctx.roundRect(b.x + 6, b.y + 4, b.w - 12, 6, 3);
    ctx.fill();
  }
  // warm light pooling up from the lava channel along the back
  for (let x = Math.floor(L / 260) * 260; x < R + 260; x += 260) glow(ctx, x + 130, GROUND - 10, 220, 120, '255,110,50', 0.32);
  // hooks and chains hanging from the ceiling
  for (const k of M.hooks) {
    if (!visible(k.x - 20, k.x + 20, L, R)) continue;
    const sway = Math.sin(time * 0.8 + k.x) * 2;
    chain(ctx, k.x, 18, 18 + k.len, '#22101c');
    ctx.strokeStyle = '#22101c';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(k.x, 14 + k.len);
    ctx.lineTo(k.x + sway * 0.3, 26 + k.len);
    ctx.arc(k.x + 9 + sway * 0.3, 26 + k.len, 9, Math.PI, Math.PI * 0.15, true);
    ctx.stroke();
  }
  // lava falls pouring from cracks in the ceiling into the channel behind the floor
  for (const f of M.falls) {
    if (!visible(f.x - 60, f.x + 60, L, R)) continue;
    lavaFall(ctx, f.x, f.w, 16, GROUND + 2, time, f.p);
  }
  // the great furnace in the middle, its chimney climbing up behind the high ledge
  if (visible(600, 900, L, R)) drawFurnace(ctx, 750, time);
  // the rocky ceiling with glowing stalactites (and the odd lava drip)
  ctx.fillStyle = '#1c0a18';
  ctx.fillRect(L, 0, R - L, 22);
  ctx.fillStyle = '#2c1424';
  ctx.fillRect(L, 14, R - L, 8);
  for (const s of M.stal) {
    if (s.x < L - 30 || s.x > R + 30) continue;
    ctx.fillStyle = '#2c1424';
    ctx.beginPath();
    ctx.moveTo(s.x - s.w / 2, 20);
    ctx.quadraticCurveTo(s.x - s.w * 0.2, 20 + s.len * 0.7, s.x, 20 + s.len);
    ctx.quadraticCurveTo(s.x + s.w * 0.2, 20 + s.len * 0.7, s.x + s.w / 2, 20);
    ctx.fill();
    glow(ctx, s.x, 18 + s.len, 7, 7, '255,140,60', 0.7);
    ctx.fillStyle = '#ff9a4a';
    circle(ctx, s.x, 17 + s.len, 2.4);
    if (s.drip) {
      const k = (time * 0.45 + s.p) % 1, y = 20 + s.len + k * k * 380;
      const a = k < 0.85 ? 1 : (1 - k) / 0.15;
      glow(ctx, s.x, y, 9, 11, '255,140,60', 0.6 * a);
      ctx.fillStyle = `rgba(255,170,80,${a})`;
      ctx.beginPath();
      ctx.moveTo(s.x, y - 7);
      ctx.quadraticCurveTo(s.x + 4, y, s.x, y + 3.5);
      ctx.quadraticCurveTo(s.x - 4, y, s.x, y - 7);
      ctx.fill();
    }
  }
}

function lavaFall(ctx, x, w, top, bot, time, p) {
  glow(ctx, x, (top + bot) / 2, w * 2.2, (bot - top) * 0.6, '255,120,50', 0.3);
  ctx.fillStyle = vgrad(ctx, 'mfall', top, bot, [[0, '#ffb44a'], [0.4, '#ff8a3a'], [1, '#ff6a2a']]);
  ctx.beginPath();
  for (let y = top; y <= bot; y += 24) ctx.lineTo(x - w / 2 + Math.sin(y * 0.04 + time * 2.4 + p) * 2.5, y);
  for (let y = bot; y >= top; y -= 24) ctx.lineTo(x + w / 2 + Math.sin(y * 0.04 + time * 2.4 + p + 1) * 2.5, y);
  ctx.closePath();
  ctx.fill();
  // bright ripples running down it
  ctx.strokeStyle = 'rgba(255,240,170,0.75)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.setLineDash([16, 34]);
  ctx.lineDashOffset = -time * 150 - p * 30;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.2, top + 6);
  ctx.lineTo(x - w * 0.2, bot);
  ctx.moveTo(x + w * 0.18, top + 26);
  ctx.lineTo(x + w * 0.18, bot);
  ctx.stroke();
  ctx.setLineDash([]);
  // the crack it pours from
  ctx.fillStyle = '#1c0a18';
  ellipse(ctx, x, top + 4, w * 0.8, 9);
  glow(ctx, x, top + 6, w, 10, '255,190,90', 0.8);
  // splash and bubbles where it lands
  glow(ctx, x, bot - 6, w * 1.8, 26, '255,200,110', 0.7);
  ctx.fillStyle = '#ffd27a';
  for (let i = 0; i < 4; i++) {
    const k = (time * 1.6 + i * 0.25 + p) % 1;
    const bx = x + (i - 1.5) * w * 0.45 + Math.sin(i * 2 + p) * 4;
    ctx.globalAlpha = 1 - k;
    circle(ctx, bx, bot - 6 - k * 22, 3 + (1 - k) * 2);
  }
  ctx.globalAlpha = 1;
}

function drawFurnace(ctx, x, time) {
  const b = GROUND;
  // chimney up to the ceiling
  ctx.fillStyle = '#3a1a2a';
  ctx.fillRect(x - 46, 0, 92, b - 160);
  ctx.fillStyle = 'rgba(255,170,130,0.1)';
  ctx.fillRect(x - 38, 0, 16, b - 160);
  ctx.strokeStyle = '#22101c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = 30, i = 0; y < b - 160; y += 26, i++) {
    ctx.moveTo(x - 46, y);
    ctx.lineTo(x + 46, y);
    const ox = i % 2 ? -14 : 16;
    ctx.moveTo(x + ox, y);
    ctx.lineTo(x + ox, y + 26);
  }
  ctx.stroke();
  // iron bands
  ctx.fillStyle = '#24121e';
  for (const y of [60, 170]) {
    ctx.beginPath();
    ctx.roundRect(x - 52, y, 104, 12, 5);
    ctx.fill();
  }
  ctx.fillStyle = '#ffb27a';
  for (const y of [66, 176]) for (const dx of [-40, 0, 40]) circle(ctx, x + dx, y, 2);
  // the domed kiln
  const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
  glow(ctx, x, b - 50, 190, 120, '255,140,60', 0.35 + 0.1 * pulse);
  ctx.fillStyle = '#4a2232';
  ctx.strokeStyle = '#22101c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 118, b + 2);
  ctx.bezierCurveTo(x - 118, b - 120, x - 70, b - 168, x, b - 170);
  ctx.bezierCurveTo(x + 70, b - 168, x + 118, b - 120, x + 118, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,190,150,0.12)';
  ellipse(ctx, x - 50, b - 118, 32, 40, -0.5);
  // brick courses on the dome
  ctx.strokeStyle = 'rgba(20,6,14,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 5; i++) {
    const yy = b - i * 32;
    const half = 118 * Math.sqrt(Math.max(0, 1 - ((i * 32) / 172) ** 2));
    ctx.moveTo(x - half + 4, yy);
    ctx.lineTo(x + half - 4, yy);
  }
  ctx.stroke();
  // its glowing mouth
  const mw = 52, mt = b - 98;
  const g = vgrad(ctx, 'furnace', mt, b, [[0, '#ffe7a0'], [0.5, '#ffaa4a'], [1, '#ff6a2a']]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - mw, b + 2);
  ctx.lineTo(x - mw, mt + mw);
  ctx.arc(x, mt + mw, mw, Math.PI, 0);
  ctx.lineTo(x + mw, b + 2);
  ctx.closePath();
  ctx.fill();
  glow(ctx, x, b - 40, 70, 60, '255,240,170', 0.6 + 0.2 * pulse);
  for (let i = 0; i < 4; i++) flame(ctx, x - 30 + i * 20, b, 26, 40 + (i % 2) * 18, time, i * 1.7);
  ctx.strokeStyle = '#2a1222';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x - mw, b + 2);
  ctx.lineTo(x - mw, mt + mw);
  ctx.arc(x, mt + mw, mw, Math.PI, 0);
  ctx.lineTo(x + mw, b + 2);
  ctx.stroke();
  // grate bars
  ctx.strokeStyle = 'rgba(42,18,34,0.85)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const dx of [-26, 0, 26]) {
    ctx.moveTo(x + dx, mt + mw - Math.sqrt(mw * mw - dx * dx) + 6);
    ctx.lineTo(x + dx, b - 20);
  }
  ctx.stroke();
  // keystone with an ember gem
  ctx.fillStyle = '#5e2c3c';
  ctx.beginPath();
  ctx.roundRect(x - 16, mt - 14, 32, 26, 6);
  ctx.fill();
  glow(ctx, x, mt - 1, 16, 16, '255,200,90', 0.8);
  ctx.fillStyle = '#ffcf5a';
  ctx.beginPath();
  ctx.moveTo(x, mt - 9);
  ctx.lineTo(x + 7, mt - 1);
  ctx.lineTo(x, mt + 7);
  ctx.lineTo(x - 7, mt - 1);
  ctx.closePath();
  ctx.fill();
}

function throneMagma(ctx, x, time) {
  const b = GROUND;
  const pulse = 0.5 + 0.5 * Math.sin(time * 1.8);
  // a great arch of basalt, molten light pouring out of it
  glow(ctx, x, b - 140, 150, 170, '255,120,50', 0.35 + 0.1 * pulse);
  ctx.fillStyle = '#3a1a2a';
  ctx.beginPath();
  ctx.moveTo(x - 118, b);
  ctx.lineTo(x - 118, b - 190);
  ctx.arc(x, b - 190, 118, Math.PI, 0);
  ctx.lineTo(x + 118, b);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = vgrad(ctx, 'mthrone', b - 290, b, [[0, '#ff7a3a'], [0.5, '#ffaa4a'], [1, '#ffe08a']]);
  ctx.beginPath();
  ctx.moveTo(x - 88, b);
  ctx.lineTo(x - 88, b - 190);
  ctx.arc(x, b - 190, 88, Math.PI, 0);
  ctx.lineTo(x + 88, b);
  ctx.closePath();
  ctx.fill();
  // a curtain of lava in the arch, ripples flowing down
  ctx.strokeStyle = 'rgba(255,245,190,0.6)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.setLineDash([14, 26]);
  ctx.lineDashOffset = -time * 90;
  ctx.beginPath();
  for (const dx of [-60, -30, 0, 30, 60]) {
    ctx.moveTo(x + dx, b - 190 - Math.sqrt(Math.max(0, 88 * 88 - dx * dx)) + 10);
    ctx.lineTo(x + dx, b - 20);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // arch stones with glowing seams
  ctx.fillStyle = '#4e2434';
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    const sx = x + Math.cos(a) * 103, sy = b - 190 + Math.sin(a) * 103;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath();
    ctx.roundRect(-17, -14, 34, 28, 7);
    ctx.fill();
    ctx.restore();
  }
  // the giant anvil seat on its dais
  for (const [w, y, c] of [[220, b - 22, '#3a1a2a'], [180, b - 42, '#4a2232']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, w, 24, 8);
    ctx.fill();
  }
  ctx.fillStyle = '#2e1824';
  ctx.strokeStyle = '#1a0a14';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 46, b - 42);
  ctx.lineTo(x - 30, b - 80);
  ctx.lineTo(x - 92, b - 92);
  ctx.quadraticCurveTo(x - 100, b - 110, x - 76, b - 112);
  ctx.lineTo(x + 84, b - 112);
  ctx.quadraticCurveTo(x + 96, b - 100, x + 80, b - 86);
  ctx.lineTo(x + 30, b - 80);
  ctx.lineTo(x + 46, b - 42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5a3a48';
  ctx.beginPath();
  ctx.roundRect(x - 80, b - 114, 162, 7, 3.5);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,150,70,${0.5 + 0.4 * pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20, b - 100);
  ctx.lineTo(x - 6, b - 90);
  ctx.lineTo(x + 10, b - 98);
  ctx.lineTo(x + 22, b - 88);
  ctx.stroke();
  // braziers either side
  for (const s of [-1, 1]) {
    const bx = x + s * 140;
    ctx.fillStyle = '#2e1824';
    ctx.fillRect(bx - 4, b - 70, 8, 70);
    ctx.beginPath();
    ctx.moveTo(bx - 22, b - 82);
    ctx.lineTo(bx + 22, b - 82);
    ctx.lineTo(bx + 12, b - 66);
    ctx.lineTo(bx - 12, b - 66);
    ctx.closePath();
    ctx.fill();
    glow(ctx, bx, b - 100, 40, 46, '255,150,60', 0.6);
    flame(ctx, bx, b - 80, 30, 44, time, s * 2);
  }
}

function drawFloorMagma(ctx, L, R, time) {
  const M = MAGMA, y = GROUND;
  ctx.fillStyle = '#3c1e2e';
  ctx.fillRect(L, y, R - L, H - y + 10);
  ctx.fillStyle = '#2e1624';
  ctx.fillRect(L, y + 52, R - L, H - y);
  ctx.fillStyle = '#4e2a3a';
  ctx.beginPath();
  for (const p of M.pebbles) {
    if (p.x < L || p.x > R) continue;
    ctx.moveTo(p.x + p.r * 1.4, y + p.dy);
    ctx.ellipse(p.x, y + p.dy, p.r * 1.4, p.r, 0, 0, TAU);
  }
  ctx.fill();
  // glowing lava veins in the rock
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const v of M.veins) {
    if (v.pts[0][0] > R || v.pts.at(-1)[0] < L) continue;
    const a = 0.55 + 0.35 * Math.sin(time * 1.6 + v.p);
    for (const [lw, col] of [[9, `rgba(255,110,50,${0.2 * a})`], [3.5, `rgba(255,150,70,${a})`], [1.4, `rgba(255,236,160,${a})`]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      v.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.stroke();
    }
  }
  // the crust on top, edged with warm light
  ctx.fillStyle = '#5c2e3e';
  ctx.beginPath();
  ctx.roundRect(L - 4, y - 5, R - L + 8, 18, 9);
  ctx.fill();
  ctx.beginPath();
  for (let gx = Math.floor(L / 18) * 18 + 6; gx < R + 9; gx += 18) {
    ctx.moveTo(gx + 9, y + 12);
    ctx.arc(gx, y + 12, 9, 0, Math.PI);
  }
  ctx.fill();
  ctx.fillStyle = '#8a4a54';
  ctx.beginPath();
  ctx.roundRect(L + 2, y - 5, R - L - 4, 5, 2.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,170,100,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(L, y - 5.5);
  ctx.lineTo(R, y - 5.5);
  ctx.stroke();
  for (const d of M.deco) if (d.x > L - 20 && d.x < R + 20) decoMagma(ctx, d, y - 3, time);
}

function decoMagma(ctx, d, y, time) {
  ctx.save();
  ctx.translate(d.x, y);
  ctx.scale(d.s, d.s);
  switch (d.type) {
    case 'tuft': {
      // little fire-fern: curly ember grass
      ctx.strokeStyle = d.c % 2 ? '#ff8a4a' : '#e8604a';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      const sway = Math.sin(time * 2 + d.x * 0.05) * 2;
      ctx.beginPath();
      for (const dx of [-5, 0, 5]) {
        ctx.moveTo(dx, 2);
        ctx.quadraticCurveTo(dx + sway, -8, dx * 1.6 + sway, -12 - (dx === 0 ? 4 : 0));
      }
      ctx.stroke();
      ctx.fillStyle = '#ffd27a';
      circle(ctx, sway, -16, 1.8);
      break;
    }
    case 'rock':
      ctx.fillStyle = '#2e1624';
      ctx.beginPath();
      ctx.moveTo(-13, 3);
      ctx.quadraticCurveTo(-14, -11, -2, -13);
      ctx.quadraticCurveTo(13, -12, 13, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,190,150,0.15)';
      ellipse(ctx, -5, -8, 5, 2.5, -0.3);
      ctx.strokeStyle = `rgba(255,150,70,${0.6 + 0.3 * Math.sin(time * 2 + d.p)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.lineTo(0, -7);
      ctx.lineTo(4, -3);
      ctx.lineTo(9, -8);
      ctx.stroke();
      break;
    case 'flame':
      glow(ctx, 0, -8, 16, 14, '255,150,60', 0.5);
      ctx.fillStyle = '#2e1624';
      ellipse(ctx, 0, 1, 9, 3.5);
      flame(ctx, 0, 1, 13, 20, time, d.p);
      break;
    case 'crystal':
      glow(ctx, 0, -8, 14, 14, '255,170,80', 0.55);
      for (const [dx, hh, rot] of [[-4, 12, -0.3], [1, 18, 0.05], [6, 10, 0.4]]) {
        ctx.save();
        ctx.translate(dx, 2);
        ctx.rotate(rot);
        ctx.fillStyle = '#ffb04a';
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(-3, -hh + 4);
        ctx.lineTo(0, -hh);
        ctx.lineTo(3, -hh + 4);
        ctx.lineTo(3, 0);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,245,200,0.8)';
        ctx.fillRect(-2, -hh + 4, 1.4, hh - 6);
        ctx.restore();
      }
      break;
    case 'anvil':
      ctx.fillStyle = '#3a2a36';
      ctx.beginPath();
      ctx.moveTo(-8, 2);
      ctx.lineTo(-5, -6);
      ctx.lineTo(-16, -8);
      ctx.quadraticCurveTo(-18, -13, -12, -13);
      ctx.lineTo(14, -13);
      ctx.lineTo(14, -8);
      ctx.lineTo(5, -6);
      ctx.lineTo(8, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6a5a66';
      ctx.fillRect(-12, -14, 26, 2.5);
      // a little hammer leaning on it
      ctx.fillStyle = '#8a5a3a';
      ctx.save();
      ctx.translate(15, 2);
      ctx.rotate(-0.35);
      ctx.fillRect(-1.5, -16, 3, 16);
      ctx.fillStyle = '#4a3a46';
      ctx.beginPath();
      ctx.roundRect(-5, -21, 10, 6, 2);
      ctx.fill();
      ctx.restore();
      break;
  }
  ctx.restore();
}

function ledgeMagma(ctx, p, i, time) {
  const { x, y, w } = p;
  chain(ctx, x + 24, 18, y + 2);
  chain(ctx, x + w - 24, 18, y + 2);
  glow(ctx, x + w / 2, y + 26, w * 0.62, 28, '255,120,50', 0.4);
  // lava dripping off its underside
  for (let k = 0; k < 3; k++) {
    const dx = x + 30 + k * (w - 60) / 2 + ((i * 17) % 13), j = (time * 0.6 + k * 0.37 + i * 0.21) % 1;
    const dy = y + 24 + j * j * 90;
    ctx.fillStyle = `rgba(255,160,70,${1 - j})`;
    circle(ctx, dx, dy, 2.6);
  }
  // the slab: dark iron-bound basalt
  ctx.fillStyle = vgrad(ctx, `mledge${y}`, y, y + 26, [[0, '#6a3444'], [1, '#341826']]);
  ctx.strokeStyle = '#1e0c18';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x - 4, y, w + 8, 26, [6, 6, 12, 12]);
  ctx.fill();
  ctx.stroke();
  // glowing cracks on the face
  const a = 0.55 + 0.35 * Math.sin(time * 2 + i * 1.3);
  ctx.strokeStyle = `rgba(255,150,70,${a})`;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + 8);
  ctx.lineTo(x + w * 0.36, y + 15);
  ctx.lineTo(x + w * 0.45, y + 12);
  ctx.lineTo(x + w * 0.5, y + 21);
  ctx.moveTo(x + w * 0.68, y + 10);
  ctx.lineTo(x + w * 0.74, y + 18);
  ctx.stroke();
  // iron bands with rivets at both ends
  for (const bx of [x + 10, x + w - 26]) {
    ctx.fillStyle = '#2a1c26';
    ctx.beginPath();
    ctx.roundRect(bx, y - 2, 16, 30, 4);
    ctx.fill();
    ctx.fillStyle = '#ffb27a';
    circle(ctx, bx + 8, y + 7, 1.8);
    circle(ctx, bx + 8, y + 19, 1.8);
  }
  // the walkable top: a warm-lit crust lip
  ctx.fillStyle = '#8e4a56';
  ctx.beginPath();
  ctx.roundRect(x - 7, y - 6, w + 14, 11, 5.5);
  ctx.fill();
  ctx.fillStyle = '#b8705e';
  ctx.beginPath();
  ctx.roundRect(x - 3, y - 6, w + 6, 4, 2);
  ctx.fill();
  const tw = (time * 0.35 + i * 0.3) % 1;
  glow(ctx, x + tw * w, y - 4, 14, 6, '255,200,120', Math.sin(tw * Math.PI) * 0.8);
}

// ——— Phoenix Roost (phoenix) ———

function drawPhoenixBack(ctx, L, R, camX, viewW, time) {
  const P = PHOENIX;
  // the setting sun, nearly fixed on screen, sinking behind the far peaks
  const sx = camX + viewW * 0.62, sy = 300;
  glow(ctx, sx, sy, 380, 260, '255,200,120', 0.55);
  glow(ctx, sx, sy, 160, 160, '255,240,180', 0.7);
  ctx.fillStyle = '#ffe7a0';
  circle(ctx, sx, sy, 78);
  ctx.fillStyle = 'rgba(255,170,110,0.45)';
  for (let i = 0; i < 3; i++) ctx.fillRect(sx - 80, sy + 10 + i * 16, 160, 5 - i);
  // soft cloud banks drifting slowly
  for (const c of P.clouds) {
    const ax = c.x + camX * 0.6 + Math.sin(time * 0.1 + c.p) * 10;
    if (ax + 140 * c.s < camX - 40 || ax - 140 * c.s > camX + viewW + 40) continue;
    ctx.fillStyle = 'rgba(255,190,190,0.55)';
    for (let i = 0; i < c.n; i++) circle(ctx, ax + (i - c.n / 2) * 34 * c.s, c.y - (i % 2) * 12 * c.s, (26 + (i % 3) * 8) * c.s);
    ctx.fillStyle = 'rgba(255,230,200,0.5)';
    for (let i = 0; i < c.n; i++) circle(ctx, ax + (i - c.n / 2) * 34 * c.s - 4, c.y - 8 - (i % 2) * 12 * c.s, (16 + (i % 3) * 6) * c.s);
  }
  // far volcanic peaks, a few with glowing lava rivulets
  for (const k of P.peaks) {
    const ax = k.x + camX * 0.5;
    if (ax + k.w < camX - 40 || ax - k.w > camX + viewW + 40) continue;
    const top = 400 - k.h;
    ctx.fillStyle = '#9a4a6a';
    ctx.beginPath();
    ctx.moveTo(ax - k.w, 460);
    ctx.quadraticCurveTo(ax - k.w * 0.3, top + 20, ax - 14, top);
    ctx.lineTo(ax + 14, top);
    ctx.quadraticCurveTo(ax + k.w * 0.3, top + 20, ax + k.w, 460);
    ctx.fill();
    if (k.lava) {
      glow(ctx, ax, top, 40, 20, '255,170,90', 0.7);
      ctx.strokeStyle = 'rgba(255,170,90,0.85)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax - 6, top + 2);
      ctx.quadraticCurveTo(ax - 18, top + 40, ax - 12, top + 70);
      ctx.moveTo(ax + 6, top + 2);
      ctx.quadraticCurveTo(ax + 14, top + 30, ax + 24, top + 50);
      ctx.stroke();
      const j = (time * 0.4 + k.x * 0.01) % 1;
      ctx.fillStyle = `rgba(255,220,200,${0.4 * (1 - j)})`;
      circle(ctx, ax + j * 10, top - 10 - j * 40, 8 + j * 14);
    }
  }
  for (const k of P.near) {
    const ax = k.x + camX * 0.3;
    if (ax + k.w < camX - 40 || ax - k.w > camX + viewW + 40) continue;
    ctx.fillStyle = '#7a3456';
    ctx.beginPath();
    ctx.moveTo(ax - k.w, 470);
    ctx.bezierCurveTo(ax - k.w * 0.5, 450 - k.h, ax + k.w * 0.5, 450 - k.h, ax + k.w, 470);
    ctx.fill();
  }
  // giant phoenix plumes planted in the summit
  for (const pl of P.plumes) {
    if (!visible(pl.x - 120, pl.x + 120, L, R)) continue;
    ctx.save();
    ctx.translate(pl.x, GROUND + 4);
    ctx.rotate(pl.lean);
    glow(ctx, 0, -pl.h * 0.6, 60, pl.h * 0.5, '255,170,90', 0.3);
    featherShape(ctx, pl.h, 46, FEATHER_COLS[pl.c], time, pl.x);
    ctx.restore();
  }
}

function thronePhoenix(ctx, x, time) {
  const b = GROUND;
  // giant feathers fanned out behind the nest
  glow(ctx, x, b - 140, 170, 170, '255,170,90', 0.45);
  for (let i = 0; i < 7; i++) {
    const a = -0.9 + (i / 6) * 1.8;
    ctx.save();
    ctx.translate(x, b - 50);
    ctx.rotate(a);
    featherShape(ctx, 210 - Math.abs(i - 3) * 22, 30, FEATHER_COLS[i % 3], time, i);
    ctx.restore();
  }
  // the woven nest
  ctx.fillStyle = '#8a5a3a';
  ctx.beginPath();
  ctx.ellipse(x, b - 44, 112, 40, 0, 0, TAU);
  ctx.fill();
  glow(ctx, x, b - 64, 90, 22, '255,220,130', 0.8 + 0.15 * Math.sin(time * 2));
  ctx.fillStyle = '#5e3a26';
  ellipse(ctx, x, b - 66, 88, 14);
  for (let i = 0; i < 5; i++) flame(ctx, x - 60 + i * 30, b - 62, 24, 26 + (i % 2) * 12, time, i * 1.3);
  ctx.fillStyle = '#c08a4a';
  ctx.beginPath();
  ctx.moveTo(x - 112, b - 52);
  ctx.bezierCurveTo(x - 100, b + 6, x + 100, b + 6, x + 112, b - 52);
  ctx.bezierCurveTo(x + 80, b - 40, x - 80, b - 40, x - 112, b - 52);
  ctx.fill();
  ctx.strokeStyle = '#7a4a2a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const tx = x - 104 + i * 16, ty = b - 46 + Math.abs(i - 6.5) * 1.2;
    ctx.moveTo(tx - 14, ty + ((i * 7) % 5) * 3);
    ctx.quadraticCurveTo(tx, ty + 14, tx + 18, ty + 4 + ((i * 3) % 4) * 3);
  }
  ctx.stroke();
  ctx.strokeStyle = '#e0b06a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const tx = x - 90 + i * 20;
    ctx.moveTo(tx - 12, b - 34 + (i % 3) * 4);
    ctx.quadraticCurveTo(tx + 2, b - 24, tx + 16, b - 32 + (i % 2) * 5);
  }
  ctx.stroke();
  // a couple of golden eggs tucked in the nest
  for (const [dx, s] of [[-70, 1], [74, 0.85]]) {
    ctx.fillStyle = '#ffd66a';
    ctx.strokeStyle = '#c98a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + dx, b - 62, 12 * s, 16 * s, dx * 0.004, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,240,0.7)';
    ellipse(ctx, x + dx - 4 * s, b - 68, 3 * s, 5 * s, -0.3);
  }
}

function drawFloorPhoenix(ctx, L, R, time) {
  const P = PHOENIX, y = GROUND;
  ctx.fillStyle = '#7e3a4c';
  ctx.fillRect(L, y, R - L, H - y + 10);
  ctx.fillStyle = '#6a2e42';
  ctx.fillRect(L, y + 52, R - L, H - y);
  ctx.fillStyle = '#94485a';
  ctx.beginPath();
  for (const p of P.pebbles) {
    if (p.x < L || p.x > R) continue;
    ctx.moveTo(p.x + p.r * 1.4, y + p.dy);
    ctx.ellipse(p.x, y + p.dy, p.r * 1.4, p.r, 0, 0, TAU);
  }
  ctx.fill();
  // warm sunset light skimming the rock
  ctx.fillStyle = 'rgba(255,200,140,0.12)';
  for (let x = Math.floor(L / 160) * 160; x < R; x += 160) ellipse(ctx, x + 60, y + 26 + (x % 320) / 40, 44, 3);
  // a golden straw-and-twig cap: the edge of the great nest
  ctx.fillStyle = '#d89a56';
  ctx.beginPath();
  ctx.roundRect(L - 4, y - 5, R - L + 8, 18, 9);
  ctx.fill();
  ctx.beginPath();
  for (let gx = Math.floor(L / 16) * 16 + 6; gx < R + 8; gx += 16) {
    ctx.moveTo(gx + 8, y + 12);
    ctx.arc(gx, y + 12, 8, 0, Math.PI);
  }
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  for (const tw of P.twigs) {
    if (tw.x < L - 30 || tw.x > R + 30) continue;
    ctx.strokeStyle = tw.c ? '#a86a3a' : '#f0c27a';
    ctx.beginPath();
    ctx.moveTo(tw.x, y + 2 + tw.dy);
    ctx.lineTo(tw.x + Math.cos(tw.a) * tw.l, y + 2 + tw.dy + Math.sin(tw.a) * tw.l * 0.3);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd88a';
  ctx.beginPath();
  ctx.roundRect(L + 2, y - 5, R - L - 4, 5, 2.5);
  ctx.fill();
  for (const d of P.deco) if (d.x > L - 20 && d.x < R + 20) decoPhoenix(ctx, d, y - 3, time);
}

function decoPhoenix(ctx, d, y, time) {
  ctx.save();
  ctx.translate(d.x, y);
  ctx.scale(d.s, d.s);
  const sway = Math.sin(time * 2 + d.x * 0.05) * 0.12;
  switch (d.type) {
    case 'lily': {
      // a little fire lily
      ctx.rotate(sway);
      ctx.strokeStyle = '#6a9a4a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.quadraticCurveTo(2, -8, 0, -16);
      ctx.stroke();
      const col = ['#ff6a4a', '#ffa63a', '#ffd66a', '#ff8aa0', '#ff7a3a'][d.c];
      ctx.fillStyle = col;
      for (let i = 0; i < 5; i++) ellipse(ctx, Math.cos(i * 1.256 - 1.57) * 4, -17 + Math.sin(i * 1.256 - 1.57) * 4, 3.6, 2, i * 1.256 - 1.57);
      ctx.fillStyle = '#fff3c0';
      circle(ctx, 0, -17, 2);
      break;
    }
    case 'feather':
      ctx.rotate(0.5 + sway * 0.5);
      ctx.scale(0.22, 0.22);
      featherShape(ctx, 90, 30, FEATHER_COLS[d.c % 3], 0, 0, true);
      break;
    case 'flame':
      glow(ctx, 0, -8, 16, 14, '255,170,80', 0.5);
      flame(ctx, 0, 2, 12, 18, time, d.p);
      break;
    case 'rock':
      ctx.fillStyle = '#6a2e42';
      ctx.beginPath();
      ctx.moveTo(-12, 3);
      ctx.quadraticCurveTo(-12, -10, -1, -11);
      ctx.quadraticCurveTo(12, -10, 12, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,210,170,0.3)';
      ellipse(ctx, -4, -7, 4.5, 2.2, -0.3);
      break;
    default:
      ctx.rotate(sway);
      ctx.fillStyle = '#e8b866';
      for (const [dx, h, a] of [[-4, 12, -0.3], [0, 16, 0], [4, 11, 0.3]]) {
        ctx.save();
        ctx.translate(dx, 2);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(0, -h / 2, 1.6, h / 2, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
  }
  ctx.restore();
}

function ledgePhoenix(ctx, p, i, time) {
  const { x, y, w } = p;
  const cx = x + w / 2, bob = 0;
  glow(ctx, cx, y + 30, w * 0.55, 40, '255,170,90', 0.35);
  // a floating chunk of the peak
  ctx.fillStyle = '#6a2e42';
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 10);
  ctx.lineTo(x + w - 2, y + 10);
  ctx.quadraticCurveTo(x + w - 10, y + 30, cx + w * 0.22, y + 38);
  ctx.quadraticCurveTo(cx + 4, y + 58, cx - w * 0.06, y + 50);
  ctx.quadraticCurveTo(cx - w * 0.3, y + 40, x + 2, y + 10);
  ctx.fill();
  ctx.fillStyle = '#7e3a4c';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 12);
  ctx.lineTo(x + w * 0.5, y + 12);
  ctx.quadraticCurveTo(x + w * 0.35, y + 28, x + w * 0.2, y + 26);
  ctx.closePath();
  ctx.fill();
  // tail feathers trailing from under it, swaying in the updraft
  for (let k = 0; k < 3; k++) {
    ctx.save();
    ctx.translate(x + w * (0.3 + k * 0.2), y + 22 + (k === 1 ? 18 : 6));
    ctx.rotate(Math.PI + (k - 1) * 0.35 + Math.sin(time * 1.5 + k + i) * 0.08);
    ctx.scale(0.42, 0.42);
    featherShape(ctx, 90, 26, FEATHER_COLS[(k + i) % 3]);
    ctx.restore();
  }
  // the woven-twig top players stand on
  ctx.fillStyle = '#c08a4a';
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 4 + bob, w + 12, 16, 8);
  ctx.fill();
  ctx.strokeStyle = '#8a5a32';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let k = 0; k < 9; k++) {
    const tx = x - 2 + k * (w + 4) / 8;
    ctx.moveTo(tx - 10, y + 8);
    ctx.quadraticCurveTo(tx, y + 2, tx + 12, y + 7);
  }
  ctx.stroke();
  ctx.fillStyle = '#ffd88a';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 5, w + 8, 5, 2.5);
  ctx.fill();
  // a sparkle running along the rim
  const tw = (time * 0.4 + i * 0.3) % 1;
  ctx.fillStyle = `rgba(255,255,230,${Math.sin(tw * Math.PI)})`;
  star(ctx, x + tw * w, y - 2, 3.5);
  // embers rising off it
  for (let k = 0; k < 2; k++) {
    const j = (time * 0.5 + k * 0.5 + i * 0.3) % 1;
    ctx.fillStyle = `rgba(255,200,110,${Math.sin(j * Math.PI)})`;
    circle(ctx, x + w * (0.25 + k * 0.5) + Math.sin(time * 2 + k) * 6, y - 8 - j * 40, 1.8);
  }
}

// ——— shared den pieces: exit, banner, ambient ———

function drawExitCaldera(ctx, theme, time) {
  const x = DEN_EXIT_X, b = GROUND, hw = 40, top = b - 128;
  const opening = () => {
    ctx.beginPath();
    ctx.moveTo(x - hw, b + 2);
    ctx.lineTo(x - hw, top + hw);
    ctx.arc(x, top + hw, hw, Math.PI, 0);
    ctx.lineTo(x + hw, b + 2);
    ctx.closePath();
  };
  const magma = theme === 'magma';
  glow(ctx, x, b - 50, 110, 90, magma ? '255,190,120' : '255,120,110', 0.35);
  ctx.save();
  opening();
  ctx.clip();
  // the Caldera outside: an orange dusk (Cinder Flats) or crimson-violet (Magma Heart)
  ctx.fillStyle = magma
    ? vgrad(ctx, 'cexitA', top, b, [[0, '#ff9a6a'], [0.6, '#ffc88a'], [1, '#ffe2a8']])
    : vgrad(ctx, 'cexitB', top, b, [[0, '#5a2a6a'], [0.6, '#b0406a'], [1, '#ff8a5a']]);
  ctx.fillRect(x - hw, top, hw * 2, b - top + 4);
  ctx.fillStyle = magma ? '#a8586a' : '#4a2048';
  ctx.beginPath();
  ctx.moveTo(x - hw, b - 30);
  ctx.lineTo(x - 18, b - 58);
  ctx.lineTo(x - 2, b - 50);
  ctx.lineTo(x + 20, b - 74);
  ctx.lineTo(x + hw, b - 40);
  ctx.lineTo(x + hw, b);
  ctx.lineTo(x - hw, b);
  ctx.fill();
  glow(ctx, x + 20, b - 76, 12, 10, '255,200,110', 0.9);
  ctx.fillStyle = magma ? '#6a3444' : '#3a1838';
  ctx.fillRect(x - hw, b - 14, hw * 2, 18);
  ctx.restore();
  // frame of rounded stones with warm seams
  ctx.fillStyle = magma ? '#4e2434' : '#6a2e42';
  ctx.strokeStyle = magma ? '#1e0c18' : '#3e1a2a';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 10; i++) {
    const k = i / 10;
    let bx, by;
    if (k < 0.25) [bx, by] = [x - hw - 8, b - 10 - (k / 0.25) * (b - top - hw - 10)];
    else if (k > 0.75) [bx, by] = [x + hw + 8, b - 10 - ((1 - k) / 0.25) * (b - top - hw - 10)];
    else {
      const a = Math.PI + ((k - 0.25) / 0.5) * Math.PI;
      [bx, by] = [x + Math.cos(a) * (hw + 8), top + hw + Math.sin(a) * (hw + 8)];
    }
    ctx.beginPath();
    ctx.roundRect(bx - 11, by - 10, 22, 20, 6);
    ctx.fill();
    ctx.stroke();
  }
  if (magma) {
    for (const s of [-1, 1]) {
      const tx = x + s * (hw + 20);
      ctx.fillStyle = '#2e1824';
      ctx.fillRect(tx - 3, b - 62, 6, 62);
      glow(ctx, tx, b - 72, 22, 24, '255,160,70', 0.6);
      flame(ctx, tx, b - 60, 16, 24, time, s);
    }
  } else {
    for (const [s, c] of [[-1, 0], [1, 1]]) {
      ctx.save();
      ctx.translate(x + s * (hw + 10), top + hw - 10);
      ctx.rotate(s * 0.5);
      ctx.scale(0.4, 0.4);
      featherShape(ctx, 110, 30, FEATHER_COLS[c], time, s);
      ctx.restore();
    }
  }
  // sign over the doorway
  const label = 'Caldera';
  ctx.save();
  ctx.translate(x, top - 18);
  ctx.rotate(Math.sin(time * 1.3) * 0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = ctx.measureText(label).width + 40;
  ctx.fillStyle = magma ? '#a8504a' : '#c0604a';
  ctx.strokeStyle = magma ? '#5a2430' : '#7a2e3a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -12, tw, 24, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, label, 7, 0.5, 13, '#fff3e0');
  arrow(ctx, -tw / 2 + 13, 0, -1, 0.8, '#fff3e0');
  ctx.restore();
}

function drawBannerCaldera(ctx, theme, name, x, time) {
  const top = 90, magma = theme === 'magma';
  ctx.save();
  ctx.font = "700 20px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = ctx.measureText(name).width + 96, hh = 44;
  const sw = Math.sin(time * 0.9) * 1.5;
  const cloth = magma ? '#a83440' : '#c8445a', trim = magma ? '#ffcf6a' : '#ffe08a', ink = '#fff6e6';
  // chains (forge) / golden cords (roost) up out of sight
  if (magma) {
    chain(ctx, x - tw / 2 + 16, 18, top);
    chain(ctx, x + tw / 2 - 16, 18, top);
  } else {
    ctx.strokeStyle = '#e0a84a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - tw / 2 + 16, -10);
    ctx.lineTo(x - tw / 2 + 16 + sw, top);
    ctx.moveTo(x + tw / 2 - 16, -10);
    ctx.lineTo(x + tw / 2 - 16 + sw, top);
    ctx.stroke();
  }
  ctx.translate(x + sw, top);
  glow(ctx, 0, hh / 2, tw * 0.7, hh * 1.4, '255,170,90', 0.3);
  ctx.fillStyle = cloth;
  ctx.strokeStyle = mix(cloth, '#000000', 0.3);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, 0);
  ctx.lineTo(tw / 2, 0);
  ctx.lineTo(tw / 2, hh);
  if (magma) {
    // flame-tongue hem
    const n = 7;
    for (let i = n; i > 0; i--) {
      const x1 = -tw / 2 + (tw * (i - 1)) / n, xm = (x1 + -tw / 2 + (tw * i) / n) / 2;
      ctx.quadraticCurveTo(xm + tw / n * 0.3, hh + 2, xm, hh + 14 + Math.sin(time * 4 + i) * 2);
      ctx.quadraticCurveTo(xm - tw / n * 0.1, hh + 2, x1, hh);
    }
  } else {
    // feather-tip hem
    const n = 6;
    for (let i = n; i > 0; i--) {
      const x1 = -tw / 2 + (tw * (i - 1)) / n, xm = (x1 + -tw / 2 + (tw * i) / n) / 2;
      ctx.quadraticCurveTo(xm + tw / n * 0.5, hh + 8, xm, hh + 16);
      ctx.quadraticCurveTo(xm - tw / n * 0.5, hh + 8, x1, hh);
    }
  }
  ctx.lineTo(-tw / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // rod
  ctx.fillStyle = magma ? '#2e1824' : '#c98a3a';
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - 10, -5, tw + 20, 10, 5);
  ctx.fill();
  ctx.fillStyle = trim;
  circle(ctx, -tw / 2 - 10, 0, 5);
  circle(ctx, tw / 2 + 10, 0, 5);
  ctx.strokeStyle = trim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 6, 6, tw - 12, hh - 12, 6);
  ctx.stroke();
  for (const side of [-1, 1]) {
    const ex = side * (tw / 2 - 24);
    if (magma) {
      flame(ctx, ex, hh / 2 + 8, 12, 18, time, side, ['#ffcf6a', '#ffe7a0', '#fff8e0']);
    } else {
      ctx.save();
      ctx.translate(ex, hh / 2 + 9);
      ctx.rotate(side * 0.35);
      ctx.scale(0.17, 0.17);
      featherShape(ctx, 100, 34, ['#ffcf6a', '#ffe7a0']);
      ctx.restore();
    }
  }
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowOffsetY = 2;
  text(ctx, name, 0, hh / 2 + 1, 20, ink);
  ctx.restore();
}

function drawAmbientCaldera(ctx, theme, L, R, time) {
  const list = theme === 'magma' ? MAGMA.embers : PHOENIX.embers;
  for (const p of list) {
    const k = (time * p.sp * p.s + p.p / TAU) % 1;
    const x = p.x + Math.sin(time * 0.7 + p.p) * 18, y = p.y + 40 - k * 160;
    if (x < L || x > R || y < 0) continue;
    const a = Math.sin(k * Math.PI) * (0.6 + 0.4 * Math.sin(time * 5 + p.p));
    glow(ctx, x, y, 7 * p.s, 7 * p.s, '255,150,60', a * 0.6);
    ctx.fillStyle = `rgba(255,${theme === 'magma' ? 190 : 220},120,${a})`;
    circle(ctx, x, y, 1.6 * p.s);
  }
  if (theme === 'phoenix') {
    // little feathers drifting down on the warm wind
    for (const f of PHOENIX.feathers) {
      const fall = (time * f.sp + f.y) % 480;
      const x = f.x + Math.sin(time * 0.6 + f.p) * 30 + fall * 0.15, y = fall - 10;
      if (x < L || x > R) continue;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(time * 1.2 + f.p) * 0.8 + 0.6);
      ctx.scale(0.12 * f.s, 0.12 * f.s);
      ctx.globalAlpha = 0.9;
      featherShape(ctx, 100, 32, FEATHER_COLS[f.c], 0, 0, true);
      ctx.restore();
    }
  }
}

function drawDenCaldera(theme) {
  return (ctx, camX, viewW, time, den) => {
    const L = camX - 80, R = camX + viewW + 80;
    const magma = theme === 'magma';
    ctx.save();
    ctx.fillStyle = magma
      ? vgrad(ctx, 'bg-magma', 0, GROUND + 10, [[0, '#14060f'], [0.45, '#3a1424'], [0.85, '#8a3428'], [1, '#c8582c']])
      : vgrad(ctx, 'bg-phoenix', 0, GROUND + 10, [[0, '#3a1f5c'], [0.3, '#8a3a7a'], [0.62, '#ff7a6a'], [0.86, '#ffb06a'], [1, '#ffd88a']]);
    ctx.fillRect(L, 0, R - L, H);
    if (magma) drawMagmaBack(ctx, L, R, time);
    else drawPhoenixBack(ctx, L, R, camX, viewW, time);
    if (visible(THRONE_X - 180, THRONE_X + 180, L, R)) (magma ? throneMagma : thronePhoenix)(ctx, THRONE_X, time);
    (magma ? drawFloorMagma : drawFloorPhoenix)(ctx, Math.max(-40, L), Math.min(DEN_W + 40, R), time);
    if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExitCaldera(ctx, theme, time);
    if (visible(750 - 260, 750 + 260, L, R)) drawBannerCaldera(ctx, theme, den?.name ?? (magma ? 'The Molten Forge' : 'Phoenix Roost'), 750, time);
    DEN_PLATFORMS.forEach((p, i) => {
      if (!visible(p.x - 60, p.x + p.w + 60, L, R)) return;
      (magma ? ledgeMagma : ledgePhoenix)(ctx, p, i, time);
    });
    drawAmbientCaldera(ctx, theme, L, R, time);
    ctx.restore();
  };
}

export const DEN_ART = { magma: drawDenCaldera('magma'), phoenix: drawDenCaldera('phoenix') };

// ——— the cave mouths in the Caldera ———

function drawEntrance(theme) {
  return (ctx, x, groundY, time) => {
    const den = Math.max(0, DENS.findIndex((d) => d.theme === theme));
    const spec = MOBS[DENS[den]?.boss];
    const b = groundY, magma = theme === 'magma';
    const mw = 46, mh = 104, mtop = b - mh;
    const mouth = () => {
      ctx.beginPath();
      ctx.moveTo(x - mw, b + 2);
      ctx.lineTo(x - mw, mtop + mw);
      ctx.arc(x, mtop + mw, mw, Math.PI, 0);
      ctx.lineTo(x + mw, b + 2);
      ctx.closePath();
    };
    ctx.save();
    if (magma) {
      // a squat basalt forge-mound with a smoking chimney and lava trickling down its side
      glow(ctx, x, b - 60, 150, 110, '255,120,50', 0.3);
      ctx.fillStyle = '#3e1e30';
      ctx.fillRect(x + 36, b - 196, 34, 80);
      ctx.fillStyle = '#2a1222';
      ctx.beginPath();
      ctx.roundRect(x + 30, b - 204, 46, 12, 5);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const k = (time * 0.35 + i / 3) % 1;
        ctx.fillStyle = `rgba(120,90,110,${0.5 * (1 - k)})`;
        circle(ctx, x + 53 + Math.sin(k * 5 + i) * 8 + k * 16, b - 210 - k * 70, 10 + k * 16);
      }
      ctx.fillStyle = '#4a2434';
      ctx.beginPath();
      ctx.moveTo(x - 118, b + 4);
      ctx.bezierCurveTo(x - 112, b - 110, x - 60, b - 160, x, b - 162);
      ctx.bezierCurveTo(x + 60, b - 160, x + 112, b - 110, x + 118, b + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,190,150,0.1)';
      ellipse(ctx, x - 50, b - 112, 30, 44, -0.4);
      // rounded basalt blocks on it
      ctx.fillStyle = '#62324a';
      for (const [dx, dy, ww] of [[-70, 40, 40], [-30, 128, 46], [36, 120, 40], [74, 52, 36], [-88, 90, 28], [86, 96, 26]]) {
        ctx.beginPath();
        ctx.roundRect(x + dx - ww / 2, b - dy, ww, 20, 8);
        ctx.fill();
      }
      // lava trickle
      const a = 0.8 + 0.2 * Math.sin(time * 2);
      glow(ctx, x - 60, b - 70, 34, 90, '255,130,60', 0.6);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const trickle = () => {
        ctx.beginPath();
        ctx.moveTo(x - 30, b - 146);
        ctx.quadraticCurveTo(x - 60, b - 120, x - 62, b - 84);
        ctx.quadraticCurveTo(x - 64, b - 30, x - 84, b + 2);
      };
      ctx.strokeStyle = `rgba(255,110,50,${a})`;
      ctx.lineWidth = 12;
      trickle();
      ctx.stroke();
      ctx.strokeStyle = '#ffb04a';
      ctx.lineWidth = 7;
      trickle();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,245,190,0.9)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 16]);
      ctx.lineDashOffset = -time * 40;
      trickle();
      ctx.stroke();
      ctx.setLineDash([]);
      // the crack it seeps out of, and a little pool at the foot
      ctx.fillStyle = '#2a1222';
      ellipse(ctx, x - 30, b - 148, 12, 5, -0.4);
      glow(ctx, x - 30, b - 148, 14, 8, '255,200,110', 0.9);
      ctx.fillStyle = '#ffb04a';
      ellipse(ctx, x - 84, b + 1, 22, 5);
    } else {
      // a tall rocky spire topped with a great nest and fanned phoenix plumes
      glow(ctx, x, b - 150, 140, 140, '255,170,90', 0.35);
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(x, b - 168);
        ctx.rotate(-0.8 + i * 0.4);
        featherShape(ctx, 96 - Math.abs(i - 2) * 14, 18, FEATHER_COLS[i % 3], time, i);
        ctx.restore();
      }
      ctx.fillStyle = '#6a2e42';
      ctx.beginPath();
      ctx.moveTo(x - 118, b + 4);
      ctx.bezierCurveTo(x - 108, b - 100, x - 70, b - 168, x, b - 172);
      ctx.bezierCurveTo(x + 70, b - 168, x + 108, b - 100, x + 118, b + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,210,170,0.14)';
      ellipse(ctx, x - 50, b - 112, 30, 46, -0.4);
      // the nest rim
      ctx.fillStyle = '#c08a4a';
      ctx.beginPath();
      ctx.ellipse(x, b - 168, 62, 16, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#8a5a32';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        const tx = x - 54 + i * 18;
        ctx.moveTo(tx - 10, b - 170 + (i % 2) * 4);
        ctx.quadraticCurveTo(tx + 2, b - 158, tx + 14, b - 166);
      }
      ctx.stroke();
      for (let i = 0; i < 3; i++) flame(ctx, x - 24 + i * 24, b - 176, 18, 22 + (i % 2) * 10, time, i * 2);
    }
    // the mouth, glowing from deep inside
    ctx.fillStyle = magma
      ? vgrad(ctx, 'centA', mtop, b, [[0, '#2a0e1c'], [0.7, '#6a2428'], [1, '#c8502a']])
      : vgrad(ctx, 'centB', mtop, b, [[0, '#2a0e22'], [0.7, '#7a2a3a'], [1, '#e0703a']]);
    mouth();
    ctx.fill();
    glow(ctx, x, b - 8, 44, 22, '255,170,80', 0.6 + 0.2 * Math.sin(time * 2.5));
    if (magma) {
      chain(ctx, x - 24, mtop + 22, mtop + 62, '#1a0812');
      chain(ctx, x + 22, mtop + 18, mtop + 50, '#1a0812');
    }
    ctx.strokeStyle = magma ? '#2a1222' : '#4a1e32';
    ctx.lineWidth = 5;
    mouth();
    ctx.stroke();
    // rounded little fangs
    ctx.fillStyle = magma ? '#6a3a4a' : '#ffd88a';
    for (const fx of [-24, -8, 8, 24]) {
      const fy = mtop + mw - Math.sqrt(Math.max(0, mw * mw - fx * fx)) + 2;
      ctx.beginPath();
      ctx.moveTo(fx + x - 6, fy);
      ctx.quadraticCurveTo(x + fx, fy + (Math.abs(fx) < 10 ? 18 : 12) + 4, x + fx + 6, fy);
      ctx.fill();
    }
    // a pair of eyes peeking out
    const eyeCol = magma ? '255,190,90' : '255,226,140';
    const peek = Math.sin(time * 0.7 + den * 2), blink = ((time + den) % 3.7) < 0.14;
    const ex = x + peek * 8, ey = mtop + 58;
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
    // the warning sign on a post to the left
    const sx = x - 122;
    const SIGN = magma ? ['#8a4a52', '#4a2030'] : ['#c0604a', '#7a2e3a'];
    ctx.fillStyle = SIGN[1];
    ctx.beginPath();
    ctx.roundRect(sx - 4, b - 86, 8, 88, 3);
    ctx.fill();
    ctx.save();
    ctx.translate(sx, b - 76);
    ctx.rotate(Math.sin(time * 1.2 + den) * 0.025 - 0.03);
    ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
    const name = spec?.name ?? 'Boss';
    const tw = Math.max(92, ctx.measureText(name).width + 24);
    ctx.fillStyle = SIGN[0];
    ctx.strokeStyle = SIGN[1];
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
    text(ctx, `Lv ${spec?.lvl ?? '?'}`, 0, 25.5, 11, '#b0405a');
    ctx.restore();
    ctx.restore();
  };
}

export const ENTRANCE_ART = { magma: drawEntrance('magma'), phoenix: drawEntrance('phoenix') };

// ——— bosses ———

function bossEyes(ctx, fx, fy, gap, size, st, mood, eyeRgb) {
  const { t, seed, dying } = st;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const blink = ((t + seed * 7) % 3.8) < 0.13;
  for (const s of [-1, 1]) {
    const ex = fx + s * gap;
    if (dying > 0.02) {
      ctx.strokeStyle = '#2d2a3e';
      ctx.lineWidth = 3 * size;
      const d = 3.4 * size;
      ctx.beginPath();
      ctx.moveTo(ex - d, fy - d);
      ctx.lineTo(ex + d, fy + d);
      ctx.moveTo(ex + d, fy - d);
      ctx.lineTo(ex - d, fy + d);
      ctx.stroke();
      continue;
    }
    if (mood === 'glow') {
      glow(ctx, ex, fy, 14 * size, 12 * size, eyeRgb, 0.9);
      ctx.fillStyle = `rgb(${eyeRgb})`;
      ellipse(ctx, ex, fy, 4.6 * size, blink ? 0.8 : 4 * size);
      ctx.fillStyle = '#fffaf0';
      if (!blink) circle(ctx, ex + 1.2 * size, fy - 1.2 * size, 1.4 * size);
      continue;
    }
    ctx.fillStyle = '#2d2a3e';
    ellipse(ctx, ex, fy, 3.6 * size, blink ? 0.8 : 4.8 * size);
    if (!blink) {
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 1.1 * size, fy - 1.8 * size, 1.4 * size, 1.4 * size);
    }
  }
  if (dying > 0.02) return;
  ctx.strokeStyle = st.browCol ?? '#2d2a3e';
  ctx.lineWidth = 2.8 * size;
  ctx.beginPath();
  if (mood === 'angry' || mood === 'glow') {
    ctx.moveTo(fx - gap - 5 * size, fy - 9 * size);
    ctx.lineTo(fx - gap + 4.5 * size, fy - 5.2 * size);
    ctx.moveTo(fx + gap + 5 * size, fy - 9 * size);
    ctx.lineTo(fx + gap - 4.5 * size, fy - 5.2 * size);
  } else {
    ctx.moveTo(fx - gap - 4 * size, fy - 7.5 * size);
    ctx.quadraticCurveTo(fx - gap, fy - 10 * size, fx - gap + 4 * size, fy - 8 * size);
    ctx.moveTo(fx + gap - 4 * size, fy - 8 * size);
    ctx.quadraticCurveTo(fx + gap, fy - 10 * size, fx + gap + 4 * size, fy - 7.5 * size);
  }
  ctx.stroke();
}

// Ignis's crust plates, in body units (x: -0.5..0.5 of w, y: -1..0 of the body height). A jittered grid of
// quads; each is shrunk toward its centre when drawn, and the lava shows through the gaps.
const IGNIS_PLATES = (() => {
  const r = mulberry32(1601);
  const cols = 6, rows = 5;
  const P = [];
  for (let j = 0; j <= rows; j++) {
    P.push([]);
    for (let i = 0; i <= cols; i++) {
      const edge = i === 0 || i === cols || j === 0 || j === rows;
      P[j].push([-0.62 + (i / cols) * 1.24 + (edge ? 0 : (r() - 0.5) * 0.09), -1.08 + (j / rows) * 1.12 + (edge ? 0 : (r() - 0.5) * 0.09)]);
    }
  }
  const plates = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const q = [P[j][i], P[j][i + 1], P[j + 1][i + 1], P[j + 1][i]];
      const cx = q.reduce((a, p) => a + p[0], 0) / 4, cy = q.reduce((a, p) => a + p[1], 0) / 4;
      // leave the face (front, upper middle) open to the glowing lava
      if (Math.hypot((cx - 0.15) / 0.3, (cy + 0.5) / 0.2) < 1) continue;
      plates.push({ q, cx, cy, s: r(), hot: r() < 0.25 });
    }
  }
  return plates;
})();

// Ignis the Magma Tyrant: a huge round golem-slime of lava wearing plates of cooled crust, a crown of flame
function drawIgnis(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const bh = h * 0.8;
  const alive = dying < 0.02;
  const body = () => {
    ctx.moveTo(-w * 0.5, -4);
    ctx.bezierCurveTo(-w * 0.56, -bh * 0.55, -w * 0.34, -bh, 0, -bh);
    ctx.bezierCurveTo(w * 0.34, -bh, w * 0.56, -bh * 0.55, w * 0.5, -4);
    ctx.quadraticCurveTo(0, 6, -w * 0.5, -4);
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    body();
  };
  const walk = st.walking ? Math.sin(t * 6 + seed) : 0;
  const crust = rageCol('#4a2634', enr, 0.18), crustHi = rageCol('#6e3a48', enr, 0.2), ink = '#22101a';
  // fists: back one behind the body, front one in front
  const fist = (fx, fy, r, front) => {
    ctx.fillStyle = front ? crust : mix(crust, '#000000', 0.25);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(fx, fy, r, r * 0.88, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = crustHi;
    ellipse(ctx, fx - r * 0.3, fy - r * 0.35, r * 0.4, r * 0.22, -0.4);
    const a = 0.6 + 0.3 * Math.sin(t * 3 + fx);
    ctx.strokeStyle = `rgba(255,170,70,${a})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(fx - r * 0.5, fy + r * 0.1);
    ctx.lineTo(fx - r * 0.1, fy + r * 0.3);
    ctx.lineTo(fx + r * 0.2, fy + r * 0.05);
    ctx.lineTo(fx + r * 0.55, fy + r * 0.25);
    ctx.stroke();
    // knuckles
    ctx.strokeStyle = 'rgba(20,6,14,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const k of [-0.3, 0.05, 0.4]) {
      ctx.moveTo(fx + r * 0.62, fy + k * r - 4);
      ctx.lineTo(fx + r * 0.8, fy + k * r);
    }
    ctx.stroke();
  };
  const backY = -bh * 0.36 + walk * 5;
  fist(-w * 0.5, backY, 26, false);
  // the body: glowing lava jelly
  const lg = ctx.createLinearGradient(0, -bh, 0, 0);
  lg.addColorStop(0, enr ? '#ffe9a0' : '#ffd36a');
  lg.addColorStop(0.5, enr ? '#ff8a3a' : '#ff9a3a');
  lg.addColorStop(1, enr ? '#e8382a' : '#e85a2a');
  ctx.fillStyle = lg;
  ctx.beginPath();
  body();
  ctx.fill();
  // crust plates, clipped to the body; enraged = more lava shows
  ctx.save();
  ctx.beginPath();
  body();
  ctx.clip();
  glow(ctx, w * 0.15, -bh * 0.5, w * 0.3, bh * 0.3, '255,240,170', 0.7);
  const shrink = enr ? 0.62 : 0.74;
  ctx.lineJoin = 'round';
  for (const p of IGNIS_PLATES) {
    const k = shrink + (p.s - 0.5) * 0.06 + (p.hot && enr ? -0.12 : 0);
    ctx.beginPath();
    p.q.forEach(([qx, qy], i) => {
      const px = (p.cx + (qx - p.cx) * k) * w, py = (p.cy + (qy - p.cy) * k) * bh;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = crust;
    ctx.strokeStyle = crust;
    ctx.lineWidth = 8;
    ctx.fill();
    ctx.stroke();
    // a lit top edge on each plate
    ctx.strokeStyle = crustHi;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const [a0, a1] = [p.q[0], p.q[1]];
    ctx.moveTo((p.cx + (a0[0] - p.cx) * k * 0.85) * w, (p.cy + (a0[1] - p.cy) * k * 0.7) * bh + 2);
    ctx.lineTo((p.cx + (a1[0] - p.cx) * k * 0.85) * w, (p.cy + (a1[1] - p.cy) * k * 0.7) * bh + 2);
    ctx.stroke();
  }
  // the lava breathes in the cracks
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, 0, -bh * 0.3, w * 0.55, bh * 0.4, '255,120,40', (enr ? 0.35 : 0.2) + 0.1 * Math.sin(t * 3));
  ctx.globalCompositeOperation = 'source-over';
  // a round window of bright lava for the face
  const wx = w * 0.15, wy = -bh * 0.47;
  ctx.fillStyle = enr ? '#ffd27a' : '#ffc25a';
  ctx.strokeStyle = crust;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(wx, wy, w * 0.27, bh * 0.21, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  glow(ctx, wx, wy - bh * 0.03, w * 0.2, bh * 0.14, '255,250,210', 0.8);
  ctx.fillStyle = 'rgba(255,240,220,0.18)';
  ellipse(ctx, -w * 0.22, -bh * 0.74, w * 0.12, bh * 0.08, -0.5);
  ctx.restore();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  body();
  ctx.stroke();
  // lava dripping off the bottom
  if (alive) {
    for (let i = 0; i < (enr ? 5 : 3); i++) {
      const k = (t * 0.7 + i * 0.31 + seed) % 1;
      const dx = -w * 0.35 + ((i * 0.37 + seed) % 1) * w * 0.7;
      ctx.fillStyle = `rgba(255,150,60,${1 - k})`;
      ctx.beginPath();
      ctx.ellipse(dx, -4 + k * 6, 4, 5 + k * 6, 0, 0, TAU);
      ctx.fill();
    }
  }
  // crown: a jagged ring of crust with a ruby, flames roaring out of it
  const big = (enr ? 1.45 : 1) * (warn ? 1.2 : 1);
  ctx.save();
  ctx.translate(w * 0.02, -bh + 10);
  ctx.rotate(Math.sin(t * 1.3 + seed) * 0.03);
  if (alive) {
    glow(ctx, 0, -36 * big, 70 * big, 50 * big, '255,150,60', 0.45);
    const cols = enr ? FLAME_HOT : FLAME;
    for (const [dx, hh, ww, p] of [[-36, 34, 22, 0], [36, 34, 22, 1], [-19, 50, 26, 2], [19, 50, 26, 3], [0, 66, 30, 4]]) flame(ctx, dx, 2, ww * big, hh * big, t, p + seed, cols);
  }
  ctx.fillStyle = crust;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-44, 8);
  for (let i = 0; i <= 6; i++) ctx.lineTo(-44 + i * 14.6, i % 2 ? -4 : -16);
  ctx.lineTo(44, 8);
  ctx.quadraticCurveTo(0, 14, -44, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  glow(ctx, 0, -2, 14, 12, '255,120,90', 0.9);
  ctx.fillStyle = '#ff5a5a';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(6, -2);
  ctx.lineTo(0, 5);
  ctx.lineTo(-6, -2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd0c0';
  circle(ctx, -1.5, -4, 1.6);
  ctx.restore();
  // face, on the glowing window of lava
  const fx = w * 0.15, fy = -bh * 0.5, gap = 17;
  st.browCol = '#5a1e1a';
  bossEyes(ctx, fx, fy, gap, 1.45, st, warn || enr ? 'glow' : 'calm', '255,250,210');
  st.browCol = null;
  ctx.fillStyle = enr ? 'rgba(255,60,60,0.5)' : 'rgba(255,110,110,0.5)';
  ellipse(ctx, fx - gap - 7, fy + 11, 6.5, 3.5);
  ellipse(ctx, fx + gap + 7, fy + 11, 6.5, 3.5);
  ctx.strokeStyle = '#5a1e1a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (!alive) ctx.arc(fx, fy + 22, 6, 1.15 * Math.PI, 1.85 * Math.PI);
  else if (warn || charging) {
    // a roaring open mouth, white-hot inside
    ctx.fillStyle = '#5a1e1a';
    ctx.ellipse(fx, fy + 18, 9, 8, 0, 0, TAU);
    ctx.fill();
    glow(ctx, fx, fy + 19, 10, 8, '255,240,170', 0.9);
  } else if (enr) {
    ctx.moveTo(fx - 9, fy + 18);
    ctx.lineTo(fx - 3, fy + 14);
    ctx.lineTo(fx + 3, fy + 18);
    ctx.lineTo(fx + 9, fy + 14);
  } else ctx.arc(fx, fy + 12, 7, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  // the front fist: raised overhead to slam while winding up, punching forward while charging
  let ffx = w * 0.5, ffy = -bh * 0.34 - walk * 5 + Math.sin(t * 1.8 + seed) * 3;
  if (warn) [ffx, ffy] = [w * 0.42, -bh * 1.02 + Math.sin(st.time * 30) * 2];
  else if (charging) [ffx, ffy] = [w * 0.66, -bh * 0.4];
  if (warn) glow(ctx, ffx, ffy, 46, 46, '255,170,70', 0.7);
  fist(ffx, ffy, 30, true);
  // embers floating up around it
  if (alive) {
    for (let i = 0; i < (enr ? 7 : 4); i++) {
      const k = (t * 0.45 + i / 6 + seed) % 1;
      ctx.fillStyle = `rgba(255,200,110,${Math.sin(k * Math.PI)})`;
      circle(ctx, Math.cos(i * 2.1 + seed) * w * 0.55, -bh * (0.1 + k * 1.1), 2.2);
    }
  }
  return sil;
}

// The rebirth egg's cracks, in egg units: each a list of points starting on the shell
const EGG_CRACKS = (() => {
  const r = mulberry32(1701);
  return Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * TAU + r() * 0.5;
    let x = Math.cos(a) * 0.92, y = Math.sin(a) * 0.9;
    const pts = [[x, y]];
    for (let j = 0; j < 7; j++) {
      x += Math.cos(a + Math.PI) * 0.13 + (r() - 0.5) * 0.16;
      y += Math.sin(a + Math.PI) * 0.1 + (j % 2 ? 0.1 : -0.1);
      pts.push([clamp(x, -0.85, 0.85), clamp(y, -0.85, 0.85)]);
    }
    return { pts, at: i / 7 };
  });
})();

function drawEgg(ctx, w, h, st, m) {
  const { t, enr } = st;
  const shieldMax = m?.shieldMax || 0;
  const crack = shieldMax > 0 ? clamp(1 - (m.shield ?? shieldMax) / shieldMax, 0, 1) : 0;
  const rx = w * 0.32, ry = h * 0.46, cy = -ry - 2;
  const breathe = 1 + Math.sin(t * 3) * 0.02;
  const wob = Math.sin(st.time * (8 + crack * 30)) * 0.03 * (0.3 + crack);
  const eggPath = () => {
    // egg-shaped: narrower at the top
    ctx.moveTo(0, cy - ry);
    ctx.bezierCurveTo(rx * 0.78, cy - ry, rx * 1.04, cy - ry * 0.05, rx, cy + ry * 0.3);
    ctx.bezierCurveTo(rx * 0.92, cy + ry * 0.92, rx * 0.4, cy + ry, 0, cy + ry);
    ctx.bezierCurveTo(-rx * 0.4, cy + ry, -rx * 0.92, cy + ry * 0.92, -rx, cy + ry * 0.3);
    ctx.bezierCurveTo(-rx * 1.04, cy - ry * 0.05, -rx * 0.78, cy - ry, 0, cy - ry);
    ctx.closePath();
  };
  ctx.save();
  ctx.translate(0, -2);
  ctx.rotate(wob);
  ctx.scale(breathe, 1 / breathe);
  ctx.translate(0, 2);
  // a ring of little flames cradling it
  glow(ctx, 0, cy, rx * 2, ry * 1.5, '255,170,80', 0.5 + 0.2 * crack + 0.1 * Math.sin(t * 4));
  for (let i = 0; i < 7; i++) flame(ctx, -rx * 0.9 + (i / 6) * rx * 1.8, 2, 22, 22 + (i % 2) * 12 + crack * 16, t, i * 1.9, enr ? FLAME_HOT : FLAME);
  const g = ctx.createLinearGradient(-rx, cy - ry, rx * 0.6, cy + ry);
  g.addColorStop(0, '#fff6c8');
  g.addColorStop(0.45, mix('#ffc25a', '#ffe08a', crack * 0.6));
  g.addColorStop(1, mix('#ff7a3a', '#ffb04a', crack * 0.5));
  ctx.fillStyle = g;
  ctx.beginPath();
  eggPath();
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  eggPath();
  ctx.clip();
  // swirling flame-feather markings
  ctx.strokeStyle = 'rgba(255,120,60,0.45)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const yy = cy - ry * 0.3 + i * ry * 0.42;
    ctx.moveTo(-rx, yy + 10);
    ctx.bezierCurveTo(-rx * 0.4, yy - 14, rx * 0.2, yy + 18, rx, yy - 6);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,240,0.55)';
  ellipse(ctx, -rx * 0.4, cy - ry * 0.45, rx * 0.18, ry * 0.26, -0.4);
  // the heart of the fire showing through as it cracks
  glow(ctx, 0, cy + ry * 0.1, rx * 0.8, ry * 0.7, '255,250,210', crack * 0.8);
  ctx.restore();
  ctx.strokeStyle = '#c0602a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  eggPath();
  ctx.stroke();
  // cracks spreading as the shield is broken, light leaking through
  if (crack > 0.02) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const c of EGG_CRACKS) {
      const j = clamp((crack - c.at * 0.6) / 0.4, 0, 1);
      if (j <= 0) continue;
      const n = 1 + j * (c.pts.length - 1);
      for (const [lw, col] of [[10, 'rgba(255,230,140,0.5)'], [4, '#fffbe0'], [1.4, '#d0602a']]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const f = Math.min(1, n - i);
          const [px, py] = c.pts[i], [qx, qy] = c.pts[Math.min(i + 1, c.pts.length - 1)];
          const x0 = px * rx, y0 = cy + py * ry;
          if (i === 0) ctx.moveTo(x0, y0);
          if (i + 1 < c.pts.length) ctx.lineTo((px + (qx - px) * f) * rx, cy + (py + (qy - py) * f) * ry);
        }
        ctx.stroke();
      }
    }
  }
  // a wisp of flame on top
  flame(ctx, 0, cy - ry + 6, 18, 26 + crack * 20, t, 1);
  ctx.restore();
  return () => {
    ctx.beginPath();
    eggPath();
  };
}

// Pyra the Ember Phoenix: a big round fluffy fire bird, hovering low (her origin is just under her body)
function drawPyra(ctx, w, h, st, m) {
  if (m?.special) return drawEgg(ctx, w, h, st, m);
  const { t, seed, enr, warn, charging, dying } = st;
  const alive = dying < 0.02;
  const cy = -h * 0.5, rx = w * 0.34, ry = h * 0.4;
  const bob = Math.sin(t * 3 + seed) * 3;
  const by = cy + bob;
  const N = 22;
  const fluff = () => {
    ctx.moveTo(rx, by);
    for (let i = 1; i <= N; i++) {
      const a0 = ((i - 0.5) / N) * TAU, a1 = (i / N) * TAU;
      const bump = 1.1;
      ctx.quadraticCurveTo(Math.cos(a0) * rx * bump, by + Math.sin(a0) * ry * bump, Math.cos(a1) * rx, by + Math.sin(a1) * ry);
    }
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    fluff();
  };
  const outline = rageCol('#c8402a', enr, 0.2);
  const cols = enr ? FLAME_HOT : FLAME;
  const flap = warn ? 0.6 + Math.sin(st.time * 28) * 0.06 : charging ? -1.05 : Math.sin(t * 7 + seed) * 0.55 - 0.1;
  const wing = (front) => {
    ctx.save();
    ctx.translate(front ? w * 0.02 : -w * 0.08, by - ry * 0.15);
    ctx.rotate(flap * (front ? 1 : 0.85) + (front ? 0 : -0.15));
    const wl = w * 0.5 * (front ? 1 : 0.9);
    const base = front ? rageCol('#ff7a3a', enr, 0.2) : rageCol('#e8503a', enr, 0.2);
    // feather lobes fanning out backwards
    for (let i = 3; i >= 0; i--) {
      const a = -Math.PI * (0.55 + i * 0.14);
      const len = wl * (1 - i * 0.12);
      ctx.save();
      ctx.rotate(a + Math.PI / 2);
      const g = ctx.createLinearGradient(0, 0, 0, -len);
      g.addColorStop(0, base);
      g.addColorStop(0.75, i % 2 ? '#ffb04a' : '#ffc25a');
      g.addColorStop(1, '#fff0a0');
      ctx.fillStyle = g;
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.bezierCurveTo(-18, -len * 0.4, -12, -len * 0.85, 0, -len);
      ctx.bezierCurveTo(12, -len * 0.85, 16, -len * 0.4, 10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (warn) glow(ctx, -wl * 0.5, -wl * 0.3, wl * 0.6, wl * 0.4, '255,220,120', 0.6);
    ctx.restore();
  };
  // tail plumes flowing out behind and down
  for (let i = 0; i < 4; i++) {
    const sw = Math.sin(t * 3 + i * 0.8 + seed) * 0.12 + (charging ? -0.35 : 0);
    ctx.save();
    ctx.translate(-rx * 0.75, by + ry * 0.3);
    ctx.rotate(-Math.PI / 2 - 0.5 - i * 0.3 + sw);
    const len = w * (0.5 - Math.abs(i - 1.5) * 0.06);
    const g = ctx.createLinearGradient(0, 0, 0, -len);
    g.addColorStop(0, rageCol('#ff6a3a', enr, 0.2));
    g.addColorStop(1, i % 2 ? '#ffd66a' : '#ff9a4a');
    ctx.fillStyle = g;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.bezierCurveTo(-12, -len * 0.5, -8, -len * 0.8, 0, -len);
    ctx.bezierCurveTo(8, -len * 0.8, 12, -len * 0.5, 7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (alive) flame(ctx, 0, -len + 8, 14, 22, t, i * 2.3 + seed, cols);
    ctx.restore();
  }
  wing(false);
  // little gold talons dangling under her
  ctx.strokeStyle = '#e0a03a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const dx of [-10, 12]) {
    const sw = charging ? -8 : Math.sin(t * 3 + dx) * 2;
    ctx.moveTo(dx, by + ry - 6);
    ctx.lineTo(dx + sw, by + ry + 10);
    ctx.moveTo(dx + sw - 5, by + ry + 13);
    ctx.lineTo(dx + sw, by + ry + 10);
    ctx.lineTo(dx + sw + 5, by + ry + 13);
  }
  ctx.stroke();
  // the fluffy round body
  const g = ctx.createLinearGradient(0, by - ry, 0, by + ry);
  g.addColorStop(0, rageCol('#ff8a4a', enr, 0.25));
  g.addColorStop(0.6, rageCol('#ff6a3a', enr, 0.25));
  g.addColorStop(1, rageCol('#e84a3a', enr, 0.2));
  ctx.fillStyle = g;
  ctx.beginPath();
  fluff();
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  fluff();
  ctx.clip();
  // a cream belly, and a few soft feather scallops
  ctx.fillStyle = '#ffe8b0';
  ellipse(ctx, rx * 0.32, by + ry * 0.38, rx * 0.62, ry * 0.6);
  ctx.strokeStyle = 'rgba(255,200,120,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      const sx = rx * (0.02 + i * 0.26) + (j % 2) * 8, sy = by + ry * (0.08 + j * 0.24);
      ctx.moveTo(sx - 9, sy);
      ctx.quadraticCurveTo(sx, sy + 8, sx + 9, sy);
    }
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,200,0.35)';
  ellipse(ctx, -rx * 0.35, by - ry * 0.55, rx * 0.28, ry * 0.14, -0.4);
  ctx.restore();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  fluff();
  ctx.stroke();
  // the flame crest on her head
  ctx.save();
  ctx.translate(rx * 0.12, by - ry + 6);
  ctx.rotate(charging ? -0.6 : -0.25);
  const big = enr ? 1.35 : 1;
  if (alive) {
    glow(ctx, 0, -24, 40 * big, 34 * big, '255,170,80', 0.45);
    for (const [dx, hh, ww, p] of [[-16, 30, 18, 0], [12, 34, 18, 1], [-2, 48, 22, 2]]) flame(ctx, dx, 4, ww * big, hh * big, t, p + seed, cols);
  }
  ctx.restore();
  wing(true);
  // face: big shiny eyes, rosy cheeks, a little golden beak
  const fx = rx * 0.42, fy = by - ry * 0.18, gap = 13;
  if (alive) {
    ctx.fillStyle = '#fff6e6';
    for (const s of [-1, 1]) ellipse(ctx, fx + s * gap, fy, 7.5, 8.5);
  }
  st.browCol = '#8a2a1a';
  bossEyes(ctx, fx, fy, gap, 1.3, st, warn || enr ? 'angry' : 'calm');
  st.browCol = null;
  ctx.fillStyle = enr ? 'rgba(255,60,80,0.55)' : 'rgba(255,120,140,0.55)';
  ellipse(ctx, fx - gap - 4, fy + 11, 5.5, 3);
  ellipse(ctx, fx + gap + 5, fy + 11, 5.5, 3);
  const open = (warn || charging) && alive ? 5 : 0;
  ctx.fillStyle = '#ffc23a';
  ctx.strokeStyle = '#c0802a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fx + 2, fy + 6);
  ctx.quadraticCurveTo(fx + 20, fy + 6, fx + 24, fy + 11);
  ctx.quadraticCurveTo(fx + 14, fy + 14 - open * 0.2, fx + 2, fy + 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(fx + 3, fy + 13 + open * 0.4);
  ctx.quadraticCurveTo(fx + 14, fy + 15 + open, fx + 18, fy + 13 + open * 0.6);
  ctx.quadraticCurveTo(fx + 10, fy + 19 + open, fx + 3, fy + 16 + open * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (open) glow(ctx, fx + 14, fy + 14, 12, 8, '255,240,170', 0.8);
  // sparks shed from her wings
  if (alive) {
    for (let i = 0; i < (enr ? 8 : 5); i++) {
      const k = (t * 0.6 + i / 5 + seed) % 1;
      ctx.fillStyle = `rgba(255,220,130,${Math.sin(k * Math.PI)})`;
      star(ctx, -rx * (0.2 + (i % 3) * 0.4) - k * 30, by + ry * (0.6 - (i % 2) * 1.2) + k * 30, 3);
    }
  }
  return sil;
}

export const BOSS_ART = { ignis: drawIgnis, pyra: drawPyra };

// ——— boss effects ———

const FIRE_RGB = { magma: '255,140,60', phoenix: '255,180,90' };
const fireRgb = (e) => FIRE_RGB[e.theme] ?? '255,150,70';

function shard(ctx, x, y, rot, s, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = c;
  ctx.strokeStyle = '#c0602a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.quadraticCurveTo(0, -10, 9, -5);
  ctx.lineTo(4, 7);
  ctx.lineTo(-3, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function rock(ctx, x, y, rot, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = '#4a2434';
  ctx.beginPath();
  ctx.moveTo(-8, -4);
  ctx.lineTo(-2, -9);
  ctx.lineTo(8, -5);
  ctx.lineTo(7, 5);
  ctx.lineTo(-5, 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ff9a4a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(2, -2);
  ctx.lineTo(4, 3);
  ctx.stroke();
  ctx.restore();
}

// The lava surface of the flood: a wavy top edge
function lavaSheet(ctx, top, t, a) {
  const y0 = top;
  ctx.fillStyle = vgrad(ctx, 'magmaflood', 330, GROUND + 90, [[0, '#ffe08a'], [0.25, '#ffa63a'], [0.7, '#ff6a2a'], [1, '#c8402a']]);
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.moveTo(-40, H + 10);
  for (let x = -40; x <= DEN_W + 40; x += 30) ctx.lineTo(x, y0 + Math.sin(x * 0.02 + t * 5) * 6 + Math.sin(x * 0.051 - t * 3) * 4);
  ctx.lineTo(DEN_W + 40, H + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,250,210,0.9)';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let x = -40; x <= DEN_W + 40; x += 30) {
    const y = y0 + Math.sin(x * 0.02 + t * 5) * 6 + Math.sin(x * 0.051 - t * 3) * 4;
    x === -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function ledgeSafeOne(ctx, p, time, a) {
  glow(ctx, p.x + p.w / 2, p.y - 10, p.w * 0.7, 46, '120,240,160', 0.55 * a);
  ctx.strokeStyle = `rgba(150,255,180,${(0.6 + 0.35 * Math.sin(time * 6)) * a})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(p.x - 10, p.y - 10, p.w + 20, 38, 12);
  ctx.stroke();
  ctx.globalAlpha = a;
  safeTag(ctx, p.x + p.w / 2, p.y - 26, time);
  // chevrons pointing up onto it
  ctx.strokeStyle = 'rgba(190,255,210,0.85)';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 2; i++) {
    const cy = p.y + 64 + i * 16 - (Math.abs(Math.sin(time * 4)) * 6);
    ctx.beginPath();
    ctx.moveTo(p.x + p.w / 2 - 12, cy + 6);
    ctx.lineTo(p.x + p.w / 2, cy - 4);
    ctx.lineTo(p.x + p.w / 2 + 12, cy + 6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function ledgeDoomed(ctx, p, e, k, time) {
  const shake = Math.sin(time * 50 + p.x) * 1.5 * k;
  ctx.save();
  ctx.translate(shake, 0);
  ctx.fillStyle = `rgba(255,70,60,${(0.22 + 0.25 * k) * (0.7 + 0.3 * Math.sin(time * 10))})`;
  ctx.beginPath();
  ctx.roundRect(p.x - 8, p.y - 8, p.w + 16, 36, 10);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,96,80,${0.7 + 0.3 * Math.sin(time * 10)})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.roundRect(p.x - 8, p.y - 8, p.w + 16, 36, 10);
  ctx.stroke();
  ctx.setLineDash([]);
  // cracks spreading over the slab
  ctx.strokeStyle = '#1a0812';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const c of e.ledgeCracks) {
    const n = Math.floor(c.length * clamp(k * 1.3, 0, 1));
    if (n < 2) continue;
    ctx.beginPath();
    for (let i = 0; i < n; i++) (i ? ctx.lineTo(p.x + c[i][0] * p.w, p.y + c[i][1]) : ctx.moveTo(p.x + c[i][0] * p.w, p.y + c[i][1]));
    ctx.stroke();
  }
  ctx.restore();
  // smoke curling up
  for (let i = 0; i < 3; i++) {
    const j = (time * 0.8 + i / 3 + p.x * 0.01) % 1;
    ctx.fillStyle = `rgba(90,70,90,${0.45 * Math.sin(j * Math.PI) * Math.min(1, k * 3)})`;
    circle(ctx, p.x + p.w * (0.25 + i * 0.25) + Math.sin(j * 4 + i) * 8, p.y - 6 - j * 50, 8 + j * 12);
  }
}

export const FX2 = {
  // Pyra's egg shatters into fiery shards
  eggBreak: {
    dur: 1,
    init(e, r) {
      e.shards = Array.from({ length: 22 }, () => {
        const a = r() * TAU, sp = 160 + r() * 340;
        return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, rot: r() * TAU, vr: (r() - 0.5) * 16, s: 0.9 + r() * 1.1, c: ['#fff0b0', '#ffc25a', '#ff9a4a'][Math.floor(r() * 3)] };
      });
      e.sparks = Array.from({ length: 18 }, () => ({ a: r() * TAU, d: 0.5 + r() * 0.5 }));
    },
    draw(ctx, e, k) {
      const x = e.x, cy = e.y - 66, tt = e.t, fade = 1 - k;
      if (k < 0.25) {
        glow(ctx, x, cy, 260 * (0.4 + k * 3), 220 * (0.4 + k * 3), '255,250,220', (1 - k / 0.25) * 0.95);
      }
      glow(ctx, x, cy, 120, 100, '255,170,80', 0.7 * fade);
      // a ring bursting out
      ctx.strokeStyle = `rgba(255,240,180,${0.9 * fade})`;
      ctx.lineWidth = 10 * fade + 1;
      ctx.beginPath();
      ctx.ellipse(x, cy, 30 + 220 * ease(k), (30 + 220 * ease(k)) * 0.7, 0, 0, TAU);
      ctx.stroke();
      for (const s of e.sparks) {
        const d = 40 + 200 * ease(k) * s.d;
        ctx.fillStyle = `rgba(255,230,140,${fade})`;
        star(ctx, x + Math.cos(s.a) * d, cy + Math.sin(s.a) * d * 0.8, 5 * fade + 1);
      }
      for (const p of e.shards) {
        ctx.globalAlpha = Math.min(1, fade * 1.5);
        const px = x + p.vx * tt, py = Math.min(GROUND - 4, cy + p.vy * tt + 0.5 * GRAV * tt * tt);
        glow(ctx, px, py, 12, 12, '255,180,90', 0.5);
        shard(ctx, px, py, p.rot + p.vr * tt, p.s, p.c);
      }
      ctx.globalAlpha = 1;
    },
  },

  // Ignis's ult: the floor glows and bubbles, two ledges crack, the safe one glows green
  magmaWarn: {
    dur: 3,
    init(e, r) {
      e.bubbles = Array.from({ length: 40 }, () => ({ x: r() * DEN_W, p: r(), s: 0.6 + r() * 0.9 }));
      e.ledgeCracks = Array.from({ length: 4 }, () => {
        let x = 0.1 + r() * 0.8, y = 2;
        const pts = [[x, y]];
        for (let i = 0; i < 5; i++) {
          x = clamp(x + (r() - 0.5) * 0.06, 0.02, 0.98);
          y = Math.min(24, y + 3 + r() * 4);
          pts.push([x, y]);
        }
        return pts;
      });
    },
    draw(ctx, e, k) {
      const y = GROUND, t = e.t;
      const pulse = 0.5 + 0.5 * Math.sin(t * (6 + 14 * k));
      // the floor heating up: a rising orange glow
      const g = ctx.createLinearGradient(0, y - 90, 0, y + 40);
      g.addColorStop(0, 'rgba(255,120,50,0)');
      g.addColorStop(0.65, `rgba(255,120,50,${(0.25 + 0.4 * k) * (0.7 + 0.3 * pulse)})`);
      g.addColorStop(1, `rgba(255,200,90,${0.3 + 0.4 * k})`);
      ctx.fillStyle = g;
      ctx.fillRect(-20, y - 90, DEN_W + 40, 130);
      stripes(ctx, -20, y - 2, DEN_W + 20, y + 14, 22, t * 60, `rgba(255,90,60,${0.15 + 0.35 * k})`);
      // bubbles popping all along it
      for (const b of e.bubbles) {
        const j = (t * (0.9 + b.s * 0.6) + b.p) % 1;
        const r = (3 + 6 * b.s) * Math.sin(j * Math.PI) * (0.4 + 0.6 * k);
        if (r < 0.5) continue;
        ctx.fillStyle = `rgba(255,${180 + Math.floor(60 * j)},100,0.9)`;
        circle(ctx, b.x, y + 2 - j * 10 * k, r);
        ctx.fillStyle = 'rgba(255,250,210,0.8)';
        circle(ctx, b.x - r * 0.3, y + 2 - j * 10 * k - r * 0.3, r * 0.3);
      }
      DEN_PLATFORMS.forEach((p, i) => {
        if (i === e.safe) ledgeSafeOne(ctx, p, t, Math.min(1, k * 4));
        else ledgeDoomed(ctx, p, e, k, t);
      });
    },
  },

  // lava floods the floor, the unsafe ledges crumble into it
  magmaHit: {
    dur: 1.5,
    init(e, r) {
      e.parts = [];
      DEN_PLATFORMS.forEach((p, i) => {
        if (i === e.safe) return;
        for (let j = 0; j < 12; j++) e.parts.push({ x: p.x + r() * p.w, y: p.y + r() * 20, vx: (r() - 0.5) * 120, vy: -(40 + r() * 160), rot: r() * TAU, vr: (r() - 0.5) * 10, s: 0.9 + r() * 1.2 });
      });
      e.splash = Array.from({ length: 30 }, () => ({ x: r() * DEN_W, vy: -(150 + r() * 260), d: r() * 0.4 }));
    },
    draw(ctx, e, k) {
      const t = e.t;
      const rise = clamp(t / 0.25, 0, 1), fall = clamp((t - 1.2) / 0.3, 0, 1);
      const top = GROUND - 66 * ease(rise) + 80 * fall * fall;
      if (t < 0.18) {
        ctx.fillStyle = `rgba(255,220,160,${0.5 * (1 - t / 0.18)})`;
        ctx.fillRect(-20, 0, DEN_W + 40, H);
      }
      glow(ctx, 750, top, 900, 120, '255,140,60', 0.6 * (1 - fall));
      // the crumbling ledges: a red-hot overlay and chunks falling into the lava
      DEN_PLATFORMS.forEach((p, i) => {
        if (i === e.safe) {
          ledgeSafeOne(ctx, p, t, 1 - fall);
          return;
        }
        ctx.fillStyle = `rgba(40,14,24,${0.75 * clamp(t / 0.3, 0, 1) * (1 - fall)})`;
        ctx.beginPath();
        ctx.roundRect(p.x - 8, p.y - 7, p.w + 16, 34, 10);
        ctx.fill();
        glow(ctx, p.x + p.w / 2, p.y + 10, p.w * 0.6, 30, '255,90,60', 0.6 * (1 - fall));
      });
      for (const p of e.parts) {
        const tt = Math.max(0, t - 0.1);
        const py = p.y + p.vy * tt + 0.5 * GRAV * tt * tt;
        if (py > top + 10) continue;
        rock(ctx, p.x + p.vx * tt, py, p.rot + p.vr * tt, p.s);
      }
      lavaSheet(ctx, top, t, 1 - fall * 0.6);
      // splashes and bubbles on the surface
      for (const s of e.splash) {
        const tt = t - s.d;
        if (tt <= 0) continue;
        const py = top + s.vy * tt + 0.5 * GRAV * tt * tt;
        if (py > top + 4) continue;
        ctx.fillStyle = `rgba(255,${200 - Math.floor(tt * 60)},90,${1 - fall})`;
        circle(ctx, s.x, py, 4);
      }
    },
  },

  // Pyra's rebirth: a ring of fire around the egg and a timer arc filling
  rebirthWarn: {
    dur: 8,
    draw(ctx, e, k) {
      const x = e.x, cy = e.y - 66, t = e.t;
      const pulse = 0.5 + 0.5 * Math.sin(t * (4 + 10 * k));
      // the room heating up from the edges in
      ctx.fillStyle = `rgba(255,120,60,${0.05 + 0.15 * k * (0.7 + 0.3 * pulse)})`;
      ctx.fillRect(-20, 0, DEN_W + 40, H);
      glow(ctx, x, cy, 200 + 120 * k, 160 + 100 * k, '255,170,80', 0.35 + 0.25 * k);
      // the ring of fire, flames turning around the egg
      const R = 112, ry = 0.35;
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + t * 0.8;
        const fx = x + Math.cos(a) * R, fy = e.y - 4 + Math.sin(a) * R * ry;
        const back = Math.sin(a) < 0;
        ctx.globalAlpha = back ? 0.65 : 1;
        flame(ctx, fx, fy, 22, 30 + 18 * k + (i % 2) * 8, t, i * 1.3);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(255,200,110,${0.6 + 0.3 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, e.y - 4, R, R * ry, 0, 0, TAU);
      ctx.stroke();
      // the timer: an arc filling clockwise around the egg, redder as it nears the end
      const tr = 92;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(60,20,40,0.45)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(x, cy, tr, 0, TAU);
      ctx.stroke();
      const col = k < 0.7 ? '#ffd66a' : mix('#ffd66a', '#ff4a3a', (k - 0.7) / 0.3);
      ctx.strokeStyle = col;
      ctx.lineWidth = 8;
      ctx.shadowColor = 'rgba(255,170,80,0.9)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, cy, tr, -Math.PI / 2, -Math.PI / 2 + TAU * k);
      ctx.stroke();
      ctx.shadowBlur = 0;
      const ha = -Math.PI / 2 + TAU * k;
      ctx.fillStyle = '#fffbe0';
      star(ctx, x + Math.cos(ha) * tr, cy + Math.sin(ha) * tr, 7 + pulse * 2);
      // ticks
      ctx.strokeStyle = 'rgba(255,240,200,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU - Math.PI / 2;
        ctx.moveTo(x + Math.cos(a) * (tr + 9), cy + Math.sin(a) * (tr + 9));
        ctx.lineTo(x + Math.cos(a) * (tr + 15), cy + Math.sin(a) * (tr + 15));
      }
      ctx.stroke();
      // embers spiralling in
      for (let i = 0; i < 10; i++) {
        const j = (t * 0.5 + i / 10) % 1;
        const a = i * 0.63 + t * 1.5;
        const d = 260 * (1 - j);
        ctx.fillStyle = `rgba(255,210,120,${j})`;
        circle(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, 2.5);
      }
    },
  },

  // the egg bursts: a huge fiery explosion filling the room
  rebirthHit: {
    dur: 1.4,
    init(e, r) {
      e.rays = Array.from({ length: 16 }, (_, i) => ({ a: (i / 16) * TAU + r() * 0.2, len: 0.7 + r() * 0.5 }));
      e.feathers = Array.from({ length: 26 }, () => {
        const a = r() * TAU, sp = 200 + r() * 500;
        return { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 150, rot: r() * TAU, vr: (r() - 0.5) * 6, c: Math.floor(r() * 3), s: 0.15 + r() * 0.15 };
      });
    },
    draw(ctx, e, k) {
      const x = e.x, cy = e.y - 66, t = e.t, fade = 1 - k;
      // the whole den washed in fire, then a white flash
      const fl = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
      ctx.fillStyle = `rgba(255,150,70,${0.55 * fl})`;
      ctx.fillRect(-20, 0, DEN_W + 40, H);
      if (k < 0.2) {
        ctx.fillStyle = `rgba(255,252,235,${0.85 * (1 - k / 0.2)})`;
        ctx.fillRect(-20, 0, DEN_W + 40, H);
      }
      // rays spinning out
      ctx.save();
      ctx.translate(x, cy);
      ctx.rotate(t * 0.6);
      for (const r of e.rays) {
        const len = 1100 * r.len * ease(Math.min(1, k * 3));
        ctx.fillStyle = `rgba(255,230,150,${0.4 * fade})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(r.a - 0.05) * len, Math.sin(r.a - 0.05) * len);
        ctx.lineTo(Math.cos(r.a + 0.05) * len, Math.sin(r.a + 0.05) * len);
        ctx.fill();
      }
      ctx.restore();
      // the fireball, expanding to fill the room
      const R = 60 + 1000 * ease(Math.min(1, k * 1.4));
      glow(ctx, x, cy, R, R * 0.75, '255,140,60', 0.9 * fade);
      glow(ctx, x, cy, R * 0.55, R * 0.42, '255,220,130', 0.9 * fade);
      glow(ctx, x, cy, R * 0.25, R * 0.2, '255,252,230', fade);
      for (let i = 0; i < 2; i++) {
        const j = clamp(k * 1.5 - i * 0.18, 0, 1);
        if (j <= 0 || j >= 1) continue;
        ctx.strokeStyle = `rgba(255,240,190,${0.9 * (1 - j)})`;
        ctx.lineWidth = 16 * (1 - j) + 2;
        ctx.beginPath();
        ctx.ellipse(x, cy, 40 + 900 * ease(j), (40 + 900 * ease(j)) * 0.6, 0, 0, TAU);
        ctx.stroke();
      }
      // a ring of flame racing along the floor both ways
      const d = 1600 * ease(Math.min(1, k * 1.3));
      for (const s of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const fx = x + s * (d - i * 40);
          ctx.globalAlpha = fade;
          flame(ctx, fx, GROUND + 2, 40 - i * 6, (90 - i * 16) * fade + 10, t, i + s);
        }
      }
      ctx.globalAlpha = 1;
      for (const f of e.feathers) {
        ctx.save();
        ctx.translate(x + f.vx * t, cy + f.vy * t + 0.5 * 300 * t * t);
        ctx.rotate(f.rot + f.vr * t);
        ctx.scale(f.s, f.s);
        ctx.globalAlpha = fade;
        featherShape(ctx, 100, 30, FEATHER_COLS[f.c], 0, 0, true);
        ctx.restore();
      }
    },
  },

  // the splash at the top of a geyser
  geyserBurst: {
    dur: 0.5,
    init(e, r) {
      e.drops = Array.from({ length: 14 }, () => ({ vx: (r() - 0.5) * 320, vy: -(120 + r() * 260), s: 2.5 + r() * 3.5 }));
    },
    draw(ctx, e, k) {
      const x = e.x, y = e.top ?? e.y, t = e.t, fade = 1 - k;
      glow(ctx, x, y, 70, 50, '255,170,80', 0.8 * fade);
      // a crown of lava tongues fanning out
      ctx.globalAlpha = fade;
      for (let i = -2; i <= 2; i++) {
        ctx.save();
        ctx.translate(x + i * 9, y + 8);
        ctx.rotate(i * 0.38 * (0.6 + 0.6 * ease(k)));
        flame(ctx, 0, 0, 18 - Math.abs(i) * 2, (38 - Math.abs(i) * 8) * (0.5 + 0.7 * ease(k)), t, i * 1.7, LAVA);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(255,240,170,${fade})`;
      ellipse(ctx, x, y + 6, 24 * (0.6 + k), 6);
      for (const d of e.drops) {
        const px = x + d.vx * t, py = y + d.vy * t + 0.5 * GRAV * t * t;
        ctx.fillStyle = `rgba(255,${190 - Math.floor(k * 60)},90,${fade})`;
        circle(ctx, px, py, d.s * (1 - k * 0.5));
      }
      // a puff of steam
      ctx.fillStyle = `rgba(255,220,210,${0.4 * fade})`;
      circle(ctx, x - 10, y - 20 - k * 30, 12 + k * 14);
      circle(ctx, x + 12, y - 26 - k * 36, 10 + k * 12);
    },
  },

  // Pyra's (or a cinder bat's) dive: a fiery dotted path from (x, y) to (tx, ty), a target where it lands
  diveWarn: {
    dur: 0.8,
    draw(ctx, e, k) {
      const { x, y } = e, tx = e.tx ?? x, ty = e.ty ?? GROUND, t = e.t;
      const pulse = 0.5 + 0.5 * Math.sin(t * 20);
      const dx = tx - x, dy = ty - y, len = Math.hypot(dx, dy) || 1;
      const big = (e.size ?? 0) > 60 || (e.theme === 'phoenix');
      const hw = big ? 26 : 14, rgb = fireRgb(e);
      const R = (big ? 58 : 30) * (1.25 - 0.25 * ease(k));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(dy, dx));
      // the lane, widening toward where it lands
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, `rgba(255,96,70,${0.12 + 0.1 * pulse})`);
      g.addColorStop(1, `rgba(255,96,70,${0.4 + 0.15 * pulse})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -hw * 0.4);
      ctx.lineTo(len, -hw);
      ctx.lineTo(len, hw);
      ctx.lineTo(0, hw * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(255,120,90,${0.6 + 0.3 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -hw * 0.4);
      ctx.lineTo(len, -hw);
      ctx.moveTo(0, hw * 0.4);
      ctx.lineTo(len, hw);
      ctx.stroke();
      // a fiery fill racing ahead as the dive winds up
      ctx.fillStyle = `rgba(255,230,170,${0.5 + 0.25 * pulse})`;
      ctx.beginPath();
      ctx.roundRect(0, -3.5, Math.max(7, len * ease(k)), 7, 3.5);
      ctx.fill();
      // marching chevrons
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 0; i < 5; i++) {
        const p = (i / 5 + t * 1.2) % 1, cx = p * (len - R * 0.6), s = (big ? 1 : 0.6) * (0.6 + p * 0.5);
        ctx.strokeStyle = `rgba(255,250,235,${Math.sin(p * Math.PI) * 0.95})`;
        ctx.lineWidth = 5 * s;
        ctx.beginPath();
        ctx.moveTo(cx - 12 * s, -14 * s);
        ctx.lineTo(cx + 4 * s, 0);
        ctx.lineTo(cx - 12 * s, 14 * s);
        ctx.stroke();
      }
      // a big arrowhead just short of the landing spot
      const s2 = big ? 1 : 0.6, ax = len - R * 0.55;
      ctx.fillStyle = `rgba(255,96,80,${0.85 + 0.15 * pulse})`;
      ctx.strokeStyle = '#fffaf0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ax - 30 * s2, -22 * s2);
      ctx.lineTo(ax + 6 * s2, 0);
      ctx.lineTo(ax - 30 * s2, 22 * s2);
      ctx.lineTo(ax - 22 * s2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // the target reticle where it will land
      glow(ctx, tx, ty, R * 1.4, R * 0.55, rgb, 0.6 + 0.3 * pulse);
      ctx.fillStyle = `rgba(255,90,70,${0.18 + 0.12 * pulse})`;
      ellipse(ctx, tx, ty + 2, R, R * 0.32);
      ctx.strokeStyle = k > 0.85 ? '#ffffff' : `rgba(255,96,80,${0.8 + 0.2 * pulse})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.lineDashOffset = -t * 30;
      ctx.beginPath();
      ctx.ellipse(tx, ty + 2, R, R * 0.32, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.ellipse(tx, ty + 2, R * 0.4, R * 0.13, 0, 0, TAU);
      ctx.stroke();
    },
  },
};
