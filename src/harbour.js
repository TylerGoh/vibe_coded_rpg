// Docs: docs/places/harbour.md
// Greenhollow Harbour (room HARBOUR in src/shared/sim.js), west of the village: a sea-haze sky with the
// other islands on the horizon (src/distant.js), the lighthouse on the rocky point at the west end (lit
// again: Granny Wicks is back in the keeper's hut), the hut and crates you can climb to its gallery, the
// Frostpeak ferry at the quay with steam up and her gangway down (a door, GANGWAY_X: her deck is a crossing
// room, src/crossing.js), fishing boats and the path back up to Slimeville. Captain Brine is aboard, at
// her wheel. This room paints its own sky.
// Also here: the harbour gate drawn at the village's west end (drawHarbourGate).
import { W, H, TAU, mulberry32, circle, ellipse } from './util.js';
import { HARBOUR_W, HARBOUR_EXIT_X, HARBOUR_PLATFORMS, GANGWAY_X } from './shared/sim.js';
import { drawDistantIslands } from './distant.js';
import { beam } from './crossing.js';

const GROUND = 470;
const HORIZON = 300; // the sea line, in screen space
const INK = '#5b4a6b';
const LIGHTHOUSE_X = 315;
const FERRY_X = 860; // the ferry's stern; it's FERRY_LEN long
const FERRY_LEN = 620;
const BOATS = [{ x: 1600, hue: '#ff9fb8', ph: 0 }, { x: 1790, hue: '#9fd8b0', ph: 1.7 }];
const BOLLARDS = [820, 1530, 1720, 1880, 2080];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

const clouds = (() => {
  const r = mulberry32(91);
  return Array.from({ length: 6 }, (_, i) => ({ x: i * 300 + r() * 160, y: 50 + r() * 110, s: 0.6 + r() * 0.5 }));
})();
const gulls = (() => {
  const r = mulberry32(93);
  return Array.from({ length: 5 }, () => ({ off: r() * 1400, y: 90 + r() * 140, v: 18 + r() * 22, s: 0.7 + r() * 0.5, p: r() * TAU }));
})();
const glints = (() => {
  const r = mulberry32(97);
  return Array.from({ length: 46 }, () => ({ x: r() * 1800, y: r(), w: 10 + r() * 26, p: r() * TAU }));
})();

// Everything behind the slimes. camX is the left edge of the view.
export function drawHarbour(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0); // sky and sea in screen space
  drawSky(ctx, camX, time);
  ctx.restore();

  const L = camX - 80, R = camX + viewW + 80;
  if (visible(FERRY_X - 40, FERRY_X + FERRY_LEN + 60, L, R)) drawFerry(ctx, time);
  BOATS.forEach((b) => visible(b.x - 90, b.x + 90, L, R) && drawBoat(ctx, b, time));
  if (visible(0, 460, L, R)) drawPoint(ctx, time);
  if (visible(440, 620, L, R)) drawHut(ctx, time);
  drawQuay(ctx, Math.max(0, L), Math.min(HARBOUR_W, R));
  if (visible(1980, 2200, L, R)) drawNetRack(ctx, 2090, time);
  for (const x of BOLLARDS) if (visible(x - 20, x + 20, L, R)) drawBollard(ctx, x);
  for (const p of HARBOUR_PLATFORMS) if (p.kind === 'crates' && visible(p.x - 10, p.x + p.w + 10, L, R)) drawCrates(ctx, p);
  if (visible(GANGWAY_X - 200, GANGWAY_X + 120, L, R)) drawBoarding(ctx, GANGWAY_X, time);
  if (visible(0, 900, L, R)) beam(ctx, LIGHTHOUSE_X, HARBOUR_PLATFORMS.find((p) => p.kind === 'gallery').y - 28, 1, time); // over everything behind
  if (visible(HARBOUR_EXIT_X - 120, HARBOUR_W, L, R)) drawPath(ctx, HARBOUR_EXIT_X, time);
}

