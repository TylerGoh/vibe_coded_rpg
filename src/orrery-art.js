// Docs: docs/places/orrery.md, docs/combat/stages.md
// The Citadel's depth pass, C1's art that isn't a room (the Orrery's room is src/orrery.js, Meridian and its den
// src/dens-orrery.js): the Orrery's machines (armillary ring, star-glass wisp, astrolabe sentry) (ORRERY_MOB_ART, called by
// drawMob in src/field.js); their materials' icons and Meridian's (ORRERY_ICONS); gear for players (ORRERY_SWORDS,
// ORRERY_SWORD_LEN, ORRERY_HELMETS): Meridian's Arm and the Armillary Crown (the staff and bow are rows in
// src/staff-art.js and src/bow-art.js); and the Last Echo's look (folk 'echo': ECHO_PALETTE, drawEchoFolk; the 'keeper'
// accessory: drawKeeperDress, both through src/slime.js). The Citadel's register: brass, star-glass, solemn, no whimsy.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse, clamp } from './util.js';

const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const STAR = '214,228,255'; // star-glass light, cold
const GLASS = 'rgba(200,216,250,0.55)';
const NIGHT = '#1e2440';
const warnK = (v) => (v === true ? 1 : clamp(+v || 0, 0, 1));

function starPoint(ctx, x, y, r, a = 1) {
  // a four-pointed glint
  ctx.fillStyle = `rgba(${STAR},${a})`;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.18, y - r * 0.18, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.18, y + r * 0.18, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.18, y + r * 0.18, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.18, y - r * 0.18, x, y - r);
  ctx.fill();
}
function hoop(ctx, x, y, rx, ry, rot, lw, col, edge) {
  ctx.strokeStyle = edge;
  ctx.lineWidth = lw + 2;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = lw;
  ctx.stroke();
}

// An armillary ring: three brass hoops nested round a small glass bead, rolling along the floor the way it used to turn.
// Rolling forward, the outer hoop spins; the inner two keep their own slow turn. On its warn it leans back to roll at you
function drawArmillaryRing(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const r = Math.min(w, h) * 0.48, cy = -r - 1;
  const roll = live ? t * 4.2 + seed * 3 : seed;
  const lean = m?.warn ? -0.18 * warnK(m.warn) : 0;
  const body = () => {
    ctx.beginPath();
    ctx.arc(0, cy, r, 0, TAU);
  };
  ctx.save();
  ctx.fillStyle = 'rgba(40,30,60,0.18)'; // its shadow
  ellipse(ctx, 0, 0, r * 0.8, 4);
  ctx.translate(0, cy);
  ctx.rotate(lean);
  // the outer hoop, rolling (its graduations show the spin)
  hoop(ctx, 0, 0, r, r, 0, 4, BRASS, BRASS_E);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 12; i++) {
    const a = roll + (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3));
    ctx.lineTo(Math.cos(a) * (r + 2), Math.sin(a) * (r + 2));
    ctx.stroke();
  }
  // the inner hoops, tilted, turning slowly on their own
  const a1 = live ? t * 0.9 + seed : seed, a2 = live ? -t * 0.6 + seed * 2 : seed * 2;
  hoop(ctx, 0, 0, r * 0.74, r * 0.74 * Math.abs(Math.cos(a1)) + 2, 0.4, 3, BRASS_L, BRASS_D);
  hoop(ctx, 0, 0, r * 0.74 * Math.abs(Math.cos(a2)) + 2, r * 0.74, -0.3, 3, BRASS_L, BRASS_D);
  // the pivot pins
  ctx.fillStyle = BRASS_E;
  for (const s of [-1, 1]) circle(ctx, s * r * 0.74 * Math.cos(0.4), s * r * 0.74 * Math.sin(0.4), 2.4);
  // the bead, a little world of clouded glass
  const k = live ? 0.7 + 0.3 * Math.sin(t * 2 + seed * 4) : 0.25;
  const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, r * 0.3);
  g.addColorStop(0, `rgba(240,246,255,${0.95 * k + 0.05})`);
  g.addColorStop(1, `rgba(120,140,200,${0.6 * k + 0.2})`);
  ctx.fillStyle = g;
  circle(ctx, 0, 0, r * 0.28);
  ctx.strokeStyle = 'rgba(90,100,150,0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.28, 0, TAU);
  ctx.stroke();
  if (dying > 0.05) { // the hoops spring apart
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - dying)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, -r * 0.1);
    ctx.lineTo(r * 0.1, r * 0.15);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

