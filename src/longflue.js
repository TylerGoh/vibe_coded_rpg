// Docs: docs/places/underflues.md
// The Long Flue (room LONGFLUE, data in src/shared/rpg.js): the approach to Typhon's den. No mobs and no combat;
// everything that makes it frightening is drawn here (and heard: the `longflue` music scene, given flueDepth by
// src/main.js), never step() and never a cutscene. A sloping brick flue going down into the heat, landing by landing
// (the floor you walk is each landing; the flight you came down is drawn in the wall behind you), walked on an iron
// grating over the drop. How far east YOU are (flueDepth: 0 at the way in, 1 at the den's door) sets everything: under
// the grating, first only a glow, then a coil sliding past, then the curve of a back, and at the last landing (past
// EYES_X) four eyes opening under your feet and following you. It breathes (BREATH_S): with every breath the glow under
// the grating brightens and the heat-haze pulses, and between breaths it's nearly dark. The roof comes down, the soot
// comes down thicker, and haze closes in behind you over the way back (art only: the door back always works). At the
// east end the den's furnace door: iron, red-hot at the seams, banging in its frame with every breath and holding
// (until the den is there: TYPHON_DOOR_OPEN, then it swings open by itself on a gust of heat as you come near), with a
// sign beside it: both levels (finalTag) and a live count of slimes in the flue. Typhon's one line (TYPHON_LINE, sent
// by the server: say) is a bubble out of the heat below.
import { W, H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { LONGFLUE_W, LONGFLUE_EXIT_X, TYPHON_DEN_X, TYPHON_DEN, TYPHON_DEN_NAME, EMBER_TOP, FINAL_MIN_PLAYERS, finalTag, FIELD_GROUND, DENS } from './shared/rpg.js';
import { glow as softGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
const BRICK = '#4a2a24', BRICK_D = '#1e0e0c', BRICK_L = '#6e3e32';
const IRON = '#5a5460', IRON_D = '#2a2630';
// the door opens only once E5 (c) gives the den its DENS row; until then it bangs with every breath and holds
const TYPHON_DOOR_OPEN = DENS.some((d) => d.room === TYPHON_DEN);

// 0 at the way in, 1 at the den's door: how deep down the flue a slime at x is
export const flueDepth = (x) => clamp((x - 260) / (TYPHON_DEN_X - 460), 0, 1);

function text(ctx, str, x, y, size, color, align = 'center', weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function mixc(a, b, k, al = 1) {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * k));
  return al === 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${al})`;
}

// ——— seeded scenery ———
const R0 = mulberry32(6401);
const LANDING_W = 330; // one landing of the flue: a flight of grating down, then a landing
const LANDINGS = Array.from({ length: Math.floor((TYPHON_DEN_X - 300) / LANDING_W) }, (_, i) => 300 + i * LANDING_W);
const BREATH_S = 6.5; // one breath, in and out
// how far into a breath out it is: 0 between breaths (nearly dark), 1 at the top of one (the glow up, the haze, the door)
export const breathOut = (time) => {
  const c = (time % BREATH_S) / BREATH_S;
  return c < 0.45 ? 0 : Math.sin(((c - 0.45) / 0.55) * Math.PI);
};
// the eyes: under the last landing, two pairs, opening as you come over them
const EYES_X = TYPHON_DEN_X - 420;
// the curve of its back, under the middle of the way down
const BACK_X = 1500;
const soot = Array.from({ length: 70 }, () => ({ x: R0() * W, y: R0() * 430, v: 10 + R0() * 16, p: R0() * TAU, s: 1 + R0() * 1.6, k: R0() }));
const haze = Array.from({ length: 10 }, (_, i) => ({ x: 40 + i * 92 + R0() * 40, p: R0() * TAU, h: 60 + R0() * 80 }));

let lastT = null, eyeOpen = 0, nearK = 0;
let says = null; // Typhon's line: { text, at }
export function say(text, time) {
  says = { text, at: time };
}

// Everything behind the slimes. me: our own state (null when offline), here: slimes in the room (us included)
export function drawLongFlue(ctx, camX, viewW, time, me, here) {
  const mx = me?.x ?? 0, k = flueDepth(mx), dt = lastT === null ? 0 : clamp(time - lastT, 0, 0.1), b = breathOut(time);
  lastT = time;
  eyeOpen += ((mx > EYES_X - 140 ? 1 : 0) - eyeOpen) * Math.min(1, dt * 0.7);
  nearK += (smooth(clamp((mx - (TYPHON_DEN_X - 520)) / 360, 0, 1)) - nearK) * Math.min(1, dt * 1.5);
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.translate(camX, 0);
  drawBack(ctx, k, b);
  ctx.restore();
  drawWall(ctx, L, R, k);
  for (const x of LANDINGS) if (x + 40 > L && x - 240 < R) drawFlight(ctx, x, k);
  drawRoof(ctx, L, R, k);
  drawDoor(ctx, nearK, b, time);
  if (Math.abs(TYPHON_DEN_X - 260 - camX - viewW / 2) < viewW / 2 + 160) drawSign(ctx, TYPHON_DEN_X - 260, here, time);
  drawBelow(ctx, camX, L, R, k, b, time, me ? me.x : camX + W / 2);
  drawGrating(ctx, Math.max(0, L), Math.min(LONGFLUE_W, R), k, b);
  if (LONGFLUE_EXIT_X + 360 > L) drawWayUp(ctx, k, time);
}

// The flue's far end, a dark brick throat, warm at the way in and black-red near the den
function drawBack(ctx, k, b) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, mixc([14, 6, 6], [4, 1, 1], k));
  g.addColorStop(1, mixc([42, 16, 12], [30, 6, 4], k, 1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // heat coming up from under everything, with each breath
  glow(ctx, W / 2, GROUND + 40, W * 0.8, 160, '255,80,30', 0.08 + 0.1 * k + 0.16 * b * (0.3 + k));
}

// The flue's brick wall: courses of soot-black brick, a seam glowing here and there
function drawWall(ctx, L, R, k) {
  const top = 70 + 120 * smooth(k);
  ctx.fillStyle = BRICK_D;
  ctx.fillRect(L, top - 20, R - L, GROUND - top + 20);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = Math.floor(top / 16) * 16; y < GROUND; y += 16) {
    ctx.moveTo(L, y);
    ctx.lineTo(R, y);
    const off = (y / 16) % 2 ? 0 : 20;
    for (let x = Math.floor(L / 40) * 40 + off; x < R; x += 40) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 16);
    }
  }
  ctx.stroke();
}

// The flight down to each landing: a strip of grating sloping down in the wall behind you, its handrail chain, and
// a stoker's hook where a lamp hung once (the lamps are all gone)
function drawFlight(ctx, x, k) {
  const y0 = GROUND - 150, y1 = GROUND - 10;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.moveTo(x - 230, y0);
  ctx.lineTo(x - 20, y1);
  ctx.lineTo(x - 20, y1 + 10);
  ctx.lineTo(x - 230, y0 + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 230, y0);
  ctx.lineTo(x - 20, y1);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,84,96,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const u = i / 10, px = x - 230 + 210 * u, py = y0 + (y1 - y0) * u;
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + 9);
  }
  // the handrail: posts and a sagging chain
  for (let i = 0; i <= 3; i++) {
    const u = i / 3, px = x - 230 + 210 * u, py = y0 + (y1 - y0) * u;
    ctx.moveTo(px, py);
    ctx.lineTo(px, py - 34);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(70,64,74,0.7)';
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const u0 = i / 3, u1 = (i + 1) / 3;
    const ax = x - 230 + 210 * u0, ay = y0 + (y1 - y0) * u0 - 34, bx = x - 230 + 210 * u1, by = y0 + (y1 - y0) * u1 - 34;
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + 10, bx, by);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // the empty lamp hook
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x + 60, GROUND - 200 + 40 * k);
  ctx.lineTo(x + 76, GROUND - 200 + 40 * k);
  ctx.lineTo(x + 76, GROUND - 188 + 40 * k);
  ctx.stroke();
}

// The roof: the flue's brick vault, coming down the deeper you go, soot hanging off it
function drawRoof(ctx, L, R, k) {
  const y = 50 + 130 * smooth(k);
  ctx.fillStyle = '#060202';
  ctx.beginPath();
  ctx.moveTo(L, 0);
  ctx.lineTo(L, y);
  for (let x = Math.floor(L / 120) * 120; x <= R + 120; x += 120) ctx.quadraticCurveTo(x + 60, y + 18, x + 120, y);
  ctx.lineTo(R + 120, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = BRICK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let x = Math.floor(L / 120) * 120; x <= R + 120; x += 120) {
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 60, y + 18, x + 120, y);
  }
  ctx.stroke();
  // soot hanging in strings off the vault
  ctx.strokeStyle = 'rgba(10,6,6,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = Math.floor(L / 37) * 37; x < R; x += 37) {
    const len = 6 + ((x * 7) % 19) * (0.5 + k);
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x + 2, y + 8 + len);
  }
  ctx.stroke();
}

// Under the grating: the drop, and what's in it. First only the glow; then (past a fifth of the way) a coil sliding
// past; then (past half) the curve of a back, plates along it, rising almost to the grating; and at the last landing
// four eyes opening under your feet, following you. Every breath the glow comes up and the shapes show; between
// breaths it's nearly dark
function drawBelow(ctx, camX, L, R, k, b, time, meX) {
  const top = GROUND + 8;
  ctx.save();
  ctx.beginPath();
  ctx.rect(L, top, R - L, H - top + 10);
  ctx.clip();
  ctx.fillStyle = '#050101';
  ctx.fillRect(L, top, R - L, H - top + 10);
  const light = 0.25 + 0.75 * b;
  glow(ctx, camX + W / 2, H + 30, W * 0.7, 120, '255,90,30', (0.25 + 0.35 * k) * light);
  // the coil: a long dark body sliding slowly east to west under you, basalt scales with the fire in the cracks
  const coil = smooth((k - 0.18) / 0.25);
  if (coil > 0.01) {
    const off = (time * 26) % 300, base = H - 6;
    ctx.fillStyle = `rgba(14,8,8,${0.95 * coil})`;
    ctx.beginPath();
    ctx.moveTo(L, H + 10);
    for (let x = L; x <= R + 20; x += 20) ctx.lineTo(x, base - 26 - Math.sin((x + off) * 0.012) * 14);
    ctx.lineTo(R + 20, H + 10);
    ctx.closePath();
    ctx.fill();
    // scales, catching the glow when it breathes
    ctx.strokeStyle = `rgba(255,${100 + 60 * b},40,${0.45 * coil * light})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let x = Math.floor((L - off) / 30) * 30 + off; x < R; x += 30) {
      const y = base - 20 - Math.sin((x + off) * 0.012) * 14;
      ctx.moveTo(x - 10, y + 4);
      ctx.quadraticCurveTo(x, y - 6, x + 10, y + 4);
    }
    ctx.stroke();
  }
  // the curve of a back: a great dark arch rising almost to the grating, ridged with plates, breathing
  const back = smooth((k - 0.45) / 0.25);
  if (back > 0.01) {
    const cx = BACK_X + (camX + W / 2 - BACK_X) * 0.4, rise = 34 + 6 * b; // (deeper down: it drifts by slower than the grating)
    ctx.fillStyle = `rgba(8,4,4,${0.97 * back})`;
    ctx.beginPath();
    ctx.ellipse(cx, H + 20, 520, rise + 40, 0, Math.PI, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,120,50,${0.5 * back * light})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, H + 20, 520, rise + 40, 0, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    ctx.fillStyle = `rgba(30,18,16,${back})`;
    for (let i = -6; i <= 6; i++) {
      const a = Math.PI * 1.5 + i * 0.12, px = cx + Math.cos(a) * 520, py = H + 20 + Math.sin(a) * (rise + 40);
      ctx.beginPath();
      ctx.moveTo(px - 12, py + 4);
      ctx.lineTo(px, py - 12);
      ctx.lineTo(px + 12, py + 4);
      ctx.closePath();
      ctx.fill();
    }
  }
  // the eyes: two pairs under the last landing, opening as you come over them, turning to follow you
  if (eyeOpen > 0.02) {
    for (const [ex, ey, s] of [[EYES_X - 70, H - 30, 1], [EYES_X + 70, H - 30, 1], [EYES_X - 190, H - 12, 0.75], [EYES_X + 190, H - 12, 0.75]]) {
      if (ex < L - 60 || ex > R + 60) continue;
      const look = clamp((meX - ex) / 300, -1, 1), o = eyeOpen * (0.7 + 0.3 * b);
      glow(ctx, ex, ey, 70 * s, 34 * s, '255,140,40', 0.5 * o);
      ctx.fillStyle = '#ffcc60';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 28 * s, Math.max(0.5, 10 * s * o), 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#120404';
      ctx.beginPath();
      ctx.ellipse(ex + look * 12 * s, ey, 3 * s, Math.max(0.3, 9 * s * o), 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#080202';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 30 * s, Math.max(0.5, 11 * s * o), 0, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// The grating you walk on: iron bars over the drop, lit from underneath with each breath; its edge and the heat-haze
// coming up through it
function drawGrating(ctx, L, R, k, b) {
  ctx.fillStyle = IRON_D;
  ctx.fillRect(L, GROUND - 2, R - L, 4);
  ctx.fillRect(L, GROUND + 8, R - L, 3);
  const hot = 0.15 + 0.5 * b * (0.4 + k);
  ctx.fillStyle = mixc([70, 64, 72], [200, 90, 50], hot);
  for (let x = Math.floor(L / 9) * 9; x < R; x += 9) ctx.fillRect(x, GROUND + 1, 3.5, 8);
  ctx.fillStyle = `rgba(255,150,80,${0.25 * hot})`;
  ctx.fillRect(L, GROUND - 2, R - L, 1.5);
  // the girders under it, every landing
  ctx.fillStyle = '#1a1416';
  for (let x = Math.floor(L / LANDING_W) * LANDING_W + 300; x < R; x += LANDING_W) ctx.fillRect(x - 6, GROUND + 11, 12, H - GROUND);
}

// The way back up: the Under-Flues' warmth at the top of the flue, hidden by haze the deeper you are (art only)
function drawWayUp(ctx, k, time) {
  glow(ctx, LONGFLUE_EXIT_X, GROUND - 90, 120, 110, '255,150,90', 0.22 * (1 - smooth(k * 1.5)));
}

// The furnace door at the foot of the flue: a great round-topped iron door in a brick arch, riveted, red-hot at its
// seams. Until the den is there it bangs in its frame with every breath (a jolt, the seams flaring, sparks and smoke
// puffing out round it) and holds. With the den (TYPHON_DOOR_OPEN) it swings open by itself on a gust of heat as you
// come near (near: 0..1)
function drawDoor(ctx, near, b, time) {
  const x = TYPHON_DEN_X, top = GROUND - 250;
  const arch = (pad) => {
    ctx.beginPath();
    ctx.moveTo(x - 100 - pad, GROUND + 2);
    ctx.lineTo(x - 100 - pad, top + 90);
    ctx.quadraticCurveTo(x, top - 40 - pad, x + 100 + pad, top + 90);
    ctx.lineTo(x + 100 + pad, GROUND + 2);
    ctx.closePath();
  };
  // the brick arch round it
  ctx.fillStyle = BRICK;
  arch(28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,8,6,0.6)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = '#0a0202';
  arch(0);
  ctx.fill();
  const open = TYPHON_DOOR_OPEN ? near : 0;
  // the hearth's light behind it
  glow(ctx, x, GROUND - 100, 150, 140, '255,110,40', (TYPHON_DOOR_OPEN ? 0.2 + 0.4 * open : 0.08) + 0.1 * b);
  // the door: swings on its left hinge (drawn narrowing toward the hinge as it opens)
  const bang = TYPHON_DOOR_OPEN ? 0 : b > 0.8 ? Math.sin(time * 40) * 2.2 * (b - 0.8) * 5 : 0;
  ctx.save();
  ctx.translate(x - 96 + bang, 0);
  ctx.scale(1 - 0.85 * open, 1);
  const dw = 192;
  ctx.beginPath();
  ctx.moveTo(0, GROUND);
  ctx.lineTo(0, top + 92);
  ctx.quadraticCurveTo(dw / 2, top - 36, dw, top + 92);
  ctx.lineTo(dw, GROUND);
  ctx.closePath();
  ctx.fillStyle = mixc([58, 52, 60], [120, 60, 44], 0.3 + 0.4 * b);
  ctx.fill();
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 4;
  ctx.stroke();
  // its plates and rivets
  ctx.strokeStyle = 'rgba(20,16,20,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const y of [top + 110, top + 170, top + 230]) {
    ctx.moveTo(6, y);
    ctx.lineTo(dw - 6, y);
  }
  ctx.moveTo(dw / 2, top + 30);
  ctx.lineTo(dw / 2, GROUND);
  ctx.stroke();
  ctx.fillStyle = '#8a8490';
  for (const y of [top + 110, top + 170, top + 230]) for (let px = 14; px < dw - 6; px += 22) circle(ctx, px, y - 6, 1.8);
  // the great latch bar across it
  ctx.fillStyle = IRON_D;
  ctx.fillRect(14, GROUND - 120, dw - 28, 12);
  ctx.fillStyle = IRON;
  ctx.fillRect(14, GROUND - 120, dw - 28, 3);
  ctx.restore();
  if (open < 0.9) {
    // the seams round it, red-hot, flaring with each breath
    ctx.strokeStyle = `rgba(255,${120 + 80 * b},50,${0.45 + 0.45 * b})`;
    ctx.lineWidth = 2.5;
    arch(-2);
    ctx.stroke();
    if (b > 0.55) {
      // sparks and smoke puffed out round the frame
      const p = (b - 0.55) / 0.45;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI, sx = x + Math.cos(Math.PI + a) * 104, sy = top + 90 + Math.sin(Math.PI + a) * 110;
        ctx.fillStyle = `rgba(255,${200 - i * 10},100,${0.8 * p})`;
        circle(ctx, sx + Math.cos(Math.PI + a) * p * 14, sy + Math.sin(Math.PI + a) * p * 14, 1.6);
      }
      ctx.fillStyle = `rgba(40,30,30,${0.35 * p})`;
      for (const dx of [-110, 108]) ellipse(ctx, x + dx, GROUND - 40 - p * 30, 14 + p * 16, 10 + p * 10);
    }
  }
  // two iron rings set in the brick either side, for a chain that's gone
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 3;
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + d * 140, GROUND - 150, 7, 0, TAU);
    ctx.stroke();
  }
}

