// Docs: docs/places/thornheart.md, docs/combat/stages.md
// The Thornheart's art that isn't the room itself (src/thornheart.js): its creatures (thornback, thistle
// puff and its thistledown, pitcher plant, thorn stalker and the Thorn Hart, a field boss;
// THORN_MOB_ART, called by drawMob in src/field.js), the gear dropped there (THORN_SWORDS,
// THORN_SWORD_LEN, THORN_HELMETS, drawn by drawSword / drawHelmet in src/field.js) and its materials'
// icons (THORN_ICONS).
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
function face(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, cross = false } = {}) {
  ctx.strokeStyle = INKC;
  ctx.fillStyle = INKC;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.6) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (blink) {
      ctx.beginPath();
      ctx.arc(ex, fy - 1, 2.4 * size, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ctx.fillStyle = INKC;
      ellipse(ctx, ex, fy, 2.4 * size, 3.2 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
    }
  }
  if (cross && dying < 0.05) {
    ctx.strokeStyle = INKC;
    ctx.lineWidth = 1.6 * size;
    ctx.beginPath();
    ctx.moveTo(fx - gap - 3 * size, fy - 6 * size); ctx.lineTo(fx - gap + 2.5 * size, fy - 4.5 * size);
    ctx.moveTo(fx + gap + 3 * size, fy - 6 * size); ctx.lineTo(fx + gap - 2.5 * size, fy - 4.5 * size);
    ctx.stroke();
  }
}
function blush(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(255,140,160,0.35)';
  ellipse(ctx, x, y, r, r * 0.6);
}
function halo(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// a single thorn at (x, y), pointing at angle a
function thorn(ctx, x, y, a, len, base, fill = '#e9c6d4') {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a + Math.PI / 2) * base, y + Math.sin(a + Math.PI / 2) * base);
  ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  ctx.lineTo(x + Math.cos(a - Math.PI / 2) * base, y + Math.sin(a - Math.PI / 2) * base);
  ctx.closePath();
  ctx.fill();
}
// a little white wild rose
function rose(ctx, x, y, r, open = 1) {
  ctx.fillStyle = '#fbf6f4';
  ctx.strokeStyle = 'rgba(200,170,180,0.8)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.55 * open, y + Math.sin(a) * r * 0.55 * open, r * 0.55, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#f4d060';
  circle(ctx, x, y, r * 0.3);
}