// A star-glass wisp: fallen stars' glass got up off the floor, a cold point of light with a shell of glass shards turning
// round it (when it goes to nothing, phase, the shared mob drawing fades it)
function drawStarglassWisp(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const cy = -h * 0.55 + (live ? Math.sin(t * 1.7 + seed * 5) * 4 : 0);
  const rr = Math.min(w, h) * 0.42;
  const body = () => {
    ctx.beginPath();
    ctx.arc(0, cy, rr, 0, TAU);
  };
  ctx.save();
  ctx.globalAlpha *= live ? 1 : 1 - dying * 0.8;
  // its glow
  const g = ctx.createRadialGradient(0, cy, 1, 0, cy, rr * 1.6);
  g.addColorStop(0, `rgba(${STAR},0.7)`);
  g.addColorStop(0.4, `rgba(${STAR},0.22)`);
  g.addColorStop(1, `rgba(${STAR},0)`);
  ctx.fillStyle = g;
  circle(ctx, 0, cy, rr * 1.6);
  // the shell of shards
  const spin = live ? t * 1.3 + seed : seed;
  for (let i = 0; i < 7; i++) {
    const a = spin + (i / 7) * TAU, d = rr * (0.8 + 0.12 * Math.sin(i * 2.1));
    const x = Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.7;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + 0.8);
    ctx.fillStyle = Math.sin(a) > 0 ? 'rgba(220,232,255,0.85)' : GLASS;
    ctx.strokeStyle = 'rgba(110,126,190,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(3.5, 1);
    ctx.lineTo(0, 5);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // the point of light at its heart
  const tw = live ? 0.75 + 0.25 * Math.sin(t * 5 + seed * 7) : 0.4;
  starPoint(ctx, 0, cy, rr * 0.55 * tw + 3, 0.95);
  ctx.fillStyle = '#ffffff';
  circle(ctx, 0, cy, 3);
  // two pale eyes, close together under the light
  ctx.fillStyle = 'rgba(40,46,90,0.75)';
  circle(ctx, rr * 0.16, cy + rr * 0.32, 1.8);
  circle(ctx, rr * 0.42, cy + rr * 0.3, 1.8);
  ctx.restore();
  return body;
}

