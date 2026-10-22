// Docs: docs/places/skerries.md
// The Whale Skerries (room SKERRIES, data in src/shared/rpg.js): low black islets and shingle along the
// fjord's outer shore, out of Icefang Hamlet's west end. Grey, cold and quiet: a pale low sun, the open sea
// behind with more black skerries in it and the far islands on the horizon, sea smoke curling off the water,
// and to the west the pack ice, packed shut across the outer sound (the Old Narwhal holds it). You come in at
// the EAST end. East to west: the shore path back to the hamlet, the Whaling Hut (Hakon's hut with a whalebone
// arch, his carving bench, the try-pot, the waystone, the Sounding Stone: src/ruins.js), the Black Skerries,
// the Whalebones (Grandmother, a great whale's skeleton: her jaw, skull, backbone and ribs are platforms; the
// crown of her skull, with Hakon's first carving left on it, is the hidden spot) and the Floe Edge, where
// the shingle gives way to sea ice: the Old Narwhal's breathing hole (its art: src/dens-skerries.js) and, at
// the far end, the sea cliff with the Narwhal Grotto's mouth in it (src/branch-gates.js).
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { SKERRIES_W, SKERRIES_EXIT_X, SKERRIES_ZONES, SKERRIES_PLATFORMS, HAKON_X, FIELD_GROUND } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const HORIZON = 286;
const ICE_X = SKERRIES_ZONES[0].x1; // west of here the floor is sea ice
const HUT = SKERRIES_PLATFORMS[0];
const SKULL = SKERRIES_PLATFORMS.at(-1);
const SPINE = SKERRIES_PLATFORMS.find((p) => p.kind === 'spine');
const JAW = SKERRIES_PLATFORMS.find((p) => p.kind === 'jaw');
const BONE = '#e8e2d2', BONE_S = '#bdb5a2', BONE_L = '#8a8270';
const ROCK = '#2e2e3a', ROCK_L = '#4a4a5a', SNOW = '#f4f8fc', SNOW_S = '#d4e0ec';
const ICE = '#cfe6f4', ICE_D = '#8ab8d8', ICE_LINE = '#4e86b0';
const WOOD = '#6e5240', WOOD_D = '#463428', TURF = '#6a7a52';
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
// skerries out in the sea, two layers
const farSkerries = [0.05, 0.14].map((f, j) => {
  const r = mulberry32(3701 + j);
  return { f, span: 2200, list: Array.from({ length: 9 }, () => ({ x: r() * 2200, w: 40 + r() * (j ? 140 : 90), h: 8 + r() * (j ? 30 : 18) })) };
});
// floes on the sea, densest to the west (the pack)
const seaFloes = (() => {
  const r = mulberry32(3711);
  return Array.from({ length: 70 }, () => ({ x: r() * SKERRIES_W, y: HORIZON + 8 + r() * 60, w: 14 + r() * 60 }));
})();
// pebbles and snow patches on the shingle
const pebbles = (() => {
  const r = mulberry32(3721);
  return Array.from({ length: 260 }, () => ({ x: r() * SKERRIES_W, y: GROUND + 4 + r() * 70, r: 1.5 + r() * 4, c: r() }));
})();
const snowPatches = (() => {
  const r = mulberry32(3731);
  return Array.from({ length: 30 }, () => ({ x: ICE_X + r() * (SKERRIES_W - ICE_X), w: 40 + r() * 120 }));
})();
// sea smoke curling off the water
const mist = (() => {
  const r = mulberry32(3741);
  return Array.from({ length: 26 }, () => ({ x: r() * W, y: HORIZON + 10 + r() * 80, s: 20 + r() * 40, v: 4 + r() * 8, p: r() * TAU }));
})();
// pressure ridges and cracks in the sea ice
const iceCracks = (() => {
  const r = mulberry32(3751);
  return Array.from({ length: 24 }, () => ({ x: r() * ICE_X, w: 40 + r() * 100 }));
})();
// big rocks along the back of the shore
const backRocks = (() => {
  const r = mulberry32(3761);
  const out = [];
  for (let x = ICE_X + 40; x < SKERRIES_W - 100; x += 140 + r() * 160) out.push({ x, w: 60 + r() * 90, h: 24 + r() * 40 });
  return out;
})();
const flakes = (() => {
  const r = mulberry32(3771);
  return Array.from({ length: 50 }, () => ({ x: r() * W, y: r() * H, v: 14 + r() * 22, s: 0.8 + r() * 1.6, p: r() * TAU }));
})();

