// Docs: docs/combat/skills.md
// The Mage's combos on a mob (S2.6; rules in src/shared/skills.js CHILL_S…, owned by server/rpg.js): drawn
// over the mob's own art so everyone in the room can read what a mage did. Chilled: frost creeping up from
// the feet and a few drifting flakes. Frozen: a crust of ice over the body, with glints and icicles. Burning:
// small flames licking over the top and sparks rising. Cheap on purpose (docs/performance.md): flat fills
// and strokes, no gradients or glows, a handful of shapes per mob. The Archer's (S4) too: Hunter's Mark, a red
// target ring turning over the mob's head, and a Net Trap's net thrown over a caught mob.
import { TAU } from './util.js';

// v: a mob view (x = middle, y = feet; v.chill / v.frozen / v.burning set in src/rpg.js update) · k: its MOBS entry
export function drawMobState(ctx, v, k, time) {
  if (!v.chill && !v.frozen && !v.burning && !v.marked && !v.netted) return;
  const w = k.w, h = k.h, x = v.x, y = v.y, s = v.seed ?? 0;
  ctx.save();
  if (v.frozen) drawIce(ctx, x, y, w, h, time, s, k.boss || k.field);
  else if (v.chill) drawChill(ctx, x, y, w, h, time, s);
  if (v.burning) drawFlames(ctx, x, y, w, h, time, s);
  if (v.netted) drawNet(ctx, x, y, w, h, time);
  if (v.marked) drawMark(ctx, x, y - h - 18, Math.min(18, 8 + w * 0.12), time);
  ctx.restore();
}

// A net thrown over the mob (Net Trap): a dome of crossed cords over its body, knots where they meet, the
// ends pegged at its feet. It shivers a little as the mob struggles.
function drawNet(ctx, x, y, w, h, time) {
  const rx = w * 0.56, ry = h * 0.98, j = Math.sin(time * 18) * 1.2;
  ctx.save();
  ctx.translate(x + j, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, Math.PI, TAU);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(150,112,64,0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const step = Math.max(9, w / 6);
  for (let i = -rx * 2; i <= rx * 2; i += step) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i + ry, -ry);
    ctx.moveTo(i, 0);
    ctx.lineTo(i - ry, -ry);
  }
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(110,82,50,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, Math.PI, TAU);
  ctx.stroke();
  ctx.fillStyle = '#d8b07a';
  for (const px of [-rx, rx]) {
    ctx.beginPath();
    ctx.roundRect(px - 2, -6, 4, 8, 1.5);
    ctx.fill();
  }
  ctx.restore();
}

// Hunter's Mark: a red ring with four ticks, turning slowly, and a dot in the middle, over the mob's head
function drawMark(ctx, x, y, r, time) {
  const pulse = 1 + Math.sin(time * 5) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 0.8);
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#e8504a';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    ctx.moveTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
    ctx.lineTo(Math.cos(a) * (r + 5), Math.sin(a) * (r + 5));
  }
  ctx.stroke();
  ctx.fillStyle = '#e8504a';
  ctx.beginPath();
  ctx.arc(0, 0, 2.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawChill(ctx, x, y, w, h, time, s) {
  // a band of frost round the feet
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#d6f1ff';
  ctx.beginPath();
  ctx.ellipse(x, y - 3, w * 0.55, Math.min(10, h * 0.18), 0, Math.PI, 0);
  ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = '#9fd6f5';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const fx = x - w * 0.45 + (i / 4) * w * 0.9;
    ctx.moveTo(fx, y - 2);
    ctx.lineTo(fx + 2, y - 6 - ((i * 7 + s) % 5));
  }
  ctx.stroke();
  // flakes drifting up and away
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    const t = (time * 0.45 + i / 3 + s * 0.13) % 1;
    const fx = x + Math.sin(i * 2.4 + s) * w * 0.45 + Math.sin(time * 2 + i) * 3, fy = y - h * (0.2 + t * 0.9);
    ctx.globalAlpha = 0.9 * (1 - t);
    flake(ctx, fx, fy, 3);
  }
}

function flake(ctx, x, y, r) {
  ctx.beginPath();
  for (let a = 0; a < 3; a++) {
    const dx = Math.cos((a * Math.PI) / 3) * r, dy = Math.sin((a * Math.PI) / 3) * r;
    ctx.moveTo(x - dx, y - dy);
    ctx.lineTo(x + dx, y + dy);
  }
  ctx.stroke();
}

