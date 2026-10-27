// Docs: docs/places/coast.md
// The Smoking Coast (room COAST, data in src/shared/rpg.js): Emberdeep's south shore, down the gully off Cinder Flats,
// where the lava still runs into the sea. Pillow lava, walls of steam where the flows meet the surf, new black land
// still steaming (the one place in the game where land grows), warm grey-green surf, sea stacks. You come in at the
// EAST end and walk west toward the lava: the Glass Beach (no mobs: black sand glittering with glass, Liv's shelter
// and workbench, the Landing Stone, drawn by src/ruins.js, and the waystone, src/waystones.js), the Warm Surf, the
// Pillow Shelf (sea stacks; the tallest has Liv's Lookout on top, last in COAST_PLATFORMS) and the Lava Front, with
// the old sea cliff behind it (the Drained Tubes' old tube mouth in it, drained and open: src/branch-gates.js) and, at the far
// west end, the warm nesting sand by HATCH_DEN_X where the Hatchkeeper's den opens (its mouth, a hollow in the
// sand bank, is her den theme's ENTRANCE_ART in src/dens-hatch.js). Behind: a low hazy sky, the open sea to the south with nothing on it, the island's smoke column leaning over
// from the north. Paints its own sky.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { COAST_W, COAST_EXIT_X, COAST_ZONES, COAST_PLATFORMS, HATCH_DEN_X, LIV_X, FIELD_GROUND } from './shared/rpg.js';

const GROUND = FIELD_GROUND;
const HORIZON = 290;
const LOOKOUT = COAST_PLATFORMS.at(-1);
const SHELTER = COAST_PLATFORMS.find((p) => p.kind === 'shelter');
const ROCK = '#2e2a32', ROCK_D = '#1a171e', ROCK_L = '#4a4450';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
// steam drifting across the whole view, thicker toward the lava (west)
const drift = (() => {
  const r = mulberry32(5611);
  return Array.from({ length: 26 }, () => ({ x: r() * W, y: 120 + r() * 300, r: 30 + r() * 50, v: 6 + r() * 10, p: r() * TAU }));
})();
// far sea stacks on the horizon (parallax), x in a 1800 px loop
const farStacks = (() => {
  const r = mulberry32(5613);
  return Array.from({ length: 9 }, () => ({ x: r() * 1800, w: 16 + r() * 26, h: 20 + r() * 50 }));
})();
// where the lava meets the sea: steam walls (world x), biggest at the far west
const STEAM_WALLS = [{ x: 120, s: 1.4 }, { x: 760, s: 1.1 }, { x: 1380, s: 0.8 }, { x: 2200, s: 0.5 }];
// glowing lava runnels in the ground at the Lava Front (drawing only), and the new black land steaming
const RUNNELS = [{ x: 470, w: 60 }, { x: 980, w: 40 }, { x: 1180, w: 34 }, { x: 1460, w: 26 }];
// glass glitter on the Glass Beach
const GLITTER = (() => {
  const r = mulberry32(5617);
  return Array.from({ length: 60 }, () => ({ x: 4200 + r() * (COAST_W - 4200), y: GROUND + 4 + r() * 60, p: r() * TAU }));
})();
// pillow lava lumps along the ground (behind the slimes)
const LUMPS = (() => {
  const r = mulberry32(5619);
  const out = [];
  for (let x = 60; x < 4200; x += 90 + r() * 160) out.push({ x, w: 30 + r() * 50, h: 12 + r() * 20 });
  return out;
})();

