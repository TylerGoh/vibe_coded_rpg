// Docs: docs/places/spine.md
// Keeper's Spine (room SPINE, data in src/shared/rpg.js): the bare stone ridge along the top of Greenhollow,
// over the fallen trunk at the Old Oak Canopy's far end. High, bright and windy: clouds blowing past at your
// own height, the sea on every side far below with the far islands on it, the Canopy's treetops dropping
// away to the west. The floor is the Keepers' road, old flagstones through turf and heather, running east
// along the crest. West to east: the cut trunk back down (the way in), the Windgap (the waystone and the
// Road Stone: src/ruins.js), the Heather Slopes (rock outcrops), the Standing Stones (trilithons, their
// lintels the platforms), and the Warden's Crest, where the walls of the biggest Keeper ruins on the island
// stand broken, great roots run along the road toward the east, and the road ends at a ruined gatehouse
// (the Root Warden's court: src/dens-spine.js draws its mouth). The Watch Seat, a stone seat carved on the
// tallest trilithon's capstone, looking out to sea, is the hidden spot.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { SPINE_W, SPINE_EXIT_X, SPINE_ZONES, SPINE_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const HORIZON = 236;
const STONES_X = SPINE_ZONES[2].x0, CREST_X = SPINE_ZONES[3].x0;
const SEAT = SPINE_PLATFORMS.at(-1);
const STONE = '#a8a4b4', STONE_D = '#8a8698', STONE_L = '#c4c0d0', LINE = '#4e4a5e', MOSS = '#7aa05e', HEATHER = '#c48ad0';
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
function gear(ctx, x, y, r, teeth, col, lw = 1.6) {
  ctx.strokeStyle = col;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TAU;
    ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35);
  }
  ctx.stroke();
}
function root(ctx, x0, y0, cx, cy, x1, y1, w) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.stroke();
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = Math.max(1, w * 0.3);
  ctx.beginPath();
  ctx.moveTo(x0, y0 - w * 0.2);
  ctx.quadraticCurveTo(cx, cy - w * 0.2, x1, y1 - w * 0.2);
  ctx.stroke();
}

// ——— seeded scenery ———
// clouds in two layers: high ones drifting slowly, low ones streaming past below the horizon line (you're up
// above them)
const clouds = [0.05, 0.18].map((f, j) => {
  const r = mulberry32(3401 + j);
  return { f, span: 2600, list: Array.from({ length: 9 }, (_, i) => ({ x: i * 290 + r() * 120, y: j ? 250 + r() * 50 : 50 + r() * 100, s: (j ? 1.1 : 0.7) + r() * 0.6, v: (j ? 14 : 6) + r() * 6 })) };
});
// the ridge's far slopes falling away: two layers of grey-lilac hills with heather patches
const hills = [0.2, 0.42].map((f, j) => {
  const r = mulberry32(3411 + j);
  return { f, span: 2000, pts: Array.from({ length: 21 }, (_, i) => [i * 100, (j ? 330 : 280) + Math.sin(i * 0.9 + j) * 18 + r() * 22]), patches: Array.from({ length: 8 }, () => ({ x: r() * 2000, w: 80 + r() * 140 })) };
});
// standing stones out on the far slopes (more of them toward the Standing Stones and the Crest)
const farStones = (() => {
  const r = mulberry32(3421);
  const out = [];
  for (let x = 300; x < SPINE_W * 0.42 + 600; x += 90 + r() * 260) out.push({ x, h: 20 + r() * 30, w: 7 + r() * 6, lintel: r() < 0.25 });
  return out;
})();
const tufts = (() => {
  const r = mulberry32(3431);
  const out = [];
  for (let x = 10; x < SPINE_W; x += 18 + r() * 40) out.push({ x, s: 0.6 + r() * 0.8, heather: r() < 0.45, front: r() < 0.5 });
  return out;
})();
const flags = (() => {
  const r = mulberry32(3441);
  const out = [];
  for (let x = 0; x < SPINE_W; x += 54 + r() * 40) out.push({ x, w: 44 + r() * 26, c: r() < 0.5 ? '#b0acbc' : '#a49fb0', gone: r() < 0.14, moss: r() < 0.3 });
  return out;
})();
// lone standing stones beside the road (behind the slimes), and the ruined walls of the Crest
const roadStones = (() => {
  const r = mulberry32(3451);
  const out = [];
  for (let x = 1000; x < CREST_X; x += 240 + r() * 340) {
    if (SPINE_PLATFORMS.some((p) => x > p.x - 60 && x < p.x + p.w + 60)) continue;
    out.push({ x, h: 70 + r() * 70 + (x > STONES_X ? 40 : 0), w: 26 + r() * 16, tilt: (r() - 0.5) * 0.12, gear: r() < 0.5 });
  }
  return out;
})();
const ruinWalls = (() => {
  const r = mulberry32(3461);
  const out = [];
  for (let x = CREST_X + 40; x < SPINE_W - 300; x += 200 + r() * 160) out.push({ x, w: 120 + r() * 80, h: 90 + r() * 120, arch: r() < 0.4 });
  return out;
})();
const gusts = (() => {
  const r = mulberry32(3471);
  return Array.from({ length: 14 }, () => ({ x: r() * W, y: 40 + r() * (H - 120), len: 40 + r() * 70, v: 140 + r() * 120, p: r() * TAU }));
})();
const petals = (() => {
  const r = mulberry32(3481);
  return Array.from({ length: 18 }, () => ({ x: r() * W, y: r() * H, v: 60 + r() * 60, p: r() * TAU, s: 1.6 + r() * 1.4 }));
})();

