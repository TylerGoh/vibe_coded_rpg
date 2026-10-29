// Docs: docs/places/underflues.md, docs/combat/stages.md
// The Under-Flues' art that isn't the room itself (src/underflues.js): its creatures (cinder whelp, flue bat, clinker
// crawler and its clinker bits, stoker warden, and Orthrus, the Two-Headed Hound, the named elite; UNDERFLUES_MOB_ART,
// called by drawMob in src/field.js; the other elites are drawn as their base mob), the gear dropped there
// (UNDERFLUES_SWORDS, UNDERFLUES_SWORD_LEN, UNDERFLUES_HELMETS, drawn by drawSword / drawHelmet in src/field.js; the
// staff and bow are data in src/staff-art.js and src/bow-art.js) and its materials' icons (UNDERFLUES_ICONS).
// Emberdeep's register: soot, iron, clinker, coal; red only where something is still hot. The brood's tell: eyes like
// coals (two pairs on Orthrus).
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';
import { glow as softGlow } from './glow.js';

const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const IRON = '#6a6470', IRON_D = '#3a3640', IRON_L = '#9a94a0';
const SOOT = '#161214', SOOT_L = '#2e2628', COAL = '#1c1416';
const EMBER = '255,120,50';

// coal eyes: two glowing points (crossed out when dying)
function coalEyes(ctx, x, y, gap, r, t, seed, dying) {
  for (const ex of gap ? [x - gap, x + gap] : [x]) {
    if (dying > 0.05) {
      ctx.strokeStyle = '#2a1a14';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ex - r, y - r);
      ctx.lineTo(ex + r, y + r);
      ctx.moveTo(ex + r, y - r);
      ctx.lineTo(ex - r, y + r);
      ctx.stroke();
      continue;
    }
    const pulse = 0.8 + 0.2 * Math.sin(t * 3 + seed + ex);
    glow(ctx, ex, y, r * 3, r * 3, EMBER, 0.45 * pulse);
    ctx.fillStyle = '#ffb060';
    circle(ctx, ex, y, r);
    ctx.fillStyle = '#fff0c8';
    circle(ctx, ex + r * 0.3, y - r * 0.3, r * 0.4);
  }
}

// Cinder whelp: a small fire serpent, the brood: a low wavy body of black coal scales with the fire showing between
// them, a blunt head with coal eyes, a tongue of flame; it leaves burning cinders behind it (the `trail` brain)
function drawCinderWhelp(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, move = !!m.walking && live, ph = t * (move ? 9 : 2.5) + seed;
  const N = 9, pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, x = -w * 0.5 + u * w * 0.8;
    pts.push([x, -h * 0.3 - Math.sin(ph - u * 5) * h * 0.16 * (0.4 + u * 0.6), h * (0.12 + 0.16 * Math.sin(u * Math.PI * 0.9))]);
  }
  const body = () => {
    for (const [x, y, r] of pts) ctx.ellipse(x, y, r * 1.2, r, 0, 0, TAU);
  };
  // the glow under it
  if (live) glow(ctx, 0, -h * 0.1, w * 0.6, h * 0.4, EMBER, 0.25);
  for (let i = 0; i <= N; i++) {
    const [x, y, r] = pts[i];
    ctx.fillStyle = i % 2 ? COAL : '#2a1a18';
    ctx.strokeStyle = '#0a0606';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.2, r, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // the fire between the scales
    if (live) {
      ctx.strokeStyle = `rgba(255,${130 + 50 * Math.sin(ph + i)},60,0.75)`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.7, -2.3, -0.8);
      ctx.stroke();
    }
  }
  // the head
  const [hx, hy] = [w * 0.34, pts[N][1] - h * 0.06], hr = h * 0.26;
  ctx.fillStyle = '#2a1a18';
  ctx.strokeStyle = '#0a0606';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(hx, hy, hr * 1.4, hr, 0.1, 0, TAU);
  ctx.fill();
  ctx.stroke();
  coalEyes(ctx, hx + hr * 0.3, hy - hr * 0.35, 0, 2.2, t, seed, dying);
  if (live && Math.sin(t * 4 + seed) > 0.3) {
    ctx.fillStyle = 'rgba(255,160,70,0.85)';
    ctx.beginPath();
    ctx.moveTo(hx + hr * 1.3, hy + 1);
    ctx.lineTo(hx + hr * 2.1, hy - 2);
    ctx.lineTo(hx + hr * 1.8, hy + 2);
    ctx.lineTo(hx + hr * 2.2, hy + 4);
    ctx.closePath();
    ctx.fill();
  }
  return () => {
    ctx.beginPath();
    body();
    ctx.ellipse(hx, hy, hr * 1.4, hr, 0.1, 0, TAU);
  };
}

