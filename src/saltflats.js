// Docs: docs/places/saltflats.md
// The Salt Flats (room SALTFLATS, src/shared/rpg.js; atlas Phase 9, A2): the old seabed west of Saltmouth, down off
// Caravanserai's west end. White salt crust to the horizon, crazed into plates, the sea a far bright line; the old fleet
// beached on its side where the water left it, every boat, and nets strung on poles between them, drying for boats that will
// never sail. West to east: the Salt Steps (a waystone; no mobs), the Crust, the Beached Fleet (FLEET_X: the tall mast with
// its crow's nest, the hidden spot, last in SFLATS_PLATFORMS), and the Harbour Mouth: the old breakwater, and under the
// nets hung over it the way down into the dry harbour, the Netwife's den (NET_DEN_X; its mouth is drawn by src/dens-net.js).
// The sky is Caravanserai's (drawDuneSky, drawDuneAir: src/caravan.js).
// freed: you've freed the Netwife (docs/social/story.md): for you the nets are gone off the poles, let go to the wind.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { SFLATS_W, FIELD_GROUND, SFLATS_PLATFORMS, SFLATS_ZONES, FLEET_X, SFLATS_EXIT_X, NET_DEN_X } from './shared/rpg.js';
import { drawDuneSky, drawDuneAir } from './caravan.js';
import { drawDuneSign } from './glassdunes.js';
import { SALT, SALT_S, WOOD, WOOD_D, WOOD_L, PAINT, crust } from './saltflats-art.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300;
const STEPS_END = SFLATS_ZONES[0].x1;
const NEST = SFLATS_PLATFORMS.find((p) => p.kind === 'nest');
const BREAKWATER_X = NET_DEN_X - 520; // where the old breakwater's wall starts, running on east past the den
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

// the old fleet, beached in the background: x, length, which way it lies, its paint, whether it keeps a mast
const BOATS = (() => {
  const r = mulberry32(1041);
  const out = [];
  for (let x = 820; x < SFLATS_W - 700; x += 300 + r() * 260) {
    if (Math.abs(x - NEST.x - 40) < 200) continue;
    out.push({ x, len: 150 + r() * 110, dir: r() < 0.5 ? -1 : 1, paint: PAINT[Math.floor(r() * PAINT.length)], mast: r() < 0.4, tilt: 0.25 + r() * 0.2 });
  }
  return out;
})();
// poles between the boats, nets strung from each to the next
const POLES = (() => {
  const r = mulberry32(1049);
  const out = [];
  for (let x = 700; x < BREAKWATER_X - 60; x += 180 + r() * 140) out.push({ x, h: 90 + r() * 50, lean: (r() - 0.5) * 0.12 });
  return out;
})();
// the salt's crazing: plates of crust, as cracks across the floor
const CRACKS = (() => {
  const r = mulberry32(1051);
  return Array.from({ length: 120 }, () => ({ x: r() * SFLATS_W, w: 30 + r() * 60, y: GROUND + 6 + r() * (H - GROUND - 12), a: (r() - 0.5) * 0.6 }));
})();

// Everything in the Salt Flats behind the slimes
export function drawSaltFlats(ctx, camX, viewW, time, freed = false) {
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneSky(ctx, camX, time, SFLATS_W);
  drawSaltBeyond(ctx, camX, time);
  ctx.restore();
  const L = camX - 200, R = camX + viewW + 200;
  for (const b of BOATS) if (visible(b.x - b.len, b.x + b.len, L, R)) drawBeachedBoat(ctx, b, time);
  if (visible(NEST.x - 260, NEST.x + 300, L, R)) drawTallMast(ctx, time, freed);
  for (let i = 0; i < POLES.length; i++) {
    const p = POLES[i], q = POLES[i + 1];
    if (!visible(p.x - 40, (q?.x ?? p.x) + 40, L, R)) continue;
    drawPole(ctx, p);
    if (q && !freed) drawNet(ctx, p, q, time, i);
  }
  if (freed) drawNetAloft(ctx, camX, viewW, time);
  if (visible(BREAKWATER_X - 40, SFLATS_W, L, R)) drawBreakwater(ctx, Math.max(BREAKWATER_X, L), Math.min(SFLATS_W, R), time);
  drawGround(ctx, Math.max(0, L), Math.min(SFLATS_W, R));
  if (visible(0, STEPS_END + 60, L, R)) drawSaltSteps(ctx);
  for (const p of SFLATS_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'crust') drawCrustShelf(ctx, p);
    else if (p.kind === 'hull') drawHullLedge(ctx, p);
    else if (p.kind === 'pier') drawPierStump(ctx, p);
  }
  if (visible(SFLATS_EXIT_X, SFLATS_EXIT_X + 220, L, R)) drawDuneSign(ctx, SFLATS_EXIT_X + 110, 'Caravanserai', -1, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneAir(ctx, camX, time);
  drawGlare(ctx, time);
  ctx.restore();
}

