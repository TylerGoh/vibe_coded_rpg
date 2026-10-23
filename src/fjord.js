// Docs: docs/places/fjord.md
// Icefang Fjord and Icefang Hamlet (room FJORD, src/shared/rpg.js): Frostpeak's landing and its town. West
// to east: the stone quay where the Puddle Jumper ties up (her gangway is a door, FJORD_DOCK_X), the Lodestar,
// sailing south again since atlas Phase 5 (her gangway is a door too, FJORD_LODESTAR_X), Runa's net
// shed, the turf hut whose door is everyone's own front door (FJORD_HOME_X), the lamp-fire where Old
// Skaldi stands, the smokehouse, and the path up to Frostpine Ridge. Behind it all: the fjord's black water
// with floes, its rock walls, the aurora, and the Queen's ice bridge, cracked, hanging across the south.
// This room paints its own sky. Also here: the path down to the hamlet at the ridge's west end
// (drawFjordPath, called by src/highlands.js), and the Lodestar herself (drawLodestar), moored here and at
// Forgehold's quay (src/forgehold.js).
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { FJORD_W, FIELD_GROUND, FJORD_DOCK_X, FJORD_LODESTAR_X, FJORD_HOME_X, FJORD_FIRE_X, FJORD_EXIT_X, FJORD_PLATFORMS } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';
import { drawFerry, drawBoarding } from './harbour.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300; // the sea line, in screen space
const INK = '#4a4a66';
const QUAY_END = 1420; // stone quay west of here, the hamlet's snowy ground east of it
const FERRY_X = FJORD_DOCK_X - 140; // her stern (the gangway sits 140 px along, as at Greenhollow)
const SHIP_X = 1030, SHIP_LEN = 380; // the Lodestar, moored, her gangway at FJORD_LODESTAR_X
const NOTICE_X = 1290;
const SHED_X = 1560; // Runa's net shed (she stands in front of it: RUNA_X)
const LAMPS = [250, 1000, 1400, 2380, 2760];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const roof = (kind, i = 0) => FJORD_PLATFORMS.filter((p) => p.kind === kind)[i];

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
const stars = (() => {
  const r = mulberry32(301);
  return Array.from({ length: 50 }, () => ({ x: r() * W, y: r() * 150, s: 0.5 + r(), p: r() * TAU }));
})();
const flakes = (() => {
  const r = mulberry32(303);
  return Array.from({ length: 55 }, () => ({ x: r() * W, y: r() * H, s: 1 + r() * 1.8, v: 14 + r() * 20, p: r() * TAU }));
})();
const floes = (() => {
  const r = mulberry32(307);
  return Array.from({ length: 14 }, () => ({ x: r() * 2200, y: r(), w: 20 + r() * 50, p: r() * TAU }));
})();
const glints = (() => {
  const r = mulberry32(309);
  return Array.from({ length: 36 }, () => ({ x: r() * 1800, y: r(), w: 10 + r() * 22, p: r() * TAU }));
})();
// huts set back behind the street (drawn small and a little hazy), and pines on the slope at the east end
const backHuts = [{ x: 1990, s: 0.62 }, { x: 2290, s: 0.55 }, { x: 2470, s: 0.66 }, { x: 1700, s: 0.5 }];
const pines = (() => {
  const r = mulberry32(311);
  return Array.from({ length: 9 }, (_, i) => ({ x: 2740 + i * 34 + r() * 20, s: 0.55 + r() * 0.5 + i * 0.03 }));
})();

// Everything in the hamlet behind the slimes
export function drawFjord(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0); // sky, walls and water in screen space
  drawSky(ctx, camX, time);
  ctx.restore();

  const L = camX - 100, R = camX + viewW + 100;
  drawShore(ctx, Math.max(QUAY_END - 40, L), Math.min(FJORD_W, R));
  for (const h of backHuts) if (visible(h.x - 90, h.x + 90, L, R)) drawHut(ctx, h.x, GROUND - 52, h.s, time, true);
  if (visible(FERRY_X - 60, FERRY_X + 700, L, R)) drawFerry(ctx, time, FERRY_X, GROUND, [FERRY_X - 40, FERRY_X + 690]);
  if (visible(SHIP_X - 40, SHIP_X + SHIP_LEN + 60, L, R)) drawLodestar(ctx, time);
  drawQuay(ctx, Math.max(0, L), Math.min(QUAY_END, R));
  drawGround(ctx, Math.max(QUAY_END, L), Math.min(FJORD_W, R));
  if (visible(FJORD_DOCK_X - 200, FJORD_DOCK_X + 120, L, R)) drawBoarding(ctx, FJORD_DOCK_X, time, GROUND, ['FERRY TO GREENHOLLOW', 'The fjord is open!', 'Home in under a minute.']);
  if (visible(FJORD_LODESTAR_X - 80, NOTICE_X + 100, L, R)) {
    drawLodestarGangway(ctx, FJORD_LODESTAR_X, time);
    drawNotice(ctx, NOTICE_X, time);
  }
  const cr = roof('crates');
  if (visible(cr.x - 10, cr.x + cr.w + 10, L, R)) drawCrates(ctx, cr);
  if (visible(SHED_X - 130, SHED_X + 130, L, R)) drawShed(ctx, SHED_X, time);
  if (visible(FJORD_HOME_X - 110, FJORD_HOME_X + 110, L, R)) drawHomeHut(ctx, time);
  if (visible(FJORD_FIRE_X - 120, FJORD_FIRE_X + 120, L, R)) drawFire(ctx, FJORD_FIRE_X, time);
  if (visible(2440, 2560, L, R)) drawBucket(ctx, 2520, time);
  if (visible(2540, 2760, L, R)) drawSmokehouse(ctx, time);
  for (const x of LAMPS) if (visible(x - 40, x + 40, L, R)) drawLamp(ctx, x, time);
  if (visible(2700, FJORD_W, L, R)) drawPathUp(ctx, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawSnow(ctx, camX, time);
  ctx.restore();
}