// Flue bat: a sooty bat that hangs in the flue mouths and drops on you (the `dive` brain), ragged leathery wings
// singed at the edges, coal eyes. m.warn: it folds and tips over · m.charging: the drop
function drawFlueBat(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, dive = !!m.charging && live;
  const cy = -h * 0.5, bob = live && !dive ? Math.sin(t * 5 + seed) * 3 : 0;
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(dive ? 0.7 : 0);
  const flap = dive ? -1.1 : warn ? -0.9 + Math.sin(t * 24) * 0.15 : Math.sin(t * 11 + seed) * 0.6;
  const wing = (s) => {
    ctx.save();
    ctx.translate(0, cy);
    ctx.rotate(flap * s * 0.8);
    ctx.scale(1, s);
    ctx.fillStyle = s > 0 ? '#1c1618' : '#2a2224';
    ctx.strokeStyle = '#060404';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-w * 0.2, -h * 0.6);
    ctx.lineTo(-w * 0.52, -h * 0.5);
    ctx.quadraticCurveTo(-w * 0.44, -h * 0.3, -w * 0.48, -h * 0.14);
    ctx.quadraticCurveTo(-w * 0.32, -h * 0.2, -w * 0.28, -h * 0.02);
    ctx.quadraticCurveTo(-w * 0.14, -h * 0.12, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (s > 0) {
      ctx.strokeStyle = 'rgba(255,130,60,0.55)'; // singed along the trailing edge
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-w * 0.52, -h * 0.5);
      ctx.quadraticCurveTo(-w * 0.44, -h * 0.3, -w * 0.48, -h * 0.14);
      ctx.stroke();
    }
    ctx.restore();
  };
  wing(1);
  const body = () => ctx.ellipse(0, cy, w * 0.16, h * 0.24, 0, 0, TAU);
  ctx.fillStyle = SOOT_L;
  ctx.strokeStyle = '#060404';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // head and ears
  const hx = w * 0.12, hy = cy - h * 0.2;
  ctx.fillStyle = SOOT_L;
  ctx.beginPath();
  ctx.arc(hx, hy, h * 0.16, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx - 4, hy - h * 0.1);
  ctx.lineTo(hx - 2, hy - h * 0.34);
  ctx.lineTo(hx + 3, hy - h * 0.12);
  ctx.moveTo(hx + 3, hy - h * 0.12);
  ctx.lineTo(hx + 7, hy - h * 0.32);
  ctx.lineTo(hx + 9, hy - h * 0.08);
  ctx.fill();
  coalEyes(ctx, hx + 3, hy, 3, 1.5, t, seed, dying);
  wing(-1);
  ctx.restore();
  return () => {
    ctx.beginPath();
    body();
    ctx.arc(hx, hy, h * 0.16, 0, TAU);
  };
}

