// Docs: docs/places/glacier.md, docs/combat/stages.md
// The Rimeglass Glacier's art that isn't the room itself (src/glacier.js): its creatures (snow hare, snow
// petrel, glacier ram, rime wolf, frost wraith, great yeti and Old Rimehorn, the field boss; GLACIER_MOB_ART,
// called by drawMob in src/field.js), the gear sold and dropped there (GLACIER_SWORDS, GLACIER_SWORD_LEN,
// GLACIER_HELMETS, drawn by drawSword / drawHelmet in src/field.js; the staves are data in src/staff-art.js),
// its materials' icons (GLACIER_ICONS) and Ice-Cutter Eyvind's clothes (drawIcecutterDress, src/slime.js).
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const RIME = '200,235,255';
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
// a little icicle hanging from (x, y)
function icicle(ctx, x, y, len, w = 2.4) {
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + len);
  ctx.closePath();
  ctx.fill();
}
// shaggy fur: a row of overlapping tufts along a curve, lighter on top
function tufts(ctx, x0, x1, y, n, r, col) {
  ctx.fillStyle = col;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    ctx.beginPath();
    ctx.ellipse(x, y + (i % 2) * 2, r, r * 1.3, 0, 0, TAU);
    ctx.fill();
  }
}

// Snow hare: a round white hare with long black-tipped ears and big hind feet, hopping. Harmless.
function drawSnowHare(ctx, w, h, t, seed, m, dying) {
  const cy = -h * 0.42;
  const ear = Math.sin(t * 3 + seed) * 0.12;
  // ears, back one first
  for (const [dx, a, col] of [[-w * 0.02, -0.35 + ear, '#e6eef6'], [w * 0.12, -0.15 - ear, '#ffffff']]) {
    ctx.save();
    ctx.translate(w * 0.18 + dx, cy - h * 0.22);
    ctx.rotate(a);
    ctx.fillStyle = col;
    ctx.strokeStyle = '#8aa0b4';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.26, w * 0.08, h * 0.28, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffc8d4';
    ellipse(ctx, 0, -h * 0.24, w * 0.035, h * 0.18);
    ctx.fillStyle = INKC;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.48, w * 0.06, h * 0.07, 0, Math.PI, 0);
    ctx.fill();
    ctx.restore();
  }
  // big hind foot
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#8aa0b4';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-w * 0.12, -h * 0.06, w * 0.24, h * 0.08, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // body and head
  const body = () => {
    ctx.ellipse(-w * 0.06, cy, w * 0.36, h * 0.36, 0, 0, TAU);
    ctx.moveTo(w * 0.42, cy - h * 0.12);
    ctx.ellipse(w * 0.2, cy - h * 0.12, w * 0.22, h * 0.24, 0, 0, TAU);
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.4, 0, 0);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#d8e4f0');
  ctx.fillStyle = g;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // cotton tail, nose, cheeks
  ctx.fillStyle = '#ffffff';
  circle(ctx, -w * 0.42, cy - h * 0.04, w * 0.09);
  ctx.fillStyle = '#ff9fb4';
  circle(ctx, w * 0.4, cy - h * 0.1, 2.2);
  ctx.fillStyle = 'rgba(255,160,180,0.4)';
  ellipse(ctx, w * 0.3, cy - h * 0.02, 4, 2.6);
  face(ctx, w * 0.26, cy - h * 0.16, 0.001, t, seed, { dying, size: 0.85 });
  return () => {
    ctx.beginPath();
    body();
  };
}

