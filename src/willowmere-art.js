// Docs: docs/places/willowmere.md, docs/combat/stages.md
// Willowmere's art that isn't the room itself (src/willowmere.js): its wildlife (pond frog, dragonfly, gloop
// snail, and Old Snapjaw, the field boss; WILLOW_MOB_ART, called by drawMob in src/field.js), the gear sold
// at the mill or dropped here (the Reed Rapier; the Lilypad Hat, Miller's Cap, Snailshell Helm and Snapjaw
// Shell, drawn by drawSword / drawHelmet in src/field.js), its materials' icons (WILLOW_ICONS) and Miller
// Bun's dress (drawMillerDress, called by src/slime.js for the 'miller' accessory).
import { TAU, circle, ellipse, clamp } from './util.js';

function face(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, sleepy = false, grumpy = false } = {}) {
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
  if (grumpy && dying < 0.05) {
    ctx.beginPath();
    ctx.moveTo(fx - gap - 3 * size, fy - 6 * size); ctx.lineTo(fx - gap + 3 * size, fy - 4 * size);
    ctx.moveTo(fx + gap + 3 * size, fy - 6 * size); ctx.lineTo(fx + gap - 3 * size, fy - 4 * size);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,140,170,0.45)';
  ellipse(ctx, fx - gap - 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
  ellipse(ctx, fx + gap + 4 * size, fy + 4.5 * size, 3 * size, 1.8 * size);
}

// ——— mobs: (ctx, w, h, t, seed, m, dying) => sil, origin at the feet, +x = facing ———

// Pond frog: a round green frog with bulgy eyes on top, a pale belly and a throat that puffs as it croaks
function drawFrog(ctx, w, h, t, seed, m, dying) {
  const air = Math.abs(m.vy ?? 0) > 1;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -2);
    ctx.bezierCurveTo(-w * 0.56, -h * 0.8, w * 0.5, -h * 0.9, w * 0.5, -h * 0.3);
    ctx.quadraticCurveTo(w * 0.48, -1, 0, -1);
    ctx.quadraticCurveTo(-w * 0.4, -1, -w * 0.5, -2);
    ctx.closePath();
  };
  // back legs: tucked, or kicked out behind in a hop
  ctx.fillStyle = '#5fae5a';
  if (air) {
    ellipse(ctx, -w * 0.5, -h * 0.1, w * 0.26, h * 0.12, 0.5);
    ellipse(ctx, -w * 0.72, h * 0.02, w * 0.12, h * 0.06, 0.2);
  } else {
    ellipse(ctx, -w * 0.32, -h * 0.18, w * 0.22, h * 0.2);
  }
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#9ad884');
  g.addColorStop(1, '#6cba5e');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = '#4a8a46';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(74,138,70,0.4)'; // spots
  for (const [sx, sy, r] of [[-0.2, 0.6, 3], [-0.36, 0.4, 2.2], [0.02, 0.7, 2]]) circle(ctx, w * sx, -h * sy, r);
  // throat pouch, puffing now and then
  const puff = dying < 0.05 ? clamp(Math.sin(t * 2.4 + seed * 3) * 3 - 2, 0, 1) : 0;
  ctx.fillStyle = '#f2f6d8';
  ellipse(ctx, w * 0.24, -h * 0.2, w * 0.2 + puff * 4, h * 0.16 + puff * 3);
  // eyes on bumps on top
  for (const ex of [w * 0.06, w * 0.32]) {
    ctx.fillStyle = '#9ad884';
    circle(ctx, ex, -h * 0.78, 6);
    ctx.strokeStyle = '#4a8a46';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ex, -h * 0.78, 6, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }
  face(ctx, w * 0.19, -h * 0.76, w * 0.13, t, seed, { dying, size: 0.85 });
  // a wide smile
  if (dying < 0.05) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(w * 0.22, -h * 0.48, 7, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  // front foot
  ctx.fillStyle = '#5fae5a';
  ellipse(ctx, w * 0.3, -2, 6, 3);
  return body;
}

