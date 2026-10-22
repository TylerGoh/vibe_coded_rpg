// Docs: docs/places/wreck.md, docs/combat/stages.md
// Wreck Cave's art that isn't the room itself (src/wreck.js): its creatures (barnacle crab, drowned lamp,
// moray eel, bilge rat and the Drowned Bosun, a field boss; WRECK_MOB_ART, called by drawMob in
// src/field.js), the gear dropped down here (WRECK_SWORDS, WRECK_SWORD_LEN, WRECK_HELMETS, drawn by
// drawSword / drawHelmet in src/field.js) and its materials' icons (WRECK_ICONS).
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
function face(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, cross = false, sleepy = false } = {}) {
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
// a barnacle: a little white volcano with a dark slit on top
function barnacle(ctx, x, y, s) {
  ctx.fillStyle = '#eee8dc';
  ctx.strokeStyle = '#9a9286';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x - s * 0.45, y - s * 1.1);
  ctx.lineTo(x + s * 0.45, y - s * 1.1);
  ctx.lineTo(x + s, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5a5248';
  ellipse(ctx, x, y - s * 1.08, s * 0.32, s * 0.14);
}

// Barnacle Crab: a squat slate-blue crab under a crusty shell grown over with barnacles, one big claw held
// in front (its shell blocks hits from the front). m.warn: rears up, claw high · m.charging: lunges, claw first.
function drawBarnacleCrab(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, lunge = !!m.charging && live;
  const cy = -h * 0.45, rx = w * 0.46, ry = h * 0.42;
  // legs, scuttling
  ctx.strokeStyle = '#3e5a72';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const k = Math.sin(t * (m.walking ? 14 : 2) + i * 2 + seed) * 3;
    for (const s of [-1, 1]) {
      const x0 = s * rx * (0.35 + i * 0.18);
      ctx.beginPath();
      ctx.moveTo(x0, cy + ry * 0.3);
      ctx.lineTo(x0 + s * 8, cy + ry * 0.7 + k * s * 0.5);
      ctx.lineTo(x0 + s * 11, -1);
      ctx.stroke();
    }
  }
  ctx.save();
  ctx.rotate(warn ? -0.12 : lunge ? 0.08 : 0);
  // the shell
  const body = () => {
    ctx.moveTo(-rx, cy + ry * 0.4);
    ctx.bezierCurveTo(-rx * 1.05, cy - ry * 1.3, rx * 1.05, cy - ry * 1.3, rx, cy + ry * 0.4);
    ctx.quadraticCurveTo(0, cy + ry * 0.85, -rx, cy + ry * 0.4);
  };
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, '#7f9cb8');
  g.addColorStop(1, '#4e6a86');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2e445c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // barnacles crusted on top, weed hanging off the back
  const bs = Math.max(3, w * 0.07);
  for (const [fx, fy, k] of [[-0.55, -0.55, 1], [-0.2, -0.85, 1.2], [0.15, -0.8, 0.9], [-0.05, -0.45, 0.8], [0.45, -0.5, 1], [-0.75, -0.15, 0.7]]) barnacle(ctx, rx * fx, cy + ry * fy, bs * k);
  ctx.strokeStyle = '#4f8a5a';
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 3; i++) {
    const x = -rx * (0.65 + i * 0.12), sw = Math.sin(t * 2 + i + seed) * 3;
    ctx.beginPath();
    ctx.moveTo(x, cy - ry * 0.2);
    ctx.quadraticCurveTo(x - 4 + sw, cy + ry * 0.3, x - 2 + sw, cy + ry * 0.75);
    ctx.stroke();
  }
  // eyes on stalks
  for (const d of [-1, 1]) {
    const ex = rx * 0.45 + d * 5, ey = cy - ry * 1.05;
    ctx.strokeStyle = '#3e5a72';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex, cy - ry * 0.6);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    circle(ctx, ex, ey, 3.6);
    ctx.fillStyle = INKC;
    if (live) circle(ctx, ex + 1, ey, 2);
    else {
      ctx.strokeStyle = INKC;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(ex - 2, ey - 2); ctx.lineTo(ex + 2, ey + 2);
      ctx.moveTo(ex + 2, ey - 2); ctx.lineTo(ex - 2, ey + 2);
      ctx.stroke();
    }
  }
  if (warn) {
    ctx.strokeStyle = INKC;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(rx * 0.3, cy - ry * 1.38);
    ctx.lineTo(rx * 0.42, cy - ry * 1.28);
    ctx.moveTo(rx * 0.72, cy - ry * 1.38);
    ctx.lineTo(rx * 0.58, cy - ry * 1.28);
    ctx.stroke();
  }
  blush(ctx, rx * 0.62, cy - ry * 0.1, 3.4);
  ctx.restore();
  // the big claw, in front
  const [clx, cly, rot] = warn ? [rx * 0.95, cy - ry * 1.2, -1.1] : lunge ? [rx * 1.35, cy + ry * 0.05, 0.1] : [rx * 1.05, cy + ry * 0.1, -0.35];
  ctx.save();
  ctx.translate(clx, cly);
  ctx.rotate(rot);
  ctx.fillStyle = '#e08a6a';
  ctx.strokeStyle = '#8a4a38';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.2, h * 0.17, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  const snap = warn ? 0.5 : Math.abs(Math.sin(t * 3 + seed)) * 0.25;
  ctx.beginPath(); // the pincer
  ctx.moveTo(w * 0.15, -2);
  ctx.quadraticCurveTo(w * 0.3, -h * 0.2 - snap * 8, w * 0.34, -h * 0.05);
  ctx.lineTo(w * 0.18, 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  barnacle(ctx, -w * 0.05, -h * 0.12, bs * 0.7);
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Drowned Lamp: a ship's lantern drifting low over the water, its brass green with age and its glass gone
// sea-green, with a soft little flame-face inside and weed trailing from its foot. m.special: it's gone dark
// (can't be hurt) and is about to flare.
function drawDrownedLamp(ctx, w, h, t, seed, m, dying) {
  const dark = !!m.special && dying < 0.05;
  const bob = Math.sin(t * 2 + seed) * 3;
  const cy = -h * 0.5 + bob, gw = w * 0.36, gh = h * 0.32;
  ctx.save();
  if (dark) ctx.globalAlpha *= 0.4 + 0.15 * Math.sin(t * 18);
  if (!dark && dying < 0.05) halo(ctx, 0, cy, w * 1.1, '170,255,200', 0.32 + 0.1 * Math.sin(t * 3 + seed));
  // weed trailing below
  ctx.strokeStyle = '#4f8a5a';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const sw = Math.sin(t * 2.5 + i + seed) * 4;
    ctx.beginPath();
    ctx.moveTo(i * 5, cy + gh + 6);
    ctx.quadraticCurveTo(i * 7 + sw, cy + gh + 16, i * 5 - sw, cy + gh + 26);
    ctx.stroke();
  }
  // the base
  ctx.fillStyle = '#7a8a5a';
  ctx.strokeStyle = '#3e4a2c';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-gw * 1.15, cy + gh - 2, gw * 2.3, 8, 3);
  ctx.fill();
  ctx.stroke();
  // the glass
  const glass = () => {
    ctx.moveTo(-gw, cy + gh);
    ctx.bezierCurveTo(-gw * 1.3, cy, -gw * 1.1, cy - gh, -gw * 0.7, cy - gh);
    ctx.lineTo(gw * 0.7, cy - gh);
    ctx.bezierCurveTo(gw * 1.1, cy - gh, gw * 1.3, cy, gw, cy + gh);
    ctx.closePath();
  };
  ctx.fillStyle = dark ? 'rgba(60,90,90,0.8)' : 'rgba(150,230,200,0.75)';
  ctx.beginPath();
  glass();
  ctx.fill();
  // the little flame-face inside
  if (!dark) {
    const fl = Math.sin(t * 9 + seed) * 1.5;
    ctx.fillStyle = '#fff6c8';
    ctx.beginPath();
    ctx.moveTo(0, cy - gh * 0.75 + fl);
    ctx.quadraticCurveTo(gw * 0.7, cy, 0, cy + gh * 0.7);
    ctx.quadraticCurveTo(-gw * 0.7, cy, 0, cy - gh * 0.75 + fl);
    ctx.fill();
    face(ctx, gw * 0.08, cy + 1, gw * 0.24, t, seed, { dying, size: 0.6 });
  }
  // the cage bars
  ctx.strokeStyle = '#6a7a4a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  glass();
  ctx.stroke();
  for (const x of [-gw * 0.45, gw * 0.45]) {
    ctx.beginPath();
    ctx.moveTo(x * 1.2, cy + gh);
    ctx.lineTo(x, cy - gh);
    ctx.stroke();
  }
  // the cap and the ring handle
  ctx.fillStyle = '#8a9a62';
  ctx.strokeStyle = '#3e4a2c';
  ctx.beginPath();
  ctx.moveTo(-gw * 0.85, cy - gh);
  ctx.quadraticCurveTo(0, cy - gh - 14, gw * 0.85, cy - gh);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, cy - gh - 14, 5, 0, TAU);
  ctx.stroke();
  // verdigris blotches
  ctx.fillStyle = 'rgba(110,200,170,0.6)';
  ellipse(ctx, -gw * 0.5, cy + gh + 1, 3, 2);
  ellipse(ctx, gw * 0.3, cy - gh - 4, 3, 1.6);
  ctx.restore();
  return () => {
    ctx.beginPath();
    glass();
  };
}

