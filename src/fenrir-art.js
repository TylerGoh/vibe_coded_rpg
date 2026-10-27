// Docs: docs/places/fenrir.md, docs/combat/items.md, docs/places/pets.md
// Fenrir's rewards' art (FB2 (c2)): the Pledge-Hand (FENRIR_SWORDS, drawn by drawSword in src/field.js), the Wolf-Pelt
// Hood (FENRIR_HELMETS, drawHelmet) and the mini Fenrir pet (drawFenrirPet, called by drawPet in src/furniture.js: a fluffy
// pup with a ribbon collar that chews the end of its own ribbon). The Gleipnir Staff, the Lantern Rod and the Moon-Chaser
// Bow are rows in src/staff-art.js / src/bow-art.js. The shared tell of everything Fenrir: grey-white fur gone to rime,
// grey Keeper stone, and the fetter's pale ribbon of light.
import { TAU, circle, ellipse } from './util.js';
import { glow as softGlow } from './glow.js';

const FUR = '#c3cdd9', FUR_D = '#8a96a6', FUR_L = '#eef4fa', INK = '#161c2a', STONE = '#6a7282', STONE_D = '#3e4454', RIBBON = '226,236,255';
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);

// ——— the Pledge-Hand: a broad pale blade held at its root by a fist of grey Keeper stone (the hilt is the hand), a
// shard glinting in the pommel ———
function drawPledgeHand(ctx, L, gl) {
  ctx.save();
  ctx.lineJoin = 'round';
  // the grip and the pommel
  ctx.fillStyle = '#2e3442';
  ctx.beginPath();
  ctx.roundRect(-3, -2, 6, 13, 2.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,180,210,0.45)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 10; y += 3) {
    ctx.beginPath();
    ctx.moveTo(-3, y);
    ctx.lineTo(3, y + 1.6);
    ctx.stroke();
  }
  ctx.fillStyle = STONE;
  ctx.strokeStyle = INK;
  circle(ctx, 0, 13, 4);
  ctx.stroke();
  glow(ctx, 0, 13, 6, 6, '255,236,180', 0.6);
  ctx.fillStyle = '#fff2c8';
  circle(ctx, 0, 13, 1.4);
  if (gl) glow(ctx, 0, -L * 0.55, 16, L * 0.62, '220,236,255', 0.45);
  // the blade
  const g = ctx.createLinearGradient(-7, 0, 7, 0);
  g.addColorStop(0, '#f4f9ff');
  g.addColorStop(0.5, '#cbd8e8');
  g.addColorStop(1, '#8e9cb2');
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6.5, -10);
  ctx.lineTo(-5.5, -L * 0.82);
  ctx.lineTo(0, -L);
  ctx.lineTo(5.5, -L * 0.82);
  ctx.lineTo(6.5, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,140,170,0.6)'; // (the fuller)
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(0, -L * 0.8);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; // (rime along its edge)
  for (let k = 0.25; k < 0.8; k += 0.14) circle(ctx, -5.2, -L * k, 0.9);
  // the stone fist round its root: a palm behind, four knuckled fingers across the front, the thumb over them
  ctx.fillStyle = STONE_D;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-9, -13, 18, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = STONE;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.roundRect(-8.5, -12.5 + i * 2.9, 15, 3.2, 1.6);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(6, -10, 3.2, 5, -0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
export const FENRIR_SWORDS = { pledge_hand: drawPledgeHand };
export const FENRIR_SWORD_LEN = { pledge_hand: 74 };

// ——— the Wolf-Pelt Hood: a grey-white wolf's pelt worn over the head, ears up, the wolf's own face on your brow (its eyes
// shut), the pelt falling past your cheeks, rime on every tip ———
function drawWolfPeltHood(ctx, w, h, t = 0) {
  const by = -h * 0.68, rx = w * 0.5;
  ctx.save();
  ctx.lineJoin = 'round';
  // the pelt hanging down each side
  for (const s of [-1, 1]) {
    ctx.fillStyle = FUR_D;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.75, by - 4);
    ctx.quadraticCurveTo(s * rx * 1.18, by + h * 0.1, s * rx * 1.05, by + h * 0.3);
    ctx.lineTo(s * rx * 0.95, by + h * 0.24);
    ctx.lineTo(s * rx * 0.88, by + h * 0.31);
    ctx.quadraticCurveTo(s * rx * 0.85, by + h * 0.1, s * rx * 0.62, by + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // ears
  for (const s of [-1, 1]) {
    ctx.fillStyle = FUR;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.22, by - h * 0.36);
    ctx.lineTo(s * rx * 0.55, by - h * 0.66);
    ctx.lineTo(s * rx * 0.74, by - h * 0.26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(46,52,66,0.7)';
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.35, by - h * 0.36);
    ctx.lineTo(s * rx * 0.54, by - h * 0.56);
    ctx.lineTo(s * rx * 0.64, by - h * 0.32);
    ctx.closePath();
    ctx.fill();
  }
  // the crown of the pelt
  const g = ctx.createLinearGradient(0, by - h * 0.45, 0, by + 6);
  g.addColorStop(0, '#a4b0be');
  g.addColorStop(1, FUR);
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.98, by + 6);
  ctx.bezierCurveTo(-rx * 1.0, by - h * 0.5, rx * 1.0, by - h * 0.5, rx * 0.98, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the wolf's face on the brow: a dark mask, shut pale eyes, the snout and its black nose over the brim
  ctx.fillStyle = 'rgba(46,54,70,0.55)';
  for (const s of [-1, 1]) ellipse(ctx, s * rx * 0.3, by - h * 0.16, rx * 0.2, h * 0.06, s * 0.25);
  ctx.strokeStyle = '#eef9ff';
  ctx.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.18, by - h * 0.17);
    ctx.quadraticCurveTo(s * rx * 0.3, by - h * 0.13, s * rx * 0.42, by - h * 0.18);
    ctx.stroke();
  }
  ctx.fillStyle = FUR_L;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.2, by - h * 0.14);
  ctx.quadraticCurveTo(-rx * 0.26, by + h * 0.04, 0, by + h * 0.06);
  ctx.quadraticCurveTo(rx * 0.26, by + h * 0.04, rx * 0.2, by - h * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0c1018';
  ellipse(ctx, 0, by + h * 0.015, rx * 0.1, h * 0.03);
  // a fringe of rimed fur along the brim
  ctx.fillStyle = FUR_L;
  for (let i = 0; i < 9; i++) {
    const x = -rx * 0.95 + (i / 8) * rx * 1.9;
    if (Math.abs(x) < rx * 0.25) continue;
    ctx.beginPath();
    ctx.moveTo(x - 4, by + 2);
    ctx.lineTo(x, by + 7 + (i % 2) * 2);
    ctx.lineTo(x + 4, by + 2);
    ctx.fill();
  }
  glow(ctx, 0, by - h * 0.32, 8, 8, '238,246,255', 0.25 + 0.1 * Math.sin(t * 2));
  ctx.restore();
}
export const FENRIR_HELMETS = { wolfpelt_hood: drawWolfPeltHood };

