// Docs: docs/combat/stages.md
// The Frostpeak Highlands: the second mob stage, up the trail from the Wildwood's east end (data in
// src/shared/rpg.js). Frostpine Ridge is a snowy pine forest at soft blue dusk; Starfall Summit is a
// crystal mountaintop under a starry violet night. This room draws its own sky (all 540 px).
// The two den cave mouths (x 1880 and 3820) are drawn elsewhere, so the scenery leaves room round them.
import { W, H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { HIGHLANDS_W, FIELD_W, FIELD_GROUND, HIGHLANDS_EXIT_X, HIGHLAND_ZONES, HIGHLAND_PLATFORMS, DENS, HIGHLANDS } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';

const GROUND = FIELD_GROUND;
const INK = '#4a3f6b';
const B = HIGHLAND_ZONES[1].x0; // ridge → summit
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const nightK = (x) => smooth(B - 300, B + 300, x); // 0 = dusk ridge, 1 = starry summit
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
// keep big scenery away from the den entrances
const DEN_XS = DENS.filter((d) => d.from === HIGHLANDS).map((d) => d.entranceX);
const clearOfDens = (x, pad = 150) => DEN_XS.every((d) => Math.abs(x - d) > pad);

function text(ctx, str, x, y, size, color) {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function arrow(ctx, x, y, angle, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(s, s);
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

function star4(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.38 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

// ——— seeded scenery ———

const TILE = 1600;
const skyStars = (() => {
  const r = mulberry32(201);
  return Array.from({ length: 110 }, () => ({ x: r() * W, y: r() * 300, s: 0.6 + r() * 1.2, p: r() * TAU, big: r() < 0.1 }));
})();
const flakes = (() => {
  const r = mulberry32(203);
  return Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, s: 1 + r() * 2.2, v: 18 + r() * 26, p: r() * TAU }));
})();
// mountain ranges: each a list of peaks across one tile
function range(seed, n, base, hMin, hMax, wMin, wMax) {
  const r = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => ({ x: ((i + r() * 0.6) * TILE) / n, h: hMin + r() * (hMax - hMin), w: wMin + r() * (wMax - wMin), base }));
}
const RANGES = [
  { f: 0.08, peaks: range(211, 6, 380, 170, 250, 260, 380), dusk: '#c3cdf0', night: '#5a4a92', snow: 0.32 },
  { f: 0.2, peaks: range(213, 8, 410, 110, 180, 200, 300), dusk: '#a6b4e4', night: '#463a7e', snow: 0.28 },
  { f: 0.38, peaks: range(217, 10, 440, 60, 110, 150, 230), dusk: '#8a9cd4', night: '#3a2f6a', snow: 0.25, pines: true },
];
const pines = (() => {
  const r = mulberry32(221);
  const out = [];
  for (let x = 160; x < B - 60; x += 70 + r() * 110) if (clearOfDens(x, 160)) out.push({ x, s: 0.75 + r() * 0.55, shade: r() });
  return out;
})();
const crystals = (() => {
  const r = mulberry32(223);
  const out = [];
  for (let x = B + 120; x < HIGHLANDS_W - 80; x += 120 + r() * 160) {
    if (!clearOfDens(x, 170)) continue;
    out.push({ x, s: 0.7 + r() * 0.7, hue: [270, 300, 200, 320][Math.floor(r() * 4)], n: 3 + Math.floor(r() * 3), p: r() * TAU });
  }
  return out;
})();
const groundDeco = (() => {
  const r = mulberry32(227);
  const out = [];
  for (let x = 140; x < HIGHLANDS_W - 40; x += 26 + r() * 50) {
    if (!clearOfDens(x, 125)) continue;
    const k = r();
    if (x < B) out.push(k < 0.45 ? { type: 'drift', x, s: 0.7 + r() * 0.6 } : k < 0.75 ? { type: 'shrub', x, s: 0.7 + r() * 0.5 } : { type: 'stone', x, s: 0.7 + r() * 0.5 });
    else out.push(k < 0.5 ? { type: 'shard', x, s: 0.6 + r() * 0.6, hue: [270, 300, 200][Math.floor(r() * 3)] } : k < 0.8 ? { type: 'glowflower', x, s: 0.7 + r() * 0.5, p: r() * TAU } : { type: 'stone', x, s: 0.7 + r() * 0.5 });
  }
  return out;
})();
const pebbles = (() => {
  const r = mulberry32(229);
  return Array.from({ length: HIGHLANDS_W / 30 }, () => ({ x: r() * HIGHLANDS_W, dy: 34 + r() * (H - GROUND - 34), r: 2 + r() * 3 }));
})();
const platBits = HIGHLAND_PLATFORMS.map((p, i) => {
  const r = mulberry32(400 + i);
  return {
    icicles: Array.from({ length: Math.floor(p.w / 22) }, (_, k) => ({ x: p.x + 12 + k * 22 + r() * 8, len: 8 + r() * 18 })),
    gems: Array.from({ length: 3 + Math.floor(r() * 2) }, () => ({ x: p.x + 24 + r() * (p.w - 48), len: 14 + r() * 22, a: (r() - 0.5) * 0.7, hue: [270, 300, 200][Math.floor(r() * 3)] })),
    bumps: Array.from({ length: Math.floor(p.w / 40) }, () => ({ x: p.x + 14 + r() * (p.w - 28), s: 0.6 + r() * 0.5 })),
  };
});

