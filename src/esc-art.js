// Docs: docs/places/escapement.md, docs/combat/items.md
// The Escapement's rewards (the Citadel's C6 (c)): the Last Tick (ESC_SWORDS, ESC_SWORD_LEN; its staff, rod and bow twins
// are rows in src/staff-art.js and src/bow-art.js), the Arbor Crown (ESC_HELMETS) and the mini Escapement in the Pet Shop
// (drawEscPet, called by src/furniture.js: a little anchor that rocks tick, tock, a tiny bob under it). Its den and itself
// are in src/dens-esc.js.
import { circle } from './util.js';
import { drawSmallAnchor } from './dens-esc.js';

const BRASS = '#9a6c36', BRASS_L = '#e0b066', BRASS_D = '#4e341a', IRON_D = '#15131b';
function softGlow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
// The Last Tick: a broad blade shaped like a pallet off the great anchor, dark brass, its edge worn bright where it bit
function drawLastTick(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(150,240,234,0.9)';
    ctx.shadowBlur = 14;
  }
  const g = ctx.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, BRASS_D);
  g.addColorStop(0.5, BRASS);
  g.addColorStop(1, '#6a4a24');
  ctx.fillStyle = g;
  ctx.beginPath(); // a pallet's fluke: broad at the hilt, hooked at the tip
  ctx.moveTo(-6.5, -L * 0.24);
  ctx.lineTo(-5.5, -L * 0.86);
  ctx.quadraticCurveTo(-2, -L * 1.04, 5, -L * 0.98);
  ctx.lineTo(7, -L * 0.86);
  ctx.lineTo(6.5, -L * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = BRASS_L; // the bright edge where it bit
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(7, -L * 0.86);
  ctx.lineTo(6.5, -L * 0.3);
  ctx.moveTo(-2, -L * 1.0);
  ctx.lineTo(5, -L * 0.98);
  ctx.stroke();
  ctx.fillStyle = IRON_D; // the guard: a cog's arc
  ctx.beginPath();
  ctx.ellipse(0, -L * 0.23, 11, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BRASS_D;
  for (let i = -2; i <= 2; i++) ctx.fillRect(i * 4.4 - 1.2, -L * 0.23 - 5.5, 2.4, 2.4);
  softGlow(ctx, 0, -L * 0.23, 7, '150,240,234', 0.6); // a chip of the shard, set in the guard
  ctx.fillStyle = '#e8fffb';
  circle(ctx, 0, -L * 0.23, 1.6);
  ctx.fillStyle = '#2a2632'; // the grip
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.2, 5.2, L * 0.2, 2);
  ctx.fill();
  ctx.fillStyle = BRASS_L;
  circle(ctx, 0, 1.5, 2.4);
  ctx.restore();
}
export const ESC_SWORDS = { last_tick: drawLastTick };
export const ESC_SWORD_LEN = { last_tick: 70 };

// ——— helmets: (ctx, w, h) on a slime of that size, feet at the origin ———
// The Arbor Crown: a ring of fine teeth in dark brass, cut from the escape wheel's rim, one tooth missing
function drawArborCrown(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.44, n = 9;
  ctx.fillStyle = BRASS;
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, by, rx, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    if (i === 6) continue; // (the missing tooth)
    const x = -rx * 0.92 + (i / (n - 1)) * rx * 1.84, hh = 9 + (i % 2) * 2;
    ctx.fillStyle = i % 2 ? BRASS_L : BRASS;
    ctx.beginPath();
    ctx.moveTo(x - 4, by - 2);
    ctx.lineTo(x - 2.5, by - hh);
    ctx.lineTo(x + 2.5, by - hh);
    ctx.lineTo(x + 4, by - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  softGlow(ctx, 0, by, 8, '150,240,234', 0.55); // a chip of the shard at its front
  ctx.fillStyle = '#e8fffb';
  circle(ctx, 0, by, 2);
}
export const ESC_HELMETS = { arbor_crown: drawArborCrown };

// ——— the mini Escapement: a little anchor that rocks tick, tock, a tiny bob under it ———
export function drawEscPet(ctx, x, y, facing, walking, time, seed = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y - 30 * scale);
  ctx.scale(facing < 0 ? -scale : scale, scale);
  drawSmallAnchor(ctx, time + seed * 1.3, 0.9);
  ctx.restore();
}
