// Docs: docs/places/typhon.md, docs/combat/items.md, docs/places/pets.md
// Typhon's rewards' art (E5 (c2)): the Last Hammer (TYPHON_SWORDS, drawn by drawSword in src/field.js), the Furnace Mask
// (TYPHON_HELMETS, drawHelmet) and the mini Typhon pet (drawTyphonPet, called by drawPet in src/furniture.js: a little
// slag serpent with a glowing chest that puffs smoke rings). The Pour Staff, the Hearthstone Rod and the Bellows Bow are
// rows in src/staff-art.js / src/bow-art.js. The shared tell of everything Typhon: black basalt and forge iron cracked
// with orange light, and the tooth's gold-white glow.
import { TAU, circle, ellipse } from './util.js';
import { glow as softGlow } from './glow.js';

const IRON = '#3a3234', IRON_D = '#1e1819', IRON_L = '#6a5a56', INK = '#0e0808', EMBER = '255,140,50', TOOTH = '255,236,170';
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);

// the mark on everything Ignis made: a hammer over a flame (shown, never named), centred at (x, y), s across
function mark(ctx, x, y, s, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 10, s / 10);
  ctx.fillStyle = col;
  ctx.beginPath(); // (the flame)
  ctx.moveTo(0, 5);
  ctx.quadraticCurveTo(-4, 3, -2, -1);
  ctx.quadraticCurveTo(-1, 1, 0, -3);
  ctx.quadraticCurveTo(1, 1, 2, -1);
  ctx.quadraticCurveTo(4, 3, 0, 5);
  ctx.fill();
  ctx.fillRect(-4, -6, 8, 2.4); // (the hammer's head and its handle)
  ctx.fillRect(-0.7, -4, 1.4, 3);
  ctx.restore();
}

