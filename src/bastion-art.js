// Docs: docs/places/citadel.md, docs/places/gardens.md, docs/combat/stages.md
// The Citadel's depth pass, C0's art that isn't a room (the Gardens' room is src/gardens.js, room 13 src/citadel.js):
// Cogwork Bastion's field boss the Siege Engine, the Keepers' Gardens' automata (gardener drone, seed moth, hedge
// shears) (BASTION_MOB_ART, called by drawMob in src/field.js); their materials' icons (BASTION_ICONS); gear for players
// (BASTION_SWORDS, BASTION_SWORD_LEN, BASTION_HELMETS): the Commissary's Bastion Guard's Saber and Helm, the Siege Ram
// and Siege Helm (the staves and bows are rows in src/staff-art.js and src/bow-art.js); and the Commissary's own look
// (drawIssuerDress, the 'issuer' accessory, through src/slime.js). The Citadel's register: brass, verdigris, aether-glass,
// solemn, no whimsy; machines still doing their last jobs.
// Mob art: (ctx, w, h, t, seed, m, dying), feet at the origin, facing +x; returns its silhouette path.
import { TAU, circle, ellipse } from './util.js';

const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const IRON = '#4a4656', IRON_D = '#2a2834', IRON_L = '#6e6a7e';
const VERDI = '#8fd4c4', VERDI_D = '#5fae9e';
const AETHER = '150,240,234';
const LINE = '#4a3f6b';