// The sign by the door: the den's name, both levels (finalTag) and a live count of slimes here. A count, never a
// lock: the line says how many are here and how many are recommended, nothing else
function drawSign(ctx, x, here, time) {
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(x - 5, GROUND - 110, 10, 112, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 120);
  ctx.rotate(Math.sin(time * 0.7) * 0.01);
  const tag = finalTag(EMBER_TOP), n = here | 0;
  ctx.font = `700 13px ${FONT}`;
  const tw = Math.max(250, ctx.measureText(tag).width + 34);
  ctx.fillStyle = '#2a1a18';
  ctx.strokeStyle = '#e0526e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -46, tw, 92, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(20,12,12,0.8)'; // soot along its top
  ctx.fillRect(-tw / 2 + 10, -47, tw - 20, 3);
  text(ctx, TYPHON_DEN_NAME, 0, -26, 17, '#fff0e0');
  ctx.fillStyle = '#e0526e';
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 12, -10, tw - 24, 20, 10);
  ctx.fill();
  text(ctx, tag, 0, 0, 13, '#ffffff');
  const enough = n >= FINAL_MIN_PLAYERS;
  text(ctx, `${n} here, ${FINAL_MIN_PLAYERS}+ recommended`, 0, 28, 14, enough ? '#ffe0b0' : '#f4d0da');
  ctx.restore();
}

