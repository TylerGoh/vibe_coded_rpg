// Docs: docs/combat/stages.md
// Hazards of stages 3 + 4 and their dens: telegraphs and live hits (see NEW_CONTENT_SPEC.md "Hazards").
// drawHazard(ctx, h, now) is called every frame for every active hazard, in world coordinates.
// Visual language (matches dens.js): a pulsing pink-red outline/fill = "danger is coming here", then
// the bright, opaque thing = "it hurts now". Tall sweeps fill the whole height so nobody tries to jump them.
import { TAU } from './util.js';

const GROUND = 450;
const TOP = -40; // tall things start above the screen top
const WARN = '255,84,112';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (k) => 1 - (1 - k) * (1 - k);
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ---- cached gradients -----------------------------------------------------------------------------
// Radial glows are made once per colour at unit radius and drawn scaled; vertical gradients only depend
// on y, so they're cached by key (their x span doesn't matter for a vertical gradient).
const glowCache = new Map();
let gctx = null;
function glowGrad(ctx, rgb) {
  let g = glowCache.get(rgb);
  if (!g || gctx !== ctx) {
    if (gctx !== ctx) glowCache.clear();
    gctx = ctx;
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${rgb},1)`);
    g.addColorStop(0.45, `rgba(${rgb},0.45)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    glowCache.set(rgb, g);
  }
  return g;
}
function glow(ctx, x, y, rx, ry, rgb, a) {
  if (a <= 0.01 || rx < 1 || ry < 1) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, a);
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  ctx.fillStyle = glowGrad(ctx, rgb);
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, TAU);
  ctx.fill();
  ctx.restore();
}
const vCache = new Map();
function vGrad(ctx, key, y0, y1, stops) {
  const k = key + '|' + y0 + '|' + y1;
  let g = vCache.get(k);
  if (!g || gctx !== ctx) {
    if (gctx !== ctx) { glowCache.clear(); vCache.clear(); gctx = ctx; }
    g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [o, c] of stops) g.addColorStop(o, c);
    if (vCache.size > 200) vCache.clear();
    vCache.set(k, g);
  }
  return g;
}

function disc(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

// Pulsing danger chevrons pointing in dir, stacked vertically between y0 and y1.
function chevrons(ctx, x, dir, y0, y1, now, a, rgb = WARN, size = 14) {
  ctx.strokeStyle = `rgba(${rgb},${a})`;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const step = size * 3.2;
  const n = Math.max(1, Math.floor((y1 - y0) / step));
  const shift = ((now * 3) % 1) * size * 1.6;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const cy = y0 + (i + 0.5) * ((y1 - y0) / n);
    for (let j = 0; j < 3; j++) {
      const cx = x + dir * (j * size * 1.6 + shift);
      ctx.moveTo(cx - dir * size * 0.5, cy - size);
      ctx.lineTo(cx + dir * size * 0.5, cy);
      ctx.lineTo(cx - dir * size * 0.5, cy + size);
    }
  }
  ctx.stroke();
}

// A soft floor marker: dark shadow + pulsing pink outline (the "it lands here" mark from dens.js).
function floorMark(ctx, x, y, rx, pulse, k, rgb = WARN) {
  const ry = Math.max(4, rx * 0.22);
  ctx.fillStyle = `rgba(30,10,30,${0.12 + 0.2 * k})`;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(${rgb},${0.55 + 0.4 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, rx + 3, ry + 2, 0, 0, TAU);
  ctx.stroke();
}

// A flame tongue: a teardrop with its base at (x, y), height hh, leaning by lean.
function tongue(ctx, x, y, w, hh, lean) {
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.bezierCurveTo(x - w, y - hh * 0.45, x + lean - w * 0.2, y - hh * 0.7, x + lean, y - hh);
  ctx.bezierCurveTo(x + lean + w * 0.2, y - hh * 0.7, x + w, y - hh * 0.45, x + w, y);
  ctx.closePath();
  ctx.fill();
}

// A jagged lightning line from (x0,y0) to (x1,y1); seed changes ~20x/s so it crackles.
function bolt(ctx, x0, y0, x1, y1, seed, jag, segs = 6) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const off = (hash(seed + i * 7.3) - 0.5) * 2 * jag;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    ctx.lineTo(x0 + dx * t - (dy / L) * off, y0 + dy * t + (dx / L) * off);
  }
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

