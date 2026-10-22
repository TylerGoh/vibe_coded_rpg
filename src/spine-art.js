// Docs: docs/places/spine.md, docs/combat/stages.md
// Keeper's Spine's art that isn't the room itself (src/spine.js): its creatures (moss turtle, crag kite,
// stone sentinel, gale sprite and rootling; SPINE_MOB_ART, called by drawMob in src/field.js), the gear
// dropped there and by the Root Warden (SPINE_SWORDS, SPINE_SWORD_LEN, SPINE_HELMETS, drawn by drawSword /
// drawHelmet in src/field.js) and its materials' icons (SPINE_ICONS). The Root Warden itself is in
// src/dens-spine.js.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const AMBER = '255,200,110'; // the Keepers' light: sentinels' eyes, the Warden, rune chips
function face(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, sleepy = false } = {}) {
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
    } else if (blink || sleepy) {
      ctx.beginPath();
      ctx.arc(ex, fy - 1, 2.4 * size, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else {
      ellipse(ctx, ex, fy, 2.4 * size, 3.2 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
      ctx.fillStyle = INKC;
    }
  }
}
function halo(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// a ring of gear teeth, the Keepers' mark
export function gearMark(ctx, x, y, r, teeth, col, lw = 1.4) {
  ctx.strokeStyle = col;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TAU;
    ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35);
  }
  ctx.stroke();
}
// a tiny heather sprig
function heather(ctx, x, y, s) {
  ctx.strokeStyle = '#5e7a4a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 8 * s);
  ctx.stroke();
  ctx.fillStyle = '#c48ad0';
  for (let i = 0; i < 4; i++) circle(ctx, x + (i % 2 ? 1.6 : -1.6) * s, y - (3 + i * 1.8) * s, 1.4 * s);
}

// Moss turtle: a big slow tortoise whose high domed shell has gone green with moss and heather (a whole
// little hillside on its back). It shields with a thick mossy brow-plate over its face: hit it from behind.
// m.warn: pulls its head in, plate down · m.charging: lunges, plate first.
function drawMossTurtle(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, lunge = !!m.charging && live;
  const cy = -h * 0.5, rx = w * 0.42, ry = h * 0.48;
  const step = m.walking || lunge ? Math.sin(t * 8) * 2.5 : 0;
  // stumpy legs
  ctx.fillStyle = '#8a8a6a';
  ctx.strokeStyle = '#4e4a3a';
  ctx.lineWidth = 1.6;
  for (const [x, s] of [[-0.62, 1], [-0.22, -1], [0.25, 1], [0.6, -1]]) {
    ctx.beginPath();
    ctx.roundRect(rx * x - 6 + step * s, -h * 0.22, 12, h * 0.22, 4);
    ctx.fill();
    ctx.stroke();
  }
  // the head, poking out in front under the plate (or tucked in)
  const hx = rx * (warn ? 0.86 : 1.02) + (lunge ? 6 : 0), hy = -h * 0.3;
  ctx.fillStyle = '#9a9a78';
  ctx.beginPath();
  ctx.ellipse(hx, hy, h * 0.2, h * 0.16, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (!warn) face(ctx, hx + h * 0.06, hy - 1, 0.1, t, seed, { dying, size: 0.75, sleepy: !m.walking });
  // the shell: a mossy dome
  const shell = () => {
    ctx.beginPath();
    ctx.moveTo(-rx, -h * 0.2);
    ctx.bezierCurveTo(-rx, cy - ry * 0.95, rx, cy - ry * 0.95, rx, -h * 0.2);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, cy - ry, 0, -h * 0.2);
  g.addColorStop(0, '#8ab46a');
  g.addColorStop(1, '#5e7e4a');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3e5a30';
  ctx.lineWidth = 2;
  shell();
  ctx.fill();
  ctx.stroke();
  // the stone shell showing through in plates at the rim
  ctx.fillStyle = '#a8a4b4';
  ctx.strokeStyle = '#6e6a7a';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.roundRect(-rx + 4 + i * rx * 0.38, -h * 0.27, rx * 0.34, h * 0.1, 3);
    ctx.fill();
    ctx.stroke();
  }
  // moss lumps and heather on top
  ctx.fillStyle = '#9ac478';
  for (const [x, y, r] of [[-0.4, 0.62, 0.18], [0.05, 0.85, 0.22], [0.42, 0.6, 0.16]]) ellipse(ctx, rx * x, -h * y, rx * r, rx * r * 0.6);
  heather(ctx, -rx * 0.15, -h * 0.86, 1);
  heather(ctx, rx * 0.25, -h * 0.8, 0.8);
  heather(ctx, -rx * 0.55, -h * 0.6, 0.7);
  // the brow-plate over its face: thick, mossy, carved with a little gear (it was made, or it grew? nobody knows)
  const px = rx * 0.9 + (lunge ? 6 : 0), py = -h * 0.36 + (warn ? 4 : 0);
  ctx.fillStyle = '#b4b0c0';
  ctx.strokeStyle = '#5e5a6e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(px, py, h * 0.14, h * 0.24, 0.15, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(px, py - h * 0.24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8ab46a';
  ellipse(ctx, px + 2, py - h * 0.2, h * 0.09, h * 0.05, 0.3);
  gearMark(ctx, px + h * 0.05, py + 2, 3, 8, 'rgba(94,90,110,0.8)', 1);
  return () => {
    shell();
    ctx.moveTo(px + h * 0.14, py);
    ctx.ellipse(px, py, h * 0.14, h * 0.24, 0.15, 0, TAU);
  };
}