// Dragonfly: a long blue-green body, big round eyes and four glassy wings that blur; it hovers, then
// dives (m.warn: tail curls, wings stop; m.charging: streaks forward)
function drawDragonfly(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const bob = dive ? 0 : Math.sin(t * 4 + seed * 3) * 2.5;
  const cy = -h * 0.5 + bob;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(w * 0.05, cy, w * 0.2, h * 0.17, 0, 0, TAU);
    ctx.moveTo(-w * 0.1, cy - 3);
    ctx.lineTo(-w * 0.5, cy - (warn ? 10 : 1));
    ctx.lineTo(-w * 0.5, cy + (warn ? -5 : 4));
    ctx.lineTo(-w * 0.1, cy + 4);
    ctx.closePath();
    ctx.moveTo(w * 0.38, cy);
    ctx.ellipse(w * 0.3, cy - 1, w * 0.1, h * 0.2, 0, 0, TAU);
  };
  ctx.save();
  if (dive) {
    ctx.translate(0, cy);
    ctx.rotate(0.45);
    ctx.translate(0, -cy);
  }
  // wings: a blur of flicker while hovering, held still and up in the wind-up
  const flap = warn ? 0 : Math.sin(t * 60 + seed) * 0.3;
  for (const [ox, len, a] of [[0.02, 0.42, -0.5], [0.12, 0.38, -0.35], [0.02, 0.4, 0.2], [0.12, 0.34, 0.35]]) {
    ctx.save();
    ctx.translate(w * ox, cy - 3);
    ctx.rotate(a + (a < 0 ? -flap : flap) - (warn ? 0.5 : 0));
    ctx.fillStyle = 'rgba(220,245,255,0.55)';
    ctx.strokeStyle = 'rgba(120,170,200,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, -h * len, w * 0.08, h * len, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  const g = ctx.createLinearGradient(-w * 0.5, 0, w * 0.4, 0);
  g.addColorStop(0, '#5ab8c8');
  g.addColorStop(1, '#4a9ad8');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = '#2e6a94';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; // tail segments
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 1; k < 5; k++) {
    const x = -w * 0.1 - k * w * 0.08;
    ctx.moveTo(x, cy - 3);
    ctx.lineTo(x, cy + 4);
  }
  ctx.stroke();
  // big eyes on the head
  ctx.fillStyle = warn ? '#ff8a6a' : '#3a4a8a';
  circle(ctx, w * 0.33, cy - h * 0.12, 4.2);
  ctx.fillStyle = '#ffffff';
  circle(ctx, w * 0.35, cy - h * 0.16, 1.4);
  if (dying > 0.05) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(w * 0.3, cy - h * 0.16); ctx.lineTo(w * 0.36, cy - h * 0.08);
    ctx.moveTo(w * 0.36, cy - h * 0.16); ctx.lineTo(w * 0.3, cy - h * 0.08);
    ctx.stroke();
  }
  ctx.restore();
  return () => {
    ctx.save();
    if (dive) {
      ctx.translate(0, cy);
      ctx.rotate(0.45);
      ctx.translate(0, -cy);
    }
    body();
    ctx.restore();
  };
}

