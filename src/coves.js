// Docs: docs/places/coves.md
// Saltspray Coves (room COVES, data in src/shared/rpg.js): Greenhollow's south shore, along the shore path
// from the harbour. You come in at the EAST end (the harbour lies east) and walk west: Beachcomber Moss's
// driftwood shack in Driftwood Cove (no mobs), the Tide Pools (the tide post is a Keeper stone:
// src/ruins.js), then the Sea Stacks under a cliff, with the Tidemother's cave (src/dens-coves.js draws
// its mouth) and the flooded mouth of Wreck Cave (src/branch-gates.js) at the far end. A bright, breezy
// seaside; the sea fills the back of the view, with Emberdeep's smoke far off to the south. This room
// paints its own sky. Platforms: sea stacks and barnacled boulders (pillars to the sand), crates, Moss's roof.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { COVES_W, COVES_EXIT_X, COVES_ZONES, COVES_PLATFORMS, FIELD_GROUND, MOSS_X } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300;
const INK = '#5b4a6b';
const SHACK_X = MOSS_X + 90; // Moss's shack, just behind her (its roof is a platform)
const POOLS = [COVES_ZONES[1].x0, COVES_ZONES[1].x1];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
const clouds = (() => {
  const r = mulberry32(501);
  return Array.from({ length: 6 }, (_, i) => ({ x: i * 280 + r() * 140, y: 36 + r() * 100, s: 0.5 + r() * 0.7 }));
})();
const gulls = (() => {
  const r = mulberry32(503);
  return Array.from({ length: 7 }, () => ({ off: r() * 1600, y: 60 + r() * 170, v: 16 + r() * 22, s: 0.6 + r() * 0.5, p: r() * TAU }));
})();
const glints = (() => {
  const r = mulberry32(507);
  return Array.from({ length: 50 }, () => ({ x: r() * 2400, y: r(), w: 8 + r() * 22, p: r() * TAU }));
})();
const farStacks = (() => {
  const r = mulberry32(509);
  return Array.from({ length: 7 }, (_, i) => ({ x: i * 300 + r() * 160, w: 26 + r() * 30, h: 50 + r() * 70 }));
})();
const shells = (() => {
  const r = mulberry32(511);
  const out = [];
  for (let x = 200; x < COVES_W - 40; x += 30 + r() * 70) out.push({ x, dy: 6 + r() * 70, k: Math.floor(r() * 4), rot: r() * TAU, c: ['#ffd6c9', '#fff1e0', '#f6c8e0', '#ffe6b0'][Math.floor(r() * 4)] });
  return out;
})();
const pools = (() => {
  const r = mulberry32(513);
  const out = [];
  for (let x = POOLS[0] + 80; x < POOLS[1] - 120; x += 180 + r() * 160) out.push({ x, w: 50 + r() * 50, star: r() < 0.6, anem: r() < 0.6, p: r() * TAU });
  return out;
})();
const weed = (() => {
  const r = mulberry32(517);
  const out = [];
  for (let x = 160; x < COVES_W - 60; x += 60 + r() * 140) out.push({ x, h: 10 + r() * 14, p: r() * TAU });
  return out;
})();

// Everything behind the slimes. camX is the left edge of the view.
export function drawCoves(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time);
  ctx.restore();

  const L = camX - 80, R = camX + viewW + 80;
  drawSurf(ctx, Math.max(0, L), Math.min(COVES_W, R), time);
  if (visible(-60, 560, L, R)) drawCliff(ctx, time);
  drawSand(ctx, Math.max(0, L), Math.min(COVES_W, R), time);
  for (const p of pools) if (visible(p.x - p.w, p.x + p.w, L, R)) drawPool(ctx, p, time);
  if (visible(SHACK_X - 140, SHACK_X + 160, L, R)) drawShack(ctx, time);
  if (visible(COVES_EXIT_X - 160, COVES_W + 20, L, R)) drawShorePath(ctx, COVES_EXIT_X, time);
  COVES_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x1 - 70;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  for (const p of COVES_PLATFORMS) {
    if (!visible(p.x - 40, p.x + p.w + 40, L, R)) continue;
    if (p.kind === 'stack') drawStack(ctx, p, time);
    else if (p.kind === 'rock') drawBoulder(ctx, p, time);
    else if (p.kind === 'crates') drawCrates(ctx, p);
    // (the shack's roof is the shack)
  }
  drawWeed(ctx, L, R, time);
}

