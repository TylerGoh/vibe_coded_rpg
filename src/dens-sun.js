// Docs: docs/combat/bosses.md, docs/places/observatory.md
// The Buried Observatory's boss den (the Dial Floor, atlas Phase 9 A1), its way in at the Dial Court (a round opening in
// the sand with steps going down, a groove worn in the sand round it where something round has rolled for an age, and now
// and then the top of a stone sun going by below), and the Sunroller itself: a great scarab, blue-black with a gold sheen,
// as big as a wagon, rolling a stone sun round the dial floor to keep the hours turning. A shard in its back. The plan:
// story/phase9-plan.md.
// dens.js imports this file and dispatches to it (same contracts as its own dens and bosses), so this file must NOT import
// dens.js: the few helpers it needs are copied below. The shared boss effects take its theme ('sundial': FXPAL in dens.js).
// Its ultimate, The Long Day, is the shared `wave` ult drawn as the stone sun rolling the den's length (ULT_LOOKS: jump it
// or get up on a ledge). Its freeing (drawSunFreed, run from the den's bossDie): the sun rolls to the middle of the dial
// and stops at noon, and the scarab folds its legs and rests in the shade of it.
import { H, TAU, mulberry32, circle, ellipse, mix, clamp } from './util.js';
import { DEN_W, DEN_PLATFORMS, DEN_EXIT_X, FIELD_GROUND, BOSS_RESPAWN_MS } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';
import { drawSunk } from './challenge.js';

const GROUND = FIELD_GROUND;
const NOON_X = DEN_W / 2; // the dial's middle, where the sun comes to rest
export const SUN_FREED_S = 7; // how long the freeing plays (the den's bossDie lasts this long)
const BRONZE = '#b8823a', BRONZE_D = '#6a4418', BRONZE_L = '#e8b85a';
const SHELL = '#1e2440', SHELL_D = '#0e1226', SHELL_L = '#3e4a7a', GOLD = '#d8a84a';
const STONE = '#d8b878', STONE_D = '#9a7a4a', STONE_L = '#f0dca8';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const rageCol = (c, enr, k = 0.3) => (enr ? mix(c, '#ff4a3a', k) : c);

// ——— small helpers (copies of the ones in dens.js) ———
function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.9, 0.35, 0.35); // src/glow.js
}
const gradCache = new WeakMap();
function vgrad(ctx, key, y0, y1, stops) {
  let c = gradCache.get(ctx);
  if (!c) gradCache.set(ctx, (c = {}));
  if (!c[key]) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [k, col] of stops) g.addColorStop(k, col);
    c[key] = g;
  }
  return c[key];
}

// The stone sun: a ball of gold-veined sandstone with a sun face cut on it, rolling (a: how far it has turned)
function stoneSun(ctx, x, y, r, a, time, hot = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (hot > 0) glow(ctx, 0, 0, r * 2.2, r * 2.2, '255,214,110', 0.3 + 0.4 * hot);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, STONE_L);
  g.addColorStop(0.7, STONE);
  g.addColorStop(1, STONE_D);
  ctx.fillStyle = g;
  ctx.strokeStyle = '#7a5a32';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.rotate(a);
  ctx.strokeStyle = 'rgba(154,122,74,0.85)'; // the sun cut on it: a disc and its rays
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.36, 0, TAU);
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * TAU;
    ctx.moveTo(Math.cos(t) * r * 0.46, Math.sin(t) * r * 0.46);
    ctx.lineTo(Math.cos(t) * r * (i % 2 ? 0.7 : 0.82), Math.sin(t) * r * (i % 2 ? 0.7 : 0.82));
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(244,198,74,0.7)'; // gold veins
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, r * 0.2);
  ctx.quadraticCurveTo(-r * 0.3, r * 0.5, r * 0.2, r * 0.85);
  ctx.moveTo(r * 0.5, -r * 0.7);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.2, r * 0.9, -r * 0.1);
  ctx.stroke();
  ctx.restore();
}

// Freed: the sun rests at noon in the middle of the dial, and the light is the warm noon light, until it's back
let freedPending = false, freedAt = -1e9;