// ---- shots ------------------------------------------------------------------------------------------
const SHOT = {
  ember: { glow: '255,140,60', core: '#fff3b0', mid: '#ffb34d', rim: '#ff6a3d' },
  feather: { glow: '255,120,70', core: '#fff1c4', mid: '#ffa04a', rim: '#ff5a4a' },
  clock: { glow: '255,214,120', core: '#fff8dc', mid: '#ffd36b', rim: '#b98cff' },
  spark: { glow: '130,225,255', core: '#ffffff', mid: '#aef0ff', rim: '#5fc8ff' },
  water: { glow: '150,220,255', core: '#ffffff', mid: '#bfeaff', rim: '#5fb0e0' }, // the snapshrimp's
};
function drawShot(ctx, h, now) {
  const p = h.pos;
  if (!p) return;
  const st = SHOT[h.style] || SHOT.ember;
  const r = h.r || 10;
  const sp = Math.hypot(p.vx || 0, p.vy || 0) || 1;
  const ux = (p.vx || 0) / sp, uy = (p.vy || 0) / sp;
  let a = 1;
  if (h.end != null && h.end - now < 0.15) a = clamp01((h.end - now) / 0.15);
  ctx.save();
  ctx.globalAlpha = a;
  glow(ctx, p.x, p.y, r * 2.6, r * 2.6, st.glow, 0.55);
  // trail: fading blobs behind it
  const tl = Math.min(80, sp * 0.09) + r;
  ctx.fillStyle = `rgb(${st.glow})`;
  for (let i = 4; i >= 1; i--) {
    const d = (tl * i) / 4;
    ctx.globalAlpha = a * (0.75 - i * 0.15);
    disc(ctx, p.x - ux * d + Math.sin(now * 20 + i) * 1.5, p.y - uy * d, r * (1 - i * 0.17));
  }
  ctx.globalAlpha = a;
  if (h.style === 'feather') {
    const ang = Math.atan2(uy, ux);
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);
    const L = r * 2.6, W = r * 0.9;
    ctx.fillStyle = st.rim;
    ctx.beginPath();
    ctx.moveTo(L * 0.6, 0);
    ctx.quadraticCurveTo(0, -W * 1.2, -L * 0.6, -W * 0.3);
    ctx.lineTo(-L * 0.9, -W * 0.7);
    ctx.lineTo(-L * 0.75, 0);
    ctx.lineTo(-L * 0.9, W * 0.7);
    ctx.lineTo(-L * 0.6, W * 0.3);
    ctx.quadraticCurveTo(0, W * 1.2, L * 0.6, 0);
    ctx.fill();
    ctx.fillStyle = st.mid;
    ctx.beginPath();
    ctx.moveTo(L * 0.5, 0);
    ctx.quadraticCurveTo(0, -W * 0.7, -L * 0.5, 0);
    ctx.quadraticCurveTo(0, W * 0.7, L * 0.5, 0);
    ctx.fill();
    ctx.strokeStyle = st.core;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(L * 0.6, 0);
    ctx.lineTo(-L * 0.8, 0);
    ctx.stroke();
  } else if (h.style === 'clock') {
    const ang = now * 9;
    ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(185,140,255,0.35)';
    disc(ctx, 0, 0, r * 1.15);
    ctx.strokeStyle = st.rim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.15, 0, TAU);
    ctx.stroke();
    ctx.rotate(ang);
    ctx.fillStyle = st.mid;
    ctx.strokeStyle = '#8a5a20';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); // an ornate hand: arrow tip, round counterweight
    ctx.moveTo(r * 1.5, 0);
    ctx.lineTo(r * 0.6, -r * 0.42);
    ctx.lineTo(-r * 0.6, -r * 0.16);
    ctx.lineTo(-r * 0.6, r * 0.16);
    ctx.lineTo(r * 0.6, r * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    disc(ctx, -r * 0.8, 0, r * 0.32);
    ctx.fillStyle = st.core;
    disc(ctx, 0, 0, r * 0.22);
  } else if (h.style === 'water') {
    // a wobbling bubble of sea water with a shine on it
    const wob = Math.sin(now * 24) * 0.12;
    ctx.fillStyle = 'rgba(191,234,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r * (1 + wob), r * (1 - wob), Math.atan2(uy, ux), 0, TAU);
    ctx.fill();
    ctx.strokeStyle = st.rim;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = st.core;
    disc(ctx, p.x - r * 0.35, p.y - r * 0.35, r * 0.28);
  } else if (h.style === 'spark') {
    ctx.strokeStyle = st.rim;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    const seed = Math.floor(now * 24) + (h.id || 0) * 13;
    for (let i = 0; i < 4; i++) {
      const an = hash(seed + i) * TAU;
      bolt(ctx, p.x, p.y, p.x + Math.cos(an) * r * 1.8, p.y + Math.sin(an) * r * 1.8, seed + i * 3, 3, 3);
    }
    ctx.fillStyle = st.mid;
    disc(ctx, p.x, p.y, r);
    ctx.fillStyle = st.core;
    disc(ctx, p.x, p.y, r * 0.55);
  } else {
    // ember: a round fireball with a flickering flame cap streaming backwards
    ctx.fillStyle = st.rim;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(-uy, -ux) - Math.PI / 2);
    tongue(ctx, 0, 0, r * 0.95, r * 2.4 + Math.sin(now * 30) * 2, Math.sin(now * 17) * 2);
    ctx.restore();
    disc(ctx, p.x, p.y, r);
    ctx.fillStyle = st.mid;
    disc(ctx, p.x, p.y, r * 0.75);
    ctx.fillStyle = st.core;
    disc(ctx, p.x + ux * r * 0.2 - 1, p.y + uy * r * 0.2 - 1, r * 0.42);
  }
  ctx.restore();
}

// ---- puddle -----------------------------------------------------------------------------------------
// style: none = burning lava (the magma slug) · 'goo' = a sticky lilac puddle of snail gloop
function drawPuddle(ctx, h, now) {
  if (h.style === 'goo') return drawGoo(ctx, h, now);
  const start = h.warnAt ?? h.at;
  const life = (h.end ?? h.at + 5) - start;
  const age = now - start;
  const a = clamp01(age / 0.25) * clamp01(((h.end ?? h.at + 5) - now) / Math.min(1.2, life * 0.4));
  if (a <= 0) return;
  const x = h.x, y = h.y ?? GROUND, w = h.w || 60, rx = w / 2;
  const grow = 0.6 + 0.4 * easeOut(clamp01(age / 0.4));
  ctx.save();
  ctx.globalAlpha = a;
  glow(ctx, x, y - 4, rx * 1.3, 26, '255,120,50', 0.5);
  ctx.fillStyle = '#c8402e';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, rx * grow, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff8a3d';
  ctx.beginPath();
  ctx.ellipse(x, y, rx * grow * 0.86, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.15, y - 1, rx * grow * 0.45, 2.4, 0, 0, TAU);
  ctx.fill();
  // bubbles popping up and little flames licking up from it
  const seed = x * 0.37;
  for (let i = 0; i < 4; i++) {
    const ph = (now * (0.9 + hash(seed + i) * 0.6) + hash(seed + i * 3)) % 1;
    const bx = x + (hash(seed + i * 5) - 0.5) * rx * 1.4 * grow;
    const fh = (6 + 10 * hash(seed + i * 9)) * Math.sin(ph * Math.PI);
    ctx.fillStyle = 'rgba(255,140,60,0.85)';
    tongue(ctx, bx, y, 4, fh, Math.sin(now * 6 + i) * 2);
    ctx.fillStyle = 'rgba(255,230,140,0.9)';
    disc(ctx, bx + 6, y - 2 - ph * 6, 2.2 * (1 - ph) + 0.5);
  }
  ctx.restore();
}

