// Docs: docs/combat/stages.md
// The Emberdeep Caldera (room 12): the third mob stage, down a lava-lit pass at the Highlands' east end
// (data in src/shared/rpg.js). Cinder Flats is a warm ash plain under an orange dusk, with smouldering
// boulders and drifting embers; Magma Heart sinks deeper, under a crimson-violet sky, with glowing lava
// rivers, obsidian spires and the volcano's maw. This room draws its own sky (all 540 px).
// Left clear for others: the den mouths (x 2080, 4060) and the skylift up to the Citadel (x 4300).
// Also here: the pass down from the Highlands (drawCalderaPass) and the Caldera's four mobs.
import { W, H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { CALDERA_W, CALDERA_EXIT_X, CALDERA_ZONES, CALDERA_PLATFORMS, CALDERA, DENS, FIELD_GROUND, HIGHLANDS_W, CITADEL_DOOR_X } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const INK = '#5a3448';
const B = CALDERA_ZONES[1].x0; // flats → heart
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const heatK = (x) => smooth(B - 300, B + 300, x); // 0 = Cinder Flats, 1 = Magma Heart
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
// keep big scenery away from the den entrances and the skylift
const CLEAR_XS = [...DENS.filter((d) => d.from === CALDERA).map((d) => d.entranceX), CITADEL_DOOR_X];
const clearOf = (x, pad = 150) => CLEAR_XS.every((d) => Math.abs(x - d) > pad);
const SCENERY_END = CITADEL_DOOR_X - 150;

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

// A soft flickering flame: a teardrop that licks upwards from (x, y), s = its half width
function flamePath(ctx, x, y, s, t, ph) {
  const f = Math.sin(t * 13 + ph) * 0.14, g = Math.sin(t * 9 + ph * 2) * 0.12;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.5, y);
  ctx.bezierCurveTo(x - s * 0.62, y - s * 0.6, x - s * 0.15 + f * s, y - s * 0.95, x + f * s * 2.2, y - s * (1.55 + g));
  ctx.bezierCurveTo(x + s * 0.22 + f * s, y - s * 0.95, x + s * 0.64, y - s * 0.6, x + s * 0.5, y);
  ctx.quadraticCurveTo(x, y + s * 0.32, x - s * 0.5, y);
  ctx.closePath();
}
function flame(ctx, x, y, s, t, ph, cols = ['#ff7a3a', '#ffbe48', '#fff2b4']) {
  ctx.fillStyle = cols[0];
  flamePath(ctx, x, y, s, t, ph);
  ctx.fill();
  ctx.fillStyle = cols[1];
  flamePath(ctx, x, y - s * 0.05, s * 0.68, t, ph + 1.3);
  ctx.fill();
  ctx.fillStyle = cols[2];
  flamePath(ctx, x, y - s * 0.08, s * 0.36, t, ph + 2.1);
  ctx.fill();
}
// a soft round glow (this room's falloff; drawn by src/glow.js)
function softGlow(ctx, x, y, r, rgb, a) {
  radialGlow(ctx, x, y, r, r, rgb, a, 1, 0.35, 0.55); // src/glow.js
}

// ——— seeded scenery ———

const TILE = 1600;
const skyStars = (() => {
  const r = mulberry32(601);
  return Array.from({ length: 60 }, () => ({ x: r() * W, y: r() * 220, s: 0.6 + r() * 1.1, p: r() * TAU, big: r() < 0.08 }));
})();
const clouds = (() => {
  const r = mulberry32(603);
  return Array.from({ length: 7 }, (_, i) => ({
    x: (i + r() * 0.6) * (1920 / 7), y: 60 + r() * 150, s: 0.7 + r() * 0.7,
    puffs: Array.from({ length: 4 + Math.floor(r() * 3) }, (_, k) => ({ dx: (k - 2.5) * 26 + r() * 10, dy: -r() * 14, r: 16 + r() * 16 })),
  }));
})();
const embers = (() => {
  const r = mulberry32(605);
  return Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, s: 1 + r() * 1.8, v: 18 + r() * 34, p: r() * TAU, w: 8 + r() * 18 }));
})();
const ash = (() => {
  const r = mulberry32(607);
  return Array.from({ length: 45 }, () => ({ x: r() * W, y: r() * H, s: 1 + r() * 1.6, v: 10 + r() * 16, p: r() * TAU }));
})();
function hills(seed, n, base, hMin, hMax, wMin, wMax) {
  const r = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => ({ x: ((i + r() * 0.6) * TILE) / n, h: hMin + r() * (hMax - hMin), w: wMin + r() * (wMax - wMin), base, p: r() * TAU, flat: r() < 0.45 }));
}
const RANGES = [
  { f: 0.14, hills: hills(611, 7, 426, 90, 160, 260, 380), cinder: '#dc9a88', heart: '#5c2652', top: '#eab4a0', topH: '#74346a' },
  { f: 0.3, hills: hills(613, 9, 444, 50, 110, 190, 300), cinder: '#c27c70', heart: '#421a40', top: '#d89888', topH: '#5a2456', lava: true },
];
const boulders = (() => {
  const r = mulberry32(621);
  const out = [];
  for (let x = 330; x < B - 80; x += 190 + r() * 210) if (clearOf(x, 170)) out.push({ x, s: 0.75 + r() * 0.5, p: r() * TAU, type: r() < 0.6 ? 'boulder' : 'stack' });
  return out;
})();
const spires = (() => {
  const r = mulberry32(623);
  const out = [];
  for (let x = B + 270; x < SCENERY_END - 40; x += 150 + r() * 170) {
    if (!clearOf(x, 175)) continue;
    const n = 2 + Math.floor(r() * 3);
    out.push({ x, s: 0.75 + r() * 0.55, p: r() * TAU, shards: Array.from({ length: n }, (_, i) => ({ dx: (i - (n - 1) / 2) * 16 + r() * 6, len: 60 + r() * 80 - Math.abs(i - (n - 1) / 2) * 22, wd: 9 + r() * 6, a: (i - (n - 1) / 2) * 0.22 + (r() - 0.5) * 0.12 })) });
  }
  return out;
})();
const groundDeco = (() => {
  const r = mulberry32(627);
  const out = [];
  for (let x = 150; x < SCENERY_END + 100; x += 28 + r() * 54) {
    if (!clearOf(x, 125)) continue;
    const k = r();
    if (x < B) out.push(k < 0.3 ? { type: 'ash', x, s: 0.7 + r() * 0.6 } : k < 0.6 ? { type: 'bloom', x, s: 0.7 + r() * 0.5, p: r() * TAU } : k < 0.85 ? { type: 'rock', x, s: 0.6 + r() * 0.6 } : { type: 'vent', x, s: 0.8 + r() * 0.4, p: r() * TAU });
    else out.push(k < 0.4 ? { type: 'shard', x, s: 0.6 + r() * 0.6, p: r() * TAU } : k < 0.65 ? { type: 'bloom', x, s: 0.7 + r() * 0.5, p: r() * TAU } : k < 0.85 ? { type: 'rock', x, s: 0.6 + r() * 0.6 } : { type: 'vent', x, s: 0.8 + r() * 0.4, p: r() * TAU });
  }
  return out;
})();
const pebbles = (() => {
  const r = mulberry32(629);
  return Array.from({ length: CALDERA_W / 30 }, () => ({ x: r() * CALDERA_W, dy: 34 + r() * (H - GROUND - 34), r: 2 + r() * 3, glow: r() < 0.3 }));
})();
const cracks = (() => {
  const r = mulberry32(631);
  const out = [];
  for (let x = 60; x < CALDERA_W; x += 70 + r() * 110) {
    const pts = [[x, GROUND + 6 + r() * 4]];
    for (let i = 0; i < 3; i++) pts.push([pts[i][0] + 8 + r() * 12, pts[i][1] + (r() - 0.35) * 9]);
    out.push({ pts, p: r() * TAU });
  }
  return out;
})();
const platBits = CALDERA_PLATFORMS.map((p, i) => {
  const r = mulberry32(700 + i);
  const cols = [];
  for (let cx = p.x - 2; cx < p.x + p.w - 6; cx += 20 + r() * 6) cols.push({ x: cx, w: 20, len: 6 + r() * 26, dark: r() < 0.5 });
  return {
    cols,
    shards: Array.from({ length: Math.floor(p.w / 26) }, (_, k) => ({ x: p.x + 14 + k * 26 + r() * 8, len: 10 + r() * 22, wd: 6 + r() * 4 })),
    drips: Array.from({ length: 3 }, () => ({ x: p.x + 24 + r() * (p.w - 48), p: r() })),
    crack: p.x + 30 + r() * (p.w - 90),
  };
});

const gradCache = new WeakMap();
function zoneGrad(ctx, key, a, b) {
  let c = gradCache.get(ctx);
  if (!c) gradCache.set(ctx, (c = {}));
  if (!c[key]) {
    const g = ctx.createLinearGradient(0, 0, CALDERA_W, 0);
    g.addColorStop(0, a);
    g.addColorStop((B - 250) / CALDERA_W, a);
    g.addColorStop((B + 250) / CALDERA_W, b);
    g.addColorStop(1, b);
    c[key] = g;
  }
  return c[key];
}

// ——— the room ———

