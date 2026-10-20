// Docs: docs/combat/stages.md
// Field bosses' art (MOBS entries with field: true) and the glow every elite wears. Field bosses are small
// bosses roaming an ordinary wilds strip: a big, readable look of their own, drawn by drawMob in field.js
// like any mob (feet at 0,0, facing right; returns the body path for the hurt flash and the frost).
import { TAU, ellipse, clamp } from './util.js';

// Turnipop: a turnip that grew far too big and far too grumpy. A lavender-topped bulb with a mop of
// leaves; it crouches and shivers before it stomps (m.warn), and its leaves flop when it leaps.
function drawTurnipop(ctx, w, h, t, seed, m, dying) {
  const crouch = m.warn && Math.abs(m.vy ?? 0) < 1 ? 0.86 + Math.sin(t * 34) * 0.015 : 1;
  const bh = h * 0.74 * crouch; // the bulb; the leaves stick up out of its top
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(0, -bh);
    ctx.bezierCurveTo(w * 0.4, -bh * 1.02, w * 0.56, -bh * 0.56, w * 0.47, -bh * 0.27);
    ctx.bezierCurveTo(w * 0.38, -bh * 0.05, w * 0.15, 0, 0, 0);
    ctx.bezierCurveTo(-w * 0.15, 0, -w * 0.38, -bh * 0.05, -w * 0.47, -bh * 0.27);
    ctx.bezierCurveTo(-w * 0.56, -bh * 0.56, -w * 0.4, -bh * 1.02, 0, -bh);
    ctx.closePath();
  };
  // the leaves, behind the bulb: they splay out when it lands and stream back up when it leaps
  const flop = clamp((m.vy ?? 0) / 500, -0.6, 0.6) + Math.sin(t * 2.6 + seed) * 0.06;
  ctx.save();
  ctx.translate(0, -bh + 6);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [a, len, col] of [[-0.75, 0.62, '#6cc96a'], [0.8, 0.58, '#6cc96a'], [-0.28, 0.78, '#7fd06e'], [0.32, 0.72, '#86d679']]) {
    ctx.save();
    ctx.rotate(a * (1 + flop * 0.5));
    const L = h * len;
    ctx.fillStyle = col;
    ctx.strokeStyle = '#4f9d5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // a wavy-edged leaf: lobes down one side and back up the other
    ctx.bezierCurveTo(-L * 0.22, -L * 0.3, -L * 0.3, -L * 0.62, -L * 0.08, -L);
    ctx.bezierCurveTo(L * 0.05, -L * 0.86, L * 0.24, -L * 0.8, L * 0.16, -L * 0.6);
    ctx.bezierCurveTo(L * 0.3, -L * 0.48, L * 0.2, -L * 0.3, L * 0.08, -L * 0.22);
    ctx.quadraticCurveTo(L * 0.1, -L * 0.08, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(79,157,92,0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.quadraticCurveTo(-L * 0.06, -L * 0.5, -L * 0.06, -L * 0.88);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // the bulb: lavender on top, fading to creamy white where it was underground
  const g = ctx.createLinearGradient(0, -bh, 0, 0);
  g.addColorStop(0, '#c27fd1');
  g.addColorStop(0.38, '#e7b6e4');
  g.addColorStop(0.62, '#fff0f6');
  g.addColorStop(1, '#fffaf2');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = '#8a5a9a';
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // growth rings low on the bulb, and a shine up top
  ctx.save();
  body();
  ctx.clip();
  ctx.strokeStyle = 'rgba(138,90,154,0.22)';
  ctx.lineWidth = 1.6;
  for (const k of [0.14, 0.26]) {
    ctx.beginPath();
    ctx.ellipse(0, -bh * k, w * 0.5, bh * 0.08, 0, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ellipse(ctx, -w * 0.22, -bh * 0.74, w * 0.07, bh * 0.12, -0.5);
  // the root tail, curling off behind
  ctx.strokeStyle = '#c9a07a';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.06, -2);
  ctx.bezierCurveTo(-w * 0.18, 4, -w * 0.34, 2, -w * 0.4, -6);
  ctx.stroke();

  // a grumpy face (furious while it's fighting someone)
  const fx = w * 0.14, fy = -bh * 0.48, mad = m.angry || m.warn;
  ctx.fillStyle = 'rgba(255,140,170,0.45)';
  ellipse(ctx, fx - w * 0.2, fy + 9, 7, 4);
  ellipse(ctx, fx + w * 0.2, fy + 9, 7, 4);
  for (const ex of [-1, 1]) {
    const x = fx + ex * w * 0.12;
    if (dying > 0.05) {
      ctx.strokeStyle = '#2d2a3e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 4, fy - 4);
      ctx.lineTo(x + 4, fy + 4);
      ctx.moveTo(x + 4, fy - 4);
      ctx.lineTo(x - 4, fy + 4);
      ctx.stroke();
      continue;
    }
    const blink = Math.sin(t * 0.9 + seed) > 0.985 ? 0.15 : 1;
    ctx.fillStyle = '#2d2a3e';
    ellipse(ctx, x, fy, 4.4, 5.6 * blink);
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, x + 1.4, fy - 2, 1.5, 1.6 * blink);
    // brows, slanting down to the middle
    ctx.strokeStyle = '#5b3a66';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x - ex * 7, fy - (mad ? 13 : 11));
    ctx.lineTo(x + ex * 6, fy - (mad ? 6 : 9));
    ctx.stroke();
  }
  if (dying < 0.05) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (Math.abs(m.vy ?? 0) > 1) ctx.ellipse(fx, fy + 13, 4, 5, 0, 0, TAU); // mid-leap: a shout
    else ctx.arc(fx, fy + 17, 6, 1.15 * Math.PI, 1.85 * Math.PI); // a frown
    ctx.stroke();
  }
  return body;
}

export const FIELD_BOSS_ART = { turnipop: drawTurnipop };

// An elite's glow: a warm halo behind it and a few sparks circling it. Drawn before the mob itself,
// at its feet (0,0), w and h its size.
export function drawEliteGlow(ctx, w, h, t, seed) {
  const cy = -h * 0.5, r = Math.max(w, h) * 0.85, pulse = 0.85 + Math.sin(t * 3 + seed) * 0.15;
  const g = ctx.createRadialGradient(0, cy, r * 0.2, 0, cy, r);
  g.addColorStop(0, `rgba(255,214,120,${0.62 * pulse})`);
  g.addColorStop(0.6, `rgba(255,170,90,${0.26 * pulse})`);
  g.addColorStop(1, 'rgba(255,170,90,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, cy, r, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const a = t * 1.6 + seed + (i * TAU) / 3;
    const x = Math.cos(a) * w * 0.66, y = cy + Math.sin(a) * h * 0.6, s = 4.4 + Math.sin(t * 5 + i) * 1.4;
    ctx.fillStyle = '#fff3b8';
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.6);
    ctx.quadraticCurveTo(x, y, x + s, y);
    ctx.quadraticCurveTo(x, y, x, y + s * 1.6);
    ctx.quadraticCurveTo(x, y, x - s, y);
    ctx.quadraticCurveTo(x, y, x, y - s * 1.6);
    ctx.fill();
  }
}
