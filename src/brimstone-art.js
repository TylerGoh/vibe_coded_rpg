// Docs: docs/places/brimstone.md, docs/combat/stages.md
// The Brimstone Fields' art that isn't the room itself (src/brimstone.js): its creatures (brimstone hopper, acid slug,
// vent crab, fume wisp, sulphur kite, chimney spitter, and the Brimstone Condor, its field boss; BRIM_MOB_ART, called by
// drawMob in src/field.js), the gear dropped or sold there (BRIM_SWORDS, BRIM_SWORD_LEN, BRIM_HELMETS, drawn by
// drawSword / drawHelmet in src/field.js; the staves and bows are data in src/staff-art.js and src/bow-art.js), its
// materials' icons (BRIM_ICONS), and Picker Ochre's dress (drawPickerDress: src/slime.js, accessory 'picker').
// Emberdeep's register, harsher up here: sulphur yellow on black crust, acid green, rust, iron; soft and rounded still.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const CRUST = '#4a3e3a', CRUST_D = '#2a2224', CRUST_L = '#6a5a50';
const SUL = '#e8c84a', SUL_L = '#fff07a', SUL_D = '#a8862a';
const ACID = '#c8e070', ACID_D = '#7a9a30';
const IRON = '#8a8490', IRON_D = '#4e4a56';
const RUST = '#9a5a3a';

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, glow = null } = {}) {
  ctx.strokeStyle = INKC;
  ctx.fillStyle = glow ?? INKC;
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
      ellipse(ctx, ex, fy, 2.4 * size, 3.2 * size);
      ctx.fillStyle = '#fff';
      ellipse(ctx, ex + 0.8 * size, fy - 1.3 * size, 0.9 * size, 0.9 * size);
      ctx.fillStyle = glow ?? INKC;
    }
  }
}
// a few yellow puffs of fume lifting off something
function fume(ctx, x, y, spread, t, seed, n = 3, a = 0.4) {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.4 + i / n + seed * 0.13) % 1;
    ctx.fillStyle = `rgba(232,220,130,${a * Math.sin(k * Math.PI)})`;
    circle(ctx, x + Math.sin(k * 5 + i * 2 + seed) * spread, y - k * 28, 3 + k * 6);
  }
}

// Brimstone hopper: a stout grasshopper, yellow with black bands, dusted in sulphur, long hind legs folded like a
// jack-knife. Harmless: it springs about the crust and chirps.
function drawBrimstoneHopper(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, walk = !!m.walking && live;
  const kick = walk ? Math.max(0, Math.sin(t * 9 + seed)) : 0;
  const cy = -h * 0.42;
  // the far legs
  ctx.strokeStyle = SUL_D;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.12, cy + h * 0.1);
  ctx.lineTo(w * 0.18, 0);
  ctx.moveTo(w * 0.24, cy + h * 0.08);
  ctx.lineTo(w * 0.34, 0);
  ctx.stroke();
  // the body
  const body = () => ctx.ellipse(0, cy, w * 0.36, h * 0.24, -0.08, 0, TAU);
  ctx.fillStyle = SUL;
  ctx.strokeStyle = SUL_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // black bands and a folded wing
  ctx.save();
  ctx.beginPath();
  body();
  ctx.clip();
  ctx.fillStyle = CRUST_D;
  for (const x of [-0.24, -0.1, 0.04]) ctx.fillRect(w * x, cy - h * 0.3, w * 0.05, h * 0.6);
  ctx.restore();
  ctx.fillStyle = 'rgba(120,100,60,0.55)';
  ctx.beginPath();
  ctx.moveTo(w * 0.1, cy - h * 0.16);
  ctx.quadraticCurveTo(-w * 0.2, cy - h * 0.3, -w * 0.4, cy - h * 0.06);
  ctx.quadraticCurveTo(-w * 0.1, cy - h * 0.06, w * 0.1, cy - h * 0.16);
  ctx.fill();
  // the big hind leg: thigh up and back, shin down (straightened when it kicks off)
  const kx = -w * 0.18 - kick * w * 0.1, ky = cy - h * (0.38 - kick * 0.2);
  ctx.strokeStyle = SUL_D;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-w * 0.02, cy + h * 0.02);
  ctx.lineTo(kx, ky);
  ctx.stroke();
  ctx.strokeStyle = CRUST;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(kx, ky);
  ctx.lineTo(-w * 0.34 - kick * w * 0.14, -kick * h * 0.04);
  ctx.stroke();
  // the head, big-eyed, and feelers
  ctx.fillStyle = SUL;
  ctx.strokeStyle = SUL_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(w * 0.34, cy - h * 0.06, w * 0.14, h * 0.2, 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = CRUST;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.38, cy - h * 0.22);
  ctx.quadraticCurveTo(w * 0.5, cy - h * 0.7, w * 0.62, cy - h * 0.62 + Math.sin(t * 5 + seed) * 2);
  ctx.moveTo(w * 0.34, cy - h * 0.22);
  ctx.quadraticCurveTo(w * 0.4, cy - h * 0.76, w * 0.5, cy - h * 0.8);
  ctx.stroke();
  eyes(ctx, w * 0.38, cy - h * 0.1, 0.1, t, seed, { dying, size: 0.6 });
  // a puff of sulphur dust when it lands
  if (walk && kick < 0.1) fume(ctx, -w * 0.2, -2, 6, t, seed, 2, 0.35);
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(w * 0.34, cy - h * 0.06, w * 0.14, h * 0.2, 0.2, 0, TAU);
  };
}