// An astrolabe sentry: the star-hall's sighting machine on a brass tripod, a great brass disc scored with circles, the
// rete's curved arms over it and a pointer (the alidade) across its face. The pointer turns to you; on its warn the disc's
// rim lights star-white, and it throws a line of starlight along the floor (the `astro` beam: src/hazards.js)
function drawAstrolabeSentry(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const wk = m?.warn ? 0.6 + 0.4 * warnK(m.warn) : 0;
  const firing = !!m?.charging;
  const r = w * 0.42, cy = -h * 0.62;
  const body = () => {
    ctx.beginPath();
    ctx.arc(0, cy, r, 0, TAU);
    ctx.rect(-w * 0.3, cy, w * 0.6, -cy);
  };
  ctx.save();
  // the tripod
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [dx, fx] of [[-0.1, -0.42], [0.1, 0.42], [0, 0.06]]) {
    ctx.moveTo(w * dx, cy + r * 0.6);
    ctx.lineTo(w * fx, -2);
  }
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  for (const fx of [-0.42, 0.42, 0.06]) ellipse(ctx, w * fx, -1, 5, 2.5);
  // the disc
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, BRASS_L);
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, cy, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = wk ? `rgba(${STAR},${0.6 + 0.4 * wk})` : BRASS_E;
  ctx.lineWidth = wk ? 3.5 : 2.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,90,46,0.6)'; // its scored circles
  ctx.lineWidth = 1;
  for (const k of [0.78, 0.55, 0.3]) {
    ctx.beginPath();
    ctx.arc(0, cy, r * k, 0, TAU);
    ctx.stroke();
  }
  // the rete: two curved arms with little star-pointers
  const ra = live ? t * 0.25 + seed : seed;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  for (let i = 0; i < 2; i++) {
    const a = ra + i * Math.PI;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25, r * 0.52, a + 0.6, a + 2.4);
    ctx.stroke();
    starPoint(ctx, Math.cos(a + 1.5) * r * 0.62, cy + Math.sin(a + 1.5) * r * 0.62, 3.2, 0.9);
  }
  // the alidade: points at you (forward), sweeping down onto the floor as it fires
  const aim = firing ? 0.32 : wk ? 0.18 * wk : live ? Math.sin(t * 0.7 + seed) * 0.25 : 0.6;
  ctx.save();
  ctx.translate(0, cy);
  ctx.rotate(aim);
  ctx.fillStyle = '#5a3a2a';
  ctx.fillRect(-r * 1.05, -2, r * 2.1, 4);
  ctx.fillStyle = BRASS_L;
  ctx.fillRect(r * 0.86, -5, 4, 10); // the sight vanes
  ctx.fillRect(-r * 0.9, -5, 4, 10);
  if (wk || firing) {
    const gg = ctx.createRadialGradient(r * 1.05, 0, 1, r * 1.05, 0, 16);
    gg.addColorStop(0, `rgba(${STAR},${firing ? 1 : 0.8 * wk})`);
    gg.addColorStop(1, `rgba(${STAR},0)`);
    ctx.fillStyle = gg;
    circle(ctx, r * 1.05, 0, 16);
  }
  ctx.restore();
  ctx.fillStyle = BRASS_E; // the pin
  circle(ctx, 0, cy, 4);
  ctx.fillStyle = BRASS_L;
  circle(ctx, -1, cy - 1, 1.6);
  if (dying > 0.05) { // the disc cracks across
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - dying)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, cy - r * 0.3);
    ctx.lineTo(-r * 0.1, cy + r * 0.05);
    ctx.lineTo(r * 0.5, cy - r * 0.2);
    ctx.stroke();
  }
  ctx.restore();
  return body;
}

export const ORRERY_MOB_ART = { armillary_ring: drawArmillaryRing, starglass_wisp: drawStarglassWisp, astrolabe_sentry: drawAstrolabeSentry };

// ——— gear for players ———
// Meridian's Arm: one of the orrery's lesser arms, brass ground to a long curved edge, a little glass planet on its pommel
function drawMeridianArm(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = `rgba(${STAR},0.9)`;
    ctx.shadowBlur = 12;
  }
  const g = ctx.createLinearGradient(-6, 0, 8, 0);
  g.addColorStop(0, BRASS_D);
  g.addColorStop(0.5, BRASS_L);
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-3, -L * 0.2);
  ctx.quadraticCurveTo(-7, -L * 0.62, 0, -L);
  ctx.quadraticCurveTo(8, -L * 0.6, 4, -L * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,90,46,0.7)'; // the arm's graduations along the spine
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = -L * (0.3 + i * 0.1);
    ctx.beginPath();
    ctx.moveTo(-1.5, y);
    ctx.lineTo(1.5, y);
    ctx.stroke();
  }
  ctx.strokeStyle = BRASS; // a ring for the guard
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0.5, -L * 0.2, 9, 3.5, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#3a2e4a';
  ctx.fillRect(-2, -L * 0.18, 4, L * 0.17);
  const pg = ctx.createRadialGradient(-1.5, 0, 0.5, 0, 1, 5); // the little planet on the pommel
  pg.addColorStop(0, '#f4f8ff');
  pg.addColorStop(1, '#7a8ac8');
  ctx.fillStyle = pg;
  circle(ctx, 0, 1.5, 4.5);
  ctx.restore();
}
export const ORRERY_SWORDS = { meridian_arm: drawMeridianArm };
export const ORRERY_SWORD_LEN = { meridian_arm: 68 };

