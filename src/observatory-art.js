// Docs: docs/places/observatory.md, docs/combat/stages.md
// The Buried Observatory's art that isn't the room itself (src/observatory.js; atlas Phase 9, A1): its creatures (dust
// wraith, dial sentry, sand asp, amber moth; OBS_MOB_ART, called by drawMob in src/field.js) and its materials' icons, the
// Sunroller's Sunstone Chip among them (OBS_ICONS). The Keepers' bronze gone green and gold under the sand, star-dials,
// dust in the light, amber; soft and rounded as ever.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const INKC = '#3a2a1e';
const BRONZE = '#b8823a', BRONZE_D = '#6a4418', BRONZE_L = '#e8b85a', VERD = '#6aa898';
const SAND = '#e8c88a', SAND_D = '#b8924e', SAND_L = '#f6e2b4';
const AMBER = '#e8a040', AMBER_D = '#a8661e', AMBER_L = '#ffd890';

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

// Dust wraith: the dust the old astronomers left, a tall soft drift of gold dust in the shape of a hooded slime, motes
// turning in it like stars; it fades out (`phase`: m.special) and comes back with a pulse
function drawDustWraith(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, faded = live && m?.special;
  const a = (live ? 1 : Math.max(0, 1 - dying * 1.4)) * (faded ? 0.25 : 1);
  const bob = live ? Math.sin(t * 1.6 + seed) * 3 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, -h * 0.1 + bob);
    ctx.bezierCurveTo(-w * 0.5, -h * 0.9 + bob, w * 0.5, -h * 0.9 + bob, w * 0.4, -h * 0.1 + bob);
    for (let i = 4; i >= 0; i--) ctx.lineTo(-w * 0.4 + (i / 4) * w * 0.8, -h * 0.1 + bob + (i % 2 ? 8 : 0) + Math.sin(t * 4 + i) * 2);
    ctx.closePath();
  };
  ctx.save();
  ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, 'rgba(246,226,180,0.85)');
  g.addColorStop(1, 'rgba(216,170,100,0.2)');
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  for (let i = 0; i < 12; i++) { // motes turning in it like stars
    const ang = t * 0.8 + i * 0.52 + seed;
    ctx.fillStyle = `rgba(255,248,220,${0.5 + 0.4 * Math.sin(t * 3 + i)})`;
    circle(ctx, Math.cos(ang) * w * 0.3, -h * 0.45 + Math.sin(ang * 1.3) * h * 0.25 + bob, 1.2);
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(184,130,58,0.35)'; // the hood's shadow
  ctx.beginPath();
  ctx.ellipse(w * 0.08, -h * 0.58 + bob, w * 0.26, h * 0.16, 0, 0, TAU);
  ctx.fill();
  eyes(ctx, w * 0.12, -h * 0.58 + bob, 5, t, seed, { dying, size: 0.9, col: '#5a3a1e' });
  ctx.restore();
  return body;
}