// Snow petrel: a pure white seabird with a little black eye and beak, gliding off the seracs. m.warn: wings
// up, about to stoop · m.charging: diving.
function drawSnowPetrel(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const cy = -h * 0.5, bob = live && !dive ? Math.sin(t * 2.2 + seed) * 2 : 0;
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(dive ? 0.55 : 0);
  const flap = dive ? -1 : warn ? -0.6 + Math.sin(t * 18) * 0.15 : Math.sin(t * 3.4 + seed) * 0.3;
  const wing = (s, a) => {
    ctx.save();
    ctx.translate(-w * 0.02, cy - 2);
    ctx.rotate(a * s);
    ctx.scale(1, s);
    ctx.fillStyle = s > 0 ? '#e2eaf2' : '#ffffff';
    ctx.strokeStyle = '#7a8ea4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.3, -h * 0.8, -w * 0.7, -h * 0.5);
    ctx.quadraticCurveTo(-w * 0.35, -h * 0.2, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  wing(1, flap);
  // tail
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#7a8ea4';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, cy - 2);
  ctx.lineTo(-w * 0.5, cy - 4);
  ctx.lineTo(-w * 0.48, cy + 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const body = () => ctx.ellipse(0, cy, w * 0.3, h * 0.27, 0, 0, TAU);
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  const hx = w * 0.3, hy = cy - h * 0.1;
  ctx.beginPath();
  ctx.arc(hx, hy, h * 0.22, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // the stubby black tube beak
  ctx.fillStyle = '#2d2a3e';
  ctx.beginPath();
  ctx.moveTo(hx + h * 0.18, hy - 3);
  ctx.quadraticCurveTo(hx + h * 0.42, hy - 1, hx + h * 0.4, hy + 3);
  ctx.lineTo(hx + h * 0.18, hy + 3);
  ctx.closePath();
  ctx.fill();
  face(ctx, hx + h * 0.04, hy - 2, 0.1, t, seed, { dying, size: 0.7 });
  if (warn) {
    ctx.strokeStyle = INKC;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx - 3, hy - 8);
    ctx.lineTo(hx + 5, hy - 6);
    ctx.stroke();
  }
  wing(-1, flap * 0.8);
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, cy + bob, w * 0.3, h * 0.27, 0, 0, TAU);
    ctx.moveTo(hx + h * 0.22, hy + bob);
    ctx.arc(hx, hy + bob, h * 0.22, 0, TAU);
  };
}

// Glacier ram: a stocky mountain sheep with a shaggy cream fleece, rime in it, and great curled horns in
// front that take most of a hit (hit it from behind). m.warn: head down, horns forward · m.charging: butts.
function drawGlacierRam(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, butt = !!m.charging && live;
  const cy = -h * 0.55, step = m.walking || butt ? Math.sin(t * 9) * 3 : 0;
  // legs
  ctx.fillStyle = '#5a5060';
  ctx.strokeStyle = '#3a3240';
  ctx.lineWidth = 1.4;
  for (const [x, s] of [[-0.3, 1], [-0.14, -1], [0.16, 1], [0.3, -1]]) {
    ctx.beginPath();
    ctx.roundRect(w * x - 4, -h * 0.34 + s * step * 0.3, 8, h * 0.34, 3);
    ctx.fill();
    ctx.stroke();
  }
  // the fleece
  const body = () => ctx.ellipse(-w * 0.04, cy, w * 0.4, h * 0.34, 0, 0, TAU);
  ctx.fillStyle = '#ece4d4';
  ctx.strokeStyle = '#8a7e6e';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f8f2e6';
  for (let i = 0; i < 9; i++) circle(ctx, -w * 0.34 + (i % 5) * w * 0.15, cy - h * 0.18 + Math.floor(i / 5) * h * 0.2, w * 0.07);
  ctx.fillStyle = `rgba(${RIME},0.8)`;
  for (let i = 0; i < 5; i++) icicle(ctx, -w * 0.3 + i * w * 0.14, cy + h * 0.28, 4 + (i % 3) * 3, 1.6);
  // head: dark face, lowered when it's about to butt
  const dip = warn || butt ? h * 0.14 : 0;
  const hx = w * 0.36, hy = cy - h * 0.06 + dip;
  ctx.fillStyle = '#6a5e6a';
  ctx.strokeStyle = '#3a3240';
  ctx.beginPath();
  ctx.ellipse(hx, hy, w * 0.13, h * 0.2, 0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f8f2e6';
  ellipse(ctx, hx - w * 0.06, hy - h * 0.16, w * 0.08, h * 0.08); // forelock
  face(ctx, hx + w * 0.03, hy - h * 0.02, 0.001, t, seed, { dying, size: 0.75 });
  // the great curled horns, frosted
  ctx.strokeStyle = '#bfae90';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(hx - w * 0.02, hy - h * 0.06, h * 0.2, Math.PI * 1.05, Math.PI * 2.55);
  ctx.stroke();
  ctx.strokeStyle = '#8a7a5e';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (1.15 + i * 0.22);
    ctx.beginPath();
    ctx.moveTo(hx - w * 0.02 + Math.cos(a) * h * 0.16, hy - h * 0.06 + Math.sin(a) * h * 0.16);
    ctx.lineTo(hx - w * 0.02 + Math.cos(a) * h * 0.24, hy - h * 0.06 + Math.sin(a) * h * 0.24);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(${RIME},0.9)`;
  ellipse(ctx, hx - w * 0.04, hy - h * 0.26, 5, 2);
  if (warn) halo(ctx, hx + w * 0.08, hy, h * 0.3, '255,255,255', 0.35);
  return () => {
    ctx.beginPath();
    body();
    ctx.moveTo(hx + w * 0.13, hy);
    ctx.ellipse(hx, hy, w * 0.13, h * 0.2, 0.3, 0, TAU);
  };
}

// Rime wolf: a lean grey-white wolf, the tips of its fur iced, pale blue eyes. m.special: gone into a whirl
// of snow (coming round behind you) · m.warn: crouched, snarling, about to snap.
function drawRimeWolf(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, gone = !!m.special && live, warn = !!m.warn && live;
  if (gone) {
    // a little whirl of snow skittering along
    ctx.fillStyle = 'rgba(240,248,255,0.85)';
    for (let i = 0; i < 9; i++) {
      const a = t * 9 + i * 0.7;
      circle(ctx, Math.cos(a) * w * 0.25, -h * 0.3 + Math.sin(a) * h * 0.2 - i, 2.2 + (i % 3));
    }
    return () => {
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.3, w * 0.3, h * 0.3, 0, 0, TAU);
    };
  }
  const crouch = warn ? h * 0.1 : 0, step = m.walking ? Math.sin(t * 13 + seed) : 0;
  const cy = -h * 0.55 + crouch;
  // legs
  ctx.strokeStyle = '#7a8494';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const [x, s] of [[-0.28, 1], [-0.16, -1], [0.18, -1], [0.3, 1]]) {
    ctx.beginPath();
    ctx.moveTo(w * x, cy + h * 0.1);
    ctx.lineTo(w * x + s * step * 5, -2);
    ctx.stroke();
  }
  // bushy tail
  ctx.fillStyle = '#c8d0dc';
  ctx.strokeStyle = '#6a7484';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, cy - h * 0.05);
  ctx.quadraticCurveTo(-w * 0.6, cy - h * 0.1 + Math.sin(t * 4) * 3, -w * 0.56, cy + h * 0.25);
  ctx.quadraticCurveTo(-w * 0.45, cy + h * 0.1, -w * 0.32, cy + h * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // body
  const body = () => ctx.ellipse(-w * 0.02, cy, w * 0.36, h * 0.24, 0, 0, TAU);
  const g = ctx.createLinearGradient(0, cy - h * 0.25, 0, cy + h * 0.25);
  g.addColorStop(0, '#9aa4b4');
  g.addColorStop(1, '#e6ecf4');
  ctx.fillStyle = g;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // iced ruff along the back
  ctx.fillStyle = `rgba(${RIME},0.9)`;
  for (let i = 0; i < 6; i++) icicle(ctx, -w * 0.24 + i * w * 0.08, cy - h * 0.2, -6 - (i % 2) * 3, 2);
  // head with pointed ears and a long muzzle
  const hx = w * 0.34, hy = cy - h * 0.12 + crouch * 0.4;
  ctx.fillStyle = '#c8d0dc';
  ctx.strokeStyle = '#6a7484';
  for (const dx of [-6, 3]) {
    ctx.beginPath();
    ctx.moveTo(hx + dx - 4, hy - h * 0.14);
    ctx.lineTo(hx + dx, hy - h * 0.38);
    ctx.lineTo(hx + dx + 5, hy - h * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(hx, hy, w * 0.14, h * 0.2, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#eef2f8';
  ctx.beginPath();
  ctx.ellipse(hx + w * 0.13, hy + h * 0.05, w * 0.1, h * 0.09, 0.1, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INKC;
  circle(ctx, hx + w * 0.22, hy + h * 0.02, 2.4);
  if (warn) {
    ctx.fillStyle = '#ffffff'; // teeth
    for (let i = 0; i < 3; i++) icicle(ctx, hx + w * 0.08 + i * 4, hy + h * 0.12, 4, 1.4);
  }
  if (live) halo(ctx, hx + w * 0.02, hy - h * 0.05, 8, '150,210,255', 0.6);
  ctx.fillStyle = live ? '#bfe6ff' : '#6a7484';
  if (dying > 0.05) face(ctx, hx + w * 0.02, hy - h * 0.05, 0.001, t, seed, { dying, size: 0.7 });
  else {
    ellipse(ctx, hx + w * 0.02, hy - h * 0.05, 2.6, warn ? 1.4 : 2.4);
    ctx.fillStyle = INKC;
    circle(ctx, hx + w * 0.03, hy - h * 0.05, 1.1);
  }
  return () => {
    ctx.beginPath();
    body();
    ctx.moveTo(hx + w * 0.14, hy);
    ctx.ellipse(hx, hy, w * 0.14, h * 0.2, 0, 0, TAU);
  };
}

// Frost wraith: a hooded shape of blowing snow, two cold blue eyes in the hood and ragged wisps for a hem.
// m.special: faded into the snow (can't be hurt), about to pulse out of it.
function drawFrostWraith(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  const cy = -h * 0.55, sway = Math.sin(t * 1.8 + seed) * 3;
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.2 + 0.1 * Math.sin(t * 20);
  halo(ctx, 0, cy, w * 0.9, RIME, 0.3);
  // the ragged hem: wisps streaming back
  ctx.fillStyle = 'rgba(225,240,252,0.8)';
  for (let i = 0; i < 5; i++) {
    const x = -w * 0.3 + i * w * 0.14, wav = Math.sin(t * 5 + i * 1.3) * 4;
    ctx.beginPath();
    ctx.moveTo(x - 5, cy + h * 0.2);
    ctx.quadraticCurveTo(x - 8 + wav, cy + h * 0.38, x - 14 + wav, cy + h * 0.5);
    ctx.lineTo(x + 5, cy + h * 0.2);
    ctx.closePath();
    ctx.fill();
  }
  // the cloak and hood
  const body = () => {
    ctx.moveTo(-w * 0.36, cy + h * 0.26);
    ctx.quadraticCurveTo(-w * 0.44 + sway * 0.4, cy - h * 0.1, -w * 0.12, cy - h * 0.42);
    ctx.quadraticCurveTo(w * 0.2, cy - h * 0.55, w * 0.36, cy - h * 0.2);
    ctx.quadraticCurveTo(w * 0.4 + sway * 0.4, cy + h * 0.1, w * 0.3, cy + h * 0.26);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.5, 0, cy + h * 0.3);
  g.addColorStop(0, '#f4faff');
  g.addColorStop(1, '#a8c8e4');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(110,150,190,0.8)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // the dark inside of the hood, two blue eyes
  ctx.fillStyle = '#2a3e5a';
  ctx.beginPath();
  ctx.ellipse(w * 0.1, cy - h * 0.18, w * 0.18, h * 0.16, 0.1, 0, TAU);
  ctx.fill();
  if (dying > 0.05) face(ctx, w * 0.12, cy - h * 0.18, 4, t, seed, { dying, size: 0.7 });
  else {
    for (const ex of [w * 0.04, w * 0.18]) {
      halo(ctx, ex, cy - h * 0.18, 7, '140,210,255', 0.8);
      ctx.fillStyle = '#d8f2ff';
      circle(ctx, ex, cy - h * 0.18, 2.2);
    }
  }
  // flakes whirling round it
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 6; i++) {
    const a = t * 2.4 + i * 1.05;
    circle(ctx, Math.cos(a) * w * 0.5, cy + Math.sin(a) * h * 0.35, 1.4 + (i % 2));
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Great yeti: a big shaggy white ape-ish beast with a blue face and a grumpy brow (the cubs Tove feeds grow
// up into these). It throws snowballs. m.warn: an arm up with a snowball, about to throw.
function drawGreatYeti(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const step = m.walking ? Math.sin(t * 8 + seed) * 3 : 0;
  const cy = -h * 0.48;
  // legs
  ctx.fillStyle = '#e8eef6';
  ctx.strokeStyle = '#7a8ca4';
  ctx.lineWidth = 1.8;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * w * 0.18, -h * 0.1 + (s > 0 ? step : -step) * 0.4, w * 0.13, h * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // the back arm
  ctx.beginPath();
  ctx.ellipse(-w * 0.34, cy + h * 0.08, w * 0.1, h * 0.24, 0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // body: shaggy
  const body = () => ctx.ellipse(0, cy, w * 0.38, h * 0.4, 0, 0, TAU);
  const g = ctx.createLinearGradient(0, cy - h * 0.4, 0, cy + h * 0.4);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#cfdcea');
  ctx.fillStyle = g;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  tufts(ctx, -w * 0.3, w * 0.3, cy - h * 0.36, 6, w * 0.06, '#ffffff');
  ctx.fillStyle = 'rgba(122,140,164,0.35)';
  for (let i = 0; i < 6; i++) ellipse(ctx, -w * 0.22 + i * w * 0.09, cy + h * 0.2 + (i % 2) * 4, 1.4, 5, 0.2);
  // face: a blue patch, small dark eyes under a heavy brow, a wide grumpy mouth
  const fx = w * 0.12, fy = cy - h * 0.1;
  ctx.fillStyle = '#7fa8d4';
  ctx.strokeStyle = '#4e6e94';
  ctx.beginPath();
  ctx.ellipse(fx, fy, w * 0.17, h * 0.16, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  face(ctx, fx, fy - h * 0.03, w * 0.06, t, seed, { dying, size: 0.9 });
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath(); // the brow
  ctx.moveTo(fx - w * 0.14, fy - h * 0.11 + (warn ? 3 : 0));
  ctx.lineTo(fx + w * 0.14, fy - h * 0.11 + (warn ? 3 : 0));
  ctx.stroke();
  ctx.strokeStyle = INKC;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(fx, fy + h * 0.1, w * 0.06, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  // the front arm: hanging, or raised with a snowball
  ctx.fillStyle = '#eef4fa';
  ctx.strokeStyle = '#7a8ca4';
  ctx.lineWidth = 1.8;
  ctx.save();
  ctx.translate(w * 0.3, cy - h * 0.08);
  ctx.rotate(warn ? -2.4 : 0.25 + Math.sin(t * 2 + seed) * 0.05);
  ctx.beginPath();
  ctx.ellipse(0, h * 0.2, w * 0.1, h * 0.24, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (warn) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#a8c0d8';
    ctx.beginPath();
    ctx.arc(0, h * 0.44, w * 0.11, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Old Rimehorn: a mammoth older than the hamlet, red-brown and shaggy to the ground, icicles hanging in his
// coat, a frosted hump, little dark eyes and two great curling tusks, one chipped. Passive until hit; then he
// rears (m.warn) and comes down with a stamp. Airborne (vy) when he leaps.
function drawRimehorn(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, air = Math.abs(m.vy ?? 0) > 1 && live;
  const step = m.walking ? Math.sin(t * 6) * 4 : 0;
  ctx.save();
  if (warn) {
    ctx.translate(-w * 0.2, 0);
    ctx.rotate(-0.22);
    ctx.translate(w * 0.2, 0);
  }
  const cy = -h * 0.55;
  // legs: thick pillars, shaggy at the top
  ctx.fillStyle = '#6a3e2a';
  ctx.strokeStyle = '#3e2418';
  ctx.lineWidth = 2;
  for (const [x, s] of [[-0.3, 1], [-0.14, -1], [0.14, 1], [0.28, -1]]) {
    const lift = air ? h * 0.08 : s * step * 0.4;
    ctx.beginPath();
    ctx.roundRect(w * x - w * 0.06, -h * 0.36 - lift, w * 0.12, h * 0.36, [4, 4, 8, 8]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e8dcc8'; // toenails
    for (const d of [-0.03, 0, 0.03]) ellipse(ctx, w * (x + d), -3 - lift, 2.6, 2);
    ctx.fillStyle = '#6a3e2a';
  }
  // the body and the high domed head and hump
  const body = () => {
    ctx.moveTo(-w * 0.44, cy + h * 0.15);
    ctx.quadraticCurveTo(-w * 0.48, cy - h * 0.3, -w * 0.15, cy - h * 0.36);
    ctx.quadraticCurveTo(w * 0.1, cy - h * 0.48, w * 0.28, cy - h * 0.34);
    ctx.quadraticCurveTo(w * 0.46, cy - h * 0.2, w * 0.42, cy + h * 0.1);
    ctx.quadraticCurveTo(w * 0.4, cy + h * 0.26, w * 0.2, cy + h * 0.24);
    ctx.lineTo(-w * 0.36, cy + h * 0.26);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.45, 0, cy + h * 0.3);
  g.addColorStop(0, '#a8654a');
  g.addColorStop(1, '#6e3e2a');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3e2418';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // long shaggy coat hanging down in strands
  ctx.strokeStyle = 'rgba(70,36,22,0.7)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const x = -w * 0.4 + i * w * 0.054, y0 = cy - h * 0.05 + Math.abs(i - 8) * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x - 3 + Math.sin(t * 2 + i) * 2, y0 + h * 0.18, x - 2, cy + h * 0.32 + (i % 3) * 4);
    ctx.stroke();
  }
  // frost on the hump and icicles in the coat
  ctx.fillStyle = 'rgba(240,248,255,0.9)';
  ellipse(ctx, -w * 0.02, cy - h * 0.4, w * 0.16, h * 0.05, -0.1);
  ellipse(ctx, w * 0.2, cy - h * 0.36, w * 0.08, h * 0.035, 0.3);
  ctx.fillStyle = `rgba(${RIME},0.9)`;
  for (let i = 0; i < 8; i++) icicle(ctx, -w * 0.34 + i * w * 0.08, cy + h * 0.28 + (i % 3) * 3, 6 + (i % 3) * 4, 2.2);
  // ear, eye, trunk
  const hx = w * 0.32, hy = cy - h * 0.1;
  ctx.fillStyle = '#5a3020';
  ellipse(ctx, hx - w * 0.1, hy - h * 0.02, w * 0.06, h * 0.1);
  face(ctx, hx + w * 0.02, hy - h * 0.06, 0.001, t, seed, { dying, size: 1.1 });
  ctx.strokeStyle = '#6e3e2a';
  ctx.lineCap = 'round';
  ctx.lineWidth = w * 0.07;
  ctx.beginPath();
  const tsw = warn ? -1 : Math.sin(t * 1.5 + seed) * 0.4;
  ctx.moveTo(hx + w * 0.06, hy + h * 0.04);
  ctx.quadraticCurveTo(hx + w * 0.16, hy + h * 0.26, hx + w * 0.1 + tsw * w * 0.06, hy + h * (warn ? -0.05 : 0.42));
  ctx.stroke();
  // the tusks, ivory, curling up and in; the near one chipped
  for (const [dx, sc, chipped] of [[-w * 0.03, 0.85, false], [0, 1, true]]) {
    ctx.strokeStyle = '#3e2418';
    ctx.lineWidth = w * 0.05 * sc + 2.4;
    const tusk = () => {
      ctx.beginPath();
      ctx.moveTo(hx + dx + w * 0.04, hy + h * 0.12);
      ctx.bezierCurveTo(hx + dx + w * 0.22 * sc, hy + h * 0.4 * sc, hx + dx + w * 0.38 * sc, hy + h * 0.1, hx + dx + w * (chipped ? 0.3 : 0.32) * sc, hy - h * (chipped ? 0.06 : 0.14) * sc);
      ctx.stroke();
    };
    tusk();
    ctx.strokeStyle = sc < 1 ? '#d8c8a8' : '#f2e6c8';
    ctx.lineWidth = w * 0.05 * sc;
    tusk();
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

export const GLACIER_MOB_ART = { snow_hare: drawSnowHare, snow_petrel: drawSnowPetrel, glacier_ram: drawGlacierRam, rime_wolf: drawRimeWolf, frost_wraith: drawFrostWraith, great_yeti: drawGreatYeti, rimehorn: drawRimehorn };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
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
// Ice-Cutter's Cleaver: a heavy square-ended blade of dark iron for cutting ice blocks, a bright ground edge,
// frost on the flat and a plain ash handle
function drawCutterCleaver(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(-6, -L * 0.9);
    ctx.lineTo(7, -L);
    ctx.lineTo(7, -6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-6, 0, 7, 0);
  g.addColorStop(0, '#8a96a6');
  g.addColorStop(1, '#4e5a6a');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2e3644';
  ctx.lineWidth = 1.6;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#e8f2fa'; // the ground edge
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(6, -8);
  ctx.lineTo(6, -L * 0.98);
  ctx.stroke();
  ctx.fillStyle = `rgba(${RIME},${0.35 + 0.4 * glow})`;
  for (let i = 0; i < 4; i++) ellipse(ctx, -1 + (i % 2) * 2, -L * (0.3 + i * 0.16), 2.6, 4);
  ctx.fillStyle = '#4e5a6a';
  ctx.beginPath();
  ctx.roundRect(-8, -8, 17, 4, 2);
  ctx.fill();
  grip(ctx, '#c8a878', '#8a6a48');
  ctx.restore();
}
// Rimefang: a pale curved blade like a wolf's fang, rimed white along its edge, a grey fur wrap at the grip
function drawRimefang(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.quadraticCurveTo(-8, -L * 0.6, 3, -L);
    ctx.quadraticCurveTo(4, -L * 0.6, 5, -6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-6, 0, 5, 0);
  g.addColorStop(0, '#f4f8fc');
  g.addColorStop(1, '#b8c8d8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#5a6a80';
  ctx.lineWidth = 1.6;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(${RIME},${0.5 + 0.5 * glow})`;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-5, -10);
  ctx.quadraticCurveTo(-7.5, -L * 0.6, 2.5, -L * 0.98);
  ctx.stroke();
  ctx.fillStyle = '#9aa4b4';
  ctx.beginPath();
  ctx.roundRect(-9, -9, 18, 5, 2.5);
  ctx.fill();
  grip(ctx, '#c8d0dc', '#7a8494');
  ctx.restore();
}
// Rimehorn Tusk: a greatsword carved from a shed mammoth tusk, yellowed and cracked, curving a little, red-
// brown wool wound round the grip
function drawTuskBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-7, -6);
    ctx.quadraticCurveTo(-9, -L * 0.55, -2, -L);
    ctx.quadraticCurveTo(7, -L * 0.6, 7, -6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-8, 0, 7, 0);
  g.addColorStop(0, '#fbf2dc');
  g.addColorStop(1, '#d2bc90');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#7a6440';
  ctx.lineWidth = 1.8;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,100,64,0.55)'; // growth lines and a crack
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-6, -L * i * 0.15);
    ctx.quadraticCurveTo(0, -L * i * 0.15 - 3, 6, -L * i * 0.15);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(1, -L * 0.3);
  ctx.lineTo(-1, -L * 0.45);
  ctx.lineTo(1, -L * 0.55);
  ctx.stroke();
  ctx.fillStyle = `rgba(${RIME},${0.3 + 0.4 * glow})`;
  ellipse(ctx, -3, -L * 0.75, 3, 6, 0.2);
  ctx.fillStyle = '#6e3e2a';
  ctx.beginPath();
  ctx.roundRect(-11, -9, 22, 6, 3);
  ctx.fill();
  grip(ctx, '#a8654a', '#5a3020');
  ctx.restore();
}
export const GLACIER_SWORDS = { cutter_cleaver: drawCutterCleaver, rimefang: drawRimefang, tusk_blade: drawTuskBlade };
export const GLACIER_SWORD_LEN = { cutter_cleaver: 56, rimefang: 60, tusk_blade: 66 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Ice-Cutter's Cap: a thick fur cap, its flaps tied up on top, snow goggles of carved horn pushed up on it
function drawCutterCap(ctx, w, h) {
  const by = -h * 0.72, rx = w * 0.5;
  ctx.fillStyle = '#8a6a50';
  ctx.strokeStyle = '#4e3a2c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 4);
  ctx.bezierCurveTo(-rx, by - h * 0.42, rx, by - h * 0.42, rx, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8e0d0'; // fur band
  ctx.beginPath();
  ctx.roundRect(-rx * 1.06, by - 2, rx * 2.12, 9, 4.5);
  ctx.fill();
  ctx.stroke();
  // the flaps tied up on top
  ctx.fillStyle = '#e8e0d0';
  for (const s of [-1, 1]) ellipse(ctx, s * rx * 0.35, by - h * 0.3, rx * 0.22, h * 0.07, s * 0.5);
  ctx.strokeStyle = '#4e3a2c';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.15, by - h * 0.33);
  ctx.lineTo(rx * 0.15, by - h * 0.33);
  ctx.stroke();
  // horn goggles with narrow slits
  ctx.fillStyle = '#d8c8a0';
  ctx.strokeStyle = '#7a6440';
  ctx.lineWidth = 1.4;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * rx * 0.3, by - h * 0.12, rx * 0.22, h * 0.06, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2d2a3e';
    ctx.fillRect(s * rx * 0.3 - rx * 0.13, by - h * 0.125, rx * 0.26, 1.6);
    ctx.fillStyle = '#d8c8a0';
  }
}
// Ramhorn Helm: a frosted iron cap with a glacier ram's great curled horns, one each side
function drawRamhornHelm(ctx, w, h) {
  const by = -h * 0.72, rx = w * 0.5;
  for (const s of [-1, 1]) {
    ctx.strokeStyle = '#7a6a4e';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(s * rx * 0.92, by - h * 0.02, h * 0.15, s > 0 ? Math.PI * 1.1 : Math.PI * 1.9, s > 0 ? Math.PI * 2.6 : Math.PI * 0.4, s < 0);
    ctx.stroke();
    ctx.strokeStyle = '#cfbe9a';
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.fillStyle = '#8a96a6';
  ctx.strokeStyle = '#3e4656';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 4);
  ctx.bezierCurveTo(-rx, by - h * 0.4, rx, by - h * 0.4, rx, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b8c4d2';
  ellipse(ctx, -rx * 0.4, by - h * 0.16, rx * 0.2, h * 0.05, -0.3);
  ctx.fillStyle = `rgba(${RIME},0.9)`;
  for (let i = 0; i < 5; i++) icicle(ctx, -rx * 0.7 + i * rx * 0.35, by + 3, 4 + (i % 2) * 3, 1.6);
}
// Woolly Hood: a great shaggy hood of Old Rimehorn's red-brown wool with two little tusks at the brow
function drawMammothHood(ctx, w, h, t) {
  const by = -h * 0.7, rx = w * 0.54;
  ctx.fillStyle = '#8a4e36';
  ctx.strokeStyle = '#4e2a1c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.04, by + 12);
  ctx.bezierCurveTo(-rx * 1.1, by - h * 0.5, rx * 1.1, by - h * 0.5, rx * 1.04, by + 12);
  ctx.quadraticCurveTo(0, by - 2, -rx * 1.04, by + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(70,36,22,0.7)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    const x = -rx * 0.9 + i * rx * 0.225;
    ctx.beginPath();
    ctx.moveTo(x, by - h * 0.22 + Math.abs(i - 4) * 1.5);
    ctx.quadraticCurveTo(x - 2 + Math.sin(t * 2 + i) * 1.5, by - h * 0.06, x - 1, by + 8);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(240,248,255,0.85)';
  ellipse(ctx, -rx * 0.2, by - h * 0.32, rx * 0.4, h * 0.04, -0.1);
  // the little tusks
  ctx.strokeStyle = '#f2e6c8';
  ctx.lineCap = 'round';
  ctx.lineWidth = 3.4;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * rx * 0.3, by + 2);
    ctx.quadraticCurveTo(s * rx * 0.5, by + 10, s * rx * 0.62, by + 2);
    ctx.stroke();
  }
}
export const GLACIER_HELMETS = { cutter_cap: drawCutterCap, ramhorn_helm: drawRamhornHelm, mammoth_hood: drawMammothHood };