// Crag kite: a rust-and-cream bird of prey with long barred wings and a forked tail, hanging on the ridge
// wind. m.warn: hovers, wings up, and fixes its eye on you · m.charging: the dive, wings folded back.
function drawCragKite(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const cy = -h * 0.5, bob = live && !dive ? Math.sin(t * 2 + seed) * 2 : 0;
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(dive ? 0.5 : 0);
  const flap = dive ? -0.9 : warn ? -0.5 + Math.sin(t * 18) * 0.15 : Math.sin(t * 4 + seed) * 0.35;
  // the far wing
  const wing = (s, a) => {
    ctx.save();
    ctx.translate(-w * 0.04, cy - 2);
    ctx.rotate(a * s);
    ctx.scale(1, s);
    ctx.fillStyle = s > 0 ? '#9a5a32' : '#b8703e';
    ctx.strokeStyle = '#5a3018';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.25, -h * 0.75, -w * 0.62, -h * 0.55);
    ctx.lineTo(-w * 0.5, -h * 0.4);
    ctx.lineTo(-w * 0.55, -h * 0.3);
    ctx.quadraticCurveTo(-w * 0.25, -h * 0.15, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,14,0.55)'; // the bars
    ctx.lineWidth = 1.2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-w * 0.12 * i, -h * 0.12 * i);
      ctx.lineTo(-w * 0.12 * i - 6, -h * 0.12 * i + 8);
      ctx.stroke();
    }
    ctx.fillStyle = '#2d2420'; // dark tips
    ellipse(ctx, -w * 0.58, -h * 0.47, 5, 3, -0.5);
    ctx.restore();
  };
  wing(1, flap);
  // the forked tail
  ctx.fillStyle = '#b8703e';
  ctx.strokeStyle = '#5a3018';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w * 0.25, cy);
  ctx.lineTo(-w * 0.55, cy - 6);
  ctx.lineTo(-w * 0.45, cy);
  ctx.lineTo(-w * 0.55, cy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the body: cream breast, rust back
  const body = () => ctx.ellipse(0, cy, w * 0.3, h * 0.26, 0, 0, TAU);
  ctx.fillStyle = '#c8804a';
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f2e2c8';
  ellipse(ctx, w * 0.06, cy + h * 0.08, w * 0.18, h * 0.14);
  ctx.fillStyle = 'rgba(140,80,40,0.6)'; // streaks
  for (let i = 0; i < 3; i++) ellipse(ctx, w * (0.0 + i * 0.07), cy + h * 0.1, 1.2, 3);
  // the head, a grey crown, hooked yellow beak
  const hx = w * 0.3, hy = cy - h * 0.12;
  ctx.fillStyle = '#d8d0c8';
  ctx.strokeStyle = '#5a3018';
  ctx.beginPath();
  ctx.arc(hx, hy, h * 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f2c24a';
  ctx.beginPath();
  ctx.moveTo(hx + h * 0.16, hy - 2);
  ctx.quadraticCurveTo(hx + h * 0.38, hy, hx + h * 0.3, hy + 6);
  ctx.lineTo(hx + h * 0.16, hy + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  face(ctx, hx + h * 0.06, hy - 2, 0.1, t, seed, { dying, size: 0.7 });
  if (warn) {
    ctx.strokeStyle = INKC; // a fierce brow
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(hx, hy - 7);
    ctx.lineTo(hx + 8, hy - 5);
    ctx.stroke();
  }
  wing(-1, flap * 0.8);
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, cy + bob, w * 0.3, h * 0.26, 0, 0, TAU);
    ctx.moveTo(hx + h * 0.2, hy + bob);
    ctx.arc(hx, hy + bob, h * 0.2, 0, TAU);
  };
}