// Moray Eel: a long green eel with gold freckles lying in a lazy S along the floor, its head reared up at
// the front, mouth opening and shutting. m.warn: head drawn back, mouth wide, water gathering in it.
function drawMorayEel(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05;
  const L = w * 0.5, th = h * 0.32;
  const wig = (x) => Math.sin(x * 0.12 - t * 4 + seed) * 4;
  // the body: a thick tapering S along the floor, rising to the head
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const k = i / 12, x = -L * 1.1 + k * L * 1.75;
    const y = -th - wig(x) * (1 - k) - (k > 0.65 ? (k - 0.65) * h * 1.6 : 0);
    pts.push([x, y, th * (0.45 + 0.6 * Math.sin(k * Math.PI * 0.9))]);
  }
  const hx = pts[12][0] + 6 - (warn ? 6 : 0), hy = pts[12][1] - 6;
  const body = () => {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y, r] of pts) ctx.lineTo(x, y - r);
    ctx.lineTo(hx + 6, hy - 6);
    for (let i = 12; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + pts[i][2]);
    ctx.closePath();
  };
  // the fin along its back
  ctx.fillStyle = '#9ac25a';
  ctx.strokeStyle = '#4a6a2a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(pts[1][0], pts[1][1] - pts[1][2]);
  for (let i = 1; i <= 10; i++) ctx.lineTo(pts[i][0], pts[i][1] - pts[i][2] - 6 - Math.sin(t * 6 + i) * 1.5);
  ctx.lineTo(pts[10][0], pts[10][1] - pts[10][2]);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#6aa04a');
  g.addColorStop(1, '#3e6e34');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2a4a22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // gold freckles and a pale belly line
  ctx.fillStyle = 'rgba(240,220,120,0.85)';
  for (let i = 1; i < 12; i++) {
    const [x, y, r] = pts[i];
    circle(ctx, x - 2, y - r * 0.4, 1.6);
    circle(ctx, x + 3, y + r * 0.1, 1.2);
  }
  // the head
  ctx.fillStyle = '#6aa04a';
  ctx.strokeStyle = '#2a4a22';
  ctx.beginPath();
  ctx.ellipse(hx, hy, h * 0.3, h * 0.24, -0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  const gape = warn ? 1 : Math.max(0, Math.sin(t * 1.6 + seed)) * 0.5;
  ctx.fillStyle = '#c8546a';
  ctx.beginPath(); // the mouth
  ctx.moveTo(hx + h * 0.05, hy + 2);
  ctx.lineTo(hx + h * 0.34, hy - 1 - gape * 5);
  ctx.lineTo(hx + h * 0.34, hy + 4 + gape * 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff'; // little teeth
  for (let i = 0; i < 3; i++) {
    const x = hx + h * (0.14 + i * 0.07);
    ctx.beginPath();
    ctx.moveTo(x - 1.5, hy - gape * 2);
    ctx.lineTo(x, hy + 2 - gape * 2);
    ctx.lineTo(x + 1.5, hy - gape * 2);
    ctx.fill();
  }
  if (warn) {
    ctx.fillStyle = 'rgba(190,235,255,0.85)';
    circle(ctx, hx + h * 0.3, hy + 1, 3 + Math.sin(t * 20) * 1);
  }
  face(ctx, hx - h * 0.02, hy - h * 0.1, 0.1, t, seed, { dying, size: 0.8, cross: warn });
  return () => {
    ctx.beginPath();
    body();
    ctx.moveTo(hx + h * 0.3, hy);
    ctx.ellipse(hx, hy, h * 0.3, h * 0.24, -0.2, 0, TAU);
  };
}

// Bilge Rat: a scruffy grey rat with pink ears, a long bald tail and a tiny red neckerchief, a brass
// button tucked in it like a medal. m.special: it has scurried off (about to pop up behind you), so it's
// only a puff of dust · m.warn: whiskers bristling, teeth out.
function drawBilgeRat(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05, warn = !!m.warn && !gone && dying < 0.05;
  if (gone) {
    ctx.fillStyle = 'rgba(200,190,180,0.5)';
    for (let i = 0; i < 4; i++) circle(ctx, Math.sin(t * 7 + i * 2) * 10, -8 - i * 4, 7 - i);
    return () => {
      ctx.beginPath();
      ctx.arc(0, -10, 8, 0, TAU);
    };
  }
  const cy = -h * 0.42, rx = w * 0.42, ry = h * 0.38;
  // the tail
  ctx.strokeStyle = '#e0a0a8';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const sw = Math.sin(t * 3 + seed) * 6;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.9, cy + ry * 0.3);
  ctx.bezierCurveTo(-rx * 1.6, cy + ry * 0.9, -rx * 2, cy - ry * 0.2 + sw, -rx * 2.3, cy - ry * 0.6 + sw);
  ctx.stroke();
  // feet
  ctx.fillStyle = '#e0a0a8';
  const step = m.walking ? Math.sin(t * 16) * 3 : 0;
  ellipse(ctx, -rx * 0.4 + step, -2, 5, 3);
  ellipse(ctx, rx * 0.4 - step, -2, 5, 3);
  // the body
  const body = () => ctx.ellipse(0, cy, rx, ry, 0, 0, TAU);
  ctx.fillStyle = '#9a9298';
  ctx.strokeStyle = '#5a5258';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // scruffy fur tufts
  ctx.strokeStyle = '#7a7278';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    const x = -rx * 0.6 + i * rx * 0.3;
    ctx.beginPath();
    ctx.moveTo(x, cy - ry * 0.85);
    ctx.lineTo(x - 2, cy - ry * 1.05);
    ctx.stroke();
  }
  ctx.fillStyle = '#c8c0c4';
  ellipse(ctx, rx * 0.25, cy + ry * 0.35, rx * 0.5, ry * 0.45);
  // the snout and ears (at the front)
  const sx = rx * 0.95, sy = cy - ry * 0.05;
  ctx.fillStyle = '#9a9298';
  ctx.strokeStyle = '#5a5258';
  ctx.beginPath();
  ctx.moveTo(sx - 6, sy - ry * 0.55);
  ctx.quadraticCurveTo(sx + rx * 0.6, sy - 2, sx + rx * 0.62, sy + 2);
  ctx.quadraticCurveTo(sx + rx * 0.3, sy + ry * 0.45, sx - 6, sy + ry * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e07888';
  circle(ctx, sx + rx * 0.6, sy + 1, 2.4);
  for (const d of [0, 1]) {
    ctx.fillStyle = '#9a9298';
    ctx.strokeStyle = '#5a5258';
    circle(ctx, rx * (0.35 + d * 0.3), cy - ry * 0.95, ry * 0.42);
    ctx.stroke();
    ctx.fillStyle = '#f0b0bc';
    circle(ctx, rx * (0.35 + d * 0.3), cy - ry * 0.95, ry * 0.26);
  }
  // whiskers
  ctx.strokeStyle = 'rgba(60,50,60,0.7)';
  ctx.lineWidth = 1;
  for (const a of [-0.3, 0, 0.3]) {
    ctx.beginPath();
    ctx.moveTo(sx + rx * 0.45, sy + 1);
    ctx.lineTo(sx + rx * 0.45 + Math.cos(a) * (warn ? 16 : 12), sy + 1 + Math.sin(a) * (warn ? 9 : 6));
    ctx.stroke();
  }
  if (warn) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + rx * 0.4, sy + 3, 2, 4);
    ctx.fillRect(sx + rx * 0.4 + 2.5, sy + 3, 2, 4);
  }
  face(ctx, rx * 0.72, cy - ry * 0.3, 0.1, t, seed, { dying, size: 0.8, cross: warn });
  // the neckerchief and its brass button medal
  ctx.fillStyle = '#d8584a';
  ctx.beginPath();
  ctx.moveTo(rx * 0.2, cy + ry * 0.05);
  ctx.quadraticCurveTo(rx * 0.55, cy + ry * 0.4, rx * 0.9, cy + ry * 0.1);
  ctx.lineTo(rx * 0.55, cy + ry * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8c060';
  ctx.strokeStyle = '#9a7a30';
  ctx.lineWidth = 1;
  circle(ctx, rx * 0.55, cy + ry * 0.45, 2.8);
  ctx.stroke();
  return () => {
    ctx.beginPath();
    body();
  };
}