function drawSky(ctx, camX, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#7cc4f0');
  sky.addColorStop(0.7, '#bfe4f6');
  sky.addColorStop(1, '#f2f4ec');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (const c of clouds) {
    const x = ((c.x - camX * 0.05 + time * 7) % (W + 320) + W + 320) % (W + 320) - 160;
    ellipse(ctx, x, c.y, 56 * c.s, 16 * c.s);
    ellipse(ctx, x + 26 * c.s, c.y - 10 * c.s, 34 * c.s, 15 * c.s);
    ellipse(ctx, x - 30 * c.s, c.y - 4 * c.s, 26 * c.s, 11 * c.s);
  }
  drawDistantIslands(ctx, { from: 'greenSouth', scroll: camX, roomW: COVES_W, time, horizon: HORIZON, haze: '#eef2ea', fade: 0.5, scale: 0.6, sky: 250 });
  const sea = ctx.createLinearGradient(0, HORIZON, 0, GROUND);
  sea.addColorStop(0, '#9fd2e8');
  sea.addColorStop(1, '#4f9ccc');
  ctx.fillStyle = sea;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(0, HORIZON, W, 1.5);
  for (const gl of glints) {
    const y = HORIZON + 4 + gl.y * gl.y * (GROUND - HORIZON - 40);
    const x = ((gl.x - camX * (0.12 + gl.y * 0.5)) % W + W) % W;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.25 * Math.sin(time * 1.5 + gl.p)})`;
    ctx.fillRect(x, y, gl.w * (0.4 + gl.y), 1.6);
  }
  // sea stacks standing out in the water
  const span = 7 * 300;
  for (const s of farStacks) {
    const x = ((s.x - camX * 0.25) % span + span) % span - 120, base = HORIZON + 40;
    ctx.fillStyle = '#a7b4c4';
    ctx.beginPath();
    ctx.moveTo(x - s.w, base);
    ctx.quadraticCurveTo(x - s.w * 0.8, base - s.h, x - s.w * 0.2, base - s.h - 6);
    ctx.quadraticCurveTo(x + s.w * 0.6, base - s.h, x + s.w, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ellipse(ctx, x, base, s.w * 1.2, 3);
  }
  // gulls wheeling
  ctx.strokeStyle = 'rgba(91,74,107,0.55)';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (const b of gulls) {
    const x = ((b.off + time * b.v - camX * 0.2) % (W + 200) + W + 200) % (W + 200) - 100;
    const y = b.y + Math.sin(time * 0.7 + b.p) * 10, f = Math.sin(time * 4 + b.p) * 4 * b.s;
    ctx.beginPath();
    ctx.moveTo(x - 8 * b.s, y - f);
    ctx.quadraticCurveTo(x - 3 * b.s, y - 4 * b.s, x, y);
    ctx.quadraticCurveTo(x + 3 * b.s, y - 4 * b.s, x + 8 * b.s, y - f);
    ctx.stroke();
  }
}

// Waves running up the back of the beach and sliding back
function drawSurf(ctx, L, R, time) {
  if (R <= L) return;
  const wash = (x) => 418 + Math.sin(time * 0.9 + x * 0.006) * 6;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.moveTo(L, GROUND);
  for (let x = L; x <= R; x += 24) ctx.lineTo(x, wash(x) - 3);
  ctx.lineTo(R, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e9dcbc'; // wet sand under the wash
  ctx.beginPath();
  ctx.moveTo(L, GROUND);
  for (let x = L; x <= R; x += 24) ctx.lineTo(x, wash(x) + 3);
  ctx.lineTo(R, GROUND);
  ctx.closePath();
  ctx.fill();
}

// The cliff at the far west end: the Tidemother's cave and Wreck Cave open in its foot
function drawCliff(ctx, time) {
  ctx.fillStyle = '#9a94a2';
  ctx.beginPath();
  ctx.moveTo(-60, GROUND + 4);
  ctx.lineTo(-60, 0);
  ctx.lineTo(260, 0);
  ctx.quadraticCurveTo(420, 40, 470, 160);
  ctx.quadraticCurveTo(520, 300, 560, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#aaa4b2';
  for (const [x, y, rx, ry] of [[40, 80, 50, 70], [210, 60, 60, 40], [380, 150, 40, 80], [460, 300, 30, 70]]) ellipse(ctx, x, y, rx, ry, 0.2);
  // sea-pink and grass on the ledges, and a gull's nest
  ctx.fillStyle = '#8fbf6e';
  for (const [x, y] of [[290, 20], [420, 120], [496, 250]]) ellipse(ctx, x, y, 26, 6);
  ctx.fillStyle = '#ffb3c7';
  for (const [x, y] of [[282, 14], [300, 16], [430, 114], [488, 244]]) circle(ctx, x, y, 3);
  ctx.fillStyle = '#c8a87e';
  ellipse(ctx, 300, 186, 18, 6);
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 296, 178 + Math.sin(time * 2) * 1, 8, 6);
}

function drawSand(ctx, L, R, time) {
  if (R <= L) return;
  ctx.fillStyle = '#f2e2bc';
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = '#e8d4a8';
  ctx.fillRect(L, GROUND + 48, R - L, H - GROUND);
  ctx.fillStyle = '#fbf0d4';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 3, R - L + 8, 10, 5);
  ctx.fill();
  for (const s of shells) {
    if (s.x < L || s.x > R) continue;
    ctx.save();
    ctx.translate(s.x, GROUND + s.dy);
    ctx.rotate(s.rot);
    ctx.fillStyle = s.c;
    if (s.k === 0) {
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.quadraticCurveTo(0, -7, 5, 2);
      ctx.closePath();
      ctx.fill();
    } else if (s.k === 1) {
      ellipse(ctx, 0, 0, 4, 2.6);
    } else if (s.k === 2) {
      ctx.fillStyle = '#ffb08a'; // a starfish
      for (let i = 0; i < 5; i++) ellipse(ctx, Math.cos((i / 5) * TAU) * 3, Math.sin((i / 5) * TAU) * 3, 3, 1.4, (i / 5) * TAU);
    } else {
      ctx.fillStyle = '#c8bfb4';
      circle(ctx, 0, 0, 2.2);
    }
    ctx.restore();
  }
  void time;
}

function drawPool(ctx, p, time) {
  const g = ctx.createLinearGradient(0, GROUND - 2, 0, GROUND + 14);
  g.addColorStop(0, '#9fdcea');
  g.addColorStop(1, '#5eb4cc');
  ctx.fillStyle = '#c8b898';
  ellipse(ctx, p.x, GROUND + 5, p.w + 6, 11);
  ctx.fillStyle = g;
  ellipse(ctx, p.x, GROUND + 5, p.w, 8);
  ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.2 * Math.sin(time * 1.3 + p.p)})`;
  ellipse(ctx, p.x - p.w * 0.3, GROUND + 2, p.w * 0.3, 1.6);
  if (p.star) {
    ctx.fillStyle = '#ff9f7a';
    for (let i = 0; i < 5; i++) ellipse(ctx, p.x + p.w * 0.35 + Math.cos((i / 5) * TAU) * 4, GROUND + 7 + Math.sin((i / 5) * TAU) * 2, 4, 1.6, (i / 5) * TAU);
  }
  if (p.anem) {
    ctx.strokeStyle = '#f08ab8';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.35 + Math.sin(time * 2 + i + p.p) * 0.12;
      ctx.beginPath();
      ctx.moveTo(p.x - p.w * 0.3, GROUND + 6);
      ctx.lineTo(p.x - p.w * 0.3 + Math.cos(a) * 8, GROUND + 6 + Math.sin(a) * 8);
      ctx.stroke();
    }
  }
}