// Everything in the Caldera behind the slimes: the sky and far layers in screen space (so they cover
// the full 540 px under any camera transform), then the world in world space.
export function drawCaldera(ctx, camX, viewW, time) {
  const k = heatK(camX + viewW / 2);
  ctx.save();
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time, k);
  ctx.restore();

  const L = camX - 80, R = camX + viewW + 80;
  for (const b of boulders) if (visible(b.x - 80, b.x + 80, L, R)) drawBoulder(ctx, b, time);
  for (const s of spires) if (visible(s.x - 90, s.x + 90, L, R)) drawSpire(ctx, s, time);
  drawGround(ctx, Math.max(0, L), Math.min(CALDERA_W, R), time);
  CALDERA_ZONES.forEach((z, i) => {
    const sx = i === 0 ? 280 : z.x0 + 170;
    if (visible(sx - 90, sx + 90, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  if (visible(CALDERA_EXIT_X - 100, CALDERA_EXIT_X + 160, L, R)) drawExit(ctx, CALDERA_EXIT_X, time);
  CALDERA_PLATFORMS.forEach((p, i) => {
    if (!visible(p.x - 40, p.x + p.w + 40, L, R)) return;
    if (p.kind === 'basalt') drawBasalt(ctx, p, platBits[i], time);
    else drawObsidian(ctx, p, platBits[i], time);
  });
  // drifting ash over the flats, rising embers everywhere (more in the heart)
  ctx.save();
  ctx.translate(camX, 0);
  drawAir(ctx, camX, time, k);
  ctx.restore();
  ctx.restore();
}

function drawSky(ctx, camX, time, k) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, mix('#ee9a84', '#28183f', k));
  sky.addColorStop(0.45, mix('#ffbc90', '#5e2658', k));
  sky.addColorStop(0.8, mix('#ffdcaa', '#c24c6a', k));
  sky.addColorStop(1, mix('#ffe8b8', '#ee7a5a', k));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // a few stars come out over the heart
  if (k > 0.05) {
    for (const s of skyStars) {
      const tw = 0.5 + 0.5 * Math.sin(time * 2 + s.p);
      const x = (((s.x - camX * 0.02) % W) + W) % W;
      ctx.fillStyle = `rgba(255,236,220,${k * (0.25 + 0.5 * tw)})`;
      if (s.big) star4(ctx, x, s.y, 2.6 + tw);
      else circle(ctx, x, s.y, s.s * 0.8);
    }
  }
  // a big soft setting sun over the flats
  if (k < 0.98) {
    const sx = 250 - camX * 0.012, sy = 262;
    ctx.globalAlpha = 1 - k;
    softGlow(ctx, sx, sy, 190, '255,236,190', 0.55);
    ctx.fillStyle = '#fff1c4';
    circle(ctx, sx, sy, 64);
    // sunset bands across its lower half
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, 64, 0, TAU);
    ctx.clip();
    ctx.fillStyle = '#ffc896';
    ctx.beginPath();
    for (const [dy, hh] of [[22, 5], [36, 6], [50, 7]]) ctx.rect(sx - 70, sy + dy, 140, hh);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // soft ash clouds drifting slowly
  ctx.fillStyle = mix('#ffe2cc', '#8a3c74', k);
  ctx.globalAlpha = 0.5;
  const coff = (camX * 0.05 + time * 4) % 1920;
  for (const c of clouds) {
    for (const tx of [-coff, 1920 - coff]) {
      const cx = tx + c.x;
      if (cx < -140 || cx > W + 140) continue;
      ctx.beginPath();
      for (const p of c.puffs) {
        ctx.moveTo(cx + p.dx * c.s + p.r * c.s, c.y + p.dy * c.s);
        ctx.arc(cx + p.dx * c.s, c.y + p.dy * c.s, p.r * c.s, 0, TAU);
      }
      ctx.roundRect(cx - 80 * c.s, c.y - 6 * c.s, 160 * c.s, 18 * c.s, 9 * c.s);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  // the other islands, far north over the sea (behind the volcano and the hills)
  drawDistantIslands(ctx, { from: 'ember', scroll: camX, roomW: CALDERA_W, time, horizon: 345, haze: mix('#ffdcaa', '#c24c6a', k), fade: 0.55, scale: 0.68, night: k, sky: 250 });
  drawVolcano(ctx, 690 - camX * 0.06, time, k);
  // rolling hills / mesas, far to near
  for (const Rg of RANGES) {
    const off = (camX * Rg.f) % TILE;
    const col = mix(Rg.cinder, Rg.heart, k), top = mix(Rg.top, Rg.topH, k);
    for (const tileX of [-off, TILE - off]) {
      for (const p of Rg.hills) {
        const px = tileX + p.x;
        if (px + p.w / 2 < -10 || px - p.w / 2 > W + 10) continue;
        hillPath(ctx, px, p, 0);
        ctx.fillStyle = col;
        ctx.fill();
        // a lighter band of cooled crust along the top
        ctx.save();
        hillPath(ctx, px, p, 0);
        ctx.clip();
        ctx.fillStyle = top;
        hillPath(ctx, px, p, 10);
        ctx.rect(px - p.w, p.base - p.h - 40, p.w * 2, p.h + 120);
        ctx.fill('evenodd');
        ctx.restore();
        if (Rg.lava && k > 0.03) {
          // glowing lava rivulets running down the near hills
          const pulse = 0.75 + 0.25 * Math.sin(time * 2 + p.p);
          ctx.lineCap = 'round';
          for (const [lw, c, a] of [[9, '255,110,60', 0.35], [4, '255,170,80', 0.9], [1.6, '255,236,170', 0.9]]) {
            ctx.strokeStyle = `rgba(${c},${a * k * pulse})`;
            ctx.lineWidth = lw;
            ctx.beginPath();
            const x0 = px + p.w * 0.06, y0 = p.base - p.h * 0.86;
            ctx.moveTo(x0, y0);
            ctx.bezierCurveTo(x0 + 18, y0 + p.h * 0.3, x0 - 14, y0 + p.h * 0.55, x0 + 10, p.base + 4);
            ctx.stroke();
          }
        }
      }
    }
  }
  // a river of lava along the foot of the hills in the heart
  if (k > 0.03) {
    ctx.globalAlpha = k;
    ctx.fillStyle = '#ff7a3a';
    ctx.fillRect(0, 428, W, 24);
    ctx.fillStyle = '#ffb04a';
    ctx.fillRect(0, 432, W, 14);
    ctx.fillStyle = 'rgba(255,240,170,0.85)';
    const roff = (camX * 0.3 - time * 22) % 60;
    ctx.beginPath();
    for (let x = -roff - 60; x < W + 60; x += 60) {
      ctx.moveTo(x + 14, 437);
      ctx.ellipse(x, 437, 14, 2.2, 0, 0, TAU);
      ctx.moveTo(x + 39, 442);
      ctx.ellipse(x + 30, 442, 9, 1.6, 0, 0, TAU);
    }
    ctx.fill();
    ctx.fillStyle = '#d0505a';
    ctx.fillRect(0, 426, W, 3);
    ctx.globalAlpha = 1;
  }
  // warm haze where the hills meet the plain
  const hz = ctx.createLinearGradient(0, 330, 0, GROUND);
  const hc = mix('#ffe2bc', '#ff8a6a', k);
  hz.addColorStop(0, hc + '00');
  hz.addColorStop(1, hc + (k > 0.5 ? '66' : '99'));
  ctx.fillStyle = hz;
  ctx.fillRect(0, 330, W, GROUND - 330);
}

function hillPath(ctx, px, p, inset) {
  const top = p.base - p.h + inset, hw = p.w / 2;
  ctx.beginPath();
  ctx.moveTo(px - hw, p.base + 60);
  if (p.flat) {
    // a soft-shouldered mesa
    ctx.bezierCurveTo(px - hw * 0.7, p.base - p.h * 0.2, px - hw * 0.6, top, px - hw * 0.3, top);
    ctx.lineTo(px + hw * 0.3, top);
    ctx.bezierCurveTo(px + hw * 0.6, top, px + hw * 0.7, p.base - p.h * 0.2, px + hw, p.base + 60);
  } else {
    ctx.bezierCurveTo(px - hw * 0.5, top - p.h * 0.25, px + hw * 0.5, top - p.h * 0.25, px + hw, p.base + 60);
  }
  ctx.closePath();
}

// The volcano on the horizon: hazy and quiet over the flats, its maw glowing over the heart
function drawVolcano(ctx, vx, time, k) {
  const base = 460, peak = 168;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(vx - 430, base);
    ctx.bezierCurveTo(vx - 240, 420, vx - 130, 250, vx - 74, peak + 4);
    ctx.quadraticCurveTo(vx - 64, peak - 6, vx - 50, peak);
    ctx.quadraticCurveTo(vx, peak + 12, vx + 50, peak);
    ctx.quadraticCurveTo(vx + 64, peak - 6, vx + 74, peak + 4);
    ctx.bezierCurveTo(vx + 130, 250, vx + 240, 420, vx + 430, base);
    ctx.closePath();
  };
  // the maw's glow lighting the sky above it
  softGlow(ctx, vx, peak, 170, '255,150,90', 0.25 + 0.45 * k);
  ctx.fillStyle = mix('#cf8c86', '#4c1e44', k);
  body();
  ctx.fill();
  // shade on the right flank
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = mix('#c07c7a', '#3e1838', k);
  ctx.beginPath();
  ctx.moveTo(vx + 10, peak);
  ctx.bezierCurveTo(vx + 40, 260, vx + 90, 380, vx + 120, base);
  ctx.lineTo(vx + 500, base);
  ctx.lineTo(vx + 500, peak - 20);
  ctx.closePath();
  ctx.fill();
  // lava trickling down from the rim (faint over the flats)
  ctx.lineCap = 'round';
  const pulse = 0.8 + 0.2 * Math.sin(time * 1.6);
  for (const [lw, c, a] of [[10, '255,110,70', 0.3], [4.5, '255,160,80', 0.85], [1.8, '255,236,170', 0.8]]) {
    ctx.strokeStyle = `rgba(${c},${a * (0.18 + 0.82 * k) * pulse})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(vx - 30, peak + 6);
    ctx.bezierCurveTo(vx - 50, peak + 70, vx - 20, peak + 120, vx - 60, peak + 190);
    ctx.moveTo(vx + 26, peak + 6);
    ctx.bezierCurveTo(vx + 40, peak + 60, vx + 80, peak + 100, vx + 70, peak + 170);
    ctx.stroke();
  }
  ctx.restore();
  // the crater's bright lip
  ctx.fillStyle = mix('#ffcf9a', '#ffcf6a', k);
  ctx.beginPath();
  ctx.ellipse(vx, peak + 3, 50, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = mix('#fff0c8', '#fff4c0', k);
  ctx.beginPath();
  ctx.ellipse(vx, peak + 3, 30, 3.5, 0, 0, TAU);
  ctx.fill();
  // a puffy smoke plume drifting east
  for (let i = 0; i < 8; i++) {
    const p = (time * 0.05 + i / 8) % 1;
    const x = vx + Math.sin(p * 3 + i) * 14 + p * 110, y = peak - 10 - p * 150, r = 16 + p * 34;
    ctx.fillStyle = k > 0.5 ? `rgba(110,60,100,${(1 - p) * 0.5})` : `rgba(240,214,206,${(1 - p) * 0.55})`;
    circle(ctx, x, y, r);
  }
  // sparks popping out of the maw
  if (k > 0.05) {
    for (let i = 0; i < 6; i++) {
      const p = (time * 0.6 + i * 0.37) % 1;
      const x = vx + (((i * 53) % 60) - 30) * p * 1.6, y = peak - Math.sin(p * Math.PI) * (40 + (i % 3) * 18);
      ctx.fillStyle = `rgba(255,${200 + (i % 2) * 40},120,${(1 - p) * k})`;
      circle(ctx, x, y, 2.4 * (1 - p * 0.5));
    }
  }
}

function drawAir(ctx, camX, time, k) {
  // grey-pink ash drifting down over the flats
  const aa = 0.55 * (1 - k) + 0.12;
  ctx.fillStyle = `rgba(240,220,214,${aa})`;
  ctx.beginPath();
  for (const f of ash) {
    const y = (f.y + time * f.v) % H;
    const x = ((((f.x - camX * 0.2 + Math.sin(time * 0.7 + f.p) * 16) % W) + W) % W);
    ctx.moveTo(x + f.s, y);
    ctx.arc(x, y, f.s, 0, TAU);
  }
  ctx.fill();
  // embers rising, twinkling as they go
  const n = Math.round(30 + 40 * k);
  for (let i = 0; i < n; i++) {
    const e = embers[i];
    const y = H - ((e.y + time * e.v) % (H + 20));
    const x = ((((e.x - camX * 0.35 + Math.sin(time * 1.3 + e.p) * e.w) % W) + W) % W);
    const tw = 0.6 + 0.4 * Math.sin(time * 6 + e.p);
    const fade = clamp(y / 160, 0, 1);
    ctx.fillStyle = `rgba(255,140,70,${0.22 * tw * fade})`;
    circle(ctx, x, y, e.s * 3);
    ctx.fillStyle = `rgba(255,${200 + Math.round(40 * tw)},140,${0.9 * fade})`;
    circle(ctx, x, y, e.s);
  }
}

// ——— ground ———

function drawGround(ctx, L, R, time) {
  const y = GROUND;
  ctx.fillStyle = zoneGrad(ctx, 'rock', '#9a6a66', '#4a2840');
  ctx.fillRect(L, y, R - L, H - y + 10);
  ctx.fillStyle = zoneGrad(ctx, 'rockDark', '#88595a', '#3c2036');
  ctx.fillRect(L, y + 54, R - L, H - y);
  ctx.fillStyle = zoneGrad(ctx, 'pebble', '#7c5052', '#5c3450');
  ctx.beginPath();
  for (const p of pebbles) {
    if (p.x < L || p.x > R) continue;
    ctx.moveTo(p.x + p.r * 1.4, y + p.dy);
    ctx.ellipse(p.x, y + p.dy, p.r * 1.4, p.r, 0, 0, TAU);
  }
  ctx.fill();
  // embers glowing in the rock (warmer the deeper you go)
  for (const p of pebbles) {
    if (!p.glow || p.x < L || p.x > R) continue;
    const kk = heatK(p.x);
    if (kk < 0.1) continue;
    ctx.fillStyle = `rgba(255,150,70,${kk * (0.45 + 0.35 * Math.sin(time * 2 + p.x))})`;
    ellipse(ctx, p.x, y + p.dy, p.r * 1.1, p.r * 0.75);
  }
  // glowing seams in the cooled crust
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const c of cracks) {
    const x0 = c.pts[0][0];
    if (x0 < L - 50 || x0 > R) continue;
    const kk = heatK(x0), a = (0.35 + 0.55 * kk) * (0.7 + 0.3 * Math.sin(time * 1.8 + c.p));
    for (const [lw, col, f] of [[5, '255,120,60', 0.35], [2, '255,190,90', 1]]) {
      ctx.strokeStyle = `rgba(${col},${a * f})`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      c.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.stroke();
    }
  }
  crustCap(ctx, L, R, y, zoneGrad(ctx, 'crust', '#c8a496', '#6e4062'), zoneGrad(ctx, 'crustShade', '#a07a74', '#52304a'), zoneGrad(ctx, 'crustLight', '#e2c4b4', '#8e5a80'));
  for (const d of groundDeco) if (d.x > L - 20 && d.x < R + 20) drawDeco(ctx, d, y - 2, time);
}

// Cooled lava crust along the top: a lumpy, rounded rind with a lighter, ashy top
function crustCap(ctx, x0, x1, y, crust, shade, light) {
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.roundRect(x0 - 4, y - 2, x1 - x0 + 8, 16, 8);
  ctx.fill();
  ctx.beginPath();
  for (let gx = Math.floor(x0 / 26) * 26 + 10; gx < x1 + 14; gx += 26) {
    ctx.moveTo(gx + 13, y + 12);
    ctx.ellipse(gx, y + 12, 13, 5, 0, 0, Math.PI);
  }
  ctx.fill();
  ctx.fillStyle = crust;
  ctx.beginPath();
  ctx.roundRect(x0 - 4, y - 6, x1 - x0 + 8, 14, 7);
  ctx.fill();
  ctx.beginPath();
  for (let gx = Math.floor(x0 / 34) * 34; gx < x1 + 18; gx += 34) {
    ctx.moveTo(gx + 17, y - 4);
    ctx.ellipse(gx, y - 4, 17, 3.5, 0, Math.PI, 0);
  }
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  for (let gx = Math.floor(x0 / 34) * 34; gx < x1 + 18; gx += 34) {
    ctx.moveTo(gx + 9, y - 5);
    ctx.ellipse(gx - 2, y - 5, 11, 1.8, 0, 0, TAU);
  }
  ctx.fill();
}

function drawDeco(ctx, d, y, time) {
  const hk = heatK(d.x);
  ctx.save();
  ctx.translate(d.x, y);
  ctx.scale(d.s, d.s);
  if (d.type === 'ash') {
    ctx.fillStyle = '#d8c0b8';
    ellipse(ctx, 0, -3, 14, 6);
    ellipse(ctx, 7, -5, 8, 5);
    ctx.fillStyle = '#efe0da';
    ellipse(ctx, -2, -6, 7, 2.4);
  } else if (d.type === 'bloom') {
    // a fire bloom: a little flower whose petals are flames
    softGlow(ctx, 0, -14, 16, '255,170,80', 0.35 + 0.15 * Math.sin(time * 2 + d.p));
    ctx.strokeStyle = mix('#8a6a50', '#6a3a50', hk);
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-3, -6, 0, -11);
    ctx.stroke();
    ctx.fillStyle = mix('#8a7a50', '#6a4a5a', hk);
    ellipse(ctx, -4, -5, 3.5, 1.6, -0.5);
    flame(ctx, 0, -10, 6, time, d.p);
  } else if (d.type === 'rock') {
    ctx.fillStyle = mix('#8a6062', '#3a2440', hk);
    ctx.beginPath();
    ctx.ellipse(0, -2, 10, 8, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = mix('#b08a84', '#5e3c66', hk);
    ellipse(ctx, -2, -7, 5, 2.2, -0.3);
    ctx.strokeStyle = `rgba(255,150,70,${0.4 + 0.5 * hk})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-4, -1);
    ctx.lineTo(0, -5);
    ctx.lineTo(3, -3);
    ctx.stroke();
  } else if (d.type === 'vent') {
    // a little steam vent with puffs curling up
    ctx.fillStyle = mix('#7a5050', '#3a2036', hk);
    ctx.beginPath();
    ctx.ellipse(0, -1, 11, 5, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffb04a';
    ellipse(ctx, 0, -2, 5, 1.6);
    for (let i = 0; i < 3; i++) {
      const p = (time * 0.5 + i / 3 + d.p) % 1;
      ctx.fillStyle = `rgba(255,240,236,${(1 - p) * 0.55})`;
      circle(ctx, Math.sin(p * 5 + d.p) * 4, -6 - p * 34, 3 + p * 6);
    }
  } else {
    // small obsidian shards with an ember glow at their feet
    softGlow(ctx, 0, -2, 14, '255,130,70', 0.35 + 0.15 * Math.sin(time * 2 + d.p));
    for (const [ox, a, len] of [[-4, -0.35, 13], [2, 0.08, 20], [7, 0.5, 10]]) {
      ctx.save();
      ctx.translate(ox, 0);
      ctx.rotate(a);
      ctx.fillStyle = '#3a2850';
      ctx.strokeStyle = '#1e1430';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-3, -len * 0.72);
      ctx.lineTo(0, -len);
      ctx.lineTo(3, -len * 0.72);
      ctx.lineTo(3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,170,230,0.7)';
      ctx.beginPath();
      ctx.moveTo(-1.2, -1);
      ctx.lineTo(-1.2, -len * 0.7);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

// ——— scenery ———

// A smouldering boulder (or a cairn of round stones) with glowing cracks and a curl of smoke
function drawBoulder(ctx, b, time) {
  const base = GROUND + 4;
  ctx.save();
  ctx.translate(b.x, base);
  ctx.scale(b.s, b.s);
  const glow = 0.6 + 0.3 * Math.sin(time * 1.7 + b.p);
  if (b.type === 'boulder') {
    ctx.fillStyle = '#8a5e60';
    ctx.beginPath();
    ctx.moveTo(-58, 0);
    ctx.bezierCurveTo(-62, -50, -30, -78, 4, -76);
    ctx.bezierCurveTo(40, -74, 62, -44, 56, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9e7070';
    ellipse(ctx, 22, -30, 26, 22);
    ctx.fillStyle = '#c09690';
    ellipse(ctx, -14, -60, 22, 9, -0.2);
    ctx.fillStyle = '#d8b4a8';
    ellipse(ctx, -18, -63, 11, 4, -0.2);
    // cracks glowing from the heat inside
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [lw, c, a] of [[6, '255,120,60', 0.35], [2.4, '255,190,90', 1]]) {
      ctx.strokeStyle = `rgba(${c},${a * glow})`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(-30, -6);
      ctx.lineTo(-20, -26);
      ctx.lineTo(-26, -40);
      ctx.moveTo(-20, -26);
      ctx.lineTo(-4, -32);
      ctx.moveTo(30, -8);
      ctx.lineTo(36, -24);
      ctx.stroke();
    }
    smoke(ctx, -6, -76, time, b.p);
  } else {
    // three round stones stacked like a little cairn, the top one smouldering
    for (const [x, y, rx, ry, c] of [[0, -18, 40, 20, '#88585c'], [-4, -48, 28, 15, '#9a6a6a'], [2, -70, 17, 10, '#aa7a76']]) {
      ctx.fillStyle = c;
      ellipse(ctx, x, y, rx, ry);
      ctx.fillStyle = 'rgba(255,230,220,0.25)';
      ellipse(ctx, x - rx * 0.3, y - ry * 0.45, rx * 0.45, ry * 0.25);
    }
    ctx.strokeStyle = `rgba(255,170,80,${glow})`;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-14, -18);
    ctx.lineTo(-4, -24);
    ctx.lineTo(8, -16);
    ctx.stroke();
    softGlow(ctx, 2, -80, 14, '255,160,80', 0.6 * glow);
    flame(ctx, 2, -78, 6, time, b.p);
  }
  ctx.restore();
}

function smoke(ctx, x, y, time, ph) {
  for (let i = 0; i < 4; i++) {
    const p = (time * 0.22 + i / 4 + ph) % 1;
    ctx.fillStyle = `rgba(240,222,216,${(1 - p) * 0.5})`;
    circle(ctx, x + Math.sin(p * 4 + ph) * 8 + p * 12, y - p * 70, 6 + p * 12);
  }
}

// An obsidian spire: a cluster of glossy black-violet shards with a magenta sheen, glowing at the root
function drawSpire(ctx, s, time) {
  const base = GROUND + 4;
  ctx.save();
  ctx.translate(s.x, base);
  ctx.scale(s.s, s.s);
  const glow = 0.7 + 0.3 * Math.sin(time * 1.5 + s.p);
  softGlow(ctx, 0, -6, 70, '255,120,80', 0.35 * glow);
  for (const sh of s.shards) {
    ctx.save();
    ctx.translate(sh.dx, 4);
    ctx.rotate(sh.a);
    const { len, wd } = sh;
    ctx.fillStyle = '#34244c';
    ctx.strokeStyle = '#1c1230';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-wd, 0);
    ctx.lineTo(-wd * 0.8, -len * 0.8);
    ctx.lineTo(0, -len);
    ctx.lineTo(wd * 0.8, -len * 0.8);
    ctx.lineTo(wd, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // the lit facet and a glossy streak
    ctx.fillStyle = '#4c3670';
    ctx.beginPath();
    ctx.moveTo(-wd, 0);
    ctx.lineTo(-wd * 0.8, -len * 0.8);
    ctx.lineTo(0, -len);
    ctx.lineTo(-wd * 0.1, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,170,230,0.75)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-wd * 0.55, -len * 0.12);
    ctx.lineTo(-wd * 0.5, -len * 0.72);
    ctx.stroke();
    // warm light from the lava below, on the lower edges
    ctx.strokeStyle = `rgba(255,150,80,${0.6 * glow})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wd * 0.95, -2);
    ctx.lineTo(wd * 0.85, -len * 0.35);
    ctx.stroke();
    ctx.restore();
  }
  // a twinkle on the tallest tip
  const tw = (time * 0.35 + s.p) % 1;
  ctx.fillStyle = `rgba(255,220,240,${Math.sin(tw * Math.PI) * 0.9})`;
  const tall = s.shards.reduce((a, b) => (b.len > a.len ? b : a));
  star4(ctx, tall.dx + Math.sin(tall.a) * tall.len, 4 - Math.cos(tall.a) * tall.len, 4);
  ctx.restore();
}

// ——— platforms ———

// A floating slab of basalt: an ashy top over a row of stubby hexagonal columns
function drawBasalt(ctx, p, bits, time) {
  const { x, y, w } = p, th = 18;
  for (const c of bits.cols) {
    ctx.fillStyle = c.dark ? '#5c4654' : '#6c5462';
    ctx.beginPath();
    ctx.roundRect(c.x + 1, y + 4, c.w - 2, th + c.len, [0, 0, 8, 8]);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,210,0.14)';
    ctx.beginPath();
    ctx.roundRect(c.x + 4, y + 8, 4, th + c.len - 12, 2);
    ctx.fill();
  }
  ctx.fillStyle = '#7e6470';
  ctx.strokeStyle = '#4c3646';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 2, w + 8, th + 4, 8);
  ctx.fill();
  ctx.stroke();
  // column seams on the slab face
  ctx.strokeStyle = 'rgba(60,36,52,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const c of bits.cols) {
    if (c.x < x + 6) continue;
    ctx.moveTo(c.x, y + 6);
    ctx.lineTo(c.x, y + th);
  }
  ctx.stroke();
  // one glowing crack
  const glow = 0.6 + 0.35 * Math.sin(time * 1.8 + x);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [lw, c, a] of [[5, '255,120,60', 0.35], [2, '255,190,90', 1]]) {
    ctx.strokeStyle = `rgba(${c},${a * glow})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(bits.crack, y + 4);
    ctx.lineTo(bits.crack + 8, y + 10);
    ctx.lineTo(bits.crack + 4, y + 16);
    ctx.lineTo(bits.crack + 14, y + th + 2);
    ctx.stroke();
  }
  // ashy top
  crustCap(ctx, x, x + w, y, '#b8a0a6', '#8c7480', '#d8c4c6');
}

// A floating shard of obsidian: a glossy slab with crystal points underneath and magma dripping off
function drawObsidian(ctx, p, bits, time) {
  const { x, y, w } = p, th = 18;
  // drips of magma falling and fading
  for (const d of bits.drips) {
    const k = (time * 0.5 + d.p) % 1;
    const dy = y + th + 14 + k * k * 70;
    ctx.fillStyle = `rgba(255,150,70,${(1 - k) * 0.85})`;
    ellipse(ctx, d.x, dy, 2.6, 3.6);
  }
  for (const s of bits.shards) {
    ctx.fillStyle = '#2c1e42';
    ctx.strokeStyle = '#180e28';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(s.x - s.wd, y + th - 2);
    ctx.lineTo(s.x, y + th + s.len);
    ctx.lineTo(s.x + s.wd, y + th - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,140,80,0.55)';
    circle(ctx, s.x, y + th + s.len - 3, 2);
  }
  ctx.fillStyle = '#382854';
  ctx.strokeStyle = '#1c1230';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 2);
  ctx.lineTo(x + w + 4, y - 2);
  ctx.lineTo(x + w - 4, y + th);
  ctx.lineTo(x + 4, y + th);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // glowing seam under the slab
  const glow = 0.65 + 0.35 * Math.sin(time * 2 + x);
  ctx.strokeStyle = `rgba(255,140,70,${0.8 * glow})`;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + th - 1);
  ctx.lineTo(x + w - 8, y + th - 1);
  ctx.stroke();
  // glossy sheen streaks
  ctx.strokeStyle = 'rgba(255,170,230,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let sx = x + 24; sx < x + w - 20; sx += 58) {
    ctx.moveTo(sx, y + th - 4);
    ctx.lineTo(sx + 10, y + 4);
  }
  ctx.stroke();
  // the polished top
  ctx.fillStyle = '#5c4280';
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 6, w + 10, 9, 4.5);
  ctx.fill();
  ctx.fillStyle = 'rgba(230,200,255,0.7)';
  ctx.beginPath();
  ctx.roundRect(x + 6, y - 5, w * 0.45, 2.5, 1.25);
  ctx.fill();
  const tw = (time * 0.4 + x * 0.01) % 1;
  ctx.fillStyle = `rgba(255,230,250,${Math.sin(tw * Math.PI)})`;
  star4(ctx, x + 10 + tw * (w - 20), y - 4, 3.5);
}