// Over the slimes: the dark between breaths (deeper the further down), the heat-haze pulsing up with each breath,
// soot coming down thicker the deeper you are, haze closing in behind you, and Typhon's line
export function drawLongFlueFront(ctx, camX, viewW, time, me) {
  const k = flueDepth(me?.x ?? 0), b = breathOut(time);
  ctx.save();
  ctx.translate(camX, 0);
  // nearly dark between breaths
  const dark = (0.15 + 0.45 * k) * (1 - 0.7 * b);
  const g = ctx.createRadialGradient(W / 2, H * 0.62, 100, W / 2, H * 0.62, W * 0.7);
  g.addColorStop(0, `rgba(6,1,0,${dark * 0.4})`);
  g.addColorStop(1, `rgba(6,1,0,${Math.min(0.92, dark + 0.2)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // the heat-haze, pulsing up off the grating with each breath
  if (b > 0.05) {
    ctx.lineWidth = 3;
    for (const hz of haze) {
      const hx = hz.x + Math.sin(time * 1.3 + hz.p) * 10;
      ctx.strokeStyle = `rgba(255,170,110,${0.07 * b * (0.4 + k)})`;
      ctx.beginPath();
      ctx.moveTo(hx, GROUND);
      for (let y = 0; y < hz.h + 80 * b; y += 12) ctx.lineTo(hx + Math.sin(y * 0.09 + time * 4 + hz.p) * 6, GROUND - y);
      ctx.stroke();
    }
  }
  // soot, thicker the deeper
  for (const s of soot) {
    if (s.k > 0.3 + k) continue;
    const x = ((s.x - camX * 0.4 + Math.sin(time * 0.6 + s.p) * 12) % W + W) % W;
    const y = ((s.y + time * s.v) % 450) + 10;
    ctx.fillStyle = `rgba(20,14,14,${0.5 + 0.3 * k})`;
    circle(ctx, x, y, s.s);
  }
  // the haze behind you: smoke and heat closing in over the way back (art only)
  const hk = smooth((k - 0.1) / 0.6);
  if (hk > 0.01) {
    const hg = ctx.createLinearGradient(0, 0, W * 0.45, 0);
    hg.addColorStop(0, `rgba(36,20,16,${0.85 * hk})`);
    hg.addColorStop(1, 'rgba(36,20,16,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W * 0.45, H);
  }
  drawSays(ctx, me ? me.x - camX : W / 2, time);
  ctx.restore();
}
// Typhon's line: a dark bubble with ember writing, rising out of the heat ahead of you (screen space)
function drawSays(ctx, sx, time) {
  if (!says) return;
  const life = 7, age = time - says.at;
  if (age > life || age < 0) return void (says = null);
  ctx.save();
  ctx.globalAlpha = clamp(Math.min(age * 1.2, life - age), 0, 1);
  ctx.font = `700 15px ${FONT}`;
  const w = ctx.measureText(says.text).width + 30, h = 34;
  const x = clamp(sx + 100 - w / 2, 16, W - w - 16), y = 120;
  ctx.fillStyle = 'rgba(14,4,2,0.92)';
  ctx.strokeStyle = 'rgba(255,150,80,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, says.text, x + w / 2, y + h / 2 + 1, 15, '#ffe4c8');
  ctx.restore();
}