// Dial sentry: a Keeper-made watchman of green-gold bronze, a squat body on three short legs, a ring round it like a
// star-dial's and a head with one sun-glass lens; it turns to the sun and throws it at you (`beam`: m.warn, the lens
// brightening)
function drawDialSentry(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m?.warn && live;
  const body = () => {
    ctx.beginPath();
    ctx.roundRect(-w * 0.32, -h * 0.66, w * 0.64, h * 0.5, 10);
  };
  ctx.save();
  ctx.strokeStyle = BRONZE_D; // three short legs
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const lx of [-w * 0.22, 0, w * 0.22]) {
    ctx.moveTo(lx, -h * 0.18);
    ctx.lineTo(lx * 1.2, -1);
  }
  ctx.stroke();
  const g = ctx.createLinearGradient(-w * 0.3, 0, w * 0.3, 0);
  g.addColorStop(0, BRONZE_D);
  g.addColorStop(0.45, BRONZE_L);
  g.addColorStop(1, BRONZE);
  ctx.fillStyle = g;
  ctx.strokeStyle = BRONZE_D;
  ctx.lineWidth = 2;
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(106,168,152,0.55)'; // verdigris
  for (const [x, y, r] of [[-0.2, -0.3, 6], [0.14, -0.5, 4], [-0.06, -0.22, 3]]) ellipse(ctx, w * x, h * y, r, r * 0.6);
  ctx.strokeStyle = BRONZE_L; // the dial ring round it, turning
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.42, w * 0.46, h * 0.1, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = BRONZE_D;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + t * 0.6;
    if (Math.sin(a) < 0) continue;
    circle(ctx, Math.cos(a) * w * 0.46, -h * 0.42 + Math.sin(a) * h * 0.1, 2);
  }
  // the head: a dome with one lens, toward the sun (and you)
  ctx.fillStyle = BRONZE;
  ctx.strokeStyle = BRONZE_D;
  ctx.beginPath();
  ctx.ellipse(w * 0.04, -h * 0.72, w * 0.22, h * 0.16, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const lens = warn ? 1 : 0.4 + 0.15 * Math.sin(t * 2 + seed);
  const lg = ctx.createRadialGradient(w * 0.18, -h * 0.76, 1, w * 0.18, -h * 0.76, 22 * lens + 6);
  lg.addColorStop(0, `rgba(255,236,160,${0.8 * lens})`);
  lg.addColorStop(1, 'rgba(255,236,160,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(w * 0.18 - 30, -h * 0.76 - 30, 60, 60);
  ctx.fillStyle = '#26305a';
  circle(ctx, w * 0.18, -h * 0.76, 6.4);
  ctx.fillStyle = warn ? '#fffbe8' : '#ffe9a8';
  circle(ctx, w * 0.18, -h * 0.76, 4.2);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  circle(ctx, w * 0.17, -h * 0.78, 1.3);
  if (dying > 0.05) { // gone dark
    ctx.fillStyle = 'rgba(30,30,40,0.6)';
    circle(ctx, w * 0.18, -h * 0.76, 4.2);
  }
  ctx.restore();
  return body;
}

// Sand asp: a long sand-gold snake banded in rust, lying under the sand with only its head and the first coil showing,
// then rearing (m.warn) and lunging (`shell` with no shell: m.charging)
function drawSandAsp(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m?.warn && live, lunge = !!m?.charging && live;
  const rear = warn ? 1 : lunge ? 0.4 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.2, w * 0.46, h * 0.24, 0, 0, TAU);
  };
  ctx.save();
  ctx.strokeStyle = SAND; // the coils, half in the sand
  ctx.lineWidth = h * 0.36;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.46, -h * 0.12);
  for (let x = -w * 0.46; x <= w * 0.16; x += 4) ctx.lineTo(x, -h * 0.16 - Math.sin(x * 0.12 + (live ? t * 4 : 0) + seed) * h * 0.1);
  const hx = w * 0.3 + (lunge ? 12 : 0), hy = -h * 0.36 - rear * h * 0.7;
  ctx.quadraticCurveTo(w * 0.24, -h * 0.2, hx - 6, hy + 6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(184,88,58,0.75)'; // rust bands
  ctx.lineWidth = h * 0.36;
  ctx.setLineDash([4, 12]);
  ctx.lineDashOffset = live ? -t * 20 : 0;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = SAND_D; // the sand heaped over its back
  for (let i = 0; i < 4; i++) ellipse(ctx, -w * 0.4 + i * w * 0.16, -2, w * 0.1, 4);
  ctx.fillStyle = SAND; // the head, flat and wide
  ctx.strokeStyle = SAND_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(hx, hy, w * 0.14, h * 0.18, rear * -0.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b8583a';
  ellipse(ctx, hx - 2, hy - h * 0.08, w * 0.06, h * 0.05);
  if (warn || lunge) { // the tongue
    ctx.strokeStyle = '#d84a4a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(hx + w * 0.13, hy);
    ctx.lineTo(hx + w * 0.22, hy);
    ctx.lineTo(hx + w * 0.26, hy - 3);
    ctx.moveTo(hx + w * 0.22, hy);
    ctx.lineTo(hx + w * 0.26, hy + 3);
    ctx.stroke();
  }
  eyes(ctx, hx + 2, hy - 2, 3, t, seed, { dying, size: 0.7, col: '#3a2a1e' });
  ctx.restore();
  return body;
}

// Amber moth: big, slow and golden, its wings clear amber with old things caught in them, a furred body; it hangs high
// (fly), draws its wings back (m.warn) and stoops (the `dive` brain, m.charging)
function drawAmberMoth(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m?.warn && live, dive = !!m?.charging && live;
  const flap = live ? (warn ? 0.15 : dive ? 0.05 : 0.55 + Math.sin(t * 4 + seed) * 0.45) : 0.1;
  const cy = -h * 0.55;
  const wing = (back) => {
    const span = w * (back ? 0.44 : 0.54) * (0.35 + flap * 0.65);
    ctx.beginPath();
    ctx.moveTo(-w * 0.04, cy);
    ctx.bezierCurveTo(-span * 0.3, cy - h * 0.66, -span * 1.15, cy - h * 0.5, -span, cy - h * 0.04);
    ctx.quadraticCurveTo(-span * 0.7, cy + h * 0.26, -w * 0.04, cy + h * 0.06);
    ctx.closePath();
  };
  const sil = () => {
    ctx.beginPath();
    ctx.ellipse(w * 0.08, cy + 2, w * 0.22, h * 0.28, 0, 0, TAU);
  };
  ctx.save();
  if (dive) ctx.rotate(0.5);
  const g = ctx.createRadialGradient(0, cy, 2, 0, cy, w * 0.7);
  g.addColorStop(0, 'rgba(255,214,140,0.3)');
  g.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-w * 0.7, cy - w * 0.7, w * 1.4, w * 1.4);
  ctx.fillStyle = 'rgba(168,102,30,0.7)';
  wing(true);
  ctx.fill();
  ctx.fillStyle = 'rgba(232,160,64,0.78)';
  ctx.strokeStyle = AMBER_D;
  ctx.lineWidth = 1.4;
  wing(false);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  wing(false);
  ctx.clip();
  ctx.fillStyle = 'rgba(90,60,30,0.5)'; // old things caught in the amber: a seed, a leaf, a tiny gear
  const sx = -w * 0.3 * (0.35 + flap * 0.65);
  circle(ctx, sx, cy - h * 0.2, 2.4);
  ellipse(ctx, sx + 8, cy - h * 0.06, 4, 1.6, 0.6);
  ctx.strokeStyle = 'rgba(90,60,30,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(sx - 8, cy - h * 0.32, 2.4, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(-w * 0.5, cy - h * 0.4, w * 0.5, 2);
  ctx.restore();
  ctx.fillStyle = AMBER_L; // the furred body
  ctx.strokeStyle = AMBER_D;
  sil();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(168,102,30,0.5)';
  ctx.lineWidth = 1.2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.08 - w * 0.18, cy - h * 0.14 + i * h * 0.1);
    ctx.quadraticCurveTo(w * 0.08, cy - h * 0.08 + i * h * 0.1, w * 0.08 + w * 0.18, cy - h * 0.14 + i * h * 0.1);
    ctx.stroke();
  }
  ctx.strokeStyle = AMBER_D; // feathery antennae
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.2, cy - h * 0.2);
    ctx.quadraticCurveTo(w * 0.3 + s * 4, cy - h * 0.5, w * 0.38 + s * 6, cy - h * 0.56);
    ctx.stroke();
  }
  eyes(ctx, w * 0.22, cy - h * 0.06, 4, t, seed, { dying, size: 0.8, col: '#3a2410' });
  ctx.restore();
  return sil;
}

