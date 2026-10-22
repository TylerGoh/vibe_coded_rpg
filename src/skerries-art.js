// Docs: docs/places/skerries.md, docs/places/grotto.md, docs/combat/stages.md
// The Whale Skerries' and the Narwhal Grotto's art that isn't the rooms themselves (src/skerries.js,
// src/grotto.js) or the Old Narwhal (src/dens-skerries.js): their creatures (ice seal, skua, sea urchin,
// whalebone crab, sea smoke, bull walrus; lanternfish, ice eel, brine slug, ice skate: SKERRIES_MOB_ART, called
// by drawMob in src/field.js; elites are drawn as their base), the gear sold and dropped there (SKERRIES_SWORDS,
// SKERRIES_SWORD_LEN, SKERRIES_HELMETS; the staves are data in src/staff-art.js), the materials' icons
// (SKERRIES_ICONS) and Hakon the bone-carver's clothes (drawBonecarverDress, src/slime.js).
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
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
function whiskers(ctx, x, y, n, len, col = 'rgba(255,255,255,0.85)', lw = 1) {
  ctx.strokeStyle = col;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = -0.35 + (i / Math.max(1, n - 1)) * 0.7;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len * 0.5, y + a * len * 0.3, x + len * Math.cos(a), y + len * Math.sin(a) + 2);
  }
  ctx.stroke();
}

// ——— the Skerries ———

// Ice seal: a plump silver-grey seal with dark spots, lolling on its belly, flippers tucked, big wet eyes and
// whiskers. Harmless: humps along when it moves.
function drawIceSeal(ctx, w, h, t, seed, m, dying) {
  const hump = m.walking ? Math.abs(Math.sin(t * 6 + seed)) * h * 0.12 : Math.sin(t * 1.5 + seed) * 1;
  const body = () => {
    ctx.moveTo(-w * 0.5, -h * 0.12);
    ctx.quadraticCurveTo(-w * 0.42, -h * 0.66 - hump, w * 0.06, -h * 0.72 - hump);
    ctx.quadraticCurveTo(w * 0.42, -h * 0.74, w * 0.46, -h * 0.4);
    ctx.quadraticCurveTo(w * 0.48, -h * 0.02, w * 0.2, 0);
    ctx.lineTo(-w * 0.36, 0);
    ctx.closePath();
  };
  // tail flippers
  ctx.fillStyle = '#7a8496';
  ctx.beginPath();
  ctx.moveTo(-w * 0.44, -h * 0.12);
  ctx.lineTo(-w * 0.62, -h * 0.34);
  ctx.lineTo(-w * 0.56, -h * 0.06);
  ctx.lineTo(-w * 0.64, h * 0.02);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createLinearGradient(0, -h * 0.75, 0, 0);
  g.addColorStop(0, '#c4ccd8');
  g.addColorStop(1, '#f2f4f8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#6a7486';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,100,120,0.45)'; // spots
  for (const [x, y, r] of [[-0.3, 0.45, 3], [-0.16, 0.56, 2.4], [-0.02, 0.6, 3.2], [0.12, 0.5, 2], [-0.22, 0.32, 2]]) ellipse(ctx, w * x, -h * y - hump * 0.6, r, r * 0.8);
  // front flipper
  ctx.fillStyle = '#9aa4b6';
  ctx.strokeStyle = '#6a7486';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(w * 0.1, -h * 0.1, w * 0.12, h * 0.07, 0.5 + Math.sin(t * 2 + seed) * 0.15, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // face: big dark eyes, a dark nose, whiskers
  const fx = w * 0.32, fy = -h * 0.48 - hump * 0.3;
  face(ctx, fx, fy, 5, t, seed, { dying, size: 1.05 });
  ctx.fillStyle = '#3e3a4e';
  ellipse(ctx, w * 0.44, fy + 5, 3, 2.2);
  whiskers(ctx, w * 0.42, fy + 7, 3, 12, 'rgba(255,255,255,0.9)');
  return () => {
    ctx.beginPath();
    body();
  };
}

// Skua: a stocky brown seabird, white flashes at the base of its wings, a hooked black beak and a mean look.
// m.warn: wings up, about to stoop · m.charging: diving.
function drawSkua(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const cy = -h * 0.5, bob = live && !dive ? Math.sin(t * 2.4 + seed) * 2 : 0;
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(dive ? 0.55 : 0);
  const flap = dive ? -1 : warn ? -0.7 + Math.sin(t * 18) * 0.15 : Math.sin(t * 4 + seed) * 0.35;
  const wing = (s, a) => {
    ctx.save();
    ctx.translate(-w * 0.04, cy - 2);
    ctx.rotate(a * s);
    ctx.scale(1, s);
    ctx.fillStyle = s > 0 ? '#5e4a3c' : '#7a604c';
    ctx.strokeStyle = '#3a2c24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-w * 0.28, -h * 0.85, -w * 0.72, -h * 0.55);
    ctx.quadraticCurveTo(-w * 0.36, -h * 0.2, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f4efe6'; // the white flash
    ellipse(ctx, -w * 0.36, -h * 0.52, w * 0.07, h * 0.06, -0.5);
    ctx.restore();
  };
  wing(1, flap);
  ctx.fillStyle = '#5e4a3c';
  ctx.strokeStyle = '#3a2c24';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, cy - 2);
  ctx.lineTo(-w * 0.5, cy - 3);
  ctx.lineTo(-w * 0.46, cy + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const body = () => ctx.ellipse(0, cy, w * 0.3, h * 0.28, 0, 0, TAU);
  ctx.fillStyle = '#8a705a';
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b09a82';
  ellipse(ctx, w * 0.06, cy + h * 0.08, w * 0.18, h * 0.14);
  const hx = w * 0.3, hy = cy - h * 0.12;
  ctx.fillStyle = '#6a5442';
  ctx.beginPath();
  ctx.arc(hx, hy, h * 0.23, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // the hooked beak
  ctx.fillStyle = '#2d2a3e';
  ctx.beginPath();
  ctx.moveTo(hx + h * 0.16, hy - 3);
  ctx.quadraticCurveTo(hx + h * 0.48, hy - 4, hx + h * 0.46, hy + 4);
  ctx.quadraticCurveTo(hx + h * 0.4, hy + 1, hx + h * 0.18, hy + 3);
  ctx.closePath();
  ctx.fill();
  face(ctx, hx + h * 0.04, hy - 2, 0.1, t, seed, { dying, size: 0.7 });
  ctx.strokeStyle = INKC; // a scowl, always
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(hx - 4, hy - 8);
  ctx.lineTo(hx + 5, hy - 5 - (warn ? 1 : 0));
  ctx.stroke();
  wing(-1, flap * 0.8);
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, cy + bob, w * 0.3, h * 0.28, 0, 0, TAU);
    ctx.moveTo(hx + h * 0.23, hy + bob);
    ctx.arc(hx, hy + bob, h * 0.23, 0, TAU);
  };
}

// Sea urchin: a fat purple urchin on a black rock, a crown of long spines that sway, two small eyes peeping
// out between them. It never moves; it flicks spines. m.warn: spines bristle straight out, tips lit.
function drawSeaUrchin(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05;
  // the rock
  ctx.fillStyle = '#3a3a48';
  ctx.strokeStyle = '#22222c';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.52, 1);
  ctx.quadraticCurveTo(-w * 0.5, -h * 0.26, -w * 0.1, -h * 0.28);
  ctx.quadraticCurveTo(w * 0.42, -h * 0.3, w * 0.52, 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const cx = 0, cy = -h * 0.5, r = w * 0.3;
  // spines
  const n = 22;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI + Math.sin(t * 2 + i + seed) * (warn ? 0.02 : 0.08);
    const len = r * (warn ? 1.15 : 0.85) + (i % 3) * 3;
    ctx.strokeStyle = '#5a2a6a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8);
    ctx.lineTo(cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len));
    ctx.stroke();
    if (warn) {
      ctx.fillStyle = '#ffd0f0';
      circle(ctx, cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len), 1.6);
    }
  }
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 1, cx, cy, r);
  g.addColorStop(0, '#b06ac8');
  g.addColorStop(1, '#6a2e80');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#3e1a4e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.85, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,220,255,0.35)';
  for (let i = 0; i < 6; i++) circle(ctx, cx - r * 0.5 + i * r * 0.2, cy - r * 0.2 + (i % 2) * 4, 1.5);
  face(ctx, cx + r * 0.3, cy + 2, 4, t, seed, { dying, size: 0.75 });
  if (warn) halo(ctx, cx, cy, r * 2.2, '230,160,255', 0.3);
  return () => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.4, r * 1.2, 0, 0, TAU);
  };
}

