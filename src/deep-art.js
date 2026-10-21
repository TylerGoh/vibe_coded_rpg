// Docs: docs/places/deep.md, docs/combat/stages.md
// The Mycelium Deep's and Glowroot Hollow's art that isn't the rooms themselves (src/deep.js,
// src/glowroot.js): their creatures (puffcap, cave bat, puffball and puffling, root beetle, knot spider,
// glowworm, glow moth, threadweaver; DEEP_MOB_ART, called by drawMob in src/field.js, elites drawn as
// their base), the gear sold at Truffle's camp or dropped down here (DEEP_SWORDS, DEEP_HELMETS, drawn by
// drawSword / drawHelmet in src/field.js), its materials' icons (DEEP_ICONS) and Forager Truffle's dress
// (drawForagerDress, called by src/slime.js for the 'forager' accessory). The Knotmole is a den boss:
// src/dens-deep.js.
import { TAU, circle, ellipse } from './util.js';

function face(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, sleepy = false } = {}) {
  ctx.strokeStyle = '#2d2a3e';
  ctx.fillStyle = '#2d2a3e';
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.4) < 0.12;
  for (const ex of [fx - gap, fx + gap]) {
    if (dying > 0.05) {
      ctx.beginPath();
      ctx.moveTo(ex - 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex + 2.2 * size, fy + 2.2 * size);
      ctx.moveTo(ex + 2.2 * size, fy - 2.2 * size); ctx.lineTo(ex - 2.2 * size, fy + 2.2 * size);
      ctx.stroke();
    } else if (sleepy || blink) {
      ctx.beginPath();
      ctx.arc(ex, fy - 1, 2.4 * size, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, 3.3 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
      ctx.fillStyle = '#2d2a3e';
    }
  }
  ctx.fillStyle = 'rgba(255,140,170,0.45)';
  ellipse(ctx, fx - gap - 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
  ellipse(ctx, fx + gap + 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
}
function halo(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// ——— mobs: (ctx, w, h, t, seed, m, dying) => sil, origin at the feet, +x = facing ———

// Puffcap: a squat mushroom on a cream stalk with its face on the stalk, a big lilac cap with white spots.
// m.warn: the cap swells up, about to puff a spore ball at you.
function drawPuffcap(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05, swell = warn ? 1.12 + Math.sin(t * 30) * 0.03 : 1;
  const step = m.walking ? Math.sin(t * 12 + seed) : 0;
  const sy = -h * 0.5, cr = w * 0.56 * swell;
  // little feet
  ctx.fillStyle = '#d8cbb8';
  ellipse(ctx, -w * 0.18 + step * 2, -3, 6, 4);
  ellipse(ctx, w * 0.18 - step * 2, -3, 6, 4);
  // the stalk
  ctx.fillStyle = '#f2e8d6';
  ctx.strokeStyle = '#b8a890';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, -4);
  ctx.quadraticCurveTo(-w * 0.32, sy * 0.6, -w * 0.2, sy);
  ctx.lineTo(w * 0.2, sy);
  ctx.quadraticCurveTo(w * 0.32, sy * 0.6, w * 0.26, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  face(ctx, w * 0.08, -h * 0.3, w * 0.1, t, seed, { dying, size: 0.85 });
  // the cap
  if (warn) halo(ctx, 0, sy - h * 0.18, w * 0.9, '220,180,255', 0.45);
  const cap = () => {
    ctx.moveTo(-cr, sy + 4);
    ctx.bezierCurveTo(-cr * 1.05, sy - h * 0.62 * swell, cr * 1.05, sy - h * 0.62 * swell, cr, sy + 4);
    ctx.quadraticCurveTo(0, sy + 10, -cr, sy + 4);
    ctx.closePath();
  };
  ctx.fillStyle = '#c9a6e6';
  ctx.strokeStyle = '#7a5a98';
  ctx.lineWidth = 2;
  ctx.beginPath();
  cap();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (const [x, y, r] of [[-0.5, 0.18, 4], [-0.08, 0.42, 5], [0.38, 0.24, 3.6], [0.1, 0.12, 2.6]]) circle(ctx, cr * x, sy - h * y * swell, r);
  if (warn) {
    // spores leaking from under the brim
    for (let i = 0; i < 5; i++) {
      const k = (t * 2 + i / 5) % 1;
      ctx.fillStyle = `rgba(230,210,255,${0.8 * (1 - k)})`;
      circle(ctx, -cr + (i / 4) * cr * 2, sy + 6 + k * 10, 2 + k * 2);
    }
  }
  return () => {
    ctx.beginPath();
    cap();
    ctx.rect(-w * 0.26, sy, w * 0.52, -sy - 4);
  };
}

// Cave bat: a round fuzzy lavender bat with big ears and teal eyes, flapping. m.warn: wings flung up ·
// m.charging: tucked in, diving.
function drawCaveBat(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05, dive = !!m.charging && dying < 0.05;
  const flap = dive ? 0.2 : warn ? -0.9 : Math.sin(t * 14 + seed) * 0.7;
  const cy = -h * 0.55, r = h * 0.42;
  ctx.fillStyle = '#7a6a98';
  ctx.strokeStyle = '#4a3a68';
  ctx.lineWidth = 1.8;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * r * 0.7, cy);
    ctx.rotate(s * flap);
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.quadraticCurveTo(s * w * 0.3, -h * 0.5, s * w * 0.56, -h * 0.2);
    ctx.quadraticCurveTo(s * w * 0.46, 0, s * w * 0.4, h * 0.08);
    ctx.quadraticCurveTo(s * w * 0.3, -2, s * w * 0.22, h * 0.12);
    ctx.quadraticCurveTo(s * w * 0.12, 0, 0, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // ears
  ctx.fillStyle = '#9a8ab8';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * r * 0.2, cy - r * 0.7);
    ctx.lineTo(s * r * 0.55, cy - r * 1.5);
    ctx.lineTo(s * r * 0.8, cy - r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const body = () => ctx.ellipse(0, cy, r, r * 0.95, 0, 0, TAU);
  ctx.fillStyle = '#a898c8';
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c8bce0'; // fuzzy tummy
  ellipse(ctx, 0, cy + r * 0.3, r * 0.6, r * 0.5);
  if (dying < 0.05) {
    halo(ctx, r * 0.3, cy - r * 0.2, 12, '120,240,220', 0.6);
    ctx.fillStyle = '#7ef0d8';
    circle(ctx, r * 0.12, cy - r * 0.2, 3.2);
    circle(ctx, r * 0.52, cy - r * 0.2, 3.2);
    ctx.fillStyle = '#ffffff';
    circle(ctx, r * 0.18, cy - r * 0.28, 1);
    circle(ctx, r * 0.58, cy - r * 0.28, 1);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); // tiny fangs
    ctx.moveTo(r * 0.24, cy + r * 0.18);
    ctx.lineTo(r * 0.28, cy + r * 0.34);
    ctx.lineTo(r * 0.32, cy + r * 0.18);
    ctx.fill();
  } else face(ctx, r * 0.32, cy - r * 0.2, r * 0.2, t, seed, { dying, size: 0.8 });
  return () => {
    ctx.beginPath();
    body();
  };
}

// Puffball: a round cream puffball with a darker crown and stubby feet. When it dies it bursts into two
// pufflings (the `split` brain), which are the same thing small.
function drawPuffball(ctx, w, h, t, seed, m, dying) {
  const cy = -h * 0.5, rx = w * 0.5, ry = h * 0.5;
  const step = m.walking ? Math.sin(t * 12 + seed) : 0;
  ctx.fillStyle = '#c8b8a0';
  ellipse(ctx, -rx * 0.4 + step * 2, -2, rx * 0.26, 3.5);
  ellipse(ctx, rx * 0.4 - step * 2, -2, rx * 0.26, 3.5);
  const body = () => ctx.ellipse(0, cy, rx, ry, 0, 0, TAU);
  const g = ctx.createRadialGradient(-rx * 0.3, cy - ry * 0.4, 2, 0, cy, rx * 1.1);
  g.addColorStop(0, '#fffaf0');
  g.addColorStop(0.7, '#efe2c8');
  g.addColorStop(1, '#d6c4a4');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#a8946e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(168,148,110,0.45)'; // bumpy crown
  for (const [x, y] of [[-0.3, 0.8], [0, 0.9], [0.3, 0.8], [-0.15, 0.62], [0.15, 0.62]]) circle(ctx, rx * x, cy - ry * y + ry * 0.1, rx * 0.1);
  face(ctx, rx * 0.2, cy + ry * 0.1, rx * 0.22, t, seed, { dying, size: w < 30 ? 0.6 : 0.9 });
  if (dying > 0.05) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      ctx.fillStyle = `rgba(250,240,220,${1 - dying})`;
      circle(ctx, Math.cos(a) * rx * (1 + dying), cy + Math.sin(a) * ry * (1 + dying), 3 + dying * 4);
    }
  }
  return () => {
    ctx.beginPath();
    body();
  };
}

