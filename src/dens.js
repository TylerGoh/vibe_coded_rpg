// Docs: docs/combat/bosses.md
// Boss dens: the three arena rooms behind the cave mouths in the Wildwood (data in src/shared/rpg.js),
// their entrances in the field, the bosses themselves, their attack effects and the boss HP bar.
// Everything here only draws. Same soft, rounded, pastel style as src/field.js (whose look this
// matches; it is deliberately not imported, so the two files can change independently).
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, DENS, MOBS, FIELD_GROUND, SAFE_R, denAt } from './shared/rpg.js';
import { DEN_ART as CALDERA_DENS, ENTRANCE_ART as CALDERA_ENTRANCES, BOSS_ART as CALDERA_BOSSES, FX2 as CALDERA_FX } from './dens-caldera.js';
import { DEN_ART as CITADEL_DENS, ENTRANCE_ART as CITADEL_ENTRANCES, BOSS_ART as CITADEL_BOSSES, FX2 as CITADEL_FX } from './dens-citadel.js';
import { DEN_ART as COVES_DENS, ENTRANCE_ART as COVES_ENTRANCES, BOSS_ART as COVES_BOSSES } from './dens-coves.js';
import { DEN_ART as DEEP_DENS, ENTRANCE_ART as DEEP_ENTRANCES, BOSS_ART as DEEP_BOSSES } from './dens-deep.js';
import { DEN_ART as SPINE_DENS, ENTRANCE_ART as SPINE_ENTRANCES, BOSS_ART as SPINE_BOSSES, wardenRoot } from './dens-spine.js';
import { DEN_ART as SKERRIES_DENS, ENTRANCE_ART as SKERRIES_ENTRANCES, BOSS_ART as SKERRIES_BOSSES } from './dens-skerries.js';
import { DEN_ART as QBRIDGE_DENS, ENTRANCE_ART as QBRIDGE_ENTRANCES, BOSS_ART as QBRIDGE_BOSSES } from './dens-qbridge.js';
import { DEN_ART as LADON_DENS, BOSS_ART as LADON_BOSSES, FX2 as LADON_FX } from './dens-ladon.js';
import { DEN_ART as FENRIR_DENS, BOSS_ART as FENRIR_BOSSES, FX2 as FENRIR_FX } from './dens-fenrir.js';
import { DEN_ART as HATCH_DENS, ENTRANCE_ART as HATCH_ENTRANCES, BOSS_ART as HATCH_BOSSES, ULT_LOOKS as HATCH_ULT_LOOKS, HATCH_FREED_S, drawHatchFreed } from './dens-hatch.js';
import { DEN_ART as HOIST_DENS, ENTRANCE_ART as HOIST_ENTRANCES, BOSS_ART as HOIST_BOSSES, ULT_LOOKS as HOIST_ULT_LOOKS, BRENNA_FREED_S, drawBrennaFreed } from './dens-rim.js';
import { glow as radialGlow } from './glow.js';
// the third and fourth stages' dens, bosses and boss effects live in their own files (same contracts as here)
const DEN_ART = { ...CALDERA_DENS, ...CITADEL_DENS, ...COVES_DENS, ...DEEP_DENS, ...SPINE_DENS, ...SKERRIES_DENS, ...QBRIDGE_DENS, ...LADON_DENS, ...FENRIR_DENS, ...HATCH_DENS, ...HOIST_DENS };
const ENTRANCE_ART = { ...CALDERA_ENTRANCES, ...CITADEL_ENTRANCES, ...COVES_ENTRANCES, ...DEEP_ENTRANCES, ...SPINE_ENTRANCES, ...SKERRIES_ENTRANCES, ...QBRIDGE_ENTRANCES, ...HATCH_ENTRANCES, ...HOIST_ENTRANCES };
const BOSS_ART = { ...CALDERA_BOSSES, ...CITADEL_BOSSES, ...COVES_BOSSES, ...DEEP_BOSSES, ...SPINE_BOSSES, ...SKERRIES_BOSSES, ...QBRIDGE_BOSSES, ...LADON_BOSSES, ...FENRIR_BOSSES, ...HATCH_BOSSES, ...HOIST_BOSSES };
const FX2 = { ...CALDERA_FX, ...CITADEL_FX, ...LADON_FX, ...FENRIR_FX };
// a den's own look for a shared ultimate, by theme (the Hatchkeeper's Boiling Sand is the spores ult as boiling sand)
const ULT_LOOKS = { ...HATCH_ULT_LOOKS, ...HOIST_ULT_LOOKS }; // (Brenna's Last Delivery: the wave ult as the tooth rolling)

const GROUND = FIELD_GROUND; // den floors sit at the same height as the field
const INK = '#5b4a6b';
const FLOWER_COLORS = ['#ffb3c7', '#fff1a8', '#c9b6ff', '#ffffff', '#ffd1a1'];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const ease = (k) => 1 - (1 - k) ** 3;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// A little arrow drawn as a path (unicode arrows aren't in every font)
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

// A soft round glow (drawn by src/glow.js)
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.9, 0.35, 0.35); // src/glow.js
}

// Vertical gradients (they only depend on y, so one per theme works at any camera position)
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

// ——— palettes ———

const PAL = {
  sprout: {
    bg: [[0, '#7a5236'], [0.12, '#93643f'], [0.55, '#b7834f'], [1, '#c99660']],
    dirt: '#a8784e', dirtDark: '#8c6240', pebble: '#7a5236', grass: '#7fd06e', grassLight: '#a3e48d', tuft: '#5fb85a',
    sign: '#c99b6b', signEdge: '#8f6240', signText: '#fffaf0',
  },
  mushroom: {
    bg: [[0, '#16142e'], [0.15, '#221f45'], [0.6, '#2c3160'], [1, '#26485c']],
    dirt: '#2f3352', dirtDark: '#262844', pebble: '#3d4068', grass: '#4a9a8a', grassLight: '#7fe0c8', tuft: '#3c8274',
    sign: '#5a4a8a', signEdge: '#3a2f62', signText: '#e8fff8',
  },
  bramble: {
    bg: [[0, '#0f0b1c'], [0.2, '#1c1430'], [0.6, '#2c1c38'], [1, '#3a2538']],
    dirt: '#3e2c3a', dirtDark: '#322230', pebble: '#4e3a4a', grass: '#56704e', grassLight: '#7a9668', tuft: '#40583c',
    sign: '#6a3a4a', signEdge: '#3e2030', signText: '#ffe8ec',
  },
  frost: {
    bg: [[0, '#34447e'], [0.25, '#5672b2'], [0.7, '#97bfe6'], [1, '#d0e8f8']],
    dirt: '#c6dcef', dirtDark: '#aec8e2', pebble: '#9ab8d6', grass: '#f2f9ff', grassLight: '#ffffff', tuft: '#b4d2ec',
    sign: '#7fb0dc', signEdge: '#4a78a8', signText: '#ffffff',
  },
  star: {
    bg: [[0, '#0a0820'], [0.3, '#1a1446'], [0.7, '#2c2162'], [1, '#3a2c6e']],
    dirt: '#2a2550', dirtDark: '#211d42', pebble: '#3a3470', grass: '#5a4fa0', grassLight: '#9a8fe0', tuft: '#7a6fc8',
    sign: '#3a2f72', signEdge: '#c9a64a', signText: '#fff6d8',
  },
};

// ——— seeded scenery, built once ———

function floorDeco(seed, types) {
  const r = mulberry32(seed);
  const out = [];
  for (let x = 140; x < DEN_W - 10; x += 20 + r() * 42) {
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

const SPROUT = (() => {
  const r = mulberry32(901);
  const grain = [];
  for (let x = -20; x < DEN_W + 20; x += 16 + r() * 26) grain.push({ x, a: 2 + r() * 5, f: 0.01 + r() * 0.015, p: r() * TAU, w: 1 + r() * 2 });
  const ribs = [130, 420, 760, 1050, 1300].map((x) => ({ x: x + (r() - 0.5) * 40, w: 60 + r() * 50 }));
  const windows = [{ x: 470, y: 175, rx: 62, ry: 82 }, { x: 1090, y: 160, rx: 74, ry: 96 }];
  const vines = [];
  for (let x = 30; x < DEN_W; x += 45 + r() * 80) vines.push({ x, len: 40 + r() * 140, p: r() * TAU, flower: r() < 0.35, c: Math.floor(r() * 5) });
  const roots = [];
  for (let x = 60; x < DEN_W; x += 160 + r() * 160) roots.push({ x, w: 70 + r() * 70, h: 14 + r() * 16 });
  const fungi = [190, 300, 575, 905, 1275, 1360].map((x) => ({ x: x + r() * 30, y: 190 + r() * 150, s: 0.7 + r() * 0.6 }));
  const pollen = Array.from({ length: 60 }, () => ({ x: r() * DEN_W, y: 60 + r() * 380, p: r() * TAU, s: 0.6 + r() * 0.9 }));
  const deco = floorDeco(911, [['tuft', 0.4], ['flower', 0.35], ['clover', 0.15], ['shroom', 0.1]]);
  return { grain, ribs, windows, vines, roots, fungi, pollen, deco, pebbles: pebbles(913) };
})();

const MUSH = (() => {
  const r = mulberry32(921);
  const far = [];
  for (let x = -100; x < DEN_W * 0.5 + 1100; x += 70 + r() * 90) far.push({ x, stem: 90 + r() * 140, cap: 34 + r() * 40, h: r(), g: r() });
  const stal = [];
  for (let x = -10; x < DEN_W + 20; x += 26 + r() * 46) stal.push({ x, len: 20 + r() * (r() < 0.25 ? 90 : 40), w: 14 + r() * 22, drip: r() < 0.3, p: r() * TAU });
  const COLS = [['#7ff5e0', '127,245,224'], ['#ff9fe0', '255,159,224'], ['#b9a2ff', '185,162,255'], ['#9fdcff', '159,220,255']];
  const giants = [180, 560, 930, 1190].map((x, i) => {
    const [col, rgb] = COLS[i % 4];
    return { x: x + (r() - 0.5) * 60, stem: 150 + r() * 110, cap: 56 + r() * 40, col, rgb, tilt: (r() - 0.5) * 0.12, p: r() * TAU, spots: Array.from({ length: 5 }, () => [r() * 1.5 - 0.75, r() * 0.6 + 0.2, 0.08 + r() * 0.08]) };
  });
  const strands = [];
  for (let x = 40; x < DEN_W; x += 70 + r() * 110) strands.push({ x, len: 50 + r() * 150, p: r() * TAU, rgb: COLS[Math.floor(r() * 4)][1] });
  const spores = Array.from({ length: 70 }, () => ({ x: r() * DEN_W, y: 80 + r() * 370, p: r() * TAU, s: 0.6 + r() * 1, rgb: COLS[Math.floor(r() * 4)][1] }));
  const deco = floorDeco(931, [['tuft', 0.35], ['glow', 0.35], ['crystal', 0.12], ['moss', 0.18]]).map((d) => ({ ...d, col: COLS[d.c % 4] }));
  return { far, stal, giants, strands, spores, deco, COLS, pebbles: pebbles(933) };
})();

const BRAMBLE = (() => {
  const r = mulberry32(941);
  const far = [];
  for (let x = -100; x < DEN_W * 0.4 + 1200; x += 60 + r() * 80) far.push({ x, w: 80 + r() * 90, h: 60 + r() * 120, p: r() * TAU });
  const trunks = [210, 600, 1000, 1240].map((x) => ({ x: x + (r() - 0.5) * 50, w: 36 + r() * 26, lean: (r() - 0.5) * 0.08 }));
  const arcs = [];
  for (let x = 20; x < DEN_W; x += 110 + r() * 110) arcs.push({ x, w: 90 + r() * 90, h: 40 + r() * 60, p: r() * TAU, berries: Array.from({ length: 3 }, () => r()) });
  const canopy = [];
  for (let x = -20; x < DEN_W + 40; x += 24 + r() * 30) canopy.push({ x, d: 22 + r() * 30, thorn: r() < 0.5 });
  const petals = Array.from({ length: 40 }, () => ({ x: r() * DEN_W, y: r() * 440, p: r() * TAU, s: 0.6 + r() * 0.8, sp: 14 + r() * 18 }));
  const flies = Array.from({ length: 24 }, () => ({ x: r() * DEN_W, y: 120 + r() * 300, p: r() * TAU }));
  const deco = floorDeco(951, [['tuft', 0.35], ['sprig', 0.3], ['berries', 0.2], ['rock', 0.15]]);
  return { far, trunks, arcs, canopy, petals, flies, deco, pebbles: pebbles(953) };
})();

const THRONE_X = DEN_W - 105;

// ——— the den ———

export function drawDen(ctx, room, camX, viewW, time) {
  const den = denAt(room);
  const theme = den?.theme ?? 'sprout';
  if (DEN_ART[theme]) return DEN_ART[theme](ctx, camX, viewW, time, den);
  const P = PAL[theme];
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, `bg-${theme}`, 0, GROUND + 10, P.bg);
  ctx.fillRect(L, 0, R - L, H);
  if (theme === 'sprout') drawSproutBack(ctx, L, R, camX, time);
  else if (theme === 'mushroom') drawMushBack(ctx, L, R, camX, viewW, time);
  else if (theme === 'frost') drawFrostBack(ctx, L, R, camX, viewW, time);
  else if (theme === 'star') drawStarBack(ctx, L, R, camX, viewW, time);
  else drawBrambleBack(ctx, L, R, camX, viewW, time);

  if (visible(THRONE_X - 120, THRONE_X + 120, L, R)) drawThrone(ctx, theme, THRONE_X, time);
  drawFloor(ctx, theme, Math.max(-40, L), Math.min(DEN_W + 40, R), time);
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx, theme, time);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, theme, den?.name ?? 'Boss Den', 750, time);
  DEN_PLATFORMS.forEach((p, i) => {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) return;
    if (theme === 'sprout') ledgeSprout(ctx, p, i, time);
    else if (theme === 'mushroom') ledgeMush(ctx, p, i, time);
    else if (theme === 'frost') ledgeFrost(ctx, p, i, time);
    else if (theme === 'star') ledgeStar(ctx, p, i, time);
    else ledgeBramble(ctx, p, i, time);
  });
  drawAmbient(ctx, theme, L, R, time);
  ctx.restore();
}

