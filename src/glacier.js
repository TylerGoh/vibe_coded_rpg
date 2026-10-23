// Docs: docs/places/glacier.md
// The Rimeglass Glacier (room GLACIER, data in src/shared/rpg.js): a great river of blue ice above Starfall
// Summit, climbed from its snout. Cold and bright: white peaks all round, the fjord and the sea far down in
// the west, and the aurora hanging lower and brighter the higher you climb, toward the Aurora Heights (reached
// up the Icefall since F3: src/heights.js). The floor is packed snow over blue ice. West to east: the cut
// steps back down to the Summit (the way in), the Cutters' Camp (Ice-Cutter Eyvind's hut, the ice sledge,
// the waystone, the Rime Stone: src/ruins.js), the Snout (low seracs), the Crevasse Field (crevasses in the
// ice wall behind, a snow bridge, the mended ladder down into the Blue Halls: src/branch-gates.js) and the
// Icefall, a jumble of great blue towers, where Old Rimehorn walks. Ylva's Cairn, a little heap of stones
// with driftwood birds on it on the tallest serac over the Snout, is the hidden spot.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { GLACIER_W, GLACIER_EXIT_X, GLACIER_ZONES, GLACIER_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300;
const CREV_X = GLACIER_ZONES[2].x0, FALL_X = GLACIER_ZONES[3].x0;
const CAIRN = GLACIER_PLATFORMS.at(-1);
const HUT = GLACIER_PLATFORMS[0];
const ICE = '#a9d4ee', ICE_D = '#6fa8d0', ICE_L = '#d8eefa', ICE_LINE = '#3e6e94', SNOW = '#f7fbff', SNOW_S = '#d6e6f4';
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
// two ranges of white peaks behind the glacier, the near one higher toward the east (you're climbing)
const peaks = [0.06, 0.16].map((f, j) => {
  const r = mulberry32(3601 + j);
  return { f, span: 2400, pts: Array.from({ length: 25 }, (_, i) => [i * 100, (j ? 250 : 200) - (i % 2 ? 40 + r() * 70 : r() * 30)]) };
});
// the glacier's far surface, rising away behind the path: a band of blue-white with crevasse lines
const crevLines = (() => {
  const r = mulberry32(3611);
  return Array.from({ length: 40 }, () => ({ x: r() * 2600, y: 330 + r() * 60, w: 30 + r() * 90 }));
})();
// aurora ribbons, high up
const ribbons = [0, 1, 2].map((j) => {
  const r = mulberry32(3621 + j);
  return { y: 40 + j * 34, hue: [150, 175, 300][j], amp: 14 + r() * 12, len: 0.004 + r() * 0.003, v: 0.15 + r() * 0.2, p: r() * TAU };
});
// low seracs and ice towers standing behind the path (bigger and bluer in the Icefall), skipping the camp
const towers = (() => {
  const r = mulberry32(3631);
  const out = [];
  for (let x = 980; x < GLACIER_W - 200; x += 120 + r() * 220) {
    if (GLACIER_PLATFORMS.some((p) => x > p.x - 50 && x < p.x + p.w + 50)) continue;
    const fall = x > FALL_X;
    out.push({ x, w: 50 + r() * 60, h: (fall ? 120 : 60) + r() * (fall ? 120 : 70), lean: (r() - 0.5) * 0.12, cap: r() < 0.7 });
  }
  return out;
})();
// crevasses in the ice wall behind the Crevasse Field: dark blue slots
const slots = (() => {
  const r = mulberry32(3641);
  const out = [];
  for (let x = CREV_X + 60; x < FALL_X - 80; x += 160 + r() * 200) out.push({ x, w: 14 + r() * 16, h: 50 + r() * 50 });
  return out;
})();
// snow drifts along the edge of the path, and glints in the ice
const drifts = (() => {
  const r = mulberry32(3651);
  const out = [];
  for (let x = 0; x < GLACIER_W; x += 50 + r() * 90) out.push({ x, w: 40 + r() * 70, h: 5 + r() * 8 });
  return out;
})();
const glints = (() => {
  const r = mulberry32(3661);
  return Array.from({ length: Math.floor(GLACIER_W / 40) }, () => ({ x: r() * GLACIER_W, y: GROUND + 24 + r() * (H - GROUND - 30), p: r() * TAU }));
})();
const flakes = (() => {
  const r = mulberry32(3671);
  return Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, s: 1 + r() * 2, v: 24 + r() * 30, p: r() * TAU }));
})();
// cut ice blocks stacked at the camp
const BLOCKS = [[14, 0], [46, 0], [30, 1]]; // (east of the hut, before the sledge)