// Whalebone crab: a big blue-grey crab that wears a piece of old whale skull over its front like a shield
// (its shell blocks hits from the front: go round behind). m.warn: claws up · m.charging: lunges.
function drawWhaleboneCrab(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, lunge = !!m.charging && live;
  const step = m.walking || lunge ? Math.sin(t * 14 + seed) : 0;
  // legs
  ctx.strokeStyle = '#4e6478';
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const lx = -w * 0.28 + i * w * 0.12, k = step * (i % 2 ? 1 : -1) * 3;
    ctx.beginPath();
    ctx.moveTo(lx, -h * 0.3);
    ctx.lineTo(lx - 10, -h * 0.18 + k);
    ctx.lineTo(lx - 12, 0);
    ctx.stroke();
  }
  const body = () => ctx.ellipse(-w * 0.06, -h * 0.42, w * 0.34, h * 0.28, 0, 0, TAU);
  const g = ctx.createLinearGradient(0, -h * 0.7, 0, -h * 0.15);
  g.addColorStop(0, '#8aa4bc');
  g.addColorStop(1, '#4e6478');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2e3e50';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (const [x, y] of [[-0.2, 0.52], [-0.06, 0.58], [-0.28, 0.4]]) circle(ctx, w * x, -h * y, 2.4);
  // eyes on stalks
  ctx.strokeStyle = '#4e6478';
  ctx.lineWidth = 2.4;
  for (const dx of [0.06, 0.16]) {
    ctx.beginPath();
    ctx.moveTo(w * dx, -h * 0.62);
    ctx.lineTo(w * dx + 2, -h * 0.82);
    ctx.stroke();
  }
  face(ctx, w * 0.12, -h * 0.84, w * 0.05, t, seed, { dying, size: 0.7 });
  // claws
  const cy = -h * (warn ? 0.78 : 0.42), cx = w * 0.42 + (lunge ? 10 : 0);
  ctx.fillStyle = '#7a94ac';
  ctx.strokeStyle = '#2e3e50';
  ctx.lineWidth = 1.8;
  for (const dy of [0, 10]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy + dy, w * 0.1, h * 0.1, -0.4, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // the skull shield: an old grey-white piece of whale skull, worn in front, with a hollow eye socket
  ctx.fillStyle = '#e6e0d0';
  ctx.strokeStyle = '#8a8270';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.16, -h * 0.12);
  ctx.quadraticCurveTo(w * 0.22, -h * 0.82, w * 0.44, -h * 0.66);
  ctx.quadraticCurveTo(w * 0.5, -h * 0.3, w * 0.36, -h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6a6458';
  ellipse(ctx, w * 0.33, -h * 0.48, w * 0.04, h * 0.07, 0.2);
  ctx.strokeStyle = 'rgba(138,130,112,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.24, -h * 0.3);
  ctx.lineTo(w * 0.3, -h * 0.2);
  ctx.moveTo(w * 0.26, -h * 0.6);
  ctx.lineTo(w * 0.32, -h * 0.66);
  ctx.stroke();
  if (warn) halo(ctx, cx, cy, h * 0.4, '255,255,255', 0.3);
  return () => {
    ctx.beginPath();
    body();
    ctx.moveTo(w * 0.5, -h * 0.4);
    ctx.ellipse(w * 0.32, -h * 0.42, w * 0.18, h * 0.38, 0, 0, TAU);
  };
}