// Sprout King's Hollow: the inside of a giant hollow tree, sun pouring in through knotholes
function drawSproutBack(ctx, L, R, camX, time) {
  const S = SPROUT;
  // the inner wall's curved ribs
  for (const b of S.ribs) {
    if (!visible(b.x - b.w, b.x + b.w, L, R)) continue;
    ctx.fillStyle = 'rgba(110,70,40,0.22)';
    ctx.beginPath();
    ctx.roundRect(b.x - b.w / 2, 0, b.w, GROUND, b.w / 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,170,0.12)';
    ctx.beginPath();
    ctx.roundRect(b.x - b.w / 2 + 6, 20, 10, GROUND - 40, 5);
    ctx.fill();
  }
  // wood grain
  ctx.strokeStyle = 'rgba(110,70,40,0.28)';
  ctx.lineCap = 'round';
  for (const g of S.grain) {
    if (g.x < L - 10 || g.x > R + 10) continue;
    ctx.lineWidth = g.w;
    ctx.beginPath();
    for (let y = 0; y <= GROUND; y += 30) {
      const x = g.x + Math.sin(y * g.f + g.p) * g.a;
      y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // knothole windows to the sunny outside, with sunbeams
  for (const w of S.windows) {
    if (!visible(w.x - w.rx - 260, w.x + w.rx + 60, L, R)) continue;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(w.x, w.y, w.rx, w.ry, 0, 0, TAU);
    ctx.clip();
    ctx.fillStyle = vgrad(ctx, 'sproutsky', 40, 280, [[0, '#9fdcff'], [0.6, '#d8f2ff'], [1, '#fff6d8']]);
    ctx.fillRect(w.x - w.rx, w.y - w.ry, w.rx * 2, w.ry * 2);
    glow(ctx, w.x + w.rx * 0.35, w.y - w.ry * 0.45, 60, 60, '255,245,190', 0.9);
    ctx.fillStyle = '#fffbe0';
    circle(ctx, w.x + w.rx * 0.35, w.y - w.ry * 0.45, 13);
    // leafy canopy outside
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#7fd06e' : '#94dc7e';
      circle(ctx, w.x - w.rx + i * w.rx * 0.36, w.y + w.ry * 0.62 + Math.sin(i * 2.3) * 10, 26 + (i % 3) * 6);
    }
    ctx.fillStyle = '#6cc96a';
    circle(ctx, w.x - w.rx * 0.7, w.y - w.ry * 0.7, 30);
    ctx.restore();
    // bark lip around the hole
    ctx.strokeStyle = '#7a5236';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.ellipse(w.x, w.y, w.rx + 4, w.ry + 4, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#c99566';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(w.x, w.y, w.rx + 6, w.ry + 6, 0, Math.PI * 1.05, Math.PI * 1.75);
    ctx.stroke();
    // moss and a leaf tuft on the sill
    ctx.fillStyle = '#7fd06e';
    ellipse(ctx, w.x - 10, w.y + w.ry + 4, w.rx * 0.6, 8);
    ctx.fillStyle = '#a3e48d';
    ellipse(ctx, w.x - 20, w.y + w.ry + 1, w.rx * 0.3, 3);
  }
  for (const w of S.windows) {
    if (!visible(w.x - w.rx, w.x + w.rx + 320, L, R)) continue;
    const a = 0.13 + 0.04 * Math.sin(time * 0.8 + w.x);
    ctx.fillStyle = `rgba(255,246,200,${a})`;
    ctx.beginPath();
    ctx.moveTo(w.x - w.rx * 0.6, w.y - w.ry * 0.5);
    ctx.lineTo(w.x + w.rx * 0.7, w.y - w.ry * 0.7);
    ctx.lineTo(w.x + w.rx * 0.7 + 230, GROUND);
    ctx.lineTo(w.x - w.rx * 0.6 + 120, GROUND);
    ctx.closePath();
    ctx.fill();
    glow(ctx, w.x + 150, GROUND + 6, 140, 20, '255,240,180', 0.5);
  }
  // little bracket fungi on the wall
  for (const f of S.fungi) {
    if (!visible(f.x - 30, f.x + 30, L, R)) continue;
    for (let i = 0; i < 3; i++) {
      const fx = f.x + i * 12 * f.s, fy = f.y - i * 9 * f.s;
      ctx.fillStyle = i % 2 ? '#ffc48a' : '#ffb070';
      ctx.beginPath();
      ctx.ellipse(fx, fy, 14 * f.s, 6 * f.s, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ffe0b8';
      ctx.fillRect(fx - 12 * f.s, fy - 1, 24 * f.s, 2);
    }
  }
  // roots crawling along the base of the wall
  for (const rt of S.roots) {
    if (!visible(rt.x - 20, rt.x + rt.w + 20, L, R)) continue;
    ctx.fillStyle = '#8c6240';
    ctx.beginPath();
    ctx.moveTo(rt.x, GROUND + 4);
    ctx.bezierCurveTo(rt.x + rt.w * 0.2, GROUND - rt.h * 1.6, rt.x + rt.w * 0.7, GROUND - rt.h * 1.2, rt.x + rt.w, GROUND + 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,170,0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rt.x + rt.w * 0.2, GROUND - rt.h * 0.6);
    ctx.quadraticCurveTo(rt.x + rt.w * 0.45, GROUND - rt.h * 1.15, rt.x + rt.w * 0.7, GROUND - rt.h * 0.7);
    ctx.stroke();
  }
  // the ceiling: a dark band of wood with hanging vines
  ctx.fillStyle = '#5e3e2a';
  ctx.beginPath();
  ctx.rect(L, 0, R - L, 26);
  for (let x = Math.floor(L / 40) * 40; x < R + 40; x += 40) {
    ctx.moveTo(x + 20, 24);
    ctx.ellipse(x, 24, 20, 8 + ((x / 40) % 3) * 4, 0, 0, Math.PI);
  }
  ctx.fill();
  ctx.strokeStyle = '#5fb85a';
  ctx.lineWidth = 2.2;
  for (const v of S.vines) {
    if (!visible(v.x - 30, v.x + 30, L, R)) continue;
    const sway = Math.sin(time * 1.2 + v.p) * 4;
    ctx.strokeStyle = '#5fb85a';
    ctx.beginPath();
    ctx.moveTo(v.x, 20);
    ctx.quadraticCurveTo(v.x + sway, 20 + v.len * 0.5, v.x + sway * 1.6, 20 + v.len);
    ctx.stroke();
    for (let k = 0.25; k < 1; k += 0.22) {
      const lx = v.x + sway * 1.6 * k * k, ly = 20 + v.len * k;
      ctx.fillStyle = k * 10 % 2 < 1 ? '#7fd06e' : '#6cc96a';
      ellipse(ctx, lx + (k * 10 % 2 < 1 ? 5 : -5), ly, 6, 3, k * 10 % 2 < 1 ? 0.5 : -0.5);
    }
    if (v.flower) {
      ctx.fillStyle = FLOWER_COLORS[v.c];
      circle(ctx, v.x + sway * 1.6, 22 + v.len, 4);
      ctx.fillStyle = '#ffcf4d';
      circle(ctx, v.x + sway * 1.6, 22 + v.len, 1.6);
    }
  }
  void camX;
}

// Mother Mushroom's Grotto: a dark cave lit by glowing mushrooms
function drawMushBack(ctx, L, R, camX, viewW, time) {
  const M = MUSH;
  // far silhouettes at half speed
  const off = camX * 0.5;
  for (const b of M.far) {
    const ax = b.x + off;
    if (ax < camX - 120 || ax > camX + viewW + 120) continue;
    const base = GROUND - 10;
    ctx.fillStyle = mix('#2a2d58', '#33306a', b.h);
    ctx.beginPath();
    ctx.roundRect(ax - 6, base - b.stem, 12, b.stem, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ax, base - b.stem + 4, b.cap, b.cap * 0.5, 0, Math.PI, 0);
    ctx.fill();
    glow(ctx, ax, base - b.stem - b.cap * 0.15, b.cap * 1.2, b.cap * 0.6, M.COLS[Math.floor(b.g * 4)][1], 0.18 + 0.06 * Math.sin(time + b.x));
  }
  // haze over the floor
  ctx.fillStyle = vgrad(ctx, 'mushhaze', GROUND - 140, GROUND, [[0, 'rgba(120,220,210,0)'], [1, 'rgba(120,220,210,0.14)']]);
  ctx.fillRect(L, GROUND - 140, R - L, 140);
  // hanging glowing strands
  for (const s of M.strands) {
    if (!visible(s.x - 20, s.x + 20, L, R)) continue;
    const sway = Math.sin(time * 0.9 + s.p) * 3;
    ctx.strokeStyle = 'rgba(160,200,220,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(s.x, 10);
    ctx.quadraticCurveTo(s.x + sway, 10 + s.len * 0.5, s.x + sway * 1.5, 10 + s.len);
    ctx.stroke();
    for (let k = 0.3; k <= 1.01; k += 0.35) {
      const bx = s.x + sway * 1.5 * k * k, by = 10 + s.len * k;
      const tw = 0.6 + 0.4 * Math.sin(time * 2 + s.p + k * 5);
      glow(ctx, bx, by, 12, 12, s.rgb, tw * 0.7);
      ctx.fillStyle = `rgba(${s.rgb},${0.6 + 0.4 * tw})`;
      circle(ctx, bx, by, 2.6 * (k > 0.9 ? 1.4 : 1));
    }
  }
  // giant glowing mushrooms
  for (const g of M.giants) {
    if (!visible(g.x - g.cap * 1.6, g.x + g.cap * 1.6, L, R)) continue;
    ctx.globalAlpha = 0.72; // set back a little, so the (brighter) ledges read as the platforms
    drawGlowShroom(ctx, g.x, GROUND + 2, g.stem, g.cap, g.col, g.rgb, g.tilt, g.spots, time + g.p);
    ctx.globalAlpha = 1;
  }
  // stalactites
  ctx.fillStyle = '#1a1734';
  ctx.fillRect(L, 0, R - L, 16);
  for (const s of M.stal) {
    if (!visible(s.x - s.w, s.x + s.w, L, R)) continue;
    ctx.fillStyle = '#2a2650';
    ctx.beginPath();
    ctx.moveTo(s.x - s.w / 2, 0);
    ctx.lineTo(s.x + s.w / 2, 0);
    ctx.quadraticCurveTo(s.x + s.w * 0.2, s.len * 0.6, s.x + 2, 14 + s.len);
    ctx.quadraticCurveTo(s.x, 16 + s.len, s.x - 2, 14 + s.len);
    ctx.quadraticCurveTo(s.x - s.w * 0.2, s.len * 0.6, s.x - s.w / 2, 0);
    ctx.fill();
    ctx.fillStyle = 'rgba(160,150,230,0.18)';
    ctx.beginPath();
    ctx.moveTo(s.x - s.w * 0.3, 0);
    ctx.quadraticCurveTo(s.x - s.w * 0.15, s.len * 0.5, s.x - 1, 10 + s.len);
    ctx.lineTo(s.x - s.w * 0.1, 0);
    ctx.fill();
    if (s.drip) {
      const k = (time * 0.35 + s.p) % 1;
      const dy = 18 + s.len + k * k * 260;
      ctx.fillStyle = `rgba(127,245,224,${0.8 * (1 - k)})`;
      ellipse(ctx, s.x, dy, 2, 3);
      glow(ctx, s.x, 16 + s.len, 8, 8, '127,245,224', 0.6);
    }
  }
}

function drawGlowShroom(ctx, x, base, stem, cap, col, rgb, tilt, spots, t) {
  const pulse = 0.75 + 0.25 * Math.sin(t * 1.3);
  glow(ctx, x, base - stem - cap * 0.1, cap * 2, cap * 1.4, rgb, 0.35 * pulse);
  ctx.save();
  ctx.translate(x, base);
  ctx.rotate(tilt);
  const g = ctx.createLinearGradient(0, -stem, 0, 0);
  g.addColorStop(0, '#d8d0f4');
  g.addColorStop(1, '#8a86b8');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-cap * 0.16, -stem);
  ctx.quadraticCurveTo(-cap * 0.22, -stem * 0.4, -cap * 0.3, 0);
  ctx.lineTo(cap * 0.3, 0);
  ctx.quadraticCurveTo(cap * 0.22, -stem * 0.4, cap * 0.16, -stem);
  ctx.closePath();
  ctx.fill();
  // gills glow
  ctx.fillStyle = `rgba(${rgb},0.55)`;
  ellipse(ctx, 0, -stem + 4, cap * 0.85, 8);
  // cap
  ctx.fillStyle = mix(col, '#ffffff', 0.15);
  ctx.beginPath();
  ctx.moveTo(-cap, -stem + 4);
  ctx.bezierCurveTo(-cap, -stem - cap * 0.95, cap, -stem - cap * 0.95, cap, -stem + 4);
  ctx.quadraticCurveTo(0, -stem + 12, -cap, -stem + 4);
  ctx.fill();
  ctx.fillStyle = mix(col, '#2a2d58', 0.25);
  ctx.beginPath();
  ctx.moveTo(-cap, -stem + 4);
  ctx.quadraticCurveTo(0, -stem + 12, cap, -stem + 4);
  ctx.quadraticCurveTo(0, -stem - 4, -cap, -stem + 4);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${0.55 + 0.35 * pulse})`;
  for (const [sx, sy, sr] of spots) ellipse(ctx, sx * cap, -stem - sy * cap * 0.7, sr * cap, sr * cap * 0.7);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, -cap * 0.45, -stem - cap * 0.45, cap * 0.18, cap * 0.08, -0.6);
  ctx.restore();
}

// The Briar Throne: a dark thorny clearing under the moon
function drawBrambleBack(ctx, L, R, camX, viewW, time) {
  const B = BRAMBLE;
  // the moon, almost fixed on screen
  const mx = camX + viewW * 0.72, my = 96;
  glow(ctx, mx, my, 170, 170, '220,215,255', 0.45);
  ctx.fillStyle = '#f4f0ff';
  circle(ctx, mx, my, 32);
  ctx.fillStyle = 'rgba(200,190,235,0.55)';
  circle(ctx, mx - 10, my - 6, 7);
  circle(ctx, mx + 9, my + 9, 5);
  circle(ctx, mx + 12, my - 12, 3.5);
  // far tangles (slow parallax)
  const off = camX * 0.6;
  for (const f of B.far) {
    const ax = f.x + off;
    if (ax + f.w < camX - 40 || ax > camX + viewW + 40) continue;
    ctx.fillStyle = '#241830';
    ctx.beginPath();
    ctx.moveTo(ax, GROUND);
    ctx.bezierCurveTo(ax + f.w * 0.1, GROUND - f.h * 1.3, ax + f.w * 0.9, GROUND - f.h * 1.3, ax + f.w, GROUND);
    ctx.fill();
  }
  // the moonbeam onto the arena floor
  const a = 0.08 + 0.025 * Math.sin(time * 0.6);
  ctx.fillStyle = `rgba(210,215,255,${a})`;
  ctx.beginPath();
  ctx.moveTo(mx - 40, my);
  ctx.lineTo(mx + 40, my);
  ctx.lineTo(820 + 190, GROUND);
  ctx.lineTo(820 - 190, GROUND);
  ctx.closePath();
  ctx.fill();
  // gnarled dead trunks
  for (const t of B.trunks) {
    if (!visible(t.x - 80, t.x + 80, L, R)) continue;
    ctx.save();
    ctx.translate(t.x, GROUND);
    ctx.rotate(t.lean);
    ctx.fillStyle = '#2e2036';
    ctx.beginPath();
    ctx.moveTo(-t.w * 1.1, 4);
    ctx.quadraticCurveTo(-t.w * 0.5, -10, -t.w * 0.45, -60);
    ctx.lineTo(-t.w * 0.38, -GROUND);
    ctx.lineTo(t.w * 0.38, -GROUND);
    ctx.lineTo(t.w * 0.45, -60);
    ctx.quadraticCurveTo(t.w * 0.5, -10, t.w * 1.1, 4);
    ctx.fill();
    // a crooked branch
    ctx.strokeStyle = '#2e2036';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -250);
    ctx.quadraticCurveTo(t.w * 1.2, -280, t.w * 1.6, -330);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,190,240,0.12)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-t.w * 0.25, -20);
    ctx.lineTo(-t.w * 0.22, -GROUND + 40);
    ctx.stroke();
    ctx.restore();
  }
  // nearer bramble arcs with red berries
  for (const b of B.arcs) {
    if (!visible(b.x - 20, b.x + b.w + 20, L, R)) continue;
    drawThornArc(ctx, b.x, GROUND + 4, b.w, b.h, b.p, time, b.berries);
  }
  // the canopy edge across the top
  ctx.fillStyle = '#120c1c';
  ctx.beginPath();
  ctx.rect(L, 0, R - L, 18);
  for (const c of B.canopy) {
    if (c.x < L - 40 || c.x > R + 40) continue;
    ctx.moveTo(c.x + 22, 14);
    ctx.ellipse(c.x, 14, 22, c.d, 0, 0, Math.PI);
    if (c.thorn) {
      ctx.moveTo(c.x - 4, 12 + c.d);
      ctx.lineTo(c.x, 24 + c.d);
      ctx.lineTo(c.x + 4, 12 + c.d);
    }
  }
  ctx.fill();
}

function drawThornArc(ctx, x, base, w, h, p, time, berries) {
  const sway = Math.sin(time * 0.8 + p) * 2;
  ctx.strokeStyle = '#4a2c48';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.bezierCurveTo(x + w * 0.15, base - h * 1.3 + sway, x + w * 0.85, base - h * 1.3 - sway, x + w, base);
  ctx.stroke();
  ctx.strokeStyle = '#5e3a58';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#4a2c48';
  const pt = (k) => {
    const u = 1 - k;
    return [
      u ** 3 * x + 3 * u * u * k * (x + w * 0.15) + 3 * u * k * k * (x + w * 0.85) + k ** 3 * (x + w),
      u ** 3 * base + 3 * u * u * k * (base - h * 1.3 + sway) + 3 * u * k * k * (base - h * 1.3 - sway) + k ** 3 * base,
    ];
  };
  for (let k = 0.12; k < 0.95; k += 0.11) {
    const [tx, ty] = pt(k);
    const up = (Math.round(k * 100) % 2) ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(tx - 3, ty);
    ctx.lineTo(tx + 1, ty + up * 8);
    ctx.lineTo(tx + 3, ty);
    ctx.fill();
  }
  if (berries) {
    berries.forEach((b, i) => {
      const [bx, by] = pt(0.2 + b * 0.6);
      berry(ctx, bx + (i % 2 ? 4 : -4), by + 6, 3.6, time + i);
    });
  }
}

function berry(ctx, x, y, r, t) {
  glow(ctx, x, y, r * 3, r * 3, '255,80,100', 0.25 + 0.1 * Math.sin(t * 2));
  ctx.fillStyle = '#e0465a';
  circle(ctx, x, y, r);
  ctx.fillStyle = '#ff8a9a';
  circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.35);
}

// ——— the throne at the den's east end ———

function drawThrone(ctx, theme, x, time) {
  const b = GROUND;
  if (theme === 'frost') return throneFrost(ctx, x, b, time);
  if (theme === 'star') return throneStar(ctx, x, b, time);
  if (theme === 'sprout') {
    // a mossy stump seat with two giant leaves fanned out behind it
    for (const [rot, col] of [[-0.42, '#6cc96a'], [0.42, '#5fb85a'], [0, '#7fd06e']]) {
      ctx.save();
      ctx.translate(x, b - 60);
      ctx.rotate(rot + Math.sin(time * 0.9 + rot) * 0.02);
      ctx.fillStyle = col;
      ctx.strokeStyle = '#4f9d5c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-58, -60, -40, -170, 0, -210);
      ctx.bezierCurveTo(40, -170, 58, -60, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(0, -195);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#a8784e';
    ctx.strokeStyle = '#7a5236';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x - 60, b - 70, 120, 74, [14, 14, 6, 6]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d4a77a';
    ellipse(ctx, x, b - 70, 58, 12);
    ctx.strokeStyle = '#a8784e';
    ctx.lineWidth = 2;
    for (const rr of [40, 26, 12]) {
      ctx.beginPath();
      ctx.ellipse(x, b - 70, rr, rr * 0.2, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = '#7fd06e';
    ellipse(ctx, x - 30, b - 74, 22, 6);
    // a golden crown carving
    ctx.fillStyle = '#ffcf4d';
    ctx.strokeStyle = '#d9a23a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 16, b - 30);
    ctx.lineTo(x - 16, b - 48);
    ctx.lineTo(x - 8, b - 40);
    ctx.lineTo(x, b - 52);
    ctx.lineTo(x + 8, b - 40);
    ctx.lineTo(x + 16, b - 48);
    ctx.lineTo(x + 16, b - 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (const fx of [-48, 44]) {
      ctx.fillStyle = FLOWER_COLORS[fx < 0 ? 0 : 1];
      for (let i = 0; i < 5; i++) circle(ctx, x + fx + Math.cos(i * 1.26) * 5, b - 8 + Math.sin(i * 1.26) * 5, 4);
      ctx.fillStyle = '#ffcf4d';
      circle(ctx, x + fx, b - 8, 3);
    }
  } else if (theme === 'mushroom') {
    // a mossy nest under a huge glowing canopy cap
    drawGlowShroom(ctx, x + 10, b, 230, 100, '#ff9fe0', '255,159,224', -0.05, [[-0.5, 0.4, 0.13], [0.1, 0.7, 0.15], [0.55, 0.35, 0.11], [-0.1, 0.25, 0.08]], time);
    ctx.fillStyle = '#3c6a64';
    ctx.beginPath();
    ctx.ellipse(x, b, 90, 36, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#4a9a8a';
    ctx.beginPath();
    ctx.ellipse(x, b - 4, 80, 26, 0, Math.PI, 0);
    ctx.fill();
    for (let i = 0; i < 7; i++) {
      const sx = x - 70 + i * 23, sh = 10 + (i % 3) * 6;
      const [col, rgb] = MUSH.COLS[i % 4];
      glow(ctx, sx, b - 24 - sh, 14, 10, rgb, 0.5);
      ctx.fillStyle = '#d8d0f4';
      ctx.fillRect(sx - 2, b - 24 - sh, 4, sh);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(sx, b - 24 - sh, 8, 6, 0, Math.PI, 0);
      ctx.fill();
    }
  } else {
    // a throne of woven brambles
    ctx.fillStyle = '#2a1830';
    ctx.strokeStyle = '#4a2c48';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 70, b);
    ctx.lineTo(x - 66, b - 150);
    ctx.lineTo(x - 82, b - 196);
    ctx.lineTo(x - 50, b - 176);
    ctx.lineTo(x - 30, b - 232);
    ctx.lineTo(x - 10, b - 190);
    ctx.lineTo(x + 8, b - 250);
    ctx.lineTo(x + 26, b - 190);
    ctx.lineTo(x + 46, b - 228);
    ctx.lineTo(x + 56, b - 174);
    ctx.lineTo(x + 84, b - 192);
    ctx.lineTo(x + 68, b - 150);
    ctx.lineTo(x + 72, b);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // woven vines over it
    ctx.strokeStyle = '#4a2c48';
    ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 64, b - 20 - i * 26);
      ctx.quadraticCurveTo(x, b - 40 - i * 26 + (i % 2 ? 18 : -18), x + 66, b - 20 - i * 26);
      ctx.stroke();
    }
    // seat
    ctx.fillStyle = '#3e2640';
    ctx.beginPath();
    ctx.roundRect(x - 80, b - 64, 160, 22, 10);
    ctx.fill();
    ctx.fillStyle = '#5a2a3e';
    ctx.beginPath();
    ctx.roundRect(x - 70, b - 70, 140, 12, 6);
    ctx.fill();
    for (const [bx, by] of [[x - 30, b - 232], [x + 8, b - 250], [x + 46, b - 228], [x - 66, b - 150], [x + 68, b - 150]]) berry(ctx, bx, by + 8, 5, time + bx);
    glow(ctx, x, b - 140, 100, 120, '255,80,100', 0.12 + 0.04 * Math.sin(time * 1.5));
  }
}

// ——— floor ———

function drawFloor(ctx, theme, L, R, time) {
  const P = PAL[theme], y = GROUND;
  const S = { sprout: SPROUT, mushroom: MUSH, bramble: BRAMBLE, frost: FROST, star: STAR }[theme] ?? SPROUT;
  ctx.fillStyle = P.dirt;
  ctx.fillRect(L, y, R - L, H - y + 10);
  ctx.fillStyle = P.dirtDark;
  ctx.fillRect(L, y + 50, R - L, H - y);
  ctx.fillStyle = P.pebble;
  ctx.beginPath();
  for (const p of S.pebbles) {
    if (p.x < L || p.x > R) continue;
    ctx.moveTo(p.x + p.r * 1.4, y + p.dy);
    ctx.ellipse(p.x, y + p.dy, p.r * 1.4, p.r, 0, 0, TAU);
  }
  ctx.fill();
  if (theme === 'bramble') glow(ctx, 820, y + 10, 210, 26, '210,215,255', 0.45); // the moonlit circle
  if (theme === 'frost') {
    // polished ice: a few long glints
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let x = Math.floor(L / 170) * 170; x < R; x += 170) ellipse(ctx, x + 40, y + 24 + (x % 340) / 40, 34, 2.2, -0.04);
  }
  if (theme === 'star') {
    // glowing rune tiles set into the floor
    for (let x = Math.floor(L / 120) * 120; x < R; x += 120) {
      const a = 0.35 + 0.25 * Math.sin(time * 1.5 + x * 0.05);
      glow(ctx, x + 60, y + 28, 30, 8, '255,214,106', a * 0.6);
      ctx.strokeStyle = `rgba(255,214,106,${a})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x + 48, y + 28);
      ctx.lineTo(x + 60, y + 22);
      ctx.lineTo(x + 72, y + 28);
      ctx.lineTo(x + 60, y + 34);
      ctx.closePath();
      ctx.stroke();
    }
  }
  if (theme === 'mushroom') {
    // faint glowing moss veins in the dirt
    ctx.strokeStyle = 'rgba(127,245,224,0.16)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = Math.floor(L / 90) * 90; x < R; x += 90) {
      ctx.moveTo(x, y + 30 + (x % 270) / 10);
      ctx.quadraticCurveTo(x + 30, y + 44, x + 70, y + 34 + (x % 180) / 12);
    }
    ctx.stroke();
  }
  // grass / moss cap
  ctx.fillStyle = P.grass;
  ctx.beginPath();
  ctx.roundRect(L - 4, y - 4, R - L + 8, 18, 9);
  ctx.fill();
  ctx.beginPath();
  for (let gx = Math.floor(L / 15) * 15 + 6; gx < R + 7; gx += 15) {
    ctx.moveTo(gx + 7, y + 12);
    ctx.arc(gx, y + 12, 7, 0, Math.PI);
  }
  ctx.fill();
  ctx.fillStyle = P.grassLight;
  ctx.beginPath();
  ctx.roundRect(L + 2, y - 4, R - L - 4, 5, 2.5);
  ctx.fill();
  for (const d of S.deco) if (d.x > L - 20 && d.x < R + 20) drawDeco(ctx, theme, d, y - 2, time);
}