// Everything behind the slimes. camX is the left edge of the view.
export function drawSkerries(ctx, camX, viewW, time) {
  const mid = camX + viewW / 2;
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time, mid);
  ctx.restore();

  const L = camX - 160, R = camX + viewW + 160;
  drawSeaFloes(ctx, L, R, time);
  for (const b of backRocks) if (visible(b.x - b.w, b.x + b.w, L, R)) drawBackRock(ctx, b);
  if (visible(-40, 420, L, R)) drawCliff(ctx, time);
  for (const p of SKERRIES_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'skerry') drawSkerry(ctx, p, time);
    else if (p.kind === 'floe') drawFloe(ctx, p, time);
  }
  if (visible(1850, 3000, L, R)) drawGrandmother(ctx, time);
  if (visible(HUT.x - 400, HUT.x + HUT.w + 120, L, R)) drawHut(ctx, time);
  drawFloor(ctx, Math.max(0, L), Math.min(SKERRIES_W, R), time);
  SKERRIES_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x1 - 90; // (you walk in from the east: each zone's marker stands at its east edge)
    if (visible(sx - 90, sx + 90, L, R)) drawZonePost(ctx, sx, z, i, time);
  });
  if (visible(SKERRIES_EXIT_X - 260, SKERRIES_EXIT_X + 60, L, R)) drawExitSign(ctx, SKERRIES_EXIT_X - 20, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawMist(ctx, camX, time, 0.18);
  drawFlakes(ctx, camX, time);
  ctx.restore();
}

// The sky: low grey cloud, pale at the sea line, a weak sun low in the south-west; the sea, slate grey-green,
// with skerries and floes on it, the far islands on the horizon
function drawSky(ctx, camX, time, mid) {
  ctx.fillStyle = vgrad(ctx, 'sky', 0, HORIZON, [[0, '#6e7c94'], [0.6, '#b4bccc'], [1, '#e2e2e6']]);
  ctx.fillRect(0, 0, W, HORIZON);
  // the low sun behind cloud
  const sx = 640 - camX * 0.02;
  glow(ctx, sx, HORIZON - 60, 200, 110, '255,240,210', 0.45);
  ctx.fillStyle = 'rgba(255,248,228,0.8)';
  circle(ctx, sx, HORIZON - 60, 18);
  // cloud bands
  ctx.fillStyle = 'rgba(150,160,180,0.35)';
  for (let i = 0; i < 5; i++) {
    const x = ((i * 300 - camX * 0.03) % (W + 300) + W + 300) % (W + 300) - 150;
    ellipse(ctx, x, 40 + i * 26, 220, 14);
  }
  ctx.fillStyle = vgrad(ctx, 'sea', HORIZON, H, [[0, '#8a9aa6'], [0.4, '#5e7480'], [1, '#3e525e']]);
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  drawDistantIslands(ctx, { from: 'frost', scroll: camX, roomW: SKERRIES_W, time, horizon: HORIZON, haze: '#e2e2e6', fade: 0.55, scale: 0.6, sky: 200 });
  // the sun on the water
  ctx.fillStyle = 'rgba(255,245,220,0.25)';
  for (let i = 0; i < 6; i++) ellipse(ctx, sx + Math.sin(time * 0.7 + i) * 8, HORIZON + 6 + i * 7, 30 - i * 3, 1.6);
  // skerries out at sea
  farSkerries.forEach(({ f, span, list }, j) => {
    const off = -((camX * f) % span);
    for (const rep of [0, span]) {
      for (const s of list) {
        const x = off + rep + s.x, y = HORIZON + 4 + j * 14;
        if (x < -200 || x > W + 200) continue;
        ctx.fillStyle = j ? '#3a3e4c' : '#5a6070';
        ctx.beginPath();
        ctx.moveTo(x - s.w / 2, y);
        ctx.quadraticCurveTo(x - s.w * 0.2, y - s.h, x, y - s.h * 0.9);
        ctx.quadraticCurveTo(x + s.w * 0.3, y - s.h * 1.05, x + s.w / 2, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = j ? 'rgba(240,246,252,0.9)' : 'rgba(240,246,252,0.6)';
        ellipse(ctx, x, y - s.h * 0.9, s.w * 0.22, 2.4);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ellipse(ctx, x, y + 1, s.w * 0.55, 1.6);
      }
    }
  });
  // the pack ice, filling the sea to the west: more of it the further west you are
  const pack = 1 - smooth(800, 3600, mid);
  if (pack > 0.01) {
    ctx.fillStyle = `rgba(232,242,250,${0.75 * pack})`;
    ctx.beginPath();
    ctx.moveTo(0, HORIZON + 2);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, HORIZON + 2 + Math.sin(x * 0.03 + camX * 0.01) * 2 + (1 - pack) * 30 * (x / W));
    ctx.lineTo(W, HORIZON + 20);
    ctx.lineTo(0, HORIZON + 30);
    ctx.closePath();
    ctx.fill();
  }
}