// late golden light on the Crest
const crestAt = (x) => smooth(CREST_X - 300, CREST_X + 400, x);

// Everything behind the slimes. camX is the left edge of the view.
export function drawSpine(ctx, camX, viewW, time) {
  const mid = camX + viewW / 2, gold = crestAt(mid);
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time, gold);
  drawHills(ctx, camX, time, mid);
  ctx.restore();

  const L = camX - 140, R = camX + viewW + 140;
  for (const w of ruinWalls) if (visible(w.x - 20, w.x + w.w + 20, L, R)) drawRuinWall(ctx, w, time);
  for (const s of roadStones) if (visible(s.x - s.w, s.x + s.w, L, R)) drawRoadStone(ctx, s, time);
  for (const p of SPINE_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'ledge') drawOutcrop(ctx, p, time);
    else if (p.kind === 'lintel') drawTrilithon(ctx, p, time);
    else if (p.kind === 'wall') drawWallTop(ctx, p, time);
  }
  if (visible(SEAT.x - 80, SEAT.x + SEAT.w + 80, L, R)) drawWatchSeat(ctx, SEAT, time);
  drawRoad(ctx, Math.max(0, L), Math.min(SPINE_W, R), time);
  if (visible(CREST_X, SPINE_W, L, R)) drawCrestRoots(ctx, L, R, time);
  if (visible(SPINE_EXIT_X - 120, SPINE_EXIT_X + 160, L, R)) drawCutTrunk(ctx, time);
  SPINE_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 70;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneStone(ctx, sx, z, i, time);
  });
  if (visible(SPINE_EXIT_X, SPINE_EXIT_X + 260, L, R)) drawExitSign(ctx, SPINE_EXIT_X + 150, time);
  ctx.save();
  ctx.translate(camX, 0);
  if (gold > 0.01) {
    ctx.fillStyle = `rgba(255,190,110,${0.1 * gold})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawWind(ctx, camX, time);
  ctx.restore();
}

// The sky: wide and pale, a high sun, clouds above and below you, and the sea far down with the far islands
function drawSky(ctx, camX, time, gold) {
  ctx.fillStyle = vgrad(ctx, gold > 0.5 ? 'sky-gold' : 'sky', 0, HORIZON, gold > 0.5 ? [[0, '#86a8d8'], [1, '#ffe2c0']] : [[0, '#8ab4e4'], [1, '#e6f0f6']]);
  ctx.fillRect(0, 0, W, HORIZON);
  glow(ctx, W * 0.22, 64, 170, 130, '255,246,214', 0.6 + 0.2 * gold);
  ctx.fillStyle = '#fffbe6';
  circle(ctx, W * 0.22, 64, 20);
  ctx.fillStyle = vgrad(ctx, 'sea', HORIZON, H, [[0, '#b4d4ea'], [1, '#7eb0d0']]);
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  drawDistantIslands(ctx, { from: 'green', scroll: camX, roomW: SPINE_W, time, horizon: HORIZON, haze: '#eef2f6', fade: 0.6, scale: 0.45, sky: 170 });
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = HORIZON + 10 + i * 12, x = ((i * 191 - time * (4 + i)) % W + W) % W;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 34, y);
    ctx.stroke();
  }
  // clouds, the low layer streaming past below the horizon line
  clouds.forEach(({ f, span, list }, j) => {
    ctx.fillStyle = j ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.7)';
    for (const c of list) {
      const x = (((c.x - camX * f + time * c.v) % span) + span) % span - 200;
      if (x < -200 || x > W + 200) continue;
      for (const [dx, dy, r] of [[0, 0, 34], [-40, 10, 24], [42, 8, 26], [16, -16, 24], [-18, -10, 20]]) circle(ctx, x + dx * c.s, c.y + dy * c.s, r * c.s);
    }
  });
}

// The ridge's slopes falling away on the far side, grey stone and heather; the Canopy's treetops far below in
// the west, thinning out as you go east
function drawHills(ctx, camX, time, mid) {
  const canopy = 1 - smooth(600, 2200, mid);
  if (canopy > 0.01) {
    ctx.fillStyle = `rgba(110,160,100,${0.9 * canopy})`;
    for (let i = 0; i < 14; i++) {
      const x = ((i * 120 - camX * 0.15) % 1680 + 1680) % 1680 - 200;
      circle(ctx, x, 330 + Math.sin(i * 1.7) * 12, 50 + (i % 3) * 14);
    }
  }
  hills.forEach(({ f, span, pts, patches }, j) => {
    const off = -((camX * f) % span);
    for (const rep of [0, span]) {
      ctx.fillStyle = j ? '#a29eb2' : '#b8b4c6';
      ctx.beginPath();
      ctx.moveTo(off + rep, H);
      for (const [x, y] of pts) ctx.lineTo(off + rep + x, y);
      ctx.lineTo(off + rep + span, H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = j ? 'rgba(170,110,180,0.55)' : 'rgba(190,140,200,0.4)';
      for (const p of patches) {
        const x = off + rep + p.x;
        if (x < -p.w || x > W + p.w) continue;
        const i = Math.min(pts.length - 1, Math.max(0, Math.round(p.x / 100)));
        ellipse(ctx, x, pts[i][1] + 14 + j * 6, p.w / 2, 9 + j * 4);
      }
    }
    if (j === 0) {
      // far standing stones on the crest line
      ctx.fillStyle = '#8e8a9e';
      for (const s of farStones) {
        const x = s.x - camX * f;
        if (x < -40 || x > W + 40) continue;
        const i = Math.min(pts.length - 1, Math.max(0, Math.round((((s.x % span) + span) % span) / 100)));
        const y = pts[i][1] + 4;
        ctx.fillRect(x - s.w / 2, y - s.h, s.w, s.h);
        if (s.lintel) {
          ctx.fillRect(x + s.w * 1.4, y - s.h, s.w, s.h);
          ctx.fillRect(x - s.w * 0.8, y - s.h - 5, s.w * 3.4, 6);
        }
      }
    }
  });
  ctx.fillStyle = 'rgba(220,230,245,0.18)'; // haze
  ctx.fillRect(0, 0, W, H);
}

// The road: old flagstones laid along the crest through turf and heather, a few missing; turf and heather
// at the edges, thicker toward the west
function drawRoad(ctx, L, R, time) {
  ctx.fillStyle = vgrad(ctx, 'turf', GROUND, H, [[0, '#7e9a62'], [1, '#5e7a4a']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = '#8a8698';
  ctx.fillRect(L, GROUND + 4, R - L, 16);
  for (const f of flags) {
    if (!visible(f.x, f.x + f.w, L, R) || f.gone) continue;
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.roundRect(f.x + 2, GROUND + 2, f.w - 4, 14, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(f.x + 5, GROUND + 3, f.w - 10, 2);
    if (f.moss) {
      ctx.fillStyle = MOSS;
      ellipse(ctx, f.x + f.w * 0.3, GROUND + 3, 8, 2.5);
    }
  }
  ctx.fillStyle = 'rgba(60,80,50,0.25)';
  ctx.fillRect(L, GROUND + 18, R - L, 3);
  // tufts of grass and heather along the edge, bending in the wind
  for (const t of tufts) {
    if (t.x < L || t.x > R) continue;
    const bend = Math.sin(time * 2.4 + t.x * 0.05) * 3 + 3;
    const y = t.front ? GROUND + 26 : GROUND + 2;
    if (t.heather) {
      ctx.strokeStyle = '#5e7a4a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(t.x, y);
      ctx.lineTo(t.x + bend, y - 12 * t.s);
      ctx.stroke();
      ctx.fillStyle = HEATHER;
      for (let i = 0; i < 4; i++) circle(ctx, t.x + bend * (0.4 + i * 0.2) + (i % 2 ? 1.8 : -1.8), y - (4 + i * 2.4) * t.s, 1.8 * t.s);
    } else {
      ctx.strokeStyle = '#8ab46a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (const d of [-3, 0, 3]) {
        ctx.moveTo(t.x + d, y);
        ctx.quadraticCurveTo(t.x + d + bend * 0.5, y - 7 * t.s, t.x + d + bend, y - 12 * t.s);
      }
      ctx.stroke();
    }
  }
}

// A lone standing stone beside the road, leaning a little, a gear carved on some, lichen and moss
function drawRoadStone(ctx, s, time) {
  ctx.save();
  ctx.translate(s.x, GROUND + 2);
  ctx.rotate(s.tilt);
  ctx.fillStyle = STONE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-s.w / 2, -s.h, s.w, s.h, [s.w * 0.4, s.w * 0.4, 2, 2]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE_L;
  ctx.fillRect(-s.w / 2 + 4, -s.h + 10, s.w * 0.22, s.h - 16);
  if (s.gear) gear(ctx, 2, -s.h * 0.55, s.w * 0.22, 10, 'rgba(78,74,94,0.7)');
  ctx.fillStyle = 'rgba(232,210,120,0.7)';
  circle(ctx, -s.w * 0.15, -s.h * 0.3, 2.4);
  ctx.fillStyle = MOSS;
  ellipse(ctx, 0, -s.h + 4, s.w * 0.45, 5);
  ctx.restore();
}

// Rock outcrops on the Heather Slopes: knobbly grey rock with a flat top, heather round its foot
function drawOutcrop(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = STONE_D;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 6, y);
  ctx.lineTo(x + w - 6, y);
  ctx.quadraticCurveTo(x + w + 6, y + 30, x + w - 18, GROUND + 2);
  ctx.lineTo(x + 18, GROUND + 2);
  ctx.quadraticCurveTo(x - 6, y + 30, x + 6, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 14, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE_L;
  ctx.fillRect(x + 8, y - 1, w * 0.5, 3);
  ctx.strokeStyle = 'rgba(78,74,94,0.45)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + 14);
  ctx.lineTo(x + w * 0.36, y + 40);
  ctx.lineTo(x + w * 0.3, y + 64);
  ctx.moveTo(x + w * 0.7, y + 20);
  ctx.lineTo(x + w * 0.64, y + 60);
  ctx.stroke();
  ctx.fillStyle = MOSS;
  ellipse(ctx, x + w * 0.75, y - 3, 18, 4);
  ctx.fillStyle = HEATHER;
  for (let i = 0; i < 6; i++) circle(ctx, x + 10 + i * (w - 20) / 5, GROUND - 2 + Math.sin(time * 2 + i) * 1, 4);
}

// A trilithon: two great upright stones and a lintel laid across them (the lintel's top is the platform)
function drawTrilithon(ctx, p, time) {
  const { x, y, w } = p;
  for (const k of [0.16, 0.84]) {
    const cx = x + w * k;
    ctx.fillStyle = STONE_D;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cx - 18, y + 12, 36, GROUND - y - 10, [4, 4, 2, 2]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = STONE;
    ctx.fillRect(cx - 14, y + 16, 9, GROUND - y - 20);
    gear(ctx, cx + 2, y + (GROUND - y) * 0.55, 7, 10, 'rgba(78,74,94,0.65)');
  }
  ctx.fillStyle = STONE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 4, w + 12, 18, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE_L;
  ctx.fillRect(x + 2, y - 1, w - 4, 4);
  ctx.fillStyle = MOSS;
  ellipse(ctx, x + w * 0.35, y - 4, 20, 4);
  ellipse(ctx, x + w * 0.8, y - 3, 12, 3);
}

// The tops of the Crest's ruined walls (platforms), coursed stone, broken off ragged at the ends
function drawWallTop(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = STONE_D;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w + 6, y + 30);
  ctx.lineTo(x + w - 4, y + 60);
  ctx.lineTo(x + w + 4, GROUND + 2);
  ctx.lineTo(x - 4, GROUND + 2);
  ctx.lineTo(x + 4, y + 50);
  ctx.lineTo(x - 6, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE;
  for (let yy = y + 14, row = 0; yy < GROUND - 10; yy += 24, row++) {
    for (let xx = x + (row % 2 ? 14 : 2); xx < x + w - 20; xx += 40) ctx.fillRect(xx, yy, 36, 20);
  }
  ctx.fillStyle = STONE_L;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, 12, 4);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  root(ctx, x + w + 30, GROUND, x + w + 10, y + 40, x + w * 0.7, y + 4, 7);
  ctx.fillStyle = MOSS;
  ellipse(ctx, x + w * 0.3, y - 3, 22, 4);
}

// Ruined Keeper walls standing behind the road on the Crest, some with a broken arch
function drawRuinWall(ctx, wl, time) {
  const { x, w, h, arch } = wl, top = GROUND - h;
  ctx.fillStyle = '#9894a8';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, GROUND);
  ctx.lineTo(x, top + 20);
  ctx.lineTo(x + w * 0.2, top);
  ctx.lineTo(x + w * 0.45, top + 26);
  ctx.lineTo(x + w * 0.7, top + 8);
  ctx.lineTo(x + w, top + 40);
  ctx.lineTo(x + w, GROUND);
  if (arch) {
    const ax = x + w / 2, aw = Math.min(30, w * 0.22);
    ctx.lineTo(ax + aw, GROUND);
    ctx.lineTo(ax + aw, GROUND - h * 0.45);
    ctx.arc(ax, GROUND - h * 0.45, aw, 0, Math.PI, true);
    ctx.lineTo(ax - aw, GROUND);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(196,192,208,0.5)';
  for (let yy = top + 34, row = 0; yy < GROUND - 14; yy += 22, row++) {
    for (let xx = x + (row % 2 ? 12 : 4); xx < x + w - 30; xx += 38) {
      if (arch && Math.abs(xx + 17 - (x + w / 2)) < 50 && yy > GROUND - h * 0.45 - 30) continue;
      ctx.fillRect(xx, yy, 34, 18);
    }
  }
  gear(ctx, x + w * 0.25, top + 50, 10, 12, 'rgba(78,74,94,0.5)');
  ctx.fillStyle = MOSS;
  ellipse(ctx, x + w * 0.2, top + 2, 18, 5);
}

// The Watch Seat: a stone seat carved into the tallest trilithon's capstone, turned to face the sea, with a
// little cairn of pebbles that visitors have left, a heather posy, and a gear carved on the backrest
function drawWatchSeat(ctx, p, time) {
  const { x, y, w } = p;
  // its uprights stand on the trilithon below it (stacked, the way the Keepers built the tallest ones)
  const under = SPINE_PLATFORMS.find((q) => q !== p && q.y > y && x + w / 2 > q.x && x + w / 2 < q.x + q.w);
  const base = under ? under.y - 2 : GROUND;
  for (const k of [0.15, 0.85]) {
    const cx = x + w * k;
    ctx.fillStyle = STONE_D;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cx - 15, y + 12, 30, base - y - 10, [4, 4, 2, 2]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = STONE;
    ctx.fillRect(cx - 11, y + 16, 7, base - y - 20);
  }
  ctx.fillStyle = STONE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 4, w + 12, 18, 5);
  ctx.fill();
  ctx.stroke();
  // the seat's back
  ctx.beginPath();
  ctx.roundRect(x + w - 30, y - 44, 22, 44, [8, 8, 0, 0]);
  ctx.fill();
  ctx.stroke();
  gear(ctx, x + w - 19, y - 26, 5, 10, LINE, 1.4);
  // the cairn and the posy
  ctx.fillStyle = '#d0ccd8';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  for (const [dx, dy, r] of [[14, -4, 6], [24, -4, 5], [19, -12, 4.5], [19, -18, 3]]) {
    circle(ctx, x + dx, y + dy, r);
    ctx.stroke();
  }
  ctx.fillStyle = HEATHER;
  for (let i = 0; i < 5; i++) circle(ctx, x + w * 0.5 + i * 3 - 6, y - 8 - (i % 2) * 3, 2.4);
  ctx.strokeStyle = '#5e7a4a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y - 2);
  ctx.lineTo(x + w * 0.5 - 2, y - 8);
  ctx.stroke();
}

// On the Crest the great roots come up out of the turf and run east along the road, toward the Warden
function drawCrestRoots(ctx, L, R, time) {
  for (let x = CREST_X; x < SPINE_W - 200; x += 360) {
    if (!visible(x - 200, x + 400, L, R)) continue;
    const k = (x - CREST_X) / (SPINE_W - CREST_X);
    root(ctx, x - 60, GROUND + 24, x + 80, GROUND - 26 - 20 * k, x + 340, GROUND + 18, 10 + 10 * k);
  }
}

// The fallen trunk at the way down, from this side: its end sawn through, the cut wedge rolled aside and
// steps notched into it
function drawCutTrunk(ctx, time) {
  const x = SPINE_EXIT_X, b = GROUND + 2;
  ctx.fillStyle = '#6e5442';
  ctx.strokeStyle = '#3e2c22';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 140, b);
  ctx.lineTo(x - 140, b - 130);
  ctx.quadraticCurveTo(x - 60, b - 150, x - 20, b - 120);
  ctx.lineTo(x - 20, b);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the sawn face, pale rings
  ctx.fillStyle = '#e0c49a';
  ctx.beginPath();
  ctx.ellipse(x - 20, b - 62, 22, 60, 0, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(140,100,60,0.55)';
  ctx.lineWidth = 1.2;
  for (const r of [0.75, 0.5, 0.28]) {
    ctx.beginPath();
    ctx.ellipse(x - 20, b - 62, 22 * r, 60 * r, 0, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  }
  // steps notched up it
  ctx.fillStyle = '#4e3a2c';
  for (let i = 0; i < 4; i++) ctx.fillRect(x - 120 + i * 22, b - 24 - i * 26, 18, 6);
  // the cut wedge, rolled aside
  ctx.fillStyle = '#7a5e48';
  ctx.strokeStyle = '#3e2c22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x + 60, b - 22, 40, 22, 0.1, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e0c49a';
  ellipse(ctx, x + 96, b - 20, 8, 20, 0.1);
  ctx.fillStyle = '#86b46a';
  ellipse(ctx, x - 80, b - 140, 30, 7, -0.1);
  // sawdust
  ctx.fillStyle = 'rgba(224,196,154,0.8)';
  for (let i = 0; i < 8; i++) circle(ctx, x - 10 + i * 9, b - 1 - (i % 3), 2);
}

// The zones' markers: a short standing stone with the name cut in it and a level chip
function drawZoneStone(ctx, x, z, i, time) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.save();
  ctx.translate(x, GROUND - 46);
  ctx.fillStyle = STONE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -30, tw, 78, [14, 14, 2, 2]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE_L;
  ctx.fillRect(-tw / 2 + 6, -24, tw * 0.15, 66);
  text(ctx, z.name, 0, -11, 15, '#3e3a4e');
  ctx.fillStyle = i === 3 ? '#e0565a' : 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.roundRect(-32, 2, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 10.5, 11, i === 3 ? '#fffaf0' : '#3e3a4e');
  gear(ctx, 0, 34, 6, 10, 'rgba(78,74,94,0.6)', 1.4);
  ctx.fillStyle = MOSS;
  ellipse(ctx, tw * 0.25, -30, 16, 4);
  ctx.restore();
}

// The way back down to the Canopy
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.6) * 0.03);
  ctx.fillStyle = '#e2bf8f';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, -12);
  ctx.lineTo(-54, -12);
  ctx.lineTo(-66, 0);
  ctx.lineTo(-54, 12);
  ctx.lineTo(60, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Down to the Canopy', -2, 1, 11, '#5b4a6b');
  ctx.restore();
}

// Wind: streaks blowing across the whole view, and heather petals carried along with it
function drawWind(ctx, camX, time) {
  ctx.lineCap = 'round';
  for (const g of gusts) {
    const x = ((g.x - camX * 0.6 + time * g.v) % (W + 200) + W + 200) % (W + 200) - 100;
    const y = g.y + Math.sin(time * 1.3 + g.p) * 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + g.len * 0.5, y - 4, x + g.len, y);
    ctx.stroke();
  }
  ctx.fillStyle = HEATHER;
  for (const p of petals) {
    const x = ((p.x - camX * 0.5 + time * p.v) % (W + 40) + W + 40) % (W + 40) - 20;
    const y = ((p.y + Math.sin(time * 2 + p.p) * 20 + time * 12) % H + H) % H;
    ellipse(ctx, x, y, p.s * 1.4, p.s * 0.8, time * 3 + p.p);
  }
}
