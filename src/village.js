// Docs: docs/world.md, docs/art.md
// Slimeville: everything in the village that isn't a slime. Drawn in world coordinates, in the same
// soft, rounded style as Slime Hop (ground and flowers follow src/world.js in the game folder).
import { H, TAU, mulberry32, circle, ellipse, mix } from './util.js';
import { WORLD_W, GROUND_Y, PLATFORMS, HALL_DOOR_X, PIANO_DOOR_X, MUSEUM_DOOR_X, HARBOUR_GATE_X } from './shared/sim.js';
import { drawHallOutside } from './hall.js';
import { drawMusicHouse } from './piano.js';
import { drawMuseumOutside } from './museum.js';
import { drawFieldGate, drawItemIcon, drawSword } from './field.js';
import { FIELD_GATE_X, SHOP_X } from './shared/rpg.js';
import { drawStoreWindow } from './store.js';
import { drawHarbourGate } from './harbour.js';

const FLOWER_COLORS = ['#ffb3c7', '#fff1a8', '#c9b6ff', '#ffffff', '#ffd1a1'];
const INK = '#5b4a6b';

const HOUSES = [
  { x: 560, w: 190, h: 140, wall: '#eaf7f5', roof: '#7fc8c0', roofDark: '#5aa9a1', style: 'gable', door: '#e88f6a', sign: 'Furniture', signW: 80, store: true }, // the furniture store (STORE_DOOR_X, src/store.js)
  { x: 840, w: 210, h: 150, wall: '#fff3e2', roof: '#ff9fb8', roofDark: '#e87c9b', style: 'gable', door: '#c98a5a', sign: 'Bakery' },
  { x: 1420, w: 190, h: 135, wall: '#f6ecff', roof: '#ff7a7a', roofDark: '#e05c66', style: 'mushroom', door: '#9c7bd1', sign: 'Home' }, // everyone's own house is behind this door (HOME_DOOR_X)
  { x: 2180, w: 250, h: 165, wall: '#eefaf3', roof: '#7fc8c0', roofDark: '#5aa9a1', style: 'gable', door: '#d98f6a', sign: 'Inn' },
];
const TREE = { x: 1960 };
const LAMPS = [300, 1130, 1700, 2520, 3060];
const BUNTING = [[1130, 1700], [2520, 3060]];
const WELL = { x: 1790 };
const SIGNPOST = { x: 175 }; // (moved east to make room for the harbour gate)

// Ground decoration, seeded so every visitor sees the same village.
const deco = (() => {
  const r = mulberry32(7);
  const out = [];
  for (let x = 20; x < WORLD_W - 20; x += 26 + r() * 46) {
    const k = r();
    if (k < 0.45) out.push({ type: 'tuft', x, s: 0.8 + r() * 0.5 });
    else if (k < 0.82) out.push({ type: 'flower', x, s: 0.8 + r() * 0.4, color: FLOWER_COLORS[Math.floor(r() * FLOWER_COLORS.length)] });
    else if (k < 0.92) out.push({ type: 'mushroom', x, s: 0.7 + r() * 0.4 });
  }
  return out;
})();
const pebbles = (() => {
  const r = mulberry32(9);
  return Array.from({ length: WORLD_W / 30 }, () => ({ x: r() * WORLD_W, dy: 30 + r() * (H - GROUND_Y - 30), r: 2 + r() * 3 }));
})();
// Hanging roots / vines and rocks under each floating island
const islandBits = PLATFORMS.map((p, i) => {
  const r = mulberry32(100 + i);
  return {
    vines: Array.from({ length: 2 + Math.floor(r() * 2) }, () => ({ x: p.x + 20 + r() * (p.w - 40), len: 18 + r() * 26, p: r() * TAU })),
    tufts: Array.from({ length: Math.floor(p.w / 45) }, () => ({ x: p.x + 14 + r() * (p.w - 28), s: 0.7 + r() * 0.4, flower: r() < 0.4, color: FLOWER_COLORS[Math.floor(r() * 5)] })),
  };
});

// ——— ground ———

