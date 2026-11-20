// Docs: docs/places/stormroad.md
// The Storm Road (room STORMROAD, src/shared/rpg.js; atlas Phase 9, A4): the old caravan road on east from the Buried
// Observatory, into the red. The sky reddens going east and the dust thickens; the road's marker stones march on, some
// standing, some toppled across it; wagons of some old caravan lie half buried in the drifts; wind-carved pillars of red
// rock stand up out of the sand, and on the tallest (STORM_LAMP_X) a lantern on a pole is lit and facing the storm (the
// hidden spot, last in STORM_PLATFORMS). On every rise the wind gets up and blows (SQUALLS, squallAt: the room hazard, on the
// server tick). West to east: the Road's End (a waystone; no mobs), the Marker Road, the Red Rise (the old well, its mouth
// chained shut: the Dry Wells' gate, DRYWELL_GATE_X, drawn by src/branch-gates.js) and the Wall's Foot, and beyond it the Red
// Wall itself, a storm standing from the sand to the sky (its den, RED_DEN_X, the way in drawn by src/dens-storm.js). Far
// off south a hill walks along the horizon with a town on its back, out of reach: Old Carapace (never named here).
// freed: you've freed the Red Wall (docs/social/story.md): for you the far end lies clear, the sky blue over it, and the
// caravan it held lies out on the sand in the sun.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { STORM_W, FIELD_GROUND, STORM_PLATFORMS, STORM_ZONES, STORM_EXIT_X, STORM_LAMP_X, RED_DEN_X, SQUALLS, squallAt } from './shared/rpg.js';
import { drawDuneSky, drawDuneAir } from './caravan.js';
import { isWalkerStill } from './distant.js';
import { drawDuneSign } from './glassdunes.js';
import { STONE, STONE_D, STONE_L } from './stormroad-art.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300;
const END_X = STORM_ZONES[0].x1;
const PILLAR = STORM_PLATFORMS.find((p) => p.kind === 'pillar');
const WALL_X = RED_DEN_X - 260; // where the storm's front stands (it goes on east past the den's mouth)
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const redAt = (x) => Math.max(0, Math.min(1, (x - 600) / (STORM_W - 1200))); // how far into the red, west to east

// the road's marker stones standing along it (the toppled ones are the `marker` platforms)
const MARKERS = (() => {
  const r = mulberry32(1071);
  const out = [];
  for (let x = 640; x < WALL_X - 80; x += 260 + r() * 80) if (!STORM_PLATFORMS.some((p) => Math.abs(p.x + p.w / 2 - x) < 140)) out.push({ x, h: 40 + r() * 16, lean: (r() - 0.5) * 0.16 });
  return out;
})();
// wind-carved pillars of red rock behind the road (the tallest carries the lantern)
const PILLARS = (() => {
  const r = mulberry32(1073);
  const out = [];
  for (let x = 900; x < WALL_X - 200; x += 520 + r() * 300) if (Math.abs(x - STORM_LAMP_X) > 300) out.push({ x, h: 120 + r() * 90, w: 40 + r() * 26 });
  return out;
})();
// ripples in the drifts
const RIPPLES = (() => {
  const r = mulberry32(1079);
  return Array.from({ length: 110 }, () => ({ x: r() * STORM_W, y: GROUND + 10 + r() * (H - GROUND - 18), w: 30 + r() * 50 }));
})();
// the caravan the storm held, lying out on the sand once it's freed: x, kind
const FALLEN = [[4140, 'tent'], [4330, 'pack'], [4460, 'saddle'], [4620, 'tent'], [4790, 'lamp'], [4880, 'pack']];

