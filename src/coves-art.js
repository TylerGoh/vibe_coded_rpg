// Docs: docs/places/coves.md, docs/combat/stages.md
// Saltspray Coves' art that isn't the room itself (src/coves.js): its wildlife (rock crab, tide jelly, storm
// gull, snapshrimp; COVES_MOB_ART, called by drawMob in src/field.js), the gear sold at Moss's shack or
// dropped here (Driftwood Cutlass, Coral Saber, the Tidemother's Claw; the Conch Helm and Hoardshell Crown,
// drawn by drawSword / drawHelmet in src/field.js), its materials' icons (COVES_ICONS) and Beachcomber Moss's
// dress (drawBeachcomberDress, called by src/slime.js for the 'beachcomber' accessory). The Tidemother
// herself is a den boss: src/dens-coves.js.
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

// ——— mobs: (ctx, w, h, t, seed, m, dying) => sil, origin at the feet, +x = facing ———

// Rock crab: a squat grey-brown crab with a barnacled shell, eyes on stalks and one big claw held up in
// front (its shell blocks hits from the front). m.warn: rears back · m.charging: lunges, claw first.
function drawRockCrab(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, lunge = !!m.charging && live;
  const step = m.walking || lunge ? Math.sin(t * (lunge ? 26 : 14) + seed) : 0;
  const tilt = warn ? -0.18 + Math.sin(t * 30) * 0.015 : lunge ? 0.08 : 0;
  const cy = -h * 0.26;
  const shell = () => {
    ctx.moveTo(-w * 0.46, cy);
    ctx.bezierCurveTo(-w * 0.48, -h * 0.98, w * 0.34, -h, w * 0.36, cy);
    ctx.quadraticCurveTo(-w * 0.05, cy + h * 0.14, -w * 0.46, cy);
    ctx.closePath();
  };
  const frame = () => {
    ctx.translate(-w * 0.3, 0);
    ctx.rotate(tilt);
    ctx.translate(w * 0.3, 0);
  };
  ctx.save();
  frame();
  // legs
  ctx.strokeStyle = '#8a6a5a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const lx = -w * 0.3 + i * w * 0.2, k = step * (i % 2 ? 1 : -1) * 3;
    ctx.beginPath();
    ctx.moveTo(lx, cy);
    ctx.lineTo(lx - 8, cy + 6 + k);
    ctx.lineTo(lx - 10, -1);
    ctx.stroke();
  }
  // the shell
  const g = ctx.createLinearGradient(0, -h, 0, cy);
  g.addColorStop(0, '#c8a890');
  g.addColorStop(1, '#9a7a68');
  ctx.fillStyle = g;
  ctx.beginPath();
  shell();
  ctx.fill();
  ctx.strokeStyle = '#6a4e40';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8e0d4'; // barnacles
  for (const [bx, by] of [[-0.24, 0.7], [-0.04, 0.82], [0.14, 0.66]]) {
    circle(ctx, w * bx, -h * by, 3);
    ctx.fillStyle = '#b8aca0';
    circle(ctx, w * bx, -h * by, 1.2);
    ctx.fillStyle = '#e8e0d4';
  }
  // eye stalks
  ctx.strokeStyle = '#9a7a68';
  ctx.lineWidth = 2.4;
  for (const ex of [w * 0.12, w * 0.26]) {
    ctx.beginPath();
    ctx.moveTo(ex, -h * 0.78);
    ctx.lineTo(ex + 2, -h * 1.02);
    ctx.stroke();
  }
  face(ctx, w * 0.2, -h * 1.04, w * 0.08, t, seed, { dying, size: 0.8 });
  // the big claw in front, open while it rears
  const cx = w * 0.46 + (lunge ? 10 : 0), cly = -h * 0.42;
  ctx.fillStyle = '#d8987a';
  ctx.strokeStyle = '#8a5a48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cly, w * 0.16, h * 0.2, -0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  const open = warn ? 0.6 : 0.15;
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.08, cly - 4);
  ctx.quadraticCurveTo(cx + w * 0.22, cly - 10 - open * 10, cx + w * 0.24, cly - 2 - open * 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  return () => {
    ctx.save();
    frame();
    ctx.beginPath();
    shell();
    ctx.restore();
  };
}