// Acid slug: a fat, glassy, green-yellow slug you can half see through, a darker gut inside, two eyestalks, a drip
// of acid off its tail. It leaves a smoking trail of acid behind it (the `trail` brain, acid style).
function drawAcidSlug(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, walk = !!m.walking && live;
  const ph = walk ? Math.sin(t * 5 + seed) : Math.sin(t * 1.5 + seed) * 0.3;
  const body = () => {
    ctx.moveTo(-w * 0.5, 0);
    ctx.quadraticCurveTo(-w * 0.44, -h * (0.5 + ph * 0.05), -w * 0.06, -h * 0.66);
    ctx.quadraticCurveTo(w * 0.3, -h * 0.82, w * 0.44, -h * 0.46);
    ctx.quadraticCurveTo(w * 0.5, -h * 0.16, w * 0.4, 0);
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(200,224,112,0.85)';
  ctx.strokeStyle = ACID_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(122,154,48,0.5)'; // its gut, seen through
  ellipse(ctx, -w * 0.04, -h * 0.3, w * 0.22, h * 0.14);
  ctx.fillStyle = 'rgba(255,255,220,0.5)'; // a wet shine
  ellipse(ctx, -w * 0.1, -h * 0.54, w * 0.16, h * 0.06, -0.15);
  // the eyestalks
  ctx.strokeStyle = ACID_D;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  const sway = Math.sin(t * 2 + seed) * 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, -h * 0.66);
  ctx.lineTo(w * 0.36 + sway, -h * 1.08);
  ctx.moveTo(w * 0.38, -h * 0.6);
  ctx.lineTo(w * 0.5 + sway, -h * 0.98);
  ctx.stroke();
  eyes(ctx, w * 0.43 + sway, -h * 1.04, w * 0.07, t, seed, { dying, size: 0.6 });
  // a drip of acid off the tail, and a thread of fume
  if (live) {
    const k = (t * 0.8 + seed) % 1;
    ctx.fillStyle = ACID;
    circle(ctx, -w * 0.46, -h * 0.06 + k * 6, 2 * (1 - k) + 0.6);
    fume(ctx, -w * 0.2, -h * 0.5, 4, t, seed, 2, 0.25);
  }
  return () => {
    ctx.beginPath();
    body();
  };
}

// Vent crab: a squat crab whose back is a little crusted vent, yellow crystals round a hole that puffs fume; two heavy
// claws held up in front. It turns that crust and those claws to you (the `shell` brain), raises them (m.warn) and
// lunges (m.charging). Go round behind.
function drawVentCrab(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, ram = !!m.charging && live;
  const step = m.walking || ram ? Math.sin(t * 12) * 2 : 0;
  const cy = -h * 0.42;
  // legs
  ctx.strokeStyle = CRUST;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const x = -w * 0.2 + i * w * 0.16, s = (i % 2 ? 1 : -1) * step;
    ctx.moveTo(x, cy + h * 0.14);
    ctx.lineTo(x - w * 0.1, cy + h * 0.24 + s);
    ctx.lineTo(x - w * 0.14, 0);
  }
  ctx.stroke();
  // the shell: a dome crusted yellow, a vent in the top
  const shell = () => ctx.ellipse(-w * 0.04, cy, w * 0.36, h * 0.3, 0, 0, TAU);
  ctx.fillStyle = CRUST;
  ctx.strokeStyle = CRUST_D;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  shell();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SUL;
  for (const [x, y, r] of [[-0.2, -0.2, 0.08], [0.0, -0.26, 0.07], [0.14, -0.16, 0.06], [-0.3, -0.04, 0.05]]) ellipse(ctx, w * x, cy + h * y, w * r, h * r * 0.9);
  ctx.fillStyle = SUL_L;
  for (const [x, y] of [[-0.22, -0.26], [0.02, -0.3], [0.12, -0.2]]) {
    ctx.beginPath();
    ctx.moveTo(w * x - 2, cy + h * y + 2);
    ctx.lineTo(w * x, cy + h * y - 5);
    ctx.lineTo(w * x + 2, cy + h * y + 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = CRUST_D;
  ellipse(ctx, -w * 0.08, cy - h * 0.28, w * 0.06, h * 0.04);
  if (live) fume(ctx, -w * 0.08, cy - h * 0.3, 4, t, seed, warn ? 4 : 2, warn ? 0.6 : 0.35);
  // the claws, held up in front (raised on the warn, thrust forward in the lunge)
  const lift = warn ? -h * 0.2 : ram ? h * 0.02 : 0, reach = ram ? w * 0.12 : 0;
  for (const [dy, s] of [[-0.06, 1], [0.1, 0.85]]) {
    const x = w * 0.38 + reach, y = cy + h * dy + lift;
    ctx.fillStyle = s === 1 ? CRUST_L : CRUST;
    ctx.strokeStyle = CRUST_D;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.14 * s, h * 0.13 * s, -0.3, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = SUL;
    ellipse(ctx, x + w * 0.04, y - h * 0.04, w * 0.04, h * 0.03);
    ctx.strokeStyle = CRUST_D;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.04, y);
    ctx.lineTo(x + w * 0.14 * s, y - h * 0.02);
    ctx.stroke();
  }
  eyes(ctx, w * 0.22, cy - h * 0.26, 0.08 * w, t, seed, { dying, size: 0.6 });
  return () => {
    ctx.beginPath();
    shell();
  };
}