// A sea stack: a pillar of pale rock from the sand to its flat top (the platform), a grassy cap, a nest
function drawStack(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = '#a8a2b0';
  ctx.beginPath();
  ctx.moveTo(x + 18, GROUND + 4);
  ctx.quadraticCurveTo(x + 6, (y + GROUND) / 2, x, y + 8);
  ctx.lineTo(x + w, y + 8);
  ctx.quadraticCurveTo(x + w - 4, (y + GROUND) / 2, x + w - 16, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#bdb8c4';
  ctx.beginPath();
  ctx.roundRect(x + 14, y + 16, w * 0.22, GROUND - y - 20, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,112,130,0.6)';
  ctx.lineWidth = 2;
  for (let yy = y + 40; yy < GROUND - 10; yy += 34) {
    ctx.beginPath();
    ctx.moveTo(x + 10 + (yy % 20), yy);
    ctx.lineTo(x + w - 14 - (yy % 26), yy + 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#8fbf6e';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ffb3c7';
  for (let fx = x + 16; fx < x + w - 10; fx += 34) circle(ctx, fx, y - 4, 2.6);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; // gull droppings, tastefully
  for (let fx = x + 24; fx < x + w; fx += 52) ellipse(ctx, fx, y + 20, 3, 6);
  void time;
}

// A barnacled boulder on a rocky foot (the Tide Pools' platforms)
function drawBoulder(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = '#9a96a6';
  ctx.beginPath();
  ctx.roundRect(x + w * 0.3, y + 10, w * 0.4, GROUND - y - 6, 14);
  ctx.fill();
  ctx.fillStyle = '#b4aebe';
  ctx.beginPath();
  ctx.moveTo(x, y + 4);
  ctx.quadraticCurveTo(x + w / 2, y - 14, x + w, y + 4);
  ctx.quadraticCurveTo(x + w - 8, y + 30, x + w / 2, y + 34);
  ctx.quadraticCurveTo(x + 8, y + 30, x, y + 4);
  ctx.fill();
  ctx.fillStyle = '#e8e0d4';
  for (let bx = x + 20; bx < x + w - 14; bx += 26) {
    circle(ctx, bx, y + 18 + ((bx * 3) % 8), 3.2);
    ctx.fillStyle = '#b8aca0';
    circle(ctx, bx, y + 18 + ((bx * 3) % 8), 1.3);
    ctx.fillStyle = '#e8e0d4';
  }
  ctx.fillStyle = '#6a9a5a'; // seaweed hanging off it
  for (let wx = x + 14; wx < x + w; wx += 40) ellipse(ctx, wx, y + 30, 3, 9, Math.sin(time * 1.4 + wx) * 0.2);
}

function drawCrates(ctx, p) {
  const { x, y, w } = p;
  for (const [cx, cy, s] of [[x + 4, GROUND - 46, 46], [x + 50, GROUND - 46, 46], [x + 26, y, 46]]) {
    ctx.fillStyle = '#c99b6b';
    ctx.strokeStyle = '#8f6240';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx, cy, s, Math.min(s, GROUND - cy), 4);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + s, cy + s);
    ctx.stroke();
  }
  void w;
}

// Beachcomber Moss's shack: driftwood planks, a tin roof (the platform), floats, bottles and shell strings
function drawShack(ctx, time) {
  const roof = COVES_PLATFORMS.find((p) => p.kind === 'shack'), x0 = roof.x + 6, x1 = roof.x + roof.w - 6, top = roof.y + 10;
  ctx.fillStyle = '#d8c4a4';
  ctx.fillRect(x0, top, x1 - x0, GROUND - top);
  ctx.strokeStyle = '#a8906e';
  ctx.lineWidth = 2;
  for (let x = x0 + 14; x < x1; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + ((x * 7) % 5) - 2, GROUND);
    ctx.stroke();
  }
  // door and a round porthole window
  ctx.fillStyle = '#8a6a4a';
  ctx.beginPath();
  ctx.roundRect(x0 + 18, GROUND - 74, 40, 74, [12, 12, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#bfe0f0';
  circle(ctx, x1 - 34, top + 44, 15);
  ctx.strokeStyle = '#c9a64a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x1 - 34, top + 44, 15, 0, TAU);
  ctx.stroke();
  // the tin roof
  ctx.fillStyle = '#9fb4c4';
  ctx.strokeStyle = '#7a8ea0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(roof.x - 6, roof.y - 4, roof.w + 12, 14, 4);
  ctx.fill();
  ctx.stroke();
  for (let x = roof.x; x < roof.x + roof.w; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, roof.y - 3);
    ctx.lineTo(x, roof.y + 9);
    ctx.stroke();
  }
  // floats on a line, shell strings, bottles on a shelf
  ctx.strokeStyle = '#8a7a60';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x0 - 40, top + 10);
  ctx.quadraticCurveTo(x0 - 20, top + 24, x0, top + 6);
  ctx.stroke();
  for (const [fx, c] of [[x0 - 34, '#ff8f8f'], [x0 - 20, '#ffd66a'], [x0 - 8, '#8fd0ff']]) {
    ctx.fillStyle = c;
    circle(ctx, fx, top + 18 + Math.sin(time * 1.5 + fx) * 1.5, 5);
  }
  for (let i = 0; i < 3; i++) {
    const sx = x0 + 70 + i * 14;
    ctx.strokeStyle = '#a8906e';
    ctx.beginPath();
    ctx.moveTo(sx, top);
    ctx.lineTo(sx + Math.sin(time * 1.2 + i) * 2, top + 40);
    ctx.stroke();
    ctx.fillStyle = ['#ffd6c9', '#fff1e0', '#f6c8e0'][i];
    for (let k = 0; k < 4; k++) circle(ctx, sx + Math.sin(time * 1.2 + i) * (k / 4) * 2, top + 8 + k * 10, 3);
  }
  ctx.fillStyle = '#a8906e';
  ctx.fillRect(x1 + 2, GROUND - 60, 46, 5);
  for (const [bx, c, h] of [[x1 + 8, '#7fc4a0', 18], [x1 + 22, '#8fb8e8', 14], [x1 + 36, '#c8e8b0', 20]]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(bx - 5, GROUND - 60 - h, 10, h, 3);
    ctx.fill();
    ctx.fillRect(bx - 2, GROUND - 66 - h, 4, 7);
  }
  // her basket by the door
  ctx.fillStyle = '#c8a06a';
  ctx.beginPath();
  ctx.roundRect(x0 - 30, GROUND - 22, 30, 22, [4, 4, 10, 10]);
  ctx.fill();
  ctx.strokeStyle = '#a07a48';
  ctx.beginPath();
  ctx.arc(x0 - 15, GROUND - 22, 13, Math.PI, 0);
  ctx.stroke();
}