function drawDeco(ctx, theme, d, y, time) {
  const P = PAL[theme], x = d.x, s = d.s;
  const sway = Math.sin(time * 2 + x * 0.05) * 0.12;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  switch (d.type) {
    case 'tuft':
      ctx.fillStyle = P.tuft;
      ctx.rotate(sway);
      for (const [dx, hh] of [[-4, 9], [0, 13], [4, 9]]) {
        ctx.beginPath();
        ctx.moveTo(dx - 2.5, 2);
        ctx.quadraticCurveTo(dx, -hh * 0.5, dx + dx * 0.15, -hh);
        ctx.quadraticCurveTo(dx + 1, -hh * 0.5, dx + 2.5, 2);
        ctx.fill();
      }
      break;
    case 'flower':
      ctx.rotate(sway);
      ctx.strokeStyle = '#5fb85a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, -12);
      ctx.stroke();
      ctx.fillStyle = FLOWER_COLORS[d.c];
      for (let i = 0; i < 5; i++) circle(ctx, Math.cos(i * 1.26) * 3.4, -13 + Math.sin(i * 1.26) * 3.4, 2.6);
      ctx.fillStyle = '#ffcf4d';
      circle(ctx, 0, -13, 1.8);
      break;
    case 'clover':
      ctx.fillStyle = '#6cc96a';
      for (const a of [-0.6, 0.6, 0]) ellipse(ctx, Math.sin(a) * 4, -4 - Math.cos(a) * 3, 3.2, 2.6, a);
      break;
    case 'shroom':
      ctx.fillStyle = '#fff4e6';
      ctx.fillRect(-1.5, -7, 3, 8);
      ctx.fillStyle = '#ff9f8f';
      ctx.beginPath();
      ctx.arc(0, -7, 5, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff';
      circle(ctx, -1.6, -9, 1);
      break;
    case 'glow': {
      const [col, rgb] = d.col;
      const tw = 0.7 + 0.3 * Math.sin(time * 1.8 + d.p);
      glow(ctx, 0, -8, 16, 12, rgb, 0.55 * tw);
      ctx.fillStyle = '#d8d0f4';
      ctx.fillRect(-1.5, -8, 3, 9);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, -8, 6, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      circle(ctx, -2, -10, 1.1);
      break;
    }
    case 'crystal': {
      const [, rgb] = d.col;
      glow(ctx, 0, -8, 14, 12, rgb, 0.35);
      ctx.fillStyle = `rgba(${rgb},0.85)`;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      for (const [dx, hh, a] of [[-4, 12, -0.3], [2, 18, 0.1], [6, 9, 0.4]]) {
        ctx.save();
        ctx.translate(dx, 1);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(-2.5, 0);
        ctx.lineTo(-2.5, -hh + 4);
        ctx.lineTo(0, -hh);
        ctx.lineTo(2.5, -hh + 4);
        ctx.lineTo(2.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case 'moss':
      ctx.fillStyle = '#3c8274';
      ellipse(ctx, 0, 0, 10, 4);
      ctx.fillStyle = '#5fb8a4';
      ellipse(ctx, -2, -1, 6, 2.4);
      break;
    case 'sprig':
      ctx.rotate(sway * 0.6);
      ctx.strokeStyle = '#4a2c48';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.quadraticCurveTo(-4, -8, 2, -16);
      ctx.stroke();
      ctx.fillStyle = '#4a2c48';
      for (const [tx, ty, dir] of [[-2, -6, -1], [1, -12, 1]]) {
        ctx.beginPath();
        ctx.moveTo(tx, ty - 1.5);
        ctx.lineTo(tx + dir * 5, ty);
        ctx.lineTo(tx, ty + 1.5);
        ctx.fill();
      }
      break;
    case 'berries':
      ctx.fillStyle = '#40583c';
      ellipse(ctx, 0, -2, 8, 4);
      berry(ctx, -3, -5, 2.6, time + d.p);
      berry(ctx, 3, -4, 2.4, time + d.p + 1);
      berry(ctx, 0, -8, 2.2, time + d.p + 2);
      break;
    case 'snow':
      ctx.fillStyle = '#ffffff';
      ellipse(ctx, 0, 0, 12, 5);
      ellipse(ctx, 5, -2, 7, 4);
      ctx.fillStyle = 'rgba(160,200,235,0.5)';
      ellipse(ctx, 2, 3, 10, 1.6);
      break;
    case 'frostTuft':
      ctx.fillStyle = '#9fc4e4';
      ctx.rotate(sway * 0.5);
      for (const [dx, hh] of [[-4, 9], [0, 13], [4, 9]]) {
        ctx.beginPath();
        ctx.moveTo(dx - 2.5, 2);
        ctx.quadraticCurveTo(dx, -hh * 0.5, dx + dx * 0.15, -hh);
        ctx.quadraticCurveTo(dx + 1, -hh * 0.5, dx + 2.5, 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      circle(ctx, 0, -12, 1.6);
      circle(ctx, -4, -8, 1.2);
      break;
    case 'snowflower':
      ctx.strokeStyle = '#9fc4e4';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, -12);
      ctx.stroke();
      ctx.fillStyle = '#e8f6ff';
      for (let i = 0; i < 6; i++) ellipse(ctx, Math.cos(i * 1.05) * 3.4, -13 + Math.sin(i * 1.05) * 3.4, 2.6, 1.6, i * 1.05);
      ctx.fillStyle = '#9fdcff';
      circle(ctx, 0, -13, 1.8);
      break;
    case 'starstone': {
      const tw = 0.6 + 0.4 * Math.sin(time * 2 + d.p);
      ctx.fillStyle = '#4a4280';
      ellipse(ctx, 0, -2, 8, 5);
      glow(ctx, 0, -5, 12, 10, '255,214,106', 0.5 * tw);
      ctx.fillStyle = `rgba(255,230,150,${0.6 + 0.4 * tw})`;
      star(ctx, 0, -5, 3.5);
      break;
    }
    case 'rock':
      ctx.fillStyle = '#4e3a4a';
      ellipse(ctx, 0, -2, 9, 6);
      ctx.fillStyle = 'rgba(210,215,255,0.18)';
      ellipse(ctx, -2, -5, 4, 2);
      break;
  }
  ctx.restore();
}

// ——— the way out, the den's name banner ———

function drawExit(ctx, theme, time) {
  const x = DEN_EXIT_X, b = GROUND, hw = 40, top = b - 128;
  const opening = () => {
    ctx.beginPath();
    ctx.moveTo(x - hw, b + 2);
    ctx.lineTo(x - hw, top + hw);
    ctx.arc(x, top + hw, hw, Math.PI, 0);
    ctx.lineTo(x + hw, b + 2);
    ctx.closePath();
  };
  // daylight from the Wildwood outside
  const high = theme === 'frost' || theme === 'star'; // these open onto the snowy Highlands
  glow(ctx, x, b - 50, 110, 90, theme === 'bramble' || high ? '200,220,255' : '220,255,200', 0.35);
  ctx.save();
  opening();
  ctx.clip();
  ctx.fillStyle = high
    ? vgrad(ctx, 'exitsnow', top, b, [[0, '#a8c4ee'], [0.6, '#dcecfb'], [1, '#ffffff']])
    : vgrad(ctx, 'exitsky', top, b, [[0, '#d8f2ff'], [0.6, '#e4f7d0'], [1, '#b6e49a']]);
  ctx.fillRect(x - hw, top, hw * 2, b - top + 4);
  ctx.fillStyle = high ? '#f4faff' : '#9fd88a';
  for (let i = 0; i < 4; i++) circle(ctx, x - hw + i * 26, b - 30 + (i % 2) * 6, 18);
  ctx.fillStyle = high ? '#ffffff' : '#7fd06e';
  ctx.fillRect(x - hw, b - 14, hw * 2, 18);
  ctx.restore();
  glow(ctx, x + 30, b + 4, 90, 14, '230,255,210', 0.35);
  // frame
  if (theme === 'frost' || theme === 'star') {
    exitFrameHigh(ctx, theme, x, b, hw, top, opening, time);
  } else if (theme === 'sprout') {
    ctx.strokeStyle = '#7a5236';
    ctx.lineWidth = 18;
    opening();
    ctx.stroke();
    ctx.strokeStyle = '#a8784e';
    ctx.lineWidth = 8;
    opening();
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const lx = x + Math.cos(a) * (hw + 6), ly = top + hw + Math.sin(a) * (hw + 6);
      ctx.fillStyle = i % 2 ? '#7fd06e' : '#6cc96a';
      ellipse(ctx, lx, ly, 7, 3.5, a + Math.PI / 2 + Math.sin(time * 2 + i) * 0.15);
    }
  } else if (theme === 'mushroom') {
    ctx.fillStyle = '#3d4068';
    ctx.strokeStyle = '#262844';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 10; i++) {
      const k = i / 10;
      let bx, by, a;
      if (k < 0.25) [bx, by, a] = [x - hw - 8, b - 10 - (k / 0.25) * (b - top - hw - 10), 0];
      else if (k > 0.75) [bx, by, a] = [x + hw + 8, b - 10 - ((1 - k) / 0.25) * (b - top - hw - 10), 0];
      else {
        a = Math.PI + ((k - 0.25) / 0.5) * Math.PI;
        [bx, by] = [x + Math.cos(a) * (hw + 8), top + hw + Math.sin(a) * (hw + 8)];
      }
      ctx.beginPath();
      ctx.roundRect(bx - 11, by - 10, 22, 20, 6);
      ctx.fill();
      ctx.stroke();
    }
    for (const [sx, col, rgb] of [[x - hw - 14, '#7ff5e0', '127,245,224'], [x + hw + 14, '#ff9fe0', '255,159,224']]) {
      glow(ctx, sx, b - 14, 20, 16, rgb, 0.6);
      ctx.fillStyle = '#d8d0f4';
      ctx.fillRect(sx - 2, b - 14, 4, 14);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(sx, b - 14, 9, 7, 0, Math.PI, 0);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = '#2a1830';
    ctx.lineWidth = 16;
    opening();
    ctx.stroke();
    ctx.strokeStyle = '#4a2c48';
    ctx.lineWidth = 5;
    opening();
    ctx.stroke();
    ctx.fillStyle = '#2a1830';
    for (let i = 0; i < 11; i++) {
      const a = Math.PI + (i / 10) * Math.PI;
      const tx = x + Math.cos(a) * (hw + 8), ty = top + hw + Math.sin(a) * (hw + 8);
      ctx.beginPath();
      ctx.moveTo(tx + Math.cos(a + 1.5) * 4, ty + Math.sin(a + 1.5) * 4);
      ctx.lineTo(tx + Math.cos(a) * 12, ty + Math.sin(a) * 12);
      ctx.lineTo(tx + Math.cos(a - 1.5) * 4, ty + Math.sin(a - 1.5) * 4);
      ctx.fill();
    }
    berry(ctx, x - hw - 6, top + 40, 4, time);
    berry(ctx, x + hw + 4, top + 62, 3.6, time + 1);
  }
  // sign over the doorway
  const P = PAL[theme];
  const label = high ? 'Frostpeak' : 'Wildwood';
  ctx.save();
  ctx.translate(x, top - 18);
  ctx.rotate(Math.sin(time * 1.3) * 0.03);
  ctx.font = "700 13px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = ctx.measureText(label).width + 40;
  ctx.fillStyle = P.sign;
  ctx.strokeStyle = P.signEdge;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -12, tw, 24, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, label, 7, 0.5, 13, P.signText);
  arrow(ctx, -tw / 2 + 13, 0, -1, 0.8, P.signText);
  ctx.restore();
}

function drawBanner(ctx, theme, name, x, time) {
  const top = 90;
  ctx.save();
  ctx.font = "700 20px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = ctx.measureText(name).width + 70, hh = 44;
  const sw = Math.sin(time * 0.9) * 1.5;
  const cloth = { sprout: '#6cc96a', mushroom: '#7a5ac8', bramble: '#7a2a40', frost: '#6aa4dc', star: '#2e2468' }[theme];
  const trim = { sprout: '#ffcf4d', mushroom: '#7ff5e0', bramble: '#c9a0b0', frost: '#ffffff', star: '#ffd66a' }[theme];
  const ink = { sprout: '#fffaf0', mushroom: '#f0fff8', bramble: '#ffe8ec', frost: '#ffffff', star: '#fff6d8' }[theme];
  const rope = { sprout: '#5fb85a', mushroom: 'rgba(160,200,220,0.6)', bramble: '#4a2c48', frost: '#e8f6ff', star: '#c9a64a' }[theme];
  // ropes / vines up to the ceiling
  ctx.strokeStyle = rope;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - tw / 2 + 16, 10);
  ctx.lineTo(x - tw / 2 + 16 + sw, top);
  ctx.moveTo(x + tw / 2 - 16, 10);
  ctx.lineTo(x + tw / 2 - 16 + sw, top);
  ctx.stroke();
  ctx.translate(x + sw, top);
  if (theme === 'mushroom') glow(ctx, 0, hh / 2, tw * 0.7, hh * 1.4, '185,162,255', 0.35);
  if (theme === 'star') glow(ctx, 0, hh / 2, tw * 0.7, hh * 1.4, '255,214,106', 0.25);
  // the cloth, with a notched / tattered bottom edge
  ctx.fillStyle = cloth;
  ctx.strokeStyle = mix(cloth, '#000000', 0.3);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, 0);
  ctx.lineTo(tw / 2, 0);
  ctx.lineTo(tw / 2, hh);
  if (theme === 'bramble' || theme === 'frost') {
    const n = theme === 'frost' ? 13 : 9;
    for (let i = n; i >= 0; i--) ctx.lineTo(-tw / 2 + (tw * i) / n, hh + (i % 2 ? (theme === 'frost' ? 12 : 9) : 0));
  } else if (theme === 'sprout') {
    for (let i = 4; i >= 0; i--) {
      const cx = -tw / 2 + (tw * (i + 0.5)) / 5;
      ctx.quadraticCurveTo(cx + tw / 10, hh, cx, hh + 10);
      ctx.quadraticCurveTo(cx - tw / 10, hh, cx - tw / 10, hh);
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const x0 = -tw / 2 + (tw * i) / 6;
      ctx.quadraticCurveTo(x0 + tw / 12, hh + 14, x0, hh);
    }
  }
  ctx.lineTo(-tw / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // rod
  ctx.fillStyle = { sprout: '#8f6240', mushroom: '#3a2f62', bramble: '#2a1830', frost: '#e8f6ff', star: '#c9a64a' }[theme];
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
  // little emblems either side of the name
  for (const side of [-1, 1]) {
    const ex = side * (tw / 2 - 20);
    ctx.fillStyle = trim;
    if (theme === 'sprout') {
      ellipse(ctx, ex - 3, hh / 2 - 2, 5, 2.6, -0.5);
      ellipse(ctx, ex + 3, hh / 2 - 2, 5, 2.6, 0.5);
    } else if (theme === 'mushroom') {
      ctx.beginPath();
      ctx.arc(ex, hh / 2 + 2, 6, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(ex - 1.5, hh / 2 + 2, 3, 5);
    } else if (theme === 'frost' || theme === 'star') {
      star(ctx, ex, hh / 2, 7);
    } else {
      berry(ctx, ex, hh / 2, 4, time);
    }
  }
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowOffsetY = 2;
  text(ctx, name, 0, hh / 2 + 1, 20, ink);
  ctx.restore();
}

// ——— platforms ———

function ledgeSprout(ctx, p, i, time) {
  const { x, y, w } = p;
  // hanging from vines tied to the ceiling
  ctx.strokeStyle = '#5fb85a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const vx of [x + 20, x + w - 20]) {
    ctx.moveTo(vx, 18);
    ctx.quadraticCurveTo(vx + 6, y * 0.5, vx, y + 4);
  }
  ctx.stroke();
  for (const vx of [x + 20, x + w - 20]) {
    for (let yy = 50; yy < y - 10; yy += 34) {
      ctx.fillStyle = (yy / 34) % 2 < 1 ? '#7fd06e' : '#6cc96a';
      const side = (yy / 34) % 2 < 1 ? 1 : -1;
      ellipse(ctx, vx + 3 + side * 6, yy, 6, 3, side * 0.5 + Math.sin(time * 1.5 + yy) * 0.1);
    }
  }
  // the plank
  ctx.fillStyle = '#8f5f3a';
  ctx.beginPath();
  ctx.roundRect(x - 4, y + 4, w + 8, 20, 10);
  ctx.fill();
  ctx.fillStyle = '#b07a4c';
  ctx.beginPath();
  ctx.roundRect(x - 4, y, w + 8, 16, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,70,40,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 9);
  ctx.lineTo(x + w * 0.45, y + 9);
  ctx.moveTo(x + w * 0.55, y + 12);
  ctx.lineTo(x + w - 14, y + 12);
  ctx.stroke();
  // leaves drooping underneath
  for (let k = 0; k < 5; k++) {
    const lx = x + 18 + k * (w - 36) / 4, sway = Math.sin(time * 1.6 + k + i) * 0.15;
    ctx.fillStyle = k % 2 ? '#7fd06e' : '#5fb85a';
    ellipse(ctx, lx, y + 26, 7, 3.5, (k % 2 ? 0.9 : -0.9) + sway);
  }
  // moss cap
  ctx.fillStyle = '#7fd06e';
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 9, 4.5);
  ctx.fill();
  ctx.fillStyle = '#a3e48d';
  ctx.beginPath();
  ctx.roundRect(x + 4, y - 4, w - 8, 3.5, 2);
  ctx.fill();
  drawDeco(ctx, 'sprout', { type: 'flower', x: x + w * 0.3, s: 0.9, c: i % 5, p: 0 }, y - 2, time);
  drawDeco(ctx, 'sprout', { type: 'tuft', x: x + w * 0.72, s: 0.9, p: 0 }, y - 2, time);
}

function ledgeMush(ctx, p, i, time) {
  const { x, y, w } = p;
  const [col, rgb] = MUSH.COLS[(i + 1) % 4];
  const cx = x + w / 2;
  // the stalk down to the floor
  const g = ctx.createLinearGradient(0, y, 0, GROUND);
  g.addColorStop(0, '#c6bdea');
  g.addColorStop(1, '#6e6aa0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - 12, y + 10);
  ctx.quadraticCurveTo(cx - 16, (y + GROUND) / 2, cx - 24, GROUND + 2);
  ctx.lineTo(cx + 24, GROUND + 2);
  ctx.quadraticCurveTo(cx + 16, (y + GROUND) / 2, cx + 12, y + 10);
  ctx.closePath();
  ctx.fill();
  const pulse = 0.75 + 0.25 * Math.sin(time * 1.4 + i);
  glow(ctx, cx, y + 16, w * 0.7, 40, rgb, 0.45 * pulse);
  // glowing gills underneath
  ctx.fillStyle = `rgba(${rgb},0.7)`;
  ctx.beginPath();
  ctx.ellipse(cx, y + 14, w / 2 - 4, 12, 0, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = -4; k <= 4; k++) {
    ctx.moveTo(cx + k * (w / 10), y + 14);
    ctx.lineTo(cx + k * (w / 12), y + 14 + 10 * Math.cos((k / 5) * 1.2));
  }
  ctx.stroke();
  // the flat cap
  ctx.fillStyle = mix(col, '#2a2d58', 0.2);
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 2, w + 12, 18, 9);
  ctx.fill();
  ctx.fillStyle = mix(col, '#ffffff', 0.1);
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 5, w + 12, 13, [9, 9, 4, 4]);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * pulse})`;
  for (let k = 0; k < 5; k++) ellipse(ctx, x + 16 + k * (w - 32) / 4, y + 1 + (k % 2) * 2, 5 - (k % 2), 2.4);
}

function ledgeBramble(ctx, p, i, time) {
  const { x, y, w } = p;
  // thick bramble vines up to the canopy
  for (const vx of [x + 22, x + w - 22]) {
    ctx.strokeStyle = '#3a2440';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(vx, 16);
    ctx.bezierCurveTo(vx - 10, y * 0.35, vx + 10, y * 0.7, vx, y + 4);
    ctx.stroke();
    ctx.fillStyle = '#3a2440';
    for (let yy = 40; yy < y - 6; yy += 22) {
      const side = (yy / 22) % 2 < 1 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(vx, yy - 3);
      ctx.lineTo(vx + side * 9, yy);
      ctx.lineTo(vx, yy + 3);
      ctx.fill();
    }
  }
  // the gnarled branch slab
  ctx.fillStyle = '#2e1e30';
  ctx.beginPath();
  ctx.roundRect(x - 6, y + 2, w + 12, 20, 10);
  ctx.fill();
  ctx.fillStyle = '#4a3448';
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 2, w + 12, 15, 7);
  ctx.fill();
  ctx.strokeStyle = 'rgba(210,200,240,0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 6);
  ctx.lineTo(x + w * 0.5, y + 6);
  ctx.moveTo(x + w * 0.6, y + 9);
  ctx.lineTo(x + w - 12, y + 9);
  ctx.stroke();
  // thorns underneath
  ctx.fillStyle = '#2e1e30';
  for (let k = 0; k < 7; k++) {
    const tx = x + 12 + k * (w - 24) / 6;
    ctx.beginPath();
    ctx.moveTo(tx - 4, y + 20);
    ctx.lineTo(tx + (k % 2 ? 2 : -2), y + 30 + (k % 3) * 3);
    ctx.lineTo(tx + 4, y + 20);
    ctx.fill();
  }
  // dull moss and berries on top
  ctx.fillStyle = '#56704e';
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 7, 3.5);
  ctx.fill();
  berry(ctx, x + w * 0.25, y + 18, 3.5, time + i);
  berry(ctx, x + w * 0.7, y + 20, 3.2, time + i + 2);
  drawDeco(ctx, 'bramble', { type: 'sprig', x: x + w * 0.55, s: 0.9, p: 0 }, y - 2, time);
}

// ——— floating ambience on top ———

function drawAmbient(ctx, theme, L, R, time) {
  if (theme === 'frost' || theme === 'star') return drawHighAmbient(ctx, theme, L, R, time);
  if (theme === 'sprout') {
    for (const p of SPROUT.pollen) {
      const x = p.x + Math.sin(time * 0.4 + p.p) * 24, y = p.y + Math.sin(time * 0.6 + p.p * 2) * 14;
      if (x < L || x > R) continue;
      const a = 0.4 + 0.4 * Math.sin(time * 1.5 + p.p);
      ctx.fillStyle = `rgba(255,240,170,${a})`;
      circle(ctx, x, y, 1.8 * p.s);
    }
  } else if (theme === 'mushroom') {
    for (const p of MUSH.spores) {
      const k = (time * 0.04 * p.s + p.p / TAU) % 1;
      const x = p.x + Math.sin(time * 0.5 + p.p) * 18, y = p.y - k * 120;
      if (x < L || x > R) continue;
      const a = Math.sin(k * Math.PI) * (0.6 + 0.4 * Math.sin(time * 3 + p.p));
      glow(ctx, x, y, 7 * p.s, 7 * p.s, p.rgb, a * 0.7);
      ctx.fillStyle = `rgba(${p.rgb},${a})`;
      circle(ctx, x, y, 1.6 * p.s);
    }
  } else {
    for (const p of BRAMBLE.petals) {
      const fall = (time * p.sp + p.y) % 470;
      const x = p.x + Math.sin(time * 0.7 + p.p) * 30 + fall * 0.2, y = fall - 10;
      if (x < L || x > R) continue;
      ctx.fillStyle = 'rgba(224,70,90,0.75)';
      ellipse(ctx, x, y, 3.4 * p.s, 1.8 * p.s, time * 2 + p.p);
    }
    for (const f of BRAMBLE.flies) {
      const x = f.x + Math.sin(time * 0.5 + f.p) * 30, y = f.y + Math.sin(time * 0.8 + f.p * 2) * 20;
      if (x < L || x > R) continue;
      const a = Math.max(0, Math.sin(time * 1.3 + f.p));
      glow(ctx, x, y, 9, 9, '255,220,160', a * 0.6);
      ctx.fillStyle = `rgba(255,236,190,${a})`;
      circle(ctx, x, y, 1.6);
    }
  }
}

// ——— the den entrance in the field ———

export function drawDenEntrance(ctx, x, groundY, theme, time) {
  if (ENTRANCE_ART[theme]) return ENTRANCE_ART[theme](ctx, x, groundY, time);
  const den = Math.max(0, DENS.findIndex((d) => d.theme === theme));
  const spec = MOBS[DENS[den]?.boss];
  const b = groundY;
  const mw = 46, mh = 104, mtop = b - mh; // the mouth
  const mouth = () => {
    ctx.beginPath();
    ctx.moveTo(x - mw, b + 2);
    ctx.lineTo(x - mw, mtop + mw);
    ctx.arc(x, mtop + mw, mw, Math.PI, 0);
    ctx.lineTo(x + mw, b + 2);
    ctx.closePath();
  };
  ctx.save();
  if (theme === 'sprout') {
    // the base of a giant hollow tree, its trunk rising off the top of the screen
    ctx.fillStyle = '#8f5f3a';
    ctx.beginPath();
    ctx.moveTo(x - 110, b + 4);
    ctx.bezierCurveTo(x - 78, b - 14, x - 70, b - 60, x - 68, b - 140);
    ctx.lineTo(x - 62, 0);
    ctx.lineTo(x + 62, 0);
    ctx.lineTo(x + 68, b - 140);
    ctx.bezierCurveTo(x + 70, b - 60, x + 78, b - 14, x + 110, b + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a8784e';
    ctx.beginPath();
    ctx.moveTo(x - 50, b);
    ctx.lineTo(x - 46, 0);
    ctx.lineTo(x + 20, 0);
    ctx.lineTo(x + 18, b);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,40,0.45)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const gx of [-40, -14, 30, 50]) {
      ctx.moveTo(x + gx, 10);
      ctx.quadraticCurveTo(x + gx + 6, b * 0.5, x + gx - 2, b - 120);
    }
    ctx.stroke();
    // roots
    ctx.fillStyle = '#7a5236';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + s * 60, b - 30);
      ctx.quadraticCurveTo(x + s * 100, b - 24, x + s * 130, b + 4);
      ctx.lineTo(x + s * 70, b + 4);
      ctx.fill();
    }
    // a leafy crown of moss on a knot above the mouth
    ctx.fillStyle = '#7fd06e';
    for (let i = 0; i < 5; i++) ellipse(ctx, x - 40 + i * 20, mtop - 22 + Math.abs(i - 2) * 4, 14, 8);
  } else if (theme === 'mushroom') {
    // a mossy rock mound with mushrooms growing all over it
    ctx.fillStyle = '#7a6a8a';
    ctx.beginPath();
    ctx.moveTo(x - 112, b + 4);
    ctx.bezierCurveTo(x - 108, b - 110, x - 60, b - 160, x, b - 162);
    ctx.bezierCurveTo(x + 60, b - 160, x + 108, b - 110, x + 112, b + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8f80a0';
    ellipse(ctx, x - 40, b - 128, 36, 18, -0.4);
    ctx.fillStyle = '#6cbf93';
    ctx.beginPath();
    ctx.moveTo(x - 90, b - 100);
    ctx.bezierCurveTo(x - 60, b - 175, x + 60, b - 175, x + 92, b - 96);
    ctx.quadraticCurveTo(x + 60, b - 118, x + 30, b - 128);
    ctx.quadraticCurveTo(x, b - 120, x - 30, b - 130);
    ctx.quadraticCurveTo(x - 60, b - 116, x - 90, b - 100);
    ctx.fill();
    const shrooms = [[-78, 30, 13, '#ff8f9f'], [-56, 18, 10, '#ffc48a'], [70, 22, 14, '#c9a6ff'], [90, 12, 9, '#ff8f9f'], [16, 150, 16, '#ff8f9f'], [-14, 142, 10, '#c9a6ff']];
    for (const [dx, hh, r, c] of shrooms) {
      const sy = dx > -20 && dx < 30 ? b - hh : b - hh;
      ctx.fillStyle = '#fff4e6';
      ctx.fillRect(x + dx - r * 0.25, sy - r * 0.2, r * 0.5, Math.min(hh, r * 1.4));
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + dx, sy - r * 0.2, r, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff';
      circle(ctx, x + dx - r * 0.4, sy - r * 0.6, r * 0.18);
      circle(ctx, x + dx + r * 0.35, sy - r * 0.45, r * 0.13);
    }
  } else if (theme === 'frost' || theme === 'star') {
    entranceHigh(ctx, x, b, theme, time);
  } else {
    // a dark tangle of brambles heaped into a mound
    ctx.fillStyle = '#4a3040';
    ctx.beginPath();
    ctx.moveTo(x - 116, b + 4);
    ctx.bezierCurveTo(x - 110, b - 120, x - 50, b - 168, x, b - 166);
    ctx.bezierCurveTo(x + 50, b - 168, x + 110, b - 120, x + 116, b + 4);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 6; i++) drawThornArc(ctx, x - 108 + i * 28, b + 2 - (i % 2) * 30, 64 + (i % 3) * 12, 46 + (i % 2) * 34, i, time, i % 2 ? [0.3] : null);
    ctx.fillStyle = '#4a3040';
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.08 + i * 0.105);
      const tx = x + Math.cos(a) * 112, ty = b - 8 + Math.sin(a) * 160;
      ctx.beginPath();
      ctx.moveTo(tx + Math.cos(a + 1.5) * 6, ty + Math.sin(a + 1.5) * 6);
      ctx.lineTo(tx + Math.cos(a) * 18, ty + Math.sin(a) * 18);
      ctx.lineTo(tx + Math.cos(a - 1.5) * 6, ty + Math.sin(a - 1.5) * 6);
      ctx.fill();
    }
  }
  // the dark mouth, with something peeking out
  const mg = ctx.createLinearGradient(0, mtop, 0, b);
  mg.addColorStop(0, '#1a1226');
  mg.addColorStop(1, '#2e2238');
  ctx.fillStyle = mg;
  mouth();
  ctx.fill();
  if (theme === 'star') {
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = `rgba(255,240,200,${0.4 + 0.4 * Math.sin(time * 2 + i * 1.7)})`;
      circle(ctx, x - 34 + ((i * 37) % 68), mtop + 18 + ((i * 53) % 80), 1.3);
    }
  }
  ctx.strokeStyle = { sprout: '#6a4630', mushroom: '#5a4a6a', bramble: '#2a1830', frost: '#8fb8de', star: '#2a2458' }[theme];
  ctx.lineWidth = 5;
  mouth();
  ctx.stroke();
  // fangs (ominous but cute: rounded little teeth)
  ctx.fillStyle = { sprout: '#d4a77a', mushroom: '#a89ab8', bramble: '#5e3a55', frost: '#e8f6ff', star: '#8a7cd0' }[theme];
  for (const fx of [-24, -8, 8, 24]) {
    const fy = mtop + mw - Math.sqrt(Math.max(0, mw * mw - fx * fx)) + 2;
    ctx.beginPath();
    ctx.moveTo(fx + x - 6, fy);
    ctx.quadraticCurveTo(x + fx, fy + (Math.abs(fx) < 10 ? 18 : 12) + 4, x + fx + 6, fy);
    ctx.fill();
  }
  const eyeCol = { sprout: '255,236,140', mushroom: '200,170,255', bramble: '255,110,90', frost: '170,230,255', star: '255,226,140' }[theme];
  const peek = Math.sin(time * 0.7 + den * 2);
  const blink = ((time + den) % 3.7) < 0.14;
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
  ctx.strokeStyle = `rgba(${eyeCol},0.8)`; // angry little brows
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(ex - 17, ey - 10);
  ctx.lineTo(ex - 6, ey - 6);
  ctx.moveTo(ex + 17, ey - 10);
  ctx.lineTo(ex + 6, ey - 6);
  ctx.stroke();
  // the warning sign on a post to the left
  const sx = x - 118;
  const SIGN = { sprout: ['#c99b6b', '#8f6240'], mushroom: ['#b98fa0', '#8a6274'], bramble: ['#8c707a', '#5e4a56'], frost: ['#7fb0dc', '#4a78a8'], star: ['#4a3f8a', '#c9a64a'] }[theme] ?? ['#c99b6b', '#8f6240'];
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
  // red BOSS tag on top
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
}

// ——— bosses ———

const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);

// m = { kind, x, y (feet), facing, walking, vy, hurt, dying, t, seed, warn, charging, enraged, slow }
export function drawBoss(ctx, m, time) {
  const spec = MOBS[m.kind];
  if (!spec) return;
  // a rooted boss (spec.still: Ladon's body, a hill of briar) barely reacts: no squash, shove or turning round on a
  // hit, a faint flash, a smaller wind-up (owner, 2026-10-26: the squash made it look weird)
  const rooted = !!spec.still;
  const dying = clamp(m.dying ?? 0, 0, 1), hurt = rooted ? 0 : clamp(m.hurt ?? 0, 0, 1), flash = clamp(m.hurt ?? 0, 0, 1) * (rooted ? 0.25 : 1);
  const alive = dying < 0.02;
  const slow = !!m.slow, warn = !!m.warn && alive, charging = !!m.charging && alive, enr = !!m.enraged;
  const rate = slow ? 0.4 : enr ? 1.4 : 1;
  const t = (m.t ?? time) * rate, seed = m.seed ?? 0, facing = rooted || m.facing >= 0 ? 1 : -1;
  const vy = m.vy ?? 0;
  let sx = 1, sy = 1;
  const airborne = Math.abs(vy) > 1;
  if (airborne) {
    const air = clamp(-vy / 700, -0.35, 0.35);
    sx -= air * 0.3;
    sy += air * 0.4;
  } else {
    const k = Math.sin(t * (m.walking ? 9 : 2.4) + seed) * (m.walking ? 0.04 : rooted ? 0.01 : 0.025);
    sx += k;
    sy -= k;
  }
  if (warn && !rooted) {
    const k = 0.5 + 0.5 * Math.sin(time * 16);
    sx += 0.08 + 0.03 * k;
    sy -= 0.1 + 0.03 * k;
  }
  if (charging) {
    sx += 0.06;
    sy -= 0.05;
  }
  sx += hurt * 0.1;
  sy -= hurt * 0.09;
  sx *= 1 + dying * 0.45;
  sy *= 1 - dying * 0.75;
  const w = spec.w * sx, h = spec.h * sy;
  const st = { t, seed, enr, warn, charging, dying, walking: !!m.walking, airborne, time };

  ctx.save();
  let ox = -facing * hurt * 8;
  if (warn) ox += Math.sin(time * 70) * (rooted ? 0.8 : 2.4);
  else if (enr && alive) ox += Math.sin(time * 41) * 0.8;
  ctx.translate(m.x + ox, m.y);
  // shadow
  ctx.fillStyle = 'rgba(25,15,35,0.25)';
  ellipse(ctx, 0, 1, spec.w * 0.48 * (airborne ? 0.75 : 1), 8);
  if (charging) drawSpeedLines(ctx, facing, spec, time);
  if (warn) glow(ctx, 0, -h * 0.5, w * 0.85, h * 0.75, '255,110,80', 0.35 + 0.2 * Math.sin(time * 16));
  if (enr && alive) glow(ctx, 0, -h * 0.5, w * 0.8, h * 0.7, '255,70,60', 0.18 + 0.08 * Math.sin(time * 6));

  ctx.save();
  ctx.globalAlpha = 1 - dying ** 1.5;
  ctx.scale(facing, 1);
  if (charging) ctx.transform(1, 0, -0.2, 1, 0, 0); // lean into the dash
  let sil;
  if (m.kind === 'sprout_king') sil = drawSproutKing(ctx, w, h, st);
  else if (m.kind === 'mother_mushroom') sil = drawMotherMushroom(ctx, w, h, st);
  else if (m.kind === 'frost_queen') sil = drawFrostQueen(ctx, w, h, st);
  else if (m.kind === 'astral_wyrm') sil = drawAstralWyrm(ctx, w, h, st);
  else if (BOSS_ART[m.kind]) sil = BOSS_ART[m.kind](ctx, w, h, st, m);
  else sil = drawBehemoth(ctx, w, h, st);
  if (warn) {
    ctx.save();
    ctx.strokeStyle = `rgba(255,120,90,${0.6 + 0.35 * Math.sin(time * 16)})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(255,80,60,0.9)';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    sil();
    ctx.stroke();
    ctx.restore();
  }
  if (slow && dying < 0.5) drawFrost(ctx, sil, w, h, t, seed);
  if (flash > 0.01) {
    ctx.fillStyle = `rgba(255,${Math.round(150 + 105 * flash)},${Math.round(160 + 95 * flash)},${0.7 * flash})`;
    ctx.beginPath();
    sil();
    ctx.fill();
  }
  ctx.restore();

  if (enr && alive) drawSteam(ctx, spec, h, time, seed);
  if (warn) {
    // a bouncing "!" over its head
    const by = -h - 30 - Math.abs(Math.sin(time * 8)) * 6;
    ctx.fillStyle = '#ff6a5a';
    ctx.strokeStyle = '#fffaf0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, by, 13, 0, TAU);
    ctx.fill();
    ctx.stroke();
    text(ctx, '!', 0, by + 1, 18, '#fffaf0');
  }
  ctx.restore();
}

function drawSpeedLines(ctx, facing, spec, time) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const k = (time * 3 + i * 0.37) % 1;
    const y = -spec.h * (0.12 + ((i * 0.618) % 1) * 0.75);
    const x0 = -facing * (spec.w * 0.45 + k * 70), len = 30 + (i % 3) * 18;
    ctx.strokeStyle = `rgba(255,255,255,${0.75 * (1 - k)})`;
    ctx.lineWidth = 3 - (i % 2);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 - facing * len, y);
    ctx.stroke();
  }
  // dust kicked up behind
  for (let i = 0; i < 4; i++) {
    const k = (time * 2.4 + i * 0.25) % 1;
    ctx.fillStyle = `rgba(230,215,195,${0.55 * (1 - k)})`;
    circle(ctx, -facing * (spec.w * 0.35 + k * 50), -4 - k * 16, 6 + k * 10);
  }
  ctx.restore();
}

function drawSteam(ctx, spec, h, time, seed) {
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.9 + i / 3 + seed) % 1;
    const side = i % 2 ? 1 : -1;
    ctx.fillStyle = `rgba(255,240,240,${0.55 * Math.sin(k * Math.PI)})`;
    circle(ctx, side * spec.w * (0.18 + k * 0.12), -h - 6 - k * 34, 6 + k * 9);
  }
  ctx.fillStyle = '#ffb04a';
  for (let i = 0; i < 4; i++) {
    const k = (time * 1.7 + i * 0.27 + seed) % 1;
    const a = i * 1.7 + seed * 5;
    ctx.globalAlpha = 1 - k;
    star(ctx, Math.cos(a) * spec.w * (0.4 + k * 0.3), -h * 0.6 + Math.sin(a) * h * 0.4 - k * 20, 3.5);
  }
  ctx.globalAlpha = 1;
}

