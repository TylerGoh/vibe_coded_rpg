// Docs: docs/places/causeway.md, docs/combat/stages.md
// Atlas Phase 8, L4's art that isn't a room (the room is src/causeway.js; the den and Grandfather Mire are
// src/dens-mire.js): the Lantern Causeway's creatures (lamp moth, drifting light, causeway guard, mire toad) and its
// field boss the Will-Queen (CAUSEWAY_MOB_ART, called by drawMob in src/field.js); their materials' icons
// (CAUSEWAY_ICONS); and gear for players (CAUSEWAY_SWORDS, CAUSEWAY_SWORD_LEN, CAUSEWAY_HELMETS): the guard's rare
// Causeway Helm, the Will-Queen's Queenlight and Veil, Grandfather Mire's Promise and Cap (the staves and bows are rows in
// src/staff-art.js and src/bow-art.js). Lantern Fen's register at its most open: grey-violet stone, old reed, moth-silk,
// lamplight, and the cold white of the wisps.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';
import { drawLantern } from './stillmere-art.js';

const INKC = '#2e2a3a';
const LAMP = '255,214,150';
const WISP = '220,236,255';
const SILK = '#d8d0e0', SILK_D = '#9a90a8';
const REED = '#9a8a5a', REED_D = '#6a5a38', REED_L = '#c0ae78';
const TOAD = '#5a6a3a', TOAD_D = '#3a4626', TOAD_L = '#7e8e52';

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, col = INKC } = {}) {
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
    } else if (blink) {
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
// a flame: a teardrop pointing up, its tip wavering (centre of its base at x, y)
function flame(ctx, x, y, w, h, t, p) {
  const sway = Math.sin(t * 5 + p) * w * 0.25;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.bezierCurveTo(x - w * 1.1, y - h * 0.5, x + sway * 0.5, y - h * 0.7, x + sway, y - h);
  ctx.bezierCurveTo(x + w * 0.4 + sway * 0.5, y - h * 0.6, x + w * 1.1, y - h * 0.4, x + w, y);
  ctx.quadraticCurveTo(x, y + w * 0.7, x - w, y);
  ctx.closePath();
}

// ——— the Lantern Causeway's creatures ———
// Lamp moth: a lantern moth grown huge on the causeway's lamps, broad wings of old parchment grey with an eye on each, a
// furred body, feathered antennae; hangs flapping over the posts. Before it stoops (warn) its wings fold back
function drawLampMoth(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const flap = live ? Math.sin(t * (warn ? 4 : 14) + seed) : 0;
  const by = -h * 0.5;
  const wing = (dir, up) => {
    const sp = warn ? 0.45 : 0.75 + 0.25 * flap * dir * (up ? 1 : -0.5);
    ctx.beginPath();
    ctx.moveTo(0, by);
    if (up) {
      ctx.quadraticCurveTo(-w * 0.1, by - h * 0.55 * sp, -w * 0.5 * sp, by - h * 0.5 * sp);
      ctx.quadraticCurveTo(-w * 0.52 * sp, by - h * 0.1, -w * 0.08, by + 2);
    } else {
      ctx.quadraticCurveTo(-w * 0.32 * sp, by + h * 0.1, -w * 0.36 * sp, by + h * 0.34 * sp);
      ctx.quadraticCurveTo(-w * 0.1, by + h * 0.3, 0, by + 4);
    }
    ctx.closePath();
  };
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(w * 0.06, by, w * 0.2, h * 0.14, 0, 0, TAU);
  };
  for (const [up, col] of [[true, '#bcb2a4'], [false, '#a89e92']]) {
    ctx.fillStyle = col;
    ctx.strokeStyle = '#6a6056';
    ctx.lineWidth = 1.4;
    wing(1, up);
    ctx.fill();
    ctx.stroke();
  }
  if (!warn) { // the eye on the upper wing
    const ex = -w * 0.26 * (0.75 + 0.25 * flap), ey = by - h * 0.26;
    ctx.fillStyle = '#5a4e6a';
    ellipse(ctx, ex, ey, 6, 5);
    ctx.fillStyle = '#e8d8a0';
    ellipse(ctx, ex, ey, 3, 2.6);
    ctx.fillStyle = INKC;
    circle(ctx, ex + 0.6, ey, 1.4);
  }
  softGlow(ctx, w * 0.06, by, w * 0.3, LAMP, live ? 0.18 : 0.05); // lamp-dust on it, glowing faintly
  ctx.fillStyle = '#8a7e70';
  body();
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,52,46,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(-w * 0.1 + i * 6, by - h * 0.12);
    ctx.lineTo(-w * 0.1 + i * 6, by + h * 0.12);
  }
  ctx.stroke();
  ctx.strokeStyle = '#6a6056'; // feathered antennae
  ctx.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.22, by - 3);
    ctx.quadraticCurveTo(w * 0.32, by - h * 0.3 + s * 3, w * 0.4, by - h * 0.36 + s * 5);
    ctx.stroke();
  }
  eyes(ctx, w * 0.2, by - 1, 0, t, seed, { dying, size: 0.8, col: '#1e1a24' });
  return body;
}