// ——— the den: a round court sunk deep in the sand and open to the sky, the dial floor of bronze, hour lines radiating
// from the middle, a ring of hour-stones round the walls, the groove the sun has worn round and round in the floor ———
const motes = (() => {
  const r = mulberry32(9701);
  return Array.from({ length: 34 }, () => ({ x: r() * DEN_W, y: 80 + r() * 320, p: r() * TAU, s: 0.6 + r() * 0.7 }));
})();
const HOURS = Array.from({ length: 12 }, (_, i) => 70 + i * ((DEN_W - 140) / 11));

function drawDenSun(ctx, camX, viewW, time, den) {
  const L = camX - 80, R = camX + viewW + 80;
  if (freedPending) (freedPending = false), (freedAt = time);
  const freed = time - freedAt < BOSS_RESPAWN_MS / 1000;
  ctx.save();
  // the sky through the opening above, the sand walls of the pit going up to it
  ctx.fillStyle = vgrad(ctx, 'bg-sun', 0, GROUND, [[0, '#3a78c0'], [0.22, '#8ec0e4'], [0.3, '#d8a870'], [0.75, '#b88450'], [1, '#9a6a3e']]);
  ctx.fillRect(L, 0, R - L, H);
  ctx.fillStyle = 'rgba(255,252,236,0.9)'; // the sun itself, straight overhead (the real one)
  circle(ctx, DEN_W * 0.5, 30, 18);
  glow(ctx, DEN_W * 0.5, 30, 160, 90, '255,250,226', 0.5);
  ctx.fillStyle = '#c8945a'; // the pit's lip, ragged with sand
  ctx.beginPath();
  ctx.moveTo(L, 130);
  for (let x = Math.floor(L / 40) * 40; x <= R + 40; x += 40) ctx.lineTo(x, 122 + Math.sin(x * 0.03) * 8);
  ctx.lineTo(R, 150);
  ctx.lineTo(L, 150);
  ctx.closePath();
  ctx.fill();
  // the walls: dressed stone, the hour-stones set round them, sand streaming down in places
  ctx.fillStyle = vgrad(ctx, 'wall-sun', 140, GROUND, [[0, '#b88450'], [1, '#8a5a32']]);
  ctx.fillRect(L, 140, R - L, GROUND - 140);
  ctx.strokeStyle = 'rgba(90,58,30,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = 170; y < GROUND; y += 34) {
    ctx.moveTo(L, y);
    ctx.lineTo(R, y);
  }
  ctx.stroke();
  HOURS.forEach((x, i) => {
    if (!visible(x - 40, x + 40, L, R)) return;
    ctx.fillStyle = '#d8b480';
    ctx.strokeStyle = '#7a5430';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 22, 196, 44, 60, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(90,58,30,0.8)'; // its hour, in tally strokes (no numerals here)
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k <= i % 6; k++) {
      ctx.moveTo(x - 12 + k * 5, 212);
      ctx.lineTo(x - 12 + k * 5, 230);
    }
    if (i >= 6) {
      ctx.moveTo(x - 14, 238);
      ctx.lineTo(x + 14, 238);
    }
    ctx.stroke();
  });
  for (const sx of [180, 760, 1300]) { // sand streaming down the walls
    if (!visible(sx - 30, sx + 30, L, R)) continue;
    ctx.fillStyle = 'rgba(232,200,138,0.55)';
    ctx.beginPath();
    ctx.moveTo(sx - 6, 130);
    ctx.quadraticCurveTo(sx - 10, 260, sx - 22, GROUND);
    ctx.lineTo(sx + 22, GROUND);
    ctx.quadraticCurveTo(sx + 8, 260, sx + 6, 130);
    ctx.closePath();
    ctx.fill();
  }
  // the dial floor: bronze, hour lines radiating from the middle, the groove worn round it
  ctx.fillStyle = vgrad(ctx, 'floor-sun', GROUND, H, [[0, '#c8944a'], [0.3, '#9a6a30'], [1, '#5a3a1a']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.strokeStyle = 'rgba(255,226,150,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -8; i <= 8; i++) {
    ctx.moveTo(NOON_X + i * 20, GROUND + 2);
    ctx.lineTo(NOON_X + i * 140, H);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60,36,14,0.55)'; // the groove
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(NOON_X, GROUND + 22, DEN_W * 0.46, 14, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,200,138,0.7)'; // sand drifted in the corners
  ellipse(ctx, 60, GROUND - 4, 120, 16);
  ellipse(ctx, DEN_W - 60, GROUND - 4, 120, 16);
  for (const mo of motes) { // dust turning in the light
    if (!visible(mo.x - 10, mo.x + 10, L, R)) continue;
    const y = mo.y + Math.sin(time * 0.5 * mo.s + mo.p) * 12, x = mo.x + Math.sin(time * 0.3 + mo.p) * 18;
    ctx.fillStyle = `rgba(255,244,214,${0.35 + 0.25 * Math.sin(time + mo.p)})`;
    circle(ctx, x, y, 1.4);
  }
  if (freed && visible(NOON_X - 120, NOON_X + 120, L, R)) {
    glow(ctx, NOON_X, GROUND - 60, 260, 160, '255,226,150', 0.35);
    stoneSun(ctx, NOON_X, GROUND - 58, 58, 0, time, 0.2);
  }
  if (visible(DEN_EXIT_X - 90, DEN_EXIT_X + 90, L, R)) drawExit(ctx);
  if (visible(750 - 260, 750 + 260, L, R)) drawBanner(ctx, den?.name ?? 'The Dial Floor', 750, time);
  DEN_PLATFORMS.forEach((p, i) => visible(p.x - 60, p.x + p.w + 60, L, R) && drawSunk(ctx, p, i, () => drawLedge(ctx, p))); // (drawSunk: a boss's moving arena, src/challenge.js)
  ctx.restore();
}