const gradCache = new WeakMap();
function zoneGrad(ctx, key, a, b) {
  let c = gradCache.get(ctx);
  if (!c) gradCache.set(ctx, (c = {}));
  if (!c[key]) {
    const g = ctx.createLinearGradient(0, 0, HIGHLANDS_W, 0);
    g.addColorStop(0, a);
    g.addColorStop((B - 250) / HIGHLANDS_W, a);
    g.addColorStop((B + 250) / HIGHLANDS_W, b);
    g.addColorStop(1, b);
    c[key] = g;
  }
  return c[key];
}

// ——— the room ———

// Everything in the Highlands behind the slimes: its own sky (screen space, so it draws over the full
// 540 px under any camera transform), then the world in world space.
export function drawHighlands(ctx, camX, viewW, time) {
  const k = nightK(camX + viewW / 2);
  ctx.save();
  // sky and mountains in screen space: undo the camera translation
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, viewW, time, k);
  ctx.restore();

  const L = camX - 80, R = camX + viewW + 80;
  for (const p of pines) if (visible(p.x - 60, p.x + 60, L, R)) drawPine(ctx, p.x, GROUND + 4, p.s * 1.25, p.shade, time);
  for (const c of crystals) if (visible(c.x - 70, c.x + 70, L, R)) drawCrystalCluster(ctx, c, time);
  if (visible(HIGHLANDS_W - 140, HIGHLANDS_W + 10, L, R)) drawEastEdge(ctx, time);
  drawGround(ctx, Math.max(0, L), Math.min(HIGHLANDS_W, R), time);
  HIGHLAND_ZONES.forEach((z, i) => {
    const sx = i === 0 ? 210 : z.x0 + 170;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  if (visible(HIGHLANDS_EXIT_X - 90, HIGHLANDS_EXIT_X + 90, L, R)) drawExit(ctx, HIGHLANDS_EXIT_X, time);
  HIGHLAND_PLATFORMS.forEach((p, i) => {
    if (!visible(p.x - 40, p.x + p.w + 40, L, R)) return;
    if (p.kind === 'ice') drawIce(ctx, p, platBits[i], time);
    else drawCrystalPlat(ctx, p, platBits[i], time);
  });
  // falling snow over the ridge, fading out up on the summit
  ctx.save();
  ctx.translate(camX, 0);
  drawSnow(ctx, camX, time, 1 - k);
  ctx.restore();
  ctx.restore();
}

function drawSky(ctx, camX, viewW, time, k) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, mix('#86a2dc', '#1e1a44', k));
  sky.addColorStop(0.55, mix('#bccbf2', '#3e3078', k));
  sky.addColorStop(1, mix('#f6d8e6', '#8a62b4', k));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // stars: faint at dusk, bright on the summit
  const sa = 0.25 + 0.75 * k;
  for (const s of skyStars) {
    const tw = 0.5 + 0.5 * Math.sin(time * 2 + s.p);
    const x = (((s.x - camX * 0.02) % W) + W) % W;
    if (s.y > 300 - 120 * (1 - k)) continue; // only high up at dusk
    ctx.fillStyle = `rgba(255,250,235,${sa * (0.4 + 0.6 * tw)})`;
    if (s.big) star4(ctx, x, s.y, 3 + tw * 1.5);
    else circle(ctx, x, s.y, s.s * 0.8);
  }
  // a crescent moon, and an aurora on the summit
  const mx = W - 190, my = 90;
  const mg = ctx.createRadialGradient(mx, my, 10, mx, my, 90);
  mg.addColorStop(0, `rgba(255,246,220,${0.35 + 0.25 * k})`);
  mg.addColorStop(1, 'rgba(255,246,220,0)');
  ctx.fillStyle = mg;
  circle(ctx, mx, my, 90);
  ctx.fillStyle = '#fff6dc'; // crescent: the moon's disc minus an offset one
  ctx.save();
  ctx.beginPath();
  ctx.rect(mx - 40, my - 40, 80, 80);
  ctx.arc(mx + 11, my - 7, 23, 0, TAU);
  ctx.clip('evenodd');
  circle(ctx, mx, my, 26);
  ctx.restore();
  if (k > 0.02) {
    ctx.globalAlpha = 0.28 * k;
    for (const [c, off, y0] of [['#8fffd0', 0, 120], ['#c4a0ff', 2, 150], ['#9fd8ff', 4, 100]]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 40) {
        const y = y0 + Math.sin(x * 0.006 + time * 0.3 + off) * 30 + Math.sin(x * 0.013 - time * 0.2) * 12;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      for (let x = W; x >= 0; x -= 40) {
        const y = y0 + 36 + Math.sin(x * 0.006 + time * 0.3 + off + 0.6) * 30;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // the other islands, far south over the sea, above the ranges' shoulders
  drawDistantIslands(ctx, { from: 'frost', scroll: camX, roomW: HIGHLANDS_W, time, horizon: 330, haze: mix('#f6d8e6', '#8a62b4', k), fade: 0.55, scale: 0.68, night: k, sky: 240 });
  // mountain ranges, far to near, with snowy (or starlit) caps
  for (const Rg of RANGES) {
    const off = (camX * Rg.f) % TILE;
    const col = mix(Rg.dusk, Rg.night, k);
    for (const tileX of [-off, TILE - off]) {
      for (const p of Rg.peaks) {
        const px = tileX + p.x;
        if (px + p.w / 2 < -10 || px - p.w / 2 > W + 10) continue;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(px - p.w / 2, p.base + 60);
        ctx.lineTo(px - p.w * 0.08, p.base - p.h + 6);
        ctx.quadraticCurveTo(px, p.base - p.h - 4, px + p.w * 0.08, p.base - p.h + 6);
        ctx.lineTo(px + p.w / 2, p.base + 60);
        ctx.closePath();
        ctx.fill();
        // snow cap with a wavy lower edge
        const ch = p.h * Rg.snow, cw = p.w * Rg.snow * 0.5;
        ctx.fillStyle = mix('#ffffff', '#c9b8f0', k * 0.7);
        ctx.beginPath();
        ctx.moveTo(px - p.w * 0.08, p.base - p.h + 6);
        ctx.quadraticCurveTo(px, p.base - p.h - 4, px + p.w * 0.08, p.base - p.h + 6);
        ctx.lineTo(px + cw, p.base - p.h + ch);
        ctx.quadraticCurveTo(px + cw * 0.5, p.base - p.h + ch - 8, px + cw * 0.2, p.base - p.h + ch + 2);
        ctx.quadraticCurveTo(px - cw * 0.2, p.base - p.h + ch - 9, px - cw * 0.5, p.base - p.h + ch + 1);
        ctx.lineTo(px - cw, p.base - p.h + ch);
        ctx.closePath();
        ctx.fill();
      }
      if (Rg.pines) {
        // a row of little pine silhouettes along the nearest range's foot
        ctx.fillStyle = mix('#7486c0', '#2e265a', k);
        for (let i = 0; i < 26; i++) {
          const x = tileX + (i * TILE) / 26 + (i % 3) * 13;
          if (x < -20 || x > W + 20) continue;
          const hh = 30 + (i % 4) * 9;
          ctx.beginPath();
          ctx.moveTo(x - hh * 0.3, 452);
          ctx.lineTo(x, 452 - hh);
          ctx.lineTo(x + hh * 0.3, 452);
          ctx.fill();
        }
      }
    }
  }
  // haze where the mountains meet the field
  const hz = ctx.createLinearGradient(0, 330, 0, GROUND);
  hz.addColorStop(0, mix('#eef2ff', '#8a70c0', k) + '00');
  hz.addColorStop(1, mix('#eef2ff', '#8a70c0', k) + '88');
  ctx.fillStyle = hz;
  ctx.fillRect(0, 330, W, GROUND - 330);
  void viewW;
}

function drawSnow(ctx, camX, time, a) {
  if (a < 0.03) return;
  ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`;
  for (const f of flakes) {
    const y = (f.y + time * f.v) % H;
    const x = ((((f.x - camX * 0.25 + Math.sin(time * 0.8 + f.p) * 14) % W) + W) % W);
    circle(ctx, x, y, f.s);
  }
}

// ——— ground ———

function drawGround(ctx, L, R, time) {
  const y = GROUND;
  ctx.fillStyle = zoneGrad(ctx, 'rock', '#9aa4c8', '#6e5e98');
  ctx.fillRect(L, y, R - L, H - y + 10);
  ctx.fillStyle = zoneGrad(ctx, 'rockDark', '#8590b8', '#5e4f88');
  ctx.fillRect(L, y + 54, R - L, H - y);
  ctx.fillStyle = zoneGrad(ctx, 'pebble', '#7a84aa', '#8a74c0');
  ctx.beginPath();
  for (const p of pebbles) {
    if (p.x < L || p.x > R) continue;
    ctx.moveTo(p.x + p.r * 1.4, y + p.dy);
    ctx.ellipse(p.x, y + p.dy, p.r * 1.4, p.r, 0, 0, TAU);
  }
  ctx.fill();
  // glinting crystal flecks in the summit rock
  if (R > B) {
    for (const p of pebbles) {
      if (p.x < Math.max(L, B) || p.x > R || p.r < 3.5) continue;
      ctx.fillStyle = `rgba(230,210,255,${0.4 + 0.4 * Math.sin(time * 2 + p.x)})`;
      star4(ctx, p.x + 6, y + p.dy - 4, 2.5);
    }
  }
  snowCap(ctx, L, R, y, zoneGrad(ctx, 'snow', '#f6faff', '#e8e0ff'), zoneGrad(ctx, 'snowShade', '#d4e2f6', '#c4b4ec'));
  for (const d of groundDeco) if (d.x > L - 20 && d.x < R + 20) drawDeco(ctx, d, y - 2, time);
}

// Snow along the top of the ground: a soft, lumpy drift with a blue shadow underneath
function snowCap(ctx, x0, x1, y, snow, shade) {
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.roundRect(x0 - 4, y - 2, x1 - x0 + 8, 18, 9);
  ctx.fill();
  ctx.beginPath();
  for (let gx = Math.floor(x0 / 22) * 22 + 8; gx < x1 + 12; gx += 22) {
    ctx.moveTo(gx + 11, y + 14);
    ctx.ellipse(gx, y + 14, 11, 6, 0, 0, Math.PI);
  }
  ctx.fill();
  ctx.fillStyle = snow;
  ctx.beginPath();
  ctx.roundRect(x0 - 4, y - 6, x1 - x0 + 8, 16, 8);
  ctx.fill();
  ctx.beginPath();
  for (let gx = Math.floor(x0 / 22) * 22; gx < x1 + 12; gx += 22) {
    ctx.moveTo(gx + 12, y - 4);
    ctx.ellipse(gx, y - 4, 12, 4, 0, Math.PI, 0);
  }
  ctx.fill();
}

function drawDeco(ctx, d, y, time) {
  ctx.save();
  ctx.translate(d.x, y);
  ctx.scale(d.s, d.s);
  if (d.type === 'drift') {
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, 0, -3, 14, 6);
    ellipse(ctx, 8, -5, 8, 5);
    ctx.fillStyle = 'rgba(180,200,240,0.5)';
    ellipse(ctx, 2, 0, 12, 2);
  } else if (d.type === 'shrub') {
    // a frosty little shrub with red berries
    ctx.fillStyle = '#6a8ab0';
    circle(ctx, -6, -7, 7);
    circle(ctx, 5, -8, 8);
    circle(ctx, 0, -12, 7);
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, -2, -17, 7, 3);
    ellipse(ctx, 7, -14, 4, 2);
    ctx.fillStyle = '#e8506a';
    circle(ctx, -6, -6, 1.8);
    circle(ctx, 4, -5, 1.8);
  } else if (d.type === 'stone') {
    ctx.fillStyle = '#8a90b8';
    ctx.beginPath();
    ctx.ellipse(0, -3, 10, 7, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, -1, -9, 7, 2.6);
  } else if (d.type === 'shard') {
    const c = `hsl(${d.hue} 80% 82%)`;
    for (const [ox, a, len] of [[-4, -0.35, 14], [2, 0.1, 20], [7, 0.5, 11]]) {
      ctx.save();
      ctx.translate(ox, 0);
      ctx.rotate(a);
      ctx.fillStyle = c;
      ctx.strokeStyle = `hsl(${d.hue} 50% 55%)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-3, -len * 0.75);
      ctx.lineTo(0, -len);
      ctx.lineTo(3, -len * 0.75);
      ctx.lineTo(3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // a glowing night flower
    const glow = 0.3 + 0.2 * Math.sin(time * 2 + d.p);
    const g = ctx.createRadialGradient(0, -14, 1, 0, -14, 16);
    g.addColorStop(0, `rgba(200,230,255,${glow})`);
    g.addColorStop(1, 'rgba(200,230,255,0)');
    ctx.fillStyle = g;
    circle(ctx, 0, -14, 16);
    ctx.strokeStyle = '#6a7ac0';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-3, -7, 0, -13);
    ctx.stroke();
    ctx.fillStyle = '#c4e8ff';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      circle(ctx, Math.cos(a) * 3.6, -14 + Math.sin(a) * 3.6, 2.8);
    }
    ctx.fillStyle = '#ffffff';
    circle(ctx, 0, -14, 2);
  }
  ctx.restore();
}