// the old seabed going on to the horizon, white, and the sea a far bright line along it, nearer at the east end
function drawSaltBeyond(ctx, camX, time) {
  const g = ctx.createLinearGradient(0, HORIZON, 0, GROUND);
  g.addColorStop(0, '#f2ece0');
  g.addColorStop(1, '#e4dccc');
  ctx.fillStyle = g;
  ctx.fillRect(0, HORIZON + 2, W, H - HORIZON);
  const k = 0.45 + 0.55 * Math.min(1, camX / (SFLATS_W - W)); // the sea a little nearer toward the harbour mouth
  ctx.fillStyle = 'rgba(110,210,214,0.85)';
  ctx.fillRect(0, HORIZON + 2, W, 4 + 6 * k);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 8; i++) {
    const x = ((i * 157 + time * 12 - camX * 0.05) % (W + 80) + W + 80) % (W + 80) - 40;
    ctx.fillRect(x, HORIZON + 3, 22, 1.2);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; // the salt glare between
  ctx.fillRect(0, HORIZON + 10 + 6 * k, W, 18);
  ctx.strokeStyle = 'rgba(196,186,166,0.5)'; // far crust plates
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const x = ((i * 211 - camX * 0.15) % (W + 200) + W + 200) % (W + 200) - 100, y = HORIZON + 40 + (i % 5) * 20;
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40 + (i % 3) * 10, y + 2);
  }
  ctx.stroke();
}

