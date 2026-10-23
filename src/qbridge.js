// Docs: docs/places/queensbridge.md
// The Queen's Bridge (room QBRIDGE, data in src/shared/rpg.js): out onto the ice bridge Queen Glacia froze
// across the strait, up the mended ice stair on Frostpine Ridge. High, grey and windy: a pale overcast sky,
// snow blowing sideways, and far below the strait, dark water with floes on it, Frostpeak's cliffs falling
// behind to the west and the next island's cliffs a grey ghost in the east, nearer than any other island but
// still too far. The deck is clear blue ice under snow, a long balustrade of ice arches along its back with a
// crown carved on every post; under the deck, icicles and empty air. West to east: the stair's head (the way
// back down), the Stairhead (no mobs: the waystone, the Strait Stone in src/ruins.js, an empty sentry box),
// the Span, the Frozen Guard (the Queen's guards frozen at their posts along the rail, still facing the
// crossing) and the Crack, where the deck split and heaved, a long crack running east along the floor to the
// Seam: frozen shut again every night (Sigrun's den, its way in drawn by src/dens-qbridge.js). Past the Seam
// the bridge's far half sags away into fog. The Shield's Perch, a lookout on the tallest arch over the Frozen
// Guard with two cups frozen to its ledge, is the hidden spot.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { QBRIDGE_W, QBRIDGE_EXIT_X, QBRIDGE_ZONES, QBRIDGE_PLATFORMS, SIGRUN_DEN_X, FIELD_GROUND } from './shared/rpg.js';
import { glow as radialGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const HORIZON = 300;
const GUARD_X = QBRIDGE_ZONES[2].x0, CRACK_X = QBRIDGE_ZONES[3].x0;
const PERCH = QBRIDGE_PLATFORMS.at(-1);
const SNOW = '#f4f8ff', SNOW_S = '#cfdcf0', ICE = '#b4d4f0', ICE_D = '#7aa4d0', ICE_L = '#e2f0fc', ICE_LINE = '#3e6294';
const SILVER = '#d8dce8', SILVER_D = '#8a90a8', WOOD = '#7a5a44', WOOD_D = '#4e3a2c';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function glow(ctx, x, y, rx, ry, rgb, a = 1) {
  radialGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3); // src/glow.js
}
// big gradients made once per canvas (docs/performance.md)
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
// floes on the strait far below
const floes = (() => {
  const r = mulberry32(4201);
  return Array.from({ length: 34 }, () => ({ x: r() * W * 2, y: HORIZON + 22 + r() * 120, w: 10 + r() * 46, d: 0.3 + r() * 0.7 }));
})();
// low cloud scudding past under the bridge and at its height
const clouds = (() => {
  const r = mulberry32(4211);
  return Array.from({ length: 12 }, () => ({ x: r() * (W + 600), y: 60 + r() * 200, w: 120 + r() * 220, v: 10 + r() * 22, a: 0.18 + r() * 0.2 }));
})();
// snow blowing sideways across the bridge
const flakes = (() => {
  const r = mulberry32(4221);
  return Array.from({ length: 80 }, () => ({ x: r() * W, y: r() * H, v: 60 + r() * 110, s: 0.8 + r() * 1.8, p: r() * TAU }));
})();
// the balustrade's posts along the back of the deck (not where the deck heaved up in the Crack)
const POST_GAP = 150;
// the Queen's guards, frozen at their posts along the rail (scenery, not mobs), facing east to the crossing
const guards = (() => {
  const r = mulberry32(4231);
  const out = [];
  for (let x = GUARD_X + 120; x < CRACK_X - 80; x += 260 + r() * 120) {
    if (QBRIDGE_PLATFORMS.some((p) => x > p.x - 50 && x < p.x + p.w + 50)) continue;
    out.push({ x, s: 0.9 + r() * 0.2, spear: r() < 0.6, lean: (r() - 0.5) * 0.06 });
  }
  return out;
})();
// the crack along the deck in the Crack: a jagged line, wider toward the Seam
const crackPts = (() => {
  const r = mulberry32(4241);
  const out = [];
  for (let x = CRACK_X - 200; x < SIGRUN_DEN_X; x += 26 + r() * 30) out.push([x, GROUND + 10 + r() * 12]);
  return out;
})();
const BOX_X = 720; // the empty sentry box at the Stairhead

