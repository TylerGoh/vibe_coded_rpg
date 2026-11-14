// Docs: docs/places/bellwalks.md
// The Bell Walks (room BELLS, src/shared/rpg.js; the Citadel's depth pass, C4): open galleries round the top of the Chrono
// Spire, up the stair above the Hour Sanctum. Stone arcades open to the sky on the far side, the great bells hanging in
// their frames stopped mid-swing, rain hanging in the air everywhere (every drop stopped, a slow shimmer going through
// them now and then: the only thing that moves), and far below through the clouds the whole archipelago, tiny. West to
// east: the Rain Stair (no mobs: the stair head, the waystone), the Lower Gallery, the Bell Loft and the Crown Walk, where
// the Great Bell's empty frame stands (the bell itself is a field boss, src/bells-art.js). The find (last in
// BELLS_PLATFORMS): the bell-ringers' rope on the loft's top beam, cut, its sally lying beside it.
import { H, W, TAU, mulberry32, circle, ellipse } from './util.js';
import { BELLS_W, FIELD_GROUND, BELLS_PLATFORMS, BELLS_EXIT_X } from './shared/rpg.js';
import { bellPath, bronzeFill, drop, softGlow, BRONZE_D, BRONZE_E } from './bells-art.js';

const GROUND = FIELD_GROUND;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const STONE = '#d8ccd8', STONE_D = '#a898b0', STONE_E = '#6e6280', STONE_L = '#eee6f0';
const OAK = '#5a4232', OAK_D = '#3a2a20';
const ROPE = BELLS_PLATFORMS.find((p) => p.kind === 'rope');

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

// the arcade's arches along the back (world x), the bells in the loft and on the crown walk (stopped mid-swing: each its own
// angle), the islands far below (screen-space, slow parallax), the hanging rain (screen-space layers and world-space)
const ARCH = 300;
const BELLS = [
  { x: 1300, s: 0.7, a: 0.32 }, { x: 2150, s: 1, a: -0.4 }, { x: 2620, s: 0.85, a: 0.22 }, { x: 3050, s: 1.05, a: -0.18 },
  { x: 3700, s: 0.9, a: 0.36 }, { x: 4300, s: 0.75, a: -0.3 },
];
const EMPTY_FRAME_X = 3960; // the Great Bell's frame on the crown walk, empty
const isles = (() => {
  const r = mulberry32(9101);
  return Array.from({ length: 9 }, (_, i) => ({ x: i * 190 + r() * 80, y: 470 + r() * 50, s: 0.4 + r() * 0.7, k: r() }));
})();
const rainFar = (() => {
  const r = mulberry32(9111);
  return Array.from({ length: 140 }, () => ({ x: r() * 1400, y: 20 + r() * 400, s: 0.6 + r() * 0.5 }));
})();
const rainNear = (() => {
  const r = mulberry32(9121);
  return Array.from({ length: 220 }, () => ({ x: r() * BELLS_W, y: 40 + r() * (GROUND - 60), s: 0.9 + r() * 0.7 }));
})();

// Everything in the Bell Walks behind the slimes
export function drawBellWalks(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time);
  ctx.restore();
  const L = camX - 160, R = camX + viewW + 160;
  drawArcade(ctx, L, R, time);
  for (const b of BELLS) if (visible(b.x - 200, b.x + 200, L, R)) drawHangingBell(ctx, b);
  if (visible(EMPTY_FRAME_X - 200, EMPTY_FRAME_X + 200, L, R)) drawEmptyFrame(ctx, EMPTY_FRAME_X);
  drawFloor(ctx, L, R);
  if (visible(-60, 700, L, R)) drawStairHead(ctx, time);
  for (const p of BELLS_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'gallery') drawGallery(ctx, p);
    else if (p.kind === 'beam') drawBeam(ctx, p);
  }
  if (ROPE && visible(ROPE.x - 60, ROPE.x + ROPE.w + 60, L, R)) drawRope(ctx, ROPE, time);
  // the hanging rain over everything, in the world: perfectly still, a shimmer passing through it
  const sh = (time * 0.12) % 1;
  for (const d of rainNear) {
    if (d.x < L || d.x > R) continue;
    const lit = Math.abs(d.x / BELLS_W - sh) < 0.015;
    drop(ctx, d.x, d.y, d.s, lit ? 0.95 : 0.42);
  }
}