// ——— scenery ———

function drawPine(ctx, x, base, s, shade, time) {
  const green = mix('#4f7a8a', '#5a8a7a', shade), dark = mix('#3f6474', '#46705f', shade);
  ctx.fillStyle = '#7a6058';
  ctx.fillRect(x - 5 * s, base - 26 * s, 10 * s, 26 * s);
  const tiers = [[0, 46, 40], [30, 38, 34], [56, 30, 28], [78, 20, 22]];
  for (const [dy, hw, th] of tiers) {
    const yb = base - 18 * s - dy * s;
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(x - hw * s, yb);
    ctx.lineTo(x, yb - th * s - 14 * s);
    ctx.lineTo(x + hw * s, yb);
    ctx.quadraticCurveTo(x, yb + 8 * s, x - hw * s, yb);
    ctx.fill();
    ctx.fillStyle = green;
    ctx.beginPath();
    ctx.moveTo(x - hw * s * 0.85, yb - 3 * s);
    ctx.lineTo(x, yb - th * s - 12 * s);
    ctx.lineTo(x + hw * s * 0.6, yb - 4 * s);
    ctx.closePath();
    ctx.fill();
    // snow resting on each tier
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - hw * s * 0.55, yb - th * s * 0.45 - 6 * s);
    ctx.lineTo(x, yb - th * s - 14 * s);
    ctx.lineTo(x + hw * s * 0.55, yb - th * s * 0.45 - 6 * s);
    ctx.quadraticCurveTo(x + hw * s * 0.25, yb - th * s * 0.45 - 1 * s, x, yb - th * s * 0.5 - 4 * s);
    ctx.quadraticCurveTo(x - hw * s * 0.25, yb - th * s * 0.45, x - hw * s * 0.55, yb - th * s * 0.45 - 6 * s);
    ctx.fill();
  }
  void time;
}

