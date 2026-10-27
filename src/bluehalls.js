// Docs: docs/places/bluehalls.md, docs/places/oldice.md
// The Blue Halls (room BLUEHALLS, a hard pocket; data in src/shared/rpg.js): ice caves inside the Rimeglass
// Glacier, under the Crevasse Field, down the cutters' mended ladder. Deep blue everywhere: walls of old
// glacier ice with stones and strings of air bubbles frozen in them, thin blades of daylight coming down
// through cracks in the roof, columns where the roof's icicles met the floor. West to east: the Ladder Foot
// (no mobs: the new ladder up into a slit of daylight, the old smashed one piled beside it, a cutters'
// lantern), the Blue Halls (a frozen waterfall, columns) and the Deep Blue, darker, where the Hall Troll has
// stacked walls of ice blocks it cut for itself, for nothing. The Cutters' Niche, high in the first hall's
// wall (last in BLUEHALLS_PLATFORMS), with generations of cutters' names scratched round an old pick frozen
// into the ice, is the hidden spot.
// FB2 (b) (docs/places/oldice.md): one of the troll's walls at the east end has fallen over, showing the way down
// to the Old Ice (drawn by OPEN.fallenwall in src/branch-gates.js); beside it the cutters' record is carved in the
// ice (drawRecord); and thin ice in the floor (THIN_ICE) cracks under whoever stands on it (drawThinIce).
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { BLUEHALLS_W, BLUEHALLS_EXIT_X, BLUEHALLS_ZONES, BLUEHALLS_PLATFORMS, FIELD_GROUND, OLDICE_GATE_X, THIN_ICE, THIN_ICE_HOLD } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const DEEP_X = BLUEHALLS_ZONES[2].x0;
const NICHE = BLUEHALLS_PLATFORMS.at(-1);
const RECORD_X = OLDICE_GATE_X - 500; // the cutters' record, carved in the ice west of the way down (clear of the shelves)
const ICE = '#4e8ad0', ICE_D = '#1e4a8a', ICE_L = '#a8d4fa', ICE_LINE = '#0e2a5a';
const WOOD = '#8a6a48', WOOD_D = '#4e3a2c';
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
const roofIcicles = (() => {
  const r = mulberry32(4101);
  return Array.from({ length: 130 }, () => ({ x: r() * BLUEHALLS_W, len: 20 + r() * 80, w: 6 + r() * 16 }));
})();
// cracks in the roof letting thin blades of daylight down
const shafts = (() => {
  const r = mulberry32(4111);
  const out = [];
  for (let x = 700; x < BLUEHALLS_W - 200; x += 420 + r() * 380) out.push({ x, w: 14 + r() * 22, lean: (r() - 0.5) * 0.25, p: r() * TAU, deep: x > DEEP_X });
  return out;
})();
// stones and strings of bubbles frozen in the walls
const stones = (() => {
  const r = mulberry32(4121);
  return Array.from({ length: 70 }, () => ({ x: r() * BLUEHALLS_W, y: 70 + r() * 320, rx: 4 + r() * 14, ry: 3 + r() * 9, a: r() * TAU, c: ['#2a3a5a', '#3a4a66', '#4a4e62'][Math.floor(r() * 3)] }));
})();
const bubbles = (() => {
  const r = mulberry32(4131);
  return Array.from({ length: 40 }, () => ({ x: r() * BLUEHALLS_W, y: 80 + r() * 300, n: 4 + Math.floor(r() * 8), a: (r() - 0.5) * 0.6 }));
})();
// columns, where an icicle from the roof met one growing up from the floor (not platforms)
const columns = (() => {
  const r = mulberry32(4141);
  const out = [];
  for (let x = 650; x < BLUEHALLS_W - 100; x += 300 + r() * 360) {
    if (BLUEHALLS_PLATFORMS.some((p) => x > p.x - 60 && x < p.x + p.w + 60)) continue;
    out.push({ x, w: 30 + r() * 30, waist: 0.35 + r() * 0.3 });
  }
  return out;
})();
// the troll's walls in the Deep Blue: rows of cut blocks stacked for no reason anyone knows
const walls = (() => {
  const r = mulberry32(4151);
  const out = [];
  for (let x = DEEP_X + 200; x < BLUEHALLS_W - 200; x += 500 + r() * 300) out.push({ x, n: 3 + Math.floor(r() * 3), rows: 2 + Math.floor(r() * 3) });
  return out.filter((w) => w.x + w.n * 40 < RECORD_X - 90); // (the last one fell over: the way down to the Old Ice)
})();
const drips = (() => {
  const r = mulberry32(4161);
  return Array.from({ length: 30 }, () => ({ x: r() * BLUEHALLS_W, v: 0.3 + r() * 0.5, p: r() }));
})();
const motes = (() => {
  const r = mulberry32(4171);
  return Array.from({ length: 40 }, () => ({ x: r() * BLUEHALLS_W, y: 60 + r() * 330, p: r(), v: 0.03 + r() * 0.05 }));
})();
const FALL_X = 1420; // the frozen waterfall in the first hall

