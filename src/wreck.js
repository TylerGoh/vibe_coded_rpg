// Docs: docs/places/wreck.md
// Wreck Cave (room WRECK, data in src/shared/rpg.js): a hard pocket behind the flooded mouth at Saltspray
// Coves' far west end. You come in at the EAST end (the mouth, daylight and sea behind you) and go west into
// the dark: the Cave Mouth (no mobs), the Drowned Gallery (rock ledges, drowned cargo, old lamps still
// glowing), and the Wreck, where the apple ship Brave Pippin lies broken-backed on the sand with its masts
// snapped, the Drowned Bosun's home. Platforms: rock ledges, a wedged spar, the wreck's foredeck, aft deck,
// stern castle and foremast yard, and the crow's nest (the hidden spot). Cool and soft, still pastel:
// slate-blue rock, green water light, warm lamp glows.
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { WRECK_W, WRECK_EXIT_X, WRECK_ZONES, WRECK_PLATFORMS, FIELD_GROUND } from './shared/rpg.js';
import { glow as softGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const HULL_X0 = 330, HULL_X1 = 1560; // the wreck: bow (west) to stern (east)
const BREAK_X0 = 810, BREAK_X1 = 1140; // where her back broke
const FOREMAST_X = 665, MAINMAST_X = 1050;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ——— seeded scenery ———
const farRocks = [0.3, 0.55].map((f, j) => {
  const r = mulberry32(3201 + j);
  return { f, bumps: Array.from({ length: 10 }, (_, i) => ({ x: i * 200 + r() * 90, w: 140 + r() * 140, h: 90 + r() * 110 + j * 30 })) };
});
const stalactites = (() => {
  const r = mulberry32(3211);
  const out = [];
  for (let x = 20; x < WRECK_W; x += 40 + r() * 90) out.push({ x, h: 14 + r() * 46, w: 8 + r() * 12, drip: r() * 5 });
  return out;
})();
const pools = (() => {
  const r = mulberry32(3221);
  const out = [];
  for (let x = 120; x < WRECK_W - 100; x += 180 + r() * 260) out.push({ x, w: 40 + r() * 70 });
  return out;
})();
const shells = (() => {
  const r = mulberry32(3231);
  const out = [];
  for (let x = 30; x < WRECK_W; x += 30 + r() * 70) out.push({ x, k: Math.floor(r() * 3), s: 0.7 + r() * 0.6, y: r() * 8 });
  return out;
})();
// drowned cargo along the Gallery and round the wreck: barrels, crates, apples spilled from them
const CARGO = [
  { x: 1820, k: 'crate' }, { x: 1880, k: 'barrel' }, { x: 2120, k: 'barrel', tip: true }, { x: 2480, k: 'crate' },
  { x: 2870, k: 'barrel' }, { x: 2930, k: 'barrel', tip: true }, { x: 3060, k: 'crate' }, { x: 260, k: 'barrel', tip: true }, { x: 960, k: 'crate' },
];
// old ship's lamps hung on pegs in the rock, still glowing
const LAMPS = [1900, 2350, 2780, 3120, 3420];
const SHAFTS = [{ x: 2050, w: 70 }, { x: 2650, w: 50 }, { x: 1250, w: 60 }];
const motes = (() => {
  const r = mulberry32(3241);
  return Array.from({ length: 30 }, () => ({ x: r() * W, y: 80 + r() * 340, v: 5 + r() * 9, p: r() * TAU, s: 1 + r() * 1.6 }));
})();

// Everything behind the slimes. camX is the left edge of the view.
export function drawWreck(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawBackWall(ctx, camX, time);
  ctx.restore();
  const L = camX - 80, R = camX + viewW + 80;
  const l = Math.max(0, L), r = Math.min(WRECK_W, R);
  for (const s of SHAFTS) if (visible(s.x - 120, s.x + 120, L, R)) drawShaft(ctx, s, time);
  if (visible(WRECK_W - 600, WRECK_W + 60, L, R)) drawMouth(ctx, time);
  drawRoof(ctx, l, r, time);
  for (const x of LAMPS) if (visible(x - 60, x + 60, L, R)) drawLamp(ctx, x, time);
  if (visible(HULL_X0 - 120, HULL_X1 + 120, L, R)) drawShip(ctx, time);
  for (const p of WRECK_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'ledge') drawLedge(ctx, p);
    else if (p.kind === 'spar') drawSpar(ctx, p);
  }
  drawFloor(ctx, l, r, time);
  for (const c of CARGO) if (visible(c.x - 50, c.x + 50, L, R)) drawCargo(ctx, c);
  WRECK_ZONES.forEach((z, i) => {
    if (!z.lvl) return;
    const sx = z.x1 - 55; // (you walk in from the east, so each zone's sign is at its east end)
    if (visible(sx - 80, sx + 80, L, R)) drawZoneSign(ctx, sx, z, i, time);
  });
  if (visible(WRECK_EXIT_X - 160, WRECK_EXIT_X + 60, L, R)) drawExitSign(ctx, WRECK_EXIT_X - 90, time);
  drawMotes(ctx, camX, time);
}