// ——— sky, the bridge, the fjord ———

function drawSky(ctx, camX, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#6f80b4');
  sky.addColorStop(0.55, '#aab6dc');
  sky.addColorStop(1, '#ecdce6');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  for (const s of stars) {
    const x = (((s.x - camX * 0.02) % W) + W) % W;
    ctx.fillStyle = `rgba(255,250,235,${0.25 + 0.35 * (0.5 + 0.5 * Math.sin(time * 2 + s.p))})`;
    circle(ctx, x, s.y, s.s * 0.8);
  }
  // the aurora, soft, high over the fjord
  ctx.globalAlpha = 0.24;
  for (const [c, off, y0] of [['#8fffd0', 0, 60], ['#c4a0ff', 2, 92], ['#9fd8ff', 4, 40]]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 40) {
      const y = y0 + Math.sin(x * 0.006 + time * 0.3 + off - camX * 0.0004) * 24 + Math.sin(x * 0.013 - time * 0.2) * 10;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    for (let x = W; x >= 0; x -= 40) ctx.lineTo(x, y0 + 30 + Math.sin(x * 0.006 + time * 0.3 + off + 0.6 - camX * 0.0004) * 24);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // the other islands, far off down the fjord to the south
  drawDistantIslands(ctx, { from: 'frost', scroll: camX, roomW: FJORD_W, time, horizon: HORIZON, haze: '#ecdce6', fade: 0.55, scale: 0.6, night: 0.3, sky: 220 });
  drawBridge(ctx, camX, time);
  drawWalls(ctx, camX);
  // the water: black-blue and still, floes drifting, a few glints
  const sea = ctx.createLinearGradient(0, HORIZON, 0, GROUND);
  sea.addColorStop(0, '#c4cfe2');
  sea.addColorStop(0.3, '#7d8fb4');
  sea.addColorStop(1, '#4e5f86');
  ctx.fillStyle = sea;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(0, HORIZON, W, 1.5);
  for (const g of glints) {
    const y = HORIZON + 6 + g.y * g.y * (GROUND - HORIZON - 10);
    const f = 0.1 + g.y * 0.5;
    const x = (((g.x - camX * f + Math.sin(time * 0.5 + g.p) * 8) % 1800) + 1800) % 1800 - 200;
    if (x < -40 || x > W + 40) continue;
    ctx.globalAlpha = 0.2 + 0.3 * (0.5 + 0.5 * Math.sin(time * 1.4 + g.p));
    ctx.fillStyle = '#eef2fa';
    ctx.beginPath();
    ctx.roundRect(x, y, g.w * (0.5 + g.y), 2 + g.y, 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const fl of floes) {
    const y = HORIZON + 10 + fl.y * fl.y * (GROUND - HORIZON - 30);
    const f = 0.12 + fl.y * 0.55;
    const x = (((fl.x - camX * f + time * 3) % 2200) + 2200) % 2200 - 200;
    if (x < -80 || x > W + 80) continue;
    const s = 0.5 + fl.y * 0.7, bob = Math.sin(time * 0.8 + fl.p) * 1.2;
    ctx.fillStyle = 'rgba(200,220,240,0.45)';
    ellipse(ctx, x, y + 3 * s + bob, fl.w * s * 0.6, 4 * s);
    ctx.fillStyle = '#f4f8ff';
    ctx.beginPath();
    ctx.ellipse(x, y + bob, fl.w * s * 0.5, 5 * s, 0, Math.PI, 0);
    ctx.lineTo(x + fl.w * s * 0.45, y + 2 * s + bob);
    ctx.lineTo(x - fl.w * s * 0.45, y + 2 * s + bob);
    ctx.closePath();
    ctx.fill();
  }
}

// The Queen's ice bridge (story/world/regions/frostpeak.md): a long pale arch from the far shore out across
// the sea to the south, cracked through the middle, with a gap where a piece has already fallen
function drawBridge(ctx, camX, time) {
  const off = -camX * 0.04;
  const x0 = 460 + off, x1 = 1060 + off, top = 70, foot = HORIZON - 6;
  const arch = (u) => [x0 + (x1 - x0) * u, foot - Math.sin(u * Math.PI * 0.92 + 0.12) * (foot - top)];
  ctx.save();
  ctx.lineCap = 'round';
  for (const [a, b] of [[0, 0.47], [0.52, 1]]) {
    ctx.strokeStyle = 'rgba(206,228,250,0.75)';
    ctx.lineWidth = 16;
    ctx.beginPath();
    for (let u = a; u <= b + 1e-6; u += 0.02) {
      const [x, y] = arch(u);
      u === a ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let u = a; u <= b + 1e-6; u += 0.02) {
      const [x, y] = arch(u);
      u === a ? ctx.moveTo(x, y - 5) : ctx.lineTo(x, y - 5);
    }
    ctx.stroke();
    // icicles hanging under it
    ctx.fillStyle = 'rgba(206,228,250,0.7)';
    for (let u = a + 0.03; u < b; u += 0.05) {
      const [x, y] = arch(u);
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 6);
      ctx.lineTo(x, y + 14 + Math.sin(u * 40) * 5);
      ctx.lineTo(x + 3, y + 6);
      ctx.fill();
    }
  }
  // the crack: jagged ends either side of the gap, and a shard falling away now and then
  const [cx, cy] = arch(0.495);
  ctx.strokeStyle = 'rgba(140,170,210,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - 8);
  ctx.lineTo(cx - 10, cy + 2);
  ctx.lineTo(cx - 16, cy + 8);
  ctx.moveTo(cx + 12, cy - 6);
  ctx.lineTo(cx + 16, cy + 3);
  ctx.lineTo(cx + 11, cy + 9);
  ctx.stroke();
  const k = (time * 0.12) % 1;
  if (k < 0.5) {
    ctx.fillStyle = `rgba(230,242,255,${0.8 * (1 - k * 2)})`;
    ctx.beginPath();
    const fy = cy + 10 + k * 2 * (HORIZON - cy - 10);
    ctx.moveTo(cx - 3, fy);
    ctx.lineTo(cx + 3, fy - 4);
    ctx.lineTo(cx + 2, fy + 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// The fjord's far wall: dark rock with snow, low across the water, with the fjord's mouth open to the sea
// toward the west (where the ferry comes in)
function drawWalls(ctx, camX) {
  const off = -camX * 0.16;
  ctx.fillStyle = '#4e5272';
  ctx.beginPath();
  ctx.moveTo(-20, HORIZON + 2);
  const pts = [[-20, 250], [80, 228], [170, 246], [260, 260], [330, 282]]; // the west side, falling to the mouth
  for (const [x, y] of pts) ctx.lineTo(x + off * 0.4, y);
  ctx.lineTo(420 + off * 0.4, HORIZON + 2);
  ctx.closePath();
  ctx.fill();
  // the long east wall, scrolling past as you walk
  for (const tile of [0, 1, 2]) {
    const bx = 560 + off + tile * 1100;
    if (bx > W + 100 || bx + 1100 < -100) continue;
    ctx.fillStyle = '#4e5272';
    ctx.beginPath();
    ctx.moveTo(bx, HORIZON + 2);
    const ys = [270, 236, 214, 226, 196, 208, 230, 214, 240, 262];
    ys.forEach((y, i) => ctx.lineTo(bx + 60 + i * 110, y));
    ctx.lineTo(bx + 1150, HORIZON + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#eef3ff'; // snow on the tops
    ys.forEach((y, i) => {
      if (y > 240) return;
      const x = bx + 60 + i * 110;
      ctx.beginPath();
      ctx.moveTo(x - 34, y + 14);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 38, y + 16);
      ctx.quadraticCurveTo(x, y + 9, x - 34, y + 14);
      ctx.fill();
    });
  }
  ctx.fillStyle = 'rgba(236,220,230,0.35)'; // haze at the waterline
  ctx.fillRect(0, HORIZON - 26, W, 28);
}

function drawSnow(ctx, camX, time) {
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (const f of flakes) {
    const y = (f.y + time * f.v) % H;
    const x = ((((f.x - camX * 0.25 + Math.sin(time * 0.7 + f.p) * 12) % W) + W) % W);
    circle(ctx, x, y, f.s);
  }
}

// ——— the ground ———

// The quay: slate stone under a plank walk, the edges frosted
function drawQuay(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = '#8a8fa8';
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = '#7a7f98';
  for (let y = GROUND + 18, row = 0; y < H; y += 18, row++) {
    for (let x = Math.floor(L / 46) * 46 + (row % 2) * 23; x < R; x += 46) {
      ctx.beginPath();
      ctx.roundRect(x + 2, y - 15, 42, 14, 4);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#a89282';
  ctx.fillRect(L, GROUND - 2, R - L, 12);
  ctx.fillStyle = '#937e70';
  for (let x = Math.floor(L / 34) * 34; x < R; x += 34) ctx.fillRect(x, GROUND - 2, 2, 12);
  ctx.fillStyle = '#f4f8ff'; // frost along the edge
  ctx.fillRect(L, GROUND - 3, R - L, 3);
}

// A snowy bank between the water and the hamlet's street, so the huts stand on land
function drawShore(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = '#dfe6f4';
  ctx.beginPath();
  ctx.moveTo(L, GROUND);
  ctx.lineTo(L, GROUND - 36);
  for (let x = Math.floor(L / 60) * 60; x <= R + 60; x += 60) ctx.quadraticCurveTo(x + 30, GROUND - 52 - Math.sin(x * 0.01) * 8, x + 60, GROUND - 40);
  ctx.lineTo(R, GROUND);
  ctx.closePath();
  ctx.fill();
  if (L < QUAY_END + 40) {
    ctx.fillStyle = '#4e5272'; // black rock where the quay meets the land
    ctx.beginPath();
    ctx.moveTo(QUAY_END - 40, GROUND);
    ctx.quadraticCurveTo(QUAY_END - 20, GROUND - 46, QUAY_END + 30, GROUND - 40);
    ctx.lineTo(QUAY_END + 40, GROUND);
    ctx.fill();
  }
}

// Packed snow over dark earth, with a trodden path down the middle of the street
function drawGround(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = '#6a6488';
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = '#5c5678';
  for (let x = Math.floor(L / 70) * 70; x < R; x += 70) ellipse(ctx, x + 30, GROUND + 50 + (x % 140 ? 12 : 0), 18, 6);
  ctx.fillStyle = '#d4dcef';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 2, R - L + 8, 18, 9);
  ctx.fill();
  ctx.fillStyle = '#f6f9ff';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 6, R - L + 8, 14, 7);
  ctx.fill();
  ctx.beginPath();
  for (let gx = Math.floor(L / 22) * 22; gx < R + 12; gx += 22) {
    ctx.moveTo(gx + 12, GROUND - 4);
    ctx.ellipse(gx, GROUND - 4, 12, 4, 0, Math.PI, 0);
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(160,150,180,0.35)'; // footprints
  for (let x = Math.floor(L / 38) * 38; x < R; x += 38) ellipse(ctx, x + ((x / 38) % 2 ? 6 : -6), GROUND + 2, 4, 1.6);
}

// ——— buildings ———

// A fjord-folk hut: stone footing, timber walls, a thick turf roof with snow on it, a round-topped door.
// back: set back behind the street (no door detail, hazier).
function drawHut(ctx, x, base, s, time, back = false) {
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(s, s);
  if (back) ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#7a6a64';
  ctx.beginPath();
  ctx.roundRect(-70, -70, 140, 70, 6);
  ctx.fill();
  ctx.fillStyle = '#8f7a6a';
  for (let y = -66; y < -4; y += 13) {
    ctx.fillRect(-66, y, 132, 2);
  }
  ctx.fillStyle = '#7c9a7e'; // turf roof
  ctx.beginPath();
  ctx.moveTo(-88, -64);
  ctx.quadraticCurveTo(0, -132, 88, -64);
  ctx.quadraticCurveTo(0, -74, -88, -64);
  ctx.fill();
  ctx.fillStyle = '#f6f9ff'; // snow lying on the turf
  ctx.beginPath();
  ctx.moveTo(-62, -92);
  ctx.quadraticCurveTo(0, -136, 62, -92);
  ctx.quadraticCurveTo(30, -100, 0, -102);
  ctx.quadraticCurveTo(-30, -100, -62, -92);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8'; // a lit window
  ctx.beginPath();
  ctx.roundRect(back ? -14 : 24, -50, 22, 18, 4);
  ctx.fill();
  if (back) {
    // chimney smoke
    for (let i = 0; i < 4; i++) {
      const k = (time * 0.25 + i / 4 + x * 0.001) % 1;
      ctx.fillStyle = `rgba(236,240,250,${0.55 * (1 - k)})`;
      circle(ctx, 40 - k * 20, -120 - k * 80, 8 + k * 14);
    }
  }
  ctx.restore();
}

// A thick turf roof whose flat top is the platform p (y = p.y), with snow lying on it
function turfRoof(ctx, p, eave = 14, drop = 36) {
  ctx.fillStyle = '#7c9a7e';
  ctx.beginPath();
  ctx.moveTo(p.x - eave, p.y + drop);
  ctx.lineTo(p.x - 4, p.y + 6);
  ctx.quadraticCurveTo(p.x, p.y, p.x + 12, p.y);
  ctx.lineTo(p.x + p.w - 12, p.y);
  ctx.quadraticCurveTo(p.x + p.w, p.y, p.x + p.w + 4, p.y + 6);
  ctx.lineTo(p.x + p.w + eave, p.y + drop);
  ctx.quadraticCurveTo(p.x + p.w / 2, p.y + drop - 8, p.x - eave, p.y + drop);
  ctx.fill();
  ctx.fillStyle = '#6a8a6c';
  ctx.fillRect(p.x - 2, p.y + 12, p.w + 4, 3);
  ctx.fillStyle = '#f6f9ff';
  ctx.beginPath();
  ctx.roundRect(p.x - 2, p.y - 5, p.w + 4, 11, 5);
  ctx.fill();
  for (let x = p.x + 8; x < p.x + p.w - 4; x += 26) ellipse(ctx, x, p.y + 6, 7, 4); // drifts hanging over
}

// The hut whose door is everyone's own front door (a HOME door, FJORD_HOME_X): its roof is a platform
function drawHomeHut(ctx, time) {
  const p = roof('turf', 0), x = FJORD_HOME_X, base = GROUND;
  ctx.fillStyle = '#7a6a64';
  ctx.beginPath();
  ctx.roundRect(p.x + 8, p.y + 30, p.w - 16, base - p.y - 30, 6);
  ctx.fill();
  ctx.fillStyle = '#8f7a6a';
  for (let y = p.y + 40; y < base - 6; y += 13) ctx.fillRect(p.x + 12, y, p.w - 24, 2);
  turfRoof(ctx, p); // its top is the platform
  // the door: round-topped, with a lantern beside it and a sign
  ctx.fillStyle = '#9b6a4a';
  ctx.beginPath();
  ctx.moveTo(x - 20, base);
  ctx.lineTo(x - 20, base - 44);
  ctx.quadraticCurveTo(x, base - 66, x + 20, base - 44);
  ctx.lineTo(x + 20, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, x + 12, base - 30, 2.6);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.roundRect(p.x + p.w - 46, p.y + 46, 24, 20, 5);
  ctx.fill();
  ctx.save();
  ctx.translate(x, base - 86);
  ctx.rotate(Math.sin(time * 1.2) * 0.02);
  ctx.fillStyle = '#fff6ea';
  ctx.strokeStyle = '#9b6a4a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-28, -11, 56, 22, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Home', 0, 0.5, 13, INK);
  ctx.restore();
}

// Runa's net shed: open-fronted, nets hung to dry on its side, floats, a counter with her wares, a sign
function drawShed(ctx, x, time) {
  const base = GROUND, w = 200, top = base - 130;
  ctx.fillStyle = '#5c5070'; // the dark inside
  ctx.fillRect(x - w / 2 + 8, top + 26, w - 16, base - top - 26);
  ctx.fillStyle = '#8f7a6a'; // posts
  for (const px of [x - w / 2 + 4, x + w / 2 - 12]) ctx.fillRect(px, top + 20, 8, base - top - 20);
  ctx.fillStyle = '#7c9a7e'; // turf roof
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 16, top + 30);
  ctx.quadraticCurveTo(x, top - 26, x + w / 2 + 16, top + 30);
  ctx.quadraticCurveTo(x, top + 20, x - w / 2 - 16, top + 30);
  ctx.fill();
  ctx.fillStyle = '#f6f9ff';
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + 10, top + 6);
  ctx.quadraticCurveTo(x, top - 30, x + w / 2 - 10, top + 6);
  ctx.quadraticCurveTo(x, top - 4, x - w / 2 + 10, top + 6);
  ctx.fill();
  // nets hanging inside, a row of floats, a fish rack
  ctx.strokeStyle = 'rgba(220,214,236,0.55)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i <= 10; i++) {
    const nx = x - 80 + i * 16;
    ctx.beginPath();
    ctx.moveTo(nx, top + 34);
    ctx.lineTo(nx + Math.sin(time + i) * 2, base - 50);
    ctx.stroke();
  }
  for (let r = 0; r < 4; r++) {
    ctx.beginPath();
    ctx.moveTo(x - 80, top + 40 + r * 14);
    for (let i = 1; i <= 10; i++) ctx.lineTo(x - 80 + i * 16, top + 40 + r * 14 + (i % 2) * 3);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#e86f86';
    circle(ctx, x - 70 + i * 28, top + 32, 5);
  }
  // the counter, with a hood and a harpoon on it, and a basket of frostbloom
  ctx.fillStyle = '#a89282';
  ctx.beginPath();
  ctx.roundRect(x - w / 2 + 14, base - 46, w - 28, 46, [6, 6, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#937e70';
  ctx.fillRect(x - w / 2 + 14, base - 46, w - 28, 6);
  ctx.fillStyle = '#9aa8c0'; // a fur hood on a peg
  ctx.beginPath();
  ctx.ellipse(x + 52, base - 56, 14, 11, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#f6f8ff';
  ctx.fillRect(x + 38, base - 58, 28, 4);
  ctx.strokeStyle = '#efe6d4'; // a harpoon leaning on the post
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 20, base - 2);
  ctx.lineTo(x + w / 2 - 6, top + 40);
  ctx.stroke();
  ctx.fillStyle = '#9fe3ff'; // frostbloom in a basket
  for (let i = 0; i < 5; i++) circle(ctx, x - 50 + i * 7, base - 54 - (i % 2) * 4, 4);
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.roundRect(x - 58, base - 52, 40, 8, 3);
  ctx.fill();
  // the sign
  ctx.save();
  ctx.translate(x, top + 4);
  ctx.rotate(Math.sin(time * 1.1) * 0.015);
  ctx.fillStyle = '#fff6ea';
  ctx.strokeStyle = '#5aa9a1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-74, -16, 148, 30, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'NETS · WARM GEAR', 0, -1, 13, '#3f7f78');
  ctx.restore();
}

// The hamlet's lamp-fire: an iron fire basket on a post, logs round it to sit on, and a warm glow
function drawFire(ctx, x, time) {
  const base = GROUND;
  const glow = ctx.createRadialGradient(x, base - 70, 6, x, base - 70, 170);
  glow.addColorStop(0, `rgba(255,200,120,${0.38 + 0.05 * Math.sin(time * 7)})`);
  glow.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = glow;
  circle(ctx, x, base - 70, 170);
  for (const [lx, w] of [[x - 86, 56], [x + 70, 48]]) { // logs to sit on
    ctx.fillStyle = '#8f6a50';
    ctx.beginPath();
    ctx.roundRect(lx - w / 2, base - 16, w, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#c9a07a';
    ellipse(ctx, lx + w / 2 - 3, base - 9, 4, 6.5);
    ctx.fillStyle = '#f6f9ff';
    ellipse(ctx, lx - 6, base - 16, w * 0.35, 3);
  }
  ctx.fillStyle = '#4e4a62'; // the post and basket
  ctx.fillRect(x - 4, base - 64, 8, 64);
  ctx.beginPath();
  ctx.moveTo(x - 26, base - 92);
  ctx.lineTo(x + 26, base - 92);
  ctx.lineTo(x + 16, base - 64);
  ctx.lineTo(x - 16, base - 64);
  ctx.closePath();
  ctx.fill();
  // flames
  for (let i = 0; i < 5; i++) {
    const fx = x - 16 + i * 8, fh = 22 + Math.sin(time * 9 + i * 1.7) * 6 + (i === 2 ? 10 : 0);
    ctx.fillStyle = i % 2 ? '#ffb45a' : '#ff8a4a';
    ctx.beginPath();
    ctx.moveTo(fx - 6, base - 90);
    ctx.quadraticCurveTo(fx - 4, base - 90 - fh * 0.6, fx + Math.sin(time * 6 + i) * 2, base - 90 - fh);
    ctx.quadraticCurveTo(fx + 4, base - 90 - fh * 0.6, fx + 6, base - 90);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffe9a8';
  ellipse(ctx, x, base - 94, 12, 6);
  for (let i = 0; i < 4; i++) { // sparks
    const k = (time * 0.7 + i / 4) % 1;
    ctx.fillStyle = `rgba(255,220,140,${1 - k})`;
    circle(ctx, x + Math.sin(i * 2.3 + time) * 10, base - 104 - k * 70, 1.6);
  }
}

// Tove's bucket of fish scraps (for the yeti cubs)
function drawBucket(ctx, x, time) {
  const base = GROUND;
  ctx.fillStyle = '#7a8aa6';
  ctx.beginPath();
  ctx.moveTo(x - 12, base - 24);
  ctx.lineTo(x + 12, base - 24);
  ctx.lineTo(x + 9, base);
  ctx.lineTo(x - 9, base);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#56647e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, base - 26, 12, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#c4cfe2'; // fish tails sticking out
  for (const [dx, a] of [[-4, -0.4], [5, 0.3]]) {
    ctx.save();
    ctx.translate(x + dx, base - 26);
    ctx.rotate(a + Math.sin(time * 2 + dx) * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-4, -8);
    ctx.lineTo(4, -8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// The smokehouse at the east end: its roof is a platform; smoke curls out of its louvre
function drawSmokehouse(ctx, time) {
  const p = roof('turf', 1), base = GROUND, cx = p.x + p.w / 2;
  ctx.fillStyle = '#6e5e5a';
  ctx.beginPath();
  ctx.roundRect(p.x + 10, p.y + 28, p.w - 20, base - p.y - 28, 6);
  ctx.fill();
  ctx.fillStyle = '#7e6c64';
  for (let y = p.y + 38; y < base - 4; y += 12) ctx.fillRect(p.x + 14, y, p.w - 28, 2);
  ctx.fillStyle = '#4e4258';
  ctx.beginPath();
  ctx.roundRect(cx - 18, base - 50, 36, 50, [8, 8, 0, 0]);
  ctx.fill();
  turfRoof(ctx, p, 12, 34);
  for (let i = 0; i < 5; i++) {
    const k = (time * 0.22 + i / 5) % 1;
    ctx.fillStyle = `rgba(226,226,238,${0.6 * (1 - k)})`;
    circle(ctx, cx + 30 - k * 30 + Math.sin(k * 6 + i) * 6, p.y - 14 - k * 110, 7 + k * 18);
  }
  // fish hung to smoke along its side
  ctx.fillStyle = '#c99b6b';
  for (let i = 0; i < 5; i++) {
    const fx = p.x + 20 + i * 12, fy = p.y + 46;
    ctx.beginPath();
    ctx.ellipse(fx, fy + 10, 3.5, 9, 0, 0, TAU);
    ctx.fill();
  }
}

// One of Skaldi's lamps: an iron post, a lantern lit, frost on its cap
function drawLamp(ctx, x, time) {
  const base = GROUND, top = base - 120;
  ctx.fillStyle = '#4e4a62';
  ctx.fillRect(x - 3, top, 6, base - top);
  const g = ctx.createRadialGradient(x, top + 6, 2, x, top + 6, 44);
  g.addColorStop(0, `rgba(255,226,150,${0.6 + 0.08 * Math.sin(time * 5 + x)})`);
  g.addColorStop(1, 'rgba(255,226,150,0)');
  ctx.fillStyle = g;
  circle(ctx, x, top + 6, 44);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.roundRect(x - 7, top - 4, 14, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#4e4a62';
  ctx.beginPath();
  ctx.moveTo(x - 10, top - 4);
  ctx.lineTo(x, top - 14);
  ctx.lineTo(x + 10, top - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f6f9ff';
  ellipse(ctx, x, top - 12, 7, 2.5);
}

// The Lodestar: an old two-masted ship moored along the quay, sails furled, ready to sail south. She was laid
// up for seven years, frosted over, a tarp on her wheel, while the stars were wrong; the Phase 5 update took
// the frost and the tarp off. x0: her stern; ground: the quay's top (her deck sits about 84 px above it).
export function drawLodestar(ctx, time, x0 = SHIP_X, ground = GROUND) {
  const x1 = x0 + SHIP_LEN, wl = ground - 20 + Math.sin(time * 0.7 + 1) * 1.5, deck = wl - 64;
  ctx.save();
  ctx.fillStyle = '#3e4258';
  ctx.beginPath();
  ctx.moveTo(x0 - 10, deck);
  ctx.lineTo(x1 + 40, deck - 14);
  ctx.quadraticCurveTo(x1 + 10, wl - 4, x1 - 50, wl + 8);
  ctx.lineTo(x0 + 30, wl + 8);
  ctx.quadraticCurveTo(x0, wl - 10, x0 - 10, deck);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9a07a'; // a worn gold stripe and her name
  ctx.beginPath();
  ctx.moveTo(x0 - 8, deck + 8);
  ctx.lineTo(x1 + 34, deck - 6);
  ctx.lineTo(x1 + 30, deck + 2);
  ctx.lineTo(x0 - 6, deck + 16);
  ctx.closePath();
  ctx.fill();
  text(ctx, 'LODESTAR', x1 - 40, deck + 22, 12, '#c9a07a');
  ctx.fillStyle = '#8a6a52'; // her rail, scrubbed
  ctx.fillRect(x0, deck - 4, SHIP_LEN + 30, 4);
  // two masts, their sails furled tight and frosted, the rigging slack
  for (const [mx, mh] of [[x0 + 110, 210], [x0 + 260, 250]]) {
    ctx.strokeStyle = '#6a5040';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(mx, deck);
    ctx.lineTo(mx, deck - mh);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(mx - 50, deck - mh * 0.72);
    ctx.lineTo(mx + 50, deck - mh * 0.72);
    ctx.stroke();
    ctx.fillStyle = '#efe4cc'; // the sail, furled ready, with its red stripe peeping out
    ctx.beginPath();
    ctx.roundRect(mx - 48, deck - mh * 0.72 - 6, 96, 12, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(208,72,90,0.5)';
    ctx.fillRect(mx - 20, deck - mh * 0.72 - 6, 14, 12);
    ctx.strokeStyle = 'rgba(200,190,175,0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(mx, deck - mh);
    ctx.quadraticCurveTo(mx - 60, deck - mh * 0.4, x0 + 10, deck - 4);
    ctx.moveTo(mx, deck - mh);
    ctx.quadraticCurveTo(mx + 70, deck - mh * 0.4, mx + 120, deck - 6);
    ctx.stroke();
  }
  // her wheel at the stern, uncovered, and a red pennant at the masthead
  ctx.strokeStyle = '#8a6a52';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x0 + 34, deck - 22, 12, 0, TAU);
  ctx.moveTo(x0 + 34, deck - 22);
  ctx.lineTo(x0 + 34, deck);
  ctx.stroke();
  const mt = deck - 250, flap = Math.sin(time * 4) * 3;
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.moveTo(x0 + 260, mt);
  ctx.quadraticCurveTo(x0 + 236, mt + 5 + flap, x0 + 214, mt + 8 + flap);
  ctx.lineTo(x0 + 260, mt + 14);
  ctx.closePath();
  ctx.fill();
  // the doubled mooring lines
  ctx.strokeStyle = '#a89282';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x0, deck + 4);
  ctx.quadraticCurveTo(x0 - 16, ground - 8, x0 - 6, ground - 2);
  ctx.moveTo(x1 + 20, deck - 6);
  ctx.quadraticCurveTo(x1 + 50, ground - 6, x1 + 30, ground - 2);
  ctx.stroke();
  ctx.restore();
}

// The Lodestar's gangway, run up from the quay to her deck (the door: FJORD_LODESTAR_X; shared with Forgehold)
export function drawLodestarGangway(ctx, x, time, ground = GROUND) {
  const deck = ground - 84 + Math.sin(time * 0.7 + 1) * 1.5;
  ctx.fillStyle = '#a07a58';
  ctx.beginPath();
  ctx.moveTo(x - 44, ground);
  ctx.lineTo(x + 16, deck);
  ctx.lineTo(x + 38, deck);
  ctx.lineTo(x - 22, ground);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7a5a40';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    ctx.moveTo(x - 44 + t * 60, ground + t * (deck - ground));
    ctx.lineTo(x - 22 + t * 60, ground + t * (deck - ground));
  }
  ctx.stroke();
  ctx.strokeStyle = '#c9b8aa'; // its hand rope
  ctx.beginPath();
  ctx.moveTo(x - 38, ground - 28);
  ctx.quadraticCurveTo(x - 8, deck - 2, x + 20, deck - 26);
  ctx.stroke();
}

// The notice on the quay by the Lodestar. For seven years it said "No sailings. No stars to steer by."; the
// Phase 5 update changed it, no quest (the owner's rule: the update itself lifts the block)
function drawNotice(ctx, x, time) {
  const base = GROUND;
  ctx.fillStyle = '#8f7a6a';
  ctx.fillRect(x - 4, base - 120, 8, 120);
  ctx.save();
  ctx.translate(x, base - 124);
  ctx.rotate(-0.025 + Math.sin(time * 0.9) * 0.008);
  ctx.fillStyle = '#fff6ea';
  ctx.strokeStyle = '#8f7a6a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-84, -40, 168, 74, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'LODESTAR · SOUTH', 0, -24, 13, '#3e4258');
  text(ctx, 'Sailing again.', 0, -4, 13, INK);
  text(ctx, 'Stars enough to steer by.', 0, 13, 12, INK);
  text(ctx, '- Arne', 50, 26, 10, '#8f6240');
  ctx.restore();
}

function drawCrates(ctx, p) {
  const n = Math.round(p.w / 50), cw = p.w / n;
  for (let i = 0; i < n; i++) {
    for (let row = 0; row < 2; row++) {
      const x = p.x + i * cw, y = p.y + row * ((GROUND - p.y) / 2), h = (GROUND - p.y) / 2;
      ctx.fillStyle = (i + row) % 2 ? '#b89a7e' : '#a8896e';
      ctx.fillRect(x + 1, y, cw - 2, h - 1);
      ctx.strokeStyle = '#8a6e56';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 2, cw - 6, h - 5);
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 2);
      ctx.lineTo(x + cw - 3, y + h - 3);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#f6f9ff';
  ctx.beginPath();
  ctx.roundRect(p.x - 2, p.y - 4, p.w + 4, 6, 3);
  ctx.fill();
}

// The way up to Frostpine Ridge at the east end: a snowy slope, pines, a rock (a platform), a signpost
function drawPathUp(ctx, time) {
  const base = GROUND, rk = roof('rock');
  ctx.fillStyle = '#e4eaf6';
  ctx.beginPath();
  ctx.moveTo(2700, base);
  ctx.quadraticCurveTo(2850, base - 40, FJORD_W + 20, base - 150);
  ctx.lineTo(FJORD_W + 20, base);
  ctx.closePath();
  ctx.fill();
  for (const p of pines) {
    const by = base - Math.max(0, (p.x - 2700) * 0.45) + 6;
    ctx.fillStyle = '#4f7a8a';
    for (const [dy, hw] of [[0, 26], [18, 20], [34, 14]]) {
      ctx.beginPath();
      ctx.moveTo(p.x - hw * p.s, by - dy * p.s);
      ctx.lineTo(p.x, by - (dy + 40) * p.s);
      ctx.lineTo(p.x + hw * p.s, by - dy * p.s);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#f6f9ff';
    ellipse(ctx, p.x, by - 40 * p.s, 8 * p.s, 4 * p.s);
  }
  // the rock you can stand on
  ctx.fillStyle = '#5a5e7e';
  ctx.beginPath();
  ctx.moveTo(rk.x - 6, base);
  ctx.quadraticCurveTo(rk.x - 4, rk.y + 4, rk.x + 20, rk.y);
  ctx.lineTo(rk.x + rk.w - 16, rk.y);
  ctx.quadraticCurveTo(rk.x + rk.w + 6, rk.y + 8, rk.x + rk.w + 10, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f6f9ff';
  ctx.beginPath();
  ctx.roundRect(rk.x + 6, rk.y - 4, rk.w - 14, 8, 4);
  ctx.fill();
  // the signpost
  const x = FJORD_EXIT_X;
  ctx.fillStyle = '#8f7a6a';
  ctx.beginPath();
  ctx.roundRect(x - 5, base - 110, 10, 112, 4);
  ctx.fill();
  ctx.save();
  ctx.translate(x, base - 92);
  ctx.rotate(-0.06 + Math.sin(time * 0.8) * 0.01);
  ctx.fillStyle = '#8a9cd4';
  ctx.strokeStyle = '#5a6ca8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-70, -18);
  ctx.lineTo(60, -18);
  ctx.lineTo(78, 0);
  ctx.lineTo(60, 18);
  ctx.lineTo(-70, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Frostpine Ridge', 2, 1, 14, '#ffffff');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(-66, -22, 120, 6, 3);
  ctx.fill();
  ctx.restore();
}

// At Frostpine Ridge's west end (HIGHLANDS_EXIT_X, src/highlands.js): the path down to the hamlet. A
// trodden track between snowbanks, a lamp (one of Skaldi's) and a signpost pointing down.
export function drawFjordPath(ctx, x, groundY, time) {
  ctx.fillStyle = '#e4eaf6';
  ctx.beginPath();
  ctx.moveTo(-20, groundY);
  ctx.lineTo(-20, groundY - 120);
  ctx.quadraticCurveTo(x + 40, groundY - 60, x + 160, groundY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(160,150,180,0.3)';
  for (let i = 0; i < 6; i++) ellipse(ctx, x - 40 + i * 30, groundY - 20 + i * 3, 4, 1.6);
  const lx = x + 120, top = groundY - 120;
  ctx.fillStyle = '#4e4a62';
  ctx.fillRect(lx - 3, top, 6, groundY - top);
  const g = ctx.createRadialGradient(lx, top + 6, 2, lx, top + 6, 44);
  g.addColorStop(0, 'rgba(255,226,150,0.6)');
  g.addColorStop(1, 'rgba(255,226,150,0)');
  ctx.fillStyle = g;
  circle(ctx, lx, top + 6, 44);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.roundRect(lx - 7, top - 4, 14, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#8f7a6a';
  ctx.beginPath();
  ctx.roundRect(x + 40, groundY - 104, 10, 106, 4);
  ctx.fill();
  ctx.save();
  ctx.translate(x + 45, groundY - 86);
  ctx.rotate(0.05 + Math.sin(time * 0.8) * 0.01);
  ctx.fillStyle = '#fff6ea';
  ctx.strokeStyle = '#8f7a6a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(70, -20);
  ctx.lineTo(-58, -20);
  ctx.lineTo(-78, 0);
  ctx.lineTo(-58, 20);
  ctx.lineTo(70, 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Icefang Hamlet', 2, -4, 13, INK);
  text(ctx, 'ferry · fire', 2, 10, 10, '#8f6240');
  ctx.restore();
}
