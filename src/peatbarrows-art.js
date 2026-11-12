// Docs: docs/places/peatbarrows.md, docs/combat/stages.md
// L5 (b)'s art that isn't a room (the room is src/peatbarrows.js, the approach src/lamproad.js): the Peat Barrows'
// creatures (wick grub, peat wraith, lamp-bearer, dusk moth) and its named elite the Eldest (PEATBARROWS_MOB_ART, called by
// drawMob in src/field.js); their materials' icons (PEATBARROWS_ICONS); and gear for players (PEATBARROWS_SWORDS,
// PEATBARROWS_SWORD_LEN, PEATBARROWS_HELMETS): the lamp-bearer's rare Lamp-Carrier's Hood and the Eldest's Cradle-Silk Blade
// (its staff and bow are rows in src/staff-art.js and src/bow-art.js). Lantern Fen's register at its deepest: black peat,
// grey-violet moth fur and wing-dust, pale silk, and the small warm lights of the dead's lanterns.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2e2a3a';
const PEAT_D = '#18120c';
const FUR = '#8a8090', FUR_D = '#4e4656', FUR_L = '#b8b0bc';
const SILK = '#e2dce8', SILK_D = '#a8a0b0';
const TALLOW = '#ece2c4', TALLOW_D = '#b8a880';
const LAMP = '255,214,150';

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, col = INKC, shut = false } = {}) {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.8) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (shut || blink) {
      ctx.beginPath();
      ctx.arc(ex, fy - 1, 2.4 * size, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, 3.2 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
      ctx.fillStyle = col;
    }
  }
}
function softGlow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// a wick standing up out of tallow, its flame (tall when it's angry)
function wick(ctx, x, y, s, t, seed, live, tall = 1) {
  ctx.strokeStyle = '#1e1a1e';
  ctx.lineWidth = 1.6 * s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 1 * s, y - 6 * s);
  ctx.stroke();
  if (!live) return;
  const fy = y - 6 * s, fl = Math.sin(t * 12 + seed) * 1.5 * s;
  softGlow(ctx, x, fy - 6 * s, 22 * s * tall, LAMP, 0.45);
  ctx.fillStyle = 'rgba(255,226,168,0.95)';
  ctx.beginPath();
  ctx.moveTo(x - 3.5 * s, fy);
  ctx.quadraticCurveTo(x - 4 * s, fy - 7 * s * tall, x + fl, fy - 13 * s * tall);
  ctx.quadraticCurveTo(x + 4 * s, fy - 7 * s * tall, x + 3.5 * s, fy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fffbe8';
  ellipse(ctx, x, fy - 3 * s, 1.4 * s, 2.6 * s * tall);
}

// Wick grub: one of the Wickmother's caterpillars, fat and pale as tallow, ringed, little stubby legs, soft grey bristles,
// and a lit wick standing up out of its back like a candle's, wax dripping down its sides; it inches along leaving hot
// tallow behind (the `trail`)
function drawWickGrub(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, walk = !!m.walking && live;
  const hump = walk ? (Math.sin(t * 7 + seed) * 0.5 + 0.5) * h * 0.3 : h * 0.08;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.quadraticCurveTo(-w * 0.52, -h * 0.72, -w * 0.22, -h * 0.74 - hump * 0.5);
    ctx.quadraticCurveTo(0, -h * 0.86 - hump, w * 0.22, -h * 0.76 - hump * 0.5);
    ctx.quadraticCurveTo(w * 0.52, -h * 0.84, w * 0.5, -h * 0.2);
    ctx.lineTo(w * 0.46, 0);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, TALLOW);
  g.addColorStop(1, TALLOW_D);
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = 'rgba(140,120,90,0.6)'; // the rings
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 1; i < 8; i++) {
    const x = -w * 0.5 + (i / 8) * w;
    ctx.moveTo(x, -1);
    ctx.lineTo(x + 2, -h * 0.68 - Math.sin((i / 8) * Math.PI) * hump);
  }
  ctx.stroke();
  ctx.strokeStyle = '#8a7a5a';
  ctx.lineWidth = 1.8;
  body();
  ctx.stroke();
  ctx.fillStyle = '#8a7a5a'; // little stubby legs
  for (let i = 0; i < 6; i++) ellipse(ctx, -w * 0.38 + i * w * 0.15, -1, 3, 2.4);
  ctx.strokeStyle = 'rgba(160,150,170,0.6)'; // soft bristles
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const x = -w * 0.42 + i * w * 0.09, y = -h * 0.72 - Math.sin(((i + 1) / 11) * Math.PI) * hump;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y - 5);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(236,226,196,0.85)'; // wax drips down its side
  for (const dx of [-0.12, 0.02, 0.14]) {
    ctx.beginPath();
    ctx.ellipse(w * dx, -h * 0.6 - hump * 0.8, 2.4, 6, 0, 0, TAU);
    ctx.fill();
  }
  wick(ctx, 0, -h * 0.82 - hump, 1, t, seed, live, m.warn ? 1.4 : 1);
  ctx.fillStyle = '#5a4a3a'; // the head
  ellipse(ctx, w * 0.46, -h * 0.3, w * 0.1, h * 0.26);
  if (live) eyes(ctx, w * 0.48, -h * 0.36, 3.2, t, seed, { size: 0.6, col: '#f4ecd8' });
  else eyes(ctx, w * 0.48, -h * 0.36, 3.2, t, seed, { dying, size: 0.6, col: '#f4ecd8' });
  return body;
}