// Drifting light: a little flame come loose from a lantern adrift, pale gold with a cold blue heart, two small dark eyes
// in it, a bead of melted glass hanging under it; it wanders, bobbing
function drawDriftingLight(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const bob = live ? Math.sin(t * 2 + seed) * 4 : 0;
  const cy = -h * 0.3 + bob;
  softGlow(ctx, 0, cy - h * 0.2, w * 0.9, LAMP, live ? 0.4 : 0.1);
  const sil = () => flame(ctx, 0, cy, w * 0.36, h * 0.72, t, seed);
  ctx.fillStyle = live ? '#ffe2a8' : '#c8bca0';
  sil();
  ctx.fill();
  ctx.fillStyle = 'rgba(200,226,255,0.85)'; // the cold heart
  flame(ctx, 0, cy - 2, w * 0.16, h * 0.34, t, seed + 1);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,200,220,0.6)'; // a bead of glass hanging under it
  ellipse(ctx, 0, cy + 6, 3, 4);
  eyes(ctx, 0, cy - h * 0.22, 4.5, t, seed, { dying, size: 0.6, col: '#3a2e1e' });
  return sil;
}

// Causeway guard: an old fen slime up on two long stilt legs like a wading bird's, pale violet-grey, in a suit of grey woven
// reed with a tall reed hat and a lantern hung off its crest; it holds a big round woven shield across its front (the
// `shell`: blows from the front glance off it). Before it lunges (warn) it sets the shield and crouches on its stilts
function drawCausewayGuard(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, walk = !!m.walking && live;
  const step = walk ? t * 6 + seed : 0;
  const crouch = warn ? 0.86 : 1;
  const legTop = -h * 0.42 * crouch;
  ctx.strokeStyle = '#4a4058'; // the stilts
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [x, ph] of [[-w * 0.12, 0], [w * 0.1, Math.PI]]) {
    const sw = walk ? Math.sin(step + ph) * 7 : 0;
    ctx.moveTo(x, legTop);
    ctx.lineTo(x + sw * 0.4, legTop * 0.45);
    ctx.lineTo(x + sw, -1);
  }
  ctx.stroke();
  const by = legTop - h * 0.2;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, by, w * 0.36, h * 0.22, 0, 0, TAU);
  };
  ctx.fillStyle = '#b8a8c8'; // the slime
  body();
  ctx.fill();
  ctx.fillStyle = REED; // the reed coat, a skirt of it
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, by);
  ctx.lineTo(w * 0.36, by);
  ctx.lineTo(w * 0.4, legTop + 4);
  ctx.lineTo(-w * 0.4, legTop + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = REED_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -4; i <= 4; i++) {
    ctx.moveTo(i * w * 0.09, by + 2);
    ctx.lineTo(i * w * 0.1, legTop + 3);
  }
  ctx.stroke();
  // the tall reed hat with its lantern hook
  ctx.fillStyle = REED_L;
  ctx.strokeStyle = REED_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, by - h * 0.14);
  ctx.lineTo(w * 0.04, by - h * 0.52);
  ctx.lineTo(w * 0.3, by - h * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#2e2a3a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.04, by - h * 0.52);
  ctx.lineTo(w * 0.04, by - h * 0.58);
  ctx.lineTo(-w * 0.1, by - h * 0.58);
  ctx.stroke();
  drawLantern(ctx, -w * 0.1, by - h * 0.5, 0.7, live ? 1 : 0, t);
  eyes(ctx, w * 0.14, by - h * 0.04, 4.5, t, seed, { dying, size: 0.8 });
  // the shield, across its front
  const sx = w * (warn ? 0.36 : 0.32), sy = by + h * 0.04;
  ctx.fillStyle = '#a8986a';
  ctx.strokeStyle = REED_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(sx, sy, w * 0.14, h * 0.24, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(106,90,56,0.8)'; // the coil of the weave
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(sx, sy, w * 0.14 * (i / 4), h * 0.24 * (i / 4), 0, 0, TAU);
    ctx.stroke();
  }
  return body;
}