// The Drowned Bosun (a field boss): a great grey-lilac octopus who has lived in the wreck so long he wears
// the bosun's navy coat (brass buttons, one sleeve per arm he could fit) and a knitted cap, a brass whistle
// on a cord. Sleepy and grand rather than wicked. m.warn: he puffs up, about to squirt ink.
function drawDrownedBosun(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, mad = !!m.target && live;
  const puff = warn ? 1.08 : 1;
  const hx = 0, hy = -h * 0.66, hr = h * 0.3 * puff;
  // tentacles: eight curling arms spread on the floor, suckers underneath
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const s = i < 4 ? -1 : 1, k = (i % 4) / 3;
    const x0 = s * w * (0.06 + k * 0.14), x1 = s * w * (0.2 + k * 0.32);
    const curl = Math.sin(t * 1.8 + i * 1.3 + seed) * 6;
    ctx.strokeStyle = '#8a7a9c';
    ctx.lineWidth = 13 - k * 4;
    ctx.beginPath();
    ctx.moveTo(x0, -h * 0.32);
    ctx.quadraticCurveTo(x0 + s * 6, -h * 0.05, x1, -6 + curl * 0.3);
    ctx.quadraticCurveTo(x1 + s * 16, -14 + curl, x1 + s * 6, -22 + curl);
    ctx.stroke();
    ctx.strokeStyle = '#b0a0c0';
    ctx.lineWidth = 4 - k;
    ctx.stroke();
    ctx.fillStyle = '#f0d8e0'; // suckers
    for (let j = 0; j < 3; j++) circle(ctx, x0 + (x1 - x0) * (0.5 + j * 0.2), -5 + curl * 0.1, 2);
  }
  // the coat: a navy body with a collar and brass buttons
  const coat = () => {
    ctx.moveTo(-w * 0.26, -h * 0.25);
    ctx.quadraticCurveTo(-w * 0.3, -h * 0.5, -w * 0.18, -h * 0.52);
    ctx.lineTo(w * 0.18, -h * 0.52);
    ctx.quadraticCurveTo(w * 0.3, -h * 0.5, w * 0.26, -h * 0.25);
    ctx.quadraticCurveTo(0, -h * 0.15, -w * 0.26, -h * 0.25);
  };
  ctx.fillStyle = '#34507a';
  ctx.strokeStyle = '#1e2e48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  coat();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4a6a98';
  ctx.beginPath(); // the collar
  ctx.moveTo(-w * 0.18, -h * 0.52);
  ctx.lineTo(-w * 0.04, -h * 0.4);
  ctx.lineTo(w * 0.04, -h * 0.4);
  ctx.lineTo(w * 0.18, -h * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8c060';
  ctx.strokeStyle = '#9a7a30';
  ctx.lineWidth = 1;
  for (const [x, y] of [[-0.07, -0.36], [-0.07, -0.28], [0.07, -0.36], [0.07, -0.28]]) {
    circle(ctx, w * x, h * y, 3);
    ctx.stroke();
  }
  // the head (mantle)
  const head = () => {
    ctx.moveTo(hx - hr * 1.05, hy + hr * 0.6);
    ctx.bezierCurveTo(hx - hr * 1.3, hy - hr * 1.2, hx + hr * 1.3, hy - hr * 1.2, hx + hr * 1.05, hy + hr * 0.6);
    ctx.quadraticCurveTo(hx, hy + hr * 1.05, hx - hr * 1.05, hy + hr * 0.6);
  };
  const hg = ctx.createLinearGradient(0, hy - hr, 0, hy + hr);
  hg.addColorStop(0, '#b8a8cc');
  hg.addColorStop(1, '#8a7a9c');
  ctx.fillStyle = hg;
  ctx.strokeStyle = '#5a4a6c';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  head();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ellipse(ctx, hx - hr * 0.4, hy - hr * 0.5, hr * 0.3, hr * 0.15, -0.5);
  // freckles
  ctx.fillStyle = 'rgba(110,90,130,0.5)';
  for (const [x, y] of [[-0.6, 0.1], [-0.4, 0.3], [0.55, 0.2], [0.7, -0.1]]) circle(ctx, hx + hr * x, hy + hr * y, 2);
  // the knitted cap, rolled brim, a little crooked
  ctx.save();
  ctx.translate(hx, hy - hr * 0.65);
  ctx.rotate(-0.12);
  ctx.fillStyle = '#2e4670';
  ctx.strokeStyle = '#18263e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-hr * 0.8, 4);
  ctx.quadraticCurveTo(-hr * 0.75, -hr * 0.7, 0, -hr * 0.72);
  ctx.quadraticCurveTo(hr * 0.75, -hr * 0.7, hr * 0.8, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * hr * 0.2, 0);
    ctx.lineTo(i * hr * 0.17, -hr * 0.6);
    ctx.stroke();
  }
  ctx.fillStyle = '#3e5a88';
  ctx.strokeStyle = '#18263e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-hr * 0.85, -4, hr * 1.7, 11, 5);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // the face: big heavy-lidded eyes, a little moustache of whiskery frills
  const fy = hy + hr * 0.15;
  if (live) {
    for (const d of [-1, 1]) {
      const ex = hx + d * hr * 0.42;
      ctx.fillStyle = '#fff8e8';
      ellipse(ctx, ex, fy, hr * 0.2, hr * 0.22);
      ctx.fillStyle = INKC;
      ellipse(ctx, ex + hr * 0.05, fy + hr * 0.04, hr * 0.1, hr * 0.13);
      // the heavy lid (lower when he's calm)
      ctx.fillStyle = '#9a8aac';
      ctx.beginPath();
      ctx.ellipse(ex, fy, hr * 0.22, hr * 0.24, 0, Math.PI, 0);
      ctx.lineTo(ex + hr * 0.22, fy - hr * (mad ? 0.14 : 0.02));
      ctx.lineTo(ex - hr * 0.22, fy - hr * (mad ? 0.14 : 0.02));
      ctx.fill();
      if (mad) {
        ctx.strokeStyle = '#5a4a6c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ex - d * hr * 0.24, fy - hr * 0.34);
        ctx.lineTo(ex + d * hr * 0.12, fy - hr * 0.24);
        ctx.stroke();
      }
    }
  } else face(ctx, hx, fy, hr * 0.4, t, seed, { dying, size: 1.4 });
  blush(ctx, hx - hr * 0.72, fy + hr * 0.35, 6);
  blush(ctx, hx + hr * 0.72, fy + hr * 0.35, 6);
  // the siphon (puffed out when he's about to squirt) and the whistle on its cord
  ctx.fillStyle = '#9a8aac';
  ctx.strokeStyle = '#5a4a6c';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(hx + hr * 0.95, fy + hr * 0.5, warn ? 9 : 6, warn ? 6 : 4, 0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (warn) {
    ctx.fillStyle = '#2a1e38';
    circle(ctx, hx + hr * 1.08, fy + hr * 0.55, 3);
  }
  ctx.strokeStyle = '#d8d0c0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w * 0.12, -h * 0.5);
  ctx.quadraticCurveTo(0, -h * 0.34, w * 0.1, -h * 0.47);
  ctx.stroke();
  ctx.fillStyle = '#e8c060';
  ctx.strokeStyle = '#9a7a30';
  ctx.beginPath();
  ctx.roundRect(-3, -h * 0.4, 12, 5, 2);
  ctx.fill();
  ctx.stroke();
  return () => {
    ctx.beginPath();
    head();
    coat();
  };
}