// Floes drifting on the near sea (they don't drift out: the pack holds them), more of them to the west
function drawSeaFloes(ctx, L, R, time) {
  for (const f of seaFloes) {
    if (!visible(f.x - f.w, f.x + f.w, L, R)) continue;
    const dense = 1 - smooth(500, 3800, f.x);
    if ((f.w * 13) % 1 > 0.25 + dense * 0.75) continue;
    const y = f.y + Math.sin(time * 0.8 + f.x) * 1.2;
    ctx.fillStyle = 'rgba(30,50,60,0.3)';
    ellipse(ctx, f.x + 2, y + 3, f.w / 2, 3.4);
    ctx.fillStyle = '#e8f2f8';
    ellipse(ctx, f.x, y, f.w / 2, 3.2);
    ctx.fillStyle = '#b8d4e6';
    ctx.fillRect(f.x - f.w / 2 + 2, y + 1, f.w - 4, 2);
  }
}

// A low black rock along the back of the shore, snow on top
function drawBackRock(ctx, b) {
  const y = GROUND + 2;
  ctx.fillStyle = ROCK_L;
  ctx.beginPath();
  ctx.moveTo(b.x - b.w / 2, y);
  ctx.quadraticCurveTo(b.x - b.w * 0.4, y - b.h, b.x, y - b.h);
  ctx.quadraticCurveTo(b.x + b.w * 0.45, y - b.h * 0.95, b.x + b.w / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SNOW;
  ellipse(ctx, b.x - b.w * 0.05, y - b.h + 2, b.w * 0.28, 4);
}

// The sea cliff at the far west end, with the Grotto's mouth in it (the mouth itself: src/branch-gates.js)
function drawCliff(ctx, time) {
  ctx.fillStyle = '#3a3e4c';
  ctx.beginPath();
  ctx.moveTo(-40, GROUND + 4);
  ctx.lineTo(-40, 60);
  ctx.quadraticCurveTo(160, 40, 260, 120);
  ctx.quadraticCurveTo(330, 220, 300, 320);
  ctx.quadraticCurveTo(340, 400, 400, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4e5262';
  ctx.beginPath();
  ctx.moveTo(180, 70);
  ctx.quadraticCurveTo(260, 140, 250, 260);
  ctx.lineTo(220, 250);
  ctx.quadraticCurveTo(230, 150, 160, 80);
  ctx.closePath();
  ctx.fill();
  // snow ledges and icicles
  ctx.fillStyle = SNOW;
  for (const [x, y, w] of [[60, 58, 120], [200, 100, 70], [270, 210, 50], [290, 330, 60]]) ellipse(ctx, x, y, w / 2, 5);
  ctx.fillStyle = 'rgba(200,235,250,0.9)';
  for (let i = 0; i < 9; i++) {
    const x = 30 + i * 26, y = 62 + (i > 5 ? (i - 5) * 14 : 0), len = 10 + (i % 3) * 8;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x, y + len);
    ctx.closePath();
    ctx.fill();
  }
  // a green glow seeping out round the cave mouth
  glow(ctx, 170, GROUND - 70, 150, 100, '120,240,190', 0.18 + 0.05 * Math.sin(time * 1.3));
}

// A black skerry: a lump of dark rock with a flat snowy top (a platform), weed and barnacles at its foot
function drawSkerry(ctx, p, time) {
  const { x, y, w } = p;
  // a stack of rounded black boulders, broad at the foot, the flat top slab on them
  const r = mulberry32(Math.round(x) + 5);
  const rows = Math.max(1, Math.round((GROUND - y) / 60));
  for (let k = 0; k < rows; k++) {
    const yy = GROUND - ((k + 0.5) * (GROUND - y - 6)) / rows, half = (w / 2) * (1.15 - (k / rows) * 0.35);
    for (let j = 0; j < 3; j++) {
      const bx = x + w / 2 + (j - 1) * half * 0.62 + (r() - 0.5) * 10;
      ctx.fillStyle = j === 1 ? ROCK_L : ROCK;
      ellipse(ctx, bx, yy, half * 0.42, (GROUND - y) / rows * 0.62);
    }
  }
  ctx.fillStyle = ROCK;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 16, 7);
  ctx.fill();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 5, w + 4, 10, 5);
  ctx.fill();
  ctx.fillStyle = SNOW_S;
  ctx.fillRect(x + 4, y + 3, w - 8, 2);
  ctx.fillStyle = '#5a6a4a'; // weed
  for (let i = 0; i < 5; i++) ellipse(ctx, x + 10 + (i * (w - 20)) / 4, GROUND - 4, 6, 8, Math.sin(time + i) * 0.2);
  ctx.fillStyle = '#c8ccd4'; // barnacles
  for (let i = 0; i < 6; i++) circle(ctx, x + 6 + (i * 37) % (w - 6), GROUND - 14 - (i % 3) * 6, 2);
}