function drawBackWall(ctx, camX, time) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#16222e');
  g.addColorStop(1, '#2c4656');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // daylight spilling in from the mouth (east), fading as you go deeper
  const k = Math.max(0, Math.min(1, (camX - (WRECK_W - 2200)) / 1400));
  glow(ctx, W * 1.05, 260, 700, 380, '190,230,240', 0.1 + 0.32 * k);
  // green water light rippling on the wall
  glow(ctx, W * 0.35, 320, 520, 200, '120,210,190', 0.1 + 0.03 * Math.sin(time * 0.8));
  farRocks.forEach(({ f, bumps }, j) => {
    ctx.fillStyle = j ? '#2a4050' : '#1f3242';
    const span = 200 * 10, off = -((camX * f) % span);
    for (const rep of [0, span]) {
      ctx.beginPath();
      ctx.moveTo(off + rep - 50, GROUND);
      for (const b of bumps) {
        const x = off + rep + b.x;
        ctx.lineTo(x - b.w / 2, GROUND - 20);
        ctx.quadraticCurveTo(x - b.w * 0.3, GROUND - b.h, x, GROUND - b.h * 1.05);
        ctx.quadraticCurveTo(x + b.w * 0.3, GROUND - b.h, x + b.w / 2, GROUND - 20);
      }
      ctx.lineTo(off + rep + span + 50, GROUND);
      ctx.closePath();
      ctx.fill();
    }
  });
  // ripples of reflected water light dancing on the far rock
  ctx.strokeStyle = 'rgba(170,240,220,0.12)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const x = ((i * 157 - camX * 0.4) % W + W) % W, y = 200 + (i % 3) * 50;
    ctx.beginPath();
    ctx.moveTo(x - 30, y + Math.sin(time * 1.5 + i) * 3);
    ctx.quadraticCurveTo(x, y - 6 + Math.sin(time * 2 + i) * 4, x + 30, y + Math.sin(time * 1.7 + i) * 3);
    ctx.stroke();
  }
}