// The Armillary Crown: brass hoops crossed over the head like a sky drawn in rings, a star-glass bead at the top
function drawArmillaryCrown(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.48;
  ctx.fillStyle = BRASS_D; // the band
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-rx * 0.86, by - 3, rx * 1.72, 8, 4);
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 2.6; // the hoops over the crown
  for (const [sx, k] of [[0.62, 1], [0.3, 0.8], [0, 0.6]]) {
    ctx.strokeStyle = BRASS_E;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, by, rx * sx + 3, h * 0.4 * k, 0, Math.PI, TAU);
    ctx.stroke();
    ctx.strokeStyle = BRASS_L;
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
  ctx.strokeStyle = BRASS; // the ecliptic, slanting across
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, by - h * 0.18, rx * 0.8, h * 0.08, -0.22, 0, TAU);
  ctx.stroke();
  const g = ctx.createRadialGradient(-1.5, by - h * 0.42 - 1.5, 0.5, 0, by - h * 0.42, 6); // the bead at the top
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#8a9ad8');
  ctx.fillStyle = g;
  circle(ctx, 0, by - h * 0.42, 5);
  ctx.fillStyle = BRASS_E;
  for (let i = -2; i <= 2; i++) circle(ctx, i * rx * 0.32, by + 1, 1.5);
}
export const ORRERY_HELMETS = { armillary_crown: drawArmillaryCrown };

// ——— material icons (centred, about 28 px) ———
function iconArmillaryPin(ctx) {
  ctx.save();
  ctx.rotate(-0.6);
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(-3, -12, 6, 24, 3);
  ctx.fill();
  ctx.fillStyle = BRASS_L;
  ctx.fillRect(-3, -12, 2, 24);
  ctx.fillStyle = BRASS;
  ellipse(ctx, 0, -12, 6, 3);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -12, 6, 3, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
function iconStarglassMote(ctx) {
  const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 11);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, 'rgba(200,214,250,0.9)');
  g.addColorStop(1, 'rgba(110,126,190,0.9)');
  ctx.fillStyle = g;
  circle(ctx, 0, 0, 10);
  ctx.strokeStyle = '#5a6aa8';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, TAU);
  ctx.stroke();
  starPoint(ctx, 0, 0, 6, 1);
}
function iconAstrolabePlate(ctx) {
  ctx.fillStyle = BRASS;
  circle(ctx, 0, 0, 12);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 0.9;
  for (const r of [8.5, 5]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = '#5a3a2a';
  ctx.save();
  ctx.rotate(0.5);
  ctx.fillRect(-12, -1.2, 24, 2.4);
  ctx.restore();
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(-2, -15, 4, 4); // the hanging ring's shackle
}
function iconOrreryBead(ctx) {
  const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11);
  g.addColorStop(0, '#eef2ff');
  g.addColorStop(1, '#5a6aa8');
  ctx.fillStyle = g;
  circle(ctx, 0, 1, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; // its clouds
  ellipse(ctx, -2, 2, 6, 2, 0.3);
  ellipse(ctx, 3, -3, 4, 1.5, 0.3);
  ctx.strokeStyle = BRASS; // the brass ring it rode on
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 1, 14, 4, -0.35, 0, TAU);
  ctx.stroke();
}
export const ORRERY_ICONS = { armillary_pin: iconArmillaryPin, starglass_mote: iconStarglassMote, astrolabe_plate: iconAstrolabePlate, orrery_bead: iconOrreryBead };

