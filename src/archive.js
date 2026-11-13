// Docs: docs/places/archive.md
// The Archive (room ARCHIVE, src/shared/rpg.js; the Citadel's depth pass, C2): the Keepers' records, down the stair off
// Cogwork Bastion. Shelving out of sight in every direction: tall stacks of bound volumes rising into the dark with no roof
// to be seen, rolling ladders, reading galleries on brass brackets; and loose pages drifting UPWARD out of the stacks,
// slowly, all the time (time is wrong here too). West to east: the Reading Room (no mobs: the waystone, Folio's issue desk,
// reading tables under green lamps), the Stacks, the Long Shelves and the Index Hall, where the great card catalogue stands
// to the roof, drawer over drawer, and the way down to the Indexer opens between two of its cabinets (its way in is drawn
// by src/dens-archive.js). The ledger on top of the tallest stack (last in ARCHIVE_PLATFORMS) is the find: a ledger of
// Keepers with every name scratched out but one.
// freed (the slime drawing has freed the Indexer: docs/social/story.md): the pages have come down; they lie still on the
// floor and along the shelves, and nothing drifts.
import { H, W, TAU, mulberry32, circle, ellipse } from './util.js';
import { ARCHIVE_W, FIELD_GROUND, ARCHIVE_PLATFORMS, ARCHIVE_ZONES, ARCHIVE_EXIT_X, FOLIO_X } from './shared/rpg.js';
import { drawPage } from './archive-art.js';

const GROUND = FIELD_GROUND;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
const BRASS = '#f0c470', BRASS_L = '#fde3a0', BRASS_D = '#c8904a', BRASS_E = '#8a5a2e';
const OAK = '#6a4a32', OAK_D = '#3e2a1e', OAK_L = '#8a6448', PAPER = '#efe4c8';
const SPINES = ['#6a2e26', '#2e4a3a', '#3a3456', '#5a4a2a', '#7a5a3a', '#4a2a3a', '#2a3a4a', '#6a5a4a'];
const LEDGER = ARCHIVE_PLATFORMS.find((p) => p.kind === 'ledger');
const HALL = ARCHIVE_ZONES[3].x0;
const READING = ARCHIVE_ZONES[0].x1;

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

// the far stacks (screen-space parallax): rows of shelving fading up into the dark
const farStacks = (() => {
  const r = mulberry32(8801);
  return Array.from({ length: 16 }, (_, i) => ({ x: i * 110 + r() * 40, w: 60 + r() * 40, top: 40 + r() * 120, k: r() }));
})();
// the pages drifting up (screen-space, two depths)
const drift = (() => {
  const r = mulberry32(8811);
  return Array.from({ length: 28 }, () => ({ x: r() * W, ph: r(), v: 0.03 + r() * 0.04, s: 3 + r() * 4, p: r() * TAU, d: r() < 0.5 ? 0.35 : 0.7 }));
})();
// where the pages lie once they've come down (world-space, freed)
const fallen = (() => {
  const r = mulberry32(8821);
  return Array.from({ length: 120 }, () => ({ x: r() * ARCHIVE_W, y: GROUND + 2 + r() * 14, a: r() * TAU, s: 4 + r() * 3 }));
})();

// Everything in the Archive behind the slimes
export function drawArchive(ctx, camX, viewW, time, freed = false) {
  ctx.save();
  ctx.translate(camX, 0);
  drawDepths(ctx, camX, time, freed);
  ctx.restore();
  const L = camX - 120, R = camX + viewW + 120;
  drawBackShelves(ctx, L, R);
  drawFloor(ctx, L, R, freed);
  if (visible(0, READING + 40, L, R)) drawReadingRoom(ctx, time);
  if (visible(HALL - 100, ARCHIVE_W, L, R)) drawCatalogue(ctx, L, R, time);
  for (const p of ARCHIVE_PLATFORMS) {
    if (!visible(p.x - 80, p.x + p.w + 80, L, R)) continue;
    if (p.kind === 'stack') drawStack(ctx, p);
    else if (p.kind === 'gallery') drawGallery(ctx, p);
    else if (p.kind === 'cabinet') drawCabinet(ctx, p);
  }
  if (LEDGER && visible(LEDGER.x - 40, LEDGER.x + LEDGER.w + 40, L, R)) drawLedger(ctx, LEDGER, time);
  // freed: the pages that drifted are down, lying still where they fell
  if (freed) {
    for (const f of fallen) {
      if (!visible(f.x - 10, f.x + 10, L, R)) continue;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(1, 0.35);
      ctx.rotate(f.a);
      ctx.fillStyle = 'rgba(239,228,200,0.85)';
      ctx.fillRect(-f.s, -f.s * 0.7, f.s * 2, f.s * 1.4);
      ctx.restore();
    }
  }
}