function drawCrystalCluster(ctx, c, time) {
  const base = GROUND + 2;
  ctx.save();
  ctx.translate(c.x, base);
  ctx.scale(c.s, c.s);
  const glow = 0.3 + 0.12 * Math.sin(time * 1.6 + c.p);
  const g = ctx.createRadialGradient(0, -40, 4, 0, -40, 80);
  g.addColorStop(0, `hsla(${c.hue} 90% 80% / ${glow})`);
  g.addColorStop(1, `hsla(${c.hue} 90% 80% / 0)`);
  ctx.fillStyle = g;
  circle(ctx, 0, -40, 80);
  for (let i = 0; i < c.n; i++) {
    const a = (i - (c.n - 1) / 2) * 0.32, len = 60 + ((i * 37 + c.n * 11) % 50) - Math.abs(i - (c.n - 1) / 2) * 14, wd = 9 + (i % 2) * 4;
    ctx.save();
    ctx.translate((i - (c.n - 1) / 2) * 10, 0);
    ctx.rotate(a);
    const cg = ctx.createLinearGradient(-wd, 0, wd, 0);
    cg.addColorStop(0, `hsl(${c.hue} 90% 92%)`);
    cg.addColorStop(1, `hsl(${c.hue} 60% 70%)`);
    ctx.fillStyle = cg;
    ctx.strokeStyle = `hsl(${c.hue} 45% 50%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-wd, 4);
    ctx.lineTo(-wd, -len * 0.78);
    ctx.lineTo(0, -len);
    ctx.lineTo(wd, -len * 0.78);
    ctx.lineTo(wd, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-wd * 0.35, 0);
    ctx.lineTo(-wd * 0.35, -len * 0.8);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawEastEdge(ctx, time) {
  // a sheer crystal cliff at the end of the summit
  const x = HIGHLANDS_W;
  ctx.fillStyle = '#4e4084';
  ctx.beginPath();
  ctx.moveTo(x - 70, GROUND + 4);
  ctx.lineTo(x - 50, 120);
  ctx.lineTo(x - 30, 60);
  ctx.lineTo(x + 10, 40);
  ctx.lineTo(x + 10, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8e0ff';
  ctx.beginPath();
  ctx.moveTo(x - 50, 120);
  ctx.lineTo(x - 30, 60);
  ctx.lineTo(x + 10, 40);
  ctx.lineTo(x + 10, 70);
  ctx.lineTo(x - 30, 88);
  ctx.closePath();
  ctx.fill();
  drawCrystalCluster(ctx, { x: x - 70, s: 1.1, hue: 280, n: 4, p: 1 }, time);
  drawCrystalCluster(ctx, { x: x - 20, s: 0.8, hue: 200, n: 3, p: 2 }, time);
}

// ——— platforms ———

// A floating slab of ice: snowy top, translucent blue body and icicles hanging off it
function drawIce(ctx, p, bits, time) {
  const { x, y, w } = p, th = 24;
  ctx.fillStyle = '#c4e4fa';
  for (const ic of bits.icicles) {
    const drip = Math.sin(time * 1.5 + ic.x) * 0.6;
    ctx.beginPath();
    ctx.moveTo(ic.x - 4, y + th - 4);
    ctx.lineTo(ic.x, y + th + ic.len + drip);
    ctx.lineTo(ic.x + 4, y + th - 4);
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, y, 0, y + th);
  g.addColorStop(0, '#e2f4ff');
  g.addColorStop(1, '#8fc4ec');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#6aa0d0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 10, y + th);
  ctx.lineTo(x + w * 0.6, y + th + 6);
  ctx.lineTo(x + w * 0.3, y + th + 3);
  ctx.lineTo(x + 8, y + th);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let fx = x + 20; fx < x + w - 20; fx += 46) {
    ctx.moveTo(fx, y + 6);
    ctx.lineTo(fx + 12, y + th - 4);
  }
  ctx.stroke();
  snowCap(ctx, x, x + w, y, '#f6faff', '#d4e2f6');
  for (const b of bits.bumps) {
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, b.x, y - 6, 9 * b.s, 4 * b.s);
  }
}

// A floating chunk of summit rock with glowing crystals growing from its underside
function drawCrystalPlat(ctx, p, bits, time) {
  const { x, y, w } = p;
  for (const gm of bits.gems) {
    ctx.save();
    ctx.translate(gm.x, y + 20);
    ctx.rotate(Math.PI + gm.a);
    const glow = 0.5 + 0.3 * Math.sin(time * 2 + gm.x);
    const cg = ctx.createLinearGradient(-5, 0, 5, 0);
    cg.addColorStop(0, `hsl(${gm.hue} 90% 90%)`);
    cg.addColorStop(1, `hsl(${gm.hue} 60% 68%)`);
    ctx.fillStyle = cg;
    ctx.strokeStyle = `hsl(${gm.hue} 45% 50%)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-5, -gm.len * 0.75);
    ctx.lineTo(0, -gm.len);
    ctx.lineTo(5, -gm.len * 0.75);
    ctx.lineTo(5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `hsla(${gm.hue} 100% 92% / ${glow})`;
    circle(ctx, 0, -gm.len, 3);
    ctx.restore();
  }
  ctx.fillStyle = '#5e4f88';
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 2);
  ctx.bezierCurveTo(x + w * 0.1, y + 30, x + w * 0.35, y + 42, x + w * 0.5, y + 44);
  ctx.bezierCurveTo(x + w * 0.68, y + 40, x + w * 0.9, y + 30, x + w + 2, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6e5e98';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y + 14);
  ctx.bezierCurveTo(x + w * 0.3, y + 32, x + w * 0.42, y + 36, x + w * 0.5, y + 37);
  ctx.bezierCurveTo(x + w * 0.62, y + 34, x + w * 0.75, y + 26, x + w * 0.85, y + 14);
  ctx.closePath();
  ctx.fill();
  snowCap(ctx, x, x + w, y, '#efe8ff', '#c4b4ec');
  // small crystals on top (behind feet, low)
  for (const b of bits.bumps) {
    ctx.fillStyle = 'rgba(220,200,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(b.x - 3, y - 4);
    ctx.lineTo(b.x, y - 4 - 9 * b.s);
    ctx.lineTo(b.x + 3, y - 4);
    ctx.fill();
  }
}