// Clinker crawler: a heap of fused clinker (the glassy, holey stuff a fire leaves when it burns too hot) on a crowd of
// stubby legs, fire showing through the holes; break it and it falls apart into clinker bits (the `split` brain)
const LUMPS = [[0, -0.34, 0.36, 0.24], [-0.2, -0.56, 0.22, 0.18], [0.14, -0.62, 0.22, 0.17], [-0.02, -0.82, 0.16, 0.13]];
function drawClinkerCrawler(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, move = !!m.walking && live;
  ctx.strokeStyle = '#1a1416';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const x = -w * 0.3 + i * w * 0.15, sw = move ? Math.sin(t * 14 + i * 1.7 + seed) * 4 : 0;
    ctx.beginPath();
    ctx.moveTo(x, -h * 0.18);
    ctx.lineTo(x + sw, -1);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  const lumps = LUMPS.map(([x, y, rx, ry]) => [x * w, y * h, rx * w, ry * h]);
  for (const [x, y, rx, ry] of lumps) {
    ctx.fillStyle = '#3a3438';
    ctx.strokeStyle = '#0e0a0c';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(150,150,170,0.25)'; // a glassy sheen
    ellipse(ctx, x - rx * 0.3, y - ry * 0.4, rx * 0.4, ry * 0.2);
  }
  // the holes, with the fire in them
  const holes = [[-0.14, -0.36, 4], [0.1, -0.3, 3], [0.2, -0.5, 3.4], [-0.2, -0.6, 2.8], [0.02, -0.66, 3], [-0.06, -0.84, 2.4], [0.24, -0.34, 2.2]];
  for (const [x, y, r] of holes) {
    ctx.fillStyle = live ? `rgba(255,${120 + 40 * Math.sin(t * 3 + x * 9 + seed)},50,0.9)` : '#1a1214';
    circle(ctx, x * w, y * h, r);
  }
  coalEyes(ctx, w * 0.2, -h * 0.4, 4, 1.8, t, seed, dying);
  return () => {
    ctx.beginPath();
    for (const [x, y, rx, ry] of lumps) ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  };
}
// a clinker bit: one fused lump on three legs, hopping
function drawClinkerBit(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  ctx.strokeStyle = '#1a1416';
  ctx.lineWidth = 2;
  for (const x of [-0.25, 0, 0.25]) {
    ctx.beginPath();
    ctx.moveTo(w * x, -h * 0.3);
    ctx.lineTo(w * x * 1.2, -1);
    ctx.stroke();
  }
  const body = () => ctx.ellipse(0, -h * 0.55, w * 0.46, h * 0.4, 0, 0, TAU);
  ctx.fillStyle = '#3a3438';
  ctx.strokeStyle = '#0e0a0c';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = live ? 'rgba(255,140,60,0.9)' : '#1a1214';
  circle(ctx, -w * 0.12, -h * 0.5, 2);
  circle(ctx, w * 0.14, -h * 0.66, 1.6);
  coalEyes(ctx, w * 0.18, -h * 0.5, 2.6, 1.2, t, seed, dying);
  return () => {
    ctx.beginPath();
    body();
  };
}