// Fume wisp: a little yellow-green cloud of fume with a soft glowing heart and two sleepy eyes, wisps trailing off it.
// It fades into the fumes and pulses out of them (the `phase` brain).
function drawFumeWisp(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  const cy = -h * 0.5 + Math.sin(t * 2 + seed) * 3;
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.18 + 0.08 * Math.sin(t * 20);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + t * 0.6;
    ctx.fillStyle = `rgba(222,226,130,${0.45 + 0.1 * Math.sin(t * 2 + i)})`;
    circle(ctx, Math.cos(a) * w * 0.2, cy + Math.sin(a) * h * 0.16, w * 0.24);
  }
  ctx.fillStyle = 'rgba(255,244,150,0.85)';
  circle(ctx, 0, cy, w * 0.22);
  ctx.fillStyle = 'rgba(255,255,220,0.8)';
  circle(ctx, -w * 0.04, cy - h * 0.04, w * 0.1);
  // trailing threads
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.6 + i / 3 + seed * 0.2) % 1;
    ctx.fillStyle = `rgba(222,226,130,${0.5 * (1 - k)})`;
    circle(ctx, -w * 0.3 - k * 18, cy + h * 0.2 + Math.sin(k * 6 + i) * 4, 5 * (1 - k) + 1);
  }
  eyes(ctx, w * 0.06, cy - 1, 4, t, seed, { dying, size: 0.55 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.44, h * 0.34, 0, 0, TAU);
  };
}