// Thornback: a stocky plum-brown boar with a crest of thorny bristles down its back and a mask of thorns
// over its snout (that's the side it shields: hit it from behind), two little tusks.
// m.warn: rears back, head low · m.charging: lunges, snout first.
function drawThornback(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, lunge = !!m.charging && live;
  const cy = -h * 0.48, rx = w * 0.44, ry = h * 0.4;
  // legs
  ctx.fillStyle = '#4a2e3a';
  const step = m.walking || lunge ? Math.sin(t * 16) * 3 : 0;
  for (const [x, s] of [[-0.6, 1], [-0.3, -1], [0.35, 1], [0.6, -1]]) {
    ctx.beginPath();
    ctx.roundRect(rx * x - 4 + step * s, cy + ry * 0.4, 8, -cy - ry * 0.4, 3);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(0, cy);
  ctx.rotate(warn ? -0.12 : lunge ? 0.08 : 0);
  ctx.translate(0, -cy);
  const body = () => ctx.ellipse(0, cy, rx, ry, 0, 0, TAU);
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, '#8a5a70');
  g.addColorStop(1, '#5e3a4c');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3a2230';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // the crest of thorny bristles
  for (let i = 0; i < 7; i++) {
    const k = i / 6, a = -Math.PI + 0.45 + k * (Math.PI - 0.9);
    const x = Math.cos(a) * rx * 0.95, y = cy + Math.sin(a) * ry * 0.95;
    thorn(ctx, x, y, a + Math.sin(t * 2 + i) * 0.05, ry * (0.5 + 0.2 * Math.sin(k * Math.PI)), 3.2, '#d8a8c0');
  }
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ellipse(ctx, -rx * 0.2, cy - ry * 0.4, rx * 0.4, ry * 0.18, -0.15);
  // the head at the front, snout masked with thorns
  const hx = rx * 0.95, hy = cy + ry * 0.1;
  ctx.fillStyle = '#7a4a60';
  ctx.strokeStyle = '#3a2230';
  ctx.beginPath();
  ctx.ellipse(hx, hy, ry * 0.7, ry * 0.62, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c88aa0';
  ctx.beginPath(); // the snout
  ctx.roundRect(hx + ry * 0.35, hy - 2, ry * 0.5, ry * 0.5, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5e3a4c';
  circle(ctx, hx + ry * 0.7, hy + ry * 0.12, 1.8);
  circle(ctx, hx + ry * 0.55, hy + ry * 0.12, 1.8);
  for (let i = 0; i < 4; i++) thorn(ctx, hx + ry * 0.2, hy - ry * 0.45 + i * ry * 0.22, -0.2 + i * 0.15, ry * 0.5, 2.5, '#efd2de');
  ctx.fillStyle = '#fff8ec'; // tusks
  for (const d of [0, 6]) {
    ctx.beginPath();
    ctx.moveTo(hx + ry * 0.38 + d, hy + ry * 0.45);
    ctx.quadraticCurveTo(hx + ry * 0.4 + d, hy + ry * 0.1, hx + ry * 0.55 + d, hy + ry * 0.05);
    ctx.lineTo(hx + ry * 0.48 + d, hy + ry * 0.45);
    ctx.fill();
  }
  // an ear
  ctx.fillStyle = '#7a4a60';
  ctx.beginPath();
  ctx.moveTo(hx - ry * 0.3, hy - ry * 0.45);
  ctx.lineTo(hx - ry * 0.45, hy - ry * 1.0);
  ctx.lineTo(hx, hy - ry * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  face(ctx, hx + ry * 0.05, hy - ry * 0.18, 0.1, t, seed, { dying, size: 0.85, cross: true });
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
    ctx.moveTo(hx + ry * 0.7, hy);
    ctx.ellipse(hx, hy, ry * 0.7, ry * 0.62, 0, 0, TAU);
  };
}

// Thistle Puff: a round green thistle head with spiky bracts, a great fluffy purple-pink tuft on top, two
// leaves for feet; it hops. Knocked down, it bursts into thistledown (drawThistledown).
function drawThistlePuff(ctx, w, h, t, seed, m, dying) {
  const cy = -h * 0.4, r = w * 0.36;
  // leafy feet
  ctx.fillStyle = '#5e8a4a';
  ctx.strokeStyle = '#34542c';
  ctx.lineWidth = 1.4;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * r * 0.6, -3, r * 0.5, 4, s * 0.2, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // the purple tuft
  const sw = Math.sin(t * 2 + seed) * 0.08;
  ctx.save();
  ctx.translate(0, cy - r * 0.55);
  ctx.rotate(sw);
  for (let i = 0; i < 13; i++) {
    const a = -Math.PI + 0.25 + (i / 12) * (Math.PI - 0.5);
    ctx.strokeStyle = i % 2 ? '#c87ac8' : '#e0a0e0';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,240,255,0.7)';
  for (let i = 0; i < 6; i++) circle(ctx, Math.cos(-Math.PI + 0.4 + i * 0.47) * r * 1.05, Math.sin(-Math.PI + 0.4 + i * 0.47) * r * 1.05, 2.4);
  ctx.restore();
  // the green head, scaled with spiky bracts
  const body = () => ctx.ellipse(0, cy, r, r * 0.92, 0, 0, TAU);
  ctx.fillStyle = '#7aa858';
  ctx.strokeStyle = '#3e5e2c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 5; i++) {
      const x = -r * 0.7 + i * r * 0.35 + (row % 2) * r * 0.17, y = cy - r * 0.35 + row * r * 0.38;
      if (Math.hypot(x, y - cy) > r * 0.9) continue;
      thorn(ctx, x, y, -Math.PI / 2 + (x / r) * 0.6, 7, 2.6, '#a8cc80');
    }
  }
  face(ctx, r * 0.3, cy + r * 0.05, r * 0.22, t, seed, { dying, size: 0.85 });
  blush(ctx, r * 0.62, cy + r * 0.3, 3.4);
  return () => {
    ctx.beginPath();
    body();
  };
}
// Thistledown: a little white puff of down on a seed, drifting, with a tiny face
function drawThistledown(ctx, w, h, t, seed, m, dying) {
  const bob = Math.sin(t * 3 + seed) * 3;
  const cy = -h * 0.55 + bob, r = w * 0.42;
  ctx.strokeStyle = 'rgba(240,235,250,0.95)';
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 11; i++) {
    const a = -Math.PI + (i / 10) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.arc(0, cy, r, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#c87ac8'; // the seed under it
  ellipse(ctx, 0, cy + r * 0.45, r * 0.32, r * 0.42);
  face(ctx, 0, cy - r * 0.25, r * 0.22, t, seed, { dying, size: 0.6, cross: true });
  return () => {
    ctx.beginPath();
    ctx.arc(0, cy, r, 0, TAU);
  };
}

// Pitcher Plant: a tall jug-shaped pitcher, green with red veins, rooted in the ground, its lid propped on
// top and a ring of leaves at its foot. It spits thorn seeds. m.warn: the lid flips up, about to spit.
function drawPitcherPlant(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05;
  const sway = Math.sin(t * 1.4 + seed) * 0.04;
  // leaves at its foot
  ctx.fillStyle = '#4e7a3e';
  ctx.strokeStyle = '#2e4a24';
  ctx.lineWidth = 1.4;
  for (const [s, k] of [[-1, 1], [1, 0.9], [-1, 0.6], [1, 0.55]]) {
    ctx.beginPath();
    ctx.ellipse(s * w * 0.42 * k, -6 * k, w * 0.32 * k, 6, s * 0.35, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.save();
  ctx.rotate(sway);
  const rx = w * 0.36, top = -h * 0.88;
  const jug = () => {
    ctx.moveTo(-rx * 0.6, 0);
    ctx.bezierCurveTo(-rx * 1.3, -h * 0.3, -rx * 0.7, top + 8, -rx * 0.75, top);
    ctx.lineTo(rx * 0.75, top);
    ctx.bezierCurveTo(rx * 0.7, top + 8, rx * 1.3, -h * 0.3, rx * 0.6, 0);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-rx, 0, rx, 0);
  g.addColorStop(0, '#7aa850');
  g.addColorStop(0.6, '#a8cc70');
  g.addColorStop(1, '#6a9844');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3e5e2c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  jug();
  ctx.fill();
  ctx.stroke();
  // red veins
  ctx.save();
  ctx.beginPath();
  jug();
  ctx.clip();
  ctx.strokeStyle = 'rgba(190,60,80,0.55)';
  ctx.lineWidth = 1.6;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * rx * 0.3, -2);
    ctx.quadraticCurveTo(i * rx * 0.5, -h * 0.45, i * rx * 0.35, top);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200,70,90,0.5)';
  ctx.fillRect(-rx, top, rx * 2, 9);
  ctx.restore();
  // the rim and the dark mouth
  ctx.fillStyle = '#c84a5e';
  ctx.strokeStyle = '#7a2a3a';
  ctx.beginPath();
  ctx.ellipse(0, top, rx * 0.8, 5, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a1e24';
  ellipse(ctx, 0, top, rx * 0.55, 2.6);
  // the lid: propped over the mouth, flipped up when it's about to spit
  ctx.save();
  ctx.translate(-rx * 0.7, top - 2);
  ctx.rotate(warn ? -1.2 : -0.25 + Math.sin(t * 2 + seed) * 0.05);
  ctx.fillStyle = '#a8cc70';
  ctx.strokeStyle = '#3e5e2c';
  ctx.beginPath();
  ctx.ellipse(rx * 0.8, -4, rx * 0.85, 7, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(190,60,80,0.5)';
  for (let i = 0; i < 3; i++) circle(ctx, rx * (0.4 + i * 0.4), -4, 1.6);
  ctx.restore();
  if (warn) {
    ctx.fillStyle = '#7a4c62';
    for (let i = 0; i < 3; i++) thorn(ctx, -4 + i * 4, top - 4, -Math.PI / 2, 6, 2, '#7a4c62');
  }
  face(ctx, rx * 0.15, -h * 0.42, rx * 0.3, t, seed, { dying, size: 0.95, cross: warn });
  blush(ctx, rx * 0.6, -h * 0.34, 3.6);
  ctx.restore();
  return () => {
    ctx.beginPath();
    jug();
  };
}

// Thorn Stalker: a lean, low, dark-green cat-like creature of the briar, thorns along its back and its long
// tail, pale gold eyes. m.special: it has slipped into the briar (about to come out behind you): only its
// eyes and a rustle · m.warn: crouched, ready to pounce.
function drawThornStalker(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05, warn = !!m.warn && !gone && dying < 0.05;
  const cy = -h * 0.5, rx = w * 0.44, ry = h * 0.3;
  if (gone) {
    ctx.fillStyle = 'rgba(60,90,60,0.35)';
    for (let i = 0; i < 5; i++) ellipse(ctx, Math.sin(t * 9 + i * 1.7) * 12, cy + i * 4 - 6, 9 - i, 5);
    ctx.fillStyle = 'rgba(255,230,140,0.9)';
    ellipse(ctx, rx * 0.4, cy - 4, 3, 1.6);
    ellipse(ctx, rx * 0.6, cy - 4, 3, 1.6);
    return () => {
      ctx.beginPath();
      ctx.arc(0, cy, 10, 0, TAU);
    };
  }
  const crouch = warn ? 5 : 0;
  // the tail, thorned
  const sw = Math.sin(t * 2.4 + seed) * 6;
  ctx.strokeStyle = '#2e4a34';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-rx * 0.8, cy + crouch);
  ctx.bezierCurveTo(-rx * 1.5, cy - ry + crouch, -rx * 1.6, cy - ry * 2.6 + sw, -rx * 1.15, cy - ry * 2.8 + sw);
  ctx.stroke();
  for (let i = 1; i < 4; i++) thorn(ctx, -rx * (0.95 + i * 0.17), cy - ry * (0.4 + i * 0.65) + crouch + sw * i * 0.25, -2.4, 6, 2, '#c8e0b8');
  // legs: long, padding
  ctx.strokeStyle = '#2e4a34';
  ctx.lineWidth = 5;
  const step = m.walking ? Math.sin(t * 14) * 4 : 0;
  for (const [x, s] of [[-0.6, 1], [-0.4, -1], [0.45, 1], [0.65, -1]]) {
    ctx.beginPath();
    ctx.moveTo(rx * x, cy + ry * 0.4 + crouch);
    ctx.lineTo(rx * x + step * s, -2);
    ctx.stroke();
  }
  const body = () => ctx.ellipse(0, cy + crouch, rx, ry, 0, 0, TAU);
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, '#4e7a50');
  g.addColorStop(1, '#2e4a34');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#1e3224';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // thorns down the spine
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI + 0.6 + (i / 5) * (Math.PI - 1.2);
    thorn(ctx, Math.cos(a) * rx * 0.92, cy + crouch + Math.sin(a) * ry * 0.92, a - 0.3, 9, 2.6, '#c8e0b8');
  }
  // the head
  const hx = rx * 0.95, hy = cy - ry * 0.35 + crouch * 1.4;
  ctx.fillStyle = '#4e7a50';
  ctx.strokeStyle = '#1e3224';
  ctx.beginPath();
  ctx.ellipse(hx, hy, ry * 0.95, ry * 0.8, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  for (const d of [-1, 1]) { // ears
    ctx.beginPath();
    ctx.moveTo(hx + d * ry * 0.5 - 2, hy - ry * 0.5);
    ctx.lineTo(hx + d * ry * 0.65, hy - ry * 1.35);
    ctx.lineTo(hx + d * ry * 0.15, hy - ry * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = '#6a9a68'; // a pale muzzle
  ellipse(ctx, hx + ry * 0.45, hy + ry * 0.2, ry * 0.42, ry * 0.32);
  ctx.fillStyle = INKC;
  circle(ctx, hx + ry * 0.8, hy + ry * 0.08, 1.8);
  // pale gold eyes (narrowed when it's about to pounce)
  if (dying < 0.05) {
    for (const d of [-0.28, 0.28]) {
      ctx.fillStyle = '#ffe08a';
      ellipse(ctx, hx + ry * (0.25 + d), hy - ry * 0.2, 3.4, warn ? 1.4 : 3);
      ctx.fillStyle = INKC;
      ellipse(ctx, hx + ry * (0.3 + d), hy - ry * 0.2, 1, warn ? 1.2 : 2.6);
    }
  } else face(ctx, hx + ry * 0.25, hy - ry * 0.2, ry * 0.28, t, seed, { dying, size: 0.8 });
  // whiskers
  ctx.strokeStyle = 'rgba(220,240,210,0.7)';
  ctx.lineWidth = 1;
  for (const a of [-0.25, 0.1]) {
    ctx.beginPath();
    ctx.moveTo(hx + ry * 0.6, hy + ry * 0.25);
    ctx.lineTo(hx + ry * 0.6 + Math.cos(a) * 14, hy + ry * 0.25 + Math.sin(a) * 6);
    ctx.stroke();
  }
  return () => {
    ctx.beginPath();
    body();
    ctx.moveTo(hx + ry * 0.95, hy);
    ctx.ellipse(hx, hy, ry * 0.95, ry * 0.8, 0, 0, TAU);
  };
}

// The Thorn Hart (a field boss): a great white stag with antlers of living briar, green velvet on them and
// little white roses at the tips, a mane of moss. Grand and calm until hit. m.warn: he rears up, about to
// stamp; in the air (m.vy) his forelegs are tucked.
function drawThornHart(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, air = Math.abs(m.vy ?? 0) > 1 && live;
  const cy = -h * 0.5, rx = w * 0.38, ry = h * 0.19;
  if (live) halo(ctx, 0, cy - h * 0.1, w * 0.7, '235,250,225', 0.18 + 0.06 * Math.sin(t * 2));
  ctx.save();
  // rearing: pivot on the back legs
  ctx.translate(-rx * 0.6, 0);
  ctx.rotate(warn ? -0.32 : 0);
  ctx.translate(rx * 0.6, 0);
  // legs: long and slender, dark hooves
  const step = m.walking ? Math.sin(t * 9) * 5 : 0;
  ctx.lineCap = 'round';
  for (const [x, s, front] of [[-0.75, 1, 0], [-0.5, -1, 0], [0.55, 1, 1], [0.8, -1, 1]]) {
    const tuck = front && (warn || air);
    const x0 = rx * x, y0 = cy + ry * 0.6;
    const fx = tuck ? x0 + 10 : x0 + step * s, fy = tuck ? y0 + h * 0.18 : -4;
    ctx.strokeStyle = '#d8d0c8';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x0 + (tuck ? 16 : 3), (y0 + fy) / 2, fx, fy);
    ctx.stroke();
    ctx.fillStyle = '#5a4a48';
    ellipse(ctx, fx, fy + 2, 5.5, 4);
  }
  // the body
  const body = () => ctx.ellipse(0, cy, rx, ry, 0, 0, TAU);
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, '#fbf8f2');
  g.addColorStop(1, '#ddd4c8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#9a8e84';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // a short tail
  ctx.fillStyle = '#fbf8f2';
  ellipse(ctx, -rx * 1.02, cy - ry * 0.4, 7, 10, 0.4);
  // the neck and its moss mane
  const nx = rx * 0.75, ny = cy - ry * 0.3;
  const hx = rx * 1.05, hy = cy - h * 0.3;
  ctx.fillStyle = '#f4efe6';
  ctx.strokeStyle = '#9a8e84';
  ctx.beginPath();
  ctx.moveTo(nx - 14, ny + 8);
  ctx.quadraticCurveTo(nx - 4, hy + 10, hx - 8, hy - 2);
  ctx.lineTo(hx + 6, hy + 10);
  ctx.quadraticCurveTo(nx + 18, ny, nx + 14, ny + 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7aa858';
  for (let i = 0; i < 6; i++) circle(ctx, nx - 8 + i * 4, ny + 4 - i * (ny - hy) / 7, 5 - i * 0.4);
  // the head
  ctx.fillStyle = '#fbf8f2';
  ctx.strokeStyle = '#9a8e84';
  ctx.beginPath();
  ctx.ellipse(hx + 6, hy, 22, 15, 0.25, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5a4a48';
  circle(ctx, hx + 26, hy + 8, 3); // nose
  // the antlers: briar, branching, velvet green, thorned, roses at the tips
  const ant = (s) => {
    ctx.save();
    ctx.translate(hx - 2 + s * 5, hy - 11);
    ctx.scale(1.4, 1.4);
    ctx.strokeStyle = '#5e3a50';
    ctx.lineWidth = 4.5;
    const tips = [];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-12 - s * 6, -26, -6 - s * 10, -56);
    tips.push([-6 - s * 10, -56]);
    ctx.moveTo(-6 - s * 3, -22);
    ctx.quadraticCurveTo(8, -32, 14 + s * 4, -44);
    tips.push([14 + s * 4, -44]);
    ctx.moveTo(-10 - s * 6, -38);
    ctx.quadraticCurveTo(-26, -44, -32 - s * 4, -58);
    tips.push([-32 - s * 4, -58]);
    ctx.moveTo(-9 - s * 8, -46);
    ctx.quadraticCurveTo(0, -60, 2 - s * 2, -72);
    tips.push([2 - s * 2, -72]);
    ctx.stroke();
    ctx.strokeStyle = '#7aa858'; // the velvet
    ctx.lineWidth = 1.6;
    ctx.stroke();
    for (const [x, y] of [[-8, -20], [2, -30], [-18, -42], [-4, -52]]) thorn(ctx, x, y, -1.2 + s * 0.4, 6, 1.8, '#efd2de');
    for (const [x, y] of tips) rose(ctx, x, y, 4.2);
    ctx.restore();
  };
  ant(-1);
  // an ear
  ctx.fillStyle = '#f4efe6';
  ctx.strokeStyle = '#9a8e84';
  ctx.beginPath();
  ctx.ellipse(hx - 13, hy - 8, 12, 5.5, -0.6, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ant(1);
  // the eye: calm and dark, narrowed when he's angry
  if (live) {
    const mad = !!m.target;
    ctx.fillStyle = INKC;
    ellipse(ctx, hx + 8, hy - 3, 3.4, mad ? 1.9 : 3.8);
    ctx.fillStyle = '#fff';
    circle(ctx, hx + 9, hy - 4.4, 1.1);
    if (mad) {
      ctx.strokeStyle = '#5a4a48';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(hx + 2, hy - 9);
      ctx.lineTo(hx + 13, hy - 6);
      ctx.stroke();
    }
  } else face(ctx, hx + 6, hy - 2, 0.1, t, seed, { dying, size: 1.2 });
  blush(ctx, hx + 13, hy + 5, 5);
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
    ctx.moveTo(hx + 23, hy);
    ctx.ellipse(hx + 6, hy, 22, 15, 0.25, 0, TAU);
  };
}

export const THORN_MOB_ART = {
  thornback: drawThornback, thistle_puff: drawThistlePuff, thistledown: drawThistledown, pitcher_plant: drawPitcherPlant,
  thorn_stalker: drawThornStalker, thorn_hart: drawThornHart,
};

// ——— gear: swords (ctx, L, glow), grip at the origin, blade up (-y) ———
const grip = (ctx, c1, c2) => {
  ctx.fillStyle = c1;
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.strokeStyle = c2;
  ctx.lineWidth = 1;
  for (let y = -1; y < 10; y += 3.2) {
    ctx.beginPath();
    ctx.moveTo(-3, y);
    ctx.lineTo(3, y + 1.6);
    ctx.stroke();
  }
};
// Stalker's Claw: a curved black blade like a great thorn, green-sheened, with a barbed back edge
function drawStalkerClaw(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-4, -5);
    ctx.quadraticCurveTo(-7, -L * 0.6, 4, -L);
    ctx.quadraticCurveTo(4, -L * 0.55, 5, -5);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-5, 0, 5, 0);
  g.addColorStop(0, '#2a2a34');
  g.addColorStop(1, '#3e5a44');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#141820';
  ctx.lineWidth = 1.6;
  blade();
  ctx.fill();
  ctx.stroke();
  for (let i = 1; i < 4; i++) thorn(ctx, 4.5, -L * (0.2 + i * 0.17), 0.3, 5, 1.6, '#2a2a34');
  ctx.strokeStyle = `rgba(190,255,200,${0.35 + 0.45 * glow})`;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-2.5, -8);
  ctx.quadraticCurveTo(-5, -L * 0.55, 3, -L * 0.94);
  ctx.stroke();
  ctx.fillStyle = '#5e3a50'; // a guard of twisted briar
  ctx.beginPath();
  ctx.roundRect(-8, -6, 16, 4, 2);
  ctx.fill();
  grip(ctx, '#2e4a34', '#1e3224');
  ctx.restore();
}
// Briarheart Blade: a sword of living briar wood, grown not forged, a pale green edge and a white rosebud on
// the guard
function drawBriarheartBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(-4, -L * 0.85);
    ctx.lineTo(0, -L);
    ctx.lineTo(4, -L * 0.85);
    ctx.lineTo(5, -6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, -L, 0, 0);
  g.addColorStop(0, '#e8f4d8');
  g.addColorStop(0.3, '#8a6070');
  g.addColorStop(1, '#5e3a50');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3a2230';
  ctx.lineWidth = 1.6;
  blade();
  ctx.fill();
  ctx.stroke();
  // wood grain spiralling up and little thorns off the edges
  ctx.strokeStyle = 'rgba(40,20,30,0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-4, -L * (0.12 + i * 0.15));
    ctx.quadraticCurveTo(0, -L * (0.17 + i * 0.15), 4, -L * (0.12 + i * 0.15));
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) thorn(ctx, (i % 2 ? 4.5 : -4.5), -L * (0.2 + i * 0.16), i % 2 ? -0.5 : -2.6, 5, 1.5, '#e9c6d4');
  ctx.strokeStyle = `rgba(220,255,200,${0.4 + 0.5 * glow})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, -L * 0.5);
  ctx.lineTo(-2.5, -L * 0.9);
  ctx.stroke();
  // the guard: two curling briar stems and a rosebud
  ctx.strokeStyle = '#5e3a50';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-9, -2);
  ctx.quadraticCurveTo(-6, -8, 0, -6);
  ctx.quadraticCurveTo(6, -8, 9, -2);
  ctx.stroke();
  ctx.fillStyle = '#7aa858';
  ellipse(ctx, 0, -7, 3.5, 2.5);
  ctx.fillStyle = '#fbf6f4';
  ellipse(ctx, 0, -10, 2.6, 3.6);
  grip(ctx, '#7a5038', '#4a2e1e');
  ctx.restore();
}
export const THORN_SWORDS = { stalker_claw: drawStalkerClaw, briarheart_blade: drawBriarheartBlade };
export const THORN_SWORD_LEN = { stalker_claw: 64, briarheart_blade: 66 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Thornback Helm: a thick dark leather cap with a ridge of thorny bristles down the middle
function drawThornbackHelm(ctx, w, h) {
  const by = -h * 0.7, rx = w * 0.5;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 - 0.7 + i * 0.35;
    thorn(ctx, Math.cos(a) * rx * 0.55, by - h * 0.12 + Math.sin(a) * h * 0.25, a, h * 0.22, 3, '#d8a8c0');
  }
  ctx.fillStyle = '#6a4258';
  ctx.strokeStyle = '#3a2230';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 3);
  ctx.bezierCurveTo(-rx * 1.02, by - h * 0.42, rx * 1.02, by - h * 0.42, rx, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,235,0.4)'; // stitching
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.85, by - 1);
  ctx.quadraticCurveTo(0, by - h * 0.12, rx * 0.85, by - 1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#7a4c62';
  ctx.strokeStyle = '#3a2230';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.04, by - 2, rx * 2.08, 7, 3);
  ctx.fill();
  ctx.stroke();
}
// Hart's Antler Crown: a circlet of moss with two shed briar antlers, velvet green, white roses at the tips
function drawAntlerCrown(ctx, w, h, t) {
  const by = -h * 0.72, rx = w * 0.5;
  halo(ctx, 0, by - 16, rx * 1.3, '235,250,225', 0.28);
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * rx * 0.45, by - 2);
    ctx.scale(s, 1);
    ctx.strokeStyle = '#5e3a50';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(6, -14, 4, -h * 0.4);
    ctx.moveTo(4, -10);
    ctx.quadraticCurveTo(14, -14, 18, -h * 0.28);
    ctx.moveTo(5, -h * 0.25);
    ctx.quadraticCurveTo(-4, -h * 0.3, -6, -h * 0.38);
    ctx.stroke();
    ctx.strokeStyle = '#7aa858';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    rose(ctx, 4, -h * 0.4, 3.4);
    rose(ctx, 18, -h * 0.28, 3);
    rose(ctx, -6, -h * 0.38, 2.8);
    ctx.restore();
  }
  ctx.fillStyle = '#6a9a4e'; // the moss circlet
  ctx.strokeStyle = '#3e5e2c';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-rx * 0.95, by - 4, rx * 1.9, 8, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8aba68';
  for (let i = 0; i < 6; i++) circle(ctx, -rx * 0.8 + i * rx * 0.32, by - 3 + Math.sin(i + t) * 0.6, 2.4);
}
export const THORN_HELMETS = { thornback_helm: drawThornbackHelm, antler_crown: drawAntlerCrown };

// ——— materials' icons (40 × 40, centred) ———
function iconThornBristle(ctx) {
  ctx.fillStyle = '#6a4258';
  ellipse(ctx, 0, 12, 10, 5);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 - 0.7 + i * 0.23;
    ctx.strokeStyle = '#5e3a50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(Math.cos(a) * 24, 12 + Math.sin(a) * 26);
    ctx.stroke();
    thorn(ctx, Math.cos(a) * 16, 12 + Math.sin(a) * 18, a + 0.8, 5, 1.6, '#e9c6d4');
  }
}
function iconThistleFluff(ctx) {
  ctx.strokeStyle = 'rgba(230,200,240,0.95)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,245,255,0.8)';
  circle(ctx, 0, 0, 11);
  ctx.fillStyle = '#c87ac8';
  ellipse(ctx, 0, 3, 3, 4);
}
function iconPitcherNectar(ctx) {
  ctx.fillStyle = '#c8a050';
  ctx.strokeStyle = '#7a5a20';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(-3.5, -18, 7, 8, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,190,90,0.9)';
  ctx.strokeStyle = '#8a6a30';
  ctx.beginPath();
  ctx.moveTo(-4, -11);
  ctx.bezierCurveTo(-16, -4, -14, 16, 0, 16);
  ctx.bezierCurveTo(14, 16, 16, -4, 4, -11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ellipse(ctx, -5, 2, 2.4, 6);
  ctx.fillStyle = '#7aa850';
  ellipse(ctx, 6, 8, 4, 2.4, -0.5);
}
function iconStalkerBarb(ctx) {
  ctx.save();
  ctx.rotate(0.6);
  ctx.fillStyle = '#2a2a34';
  ctx.strokeStyle = '#141820';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-8, 16);
  ctx.quadraticCurveTo(-8, -6, 4, -18);
  ctx.quadraticCurveTo(-1, 0, 8, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(190,255,200,0.6)';
  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.quadraticCurveTo(-5, -4, 2, -14);
  ctx.stroke();
  ctx.restore();
}
function iconAntlerVelvet(ctx) {
  ctx.fillStyle = '#7aa858';
  ctx.strokeStyle = '#3e5e2c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-15, 10);
  ctx.quadraticCurveTo(-10, -12, 6, -14);
  ctx.quadraticCurveTo(16, -10, 14, 6);
  ctx.quadraticCurveTo(0, 14, -15, 10);
  ctx.fill();
  ctx.stroke();
  rose(ctx, -2, -2, 4.5);
  rose(ctx, 8, 4, 3.4);
}
export const THORN_ICONS = { thorn_bristle: iconThornBristle, thistle_fluff: iconThistleFluff, pitcher_nectar: iconPitcherNectar, stalker_barb: iconStalkerBarb, antler_velvet: iconAntlerVelvet };