// Stoker warden: a Keeper iron figure built to work the fires, blocky and riveted, a slot of a visor glowing, holding
// a long fire-iron across its front in both hands: hits from in front glance off it (the shell brain), go round
// behind. m.warn: it raises the iron · m.charging: lunges
function drawStokerWarden(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, lunge = !!m.charging && live;
  const step = m.walking && live ? Math.sin(t * 8 + seed) * 2 : 0;
  // legs
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-w * 0.22, -h * 0.3 + step, w * 0.16, h * 0.3 - step);
  ctx.fillRect(w * 0.04, -h * 0.3 - step, w * 0.16, h * 0.3 + step);
  // the body: a riveted iron box, sooty, a furnace-door hatch in its chest with the fire behind it
  const body = () => ctx.roundRect(-w * 0.32, -h * 0.84, w * 0.62, h * 0.56, 5);
  ctx.fillStyle = IRON;
  ctx.strokeStyle = '#141216';
  ctx.lineWidth = 2;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(20,14,16,0.45)'; // soot
  ctx.fillRect(-w * 0.32, -h * 0.84, w * 0.62, h * 0.16);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-w * 0.14, -h * 0.62, w * 0.26, h * 0.2);
  if (live) {
    ctx.fillStyle = `rgba(255,${110 + 50 * Math.sin(t * 2.4 + seed)},40,0.85)`;
    for (let i = 0; i < 3; i++) ctx.fillRect(-w * 0.11, -h * 0.6 + i * h * 0.06, w * 0.2, h * 0.025);
  }
  ctx.fillStyle = IRON_L;
  for (const [x, y] of [[-0.27, -0.79], [0.25, -0.79], [-0.27, -0.33], [0.25, -0.33]]) circle(ctx, w * x, h * y, 1.6);
  // the head: a squat iron helm with a slot visor
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.roundRect(-w * 0.18, -h, w * 0.36, h * 0.18, [6, 6, 2, 2]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-w * 0.24, -h * 0.84, w * 0.48, 3); // the brim
  if (dying > 0.05) {
    ctx.fillStyle = '#1a1214';
    ctx.fillRect(-w * 0.1, -h * 0.94, w * 0.26, 3);
  } else {
    glow(ctx, w * 0.03, -h * 0.92, w * 0.24, 8, EMBER, 0.5);
    ctx.fillStyle = '#ffb060';
    ctx.fillRect(-w * 0.1, -h * 0.94, w * 0.26, 3);
  }
  // the fire-iron, held across its front (raised when it warns, thrust forward when it lunges)
  const iy = -h * 0.56 + (warn ? -h * 0.14 : 0), ix = lunge ? w * 0.18 : 0;
  ctx.strokeStyle = '#2a2630';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.1 + ix, iy + h * 0.12);
  ctx.lineTo(w * 0.7 + ix, iy - h * 0.08);
  ctx.stroke();
  ctx.lineCap = 'butt';
  // its tip, worn round and hot
  ctx.fillStyle = live ? '#ff8a40' : '#4a3a34';
  circle(ctx, w * 0.7 + ix, iy - h * 0.08, 3.4);
  if (live) glow(ctx, w * 0.7 + ix, iy - h * 0.08, 12, 12, EMBER, 0.6);
  // the hands on it
  ctx.fillStyle = IRON_D;
  circle(ctx, w * 0.16 + ix, iy + h * 0.06, 5);
  circle(ctx, w * 0.36 + ix, iy + h * 0.02, 5);
  return () => {
    ctx.beginPath();
    body();
    ctx.roundRect(-w * 0.18, -h, w * 0.36, h * 0.18, 4);
  };
}

