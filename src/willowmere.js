// Docs: docs/places/willowmere.md
// Willowmere (room WILLOWMERE, data in src/shared/rpg.js): a slow river and a millpond among willows, up the
// brook path north of Sprout Meadow. West to east: the brook path back down, Miller Bun's water mill with
// its wheel turning in the millrace (the weir stone under it is a Keeper stone: src/ruins.js), the Reedy
// Banks, then the wide Millpond with its lily pads, and the old willow at the far end. Soft late-morning
// light, the cosiest of the branches. This room paints its own sky. Platforms: the mill's loft, flour
// sacks, willow boughs (each grows from a trunk drawn under it) and a fallen log on two stones.
import { W, H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { WILLOWMERE_W, WILLOWMERE_EXIT_X, WILLOWMERE_ZONES, WILLOWMERE_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';

const GROUND = FIELD_GROUND;
const INK = '#5b4a6b';
const MILL_X0 = 450, MILL_X1 = 700; // the mill's walls
const WHEEL_X = 742, WHEEL_Y = GROUND - 58, WHEEL_R = 62;
const POND_X = WILLOWMERE_ZONES[2].x0; // where the river widens into the Millpond
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
const clouds = (() => {
  const r = mulberry32(401);
  return Array.from({ length: 7 }, (_, i) => ({ x: i * 240 + r() * 120, y: 40 + r() * 90, s: 0.5 + r() * 0.6 }));
})();
const hills = [0.1, 0.22].map((f, j) => {
  const r = mulberry32(410 + j);
  return { f, bumps: Array.from({ length: 9 }, (_, i) => ({ x: i * 220 + r() * 80, w: 160 + r() * 140, h: 50 + r() * 50 + j * 20 })) };
});
const farWillows = (() => {
  const r = mulberry32(421);
  return Array.from({ length: 14 }, (_, i) => ({ x: i * 150 + r() * 70, s: 0.6 + r() * 0.4 }));
})();
const reeds = (() => {
  const r = mulberry32(431);
  const out = [];
  for (let x = 780; x < WILLOWMERE_W - 20; x += 10 + r() * 22) if (r() < 0.75) out.push({ x, h: 22 + r() * 34, lean: r() * 0.5 - 0.25, p: r() * TAU, cat: r() < 0.3 });
  return out;
})();
const lilies = (() => {
  const r = mulberry32(437);
  const out = [];
  for (let x = POND_X + 60; x < WILLOWMERE_W - 120; x += 50 + r() * 90) out.push({ x, y: 404 + r() * 30, s: 0.7 + r() * 0.6, flower: r() < 0.35 ? ['#ffd1e0', '#fff6e8', '#ffe6a8'][Math.floor(r() * 3)] : null });
  return out;
})();
const grass = (() => {
  const r = mulberry32(441);
  const out = [];
  for (let x = 0; x < WILLOWMERE_W; x += 8 + r() * 14) out.push({ x, h: 8 + r() * 12, p: r() * TAU, flower: r() < 0.06 ? ['#ffb3c7', '#fff1a8', '#c9b6ff', '#ffffff'][Math.floor(r() * 4)] : null });
  return out;
})();
const fluff = (() => {
  const r = mulberry32(443);
  return Array.from({ length: 26 }, () => ({ x: r() * W, y: 60 + r() * 360, v: 8 + r() * 14, p: r() * TAU, s: 1 + r() * 1.6 }));
})();
const pebbles = (() => {
  const r = mulberry32(447);
  return Array.from({ length: WILLOWMERE_W / 28 }, () => ({ x: r() * WILLOWMERE_W, dy: 26 + r() * (H - GROUND - 30), r: 2 + r() * 3 }));
})();
// a willow trunk under every bough platform (at its outer end), and a couple standing alone
const TRUNKS = [
  ...WILLOWMERE_PLATFORMS.filter((p) => p.kind === 'bough').map((p, i) => ({ x: i % 2 ? p.x + p.w - 26 : p.x + 26, top: p.y, s: 1, bough: p })),
  { x: 2480, top: 240, s: 0.9 }, { x: WILLOWMERE_W - 60, top: 120, s: 1.4 },
];

// Everything behind the slimes. camX is the left edge of the view.
export function drawWillowmere(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time);
  ctx.restore();

  const L = camX - 80, R = camX + viewW + 80;
  drawWater(ctx, Math.max(MILL_X1 - 20, L), Math.min(WILLOWMERE_W, R), time);
  for (const t of TRUNKS) if (visible(t.x - 130, t.x + 130, L, R)) drawTrunk(ctx, t, time);
  if (visible(MILL_X0 - 60, WHEEL_X + WHEEL_R + 40, L, R)) drawMill(ctx, time);
  drawGround(ctx, Math.max(0, L), Math.min(WILLOWMERE_W, R), time);
  if (visible(-40, WILLOWMERE_EXIT_X + 160, L, R)) drawBrookPath(ctx, WILLOWMERE_EXIT_X, time);
  WILLOWMERE_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 110;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  for (const p of WILLOWMERE_PLATFORMS) {
    if (!visible(p.x - 40, p.x + p.w + 40, L, R)) continue;
    if (p.kind === 'bough') drawBough(ctx, p, time);
    else if (p.kind === 'log') drawLog(ctx, p);
    else if (p.kind === 'sacks') drawSacks(ctx, p);
    // (the loft is part of the mill)
  }
  if (visible(860 - 40, 860 + 40, L, R)) drawHeron(ctx, 868, time);
  drawGrass(ctx, L, R, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawFluff(ctx, camX, time);
  ctx.restore();
}

function drawSky(ctx, camX, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#9fd2f2');
  sky.addColorStop(0.6, '#cfeaf2');
  sky.addColorStop(1, '#fbf0dc');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const sx = 170 - camX * 0.02, sy = 92;
  const g = ctx.createRadialGradient(sx, sy, 12, sx, sy, 150);
  g.addColorStop(0, 'rgba(255,248,214,0.95)');
  g.addColorStop(1, 'rgba(255,248,214,0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx - 150, sy - 150, 300, 300);
  ctx.fillStyle = '#fff6d0';
  circle(ctx, sx, sy, 28);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  for (const c of clouds) {
    const x = ((c.x - camX * 0.05 + time * 4) % (W + 300) + W + 300) % (W + 300) - 150;
    ellipse(ctx, x, c.y, 52 * c.s, 15 * c.s);
    ellipse(ctx, x + 24 * c.s, c.y - 9 * c.s, 32 * c.s, 14 * c.s);
    ellipse(ctx, x - 28 * c.s, c.y - 4 * c.s, 24 * c.s, 11 * c.s);
  }
  // rolling green hills, then a far line of willows
  hills.forEach((hl, j) => {
    ctx.fillStyle = j ? '#a8d69a' : '#c4e2b4';
    const off = camX * hl.f, base = 360 + j * 24, span = 9 * 220;
    for (const b of hl.bumps) {
      const x = ((b.x - off) % span + span) % span - 200;
      ctx.beginPath();
      ctx.ellipse(x, base, b.w, b.h, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillRect(0, base, W, GROUND - base + 4);
  });
  const span = 14 * 150;
  for (const t of farWillows) {
    const x = ((t.x - camX * 0.38) % span + span) % span - 100, base = 404;
    ctx.fillStyle = '#8cc48a';
    ctx.fillRect(x - 3 * t.s, base - 50 * t.s, 6 * t.s, 50 * t.s);
    ctx.fillStyle = '#9fd09a';
    ctx.beginPath();
    ctx.ellipse(x, base - 56 * t.s, 34 * t.s, 26 * t.s, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 34 * t.s, base - 56 * t.s, 68 * t.s, 30 * t.s);
  }
}

// The river along the back of the bank (from the mill east), widening into the Millpond
function drawWater(ctx, L, R, time) {
  if (R <= L) return;
  const top = (x) => (x < POND_X - 200 ? 404 : x > POND_X + 200 ? 384 : 404 - ((x - POND_X + 200) / 400) * 20);
  const g = ctx.createLinearGradient(0, 380, 0, GROUND);
  g.addColorStop(0, '#a8dcec');
  g.addColorStop(1, '#6eb8d4');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(L, GROUND + 2);
  for (let x = L; x <= R; x += 40) ctx.lineTo(x, top(x));
  ctx.lineTo(R, top(R));
  ctx.lineTo(R, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  // the far bank's edge, and slow ripples drifting east
  ctx.fillStyle = '#7fb874';
  ctx.beginPath();
  ctx.moveTo(L, 0);
  for (let x = L; x <= R; x += 40) ctx.lineTo(x, top(x) + 1);
  ctx.lineTo(R, top(R) + 1);
  ctx.lineTo(R, top(R) - 4);
  for (let x = R; x >= L; x -= 40) ctx.lineTo(x, top(x) - 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) {
    const k = ((time * 0.15 + x * 0.013) % 1), y = top(x) + 10 + ((x * 7) % 30);
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8;
    ctx.beginPath();
    ctx.moveTo(x + k * 40, y);
    ctx.quadraticCurveTo(x + k * 40 + 10, y - 2, x + k * 40 + 22, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const l of lilies) if (l.x > L - 30 && l.x < R + 30) drawLily(ctx, l, time);
}

function drawLily(ctx, l, time) {
  const bob = Math.sin(time * 1.2 + l.x) * 1;
  ctx.fillStyle = '#6fb86a';
  ctx.beginPath();
  ctx.ellipse(l.x, l.y + bob, 16 * l.s, 5 * l.s, 0, 0.3, TAU - 0.1);
  ctx.lineTo(l.x, l.y + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ellipse(ctx, l.x - 5 * l.s, l.y + bob - 1.5, 6 * l.s, 1.6 * l.s);
  if (l.flower) {
    ctx.fillStyle = l.flower;
    for (let i = 0; i < 5; i++) ellipse(ctx, l.x + 4 + Math.cos(i * 1.26) * 4 * l.s, l.y + bob - 4 - Math.abs(Math.sin(i * 1.26)) * 3 * l.s, 3 * l.s, 2 * l.s, i * 1.26);
    ctx.fillStyle = '#ffd66a';
    circle(ctx, l.x + 4, l.y + bob - 5, 1.8 * l.s);
  }
}

// A big willow: a leaning trunk up to `top`, a dome of fronds and long curtains swaying down
function drawTrunk(ctx, t, time) {
  const s = t.s, x = t.x, top = t.top;
  ctx.fillStyle = '#8a6a50';
  ctx.beginPath();
  ctx.moveTo(x - 16 * s, GROUND + 4);
  ctx.quadraticCurveTo(x - 10 * s, (GROUND + top) / 2, x - 7 * s, top - 30);
  ctx.lineTo(x + 7 * s, top - 30);
  ctx.quadraticCurveTo(x + 12 * s, (GROUND + top) / 2, x + 18 * s, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a5826a';
  ctx.fillRect(x - 6 * s, top, 4 * s, GROUND - top - 10);
  // roots
  ctx.fillStyle = '#8a6a50';
  ellipse(ctx, x - 22 * s, GROUND, 14 * s, 5);
  ellipse(ctx, x + 22 * s, GROUND, 12 * s, 5);
  // the crown, and curtains of fronds
  const cy = top - 46 * s;
  ctx.fillStyle = '#86c47a';
  ellipse(ctx, x, cy, 92 * s, 52 * s);
  ctx.fillStyle = '#9ed28c';
  ellipse(ctx, x - 20 * s, cy - 14 * s, 60 * s, 34 * s);
  ctx.strokeStyle = '#7ab86c';
  ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const fx = x - 86 * s + (i * 172 * s) / 15, len = (60 + ((i * 37) % 50)) * s, sway = Math.sin(time * 0.9 + i * 0.7) * 5;
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.moveTo(fx, cy + 20 * s);
    ctx.quadraticCurveTo(fx + sway * 0.5, cy + 20 * s + len * 0.6, fx + sway, cy + 20 * s + len);
    ctx.stroke();
  }
}

// A willow bough you can stand on: a thick mossy branch out from its trunk, leaves along it
function drawBough(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = '#8a6a50';
  ctx.strokeStyle = '#6a4e3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 2, w + 12, 16, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7fb26a'; // moss on top
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 5, w + 4, 7, 3.5);
  ctx.fill();
  ctx.fillStyle = '#9ed28c';
  for (let lx = x + 10; lx < x + w - 6; lx += 22) {
    const sway = Math.sin(time * 1.3 + lx * 0.05) * 3;
    ellipse(ctx, lx + sway, y + 18, 5, 9, 0.3);
    ellipse(ctx, lx + 10 - sway, y + 22, 4, 8, -0.3);
  }
}

function drawLog(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#a99cb3'; // two stones holding it up
  for (const sx of [x + 30, x + w - 30]) {
    ctx.beginPath();
    ctx.roundRect(sx - 18, y + 12, 36, GROUND - y - 10, 10);
    ctx.fill();
  }
  ctx.fillStyle = '#9a7656';
  ctx.strokeStyle = '#6a4e3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y - 2, w, 22, 11);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d8b88e'; // the cut end
  ellipse(ctx, x + w - 4, y + 9, 6, 10);
  ctx.strokeStyle = '#a8865e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x + w - 4, y + 9, 3, 6, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#7fb26a';
  ctx.beginPath();
  ctx.roundRect(x + 8, y - 5, w - 30, 6, 3);
  ctx.fill();
}

function drawSacks(ctx, p) {
  const { x, y, w } = p;
  const sack = (cx, cy, s) => {
    ctx.fillStyle = '#f2e6cc';
    ctx.strokeStyle = '#b8a07a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 22 * s, cy - 30 * s, 44 * s, 30 * s, 12 * s);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b8a07a';
    ctx.fillRect(cx - 6 * s, cy - 34 * s, 12 * s, 6 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; // flour dust
    ellipse(ctx, cx - 6 * s, cy - 20 * s, 8 * s, 4 * s);
  };
  sack(x + 22, GROUND, 1);
  sack(x + 66, GROUND, 1);
  sack(x + 44, y + 30, 1);
  text(ctx, 'FLOUR', x + 44, y + 16, 9, '#a08860');
  void w;
}

// Miller Bun's water mill: a stone footing, timber walls, a pitched roof with a loft door (the platform),
// a front door at Bun's spot, and the big wheel turning in the millrace on the east side
function drawMill(ctx, time) {
  const x0 = MILL_X0, x1 = MILL_X1, eave = 222, peak = 140, loft = WILLOWMERE_PLATFORMS[0];
  // the millrace, running under the wheel from the brook
  ctx.fillStyle = '#8cc8de';
  ctx.beginPath();
  ctx.roundRect(x1 - 10, GROUND - 28, WHEEL_X + WHEEL_R + 30 - x1, 30, 6);
  ctx.fill();
  // the wheel (behind the wall's edge), turning
  ctx.save();
  ctx.translate(WHEEL_X, WHEEL_Y);
  ctx.rotate(time * 0.7);
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, 0, WHEEL_R, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, WHEEL_R - 18, 0, TAU);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * WHEEL_R, Math.sin(a) * WHEEL_R);
  }
  ctx.stroke();
  ctx.fillStyle = '#a07a58';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    ctx.save();
    ctx.rotate(a);
    ctx.fillRect(WHEEL_R - 4, -5, 16, 10);
    ctx.restore();
  }
  ctx.fillStyle = '#5a4030';
  circle(ctx, 0, 0, 9);
  ctx.restore();
  // water spilling off the paddles
  for (let i = 0; i < 6; i++) {
    const k = (time * 1.4 + i / 6) % 1;
    ctx.fillStyle = `rgba(220,245,255,${0.8 * (1 - k)})`;
    circle(ctx, WHEEL_X + WHEEL_R * 0.7 + i * 3, WHEEL_Y - 10 + k * 46, 2.5);
  }
  // stone footing, timber walls
  ctx.fillStyle = '#b8adbf';
  ctx.beginPath();
  ctx.roundRect(x0 - 10, GROUND - 46, x1 - x0 + 20, 50, 6);
  ctx.fill();
  ctx.fillStyle = '#a99cb3';
  for (let sx = x0; sx < x1; sx += 34) ellipse(ctx, sx + 14, GROUND - 24 + ((sx / 34) % 2) * 10, 13, 8);
  ctx.fillStyle = '#f2e2c4';
  ctx.fillRect(x0, eave, x1 - x0, GROUND - 46 - eave);
  ctx.strokeStyle = '#a07a58';
  ctx.lineWidth = 5;
  ctx.beginPath(); // timber frame
  ctx.rect(x0, eave, x1 - x0, GROUND - 46 - eave);
  ctx.moveTo(x0, (eave + GROUND - 46) / 2);
  ctx.lineTo(x1, (eave + GROUND - 46) / 2);
  ctx.moveTo((x0 + x1) / 2 + 20, eave);
  ctx.lineTo((x0 + x1) / 2 + 20, GROUND - 46);
  ctx.moveTo(x0, eave);
  ctx.lineTo(x0 + 60, (eave + GROUND - 46) / 2);
  ctx.moveTo(x1, eave);
  ctx.lineTo(x1 - 60, (eave + GROUND - 46) / 2);
  ctx.stroke();
  // the roof
  ctx.fillStyle = '#d98a6a';
  ctx.strokeStyle = '#b06a50';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0 - 26, eave + 6);
  ctx.lineTo((x0 + x1) / 2, peak);
  ctx.lineTo(x1 + 26, eave + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160,90,70,0.5)';
  ctx.lineWidth = 1.5;
  for (let k = 1; k < 5; k++) {
    const y = peak + ((eave + 6 - peak) * k) / 5, half = ((x1 - x0) / 2 + 26) * (k / 5);
    ctx.beginPath();
    ctx.moveTo((x0 + x1) / 2 - half, y);
    ctx.lineTo((x0 + x1) / 2 + half, y);
    ctx.stroke();
  }
  // the loft door with its hoist beam, over the loft platform
  ctx.fillStyle = '#8a6040';
  ctx.beginPath();
  ctx.roundRect(loft.x + 44, loft.y - 64, 52, 64, [10, 10, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#6a4630';
  ctx.fillRect(loft.x + 68, loft.y - 64, 3, 64);
  ctx.fillStyle = '#a07a58';
  ctx.fillRect(loft.x + 70, loft.y - 82, 70, 9);
  ctx.strokeStyle = '#8a7a60';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(loft.x + 132, loft.y - 73);
  ctx.lineTo(loft.x + 132, loft.y - 40 + Math.sin(time * 1.2) * 3);
  ctx.stroke();
  ctx.fillStyle = '#f2e6cc';
  ctx.beginPath();
  ctx.roundRect(loft.x + 122, loft.y - 42 + Math.sin(time * 1.2) * 3, 20, 18, 6);
  ctx.fill();
  // the loft ledge itself
  ctx.fillStyle = '#b8906a';
  ctx.strokeStyle = '#8a6040';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(loft.x, loft.y - 2, loft.w, 12, 4);
  ctx.fill();
  ctx.stroke();
  // front door and a window, and the mill's sign
  ctx.fillStyle = '#8a6040';
  ctx.beginPath();
  ctx.roundRect(x0 + 44, GROUND - 46 - 84, 56, 84, [24, 24, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#ffd66a';
  circle(ctx, x0 + 90, GROUND - 90, 3);
  ctx.fillStyle = '#bfe0f0';
  ctx.beginPath();
  ctx.roundRect(x1 - 92, eave + 40, 46, 40, 8);
  ctx.fill();
  ctx.strokeStyle = '#a07a58';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1 - 69, eave + 40);
  ctx.lineTo(x1 - 69, eave + 80);
  ctx.moveTo(x1 - 92, eave + 60);
  ctx.lineTo(x1 - 46, eave + 60);
  ctx.stroke();
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#a07a58';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x0 + 18, eave + 8, 120, 26, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'WILLOWMERE MILL', x0 + 78, eave + 21.5, 11, '#8a6040');
  // flour dust drifting from the door
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.3 + i / 4) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.6 * Math.sin(k * Math.PI)})`;
    circle(ctx, x0 + 72 + Math.sin(k * 6 + i) * 14, GROUND - 60 - k * 70, 3);
  }
}

// Duchess the heron, standing in the millrace judging everyone
function drawHeron(ctx, x, time) {
  const y = GROUND - 8, look = Math.sin(time * 0.4) > 0.6 ? 1 : 0;
  ctx.strokeStyle = '#d8b088';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x - 2, y - 30);
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + 2, y - 30);
  ctx.stroke();
  ctx.fillStyle = '#d4dce8';
  ellipse(ctx, x, y - 40, 16, 12, -0.3);
  ctx.strokeStyle = '#d4dce8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 8, y - 44);
  ctx.quadraticCurveTo(x + 18, y - 60, x + 8, y - 72);
  ctx.stroke();
  ctx.fillStyle = '#eef2f8';
  circle(ctx, x + 8 + look * 2, y - 74, 6);
  ctx.fillStyle = '#e8b04a';
  ctx.beginPath();
  ctx.moveTo(x + 12 + look * 2, y - 76);
  ctx.lineTo(x + 26 + look * 4, y - 73);
  ctx.lineTo(x + 12 + look * 2, y - 71);
  ctx.fill();
  ctx.fillStyle = INK;
  circle(ctx, x + 10 + look * 2, y - 75, 1.4);
  ctx.strokeStyle = '#4a5468';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 78);
  ctx.quadraticCurveTo(x - 6, y - 80, x - 10, y - 74);
  ctx.stroke();
}

// The grassy bank path
function drawGround(ctx, L, R, time) {
  if (R <= L) return;
  ctx.fillStyle = '#c8a87e';
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = '#b8966c';
  ctx.fillRect(L, GROUND + 50, R - L, H - GROUND);
  ctx.fillStyle = '#a8865e';
  ctx.beginPath();
  for (const p of pebbles) {
    if (p.x < L || p.x > R) continue;
    ctx.moveTo(p.x + p.r * 1.4, GROUND + p.dy);
    ctx.ellipse(p.x, GROUND + p.dy, p.r * 1.4, p.r, 0, 0, TAU);
  }
  ctx.fill();
  ctx.fillStyle = '#7fc46e';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 3, R - L + 8, 14, 7);
  ctx.fill();
  ctx.fillStyle = '#9ad884';
  ctx.fillRect(L, GROUND - 3, R - L, 4);
  void time;
}

function drawGrass(ctx, L, R, time) {
  ctx.lineCap = 'round';
  for (const r of reeds) {
    if (r.x < L || r.x > R) continue;
    const sway = Math.sin(time * 1.1 + r.p) * 4;
    ctx.strokeStyle = '#5fae5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r.x, GROUND - 2);
    ctx.quadraticCurveTo(r.x + r.lean * 10, GROUND - r.h * 0.6, r.x + r.lean * 18 + sway, GROUND - r.h);
    ctx.stroke();
    if (r.cat) {
      ctx.fillStyle = '#9a6a44';
      ellipse(ctx, r.x + r.lean * 16 + sway, GROUND - r.h + 6, 2.8, 7, r.lean);
    }
  }
  ctx.strokeStyle = '#6cba5e';
  ctx.lineWidth = 1.6;
  for (const g of grass) {
    if (g.x < L || g.x > R) continue;
    const sway = Math.sin(time * 1.6 + g.p) * 2;
    ctx.beginPath();
    ctx.moveTo(g.x, GROUND + 2);
    ctx.lineTo(g.x + sway, GROUND - g.h);
    ctx.stroke();
    if (g.flower) {
      ctx.fillStyle = g.flower;
      circle(ctx, g.x + sway, GROUND - g.h - 1, 2.6);
    }
  }
}

// Willow fluff drifting across the view (screen space)
function drawFluff(ctx, camX, time) {
  for (const f of fluff) {
    const x = ((f.x - camX * 0.6 + time * f.v) % (W + 40) + W + 40) % (W + 40) - 20;
    const y = f.y + Math.sin(time * 0.8 + f.p) * 14;
    ctx.fillStyle = 'rgba(255,255,250,0.75)';
    circle(ctx, x, y, f.s);
  }
}

// The brook path back down to Sprout Meadow, at the west end
function drawBrookPath(ctx, x, time) {
  ctx.fillStyle = '#e2cfa8';
  ctx.beginPath();
  ctx.moveTo(x - 70, GROUND + 2);
  ctx.quadraticCurveTo(x - 20, GROUND - 6, x + 50, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8f6240';
  ctx.fillRect(x + 36, GROUND - 92, 6, 92);
  ctx.save();
  ctx.translate(x + 39, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.02);
  ctx.fillStyle = '#e2bf8f';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-58, -12);
  ctx.lineTo(44, -12);
  ctx.lineTo(44, 12);
  ctx.lineTo(-58, 12);
  ctx.lineTo(-70, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Sprout Meadow', -10, 1, 11, INK);
  ctx.restore();
}

function drawZoneSign(ctx, x, z, i, time) {
  const board = ['', '#8fcf7e', '#6fb6d4'][i], edge = ['', '#5a9a4e', '#4a8aa8'][i];
  ctx.fillStyle = '#8f6240';
  ctx.beginPath();
  ctx.roundRect(x - 4, GROUND - 92, 8, 94, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 70);
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
  text(ctx, z.name, 0, -9, 15, '#ffffff');
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.roundRect(-30, 2, 60, 15, 7.5);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 10, 11, edge);
  // a lily pad (and a frog's eyes) on top of the board
  ctx.fillStyle = mix(board, '#3a7a40', 0.3);
  ellipse(ctx, tw / 2 - 18, -25, 12, 4);
  ctx.fillStyle = '#7fc46e';
  circle(ctx, tw / 2 - 22, -30, 3.4);
  circle(ctx, tw / 2 - 14, -30, 3.4);
  ctx.fillStyle = INK;
  circle(ctx, tw / 2 - 22, -30, 1.4 * clamp(Math.sin(time * 0.7 + i) * 5, 0.2, 1));
  circle(ctx, tw / 2 - 14, -30, 1.4 * clamp(Math.sin(time * 0.7 + i) * 5, 0.2, 1));
  ctx.restore();
}
