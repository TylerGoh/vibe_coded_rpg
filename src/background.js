// Docs: docs/art.md
import { W, H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { rgba } from './environment.js';
import { drawDistantIslands } from './distant.js';

const TILE = 1600; // every layer repeats seamlessly every TILE px
const TOP = 150; // nothing in the scenery layers reaches above this
const HAZE = '#f0faff';
// Atmospheric haze: things further back get washed toward pale blue (n = layers in front of it).
const hazed = (color, n) => mix(color, HAZE, 1 - 0.82 ** n);

// Scenery layers are drawn once into offscreen canvases at this pixel density, then just slid around.
let res = 1;
export function setBackgroundResolution(r) {
  if (r === res) return;
  res = r;
  for (const L of layers) L.caches.clear();
}

// A wavy horizon line that is periodic over TILE.
function band(seed, base, amps) {
  const r = mulberry32(seed);
  const waves = amps.map((a, i) => ({ a, k: i + 1 + Math.floor(r() * 2), p: r() * TAU }));
  return (x) => base + waves.reduce((sum, w) => sum + w.a * Math.sin((TAU * w.k * x) / TILE + w.p), 0);
}

function makeTrees(seed, count, sizeMin, sizeMax) {
  const r = mulberry32(seed);
  const trees = [];
  for (let i = 0; i < count; i++) {
    trees.push({
      x: ((i + r() * 0.8) * TILE) / count,
      s: sizeMin + r() * (sizeMax - sizeMin),
      pine: r() < 0.4,
      alt: r() < 0.5,
    });
  }
  return trees;
}

const clouds = (() => {
  const r = mulberry32(11);
  return Array.from({ length: 6 }, (_, i) => ({ x: (i + r() * 0.6) * (TILE / 6), y: 50 + r() * 110, s: 0.6 + r() * 0.6 }));
})();

const stormClouds = (() => {
  const r = mulberry32(23);
  return Array.from({ length: 5 }, (_, i) => ({ x: (i + r() * 0.5) * (TILE / 5), y: 30 + r() * 70, s: 1.2 + r() * 0.5 }));
})();

const layers = [
  { haze: 2, f: 0.12, ground: band(1, 320, [18, 10]), color: '#c4e8d2', alt: '#b9e2c8', light: '#d6f0df', trunk: '#c9b8aa', trees: makeTrees(6, 34, 20, 34) },
  { haze: 1, f: 0.25, ground: band(2, 372, [12, 6]), color: '#a3d9b6', alt: '#98d2ac', light: '#bde6cb', trunk: '#b9a596', trees: makeTrees(3, 24, 50, 80) },
  { haze: 0, f: 0.5, ground: band(4, 420, [10, 5]), color: '#7cc79a', alt: '#71bd8f', light: '#9bd8b0', trunk: '#9b7d66', trees: makeTrees(5, 13, 90, 140) },
];
for (const L of layers) {
  L.caches = new Map(); // tree style → { trees, ground } offscreen canvases
  let lo = Infinity, hi = -Infinity;
  for (let x = 0; x <= TILE; x += 4) {
    lo = Math.min(lo, L.ground(x));
    hi = Math.max(hi, L.ground(x));
  }
  L.groundTop = Math.floor(lo) - 2; // ground band canvas: from the highest hilltop down
  L.treesBottom = Math.ceil(hi) + 12; // trees canvas: down to just past the lowest trunk base
}

// Tree styles over a run: 0 lush → 1 autumn → 2 witchy (twisted, bare) → 3 dead → 4 hellish (charred, glowing).
const TREE_STYLES = 5;
function paletteFor(L, v) {
  switch (v) {
    case 0:
      return { canopy: L.color, alt: L.alt, light: L.light, pine: L.color, trunk: L.trunk, ground: L.color };
    case 1:
      return {
        canopy: mix(L.color, '#f0a050', 0.75), alt: mix(L.alt, '#e0603a', 0.7), light: mix(L.light, '#ffd27a', 0.7),
        pine: mix(L.color, '#4f7a52', 0.45), trunk: L.trunk, ground: mix(L.color, '#d9b36a', 0.55),
      };
    case 2:
      return { bare: mix(L.trunk, '#3a2d4a', 0.75), leaf: '#6b4f8f', pine: '#3d4a5e', ground: mix(L.color, '#5f5f80', 0.75), twist: 1.1, curls: true };
    case 3:
      return { bare: mix(L.trunk, '#5e5860', 0.8), pine: '#5e5860', ground: mix(L.color, '#8a8478', 0.85), twist: 0.5, broken: true };
    default:
      return { bare: '#1a0808', pine: '#1a0808', ground: '#2e0d0d', twist: 0.6, embers: true };
  }
}

// One wobbly branch, then its children; collects branch tips.
function branch(g, x, y, ang, len, w, depth, r, pal, tips) {
  const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  const bend = (r() - 0.5) * len * pal.twist;
  g.lineWidth = Math.max(0.8, w);
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo((x + x2) / 2 + nx * bend, (y + y2) / 2 + ny * bend, x2, y2);
  g.stroke();
  if (depth === 0 || (pal.broken && depth < 3 && r() < 0.25)) {
    if (pal.curls && depth === 0) {
      // witchy curly tip
      g.beginPath();
      g.arc(x2 + nx * len * 0.18, y2 + ny * len * 0.18, len * 0.18, ang - Math.PI / 2, ang + Math.PI);
      g.stroke();
    }
    tips.push([x2, y2]);
    return;
  }
  const n = r() < 0.35 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const a = ang + (i - (n - 1) / 2) * 0.7 + (r() - 0.5) * 0.5;
    branch(g, x2, y2, a, len * (0.62 + r() * 0.15), w * 0.62, depth - 1, r, pal, tips);
  }
}