// ——— materials' icons (40 × 40, centred) ———
function iconHareTuft(ctx) {
  ctx.fillStyle = '#e6eef6';
  for (const [x, y, r] of [[-7, 3, 9], [4, -2, 11], [10, 6, 7], [-2, 8, 8]]) circle(ctx, x, y, r);
  ctx.fillStyle = '#ffffff';
  for (const [x, y, r] of [[-5, 0, 6], [5, -5, 7]]) circle(ctx, x, y, r);
  ctx.fillStyle = '#2d2a3e';
  ctx.beginPath();
  ctx.ellipse(12, -10, 4, 3, 0.5, 0, TAU);
  ctx.fill();
}
function iconPetrelDown(ctx) {
  ctx.save();
  ctx.rotate(-0.5);
  ctx.fillStyle = '#f4f8fc';
  ctx.strokeStyle = '#8aa0b4';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 16, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#a8b8c8';
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(0, -14);
  for (let i = -10; i < 12; i += 4) {
    ctx.moveTo(0, i);
    ctx.lineTo(-6, i - 4);
    ctx.moveTo(0, i);
    ctx.lineTo(6, i - 4);
  }
  ctx.stroke();
  ctx.restore();
}
function iconRamHorn(ctx) {
  ctx.strokeStyle = '#7a6a4e';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 2, 11, Math.PI * 0.9, Math.PI * 2.5);
  ctx.stroke();
  ctx.strokeStyle = '#cfbe9a';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = '#8a7a5e';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (1 + i * 0.25);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 8, 2 + Math.sin(a) * 8);
    ctx.lineTo(Math.cos(a) * 14, 2 + Math.sin(a) * 14);
    ctx.stroke();
  }
}
function iconWolfPelt(ctx) {
  ctx.fillStyle = '#b8c2d0';
  ctx.strokeStyle = '#6a7484';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-14, -10);
  ctx.quadraticCurveTo(0, -16, 14, -10);
  ctx.lineTo(12, 12);
  ctx.quadraticCurveTo(0, 16, -12, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(${RIME},0.95)`;
  for (let i = 0; i < 5; i++) icicle(ctx, -10 + i * 5, 12 + (i % 2), 5, 1.6);
  ctx.strokeStyle = 'rgba(106,116,132,0.6)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-8 + i * 5, -8);
    ctx.lineTo(-10 + i * 5, 6);
    ctx.stroke();
  }
}
function iconFrozenBreath(ctx) {
  halo(ctx, 0, 2, 18, RIME, 0.5);
  ctx.fillStyle = 'rgba(220,240,255,0.6)';
  ctx.strokeStyle = '#7a9ab8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-8, -8, 16, 22, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#a8865a';
  ctx.fillRect(-4, -14, 8, 6);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 8);
  ctx.quadraticCurveTo(-6, 0, 0, -1);
  ctx.quadraticCurveTo(6, -2, 3, 6);
  ctx.stroke();
}
function iconYetiFur(ctx) {
  ctx.strokeStyle = '#cfdcea';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(-9 + i * 3, -12);
    ctx.quadraticCurveTo(-12 + i * 3, 0, -8 + i * 3 + (i % 2) * 3, 14);
    ctx.stroke();
  }
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-8 + i * 3.4, -12);
    ctx.quadraticCurveTo(-10 + i * 3.4, 0, -7 + i * 3.4, 12);
    ctx.stroke();
  }
  ctx.fillStyle = '#7fa8d4';
  ctx.beginPath();
  ctx.roundRect(-11, -14, 22, 5, 2.5);
  ctx.fill();
}
function iconMammothWool(ctx) {
  ctx.fillStyle = '#8a4e36';
  for (const [x, y, r] of [[-8, 2, 9], [3, -3, 10], [10, 5, 8], [0, 8, 8]]) circle(ctx, x, y, r);
  ctx.strokeStyle = 'rgba(70,36,22,0.7)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(-8 + i * 3.5, 2 + (i % 2) * 3, 4, 0.3, 2.6);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(${RIME},0.95)`;
  icicle(ctx, -6, 10, 6, 1.8);
  icicle(ctx, 6, 12, 5, 1.6);
}
export const GLACIER_ICONS = { hare_tuft: iconHareTuft, petrel_down: iconPetrelDown, ram_horn: iconRamHorn, wolf_pelt: iconWolfPelt, frozen_breath: iconFrozenBreath, yeti_fur: iconYetiFur, mammoth_wool: iconMammothWool };