// the aurora gets stronger as you climb toward the Heights
const auroraAt = (x) => 0.35 + 0.65 * smooth(1200, GLACIER_W - 400, x);

// Everything behind the slimes. camX is the left edge of the view.
export function drawGlacier(ctx, camX, viewW, time) {
  const mid = camX + viewW / 2, aur = auroraAt(mid);
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time, aur, mid);
  drawPeaks(ctx, camX, time, mid);
  ctx.restore();

  const L = camX - 140, R = camX + viewW + 140;
  drawIceWall(ctx, L, R, time);
  for (const s of slots) if (visible(s.x - 30, s.x + 30, L, R)) drawSlot(ctx, s);
  for (const t of towers) if (visible(t.x - t.w, t.x + t.w, L, R)) drawTower(ctx, t, time);
  for (const p of GLACIER_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'serac') drawSerac(ctx, p, time);
    else if (p.kind === 'snowbridge') drawSnowBridge(ctx, p, time);
  }
  if (visible(CAIRN.x - 120, CAIRN.x + CAIRN.w + 80, L, R)) drawCairn(ctx, CAIRN, time);
  if (visible(HUT.x - 160, HUT.x + HUT.w + 220, L, R)) drawCamp(ctx, time);
  drawFloor(ctx, Math.max(0, L), Math.min(GLACIER_W, R), time);
  if (visible(GLACIER_EXIT_X - 120, GLACIER_EXIT_X + 160, L, R)) drawSteps(ctx, time);
  GLACIER_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 70;
    if (visible(sx - 80, sx + 80, L, R)) drawZonePole(ctx, sx, z, i, time);
  });
  if (visible(GLACIER_EXIT_X, GLACIER_EXIT_X + 260, L, R)) drawExitSign(ctx, GLACIER_EXIT_X + 100, time);
  ctx.save();
  ctx.translate(camX, 0);
  ctx.fillStyle = `rgba(150,230,210,${0.05 * aur})`; // the aurora's light on everything
  ctx.fillRect(0, 0, W, H);
  drawSnowfall(ctx, camX, time);
  ctx.restore();
}

// The sky: cold pale blue to lilac at the horizon, the aurora's ribbons high up (brighter to the east), the
// sea and the far islands far down past the glacier's foot in the west
function drawSky(ctx, camX, time, aur, mid) {
  ctx.fillStyle = vgrad(ctx, 'sky', 0, HORIZON, [[0, '#4e5e9a'], [1, '#d8d4ee']]);
  ctx.fillRect(0, 0, W, HORIZON);
  ctx.fillStyle = vgrad(ctx, 'sea', HORIZON, H, [[0, '#9cb4cc'], [1, '#6e8aa8']]);
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  drawDistantIslands(ctx, { from: 'frost', scroll: camX, roomW: GLACIER_W, time, horizon: HORIZON, haze: '#d8d4ee', fade: 0.6, scale: 0.5, sky: 200 });
  // stars, faint, a few in the wrong places (smeared)
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 40; i++) {
    const x = ((i * 157 - camX * 0.02) % W + W) % W, y = (i * 61) % 150 + 8;
    if (i % 9 === 0) ellipse(ctx, x, y, 3.5, 0.9, 0.4);
    else circle(ctx, x, y, i % 4 ? 0.8 : 1.3);
  }
  // the aurora: soft curtains that ripple
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const rb of ribbons) {
    for (let x = -20; x < W + 20; x += 12) {
      const wx = x + camX * 0.03;
      const y = rb.y + Math.sin(wx * rb.len * 6 + time * rb.v + rb.p) * rb.amp;
      const a = (0.06 + 0.05 * Math.sin(wx * 0.02 + time * 0.8 + rb.p)) * aur;
      ctx.fillStyle = `hsla(${rb.hue},80%,65%,${a})`;
      ctx.fillRect(x, y, 12, 70 + Math.sin(wx * 0.013 + rb.p) * 20);
    }
  }
  ctx.restore();
  // the Aurora Heights, up past the Icefall: a high white snowfield lit green underneath the aurora
  const hx = 1110 - camX * 0.12; // (a far layer: on screen from the Crevasse Field on, centred over the Icefall's top)
  const hk = smooth(2600, GLACIER_W - 600, mid);
  if (hk > 0.01) {
    ctx.globalAlpha = hk;
    glow(ctx, hx, 150, 260, 80, '150,240,200', 0.35);
    ctx.fillStyle = '#eef6fb';
    ctx.beginPath();
    ctx.moveTo(hx - 300, 210);
    ctx.quadraticCurveTo(hx - 140, 120, hx, 128);
    ctx.quadraticCurveTo(hx + 160, 118, hx + 320, 200);
    ctx.lineTo(hx + 320, 230);
    ctx.lineTo(hx - 300, 230);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(150,230,200,0.25)';
    ellipse(ctx, hx, 132, 110, 10);
    ctx.globalAlpha = 1;
  }
}