// ——— signs and gates ———

function drawZoneSign(ctx, x, z, i, time) {
  const base = GROUND;
  const board = ['#e8946a', '#8e3e72'][i], edge = ['#a85a3e', '#5a2050'][i];
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
  // a little flame on each top corner
  flame(ctx, -tw / 2 + 6, -24, 6, time, 0.3 + i);
  flame(ctx, tw / 2 - 6, -24, 6, time, 2.1 + i);
  text(ctx, z.name, 0, -9, 15, '#fffaf0');
  ctx.fillStyle = 'rgba(255,250,240,0.9)';
  ctx.beginPath();
  ctx.roundRect(-30, 2, 60, 15, 7.5);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 10, 11, edge);
  ctx.restore();
}

// The way back up: a basalt arch with a cold blue glow and frost, "← Frostpeak"
function drawExit(ctx, x, time) {
  const base = GROUND;
  // cool mountain air spilling down through the arch
  softGlow(ctx, x, base - 70, 110, '200,224,255', 0.45);
  ctx.fillStyle = '#e8eef8';
  ctx.beginPath();
  ctx.ellipse(x, base + 2, 58, 6, 0, 0, TAU);
  ctx.fill();
  // steps going up behind the arch
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#a8909a';
    ctx.beginPath();
    ctx.roundRect(x - 34 + i * 4, base - 14 - i * 16, 68 - i * 8, 10, 4);
    ctx.fill();
    ctx.fillStyle = '#f2f6ff';
    ctx.beginPath();
    ctx.roundRect(x - 30 + i * 4, base - 16 - i * 16, 60 - i * 8, 4, 2);
    ctx.fill();
  }
  rockArch(ctx, x, base, 54, 150, time, true);
  ctx.font = "700 14px Fredoka, 'Trebuchet MS', sans-serif";
  const half = (ctx.measureText('Frostpeak').width + 44) / 2;
  hangingSign(ctx, Math.max(x, 10 + half), base - 150, 'Frostpeak', null, -1, time, false);
  // a few snowflakes drifting down out of it
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 6; i++) {
    const k = (time * 0.22 + i / 6) % 1;
    circle(ctx, x - 36 + ((i * 29) % 72) + Math.sin(k * 6 + i) * 6, base - 140 + k * 140, 1.5 + (i % 3) * 0.5);
  }
}