function drawExit(ctx) {
  const x = DEN_EXIT_X, b = GROUND;
  glow(ctx, x, b - 60, 110, 90, '255,236,190', 0.35);
  ctx.fillStyle = '#e8c88a'; // the steps going up, sunlight down them
  ctx.beginPath();
  ctx.moveTo(x - 40, b + 2);
  ctx.lineTo(x - 36, b - 120);
  ctx.quadraticCurveTo(x, b - 136, x + 36, b - 120);
  ctx.lineTo(x + 40, b + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(154,106,62,0.6)';
  for (let i = 0; i < 6; i++) ctx.fillRect(x - 34 + i * 3, b - 16 - i * 18, 68 - i * 6, 4);
  ctx.strokeStyle = BRONZE;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x - 46, b + 4);
  ctx.lineTo(x - 42, b - 124);
  ctx.quadraticCurveTo(x, b - 142, x + 42, b - 124);
  ctx.lineTo(x + 46, b + 4);
  ctx.stroke();
  text(ctx, 'OUT', x, b - 160, 13, '#fff6e0');
}

// The name, cut into a bronze dial-plate hung on two chains from the pit's lip
function drawBanner(ctx, name, x, time) {
  ctx.save();
  ctx.translate(x, 90);
  ctx.rotate(Math.sin(time * 0.5) * 0.01);
  ctx.font = "700 18px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(240, ctx.measureText(name).width + 50);
  ctx.strokeStyle = 'rgba(106,68,24,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const sx of [-tw / 2 + 18, tw / 2 - 18]) {
    ctx.moveTo(sx, -70);
    ctx.lineTo(sx, -18);
  }
  ctx.stroke();
  ctx.fillStyle = BRONZE;
  ctx.strokeStyle = BRONZE_D;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 44, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(106,168,152,0.55)';
  for (let i = 0; i < 6; i++) ellipse(ctx, -tw / 2 + 20 + i * (tw - 40) / 5, 18, 8, 3);
  text(ctx, name, 0, 3, 18, '#2a1a0a');
  ctx.restore();
}

// The ledges: hour-stones fallen out of the walls, laid across bronze brackets
function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = BRONZE_D;
  for (const bx of [x + 20, x + w - 34]) {
    ctx.beginPath();
    ctx.moveTo(bx, y + 6);
    ctx.lineTo(bx + 14, y + 6);
    ctx.lineTo(bx + 7, GROUND);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#d8b480';
  ctx.strokeStyle = '#7a5430';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 22, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f0d4a0';
  ctx.beginPath();
  ctx.roundRect(x + 4, y - 4, w - 8, 6, 3);
  ctx.fill();
}

export const DEN_ART = { sundial: drawDenSun };