// Sea smoke: the cold mist that smokes off open water, gathered into a soft curl with two pale eyes. m.special:
// faded into the mist (can't be hurt), about to gust out of it.
function drawSeaSmoke(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  const cy = -h * 0.5;
  ctx.save();
  if (gone) ctx.globalAlpha *= 0.18 + 0.08 * Math.sin(t * 18);
  halo(ctx, 0, cy, w * 0.95, '220,232,240', 0.35);
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9 + t * 0.8 + seed, rr = w * (0.14 + (i % 3) * 0.04);
    ctx.fillStyle = `rgba(${i % 2 ? '232,240,246' : '208,220,232'},0.85)`;
    circle(ctx, Math.cos(a) * w * 0.18, cy + Math.sin(a) * h * 0.18, rr);
  }
  // the wispy tail curling down to the water
  ctx.strokeStyle = 'rgba(220,232,240,0.7)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, cy + h * 0.2);
  ctx.quadraticCurveTo(-w * 0.4 + Math.sin(t * 2) * 5, cy + h * 0.4, -w * 0.2, -2);
  ctx.stroke();
  ctx.fillStyle = '#eef6fb';
  ellipse(ctx, w * 0.02, cy - 2, w * 0.24, h * 0.22);
  // two pale eyes
  ctx.fillStyle = dying > 0.05 ? '#7a8a9a' : '#5a7a9a';
  ellipse(ctx, w * 0.1, cy - 3, 2.6, 3.6);
  ellipse(ctx, w * 0.22, cy - 3, 2.6, 3.6);
  ctx.restore();
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.36, h * 0.38, 0, 0, TAU);
  };
}