// A rough arch of rounded rocks; frosty = snow on top (the Highlands side), else ash
function rockArch(ctx, x, base, half, height, time, frosty) {
  const top = base - height;
  const dark = frosty ? '#5a3e5c' : '#6a4a58', mid = frosty ? '#7e5c7a' : '#86606e', lite = frosty ? '#a07c98' : '#a07884';
  for (const px of [x - half, x + half]) {
    ctx.fillStyle = dark;
    ctx.strokeStyle = '#3a2440';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(px - 13, top + 14, 26, base - top - 12, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = mid;
    for (let sy = top + 30; sy < base - 6; sy += 24) ellipse(ctx, px - 2 + ((sy / 24) % 2) * 3, sy, 9, 6);
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(x - half - 6, top + 22);
  ctx.quadraticCurveTo(x, top - 30, x + half + 6, top + 22);
  ctx.stroke();
  ctx.strokeStyle = mid;
  ctx.lineWidth = 12;
  ctx.stroke();
  ctx.strokeStyle = lite;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - half, top + 12);
  ctx.quadraticCurveTo(x, top - 34, x + half, top + 12);
  ctx.stroke();
  // a cap of snow (or ash) along the top
  ctx.strokeStyle = frosty ? '#ffffff' : '#d8c4c6';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x - half - 8, top + 10);
  ctx.quadraticCurveTo(x, top - 42, x + half + 8, top + 10);
  ctx.stroke();
  ctx.fillStyle = frosty ? '#ffffff' : '#d8c4c6';
  for (const px of [x - half, x + half]) ellipse(ctx, px, base - 2, 17, 5);
  void time;
}

