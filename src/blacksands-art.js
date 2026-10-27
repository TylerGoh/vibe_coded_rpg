// Docs: docs/places/blacksands.md, docs/combat/stages.md
// The Black Sands' art that isn't the room itself (src/blacksands.js): its creatures (black-sand crab, steam
// toad, scald eel, frigatebird and the Bellower, the field boss; SANDS_MOB_ART, called by drawMob in
// src/field.js), the gear dropped there (SANDS_SWORDS, SANDS_SWORD_LEN, SANDS_HELMETS, drawn by drawSword /
// drawHelmet in src/field.js; the staves and bows are data in src/staff-art.js and src/bow-art.js) and its
// materials' icons (SANDS_ICONS). Emberdeep's register: basalt, black glass, iron, sulphur, ember.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#2d2a3e';
const BASALT = '#3e3844', BASALT_D = '#24202a', BASALT_L = '#5e5664';
const GLASS = '#2a2634';
const IRON = '#8a8490', IRON_D = '#4e4a56';
const SULPHUR = '#f2d45a', SULPHUR_D = '#b89a2a';

function eyes(ctx, fx, fy, gap, t, seed, { dying = 0, size = 1, cross = false } = {}) {
  ctx.strokeStyle = INKC;
  ctx.fillStyle = INKC;
  ctx.lineWidth = 1.8 * size;
  ctx.lineCap = 'round';
  const blink = ((t + seed * 7) % 3.4) < 0.12;
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
      ctx.fillStyle = INKC;
    }
  }
  if (cross && dying <= 0.05) {
    ctx.beginPath();
    ctx.moveTo(fx - gap - 3 * size, fy - 5 * size);
    ctx.lineTo(fx - gap + 3 * size, fy - 3.5 * size);
    ctx.moveTo(fx + gap + 3 * size, fy - 5 * size);
    ctx.lineTo(fx + gap - 3 * size, fy - 3.5 * size);
    ctx.stroke();
  }
}
// a puff of steam rising off something hot (k: 0..1 through its life)
function puff(ctx, x, y, r, k, a = 0.5) {
  ctx.fillStyle = `rgba(250,248,246,${a * Math.sin(k * Math.PI)})`;
  circle(ctx, x, y - k * 30, r * (0.6 + k));
}

// Black-sand crab: a little crab black as wet basalt, glittering with sand, one claw bigger than the other,
// scuttling sideways about the shallows. Harmless.
function drawSandCrab(ctx, w, h, t, seed, m, dying) {
  const scut = m.walking ? Math.sin(t * 16 + seed) : 0;
  const cy = -h * 0.5;
  // legs
  ctx.strokeStyle = BASALT_D;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x0 = s * w * (0.18 + i * 0.07), lift = (i % 2 ? scut : -scut) * 2;
      ctx.beginPath();
      ctx.moveTo(x0, cy + h * 0.1);
      ctx.lineTo(x0 + s * w * 0.14, cy + h * 0.05 - lift);
      ctx.lineTo(x0 + s * w * 0.2, -1 - Math.max(0, lift));
      ctx.stroke();
    }
  }
  const body = () => {
    ctx.ellipse(0, cy + h * 0.06, w * 0.34, h * 0.32, 0, 0, TAU);
  };
  ctx.fillStyle = BASALT;
  ctx.strokeStyle = BASALT_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BASALT_L;
  ellipse(ctx, -w * 0.08, cy - h * 0.06, w * 0.16, h * 0.08, -0.2);
  // sand glitter
  ctx.fillStyle = 'rgba(255,240,220,0.75)';
  for (let i = 0; i < 6; i++) circle(ctx, Math.sin(seed * 13 + i * 2.1) * w * 0.26, cy + h * 0.06 + Math.cos(seed * 7 + i * 1.7) * h * 0.18, 0.9);
  // claws: the big one in front
  for (const [cx, r] of [[w * 0.4, h * 0.2], [-w * 0.34, h * 0.13]]) {
    ctx.fillStyle = BASALT;
    ctx.strokeStyle = BASALT_D;
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.06 + scut, r * 1.2, r, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#ff9a6a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.2, cy - h * 0.06 + scut);
    ctx.lineTo(cx + r * 1.1, cy - h * 0.1 + scut);
    ctx.stroke();
    ctx.lineWidth = 1.6;
  }
  // eyes on stalks
  ctx.strokeStyle = BASALT_D;
  ctx.lineWidth = 2;
  for (const dx of [-5, 5]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.06 + dx, cy - h * 0.18);
    ctx.lineTo(w * 0.06 + dx, cy - h * 0.38);
    ctx.stroke();
  }
  eyes(ctx, w * 0.06, cy - h * 0.42, 5, t, seed, { dying, size: 0.6 });
  ctx.fillStyle = 'rgba(255,150,170,0.45)';
  ellipse(ctx, w * 0.14, cy + h * 0.02, 3, 2);
  return () => {
    ctx.beginPath();
    body();
  };
}

