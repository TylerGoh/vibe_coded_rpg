// Docs: docs/places/buried.md, docs/combat/stages.md, docs/combat/items.md
// The Buried Caravanserai's art that isn't the room itself (src/buried.js; atlas Phase 9, A3): its creatures (husk lizard,
// buried lamplighter, stiff tent, and the Last Drover with his phantom pack-beasts; BURIED_MOB_ART, called by drawMob in
// src/field.js), the gear of the place (the Last Drover's Goad and Hood, the lamplighter's rare Hood: BURIED_SWORDS,
// BURIED_HELMETS; the staff and bow are src/staff-art.js's and src/bow-art.js's) and its materials' icons (BURIED_ICONS).
// Everything dried out under the sand an age ago: dust-brown, faded stripes, old amber light; soft and rounded as ever.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse, clamp } from './util.js';

const INKC = '#2e2218';
const DUST = '#b89a78', DUST_D = '#7a6248', DUST_L = '#d8c0a0';
const STRIPE = ['#a85a3a', '#3e4a7a', '#d8a84a', '#6a7a4a'];
const AMBER = '#e8a040', AMBER_L = '#ffd890';
const BRASS = '#d8a84a', BRASS_D = '#9a7028';
const warnK = (v) => (v === true ? 1 : clamp(+v || 0, 0, 1));

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, col = INKC } = {}) {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 4.2) < 0.14;
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
      ctx.fillStyle = 'rgba(255,240,210,0.9)';
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
  circle(ctx, x, y, r);
}
// a little amber lantern, hung from (x, y): its frame, its light
export function lantern(ctx, x, y, s, t, lit = 1) {
  if (lit > 0) softGlow(ctx, x, y + 6 * s, 22 * s, '255,184,74', 0.35 * lit * (0.85 + 0.15 * Math.sin(t * 5)));
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(x - 1, y - 3 * s, 2, 4 * s);
  ctx.fillStyle = lit > 0 ? AMBER : '#7a5a3a';
  ctx.beginPath();
  ctx.roundRect(x - 4 * s, y, 8 * s, 11 * s, 2 * s);
  ctx.fill();
  ctx.fillStyle = lit > 0 ? AMBER_L : '#9a7a5a';
  ctx.fillRect(x - 2 * s, y + 2 * s, 4 * s, 7 * s);
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(x - 5 * s, y - 1, 10 * s, 2);
  ctx.fillRect(x - 5 * s, y + 10 * s, 10 * s, 2);
}

// Husk lizard: a pack-lizard dried out in the dark where its drover left it, still wearing its pack; dust-coloured,
// leathery, ribs showing, quick and hungry, tail low
function drawHuskLizard(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, run = live && m?.walking;
  const st = run ? Math.sin(t * 16 + seed) : 0;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(-w * 0.04, -h * 0.42, w * 0.34, h * 0.24, 0, 0, TAU);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(30,20,10,0.25)';
  ellipse(ctx, 0, 0, w * 0.42, 4);
  ctx.strokeStyle = DUST_D; // legs, splayed and scrambling
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [lx, ph] of [[-0.22, 1], [0.18, -1]]) {
    ctx.moveTo(w * lx, -h * 0.32);
    ctx.lineTo(w * lx - 6 + st * ph * 8, -h * 0.12);
    ctx.lineTo(w * lx - 2 + st * ph * 10, -1);
  }
  ctx.stroke();
  ctx.strokeStyle = DUST; // the tail, low and long
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, -h * 0.4);
  ctx.quadraticCurveTo(-w * 0.52, -h * 0.26 + st * 2, -w * 0.62, -h * 0.1);
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -h * 0.7, 0, -h * 0.2);
  g.addColorStop(0, DUST_L);
  g.addColorStop(1, DUST_D);
  ctx.fillStyle = g;
  ctx.strokeStyle = DUST_D;
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,98,72,0.6)'; // ribs showing through the dried hide
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const x = -w * 0.18 + i * w * 0.09;
    ctx.moveTo(x, -h * 0.56);
    ctx.quadraticCurveTo(x + 4, -h * 0.42, x, -h * 0.28);
  }
  ctx.stroke();
  // its pack, still strapped on: a bundle in faded stripes
  const col = STRIPE[Math.floor(seed * 9) % STRIPE.length];
  ctx.fillStyle = '#8a7a62';
  ctx.beginPath();
  ctx.roundRect(-w * 0.2, -h * 0.82, w * 0.3, h * 0.24, 6);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(-w * 0.2, -h * 0.74, w * 0.3, h * 0.06);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.08, -h * 0.58);
  ctx.lineTo(-w * 0.1, -h * 0.26);
  ctx.stroke();
  // the head, long and low, jaw open a little
  ctx.fillStyle = DUST;
  ctx.strokeStyle = DUST_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(w * 0.34, -h * 0.46, w * 0.16, h * 0.12, 0.1, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = INKC;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, -h * 0.4);
  ctx.lineTo(w * 0.48, -h * 0.42 + (live ? Math.abs(Math.sin(t * 3 + seed)) * 3 : 0));
  ctx.stroke();
  eyes(ctx, w * 0.36, -h * 0.52, 0, t, seed, { dying, size: 0.8 });
  ctx.restore();
  return body;
}

