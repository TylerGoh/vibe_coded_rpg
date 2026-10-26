// Docs: docs/places/ladon.md, docs/combat/items.md, docs/places/pets.md
// Ladon's rewards' art (FB1 piece 3): Ladon's Fang (LADON_SWORDS, drawn by drawSword in src/field.js), the Crown of
// Thorns (LADON_HELMETS, drawHelmet) and the mini Ladon pet (drawLadonPet, called by drawPet in src/furniture.js: three
// little heads on one root knot that bicker). The staves and the bow are rows in src/staff-art.js / src/bow-art.js.
// The shared tell of everything Ladon: black-green briar, thorns like teeth, white roses for eyes.
import { TAU, circle, ellipse } from './util.js';
import { glow as softGlow } from './glow.js';

const BRIAR = '#1e2a1a', BRIAR_M = '#34482c', BRIAR_L = '#5a7a48', THORN = '#e8e0cc', ROSE = '#fbf6f0', INK = '#0c120a';
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);

function thorn(ctx, x, y, a, len, base, fill = THORN) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a + Math.PI / 2) * base, y + Math.sin(a + Math.PI / 2) * base);
  ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  ctx.lineTo(x + Math.cos(a - Math.PI / 2) * base, y + Math.sin(a - Math.PI / 2) * base);
  ctx.closePath();
  ctx.fill();
}
function rose(ctx, x, y, r, lit = 0) {
  if (lit > 0) glow(ctx, x, y, r * 3, r * 3, '246,250,240', 0.5 * lit);
  ctx.fillStyle = ROSE;
  ctx.strokeStyle = 'rgba(200,180,186,0.8)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.55, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#efe0a8';
  circle(ctx, x, y, r * 0.3);
}

// ——— Ladon's Fang: a long hooked tooth, black-green, a row of thorn teeth up its back, a rose eye at the guard ———
function drawLadonFang(ctx, L, gl) {
  ctx.save();
  ctx.lineJoin = 'round';
  // the grip: woven briar
  ctx.fillStyle = BRIAR_M;
  ctx.beginPath();
  ctx.roundRect(-3.2, -3, 6.4, 15, 2.5);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  for (let y = -1; y < 11; y += 3) {
    ctx.beginPath();
    ctx.moveTo(-3.2, y);
    ctx.lineTo(3.2, y + 1.8);
    ctx.stroke();
  }
  if (gl) glow(ctx, 0, -L * 0.5, 16, L * 0.62, '200,255,170', 0.4);
  // the blade: wide at the root, hooking forward at the tip like a fang
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-6, -5);
    ctx.bezierCurveTo(-9, -L * 0.45, -6, -L * 0.85, 7, -L);
    ctx.bezierCurveTo(2, -L * 0.8, 6, -L * 0.45, 6, -5);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-7, 0, 7, 0);
  g.addColorStop(0, '#3e5a34');
  g.addColorStop(0.55, '#1e2a1a');
  g.addColorStop(1, '#0e140c');
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  blade();
  ctx.fill();
  ctx.stroke();
  // a pale edge, and the faint green glow of a throat running up its middle
  ctx.strokeStyle = 'rgba(228,236,210,0.75)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-6.5, -10);
  ctx.bezierCurveTo(-8, -L * 0.45, -5, -L * 0.84, 6, -L + 1);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(190,255,150,0.45)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.quadraticCurveTo(-1, -L * 0.5, 2, -L * 0.78);
  ctx.stroke();
  // thorn teeth up its back
  for (let k = 0.2; k < 0.8; k += 0.13) thorn(ctx, 5.6 - k * 2, -L * k, -0.25, 5, 1.5);
  // the guard: a knot of briar with a white rose eye
  ctx.fillStyle = BRIAR;
  ellipse(ctx, 0, -4, 9, 4);
  thorn(ctx, -8, -4, Math.PI + 0.3, 6, 1.6);
  thorn(ctx, 8, -4, -0.3, 6, 1.6);
  rose(ctx, 0, -5, 3.6, gl ? 1 : 0.4);
  ctx.restore();
}
export const LADON_SWORDS = { ladon_fang: drawLadonFang };
export const LADON_SWORD_LEN = { ladon_fang: 70 };