// Mire toad: a squat warty toad, green-brown with darker blotches, a pale belly, gold eyes with a bar across them; its
// throat puffs and goes; before it flicks its tongue (warn) it rears up with its throat out
function drawMireToad(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const rear = warn ? 1.12 : 1;
  const puff = live ? 0.5 + 0.5 * Math.sin(t * 3 + seed) : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.46, -2);
    ctx.quadraticCurveTo(-w * 0.5, -h * 0.7 * rear, -w * 0.06, -h * 0.82 * rear);
    ctx.quadraticCurveTo(w * 0.36, -h * 0.86 * rear, w * 0.46, -h * 0.5 * rear);
    ctx.quadraticCurveTo(w * 0.5, -h * 0.1, w * 0.3, -2);
    ctx.closePath();
  };
  ctx.fillStyle = TOAD_D; // back legs folded
  ellipse(ctx, -w * 0.3, -h * 0.16, w * 0.2, h * 0.16);
  ctx.fillStyle = TOAD;
  body();
  ctx.fill();
  ctx.strokeStyle = TOAD_D;
  ctx.lineWidth = 1.6;
  body();
  ctx.stroke();
  ctx.fillStyle = '#c8c09a'; // the belly
  ellipse(ctx, w * 0.12, -h * 0.18, w * 0.26, h * 0.16);
  ctx.fillStyle = 'rgba(58,70,38,0.75)'; // blotches and warts
  for (const [x, y, r] of [[-0.24, -0.52, 6], [0.04, -0.66, 5], [-0.08, -0.4, 4], [0.24, -0.6, 4], [-0.36, -0.3, 4]]) circle(ctx, w * x, h * y * rear, r);
  ctx.fillStyle = TOAD_L;
  for (const [x, y] of [[-0.16, -0.62], [0.14, -0.72], [-0.3, -0.48], [0.3, -0.5]]) circle(ctx, w * x, h * y * rear, 2.2);
  // the throat, puffing
  const tr = (warn ? 1.2 : 0.4 + 0.5 * puff) * 8;
  ctx.fillStyle = 'rgba(214,206,170,0.9)';
  ellipse(ctx, w * 0.34, -h * 0.26, tr, tr * 0.8);
  // the front feet
  ctx.fillStyle = TOAD_D;
  ellipse(ctx, w * 0.24, -3, 7, 3);
  ellipse(ctx, w * 0.02, -3, 7, 3);
  // gold eyes up on top
  const ex = w * 0.2, ey = -h * 0.78 * rear;
  for (const dx of [-7, 7]) {
    ctx.fillStyle = TOAD;
    circle(ctx, ex + dx, ey, 6.5);
    ctx.fillStyle = live ? '#e8b84a' : '#8a7a5a';
    circle(ctx, ex + dx, ey - 1, 4.5);
    ctx.fillStyle = INKC;
    if (live) ctx.fillRect(ex + dx - 4, ey - 2, 8, 2);
    else {
      ctx.strokeStyle = INKC;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ex + dx - 3, ey - 4); ctx.lineTo(ex + dx + 3, ey + 2);
      ctx.moveTo(ex + dx + 3, ey - 4); ctx.lineTo(ex + dx - 3, ey + 2);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = TOAD_D; // the long mouth
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(w * 0.46, -h * 0.46 * rear);
  ctx.quadraticCurveTo(w * 0.2, -h * 0.38 * rear, -w * 0.02, -h * 0.5 * rear);
  ctx.stroke();
  return body;
}

