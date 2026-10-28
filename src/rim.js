// Docs: docs/places/rim.md
// The Caldera Rim (room RIM, data in src/shared/rpg.js): Emberdeep's heart, the volcano's rim round the crater, up the
// Bearers' stair from the top (west) end of the Brimstone Fields. Wind, black glass and basalt; far down inside, a
// turquoise crater lake and the vent, the column roaring up out of it past the rim; and the Aether Citadel circling
// close overhead. You come in at the EAST end (the Stair Head: the top of the stair, the Hoist Stone, drawn by
// src/ruins.js, and the waystone, src/waystones.js) and go west along the rim: the Windward Lip, the Glass Slopes and
// the High Rim, which ends at the rim's highest point and the old hoist frame there (BRENNA_DEN_X: the way into the
// Bearer's Hoist, Brenna's den, its cleft and sign drawn by src/dens-rim.js). The Bearer's Seat, a ledge on top of a
// crag over the High Rim (last in RIM_PLATFORMS), is the find: a worn place and strap marks, and since E4b the tooth
// Brenna set down there when she was freed, on its left half (drawTooth, src/dens-rim.js).
// Harsh up here, almost no warmth: slate sky, grit in the wind, iron; soft and rounded still. Paints its own sky.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { RIM_W, RIM_EXIT_X, RIM_ZONES, RIM_PLATFORMS, BRENNA_DEN_X, FIELD_GROUND } from './shared/rpg.js';
import { drawTooth } from './dens-rim.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300;
const SEAT = RIM_PLATFORMS.at(-1);
const BAS = '#3a3438', BAS_D = '#221e22', BAS_L = '#5a5258';
const GLASS = '#1c1a22', GLASS_L = '#6a6a84';
const IRON = '#6e6870', IRON_D = '#3e3a42', RUST = '#7a4a34';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
// grit streaming across the view on the wind
const GRIT = (() => {
  const r = mulberry32(6101);
  return Array.from({ length: 40 }, () => ({ x: r() * W, y: 60 + r() * 400, l: 10 + r() * 26, v: 140 + r() * 120, a: 0.12 + r() * 0.18 }));
})();
// black glass glints and pale pumice crumbs along the ground (world x)
const BITS = (() => {
  const r = mulberry32(6103);
  const out = [];
  for (let x = 30; x < RIM_W; x += 40 + r() * 90) out.push({ x, glass: r() < 0.55, s: 0.6 + r() * 0.8 });
  return out;
})();
// low wind-cut tors standing on the lip behind the path
const TORS = (() => {
  const r = mulberry32(6107);
  const out = [];
  for (let x = 600; x < 4400; x += 340 + r() * 380) out.push({ x, h: 40 + r() * 70, w: 30 + r() * 30 });
  return out;
})();
// an iron stake now and then, its rope long gone (the old road along the rim)
const STAKES = (() => {
  const r = mulberry32(6109);
  const out = [];
  for (let x = 700; x < 4500; x += 420 + r() * 360) out.push({ x, lean: (r() - 0.5) * 0.3 });
  return out;
})();

