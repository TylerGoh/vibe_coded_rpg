// Docs: docs/places/oasis.md
// The Mirage Oasis (room OASIS, src/shared/rpg.js; atlas Phase 9, A1): Amberdune's easy pocket, down the side path off the
// Glass Dunes' Wind Shelves. Palms round a still pool, and in the pool a different sky: green, with rain falling in it,
// though not a drop falls here (nobody knows whose sky it is). West to east: the Slip (the sand path down; no mobs), the
// Palms, the Still Pool (OASIS_POOL_X) and the Far Shade (no mobs), where someone carved stories of rain into a palm trunk
// (OASIS_PALM_X: a reading, src/ruins.js), getting the details wrong the way Asra does. The tallest palm's crown (last in
// OASIS_PLATFORMS) is the hidden spot. The sky is Caravanserai's (drawDuneSky, drawDuneAir: src/caravan.js).
import { H, TAU, mulberry32, circle, ellipse } from './util.js';
import { OASIS_W, FIELD_GROUND, OASIS_PLATFORMS, OASIS_ZONES, OASIS_POOL_X, OASIS_PALM_X, OASIS_EXIT_X } from './shared/rpg.js';
import { drawDuneSky, drawDuneAir } from './caravan.js';
import { drawDuneSign } from './glassdunes.js';

const GROUND = FIELD_GROUND;
const SLIP_END = OASIS_ZONES[0].x1;
const POOL_W = 520; // the pool, either side of OASIS_POOL_X
const CROWN = OASIS_PLATFORMS.find((p) => p.kind === 'crown');
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

// palms: x, height, lean, how many fronds; some behind (far), some in front of the pool
const palms = (() => {
  const r = mulberry32(941);
  const out = [];
  for (let x = SLIP_END + 40; x < OASIS_W - 60; x += 110 + r() * 90) {
    if (Math.abs(x - OASIS_PALM_X) < 90) continue;
    out.push({ x, h: 150 + r() * 120, lean: (r() - 0.5) * 0.5, n: 6 + Math.floor(r() * 3), far: r() < 0.55 });
  }
  return out;
})();
const reeds = (() => {
  const r = mulberry32(947);
  return Array.from({ length: 26 }, () => ({ x: OASIS_POOL_X - POOL_W / 2 - 60 + r() * (POOL_W + 120), h: 20 + r() * 26 }));
})();

// Everything in the Mirage Oasis behind the slimes
export function drawOasis(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneSky(ctx, camX, time, OASIS_W, { walker: false });
  ctx.restore();
  const L = camX - 140, R = camX + viewW + 140;
  for (const p of palms) if (p.far && visible(p.x - 120, p.x + 120, L, R)) drawPalm(ctx, p, time, true);
  drawGround(ctx, Math.max(0, L), Math.min(OASIS_W, R), time);
  if (visible(0, SLIP_END + 80, L, R)) drawSlip(ctx);
  if (visible(OASIS_POOL_X - POOL_W, OASIS_POOL_X + POOL_W, L, R)) drawPool(ctx, time);
  for (const rd of reeds) if (visible(rd.x - 10, rd.x + 10, L, R)) drawReed(ctx, rd, time);
  for (const p of OASIS_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'rock') drawRock(ctx, p);
    else if (p.kind === 'frond') drawFrondPalm(ctx, p, time);
  }
  if (visible(CROWN.x - 120, CROWN.x + CROWN.w + 120, L, R)) drawTallPalm(ctx, time);
  for (const p of palms) if (!p.far && visible(p.x - 120, p.x + 120, L, R)) drawPalm(ctx, p, time, false);
  if (visible(OASIS_EXIT_X, OASIS_EXIT_X + 220, L, R)) drawDuneSign(ctx, OASIS_EXIT_X + 110, 'Glass Dunes', -1, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneAir(ctx, camX, time);
  ctx.restore();
}