// ——— the Lantern Causeway's field boss ———
// The Will-Queen: a great will-o'-wisp, a cold white flame as tall as a house with a pale gold core, a crown of small
// flames round her head, two long calm dark eyes, and a veil of light trailing off behind her over the water. Little
// lights circle her like a court. Before she stoops (warn) she draws up tall and her flames lean back
function drawWillQueen(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const tall = warn ? 1.1 : 1;
  const cy = -h * 0.18;
  softGlow(ctx, 0, cy - h * 0.3, w * 0.95, WISP, live ? 0.35 : 0.08);
  // the veil, trailing behind her
  ctx.fillStyle = 'rgba(214,226,246,0.28)';
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, cy - h * 0.6 * tall);
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    ctx.lineTo(-w * 0.2 - k * w * 0.55, cy - h * (0.55 - k * 0.5) + Math.sin(t * 2 + k * 4 + seed) * 8);
  }
  ctx.lineTo(-w * 0.05, cy + 6);
  ctx.closePath();
  ctx.fill();
  const sil = () => flame(ctx, 0, cy, w * 0.32, h * 0.78 * tall, t * 0.6, seed);
  ctx.fillStyle = live ? '#eef4ff' : '#c8ccd6';
  sil();
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,180,220,0.7)';
  ctx.lineWidth = 2;
  sil();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,226,168,0.8)'; // the warm core
  flame(ctx, 0, cy - 4, w * 0.14, h * 0.38, t * 0.8, seed + 2);
  ctx.fill();
  // the crown: small flames round her head
  const hy = cy - h * 0.5 * tall;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * 0.85 + (i / 4) * Math.PI * 0.7, fx = Math.cos(a) * w * 0.2, fy = hy + Math.sin(a) * h * 0.1 - 6;
    ctx.fillStyle = i % 2 ? '#cfe0ff' : '#ffffff';
    flame(ctx, fx, fy, 4.5, 16 + (i % 2) * 5, t, seed + i);
    ctx.fill();
  }
  // her eyes: long and calm and dark
  if (live) {
    ctx.fillStyle = '#2a3048';
    for (const dx of [-9, 9]) ellipse(ctx, w * 0.06 + dx, hy + h * 0.14, 3.2, 6);
  } else eyes(ctx, w * 0.06, hy + h * 0.14, 9, t, seed, { dying, size: 1.2, col: '#2a3048' });
  // her court of little lights
  for (let i = 0; i < 6; i++) {
    const a = t * 0.9 + (i / 6) * TAU;
    const lx = Math.cos(a) * w * 0.55, ly = cy - h * 0.3 + Math.sin(a) * h * 0.2;
    ctx.fillStyle = `rgba(255,236,200,${live ? 0.85 : 0.3})`;
    circle(ctx, lx, ly, 3);
  }
  return sil;
}

