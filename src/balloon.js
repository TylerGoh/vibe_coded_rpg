// Docs: docs/places/crossings.md, docs/places/skydocks.md
// The sky route (atlas Phase 6): the balloon Kite climbing Emberdeep's thermal column to the Skydocks camp under the
// Citadel, and back down. Called by src/crossing.js for rooms whose crossing.route is 'sky'. The deck is the same
// platforms as every ship's (DECK_PLATFORMS: the crates, the cabin roof, the yard, the crow's nest); here they are
// cargo crates, a wicker cabin, the rigging hoop and the burner's iron platform, under the belly of a huge patched
// envelope that fills the top of the screen.
// Everything that moves is drawing only, driven by YOUR voyage clock through cr.h (how high you are: 0 in the cradle
// in Magma Heart, 1 at the Skydocks pier): the crater falls away below, the column's smoke and sparks stream past,
// three cloud layers come down through the deck (a whiteout as each one passes), then the cold clear blue with the
// whole archipelago small on the Glass Sea far below, and the Citadel's underside comes down over the envelope.
import { W, H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DECK_W, DECK_GROUND, DECK_PLATFORMS, DECK_GANGWAY_X } from './shared/sim.js';

const GROUND = DECK_GROUND;
const HELM_X = 190, BURNER_X = 1255, BALLAST_X = 1420;
const LAYERS = [0.3, 0.46, 0.62]; // the cloud layers' heights (in h)
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const plat = (kind) => DECK_PLATFORMS.find((p) => p.kind === kind);