function glowDots(g, points, size, r, chance) {
  g.save();
  g.shadowColor = '#ff5a1a';
  g.shadowBlur = size * 4;
  g.fillStyle = '#ff7a2a';
  for (const [x, y] of points) if (r() < chance) circle(g, x, y, size);
  g.restore();
}

function drawTree(g, x, y, s, t, pal, r) {
  if (!pal.bare) {
    // lush / autumn: round canopies and layered pines
    const c = t.alt ? pal.alt : pal.canopy;
    g.fillStyle = pal.trunk;
    g.fillRect(x - s * 0.07, y - s * 0.75, s * 0.14, s * 0.75);
    if (t.pine) {
      g.fillStyle = pal.pine;
      g.beginPath();
      for (let i = 0; i < 3; i++) {
        const by = y - s * (0.35 + i * 0.3);
        const hw = s * (0.42 - i * 0.1);
        g.moveTo(x - hw, by);
        g.lineTo(x, by - s * 0.45);
        g.lineTo(x + hw, by);
        g.closePath();
      }
      g.fill();
      g.strokeStyle = pal.pine;
      g.lineJoin = 'round';
      g.lineWidth = s * 0.08;
      g.stroke();
    } else {
      g.fillStyle = c;
      circle(g, x, y - s * 0.95, s * 0.42);
      circle(g, x - s * 0.28, y - s * 0.7, s * 0.3);
      circle(g, x + s * 0.28, y - s * 0.72, s * 0.3);
      g.fillStyle = pal.light;
      circle(g, x - s * 0.13, y - s * 1.08, s * 0.14);
    }
    return;
  }

  g.lineCap = 'round';
  if (t.pine) {
    // skeletal pine: a pole with drooping needle-less branches
    g.strokeStyle = pal.pine;
    g.lineWidth = s * 0.07;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * s * 0.06, y - s * 1.25);
    g.stroke();
    g.lineWidth = Math.max(0.8, s * 0.025);
    g.beginPath();
    for (let k = 0; k < 6; k++) {
      const by = y - s * (0.35 + k * 0.15), hw = s * (0.38 - k * 0.055);
      if (pal.broken && r() < 0.3) continue;
      for (const side of [-1, 1]) {
        g.moveTo(x, by);
        g.lineTo(x + side * hw, by + hw * (pal.broken ? 0.55 : 0.3));
      }
    }
    g.stroke();
    if (pal.embers) glowDots(g, [[x, y - s * 1.25]], Math.max(1.2, s * 0.03), r, 1);
    return;
  }

  // bare, twisting tree
  g.strokeStyle = pal.bare;
  const tips = [];
  branch(g, x, y, -Math.PI / 2 + (r() - 0.5) * 0.2, s * 0.5, s * 0.11, 3, r, pal, tips);
  if (pal.leaf) {
    g.fillStyle = pal.leaf;
    for (const [tx, ty] of tips) if (r() < 0.35) circle(g, tx, ty, s * (0.04 + r() * 0.05));
  }
  if (pal.embers) {
    glowDots(g, tips, Math.max(1, s * 0.022), r, 0.5); // smouldering branch tips
    // glowing cracks up the trunk
    g.save();
    g.shadowColor = '#ff5a1a';
    g.shadowBlur = s * 0.12;
    g.strokeStyle = '#ff6a2a';
    g.lineWidth = Math.max(1, s * 0.018);
    g.beginPath();
    let cy = y - s * 0.04;
    g.moveTo(x, cy);
    for (let k = 0; k < 4; k++) {
      cy -= s * 0.09;
      g.lineTo(x + (r() - 0.5) * s * 0.06, cy);
    }
    g.stroke();
    g.restore();
  }
}