// Bull walrus: a huge wrinkled brown walrus with two long tusks, a bristling moustache and a sleepy grump.
// m.warn: rears up on his flippers · airborne when he bounces to slam the ice.
function drawBullWalrus(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const hump = m.walking ? Math.abs(Math.sin(t * 5 + seed)) * 4 : 0;
  ctx.save();
  if (warn) {
    ctx.translate(-w * 0.25, 0);
    ctx.rotate(-0.25);
    ctx.translate(w * 0.25, 0);
  }
  const body = () => {
    ctx.moveTo(-w * 0.5, -h * 0.1);
    ctx.quadraticCurveTo(-w * 0.5, -h * 0.7 - hump, -w * 0.05, -h * 0.82 - hump);
    ctx.quadraticCurveTo(w * 0.38, -h * 0.9, w * 0.46, -h * 0.5);
    ctx.quadraticCurveTo(w * 0.5, -h * 0.08, w * 0.24, 0);
    ctx.lineTo(-w * 0.38, 0);
    ctx.closePath();
  };
  ctx.fillStyle = '#6e4a3a';
  ctx.beginPath(); // tail flippers
  ctx.moveTo(-w * 0.46, -h * 0.1);
  ctx.lineTo(-w * 0.62, -h * 0.22);
  ctx.lineTo(-w * 0.6, h * 0.02);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#b07e64');
  g.addColorStop(1, '#8a5e48');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4e3226';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(78,50,38,0.4)'; // wrinkles
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(-w * 0.12 + i * w * 0.07, -h * 0.5, h * 0.3, -1.9, -1.3);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,190,170,0.35)'; // pink where it's been in the cold
  ellipse(ctx, w * 0.18, -h * 0.66, w * 0.12, h * 0.1);
  // fore flipper
  ctx.fillStyle = '#7a523e';
  ctx.strokeStyle = '#4e3226';
  ctx.beginPath();
  ctx.ellipse(w * 0.12, -h * 0.08, w * 0.12, h * 0.07, 0.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // face: small eyes, the big muzzle, bristles and tusks
  const fx = w * 0.3, fy = -h * 0.62;
  face(ctx, fx, fy, 5, t, seed, { dying, size: 0.8, sleepy: !warn && !m.target });
  ctx.fillStyle = '#c49a80';
  ctx.strokeStyle = '#4e3226';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(fx + w * 0.04, fy + h * 0.16, w * 0.15, h * 0.12, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5a3a2c';
  for (let i = 0; i < 10; i++) circle(ctx, fx - w * 0.06 + (i % 5) * w * 0.05, fy + h * 0.13 + Math.floor(i / 5) * 5, 1);
  // tusks
  ctx.fillStyle = '#f4ecd8';
  ctx.strokeStyle = '#8a7a5a';
  ctx.lineWidth = 1.4;
  for (const dx of [-w * 0.03, w * 0.09]) {
    ctx.beginPath();
    ctx.moveTo(fx + dx - 3, fy + h * 0.24);
    ctx.quadraticCurveTo(fx + dx - 2, fy + h * 0.55, fx + dx + 2, fy + h * 0.62);
    ctx.quadraticCurveTo(fx + dx + 3, fy + h * 0.4, fx + dx + 4, fy + h * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// ——— the Narwhal Grotto ———

// Lanternfish: a round dark blue-green fish with a big gentle mouth and a pale green light on a stalk over
// its head, swimming in the cave's cold air. m.special: its light's gone out (can't be hurt), about to flare.
function drawLanternfish(ctx, w, h, t, seed, m, dying) {
  const dark = !!m.special && dying < 0.05;
  const cy = -h * 0.5 + Math.sin(t * 2 + seed) * 2;
  const lx = w * 0.42, ly = cy - h * 0.62 + Math.sin(t * 3 + seed) * 2;
  if (!dark) halo(ctx, lx, ly, w * 0.7, '170,255,200', 0.45);
  ctx.save();
  if (dark) ctx.globalAlpha *= 0.3;
  // tail
  ctx.fillStyle = '#2a5a5e';
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, cy);
  ctx.lineTo(-w * 0.52, cy - h * 0.24 + Math.sin(t * 6) * 3);
  ctx.lineTo(-w * 0.52, cy + h * 0.24 + Math.sin(t * 6) * 3);
  ctx.closePath();
  ctx.fill();
  const body = () => ctx.ellipse(0, cy, w * 0.36, h * 0.38, 0, 0, TAU);
  const g = ctx.createLinearGradient(0, cy - h * 0.4, 0, cy + h * 0.4);
  g.addColorStop(0, '#2e6a70');
  g.addColorStop(1, '#5a9a8e');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#163a40';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(190,255,220,0.6)'; // little glowing dots along its side
  for (let i = 0; i < 5; i++) circle(ctx, -w * 0.2 + i * w * 0.1, cy + h * 0.18, 1.6);
  // fin
  ctx.fillStyle = '#3e7a7a';
  ellipse(ctx, -w * 0.04, cy + h * 0.06, w * 0.1, h * 0.12, 0.4 + Math.sin(t * 5) * 0.2);
  // mouth and eye
  ctx.strokeStyle = '#163a40';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(w * 0.3, cy + h * 0.06, h * 0.12, 0.2, 1.4);
  ctx.stroke();
  face(ctx, w * 0.18, cy - h * 0.12, 0.1, t, seed, { dying, size: 0.9 });
  // the lure
  ctx.strokeStyle = '#2e6a70';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.14, cy - h * 0.34);
  ctx.quadraticCurveTo(w * 0.32, cy - h * 0.8, lx, ly);
  ctx.stroke();
  ctx.fillStyle = dark ? '#5a7a6a' : '#d8ffe8';
  circle(ctx, lx, ly, 4.5);
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// Ice eel: a long pale eel, glassy blue-white, head reared up off the floor. It spits a jet of freezing water
// along the ground. m.warn: head drawn back, mouth wide, cold water gathering in it.
function drawIceEel(ctx, w, h, t, seed, m, dying) {
  const warn = !!m.warn && dying < 0.05;
  const wave = (x) => Math.sin(x * 0.12 - t * 5 + seed) * 4;
  // the body, lying along the floor in an S, then rearing up at the head
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = () => {
    ctx.moveTo(-w * 0.5, -6 + wave(-w * 0.5));
    for (let x = -w * 0.5; x <= w * 0.2; x += 6) ctx.lineTo(x, -8 + wave(x));
    ctx.quadraticCurveTo(w * 0.3, -h * 0.2, w * (warn ? 0.22 : 0.3), -h * 0.7);
  };
  ctx.strokeStyle = '#4a7a9a';
  ctx.lineWidth = h * 0.42;
  ctx.beginPath();
  path();
  ctx.stroke();
  ctx.strokeStyle = '#bfe2f2';
  ctx.lineWidth = h * 0.34;
  ctx.beginPath();
  path();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -w * 0.45; x <= w * 0.15; x += 6) ctx.lineTo(x, -14 + wave(x));
  ctx.stroke();
  // fin along its back
  ctx.fillStyle = 'rgba(160,210,235,0.8)';
  for (let x = -w * 0.4; x < w * 0.15; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, -h * 0.2 + wave(x));
    ctx.lineTo(x + 5, -h * 0.34 + wave(x));
    ctx.lineTo(x + 10, -h * 0.2 + wave(x + 10));
    ctx.closePath();
    ctx.fill();
  }
  // head
  const hx = w * (warn ? 0.24 : 0.32), hy = -h * 0.72;
  ctx.fillStyle = '#d8eef8';
  ctx.strokeStyle = '#4a7a9a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(hx, hy, h * 0.3, h * 0.22, 0.2, 0, TAU);
  ctx.fill();
  ctx.stroke();
  face(ctx, hx + 2, hy - 3, 0.1, t, seed, { dying, size: 0.8 });
  ctx.fillStyle = '#1e3a4e';
  ctx.beginPath();
  if (warn) {
    ctx.ellipse(hx + h * 0.24, hy + 3, 5, 6, 0, 0, TAU);
    ctx.fill();
    halo(ctx, hx + h * 0.28, hy + 3, 18, '150,220,255', 0.6);
  } else {
    ctx.moveTo(hx + h * 0.12, hy + 5);
    ctx.lineTo(hx + h * 0.3, hy + 4);
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  return () => {
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.3, w * 0.5, h * 0.35, 0, 0, TAU);
    ctx.moveTo(hx + h * 0.3, hy);
    ctx.ellipse(hx, hy, h * 0.3, h * 0.22, 0.2, 0, TAU);
  };
}

// Brine slug: a fat translucent sea slug, milky white-green, with a frill of soft frosted fingers down its
// back, each tipped with a salt crystal. It leaves a slick of freezing brine behind it.
function drawBrineSlug(ctx, w, h, t, seed, m, dying) {
  const creep = m.walking ? Math.sin(t * 5 + seed) * 0.04 : 0;
  const body = () => {
    ctx.moveTo(-w * 0.5, 0);
    ctx.quadraticCurveTo(-w * 0.46, -h * 0.5, -w * 0.05, -h * 0.55);
    ctx.quadraticCurveTo(w * (0.42 + creep), -h * 0.6, w * 0.5, -h * 0.2);
    ctx.quadraticCurveTo(w * 0.52, 0, w * 0.3, 0);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, -h * 0.6, 0, 0);
  g.addColorStop(0, 'rgba(220,250,236,0.95)');
  g.addColorStop(1, 'rgba(150,210,190,0.95)');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4e8a7a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // the frill of fingers
  for (let i = 0; i < 8; i++) {
    const x = -w * 0.36 + i * w * 0.09, sway = Math.sin(t * 3 + i + seed) * 3, len = h * (0.34 + (i % 3) * 0.06);
    ctx.strokeStyle = '#7ac0a8';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, -h * 0.48);
    ctx.lineTo(x + sway, -h * 0.48 - len);
    ctx.stroke();
    ctx.fillStyle = '#f4fffb';
    ctx.beginPath();
    ctx.moveTo(x + sway, -h * 0.48 - len - 5);
    ctx.lineTo(x + sway + 3, -h * 0.48 - len);
    ctx.lineTo(x + sway, -h * 0.48 - len + 3);
    ctx.lineTo(x + sway - 3, -h * 0.48 - len);
    ctx.closePath();
    ctx.fill();
  }
  // feelers and a sleepy face
  ctx.strokeStyle = '#7ac0a8';
  ctx.lineWidth = 3;
  for (const dx of [0.36, 0.44]) {
    ctx.beginPath();
    ctx.moveTo(w * dx, -h * 0.36);
    ctx.quadraticCurveTo(w * (dx + 0.06), -h * 0.6, w * (dx + 0.1), -h * 0.62 + Math.sin(t * 2 + dx * 9) * 2);
    ctx.stroke();
  }
  face(ctx, w * 0.32, -h * 0.26, 4, t, seed, { dying, size: 0.75 });
  return () => {
    ctx.beginPath();
    body();
  };
}