// Everything on the Storm Road behind the slimes
export function drawStormRoad(ctx, camX, viewW, time, tick, freed = false) {
  const red = freed ? redAt(camX + viewW / 2) * 0.25 : redAt(camX + viewW / 2);
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneSky(ctx, camX, time, STORM_W, { walker: false });
  drawWalker(ctx, camX, time, red);
  drawRedSky(ctx, red, time);
  ctx.restore();
  const L = camX - 200, R = camX + viewW + 200;
  for (const p of PILLARS) if (visible(p.x - 60, p.x + 60, L, R)) drawPillar(ctx, p, time);
  if (visible(STORM_LAMP_X - 80, STORM_LAMP_X + 80, L, R)) drawLampPillar(ctx, time, freed);
  if (!freed && visible(WALL_X - 200, STORM_W, L, R)) drawStormWall(ctx, Math.max(WALL_X - 200, L), Math.min(STORM_W, R), time);
  drawGround(ctx, Math.max(0, L), Math.min(STORM_W, R), time);
  drawRoad(ctx, Math.max(0, L), Math.min(STORM_W, R));
  for (const m of MARKERS) if (visible(m.x - 20, m.x + 20, L, R)) drawMarker(ctx, m);
  SQUALLS.forEach((g, i) => {
    if (visible(g.x - g.w / 2 - 80, g.x + g.w / 2 + 80, L, R)) drawSquall(ctx, g, tick == null ? { k: 0, blow: false } : squallAt(i, Math.floor(tick)), time, i);
  });
  for (const p of STORM_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'marker') drawToppledMarker(ctx, p);
    else if (p.kind === 'rock') drawRockShelf(ctx, p);
    else if (p.kind === 'wagon') drawWagon(ctx, p);
  }
  if (freed) for (const [x, k] of FALLEN) if (visible(x - 60, x + 60, L, R)) drawFallen(ctx, x, k);
  if (visible(0, END_X + 60, L, R)) drawRoadsEnd(ctx);
  if (visible(STORM_EXIT_X, STORM_EXIT_X + 220, L, R)) drawDuneSign(ctx, STORM_EXIT_X + 110, 'Observatory', -1, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneAir(ctx, camX, time, { thick: red * 0.9 });
  drawBlowing(ctx, camX, time, red);
  ctx.restore();
}