// Everything on the Smoking Coast behind the slimes
export function drawCoast(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0); // sky and sea in screen space
  drawSky(ctx, camX, time);
  ctx.restore();

  const L = camX - 160, R = camX + viewW + 160;
  if (visible(0, 1520, L, R)) drawSeaCliff(ctx, Math.max(0, L), Math.min(1520, R));
  for (const s of STEAM_WALLS) if (visible(s.x - 300, s.x + 300, L, R)) drawSteamWall(ctx, s, time);
  drawGround(ctx, Math.max(0, L), Math.min(COAST_W, R), time);
  for (const r of RUNNELS) if (visible(r.x - 40, r.x + r.w + 40, L, R)) drawRunnel(ctx, r, time);
  if (visible(HATCH_DEN_X - 260, HATCH_DEN_X + 260, L, R)) drawNestingSand(ctx, time);
  for (const p of LUMPS) if (visible(p.x - 40, p.x + p.w + 40, L, R)) drawLump(ctx, p);
  if (visible(LOOKOUT.x - 60, LOOKOUT.x + LOOKOUT.w + 60, L, R)) drawLookout(ctx, LOOKOUT, time);
  for (const p of COAST_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'pillow') drawPillow(ctx, p);
    else if (p.kind === 'stack') drawStack(ctx, p);
    else if (p.kind === 'flow') drawFlow(ctx, p, time);
  }
  if (visible(SHELTER.x - 220, SHELTER.x + SHELTER.w + 80, L, R)) drawShelter(ctx, SHELTER, time);
  if (visible(4200, COAST_W, L, R)) drawGlitter(ctx, L, R, time);
  COAST_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x1 - 30; // you walk in from the east: each zone's sign stands at its east edge
    if (visible(sx - 90, sx + 90, L, R)) drawZoneSign(ctx, sx, z, i);
  });
  if (visible(COAST_EXIT_X - 260, COAST_W, L, R)) drawExitSign(ctx, COAST_EXIT_X - 110, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawAir(ctx, camX, time);
  ctx.restore();
}

// ——— the sky and the sea ———
let skyGrad = null, seaGrad = null, gradCtx = null;
function drawSky(ctx, camX, time) {
  if (gradCtx !== ctx) {
    gradCtx = ctx;
    skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON);
    skyGrad.addColorStop(0, '#6a6676');
    skyGrad.addColorStop(0.55, '#a8a2ae');
    skyGrad.addColorStop(1, '#d8d0cc');
    seaGrad = ctx.createLinearGradient(0, HORIZON, 0, GROUND);
    seaGrad.addColorStop(0, '#8a9e98');
    seaGrad.addColorStop(1, '#4e6a68');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  // the island's smoke column, leaning over from the north (behind you)
  const sx = W * 0.2 - camX * 0.03 + 260;
  for (let i = 0; i < 12; i++) {
    const k = (i / 12 + time * 0.008) % 1;
    ctx.fillStyle = `rgba(86,78,88,${0.35 * (1 - k * 0.6)})`;
    circle(ctx, sx + k * k * 340 + Math.sin(i * 1.7 + time * 0.2) * 14, -40 + k * 60, 40 + k * 70);
  }
  // the sea: open to the south, nothing on it as far as you can see
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, HORIZON, W, GROUND - HORIZON);
  ctx.fillStyle = 'rgba(250,246,240,0.45)';
  ctx.fillRect(0, HORIZON, W, 1.2);
  // far stacks on the horizon
  for (const s of farStacks) {
    const x = ((((s.x - camX * 0.06) % 1800) + 1800) % 1800) - 200;
    if (x < -60 || x > W + 60) continue;
    ctx.fillStyle = '#6a7478';
    ctx.beginPath();
    ctx.moveTo(x, HORIZON + 2);
    ctx.lineTo(x + 3, HORIZON - s.h);
    ctx.lineTo(x + s.w - 3, HORIZON - s.h + 4);
    ctx.lineTo(x + s.w, HORIZON + 2);
    ctx.closePath();
    ctx.fill();
  }
  // swells rolling in
  ctx.strokeStyle = 'rgba(230,236,230,0.3)';
  ctx.lineWidth = 1.4;
  for (let row = 0; row < 6; row++) {
    const y = HORIZON + 14 + row * row * 4.4;
    const off = ((camX * (0.1 + row * 0.05) - time * (8 + row * 3)) % 140 + 140) % 140;
    ctx.beginPath();
    for (let x = -off; x < W + 140; x += 140) {
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 30, y - 2 - row * 0.4, x + 60, y);
    }
    ctx.stroke();
  }
  // a low bank of haze along the water
  for (let i = 0; i < 5; i++) {
    const x = ((((i * 430 - camX * 0.08 + time * 5) % 2150) + 2150) % 2150) - 300;
    ctx.fillStyle = 'rgba(220,214,214,0.3)';
    ellipse(ctx, x, HORIZON - 6 + (i % 2) * 8, 200, 14);
  }
}