// Ice skate: a broad flat ray, grey-green on top with pale freckles, its wide wings rippling as it glides
// along the floor, a whip tail behind. m.special: slipped away under the ice (about to come up behind you),
// only a ripple · m.warn: wings curled up, about to slash.
function drawIceSkate(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, gone = !!m.special && live, warn = !!m.warn && live;
  if (gone) {
    ctx.strokeStyle = 'rgba(200,240,230,0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const k = (t * 1.5 + i / 3) % 1;
      ctx.beginPath();
      ctx.ellipse(0, -2, w * 0.2 + k * w * 0.3, 3 + k * 4, 0, 0, TAU);
      ctx.globalAlpha = 1 - k;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return () => {
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.3, w * 0.3, h * 0.3, 0, 0, TAU);
    };
  }
  const rip = Math.sin(t * 6 + seed) * (warn ? 8 : 4);
  const cy = -h * 0.45;
  // the tail
  ctx.strokeStyle = '#5a7a70';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy);
  ctx.quadraticCurveTo(-w * 0.45, cy + 4 + rip * 0.5, -w * 0.62, cy - 4);
  ctx.stroke();
  const body = () => {
    ctx.moveTo(w * 0.36, cy);
    ctx.quadraticCurveTo(w * 0.1, cy - h * 0.6 - rip - (warn ? 6 : 0), -w * 0.26, cy - 2);
    ctx.quadraticCurveTo(w * 0.1, cy + h * 0.5 + rip * 0.4, w * 0.36, cy);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(0, cy - h * 0.6, 0, cy + h * 0.4);
  g.addColorStop(0, '#8ab8a8');
  g.addColorStop(1, '#4e7a6e');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2a4e46';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,255,250,0.5)';
  for (let i = 0; i < 7; i++) circle(ctx, -w * 0.1 + (i % 4) * w * 0.08, cy - h * 0.16 + Math.floor(i / 4) * h * 0.14, 1.6);
  face(ctx, w * 0.22, cy - h * 0.06, 3.5, t, seed, { dying, size: 0.7 });
  if (warn) halo(ctx, w * 0.1, cy, w * 0.5, '200,255,235', 0.25);
  return () => {
    ctx.beginPath();
    body();
  };
}