// The shore path back to the harbour, at the east end
function drawShorePath(ctx, x, time) {
  ctx.fillStyle = '#8f6240';
  ctx.fillRect(x - 42, GROUND - 92, 6, 92);
  ctx.save();
  ctx.translate(x - 39, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.02);
  ctx.fillStyle = '#e2bf8f';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-50, -12);
  ctx.lineTo(56, -12);
  ctx.lineTo(68, 0);
  ctx.lineTo(56, 12);
  ctx.lineTo(-50, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'The Harbour', 6, 1, 11, INK);
  ctx.restore();
}

function drawZoneSign(ctx, x, z, i, time) {
  const board = ['#7a9ac0', '#6fc0c8'][i], edge = ['#4a6a94', '#3e8c96'][i];
  ctx.fillStyle = '#a8906e';
  ctx.beginPath();
  ctx.roundRect(x - 4, GROUND - 92, 8, 94, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 70);
  ctx.rotate(Math.sin(time * 1.1 + i) * 0.02);
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(120, ctx.measureText(z.name).width + 28);
  ctx.fillStyle = board;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -24, tw, 46, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#ffffff');
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.roundRect(-30, 2, 60, 15, 7.5);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 10, 11, edge);
  ctx.fillStyle = '#fff1e0'; // a shell perched on the board
  ctx.beginPath();
  ctx.moveTo(tw / 2 - 26, -24);
  ctx.quadraticCurveTo(tw / 2 - 18, -38, tw / 2 - 10, -24);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWeed(ctx, L, R, time) {
  ctx.strokeStyle = '#7aa85e';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const g of weed) {
    if (g.x < L || g.x > R) continue;
    for (let i = -1; i <= 1; i++) {
      const sway = Math.sin(time * 1.4 + g.p + i) * 3;
      ctx.beginPath();
      ctx.moveTo(g.x + i * 4, GROUND + 2);
      ctx.quadraticCurveTo(g.x + i * 6, GROUND - g.h * 0.6, g.x + i * 8 + sway, GROUND - g.h);
      ctx.stroke();
    }
  }
}