function drawGround(ctx, L, R, time) {
  const y = GROUND_Y;
  ctx.fillStyle = '#d4a77a';
  ctx.fillRect(L, y, R - L, H - y + 10);
  ctx.fillStyle = '#c4946a';
  ctx.fillRect(L, y + 50, R - L, H - y);
  ctx.fillStyle = '#b38259';
  ctx.beginPath();
  for (const p of pebbles) {
    if (p.x < L || p.x > R) continue;
    ctx.moveTo(p.x + p.r * 1.4, y + p.dy);
    ctx.ellipse(p.x, y + p.dy, p.r * 1.4, p.r, 0, 0, TAU);
  }
  ctx.fill();

  // stepping-stone path through the middle of the village
  ctx.fillStyle = '#efe2cf';
  ctx.beginPath();
  for (let x = 700; x < 2600; x += 46) {
    if (x < L - 30 || x > R + 30) continue;
    ctx.moveTo(x + 16, y + 26);
    ctx.ellipse(x + ((x / 46) % 2) * 6, y + 26 + ((x / 46) % 3) * 3, 16, 6, 0, 0, TAU);
  }
  ctx.fill();

  drawGrassCap(ctx, L, R, y);
  for (const d of deco) if (d.x > L - 20 && d.x < R + 20) drawDeco(ctx, d.x, y - 2, d, time);
}

// Grass along the top of the ground, with a scalloped lower edge
function drawGrassCap(ctx, x0, x1, y) {
  ctx.fillStyle = '#7fd06e';
  ctx.beginPath();
  ctx.roundRect(x0 - 4, y - 4, x1 - x0 + 8, 18, 9);
  ctx.fill();
  ctx.beginPath();
  for (let gx = Math.floor(x0 / 15) * 15 + 6; gx < x1 + 7; gx += 15) {
    ctx.moveTo(gx + 7, y + 12);
    ctx.arc(gx, y + 12, 7, 0, Math.PI);
  }
  ctx.fill();
  ctx.fillStyle = '#a3e48d';
  ctx.beginPath();
  ctx.roundRect(x0 + 2, y - 4, x1 - x0 - 4, 5, 2.5);
  ctx.fill();
}

function drawDeco(ctx, x, y, d, time) {
  const sway = Math.sin(time * 2 + x * 0.05) * 0.12;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(d.s, d.s);
  if (d.type === 'tuft') {
    ctx.fillStyle = '#5fb85a';
    for (const [ox, h, lean] of [[-5, 10, -0.3], [0, 14, 0], [5, 10, 0.3]]) {
      ctx.save();
      ctx.translate(ox, 0);
      ctx.rotate(lean + sway);
      ctx.beginPath();
      ctx.moveTo(-2.5, 0);
      ctx.lineTo(0, -h);
      ctx.lineTo(2.5, 0);
      ctx.fill();
      ctx.restore();
    }
  } else if (d.type === 'flower') {
    ctx.rotate(sway);
    ctx.strokeStyle = '#5fb85a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -16);
    ctx.stroke();
    ctx.fillStyle = d.color;
    for (let i = 0; i < 5; i++) {
      const a = (i * TAU) / 5;
      circle(ctx, Math.cos(a) * 4, -16 + Math.sin(a) * 4, 3.2);
    }
    ctx.fillStyle = '#ffcf4d';
    circle(ctx, 0, -16, 2.5);
  } else {
    ctx.fillStyle = '#fff4e0';
    ctx.beginPath();
    ctx.roundRect(-3, -10, 6, 10, 2);
    ctx.fill();
    ctx.fillStyle = '#ff7a7a';
    ctx.beginPath();
    ctx.arc(0, -9, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, -3, -12, 1.5);
    circle(ctx, 3, -13, 1.2);
  }
  ctx.restore();
}

// ——— platforms ———

