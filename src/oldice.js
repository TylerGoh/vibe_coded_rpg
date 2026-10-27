// Docs: docs/places/oldice.md
// The Old Ice (room OLDICE, a deep room on hard-pocket rules; data in src/shared/rpg.js): the glacier's bed, under
// the Blue Halls, down the cutters' old ladder behind the Hall Troll's fallen wall. The oldest ice there is: black-
// blue, layered like the pages of a closed book, lit only by a faint cold glow deep inside it. West to east: the
// Cutters' Last Camp (no mobs: the camp they left in a hurry, a sledge half-loaded, a pot frozen on a dead fire, a
// lantern dropped and a pick left standing), the Black Ice, the Frozen Wall (things frozen in the walls older than
// the hamlet: great ribs, a cart wheel, an antlered beast, a Keeper lamp post) and the Gate, where an iron ring is
// set in the floor with a broken chain on it and the cut stair goes down into the Long Stair. The Old Lamp (last in
// OLDICE_PLATFORMS), a Keeper lamp post frozen high in the wall with a cutter's lantern hung on it, is the hidden
// spot. It darkens toward the east.
import { H, TAU, mulberry32, circle, ellipse } from './util.js';
import { OLDICE_W, OLDICE_EXIT_X, OLDICE_END_X, OLDICE_ZONES, OLDICE_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const LAMP = OLDICE_PLATFORMS.at(-1);
const ICE = '#16305e', ICE_D = '#081634', LINE = '#020a1e';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => radialGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
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

// ——— seeded scenery ———
const R0 = mulberry32(5001);
// the layers of the old ice, wavering bands along the wall (a slow parallax)
const BAND_F = 0.5;
const bands = Array.from({ length: 9 }, (_, i) => ({ y: 70 + i * 40 + R0() * 14, a: 0.05 + R0() * 0.08, f: 0.004 + R0() * 0.004, p: R0() * TAU }));
// faint cold glows deep in the ice: the only light down here
const glows = (() => {
  const out = [];
  for (let x = 300; x < OLDICE_W; x += 380 + R0() * 300) out.push({ x, y: 140 + R0() * 200, r: 70 + R0() * 60, p: R0() * TAU });
  return out;
})();
// things frozen in the walls, older than the hamlet (mostly in the Frozen Wall)
const FROZEN = [
  { x: 1650, y: 250, kind: 'wheel', s: 1 },
  { x: 2380, y: 230, kind: 'ribs', s: 1.2 },
  { x: 2780, y: 300, kind: 'beast', s: 1 },
  { x: 3250, y: 210, kind: 'ribs', s: 0.9 },
  { x: 3560, y: 270, kind: 'post', s: 1 },
  { x: 1180, y: 330, kind: 'fish', s: 1 },
];
const columns = (() => {
  const out = [];
  for (let x = 620; x < OLDICE_W - 300; x += 340 + R0() * 380) {
    if (OLDICE_PLATFORMS.some((p) => x > p.x - 60 && x < p.x + p.w + 60) || FROZEN.some((f) => Math.abs(f.x - x) < 120)) continue;
    out.push({ x, w: 34 + R0() * 26, waist: 0.4 + R0() * 0.3 });
  }
  return out;
})();
const roofIcicles = Array.from({ length: 120 }, () => ({ x: R0() * OLDICE_W, len: 24 + R0() * 70, w: 8 + R0() * 16 }));
const motes = Array.from({ length: 36 }, () => ({ x: R0() * OLDICE_W, y: 60 + R0() * 330, p: R0(), v: 0.02 + R0() * 0.04 }));
const RING_X = OLDICE_W - 330; // the iron ring in the floor at the Gate, its chain broken

// Everything behind the slimes. camX is the left edge of the view.
export function drawOldIce(ctx, camX, viewW, time) {
  const L = camX - 160, R = camX + viewW + 160;
  ctx.save();
  ctx.fillStyle = vgrad(ctx, 'back', 0, GROUND, [[0, '#01040e'], [1, '#0c2048']]);
  ctx.fillRect(L, 0, R - L, H);
  drawBands(ctx, camX, L, R, time);
  for (const g of glows) if (visible(g.x - g.r * 1.6, g.x + g.r * 1.6, L, R)) glow(ctx, g.x, g.y, g.r * 1.6, g.r, '110,160,255', 0.16 + 0.05 * Math.sin(time * 0.4 + g.p));
  for (const f of FROZEN) if (visible(f.x - 140, f.x + 140, L, R)) drawFrozen(ctx, f, time);
  for (const c of columns) if (visible(c.x - c.w, c.x + c.w, L, R)) drawColumn(ctx, c);
  if (visible(LAMP.x - 80, LAMP.x + LAMP.w + 80, L, R)) drawLamp(ctx, LAMP, time);
  for (const p of OLDICE_PLATFORMS) if (p.kind === 'floe' && visible(p.x - 40, p.x + p.w + 40, L, R)) drawFloe(ctx, p);
  drawRoof(ctx, L, R);
  if (visible(-80, 560, L, R)) drawCamp(ctx, time);
  if (visible(RING_X - 80, OLDICE_W + 40, L, R)) drawStairHead(ctx, time);
  drawFloor(ctx, Math.max(0, L), Math.min(OLDICE_W, R));
  OLDICE_ZONES.forEach((z) => {
    if (!z.lvl) return;
    const sx = z.x0 + 80;
    if (visible(sx - 90, sx + 90, L, R)) drawZoneMark(ctx, sx, z);
  });
  if (visible(OLDICE_EXIT_X, OLDICE_EXIT_X + 300, L, R)) drawArrow(ctx, OLDICE_EXIT_X + 100, 'Up to the Blue Halls', -1, time);
  if (visible(OLDICE_END_X - 260, OLDICE_END_X, L, R)) drawArrow(ctx, OLDICE_END_X - 150, 'The Long Stair', 1, time);
  for (const m of motes) {
    if (m.x < L || m.x > R) continue;
    const k = (time * m.v + m.p) % 1;
    ctx.fillStyle = `rgba(170,205,255,${0.35 * Math.sin(k * Math.PI)})`;
    circle(ctx, m.x + Math.sin(k * 7 + m.p * 9) * 7, m.y + k * 50, 1.5); // (ice dust settling, not rising)
  }
  // the further east, the darker
  const dk = Math.min(1, Math.max(0, (camX + viewW / 2 - 1500) / 2400));
  if (dk > 0) {
    ctx.fillStyle = `rgba(1,3,10,${0.3 * dk})`;
    ctx.fillRect(L, 0, R - L, H);
  }
  ctx.restore();
}

// The layers of the old ice: faint wavering bands, darker and lighter, like pages
function drawBands(ctx, camX, L, R, time) {
  ctx.save();
  ctx.translate(camX * (1 - BAND_F), 0);
  const l = L - camX * (1 - BAND_F), r = R - camX * (1 - BAND_F);
  for (const b of bands) {
    ctx.strokeStyle = `rgba(120,160,230,${b.a})`;
    ctx.lineWidth = 8 + (b.y % 7);
    ctx.beginPath();
    for (let x = Math.floor(l / 40) * 40; x <= r + 40; x += 40) {
      const y = b.y + Math.sin(x * b.f + b.p) * 10;
      x === Math.floor(l / 40) * 40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// A thing frozen in the wall: a dim silhouette behind a frosted skin of ice, older than anyone's stories
function drawFrozen(ctx, f, time) {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(f.s, f.s);
  glow(ctx, 0, 0, 150, 100, '70,110,180', 0.3); // the ice round it a little clearer
  ctx.strokeStyle = ctx.fillStyle = 'rgba(4,10,24,0.75)';
  ctx.lineCap = 'round';
  if (f.kind === 'ribs') {
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-100, -10);
    ctx.quadraticCurveTo(0, -30, 100, -6);
    ctx.stroke();
    ctx.lineWidth = 6;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 22, -18 + Math.abs(i) * 2);
      ctx.quadraticCurveTo(i * 22 + 18, 30, i * 18 + 6, 62 - Math.abs(i) * 5);
      ctx.stroke();
    }
  } else if (f.kind === 'wheel') {
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.lineTo(Math.cos(a) * 44, Math.sin(a) * 44);
      ctx.stroke();
    }
    circle(ctx, 0, 0, 10);
  } else if (f.kind === 'beast') {
    // an antlered beast lying on its side, legs folded, far bigger than any deer
    ellipse(ctx, 0, 10, 80, 32, -0.05);
    ellipse(ctx, 86, -8, 22, 14, 0.4);
    ctx.lineWidth = 5;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(92, -18);
      ctx.quadraticCurveTo(100 + d * 18, -60, 120 + d * 14, -70);
      ctx.moveTo(102 + d * 8, -44);
      ctx.lineTo(118 + d * 20, -46);
      ctx.stroke();
    }
    ctx.lineWidth = 7;
    for (const lx of [-50, -20, 30, 54]) {
      ctx.beginPath();
      ctx.moveTo(lx, 30);
      ctx.quadraticCurveTo(lx + 16, 44, lx + 34, 40);
      ctx.stroke();
    }
  } else if (f.kind === 'post') {
    // a Keeper lamp post, standing up in the ice as if the ice came up round it
    ctx.fillRect(-7, -60, 14, 130);
    ctx.fillRect(-20, -70, 40, 12);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, -64);
    ctx.lineTo(34, -64);
    ctx.lineTo(34, -48);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(26, -48, 16, 20, 4);
    ctx.fill();
  } else {
    // a great fish, mouth open
    ctx.beginPath();
    ctx.moveTo(-90, 0);
    ctx.quadraticCurveTo(-20, -40, 60, -6);
    ctx.lineTo(80, -18);
    ctx.lineTo(70, 0);
    ctx.lineTo(80, 18);
    ctx.lineTo(60, 6);
    ctx.quadraticCurveTo(-20, 40, -90, 0);
    ctx.fill();
  }
  ctx.restore();
  // a glint now and then
  const g = (time * 0.1 + f.x * 0.001) % 1;
  if (g < 0.2) {
    ctx.fillStyle = `rgba(230,244,255,${0.3 * Math.sin((g / 0.2) * Math.PI)})`;
    ellipse(ctx, f.x - 90 * f.s + g * 900 * f.s, f.y - 30 * f.s, 3, 30 * f.s, 0.3);
  }
}