// Buried lamplighter: one of the old town's lamplighters, gone dry as paper and pale as dust, a long hood and a pole with a
// hook, an amber lamp hung on it; still going its rounds, and lobbing lamps of hot amber at anything that isn't a lamp
// (`lob`: m.warn as it swings the pole back)
function drawBuriedLamplighter(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0;
  const sway = live ? Math.sin(t * 1.4 + seed) * 0.04 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.34, 0);
    ctx.quadraticCurveTo(-w * 0.4, -h * 0.56, -w * 0.12, -h * 0.86);
    ctx.quadraticCurveTo(w * 0.1, -h * 1.02, w * 0.26, -h * 0.74);
    ctx.quadraticCurveTo(w * 0.4, -h * 0.4, w * 0.34, 0);
    ctx.closePath();
  };
  ctx.save();
  ctx.rotate(sway);
  ctx.fillStyle = 'rgba(30,20,10,0.25)';
  ellipse(ctx, 0, 0, w * 0.38, 4);
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#d8c8a8');
  g.addColorStop(1, '#a08a68');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#7a6448';
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  body();
  ctx.clip();
  ctx.strokeStyle = 'rgba(122,100,72,0.4)'; // its robe's dry creases
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.moveTo(-w * 0.2 + i * w * 0.12, -h * 0.5);
    ctx.lineTo(-w * 0.24 + i * w * 0.14, 0);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(60,44,30,0.55)'; // the hood's shadow over its face
  ellipse(ctx, w * 0.06, -h * 0.66, w * 0.24, h * 0.14);
  ctx.restore();
  // two dim amber points for eyes in the hood
  if (live) {
    ctx.fillStyle = `rgba(255,214,140,${0.7 + 0.3 * wk})`;
    circle(ctx, w * 0.02, -h * 0.66, 2);
    circle(ctx, w * 0.14, -h * 0.66, 2);
  } else eyes(ctx, w * 0.08, -h * 0.66, 6, t, seed, { dying, size: 0.7 });
  // the pole, its hook and lamp: swung back on the wind-up
  const pa = -0.35 - wk * 0.9;
  ctx.save();
  ctx.translate(w * 0.24, -h * 0.42);
  ctx.rotate(pa);
  ctx.strokeStyle = '#6a4a30';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(0, -h * 0.7);
  ctx.quadraticCurveTo(10, -h * 0.78, 14, -h * 0.68);
  ctx.stroke();
  lantern(ctx, 14, -h * 0.68, 0.9, t, live ? 1 : 0.2);
  ctx.restore();
  ctx.restore();
  return body;
}