// ——— the way in at the Observatory's Dial Court (feet at groundY) ———
// A round opening in the sand ringed with bronze, steps going down into the light below, a groove worn in the sand round
// it, and every so often the top of the stone sun going by down there, slow, the sand trembling
function drawEntranceSun(ctx, x, groundY, time) {
  const b = groundY;
  ctx.save();
  glow(ctx, x, b - 40, 120, 70, '255,226,150', 0.3);
  ctx.strokeStyle = 'rgba(90,58,30,0.5)'; // the worn groove round it
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(x, b + 6, 120, 12, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#2a1a0e'; // the opening
  ctx.beginPath();
  ctx.ellipse(x, b + 2, 70, 10, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c8aa82'; // the steps' top going down, and the dark doorway in the near wall of it
  ctx.beginPath();
  ctx.moveTo(x - 46, b);
  ctx.lineTo(x - 40, b - 96);
  ctx.quadraticCurveTo(x, b - 114, x + 40, b - 96);
  ctx.lineTo(x + 46, b);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a2412';
  ctx.beginPath();
  ctx.moveTo(x - 34, b);
  ctx.lineTo(x - 30, b - 82);
  ctx.quadraticCurveTo(x, b - 96, x + 30, b - 82);
  ctx.lineTo(x + 34, b);
  ctx.closePath();
  ctx.fill();
  // the top of the stone sun rolling past, far down, now and then
  const k = (time * 0.12) % 1;
  if (k < 0.35) {
    const sx = x - 30 + (k / 0.35) * 60;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - 30, b);
    ctx.lineTo(x - 26, b - 76);
    ctx.quadraticCurveTo(x, b - 88, x + 26, b - 76);
    ctx.lineTo(x + 30, b);
    ctx.closePath();
    ctx.clip();
    stoneSun(ctx, sx, b + 10, 40, time * 0.8, time);
    ctx.restore();
  }
  ctx.strokeStyle = BRONZE; // the bronze arch over it, a sun on its keystone
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x - 56, b + 4);
  ctx.lineTo(x - 50, b - 104);
  ctx.quadraticCurveTo(x, b - 128, x + 50, b - 104);
  ctx.lineTo(x + 56, b + 4);
  ctx.stroke();
  ctx.strokeStyle = BRONZE_L;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = GOLD;
  circle(ctx, x, b - 118, 9);
  ctx.strokeStyle = BRONZE_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    ctx.moveTo(x + Math.cos(a) * 11, b - 118 + Math.sin(a) * 11);
    ctx.lineTo(x + Math.cos(a) * 15, b - 118 + Math.sin(a) * 15);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,200,138,0.8)'; // sand trembling at the rim
  for (let i = 0; i < 6; i++) circle(ctx, x - 60 + i * 24 + Math.sin(time * 9 + i) * 1.5, b - 2, 1.6);
  ctx.restore();
}
export const ENTRANCE_ART = { sundial: drawEntranceSun };