function text(ctx, str, x, y, size, color) {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
const puffs = (() => {
  const r = mulberry32(331);
  return LAYERS.map(() => Array.from({ length: 16 }, () => ({ x: r() * 1400, y: r() * 60 - 30, s: 40 + r() * 50 })));
})();
const wisps = (() => {
  const r = mulberry32(337);
  return Array.from({ length: 14 }, () => ({ x: r() * 1300, y: r(), s: 20 + r() * 40, p: r() * TAU }));
})();
const sparks = (() => {
  const r = mulberry32(347);
  return Array.from({ length: 30 }, () => ({ x: r() * W, p: r(), v: 0.15 + r() * 0.2, s: 1 + r() * 1.6 }));
})();
const stars = (() => {
  const r = mulberry32(349);
  return Array.from({ length: 36 }, () => ({ x: r() * W, y: r() * 160, s: 0.6 + r() * 1.1, p: r() * TAU }));
})();

// How high you are and how far the wind has carried you: h 0..1 (eased), drift in px
export const skyAt = (cr) => ({ h: cr.to === 'citadel' ? smooth(0, 1, cr.k) : 1 - smooth(0, 1, cr.k), drift: cr.d * 0.12 });

// ——— behind the deck (screen space) ———
export function drawSkyRoute(ctx, cr, camX, time) {
  const { h, drift } = skyAt(cr);
  // the sky: ash-orange over the crater, white in the clouds, a cold deep blue above them, stars at the very top
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix(mix('#c98a72', '#9cc4ea', smooth(0.15, 0.5, h)), '#2f4f92', smooth(0.55, 0.95, h)));
  g.addColorStop(0.62, mix(mix('#e8a47c', '#f2f2f4', smooth(0.15, 0.5, h)), '#bcd6f2', smooth(0.55, 0.95, h)));
  g.addColorStop(1, mix('#d0705a', '#e6eef8', smooth(0.2, 0.6, h)));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const night = smooth(0.7, 1, h);
  if (night > 0.02) {
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${night * (0.4 + 0.4 * Math.sin(time * 1.3 + s.p))})`;
      circle(ctx, s.x, s.y, s.s);
    }
  }
  const pan = -camX * 0.08; // the far things slide a little as you walk the deck
  // far below, high up: the Glass Sea with the archipelago on it, small
  const sea = smooth(0.5, 0.72, h);
  if (sea > 0.01) drawArchipelago(ctx, h, sea, pan, time);
  // low down: Emberdeep's crater falling away below, the column's glow
  const low = 1 - smooth(0.12, 0.4, h);
  if (low > 0.01) drawCrater(ctx, h, low, pan, time, cr);
  // the column's smoke and sparks streaming past (down past you as you climb, up past you coming down)
  const col = 1 - smooth(0.2, 0.5, h), dir = cr.to === 'citadel' ? 1 : -1;
  if (col > 0.01) {
    for (const s of sparks) {
      const y = ((s.p + time * s.v * dir) % 1 + 1) % 1;
      ctx.fillStyle = `rgba(255,${170 + Math.round(60 * s.p)},100,${col * 0.8 * Math.sin(y * Math.PI)})`;
      circle(ctx, s.x, H - y * H, s.s);
    }
    ctx.fillStyle = `rgba(120,96,100,${0.18 * col})`;
    for (let i = 0; i < 6; i++) ellipse(ctx, ((i * 210 + time * 30 * dir + drift) % 1300) - 170, 100 + i * 70, 160, 40);
  }
  // the cloud layers: each comes down past the deck as you climb (y below the deck once you're above it)
  LAYERS.forEach((a, i) => drawLayer(ctx, 330 + (h - a) * 1500, puffs[i], i, drift, pan, time));
  // the Citadel's underside, coming down over the envelope at the top
  const city = smooth(0.74, 1, h);
  if (city > 0.01) drawUnderside(ctx, city, pan, time);
  if (cr.docked) (cr.to === 'citadel' ? drawPier : drawLedge)(ctx, camX, time);
}

// The Glass Sea far below with the islands on it, seen from high up: Emberdeep right under you (its smoke column
// rising toward you), Greenhollow and Frostpeak's aurora off to the west and north, and to the east a faint violet
// blur with lights in it that nobody has a name for yet (Lantern Fen, atlas Phase 8: seen, not open)
function drawArchipelago(ctx, h, a, pan, time) {
  const hz = 300 - smooth(0.6, 1, h) * 20, s = 1.15 - 0.55 * smooth(0.55, 1, h);
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, hz, 0, H);
  g.addColorStop(0, '#d8e6f2');
  g.addColorStop(1, '#6f9cc4');
  ctx.fillStyle = g;
  ctx.fillRect(0, hz, W, H - hz);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  for (let y = hz + 14; y < H; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + Math.sin(y + time * 0.2) * 2);
    ctx.stroke();
  }
  const isle = (x, y, rx, ry, land, rim) => {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ellipse(ctx, x, y + 2, rx + 4, ry + 2);
    ctx.fillStyle = rim;
    ellipse(ctx, x, y, rx, ry);
    ctx.fillStyle = land;
    ellipse(ctx, x - rx * 0.1, y - ry * 0.15, rx * 0.8, ry * 0.7);
  };
  const y0 = hz + (H - hz) * 0.25;
  // Greenhollow, west
  isle(W * 0.2 + pan, y0 + 30 * s, 54 * s, 16 * s, '#8fcf86', '#e8dcb8');
  // Frostpeak, north-west and further: white, the aurora over it
  isle(W * 0.38 + pan, hz + 18, 34 * s, 9 * s, '#f4f8ff', '#cfe0ee');
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(${i ? '170,240,210' : '200,170,255'},${0.18 + 0.1 * Math.sin(time * 0.8 + i)})`;
    ellipse(ctx, W * 0.38 + pan + (i - 1) * 14, hz + 4 - i * 4, 30 * s, 5);
  }
  // Emberdeep, below you: dark, the crater's glow, its column rising up toward you
  const ex = W * 0.6 + pan, ey = y0 + 90 * s;
  isle(ex, ey, 70 * s, 24 * s, '#4a3a44', '#2e2630');
  ctx.fillStyle = `rgba(255,150,80,${0.5 + 0.2 * Math.sin(time * 2)})`;
  ellipse(ctx, ex + 6 * s, ey - 4 * s, 12 * s, 5 * s);
  ctx.fillStyle = 'rgba(150,130,136,0.35)';
  for (let i = 0; i < 5; i++) ellipse(ctx, ex + 6 * s + Math.sin(time * 0.5 + i) * 6, ey - 14 * s - i * 26 * s, (10 + i * 8) * s, 8 * s + i * 2);
  // the far east: a violet blur on the water with lights in it
  ctx.fillStyle = 'rgba(190,170,220,0.45)';
  ellipse(ctx, W * 0.92 + pan, hz + 26, 60 * s, 10 * s);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = `rgba(255,228,160,${0.4 + 0.35 * Math.sin(time * 1.4 + i * 1.7)})`;
    circle(ctx, W * 0.92 + pan - 30 * s + i * 18 * s, hz + 24 + (i % 2) * 3, 1.6);
  }
  ctx.restore();
}