// Stiff tent: a striped tent gone hard as boards under the sand, that gets up on its poles and comes down on you
// (`stomp`: m.warn as it rises up on its poles, m.charging as it jumps); a dark door-flap for a mouth, two eyes in it
function drawStiffTent(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0, jump = !!m?.charging && live;
  const lift = jump ? 14 : wk * 10;
  const col = STRIPE[Math.floor(seed * 13) % STRIPE.length];
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.46, -lift * 0.4);
    ctx.lineTo(-w * 0.06, -h - lift);
    ctx.lineTo(w * 0.06, -h - lift);
    ctx.lineTo(w * 0.46, -lift * 0.4);
    ctx.closePath();
  };
  ctx.save();
  ctx.fillStyle = 'rgba(30,20,10,0.25)';
  ellipse(ctx, 0, 0, w * 0.46, 5);
  ctx.strokeStyle = '#5a4030'; // the poles it stands up on
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, -lift * 0.4);
  ctx.lineTo(-w * 0.4, 0);
  ctx.moveTo(w * 0.36, -lift * 0.4);
  ctx.lineTo(w * 0.4, 0);
  ctx.stroke();
  ctx.fillStyle = '#c8b090';
  ctx.strokeStyle = '#7a6448';
  ctx.lineWidth = 2.4;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = col; // its faded stripes
  ctx.globalAlpha = 0.5;
  for (let i = -3; i <= 3; i += 2) {
    ctx.beginPath();
    ctx.moveTo(i * w * 0.1, -h - lift);
    ctx.lineTo(i * w * 0.16 - w * 0.06, 0);
    ctx.lineTo(i * w * 0.16 + w * 0.06, 0);
    ctx.lineTo(i * w * 0.1 + 4, -h - lift);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(216,192,160,0.7)'; // sand caked in its folds
  ellipse(ctx, 0, -lift * 0.4, w * 0.5, 10);
  ctx.restore();
  ctx.strokeStyle = '#7a6448'; // stiff creases, like wood
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, -h * 0.6 - lift);
  ctx.lineTo(-w * 0.26, -lift * 0.4);
  ctx.moveTo(w * 0.18, -h * 0.6 - lift);
  ctx.lineTo(w * 0.26, -lift * 0.4);
  ctx.stroke();
  // the door-flap, dark, two eyes in it
  ctx.fillStyle = '#2a1e14';
  ctx.beginPath();
  ctx.moveTo(-w * 0.12, -lift * 0.4);
  ctx.lineTo(0, -h * 0.5 - lift);
  ctx.lineTo(w * 0.12, -lift * 0.4);
  ctx.closePath();
  ctx.fill();
  if (live) {
    ctx.fillStyle = wk > 0 || jump ? '#ffd890' : 'rgba(255,214,150,0.8)';
    circle(ctx, -w * 0.03, -h * 0.26 - lift, 2.2);
    circle(ctx, w * 0.04, -h * 0.26 - lift, 2.2);
  }
  ctx.fillStyle = BRASS; // its finial
  circle(ctx, 0, -h - lift - 3, 4);
  ctx.restore();
  return body;
}

// The Last Drover: a drover slime dried out under the sand to leather and bone, long wrap and hood stiff as old hide, a
// goad in one hand and his lantern in the other, a string of little bells at his belt; he leans into his walk as if the
// string were behind him (m.warn: he swings the lantern back to throw it)
function drawLastDrover(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, wk = m?.warn ? warnK(m.warn) : 0;
  const step = live && m?.walking ? Math.sin(t * 4 + seed) : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.36, 0);
    ctx.quadraticCurveTo(-w * 0.44, -h * 0.6, -w * 0.12, -h * 0.9);
    ctx.quadraticCurveTo(w * 0.14, -h * 1.02, w * 0.3, -h * 0.72);
    ctx.quadraticCurveTo(w * 0.42, -h * 0.36, w * 0.34, 0);
    ctx.closePath();
  };
  ctx.save();
  ctx.fillStyle = 'rgba(30,20,10,0.3)';
  ellipse(ctx, 0, 0, w * 0.42, 6);
  ctx.save();
  ctx.rotate(0.06 + step * 0.02); // leaning into his walk
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#9a7a58');
  g.addColorStop(1, '#5a4430');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3e2e1e';
  ctx.lineWidth = 2.4;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  body();
  ctx.clip();
  ctx.fillStyle = 'rgba(184,154,120,0.6)'; // his wrap, wound round and round, stiff
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(0, -h * (0.24 + i * 0.12), w * 0.5, 4, -0.15, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(40,28,18,0.7)'; // the hood's dark
  ellipse(ctx, w * 0.08, -h * 0.72, w * 0.24, h * 0.12);
  ctx.restore();
  ctx.fillStyle = live ? `rgba(255,214,140,${0.75 + 0.25 * wk})` : '#5a4a3a'; // two amber points in the hood
  circle(ctx, w * 0.04, -h * 0.72, 2.6);
  circle(ctx, w * 0.16, -h * 0.72, 2.6);
  ctx.fillStyle = BRASS; // a brass ring at his throat
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(w * 0.1, -h * 0.58, 4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS; // the string of bells at his belt
  for (let i = 0; i < 5; i++) {
    const bx = -w * 0.2 + i * w * 0.08, by = -h * 0.34 + Math.sin(t * 6 + i) * (live ? 1.2 : 0);
    ctx.beginPath();
    ctx.arc(bx, by, 3, Math.PI, 0);
    ctx.lineTo(bx + 3, by + 2);
    ctx.lineTo(bx - 3, by + 2);
    ctx.closePath();
    ctx.fill();
  }
  // the goad, held out in front, a brass point
  ctx.strokeStyle = '#6a4a30';
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.24, -h * 0.4);
  ctx.lineTo(w * 0.62, -h * 0.84);
  ctx.stroke();
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.moveTo(w * 0.62, -h * 0.84);
  ctx.lineTo(w * 0.7, -h * 0.98);
  ctx.lineTo(w * 0.66, -h * 0.82);
  ctx.closePath();
  ctx.fill();
  // the lantern, in his other hand behind, swung back on the wind-up
  ctx.save();
  ctx.translate(-w * 0.26, -h * 0.5);
  ctx.rotate(0.3 + wk * 1.1);
  ctx.strokeStyle = '#3e2e1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-10, 18);
  ctx.stroke();
  lantern(ctx, -10, 18, 1.3, t, live ? 1 : 0.15);
  ctx.restore();
  ctx.restore();
  ctx.restore();
  return body;
}