function drawIsland(ctx, p, bits, time) {
  const { x, y, w } = p;
  // earthy underside, tapering to a rounded point
  ctx.fillStyle = '#d4a77a';
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 4);
  ctx.bezierCurveTo(x + w * 0.05, y + 40, x + w * 0.3, y + 58, x + w * 0.5, y + 62);
  ctx.bezierCurveTo(x + w * 0.7, y + 58, x + w * 0.95, y + 40, x + w + 2, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c4946a';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y + 26);
  ctx.bezierCurveTo(x + w * 0.3, y + 50, x + w * 0.4, y + 54, x + w * 0.5, y + 56);
  ctx.bezierCurveTo(x + w * 0.62, y + 52, x + w * 0.75, y + 44, x + w * 0.85, y + 26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b38259';
  ellipse(ctx, x + w * 0.35, y + 30, 5, 3.5);
  ellipse(ctx, x + w * 0.62, y + 40, 4, 3);
  // dangling vines with little leaves
  ctx.strokeStyle = '#5fb85a';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const v of bits.vines) {
    const sway = Math.sin(time * 1.6 + v.p) * 3;
    const depth = y + 18 + (1 - Math.abs(v.x - (x + w / 2)) / (w / 2)) * 30;
    ctx.beginPath();
    ctx.moveTo(v.x, y + 10);
    ctx.quadraticCurveTo(v.x + sway, depth, v.x + sway * 1.5, depth + v.len);
    ctx.stroke();
    ctx.fillStyle = '#6cc96a';
    ellipse(ctx, v.x + sway * 1.5 + 3, depth + v.len, 4, 2.2, 0.5);
  }
  drawGrassCap(ctx, x, x + w, y);
  for (const t of bits.tufts) drawDeco(ctx, t.x, y - 2, t.flower ? { type: 'flower', s: t.s, color: t.color } : { type: 'tuft', s: t.s }, time);
}

// Wooden deck with a rope railing, built round the big tree
function drawDeck(ctx, p) {
  const { x, y, w } = p;
  // support struts back to the trunk
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 12);
  ctx.lineTo(TREE.x - 14, y + 52);
  ctx.moveTo(x + w - 18, y + 12);
  ctx.lineTo(TREE.x + 14, y + 52);
  ctx.stroke();
  // railing posts and a sagging rope
  ctx.strokeStyle = '#a0704a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const px of [x + 8, x + w - 8]) {
    ctx.moveTo(px, y);
    ctx.lineTo(px, y - 26);
  }
  ctx.stroke();
  ctx.strokeStyle = '#e8d2a8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 8, y - 22);
  ctx.quadraticCurveTo(x + w / 2, y - 8, x + w - 8, y - 22);
  ctx.stroke();
  // planks
  ctx.fillStyle = '#b07f55';
  ctx.beginPath();
  ctx.roundRect(x, y - 2, w, 14, 6);
  ctx.fill();
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let px = x + 22; px < x + w - 6; px += 22) {
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + 10);
  }
  ctx.stroke();
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.roundRect(x + 3, y - 2, w - 6, 4, 2);
  ctx.fill();
}

// ——— buildings & props ———