// Gloop snail: a slow, glossy lilac snail with a minty swirl shell, long eye stalks and a shine of gloop
function drawSnail(ctx, w, h, t, seed, m, dying) {
  const creep = m.walking ? Math.sin(t * 5 + seed) : 0;
  const foot = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -1);
    ctx.quadraticCurveTo(-w * 0.52, -h * 0.28, -w * 0.2, -h * 0.3);
    ctx.lineTo(w * 0.3, -h * 0.34);
    ctx.quadraticCurveTo(w * 0.52, -h * 0.5 - creep, w * 0.5, -h * 0.18);
    ctx.quadraticCurveTo(w * 0.48, 0, w * 0.2, -1);
    ctx.closePath();
  };
  const sil = () => {
    foot();
    ctx.moveTo(-w * 0.02 + w * 0.32, -h * 0.62);
    ctx.arc(-w * 0.02, -h * 0.62, w * 0.32, 0, TAU);
  };
  // a shiny smear behind it
  ctx.fillStyle = 'rgba(200,240,220,0.5)';
  ellipse(ctx, -w * 0.62, -1, w * 0.24, 3);
  const g = ctx.createLinearGradient(0, -h * 0.5, 0, 0);
  g.addColorStop(0, '#d8c4f0');
  g.addColorStop(1, '#b8a0dc');
  ctx.fillStyle = g;
  foot();
  ctx.fill();
  ctx.strokeStyle = '#8a70b4';
  ctx.lineWidth = 2;
  ctx.stroke();
  // eye stalks
  ctx.strokeStyle = '#b8a0dc';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const sway = Math.sin(t * 2 + seed) * 2;
  for (const [ex, ey] of [[w * 0.4 + sway, -h * 0.82], [w * 0.5 + sway, -h * 0.74]]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.42, -h * 0.4);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.fillStyle = '#b8a0dc';
    circle(ctx, ex, ey, 3.6);
    ctx.fillStyle = dying > 0.05 ? '#8a70b4' : '#2d2a3e';
    circle(ctx, ex + 0.8, ey, 1.8);
  }
  // the shell: a minty swirl
  const sx = -w * 0.02, sy = -h * 0.62, r = w * 0.32;
  const sg = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.3, 2, sx, sy, r);
  sg.addColorStop(0, '#d8f8e8');
  sg.addColorStop(1, '#7cc8a8');
  ctx.fillStyle = sg;
  circle(ctx, sx, sy, r);
  ctx.strokeStyle = '#4a9a7a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  for (let a = 0; a < TAU * 2.2; a += 0.2) {
    const rr = r * (0.9 - a / (TAU * 2.6));
    const px = sx + Math.cos(a + 1) * rr, py = sy + Math.sin(a + 1) * rr;
    a ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, sx - r * 0.4, sy - r * 0.5, r * 0.25, r * 0.12, -0.6);
  // a mouth (it's quite pleased with itself)
  if (dying < 0.05) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(w * 0.44, -h * 0.26, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  return sil;
}

