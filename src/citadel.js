// Docs: docs/combat/stages.md
// The Aether Citadel (room 13): the fourth mob stage, a clockwork city floating in the clouds, up the
// skylift at the Caldera's east end (data in src/shared/rpg.js). Cogwork Bastion is brass towers, turning
// gears and puffing steam pipes under a bright sky; the Chrono Spire is floating crystal clock towers in a
// twilight teal-violet aether. This room draws its own sky (all 540 px). The den mouths (x 2280 and 4620)
// are drawn elsewhere, so the scenery leaves room round them. Also here: the skylift station that stands
// in the Caldera (drawSkylift) and the Citadel's mobs (CITADEL_MOB_ART, called by drawMob in field.js).
import { W, H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { CITADEL_W, CITADEL_EXIT_X, CITADEL_ZONES, CITADEL_PLATFORMS, CITADEL, CALDERA_W, FIELD_GROUND, DENS } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';

const GROUND = FIELD_GROUND;
const INK = '#4a3f6b';
const B = CITADEL_ZONES[1].x0; // bastion → spire
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const spireK = (x) => smooth(B - 350, B + 350, x); // 0 = bright brass bastion, 1 = twilight spire
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const DEN_XS = DENS.filter((d) => d.from === CITADEL).map((d) => d.entranceX);
const clearOfDens = (x, pad = 150) => DEN_XS.every((d) => Math.abs(x - d) > pad);
const SIGN_XS = [330, B + 170];
const clearOfSigns = (x, pad = 80) => SIGN_XS.every((s) => Math.abs(x - s) > pad);

// brass and crystal palette
const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const VERDI = '#8fd4c4', VERDI_D = '#5fae9e';
const AETHER = '#9ff0ea', AETHER_D = '#4fb4c4', VIOLET = '#c8b0ff', VIOLET_D = '#7a62c8';

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

// A gear outline: n flat-topped teeth of height th on a root circle of radius r, turned by a
function gearPath(ctx, x, y, r, n, th, a) {
  ctx.beginPath();
  const st = TAU / n;
  for (let i = 0; i < n; i++) {
    const a0 = a + i * st;
    const pts = [[a0 - st * 0.5, r], [a0 - st * 0.27, r], [a0 - st * 0.16, r + th], [a0 + st * 0.16, r + th], [a0 + st * 0.27, r]];
    for (const [aa, rr] of pts) ctx.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr);
  }
  ctx.closePath();
}

// A brass gear with spoke holes and a hub. c = { fill, edge, hole, hub }
function drawGear(ctx, x, y, r, n, a, c = {}) {
  const th = Math.max(3, r * 0.2);
  gearPath(ctx, x, y, r - th * 0.4, n, th, a);
  ctx.fillStyle = c.fill ?? BRASS;
  ctx.fill();
  ctx.strokeStyle = c.edge ?? BRASS_E;
  ctx.lineWidth = c.lw ?? Math.max(1.4, r * 0.05);
  ctx.lineJoin = 'round';
  ctx.stroke();
  // inner rim
  ctx.strokeStyle = c.rim ?? 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, TAU);
  ctx.stroke();
  // spoke holes
  ctx.fillStyle = c.hole ?? BRASS_D;
  const holes = r > 22 ? 6 : 4;
  for (let i = 0; i < holes; i++) {
    const ha = a + (i / holes) * TAU + 0.3;
    circle(ctx, x + Math.cos(ha) * r * 0.46, y + Math.sin(ha) * r * 0.46, r * (holes === 6 ? 0.13 : 0.16));
  }
  ctx.fillStyle = c.hub ?? BRASS_L;
  circle(ctx, x, y, r * 0.2);
  ctx.strokeStyle = c.edge ?? BRASS_E;
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();
}

// A clock face with moving hands (speed: hand turns per second, scaled)
function drawClock(ctx, x, y, r, time, { face = '#fff8e6', rim = BRASS, edge = BRASS_E, hand = INK, speed = 1, glow = 0 } = {}) {
  if (glow > 0) {
    const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 1.8);
    g.addColorStop(0, `rgba(190,255,250,${glow})`);
    g.addColorStop(1, 'rgba(190,255,250,0)');
    ctx.fillStyle = g;
    circle(ctx, x, y, r * 1.8);
  }
  ctx.fillStyle = rim;
  circle(ctx, x, y, r);
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(1.2, r * 0.08);
  ctx.stroke();
  ctx.fillStyle = face;
  circle(ctx, x, y, r * 0.8);
  ctx.strokeStyle = hand;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU, r0 = i % 3 ? r * 0.66 : r * 0.56;
    ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
    ctx.lineTo(x + Math.cos(a) * r * 0.74, y + Math.sin(a) * r * 0.74);
  }
  ctx.stroke();
  const ha = time * 0.07 * speed - Math.PI / 2, ma = time * 0.8 * speed - Math.PI / 2;
  ctx.lineWidth = Math.max(1.4, r * 0.1);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(ha) * r * 0.4, y + Math.sin(ha) * r * 0.4);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, r * 0.065);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(ma) * r * 0.62, y + Math.sin(ma) * r * 0.62);
  ctx.stroke();
  ctx.fillStyle = rim;
  circle(ctx, x, y, Math.max(1.5, r * 0.09));
}

// Puffs of steam rising from (x, y)
function steam(ctx, x, y, time, ph, s = 1, a = 1) {
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.42 + ph + i / 4) % 1;
    ctx.fillStyle = `rgba(255,255,255,${(1 - k) * 0.75 * a})`;
    circle(ctx, x + Math.sin(k * 5 + ph * 7) * 5 * s + k * 12 * s, y - 4 * s - k * 58 * s, (4 + k * 12) * s);
  }
}

// ——— seeded scenery ———

const TILE = 1600;
const skyStars = (() => {
  const r = mulberry32(301);
  return Array.from({ length: 100 }, () => ({ x: r() * W, y: r() * 330, s: 0.6 + r() * 1.2, p: r() * TAU, big: r() < 0.12 }));
})();
const skyClouds = (() => {
  const r = mulberry32(303);
  return Array.from({ length: 7 }, () => ({ x: r() * TILE, y: 50 + r() * 170, s: 0.6 + r() * 0.7, v: 4 + r() * 6 }));
})();
const farIslands = (() => {
  const r = mulberry32(307);
  return Array.from({ length: 6 }, (_, i) => ({
    x: ((i + 0.2 + r() * 0.6) * TILE) / 6, y: 250 + r() * 90, w: 90 + r() * 90,
    towers: Array.from({ length: 1 + Math.floor(r() * 3) }, () => ({ dx: (r() - 0.5) * 0.6, h: 40 + r() * 70, w: 14 + r() * 12 })),
    p: r() * TAU,
  }));
})();
const midTowers = (() => {
  const r = mulberry32(311);
  return Array.from({ length: 5 }, (_, i) => ({
    x: ((i + 0.15 + r() * 0.7) * TILE) / 5, h: 170 + r() * 120, w: 54 + r() * 34,
    gear: r() < 0.7 ? (r() < 0.5 ? -1 : 1) : 0, pipe: r() < 0.6, ph: r(), win: 2 + Math.floor(r() * 3),
    lift: 60 + r() * 70, clockR: 16 + r() * 8, hue: r() < 0.5 ? 180 : 265,
  }));
})();
const cloudSea = (() => {
  const r = mulberry32(313);
  return Array.from({ length: 22 }, (_, i) => ({ x: (i * TILE) / 22 + r() * 40, y: 0 + r() * 22, r: 34 + r() * 30 }));
})();
const motes = (() => {
  const r = mulberry32(317);
  return Array.from({ length: 34 }, () => ({ x: r() * W, y: 60 + r() * 380, s: 1 + r() * 1.8, v: 6 + r() * 12, p: r() * TAU }));
})();
// world props along the walkway
const props = (() => {
  const r = mulberry32(331);
  const out = [];
  for (let x = 420; x < CITADEL_W - 160; x += 150 + r() * 170) {
    if (!clearOfDens(x, 175) || !clearOfSigns(x, 90)) continue;
    const k = r();
    const underPlat = CITADEL_PLATFORMS.some((p) => x > p.x - 40 && x < p.x + p.w + 40);
    if (x < B - 60) out.push(k < 0.4 && !underPlat ? { type: 'pipe', x, h: 80 + r() * 50, ph: r(), side: r() < 0.5 ? -1 : 1 } : k < 0.75 ? { type: 'biggear', x, r: 50 + r() * 30, sp: (r() < 0.5 ? -1 : 1) * (0.25 + r() * 0.25) } : { type: 'crate', x, s: 0.8 + r() * 0.3 });
    else if (x > B + 60) out.push(k < 0.38 ? { type: 'pylon', x, s: 0.8 + r() * 0.5, hue: r() < 0.5 ? 175 : 265, p: r() * TAU } : k < 0.68 ? { type: 'hourglass', x, s: 0.8 + r() * 0.3, p: r() * TAU } : { type: 'shards', x, p: r() * TAU });
  }
  return out;
})();
const lamps = (() => {
  const out = [];
  for (let x = 300; x < CITADEL_W - 100; x += 420) if (clearOfDens(x, 140) && clearOfSigns(x, 70)) out.push(x);
  return out;
})();
const tufts = (() => {
  const r = mulberry32(337);
  return Array.from({ length: 30 }, (_, i) => ({ x: (i * W) / 30 + r() * 30, y: 512 + r() * 18, r: 16 + r() * 16 }));
})();
const platBits = CITADEL_PLATFORMS.map((p, i) => {
  const r = mulberry32(500 + i);
  return {
    gears: [
      { x: p.x + p.w * (0.3 + r() * 0.1), y: p.y + 28, r: 30 + r() * 8, n: 12, sp: 0.4 },
      { x: p.x + p.w * (0.68 + r() * 0.1), y: p.y + 22, r: 20 + r() * 5, n: 9, sp: -0.6 },
    ],
    gems: Array.from({ length: 4 + Math.floor(r() * 3) }, () => ({ x: p.x + 20 + r() * (p.w - 40), len: 14 + r() * 24, hue: r() < 0.55 ? 178 : 268, a: (r() - 0.5) * 0.5 })),
    bits: Array.from({ length: 4 }, () => ({ x: p.x + r() * p.w, y: p.y + 40 + r() * 40, s: 2 + r() * 3, p: r() * TAU })),
  };
});