// The sky round the top of the Spire: high, pale and cold, a low sun going gold at the bottom; the sea of cloud below with
// the islands in it, tiny; the far rain in layers
function drawSky(ctx, camX, time) {
  ctx.fillStyle = vgrad(ctx, 'bw-sky', 0, H, [[0, '#3a3a6a'], [0.4, '#7a78a8'], [0.72, '#d8c8d0'], [1, '#f0dcc0']]);
  ctx.fillRect(0, 0, W, H);
  softGlow(ctx, W * 0.75, H * 0.82, 220, '255,226,180', 0.35);
  // the sea of cloud far below
  ctx.fillStyle = 'rgba(246,238,240,0.7)';
  for (let i = 0; i < 12; i++) {
    const x = ((i * 150 - camX * 0.04) % 1800 + 1800) % 1800 - 200;
    ellipse(ctx, x, 500 + (i % 3) * 8, 140, 26);
  }
  // the islands, tiny, in gaps in the cloud
  for (const s of isles) {
    const x = ((s.x - camX * 0.06) % 1700 + 1700) % 1700 - 150;
    ctx.fillStyle = s.k < 0.3 ? '#8a9a7a' : s.k < 0.6 ? '#9a8a8a' : '#7a8a9a';
    ctx.beginPath();
    ctx.ellipse(x, s.y, 22 * s.s, 5 * s.s, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(80,90,110,0.35)';
    ellipse(ctx, x, s.y + 1, 22 * s.s, 2 * s.s);
  }
  ctx.fillStyle = 'rgba(246,238,240,0.5)';
  for (let i = 0; i < 8; i++) {
    const x = ((i * 230 + 90 - camX * 0.07) % 1840 + 1840) % 1840 - 200;
    ellipse(ctx, x, 528, 180, 20);
  }
  // the far rain, hanging, in two layers
  for (const d of rainFar) {
    const x = ((d.x - camX * 0.2) % 1400 + 1400) % 1400 - 200;
    drop(ctx, x, d.y, d.s * 0.7, 0.28);
  }
  void time;
}

// The arcade along the back: pale stone piers and round arches open to the sky, a cornice over them
function drawArcade(ctx, L, R, time) {
  const top = GROUND - 330, spring = GROUND - 210;
  ctx.fillStyle = STONE_D;
  ctx.fillRect(L, top, R - L, 34); // the cornice
  ctx.fillStyle = STONE_L;
  ctx.fillRect(L, top + 30, R - L, 6);
  for (let x = Math.floor(L / ARCH) * ARCH; x < R + ARCH; x += ARCH) {
    // the pier
    ctx.fillStyle = vgrad(ctx, 'bw-pier', top, GROUND, [[0, STONE], [1, STONE_D]]);
    ctx.fillRect(x - 22, top + 36, 44, GROUND - top - 36);
    ctx.fillStyle = STONE_E;
    ctx.fillRect(x - 26, spring - 6, 52, 10);
    // the arch's spandrel
    ctx.fillStyle = STONE;
    ctx.beginPath();
    ctx.moveTo(x + 22, top + 36);
    ctx.lineTo(x + ARCH - 22, top + 36);
    ctx.lineTo(x + ARCH - 22, spring);
    ctx.arc(x + ARCH / 2, spring, ARCH / 2 - 22, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = STONE_E;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + ARCH / 2, spring, ARCH / 2 - 22, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = STONE_D; // the keystone
    ctx.fillRect(x + ARCH / 2 - 8, spring - ARCH / 2 + 18, 16, 16);
  }
  // a low parapet behind, between the piers
  ctx.fillStyle = STONE_D;
  ctx.fillRect(L, GROUND - 46, R - L, 46);
  ctx.fillStyle = STONE_L;
  ctx.fillRect(L, GROUND - 48, R - L, 4);
  ctx.fillStyle = 'rgba(110,98,128,0.5)';
  for (let x = Math.floor(L / 24) * 24; x < R; x += 24) ctx.fillRect(x + 6, GROUND - 40, 12, 32);
  void time;
}

// A great bell in its oak frame, stopped mid-swing: the frame's two posts and headstock, the bell hanging off it at an
// angle no bell rests at
function drawHangingBell(ctx, b) {
  const { x, s, a } = b, hy = GROUND - 300;
  ctx.fillStyle = OAK_D;
  ctx.fillRect(x - 110 * s - 8, hy, 14, GROUND - hy);
  ctx.fillRect(x + 110 * s - 6, hy, 14, GROUND - hy);
  ctx.fillStyle = OAK;
  ctx.fillRect(x - 120 * s - 10, hy - 12, 240 * s + 20, 16);
  ctx.save();
  ctx.translate(x, hy + 4);
  ctx.rotate(a);
  ctx.fillStyle = OAK_D; // the headstock and the wheel
  ctx.fillRect(-30 * s, -6, 60 * s, 12);
  ctx.strokeStyle = OAK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 44 * s, 0, TAU);
  ctx.stroke();
  ctx.translate(0, 120 * s);
  const bw = 62 * s, bh = 112 * s;
  bellPath(ctx, bw, bh);
  ctx.fillStyle = bronzeFill(ctx, bw, bh, true);
  ctx.fill();
  ctx.strokeStyle = BRONZE_E;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(106,160,138,0.35)';
  ctx.fillRect(-bw * 0.7, -bh * 0.5, bw * 1.4, 5);
  ctx.fillStyle = BRONZE_D; // the clapper, stopped against the side
  ellipse(ctx, -bw * 0.4, -6, 6 * s, 8 * s);
  ctx.restore();
  // rain hanging round it, thicker
  for (let i = 0; i < 18; i++) drop(ctx, x - 90 + ((i * 37) % 180), hy + 40 + ((i * 53) % 200), 1, 0.5);
}

// The Great Bell's frame on the crown walk, the biggest, empty: the headstock torn, the straps hanging
function drawEmptyFrame(ctx, x) {
  const hy = GROUND - 330;
  ctx.fillStyle = OAK_D;
  ctx.fillRect(x - 150, hy, 18, GROUND - hy);
  ctx.fillRect(x + 132, hy, 18, GROUND - hy);
  ctx.fillStyle = OAK;
  ctx.fillRect(x - 164, hy - 16, 328, 20);
  ctx.save();
  ctx.translate(x + 10, hy + 6);
  ctx.rotate(0.5);
  ctx.fillStyle = OAK_D;
  ctx.fillRect(-46, -8, 92, 16);
  ctx.restore();
  ctx.strokeStyle = '#2a2834';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 30, hy + 10);
  ctx.lineTo(x - 36, hy + 70);
  ctx.moveTo(x + 40, hy + 18);
  ctx.lineTo(x + 46, hy + 60);
  ctx.stroke();
}