// Peat wraith: a mourner made of peat-smoke, hooded, its shape coming and going at the edges, carrying a lantern out in
// front in a hand that's only smoke; two pale points for eyes under the hood. m.special: gone down into the peat (only a
// lantern's light moving under the floor and a curl of smoke: it comes up behind you, the `blink` brain)
function drawPeatWraith(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, under = live && !!m.special;
  const sway = Math.sin(t * 1.6 + seed) * 3;
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, 0);
    for (let i = 0; i <= 6; i++) ctx.lineTo(-w * 0.42 + (i / 6) * w * 0.84, -4 + Math.sin(t * 4 + i * 1.7 + seed) * 4);
    ctx.lineTo(w * 0.36, -h * 0.5);
    ctx.quadraticCurveTo(w * 0.3 + sway, -h * 1.02, 0 + sway, -h);
    ctx.quadraticCurveTo(-w * 0.34 + sway, -h * 0.98, -w * 0.38, -h * 0.5);
    ctx.closePath();
  };
  if (under) {
    const k = (t * 1.2 + seed) % 1;
    softGlow(ctx, 0, -2, 22, LAMP, 0.35 * (1 - k * 0.5));
    ctx.fillStyle = `rgba(60,48,40,${0.5 * (1 - k)})`;
    ellipse(ctx, Math.sin(t * 3) * 3, -6 - k * 20, 6 + k * 8, 4 + k * 6);
    return shape;
  }
  ctx.save();
  ctx.globalAlpha = live ? 0.88 : 0.6;
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#3e3430');
  g.addColorStop(1, 'rgba(46,38,34,0.25)');
  ctx.fillStyle = g;
  shape();
  ctx.fill();
  ctx.fillStyle = 'rgba(14,10,8,0.85)'; // the hood's dark
  ctx.beginPath();
  ctx.ellipse(w * 0.06 + sway, -h * 0.76, w * 0.2, h * 0.14, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = live ? '#e8e4d8' : '#6a6460'; // pale points for eyes
  circle(ctx, w * 0.02 + sway, -h * 0.77, 1.8);
  circle(ctx, w * 0.14 + sway, -h * 0.77, 1.8);
  ctx.restore();
  // the smoke hand and its lantern, held out in front
  const lx = w * 0.46, ly = -h * 0.44 + Math.sin(t * 1.6 + seed + 1) * 2;
  ctx.strokeStyle = 'rgba(62,52,48,0.7)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.24, -h * 0.56);
  ctx.quadraticCurveTo(w * 0.38, -h * 0.6, lx, ly - 10);
  ctx.stroke();
  if (live) softGlow(ctx, lx, ly, 26, LAMP, m.warn ? 0.6 : 0.4);
  ctx.fillStyle = live ? 'rgba(255,226,168,0.9)' : '#5a5050';
  ctx.fillRect(lx - 4, ly - 4, 8, 11);
  ctx.strokeStyle = '#1e1a1e';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(lx - 4.5, ly - 4.5, 9, 12);
  ctx.beginPath();
  ctx.moveTo(lx, ly - 4.5);
  ctx.lineTo(lx, ly - 10);
  ctx.stroke();
  return shape;
}