// Stone sentinel: a small Keeper-made guardian, a squat pillar of grey stone on two stubby legs with moss
// for hair, a gear carved on its chest and one round amber eye-stone that still glows. It's slow and it
// never leaves the road. m.warn: the eye brightens and a beam gathers (the beam itself: src/hazards.js).
function drawStoneSentinel(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const step = m.walking ? Math.sin(t * 7 + seed) * 2 : 0;
  // legs
  ctx.fillStyle = '#8a8698';
  ctx.strokeStyle = '#4e4a5e';
  ctx.lineWidth = 2;
  for (const [x, s] of [[-0.24, 1], [0.12, -1]]) {
    ctx.beginPath();
    ctx.roundRect(w * x + step * s, -h * 0.2, w * 0.22, h * 0.2 + 1, [3, 3, 5, 5]);
    ctx.fill();
    ctx.stroke();
  }
  const body = () => ctx.roundRect(-w * 0.4, -h * 0.94, w * 0.8, h * 0.76, [w * 0.3, w * 0.3, 8, 8]);
  const g = ctx.createLinearGradient(-w * 0.4, 0, w * 0.4, 0);
  g.addColorStop(0, '#c4c0d0');
  g.addColorStop(1, '#8e8a9c');
  ctx.fillStyle = g;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // cracks and lichen
  ctx.strokeStyle = 'rgba(70,66,86,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -h * 0.5);
  ctx.lineTo(-w * 0.18, -h * 0.42);
  ctx.lineTo(-w * 0.22, -h * 0.3);
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,210,120,0.75)';
  circle(ctx, -w * 0.22, -h * 0.26, 2.4);
  circle(ctx, -w * 0.16, -h * 0.3, 1.6);
  // the gear on its chest
  gearMark(ctx, w * 0.02, -h * 0.4, w * 0.12, 10, 'rgba(78,74,94,0.9)', 1.6);
  // moss for hair, a heather sprig in it
  ctx.fillStyle = '#7aa05e';
  ctx.beginPath();
  ctx.ellipse(-w * 0.04, -h * 0.92, w * 0.36, h * 0.07, 0, Math.PI, 0);
  ctx.fill();
  for (let i = 0; i < 5; i++) ellipse(ctx, -w * 0.32 + i * w * 0.15, -h * 0.9, 4, 3.4);
  heather(ctx, w * 0.12, -h * 0.94, 0.8);
  // the eye-stone, turned to face forward
  const ex = w * 0.2, ey = -h * 0.7, pulse = 0.6 + 0.4 * Math.sin(t * 3 + seed);
  if (live) halo(ctx, ex, ey, warn ? 26 : 14, AMBER, warn ? 0.9 : 0.45 * pulse);
  ctx.fillStyle = '#5e5a6e';
  circle(ctx, ex, ey, w * 0.13);
  ctx.fillStyle = live ? (warn ? '#fff4d0' : '#ffcf7a') : '#9a9488';
  circle(ctx, ex, ey, w * 0.09);
  if (live) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    circle(ctx, ex + 1.5, ey - 1.5, 1.6);
  }
  return () => {
    ctx.beginPath();
    body();
  };
}