function drawTree(ctx, time) {
  const x = TREE.x, base = GROUND_Y;
  // trunk with roots
  ctx.fillStyle = '#9b7d66';
  ctx.beginPath();
  ctx.moveTo(x - 60, base + 4);
  ctx.quadraticCurveTo(x - 28, base - 10, x - 26, base - 60);
  ctx.lineTo(x - 22, 140);
  ctx.lineTo(x + 22, 140);
  ctx.lineTo(x + 26, base - 60);
  ctx.quadraticCurveTo(x + 28, base - 10, x + 60, base + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#86694f';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 8, base - 30);
  ctx.quadraticCurveTo(x - 14, base - 120, x - 6, 240);
  ctx.moveTo(x + 10, base - 90);
  ctx.quadraticCurveTo(x + 14, 300, x + 8, 200);
  ctx.stroke();
  // a round little door at the bottom
  ctx.fillStyle = '#6e5440';
  ctx.beginPath();
  ctx.roundRect(x - 13, base - 40, 26, 40, [13, 13, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, x + 6, base - 20, 2);
  // canopy
  const breathe = Math.sin(time * 0.8) * 2;
  for (const [cx, cy, r, c] of [
    [x - 95, 150, 70, '#71bd8f'], [x + 95, 150, 70, '#71bd8f'],
    [x, 95 + breathe, 105, '#7cc79a'], [x - 60, 165, 60, '#7cc79a'], [x + 65, 170, 58, '#7cc79a'],
  ]) {
    ctx.fillStyle = c;
    circle(ctx, cx, cy, r);
  }
  ctx.fillStyle = '#9bd8b0';
  circle(ctx, x - 40, 60 + breathe, 32);
  circle(ctx, x + 50, 120, 18);
  // a few apples
  ctx.fillStyle = '#ff5d7d';
  for (const [ax, ay] of [[-70, 130], [30, 60], [80, 150], [-20, 170]]) {
    circle(ctx, x + ax, ay + breathe * 0.5, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    circle(ctx, x + ax - 2, ay - 2 + breathe * 0.5, 1.8);
    ctx.fillStyle = '#ff5d7d';
  }
}

function drawWindow(ctx, x, y, w, h, time, seed) {
  const flicker = 0.85 + 0.15 * Math.sin(time * 3 + seed);
  ctx.fillStyle = '#8f6240';
  ctx.beginPath();
  ctx.roundRect(x - 3, y - 3, w + 6, h + 6, 8);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, `rgba(255,236,160,${flicker})`);
  g.addColorStop(1, `rgba(255,190,110,${flicker})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, x + w * 0.25, y + h * 0.25, 3, 4, -0.5);
  // flower box
  ctx.fillStyle = '#b07f55';
  ctx.beginPath();
  ctx.roundRect(x - 5, y + h + 2, w + 10, 8, 3);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = FLOWER_COLORS[(seed + i) % FLOWER_COLORS.length];
    circle(ctx, x + 2 + i * ((w - 4) / 3), y + h + 1, 3.5);
  }
}

function drawSmoke(ctx, x, y, time) {
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.35 + i / 4) % 1;
    ctx.globalAlpha = 0.55 * Math.sin(k * Math.PI);
    ctx.fillStyle = '#ffffff';
    circle(ctx, x + Math.sin(k * 5 + i) * 6 + k * 14, y - k * 70, 6 + k * 10);
  }
  ctx.globalAlpha = 1;
}

function drawHouse(ctx, hs, time, i) {
  const { x, w, h, wall } = hs;
  const base = GROUND_Y, top = base - h;
  const roofTop = top - (hs.style === 'mushroom' ? 95 : 85);

  // chimney (behind the roof) with smoke
  if (hs.style === 'gable') {
    const cx = x + w * 0.72;
    ctx.fillStyle = '#c98a6a';
    ctx.beginPath();
    ctx.roundRect(cx, roofTop + 18, 24, 50, 4);
    ctx.fill();
    ctx.fillStyle = '#a86f52';
    ctx.beginPath();
    ctx.roundRect(cx - 3, roofTop + 12, 30, 10, 4);
    ctx.fill();
    drawSmoke(ctx, cx + 12, roofTop + 6, time + i);
  }

  // walls
  ctx.fillStyle = wall;
  ctx.beginPath();
  ctx.roundRect(x, top, w, h + 6, [10, 10, 0, 0]);
  ctx.fill();
  ctx.fillStyle = mix(wall, '#c9a98a', 0.25);
  ctx.fillRect(x, base - 22, w, 26); // stone footing
  ctx.fillStyle = mix(wall, '#c9a98a', 0.45);
  for (let sx = x + 8; sx < x + w - 10; sx += 26) ellipse(ctx, sx + 10, base - 11, 9, 5);
  // timber beams
  ctx.fillStyle = '#c99b6b';
  ctx.fillRect(x + 6, top + 4, 7, h - 26);
  ctx.fillRect(x + w - 13, top + 4, 7, h - 26);

  // door
  const dw = 42, dx = x + w * 0.5 - dw / 2 + (hs.style === 'gable' ? -w * 0.18 : 0), dy = base - 70;
  ctx.fillStyle = mix(hs.door, '#000000', 0.2);
  ctx.beginPath();
  ctx.roundRect(dx - 4, dy - 4, dw + 8, 74, [25, 25, 0, 0]);
  ctx.fill();
  ctx.fillStyle = hs.door;
  ctx.beginPath();
  ctx.roundRect(dx, dy, dw, 70, [21, 21, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = mix(hs.door, '#000000', 0.15);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dx + dw / 2, dy + 4);
  ctx.lineTo(dx + dw / 2, dy + 70);
  ctx.stroke();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, dx + dw - 9, dy + 40, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  circle(ctx, dx + dw / 2, dy + 20, 7); // round porthole
  ctx.strokeStyle = mix(hs.door, '#000000', 0.25);
  ctx.beginPath();
  ctx.arc(dx + dw / 2, dy + 20, 7, 0, TAU);
  ctx.stroke();

  // windows
  if (hs.store) drawStoreWindow(ctx, x, w, base, time);
  else if (hs.style === 'gable') {
    drawWindow(ctx, x + w * 0.62, top + 30, 40, 36, time, i * 3);
  } else {
    drawWindow(ctx, x + w * 0.12, top + 34, 32, 30, time, i * 3 + 1);
    drawWindow(ctx, x + w * 0.88 - 32, top + 34, 32, 30, time, i * 3 + 2);
  }

  // roof
  if (hs.style === 'mushroom') {
    ctx.fillStyle = hs.roofDark;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, top + 8, w * 0.68, 22, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = hs.roof;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.18, top + 8);
    ctx.bezierCurveTo(x - w * 0.18, roofTop - 10, x + w * 1.18, roofTop - 10, x + w * 1.18, top + 8);
    ctx.quadraticCurveTo(x + w / 2, top + 28, x - w * 0.18, top + 8);
    ctx.fill();
    ctx.fillStyle = '#fff6ee';
    for (const [sx, sy, r] of [[0.15, 0.55, 14], [0.5, 0.25, 18], [0.82, 0.5, 13], [0.35, 0.75, 9], [0.68, 0.78, 8]]) {
      ellipse(ctx, x + w * sx, roofTop + (top - roofTop) * sy + 4, r, r * 0.75);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(ctx, x + w * 0.2, roofTop + 30, 26, 10, -0.5);
  } else {
    const over = 22;
    ctx.fillStyle = hs.roofDark;
    ctx.beginPath();
    ctx.moveTo(x - over, top + 12);
    ctx.lineTo(x + w / 2, roofTop);
    ctx.lineTo(x + w + over, top + 12);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 14;
    ctx.strokeStyle = hs.roofDark;
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = hs.roof;
    ctx.beginPath();
    ctx.moveTo(x - over + 6, top + 4);
    ctx.lineTo(x + w / 2, roofTop + 6);
    ctx.lineTo(x + w + over - 6, top + 4);
    ctx.closePath();
    ctx.fill();
    // scalloped shingle rows
    ctx.fillStyle = hs.roofDark;
    for (let row = 1; row <= 3; row++) {
      const ry = roofTop + 6 + ((top + 4 - roofTop - 6) * row) / 4;
      const half = ((w / 2 + over - 6) * row) / 4;
      ctx.beginPath();
      for (let sx = x + w / 2 - half + 8; sx < x + w / 2 + half - 4; sx += 16) {
        ctx.moveTo(sx + 7, ry);
        ctx.arc(sx, ry, 7, 0, Math.PI);
      }
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // little round attic window
    ctx.fillStyle = '#8f6240';
    circle(ctx, x + w / 2, roofTop + 48, 13);
    ctx.fillStyle = '#ffe6a0';
    circle(ctx, x + w / 2, roofTop + 48, 10);
  }

  // hanging shop sign
  if (hs.sign) {
    const sx = x + w + 4, sy = top + 22;
    ctx.strokeStyle = '#8f6240';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + w - 6, sy);
    ctx.lineTo(sx + (hs.signW ?? 52) / 2 + 8, sy);
    ctx.stroke();
    const swing = Math.sin(time * 1.5 + i) * 0.05;
    ctx.save();
    ctx.translate(sx + (hs.signW ?? 52) / 2 - 6, sy);
    ctx.rotate(swing);
    ctx.strokeStyle = '#e8d2a8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-(hs.signW ?? 52) / 2 + 12, 0);
    ctx.lineTo(-(hs.signW ?? 52) / 2 + 12, 10);
    ctx.moveTo((hs.signW ?? 52) / 2 - 12, 0);
    ctx.lineTo((hs.signW ?? 52) / 2 - 12, 10);
    ctx.stroke();
    ctx.fillStyle = '#fffaf0';
    ctx.strokeStyle = '#c99b6b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const sw = hs.signW ?? 52;
    ctx.roundRect(-sw / 2, 10, sw, 24, 7);
    ctx.fill();
    ctx.stroke();
    text(ctx, hs.sign, 0, 23, 13, INK);
    ctx.restore();
  }
}

function drawLamp(ctx, x, time) {
  const base = GROUND_Y, top = base - 120;
  const glow = 0.55 + 0.1 * Math.sin(time * 2.3 + x);
  const g = ctx.createRadialGradient(x, top, 4, x, top, 60);
  g.addColorStop(0, `rgba(255,226,140,${glow})`);
  g.addColorStop(1, 'rgba(255,226,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 60, top - 60, 120, 120);
  ctx.fillStyle = '#5b4a6b';
  ctx.beginPath();
  ctx.roundRect(x - 3.5, top + 10, 7, base - top - 10, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x - 10, base - 10, 20, 12, 4);
  ctx.fill();
  ctx.strokeStyle = '#5b4a6b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + 8, top + 12, 8, Math.PI, Math.PI * 1.5); // little curl
  ctx.stroke();
  // lantern
  ctx.fillStyle = '#ffe69a';
  ctx.beginPath();
  ctx.roundRect(x - 9, top - 10, 18, 22, 6);
  ctx.fill();
  ctx.fillStyle = '#5b4a6b';
  ctx.beginPath();
  ctx.moveTo(x - 12, top - 9);
  ctx.quadraticCurveTo(x, top - 22, x + 12, top - 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 8, top + 11, 16, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(ctx, x - 4, top - 3, 2, 4);
}

// Little pennant flags strung between two lamp posts, swaying in the breeze
function drawBunting(ctx, x0, x1, time) {
  const y = GROUND_Y - 112, sag = 34;
  const at = (t) => [x0 + (x1 - x0) * t, y + Math.sin(t * Math.PI) * sag + Math.sin(time * 1.3 + x0) * 2 * Math.sin(t * Math.PI)];
  ctx.strokeStyle = '#e8d2a8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const [px, py] = at(t);
    t ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  const n = Math.floor((x1 - x0) / 34);
  const colors = ['#ff9fb8', '#fff1a8', '#a6f5c9', '#c9b6ff', '#9fd8ff'];
  for (let i = 1; i < n; i++) {
    const [px, py] = at(i / n);
    const flap = Math.sin(time * 3 + i) * 2;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(px - 8, py);
    ctx.lineTo(px + 8, py);
    ctx.lineTo(px + flap, py + 17);
    ctx.closePath();
    ctx.fill();
  }
}

function drawWell(ctx, time) {
  const x = WELL.x, base = GROUND_Y;
  ctx.fillStyle = '#a0704a';
  ctx.fillRect(x - 34, base - 92, 6, 72);
  ctx.fillRect(x + 28, base - 92, 6, 72);
  // roof
  ctx.fillStyle = '#c9b6ff';
  ctx.beginPath();
  ctx.moveTo(x - 46, base - 84);
  ctx.lineTo(x, base - 118);
  ctx.lineTo(x + 46, base - 84);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#a593e6';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fill();
  // crank and bucket
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 28, base - 70);
  ctx.lineTo(x + 28, base - 70);
  ctx.moveTo(x, base - 70);
  ctx.lineTo(x, base - 52 + Math.sin(time) * 2);
  ctx.stroke();
  ctx.fillStyle = '#b07f55';
  ctx.beginPath();
  ctx.roundRect(x - 7, base - 52 + Math.sin(time) * 2, 14, 12, 3);
  ctx.fill();
  // stone ring
  ctx.fillStyle = '#c9c3d6';
  ctx.beginPath();
  ctx.roundRect(x - 40, base - 34, 80, 38, [14, 14, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#b3abc6';
  for (const [sx, sy] of [[-24, -22], [4, -24], [26, -18], [-10, -8], [18, -6]]) ellipse(ctx, x + sx, base + sy, 10, 6);
  ctx.fillStyle = '#9fd8ff';
  ellipse(ctx, x, base - 33, 32, 5);
}

function drawSignpost(ctx) {
  const x = SIGNPOST.x, base = GROUND_Y;
  ctx.fillStyle = '#9b7d66';
  ctx.beginPath();
  ctx.roundRect(x - 5, base - 100, 10, 102, 4);
  ctx.fill();
  ctx.save();
  ctx.translate(x, base - 82);
  ctx.rotate(-0.04);
  ctx.fillStyle = '#c99b6b';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-58, -18);
  ctx.lineTo(56, -18);
  ctx.lineTo(72, 0);
  ctx.lineTo(56, 18);
  ctx.lineTo(-58, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Slimeville', 4, 1, 17, '#fffaf0');
  ctx.restore();
}

export function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

const visible = (x0, x1, L, R) => x1 > L && x0 < R;

// The village behind the slimes. camX is the left edge of the view, viewW its width.
export function drawVillage(ctx, camX, viewW, time) {
  const L = camX - 60, R = camX + viewW + 60;
  if (visible(1700, 2220, L, R)) drawTree(ctx, time);
  for (const [a, b] of BUNTING) if (visible(a, b, L, R)) drawBunting(ctx, a, b, time);
  HOUSES.forEach((hs, i) => visible(hs.x - 60, hs.x + hs.w + 80, L, R) && drawHouse(ctx, hs, time, i));
  if (visible(WELL.x - 50, WELL.x + 50, L, R)) drawWell(ctx, time);
  if (visible(0, 260, L, R)) drawSignpost(ctx);
  if (visible(0, 140, L, R)) drawHarbourGate(ctx, HARBOUR_GATE_X, GROUND_Y, time); // the way down to the harbour
  if (visible(FIELD_GATE_X - 120, WORLD_W, L, R)) drawFieldGate(ctx, FIELD_GATE_X, GROUND_Y, time); // the way to the Wildwood
  for (const x of LAMPS) if (visible(x - 60, x + 60, L, R)) drawLamp(ctx, x, time);
  if (visible(HALL_DOOR_X - 220, HALL_DOOR_X + 220, L, R)) drawHallOutside(ctx, HALL_DOOR_X, GROUND_Y, time);
  if (visible(PIANO_DOOR_X - 200, PIANO_DOOR_X + 200, L, R)) drawMusicHouse(ctx, PIANO_DOOR_X, GROUND_Y, time);
  if (visible(MUSEUM_DOOR_X - 340, MUSEUM_DOOR_X + 340, L, R)) drawMuseumOutside(ctx, MUSEUM_DOOR_X, GROUND_Y, time);
  drawGround(ctx, Math.max(0, L), Math.min(WORLD_W, R), time);
  PLATFORMS.forEach((p, i) => {
    if (!visible(p.x - 20, p.x + p.w + 20, L, R)) return;
    if (p.kind === 'deck') drawDeck(ctx, p);
    else drawIsland(ctx, p, islandBits[i], time);
  });
  // drawn after the islands: its awning tucks in front of the floating island's underside
  if (visible(SHOP_X - 150, SHOP_X + 120, L, R)) drawShop(ctx, SHOP_X, time);
}

// Merchant Pip's market stall: a striped awning on two posts, a counter of jellies on the left, a
// shelf of gear behind and a crate of swords on the right. Pip himself (a character slime, drawn by
// main.js) stands in the open middle at x + 20. Its top stays under the island above (y 335).
function drawShop(ctx, x, time) {
  const base = GROUND_Y, top = base - 100;
  // back wall
  ctx.fillStyle = '#fff3e2';
  ctx.beginPath();
  ctx.roundRect(x - 92, top + 18, 184, base - top - 16, 4);
  ctx.fill();
  ctx.fillStyle = '#f3e2c8';
  for (let px = x - 92 + 23; px < x + 92; px += 23) ctx.fillRect(px - 1, top + 22, 2, base - top - 22); // planks
  // shelf with gear on display
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.roundRect(x - 84, top + 60, 168, 5, 2.5);
  ctx.fill();
  drawItemIcon(ctx, 'iron_helm', x - 60, top + 50, 22);
  drawItemIcon(ctx, 'mush_helm', x - 30, top + 50, 22);
  drawItemIcon(ctx, 'leaf_cap', x + 2, top + 50, 22);
  drawItemIcon(ctx, 'mana_jelly', x + 34, top + 51, 20);
  drawItemIcon(ctx, 'blue_jelly', x + 60, top + 51, 20);
  // posts
  ctx.fillStyle = '#b07f55';
  for (const px of [x - 96, x + 96]) {
    ctx.beginPath();
    ctx.roundRect(px - 5, top + 10, 10, base - top - 8, 4);
    ctx.fill();
  }
  // counter, left
  const cx0 = x - 90, cx1 = x - 12, cy = base - 34;
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.roundRect(cx0, cy + 6, cx1 - cx0, base - cy - 4, 4);
  ctx.fill();
  ctx.fillStyle = '#b8845a';
  for (let px = cx0 + 6; px < cx1 - 4; px += 13) ctx.fillRect(px, cy + 12, 6, base - cy - 14);
  ctx.fillStyle = '#a0704a';
  ctx.beginPath();
  ctx.roundRect(cx0 - 4, cy, cx1 - cx0 + 8, 8, 4);
  ctx.fill();
  ctx.fillStyle = '#d9b088';
  ctx.fillRect(cx0, cy + 1, cx1 - cx0, 2);
  // goods on the counter: jellies, a coin pile, a sword laid flat
  drawItemIcon(ctx, 'red_jelly', x - 76, cy - 9, 20);
  drawItemIcon(ctx, 'red_jelly', x - 58, cy - 9, 20);
  drawItemIcon(ctx, 'blue_jelly', x - 40, cy - 9, 20);
  drawItemIcon(ctx, 'coin', x - 22, cy - 8, 18);
  // a little price tag hanging off the counter
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#c99b6b';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x - 64, cy + 14, 22, 12, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd23a';
  circle(ctx, x - 58, cy + 20, 3);
  ctx.fillStyle = INK;
  ctx.fillRect(x - 53, cy + 19, 8, 2);
  // crate of swords, right
  const kx = x + 62;
  ['crystal_sword', 'iron_sword', 'wood_sword'].forEach((id, i) => {
    ctx.save();
    ctx.translate(kx + 8 + i * 7, base - 24);
    ctx.rotate(-0.25 + i * 0.22);
    ctx.scale(0.55, 0.55);
    drawSword(ctx, id, 0);
    ctx.restore();
  });
  ctx.fillStyle = '#b07f55';
  ctx.beginPath();
  ctx.roundRect(kx, base - 28, 34, 30, 3);
  ctx.fill();
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(kx + 2, base - 14);
  ctx.lineTo(kx + 32, base - 14);
  ctx.moveTo(kx + 4, base - 26);
  ctx.lineTo(kx + 30, base);
  ctx.stroke();
  // striped awning with a scalloped edge, swaying a touch
  const aw0 = x - 110, aw1 = x + 110, ay = top, ah = 26;
  const sway = Math.sin(time * 1.3) * 1.2;
  ctx.fillStyle = '#e87c9b';
  ctx.beginPath();
  ctx.roundRect(aw0 + 4, ay - 6, aw1 - aw0 - 8, 10, 5);
  ctx.fill();
  const n = 10, sw = (aw1 - aw0) / n;
  for (let i = 0; i < n; i++) {
    const sx = aw0 + i * sw;
    ctx.fillStyle = i % 2 ? '#fff6ee' : '#ff9fb8';
    ctx.beginPath();
    ctx.moveTo(sx, ay);
    ctx.lineTo(sx + sw, ay);
    ctx.lineTo(sx + sw, ay + ah);
    ctx.arc(sx + sw / 2, ay + ah + sway * 0.3, sw / 2, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(aw0 + 4, ay + 2, aw1 - aw0 - 8, 4);
  // hanging "Shop" sign off the left post
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 96, top + 36);
  ctx.lineTo(x - 140, top + 36);
  ctx.stroke();
  ctx.save();
  ctx.translate(x - 124, top + 36);
  ctx.rotate(Math.sin(time * 1.5 + 2) * 0.05);
  ctx.strokeStyle = '#e8d2a8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-12, 8);
  ctx.moveTo(12, 0);
  ctx.lineTo(12, 8);
  ctx.stroke();
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#c99b6b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-26, 8, 52, 22, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffd23a';
  ctx.strokeStyle = '#c99520';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(-15, 19, 5, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  circle(ctx, -16.5, 17.5, 1.3);
  text(ctx, 'Shop', 5, 19.5, 12, INK);
  ctx.restore();
}