const gradCache = new WeakMap();
function cache(ctx) {
  let c = gradCache.get(ctx);
  if (!c) gradCache.set(ctx, (c = {}));
  return c;
}
function zoneGrad(ctx, key, a, b) {
  const c = cache(ctx);
  if (!c[key]) {
    const g = ctx.createLinearGradient(0, 0, CITADEL_W, 0);
    g.addColorStop(0, a);
    g.addColorStop((B - 300) / CITADEL_W, a);
    g.addColorStop((B + 300) / CITADEL_W, b);
    g.addColorStop(1, b);
    c[key] = g;
  }
  return c[key];
}

// Walk one parallax layer: for each copy of the tile on screen, call fn(screenX, item)
function eachTile(camX, f, items, pad, fn) {
  const off = ((camX * f) % TILE + TILE) % TILE;
  for (const tx of [-off, TILE - off]) for (const it of items) {
    const px = tx + it.x;
    if (px < -pad || px > W + pad) continue;
    fn(px, it);
  }
}

// ——— the room ———

export function drawCitadel(ctx, camX, viewW, time) {
  const k = spireK(camX + viewW / 2);
  ctx.save();
  ctx.save();
  ctx.translate(camX, 0); // sky and far layers in screen space
  drawSky(ctx, camX, time, k);
  ctx.restore();

  const L = camX - 80, R = camX + viewW + 80;
  for (const p of props) if (p.type === 'biggear' && visible(p.x - p.r - 10, p.x + p.r + 10, L, R)) drawBigGear(ctx, p, time);
  drawRail(ctx, Math.max(0, L), Math.min(CITADEL_W, R), time);
  for (const p of props) if (p.type !== 'biggear' && visible(p.x - 70, p.x + 70, L, R)) drawProp(ctx, p, time);
  for (const x of lamps) if (visible(x - 30, x + 30, L, R)) drawLamp(ctx, x, time);
  if (visible(CITADEL_W - 60, CITADEL_W + 30, L, R)) drawEastEdge(ctx, time);
  drawGround(ctx, Math.max(0, L), Math.min(CITADEL_W, R), time);
  CITADEL_ZONES.forEach((z, i) => {
    const sx = SIGN_XS[i];
    if (visible(sx - 90, sx + 90, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  if (visible(CITADEL_EXIT_X - 120, CITADEL_EXIT_X + 160, L, R)) drawExit(ctx, CITADEL_EXIT_X, time);
  CITADEL_PLATFORMS.forEach((p, i) => {
    if (!visible(p.x - 50, p.x + p.w + 50, L, R)) return;
    if (p.kind === 'gear') drawGearPlat(ctx, p, platBits[i], time);
    else drawAetherPlat(ctx, p, platBits[i], time);
  });
  // drifting motes (brass sparks / aether glints) and the cloud bank under the walkway, in screen space
  ctx.save();
  ctx.translate(camX, 0);
  drawMotes(ctx, camX, time, k);
  drawTufts(ctx, camX, time, k);
  ctx.restore();
  ctx.restore();
}

function drawSky(ctx, camX, time, k) {
  const c = cache(ctx);
  // the sky gradient only changes with k: rebuild it when k moves noticeably
  const kq = Math.round(k * 40) / 40;
  if (c.skyK !== kq) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mix('#72bdf2', '#241c56', kq));
    sky.addColorStop(0.5, mix('#b4e0ff', '#5446a2', kq));
    sky.addColorStop(0.78, mix('#e6f6ff', '#5fb8c8', kq));
    sky.addColorStop(1, mix('#fff4e4', '#8ae0d4', kq));
    c.sky = sky;
    c.skyK = kq;
  }
  ctx.fillStyle = c.sky;
  ctx.fillRect(0, 0, W, H);
  // the sun (bastion) and stars + aether ribbons (spire)
  if (k < 0.98) {
    const sx = 200, sy = 96;
    if (!c.sun) {
      const g = ctx.createRadialGradient(sx, sy, 16, sx, sy, 130);
      g.addColorStop(0, 'rgba(255,250,220,0.7)');
      g.addColorStop(1, 'rgba(255,250,220,0)');
      c.sun = g;
    }
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = c.sun;
    circle(ctx, sx, sy, 130);
    ctx.fillStyle = '#fffbe6';
    circle(ctx, sx, sy, 32);
    ctx.globalAlpha = 1;
  }
  if (k > 0.02) {
    for (const s of skyStars) {
      const tw = 0.5 + 0.5 * Math.sin(time * 2 + s.p);
      const x = (((s.x - camX * 0.02) % W) + W) % W;
      ctx.fillStyle = `rgba(255,250,235,${k * (0.35 + 0.65 * tw)})`;
      if (s.big) star4(ctx, x, s.y, 3 + tw * 1.4);
      else circle(ctx, x, s.y, s.s * 0.8);
    }
    ctx.globalAlpha = 0.24 * k;
    for (const [col, off, y0] of [['#8ffff0', 0, 150], ['#d4a8ff', 2, 185], ['#9fd0ff', 4, 120]]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 40) {
        const y = y0 + Math.sin(x * 0.005 + time * 0.25 + off) * 34 + Math.sin(x * 0.012 - time * 0.18) * 10;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      for (let x = W; x >= 0; x -= 40) ctx.lineTo(x, y0 + 30 + Math.sin(x * 0.005 + time * 0.25 + off + 0.7) * 34);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // a vast, faint clock face hanging in the aether
    const cx = W - 220 - ((camX * 0.015) % 200), cy = 128;
    ctx.globalAlpha = 0.22 * k;
    drawClock(ctx, cx, cy, 82, time, { face: '#dcd0ff', rim: '#b8f0ec', edge: '#8a7ad8', hand: '#6a5ab8', speed: 0.6 });
    ctx.globalAlpha = 1;
  }
  // soft high clouds drifting (bright by day, lilac at twilight)
  const cc = mix('#ffffff', '#a898e0', k), cs = mix('#e2eefc', '#7e70c4', k);
  for (const cl of skyClouds) {
    const x = ((((cl.x - camX * 0.05 + time * cl.v) % TILE) + TILE) % TILE) - 200;
    if (x < -160 || x > W + 160) continue;
    puffCloud(ctx, x, cl.y, cl.s, cc, cs, 0.85);
  }
  // far floating islands with tower silhouettes
  eachTile(camX, 0.1, farIslands, 140, (px, o) => {
    const kk = spireK(camX + px);
    const y = o.y + Math.sin(time * 0.4 + o.p) * 3;
    ctx.fillStyle = mix('#c6dcf2', '#55489a', kk);
    // towers: domed brass by day, pointed crystal spires at twilight
    for (const tw of o.towers) {
      const tx = px + tw.dx * o.w;
      ctx.beginPath();
      ctx.roundRect(tx - tw.w / 2, y - tw.h, tw.w, tw.h + 4, 3);
      ctx.fill();
      ctx.beginPath();
      if (kk < 0.5) {
        ctx.ellipse(tx, y - tw.h, tw.w * 0.62, tw.w * 0.62, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(tx - 1, y - tw.h - tw.w * 0.62 - 9, 2, 10);
      } else {
        ctx.moveTo(tx - tw.w * 0.62, y - tw.h + 2);
        ctx.lineTo(tx, y - tw.h - tw.w * 1.5);
        ctx.lineTo(tx + tw.w * 0.62, y - tw.h + 2);
        ctx.fill();
      }
    }
    ctx.beginPath(); // the island: a flat top and a rocky point underneath
    ctx.moveTo(px - o.w / 2, y);
    ctx.lineTo(px + o.w / 2, y);
    ctx.quadraticCurveTo(px + o.w * 0.3, y + 16, px + o.w * 0.08, y + o.w * 0.32);
    ctx.lineTo(px - o.w * 0.02, y + o.w * 0.42);
    ctx.quadraticCurveTo(px - o.w * 0.25, y + 18, px - o.w / 2, y);
    ctx.fill();
    // little cloud skirt
    ctx.fillStyle = mix('#ffffff', '#9a8ad8', kk);
    ctx.globalAlpha = 0.7;
    ellipse(ctx, px - o.w * 0.3, y + 4, 22, 7);
    ellipse(ctx, px + o.w * 0.35, y + 3, 18, 6);
    ctx.globalAlpha = 1;
  });
  // a far cloud sea along the horizon
  // the archipelago far below, half sunk in the cloud sea
  drawDistantIslands(ctx, { from: 'citadel', scroll: camX, roomW: CITADEL_W, time, horizon: 398, haze: mix('#e6f6ff', '#5fb8c8', k), fade: 0.5, scale: 0.5, night: k });
  drawCloudSea(ctx, camX, time, 0.05, 392, mix('#f4faff', '#9a8ad8', k), mix('#dde9f8', '#7a6cc0', k), 0.8);
  // mid layer: brass towers rising out of the clouds / crystal clock towers floating in the aether
  eachTile(camX, 0.25, midTowers, 120, (px, o) => {
    const kk = spireK(camX + px);
    if (kk < 0.98) {
      ctx.globalAlpha = 1 - kk;
      drawBastionTower(ctx, px, o, time);
    }
    if (kk > 0.02) {
      ctx.globalAlpha = kk;
      drawSpireTower(ctx, px, o, time);
    }
    ctx.globalAlpha = 1;
  });
  // nearer cloud sea in front of the tower bases: the city floats on it
  drawCloudSea(ctx, camX, time, 0.32, 438, mix('#ffffff', '#b2a2ea', k), mix('#e4eefb', '#8e80cc', k), 1);
  // haze where the clouds meet the walkway
  const hz = ctx.createLinearGradient(0, 360, 0, GROUND);
  hz.addColorStop(0, mix('#f4fbff', '#8ae0d4', k) + '00');
  hz.addColorStop(1, mix('#f4fbff', '#8ae0d4', k) + '66');
  ctx.fillStyle = hz;
  ctx.fillRect(0, 360, W, GROUND - 360);
}

function puffCloud(ctx, x, y, s, col, shade, a) {
  ctx.globalAlpha = a;
  ctx.fillStyle = shade;
  ellipse(ctx, x + 4 * s, y + 8 * s, 70 * s, 16 * s);
  ctx.fillStyle = col;
  ellipse(ctx, x, y + 4 * s, 66 * s, 15 * s);
  circle(ctx, x - 28 * s, y - 2 * s, 20 * s);
  circle(ctx, x + 4 * s, y - 10 * s, 26 * s);
  circle(ctx, x + 34 * s, y, 18 * s);
  ctx.globalAlpha = 1;
}

function drawCloudSea(ctx, camX, time, f, y, col, shade, a) {
  const off = (((camX * f - time * 6) % TILE) + TILE) % TILE;
  ctx.globalAlpha = a;
  for (const pass of [0, 1]) {
    ctx.fillStyle = pass ? col : shade;
    ctx.beginPath();
    for (const tx of [-off, TILE - off]) for (const c of cloudSea) {
      const x = tx + c.x;
      if (x < -c.r - 10 || x > W + c.r + 10) continue;
      const cy = y + c.y + (pass ? 0 : 7) + Math.sin(time * 0.5 + c.x) * 2;
      ctx.moveTo(x + c.r, cy);
      ctx.arc(x, cy, c.r, 0, TAU);
    }
    ctx.rect(0, y + 20 + (pass ? 0 : 7), W, H - y);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// A brass tower rising out of the cloud sea: banded stone, lit windows, a verdigris dome, a side gear
function drawBastionTower(ctx, px, o, time) {
  const top = 450 - o.h, w = o.w;
  // side gear (behind)
  if (o.gear) drawGear(ctx, px + o.gear * w * 0.52, top + o.h * 0.35, w * 0.42, 10, time * 0.3 * o.gear, { fill: '#e2bd7c', edge: '#b08a56', hole: '#c8a068', hub: '#f2dcaa', rim: 'rgba(255,255,255,0.25)' });
  ctx.fillStyle = '#e8d2ac';
  ctx.beginPath();
  ctx.roundRect(px - w / 2, top, w, o.h + 20, [8, 8, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#d6bc92';
  ctx.fillRect(px + w * 0.18, top + 6, w * 0.32, o.h + 14);
  // brass bands
  ctx.fillStyle = '#e0b46c';
  for (let y = top + 18; y < 440; y += 46) ctx.fillRect(px - w / 2 - 3, y, w + 6, 6);
  // windows
  ctx.fillStyle = '#fff2c4';
  for (let i = 0; i < o.win; i++) {
    const wy = top + 32 + i * 46;
    if (wy > 420) break;
    ctx.beginPath();
    ctx.roundRect(px - 7, wy, 14, 20, [7, 7, 2, 2]);
    ctx.fill();
  }
  // dome with a spire and a little pennant
  ctx.fillStyle = '#9fd8c8';
  ctx.beginPath();
  ctx.ellipse(px, top + 2, w * 0.56, w * 0.5, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#80c0b0';
  ctx.beginPath();
  ctx.ellipse(px + w * 0.12, top + 2, w * 0.36, w * 0.46, 0, -Math.PI / 2, 0);
  ctx.lineTo(px + w * 0.12, top + 2);
  ctx.fill();
  ctx.fillStyle = '#e0b46c';
  ctx.fillRect(px - w * 0.6, top - 1, w * 1.2, 5);
  ctx.fillRect(px - 1.5, top - w * 0.5 - 20, 3, 22);
  ctx.fillStyle = '#ff9eb0';
  ctx.beginPath();
  const wave = Math.sin(time * 3 + o.ph * 9) * 3;
  ctx.moveTo(px + 1.5, top - w * 0.5 - 20);
  ctx.quadraticCurveTo(px + 10, top - w * 0.5 - 18 + wave, px + 18, top - w * 0.5 - 16 + wave);
  ctx.lineTo(px + 1.5, top - w * 0.5 - 10);
  ctx.fill();
  // a pipe out of the side, puffing steam
  if (o.pipe) {
    const side = o.gear ? -o.gear : 1, py = top + o.h * 0.55;
    ctx.strokeStyle = '#d0a060';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px + side * w * 0.45, py);
    ctx.lineTo(px + side * (w * 0.5 + 16), py);
    ctx.lineTo(px + side * (w * 0.5 + 16), py - 26);
    ctx.stroke();
    steam(ctx, px + side * (w * 0.5 + 16), py - 26, time, o.ph, 0.7, 0.8);
  }
}

// A crystal clock tower floating on its own little island, bobbing in the aether
function drawSpireTower(ctx, px, o, time) {
  const bob = Math.sin(time * 0.6 + o.ph * 7) * 6;
  const base = 450 - o.lift + bob, th = o.h * 0.7, w = o.w * 0.78, top = base - th;
  const hue = o.hue;
  // aura
  const gl = ctx.createRadialGradient(px, top + 20, 4, px, top + 20, w * 1.6);
  gl.addColorStop(0, `hsla(${hue} 90% 85% / 0.35)`);
  gl.addColorStop(1, `hsla(${hue} 90% 85% / 0)`);
  ctx.fillStyle = gl;
  circle(ctx, px, top + 20, w * 1.6);
  // island underneath
  ctx.fillStyle = '#6a5aa8';
  ctx.beginPath();
  ctx.moveTo(px - w * 0.95, base);
  ctx.lineTo(px + w * 0.95, base);
  ctx.quadraticCurveTo(px + w * 0.6, base + 24, px + w * 0.1, base + w * 0.9);
  ctx.quadraticCurveTo(px - w * 0.5, base + 26, px - w * 0.95, base);
  ctx.fill();
  ctx.fillStyle = `hsl(${hue} 70% 82%)`; // crystals hanging under it
  for (const [dx, len] of [[-0.4, 20], [0.15, 30], [0.5, 16]]) {
    ctx.beginPath();
    ctx.moveTo(px + dx * w - 5, base + 10);
    ctx.lineTo(px + dx * w, base + 10 + len);
    ctx.lineTo(px + dx * w + 5, base + 10);
    ctx.fill();
  }
  ctx.fillStyle = '#9a8ad8';
  ctx.fillRect(px - w * 0.95, base - 4, w * 1.9, 6);
  // tower body: pale lilac stone, a crystal seam
  ctx.fillStyle = '#b4a6e6';
  ctx.beginPath();
  ctx.roundRect(px - w / 2, top, w, th, [4, 4, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#9a8ad4';
  ctx.fillRect(px + w * 0.15, top + 4, w * 0.35, th - 4);
  ctx.fillStyle = `hsla(${hue} 90% 85% / ${0.6 + 0.3 * Math.sin(time * 2 + o.ph * 5)})`;
  for (let y = top + o.clockR * 2 + 26; y < base - 16; y += 30) {
    ctx.beginPath();
    ctx.roundRect(px - 4, y, 8, 16, 4);
    ctx.fill();
  }
  // clock face
  drawClock(ctx, px, top + o.clockR + 8, o.clockR, time + o.ph * 40, { face: '#f4f0ff', rim: '#e4d4a0', edge: '#8a76c0', hand: '#4a3f8a', speed: 1.5, glow: 0.35 });
  // crystal roof
  const cg = ctx.createLinearGradient(px - w, 0, px + w, 0);
  cg.addColorStop(0, `hsl(${hue} 90% 90%)`);
  cg.addColorStop(1, `hsl(${hue} 55% 68%)`);
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(px - w * 0.66, top + 2);
  ctx.lineTo(px, top - w * 1.5);
  ctx.lineTo(px + w * 0.66, top + 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px - w * 0.2, top - 2);
  ctx.lineTo(px - 2, top - w * 1.3);
  ctx.stroke();
  // orbiting shards
  for (let i = 0; i < 2; i++) {
    const a = time * 0.7 + i * Math.PI + o.ph * 6;
    ctx.fillStyle = `hsl(${hue + 40 * i} 80% 85%)`;
    star4(ctx, px + Math.cos(a) * w * 1.1, top + th * 0.4 + Math.sin(a) * 10, 4 + Math.sin(a) * 1.5);
  }
}

function drawMotes(ctx, camX, time, k) {
  for (const m of motes) {
    const y = ((m.y - time * m.v) % 400 + 400) % 400 + 60;
    const x = (((m.x - camX * 0.4 + Math.sin(time * 0.7 + m.p) * 12) % W) + W) % W;
    const tw = 0.5 + 0.5 * Math.sin(time * 3 + m.p);
    if (k < 0.98) {
      ctx.fillStyle = `rgba(255,236,170,${(1 - k) * 0.5 * tw})`;
      circle(ctx, x, y, m.s * 0.8);
    }
    if (k > 0.02) {
      ctx.fillStyle = `rgba(190,255,248,${k * (0.35 + 0.5 * tw)})`;
      star4(ctx, x, y, m.s * 1.8);
    }
  }
}

// a soft bank of cloud drifting along under the front of the walkway
function drawTufts(ctx, camX, time, k) {
  const col = mix('#ffffff', '#c4b8f0', k);
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  for (const t of tufts) {
    const x = (((t.x - camX * 1.15 + time * 10) % W) + W) % W;
    for (const xx of [x, x - W, x + W]) {
      if (xx < -t.r || xx > W + t.r) continue;
      ctx.moveTo(xx + t.r, t.y);
      ctx.arc(xx, t.y, t.r, 0, TAU);
    }
  }
  ctx.rect(0, 528, W, 20);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ——— walkway ———

function drawGround(ctx, L, R, time) {
  const y = GROUND;
  // stone deck
  ctx.fillStyle = zoneGrad(ctx, 'stone', '#efe2cc', '#9a8ccc');
  ctx.fillRect(L, y + 12, R - L, H - y);
  ctx.fillStyle = zoneGrad(ctx, 'stoneDark', '#e0cfb4', '#8576bc');
  ctx.fillRect(L, y + 44, R - L, H - y);
  // tile joints
  ctx.strokeStyle = zoneGrad(ctx, 'joint', '#cbb594', '#6f60a8');
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const ry of [y + 44, y + 74]) {
    ctx.moveTo(L, ry);
    ctx.lineTo(R, ry);
  }
  const x0 = Math.floor(L / 64) * 64;
  for (let x = x0; x < R; x += 64) {
    ctx.moveTo(x, y + 14);
    ctx.lineTo(x, y + 44);
    ctx.moveTo(x + 32, y + 44);
    ctx.lineTo(x + 32, y + 74);
  }
  ctx.stroke();
  // brass trim along the top with rivets
  ctx.fillStyle = zoneGrad(ctx, 'trimD', BRASS_D, '#7a62c8');
  ctx.beginPath();
  ctx.roundRect(L - 4, y - 2, R - L + 8, 16, 4);
  ctx.fill();
  ctx.fillStyle = zoneGrad(ctx, 'trim', BRASS, '#c0b0f4');
  ctx.beginPath();
  ctx.roundRect(L - 4, y - 3, R - L + 8, 10, 4);
  ctx.fill();
  ctx.fillStyle = zoneGrad(ctx, 'trimL', BRASS_L, '#ece4ff');
  ctx.fillRect(L - 4, y - 2, R - L + 8, 2.5);
  ctx.fillStyle = zoneGrad(ctx, 'rivet', '#a87038', '#5e4ca0');
  ctx.beginPath();
  for (let x = Math.floor(L / 40) * 40 + 20; x < R; x += 40) {
    ctx.moveTo(x + 2, y + 9.5);
    ctx.arc(x, y + 9.5, 2, 0, TAU);
  }
  ctx.fill();
  // in the spire, a glowing aether inlay runs along the deck
  if (R > B - 300) {
    const a0 = Math.max(L, B - 300);
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(time * 1.8);
    ctx.fillStyle = zoneGrad(ctx, 'inlay', 'rgba(159,240,234,0)', '#9ff0ea');
    ctx.fillRect(a0, y + 28, R - a0, 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = zoneGrad(ctx, 'inlayDot', 'rgba(255,255,255,0)', '#e8fffc');
    ctx.beginPath();
    for (let x = Math.floor(a0 / 128) * 128 + 64; x < R; x += 128) {
      ctx.moveTo(x, y + 22);
      ctx.lineTo(x + 6, y + 30);
      ctx.lineTo(x, y + 38);
      ctx.lineTo(x - 6, y + 30);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
  }
}

// A low brass (then crystal) railing along the back of the walkway
function drawRail(ctx, L, R, time) {
  const top = GROUND - 40;
  const gaps = [...DEN_XS.map((d) => [d - 125, d + 125]), [-100, CITADEL_EXIT_X + 120], [CITADEL_W - 50, CITADEL_W + 100]];
  const runs = [];
  let s = L;
  for (const [a, b] of gaps.sort((p, q) => p[0] - q[0])) {
    if (b < s || a > R) continue;
    if (a > s) runs.push([s, Math.min(a, R)]);
    s = Math.max(s, b);
  }
  if (s < R) runs.push([s, R]);
  ctx.strokeStyle = zoneGrad(ctx, 'railD', '#d4a462', '#8a7ad0');
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const [a, b] of runs) {
    for (let x = Math.ceil(a / 32) * 32; x <= b; x += 32) {
      ctx.moveTo(x, top + 6);
      ctx.lineTo(x, GROUND);
    }
    ctx.moveTo(a, top + 22);
    ctx.lineTo(b, top + 22);
  }
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeStyle = zoneGrad(ctx, 'rail', '#ecc27a', '#b4a4ec');
  ctx.beginPath();
  for (const [a, b] of runs) {
    ctx.moveTo(a, top + 4);
    ctx.lineTo(b, top + 4);
  }
  ctx.stroke();
  ctx.fillStyle = zoneGrad(ctx, 'railKnob', '#fde3a0', '#e4dcff');
  ctx.beginPath();
  for (const [a, b] of runs) for (let x = Math.ceil(a / 128) * 128; x <= b; x += 128) {
    ctx.moveTo(x + 5, top + 2);
    ctx.arc(x, top + 2, 5, 0, TAU);
  }
  ctx.fill();
  void time;
}

function drawLamp(ctx, x, time) {
  const k = spireK(x), base = GROUND;
  const glowC = k < 0.5 ? '255,226,150' : '170,255,245';
  const g = ctx.createRadialGradient(x, base - 96, 3, x, base - 96, 46);
  g.addColorStop(0, `rgba(${glowC},${0.45 + 0.1 * Math.sin(time * 3 + x)})`);
  g.addColorStop(1, `rgba(${glowC},0)`);
  ctx.fillStyle = g;
  circle(ctx, x, base - 96, 46);
  ctx.fillStyle = k < 0.5 ? BRASS_D : VIOLET_D;
  ctx.beginPath();
  ctx.roundRect(x - 3, base - 86, 6, 86, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x - 9, base - 6, 18, 8, 3);
  ctx.fill();
  ctx.fillStyle = k < 0.5 ? '#fff0c0' : '#d8fffa';
  circle(ctx, x, base - 96, 10);
  ctx.fillStyle = k < 0.5 ? BRASS : VIOLET;
  ctx.beginPath();
  ctx.ellipse(x, base - 104, 11, 6, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x - 8, base - 87, 16, 4);
}

// ——— world props ———

function drawBigGear(ctx, p, time) {
  // a huge gear half sunk behind the walkway, turning slowly
  drawGear(ctx, p.x, GROUND - 10, p.r, 14, time * p.sp, { fill: '#f2cf86', edge: '#b88446', hole: '#dcae66', hub: '#fde8b4' });
  if (p.r > 60) drawGear(ctx, p.x + p.r * 1.05, GROUND - p.r * 0.55, p.r * 0.42, 9, -time * p.sp * 2.4 + 0.2, { fill: '#e8b86a', edge: '#a8763e' });
}

function drawProp(ctx, p, time) {
  const base = GROUND;
  if (p.type === 'pipe') {
    // a steam pipe out of the walkway: up, an elbow, a vent cap puffing, a red valve wheel
    const top = base - p.h, sx = p.x + p.side * 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [col, lw] of [[BRASS_E, 17], ['#e8b86a', 13]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(p.x, base);
      ctx.lineTo(p.x, top + 14);
      ctx.quadraticCurveTo(p.x, top, sx, top);
      ctx.lineTo(sx, top - 6);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,240,200,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x - 3, base - 4);
    ctx.lineTo(p.x - 3, top + 16);
    ctx.stroke();
    ctx.fillStyle = BRASS_D; // flanges
    for (const fy of [base - 8, base - p.h * 0.55]) {
      ctx.beginPath();
      ctx.roundRect(p.x - 10, fy - 3, 20, 7, 3);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.roundRect(sx - 10, top - 14, 20, 9, 4);
    ctx.fill();
    // valve wheel
    const vy = base - p.h * 0.3;
    ctx.strokeStyle = '#f07a8a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, vy, 9, 0, TAU);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI + time * 0.2;
      ctx.moveTo(p.x + Math.cos(a) * 9, vy + Math.sin(a) * 9);
      ctx.lineTo(p.x - Math.cos(a) * 9, vy - Math.sin(a) * 9);
    }
    ctx.stroke();
    // a little pressure gauge
    ctx.fillStyle = '#fff8e6';
    circle(ctx, p.x, base - p.h * 0.75, 7);
    ctx.strokeStyle = BRASS_E;
    ctx.lineWidth = 2;
    ctx.stroke();
    const na = -Math.PI / 2 + Math.sin(time * 1.3 + p.ph * 9) * 0.9;
    ctx.beginPath();
    ctx.moveTo(p.x, base - p.h * 0.75);
    ctx.lineTo(p.x + Math.cos(na) * 5, base - p.h * 0.75 + Math.sin(na) * 5);
    ctx.strokeStyle = '#e05a6a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // puffs in bursts
    const burst = 0.5 + 0.5 * Math.sin(time * 0.9 + p.ph * TAU);
    steam(ctx, sx, top - 14, time, p.ph, 1, 0.4 + 0.6 * burst);
  } else if (p.type === 'crate') {
    // a little stack of brass crates with a gear stencil
    ctx.save();
    ctx.translate(p.x, base);
    ctx.scale(p.s, p.s);
    for (const [cx, cy, s] of [[-18, 0, 34], [18, 0, 30], [-4, -34, 28]]) {
      ctx.fillStyle = '#e6c08a';
      ctx.strokeStyle = '#a87a48';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(cx - s / 2, cy - s, s, s, 5);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(168,122,72,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - s / 2 + 4, cy - s + 4);
      ctx.lineTo(cx + s / 2 - 4, cy - 4);
      ctx.stroke();
      ctx.fillStyle = 'rgba(200,144,74,0.8)';
      gearPath(ctx, cx, cy - s / 2, s * 0.17, 8, s * 0.07, 0);
      ctx.fill();
    }
    ctx.restore();
  } else if (p.type === 'pylon') {
    // a crystal pylon with a floating ring of light around it
    ctx.save();
    ctx.translate(p.x, base);
    ctx.scale(p.s, p.s);
    const glow = 0.3 + 0.12 * Math.sin(time * 1.6 + p.p);
    const g = ctx.createRadialGradient(0, -46, 4, 0, -46, 80);
    g.addColorStop(0, `hsla(${p.hue} 90% 82% / ${glow})`);
    g.addColorStop(1, `hsla(${p.hue} 90% 82% / 0)`);
    ctx.fillStyle = g;
    circle(ctx, 0, -46, 80);
    ctx.fillStyle = '#8a7ac8';
    ctx.beginPath();
    ctx.roundRect(-20, -12, 40, 14, 5);
    ctx.fill();
    const fy = -14 + Math.sin(time * 1.4 + p.p) * 4;
    const cg = ctx.createLinearGradient(-12, 0, 12, 0);
    cg.addColorStop(0, `hsl(${p.hue} 90% 92%)`);
    cg.addColorStop(1, `hsl(${p.hue} 55% 68%)`);
    ctx.fillStyle = cg;
    ctx.strokeStyle = `hsl(${p.hue} 40% 48%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, fy - 8);
    ctx.lineTo(12, fy - 30);
    ctx.lineTo(0, fy - 86);
    ctx.lineTo(-12, fy - 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4, fy - 28);
    ctx.lineTo(0, fy - 76);
    ctx.stroke();
    // ring
    ctx.strokeStyle = `hsla(${p.hue} 90% 88% / 0.85)`;
    ctx.lineWidth = 2.5;
    const ry = fy - 40 + Math.sin(time * 1.1 + p.p) * 10;
    ctx.beginPath();
    ctx.ellipse(0, ry, 24, 6, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    const da = time * 2 + p.p;
    circle(ctx, Math.cos(da) * 24, ry + Math.sin(da) * 6, 2.4);
    ctx.restore();
  } else if (p.type === 'hourglass') {
    // a big hourglass on a pedestal, sand trickling and slowly turning over
    ctx.save();
    ctx.translate(p.x, base);
    ctx.scale(p.s, p.s);
    ctx.fillStyle = '#8a7ac8';
    ctx.beginPath();
    ctx.roundRect(-18, -22, 36, 22, 5);
    ctx.fill();
    ctx.fillStyle = '#a496dc';
    ctx.fillRect(-22, -26, 44, 6);
    const cyc = (time * 0.12 + p.p) % 1; // sand level, 0 → 1
    const flip = cyc > 0.92 ? (cyc - 0.92) / 0.08 : 0;
    ctx.translate(0, -62);
    ctx.rotate(flip * Math.PI);
    const sk = flip > 0 ? 1 : cyc / 0.92;
    ctx.fillStyle = 'rgba(220,240,255,0.5)';
    ctx.strokeStyle = '#c8a860';
    ctx.lineWidth = 2;
    const glass = () => {
      ctx.beginPath();
      ctx.moveTo(-15, -30);
      ctx.lineTo(15, -30);
      ctx.quadraticCurveTo(14, -10, 3, -2);
      ctx.lineTo(3, 2);
      ctx.quadraticCurveTo(14, 10, 15, 30);
      ctx.lineTo(-15, 30);
      ctx.quadraticCurveTo(-14, 10, -3, 2);
      ctx.lineTo(-3, -2);
      ctx.quadraticCurveTo(-14, -10, -15, -30);
      ctx.closePath();
    };
    glass();
    ctx.fill();
    ctx.save();
    glass();
    ctx.clip();
    ctx.fillStyle = '#ffd88a';
    const topH = 24 * (1 - sk), botH = 24 * sk;
    ctx.fillRect(-16, -2 - topH, 32, topH);
    ctx.beginPath();
    ctx.moveTo(-16, 30);
    ctx.lineTo(-16, 30 - botH * 0.6);
    ctx.quadraticCurveTo(0, 30 - botH * 1.4, 16, 30 - botH * 0.6);
    ctx.lineTo(16, 30);
    ctx.fill();
    if (sk < 1 && flip === 0) ctx.fillRect(-0.8, -2, 1.6, 32 - botH);
    ctx.restore();
    glass();
    ctx.stroke();
    ctx.fillStyle = '#e4c880';
    ctx.beginPath();
    ctx.roundRect(-19, -36, 38, 7, 3);
    ctx.roundRect(-19, 29, 38, 7, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ellipse(ctx, -8, -18, 2, 6, 0.4);
    ctx.restore();
  } else if (p.type === 'shards') {
    // three crystal shards hovering just over the deck
    for (let i = 0; i < 3; i++) {
      const x = p.x + (i - 1) * 24, y = base - 34 - (i % 2) * 22 + Math.sin(time * 1.5 + p.p + i * 2) * 6;
      const hue = i === 1 ? 268 : 178;
      ctx.fillStyle = `hsla(${hue} 80% 75% / 0.25)`;
      ellipse(ctx, x, base - 1, 9 - (y - base + 60) * 0.05, 2.5);
      ctx.fillStyle = `hsl(${hue} 85% 86%)`;
      ctx.strokeStyle = `hsl(${hue} 45% 52%)`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y - 16);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x, y + 12);
      ctx.lineTo(x - 7, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ellipse(ctx, x - 2, y - 4, 1.5, 4);
    }
  }
}

// The end of the city: a slim crystal clock pillar (kept east of the Hour Sanctum's mouth at x 4620)
function drawEastEdge(ctx, time) {
  const x = CITADEL_W, x0 = x - 44;
  ctx.fillStyle = '#7a6cc0';
  ctx.beginPath();
  ctx.roundRect(x0, 150, 60, GROUND - 140, [10, 0, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#6a5cb0';
  ctx.fillRect(x0 + 30, 150, 30, GROUND - 140);
  ctx.fillStyle = '#9a8ad8';
  for (let y = 200; y < GROUND; y += 56) ctx.fillRect(x0 - 3, y, 66, 5);
  const cg = ctx.createLinearGradient(x0 - 8, 0, x + 20, 0);
  cg.addColorStop(0, '#d4fffa');
  cg.addColorStop(1, '#7ac8d8');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(x0 - 8, 154);
  ctx.lineTo(x0 + 26, 40);
  ctx.lineTo(x + 24, 154);
  ctx.closePath();
  ctx.fill();
  drawClock(ctx, x0 + 24, 196, 20, time, { face: '#f4f0ff', rim: '#e4d4a0', edge: '#6a5aa8', hand: '#4a3f8a', speed: 2, glow: 0.4 });
  ctx.fillStyle = `rgba(190,255,248,${0.6 + 0.3 * Math.sin(time * 2)})`;
  for (let y = 250; y < GROUND - 40; y += 40) {
    ctx.beginPath();
    ctx.roundRect(x0 + 18, y, 10, 22, 5);
    ctx.fill();
  }
}

// ——— platforms ———

// A brass gear-ledge: a riveted deck plank with gears turning underneath it
function drawGearPlat(ctx, p, bits, time) {
  const { x, y, w } = p;
  for (const g of bits.gears) drawGear(ctx, g.x, g.y, g.r, g.n, time * g.sp, { fill: '#eab866', edge: BRASS_E, hole: '#c88e48' });
  // support struts
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 14);
  ctx.lineTo(x + 34, y + 34);
  ctx.moveTo(x + w - 16, y + 14);
  ctx.lineTo(x + w - 34, y + 34);
  ctx.stroke();
  // deck
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 2, w + 8, 20, 6);
  ctx.fill();
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 3, w + 8, 13, 6);
  ctx.fill();
  ctx.fillStyle = BRASS_L;
  ctx.fillRect(x + 2, y - 2, w - 4, 3);
  ctx.fillStyle = BRASS_E;
  ctx.beginPath();
  for (let rx = x + 12; rx < x + w - 4; rx += 26) {
    ctx.moveTo(rx + 2, y + 13);
    ctx.arc(rx, y + 13, 2, 0, TAU);
  }
  ctx.fill();
  // end caps: little gears bolted on each end
  for (const ex of [x - 2, x + w + 2]) drawGear(ctx, ex, y + 7, 11, 8, time * 0.8 * (ex > x ? -1 : 1), { fill: BRASS_L, edge: BRASS_E, hole: BRASS_D });
  // a tiny steam vent puffing off one end
  steam(ctx, x + w - 22, y - 2, time, (x % 97) / 97, 0.5, 0.6);
}

// A floating aether crystal slab: a flat top, a translucent faceted body, crystals hanging underneath
function drawAetherPlat(ctx, p, bits, time) {
  const { x, y, w } = p, th = 22;
  const gl = ctx.createRadialGradient(x + w / 2, y + 20, 10, x + w / 2, y + 20, w * 0.7);
  gl.addColorStop(0, `rgba(170,255,245,${0.28 + 0.08 * Math.sin(time * 1.5 + x)})`);
  gl.addColorStop(1, 'rgba(170,255,245,0)');
  ctx.fillStyle = gl;
  ellipse(ctx, x + w / 2, y + 20, w * 0.7, 60);
  for (const gm of bits.gems) {
    const sw = Math.sin(time * 1.2 + gm.x) * 0.04;
    ctx.save();
    ctx.translate(gm.x, y + th - 2);
    ctx.rotate(gm.a * 0.4 + sw);
    ctx.fillStyle = `hsl(${gm.hue} 85% 84%)`;
    ctx.strokeStyle = `hsl(${gm.hue} 45% 52%)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(0, gm.len);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `hsla(${gm.hue} 100% 94% / ${0.5 + 0.4 * Math.sin(time * 2 + gm.x)})`;
    circle(ctx, 0, gm.len - 2, 2.4);
    ctx.restore();
  }
  const g = ctx.createLinearGradient(0, y, 0, y + th + 10);
  g.addColorStop(0, '#e8fffc');
  g.addColorStop(0.5, '#a8e6ee');
  g.addColorStop(1, '#a490e6');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#6a7ad0';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - 12, y + th);
  ctx.lineTo(x + w * 0.62, y + th + 9);
  ctx.lineTo(x + w * 0.35, y + th + 5);
  ctx.lineTo(x + 10, y + th);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // facets
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let fx = x + 24; fx < x + w - 24; fx += 52) {
    ctx.moveTo(fx, y + 5);
    ctx.lineTo(fx + 14, y + th - 3);
  }
  ctx.stroke();
  // a glowing rune band and a bright top edge
  ctx.fillStyle = `rgba(255,255,255,${0.75 + 0.2 * Math.sin(time * 2.2 + x)})`;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 3, w + 4, 6, 3);
  ctx.fill();
  ctx.fillStyle = VIOLET;
  ctx.beginPath();
  ctx.roundRect(x - 2, y + 2, w + 4, 3, 1.5);
  ctx.fill();
  // little motes drifting under it
  for (const b of bits.bits) {
    const yy = b.y + Math.sin(time * 1.3 + b.p) * 8;
    ctx.fillStyle = `rgba(200,255,250,${0.5 + 0.4 * Math.sin(time * 3 + b.p)})`;
    star4(ctx, b.x, yy, b.s);
  }
}

// ——— signs and the skylift ———

function drawZoneSign(ctx, x, z, i, time) {
  const base = GROUND;
  const board = [BRASS_D, '#7a62c0'][i], edge = [BRASS_E, '#4a3a8a'][i];
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.roundRect(x - 4, base - 92, 8, 94, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, base - 70);
  ctx.rotate(Math.sin(time * 1.1 + i) * 0.02);
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 34);
  ctx.fillStyle = board;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -24, tw, 46, 10);
  ctx.fill();
  ctx.stroke();
  if (i === 0) {
    for (const sx of [-tw / 2, tw / 2]) drawGear(ctx, sx, -24, 9, 8, time * (sx > 0 ? 1 : -1), { fill: BRASS_L, edge: BRASS_E, hole: BRASS_D });
  } else {
    drawClock(ctx, tw / 2 - 4, -24, 10, time, { face: '#f4f0ff', rim: '#e4d4a0', edge: '#4a3a8a', hand: '#4a3f8a', speed: 4 });
    ctx.fillStyle = AETHER;
    star4(ctx, -tw / 2 + 4, -24, 6 + Math.sin(time * 3) * 1.2);
  }
  text(ctx, z.name, 0, -9, 15, '#ffffff');
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.roundRect(-30, 2, 60, 15, 7.5);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 10, 11, edge);
  ctx.restore();
}

// A brass board with a label, an arrow and an optional sub line ("Lv 140+")
function liftSign(ctx, x, y, label, sub, dir, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 1.3 + x) * 0.02);
  ctx.font = "700 14px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = ctx.measureText(label).width + 46, hh = sub ? 42 : 28;
  ctx.fillStyle = '#fff8e8';
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, 0, tw, hh, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  for (const sx of [-tw / 2 + 7, tw / 2 - 7]) circle(ctx, sx, 7, 2);
  text(ctx, label, -8, 14, 14, INK);
  arrow(ctx, tw / 2 - 15, 14, dir < 0 ? Math.PI / 2 : -Math.PI / 2, 0.85, '#d08a3a');
  if (sub) {
    ctx.fillStyle = 'rgba(200,144,74,0.22)';
    ctx.beginPath();
    ctx.roundRect(-28, 25, 56, 13, 6.5);
    ctx.fill();
    text(ctx, sub, 0, 31.5, 10, BRASS_E);
  }
  ctx.restore();
  return tw;
}

// A skylift station: brass frame, a pulley wheel, a cable and a little cabin waiting at the platform.
// up = the cable goes up off the top of the screen (in the Caldera); otherwise it runs down below the deck.
function drawStation(ctx, x, base, time, up) {
  const fh = 196, top = base - fh;
  // the cable(s)
  ctx.strokeStyle = '#5a4a4a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (up) {
    ctx.moveTo(x - 12, top - 4);
    ctx.lineTo(x - 12, -10);
    ctx.moveTo(x + 12, top - 4);
    ctx.lineTo(x + 12, -10);
  } else {
    ctx.moveTo(x - 12, top - 4);
    ctx.lineTo(x - 12, base);
  }
  ctx.stroke();
  // little cable markers riding along it
  if (up) {
    ctx.fillStyle = '#7a6a6a';
    for (let i = 0; i < 4; i++) {
      const yy = ((time * 30 + i * 60) % 240);
      ctx.fillRect(x - 15, top - 4 - yy, 6, 3);
      ctx.fillRect(x + 9, -10 + yy, 6, 3);
    }
  }
  // frame posts and a roof beam
  for (const px of [x - 86, x + 86]) {
    ctx.fillStyle = BRASS_D;
    ctx.beginPath();
    ctx.roundRect(px - 8, top + 6, 16, fh - 6, 5);
    ctx.fill();
    ctx.fillStyle = BRASS;
    ctx.fillRect(px - 5, top + 8, 5, fh - 10);
    ctx.fillStyle = BRASS_E;
    for (let ry = top + 30; ry < base - 10; ry += 36) circle(ctx, px + 3, ry, 1.8);
  }
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 86, top + 40);
  ctx.lineTo(x - 50, top + 10);
  ctx.moveTo(x + 86, top + 40);
  ctx.lineTo(x + 50, top + 10);
  ctx.stroke();
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(x - 100, top - 2, 200, 16, 7);
  ctx.fill();
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.roundRect(x - 100, top - 3, 200, 9, 6);
  ctx.fill();
  // the pulley
  drawGear(ctx, x, top - 4, 20, 10, time * (up ? 1.4 : -1.4), { fill: BRASS_L, edge: BRASS_E, hole: BRASS_D });
  // the cabin, hovering gently on its hanger
  const cy = Math.sin(time * 1.6 + x) * 1.5;
  const cTop = base - 128 + cy;
  ctx.strokeStyle = '#6a5a5a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 12, top + 14);
  ctx.lineTo(x - 12, cTop - 6);
  ctx.lineTo(x, cTop - 2);
  ctx.stroke();
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.ellipse(x, cTop + 4, 46, 16, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#9fd8c8'; // verdigris roof
  ctx.beginPath();
  ctx.ellipse(x, cTop + 2, 42, 14, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = BRASS_L;
  circle(ctx, x, cTop - 12, 5);
  ctx.fillStyle = '#f6e4c0';
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 42, cTop + 2, 84, 96, [4, 4, 12, 12]);
  ctx.fill();
  ctx.stroke();
  // round windows either side of an open door
  for (const wx of [x - 26, x + 26]) {
    ctx.fillStyle = '#bfeaff';
    circle(ctx, wx, cTop + 30, 10);
    ctx.strokeStyle = BRASS_D;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ellipse(ctx, wx - 3, cTop + 27, 3, 4, 0.5);
  }
  ctx.fillStyle = up ? '#ffd9a0' : '#5a4a7a';
  ctx.beginPath();
  ctx.roundRect(x - 13, cTop + 22, 26, 76, [13, 13, 0, 0]);
  ctx.fill();
  if (up) {
    // warm light inside, a cool sky glow on top
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.roundRect(x - 8, cTop + 30, 16, 60, [8, 8, 0, 0]);
    ctx.fill();
  }
  ctx.fillStyle = BRASS;
  ctx.fillRect(x - 44, cTop + 56, 88, 5);
  // the landing plinth
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(x - 104, base - 12, 208, 16, 6);
  ctx.fill();
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.roundRect(x - 104, base - 13, 208, 8, 5);
  ctx.fill();
  ctx.fillStyle = BRASS_E;
  for (let rx = x - 92; rx <= x + 92; rx += 23) circle(ctx, rx, base - 2, 1.8);
}

// The way back down: the skylift landing at the west end of the Citadel
function drawExit(ctx, x, time) {
  const base = GROUND;
  drawStation(ctx, x + 30, base, time, false);
  ctx.font = "700 14px Fredoka, 'Trebuchet MS', sans-serif";
  const half = (ctx.measureText('Emberdeep').width + 46) / 2;
  liftSign(ctx, Math.max(x + 30, half + 10), base - 262, 'Emberdeep', null, -1, time);
}

// The skylift in the Caldera (door at CITADEL_DOOR_X): a brass station with its cable running up into
// the sky, a cool blue light falling down it, and wisps of cloud drifting down out of the sky.
export function drawSkylift(ctx, x, groundY, time) {
  ctx.save();
  const sx = Math.min(x, CALDERA_W - 108);
  // a shaft of cool sky light falling through the volcano's glow
  const g = ctx.createLinearGradient(0, 0, 0, groundY);
  g.addColorStop(0, 'rgba(200,236,255,0.5)');
  g.addColorStop(1, 'rgba(200,236,255,0.05)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(sx - 60, 0);
  ctx.lineTo(sx + 60, 0);
  ctx.lineTo(sx + 110, groundY);
  ctx.lineTo(sx - 110, groundY);
  ctx.closePath();
  ctx.fill();
  // little clouds drifting down the cable
  for (let i = 0; i < 6; i++) {
    const k = (time * 0.08 + i / 6) % 1;
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.75;
    ctx.fillStyle = '#ffffff';
    const cx = sx - 50 + ((i * 41) % 100), cy = k * (groundY - 220);
    ellipse(ctx, cx, cy, 16, 6);
    circle(ctx, cx - 4, cy - 4, 7);
    circle(ctx, cx + 6, cy - 3, 5);
  }
  ctx.globalAlpha = 1;
  drawStation(ctx, sx, groundY, time, true);
  // sparkle on the brass
  ctx.fillStyle = `rgba(255,250,220,${0.5 + 0.5 * Math.sin(time * 3)})`;
  star4(ctx, sx - 80, groundY - 180, 4);
  ctx.font = "700 14px Fredoka, 'Trebuchet MS', sans-serif";
  const half = (ctx.measureText('Aether Citadel').width + 46) / 2;
  liftSign(ctx, Math.min(sx, CALDERA_W - 10 - half), groundY - 266, 'Aether Citadel', 'Lv 140+', 1, time);
  ctx.restore();
}

// ——— mobs ———
// Each (ctx, w, h, t, seed, m, dying) => sil, called by drawMob in field.js: origin at the feet, +x = the
// way it faces, w/h already squashed. sil() begins a path tracing the body (for the hurt flash).

const warnK = (v) => (v === true ? 1 : clamp(+v || 0, 0, 1));

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, grumpy = false, color = '#2d2a3e' } = {}) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.4) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, blink ? 0.6 : 3.3 * size);
      if (!blink) {
        ctx.fillStyle = '#fff';
        ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
        ctx.fillStyle = color;
      }
    }
  }
  if (grumpy && dying < 0.05) {
    ctx.lineWidth = 2.2 * size;
    ctx.beginPath();
    ctx.moveTo(fx - gap - 3.5 * size, fy - 6 * size);
    ctx.lineTo(fx - gap + 3 * size, fy - 3.8 * size);
    ctx.moveTo(fx + gap + 3.5 * size, fy - 6 * size);
    ctx.lineTo(fx + gap - 3 * size, fy - 3.8 * size);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,140,170,0.5)';
  ellipse(ctx, fx - gap - 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
  ellipse(ctx, fx + gap + 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
}

function smile(ctx, x, y, r, open) {
  ctx.strokeStyle = '#2d2a3e';
  ctx.fillStyle = '#2d2a3e';
  ctx.lineWidth = 1.5;
  if (open) ellipse(ctx, x, y + 1, r * 0.7, r * 0.9);
  else {
    ctx.beginPath();
    ctx.arc(x, y, r, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
}

// rolling angle: turns with distance travelled (so it rolls with the ground), forward = clockwise
function rollAngle(m, t, r) {
  const f = m.facing < 0 ? -1 : 1;
  const d = m.x != null ? m.x : t * 60;
  return (d / r) * f;
}

// Cogling: a rolling brass gear with a round face plate that stays upright, and a springy antenna
function drawCogling(ctx, w, h, t, seed, m, dying) {
  const r = Math.min(w, h) * 0.5, cy = -h * 0.5;
  const a = rollAngle(m, t, r);
  const n = 10, th = r * 0.22, root = r - th;
  const body = () => gearPath(ctx, 0, cy, root, n, th, a);
  // speed lines behind it while rolling
  if (m.walking && dying < 0.05) {
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [dy, len] of [[-0.3, 12], [0.05, 18], [0.35, 10]]) {
      const o = ((t * 3 + dy * 7) % 1) * 4;
      ctx.moveTo(-r - 4 - o, cy + dy * h);
      ctx.lineTo(-r - 4 - len - o, cy + dy * h);
    }
    ctx.stroke();
    // a puff of dust at the wheel's foot
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    circle(ctx, -r * 0.7, -3, 4 + Math.sin(t * 20) * 1.2);
  }
  const g = ctx.createRadialGradient(-r * 0.3, cy - r * 0.35, 2, 0, cy, r);
  g.addColorStop(0, '#ffe8a8');
  g.addColorStop(1, '#e0a450');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // spoke holes turning with it, peeking round the face plate
  ctx.fillStyle = '#b8803e';
  for (let i = 0; i < 6; i++) {
    const ha = a + (i / 6) * TAU;
    circle(ctx, Math.cos(ha) * r * 0.62, cy + Math.sin(ha) * r * 0.62, r * 0.09);
  }
  // antenna on the (upright) face plate
  const sway = Math.sin(t * 9 + seed) * (m.walking ? 4 : 1.5);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, cy - r * 0.48);
  ctx.quadraticCurveTo(sway * 0.3 + 3, cy - r * 0.75, sway, cy - r * 1.1);
  ctx.stroke();
  ctx.fillStyle = m.angry ? '#ff7a8a' : '#9ff0ea';
  circle(ctx, sway, cy - r * 1.12, 3.4);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  circle(ctx, sway - 1, cy - r * 1.16, 1.1);
  // face plate
  ctx.fillStyle = '#fff2cc';
  circle(ctx, 0, cy, r * 0.5);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  const fx = r * 0.12, fy = cy - 1;
  eyes(ctx, fx, fy, 5, t, seed, { dying, size: 0.85, grumpy: !!m.angry });
  if (dying < 0.05) smile(ctx, fx, fy + 4, 2.2, m.walking && Math.sin(t * 4 + seed) > 0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(ctx, -r * 0.45, cy - r * 0.55, r * 0.12, r * 0.07, -0.6);
  return body;
}

// Cogbit: a tiny hopping gear with big eyes and a bolt on top
function drawCogbit(ctx, w, h, t, seed, m, dying) {
  const r = Math.min(w, h) * 0.5, cy = -h * 0.5;
  const air = Math.abs(m.vy ?? 0) > 1;
  const a = rollAngle(m, t, r) * 0.6 + (air ? t * 6 : 0);
  const th = r * 0.26, root = r - th;
  const body = () => gearPath(ctx, 0, cy, root, 8, th, a);
  ctx.fillStyle = '#f4cc78';
  body();
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // bolt on top
  ctx.fillStyle = '#c8c4d8';
  ctx.strokeStyle = '#7a7690';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-3, cy - r - 3, 6, 6, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff4d6';
  circle(ctx, 0, cy, r * 0.56);
  const fx = r * 0.14, fy = cy;
  eyes(ctx, fx, fy, 3.4, t, seed, { dying, size: 0.62 });
  if (dying < 0.05) smile(ctx, fx, fy + 2.8, 1.5, air);
  if (air && dying < 0.05) {
    ctx.fillStyle = '#fff3a8';
    star4(ctx, -r - 3, cy - r * 0.6, 2.6);
  }
  return body;
}

// Sentry drone: a round hovering brass drone with a crystal dome, a whirring rotor and one big lens eye
function drawSentry(ctx, w, h, t, seed, m, dying) {
  const bob = Math.sin(t * 3 + seed * 5) * 3;
  const r = Math.min(w * 0.44, h * 0.42), cy = -h * 0.5 + bob;
  const wk = m.warn ? 0.6 + 0.4 * warnK(m.warn) : 0;
  const firing = !!m.charging;
  const body = () => {
    ctx.beginPath();
    ctx.arc(0, cy, r, 0, TAU);
  };
  // thruster glow under it
  const fl = 0.7 + 0.3 * Math.sin(t * 30 + seed);
  const tg = ctx.createRadialGradient(0, cy + r + 4, 1, 0, cy + r + 4, 14);
  tg.addColorStop(0, `rgba(190,255,250,${0.8 * fl})`);
  tg.addColorStop(1, 'rgba(160,240,255,0)');
  ctx.fillStyle = tg;
  ellipse(ctx, 0, cy + r + 8, 9, 14 * fl);
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.moveTo(-7, cy + r - 4);
  ctx.lineTo(7, cy + r - 4);
  ctx.lineTo(5, cy + r + 5);
  ctx.lineTo(-5, cy + r + 5);
  ctx.closePath();
  ctx.fill();
  // rotor mast and blades
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(-1.5, cy - r - 12, 3, 12);
  const spin = Math.abs(Math.cos(t * 26 + seed));
  ctx.fillStyle = 'rgba(240,240,255,0.85)';
  ellipse(ctx, 0, cy - r - 12, 4 + 18 * spin, 2.6);
  ctx.fillStyle = 'rgba(240,240,255,0.25)';
  ellipse(ctx, 0, cy - r - 12, 22, 3.2);
  ctx.fillStyle = BRASS_L;
  circle(ctx, 0, cy - r - 12, 2.6);
  // tail fin
  ctx.fillStyle = BRASS_D;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, cy - r * 0.2);
  ctx.quadraticCurveTo(-r * 1.45, cy - r * 0.55, -r * 1.35, cy - r * 0.05);
  ctx.quadraticCurveTo(-r * 1.2, cy + r * 0.3, -r * 0.7, cy + r * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // body
  const g = ctx.createRadialGradient(-r * 0.35, cy - r * 0.4, 2, 0, cy, r);
  g.addColorStop(0, '#ffeab0');
  g.addColorStop(1, '#d89a4a');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  // crystal dome on top
  ctx.save();
  body();
  ctx.clip();
  const dg = ctx.createLinearGradient(0, cy - r, 0, cy - r * 0.2);
  dg.addColorStop(0, '#e8fffc');
  dg.addColorStop(1, '#8ad8e4');
  ctx.fillStyle = dg;
  ctx.beginPath();
  ctx.ellipse(-r * 0.1, cy - r * 0.35, r * 0.95, r * 0.7, 0, Math.PI, 0);
  ctx.fill();
  // equator band with rivets
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(-r, cy - r * 0.38, r * 2, r * 0.2);
  ctx.fillStyle = BRASS_L;
  for (let i = -3; i <= 3; i++) circle(ctx, i * r * 0.28, cy - r * 0.28, 1.4);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ellipse(ctx, -r * 0.45, cy - r * 0.62, r * 0.16, r * 0.08, -0.5);
  // the lens eye, facing forward
  const ex = r * 0.38, ey = cy + r * 0.12, er = r * 0.5;
  if (wk > 0 || firing) {
    const pulse = firing ? 1 : wk * (0.75 + 0.25 * Math.sin(t * 24));
    const eg = ctx.createRadialGradient(ex, ey, 2, ex, ey, er * 3.2);
    eg.addColorStop(0, `rgba(255,236,250,${0.9 * pulse})`);
    eg.addColorStop(0.4, `rgba(255,140,190,${0.45 * pulse})`);
    eg.addColorStop(1, 'rgba(255,120,180,0)');
    ctx.fillStyle = eg;
    circle(ctx, ex, ey, er * 3.2);
  }
  ctx.fillStyle = BRASS_D;
  circle(ctx, ex, ey, er + 3);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = '#2e2a52';
  circle(ctx, ex, ey, er);
  if (dying > 0.05) {
    ctx.strokeStyle = '#9ff0ea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey - 4); ctx.lineTo(ex + 4, ey + 4);
    ctx.moveTo(ex + 4, ey - 4); ctx.lineTo(ex - 4, ey + 4);
    ctx.stroke();
  } else {
    // iris: calm cyan, swelling to a hot pink-white while it charges
    const ir = er * (0.55 + 0.3 * wk + (firing ? 0.3 : 0));
    const ic = wk > 0 || firing ? mix('#9ff0ea', '#ffd0ec', firing ? 1 : wk) : '#9ff0ea';
    const ig = ctx.createRadialGradient(ex + 1, ey, 0.5, ex + 1, ey, ir);
    ig.addColorStop(0, '#ffffff');
    ig.addColorStop(0.45, ic);
    ig.addColorStop(1, wk > 0 || firing ? '#ff7ab0' : '#3ab4c8');
    ctx.fillStyle = ig;
    circle(ctx, ex + 1, ey, ir);
    ctx.fillStyle = '#ffffff';
    circle(ctx, ex - er * 0.3, ey - er * 0.35, er * 0.18);
    // little blush plates so it reads as a face
    ctx.fillStyle = 'rgba(255,140,170,0.45)';
    ellipse(ctx, ex - er - 3, ey + er * 0.7, 3, 1.8);
  }
  // charging sparks crackling round the lens
  if (wk > 0 && dying < 0.05) {
    const rr = mulberry32(Math.floor(t * 18) + Math.floor(seed * 1000));
    ctx.strokeStyle = '#fff3a8';
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = rr() * TAU, d0 = er + 4, d1 = er + 10 + rr() * 8 * wk;
      ctx.moveTo(ex + Math.cos(a) * d0, ey + Math.sin(a) * d0);
      const ma = a + (rr() - 0.5) * 0.6;
      ctx.lineTo(ex + Math.cos(ma) * (d0 + d1) / 2, ey + Math.sin(ma) * (d0 + d1) / 2);
      ctx.lineTo(ex + Math.cos(a) * d1, ey + Math.sin(a) * d1);
    }
    ctx.stroke();
  }
  return body;
}

// Aether knight: a little armoured knight of brass and sky-crystal, a crystal plume and a crystal blade
function drawKnight(ctx, w, h, t, seed, m, dying) {
  const a0 = ctx.globalAlpha;
  const special = !!m.special;
  const wk = m.warn ? 0.6 + 0.4 * warnK(m.warn) : 0;
  const step = m.walking ? Math.sin(t * 9 + seed) : 0;
  if (special) {
    // mid-teleport: thin, stretched, shimmering away
    const sh = 0.5 + 0.5 * Math.sin(t * 30);
    ctx.globalAlpha = a0 * (0.18 + 0.18 * sh);
    ctx.scale(0.75, 1.2);
  }
  const hr = w * 0.36, hy = -h * 0.7; // helmet
  const body = () => {
    ctx.beginPath();
    ctx.arc(0, hy, hr, 0, TAU);
    ctx.moveTo(w * 0.32, -h * 0.36);
    ctx.ellipse(0, -h * 0.34, w * 0.32, h * 0.24, 0, 0, TAU);
  };
  // cape behind
  const flap = Math.sin(t * 4 + seed) * 3 + (m.walking ? 4 : 0);
  ctx.fillStyle = '#9a7ae0';
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, -h * 0.55);
  ctx.quadraticCurveTo(-w * 0.55 - flap, -h * 0.35, -w * 0.5 - flap, -h * 0.06);
  ctx.quadraticCurveTo(-w * 0.3, -h * 0.12, -w * 0.08, -h * 0.1);
  ctx.closePath();
  ctx.fill();
  // boots
  ctx.fillStyle = BRASS_D;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.5;
  for (const [lx, ph] of [[-w * 0.15, 1], [w * 0.14, -1]]) {
    ctx.beginPath();
    ctx.roundRect(lx - 6 + ph * step * 2.5, -h * 0.14 - Math.max(0, ph * step) * 3, 12, h * 0.14, [3, 3, 4, 4]);
    ctx.fill();
    ctx.stroke();
  }
  // back arm with a small round buckler
  ctx.fillStyle = BRASS;
  circle(ctx, -w * 0.3, -h * 0.36, 8);
  ctx.strokeStyle = BRASS_E;
  ctx.stroke();
  ctx.fillStyle = AETHER;
  circle(ctx, -w * 0.3, -h * 0.36, 3);
  // torso: a brass breastplate with a crystal heart
  const g = ctx.createLinearGradient(0, -h * 0.58, 0, -h * 0.1);
  g.addColorStop(0, '#ffe2a0');
  g.addColorStop(1, '#d8984a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.34, w * 0.32, h * 0.24, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#c8a0ff';
  ctx.beginPath();
  ctx.moveTo(w * 0.06, -h * 0.42);
  ctx.lineTo(w * 0.13, -h * 0.34);
  ctx.lineTo(w * 0.06, -h * 0.25);
  ctx.lineTo(-w * 0.01, -h * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  circle(ctx, w * 0.05, -h * 0.37, 1.4);
  // crystal plume on the helmet
  for (const [ang, len, c] of [[-1.9, 16, '#c8b0ff'], [-1.55, 20, AETHER], [-1.2, 14, '#e8d8ff']]) {
    const bx = -w * 0.06, by = hy - hr * 0.85, ca = Math.cos(ang + Math.sin(t * 3 + seed) * 0.05), sa = Math.sin(ang);
    ctx.fillStyle = c;
    ctx.strokeStyle = '#6a7ad0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx - sa * 4, by + ca * 4);
    ctx.lineTo(bx + ca * len, by + sa * len);
    ctx.lineTo(bx + sa * 4, by - ca * 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // helmet
  const hg = ctx.createRadialGradient(-hr * 0.35, hy - hr * 0.4, 2, 0, hy, hr);
  hg.addColorStop(0, '#fff0c4');
  hg.addColorStop(1, '#dca452');
  ctx.fillStyle = hg;
  circle(ctx, 0, hy, hr);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  // a ridge down the middle
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, hy, hr * 0.98, -Math.PI * 0.62, -Math.PI * 0.38);
  ctx.stroke();
  // visor with glowing eyes
  const vx = hr * 0.25, vy = hy + 1;
  ctx.fillStyle = '#3a3266';
  ctx.beginPath();
  ctx.roundRect(vx - hr * 0.62, vy - 5.5, hr * 1.25, 11, 5.5);
  ctx.fill();
  if (dying > 0.05) {
    ctx.strokeStyle = AETHER;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const ex of [vx - 5, vx + 5]) {
      ctx.moveTo(ex - 2, vy - 2); ctx.lineTo(ex + 2, vy + 2);
      ctx.moveTo(ex + 2, vy - 2); ctx.lineTo(ex - 2, vy + 2);
    }
    ctx.stroke();
  } else {
    const blink = ((t + seed * 7) % 3.6) < 0.12;
    ctx.fillStyle = wk > 0 ? '#ffd0ec' : '#bffff8';
    for (const ex of [vx - 5, vx + 5]) ellipse(ctx, ex, vy, 2.2, blink ? 0.5 : wk > 0 ? 2 : 2.8);
    if (wk > 0) {
      ctx.strokeStyle = '#ffd0ec'; // determined brows
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(vx - 8, vy - 4.5); ctx.lineTo(vx - 3, vy - 2.5);
      ctx.moveTo(vx + 8, vy - 4.5); ctx.lineTo(vx + 3, vy - 2.5);
      ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(255,140,170,0.45)';
  ellipse(ctx, vx + 1, vy + 8, 3, 1.6);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ellipse(ctx, -hr * 0.45, hy - hr * 0.5, hr * 0.18, hr * 0.1, -0.6);
  // sword arm and the crystal blade: held forward, or raised high and glowing before a slash
  const sx = w * 0.3 + (wk > 0 ? 4 : 0), sy = -h * 0.36 + step - (wk > 0 ? 8 : 0);
  const ang = wk > 0 ? -1.62 - Math.sin(t * 14) * 0.05 * wk : -0.55 + step * 0.06;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(ang);
  const L = h * 0.62;
  if (wk > 0) {
    const bg = ctx.createLinearGradient(0, 0, L, 0);
    bg.addColorStop(0, 'rgba(190,255,250,0)');
    bg.addColorStop(1, `rgba(190,255,250,${0.6 * wk})`);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(L * 0.55, 0, L * 0.6, 10, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = BRASS_D; // grip and guard
  ctx.fillRect(-3, -2, 9, 4);
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.roundRect(5, -7, 4, 14, 2);
  ctx.fill();
  const cg = ctx.createLinearGradient(0, -4, 0, 4);
  cg.addColorStop(0, '#effffd');
  cg.addColorStop(1, '#7ad0e0');
  ctx.fillStyle = cg;
  ctx.strokeStyle = '#4a8ab8';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(9, -3.5);
  ctx.lineTo(L - 8, -3.5);
  ctx.lineTo(L, 0);
  ctx.lineTo(L - 8, 3.5);
  ctx.lineTo(9, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(11, -1);
  ctx.lineTo(L - 9, -1);
  ctx.stroke();
  if (wk > 0) {
    ctx.fillStyle = '#ffffff';
    star4(ctx, L, 0, 4 + 3 * Math.abs(Math.sin(t * 10)));
  }
  ctx.restore();
  // gauntlet
  ctx.fillStyle = BRASS;
  circle(ctx, sx, sy, 6);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // warning: a faint ring of crystal motes gathering round it
  if (wk > 0 && dying < 0.05) {
    for (let i = 0; i < 6; i++) {
      const a = t * 4 + (i / 6) * TAU;
      ctx.fillStyle = i % 2 ? '#bffff8' : '#e0d0ff';
      star4(ctx, Math.cos(a) * w * 0.85, -h * 0.4 + Math.sin(a) * h * 0.2, 3);
    }
  }
  if (special) {
    // sparkles left where it stood (drawn at full strength)
    ctx.globalAlpha = a0;
    for (let i = 0; i < 6; i++) {
      const k = (t * 1.6 + i / 6) % 1;
      ctx.fillStyle = `rgba(200,255,250,${Math.sin(k * Math.PI)})`;
      star4(ctx, Math.sin(i * 2.4 + seed) * w * 0.4, -k * h * 1.1, 3);
    }
  }
  ctx.globalAlpha = a0;
  return body;
}

// Chrono wraith: a ghostly hooded clock spirit with a clock face in its chest; it hovers
function drawWraith(ctx, w, h, t, seed, m, dying) {
  const a0 = ctx.globalAlpha;
  const special = !!m.special;
  const wk = m.warn ? 0.6 + 0.4 * warnK(m.warn) : 0;
  const bob = Math.sin(t * 2.2 + seed * 5) * 3;
  const top = -h + bob, bot = -2 + bob;
  const wave = (x) => Math.sin(t * 5 + x * 0.3 + seed) * 2.5;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.12, top);
    ctx.bezierCurveTo(w * 0.32, top - 2, w * 0.42, top + h * 0.22, w * 0.38, top + h * 0.42);
    ctx.quadraticCurveTo(w * 0.5, top + h * 0.75, w * 0.48, bot);
    // wavy hem, right to left
    const n = 4;
    for (let i = 0; i < n; i++) {
      const xa = w * 0.48 - ((i + 0.5) / n) * w * 0.96, xb = w * 0.48 - ((i + 1) / n) * w * 0.96;
      ctx.quadraticCurveTo(xa, bot - 9 + wave(xa), xb, bot + wave(xb) * 0.6);
    }
    ctx.quadraticCurveTo(-w * 0.52, top + h * 0.5, -w * 0.42, top + h * 0.3);
    // a hood tip trailing back
    ctx.quadraticCurveTo(-w * 0.62, top + h * 0.12 + wave(1), -w * 0.62, top - 2 + wave(2));
    ctx.quadraticCurveTo(-w * 0.4, top + 1, -w * 0.12, top);
    ctx.closePath();
  };
  if (special) {
    // phased out: a faint shimmering ghost with colour-split echoes
    const sh = Math.sin(t * 22 + seed);
    ctx.globalAlpha = a0 * 0.18;
    for (const [dx, c] of [[-3 + sh, '#9ff0ea'], [3 - sh, '#ffb0e0']]) {
      ctx.save();
      ctx.translate(dx, 0);
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      body();
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = a0 * (0.16 + 0.08 * sh);
  }
  // aura
  const gl = ctx.createRadialGradient(0, top + h * 0.45, 3, 0, top + h * 0.45, w * 1.1);
  gl.addColorStop(0, `rgba(190,170,255,${0.35 + 0.3 * wk})`);
  gl.addColorStop(1, 'rgba(190,170,255,0)');
  ctx.fillStyle = gl;
  circle(ctx, 0, top + h * 0.45, w * 1.1);
  // little floating sleeves
  ctx.fillStyle = 'rgba(214,204,255,0.9)';
  for (const [sx, ph] of [[w * 0.5, 0], [-w * 0.46, 2]]) ellipse(ctx, sx, top + h * 0.55 + Math.sin(t * 3 + ph) * 3, 6, 4.5, 0.4);
  const g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, 'rgba(236,230,255,0.95)');
  g.addColorStop(0.6, 'rgba(184,170,240,0.9)');
  g.addColorStop(1, 'rgba(140,220,230,0.55)');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = 'rgba(122,98,200,0.8)';
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // hood opening: a dark oval with two glowing eyes
  const fx = w * 0.12, fy = top + h * 0.24;
  ctx.fillStyle = '#3a2c6a';
  ellipse(ctx, fx, fy, w * 0.24, h * 0.13);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(fx, fy, w * 0.27, h * 0.155, 0, Math.PI * 1.05, Math.PI * 1.9);
  ctx.stroke();
  if (dying > 0.05) {
    ctx.strokeStyle = '#ffe48a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const ex of [fx - 4.5, fx + 4.5]) {
      ctx.moveTo(ex - 2, fy - 2); ctx.lineTo(ex + 2, fy + 2);
      ctx.moveTo(ex + 2, fy - 2); ctx.lineTo(ex - 2, fy + 2);
    }
    ctx.stroke();
  } else {
    const blink = ((t + seed * 7) % 4) < 0.12;
    ctx.fillStyle = wk > 0 ? '#fff6c8' : '#ffe48a';
    for (const ex of [fx - 4.5, fx + 4.5]) ellipse(ctx, ex, fy, 2.2, blink ? 0.5 : 3);
    ctx.fillStyle = 'rgba(255,170,200,0.45)';
    ellipse(ctx, fx - 8, fy + 4.5, 2.4, 1.4);
    ellipse(ctx, fx + 8, fy + 4.5, 2.4, 1.4);
  }
  // the clock in its chest, hands spinning (fast when it's about to pulse)
  drawClock(ctx, w * 0.05, top + h * 0.56, w * 0.21, t * (wk > 0 ? 6 : 1) + seed * 50, { face: '#fff8e6', rim: '#f0c86a', edge: '#a8783a', hand: '#4a3f8a', speed: 2.5, glow: wk * 0.7 });
  // orbiting golden ticks
  for (let i = 0; i < 3; i++) {
    const a = -t * 1.6 + (i / 3) * TAU + seed;
    ctx.fillStyle = i % 2 ? '#fff3a8' : '#bffff8';
    star4(ctx, Math.cos(a) * w * 0.75, top + h * 0.5 + Math.sin(a) * h * 0.25, 2.4);
  }
  if (wk > 0 && dying < 0.05) {
    ctx.strokeStyle = `rgba(200,180,255,${0.7 * wk})`;
    ctx.lineWidth = 2;
    const pr = w * (0.6 + ((t * 2) % 1) * 0.5);
    ctx.beginPath();
    ctx.arc(w * 0.05, top + h * 0.56, pr, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = a0;
  return body;
}

export const CITADEL_MOB_ART = {
  cogling: drawCogling,
  cogbit: drawCogbit,
  sentry: drawSentry,
  aether_knight: drawKnight,
  chrono_wraith: drawWraith,
};