// Everything behind the slimes. camX is the left edge of the view.
export function drawBlueHalls(ctx, camX, viewW, time, feet = []) {
  const L = camX - 160, R = camX + viewW + 160;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'back', 0, GROUND, [[0, '#06122e'], [0.5, '#0e2a5e'], [1, '#1e4a8a']]);
  ctx.fillRect(L, 0, R - L, H);
  drawBackWall(ctx, L, R, time);
  for (const s of shafts) if (visible(s.x - 120, s.x + 120, L, R)) drawShaft(ctx, s, time);
  if (visible(FALL_X - 80, FALL_X + 120, L, R)) drawWaterfall(ctx, FALL_X, time);
  for (const c of columns) if (visible(c.x - c.w, c.x + c.w, L, R)) drawColumn(ctx, c);
  for (const w of walls) if (visible(w.x - 20, w.x + w.n * 40 + 20, L, R)) drawTrollWall(ctx, w);
  if (visible(RECORD_X - 110, RECORD_X + 110, L, R)) drawRecord(ctx, RECORD_X, time);
  for (const p of BLUEHALLS_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'shelf') drawShelf(ctx, p, time);
  }
  if (visible(NICHE.x - 80, NICHE.x + NICHE.w + 80, L, R)) drawNiche(ctx, NICHE, time);
  drawRoof(ctx, L, R, time);
  if (visible(-80, 620, L, R)) drawLadderFoot(ctx, time);
  drawFloor(ctx, Math.max(0, L), Math.min(BLUEHALLS_W, R), time);
  thinIceTick(feet, time);
  THIN_ICE.forEach((p, i) => visible(p.x - p.w, p.x + p.w, L, R) && drawThinIce(ctx, p, crack[i], time));
  BLUEHALLS_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 80;
    if (visible(sx - 90, sx + 90, L, R)) drawZoneMark(ctx, sx, z, time);
  });
  if (visible(BLUEHALLS_EXIT_X, BLUEHALLS_EXIT_X + 300, L, R)) drawExitSign(ctx, BLUEHALLS_EXIT_X + 100, time);
  // motes of light drifting in the blue
  for (const m of motes) {
    if (m.x < L || m.x > R) continue;
    const k = (time * m.v + m.p) % 1;
    ctx.fillStyle = `rgba(190,225,255,${0.45 * Math.sin(k * Math.PI)})`;
    circle(ctx, m.x + Math.sin(k * 8 + m.p * 9) * 8, m.y - k * 60, 1.8);
  }
  // the deeper, the darker
  const dk = Math.min(1, Math.max(0, (camX + viewW / 2 - DEEP_X + 400) / 800));
  if (dk > 0) {
    ctx.fillStyle = `rgba(4,10,30,${0.22 * dk})`;
    ctx.fillRect(L, 0, R - L, H);
  }
  ctx.restore();
}