// Orthrus, the Two-Headed Hound: a soot hound the size of a cart with two heads on two necks off one great chest,
// matted black, coal eyes (two pairs), a smoulder showing through the fur at the chest; it barks one head at a time.
// m.warn: both heads drop and growl, embers at the jaws · m.charging: the charge, heads low and forward
function drawOrthrus(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live, run = (!!m.walking || !!m.charging) && live;
  const ph = t * (run ? 13 : 2.2) + seed, cy = -h * 0.5;
  // legs
  ctx.strokeStyle = '#0c0a0b';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  for (const [x, o] of [[-w * 0.3, 0], [-w * 0.18, Math.PI], [w * 0.12, Math.PI * 0.5], [w * 0.22, Math.PI * 1.5]]) {
    const sw = run ? Math.sin(ph + o) * 10 : 0;
    ctx.beginPath();
    ctx.moveTo(x, cy + h * 0.06);
    ctx.lineTo(x + sw * 0.5, -h * 0.18);
    ctx.lineTo(x + sw, -3);
    ctx.stroke();
  }
  // the tail, a ragged rope of soot
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, cy - h * 0.06);
  ctx.quadraticCurveTo(-w * 0.52, cy - h * 0.4, -w * 0.5, cy - h * 0.12 + Math.sin(ph * 0.4) * 5);
  ctx.stroke();
  ctx.lineCap = 'butt';
  const body = () => {
    ctx.moveTo(-w * 0.38, cy + h * 0.02);
    ctx.quadraticCurveTo(-w * 0.36, cy - h * 0.3, -w * 0.06, cy - h * 0.3);
    ctx.quadraticCurveTo(w * 0.2, cy - h * 0.36, w * 0.3, cy - h * 0.12);
    ctx.quadraticCurveTo(w * 0.32, cy + h * 0.18, w * 0.1, cy + h * 0.2);
    ctx.quadraticCurveTo(-w * 0.2, cy + h * 0.24, -w * 0.38, cy + h * 0.02);
    ctx.closePath();
  };
  ctx.fillStyle = SOOT;
  ctx.strokeStyle = '#050404';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  body();
  ctx.fill();
  ctx.stroke();
  // the smoulder at its chest, breathing
  if (live) glow(ctx, w * 0.2, cy, w * 0.14, h * 0.18, EMBER, 0.35 + 0.15 * Math.sin(t * 1.6 + seed));
  // matted tufts along its back
  ctx.fillStyle = SOOT_L;
  for (let i = 0; i < 7; i++) {
    const x = -w * 0.32 + i * w * 0.09, y = cy - h * 0.3 - Math.sin((i / 6) * Math.PI) * h * 0.04;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 4);
    ctx.lineTo(x + 1, y - 8);
    ctx.lineTo(x + 6, y + 4);
    ctx.fill();
  }
  // the two heads: the far one behind and higher, the near one in front and lower. One barks at a time
  const bark = live && !warn && !m.charging ? Math.floor((t + seed) / 0.9) % 2 : -1; // (which head is barking)
  const barkK = Math.max(0, Math.sin((((t + seed) % 0.9) / 0.9) * Math.PI));
  const heads = [];
  for (const [i, dx, dy, sc] of [[0, 0.3, -0.34, 0.9], [1, 0.36, -0.12, 1]]) {
    const low = warn || m.charging ? h * 0.12 : 0;
    const hx = w * dx + (m.charging && live ? w * 0.04 : 0), hy = cy + h * dy + low, hr = h * 0.17 * sc;
    const open = bark === i ? barkK : warn ? 0.35 : 0;
    // the neck
    ctx.strokeStyle = i ? SOOT : '#100c0d';
    ctx.lineWidth = hr * 1.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(w * 0.16, cy - h * 0.08);
    ctx.quadraticCurveTo(w * (dx - 0.04), hy + hr * 0.6, hx - hr * 0.4, hy);
    ctx.stroke();
    ctx.lineCap = 'butt';
    // skull and muzzle; the jaw drops when it barks
    ctx.fillStyle = i ? SOOT : '#100c0d';
    ctx.strokeStyle = '#050404';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(hx, hy, hr * 1.05, hr * 0.9, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hx + hr * 0.4, hy - hr * 0.5);
    ctx.lineTo(hx + hr * 1.9, hy - hr * 0.1);
    ctx.lineTo(hx + hr * 1.9, hy + hr * 0.2);
    ctx.lineTo(hx + hr * 0.6, hy + hr * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(hx + hr * 0.6, hy + hr * 0.3);
    ctx.rotate(0.55 * open);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(hr * 1.2, -hr * 0.05);
    ctx.lineTo(hr * 1.1, hr * 0.3);
    ctx.lineTo(0, hr * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (open > 0.15) {
      // the bark: a gout of embers out of the open jaw
      const mx = hx + hr * 1.9, my = hy + hr * 0.3;
      glow(ctx, mx + hr * 0.6, my, hr * 1.2, hr * 0.8, EMBER, 0.5 * open);
      ctx.fillStyle = `rgba(255,190,110,${0.8 * open})`;
      for (let k = 0; k < 4; k++) circle(ctx, mx + hr * (0.3 + k * 0.35), my + Math.sin(t * 20 + k) * 3, 1.6);
    }
    // an ear, back
    ctx.fillStyle = i ? SOOT : '#100c0d';
    ctx.beginPath();
    ctx.moveTo(hx - hr * 0.2, hy - hr * 0.7);
    ctx.lineTo(hx - hr * 0.7, hy - hr * 1.6);
    ctx.lineTo(hx + hr * 0.3, hy - hr * 0.8);
    ctx.closePath();
    ctx.fill();
    coalEyes(ctx, hx + hr * 0.5, hy - hr * 0.3, hr * 0.22, 2.2 * sc, t, seed + i, dying);
    heads.push([hx, hy, hr]);
  }
  return () => {
    ctx.beginPath();
    body();
    for (const [hx, hy, hr] of heads) ctx.ellipse(hx + hr * 0.6, hy, hr * 1.5, hr, 0, 0, TAU);
  };
}
export const UNDERFLUES_MOB_ART = { cinder_whelp: drawCinderWhelp, flue_bat: drawFlueBat, clinker_crawler: drawClinkerCrawler, clinker_bit: drawClinkerBit, stoker_warden: drawStokerWarden, orthrus: drawOrthrus };

// ——— gear: swords (ctx, L, glow), grip at the origin, blade up (-y) ———
// Twinfang: two black fangs forged side by side into one blade, a groove of coal-red between them, a grip bound in
// soot-stiff hide, a forked iron guard
function drawTwinfang(ctx, L, gl) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#2a2024';
  ctx.beginPath();
  ctx.roundRect(-3, -3, 6, 14, 2);
  ctx.fill();
  ctx.strokeStyle = '#4a3e40';
  ctx.lineWidth = 1;
  for (let y = -1; y < 10; y += 3) {
    ctx.beginPath();
    ctx.moveTo(-3, y);
    ctx.lineTo(3, y + 1.5);
    ctx.stroke();
  }
  ctx.fillStyle = IRON_D; // the forked guard
  ctx.beginPath();
  ctx.moveTo(-9, -2);
  ctx.lineTo(-7, -8);
  ctx.lineTo(0, -5);
  ctx.lineTo(7, -8);
  ctx.lineTo(9, -2);
  ctx.closePath();
  ctx.fill();
  if (gl) glow(ctx, 0, -L * 0.5, 14, L * 0.6, EMBER, 0.35);
  const fang = (d) => {
    ctx.beginPath();
    ctx.moveTo(d * 1, -6);
    ctx.quadraticCurveTo(d * 7.5, -L * 0.5, d * 2, -L * (d < 0 ? 0.94 : 1));
    ctx.quadraticCurveTo(d * 2.4, -L * 0.5, d * 0.4, -6);
    ctx.closePath();
  };
  for (const d of [-1, 1]) {
    const g = ctx.createLinearGradient(d * 6, 0, 0, 0);
    g.addColorStop(0, '#3a3236');
    g.addColorStop(1, '#0c0a0b');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#040303';
    ctx.lineWidth = 1.3;
    fang(d);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,130,60,0.8)'; // the hot groove between them
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(0, -L * 0.82);
  ctx.stroke();
  ctx.restore();
}
export const UNDERFLUES_SWORDS = { twinfang: drawTwinfang };
export const UNDERFLUES_SWORD_LEN = { twinfang: 64 };