// A floe, frozen fast against a pressure ridge in the pack: a slab of sea ice with a blue edge
function drawFloe(ctx, p, time) {
  const { x, y, w } = p;
  // the ridge holding it up: blocks of ice tilted every which way
  ctx.fillStyle = ICE_D;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 1.6;
  const r = mulberry32(Math.round(x));
  for (let i = 0; i < 5; i++) {
    const bx = x + 10 + r() * (w - 40), bw = 24 + r() * 30, top = y + 10 + r() * 30;
    ctx.beginPath();
    ctx.moveTo(bx, GROUND + 2);
    ctx.lineTo(bx + 4, top + 6);
    ctx.lineTo(bx + bw * 0.6, top);
    ctx.lineTo(bx + bw, GROUND + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // the slab
  ctx.fillStyle = ICE;
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x + w + 4, y);
  ctx.lineTo(x + w - 2, y + 16);
  ctx.lineTo(x + 4, y + 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 5, w + 8, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 3; i++) {
    const a = Math.max(0, Math.sin(time * 2 + x + i * 2));
    ctx.fillRect(x + 20 + i * (w / 3), y + 8, 1, 4 * a);
  }
}

// Grandmother: a great whale's skeleton lying along the Whalebones. Her skull (its crown the hidden spot,
// with Hakon's first carving, a little bone seal, left on it), her jawbone propped on rocks, her backbone
// arching east (a platform), ribs curving down to the shingle, and her tail bones trailing away
function drawGrandmother(ctx, time) {
  const g = GROUND;
  // ribs, behind everything: long arcs from the backbone down to the ground
  ctx.strokeStyle = BONE_S;
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const rx = SPINE.x + 18 + i * 34, top = SPINE.y + 8;
    ctx.lineWidth = 9 - i * 0.5;
    ctx.beginPath();
    ctx.moveTo(rx, top);
    ctx.quadraticCurveTo(rx + 40, top + 60, rx + 22 + i * 2, g - 2);
    ctx.stroke();
  }
  ctx.strokeStyle = BONE;
  for (let i = 0; i < 9; i++) {
    const rx = SPINE.x + 18 + i * 34, top = SPINE.y + 8;
    ctx.lineWidth = 6 - i * 0.3;
    ctx.beginPath();
    ctx.moveTo(rx, top);
    ctx.quadraticCurveTo(rx + 40, top + 60, rx + 22 + i * 2, g - 2);
    ctx.stroke();
  }
  // the tail bones, trailing down to the east
  for (let i = 0; i < 9; i++) {
    const vx = SPINE.x + SPINE.w + 10 + i * 30, vy = SPINE.y + 14 + i * i * 2.4, s = 12 - i;
    if (vy > g - 6) break;
    ctx.fillStyle = BONE;
    ctx.strokeStyle = BONE_L;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(vx - s, vy - s * 0.7, s * 2, s * 1.4, 4);
    ctx.fill();
    ctx.stroke();
  }
  // the backbone: a row of great vertebrae, flat on top
  ctx.fillStyle = BONE;
  ctx.strokeStyle = BONE_L;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(SPINE.x - 4, SPINE.y - 4, SPINE.w + 8, 18, 6);
  ctx.fill();
  ctx.stroke();
  for (let vx = SPINE.x + 6; vx < SPINE.x + SPINE.w; vx += 32) {
    ctx.fillStyle = BONE;
    ctx.beginPath();
    ctx.moveTo(vx, SPINE.y - 2);
    ctx.lineTo(vx + 6, SPINE.y - 18);
    ctx.lineTo(vx + 12, SPINE.y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(138,130,112,0.5)';
    ctx.beginPath();
    ctx.moveTo(vx + 26, SPINE.y);
    ctx.lineTo(vx + 26, SPINE.y + 12);
    ctx.stroke();
    ctx.strokeStyle = BONE_L;
  }
  // a rock under the backbone's middle, holding it up
  ctx.fillStyle = ROCK;
  ctx.beginPath();
  ctx.moveTo(SPINE.x + 120, g + 2);
  ctx.quadraticCurveTo(SPINE.x + 150, SPINE.y + 30, SPINE.x + 190, SPINE.y + 20);
  ctx.quadraticCurveTo(SPINE.x + 230, SPINE.y + 50, SPINE.x + 250, g + 2);
  ctx.closePath();
  ctx.fill();
  // the skull: a great pale dome, lying on the shingle, a dark eye socket
  const sx0 = SKULL.x - 110, sx1 = SPINE.x + 30, top = SKULL.y;
  ctx.fillStyle = BONE;
  ctx.strokeStyle = BONE_L;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(sx0, g + 2);
  ctx.bezierCurveTo(sx0 + 10, top + 120, SKULL.x - 30, top + 6, SKULL.x + SKULL.w / 2, top);
  ctx.bezierCurveTo(SKULL.x + SKULL.w + 40, top + 4, sx1 + 10, top + 60, sx1, SPINE.y + 30);
  ctx.lineTo(sx1, g + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(189,181,162,0.8)';
  ellipse(ctx, SKULL.x + 30, top + 120, 70, 40, -0.1);
  ctx.fillStyle = '#4e4a44'; // the eye socket
  ellipse(ctx, SKULL.x + 110, top + 120, 22, 16, 0.2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ellipse(ctx, SKULL.x + 20, top + 30, 50, 10, -0.15);
  // lichen and snow on her
  ctx.fillStyle = 'rgba(200,190,120,0.5)';
  for (const [x, y] of [[-60, 180], [40, 220], [-20, 90], [120, 200]]) ellipse(ctx, SKULL.x + x, top + y, 10, 5);
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.roundRect(SKULL.x - 4, top - 5, SKULL.w + 8, 9, 4);
  ctx.fill();
  // Hakon's first carving: a little bone seal, left on her crown
  const cx = SKULL.x + SKULL.w * 0.6, cy = top - 4;
  ctx.fillStyle = '#f4efe2';
  ctx.strokeStyle = BONE_L;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy);
  ctx.quadraticCurveTo(cx - 8, cy - 9, cx + 2, cy - 9);
  ctx.quadraticCurveTo(cx + 9, cy - 9, cx + 9, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2d2a3e';
  circle(ctx, cx + 5, cy - 6, 0.9);
  // the jawbone, a long curved bone propped on two rocks (a platform)
  ctx.fillStyle = ROCK;
  for (const rx of [JAW.x + 20, JAW.x + JAW.w - 30]) {
    ctx.beginPath();
    ctx.moveTo(rx - 22, g + 2);
    ctx.quadraticCurveTo(rx - 14, JAW.y + 20, rx, JAW.y + 12);
    ctx.quadraticCurveTo(rx + 16, JAW.y + 22, rx + 24, g + 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = BONE;
  ctx.strokeStyle = BONE_L;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(JAW.x - 8, JAW.y + 2);
  ctx.quadraticCurveTo(JAW.x + JAW.w / 2, JAW.y - 10, JAW.x + JAW.w + 10, JAW.y + 4);
  ctx.lineTo(JAW.x + JAW.w + 6, JAW.y + 16);
  ctx.quadraticCurveTo(JAW.x + JAW.w / 2, JAW.y + 4, JAW.x - 4, JAW.y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // a fallen rib, wedged between two rocks further east (a platform)
  const rib = SKERRIES_PLATFORMS.find((p) => p.kind === 'rib');
  ctx.fillStyle = ROCK;
  for (const rx of [rib.x + 10, rib.x + rib.w - 20]) {
    ctx.beginPath();
    ctx.moveTo(rx - 26, g + 2);
    ctx.quadraticCurveTo(rx - 10, rib.y + 14, rx + 6, rib.y + 8);
    ctx.quadraticCurveTo(rx + 20, rib.y + 24, rx + 30, g + 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = BONE;
  ctx.beginPath();
  ctx.moveTo(rib.x - 6, rib.y - 2);
  ctx.quadraticCurveTo(rib.x + rib.w / 2, rib.y - 12, rib.x + rib.w + 6, rib.y);
  ctx.lineTo(rib.x + rib.w + 4, rib.y + 10);
  ctx.quadraticCurveTo(rib.x + rib.w / 2, rib.y - 2, rib.x - 4, rib.y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// The Whaling Hut: a low stone hut with a turf roof (a platform), a door under an arch of two whale jawbones,
// drying racks, Hakon's carving bench with shavings, and the old try-pot, rusting, full of snow
function drawHut(ctx, time) {
  const g = GROUND, x0 = HUT.x, x1 = HUT.x + HUT.w, top = HUT.y;
  // walls: dry stone
  ctx.fillStyle = '#6a6a74';
  ctx.beginPath();
  ctx.roundRect(x0 + 6, top + 18, HUT.w - 12, g - top - 16, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(40,40,52,0.35)';
  const r = mulberry32(3781);
  for (let i = 0; i < 26; i++) ellipse(ctx, x0 + 14 + r() * (HUT.w - 28), top + 26 + r() * (g - top - 30), 8, 4);
  // the turf roof
  ctx.fillStyle = TURF;
  ctx.beginPath();
  ctx.moveTo(x0 - 10, top + 22);
  ctx.quadraticCurveTo(x0 + HUT.w / 2, top - 22, x1 + 10, top + 22);
  ctx.lineTo(x1 + 4, top + 28);
  ctx.lineTo(x0 - 4, top + 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(x0 - 6, top + 8);
  ctx.quadraticCurveTo(x0 + HUT.w / 2, top - 16, x1 + 6, top + 8);
  ctx.quadraticCurveTo(x0 + HUT.w / 2, top - 4, x0 - 6, top + 8);
  ctx.fill();
  // the chimney, smoking
  ctx.fillStyle = '#5a5a64';
  ctx.fillRect(x1 - 40, top - 22, 16, 26);
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.3 + i / 4) % 1;
    ctx.fillStyle = `rgba(220,224,232,${0.5 * (1 - k)})`;
    circle(ctx, x1 - 32 + Math.sin(k * 5 + i) * 8 - k * 20, top - 26 - k * 70, 6 + k * 12);
  }
  // the window, lit
  glow(ctx, x0 + HUT.w * 0.7, top + 60, 40, 30, '255,210,140', 0.35);
  ctx.fillStyle = '#ffd890';
  ctx.fillRect(x0 + HUT.w * 0.7 - 10, top + 50, 20, 16);
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 2;
  ctx.strokeRect(x0 + HUT.w * 0.7 - 10, top + 50, 20, 16);
  // the door, under an arch of two great jawbones
  const dx = x0 + HUT.w * 0.28;
  ctx.fillStyle = WOOD_D;
  ctx.beginPath();
  ctx.roundRect(dx - 15, g - 54, 30, 54, [10, 10, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = BONE;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dx + s * 34, g);
    ctx.quadraticCurveTo(dx + s * 34, g - 110, dx + s * 2, g - 118);
    ctx.stroke();
  }
  ctx.strokeStyle = BONE_L;
  ctx.lineWidth = 1.4;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dx + s * 38, g);
    ctx.quadraticCurveTo(dx + s * 38, g - 112, dx + s * 2, g - 122);
    ctx.stroke();
  }
  // the carving bench, west of the door (Hakon stands by it), with a half-carved bird and shavings
  const bx = HAKON_X - 70;
  ctx.fillStyle = WOOD;
  ctx.fillRect(bx - 34, g - 30, 68, 8);
  ctx.fillRect(bx - 30, g - 22, 6, 22);
  ctx.fillRect(bx + 24, g - 22, 6, 22);
  ctx.fillStyle = BONE;
  ellipse(ctx, bx - 8, g - 36, 9, 5);
  ctx.beginPath();
  ctx.moveTo(bx - 1, g - 39);
  ctx.lineTo(bx + 6, g - 46);
  ctx.lineTo(bx + 4, g - 37);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(244,238,224,0.9)';
  for (let i = 0; i < 9; i++) ellipse(ctx, bx - 30 + i * 8, g - 2 + (i % 2), 3, 1.2, i);
  // drying racks of driftwood hung with bones and a sealskin
  const rx = HUT.x - 360; // (west of the bench, past the Sounding Stone)
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(rx, g);
  ctx.lineTo(rx + 6, g - 80);
  ctx.moveTo(rx + 90, g);
  ctx.lineTo(rx + 84, g - 80);
  ctx.moveTo(rx - 4, g - 76);
  ctx.lineTo(rx + 94, g - 76);
  ctx.stroke();
  ctx.fillStyle = '#7a8494';
  ctx.beginPath();
  ctx.moveTo(rx + 14, g - 76);
  ctx.lineTo(rx + 46, g - 76);
  ctx.quadraticCurveTo(rx + 44, g - 40 + Math.sin(time) * 2, rx + 30, g - 32);
  ctx.quadraticCurveTo(rx + 16, g - 40, rx + 14, g - 76);
  ctx.fill();
  ctx.fillStyle = BONE;
  for (const k of [0, 1, 2]) {
    ctx.save();
    ctx.translate(rx + 58 + k * 10, g - 76);
    ctx.rotate(Math.sin(time * 1.4 + k) * 0.08);
    ctx.fillRect(-1.5, 0, 3, 24 + k * 4);
    ctx.restore();
  }
  // the try-pot, rusting, full of snow
  const tx = x1 + 50;
  ctx.fillStyle = '#6a4a3a';
  ctx.strokeStyle = '#3a2a22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx - 34, g - 46);
  ctx.quadraticCurveTo(tx - 36, g + 2, tx, g + 2);
  ctx.quadraticCurveTo(tx + 36, g + 2, tx + 34, g - 46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SNOW;
  ellipse(ctx, tx, g - 46, 35, 7);
  ctx.fillStyle = 'rgba(160,90,60,0.6)';
  for (const [x, y] of [[-20, -30], [12, -16], [-6, -10]]) ellipse(ctx, tx + x, g + y, 5, 3);
}

// The floor: grey shingle with pebbles and snow patches; west of ICE_X it turns to sea ice over dark water,
// with pressure cracks and a lead of open water now and then
function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = vgrad(ctx, 'shingle', GROUND, H, [[0, '#6a6a76'], [1, '#3e3e4a']]);
  ctx.fillRect(Math.max(L, ICE_X - 40), GROUND, R - Math.max(L, ICE_X - 40), H - GROUND);
  if (L < ICE_X) {
    ctx.fillStyle = vgrad(ctx, 'seaice', GROUND, H, [[0, '#dcecf6'], [0.3, '#a8cce4'], [1, '#5a86a8']]);
    ctx.fillRect(L, GROUND, Math.min(R, ICE_X) - L, H - GROUND);
    // where the shingle meets the ice: a ragged edge with drift snow
    if (visible(ICE_X - 120, ICE_X + 60, L, R)) {
      ctx.fillStyle = SNOW;
      for (let i = 0; i < 6; i++) ellipse(ctx, ICE_X - 40 + i * 14, GROUND + 2 + (i % 2) * 3, 16, 5);
    }
    ctx.strokeStyle = 'rgba(78,134,176,0.55)';
    ctx.lineWidth = 1.6;
    for (const c of iceCracks) {
      if (!visible(c.x, c.x + c.w, L, R)) continue;
      ctx.beginPath();
      ctx.moveTo(c.x, GROUND + 12);
      ctx.lineTo(c.x + c.w * 0.3, GROUND + 24);
      ctx.lineTo(c.x + c.w * 0.6, GROUND + 18);
      ctx.lineTo(c.x + c.w, GROUND + 34);
      ctx.stroke();
    }
    ctx.fillStyle = SNOW;
    ctx.fillRect(L, GROUND - 2, Math.min(R, ICE_X) - L, 8);
  }
  if (R > ICE_X) {
    for (const p of pebbles) {
      if (p.x < Math.max(L, ICE_X) || p.x > R) continue;
      ctx.fillStyle = p.c < 0.4 ? '#4a4a56' : p.c < 0.8 ? '#7a7a86' : '#9a9aa6';
      ellipse(ctx, p.x, p.y, p.r, p.r * 0.7);
    }
    ctx.fillStyle = SNOW;
    for (const s of snowPatches) {
      if (!visible(s.x, s.x + s.w, L, R)) continue;
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, GROUND + 1, s.w / 2, 4, 0, 0, TAU);
      ctx.fill();
    }
    // the tide line: a frill of foam and weed along the shingle's top edge
    ctx.fillStyle = 'rgba(90,110,80,0.6)';
    for (let x = Math.floor(Math.max(L, ICE_X) / 46) * 46; x < R; x += 46) ellipse(ctx, x + 12, GROUND + 3, 14, 2);
  }
}

// The zones' markers: a whalebone post with a driftwood board, the name and a level chip
function drawZonePost(ctx, x, z, i, time) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.fillStyle = BONE;
  ctx.strokeStyle = BONE_L;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 6, GROUND);
  ctx.quadraticCurveTo(x - 10, GROUND - 60, x - 2, GROUND - 104);
  ctx.lineTo(x + 6, GROUND - 100);
  ctx.quadraticCurveTo(x, GROUND - 60, x + 6, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(x, GROUND - 74);
  ctx.rotate(Math.sin(time * 1.1 + i) * 0.015);
  ctx.fillStyle = '#b8a68a';
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -24, tw, 50, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#3e2c22');
  const hard = i === 0;
  ctx.fillStyle = hard ? '#d0485a' : 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-32, 4, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 12.5, 11, hard ? '#fffaf0' : '#3e2c22');
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - 2, -28, tw + 4, 7, 3.5);
  ctx.fill();
  ctx.restore();
}

// The way back along the shore path to the hamlet
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
  ctx.moveTo(-64, -12);
  ctx.lineTo(58, -12);
  ctx.lineTo(70, 0);
  ctx.lineTo(58, 12);
  ctx.lineTo(-64, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'To Icefang Hamlet', 0, 1, 11, '#5b4a6b');
  ctx.fillStyle = SNOW;
  ellipse(ctx, 0, -12, 56, 3);
  ctx.restore();
}

// Sea smoke drifting along low over everything (screen space)
function drawMist(ctx, camX, time, a) {
  for (const m of mist) {
    const x = ((m.x - camX * 0.3 + time * m.v) % (W + 200) + W + 200) % (W + 200) - 100;
    ctx.fillStyle = `rgba(232,238,244,${a * (0.5 + 0.5 * Math.sin(time * 0.5 + m.p))})`;
    ellipse(ctx, x, m.y + 10, m.s * 2, m.s * 0.3);
  }
}
function drawFlakes(ctx, camX, time) {
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (const f of flakes) {
    const x = ((f.x - camX * 0.5 + Math.sin(time * 0.6 + f.p) * 14) % (W + 40) + W + 40) % (W + 40) - 20;
    const y = ((f.y + time * f.v) % H + H) % H;
    circle(ctx, x, y, f.s);
  }
}