// Root beetle: a domed brown beetle whose wing cases look like knotted bark, with a knobbly root horn in
// front (it shields that side: hit it from behind). m.warn: rears back · m.charging: lunges, horn first.
function drawRootBeetle(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, lunge = !!m.charging && live;
  const step = m.walking || lunge ? Math.sin(t * (lunge ? 26 : 14) + seed) : 0;
  const tilt = warn ? -0.16 + Math.sin(t * 30) * 0.015 : lunge ? 0.08 : 0;
  const cy = -h * 0.32;
  const frame = () => {
    ctx.translate(-w * 0.3, 0);
    ctx.rotate(tilt);
    ctx.translate(w * 0.3, 0);
  };
  const shell = () => {
    ctx.moveTo(-w * 0.48, cy + 4);
    ctx.bezierCurveTo(-w * 0.5, -h * 1.02, w * 0.32, -h * 1.02, w * 0.34, cy + 4);
    ctx.quadraticCurveTo(-w * 0.07, cy + h * 0.16, -w * 0.48, cy + 4);
    ctx.closePath();
  };
  ctx.save();
  frame();
  ctx.strokeStyle = '#4a3428';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const lx = -w * 0.3 + i * w * 0.22, k = step * (i % 2 ? 1 : -1) * 3;
    ctx.beginPath();
    ctx.moveTo(lx, cy + 2);
    ctx.lineTo(lx - 7, cy + 8 + k);
    ctx.lineTo(lx - 9, -1);
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, -h, 0, cy);
  g.addColorStop(0, '#9a7050');
  g.addColorStop(1, '#6a4a34');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3a2618';
  ctx.lineWidth = 2;
  ctx.beginPath();
  shell();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(58,38,24,0.6)'; // the split between the wing cases, and bark grain
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.08, -h * 0.98);
  ctx.quadraticCurveTo(-w * 0.1, -h * 0.6, -w * 0.06, cy + 6);
  for (const x of [-0.32, -0.22, 0.08, 0.2]) {
    ctx.moveTo(w * x, -h * 0.8);
    ctx.quadraticCurveTo(w * (x + 0.03), -h * 0.6, w * x, -h * 0.4);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,190,0.3)';
  ellipse(ctx, -w * 0.22, -h * 0.8, w * 0.12, h * 0.07, -0.3);
  // the head and its root horn
  ctx.fillStyle = '#5a3e2c';
  ellipse(ctx, w * 0.38, cy - 2, w * 0.13, h * 0.2);
  face(ctx, w * 0.4, cy - 2, w * 0.06, t, seed, { dying, size: 0.7 });
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(w * 0.42, cy - h * 0.14);
  ctx.quadraticCurveTo(w * 0.62, cy - h * 0.3 - (warn ? 6 : 0), w * 0.56, cy - h * 0.62);
  ctx.stroke();
  ctx.fillStyle = '#8a6a4a';
  for (const k of [0.3, 0.55]) circle(ctx, w * (0.47 + k * 0.12), cy - h * (0.2 + k * 0.4), 3);
  ctx.restore();
  return () => {
    ctx.save();
    frame();
    ctx.beginPath();
    shell();
    ctx.restore();
  };
}