function hangingSign(ctx, x, y, label, sub, dir, time, frosty) {
  ctx.save();
  ctx.translate(x, y + 14);
  ctx.rotate(Math.sin(time * 1.4 + x) * 0.035);
  ctx.strokeStyle = frosty ? '#e8e4f4' : '#d8b8a8';
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
  ctx.fillStyle = '#fff6ec';
  ctx.strokeStyle = '#e0885a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, 18, tw, hh, 8);
  ctx.fill();
  ctx.stroke();
  if (frosty) {
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, -tw / 4, 18, 12, 3.5);
    ellipse(ctx, tw / 4, 18, 9, 3);
  } else {
    flame(ctx, tw / 2 - 4, 19, 5, time, 1.2);
  }
  // dir: -1 left, 1 right, 2 down
  const angle = dir === 2 ? Math.PI / 2 : dir > 0 ? 0 : Math.PI;
  const ax = dir === 2 ? tw / 2 - 13 : dir > 0 ? tw / 2 - 14 : -tw / 2 + 14;
  text(ctx, label, dir < 0 ? 7 : -7, 31.5, 14, INK);
  arrow(ctx, ax, 31, angle, 0.85, '#e0603a');
  if (sub) {
    ctx.fillStyle = 'rgba(224,136,90,0.25)';
    ctx.beginPath();
    ctx.roundRect(-26, 42, 52, 13, 6.5);
    ctx.fill();
    text(ctx, sub, 0, 48.5, 10, '#b0503a');
  }
  ctx.restore();
}

// The pass down to the Caldera, drawn in the Highlands at CALDERA_DOOR_X: a snowy rock arch over steps
// that sink out of sight, lit orange from below, with embers rising out and a sign "Emberdeep Caldera".
// (The Starfall den mouth is only 130 px to the west, so this stays narrow.)
export function drawCalderaPass(ctx, x, groundY, time) {
  const b = groundY, half = 42, height = 132, top = b - height;
  ctx.save();
  softGlow(ctx, x, b - 40, 120, '255,160,90', 0.5 + 0.08 * Math.sin(time * 2));
  // the opening: a warm glow welling up from deep below
  const opening = () => {
    ctx.beginPath();
    ctx.moveTo(x - half, b + 2);
    ctx.lineTo(x - half, top + half);
    ctx.arc(x, top + half, half, Math.PI, 0);
    ctx.lineTo(x + half, b + 2);
    ctx.closePath();
  };
  ctx.save();
  opening();
  ctx.clip();
  const g = ctx.createLinearGradient(0, top, 0, b);
  g.addColorStop(0, '#4a2a4a');
  g.addColorStop(0.55, '#c0505a');
  g.addColorStop(1, '#ffc060');
  ctx.fillStyle = g;
  ctx.fillRect(x - half, top - 2, half * 2, height + 6);
  // steps going down into the glow, getting smaller and brighter
  for (let i = 0; i < 5; i++) {
    const sy = b - 4 - i * 9, sw = 70 - i * 10;
    ctx.fillStyle = mix('#7a5060', '#ffd88a', i / 5);
    ctx.beginPath();
    ctx.roundRect(x - sw / 2, sy - 4, sw, 6, 3);
    ctx.fill();
  }
  // embers drifting up out of the depths
  for (let i = 0; i < 7; i++) {
    const k = (time * 0.35 + i / 7) % 1;
    ctx.fillStyle = `rgba(255,${190 + (i % 3) * 20},110,${Math.sin(k * Math.PI)})`;
    circle(ctx, x - 30 + ((i * 23) % 60) + Math.sin(k * 7 + i) * 5, b - 10 - k * (height - 10), 1.6 + (i % 2) * 0.8);
  }
  ctx.restore();
  rockArch(ctx, x, b, half, height, time, true);
  // the inner rim catches the orange light
  ctx.strokeStyle = 'rgba(255,170,90,0.6)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - half + 3, b - 4);
  ctx.lineTo(x - half + 3, top + half);
  ctx.arc(x, top + half, half - 3, Math.PI, 0);
  ctx.lineTo(x + half - 3, b - 4);
  ctx.stroke();
  // melted snow: a warm wet patch in front
  ctx.fillStyle = 'rgba(255,190,140,0.35)';
  ellipse(ctx, x, b + 2, 52, 5);
  // embers escaping above the arch
  for (let i = 0; i < 5; i++) {
    const k = (time * 0.25 + i / 5) % 1;
    ctx.fillStyle = `rgba(255,190,110,${(1 - k) * 0.9})`;
    circle(ctx, x - 20 + ((i * 17) % 40) + Math.sin(k * 5 + i) * 10, top - k * 70, 1.8);
  }
  // keep the sign inside the Highlands' east edge (the camera stops there)
  ctx.font = "700 14px Fredoka, 'Trebuchet MS', sans-serif";
  const hw = (ctx.measureText('Emberdeep Caldera').width + 44) / 2;
  hangingSign(ctx, Math.min(x, HIGHLANDS_W - 10 - hw), top - 64, 'Emberdeep Caldera', 'Lv 90+', 2, time, true);
  ctx.restore();
}

// ——— mobs ———
// Each (ctx, w, h, t, seed, m, dying) => sil, drawn with the origin at the feet, +x = facing.