// Everything behind the slimes. camX is the left edge of the view.
export function drawQueensBridge(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time);
  ctx.restore();

  const L = camX - 160, R = camX + viewW + 160;
  drawBalustrade(ctx, L, R, time);
  for (const g of guards) if (visible(g.x - 50, g.x + 50, L, R)) drawFrozenGuard(ctx, g, time);
  for (const p of QBRIDGE_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'arch') drawArch(ctx, p, time);
    else if (p.kind === 'post') drawPost(ctx, p, time);
    else if (p.kind === 'slab') drawSlab(ctx, p, time);
  }
  if (visible(PERCH.x - 80, PERCH.x + PERCH.w + 80, L, R)) drawPerch(ctx, PERCH, time);
  if (visible(BOX_X - 60, BOX_X + 120, L, R)) drawSentryBox(ctx, BOX_X, time);
  drawDeck(ctx, Math.max(-200, L), Math.min(QBRIDGE_W + 200, R), time);
  if (visible(-160, QBRIDGE_EXIT_X + 160, L, R)) drawStairHead(ctx, time);
  if (visible(QBRIDGE_W - 420, QBRIDGE_W + 200, L, R)) drawFarHalf(ctx, time);
  QBRIDGE_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x0 + 70;
    if (visible(sx - 80, sx + 80, L, R)) drawZoneBoard(ctx, sx, z, i, time);
  });
  if (visible(QBRIDGE_EXIT_X, QBRIDGE_EXIT_X + 260, L, R)) drawExitSign(ctx, QBRIDGE_EXIT_X + 100, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawSnow(ctx, camX, time);
  ctx.restore();
}