// Knot spider: a round fuzzy plum spider on eight knobbly legs, a glowing thread trailing from it.
// m.special: it's vanished (about to drop in behind you), so it's only a flicker of thread.
function drawKnotSpider(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.18 + 0.12 * Math.sin(t * 40);
  const cy = -h * 0.5, r = h * 0.38, step = m.walking ? t * 14 + seed : 0;
  ctx.strokeStyle = '#4a3058';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const k = Math.sin(step + i * 1.4 + (s > 0 ? 0 : 0.7)) * 3, bx = s * r * (0.2 + i * 0.12);
      ctx.beginPath();
      ctx.moveTo(bx, cy + 2);
      ctx.quadraticCurveTo(s * (r + 6 + i * 4), cy - r * 0.6 - k, s * (r + 12 + i * 5), -1 + (i % 2) * 0);
      ctx.stroke();
      ctx.fillStyle = '#6a4a78'; // a knot on each knee
      circle(ctx, s * (r + 8 + i * 4), cy - r * 0.45 - k * 0.6, 2.4);
    }
  }
  // the glowing thread it hangs from, running up out of sight
  ctx.strokeStyle = `rgba(170,250,225,${0.5 + 0.3 * Math.sin(t * 3)})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, cy - r * 0.6);
  ctx.quadraticCurveTo(-r * 0.6, cy - h * 1.2, -r * 0.2, cy - h * 2.4);
  ctx.stroke();
  const body = () => ctx.ellipse(0, cy, r * 1.1, r, 0, 0, TAU);
  ctx.fillStyle = '#8a5a98';
  ctx.strokeStyle = '#4a3058';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,220,255,0.35)'; // fuzz
  for (let i = 0; i < 7; i++) circle(ctx, -r * 0.7 + i * r * 0.24, cy - r * 0.75 + Math.sin(i * 2) * 2, 2.4);
  ctx.fillStyle = 'rgba(170,250,225,0.7)'; // a knot pattern on its back
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, cy - r * 0.2, r * 0.32, r * 0.18, 0.6, 0, TAU);
  ctx.fill();
  face(ctx, r * 0.45, cy + r * 0.05, r * 0.2, t, seed, { dying, size: 0.75 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Glowworm: a soft segmented grub, pale green, its tail a glowing lantern; it throws a beam of light along
// the floor out of its head. m.warn: its head lights up, charging the beam.
function drawGlowworm(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05, crawl = m.walking ? t * 8 + seed : seed;
  const segs = 5, sr = h * 0.4;
  const seg = (i) => {
    const x = -w * 0.4 + (i / (segs - 1)) * w * 0.72, lift = Math.max(0, Math.sin(crawl - i * 0.9)) * 4;
    return [x, -sr - lift, sr * (i === segs - 1 ? 1.08 : 0.92 + i * 0.02)];
  };
  // the tail lantern
  const [tx, ty] = seg(0), lp = 0.7 + 0.3 * Math.sin(t * 2.5 + seed);
  halo(ctx, tx - 6, ty, 34, '200,255,190', 0.55 * lp);
  ctx.fillStyle = `rgba(235,255,200,${0.85 + 0.15 * lp})`;
  circle(ctx, tx - 6, ty, sr * 0.75);
  for (let i = 1; i < segs; i++) {
    const [x, y, r] = seg(i);
    ctx.fillStyle = i % 2 ? '#c8e8b0' : '#b8dca0';
    ctx.strokeStyle = '#6a9a5a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6a9a5a';
    ellipse(ctx, x - r * 0.3, -2, 2.4, 2); // little feet
  }
  const [hx, hy, hr] = seg(segs - 1);
  if (warn) {
    halo(ctx, hx + hr * 0.6, hy + 4, 40, '255,250,200', 0.8);
    ctx.fillStyle = '#fffbe0';
    circle(ctx, hx + hr * 0.8, hy + 6, 4 + Math.sin(t * 30) * 1);
  }
  face(ctx, hx + hr * 0.3, hy - 1, hr * 0.28, t, seed, { dying, size: 0.8 });
  ctx.strokeStyle = '#6a9a5a'; // feelers
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(hx + 2, hy - hr * 0.8);
  ctx.quadraticCurveTo(hx + 8, hy - hr * 1.6, hx + 14, hy - hr * 1.5);
  ctx.stroke();
  ctx.fillStyle = '#fffbe0';
  circle(ctx, hx + 14, hy - hr * 1.5, 2);
  return () => {
    ctx.beginPath();
    for (let i = 1; i < segs; i++) {
      const [x, y, r] = seg(i);
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
  };
}

// Glow moth: a fluffy moth with big soft wings that glow pink and gold. m.special: faded out (it can't be
// hurt), about to pulse outward.
function drawGlowMoth(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  const flap = Math.sin(t * 9 + seed) * 0.45, cy = -h * 0.55;
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.28 + 0.12 * Math.sin(t * 24);
  halo(ctx, 0, cy, w * 0.9, '255,210,170', 0.35);
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(0, cy);
    ctx.scale(1, 1 - Math.abs(flap) * 0.3);
    ctx.rotate(s * flap * 0.4);
    for (const [k, c] of [[1, 'rgba(255,190,225,0.9)'], [0.6, 'rgba(255,232,170,0.9)']]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.bezierCurveTo(s * w * 0.4 * k, -h * 0.75 * k, s * w * 0.62 * k, -h * 0.1, s * w * 0.4 * k, h * 0.12 * k);
      ctx.quadraticCurveTo(s * w * 0.2 * k, h * 0.2 * k, 0, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; // eye spots
    circle(ctx, s * w * 0.3, -h * 0.2, 3);
    ctx.restore();
  }
  const body = () => ctx.ellipse(0, cy, w * 0.12, h * 0.34, 0, 0, TAU);
  ctx.fillStyle = '#f0e0c8';
  ctx.strokeStyle = '#b89870';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#b89870'; // feathery antennae
  ctx.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 2, cy - h * 0.3);
    ctx.quadraticCurveTo(s * 8, cy - h * 0.6, s * 12, cy - h * 0.62);
    ctx.stroke();
  }
  face(ctx, w * 0.02, cy - h * 0.14, w * 0.06, t, seed, { dying, size: 0.6 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
    ctx.moveTo(w * 0.45, cy);
    ctx.ellipse(0, cy, w * 0.45, h * 0.4, 0, 0, TAU);
  };
}

// Threadweaver: a long-legged, small-bodied weaver, teal and gold, spinning a glowing thread behind it
// that sticks to the floor (its trail).
function drawWeaver(ctx, w, h, t, seed, m, dying) {
  const cy = -h * 0.72, r = h * 0.24, step = m.walking ? t * 10 + seed : 0;
  ctx.strokeStyle = '#2e5058';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const k = Math.sin(step + i * 1.6 + (s > 0 ? 0 : 0.8)) * 4, foot = s * (w * 0.2 + i * w * 0.08);
      ctx.beginPath();
      ctx.moveTo(s * r * 0.4, cy);
      ctx.quadraticCurveTo(foot * 0.8, cy - h * 0.38 - k, foot + k * s, 0);
      ctx.stroke();
    }
  }
  // the glowing thread it spins out behind
  ctx.strokeStyle = `rgba(170,255,225,${0.7 + 0.2 * Math.sin(t * 4)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r, cy + 2);
  ctx.quadraticCurveTo(-w * 0.5, cy + h * 0.4, -w * 0.7, -2);
  ctx.stroke();
  const body = () => ctx.ellipse(0, cy, r * 1.3, r, 0, 0, TAU);
  ctx.fillStyle = '#4a8a90';
  ctx.strokeStyle = '#24464f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,226,160,0.85)'; // gold bands
  for (const x of [-0.5, 0]) ellipse(ctx, r * x, cy - r * 0.2, r * 0.18, r * 0.7);
  face(ctx, r * 0.7, cy, r * 0.3, t, seed, { dying, size: 0.6 });
  return () => {
    ctx.beginPath();
    body();
    ctx.rect(-w * 0.4, cy, w * 0.8, -cy);
  };
}