// ——— the Last Hammer: a smith's hammer drawn out into a blade. Black forge iron, its edge still glowing, and at the
// tip the hammer's head across it (a striking face behind, the edge in front); the mark on the pommel ———
function drawLastHammer(ctx, L, gl, t = performance.now() / 1000) { // (drawSword passes no time: the edge flickers off the clock)
  ctx.save();
  ctx.lineJoin = 'round';
  // the grip: leather wound over iron, and a round pommel with the mark on it
  ctx.fillStyle = '#4a2e22';
  ctx.beginPath();
  ctx.roundRect(-3, -2, 6, 13, 2.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,170,110,0.3)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 10; y += 3) {
    ctx.beginPath();
    ctx.moveTo(-3, y + 1.6);
    ctx.lineTo(3, y);
    ctx.stroke();
  }
  ctx.fillStyle = IRON;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  circle(ctx, 0, 13.5, 4.4);
  ctx.stroke();
  mark(ctx, 0, 13.5, 6, '#ffb060');
  const hot = 0.55 + 0.25 * Math.sin(t * 2.4);
  if (gl) glow(ctx, 0, -L * 0.55, 16, L * 0.62, EMBER, 0.4);
  // the guard: a short bar of iron, riveted
  ctx.fillStyle = IRON_L;
  ctx.beginPath();
  ctx.roundRect(-9, -5, 18, 4.5, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9a8478';
  for (const x of [-6, 6]) circle(ctx, x, -2.8, 1);
  // the blade: wide and heavy, a straight back, the edge side glowing like iron just out of the fire
  const top = -L * 0.74;
  const g = ctx.createLinearGradient(-7, 0, 7, 0);
  g.addColorStop(0, '#5a4c4a');
  g.addColorStop(0.55, IRON);
  g.addColorStop(1, IRON_D);
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, -5);
  ctx.lineTo(-6.5, top);
  ctx.lineTo(7, top);
  ctx.lineTo(6, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const eg = ctx.createLinearGradient(0, -5, 0, top); // (the hot edge, hottest near the head)
  eg.addColorStop(0, `rgba(255,120,40,${0.25 * hot})`);
  eg.addColorStop(1, `rgba(255,190,90,${0.95 * hot})`);
  ctx.fillStyle = eg;
  ctx.fillRect(3.5, top, 3, -5 - top);
  ctx.strokeStyle = `rgba(255,140,60,${0.6 * hot})`; // (cracks of light in the flat)
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -L * 0.3);
  ctx.lineTo(0.5, -L * 0.36);
  ctx.lineTo(-1, -L * 0.42);
  ctx.moveTo(1, -L * 0.55);
  ctx.lineTo(-1.5, -L * 0.6);
  ctx.stroke();
  // the hammer's head across the tip: a heavy block, its striking face to the back (left), a wedge to the front
  ctx.fillStyle = IRON;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-13, top + 3);
  ctx.lineTo(-13, -L + 2);
  ctx.lineTo(4, -L);
  ctx.lineTo(13, -L * 0.88);
  ctx.lineTo(7, top + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a6660'; // (the striking face, worn bright)
  ctx.beginPath();
  ctx.roundRect(-15, -L + 3, 3.5, top - (-L + 3) + 0.5, 1.4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,200,110,${hot})`; // (its edge, glowing)
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(4, -L);
  ctx.lineTo(13, -L * 0.88);
  ctx.stroke();
  glow(ctx, 10, -L * 0.9, 7, 7, '255,190,90', 0.5 * hot);
  ctx.restore();
}
export const TYPHON_SWORDS = { last_hammer: drawLastHammer };
export const TYPHON_SWORD_LEN = { last_hammer: 76 };

// ——— the Furnace Mask: a smith's iron face-guard worn pushed up on the brow (so you still see the slime's face): a
// riveted iron skullcap and, across the front, the guard plate with four eye slits glowing with the fire behind ———
function drawFurnaceMask(ctx, w, h, t = 0) {
  const by = -h * 0.68, rx = w * 0.5;
  ctx.save();
  ctx.lineJoin = 'round';
  // the skullcap
  const g = ctx.createLinearGradient(0, by - h * 0.42, 0, by + 4);
  g.addColorStop(0, '#5a4c4a');
  g.addColorStop(1, IRON_D);
  ctx.fillStyle = g;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.94, by + 3);
  ctx.bezierCurveTo(-rx * 0.96, by - h * 0.46, rx * 0.96, by - h * 0.46, rx * 0.94, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; // (a riveted band over the crown)
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, by - h * 0.34);
  ctx.lineTo(0, by - h * 0.2);
  ctx.stroke();
  // the hinges at the temples
  for (const s of [-1, 1]) {
    ctx.fillStyle = IRON_L;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    circle(ctx, s * rx * 0.86, by - h * 0.04, 3.4);
    ctx.stroke();
  }
  // the guard plate, flipped up: a curved band of iron across the brow, sooty, four slits glowing
  const py = by - h * 0.1, ph = h * 0.2;
  ctx.fillStyle = IRON;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.86, py + ph * 0.5);
  ctx.quadraticCurveTo(0, py + ph * 0.85, rx * 0.86, py + ph * 0.5);
  ctx.lineTo(rx * 0.8, py - ph * 0.45);
  ctx.quadraticCurveTo(0, py - ph * 0.8, -rx * 0.8, py - ph * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; // (soot along its lower lip)
  ctx.beginPath();
  ctx.moveTo(-rx * 0.84, py + ph * 0.3);
  ctx.quadraticCurveTo(0, py + ph * 0.65, rx * 0.84, py + ph * 0.3);
  ctx.quadraticCurveTo(0, py + ph * 0.85, -rx * 0.84, py + ph * 0.5);
  ctx.fill();
  const hot = 0.6 + 0.25 * Math.sin(t * 2.2);
  for (const [sx, sy] of [[-0.5, -0.08], [-0.17, 0.02], [0.17, 0.02], [0.5, -0.08]]) {
    const x = sx * rx, y = py + sy * ph;
    glow(ctx, x, y, 7, 4, EMBER, 0.45 * hot);
    ctx.fillStyle = `rgba(255,${170 + 50 * hot},${90 + 40 * hot},1)`;
    ctx.beginPath();
    ctx.roundRect(x - rx * 0.12, y - 1.5, rx * 0.24, 3, 1.5);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = '#9a8478'; // (rivets along it)
  for (const sx of [-0.68, -0.34, 0, 0.34, 0.68]) circle(ctx, sx * rx, py + ph * (0.38 + 0.12 * (1 - Math.abs(sx))), 1.1);
  mark(ctx, 0, by - h * 0.27, 7, 'rgba(255,170,90,0.75)');
  ctx.restore();
}
export const TYPHON_HELMETS = { furnace_mask: drawFurnaceMask };

// ——— the mini Typhon (a pet): a little slag serpent, coiled like a loaf with its head up, black basalt scales cracked
// with orange, a glowing gold-white chest. Every few seconds it puffs a smoke ring and watches it go, pleased. Feet at
// the origin, facing +x; ~70 × 52 (petWH) ———
export function drawTyphonPet(ctx, x, y, facing, walking, time, seed = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing < 0 ? -scale : scale, scale);
  const t = time + seed * 1.9, cyc = (t % 5) / 5, puffK = cyc > 0.6 ? (cyc - 0.6) / 0.4 : -1;
  const breathe = Math.sin(t * 2) * 0.8, slide = walking ? Math.sin(t * 9) : 0;
  const lift = puffK >= 0 && puffK < 0.15 ? Math.sin((puffK / 0.15) * Math.PI) * 2 : 0;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // the smoke ring, drifting up and away, fading as it widens
  if (puffK >= 0.08) {
    const k = (puffK - 0.08) / 0.92, rx0 = 3 + k * 9;
    ctx.strokeStyle = `rgba(150,140,140,${0.75 * (1 - k)})`;
    ctx.lineWidth = 2.6 - k;
    ctx.beginPath();
    ctx.ellipse(30 + k * 12, -44 - k * 22, rx0, rx0 * 0.45, -0.2, 0, TAU);
    ctx.stroke();
  }
  // the coils: three fat rings of tail, back to front, each a little smaller
  const ring = (cx, cy, rx, ry, col) => {
    ctx.fillStyle = col;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ellipse(ctx, cx, cy, rx, ry);
    ctx.stroke();
  };
  ring(-14 + slide, -9, 18, 8, '#2a2224');
  ring(-6 - slide, -14, 17, 8, '#342a2c');
  // a glowing crack along each coil
  ctx.strokeStyle = `rgba(${EMBER},0.85)`;
  ctx.lineWidth = 1.3;
  for (const [cx, cy, rx] of [[-14 + slide, -9, 18], [-6 - slide, -14, 17]]) {
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.6, cy - 2);
    ctx.lineTo(cx - rx * 0.2, cy + 1);
    ctx.lineTo(cx + rx * 0.1, cy - 2);
    ctx.lineTo(cx + rx * 0.5, cy + 1);
    ctx.stroke();
  }
  // the tail's tip curling out behind, a little ember at its end
  ctx.strokeStyle = '#2a2224';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-28, -10);
  ctx.quadraticCurveTo(-36, -14 + Math.sin(t * 3) * 2, -33, -22 + Math.sin(t * 3) * 3);
  ctx.stroke();
  glow(ctx, -33, -22 + Math.sin(t * 3) * 3, 4, 4, EMBER, 0.8);
  // the neck rising out of the coils in an S (the chest bulges as it breathes in before a puff), lighter belly scales
  // down its front and, set in them, the glowing chest behind two little ribs
  const inhale = puffK >= 0 && puffK < 0.1 ? puffK / 0.1 : cyc > 0.45 && cyc <= 0.6 ? (cyc - 0.45) / 0.15 : 0;
  const swell = 1 + 0.15 * inhale;
  ctx.save();
  ctx.translate(0, -lift);
  const neck = () => {
    ctx.beginPath();
    ctx.moveTo(-4, -12);
    ctx.bezierCurveTo(12, -18, -2, -34, 10, -42 + breathe);
  };
  for (const [lw, col] of [[19 * swell, INK], [15 * swell, IRON]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    neck();
    ctx.stroke();
  }
  ctx.strokeStyle = '#5a4844'; // (belly scales down its front)
  ctx.lineWidth = 2;
  for (let k = 0; k < 4; k++) {
    const y = -16 - k * 6.5, x = 6 + Math.sin(k * 1.3) * 2;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.quadraticCurveTo(x + 1, y + 2, x + 5, y);
    ctx.stroke();
  }
  glow(ctx, 6, -26, 8 * swell, 8 * swell, TOOTH, 0.7 + 0.3 * inhale + 0.1 * Math.sin(t * 4));
  ctx.fillStyle = '#fff2c4';
  ellipse(ctx, 6, -26, 2.6 * swell, 3.4 * swell);
  ctx.strokeStyle = '#2a2022';
  ctx.lineWidth = 1.4;
  for (const dx of [-1.6, 1.6]) {
    ctx.beginPath();
    ctx.moveTo(6 + dx * swell, -30);
    ctx.quadraticCurveTo(6 + dx * 1.6 * swell, -26, 6 + dx * swell, -22);
    ctx.stroke();
  }
  ctx.translate(12, -44 + breathe);
  // the head: a blunt ingot of a face, a little mane of smoke, four eyes (two big, two small), a mouth that puffs
  for (let k = 0; k < 4; k++) { // (the smoke mane)
    ctx.fillStyle = `rgba(90,80,82,${0.55 - k * 0.08})`;
    circle(ctx, -9 + k * 2, -6 - k * 3 + Math.sin(t * 2 + k) * 1.2, 5 - k * 0.6);
  }
  ctx.fillStyle = '#3e3234';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-9, -9, 22, 15, 5);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(${EMBER},0.7)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-6, -7);
  ctx.lineTo(-3, -4);
  ctx.stroke();
  const blink = (t * 0.7) % 4 < 0.12 ? 0.15 : 1;
  for (const [ex, ey, r] of [[3, -4, 2.2], [9, -4, 2.2], [2, 0, 1.3], [8, 0, 1.3]]) {
    glow(ctx, ex, ey, r * 2.4, r * 2, '255,170,60', 0.5 * blink);
    ctx.fillStyle = '#ffe6a8';
    ctx.beginPath();
    ctx.ellipse(ex, ey, r, r * blink, 0, 0, TAU);
    ctx.fill();
  }
  // its mouth: a line, rounding into an O to puff
  ctx.fillStyle = '#1a0e0a';
  if (puffK >= 0 && puffK < 0.25) {
    glow(ctx, 14, 3, 4, 3, EMBER, 0.6);
    circle(ctx, 13.5, 3, 1.8);
  } else {
    ctx.strokeStyle = '#1a0e0a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(8, 3.5);
    ctx.lineTo(13, 3);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}