function drawGoo(ctx, h, now) {
  const start = h.warnAt ?? h.at, end = h.end ?? h.at + 5, age = now - start;
  const a = clamp01(age / 0.25) * clamp01((end - now) / Math.min(1.2, (end - start) * 0.4));
  if (a <= 0) return;
  const x = h.x, y = h.y ?? GROUND, rx = (h.w || 60) / 2, grow = 0.6 + 0.4 * easeOut(clamp01(age / 0.4));
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#9a7ac8';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, rx * grow, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c8b0e8';
  ctx.beginPath();
  ctx.ellipse(x, y, rx * grow * 0.86, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.25, y - 1, rx * grow * 0.3, 1.8, 0, 0, TAU);
  ctx.fill();
  // slow sticky bubbles
  const seed = x * 0.37;
  for (let i = 0; i < 3; i++) {
    const ph = (now * (0.5 + hash(seed + i) * 0.4) + hash(seed + i * 3)) % 1;
    ctx.fillStyle = `rgba(230,215,250,${0.9 * Math.sin(ph * Math.PI)})`;
    disc(ctx, x + (hash(seed + i * 5) - 0.5) * rx * 1.3 * grow, y - 2 - ph * 5, 2.4 + ph * 1.6);
  }
  ctx.restore();
}

// ---- geyser -----------------------------------------------------------------------------------------
function drawGeyser(ctx, h, now) {
  const x = h.x, r = h.r || 30, top = h.top ?? 200;
  const liveEnd = h.at + (h.dur ?? 1);
  const end = h.end ?? liveEnd + 0.3;
  if (now < h.at) {
    const k = clamp01((now - h.warnAt) / Math.max(0.05, h.at - h.warnAt));
    const pulse = 0.5 + 0.5 * Math.sin(now * (8 + 14 * k));
    // the column it will become, as a faint pulsing ghost, so you can see how high it reaches
    ctx.fillStyle = `rgba(${WARN},${(0.08 + 0.14 * k) * (0.6 + 0.4 * pulse)})`;
    ctx.fillRect(x - r, top, r * 2, GROUND - top);
    ctx.strokeStyle = `rgba(${WARN},${0.25 + 0.4 * k})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = now * 40;
    ctx.beginPath();
    ctx.moveTo(x - r, GROUND);
    ctx.lineTo(x - r, top + 10);
    ctx.quadraticCurveTo(x - r, top, x, top);
    ctx.quadraticCurveTo(x + r, top, x + r, top + 10);
    ctx.lineTo(x + r, GROUND);
    ctx.stroke();
    ctx.setLineDash([]);
    // the glowing, cracking spot
    glow(ctx, x, GROUND, r * 1.6, 22 + 14 * k, '255,120,50', 0.5 + 0.4 * pulse);
    floorMark(ctx, x, GROUND, r, pulse, k);
    ctx.strokeStyle = `rgba(255,200,90,${0.5 + 0.5 * k})`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const an = Math.PI * (0.1 + 0.8 * (i / 4));
      const L = r * (0.4 + 0.7 * k) * (0.7 + 0.3 * hash(x + i));
      ctx.moveTo(x, GROUND + 1);
      ctx.lineTo(x + Math.cos(an) * L, GROUND + 1 + Math.sin(an) * 3 - 1);
    }
    ctx.stroke();
    // bubbles
    ctx.fillStyle = 'rgba(255,170,80,0.9)';
    for (let i = 0; i < 3; i++) {
      const ph = (now * 2.2 + i / 3) % 1;
      disc(ctx, x + (hash(x + i * 4) - 0.5) * r, GROUND - ph * 18 * k, 3 * (1 - ph) + 1);
    }
    return;
  }
  // live column (shrinking back into the ground during the fade)
  const f = now > liveEnd ? clamp01((now - liveEnd) / Math.max(0.05, end - liveEnd)) : 0;
  const rise = easeOut(clamp01((now - h.at) / 0.12));
  const ty = GROUND - (GROUND - top) * rise * (1 - f);
  const a = 1 - f * 0.6;
  ctx.save();
  ctx.globalAlpha = a;
  glow(ctx, x, (ty + GROUND) / 2, r * 2.4, (GROUND - ty) * 0.7 + 30, '255,120,50', 0.55);
  ctx.fillStyle = vGrad(ctx, 'gey', top, GROUND, [[0, '#ffd36b'], [0.35, '#ff9a3d'], [1, '#e8482e']]);
  ctx.beginPath();
  const wob = Math.sin(now * 18) * 3;
  ctx.moveTo(x - r * 0.95, GROUND);
  ctx.bezierCurveTo(x - r * 0.7 - wob, (ty + GROUND) * 0.5, x - r * 0.9 + wob, ty + 20, x - r * 0.75, ty + 8);
  ctx.lineTo(x + r * 0.75, ty + 8);
  ctx.bezierCurveTo(x + r * 0.9 - wob, ty + 20, x + r * 0.7 + wob, (ty + GROUND) * 0.5, x + r * 0.95, GROUND);
  ctx.closePath();
  ctx.fill();
  // bright inner core
  ctx.fillStyle = 'rgba(255,245,190,0.75)';
  ctx.beginPath();
  ctx.ellipse(x + wob * 0.3, (ty + GROUND) / 2 + 6, r * 0.28, (GROUND - ty) / 2 - 4, 0, 0, TAU);
  ctx.fill();
  // round splashy head
  ctx.fillStyle = '#ffb347';
  for (let i = -2; i <= 2; i++) {
    const bob = Math.sin(now * 14 + i * 1.7) * 4;
    disc(ctx, x + i * r * 0.42, ty + 8 + Math.abs(i) * 4 + bob, r * (0.55 - Math.abs(i) * 0.08));
  }
  ctx.fillStyle = '#ffe9a0';
  disc(ctx, x - r * 0.2, ty + 4, r * 0.3);
  // droplets thrown off the top
  ctx.fillStyle = '#ff9a3d';
  for (let i = 0; i < 5; i++) {
    const ph = (now * 1.8 + i / 5) % 1;
    const s = i % 2 ? 1 : -1;
    disc(ctx, x + s * (r * 0.6 + ph * r * 1.4), ty + 6 - Math.sin(ph * Math.PI) * 26 + ph * 30, 4 * (1 - ph) + 1);
  }
  // splash ring at the base
  ctx.fillStyle = '#ff7a3a';
  ctx.beginPath();
  ctx.ellipse(x, GROUND + 1, r * 1.3, 6, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---- sweeps -----------------------------------------------------------------------------------------
// The body of a sweep trails behind its front edge (h.front), so the danger is clearly where it's heading.
const SWEEP_BODY = { flame: 54, gear: 0, ring: 30, laser: 34, void: 110 };

function drawSweepWarn(ctx, h, now) {
  const k = clamp01((now - h.warnAt) / Math.max(0.05, h.at - h.warnAt));
  const pulse = 0.5 + 0.5 * Math.sin(now * (7 + 12 * k));
  const tall = h.tall || h.style === 'laser' || h.style === 'void';
  const x0 = h.x0, dir = h.dir || 1;
  const hh = tall ? GROUND - TOP : Math.max(30, h.h || 40) + 14;
  const y0 = GROUND - hh;
  const body = tall ? 70 : Math.max(40, h.h || 40);
  // where it starts: a pulsing danger block
  ctx.fillStyle = tall
    ? vGrad(ctx, 'swt', TOP, GROUND, [[0, `rgba(${WARN},0.05)`], [1, `rgba(${WARN},0.4)`]])
    : `rgba(${WARN},0.22)`;
  ctx.globalAlpha = (0.45 + 0.55 * k) * (0.6 + 0.4 * pulse);
  ctx.fillRect(dir > 0 ? x0 - body : x0, y0, body, hh);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = `rgba(${WARN},${0.6 + 0.4 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0, GROUND);
  ctx.stroke();
  // chevrons marching the way it will go, and a dashed floor streak along its path
  chevrons(ctx, x0 + dir * 22, dir, tall ? 40 : y0, GROUND - 4, now, 0.45 + 0.5 * pulse, WARN, tall ? 16 : Math.min(12, hh / 3));
  ctx.strokeStyle = `rgba(${WARN},${0.25 + 0.35 * k})`;
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 12]);
  ctx.lineDashOffset = -dir * now * 120;
  ctx.beginPath();
  ctx.moveTo(x0, GROUND + 4);
  ctx.lineTo(x0 + dir * (200 + 500 * k), GROUND + 4);
  ctx.stroke();
  ctx.setLineDash([]);
  // a ghost of the thing itself
  ctx.globalAlpha = 0.18 + 0.35 * k;
  sweepBody(ctx, h, now, x0, 1, true);
  ctx.globalAlpha = 1;
}