function lens(ctx, x, y, r, t, seed, { dying = 0, lit = '150,240,234' } = {}) {
  // one round glass eye in a brass bezel; it dims and cracks as the machine winds down
  ctx.fillStyle = BRASS_D;
  circle(ctx, x, y, r + 2.5);
  ctx.fillStyle = '#1e2430';
  circle(ctx, x, y, r);
  const a = dying > 0.05 ? Math.max(0, 0.6 - dying) : 0.75 + 0.2 * Math.sin(t * 2 + seed * 5);
  ctx.fillStyle = `rgba(${lit},${a})`;
  circle(ctx, x, y, r * 0.66);
  ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - dying)})`;
  circle(ctx, x - r * 0.3, y - r * 0.3, r * 0.22);
  if (dying > 0.05) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y - r * 0.2);
    ctx.lineTo(x + r * 0.1, y + r * 0.1);
    ctx.lineTo(x + r * 0.5, y + r * 0.6);
    ctx.stroke();
  }
}
function gearPath(ctx, x, y, r, n, a) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const ang = a + (i / (n * 2)) * TAU, rr = i % 2 ? r : r * 0.8;
    ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
  }
  ctx.closePath();
}
function gear(ctx, x, y, r, n, a, face = BRASS, edge = BRASS_E) {
  gearPath(ctx, x, y, r, n, a);
  ctx.fillStyle = face;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = edge;
  circle(ctx, x, y, r * 0.28);
}

// ——— the Siege Engine (field boss, Cogwork Bastion) ———
// A wall engine on iron tracks: a long brass carriage on six iron wheels, a great bow-arm (a ballista) on a turntable on
// top, a rack of bolts along its side, brass shutters over its sides (down when it armours), a sighting hood with one lens
// at the front. It winds the arm back before it looses (m.warn), and the bolt sits in the groove. Steam leaks from it.
function drawSiegeEngine(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const W2 = w * 0.5, bodyTop = -h * 0.56, deckY = -h * 0.2;
  const roll = live ? (m.x ?? 0) * 0.04 : 0;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-W2, -4);
    ctx.lineTo(-W2 * 0.96, bodyTop + 10);
    ctx.quadraticCurveTo(-W2 * 0.9, bodyTop, -W2 * 0.78, bodyTop);
    ctx.lineTo(W2 * 0.7, bodyTop);
    ctx.quadraticCurveTo(W2 * 0.96, bodyTop + 4, W2, bodyTop + 22);
    ctx.lineTo(W2, -4);
    ctx.closePath();
  };
  ctx.save();
  ctx.fillStyle = 'rgba(40,30,50,0.3)';
  ellipse(ctx, 0, 2, W2 * 1.02, 8);
  // the track and its six wheels
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(-W2 * 0.98, -30, w * 0.98, 30, 14);
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    const x = -W2 * 0.82 + (i * W2 * 1.64) / 5;
    ctx.fillStyle = IRON;
    circle(ctx, x, -15, 13);
    ctx.strokeStyle = IRON_L;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = roll + (k / 3) * Math.PI;
      ctx.moveTo(x + Math.cos(a) * 11, -15 + Math.sin(a) * 11);
      ctx.lineTo(x - Math.cos(a) * 11, -15 - Math.sin(a) * 11);
    }
    ctx.stroke();
    ctx.fillStyle = BRASS_D;
    circle(ctx, x, -15, 3.5);
  }
  // the carriage
  const g = ctx.createLinearGradient(0, bodyTop, 0, -30);
  g.addColorStop(0, BRASS_L);
  g.addColorStop(0.45, BRASS);
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2.6;
  body();
  ctx.stroke();
  // verdigris along the seams, rivets
  ctx.strokeStyle = 'rgba(95,174,158,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-W2 * 0.9, deckY);
  ctx.lineTo(W2 * 0.95, deckY);
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  for (let i = 0; i < 12; i++) circle(ctx, -W2 * 0.86 + i * (W2 * 1.72) / 11, deckY + 6, 2);
  // the rack of bolts along its side, fletched brass
  for (let i = 0; i < 7; i++) {
    const x = -W2 * 0.7 + i * 22;
    ctx.fillStyle = IRON_D;
    ctx.fillRect(x - 2, bodyTop + 14, 4, 40);
    ctx.fillStyle = BRASS_L;
    ctx.beginPath();
    ctx.moveTo(x - 6, bodyTop + 14);
    ctx.lineTo(x, bodyTop + 6);
    ctx.lineTo(x + 6, bodyTop + 14);
    ctx.closePath();
    ctx.fill();
  }
  // the brass shutters over its flanks (they swing down when it armours: drawn half down always, a hint of them)
  ctx.fillStyle = 'rgba(200,144,74,0.55)';
  ctx.beginPath();
  ctx.roundRect(W2 * 0.2, bodyTop + 10, W2 * 0.6, 34, 4);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(W2 * 0.22, bodyTop + 16 + i * 8);
    ctx.lineTo(W2 * 0.78, bodyTop + 16 + i * 8);
    ctx.stroke();
  }
  // the turntable and the bow-arm on top: the arms bend back as it winds (warn), straighten as it looses
  const draw = warn ? 1 : live ? 0.25 + 0.1 * Math.sin(t * 1.3 + seed) : 0;
  const tx = W2 * 0.05, ty = bodyTop - 6;
  ctx.fillStyle = IRON;
  ctx.beginPath();
  ctx.ellipse(tx, ty + 4, 44, 10, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(tx - 10, ty - 30, 20, 32);
  // the stock and the groove, pointing forward and a little up
  ctx.save();
  ctx.translate(tx, ty - 24);
  ctx.rotate(-0.12);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-58, -5, 150, 10);
  ctx.fillStyle = BRASS;
  ctx.fillRect(-58, -7, 150, 3);
  // the arms
  ctx.strokeStyle = IRON_L;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  const back = 14 + 26 * draw;
  ctx.beginPath();
  ctx.moveTo(-back, -52);
  ctx.quadraticCurveTo(48, -36, 56, 0);
  ctx.quadraticCurveTo(48, 36, -back, 52);
  ctx.stroke();
  ctx.strokeStyle = BRASS_L;
  ctx.lineWidth = 2;
  ctx.stroke();
  // the cable, drawn back to the bolt's nock
  const nock = 10 - 56 * draw;
  ctx.strokeStyle = 'rgba(232,224,204,0.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-back, -52);
  ctx.lineTo(nock, 0);
  ctx.lineTo(-back, 52);
  ctx.stroke();
  // the bolt in the groove
  if (live) {
    ctx.fillStyle = IRON_D;
    ctx.fillRect(nock, -2.5, 96, 5);
    ctx.fillStyle = '#d8dce8';
    ctx.beginPath();
    ctx.moveTo(nock + 96, -7);
    ctx.lineTo(nock + 114, 0);
    ctx.lineTo(nock + 96, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = BRASS_L;
    ctx.beginPath();
    ctx.moveTo(nock, 0);
    ctx.lineTo(nock + 12, -7);
    ctx.lineTo(nock + 12, 7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // the winding wheel at the back, turning while it winds
  gear(ctx, -W2 * 0.62, bodyTop - 8, 22, 10, live ? t * (warn ? 4 : 0.4) : 0, BRASS, BRASS_E);
  // the sighting hood at the front, its lens
  const hx = W2 * 0.78, hy = bodyTop + 12;
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(hx - 22, hy - 22, 40, 34, 10);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.stroke();
  lens(ctx, hx, hy - 5, 9, t, seed, { dying, lit: warn ? '255,160,110' : AETHER });
  // steam leaking from a pipe at the back
  if (live) for (let i = 0; i < 4; i++) {
    const p = (t * 0.6 + i / 4 + seed) % 1;
    ctx.fillStyle = `rgba(250,246,240,${0.35 * (1 - p)})`;
    circle(ctx, -W2 * 0.9 - p * 18, bodyTop - 10 - p * 50, 6 + p * 12);
  }
  ctx.restore();
  return body;
}

// ——— the Keepers' Gardens' automata ———
// A gardener drone: a little round brass watering can with a rose nozzle on a crane neck and four whirring vanes on top,
// drifting over the beds and sprinkling soil where nothing grows
function drawGardenerDrone(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const bob = live ? Math.sin(t * 2.4 + seed * 4) * 3 : 0;
  const cy = -h * 0.5 + bob, rx = w * 0.36, ry = h * 0.3;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, rx, ry, 0, 0, TAU);
  };
  ctx.save();
  // the vanes
  const spin = live ? t * 22 : 0;
  ctx.fillStyle = 'rgba(232,224,204,0.55)';
  for (let i = 0; i < 2; i++) {
    const a = spin + i * Math.PI;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * rx * 0.55, cy - ry - 8, rx * 0.6 * Math.abs(Math.cos(a)) + 3, 3, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(-1.5, cy - ry - 8, 3, 8);
  // the can
  const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  g.addColorStop(0, BRASS_L);
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.8;
  body();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(95,174,158,0.6)'; // a band of verdigris
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, cy + ry * 0.3, rx * 0.95, ry * 0.25, 0, 0.1, Math.PI - 0.1);
  ctx.stroke();
  // the crane neck and its rose
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(rx * 0.6, cy - ry * 0.2);
  ctx.quadraticCurveTo(rx * 1.3, cy - ry * 0.4, rx * 1.35, cy + ry * 0.4);
  ctx.stroke();
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.ellipse(rx * 1.38, cy + ry * 0.55, 6, 4, 0.3, 0, TAU);
  ctx.fill();
  // the sprinkle: fine drops falling from the rose
  if (live) {
    ctx.fillStyle = 'rgba(190,230,240,0.7)';
    for (let i = 0; i < 6; i++) {
      const p = (t * 1.4 + i / 6 + seed) % 1;
      circle(ctx, rx * 1.38 + Math.sin(i * 2.3) * 5, cy + ry * 0.6 + p * 50, 1.3);
    }
  }
  lens(ctx, rx * 0.15, cy - ry * 0.1, 5.5, t, seed, { dying });
  ctx.restore();
  return body;
}
// A seed moth: a paper-white moth of brass wire and seed-fluff, wings ticking open and shut like a clock's
function drawSeedMoth(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05;
  const cy = -h * 0.5 + (live ? Math.sin(t * 3 + seed * 3) * 4 : 0);
  const flap = live ? (Math.floor(t * 8 + seed * 5) % 2 ? 0.35 : 1) : 0.2; // (it ticks, not flutters)
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, cy, w * 0.14, h * 0.24, 0, 0, TAU);
  };
  ctx.save();
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(0, cy);
    ctx.scale(1, s === 1 ? flap : flap * 0.9);
    ctx.fillStyle = 'rgba(250,248,240,0.9)';
    ctx.strokeStyle = BRASS_D;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-w * 0.2, -h * 0.9 * s, -w * 0.62, -h * 0.6 * s, -w * 0.48, -h * 0.05 * s);
    ctx.bezierCurveTo(-w * 0.2, h * 0.05 * s, 0, 0, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(w * 0.16, -h * 0.8 * s, w * 0.5, -h * 0.5 * s, w * 0.42, -h * 0.02 * s);
    ctx.bezierCurveTo(w * 0.2, h * 0.04 * s, 0, 0, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,144,74,0.55)'; // the wire veins
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-w * 0.4, -h * 0.4 * s);
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.34, -h * 0.36 * s);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = BRASS_D;
  body();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; // fluff on its back
  for (let i = 0; i < 4; i++) circle(ctx, -w * 0.06 + i * 3, cy - h * 0.12 + (i % 2) * 4, 3);
  ctx.strokeStyle = BRASS_E; // feelers
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, cy - h * 0.18);
  ctx.quadraticCurveTo(w * 0.2, cy - h * 0.5, w * 0.3, cy - h * 0.46);
  ctx.moveTo(w * 0.1, cy - h * 0.16);
  ctx.quadraticCurveTo(w * 0.26, cy - h * 0.36, w * 0.36, cy - h * 0.3);
  ctx.stroke();
  lens(ctx, w * 0.1, cy - h * 0.04, 3, t, seed, { dying, lit: '255,236,180' });
  ctx.restore();
  return body;
}
// Hedge shears: a pair of tall topiary shears walking on their two handles, blades up like a beak, a little brass
// gearbox at the pivot with one lens; armoured in front (the blades), so hit them from behind. They snap when they lunge
function drawHedgeShears(ctx, w, h, t, seed, m, dying) {
  const live = dying < 0.05, warn = !!m.warn && live;
  const step = live ? Math.sin(t * 6 + seed * 4) : 0;
  const px = 0, py = -h * 0.5;
  const open = warn ? 0.7 : live ? 0.18 + 0.1 * Math.max(0, Math.sin(t * 2.2 + seed)) : 0.05;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(px, py, w * 0.22, h * 0.2, 0, 0, TAU);
  };
  ctx.save();
  ctx.lineCap = 'round';
  // the two handles (its legs), wooden with brass ferrules
  for (const s of [-1, 1]) {
    ctx.strokeStyle = '#7a5a3a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + s * w * 0.28 + step * s * 4, -4 + (s === 1 ? Math.max(0, step) : Math.max(0, -step)) * -6);
    ctx.stroke();
    ctx.fillStyle = BRASS_D;
    circle(ctx, px + s * w * 0.28 + step * s * 4, -4 + (s === 1 ? Math.max(0, step) : Math.max(0, -step)) * -6, 4);
  }
  // the blades, pointing up and forward, opening as it winds up
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-0.9 + s * open * 0.5);
    ctx.fillStyle = '#d8dce8';
    ctx.strokeStyle = IRON;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(h * 0.62, -s * 4);
    ctx.lineTo(h * 0.66, 0);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // the pivot's gearbox
  const g = ctx.createLinearGradient(0, py - h * 0.2, 0, py + h * 0.2);
  g.addColorStop(0, BRASS_L);
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  body();
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.8;
  body();
  ctx.stroke();
  gear(ctx, px - w * 0.08, py + 2, 7, 8, live ? t * 2 : 0, BRASS_L, BRASS_E);
  lens(ctx, px + w * 0.08, py - 3, 5, t, seed, { dying, lit: warn ? '255,160,110' : AETHER });
  // clippings still caught on it: a few dry leaves
  ctx.fillStyle = 'rgba(160,140,96,0.8)';
  ellipse(ctx, px + w * 0.2, py - h * 0.3, 4, 2, 0.6);
  ellipse(ctx, px + w * 0.3, py - h * 0.42, 3, 1.6, -0.3);
  ctx.restore();
  return body;
}

export const BASTION_MOB_ART = { siege_engine: drawSiegeEngine, gardener_drone: drawGardenerDrone, seed_moth: drawSeedMoth, hedge_shears: drawHedgeShears };

// ——— gear for players ———
// The Bastion Guard's Saber: a plain brass-hilted saber, a curved steel blade, issue stamped near the guard
function drawGuardSaber(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(253,227,160,0.8)';
    ctx.shadowBlur = 10;
  }
  const g = ctx.createLinearGradient(-5, 0, 7, 0);
  g.addColorStop(0, '#c8ccd8');
  g.addColorStop(0.5, '#f4f6fa');
  g.addColorStop(1, '#9aa0b0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-3, -L * 0.22);
  ctx.quadraticCurveTo(-5, -L * 0.7, 2, -L);
  ctx.quadraticCurveTo(7, -L * 0.66, 4, -L * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(138,90,46,0.6)'; // the issue stamp
  ctx.fillRect(-1, -L * 0.3, 3, 3);
  ctx.fillStyle = BRASS; // the brass knuckle-guard
  ctx.fillRect(-7, -L * 0.24, 16, 4);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -L * 0.22);
  ctx.quadraticCurveTo(10, -L * 0.06, 2, 0);
  ctx.stroke();
  ctx.fillStyle = '#5a3a2a';
  ctx.fillRect(-2, -L * 0.2, 4, L * 0.2);
  ctx.fillStyle = BRASS_L;
  circle(ctx, 0, 1, 3);
  ctx.restore();
}
// The Siege Ram: a great black-iron bolt-head on a brass haft, brass fletching at the butt
function drawSiegeRam(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(150,240,234,0.8)';
    ctx.shadowBlur = 12;
  }
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(-2.5, -L * 0.72, 5, L * 0.72);
  ctx.fillStyle = BRASS_L;
  ctx.fillRect(-2.5, -L * 0.72, 1.5, L * 0.72);
  const g = ctx.createLinearGradient(-9, 0, 9, 0);
  g.addColorStop(0, IRON_D);
  g.addColorStop(0.5, IRON_L);
  g.addColorStop(1, IRON_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -L);
  ctx.lineTo(10, -L * 0.72);
  ctx.lineTo(4, -L * 0.68);
  ctx.lineTo(4, -L * 0.6);
  ctx.lineTo(-4, -L * 0.6);
  ctx.lineTo(-4, -L * 0.68);
  ctx.lineTo(-10, -L * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(232,236,246,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -L);
  ctx.lineTo(9, -L * 0.73);
  ctx.stroke();
  ctx.fillStyle = BRASS_L; // the fletching
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -L * 0.16);
    ctx.lineTo(s * 8, -L * 0.04);
    ctx.lineTo(s * 7, L * 0.02);
    ctx.lineTo(0, -L * 0.06);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(95,174,158,0.8)'; // a verdigris band
  ctx.fillRect(-3, -L * 0.42, 6, 3);
  ctx.restore();
}
export const BASTION_SWORDS = { guard_saber: drawGuardSaber, siege_ram: drawSiegeRam };
export const BASTION_SWORD_LEN = { guard_saber: 62, siege_ram: 66 };

// The Bastion Guard's Helm: a round brass helm with a little visor and a crest of verdigris
function drawGuardHelm(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.48;
  const g = ctx.createLinearGradient(0, by - h * 0.4, 0, by + 6);
  g.addColorStop(0, BRASS_L);
  g.addColorStop(1, BRASS_D);
  ctx.fillStyle = g;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.88, by + 6);
  ctx.bezierCurveTo(-rx * 0.92, by - h * 0.44, rx * 0.92, by - h * 0.44, rx * 0.88, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS_D; // the visor's brim
  ctx.beginPath();
  ctx.ellipse(rx * 0.3, by + 5, rx * 0.62, 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = VERDI; // the crest
  ctx.beginPath();
  ctx.moveTo(-rx * 0.2, by - h * 0.3);
  ctx.quadraticCurveTo(0, by - h * 0.52, rx * 0.3, by - h * 0.34);
  ctx.lineTo(0, by - h * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, -rx * 0.34, by - h * 0.18, rx * 0.16, h * 0.05, -0.5);
  ctx.fillStyle = BRASS_E;
  for (let i = -2; i <= 2; i++) circle(ctx, i * rx * 0.3, by + 1, 1.6);
}
// The Siege Helm: the engine's sighting hood made a helm: brass shutters closed down to a slit of glowing aether-glass
function drawSiegeHelm(ctx, w, h) {
  const by = -h * 0.6, rx = w * 0.5;
  ctx.fillStyle = BRASS_D;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-rx * 0.86, by - h * 0.4, rx * 1.72, h * 0.46, 12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,90,46,0.8)'; // the shutters' slats
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-rx * 0.8, by - h * 0.32 + i * 6);
    ctx.lineTo(rx * 0.8, by - h * 0.32 + i * 6);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(${AETHER},0.9)`; // the slit
  ctx.beginPath();
  ctx.roundRect(-rx * 0.2, by - h * 0.12, rx * 0.9, 5, 2);
  ctx.fill();
  ctx.fillStyle = BRASS_L;
  circle(ctx, -rx * 0.6, by - h * 0.1, 4);
  ctx.fillStyle = BRASS_E;
  circle(ctx, -rx * 0.6, by - h * 0.1, 1.8);
}
export const BASTION_HELMETS = { guard_helm: drawGuardHelm, siege_helm: drawSiegeHelm };