// Tide jelly: a translucent bell drifting low over the pools, frilly trailing tentacles. m.special: gone
// glassy (it can't be hurt), about to sting all round it.
function drawTideJelly(ctx, w, h, t, seed, m, dying) {
  const glassy = !!m.special && dying < 0.05;
  const pulse = Math.sin(t * 3 + seed * 2);
  const bw = w * (0.5 + pulse * 0.04), bh = h * (0.5 - pulse * 0.03), cy = -h * 0.55;
  const bell = () => {
    ctx.beginPath();
    ctx.moveTo(-bw, cy + bh * 0.4);
    ctx.bezierCurveTo(-bw, cy - bh * 1.3, bw, cy - bh * 1.3, bw, cy + bh * 0.4);
    for (let i = 4; i >= 0; i--) ctx.quadraticCurveTo(-bw + (bw * 2 * (i + 0.5)) / 5, cy + bh * 0.62, -bw + (bw * 2 * i) / 5, cy + bh * 0.4);
    ctx.closePath();
  };
  ctx.save();
  ctx.globalAlpha *= glassy ? 0.35 + 0.15 * Math.sin(t * 20) : 1;
  // tentacles
  ctx.strokeStyle = glassy ? 'rgba(200,240,255,0.9)' : 'rgba(240,150,200,0.8)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const x = -bw * 0.7 + (i * bw * 1.4) / 4;
    ctx.beginPath();
    ctx.moveTo(x, cy + bh * 0.5);
    for (let k = 1; k <= 4; k++) ctx.lineTo(x + Math.sin(t * 3 + i + k) * 4, cy + bh * 0.5 + k * h * 0.11);
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(-bw * 0.2, cy - bh * 0.4, 2, 0, cy, bw * 1.2);
  g.addColorStop(0, glassy ? 'rgba(240,252,255,0.95)' : 'rgba(255,220,240,0.95)');
  g.addColorStop(1, glassy ? 'rgba(150,220,255,0.6)' : 'rgba(220,140,210,0.75)');
  ctx.fillStyle = g;
  bell();
  ctx.fill();
  ctx.strokeStyle = glassy ? '#8ad0f0' : '#c870b0';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, -bw * 0.4, cy - bh * 0.5, bw * 0.2, bh * 0.14, -0.4);
  face(ctx, 0, cy, bw * 0.28, t, seed, { dying, size: 0.8, sleepy: true });
  ctx.restore();
  return bell;
}