// a boat of the old fleet, lying on its side in the salt, bleached, a band of old paint, a salt line along it
function drawBeachedBoat(ctx, b, time) {
  const { x, len, dir, paint, tilt } = b, y = GROUND - 4;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.rotate(-tilt * 0.2);
  ctx.fillStyle = '#a89070';
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 2;
  ctx.beginPath(); // the hull, seen lying over: its keel toward us, a curve up to the stem
  ctx.moveTo(-len / 2, 0);
  ctx.quadraticCurveTo(-len * 0.5, -len * 0.36, 0, -len * 0.42);
  ctx.quadraticCurveTo(len * 0.4, -len * 0.42, len * 0.56, -len * 0.18);
  ctx.quadraticCurveTo(len * 0.5, -4, len * 0.4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(122,94,68,0.5)'; // its strakes
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 1; i < 6; i++) {
    ctx.moveTo(-len / 2, -i * len * 0.07);
    ctx.quadraticCurveTo(0, -i * len * 0.08 - 4, len * 0.56, -i * len * 0.03);
  }
  ctx.stroke();
  ctx.fillStyle = paint;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(-len / 2, -len * 0.3, len * 1.1, len * 0.05);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(246,242,234,0.65)'; // the salt line, where the water stood in her last
  ctx.fillRect(-len / 2, -len * 0.12, len * 1.1, 4);
  ctx.restore();
  ctx.fillStyle = WOOD_D; // the keel
  ctx.fillRect(-len * 0.4, -len * 0.43, len * 0.7, 4);
  if (b.mast) { // a broken mast lying out across the salt
    ctx.strokeStyle = '#8a7258';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(len * 0.1, -len * 0.1);
    ctx.lineTo(len * 0.9, -6);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(240,234,220,0.9)'; // salt drifted against her
  ellipse(ctx, x, GROUND - 2, len * 0.5, 8);
}

// the tallest of the fleet, beached upright in a cradle of salt, her mast still standing, a crow's nest at its top (the
// hidden spot), a scrap of pennant on it; the mast's stays are strung with nets (gone, once she's freed)
function drawTallMast(ctx, time, freed) {
  const mx = NEST.x + NEST.w / 2, top = NEST.y;
  ctx.fillStyle = '#9a8264'; // her hull, half sunk in the crust
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx - 190, GROUND);
  ctx.quadraticCurveTo(mx - 170, GROUND - 120, mx - 40, GROUND - 130);
  ctx.lineTo(mx + 120, GROUND - 124);
  ctx.quadraticCurveTo(mx + 200, GROUND - 90, mx + 210, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b8583a';
  ctx.globalAlpha = 0.6;
  ctx.fillRect(mx - 176, GROUND - 100, 380, 8);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#7a6448'; // the mast
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(mx, GROUND - 128);
  ctx.lineTo(mx, top + 4);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(80,60,40,0.7)'; // the stays
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(mx, top + 20);
  ctx.lineTo(mx - 180, GROUND - 120);
  ctx.moveTo(mx, top + 20);
  ctx.lineTo(mx + 190, GROUND - 110);
  ctx.stroke();
  if (!freed) { // a net hung over the forestay, drying
    ctx.strokeStyle = 'rgba(200,180,138,0.75)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      const x0 = mx - 180 * k, y0 = top + 20 + (GROUND - 140 - top) * k;
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + 20, y0 + 40 + Math.sin(time + i) * 2);
    }
    for (let j = 1; j < 4; j++) {
      ctx.moveTo(mx, top + 20 + j * 10);
      ctx.quadraticCurveTo(mx - 100, top + 100 + j * 10, mx - 160, GROUND - 110 + j * 10);
    }
    ctx.stroke();
  }
  ctx.fillStyle = WOOD; // the crow's nest
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(NEST.x, top);
  ctx.lineTo(NEST.x + 8, top + 26);
  ctx.lineTo(NEST.x + NEST.w - 8, top + 26);
  ctx.lineTo(NEST.x + NEST.w, top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = WOOD_L;
  ctx.fillRect(NEST.x - 2, top - 4, NEST.w + 4, 6);
  ctx.strokeStyle = '#6a5040'; // the pennant's staff and its scrap
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx, top);
  ctx.lineTo(mx, top - 40);
  ctx.stroke();
  ctx.fillStyle = '#3e6a8a';
  ctx.beginPath();
  ctx.moveTo(mx + 1, top - 40);
  ctx.quadraticCurveTo(mx + 18, top - 38 + Math.sin(time * 3) * 3, mx + 28, top - 32 + Math.sin(time * 3 + 1) * 4);
  ctx.lineTo(mx + 1, top - 30);
  ctx.closePath();
  ctx.fill();
}

