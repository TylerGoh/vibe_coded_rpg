// Docs: docs/places/drywells.md
// The Shell Road (room SHELLROAD, data in src/shared/rpg.js; atlas Phase 9, A5 (b)): the approach to Old Carapace's back. No
// mobs and no combat; everything that makes it what it is is drawn here (and heard: the `shellroad` music scene, given
// shellDepth by src/main.js), never step() and never a cutscene. Up out of the dry spring onto the open desert at dusk: dunes
// going on for ever, the sky orange and violet, the storm's red wall far off. How far east YOU are (shellDepth: 0 at the way
// in, 1 at the climb) sets everything:
// - Old Carapace walks past: first a hill on the horizon, then nearer at every step, a shell like a sky with the empty town on
//   top of it, until at the far end one great foreleg plants in the sand in front of you, its scales stepped like a stair;
// - his footfalls get slower and heavier the nearer you are; on each one the ground shakes and dust jumps off the dunes.
// At the east end the climb (CARAPACE_DEN_X): the foreleg's scales going up into the dusk, a sign beside it with both levels
// (finalTag) and a live count of slimes on the Shell Road. His one line (CARAPACE_LINE, sent by the server: say) is a bubble
// out of the dusk above. He never says his name; the sign says what the den is called.
import { W, H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { SHELL_EXIT_X, CARAPACE_DEN_X, LONG_DEN_NAME, DUNE_TOP, FINAL_MIN_PLAYERS, finalTag, FIELD_GROUND } from './shared/rpg.js';
import { glow as softGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
const HIDE = '#a88466', HIDE_D = '#6a4e3a';
const PLATE = '#8a6a4a', PLATE_D = '#4e3a2a', PLATE_L = '#b8946c';

// 0 at the way in, 1 at the climb: how far along the Shell Road a slime at x is
export const shellDepth = (x) => clamp((x - 260) / (CARAPACE_DEN_X - 460), 0, 1);

function text(ctx, str, x, y, size, color, align = 'center', weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// his footfalls: slower the nearer you are (STEP_NEAR at the climb, STEP_FAR at the way in), the phase kept going smoothly
const STEP_FAR = 2.2, STEP_NEAR = 4.2;
let stepPh = 0, lastT = null, jolt = 0;
function advance(time, k) {
  const dt = lastT === null ? 0 : clamp(time - lastT, 0, 0.1);
  lastT = time;
  const per = STEP_FAR + (STEP_NEAR - STEP_FAR) * smooth(k);
  const before = stepPh;
  stepPh += dt / per;
  if (Math.floor(stepPh * 2) !== Math.floor(before * 2)) jolt = 1;
  jolt = Math.max(0, jolt - dt * 2.5);
}

const R0 = mulberry32(9901);
const DUNES = Array.from({ length: 14 }, (_, i) => ({ x: i * 260 + R0() * 100, w: 300 + R0() * 260, h: 40 + R0() * 50, l: R0() }));
const NEAR = Array.from({ length: 10 }, (_, i) => ({ x: i * 300 + R0() * 120, w: 260 + R0() * 160, h: 20 + R0() * 26 }));
const STARS = Array.from({ length: 30 }, () => ({ x: R0() * W, y: R0() * 150, s: 0.6 + R0() * 1.2, p: R0() * TAU }));

let says = null; // his line: { text, at }
export function say(text, time) {
  says = { text, at: time };
}

// Everything behind the slimes. me: our own state (null when offline), here: slimes in the room (us included)
export function drawShellRoad(ctx, camX, viewW, time, me, here) {
  const mx = me?.x ?? 0, k = shellDepth(mx);
  advance(time, k);
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.translate(camX, jolt * 2);
  drawSky(ctx, time, k);
  drawFarDunes(ctx, camX);
  drawWalker(ctx, k, time);
  drawNearDunes(ctx, camX, k);
  ctx.restore();
  drawGround(ctx, L, R);
  drawForeleg(ctx, time, k);
  if (Math.abs(CARAPACE_DEN_X - 300 - camX - viewW / 2) < viewW / 2 + 160) drawSign(ctx, CARAPACE_DEN_X - 300, here, time);
  if (SHELL_EXIT_X + 260 > L) drawSpringTop(ctx);
}

// the dusk sky: violet overhead to orange at the horizon, the sun going down behind you (west), first stars; the storm's red
// wall far off south-east
function drawSky(ctx, time, k) {
  const g = ctx.createLinearGradient(0, 0, 0, 300);
  g.addColorStop(0, '#2a2a5a');
  g.addColorStop(0.5, '#a86a7a');
  g.addColorStop(1, '#f4a860');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 302);
  glow(ctx, W * 0.08, 292, 220, 110, '255,190,120', 0.55);
  ctx.fillStyle = 'rgba(255,220,170,0.9)';
  circle(ctx, W * 0.08, 290, 26);
  for (const s of STARS) {
    ctx.fillStyle = `rgba(255,250,236,${0.4 + 0.4 * Math.sin(time * 1.4 + s.p)})`;
    circle(ctx, s.x, s.y, s.s);
  }
  const rg = ctx.createLinearGradient(W * 0.7, 0, W, 0); // the storm, a red smear low in the east
  rg.addColorStop(0, 'rgba(184,90,60,0)');
  rg.addColorStop(1, 'rgba(184,90,60,0.5)');
  ctx.fillStyle = rg;
  ctx.fillRect(W * 0.7, 180, W * 0.3, 122);
}
function drawFarDunes(ctx, camX) {
  ctx.fillStyle = '#c8885a';
  ctx.fillRect(0, 300, W, H - 300);
  for (const d of DUNES) {
    const x = (((d.x - camX * 0.05) % 3640) + 3640) % 3640 - 300;
    if (x + d.w < -40 || x - d.w > W + 40) continue;
    ctx.fillStyle = d.l > 0.5 ? '#d89a68' : '#c07c50';
    ctx.beginPath();
    ctx.moveTo(x - d.w / 2, 304);
    ctx.quadraticCurveTo(x - d.w * 0.1, 304 - d.h, x + d.w / 2, 304);
    ctx.fill();
  }
}
// Old Carapace walking past: far off and small at the way in, nearer at every step; the shell like a sky, the empty town on
// it, four legs going slowly, the head out ahead looking east, dust under him. A silhouette against the dusk
function drawWalker(ctx, k, time) {
  const s = 0.5 + 3.2 * smooth(k), x = W * (0.72 - 0.08 * smooth(k)), y = 304 + 150 * smooth(k);
  const step = stepPh * TAU;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha = 0.7 + 0.3 * k;
  ctx.fillStyle = '#6a4a3a';
  for (let i = 0; i < 4; i++) { // the legs, a pair at a time
    const lx = -50 + i * 32, lift = Math.max(0, Math.sin(step + (i % 2) * Math.PI)) * 4;
    ctx.beginPath();
    ctx.roundRect(lx - 7, -28 - lift, 14, 28 + lift, 6);
    ctx.fill();
  }
  const g = ctx.createLinearGradient(0, -80, 0, -20);
  g.addColorStop(0, '#7a5a44');
  g.addColorStop(1, '#4e3a2a');
  ctx.fillStyle = g; // the shell
  ctx.beginPath();
  ctx.moveTo(-76, -22);
  ctx.quadraticCurveTo(-72, -78, -4, -82);
  ctx.quadraticCurveTo(66, -78, 74, -22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a4030'; // the town on his back: tents, a dry well's frame, poles
  for (const [tx, h] of [[-40, 10], [-22, 14], [-4, 11], [16, 15], [34, 10]]) {
    const ty = -80 + Math.abs(tx) * 0.05;
    ctx.beginPath();
    ctx.moveTo(tx - 8, ty);
    ctx.lineTo(tx, ty - h);
    ctx.lineTo(tx + 8, ty);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(-14, -96, 2, 14);
  ctx.fillRect(2, -94, 2, 12);
  ctx.fillStyle = '#6a4a3a'; // the neck and head out ahead
  ctx.beginPath();
  ctx.moveTo(66, -40);
  ctx.quadraticCurveTo(84, -54 + Math.sin(step * 2) * 2, 98, -46);
  ctx.lineTo(102, -36);
  ctx.quadraticCurveTo(84, -36, 70, -26);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(100, -44 + Math.sin(step * 2) * 2, 12, 7, 0.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(232,190,140,0.5)'; // dust under him
  for (let i = 0; i < 5; i++) ellipse(ctx, -60 + i * 30 + Math.sin(time + i) * 3, -2, 18, 4);
  ctx.restore();
}
function drawNearDunes(ctx, camX, k) {
  for (const d of NEAR) {
    const x = (((d.x - camX * 0.25) % 3000) + 3000) % 3000 - 300;
    if (x + d.w < -40 || x - d.w > W + 40) continue;
    ctx.fillStyle = '#b87048';
    ctx.beginPath();
    ctx.moveTo(x - d.w / 2, 400);
    ctx.quadraticCurveTo(x, 400 - d.h - jolt * 3, x + d.w / 2, 400);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(232,190,140,0.4)'; // dust jumping off them on a footfall
  if (jolt > 0.4) for (let i = 0; i < 8; i++) ellipse(ctx, (i * 131 + 40) % W, 396 - jolt * 10, 24, 5);
}
function drawGround(ctx, L, R) {
  const g = ctx.createLinearGradient(0, GROUND - 6, 0, H);
  g.addColorStop(0, '#d89a68');
  g.addColorStop(1, '#8a5a3a');
  ctx.fillStyle = g;
  ctx.fillRect(L, GROUND - 2, R - L, H - GROUND + 2);
  ctx.fillStyle = '#e0a874';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 6, R - L + 8, 10, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(122,74,46,0.4)'; // the sand's ripples
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = Math.floor(L / 70) * 70; x < R; x += 70) {
    const y = GROUND + 14 + ((x / 70) % 4) * 14;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 30, y - 3, x + 60, y);
  }
  ctx.stroke();
}
// the climb: his near foreleg planted in the sand, as thick as a tower, going up out of the top of the view into the shell's
// shadow; its great scales stepped like a stair, the way up (CARAPACE_DEN_X); the sand heaped round the foot, still
// trembling from the step
function drawForeleg(ctx, time, k) {
  const x = CARAPACE_DEN_X, b = GROUND;
  const sh = smooth((k - 0.6) / 0.4);
  ctx.fillStyle = `rgba(40,26,18,${0.25 + 0.35 * sh})`; // the shell's shadow over the far end
  ctx.fillRect(x - 600, 0, 900, b);
  ctx.save();
  ctx.translate(jolt * 1.5, 0);
  const g = ctx.createLinearGradient(x - 120, 0, x + 120, 0);
  g.addColorStop(0, HIDE_D);
  g.addColorStop(0.4, HIDE);
  g.addColorStop(1, HIDE_D);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 130, b + 4);
  ctx.quadraticCurveTo(x - 110, b - 260, x - 90, -20);
  ctx.lineTo(x + 110, -20);
  ctx.quadraticCurveTo(x + 130, b - 260, x + 140, b + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PLATE_L; // the scales, stepped like a stair, going up
  ctx.strokeStyle = PLATE_D;
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const sy = b - 20 - i * 52, sx = x - 70 + (i % 2) * 30;
    ctx.beginPath();
    ctx.roundRect(sx - 40, sy - 16, 80, 22, 10);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = PLATE; // claws at the foot
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(x - 100 + i * 70, b - 6, 22, 12, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = `rgba(232,190,140,${0.6 + 0.3 * jolt})`; // the sand heaped round the foot
  ellipse(ctx, x, b, 220, 14 + jolt * 4);
  glow(ctx, x - 60, b - 80, 90, 70, '255,214,170', 0.12 + 0.1 * Math.sin(time * 1.3)); // (the way up, a little lighter)
}
// the top of the dry spring at the west end, a cleft in the rock with worn steps going down, the way back
function drawSpringTop(ctx) {
  const x = SHELL_EXIT_X + 40;
  ctx.fillStyle = '#7a5a40';
  ctx.beginPath();
  ctx.moveTo(x - 80, GROUND);
  ctx.quadraticCurveTo(x - 60, GROUND - 80, x, GROUND - 90);
  ctx.quadraticCurveTo(x + 60, GROUND - 80, x + 90, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a120c';
  ctx.beginPath();
  ctx.moveTo(x - 24, GROUND);
  ctx.lineTo(x - 12, GROUND - 60);
  ctx.lineTo(x + 14, GROUND - 60);
  ctx.lineTo(x + 26, GROUND);
  ctx.closePath();
  ctx.fill();
}
function drawSign(ctx, x, here, time) {
  ctx.fillStyle = '#5a3a24';
  ctx.beginPath();
  ctx.roundRect(x - 5, GROUND - 110, 10, 112, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 120 + jolt * 2);
  ctx.rotate(Math.sin(time * 0.5) * 0.006);
  const tag = finalTag(DUNE_TOP), n = here | 0;
  ctx.font = `700 13px ${FONT}`;
  const tw = Math.max(250, ctx.measureText(tag).width + 34);
  ctx.fillStyle = '#3a2618';
  ctx.strokeStyle = '#e0526e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -46, tw, 92, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(62,90,154,0.8)'; // a string of the caravan's blue beads along its top
  for (let i = 0; i < 9; i++) circle(ctx, -tw / 2 + 20 + i * ((tw - 40) / 8), -46, 2.4);
  text(ctx, LONG_DEN_NAME, 0, -26, 17, '#fff0d8');
  ctx.fillStyle = '#e0526e';
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 12, -10, tw - 24, 20, 10);
  ctx.fill();
  text(ctx, tag, 0, 0, 13, '#ffffff');
  const enough = n >= FINAL_MIN_PLAYERS;
  text(ctx, `${n} here, ${FINAL_MIN_PLAYERS}+ recommended`, 0, 28, 14, enough ? '#d8f4c8' : '#f4d0da');
  ctx.restore();
}

// In front of the slimes (screen space): the dusk deepening at the edges and his line
let vignette = null;
export function drawShellRoadFront(ctx, camX, viewW, time, me) {
  const k = shellDepth(me?.x ?? 0);
  if (!vignette || vignette.ctx !== ctx) {
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 160, W / 2, H * 0.55, W * 0.75);
    g.addColorStop(0, 'rgba(30,16,20,0)');
    g.addColorStop(1, 'rgba(30,16,20,1)');
    vignette = { ctx, g };
  }
  ctx.save();
  ctx.translate(camX, 0);
  ctx.globalAlpha = 0.2 + 0.3 * k;
  ctx.fillStyle = vignette.g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  drawSays(ctx, me ? me.x - camX : W / 2, time);
  ctx.restore();
}
function drawSays(ctx, sx, time) {
  if (!says) return;
  const life = 7, age = time - says.at;
  if (age > life || age < 0) return void (says = null);
  ctx.save();
  ctx.globalAlpha = clamp(Math.min(age * 1.2, life - age), 0, 1);
  ctx.font = `700 15px ${FONT}`;
  const w = ctx.measureText(says.text).width + 30, h = 34;
  const x = clamp(sx + 100 - w / 2, 16, W - w - 16), y = 110;
  ctx.fillStyle = 'rgba(30,18,12,0.94)';
  ctx.strokeStyle = 'rgba(255,214,170,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, says.text, x + w / 2, y + h / 2 + 1, 15, '#fff0d8');
  ctx.restore();
}