// ——— the mini Fenrir (a pet): a fluffy pup in a ribbon collar of pale light. Every few seconds it turns round, catches
// the loose end of its own ribbon and chews it, tail going. Feet at the origin, facing +x; ~74 × 56 (petWH) ———
function puff(ctx, x, y, rx, ry, n, col, seed = 0) {
  // (a soft scalloped edge: a curve through the midpoints, bulging out at every other point)
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * TAU, k = i % 2 ? 0.9 : 1.08 + 0.05 * Math.sin(i * 5.1 + seed);
    pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
  }
  const mid = (i) => { const p = pts[i % pts.length], q = pts[(i + 1) % pts.length]; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; };
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(...mid(0));
  for (let i = 1; i <= pts.length; i++) ctx.quadraticCurveTo(pts[i % pts.length][0], pts[i % pts.length][1], ...mid(i));
  ctx.closePath();
  ctx.fill();
}
export function drawFenrirPet(ctx, x, y, facing, walking, time, seed = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing < 0 ? -scale : scale, scale);
  const t = time + seed * 2.3, cyc = (t % 6) / 6, chew = cyc > 0.55 && cyc < 0.95 ? Math.sin(((cyc - 0.55) / 0.4) * Math.PI) : 0;
  const bob = walking ? Math.abs(Math.sin(t * 10)) * 2 : Math.sin(t * 2.2) * 0.6, chomp = chew > 0.3 ? Math.max(0, Math.sin(t * 16)) : 0;
  const wag = Math.sin(t * (chew > 0.2 ? 14 : 5)) * (chew > 0.2 ? 0.5 : 0.25);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // tail: a fat plume up behind, wagging
  ctx.save();
  ctx.translate(-20, -24 - bob);
  ctx.rotate(-0.9 + wag);
  puff(ctx, 0, -8, 7, 11, 5, FUR_D, 1);
  puff(ctx, 0, -13, 4.5, 5, 4, FUR_L, 2);
  ctx.restore();
  // stubby legs, big paws
  for (const [lx, far] of [[-15, 1], [10, 1], [-10, 0], [15, 0]]) {
    const s = walking ? Math.sin(t * 10 + lx) * 3 : 0;
    ctx.fillStyle = far ? FUR_D : FUR;
    ctx.beginPath();
    ctx.roundRect(lx - 4 + s * 0.4, -16, 8, 14, 3);
    ctx.fill();
    ctx.fillStyle = far ? '#9aa6b6' : FUR_L;
    ellipse(ctx, lx + 1 + s, -3, 6, 3.6);
  }
  ctx.save();
  ctx.translate(0, -bob);
  // the body: a round fluffy loaf
  puff(ctx, -3, -22, 23, 13, 8, FUR, 3);
  puff(ctx, 4, -17, 12, 6, 5, FUR_L, 4);
  // the ribbon's loose end: trailing behind on the floor, or up to its mouth while it chews
  const nx = 9, ny = -25, endX = 14 - chew * 2, endY = -12 + chew * -6;
  const trail = [[nx - 4, ny + 3], [-6, -10 + Math.sin(t * 3) * 2], [-22, -4 + Math.sin(t * 3 + 1) * 2]];
  const toMouth = [[nx + 4, ny + 6], [26, -10], [endX + 12, endY]];
  const mix = (a, b) => [a[0] + (b[0] - a[0]) * chew, a[1] + (b[1] - a[1]) * chew];
  const p1 = mix(trail[0], toMouth[0]), p2 = mix(trail[1], toMouth[1]), p3 = mix(trail[2], toMouth[2]);
  glow(ctx, p3[0], p3[1], 7, 7, RIBBON, 0.5);
  for (const [lw, col] of [[3.8, 'rgba(90,110,150,0.55)'], [2.4, `rgba(${RIBBON},0.95)`]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.quadraticCurveTo(p2[0], p2[1], p3[0], p3[1]);
    ctx.stroke();
  }
  for (const d of [-1.5, 1.5]) { // (frayed)
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(p3[0], p3[1]);
    ctx.lineTo(p3[0] + (p3[0] - p2[0]) * 0.12 + d, p3[1] + (p3[1] - p2[1]) * 0.12 + d);
    ctx.stroke();
  }
  // its ribbon collar round the neck (the head hides the back of it), a knot at the front
  for (const [lw, col] of [[4, 'rgba(90,110,150,0.55)'], [2.6, `rgba(${RIBBON},0.95)`]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(nx, ny, 5, 8, -0.5, 0, TAU);
    ctx.stroke();
  }
  glow(ctx, nx + 4, ny + 5, 5, 5, RIBBON, 0.6);
  ctx.fillStyle = '#ffffff';
  circle(ctx, nx + 4, ny + 5, 1.6);
  // the head: turned down toward the ribbon while it chews
  ctx.save();
  ctx.translate(15, -32);
  ctx.rotate(chew * 0.55);
  puff(ctx, -3, 2, 13, 11, 7, FUR_L, 5); // (cheek fluff)
  for (const [ex, col] of [[-8, FUR_D], [3, FUR]]) { // (big ears)
    ctx.fillStyle = col;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ex - 5, -6);
    ctx.lineTo(ex - 1 + (chew > 0.3 ? -2 : 0), -19);
    ctx.lineTo(ex + 5, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,150,170,0.6)';
    ctx.beginPath();
    ctx.moveTo(ex - 2.5, -7);
    ctx.lineTo(ex - 1, -15);
    ctx.lineTo(ex + 2.5, -7);
    ctx.fill();
  }
  ctx.fillStyle = FUR;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  circle(ctx, 0, 0, 11);
  ctx.stroke();
  // the muzzle, its jaw going while it chews
  ctx.fillStyle = FUR_L;
  ctx.beginPath();
  ctx.ellipse(9, 3, 7, 5, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (chomp > 0.05) {
    ctx.fillStyle = '#5a2632';
    ctx.beginPath();
    ctx.ellipse(11, 7, 4, 2 * chomp + 0.5, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#0c1018';
  ellipse(ctx, 15, 1, 2.4, 1.9);
  // round pale eyes with a shine (it's only little); shut tight while it chews hard
  const blink = (t % 4.3) < 0.12;
  if (chew > 0.5 || blink) {
    ctx.strokeStyle = '#0c1018';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-0.5, -3);
    ctx.quadraticCurveTo(2.5, -1, 5.5, -3);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#dff2ff';
    circle(ctx, 2.5, -3, 3.2);
    ctx.fillStyle = '#26324a';
    circle(ctx, 3.2, -2.8, 1.8);
    ctx.fillStyle = '#ffffff';
    circle(ctx, 2.4, -3.8, 0.8);
  }
  ctx.restore();
  ctx.restore();
  ctx.restore();
}