function sweepBody(ctx, h, now, fx, a, ghost) {
  const dir = h.dir || 1, style = h.style;
  if (style === 'gear') return gearBody(ctx, h, now, fx, dir);
  if (style === 'laser') return laserBody(ctx, h, now, fx, dir, ghost);
  if (style === 'void') return voidBody(ctx, h, now, fx, dir, ghost);
  if (style === 'ring') return ringBody(ctx, h, now, fx, dir);
  return flameBody(ctx, h, now, fx, dir);
}

function flameBody(ctx, h, now, fx, dir) {
  const hh = h.h || 50, L = SWEEP_BODY.flame;
  glow(ctx, fx - dir * L * 0.5, GROUND - hh * 0.4, L * 1.3, hh * 0.9, '255,120,50', 0.6);
  ctx.fillStyle = '#ff7a3a';
  ctx.beginPath();
  ctx.ellipse(fx - dir * L * 0.5, GROUND + 1, L * 0.62, 6, 0, 0, TAU);
  ctx.fill();
  const layers = [['#ff5a3d', 1], ['#ff9a3d', 0.72], ['#ffd36b', 0.42]];
  for (const [c, s] of layers) {
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const bx = fx - dir * (6 + t * (L - 10));
      const shape = 1 - Math.abs(t - 0.3) * 0.9;
      const fl = hh * s * (0.7 + 0.3 * shape) * (0.85 + 0.15 * Math.sin(now * 19 + i * 2.1));
      tongue(ctx, bx, GROUND + 2, 14 * (0.6 + 0.4 * s), fl, -dir * 6 + Math.sin(now * 11 + i) * 3);
    }
  }
  // embers flying back off it
  ctx.fillStyle = '#ffd36b';
  for (let i = 0; i < 4; i++) {
    const ph = (now * 1.5 + i / 4) % 1;
    disc(ctx, fx - dir * (L * 0.4 + ph * 60), GROUND - hh * (0.4 + ph * 0.8), 2.5 * (1 - ph) + 0.6);
  }
}