// Steam toad: a squat warty toad, ash-grey with sulphur-yellow warts, a pale belly, steam leaking from its back.
// It waddles along leaving puffs of scalding steam behind it (the `trail` brain, style 'steam': src/hazards.js)
function drawSteamToad(ctx, w, h, t, seed, m, dying) {
  const hop = m.walking ? Math.abs(Math.sin(t * 7 + seed)) * h * 0.12 : 0;
  const cy = -h * 0.45 - hop, breathe = 1 + Math.sin(t * 3 + seed) * 0.04;
  const body = () => {
    ctx.ellipse(0, cy, w * 0.44 * breathe, h * 0.42, 0, 0, TAU);
  };
  // back legs, folded
  ctx.fillStyle = '#6a6270';
  for (const s of [-1, 1]) ellipse(ctx, s * w * 0.3, -h * 0.14 - hop * 0.5, w * 0.16, h * 0.14);
  ctx.fillStyle = '#7a7280';
  ctx.strokeStyle = '#3e3844';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e8dcc8'; // belly
  ellipse(ctx, w * 0.1, cy + h * 0.16, w * 0.28, h * 0.2);
  // sulphur warts
  ctx.fillStyle = SULPHUR;
  ctx.strokeStyle = SULPHUR_D;
  ctx.lineWidth = 1;
  for (const [x, y, r] of [[-0.22, -0.2, 4], [-0.05, -0.32, 3.4], [-0.3, 0.02, 3], [0.12, -0.28, 2.6], [-0.12, -0.08, 2.4]]) {
    ctx.beginPath();
    ctx.arc(w * x, cy + h * y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // front feet
  ctx.fillStyle = '#6a6270';
  ellipse(ctx, w * 0.26, -3, w * 0.1, 3.5);
  // a wide mouth
  ctx.strokeStyle = INKC;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(w * 0.12, cy + h * 0.02);
  ctx.quadraticCurveTo(w * 0.3, cy + h * 0.1, w * 0.42, cy - h * 0.02);
  ctx.stroke();
  eyes(ctx, w * 0.24, cy - h * 0.3, 6, t, seed, { dying, size: 0.8 });
  ctx.fillStyle = 'rgba(255,150,170,0.5)';
  ellipse(ctx, w * 0.3, cy - h * 0.08, 3.5, 2);
  // steam leaking off its back
  if (dying < 0.05) for (let i = 0; i < 3; i++) puff(ctx, -w * 0.18 + i * 7, cy - h * 0.36, 5, (t * 0.7 + i / 3 + seed) % 1, 0.55);
  return () => {
    ctx.beginPath();
    body();
  };
}

// Scald eel: a long red-brown eel with a pale belly and a frill of fin, coiling over the hot sand between the
// pools. It ducks into a pool (m.special: only a boiling ring and a fin) and comes up in a scalding pulse
function drawScaldEel(ctx, w, h, t, seed, m, dying) {
  const gone = !!m.special && dying < 0.05;
  if (gone) {
    ctx.fillStyle = 'rgba(110,190,176,0.8)';
    ellipse(ctx, 0, -2, w * 0.46, 6);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 2; i++) {
      const k = (t * 1.2 + i * 0.5) % 1;
      ctx.beginPath();
      ctx.ellipse(0, -2, w * (0.2 + k * 0.3), 3 + k * 4, 0, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) puff(ctx, -w * 0.3 + i * w * 0.2, -6, 6, (t * 0.9 + i / 4) % 1, 0.6);
    ctx.fillStyle = '#b8503a';
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.quadraticCurveTo(0 + Math.sin(t * 6) * 3, -16, 8, -2);
    ctx.closePath();
    ctx.fill();
    return () => {
      ctx.beginPath();
      ctx.ellipse(0, -3, w * 0.46, 6, 0, 0, TAU);
    };
  }
  const wave = (x) => Math.sin(x / w * 7 - t * 6 + seed) * h * 0.16;
  const N = 16, thick = (k) => h * 0.24 * Math.sin(Math.min(1, k * 1.4 + 0.15) * Math.PI * 0.95) + 2;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N, x = -w * 0.5 + k * w;
    pts.push([x, -h * 0.4 + wave(x), thick(k)]);
  }
  const body = () => {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y, r] of pts) ctx.lineTo(x, y - r);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + pts[i][2]);
    ctx.closePath();
  };
  // the fin along its back
  ctx.fillStyle = '#e07a50';
  ctx.beginPath();
  ctx.moveTo(pts[2][0], pts[2][1] - pts[2][2]);
  for (let i = 2; i < N - 2; i++) ctx.lineTo(pts[i][0], pts[i][1] - pts[i][2] - 5 - (i % 2) * 2);
  ctx.lineTo(pts[N - 2][0], pts[N - 2][1] - pts[N - 2][2]);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a84a36';
  ctx.strokeStyle = '#5e2a22';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,214,170,0.75)'; // a pale belly line
  for (let i = 3; i < N; i += 2) ellipse(ctx, pts[i][0], pts[i][1] + pts[i][2] * 0.5, 4, 2);
  const [hx, hy] = pts[N - 1];
  eyes(ctx, hx - 2, hy - 3, 0.01, t, seed, { dying, size: 0.7, cross: true });
  // it steams in the air
  if (dying < 0.05) for (let i = 0; i < 2; i++) puff(ctx, pts[5 + i * 6][0], pts[5 + i * 6][1] - 8, 4, (t * 0.8 + i * 0.5 + seed) % 1, 0.45);
  return () => {
    ctx.beginPath();
    body();
  };
}