// The sky: pale overcast, grey-blue going lilac low down; cloud scudding past at the bridge's height; far below,
// the strait with floes, Frostpeak's cliffs behind to the west and the next island's cliffs a ghost to the east
function drawSky(ctx, camX, time) {
  ctx.fillStyle = vgrad(ctx, 'qb-sky', 0, HORIZON, [[0, '#9aa8c4'], [0.6, '#c4cadc'], [1, '#dcd8e8']]);
  ctx.fillRect(0, 0, W, HORIZON + 2);
  // the strait far below
  ctx.fillStyle = vgrad(ctx, 'qb-sea', HORIZON, H, [[0, '#7a8aa6'], [0.3, '#4e6280'], [1, '#2a3a54']]);
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  // the cliffs: Frostpeak's in the west (they fall behind as you walk out), the far island's in the east
  const k = Math.min(1, Math.max(0, camX / (QBRIDGE_W - W)));
  const wx = -120 - k * 520, ex = W + 180 - k * 320;
  ctx.fillStyle = 'rgba(74,84,110,0.85)';
  ctx.beginPath();
  ctx.moveTo(wx - 300, H);
  ctx.lineTo(wx - 300, HORIZON - 150);
  ctx.lineTo(wx + 60, HORIZON - 170);
  ctx.lineTo(wx + 150, HORIZON - 120);
  ctx.lineTo(wx + 210, HORIZON - 40);
  ctx.lineTo(wx + 260, HORIZON + 30);
  ctx.lineTo(wx + 300, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(240,244,252,0.8)';
  ctx.beginPath();
  ctx.moveTo(wx - 300, HORIZON - 150);
  ctx.lineTo(wx + 60, HORIZON - 170);
  ctx.lineTo(wx + 150, HORIZON - 120);
  ctx.lineTo(wx + 120, HORIZON - 112);
  ctx.lineTo(wx + 50, HORIZON - 156);
  ctx.lineTo(wx - 300, HORIZON - 138);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(150,160,186,0.55)';
  ctx.beginPath();
  ctx.moveTo(ex - 140, H);
  ctx.lineTo(ex - 100, HORIZON + 10);
  ctx.lineTo(ex - 60, HORIZON - 70);
  ctx.lineTo(ex + 20, HORIZON - 96);
  ctx.lineTo(ex + 400, HORIZON - 104);
  ctx.lineTo(ex + 400, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(236,240,250,0.45)';
  ellipse(ctx, ex + 120, HORIZON - 100, 120, 6);
  // the far half of the bridge itself, arching away toward that island and lost in haze
  ctx.strokeStyle = 'rgba(214,232,250,0.45)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(W * 0.5 + 400 - k * 500, 70);
  ctx.quadraticCurveTo(ex - 60, 60, ex + 10, HORIZON - 90);
  ctx.stroke();
  // floes on the water, drifting very slowly
  for (const f of floes) {
    const x = ((f.x - camX * 0.06 * f.d + time * 2 * f.d) % (W * 2) + W * 2) % (W * 2) - W * 0.5;
    if (x < -f.w || x > W + f.w) continue;
    ctx.fillStyle = `rgba(232,240,250,${0.5 + 0.3 * f.d})`;
    ellipse(ctx, x, f.y, f.w * (0.6 + f.d * 0.4), 2 + f.d * 2);
  }
  // haze on the water
  ctx.fillStyle = 'rgba(200,208,226,0.25)';
  ctx.fillRect(0, HORIZON, W, 30);
  // cloud scudding past
  for (const c of clouds) {
    const x = ((c.x - camX * 0.25 + time * c.v) % (W + 600) + W + 600) % (W + 600) - 300;
    ctx.fillStyle = `rgba(236,240,248,${c.a})`;
    ellipse(ctx, x, c.y, c.w, 16);
    ellipse(ctx, x + c.w * 0.3, c.y - 8, c.w * 0.5, 12);
  }
}

// The balustrade along the back of the deck: ice posts with a crown carved on each, joined by low arches, a
// rail on top. In the Crack the posts lean and some are snapped; none past the Seam
function drawBalustrade(ctx, L, R, time) {
  const top = GROUND - 74;
  const x0 = Math.max(0, Math.floor(L / POST_GAP) * POST_GAP), x1 = Math.min(SIGRUN_DEN_X - 120, R);
  // the arches between the posts
  ctx.fillStyle = 'rgba(190,218,244,0.55)';
  ctx.strokeStyle = 'rgba(62,98,148,0.55)';
  ctx.lineWidth = 2;
  for (let x = x0; x < x1; x += POST_GAP) {
    const broken = x > CRACK_X && (x / POST_GAP) % 3 === 1;
    if (broken) continue;
    ctx.beginPath();
    ctx.moveTo(x, GROUND);
    ctx.lineTo(x, top + 14);
    ctx.lineTo(x + POST_GAP, top + 14);
    ctx.lineTo(x + POST_GAP, GROUND);
    ctx.arc(x + POST_GAP / 2, GROUND - 4, POST_GAP / 2 - 12, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // the rail
  ctx.fillStyle = ICE_L;
  ctx.strokeStyle = ICE_LINE;
  for (let x = x0; x < x1; x += POST_GAP) {
    const lean = x > CRACK_X ? Math.sin(x) * 0.05 : 0;
    if (x > CRACK_X && (x / POST_GAP) % 3 === 1) continue;
    ctx.save();
    ctx.translate(x, top + 10);
    ctx.rotate(lean);
    ctx.beginPath();
    ctx.roundRect(0, 0, POST_GAP, 9, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = SNOW;
    ellipse(ctx, POST_GAP / 2, 0, POST_GAP / 2 - 6, 3);
    ctx.fillStyle = ICE_L;
    ctx.restore();
  }
  // the posts, a crown on each
  for (let x = x0; x < x1 + POST_GAP; x += POST_GAP) {
    const snapped = x > CRACK_X && (x / POST_GAP) % 4 === 2;
    ctx.save();
    ctx.translate(x, GROUND);
    if (x > CRACK_X) ctx.rotate(Math.sin(x * 1.7) * 0.06);
    ctx.fillStyle = ICE;
    ctx.strokeStyle = ICE_LINE;
    ctx.lineWidth = 2;
    const ph = snapped ? 46 : 86;
    ctx.beginPath();
    ctx.roundRect(-10, -ph, 20, ph, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ICE_L;
    ctx.fillRect(-6, -ph + 4, 4, ph - 8);
    if (snapped) {
      ctx.fillStyle = ICE;
      ctx.beginPath();
      ctx.moveTo(-10, -ph);
      ctx.lineTo(-4, -ph - 8);
      ctx.lineTo(2, -ph - 2);
      ctx.lineTo(10, -ph - 10);
      ctx.lineTo(10, -ph);
      ctx.closePath();
      ctx.fill();
    } else {
      // the little crown
      ctx.fillStyle = SILVER;
      ctx.strokeStyle = SILVER_D;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-9, -ph - 2);
      ctx.lineTo(-9, -ph - 12);
      ctx.lineTo(-4, -ph - 7);
      ctx.lineTo(0, -ph - 15);
      ctx.lineTo(4, -ph - 7);
      ctx.lineTo(9, -ph - 12);
      ctx.lineTo(9, -ph - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = SNOW;
      ellipse(ctx, 0, -ph - 1, 11, 2.5);
    }
    ctx.restore();
  }
}

// A guard of the Queen's, frozen half to ice at the rail: a fjord-folk slime in a round silver helm with a
// spear or a round shield, standing very straight, rimed over, its eyes shut. Not a mob: it never moves
function drawFrozenGuard(ctx, g, time) {
  const { x, s } = g, b = GROUND;
  ctx.save();
  ctx.translate(x, b);
  ctx.scale(s, s);
  ctx.rotate(g.lean);
  // the block of ice it stands in, up to its middle
  ctx.fillStyle = 'rgba(190,222,248,0.5)';
  ctx.beginPath();
  ctx.roundRect(-30, -40, 60, 40, 5);
  ctx.fill();
  // the body: pale frosted jelly
  ctx.fillStyle = '#dce8f4';
  ctx.strokeStyle = '#5a7aa0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, -2);
  ctx.bezierCurveTo(-28, -50, 28, -50, 24, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipse(ctx, -9, -34, 6, 9, -0.4);
  // shut eyes
  ctx.strokeStyle = '#4e6890';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(4, -26, 3, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.moveTo(15, -26);
  ctx.arc(12, -26, 3, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // the helm
  ctx.fillStyle = SILVER;
  ctx.strokeStyle = SILVER_D;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-20, -36);
  ctx.bezierCurveTo(-20, -56, 20, -56, 20, -36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-2, -58, 4, 8);
  if (g.spear) {
    ctx.fillStyle = WOOD;
    ctx.fillRect(22, -96, 3, 96);
    ctx.fillStyle = ICE_L;
    ctx.strokeStyle = ICE_LINE;
    ctx.beginPath();
    ctx.moveTo(23.5, -112);
    ctx.lineTo(28, -96);
    ctx.lineTo(19, -96);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = SILVER;
    ctx.strokeStyle = SILVER_D;
    ctx.beginPath();
    ctx.arc(20, -22, 15, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ICE;
    circle(ctx, 20, -22, 5);
  }
  // rime on the shoulders and helm
  ctx.fillStyle = 'rgba(250,252,255,0.9)';
  ellipse(ctx, 0, -50, 16, 3);
  ellipse(ctx, -18, -22, 4, 8);
  ctx.restore();
}

// An arch of the bridge's span, standing up off the deck (its flat top a platform): clear ice, a keystone
function drawArch(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 6, GROUND);
  ctx.lineTo(x + 6, y + 8);
  ctx.lineTo(x + w - 6, y + 8);
  ctx.lineTo(x + w - 6, GROUND);
  ctx.lineTo(x + w - 30, GROUND);
  ctx.arc(x + w / 2, GROUND, w / 2 - 30, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ICE_L;
  ctx.fillRect(x + 14, y + 14, 8, GROUND - y - 20);
  // the keystone, with the crown
  ctx.fillStyle = ICE_D;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 12, y + 10);
  ctx.lineTo(x + w / 2 + 12, y + 10);
  ctx.lineTo(x + w / 2 + 8, y + 34);
  ctx.lineTo(x + w / 2 - 8, y + 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SILVER;
  ctx.fillRect(x + w / 2 - 5, y + 16, 10, 6);
  // the top: snow
  ctx.fillStyle = SNOW;
  ctx.strokeStyle = SNOW_S;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 13, 6);
  ctx.fill();
  ctx.stroke();
  icicles(ctx, x + 10, x + w - 10, y + 9, 22);
}

// A guard post: a square tower of ice blocks on the parapet, a frozen guard's empty spear rack on it
function drawPost(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x + 14, y + 6, w - 28, GROUND - y - 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(62,98,148,0.4)';
  ctx.lineWidth = 1.2;
  for (let yy = y + 30; yy < GROUND; yy += 26) {
    ctx.beginPath();
    ctx.moveTo(x + 14, yy);
    ctx.lineTo(x + w - 14, yy);
    ctx.stroke();
    const off = ((yy - y) / 26) % 2 ? 0 : 30;
    for (let xx = x + 44 + off; xx < x + w - 20; xx += 60) {
      ctx.beginPath();
      ctx.moveTo(xx, yy - 26);
      ctx.lineTo(xx, yy);
      ctx.stroke();
    }
  }
  // the loophole, dark
  ctx.fillStyle = '#3e5a80';
  ctx.beginPath();
  ctx.roundRect(x + w / 2 - 6, y + 40, 12, 30, 6);
  ctx.fill();
  // crenellations and snow
  ctx.fillStyle = ICE_L;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.rect(x + 4 + i * ((w - 8) / 4) + 4, y - 10, (w - 8) / 4 - 8, 14);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = SNOW;
  ctx.strokeStyle = SNOW_S;
  ctx.beginPath();
  ctx.roundRect(x, y - 2, w, 10, 5);
  ctx.fill();
  ctx.stroke();
}

// A slab of the deck heaved up on edge where the bridge cracked: thick blue ice, snow on its top
function drawSlab(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 6);
  ctx.lineTo(x + w - 4, y + 2);
  ctx.lineTo(x + w - 18, GROUND);
  ctx.lineTo(x + 20, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // its layers, as in the deck's edge
  ctx.strokeStyle = 'rgba(62,98,148,0.35)';
  ctx.lineWidth = 1.2;
  for (let i = 1; i < 5; i++) {
    const yy = y + 6 + i * ((GROUND - y) / 5);
    ctx.beginPath();
    ctx.moveTo(x + 8 + i * 3, yy);
    ctx.lineTo(x + w - 10 - i * 3, yy - 3);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(x + 24, y + 12, 10, GROUND - y - 20);
  ctx.fillStyle = SNOW;
  ctx.strokeStyle = SNOW_S;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 2, y - 4, w + 4, 11, 5);
  ctx.fill();
  ctx.stroke();
}

// The Shield's Perch: a lookout on top of the tallest arch, a little ice parapet, and on its ledge two cups
// frozen side by side, one plain and one with a crown on it, both full of ice
function drawPerch(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  // the tall arch it stands on
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, 260);
  ctx.lineTo(x + 2, y + 6);
  ctx.lineTo(x + w - 2, y + 6);
  ctx.lineTo(x + w + 10, 260);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ICE_L;
  ctx.fillRect(x + 10, y + 10, 8, 244 - y);
  ctx.fillStyle = SNOW;
  ctx.strokeStyle = SNOW_S;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, 12, 6);
  ctx.fill();
  ctx.stroke();
  // the parapet at the back
  ctx.fillStyle = ICE_L;
  ctx.strokeStyle = ICE_LINE;
  ctx.beginPath();
  ctx.roundRect(x + 4, y - 30, 12, 28, 3);
  ctx.roundRect(x + w - 16, y - 30, 12, 28, 3);
  ctx.fill();
  ctx.stroke();
  // the two cups
  glow(ctx, cx, y - 10, 30, 20, '220,236,255', 0.3 + 0.08 * Math.sin(time * 1.3));
  for (const [dx, crown] of [[-9, false], [9, true]]) {
    ctx.fillStyle = SILVER;
    ctx.strokeStyle = SILVER_D;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + dx - 5, y - 13);
    ctx.lineTo(cx + dx + 5, y - 13);
    ctx.lineTo(cx + dx + 3, y - 4);
    ctx.lineTo(cx + dx - 3, y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(cx + dx - 1, y - 4, 2, 3);
    ctx.fillRect(cx + dx - 3, y - 2, 6, 2);
    ctx.fillStyle = 'rgba(200,232,255,0.95)';
    ellipse(ctx, cx + dx, y - 13, 4.6, 1.6);
    if (crown) {
      ctx.fillStyle = '#c9a64a';
      ctx.beginPath();
      ctx.moveTo(cx + dx - 3, y - 8);
      ctx.lineTo(cx + dx - 3, y - 11);
      ctx.lineTo(cx + dx - 1, y - 9.5);
      ctx.lineTo(cx + dx, y - 12);
      ctx.lineTo(cx + dx + 1, y - 9.5);
      ctx.lineTo(cx + dx + 3, y - 11);
      ctx.lineTo(cx + dx + 3, y - 8);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// The empty sentry box at the Stairhead: a little hut of ice blocks with a peaked roof, a bench inside, a horn
// hanging by the door on a peg, never blown
function drawSentryBox(ctx, x, time) {
  const b = GROUND;
  ctx.fillStyle = ICE;
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x, b - 86, 70, 86);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3e5a80';
  ctx.beginPath();
  ctx.roundRect(x + 14, b - 66, 42, 66, [20, 20, 0, 0]);
  ctx.fill();
  ctx.fillStyle = WOOD;
  ctx.fillRect(x + 18, b - 26, 34, 5);
  ctx.fillStyle = ICE_L;
  ctx.beginPath();
  ctx.moveTo(x - 8, b - 84);
  ctx.lineTo(x + 35, b - 118);
  ctx.lineTo(x + 78, b - 84);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.moveTo(x - 10, b - 84);
  ctx.lineTo(x + 35, b - 120);
  ctx.lineTo(x + 80, b - 84);
  ctx.lineTo(x + 70, b - 82);
  ctx.lineTo(x + 35, b - 110);
  ctx.lineTo(x, b - 82);
  ctx.closePath();
  ctx.fill();
  // the horn on its peg
  ctx.fillStyle = WOOD_D;
  ctx.fillRect(x + 76, b - 66, 6, 3);
  ctx.save();
  ctx.translate(x + 80, b - 60);
  ctx.rotate(0.3 + Math.sin(time * 1.4) * 0.04);
  ctx.fillStyle = '#e8dcc0';
  ctx.strokeStyle = '#8a7a5a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, 8, 10, 26);
  ctx.lineTo(4, 26);
  ctx.quadraticCurveTo(6, 10, -2, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(250,252,255,0.9)';
  ellipse(ctx, 8, 6, 4, 1.4);
  ctx.restore();
}

// The deck: blue ice under a skin of snow, the bridge's thick edge below the floor line with icicles hanging off
// it and the strait far, far below. In the Crack the crack runs east along it, widening toward the Seam
function drawDeck(ctx, L, R, time) {
  ctx.fillStyle = SNOW;
  ctx.fillRect(L, GROUND - 2, R - L, 10);
  ctx.fillStyle = vgrad(ctx, 'qb-deck', GROUND + 8, GROUND + 50, [[0, '#cfe4f8'], [0.6, '#8ab0d8'], [1, '#5a80b0']]);
  ctx.fillRect(L, GROUND + 8, R - L, 42);
  ctx.strokeStyle = 'rgba(62,98,148,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(L, GROUND + 22);
  ctx.lineTo(R, GROUND + 22);
  ctx.moveTo(L, GROUND + 36);
  ctx.lineTo(R, GROUND + 36);
  ctx.stroke();
  // under the deck: empty air, the strait far below (the sky's sea shows through), icicles off the edge
  icicles(ctx, L, R, GROUND + 50, 34);
  // the crack
  const c0 = Math.max(L, CRACK_X - 200), c1 = Math.min(R, SIGRUN_DEN_X);
  if (c1 > c0) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // the dark crack, one segment at a time so it can widen toward the Seam, then a thin lit line in it
    ctx.strokeStyle = '#2e4e78';
    for (let i = 1; i < crackPts.length; i++) {
      const [xa, ya] = crackPts[i - 1], [xb, yb] = crackPts[i];
      if (xb < c0 - 60 || xa > c1 + 60) continue;
      ctx.lineWidth = 3 + 7 * Math.max(0, (xa - CRACK_X) / (SIGRUN_DEN_X - CRACK_X));
      ctx.beginPath();
      ctx.moveTo(xa, ya - 6);
      ctx.lineTo(xb, yb - 6);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(160,220,255,0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    let first = true;
    for (const [x, y] of crackPts) {
      if (x < c0 - 60 || x > c1 + 60) continue;
      first ? ctx.moveTo(x, y - 6) : ctx.lineTo(x, y - 6);
      first = false;
    }
    ctx.stroke();
    // little side cracks
    ctx.strokeStyle = 'rgba(46,78,120,0.6)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < crackPts.length; i += 3) {
      const [x, y] = crackPts[i];
      if (x < c0 || x > c1) continue;
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 12, y + 8);
      ctx.stroke();
    }
  }
}

function icicles(ctx, x0, x1, y, gap) {
  ctx.fillStyle = 'rgba(214,236,252,0.92)';
  for (let x = Math.floor(x0 / gap) * gap + 6; x < x1; x += gap) {
    const len = 8 + ((x * 13) % 17);
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x, y + len);
    ctx.closePath();
    ctx.fill();
  }
}

// The way back down: the head of the ice stair, its top blocks going down over the west end, the cutters'
// rope rail on pegs and their red flag (mended in F4)
function drawStairHead(ctx, time) {
  const x = QBRIDGE_EXIT_X, b = GROUND;
  for (let i = 0; i < 5; i++) {
    const bx = x - 40 - i * 24, by = b + i * 20;
    ctx.fillStyle = i ? ICE : ICE_L;
    ctx.strokeStyle = ICE_LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by - 6, 30, 26, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = SNOW;
    ellipse(ctx, bx + 15, by - 6, 15, 3);
  }
  ctx.strokeStyle = '#a07e58';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 14, b - 30);
  ctx.quadraticCurveTo(x - 40, b - 14, x - 120, b + 60);
  ctx.stroke();
  ctx.fillStyle = '#5a5a66';
  ctx.fillRect(x + 11, b - 36, 6, 12);
  ctx.fillStyle = '#7a5a40';
  ctx.fillRect(x - 20, b - 74, 3, 68);
  ctx.fillStyle = '#d0485a';
  ctx.beginPath();
  ctx.moveTo(x - 17, b - 74);
  ctx.quadraticCurveTo(x - 4, b - 70 + Math.sin(time * 5) * 3, x + 6, b - 66 + Math.sin(time * 5 + 1) * 4);
  ctx.lineTo(x - 17, b - 58);
  ctx.closePath();
  ctx.fill();
}

// Past the Seam: the bridge's far half, cracked away and sagging, its broken balustrade going down into the fog
function drawFarHalf(ctx, time) {
  const x = SIGRUN_DEN_X + 140, b = GROUND;
  ctx.save();
  ctx.translate(x, b + 8);
  ctx.rotate(0.07);
  ctx.fillStyle = 'rgba(180,210,240,0.9)';
  ctx.strokeStyle = ICE_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(12, -4);
  ctx.lineTo(8, 6);
  ctx.lineTo(18, 14);
  ctx.lineTo(500, 60);
  ctx.lineTo(500, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = SNOW;
  ctx.fillRect(4, -14, 500, 6);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = ICE;
    ctx.fillRect(30 + i * 110, -60 + i * 4, 14, 52);
  }
  ctx.restore();
  // fog rolling over it
  for (let i = 0; i < 4; i++) {
    const fx = x + 60 + i * 80 + Math.sin(time * 0.3 + i) * 20;
    ctx.fillStyle = `rgba(226,232,244,${0.5 + i * 0.1})`;
    ellipse(ctx, fx, b - 40 + (i % 2) * 20, 120, 50);
  }
}

// The zones' boards: a silver plaque on an ice post, a pale blue pennant with a white crown on it
function drawZoneBoard(ctx, x, z, i, time) {
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 30);
  ctx.fillStyle = ICE;
  ctx.fillRect(x - tw / 2 + 10, GROUND - 92, 6, 92);
  ctx.fillRect(x + tw / 2 - 16, GROUND - 92, 6, 92);
  ctx.fillStyle = '#8ab8e0';
  ctx.beginPath();
  ctx.moveTo(x + tw / 2 - 10, GROUND - 92);
  ctx.quadraticCurveTo(x + tw / 2 + 4, GROUND - 88 + Math.sin(time * 5) * 2, x + tw / 2 + 12, GROUND - 84 + Math.sin(time * 5 + 1) * 3);
  ctx.lineTo(x + tw / 2 - 10, GROUND - 78);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 66);
  ctx.fillStyle = SILVER;
  ctx.strokeStyle = SILVER_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -20, tw, 46, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -6, 15, '#3e4660');
  const red = i === QBRIDGE_ZONES.length - 1;
  ctx.fillStyle = red ? '#d0485a' : 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(-32, 6, 64, 16, 8);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 14.5, 11, red ? '#fffaf0' : '#3e4660');
  ctx.fillStyle = SNOW;
  ctx.beginPath();
  ctx.roundRect(-tw / 2 - 2, -24, tw + 4, 8, 4);
  ctx.fill();
  ctx.restore();
}

// The way back down to the ridge
function drawExitSign(ctx, x, time) {
  ctx.fillStyle = WOOD;
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.8) * 0.03);
  ctx.fillStyle = '#e2bf8f';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(64, -12);
  ctx.lineTo(-58, -12);
  ctx.lineTo(-70, 0);
  ctx.lineTo(-58, 12);
  ctx.lineTo(64, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Down to the ridge', -2, 1, 11, '#5b4a6b');
  ctx.fillStyle = SNOW;
  ellipse(ctx, 0, -12, 56, 3);
  ctx.restore();
}

// Snow blowing sideways across the bridge, from the west
function drawSnow(ctx, camX, time) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const f of flakes) {
    const x = ((f.x - camX * 0.6 + time * f.v) % W + W) % W;
    const y = ((f.y + time * 30 + Math.sin(time * 2 + f.p) * 8) % H + H) % H;
    circle(ctx, x, y, f.s);
  }
}