// Ice-Cutter Eyvind: a fjord-folk slime in a fur cap with the flaps tied up and horn goggles pushed up on it,
// a short frosted beard, a heavy leather apron, and his ice axe over his shoulder (src/slime.js)
export function drawIcecutterDress(ctx, w, h, fx, t) {
  ctx.save();
  // the axe, behind him over the shoulder
  ctx.strokeStyle = '#7a5a44';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, -h * 0.1);
  ctx.lineTo(w * 0.1, -h * 1.15);
  ctx.stroke();
  ctx.fillStyle = '#8a96a6';
  ctx.strokeStyle = '#3e4656';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(w * 0.06, -h * 1.1);
  ctx.lineTo(w * 0.3, -h * 1.2);
  ctx.lineTo(w * 0.26, -h * 1.0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.08, -h * 1.12);
  ctx.lineTo(-w * 0.08, -h * 1.26);
  ctx.lineTo(-w * 0.02, -h * 1.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the apron
  ctx.fillStyle = '#7a5a40';
  ctx.strokeStyle = '#4e3a2c';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -h * 0.42);
  ctx.lineTo(w * 0.34, -h * 0.42);
  ctx.lineTo(w * 0.4, -h * 0.04);
  ctx.quadraticCurveTo(0, h * 0.02, -w * 0.36, -h * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,235,255,0.6)'; // ice chips stuck to it
  for (const [x, y] of [[-0.1, 0.3], [0.15, 0.22], [0.05, 0.12]]) ellipse(ctx, w * x, -h * y, 2, 1.4);
  // the beard
  const fy = -h * 0.42;
  ctx.fillStyle = '#d8dce4';
  ctx.beginPath();
  ctx.moveTo(fx - 9, fy + 4);
  ctx.quadraticCurveTo(fx, fy + 18 + Math.sin(t * 1.2) * 0.6, fx + 9, fy + 4);
  ctx.quadraticCurveTo(fx, fy + 8, fx - 9, fy + 4);
  ctx.fill();
  // the cap (the same as the one he sells)
  drawCutterCap(ctx, w, h);
  ctx.restore();
}