// A wall of steam where a lava flow meets the surf: billows rolling up and leaning off on the wind
function drawSteamWall(ctx, s, time) {
  for (let i = 0; i < 9; i++) {
    const k = (time * 0.07 + i / 9) % 1;
    const a = 0.42 * Math.sin(k * Math.PI);
    ctx.fillStyle = `rgba(244,240,238,${a})`;
    circle(ctx, s.x + Math.sin(i * 2.1 + time * 0.3) * 40 * s.s + k * 120 * s.s, GROUND - 20 - k * 360 * s.s, (50 + k * 90) * s.s);
  }
  // the glow at its foot, where the lava goes in
  const pulse = 0.5 + 0.2 * Math.sin(time * 2 + s.x);
  ctx.fillStyle = `rgba(255,120,60,${0.35 * pulse * s.s})`;
  ellipse(ctx, s.x, GROUND - 6, 70 * s.s, 10 * s.s);
}

// The old sea cliff behind the Lava Front: dark, columned rock (the Drained Tubes' mouth is cut in it)
function drawSeaCliff(ctx, L, R) {
  ctx.fillStyle = '#3a3440';
  ctx.beginPath();
  ctx.moveTo(L, GROUND);
  for (let x = Math.floor(L / 40) * 40; x <= R + 40; x += 40) {
    const fall = Math.max(0, (x - 1200) / 320); // the cliff ends east of the Lava Front
    ctx.lineTo(x, GROUND - 210 + fall * 200 + Math.sin(x * 0.013) * 12);
  }
  ctx.lineTo(R + 40, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a2630';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = Math.floor(L / 46) * 46; x < Math.min(R, 1300); x += 46) {
    ctx.moveTo(x, GROUND - 190 + Math.sin(x * 0.013) * 12);
    ctx.lineTo(x + 4, GROUND);
  }
  ctx.stroke();
}