// Peaks all round, and the glacier's own far surface rising behind the path
function drawPeaks(ctx, camX, time, mid) {
  peaks.forEach(({ f, span, pts }, j) => {
    const off = -((camX * f) % span);
    for (const rep of [0, span]) {
      ctx.fillStyle = j ? '#e4ecf6' : '#cdd8ec';
      ctx.beginPath();
      ctx.moveTo(off + rep, H);
      for (const [x, y] of pts) ctx.lineTo(off + rep + x, y + j * 20);
      ctx.lineTo(off + rep + span, H);
      ctx.closePath();
      ctx.fill();
      // blue shadow on the east faces
      ctx.fillStyle = j ? 'rgba(120,150,200,0.28)' : 'rgba(110,130,190,0.3)';
      for (let i = 1; i < pts.length - 1; i += 2) {
        const [x, y] = pts[i];
        ctx.beginPath();
        ctx.moveTo(off + rep + x, y + j * 20);
        ctx.lineTo(off + rep + x + 50, pts[i + 1][1] + j * 20);
        ctx.lineTo(off + rep + x + 18, 330);
        ctx.closePath();
        ctx.fill();
      }
    }
  });
  // the glacier's back: a broad pale band of ice, crevassed
  const f = 0.3, span = 2600, off = -((camX * f) % span);
  ctx.fillStyle = '#e2eff8';
  ctx.fillRect(0, 318, W, H - 318);
  ctx.fillStyle = '#c4dcee';
  ctx.fillRect(0, 318, W, 6);
  ctx.strokeStyle = 'rgba(80,130,180,0.4)';
  ctx.lineWidth = 2;
  for (const rep of [0, span]) {
    for (const c of crevLines) {
      const x = off + rep + c.x;
      if (x < -c.w || x > W + 10) continue;
      ctx.beginPath();
      ctx.moveTo(x, c.y);
      ctx.quadraticCurveTo(x + c.w / 2, c.y + 3, x + c.w, c.y - 1);
      ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(230,240,252,0.25)'; // cold haze
  ctx.fillRect(0, 0, W, H);
}

// The nearer ice wall behind the path: blue ice with snow on top, rising a little toward the Icefall
function drawIceWall(ctx, L, R) {
  const top = (x) => 372 - smooth(FALL_X - 400, GLACIER_W, x) * 50 + Math.sin(x * 0.011) * 6;
  ctx.fillStyle = '#bcdcf0';
  ctx.beginPath();
  ctx.moveTo(L, GROUND);
  for (let x = Math.floor(L / 40) * 40; x <= R + 40; x += 40) ctx.lineTo(x, top(x));
  ctx.lineTo(R + 40, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  for (let x = Math.floor(L / 40) * 40; x <= R + 40; x += 40) ctx[x === Math.floor(L / 40) * 40 ? 'moveTo' : 'lineTo'](x, top(x) - 4);
  for (let x = Math.ceil(R / 40) * 40 + 40; x >= Math.floor(L / 40) * 40; x -= 40) ctx.lineTo(x, top(x) + 6 + Math.sin(x * 0.07) * 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,150,200,0.35)';
  ctx.lineWidth = 1.5;
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x + 20, top(x) + 16);
    ctx.lineTo(x + 34, GROUND - 6);
    ctx.stroke();
  }
}

// A crevasse slot in the wall behind: dark blue going black, a lip of snow overhanging it
function drawSlot(ctx, s) {
  const y = GROUND - 4;
  ctx.fillStyle = '#2e5a86';
  ctx.beginPath();
  ctx.moveTo(s.x - s.w / 2, y - s.h);
  ctx.lineTo(s.x + s.w / 2, y - s.h + 6);
  ctx.lineTo(s.x + s.w * 0.15, y);
  ctx.lineTo(s.x - s.w * 0.2, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a3656';
  ctx.fillRect(s.x - 3, y - s.h * 0.7, 5, s.h * 0.6);
  ctx.fillStyle = SNOW;
  ellipse(ctx, s.x, y - s.h - 2, s.w * 0.9, 5);
}

// A serac or ice tower standing behind the path (not a platform): blue faces, a lit side, a snow cap
function drawTower(ctx, t, time) {
  ctx.save();
  ctx.translate(t.x, GROUND + 2);
  ctx.rotate(t.lean);
  iceBlock(ctx, -t.w / 2, -t.h, t.w, t.h, 0.75);
  if (t.cap) {
    ctx.fillStyle = SNOW;
    ctx.beginPath();
    ctx.ellipse(0, -t.h, t.w * 0.56, 8, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
}

// A faceted block of blue ice with a lit left face, a shadowed right one and a few bubbles
function iceBlock(ctx, x, y, w, h, a = 1) {
  ctx.globalAlpha = a;
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 6);
  ctx.lineTo(x + w * 0.45, y);
  ctx.lineTo(x + w - 3, y + 8);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ICE_L;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 9);
  ctx.lineTo(x + w * 0.42, y + 4);
  ctx.lineTo(x + w * 0.3, y + h - 4);
  ctx.lineTo(x + 4, y + h - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = ICE_D;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.72, y + 5);
  ctx.lineTo(x + w - 4, y + 10);
  ctx.lineTo(x + w - 2, y + h - 3);
  ctx.lineTo(x + w * 0.66, y + h - 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 4; i++) circle(ctx, x + w * (0.3 + ((i * 37) % 40) / 100), y + h * (0.3 + i * 0.15), 1.4 + (i % 2));
  ctx.globalAlpha = 1;
}

// A serac you can stand on: a great block of ice set into the slope, flat-topped, deep snow on top
function drawSerac(ctx, p, time) {
  const { x, y, w } = p;
  iceBlock(ctx, x + 4, y + 4, w - 8, GROUND - y);
  ctx.fillStyle = SNOW;
  ctx.strokeStyle = SNOW_S;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 14, 7);
  ctx.fill();
  ctx.stroke();
  // snow drips and icicles hanging off the lip
  ctx.fillStyle = SNOW;
  for (let i = 0; i < w / 30; i++) ellipse(ctx, x + 14 + i * 30, y + 9, 8, 5);
  ctx.fillStyle = 'rgba(200,232,250,0.9)';
  for (let i = 0; i < w / 22; i++) {
    const ix = x + 10 + i * 22 + (i % 3) * 4, len = 8 + ((i * 7) % 12);
    ctx.beginPath();
    ctx.moveTo(ix - 3, y + 10);
    ctx.lineTo(ix + 3, y + 10);
    ctx.lineTo(ix, y + 10 + len);
    ctx.closePath();
    ctx.fill();
  }
}

// A snow bridge over a crevasse: an arch of old hard snow; under it the ice wall drops away into a blue slot
function drawSnowBridge(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = '#2e5a86';
  ctx.beginPath();
  ctx.moveTo(x + 20, GROUND);
  ctx.lineTo(x + 40, y + 40);
  ctx.lineTo(x + w - 40, y + 40);
  ctx.lineTo(x + w - 20, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e3e62';
  ctx.fillRect(x + w / 2 - 20, y + 60, 40, GROUND - y - 60);
  // the arch
  ctx.fillStyle = SNOW;
  ctx.strokeStyle = SNOW_S;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 6, GROUND);
  ctx.lineTo(x - 6, y + 2);
  ctx.quadraticCurveTo(x + w / 2, y - 8, x + w + 6, y + 2);
  ctx.lineTo(x + w + 6, GROUND);
  ctx.lineTo(x + w - 18, GROUND);
  ctx.quadraticCurveTo(x + w - 30, y + 40, x + w / 2, y + 36);
  ctx.quadraticCurveTo(x + 30, y + 40, x + 18, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,232,250,0.9)';
  for (let i = 0; i < 6; i++) {
    const ix = x + w / 2 - 50 + i * 20, iy = y + 36 + Math.abs(i - 2.5) * 1.5;
    ctx.beginPath();
    ctx.moveTo(ix - 3, iy);
    ctx.lineTo(ix + 3, iy);
    ctx.lineTo(ix, iy + 10 + (i % 3) * 5);
    ctx.closePath();
    ctx.fill();
  }
  // a cutters' marker wand stuck in it, a scrap of red cloth
  ctx.fillStyle = WOOD;
  ctx.fillRect(x + w - 30, y - 34, 3, 32);
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.moveTo(x + w - 27, y - 34);
  ctx.quadraticCurveTo(x + w - 16, y - 30 + Math.sin(time * 4) * 2, x + w - 10, y - 28 + Math.sin(time * 4 + 1) * 3);
  ctx.lineTo(x + w - 27, y - 24);
  ctx.closePath();
  ctx.fill();
}

// Ylva's Cairn: on the tallest serac, a pinnacle of ice with a little heap of grey stones on top, and the
// driftwood birds Skaldi carves, left there one a year, facing the sea. A faded blue ribbon.
function drawCairn(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  // the pinnacle rising from the serac below (its top is the platform)
  iceBlock(ctx, x + 6, y + 4, w - 12, 250 - y);
  ctx.fillStyle = SNOW;
  ctx.strokeStyle = SNOW_S;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 12, 6);
  ctx.fill();
  ctx.stroke();
  // the cairn
  ctx.fillStyle = '#8e8a9a';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.6;
  for (const [dx, dy, rx, ry] of [[-12, -8, 12, 7], [10, -8, 11, 7], [-1, -19, 11, 7], [0, -29, 8, 5], [1, -36, 5, 4]]) {
    ctx.beginPath();
    ctx.ellipse(cx + dx, y + dy, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = SNOW;
  for (const [dx, dy] of [[-12, -14], [10, -14], [0, -40]]) ellipse(ctx, cx + dx, y + dy, 7, 2.5);
  // the ribbon
  ctx.strokeStyle = '#7fa2c8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 6, y - 26);
  ctx.quadraticCurveTo(cx - 20, y - 22 + Math.sin(time * 3) * 3, cx - 30, y - 14 + Math.sin(time * 3 + 1) * 5);
  ctx.stroke();
  // driftwood birds, all facing west to the sea, some greyer (older) than others
  [[-30, -2, '#b49a7e'], [-20, -16, '#a08a72'], [18, -16, '#c4aa8a'], [28, -2, '#8e7e6e'], [2, -44, '#d2b896']].forEach(([dx, dy, c], i) => {
    ctx.save();
    ctx.translate(cx + dx, y + dy);
    ctx.scale(-1, 1);
    ctx.fillStyle = c;
    ctx.strokeStyle = WOOD_D;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-6, -6, 2, -5);
    ctx.lineTo(7, -8);
    ctx.lineTo(6, -3);
    ctx.quadraticCurveTo(6, 1, -2, 1);
    ctx.lineTo(-10, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = WOOD_D;
    circle(ctx, 4, -5.5, 0.9);
    ctx.restore();
  });
}

// The Cutters' Camp: Eyvind's hut (timber and turf, its roof a platform), a brazier by its door, stacked
// blocks of blue ice east of it, a sledge loaded with them west of it, and the long ice saw on the wall
function drawCamp(ctx, time) {
  const { x, y, w } = HUT, b = GROUND;
  // the brazier glow
  glow(ctx, x - 40, b - 30, 90, 60, '255,190,120', 0.5 + 0.08 * Math.sin(time * 7));
  // the hut: log walls, a turf roof heavy with snow
  ctx.fillStyle = WOOD;
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.rect(x + 10, y + 12, w - 20, b - y - 12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,40,30,0.5)';
  ctx.lineWidth = 1.5;
  for (let ly = y + 26; ly < b; ly += 14) {
    ctx.beginPath();
    ctx.moveTo(x + 12, ly);
    ctx.lineTo(x + w - 12, ly);
    ctx.stroke();
  }
  // the door and a little window with lamplight
  ctx.fillStyle = WOOD_D;
  ctx.beginPath();
  ctx.roundRect(x + 30, b - 64, 34, 64, [8, 8, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#ffd88a';
  ctx.fillRect(x + w - 62, y + 34, 26, 20);
  glow(ctx, x + w - 49, y + 44, 26, 20, '255,210,140', 0.4);
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + w - 62, y + 34, 26, 20);
  ctx.beginPath();
  ctx.moveTo(x + w - 49, y + 34);
  ctx.lineTo(x + w - 49, y + 54);
  ctx.stroke();
  // roof
  ctx.fillStyle = '#7a8a5a';
  ctx.strokeStyle = '#4e5a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 6, y, w + 12, 16, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 5, w + 8, 10, 5);
  ctx.fill();
  for (let i = 0; i < w / 26; i++) ellipse(ctx, x + 8 + i * 26, y + 14, 7, 4);
  // a chimney pipe and its smoke
  ctx.fillStyle = '#5a5a66';
  ctx.fillRect(x + w - 34, y - 26, 10, 24);
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.25 + i / 4) % 1;
    ctx.fillStyle = `rgba(230,234,244,${0.5 * (1 - k)})`;
    circle(ctx, x + w - 29 + Math.sin(time + i) * 6 + k * 24, y - 30 - k * 70, 6 + k * 10);
  }
  // stacked ice blocks by the hut
  for (const [bx, row] of BLOCKS) iceBlock(ctx, x + w + bx, b - 28 - row * 26, 32, 28);
  // the sledge loaded with blocks
  const sx = x - 196; // (between the Rime Stone and Eyvind)
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx - 4, b - 4);
  ctx.lineTo(sx + 90, b - 4);
  ctx.quadraticCurveTo(sx + 104, b - 4, sx + 104, b - 18);
  ctx.stroke();
  ctx.fillStyle = WOOD;
  ctx.fillRect(sx, b - 14, 92, 6);
  iceBlock(ctx, sx + 6, b - 42, 34, 28);
  iceBlock(ctx, sx + 44, b - 42, 34, 28);
  iceBlock(ctx, sx + 24, b - 68, 34, 26);
  // the long ice saw and tongs leaning on the hut
  ctx.strokeStyle = '#8a9aa8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w - 6, b);
  ctx.lineTo(x + w + 14, b - 110);
  ctx.stroke();
  ctx.strokeStyle = '#6a7a88';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const k = i / 12;
    ctx.beginPath();
    ctx.moveTo(x + w - 6 + 20 * k, b - 110 * k);
    ctx.lineTo(x + w - 2 + 20 * k, b - 110 * k - 2);
    ctx.stroke();
  }
  ctx.fillStyle = WOOD;
  ctx.fillRect(x + w + 8, b - 118, 14, 6);
  // the brazier and the lantern pole
  const fx = x - 40;
  ctx.fillStyle = '#4a4a56';
  ctx.beginPath();
  ctx.moveTo(fx - 16, b - 26);
  ctx.lineTo(fx + 16, b - 26);
  ctx.lineTo(fx + 10, b - 10);
  ctx.lineTo(fx - 10, b - 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(fx - 2, b - 10, 4, 10);
  for (let i = 0; i < 4; i++) {
    const fh = 12 + Math.sin(time * 9 + i * 1.7) * 4;
    ctx.fillStyle = i % 2 ? '#ffb45a' : '#ffe08a';
    ellipse(ctx, fx - 9 + i * 6, b - 28 - fh / 2, 4, fh / 2);
  }
}