// Storm gull: a big grey-backed gull with a yellow beak and a beady look; it hangs on the wind, then folds
// its wings and dives (m.warn: wings up · m.charging: diving)
function drawGull(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const bob = dive ? 0 : Math.sin(t * 2.6 + seed * 3) * 3;
  const cy = -h * 0.5 + bob;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.32, h * 0.24, 0, 0, TAU);
    ctx.moveTo(w * 0.42, cy - h * 0.2);
    ctx.ellipse(w * 0.3, cy - h * 0.2, w * 0.13, h * 0.17, 0, 0, TAU);
  };
  ctx.save();
  if (dive) {
    ctx.translate(0, cy);
    ctx.rotate(0.55);
    ctx.translate(0, -cy);
  }
  const flap = dive ? -1.2 : warn ? -0.9 + Math.sin(t * 30) * 0.05 : Math.sin(t * 6 + seed) * 0.5;
  const wing = (back) => {
    ctx.save();
    ctx.translate(-w * 0.04, cy - h * 0.06);
    ctx.rotate(flap * (back ? 0.8 : 1) - (back ? 0.2 : 0));
    ctx.fillStyle = back ? '#8a96a8' : '#a8b4c4';
    ctx.strokeStyle = '#5a6678';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.3, -h * 0.4, -w * 0.62, -h * 0.2);
    ctx.lineTo(-w * 0.5, -h * 0.05);
    ctx.quadraticCurveTo(-w * 0.2, 0, 0, h * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2d2a3e'; // black wingtips
    ellipse(ctx, -w * 0.56, -h * 0.16, w * 0.07, h * 0.05, -0.3);
    ctx.restore();
  };
  wing(true);
  ctx.fillStyle = '#ffffff';
  body();
  ctx.fill();
  ctx.strokeStyle = '#8a96a8';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = '#ffffff'; // tail
  ctx.beginPath();
  ctx.moveTo(-w * 0.28, cy - 2);
  ctx.lineTo(-w * 0.5, cy - 6);
  ctx.lineTo(-w * 0.48, cy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  wing(false);
  ctx.fillStyle = '#ffcf4d'; // beak, with the red spot
  ctx.beginPath();
  ctx.moveTo(w * 0.4, cy - h * 0.22);
  ctx.lineTo(w * 0.56, cy - h * 0.16);
  ctx.lineTo(w * 0.4, cy - h * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff6a5a';
  circle(ctx, w * 0.48, cy - h * 0.14, 1.4);
  ctx.fillStyle = warn ? '#ff6a5a' : '#2d2a3e';
  circle(ctx, w * 0.32, cy - h * 0.26, 2);
  if (warn && live) {
    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.27, cy - h * 0.34);
    ctx.lineTo(w * 0.37, cy - h * 0.3);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffcf4d'; // feet, tucked
  ellipse(ctx, 0, cy + h * 0.24, 4, 2);
  ctx.restore();
  return () => {
    ctx.save();
    if (dive) {
      ctx.translate(0, cy);
      ctx.rotate(0.55);
      ctx.translate(0, -cy);
    }
    body();
    ctx.restore();
  };
}

// Snapshrimp: a bright coral-pink shrimp with one huge snapping claw; it keeps its distance and snaps a
// water shot at you (m.warn: claw cocked)
function drawShrimp(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const scuttle = m.walking ? Math.sin(t * 16 + seed) : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.5);
    ctx.bezierCurveTo(-w * 0.44, -h * 0.98, w * 0.3, -h * 1.0, w * 0.34, -h * 0.4);
    ctx.quadraticCurveTo(w * 0.2, -h * 0.12, -w * 0.2, -h * 0.18);
    ctx.quadraticCurveTo(-w * 0.44, -h * 0.2, -w * 0.5, -h * 0.5);
    ctx.closePath();
  };
  // legs
  ctx.strokeStyle = '#e8706a';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const lx = -w * 0.2 + i * w * 0.14;
    ctx.beginPath();
    ctx.moveTo(lx, -h * 0.2);
    ctx.lineTo(lx - 3 + scuttle * (i % 2 ? 2 : -2), -1);
    ctx.stroke();
  }
  // tail fan
  ctx.fillStyle = '#ff9a8a';
  ctx.beginPath();
  ctx.moveTo(-w * 0.48, -h * 0.5);
  ctx.lineTo(-w * 0.66, -h * 0.72);
  ctx.lineTo(-w * 0.6, -h * 0.36);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createLinearGradient(0, -h, 0, -h * 0.2);
  g.addColorStop(0, '#ffb8a8');
  g.addColorStop(1, '#f07a70');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = '#c8504c';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,80,76,0.6)'; // segments
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    const x = -w * 0.34 + k * w * 0.14;
    ctx.moveTo(x, -h * 0.86 + k * 2);
    ctx.quadraticCurveTo(x + 4, -h * 0.5, x, -h * 0.22);
  }
  ctx.stroke();
  // antennae
  ctx.strokeStyle = '#e8706a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.26, -h * 0.8);
  ctx.quadraticCurveTo(w * 0.6, -h * 1.4 + Math.sin(t * 4) * 3, w * 0.8, -h * 1.1);
  ctx.moveTo(w * 0.22, -h * 0.84);
  ctx.quadraticCurveTo(w * 0.4, -h * 1.5, w * 0.62, -h * 1.4 + Math.sin(t * 4 + 1) * 3);
  ctx.stroke();
  face(ctx, w * 0.18, -h * 0.68, w * 0.07, t, seed, { dying, size: 0.75 });
  // the big claw: cocked back while it aims
  ctx.save();
  ctx.translate(w * 0.3, -h * 0.42);
  ctx.rotate(warn ? -0.7 + Math.sin(t * 34) * 0.04 : 0.1);
  ctx.fillStyle = '#ff8a7a';
  ctx.strokeStyle = '#c8504c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(w * 0.2, 0, w * 0.22, h * 0.2, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.36, -4);
  ctx.lineTo(w * 0.52, -2);
  ctx.lineTo(w * 0.38, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  return body;
}