// A shaft of daylight through a crack in the roof, dust turning in it
function drawShaft(ctx, s, time) {
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.04 * Math.sin(time * 0.7 + s.x);
  ctx.fillStyle = '#d8f0f0';
  ctx.beginPath();
  ctx.moveTo(s.x - s.w * 0.3, 20);
  ctx.lineTo(s.x + s.w * 0.3, 20);
  ctx.lineTo(s.x + s.w * 1.4 + 40, GROUND);
  ctx.lineTo(s.x - s.w * 0.4 + 40, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  glow(ctx, s.x + 40 + s.w * 0.5, GROUND, s.w * 1.4, 18, '220,245,240', 0.35);
}

// The cave mouth at the far east end: an arch of daylight with the sea and the sky outside
function drawMouth(ctx, time) {
  const x0 = WRECK_W - 260;
  glow(ctx, WRECK_W - 80, GROUND - 150, 380, 260, '210,240,245', 0.5);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, GROUND);
  ctx.quadraticCurveTo(x0 + 10, GROUND - 270, WRECK_W - 40, GROUND - 290);
  ctx.lineTo(WRECK_W + 60, GROUND - 290);
  ctx.lineTo(WRECK_W + 60, GROUND);
  ctx.closePath();
  ctx.clip();
  const s = ctx.createLinearGradient(0, GROUND - 290, 0, GROUND);
  s.addColorStop(0, '#cfeaf4');
  s.addColorStop(1, '#f4ecdc');
  ctx.fillStyle = s;
  ctx.fillRect(x0, GROUND - 300, 400, 300);
  // the sea outside, and a far sea stack
  ctx.fillStyle = '#7cc0d8';
  ctx.fillRect(x0, GROUND - 70, 400, 70);
  ctx.fillStyle = '#a8a2b0';
  ctx.beginPath();
  ctx.moveTo(x0 + 150, GROUND - 70);
  ctx.quadraticCurveTo(x0 + 160, GROUND - 150, x0 + 190, GROUND - 160);
  ctx.quadraticCurveTo(x0 + 215, GROUND - 120, x0 + 220, GROUND - 70);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const y = GROUND - 60 + i * 14, o = Math.sin(time * 1.2 + i) * 10;
    ctx.beginPath();
    ctx.moveTo(x0 + 20 + o, y);
    ctx.lineTo(x0 + 120 + o, y);
    ctx.stroke();
  }
  ctx.restore();
  // the arch's rim of rock
  ctx.strokeStyle = '#3e5464';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(x0, GROUND + 4);
  ctx.quadraticCurveTo(x0 + 10, GROUND - 270, WRECK_W - 40, GROUND - 290);
  ctx.stroke();
  ctx.fillStyle = '#5f8a5a';
  for (let i = 0; i < 6; i++) ellipse(ctx, x0 + 6 + i * 4, GROUND - 40 - i * 40, 5, 9);
}

// The roof: rock edge with stalactites, and drips falling now and then
function drawRoof(ctx, L, R, time) {
  ctx.fillStyle = '#0f1a24';
  ctx.beginPath();
  ctx.moveTo(L - 20, 0);
  for (let x = L - (L % 40) - 40; x <= R + 40; x += 40) ctx.lineTo(x, 26 + Math.sin(x * 0.013) * 10 + Math.sin(x * 0.041) * 5);
  ctx.lineTo(R + 20, 0);
  ctx.closePath();
  ctx.fill();
  for (const s of stalactites) {
    if (s.x < L - 30 || s.x > R + 30) continue;
    const top = 22 + Math.sin(s.x * 0.013) * 10;
    ctx.fillStyle = '#1e2e3c';
    ctx.beginPath();
    ctx.moveTo(s.x - s.w / 2, top);
    ctx.quadraticCurveTo(s.x - 2, top + s.h * 0.7, s.x, top + s.h);
    ctx.quadraticCurveTo(s.x + 2, top + s.h * 0.7, s.x + s.w / 2, top);
    ctx.closePath();
    ctx.fill();
    // a drip gathering at the tip, falling, splashing
    const cyc = (time * 0.35 + s.drip) % 3;
    if (cyc < 2.2) {
      ctx.fillStyle = 'rgba(190,230,240,0.7)';
      circle(ctx, s.x, top + s.h + 2, Math.min(2.4, cyc * 1.6));
    } else {
      const k = (cyc - 2.2) / 0.8, y = top + s.h + k * k * (GROUND - top - s.h);
      ctx.fillStyle = 'rgba(190,230,240,0.7)';
      ellipse(ctx, s.x, y, 1.8, 3);
    }
  }
}

// An old ship's lamp hung on a peg in the rock, still glowing
function drawLamp(ctx, x, time) {
  const y = 190 + (x % 3) * 22, f = 0.75 + 0.25 * Math.sin(time * 5 + x);
  ctx.strokeStyle = '#3e3428';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 24);
  ctx.lineTo(x + 4, y - 24);
  ctx.lineTo(x, y - 12);
  ctx.stroke();
  glow(ctx, x, y, 60, 60, '255,214,140', 0.4 * f);
  ctx.fillStyle = '#7a8a5a';
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 10);
  ctx.quadraticCurveTo(x, y - 18, x + 7, y - 10);
  ctx.fill();
  ctx.fillStyle = `rgba(255,226,150,${0.8 * f})`;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 10, 12, 16, 4);
  ctx.fill();
  ctx.fillStyle = '#7a8a5a';
  ctx.fillRect(x - 7, y + 6, 14, 3);
}