function drawSky(ctx, camX, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#9fd2f2');
  sky.addColorStop(0.6, '#cfe9f6');
  sky.addColorStop(1, '#fbeee4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON + 1);
  // the sun, high over the bay
  const sx = W - 150 - camX * 0.01, sy = 92;
  const g = ctx.createRadialGradient(sx, sy, 16, sx, sy, 130);
  g.addColorStop(0, 'rgba(255,248,214,0.9)');
  g.addColorStop(1, 'rgba(255,248,214,0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx - 130, sy - 130, 260, 260);
  ctx.fillStyle = '#fff6d0';
  circle(ctx, sx, sy, 34);

  drawDistantIslands(ctx, { from: 'green', scroll: camX, roomW: HARBOUR_W, time, horizon: HORIZON, haze: '#f4eee8', fade: 0.5, scale: 0.62, sky: 260 });

  const off = (camX * 0.05 + time * 5) % 1800;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  for (const c of clouds) {
    for (const x of [c.x - off, c.x - off + 1800]) {
      if (x < -150 || x > W + 60) continue;
      circle(ctx, x, c.y, 20 * c.s);
      circle(ctx, x + 24 * c.s, c.y - 9 * c.s, 26 * c.s);
      circle(ctx, x + 52 * c.s, c.y, 20 * c.s);
      ctx.beginPath();
      ctx.roundRect(x - 4 * c.s, c.y - 4 * c.s, 60 * c.s, 24 * c.s, 12 * c.s);
      ctx.fill();
    }
  }

  // the sea: haze at the horizon, deeper towards the quay, glinting
  const sea = ctx.createLinearGradient(0, HORIZON, 0, GROUND);
  sea.addColorStop(0, '#cfe6ee');
  sea.addColorStop(0.35, '#9ccfe0');
  sea.addColorStop(1, '#6fb2cc');
  ctx.fillStyle = sea;
  ctx.fillRect(0, HORIZON, W, H - HORIZON);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(0, HORIZON, W, 1.5);
  for (const gl of glints) {
    const y = HORIZON + 6 + gl.y * gl.y * (GROUND - HORIZON - 10);
    const f = 0.1 + gl.y * 0.5; // nearer water slides faster as you walk
    const x = (((gl.x - camX * f + Math.sin(time * 0.6 + gl.p) * 8) % 1800) + 1800) % 1800 - 200;
    if (x < -40 || x > W + 40) continue;
    ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(time * 1.6 + gl.p));
    ctx.beginPath();
    ctx.roundRect(x, y, gl.w * (0.5 + gl.y), 2 + gl.y * 1.5, 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // gulls wheeling over the water
  ctx.strokeStyle = '#7d8a9a';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const gu of gulls) {
    const x = ((gu.off + time * gu.v - camX * 0.2) % 1400 + 1400) % 1400 - 200;
    if (x < -30 || x > W + 30) continue;
    const y = gu.y + Math.sin(time * 0.7 + gu.p) * 12, f = Math.sin(time * 5 + gu.p) * 4 * gu.s;
    ctx.beginPath();
    ctx.moveTo(x - 11 * gu.s, y - f);
    ctx.quadraticCurveTo(x - 5 * gu.s, y - 6 * gu.s, x, y);
    ctx.quadraticCurveTo(x + 5 * gu.s, y - 6 * gu.s, x + 11 * gu.s, y - f);
    ctx.stroke();
  }
}

// The quay: a stone wall face below the walking line, planks on top, the sea lapping at its foot
function drawQuay(ctx, L, R) {
  ctx.fillStyle = '#c9bfb2';
  ctx.fillRect(L, GROUND, R - L, H - GROUND);
  ctx.fillStyle = '#b4a99c';
  for (let y = GROUND + 18, row = 0; y < H; y += 18, row++) {
    for (let x = Math.floor(L / 46) * 46 + (row % 2) * 23; x < R; x += 46) {
      ctx.beginPath();
      ctx.roundRect(x + 2, y - 15, 42, 14, 4);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#d9b38a'; // the boardwalk on top
  ctx.fillRect(L, GROUND - 2, R - L, 12);
  ctx.fillStyle = '#c49a72';
  for (let x = Math.floor(L / 34) * 34; x < R; x += 34) ctx.fillRect(x, GROUND - 2, 2, 12);
  ctx.fillStyle = '#ead0b0';
  ctx.fillRect(L, GROUND - 2, R - L, 3);
}

// The rocky point with the lighthouse. Its lamp has been dark for ages: grey glass, no glow.
function drawPoint(ctx, time) {
  ctx.fillStyle = '#a99fb4';
  ctx.beginPath();
  ctx.moveTo(-10, GROUND + 4);
  ctx.quadraticCurveTo(40, GROUND - 60, 150, GROUND - 52);
  ctx.quadraticCurveTo(250, GROUND - 70, 420, GROUND - 26);
  ctx.quadraticCurveTo(450, GROUND - 8, 470, GROUND + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#bdb4c6';
  for (const [x, y, r] of [[60, GROUND - 36, 26], [150, GROUND - 46, 30], [400, GROUND - 22, 22]]) ellipse(ctx, x, y, r, r * 0.6);
  ctx.fillStyle = '#9fd8b0'; // tufts of sea grass
  for (const x of [90, 130, 200, 380, 420]) ellipse(ctx, x, GROUND - 46 + Math.abs(x - 250) * 0.12, 8, 4);

  const x = LIGHTHOUSE_X, gal = HARBOUR_PLATFORMS.find((p) => p.kind === 'gallery').y;
  const base = GROUND - 40, topW = 66, baseW = 96;
  // the tower, in pastel bands
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - baseW / 2, base);
  ctx.lineTo(x - topW / 2, gal);
  ctx.lineTo(x + topW / 2, gal);
  ctx.lineTo(x + baseW / 2, base);
  ctx.closePath();
  ctx.fillStyle = '#fff8f0';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = '#f4a6b4';
  for (let y = gal + 30; y < base; y += 84) ctx.fillRect(x - 60, y, 120, 36);
  ctx.fillStyle = 'rgba(91,74,107,0.08)';
  ctx.fillRect(x + 8, gal, 60, base - gal);
  ctx.restore();
  // a little arched door and two round windows
  ctx.fillStyle = '#8fb6d9';
  ctx.beginPath();
  ctx.roundRect(x - 15, base - 46, 30, 46, [15, 15, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#5b4a6b';
  circle(ctx, x + 8, base - 22, 2);
  for (const y of [gal + 70, gal + 150]) {
    ctx.fillStyle = '#d8eaf4';
    circle(ctx, x, y, 9);
    ctx.strokeStyle = '#c9b8aa';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // the lamp room, lit again: warm glass, the lens bright, flickering a little (the beam is drawn later)
  const fl = 0.9 + 0.1 * Math.sin(time * 7) * Math.sin(time * 2.3);
  ctx.fillStyle = '#8f8ca8';
  ctx.beginPath();
  ctx.roundRect(x - 26, gal - 58, 52, 58, 4);
  ctx.fill();
  ctx.fillStyle = `rgba(255,233,160,${fl})`;
  for (const dx of [-17, 0, 17]) ctx.fillRect(x + dx - 6, gal - 52, 12, 46);
  ctx.fillStyle = '#fff8d8';
  ellipse(ctx, x, gal - 28, 9, 13);
  ctx.fillStyle = '#e86f86'; // the cap
  ctx.beginPath();
  ctx.moveTo(x - 36, gal - 56);
  ctx.quadraticCurveTo(x, gal - 104, x + 36, gal - 56);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d85b74';
  circle(ctx, x, gal - 92, 6);
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath(); // a weather vane, turning a little
  ctx.moveTo(x, gal - 98);
  ctx.lineTo(x, gal - 118);
  ctx.stroke();
  ctx.save();
  ctx.translate(x, gal - 116);
  ctx.scale(Math.cos(time * 0.4), 1);
  ctx.fillStyle = '#8f6240';
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(10, -4);
  ctx.lineTo(10, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // the gallery: a walkway round the lamp room, with a railing (its top is a platform)
  const g = HARBOUR_PLATFORMS.find((p) => p.kind === 'gallery');
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.roundRect(g.x, g.y, g.w, 9, 3);
  ctx.fill();
  ctx.fillStyle = '#a77b52';
  ctx.beginPath();
  ctx.moveTo(g.x + 10, g.y + 9);
  ctx.lineTo(x - topW / 2, g.y + 26);
  ctx.lineTo(x + topW / 2, g.y + 26);
  ctx.lineTo(g.x + g.w - 10, g.y + 9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff6ea';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(g.x + 4, g.y - 22);
  ctx.lineTo(g.x + g.w - 4, g.y - 22);
  for (let px = g.x + 4; px <= g.x + g.w - 4; px += 18) {
    ctx.moveTo(px, g.y);
    ctx.lineTo(px, g.y - 22);
  }
  ctx.stroke();
}

// The old keeper's hut beside the lighthouse: a flat plank roof you can stand on, a cold chimney
function drawHut(ctx, time) {
  const p = HARBOUR_PLATFORMS.find((q) => q.kind === 'hut');
  const x0 = p.x + 8, x1 = p.x + p.w - 8, top = p.y + 10;
  ctx.fillStyle = '#eaf2f5';
  ctx.fillRect(x0, top, x1 - x0, GROUND - top);
  ctx.fillStyle = 'rgba(91,74,107,0.07)';
  for (let y = top + 16; y < GROUND; y += 16) ctx.fillRect(x0, y, x1 - x0, 2);
  // the window, shutters open and a lamp inside: Granny Wicks is home
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.roundRect(x0 + 18, top + 40, 40, 44, 4);
  ctx.fill();
  ctx.fillStyle = '#7fa8c8';
  ctx.beginPath();
  ctx.roundRect(x0 + 4, top + 40, 12, 44, 3);
  ctx.roundRect(x0 + 60, top + 40, 12, 44, 3);
  ctx.fill();
  ctx.strokeStyle = '#d9b38a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + 38, top + 40);
  ctx.lineTo(x0 + 38, top + 84);
  ctx.moveTo(x0 + 18, top + 62);
  ctx.lineTo(x0 + 58, top + 62);
  ctx.stroke();
  ctx.fillStyle = '#ff9fb8'; // a pot of geraniums on the sill
  ctx.fillRect(x0 + 26, top + 84, 24, 6);
  circle(ctx, x0 + 31, top + 80, 5);
  circle(ctx, x0 + 44, top + 79, 5);
  ctx.fillStyle = '#c98a5a'; // the door
  ctx.beginPath();
  ctx.roundRect(x1 - 46, GROUND - 70, 32, 70, [8, 8, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, x1 - 21, GROUND - 34, 2.4);
  ctx.fillStyle = '#b8a090'; // the chimney, smoking again
  ctx.fillRect(x1 - 34, p.y - 30, 16, 32);
  for (let i = 0; i < 5; i++) {
    const k = (time * 0.25 + i / 5) % 1;
    ctx.fillStyle = `rgba(240,236,246,${0.6 * (1 - k)})`;
    circle(ctx, x1 - 26 + Math.sin(k * 4 + i) * 6 - k * 20, p.y - 36 - k * 80, 6 + k * 12);
  }
  ctx.fillStyle = '#7fc8c0'; // the roof planks
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#5aa9a1';
  ctx.fillRect(p.x + 4, p.y + 10, p.w - 8, 3);
  // a life ring on the wall
  ctx.strokeStyle = '#ff8fa3';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x0 + 38, top + 128, 13, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.setLineDash([6, 8]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCrates(ctx, p) {
  const rows = Math.round((GROUND - p.y) / 49), n = Math.max(1, Math.round(p.w / 54));
  const cw = p.w / n, ch = (GROUND - p.y) / rows;
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < n; i++) {
      const x = p.x + i * cw, y = GROUND - (r + 1) * ch;
      ctx.fillStyle = (r + i) % 2 ? '#d9b38a' : '#e4c49c';
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, cw - 2, ch - 2, 4);
      ctx.fill();
      ctx.strokeStyle = '#b8895e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 5, y + 5);
      ctx.lineTo(x + cw - 5, y + ch - 5);
      ctx.moveTo(x + cw - 5, y + 5);
      ctx.lineTo(x + 5, y + ch - 5);
      ctx.stroke();
    }
  }
}

function drawBollard(ctx, x) {
  ctx.fillStyle = '#6d6880';
  ctx.beginPath();
  ctx.roundRect(x - 9, GROUND - 26, 18, 26, [8, 8, 2, 2]);
  ctx.fill();
  ctx.fillStyle = '#8a84a0';
  ellipse(ctx, x, GROUND - 25, 11, 4);
}

// The Frostpeak ferry, a stout little paddle steamer, moored with steam up (her gangway: drawBoarding)
// Also at Icefang Hamlet's quay (src/fjord.js): x0 her stern, ground the quay, moor the two bollards
export function drawFerry(ctx, time, x0 = FERRY_X, ground = GROUND, moor = BOLLARDS) {
  const x1 = x0 + FERRY_LEN, bob = Math.sin(time * 0.9) * 2.5, wl = ground - 22 + bob;
  ctx.save();
  // hull
  ctx.fillStyle = '#4f6b9a';
  ctx.beginPath();
  ctx.moveTo(x0, wl - 70);
  ctx.lineTo(x1 + 30, wl - 80);
  ctx.quadraticCurveTo(x1 + 10, wl - 10, x1 - 60, wl + 8);
  ctx.lineTo(x0 + 40, wl + 8);
  ctx.quadraticCurveTo(x0 + 4, wl - 10, x0, wl - 70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff1dc'; // cream band and her name
  ctx.beginPath();
  ctx.moveTo(x0 + 2, wl - 66);
  ctx.lineTo(x1 + 26, wl - 76);
  ctx.lineTo(x1 + 22, wl - 60);
  ctx.lineTo(x0 + 4, wl - 52);
  ctx.closePath();
  ctx.fill();
  text(ctx, 'PUDDLE JUMPER', x0 + FERRY_LEN - 70, wl - 69, 13, '#4f6b9a');
  ctx.fillStyle = '#ffffff'; // portholes
  for (let x = x0 + 240; x < x1 - 40; x += 48) {
    circle(ctx, x, wl - 32, 7);
    ctx.fillStyle = '#9ccfe0';
    circle(ctx, x, wl - 32, 4.5);
    ctx.fillStyle = '#ffffff';
  }
  // the paddle box, half way along
  const px = x0 + FERRY_LEN * 0.44;
  ctx.fillStyle = '#e86f86';
  ctx.beginPath();
  ctx.arc(px, wl - 40, 52, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff1dc';
  ctx.lineWidth = 3;
  for (let a = 0.15; a < 1; a += 0.17) {
    ctx.beginPath();
    ctx.moveTo(px, wl - 40);
    ctx.lineTo(px + Math.cos(Math.PI * (1 + a)) * 48, wl - 40 + Math.sin(Math.PI * (1 + a)) * 48);
    ctx.stroke();
  }
  // deck cabin, funnel (cold) and a mast with its sail furled
  const deck = wl - 76;
  ctx.fillStyle = '#fff8f0';
  ctx.beginPath();
  ctx.roundRect(x0 + 330, deck - 62, 200, 62, [10, 10, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#9ccfe0';
  for (let x = x0 + 348; x < x0 + 520; x += 40) {
    ctx.beginPath();
    ctx.roundRect(x, deck - 48, 26, 22, 5);
    ctx.fill();
  }
  ctx.fillStyle = '#7fc8c0';
  ctx.beginPath();
  ctx.roundRect(x0 + 320, deck - 72, 220, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#4f6b9a';
  ctx.beginPath();
  ctx.roundRect(x0 + 430, deck - 140, 34, 72, 4);
  ctx.fill();
  ctx.fillStyle = '#e86f86';
  ctx.fillRect(x0 + 430, deck - 128, 34, 12);
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x0 + 140, deck);
  ctx.lineTo(x0 + 140, deck - 200);
  ctx.moveTo(x0 + 140, deck - 150);
  ctx.lineTo(x0 + 250, deck - 150);
  ctx.stroke();
  ctx.fillStyle = '#f4ead8'; // the furled sail, lashed to its boom
  ctx.beginPath();
  ctx.roundRect(x0 + 146, deck - 160, 100, 14, 7);
  ctx.fill();
  ctx.strokeStyle = '#c9b8aa';
  ctx.lineWidth = 2;
  for (let x = x0 + 162; x < x0 + 246; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, deck - 161);
    ctx.lineTo(x, deck - 146);
    ctx.stroke();
  }
  ctx.fillStyle = '#9fd8ff'; // pennant, hanging limp
  ctx.beginPath();
  ctx.moveTo(x0 + 140, deck - 200);
  ctx.quadraticCurveTo(x0 + 152, deck - 190, x0 + 146, deck - 176);
  ctx.lineTo(x0 + 140, deck - 184);
  ctx.closePath();
  ctx.fill();
  // deck railing
  ctx.strokeStyle = '#fff8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + 6, deck - 16);
  ctx.lineTo(x1 + 24, deck - 22);
  ctx.stroke();
  // steam up: smoke from the funnel
  for (let i = 0; i < 6; i++) {
    const k = (time * 0.3 + i / 6) % 1;
    ctx.fillStyle = `rgba(240,236,246,${0.65 * (1 - k)})`;
    circle(ctx, x0 + 447 - k * 60 + Math.sin(k * 5 + i) * 6, deck - 150 - k * 110, 9 + k * 20);
  }
  // mooring lines to the bollards
  ctx.strokeStyle = '#c9b8aa';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x0 + 10, deck - 6);
  ctx.quadraticCurveTo(x0 - 20, ground - 10, moor[0], ground - 20);
  ctx.moveTo(x1 + 10, deck - 10);
  ctx.quadraticCurveTo(x1 + 60, ground - 6, moor[1], ground - 20);
  ctx.stroke();
  ctx.restore();
}

// The ferry's gangway, run down to the quay (the door aboard, GANGWAY_X), the sailing board beside it, and
// Pickles on his post
// board: the sailing board's title and two lines (Icefang Hamlet has its own, src/fjord.js)
export function drawBoarding(ctx, x, time, ground = GROUND, board = ['FERRY TO FROSTPEAK', 'The light is lit.', 'All aboard!']) {
  const deck = ground - 98 + Math.sin(time * 0.9) * 2.5;
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.moveTo(x - 46, ground);
  ctx.lineTo(x + 18, deck);
  ctx.lineTo(x + 40, deck);
  ctx.lineTo(x - 22, ground);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a77b52';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    ctx.moveTo(x - 46 + t * 64, ground + t * (deck - ground));
    ctx.lineTo(x - 22 + t * 62, ground + t * (deck - ground));
  }
  ctx.stroke();
  ctx.strokeStyle = '#fff8f0'; // its hand rope
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 40, ground - 30);
  ctx.quadraticCurveTo(x - 6, deck - 2, x + 22, deck - 28);
  ctx.stroke();
  // Pickles on the gangway post
  const px = x - 130;
  ctx.fillStyle = '#8f6240';
  ctx.beginPath();
  ctx.roundRect(px - 5, ground - 56, 10, 56, 3);
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, px, ground - 58, 5);
  drawPickles(ctx, px, ground - 62, time);
  // the sailing board
  const bx = x - 70;
  ctx.fillStyle = '#8f6240';
  ctx.fillRect(bx - 4, ground - 128, 8, 128);
  ctx.save();
  ctx.translate(bx, ground - 128);
  ctx.rotate(0.03);
  ctx.fillStyle = '#fff6ea';
  ctx.strokeStyle = '#c99b6b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-86, -40, 172, 72, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, board[0], 0, -24, 13, '#4f6b9a');
  text(ctx, board[1], 0, -4, 13, INK);
  text(ctx, board[2], 0, 12, 13, INK);
  text(ctx, '- Capt. Brine', 34, 26, 10, '#8f6240');
  ctx.restore();
}

// Pickles, the captain's one-legged gull (server/characters.js), perched on a post: bobs, turns, blinks
function drawPickles(ctx, x, y, time) {
  const look = Math.sin(time * 0.5) > 0.6 ? -1 : 1, bob = Math.sin(time * 2.2) * 0.8;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(look, 1);
  ctx.strokeStyle = '#e8a040';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -8);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 0, -15, 11, 8);
  circle(ctx, 7, -24, 6);
  ctx.fillStyle = '#9aa4b4';
  ellipse(ctx, -3, -15, 8, 4.5, -0.2);
  ctx.fillStyle = '#e8a040';
  ctx.beginPath();
  ctx.moveTo(12, -25);
  ctx.lineTo(19, -23);
  ctx.lineTo(12, -21);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2d2a3e';
  if (Math.sin(time * 1.3) < 0.97) circle(ctx, 9, -26, 1.3);
  else ctx.fillRect(7.5, -26, 3, 1);
  ctx.restore();
}

// Two little fishing boats bobbing by the quay
function drawBoat(ctx, b, time) {
  const bob = Math.sin(time * 1.4 + b.ph) * 3, tilt = Math.sin(time * 1.1 + b.ph) * 0.04;
  ctx.save();
  ctx.translate(b.x, GROUND - 16 + bob);
  ctx.rotate(tilt);
  ctx.fillStyle = b.hue;
  ctx.beginPath();
  ctx.moveTo(-64, -30);
  ctx.lineTo(64, -30);
  ctx.quadraticCurveTo(56, 4, 30, 6);
  ctx.lineTo(-30, 6);
  ctx.quadraticCurveTo(-56, 4, -64, -30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff8f0';
  ctx.fillRect(-62, -30, 124, 6);
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, -30);
  ctx.lineTo(-6, -110);
  ctx.stroke();
  ctx.fillStyle = '#fff6ea';
  ctx.beginPath();
  ctx.moveTo(-3, -106);
  ctx.quadraticCurveTo(30, -70, 44, -36);
  ctx.lineTo(-3, -36);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// A net hung out to dry between two poles, with a couple of floats
function drawNetRack(ctx, x, time) {
  ctx.fillStyle = '#9b7d66';
  for (const px of [x - 60, x + 60]) ctx.fillRect(px - 4, GROUND - 120, 8, 120);
  ctx.strokeStyle = 'rgba(91,74,107,0.45)';
  ctx.lineWidth = 1.2;
  const sag = (u) => GROUND - 112 + Math.sin(u * Math.PI) * 26 + Math.sin(time * 1.3 + u * 4) * 1.5;
  for (let i = 0; i <= 12; i++) {
    const u = i / 12, px = x - 60 + u * 120;
    ctx.beginPath();
    ctx.moveTo(px, sag(u));
    ctx.lineTo(px + (u - 0.5) * 6, GROUND - 40);
    ctx.stroke();
  }
  for (let r = 0; r < 4; r++) {
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const u = i / 12, px = x - 60 + u * 120, y = sag(u) + r * (GROUND - 40 - sag(u)) / 3;
      i ? ctx.lineTo(px, y) : ctx.moveTo(px, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#ff9a5a';
  circle(ctx, x - 26, sag(0.28) + 3, 5);
  circle(ctx, x + 22, sag(0.68) + 3, 5);
}

// The way back up to Slimeville: a grassy bank with a signpost
function drawPath(ctx, x, time) {
  ctx.fillStyle = '#9bd8b0';
  ctx.beginPath();
  ctx.moveTo(x - 110, GROUND);
  ctx.quadraticCurveTo(x - 40, GROUND - 70, x + 120, GROUND - 90);
  ctx.lineTo(x + 140, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7cc79a';
  for (const dx of [-60, -20, 30, 70]) ellipse(ctx, x + dx, GROUND - 40 - (dx + 60) * 0.3, 14, 7);
  ctx.fillStyle = '#9b7d66';
  ctx.beginPath();
  ctx.roundRect(x - 5, GROUND - 100, 10, 102, 4);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 82);
  ctx.rotate(0.04 + Math.sin(time * 0.8) * 0.01);
  ctx.fillStyle = '#c99b6b';
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-56, -18);
  ctx.lineTo(58, -18);
  ctx.lineTo(74, 0);
  ctx.lineTo(58, 18);
  ctx.lineTo(-56, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Slimeville', 6, 1, 17, '#fffaf0');
  ctx.restore();
}

// In the village, at its west end: the way down to the harbour. Two weathered posts, a rope with
// floats strung between them, and a hanging sign with an anchor.
export function drawHarbourGate(ctx, x, groundY, time) {
  const half = 40, top = groundY - 128;
  ctx.fillStyle = '#7fa8c8';
  for (const px of [x - half, x + half]) {
    ctx.beginPath();
    ctx.roundRect(px - 6, top, 12, groundY - top + 2, 4);
    ctx.fill();
  }
  ctx.fillStyle = '#5f88a8';
  ctx.beginPath();
  ctx.roundRect(x - half - 12, top - 8, half * 2 + 24, 12, 5);
  ctx.fill();
  ctx.strokeStyle = '#c9b8aa';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - half, top + 22);
  ctx.quadraticCurveTo(x, top + 40 + Math.sin(time * 1.4) * 2, x + half, top + 22);
  ctx.stroke();
  ctx.fillStyle = '#ff9a5a';
  for (const dx of [-22, 0, 22]) circle(ctx, x + dx, top + 30 + (1 - (dx / 22) ** 2) * 9 + Math.sin(time * 1.4) * 2, 4);
  // the hanging sign
  const sw = Math.sin(time * 1.1) * 0.05;
  ctx.save();
  ctx.translate(x, top + 4);
  ctx.rotate(sw);
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(-30, 52);
  ctx.moveTo(30, 0);
  ctx.lineTo(30, 52);
  ctx.stroke();
  ctx.fillStyle = '#fff6ea';
  ctx.strokeStyle = '#7fa8c8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-46, 50, 92, 40, 6);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Harbour', 4, 64, 15, '#4f6b9a');
  text(ctx, '< to the sea', 0, 80, 10, '#8f6240');
  ctx.restore();
}