// Sulphur kite: a lean bird of prey, rust above and pale yellow below, with a long forked tail; it hangs on the vents'
// heat over the crust, tilts (m.warn) and stoops (m.charging).
function drawSulphurKite(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const flap = dive ? -0.9 : warn ? -0.6 : Math.sin(t * 4 + seed) * 0.35;
  const cy = -h * 0.55;
  ctx.save();
  if (dive || warn) {
    ctx.translate(0, cy);
    ctx.rotate(dive ? 0.9 : 0.35);
    ctx.translate(0, -cy);
  }
  const wing = (s) => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.04, cy - h * 0.04);
    ctx.quadraticCurveTo(-w * 0.16, cy - s * h * 0.1 + flap * h * 0.5, -w * 0.48, cy + flap * h * 0.7 - s * 4);
    ctx.lineTo(-w * 0.4, cy + flap * h * 0.5 + h * 0.06);
    ctx.quadraticCurveTo(-w * 0.2, cy + h * 0.12, -w * 0.0, cy + h * 0.08);
    ctx.closePath();
  };
  ctx.fillStyle = '#7a4a30';
  wing(-1);
  ctx.fill();
  // the forked tail
  ctx.fillStyle = RUST;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy - h * 0.02);
  ctx.lineTo(-w * 0.46, cy - h * 0.14);
  ctx.lineTo(-w * 0.38, cy + h * 0.0);
  ctx.lineTo(-w * 0.48, cy + h * 0.12);
  ctx.lineTo(-w * 0.2, cy + h * 0.08);
  ctx.closePath();
  ctx.fill();
  // body: rust back, pale yellow breast
  const body = () => ctx.ellipse(0, cy, w * 0.26, h * 0.18, 0, 0, TAU);
  ctx.fillStyle = '#f0dc8a';
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = RUST;
  ellipse(ctx, -w * 0.04, cy - h * 0.08, w * 0.22, h * 0.09);
  // near wing, barred at the tips
  ctx.fillStyle = '#9a5a36';
  ctx.strokeStyle = '#5a3420';
  wing(1);
  ctx.fill();
  ctx.stroke();
  // the head and hooked bill
  ctx.fillStyle = '#f4e8b8';
  ctx.beginPath();
  ctx.ellipse(w * 0.26, cy - h * 0.12, w * 0.1, h * 0.14, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = SUL_D;
  ctx.beginPath();
  ctx.moveTo(w * 0.33, cy - h * 0.14);
  ctx.quadraticCurveTo(w * 0.44, cy - h * 0.14, w * 0.42, cy - h * 0.02);
  ctx.lineTo(w * 0.33, cy - h * 0.06);
  ctx.closePath();
  ctx.fill();
  eyes(ctx, w * 0.28, cy - h * 0.16, 0.1, t, seed, { dying, size: 0.55 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(w * 0.26, cy - h * 0.12, w * 0.1, h * 0.14, 0, 0, TAU);
  };
}

// Chimney spitter: a little sulphur chimney grown up out of the crust, yellow-crusted and black inside, with a face
// near the top and a fume always lifting off it. Rooted (it can't move); it swells and spits a glob of burning
// sulphur (the `lob` brain, sulphur style)
function drawChimneySpitter(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const swell = warn ? 1.1 + 0.04 * Math.sin(t * 30) : 1;
  const chim = () => {
    ctx.moveTo(-w * 0.5, 0);
    ctx.quadraticCurveTo(-w * 0.36 * swell, -h * 0.5, -w * 0.2 * swell, -h * 0.94);
    ctx.lineTo(w * 0.2 * swell, -h * 0.94);
    ctx.quadraticCurveTo(w * 0.36 * swell, -h * 0.5, w * 0.5, 0);
    ctx.closePath();
  };
  ctx.fillStyle = CRUST;
  ctx.strokeStyle = CRUST_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  chim();
  ctx.fill();
  ctx.stroke();
  // yellow crust in bands and drips down it
  ctx.save();
  ctx.beginPath();
  chim();
  ctx.clip();
  ctx.fillStyle = SUL;
  for (const [y, a] of [[-0.86, 1], [-0.6, 0.7], [-0.3, 0.5]]) {
    ctx.globalAlpha = a;
    ctx.fillRect(-w * 0.6, -h * (-y) - 4, w * 1.2, 6);
  }
  ctx.globalAlpha = 1;
  for (const x of [-0.18, 0.06, 0.2]) {
    ctx.beginPath();
    ctx.ellipse(w * x, -h * 0.78, 2.5, 8, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // the mouth at the top, glowing on the warn
  ctx.fillStyle = CRUST_D;
  ellipse(ctx, 0, -h * 0.94, w * 0.2 * swell, 4);
  if (warn) {
    ctx.fillStyle = 'rgba(255,240,120,0.9)';
    ellipse(ctx, 0, -h * 0.94, w * 0.14, 2.6);
  }
  if (live) fume(ctx, 0, -h * 0.98, 4, t, seed, warn ? 4 : 2, warn ? 0.6 : 0.35);
  eyes(ctx, 0, -h * 0.6, 4.5, t, seed, { dying, size: 0.6, glow: warn ? '#a8862a' : null });
  return () => {
    ctx.beginPath();
    chim();
  };
}

// The Brimstone Condor (field boss): a great bald vulture, its wings as long as a hut and ragged at the tips, crusted
// yellow along the leading edges from riding the vents; a ruff of grey down, a bare grey-pink head and a hooked
// pale bill. It wheels on the fumes over the High Vents and falls on whatever moves (the `dive` brain).
function drawBrimstoneCondor(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const flap = dive ? -0.8 : warn ? -0.5 : Math.sin(t * 1.8 + seed) * 0.22;
  const cy = -h * 0.5;
  ctx.save();
  if (dive || warn) {
    ctx.translate(0, cy);
    ctx.rotate(dive ? 0.7 : 0.25);
    ctx.translate(0, -cy);
  }
  const wing = (s) => {
    ctx.beginPath();
    ctx.moveTo(w * 0.04, cy - h * 0.06);
    ctx.quadraticCurveTo(-w * 0.12, cy - h * 0.3 * s + flap * h * 0.6, -w * 0.5, cy - h * 0.1 + flap * h * 0.9);
    // ragged fingers at the tip
    for (let i = 0; i < 5; i++) {
      const fx = -w * (0.5 - i * 0.04), fy = cy - h * 0.1 + flap * h * (0.9 - i * 0.1) + h * 0.06 * i;
      ctx.lineTo(fx - 6, fy + 8);
      ctx.lineTo(fx + 2, fy + 10);
    }
    ctx.quadraticCurveTo(-w * 0.16, cy + h * 0.2, w * 0.02, cy + h * 0.12);
    ctx.closePath();
  };
  ctx.fillStyle = '#2a2428';
  wing(-1);
  ctx.fill();
  // the tail
  ctx.fillStyle = '#2e282c';
  ctx.beginPath();
  ctx.moveTo(-w * 0.14, cy);
  ctx.lineTo(-w * 0.34, cy + h * 0.04);
  ctx.lineTo(-w * 0.3, cy + h * 0.16);
  ctx.lineTo(-w * 0.1, cy + h * 0.12);
  ctx.closePath();
  ctx.fill();
  // the body
  const body = () => ctx.ellipse(w * 0.02, cy + h * 0.02, w * 0.2, h * 0.22, 0, 0, TAU);
  ctx.fillStyle = '#3a3236';
  ctx.strokeStyle = '#1a1618';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // the near wing, with the yellow crust along its leading edge
  ctx.fillStyle = '#3e363a';
  ctx.strokeStyle = '#1a1618';
  wing(1);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = SUL;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.02, cy - h * 0.06);
  ctx.quadraticCurveTo(-w * 0.12, cy - h * 0.3 + flap * h * 0.6, -w * 0.44, cy - h * 0.1 + flap * h * 0.9);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,122,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // the white secondaries' band
  ctx.strokeStyle = 'rgba(230,226,220,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.04, cy + h * 0.06);
  ctx.quadraticCurveTo(-w * 0.18, cy + flap * h * 0.5, -w * 0.32, cy + h * 0.02 + flap * h * 0.7);
  ctx.stroke();
  // the ruff of grey down
  ctx.fillStyle = '#c8c2c4';
  for (let i = 0; i < 7; i++) circle(ctx, w * 0.14 + Math.cos(i) * 6, cy - h * 0.14 + Math.sin(i * 1.3) * 5, 7);
  // the bare head and neck, grey-pink, and the hooked bill
  ctx.fillStyle = '#c89a94';
  ctx.strokeStyle = '#7a5a56';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(w * 0.26, cy - h * 0.24, w * 0.08, h * 0.12, 0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8e0c8';
  ctx.beginPath();
  ctx.moveTo(w * 0.31, cy - h * 0.3);
  ctx.quadraticCurveTo(w * 0.42, cy - h * 0.3, w * 0.4, cy - h * 0.16);
  ctx.lineTo(w * 0.32, cy - h * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  eyes(ctx, w * 0.28, cy - h * 0.28, 0.1, t, seed, { dying, size: 0.9 });
  ctx.restore();
  // fume rising past it off the vents below
  if (live) fume(ctx, -w * 0.1, cy + h * 0.3, 20, t, seed, 3, 0.25);
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(w * 0.26, cy - h * 0.24, w * 0.08, h * 0.12, 0.3, 0, TAU);
  };
}

export const BRIM_MOB_ART = { brimstone_hopper: drawBrimstoneHopper, acid_slug: drawAcidSlug, vent_crab: drawVentCrab, fume_wisp: drawFumeWisp, sulphur_kite: drawSulphurKite, chimney_spitter: drawChimneySpitter, brimstone_condor: drawBrimstoneCondor };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
function woodGrip(ctx, c = '#6a4a34') {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.fillStyle = IRON;
  ctx.fillRect(-6, -5, 12, 3.5);
  circle(ctx, 0, 12, 2.4);
}
// Brimstone Pick: a picker's pick, a worn pale haft and a short iron head with a long chisel point, crusted yellow
function drawBrimstonePick(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,230,110,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = '#c8a878'; // the haft
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.86, 5.2, L * 0.86, 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = IRON_D; // the head: a short back, a long chisel point
  ctx.beginPath();
  ctx.moveTo(-8, -L * 0.82);
  ctx.lineTo(-4, -L * 0.92);
  ctx.lineTo(4, -L * 0.92);
  ctx.lineTo(L * 0.34, -L * 0.8);
  ctx.lineTo(L * 0.36, -L * 0.76);
  ctx.lineTo(4, -L * 0.8);
  ctx.lineTo(-4, -L * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SUL;
  ellipse(ctx, L * 0.12, -L * 0.8, 4, 2);
  ellipse(ctx, -5, -L * 0.84, 2.4, 1.6);
  woodGrip(ctx);
  ctx.restore();
}
// Kitetalon: a hooked iron blade like a kite's talon, its edge stained yellow
function drawKitetalon(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,220,100,0.85)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.moveTo(-3.5, -5);
  ctx.quadraticCurveTo(-5, -L * 0.6, -1, -L * 0.92);
  ctx.quadraticCurveTo(6, -L * 1.02, 9, -L * 0.88);
  ctx.quadraticCurveTo(3, -L * 0.86, 3, -L * 0.6);
  ctx.lineTo(3.5, -5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = SUL; // the stained edge
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-3.5, -8);
  ctx.quadraticCurveTo(-5, -L * 0.6, -1, -L * 0.92);
  ctx.stroke();
  ctx.fillStyle = RUST; // a few rust-coloured bars, like the bird's
  for (let k = 0.2; k < 0.75; k += 0.14) ctx.fillRect(-1.5, -L * k, 3, 2);
  woodGrip(ctx, '#5a3a28');
  ctx.restore();
}
// Condor Pinion: a long slag-iron blade shaped like a flight feather, the vanes cut into its edges, singed at the tip
function drawCondorPinion(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,214,120,0.85)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = '#4a4448';
  ctx.beginPath();
  ctx.moveTo(-1, -5);
  ctx.quadraticCurveTo(-8, -L * 0.5, -2, -L);
  ctx.quadraticCurveTo(7, -L * 0.5, 2, -5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#2a2428'; // the vanes' cuts
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0.16; k < 0.9; k += 0.08) {
    ctx.moveTo(0, -L * k);
    ctx.lineTo(-5, -L * k + 4);
    ctx.moveTo(0, -L * k);
    ctx.lineTo(4.5, -L * k + 4);
  }
  ctx.stroke();
  ctx.strokeStyle = '#c8c2c4'; // the bright shaft
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-1, -L * 0.96);
  ctx.stroke();
  ctx.fillStyle = SUL; // singed yellow at the tip
  ellipse(ctx, -1.5, -L * 0.94, 2.4, 4);
  woodGrip(ctx, '#3a3034');
  ctx.restore();
}
export const BRIM_SWORDS = { brimstone_pick: drawBrimstonePick, kitetalon: drawKitetalon, condor_pinion: drawCondorPinion };
export const BRIM_SWORD_LEN = { brimstone_pick: 56, kitetalon: 60, condor_pinion: 66 };

// ——— helmets: (ctx, w, h), the slime's size; drawn over its top ———
// Picker's Fume Mask: a leather hood with a wet cloth pad over the mouth and two smoked-glass eyes
function drawFumeMask(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.54;
  ctx.fillStyle = '#7a5a40';
  ctx.strokeStyle = '#4a3424';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.06, by + 8);
  ctx.bezierCurveTo(-rx * 1.1, by - h * 0.56, rx * 1.1, by - h * 0.56, rx * 1.06, by + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9a7a58'; // a seam down the crown
  ctx.fillRect(-1, by - h * 0.4, 2, h * 0.4);
  // the goggles, smoked glass in iron rims
  for (const x of [-rx * 0.36, rx * 0.36]) {
    ctx.fillStyle = IRON_D;
    circle(ctx, x, by + 2, 6.5);
    ctx.fillStyle = '#3a3440';
    circle(ctx, x, by + 2, 4.6);
    ctx.fillStyle = 'rgba(255,240,180,0.5)';
    circle(ctx, x - 1.5, by, 1.4);
  }
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.2, by + 2);
  ctx.lineTo(rx * 0.2, by + 2);
  ctx.stroke();
  // a kite feather stuck in the side
  ctx.fillStyle = RUST;
  ctx.beginPath();
  ctx.ellipse(rx * 0.86, by - h * 0.24, 2.6, 9, 0.5, 0, TAU);
  ctx.fill();
}
// Fumarole Helm: an iron helm crusted over with yellow sulphur crystals, a thread of fume off the crown
function drawFumaroleHelm(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.54;
  ctx.fillStyle = IRON_D;
  ctx.strokeStyle = '#2e2a34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.04, by + 6);
  ctx.bezierCurveTo(-rx * 1.04, by - h * 0.56, rx * 1.04, by - h * 0.56, rx * 1.04, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SUL;
  for (const [x, y, r] of [[-0.5, -0.2, 6], [-0.1, -0.36, 7], [0.36, -0.24, 6], [0.1, -0.12, 4]]) circle(ctx, rx * x, by + h * y, r);
  ctx.fillStyle = SUL_L;
  for (const [x, y] of [[-0.46, -0.3], [-0.06, -0.48], [0.4, -0.34]]) {
    ctx.beginPath();
    ctx.moveTo(rx * x - 2.4, by + h * y + 3);
    ctx.lineTo(rx * x, by + h * y - 5);
    ctx.lineTo(rx * x + 2.4, by + h * y + 3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(232,220,130,0.4)';
  circle(ctx, -rx * 0.06, by - h * 0.56, 5);
  circle(ctx, rx * 0.02, by - h * 0.7, 7);
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.08, by + 1, rx * 2.16, 6, 3);
  ctx.fill();
  ctx.stroke();
}
// Condor Helm: a bald iron helm with a ruff of grey down round its rim and a hooked beak for a brow
function drawCondorHelm(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.54;
  ctx.fillStyle = '#5a5258';
  ctx.strokeStyle = '#2a2428';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 4);
  ctx.bezierCurveTo(-rx, by - h * 0.6, rx, by - h * 0.6, rx, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ellipse(ctx, -rx * 0.3, by - h * 0.3, rx * 0.3, h * 0.1, -0.3);
  // the beak brow, hooked down over the front
  ctx.fillStyle = '#d8d0b8';
  ctx.strokeStyle = '#6a6250';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(rx * 0.3, by - h * 0.12);
  ctx.quadraticCurveTo(rx * 1.3, by - h * 0.14, rx * 1.16, by + 8);
  ctx.lineTo(rx * 0.84, by);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the ruff of grey down round the rim
  ctx.fillStyle = '#c8c2c4';
  for (let i = 0; i < 9; i++) circle(ctx, -rx * 1.02 + i * rx * 0.255, by + 5 + (i % 2) * 2, 5);
}
export const BRIM_HELMETS = { fume_mask: drawFumeMask, fumarole_helm: drawFumaroleHelm, condor_helm: drawCondorHelm };

// ——— material icons: (ctx), centred, about 30 px ———
function iconHopperLeg(ctx) {
  ctx.strokeStyle = SUL_D;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, 8);
  ctx.lineTo(4, -10);
  ctx.stroke();
  ctx.strokeStyle = CRUST;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(4, -10);
  ctx.lineTo(10, 10);
  ctx.stroke();
  ctx.fillStyle = CRUST_D;
  for (const k of [0.3, 0.6]) circle(ctx, 4 + k * 6, -10 + k * 20, 1.4);
}
function iconSlugAcid(ctx) {
  ctx.fillStyle = '#a8784a';
  ctx.strokeStyle = '#5a3a24';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.quadraticCurveTo(-11, 10, 0, 11);
  ctx.quadraticCurveTo(11, 10, 8, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6a4a30';
  ctx.beginPath();
  ctx.roundRect(-4, -11, 8, 6, 2);
  ctx.fill();
  ctx.fillStyle = ACID;
  ellipse(ctx, 0, -2, 6, 2);
  ctx.fillStyle = 'rgba(232,240,170,0.6)';
  circle(ctx, 3, -14, 2.4);
}
function iconVentCarapace(ctx) {
  ctx.fillStyle = CRUST;
  ctx.strokeStyle = CRUST_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 2, 13, 9, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SUL;
  for (const [x, y] of [[-6, -2], [1, -5], [7, -1]]) {
    ctx.beginPath();
    ctx.moveTo(x - 3, y + 3);
    ctx.lineTo(x, y - 5);
    ctx.lineTo(x + 3, y + 3);
    ctx.closePath();
    ctx.fill();
  }
}
function iconFumeCrystal(ctx) {
  ctx.fillStyle = SUL;
  ctx.strokeStyle = SUL_D;
  ctx.lineWidth = 1.2;
  for (const [x, a, l] of [[-5, -0.4, 14], [0, 0, 18], [5, 0.35, 13], [-1, -0.15, 10]]) {
    ctx.save();
    ctx.translate(x, 10);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(0, -l);
    ctx.lineTo(2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
function iconKitePlume(ctx) {
  ctx.save();
  ctx.rotate(0.5);
  ctx.fillStyle = RUST;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.quadraticCurveTo(-7, 0, -4, -12);
  ctx.lineTo(0, -6);
  ctx.lineTo(4, -12);
  ctx.quadraticCurveTo(7, 0, 0, 12);
  ctx.fill();
  ctx.fillStyle = SUL;
  ctx.fillRect(-4, -2, 8, 2);
  ctx.fillRect(-4, 4, 8, 2);
  ctx.strokeStyle = '#f4e8b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 13);
  ctx.lineTo(0, -6);
  ctx.stroke();
  ctx.restore();
}
function iconSpitterSulphur(ctx) {
  ctx.fillStyle = SUL;
  ctx.strokeStyle = SUL_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, 6);
  ctx.quadraticCurveTo(-12, -6, -2, -9);
  ctx.quadraticCurveTo(10, -10, 11, 2);
  ctx.quadraticCurveTo(8, 10, -10, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SUL_L;
  ellipse(ctx, -2, -3, 4, 2, -0.3);
}
function iconCondorQuill(ctx) {
  ctx.save();
  ctx.rotate(-0.6);
  ctx.fillStyle = '#3a3236';
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.quadraticCurveTo(-7, 0, -1, -14);
  ctx.quadraticCurveTo(6, 0, 0, 14);
  ctx.fill();
  ctx.strokeStyle = '#d8d0c8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 15);
  ctx.lineTo(-1, -13);
  ctx.stroke();
  ctx.fillStyle = SUL; // singed tip
  ellipse(ctx, -1, -12, 2.4, 3);
  ctx.restore();
}
export const BRIM_ICONS = { hopper_leg: iconHopperLeg, slug_acid: iconSlugAcid, vent_carapace: iconVentCarapace, fume_crystal: iconFumeCrystal, kite_plume: iconKitePlume, spitter_sulphur: iconSpitterSulphur, condor_quill: iconCondorQuill };

// ——— Picker Ochre's dress (src/slime.js, accessory 'picker'): a wide straw hat stuck with kite feathers, a wet cloth
// knotted round her neck, and her yoke across her shoulders with a basket of yellow sulphur hanging off each end and
// Saffron's little cage hooked on it, the canary hopping and singing ———
export function drawPickerDress(ctx, w, h, fx, t) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // the yoke, across her back, a basket at each end
  const yy = -h * 0.58;
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.86, yy + 4);
  ctx.quadraticCurveTo(0, yy - 8, w * 0.86, yy + 4);
  ctx.stroke();
  for (const s of [-1, 1]) {
    const bx = s * w * 0.8, sw = Math.sin(t * 1.4 + s) * 1.2;
    ctx.strokeStyle = '#6a5a48';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, yy + 4);
    ctx.lineTo(bx - 7 + sw, yy + 22);
    ctx.moveTo(bx, yy + 4);
    ctx.lineTo(bx + 7 + sw, yy + 22);
    ctx.stroke();
    ctx.fillStyle = '#b08a5a'; // the basket
    ctx.strokeStyle = '#6a4a30';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx - 10 + sw, yy + 22);
    ctx.lineTo(bx + 10 + sw, yy + 22);
    ctx.lineTo(bx + 7 + sw, yy + 38);
    ctx.lineTo(bx - 7 + sw, yy + 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let y = yy + 27; y < yy + 38; y += 5) {
      ctx.moveTo(bx - 9 + sw, y);
      ctx.lineTo(bx + 9 + sw, y);
    }
    ctx.stroke();
    ctx.fillStyle = SUL; // heaped with sulphur
    ellipse(ctx, bx + sw, yy + 22, 9, 4);
    ctx.fillStyle = SUL_L;
    circle(ctx, bx - 3 + sw, yy + 20, 2);
  }
  // Saffron's cage, hooked on the yoke by her head, and Saffron
  const cx = w * 0.4, cyy = yy - 6;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx, cyy);
  ctx.lineTo(cx, cyy - 4);
  ctx.moveTo(cx - 6, cyy - 4);
  ctx.quadraticCurveTo(cx, cyy - 16, cx + 6, cyy - 4);
  for (const x of [-6, -2, 2, 6]) {
    ctx.moveTo(cx + x, cyy - 4);
    ctx.lineTo(cx + x * 0.7, cyy - 12);
  }
  ctx.stroke();
  const hop = Math.max(0, Math.sin(t * 3)) * 1.5;
  ctx.fillStyle = '#ffd83a';
  ellipse(ctx, cx, cyy - 7 - hop, 2.6, 2.2);
  ctx.fillStyle = '#ff9a3a';
  circle(ctx, cx + 2.4, cyy - 7.4 - hop, 0.9);
  if (Math.sin(t * 2.2) > 0.4) { // singing: a little note-puff
    ctx.fillStyle = 'rgba(255,240,170,0.7)';
    circle(ctx, cx + 6, cyy - 14 - (t % 1) * 6, 1.4);
  }
  // the wet cloth round her neck
  ctx.fillStyle = '#c8c0b0';
  ctx.strokeStyle = '#8a8070';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.44, -h * 0.34);
  ctx.quadraticCurveTo(0, -h * 0.22, w * 0.44, -h * 0.34);
  ctx.lineTo(w * 0.4, -h * 0.25);
  ctx.quadraticCurveTo(0, -h * 0.12, -w * 0.4, -h * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,200,220,0.5)'; // a damp patch
  ellipse(ctx, -w * 0.1, -h * 0.25, 5, 2);
  // the wide straw hat, kite feathers in its band
  ctx.fillStyle = '#e0c47a';
  ctx.strokeStyle = '#a0843a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.84, w * 0.78, h * 0.1, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, -h * 0.86);
  ctx.quadraticCurveTo(-w * 0.32, -h * 1.12, 0, -h * 1.12);
  ctx.quadraticCurveTo(w * 0.32, -h * 1.12, w * 0.34, -h * 0.86);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6a4a30';
  ctx.fillRect(-w * 0.34, -h * 0.92, w * 0.68, 4);
  for (const [x, a] of [[-0.26, -0.6], [-0.18, -0.3]]) {
    ctx.save();
    ctx.translate(w * x, -h * 0.92);
    ctx.rotate(a);
    ctx.fillStyle = RUST;
    ellipse(ctx, 0, -8, 2.4, 8);
    ctx.fillStyle = SUL;
    ctx.fillRect(-2, -8, 4, 1.6);
    ctx.restore();
  }
  // yellow dust on her cheeks
  ctx.fillStyle = 'rgba(232,200,74,0.45)';
  circle(ctx, fx - 13, -h * 0.4, 3.4);
  circle(ctx, fx + 13, -h * 0.4, 3.4);
  ctx.restore();
}