// Render one full tile of a layer in tree style v into two offscreen canvases — the trees, and the
// ground band in front of them — each with the layer's haze. Kept separate so styles can crossfade
// cleanly (see drawLayers).
function buildLayer(L, v) {
  const pal = paletteFor(L, v);
  const haze = `rgba(240,250,255,${1 - 0.82 ** L.haze})`;
  const canvas = (top, bottom) => {
    const c = document.createElement('canvas');
    c.width = Math.ceil(TILE * res);
    c.height = Math.ceil((bottom - top) * res);
    const g = c.getContext('2d');
    g.setTransform(res, 0, 0, res, 0, -top * res);
    return [c, g];
  };

  const [trees, tg] = canvas(TOP, L.treesBottom);
  L.trees.forEach((t, i) => {
    for (const x of [t.x - TILE, t.x, t.x + TILE]) {
      // same seed for each wrapped copy, so the copies match
      drawTree(tg, x, L.ground(t.x) + 8, t.s, t, pal, mulberry32(i * 97 + v * 13 + L.f * 1000));
    }
  });

  const [ground, gg] = canvas(L.groundTop, H);
  gg.fillStyle = pal.ground;
  gg.beginPath();
  gg.moveTo(0, H);
  for (let x = 0; x <= TILE; x += 16) gg.lineTo(x, L.ground(x));
  gg.lineTo(TILE, H);
  gg.closePath();
  gg.fill();

  for (const g of [tg, gg]) {
    g.globalCompositeOperation = 'source-atop'; // haze only where the layer has pixels
    g.fillStyle = haze;
    g.fillRect(0, 0, TILE, H);
  }
  return { trees, ground };
}

function layerCache(L, v) {
  let c = L.caches.get(v);
  if (!c) {
    c = buildLayer(L, v);
    L.caches.set(v, c);
  }
  return c;
}

function blit(ctx, L, scroll, image, top, alpha) {
  if (alpha <= 0.003) return;
  const off = Math.round(((scroll * L.f) % TILE) * res) / res; // whole device pixels: no shimmer or seams
  const w = image.width / res, h = image.height / res;
  // The cache is already at screen resolution, so copy pixels straight across (no filtering cost).
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, -off, top, w, h);
  if (TILE - off < W) ctx.drawImage(image, TILE - off, top, w, h);
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = true;
}

// Draw the scenery in tree style `stage` (fractional: crossfades between neighbouring styles).
// Trees do a true crossfade (old out while new in); the ground band is laid down solid in the new
// style with the old one fading on top, so the sky never shows through it. Only the current and
// next styles are kept in memory.
function drawLayers(ctx, scroll, stage) {
  const a = Math.min(TREE_STYLES - 1, Math.floor(stage));
  const b = Math.min(TREE_STYLES - 1, a + 1);
  const t = stage - a;
  for (const L of layers) {
    for (const k of L.caches.keys()) if (k !== a && k !== b) L.caches.delete(k);
    const A = layerCache(L, a);
    if (b === a || t < 0.005) {
      blit(ctx, L, scroll, A.trees, TOP, 1);
      blit(ctx, L, scroll, A.ground, L.groundTop, 1);
      if (b !== a) layerCache(L, b); // build the next style ahead of time
      continue;
    }
    const B = layerCache(L, b);
    blit(ctx, L, scroll, A.trees, TOP, 1 - t);
    blit(ctx, L, scroll, B.trees, TOP, t);
    blit(ctx, L, scroll, B.ground, L.groundTop, 1);
    blit(ctx, L, scroll, A.ground, L.groundTop, 1 - t);
  }
}