// The floor: packed snow on top, blue ice showing under it, cracks and glints, drifts along the edge
function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = vgrad(ctx, 'ice', GROUND, H, [[0, '#9ccbe8'], [1, '#5a8ab8']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = SNOW;
  ctx.fillRect(L, GROUND - 2, R - L, 16);
  ctx.fillStyle = SNOW_S;
  ctx.fillRect(L, GROUND + 12, R - L, 3);
  ctx.strokeStyle = 'rgba(40,90,140,0.35)';
  ctx.lineWidth = 1.5;
  for (let x = Math.floor(L / 130) * 130; x < R; x += 130) {
    ctx.beginPath();
    ctx.moveTo(x + 30, GROUND + 18);
    ctx.lineTo(x + 44, GROUND + 40);
    ctx.lineTo(x + 38, GROUND + 66);
    ctx.stroke();
  }
  for (const g of glints) {
    if (g.x < L || g.x > R) continue;
    const a = Math.max(0, Math.sin(time * 2 + g.p));
    ctx.fillStyle = `rgba(255,255,255,${0.7 * a})`;
    ctx.fillRect(g.x - 0.5, g.y - 3, 1, 6);
    ctx.fillRect(g.x - 3, g.y - 0.5, 6, 1);
  }
  ctx.fillStyle = SNOW;
  for (const d of drifts) {
    if (!visible(d.x, d.x + d.w, L, R)) continue;
    ctx.beginPath();
    ctx.ellipse(d.x + d.w / 2, GROUND - 1, d.w / 2, d.h, 0, Math.PI, 0);
    ctx.fill();
  }
}

// The way in: steps cut down the glacier's snout toward the Summit, a rope along them on iron pegs
function drawSteps(ctx, time) {
  const x = GLACIER_EXIT_X, b = GROUND;
  iceBlock(ctx, x - 110, b - 120, 90, 120);
  ctx.fillStyle = '#d8eefa';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x - 100 + i * 14, b - 22 - i * 22, 34, 6);
  }
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20, b - 40);
  ctx.quadraticCurveTo(x - 60, b - 70, x - 100, b - 140);
  ctx.stroke();
  ctx.fillStyle = '#5a5a66';
  for (const k of [0, 0.5, 1]) ctx.fillRect(x - 22 - 78 * k, b - 46 - 96 * k, 3, 10);
}

