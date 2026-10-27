// Docs: docs/places/tubes.md
// The Drained Tubes (room TUBES, a hard pocket; data in src/shared/rpg.js): old lava tubes, long cold, running down
// into the Smoking Coast's old sea cliff from the tube mouth at TUBES_GATE_X (the steam that roared out of it until E2
// drained away). Black basalt walls with the flow's old tide-lines in them and a skin of glass that glints; holes in
// the roof (skylights) letting down thin daylight; here and there lava still drips from the roof and sets where it
// lands. You come in at the EAST end, at the foot of the old steps, and go west, deeper and darker: the Tube Mouth
// (no mobs: the steps up to daylight, the last puddles of the sea that got in, a tide-line of salt), the Glass
// Galleries and the Deep Tube, scorched in a long burnt stripe down the floor where Hundredfoot runs. The Skylight
// (last in TUBES_PLATFORMS), a ledge high under the biggest hole in the roof with the island's thermal column in
// view through it, is the find.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { TUBES_W, TUBES_EXIT_X, TUBES_ZONES, TUBES_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const MOUTH_X = TUBES_ZONES[2].x0;
const DEEP_X1 = TUBES_ZONES[0].x1;
const SKY = TUBES_PLATFORMS.at(-1);
const ROCK = '#2e2830', ROCK_D = '#161216', ROCK_L = '#4a4048';
const GLASS_L = 'rgba(190,200,225,';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

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
// the roof's line: an arch that dips and rises along the tube
const ROOF_Y = (x) => 70 + 26 * Math.sin(x / 520) + 14 * Math.sin(x / 190 + 1.3);
// skylights: holes in the roof where it fell in, a blade of daylight down each; the biggest over the Skylight ledge
const holes = (() => {
  const r = mulberry32(5801);
  const out = [{ x: SKY.x + SKY.w / 2, w: 90, big: true }];
  for (let x = 500; x < MOUTH_X - 100; x += 520 + r() * 360) {
    if (Math.abs(x - out[0].x) < 300) continue;
    out.push({ x, w: 28 + r() * 30, big: false });
  }
  return out;
})();
// the flow's old tide-lines in the walls: long wavy bands at the heights the lava once ran
const bands = [150, 205, 262, 318];
// glints in the glass skin of the walls
const glints = (() => {
  const r = mulberry32(5811);
  return Array.from({ length: 90 }, () => ({ x: r() * TUBES_W, y: 110 + r() * 300, p: r() * TAU }));
})();
// roof drips: little glowing stalactites (drawing only; the lava drips that spit are mobs)
const drips = (() => {
  const r = mulberry32(5821);
  return Array.from({ length: 70 }, () => ({ x: r() * TUBES_W, len: 8 + r() * 26, hot: r() < 0.3, p: r() }));
})();
// fallen roof blocks on the floor (not platforms)
const blocks = (() => {
  const r = mulberry32(5831);
  const out = [];
  for (let x = 380; x < MOUTH_X - 100; x += 380 + r() * 420) {
    if (TUBES_PLATFORMS.some((p) => x > p.x - 40 && x < p.x + p.w + 40)) continue;
    out.push({ x, w: 30 + r() * 40, h: 14 + r() * 18 });
  }
  return out;
})();
const motes = (() => {
  const r = mulberry32(5841);
  return Array.from({ length: 40 }, () => ({ x: r() * TUBES_W, y: 120 + r() * 280, p: r(), v: 0.03 + r() * 0.05 }));
})();