// ——— the Last Echo (folk 'echo' and the 'keeper' accessory: src/slime.js) ———
// A Keeper's echo: pale see-through blue-white, and it flickers, as if the light it's made of comes and goes
export const ECHO_PALETTE = (hue) => ({
  top: `hsl(${hue} 50% 95% / 0.38)`,
  bottom: `hsl(${hue} 40% 78% / 0.46)`,
  line: `hsl(${hue} 40% 70% / 0.6)`,
  cheek: `hsl(${hue} 50% 88% / 0.4)`,
});
// inside the body (clipped): fine lines running down it like a picture that isn't quite there, and a faint clock face
// where its heart would be, its one hand stopped
export function drawEchoFolk(ctx, w, h, t) {
  const fl = 0.6 + 0.4 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.1)); // the flicker
  ctx.strokeStyle = `rgba(230,240,255,${0.22 * fl})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const off = (t * 18) % 6;
  for (let y = -h + off; y < 0; y += 6) {
    ctx.moveTo(-w * 0.6, y);
    ctx.lineTo(w * 0.6, y);
  }
  ctx.stroke();
  ctx.strokeStyle = `rgba(214,228,255,${0.4 * fl})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, -h * 0.36, w * 0.16, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.36);
  ctx.lineTo(w * 0.02, -h * 0.36 - w * 0.13); // stopped at the hour
  ctx.stroke();
}
// Its dress (accessory 'keeper'): a Keeper's cowl, grey-white, a ring sigil (a wheel with its teeth) at the throat, a small
// key on a chain in its hand; now and then an afterimage of it a step behind, where it was a moment ago
export function drawKeeperDress(ctx, w, h, fx, t) {
  ctx.save();
  const fl = 0.65 + 0.35 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.1));
  ctx.globalAlpha *= fl;
  // the afterimage, a step back, faint
  const lag = Math.max(0, Math.sin(t * 0.9)) ** 6;
  if (lag > 0.05) {
    ctx.strokeStyle = `rgba(214,228,255,${0.35 * lag})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-fx * 0.9, -h * 0.5, w * 0.5, h * 0.48, 0, 0, TAU);
    ctx.stroke();
  }
  // the cowl
  ctx.fillStyle = 'rgba(214,218,232,0.62)';
  ctx.strokeStyle = 'rgba(150,160,190,0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, -h * 0.55);
  ctx.bezierCurveTo(-w * 0.56, -h * 1.12, w * 0.56, -h * 1.12, w * 0.5, -h * 0.55);
  ctx.quadraticCurveTo(w * 0.32, -h * 0.82, 0, -h * 0.84);
  ctx.quadraticCurveTo(-w * 0.32, -h * 0.82, -w * 0.5, -h * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the sigil: a wheel with its teeth, at the throat
  const sx = fx * 0.35, sy = -h * 0.5;
  ctx.strokeStyle = 'rgba(253,227,160,0.85)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(sx, sy, 5, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.moveTo(sx + Math.cos(a) * 5, sy + Math.sin(a) * 5);
    ctx.lineTo(sx + Math.cos(a) * 7.5, sy + Math.sin(a) * 7.5);
  }
  ctx.stroke();
  // the key on its chain, held out a little, turning back and forth (the motion it repeats)
  const tw = Math.sin(t * 1.6) * 0.5;
  ctx.save();
  ctx.translate(fx * 1.2, -h * 0.28);
  ctx.rotate(tw);
  ctx.strokeStyle = 'rgba(200,190,160,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.fillStyle = 'rgba(253,227,160,0.9)';
  circle(ctx, 0, 2, 3);
  ctx.fillRect(-0.8, 2, 1.6, 9);
  ctx.fillRect(0, 8, 3, 1.4);
  ctx.fillRect(0, 10, 2.4, 1.4);
  ctx.restore();
  ctx.restore();
}
// (the night colour, for the room and den files)
export const ORRERY_NIGHT = NIGHT;
export { starPoint };