// A phantom pack-beast of his string: a pack-lizard made of drifting dust and a little amber light, its pack, a bell at its
// throat, there and not quite there
function drawPhantomBeast(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, run = live && m?.walking;
  const st = run ? Math.sin(t * 14 + seed) : 0;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.46, w * 0.38, h * 0.26, 0, 0, TAU);
  };
  ctx.save();
  ctx.globalAlpha *= 0.55 + 0.2 * Math.sin(t * 3 + seed);
  ctx.strokeStyle = 'rgba(216,192,160,0.7)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [lx, ph] of [[-0.2, 1], [0.18, -1]]) {
    ctx.moveTo(w * lx, -h * 0.34);
    ctx.lineTo(w * lx + st * ph * 8, -1);
  }
  ctx.stroke();
  const g = ctx.createRadialGradient(0, -h * 0.5, 2, 0, -h * 0.46, w * 0.4);
  g.addColorStop(0, 'rgba(255,224,170,0.85)');
  g.addColorStop(1, 'rgba(200,170,130,0.3)');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.fillStyle = 'rgba(232,212,180,0.7)'; // its head, the pack
  ellipse(ctx, w * 0.38, -h * 0.5, w * 0.14, h * 0.1);
  ctx.fillStyle = 'rgba(168,90,58,0.5)';
  ctx.fillRect(-w * 0.16, -h * 0.82, w * 0.28, h * 0.2);
  ctx.fillStyle = 'rgba(255,240,210,0.9)';
  circle(ctx, w * 0.42, -h * 0.54, 1.8);
  ctx.fillStyle = BRASS;
  circle(ctx, w * 0.3, -h * 0.38, 2.4);
  ctx.fillStyle = 'rgba(232,212,180,0.5)'; // dust coming off it
  for (let i = 0; i < 4; i++) circle(ctx, -w * 0.4 - i * 6, -h * 0.4 + Math.sin(t * 4 + i) * 4, 2.4 - i * 0.4);
  ctx.restore();
  return body;
}
export const BURIED_MOB_ART = { husk_lizard: drawHuskLizard, buried_lamplighter: drawBuriedLamplighter, stiff_tent: drawStiffTent, last_drover: drawLastDrover, phantom_beast: drawPhantomBeast };

// ——— swords ———
// The Drover's Goad: a long pole of desert wood with a brass point, a string of little bells at the grip
function drawDroverGoad(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,214,140,0.85)';
    ctx.shadowBlur = 10;
  }
  ctx.strokeStyle = '#8a6440';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -L * 0.02);
  ctx.lineTo(0, -L * 0.86);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = BRASS;
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3.4, -L * 0.84);
  ctx.lineTo(0, -L);
  ctx.lineTo(3.4, -L * 0.84);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-3, -L * 0.86, 6, 4);
  for (let i = 0; i < 3; i++) { // the bells
    const by = -L * (0.26 + i * 0.05);
    ctx.beginPath();
    ctx.arc(4.4, by, 2.4, Math.PI, 0);
    ctx.lineTo(6.8, by + 2);
    ctx.lineTo(2, by + 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#4a3020';
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.24, 5.2, L * 0.22, 2);
  ctx.fill();
  ctx.restore();
}
export const BURIED_SWORDS = { drover_goad: drawDroverGoad };
export const BURIED_SWORD_LEN = { drover_goad: 66 };