// Frozen by Frost Nova: an icy glaze, a frosty rim and ice shards
function drawFrost(ctx, sil, w, h, t, seed) {
  ctx.save();
  ctx.fillStyle = 'rgba(150,215,255,0.42)';
  ctx.beginPath();
  sil();
  ctx.fill();
  ctx.strokeStyle = 'rgba(235,250,255,0.9)';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  const r = mulberry32(Math.floor(seed * 1000) + 17);
  for (let i = 0; i < 7; i++) {
    const cx = (r() - 0.5) * w * 0.8, cy = -h * (0.25 + r() * 0.65), s = 5 + r() * 4, a = r() * TAU;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.fillStyle = 'rgba(225,245,255,0.95)';
    ctx.strokeStyle = '#7ab8e8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.5);
    ctx.lineTo(s * 0.6, 0);
    ctx.lineTo(0, s * 1.2);
    ctx.lineTo(-s * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // icicles along the bottom
  ctx.fillStyle = 'rgba(225,245,255,0.9)';
  for (let i = 0; i < 6; i++) {
    const ix = -w * 0.35 + i * w * 0.14;
    ctx.beginPath();
    ctx.moveTo(ix - 4, -h * 0.12);
    ctx.lineTo(ix, -h * 0.12 + 9 + (i % 2) * 5);
    ctx.lineTo(ix + 4, -h * 0.12);
    ctx.fill();
  }
  const g = (t * 0.6 + seed) % 1;
  ctx.fillStyle = `rgba(255,255,255,${Math.sin(g * Math.PI) * 0.9})`;
  star(ctx, -w * 0.3 + g * w * 0.6, -h * 0.75, 4);
  ctx.restore();
}

// Shared eye drawing for the bosses. mood: 'smug' | 'kind' | 'angry' | 'glow'
function bossEyes(ctx, fx, fy, gap, size, st, mood, eyeRgb) {
  const { t, seed, dying } = st;
  ctx.strokeStyle = '#2d2a3e';
  ctx.fillStyle = '#2d2a3e';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const blink = ((t + seed * 7) % 3.8) < 0.13;
  for (const s of [-1, 1]) {
    const ex = fx + s * gap;
    if (dying > 0.02) {
      ctx.lineWidth = 3 * size;
      const d = 3.4 * size;
      ctx.beginPath();
      ctx.moveTo(ex - d, fy - d); ctx.lineTo(ex + d, fy + d);
      ctx.moveTo(ex + d, fy - d); ctx.lineTo(ex - d, fy + d);
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
    if (mood === 'kind') {
      // happy closed eyes
      ctx.lineWidth = 2.6 * size;
      ctx.beginPath();
      ctx.arc(ex, fy + 1.5 * size, 4 * size, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
      continue;
    }
    ctx.fillStyle = '#2d2a3e';
    ellipse(ctx, ex, fy, 3.4 * size, blink ? 0.8 : 4.6 * size);
    if (!blink) {
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 1.1 * size, fy - 1.8 * size, 1.3 * size, 1.3 * size);
    }
    if (mood === 'regal' && !blink) {
      ctx.strokeStyle = '#2d2a3e';
      ctx.lineWidth = 1.6 * size;
      ctx.beginPath();
      for (const [lx, ly] of [[3.2, -3.6], [4.2, -1.6]]) {
        ctx.moveTo(ex + s * lx * size * 0.8, fy + ly * size);
        ctx.lineTo(ex + s * (lx + 2.6) * size, fy + (ly - 1.6) * size);
      }
      ctx.stroke();
    }
    if (mood === 'smug' && !blink) {
      // heavy half-lids
      ctx.fillStyle = st.lidCol;
      ctx.beginPath();
      ctx.ellipse(ex, fy, 4.6 * size, 5.6 * size, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#2d2a3e';
      ctx.lineWidth = 2 * size;
      ctx.beginPath();
      ctx.moveTo(ex - 4.6 * size, fy);
      ctx.lineTo(ex + 4.6 * size, fy - 0.4 * size);
      ctx.stroke();
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
  } else if (mood === 'smug') {
    // one brow cocked up
    ctx.moveTo(fx - gap - 4.5 * size, fy - 8 * size);
    ctx.quadraticCurveTo(fx - gap, fy - 9.5 * size, fx - gap + 4.5 * size, fy - 8 * size);
    ctx.moveTo(fx + gap - 4.5 * size, fy - 10 * size);
    ctx.quadraticCurveTo(fx + gap, fy - 14 * size, fx + gap + 5 * size, fy - 11 * size);
  } else {
    ctx.moveTo(fx - gap - 4 * size, fy - 7.5 * size);
    ctx.quadraticCurveTo(fx - gap, fy - 10 * size, fx - gap + 4 * size, fy - 8 * size);
    ctx.moveTo(fx + gap - 4 * size, fy - 8 * size);
    ctx.quadraticCurveTo(fx + gap, fy - 10 * size, fx + gap + 4 * size, fy - 7.5 * size);
  }
  ctx.stroke();
}

function cheeks(ctx, fx, fy, gap, size, enr) {
  ctx.fillStyle = enr ? 'rgba(255,90,90,0.6)' : 'rgba(255,140,170,0.55)';
  ellipse(ctx, fx - gap - 4 * size, fy + 7 * size, 5 * size, 3 * size);
  ellipse(ctx, fx + gap + 4 * size, fy + 7 * size, 5 * size, 3 * size);
}

// Sprout King: a big round sprout bulb with a leafy crown, a leaf cape and a twig sceptre
function drawSproutKing(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const bh = h * 0.84; // the bulb (the crown sits on top)
  const outline = rageCol('#4f9d5c', enr, 0.12);
  const body = () => {
    ctx.moveTo(0, -bh);
    ctx.bezierCurveTo(w * 0.3, -bh * 0.98, w * 0.56, -bh * 0.62, w * 0.5, -bh * 0.28);
    ctx.bezierCurveTo(w * 0.46, -bh * 0.02, w * 0.24, 0, 0, 0);
    ctx.bezierCurveTo(-w * 0.24, 0, -w * 0.46, -bh * 0.02, -w * 0.5, -bh * 0.28);
    ctx.bezierCurveTo(-w * 0.56, -bh * 0.62, -w * 0.3, -bh * 0.98, 0, -bh);
    ctx.closePath();
  };
  const step = st.walking ? Math.sin(t * 9 + seed) : 0;
  // the leaf cape behind, billowing out when it dashes
  const billow = charging ? 0.5 : Math.sin(t * 1.5 + seed) * 0.06 + step * 0.04;
  for (const [dx, rot, col] of [[-0.08, 0.28, '#4f9d5c'], [0.02, 0.1, '#5fb85a']]) {
    ctx.save();
    ctx.translate(-w * 0.12 + dx * w, -bh * 0.72);
    ctx.rotate(rot + billow);
    ctx.fillStyle = rageCol(col, enr, 0.12);
    ctx.strokeStyle = rageCol('#3f7d4a', enr, 0.12);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-w * 0.55, h * 0.05, -w * 0.62, h * 0.5, -w * 0.38, h * 0.7);
    ctx.bezierCurveTo(-w * 0.2, h * 0.55, -w * 0.05, h * 0.3, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2, 4);
    ctx.quadraticCurveTo(-w * 0.35, h * 0.25, -w * 0.36, h * 0.62);
    ctx.stroke();
    ctx.restore();
  }
  // root feet
  ctx.fillStyle = '#c9a07a';
  ctx.strokeStyle = '#9a7454';
  ctx.lineWidth = 2;
  for (const [fx, ph] of [[-w * 0.2, 1], [w * 0.2, -1]]) {
    ctx.beginPath();
    ctx.ellipse(fx + ph * step * 3, -4 - Math.max(0, ph * step) * 4, 12, 7, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // bulb
  const g = ctx.createLinearGradient(0, -bh, 0, 0);
  g.addColorStop(0, rageCol('#dcf9b8', enr, 0.12));
  g.addColorStop(1, rageCol('#7cc86e', enr, 0.12));
  ctx.fillStyle = g;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3.2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, -w * 0.22, -bh * 0.66, w * 0.08, bh * 0.12, -0.5);
  // a lighter belly
  ctx.fillStyle = 'rgba(255,255,240,0.35)';
  ellipse(ctx, w * 0.06, -bh * 0.22, w * 0.28, bh * 0.16);
  // the crown: a ring of leaves on a golden band, a sprout poking out of the middle
  ctx.save();
  ctx.translate(0, -bh + 6);
  ctx.rotate(-0.06 + Math.sin(t * 2 + seed) * 0.04);
  const flop = Math.sin(t * 3 + seed) * 0.12 + (st.airborne ? 0.3 : 0);
  ctx.strokeStyle = '#4f9d5c';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, -26);
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(0, -26);
    ctx.rotate(side * (0.55 + flop));
    ctx.fillStyle = side > 0 ? '#8ad87a' : '#6cc96a';
    ctx.strokeStyle = '#4f9d5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(side * 9, -13, side * 22, -6);
    ctx.quadraticCurveTo(side * 11, 4, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  const cw = w * 0.28;
  for (let i = 0; i < 5; i++) {
    const lx = -cw + (i / 4) * cw * 2, tall = i === 2 ? 26 : i % 2 ? 20 : 16;
    ctx.fillStyle = i % 2 ? '#a3e48d' : '#7fd06e';
    ctx.strokeStyle = '#4f9d5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx - 8, -2);
    ctx.quadraticCurveTo(lx - 7, -tall * 0.7, lx + (lx < 0 ? -2 : 2) * 0.5, -tall);
    ctx.quadraticCurveTo(lx + 7, -tall * 0.7, lx + 8, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#ffcf4d';
  ctx.strokeStyle = '#d9a23a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-cw - 9, -6, cw * 2 + 18, 10, 5);
  ctx.fill();
  ctx.stroke();
  for (const [gx, col] of [[-cw * 0.6, '#ff8fa8'], [0, '#9fdcff'], [cw * 0.6, '#ff8fa8']]) {
    ctx.fillStyle = col;
    circle(ctx, gx, -1, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    circle(ctx, gx - 1, -2, 1);
  }
  ctx.restore();
  // face
  const fx = w * 0.16, fy = -bh * 0.48, gap = 12;
  st.lidCol = rageCol('#b8ea9a', enr, 0.12);
  const mood = warn || enr ? 'angry' : 'smug';
  bossEyes(ctx, fx, fy, gap, 1.3, st, mood);
  cheeks(ctx, fx, fy, gap, 1.3, enr);
  if (dying < 0.02) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (warn || charging) {
      ctx.fillStyle = '#7a3a4a';
      ctx.ellipse(fx, fy + 15, 6, warn ? 6 : 4.5, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    } else if (enr) {
      ctx.moveTo(fx - 8, fy + 17);
      ctx.quadraticCurveTo(fx, fy + 11, fx + 8, fy + 17);
      ctx.stroke();
    } else {
      // a smug smirk, higher on one side
      ctx.moveTo(fx - 7, fy + 13);
      ctx.quadraticCurveTo(fx + 1, fy + 18, fx + 9, fy + 10);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(fx, fy + 18, 5, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  }
  // a little leaf hand holding a twig sceptre with a flower on top
  const raise = warn ? -0.9 : charging ? 0.6 : Math.sin(t * 1.4 + seed) * 0.08;
  ctx.save();
  ctx.translate(w * 0.42, -bh * 0.32);
  ctx.rotate(raise);
  ctx.strokeStyle = '#9a7454';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(4, -34);
  ctx.stroke();
  ctx.fillStyle = '#ffb3c7';
  for (let i = 0; i < 5; i++) circle(ctx, 4 + Math.cos(i * 1.26) * 5, -38 + Math.sin(i * 1.26) * 5, 4);
  ctx.fillStyle = '#ffcf4d';
  circle(ctx, 4, -38, 3.2);
  ctx.fillStyle = '#7fd06e';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(1, 0, 9, 6, -0.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  return body;
}

// Mother Mushroom: a huge, motherly spotted mushroom with a gill-frill shawl and spore puffs
function drawMotherMushroom(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const capY = -h * 0.56, capR = w * 0.62, capH = h * 0.44;
  const step = st.walking ? Math.sin(t * 7 + seed) : 0;
  const stemW = w * 0.58;
  const capPath = () => {
    ctx.moveTo(-capR, capY + 4);
    ctx.bezierCurveTo(-capR * 1.02, capY - capH * 1.35, capR * 1.02, capY - capH * 1.35, capR, capY + 4);
    ctx.quadraticCurveTo(0, capY + 18, -capR, capY + 4);
    ctx.closePath();
  };
  const stemPath = () => {
    ctx.roundRect(-stemW / 2, capY, stemW, -capY - 2, [10, 10, stemW * 0.42, stemW * 0.42]);
  };
  const sil = () => {
    stemPath();
    capPath();
  };
  // feet
  ctx.fillStyle = '#e8c9a8';
  ctx.strokeStyle = '#b88a6a';
  ctx.lineWidth = 2;
  for (const [fx, ph] of [[-w * 0.18, 1], [w * 0.18, -1]]) {
    ctx.beginPath();
    ctx.ellipse(fx + ph * step * 3, -4 - Math.max(0, ph * step) * 4, 14, 8, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // stem
  const g = ctx.createLinearGradient(0, capY, 0, 0);
  g.addColorStop(0, '#fff8ee');
  g.addColorStop(1, rageCol('#f0d6bc', enr));
  ctx.fillStyle = g;
  ctx.beginPath();
  stemPath();
  ctx.fill();
  ctx.strokeStyle = '#c9a07a';
  ctx.lineWidth = 3;
  ctx.stroke();
  // little arms, folded in front (or thrown up when she warns)
  ctx.fillStyle = '#fff3e4';
  ctx.strokeStyle = '#c9a07a';
  ctx.lineWidth = 2.4;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * stemW * 0.48, capY + h * 0.24);
    ctx.rotate(warn ? s * -1.9 : s * (0.5 + Math.sin(t * 1.6 + seed) * 0.08));
    ctx.beginPath();
    ctx.ellipse(0, 10, 8, 15, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // face
  const fx = w * 0.06, fy = -h * 0.3, gap = 14;
  const mood = warn || enr ? 'angry' : 'kind';
  bossEyes(ctx, fx, fy, gap, 1.3, st, mood);
  cheeks(ctx, fx, fy, gap, 1.3, enr);
  if (dying < 0.02) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (warn || charging) {
      ctx.fillStyle = '#7a3a4a';
      ctx.ellipse(fx, fy + 14, 7, 6, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    } else if (enr) {
      ctx.arc(fx, fy + 19, 6, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
    } else {
      ctx.arc(fx, fy + 9, 6, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
  // the gill frill, draped like a shawl over her shoulders
  const fr = capR * 0.92, fd = 26;
  ctx.fillStyle = rageCol('#f7d9cc', enr);
  ctx.strokeStyle = '#d9a090';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-fr, capY + 4);
  const n = 9;
  for (let i = 0; i < n; i++) {
    const x0 = -fr + (2 * fr * i) / n, x1 = -fr + (2 * fr * (i + 1)) / n;
    const drop = fd * Math.sin(((i + 0.5) / n) * Math.PI) ** 0.6;
    ctx.quadraticCurveTo((x0 + x1) / 2, capY + 6 + drop * 1.25, x1, capY + 4 + drop * 0.55);
  }
  ctx.lineTo(fr, capY);
  ctx.lineTo(-fr, capY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,130,120,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 1; i < 14; i++) {
    const gx = -fr + (2 * fr * i) / 14;
    ctx.moveTo(gx, capY + 4);
    ctx.lineTo(gx * 1.04, capY + 6 + fd * 0.6 * Math.sin((i / 14) * Math.PI));
  }
  ctx.stroke();
  // cap
  const cg = ctx.createLinearGradient(0, capY - capH, 0, capY);
  cg.addColorStop(0, rageCol('#ffb0c4', enr));
  cg.addColorStop(1, rageCol('#e8708e', enr));
  ctx.fillStyle = cg;
  ctx.beginPath();
  capPath();
  ctx.fill();
  ctx.strokeStyle = rageCol('#b84a6a', enr);
  ctx.lineWidth = 3.2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = '#fff8f0';
  for (const [sx, sy, sr] of [[-0.62, 0.3, 0.13], [-0.28, 0.72, 0.17], [0.2, 0.85, 0.12], [0.55, 0.45, 0.16], [0.05, 0.4, 0.1], [-0.05, 1.02, 0.08]]) {
    ellipse(ctx, sx * capR, capY - sy * capH, sr * capR, sr * capR * 0.72);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ellipse(ctx, -capR * 0.5, capY - capH * 0.75, capR * 0.16, capH * 0.1, -0.6);
  // a flower tucked on the brim
  ctx.fillStyle = '#fffaf0';
  for (let i = 0; i < 5; i++) circle(ctx, capR * 0.72 + Math.cos(i * 1.26) * 6, capY - 10 + Math.sin(i * 1.26) * 6, 5);
  ctx.fillStyle = '#ffcf4d';
  circle(ctx, capR * 0.72, capY - 10, 4);
  // spore puffs drifting up from the cap
  if (dying < 0.02) {
    for (let i = 0; i < 4; i++) {
      const k = (t * (enr ? 0.7 : 0.4) + i / 4 + seed) % 1;
      const px = (-0.5 + i * 0.33) * capR + Math.sin(k * 5 + i) * 8;
      const py = capY - capH * 1.05 - k * 50;
      const a = Math.sin(k * Math.PI) * 0.75;
      ctx.fillStyle = enr ? `rgba(255,180,170,${a})` : `rgba(235,220,255,${a})`;
      circle(ctx, px, py, 5 + k * 6);
      circle(ctx, px + 6 + k * 3, py + 3, 3.5 + k * 4);
      ctx.fillStyle = `rgba(200,170,255,${a})`;
      circle(ctx, px - 2, py - 2, 1.4);
    }
  }
  return sil;
}

// Bramble Behemoth: a hulking plum hedgehog-beast wrapped in thorny vines, with glowing eyes
function drawBehemoth(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const cx = -w * 0.06, cy = -h * 0.54, rx = w * 0.44, ry = h * 0.44;
  const hx = w * 0.3, hy = -h * 0.42, hrx = w * 0.2, hry = h * 0.27; // head
  const step = st.walking || charging ? Math.sin(t * (charging ? 18 : 9) + seed) : 0;
  const outline = '#2e1a30';
  const sil = () => {
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.moveTo(hx + hrx, hy);
    ctx.ellipse(hx, hy, hrx, hry, 0.1, 0, TAU);
  };
  // legs
  for (const [lx, ph] of [[-w * 0.32, 1], [-w * 0.12, -1], [w * 0.12, 1], [w * 0.3, -1]]) {
    const lift = Math.max(0, ph * step) * 5, sw = ph * step * 4;
    ctx.fillStyle = rageCol('#4e2e4c', enr);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(lx - 12 + sw, -h * 0.3 - lift, 24, h * 0.3 - 2, [6, 6, 10, 10]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f2e6d8';
    for (const c of [-7, 0, 7]) ellipse(ctx, lx + sw + c, -3 - lift, 3, 2.6);
  }
  // back spikes, drawn first so the body covers their roots
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (0.92 + (i / (n - 1)) * 0.86) + Math.sin(t * 5 + i + seed) * 0.025;
    const bx = cx + Math.cos(a) * rx * 0.85, by = cy + Math.sin(a) * ry * 0.85;
    const len = (enr ? 30 : 24) + (i % 2) * 8;
    const tx = cx + Math.cos(a) * (rx + len), ty = cy + Math.sin(a) * (ry + len);
    const px = -Math.sin(a) * 11, py = Math.cos(a) * 11;
    ctx.fillStyle = rageCol(i % 2 ? '#5a3456' : '#6a3e64', enr);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + px, by + py);
    ctx.quadraticCurveTo((bx + tx) / 2 + px * 0.35, (by + ty) / 2 + py * 0.35, tx, ty);
    ctx.quadraticCurveTo((bx + tx) / 2 - px * 0.35, (by + ty) / 2 - py * 0.35, bx - px, by - py);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = enr ? '#ff9a7a' : '#c99ab8';
    circle(ctx, tx - Math.cos(a) * 3, ty - Math.sin(a) * 3, 2.2);
  }
  // body
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, rageCol('#8a5a82', enr));
  g.addColorStop(1, rageCol('#4e2e4c', enr));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ellipse(ctx, cx - rx * 0.4, cy - ry * 0.5, rx * 0.2, ry * 0.14, -0.4);
  // thorny vines wrapped around it, with red berries
  ctx.strokeStyle = '#3e5a36';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const vines = [
    [[cx - rx * 0.9, cy - ry * 0.2], [cx - rx * 0.2, cy - ry * 1.05], [cx + rx * 0.5, cy - ry * 0.3], [cx + rx * 0.75, cy + ry * 0.5]],
    [[cx - rx * 0.95, cy + ry * 0.35], [cx - rx * 0.4, cy - ry * 0.2], [cx + rx * 0.1, cy + ry * 0.75], [cx + rx * 0.45, cy + ry * 0.9]],
  ];
  for (const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] of vines) {
    ctx.strokeStyle = '#2e4a2a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
    ctx.stroke();
    ctx.strokeStyle = '#5a7a48';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#2e4a2a';
    for (let k = 0.1; k < 0.95; k += 0.14) {
      const u = 1 - k;
      const px = u ** 3 * x0 + 3 * u * u * k * x1 + 3 * u * k * k * x2 + k ** 3 * x3;
      const py = u ** 3 * y0 + 3 * u * u * k * y1 + 3 * u * k * k * y2 + k ** 3 * y3;
      const d = Math.round(k * 50) % 2 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(px - 3.5, py);
      ctx.lineTo(px + 1, py + d * 10);
      ctx.lineTo(px + 3.5, py);
      ctx.fill();
    }
    const u = 0.45, px = (1 - u) ** 3 * x0 + 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u * u * x2 + u ** 3 * x3;
    const py = (1 - u) ** 3 * y0 + 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u * u * y2 + u ** 3 * y3;
    berry(ctx, px, py + 5, 4.5, st.time);
    berry(ctx, px + 8, py + 2, 3.8, st.time + 1);
    ctx.fillStyle = '#6a9a5a';
    ellipse(ctx, px - 8, py - 3, 7, 3.4, -0.5);
  }
  // head
  ctx.fillStyle = rageCol('#7a4a72', enr);
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(hx, hy, hrx, hry, 0.1, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rageCol('#c9a0b4', enr);
  ctx.beginPath();
  ctx.ellipse(hx + hrx * 0.2, hy + hry * 0.25, hrx * 0.7, hry * 0.6, 0.1, 0, TAU);
  ctx.fill();
  // ear with a thorn
  ctx.fillStyle = rageCol('#6a3e64', enr);
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(hx - hrx * 0.45, hy - hry * 0.85, 9, 11, -0.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8b0c4';
  ellipse(ctx, hx - hrx * 0.45, hy - hry * 0.83, 4.5, 6, -0.4);
  // snout, nose and little tusks
  ctx.fillStyle = rageCol('#e8c8cc', enr);
  ctx.strokeStyle = '#9a6a80';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(hx + hrx * 0.9, hy + hry * 0.25, 15, 12, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a1e34';
  ellipse(ctx, hx + hrx * 1.05, hy + hry * 0.1, 6.5, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  circle(ctx, hx + hrx * 1.02, hy + hry * 0.03, 1.6);
  ctx.fillStyle = '#fff4e6';
  ctx.strokeStyle = '#b8a090';
  ctx.lineWidth = 1.4;
  for (const tx of [hx + hrx * 0.55, hx + hrx * 0.95]) {
    ctx.beginPath();
    ctx.moveTo(tx - 4, hy + hry * 0.62);
    ctx.quadraticCurveTo(tx - 3, hy + hry * 0.62 - 12, tx + 3, hy + hry * 0.62 - 15);
    ctx.quadraticCurveTo(tx + 1, hy + hry * 0.62 - 6, tx + 4, hy + hry * 0.62);
    ctx.fill();
    ctx.stroke();
  }
  // glowing eyes
  const fx = hx + hrx * 0.05, fy = hy - hry * 0.2;
  const eyeRgb = enr ? '255,90,60' : warn ? '255,170,80' : '255,214,110';
  bossEyes(ctx, fx, fy, 11, 1.2, st, 'glow', eyeRgb);
  if (dying < 0.02) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    if (warn || charging) {
      ctx.fillStyle = '#4a1e30';
      ctx.ellipse(hx + hrx * 0.7, hy + hry * 0.72, 7, 4.5, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.arc(hx + hrx * 0.72, hy + hry * 0.85, 5, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
    }
  }
  return sil;
}

// ——— boss attack effects ———

const FXPAL = {
  sprout: { debris: ['#7fd06e', '#a3e48d', '#5fb85a', '#ffe28a'], dust: '230,210,170', crack: '#6a4630', warn: '255,96,80', jelly: ['#a3e48d', '#7fd06e', '#d4f7b0', '#ffe28a'] },
  mushroom: { debris: ['#d9b6ff', '#9ff2e0', '#ff9fd0', '#fff1a8'], dust: '200,185,240', crack: '#14122a', warn: '255,90,140', jelly: ['#ff9fb8', '#ffd0dc', '#d9b6ff', '#fff1a8'] },
  bramble: { debris: ['#4a2c48', '#7a4a6e', '#e0465a', '#5a7a48'], dust: '150,120,150', crack: '#140f22', warn: '255,70,60', jelly: ['#b582a0', '#e0465a', '#8a5a7c', '#ffb3c7'] },
  frost: { debris: ['#e8f6ff', '#bfe3ff', '#9fd0f4', '#ffffff'], dust: '225,242,255', crack: '#4a78a8', warn: '255,96,120', jelly: ['#bfe3ff', '#e8f6ff', '#9fd0f4', '#c9b6ff'] },
  star: { debris: ['#ffd66a', '#c9b6ff', '#9fe8ff', '#ffffff'], dust: '180,170,255', crack: '#0c0a24', warn: '255,110,90', jelly: ['#8a7cf0', '#c9b6ff', '#ffd66a', '#9fe8ff'] },
  magma: { debris: ['#3a2a35', '#ff8a3d', '#ffc857', '#5a3a40'], dust: '120,90,90', crack: '#ff7a2a', warn: '255,90,60', jelly: ['#ff8a3d', '#ffc857', '#ff5a4a', '#ffe0a0'] },
  phoenix: { debris: ['#ffb347', '#ff6f5a', '#ffe28a', '#ffd0a0'], dust: '255,200,150', crack: '#a8452a', warn: '255,80,90', jelly: ['#ff9f5a', '#ffd06a', '#ff6f7a', '#fff1c0'] },
  clock: { debris: ['#c99a4a', '#e8c070', '#8a6a3a', '#bfe3ff'], dust: '210,190,150', crack: '#5a4020', warn: '255,90,90', jelly: ['#e8c070', '#bfe3ff', '#ffd98a', '#c9b6ff'] },
  chrono: { debris: ['#c9b6ff', '#ffd66a', '#8ae0e8', '#ffffff'], dust: '170,160,230', crack: '#2a1a50', warn: '255,100,120', jelly: ['#a88cf0', '#ffd66a', '#8ae0e8', '#e0d4ff'] },
  tide: { debris: ['#fff1e0', '#ffd6c9', '#9fe0d8', '#8fd0ff'], dust: '210,235,240', crack: '#2a5e66', warn: '255,96,110', jelly: ['#9fe0d8', '#ffd6c9', '#8fd0ff', '#fff1e0'] },
  knot: { debris: ['#6a5048', '#8a6a5a', '#aaf0d8', '#5a4440'], dust: '160,130,130', crack: '#2a1e2c', warn: '255,96,110', jelly: ['#aaf0d8', '#c9a6e6', '#ffb0c0', '#efe4d0'] },
  warden: { debris: ['#a8a4b4', '#8a8698', '#ffcf7a', '#7aa05e'], dust: '200,196,210', crack: '#4e4a5e', warn: '255,96,110', jelly: ['#ffcf7a', '#a8a4b4', '#9ac478', '#f4ecdc'] },
  wolf: { debris: ['#1a2030', '#8e9aa8', '#eef4fa', '#b8d8f8'], dust: '200,220,245', crack: '#0a0e18', warn: '255,96,110', jelly: ['#c8d2dc', '#4a5060', '#eef4fa', '#b8d8f8'] }, // (Fenrir's den, FB2)
  hydra: { debris: ['#22301e', '#4e6a3e', '#e4dcc4', '#fbf6f0'], dust: '120,140,100', crack: '#1a1612', warn: '255,96,110', jelly: ['#7aa05e', '#34482c', '#fbf6f0', '#c8f0a0'] }, // (Ladon's den, FB1)
  floe: { debris: ['#f4f8fc', '#cfe6f4', '#8ab8d8', '#f4ecd8'], dust: '220,236,248', crack: '#2e5a7e', warn: '255,96,120', jelly: ['#cfe6f4', '#f4f8fc', '#8ab8d8', '#f4ecd8'] },
  oath: { debris: ['#f4f8ff', '#e2f0fc', '#b4d4f0', '#d8dce8'], dust: '226,238,252', crack: '#3e6294', warn: '255,96,120', jelly: ['#e2f0fc', '#d8dce8', '#8ab8e0', '#f4f8ff'] },
  hatch: { debris: ['#2e2a32', '#4a4450', '#ff8a4a', '#eeeae4'], dust: '150,130,126', crack: '#ff7a3a', warn: '255,96,110', jelly: ['#3a3440', '#e8dcc4', '#ff9a5a', '#9adce8'] }, // (the Hatchkeeper's den, E2)
  hoist: { debris: ['#3a3438', '#5a5258', '#ff8a4a', '#b0a8a4'], dust: '180,170,166', crack: '#ff7a3a', warn: '255,96,110', jelly: ['#4a4048', '#6e6870', '#ff9a5a', '#b0a8a4'] }, // (Brenna's den, E4b: basalt, iron, ember, pumice)
};
const THEME_RGB = { sprout: '160,240,140', mushroom: '200,160,255', bramble: '255,90,110', frost: '170,225,255', star: '255,214,106', magma: '255,140,60', phoenix: '255,180,90', clock: '232,192,112', chrono: '190,160,255', tide: '150,225,235', knot: '170,250,225', warden: '255,205,120', floe: '200,230,250', oath: '190,226,255', hydra: '170,230,120', wolf: '200,226,255', hatch: '255,160,110', hoist: '255,170,120' };
const DUR = {
  slamWarn: 1, shockwave: 0.55, chargeWarn: 0.8, rainWarn: 1, rainHit: 0.45, summon: 0.9, roar: 0.8, bossDie: 1.6,
  leap: 1.1, phase: 1.5,
  stompWarn: 3, stompHit: 1.1, sporesWarn: 3, sporesHit: 1.1, waveWarn: 3, waveGo: 3, lanesWarn: 3, lanesHit: 1, novaWarn: 3, novaHit: 1.3,
};
const ULT_KINDS = { stomp: 'stomp', spores: 'spores', wave: 'wave', lanes: 'lanes', nova: 'nova' };
const GRAV = 900;

export class BossFx {
  constructor() {
    this.list = [];
    this.n = 0;
  }

  spawn(kind, o = {}) {
    // ultimates can also be spawned as ('ultWarn' | 'ultHit', { ult: 'stomp' | 'spores' | 'wave' | 'lanes' | 'nova', ... })
    if ((kind === 'ultWarn' || kind === 'ultHit') && ULT_KINDS[o.ult]) kind = o.ult + (kind === 'ultWarn' ? 'Warn' : 'Hit');
    if (kind === 'waveHit') kind = 'waveGo';
    if (FX2[kind]) {
      // the newer bosses' effects (dens-caldera.js / dens-citadel.js): { dur, init?(e, rnd), draw(ctx, e, k) }
      const fx = FX2[kind], e = { ...o, kind, t: 0, dur: o.dur ?? fx.dur, x: o.x ?? 0, y: o.y ?? GROUND, theme: o.theme, fx2: fx };
      fx.init?.(e, mulberry32(++this.n * 7919 + Math.floor((o.x ?? 0) * 13)));
      this.list.push(e);
      return e;
    }
    if (!(kind in DUR)) return;
    const theme = FXPAL[o.theme] ? o.theme : 'sprout';
    let dur = o.dur ?? DUR[kind];
    if (kind === 'bossDie' && theme === 'hatch') dur = HATCH_FREED_S; // (freed: the eggs hatch and the little ones run to the sea)
    if (kind === 'bossDie' && theme === 'hoist') dur = BRENNA_FREED_S; // (freed: Brenna sets the tooth down)
    if (kind === 'waveGo') {
      const x0 = o.x0 ?? 0, dir = o.dir < 0 ? -1 : 1, speed = Math.max(50, o.speed ?? 520);
      dur = (dir > 0 ? DEN_W + 260 - x0 : x0 + 260) / speed;
    }
    const r = mulberry32(++this.n * 7919 + Math.floor((o.x ?? o.x0 ?? 0) * 13));
    const e = {
      ...o, kind, x: o.x ?? 0, y: o.y ?? GROUND, radius: o.radius ?? 160, dir: o.dir < 0 ? -1 : 1, size: o.size ?? 120,
      theme, dur, t: 0, seed: r(), r: o.r ?? 620, speed: o.speed ?? 520, x0: o.x0 ?? 0, tx: o.tx ?? o.x ?? 0,
      safe: o.safe ?? [], lanes: o.lanes ?? [], n: o.n ?? 2,
    };
    initUltFx(e, r);
    if (kind === 'shockwave') {
      e.cracks = Array.from({ length: 6 }, (_, i) => {
        const dir = i % 2 ? 1 : -1, pts = [[0, 0]];
        let px = 0, py = 0;
        const len = e.radius * (0.25 + r() * 0.3);
        while (Math.abs(px) < len) {
          px += dir * (8 + r() * 14);
          py = clamp(py + (r() - 0.5) * 8, -2, 12);
          pts.push([px, py]);
        }
        return pts;
      });
      e.parts = debris(r, theme, 22, 120, 420, 180, 460);
    } else if (kind === 'rainHit') {
      e.parts = debris(r, theme, 10, 40, 200, 120, 300);
    } else if (kind === 'summon') {
      e.parts = Array.from({ length: 10 }, () => ({ x: (r() - 0.5) * 60, vy: 40 + r() * 70, r: 8 + r() * 10, d: r() * 0.3 }));
    } else if (kind === 'bossDie') {
      const P = FXPAL[theme];
      e.jelly = Array.from({ length: 14 }, () => ({ vx: (r() - 0.5) * 520, vy: -(200 + r() * 420), r: 7 + r() * 9, c: P.jelly[Math.floor(r() * 4)] }));
      e.confetti = Array.from({ length: 46 }, () => ({ vx: (r() - 0.5) * 460, vy: -(260 + r() * 420), c: FLOWER_COLORS[Math.floor(r() * 5)], rot: r() * TAU, vr: (r() - 0.5) * 14, p: r() * TAU }));
      e.stars = Array.from({ length: 12 }, () => ({ a: r() * TAU, d: 0.4 + r() * 0.9, p: r() }));
    }
    this.list.push(e);
    return e;
  }

  update(dt) {
    for (const e of this.list) e.t += dt;
    this.list = this.list.filter((e) => e.t < e.dur);
  }

  clear() {
    this.list.length = 0;
  }

  draw(ctx) {
    for (const e of this.list) {
      const k = clamp(e.t / e.dur, 0, 1);
      ctx.save();
      if (e.fx2) e.fx2.draw(ctx, e, k);
      else switch (e.kind) {
        case 'slamWarn': fxSlamWarn(ctx, e, k); break;
        case 'shockwave': fxShockwave(ctx, e, k); break;
        case 'chargeWarn': fxChargeWarn(ctx, e, k); break;
        case 'rainWarn': fxRainWarn(ctx, e, k); break;
        case 'rainHit': fxRainHit(ctx, e, k); break;
        case 'summon': fxSummon(ctx, e, k); break;
        case 'roar': fxRoar(ctx, e, k); break;
        case 'bossDie':
          fxBossDie(ctx, e, Math.min(1, e.t / DUR.bossDie));
          if (e.theme === 'hatch') drawHatchFreed(ctx, e);
          if (e.theme === 'hoist') drawBrennaFreed(ctx, e);
          break;
        default: drawUltFx(ctx, e, k);
      }
      ctx.restore();
    }
  }
}

function debris(r, theme, n, vx0, vx1, vy0, vy1) {
  const P = FXPAL[theme];
  return Array.from({ length: n }, (_, i) => ({
    vx: (i % 2 ? 1 : -1) * (vx0 + r() * (vx1 - vx0)),
    vy: -(vy0 + r() * (vy1 - vy0)),
    rot: r() * TAU, vr: (r() - 0.5) * 16, s: 0.7 + r() * 0.7,
    c: P.debris[Math.floor(r() * P.debris.length)],
  }));
}

function drawBit(ctx, theme, x, y, rot, s, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = c;
  if (theme === 'sprout') ellipse(ctx, 0, 0, 6, 3);
  else if (theme === 'frost' || theme === 'floe' || theme === 'oath') {
    ctx.strokeStyle = '#7ab8e8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(3, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (theme === 'star') {
    glow(ctx, 0, 0, 10, 10, '255,214,106', 0.5);
    ctx.fillStyle = c;
    star(ctx, 0, 0, 5);
  } else if (theme === 'mushroom') {
    glow(ctx, 0, 0, 9, 9, '220,200,255', 0.5);
    ctx.fillStyle = c;
    circle(ctx, 0, 0, 3);
  } else if (theme === 'tide') {
    // a little shell, or a drop of water
    if (c === '#8fd0ff' || c === '#9fe0d8') {
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.quadraticCurveTo(4, 0, 0, 4);
      ctx.quadraticCurveTo(-4, 0, 0, -6);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.quadraticCurveTo(0, -7, 5, 2);
      ctx.closePath();
      ctx.fill();
    }
  } else if (theme === 'warden') {
    // a chip of grey Keeper stone, or a spark of the Warden's amber light
    if (c === '#ffcf7a') {
      glow(ctx, 0, 0, 9, 9, '255,205,120', 0.6);
      ctx.fillStyle = c;
      circle(ctx, 0, 0, 2.6);
    } else {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.lineTo(-2, -4);
      ctx.lineTo(4, -3);
      ctx.lineTo(5, 3);
      ctx.closePath();
      ctx.fill();
    }
  } else if (theme === 'hatch' || theme === 'hoist') {
    // a chip of black basalt, a hot ember, or a fleck of salt
    if (c === '#ff8a4a') {
      glow(ctx, 0, 0, 9, 9, '255,150,90', 0.6);
      ctx.fillStyle = c;
      circle(ctx, 0, 0, 2.6);
    } else if (c === '#eeeae4') {
      circle(ctx, 0, 0, 2);
    } else {
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.lineTo(-2, -4);
      ctx.lineTo(4, -3);
      ctx.lineTo(5, 3);
      ctx.closePath();
      ctx.fill();
    }
  } else if (theme === 'knot') {
    // a crumb of earth, or a glowing bead of thread
    if (c === '#aaf0d8') {
      glow(ctx, 0, 0, 9, 9, '170,250,225', 0.6);
      ctx.fillStyle = c;
      circle(ctx, 0, 0, 3);
    } else {
      ctx.fillStyle = c;
      ellipse(ctx, 0, 0, 5, 3.6);
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(-3, 2);
    ctx.lineTo(0, -8);
    ctx.lineTo(3, 2);
    ctx.fill();
  }
  ctx.restore();
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

function fxSlamWarn(ctx, e, k) {
  const { x, y, radius } = e, rgb = FXPAL[e.theme].warn;
  const pulse = 0.5 + 0.5 * Math.sin(e.t * (10 + k * 14));
  const ry = 13;
  ctx.fillStyle = `rgba(${rgb},${0.16 + 0.1 * pulse})`;
  ellipse(ctx, x, y + 3, radius, ry);
  // fills from the middle outwards
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y + 3, radius, ry, 0, 0, TAU);
  ctx.clip();
  ctx.fillStyle = `rgba(${rgb},0.3)`;
  ellipse(ctx, x, y + 3, radius * ease(k), ry * (0.5 + 0.5 * k));
  stripes(ctx, x - radius, y - ry, x + radius, y + ry + 3, 16, e.t * 40, `rgba(${rgb},${0.22 + 0.12 * k})`);
  ctx.restore();
  ctx.strokeStyle = k > 0.85 ? `rgba(255,255,255,${0.6 + 0.4 * pulse})` : `rgba(${rgb},${0.6 + 0.35 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = -e.t * 30;
  ctx.beginPath();
  ctx.ellipse(x, y + 3, radius, ry, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  // little upward chevrons at both edges ("jump!")
  ctx.strokeStyle = `rgba(255,250,240,${0.5 + 0.4 * pulse})`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const cx = x + s * radius * 0.7, cy = y - 12 - i * 9 - pulse * 4;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 4);
      ctx.lineTo(cx, cy - 2);
      ctx.lineTo(cx + 6, cy + 4);
      ctx.stroke();
    }
  }
}

function fxShockwave(ctx, e, k) {
  const { x, y, radius, theme } = e, P = FXPAL[theme];
  const fade = 1 - k;
  // cracks in the ground
  ctx.strokeStyle = P.crack;
  ctx.globalAlpha = Math.min(1, fade * 1.6);
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const c of e.cracks) {
    ctx.beginPath();
    c.forEach(([px, py], i) => (i ? ctx.lineTo(x + px, y + 2 + py) : ctx.moveTo(x + px, y + 2 + py)));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // impact ring
  ctx.strokeStyle = `rgba(255,255,255,${0.8 * fade})`;
  ctx.lineWidth = 6 * fade + 1;
  ctx.beginPath();
  ctx.ellipse(x, y, 30 + radius * 0.5 * ease(k), 8 + 14 * ease(k), 0, 0, TAU);
  ctx.stroke();
  // the wave rolling out both ways
  const d = radius * ease(k);
  for (const s of [-1, 1]) {
    const wx = x + s * d, hh = 34 * fade + 4;
    ctx.fillStyle = `rgba(${P.dust},${0.75 * fade})`;
    ctx.beginPath();
    ctx.moveTo(wx - s * 50, y + 2);
    ctx.quadraticCurveTo(wx - s * 14, y - hh * 0.4, wx, y - hh);
    ctx.quadraticCurveTo(wx + s * 10, y - hh * 0.5, wx + s * 16, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.85 * fade})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wx - s * 30, y - hh * 0.25);
    ctx.quadraticCurveTo(wx - s * 10, y - hh * 0.7, wx, y - hh);
    ctx.stroke();
    // dust puffs left behind
    for (let i = 1; i <= 3; i++) {
      const px = x + s * d * (i / 4);
      ctx.fillStyle = `rgba(${P.dust},${0.45 * fade})`;
      circle(ctx, px, y - 6 - i * 2, 9 + (1 - i / 4) * 10 * k);
    }
  }
  // flying debris
  const tt = e.t;
  for (const p of e.parts) {
    const px = x + p.vx * tt, py = Math.min(y, y - 6 + p.vy * tt + 0.5 * GRAV * tt * tt);
    ctx.globalAlpha = fade;
    drawBit(ctx, theme, px, py, p.rot + p.vr * tt, p.s, p.c);
  }
  ctx.globalAlpha = 1;
}

function fxChargeWarn(ctx, e, k) {
  const { x, y, dir } = e;
  const pulse = 0.5 + 0.5 * Math.sin(e.t * 18);
  const x0 = x + dir * 50, len = 560, cy = y - 34, hw = 26;
  const x1 = x0 + dir * len;
  // the lane
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, `rgba(255,90,70,${0.4 + 0.15 * pulse})`);
  g.addColorStop(1, 'rgba(255,90,70,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0, cy - hw);
  ctx.lineTo(x1, cy - hw * 0.4);
  ctx.lineTo(x1, cy + hw * 0.4);
  ctx.lineTo(x0, cy + hw);
  ctx.closePath();
  ctx.fill();
  // the fill creeping forward as the charge winds up
  const fl = len * ease(k);
  ctx.fillStyle = `rgba(255,220,200,${0.25 + 0.15 * pulse})`;
  ctx.beginPath();
  ctx.moveTo(x0, cy - 6);
  ctx.lineTo(x0 + dir * fl, cy - 3);
  ctx.lineTo(x0 + dir * fl, cy + 3);
  ctx.lineTo(x0, cy + 6);
  ctx.fill();
  // marching chevrons
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 6; i++) {
    const p = ((i / 6 + e.t * 0.9) % 1);
    const cx = x0 + dir * p * len, s = 1 - p * 0.5;
    ctx.strokeStyle = `rgba(255,250,240,${(1 - p) * 0.9})`;
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.moveTo(cx - dir * 12 * s, cy - 16 * s);
    ctx.lineTo(cx + dir * 6 * s, cy);
    ctx.lineTo(cx - dir * 12 * s, cy + 16 * s);
    ctx.stroke();
  }
  // a big arrowhead at the front of the boss
  ctx.fillStyle = `rgba(255,96,80,${0.75 + 0.25 * pulse})`;
  ctx.strokeStyle = '#fffaf0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const ax = x0 + dir * 10;
  ctx.moveTo(ax, cy - 22);
  ctx.lineTo(ax + dir * 34, cy);
  ctx.lineTo(ax, cy + 22);
  ctx.lineTo(ax + dir * 8, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawFallObj(ctx, theme, x, y, s, rot, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  if (theme === 'sprout') {
    // a big seed with a sprout
    ctx.fillStyle = '#b07a4c';
    ctx.strokeStyle = '#7a5236';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 14, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d4a77a';
    ellipse(ctx, -3, -4, 3.5, 5, -0.3);
    ctx.strokeStyle = '#4f9d5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(0, -19);
    ctx.stroke();
    ctx.fillStyle = '#7fd06e';
    ellipse(ctx, -5, -21, 6, 3, 0.5);
    ellipse(ctx, 5, -21, 6, 3, -0.5);
  } else if (theme === 'floe') {
    // a slab of sea ice broken off the roof, snow on top, tumbling
    ctx.fillStyle = '#cfe6f4';
    ctx.strokeStyle = '#4e86b0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, -8);
    ctx.lineTo(14, -11);
    ctx.lineTo(17, 7);
    ctx.lineTo(-13, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f4f8fc';
    ctx.beginPath();
    ctx.moveTo(-16, -8);
    ctx.lineTo(14, -11);
    ctx.lineTo(14, -6);
    ctx.lineTo(-15, -3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(78,134,176,0.4)';
    ctx.fillRect(-8, 0, 18, 3);
  } else if (theme === 'frost' || theme === 'oath') {
    // a chunk of ice, point down
    ctx.fillStyle = 'rgba(225,245,255,0.95)';
    ctx.strokeStyle = '#6aa0d0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -14);
    ctx.lineTo(10, -14);
    ctx.lineTo(6, 2);
    ctx.lineTo(0, 18);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#bfe3ff';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(10, -14);
    ctx.lineTo(6, 2);
    ctx.lineTo(0, 18);
    ctx.fill();
  } else if (theme === 'star') {
    // a little falling star
    glow(ctx, 0, 0, 30, 30, '255,214,106', 0.7);
    ctx.fillStyle = '#fff3c0';
    star(ctx, 0, 0, 14);
    ctx.fillStyle = '#ffd66a';
    star(ctx, 0, 0, 8);
  } else if (theme === 'mushroom') {
    glow(ctx, 0, 0, 26, 26, '200,170,255', 0.6);
    for (const [cx, cy, r, c] of [[-6, 3, 8, '#c9a6ff'], [6, 4, 7, '#ff9fe0'], [0, -6, 8, '#b9a2ff'], [-1, 2, 5, '#9ff2e0']]) {
      ctx.fillStyle = c;
      circle(ctx, cx, cy, r);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      circle(ctx, cx - r * 0.3, cy - r * 0.35, r * 0.28);
    }
    void time;
  } else if (theme === 'tide') {
    // something from the hoard: a big scallop shell, a bottle, or a button, tumbling down
    const k = Math.floor(Math.abs(x * 0.13 + y * 0.02)) % 3;
    if (k === 0) {
      ctx.fillStyle = '#ffd6c9';
      ctx.strokeStyle = '#d8a898';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-13, 6);
      ctx.quadraticCurveTo(0, -18, 13, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(0, 6);
        ctx.lineTo(i * 5, -8);
      }
      ctx.stroke();
    } else if (k === 1) {
      ctx.fillStyle = 'rgba(143,224,200,0.9)';
      ctx.strokeStyle = '#3e8c96';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-7, -6, 14, 22, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(-3, -14, 6, 9);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(-4, -2, 2, 12);
    } else {
      ctx.fillStyle = '#ff8f8f';
      circle(ctx, 0, 0, 11);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (const [bx, by] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) circle(ctx, bx, by, 1.6);
    }
  } else if (theme === 'warden') {
    // a block of carved Keeper stone shaken off the ruined walls, moss on top, a gear cut in its face
    ctx.fillStyle = '#a8a4b4';
    ctx.strokeStyle = '#4e4a5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-14, -11, 28, 22, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c4c0d0';
    ctx.fillRect(-11, -8, 7, 16);
    ctx.fillStyle = '#7aa05e';
    ellipse(ctx, 2, -11, 11, 4);
    ctx.strokeStyle = 'rgba(78,74,94,0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(4, 2, 5, 0, TAU);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      ctx.moveTo(4 + Math.cos(a) * 5, 2 + Math.sin(a) * 5);
      ctx.lineTo(4 + Math.cos(a) * 7, 2 + Math.sin(a) * 7);
    }
    ctx.stroke();
  } else if (theme === 'hatch' || theme === 'hoist') {
    // a lump of hot black rock spat up out of the sand, red in its cracks, trailing steam
    ctx.fillStyle = 'rgba(240,234,230,0.4)';
    circle(ctx, -4, -18, 7);
    circle(ctx, 2, -28, 5);
    ctx.fillStyle = '#2e2a32';
    ctx.strokeStyle = '#141018';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-13, 3);
    ctx.quadraticCurveTo(-14, -10, -2, -12);
    ctx.quadraticCurveTo(12, -12, 13, 0);
    ctx.quadraticCurveTo(12, 11, 0, 11);
    ctx.quadraticCurveTo(-12, 11, -13, 3);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,130,60,${0.7 + 0.3 * Math.sin(time * 9)})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(-1, 2);
    ctx.lineTo(3, -6);
    ctx.moveTo(-1, 2);
    ctx.lineTo(6, 6);
    ctx.stroke();
  } else if (theme === 'knot') {
    // a clod of earth shaken loose from the roof, a root and a glowing thread trailing from it
    ctx.fillStyle = '#6a5048';
    ctx.strokeStyle = '#3a2830';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, 4);
    ctx.quadraticCurveTo(-16, -10, -4, -13);
    ctx.quadraticCurveTo(10, -16, 14, -2);
    ctx.quadraticCurveTo(12, 10, 0, 11);
    ctx.quadraticCurveTo(-12, 12, -14, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8a6a5a';
    ellipse(ctx, -4, -6, 5, 3);
    ctx.strokeStyle = '#5a4434';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, -12);
    ctx.quadraticCurveTo(10, -22, 4, -28);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(170,250,225,0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.quadraticCurveTo(-12, -20, -6, -26 + Math.sin(time * 6) * 2);
    ctx.stroke();
  } else {
    // a bundle of thorns tied with a vine
    ctx.fillStyle = '#4a2c48';
    ctx.strokeStyle = '#2e1a30';
    ctx.lineWidth = 1.6;
    for (const a of [-0.5, 0, 0.5]) {
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(-4, -8);
      ctx.lineTo(0, 22);
      ctx.lineTo(4, -8);
      ctx.quadraticCurveTo(0, -14, -4, -8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = '#5a7a48';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(8, -2);
    ctx.stroke();
    berry(ctx, 6, -6, 3.4, 0);
  }
  ctx.restore();
}

function fxRainWarn(ctx, e, k) {
  const { x, y, theme } = e, rgb = FXPAL[theme].warn;
  const pulse = 0.5 + 0.5 * Math.sin(e.t * (8 + 12 * k));
  const rx = 14 + 24 * ease(k), ry = rx * 0.32;
  // the shadow of what's coming
  ctx.fillStyle = `rgba(20,10,30,${0.12 + 0.28 * k})`;
  ellipse(ctx, x, y + 2, rx, ry);
  ctx.strokeStyle = `rgba(${rgb},${0.6 + 0.35 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, rx + 4, ry + 2, 0, 0, TAU);
  ctx.stroke();
  // crosshair ticks
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const s of [-1, 1]) {
    ctx.moveTo(x + s * (rx + 8), y + 2);
    ctx.lineTo(x + s * (rx + 15), y + 2);
  }
  ctx.stroke();
  // faint dotted trail and ghost of the thing about to fall
  ctx.strokeStyle = `rgba(${rgb},${0.18 * k})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 9]);
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x, y - 300);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.12 + 0.18 * k;
  drawFallObj(ctx, theme, x, y - 300 + k * 30, 1, 0, e.t);
  ctx.globalAlpha = 1;
}

function fxRainHit(ctx, e, k) {
  const { x, y, theme } = e, P = FXPAL[theme];
  const fallK = 0.45; // share of the effect spent falling
  if (k < fallK) {
    const f = k / fallK;
    const fy = y - 480 + 470 * f * f;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, fy - 20);
    ctx.lineTo(x, fy - 20 - 90 * f);
    ctx.stroke();
    drawFallObj(ctx, theme, x, fy, 1.1, 0.2 * Math.sin(f * 6), e.t);
    return;
  }
  const j = (k - fallK) / (1 - fallK), fade = 1 - j;
  // squashed object fading
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(x, y - 6);
  ctx.scale(1 + j * 0.6, 1 - j * 0.6);
  drawFallObj(ctx, theme, 0, 0, 1.1, 0, e.t);
  ctx.restore();
  ctx.strokeStyle = `rgba(255,255,255,${0.85 * fade})`;
  ctx.lineWidth = 4 * fade + 1;
  ctx.beginPath();
  ctx.ellipse(x, y, 12 + 46 * ease(j), 4 + 12 * ease(j), 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = `rgba(${P.dust},${0.6 * fade})`;
  for (const s of [-1, 1]) circle(ctx, x + s * (14 + 28 * j), y - 6 - 6 * j, 8 + 6 * j);
  const tt = e.t - e.dur * fallK;
  for (const p of e.parts) {
    ctx.globalAlpha = fade;
    drawBit(ctx, theme, x + p.vx * tt, Math.min(y, y - 4 + p.vy * tt + 0.5 * GRAV * tt * tt), p.rot + p.vr * tt, p.s * 0.9, p.c);
  }
  ctx.globalAlpha = 1;
}

function fxSummon(ctx, e, k) {
  const { x, y, theme } = e;
  const rgb = THEME_RGB[theme];
  const open = Math.sin(Math.PI * Math.min(1, k * 1.15));
  const rx = 40 * open, ry = 12 * open;
  glow(ctx, x, y - 20, 60 * open + 1, 50 * open + 1, rgb, 0.6);
  ctx.fillStyle = { bramble: '#1c1020', mushroom: '#1a1430', sprout: '#3a5a2a', frost: '#5a86b8', star: '#120e30', tide: '#1e4a58', knot: '#2a1e2c', warden: '#4e4a5e', floe: '#1e3e5a', oath: '#2e4e78', hatch: '#1a1416', hoist: '#1e1a20' }[theme] ?? '#1c1020';
  ellipse(ctx, x, y + 2, rx + 0.1, ry + 0.1);
  ctx.strokeStyle = `rgba(${rgb},0.9)`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a0 = e.t * 7 + (i / 3) * TAU;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, rx * (0.9 - i * 0.2) + 0.1, ry * (0.9 - i * 0.2) + 0.1, 0, a0, a0 + 2.2);
    ctx.stroke();
  }
  // puffs rising
  for (const p of e.parts) {
    const j = clamp((k - p.d) / (1 - p.d), 0, 1);
    if (j <= 0) continue;
    ctx.fillStyle = `rgba(255,255,255,${0.8 * Math.sin(j * Math.PI)})`;
    circle(ctx, x + p.x * (0.6 + j * 0.6), y - 6 - p.vy * j, p.r * (0.6 + j * 0.6));
  }
  ctx.fillStyle = `rgba(${rgb},${Math.sin(k * Math.PI)})`;
  for (let i = 0; i < 5; i++) {
    const a = i * 1.26 + e.seed * 6;
    star(ctx, x + Math.cos(a) * 34 * (0.5 + k), y - 30 - k * 50 + Math.sin(a) * 14, 4);
  }
}

function fxRoar(ctx, e, k) {
  const { x, y, theme } = e;
  const rgb = { mushroom: '255,120,170', bramble: '255,80,70', sprout: '255,140,80', frost: '150,210,255', star: '255,200,110', magma: '255,120,60', phoenix: '255,170,80', clock: '255,190,110', chrono: '190,150,255', tide: '140,220,240', knot: '170,250,225', warden: '255,200,110', floe: '190,225,250', oath: '190,226,255', hatch: '255,150,90' }[theme] ?? '255,140,80';
  for (let i = 0; i < 3; i++) {
    const j = clamp(k * 1.4 - i * 0.18, 0, 1);
    if (j <= 0 || j >= 1) continue;
    ctx.strokeStyle = `rgba(${rgb},${0.8 * (1 - j)})`;
    ctx.lineWidth = 8 * (1 - j) + 1;
    ctx.beginPath();
    ctx.ellipse(x, y, 30 + 230 * ease(j), (30 + 230 * ease(j)) * 0.7, 0, 0, TAU);
    ctx.stroke();
  }
  // shout lines bursting outwards
  ctx.strokeStyle = `rgba(255,250,240,${1 - k})`;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + 0.2, d0 = 50 + 140 * ease(k), d1 = d0 + 26;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * d0, y + Math.sin(a) * d0 * 0.7);
    ctx.lineTo(x + Math.cos(a) * d1, y + Math.sin(a) * d1 * 0.7);
    ctx.stroke();
  }
  glow(ctx, x, y, 120 * (1 - k * 0.5), 90 * (1 - k * 0.5), rgb, 0.5 * (1 - k));
}

function fxBossDie(ctx, e, k) {
  const { x, y, size, theme } = e;
  const cy = y - size * 0.5, tt = e.t;
  // flash
  if (k < 0.3) {
    const j = k / 0.3;
    glow(ctx, x, cy, size * (0.8 + j * 1.5), size * (0.8 + j * 1.5), '255,250,230', 1 - j);
    ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - j)})`;
    circle(ctx, x, cy, size * (0.3 + 0.6 * j));
  }
  // rings
  for (let i = 0; i < 2; i++) {
    const j = clamp(k * 2 - i * 0.25, 0, 1);
    if (j <= 0 || j >= 1) continue;
    ctx.strokeStyle = `rgba(255,240,170,${0.9 * (1 - j)})`;
    ctx.lineWidth = 7 * (1 - j) + 1;
    ctx.beginPath();
    ctx.arc(x, cy, size * 0.4 + size * 1.6 * ease(j), 0, TAU);
    ctx.stroke();
  }
  const fadeEnd = clamp((1 - k) / 0.25, 0, 1);
  // jelly blobs flying out and splatting on the floor
  for (const b of e.jelly) {
    const t1 = (-b.vy + Math.sqrt(b.vy * b.vy + 2 * GRAV * (y - cy))) / GRAV; // time it lands
    ctx.globalAlpha = fadeEnd;
    ctx.fillStyle = b.c;
    if (tt < t1) {
      const px = x + b.vx * tt, py = cy + b.vy * tt + 0.5 * GRAV * tt * tt;
      const vyy = b.vy + GRAV * tt;
      ellipse(ctx, px, py, b.r * (1 - clamp(vyy / 2000, -0.2, 0.2)), b.r * (1 + clamp(Math.abs(vyy) / 2000, 0, 0.3)), Math.atan2(vyy, b.vx) + Math.PI / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      circle(ctx, px - b.r * 0.3, py - b.r * 0.3, b.r * 0.28);
    } else {
      const px = x + b.vx * t1, sp = clamp((tt - t1) * 8, 0, 1);
      ellipse(ctx, px, y - 1, b.r * (1 + sp * 0.9), b.r * (0.9 - sp * 0.55));
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ellipse(ctx, px - b.r * 0.4, y - b.r * 0.35 + 2, b.r * 0.35, b.r * 0.15);
    }
  }
  // confetti fluttering down
  for (const c of e.confetti) {
    const drag = Math.min(tt, 0.5);
    const px = x + c.vx * drag + Math.sin(tt * 6 + c.p) * 10 * Math.max(0, tt - 0.5);
    const py = Math.min(y - 2, cy + c.vy * drag + 0.5 * GRAV * drag * drag + Math.max(0, tt - 0.5) * 120);
    ctx.globalAlpha = fadeEnd;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(c.rot + c.vr * tt);
    ctx.scale(1, Math.abs(Math.cos(tt * 9 + c.p)) * 0.8 + 0.2);
    ctx.fillStyle = c.c;
    ctx.fillRect(-4, -2.5, 8, 5);
    ctx.restore();
  }
  // sparkles twinkling around
  ctx.fillStyle = '#fff3a8';
  for (const s of e.stars) {
    const tw = Math.sin((k * 3 + s.p) * Math.PI);
    if (tw <= 0) continue;
    ctx.globalAlpha = tw * fadeEnd;
    star(ctx, x + Math.cos(s.a) * size * s.d * (0.6 + k), cy + Math.sin(s.a) * size * s.d * 0.7 - k * 30, 6 * tw);
  }
  ctx.globalAlpha = 1;
}

// ——— boss HP bar (screen space) ———

const lagHp = new Map();

export function drawBossBar(ctx, name, lvl, hp, maxHp, enraged, time) {
  const x0 = 230, x1 = 730, w = x1 - x0, cy = 58;
  const frac = clamp(maxHp > 0 ? hp / maxHp : 0, 0, 1);
  // a pale "damage taken" bar that drains after the real one
  let lag = lagHp.get(name);
  if (!lag || frac > lag.v + 0.001) lag = { v: frac, t: time };
  const dt = clamp(time - lag.t, 0, 0.2);
  lag.v = Math.max(frac, lag.v - dt * 0.35);
  lag.t = time;
  lagHp.set(name, lag);

  const pulse = enraged ? 0.5 + 0.5 * Math.sin(time * 7) : 0;
  ctx.save();
  // panel
  if (enraged) glow(ctx, (x0 + x1) / 2, cy, w * 0.6, 30, '255,70,60', 0.35 + 0.25 * pulse);
  ctx.fillStyle = 'rgba(45,32,60,0.82)';
  ctx.strokeStyle = enraged ? mix('#ff7a6a', '#ffd0a0', pulse) : 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x0, cy - 17, w, 34, 12);
  ctx.fill();
  ctx.stroke();
  // level pill and name
  const pillW = 46;
  ctx.fillStyle = enraged ? '#ff6a5a' : '#e0565a';
  ctx.beginPath();
  ctx.roundRect(x0 + 7, cy - 11, pillW, 22, 11);
  ctx.fill();
  text(ctx, `Lv ${lvl}`, x0 + 7 + pillW / 2, cy + 0.5, 12, '#fffaf0');
  const bx = x0 + pillW + 14, bw = x1 - 8 - bx, by = cy - 1, bh = 12;
  text(ctx, name, bx, cy - 9, 12, '#fffaf0', 'left');
  if (enraged) {
    ctx.font = "700 11px Fredoka, 'Trebuchet MS', sans-serif";
    text(ctx, 'ENRAGED', bx + bw, cy - 9, 11, mix('#ff8a7a', '#ffd06a', pulse), 'right');
  } else {
    text(ctx, `${Math.max(0, Math.ceil(hp)).toLocaleString()} / ${Math.ceil(maxHp).toLocaleString()}`, bx + bw, cy - 9, 11, 'rgba(255,255,255,0.75)', 'right');
  }
  // track, lag, fill
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, bh / 2);
  ctx.fill();
  if (lag.v > frac) {
    ctx.fillStyle = 'rgba(255,240,220,0.75)';
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(bh, bw * lag.v), bh, bh / 2);
    ctx.fill();
  }
  if (frac > 0) {
    const g = ctx.createLinearGradient(0, by, 0, by + bh);
    if (enraged) {
      g.addColorStop(0, mix('#ff9a6a', '#ffc070', pulse));
      g.addColorStop(1, mix('#e0302a', '#ff5a3a', pulse));
    } else {
      g.addColorStop(0, '#ff9fae');
      g.addColorStop(1, '#e0465a');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(bh, bw * frac), bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.roundRect(bx + 4, by + 2, Math.max(0, bw * frac - 8), 3, 1.5);
    ctx.fill();
  }
  // the 30% enrage mark
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx + bw * 0.3, by - 1);
  ctx.lineTo(bx + bw * 0.3, by + bh + 1);
  ctx.stroke();
  ctx.restore();
}

// ——— the Highlands dens: the Frozen Throne (frost) and Starfall Sanctum (star) ———

const FROST = (() => {
  const r = mulberry32(961);
  const pillars = [215, 545, 955, 1290].map((x) => ({ x: x + (r() - 0.5) * 30, w: 44 + r() * 22, p: r() * TAU }));
  const windows = [{ x: 380, w: 96 }, { x: 1130, w: 104 }];
  const icicles = [];
  for (let x = 0; x < DEN_W + 20; x += 14 + r() * 26) icicles.push({ x, len: 12 + r() * (r() < 0.2 ? 60 : 26), w: 6 + r() * 8 });
  const flakes = Array.from({ length: 70 }, () => ({ x: r() * DEN_W, y: r() * 470, p: r() * TAU, s: 0.6 + r() * 0.9, sp: 16 + r() * 22 }));
  const deco = floorDeco(971, [['snow', 0.32], ['crystal', 0.22], ['frostTuft', 0.34], ['snowflower', 0.12]]).map((d) => ({ ...d, col: ['#bfe3ff', '190,230,255'] }));
  return { pillars, windows, icicles, flakes, deco, pebbles: pebbles(973) };
})();

const STAR = (() => {
  const r = mulberry32(981);
  const stars = Array.from({ length: 170 }, () => ({ x: r() * (DEN_W * 0.25 + 1100) - 70, y: r() * 420, s: 0.5 + r() * 1.3, p: r() * TAU }));
  const nebulae = [[260, 150, '200,120,255'], [700, 90, '120,200,255'], [1100, 190, '255,140,200'], [480, 280, '140,120,255']]
    .map(([x, y, rgb]) => ({ x, y, rgb, rx: 220 + r() * 120, ry: 90 + r() * 60 }));
  const consts = Array.from({ length: 6 }, (_, i) => {
    const cx = 60 + i * 230 + r() * 60, cy = 70 + r() * 130;
    return Array.from({ length: 4 + Math.floor(r() * 3) }, () => [cx + (r() - 0.5) * 170, cy + (r() - 0.5) * 90]);
  });
  const columns = [195, 560, 950, 1285].map((x, i) => ({ x: x + (r() - 0.5) * 30, h: 190 + r() * 120, broken: i % 2 === 1, p: r() * TAU }));
  const rocks = Array.from({ length: 6 }, (_, i) => ({ x: 120 + i * 230 + r() * 80, y: 70 + r() * 110, s: 0.6 + r() * 0.6, p: r() * TAU }));
  const motes = Array.from({ length: 50 }, () => ({ x: r() * DEN_W, y: 60 + r() * 380, p: r() * TAU, s: 0.6 + r() * 0.9 }));
  const COLS = [['#c9b6ff', '201,182,255'], ['#9fe8ff', '159,232,255'], ['#ffd66a', '255,214,106']];
  const deco = floorDeco(991, [['tuft', 0.35], ['crystal', 0.35], ['starstone', 0.3]]).map((d) => ({ ...d, col: COLS[d.c % 3] }));
  return { stars, nebulae, consts, columns, rocks, motes, deco, COLS, pebbles: pebbles(993) };
})();

function drawFrostBack(ctx, L, R, camX, viewW, time) {
  const F = FROST;
  // tall arched windows onto a night sky with an aurora
  for (const w of F.windows) {
    if (!visible(w.x - w.w, w.x + w.w, L, R)) continue;
    const top = 70, bot = 380, hw = w.w / 2;
    const arch = () => {
      ctx.beginPath();
      ctx.moveTo(w.x - hw, bot);
      ctx.lineTo(w.x - hw, top + hw);
      ctx.arc(w.x, top + hw, hw, Math.PI, 0);
      ctx.lineTo(w.x + hw, bot);
      ctx.closePath();
    };
    ctx.save();
    arch();
    ctx.clip();
    ctx.fillStyle = vgrad(ctx, 'frostwin', top, bot, [[0, '#141c48'], [0.7, '#2c4a8a'], [1, '#5a86c0']]);
    ctx.fillRect(w.x - hw, top, w.w, bot - top);
    for (const [rgb, off, amp] of [['120,255,200', 0, 1], ['255,160,220', 2.1, 0.7]]) {
      ctx.fillStyle = `rgba(${rgb},0.35)`;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const x = w.x - hw + (w.w * i) / 10;
        const y = top + 70 + off * 18 + Math.sin(time * 0.7 + i * 0.7 + off) * 16 * amp;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      for (let i = 10; i >= 0; i--) {
        const x = w.x - hw + (w.w * i) / 10;
        ctx.lineTo(x, top + 120 + off * 18 + Math.sin(time * 0.7 + i * 0.7 + off + 1) * 12 * amp);
      }
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) circle(ctx, w.x - hw + ((i * 41 + w.x) % w.w), top + 20 + ((i * 67) % 200), 1.2 + (i % 3) * 0.4);
    ctx.fillStyle = '#e8f4ff';
    for (let i = 0; i < 4; i++) circle(ctx, w.x - hw + i * w.w / 3, bot - 4 + (i % 2) * 6, 26);
    ctx.restore();
    ctx.strokeStyle = '#e8f6ff';
    ctx.lineWidth = 12;
    arch();
    ctx.stroke();
    ctx.strokeStyle = '#9fc8ec';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w.x, top + 4);
    ctx.lineTo(w.x, bot);
    ctx.moveTo(w.x - hw, top + hw + 50);
    ctx.lineTo(w.x + hw, top + hw + 50);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(w.x - hw - 12, bot - 4, w.w + 24, 12, 6);
    ctx.fill();
  }
  // crystal pillars
  for (const p of F.pillars) {
    if (!visible(p.x - p.w, p.x + p.w, L, R)) continue;
    glow(ctx, p.x, GROUND - 160, p.w * 1.6, 200, '200,235,255', 0.25);
    ctx.fillStyle = 'rgba(225,244,255,0.62)';
    ctx.fillRect(p.x - p.w / 2, 20, p.w, GROUND - 20);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(p.x - p.w / 2 + 6, 20, p.w * 0.22, GROUND - 20);
    ctx.fillStyle = 'rgba(120,170,220,0.25)';
    ctx.fillRect(p.x + p.w * 0.18, 20, p.w * 0.32, GROUND - 20);
    ctx.strokeStyle = 'rgba(110,160,210,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x - p.w / 2, 20, p.w, GROUND - 20);
    // snowy capital and base
    for (const [y, hh] of [[24, 18], [GROUND - 22, 22]]) {
      ctx.fillStyle = '#f4faff';
      ctx.strokeStyle = '#9fc4e4';
      ctx.beginPath();
      ctx.roundRect(p.x - p.w / 2 - 10, y, p.w + 20, hh, 6);
      ctx.fill();
      ctx.stroke();
    }
    const g = (time * 0.25 + p.p) % 1;
    ctx.fillStyle = `rgba(255,255,255,${Math.sin(g * Math.PI)})`;
    star(ctx, p.x - p.w * 0.2, 60 + g * 300, 4);
  }
  // the ice ceiling with icicles
  ctx.fillStyle = '#dcedfa';
  ctx.fillRect(L, 0, R - L, 20);
  ctx.fillStyle = '#f4faff';
  ctx.fillRect(L, 0, R - L, 8);
  for (const c of F.icicles) {
    if (c.x < L - 20 || c.x > R + 20) continue;
    ctx.fillStyle = 'rgba(230,246,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(c.x - c.w / 2, 18);
    ctx.lineTo(c.x + c.w / 2, 18);
    ctx.lineTo(c.x, 18 + c.len);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(150,200,240,0.5)';
    ctx.beginPath();
    ctx.moveTo(c.x, 18);
    ctx.lineTo(c.x + c.w / 2, 18);
    ctx.lineTo(c.x, 18 + c.len);
    ctx.fill();
  }
  void camX;
  void viewW;
}

function drawStarBack(ctx, L, R, camX, viewW, time) {
  const S = STAR;
  for (const n of S.nebulae) {
    const ax = n.x + camX * 0.7;
    if (ax + n.rx < camX - 40 || ax - n.rx > camX + viewW + 40) continue;
    glow(ctx, ax, n.y, n.rx, n.ry, n.rgb, 0.35);
  }
  for (const s of S.stars) {
    const ax = s.x + camX * 0.75;
    if (ax < camX - 10 || ax > camX + viewW + 10) continue;
    const tw = 0.5 + 0.5 * Math.sin(time * (1 + s.s) + s.p);
    ctx.fillStyle = `rgba(255,250,235,${0.35 + 0.6 * tw})`;
    if (s.s > 1.5) star(ctx, ax, s.y, 2.5 + tw * 2);
    else circle(ctx, ax, s.y, s.s);
  }
  // a ringed planet, nearly fixed on screen
  const px = camX + viewW * 0.18, py = 120;
  glow(ctx, px, py, 120, 120, '255,170,220', 0.3);
  ctx.strokeStyle = 'rgba(255,220,180,0.5)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(px, py, 78, 16, -0.25, Math.PI, TAU);
  ctx.stroke();
  const pg = ctx.createLinearGradient(px - 40, py - 40, px + 40, py + 40);
  pg.addColorStop(0, '#ffc6e0');
  pg.addColorStop(1, '#8a6ad8');
  ctx.fillStyle = pg;
  circle(ctx, px, py, 42);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ellipse(ctx, px - 6, py - 10, 34, 6, -0.25);
  ctx.beginPath();
  ctx.ellipse(px, py, 78, 16, -0.25, 0, Math.PI);
  ctx.stroke();
  // constellations
  for (const c of S.consts) {
    const off = camX * 0.6;
    if (c[0][0] + off > camX + viewW + 120 || c[0][0] + off < camX - 220) continue;
    ctx.strokeStyle = `rgba(255,214,106,${0.25 + 0.1 * Math.sin(time + c[0][0])})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    c.forEach(([x, y], i) => (i ? ctx.lineTo(x + off, y) : ctx.moveTo(x + off, y)));
    ctx.stroke();
    ctx.fillStyle = '#fff3c0';
    for (const [x, y] of c) star(ctx, x + off, y, 3);
  }
  // a shooting star now and then
  const sk = (time / 5) % 1;
  if (sk < 0.18) {
    const j = sk / 0.18, sx = camX + 200 + ((Math.floor(time / 5) * 397) % 600) + j * 300, sy = 40 + j * 110;
    ctx.strokeStyle = `rgba(255,250,220,${1 - j})`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 70, sy - 26);
    ctx.stroke();
  }
  // ancient columns with glowing runes
  for (const c of S.columns) {
    if (!visible(c.x - 60, c.x + 60, L, R)) continue;
    const top = GROUND - c.h;
    ctx.fillStyle = '#3e3678';
    ctx.beginPath();
    if (c.broken) {
      ctx.moveTo(c.x - 24, GROUND);
      ctx.lineTo(c.x - 24, top + 16);
      ctx.lineTo(c.x - 10, top);
      ctx.lineTo(c.x + 2, top + 12);
      ctx.lineTo(c.x + 14, top + 2);
      ctx.lineTo(c.x + 24, top + 20);
      ctx.lineTo(c.x + 24, GROUND);
    } else ctx.rect(c.x - 24, top, 48, c.h);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(c.x - 18, top + 20, 8, c.h - 30);
    ctx.fillStyle = '#4a4290';
    ctx.beginPath();
    ctx.roundRect(c.x - 32, GROUND - 22, 64, 22, 4);
    ctx.fill();
    if (!c.broken) {
      ctx.beginPath();
      ctx.roundRect(c.x - 32, top - 14, 64, 16, 4);
      ctx.fill();
    } else {
      // its missing chunk floats above
      const by = top - 60 + Math.sin(time * 1.2 + c.p) * 6;
      ctx.fillStyle = '#3e3678';
      ctx.beginPath();
      ctx.moveTo(c.x - 22, by + 30);
      ctx.lineTo(c.x - 10, by + 16);
      ctx.lineTo(c.x + 2, by + 26);
      ctx.lineTo(c.x + 16, by + 14);
      ctx.lineTo(c.x + 24, by + 24);
      ctx.lineTo(c.x + 22, by - 4);
      ctx.lineTo(c.x - 24, by - 4);
      ctx.closePath();
      ctx.fill();
      glow(ctx, c.x, by + 34, 30, 10, '200,180,255', 0.4);
    }
    const a = 0.5 + 0.4 * Math.sin(time * 1.4 + c.p);
    glow(ctx, c.x, top + c.h * 0.45, 30, 40, '255,214,106', a * 0.4);
    ctx.strokeStyle = `rgba(255,214,106,${a})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const ry = top + c.h * 0.3 + i * 24;
      ctx.moveTo(c.x - 8, ry);
      ctx.lineTo(c.x, ry - 7);
      ctx.lineTo(c.x + 8, ry);
      ctx.moveTo(c.x, ry - 2);
      ctx.lineTo(c.x, ry + 8);
    }
    ctx.stroke();
  }
  // floating crystal rocks
  for (const k of S.rocks) {
    if (!visible(k.x - 50, k.x + 50, L, R)) continue;
    const y = k.y + Math.sin(time * 0.9 + k.p) * 8;
    ctx.save();
    ctx.translate(k.x, y);
    ctx.scale(k.s, k.s);
    ctx.fillStyle = '#342c6a';
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(30, 0);
    ctx.lineTo(10, 26);
    ctx.lineTo(-4, 34);
    ctx.lineTo(-18, 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4a4290';
    ctx.beginPath();
    ctx.roundRect(-32, -6, 64, 10, 5);
    ctx.fill();
    glow(ctx, 0, -14, 26, 22, '201,182,255', 0.5);
    ctx.fillStyle = 'rgba(210,190,255,0.9)';
    for (const [dx, hh] of [[-10, 18], [0, 28], [10, 16]]) {
      ctx.beginPath();
      ctx.moveTo(dx - 4, -4);
      ctx.lineTo(dx, -4 - hh);
      ctx.lineTo(dx + 4, -4);
      ctx.fill();
    }
    ctx.restore();
  }
}

function throneFrost(ctx, x, b, time) {
  glow(ctx, x, b - 130, 120, 150, '190,230,255', 0.45);
  const spikes = [[-64, 120, 18], [-40, 170, 20], [-14, 220, 24], [14, 220, 24], [40, 170, 20], [64, 120, 18]];
  for (const [dx, hh, wd] of spikes) {
    ctx.fillStyle = 'rgba(225,245,255,0.92)';
    ctx.strokeStyle = '#6aa0d0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + dx - wd / 2, b - 60);
    ctx.lineTo(x + dx - wd / 2, b - hh + wd);
    ctx.lineTo(x + dx, b - hh);
    ctx.lineTo(x + dx + wd / 2, b - hh + wd);
    ctx.lineTo(x + dx + wd / 2, b - 60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(150,200,240,0.45)';
    ctx.fillRect(x + dx, b - hh + wd, wd / 2, hh - wd - 60);
  }
  // snowflake emblem
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + time * 0.2;
    ctx.moveTo(x, b - 150);
    ctx.lineTo(x + Math.cos(a) * 20, b - 150 + Math.sin(a) * 20);
  }
  ctx.stroke();
  ctx.fillStyle = '#7fc4ff';
  circle(ctx, x, b - 150, 5);
  // seat
  ctx.fillStyle = '#e8f6ff';
  ctx.strokeStyle = '#6aa0d0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x - 78, b - 66, 156, 70, [12, 12, 4, 4]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x - 82, b - 72, 164, 14, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(150,200,240,0.5)';
  ctx.fillRect(x + 20, b - 58, 50, 56);
}

function throneStar(ctx, x, b, time) {
  // a stone dais under a great orrery ring
  const cy = b - 170;
  glow(ctx, x, cy, 130, 130, '255,214,106', 0.3);
  ctx.strokeStyle = '#c9a64a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, cy, 92, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,214,106,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, cy, 70, 26, 0.4, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, cy, 50, 50 * 0.35, -0.6, 0, TAU);
  ctx.stroke();
  glow(ctx, x, cy, 34, 34, '255,240,180', 0.9);
  ctx.fillStyle = '#fff3c0';
  star(ctx, x, cy, 14);
  for (const [rx, ry, rot, sp, r, col] of [[70, 26, 0.4, 0.6, 7, '#9fe8ff'], [50, 17.5, -0.6, -0.9, 5, '#ffb3c7'], [92, 92, 0, 0.3, 8, '#c9b6ff']]) {
    const a = time * sp;
    const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
    ctx.fillStyle = col;
    circle(ctx, x + ex * Math.cos(rot) - ey * Math.sin(rot), cy + ex * Math.sin(rot) + ey * Math.cos(rot), r);
  }
  // the ring's stand
  ctx.fillStyle = '#c9a64a';
  ctx.beginPath();
  ctx.moveTo(x - 10, cy + 90);
  ctx.lineTo(x + 10, cy + 90);
  ctx.lineTo(x + 18, b - 40);
  ctx.lineTo(x - 18, b - 40);
  ctx.fill();
  // dais steps
  for (const [w, y, c] of [[190, b - 22, '#3e3678'], [150, b - 42, '#4a4290']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, w, 24, 6);
    ctx.fill();
  }
  ctx.strokeStyle = `rgba(255,214,106,${0.5 + 0.3 * Math.sin(time * 2)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 60, b - 30);
  ctx.lineTo(x + 60, b - 30);
  ctx.stroke();
}

function ledgeFrost(ctx, p, i, time) {
  const { x, y, w } = p;
  // icy chains up to the ceiling
  ctx.strokeStyle = 'rgba(230,246,255,0.85)';
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  for (const vx of [x + 22, x + w - 22]) {
    ctx.moveTo(vx, 18);
    ctx.lineTo(vx, y + 2);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  glow(ctx, x + w / 2, y + 10, w * 0.6, 30, '200,235,255', 0.35);
  const g = ctx.createLinearGradient(0, y, 0, y + 22);
  g.addColorStop(0, '#e8f6ff');
  g.addColorStop(1, '#94c4ec');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#6aa0d0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 4, y, w + 8, 22, 8);
  ctx.fill();
  ctx.stroke();
  // icicles underneath
  for (let k = 0; k < 8; k++) {
    const ix = x + 10 + k * (w - 20) / 7, len = 10 + ((k * 7 + i * 3) % 5) * 5;
    ctx.fillStyle = 'rgba(225,245,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(ix - 5, y + 20);
    ctx.lineTo(ix + 5, y + 20);
    ctx.lineTo(ix, y + 20 + len);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(ctx, x + w * 0.3, y + 10, w * 0.15, 2);
  // snow cap
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 5, w + 12, 9, 4.5);
  ctx.fill();
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const cx = x + 12 + k * (w - 24) / 5;
    ctx.moveTo(cx + 9, y + 3);
    ctx.arc(cx, y + 3, 9, 0, Math.PI);
  }
  ctx.fill();
  const tw = (time * 0.4 + i * 0.3) % 1;
  ctx.fillStyle = `rgba(255,255,255,${Math.sin(tw * Math.PI)})`;
  star(ctx, x + tw * w, y + 8, 3.5);
}

function ledgeStar(ctx, p, i, time) {
  const { x, y, w } = p;
  const cx = x + w / 2;
  glow(ctx, cx, y + 30, w * 0.55, 40, '201,182,255', 0.4);
  // inverted crystal cluster under the floating slab
  ctx.fillStyle = '#342c6a';
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 14);
  ctx.lineTo(x + w - 6, y + 14);
  ctx.lineTo(cx + w * 0.22, y + 34);
  ctx.lineTo(cx, y + 50);
  ctx.lineTo(cx - w * 0.25, y + 32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(210,190,255,0.85)';
  for (const [dx, hh] of [[-0.25, 16], [-0.08, 26], [0.12, 20], [0.3, 12]]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * w - 5, y + 18);
    ctx.lineTo(cx + dx * w, y + 18 + hh);
    ctx.lineTo(cx + dx * w + 5, y + 18);
    ctx.fill();
  }
  ctx.fillStyle = '#4a4290';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 2, w + 8, 20, 8);
  ctx.fill();
  ctx.fillStyle = '#6a5fb8';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, 9, 4.5);
  ctx.fill();
  const a = 0.5 + 0.4 * Math.sin(time * 2 + i);
  ctx.strokeStyle = `rgba(255,214,106,${a})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 10);
  ctx.lineTo(x + w - 10, y + 10);
  ctx.stroke();
  ctx.setLineDash([]);
  // two sparkles orbiting it
  for (let k = 0; k < 2; k++) {
    const ang = time * 1.2 + k * Math.PI + i;
    const ox = cx + Math.cos(ang) * (w / 2 + 10), oy = y + 12 + Math.sin(ang) * 14;
    ctx.fillStyle = '#fff3c0';
    star(ctx, ox, oy, 3.5);
  }
}

function exitFrameHigh(ctx, theme, x, b, hw, top, opening, time) {
  if (theme === 'frost') {
    ctx.strokeStyle = '#e8f6ff';
    ctx.lineWidth = 18;
    opening();
    ctx.stroke();
    ctx.strokeStyle = '#9fc8ec';
    ctx.lineWidth = 5;
    opening();
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.1 + i * 0.13);
      const ix = x + Math.cos(a) * (hw + 2), iy = top + hw + Math.sin(a) * (hw + 2);
      ctx.fillStyle = 'rgba(230,246,255,0.95)';
      ctx.beginPath();
      ctx.moveTo(ix - 4, iy);
      ctx.lineTo(ix + 4, iy);
      ctx.lineTo(ix, iy + 10 + (i % 3) * 5);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, x - hw - 4, b - 2, 18, 7);
    ellipse(ctx, x + hw + 6, b - 2, 16, 6);
  } else {
    ctx.fillStyle = '#4a4290';
    ctx.strokeStyle = '#2a2458';
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
      ctx.roundRect(bx - 11, by - 10, 22, 20, 5);
      ctx.fill();
      ctx.stroke();
    }
    glow(ctx, x, top - 8, 20, 20, '255,214,106', 0.6 + 0.2 * Math.sin(time * 2));
    ctx.fillStyle = '#ffd66a';
    star(ctx, x, top - 8, 9);
  }
}

function entranceHigh(ctx, x, b, theme, time) {
  if (theme === 'frost') {
    // a snowy mound of blue ice, crystals poking out of the top
    ctx.fillStyle = '#9fc4e4';
    ctx.beginPath();
    ctx.moveTo(x - 114, b + 4);
    ctx.bezierCurveTo(x - 110, b - 110, x - 60, b - 162, x, b - 164);
    ctx.bezierCurveTo(x + 60, b - 162, x + 110, b - 110, x + 114, b + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(ctx, x - 50, b - 110, 30, 46, -0.4);
    for (const [dx, hh, wd] of [[-40, 52, 16], [-20, 76, 18], [6, 64, 16], [30, 44, 14]]) {
      const by = b - 150 + Math.abs(dx) * 0.4;
      ctx.fillStyle = 'rgba(225,245,255,0.95)';
      ctx.strokeStyle = '#6aa0d0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + dx - wd / 2, by + 10);
      ctx.lineTo(x + dx - wd / 2, by - hh + wd);
      ctx.lineTo(x + dx, by - hh);
      ctx.lineTo(x + dx + wd / 2, by - hh + wd);
      ctx.lineTo(x + dx + wd / 2, by + 10);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - 100, b - 80);
    ctx.bezierCurveTo(x - 70, b - 168, x + 70, b - 168, x + 100, b - 80);
    ctx.quadraticCurveTo(x + 70, b - 104, x + 40, b - 112);
    ctx.quadraticCurveTo(x, b - 100, x - 40, b - 114);
    ctx.quadraticCurveTo(x - 70, b - 100, x - 100, b - 80);
    ctx.fill();
    glow(ctx, x, b - 60, 90, 70, '190,230,255', 0.3 + 0.1 * Math.sin(time * 1.5));
  } else {
    // a dark rock mound crowned with glowing crystals and gold stars
    ctx.fillStyle = '#3a3470';
    ctx.beginPath();
    ctx.moveTo(x - 114, b + 4);
    ctx.bezierCurveTo(x - 110, b - 110, x - 60, b - 164, x, b - 166);
    ctx.bezierCurveTo(x + 60, b - 164, x + 110, b - 110, x + 114, b + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ellipse(ctx, x - 50, b - 110, 30, 46, -0.4);
    for (const [dx, hh, col, rgb] of [[-56, 40, '#c9b6ff', '201,182,255'], [-26, 70, '#9fe8ff', '159,232,255'], [10, 88, '#c9b6ff', '201,182,255'], [44, 54, '#ffb3e0', '255,179,224']]) {
      const by = b - 140 + Math.abs(dx) * 0.6;
      glow(ctx, x + dx, by - hh * 0.5, 22, hh * 0.6, rgb, 0.5);
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
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (1.15 + i * 0.18);
      const tw = 0.5 + 0.5 * Math.sin(time * 2 + i);
      ctx.fillStyle = `rgba(255,230,150,${0.5 + 0.5 * tw})`;
      star(ctx, x + Math.cos(a) * 128, b - 40 + Math.sin(a) * 170, 4 + tw * 2);
    }
  }
}

function drawHighAmbient(ctx, theme, L, R, time) {
  if (theme === 'frost') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const f of FROST.flakes) {
      const fall = (time * f.sp + f.y) % 470;
      const x = f.x + Math.sin(time * 0.8 + f.p) * 22, y = fall;
      if (x < L || x > R) continue;
      if (f.s > 1.2) star(ctx, x, y, 3.2 * f.s);
      else circle(ctx, x, y, 1.8 * f.s);
    }
  } else {
    for (const p of STAR.motes) {
      const k = (time * 0.05 * p.s + p.p / TAU) % 1;
      const x = p.x + Math.sin(time * 0.5 + p.p) * 16, y = p.y - k * 90;
      if (x < L || x > R) continue;
      const a = Math.sin(k * Math.PI);
      glow(ctx, x, y, 8, 8, '255,214,106', a * 0.5);
      ctx.fillStyle = `rgba(255,243,192,${a})`;
      star(ctx, x, y, 2.4 * p.s);
    }
  }
}

// ——— the Highlands bosses ———

// Frost Queen Glacia: an elegant icy slime queen with a tall crystal crown and a flowing frost cape
function drawFrostQueen(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const bh = h * 0.64;
  const step = st.walking ? Math.sin(t * 7 + seed) : 0;
  const outline = rageCol('#5e9ad0', enr, 0.25);
  const body = () => {
    ctx.moveTo(-w * 0.46, -2);
    ctx.bezierCurveTo(-w * 0.54, -bh * 0.6, -w * 0.3, -bh, 0, -bh);
    ctx.bezierCurveTo(w * 0.3, -bh, w * 0.54, -bh * 0.6, w * 0.46, -2);
    ctx.quadraticCurveTo(0, 5, -w * 0.46, -2);
    ctx.closePath();
  };
  // the cape, flowing out behind her
  const billow = charging ? 0.3 : Math.sin(t * 1.3 + seed) * 0.04 + step * 0.03;
  ctx.save();
  ctx.translate(-w * 0.08, -bh * 0.8);
  ctx.rotate(billow);
  const cg = ctx.createLinearGradient(0, 0, 0, bh * 0.85);
  cg.addColorStop(0, rageCol('#d8f0ff', enr, 0.2));
  cg.addColorStop(1, rageCol('#8fc0ec', enr, 0.2));
  ctx.fillStyle = cg;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.22, 0);
  ctx.quadraticCurveTo(-w * 0.1, -14, -w * 0.34, 0);
  ctx.bezierCurveTo(-w * 0.6, bh * 0.3, -w * 0.74, bh * 0.6, -w * 0.84, bh * 0.82);
  for (let i = 1; i <= 6; i++) {
    const hx = -w * 0.84 + (i / 6) * w * 0.94;
    ctx.quadraticCurveTo(hx - w * 0.08, bh * 0.82 + (i % 2 ? 10 : -4) + Math.sin(t * 2 + i) * 3, hx, bh * 0.8);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (const [sx, sy] of [[-0.5, 0.35], [-0.66, 0.62], [-0.3, 0.6]]) star(ctx, sx * w, sy * bh, 5);
  ctx.restore();
  // a high collar of ice shards behind her head
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * (0.62 + i * 0.1);
    ctx.save();
    ctx.translate(-w * 0.12, -bh * 0.78);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = 'rgba(220,242,255,0.85)';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(0, -28 - (i % 2) * 8);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // body
  const g = ctx.createLinearGradient(0, -bh, 0, 0);
  g.addColorStop(0, rageCol('#f4fcff', enr, 0.15));
  g.addColorStop(1, rageCol('#94c8f0', enr, 0.3));
  ctx.fillStyle = g;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3.2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ellipse(ctx, -w * 0.22, -bh * 0.7, w * 0.08, bh * 0.12, -0.5);
  // frosty frill along the hem
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const fx0 = -w * 0.4 + k * w * 0.114;
    ctx.moveTo(fx0 + 7, -4);
    ctx.arc(fx0, -4, 7, 0, Math.PI, true);
  }
  ctx.fill();
  // pendant
  ctx.fillStyle = '#4a8ae0';
  ctx.strokeStyle = '#e8f6ff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, -bh * 0.3);
  ctx.lineTo(w * 0.12 + 6, -bh * 0.24);
  ctx.lineTo(w * 0.12, -bh * 0.16);
  ctx.lineTo(w * 0.12 - 6, -bh * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the crown of tall ice crystals
  ctx.save();
  ctx.translate(w * 0.02, -bh + 6);
  ctx.rotate(Math.sin(t * 1.4 + seed) * 0.025);
  for (const [dx, hgt, wd] of [[-26, 30, 10], [-13, 46, 11], [0, 62, 13], [13, 46, 11], [26, 30, 10]]) {
    ctx.fillStyle = 'rgba(232,248,255,0.96)';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dx - wd / 2, 0);
    ctx.lineTo(dx - wd / 2, -hgt + wd);
    ctx.lineTo(dx, -hgt);
    ctx.lineTo(dx + wd / 2, -hgt + wd);
    ctx.lineTo(dx + wd / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(150,200,240,0.55)';
    ctx.beginPath();
    ctx.moveTo(dx, -hgt);
    ctx.lineTo(dx + wd / 2, -hgt + wd);
    ctx.lineTo(dx + wd / 2, 0);
    ctx.lineTo(dx, 0);
    ctx.fill();
  }
  ctx.fillStyle = '#e8f6ff';
  ctx.strokeStyle = outline;
  ctx.beginPath();
  ctx.roundRect(-36, -5, 72, 10, 5);
  ctx.fill();
  ctx.stroke();
  glow(ctx, 0, 0, 12, 12, '120,180,255', 0.8);
  ctx.fillStyle = '#4a8ae0';
  circle(ctx, 0, 0, 4.5);
  const tw = (t * 0.5 + seed) % 1;
  ctx.fillStyle = `rgba(255,255,255,${Math.sin(tw * Math.PI)})`;
  star(ctx, 0, -62, 6);
  ctx.restore();
  // face
  const fx = w * 0.12, fy = -bh * 0.45, gap = 13;
  st.browCol = null;
  bossEyes(ctx, fx, fy, gap, 1.25, st, warn || enr ? 'angry' : 'regal');
  ctx.fillStyle = enr ? 'rgba(255,110,130,0.55)' : 'rgba(255,170,210,0.5)';
  ellipse(ctx, fx - gap - 5, fy + 9, 5.5, 3);
  ellipse(ctx, fx + gap + 5, fy + 9, 5.5, 3);
  ctx.strokeStyle = '#2d2a3e';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (dying > 0.02 || enr) ctx.arc(fx, fy + 18, 5, 1.15 * Math.PI, 1.85 * Math.PI);
  else if (warn || charging) {
    ctx.fillStyle = '#5a3a6a';
    ctx.ellipse(fx, fy + 14, 4.5, 5, 0, 0, TAU);
    ctx.fill();
  } else ctx.arc(fx, fy + 10, 4.5, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  // ice sceptre
  const raise = warn ? -0.9 : charging ? 0.6 : Math.sin(t * 1.2 + seed) * 0.06;
  ctx.save();
  ctx.translate(w * 0.42, -bh * 0.34);
  ctx.rotate(raise);
  ctx.strokeStyle = outline;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(3, -40);
  ctx.stroke();
  ctx.strokeStyle = '#e8f6ff';
  ctx.lineWidth = 3;
  ctx.stroke();
  glow(ctx, 3, -48, 18, 18, '180,225,255', 0.8);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + t * 0.5;
    ctx.moveTo(3, -48);
    ctx.lineTo(3 + Math.cos(a) * 11, -48 + Math.sin(a) * 11);
  }
  ctx.stroke();
  ctx.fillStyle = '#e8f6ff';
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(1, 0, 9, 7, -0.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // a few motes of frost drifting around her
  if (dying < 0.02) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.35 + i / 4 + seed) % 1;
      star(ctx, Math.cos(i * 1.9 + seed) * w * 0.55, -bh * (0.2 + k * 0.9), 3 * Math.sin(k * Math.PI));
    }
  }
  return body;
}

// The Astral Wyrm's body is a starfield: dot positions in body units, a few joined as constellations
const WYRM_STARS = (() => {
  const r = mulberry32(1201);
  return Array.from({ length: 46 }, () => ({ x: r() - 0.6, y: -r() * 0.95, s: 0.6 + r() * 1.4, p: r() * TAU }));
})();
const WYRM_LINES = [[0, 3, 7, 12], [5, 9, 14, 20, 2], [22, 25, 30, 33]];

// Astral Wyrm: a coiled cosmic serpent-dragon of starry jelly
function drawAstralWyrm(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying } = st;
  const bob = Math.sin(t * 1.6 + seed) * 3;
  const hdx = warn ? -8 : charging ? 12 : 0, hdy = warn ? -4 : charging ? 10 : bob;
  const parts = [
    [-w * 0.06, -h * 0.16, w * 0.42, h * 0.16, 0],
    [-w * 0.1, -h * 0.36, w * 0.3, h * 0.13, 0],
    [w * 0.1 + hdx * 0.5, -h * 0.55 + hdy * 0.5, w * 0.1, h * 0.17, 0.5],
    [w * 0.24 + hdx, -h * 0.76 + hdy, w * 0.15, h * 0.14, 0.1],
    [w * 0.37 + hdx, -h * 0.72 + hdy, w * 0.09, h * 0.08, 0.15],
  ];
  const sil = () => {
    for (const [cx, cy, rx, ry, rot] of parts) {
      ctx.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot));
      ctx.ellipse(cx, cy, rx, ry, rot, 0, TAU);
    }
  };
  const top = rageCol('#5a46c8', enr, 0.35), bot = rageCol('#26196a', enr, 0.35);
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  // the tail curling out behind, ending in a star
  const tailPts = [];
  for (let i = 0; i <= 14; i++) {
    const k = i / 14;
    const sw = Math.sin(t * 2 + k * 3 + seed) * 6 * k;
    tailPts.push([-w * 0.4 - k * w * 0.18 + sw * 0.3, -h * 0.12 - k * k * h * 0.5 + sw, 20 * (1 - k * 0.8)]);
  }
  ctx.fillStyle = '#140e38';
  for (const [x, y, r] of tailPts) circle(ctx, x, y, r + 2.5);
  ctx.fillStyle = g;
  for (const [x, y, r] of tailPts) circle(ctx, x, y, r);
  const [tx, ty] = tailPts.at(-1);
  glow(ctx, tx, ty - 6, 22, 22, '255,214,106', 0.8);
  ctx.fillStyle = '#fff3c0';
  star(ctx, tx, ty - 6, 10);
  // little fins along the neck
  for (let i = 0; i < 3; i++) {
    const fx = parts[2][0] - 18 + i * 10, fy = parts[2][1] - 10 - i * 14;
    ctx.fillStyle = 'rgba(159,232,255,0.55)';
    ctx.strokeStyle = 'rgba(200,245,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.quadraticCurveTo(fx - 24, fy - 8 + Math.sin(t * 3 + i) * 3, fx - 20, fy - 22);
    ctx.quadraticCurveTo(fx - 8, fy - 12, fx + 8, fy - 6);
    ctx.fill();
    ctx.stroke();
  }
  // horns behind the head
  const [hx, hy] = parts[3];
  for (const [dx, len] of [[-14, 30], [2, 24]]) {
    ctx.fillStyle = '#ffd66a';
    ctx.strokeStyle = '#b8863a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(hx + dx - 5, hy - h * 0.1);
    ctx.quadraticCurveTo(hx + dx - len * 0.7, hy - h * 0.14 - len * 0.5, hx + dx - len, hy - h * 0.1 - len * 0.55);
    ctx.quadraticCurveTo(hx + dx - len * 0.4, hy - h * 0.1 - len * 0.2, hx + dx + 6, hy - h * 0.1);
    ctx.fill();
    ctx.stroke();
  }
  // the body parts, back to front
  parts.forEach(([cx, cy, rx, ry, rot], i) => {
    ctx.fillStyle = i === 4 ? rageCol('#6a56d8', enr, 0.3) : g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#140e38';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (i < 2) {
      ctx.strokeStyle = 'rgba(190,180,255,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx - 6, ry - 5, rot, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
    }
  });
  // stars and constellations inside the jelly
  ctx.save();
  ctx.beginPath();
  sil();
  ctx.clip();
  glow(ctx, -w * 0.15, -h * 0.15, w * 0.3, h * 0.12, '255,140,210', 0.35);
  glow(ctx, w * 0.0, -h * 0.4, w * 0.25, h * 0.1, '120,220,255', 0.3);
  const P = WYRM_STARS.map((s) => [s.x * w * 1.1, s.y * h]);
  ctx.strokeStyle = `rgba(255,214,106,${0.45 + 0.2 * Math.sin(st.time * 1.5)})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (const line of WYRM_LINES) line.forEach((idx, j) => (j ? ctx.lineTo(...P[idx]) : ctx.moveTo(...P[idx])));
  ctx.stroke();
  WYRM_STARS.forEach((s, i) => {
    const tw = 0.5 + 0.5 * Math.sin(st.time * 2.2 + s.p);
    const inLine = WYRM_LINES.some((l) => l.includes(i));
    ctx.fillStyle = inLine ? '#fff3c0' : `rgba(255,255,255,${0.4 + 0.5 * tw})`;
    if (inLine || s.s > 1.7) star(ctx, P[i][0], P[i][1], (inLine ? 3.4 : 2.6) + tw);
    else circle(ctx, P[i][0], P[i][1], s.s * 0.9);
  });
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ellipse(ctx, -w * 0.25, -h * 0.24, w * 0.12, h * 0.04, -0.2);
  ellipse(ctx, hx - w * 0.05, hy - h * 0.06, w * 0.05, h * 0.03, -0.4);
  ctx.restore();
  // glowing whiskers
  const [sx, sy] = parts[4];
  ctx.strokeStyle = 'rgba(159,232,255,0.85)';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (const d of [0, 1]) {
    // trailing down and back from under the snout
    ctx.beginPath();
    ctx.moveTo(sx - 2 - d * 8, sy + 8);
    for (let i = 1; i <= 8; i++) {
      const k = i / 8;
      ctx.lineTo(sx - 2 - d * 8 - k * (40 + d * 14), sy + 8 + k * (26 + d * 10) + Math.sin(st.time * 3 + k * 6 + d) * 5 * k);
    }
    ctx.stroke();
  }
  // face: big bright eyes, a snout with a little smile
  const fx = hx + w * 0.03, fy = hy - h * 0.025, gap = 11;
  if (dying < 0.02) {
    ctx.fillStyle = '#f4f0ff';
    for (const s of [-1, 1]) ellipse(ctx, fx + s * gap, fy, 6.6, 7.6);
  }
  st.browCol = '#c9b6ff';
  bossEyes(ctx, fx, fy, gap, 1.3, st, warn || enr ? 'angry' : 'calm');
  ctx.fillStyle = enr ? 'rgba(255,100,120,0.55)' : 'rgba(255,150,210,0.45)';
  ellipse(ctx, fx - gap - 4, fy + 10, 5, 2.6);
  ellipse(ctx, fx + gap + 6, fy + 10, 5, 2.6);
  ctx.fillStyle = '#1a1240';
  ellipse(ctx, sx + w * 0.07, sy - 4, 2.2, 1.6);
  ctx.strokeStyle = '#d8ccff';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (warn || charging) {
    glow(ctx, sx + 4, sy + 6, 16, 12, '255,214,106', 0.9);
    ctx.fillStyle = '#fff3c0';
    ctx.ellipse(sx + 4, sy + 6, 7, 5, 0, 0, TAU);
    ctx.fill();
  } else if (dying > 0.02 || enr) ctx.arc(sx + 2, sy + 12, 5, 1.15 * Math.PI, 1.85 * Math.PI);
  else {
    ctx.arc(sx + 2, sy + 2, 6, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy + 7);
    ctx.lineTo(sx + 6, sy + 12);
    ctx.lineTo(sx + 8, sy + 7);
    ctx.fill();
    ctx.beginPath();
  }
  ctx.stroke();
  st.browCol = null;
  return sil;
}

// ——— leap, phase change and ultimates ———

function initUltFx(e, r) {
  const k = e.kind;
  if (k === 'phase') {
    e.rays = Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * TAU + r() * 0.2, len: 0.7 + r() * 0.5 }));
    e.parts = debris(r, e.theme, 24, 100, 380, 150, 450);
  } else if (k === 'stompWarn' || k === 'stompHit') {
    e.cracks = [];
    for (const dir of [-1, 1]) {
      for (let c = 0; c < 2; c++) {
        const pts = [[0, 0]];
        let px = 0, py = 0;
        while (Math.abs(px) < DEN_W) {
          px += dir * (14 + r() * 24);
          py = clamp(py + (r() - 0.5) * 9, -2, 30);
          pts.push([px, py]);
        }
        e.cracks.push(pts);
      }
    }
    if (k === 'stompHit') e.parts = Array.from({ length: 50 }, () => ({ x: r() * DEN_W, vx: (r() - 0.5) * 120, vy: -(200 + r() * 420), rot: r() * TAU, vr: (r() - 0.5) * 14, s: 0.8 + r() * 0.8, c: FXPAL[e.theme].debris[Math.floor(r() * 4)], d: r() * 0.25 }));
  } else if (k === 'sporesWarn' || k === 'sporesHit') {
    e.puffs = Array.from({ length: 46 }, () => ({ x: r() * DEN_W, y: 60 + r() * 400, r: 30 + r() * 50, p: r() * TAU, d: r() * 0.35 }));
  } else if (k === 'waveGo' || k === 'waveWarn') {
    e.spikes = Array.from({ length: 14 }, () => ({ o: r(), h: 0.6 + r() * 0.4, lean: (r() - 0.5) * 0.6 }));
  } else if (k === 'lanesHit') {
    e.parts = debris(r, e.theme === 'warden' ? 'warden' : 'frost', 40, 40, 260, 120, 360).map((p) => ({ ...p, lane: Math.floor(r() * 5), ox: r() }));
  } else if (k === 'novaWarn' || k === 'novaHit') {
    e.motes = Array.from({ length: 40 }, () => ({ a: r() * TAU, d: 0.5 + r() * 0.5, p: r() }));
  }
}

function drawUltFx(ctx, e, k) {
  const own = ULT_LOOKS[e.theme]?.[e.kind];
  if (own) return own(ctx, e, k);
  switch (e.kind) {
    case 'leap': return fxLeap(ctx, e, k);
    case 'phase': return fxPhase(ctx, e, k);
    case 'stompWarn': return fxStompWarn(ctx, e, k);
    case 'stompHit': return fxStompHit(ctx, e, k);
    case 'sporesWarn': return fxSporesWarn(ctx, e, k);
    case 'sporesHit': return fxSporesHit(ctx, e, k);
    case 'waveWarn': return fxWaveWarn(ctx, e, k);
    case 'waveGo': return fxWaveGo(ctx, e, k);
    case 'lanesWarn': return fxLanesWarn(ctx, e, k);
    case 'lanesHit': return fxLanesHit(ctx, e, k);
    case 'novaWarn': return fxNovaWarn(ctx, e, k);
    case 'novaHit': return fxNovaHit(ctx, e, k);
  }
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

function fxLeap(ctx, e, k) {
  const { x, y, tx } = e, rgb = FXPAL[e.theme].warn;
  const pulse = 0.5 + 0.5 * Math.sin(e.t * (10 + 14 * k));
  const R = 140, ry = 18;
  // dotted arc from the boss to where it'll land
  const apex = 230;
  ctx.strokeStyle = `rgba(255,250,240,${0.35 + 0.3 * pulse})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 10]);
  ctx.lineDashOffset = -e.t * 60;
  ctx.beginPath();
  ctx.moveTo(x, y - 40);
  ctx.quadraticCurveTo((x + tx) / 2, y - 40 - apex * 2, tx, y - 30);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = `rgba(${rgb},${0.15 + 0.1 * pulse})`;
  ellipse(ctx, tx, y + 3, R, ry);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(tx, y + 3, R, ry, 0, 0, TAU);
  ctx.clip();
  ctx.fillStyle = `rgba(${rgb},0.35)`;
  ellipse(ctx, tx, y + 3, R * ease(k), ry * (0.4 + 0.6 * k));
  stripes(ctx, tx - R, y - ry, tx + R, y + ry + 3, 18, e.t * 50, `rgba(${rgb},${0.2 + 0.15 * k})`);
  ctx.restore();
  ctx.strokeStyle = k > 0.85 ? '#ffffff' : `rgba(${rgb},${0.7 + 0.3 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(tx, y + 3, R, ry, 0, 0, TAU);
  ctx.stroke();
  // big chevrons pointing down at the target
  ctx.strokeStyle = `rgba(${rgb},${0.6 + 0.4 * pulse})`;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 3; i++) {
    const cy = y - 110 + i * 20 + pulse * 8;
    ctx.beginPath();
    ctx.moveTo(tx - 16, cy - 8);
    ctx.lineTo(tx, cy + 4);
    ctx.lineTo(tx + 16, cy - 8);
    ctx.stroke();
  }
}

function fxPhase(ctx, e, k) {
  const { x, y, theme, n } = e, rgb = THEME_RGB[theme], cy = y - 80;
  const fade = 1 - k;
  if (k < 0.25) glow(ctx, x, cy, 260 * (0.5 + k * 2), 220 * (0.5 + k * 2), '255,255,240', (1 - k / 0.25) * 0.9);
  // rotating rays
  ctx.save();
  ctx.translate(x, cy);
  ctx.rotate(e.t * 0.8);
  for (const r of e.rays) {
    const len = 260 * r.len * ease(Math.min(1, k * 2.5));
    ctx.fillStyle = `rgba(${rgb},${0.35 * fade})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(r.a - 0.06) * len, Math.sin(r.a - 0.06) * len);
    ctx.lineTo(Math.cos(r.a + 0.06) * len, Math.sin(r.a + 0.06) * len);
    ctx.fill();
  }
  ctx.restore();
  for (let i = 0; i < 2; i++) {
    const j = clamp(k * 1.6 - i * 0.2, 0, 1);
    if (j <= 0 || j >= 1) continue;
    ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - j)})`;
    ctx.lineWidth = 10 * (1 - j) + 1;
    ctx.beginPath();
    ctx.ellipse(x, cy, 40 + 360 * ease(j), (40 + 360 * ease(j)) * 0.55, 0, 0, TAU);
    ctx.stroke();
  }
  for (const p of e.parts) {
    const tt = e.t;
    ctx.globalAlpha = fade;
    drawBit(ctx, theme, x + p.vx * tt, Math.min(y, cy + p.vy * tt + 0.5 * GRAV * tt * tt), p.rot + p.vr * tt, p.s * 1.2, p.c);
  }
  ctx.globalAlpha = 1;
  // the title
  const pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.6 : 1.2 - Math.min(0.2, (k - 0.15) * 0.8);
  const a = k < 0.75 ? 1 : (1 - k) / 0.25;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, cy - 130 - k * 20);
  ctx.scale(pop, pop);
  ctx.font = "700 34px Fredoka, 'Trebuchet MS', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = `PHASE ${['II', 'II', 'II', 'III', 'IV'][n] ?? 'III'}`; // (IV: a final boss's last, FB1)
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = n >= 3 ? '#a8303a' : '#6a3a8a';
  ctx.strokeText(label, 0, 0);
  ctx.fillStyle = '#fffaf0';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

function ledgeSafe(ctx, time, a) {
  for (const p of DEN_PLATFORMS) {
    glow(ctx, p.x + p.w / 2, p.y - 10, p.w * 0.7, 46, '120,240,160', 0.5 * a);
    ctx.strokeStyle = `rgba(150,255,180,${(0.6 + 0.35 * Math.sin(time * 6)) * a})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(p.x - 8, p.y - 8, p.w + 16, 34, 12);
    ctx.stroke();
    ctx.globalAlpha = a;
    safeTag(ctx, p.x + p.w / 2, p.y - 22, time);
    ctx.globalAlpha = 1;
  }
}