// ——— the sky ———
// Old Carapace far off south, walking along the horizon: a hill with a town on its back on four slow legs, his head
// out ahead, dust under him. Out of reach (drawing only). Where he is goes with the hour, like drawDuneSky's walker, but
// here he's near enough to see walk.
function drawWalker(ctx, camX, time, red) {
  const still = isWalkerStill(), hour = still ? 15 : (Date.now() / 3.6e6) % 24; // (freed, A5 (c): lying still)
  const x = ((hour / 24) * 2600 - camX * 0.04 + 900) % 2600 - 500, y = HORIZON + 6, s = 2.2;
  if (x < -260 || x > W + 260) return;
  const a = 0.62 - red * 0.3, step = still ? 0 : time * 0.35;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = a;
  ctx.fillStyle = '#a07a5e';
  if (still) ctx.translate(0, 16); // (lying on the sand, his legs drawn in)
  else for (let i = 0; i < 4; i++) { // four legs, slow, a pair at a time
    const lx = -40 + i * 26, k = Math.sin(step + (i % 2) * Math.PI);
    ctx.beginPath();
    ctx.roundRect(lx - 5 + k * 3, -22 - Math.max(0, k) * 3, 10, 22 + Math.max(0, k) * 3, 4);
    ctx.fill();
  }
  ctx.fillStyle = '#b88e6c'; // the shell: a long low dome
  ctx.beginPath();
  ctx.moveTo(-60, -18);
  ctx.quadraticCurveTo(-56, -58, -4, -62);
  ctx.quadraticCurveTo(50, -58, 58, -18);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,88,66,0.6)'; // its plates
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const [px, py] of [[-34, -34], [-6, -44], [22, -34], [-20, -24], [8, -24], [36, -24]]) ctx.ellipse(px, py, 12, 7, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#9a7458'; // the town on his back: tents and a roof or two, a tiny dry well
  for (const [tx, h] of [[-30, 8], [-16, 11], [-2, 9], [12, 12], [26, 8]]) {
    ctx.beginPath();
    ctx.moveTo(tx - 6, -58 + Math.abs(tx) * 0.06);
    ctx.lineTo(tx, -58 - h + Math.abs(tx) * 0.06);
    ctx.lineTo(tx + 6, -58 + Math.abs(tx) * 0.06);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#a07a5e'; // his head out ahead, low, looking east
  ctx.beginPath();
  ctx.ellipse(70, -22 + Math.sin(step * 2) * 1.5, 14, 9, 0.1, 0, TAU);
  ctx.fill();
  ctx.fillRect(56, -26, 10, 8);
  ctx.fillStyle = 'rgba(232,206,170,0.55)'; // dust under him (none, lying still)
  if (!still) for (let i = 0; i < 5; i++) ellipse(ctx, -50 + i * 26 + Math.sin(time + i) * 3, -2, 16, 4);
  ctx.restore();
}
// the sky going red toward the storm, a dim sun through it
function drawRedSky(ctx, red, time) {
  if (red <= 0.01) return;
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, `rgba(150,52,36,${0.6 * red})`);
  g.addColorStop(0.6, `rgba(200,96,62,${0.5 * red})`);
  g.addColorStop(1, `rgba(220,140,96,${0.35 * red})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, GROUND);
  ctx.fillStyle = `rgba(255,214,170,${0.25 * red})`; // the sun, gone a dull disc
  circle(ctx, W * 0.3, 74, 20);
}
// the dust blowing across, thicker into the red: long streaks going east to west
function drawBlowing(ctx, camX, time, red) {
  ctx.strokeStyle = `rgba(232,160,110,${0.15 + red * 0.35})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const n = 10 + Math.round(red * 20);
  for (let i = 0; i < n; i++) {
    const y = 120 + ((i * 97) % 330), k = ((time * (0.5 + (i % 5) * 0.1) + i * 0.37) % 1);
    const x = W + 40 - k * (W + 120) - camX * 0.0;
    ctx.moveTo(x, y);
    ctx.lineTo(x + 30 + (i % 4) * 12, y - 2);
  }
  ctx.stroke();
}

// ——— the far end: the Red Wall, a storm standing from the sand to the sky, churning and not moving ———
function drawStormWall(ctx, L, R, time) {
  const x0 = WALL_X;
  const g = ctx.createLinearGradient(x0 - 200, 0, x0 + 260, 0);
  g.addColorStop(0, 'rgba(184,90,60,0)');
  g.addColorStop(0.45, 'rgba(184,90,60,0.8)');
  g.addColorStop(1, 'rgba(140,52,36,0.98)');
  ctx.fillStyle = g;
  ctx.fillRect(Math.max(L, x0 - 200), 0, R - Math.max(L, x0 - 200), GROUND + 4);
  for (let i = 0; i < 22; i++) { // the churn, great rolls of red going round
    const y = GROUND - 30 - i * 20, ph = time * (0.5 + (i % 3) * 0.2) + i * 1.7;
    const x = x0 + 40 + Math.sin(ph) * 40 + (i % 5) * 60;
    if (x + 200 < L || x - 200 > R) continue;
    ctx.fillStyle = `rgba(${i % 2 ? '214,120,80' : '160,64,42'},0.5)`;
    ellipse(ctx, x, y, 140 + Math.sin(ph * 1.2) * 30, 22);
  }
  ctx.strokeStyle = 'rgba(255,200,150,0.3)'; // streaks of sand going round in it
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 14; i++) {
    const y = GROUND - 20 - i * 28, k = (time * 0.9 + i * 0.29) % 1;
    ctx.moveTo(x0 + k * 300, y);
    ctx.lineTo(x0 + 40 + k * 300, y - 8);
  }
  ctx.stroke();
  // shapes going round deep in it: a tent, a pack-beast, gone again
  const k = (time * 0.07) % 1;
  ctx.fillStyle = 'rgba(90,30,20,0.35)';
  const sx = x0 + 100 + Math.sin(k * TAU) * 160, sy = 200 + Math.cos(k * TAU) * 60;
  ctx.beginPath();
  ctx.moveTo(sx - 20, sy + 12);
  ctx.lineTo(sx, sy - 14);
  ctx.lineTo(sx + 20, sy + 12);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, sx + 140 + Math.cos(k * TAU) * 40, sy + 60, 22, 10);
}