function drawCloud(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  circle(ctx, x, y, 22 * s);
  circle(ctx, x + 26 * s, y - 10 * s, 28 * s);
  circle(ctx, x + 56 * s, y, 22 * s);
  ctx.beginPath();
  ctx.roundRect(x - 4 * s, y - 4 * s, 64 * s, 26 * s, 13 * s);
  ctx.fill();
}

// A sleepy little face for the rain clouds — gloomy, but still cute.
function drawCloudFace(ctx, x, y, s) {
  const cx = x + 28 * s, cy = y + 6 * s;
  ctx.strokeStyle = '#5a5378';
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx - 9 * s, cy, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.moveTo(cx + 13 * s, cy + 1.5 * s);
  ctx.arc(cx + 9 * s, cy, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,150,190,0.45)';
  ellipse(ctx, cx - 16 * s, cy + 6 * s, 4 * s, 2.5 * s);
  ellipse(ctx, cx + 16 * s, cy + 6 * s, 4 * s, 2.5 * s);
  ctx.fillStyle = '#5a5378';
  ellipse(ctx, cx, cy + 8 * s, 2 * s, 1.6 * s);
}

// The sun's mood: beaming → worried → crying (sad 0..1), then furious in the crimson finale (fury 0..1).
function drawSunFace(ctx, sx, sy, sad01, fury, time) {
  const ink = mix(hazed('#9a5b2c', 2), '#5a0a0a', fury);
  const g = sad01;
  const sad = clamp((g - 0.3) / 0.7, 0, 1); // 0 until it's ~1/3 sad, then grows
  const ey = sy - 6;
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.5 + fury;
  ctx.strokeStyle = ink;

  // rosy cheeks fade away... then come back as an angry flush
  const blush = 0.45 * (1 - g) + 0.5 * fury;
  if (blush > 0.01) {
    ctx.fillStyle = `rgba(${fury > 0.5 ? '200,20,30' : '255,140,150'},${blush})`;
    ellipse(ctx, sx - 22, sy + 6, 6, 3.5);
    ellipse(ctx, sx + 22, sy + 6, 6, 3.5);
  }
  ctx.fillStyle = ink;

  // eyes: happy ^ ^ crossfading into open, gradually drooping eyes
  const open = clamp((g - 0.25) / 0.2, 0, 1);
  for (const ex of [sx - 13, sx + 13]) {
    if (open < 1) {
      ctx.globalAlpha = 1 - open;
      ctx.beginPath();
      ctx.arc(ex, ey + 3, 5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    if (open > 0) {
      ctx.globalAlpha = open;
      ellipse(ctx, ex, ey + 1 + sad * 2, 3.2, 4.2 * (1 - 0.4 * sad)); // eyelids get heavier
    }
  }
  // eyebrows: inner ends lift as it gets sadder, then slam down into a scowl
  const brow = Math.max(sad, fury);
  if (brow > 0) {
    ctx.globalAlpha = brow;
    const outer = ey - 8 + 2 * sad * (1 - fury) - 4 * fury;
    const inner = ey - 9 - 4 * sad * (1 - fury) + 6 * fury;
    ctx.beginPath();
    ctx.moveTo(sx - 20, outer);
    ctx.lineTo(sx - 7, inner);
    ctx.moveTo(sx + 20, outer);
    ctx.lineTo(sx + 7, inner);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // mouth: big smile (g = 0) → flat line (g = 0.5) → frown (g = 1)
  const curve = Math.cos(Math.PI * g);
  const mw = 11 - 3 * g, my = sy + 11 + 3 * g;
  ctx.beginPath();
  ctx.moveTo(sx - mw, my);
  ctx.quadraticCurveTo(sx, my + 10 * curve, sx + mw, my);
  ctx.stroke();

  // a single tear that keeps rolling down once it's properly glum (dries up when it gets angry)
  const tearAlpha = clamp((g - 0.7) / 0.3, 0, 1) * (1 - fury);
  if (tearAlpha > 0) {
    const k = (time * 0.7) % 1;
    const tx = sx - 15, ty = ey + 6 + k * 26;
    ctx.globalAlpha = tearAlpha * (1 - k);
    ctx.fillStyle = '#a8dcff';
    ctx.beginPath();
    ctx.moveTo(tx, ty - 6);
    ctx.quadraticCurveTo(tx + 4, ty - 1, tx, ty + 3);
    ctx.quadraticCurveTo(tx - 4, ty - 1, tx, ty - 6);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // furious little steam puffs
  if (fury > 0) {
    ctx.fillStyle = '#ffffff';
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const k = (time * 1.5 + i / 3) % 1;
        ctx.globalAlpha = fury * 0.6 * (1 - k);
        circle(ctx, sx + side * (34 + k * 10), sy - 28 - k * 22, 4 + k * 5);
      }
    }
    ctx.globalAlpha = 1;
  }
}

const stars = (() => {
  const r = mulberry32(31);
  return Array.from({ length: 60 }, () => ({ x: r() * W, y: r() * 250, s: 0.6 + r() * 1.4, p: r() * TAU }));
})();

function drawStars(ctx, alpha, time) {
  ctx.fillStyle = '#fffbe8';
  for (const st of stars) {
    ctx.globalAlpha = alpha * (0.55 + 0.45 * Math.sin(time * 2 + st.p));
    circle(ctx, st.x, st.y, st.s);
  }
  ctx.globalAlpha = 1;
}

// Crescent moon, opening to the left
function drawMoon(ctx, alpha, color, time) {
  const mx = 180, my = 85 + Math.sin(time * 0.5) * 3, r = 30;
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(mx, my, r * 0.5, mx, my, r * 2.6);
  glow.addColorStop(0, `${color}55`);
  glow.addColorStop(1, `${color}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(mx - r * 3, my - r * 3, r * 6, r * 6);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(mx, my, r, -Math.PI / 2, Math.PI / 2);
  ctx.quadraticCurveTo(mx + r * 0.7, my, mx, my - r);
  ctx.fill();
  ctx.globalAlpha = 1;
}

const bats = (() => {
  const r = mulberry32(47);
  return Array.from({ length: 7 }, () => ({ off: r() * (W + 300), y: 50 + r() * 170, speed: 45 + r() * 50, s: 0.8 + r() * 0.6, p: r() * TAU }));
})();

function drawBats(ctx, alpha, scroll, time, color) {
  ctx.globalAlpha = alpha;
  for (const b of bats) {
    const x = W + 150 - ((b.off + time * b.speed + scroll * 0.15) % (W + 300));
    const y = b.y + Math.sin(time * 2 + b.p) * 14;
    const flap = Math.sin(time * 14 + b.p);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(b.s, b.s);
    ctx.fillStyle = color;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 4, -1);
      ctx.quadraticCurveTo(side * 12, -10 * flap - 4, side * 20, -4 * flap);
      ctx.quadraticCurveTo(side * 15, 0, side * 13, 3);
      ctx.quadraticCurveTo(side * 9, 0, side * 4, 3);
      ctx.fill();
    }
    ellipse(ctx, 0, 0, 6, 5);
    ctx.beginPath(); // ears
    ctx.moveTo(-4, -3); ctx.lineTo(-3, -8); ctx.lineTo(-1, -4);
    ctx.moveTo(4, -3); ctx.lineTo(3, -8); ctx.lineTo(1, -4);
    ctx.fill();
    ctx.fillStyle = '#ffd36b';
    circle(ctx, -2, -1, 1.1);
    circle(ctx, 2, -1, 1.1);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// Low drifting mist, batched into one path per row
function drawMist(ctx, alpha, color, scroll, time) {
  ctx.fillStyle = color;
  for (let row = 0; row < 3; row++) {
    const y = 395 + row * 18;
    const off = (time * 12 * (row + 1) + scroll * 0.3 * (row + 1)) % 90;
    ctx.globalAlpha = alpha * 0.18;
    ctx.beginPath();
    for (let x = -off - 60; x < W + 90; x += 90) {
      ctx.moveTo(x + 70, y);
      ctx.ellipse(x, y + Math.sin(x * 0.02 + row) * 4, 70, 14, 0, 0, TAU);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Dark edges, stronger as things get spookier and then harsher. Drawn over everything but the HUD.
export function drawVignette(ctx, env) {
  if (env.vignette < 0.01) return;
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
  g.addColorStop(0, `${env.vignetteColor}00`);
  g.addColorStop(1, `${env.vignetteColor}${Math.round(env.vignette * 255).toString(16).padStart(2, '0')}`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// roomW: the room's width, for panning the far-off islands (src/distant.js) as you walk
export function drawBackground(ctx, scroll, time, env, roomW = 5100) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, hazed(env.skyTop, env.skyHaze));
  sky.addColorStop(0.55, hazed(env.skyMid, env.skyHaze));
  sky.addColorStop(1, hazed(env.skyBottom, env.skyHaze));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  if (env.stars > 0.01) drawStars(ctx, env.stars, time);
  if (env.moon > 0.01) drawMoon(ctx, env.moon, env.moonColor, time);

  // the sun, sinking through the day and turning angry red at the end
  const sx = W - 170, sy = env.sunY;
  const glow = ctx.createRadialGradient(sx, sy, 20, sx, sy, 150);
  glow.addColorStop(0, `${env.sunColor}dd`);
  glow.addColorStop(1, `${env.sunColor}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(sx - 150, sy - 150, 300, 300);
  ctx.fillStyle = hazed(env.sunColor, 2);
  circle(ctx, sx, sy, 40);
  drawSunFace(ctx, sx, sy, env.sad, env.fury, time);

  // the other islands, far out over the sea, peeking over the hills
  drawDistantIslands(ctx, { from: 'green', scroll, roomW, time, horizon: 330, haze: hazed(env.skyBottom, env.skyHaze + 1), fade: 0.55, scale: 0.72, sky: 230 });

  const cloudOff = (scroll * 0.05 + time * 6) % TILE;
  const cloudColor = hazed(env.cloudColor, 2);
  const puff = 1 + 0.3 * env.storm;
  for (const c of clouds) {
    for (const px of [c.x - cloudOff, c.x - cloudOff + TILE]) {
      if (px > -150 && px < W + 50) drawCloud(ctx, px, c.y, c.s * puff, cloudColor);
    }
  }

  // rain clouds drift in, lower and faster
  if (env.storm > 0.01) {
    const stormOff = (scroll * 0.08 + time * 14) % TILE;
    const stormColor = hazed(env.stormColor, 2);
    ctx.globalAlpha = Math.min(1, env.storm);
    for (const c of stormClouds) {
      for (const px of [c.x - stormOff, c.x - stormOff + TILE]) {
        if (px < -200 || px > W + 50) continue;
        const bob = Math.sin(time * 1.2 + c.x) * 3;
        drawCloud(ctx, px, c.y + bob, c.s, stormColor);
        drawCloudFace(ctx, px, c.y + bob, c.s);
      }
    }
    ctx.globalAlpha = 1;
  }

  if (env.bats > 0.01) drawBats(ctx, env.bats, scroll, time, mix('#2a1f3d', '#2a0a12', env.fury));

  drawLayers(ctx, scroll, env.treeStage);
  if (env.darken > 0.005) {
    ctx.fillStyle = `rgba(25,5,20,${env.darken})`;
    ctx.fillRect(0, TOP, W, H - TOP); // just the scenery band: hills and trees go to silhouette
  }

  if (env.mist > 0.01) drawMist(ctx, env.mist, env.mistColor, scroll, time);

  if (env.sunbeams > 0.005) {
    ctx.fillStyle = `rgba(255,255,225,${env.sunbeams})`;
    for (const [x, w] of [[420, 60], [560, 35], [690, 80]]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + w, 0);
      ctx.lineTo(x + w - 260, H);
      ctx.lineTo(x - 260, H);
      ctx.closePath();
      ctx.fill();
    }
  }

  // colour wash over the scenery for the stage's mood
  if (env.wash[3] > 0.005) {
    ctx.fillStyle = rgba(env.wash);
    ctx.fillRect(0, 0, W, H);
  }
}