// Magma Heart's crater around the column: dark walls dropping away below the gondola, the vent's glow under them
function drawCrater(ctx, h, a, pan, time, cr) {
  const top = 330 + h * 1100; // the rim's top, sinking out of sight as you rise
  ctx.save();
  ctx.globalAlpha = a;
  const glow = ctx.createRadialGradient(W / 2, H + 40, 20, W / 2, H + 40, 420);
  glow.addColorStop(0, `rgba(255,140,70,${0.55 + 0.15 * Math.sin(time * 1.6)})`);
  glow.addColorStop(1, 'rgba(255,140,70,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, top - 200, W, H - top + 300);
  ctx.fillStyle = '#3a2e36';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    const x0 = side < 0 ? -40 : W + 40;
    ctx.moveTo(x0, H + 10);
    ctx.lineTo(x0, top - 60);
    for (let i = 0; i <= 8; i++) {
      const x = side < 0 ? i * 34 + pan * 0.5 : W - i * 34 + pan * 0.5;
      ctx.lineTo(x, top - 60 + i * 20 + Math.sin(i * 2.7) * 12);
    }
    ctx.lineTo(side < 0 ? 300 : W - 300, H + 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#4a3a44'; // the far wall, lower down
  ctx.beginPath();
  ctx.moveTo(0, top + 120);
  for (let x = 0; x <= W; x += 60) ctx.lineTo(x, top + 100 + Math.sin(x * 0.02) * 14);
  ctx.lineTo(W, H + 10);
  ctx.lineTo(0, H + 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// One cloud layer as a band of big soft puffs; when it's level with the deck it whites everything out a little
function drawLayer(ctx, y, list, i, drift, pan, time) {
  if (y < -160 || y > H + 160) return;
  const shift = drift * (0.5 + i * 0.2) + time * (6 + i * 3) + pan * 2;
  ctx.fillStyle = i === 1 ? 'rgba(250,250,252,0.92)' : 'rgba(240,244,250,0.88)';
  ctx.fillRect(0, y, W, 70);
  for (const p of list) {
    const x = ((p.x - shift) % 1400 + 1400) % 1400 - 200;
    circle(ctx, x, y + p.y, p.s);
    circle(ctx, x + p.s * 0.8, y + p.y + 10, p.s * 0.7);
  }
  const near = 1 - clamp(Math.abs(y - 300) / 220, 0, 1); // inside it: the whiteout
  if (near > 0) {
    ctx.fillStyle = `rgba(246,248,252,${0.75 * near})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// The Citadel's underside, huge and dark overhead: brass plating, a gear the size of a house turning very slowly, and
// broken piers hanging down off it, empty mooring rings swinging in the wind
function drawUnderside(ctx, a, pan, time) {
  const base = -220 + a * 240; // its lowest edge comes down to about y 20
  ctx.save();
  ctx.fillStyle = '#5a5262';
  ctx.beginPath();
  ctx.moveTo(-40, -10);
  for (let x = -40; x <= W + 40; x += 80) ctx.lineTo(x + pan * 0.6, base - 30 + Math.sin(x * 0.013) * 26 + (x % 160 ? 0 : 18));
  ctx.lineTo(W + 40, -10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(200,160,90,0.5)';
  for (let x = 30; x < W; x += 120) ctx.fillRect(x + pan * 0.6, base - 50 + Math.sin(x * 0.013) * 20, 70, 5);
  // the gear
  const gx = W * 0.7 + pan * 0.6, gy = base - 40, r = 70;
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(time * 0.03);
  ctx.fillStyle = '#7a6a54';
  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const ang = (i / 32) * TAU, rr = i % 2 ? r : r + 10;
    i ? ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr) : ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a5262';
  circle(ctx, 0, 0, r * 0.45);
  ctx.restore();
  // broken piers hanging down on chains
  ctx.strokeStyle = '#4a4452';
  ctx.lineWidth = 2;
  for (const [x, len] of [[W * 0.18, 70], [W * 0.42, 110], [W * 0.88, 60]]) {
    const px = x + pan * 0.6, sw = Math.sin(time * 0.7 + x) * 4;
    ctx.beginPath();
    ctx.moveTo(px - 20, base - 30);
    ctx.lineTo(px - 20 + sw, base + len);
    ctx.moveTo(px + 20, base - 30);
    ctx.lineTo(px + 20 + sw, base + len);
    ctx.stroke();
    ctx.fillStyle = '#8a7058';
    ctx.fillRect(px - 30 + sw, base + len, 60, 7);
    ctx.strokeStyle = '#b8924a';
    ctx.beginPath();
    ctx.arc(px + sw, base + len + 16, 6, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#4a4452';
  }
  ctx.restore();
}

// In at the Skydocks: the camp's pier alongside, a few planks up, the tents and the brazier's glow on it
function drawPier(ctx, camX, time) {
  const y = 392;
  ctx.fillStyle = '#7a6250';
  ctx.fillRect(0, y, W, 16);
  ctx.fillStyle = '#a08468';
  for (let x = -((camX * 0.9) % 40); x < W; x += 40) ctx.fillRect(x, y, 36, 5);
  ctx.strokeStyle = '#5a4a40';
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let x = -((camX * 0.9) % 180); x < W; x += 180) {
    ctx.moveTo(x, y + 14);
    ctx.lineTo(x - 10, H);
  }
  ctx.stroke();
  for (const [x, c] of [[200, '#c8b8a0'], [520, '#a8b8c0'], [760, '#c0a8a0']]) { // tents
    const tx = x - camX * 0.9 + 600;
    if (tx < -80 || tx > W + 80) continue;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(tx - 46, y);
    ctx.lineTo(tx, y - 52 + Math.sin(time * 3 + x) * 2);
    ctx.lineTo(tx + 46, y);
    ctx.closePath();
    ctx.fill();
  }
  const bx = 1420 - camX * 0.9 + 0;
  ctx.fillStyle = `rgba(255,190,110,${0.3 + 0.15 * Math.sin(time * 5)})`;
  circle(ctx, ((bx % 1600) + 1600) % 1600 - 300, y - 14, 18);
}

// Back down in Magma Heart: the ledge with the cradle alongside
function drawLedge(ctx, camX, time) {
  const y = 400;
  ctx.fillStyle = '#4a3a44';
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x <= W; x += 80) ctx.lineTo(x, y - 6 + Math.sin(x * 0.05 + camX * 0.01) * 5);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255,150,80,${0.25 + 0.1 * Math.sin(time * 1.6)})`;
  ctx.fillRect(0, H - 30, W, 30);
}

// ——— the gondola and the envelope (world space) ———
export function drawGondola(ctx, cr, L, R, time) {
  const moving = !cr.docked;
  const speed = moving ? Math.sin(Math.PI * Math.min(1, cr.k * 1.05)) : 0;
  drawEnvelope(ctx, L, R, time, speed);
  drawBasket(ctx, L, R);
  if (visible(BURNER_X - 120, BURNER_X + 120, L, R)) drawBurner(ctx, time, speed);
  if (visible(860, 1120, L, R)) drawCabin(ctx);
  drawNetting(ctx, L, R);
  if (visible(HELM_X - 60, HELM_X + 60, L, R)) drawTrim(ctx, time);
  const c = plat('crates');
  if (visible(c.x - 20, c.x + c.w + 60, L, R)) drawCrates(ctx, c);
  if (visible(BALLAST_X - 40, BALLAST_X + 40, L, R)) drawBallast(ctx, time);
  if (visible(DECK_GANGWAY_X - 120, DECK_GANGWAY_X + 120, L, R)) drawGate(ctx, cr, time);
}

// The envelope's belly overhead: red and cream gores, patches, a skirt hanging down over the burner, and the load
// ropes down to the gondola's rail
function drawEnvelope(ctx, L, R, time, speed) {
  const belly = (x) => 64 + Math.sin((x / DECK_W) * Math.PI) * 36 + Math.sin(time * 0.9 + x * 0.004) * 2;
  ctx.strokeStyle = 'rgba(200,190,175,0.9)'; // the load ropes
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = 40; x <= DECK_W - 20; x += 120) {
    if (!visible(x - 40, x + 40, L, R)) continue;
    ctx.moveTo(x + 10, belly(x) - 6);
    ctx.lineTo(x, GROUND - 34);
  }
  ctx.stroke();
  const x0 = Math.max(-60, L), x1 = Math.min(DECK_W + 60, R);
  for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) { // the gores, alternating
    ctx.fillStyle = (x / 90) % 2 ? '#c95f58' : '#f0e2c8';
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.lineTo(x + 90, -10);
    ctx.lineTo(x + 90, belly(x + 90));
    ctx.quadraticCurveTo(x + 45, belly(x + 45) + 8, x, belly(x));
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#7a3a38';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = Math.floor(x0 / 30) * 30; x <= x1; x += 30) (x === Math.floor(x0 / 30) * 30 ? ctx.moveTo(x, belly(x)) : ctx.lineTo(x, belly(x)));
  ctx.stroke();
  ctx.fillStyle = '#d8c8a8'; // patches
  for (const [px, py] of [[230, 40], [610, 60], [980, 30], [1340, 52]]) if (visible(px - 20, px + 20, L, R)) ctx.fillRect(px, py, 18, 14);
  ctx.fillStyle = '#8f6240'; // the name on her belly
  if (visible(600, 900, L, R)) text(ctx, 'KITE', 760, belly(760) - 22, 22, '#7a3a38');
  // the skirt down over the burner
  if (visible(BURNER_X - 80, BURNER_X + 80, L, R)) {
    ctx.fillStyle = '#b84e48';
    ctx.beginPath();
    ctx.moveTo(BURNER_X - 60, belly(BURNER_X - 60) - 4);
    ctx.lineTo(BURNER_X + 60, belly(BURNER_X + 60) - 4);
    ctx.lineTo(BURNER_X + 30, plat('nest').y - 34);
    ctx.lineTo(BURNER_X - 30, plat('nest').y - 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(40,20,20,0.5)';
    ellipse(ctx, BURNER_X, plat('nest').y - 34, 30, 6);
  }
}

// The gondola under the deck line: long, wicker, brass at the rim, rounded at both ends, hanging in the air
function drawBasket(ctx, L, R) {
  const top = GROUND + 2, bot = GROUND + 64;
  ctx.fillStyle = '#b0804e';
  ctx.beginPath();
  ctx.moveTo(-14, top);
  ctx.lineTo(DECK_W + 14, top);
  ctx.quadraticCurveTo(DECK_W + 10, bot, DECK_W - 60, bot + 8);
  ctx.lineTo(60, bot + 8);
  ctx.quadraticCurveTo(-10, bot, -14, top);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a5f38'; // the weave
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let y = top + 8; y < bot + 4; y += 8) {
    ctx.moveTo(Math.max(0, L), y);
    ctx.lineTo(Math.min(DECK_W, R), y);
  }
  for (let x = Math.ceil(Math.max(0, L) / 22) * 22; x < Math.min(DECK_W, R); x += 22) {
    ctx.moveTo(x, top + 4);
    ctx.lineTo(x + 4, bot);
  }
  ctx.stroke();
  ctx.fillStyle = '#c9a24a'; // the brass rim
  ctx.fillRect(Math.max(-14, L), top - 2, Math.min(DECK_W + 14, R) - Math.max(-14, L), 7);
  ctx.fillStyle = '#d9b38a'; // the planks you stand on
  ctx.fillRect(Math.max(-10, L), GROUND - 2, Math.min(DECK_W + 10, R) - Math.max(-10, L), 4);
}

// The rail: wooden posts with rope netting between them, a gap at the gate
function drawNetting(ctx, L, R) {
  const y = GROUND - 34;
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [a, b] of [[8, DECK_GANGWAY_X - 50], [DECK_GANGWAY_X + 50, DECK_W - 8]]) {
    if (!visible(a, b, L, R)) continue;
    ctx.moveTo(Math.max(a, L), y);
    ctx.lineTo(Math.min(b, R), y);
    for (let x = Math.ceil(Math.max(a, L) / 60) * 60; x <= Math.min(b, R); x += 60) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, GROUND - 2);
    }
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(220,206,186,0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const [a, b] of [[8, DECK_GANGWAY_X - 50], [DECK_GANGWAY_X + 50, DECK_W - 8]]) {
    if (!visible(a, b, L, R)) continue;
    for (let x = Math.ceil(Math.max(a, L) / 15) * 15; x < Math.min(b, R) - 15; x += 15) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 15, GROUND - 2);
      ctx.moveTo(x + 15, y);
      ctx.lineTo(x, GROUND - 2);
    }
  }
  ctx.stroke();
}