// Lamp-bearer: an old fen slime gone peat-dark and leathery, in a hood and a reed cape, still carrying a lantern down for
// somebody, holding it out in front with both hands; it walks slow and won't let you near the light (its front is the
// `shell`: hit it from behind). A name tag hangs off the lantern
function drawLampBearer(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, walk = !!m.walking && live, warn = !!m.warn && live;
  const bob = walk ? Math.abs(Math.sin(t * 4 + seed)) * 2 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.46, 0);
    ctx.quadraticCurveTo(-w * 0.5, -h * 0.6, -w * 0.18, -h * 0.86 - bob);
    ctx.quadraticCurveTo(w * 0.1, -h * 0.98 - bob, w * 0.3, -h * 0.76 - bob);
    ctx.quadraticCurveTo(w * 0.48, -h * 0.4, w * 0.44, 0);
    ctx.closePath();
  };
  ctx.fillStyle = '#4a3a2c';
  body();
  ctx.fill();
  ctx.strokeStyle = PEAT_D;
  ctx.lineWidth = 2;
  body();
  ctx.stroke();
  ctx.fillStyle = '#6a5a3e'; // the reed cape over its shoulders
  ctx.beginPath();
  ctx.moveTo(-w * 0.48, -h * 0.36);
  ctx.quadraticCurveTo(-w * 0.3, -h * 0.84 - bob, w * 0.1, -h * 0.84 - bob);
  ctx.quadraticCurveTo(w * 0.36, -h * 0.7, w * 0.3, -h * 0.34);
  ctx.lineTo(-w * 0.48, -h * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,30,18,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const x = -w * 0.44 + i * w * 0.09;
    ctx.moveTo(x, -h * 0.74);
    ctx.lineTo(x - 2, -h * 0.34);
  }
  ctx.stroke();
  ctx.fillStyle = '#2e241c'; // the hood
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.86 - bob, w * 0.26, h * 0.14, -0.15, Math.PI, TAU);
  ctx.fill();
  if (live) eyes(ctx, w * 0.12, -h * 0.66 - bob, 4, t, seed, { size: 0.7, col: '#e8e0c8', shut: !warn && ((t + seed) % 7) < 2 });
  else eyes(ctx, w * 0.12, -h * 0.66, 4, t, seed, { dying, size: 0.7, col: '#e8e0c8' });
  // both hands out, the lantern held in front (its light the shell's face)
  const lx = w * 0.56, ly = -h * 0.42 - bob + (warn ? -6 : 0);
  ctx.strokeStyle = '#4a3a2c';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.3, -h * 0.46 - bob);
  ctx.lineTo(lx - 4, ly - 10);
  ctx.stroke();
  if (live) softGlow(ctx, lx, ly, warn ? 44 : 32, LAMP, warn ? 0.65 : 0.45);
  ctx.fillStyle = live ? 'rgba(255,226,168,0.95)' : '#5a5050';
  ctx.fillRect(lx - 6, ly - 6, 12, 16);
  ctx.strokeStyle = '#1e1a1e';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(lx - 6.5, ly - 6.5, 13, 17);
  ctx.beginPath();
  ctx.moveTo(lx - 7, ly - 6.5);
  ctx.lineTo(lx, ly - 12);
  ctx.lineTo(lx + 7, ly - 6.5);
  ctx.stroke();
  ctx.fillStyle = '#e8dcc0'; // its tag
  ctx.fillRect(lx + 4, ly + 10 + Math.sin(t * 1.4 + seed) * 1.5, 5, 7);
  return body;
}