// Everything on the Caldera Rim behind the slimes
export function drawRim(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0); // sky and crater in screen space
  drawSky(ctx, camX, time);
  drawCrater(ctx, camX, time);
  drawCitadel(ctx, time);
  ctx.restore();

  const L = camX - 160, R = camX + viewW + 160;
  drawCrest(ctx, Math.max(0, L), Math.min(RIM_W, R));
  for (const t of TORS) if (visible(t.x - 60, t.x + 60, L, R)) drawTor(ctx, t);
  if (visible(BRENNA_DEN_X - 220, BRENNA_DEN_X + 220, L, R)) drawHoistFrame(ctx, BRENNA_DEN_X, time);
  drawGround(ctx, Math.max(0, L), Math.min(RIM_W, R));
  for (const b of BITS) if (visible(b.x - 8, b.x + 8, L, R)) drawBit(ctx, b, time);
  for (const s of STAKES) if (visible(s.x - 20, s.x + 20, L, R)) drawStake(ctx, s, time);
  for (const p of RIM_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'basalt') drawBasalt(ctx, p);
    else if (p.kind === 'glass') drawGlassLedge(ctx, p, time);
    else if (p.kind === 'spur') drawSpur(ctx, p, p === RIM_PLATFORMS[1]);
  }
  if (visible(SEAT.x - 80, SEAT.x + SEAT.w + 80, L, R)) drawSeat(ctx, SEAT, time);
  RIM_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x1 - 30; // you come in from the east: each zone's sign stands at its east edge
    if (visible(sx - 90, sx + 90, L, R)) drawZoneSign(ctx, sx, z, i);
  });
  if (visible(RIM_EXIT_X - 260, RIM_W, L, R)) drawStairHead(ctx, RIM_EXIT_X, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawWind(ctx, camX, time);
  ctx.restore();
}

// ——— the sky ———
let skyGrad = null, gradCtx = null;
function drawSky(ctx, camX, time) {
  if (gradCtx !== ctx) {
    gradCtx = ctx;
    skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON);
    skyGrad.addColorStop(0, '#4a5264');
    skyGrad.addColorStop(0.55, '#8a8a92');
    skyGrad.addColorStop(1, '#c4b8a4');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  // long thin wind clouds, torn
  for (let i = 0; i < 6; i++) {
    const x = ((((i * 380 - camX * 0.04 - time * 14) % 2280) + 2280) % 2280) - 340;
    ctx.fillStyle = 'rgba(220,214,206,0.22)';
    ellipse(ctx, x, 60 + i * 24, 180 + (i % 3) * 50, 5);
    ellipse(ctx, x + 120, 64 + i * 24, 90, 3);
  }
}