function fxStompWarn(ctx, e, k) {
  const { x, theme } = e, rgb = FXPAL[theme].warn, y = GROUND;
  const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 16 * k));
  // the whole floor glowing angrier
  const g = ctx.createLinearGradient(0, y - 70, 0, y + 30);
  g.addColorStop(0, `rgba(${rgb},0)`);
  g.addColorStop(0.7, `rgba(${rgb},${(0.2 + 0.35 * k) * (0.7 + 0.3 * pulse)})`);
  g.addColorStop(1, `rgba(${rgb},${0.1 + 0.2 * k})`);
  ctx.fillStyle = g;
  ctx.fillRect(-20, y - 70, DEN_W + 40, 100);
  stripes(ctx, -20, y - 2, DEN_W + 20, y + 14, 22, e.t * 60, `rgba(${rgb},${0.15 + 0.3 * k})`);
  // cracks creeping out from the boss
  ctx.strokeStyle = FXPAL[theme].crack;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const c of e.cracks) {
    ctx.beginPath();
    const n = Math.floor(c.length * ease(k));
    for (let i = 0; i < n; i++) (i ? ctx.lineTo(x + c[i][0], y + 4 + c[i][1]) : ctx.moveTo(x + c[i][0], y + 4 + c[i][1]));
    ctx.stroke();
  }
  // pebbles rattling on the floor
  ctx.fillStyle = `rgba(${FXPAL[theme].dust},0.9)`;
  for (let px = 40; px < DEN_W; px += 90) circle(ctx, px, y - 3 - Math.abs(Math.sin(e.t * 22 + px)) * 6 * k, 3);
  ledgeSafe(ctx, e.t, Math.min(1, k * 4));
}