// Dusk moth: a great grey moth as wide as a door, furred, its wings dusty grey-violet with a pale eye spot on each, soft
// feathered antennae, a fat furred body; it hangs asleep on the roof and drops on anything carrying a light (`dive`).
// Its wings beat slow when it hovers, fast as it stoops
function drawDuskMoth(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const beat = live ? Math.sin(t * (warn ? 18 : 7) + seed) : -0.6;
  const wing = (d, up) => {
    ctx.beginPath();
    const s = up ? 1 : 0.7, lift = up ? -h * 0.2 * (0.6 + 0.4 * beat) : h * 0.05;
    ctx.moveTo(0, -h * 0.5);
    ctx.bezierCurveTo(d * w * 0.3 * s, -h * 0.9 + lift, d * w * 0.56 * s, -h * 0.78 + lift, d * w * 0.5 * s, -h * 0.46 + lift * 0.4);
    ctx.quadraticCurveTo(d * w * 0.3 * s, -h * (up ? 0.36 : 0.2), 0, -h * 0.42);
    ctx.closePath();
  };
  const silhouette = () => {
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.55, w * 0.5, h * 0.42, 0, 0, TAU);
  };
  for (const d of [-1, 1]) {
    ctx.fillStyle = FUR_D;
    wing(d, false);
    ctx.fill();
    ctx.fillStyle = FUR;
    wing(d, true);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,34,46,0.7)';
    ctx.lineWidth = 1.4;
    wing(d, true);
    ctx.stroke();
    const ex = d * w * 0.3, ey = -h * 0.66 - h * 0.12 * (0.6 + 0.4 * beat); // the eye spot, like a lantern seen through fog
    ctx.fillStyle = FUR_L;
    ellipse(ctx, ex, ey, 7, 6);
    ctx.fillStyle = live ? 'rgba(255,214,150,0.7)' : '#6a6060';
    ellipse(ctx, ex, ey, 3.6, 3.2);
    ctx.fillStyle = '#2e2836';
    circle(ctx, ex + 0.6, ey, 1.4);
  }
  ctx.fillStyle = '#5e5664'; // the furred body
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.46, w * 0.08, h * 0.28, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,192,206,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.moveTo(-w * 0.07, -h * 0.6 + i * h * 0.06);
    ctx.lineTo(w * 0.07, -h * 0.58 + i * h * 0.06);
  }
  ctx.stroke();
  ctx.fillStyle = '#6e6674'; // the head, feathered antennae
  circle(ctx, w * 0.04, -h * 0.76, w * 0.07);
  ctx.strokeStyle = '#8a8090';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const d of [-1, 1]) {
    ctx.moveTo(w * 0.04 + d * 3, -h * 0.82);
    ctx.quadraticCurveTo(w * 0.04 + d * 12, -h * 0.98, w * 0.04 + d * 18, -h * 0.96);
  }
  ctx.stroke();
  ctx.fillStyle = '#16121a';
  for (const d of [-1, 1]) ellipse(ctx, w * 0.06 + d * 4, -h * 0.76, 2.8, 3.4); // huge soft black eyes
  if (!live) {
    ctx.strokeStyle = '#e8e0f0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const d of [-1, 1]) {
      ctx.moveTo(w * 0.06 + d * 4 - 2, -h * 0.78);
      ctx.lineTo(w * 0.06 + d * 4 + 2, -h * 0.74);
    }
    ctx.stroke();
  }
  // wing-dust coming off it
  if (live) {
    ctx.fillStyle = 'rgba(232,226,240,0.6)';
    for (let i = 0; i < 5; i++) {
      const k = (t * 0.7 + i / 5 + seed) % 1;
      circle(ctx, Math.sin(i * 2.3 + seed) * w * 0.4, -h * 0.4 + k * h * 0.5, 1.1);
    }
  }
  return silhouette;
}