// A column of black ice, roof to floor, pinched at the waist
function drawColumn(ctx, c) {
  const { x, w, waist } = c, top = 30, mid = GROUND - 170;
  ctx.fillStyle = vgrad(ctx, 'col', top, GROUND, [[0, '#0a1a3a'], [1, '#1a3a70']]);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, top);
  ctx.quadraticCurveTo(x - w * waist * 0.5, mid, x - w / 2 - 6, GROUND + 2);
  ctx.lineTo(x + w / 2 + 6, GROUND + 2);
  ctx.quadraticCurveTo(x + w * waist * 0.5, mid, x + w / 2, top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122,168,224,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.2, top + 20);
  ctx.quadraticCurveTo(x - w * waist * 0.3, mid, x - w * 0.25, GROUND - 20);
  ctx.stroke();
}

// A slab of black ice tipped up out of the bed (a platform)
function drawFloe(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = ICE_D;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 12);
  ctx.lineTo(x + w * 0.3, GROUND + 4);
  ctx.lineTo(x + w * 0.7, GROUND + 4);
  ctx.lineTo(x + w - 6, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = ICE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 2);
  ctx.lineTo(x + w + 4, y - 4);
  ctx.lineTo(x + w - 2, y + 16);
  ctx.lineTo(x + 4, y + 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,200,250,0.7)'; // the pale top edge you stand on
  ctx.fillRect(x, y - 2, w, 2.5);
  ctx.strokeStyle = 'rgba(122,168,224,0.35)';
  ctx.lineWidth = 1;
  for (let k = 30; k < w; k += 55) {
    ctx.beginPath();
    ctx.moveTo(x + k, y + 2);
    ctx.lineTo(x + k + 8, y + 14);
    ctx.stroke();
  }
  ctx.fillStyle = ICE_D; // icicles under it
  for (let k = 14; k < w - 8; k += 26) {
    ctx.beginPath();
    ctx.moveTo(x + k - 5, y + 16);
    ctx.lineTo(x + k, y + 32 + (k % 3) * 6);
    ctx.lineTo(x + k + 5, y + 16);
    ctx.fill();
  }
}