// ——— signs and gates ———

function drawZoneSign(ctx, x, z, i, time) {
  const base = GROUND;
  const board = ['#8a9cd4', '#7a62c0'][i], edge = ['#5a6ca8', '#4a3a8a'][i];
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.roundRect(x - 4, base - 92, 8, 94, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, base - 70);
  ctx.rotate(Math.sin(time * 1.1 + i) * 0.02);
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(120, ctx.measureText(z.name).width + 28);
  ctx.fillStyle = board;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -24, tw, 46, 10);
  ctx.fill();
  ctx.stroke();
  // snow on top of the board
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 2, -28, tw - 4, 7, 3.5);
  ctx.fill();
  ellipse(ctx, -tw / 4, -27, 10, 4);
  ellipse(ctx, tw / 5, -27, 8, 3.5);
  text(ctx, z.name, 0, -9, 15, '#ffffff');
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.roundRect(-30, 2, 60, 15, 7.5);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 10, 11, edge);
  if (i === 1) {
    ctx.fillStyle = '#fff3a8';
    star4(ctx, tw / 2 - 4, -26, 6 + Math.sin(time * 3) * 1.2);
  }
  ctx.restore();
}

// The way back down: a snowy wooden signpost, "← Wildwood"
function drawExit(ctx, x, time) {
  const base = GROUND;
  drawStoneArch(ctx, x, base, time);
  hangingSign(ctx, x, base - 150, 'Wildwood', null, -1, time);
}