// ——— the Sunroller (ctx, w, h, st) => sil, origin at its feet on the floor, +x = facing ———
// A great scarab as big as a wagon, blue-black with a gold sheen, its head down and its front legs on the stone sun it
// rolls ahead of it (the sun is part of it: in front, at +x); its back rounded under two wing-cases with a seam down the
// middle, and between them near the top the shard glints (where `weak` puts the weak point). Walking, the sun turns; m.warn:
// the wing-cases lift a crack and the sun glows; charging: the sun turning fast, dust off the floor.
function drawSunroller(ctx, w, h, st) {
  const { t, seed, enr, warn, charging, dying, walking } = st;
  const live = dying < 0.02;
  const step = walking || charging ? Math.sin(t * (charging ? 16 : 6)) : 0;
  const roll = (charging ? t * 6 : walking ? t * 2 : t * 0.15) + seed;
  const shell = rageCol(SHELL, enr, 0.2), shellL = rageCol(SHELL_L, enr, 0.2);
  const bx = -w * 0.16, by = -h * 0.46; // the body's middle
  const sunR = h * 0.36, sunX = w * 0.3, sunY = -sunR;
  const sil = () => {
    ctx.beginPath();
    ctx.ellipse(bx, by, w * 0.3, h * 0.36, 0, 0, TAU);
    ctx.moveTo(sunX + sunR, sunY);
    ctx.arc(sunX, sunY, sunR, 0, TAU);
  };
  ctx.save();
  // legs: six, jointed, black; the back four on the floor, the front two up on the sun
  ctx.strokeStyle = SHELL_D;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (const [lx, ph] of [[-w * 0.36, 1], [-w * 0.22, -1], [-w * 0.06, 1]]) {
    const sw = step * ph * 12;
    ctx.moveTo(lx, by + h * 0.18);
    ctx.lineTo(lx - 18 + sw * 0.4, -h * 0.12);
    ctx.lineTo(lx - 10 + sw, -2);
  }
  ctx.moveTo(w * 0.04, by - h * 0.02);
  ctx.lineTo(w * 0.16, by - h * 0.18 + step * 4);
  ctx.lineTo(sunX - sunR * 0.66, sunY - sunR * 0.5 + step * 3);
  ctx.moveTo(w * 0.06, by + h * 0.12);
  ctx.lineTo(w * 0.14, by + h * 0.04 - step * 4);
  ctx.lineTo(sunX - sunR * 0.9, sunY + sunR * 0.1 - step * 3);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(216,168,74,0.5)'; // the spines on them
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const lx of [-w * 0.36, -w * 0.22, -w * 0.06]) {
    ctx.moveTo(lx - 14, -h * 0.1);
    ctx.lineTo(lx - 20, -h * 0.06);
  }
  ctx.stroke();
  // the stone sun, ahead of it
  stoneSun(ctx, sunX, sunY, sunR, roll, t, warn ? 1 : charging ? 0.5 : 0);
  // the body: the thorax and head bowed at the sun, the abdomen under the wing-cases
  const g = ctx.createLinearGradient(bx - w * 0.3, by - h * 0.36, bx + w * 0.3, by + h * 0.3);
  g.addColorStop(0, shellL);
  g.addColorStop(0.45, shell);
  g.addColorStop(1, SHELL_D);
  ctx.fillStyle = g;
  ctx.strokeStyle = SHELL_D;
  ctx.lineWidth = 3;
  ctx.beginPath(); // the head, bowed, its toothed scoop against the sun
  ctx.ellipse(w * 0.08, by + h * 0.02, w * 0.1, h * 0.14, 0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GOLD; // the scoop's teeth
  for (let i = 0; i < 4; i++) {
    const a = -0.6 + i * 0.35;
    ctx.beginPath();
    ctx.moveTo(w * 0.14 + Math.cos(a) * 12, by + h * 0.02 + Math.sin(a) * 18);
    ctx.lineTo(w * 0.2 + Math.cos(a) * 16, by + h * 0.02 + Math.sin(a) * 22);
    ctx.lineTo(w * 0.15 + Math.cos(a + 0.18) * 12, by + h * 0.02 + Math.sin(a + 0.18) * 18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = g;
  ctx.beginPath(); // the abdomen and wing-cases
  ctx.ellipse(bx, by, w * 0.3, h * 0.36, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  const lift = warn ? 0.08 : 0;
  ctx.strokeStyle = SHELL_D; // the seam down the middle, the cases lifting a crack on a warning
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx + w * 0.04, by - h * 0.36);
  ctx.quadraticCurveTo(bx - w * 0.02, by, bx + w * 0.02, by + h * 0.34);
  ctx.stroke();
  if (lift) {
    ctx.fillStyle = 'rgba(255,214,110,0.6)';
    ctx.beginPath();
    ctx.moveTo(bx + w * 0.04, by - h * 0.34);
    ctx.quadraticCurveTo(bx - w * 0.06, by, bx + w * 0.02, by + h * 0.3);
    ctx.quadraticCurveTo(bx + w * 0.02, by, bx + w * 0.06, by - h * 0.34);
    ctx.fill();
  }
  ctx.strokeStyle = `rgba(232,184,90,${live ? 0.6 + 0.2 * Math.sin(t * 2) : 0.3})`; // the gold sheen
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(bx - w * 0.08, by - h * 0.06, w * 0.18, h * 0.24, -0.3, Math.PI * 1.1, Math.PI * 1.55);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,184,90,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    ctx.moveTo(bx - w * 0.26 + i * 4, by - h * 0.1 + i * h * 0.1);
    ctx.quadraticCurveTo(bx - w * 0.1, by - h * 0.02 + i * h * 0.1, bx, by - h * 0.12 + i * h * 0.12);
  }
  ctx.stroke();
  // the shard, glinting between the wing-cases near the top (the weak point)
  const sx = -w * 0.12, sy = -h * 0.78;
  if (live) glow(ctx, sx, sy, 30, 30, '200,240,255', 0.35 + 0.25 * Math.sin(t * 3));
  ctx.fillStyle = '#e8f6ff';
  ctx.strokeStyle = '#6a9ac8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 12);
  ctx.lineTo(sx + 7, sy);
  ctx.lineTo(sx, sy + 9);
  ctx.lineTo(sx - 6, sy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // eyes: small and gold on the bowed head
  ctx.fillStyle = live ? (enr ? '#ff8a6a' : '#ffe9a8') : '#5a5048';
  circle(ctx, w * 0.12, by - h * 0.06, 4.2);
  ctx.fillStyle = SHELL_D;
  circle(ctx, w * 0.13, by - h * 0.06, 2);
  if (charging) { // dust off the floor
    ctx.fillStyle = 'rgba(232,200,138,0.55)';
    for (let i = 0; i < 6; i++) ellipse(ctx, -w * 0.5 - i * 16, -6 - (i % 2) * 8, 18 - i * 2, 8 - i);
  }
  ctx.restore();
  return sil;
}
export const BOSS_ART = { sunroller: drawSunroller };

// ——— The Long Day: the `wave` ult drawn as the stone sun rolling the den's length (jump it, or get up on a ledge) ———
function ease(k) {
  return k * k * (3 - 2 * k);
}
const SUN_ULT = {
  waveWarn(ctx, e, k) {
    const { x0, dir } = e, y = GROUND;
    const pulse = 0.5 + 0.5 * Math.sin(e.t * (6 + 14 * k));
    ctx.fillStyle = `rgba(255,214,110,${0.1 + 0.14 * pulse})`; // the lane it will roll down, glaring
    ctx.fillRect(-20, y - 150, DEN_W + 40, 152);
    ctx.strokeStyle = `rgba(255,246,226,${0.3 + 0.3 * pulse})`;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 10; i++) {
      const p = (i / 10 + e.t * 0.4) % 1;
      const cx = dir > 0 ? x0 + p * (DEN_W - x0) : x0 - p * x0;
      ctx.beginPath();
      ctx.moveTo(cx - dir * 10, y - 60);
      ctx.lineTo(cx + dir * 4, y - 48);
      ctx.lineTo(cx - dir * 10, y - 36);
      ctx.stroke();
    }
    // the sun drawn back, rocking, glowing hotter
    const r = 70 * (0.5 + 0.5 * ease(k));
    stoneSun(ctx, x0 + dir * 60 - dir * 20 * Math.sin(e.t * 4) * k, y - r, r, e.t * dir, e.t, k);
  },
  waveGo(ctx, e) {
    const r = 74, x = e.x0 + e.dir * e.speed * e.t;
    ctx.fillStyle = 'rgba(232,200,138,0.6)'; // dust off the floor behind it
    for (let i = 0; i < 8; i++) ellipse(ctx, x - e.dir * (r + i * 22), GROUND - 10 - (i % 2) * 10, 26 - i * 2, 10 - i);
    stoneSun(ctx, x, GROUND - r, r, (e.dir * e.speed * e.t) / r, e.t, 0.6);
  },
};
export const ULT_LOOKS = { sundial: SUN_ULT };

// ——— freed: the sun rolls to the middle of the dial and stops at noon; the scarab folds its legs and rests in its shade
// (the den's bossDie, SUN_FREED_S long) ———
export function drawSunFreed(ctx, e) {
  const tt = e.t;
  if (tt > 2) freedPending = true;
  const k = clamp(tt / 3, 0, 1), x0 = e.x ?? NOON_X;
  const sx = x0 + (NOON_X - x0) * ease(k), r = 58;
  ctx.save();
  glow(ctx, NOON_X, GROUND - 120, 300 * k, 220 * k, '255,236,170', 0.4 * k);
  stoneSun(ctx, sx, GROUND - r, r, (sx - x0) / r, tt, 0.3 * (1 - k));
  if (tt > 3) { // a shaft of noon light straight down on it
    const a = clamp((tt - 3) / 1.5, 0, 1) * (1 - clamp((tt - SUN_FREED_S + 1) / 1, 0, 1));
    ctx.fillStyle = `rgba(255,248,220,${0.25 * a})`;
    ctx.beginPath();
    ctx.moveTo(NOON_X - 50, 0);
    ctx.lineTo(NOON_X + 50, 0);
    ctx.lineTo(NOON_X + 90, GROUND);
    ctx.lineTo(NOON_X - 90, GROUND);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(255,252,236,${a})`;
    text(ctx, 'NOON', NOON_X, GROUND - r * 2 - 30, 18, `rgba(106,68,24,${a})`);
  }
  ctx.restore();
}