function face(ctx, fx, fy, gap, t, seed, { grumpy = false, dying = 0, size = 1, glow = null } = {}) {
  ctx.strokeStyle = '#2d2a3e';
  ctx.fillStyle = '#2d2a3e';
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = !glow && ((t + seed * 7) % 3.4) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (glow) {
      softGlow(ctx, ex, fy, 9 * size, glow, 0.9);
      ctx.fillStyle = '#fff6c0';
      ellipse(ctx, ex, fy, 2.6 * size, 3.2 * size);
      ctx.fillStyle = '#2d2a3e';
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, blink ? 0.6 : 3.3 * size);
      if (!blink) {
        ctx.fillStyle = '#fff';
        ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
        ctx.fillStyle = '#2d2a3e';
      }
    }
  }
  if (grumpy && dying < 0.05) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 2.4 * size;
    ctx.beginPath();
    ctx.moveTo(fx - gap - 3.5 * size, fy - 6 * size);
    ctx.lineTo(fx - gap + 3 * size, fy - 3.6 * size);
    ctx.moveTo(fx + gap + 3.5 * size, fy - 6 * size);
    ctx.lineTo(fx + gap - 3 * size, fy - 3.6 * size);
    ctx.stroke();
    ctx.lineWidth = 1.8 * size;
  }
  ctx.fillStyle = 'rgba(255,120,120,0.5)';
  ellipse(ctx, fx - gap - 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
  ellipse(ctx, fx + gap + 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
}

// How far into its wind-up a mob is (0..1 over `dur` s), remembered per mob while m.warn holds
const warnStart = new Map();
function warnK(m, t, seed, dur) {
  const key = m.kind + seed;
  if (!m.warn) {
    warnStart.delete(key);
    return 0;
  }
  let s = warnStart.get(key);
  if (s === undefined || t < s) warnStart.set(key, (s = t));
  if (warnStart.size > 200) warnStart.clear();
  return clamp((t - s) / dur, 0, 1);
}

// Ember imp: a mischievous little fire sprite with a flame tuft and a devilish tail; it lobs fireballs
function drawImp(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const warn = !!m.warn && live, wk = warnK(m, t, seed, 0.5);
  const air = Math.abs(m.vy ?? 0) > 1;
  const top = -h * 0.84;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w / 2, -2);
    ctx.bezierCurveTo(-w / 2, -h * 0.6, -w * 0.3, top, 0, top);
    ctx.bezierCurveTo(w * 0.3, top, w / 2, -h * 0.6, w / 2, -2);
    ctx.quadraticCurveTo(0, 3, -w / 2, -2);
    ctx.closePath();
  };
  softGlow(ctx, 0, -h * 0.45, w * 0.95, '255,150,70', 0.35);
  // tail, flicking behind
  const flick = Math.sin(t * 5 + seed) * 0.25;
  ctx.strokeStyle = '#d0583a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.38, -h * 0.22);
  const tx = -w * 0.78, ty = -h * (0.5 + flick);
  ctx.quadraticCurveTo(-w * 0.75, -h * 0.12, tx, ty);
  ctx.stroke();
  ctx.fillStyle = '#ffbe48';
  ctx.beginPath(); // a little arrowhead tip
  ctx.moveTo(tx - 4, ty + 2);
  ctx.lineTo(tx, ty - 6);
  ctx.lineTo(tx + 4, ty + 2);
  ctx.quadraticCurveTo(tx, ty, tx - 4, ty + 2);
  ctx.fill();
  // feet
  ctx.fillStyle = '#d0583a';
  const step = m.walking && !air ? Math.sin(t * 12 + seed) * 2 : 0;
  ellipse(ctx, -w * 0.2 + step, -1, 6, 3.5);
  ellipse(ctx, w * 0.2 - step, -1, 6, 3.5);
  // little horns
  ctx.fillStyle = '#fff0c0';
  ctx.strokeStyle = '#d0583a';
  ctx.lineWidth = 1.2;
  for (const hx of [-w * 0.27, w * 0.22]) {
    ctx.beginPath();
    ctx.moveTo(hx - 3.5, top + 5);
    ctx.quadraticCurveTo(hx - 1, top - 4, hx + 1.5, top - 6);
    ctx.quadraticCurveTo(hx + 2, top, hx + 3.5, top + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, top, 0, 0);
  g.addColorStop(0, '#ffd27a');
  g.addColorStop(1, '#ff7a4a');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = '#c84a30';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // the flame tuft on its head, bigger while winding up
  flame(ctx, -w * 0.04, top + 5, 9 + wk * 3, t, seed * 3, ['#ff5236', '#ffa63a', '#fff0a0']);
  ctx.fillStyle = 'rgba(255,240,190,0.55)'; // belly
  ellipse(ctx, w * 0.06, -h * 0.2, w * 0.22, h * 0.15);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ellipse(ctx, -w * 0.24, -h * 0.62, w * 0.06, h * 0.08, -0.5);
  // face
  const fx = w * 0.13, fy = -h * 0.46;
  face(ctx, fx, fy, 5, t, seed, { dying, size: 0.9, grumpy: warn });
  if (live) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); // a cheeky lopsided grin
    ctx.moveTo(fx - 4.5, fy + 5);
    ctx.quadraticCurveTo(fx + 1, fy + 9.5, fx + 5.5, fy + 4);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); // with one fang
    ctx.moveTo(fx + 1.2, fy + 7.2);
    ctx.lineTo(fx + 2.4, fy + 9.6);
    ctx.lineTo(fx + 3.6, fy + 6.4);
    ctx.fill();
  }
  // arms: swinging at its sides, or both up holding a growing fireball overhead
  ctx.strokeStyle = '#e0603a';
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  if (warn) {
    const r = 4 + wk * 7, by = top - 10 - r;
    ctx.beginPath();
    ctx.moveTo(-w * 0.36, -h * 0.5);
    ctx.quadraticCurveTo(-w * 0.42, top, -r * 0.7, by + r * 0.5);
    ctx.moveTo(w * 0.4, -h * 0.5);
    ctx.quadraticCurveTo(w * 0.46, top, r * 0.7, by + r * 0.5);
    ctx.stroke();
    softGlow(ctx, 0, by, r * 3, '255,150,60', 0.8);
    ctx.fillStyle = '#ff7a3a';
    circle(ctx, 0, by, r);
    flame(ctx, 0, by + r * 0.2, r * 0.9, t * 1.5, seed);
    ctx.fillStyle = '#fff2b4';
    circle(ctx, 0, by, r * 0.5);
    // sparks swirling in
    for (let i = 0; i < 4; i++) {
      const a = t * 6 + (i / 4) * TAU;
      ctx.fillStyle = '#ffd27a';
      circle(ctx, Math.cos(a) * r * 1.7, by + Math.sin(a) * r * 1.2, 1.4);
    }
  } else {
    const sw = Math.sin(t * (m.walking ? 12 : 3) + seed) * 0.3;
    ctx.beginPath();
    ctx.moveTo(w * 0.42, -h * 0.4);
    ctx.lineTo(w * 0.58, -h * (0.28 + sw * 0.3));
    ctx.moveTo(-w * 0.42, -h * 0.4);
    ctx.lineTo(-w * 0.56, -h * (0.3 - sw * 0.3));
    ctx.stroke();
  }
  return body;
}