// Frigatebird: a long black seabird with sharp bent wings, a forked tail and a red throat pouch, hanging over
// the stacks on the hot air. m.warn: wings up, about to stoop · m.charging: diving
function drawFrigatebird(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const flap = dive ? -0.9 : warn ? -0.7 : Math.sin(t * 3 + seed) * 0.25;
  const cy = -h * 0.55;
  ctx.save();
  if (dive) {
    ctx.translate(0, cy);
    ctx.rotate(0.5);
    ctx.translate(0, -cy);
  }
  // wings: long and bent at the wrist
  ctx.fillStyle = '#26222e';
  ctx.strokeStyle = '#12101a';
  ctx.lineWidth = 1.4;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-w * 0.04, cy);
    ctx.lineTo(-w * 0.2, cy - s * h * 0.1 + flap * h * 0.5 * (s > 0 ? 1 : 0.4));
    ctx.lineTo(-w * 0.5, cy - s * h * 0.02 + flap * h * 0.8 * (s > 0 ? 1 : 0.4));
    ctx.lineTo(-w * 0.18, cy + h * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // the forked tail
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, cy + h * 0.04);
  ctx.lineTo(-w * 0.48, cy + h * 0.2);
  ctx.lineTo(-w * 0.34, cy + h * 0.06);
  ctx.lineTo(-w * 0.48, cy + h * 0.32);
  ctx.closePath();
  ctx.fill();
  const body = () => {
    ctx.ellipse(0, cy + h * 0.04, w * 0.24, h * 0.18, 0, 0, TAU);
  };
  ctx.fillStyle = '#2e2a36';
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // red throat pouch, puffed when it's about to stoop
  ctx.fillStyle = '#e8484a';
  ellipse(ctx, w * 0.18, cy + h * 0.14, warn ? w * 0.12 : w * 0.07, warn ? h * 0.18 : h * 0.1);
  // head and hooked grey bill
  ctx.fillStyle = '#2e2a36';
  circle(ctx, w * 0.24, cy - h * 0.06, h * 0.16);
  ctx.fillStyle = '#9a96a4';
  ctx.beginPath();
  ctx.moveTo(w * 0.3, cy - h * 0.1);
  ctx.lineTo(w * 0.52, cy - h * 0.06);
  ctx.quadraticCurveTo(w * 0.56, cy, w * 0.5, cy + h * 0.02);
  ctx.lineTo(w * 0.32, cy - h * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(120,200,170,0.4)'; // the green sheen
  ellipse(ctx, -w * 0.04, cy - h * 0.04, w * 0.12, h * 0.05, -0.2);
  ctx.fillStyle = '#fff';
  circle(ctx, w * 0.26, cy - h * 0.1, 2.6);
  eyes(ctx, w * 0.265, cy - h * 0.1, 0.01, t, seed, { dying, size: 0.55 });
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

// The Bellower: a steam toad the size of a hut, ash-grey and lumpy, black sand caked over its back in a crust,
// sulphur warts the size of buckets, a great throat sac that swells and booms, steam pouring off it. Passive
// until hit; then it heaves itself up (m.warn) and comes down on the beach with a shockwave. Airborne (vy).
function drawBellower(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, air = Math.abs(m.vy ?? 0) > 1 && live;
  const breathe = Math.sin(t * 1.6 + seed);
  const sac = live ? 0.6 + 0.4 * Math.max(0, Math.sin(t * 0.9 + seed)) + (warn ? 0.4 : 0) : 0.3;
  const squash = warn ? 0.88 : air ? 1.08 : 1 + breathe * 0.02;
  const cy = -h * 0.42 * squash;
  ctx.save();
  // back legs folded under, front feet splayed
  ctx.fillStyle = '#5e5664';
  for (const s of [-1, 1]) ellipse(ctx, s * w * 0.32, -h * 0.14, w * 0.18, h * 0.15);
  ctx.fillStyle = '#6a6270';
  ctx.strokeStyle = '#2e2a34';
  ctx.lineWidth = 2;
  for (const dx of [0.2, 0.34]) {
    ctx.beginPath();
    ctx.ellipse(w * dx, -h * 0.04, w * 0.08, h * 0.05, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  const body = () => {
    ctx.ellipse(0, cy, w * 0.48, h * 0.42 * squash, 0, 0, TAU);
  };
  ctx.fillStyle = '#787080';
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // the crust of black sand over its back
  ctx.fillStyle = BASALT;
  ctx.beginPath();
  ctx.moveTo(-w * 0.46, cy - h * 0.02);
  ctx.bezierCurveTo(-w * 0.44, cy - h * 0.46 * squash, w * 0.18, cy - h * 0.5 * squash, w * 0.3, cy - h * 0.28 * squash);
  ctx.lineTo(w * 0.18, cy - h * 0.2);
  ctx.lineTo(w * 0.04, cy - h * 0.26);
  ctx.lineTo(-w * 0.12, cy - h * 0.14);
  ctx.lineTo(-w * 0.3, cy - h * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,240,220,0.6)';
  for (let i = 0; i < 14; i++) circle(ctx, -w * 0.4 + ((i * 37) % 60) / 60 * w * 0.66, cy - h * 0.2 - ((i * 23) % 17) / 17 * h * 0.2 * squash, 1);
  // sulphur warts
  ctx.fillStyle = SULPHUR;
  ctx.strokeStyle = SULPHUR_D;
  ctx.lineWidth = 1.4;
  for (const [x, y, r] of [[-0.3, -0.26, 9], [-0.06, -0.38, 7], [0.14, -0.3, 6], [-0.38, -0.02, 6], [-0.18, -0.08, 5]]) {
    ctx.beginPath();
    ctx.arc(w * x, cy + h * y * squash, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  // a pale belly
  ctx.fillStyle = '#e8dcc8';
  ellipse(ctx, w * 0.1, cy + h * 0.2, w * 0.3, h * 0.16);
  // the throat sac, booming
  ctx.fillStyle = `rgba(242,${200 - Math.round(sac * 40)},150,0.95)`;
  ctx.strokeStyle = '#b07a5a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(w * 0.32, cy + h * 0.16, w * 0.1 * (0.6 + sac * 0.6), h * 0.12 * (0.6 + sac * 0.6), 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  // the wide mouth and a frown
  ctx.strokeStyle = INKC;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.14, cy + h * 0.02);
  ctx.quadraticCurveTo(w * 0.32, cy + h * 0.06, w * 0.46, cy - h * 0.06);
  ctx.stroke();
  // eye bumps and eyes
  ctx.fillStyle = '#787080';
  for (const dx of [0.2, 0.34]) circle(ctx, w * dx, cy - h * 0.3 * squash, h * 0.08);
  eyes(ctx, w * 0.27, cy - h * 0.3 * squash, w * 0.07, t, seed, { dying, size: 1.5, cross: warn || air });
  ctx.fillStyle = 'rgba(255,150,170,0.45)';
  ellipse(ctx, w * 0.38, cy - h * 0.12, 6, 3.5);
  // steam pouring off it
  if (live) for (let i = 0; i < 6; i++) puff(ctx, -w * 0.36 + i * w * 0.12, cy - h * 0.42 * squash, 10, (t * 0.4 + i / 6) % 1, warn ? 0.75 : 0.5);
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
  };
}

export const SANDS_MOB_ART = { sand_crab: drawSandCrab, steam_toad: drawSteamToad, scald_eel: drawScaldEel, frigatebird: drawFrigatebird, bellower: drawBellower };

// ——— swords: (ctx, L, glow), grip at the origin, blade up (-y) ———
function ironGrip(ctx) {
  ctx.fillStyle = '#4a3a30';
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.strokeStyle = IRON;
  ctx.lineWidth = 1;
  for (let y = -1; y < 10; y += 3.2) {
    ctx.beginPath();
    ctx.moveTo(-3, y);
    ctx.lineTo(3, y + 1.6);
    ctx.stroke();
  }
  ctx.fillStyle = IRON_D;
  circle(ctx, 0, 12, 3);
}
// Black Glass Cutlass: a curved blade knapped from one long flake of black glass, its edge scalloped from the
// knapping, on an iron grip with a plain iron guard
function drawBlackglassCutlass(ctx, L, glow) {
  ctx.save();
  ctx.lineJoin = 'round';
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.quadraticCurveTo(-6, -L * 0.6, 2, -L);
    ctx.quadraticCurveTo(8, -L * 0.6, 5, -6);
    ctx.closePath();
  };
  if (glow) {
    ctx.shadowColor = 'rgba(160,230,215,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = GLASS;
  blade();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#141220';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // the knapped edge and a green-grey sheen down the middle
  ctx.strokeStyle = 'rgba(200,240,232,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0.15; k < 0.92; k += 0.09) {
    const y = -L * k, x = 5 + Math.sin(k * 3) * 2.5;
    ctx.moveTo(x, y);
    ctx.arc(x - 2, y, 2, 0, Math.PI * 0.8);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,208,192,0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.quadraticCurveTo(-1.5, -L * 0.6, 2, -L * 0.94);
  ctx.stroke();
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-9, -7, 18, 4, 2);
  ctx.fill();
  ctx.stroke();
  ironGrip(ctx);
  ctx.restore();
}
// Bellower's Maul: a great lumpy head of vent-baked basalt on an iron haft, sulphur crusted in its pits, still
// glowing a little in the cracks
function drawBellowerMaul(ctx, L, glow) {
  ctx.save();
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-2.5, -L * 0.72, 5, L * 0.72);
  ctx.fillStyle = IRON;
  for (const y of [-L * 0.25, -L * 0.5]) ctx.fillRect(-3.5, y, 7, 3);
  if (glow) {
    ctx.shadowColor = 'rgba(255,170,110,0.85)';
    ctx.shadowBlur = 12;
  }
  const hy = -L * 0.84;
  ctx.fillStyle = BASALT;
  ctx.strokeStyle = BASALT_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-14, hy + 8);
  ctx.quadraticCurveTo(-17, hy - 4, -10, hy - 11);
  ctx.quadraticCurveTo(0, hy - 16, 11, hy - 10);
  ctx.quadraticCurveTo(17, hy - 2, 13, hy + 9);
  ctx.quadraticCurveTo(0, hy + 13, -14, hy + 8);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.strokeStyle = '#ff9a4a'; // the cracks, still hot
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-8, hy - 6); ctx.lineTo(-3, hy); ctx.lineTo(-6, hy + 6);
  ctx.moveTo(6, hy - 8); ctx.lineTo(4, hy - 1); ctx.lineTo(9, hy + 4);
  ctx.stroke();
  ctx.fillStyle = SULPHUR;
  for (const [x, y] of [[-10, hy + 2], [8, hy - 4], [1, hy + 7]]) circle(ctx, x, y, 2);
  ctx.fillStyle = BASALT_L;
  ellipse(ctx, -6, hy - 8, 4, 2, -0.3);
  ironGrip(ctx);
  ctx.restore();
}
export const SANDS_SWORDS = { blackglass_cutlass: drawBlackglassCutlass, bellower_maul: drawBellowerMaul };
export const SANDS_SWORD_LEN = { blackglass_cutlass: 60, bellower_maul: 64 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Basalt Helm: a round iron helm hammered from a mooring post's cap, rivets round the rim, a little crab-shaped
// crest of black basalt on top
function drawBasaltHelm(ctx, w, h) {
  const by = -h * 0.72, rx = w * 0.5;
  ctx.fillStyle = IRON;
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 6);
  ctx.bezierCurveTo(-rx, by - h * 0.42, rx, by - h * 0.42, rx, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(184,110,70,0.5)'; // rust
  ellipse(ctx, rx * 0.4, by - h * 0.1, rx * 0.25, 4, 0.3);
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.02, by + 2, rx * 2.04, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = '#c8c4cc';
  for (let i = -3; i <= 3; i++) circle(ctx, i * rx * 0.28, by + 4.5, 1.2);
  // the crab crest
  const cy = by - h * 0.3;
  ctx.fillStyle = BASALT;
  ctx.strokeStyle = BASALT_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, cy, 8, 5, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 10, cy - 3, 3.5, 2.6, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,240,220,0.8)';
  circle(ctx, -2, cy - 1.5, 0.9);
  circle(ctx, 3, cy, 0.9);
}
// Toadstone Helm: a domed iron helm with a cheek guard, a big rounded toadstone of black glass set in the brow
// with a warm glow inside it, two little sulphur studs either side
function drawToadstoneHelm(ctx, w, h, t = 0) {
  const by = -h * 0.72, rx = w * 0.52;
  ctx.fillStyle = '#7a7480';
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 8);
  ctx.bezierCurveTo(-rx, by - h * 0.46, rx, by - h * 0.46, rx, by + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.04, by + 2, rx * 2.08, 6, 3);
  ctx.fill();
  ctx.fillRect(-rx * 1.02, by + 2, 6, 14); // cheek guard
  // the toadstone
  const sy = by - h * 0.12, glow = 0.5 + 0.3 * Math.sin(t * 2);
  const g = ctx.createRadialGradient(0, sy, 0, 0, sy, 14);
  g.addColorStop(0, `rgba(255,170,110,${0.5 * glow})`);
  g.addColorStop(1, 'rgba(255,170,110,0)');
  ctx.fillStyle = g;
  circle(ctx, 0, sy, 14);
  ctx.fillStyle = GLASS;
  ctx.strokeStyle = '#c8c4cc';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, sy, 7, 6, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(255,170,110,${0.6 + 0.3 * glow})`;
  circle(ctx, 0.5, sy + 1, 2.4);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(ctx, -2.4, sy - 2.4, 2, 1.2, -0.4);
  ctx.fillStyle = SULPHUR;
  for (const s of [-1, 1]) circle(ctx, s * 13, sy + 2, 2.2);
}
export const SANDS_HELMETS = { basalt_helm: drawBasaltHelm, toadstone_helm: drawToadstoneHelm };

// ——— materials' icons (40 × 40, centred) ———
function iconSandClaw(ctx) {
  ctx.fillStyle = BASALT;
  ctx.strokeStyle = BASALT_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-12, 10);
  ctx.quadraticCurveTo(-14, -6, 2, -12);
  ctx.quadraticCurveTo(12, -14, 12, -6);
  ctx.lineTo(2, -4);
  ctx.quadraticCurveTo(10, 0, 10, 6);
  ctx.quadraticCurveTo(0, 8, -4, 2);
  ctx.lineTo(-6, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,220,0.85)';
  for (const [x, y] of [[-6, -2], [0, -8], [-8, 4], [4, 2]]) circle(ctx, x, y, 0.9);
  ctx.fillStyle = '#ff9a6a';
  ellipse(ctx, 8, -9, 3, 1.6, -0.3);
}
function iconToadWart(ctx) {
  ctx.fillStyle = '#7a7280';
  ellipse(ctx, 0, 6, 14, 6);
  ctx.fillStyle = SULPHUR;
  ctx.strokeStyle = SULPHUR_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff2a0';
  ellipse(ctx, -3, -4, 4, 2.4, -0.4);
  ctx.fillStyle = 'rgba(250,248,246,0.6)';
  circle(ctx, 6, -14, 4);
  circle(ctx, 10, -18, 3);
}
function iconScaldSkin(ctx) {
  ctx.fillStyle = '#a84a36';
  ctx.strokeStyle = '#5e2a22';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-15, 8);
  ctx.bezierCurveTo(-8, -10, 4, 14, 15, -8);
  ctx.lineTo(13, -12);
  ctx.bezierCurveTo(4, 6, -8, -16, -17, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,214,170,0.75)';
  for (const [x, y] of [[-10, 0], [-2, 0], [6, 0], [12, -6]]) ellipse(ctx, x, y + Math.sin(x * 0.3) * 3, 2.4, 1.2);
}
function iconFrigatePlume(ctx) {
  ctx.fillStyle = '#26222e';
  ctx.beginPath();
  ctx.moveTo(-12, 14);
  ctx.quadraticCurveTo(-6, -2, 12, -15);
  ctx.quadraticCurveTo(4, 4, -12, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(120,200,170,0.55)';
  ctx.beginPath();
  ctx.moveTo(-6, 6);
  ctx.quadraticCurveTo(0, -4, 10, -13);
  ctx.quadraticCurveTo(2, -2, -6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#9a96a4';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-14, 16);
  ctx.quadraticCurveTo(-4, 2, 12, -15);
  ctx.stroke();
}
function iconBellowStone(ctx) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
  g.addColorStop(0, 'rgba(255,170,110,0.45)');
  g.addColorStop(1, 'rgba(255,170,110,0)');
  ctx.fillStyle = g;
  circle(ctx, 0, 0, 16);
  ctx.fillStyle = GLASS;
  ctx.strokeStyle = '#141220';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-11, 6);
  ctx.quadraticCurveTo(-13, -8, 0, -11);
  ctx.quadraticCurveTo(13, -9, 11, 4);
  ctx.quadraticCurveTo(4, 12, -11, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,170,110,0.8)';
  circle(ctx, 1, 1, 3);
  ctx.fillStyle = 'rgba(200,240,232,0.7)';
  ellipse(ctx, -4, -5, 4, 1.8, -0.4);
}
export const SANDS_ICONS = { sand_claw: iconSandClaw, toad_wart: iconToadWart, scald_skin: iconScaldSkin, frigate_plume: iconFrigatePlume, bellow_stone: iconBellowStone };