function drawBackWall(ctx, L, R, time) {
  const x0 = Math.floor(L / 170) * 170;
  for (let x = x0; x < R + 200; x += 170) {
    const r = mulberry32(Math.round(x) + 41), i = Math.round(x / 170);
    const top = 40 + r() * 70, bot = GROUND - 8;
    ctx.fillStyle = i % 2 ? '#123a74' : '#174480';
    ctx.beginPath();
    ctx.moveTo(x, top + 24);
    ctx.lineTo(x + 80 + r() * 50, top);
    ctx.lineTo(x + 190, top + 34);
    ctx.lineTo(x + 200, bot);
    ctx.lineTo(x - 10, bot);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(168,212,250,0.07)';
    ctx.fillRect(x + 24, top + 34, 26, bot - top - 44);
    // banding: the glacier's old layers
    ctx.strokeStyle = 'rgba(120,170,230,0.12)';
    ctx.lineWidth = 3;
    for (let k = 0; k < 3; k++) {
      const y = top + 70 + k * 80 + r() * 20;
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.quadraticCurveTo(x + 100, y - 10 + r() * 20, x + 200, y + 6);
      ctx.stroke();
    }
  }
  for (const s of stones) {
    if (!visible(s.x - 20, s.x + 20, L, R)) continue;
    ctx.fillStyle = s.c;
    ellipse(ctx, s.x, s.y, s.rx, s.ry, s.a);
    ctx.fillStyle = 'rgba(78,138,208,0.45)'; // seen through the ice
    ellipse(ctx, s.x, s.y, s.rx, s.ry, s.a);
  }
  ctx.fillStyle = 'rgba(200,230,255,0.4)';
  for (const b of bubbles) {
    if (!visible(b.x - 30, b.x + 30, L, R)) continue;
    for (let k = 0; k < b.n; k++) circle(ctx, b.x + Math.sin(b.a) * k * 9, b.y - k * 9, 1.2 + (k % 3) * 0.6);
  }
}

