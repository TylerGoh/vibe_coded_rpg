// Docs: docs/places/undercroft.md
// The Spoke (room SPOKE, data in src/shared/rpg.js): the approach to the Escapement's den. No mobs and no combat;
// everything that makes it what it is is drawn here (and heard: the `spoke` music scene, given spokeDepth by src/main.js),
// never step() and never a cutscene. A walk down one of the Wheel's spokes toward its hub: a beam of black iron as wide as
// a road over the dark, rivets in rows, the other spokes going off round you into the black like an umbrella's ribs. How
// far east YOU are (spokeDepth: 0 at the way in, 1 at the den's door) sets everything:
// - the hub comes up ahead, and under it, through the teeth, the Escapement's shape: the anchor hanging off the hub and the
//   pendulum swinging under it, bigger at every step, the shard's pale light swinging with it;
// - the tick (tickAt) gets slower and heavier the nearer you are; on each one the spoke trembles and the light jumps;
// - the spokes either side draw in toward you, and behind you the rim's teeth close over the way back (art only: the door
//   back always works).
// At the east end the Catch's door: a round iron door in the hub's casing, its edge geared like a wheel, shuddering on
// every tick and holding (until the den is there: CATCH_DOOR_OPEN, C6 (c); then it rolls aside by itself as you come near),
// with a sign beside it: both levels (finalTag) and a live count of slimes on the Spoke. Its one line (ESC_LINE, sent by
// the server: say) is a bubble out of the dark ahead.
import { W, H, TAU, mulberry32, circle, clamp } from './util.js';
import { SPOKE_EXIT_X, ESC_DEN_X, CATCH_DEN, CATCH_DEN_NAME, CITADEL_TOP, FINAL_MIN_PLAYERS, finalTag, FIELD_GROUND, DENS } from './shared/rpg.js';
import { glow as softGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
const IRON = '#3a3644', IRON_D = '#1a1822', IRON_L = '#5e5a6e';
const BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const BRONZE = '#8a6a3a';
const AETHER = '150,240,234';
// the door rolls aside only once the den has its DENS row (C6 (c)); without it, it shudders on every tick and holds
const CATCH_DOOR_OPEN = DENS.some((d) => d.room === CATCH_DEN);

// 0 at the way in, 1 at the den's door: how far along the spoke a slime at x is
export const spokeDepth = (x) => clamp((x - 260) / (ESC_DEN_X - 460), 0, 1);

function text(ctx, str, x, y, size, color, align = 'center', weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// The tick: slower the deeper you are (TICK_NEAR at the door, TICK_FAR at the way in). Its phase is kept going smoothly as
// the period stretches, so it never jumps
const TICK_FAR = 1.1, TICK_NEAR = 2.6;
let tickPh = 0, lastT = null, jolt = 0, swingPh = 0;
// the pendulum's swing seen through the teeth: one full swing every two ticks, like a clock's
function advance(time, k) {
  const dt = lastT === null ? 0 : clamp(time - lastT, 0, 0.1);
  lastT = time;
  const per = TICK_FAR + (TICK_NEAR - TICK_FAR) * smooth(k);
  const before = tickPh;
  tickPh += dt / per;
  swingPh += dt / per / 2;
  if (Math.floor(tickPh) !== Math.floor(before)) jolt = 1;
  jolt = Math.max(0, jolt - dt * 3);
}

const R0 = mulberry32(9501);
const RIVETS = Array.from({ length: 60 }, () => ({ x: 120 + R0() * (ESC_DEN_X - 100), y: R0() }));
const MOTES = Array.from({ length: 30 }, () => ({ x: R0() * W, ph: R0(), v: 0.02 + R0() * 0.04, s: 0.8 + R0() }));

let says = null; // its line: { text, at }
export function say(text, time) {
  says = { text, at: time };
}

// Everything behind the slimes. me: our own state (null when offline), here: slimes in the room (us included)
export function drawSpoke(ctx, camX, viewW, time, me, here) {
  const mx = me?.x ?? 0, k = spokeDepth(mx);
  advance(time, k);
  const near = smooth(clamp((mx - (ESC_DEN_X - 520)) / 360, 0, 1));
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.translate(camX, jolt * 1.5);
  drawBack(ctx, k);
  drawSpokes(ctx, k);
  drawEscapement(ctx, k, time);
  ctx.restore();
  drawBeam(ctx, L, R, k);
  drawDoor(ctx, near, time);
  if (Math.abs(ESC_DEN_X - 260 - camX - viewW / 2) < viewW / 2 + 160) drawSign(ctx, ESC_DEN_X - 260, here, time);
  if (SPOKE_EXIT_X + 360 > L) glow(ctx, SPOKE_EXIT_X, GROUND - 80, 110, 100, AETHER, 0.12 * (1 - smooth(k * 1.5))); // the way back, the Undercroft's light
}

// The dark round the spoke: black, a little blue far below where the aether leaks, and the hub ahead (screen space)
function drawBack(ctx, k) {
  ctx.fillStyle = '#040406';
  ctx.fillRect(0, 0, W, H);
  glow(ctx, W / 2, H, W * 0.8, 180, AETHER, 0.05 + 0.04 * k);
}
// where the hub is on screen: off to the right at first, then up ahead and nearer
const hubAt = (k) => ({ x: W * (1.1 - 0.42 * smooth(k)), y: 150 - 20 * k, r: 70 + 200 * smooth(k) });

// The other spokes, going off round you into the dark from the hub, nearer the deeper you go (closing in)
function drawSpokes(ctx, k) {
  const hub = hubAt(k);
  ctx.lineCap = 'butt';
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.55 + i * 0.12) + (i % 2 ? 0.02 : -0.02); // fanning out behind and below the hub to the west
    const len = 1400, w0 = 14 + 26 * smooth(k);
    const ex = hub.x + Math.cos(a) * len, ey = hub.y + Math.sin(a) * len * 0.6;
    ctx.strokeStyle = i % 2 ? '#0e0c14' : '#121018';
    ctx.lineWidth = w0 + 30 * Math.abs(Math.sin(a));
    ctx.beginPath();
    ctx.moveTo(hub.x, hub.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${AETHER},${0.05 + 0.05 * k})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // two near spokes, either side of yours, drawing in as you go
  const inK = smooth(k);
  for (const d of [-1, 1]) {
    const y0 = d < 0 ? 40 + 60 * inK : H - 20 - 40 * inK;
    ctx.fillStyle = '#0c0a12';
    ctx.beginPath();
    ctx.moveTo(-40, y0 - 30);
    ctx.lineTo(hub.x, hub.y - 10);
    ctx.lineTo(hub.x, hub.y + 10);
    ctx.lineTo(-40, y0 + 30);
    ctx.closePath();
    ctx.fill();
  }
}

// The Escapement seen through the teeth under the hub: the hub's drum, the anchor hanging off it with its pallets biting
// two teeth of the escape wheel, and the pendulum swinging under it on its crutch, the shard's light in the arbor. A
// silhouette: it's only ever met in the Catch
function drawEscapement(ctx, k, time) {
  const hub = hubAt(k), s = hub.r / 100, sh = smooth((k - 0.05) / 0.4);
  // the escape wheel behind it: a ring of teeth round the hub
  ctx.fillStyle = '#0a0a10';
  circle(ctx, hub.x, hub.y, hub.r * 1.25);
  ctx.fillStyle = '#100e16';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    ctx.save();
    ctx.translate(hub.x + Math.cos(a) * hub.r * 1.25, hub.y + Math.sin(a) * hub.r * 1.25);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillRect(-10 * s, -18 * s, 20 * s, 22 * s);
    ctx.restore();
  }
  ctx.fillStyle = '#16141e'; // the hub's drum
  circle(ctx, hub.x, hub.y, hub.r);
  ctx.strokeStyle = 'rgba(138,90,46,0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, hub.r, 0, TAU);
  ctx.stroke();
  if (sh < 0.01) return;
  // the anchor: a broad arch below the hub, its two pallets hooked into the teeth
  const ax = hub.x, ay = hub.y + hub.r * 0.9;
  const sw = Math.sin(swingPh * TAU) * 0.28 * (0.3 + 0.7 * k);
  ctx.save();
  ctx.globalAlpha = sh;
  ctx.translate(ax, ay);
  ctx.fillStyle = '#1e1a24';
  ctx.beginPath();
  ctx.moveTo(-120 * s, -30 * s);
  ctx.quadraticCurveTo(0, 50 * s, 120 * s, -30 * s);
  ctx.lineTo(100 * s, -60 * s);
  ctx.quadraticCurveTo(0, 10 * s, -100 * s, -60 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(138,90,46,${0.45 * sh})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = `rgba(253,227,160,${0.35 * sh})`; // the pallets' bright bite
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(d * 100 * s, -60 * s);
    ctx.lineTo(d * 120 * s, -30 * s);
    ctx.lineTo(d * 112 * s, -70 * s);
    ctx.closePath();
    ctx.fill();
  }
  // the crutch and the bob, swinging under the arbor
  ctx.save();
  ctx.rotate(sw);
  ctx.fillStyle = '#1a1820';
  ctx.fillRect(-5 * s, 0, 10 * s, 260 * s);
  ctx.fillStyle = '#241e1a';
  ctx.beginPath();
  ctx.ellipse(0, 290 * s, 56 * s, 40 * s, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(138,106,58,${0.5 * sh})`; // bell bronze, catching the shard
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  // the shard in the arbor, its light swinging with the bob
  const p = 0.6 + 0.4 * jolt;
  glow(ctx, 0, 0, 60 * s, 60 * s, AETHER, (0.3 + 0.4 * k) * p);
  ctx.fillStyle = `rgba(220,255,250,${0.8 * p})`;
  ctx.beginPath();
  ctx.moveTo(0, -10 * s);
  ctx.lineTo(6 * s, 0);
  ctx.lineTo(0, 10 * s);
  ctx.lineTo(-6 * s, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The spoke you're walking: a beam of black iron as wide as a road, its top face the floor, its side going down into the
// dark under you, rivets in rows
function drawBeam(ctx, L, R, k) {
  ctx.fillStyle = IRON;
  ctx.fillRect(L, GROUND, R - L, 18);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(L, GROUND + 18, R - L, H - GROUND);
  ctx.fillStyle = 'rgba(253,227,160,0.08)';
  ctx.fillRect(L, GROUND, R - L, 2);
  ctx.strokeStyle = 'rgba(8,8,12,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = Math.floor(L / 160) * 160; x < R; x += 160) {
    ctx.moveTo(x, GROUND + 2);
    ctx.lineTo(x, GROUND + 18);
  }
  ctx.stroke();
  ctx.fillStyle = IRON_L;
  for (const r of RIVETS) if (r.x > L && r.x < R) circle(ctx, r.x, GROUND + 6 + r.y * 8, 1.6);
  ctx.fillStyle = 'rgba(94,90,110,0.35)'; // the side's rivet rows
  for (let x = Math.floor(L / 40) * 40; x < R; x += 40) {
    circle(ctx, x, GROUND + 30, 1.6);
    circle(ctx, x + 20, GROUND + 64, 1.6);
  }
  glow(ctx, (L + R) / 2, H, (R - L) * 0.6, 60, AETHER, 0.05 + 0.05 * k);
}

// The Catch's door at the end of the spoke: a round iron door set in the hub's casing, its edge geared like a wheel, a
// heavy boss at its middle. Until the den is there it shudders on every tick and holds. With the den (CATCH_DOOR_OPEN) it
// rolls aside along its track by itself as you come near (near: 0..1), the shard's light coming through
function drawDoor(ctx, near, time) {
  const x = ESC_DEN_X, cy = GROUND - 130, r = 120;
  // the casing round it
  ctx.fillStyle = '#16141e';
  ctx.fillRect(x - r - 60, 40, r * 2 + 120, GROUND - 40);
  ctx.fillStyle = 'rgba(94,90,110,0.5)';
  for (let y = 60; y < GROUND; y += 34) {
    circle(ctx, x - r - 40, y, 2);
    circle(ctx, x + r + 40, y, 2);
  }
  ctx.fillStyle = '#060608';
  circle(ctx, x, cy, r + 6);
  const open = CATCH_DOOR_OPEN ? near : 0;
  glow(ctx, x, cy, r * 1.1, r * 1.1, AETHER, CATCH_DOOR_OPEN ? 0.12 + 0.4 * open : 0.08 + 0.12 * jolt);
  // the door, rolled aside along its track as it opens
  const dx = x + open * (r * 2 + 40), shake = CATCH_DOOR_OPEN ? 0 : jolt * 2.4;
  ctx.save();
  ctx.translate(dx + shake, cy);
  ctx.rotate(open * 2.4 + (CATCH_DOOR_OPEN ? 0 : jolt * 0.02));
  ctx.fillStyle = IRON;
  for (let i = 0; i < 28; i++) { // the geared edge
    const a = (i / 28) * TAU;
    ctx.save();
    ctx.rotate(a);
    ctx.fillRect(-8, -r - 8, 16, 14);
    ctx.restore();
  }
  ctx.fillStyle = '#2a2632';
  circle(ctx, 0, 0, r);
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r - 2, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(14,12,18,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30);
    ctx.lineTo(Math.cos(a) * (r - 10), Math.sin(a) * (r - 10));
  }
  ctx.stroke();
  ctx.fillStyle = IRON_D; // the boss
  circle(ctx, 0, 0, 30);
  ctx.fillStyle = BRASS_D;
  circle(ctx, 0, 0, 12);
  ctx.fillStyle = 'rgba(94,90,110,0.7)';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    circle(ctx, Math.cos(a) * (r - 22), Math.sin(a) * (r - 22), 2);
  }
  ctx.restore();
  // the track it rolls on
  ctx.fillStyle = BRONZE;
  ctx.fillRect(x - r, GROUND - 6, r * 4 + 40, 4);
  if (!CATCH_DOOR_OPEN && jolt > 0.4) { // dust shaken off the casing on the tick
    ctx.fillStyle = `rgba(200,190,170,${0.4 * jolt})`;
    for (let i = 0; i < 8; i++) ctx.fillRect(x - r + ((i * 31 + time * 20) % (r * 2)), cy - r - 10 + ((i * 17 + time * 60) % (r * 2)), 1.6, 1.6);
  }
}

// The sign by the door: the den's name, both levels (finalTag) and a live count of slimes here. A count, never a lock
function drawSign(ctx, x, here, time) {
  ctx.fillStyle = IRON_D;
  ctx.beginPath();
  ctx.roundRect(x - 5, GROUND - 110, 10, 112, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 120 + jolt);
  ctx.rotate(Math.sin(time * 0.5) * 0.006);
  const tag = finalTag(CITADEL_TOP), n = here | 0;
  ctx.font = `700 13px ${FONT}`;
  const tw = Math.max(250, ctx.measureText(tag).width + 34);
  ctx.fillStyle = '#1e1c26';
  ctx.strokeStyle = '#e0526e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -46, tw, 92, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(138,90,46,0.6)'; // a brass strip riveted along its top
  ctx.fillRect(-tw / 2 + 14, -47, tw - 28, 2);
  text(ctx, CATCH_DEN_NAME, 0, -26, 17, '#e8f6f4');
  ctx.fillStyle = '#e0526e';
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 12, -10, tw - 24, 20, 10);
  ctx.fill();
  text(ctx, tag, 0, 0, 13, '#ffffff');
  const enough = n >= FINAL_MIN_PLAYERS;
  text(ctx, `${n} here, ${FINAL_MIN_PLAYERS}+ recommended`, 0, 28, 14, enough ? '#c8f4ee' : '#f4d0da');
  ctx.restore();
}

// Over the slimes: the dark at the edges, heavier going in; aether motes rising; the rim's teeth closing over the way back
// behind you (art only); its line. The vignette is baked once and drawn with globalAlpha (docs/performance.md)
let vignette = null;
export function drawSpokeFront(ctx, camX, viewW, time, me) {
  const k = spokeDepth(me?.x ?? 0);
  if (!vignette || vignette.ctx !== ctx) {
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 120, W / 2, H * 0.55, W * 0.7);
    g.addColorStop(0, 'rgba(4,4,8,0)');
    g.addColorStop(1, 'rgba(4,4,8,1)');
    vignette = { ctx, g };
  }
  ctx.save();
  ctx.translate(camX, 0);
  ctx.globalAlpha = 0.45 + 0.3 * k;
  ctx.fillStyle = vignette.g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  for (const m of MOTES) {
    const x = ((m.x - camX * 0.3) % W + W) % W, y = GROUND - ((m.ph + time * m.v) % 1) * (GROUND - 30);
    ctx.fillStyle = `rgba(${AETHER},${0.2 + 0.15 * Math.sin(time * 2 + m.ph * 7)})`;
    circle(ctx, x, y, m.s);
  }
  // the rim's teeth closing over the way back: dark teeth coming in from the left edge, top and bottom
  const hk = smooth((k - 0.1) / 0.6);
  if (hk > 0.01) {
    ctx.fillStyle = `rgba(14,12,20,${0.9 * hk})`;
    for (let i = 0; i < 6; i++) {
      const y = 30 + i * 80, len = (60 + (i % 2) * 40) * hk + 20 * hk;
      ctx.beginPath();
      ctx.moveTo(0, y - 26);
      ctx.lineTo(len, y - 10);
      ctx.quadraticCurveTo(len + 14, y, len, y + 10);
      ctx.lineTo(0, y + 26);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = `rgba(4,4,6,${0.5 * hk})`;
    ctx.fillRect(0, 0, 30 * hk, H);
  }
  drawSays(ctx, me ? me.x - camX : W / 2, time);
  ctx.restore();
}
// Its line: a dark iron bubble with pale aether writing, out of the dark ahead (screen space)
function drawSays(ctx, sx, time) {
  if (!says) return;
  const life = 7, age = time - says.at;
  if (age > life || age < 0) return void (says = null);
  ctx.save();
  ctx.globalAlpha = clamp(Math.min(age * 1.2, life - age), 0, 1);
  ctx.font = `700 15px ${FONT}`;
  const w = ctx.measureText(says.text).width + 30, h = 34;
  const x = clamp(sx + 100 - w / 2, 16, W - w - 16), y = 120;
  ctx.fillStyle = 'rgba(14,14,20,0.94)';
  ctx.strokeStyle = 'rgba(150,240,234,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, says.text, x + w / 2, y + h / 2 + 1, 15, '#d8f8f4');
  ctx.restore();
}