// The gallery floor: worn pale flags, the drop beyond a balustrade at the front
function drawFloor(ctx, L, R) {
  ctx.fillStyle = vgrad(ctx, 'bw-drop', GROUND, H, [[0, '#c8b8c8'], [1, '#f0dcc0']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = STONE;
  ctx.fillRect(L, GROUND - 2, R - L, 22);
  ctx.fillStyle = STONE_L;
  ctx.fillRect(L, GROUND - 3, R - L, 3);
  ctx.strokeStyle = 'rgba(110,98,128,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.floor(L / 64) * 64; x < R; x += 64) {
    ctx.moveTo(x, GROUND);
    ctx.lineTo(x - 8, GROUND + 20);
  }
  ctx.stroke();
  ctx.fillStyle = STONE_D; // the balustrade's rail and balusters
  ctx.fillRect(L, GROUND + 50, R - L, 8);
  for (let x = Math.floor(L / 30) * 30; x < R; x += 30) {
    ctx.fillStyle = STONE;
    ctx.beginPath();
    ctx.ellipse(x, GROUND + 36, 6, 14, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = STONE_E;
  ctx.fillRect(L, GROUND + 20, R - L, 4);
}

// The Rain Stair's head: the crystal stair coming up out of the Spire at the west end, wet now, the rain that hung on it
// fallen and running off the steps (C4's update), and the dry line where the stopped rain starts again up here
function drawStairHead(ctx, time) {
  const x = BELLS_EXIT_X;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#b8a6ec' : '#a898e0';
    ctx.fillRect(x - 40 + i * 14, GROUND - i * 20 - 6, 40, 10);
  }
  ctx.fillStyle = 'rgba(200,230,255,0.45)';
  for (let i = 0; i < 5; i++) ctx.fillRect(x - 40 + i * 14, GROUND - i * 20 - 7, 40, 2);
  for (let i = 0; i < 3; i++) { // a few drops still running down
    const k = (time * 0.8 + i / 3) % 1;
    drop(ctx, x - 30 + i * 24, GROUND - 90 + k * 80, 1.2, 0.8 * (1 - k));
  }
  ctx.strokeStyle = 'rgba(200,176,255,0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 44, GROUND - 30);
  ctx.lineTo(x + 40, GROUND - 110);
  ctx.stroke();
}

// A gallery: a stone balcony on two corbels, a little balustrade
function drawGallery(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = STONE_D;
  for (const cx of [x + 22, x + w - 22]) {
    ctx.beginPath();
    ctx.moveTo(cx - 14, y + 6);
    ctx.lineTo(cx + 14, y + 6);
    ctx.lineTo(cx + 4, y + 40);
    ctx.lineTo(cx - 4, y + 40);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 11, 3);
  ctx.fill();
  ctx.fillStyle = STONE_L;
  ctx.fillRect(x, y - 5, w, 2);
  ctx.fillStyle = STONE_D;
  for (let bx = x + 8; bx < x + w - 4; bx += 18) ctx.fillRect(bx, y - 22, 6, 18);
  ctx.fillRect(x + 2, y - 26, w - 4, 5);
}

// A bell frame's beam: a heavy oak beam bound with iron, hung between two posts up in the loft
function drawBeam(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = OAK_D;
  ctx.fillRect(x + 6, y, 10, GROUND - y);
  ctx.fillRect(x + w - 16, y, 10, GROUND - y);
  ctx.fillStyle = OAK;
  ctx.beginPath();
  ctx.roundRect(x, y - 5, w, 14, 3);
  ctx.fill();
  ctx.fillStyle = '#7a5e48';
  ctx.fillRect(x, y - 5, w, 3);
  ctx.fillStyle = '#2a2834';
  for (const bx of [x + 30, x + w - 36]) ctx.fillRect(bx, y - 5, 6, 14);
}

// The find: on the loft's top beam, the end of the bell-ringers' rope coming down from the dark above, cut clean a little
// above the beam, and the sally (its striped woollen grip) lying on the beam beside it where it fell. Nothing says so
function drawRope(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.fillStyle = OAK_D;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 11, 3);
  ctx.fill();
  ctx.fillStyle = OAK;
  ctx.fillRect(x, y - 4, w, 3);
  const sway = Math.sin(time * 0.4) * 0.6; // (barely: the air up here is stopped too)
  ctx.strokeStyle = '#c8b89a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 6, 0);
  ctx.lineTo(cx - 6 + sway, y - 46);
  ctx.stroke();
  ctx.strokeStyle = '#e8dcc0'; // the cut end, frayed
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const d of [-2, 0, 2]) {
    ctx.moveTo(cx - 6 + sway + d * 0.4, y - 46);
    ctx.lineTo(cx - 6 + sway + d, y - 40);
  }
  ctx.stroke();
  // the sally, lying on the beam: a fat woollen grip striped red, white and blue, a length of rope either side
  ctx.strokeStyle = '#c8b89a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 30, y - 6);
  ctx.lineTo(cx + 26, y - 6);
  ctx.stroke();
  const cols = ['#c84a3a', '#f0ece4', '#4a5aa8'];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = cols[i % 3];
    ctx.beginPath();
    ctx.roundRect(cx - 14 + i * 5, y - 11, 5, 10, 2);
    ctx.fill();
  }
  for (let i = 0; i < 6; i++) drop(ctx, cx - 34 + i * 14, y - 30 - (i % 3) * 14, 1, 0.6);
}