// Gale sprite: a little whirl of the ridge wind made visible, pale blue-white, with a round face in the
// middle and streaming tails, a few heather petals caught going round. m.special: it's blown away (only a
// faint swirl: it can't be hurt), about to gust back out (the pulse: src/hazards.js).
function drawGaleSprite(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  const cy = -h * 0.5, r = w * 0.32, spin = t * 5 + seed;
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.22 + 0.1 * Math.sin(t * 22);
  halo(ctx, 0, cy, w * 0.8, '220,240,255', 0.3);
  // the swirl: three curling tails
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = spin + (i / 3) * TAU;
    ctx.strokeStyle = `rgba(230,244,255,${0.85 - i * 0.15})`;
    ctx.lineWidth = 5 - i;
    ctx.beginPath();
    for (let k = 0; k <= 12; k++) {
      const aa = a + k * 0.32, rr = r * (0.6 + k * 0.1);
      const px = Math.cos(aa) * rr - k * 1.6, py = cy + Math.sin(aa) * rr * 0.7;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  // the body
  const g = ctx.createRadialGradient(-r * 0.3, cy - r * 0.3, 2, 0, cy, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#bfe0f4');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(110,150,190,0.8)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, cy, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(150,190,225,0.7)'; // a curl drawn on it
  ctx.beginPath();
  ctx.arc(-r * 0.2, cy + r * 0.1, r * 0.45, Math.PI * 0.2, Math.PI * 1.3);
  ctx.stroke();
  face(ctx, r * 0.2, cy - 2, 4, t, seed, { dying, size: 0.8 });
  ctx.fillStyle = 'rgba(255,150,170,0.35)';
  ellipse(ctx, r * 0.5, cy + 4, 3, 2);
  // heather petals going round
  ctx.fillStyle = '#c48ad0';
  for (let i = 0; i < 4; i++) {
    const a = -spin * 1.3 + i * 1.6;
    ellipse(ctx, Math.cos(a) * r * 1.4, cy + Math.sin(a) * r * 0.9, 2.2, 1.4, a);
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.arc(0, cy, r, 0, TAU);
  };
}

// Rootling: a knobbly little root-creature, brown and gnarled, with a sprig of leaves on its head, amber eyes
// like the Warden's and long root-fingers. m.special: it's dived underground (only a lump of earth and the
// sprig, moving) to come up behind you · m.warn: arms up, fingers spread, about to sweep.
function drawRootling(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, gone = !!m.special && live, warn = !!m.warn && live;
  if (gone) {
    // a little mound of earth with the sprig sticking out, wobbling along
    ctx.fillStyle = '#7a6048';
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.4, h * 0.18, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#6a8a4a';
    ellipse(ctx, Math.sin(t * 12) * 2, -h * 0.24, 5, 3, -0.4);
    ellipse(ctx, 4 + Math.sin(t * 12) * 2, -h * 0.28, 4, 2.4, 0.5);
    return () => {
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.4, h * 0.18, 0, Math.PI, 0);
    };
  }
  const step = m.walking ? Math.sin(t * 12 + seed) : 0;
  const cy = -h * 0.5;
  // root legs, splayed
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * w * 0.12, cy + h * 0.2);
    ctx.quadraticCurveTo(s * w * 0.2 + step * s * 3, -h * 0.1, s * w * 0.3 + step * s * 4, 0);
    ctx.stroke();
  }
  // arms: root-fingers, up in the wind-up
  ctx.lineWidth = 3;
  for (const s of [-1, 1]) {
    const ax = s * w * 0.3, ay = cy - (warn ? h * 0.32 : -h * 0.02);
    ctx.beginPath();
    ctx.moveTo(s * w * 0.18, cy);
    ctx.quadraticCurveTo(s * w * 0.32, cy - (warn ? h * 0.1 : -h * 0.05), ax, ay);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    for (const d of [-0.5, 0, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + s * 6 + d * 4, ay + (warn ? -7 : 6) + d * 5);
      ctx.stroke();
    }
    ctx.lineWidth = 3;
  }
  // the gnarled body
  const body = () => ctx.ellipse(0, cy, w * 0.24, h * 0.3, 0, 0, TAU);
  const g = ctx.createLinearGradient(-w * 0.24, 0, w * 0.24, 0);
  g.addColorStop(0, '#9a7656');
  g.addColorStop(1, '#6a4c36');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3e2a1e';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(62,42,30,0.55)'; // grain
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-w * 0.14 + i * w * 0.1, cy - h * 0.22);
    ctx.quadraticCurveTo(-w * 0.1 + i * w * 0.1, cy, -w * 0.15 + i * w * 0.1, cy + h * 0.22);
    ctx.stroke();
  }
  // the sprig on top
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, cy - h * 0.28);
  ctx.lineTo(1, cy - h * 0.42);
  ctx.stroke();
  ctx.fillStyle = '#7aa858';
  ellipse(ctx, -4, cy - h * 0.43, 6, 3.2, -0.5);
  ellipse(ctx, 6, cy - h * 0.46, 6, 3.2, 0.5);
  // amber eyes, glowing
  const ey = cy - h * 0.06;
  for (const ex of [w * 0.02, w * 0.14]) {
    if (live) halo(ctx, ex, ey, 7, AMBER, 0.55);
    ctx.fillStyle = live ? '#ffcf7a' : '#8a7a68';
    circle(ctx, ex, ey, live ? 2.6 : 1.8);
  }
  if (!live) face(ctx, w * 0.08, ey, 0.06 * w, t, seed, { dying, size: 0.7 });
  return () => {
    ctx.beginPath();
    body();
  };
}