function ringBody(ctx, h, now, fx, dir) {
  const hh = h.h || 40;
  // the floor already scorched behind it, and an edge-on ring of fire rolling along
  const cx = fx - dir * 14;
  glow(ctx, cx, GROUND - hh * 0.5, 50, hh * 0.9, '255,110,60', 0.6);
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#ff6a3d';
  ctx.beginPath();
  ctx.ellipse(cx, GROUND - hh / 2, 13, hh / 2, 0, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffd36b';
  ctx.beginPath();
  ctx.ellipse(cx, GROUND - hh / 2, 13, hh / 2, 0, 0, TAU);
  ctx.stroke();
  // flames dancing on the rim
  ctx.fillStyle = '#ff9a3d';
  for (let i = 0; i < 5; i++) {
    const an = -Math.PI / 2 + (i - 2) * 0.55 + Math.sin(now * 6) * 0.1;
    const px = cx + Math.cos(an) * 13, py = GROUND - hh / 2 + Math.sin(an) * (hh / 2);
    tongue(ctx, px, py, 4, 10 + 5 * Math.sin(now * 20 + i * 1.9), -dir * 3);
  }
  // scorch glow on the floor under it
  ctx.fillStyle = 'rgba(255,150,70,0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - dir * 10, GROUND + 1, 30, 4, 0, 0, TAU);
  ctx.fill();
}

function gearBody(ctx, h, now, fx, dir) {
  const R = (h.h || 80) / 2;
  const cx = fx - dir * R, cy = GROUND - R;
  const travelled = (fx - h.x0) * dir;
  const ang = (dir * travelled) / R;
  // speed lines
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const yy = cy - R * 0.5 + i * R * 0.5;
    ctx.moveTo(cx - dir * (R + 8), yy);
    ctx.lineTo(cx - dir * (R + 30 + i * 8), yy);
  }
  ctx.stroke();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  const teeth = 10, inner = R * 0.82;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * TAU, a1 = a0 + TAU / teeth;
    ctx.lineTo(Math.cos(a0) * inner, Math.sin(a0) * inner);
    ctx.lineTo(Math.cos(a0 + 0.12) * R, Math.sin(a0 + 0.12) * R);
    ctx.lineTo(Math.cos(a1 - 0.2) * R, Math.sin(a1 - 0.2) * R);
    ctx.lineTo(Math.cos(a1 - 0.08) * inner, Math.sin(a1 - 0.08) * inner);
  }
  ctx.closePath();
  ctx.fillStyle = '#e6b45a';
  ctx.fill();
  ctx.strokeStyle = '#8a5a28';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = '#f4d38a';
  disc(ctx, 0, 0, inner * 0.78);
  // spokes / holes
  ctx.fillStyle = '#b5803c';
  for (let i = 0; i < 5; i++) {
    const a0 = (i / 5) * TAU;
    disc(ctx, Math.cos(a0) * inner * 0.48, Math.sin(a0) * inner * 0.48, inner * 0.14);
  }
  ctx.fillStyle = '#8a5a28';
  disc(ctx, 0, 0, inner * 0.2);
  ctx.fillStyle = '#ffeec4';
  disc(ctx, -inner * 0.06, -inner * 0.06, inner * 0.08);
  ctx.restore();
  // a soft highlight that doesn't spin
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx - R * 0.3, cy - R * 0.4, R * 0.28, R * 0.12, -0.6, 0, TAU);
  ctx.fill();
  // sparks where it grinds the floor
  ctx.strokeStyle = '#fff3a0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const ph = (now * 4 + i / 4) % 1;
    const sx = cx - dir * (4 + ph * 34), sy = GROUND - ph * 18 * (0.5 + hash(i));
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - dir * 5, sy - 3);
  }
  ctx.stroke();
}

function laserBody(ctx, h, now, fx, dir, ghost) {
  const cx = fx - dir * SWEEP_BODY.laser * 0.5;
  const fl = ghost ? 1 : 0.85 + 0.15 * Math.sin(now * 50);
  glow(ctx, cx, GROUND - 200, 70 * fl, 360, '255,90,150', 0.55);
  ctx.fillStyle = vGrad(ctx, 'las', TOP, GROUND, [[0, 'rgba(255,120,190,0.75)'], [1, 'rgba(255,80,120,0.95)']]);
  ctx.fillRect(cx - 17 * fl, TOP, 34 * fl, GROUND - TOP);
  ctx.fillStyle = 'rgba(255,220,240,0.95)';
  ctx.fillRect(cx - 8 * fl, TOP, 16 * fl, GROUND - TOP);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 3, TOP, 6, GROUND - TOP);
  // energy rings sliding along it
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const yy = TOP + (((now * 380 + i * 90) % (GROUND - TOP)));
    ctx.moveTo(cx - 22, yy);
    ctx.quadraticCurveTo(cx, yy + 8, cx + 22, yy);
  }
  ctx.stroke();
  // the hot spot on the floor
  glow(ctx, cx, GROUND, 60, 18, '255,200,220', 0.9);
  ctx.fillStyle = '#ffd0e4';
  ctx.beginPath();
  ctx.ellipse(cx, GROUND + 1, 26, 6, 0, 0, TAU);
  ctx.fill();
}

function voidBody(ctx, h, now, fx, dir, ghost) {
  const L = SWEEP_BODY.void;
  const back = fx - dir * L;
  // a soft tail of fading void behind the wall
  for (let i = 1; i <= 6; i++) {
    ctx.fillStyle = `rgba(70,36,130,${0.3 - i * 0.045})`;
    ctx.fillRect(dir > 0 ? back - i * 15 : back + (i - 1) * 15, TOP, 15, GROUND + 4 - TOP);
  }
  // a solid wall of starry violet void, its leading edge rippling with time distortion
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(back, TOP);
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const yy = TOP + ((GROUND + 4 - TOP) * i) / steps;
    const wv = Math.sin(now * 5 + i * 0.9) * 10 + Math.sin(now * 9 + i * 2.3) * 4;
    ctx.lineTo(fx + dir * wv, yy);
  }
  ctx.lineTo(back, GROUND + 4);
  ctx.closePath();
  ctx.fillStyle = vGrad(ctx, 'void', TOP, GROUND, [[0, '#2a1650'], [0.6, '#3e2178'], [1, '#5a2e94']]);
  ctx.fill();
  ctx.clip();
  // stars and drifting clock hands inside
  ctx.fillStyle = '#e8dcff';
  for (let i = 0; i < 14; i++) {
    const sx = back + dir * hash(i * 3.1) * L;
    const sy = TOP + ((hash(i * 7.7) * (GROUND - TOP) + now * (20 + 30 * hash(i))) % (GROUND - TOP));
    const tw = 0.5 + 0.5 * Math.sin(now * 4 + i);
    disc(ctx, sx, sy, 1 + tw * 1.8);
  }
  ctx.strokeStyle = 'rgba(255,220,130,0.85)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const hx = back + dir * L * (0.3 + 0.2 * i), hy = 80 + i * 130;
    const an = now * (1.5 + i) * (i % 2 ? -1 : 1);
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + Math.cos(an) * 22, hy + Math.sin(an) * 22);
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + Math.cos(an * 0.3) * 14, hy + Math.sin(an * 0.3) * 14);
  }
  ctx.stroke();
  ctx.restore();
  // glowing rim on the leading edge
  ctx.strokeStyle = ghost ? 'rgba(220,180,255,0.8)' : '#d8b8ff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const yy = TOP + ((GROUND + 4 - TOP) * i) / steps;
    const wv = Math.sin(now * 5 + i * 0.9) * 10 + Math.sin(now * 9 + i * 2.3) * 4;
    i ? ctx.lineTo(fx + dir * wv, yy) : ctx.moveTo(fx + dir * wv, yy);
  }
  ctx.stroke();
  glow(ctx, fx, GROUND - 200, 60, 340, '190,140,255', 0.5);
}