// The burner on its iron platform (the crow's nest) up the rigging hoop (the yard): Slag's, squat and riveted, a
// flame roaring up into the skirt in bursts, harder while she climbs
function drawBurner(ctx, time, speed) {
  const yard = plat('yard'), nest = plat('nest');
  ctx.strokeStyle = '#8f6240'; // the hoop's ropes and a rope ladder up to it
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const x of [yard.x + 10, yard.x + yard.w - 10]) {
    ctx.moveTo(x, yard.y);
    ctx.lineTo(BURNER_X + (x < BURNER_X ? -30 : 30), nest.y - 30);
    ctx.moveTo(x, yard.y + 8);
    ctx.lineTo(x + (x < BURNER_X ? -40 : 40), GROUND - 34);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let y = yard.y + 22; y < GROUND - 10; y += 18) {
    ctx.moveTo(yard.x + 30, y);
    ctx.lineTo(yard.x + 52, y);
  }
  ctx.moveTo(yard.x + 30, yard.y + 10);
  ctx.lineTo(yard.x + 30, GROUND - 2);
  ctx.moveTo(yard.x + 52, yard.y + 10);
  ctx.lineTo(yard.x + 52, GROUND - 2);
  ctx.stroke();
  ctx.fillStyle = '#a77b52'; // the hoop
  ctx.beginPath();
  ctx.roundRect(yard.x, yard.y, yard.w, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#4e4a56'; // the iron platform
  ctx.beginPath();
  ctx.roundRect(nest.x, nest.y, nest.w, 12, 3);
  ctx.fill();
  ctx.strokeStyle = '#4e4a56';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(nest.x + 6, nest.y + 12);
  ctx.lineTo(BURNER_X - 40, yard.y);
  ctx.moveTo(nest.x + nest.w - 6, nest.y + 12);
  ctx.lineTo(BURNER_X + 40, yard.y);
  ctx.stroke();
  // the burner
  const bx = BURNER_X, by = nest.y;
  ctx.fillStyle = '#5e5a66';
  ctx.beginPath();
  ctx.roundRect(bx - 18, by - 26, 36, 26, 5);
  ctx.fill();
  ctx.fillStyle = '#7a7480';
  for (const [x, y] of [[-10, -18], [0, -12], [9, -20], [-4, -6]]) circle(ctx, bx + x, by + y, 1.6); // Slag's hammer marks
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(bx - 20, by - 30, 40, 5);
  const roar = 0.25 + 0.75 * Math.max(0, Math.sin(time * (1.4 + speed))) ** 2 * (0.4 + 0.6 * speed);
  ctx.fillStyle = `rgba(255,170,70,${0.5 + 0.4 * roar})`;
  ctx.beginPath();
  ctx.moveTo(bx - 10, by - 30);
  ctx.quadraticCurveTo(bx - 4, by - 50 - roar * 40, bx, by - 64 - roar * 40);
  ctx.quadraticCurveTo(bx + 4, by - 50 - roar * 40, bx + 10, by - 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255,236,170,${0.6 * roar})`;
  ellipse(ctx, bx, by - 40 - roar * 12, 4, 10 + roar * 10);
}

// A low wicker cabin amidships, its canvas roof a platform: where the passengers sleep on the long climbs
function drawCabin(ctx) {
  const p = plat('cabin'), x0 = p.x + 10, x1 = p.x + p.w - 10, top = p.y + 10;
  ctx.fillStyle = '#c4985e';
  ctx.beginPath();
  ctx.roundRect(x0, top, x1 - x0, GROUND - top, [6, 6, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = '#9a7040';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = top + 10; y < GROUND; y += 9) {
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#3a2c34'; // the hatch and a little round window
  ctx.beginPath();
  ctx.roundRect(x1 - 52, GROUND - 70, 34, 70, [9, 9, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#9ccfe0';
  circle(ctx, x0 + 50, top + 40, 14);
  ctx.fillStyle = '#e8dcc0'; // the canvas roof
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#c8b8a0';
  ctx.fillRect(p.x + 4, p.y + 10, p.w - 8, 3);
}

// Where the pilot stands at the stern: the vent line down from the envelope, an altimeter on a post
function drawTrim(ctx, time) {
  const x = HELM_X, y = GROUND - 70;
  ctx.strokeStyle = '#c84a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 30, 80);
  ctx.lineTo(x + 30, GROUND - 44);
  ctx.stroke();
  ctx.fillStyle = '#e8c45a';
  circle(ctx, x + 30, GROUND - 40, 5);
  ctx.fillStyle = '#8f6240';
  ctx.fillRect(x - 5, y, 10, GROUND - y);
  ctx.fillStyle = '#c9a24a';
  circle(ctx, x, y, 16);
  ctx.fillStyle = '#fff8e8';
  circle(ctx, x, y, 12);
  ctx.strokeStyle = '#3a2c34';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const a = -Math.PI / 2 + Math.sin(time * 0.3) * 0.2;
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9);
  ctx.stroke();
}

function drawCrates(ctx, p) {
  const n = Math.max(1, Math.round(p.w / 48)), cw = p.w / n, ch = GROUND - p.y;
  for (let i = 0; i < n; i++) {
    const x = p.x + i * cw;
    ctx.fillStyle = i % 2 ? '#d9b38a' : '#e4c49c';
    ctx.beginPath();
    ctx.roundRect(x + 1, p.y + 1, cw - 2, ch - 2, 4);
    ctx.fill();
    ctx.strokeStyle = '#b8895e';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 6, p.y + 6, cw - 12, ch - 12);
  }
  ctx.strokeStyle = '#8f6240'; // lashed down
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x - 4, GROUND - 2);
  ctx.lineTo(p.x + p.w / 2, p.y);
  ctx.lineTo(p.x + p.w + 4, GROUND - 2);
  ctx.stroke();
}

// Sandbags on hooks along the rail near the bow, swinging
function drawBallast(ctx, time) {
  for (let i = 0; i < 4; i++) {
    const x = BALLAST_X - 36 + i * 24, sw = Math.sin(time * 1.4 + i) * 3;
    ctx.strokeStyle = '#8f6240';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, GROUND - 34);
    ctx.lineTo(x + sw, GROUND + 14);
    ctx.stroke();
    ctx.fillStyle = '#c8b090';
    ellipse(ctx, x + sw, GROUND + 22, 9, 11);
  }
}

// The gate in the netting: a rope across while she's up; once she's in, a plank out to the pier (or the ledge)
// and a sign
function drawGate(ctx, cr, time) {
  const x = DECK_GANGWAY_X, y = GROUND - 34;
  ctx.fillStyle = '#8f6240';
  for (const px of [x - 50, x + 50]) {
    ctx.beginPath();
    ctx.roundRect(px - 5, y - 10, 10, GROUND - y + 8, 3);
    ctx.fill();
  }
  if (!cr.docked) {
    ctx.strokeStyle = '#c84a4a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 50, y - 4);
    ctx.quadraticCurveTo(x, y + 12 + Math.sin(time * 1.6) * 2, x + 50, y - 4);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.moveTo(x - 34, GROUND - 2);
  ctx.lineTo(x + 34, GROUND - 2);
  ctx.lineTo(x + 26, GROUND - 46);
  ctx.lineTo(x - 26, GROUND - 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8f6240';
  ctx.fillRect(x - 3, GROUND - 112, 6, 66);
  ctx.save();
  ctx.translate(x, GROUND - 112);
  ctx.rotate(Math.sin(time * 1.2) * 0.04);
  ctx.fillStyle = '#fff6ea';
  ctx.strokeStyle = '#c95f58';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-70, -34, 140, 46, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Step off', 0, -20, 12, '#8f6240');
  text(ctx, cr.to === 'citadel' ? 'The Skydocks' : 'Magma Heart', 0, -2, 16, '#7a3a38');
  ctx.restore();
}

// ——— in front of the slimes: cloud wisps streaming past under the gondola ———
export function drawSkyFront(ctx, cr, camX, viewW, time) {
  const { h, drift } = skyAt(cr);
  const dir = cr.to === 'citadel' ? 1 : -1, speed = cr.docked ? 0 : Math.sin(Math.PI * Math.min(1, cr.k * 1.05));
  const cloudy = Math.max(0.15, 1 - Math.min(...LAYERS.map((a) => Math.abs(h - a))) * 6);
  for (const w of wisps) {
    const y = GROUND + 60 + ((((w.y - time * 0.08 * dir * (0.2 + speed)) % 1) + 1) % 1) * 140;
    const x = camX + ((((w.x - drift * 0.3 - time * 10) % 1300) + 1300) % 1300) - 170;
    if (x < camX - 80 || x > camX + viewW + 80) continue;
    ctx.fillStyle = `rgba(250,250,252,${0.55 * cloudy})`;
    ellipse(ctx, x, y, w.s * 2, w.s * 0.6);
  }
}