// ——— the wreck of the Brave Pippin ———
// Her hull lies along the sand, bow to the west, her back broken in the middle; the foredeck and aft deck are
// platforms (y 340), the stern castle (y 250) and the foremast's yard (y 248) above, the crow's nest higher.
function drawShip(ctx, time) {
  const deck = 340;
  const hullPath = (x0, x1, bow, stern) => {
    ctx.beginPath();
    ctx.moveTo(x0, deck);
    if (bow) ctx.quadraticCurveTo(x0 - 70, deck + 10, x0 - 60, deck - 30); // the bow's rise
    if (bow) ctx.lineTo(x0, deck);
    ctx.lineTo(x1, deck);
    if (stern) ctx.lineTo(x1 + 20, deck - 100);
    if (stern) ctx.lineTo(x1 + 40, deck - 100);
    if (stern) ctx.quadraticCurveTo(x1 + 48, deck + 30, x1 + 10, GROUND + 6);
    else ctx.lineTo(x1, GROUND + 6);
    ctx.lineTo(x0 + (bow ? 40 : 0), GROUND + 6);
    if (bow) ctx.quadraticCurveTo(x0 - 50, GROUND - 20, x0 - 60, deck - 30);
    ctx.closePath();
  };
  const planks = (x0, x1) => {
    ctx.strokeStyle = 'rgba(40,26,20,0.45)';
    ctx.lineWidth = 1.5;
    for (let y = deck + 16; y < GROUND; y += 16) {
      ctx.beginPath();
      ctx.moveTo(x0 - 30, y);
      ctx.lineTo(x1 + 30, y);
      ctx.stroke();
    }
  };
  // masts (behind the hull): the foremast up to the nest, the mainmast snapped short
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(FOREMAST_X - 7, 120, 14, deck - 120);
  ctx.fillStyle = '#6e5040';
  ctx.fillRect(FOREMAST_X - 4, 120, 4, deck - 120);
  ctx.fillStyle = '#5a4030';
  ctx.beginPath(); // the mainmast's jagged stump
  ctx.moveTo(MAINMAST_X - 8, deck);
  ctx.lineTo(MAINMAST_X - 8, 230);
  ctx.lineTo(MAINMAST_X - 2, 214);
  ctx.lineTo(MAINMAST_X + 2, 228);
  ctx.lineTo(MAINMAST_X + 8, 220);
  ctx.lineTo(MAINMAST_X + 8, deck);
  ctx.closePath();
  ctx.fill();
  // rigging: slack ropes from the foremast, hung with weed
  ctx.strokeStyle = 'rgba(200,180,140,0.55)';
  ctx.lineWidth = 1.5;
  for (const [x1, y1] of [[HULL_X0 - 50, deck - 26], [820, deck], [470, deck]]) {
    ctx.beginPath();
    ctx.moveTo(FOREMAST_X, 160);
    ctx.quadraticCurveTo((FOREMAST_X + x1) / 2, (160 + y1) / 2 + 30, x1, y1);
    ctx.stroke();
  }
  // the hull: forward half and aft half, with the break between
  for (const [x0, x1, bow, stern] of [[HULL_X0 + 90, BREAK_X0, true, false], [BREAK_X1, HULL_X1 - 60, false, true]]) {
    const g = ctx.createLinearGradient(0, deck, 0, GROUND);
    g.addColorStop(0, '#7a5640');
    g.addColorStop(1, '#4a3428');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#2e2018';
    ctx.lineWidth = 2.5;
    hullPath(x0, x1, bow, stern);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    hullPath(x0, x1, bow, stern);
    ctx.clip();
    planks(x0 - 80, x1 + 60);
    // a green weed line and barnacles where the water used to stand
    ctx.fillStyle = 'rgba(95,138,90,0.55)';
    ctx.fillRect(x0 - 80, GROUND - 36, x1 - x0 + 160, 14);
    ctx.restore();
    // the gunwale (rail) along the deck
    ctx.fillStyle = '#8a6450';
    ctx.fillRect(x0, deck - 4, x1 - x0, 7);
  }
  // jagged broken ends at the break
  ctx.fillStyle = '#4a3428';
  for (const [x, s] of [[BREAK_X0, 1], [BREAK_X1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(x, deck);
    for (let i = 0; i <= 6; i++) ctx.lineTo(x + s * (i % 2 ? 22 : 8), deck + i * 18);
    ctx.lineTo(x, GROUND + 6);
    ctx.closePath();
    ctx.fill();
  }
  // a scatter of loose planks in the gap
  ctx.fillStyle = '#6a4a38';
  for (const [x, y, a] of [[880, GROUND - 6, 0.2], [960, GROUND - 14, -0.5], [1060, GROUND - 8, 0.1]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillRect(-36, -4, 72, 8);
    ctx.restore();
  }
  // portholes, a few glowing
  for (const x of [520, 620, 720, 1230, 1330, 1430]) {
    const lit = x === 1330 || x === 620;
    if (lit) glow(ctx, x, deck + 40, 26, 22, '255,214,140', 0.45);
    ctx.fillStyle = lit ? '#ffe0a0' : '#22303a';
    ctx.strokeStyle = '#c8a050';
    ctx.lineWidth = 2.4;
    circle(ctx, x, deck + 40, 8);
    ctx.stroke();
  }
  // the name on the bow
  text(ctx, 'BRAVE PIPPIN', HULL_X0 + 190, deck + 22, 13, '#e8d4a8');
  // the figurehead: a carved slime hugging an apple, on the bow
  const fx = HULL_X0 + 22, fy = deck - 36;
  ctx.fillStyle = '#e0c89a';
  ctx.strokeStyle = '#8a6a40';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(fx, fy, 18, 15, -0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d85a5a';
  circle(ctx, fx - 14, fy + 4, 8);
  ctx.fillStyle = '#5a8a3a';
  ellipse(ctx, fx - 12, fy - 6, 4, 2, -0.5);
  ctx.fillStyle = '#5a4030';
  circle(ctx, fx - 3, fy - 3, 1.8);
  circle(ctx, fx + 5, fy - 4, 1.8);
  // the stern castle: a cabin with lit windows; its roof is a platform (y 250)
  const sx0 = 1290, sx1 = 1470;
  ctx.fillStyle = '#6a4a38';
  ctx.strokeStyle = '#2e2018';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.rect(sx0, 250, sx1 - sx0, deck - 250);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a6450';
  ctx.fillRect(sx0 - 8, 246, sx1 - sx0 + 16, 8);
  for (const x of [sx0 + 30, sx0 + 80, sx0 + 130]) {
    glow(ctx, x + 12, 290, 26, 24, '255,214,140', 0.35 + 0.1 * Math.sin(time * 3 + x));
    ctx.fillStyle = '#ffdc96';
    ctx.strokeStyle = '#3e2a20';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, 275, 24, 26, [10, 10, 2, 2]);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 12, 275);
    ctx.lineTo(x + 12, 301);
    ctx.stroke();
  }
  // the stern lantern, hanging off the back
  const lsw = Math.sin(time * 1.4) * 0.15;
  ctx.save();
  ctx.translate(sx1 + 30, 240);
  ctx.rotate(lsw);
  ctx.strokeStyle = '#3e2a20';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 22);
  ctx.stroke();
  glow(ctx, 0, 32, 30, 30, '255,214,140', 0.5);
  ctx.fillStyle = '#ffe0a0';
  ctx.beginPath();
  ctx.roundRect(-6, 22, 12, 16, 4);
  ctx.fill();
  ctx.restore();
  // the foremast's yard (a platform) with its sail furled and torn
  const yd = WRECK_PLATFORMS.find((p) => p.kind === 'yard');
  ctx.fillStyle = '#5a4030';
  ctx.beginPath();
  ctx.roundRect(yd.x - 6, yd.y, yd.w + 12, 9, 4);
  ctx.fill();
  ctx.fillStyle = '#e8dcc0';
  ctx.strokeStyle = '#a8987a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(yd.x + 10, yd.y + 9);
  ctx.quadraticCurveTo(yd.x + yd.w / 2, yd.y + 30, yd.x + yd.w - 10, yd.y + 9);
  ctx.lineTo(yd.x + yd.w - 40, yd.y + 50);
  ctx.lineTo(yd.x + yd.w - 60, yd.y + 34);
  ctx.lineTo(yd.x + 70, yd.y + 46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // the crow's nest (the hidden spot): a barrel basket at the top of the foremast, a tattered flag
  const ns = WRECK_PLATFORMS.find((p) => p.kind === 'nest');
  ctx.fillStyle = '#7a5640';
  ctx.strokeStyle = '#2e2018';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ns.x, ns.y);
  ctx.lineTo(ns.x + ns.w, ns.y);
  ctx.lineTo(ns.x + ns.w - 10, ns.y + 36);
  ctx.lineTo(ns.x + 10, ns.y + 36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c8a050';
  ctx.fillRect(ns.x + 2, ns.y + 8, ns.w - 4, 4);
  ctx.fillRect(ns.x + 6, ns.y + 26, ns.w - 12, 4);
  const fl = Math.sin(time * 3) * 4;
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(ns.x + ns.w - 14, ns.y - 50, 3, 50);
  ctx.fillStyle = '#d85a5a';
  ctx.beginPath(); // the flag, an apple on it
  ctx.moveTo(ns.x + ns.w - 11, ns.y - 50);
  ctx.quadraticCurveTo(ns.x + ns.w + 10, ns.y - 46 + fl, ns.x + ns.w + 26, ns.y - 42 + fl);
  ctx.lineTo(ns.x + ns.w + 18, ns.y - 34 + fl);
  ctx.lineTo(ns.x + ns.w + 26, ns.y - 26 + fl);
  ctx.quadraticCurveTo(ns.x + ns.w + 8, ns.y - 30 + fl, ns.x + ns.w - 11, ns.y - 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff2e0';
  circle(ctx, ns.x + ns.w + 4, ns.y - 39 + fl * 0.6, 4);
  // inside the nest: a spyglass and a little heap of gold apples (someone's hoard)
  ctx.fillStyle = '#ffd860';
  for (const [x, y] of [[20, -4], [30, -5], [25, -10]]) circle(ctx, ns.x + x, ns.y + y, 4.5);
  ctx.fillStyle = '#c8a050';
  ctx.save();
  ctx.translate(ns.x + 64, ns.y - 6);
  ctx.rotate(-0.4);
  ctx.fillRect(-2, -12, 5, 18);
  ctx.restore();
}

function drawLedge(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#3e5464';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 4);
  ctx.quadraticCurveTo(x + w / 2, y - 6, x + w + 8, y + 4);
  ctx.quadraticCurveTo(x + w + 10, y + 26, x + w * 0.7, y + 40);
  ctx.quadraticCurveTo(x + w / 2, y + 52, x + w * 0.3, y + 40);
  ctx.quadraticCurveTo(x - 10, y + 26, x - 8, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#56707e';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 2, w + 8, 9, 4);
  ctx.fill();
  ctx.fillStyle = '#5f8a5a';
  for (let k = 10; k < w; k += 26) ellipse(ctx, x + k, y + 8, 5, 8);
  ctx.fillStyle = 'rgba(238,232,220,0.85)'; // barnacles
  for (let k = 18; k < w; k += 41) circle(ctx, x + k, y + 16, 2.4);
}

// A broken spar wedged between two rocks (a platform)
function drawSpar(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#3e5464';
  ellipse(ctx, x + 6, GROUND - (GROUND - y) / 2 + 6, 26, (GROUND - y) / 2 + 6);
  ellipse(ctx, x + w - 6, GROUND - (GROUND - y) / 2 + 10, 22, (GROUND - y) / 2 + 2);
  ctx.fillStyle = '#6a4a38';
  ctx.strokeStyle = '#2e2018';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 10, y - 1, w + 20, 12, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,180,140,0.7)';
  ctx.lineWidth = 2;
  for (const k of [0.3, 0.7]) {
    ctx.beginPath();
    ctx.moveTo(x + w * k - 4, y - 1);
    ctx.lineTo(x + w * k + 4, y + 11);
    ctx.stroke();
  }
}

function drawCargo(ctx, c) {
  ctx.save();
  ctx.translate(c.x, GROUND + 2);
  if (c.tip) ctx.rotate(-1.4);
  if (c.k === 'barrel') {
    ctx.fillStyle = '#7a5640';
    ctx.strokeStyle = '#3e2a1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -22, 17, 22, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#9aa0a8';
    ctx.fillRect(-17, -32, 34, 3);
    ctx.fillRect(-17, -14, 34, 3);
  } else {
    ctx.fillStyle = '#8a6450';
    ctx.strokeStyle = '#3e2a1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-20, -34, 40, 34);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20, -34);
    ctx.lineTo(20, 0);
    ctx.stroke();
    text(ctx, 'APPLES', 0, -26, 8, '#3e2a1e');
  }
  ctx.restore();
  // a few apples rolled out on the sand (long since turned to wooden ones, polished by the sea)
  ctx.fillStyle = '#b86a4a';
  for (const d of [24, 33]) circle(ctx, c.x + d, GROUND - 4, 4.5);
}

function drawFloor(ctx, L, R, time) {
  ctx.fillStyle = '#5a6670';
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = '#7a8890'; // wet sand
  ctx.fillRect(L, GROUND, R - L, 9);
  ctx.fillStyle = 'rgba(200,230,240,0.18)';
  for (let x = L - (L % 60); x < R; x += 60) ellipse(ctx, x + 20, GROUND + 3, 22, 2);
  for (const p of pools) {
    if (p.x < L - 80 || p.x > R + 80) continue;
    ctx.fillStyle = 'rgba(110,180,200,0.55)';
    ellipse(ctx, p.x, GROUND + 3, p.w / 2, 4);
    ctx.strokeStyle = `rgba(230,250,255,${0.5 + 0.3 * Math.sin(time * 2 + p.x)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(p.x, GROUND + 3, p.w * 0.3 * (0.6 + 0.4 * ((time * 0.5 + p.x) % 1)), 2.4, 0, 0, TAU);
    ctx.stroke();
  }
  for (const s of shells) {
    if (s.x < L - 10 || s.x > R + 10) continue;
    const y = GROUND + 4 + s.y;
    if (s.k === 0) {
      ctx.fillStyle = '#f0d8d0';
      ctx.beginPath();
      ctx.moveTo(s.x - 4 * s.s, y);
      ctx.quadraticCurveTo(s.x, y - 7 * s.s, s.x + 4 * s.s, y);
      ctx.closePath();
      ctx.fill();
    } else if (s.k === 1) {
      ctx.fillStyle = '#5f8a5a';
      ellipse(ctx, s.x, y - 3, 2.5 * s.s, 6 * s.s);
    } else {
      ctx.fillStyle = '#e8e2d4';
      circle(ctx, s.x, y - 1, 2 * s.s);
    }
  }
}

// Hard pocket signs: dark boards with a red trim (like Glowroot Hollow's)
function drawZoneSign(ctx, x, z, i, time) {
  ctx.fillStyle = '#4a3a30';
  ctx.beginPath();
  ctx.roundRect(x - 4, GROUND - 92, 8, 94, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 70);
  ctx.rotate(Math.sin(time * 1.1 + i) * 0.02);
  ctx.font = "700 15px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(130, ctx.measureText(z.name).width + 28);
  ctx.fillStyle = '#2e4252';
  ctx.strokeStyle = '#e0526e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -24, tw, 46, 10);
  ctx.fill();
  ctx.stroke();
  text(ctx, z.name, 0, -9, 15, '#eaf6ff');
  ctx.fillStyle = '#e0526e';
  ctx.beginPath();
  ctx.roundRect(-34, 2, 68, 15, 7.5);
  ctx.fill();
  text(ctx, `Lv ${z.lvl}`, 0, 10, 11, '#ffffff');
  ctx.restore();
}

function drawExitSign(ctx, x, time) {
  ctx.fillStyle = '#4a3a30';
  ctx.fillRect(x - 3, GROUND - 92, 6, 92);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.2) * 0.02);
  ctx.fillStyle = '#e2bf8f';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath(); // pointing east, out to the Coves
  ctx.moveTo(-56, -12);
  ctx.lineTo(50, -12);
  ctx.lineTo(62, 0);
  ctx.lineTo(50, 12);
  ctx.lineTo(-56, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Out to the Coves', 2, 1, 11, '#5b4a6b');
  ctx.restore();
}

function drawMotes(ctx, camX, time) {
  for (const m of motes) {
    const x = camX + ((m.x - camX * 0.25 + Math.sin(time * 0.4 + m.p) * 30) % W + W) % W;
    const y = m.y - ((time * m.v) % 340);
    const yy = y < 60 ? y + 340 : y;
    ctx.fillStyle = `rgba(200,240,235,${0.25 + 0.2 * Math.sin(time * 2.2 + m.p)})`;
    circle(ctx, x, yy, m.s);
  }
}