// The Eldest: the Wickmother's first child, a wick grub grown as long as a barge that never turned into a moth, coiled
// across the foot of the root stair: tallow-pale gone yellow with age, its rings cracked, a great wick standing up out of
// its back burning tall, old silk trailing off it where it began a cocoon and never finished. Before it heaves at you
// (warn) the wick flares and it rears its front end up
function drawEldest(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, walk = !!m.walking && live;
  const rear = warn ? h * 0.35 : 0, wave = (i) => (walk ? Math.sin(t * 5 + i * 0.9) * 3 : Math.sin(t * 1.2 + i) * 1.2);
  const N = 9;
  const segY = (i) => -h * 0.36 - (i >= N - 3 ? rear * ((i - (N - 4)) / 3) : 0) + wave(i);
  const segX = (i) => -w * 0.44 + (i / (N - 1)) * w * 0.86;
  const silhouette = () => {
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.4, w * 0.5, h * 0.42, 0, 0, TAU);
  };
  // old silk trailing off it, where it began a cocoon once and never finished
  ctx.strokeStyle = 'rgba(226,220,232,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const x = segX(i + 1);
    ctx.moveTo(x, segY(i + 1) - h * 0.2);
    ctx.quadraticCurveTo(x - 20, segY(i + 1) - h * 0.6, x - 40 - i * 6, -h * 1.1);
  }
  ctx.stroke();
  for (let i = 0; i < N; i++) { // the segments, back to front
    const x = segX(i), y = segY(i), r = h * (0.3 + 0.08 * Math.sin((i / (N - 1)) * Math.PI));
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 2, x, y, r);
    g.addColorStop(0, '#f2e8c8');
    g.addColorStop(1, '#a89468');
    ctx.fillStyle = g;
    circle(ctx, x, y, r);
    ctx.strokeStyle = 'rgba(110,90,60,0.6)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,100,70,0.5)'; // cracks in its old skin
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.3, y - r * 0.6);
    ctx.lineTo(x - r * 0.1, y - r * 0.2);
    ctx.lineTo(x + r * 0.2, y - r * 0.35);
    ctx.stroke();
    ctx.fillStyle = '#8a7a5a'; // stubby legs
    ellipse(ctx, x, -2, 5, 3.6);
  }
  wick(ctx, segX(4), segY(4) - h * 0.34, 2.2, t, seed, live, warn ? 1.6 : 1);
  ctx.fillStyle = 'rgba(236,226,196,0.85)'; // wax run down from it
  for (const dx of [-14, 6, 18]) ellipse(ctx, segX(4) + dx, segY(4) - h * 0.22, 3.4, 9);
  const hx = segX(N - 1) + h * 0.22, hy = segY(N - 1) - h * 0.02; // the head
  ctx.fillStyle = '#5a4a3a';
  ellipse(ctx, hx, hy, h * 0.18, h * 0.22);
  if (live) eyes(ctx, hx + 2, hy - h * 0.06, 6, t, seed, { size: 1.1, col: '#f4ecd8', shut: !warn && ((t + seed) % 9) < 3 });
  else eyes(ctx, hx + 2, hy - h * 0.06, 6, t, seed, { dying, size: 1.1, col: '#f4ecd8' });
  return silhouette;
}

export const PEATBARROWS_MOB_ART = { wick_grub: drawWickGrub, peat_wraith: drawPeatWraith, lamp_bearer: drawLampBearer, dusk_moth: drawDuskMoth, eldest: drawEldest };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
// The Cradle-Silk Blade: a long pale blade wound from hilt to point in the Eldest's silk, gone hard as horn, a little
// wick-flame sealed in glass at the guard
function drawCradleBlade(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,214,150,0.85)';
    ctx.shadowBlur = 12;
  }
  const g = ctx.createLinearGradient(-6, 0, 6, 0);
  g.addColorStop(0, SILK_D);
  g.addColorStop(0.5, '#f4f0f6');
  g.addColorStop(1, '#bab2c2');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-4, -L * 0.24);
  ctx.lineTo(-4.6, -L * 0.9);
  ctx.quadraticCurveTo(0, -L * 1.04, 4.6, -L * 0.9);
  ctx.lineTo(4, -L * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(150,140,160,0.6)'; // the silk wound round it
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -L * 0.27; y > -L * 0.92; y -= 4.2) {
    ctx.moveTo(-4.4, y);
    ctx.lineTo(4.4, y - 2.4);
  }
  ctx.stroke();
  ctx.fillStyle = '#4a3a2c';
  ctx.fillRect(-7, -L * 0.26, 14, 4);
  ctx.fillStyle = 'rgba(255,240,200,0.8)'; // the flame sealed in glass at the guard
  ellipse(ctx, 0, -L * 0.24, 3, 3);
  ctx.fillStyle = 'rgba(255,214,150,0.95)';
  ellipse(ctx, 0, -L * 0.245, 1.2, 2);
  ctx.fillStyle = '#2a2018'; // the grip, bound in silk
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.22, 5.2, L * 0.22, 2);
  ctx.fill();
  ctx.strokeStyle = SILK_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -L * 0.2; y < 0; y += 3.2) {
    ctx.moveTo(-2.6, y);
    ctx.lineTo(2.6, y + 1.6);
  }
  ctx.stroke();
  ctx.restore();
}
export const PEATBARROWS_SWORDS = { cradle_blade: drawCradleBlade };
export const PEATBARROWS_SWORD_LEN = { cradle_blade: 66 };