function drawPole(ctx, p) {
  ctx.save();
  ctx.translate(p.x, GROUND);
  ctx.rotate(p.lean);
  ctx.fillStyle = '#8a7258';
  ctx.fillRect(-3, -p.h, 6, p.h);
  ctx.fillStyle = '#6a5440';
  ctx.fillRect(-5, -p.h, 10, 4);
  ctx.restore();
  ctx.fillStyle = 'rgba(240,234,220,0.9)';
  ellipse(ctx, p.x, GROUND - 1, 12, 4);
}
// a net hung between two poles, sagging, its mesh drawn as a few curves and crossings, stirring a little in the hot air
function drawNet(ctx, p, q, time, i) {
  const x0 = p.x, x1 = q.x, y0 = GROUND - p.h + 6, y1 = GROUND - q.h + 6, sag = 50 + (i % 3) * 14;
  const stir = Math.sin(time * 0.9 + i) * 4;
  ctx.strokeStyle = 'rgba(200,180,138,0.8)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 0.3 + stir, x1, y1);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,180,138,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const n = Math.max(4, Math.round((x1 - x0) / 16));
  for (let k = 0; k <= n; k++) { // the drops of the mesh, hanging from the head-rope
    const t = k / n, hx = x0 + (x1 - x0) * t, hy = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag * 0.3 + stir * Math.sin(t * Math.PI);
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + stir * 0.4, hy + sag + Math.sin(t * Math.PI) * 14);
  }
  for (let j = 1; j < 4; j++) { // and the rows across
    ctx.moveTo(x0, y0 + j * sag * 0.28);
    ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + j * sag * 0.28 + sag * 0.4 + stir, x1, y1 + j * sag * 0.28);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(232,224,204,0.9)'; // floats on the head-rope
  for (let k = 1; k < 4; k++) {
    const t = k / 4;
    circle(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag * 0.3 + stir * Math.sin(t * Math.PI) + 2, 2.6);
  }
}
// (freed) a last net high up on the wind, far off, going away
function drawNetAloft(ctx, camX, viewW, time) {
  const x = camX + ((time * 22) % (viewW + 400)) - 200, y = 120 + Math.sin(time * 0.6) * 20;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 0.8) * 0.3);
  ctx.strokeStyle = 'rgba(220,206,170,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -3; i <= 3; i++) {
    ctx.moveTo(i * 8, -20);
    ctx.quadraticCurveTo(i * 8 + 6, 0, i * 9, 20 + Math.sin(time * 2 + i) * 3);
    ctx.moveTo(-26, i * 6);
    ctx.quadraticCurveTo(0, i * 6 + 4, 26, i * 6);
  }
  ctx.stroke();
  ctx.restore();
}

// the old harbour's breakwater, a long wall of dressed stone running out east, high and dry, a salt line along it and iron
// rings for boats that never come
function drawBreakwater(ctx, L, R, time) {
  const top = GROUND - 150;
  ctx.fillStyle = '#c8b898';
  ctx.fillRect(L, top, R - L, GROUND - top);
  ctx.strokeStyle = 'rgba(138,120,92,0.6)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let y = top + 24; y < GROUND; y += 24) {
    ctx.moveTo(L, y);
    ctx.lineTo(R, y);
  }
  for (let x = Math.floor(L / 60) * 60; x < R; x += 60) {
    for (let y = top; y < GROUND; y += 48) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 24);
      ctx.moveTo(x + 30, y + 24);
      ctx.lineTo(x + 30, y + 48);
    }
  }
  ctx.stroke();
  ctx.fillStyle = '#ddd0b4'; // its coping
  ctx.fillRect(L, top - 8, R - L, 10);
  ctx.fillStyle = 'rgba(246,242,234,0.8)'; // the salt line
  ctx.fillRect(L, top + 70, R - L, 5);
  ctx.strokeStyle = '#6a5a4a'; // iron mooring rings
  ctx.lineWidth = 3;
  for (let x = Math.ceil(L / 220) * 220; x < R; x += 220) {
    ctx.beginPath();
    ctx.arc(x, top + 40, 8, 0, TAU);
    ctx.stroke();
  }
  if (L <= BREAKWATER_X + 4) { // its west end, broken off
    ctx.fillStyle = '#b8a888';
    ctx.beginPath();
    ctx.moveTo(BREAKWATER_X, top - 8);
    ctx.lineTo(BREAKWATER_X - 30, GROUND);
    ctx.lineTo(BREAKWATER_X, GROUND);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGround(ctx, L, R) {
  if (R <= L) return;
  const g = ctx.createLinearGradient(0, GROUND - 6, 0, H);
  g.addColorStop(0, '#f4efe4');
  g.addColorStop(1, '#d8cebc');
  ctx.fillStyle = g;
  ctx.fillRect(L, GROUND - 4, R - L, H - GROUND + 4);
  ctx.fillStyle = '#fbf8f0';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 6, R - L + 8, 10, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(176,164,140,0.55)'; // the crust crazed into plates
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const c of CRACKS) {
    if (c.x + c.w < L || c.x > R) continue;
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + c.w * Math.cos(c.a), c.y + c.w * Math.sin(c.a) * 0.3);
    ctx.lineTo(c.x + c.w * Math.cos(c.a) + 10, c.y + c.w * Math.sin(c.a) * 0.3 + 8);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,190,170,0.4)'; // shells in the salt
  for (let x = Math.ceil(L / 97) * 97; x < R; x += 97) ellipse(ctx, x, GROUND + 10 + (x % 23), 3, 1.6);
}

