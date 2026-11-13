// Docs: docs/places/gardens.md
// The Keepers' Gardens (room GARDENS, src/shared/rpg.js; the Citadel's depth pass, C0): the Citadel's easy pocket, up the
// brass stair off Cogwork Bastion. The Keepers' roof gardens, open to the wind under a high bright sky: dead beds of grey
// soil in brass-edged planters, pergolas with nothing climbing them, a dry fountain whose spout still turns, empty urns,
// little brass watering automata still tending soil where nothing grows. The whole archipelago is tiny far below. West to
// east: the Stair Head (the top of the brass stair; no mobs), the Dry Beds, the Fountain Court and the Wind Terrace (no
// mobs), a balustrade at the edge of the city with a bench, for sitting. The cracked urn on the broken pergola's top
// (last in GARDENS_PLATFORMS) is the find: a sapling in it, the one living thing up here, its leaves the apple tree's shape
// (shown, never named: the Heartroot is Tier 4). Solemn, not whimsical: the gardens are kept, and nothing grows.
import { H, W, TAU, mulberry32, circle, ellipse } from './util.js';
import { GARDENS_W, FIELD_GROUND, GARDENS_PLATFORMS, GARDENS_ZONES } from './shared/rpg.js';
import { drawDistantIslands } from './distant.js';

const GROUND = FIELD_GROUND;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const STONE = '#efe4cf', STONE_D = '#d8c8aa', STONE_E = '#b4a080';
const SOIL = '#8a7a6a', SOIL_D = '#6a5c50';
const URN = GARDENS_PLATFORMS.find((p) => p.kind === 'urn');
const TERRACE = GARDENS_ZONES[3].x0;
const FOUNTAIN = GARDENS_PLATFORMS.find((p) => p.kind === 'fountain');

const clouds = (() => {
  const r = mulberry32(8501);
  return Array.from({ length: 9 }, () => ({ x: r() * 1800, y: 40 + r() * 160, s: 0.6 + r() * 0.8, v: 3 + r() * 5 }));
})();
const beds = (() => {
  const r = mulberry32(8511);
  const out = [];
  for (let x = 520; x < TERRACE - 80; x += 160 + r() * 120) {
    if (Math.abs(x - (FOUNTAIN.x + FOUNTAIN.w / 2)) < 220) continue;
    out.push({ x, w: 90 + r() * 50, stalks: Array.from({ length: 3 + Math.floor(r() * 4) }, () => ({ dx: r(), h: 8 + r() * 18, a: (r() - 0.5) * 0.6 })) });
  }
  return out;
})();
const statues = (() => {
  const r = mulberry32(8521);
  const out = [];
  for (let x = 700; x < TERRACE - 100; x += 520 + r() * 260) out.push({ x, h: 120 + r() * 50, gone: r() < 0.6 });
  return out;
})();

// Everything in the Keepers' Gardens behind the slimes
export function drawGardens(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, camX, time);
  ctx.restore();
  const L = camX - 120, R = camX + viewW + 120;
  // the far wall of the roof: a low parapet with a colonnade, the Spire rising far off behind it
  drawSpire(ctx, camX, time);
  drawParapet(ctx, Math.max(0, L), Math.min(TERRACE, R));
  for (const s of statues) if (visible(s.x - 50, s.x + 50, L, R)) drawPlinth(ctx, s);
  drawPaving(ctx, Math.max(0, L), Math.min(GARDENS_W, R));
  for (const b of beds) if (visible(b.x - 20, b.x + b.w + 20, L, R)) drawBed(ctx, b, time);
  if (visible(0, 300, L, R)) drawStairHead(ctx);
  if (visible(TERRACE - 60, GARDENS_W, L, R)) drawTerrace(ctx, time);
  for (const p of GARDENS_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'planter') drawPlanter(ctx, p);
    else if (p.kind === 'pergola') drawPergola(ctx, p, p === GARDENS_PLATFORMS[1]);
    else if (p.kind === 'fountain') drawFountain(ctx, p, time);
    else if (p.kind === 'bench') drawBench(ctx, p);
  }
  if (visible(URN.x - 40, URN.x + URN.w + 40, L, R)) drawUrn(ctx, time);
  // the wind: a few loose dry leaves blowing across, and nothing else moving
  ctx.save();
  ctx.translate(camX, 0);
  const r = mulberry32(8531);
  for (let i = 0; i < 14; i++) {
    const v = 40 + r() * 60, y0 = 120 + r() * 320, ph = r() * TAU;
    const x = ((r() * W * 2 + time * v) % (W + 80)) - 40, y = y0 + Math.sin(time * 1.4 + ph) * 14;
    ctx.fillStyle = 'rgba(170,150,110,0.55)';
    ellipse(ctx, x, y, 3.2, 1.4, time * 3 + ph);
  }
  ctx.restore();
}