// The crater behind the path: the far rim across it, the inner walls falling to a turquoise lake far down, and the
// vent beside the lake with the column roaring up out of it, glowing at its foot, past the rim and into the sky
function drawCrater(ctx, camX, time) {
  const px = -camX * 0.06; // the crater turns slowly as you walk round
  // the far rim, a long dark ridge across the view
  ctx.fillStyle = '#5a5058';
  ctx.beginPath();
  ctx.moveTo(-20, HORIZON + 10);
  for (let x = -20; x <= W + 40; x += 40) ctx.lineTo(x, 188 + Math.sin((x - px) * 0.008) * 16 + Math.sin((x - px) * 0.023) * 6);
  ctx.lineTo(W + 40, HORIZON + 10);
  ctx.closePath();
  ctx.fill();
  // the bowl: inner walls going down dark, in bands
  for (const [y, c] of [[214, '#4a4248'], [250, '#3c3438'], [290, '#2e282c']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(-20, H);
    for (let x = -20; x <= W + 40; x += 40) ctx.lineTo(x, y + Math.sin((x - px) * 0.011 + y) * 10);
    ctx.lineTo(W + 40, H);
    ctx.closePath();
    ctx.fill();
  }
  // the lake, far down, turquoise and still, a pale rim of salts round it
  const lx = ((((W * 0.36 + px) % (W + 700)) + W + 700) % (W + 700)) - 350;
  ctx.fillStyle = 'rgba(220,226,206,0.55)';
  ellipse(ctx, lx, 336, 214, 20);
  ctx.fillStyle = '#3ab8b0';
  ellipse(ctx, lx, 336, 200, 16);
  ctx.fillStyle = '#6ad8cc';
  ellipse(ctx, lx - 30, 332, 120, 6);
  ctx.fillStyle = 'rgba(230,255,250,0.5)';
  ellipse(ctx, lx - 60 + Math.sin(time * 0.3) * 10, 331, 40, 1.5);
  // the vent beside it, and the column: ash rolling up in great soft heaps, past the far rim and on up
  const vx = lx + 330;
  const g = ctx.createRadialGradient(vx, 344, 4, vx, 344, 70);
  g.addColorStop(0, 'rgba(255,150,80,0.85)');
  g.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(vx - 70, 280, 140, 120);
  ctx.fillStyle = '#ffb070';
  ellipse(ctx, vx, 344, 26, 5);
  for (let i = 0; i < 16; i++) {
    const k = (i / 16 + time * 0.035) % 1;
    const y = 340 - k * 400, r = 28 + k * 70;
    const glow = Math.max(0, 1 - k * 4);
    ctx.fillStyle = glow > 0 ? `rgba(${120 + 100 * glow},${90 + 30 * glow},${84},${0.75 - k * 0.35})` : `rgba(96,88,92,${0.7 - k * 0.35})`;
    circle(ctx, vx + Math.sin(i * 2.1 + time * 0.4) * 16 * k + k * k * 60, y, r);
  }
}

// The Aether Citadel circling close overhead: a great floating rock with towers and a ring of light at its spire,
// crossing the sky slowly (it goes round the island: a few minutes each way), its underside dark with the column's
// ash
function drawCitadel(ctx, time) {
  const PERIOD = 300;
  const k = (time % PERIOD) / PERIOD;
  const cx = W + 360 - k * (W + 720), cy = 96 + Math.sin(time * 0.3) * 4;
  if (cx < -360 || cx > W + 360) return;
  const s = 2.2;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#5a5470';
  ctx.beginPath();
  ctx.moveTo(cx - 70 * s, cy);
  ctx.quadraticCurveTo(cx - 40 * s, cy + 26 * s, cx - 12 * s, cy + 58 * s);
  ctx.lineTo(cx, cy + 70 * s);
  ctx.lineTo(cx + 14 * s, cy + 50 * s);
  ctx.quadraticCurveTo(cx + 44 * s, cy + 24 * s, cx + 70 * s, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(40,34,44,0.5)'; // ash-dark underneath
  ellipse(ctx, cx, cy + 22 * s, 40 * s, 10 * s);
  ctx.fillStyle = '#8a84a4';
  for (const [dx, h, w] of [[-44, 20, 12], [-26, 38, 11], [-8, 30, 10], [6, 62, 13], [24, 34, 11], [42, 22, 12]]) {
    ctx.beginPath();
    ctx.roundRect(cx + (dx - w / 2) * s, cy - h * s, w * s, h * s + 1, [3 * s, 3 * s, 0, 0]);
    ctx.fill();
  }
  ctx.fillStyle = '#9a94b4';
  ellipse(ctx, cx, cy, 72 * s, 7 * s);
  ctx.fillStyle = 'rgba(255,244,200,0.7)'; // lit windows
  for (const [dx, dy] of [[-26, -26], [-8, -18], [6, -44], [24, -22], [6, -30]]) circle(ctx, cx + dx * s, cy + dy * s, 1.6 * s);
  // the ring of light round its spire, turning
  ctx.strokeStyle = 'rgba(255,240,190,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx + 6 * s, cy - 70 * s, 9 * s, 9 * s * Math.abs(Math.cos(time * 0.4)) + 1, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// ——— the rim itself ———
// The near rim's crest behind the path, rising west to the highest point at the hoist
function drawCrest(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = BAS_L;
  ctx.beginPath();
  ctx.moveTo(L, GROUND);
  for (let x = Math.floor(L / 40) * 40; x <= R + 40; x += 40) {
    const rise = Math.max(0, 1 - x / 5000);
    ctx.lineTo(x, GROUND - 40 - rise * 90 + Math.sin(x * 0.013) * 8);
  }
  ctx.lineTo(R + 40, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,26,30,0.35)'; // wind-cut bands
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = Math.floor(L / 110) * 110; x < R; x += 110) {
    const rise = Math.max(0, 1 - x / 5000);
    ctx.moveTo(x, GROUND - 24 - rise * 60);
    ctx.lineTo(x + 70, GROUND - 30 - rise * 66);
  }
  ctx.stroke();
}
function drawTor(ctx, t) {
  ctx.fillStyle = BAS;
  ctx.beginPath();
  ctx.moveTo(t.x - t.w, GROUND - 20);
  ctx.quadraticCurveTo(t.x - t.w * 0.8, GROUND - 20 - t.h, t.x - t.w * 0.1, GROUND - 24 - t.h);
  ctx.quadraticCurveTo(t.x + t.w * 0.6, GROUND - 18 - t.h, t.x + t.w, GROUND - 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; // scoured smooth on the windward (east) side
  ellipse(ctx, t.x + t.w * 0.45, GROUND - 30 - t.h * 0.5, t.w * 0.2, t.h * 0.3, -0.3);
}

// The ground: dark basalt, a grit of black glass and pale pumice on top, packed hard by the wind
function drawGround(ctx, L, R) {
  if (R <= L) return;
  ctx.fillStyle = BAS;
  ctx.fillRect(L, GROUND - 4, R - L, H - GROUND + 4);
  ctx.fillStyle = BAS_L;
  ctx.beginPath();
  ctx.moveTo(L, GROUND + 2);
  for (let x = Math.floor(L / 30) * 30; x <= R + 30; x += 30) ctx.lineTo(x, GROUND - 3 + Math.sin(x * 0.09) * 1.6);
  ctx.lineTo(R + 30, GROUND + 6);
  ctx.lineTo(L, GROUND + 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,16,20,0.6)'; // columnar cracks
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = Math.floor(L / 70) * 70; x < R; x += 70) {
    ctx.moveTo(x, GROUND + 8);
    ctx.lineTo(x + 4, H);
  }
  ctx.stroke();
}
function drawBit(ctx, b, time) {
  if (b.glass) {
    ctx.fillStyle = GLASS;
    ctx.beginPath();
    ctx.moveTo(b.x - 4 * b.s, GROUND);
    ctx.lineTo(b.x, GROUND - 7 * b.s);
    ctx.lineTo(b.x + 4 * b.s, GROUND);
    ctx.closePath();
    ctx.fill();
    if (((time * 0.5 + b.x * 0.013) % 3) < 0.25) {
      ctx.fillStyle = 'rgba(220,226,255,0.8)';
      circle(ctx, b.x, GROUND - 5 * b.s, 1.2);
    }
  } else {
    ctx.fillStyle = '#a8a0a0';
    ellipse(ctx, b.x, GROUND - 1, 4 * b.s, 2.4 * b.s);
  }
}
// An iron stake of the old road along the rim, leaning, a frayed end of rope still knotted on it, fluttering
function drawStake(ctx, s, time) {
  ctx.save();
  ctx.translate(s.x, GROUND);
  ctx.rotate(s.lean);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(-2.5, -46, 5, 48);
  ctx.fillStyle = RUST;
  ctx.fillRect(-3.5, -40, 7, 3);
  ctx.strokeStyle = '#8a7a60';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.quadraticCurveTo(-8, -38 + Math.sin(time * 6 + s.x) * 2, -16, -34 + Math.sin(time * 7 + s.x) * 3);
  ctx.stroke();
  ctx.restore();
}

// A basalt outcrop (a platform): a block of columns, flat-topped, glass grit along its top
function drawBasalt(ctx, p) {
  const top = p.y, bottom = GROUND + 2;
  ctx.fillStyle = BAS;
  ctx.beginPath();
  ctx.moveTo(p.x - 10, bottom);
  ctx.lineTo(p.x - 4, top + 10);
  ctx.quadraticCurveTo(p.x, top, p.x + 10, top);
  ctx.lineTo(p.x + p.w - 10, top);
  ctx.quadraticCurveTo(p.x + p.w, top, p.x + p.w + 4, top + 10);
  ctx.lineTo(p.x + p.w + 10, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = BAS_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = p.x + 24; x < p.x + p.w - 8; x += 28) {
    ctx.moveTo(x, top + 8);
    ctx.lineTo(x, bottom - 4);
  }
  ctx.stroke();
  ctx.fillStyle = BAS_L;
  ctx.beginPath();
  ctx.roundRect(p.x, top - 4, p.w, 9, 5);
  ctx.fill();
  ctx.fillStyle = GLASS;
  for (const k of [0.2, 0.5, 0.8]) ellipse(ctx, p.x + p.w * k, top - 2, 5, 1.4);
}
// A black glass ledge (a platform): a lip of obsidian on a basalt foot, glinting
function drawGlassLedge(ctx, p, time) {
  const top = p.y, bottom = GROUND + 2;
  ctx.fillStyle = BAS;
  ctx.beginPath();
  ctx.moveTo(p.x + 10, bottom);
  ctx.quadraticCurveTo(p.x + 14, top + 30, p.x + 30, top + 6);
  ctx.lineTo(p.x + p.w - 30, top + 6);
  ctx.quadraticCurveTo(p.x + p.w - 14, top + 30, p.x + p.w - 10, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = GLASS;
  ctx.beginPath();
  ctx.moveTo(p.x - 6, top + 6);
  ctx.quadraticCurveTo(p.x + p.w / 2, top - 10, p.x + p.w + 6, top + 6);
  ctx.lineTo(p.x + p.w - 4, top + 12);
  ctx.lineTo(p.x + 4, top + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GLASS_L;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(p.x + 12, top + 2);
  ctx.quadraticCurveTo(p.x + p.w * 0.4, top - 4, p.x + p.w * 0.6, top - 3);
  ctx.stroke();
  const k = (time * 0.3 + p.x * 0.001) % 1; // a glint running along it
  ctx.fillStyle = `rgba(230,236,255,${0.6 * Math.sin(k * Math.PI)})`;
  circle(ctx, p.x + 10 + k * (p.w - 20), top - 1, 1.8);
}
// A crag spur (a platform): a tall leaning column of basalt, flat at the top. The one under the Bearer's Seat rises on
// past its ledge into the crag the Seat sits on
function drawSpur(ctx, p, underSeat) {
  const top = p.y, bottom = GROUND + 2;
  if (underSeat) {
    // the crag behind it, going on up to the Seat (darker: it's behind the ledge you stand on)
    ctx.fillStyle = '#342e34';
    ctx.beginPath();
    ctx.moveTo(SEAT.x - 20, bottom);
    ctx.quadraticCurveTo(SEAT.x - 14, SEAT.y + 60, SEAT.x + 8, SEAT.y + 6);
    ctx.lineTo(SEAT.x + SEAT.w - 8, SEAT.y + 6);
    ctx.quadraticCurveTo(SEAT.x + SEAT.w + 14, SEAT.y + 70, SEAT.x + SEAT.w + 24, bottom);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#423a40';
  ctx.beginPath();
  ctx.moveTo(p.x + 6, bottom);
  ctx.quadraticCurveTo(p.x + 2, (top + bottom) / 2, p.x + 14, top + 4);
  ctx.lineTo(p.x + p.w - 14, top + 4);
  ctx.quadraticCurveTo(p.x + p.w + 4, (top + bottom) / 2, p.x + p.w - 6, bottom);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = BAS_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const k of [0.3, 0.6]) {
    ctx.moveTo(p.x + p.w * k, top + 16);
    ctx.lineTo(p.x + p.w * k + 4, bottom - 10);
  }
  ctx.stroke();
  ctx.fillStyle = BAS_L;
  ctx.beginPath();
  ctx.roundRect(p.x + 4, top - 4, p.w - 8, 9, 5);
  ctx.fill();
}
// The Bearer's Seat (the find): a flat worn ledge on top of the crag, out in the wind, where you can sit and watch the
// Citadel go over. A pale worn patch the size of something heavy, two strap grooves cut into the rock beside it, a
// roc feather wedged in a crack. Room on the left of it is kept clear (E4b sets something down there)
function drawSeat(ctx, p, time) {
  ctx.fillStyle = BAS_L;
  ctx.beginPath();
  ctx.roundRect(p.x, p.y - 4, p.w, 10, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(200,190,180,0.25)'; // the worn patch
  ellipse(ctx, p.x + p.w * 0.32, p.y - 1, p.w * 0.22, 2.6);
  ctx.strokeStyle = 'rgba(30,26,30,0.6)'; // strap grooves
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const k of [0.14, 0.5]) {
    ctx.moveTo(p.x + p.w * k, p.y - 3);
    ctx.lineTo(p.x + p.w * k + 3, p.y + 5);
  }
  ctx.stroke();
  // E4b: the tooth, set down on the left half where she let it go, its strap lying loose beside it; the right half
  // stays clear to stand on and watch the city go over
  ctx.save();
  ctx.translate(p.x + p.w * 0.25, p.y - 4 - 24);
  ctx.rotate(-0.04);
  drawTooth(ctx, 48, time, false);
  ctx.restore();
  ctx.strokeStyle = '#4a3428';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x + p.w * 0.25 + 18, p.y - 6);
  ctx.quadraticCurveTo(p.x + p.w * 0.5, p.y - 2, p.x + p.w * 0.56, p.y - 4);
  ctx.stroke();
  // the roc feather, ticking in the wind
  ctx.save();
  ctx.translate(p.x + p.w - 14, p.y - 2);
  ctx.rotate(-0.5 + Math.sin(time * 5) * 0.12);
  ctx.fillStyle = '#4a4248';
  ellipse(ctx, 0, -9, 2.6, 9);
  ctx.strokeStyle = '#c8c0b8';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -17);
  ctx.stroke();
  ctx.restore();
}

// The old hoist frame at the rim's highest point (BRENNA_DEN_X): two great iron legs braced into the rock, a cross
// beam, a broken pulley wheel hanging off it on one pin, a stub of chain. The rest of it went over the edge long ago.
// Since E4b the way into the Bearer's Hoist opens under it (the cleft and the sign: src/dens-rim.js's entrance art)
function drawHoistFrame(ctx, x, time) {
  // the plinth: the highest rock on the rim
  ctx.fillStyle = BAS;
  ctx.beginPath();
  ctx.moveTo(x - 160, GROUND + 2);
  ctx.quadraticCurveTo(x - 120, GROUND - 40, x - 60, GROUND - 46);
  ctx.lineTo(x + 70, GROUND - 46);
  ctx.quadraticCurveTo(x + 130, GROUND - 40, x + 170, GROUND + 2);
  ctx.closePath();
  ctx.fill();
  const top = GROUND - 250;
  ctx.strokeStyle = IRON_D;
  ctx.lineCap = 'round';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(x - 90, GROUND - 40);
  ctx.lineTo(x - 20, top);
  ctx.moveTo(x + 90, GROUND - 40);
  ctx.lineTo(x + 20, top);
  ctx.stroke();
  ctx.lineWidth = 6; // the brace
  ctx.beginPath();
  ctx.moveTo(x - 62, GROUND - 120);
  ctx.lineTo(x + 62, GROUND - 120);
  ctx.stroke();
  ctx.fillStyle = IRON; // the cross beam, reaching out over the crater side
  ctx.beginPath();
  ctx.roundRect(x - 50, top - 10, 150, 14, 4);
  ctx.fill();
  ctx.fillStyle = RUST;
  for (const dx of [-36, 0, 40, 80]) circle(ctx, x + dx, top - 3, 3);
  // the broken pulley wheel, hanging crooked off one pin, swinging a little in the wind
  ctx.save();
  ctx.translate(x + 84, top + 4);
  ctx.rotate(0.5 + Math.sin(time * 0.9) * 0.05);
  ctx.strokeStyle = IRON;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 30, 26, -1.2, Math.PI * 1.35);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const a of [0.3, 1.9, 3.5]) {
    ctx.moveTo(0, 30);
    ctx.lineTo(Math.cos(a) * 24, 30 + Math.sin(a) * 24);
  }
  ctx.stroke();
  ctx.fillStyle = IRON_D;
  circle(ctx, 0, 30, 5);
  ctx.restore();
  // a stub of chain off the beam's root
  ctx.strokeStyle = IRON_D;
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 5; i++) {
    const sway = Math.sin(time * 1.4) * i * 1.2;
    ctx.beginPath();
    ctx.ellipse(x - 30 + sway, top + 14 + i * 9, 3, 5, 0, 0, TAU);
    ctx.stroke();
  }
}