export const DEEP_MOB_ART = {
  puffcap: drawPuffcap, cave_bat: drawCaveBat, puffball: drawPuffball, puffling: drawPuffball, root_beetle: drawRootBeetle, knot_spider: drawKnotSpider,
  glowworm: drawGlowworm, glow_moth: drawGlowMoth, thread_weaver: drawWeaver,
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

// Rootwood Saber: a dark root carved into a slightly curved blade, a mint glow running along its grain
function drawRootwoodSaber(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = '#5a4030';
  ctx.strokeStyle = '#2e2018';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-4, -5);
  ctx.quadraticCurveTo(-6, -L * 0.6, 1, -L);
  ctx.quadraticCurveTo(7, -L * 0.6, 4, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(160,255,220,${0.6 + 0.4 * glow})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.quadraticCurveTo(-2, -L * 0.5, 1, -L * 0.92);
  ctx.stroke();
  ctx.fillStyle = '#7a5a40'; // a knot for a guard
  ellipse(ctx, 0, -6, 8, 3.4);
  ctx.fillStyle = '#7c9a6a';
  ellipse(ctx, -5, -7, 3, 2);
  grip(ctx, '#8a6a4a', '#4a3428');
  ctx.restore();
}

// Silkthread Blade: a pale blade wound tight with knot silk, the knots glowing faintly
function drawSilkBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = '#ece4f4';
  ctx.strokeStyle = '#9a88b0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-3.6, -5);
  ctx.lineTo(-3.4, -L * 0.86);
  ctx.lineTo(0, -L);
  ctx.lineTo(3.4, -L * 0.86);
  ctx.lineTo(3.6, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#c8b0e0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -8; y > -L * 0.8; y -= 5) {
    ctx.moveTo(-3.6, y);
    ctx.lineTo(3.6, y - 3);
  }
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = `rgba(170,250,225,${0.55 + 0.45 * glow})`;
    circle(ctx, i % 2 ? 2 : -2, -L * (0.22 + i * 0.16), 1.8);
  }
  ctx.fillStyle = '#8a5a98';
  ctx.beginPath();
  ctx.roundRect(-8, -7, 16, 4, 2);
  ctx.fill();
  grip(ctx, '#b8a0d0', '#6a4a78');
  ctx.restore();
}