// A rough stone arch capped with snow
function drawStoneArch(ctx, x, base, time) {
  const half = 54, top = base - 150;
  for (const px of [x - half, x + half]) {
    ctx.fillStyle = '#8a90b8';
    ctx.beginPath();
    ctx.roundRect(px - 11, top + 14, 22, base - top - 12, 8);
    ctx.fill();
    ctx.fillStyle = '#9ea4c8';
    for (let sy = top + 30; sy < base - 6; sy += 26) ellipse(ctx, px - 2, sy, 8, 5);
  }
  ctx.strokeStyle = '#7a80a8';
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - half - 6, top + 22);
  ctx.quadraticCurveTo(x, top - 30, x + half + 6, top + 22);
  ctx.stroke();
  ctx.strokeStyle = '#9ea4c8';
  ctx.lineWidth = 11;
  ctx.stroke();
  // snow on top
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(x - half - 8, top + 12);
  ctx.quadraticCurveTo(x, top - 40, x + half + 8, top + 12);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  for (const px of [x - half, x + half]) ellipse(ctx, px, base - 2, 16, 5);
  // icicles under the arch
  ctx.fillStyle = '#d4ecff';
  for (let i = -3; i <= 3; i++) {
    const ix = x + i * 14, iy = top + 6 + Math.abs(i) * 5 + (i * i) * 1.2;
    ctx.beginPath();
    ctx.moveTo(ix - 3, iy);
    ctx.lineTo(ix, iy + 9 + (i % 2 ? 4 : 0) + Math.sin(time + i) * 0.5);
    ctx.lineTo(ix + 3, iy);
    ctx.fill();
  }
}