// The Old Lamp (the hidden spot): a Keeper lamp post frozen into the wall high above the Frozen Wall, its stone
// cap the ledge you stand on. Long ago a cutter climbed up and hung a lantern on its hook; it's dark now
function drawLamp(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  ctx.fillStyle = 'rgba(40,70,120,0.5)';
  ellipse(ctx, cx, y + 70, 70, 90);
  ctx.fillStyle = '#4a4e5e';
  ctx.strokeStyle = '#1a1c26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - 10, y + 10, 20, 150, 4);
  ctx.fill();
  ctx.stroke();
  // a ring carved round the post, the Keepers' mark
  ctx.strokeStyle = 'rgba(150,170,210,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, y + 60, 9, 4, 0, 0, TAU);
  ctx.stroke();
  // the cap (the ledge)
  ctx.fillStyle = '#5e6272';
  ctx.strokeStyle = '#1a1c26';
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 3, w + 4, 16, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(220,236,255,0.75)';
  ctx.fillRect(x, y - 3, w, 2.5);
  // the hook and the cutter's lantern, dark, a fringe of ice on it
  ctx.strokeStyle = '#2a2a30';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 10, y + 26);
  ctx.lineTo(cx + 26, y + 26);
  ctx.lineTo(cx + 26, y + 34);
  ctx.stroke();
  ctx.fillStyle = '#3a3026';
  ctx.beginPath();
  ctx.roundRect(cx + 19, y + 34, 14, 18, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(140,170,200,0.4)';
  ctx.fillRect(cx + 22, y + 38, 8, 10);
  ctx.fillStyle = 'rgba(220,236,255,0.8)';
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(cx + 20 + k * 5, y + 52);
    ctx.lineTo(cx + 22 + k * 5, y + 58 + k);
    ctx.lineTo(cx + 24 + k * 5, y + 52);
    ctx.fill();
  }
  glow(ctx, cx, y - 6, 40, 16, '170,205,255', 0.12 + 0.05 * Math.sin(time * 0.8));
}