// Old Snapjaw: a huge, ancient pond turtle with a domed mossy shell, a hooked beak and a grumpy squint.
// m.warn: pulls back into its shell, about to lunge; m.charging: snapping forward, jaws open
function drawSnapjaw(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, snap = !!m.charging && live;
  const step = m.walking ? Math.sin(t * 6 + seed) : 0;
  const dome = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.2);
    ctx.bezierCurveTo(-w * 0.5, -h * 1.05, w * 0.4, -h * 1.05, w * 0.42, -h * 0.2);
    ctx.quadraticCurveTo(0, -h * 0.08, -w * 0.5, -h * 0.2);
    ctx.closePath();
  };
  // legs
  ctx.fillStyle = '#7a9a62';
  ctx.strokeStyle = '#4e6a3e';
  ctx.lineWidth = 2;
  for (const [lx, ph] of [[-w * 0.32, 0], [w * 0.22, Math.PI]]) {
    ctx.beginPath();
    ctx.roundRect(lx - 12, -h * 0.26 + (step * Math.sin(ph) > 0 ? -3 : 0), 24, h * 0.26, 8);
    ctx.fill();
    ctx.stroke();
  }
  // head and neck: tucked in (warn), out and snapping (charging), else out a little
  const reach = warn ? -10 : snap ? 26 : 6;
  const hx = w * 0.46 + reach, hy = -h * 0.36;
  ctx.fillStyle = '#86a86c';
  ctx.beginPath();
  ctx.roundRect(w * 0.3, hy - 12, hx - w * 0.3 + 10, 24, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#93b678';
  ellipse(ctx, hx + 10, hy - 2, 22, 18);
  ctx.stroke();
  // the beak: closed, or wide open when it snaps
  const open = snap ? 0.55 : 0;
  ctx.fillStyle = '#d8c48a';
  ctx.strokeStyle = '#8a7a4a';
  ctx.beginPath();
  ctx.moveTo(hx + 22, hy - 6 - open * 10);
  ctx.quadraticCurveTo(hx + 40, hy - 2 - open * 14, hx + 34, hy + 4 - open * 6);
  ctx.lineTo(hx + 22, hy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx + 22, hy + 4);
  ctx.lineTo(hx + 32, hy + 6 + open * 12);
  ctx.lineTo(hx + 20, hy + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  face(ctx, hx + 10, hy - 6, 7, t, seed, { dying, size: 1.1, grumpy: true, sleepy: warn });
  // the shell: domed, mossy, with big scutes
  const g = ctx.createLinearGradient(0, -h, 0, -h * 0.2);
  g.addColorStop(0, '#8a8a5a');
  g.addColorStop(1, '#5e6a44');
  ctx.fillStyle = g;
  dome();
  ctx.fill();
  ctx.strokeStyle = '#3e4a2e';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,70,40,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const [x, y] of [[-0.3, 0.6], [0, 0.72], [0.26, 0.58], [-0.14, 0.4], [0.14, 0.4]]) {
    const cx = w * x, cy = -h * y;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      i ? ctx.lineTo(cx + Math.cos(a) * w * 0.1, cy + Math.sin(a) * h * 0.1) : ctx.moveTo(cx + Math.cos(a) * w * 0.1, cy + Math.sin(a) * h * 0.1);
    }
    ctx.closePath();
  }
  ctx.stroke();
  ctx.fillStyle = '#7fb26a'; // moss and a lily growing on top
  ellipse(ctx, -w * 0.12, -h * 0.94, w * 0.22, 7);
  ellipse(ctx, w * 0.16, -h * 0.9, w * 0.12, 5);
  ctx.fillStyle = '#ffd1e0';
  for (let i = 0; i < 5; i++) ellipse(ctx, -w * 0.08 + Math.cos(i * 1.26) * 5, -h * 0.98 - Math.abs(Math.sin(i * 1.26)) * 4, 4, 2.4, i * 1.26);
  ctx.fillStyle = '#ffd66a';
  circle(ctx, -w * 0.08, -h * 0.99, 2);
  // the shell's rim
  ctx.fillStyle = '#c8b47a';
  ctx.beginPath();
  ctx.roundRect(-w * 0.52, -h * 0.26, w * 0.96, 10, 5);
  ctx.fill();
  return dome;
}

export const WILLOW_MOB_ART = { pond_frog: drawFrog, dragonfly: drawDragonfly, gloop_snail: drawSnail, snapjaw: drawSnapjaw };

// ——— gear ———