// the Salt Steps: the old harbour's slipway down off the town's edge, stone steps going down onto the seabed, salt-white
function drawSaltSteps(ctx) {
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? '#c8bca4' : '#d8ccb4';
    ctx.fillRect(0, GROUND - 120 + i * 20, 240 - i * 30, 20);
    ctx.fillStyle = 'rgba(250,246,238,0.85)';
    ctx.fillRect(0, GROUND - 120 + i * 20, 240 - i * 30, 4);
  }
}

// a shelf of salt crust heaved up off the seabed, white on top, its edge layered pink and grey
function drawCrustShelf(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#e4d6c8';
  ctx.strokeStyle = SALT_S;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, GROUND);
  ctx.lineTo(x, y + 6);
  ctx.lineTo(x + w, y + 4);
  ctx.lineTo(x + w - 14, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,160,160,0.5)'; // its layers
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let yy = y + 18; yy < GROUND; yy += 14) {
    ctx.moveTo(x + 4, yy);
    ctx.lineTo(x + w - 6, yy + 2);
  }
  ctx.stroke();
  ctx.fillStyle = SALT;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 9, 4);
  ctx.fill();
  crust(ctx, x + 4, y - 6, x + w - 4, y, 10, x * 0.01);
}

// the upturned side of a beached hull, the strakes along it, flat enough to stand on
function drawHullLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#a89070';
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20, GROUND);
  ctx.quadraticCurveTo(x - 16, y + 10, x + 10, y);
  ctx.lineTo(x + w - 10, y);
  ctx.quadraticCurveTo(x + w + 16, y + 10, x + w + 20, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,94,68,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let yy = y + 16; yy < GROUND; yy += 16) {
    ctx.moveTo(x - 10, yy);
    ctx.lineTo(x + w + 10, yy);
  }
  ctx.stroke();
  ctx.fillStyle = PAINT[Math.floor(x / 97) % PAINT.length];
  ctx.globalAlpha = 0.6;
  ctx.fillRect(x - 14, y + 22, w + 28, 6);
  ctx.globalAlpha = 1;
  ctx.fillStyle = WOOD_L;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 8, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(240,234,220,0.9)';
  ellipse(ctx, x + w / 2, GROUND - 2, w * 0.7, 8);
}

// the stump of one of the old harbour's piers: dressed stone, a timber deck on top, weed dried white on it
function drawPierStump(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#c0b090';
  ctx.strokeStyle = '#8a7a5c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x + 14, y + 6, w - 28, GROUND - y - 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,122,92,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let yy = y + 30; yy < GROUND; yy += 24) {
    ctx.moveTo(x + 14, yy);
    ctx.lineTo(x + w - 14, yy);
  }
  ctx.stroke();
  ctx.fillStyle = WOOD; // the deck
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 10, 3);
  ctx.fill();
  ctx.fillStyle = WOOD_D;
  for (let k = 12; k < w; k += 22) ctx.fillRect(x + k, y - 3, 1.4, 8);
  ctx.fillStyle = 'rgba(246,242,234,0.8)'; // dried weed, white
  for (let k = 0; k < 4; k++) ellipse(ctx, x + 20 + k * (w - 40) / 3, y + 40 + (k % 2) * 30, 6, 10);
  ctx.fillStyle = 'rgba(240,234,220,0.9)';
  ellipse(ctx, x + w / 2, GROUND - 2, w * 0.6, 7);
}

// the glare off the salt, low down over the whole room, shimmering
function drawGlare(ctx, time) {
  const g = ctx.createLinearGradient(0, GROUND - 120, 0, GROUND);
  g.addColorStop(0, 'rgba(255,255,250,0)');
  g.addColorStop(1, `rgba(255,255,250,${0.12 + 0.04 * Math.sin(time * 1.3)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND - 120, W, 120);
}