// ——— helmets: (ctx, w, h, t), origin at the wearer's feet ———
// Stoker's Helm: a stoker warden's squat iron helm, a slot of a visor glowing faintly, a wide brim against the heat,
// soot in every rivet
function drawStokerHelm(ctx, w, h, t = 0) {
  const by = -h * 0.68, rx = w * 0.5;
  ctx.fillStyle = IRON;
  ctx.strokeStyle = '#141216';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.86, by + 2);
  ctx.lineTo(-rx * 0.8, by - h * 0.34);
  ctx.quadraticCurveTo(0, by - h * 0.5, rx * 0.8, by - h * 0.34);
  ctx.lineTo(rx * 0.86, by + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(20,14,16,0.4)';
  ellipse(ctx, 0, by - h * 0.38, rx * 0.6, 4);
  ctx.fillStyle = IRON_L;
  for (const x of [-0.6, -0.2, 0.2, 0.6]) circle(ctx, rx * x, by - h * 0.28, 1.4);
  // the visor slot
  glow(ctx, 0, by - h * 0.12, rx * 0.8, 8, EMBER, 0.3 + 0.1 * Math.sin(t * 1.5));
  ctx.fillStyle = '#ffb060';
  ctx.fillRect(-rx * 0.5, by - h * 0.14, rx, 3);
  // the brim
  ctx.fillStyle = IRON_D;
  ctx.strokeStyle = '#141216';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-rx * 1.18, by, rx * 2.36, 5, 2.5);
  ctx.fill();
  ctx.stroke();
}
export const UNDERFLUES_HELMETS = { stoker_helm: drawStokerHelm };