function fxStompHit(ctx, e, k) {
  const { x, theme } = e, P = FXPAL[theme], y = GROUND;
  const fade = 1 - k;
  if (k < 0.2) {
    ctx.fillStyle = `rgba(255,240,230,${0.6 * (1 - k / 0.2)})`;
    ctx.fillRect(-20, 0, DEN_W + 40, H);
  }
  ctx.strokeStyle = P.crack;
  ctx.globalAlpha = fade;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const c of e.cracks) {
    ctx.beginPath();
    c.forEach(([px, py], i) => (i ? ctx.lineTo(x + px, y + 4 + py) : ctx.moveTo(x + px, y + 4 + py)));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // quake crests rolling the length of the den
  const d = 1700 * ease(Math.min(1, k * 1.6));
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const wx = x + s * (d - i * 90), hh = (50 - i * 12) * fade + 4;
      ctx.fillStyle = `rgba(${P.dust},${0.7 * fade})`;
      ctx.beginPath();
      ctx.moveTo(wx - s * 70, y + 2);
      ctx.quadraticCurveTo(wx - s * 20, y - hh * 0.4, wx, y - hh);
      ctx.quadraticCurveTo(wx + s * 14, y - hh * 0.5, wx + s * 24, y + 2);
      ctx.fill();
    }
  }
  // dust clouds all along the floor
  for (let px = 30; px < DEN_W; px += 75) {
    const j = clamp((k * 1700 * 1.6 - Math.abs(px - x)) / 400, 0, 1);
    if (j <= 0) continue;
    ctx.fillStyle = `rgba(${P.dust},${0.5 * fade * j})`;
    circle(ctx, px, y - 10 - j * 14, 14 + j * 16);
  }
  for (const p of e.parts) {
    const tt = e.t - p.d;
    if (tt <= 0) continue;
    ctx.globalAlpha = fade;
    drawBit(ctx, theme, p.x + p.vx * tt, Math.min(y, y - 4 + p.vy * tt + 0.5 * GRAV * tt * tt), p.rot + p.vr * tt, p.s * 1.3, p.c);
  }
  ctx.globalAlpha = 1;
}