export const SKERRIES_MOB_ART = {
  ice_seal: drawIceSeal, skua: drawSkua, sea_urchin: drawSeaUrchin, whalebone_crab: drawWhaleboneCrab, sea_smoke: drawSeaSmoke, bull_walrus: drawBullWalrus,
  lanternfish: drawLanternfish, ice_eel: drawIceEel, brine_slug: drawBrineSlug, ice_skate: drawIceSkate,
};

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
// Bone-Carver's Saber: a curved steel saber with a carved whalebone hilt and guard
function drawBonecarverKnife(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.quadraticCurveTo(-7, -L * 0.6, 4, -L);
    ctx.quadraticCurveTo(5, -L * 0.55, 4, -6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-6, 0, 5, 0);
  g.addColorStop(0, '#dfe6ee');
  g.addColorStop(1, '#8a98a8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#4a5666';
  ctx.lineWidth = 1.6;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${0.4 + 0.5 * glow})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.quadraticCurveTo(-6.5, -L * 0.6, 3.5, -L * 0.97);
  ctx.stroke();
  ctx.fillStyle = '#efe8d6'; // the bone guard, carved
  ctx.strokeStyle = '#8a8068';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-9, -9, 18, 5, 2.5);
  ctx.fill();
  ctx.stroke();
  grip(ctx, '#ece4d0', '#9a8e74');
  ctx.restore();
}
// Ivory Cutlass: a broad heavy cutlass with a blade of polished walrus ivory, a brass guard
function drawIvoryCutlass(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(-6, -L * 0.7);
    ctx.quadraticCurveTo(-4, -L * 1.02, 6, -L * 0.9);
    ctx.quadraticCurveTo(8, -L * 0.5, 5, -6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-6, 0, 7, 0);
  g.addColorStop(0, '#fbf6e8');
  g.addColorStop(1, '#d8ccac');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#7a6a4a';
  ctx.lineWidth = 1.7;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,106,74,0.4)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-5, -L * i * 0.17);
    ctx.lineTo(5, -L * i * 0.17 - 2);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(255,250,230,${0.3 + 0.4 * glow})`;
  ellipse(ctx, -2, -L * 0.5, 2, 8);
  ctx.fillStyle = '#c8a050';
  ctx.strokeStyle = '#7a5a28';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-10, -9, 20, 5, 2.5);
  ctx.fill();
  ctx.stroke();
  grip(ctx, '#6e4a3a', '#3e2a20');
  ctx.restore();
}
// Narwhal Tusk: a long straight spiral lance of ivory, frosted at the tip, a sea-ice guard
function drawNarwhalTusk(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(0, -L);
    ctx.lineTo(5, -6);
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-5, 0, 5, 0);
  g.addColorStop(0, '#fffaf0');
  g.addColorStop(1, '#d8cbb0');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#8a7a5a';
  ctx.lineWidth = 1.5;
  blade();
  ctx.fill();
  ctx.stroke();
  // the spiral groove
  ctx.strokeStyle = 'rgba(138,122,90,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const y0 = -8 - i * (L - 12) / 9, half = 5 * (1 - (i + 0.5) / 9.5);
    ctx.moveTo(-half, y0);
    ctx.lineTo(half, y0 - (L - 12) / 18);
  }
  ctx.stroke();
  ctx.fillStyle = `rgba(200,235,255,${0.5 + 0.4 * glow})`;
  ellipse(ctx, 0, -L * 0.9, 2.4, 6);
  ctx.fillStyle = 'rgba(200,235,255,0.9)';
  ctx.strokeStyle = '#6aa0c8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-10, -5);
  ctx.lineTo(-6, -10);
  ctx.lineTo(6, -10);
  ctx.lineTo(10, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  grip(ctx, '#4e6a80', '#2e4050');
  ctx.restore();
}
// Skate Wing Blade: a wide thin blade like a skate's wing, grey-green, its edge rippling
function drawSkateBlade(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    for (let i = 0; i <= 6; i++) ctx.lineTo(-8 - Math.sin(i * 1.4) * 2 + i * 0.6, -6 - (L - 10) * (i / 6));
    ctx.lineTo(1, -L);
    for (let i = 6; i >= 0; i--) ctx.lineTo(7 + Math.sin(i * 1.4 + 1) * 2 - i * 0.4, -6 - (L - 10) * (i / 6));
    ctx.closePath();
  };
  const g = ctx.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, '#a8d0c4');
  g.addColorStop(1, '#5a8a7e');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#2a4e46';
  ctx.lineWidth = 1.5;
  blade();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(240,255,250,${0.35 + 0.5 * glow})`;
  for (let i = 0; i < 5; i++) circle(ctx, -2 + (i % 2) * 3, -L * (0.25 + i * 0.13), 1.4);
  ctx.fillStyle = '#4e7a6e';
  ctx.beginPath();
  ctx.roundRect(-9, -9, 18, 5, 2.5);
  ctx.fill();
  grip(ctx, '#3e5a54', '#22362e');
  ctx.restore();
}
export const SKERRIES_SWORDS = { bonecarver_knife: drawBonecarverKnife, ivory_cutlass: drawIvoryCutlass, narwhal_tusk: drawNarwhalTusk, skate_blade: drawSkateBlade };
export const SKERRIES_SWORD_LEN = { bonecarver_knife: 54, ivory_cutlass: 58, narwhal_tusk: 68, skate_blade: 62 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Sealskin Hood: a snug grey hood, oiled and shiny, a fringe of white fur round the face
export function drawSealskinHood(ctx, w, h) {
  const by = -h * 0.72, rx = w * 0.52;
  ctx.fillStyle = '#7a8494';
  ctx.strokeStyle = '#3e4656';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 10);
  ctx.bezierCurveTo(-rx * 1.05, by - h * 0.5, rx * 1.05, by - h * 0.5, rx, by + 10);
  ctx.lineTo(rx * 0.8, by + 4);
  ctx.quadraticCurveTo(0, by - h * 0.12, -rx * 0.8, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; // the oiled shine
  ellipse(ctx, -rx * 0.35, by - h * 0.28, rx * 0.2, h * 0.06, -0.4);
  ctx.fillStyle = 'rgba(70,80,96,0.5)'; // seal spots
  for (const [x, y] of [[0.3, 0.3], [0.5, 0.18], [-0.1, 0.36]]) ellipse(ctx, rx * x, by - h * y, 2.6, 2);
  ctx.fillStyle = '#f4f2ec'; // the fur fringe
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    circle(ctx, Math.cos(a) * rx * 0.82, by + 6 + Math.sin(a) * h * 0.12, 3.4);
  }
}
// Whalebone Helm: the crab's borrowed piece of whale skull, cleaned and lined with sealskin
function drawBonecrabHelm(ctx, w, h) {
  const by = -h * 0.72, rx = w * 0.52;
  ctx.fillStyle = '#e8e2d2';
  ctx.strokeStyle = '#8a8270';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx, by - h * 0.46, rx * 1.1, by - h * 0.5, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a8494';
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by - 1, rx * 2.04, 7, 3.5);
  ctx.fill();
  ctx.fillStyle = '#6a6458'; // the old eye socket
  ellipse(ctx, rx * 0.45, by - h * 0.18, rx * 0.14, h * 0.08, 0.3);
  ctx.strokeStyle = 'rgba(138,130,112,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.5, by - h * 0.3);
  ctx.quadraticCurveTo(-rx * 0.2, by - h * 0.2, -rx * 0.3, by - h * 0.08);
  ctx.moveTo(rx * 0.05, by - h * 0.38);
  ctx.lineTo(rx * 0.15, by - h * 0.28);
  ctx.stroke();
  ctx.fillStyle = '#c8d8e8'; // a barnacle or two
  circle(ctx, -rx * 0.55, by - h * 0.12, 2.6);
  circle(ctx, -rx * 0.42, by - h * 0.06, 1.8);
}
// Angler's Lamp: a dark sea-green hood with a lanternfish's light on a stalk curling over the brow
function drawAnglerLamp(ctx, w, h, t = 0) {
  const by = -h * 0.72, rx = w * 0.5;
  ctx.fillStyle = '#2e5a5e';
  ctx.strokeStyle = '#163a40';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx, by - h * 0.44, rx, by - h * 0.44, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(190,255,220,0.6)';
  for (let i = 0; i < 5; i++) circle(ctx, -rx * 0.6 + i * rx * 0.3, by - 2, 1.6);
  const lx = rx * 0.75, ly = by - h * 0.5 + Math.sin(t * 2.5) * 2;
  ctx.strokeStyle = '#2e6a70';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, by - h * 0.3);
  ctx.quadraticCurveTo(rx * 0.3, by - h * 0.62, lx, ly);
  ctx.stroke();
  halo(ctx, lx, ly, 16, '170,255,200', 0.55);
  ctx.fillStyle = '#d8ffe8';
  circle(ctx, lx, ly, 4.2);
}
// Floe Crown: a ring of sea ice that never melts, its points standing up like floes, frost blue inside
function drawFloeCrown(ctx, w, h, t = 0) {
  const by = -h * 0.74, rx = w * 0.46;
  ctx.fillStyle = 'rgba(214,238,250,0.95)';
  ctx.strokeStyle = '#4e86b0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  const pts = [[-1, 0], [-0.82, -0.62], [-0.55, -0.12], [-0.3, -0.85], [0, -0.2], [0.28, -1], [0.55, -0.15], [0.8, -0.7], [1, 0]];
  for (const [x, y] of pts) ctx.lineTo(rx * x, by + y * h * 0.32);
  ctx.lineTo(rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,210,240,0.7)';
  for (const [x, y] of [[-0.3, -0.85], [0.28, -1], [0.8, -0.7]]) {
    ctx.beginPath();
    ctx.moveTo(rx * x, by + y * h * 0.32 + 3);
    ctx.lineTo(rx * x + 4, by + 2);
    ctx.lineTo(rx * x - 4, by + 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#f4ecd8'; // a band of narwhal ivory
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by, rx * 2.04, 6, 3);
  ctx.fill();
  const sh = 0.5 + 0.5 * Math.sin(t * 2);
  halo(ctx, rx * 0.28, by - h * 0.22, 12, '220,245,255', 0.35 * sh);
}
export const SKERRIES_HELMETS = { sealskin_hood: drawSealskinHood, bonecrab_helm: drawBonecrabHelm, angler_lamp: drawAnglerLamp, floe_crown: drawFloeCrown };

// ——— materials' icons (40 × 40, centred) ———
function iconSealWhisker(ctx) {
  ctx.strokeStyle = '#f4f6fa';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, 12);
  ctx.quadraticCurveTo(-2, -4, 14, -12);
  ctx.stroke();
  ctx.strokeStyle = '#8a94a6';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}