// The Reed Rapier: a long thin silver blade, a little cup guard, a grip of plaited river reeds
export function drawReedRapier(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(-2.5, 0, 2.5, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#c8d8e4');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#8aa0b4';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-2.4, -6);
  ctx.lineTo(-1.6, -L + 4);
  ctx.lineTo(0, -L - 2);
  ctx.lineTo(1.6, -L + 4);
  ctx.lineTo(2.4, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(200,240,255,${0.3 + 0.4 * glow})`;
  ellipse(ctx, 0, -L * 0.6, 1, L * 0.25);
  // the cup guard
  ctx.fillStyle = '#d8c48a';
  ctx.strokeStyle = '#9a8a5a';
  ctx.beginPath();
  ctx.ellipse(0, -5, 8, 4, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // plaited reed grip, and a reed tassel
  ctx.fillStyle = '#a8c47a';
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.strokeStyle = '#6a8a4a';
  ctx.lineWidth = 1;
  for (let y = -2; y < 10; y += 3) {
    ctx.beginPath();
    ctx.moveTo(-3, y);
    ctx.lineTo(3, y + 1.6);
    ctx.stroke();
  }
  ctx.strokeStyle = '#7fb26a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 11);
  ctx.quadraticCurveTo(-4, 16, -6, 20);
  ctx.moveTo(0, 11);
  ctx.quadraticCurveTo(3, 16, 2, 21);
  ctx.stroke();
  ctx.restore();
}

// Helmets: (ctx, w, h, t), origin at the wearer's feet; by is the brim line, just above the eyes
export function drawLilyHat(ctx, w, h, t) {
  const by = -h * 0.68, rx = w * 0.62;
  ctx.fillStyle = '#6fb86a';
  ctx.strokeStyle = '#4a8a46';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, by - 4, rx, 9, 0, 0.25 + Math.PI, Math.PI * 2.9);
  ctx.lineTo(0, by - 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(74,138,70,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI + (i / 5) * Math.PI;
    ctx.moveTo(0, by - 4);
    ctx.lineTo(Math.cos(a) * rx * 0.9, by - 4 + Math.sin(a) * 8);
  }
  ctx.stroke();
  // a little flower on top
  ctx.fillStyle = '#ffd1e0';
  for (let i = 0; i < 5; i++) ellipse(ctx, w * 0.12 + Math.cos(i * 1.26) * 4, by - 12 - Math.abs(Math.sin(i * 1.26)) * 3, 4, 2.4, i * 1.26 + Math.sin(t * 2) * 0.05);
  ctx.fillStyle = '#ffd66a';
  circle(ctx, w * 0.12, by - 13, 2);
}

export function drawMillerCap(ctx, w, h) {
  const by = -h * 0.68, rx = w * 0.52, ry = h * 0.36;
  ctx.fillStyle = '#fbf6ec';
  ctx.strokeStyle = '#c8b898';
  ctx.lineWidth = 2;
  ctx.beginPath(); // a soft floppy cap, puffed up and slumped to one side
  ctx.moveTo(-rx, by + 2);
  ctx.bezierCurveTo(-rx * 1.1, by - ry * 1.4, rx * 0.4, by - ry * 1.9, rx * 0.9, by - ry * 0.9);
  ctx.quadraticCurveTo(rx * 1.1, by - ry * 0.4, rx, by + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8dcc4'; // the band
  ctx.beginPath();
  ctx.roundRect(-rx, by - 6, rx * 2, 8, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; // a dusting of flour
  for (const [x, y] of [[-0.4, 0.9], [0.1, 1.3], [0.5, 0.8]]) circle(ctx, rx * x, by - ry * y, 2.4);
  ctx.fillStyle = '#d8c48a'; // a wheat ear tucked in the band
  for (let i = 0; i < 4; i++) ellipse(ctx, rx * 0.7 + i * 2, by - 8 - i * 4, 2.2, 3.4, 0.5);
}

export function drawSnailHelm(ctx, w, h) {
  const by = -h * 0.68, r = w * 0.4, cy = by - r * 0.7;
  const sg = ctx.createRadialGradient(-r * 0.3, cy - r * 0.3, 2, 0, cy, r);
  sg.addColorStop(0, '#d8f8e8');
  sg.addColorStop(1, '#7cc8a8');
  ctx.fillStyle = sg;
  ctx.strokeStyle = '#4a9a7a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, cy, r * 1.15, r, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  for (let a = 0; a < TAU * 2; a += 0.2) {
    const rr = r * (0.85 - a / (TAU * 2.5));
    const px = Math.cos(a) * rr * 1.1, py = cy + Math.sin(a) * rr;
    a ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, -r * 0.45, cy - r * 0.5, r * 0.3, r * 0.14, -0.5);
  ctx.fillStyle = '#c8b0e8'; // the rim, a little sticky
  ctx.beginPath();
  ctx.roundRect(-r * 1.1, by - 6, r * 2.2, 7, 3.5);
  ctx.fill();
}

export function drawSnapjawShell(ctx, w, h) {
  const by = -h * 0.68, rx = w * 0.56, ry = h * 0.46;
  const g = ctx.createLinearGradient(0, by - ry, 0, by);
  g.addColorStop(0, '#8a8a5a');
  g.addColorStop(1, '#5e6a44');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3e4a2e';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 4);
  ctx.bezierCurveTo(-rx, by - ry * 1.4, rx, by - ry * 1.4, rx, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,70,40,0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const [x, y] of [[-0.45, 0.5], [0, 0.8], [0.45, 0.5]]) {
    const cx = rx * x, cy = by - ry * y;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      i ? ctx.lineTo(cx + Math.cos(a) * rx * 0.24, cy + Math.sin(a) * ry * 0.24) : ctx.moveTo(cx + Math.cos(a) * rx * 0.24, cy + Math.sin(a) * ry * 0.24);
    }
    ctx.closePath();
  }
  ctx.stroke();
  ctx.fillStyle = '#7fb26a';
  ellipse(ctx, -rx * 0.2, by - ry * 1.02, rx * 0.4, 4);
  ctx.fillStyle = '#c8b47a';
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by - 2, rx * 2.04, 7, 3.5);
  ctx.fill();
}

// ——— materials' icons (40 × 40, centred) ———
function iconLilyPad(ctx) {
  ctx.fillStyle = '#6fb86a';
  ctx.strokeStyle = '#4a8a46';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0.35, TAU - 0.15);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(74,138,70,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = 0.6 + (i / 7) * (TAU - 0.9);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 13, Math.sin(a) * 13);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,240,255,0.8)';
  circle(ctx, -5, -6, 2.4);
}
function iconWing(ctx) {
  ctx.rotate(-0.6);
  ctx.fillStyle = 'rgba(210,240,255,0.85)';
  ctx.strokeStyle = '#6aa0c4';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 17, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 16);
  for (let y = -12; y <= 12; y += 4) {
    ctx.moveTo(-5, y);
    ctx.lineTo(5, y + 2);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,200,240,0.4)';
  ellipse(ctx, 2, -6, 2.6, 6);
}
function iconGloop(ctx) {
  ctx.fillStyle = '#c8b0e8';
  ctx.strokeStyle = '#8a70b4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 10);
  ctx.bezierCurveTo(-18, -4, -6, -16, 0, -14);
  ctx.bezierCurveTo(10, -16, 18, -2, 14, 10);
  ctx.quadraticCurveTo(0, 16, -14, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(ctx, -5, -6, 4, 2.4, -0.5);
  ctx.fillStyle = '#c8b0e8';
  ellipse(ctx, 6, 14, 3, 4); // a drip
}
export const WILLOW_ICONS = { lily_pad: iconLilyPad, dragon_wing: iconWing, gloop: iconGloop };

// Miller Bun: a flour-white apron (clipped to the body: `clip` draws its outline), flour dust on his jelly,
// and his own Miller's Cap
export function drawMillerDress(ctx, w, h, fx, t, clip) {
  ctx.save();
  ctx.save();
  clip(ctx, w, h);
  ctx.clip();
  const ay = -h * 0.24;
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  ctx.roundRect(-w * 0.2, ay, w * 0.64, -ay + 4, [8, 8, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#e8dcc4';
  ctx.fillRect(-w / 2, ay - 1, w, 3.4);
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; // flour dust
  for (const [x, y, r] of [[-0.3, 0.5, 3], [-0.36, 0.3, 2], [0.3, 0.62, 2.4], [0.12, 0.4, 1.8]]) circle(ctx, w * x, -h * y, r);
  ctx.restore();
  ctx.strokeStyle = 'rgba(200,184,152,0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); // the apron's pocket, with a wooden spoon in it
  ctx.roundRect(w * 0.04, -h * 0.18, 14, 9, [0, 0, 3, 3]);
  ctx.stroke();
  ctx.strokeStyle = '#c99b6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.04 + 9, -h * 0.17);
  ctx.lineTo(w * 0.04 + 12, -h * 0.3 + Math.sin(t * 2) * 0.5);
  ctx.stroke();
  ctx.restore();
  drawMillerCap(ctx, w, h);
  void fx;
}