function hangingSign(ctx, x, y, label, sub, dir, time) {
  ctx.save();
  ctx.translate(x, y + 14);
  ctx.rotate(Math.sin(time * 1.4 + x) * 0.035);
  ctx.strokeStyle = '#e8e4f4';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(-26, 18);
  ctx.moveTo(26, 0);
  ctx.lineTo(26, 18);
  ctx.stroke();
  ctx.font = "700 14px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = ctx.measureText(label).width + 44;
  const hh = sub ? 40 : 26;
  ctx.fillStyle = '#f6f8ff';
  ctx.strokeStyle = '#8a9cd4';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, 18, tw, hh, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, -tw / 4, 18, 12, 3.5);
  ellipse(ctx, tw / 4, 18, 9, 3);
  const angle = dir === 0 ? -Math.PI / 2 : dir > 0 ? 0 : Math.PI;
  const ax = dir === 0 ? tw / 2 - 13 : dir > 0 ? tw / 2 - 14 : -tw / 2 + 14;
  text(ctx, label, dir < 0 ? 7 : -7, 31.5, 14, INK);
  arrow(ctx, ax, 31, angle, 0.85, '#5a8ad0');
  if (sub) {
    ctx.fillStyle = 'rgba(138,156,212,0.25)';
    ctx.beginPath();
    ctx.roundRect(-26, 42, 52, 13, 6.5);
    ctx.fill();
    text(ctx, sub, 0, 48.5, 10, '#5a6ca8');
  }
  ctx.restore();
}