export const CAUSEWAY_MOB_ART = { lamp_moth: drawLampMoth, drifting_light: drawDriftingLight, causeway_guard: drawCausewayGuard, mire_toad: drawMireToad, will_queen: drawWillQueen };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
function reedGrip(ctx, L, col = '#8a7a50') {
  ctx.fillStyle = '#2a2018';
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.22, 5.2, L * 0.22, 2);
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -L * 0.2; y < 0; y += 3.2) {
    ctx.moveTo(-2.6, y);
    ctx.lineTo(2.6, y + 1.6);
  }
  ctx.stroke();
}
// Queenlight: a long slim pale blade, cold white, a wisp of flame running up its edge; a crossguard of white wood
function drawQueenlight(ctx, L, glow) {
  ctx.save();
  ctx.shadowColor = `rgba(${WISP},${glow ? 0.95 : 0.6})`;
  ctx.shadowBlur = glow ? 14 : 8;
  const g = ctx.createLinearGradient(-5, 0, 5, 0);
  g.addColorStop(0, '#c8d6ec');
  g.addColorStop(0.5, '#ffffff');
  g.addColorStop(1, '#b0c0dc');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-3.4, -L * 0.24);
  ctx.lineTo(-2.4, -L * 0.92);
  ctx.lineTo(0, -L * 1.03);
  ctx.lineTo(2.4, -L * 0.92);
  ctx.lineTo(3.4, -L * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(220,236,255,0.7)'; // the flame along its edge
  for (let i = 0; i < 5; i++) {
    const y = -L * (0.32 + i * 0.13);
    ctx.beginPath();
    ctx.moveTo(3.2, y);
    ctx.quadraticCurveTo(6.5, y - 4, 3, y - 9);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#e8e0d0';
  ctx.fillRect(-7, -L * 0.26, 14, 3.4);
  reedGrip(ctx, L, '#c8c0b0');
  ctx.restore();
}
// Grandfather's Promise: a broad blade of black bog-iron, wide as a grin, a toadstone set in the pommel
function drawPromiseBlade(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(200,220,130,0.85)';
    ctx.shadowBlur = 12;
  }
  const g = ctx.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, '#22261e');
  g.addColorStop(0.5, '#4a5040');
  g.addColorStop(1, '#1a1e16');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-6, -L * 0.24);
  ctx.quadraticCurveTo(-8, -L * 0.7, -4, -L * 0.94);
  ctx.quadraticCurveTo(0, -L * 1.04, 4, -L * 0.94);
  ctx.quadraticCurveTo(8, -L * 0.7, 6, -L * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(200,210,180,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-5.4, -L * 0.3);
  ctx.quadraticCurveTo(-7, -L * 0.7, -3.6, -L * 0.92);
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,138,78,0.4)'; // a bloom of green on the iron
  ellipse(ctx, 1, -L * 0.5, 3, 6);
  ctx.fillStyle = TOAD_D;
  ctx.fillRect(-9, -L * 0.26, 18, 4);
  reedGrip(ctx, L);
  ctx.fillStyle = '#6a7a46'; // the toadstone pommel
  circle(ctx, 0, 3, 3.6);
  ctx.fillStyle = 'rgba(232,240,200,0.5)';
  circle(ctx, -1, 2, 1.2);
  ctx.restore();
}
export const CAUSEWAY_SWORDS = { queenlight: drawQueenlight, promise_blade: drawPromiseBlade };
export const CAUSEWAY_SWORD_LEN = { queenlight: 66, promise_blade: 68 };

// ——— helmets: (ctx, w, h) on a slime of that size, feet at the origin ———
// The Causeway Helm: a tall cone of grey woven reed over a bog-iron cap, a lantern hook on the crest
function drawCausewayHelm(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.5;
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.moveTo(-rx * 0.9, by + 6);
  ctx.quadraticCurveTo(0, by - 6, rx * 0.9, by + 6);
  ctx.lineTo(rx * 0.8, by + 10);
  ctx.quadraticCurveTo(0, by + 2, -rx * 0.8, by + 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = REED_L;
  ctx.strokeStyle = REED_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.8, by + 2);
  ctx.lineTo(0, by - h * 0.62);
  ctx.lineTo(rx * 0.8, by + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(106,90,56,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 5; i++) {
    const k = i / 5;
    ctx.moveTo(-rx * 0.8 * (1 - k), by + 2 - h * 0.62 * k);
    ctx.lineTo(rx * 0.8 * (1 - k), by + 2 - h * 0.62 * k);
  }
  ctx.stroke();
  ctx.strokeStyle = '#2e2a3a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, by - h * 0.62);
  ctx.lineTo(0, by - h * 0.7);
  ctx.lineTo(-8, by - h * 0.7);
  ctx.stroke();
}
// The Will-Queen's Veil: a ring of small cold flames, and a veil of pale light trailing off behind
function drawWillqueenVeil(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.46;
  ctx.fillStyle = 'rgba(214,226,246,0.35)';
  ctx.beginPath();
  ctx.moveTo(-rx * 0.6, by);
  ctx.quadraticCurveTo(-rx * 1.3, by + h * 0.2, -rx * 1.5, by + h * 0.5);
  ctx.lineTo(-rx * 0.9, by + h * 0.4);
  ctx.quadraticCurveTo(-rx * 0.6, by + h * 0.2, -rx * 0.2, by + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e4ecf8';
  ctx.strokeStyle = 'rgba(150,180,220,0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, by, rx * 0.8, 4, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const x = -rx * 0.6 + (i / 4) * rx * 1.2;
    ctx.fillStyle = `rgba(${WISP},0.35)`;
    circle(ctx, x, by - 8, 7);
    ctx.fillStyle = i % 2 ? '#cfe0ff' : '#ffffff';
    flame(ctx, x, by - 1, 3.4, 12 + (i === 2 ? 6 : 0), 0, i);
    ctx.fill();
  }
}
// Grandfather's Cap: an old lily pad gone leathery and green-gold, its notch at the back, a flower open on it
function drawGrandfatherCap(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.58;
  ctx.fillStyle = '#5e7a44';
  ctx.strokeStyle = '#3a4a26';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, by, rx, h * 0.12, 0, -Math.PI * 0.92, Math.PI * 0.86);
  ctx.lineTo(0, by);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,190,110,0.5)'; // its veins, gone gold
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.8 + i * 0.5;
    ctx.moveTo(0, by);
    ctx.lineTo(Math.cos(a) * rx * 0.9, by + Math.sin(a) * h * 0.1);
  }
  ctx.stroke();
  ctx.fillStyle = '#f2d8ec'; // the flower
  for (let i = 0; i < 6; i++) ellipse(ctx, rx * 0.2 + Math.cos(i * 1.05) * 5, by - 6 + Math.sin(i * 1.05) * 2.4, 4.4, 2.4, i * 1.05);
  ctx.fillStyle = '#ffe28a';
  circle(ctx, rx * 0.2, by - 7, 2.2);
}
export const CAUSEWAY_HELMETS = { causeway_helm: drawCausewayHelm, willqueen_veil: drawWillqueenVeil, grandfather_cap: drawGrandfatherCap };