function drawGround(ctx, L, R) {
  if (R <= L) return;
  const g = ctx.createLinearGradient(0, GROUND - 6, 0, H);
  g.addColorStop(0, '#d8c08a');
  g.addColorStop(1, '#a88a5a');
  ctx.fillStyle = g;
  ctx.fillRect(L, GROUND - 4, R - L, H - GROUND + 4);
  ctx.fillStyle = 'rgba(106,138,74,0.55)'; // grass round the water, thinning out to sand
  for (let x = Math.floor(Math.max(L, SLIP_END) / 16) * 16; x < R; x += 16) {
    const d = Math.abs(x - OASIS_POOL_X) / 900;
    if (d > 1) continue;
    ellipse(ctx, x + 8, GROUND - 2, 10 * (1 - d) + 2, 3);
  }
}

// the Slip: sand sliding down from the dunes above into the hollow, a trail of footprints
function drawSlip(ctx) {
  ctx.fillStyle = '#e8c48a';
  ctx.beginPath();
  ctx.moveTo(0, GROUND - 150);
  ctx.quadraticCurveTo(SLIP_END * 0.5, GROUND - 120, SLIP_END + 60, GROUND);
  ctx.lineTo(0, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(160,110,60,0.35)';
  for (let i = 0; i < 9; i++) ellipse(ctx, 40 + i * 50, GROUND - 130 + i * 15 + (i % 2) * 4, 4, 2);
}

// The still pool: dark clear water, and in it a different sky, green and grey with rain falling, slow rings on the water
// where no rain is falling
function drawPool(ctx, time) {
  const x0 = OASIS_POOL_X - POOL_W / 2, x1 = OASIS_POOL_X + POOL_W / 2, y = GROUND + 2;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(OASIS_POOL_X, y + 16, POOL_W / 2, 30, 0, 0, TAU);
  ctx.clip();
  const g = ctx.createLinearGradient(0, y - 14, 0, y + 46);
  g.addColorStop(0, '#5a8a6a'); // a green sky, under the water
  g.addColorStop(0.6, '#8aa88a');
  g.addColorStop(1, '#3e5a4a');
  ctx.fillStyle = g;
  ctx.fillRect(x0, y - 20, POOL_W, 80);
  ctx.fillStyle = 'rgba(200,214,200,0.5)'; // its clouds, grey
  for (let i = 0; i < 5; i++) ellipse(ctx, x0 + 60 + i * 100 + Math.sin(time * 0.1 + i) * 20, y + 8 + (i % 2) * 8, 50, 8);
  ctx.strokeStyle = 'rgba(230,244,236,0.55)'; // and its rain, falling
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 40; i++) {
    const rx = x0 + ((i * 53 + time * 30) % POOL_W), ry = y - 6 + ((i * 17 + time * 60) % 50);
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 2, ry + 7);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; // rings, with nothing falling to make them
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const k = (time * 0.3 + i * 0.2) % 1, rx = OASIS_POOL_X - 180 + i * 90;
    ctx.beginPath();
    ctx.ellipse(rx, y + 12 + (i % 2) * 10, 6 + k * 26, 1.5 + k * 3, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8a7a52';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(OASIS_POOL_X, y + 16, POOL_W / 2, 30, 0, Math.PI * 1.02, Math.PI * 1.98);
  ctx.stroke();
}

function drawReed(ctx, rd, time) {
  const sw = Math.sin(time * 1.3 + rd.x) * 2;
  ctx.strokeStyle = '#6a8a4a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(rd.x, GROUND + 4);
  ctx.quadraticCurveTo(rd.x + sw * 0.5, GROUND - rd.h / 2, rd.x + sw, GROUND - rd.h);
  ctx.stroke();
}

// a date palm: a ringed trunk leaning, a crown of long fronds, dates hanging
function palmAt(ctx, x, base, h, lean, n, time, far) {
  const tx = x + lean * h, ty = base - h;
  ctx.strokeStyle = far ? '#9a8a6a' : '#8a6a48';
  ctx.lineWidth = far ? 7 : 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.quadraticCurveTo(x + lean * h * 0.3, base - h * 0.6, tx, ty);
  ctx.stroke();
  if (!far) {
    ctx.strokeStyle = 'rgba(90,60,40,0.5)'; // the rings
    ctx.lineWidth = 1.4;
    for (let k = 0.1; k < 0.95; k += 0.08) {
      const px = x + (tx - x) * k * k * 0.4 + (tx - x) * k * 0.6, py = base - h * k;
      ctx.beginPath();
      ctx.moveTo(px - 5, py);
      ctx.lineTo(px + 5, py - 2);
      ctx.stroke();
    }
  }
  ctx.fillStyle = far ? 'rgba(106,138,90,0.7)' : '#5a8a4a';
  ctx.strokeStyle = far ? 'rgba(74,106,60,0.6)' : '#3e6a34';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI + Math.sin(time * 0.9 + i + x) * 0.05, len = far ? 50 : 70;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.5 - 10, tx + Math.cos(a) * len, ty + Math.sin(a) * len * 0.4 + 16);
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.5, ty + Math.sin(a) * len * 0.3, tx, ty);
    ctx.fill();
    ctx.stroke();
  }
  if (!far) {
    ctx.fillStyle = '#a8582a';
    for (const dx of [-6, 0, 6]) circle(ctx, tx + dx, ty + 10 + Math.abs(dx) * 0.4, 3);
  }
}
function drawPalm(ctx, p, time, far) {
  palmAt(ctx, p.x, GROUND - (far ? 26 : 0), p.h * (far ? 0.8 : 1), p.lean, p.n, time, far);
}
// a palm whose crown of fronds spreads flat enough to stand on (the frond platforms): its trunk comes up under the
// ledge's middle and the fronds splay out along it
function drawFrondPalm(ctx, p, time) {
  const cx = p.x + p.w / 2;
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 24, GROUND);
  ctx.quadraticCurveTo(cx - 10, (GROUND + p.y) / 2, cx, p.y + 4);
  ctx.stroke();
  ctx.fillStyle = '#4e7e42';
  ctx.strokeStyle = '#3e6a34';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) { // drooping fronds under the ledge
    const a = 0.4 + i * 0.75, len = 54;
    ctx.beginPath();
    ctx.moveTo(cx, p.y + 2);
    ctx.quadraticCurveTo(cx + Math.cos(a) * len * 0.6, p.y + 8, cx + Math.cos(a) * len, p.y + 26 + Math.sin(time + i) * 1.5);
    ctx.quadraticCurveTo(cx + Math.cos(a) * len * 0.5, p.y + 6, cx, p.y + 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#5a8a4a'; // the flat spread of fronds along the top
  for (let k = 0; k < 7; k++) {
    const fx = p.x + 8 + (k * (p.w - 16)) / 6, sw = Math.sin(time * 0.9 + k + p.x) * 1.2;
    ctx.beginPath();
    ctx.ellipse(fx, p.y + 1 + sw, 18, 5, (k - 3) * 0.12, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#a8582a';
  for (const dx of [-6, 0, 6]) circle(ctx, cx + dx, p.y + 9 + Math.abs(dx) * 0.4, 3);
}
// the tallest palm, its crown up where the hidden spot is, a weaver bird's empty nest in it
function drawTallPalm(ctx, time) {
  const cx = CROWN.x + CROWN.w / 2;
  palmAt(ctx, cx - 30, GROUND, GROUND - CROWN.y + 14, 0.1, 8, time, false);
  ctx.fillStyle = '#5a8a4a'; // the crown's fronds, spread flat enough to stand on
  ctx.strokeStyle = '#3e6a34';
  ctx.lineWidth = 1.4;
  for (let k = 0; k < 5; k++) {
    ctx.beginPath();
    ctx.ellipse(CROWN.x + 8 + (k * (CROWN.w - 16)) / 4, CROWN.y + 1 + Math.sin(time * 0.9 + k) * 1.2, 16, 5, (k - 2) * 0.14, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#b89a62'; // the nest, empty
  ctx.beginPath();
  ctx.ellipse(cx + 20, CROWN.y + 12, 10, 12, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3a2a1e';
  circle(ctx, cx + 20, CROWN.y + 16, 3);
}
// a rounded boulder of red sandstone
function drawRock(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#b8744a';
  ctx.strokeStyle = '#7a4a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, GROUND);
  ctx.quadraticCurveTo(x - 14, y + 4, x + 14, y);
  ctx.lineTo(x + w - 14, y);
  ctx.quadraticCurveTo(x + w + 14, y + 4, x + w + 10, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d89468';
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 8, 4);
  ctx.fill();
}
export { POOL_W };
