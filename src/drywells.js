// Docs: docs/places/drywells.md
// The Dry Wells (room DRYWELLS, src/shared/rpg.js; atlas Phase 9, A5 (b)): Amberdune's deep room, down the old well on the
// Storm Road's Red Rise. Old well-shafts going up to small rounds of daylight far overhead, and the cisterns between them:
// vaulted, dry an age, buckets hanging on rotten ropes, the high-water marks far up the walls, and on every wall the tally
// marks, seven and a stroke through, thousands, the days without rain. Darker going east. West to east: the Well Foot (Asra's
// rope ladder down; no mobs), the Cisterns, the Tally Galleries, the Deep Cistern (the Seventh Digger digs at its far end),
// and the dry spring going up at the east end (DRYW_END_X, onto the Shell Road). The find (last in DRYW_PLATFORMS): a ledge
// high in the deepest cistern with a tin cup full of sand on it, seven tally marks and an eighth begun.
import { W, H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { DRYW_W, FIELD_GROUND, DRYW_PLATFORMS, DRYW_ZONES, DRYW_EXIT_X, DRYW_END_X, DRYW_CUP_X } from './shared/rpg.js';
import { DUST, DUST_D, DUST_L, tally } from './drywells-art.js';

const GROUND = FIELD_GROUND;
const FOOT_END = DRYW_ZONES[0].x1;
const CUP = DRYW_PLATFORMS.find((p) => p.kind === 'cup');
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const darkAt = (x) => clamp((x - 600) / (DRYW_W - 900), 0, 1); // darker going east

// the old well-shafts going up out of the cisterns' roofs to small rounds of daylight
const SHAFTS = (() => {
  const r = mulberry32(1091);
  const out = [];
  for (let x = 300; x < DRYW_W - 300; x += 520 + r() * 260) out.push({ x, w: 70 + r() * 30 });
  return out;
})();
// the cisterns' vaults: arches along the back wall
const ARCHES = (() => {
  const out = [];
  for (let x = 0; x < DRYW_W + 200; x += 360) out.push(x);
  return out;
})();
// buckets hanging on rotten ropes from the vaults
const BUCKETS = (() => {
  const r = mulberry32(1093);
  return Array.from({ length: 16 }, () => ({ x: 400 + r() * (DRYW_W - 800), y: 120 + r() * 120, sw: r() * TAU }));
})();
// tally marks on the walls: x, y, how many groups
const TALLIES = (() => {
  const r = mulberry32(1097);
  return Array.from({ length: 90 }, () => ({ x: r() * DRYW_W, y: 170 + r() * 230, n: 1 + Math.floor(r() * 4) }));
})();
const CRACKS = (() => {
  const r = mulberry32(1099);
  return Array.from({ length: 80 }, () => ({ x: r() * DRYW_W, y: GROUND + 8 + r() * 70, w: 20 + r() * 50, a: (r() - 0.5) * 0.6 }));
})();

// Everything in the Dry Wells behind the slimes
export function drawDryWells(ctx, camX, viewW, time) {
  const L = camX - 200, R = camX + viewW + 200, dk = darkAt(camX + viewW / 2);
  ctx.save();
  // the back wall: dry dressed stone, cool and dim, darker going east
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#2a2018');
  g.addColorStop(0.5, '#4a3a2c');
  g.addColorStop(1, '#6a5440');
  ctx.fillStyle = g;
  ctx.fillRect(L, 0, R - L, GROUND + 2);
  // the vaults' arches, the high-water mark far up, tally marks everywhere
  for (const x of ARCHES) if (visible(x - 200, x + 200, L, R)) drawArch(ctx, x);
  ctx.fillStyle = 'rgba(200,180,150,0.25)'; // the high-water mark, an age dry
  ctx.fillRect(L, 150, R - L, 4);
  ctx.strokeStyle = 'rgba(214,194,160,0.4)';
  ctx.lineWidth = 1.1;
  for (const t of TALLIES) if (visible(t.x - 10, t.x + t.n * 40, L, R)) tally(ctx, t.x, t.y, t.n, 10, 3);
  for (const s of SHAFTS) if (visible(s.x - s.w, s.x + s.w, L, R)) drawShaft(ctx, s, time);
  for (const b of BUCKETS) if (visible(b.x - 20, b.x + 20, L, R)) drawHangingBucket(ctx, b, time);
  if (visible(CUP.x - 120, CUP.x + 200, L, R)) drawCupLedge(ctx);
  drawFloor(ctx, Math.max(0, L), Math.min(DRYW_W, R));
  for (const p of DRYW_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'stone') drawWellStone(ctx, p);
    else if (p.kind === 'shelf') drawShelf(ctx, p);
    else if (p.kind === 'beam') drawBeam(ctx, p);
  }
  if (visible(0, FOOT_END, L, R)) drawLadder(ctx, time);
  if (visible(DRYW_END_X - 160, DRYW_W, L, R)) drawSpring(ctx, time);
  ctx.restore();
  // the dark, deepening going east (in screen space), a little dust drifting in the shafts' light
  ctx.save();
  ctx.translate(camX, 0);
  if (dk > 0) {
    ctx.fillStyle = `rgba(10,6,4,${0.42 * dk})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = 'rgba(232,214,180,0.35)';
  for (let i = 0; i < 24; i++) {
    const x = (i * 131 + time * 6) % W, y = (i * 67 + time * (4 + (i % 3))) % GROUND;
    circle(ctx, x, y, 0.9 + (i % 3) * 0.4);
  }
  ctx.restore();
}

function drawArch(ctx, x) {
  ctx.strokeStyle = 'rgba(30,22,16,0.6)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x - 170, GROUND);
  ctx.lineTo(x - 170, 210);
  ctx.quadraticCurveTo(x, 60, x + 170, 210);
  ctx.lineTo(x + 170, GROUND);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,100,76,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = 230; y < GROUND; y += 36) {
    ctx.moveTo(x - 165, y);
    ctx.lineTo(x - 140, y);
    ctx.moveTo(x + 140, y);
    ctx.lineTo(x + 165, y);
  }
  ctx.stroke();
}
// a well-shaft up through the vault to a small round of daylight, a beam of it coming down with dust in it
function drawShaft(ctx, s, time) {
  const { x, w } = s;
  ctx.fillStyle = '#1a120c';
  ctx.fillRect(x - w / 2, 0, w, 120);
  ctx.fillStyle = 'rgba(255,246,220,0.85)'; // the daylight, far up
  ellipse(ctx, x, 14, w * 0.3, 8);
  const g = ctx.createLinearGradient(0, 20, 0, GROUND);
  g.addColorStop(0, 'rgba(255,240,210,0.28)');
  g.addColorStop(1, 'rgba(255,240,210,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.3, 20);
  ctx.lineTo(x + w * 0.3, 20);
  ctx.lineTo(x + w * 0.8, GROUND);
  ctx.lineTo(x - w * 0.8, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,240,210,0.5)';
  for (let i = 0; i < 6; i++) circle(ctx, x - w * 0.4 + ((i * 37 + time * 5) % (w * 0.8)), 60 + ((i * 71 + time * 9) % (GROUND - 80)), 1);
}
function drawHangingBucket(ctx, b, time) {
  const sw = Math.sin(time * 0.7 + b.sw) * 0.06;
  ctx.save();
  ctx.translate(b.x, 60);
  ctx.rotate(sw);
  ctx.strokeStyle = 'rgba(138,106,74,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, b.y - 60);
  ctx.stroke();
  ctx.fillStyle = '#6a4e36';
  ctx.beginPath();
  ctx.moveTo(-9, b.y - 60);
  ctx.lineTo(9, b.y - 60);
  ctx.lineTo(7, b.y - 44);
  ctx.lineTo(-7, b.y - 44);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4a4440';
  ctx.fillRect(-9, b.y - 57, 18, 2.4);
  ctx.restore();
}
// the find: a ledge high in the deepest cistern, a tin cup full of sand on it, seven tally marks and an eighth begun
function drawCupLedge(ctx) {
  const { x, y, w } = CUP;
  ctx.fillStyle = '#7a6448';
  ctx.strokeStyle = '#3a2a1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9a9a9e'; // the tin cup, full of sand
  ctx.beginPath();
  ctx.roundRect(x + w / 2 - 7, y - 16, 14, 12, 2);
  ctx.fill();
  ctx.fillStyle = DUST_L;
  ellipse(ctx, x + w / 2, y - 16, 6, 2);
  ctx.strokeStyle = 'rgba(232,214,180,0.75)'; // seven marks and a stroke, and an eighth begun
  ctx.lineWidth = 1.4;
  tally(ctx, x + w + 14, y - 4, 1, 14, 3.4);
  ctx.beginPath();
  ctx.moveTo(x + w + 14 + 7 * 3.4 + 10, y - 4);
  ctx.lineTo(x + w + 14 + 7 * 3.4 + 10.4, y - 11);
  ctx.stroke();
}
function drawFloor(ctx, L, R) {
  if (R <= L) return;
  const g = ctx.createLinearGradient(0, GROUND - 6, 0, H);
  g.addColorStop(0, DUST_L);
  g.addColorStop(1, '#5a4634');
  ctx.fillStyle = g;
  ctx.fillRect(L, GROUND - 2, R - L, H - GROUND + 2);
  ctx.fillStyle = DUST;
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 6, R - L + 8, 10, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,70,50,0.5)'; // the old cistern floor, cracked into plates where it dried
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const c of CRACKS) {
    if (c.x + c.w < L || c.x > R) continue;
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + c.w * Math.cos(c.a), c.y + c.w * Math.sin(c.a) * 0.3);
  }
  ctx.stroke();
}
// a fallen well-head stone, its curve to the back, flat on top
function drawWellStone(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = DUST_D;
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 6, w - 16, GROUND - y - 4, 8);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y - 6, 0, y + 22);
  g.addColorStop(0, DUST_L);
  g.addColorStop(1, DUST);
  ctx.fillStyle = g;
  ctx.strokeStyle = DUST_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y - 5, w, 24, 8);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,100,74,0.6)';
  ctx.lineWidth = 1.2;
  tally(ctx, x + 16, y + 14, 2, 8, 2.4);
}
// a shelf of the vault's dressed stone, a corbel under it
function drawShelf(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#5a4634';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + 8);
  ctx.lineTo(x + w * 0.7, y + 8);
  ctx.lineTo(x + w * 0.56, y + 46);
  ctx.lineTo(x + w * 0.44, y + 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = DUST;
  ctx.strokeStyle = DUST_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y - 5, w, 14, 4);
  ctx.fill();
  ctx.stroke();
}
// an old bucket-beam across a shaft, its pulley still on it, the rope long gone
function drawBeam(ctx, p) {
  const { x, y, w } = p;
  ctx.strokeStyle = '#4a3220';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 6);
  ctx.lineTo(x - 10, GROUND);
  ctx.moveTo(x + w - 10, y + 6);
  ctx.lineTo(x + w + 10, GROUND);
  ctx.stroke();
  ctx.fillStyle = '#7a5a3a';
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 4, w + 12, 12, 3);
  ctx.fill();
  ctx.fillStyle = '#4a4440';
  circle(ctx, x + w / 2, y + 12, 7);
}
// the Well Foot: the bottom of the old well, a round of red-gold daylight overhead and Asra's rope ladder down out of it
function drawLadder(ctx, time) {
  const x = DRYW_EXIT_X + 60;
  ctx.fillStyle = 'rgba(255,214,170,0.85)';
  ellipse(ctx, x, 12, 40, 10);
  const g = ctx.createLinearGradient(0, 20, 0, GROUND);
  g.addColorStop(0, 'rgba(255,200,150,0.35)');
  g.addColorStop(1, 'rgba(255,200,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 60, 20, 120, GROUND - 20);
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, 20);
  ctx.lineTo(x - 10 + Math.sin(time * 0.6) * 2, GROUND);
  ctx.moveTo(x + 10, 20);
  ctx.lineTo(x + 10 + Math.sin(time * 0.6) * 2, GROUND);
  for (let y = 40; y < GROUND; y += 16) {
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#3e5a9a'; // Asra's blue bead tied on the bottom rung
  circle(ctx, x + 12, GROUND - 14, 3);
}
// the dry spring at the east end: a cleft going up through the rock to a slot of dusk sky, steps worn in it by water an age
// gone
function drawSpring(ctx, time) {
  const x = DRYW_END_X;
  ctx.fillStyle = '#1a120c';
  ctx.beginPath();
  ctx.moveTo(x - 70, GROUND);
  ctx.lineTo(x - 30, 0);
  ctx.lineTo(x + 50, 0);
  ctx.lineTo(x + 70, GROUND);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, 'rgba(244,160,110,0.6)');
  g.addColorStop(1, 'rgba(244,160,110,0.05)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 24, 0);
  ctx.lineTo(x + 40, 0);
  ctx.lineTo(x + 30, GROUND);
  ctx.lineTo(x - 40, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(200,170,130,0.7)'; // the worn steps going up
  for (let i = 0; i < 8; i++) ctx.fillRect(x - 30 + i * 4, GROUND - 14 - i * 22, 54 - i * 4, 5);
}