// ——— materials' icons (centred on the origin, about 28 px across) ———
function iconMothSilk(ctx) {
  ctx.strokeStyle = SILK;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 - i * 2, 6 - i, 0.4, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = SILK_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.quadraticCurveTo(12, 10, 6, 13);
  ctx.stroke();
}
function iconStrayFlame(ctx) {
  ctx.strokeStyle = 'rgba(180,200,220,0.9)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-6, 12);
  ctx.quadraticCurveTo(-10, -2, -2, -12);
  ctx.moveTo(6, 12);
  ctx.quadraticCurveTo(10, -2, 2, -12);
  ctx.stroke();
  softGlow(ctx, 0, 2, 12, LAMP, 0.5);
  ctx.fillStyle = '#ffe2a8';
  flame(ctx, 1, 8, 4, 14, 0, 0.5);
  ctx.fill();
}
function iconGuardReed(ctx) {
  ctx.strokeStyle = REED;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = -3; i <= 3; i++) {
    ctx.moveTo(i * 3, 12);
    ctx.lineTo(i * 2.4 + 2, -12);
  }
  ctx.stroke();
  ctx.strokeStyle = REED_D;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-11, 1);
  ctx.lineTo(11, -1);
  ctx.stroke();
}
function iconToadstone(ctx) {
  ctx.fillStyle = '#6a7a46';
  ctx.strokeStyle = TOAD_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 1, 11, 9, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(58,70,38,0.7)';
  circle(ctx, -4, 3, 2.4);
  circle(ctx, 4, -1, 1.8);
  ctx.fillStyle = 'rgba(232,240,200,0.45)';
  ellipse(ctx, -4, -4, 3, 2, -0.4);
}
function iconQueenGlow(ctx) {
  ctx.fillStyle = 'rgba(200,214,232,0.45)';
  ctx.beginPath();
  ctx.roundRect(-9, -10, 18, 22, 5);
  ctx.fill();
  ctx.fillStyle = '#6a6278';
  ctx.fillRect(-7, -14, 14, 4);
  softGlow(ctx, 0, 2, 11, WISP, 0.6);
  ctx.fillStyle = '#ffffff';
  flame(ctx, 0, 8, 3.6, 13, 0, 1);
  ctx.fill();
}
function iconMirePearl(ctx) {
  softGlow(ctx, 0, 0, 13, '200,220,150', 0.4);
  ctx.fillStyle = '#9ab07a';
  circle(ctx, 0, 0, 9);
  ctx.fillStyle = 'rgba(232,244,214,0.55)';
  ellipse(ctx, -3, -3, 3.4, 2.4, -0.5);
  ctx.strokeStyle = 'rgba(58,70,38,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, TAU);
  ctx.stroke();
}
export const CAUSEWAY_ICONS = { moth_silk: iconMothSilk, stray_flame: iconStrayFlame, guard_reed: iconGuardReed, toadstone: iconToadstone, queen_glow: iconQueenGlow, mire_pearl: iconMirePearl };