// Far behind: the dark the stacks rise into (no roof to be seen), rows of far shelving, a warm haze at floor level, and the
// loose pages drifting up past them (freed: none)
function drawDepths(ctx, camX, time, freed) {
  ctx.fillStyle = vgrad(ctx, 'ar-sky', 0, H, [[0, '#0e0a0e'], [0.45, '#1e1618'], [0.8, '#3a2a24'], [1, '#4a3628']]);
  ctx.fillRect(0, 0, W, H);
  for (const layer of [0.12, 0.24]) {
    const shade = layer < 0.2 ? 'rgba(58,40,30,0.55)' : 'rgba(78,56,40,0.7)';
    for (const s of farStacks) {
      const x = ((s.x - camX * layer) % 1760 + 1760) % 1760 - 200;
      if (x < -120 || x > W + 40) continue;
      const top = s.top + (layer < 0.2 ? 40 : 0), w = s.w * (layer < 0.2 ? 0.8 : 1);
      ctx.fillStyle = shade;
      ctx.fillRect(x, top, w, H - top);
      ctx.fillStyle = layer < 0.2 ? 'rgba(120,90,60,0.12)' : 'rgba(150,110,70,0.16)'; // the shelf lines
      for (let y = top + 16; y < H; y += 22) ctx.fillRect(x, y, w, 2);
    }
  }
  // the haze low down, lamplight on dust
  ctx.fillStyle = vgrad(ctx, 'ar-haze', 200, 400, [[0, 'rgba(90,64,44,0)'], [1, 'rgba(120,88,58,0.55)']]);
  ctx.fillRect(0, 200, W, 200);
  if (freed) return;
  for (const d of drift) { // pages drifting UP
    const k = (time * d.v + d.ph) % 1;
    const y = H - k * (H + 60), x = ((d.x - camX * d.d * 0.3 + Math.sin(time * 0.6 + d.p) * 20) % W + W) % W;
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 4) * Math.min(1, (1 - k) * 3) * (d.d < 0.5 ? 0.45 : 0.75);
    drawPage(ctx, x, y, d.s, time * 1.4 + d.p);
    ctx.restore();
  }
}