// The Stair Head: the top of the Bearers' stair, iron stanchions and the new hand-chains going down off the east edge,
// and a sign back down
function drawStairHead(ctx, x, time) {
  ctx.fillStyle = IRON_D;
  for (const dx of [-40, 20]) ctx.fillRect(x + dx - 3, GROUND - 56, 6, 58);
  ctx.strokeStyle = '#9a949c'; // the new chain, bright
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(x - 40, GROUND - 52);
  ctx.quadraticCurveTo(x - 10, GROUND - 40 + Math.sin(time * 2) * 1.5, x + 20, GROUND - 52);
  ctx.quadraticCurveTo(x + 40, GROUND - 30, x + 70, GROUND - 10);
  ctx.stroke();
  // the sign
  const sx = x - 110;
  ctx.fillStyle = '#3a3236';
  ctx.fillRect(sx - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(sx, GROUND - 76);
  ctx.rotate(Math.sin(time * 2.4) * 0.05); // the wind at it
  ctx.fillStyle = '#b8aca0';
  ctx.strokeStyle = '#4a3e3a';
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
  text(ctx, 'Brimstone Fields', -2, 1, 12, '#3a2a2a');
  ctx.fillStyle = '#d0485a';
  ctx.fillRect(-3, 12, 6, 10);
  ctx.restore();
}

function drawZoneSign(ctx, x, z, i) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(140, ctx.measureText(z.name).width + 30);
  ctx.fillStyle = IRON_D;
  ctx.fillRect(x - tw / 2 + 10, GROUND - 92, 5, 92);
  ctx.fillRect(x + tw / 2 - 15, GROUND - 92, 5, 92);
  ctx.save();
  ctx.translate(x, GROUND - 66);
  ctx.fillStyle = '#b8aca0';
  ctx.strokeStyle = '#2e282c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 46, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(40,34,40,0.3)'; // grit blasted into its windward edge
  ellipse(ctx, tw / 2 - 14, 0, 8, 18);
  text(ctx, z.name, 0, -6, 15, '#2e2226');
  const red = i === 0;
  ctx.fillStyle = red ? '#d0485a' : 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-32, 6, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 14.5, 11, red ? '#fffaf0' : '#2e2226');
  ctx.restore();
}

// The wind: grit streaming west along the rim, and now and then a spark blown up out of the crater
function drawWind(ctx, camX, time) {
  ctx.lineCap = 'round';
  for (const g of GRIT) {
    const x = ((((g.x - camX * 0.6 - time * g.v) % (W + 200)) + W + 200) % (W + 200)) - 100;
    ctx.strokeStyle = `rgba(70,62,66,${g.a})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, g.y);
    ctx.lineTo(x + g.l, g.y - 1);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.12 + i / 4) % 1;
    const x = ((((i * 290 + 140 - camX * 0.3 - k * 300) % W) + W) % W);
    ctx.fillStyle = `rgba(255,150,80,${0.7 * Math.sin(k * Math.PI)})`;
    circle(ctx, x, 420 - k * 300, 1.6);
  }
}