// The Knotmole's Claw: her great curved digging claw, dark horn, with a knot of root bound round the base
function drawBurrowClaw(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, '#6a5a6e');
  g.addColorStop(1, '#3a2e40');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#221a28';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-7, -6);
  ctx.bezierCurveTo(-10, -L * 0.45, -4, -L * 0.9, 8, -L - 2);
  ctx.bezierCurveTo(2, -L * 0.75, 6, -L * 0.4, 6, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,230,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.bezierCurveTo(-6, -L * 0.45, -1, -L * 0.82, 6, -L * 0.96);
  ctx.stroke();
  if (glow) {
    ctx.fillStyle = `rgba(170,250,225,${0.3 * glow})`;
    ellipse(ctx, 0, -L * 0.55, 10, L * 0.32);
  }
  ctx.strokeStyle = '#7a5a40'; // the root knot
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -8, 9, 4, 0.2, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(170,250,225,0.8)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  grip(ctx, '#7a5a40', '#3a2618');
  ctx.restore();
}

// Glowroot Blade: a long blade grown out of the Hollow's heart, translucent, light running down it
function drawGlowrootBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(0, -L, 0, 0);
  g.addColorStop(0, 'rgba(240,255,250,0.95)');
  g.addColorStop(0.5, 'rgba(170,255,225,0.9)');
  g.addColorStop(1, 'rgba(255,200,235,0.9)');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3e7880';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-4.4, -5);
  ctx.quadraticCurveTo(-6, -L * 0.7, 0, -L);
  ctx.quadraticCurveTo(6, -L * 0.7, 4.4, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(36,70,79,0.6)'; // root veins
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, -L * 0.9);
  for (let y = -12; y > -L * 0.8; y -= 9) {
    ctx.moveTo(0, y);
    ctx.lineTo(y % 2 ? 3 : -3, y - 5);
  }
  ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * glow})`;
  for (let i = 0; i < 3; i++) circle(ctx, 0, -L * (0.3 + i * 0.22), 1.8);
  ctx.strokeStyle = '#24464f'; // roots twined round for a guard
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-9, -4);
  ctx.quadraticCurveTo(0, -10, 9, -4);
  ctx.stroke();
  grip(ctx, '#2e4c56', '#162a32');
  ctx.restore();
}
export const DEEP_SWORDS = { rootwood_saber: drawRootwoodSaber, silk_blade: drawSilkBlade, burrow_claw: drawBurrowClaw, glowroot_blade: drawGlowrootBlade };
export const DEEP_SWORD_LEN = { rootwood_saber: 52, silk_blade: 56, burrow_claw: 58, glowroot_blade: 62 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet; by is the brim line ———
// Lantern Cap: a brown leather cap with a glowing mushroom fixed on the front for a lamp
function drawLanternCap(ctx, w, h, t) {
  const by = -h * 0.7, rx = w * 0.5;
  ctx.fillStyle = '#9a7050';
  ctx.strokeStyle = '#5a3e2c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 3);
  ctx.bezierCurveTo(-rx * 1.02, by - h * 0.42, rx * 1.02, by - h * 0.42, rx, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a5a40'; // the brim
  ctx.beginPath();
  ctx.roundRect(-rx * 1.04, by - 1, rx * 2.08, 6, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,230,190,0.4)'; // stitching
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(0, by - h * 0.3);
  ctx.lineTo(0, by);
  ctx.stroke();
  ctx.setLineDash([]);
  const lx = rx * 0.38, ly = by - h * 0.16, lp = 0.8 + 0.2 * Math.sin(t * 2.6);
  halo(ctx, lx, ly - 4, 20, '160,255,225', 0.55 * lp);
  ctx.fillStyle = '#efe4d0';
  ctx.fillRect(lx - 1.5, ly - 4, 3, 6);
  ctx.fillStyle = `rgba(179,240,224,${0.85 + 0.15 * lp})`;
  ctx.beginPath();
  ctx.arc(lx, ly - 4, 6.5, Math.PI, 0);
  ctx.fill();
}

// Beetleshell Helm: a root beetle's wing case worn as a helmet, the horn sweeping up off the front
function drawBeetleHelm(ctx, w, h) {
  const by = -h * 0.68, rx = w * 0.52;
  const g = ctx.createLinearGradient(0, by - h * 0.5, 0, by);
  g.addColorStop(0, '#9a7050');
  g.addColorStop(1, '#6a4a34');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3a2618';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 4);
  ctx.bezierCurveTo(-rx * 1.04, by - h * 0.5, rx * 1.04, by - h * 0.5, rx, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(58,38,24,0.6)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, by - h * 0.36);
  ctx.lineTo(0, by + 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,190,0.3)';
  ellipse(ctx, -rx * 0.4, by - h * 0.26, rx * 0.22, h * 0.05, -0.3);
  ctx.strokeStyle = '#7a5a40'; // the horn
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(rx * 0.3, by - h * 0.3);
  ctx.quadraticCurveTo(rx * 0.7, by - h * 0.56, rx * 0.5, by - h * 0.78);
  ctx.stroke();
}

// Knotroot Crown: warm roots knotted into a ring, a small glowing knot at the front
function drawKnotCrown(ctx, w, h, t) {
  const by = -h * 0.68, rx = w * 0.52;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#4e3a2c';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-rx, by);
  ctx.quadraticCurveTo(0, by - 8, rx, by);
  ctx.stroke();
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = 4;
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const x = -rx * 0.8 + i * rx * 0.4, tall = i % 2 ? 14 : 22;
    ctx.strokeStyle = '#6e5038';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, by - 3);
    ctx.quadraticCurveTo(x + (i % 2 ? 5 : -5), by - tall * 0.6, x, by - tall);
    ctx.stroke();
    ctx.fillStyle = '#7c9a6a';
    circle(ctx, x, by - tall, 2.6);
  }
  const p = 0.75 + 0.25 * Math.sin(t * 2);
  halo(ctx, 0, by - 6, 16, '170,255,225', 0.6 * p);
  ctx.strokeStyle = `rgba(200,255,235,${p})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, by - 6, 6, 3.5, 0.5, 0, TAU);
  ctx.stroke();
}