// ——— the Crown of Thorns: a band of black briar round the head, thorns standing up, a white rose at the front and the
// faintest gold-white glint over it (the shard's light, remembered) ———
function drawThornCrown(ctx, w, h, t = 0) {
  const by = -h * 0.72, rx = w * 0.46;
  // thorns standing up out of the band (the back ones first, a little darker)
  for (let i = 0; i < 7; i++) {
    const u = (i - 3) / 3, x = u * rx * 0.92, tall = h * (0.2 + 0.08 * (1 - Math.abs(u))) * (i % 2 ? 0.8 : 1);
    thorn(ctx, x, by - 1, -Math.PI / 2 + u * 0.35, tall, 3.4, i % 2 ? BRIAR : '#2a3a22'); // (dark, so they show on any background)
    thorn(ctx, x + Math.cos(-Math.PI / 2 + u * 0.35) * tall * 0.45, by - 1 + Math.sin(-Math.PI / 2 + u * 0.35) * tall * 0.45, -Math.PI / 2 + u * 0.35, tall * 0.55, 1.4, THORN);
  }
  // the band: two canes twisted round each other
  ctx.lineCap = 'round';
  for (const [c, wd, dy] of [[BRIAR, 6, 0], [BRIAR_M, 3.4, -0.5]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = wd;
    ctx.beginPath();
    ctx.ellipse(0, by + dy, rx, 4.5, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = BRIAR_L;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {
    const x = -rx + (i + 0.5) * (rx / 3);
    ctx.beginPath();
    ctx.moveTo(x - 4, by - 3);
    ctx.lineTo(x + 4, by + 3);
    ctx.stroke();
  }
  // leaves, the rose at the front, the glint
  ctx.fillStyle = '#4e7a3e';
  ellipse(ctx, -9, by + 3, 6, 2.6, -0.4);
  ellipse(ctx, 9, by + 3, 6, 2.6, 0.4);
  rose(ctx, 0, by + 1, 5, 0.6 + 0.2 * Math.sin(t * 2));
  glow(ctx, 0, by - h * 0.16, 10, 10, '255,236,170', 0.35 + 0.15 * Math.sin(t * 3));
}
export const LADON_HELMETS = { thorn_crown: drawThornCrown };

// ——— the mini Ladon (a pet): a little root knot with three tiny heads on short necks, bickering. Every few seconds two of
// them turn on each other and snap, and the third looks away. Feet at the origin, facing +x; ~96 × 62 (petWH) ———
function petHead(ctx, x, y, ang, s, open, t, seed, crown) {
  ctx.save();
  ctx.translate(x, y);
  if (Math.cos(ang) < 0) {
    ctx.scale(-1, 1);
    ang = Math.PI - ang;
  }
  ctx.rotate(ang);
  // frills
  ctx.fillStyle = '#4e7a3e';
  for (const a of [-0.9, 0, 0.9]) {
    ctx.beginPath();
    ctx.ellipse(-7 * s + Math.cos(Math.PI + a) * 4 * s, Math.sin(Math.PI + a) * 5 * s, 6 * s, 2.6 * s, a, 0, TAU);
    ctx.fill();
  }
  // the jaw (opens to snap) and the skull
  ctx.fillStyle = BRIAR_M;
  ctx.save();
  ctx.rotate(open * 0.5);
  ctx.beginPath();
  ctx.ellipse(4 * s, 2.5 * s, 9 * s, 3 * s, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = THORN;
  for (const px of [4, 8]) thorn(ctx, px * s, 0.5 * s, -Math.PI / 2, 2.4 * s, 1 * s);
  ctx.restore();
  ctx.fillStyle = BRIAR;
  ctx.beginPath();
  ctx.ellipse(1 * s, -1.5 * s, 11 * s, 6 * s, -0.08, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(110,150,90,0.6)';
  ellipse(ctx, 0, -4 * s, 6 * s, 1.4 * s);
  if (open > 0.3) {
    ctx.fillStyle = THORN;
    for (const px of [5, 9]) thorn(ctx, px * s, 1.5 * s, Math.PI / 2, 2.4 * s, 1 * s);
  }
  // one big white rose eye (a blink now and then)
  const blink = ((t + seed * 1.7) % 3.6) < 0.12;
  glow(ctx, 2 * s, -2.5 * s, 7 * s, 7 * s, '246,250,240', 0.45);
  ctx.fillStyle = ROSE;
  if (blink) ellipse(ctx, 2 * s, -2.5 * s, 3 * s, 0.7 * s);
  else {
    circle(ctx, 2 * s, -2.5 * s, 3 * s);
    ctx.fillStyle = '#2a2a26';
    circle(ctx, 3 * s, -2.5 * s, 1.2 * s);
  }
  if (crown) {
    for (let i = 0; i < 3; i++) thorn(ctx, (-5 + i * 4) * s, -6.5 * s, -Math.PI / 2 - 0.2 + i * 0.2, 4.5 * s, 1.3 * s);
    glow(ctx, -1 * s, -6 * s, 5 * s, 5 * s, '255,236,170', 0.6);
    ctx.fillStyle = '#fff3c8';
    circle(ctx, -1 * s, -6 * s, 1.3 * s);
  }
  ctx.restore();
}
export function drawLadonPet(ctx, x, y, facing, walking, time, seed = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing < 0 ? -scale : scale, scale);
  const t = time + seed * 3.1, bob = walking ? Math.abs(Math.sin(t * 9)) * 2 : Math.sin(t * 2) * 0.8;
  // the bicker: once every 5 s, for a moment, the two outer heads turn on each other (the middle one looks away)
  const cyc = (t % 5) / 5, fight = cyc > 0.72 && cyc < 0.9 ? Math.sin(((cyc - 0.72) / 0.18) * Math.PI) : 0;
  const snap = fight > 0 ? Math.abs(Math.sin(t * 22)) : 0;
  // feet: little roots
  ctx.strokeStyle = BRIAR;
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  for (const dx of [-14, -4, 8, 16]) {
    ctx.beginPath();
    ctx.moveTo(dx * 0.7, -10);
    ctx.quadraticCurveTo(dx, -4, dx * 1.25 + (walking ? Math.sin(t * 9 + dx) * 2 : 0), 0);
    ctx.stroke();
  }
  // the knot (body)
  ctx.save();
  ctx.translate(0, -bob);
  ctx.fillStyle = '#2a3e24';
  ellipse(ctx, 0, -16, 19, 13);
  ctx.fillStyle = 'rgba(120,160,96,0.35)';
  ellipse(ctx, -5, -22, 9, 4, -0.3);
  ctx.strokeStyle = BRIAR_M;
  ctx.lineWidth = 3;
  for (const [a, b] of [[-0.6, 1.3], [0.4, 2.4], [2.6, 4.2]]) {
    ctx.beginPath();
    ctx.ellipse(0, -16, 15, 9, 0, a, b);
    ctx.stroke();
  }
  glow(ctx, 0, -17, 10, 7, '190,255,140', 0.35 + 0.15 * Math.sin(t * 2.2));
  for (const [tx, ty, a] of [[-18, -22, -2.4], [-6, -29, -1.8], [14, -26, -0.9], [20, -14, -0.2]]) thorn(ctx, tx, ty, a, 6, 2);
  // three necks and their heads: left, middle (crowned: the first head, in small), right
  const heads = [
    { bx: -12, by: -24, hx: -26 + fight * 9, hy: -44, a: Math.PI + 0.5 + fight * (Math.PI - 0.7), open: snap },
    { bx: 0, by: -28, hx: 2 - fight * 4, hy: -54, a: -0.4 - fight * 1.4, open: 0.1 * Math.max(0, Math.sin(t * 1.3)), crown: true },
    { bx: 12, by: -24, hx: 26 - fight * 9, hy: -42, a: -0.4 - fight * (Math.PI - 0.6), open: snap },
  ];
  heads.forEach((hd, i) => {
    const sw = Math.sin(t * 1.6 + i * 2.1) * 2;
    ctx.strokeStyle = '#22321c';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(hd.bx, hd.by);
    ctx.quadraticCurveTo(hd.bx + (hd.hx - hd.bx) * 0.2, (hd.by + hd.hy) / 2, hd.hx + sw, hd.hy + 4);
    ctx.stroke();
    ctx.strokeStyle = BRIAR_M;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    petHead(ctx, hd.hx + sw, hd.hy, hd.a, hd.crown ? 1.3 : 1.12, hd.open, t, i + seed, hd.crown);
  });
  ctx.restore();
  ctx.restore();
}