// Everything behind the slimes. camX is the left edge of the view.
export function drawTubes(ctx, camX, viewW, time) {
  const L = camX - 160, R = camX + viewW + 160;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'back', 0, GROUND, [[0, '#0c0a0e'], [0.5, '#1c161c'], [1, '#2e2428']]);
  ctx.fillRect(L, 0, R - L, H);
  drawWalls(ctx, L, R, time);
  for (const h of holes) if (visible(h.x - 160, h.x + 160, L, R)) drawShaft(ctx, h, time);
  for (const b of blocks) if (visible(b.x - b.w, b.x + b.w, L, R)) drawBlock(ctx, b);
  for (const p of TUBES_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'ledge') drawLedge(ctx, p, time);
  }
  if (visible(SKY.x - 80, SKY.x + SKY.w + 80, L, R)) drawSkylight(ctx, SKY, time);
  drawRoof(ctx, L, R, time);
  if (visible(MOUTH_X - 100, TUBES_W, L, R)) drawMouth(ctx, time);
  drawFloor(ctx, Math.max(0, L), Math.min(TUBES_W, R), time);
  TUBES_ZONES.forEach((z) => {
    if (!z.lvl) return;
    const sx = z.x1 - 90; // (each zone's sign at its east edge: you walk in from the east)
    if (visible(sx - 90, sx + 90, L, R)) drawZoneMark(ctx, sx, z);
  });
  if (visible(TUBES_EXIT_X - 300, TUBES_EXIT_X, L, R)) drawExitSign(ctx, TUBES_EXIT_X - 110, time);
  // warm motes drifting up
  for (const m of motes) {
    if (m.x < L || m.x > R) continue;
    const k = (time * m.v + m.p) % 1;
    ctx.fillStyle = `rgba(255,170,110,${0.35 * Math.sin(k * Math.PI)})`;
    circle(ctx, m.x + Math.sin(k * 8 + m.p * 9) * 8, m.y - k * 60, 1.5);
  }
  // the deeper (further west), the darker
  const dk = Math.min(1, Math.max(0, (DEEP_X1 + 400 - (camX + viewW / 2)) / 800));
  if (dk > 0) {
    ctx.fillStyle = `rgba(6,4,8,${0.25 * dk})`;
    ctx.fillRect(L, 0, R - L, H);
  }
  ctx.restore();
}

