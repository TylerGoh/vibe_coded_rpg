// Docs: docs/places/wickmother.md, docs/combat/items.md
// The Wickmother's rewards (L5 (c)): the Last Wick (WICK_SWORDS, WICK_SWORD_LEN; its staff, crook and bow twins are rows in
// src/staff-art.js and src/bow-art.js), the Mothwing Hood (WICK_HELMETS) and the mini Wickmother in the Pet Shop
// (drawWickPet, called by src/furniture.js: a small furry moth circling a tiny lantern). Her den and herself are in
// src/dens-wick.js.
import { circle, ellipse } from './util.js';

const WING = '#8a7e98', WING_D = '#5a4e6a', FUR = '#9a8ea8', FUR_L = '#cec4da', INK = '#1e1626';
function softGlow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
// The Last Wick: a long grey blade, a flame sealed in glass at the hilt that never moves however you swing it
function drawLastWick(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,214,150,0.9)';
    ctx.shadowBlur = 14;
  }
  const g = ctx.createLinearGradient(-6, 0, 6, 0);
  g.addColorStop(0, '#6a6474');
  g.addColorStop(0.5, '#d8d4de');
  g.addColorStop(1, '#8a8494');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-4.2, -L * 0.25);
  ctx.lineTo(-4.4, -L * 0.88);
  ctx.lineTo(0, -L * 1.03);
  ctx.lineTo(4.4, -L * 0.88);
  ctx.lineTo(4.2, -L * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(40,34,52,0.5)'; // its fuller
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.28);
  ctx.lineTo(0, -L * 0.9);
  ctx.stroke();
  ctx.fillStyle = '#3a3048'; // the guard: two folded moth wings
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -L * 0.25);
    ctx.quadraticCurveTo(s * 11, -L * 0.3, s * 10, -L * 0.2);
    ctx.quadraticCurveTo(s * 4, -L * 0.2, 0, -L * 0.22);
    ctx.fill();
  }
  // the flame in its glass at the hilt, standing straight up whatever the blade does
  softGlow(ctx, 0, -L * 0.2, 9, '255,214,150', 0.6);
  ctx.fillStyle = 'rgba(236,240,250,0.55)';
  ellipse(ctx, 0, -L * 0.2, 3.6, 4.6);
  ctx.fillStyle = '#fff4d6';
  ellipse(ctx, 0, -L * 0.205, 1.3, 2.6);
  ctx.fillStyle = '#2a2232'; // the grip
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.17, 5.2, L * 0.17, 2);
  ctx.fill();
  ctx.fillStyle = '#ffd696';
  circle(ctx, 0, 1.5, 2.4);
  ctx.restore();
}
export const WICK_SWORDS = { last_wick: drawLastWick };
export const WICK_SWORD_LEN = { last_wick: 70 };

// ——— helmets: (ctx, w, h) on a slime of that size, feet at the origin ———
// The Mothwing Hood: soft grey fur over the crown, two feathered antennae, a fringe of wing at each side
function drawMothwingHood(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.54;
  for (const s of [-1, 1]) { // the little wings at the sides
    ctx.fillStyle = WING_D;
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.7, by - h * 0.08);
    ctx.quadraticCurveTo(s * rx * 1.45, by - h * 0.34, s * rx * 1.3, by + h * 0.06);
    ctx.quadraticCurveTo(s * rx * 1.0, by + h * 0.05, s * rx * 0.8, by + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(214,190,150,0.9)';
    circle(ctx, s * rx * 1.12, by - h * 0.1, 3);
  }
  ctx.fillStyle = FUR;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 12);
  ctx.bezierCurveTo(-rx * 1.04, by - h * 0.46, rx * 1.04, by - h * 0.46, rx, by + 12);
  ctx.quadraticCurveTo(0, by + 2, -rx, by + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = FUR_L; // the fur, in tufts
  for (let i = 0; i < 7; i++) circle(ctx, -rx * 0.75 + (i / 6) * rx * 1.5, by + 6 - Math.sin((i / 6) * Math.PI) * 4, 4);
  ctx.strokeStyle = FUR_L; // the antennae: feathered fronds
  for (const s of [-1, 1]) {
    const x0 = s * rx * 0.25, y0 = by - h * 0.32, x1 = s * rx * 0.85, y1 = by - h * 0.62;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(s * rx * 0.3, y1, x1, y1);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0.25; k < 1; k += 0.12) {
      const px = x0 + (x1 - x0) * k, py = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 6;
      ctx.moveTo(px, py);
      ctx.lineTo(px - 4, py - 4);
      ctx.moveTo(px, py);
      ctx.lineTo(px + 4, py - 3);
    }
    ctx.stroke();
  }
}
export const WICK_HELMETS = { mothwing_hood: drawMothwingHood };

// ——— the mini Wickmother: a small furry moth circling a tiny lantern on a stand ———
export function drawWickPet(ctx, x, y, facing, walking, time, seed = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing < 0 ? -scale : scale, scale);
  const t = time + seed * 1.7;
  // the tiny lantern on its stand, lit
  ctx.strokeStyle = '#3a3048';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -22);
  ctx.stroke();
  softGlow(ctx, 0, -28, 18, '255,214,150', 0.55);
  ctx.fillStyle = '#2a2230';
  ctx.fillRect(-5, -35, 10, 13);
  ctx.fillStyle = `rgba(255,${Math.round(214 + 20 * Math.sin(t * 9))},150,0.95)`;
  ctx.fillRect(-3.5, -33.5, 7, 10);
  // the moth, circling it (in front, then behind)
  const a = t * (walking ? 2.6 : 1.4), mx = Math.cos(a) * 20, my = -30 + Math.sin(a * 2) * 5, front = Math.sin(a) > 0;
  const drawMoth = () => {
    const flap = Math.abs(Math.sin(t * 14)) * 0.8 + 0.2;
    ctx.save();
    ctx.translate(mx, my);
    ctx.scale(Math.cos(a) < 0 ? -1 : 1, 1);
    ctx.fillStyle = WING;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -1);
      ctx.quadraticCurveTo(s * 4, -10 * flap, s * 10, -9 * flap);
      ctx.quadraticCurveTo(s * 8, 2, 0, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(214,190,150,0.95)';
      circle(ctx, s * 6, -5 * flap, 1.4);
      ctx.fillStyle = WING;
    }
    ctx.fillStyle = FUR;
    ellipse(ctx, 0, 0, 2.8, 5);
    ctx.fillStyle = 'rgba(255,240,200,0.95)'; // (a little light still in her)
    circle(ctx, 0, -0.5, 1.2);
    ctx.strokeStyle = FUR_L;
    ctx.beginPath();
    ctx.moveTo(1, -4);
    ctx.quadraticCurveTo(4, -8, 6, -9);
    ctx.stroke();
    ctx.restore();
  };
  if (!front) drawMoth();
  ctx.fillStyle = '#3a3048';
  ctx.beginPath();
  ctx.moveTo(-5, -35);
  ctx.lineTo(0, -40);
  ctx.lineTo(5, -35);
  ctx.closePath();
  ctx.fill();
  if (front) drawMoth();
  // its dust
  ctx.fillStyle = 'rgba(232,228,246,0.7)';
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.4 + i / 3) % 1;
    circle(ctx, mx * 0.6 + Math.sin(i * 2) * 6, my + k * 30, 0.9);
  }
  ctx.restore();
}