// Magma slug: a glowing lava slug under a cooled-crust shell, eyes on stalks, dripping as it goes
function drawSlug(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const ripple = m.walking ? Math.sin(t * 3.2 + seed) : 0;
  const hx = w * (0.34 + ripple * 0.02); // head centre
  const slug = () => {
    ctx.moveTo(-w * 0.5, 0);
    ctx.quadraticCurveTo(-w * 0.54, -h * 0.26, -w * 0.32, -h * 0.34);
    ctx.lineTo(w * 0.16, -h * 0.4);
    ctx.bezierCurveTo(w * 0.22, -h * 0.82, hx + w * 0.16, -h * 0.86, hx + w * 0.17, -h * 0.4);
    ctx.quadraticCurveTo(hx + w * 0.18, 0, hx, 0);
    ctx.closePath();
  };
  const shellY = -h * 0.28 + ripple * 1.2;
  const shell = () => {
    ctx.moveTo(-w * 0.44, shellY);
    ctx.bezierCurveTo(-w * 0.46, -h * 1.12, w * 0.16, -h * 1.16, w * 0.22, shellY - h * 0.06);
    ctx.quadraticCurveTo(-w * 0.1, shellY + h * 0.08, -w * 0.44, shellY);
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    slug();
    shell();
  };
  // heat glow on the ground under it
  ctx.fillStyle = 'rgba(255,140,60,0.3)';
  ellipse(ctx, 0, -1, w * 0.6, 5);
  // drips falling off the shell rim
  for (let i = 0; i < 2; i++) {
    const k = (t * 0.9 + i * 0.5 + seed) % 1;
    const dx = -w * 0.38 + i * w * 0.45;
    ctx.fillStyle = `rgba(255,170,70,${1 - k * 0.6})`;
    ellipse(ctx, dx, shellY + 4 + k * (-shellY - 4), 2.2, 2.8 + k);
  }
  // eye stalks (behind the head)
  const wob = Math.sin(t * 2.4 + seed) * 2;
  ctx.strokeStyle = '#ff9a4a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const eyes = [[hx + 2, -h * 1.12 + wob], [hx + 13, -h * 1.02 - wob * 0.6]];
  ctx.beginPath();
  for (const [ex, ey] of eyes) {
    ctx.moveTo(hx + 4, -h * 0.66);
    ctx.quadraticCurveTo(ex - 3, (ey - h * 0.66) / 2, ex, ey);
  }
  ctx.stroke();
  // the lava body
  const g = ctx.createLinearGradient(0, -h * 0.8, 0, 0);
  g.addColorStop(0, '#ffe08a');
  g.addColorStop(0.5, '#ffaa4a');
  g.addColorStop(1, '#ff6a3a');
  ctx.fillStyle = g;
  ctx.beginPath();
  slug();
  ctx.fill();
  ctx.strokeStyle = '#c8462e';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // bubbles popping on its skin
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.7 + i / 3 + seed * 0.3) % 1;
    ctx.fillStyle = `rgba(255,246,200,${Math.sin(k * Math.PI) * 0.9})`;
    circle(ctx, -w * 0.4 + i * w * 0.18, -h * 0.16 - k * 3, 1.4 + k * 1.8);
  }
  // the crust shell: dark cooled rock with glowing seams between its plates
  const sg = ctx.createLinearGradient(0, -h * 1.05, 0, shellY);
  sg.addColorStop(0, '#8a6068');
  sg.addColorStop(1, '#4e3040');
  ctx.fillStyle = sg;
  ctx.beginPath();
  shell();
  ctx.fill();
  ctx.strokeStyle = '#2e1a28';
  ctx.lineWidth = 2;
  ctx.stroke();
  const glow = 0.65 + 0.35 * Math.sin(t * 2.5 + seed);
  ctx.save();
  ctx.beginPath();
  shell();
  ctx.clip();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [lw, c, a] of [[5, '255,120,60', 0.4], [2, '255,200,100', 1]]) {
    ctx.strokeStyle = `rgba(${c},${a * glow})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, shellY - 1);
    ctx.lineTo(-w * 0.24, -h * 0.62);
    ctx.lineTo(-w * 0.08, -h * 0.82);
    ctx.lineTo(-w * 0.02, -h * 1.1);
    ctx.moveTo(-w * 0.24, -h * 0.62);
    ctx.lineTo(-w * 0.44, -h * 0.7);
    ctx.moveTo(-w * 0.08, -h * 0.82);
    ctx.lineTo(w * 0.12, -h * 0.7);
    ctx.lineTo(w * 0.14, shellY);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,230,220,0.35)';
  ellipse(ctx, -w * 0.2, -h * 0.9, w * 0.1, h * 0.06, -0.3);
  // eyes on their stalks
  for (const [ex, ey] of eyes) {
    ctx.fillStyle = '#fff6e8';
    circle(ctx, ex, ey, 4.2);
    ctx.strokeStyle = '#c8462e';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    if (live) {
      ctx.fillStyle = '#2d2a3e';
      circle(ctx, ex + 1.2, ey + 0.4, 2.1);
      ctx.fillStyle = '#ffffff';
      circle(ctx, ex + 1.8, ey - 0.5, 0.7);
    } else {
      ctx.strokeStyle = '#2d2a3e';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ex - 1.8, ey - 1.8); ctx.lineTo(ex + 1.8, ey + 1.8);
      ctx.moveTo(ex + 1.8, ey - 1.8); ctx.lineTo(ex - 1.8, ey + 1.8);
      ctx.stroke();
    }
  }
  // a sleepy little smile and a blush on the head
  const mx = hx + w * 0.1, my = -h * 0.36;
  ctx.fillStyle = 'rgba(230,80,70,0.45)';
  ellipse(ctx, mx - 6, my - 2, 3, 1.8);
  if (live) {
    ctx.strokeStyle = '#7a2a28';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mx, my - 2, 2.6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  return sil;
}

// Obsidian crab: a glossy black crab with a big glassy shell; its front is armoured by its raised claws.
// m.warn: rears up, claws open, about to lunge · m.charging: lunging forward, claws first.
function drawCrab(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const warn = !!m.warn && live, charge = !!m.charging && live;
  const wk = warnK(m, t, seed, 0.5);
  const step = m.walking || charge ? Math.sin(t * (charge ? 26 : 14) + seed) : 0;
  // rear up on the back legs / lean into the lunge
  const tilt = warn ? -0.22 * Math.min(1, wk * 2.5) + Math.sin(t * 30) * 0.015 : charge ? 0.1 : 0;
  const stretch = charge ? 1.12 : 1;
  const pivot = warn ? -w * 0.36 : 0;
  const frame = () => {
    ctx.translate(pivot, 0);
    ctx.rotate(tilt);
    ctx.translate(-pivot, 0);
    ctx.scale(stretch, 1 / stretch);
  };
  const cy = -h * 0.24;
  const shell = () => {
    ctx.moveTo(-w * 0.44, cy);
    ctx.bezierCurveTo(-w * 0.46, -h * 0.98, w * 0.3, -h * 1.0, w * 0.32, cy);
    ctx.quadraticCurveTo(-w * 0.06, cy + h * 0.12, -w * 0.44, cy);
    ctx.closePath();
  };
  const sil = () => {
    ctx.save();
    frame();
    ctx.beginPath();
    shell();
    ctx.restore();
  };
  // a dash of speed lines while lunging
  if (charge) {
    ctx.strokeStyle = 'rgba(255,200,170,0.7)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const y = -h * (0.3 + i * 0.22), off = ((t * 8 + i * 0.3) % 1) * 10;
      ctx.moveTo(-w * 0.6 - off, y);
      ctx.lineTo(-w * 0.95 - off, y);
    }
    ctx.stroke();
  }
  ctx.save();
  frame();
  // legs: three a side, pointy little tips, scuttling
  const legs = (back) => {
    ctx.strokeStyle = back ? '#2a2044' : '#43366a';
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const ph = (i % 2 ? 1 : -1) * (back ? -1 : 1) * step;
      const x0 = -w * 0.28 + i * w * 0.2 + (back ? 4 : 0);
      ctx.moveTo(x0, cy - 2);
      ctx.lineTo(x0 - 6 + ph * 3, cy - 8 - Math.max(0, ph) * 3);
      ctx.lineTo(x0 - 9 + ph * 4, -1 - Math.max(0, ph) * 3);
    }
    ctx.stroke();
  };
  legs(true);
  // the back claw (smaller, behind the shell)
  claw(ctx, w * 0.3, warn ? -h * 0.86 : -h * 0.66, 13, warn ? 1 : charge ? 0.1 : 0.35, warn ? -1.2 : charge ? 0.2 : -0.7, true, t);
  // the glassy shell
  const g = ctx.createLinearGradient(0, -h, 0, cy);
  g.addColorStop(0, '#9a84cc');
  g.addColorStop(0.45, '#5a4892');
  g.addColorStop(1, '#2e2452');
  ctx.fillStyle = g;
  ctx.beginPath();
  shell();
  ctx.fill();
  ctx.strokeStyle = '#120c20';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  // facets and gloss
  ctx.save();
  ctx.beginPath();
  shell();
  ctx.clip();
  ctx.strokeStyle = 'rgba(200,170,255,0.35)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, cy);
  ctx.lineTo(-w * 0.12, -h * 0.62);
  ctx.lineTo(w * 0.12, -h * 0.66);
  ctx.lineTo(w * 0.26, cy);
  ctx.moveTo(-w * 0.12, -h * 0.62);
  ctx.lineTo(-w * 0.06, -h * 0.95);
  ctx.moveTo(w * 0.12, -h * 0.66);
  ctx.lineTo(w * 0.1, -h * 0.95);
  ctx.stroke();
  // warm seams glowing as it gets ready to lunge
  if (warn || charge) {
    ctx.strokeStyle = `rgba(255,150,70,${0.5 + 0.4 * Math.sin(t * 20)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  // the armoured front rim: a thick glassy band along the +x side
  ctx.save();
  ctx.beginPath();
  shell();
  ctx.clip();
  ctx.strokeStyle = '#c4b0f0';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(w * 0.02, -h * 0.9);
  ctx.bezierCurveTo(w * 0.28, -h * 0.86, w * 0.33, -h * 0.5, w * 0.31, cy);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.globalAlpha *= 0.6;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, -w * 0.18, -h * 0.8, w * 0.12, h * 0.05, -0.25);
  ctx.fillStyle = 'rgba(255,170,230,0.5)';
  ellipse(ctx, w * 0.12, -h * 0.84, w * 0.05, h * 0.03, 0.3);
  legs(false);
  // eyes on short stalks
  const fx = w * 0.16, fy = -h * 0.98;
  ctx.strokeStyle = '#2e2440';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fx - 4, -h * 0.82);
  ctx.lineTo(fx - 5, fy);
  ctx.moveTo(fx + 6, -h * 0.8);
  ctx.lineTo(fx + 7, fy + 1);
  ctx.stroke();
  for (const [ex, ey] of [[fx - 5, fy], [fx + 7, fy + 1]]) {
    ctx.fillStyle = '#fff6f0';
    circle(ctx, ex, ey, 4);
    ctx.strokeStyle = '#120c20';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    if (live) {
      ctx.fillStyle = warn || charge ? '#ff6a3a' : '#2d2a3e';
      circle(ctx, ex + 1, ey + 0.5, 2.1);
      ctx.fillStyle = '#ffffff';
      circle(ctx, ex + 1.6, ey - 0.4, 0.7);
    } else {
      ctx.strokeStyle = '#2d2a3e';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ex - 1.8, ey - 1.8); ctx.lineTo(ex + 1.8, ey + 1.8);
      ctx.moveTo(ex + 1.8, ey - 1.8); ctx.lineTo(ex - 1.8, ey + 1.8);
      ctx.stroke();
    }
  }
  if (warn) {
    // cross little brows
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx - 9, fy - 7);
    ctx.lineTo(fx - 2, fy - 4);
    ctx.moveTo(fx + 11, fy - 6);
    ctx.lineTo(fx + 4, fy - 3);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,140,170,0.45)';
  ellipse(ctx, w * 0.26, -h * 0.5, 3.4, 2);
  // the big front claw: the armoured shield
  claw(ctx, w * 0.44, warn ? -h * 0.72 : -h * 0.52, 19, warn ? 1 : charge ? 0 : 0.2, warn ? -1.35 : charge ? 0.1 : -0.55, false, t);
  ctx.restore();
  return sil;
}