// ——— the ground ———
// Black rock, wet at the edge of the surf; at the west end, new land still red in its cracks; on the Glass Beach,
// black sand
function drawGround(ctx, L, R, time) {
  if (R <= L) return;
  ctx.fillStyle = ROCK;
  ctx.fillRect(L, GROUND - 4, R - L, H - GROUND + 4);
  ctx.fillStyle = ROCK_L;
  ctx.beginPath();
  ctx.moveTo(L, GROUND + 2);
  for (let x = Math.floor(L / 30) * 30; x <= R + 30; x += 30) ctx.lineTo(x, GROUND - 3 + Math.sin(x * 0.07) * 1.8);
  ctx.lineTo(R + 30, GROUND + 6);
  ctx.lineTo(L, GROUND + 6);
  ctx.closePath();
  ctx.fill();
  // ropy wrinkles in the old flows
  ctx.strokeStyle = 'rgba(80,72,86,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = Math.floor(L / 80) * 80; x < Math.min(R, 4200); x += 80) {
    const k = Math.sin(x * 1.37) * 0.5 + 0.5;
    ctx.moveTo(x, GROUND + 14 + k * 26);
    ctx.quadraticCurveTo(x + 20, GROUND + 6 + k * 26, x + 44, GROUND + 14 + k * 26);
  }
  ctx.stroke();
  // the new land at the far west: still hot, red in the cracks
  if (L < 900) {
    const pulse = 0.5 + 0.3 * Math.sin(time * 1.7);
    ctx.strokeStyle = `rgba(255,110,60,${pulse})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const r = mulberry32(5621);
    for (let i = 0; i < 18; i++) {
      const x = r() * 900, y = GROUND + 10 + r() * 70;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 10 + r() * 14, y + (r() - 0.5) * 8);
      ctx.lineTo(x + 18 + r() * 14, y + (r() - 0.5) * 10);
    }
    ctx.stroke();
  }
  // the Glass Beach: black sand
  if (R > 4200) {
    const x0 = Math.max(L, 4200);
    ctx.fillStyle = '#26222a';
    ctx.fillRect(x0, GROUND - 2, R - x0, H - GROUND + 2);
    ctx.fillStyle = '#3a3640';
    ctx.fillRect(x0, GROUND - 3, R - x0, 4);
  }
}
function drawRunnel(ctx, r, time) {
  const pulse = 0.7 + 0.2 * Math.sin(time * 2.4 + r.x);
  ctx.fillStyle = `rgba(255,140,70,${pulse})`;
  ctx.beginPath();
  ctx.ellipse(r.x + r.w / 2, GROUND + 3, r.w / 2, 3.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = `rgba(255,220,130,${pulse * 0.8})`;
  ctx.beginPath();
  ctx.ellipse(r.x + r.w / 2, GROUND + 3, r.w / 3, 1.5, 0, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 2; i++) {
    const k = (time * 0.4 + i / 2 + r.x * 0.01) % 1;
    ctx.fillStyle = `rgba(240,236,236,${0.35 * Math.sin(k * Math.PI)})`;
    circle(ctx, r.x + r.w * (0.3 + i * 0.4), GROUND - 6 - k * 50, 6 + k * 10);
  }
}

// The nesting sand at the far west, kept hot by the lava under it: dark warm sand banked against the cliff, steam
// seeping up, iguana tracks going in and out. (The Hatchkeeper's den mouth is drawn over it: src/dens-hatch.js.)
function drawNestingSand(ctx, time) {
  const x = HATCH_DEN_X;
  ctx.fillStyle = '#4a3e3c';
  ctx.beginPath();
  ctx.moveTo(x - 240, GROUND + 4);
  ctx.quadraticCurveTo(x - 160, GROUND - 26, x, GROUND - 30);
  ctx.quadraticCurveTo(x + 170, GROUND - 26, x + 240, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,140,90,0.12)';
  ellipse(ctx, x, GROUND - 10, 170, 16);
  // tracks: little three-toed prints and a tail drag
  ctx.strokeStyle = 'rgba(30,24,26,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const tx = x - 200 + i * 46, ty = GROUND - 10 - Math.sin(i * 0.9) * 6;
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + 4, ty - 3);
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + 5, ty);
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + 4, ty + 3);
  }
  ctx.moveTo(x - 210, GROUND - 4);
  ctx.quadraticCurveTo(x, GROUND - 14, x + 210, GROUND - 4);
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.22 + i / 4) % 1;
    ctx.fillStyle = `rgba(240,236,236,${0.3 * Math.sin(k * Math.PI)})`;
    circle(ctx, x - 150 + i * 100 + Math.sin(k * 4 + i) * 8, GROUND - 24 - k * 70, 8 + k * 12);
  }
}

function drawLump(ctx, p) {
  ctx.fillStyle = ROCK_L;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, GROUND, p.w / 2, p.h, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ellipse(ctx, p.x + p.w * 0.4, GROUND - p.h * 0.6, p.w * 0.2, p.h * 0.2);
}

// A mound of pillow lava (a platform): round black pillows heaped up, the top one flat enough to stand on
function drawPillow(ctx, p) {
  const top = p.y, bottom = GROUND + 2;
  ctx.fillStyle = ROCK;
  ctx.beginPath();
  ctx.moveTo(p.x - 14, bottom);
  ctx.quadraticCurveTo(p.x - 10, top + 10, p.x + 10, top);
  ctx.lineTo(p.x + p.w - 10, top);
  ctx.quadraticCurveTo(p.x + p.w + 10, top + 10, p.x + p.w + 14, bottom);
  ctx.closePath();
  ctx.fill();
  // the pillows
  const n = Math.round(p.w / 50);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < n; i++) {
      const cx = p.x + (i + 0.5 + (row % 2) * 0.4) * (p.w / n) - (row % 2) * 10;
      const cy = top + 22 + row * ((bottom - top - 22) / 3);
      ctx.fillStyle = row % 2 ? '#38323c' : '#423c48';
      ctx.beginPath();
      ctx.ellipse(cx, cy, p.w / n / 2 - 2, (bottom - top) / 7, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = ROCK_D;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#5e5664';
  ctx.beginPath();
  ctx.roundRect(p.x, top - 4, p.w, 9, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; // salt where the spray dries
  for (const k of [0.2, 0.5, 0.8]) ellipse(ctx, p.x + p.w * k, top + 1, 5, 1.5);
}

// A sea stack (a platform): a column of black basalt standing out of the surf, foam round its foot
function stackColumn(ctx, x, w, top) {
  ctx.fillStyle = 'rgba(250,244,236,0.35)';
  ellipse(ctx, x + w / 2, GROUND + 6, w * 0.7, 6);
  ctx.fillStyle = '#3e3844';
  ctx.beginPath();
  ctx.moveTo(x - 14, GROUND + 4);
  ctx.lineTo(x - 2, top + 4);
  ctx.lineTo(x + w + 2, top + 4);
  ctx.lineTo(x + w + 14, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#24202a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 5; i++) {
    const k = i / 5;
    ctx.moveTo(x + w * k, top + 8);
    ctx.lineTo(x - 12 + (w + 24) * k, GROUND);
  }
  for (let y = top + 40; y < GROUND - 10; y += 46) {
    ctx.moveTo(x + 2, y);
    ctx.lineTo(x + w - 2, y + 6);
  }
  ctx.stroke();
  ctx.fillStyle = '#5e5664';
  ctx.beginPath();
  ctx.roundRect(x - 4, top - 2, w + 8, 9, 4);
  ctx.fill();
}
function drawStack(ctx, p) {
  stackColumn(ctx, p.x, p.w, p.y);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; // seabird whitewash
  for (const k of [0.25, 0.6, 0.85]) ellipse(ctx, p.x + p.w * k, p.y + 12, 6, 3);
}

// A cooled lava flow ledge (a platform): a black lip of rock over a hollow, still faintly red underneath
function drawFlow(ctx, p, time) {
  const top = p.y, bottom = GROUND + 2;
  ctx.fillStyle = ROCK;
  ctx.beginPath();
  ctx.moveTo(p.x + 6, top);
  ctx.lineTo(p.x + p.w - 6, top);
  ctx.quadraticCurveTo(p.x + p.w + 12, top + 10, p.x + p.w - 10, top + 40);
  ctx.lineTo(p.x + p.w * 0.72, bottom);
  ctx.lineTo(p.x + p.w * 0.28, bottom);
  ctx.lineTo(p.x + 10, top + 40);
  ctx.quadraticCurveTo(p.x - 12, top + 10, p.x + 6, top);
  ctx.closePath();
  ctx.fill();
  const pulse = 0.4 + 0.2 * Math.sin(time * 1.8 + p.x);
  ctx.fillStyle = `rgba(255,110,60,${pulse})`;
  ctx.beginPath();
  ctx.ellipse(p.x + p.w / 2, top + 12, p.w * 0.36, 4, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#5e5664';
  ctx.beginPath();
  ctx.roundRect(p.x + 2, top - 4, p.w - 4, 8, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,26,34,0.8)'; // ropy surface
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = p.x + 16; x < p.x + p.w - 16; x += 22) {
    ctx.moveTo(x, top);
    ctx.quadraticCurveTo(x + 6, top - 3, x + 12, top);
  }
  ctx.stroke();
}

// Liv's Lookout: the tallest stack, standing behind its shoulder (the platform before it), its top flat; a row of
// little black-glass birds along the north edge, copied from Skaldi's driftwood ones, all looking the same way
// (north, home), and a worn sitting place with a cup
function drawLookout(ctx, p, time) {
  stackColumn(ctx, p.x, p.w, p.y);
  // the birds: little cut-glass seabirds, each a bit better made than the last
  for (let i = 0; i < 6; i++) {
    const bx = p.x + 8 + i * 13, by = p.y - 1;
    ctx.fillStyle = '#16141c';
    ctx.beginPath();
    ctx.moveTo(bx - 5, by);
    ctx.quadraticCurveTo(bx - 4, by - 7, bx + 1, by - 7);
    ctx.lineTo(bx + 4, by - 9);
    ctx.lineTo(bx + 3, by - 6);
    ctx.quadraticCurveTo(bx + 5, by - 2, bx + 3, by);
    ctx.closePath();
    ctx.fill();
    const k = Math.max(0, Math.sin(time * 0.9 + i * 1.3));
    ctx.fillStyle = `rgba(154,220,232,${0.25 + 0.5 * k})`;
    circle(ctx, bx - 1, by - 5, 0.9);
  }
  // a worn sitting place and a tin cup
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ellipse(ctx, p.x + p.w - 14, p.y + 1, 10, 2);
  ctx.fillStyle = '#c8c4cc';
  ctx.strokeStyle = '#5e5a66';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(p.x + p.w - 8, p.y - 8, 6, 8, 1.5);
  ctx.fill();
  ctx.stroke();
}

// Liv's shelter: a lean-to of driftwood and an old iron sheet against a basalt boulder (its roof a platform), a
// workbench of a flat stone in front with black glass blocks and a row of knapped blades, a tub of seawater for
// quenching, steam off it, and a little raft drawn up on the sand
function drawShelter(ctx, p, time) {
  const top = p.y, bottom = GROUND + 2;
  ctx.fillStyle = '#3e3844'; // the boulder behind
  ctx.beginPath();
  ctx.ellipse(p.x + p.w * 0.7, bottom, p.w * 0.5, bottom - top + 24, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#7a6a5a'; // driftwood poles
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x + 8, bottom);
  ctx.lineTo(p.x + 14, top + 4);
  ctx.moveTo(p.x + p.w * 0.5, bottom);
  ctx.lineTo(p.x + p.w * 0.5, top + 4);
  ctx.stroke();
  ctx.fillStyle = '#6a6470'; // the iron roof sheet, rippled
  ctx.beginPath();
  ctx.roundRect(p.x - 6, top - 4, p.w + 12, 9, 2);
  ctx.fill();
  ctx.strokeStyle = '#4e4a56';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = p.x; x < p.x + p.w + 6; x += 10) {
    ctx.moveTo(x, top - 3);
    ctx.lineTo(x, top + 4);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,80,50,0.4)'; // rust
  ellipse(ctx, p.x + p.w * 0.3, top + 1, 14, 3);
  // the workbench, west of the shelter (Liv stands at it)
  const bx = LIV_X - 80;
  ctx.fillStyle = '#4a4450';
  ctx.beginPath();
  ctx.roundRect(bx - 40, GROUND - 30, 80, 10, 3);
  ctx.fill();
  ctx.fillStyle = '#3a3440';
  ctx.fillRect(bx - 32, GROUND - 20, 12, 20);
  ctx.fillRect(bx + 20, GROUND - 20, 12, 20);
  ctx.fillStyle = '#16141c'; // black glass blocks
  ctx.beginPath();
  ctx.moveTo(bx - 34, GROUND - 30);
  ctx.lineTo(bx - 30, GROUND - 44);
  ctx.lineTo(bx - 16, GROUND - 46);
  ctx.lineTo(bx - 12, GROUND - 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(154,220,232,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx - 30, GROUND - 42);
  ctx.lineTo(bx - 17, GROUND - 44);
  ctx.stroke();
  for (let i = 0; i < 4; i++) { // knapped blades laid out in a row
    ctx.fillStyle = '#1e1c26';
    ctx.beginPath();
    ctx.moveTo(bx - 4 + i * 10, GROUND - 31);
    ctx.lineTo(bx - 1 + i * 10, GROUND - 52 + i * 2);
    ctx.lineTo(bx + 2 + i * 10, GROUND - 31);
    ctx.closePath();
    ctx.fill();
  }
  // the quench tub
  const tx = SHELTER.x - 30;
  ctx.fillStyle = '#5a4a40';
  ctx.beginPath();
  ctx.roundRect(tx - 18, GROUND - 22, 36, 22, 4);
  ctx.fill();
  ctx.fillStyle = '#5e7a78';
  ellipse(ctx, tx, GROUND - 22, 16, 3);
  for (let i = 0; i < 2; i++) {
    const k = (time * 0.3 + i / 2) % 1;
    ctx.fillStyle = `rgba(245,242,240,${0.4 * Math.sin(k * Math.PI)})`;
    circle(ctx, tx - 4 + i * 8, GROUND - 26 - k * 40, 5 + k * 8);
  }
  // the little raft, drawn up on the sand east of the shelter
  const rx = p.x + p.w + 40;
  ctx.fillStyle = '#7a6a5a';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.roundRect(rx + i * 9, GROUND - 8, 8, 10, 3);
    ctx.fill();
  }
  ctx.strokeStyle = '#2a2428';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(rx - 2, GROUND - 4);
  ctx.lineTo(rx + 46, GROUND - 4);
  ctx.stroke();
}

function drawGlitter(ctx, L, R, time) {
  for (const g of GLITTER) {
    if (g.x < L || g.x > R) continue;
    const k = Math.max(0, Math.sin(time * 1.6 + g.p));
    if (k < 0.4) continue;
    ctx.fillStyle = `rgba(190,230,240,${(k - 0.4) * 1.2})`;
    circle(ctx, g.x, g.y, 1.2);
  }
}

function drawZoneSign(ctx, x, z, i) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(140, ctx.measureText(z.name).width + 30);
  ctx.fillStyle = '#4a3e3a';
  ctx.fillRect(x - tw / 2 + 10, GROUND - 92, 5, 92);
  ctx.fillRect(x + tw / 2 - 15, GROUND - 92, 5, 92);
  ctx.save();
  ctx.translate(x, GROUND - 66);
  ctx.fillStyle = '#b0a090';
  ctx.strokeStyle = '#3a302c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 46, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; // salt crust
  ellipse(ctx, -tw / 2 + 18, 18, 16, 5);
  text(ctx, z.name, 0, -6, 15, '#3a2a26');
  const red = i === 0;
  ctx.fillStyle = red ? '#d0485a' : 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-32, 6, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 14.5, 11, red ? '#fffaf0' : '#3a2a26');
  ctx.restore();
}

// The way back up the gully
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = '#4a3a34';
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.6) * 0.03);
  ctx.fillStyle = '#c8b498';
  ctx.strokeStyle = '#6a4a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-64, -12);
  ctx.lineTo(58, -12);
  ctx.lineTo(70, 0);
  ctx.lineTo(58, 12);
  ctx.lineTo(-64, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Cinder Flats', 0, 1, 12, '#4a3440');
  ctx.fillStyle = '#d0485a';
  ctx.fillRect(-3, 12, 6, 10);
  ctx.restore();
}

// Steam drifting through, thicker toward the lava, and the odd spark
function drawAir(ctx, camX, time) {
  const west = Math.max(0, 1 - camX / 3000); // 1 at the lava, 0 on the beach
  for (const d of drift) {
    const x = ((((d.x - camX * 0.5 + time * d.v) % (W + 200)) + W + 200) % (W + 200)) - 100;
    const a = (0.06 + 0.12 * west) * (0.6 + 0.4 * Math.sin(time * 0.5 + d.p));
    ctx.fillStyle = `rgba(245,242,240,${a})`;
    circle(ctx, x, d.y + Math.sin(time * 0.4 + d.p) * 10, d.r);
  }
  if (west > 0.4) {
    for (let i = 0; i < 6; i++) {
      const k = (time * 0.35 + i / 6) % 1;
      ctx.fillStyle = `rgba(255,170,90,${0.7 * Math.sin(k * Math.PI) * west})`;
      circle(ctx, ((i * 173 + time * 20) % W), H - 40 - k * 300, 1.4);
    }
  }
}