function drawWalls(ctx, L, R, time) {
  // the flow's tide-lines
  ctx.lineWidth = 3;
  bands.forEach((by, i) => {
    ctx.strokeStyle = i % 2 ? 'rgba(74,64,72,0.55)' : 'rgba(22,18,22,0.6)';
    ctx.beginPath();
    for (let x = Math.floor(L / 40) * 40; x <= R; x += 40) {
      const y = by + 6 * Math.sin(x / 210 + i * 1.7) + 3 * Math.sin(x / 70 + i);
      if (x === Math.floor(L / 40) * 40) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
  // the glass skin glinting
  for (const g of glints) {
    if (g.x < L || g.x > R) continue;
    const a = 0.12 + 0.22 * Math.max(0, Math.sin(time * 0.8 + g.p));
    ctx.fillStyle = GLASS_L + a + ')';
    ctx.beginPath();
    ctx.moveTo(g.x, g.y - 4);
    ctx.lineTo(g.x + 1.5, g.y);
    ctx.lineTo(g.x, g.y + 4);
    ctx.lineTo(g.x - 1.5, g.y);
    ctx.closePath();
    ctx.fill();
  }
}

// A skylight's blade of daylight down from a hole in the roof
function drawShaft(ctx, h, time) {
  const top = ROOF_Y(h.x) + 10, a = (h.big ? 0.2 : 0.13) + 0.03 * Math.sin(time * 0.7 + h.x);
  ctx.fillStyle = `rgba(255,236,210,${a})`;
  ctx.beginPath();
  ctx.moveTo(h.x - h.w / 2, top);
  ctx.lineTo(h.x + h.w / 2, top);
  ctx.lineTo(h.x + h.w * 0.9, GROUND);
  ctx.lineTo(h.x - h.w * 0.9, GROUND);
  ctx.closePath();
  ctx.fill();
  glow(ctx, h.x, GROUND, h.w * 1.4, 14, '255,230,200', 0.25);
}

function drawBlock(ctx, b) {
  ctx.fillStyle = ROCK;
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(b.x - b.w / 2, GROUND + 2);
  ctx.lineTo(b.x - b.w * 0.4, GROUND - b.h);
  ctx.lineTo(b.x + b.w * 0.3, GROUND - b.h - 4);
  ctx.lineTo(b.x + b.w / 2, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ROCK_L;
  ctx.fillRect(b.x - b.w * 0.3, GROUND - b.h + 2, b.w * 0.4, 2);
}

// A ledge: a bench of old basalt along the wall, where the lava once ran higher and left a shelf; glassy on top
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = ROCK;
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x + w + 6, y);
  ctx.quadraticCurveTo(x + w, y + 30, x + w - 24, y + 34);
  ctx.quadraticCurveTo(x + w / 2, y + 44, x + 18, y + 32);
  ctx.quadraticCurveTo(x - 4, y + 24, x - 6, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1e1a22'; // the glass rim
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 4, w + 12, 9, 4);
  ctx.fill();
  ctx.fillStyle = GLASS_L + '0.45)';
  ctx.fillRect(x + 8, y - 2, w * 0.35, 2);
  // the ropy underside, a few runs of old flow
  ctx.strokeStyle = ROCK_L;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + w * (0.25 + i * 0.25), y + 14, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
}

// The Skylight (the find): a ledge high under the biggest hole in the roof. Through the hole, the island's thermal
// column, a great pale pillar of heat and smoke rising out of the cone, far off in a hot white sky. Somebody wedged a
// flat stone there to sit on, long ago, and the stone is warm
function drawSkylight(ctx, p, time) {
  const { x, y, w } = p;
  const cx = x + w / 2, top = ROOF_Y(cx) - 70;
  // the hole: sky through it, the column standing in it
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, ROOF_Y(cx) + 6, 56, 46, 0, 0, TAU);
  ctx.clip();
  ctx.fillStyle = vgrad(ctx, 'skyhole', top, ROOF_Y(cx) + 50, [[0, '#f2e6d8'], [1, '#d8b8a0']]);
  ctx.fillRect(cx - 60, top, 120, 140);
  // the thermal column, leaning a little, its edges boiling
  for (let i = 0; i < 6; i++) {
    const k = (time * 0.08 + i / 6) % 1, yy = ROOF_Y(cx) + 40 - k * 120;
    ctx.fillStyle = `rgba(150,136,140,${0.55 * Math.sin(k * Math.PI)})`;
    circle(ctx, cx + 10 + k * 12 + Math.sin(i * 2 + time * 0.5) * 4, yy, 12 + k * 8);
  }
  ctx.fillStyle = 'rgba(120,104,110,0.75)';
  ctx.beginPath();
  ctx.moveTo(cx + 2, ROOF_Y(cx) + 50);
  ctx.lineTo(cx + 18, ROOF_Y(cx) + 50);
  ctx.lineTo(cx + 26, top);
  ctx.lineTo(cx + 12, top);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  glow(ctx, cx, y - 30, 70, 50, '255,236,210', 0.25 + 0.05 * Math.sin(time));
  drawLedge(ctx, p);
  // the sitting stone
  ctx.fillStyle = '#5a4e54';
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(cx - 18, y - 9, 36, 8, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,170,110,0.25)';
  ellipse(ctx, cx, y - 6, 14, 2.5);
}

function drawRoof(ctx, L, R, time) {
  ctx.fillStyle = ROCK_D;
  ctx.beginPath();
  ctx.moveTo(L, 0);
  for (let x = Math.floor(L / 30) * 30; x <= R + 30; x += 30) ctx.lineTo(x, ROOF_Y(x));
  ctx.lineTo(R + 30, 0);
  ctx.closePath();
  ctx.fill();
  // the holes in the roof (the big one is drawn with the Skylight)
  for (const h of holes) {
    if (h.big || !visible(h.x - 60, h.x + 60, L, R)) continue;
    const ry = ROOF_Y(h.x);
    ctx.fillStyle = '#e8d6c4';
    ellipse(ctx, h.x, ry - 8, h.w / 2, 12);
    ctx.fillStyle = ROCK_D;
    ellipse(ctx, h.x, ry - 18, h.w / 2 + 4, 8);
  }
  // the rim of the roof, glassy
  ctx.strokeStyle = 'rgba(90,80,90,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = Math.floor(L / 30) * 30; x <= R + 30; x += 30) {
    if (x === Math.floor(L / 30) * 30) ctx.moveTo(x, ROOF_Y(x));
    else ctx.lineTo(x, ROOF_Y(x));
  }
  ctx.stroke();
  // drips on the roof, a few still hot
  for (const d of drips) {
    if (d.x < L || d.x > R) continue;
    const ry = ROOF_Y(d.x);
    ctx.fillStyle = d.hot ? '#4a2a26' : ROCK;
    ctx.beginPath();
    ctx.moveTo(d.x - 4, ry);
    ctx.lineTo(d.x + 4, ry);
    ctx.lineTo(d.x, ry + d.len);
    ctx.closePath();
    ctx.fill();
    if (d.hot) {
      const k = (time * 0.5 + d.p) % 1;
      ctx.fillStyle = `rgba(255,130,60,${0.9 - k * 0.6})`;
      circle(ctx, d.x, ry + d.len + k * 4, 1.8);
    }
  }
}