// A glossy obsidian pincer at (x, y): s = size, open 0..1, a = angle (0 = pointing forward)
function claw(ctx, x, y, s, open, a, back, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  const fill = back ? '#3a2e5a' : '#5a4892', line = '#1c1430';
  ctx.fillStyle = fill;
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  // upper (fixed) finger and the lower (moving) one
  const op = open * 0.55;
  ctx.save();
  ctx.rotate(-op);
  ctx.beginPath();
  ctx.moveTo(s * 0.2, -s * 0.4);
  ctx.quadraticCurveTo(s * 1.1, -s * 0.7, s * 1.25, -s * 0.05);
  ctx.quadraticCurveTo(s * 0.8, -s * 0.12, s * 0.3, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.rotate(op);
  ctx.beginPath();
  ctx.moveTo(s * 0.3, s * 0.1);
  ctx.quadraticCurveTo(s * 0.8, s * 0.12, s * 1.1, s * 0.15);
  ctx.quadraticCurveTo(s * 0.9, s * 0.55, s * 0.2, s * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // the palm: a big round armour plate
  const g = ctx.createLinearGradient(0, -s * 0.6, 0, s * 0.6);
  g.addColorStop(0, back ? '#5a4880' : '#a490dc');
  g.addColorStop(1, fill);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.62, s * 0.55, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (!back) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ellipse(ctx, -s * 0.16, -s * 0.24, s * 0.24, s * 0.1, -0.3);
    ctx.strokeStyle = 'rgba(255,170,230,0.6)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.4, 0.3, 1.4);
    ctx.stroke();
    // a glint sliding across the shield
    const k = (t * 0.5) % 1;
    ctx.fillStyle = `rgba(255,240,255,${Math.sin(k * Math.PI) * 0.9})`;
    star4(ctx, -s * 0.3 + k * s * 0.6, -s * 0.1, 3);
  }
  ctx.restore();
}

// Cinder bat: a smouldering little bat with glowing ember wings; it hovers with its body just above
// the origin. m.warn: wings up, eyes blazing, about to dive · m.charging: diving, stretched and streaking.
function drawBat(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const warn = !!m.warn && live, dive = !!m.charging && live;
  const bob = dive ? 0 : Math.sin(t * 5 + seed * 3) * 3;
  const by = -h * 0.55 + bob;
  const rx = w * 0.27, ry = h * 0.48;
  let flap;
  if (dive) flap = 1.35;
  else if (warn) flap = 0.95 + Math.sin(t * 40) * 0.05;
  else flap = Math.sin(t * 13 + seed) * 0.55 + 0.1;
  const L = w * 0.62 * (dive ? 0.75 : 1);
  const frame = () => {
    if (dive) {
      ctx.translate(0, by);
      ctx.rotate(0.55);
      ctx.scale(1.22, 0.82);
      ctx.translate(0, -by);
    }
  };
  // one wing, as part of the current path (side ±1); flap > 0 raises it
  const wingPath = (side) => {
    ctx.save();
    ctx.translate(side * rx * 0.55, by - ry * 0.25);
    ctx.scale(side, 1);
    ctx.rotate(-flap);
    ctx.moveTo(0, -3);
    ctx.quadraticCurveTo(L * 0.45, -L * 0.42, L, -L * 0.28);
    ctx.quadraticCurveTo(L * 0.86, -L * 0.02, L * 0.78, L * 0.14);
    ctx.quadraticCurveTo(L * 0.66, L * 0.02, L * 0.52, L * 0.18);
    ctx.quadraticCurveTo(L * 0.38, L * 0.06, L * 0.24, L * 0.22);
    ctx.quadraticCurveTo(L * 0.12, L * 0.12, 0, ry * 0.7);
    ctx.closePath();
    ctx.restore();
  };
  const bodyPath = () => {
    ctx.moveTo(rx, by);
    ctx.ellipse(0, by, rx, ry, 0, 0, TAU);
  };
  const sil = () => {
    ctx.save();
    frame();
    ctx.beginPath();
    bodyPath();
    wingPath(-1);
    wingPath(1);
    ctx.restore();
  };
  // ember streak behind a dive
  if (dive) {
    for (let i = 6; i >= 1; i--) {
      const k = i / 6;
      ctx.fillStyle = `rgba(255,${Math.round(200 - 80 * k)},90,${0.55 * (1 - k * 0.7)})`;
      circle(ctx, -k * w * 1.3, by - k * w * 0.85 + Math.sin(t * 20 + i) * 2, ry * (1 - k * 0.6));
    }
  }
  softGlow(ctx, 0, by, w * (warn ? 1.1 : 0.8), '255,130,60', warn ? 0.6 : 0.3);
  ctx.save();
  frame();
  // wings: the far one darker, then the near one, membranes glowing like embers
  for (const side of [-1, 1]) {
    const g = ctx.createRadialGradient(side * rx * 0.5, by, 2, side * rx * 0.5, by, L * 1.1);
    g.addColorStop(0, '#5a3446');
    g.addColorStop(0.6, '#c0483a');
    g.addColorStop(1, '#ff9a4a');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#3a2232';
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    wingPath(side);
    ctx.fill();
    ctx.stroke();
    // finger bones
    ctx.save();
    ctx.translate(side * rx * 0.55, by - ry * 0.25);
    ctx.scale(side, 1);
    ctx.rotate(-flap);
    ctx.strokeStyle = 'rgba(58,34,50,0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const [fx, fy] of [[L * 0.78, L * 0.14], [L * 0.52, L * 0.18], [L * 0.24, L * 0.22]]) {
      ctx.moveTo(L * 0.2, -L * 0.15);
      ctx.lineTo(fx, fy);
    }
    ctx.stroke();
    // glowing ember edge along the top
    ctx.strokeStyle = `rgba(255,200,110,${warn ? 0.95 : 0.7})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(L * 0.1, -L * 0.12);
    ctx.quadraticCurveTo(L * 0.45, -L * 0.42, L, -L * 0.28);
    ctx.stroke();
    ctx.restore();
  }
  // ears
  ctx.fillStyle = '#3e2c40';
  ctx.strokeStyle = '#22162a';
  ctx.lineWidth = 1.5;
  for (const ex of [-rx * 0.45, rx * 0.55]) {
    ctx.beginPath();
    ctx.moveTo(ex - 5, by - ry * 0.7);
    ctx.lineTo(ex + 1, by - ry * 1.35);
    ctx.lineTo(ex + 5, by - ry * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff9a4a';
    ctx.beginPath();
    ctx.moveTo(ex - 2.5, by - ry * 0.72);
    ctx.lineTo(ex + 0.8, by - ry * 1.15);
    ctx.lineTo(ex + 2.8, by - ry * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3e2c40';
  }
  // the round sooty body with a glowing ember chest
  const bg = ctx.createLinearGradient(0, by - ry, 0, by + ry);
  bg.addColorStop(0, '#5a4660');
  bg.addColorStop(1, '#2e2236');
  ctx.fillStyle = bg;
  ctx.beginPath();
  bodyPath();
  ctx.fill();
  ctx.strokeStyle = '#1e1426';
  ctx.lineWidth = 2;
  ctx.stroke();
  const pulse = 0.7 + 0.3 * Math.sin(t * 4 + seed);
  ctx.fillStyle = `rgba(255,150,70,${0.75 * pulse})`;
  ellipse(ctx, rx * 0.15, by + ry * 0.42, rx * 0.55, ry * 0.36);
  ctx.fillStyle = `rgba(255,220,140,${0.7 * pulse})`;
  ellipse(ctx, rx * 0.15, by + ry * 0.45, rx * 0.28, ry * 0.18);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, -rx * 0.4, by - ry * 0.5, rx * 0.22, ry * 0.12, -0.5);
  // little feet dangling
  ctx.strokeStyle = '#2e2236';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, by + ry * 0.92);
  ctx.lineTo(-4, by + ry * 1.18);
  ctx.moveTo(4, by + ry * 0.92);
  ctx.lineTo(5, by + ry * 1.18);
  ctx.stroke();
  // face: sleepy-cute normally, blazing eyes when about to dive
  const fx = rx * 0.3, fy = by - ry * 0.12;
  face(ctx, fx, fy, 4.4, t, seed, { dying, size: 0.85, grumpy: warn || dive, glow: warn || dive ? '255,210,90' : null });
  if (live) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); // two tiny fangs
    for (const dx of [-2, 2]) {
      ctx.moveTo(fx + dx - 1.3, fy + 5);
      ctx.lineTo(fx + dx, fy + 7.6);
      ctx.lineTo(fx + dx + 1.3, fy + 5);
    }
    ctx.fill();
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(fx - 3.5, fy + 4.6);
    ctx.quadraticCurveTo(fx, fy + 6, fx + 3.5, fy + 4.6);
    ctx.stroke();
  }
  ctx.restore();
  // a couple of sparks falling off it
  for (let i = 0; i < 2; i++) {
    const k = (t * 0.8 + i * 0.5 + seed) % 1;
    ctx.fillStyle = `rgba(255,190,100,${(1 - k) * 0.9})`;
    circle(ctx, (i ? 6 : -8) + Math.sin(k * 6) * 3, by + ry + k * 26, 1.5);
  }
  return sil;
}

export const CALDERA_MOB_ART = { ember_imp: drawImp, magma_slug: drawSlug, obsidian_crab: drawCrab, cinder_bat: drawBat };