export const SPINE_MOB_ART = {
  moss_turtle: drawMossTurtle, crag_kite: drawCragKite, stone_sentinel: drawStoneSentinel, gale_sprite: drawGaleSprite, rootling: drawRootling,
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
// Sentinel Blade: a long straight blade of grey Keeper stone, a gear carved at the hilt and an amber stone
// in the pommel
function drawSentinelBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(-5, -L * 0.86);
    ctx.lineTo(0, -L);
    ctx.lineTo(5, -L * 0.86);
    ctx.lineTo(5, -6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-5, 0, 5, 0);
  g.addColorStop(0, '#d0ccdc');
  g.addColorStop(0.5, '#b0acc0');
  g.addColorStop(1, '#8a8698');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4e4a5e';
  ctx.lineWidth = 1.6;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(78,74,94,0.5)'; // a carved line of runes up the middle
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = -L * (0.2 + i * 0.11);
    ctx.beginPath();
    ctx.moveTo(-1.5, y);
    ctx.lineTo(1.5, y - 3);
    ctx.moveTo(1.5, y);
    ctx.lineTo(-1.5, y - 3);
    ctx.stroke();
  }
  ctx.strokeStyle = `rgba(${AMBER},${0.3 + 0.5 * glow})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3.5, -10);
  ctx.lineTo(-3.5, -L * 0.84);
  ctx.stroke();
  // the guard: a stone bar with a gear
  ctx.fillStyle = '#8a8698';
  ctx.strokeStyle = '#4e4a5e';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-10, -8, 20, 5, 2);
  ctx.fill();
  ctx.stroke();
  gearMark(ctx, 0, -5.5, 3.2, 8, '#4e4a5e', 1);
  grip(ctx, '#6a5a48', '#3e3228');
  halo(ctx, 0, 13, 6, AMBER, 0.4 + 0.4 * glow);
  ctx.fillStyle = '#ffcf7a';
  circle(ctx, 0, 13, 2.6);
  ctx.restore();
}
// Warden's Greatblade: a broad stone greatsword with roots grown all through it, moss in the cracks, the
// Warden's amber light glowing out of the deepest crack
function drawWardenBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-7, -6);
    ctx.lineTo(-8, -L * 0.8);
    ctx.lineTo(-3, -L);
    ctx.lineTo(4, -L * 0.96);
    ctx.lineTo(8, -L * 0.8);
    ctx.lineTo(7, -6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, '#bcb8c8');
  g.addColorStop(1, '#7e7a8e');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3e3a4e';
  ctx.lineWidth = 1.8;
  blade();
  ctx.fill();
  ctx.stroke();
  // the crack, glowing
  ctx.strokeStyle = `rgba(${AMBER},${0.45 + 0.5 * glow})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1, -10);
  ctx.lineTo(-1, -L * 0.3);
  ctx.lineTo(2, -L * 0.5);
  ctx.lineTo(0, -L * 0.72);
  ctx.stroke();
  // roots winding up round it
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -4);
  for (let i = 1; i <= 6; i++) ctx.lineTo(i % 2 ? 8 : -8, -L * 0.13 * i);
  ctx.stroke();
  ctx.fillStyle = '#7aa05e';
  for (const [x, y] of [[-6, 0.3], [6, 0.52], [-5, 0.7]]) ellipse(ctx, x, -L * y, 3, 1.8);
  // a heavy stone guard and a root-wrapped grip
  ctx.fillStyle = '#8a8698';
  ctx.strokeStyle = '#3e3a4e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-13, -9, 26, 6, 3);
  ctx.fill();
  ctx.stroke();
  gearMark(ctx, 0, -6, 3.4, 8, '#3e3a4e', 1);
  grip(ctx, '#5a4030', '#3e2a1e');
  ctx.restore();
}
export const SPINE_SWORDS = { sentinel_blade: drawSentinelBlade, warden_blade: drawWardenBlade };
export const SPINE_SWORD_LEN = { sentinel_blade: 64, warden_blade: 68 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Mossback Helm: an old turtle shell gone green with moss, a heather sprig on top, stone plates at the rim
function drawMossbackHelm(ctx, w, h) {
  const by = -h * 0.7, rx = w * 0.52;
  ctx.fillStyle = '#7aa05e';
  ctx.strokeStyle = '#3e5a30';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 3);
  ctx.bezierCurveTo(-rx * 1.02, by - h * 0.46, rx * 1.02, by - h * 0.46, rx, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9ac478';
  for (const [x, y, r] of [[-0.45, 0.16, 0.2], [0.05, 0.3, 0.24], [0.45, 0.14, 0.18]]) ellipse(ctx, rx * x, by - h * y, rx * r, rx * r * 0.55);
  heather(ctx, rx * 0.1, by - h * 0.32, 1.1);
  ctx.fillStyle = '#a8a4b4';
  ctx.strokeStyle = '#6e6a7a';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.roundRect(-rx + 2 + i * rx * 0.4, by - 3, rx * 0.36, 7, 3);
    ctx.fill();
    ctx.stroke();
  }
}
// Wardenstone Helm: a Keeper guardian's grey stone helm with a cheek-guard each side, a gear on the brow,
// and a crown of living roots growing up out of it, the amber light in the gear
function drawWardenHelm(ctx, w, h, t) {
  const by = -h * 0.72, rx = w * 0.52;
  halo(ctx, 0, by - 14, rx * 1.1, AMBER, 0.22);
  // the root crown, behind
  ctx.strokeStyle = '#5a4030';
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  for (const [x, top, bend] of [[-0.6, 0.42, -6], [-0.2, 0.55, -3], [0.2, 0.55, 3], [0.6, 0.42, 6]]) {
    ctx.beginPath();
    ctx.moveTo(rx * x, by - h * 0.16);
    ctx.quadraticCurveTo(rx * x + bend, by - h * top * 0.7, rx * x + bend * 0.4, by - h * top);
    ctx.stroke();
  }
  ctx.fillStyle = '#7aa858';
  for (const [x, top] of [[-0.6, 0.42], [0.2, 0.55], [0.6, 0.42]]) ellipse(ctx, rx * x + 2, by - h * top, 3.4, 2, 0.4 + Math.sin(t + x) * 0.1);
  // the stone dome and cheek-guards
  ctx.fillStyle = '#a8a4b4';
  ctx.strokeStyle = '#4e4a5e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.04, by + 8);
  ctx.lineTo(-rx * 1.04, by);
  ctx.bezierCurveTo(-rx, by - h * 0.4, rx, by - h * 0.4, rx * 1.04, by);
  ctx.lineTo(rx * 1.04, by + 8);
  ctx.lineTo(rx * 0.8, by + 4);
  ctx.lineTo(-rx * 0.8, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c4c0d0';
  ellipse(ctx, -rx * 0.4, by - h * 0.16, rx * 0.22, h * 0.05, -0.3);
  gearMark(ctx, 0, by - h * 0.1, 5, 10, '#4e4a5e', 1.4);
  ctx.fillStyle = '#ffcf7a';
  circle(ctx, 0, by - h * 0.1, 2.6);
}
export const SPINE_HELMETS = { mossback_helm: drawMossbackHelm, warden_helm: drawWardenHelm };

// ——— materials' icons (40 × 40, centred) ———
function iconTurtleMoss(ctx) {
  ctx.fillStyle = '#5e7e4a';
  ellipse(ctx, 0, 6, 16, 9);
  ctx.fillStyle = '#8ab46a';
  for (const [x, y, r] of [[-8, 2, 7], [3, -1, 9], [10, 5, 6]]) circle(ctx, x, y, r);
  heather(ctx, 2, -4, 1.1);
  ctx.fillStyle = '#f2e2c8'; // the tiny snail
  circle(ctx, -9, 9, 3);
  ctx.strokeStyle = '#a07a48';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-9, 9, 1.6, 0, TAU * 0.8);
  ctx.stroke();
}
function iconKiteFeather(ctx) {
  ctx.save();
  ctx.rotate(0.7);
  ctx.fillStyle = '#b8703e';
  ctx.strokeStyle = '#5a3018';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 17);
  ctx.quadraticCurveTo(-8, 0, 0, -18);
  ctx.quadraticCurveTo(8, 0, 0, 17);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,30,14,0.6)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-5, -9 + i * 6);
    ctx.lineTo(5, -11 + i * 6);
    ctx.stroke();
  }
  ctx.strokeStyle = '#f2e2c8';
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.lineTo(0, -16);
  ctx.stroke();
  ctx.restore();
}
function iconRuneChip(ctx) {
  halo(ctx, 0, 0, 18, AMBER, 0.35);
  ctx.fillStyle = '#a8a4b4';
  ctx.strokeStyle = '#4e4a5e';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-14, 6);
  ctx.lineTo(-8, -12);
  ctx.lineTo(10, -10);
  ctx.lineTo(14, 8);
  ctx.lineTo(-2, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.rect(-14, -12, 16, 28);
  ctx.clip();
  gearMark(ctx, 2, 1, 6, 10, '#ffcf7a', 1.8);
  ctx.restore();
}
function iconBottledGale(ctx) {
  ctx.fillStyle = '#c8a070';
  ctx.strokeStyle = '#7a5a30';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-4, -19, 8, 6, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(210,235,250,0.55)';
  ctx.strokeStyle = '#6a8aa8';
  ctx.beginPath();
  ctx.moveTo(-4, -13);
  ctx.bezierCurveTo(-15, -6, -15, 16, 0, 16);
  ctx.bezierCurveTo(15, 16, 15, -6, 4, -13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'; // the gust inside
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 4, 6, 0.2, TAU * 0.75);
  ctx.moveTo(-8, 10);
  ctx.quadraticCurveTo(0, 13, 8, 8);
  ctx.stroke();
}
function iconRootlingTwig(ctx) {
  ctx.strokeStyle = '#6a4c36';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, 14);
  ctx.quadraticCurveTo(-2, 4, 2, -8);
  ctx.moveTo(2, -8);
  ctx.lineTo(-4, -16);
  ctx.moveTo(2, -8);
  ctx.lineTo(10, -14);
  ctx.moveTo(-4, 4);
  ctx.lineTo(10, 6);
  ctx.stroke();
  ctx.fillStyle = '#7aa858';
  ellipse(ctx, 12, -16, 4, 2.4, -0.5);
}
export const SPINE_ICONS = { turtle_moss: iconTurtleMoss, kite_feather: iconKiteFeather, rune_chip: iconRuneChip, bottled_gale: iconBottledGale, rootling_twig: iconRootlingTwig };