function drawSweep(ctx, h, now) {
  if (now < h.at) return drawSweepWarn(ctx, h, now);
  const fx = h.front ?? h.x0;
  let a = 1;
  if (h.end != null && h.end - now < 0.25) a = clamp01((h.end - now) / 0.25);
  // a soft scorch on the floor behind it (low sweeps only, it reads where it's been)
  ctx.save();
  ctx.globalAlpha = a;
  sweepBody(ctx, h, now, fx, a, false);
  ctx.restore();
}

// ---- beams ------------------------------------------------------------------------------------------
const BEAM = {
  sentry: { glow: '120,220,255', outer: 'rgba(120,220,255,0.85)', mid: '#c8f4ff', aim: '255,90,120' },
  colossus: { glow: '255,110,70', outer: 'rgba(255,110,70,0.9)', mid: '#ffd7a8', aim: '255,80,90' },
};
function drawBeam(ctx, h, now) {
  const B = BEAM[h.style] || BEAM.sentry;
  const dir = h.dir || 1, len = h.len || 600;
  const y0 = Math.min(h.y0, h.y1), y1 = Math.max(h.y0, h.y1);
  const ym = (y0 + y1) / 2, bw = y1 - y0;
  const xa = dir > 0 ? h.x : h.x - len;
  const xEnd = h.x + dir * len;
  if (now < h.at) {
    const k = clamp01((now - h.warnAt) / Math.max(0.05, h.at - h.warnAt));
    const flick = Math.sin(now * 60) > -0.3 ? 1 : 0.35;
    const pulse = 0.5 + 0.5 * Math.sin(now * (9 + 14 * k));
    // the band, faintly filling as it charges
    ctx.fillStyle = `rgba(${B.aim},${(0.06 + 0.18 * k) * (0.6 + 0.4 * pulse)})`;
    ctx.fillRect(xa, y0, len, bw);
    ctx.strokeStyle = `rgba(${B.aim},${0.3 + 0.4 * k})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = -dir * now * 80;
    ctx.beginPath();
    ctx.moveTo(xa, y0); ctx.lineTo(xa + len, y0);
    ctx.moveTo(xa, y1); ctx.lineTo(xa + len, y1);
    ctx.stroke();
    ctx.setLineDash([]);
    // thin flickering aim line
    ctx.strokeStyle = `rgba(${B.aim},${(0.5 + 0.5 * k) * flick})`;
    ctx.lineWidth = 1.5 + 2 * k;
    ctx.beginPath();
    ctx.moveTo(h.x, ym);
    ctx.lineTo(xEnd, ym);
    ctx.stroke();
    // charging spark at the muzzle
    glow(ctx, h.x, ym, 14 + 26 * k, 14 + 26 * k, B.glow, 0.5 + 0.5 * pulse);
    ctx.fillStyle = '#ffffff';
    disc(ctx, h.x, ym, 2 + 5 * k);
    return;
  }
  const liveEnd = h.at + (h.dur ?? 0.6);
  const end = h.end ?? liveEnd + 0.2;
  if (now > end) return;
  const f = now > liveEnd ? clamp01((now - liveEnd) / Math.max(0.05, end - liveEnd)) : 0;
  const open = easeOut(clamp01((now - h.at) / 0.08));
  const th = bw * open * (1 - f) * (0.92 + 0.08 * Math.sin(now * 45));
  const thick = Math.max(th, 2);
  ctx.save();
  glow(ctx, (h.x + xEnd) / 2, ym, len * 0.6, bw * 1.6 + 10, B.glow, 0.5 * (1 - f));
  ctx.fillStyle = B.outer;
  ctx.beginPath();
  ctx.roundRect(xa, ym - thick / 2, len, thick, thick / 2);
  ctx.fill();
  ctx.fillStyle = B.mid;
  ctx.beginPath();
  ctx.roundRect(xa, ym - thick * 0.3, len, thick * 0.6, thick * 0.3);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(xa, ym - thick * 0.1, len, Math.max(1, thick * 0.2));
  // ripples streaming out along it
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const px = h.x + dir * ((now * 900 + i * (len / 5)) % len);
    ctx.moveTo(px, ym - thick * 0.45);
    ctx.quadraticCurveTo(px + dir * 6, ym, px, ym + thick * 0.45);
  }
  ctx.stroke();
  // muzzle flare and the impact splash at the end
  glow(ctx, h.x, ym, thick * 0.9 + 12, thick * 0.9 + 12, '255,255,255', 0.85 * (1 - f));
  glow(ctx, xEnd, ym, thick * 0.8 + 10, thick * 0.8 + 10, B.glow, 0.8 * (1 - f));
  ctx.restore();
}

// ---- grid -------------------------------------------------------------------------------------------
const GRID = {
  volt: { rgb: '255,210,60', bolt: '#fffbe0', rim: '#3fb6ff', fill: '255,196,40', edge: '#ffb020' },
  chrono: { rgb: '190,140,255', bolt: '#fff4d6', rim: '#ffc94a', fill: '150,100,240', edge: '#c9a4ff' },
};
const STRIP = 30; // the floor strip of a low grid zap
function drawGrid(ctx, h, now) {
  const G = GRID[h.style] || GRID.volt;
  const tw = h.tw || 150, tiles = h.tiles || [];
  const y0 = h.tall ? TOP : GROUND - STRIP;
  const hh = GROUND + 4 - y0;
  if (now < h.at) {
    const k = clamp01((now - h.warnAt) / Math.max(0.05, h.at - h.warnAt));
    const pulse = 0.5 + 0.5 * Math.sin(now * (8 + 16 * k));
    for (const i of tiles) {
      const x = i * tw;
      ctx.fillStyle = h.tall
        ? vGrad(ctx, 'gw' + h.style, TOP, GROUND, [[0, `rgba(${WARN},0.02)`], [1, `rgba(${WARN},0.38)`]])
        : `rgba(${WARN},0.3)`;
      ctx.globalAlpha = (0.4 + 0.6 * k) * (0.55 + 0.45 * pulse);
      ctx.fillRect(x + 3, y0, tw - 6, hh);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(${WARN},${0.55 + 0.45 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x + 4, h.tall ? y0 : GROUND - STRIP, tw - 8, h.tall ? hh : STRIP + 4, 8);
      ctx.stroke();
      // little sparks starting to crawl over the floor
      if (k > 0.3) {
        ctx.strokeStyle = `rgba(${G.rgb},${(k - 0.3) * 1.2})`;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const seed = Math.floor(now * 14) * 11 + i * 37;
        const sx = x + 20 + hash(seed) * (tw - 40);
        bolt(ctx, sx - 16, GROUND - 2, sx + 16, GROUND - 2 - hash(seed + 1) * 10, seed, 5, 4);
      }
    }
    return;
  }
  const liveEnd = h.at + (h.dur ?? 0.6);
  const end = h.end ?? liveEnd + 0.2;
  if (now > end) return;
  const f = now > liveEnd ? clamp01((now - liveEnd) / Math.max(0.05, end - liveEnd)) : 0;
  const a = 1 - f;
  const seed0 = Math.floor(now * 22);
  for (const i of tiles) {
    const x = i * tw, cx = x + tw / 2;
    ctx.fillStyle = h.tall
      ? vGrad(ctx, 'gl' + h.style, TOP, GROUND, [[0, `rgba(${G.fill},0.45)`], [1, `rgba(${G.fill},0.85)`]])
      : `rgba(${G.fill},0.85)`;
    ctx.globalAlpha = a * (0.8 + 0.2 * Math.sin(now * 40 + i));
    ctx.fillRect(x + 2, y0, tw - 4, hh);
    ctx.globalAlpha = a;
    ctx.fillStyle = G.edge;
    ctx.fillRect(x + 2, y0, 4, hh);
    ctx.fillRect(x + tw - 6, y0, 4, hh);
    glow(ctx, cx, GROUND - (h.tall ? 200 : 8), tw * 0.8, h.tall ? 300 : 40, G.rgb, 0.6);
    // crackling bolts
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const nb = h.tall ? 3 : 2;
    for (let b = 0; b < nb; b++) {
      const sd = seed0 * 7 + i * 31 + b * 13;
      ctx.strokeStyle = G.rim;
      ctx.lineWidth = 5;
      if (h.tall) {
        const bx = x + 20 + hash(sd) * (tw - 40);
        bolt(ctx, bx, y0, bx + (hash(sd + 2) - 0.5) * 50, GROUND, sd, 18, 8);
        ctx.strokeStyle = G.bolt;
        ctx.lineWidth = 2;
        bolt(ctx, bx, y0, bx + (hash(sd + 2) - 0.5) * 50, GROUND, sd, 18, 8);
      } else {
        const yy = GROUND - 6 - hash(sd + 3) * (STRIP - 12);
        bolt(ctx, x + 6, yy, x + tw - 6, GROUND - 6 - hash(sd + 4) * (STRIP - 12), sd, 9, 7);
        ctx.strokeStyle = G.bolt;
        ctx.lineWidth = 2;
        bolt(ctx, x + 6, yy, x + tw - 6, GROUND - 6 - hash(sd + 4) * (STRIP - 12), sd, 9, 7);
      }
    }
    // bright top edge of the strip so the safe height is obvious
    if (!h.tall) {
      ctx.fillStyle = G.bolt;
      ctx.fillRect(x + 2, y0 - 1, tw - 4, 2.5);
    }
    ctx.globalAlpha = 1;
  }
}

// ---- bomb -------------------------------------------------------------------------------------------
function drawBomb(ctx, h, now) {
  if (now >= h.at) return; // the boom itself is the bombBoom effect
  const p = h.follow && h.follow();
  if (!p) return;
  const r = h.r || 90;
  const x = p.x, y = p.y - 18;
  const span = Math.max(0.05, h.at - h.warnAt);
  const k = clamp01((now - h.warnAt) / span);
  const left = h.at - now;
  const hot = left < 0.5;
  const flash = hot ? (Math.sin(now * 40) > 0 ? 1 : 0.4) : 0;
  const rgb = hot ? '255,70,90' : '255,190,110';
  ctx.save();
  // the danger area
  ctx.fillStyle = `rgba(${hot ? '255,70,90' : WARN},${0.1 + 0.15 * k + 0.2 * flash})`;
  disc(ctx, x, y, r);
  // countdown sweep (a filled pie that grows as time runs out)
  ctx.fillStyle = `rgba(${rgb},${0.2 + 0.15 * flash})`;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + k * TAU);
  ctx.closePath();
  ctx.fill();
  // clock rim with hour ticks
  ctx.strokeStyle = hot ? `rgba(255,90,110,${0.7 + 0.3 * flash})` : 'rgba(255,214,120,0.95)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU;
    const r0 = i % 3 ? r - 8 : r - 14;
    ctx.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0);
    ctx.lineTo(x + Math.cos(an) * (r - 2), y + Math.sin(an) * (r - 2));
  }
  ctx.stroke();
  // the hand sweeping round once
  const an = -Math.PI / 2 + k * TAU;
  ctx.strokeStyle = '#fff4d6';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(an) * (r - 18), y + Math.sin(an) * (r - 18));
  ctx.stroke();
  // a little clock bomb icon bobbing over the marked slime
  const by = y - 54 - Math.abs(Math.sin(now * (hot ? 14 : 6))) * 5;
  const s = 1 + 0.15 * flash;
  ctx.fillStyle = hot ? '#ff5a6e' : '#ffd36b';
  ctx.strokeStyle = '#7a4a28';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, by, 13 * s, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a4a28';
  ctx.fillRect(x - 4, by - 13 * s - 6, 8, 5);
  ctx.strokeStyle = '#7a4a28';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, by);
  ctx.lineTo(x + Math.cos(an) * 8, by + Math.sin(an) * 8);
  ctx.moveTo(x, by);
  ctx.lineTo(x, by - 6);
  ctx.stroke();
  ctx.restore();
}

// ---- slash ------------------------------------------------------------------------------------------
function drawSlash(ctx, h, now) {
  const x = h.x, y = h.y ?? GROUND, r = h.r || 100;
  if (now < h.at) {
    const k = clamp01((now - h.warnAt) / Math.max(0.05, h.at - h.warnAt));
    const pulse = 0.5 + 0.5 * Math.sin(now * (9 + 16 * k));
    // the dome it covers
    ctx.fillStyle = `rgba(${WARN},${(0.1 + 0.22 * k) * (0.6 + 0.4 * pulse)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, TAU);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(${WARN},${0.55 + 0.45 * pulse})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.lineDashOffset = now * 50;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    // a crystal glint sweeping across the dome, faster as it nears
    const an = Math.PI + ((now * (2 + 4 * k)) % 1) * Math.PI;
    ctx.fillStyle = 'rgba(200,240,255,0.9)';
    disc(ctx, x + Math.cos(an) * r, y + Math.sin(an) * r, 3 + 3 * k);
    floorMark(ctx, x, y, r, pulse, k);
    return;
  }
  const end = h.end ?? h.at + 0.3;
  if (now > end) return;
  const f = clamp01((now - h.at) / Math.max(0.05, end - h.at));
  const a = 1 - f;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(120,200,255,0.4)';
  ctx.beginPath();
  ctx.arc(x, y, r * (0.9 + 0.1 * f), Math.PI, TAU);
  ctx.closePath();
  ctx.fill();
  // bright crescent
  ctx.fillStyle = '#e6f8ff';
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, TAU);
  ctx.arc(x, y + 4, r - 16 * (1 - f) - 4, TAU, Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3f9be8';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, TAU);
  ctx.stroke();
  // crystal glints flung off the edge
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) {
    const an = Math.PI * (1.1 + 0.2 * i), d = r + 6 + 22 * f;
    disc(ctx, x + Math.cos(an) * d, y + Math.sin(an) * d, 3.5 * (1 - f) + 1);
  }
  ctx.restore();
}