export const WRECK_MOB_ART = {
  barnacle_crab: drawBarnacleCrab, drowned_lamp: drawDrownedLamp, moray_eel: drawMorayEel, bilge_rat: drawBilgeRat, drowned_bosun: drawDrownedBosun,
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
// Moray Fang: a long hooked blade like an eel's tooth, sea-green to white at the tip, gold freckles
function drawMorayFang(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-4.5, -5);
    ctx.quadraticCurveTo(-6, -L * 0.6, 2, -L);
    ctx.quadraticCurveTo(0, -L * 0.75, 4.5, -5);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, -L, 0, 0);
  g.addColorStop(0, '#f4fff0');
  g.addColorStop(1, '#6aa070');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2e5a3a';
  ctx.lineWidth = 1.6;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,220,120,0.9)';
  for (let i = 1; i < 5; i++) circle(ctx, -1.5 + (i % 2) * 2, -L * (0.15 + i * 0.12), 1.2);
  ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.4 * glow})`;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-3, -8);
  ctx.quadraticCurveTo(-4.5, -L * 0.55, 1, -L * 0.92);
  ctx.stroke();
  ctx.fillStyle = '#8a7a5a'; // a guard of knotted rope
  ctx.beginPath();
  ctx.roundRect(-8, -5, 16, 4, 2);
  ctx.fill();
  grip(ctx, '#3e6e5a', '#24463a');
  ctx.restore();
}
// Bosun's Boathook: a long oak pole with a brass hook and spike at the top, rope wound round the grip
function drawBoathook(ctx, L, glow) {
  ctx.save();
  ctx.fillStyle = '#a07048';
  ctx.strokeStyle = '#5a3a24';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-2.5, -L * 0.82, 5, L * 0.82, 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,58,36,0.5)'; // wood grain
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.1);
  ctx.lineTo(0.5, -L * 0.75);
  ctx.stroke();
  // the brass head: a spike and a curled hook
  ctx.fillStyle = '#e0b850';
  ctx.strokeStyle = '#8a6a20';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-3, -L * 0.8);
  ctx.lineTo(0, -L);
  ctx.lineTo(3, -L * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#8a6a20';
  ctx.beginPath();
  ctx.moveTo(2, -L * 0.82);
  ctx.quadraticCurveTo(12, -L * 0.82, 11, -L * 0.7);
  ctx.quadraticCurveTo(10, -L * 0.62, 5, -L * 0.66);
  ctx.stroke();
  ctx.strokeStyle = '#e0b850';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = `rgba(255,250,220,${0.4 + 0.5 * glow})`;
  circle(ctx, -1, -L * 0.86, 1.2);
  ctx.fillStyle = '#e0b850'; // a brass collar
  ctx.fillRect(-3.5, -L * 0.8, 7, 3);
  grip(ctx, '#d8c8a0', '#8a7a5a');
  ctx.restore();
}
export const WRECK_SWORDS = { moray_fang: drawMorayFang, bosun_hook: drawBoathook };
export const WRECK_SWORD_LEN = { moray_fang: 56, bosun_hook: 62 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Barnacle Helm: a dented old ship's steel helmet, barnacles crusted over it and a strand of weed
function drawBarnacleHelm(ctx, w, h, t) {
  const by = -h * 0.7, rx = w * 0.5;
  ctx.fillStyle = '#8a98a8';
  ctx.strokeStyle = '#4a5868';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.05, by + 3);
  ctx.bezierCurveTo(-rx * 1.05, by - h * 0.45, rx * 1.05, by - h * 0.45, rx * 1.05, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9aa8b8';
  ctx.beginPath(); // the brim
  ctx.ellipse(0, by + 3, rx * 1.15, 4, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, -rx * 0.4, by - h * 0.22, rx * 0.25, 3, -0.4);
  const s = Math.max(3, w * 0.07);
  for (const [x, y, k] of [[-0.5, -0.12, 1], [0.1, -0.28, 1.2], [0.55, -0.1, 0.9], [-0.15, -0.06, 0.7], [0.35, -0.22, 0.7]]) barnacle(ctx, rx * x, by + h * y, s * k);
  ctx.strokeStyle = '#4f8a5a';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  const sw = Math.sin(t * 2) * 2;
  ctx.beginPath();
  ctx.moveTo(rx * 0.8, by - 2);
  ctx.quadraticCurveTo(rx * 1.05 + sw, by + 8, rx * 0.95 + sw, by + 16);
  ctx.stroke();
}
// Bosun's Cap: a navy knitted watch cap with a rolled brim, and a brass whistle hanging on a cord
function drawBosunCap(ctx, w, h, t) {
  const by = -h * 0.7, rx = w * 0.5;
  ctx.fillStyle = '#2e4670';
  ctx.strokeStyle = '#18263e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.98, by + 2);
  ctx.quadraticCurveTo(-rx * 0.95, by - h * 0.42, 0, by - h * 0.44);
  ctx.quadraticCurveTo(rx * 0.95, by - h * 0.42, rx * 0.98, by + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1.4;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * rx * 0.2, by - 2);
    ctx.lineTo(i * rx * 0.16, by - h * 0.38);
    ctx.stroke();
  }
  ctx.fillStyle = '#3e5a88';
  ctx.strokeStyle = '#18263e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by - 6, rx * 2.04, 11, 5);
  ctx.fill();
  ctx.stroke();
  // the whistle on its cord, swinging by the brim
  const sw = Math.sin(t * 2.4) * 0.15;
  ctx.save();
  ctx.translate(rx * 0.75, by + 4);
  ctx.rotate(sw);
  ctx.strokeStyle = '#d8d0c0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(2, 12);
  ctx.stroke();
  ctx.fillStyle = '#e8c060';
  ctx.strokeStyle = '#9a7a30';
  ctx.beginPath();
  ctx.roundRect(-2, 11, 9, 5, 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
export const WRECK_HELMETS = { barnacle_helm: drawBarnacleHelm, bosun_cap: drawBosunCap };

// ——— materials' icons (40 × 40, centred) ———
function iconBarnacle(ctx) {
  ctx.fillStyle = '#7f8a96';
  ellipse(ctx, 0, 10, 16, 6);
  for (const [x, y, s] of [[-8, 10, 7], [7, 11, 6], [0, 4, 8], [-4, -4, 6], [8, 0, 5]]) barnacle(ctx, x, y, s);
}
function iconLampGlass(ctx) {
  ctx.fillStyle = 'rgba(255,240,170,0.35)';
  circle(ctx, 0, 0, 16);
  ctx.fillStyle = 'rgba(150,230,200,0.85)';
  ctx.strokeStyle = '#3e6a5a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, 14);
  ctx.bezierCurveTo(-15, 2, -9, -10, -5, -14);
  ctx.lineTo(5, -14);
  ctx.bezierCurveTo(9, -10, 15, 2, 9, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, -5, -2, 2, 7);
}
function iconMorayTooth(ctx) {
  ctx.save();
  ctx.rotate(0.5);
  ctx.fillStyle = '#f4f2e6';
  ctx.strokeStyle = '#8a8670';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, 16);
  ctx.quadraticCurveTo(-9, -6, 4, -18);
  ctx.quadraticCurveTo(0, 0, 6, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function iconBrassButton(ctx) {
  ctx.fillStyle = '#e8c060';
  ctx.strokeStyle = '#9a7a30';
  ctx.lineWidth = 2.4;
  circle(ctx, 0, 0, 14);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, TAU);
  ctx.stroke();
  // an apple stamped on it
  ctx.fillStyle = '#b8902e';
  circle(ctx, -2, 1, 4.5);
  circle(ctx, 2, 1, 4.5);
  ctx.fillRect(-0.7, -7, 1.4, 4);
  ellipse(ctx, 3, -5, 3, 1.5, -0.4);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, -6, -6, 3, 1.6, -0.6);
}
function iconInkSac(ctx) {
  ctx.fillStyle = '#3a2a4e';
  ctx.strokeStyle = '#1e1428';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.bezierCurveTo(16, -10, 16, 14, 0, 15);
  ctx.bezierCurveTo(-16, 14, -16, -10, 0, -16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(216,200,240,0.7)';
  ellipse(ctx, -5, -4, 3, 6, -0.3);
  ctx.fillStyle = '#3a2a4e';
  ellipse(ctx, 9, 16, 3, 2);
}
export const WRECK_ICONS = { barnacle: iconBarnacle, lamp_glass: iconLampGlass, moray_tooth: iconMorayTooth, brass_button: iconBrassButton, ink_sac: iconInkSac };