// Glowcap Helm: a great glowing mushroom cap, hollowed out and worn
function drawGlowcapHelm(ctx, w, h, t) {
  const by = -h * 0.66, rx = w * 0.72, p = 0.8 + 0.2 * Math.sin(t * 1.8);
  halo(ctx, 0, by - h * 0.2, w * 0.9, '170,255,225', 0.4 * p);
  ctx.fillStyle = 'rgba(160,240,215,0.95)';
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 4);
  ctx.bezierCurveTo(-rx * 1.02, by - h * 0.56, rx * 1.02, by - h * 0.56, rx, by + 4);
  ctx.quadraticCurveTo(0, by - 2, -rx, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${0.7 * p})`;
  for (const [x, y, r] of [[-0.5, 0.18, 4], [-0.05, 0.36, 5], [0.42, 0.2, 3.5]]) circle(ctx, rx * x, by - h * y, r);
  ctx.fillStyle = 'rgba(255,190,235,0.6)'; // pink gills under the brim
  ellipse(ctx, 0, by + 3, rx * 0.8, 3);
}
export const DEEP_HELMETS = { lantern_cap: drawLanternCap, beetle_helm: drawBeetleHelm, knot_crown: drawKnotCrown, glowcap_helm: drawGlowcapHelm };

// ——— materials' icons (40 × 40, centred) ———
function iconSporePuff(ctx) {
  ctx.fillStyle = '#c9a6e6';
  ctx.strokeStyle = '#7a5a98';
  ctx.lineWidth = 2;
  ctx.beginPath(); // a little cloth pouch tied at the neck
  ctx.moveTo(-12, -4);
  ctx.quadraticCurveTo(-16, 16, 0, 16);
  ctx.quadraticCurveTo(16, 16, 12, -4);
  ctx.quadraticCurveTo(0, 2, -12, -4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#8a6a4a';
  ctx.beginPath();
  ctx.moveTo(-8, -3);
  ctx.lineTo(8, -3);
  ctx.stroke();
  for (const [x, y, r] of [[-4, -10, 3.5], [3, -14, 4.5], [8, -9, 3]]) {
    ctx.fillStyle = 'rgba(230,210,255,0.9)';
    circle(ctx, x, y, r);
  }
}
function iconCaveWing(ctx) {
  ctx.fillStyle = '#7a6a98';
  ctx.strokeStyle = '#4a3a68';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-16, -6);
  ctx.quadraticCurveTo(0, -18, 16, -8);
  ctx.quadraticCurveTo(12, 2, 14, 12);
  ctx.quadraticCurveTo(6, 4, 2, 12);
  ctx.quadraticCurveTo(-4, 4, -8, 12);
  ctx.quadraticCurveTo(-10, 2, -16, -6);
  ctx.fill();
  ctx.stroke();
}
function iconPuffFluff(ctx) {
  for (const [x, y, r] of [[-7, 4, 9], [5, 6, 8], [0, -5, 9], [9, -6, 6], [-9, -6, 6]]) {
    ctx.fillStyle = '#fffaf0';
    ctx.strokeStyle = '#d6c4a4';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
}
function iconBeetleShell(ctx) {
  ctx.fillStyle = '#8a6040';
  ctx.strokeStyle = '#3a2618';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.bezierCurveTo(16, -14, 14, 12, 2, 16);
  ctx.bezierCurveTo(-12, 12, -14, -12, 0, -16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,190,0.35)';
  ellipse(ctx, -3, -6, 4, 7, -0.3);
}
function iconKnotSilk(ctx) {
  ctx.strokeStyle = '#d8c8ec';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 14 - i * 2, 9 - i, i * 0.5, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = '#a8f0d8';
  for (const [x, y] of [[-10, -2], [8, 5], [2, -8]]) circle(ctx, x, y, 2.6);
}
function iconGlowBead(ctx) {
  halo(ctx, 0, 0, 20, '220,255,190', 0.7);
  ctx.fillStyle = '#eaffc8';
  ctx.strokeStyle = '#8ab878';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  circle(ctx, -3, -3, 2.6);
}
function iconMothDust(ctx) {
  ctx.fillStyle = 'rgba(255,190,225,0.9)'; // a little glass vial of shimmering dust
  ctx.strokeStyle = '#b07890';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-7, -10, 14, 24, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c8a07a';
  ctx.fillRect(-5, -15, 10, 6);
  ctx.fillStyle = 'rgba(255,232,170,0.95)';
  for (const [x, y] of [[-3, 4], [2, 8], [3, 0], [-2, 10]]) circle(ctx, x, y, 1.6);
}
function iconGlowthread(ctx) {
  halo(ctx, 0, 0, 20, '170,255,225', 0.5);
  ctx.strokeStyle = '#7ad8c0';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let a = 0; a < TAU * 2.2; a += 0.2) {
    const r = 4 + a * 1.6;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.8);
  }
  ctx.stroke();
}
export const DEEP_ICONS = { spore_puff: iconSporePuff, cave_wing: iconCaveWing, puff_fluff: iconPuffFluff, beetle_shell: iconBeetleShell, knot_silk: iconKnotSilk, glow_bead: iconGlowBead, moth_dust: iconMothDust, glowthread: iconGlowthread };

// ——— Forager Truffle: a leather cap with a glowing mushroom lamp, a basket on her back and a trowel ———
export function drawForagerDress(ctx, w, h, fx, t) {
  ctx.save();
  // the basket on her back, with mushrooms peeking out
  ctx.save();
  ctx.translate(-w * 0.52, -h * 0.44);
  ctx.rotate(Math.sin(t * 2) * 0.04 - 0.1);
  ctx.fillStyle = '#d8b07a';
  ctx.strokeStyle = '#a07a48';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-11, -4, 22, 20, [3, 3, 7, 7]);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160,122,72,0.6)';
  ctx.beginPath();
  for (let y = 2; y < 16; y += 4) {
    ctx.moveTo(-11, y);
    ctx.lineTo(11, y);
  }
  ctx.stroke();
  for (const [x, c] of [[-6, '#e88aaa'], [1, '#c9a6e6'], [7, '#b3f0e0']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, -4, 5, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
  // the strap across her front, and the trowel tucked in it
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.4, -h * 0.72);
  ctx.quadraticCurveTo(fx * 0.3, -h * 0.4, w * 0.36, -h * 0.2);
  ctx.stroke();
  ctx.fillStyle = '#b8c0c8';
  ctx.strokeStyle = '#6a7078';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.26, -h * 0.34);
  ctx.quadraticCurveTo(w * 0.36, -h * 0.44, w * 0.42, -h * 0.34);
  ctx.lineTo(w * 0.34, -h * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // the cap and its lamp
  ctx.save();
  ctx.translate(fx * 0.25, 0);
  drawLanternCap(ctx, w * 0.92, h, t);
  ctx.restore();
}