// The back wall: shelving floor to the dark, volume after volume, a brass number plate on each bay
function drawBackShelves(ctx, L, R) {
  const top = GROUND - 300;
  ctx.fillStyle = vgrad(ctx, 'ar-wall', top - 80, GROUND, [[0, 'rgba(46,32,24,0)'], [0.2, '#2e2018'], [1, '#3e2a1e']]);
  ctx.fillRect(L, top - 80, R - L, GROUND - top + 80);
  const BAY = 160;
  for (let bx = Math.floor(L / BAY) * BAY; bx < R; bx += BAY) {
    if (bx < 0 || bx >= ARCHIVE_W) continue;
    const r = mulberry32(8830 + bx);
    for (let y = top; y < GROUND - 20; y += 40) { // the volumes on each shelf
      let x = bx + 8;
      while (x < bx + BAY - 14) {
        const w = 6 + r() * 7, hh = 26 + r() * 10;
        ctx.fillStyle = SPINES[Math.floor(r() * SPINES.length)];
        ctx.globalAlpha = 0.55 + r() * 0.25;
        ctx.fillRect(x, y + 36 - hh, w, hh);
        x += w + 1;
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = OAK_D; // the shelf board
      ctx.fillRect(bx, y + 36, BAY, 4);
    }
    ctx.fillStyle = OAK; // the uprights
    ctx.fillRect(bx, top - 80, 8, GROUND - top + 80);
    ctx.fillStyle = BRASS_D; // the bay's number plate (its number filed off)
    ctx.fillRect(bx + BAY / 2 - 9, top - 6, 18, 9);
  }
}

// The floor: old oak boards, a worn runner down the middle
function drawFloor(ctx, L, R) {
  ctx.fillStyle = vgrad(ctx, 'ar-floor', GROUND, H, [[0, '#5a3e2a'], [0.5, '#3e2a1e'], [1, '#2a1c14']]);
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = OAK_D;
  ctx.fillRect(L, GROUND - 2, R - L, 4);
  ctx.strokeStyle = 'rgba(30,20,14,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = GROUND + 18; y < H; y += 18) {
    ctx.moveTo(L, y);
    ctx.lineTo(R, y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(110,40,36,0.45)'; // the runner
  ctx.fillRect(L, GROUND + 22, R - L, 30);
  ctx.fillStyle = 'rgba(240,196,112,0.25)';
  ctx.fillRect(L, GROUND + 24, R - L, 2);
  ctx.fillRect(L, GROUND + 48, R - L, 2);
}

// The Reading Room: the stair up to the Bastion, reading tables under green-shaded lamps, Folio's issue desk
function drawReadingRoom(ctx, time) {
  const b = GROUND;
  // the stair going up, the Bastion's brass light at its top
  const sx = ARCHIVE_EXIT_X;
  ctx.fillStyle = 'rgba(255,226,160,0.12)';
  ctx.beginPath();
  ctx.moveTo(sx - 50, b);
  ctx.lineTo(sx - 20, b - 260);
  ctx.lineTo(sx + 50, b - 260);
  ctx.lineTo(sx + 70, b);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = OAK;
  for (let i = 0; i < 9; i++) ctx.fillRect(sx - 40 + i * 4, b - 12 - i * 26, 80 - i * 4, 8);
  ctx.strokeStyle = BRASS_D;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx + 44, b - 40);
  ctx.lineTo(sx + 20, b - 250);
  ctx.stroke();
  // reading tables, a lamp on each
  for (const tx of [330, 600]) {
    ctx.fillStyle = OAK;
    ctx.fillRect(tx - 60, b - 40, 120, 8);
    ctx.fillStyle = OAK_D;
    ctx.fillRect(tx - 54, b - 32, 6, 32);
    ctx.fillRect(tx + 48, b - 32, 6, 32);
    ctx.fillStyle = PAPER; // an open book left on it
    ctx.beginPath();
    ctx.moveTo(tx - 30, b - 41);
    ctx.lineTo(tx - 2, b - 44);
    ctx.lineTo(tx + 26, b - 41);
    ctx.lineTo(tx - 2, b - 39);
    ctx.closePath();
    ctx.fill();
    lamp(ctx, tx + 34, b - 40, time);
  }
  // Folio's issue desk: a counter of oak with a brass rail, a brass bell, card trays and a sign
  const dx = FOLIO_X;
  ctx.fillStyle = OAK_L;
  ctx.fillRect(dx - 70, b - 54, 140, 10);
  ctx.fillStyle = OAK;
  ctx.fillRect(dx - 64, b - 44, 128, 44);
  ctx.strokeStyle = OAK_D;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) ctx.strokeRect(dx - 58 + i * 30, b - 38, 24, 30);
  ctx.fillStyle = BRASS_D;
  for (let i = 0; i < 4; i++) circle(ctx, dx - 46 + i * 30, b - 23, 2);
  ctx.fillStyle = BRASS;
  ctx.fillRect(dx - 70, b - 56, 140, 3);
  ctx.beginPath(); // the bell
  ctx.arc(dx + 52, b - 56, 6, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(dx + 51, b - 64, 2, 3);
  ctx.fillStyle = PAPER; // a tray of cards
  ctx.fillRect(dx - 58, b - 62, 22, 7);
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(dx - 60, b - 57, 26, 3);
  ctx.fillStyle = OAK_D; // the sign on its stand over the desk
  ctx.fillRect(dx - 2, b - 132, 4, 70);
  ctx.fillStyle = BRASS_D;
  ctx.beginPath();
  ctx.roundRect(dx - 62, b - 150, 124, 26, 5);
  ctx.fill();
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = "700 11px Fredoka, 'Trebuchet MS', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2a1e14';
  ctx.fillText('ISSUES  ·  RETURNS', dx, b - 136);
}

function lamp(ctx, x, y, time) {
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(x - 1.5, y - 22, 3, 22);
  const k = 0.85 + 0.15 * Math.sin(time * 2.1 + x);
  const g = ctx.createRadialGradient(x, y - 18, 2, x, y - 10, 60);
  g.addColorStop(0, `rgba(255,230,170,${0.35 * k})`);
  g.addColorStop(1, 'rgba(255,230,170,0)');
  ctx.fillStyle = g;
  circle(ctx, x, y - 10, 60);
  ctx.fillStyle = '#3a7a5a'; // the green shade
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 18);
  ctx.quadraticCurveTo(x, y - 30, x + 12, y - 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255,240,200,${0.9 * k})`;
  ellipse(ctx, x, y - 17, 9, 2);
}

// The Index Hall: the great card catalogue on the back wall, drawer over drawer up into the dark, each with a brass label
// frame; a rolling ladder on its rail
function drawCatalogue(ctx, L, R, time) {
  const x0 = HALL + 40, x1 = ARCHIVE_W - 20, top = GROUND - 330;
  const a = Math.max(x0, L), bnd = Math.min(x1, R);
  if (bnd <= a) return;
  ctx.fillStyle = OAK;
  ctx.fillRect(a, top, bnd - a, GROUND - top);
  const DW = 34, DH = 22;
  for (let y = top + 6; y < GROUND - 10; y += DH + 4) {
    for (let x = x0 + 6 + Math.floor((a - x0) / (DW + 4)) * (DW + 4); x < bnd; x += DW + 4) {
      ctx.fillStyle = OAK_L;
      ctx.fillRect(x, y, DW, DH);
      ctx.fillStyle = BRASS_D;
      ctx.fillRect(x + 9, y + 4, 16, 7);
      ctx.fillStyle = 'rgba(239,228,200,0.8)';
      ctx.fillRect(x + 10, y + 5, 14, 5);
      ctx.fillStyle = BRASS_E;
      circle(ctx, x + DW / 2, y + 16, 1.8);
    }
  }
  ctx.fillStyle = vgrad(ctx, 'ar-catfade', top - 10, top + 120, [[0, 'rgba(14,10,14,1)'], [1, 'rgba(14,10,14,0)']]);
  ctx.fillRect(a, top - 10, bnd - a, 130);
  // the ladder's rail, and the ladder on it
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(a, top + 60, bnd - a, 4);
  const lx = HALL + 500;
  if (visible(lx - 40, lx + 40, L, R)) {
    ctx.strokeStyle = OAK_D;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lx - 14, top + 62);
    ctx.lineTo(lx - 30, GROUND);
    ctx.moveTo(lx + 14, top + 62);
    ctx.lineTo(lx - 2, GROUND);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 1; i < 12; i++) {
      const k = i / 12, y = top + 62 + k * (GROUND - top - 62);
      ctx.moveTo(lx - 14 - k * 16, y);
      ctx.lineTo(lx + 14 - k * 16, y);
    }
    ctx.stroke();
  }
}

// A stack: a free-standing bookcase, its top the platform: shelves of volumes, a brass number plate, a little ladder hook
function drawStack(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = OAK_D;
  ctx.fillRect(x, y, w, GROUND - y);
  const r = mulberry32(8850 + x);
  for (let sy = y + 8; sy < GROUND - 16; sy += 34) {
    let bx = x + 6;
    while (bx < x + w - 10) {
      const bw = 6 + r() * 7, bh = 22 + r() * 8;
      ctx.fillStyle = SPINES[Math.floor(r() * SPINES.length)];
      ctx.fillRect(bx, sy + 30 - bh, bw, bh);
      ctx.fillStyle = 'rgba(240,196,112,0.35)';
      ctx.fillRect(bx + 1, sy + 34 - bh, bw - 2, 1.5);
      bx += bw + 1;
      if (r() < 0.06) bx += 8; // a gap where a volume is out
    }
    ctx.fillStyle = OAK;
    ctx.fillRect(x, sy + 30, w, 4);
  }
  ctx.fillStyle = OAK_L; // its top, the walkable board
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, 10, 3);
  ctx.fill();
  ctx.strokeStyle = OAK_D;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = BRASS_D;
  ctx.fillRect(x + w / 2 - 10, y + 8, 20, 8);
}

// A reading gallery: an oak walkway on curled brass brackets, a brass rail, a rolling ladder leaning on it
function drawGallery(ctx, p) {
  const { x, y, w } = p;
  ctx.strokeStyle = BRASS_E;
  ctx.lineWidth = 3;
  for (const bx of [x + 20, x + w - 20]) {
    ctx.beginPath();
    ctx.moveTo(bx, y + 6);
    ctx.quadraticCurveTo(bx, y + 40, bx + (bx < x + w / 2 ? -18 : 18), y + 50);
    ctx.stroke();
  }
  ctx.fillStyle = OAK;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 10, 3);
  ctx.fill();
  ctx.fillStyle = OAK_L;
  ctx.fillRect(x, y - 4, w, 2);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 30);
  ctx.lineTo(x + w - 4, y - 30);
  for (let rx = x + 6; rx < x + w; rx += 24) {
    ctx.moveTo(rx, y - 30);
    ctx.lineTo(rx, y - 4);
  }
  ctx.stroke();
  ctx.strokeStyle = OAK_D; // the ladder leaning up to it
  ctx.lineWidth = 3;
  const lx = x + w - 30;
  ctx.beginPath();
  ctx.moveTo(lx, y);
  ctx.lineTo(lx + 30, GROUND);
  ctx.moveTo(lx + 18, y);
  ctx.lineTo(lx + 48, GROUND);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 1; i < 7; i++) {
    const k = i / 7, yy = y + k * (GROUND - y);
    ctx.moveTo(lx + k * 30, yy);
    ctx.lineTo(lx + 18 + k * 30, yy);
  }
  ctx.stroke();
}

// A catalogue cabinet: a squat block of little drawers, its top the platform
function drawCabinet(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = OAK;
  ctx.fillRect(x, y, w, GROUND - y);
  for (let dy = y + 10; dy < GROUND - 16; dy += 24) {
    for (let dx = x + 6; dx < x + w - 30; dx += 34) {
      ctx.fillStyle = OAK_L;
      ctx.fillRect(dx, dy, 30, 20);
      ctx.fillStyle = BRASS_D;
      ctx.fillRect(dx + 8, dy + 4, 14, 6);
      ctx.fillStyle = BRASS_E;
      circle(ctx, dx + 15, dy + 15, 1.6);
    }
  }
  ctx.fillStyle = OAK_L;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, 10, 3);
  ctx.fill();
  ctx.strokeStyle = OAK_D;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// The find: on the top of the tallest stack, a heavy ledger lying open on a brass stand, a column of names in a neat hand,
// every one scratched out hard but one. Nothing says so. (Tier 4, shown: the other names stay unreadable)
function drawLedger(ctx, p, time) {
  const { x, y, w } = p, cx = x + w / 2;
  // the tall narrow stack it sits on, standing on the gallery
  ctx.fillStyle = OAK_D;
  ctx.fillRect(x + 8, y, w - 16, 84);
  const r = mulberry32(8861);
  for (let sy = y + 8; sy < y + 80; sy += 26) {
    let bx = x + 12;
    while (bx < x + w - 14) {
      const bw = 5 + r() * 6;
      ctx.fillStyle = SPINES[Math.floor(r() * SPINES.length)];
      ctx.fillRect(bx, sy, bw, 20);
      bx += bw + 1;
    }
    ctx.fillStyle = OAK;
    ctx.fillRect(x + 8, sy + 20, w - 16, 3);
  }
  ctx.fillStyle = OAK_L;
  ctx.beginPath();
  ctx.roundRect(x, y - 4, w, 9, 3);
  ctx.fill();
  // the stand and the ledger open on it
  ctx.fillStyle = BRASS_E;
  ctx.fillRect(cx - 2, y - 14, 4, 10);
  ctx.fillStyle = '#5a2e26';
  ctx.beginPath();
  ctx.moveTo(cx - 34, y - 14);
  ctx.lineTo(cx, y - 18);
  ctx.lineTo(cx + 34, y - 14);
  ctx.lineTo(cx + 34, y - 11);
  ctx.lineTo(cx - 34, y - 11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.moveTo(cx - 31, y - 15);
  ctx.lineTo(cx, y - 20);
  ctx.lineTo(cx + 31, y - 15);
  ctx.lineTo(cx + 31, y - 30);
  ctx.lineTo(cx, y - 34);
  ctx.lineTo(cx - 31, y - 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(110,84,60,0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx, y - 20);
  ctx.lineTo(cx, y - 34);
  ctx.stroke();
  // the names: struck through hard, line after line, but one
  ctx.strokeStyle = 'rgba(30,24,40,0.85)';
  ctx.lineWidth = 1.6;
  const rows = [[-28, -31], [-28, -27.5], [-28, -24], [-28, -20.5], [3, -31], [3, -27.5], [3, -20.5]];
  for (const [ox, oy] of rows) {
    ctx.beginPath();
    ctx.moveTo(cx + ox, y + oy);
    for (let k = 0; k < 6; k++) ctx.lineTo(cx + ox + 4 + k * 4, y + oy + (k % 2 ? -1.2 : 1.2));
    ctx.stroke();
  }
  ctx.font = "600 5px Fredoka, 'Trebuchet MS', sans-serif";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(40,30,50,0.9)';
  ctx.fillText('Pell', cx + 4, y - 24);
  // a faint light over it, so it can be found
  ctx.fillStyle = `rgba(255,230,170,${0.07 + 0.04 * Math.sin(time * 1.2)})`;
  ellipse(ctx, cx, y - 26, w * 0.6, 22);
}