// The trail up to the Highlands, drawn in the Wildwood at HIGHLANDS_DOOR_X: a snowy stone arch over
// a path, with a sign "Frostpeak Highlands ↑ Lv 13+" and a few snowflakes drifting out of it.
export function drawHighlandsTrail(ctx, x, groundY, time) {
  ctx.save();
  // a cold glow and a little snowy path leading in
  const g = ctx.createRadialGradient(x, groundY - 70, 10, x, groundY - 70, 110);
  g.addColorStop(0, 'rgba(210,230,255,0.55)');
  g.addColorStop(1, 'rgba(210,230,255,0)');
  ctx.fillStyle = g;
  circle(ctx, x, groundY - 70, 110);
  ctx.fillStyle = '#eef4ff';
  ctx.beginPath();
  ctx.ellipse(x, groundY + 2, 62, 7, 0, 0, TAU);
  ctx.fill();
  // stone steps going up behind the arch
  ctx.fillStyle = '#b8c0dc';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.roundRect(x - 34 + i * 4, groundY - 14 - i * 16, 68 - i * 8, 10, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x - 30 + i * 4, groundY - 16 - i * 16, 60 - i * 8, 4, 2);
    ctx.fill();
    ctx.fillStyle = '#b8c0dc';
  }
  drawStoneArch(ctx, x, groundY, time);
  // keep the sign inside the Wildwood's east edge (the camera stops there)
  ctx.font = "700 14px Fredoka, 'Trebuchet MS', sans-serif";
  const half = (ctx.measureText('Frostpeak Highlands').width + 44) / 2;
  hangingSign(ctx, Math.min(x, FIELD_W - 10 - half), groundY - 150, 'Frostpeak Highlands', 'Lv 13+', 0, time);
  // snowflakes drifting out
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 8; i++) {
    const k = (time * 0.25 + i / 8) % 1;
    circle(ctx, x - 40 + ((i * 37) % 80) + Math.sin(k * 6 + i) * 6, groundY - 140 + k * 140, 1.6 + (i % 3) * 0.6);
  }
  ctx.restore();
}