// The fog covers the den except a dome over each safe circle
function fogPath(ctx, safe) {
  ctx.beginPath();
  ctx.rect(-40, -10, DEN_W + 80, H + 20);
  for (const sx of safe) {
    ctx.moveTo(sx + SAFE_R + 12, GROUND - 40);
    ctx.ellipse(sx, GROUND - 40, SAFE_R + 12, 130, 0, 0, TAU);
  }
}

function safeCircles(ctx, safe, time, a) {
  for (const sx of safe) {
    const g = ctx.createLinearGradient(0, GROUND - 170, 0, GROUND);
    g.addColorStop(0, 'rgba(160,255,200,0)');
    g.addColorStop(1, `rgba(160,255,200,${0.35 * a})`);
    ctx.fillStyle = g;
    ctx.fillRect(sx - SAFE_R, GROUND - 170, SAFE_R * 2, 170);
    glow(ctx, sx, GROUND, SAFE_R * 1.3, 26, '140,255,190', 0.7 * a);
    ctx.strokeStyle = `rgba(200,255,220,${(0.7 + 0.3 * Math.sin(time * 6)) * a})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(sx, GROUND + 2, SAFE_R, 16, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = a;
    safeTag(ctx, sx, GROUND - 120, time);
    ctx.globalAlpha = 1;
  }
}

function fxSporesWarn(ctx, e, k) {
  const a = ease(k);
  ctx.save();
  fogPath(ctx, e.safe);
  ctx.fillStyle = `rgba(110,60,150,${0.1 + 0.32 * a})`;
  ctx.fill('evenodd');
  ctx.clip('evenodd');
  for (const p of e.puffs) {
    const px = p.x + Math.sin(e.t * 0.6 + p.p) * 30, py = p.y + Math.cos(e.t * 0.5 + p.p) * 12;
    glow(ctx, px, py, p.r * (0.8 + a * 0.6), p.r * (0.6 + a * 0.4), '190,120,230', 0.25 + 0.4 * a);
  }
  // spore specks
  for (let i = 0; i < 70; i++) {
    const sx = (i * 211.7) % DEN_W + Math.sin(e.t + i) * 14, sy = 40 + ((i * 97.3 + e.t * 30 * (1 + (i % 3))) % 420);
    ctx.fillStyle = `rgba(230,200,255,${0.5 * a})`;
    circle(ctx, sx, sy, 1.6 + (i % 3) * 0.6);
  }
  ctx.restore();
  safeCircles(ctx, e.safe, e.t, Math.min(1, k * 4));
}

function fxSporesHit(ctx, e, k) {
  const fade = 1 - k;
  ctx.save();
  fogPath(ctx, e.safe);
  ctx.clip('evenodd');
  if (k < 0.2) {
    ctx.fillStyle = `rgba(230,180,255,${0.7 * (1 - k / 0.2)})`;
    ctx.fillRect(-40, 0, DEN_W + 80, H);
  }
  ctx.fillStyle = `rgba(110,60,150,${0.4 * fade})`;
  ctx.fillRect(-40, 0, DEN_W + 80, H);
  for (const p of e.puffs) {
    const j = clamp((k - p.d * 0.5) / 0.6, 0, 1);
    if (j <= 0 || j >= 1) continue;
    ctx.fillStyle = `rgba(220,170,255,${0.75 * (1 - j)})`;
    circle(ctx, p.x, p.y, p.r * (0.3 + j));
    ctx.fillStyle = `rgba(255,240,255,${0.8 * (1 - j)})`;
    circle(ctx, p.x - p.r * 0.2, p.y - p.r * 0.2, p.r * 0.3 * (0.3 + j));
  }
  ctx.restore();
  safeCircles(ctx, e.safe, e.t, fade);
}

function thornMass(ctx, fx, dir, hh, time, spikes) {
  // the rolling front of a thorn wave: a dark mound, spikes, curling vines and berries
  const back = fx - dir * 220, y = GROUND + 2;
  ctx.fillStyle = '#3e2440';
  ctx.strokeStyle = '#1e1020';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(back, y);
  ctx.quadraticCurveTo(back + dir * 120, y - hh * 0.7, fx - dir * 30, y - hh);
  ctx.quadraticCurveTo(fx + dir * 20, y - hh * 0.9, fx + dir * 24, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2a1830';
  spikes.forEach((s, i) => {
    const sx = back + dir * (s.o * 230), base = y - hh * (1 - Math.abs(s.o - 0.85) * 1.1) * 0.8;
    const len = 26 * s.h;
    ctx.save();
    ctx.translate(sx, Math.min(y - 4, base));
    ctx.rotate(s.lean + dir * 0.3 + Math.sin(time * 6 + i) * 0.05);
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.lineTo(0, -len);
    ctx.lineTo(6, 4);
    ctx.fill();
    ctx.restore();
  });
  // rolling vine curls
  ctx.strokeStyle = '#5a3a58';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const cx = fx - dir * (40 + i * 60), cy = y - hh * (0.45 - i * 0.08), r = 14 + i * 3;
    const a0 = time * 9 * dir + i;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a0 + 4.2);
    ctx.stroke();
  }
  berry(ctx, fx - dir * 60, y - hh * 0.6, 5, time);
  berry(ctx, fx - dir * 130, y - hh * 0.4, 4.5, time + 1);
  // spray at the front
  for (let i = 0; i < 5; i++) {
    const j = (time * 3 + i * 0.2) % 1;
    ctx.fillStyle = `rgba(150,120,150,${0.6 * (1 - j)})`;
    circle(ctx, fx + dir * (10 + j * 30), y - 6 - j * 30 - i * 4, 6 + j * 8);
  }
}

function fxWaveWarn(ctx, e, k) {
  const { x0, dir, theme } = e, rgb = FXPAL[theme].warn, y = GROUND;
  const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 14 * k));
  // a warning lane all along the floor
  ctx.fillStyle = `rgba(${rgb},${0.12 + 0.12 * pulse})`;
  ctx.fillRect(-20, y - 70, DEN_W + 40, 72);
  ctx.strokeStyle = `rgba(255,250,240,${0.35 + 0.3 * pulse})`;
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
  // the wall of thorns rising
  const hh = 70 * ease(k);
  if (hh > 2) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-40, y - hh - 30, DEN_W + 80, hh + 34);
    ctx.clip();
    if (theme === 'tide') waterMass(ctx, x0 + dir * 20, dir, hh, e.t);
    else if (theme === 'oath') iceMass(ctx, x0 + dir * 20, dir, hh, e.t);
    else thornMass(ctx, x0 + dir * 20, dir, hh, e.t, e.spikes);
    ctx.restore();
  }
  glow(ctx, x0, y - 40, 120, 80, '255,70,60', 0.3 + 0.3 * pulse);
}

function fxWaveGo(ctx, e, k) {
  const fx = e.x0 + e.dir * e.speed * e.t;
  void k;
  if (e.theme === 'tide') waterMass(ctx, fx, e.dir, 66, e.t);
  else if (e.theme === 'oath') iceMass(ctx, fx, e.dir, 66, e.t);
  else thornMass(ctx, fx, e.dir, 66, e.t, e.spikes);
}

// Sigrun's Close the Seam: new ice racing along the floor the way she freezes the crack shut, a ridge of clear
// blue blocks heaving up at the front, frost feathers flying off it, a trail of fresh ice behind
function iceMass(ctx, fx, dir, hh, time) {
  const back = fx - dir * 240, y = GROUND + 2;
  ctx.fillStyle = 'rgba(200,230,252,0.75)';
  ctx.fillRect(Math.min(back, fx), y - 10, Math.abs(fx - back), 12);
  for (let i = 0; i < 7; i++) {
    const bx = fx - dir * (i * 30), bh = hh * (1 - i * 0.12) * (0.85 + 0.15 * Math.sin(time * 9 + i));
    if (bh <= 4) continue;
    ctx.fillStyle = i % 2 ? '#cfe6fa' : '#b4d4f0';
    ctx.strokeStyle = '#3e6294';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx - 16, y);
    ctx.lineTo(bx - 12 + dir * 4, y - bh);
    ctx.lineTo(bx + 4 + dir * 8, y - bh * 0.86);
    ctx.lineTo(bx + 16, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(bx - 8, y - bh + 6, 4, bh - 10);
  }
  glow(ctx, fx, y - hh * 0.5, 70, hh, '190,230,255', 0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 6; i++) {
    const j = (time * 3 + i * 0.17) % 1;
    circle(ctx, fx + dir * (8 + j * 40), y - hh * 0.6 - j * 30 + i * 4, 2 + (1 - j) * 2);
  }
}

// The Tidemother's Riptide: a rolling wall of green water with a curling white crest, shells tumbling in it
function waterMass(ctx, fx, dir, hh, time) {
  const back = fx - dir * 240, y = GROUND + 2;
  const g = ctx.createLinearGradient(0, y - hh - 20, 0, y);
  g.addColorStop(0, 'rgba(160,230,235,0.95)');
  g.addColorStop(1, 'rgba(46,120,150,0.95)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(back, y);
  ctx.lineTo(back, y - hh * 0.5);
  ctx.quadraticCurveTo((back + fx) / 2, y - hh * 0.9 + Math.sin(time * 6) * 4, fx - dir * 30, y - hh - 6);
  ctx.quadraticCurveTo(fx + dir * 20, y - hh - 14, fx + dir * 18, y - hh * 0.4);
  ctx.quadraticCurveTo(fx + dir * 30, y - 10, fx + dir * 10, y);
  ctx.closePath();
  ctx.fill();
  // the curling crest
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fx - dir * 60, y - hh * 0.9);
  ctx.quadraticCurveTo(fx, y - hh - 18, fx + dir * 20, y - hh * 0.55);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 7; i++) circle(ctx, fx + dir * (10 - i * 12) + Math.sin(time * 9 + i) * 3, y - hh * (0.6 + (i % 3) * 0.12) - 8, 4 + (i % 3) * 2);
  // shells and bubbles tumbling inside
  for (let i = 0; i < 6; i++) {
    const px = fx - dir * (30 + ((i * 37 + time * 120) % 200)), py = y - 12 - ((i * 23) % (hh * 0.7));
    ctx.fillStyle = i % 2 ? 'rgba(255,214,201,0.9)' : 'rgba(255,255,255,0.6)';
    circle(ctx, px, py, i % 2 ? 4 : 2.5);
  }
}

function fxLanesWarn(ctx, e, k) {
  const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 12 * k));
  const y = GROUND;
  e.lanes.forEach(([a, b], i) => {
    const w = b - a, mid = (a + b) / 2;
    if (i === e.safe) {
      const g = ctx.createLinearGradient(0, 30, 0, y);
      g.addColorStop(0, 'rgba(160,255,210,0)');
      g.addColorStop(1, `rgba(160,255,210,${0.3 + 0.15 * pulse})`);
      ctx.fillStyle = g;
      ctx.fillRect(a, 30, w, y - 30);
      glow(ctx, mid, y, w * 0.6, 24, '140,255,190', 0.7);
      safeTag(ctx, mid, y - 150, e.t);
      return;
    }
    const g = ctx.createLinearGradient(0, 30, 0, y);
    g.addColorStop(0, `rgba(255,96,120,${0.08 + 0.12 * k})`);
    g.addColorStop(1, `rgba(255,70,100,${(0.25 + 0.3 * k) * (0.7 + 0.3 * pulse)})`);
    ctx.fillStyle = g;
    ctx.fillRect(a, 30, w, y - 30);
    // giant icicles forming overhead (the Root Warden's Hold Fast: roots pushing up out of the floor)
    const n = 3, len = 30 + 120 * ease(k);
    if (e.theme === 'warden') {
      for (let j = 0; j < n; j++) wardenRoot(ctx, a + w * ((j + 0.5) / n), y, 12 + 26 * ease(k), j + i * 3, e.t);
    } else for (let j = 0; j < n; j++) {
      const ix = a + w * ((j + 0.5) / n), iw = Math.min(46, w / n - 8), L2 = len * (j === 1 ? 1 : 0.8);
      ctx.fillStyle = 'rgba(228,246,255,0.95)';
      ctx.strokeStyle = '#6aa0d0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ix - iw / 2, 24);
      ctx.lineTo(ix + iw / 2, 24);
      ctx.lineTo(ix, 24 + L2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(150,200,240,0.5)';
      ctx.beginPath();
      ctx.moveTo(ix, 24);
      ctx.lineTo(ix + iw / 2, 24);
      ctx.lineTo(ix, 24 + L2);
      ctx.fill();
    }
    // target marks on the floor
    ctx.strokeStyle = `rgba(255,96,120,${0.5 + 0.4 * pulse})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(mid, y + 3, w * 0.4, 10, 0, 0, TAU);
    ctx.stroke();
  });
  // lane dividers
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  for (const [a] of e.lanes.slice(1)) {
    ctx.moveTo(a, 40);
    ctx.lineTo(a, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function fxLanesHit(ctx, e, k) {
  const y = GROUND, fall = 0.28;
  e.lanes.forEach(([a, b], i) => {
    if (i === e.safe) return;
    const w = b - a;
    for (let j = 0; j < 3; j++) {
      const ix = a + w * ((j + 0.5) / 3), iw = Math.min(46, w / 3 - 8), L2 = 150 * (j === 1 ? 1 : 0.8);
      if (e.theme === 'warden') {
        // roots burst up the whole height of the lane, then sink back
        const up = k < fall ? ease(k / fall) : 1 - (k - fall) / (1 - fall);
        wardenRoot(ctx, ix, y, (L2 + 120) * up, j + i * 3, e.t);
        continue;
      }
      if (k < fall) {
        const f = k / fall, tip = 24 + L2 + (y - 24 - L2) * f * f;
        ctx.fillStyle = 'rgba(228,246,255,0.95)';
        ctx.strokeStyle = '#6aa0d0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ix - iw / 2, tip - L2);
        ctx.lineTo(ix + iw / 2, tip - L2);
        ctx.lineTo(ix, tip);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // shattered stumps sticking out of the floor
        const j2 = (k - fall) / (1 - fall);
        ctx.globalAlpha = 1 - j2;
        ctx.fillStyle = 'rgba(228,246,255,0.95)';
        ctx.beginPath();
        ctx.moveTo(ix - iw * 0.4, y + 2);
        ctx.lineTo(ix - 4, y - 34);
        ctx.lineTo(ix + 6, y - 20);
        ctx.lineTo(ix + iw * 0.4, y + 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    if (k >= fall) {
      const j2 = (k - fall) / (1 - fall);
      ctx.fillStyle = e.theme === 'warden' ? `rgba(255,220,150,${0.4 * (1 - j2)})` : `rgba(200,235,255,${0.55 * (1 - j2)})`;
      ctx.fillRect(a, 20, w, y - 20);
    }
  });
  if (k >= fall) {
    const tt = e.t - e.dur * fall;
    for (const p of e.parts) {
      if (p.lane === e.safe || !e.lanes[p.lane]) continue;
      const [a, b] = e.lanes[p.lane];
      ctx.globalAlpha = 1 - (k - fall) / (1 - fall);
      drawBit(ctx, e.theme === 'warden' ? 'warden' : 'frost', a + p.ox * (b - a) + p.vx * tt, Math.min(y, y - 6 + p.vy * tt + 0.5 * GRAV * tt * tt), p.rot + p.vr * tt, p.s * 1.4, p.c);
    }
    ctx.globalAlpha = 1;
  }
}

function fxNovaWarn(ctx, e, k) {
  const { x, y, r } = e, cy = y - 90;
  const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 14 * k));
  // the danger disc on the floor, out to r
  ctx.fillStyle = `rgba(255,190,90,${0.08 + 0.18 * k})`;
  ellipse(ctx, x, y + 4, r, 26);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y + 4, r, 26, 0, 0, TAU);
  ctx.clip();
  ctx.fillStyle = `rgba(255,110,90,${0.25 * k})`;
  ellipse(ctx, x, y + 4, r * ease(k), 26 * ease(k));
  ctx.restore();
  ctx.strokeStyle = `rgba(255,${Math.round(120 + 100 * pulse)},90,${0.7 + 0.3 * pulse})`;
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 8]);
  ctx.lineDashOffset = e.t * 40;
  ctx.beginPath();
  ctx.ellipse(x, y + 4, r, 26, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  // run-outwards arrows just past the edge
  ctx.strokeStyle = `rgba(255,250,240,${0.5 + 0.4 * pulse})`;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const ax = x + s * (r - 50 + i * 16 + pulse * 6);
      ctx.beginPath();
      ctx.moveTo(ax - s * 8, y - 28);
      ctx.lineTo(ax + s * 4, y - 18);
      ctx.lineTo(ax - s * 8, y - 8);
      ctx.stroke();
    }
    if (x + s * (r + 50) > 20 && x + s * (r + 50) < DEN_W - 20) safeTag(ctx, x + s * (r + 50), y - 40, e.t);
  }
  // starlight streaming in to the boss
  for (const m of e.motes) {
    const j = (e.t * 0.8 + m.p) % 1, d = 320 * m.d * (1 - j);
    const px = x + Math.cos(m.a) * d, py = cy + Math.sin(m.a) * d * 0.7;
    ctx.fillStyle = `rgba(255,240,180,${Math.sin(j * Math.PI)})`;
    star(ctx, px, py, 3 + 2 * (1 - j));
  }
  glow(ctx, x, cy, 30 + 70 * k, 30 + 70 * k, '255,230,150', 0.6 + 0.3 * pulse);
  ctx.fillStyle = '#fffbe8';
  circle(ctx, x, cy, 6 + 16 * k);
}