function drawRoof(ctx, L, R) {
  ctx.fillStyle = '#01040c';
  ctx.fillRect(L, 0, R - L, 26);
  ctx.fillStyle = '#06122a';
  for (const ic of roofIcicles) {
    if (ic.x < L - 20 || ic.x > R + 20) continue;
    ctx.beginPath();
    ctx.moveTo(ic.x - ic.w / 2, 22);
    ctx.lineTo(ic.x, 22 + ic.len);
    ctx.lineTo(ic.x + ic.w / 2, 22);
    ctx.fill();
  }
}

// The Cutters' Last Camp, at the ladder's foot: left in a hurry. The old ladder up, a sledge half-loaded with cut
// blocks and its rope dropped, a pot frozen solid on a fire that went out long ago, a lantern on its side, a
// stool knocked over and a pick left standing in a half-cut block
function drawCamp(ctx, time) {
  // the old ladder up into the dark (the Blue Halls)
  const lx = OLDICE_EXIT_X;
  glow(ctx, lx, 60, 90, 60, '120,170,255', 0.18);
  for (const sx of [-18, 18]) {
    ctx.fillStyle = '#5e5852';
    ctx.strokeStyle = '#26221e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(lx + sx - 3, 0, 6, GROUND + 2, 2);
    ctx.fill();
    ctx.stroke();
  }
  for (let y = 24; y < GROUND; y += 26) {
    ctx.fillStyle = '#4e4842';
    ctx.fillRect(lx - 16, y, 32, 4);
    ctx.fillStyle = 'rgba(220,236,255,0.45)';
    ctx.fillRect(lx - 16, y, 32, 1.2);
  }
  // the sledge, half-loaded
  const sx = 285;
  ctx.strokeStyle = '#3a2e24';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx - 60, GROUND - 4);
  ctx.lineTo(sx + 50, GROUND - 4);
  ctx.quadraticCurveTo(sx + 70, GROUND - 6, sx + 70, GROUND - 22);
  ctx.stroke();
  ctx.fillStyle = '#6a523e';
  ctx.fillRect(sx - 60, GROUND - 18, 112, 8);
  for (const [bx, by] of [[-54, -48], [-16, -48], [-36, -78]]) {
    ctx.fillStyle = '#3e6aa8';
    ctx.strokeStyle = '#0e2a5a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(sx + bx, GROUND + by + 30 - 20, 36, 28, 3);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = '#a08a62'; // the tow rope, dropped where they let go of it
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx + 70, GROUND - 20);
  ctx.bezierCurveTo(sx + 90, GROUND - 4, sx + 110, GROUND + 2, sx + 140, GROUND - 1);
  ctx.stroke();
  // the dead fire and the pot frozen on it
  const fx = 455;
  ctx.fillStyle = '#3a3a44';
  for (let i = 0; i < 6; i++) ellipse(ctx, fx - 30 + i * 12, GROUND - 3, 7, 5);
  ctx.strokeStyle = '#1a1614';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(fx - 18, GROUND - 4);
  ctx.lineTo(fx + 14, GROUND - 14);
  ctx.moveTo(fx + 16, GROUND - 4);
  ctx.lineTo(fx - 10, GROUND - 16);
  ctx.stroke();
  ctx.strokeStyle = '#2a2622';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(fx - 26, GROUND);
  ctx.lineTo(fx, GROUND - 60);
  ctx.lineTo(fx + 26, GROUND);
  ctx.stroke();
  ctx.fillStyle = '#2e2e34';
  ctx.beginPath();
  ctx.moveTo(fx - 16, GROUND - 42);
  ctx.quadraticCurveTo(fx - 18, GROUND - 18, fx, GROUND - 18);
  ctx.quadraticCurveTo(fx + 18, GROUND - 18, fx + 16, GROUND - 42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a8cff4'; // what was in it, frozen solid and spilling over the rim
  ellipse(ctx, fx, GROUND - 43, 17, 4);
  ctx.beginPath();
  ctx.moveTo(fx + 10, GROUND - 44);
  ctx.quadraticCurveTo(fx + 20, GROUND - 36, fx + 17, GROUND - 26);
  ctx.lineTo(fx + 13, GROUND - 38);
  ctx.fill();
  // a lantern on its side, a stool knocked over, a pick in a half-cut block
  ctx.fillStyle = '#3a3026';
  ctx.save();
  ctx.translate(385, GROUND - 6);
  ctx.rotate(1.4);
  ctx.beginPath();
  ctx.roundRect(-8, -10, 16, 20, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(140,170,200,0.4)';
  ctx.fillRect(-5, -6, 10, 12);
  ctx.restore();
  ctx.fillStyle = '#5a4434';
  ctx.save();
  ctx.translate(510, GROUND - 8);
  ctx.rotate(-1.3);
  ctx.fillRect(-14, -3, 28, 6);
  ctx.fillRect(-12, 3, 4, 14);
  ctx.fillRect(8, 3, 4, 14);
  ctx.restore();
  ctx.fillStyle = '#2a4a80';
  ctx.strokeStyle = '#0e2a5a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(106, GROUND - 34, 44, 34, 3);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(124, GROUND - 34);
  ctx.rotate(-0.4);
  ctx.fillStyle = '#6a5442';
  ctx.fillRect(-2, -34, 4, 34);
  ctx.fillStyle = '#7e8a9a';
  ctx.beginPath();
  ctx.moveTo(-14, -34);
  ctx.quadraticCurveTo(0, -40, 14, -32);
  ctx.lineTo(12, -29);
  ctx.quadraticCurveTo(0, -35, -12, -29);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // frost over all of it: nobody has touched it since
  ctx.fillStyle = 'rgba(200,226,255,0.16)';
  ctx.fillRect(96, GROUND - 90, 440, 90);
}

// The Gate: an iron ring set in the floor with a broken length of chain, and the stair cut down into clear ice
// going east, down into the Long Stair
function drawStairHead(ctx, time) {
  // the stair mouth: a slot of clearer ice, steps going down to the right into the dark
  const x0 = OLDICE_END_X - 70;
  ctx.fillStyle = 'rgba(100,150,220,0.22)';
  ctx.beginPath();
  ctx.moveTo(x0 - 20, GROUND);
  ctx.lineTo(x0 + 10, GROUND - 190);
  ctx.lineTo(OLDICE_W + 20, GROUND - 200);
  ctx.lineTo(OLDICE_W + 20, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#01030a';
  ctx.beginPath();
  ctx.moveTo(x0 + 10, GROUND);
  ctx.lineTo(x0 + 30, GROUND - 150);
  ctx.lineTo(OLDICE_W + 20, GROUND - 160);
  ctx.lineTo(OLDICE_W + 20, GROUND);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    const sx = x0 + 30 + i * 22, sy = GROUND - 10 - i * -2;
    ctx.fillStyle = `rgba(150,190,240,${0.4 - i * 0.06})`;
    ctx.fillRect(sx, sy - 26 + i * 6, 22, 3);
  }
  glow(ctx, x0 + 80, GROUND - 40, 80, 40, '110,160,255', 0.12 + 0.04 * Math.sin(time * 0.6));
  // the ring and the broken chain
  const rx = RING_X;
  ctx.fillStyle = '#2a2a32';
  ellipse(ctx, rx, GROUND - 2, 22, 7);
  ctx.strokeStyle = '#5a5a66';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(rx, GROUND - 16, 14, 16, 0, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = i % 2 ? '#4a4a56' : '#5e5e6a';
    ctx.beginPath();
    ctx.ellipse(rx + 22 + i * 15, GROUND - 4 - (i % 2) * 2, 9, 5, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = '#7a7a86'; // the last link, snapped
  ctx.beginPath();
  ctx.arc(rx + 84, GROUND - 4, 6, 0.6, TAU - 0.9);
  ctx.stroke();
  // deep scratches in the ice round it
  ctx.strokeStyle = 'rgba(160,200,250,0.35)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(rx - 60 + i * 9, GROUND - 28);
    ctx.lineTo(rx - 40 + i * 9, GROUND - 2);
    ctx.stroke();
  }
}

function drawFloor(ctx, L, R) {
  ctx.fillStyle = vgrad(ctx, 'floor', GROUND, H, [[0, '#1e3e74'], [1, '#020a1e']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = 'rgba(160,200,250,0.5)';
  ctx.fillRect(L, GROUND - 1, R - L, 3);
  ctx.strokeStyle = 'rgba(2,10,30,0.6)';
  ctx.lineWidth = 1.4;
  for (let x = Math.floor(L / 160) * 160; x < R; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x + 20, GROUND + 6);
    ctx.lineTo(x + 46, GROUND + 26);
    ctx.lineTo(x + 38, GROUND + 60);
    ctx.moveTo(x + 46, GROUND + 26);
    ctx.lineTo(x + 80, GROUND + 34);
    ctx.stroke();
  }
}

// The zones' markers: a slab of black ice with the name scratched in, a red level chip (hard-pocket rules)
function drawZoneMark(ctx, x, z) {
  ctx.font = `700 15px ${FONT}`;
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.save();
  ctx.translate(x, GROUND - 60);
  ctx.fillStyle = 'rgba(40,70,120,0.92)';
  ctx.strokeStyle = '#e0526e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, -24);
  ctx.lineTo(tw / 2, -28);
  ctx.lineTo(tw / 2 + 6, 60);
  ctx.lineTo(-tw / 2 - 4, 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#e8f2ff');
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.roundRect(-36, 4, 72, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 12.5, 11, '#fffaf0');
  ctx.restore();
}

// A cutters' arrow sign on a pole: the way back up, and the way on down
function drawArrow(ctx, x, label, dir, time) {
  ctx.fillStyle = '#5e5248';
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.02);
  ctx.font = `700 11px ${FONT}`;
  const hw = ctx.measureText(label).width / 2 + 16;
  ctx.fillStyle = '#c8b090';
  ctx.strokeStyle = '#6a5240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-dir * hw, -12);
  ctx.lineTo(dir * (hw - 8), -12);
  ctx.lineTo(dir * (hw + 4), 0);
  ctx.lineTo(dir * (hw - 8), 12);
  ctx.lineTo(-dir * hw, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,244,255,0.7)'; // rime on its top edge
  ctx.fillRect(-hw + 4, -13, hw * 2 - 12, 2);
  text(ctx, label, -dir * 2, 1, 11, '#3e3040');
  ctx.restore();
}