// ——— helmets ———
// a wrapped hood: a dome of cloth with a fold across the front
function hood(ctx, w, h, fill, line) {
  const by = -h * 0.62, rx = w * 0.56;
  ctx.fillStyle = fill;
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 12);
  ctx.bezierCurveTo(-rx * 1.06, by - h * 0.56, rx * 1.02, by - h * 0.58, rx, by + 8);
  ctx.quadraticCurveTo(0, by - 4, -rx, by + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.8, by - h * 0.2);
  ctx.quadraticCurveTo(0, by - h * 0.34, rx * 0.8, by - h * 0.2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  return by;
}
// The Lamplighter's Hood: a dry paper-pale hood with a little amber lamp on a hook at the brow, lit
function drawLamplighterHood(ctx, w, h) {
  const by = hood(ctx, w, h, '#d8c8a8', '#8a7458');
  ctx.strokeStyle = '#5a3a1e';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, by - h * 0.2);
  ctx.quadraticCurveTo(w * 0.36, by - h * 0.34, w * 0.42, by - h * 0.16);
  ctx.stroke();
  lantern(ctx, w * 0.42, by - h * 0.16, 0.8, 0, 1);
}
// The Last Drover's Hood: a drover's wrap gone stiff as leather, dust in every fold, a brass ring at the throat
function drawLastDroverHood(ctx, w, h) {
  const by = hood(ctx, w, h, '#8a6a4a', '#4a3424');
  ctx.fillStyle = 'rgba(216,192,160,0.5)'; // dust in the folds
  for (let i = 0; i < 4; i++) ellipse(ctx, -w * 0.3 + i * w * 0.2, by - h * 0.16 - (i % 2) * 4, 5, 2);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-w * 0.44, by + 4, 4, 0, TAU);
  ctx.stroke();
}
export const BURIED_HELMETS = { lamplighter_hood: drawLamplighterHood, last_drover_hood: drawLastDroverHood };

// ——— icons ———
function iconHuskScale(ctx) {
  ctx.save();
  ctx.fillStyle = DUST_L;
  ctx.strokeStyle = DUST_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.quadraticCurveTo(10, -4, 6, 9);
  ctx.quadraticCurveTo(0, 12, -6, 9);
  ctx.quadraticCurveTo(-10, -4, 0, -11);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,98,72,0.6)';
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, 9);
  ctx.moveTo(-5, -1);
  ctx.lineTo(5, 2);
  ctx.stroke();
  ctx.restore();
}
function iconBuriedWick(ctx) {
  ctx.save();
  ctx.rotate(0.4);
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(-2, -8, 4, 18);
  ctx.fillStyle = '#2a1e14';
  ctx.fillRect(-2, -11, 4, 4);
  ctx.strokeStyle = 'rgba(160,150,140,0.6)'; // a wisp of smoke
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.quadraticCurveTo(4, -15, 0, -18);
  ctx.stroke();
  ctx.restore();
}
function iconTentPeg(ctx) {
  ctx.save();
  ctx.rotate(-0.5);
  ctx.fillStyle = '#e8dcc4';
  ctx.strokeStyle = '#8a7a62';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, -11);
  ctx.lineTo(3, -11);
  ctx.lineTo(1, 11);
  ctx.lineTo(-1, 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-5, -11, 10, 3);
  ctx.strokeStyle = '#8a6a42';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-2, -8);
  ctx.quadraticCurveTo(-10, -4, -9, 6);
  ctx.stroke();
  ctx.restore();
}
function iconDroverBell(ctx) {
  ctx.save();
  ctx.fillStyle = BRASS;
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.quadraticCurveTo(-8, -9, 0, -9);
  ctx.quadraticCurveTo(8, -9, 8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-9, 5, 18, 3);
  ctx.fillStyle = BRASS_D;
  circle(ctx, 0, 10, 2.4);
  ctx.fillStyle = '#fff4d0';
  ellipse(ctx, -3, -3, 1.6, 3);
  ctx.strokeStyle = '#6a4a30';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(0, -12);
  ctx.stroke();
  ctx.restore();
}
export const BURIED_ICONS = { husk_scale: iconHuskScale, buried_wick: iconBuriedWick, tent_peg: iconTentPeg, drover_bell: iconDroverBell };
export { DUST, DUST_D, DUST_L, STRIPE, AMBER, AMBER_L, BRASS, BRASS_D };