// A blade of daylight down through a crack in the roof (fainter in the Deep Blue)
function drawShaft(ctx, s, time) {
  const a = (s.deep ? 0.05 : 0.1) + 0.03 * Math.sin(time * 0.7 + s.p);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = `rgba(170,215,255,${a})`;
  ctx.beginPath();
  ctx.moveTo(s.x - s.w / 2, 20);
  ctx.lineTo(s.x + s.w / 2, 20);
  ctx.lineTo(s.x + s.w * 2 + s.lean * 400, GROUND);
  ctx.lineTo(s.x - s.w * 2 + s.lean * 400, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  glow(ctx, s.x + s.lean * 400, GROUND - 4, s.w * 3, 10, '190,230,255', s.deep ? 0.2 : 0.35);
}

// The frozen waterfall: meltwater that froze as it fell, a pale curtain of ridged ice from the roof to a frozen
// pool, with a trickle still moving behind it
function drawWaterfall(ctx, x, time) {
  glow(ctx, x + 30, 240, 120, 200, '170,215,255', 0.18);
  ctx.fillStyle = 'rgba(200,232,255,0.85)';
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, 26);
  ctx.lineTo(x + 70, 26);
  ctx.quadraticCurveTo(x + 80, 200, x + 104, GROUND - 6);
  ctx.lineTo(x - 40, GROUND - 6);
  ctx.quadraticCurveTo(x - 20, 200, x - 10, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(78,138,208,0.5)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    const fx = x - 2 + i * 13;
    ctx.beginPath();
    ctx.moveTo(fx, 30);
    ctx.quadraticCurveTo(fx + Math.sin(i) * 6, 220, fx + (i - 2.5) * 10, GROUND - 10);
    ctx.stroke();
  }
  const k = (time * 0.6) % 1;
  ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - k)})`;
  circle(ctx, x + 30, 40 + k * (GROUND - 60), 2);
}

function drawColumn(ctx, c) {
  const { x, w, waist } = c, top = 20, mid = top + (GROUND - top) * waist;
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.7, top);
  ctx.lineTo(x + w * 0.7, top);
  ctx.quadraticCurveTo(x + w * 0.18, mid, x + w * 0.6, GROUND);
  ctx.lineTo(x - w * 0.6, GROUND);
  ctx.quadraticCurveTo(x - w * 0.18, mid, x - w * 0.7, top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(168,212,250,0.45)';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, top + 4);
  ctx.quadraticCurveTo(x - w * 0.15, mid, x - w * 0.42, GROUND - 2);
  ctx.lineTo(x - w * 0.25, GROUND - 2);
  ctx.quadraticCurveTo(x - w * 0.02, mid, x - w * 0.3, top + 4);
  ctx.closePath();
  ctx.fill();
}

// The Hall Troll's walls: neat rows of blue blocks it cut and stacked, chisel marks on every one
function drawTrollWall(ctx, w) {
  for (let row = 0; row < w.rows; row++) {
    for (let i = 0; i < w.n - (row % 2); i++) {
      const bx = w.x + i * 40 + (row % 2) * 20, by = GROUND - 30 - row * 30;
      ctx.fillStyle = row % 2 ? '#3e78c0' : '#4682c8';
      ctx.strokeStyle = ICE_LINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(bx, by, 38, 29, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(168,212,250,0.5)';
      ctx.fillRect(bx + 4, by + 4, 10, 3);
      ctx.strokeStyle = 'rgba(14,42,90,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 22, by + 8);
      ctx.lineTo(bx + 30, by + 16);
      ctx.moveTo(bx + 24, by + 18);
      ctx.lineTo(bx + 32, by + 24);
      ctx.stroke();
    }
  }
}

// A shelf of old blue ice sticking out of the wall (a platform), icicles under it
function drawShelf(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = ICE_D;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x + w + 6, y);
  ctx.lineTo(x + w - 10, y + 24);
  ctx.quadraticCurveTo(x + w / 2, y + 38, x + 10, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ICE;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 5, w + 12, 10, 5);
  ctx.fill();
  ctx.fillStyle = ICE_L;
  ctx.fillRect(x + 6, y - 3, w * 0.3, 2);
  ctx.fillStyle = 'rgba(168,212,250,0.85)';
  for (let i = 0; i < 5; i++) {
    const ix = x + 16 + (i * (w - 32)) / 4, len = 10 + ((i * 7) % 5) * 4;
    ctx.beginPath();
    ctx.moveTo(ix - 3, y + 22);
    ctx.lineTo(ix + 3, y + 22);
    ctx.lineTo(ix, y + 22 + len);
    ctx.closePath();
    ctx.fill();
  }
}

// The Cutters' Niche (the hidden spot): a ledge high in the wall where a cutter's pick is frozen into the ice,
// and all round it names and marks scratched by every cutter who ever came down, the oldest worn almost away
function drawNiche(ctx, p, time) {
  const { x, y, w } = p;
  // the hollow in the wall
  ctx.fillStyle = '#0a2050';
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.quadraticCurveTo(x + w / 2, y - 110, x + w + 10, y);
  ctx.closePath();
  ctx.fill();
  glow(ctx, x + w / 2, y - 30, 50, 34, '190,225,255', 0.22 + 0.06 * Math.sin(time * 1.3));
  drawShelf(ctx, p, time);
  // the scratched names: short strokes in rows, some fresh, some faint
  ctx.lineWidth = 1;
  for (let row = 0; row < 4; row++) {
    for (let k = 0; k < 5; k++) {
      const sx = x - 4 + k * 24 + (row % 2) * 8, sy = y - 70 + row * 14;
      ctx.strokeStyle = `rgba(200,230,255,${0.2 + 0.15 * ((row + k) % 3)})`;
      ctx.beginPath();
      for (let j = 0; j < 4; j++) {
        ctx.moveTo(sx + j * 3.5, sy);
        ctx.lineTo(sx + j * 3.5 + (j % 2 ? 2 : -1), sy + 7);
      }
      ctx.stroke();
    }
  }
  // the pick, frozen in up to its head
  ctx.save();
  ctx.translate(x + w * 0.62, y - 26);
  ctx.rotate(-0.6);
  ctx.fillStyle = '#6a5442';
  ctx.fillRect(-2, 0, 4, 30);
  ctx.fillStyle = '#7e8a9a';
  ctx.strokeStyle = '#3e4656';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-14, -2);
  ctx.quadraticCurveTo(0, -8, 14, 0);
  ctx.lineTo(12, 3);
  ctx.quadraticCurveTo(0, -3, -12, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(168,212,250,0.55)'; // ice grown over it
  ellipse(ctx, x + w * 0.62, y - 24, 16, 6);
}

function drawRoof(ctx, L, R, time) {
  ctx.fillStyle = '#04102a';
  ctx.fillRect(L, 0, R - L, 26);
  for (const ic of roofIcicles) {
    if (!visible(ic.x - ic.w, ic.x + ic.w, L, R)) continue;
    ctx.fillStyle = 'rgba(78,138,208,0.92)';
    ctx.beginPath();
    ctx.moveTo(ic.x - ic.w / 2, 20);
    ctx.lineTo(ic.x + ic.w / 2, 20);
    ctx.lineTo(ic.x, 20 + ic.len);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(200,230,255,0.5)';
    ctx.fillRect(ic.x - ic.w * 0.25, 22, 2, ic.len * 0.5);
  }
  for (const d of drips) {
    if (d.x < L || d.x > R) continue;
    const k = (time * d.v + d.p) % 1;
    ctx.fillStyle = `rgba(200,230,255,${0.7 * (1 - k)})`;
    circle(ctx, d.x, 60 + k * (GROUND - 80), 1.8);
  }
}

// The Ladder Foot: the new ladder going up into a slit of daylight in the roof, the old smashed one heaped
// beside it, a cutters' lantern on a peg and a sledge runner leaned on the wall
function drawLadderFoot(ctx, time) {
  const x = BLUEHALLS_EXIT_X, b = GROUND;
  // the slit of daylight high up
  glow(ctx, x, 30, 120, 90, '210,235,255', 0.5);
  ctx.fillStyle = '#e8f4ff';
  ctx.beginPath();
  ctx.moveTo(x - 30, 0);
  ctx.lineTo(x + 34, 0);
  ctx.lineTo(x + 12, 30);
  ctx.lineTo(x - 10, 30);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(190,225,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(x - 10, 30);
  ctx.lineTo(x + 12, 30);
  ctx.lineTo(x + 70, b);
  ctx.lineTo(x - 60, b);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // the new ladder, all the way up
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#d6b88a';
  ctx.lineWidth = 3;
  for (let y = b - 14; y > 34; y -= 18) {
    ctx.beginPath();
    ctx.moveTo(x - 13, y);
    ctx.lineTo(x + 13, y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#e2c08e';
  ctx.lineWidth = 4;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + s * 15, b);
    ctx.lineTo(x + s * 12, 26);
    ctx.stroke();
  }
  // the old ladder, smashed, in a heap, grey with age and rimed
  ctx.strokeStyle = '#6a5a4a';
  ctx.lineWidth = 4;
  for (const [x0, y0, x1, y1] of [[x + 200, b - 4, x + 280, b - 30], [x + 210, b - 18, x + 270, b - 2], [x + 230, b - 36, x + 290, b - 8], [x + 220, b - 2, x + 258, b - 40]]) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(220,240,255,0.7)';
  ellipse(ctx, x + 245, b - 30, 28, 4);
  // the lantern on a peg in the wall
  const lx = x + 340, ly = b - 120;
  ctx.fillStyle = '#5a5a66';
  ctx.fillRect(lx - 3, ly - 8, 14, 4);
  glow(ctx, lx + 8, ly + 12, 70, 60, '255,214,140', 0.4 + 0.05 * Math.sin(time * 5));
  ctx.save();
  ctx.translate(lx + 8, ly - 4);
  ctx.rotate(Math.sin(time * 1.1) * 0.05);
  ctx.fillStyle = '#ffe0a0';
  ctx.strokeStyle = '#4e4e5a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-6, 6, 12, 17, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4e4e5a';
  ctx.fillRect(-7, 4, 14, 3);
  ctx.restore();
  // a sledge runner and an ice saw leaned on the wall
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 400, b);
  ctx.quadraticCurveTo(x + 410, b - 60, x + 440, b - 96);
  ctx.stroke();
  ctx.strokeStyle = '#8a9aa8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 470, b);
  ctx.lineTo(x + 490, b - 100);
  ctx.stroke();
  ctx.fillStyle = WOOD_D;
  ctx.fillRect(x + 483, b - 108, 14, 6);
}

// The floor: blue glacier ice, glassy and cracked, old stones frozen just under it
function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = vgrad(ctx, 'floor', GROUND, H, [[0, '#7ab0e8'], [0.25, '#3e74b8'], [1, '#0e2a5a']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = 'rgba(220,240,255,0.6)';
  ctx.fillRect(L, GROUND - 1, R - L, 4);
  ctx.strokeStyle = 'rgba(14,42,90,0.5)';
  ctx.lineWidth = 1.5;
  for (let x = Math.floor(L / 140) * 140; x < R; x += 140) {
    ctx.beginPath();
    ctx.moveTo(x + 30, GROUND + 8);
    ctx.lineTo(x + 52, GROUND + 30);
    ctx.lineTo(x + 44, GROUND + 66);
    ctx.stroke();
    ctx.fillStyle = 'rgba(30,50,80,0.5)';
    ellipse(ctx, x + 100, GROUND + 40 + (x % 5) * 3, 8, 4);
  }
}

// The zones' markers: a slab of ice with the name scratched in, a red level chip (a hard pocket)
function drawZoneMark(ctx, x, z, time) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.save();
  ctx.translate(x, GROUND - 60);
  ctx.fillStyle = 'rgba(168,212,250,0.88)';
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, -24);
  ctx.lineTo(tw / 2, -28);
  ctx.lineTo(tw / 2 + 6, 60);
  ctx.lineTo(-tw / 2 - 4, 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#06122e');
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.roundRect(-32, 4, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 12.5, 11, '#fffaf0');
  ctx.restore();
}

// The way back up to the Glacier
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
  ctx.moveTo(64, -12);
  ctx.lineTo(-58, -12);
  ctx.lineTo(-70, 0);
  ctx.lineTo(-58, 12);
  ctx.lineTo(64, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Up to the Glacier', -2, 1, 11, '#5b4a6b');
  ctx.restore();
}

// ——— FB2 (b) ———
// The cutters' record (the second find, after the Niche): a patch of the wall scraped smooth, a tally of days
// cut into it in fives, and under it three lines in the same hand. Whose crew it was, nobody here says
const TALLY = 37; // (days)
const RECORD_LINES = ['We heard it breathe.', 'We heard the chain.', 'We stopped.'];
function drawRecord(ctx, x, time) {
  const top = GROUND - 270, w = 196, h = 150;
  ctx.fillStyle = 'rgba(120,170,230,0.28)';
  ctx.strokeStyle = 'rgba(168,212,250,0.35)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, top, w, h, 14);
  ctx.fill();
  ctx.stroke();
  // the tally: strokes in fives, a slash through each five, row after row, the last row short
  ctx.lineCap = 'round';
  let n = 0;
  for (let row = 0; n < TALLY; row++) {
    for (let g = 0; g < 4 && n < TALLY; g++) {
      const gx = x - w / 2 + 16 + g * 44, gy = top + 14 + row * 20, k = Math.min(5, TALLY - n);
      ctx.strokeStyle = 'rgba(14,42,90,0.75)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let j = 0; j < Math.min(4, k); j++) {
        ctx.moveTo(gx + j * 6, gy);
        ctx.lineTo(gx + j * 6 + (j % 2 ? 1 : -1), gy + 13);
      }
      if (k === 5) {
        ctx.moveTo(gx - 3, gy + 11);
        ctx.lineTo(gx + 22, gy + 2);
      }
      ctx.stroke();
      n += k;
    }
  }
  // the three lines, cut deep: a dark groove with a pale lip under it
  ctx.font = `700 13px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  RECORD_LINES.forEach((ln, i) => {
    const y = top + 92 + i * 18;
    ctx.fillStyle = 'rgba(200,230,255,0.45)';
    ctx.fillText(ln, x + 0.8, y + 1);
    ctx.fillStyle = 'rgba(10,30,70,0.9)';
    ctx.fillText(ln, x, y);
  });
  // a glint crossing the smoothed ice now and then
  const g = (time * 0.12) % 1;
  if (g < 0.3) {
    ctx.fillStyle = `rgba(255,255,255,${0.25 * Math.sin((g / 0.3) * Math.PI)})`;
    ctx.fillRect(x - w / 2 + (g / 0.3) * w, top + 4, 3, h - 8);
  }
}