function drawSky(ctx, camX, time) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#6eb8f0');
  g.addColorStop(0.55, '#b8e2ff');
  g.addColorStop(0.8, '#e8f6ff');
  g.addColorStop(1, '#fff4e2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const sx = 760, sy = 80; // the sun, high and white
  const sg = ctx.createRadialGradient(sx, sy, 14, sx, sy, 120);
  sg.addColorStop(0, 'rgba(255,250,224,0.7)');
  sg.addColorStop(1, 'rgba(255,250,224,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(sx - 120, sy - 120, 240, 240);
  ctx.fillStyle = '#fffbe8';
  circle(ctx, sx, sy, 28);
  for (const c of clouds) {
    const x = (((c.x - camX * 0.06 + time * c.v) % 1800) + 1800) % 1800 - 300;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 4; i++) ellipse(ctx, x + i * 26 * c.s, c.y - (i % 2) * 8 * c.s, 30 * c.s, 14 * c.s);
  }
  // the archipelago, tiny far below, through the haze
  drawDistantIslands(ctx, { from: 'citadel', scroll: camX, roomW: GARDENS_W, time, horizon: 380, haze: '#e8f6ff', fade: 0.55, scale: 0.42, night: 0 });
  // the cloud sea under the city
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 18; i++) {
    const x = ((i * 70 - camX * 0.12) % (W + 140) + W + 140) % (W + 140) - 70;
    ellipse(ctx, x, 404 + (i % 3) * 6, 56, 20);
  }
}
// The Chrono Spire far off over the roofs, a thin crystal needle, faintly ticking light up it
function drawSpire(ctx, camX, time) {
  const x = 2400 + camX * 0.55, base = GROUND - 30;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#c8b0ff';
  ctx.beginPath();
  ctx.moveTo(x - 26, base);
  ctx.lineTo(x - 8, base - 330);
  ctx.lineTo(x, base - 380);
  ctx.lineTo(x + 8, base - 330);
  ctx.lineTo(x + 26, base);
  ctx.closePath();
  ctx.fill();
  const p = (time * 0.15) % 1;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  circle(ctx, x, base - p * 360, 3);
  ctx.restore();
}
function drawParapet(ctx, L, R) {
  const y = GROUND - 70;
  ctx.fillStyle = STONE_D;
  ctx.fillRect(L, y, R - L, 70);
  ctx.fillStyle = STONE;
  ctx.fillRect(L, y - 10, R - L, 12);
  ctx.fillStyle = 'rgba(180,160,128,0.6)'; // balusters
  const x0 = Math.floor(L / 28) * 28;
  for (let x = x0; x < R; x += 28) {
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 30, 6, 22, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = STONE_E;
  ctx.fillRect(L, y + 54, R - L, 6);
}
// a plinth along the parapet; most have lost their statue (only the feet left), some keep a brass Keeper figure, faceless
function drawPlinth(ctx, s) {
  const y = GROUND - 60;
  ctx.fillStyle = STONE;
  ctx.fillRect(s.x - 26, y - 40, 52, 40);
  ctx.strokeStyle = STONE_E;
  ctx.lineWidth = 2;
  ctx.strokeRect(s.x - 26, y - 40, 52, 40);
  if (s.gone) {
    ctx.fillStyle = 'rgba(138,90,46,0.7)'; // two brass feet, the rest gone
    ellipse(ctx, s.x - 8, y - 44, 7, 4);
    ellipse(ctx, s.x + 8, y - 44, 7, 4);
    return;
  }
  const g = ctx.createLinearGradient(s.x - 20, 0, s.x + 20, 0);
  g.addColorStop(0, BRASS_D);
  g.addColorStop(0.5, BRASS_L);
  g.addColorStop(1, BRASS_E);
  ctx.fillStyle = g; // a robed figure, hood up, hands folded; no face
  ctx.beginPath();
  ctx.moveTo(s.x - 18, y - 40);
  ctx.quadraticCurveTo(s.x - 20, y - s.h * 0.6, s.x - 10, y - s.h * 0.85);
  ctx.quadraticCurveTo(s.x, y - s.h - 8, s.x + 10, y - s.h * 0.85);
  ctx.quadraticCurveTo(s.x + 20, y - s.h * 0.6, s.x + 18, y - 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(95,174,158,0.5)'; // verdigris running down it
  ctx.fillRect(s.x - 4, y - s.h * 0.8, 3, s.h * 0.5);
  ctx.fillStyle = 'rgba(40,30,50,0.4)';
  ellipse(ctx, s.x, y - s.h * 0.8, 6, 8);
}
function drawPaving(ctx, L, R) {
  const y = GROUND;
  ctx.fillStyle = STONE;
  ctx.fillRect(L, y, R - L, H - y);
  ctx.fillStyle = STONE_D;
  ctx.fillRect(L, y + 36, R - L, H - y);
  ctx.strokeStyle = STONE_E;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(L, y + 1);
  ctx.lineTo(R, y + 1);
  const x0 = Math.floor(L / 72) * 72;
  for (let x = x0; x < R; x += 72) {
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x, y + 36);
    ctx.moveTo(x + 36, y + 36);
    ctx.lineTo(x + 36, y + 80);
  }
  ctx.moveTo(L, y + 36);
  ctx.lineTo(R, y + 36);
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,140,110,0.35)'; // dry moss in the joints, long dead
  for (let x = x0; x < R; x += 144) ellipse(ctx, x + 12, y + 4, 10, 2);
}
// a dead bed along the path: grey soil in a brass-edged box, a few dry stalks, a little brass label with no name on it
function drawBed(ctx, b, time) {
  const y = GROUND;
  ctx.fillStyle = SOIL_D;
  ctx.fillRect(b.x, y - 16, b.w, 16);
  ctx.fillStyle = SOIL;
  ctx.fillRect(b.x, y - 18, b.w, 5);
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(b.x - 2, y - 20, b.w + 4, 3);
  ctx.strokeStyle = 'rgba(150,130,100,0.9)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (const s of b.stalks) {
    const x = b.x + 8 + s.dx * (b.w - 16), sway = Math.sin(time * 1.2 + s.dx * 9) * 1.5;
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x + Math.sin(s.a) * s.h + sway, y - 18 - Math.cos(s.a) * s.h);
  }
  ctx.stroke();
  ctx.fillStyle = BRASS; // the label, blank
  ctx.fillRect(b.x + b.w * 0.5 - 7, y - 30, 14, 8);
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(b.x + b.w * 0.5 - 1, y - 22, 2, 6);
}
// the top of the brass stair from the Bastion: a brass hand-rail curling down out of sight at the west end
function drawStairHead(ctx) {
  const y = GROUND;
  ctx.fillStyle = 'rgba(60,40,30,0.25)';
  ctx.fillRect(20, y + 2, 110, 60);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(140, y - 50);
  ctx.quadraticCurveTo(80, y - 52, 40, y - 10);
  ctx.quadraticCurveTo(28, y + 6, 30, y + 30);
  ctx.stroke();
  ctx.strokeStyle = BRASS_L;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  for (let i = 0; i < 4; i++) { // the balusters
    const x = 130 - i * 26;
    ctx.strokeStyle = BRASS_D;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y - 48 + i * 8);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.fillStyle = BRASS; // a finial
  circle(ctx, 140, y - 54, 5);
}
// a raised planter (a platform): a stone box with a brass rim, grey soil, a watering-can rose stuck in it
function drawPlanter(ctx, p) {
  const y = p.y;
  ctx.fillStyle = STONE_D;
  ctx.fillRect(p.x + 8, y + 10, p.w - 16, GROUND - y - 10);
  ctx.strokeStyle = STONE_E;
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x + 8, y + 10, p.w - 16, GROUND - y - 10);
  ctx.fillStyle = BRASS;
  ctx.fillRect(p.x, y, p.w, 10);
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(p.x, y + 8, p.w, 2);
  ctx.fillStyle = SOIL;
  ctx.fillRect(p.x + 6, y - 3, p.w - 12, 4);
}
// a pergola (a platform): stone posts and a brass lattice top with nothing climbing it; the first one is broken at one end
// (its top end is where the urn sits)
function drawPergola(ctx, p, broken) {
  const y = p.y;
  ctx.fillStyle = STONE;
  for (const px of [p.x + 10, p.x + p.w - 22]) {
    ctx.fillRect(px, y + 6, 12, GROUND - y - 6);
    ctx.fillStyle = STONE_E;
    ctx.fillRect(px, GROUND - 10, 12, 10);
    ctx.fillStyle = STONE;
  }
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(p.x, y, p.w, 8);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = p.x + 8; x < p.x + p.w; x += 16) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8, y - 10);
    ctx.lineTo(x + 16, y);
  }
  ctx.stroke();
  if (broken) {
    // a post standing up past the top, its capital tilted: the urn sits on top of it
    ctx.fillStyle = STONE;
    ctx.fillRect(URN.x + URN.w / 2 - 8, URN.y + 10, 16, y - URN.y - 10);
    ctx.strokeStyle = STONE_E;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(URN.x + URN.w / 2 - 8, URN.y + 10, 16, y - URN.y - 10);
    ctx.fillStyle = STONE_D;
    ctx.fillRect(URN.x, URN.y, URN.w, 10);
  }
}
// the dry fountain (a platform: its rim): a stone basin, cracked, a brass spout in the middle still turning slowly, no water
function drawFountain(ctx, p, time) {
  const y = p.y, cx = p.x + p.w / 2;
  ctx.fillStyle = STONE_D;
  ctx.beginPath();
  ctx.moveTo(p.x, y);
  ctx.lineTo(p.x + 18, GROUND);
  ctx.lineTo(p.x + p.w - 18, GROUND);
  ctx.lineTo(p.x + p.w, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = STONE_E;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = STONE;
  ctx.fillRect(p.x - 4, y - 4, p.w + 8, 10);
  ctx.strokeStyle = 'rgba(120,100,80,0.6)'; // the crack
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(p.x + p.w * 0.3, y + 6);
  ctx.lineTo(p.x + p.w * 0.34, y + 40);
  ctx.lineTo(p.x + p.w * 0.3, y + 70);
  ctx.stroke();
  // the spout on its column
  ctx.fillStyle = STONE;
  ctx.fillRect(cx - 9, y - 70, 18, 66);
  const a = time * 0.5;
  ctx.save();
  ctx.translate(cx, y - 82);
  ctx.rotate(a);
  ctx.fillStyle = BRASS;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(TAU / 4);
    ctx.beginPath();
    ctx.ellipse(10, 0, 10, 3.5, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = BRASS_D;
  circle(ctx, cx, y - 82, 5);
  ctx.fillStyle = 'rgba(160,140,110,0.5)'; // a rim of old lime where the water stood
  ctx.fillRect(p.x + 4, y + 10, p.w - 8, 3);
}
// the Wind Terrace: the roof stops at a balustrade over the drop, the city's edge; the parapet gives way to open sky
function drawTerrace(ctx, time) {
  const y = GROUND;
  ctx.fillStyle = STONE;
  ctx.fillRect(TERRACE - 30, y - 74, 30, 74); // the parapet's last pier
  ctx.strokeStyle = STONE_E;
  ctx.lineWidth = 2;
  ctx.strokeRect(TERRACE - 30, y - 74, 30, 74);
  // the balustrade at the far end, over nothing
  const x0 = GARDENS_W - 140;
  ctx.fillStyle = STONE_D;
  ctx.fillRect(x0, y - 46, 140, 46);
  ctx.fillStyle = STONE;
  ctx.fillRect(x0 - 6, y - 52, 146, 8);
  ctx.fillStyle = 'rgba(180,160,128,0.6)';
  for (let x = x0 + 8; x < GARDENS_W; x += 22) {
    ctx.beginPath();
    ctx.ellipse(x, y - 24, 5, 16, 0, 0, TAU);
    ctx.fill();
  }
  // a brass telescope on a stand, pointing down at the islands, its cap left off
  const tx = TERRACE + 170;
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tx, y);
  ctx.lineTo(tx - 12, y - 4);
  ctx.moveTo(tx, y);
  ctx.lineTo(tx + 12, y - 4);
  ctx.moveTo(tx, y);
  ctx.lineTo(tx, y - 58);
  ctx.stroke();
  ctx.save();
  ctx.translate(tx, y - 62);
  ctx.rotate(0.35 + Math.sin(time * 0.2) * 0.02);
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.roundRect(-26, -6, 52, 12, 5);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = BRASS_L;
  ctx.fillRect(18, -7, 8, 14);
  ctx.restore();
}
function drawBench(ctx, p) {
  const y = p.y;
  ctx.fillStyle = STONE;
  ctx.fillRect(p.x, y, p.w, 12);
  ctx.strokeStyle = STONE_E;
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x, y, p.w, 12);
  for (const lx of [p.x + 14, p.x + p.w - 34]) {
    ctx.fillStyle = STONE_D;
    ctx.fillRect(lx, y + 12, 20, GROUND - y - 12);
  }
  ctx.fillStyle = 'rgba(120,100,80,0.4)'; // worn smooth where people sat
  ellipse(ctx, p.x + p.w * 0.35, y + 2, 22, 2);
  ellipse(ctx, p.x + p.w * 0.68, y + 2, 22, 2);
}
// the find: a cracked stone urn on the broken pergola's post, and in it a sapling, small and green, the only living thing
// in the gardens; its leaves are shaped like the apple tree's in Slimeville, and nothing here says so
function drawUrn(ctx, time) {
  const cx = URN.x + URN.w / 2, y = URN.y;
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.moveTo(cx - 20, y);
  ctx.quadraticCurveTo(cx - 28, y - 22, cx - 18, y - 34);
  ctx.lineTo(cx + 18, y - 34);
  ctx.quadraticCurveTo(cx + 28, y - 22, cx + 20, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = STONE_E;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(110,90,70,0.8)'; // the crack
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx + 6, y - 34);
  ctx.lineTo(cx + 2, y - 22);
  ctx.lineTo(cx + 8, y - 12);
  ctx.lineTo(cx + 4, y);
  ctx.stroke();
  ctx.fillStyle = SOIL_D;
  ellipse(ctx, cx, y - 34, 17, 3.5);
  // the sapling
  const sway = Math.sin(time * 1.1) * 0.06;
  ctx.save();
  ctx.translate(cx, y - 35);
  ctx.rotate(sway);
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-2, -12, 1, -26);
  ctx.moveTo(0, -14);
  ctx.lineTo(7, -20);
  ctx.stroke();
  const leaf = (x, y2, a, s) => {
    ctx.save();
    ctx.translate(x, y2);
    ctx.rotate(a);
    ctx.fillStyle = '#8fd07a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(5 * s, -4 * s, 10 * s, 0);
    ctx.quadraticCurveTo(5 * s, 4 * s, 0, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,130,60,0.7)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(9 * s, 0);
    ctx.stroke();
    ctx.restore();
  };
  leaf(1, -26, -1.4, 1);
  leaf(1, -24, -0.4, 0.9);
  leaf(1, -24, -2.5, 0.9);
  leaf(7, -20, -0.2, 0.8);
  leaf(-1, -10, 3.4, 0.8);
  ctx.restore();
  // a faint green light about it, the only colour like it up here
  const g = ctx.createRadialGradient(cx, y - 50, 2, cx, y - 50, 36);
  g.addColorStop(0, `rgba(170,240,150,${0.18 + 0.06 * Math.sin(time * 0.8)})`);
  g.addColorStop(1, 'rgba(170,240,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - 36, y - 86, 72, 72);
}