function iconSkuaFeather(ctx) {
  ctx.save();
  ctx.rotate(-0.6);
  ctx.fillStyle = '#6a5442';
  ctx.strokeStyle = '#3a2c24';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, -2, 6, 15, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f4efe6';
  ellipse(ctx, 0, 6, 4, 4);
  ctx.strokeStyle = '#3a2c24';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 16);
  ctx.stroke();
  ctx.restore();
}
function iconUrchinSpine(ctx) {
  ctx.save();
  ctx.rotate(0.7);
  ctx.fillStyle = '#7a3e90';
  ctx.strokeStyle = '#3e1a4e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, 15);
  ctx.lineTo(0, -16);
  ctx.lineTo(3, 15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function iconWhaleboneChip(ctx) {
  ctx.fillStyle = '#e8e2d2';
  ctx.strokeStyle = '#8a8270';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-13, 6);
  ctx.lineTo(-8, -10);
  ctx.lineTo(10, -12);
  ctx.lineTo(14, 4);
  ctx.lineTo(2, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(138,130,112,0.4)';
  for (const [x, y] of [[-4, -2], [3, -5], [6, 3], [-2, 5]]) circle(ctx, x, y, 1.4);
}
function iconBottledMist(ctx) {
  ctx.fillStyle = 'rgba(200,225,240,0.5)';
  ctx.strokeStyle = '#5a7a9a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-9, -6, 18, 20, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#a07a50';
  ctx.fillRect(-4, -14, 8, 7);
  ctx.fillStyle = 'rgba(240,246,250,0.95)';
  circle(ctx, -2, 4, 4);
  circle(ctx, 3, 7, 3.2);
  circle(ctx, 1, 0, 2.6);
}
function iconWalrusWhisker(ctx) {
  ctx.strokeStyle = '#5a3a2c';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-12, 12);
  ctx.quadraticCurveTo(0, 2, 12, -12);
  ctx.stroke();
  ctx.strokeStyle = '#c49a80';
  ctx.lineWidth = 1;
  ctx.stroke();
}
function iconLanternLure(ctx) {
  ctx.strokeStyle = '#2e6a70';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-10, 14);
  ctx.quadraticCurveTo(-8, -6, 6, -6);
  ctx.stroke();
  halo(ctx, 6, -6, 14, '170,255,200', 0.6);
  ctx.fillStyle = '#d8ffe8';
  circle(ctx, 6, -6, 5);
}
function iconEelSkin(ctx) {
  ctx.fillStyle = '#bfe2f2';
  ctx.strokeStyle = '#4a7a9a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-15, 8);
  ctx.quadraticCurveTo(-6, -10, 2, 0);
  ctx.quadraticCurveTo(8, 8, 15, -8);
  ctx.lineTo(15, -1);
  ctx.quadraticCurveTo(8, 15, 2, 7);
  ctx.quadraticCurveTo(-6, -3, -15, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
function iconBrineCrystal(ctx) {
  ctx.fillStyle = '#f4fffb';
  ctx.strokeStyle = '#4e8a7a';
  ctx.lineWidth = 1.6;
  for (const [x, y, s] of [[-6, 4, 9], [5, 0, 11], [0, 10, 6]]) {
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.6, y);
    ctx.lineTo(x, y + s * 0.5);
    ctx.lineTo(x - s * 0.6, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
function iconSkateWing(ctx) {
  ctx.fillStyle = '#8ab8a8';
  ctx.strokeStyle = '#2a4e46';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-14, 10);
  ctx.quadraticCurveTo(-4, -16, 14, -10);
  ctx.quadraticCurveTo(4, -2, 8, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,255,250,0.6)';
  for (const [x, y] of [[-2, -4], [4, -6], [2, 2]]) circle(ctx, x, y, 1.6);
}
function iconNarwhalIvory(ctx) {
  ctx.save();
  ctx.rotate(0.6);
  ctx.fillStyle = '#fbf6e8';
  ctx.strokeStyle = '#8a7a5a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-4, 16);
  ctx.lineTo(0, -17);
  ctx.lineTo(4, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.moveTo(-3.5 + i * 0.5, 13 - i * 5);
    ctx.lineTo(3.5 - i * 0.5, 10 - i * 5);
  }
  ctx.stroke();
  ctx.restore();
}
export const SKERRIES_ICONS = {
  seal_whisker: iconSealWhisker, skua_feather: iconSkuaFeather, urchin_spine: iconUrchinSpine, whalebone_chip: iconWhaleboneChip, bottled_mist: iconBottledMist,
  walrus_whisker: iconWalrusWhisker, lantern_lure: iconLanternLure, eel_skin: iconEelSkin, brine_crystal: iconBrineCrystal, skate_wing: iconSkateWing, narwhal_ivory: iconNarwhalIvory,
};

// Hakon the bone-carver: a fjord-folk slime in an oiled sealskin coat with a fur-edged hood (the hood he sells),
// a whalebone comb stuck in it, a carving knife in his belt and bone shavings down his front (src/slime.js)
export function drawBonecarverDress(ctx, w, h, fx, t) {
  ctx.save();
  // the coat
  ctx.fillStyle = '#6a7484';
  ctx.strokeStyle = '#3e4656';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, -h * 0.4);
  ctx.lineTo(w * 0.42, -h * 0.4);
  ctx.lineTo(w * 0.46, -h * 0.03);
  ctx.quadraticCurveTo(0, h * 0.03, -w * 0.46, -h * 0.03);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#3e4656'; // the front, toggled shut with bone pegs
  ctx.beginPath();
  ctx.moveTo(fx * 0.4, -h * 0.4);
  ctx.lineTo(fx * 0.4, -h * 0.03);
  ctx.stroke();
  ctx.fillStyle = '#efe8d6';
  for (const y of [0.32, 0.22, 0.12]) ctx.fillRect(fx * 0.4 - 3, -h * y - 1, 6, 2.4);
  // belt and the carving knife
  ctx.fillStyle = '#4e3a2c';
  ctx.fillRect(-w * 0.44, -h * 0.2, w * 0.88, 4);
  ctx.fillStyle = '#efe8d6';
  ctx.fillRect(-w * 0.3, -h * 0.26, 4, 12);
  ctx.fillStyle = '#c8d0dc';
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -h * 0.26);
  ctx.lineTo(-w * 0.3 + 4, -h * 0.26);
  ctx.lineTo(-w * 0.3 + 2, -h * 0.38);
  ctx.closePath();
  ctx.fill();
  // bone shavings stuck to him
  ctx.fillStyle = 'rgba(244,238,224,0.9)';
  for (const [x, y] of [[0.1, 0.3], [0.25, 0.14], [-0.12, 0.1], [0.3, 0.28]]) ellipse(ctx, w * x, -h * y, 2.4, 1, x * 4);
  // the hood, and the comb stuck in it
  drawSealskinHood(ctx, w, h);
  ctx.save();
  ctx.translate(-w * 0.28, -h * 1.06);
  ctx.rotate(-0.5 + Math.sin(t) * 0.02);
  ctx.fillStyle = '#efe8d6';
  ctx.strokeStyle = '#8a8068';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-8, -4, 16, 5, 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 6; i++) ctx.fillRect(-7 + i * 2.8, 1, 1.4, 5);
  ctx.restore();
  ctx.restore();
}