// ——— the ground, the road ———
function drawGround(ctx, L, R, time) {
  if (R <= L) return;
  const g = ctx.createLinearGradient(0, GROUND - 6, 0, H);
  g.addColorStop(0, '#e0a470');
  g.addColorStop(1, '#a8603e');
  ctx.fillStyle = g;
  ctx.fillRect(L, GROUND - 2, R - L, H - GROUND + 2);
  ctx.fillStyle = '#eab27c';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 6, R - L + 8, 12, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,72,46,0.4)'; // ripples in the drifts, combed by the wind
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const r of RIPPLES) {
    if (r.x + r.w < L || r.x > R) continue;
    ctx.moveTo(r.x, r.y);
    ctx.quadraticCurveTo(r.x + r.w / 2, r.y - 3, r.x + r.w, r.y);
  }
  ctx.stroke();
}
// the old road: flat stones set in the sand, half drifted over, a stone or two missing
function drawRoad(ctx, L, R) {
  ctx.fillStyle = 'rgba(200,160,120,0.55)';
  for (let x = Math.floor(L / 46) * 46; x < R; x += 46) {
    if ((x / 46) % 7 === 3) continue;
    ctx.beginPath();
    ctx.roundRect(x + 3, GROUND + 6, 40, 9, 3);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(234,178,124,0.8)'; // sand drifted across it
  for (let x = Math.floor(L / 300) * 300 + 120; x < R; x += 300) ellipse(ctx, x, GROUND + 9, 60, 6);
}
// a marker stone, standing, a band of blue paint near its top, worn
function drawMarker(ctx, m) {
  ctx.save();
  ctx.translate(m.x, GROUND);
  ctx.rotate(m.lean);
  ctx.fillStyle = STONE;
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-9, -m.h, 18, m.h + 2, [8, 8, 2, 2]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(62,90,154,0.55)';
  ctx.fillRect(-9, -m.h + 10, 18, 4);
  ctx.restore();
  ctx.fillStyle = 'rgba(234,178,124,0.9)';
  ellipse(ctx, m.x - 4, GROUND - 1, 16, 5);
}
// a wind-carved pillar of red rock, narrow at the waist where the sand has scoured it
function drawPillar(ctx, p, time) {
  const { x, h, w } = p, b = GROUND;
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, STONE_L);
  g.addColorStop(1, STONE_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.6, b);
  ctx.quadraticCurveTo(x - w * 0.2, b - h * 0.5, x - w * 0.5, b - h);
  ctx.quadraticCurveTo(x, b - h - 14, x + w * 0.5, b - h);
  ctx.quadraticCurveTo(x + w * 0.2, b - h * 0.5, x + w * 0.6, b);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(106,52,36,0.45)'; // its layers
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = b - 20; y > b - h; y -= 18) {
    const k = Math.abs((b - y) / h - 0.5) * 0.6 + 0.3;
    ctx.moveTo(x - w * k, y);
    ctx.lineTo(x + w * k, y + 2);
  }
  ctx.stroke();
}
// the tallest pillar, a ledge cut at its top, a pole set in it with a lantern lit and turned toward the storm; nobody in
// Caravanserai says who keeps it lit (once the Red Wall's freed, for you, it's out and the pole has a blue bead on it)
function drawLampPillar(ctx, time, freed) {
  const x = PILLAR.x + PILLAR.w / 2, top = PILLAR.y, b = GROUND, w = 70;
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, STONE_L);
  g.addColorStop(1, STONE_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.7, b);
  ctx.quadraticCurveTo(x - w * 0.25, b - (b - top) * 0.5, x - w * 0.62, top + 4);
  ctx.lineTo(x + w * 0.62, top + 4);
  ctx.quadraticCurveTo(x + w * 0.25, b - (b - top) * 0.5, x + w * 0.7, b);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(106,52,36,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = b - 24; y > top + 14; y -= 20) {
    ctx.moveTo(x - w * 0.3, y);
    ctx.lineTo(x + w * 0.3, y + 2);
  }
  ctx.stroke();
  ctx.fillStyle = STONE_L; // the ledge cut at the top
  ctx.beginPath();
  ctx.roundRect(PILLAR.x, top - 4, PILLAR.w, 9, 3);
  ctx.fill();
  ctx.strokeStyle = '#5a3420'; // the pole, and the lantern on its arm, facing east
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 24, top - 2);
  ctx.lineTo(x + 24, top - 50);
  ctx.lineTo(x + 38, top - 50);
  ctx.stroke();
  const sw = Math.sin(time * 2.2) * 2;
  if (!freed) {
    const lg = ctx.createRadialGradient(x + 38 + sw, top - 38, 1, x + 38 + sw, top - 38, 36);
    lg.addColorStop(0, `rgba(255,184,74,${0.55 + 0.1 * Math.sin(time * 4)})`);
    lg.addColorStop(1, 'rgba(255,184,74,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(x + 2 + sw, top - 74, 72, 72);
  }
  ctx.fillStyle = freed ? '#8a6a4a' : '#e8a040';
  ctx.fillRect(x + 33 + sw, top - 46, 10, 13);
  ctx.fillStyle = '#5a3420';
  ctx.fillRect(x + 32 + sw, top - 48, 12, 3);
  if (freed) {
    ctx.fillStyle = '#3e5a9a';
    circle(ctx, x + 24, top - 30, 3);
  }
}
// a toppled marker stone lying along the road, flat enough to stand on
function drawToppledMarker(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = STONE_D;
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 6, w - 20, GROUND - y - 4, 6);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y - 6, 0, y + 22);
  g.addColorStop(0, STONE_L);
  g.addColorStop(1, STONE);
  ctx.fillStyle = g;
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y - 5, w, 26, [4, 12, 12, 4]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(62,90,154,0.55)'; // its blue band, sideways now
  ctx.fillRect(x + w - 26, y - 4, 5, 24);
  ctx.fillStyle = 'rgba(234,178,124,0.9)';
  ellipse(ctx, x + w * 0.3, GROUND - 1, w * 0.4, 6);
}
// a shelf of wind-carved red rock on its stalk
function drawRockShelf(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = STONE_D;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, GROUND);
  ctx.quadraticCurveTo(x + w * 0.42, y + 40, x + w * 0.3, y + 8);
  ctx.lineTo(x + w * 0.7, y + 8);
  ctx.quadraticCurveTo(x + w * 0.58, y + 40, x + w * 0.7, GROUND);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createLinearGradient(0, y - 6, 0, y + 24);
  g.addColorStop(0, STONE_L);
  g.addColorStop(1, STONE);
  ctx.fillStyle = g;
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 4);
  ctx.quadraticCurveTo(x - 4, y - 8, x + w * 0.3, y - 6);
  ctx.lineTo(x + w * 0.8, y - 7);
  ctx.quadraticCurveTo(x + w + 10, y - 6, x + w + 6, y + 6);
  ctx.quadraticCurveTo(x + w / 2, y + 26, x - 8, y + 4);
  ctx.fill();
  ctx.stroke();
}
// the bed of an old caravan wagon, half buried, its wheel up out of the drift, a striped cloth snagged on it
function drawWagon(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#8a5a3a';
  ctx.strokeStyle = '#4a2c1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x + 6, y + 4, w - 12, GROUND - y - 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(74,44,26,0.5)'; // its boards
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = 26; k < w - 10; k += 24) {
    ctx.moveTo(x + k, y + 6);
    ctx.lineTo(x + k, GROUND);
  }
  ctx.stroke();
  ctx.fillStyle = '#a87a52'; // the bed's top rail
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 9, 3);
  ctx.fill();
  ctx.strokeStyle = '#4a2c1a'; // the wheel, up out of the drift
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + w - 30, y + 30, 22, Math.PI * 0.9, Math.PI * 2.1);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (1 + i * 0.25);
    ctx.moveTo(x + w - 30, y + 30);
    ctx.lineTo(x + w - 30 + Math.cos(a) * 22, y + 30 + Math.sin(a) * 22);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,88,58,0.8)'; // a striped cloth snagged on the rail
  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.quadraticCurveTo(x + 14, y + 24, x + 26, y + 40);
  ctx.lineTo(x + 40, y + 36);
  ctx.quadraticCurveTo(x + 34, y + 18, x + 40, y);
  ctx.fill();
  ctx.fillStyle = 'rgba(232,170,90,0.8)';
  ctx.fillRect(x + 22, y + 14, 16, 4);
  ctx.fillStyle = '#e0a470'; // the drift it's half buried in
  ctx.beginPath();
  ctx.moveTo(x - 30, GROUND + 2);
  ctx.quadraticCurveTo(x + w * 0.3, y + 26, x + w * 0.7, GROUND + 2);
  ctx.fill();
}
// a squall on a rise: the crest of a drift, the sand streaming off it as the wind gets up, then a blast across the floor
function drawSquall(ctx, g, s, time, i) {
  const x0 = g.x - g.w / 2, x1 = g.x + g.w / 2;
  ctx.fillStyle = '#e8b07a'; // the rise
  ctx.beginPath();
  ctx.moveTo(x0 - 60, GROUND + 2);
  ctx.quadraticCurveTo(g.x, GROUND - 22, x1 + 60, GROUND + 2);
  ctx.fill();
  if (s.k <= 0.01) return;
  ctx.fillStyle = `rgba(232,160,110,${0.25 * s.k})`; // the lane it will blow along, darkening
  ctx.fillRect(x0, GROUND - 90, g.w, 92);
  ctx.strokeStyle = `rgba(255,214,170,${0.3 + 0.5 * s.k})`; // sand streaming off the crest, then a blast
  ctx.lineWidth = s.blow ? 2.4 : 1.4;
  ctx.beginPath();
  const n = s.blow ? 16 : 6 + Math.round(s.k * 6);
  for (let j = 0; j < n; j++) {
    const y = GROUND - 6 - ((j * 37 + i * 11) % (s.blow ? 84 : 30)), k = (time * (s.blow ? 2.6 : 1.2) + j * 0.23) % 1;
    const x = x1 - k * g.w;
    ctx.moveTo(x, y);
    ctx.lineTo(x - (s.blow ? 40 : 16), y + 1);
  }
  ctx.stroke();
  if (s.blow) {
    ctx.fillStyle = 'rgba(216,140,96,0.4)';
    for (let j = 0; j < 5; j++) ellipse(ctx, x0 + ((time * 300 + j * 60) % g.w), GROUND - 10 - (j % 3) * 14, 26, 8);
  }
}
// the Road's End: where the old road comes out from between the Observatory's last rings onto open sand; a stone with the
// caravan's road-mark cut in it, a cairn of blue-painted pebbles left by travellers going on (and none coming back)
function drawRoadsEnd(ctx) {
  const x = 240;
  ctx.fillStyle = STONE;
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 14, GROUND - 58, 28, 60, [10, 10, 2, 2]);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = STONE_D; // the road-mark: a line, and a step, and a line
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 7, GROUND - 40);
  ctx.lineTo(x, GROUND - 40);
  ctx.lineTo(x, GROUND - 30);
  ctx.lineTo(x + 7, GROUND - 30);
  ctx.stroke();
  for (let i = 0; i < 7; i++) { // the cairn
    ctx.fillStyle = i % 2 ? '#3e5a9a' : '#c8b49a';
    ellipse(ctx, x + 34 + (i % 3) * 8 - 8, GROUND - 4 - Math.floor(i / 3) * 6, 5, 3.4);
  }
}
// (freed) the caravan the storm held, come down on the sand: a tent lying flat, packs, a pack-saddle, a lamp
function drawFallen(ctx, x, k) {
  ctx.save();
  ctx.translate(x, GROUND);
  if (k === 'tent') {
    ctx.fillStyle = '#c8583a';
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.quadraticCurveTo(-10, -22, 30, -10);
    ctx.lineTo(44, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(232,200,150,0.8)';
    for (let i = 0; i < 3; i++) ctx.fillRect(-24 + i * 20, -12 + i * 2, 8, 12 - i * 2);
  } else if (k === 'pack') {
    ctx.fillStyle = '#7a4a2a';
    ctx.beginPath();
    ctx.roundRect(-16, -16, 32, 16, 6);
    ctx.fill();
    ctx.strokeStyle = '#d8a84a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, -8);
    ctx.lineTo(16, -8);
    ctx.stroke();
  } else if (k === 'saddle') {
    ctx.fillStyle = '#5a3420';
    ctx.beginPath();
    ctx.ellipse(0, -6, 24, 10, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#3e5a9a';
    circle(ctx, -10, -10, 2.4);
    circle(ctx, 10, -10, 2.4);
  } else {
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(-5, -14, 10, 14);
    ctx.fillStyle = 'rgba(232,160,64,0.5)';
    ctx.fillRect(-4, -12, 8, 8);
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(234,178,124,0.9)';
  ellipse(ctx, x, GROUND - 1, 40, 5);
}