function drawIce(ctx, x, y, w, h, time, s, big) {
  // a block of ice over the body: an uneven crystal outline, pale and see-through so the mob still shows
  const W = w * 0.62 + 4, H = h + 6, pts = 9;
  ctx.globalAlpha = big ? 0.42 : 0.55;
  ctx.fillStyle = '#c8ecff';
  ctx.beginPath();
  for (let i = 0; i <= pts; i++) {
    const a = Math.PI + (i / pts) * Math.PI, j = 0.86 + 0.14 * (((i * 37 + s * 11) % 7) / 6);
    const px = x + Math.cos(a) * W * j, py = y + Math.sin(a) * H * j;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  // facets
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = '#8fcbef';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - W * 0.5, y - H * 0.25);
  ctx.lineTo(x - W * 0.1, y - H * 0.6);
  ctx.lineTo(x + W * 0.35, y - H * 0.42);
  ctx.moveTo(x - W * 0.1, y - H * 0.6);
  ctx.lineTo(x + W * 0.05, y - H * 0.9);
  ctx.stroke();
  // a glint sweeping across now and then
  const g = (time * 0.6 + s * 0.07) % 1.6;
  if (g < 1) {
    ctx.globalAlpha = 0.85 * Math.sin(g * Math.PI);
    ctx.fillStyle = '#ffffff';
    const gx = x - W * 0.6 + g * W * 1.2, gy = y - H * 0.7;
    ctx.beginPath();
    ctx.moveTo(gx, gy - 6);
    ctx.lineTo(gx + 1.6, gy - 1.6);
    ctx.lineTo(gx + 6, gy);
    ctx.lineTo(gx + 1.6, gy + 1.6);
    ctx.lineTo(gx, gy + 6);
    ctx.lineTo(gx - 1.6, gy + 1.6);
    ctx.lineTo(gx - 6, gy);
    ctx.lineTo(gx - 1.6, gy - 1.6);
    ctx.closePath();
    ctx.fill();
  }
  // icicles along the bottom edge
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#e6f7ff';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const ix = x - W * 0.6 + (i + 0.5) * (W * 1.2) / 4, len = 5 + ((i * 5 + s) % 4) * 2;
    ctx.moveTo(ix - 3, y - 1);
    ctx.lineTo(ix + 3, y - 1);
    ctx.lineTo(ix, y - 1 + len * 0.6);
    ctx.closePath();
  }
  ctx.fill();
}

function drawFlames(ctx, x, y, w, h, time, s) {
  // three to five small flames over the top of the body, flickering on their own beats
  const n = Math.max(3, Math.min(5, Math.round(w / 22)));
  for (let i = 0; i < n; i++) {
    const fx = x + ((i + 0.5) / n - 0.5) * w * 0.8, base = y - h * (0.55 + 0.25 * Math.sin((i + 1) * 1.7 + s));
    const f = 0.75 + 0.25 * Math.sin(time * 11 + i * 2.1 + s), fh = (10 + (i % 2) * 4) * f;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#ff9a5c';
    tongue(ctx, fx, base, 5.5, fh);
    ctx.fillStyle = '#ffe08a';
    tongue(ctx, fx, base, 3, fh * 0.6);
  }
  // sparks rising
  ctx.fillStyle = '#ffd27a';
  for (let i = 0; i < 3; i++) {
    const t = (time * 0.9 + i / 3 + s * 0.21) % 1;
    ctx.globalAlpha = 1 - t;
    ctx.beginPath();
    ctx.arc(x + Math.sin(i * 3.1 + s + time) * w * 0.35, y - h * 0.7 - t * 30, 1.6, 0, TAU);
    ctx.fill();
  }
}

// a flame tongue: a teardrop whose tip points up, sitting on (x, y)
function tongue(ctx, x, y, r, len) {
  ctx.beginPath();
  ctx.moveTo(x, y - len - r);
  ctx.quadraticCurveTo(x + r * 1.3, y - r * 0.6, x, y + r * 0.3);
  ctx.quadraticCurveTo(x - r * 1.3, y - r * 0.6, x, y - len - r);
  ctx.fill();
}