export const OBS_MOB_ART = { dust_wraith: drawDustWraith, dial_sentry: drawDialSentry, sand_asp: drawSandAsp, amber_moth: drawAmberMoth };

// ——— materials' icons (centred on the origin, about 28 px across) ———
function iconWraithDust(ctx) {
  ctx.save();
  ctx.fillStyle = '#c8a878';
  ctx.strokeStyle = '#8a6a42';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-9, 8);
  ctx.quadraticCurveTo(-11, -4, 0, -8);
  ctx.quadraticCurveTo(11, -4, 9, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,248,220,0.95)';
  for (const [x, y] of [[-3, 0], [2, -3], [4, 3], [-1, 4], [0, -1]]) circle(ctx, x, y, 1.1);
  ctx.restore();
}
function iconDialCog(ctx) {
  ctx.save();
  ctx.fillStyle = BRONZE;
  ctx.strokeStyle = BRONZE_D;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU, r = i % 2 ? 9 : 11.5;
    i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#26305a';
  circle(ctx, 0, 0, 4.4);
  ctx.fillStyle = BRONZE_L;
  for (const [x, y] of [[-6, -2], [5, -5], [3, 6]]) circle(ctx, x, y, 0.9);
  ctx.restore();
}
function iconAspSkin(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(232,200,138,0.9)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-11, 8);
  ctx.bezierCurveTo(-4, 12, 4, -2, -2, -4);
  ctx.bezierCurveTo(-8, -6, 2, -14, 10, -8);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(184,88,58,0.6)';
  ctx.setLineDash([2, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}
function iconAmberScale(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(232,160,64,0.9)';
  ctx.strokeStyle = AMBER_D;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.quadraticCurveTo(11, -2, 0, 11);
  ctx.quadraticCurveTo(-11, -2, 0, -11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,60,30,0.6)';
  circle(ctx, -1, 1, 1.8);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(ctx, -3, -4, 1.6, 3.4, 0.3);
  ctx.restore();
}
function iconSunstoneChip(ctx) {
  ctx.save();
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 14);
  g.addColorStop(0, 'rgba(255,226,140,0.5)');
  g.addColorStop(1, 'rgba(255,226,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-14, -14, 28, 28);
  ctx.fillStyle = '#d8b878';
  ctx.strokeStyle = '#8a6a42';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-9, 6);
  ctx.lineTo(-6, -7);
  ctx.lineTo(5, -10);
  ctx.lineTo(10, 2);
  ctx.lineTo(2, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#f4c64a'; // gold veins
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-6, 3);
  ctx.lineTo(0, -2);
  ctx.lineTo(6, -6);
  ctx.moveTo(0, -2);
  ctx.lineTo(3, 5);
  ctx.stroke();
  ctx.restore();
}
export const OBS_ICONS = { wraith_dust: iconWraithDust, dial_cog: iconDialCog, asp_skin: iconAspSkin, amber_scale: iconAmberScale, sunstone_chip: iconSunstoneChip };
export { BRONZE, BRONZE_D, BRONZE_L, VERD, AMBER, AMBER_D, AMBER_L, SAND, SAND_D, SAND_L };