// The Tube Mouth (no mobs): the foot of the old steps up into daylight, the last puddles of the sea that got in, a
// tide-line of white salt along the wall where the boiling water stood, and an iron hand-chain pegged up the steps
function drawMouth(ctx, time) {
  const x0 = TUBES_W - 260;
  glow(ctx, TUBES_W - 60, GROUND - 160, 260, 200, '255,236,210', 0.35);
  // the steps, going up to the east into the light
  for (let i = 0; i < 8; i++) {
    const sx = x0 + i * 30, sy = GROUND - i * 20;
    ctx.fillStyle = i % 2 ? '#3e363c' : ROCK;
    ctx.fillRect(sx, sy - 20, TUBES_W - sx, 20);
    ctx.fillStyle = ROCK_L;
    ctx.fillRect(sx, sy - 20, 30, 3);
  }
  ctx.strokeStyle = '#8a8490'; // the hand-chain
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const cx = x0 + i * 30 + 6, cy = GROUND - i * 20 - 44 + (i % 2 ? 4 : 0);
    if (i) ctx.lineTo(cx, cy);
    else ctx.moveTo(cx, cy);
  }
  ctx.stroke();
  // the salt tide-line along the wall
  ctx.strokeStyle = 'rgba(238,234,228,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MOUTH_X - 400, GROUND - 52);
  ctx.quadraticCurveTo(MOUTH_X, GROUND - 62, x0, GROUND - 58);
  ctx.stroke();
  // the last puddles
  for (const [px, pw] of [[MOUTH_X + 120, 70], [MOUTH_X + 330, 50]]) {
    ctx.fillStyle = 'rgba(60,90,96,0.85)';
    ellipse(ctx, px, GROUND + 6, pw, 5);
    ctx.fillStyle = `rgba(200,230,236,${0.35 + 0.1 * Math.sin(time * 1.5 + px)})`;
    ellipse(ctx, px - pw * 0.3, GROUND + 5, pw * 0.25, 1.5);
  }
}

function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = vgrad(ctx, 'floor', GROUND, H, [[0, '#4a4048'], [0.25, '#2a2228'], [1, '#100c10']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = 'rgba(190,200,225,0.25)';
  ctx.fillRect(L, GROUND - 1, R - L, 3);
  // ropy flow folds in the floor
  ctx.strokeStyle = 'rgba(22,18,22,0.6)';
  ctx.lineWidth = 1.5;
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) {
    ctx.beginPath();
    ctx.arc(x + 40, GROUND + 22, 16, Math.PI * 1.1, Math.PI * 1.9);
    ctx.arc(x + 40, GROUND + 34, 22, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  // Hundredfoot's burnt stripe down the Deep Tube
  if (L < DEEP_X1) {
    ctx.fillStyle = 'rgba(10,6,8,0.45)';
    ctx.fillRect(L, GROUND + 4, Math.min(R, DEEP_X1 - 100) - L, 10);
  }
}

// The zones' markers: a slab of basalt with the name scratched in, a red level chip (a hard pocket)
function drawZoneMark(ctx, x, z) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.save();
  ctx.translate(x, GROUND - 60);
  ctx.fillStyle = '#4a4048';
  ctx.strokeStyle = ROCK_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, -26);
  ctx.lineTo(tw / 2, -24);
  ctx.lineTo(tw / 2 + 4, 60);
  ctx.lineTo(-tw / 2 - 6, 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#f2e6d8');
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.roundRect(-32, 4, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 12.5, 11, '#fffaf0');
  ctx.restore();
}

// The way back up to the Coast
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = '#6e5240';
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
  text(ctx, 'Up to the Coast', 2, 1, 11, '#5b4a6b');
  ctx.restore();
}