// ——— material icons (centred, about 28 px) ———
function iconSiegeBolt(ctx) {
  ctx.save();
  ctx.rotate(-0.7);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-13, -1.5, 22, 3);
  ctx.fillStyle = '#d8dce8';
  ctx.beginPath();
  ctx.moveTo(9, -5);
  ctx.lineTo(15, 0);
  ctx.lineTo(9, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = BRASS_L;
  ctx.beginPath();
  ctx.moveTo(-13, 0);
  ctx.lineTo(-8, -5);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-8, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function iconBrassNozzle(ctx) {
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(-12, -2, 14, 5);
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.ellipse(6, 0, 6, 9, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  for (let i = 0; i < 5; i++) circle(ctx, 7, -6 + i * 3, 0.9);
  ctx.fillStyle = 'rgba(190,230,240,0.8)';
  circle(ctx, 13, 4, 1.4);
}
function iconSeedFluff(ctx) {
  ctx.strokeStyle = 'rgba(200,144,74,0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    circle(ctx, Math.cos(a) * 11, Math.sin(a) * 11, 2.4);
  }
  ctx.fillStyle = BRASS_D;
  circle(ctx, 0, 0, 2);
}
function iconShearPin(ctx) {
  ctx.fillStyle = BRASS;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -8, 7, 4, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(-2.5, -6, 5, 18);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(-1.5, -5, 1.2, 15);
}
export const BASTION_ICONS = { siege_bolt: iconSiegeBolt, brass_nozzle: iconBrassNozzle, seed_fluff: iconSeedFluff, shear_pin: iconShearPin };

// ——— the Commissary's look (the 'issuer' accessory: src/slime.js) ———
// A tall brass vending automaton (a brass-hued slime): a coin slot in its front, a hatch below it, a stamp on a spring arm,
// a green lamp on its top that lights when it talks, and a paper tape curling out of its side down to the floor
export function drawIssuerDress(ctx, w, h, fx, t) {
  ctx.save();
  // the seams, gone green, and rivets
  ctx.strokeStyle = 'rgba(70,140,120,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.5, w * 0.46, h * 0.1, 0, 0.1, Math.PI - 0.1);
  ctx.stroke();
  ctx.fillStyle = BRASS_E;
  for (let i = -3; i <= 3; i++) circle(ctx, i * w * 0.12, -h * 0.42 + Math.abs(i) * 1.4, 1.8);
  // the coin slot and the issue hatch below it
  const sx = fx * 0.4;
  ctx.fillStyle = '#2a2430';
  ctx.beginPath();
  ctx.roundRect(sx - 7, -h * 0.34, 14, 3.5, 1.5);
  ctx.fill();
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(sx - 13, -h * 0.26, 26, 14, 3);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(30,24,40,0.55)';
  ctx.fillRect(sx - 10, -h * 0.25 + 6, 20, 4);
  // the lens over the near eye
  ctx.fillStyle = '#2e2a30';
  circle(ctx, fx + 7, -h * 0.58, 7);
  ctx.fillStyle = `rgba(160,240,190,${0.7 + 0.2 * Math.sin(t * 1.6)})`;
  circle(ctx, fx + 7, -h * 0.58, 4.6);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  circle(ctx, fx + 5.6, -h * 0.6, 1.4);
  // the lamp on its top, on a short stalk
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(-2, -h * 1.06, 4, h * 0.1);
  ctx.fillStyle = `rgba(150,240,170,${0.55 + 0.35 * Math.max(0, Math.sin(t * 3))})`;
  circle(ctx, 0, -h * 1.08, 5.5);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, -h * 1.08, 5.5, 0, TAU);
  ctx.stroke();
  // the stamp on its spring arm, bobbing
  const bob = Math.sin(t * 2.2) * 3;
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) ctx.lineTo(-fx * 0.9 - w * 0.05 * (i % 2 ? 1 : -1), -h * 0.62 + i * 5 + bob * (i / 5));
  ctx.stroke();
  ctx.fillStyle = '#5a3a2a';
  ctx.beginPath();
  ctx.roundRect(-fx * 0.9 - 7, -h * 0.4 + bob, 14, 7, 2);
  ctx.fill();
  // the tape, curling out of its side to the floor
  ctx.strokeStyle = 'rgba(244,238,220,0.95)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, -h * 0.3);
  ctx.bezierCurveTo(-w * 0.62, -h * 0.24, -w * 0.5, -h * 0.08, -w * 0.72, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,80,100,0.5)';
  ctx.lineWidth = 0.7;
  ctx.setLineDash([2, 2]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}