// The zones' markers: a cutters' marker board on two poles with the name burnt in and a level chip
function drawZonePole(ctx, x, z, i, time) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.fillStyle = WOOD_D;
  ctx.fillRect(x - tw / 2 + 10, GROUND - 92, 5, 92);
  ctx.fillRect(x + tw / 2 - 15, GROUND - 92, 5, 92);
  ctx.save();
  ctx.translate(x, GROUND - 70);
  ctx.fillStyle = '#c8a87e';
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -24, tw, 50, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#3e2c22');
  ctx.fillStyle = i === 3 ? '#d0485a' : 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-32, 4, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 12.5, 11, i === 3 ? '#fffaf0' : '#3e2c22');
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - 2, -28, tw + 4, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(200,232,250,0.9)';
  for (let k = 0; k < 5; k++) {
    const ix = -tw / 2 + 12 + k * (tw - 24) / 4;
    ctx.beginPath();
    ctx.moveTo(ix - 2, 26);
    ctx.lineTo(ix + 2, 26);
    ctx.lineTo(ix, 32 + (k % 2) * 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// The way back down to the Summit
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
  text(ctx, 'Down to the Summit', -2, 1, 11, '#5b4a6b');
  ctx.fillStyle = SNOW;
  ellipse(ctx, 0, -12, 56, 3);
  ctx.restore();
}

// Snow blowing down the glacier, across the whole view
function drawSnowfall(ctx, camX, time) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const f of flakes) {
    const x = ((f.x - camX * 0.4 - time * f.v * 0.8 + Math.sin(time + f.p) * 10) % (W + 40) + W + 40) % (W + 40) - 20;
    const y = ((f.y + time * f.v) % H + H) % H;
    circle(ctx, x, y, f.s);
  }
}