function fxNovaHit(ctx, e, k) {
  const { x, y, r } = e, cy = y - 90;
  const grow = ease(Math.min(1, k * 3)), fade = 1 - k;
  const rad = r * grow;
  glow(ctx, x, cy, rad * 1.3 + 40, rad * 0.9 + 40, '255,240,190', fade);
  ctx.fillStyle = `rgba(255,252,235,${0.75 * fade})`;
  ctx.beginPath();
  ctx.ellipse(x, cy + 40, rad, rad * 0.62, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,214,106,${fade})`;
  ctx.lineWidth = 10 * fade + 2;
  ctx.beginPath();
  ctx.ellipse(x, cy + 40, rad, rad * 0.62, 0, 0, TAU);
  ctx.stroke();
  // rays
  ctx.strokeStyle = `rgba(255,255,255,${0.8 * fade})`;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const m of e.motes.slice(0, 16)) {
    const d0 = rad * 0.3, d1 = rad * (0.6 + 0.4 * m.d);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(m.a) * d0, cy + 40 + Math.sin(m.a) * d0 * 0.62);
    ctx.lineTo(x + Math.cos(m.a) * d1, cy + 40 + Math.sin(m.a) * d1 * 0.62);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(255,243,168,${fade})`;
  for (const m of e.motes.slice(16)) star(ctx, x + Math.cos(m.a) * rad * m.d, cy + 40 + Math.sin(m.a) * rad * m.d * 0.62 - k * 30, 6 * fade + 2);
}

// ——— ultimate warning banner (screen space) ———

// k: share of the warning time left (1 → 0). No line saying what to do: players learn each ultimate (owner, 2026-10-26)
export function drawUltBanner(ctx, bossName, ultName, k, time) {
  k = clamp(k, 0, 1);
  const cx = 480, cy = 150, w = 540, h = 90;
  const pop = 1 + 0.18 * clamp((k - 0.92) / 0.08, 0, 1);
  const pulse = 0.5 + 0.5 * Math.sin(time * (8 + (1 - k) * 10));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pop, pop);
  glow(ctx, 0, 0, w * 0.7, h * 1.1, '255,70,60', 0.35 + 0.25 * pulse);
  ctx.fillStyle = 'rgba(58,22,44,0.9)';
  ctx.strokeStyle = mix('#ff6a5a', '#ffd06a', pulse);
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 18);
  ctx.fill();
  ctx.stroke();
  // hazard stripes at both ends
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 13);
  ctx.clip();
  for (const s of [-1, 1]) stripes(ctx, s < 0 ? -w / 2 : w / 2 - 34, -h / 2, s < 0 ? -w / 2 + 34 : w / 2, h / 2, 16, time * 30, `rgba(255,${Math.round(110 + 90 * pulse)},90,0.45)`);
  ctx.restore();
  // the ULTIMATE tag
  ctx.fillStyle = mix('#e0465a', '#ff7a5a', pulse);
  ctx.strokeStyle = '#fffaf0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-58, -h / 2 - 13, 116, 26, 13);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'ULTIMATE', 0, -h / 2 + 0.5, 14, '#fffaf0');
  text(ctx, `${bossName} prepares`, 0, -h / 2 + 30, 13, 'rgba(255,235,240,0.8)');
  ctx.save();
  ctx.font = "700 30px Fredoka, 'Trebuchet MS', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#a8303a';
  ctx.strokeText(ultName, 0, -h / 2 + 56);
  ctx.fillStyle = '#fffaf0';
  ctx.fillText(ultName, 0, -h / 2 + 56);
  ctx.restore();
  // time left
  const bw = w - 80, by = h / 2 - 12;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(-bw / 2, by, bw, 6, 3);
  ctx.fill();
  if (k > 0) {
    ctx.fillStyle = mix('#ff5a4a', '#ffd06a', k);
    ctx.beginPath();
    ctx.roundRect(-bw / 2, by, Math.max(6, bw * k), 6, 3);
    ctx.fill();
  }
  ctx.restore();
}