// ---- pulse ------------------------------------------------------------------------------------------
function drawPulse(ctx, h, now) {
  const x = h.x, y = h.y, r = h.r || 120;
  if (now < h.at) {
    const k = clamp01((now - h.warnAt) / Math.max(0.05, h.at - h.warnAt));
    const pulse = 0.5 + 0.5 * Math.sin(now * (8 + 14 * k));
    ctx.fillStyle = `rgba(${WARN},${(0.08 + 0.2 * k) * (0.6 + 0.4 * pulse)})`;
    disc(ctx, x, y, r);
    ctx.strokeStyle = `rgba(${WARN},${0.55 + 0.45 * pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
    // ripples drawn inward (time being gathered)
    ctx.strokeStyle = `rgba(200,160,255,${0.3 + 0.5 * k})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 2; i++) {
      const ph = 1 - ((now * (1 + 2 * k) + i / 2) % 1);
      ctx.moveTo(x + r * ph, y);
      ctx.arc(x, y, r * ph, 0, TAU);
    }
    ctx.stroke();
    return;
  }
  const end = h.end ?? h.at + 0.3;
  if (now > end) return;
  const f = clamp01((now - h.at) / Math.max(0.05, end - h.at));
  const a = 1 - f;
  glow(ctx, x, y, r * 1.1, r * 1.1, '190,140,255', 0.7 * a);
  ctx.fillStyle = `rgba(170,120,255,${0.3 * a})`;
  disc(ctx, x, y, r * (0.85 + 0.15 * f));
  ctx.strokeStyle = `rgba(150,96,240,${a})`;
  ctx.lineWidth = 12 * a + 3;
  ctx.beginPath();
  ctx.arc(x, y, r * (0.85 + 0.15 * f), 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,250,255,${a})`;
  ctx.lineWidth = 4 * a + 1;
  ctx.stroke();
}

// ---- entry ------------------------------------------------------------------------------------------
const DRAW = {
  shot: drawShot,
  puddle: drawPuddle,
  geyser: drawGeyser,
  sweep: drawSweep,
  beam: drawBeam,
  grid: drawGrid,
  bomb: drawBomb,
  slash: drawSlash,
  pulse: drawPulse,
};

export function drawHazard(ctx, h, now) {
  if (!h) return;
  const fn = DRAW[h.type];
  if (!fn) return;
  if (h.warnAt != null && now < h.warnAt) return;
  if (h.end != null && now > h.end) return;
  ctx.save();
  fn(ctx, h, now);
  ctx.restore();
}