// ——— materials' icons (40 × 40, centred) ———
function iconWhelpEmber(ctx) {
  glow(ctx, 0, 0, 18, 18, EMBER, 0.45);
  ctx.fillStyle = COAL;
  ctx.strokeStyle = '#060404';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, 6);
  ctx.quadraticCurveTo(-12, -8, 0, -12);
  ctx.quadraticCurveTo(12, -8, 10, 6);
  ctx.quadraticCurveTo(0, 12, -10, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,150,70,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.lineTo(0, 2);
  ctx.lineTo(5, -4);
  ctx.moveTo(0, 2);
  ctx.lineTo(1, 8);
  ctx.stroke();
}
function iconFlueBatWing(ctx) {
  ctx.fillStyle = '#1c1618';
  ctx.strokeStyle = '#060404';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-14, 10);
  ctx.lineTo(-6, -14);
  ctx.lineTo(14, -8);
  ctx.quadraticCurveTo(8, -2, 10, 4);
  ctx.quadraticCurveTo(2, 2, 2, 10);
  ctx.quadraticCurveTo(-6, 6, -14, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,130,60,0.6)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(14, -8);
  ctx.quadraticCurveTo(8, -2, 10, 4);
  ctx.quadraticCurveTo(2, 2, 2, 10);
  ctx.stroke();
}
function iconClinkerCake(ctx) {
  ctx.fillStyle = '#3a3438';
  ctx.strokeStyle = '#0e0a0c';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-13, 6);
  ctx.quadraticCurveTo(-14, -8, -4, -11);
  ctx.quadraticCurveTo(8, -14, 13, -3);
  ctx.quadraticCurveTo(15, 9, 2, 11);
  ctx.quadraticCurveTo(-8, 13, -13, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#120c0e';
  for (const [x, y, r] of [[-5, -3, 2.6], [4, -5, 2], [6, 4, 2.4], [-3, 5, 1.8], [-9, 1, 1.4]]) circle(ctx, x, y, r);
  ctx.fillStyle = 'rgba(160,160,180,0.35)';
  ellipse(ctx, -2, -8, 6, 2);
}
function iconStokerIron(ctx) {
  ctx.save();
  ctx.rotate(-0.7);
  ctx.fillStyle = '#2a2630';
  ctx.fillRect(-2.5, -16, 5, 30);
  ctx.fillStyle = '#4a3a34';
  ctx.fillRect(-3.5, 8, 7, 8);
  glow(ctx, 0, -16, 9, 9, EMBER, 0.55);
  ctx.fillStyle = '#6a7ab0'; // worn blue from the heat
  ctx.fillRect(-2.5, -12, 5, 5);
  ctx.fillStyle = '#ff8a40';
  circle(ctx, 0, -16, 3.4);
  ctx.restore();
}
export const UNDERFLUES_ICONS = { whelp_ember: iconWhelpEmber, fluebat_wing: iconFlueBatWing, clinker_cake: iconClinkerCake, stoker_iron: iconStokerIron };