// ——— helmets: (ctx, w, h) on a slime of that size, feet at the origin ———
// The Lamp-Carrier's Hood: a deep hood of peat-brown wool, a brass hook stitched in at the brow for a lantern, a little
// lantern hanging off it
function drawCarrierHood(ctx, w, h) {
  const by = -h * 0.6, rx = w * 0.56;
  ctx.fillStyle = '#5a4430';
  ctx.strokeStyle = '#2e2216';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 16);
  ctx.bezierCurveTo(-rx * 1.06, by - h * 0.52, rx * 1.02, by - h * 0.52, rx, by + 16);
  ctx.quadraticCurveTo(rx * 0.6, by, 0, by - 2);
  ctx.quadraticCurveTo(-rx * 0.6, by, -rx, by + 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(30,22,14,0.35)'; // the weave
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const y = by - h * 0.06 - i * h * 0.06;
    ctx.moveTo(-rx * (0.82 - i * 0.08), y);
    ctx.lineTo(rx * (0.82 - i * 0.08), y - 1);
  }
  ctx.stroke();
  const hx = rx * 0.1, hy = by - h * 0.34; // the hook and its little lantern
  ctx.strokeStyle = '#a8783a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx + 10, hy - 4);
  ctx.lineTo(hx + 12, hy + 4);
  ctx.stroke();
  softGlow(ctx, hx + 12, hy + 12, 16, LAMP, 0.5);
  ctx.fillStyle = 'rgba(255,226,168,0.95)';
  ctx.fillRect(hx + 9, hy + 6, 6, 9);
  ctx.strokeStyle = '#1e1a1e';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(hx + 8.5, hy + 5.5, 7, 10);
}
export const PEATBARROWS_HELMETS = { carrier_hood: drawCarrierHood };

// ——— materials' icons (centred on the origin, about 28 px across) ———
function iconGrubTallow(ctx) {
  ctx.fillStyle = TALLOW;
  ctx.beginPath();
  ctx.moveTo(-12, 8);
  ctx.quadraticCurveTo(-13, -6, -2, -9);
  ctx.quadraticCurveTo(12, -10, 12, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = TALLOW_D;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,240,0.6)';
  ellipse(ctx, -4, -4, 4, 2, -0.3);
  ctx.fillStyle = TALLOW_D;
  ellipse(ctx, 6, 9, 2, 3);
}
function iconPeatSmoke(ctx) {
  ctx.strokeStyle = '#6a6670';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-8, -10, 16, 22, 5); // the jar
  ctx.stroke();
  ctx.fillStyle = '#5a4430';
  ctx.fillRect(-6, -13, 12, 4); // its stopper
  ctx.strokeStyle = 'rgba(80,66,60,0.85)'; // the smoke curling inside
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-3, 8);
  ctx.bezierCurveTo(-8, 2, 6, 0, 0, -4);
  ctx.bezierCurveTo(-5, -7, 4, -8, 2, -6);
  ctx.stroke();
}
function iconCarrierTag(ctx) {
  ctx.save();
  ctx.rotate(-0.2);
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(6, -6);
  ctx.lineTo(11, 0);
  ctx.lineTo(6, 6);
  ctx.lineTo(-10, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a89878';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#5a4a3a';
  circle(ctx, 6, 0, 1.4);
  ctx.strokeStyle = 'rgba(120,100,80,0.4)'; // the name, rubbed away
  ctx.beginPath();
  ctx.moveTo(-7, -1);
  ctx.lineTo(2, -1);
  ctx.moveTo(-7, 2);
  ctx.lineTo(0, 2);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = '#8a7a60';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(7, -1);
  ctx.quadraticCurveTo(12, -10, 6, -12);
  ctx.stroke();
}
function iconDuskScale(ctx) {
  ctx.fillStyle = '#f2ecdc'; // a twist of paper
  ctx.beginPath();
  ctx.moveTo(-10, 8);
  ctx.lineTo(10, 8);
  ctx.lineTo(4, -6);
  ctx.lineTo(0, -12);
  ctx.lineTo(-4, -6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b8b0a0';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,150,176,0.9)'; // the dust, silver and grey
  for (const [x, y] of [[-5, 4], [-1, 5], [3, 3], [6, 6], [0, 1], [-3, 7]]) circle(ctx, x, y, 1.4);
  ctx.fillStyle = '#ffffff';
  circle(ctx, 2, 4, 0.8);
}
export const PEATBARROWS_ICONS = { grub_tallow: iconGrubTallow, peat_smoke: iconPeatSmoke, carrier_tag: iconCarrierTag, dusk_scale: iconDuskScale };