// Thin ice (THIN_ICE): how cracked each patch looks, 0..1. It cracks while a slime stands on it (reaching 1, and
// giving, after THIN_ICE_HOLD ticks, as the server counts) and freezes over again when it's left alone. Drawn from
// the slimes this client sees, so nothing goes over the wire
const crack = new Float32Array(THIN_ICE.length);
let thinT = null;
function thinIceTick(feet, time) {
  const dt = thinT === null ? 0 : Math.max(0, Math.min(0.1, time - thinT));
  thinT = time;
  THIN_ICE.forEach((p, i) => {
    const on = feet.some((x) => Math.abs(x - p.x) < p.w / 2);
    crack[i] = Math.max(0, Math.min(1, crack[i] + (on ? (dt * 60) / THIN_ICE_HOLD : -dt * 0.4)));
  });
}
const SPOKES = Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI + 0.15 * Math.sin(i * 7.1), len: 0.55 + 0.45 * Math.abs(Math.sin(i * 3.3)) }));
function drawThinIce(ctx, p, c, time) {
  const x = p.x, hw = p.w / 2, y = GROUND;
  // dark water under a pale glassy skin
  ctx.fillStyle = 'rgba(6,20,52,0.8)';
  ellipse(ctx, x, y + 7, hw, 12);
  ctx.fillStyle = `rgba(190,228,255,${0.6 - 0.3 * c})`;
  ellipse(ctx, x, y + 5, hw - 5, 8);
  ctx.strokeStyle = 'rgba(235,248,255,0.55)'; // its rim, where the sound floor ends
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(x, y + 7, hw, 12, 0, Math.PI, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(235,248,255,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - hw * 0.6, y + 2);
  ctx.lineTo(x - hw * 0.2, y + 2);
  ctx.moveTo(x + hw * 0.1, y + 6);
  ctx.lineTo(x + hw * 0.4, y + 6);
  ctx.stroke();
  // a few bubbles trapped under it: the tell before anyone steps on it
  ctx.fillStyle = 'rgba(220,240,255,0.6)';
  for (let i = 0; i < 4; i++) circle(ctx, x - hw * 0.5 + i * hw * 0.33, y + 7 + Math.sin(time * 2 + i) * 1, 1.4);
  if (c <= 0.02) return;
  // cracks spreading from where it's taking the weight
  ctx.strokeStyle = `rgba(245,252,255,${0.5 + 0.5 * c})`;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (const s of SPOKES) {
    const L = hw * s.len * Math.min(1, c * 1.4);
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x + Math.cos(s.a) * L, y + 5 + Math.sin(s.a) * 11 * Math.min(1, c * 1.4) - 1);
  }
  ctx.stroke();
  if (c < 1) return;
  // given way: a dark hole, tipped shards round it, the water sloshing
  ctx.fillStyle = '#04102a';
  ellipse(ctx, x, y + 5, hw * 0.55, 5);
  ctx.fillStyle = 'rgba(200,232,255,0.9)';
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 1;
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + d * hw * 0.45, y + 6);
    ctx.lineTo(x + d * hw * 0.3, y - 6 + Math.sin(time * 5 + d) * 1.5);
    ctx.lineTo(x + d * hw * 0.15, y + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(120,170,230,${0.35 + 0.2 * Math.sin(time * 6)})`;
  ellipse(ctx, x, y + 5, hw * 0.3, 2);
}