export const COVES_MOB_ART = { rock_crab: drawRockCrab, tide_jelly: drawTideJelly, storm_gull: drawGull, snapshrimp: drawShrimp };

// ——— gear ———
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

// Driftwood Cutlass: a curved blade of sea-bleached driftwood, its edge set with bright sea glass
export function drawDriftCutlass(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = '#e8dcc8';
  ctx.strokeStyle = '#a8977e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-4, -5);
  ctx.quadraticCurveTo(-7, -L * 0.6, 2, -L);
  ctx.quadraticCurveTo(8, -L * 0.6, 4, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(168,151,126,0.6)'; // grain
  ctx.lineWidth = 0.8;
  for (let y = -10; y > -L + 8; y -= 8) {
    ctx.beginPath();
    ctx.moveTo(-2, y);
    ctx.quadraticCurveTo(0, y - 4, 1, y - 8);
    ctx.stroke();
  }
  // sea glass along the edge
  for (let i = 0; i < 5; i++) {
    const y = -L * (0.25 + i * 0.14);
    ctx.fillStyle = ['#8fe0c8', '#9fd0ff', '#c8f0b0'][i % 3];
    ctx.globalAlpha = 0.75 + 0.25 * glow;
    ellipse(ctx, 5 - i * 0.6, y, 2.6, 3.4);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#c9a64a'; // a rope-wrapped guard
  ctx.beginPath();
  ctx.roundRect(-8, -7, 16, 4, 2);
  ctx.fill();
  grip(ctx, '#c99b6b', '#8f6240');
  ctx.restore();
}

// Coral Saber: a curved blade of pink coral, grown not forged, with little branching spurs
export function drawCoralSaber(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(-4, 0, 6, 0);
  g.addColorStop(0, '#ffd6dc');
  g.addColorStop(1, '#ff8fa8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#d0607a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-3.6, -5);
  ctx.quadraticCurveTo(-6, -L * 0.6, 3, -L);
  ctx.quadraticCurveTo(7, -L * 0.55, 3.6, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ff9fb4'; // spurs
  ctx.lineWidth = 2;
  for (const [y, d] of [[0.3, -1], [0.5, 1], [0.7, -1]]) {
    ctx.beginPath();
    ctx.moveTo(d * 3, -L * y);
    ctx.lineTo(d * 9, -L * y - 6);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(255,240,245,${0.4 + 0.4 * glow})`;
  for (let i = 0; i < 6; i++) circle(ctx, -1 + (i % 2) * 2, -L * (0.2 + i * 0.12), 1.1);
  ctx.fillStyle = '#fff1e0'; // a shell guard
  ctx.strokeStyle = '#d8a898';
  ctx.beginPath();
  ctx.moveTo(-9, -4);
  ctx.quadraticCurveTo(0, -14, 9, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  grip(ctx, '#e8b0b8', '#b07080');
  ctx.restore();
}

// The Tidemother's Claw: her great pincer, mottled teal and pearl, gripping shut, crusted with barnacles
export function drawTideClaw(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, '#9fe0d8');
  g.addColorStop(1, '#3e8c96');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2a5e66';
  ctx.lineWidth = 1.8;
  ctx.beginPath(); // the fixed finger
  ctx.moveTo(-7, -6);
  ctx.bezierCurveTo(-12, -L * 0.5, -6, -L * 0.9, 2, -L - 2);
  ctx.quadraticCurveTo(1, -L * 0.7, 2, -L * 0.45);
  ctx.lineTo(4, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath(); // the moving finger, shut against it
  ctx.moveTo(4, -8);
  ctx.bezierCurveTo(12, -L * 0.4, 10, -L * 0.75, 4, -L * 0.88);
  ctx.quadraticCurveTo(4, -L * 0.6, 2, -L * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff'; // pearly teeth along the grip line
  for (let i = 0; i < 4; i++) circle(ctx, 2.6, -L * (0.5 + i * 0.09), 1.5);
  ctx.fillStyle = '#e8e0d4';
  for (const [x, y] of [[-6, 0.3], [-4, 0.62], [7, 0.36]]) {
    circle(ctx, x, -L * y, 2.4);
    ctx.fillStyle = '#b8aca0';
    circle(ctx, x, -L * y, 1);
    ctx.fillStyle = '#e8e0d4';
  }
  if (glow) {
    ctx.fillStyle = `rgba(160,240,255,${0.35 * glow})`;
    ellipse(ctx, 0, -L * 0.6, 10, L * 0.35);
  }
  ctx.fillStyle = '#c9a64a';
  ctx.beginPath();
  ctx.roundRect(-9, -8, 18, 5, 2.5);
  ctx.fill();
  grip(ctx, '#5a8a8e', '#2a5e66');
  ctx.restore();
}

// Helmets: (ctx, w, h, t), origin at the wearer's feet; by is the brim line
export function drawConchHelm(ctx, w, h) {
  const by = -h * 0.68, rx = w * 0.5, ry = h * 0.5;
  const g = ctx.createLinearGradient(0, by - ry, 0, by);
  g.addColorStop(0, '#fff0e8');
  g.addColorStop(1, '#ffb8b0');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#d08a84';
  ctx.lineWidth = 2;
  ctx.beginPath(); // a spiral conch lying over the head, its point to one side
  ctx.moveTo(-rx, by + 3);
  ctx.bezierCurveTo(-rx * 1.1, by - ry * 1.2, rx * 0.2, by - ry * 1.4, rx * 1.2, by - ry * 0.9);
  ctx.quadraticCurveTo(rx * 0.9, by - ry * 0.3, rx, by + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(208,138,132,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let k = 1; k <= 3; k++) {
    ctx.moveTo(-rx + k * rx * 0.4, by + 2);
    ctx.quadraticCurveTo(-rx + k * rx * 0.5, by - ry * (0.6 + k * 0.12), rx * (0.2 + k * 0.28), by - ry * (0.85 + k * 0.05));
  }
  ctx.stroke();
  ctx.fillStyle = '#ffd6c9';
  for (const [x, y] of [[-0.6, 0.7], [-0.1, 1.05], [0.5, 0.95]]) {
    ctx.beginPath(); // knobbly spikes
    ctx.moveTo(rx * x - 4, by - ry * y + 4);
    ctx.lineTo(rx * x, by - ry * y - 6);
    ctx.lineTo(rx * x + 4, by - ry * y + 4);
    ctx.fill();
  }
}

export function drawHoardCrown(ctx, w, h, t) {
  const by = -h * 0.68, rx = w * 0.52;
  ctx.fillStyle = '#5aa8b0'; // a teal shell band
  ctx.strokeStyle = '#2a5e66';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 2);
  for (let i = 0; i <= 5; i++) ctx.lineTo(-rx + (rx * 2 * i) / 5, by - (i % 2 ? 26 : 16));
  ctx.lineTo(rx, by + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // crusted with what the sea gave back: buttons, a bottle cap, shells, a pearl
  const bits = [[-0.7, 10, '#ff8f8f', 'b'], [-0.32, 14, '#ffd66a', 'c'], [0.02, 9, '#fff1e0', 's'], [0.36, 13, '#9fd0ff', 'b'], [0.7, 9, '#ffd6c9', 's']];
  for (const [x, y, c, k] of bits) {
    ctx.fillStyle = c;
    if (k === 's') {
      ctx.beginPath();
      ctx.moveTo(rx * x - 5, by - y + 4);
      ctx.quadraticCurveTo(rx * x, by - y - 6, rx * x + 5, by - y + 4);
      ctx.closePath();
      ctx.fill();
    } else {
      circle(ctx, rx * x, by - y, 4.4);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      if (k === 'b') {
        circle(ctx, rx * x - 1.2, by - y - 1, 0.8);
        circle(ctx, rx * x + 1.2, by - y + 1, 0.8);
      } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rx * x, by - y, 3, 0, TAU);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = '#ffffff';
  circle(ctx, 0, by - 24, 3.6 + Math.sin(t * 3) * 0.3); // the pearl on top
  ctx.fillStyle = 'rgba(200,240,255,0.8)';
  circle(ctx, -1, by - 25, 1.2);
}

// ——— materials' icons (40 × 40, centred) ———
function iconCrabShell(ctx) {
  ctx.fillStyle = '#c8a890';
  ctx.strokeStyle = '#6a4e40';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, 8);
  ctx.bezierCurveTo(-18, -16, 18, -16, 16, 8);
  ctx.quadraticCurveTo(0, 14, -16, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8e0d4';
  for (const [x, y] of [[-6, -4], [4, -7], [8, 1]]) circle(ctx, x, y, 2.6);
}
function iconSeaGlass(ctx) {
  for (const [x, y, c, r] of [[-6, 3, '#8fe0c8', 9], [7, -4, '#9fd0ff', 7], [4, 9, '#c8f0b0', 5]]) {
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.85;
    ellipse(ctx, x, y, r, r * 0.75, 0.4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ellipse(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.15, -0.4);
  }
}
function iconGullFeather(ctx) {
  ctx.rotate(0.6);
  ctx.fillStyle = '#c4ccd8';
  ctx.strokeStyle = '#7a8698';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.bezierCurveTo(-10, 4, -8, -14, 0, -18);
  ctx.bezierCurveTo(8, -14, 10, 4, 0, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2d2a3e';
  ellipse(ctx, 0, -14, 4, 4);
  ctx.strokeStyle = '#7a8698';
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(0, -16);
  ctx.stroke();
}
function iconCoral(ctx) {
  ctx.strokeStyle = '#ff8fa8';
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(0, -4);
  ctx.lineTo(-8, -14);
  ctx.moveTo(0, 2);
  ctx.lineTo(9, -10);
  ctx.moveTo(0, -4);
  ctx.lineTo(2, -16);
  ctx.stroke();
  ctx.fillStyle = '#ffd6dc';
  for (const [x, y] of [[-8, -14], [9, -10], [2, -16]]) circle(ctx, x, y, 3);
}
export const COVES_ICONS = { crab_shell: iconCrabShell, sea_glass: iconSeaGlass, gull_feather: iconGullFeather, coral: iconCoral };

// Beachcomber Moss: a floppy straw sun hat with a ribbon, a string of shells round her and a basket on her arm
export function drawBeachcomberDress(ctx, w, h, fx, t) {
  ctx.save();
  // the shell necklace
  ctx.strokeStyle = '#c8b08a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(fx * 0.4, -h * 0.5, w * 0.34, 0.35, Math.PI - 0.35);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a = 0.5 + (i / 4) * (Math.PI - 1);
    const x = fx * 0.4 + Math.cos(a) * w * 0.34, y = -h * 0.5 + Math.sin(a) * w * 0.34;
    ctx.fillStyle = ['#ffd6c9', '#fff1e0', '#f6c8e0', '#ffe6b0', '#ffd6c9'][i];
    ctx.beginPath();
    ctx.moveTo(x - 3, y + 2);
    ctx.quadraticCurveTo(x, y - 5, x + 3, y + 2);
    ctx.closePath();
    ctx.fill();
  }
  // the basket, hanging off her back side
  ctx.save();
  ctx.translate(-w * 0.5, -h * 0.24);
  ctx.rotate(Math.sin(t * 2) * 0.05);
  ctx.fillStyle = '#d8b07a';
  ctx.strokeStyle = '#a07a48';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-10, 0, 20, 14, [2, 2, 6, 6]);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 9, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#8fe0c8'; // a bottle poking out
  ctx.fillRect(2, -6, 4, 8);
  ctx.restore();
  // the sun hat: a wide floppy straw brim, a round crown, a teal ribbon
  const by = -h * 0.86;
  ctx.fillStyle = '#f2dca0';
  ctx.strokeStyle = '#c8a860';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, by, w * 0.7, 7 + Math.sin(t * 1.5) * 0.6, 0.04, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, by - 4, w * 0.34, 14, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5ab0b0';
  ctx.fillRect(-w * 0.34, by - 6, w * 0.68, 4);
  ctx.strokeStyle = 'rgba(200,168,96,0.6)'; // straw weave
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let x = -w * 0.6; x < w * 0.6; x += 6) {
    ctx.moveTo(x, by - 3);
    ctx.lineTo(x + 2, by + 4);
  }
  ctx.stroke();
  ctx.restore();
}
